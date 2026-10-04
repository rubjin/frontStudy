'use client'

import { Button } from './ui/Button'
import { Cart } from './icons'
import { useAddToCart } from './useAddToCart'
import type { Product } from '@/types/product'

// 목록 카드의 '담기' 버튼 (Step 5-4)
//
// 상세에 들어가지 않고 목록에서 바로 담는다. 규칙·알림은 상세 버튼과 같다(useAddToCart).
//
// props
// - product:   담을 상품
// - className: 카드 안 배치(위치·여백)를 Card 쪽에서 정한다
//
// 카드 전체가 링크(늘린 링크, Card.tsx)라서 버튼이 그 위에 있어야 눌린다 → Card.module.scss .cartButton의 z-index
//
// 접근성: 버튼 이름에 상품명을 넣는다
// - 화면 글자는 '담기'뿐이지만 카드가 여러 장이라 스크린리더 사용자는 '어떤 상품을' 담는지 알 수 없다.
//   (버튼 목록으로 훑어보면 '담기, 담기, 담기 ...'만 들린다)
// - aria-label에는 화면 글자('담기')를 그대로 포함한다. 음성 제어 사용자가 "담기 누르기"라고 말하면 찾을 수 있게
//   (WCAG 2.5.3 Label in Name)

interface CardAddButtonProps {
  product: Product
  className?: string
}

// 상태별 [화면 글자, 스크린리더 이름 뒷부분]
const LABELS = {
  ready: ['담기', '장바구니에 담기'],
  max: ['최대 수량', '최대 수량 담음'],
  soldOut: ['품절', '품절'],
} as const

function CardAddButton({ product, className }: CardAddButtonProps) {
  const { status, add } = useAddToCart(product)
  const [text, name] = LABELS[status]

  return (
    <Button
      variant="secondary"
      className={className}
      onClick={add}
      aria-label={`${product.name} ${name}`}
      // 품절은 처음부터 못 누르니 disabled(Tab 순서에서도 빠짐), 누르다가 한도에 닿는 경우는 aria-disabled(포커스 유지)
      disabled={status === 'soldOut'}
      aria-disabled={status === 'max'}
    >
      <Cart />
      {text}
    </Button>
  )
}

export default CardAddButton
