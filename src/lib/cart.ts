import type { CartItem, CartState } from '@/types/cart'
import type { Product } from '@/types/product'

// 장바구니 규칙 — reducer와 계산 함수 (Step 5-1, 5-2에서 수량 변경·삭제·합계, 5-3에서 불러오기 추가)
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

// 할 일(action) 목록
// type 값으로 구분하는 이 모양을 '구별된 유니온(discriminated union)'이라 한다.
// switch (action.type)에서 'add'로 들어가면 TypeScript가 action에 productId·maxQuantity가 있다는 것을 안다.
// (5-2) 새 action을 추가하면 아래 switch에서 case를 빠뜨렸을 때 TypeScript가 알려 준다. (반환 타입이 CartState라서
//       case가 없으면 'undefined를 돌려줄 수 있다'는 에러가 난다)
export type CartAction =
  | {
      type: 'add'
      productId: number
      /** 담을 수 있는 최대 수량 = 상품 재고. 이보다 많이 담기지 않는다 */
      maxQuantity: number
    }
  | {
      // 수량을 정해진 값으로 바꾸기 (5-2, 장바구니 페이지의 +/− 버튼)
      // '+1/−1' 두 action으로 나누지 않고 '이 수량으로'를 받는 이유:
      // 나중에 수량을 직접 입력하는 칸이 생겨도 같은 action을 그대로 쓸 수 있다.
      type: 'setQuantity'
      productId: number
      quantity: number
      maxQuantity: number
    }
  | {
      // 장바구니에서 빼기 (5-2)
      type: 'remove'
      productId: number
    }
  | {
      // 통째로 바꾸기 (5-3) — localStorage에서 불러올 때, 다른 탭에서 바뀐 장바구니를 받을 때
      // items는 sanitizeCartItems로 정리된 값을 넘긴다
      type: 'replace'
      items: CartItem[]
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

    case 'setQuantity': {
      const { productId, maxQuantity } = action
      const existing = state.items.find((item) => item.productId === productId)
      // 장바구니에 없는 상품의 수량은 바꾸지 않는다 (담기는 'add'로만)
      if (!existing) return state

      // 1 ~ 재고 사이로 맞춘다(clamp). 0 이하로 내려가도 삭제하지 않는다 → 삭제는 'remove'로만.
      // (−를 연타하다 실수로 상품이 사라지지 않게. 화면에서도 1개일 때 − 버튼을 비활성화한다)
      // Math.floor: 1.5개 같은 값이 들어와도 정수로
      const quantity = Math.min(Math.max(Math.floor(action.quantity), 1), maxQuantity)
      // 재고가 0이 된 상품(품절)이면 quantity가 0 이하가 될 수 있다 → 그대로 둔다 (5-3 저장된 장바구니에서 다룬다)
      if (quantity < 1 || quantity === existing.quantity) return state

      return {
        items: state.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
      }
    }

    case 'remove': {
      // filter: 조건에 맞는 것만 남긴 '새 배열'을 만든다 (원래 배열은 그대로)
      const items = state.items.filter((item) => item.productId !== action.productId)
      // 지울 게 없었으면 원래 state 그대로 (다시 그리지 않게)
      if (items.length === state.items.length) return state
      return { items }
    }

    case 'replace':
      return { items: action.items }
  }
}

// 저장해 둔 장바구니를 지금 상품 데이터에 맞게 정리한다 (5-3)
//
// 왜 필요한가? localStorage의 값은 '예전에 저장한 것'이다. 그 사이에
// - 상품이 판매 종료되어 목록에서 사라졌을 수 있고 → 뺀다
// - 재고가 줄었을 수 있고(5개 담았는데 지금 재고 3개) → 재고만큼으로 줄인다
// - 품절(재고 0)됐을 수 있다 → 뺀다
// - 사용자가 개발자 도구로 값을 고쳤을 수도 있다(같은 상품이 두 번) → 처음 것만 남긴다
// reducer의 규칙(1 ~ 재고)을 '불러온 값'에도 똑같이 적용하는 것이다. 이 정리를 거쳐야 화면의 버튼 상태·합계가 맞는다.
export function sanitizeCartItems(items: CartItem[], products: Product[]): CartItem[] {
  // Set: 중복 없는 값 모음. '이미 넣은 상품 id'를 기억하는 데 쓴다
  const seen = new Set<number>()
  return items.flatMap(({ productId, quantity }) => {
    const product = products.find((p) => p.id === productId)
    if (!product || product.stock < 1 || seen.has(productId)) return []
    seen.add(productId)
    return [{ productId, quantity: Math.min(quantity, product.stock) }]
  })
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

// 장바구니 화면의 한 줄 = 상품 정보 + 수량 + 소계 (5-2)
export interface CartLine {
  product: Product
  quantity: number
  /** 가격 × 수량 */
  subtotal: number
}

// 장바구니 항목(id·수량)에 상품 정보를 붙여 화면에 쓸 줄 목록을 만든다 (5-2)
//
// 장바구니에는 id·수량만 있으므로(types/cart.ts) 이름·가격·사진은 상품 목록에서 찾는다.
// - 상품 목록을 매개변수로 받는 이유: 이 파일이 '어디서 상품을 가져오는지'(목 데이터, Step 6의 API)를 몰라도 되게.
//   → 데이터 출처가 바뀌어도 이 함수는 그대로고, 테스트할 때는 가짜 상품 몇 개만 넘기면 된다.
// - 상품 목록에 없는 id(판매 종료 등)는 뺀다. 5-3에서 예전에 저장한 장바구니를 불러올 때 생길 수 있다.
export function getCartLines(state: CartState, products: Product[]): CartLine[] {
  return state.items.flatMap(({ productId, quantity }) => {
    const product = products.find((p) => p.id === productId)
    // flatMap: 하나를 0개 또는 1개로 바꿀 수 있는 map. 빈 배열을 돌려주면 그 항목은 결과에서 빠진다
    //   (map + filter를 한 번에. filter로 undefined를 빼면 TypeScript가 타입을 좁히지 못하는 문제도 없다)
    return product ? [{ product, quantity, subtotal: product.price * quantity }] : []
  })
}

// 총 금액 (5-2) — 줄 목록의 소계를 더한다.
// 화면에 보이는 줄(getCartLines 결과)로 계산해야 '보이는 금액의 합 = 총 금액'이 항상 맞는다.
export function getCartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotal, 0)
}
