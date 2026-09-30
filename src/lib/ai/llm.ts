import 'server-only'
import { FALLBACK_MODELS, type ModelInfo } from './models'

// LLM 호출 (서버 전용, OpenRouter) — 정해진 JSON 모양으로 답을 받는다 (cloude 브랜치 · AI 연동)
//
// 언제 쓰나? Jev가 확신하지 못한(확신도 0.6 미만) 입력을 LLM이 대신 해석할 때.
// 예) "여자친구 생일 선물" → Jev는 카테고리를 못 정했지만, LLM은 "웨어러블이나 오디오"처럼 해석할 수 있다.
//
// 안전장치 4가지
// 1) 모델 자동 대체: models 배열 순서대로 시도하고, 앞 모델이 실패(다운, 과부하, 시간 초과)하면 OpenRouter가 다음 모델로 넘긴다.
//    싼 모델을 앞에 둬서 대부분 가장 싸게 끝난다. 응답의 model 값으로 실제로 답한 모델을 알 수 있다.
// 2) 답 형식 강제: response_format(JSON 스키마) + require_parameters → 이 기능을 지원하는 제공사로만 보낸다.
// 3) 그래도 코드에서 다시 검사(validate): 제공사마다 형식을 지키는 정도가 달라서 LLM 답은 믿지 않고 확인한다.
// 4) 실패하면 예외 대신 data: null. 화면은 "해석하지 못함"으로 처리하면 된다. (jev.ts의 가짜 응답과 같은 원칙)
//
// ⚠️ LLM 답은 확신도가 없다(또는 믿을 만하지 않다). 그래서 LLM 해석은 자동 적용하지 않고
//    부르는 쪽에서 항상 '사용자 확인'으로 처리한다. (searchIntent.ts)

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

// 답(content)은 보통 문자열이지만, 일부 모델은 [{ type: 'text', text: '...' }] 배열(멀티파트)로 준다 (Kimi 지적)
type MessageContent = string | { type?: string; text?: string }[] | null | undefined

function textOf(content: MessageContent): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((part) => part.text ?? '').join('')
  return ''
}

// source: 'mock' = 아예 부르지 않음(키 없음, AI_MOCK=1) / 'llm' = 실제로 시도함(성공이든 실패든)
// 실패 이유는 reason으로 구분한다. (AI 교차 리뷰에서 GLM·Kimi가 둘 다 '기준이 섞였다'고 지적해 통일)
export type LlmSource = 'llm' | 'mock'
export type LlmFailReason = 'no-key' | 'forced' | 'network' | 'timeout' | 'http' | 'invalid'

export interface LlmResult<T> {
  source: LlmSource
  /** 검사를 통과한 답. 실패하면 null */
  data: T | null
  /** 실제로 답한 모델 ID (자동 대체가 일어나면 첫 모델과 다를 수 있다) */
  model?: string
  reason?: LlmFailReason
}

export interface AskLlmOptions<T> {
  /** 모델에게 주는 역할·규칙 */
  system: string
  /** 사용자 입력 */
  user: string
  /** 스키마 이름 (영문, 로그용) */
  schemaName: string
  /** 답의 JSON 스키마 */
  schema: Record<string, unknown>
  /** 답을 검사해서 올바르면 T, 아니면 null을 돌려주는 함수 */
  validate: (value: unknown) => T | null
  /** 시도할 모델들 (기본: models.ts의 FALLBACK_MODELS) */
  models?: ModelInfo[]
  /** 전체 제한 시간 ms (기본 8000 — 실측 DeepSeek 응답 1.2~6초 이상으로 들쭉날쭉. 6초로 줄였더니 실패가 생겨 되돌림) */
  timeoutMs?: number
}

export async function askLlmJson<T>(options: AskLlmOptions<T>): Promise<LlmResult<T>> {
  if (process.env.AI_MOCK === '1') return { source: 'mock', data: null, reason: 'forced' }
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { source: 'mock', data: null, reason: 'no-key' }

  const models = (options.models ?? FALLBACK_MODELS).map((model) => model.id)

  // 요청 보내기 + 응답 본문 읽기를 모두 try 안에 둔다.
  // ⚠️ 제한 시간(AbortSignal.timeout)은 본문을 읽는 동안에도 적용된다.
  //    처음에는 fetch만 감싸서, 본문을 읽다가 시간 초과가 나면 예외가 밖으로 새어 기능 전체가 멈췄다. (실측으로 발견)
  let response: Response
  let body: { model?: string; choices?: { message?: { content?: MessageContent } }[] }
  try {
    response = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter 통계에 앱 이름이 보이게 (선택 사항)
        'X-Title': 'Shoppr',
      },
      body: JSON.stringify({
        models,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: options.schemaName, strict: true, schema: options.schema },
        },
        // 형식 강제를 지원하는 제공사로만 보낸다
        provider: { require_parameters: true },
        // 짧은 JSON 답이면 충분. 긴 답(=비용)을 막는다
        // ⚠️ 추론(reasoning) 모델은 생각하는 데도 토큰을 써서 300으로는 JSON이 잘릴 수 있다.
        //    그래서 FALLBACK_MODELS에는 추론 모델을 넣지 않는다. (models.ts 참고)
        max_tokens: 300,
        temperature: 0,
      }),
      // AbortSignal.timeout: 제한 시간이 지나면 요청을 끊는다 (사용자가 오래 기다리지 않게)
      signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
    })

    if (!response.ok) {
      console.error(`[llm] HTTP ${response.status} → 해석 없이 진행합니다. 원인 확인: npm run check:ai`)
      return { source: 'llm', data: null, reason: 'http' }
    }

    body = await response.json()
  } catch (error) {
    // TimeoutError: 제한 시간 초과 (요청 중이든 본문을 읽는 중이든)
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.warn('[llm] 제한 시간 초과 → 해석 없이 진행합니다.')
      return { source: 'llm', data: null, reason: 'timeout' }
    }
    console.warn('[llm] 연결 실패 → 해석 없이 진행합니다. 원인 확인: npm run check:ai')
    return { source: 'llm', data: null, reason: 'network' }
  }

  const content = textOf(body.choices?.[0]?.message?.content)

  // JSON 파싱 → 검사. 둘 중 하나라도 실패하면 'invalid'
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return { source: 'llm', data: null, model: body.model, reason: 'invalid' }
  }
  const data = options.validate(parsed)
  return data === null
    ? { source: 'llm', data: null, model: body.model, reason: 'invalid' }
    : { source: 'llm', data, model: body.model }
}
