// 사용하는 AI 모델 목록 — 역할별로 한 곳에서 관리 (cloude 브랜치 · AI 연동)
//
// 모든 모델은 OpenRouter 키 하나로 부른다. 모델 ID는 OpenRouter 기준 이름('회사/모델').
// 모델을 바꾸고 싶으면 이 파일만 고친다. (코드 곳곳에 ID를 흩어 두지 않는다)
//
// 역할 나누기
// - 판단(Jev):       정해진 답 + 확신도. 빠르고 싸다. → jev.ts
// - 대체 해석(LLM):  Jev가 확신하지 못한 입력을 LLM이 해석. 싼 모델부터 차례로. → llm.ts
// - 코드 리뷰(LLM):  개발 중 변경 사항을 다른 회사 모델이 교차 검토. → scripts/review-ai.mjs
//
// 가격은 2026-09-30에 OpenRouter 모델 페이지·검색으로 확인한 대략값이다. (제공사마다 다르고 자주 바뀐다)
// ⚠️ 이 ID들은 문서·검색으로 확인했지만 실제 호출로는 아직 확인하지 못했다(회사 네트워크).
//    Codespaces에서 `npm run check:ai`로 모든 모델이 응답하는지 먼저 확인한다.

export interface ModelInfo {
  /** OpenRouter 모델 ID */
  id: string
  /** 화면·로그에 보여 줄 이름 */
  label: string
  /** 입력 / 출력 가격 (100만 토큰당 USD, 대략) */
  price: string
  /** 왜 이 자리에 이 모델을 쓰는지 */
  why: string
}

/** 판단 모델 — Jev */
export const JUDGE_MODEL: ModelInfo = {
  id: 'typesafe/jev-1.13',
  label: 'Jev 1.13',
  price: '입력 과금, 출력 무료',
  why: '정해진 답만 나오고 확신도를 준다. 분류·점수·예/아니오 판단 전용',
}

/**
 * 대체 해석 모델 — 앞에서부터 시도하고, 실패하면 OpenRouter가 다음 모델로 자동으로 넘긴다.
 * 싼 모델을 앞에 둔다: 대부분 첫 모델에서 끝나므로 비용이 가장 낮다.
 * 규칙: 추론(reasoning) 모델은 넣지 않는다 — 생각 토큰 때문에 짧은 max_tokens에서 JSON이 잘린다.
 * 순서(2026-09-30 실측 반영): 짧은 요청 응답 시간 두 번 측정
 *   DeepSeek 1.2초·1.0초 / Gemini 1.9초·1.9초 / GPT Luna 11.9초·1.4초
 *   → 사용자가 기다리는 검색이라, 들쭉날쭉했던 GPT Luna보다 일정했던 Gemini를 두 번째에 둔다.
 *   (자동 대체는 '오류'일 때만 일어나고 '느림'에는 일어나지 않는다. 느린 모델이 걸리면 제한 시간 8초에 걸려 전체가 실패한다)
 */
export const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'deepseek/deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    price: '약 $0.10 / $0.20',
    why: '가장 싸고 빠르다. 짧은 검색어 해석에 충분',
  },
  {
    id: 'google/gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    price: '$0.75 / $3.75',
    why: '두 번째. DeepSeek보다 비싸지만 빠르고(실측 1.9초) 다국어가 강하다',
  },
  {
    id: 'openai/gpt-6-luna',
    label: 'GPT-6 Luna',
    price: '$0.10 / $0.50',
    why: '마지막. 가장 싸지만 실측 응답이 들쭉날쭉했다(1.4~11.9초) — 앞의 둘이 모두 실패할 때만',
  },
]

/** 코드 리뷰 모델 — 서로 다른 회사 모델로 교차 검토 (npm run review:ai) */
export const REVIEW_MODELS: ModelInfo[] = [
  {
    id: 'z-ai/glm-5.3',
    label: 'GLM 5.3',
    price: '페이지 확인 필요',
    why: '코딩·추론에 강하다. 추론이 항상 켜져 있어 느리지만 꼼꼼하다',
  },
  {
    id: 'moonshotai/kimi-k3',
    label: 'Kimi K3',
    price: '약 $0.40~3 / $9~15',
    why: '코딩·에이전트 작업에 강하다. 다른 시각의 두 번째 리뷰어',
  },
]

/** 리뷰어로 바꿔 쓸 수 있는 선택지 (npm run review:ai -- --with-qwen) */
export const OPTIONAL_REVIEW_MODELS: ModelInfo[] = [
  {
    id: 'qwen/qwen3.8-max-0902',
    label: 'Qwen3.8 Max',
    price: '$2 / $6',
    why: '고성능이지만 비싸서 필요할 때만 세 번째 리뷰어로',
  },
]
