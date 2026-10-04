'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { cartReducer, getCartCount, getQuantityInCart, initialCartState, sanitizeCartItems } from '@/lib/cart'
import { CART_STORAGE_KEY, loadCartItems, saveCartItems } from '@/lib/cartStorage'
import { products } from '@/data/products'
import { useToast } from './ui/Toast'
import type { Product } from '@/types/product'
import type { CartItem } from '@/types/cart'

// 장바구니 상태를 사이트 전체에 나눠 주는 컴포넌트 + useCart 훅 (Step 5-1, 5-2 수량 변경·삭제, 5-3 localStorage 저장)
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
// - 새로고침하면 메모리가 비워진다 → 5-3에서 localStorage에 저장하고 다시 불러온다. (아래 '저장과 불러오기')
//
// 저장과 불러오기 (Step 5-3)
// 1) 처음 그릴 때는 '빈 장바구니'로 그린다 — 왜 바로 localStorage 값으로 시작하지 않나? (하이드레이션 불일치)
//    - 서버는 사용자의 localStorage를 볼 수 없어서 HTML을 항상 빈 장바구니(배지 없음)로 만든다.
//    - 브라우저의 React는 그 HTML에 이벤트를 연결(하이드레이션)하면서 '내가 그린 첫 화면이 서버 HTML과 같은지' 확인한다.
//      브라우저가 처음부터 '3개'로 그리면 서버(0개)와 달라서 경고가 나고, React가 그 부분을 버리고 다시 그린다.
//    - 그래서 첫 화면은 서버와 똑같이 빈 장바구니로 그리고, 화면이 붙은 '뒤'(useEffect)에 저장된 값을 불러온다.
// 2) 불러오기 전에는 hydrated = false. '비어 있음'과 '아직 모름'은 다르다.
//    → /cart는 이 동안 "장바구니가 비어 있습니다" 대신 스켈레톤을 보여 준다(CartContents). 안 그러면 잠깐 '비어 있음'이 번쩍인다.
// 3) 불러온 뒤에는 state가 바뀔 때마다 저장한다. (불러오기 전에 저장하면 빈 값으로 덮어써 버리므로 hydrated 뒤에만)
// 4) 다른 탭에서 바꾸면 storage 이벤트로 받아서 이 탭에도 반영한다.
// 5) (5-4) 불러온 값이 정리(sanitize)로 바뀌었으면(재고 감소·품절·판매 종료) 토스트로 알린다.
//    말없이 수량이 줄어 있으면 사용자는 '내가 잘못 눌렀나?' 한다. → 그래서 ToastProvider가 CartProvider 바깥에 있다(layout.tsx)

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
  /** 저장된 장바구니를 불러왔는지 (5-3). false인 동안 items가 비어 있는 것은 '아직 모름'이다 */
  hydrated: boolean
}

// createContext(기본값): Provider 밖에서 꺼냈을 때 받을 값. null로 두고 useCart에서 실수를 알려 준다
const CartContext = createContext<CartContextValue | null>(null)

// props
// - children:     감쌀 화면 (layout의 Header·main)
// - initialItems: 처음부터 담겨 있을 상품 (5-2). Storybook에서 '상품이 담긴 장바구니'를 보여 줄 때 쓴다.
// - persist:      localStorage에 저장·불러오기를 할지 (5-3, 기본 true). 사이트(layout)는 기본값 그대로.
//                 Storybook은 false — 스토리끼리 같은 주소(localStorage)를 쓰므로, 저장하면 한 스토리에서 담은 상품이
//                 다른 스토리에 나타나 스토리 결과가 매번 달라진다.
interface CartProviderProps {
  children: ReactNode
  initialItems?: CartItem[]
  persist?: boolean
}

export function CartProvider({ children, initialItems, persist = true }: CartProviderProps) {
  // useReducer(reducer, 처음 상태) → [지금 상태, 할 일을 보내는 함수]
  // dispatch({ type: 'add', ... })를 부르면 React가 cartReducer(state, action)을 실행하고, 결과로 다시 그린다
  //
  // (5-2) 세 번째 인자: 처음 상태를 '만드는 함수'(초기화 함수). useReducer(reducer, 재료, 재료 → 처음 상태)
  // 처음 한 번만 실행되므로, initialItems가 나중에 바뀌어도 state를 덮어쓰지 않는다. (useState(() => ...)와 같은 원리)
  const [state, dispatch] = useReducer(cartReducer, initialItems, (items) => (items ? { items } : initialCartState))

  // 저장된 장바구니를 불러왔는지. 저장소를 안 쓰면(persist=false) 불러올 것이 없으니 처음부터 true
  const [hydrated, setHydrated] = useState(!persist)
  const { showToast } = useToast()

  // ① 불러오기 + ④ 다른 탭과 맞추기 — 화면이 붙은 뒤 한 번 실행 (useEffect는 브라우저에서만 실행된다)
  useEffect(() => {
    if (!persist) return

    // 저장된 값을 꺼내 지금 상품 데이터에 맞게 정리(판매 종료·재고 감소·품절)한 뒤 통째로 바꾼다
    // (상품 데이터는 지금 목 데이터 파일. Step 6에서 API로 바뀐다)
    // 돌려주는 값: 정리하면서 바뀐 것이 있었는지
    const restore = () => {
      const saved = loadCartItems()
      const items = sanitizeCartItems(saved, products)
      dispatch({ type: 'replace', items })
      // 정리 전후를 문자열로 비교 — 항목 수나 수량이 하나라도 다르면 true
      return JSON.stringify(saved) !== JSON.stringify(items)
    }

    // 처음 불러올 때만 알린다. 다른 탭에서 받은 값(storage 이벤트)은 그 탭이 이미 정리·저장한 값이다
    if (restore()) {
      showToast({
        message: '재고가 바뀐 상품이 있어 장바구니 수량을 조정했습니다.',
        action: { href: '/cart', label: '장바구니 보기' },
      })
    }
    // useEffect 안에서 state를 바꾸면 한 번 더 그려진다. 여기서는 의도한 것이다:
    // 서버와 같은 첫 화면(빈 장바구니) → 저장된 값을 반영한 두 번째 화면. 위 dispatch와 묶여 한 번에 다시 그려진다.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 하이드레이션 뒤 저장소 값을 반영하는 의도된 갱신
    setHydrated(true)

    // storage 이벤트: '다른 탭'에서 localStorage를 바꾸면 이 탭에 알려 준다. (바꾼 탭 자신에게는 오지 않는다)
    // → 탭 A에서 담으면 탭 B의 헤더 배지도 바뀐다.
    function handleStorage(event: StorageEvent) {
      // key가 null이면 localStorage.clear()로 전부 지워진 것. 그때도 다시 읽는다(→ 빈 장바구니)
      if (event.key === CART_STORAGE_KEY || event.key === null) restore()
    }
    window.addEventListener('storage', handleStorage)
    // 정리 함수: Provider가 사라질 때 이벤트 연결을 끊는다 (안 끊으면 사라진 컴포넌트에 계속 알림이 간다)
    return () => window.removeEventListener('storage', handleStorage)
    // showToast는 ToastProvider가 useCallback으로 고정한 함수라 바뀌지 않는다 → 이 effect는 처음 한 번만 실행된다
  }, [persist, showToast])

  // ③ 저장하기 — 불러온 뒤에만, 장바구니가 바뀔 때마다
  useEffect(() => {
    if (persist && hydrated) saveCartItems(state.items)
  }, [persist, hydrated, state.items])

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
      hydrated,
    }),
    [state, hydrated],
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
