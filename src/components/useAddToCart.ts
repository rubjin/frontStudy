'use client'

import { useCart } from './CartProvider'
import { useToast } from './ui/Toast'
import type { Product } from '@/types/product'

// '장바구니 담기' 버튼의 공통 동작 (Step 5-4)
//
// 담기 버튼이 두 곳(상세 AddToCartButton, 목록 카드 CardAddButton)에 생겼다. 모양은 다르지만
// - 버튼 상태(품절 / 최대 수량 / 담기 가능)를 정하는 방법
// - 누르면 담고 알림(토스트)을 띄우는 동작
// 은 같아야 한다. 이런 '화면 없는 로직'을 함수로 묶은 것이 커스텀 훅이다. (이름이 use로 시작해야 안에서 다른 훅을 쓸 수 있다)
// → 문구나 규칙을 바꿀 때 여기 한 곳만 고친다.
//
// 반환값
// - status:   'soldOut'(재고 0) | 'max'(재고만큼 담음) | 'ready'
// - quantity: 지금 장바구니에 담긴 이 상품 수
// - add():    1개 담고 토스트를 띄운다. ready가 아니면 아무것도 하지 않는다
//             (버튼이 aria-disabled라 클릭이 막히지 않으므로 여기서 거른다. reducer도 한 번 더 막는다)

export type AddToCartStatus = 'soldOut' | 'max' | 'ready'

export function useAddToCart(product: Product) {
  const { addItem, getQuantity, hydrated } = useCart()
  const { showToast } = useToast()

  const quantity = getQuantity(product.id)
  let status: AddToCartStatus = 'ready'
  if (product.stock === 0) status = 'soldOut'
  else if (quantity >= product.stock) status = 'max'

  function add() {
    // 저장된 장바구니를 불러오기 전(첫 화면 직후 한두 프레임)에 누른 것은 무시한다.
    // 지금 담으면 곧 불러온 값으로 통째로 바뀌어(replace) 방금 담은 것이 사라지기 때문이다.
    if (status !== 'ready' || !hydrated) return
    addItem(product)
    // dispatch 직후에는 아직 quantity가 바뀌기 전이라 +1로 계산한다
    const next = quantity + 1
    showToast({
      message:
        next >= product.stock
          ? `${product.name} — 장바구니에 담았습니다. 재고 ${product.stock}개를 모두 담았습니다.`
          : `${product.name} — 장바구니에 담았습니다. 현재 ${next}개`,
      action: { href: '/cart', label: '장바구니 보기' },
    })
  }

  return { status, quantity, add }
}
