'use client'

import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { cartReducer, getCartCount, getQuantityInCart, initialCartState } from '@/lib/cart'
import type { Product } from '@/types/product'
import type { CartItem } from '@/types/cart'

// 장바구니 상태를 사이트 전체에 나눠 주는 컴포넌트 + useCart 훅 (Step 5-1, 5-2에서 수량 변경·삭제 추가)
//
// 왜 Context가 필요한가? — props 전달(드릴링) 문제
// - 장바구니 숫자는 헤더(CartLink)에, 담기 버튼은 상세 페이지(AddToCartButton)에, 목록은 /cart 페이지에 있다.
//   셋은 화면에서 멀리 떨어져 있고 공통 부모는 layout.tsx뿐이다.
// - props로 넘기려면 layout → Header → CartLink, layout → page → ProductDetail → 버튼 ... 으로
//   중간 컴포넌트들이 쓰지도 않는 props를 계속 넘겨줘야 한다. (props drilling)
// - Context는 '위에서 한 번 깔아 두면 아래 어디서든 꺼내 쓰는' 통로다. 중간 컴포넌트는 몰라도 된다.
//
// 구조
//   layout.tsx (서버)
//   └ <CartProvider>          ← 여기 state가 있다 (useReducer)
//      ├ <Header />           (서버) └ <CartLink />        useCart()로 count 읽기
//      └ <main>{children}     (서버) └ <AddToCartButton /> useCart()로 addItem 호출
//
// 서버 컴포넌트를 클라이언트 컴포넌트로 감싸도 되나?
// - 된다. children으로 받은 것은 이미 서버에서 그려진 결과라서, CartProvider가 'use client'여도
//   Header·page는 서버 컴포넌트 그대로다. (CartProvider 안에서 직접 import해서 그리면 클라이언트가 된다)
// - 그래서 Provider는 children을 받는 모양으로 만든다.
//
// 페이지를 옮겨 다녀도 장바구니가 유지되는 이유
// - layout.tsx는 페이지가 바뀌어도 다시 만들어지지 않는다. 그 안의 CartProvider state도 그대로다.
// - 새로고침하면 사라진다 → Step 5-3에서 localStorage에 저장한다.

// 컴포넌트들이 useCart()로 받는 값
interface CartContextValue {
  items: CartItem[]
  /** 담긴 수량의 합 (헤더 배지) */
  count: number
  /** 이 상품을 몇 개 담았는지 */
  getQuantity: (productId: number) => number
  /** 1개 담기. 재고만큼 담았으면 아무 일도 일어나지 않는다 */
  addItem: (product: Product) => void
  /** 수량 바꾸기 (5-2). 1 ~ 재고 사이로 맞춰진다. 0으로 해도 삭제되지 않는다 → removeItem */
  setQuantity: (product: Product, quantity: number) => void
  /** 장바구니에서 빼기 (5-2) */
  removeItem: (productId: number) => void
}

// createContext(기본값): Provider 밖에서 꺼냈을 때 받을 값. null로 두고 useCart에서 실수를 알려 준다
const CartContext = createContext<CartContextValue | null>(null)

// props
// - children:     감쌀 화면 (layout의 Header·main)
// - initialItems: 처음부터 담겨 있을 상품 (5-2). Storybook에서 '상품이 담긴 장바구니'를 보여 줄 때 쓴다.
//                 사이트(layout)에서는 넘기지 않는다 → 빈 장바구니로 시작. (5-3에서 localStorage 값으로 시작하게 바뀐다)
interface CartProviderProps {
  children: ReactNode
  initialItems?: CartItem[]
}

export function CartProvider({ children, initialItems }: CartProviderProps) {
  // useReducer(reducer, 처음 상태) → [지금 상태, 할 일을 보내는 함수]
  // dispatch({ type: 'add', ... })를 부르면 React가 cartReducer(state, action)을 실행하고, 결과로 다시 그린다
  //
  // (5-2) 세 번째 인자: 처음 상태를 '만드는 함수'(초기화 함수). useReducer(reducer, 재료, 재료 → 처음 상태)
  // 처음 한 번만 실행되므로, initialItems가 나중에 바뀌어도 state를 덮어쓰지 않는다. (useState(() => ...)와 같은 원리)
  const [state, dispatch] = useReducer(cartReducer, initialItems, (items) => (items ? { items } : initialCartState))

  // useMemo: state가 바뀔 때만 value 객체를 새로 만든다.
  // Context는 value가 '다른 객체'가 되면 useCart()를 쓰는 모든 컴포넌트를 다시 그린다.
  // 그냥 { ... }로 쓰면 CartProvider가 다시 그려질 때마다 (state가 같아도) 새 객체가 되어 불필요하게 다시 그린다.
  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      count: getCartCount(state),
      getQuantity: (productId) => getQuantityInCart(state, productId),
      // 컴포넌트는 상품만 넘기고, reducer가 알아야 할 값(id, 재고)은 여기서 꺼내 action으로 만든다
      addItem: (product) => dispatch({ type: 'add', productId: product.id, maxQuantity: product.stock }),
      setQuantity: (product, quantity) =>
        dispatch({ type: 'setQuantity', productId: product.id, quantity, maxQuantity: product.stock }),
      removeItem: (productId) => dispatch({ type: 'remove', productId }),
    }),
    [state],
  )

  // React 19: <CartContext value={...}>로 바로 쓴다 (예전 문법 <CartContext.Provider value={...}>와 같다)
  return <CartContext value={value}>{children}</CartContext>
}

// 장바구니 꺼내 쓰기 — 컴포넌트에서 const { count, addItem } = useCart()
//
// useContext를 컴포넌트마다 직접 쓰지 않고 훅으로 한 번 감싼 이유
// - CartProvider 밖에서 쓰면(예: layout에 Provider를 빼먹음) null이 나와서 엉뚱한 곳에서 에러가 난다.
//   여기서 바로 알아보기 쉬운 에러로 알려 준다.
// - 쓰는 쪽은 null 검사 없이 CartContextValue 타입을 바로 받는다.
export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart는 <CartProvider> 안에서만 쓸 수 있습니다. (app/layout.tsx 확인)')
  }
  return context
}
