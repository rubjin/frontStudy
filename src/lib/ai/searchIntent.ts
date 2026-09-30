import 'server-only'
import { choice, noul, score } from '@typesafe-ai/sdk'
import { askJev, CONFIDENCE, type JevSource, type MockReason } from './jev'
import { askLlmJson, type LlmFailReason } from './llm'

// 검색 문장 → 의도(카테고리·가격대·선물 여부) 분류 (cloude 브랜치 · AI 연동)
//
// 예) "5만원 이하 선물용 이어폰" → 카테고리 '오디오', 가격대 '5만원 이하', 선물용 예
//
// Jev에 질문 3개를 '한 번에' 보낸다. (TypeSafe 문서 권장: 하나의 큰 질문 대신 작고 분명한 질문 여러 개)
// - category: choice  — 상품 데이터의 카테고리 중 하나
// - price:    score   — 가격대 0~4 (0 = 가격 언급 없음)
// - gift:     noul    — 선물용인지 (예일 확률)
//
// 결과에는 '그래서 무엇을 할지(action)'까지 담는다. 화면은 action만 보고 행동하면 된다.
// - apply:    확신도 0.85 이상 → 필터를 바로 적용
// - confirm:  0.6 ~ 0.85     → "○○ 카테고리로 볼까요?" 사용자에게 확인
// - fallback: 0.6 미만        → 자동 적용하지 않음
//
// 대체 해석 (AI 연동 4단계)
// - Jev가 fallback이면 LLM(DeepSeek → GPT Luna → Gemini, models.ts)에게 같은 질문을 다시 한다.
// - LLM이 해석에 성공해도 action은 'confirm'까지만. LLM 답은 믿을 만한 확신도가 없어서 자동 적용하지 않는다.
// - decidedBy로 누가 결정했는지 남긴다: 'jev' | 'llm' | 'none'(둘 다 못 함)

// 카테고리 보기와 설명. 설명을 넣으면 Jev가 더 정확하게 고른다. (상품 데이터의 카테고리와 같아야 한다)
const CATEGORY_CRITERIA = {
  오디오: '헤드폰, 이어폰, 스피커 등 소리를 듣는 기기',
  웨어러블: '스마트워치처럼 몸에 착용하는 기기',
  주변기기: '키보드, 마우스, 허브, 웹캠 등 컴퓨터에 연결하는 기기',
  디스플레이: '모니터 등 화면 장치',
  액세서리: '거치대, 조명처럼 기기를 보조하는 물건',
  저장장치: 'SSD, 외장 하드 등 데이터를 저장하는 기기',
  알수없음: '위 카테고리와 관련 없는 검색',
} as const

// 가격대 점수표: 배열의 순서(0, 1, 2 ...)가 점수가 된다
const PRICE_RUBRIC = ['가격 언급 없음', '5만원 이하', '5만~15만원', '15만~30만원', '30만원 초과'] as const

export type SearchAction = 'apply' | 'confirm' | 'fallback'
export type SearchCategory = keyof typeof CATEGORY_CRITERIA
export type DecidedBy = 'jev' | 'llm' | 'none'

const CATEGORIES = Object.keys(CATEGORY_CRITERIA) as SearchCategory[]

export interface SearchIntent {
  query: string
  category: SearchCategory
  /**
   * Jev가 '자기가 고른 카테고리'에 대해 가진 확신도. decidedBy가 'llm'이면 category는 LLM 답이고
   * 이 값은 Jev의 (낮은) 확신도라서 LLM 답의 확신도가 아니다. 화면에서는 LLM 결정일 때 이 값을 보여 주지 않는다.
   */
  categoryConfidence: number
  /** 0~4 (소수일 수 있음 — 확률로 계산한 기대 점수) */
  priceLevel: number
  priceLabel: (typeof PRICE_RUBRIC)[number]
  /** 선물용일 확률 0~1 — 항상 Jev가 판단한 값 (LLM 대체 해석은 카테고리·가격대만 다시 본다) */
  giftProbability: number
  action: SearchAction
  /** 최종 결정을 누가 했나 */
  decidedBy: DecidedBy
  source: JevSource
  reason?: MockReason
  /** LLM 대체 해석을 했다면 실제로 답한 모델, 실패했다면 그 이유 */
  llm?: { model?: string; reason?: LlmFailReason }
}

function decideAction(confidence: number, category: SearchCategory): SearchAction {
  // '알수없음'은 확신이 높아도 필터로 적용할 카테고리가 아니다
  if (category === '알수없음') return 'fallback'
  if (confidence >= CONFIDENCE.AUTO) return 'apply'
  if (confidence >= CONFIDENCE.CONFIRM) return 'confirm'
  return 'fallback'
}

export async function classifySearchIntent(query: string): Promise<SearchIntent> {
  const { answers, source, reason } = await askJev({
    state: { searchQuery: query, shop: '전자기기 쇼핑몰' },
    questions: {
      category: choice('이 검색어로 찾으려는 상품 카테고리는?', CATEGORY_CRITERIA),
      price: score('검색어에 담긴 가격대는?', PRICE_RUBRIC),
      gift: noul('선물용으로 찾는 상품인가?'),
    },
  })

  const jevIntent: SearchIntent = {
    query,
    category: answers.category.choice,
    categoryConfidence: answers.category.confidence,
    priceLevel: answers.price.score,
    priceLabel: priceLabelOf(answers.price.score),
    giftProbability: answers.gift.noul,
    action: decideAction(answers.category.confidence, answers.category.choice),
    decidedBy: 'jev',
    source,
    reason,
  }
  if (jevIntent.action !== 'fallback') return jevIntent

  // Jev가 '쇼핑과 관련 없는 검색'이라고 확신하면 LLM에게 다시 묻지 않는다 (예: "오늘 날씨 어때")
  // 실제 측정: 이 경우 LLM을 부르면 6초와 비용만 들고 결과는 같았다(알수없음)
  if (jevIntent.category === '알수없음' && jevIntent.categoryConfidence >= CONFIDENCE.CONFIRM) return jevIntent

  // Jev가 확신하지 못함 → LLM 대체 해석
  const llm = await interpretWithLlm(query)
  if (!llm.data || llm.data.category === '알수없음') {
    return { ...jevIntent, decidedBy: 'none', llm: { model: llm.model, reason: llm.reason } }
  }
  return {
    ...jevIntent,
    category: llm.data.category,
    priceLevel: llm.data.priceLevel,
    priceLabel: priceLabelOf(llm.data.priceLevel),
    action: 'confirm', // LLM 해석은 자동 적용하지 않는다
    decidedBy: 'llm',
    llm: { model: llm.model },
  }
}

// 기대 점수(예: 1.2)를 가장 가까운 단계로 반올림해서 이름표를 붙인다
function priceLabelOf(level: number) {
  return PRICE_RUBRIC[Math.min(PRICE_RUBRIC.length - 1, Math.max(0, Math.round(level)))]
}

interface LlmIntent {
  category: SearchCategory
  priceLevel: number
}

// LLM에게 같은 분류를 JSON으로 받는다. 보기(enum)를 스키마에 넣어 정해진 값만 나오게 하고, validate로 한 번 더 확인한다
function interpretWithLlm(query: string) {
  return askLlmJson<LlmIntent>({
    system: [
      '너는 전자기기 쇼핑몰 검색어를 해석한다.',
      `카테고리는 반드시 다음 중 하나: ${CATEGORIES.join(', ')}. 해당 없으면 '알수없음'.`,
      `가격대 priceLevel: ${PRICE_RUBRIC.map((label, index) => `${index}=${label}`).join(', ')}`,
      'JSON으로만 답한다.',
    ].join('\n'),
    user: query,
    schemaName: 'search_intent',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORIES, description: '찾으려는 상품 카테고리' },
        priceLevel: { type: 'integer', minimum: 0, maximum: PRICE_RUBRIC.length - 1, description: '가격대 단계' },
      },
      required: ['category', 'priceLevel'],
      additionalProperties: false,
    },
    // 스키마를 지켰더라도 코드에서 다시 확인한다 (정해지지 않은 카테고리가 필터로 들어가면 안 된다)
    validate: (value) => {
      if (typeof value !== 'object' || value === null) return null
      const { category, priceLevel } = value as Record<string, unknown>
      if (typeof category !== 'string' || !CATEGORIES.includes(category as SearchCategory)) return null
      if (typeof priceLevel !== 'number' || !Number.isInteger(priceLevel) || priceLevel < 0 || priceLevel >= PRICE_RUBRIC.length) return null
      return { category: category as SearchCategory, priceLevel }
    },
  })
}
