import 'server-only'
import { choice, noul, score } from '@typesafe-ai/sdk'
import { askJev, CONFIDENCE, type JevSource, type MockReason } from './jev'

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
// - fallback: 0.6 미만        → 자동 적용하지 않음 (다음 단계에서 Qwen → Gemini 대체 처리)

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

export interface SearchIntent {
  query: string
  category: SearchCategory
  categoryConfidence: number
  /** 0~4 (소수일 수 있음 — 확률로 계산한 기대 점수) */
  priceLevel: number
  priceLabel: (typeof PRICE_RUBRIC)[number]
  /** 선물용일 확률 0~1 */
  giftProbability: number
  action: SearchAction
  source: JevSource
  reason?: MockReason
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

  // 기대 점수(예: 1.2)를 가장 가까운 단계로 반올림해서 이름표를 붙인다
  const priceIndex = Math.min(PRICE_RUBRIC.length - 1, Math.max(0, Math.round(answers.price.score)))

  return {
    query,
    category: answers.category.choice,
    categoryConfidence: answers.category.confidence,
    priceLevel: answers.price.score,
    priceLabel: PRICE_RUBRIC[priceIndex],
    giftProbability: answers.gift.noul,
    action: decideAction(answers.category.confidence, answers.category.choice),
    source,
    reason,
  }
}
