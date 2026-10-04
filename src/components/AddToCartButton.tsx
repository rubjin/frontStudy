'use client'

import { Button } from './ui/Button'
import { useAddToCart } from './useAddToCart'
import type { Product } from '@/types/product'

// 상세 화면의 '장바구니 담기' 버튼 (Step 5-1, 5-4에서 정리)
//
// 상세 화면(ProductDetail)은 서버 컴포넌트로 두고, 클릭이 필요한 이 버튼만 'use client'로 뺐다.
// (원칙: 'use client'는 상호작용이 필요한 가장 작은 부분에만)
//
// props
// - product: 담을 상품. 서버 컴포넌트(ProductDetail)가 넘겨준다.
//   서버 → 클라이언트로 넘기는 props는 JSON으로 바꿀 수 있는 값(문자열·숫자·객체·배열)이어야 한다. Product는 해당된다.
//
// 버튼 상태 3가지 (useAddToCart가 정한다)
// - 품절(재고 0): '품절', disabled — 처음부터 끝까지 누를 수 없으니 Tab 순서에서도 빠지는 disabled가 맞다
// - 재고만큼 담음: '최대 수량을 담았습니다', aria-disabled
// - 그 외: '장바구니 담기'
//
// 5-4에서 바뀐 점
// 1) 최대 수량은 disabled → aria-disabled
//    다섯 번째로 누르는 '그 순간' 버튼이 disabled가 되면 포커스가 body로 튕긴다. (5-2 장바구니 수량 버튼과 같은 문제)
//    aria-disabled는 비활성으로 읽히지만 포커스는 남는다. 클릭은 useAddToCart의 add()가 거른다.
// 2) 담은 결과 알림: 버튼 아래 문구(role="status") → 공통 토스트(ui/Toast)
//    목록 카드에도 담기 버튼이 생겨서, 알림을 버튼마다 두지 않고 화면에 하나만 두었다.
//    토스트도 role="status" 영역이라 스크린리더가 읽어 준다. '장바구니 보기' 링크가 함께 나온다.

interface AddToCartButtonProps {
  product: Product
}

function AddToCartButton({ product }: AddToCartButtonProps) {
  const { status, add } = useAddToCart(product)

  const label = { soldOut: '품절', max: '최대 수량을 담았습니다', ready: '장바구니 담기' }[status]

  return (
    <Button onClick={add} disabled={status === 'soldOut'} aria-disabled={status === 'max'}>
      {label}
    </Button>
  )
}

export default AddToCartButton
