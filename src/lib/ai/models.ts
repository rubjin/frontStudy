// 사용하는 AI 모델 목록 — 역할별로 한 곳에서 관리 (cloude 브랜치 · AI 연동)
//
// ⚠️ 무료 모델만 쓴다 (2026-09-30 사용자 결정)
// - OpenRouter에서 ID가 ':free'로 끝나는 모델은 토큰 요금이 0이다.
// - isFreeModel()이 false인 모델은 앱·check:ai·review:ai 어디서도 호출하지 않는다. (실수로 유료 모델을 넣어도 요금이 안 나감)
// - 무료 모델의 제한: 분당 약 20회, 하루 약 50회(크레딧을 산 적 없는 계정 기준). 넘으면 429 오류 → 가짜 응답으로 대신한다.
// - 무료 목록은 자주 바뀐다. 모델이 사라지면 404가 나므로 `npm run check:ai`로 확인하고 여기서 바꾼다.
//
// 모델을 바꾸고 싶으면 이 파일만 고친다. (코드 곳곳에 ID를 흩어 두지 않는다)
// 2026-09-30 OpenRouter 공식 목록(/api/v1/models)에서 가격 0인 모델 20개 중에서 골랐다.

export interface ModelInfo {
  /** OpenRouter 모델 ID */
  id: string
  /** 화면·로그에 보여 줄 이름 */
  label: string
  /** 왜 이 자리에 이 모델을 쓰는지 */
  why: string
}

/** 무료 모델인지 — ':free'로 끝나는 ID와 OpenRouter의 무료 자동 선택기(openrouter/free)만 무료로 본다 */
export function isFreeModel(id: string): boolean {
  return id.endsWith(':free') || id === 'openrouter/free'
}

/**
 * 판단 모델 — Jev (유료, 무료 버전 없음) → 호출하지 않는다.
 * jev.ts는 이 값이 무료가 아니면 항상 '판단 불가'(확신도 0)를 돌려준다.
 * 무료 판단 모델이 생기면 여기만 바꾸면 다시 켜진다.
 */
export const JUDGE_MODEL: ModelInfo = {
  id: 'typesafe/jev-1.13',
  label: 'Jev 1.13 (유료 · 꺼짐)',
  why: '정해진 답 + 확신도를 주는 판단 전용 모델. 무료가 없어 사용하지 않는다',
}

/**
 * 대체 해석 모델 — 앞에서부터 시도하고, 실패하면 OpenRouter가 다음 모델로 자동으로 넘긴다.
 * 조건: 무료 + 답 형식(JSON 스키마) 강제 지원 (공식 목록의 supported_parameters로 확인)
 * 무료 모델은 모두 추론(reasoning) 모델이라 llm.ts에서 추론을 짧게(effort: low) 하고 max_tokens를 넉넉히 준다.
 */
export const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'qwen/qwen3.8-27b:free',
    label: 'Qwen3.8 27B (무료)',
    why: '무료 중 JSON 강제 지원, 한국어 이해가 좋은 편',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    label: 'Nemotron 3 Super (무료)',
    why: '무료 중 JSON 강제 지원. Qwen이 한도 초과·오류일 때 대신',
  },
]

/** 코드 리뷰 모델 — 서로 다른 회사 모델로 교차 검토 (npm run review:ai) */
export const REVIEW_MODELS: ModelInfo[] = [
  {
    id: 'qwen/qwen3.8-27b:free',
    label: 'Qwen3.8 27B (무료)',
    why: '범용 코딩·추론',
  },
  {
    id: 'cohere/north-mini-code:free',
    label: 'North Mini Code (무료)',
    why: '코드 전용 모델. 다른 회사 모델의 두 번째 시각',
  },
]
