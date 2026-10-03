import type { CartState } from '@/types/cart'

// 장바구니 규칙 — reducer와 계산 함수 (Step 5-1)
//
// reducer란?
// - (지금 상태, 할 일) → 다음 상태 를 돌려주는 '순수 함수'.
//   예) cartReducer({ items: [] }, { type: 'add', productId: 3, maxQuantity: 10 }) → { items: [{ productId: 3, quantity: 1 }] }
// - 컴포넌트는 "무엇을 할지"(action)만 알리고, "어떻게 바꿀지"는 전부 여기서 정한다.
//   → '재고보다 많이 담을 수 없다' 같은 규칙이 한 곳에 모인다. 버튼이 여러 곳에 생겨도 규칙은 하나다.
//
// 왜 useState가 아니라 useReducer인가?
// - 장바구니는 담기·수량 변경·삭제·비우기처럼 '바꾸는 방법'이 여러 가지다.
//   useState로 하면 버튼마다 setItems(...배열 계산...)을 따로 쓰게 되고, 규칙이 여기저기 흩어진다.
// - reducer는 React와 상관없는 보통 함수라서 화면 없이 테스트할 수 있다. (Step 10 Vitest)
//
// 순수 함수 규칙 (지키지 않으면 화면이 바뀌지 않는 버그가 생긴다)
// - 받은 state를 직접 고치지 않는다(push, item.quantity++ 금지). 항상 새 배열·새 객체를 만들어 돌려준다.
//   React는 '이전 값과 다른 객체인지'(참조)로 바뀌었는지 판단하기 때문이다.
// - 바꿀 게 없으면 받은 state를 그대로 돌려준다. → React가 '안 바뀜'으로 보고 다시 그리지 않는다.

// 할 일(action) 목록 — 5-2에서 수량 변경·삭제, 5-3에서 불러오기가 추가된다
// type 값으로 구분하는 이 모양을 '구별된 유니온(discriminated union)'이라 한다.
// switch (action.type)에서 'add'로 들어가면 TypeScript가 action에 productId·maxQuantity가 있다는 것을 안다.
export type CartAction = {
  type: 'add'
  productId: number
  /** 담을 수 있는 최대 수량 = 상품 재고. 이보다 많이 담기지 않는다 */
  maxQuantity: number
}

export const initialCartState: CartState = { items: [] }

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { productId, maxQuantity } = action
      const existing = state.items.find((item) => item.productId === productId)

      // 처음 담는 상품: 맨 뒤에 수량 1로 추가 (재고가 0이면 담지 않음)
      if (!existing) {
        if (maxQuantity < 1) return state
        return { items: [...state.items, { productId, quantity: 1 }] }
      }

      // 이미 담긴 상품: 수량 +1. 재고만큼 담았으면 그대로
      if (existing.quantity >= maxQuantity) return state
      return {
        // map: 해당 상품만 '새 객체'로 바꾸고 나머지는 그대로 둔 새 배열
        items: state.items.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      }
    }
  }
}

// ─── 계산 함수 (state에서 값을 '꺼내 보는' 함수, selector라고도 부른다) ───

// 담긴 상품 수량의 합 — 헤더 배지에 보여 줄 숫자 (같은 상품 2개 = 2)
export function getCartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0)
}

// 특정 상품을 몇 개 담았는지 (안 담았으면 0)
export function getQuantityInCart(state: CartState, productId: number): number {
  return state.items.find((item) => item.productId === productId)?.quantity ?? 0
}
