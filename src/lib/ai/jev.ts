import 'server-only'
import {
  APIConnectionError,
  TypeSafeClient,
  type Question,
  type Questions,
  type SystemOneRequest,
  type SystemOneResult,
} from '@typesafe-ai/sdk'
import { isFreeModel, JUDGE_MODEL } from './models'

// Jev(TypeSafe) 서버 전용 클라이언트 (cloude 브랜치 · AI 연동 2단계)
//
// Jev란?
// - 글을 만드는 LLM이 아니라 '판단 전용' 모델이다. 미리 정한 답 중 하나와 확신도(confidence)를 돌려준다.
// - 질문 형식 3가지: choice(보기 중 하나), score(점수), noul(예/아니오 확률)
// - 코드는 Claude·Gemini·Qwen이 쓰고, Jev는 '어디로 보낼지, 얼마나 확실한지'를 판단한다. (docs 아키텍처 참고)
//
// 왜 '서버 전용'인가?
// - API 키로 요금이 청구된다. 브라우저 코드에 들어가면 누구나 개발자 도구로 키를 꺼내 쓸 수 있다.
// - import 'server-only': 이 파일을 'use client' 컴포넌트에서 import하면 빌드가 실패한다. → 실수로 키가 새는 것을 막는다.
// - 그래서 Route Handler, Server Action, 서버 컴포넌트에서만 부른다.
//
// OpenRouter 경유
// - OpenRouter 키 하나로 Jev·Gemini·Qwen을 모두 쓰려고 TypeSafe 대신 OpenRouter 주소로 보낸다.
// - SDK는 baseURL 뒤에 '/v1/systemone'을 붙인다 → https://openrouter.ai/api/v1/systemone
//
// 가짜 응답(mock)으로 동작하는 경우 — 개발을 멈추지 않기 위해
// - 키가 없을 때(no-key), AI_MOCK=1일 때(forced), 네트워크가 막혔을 때(network, 예: 회사 SSL 검사)
// - 가짜 응답은 모든 답의 확신도가 0이다 → 부르는 쪽의 확신도 규칙(0.6 미만은 자동 처리 안 함)에 걸려
//   '판단 불가'로 안전하게 처리된다. 가짜 응답이 실제 판단처럼 쓰이는 일이 없다.

/** OpenRouter에서 쓰는 Jev 모델 ID (models.ts에서 관리. 최신 별칭은 '~typesafe/jev-latest') */
export const JEV_MODEL = JUDGE_MODEL.id
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api'

/**
 * 확신도 문턱 (TypeSafe 문서 'confidence-gated routing' 권장값)
 * - AUTO 이상: 자동 처리 / CONFIRM 이상: 사용자 확인 / 그 아래: 사람 또는 LLM에게 넘김
 */
export const CONFIDENCE = { AUTO: 0.85, CONFIRM: 0.6 } as const

/** 답이 어디서 왔는지 */
export type JevSource = 'jev' | 'mock'
/** 가짜 응답을 쓴 이유 */
// paid: 무료 모델만 쓰기로 해서 유료인 Jev를 부르지 않음 (models.ts)
export type MockReason = 'no-key' | 'forced' | 'paid' | 'network' | 'error'

export interface JevOutcome<Q extends Questions> {
  source: JevSource
  /** source가 'mock'일 때 그 이유 */
  reason?: MockReason
  answers: SystemOneResult<Q>['answers']
  model: string
}

// 모듈 안에 하나만 만들어 재사용한다 (요청마다 새로 만들 필요 없음)
let client: TypeSafeClient | null = null

function getClient(apiKey: string) {
  client ??= new TypeSafeClient({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultModel: JEV_MODEL,
    // 검색처럼 사용자가 기다리는 곳에서 쓰므로 짧게. 늦으면 가짜 응답(판단 불가)으로 넘어간다
    timeout: 5000,
    retry: { maxRetries: 1 },
  })
  return client
}

/** 지금 설정이면 실제 API를 부르는지, 가짜 응답을 쓰는지 */
export function getJevMode(): { source: JevSource; reason?: MockReason } {
  // 무료가 아니면 키가 있어도 절대 부르지 않는다 (요금 방지)
  if (!isFreeModel(JEV_MODEL)) return { source: 'mock', reason: 'paid' }
  if (process.env.AI_MOCK === '1') return { source: 'mock', reason: 'forced' }
  if (!process.env.OPENROUTER_API_KEY) return { source: 'mock', reason: 'no-key' }
  return { source: 'jev' }
}

// 질문 하나에 대한 '판단 불가' 가짜 답 (확신도 0, 확률은 모두 같게)
function mockAnswer(question: Question) {
  switch (question.type) {
    case 'noul':
      return { type: 'noul', noul: 0.5 }
    case 'choice': {
      const labels = Object.keys(question.criteria)
      const even = 1 / labels.length
      return {
        type: 'choice',
        choice: labels[0],
        confidence: 0,
        probabilities: Object.fromEntries(labels.map((label) => [label, even])),
      }
    }
    case 'score': {
      const levels = question.criteria.map((_, index) => String(index))
      const even = 1 / levels.length
      return {
        type: 'score',
        score: 0,
        confidence: 0,
        legend: Object.fromEntries(question.criteria.map((description, index) => [String(index), description])),
        probabilities: Object.fromEntries(levels.map((level) => [level, even])),
      }
    }
  }
}

function mockOutcome<Q extends Questions>(questions: Q, reason: MockReason): JevOutcome<Q> {
  const answers = Object.fromEntries(Object.entries(questions).map(([name, question]) => [name, mockAnswer(question)]))
  // 질문 모양에 맞춰 만든 값이지만 TypeScript는 Object.fromEntries 결과의 세부 타입을 추론하지 못해 단언한다
  return { source: 'mock', reason, answers: answers as SystemOneResult<Q>['answers'], model: 'mock' }
}

/**
 * Jev에게 묻는다. 실패해도 예외를 던지지 않고 '판단 불가' 가짜 답을 돌려준다.
 *
 * @example
 * const { answers, source } = await askJev({
 *   state: '5만원 이하 선물용 이어폰',
 *   questions: { category: choice('어떤 카테고리를 찾나요?', { 오디오: null, 주변기기: null }) },
 * })
 * if (answers.category.confidence >= CONFIDENCE.AUTO) { ... }
 */
export async function askJev<const Q extends Questions>(request: SystemOneRequest<Q>): Promise<JevOutcome<Q>> {
  const mode = getJevMode()
  if (mode.source === 'mock') return mockOutcome(request.questions, mode.reason!)

  try {
    const result = await getClient(process.env.OPENROUTER_API_KEY!).systemOne(request)
    return { source: 'jev', answers: result.answers, model: result.model }
  } catch (error) {
    // 연결 자체가 안 됨(회사 SSL 검사, 오프라인, 시간 초과) → 개발은 계속되도록 가짜 답
    if (error instanceof APIConnectionError) {
      console.warn('[jev] 연결 실패 → 가짜 응답으로 대신합니다. 원인 확인: npm run check:ai')
      return mockOutcome(request.questions, 'network')
    }
    // 키 오류, 잔액 부족 등 설정 문제 → 화면은 살리되 서버 로그에 분명히 남긴다
    console.error('[jev] 요청 실패 → 가짜 응답으로 대신합니다. 원인 확인: npm run check:ai', error)
    return mockOutcome(request.questions, 'error')
  }
}
