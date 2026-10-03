'use client'

import { useState } from 'react'
import { useCart } from './CartProvider'
import { Button } from './ui/Button'
import type { Product } from '@/types/product'
import styles from './AddToCartButton.module.scss'

// 장바구니 담기 버튼 (Step 5-1)
//
// 상세 화면(ProductDetail)은 서버 컴포넌트로 두고, 클릭이 필요한 이 버튼만 'use client'로 뺐다.
// (Step 4-1 주석에서 예고한 대로. 원칙: 'use client'는 상호작용이 필요한 가장 작은 부분에만)
//
// props
// - product: 담을 상품. 서버 컴포넌트(ProductDetail)가 넘겨준다.
//   서버 → 클라이언트로 넘기는 props는 JSON으로 바꿀 수 있는 값(문자열·숫자·객체·배열)이어야 한다. Product는 해당된다.
//
// 버튼 상태 3가지
// - 품절(재고 0): 누를 수 없음, '품절'
// - 재고만큼 담음: 누를 수 없음, '최대 수량을 담았습니다' (규칙은 reducer에도 있다. 버튼은 '왜 안 되는지'를 보여 주는 역할)
// - 그 외: '장바구니 담기'
//
// 접근성: 담은 결과를 role="status"로 알린다
// - 눈으로는 헤더 숫자가 바뀌는 게 보이지만, 스크린리더 사용자는 버튼을 눌러도 아무 소리가 없으면 담겼는지 모른다.
// - role="status"(= aria-live="polite") 영역의 글자가 바뀌면 스크린리더가 읽어 준다.
// - 영역은 처음부터 화면에 있어야 한다. 글자를 넣는 순간 영역을 새로 만들면 '바뀜'으로 감지하지 못하는 스크린리더가 많다.
// - 문구에 '현재 n개'를 넣어서 두 번째로 눌러도 글자가 달라지게 했다. (같은 글자면 다시 읽지 않는다)

interface AddToCartButtonProps {
  product: Product
}

function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, getQuantity } = useCart()
  // 알림 문구. 담기 전에는 빈 문자열(영역은 있지만 읽을 내용 없음)
  const [message, setMessage] = useState('')

  const quantity = getQuantity(product.id)
  const soldOut = product.stock === 0
  const reachedMax = !soldOut && quantity >= product.stock

  function handleClick() {
    addItem(product)
    // dispatch 직후에는 아직 화면(quantity)이 바뀌기 전이라 +1로 계산해서 보여 준다
    setMessage(`장바구니에 담았습니다. 현재 ${quantity + 1}개`)
  }

  let label = '장바구니 담기'
  if (soldOut) label = '품절'
  else if (reachedMax) label = '최대 수량을 담았습니다'

  return (
    <div className={styles.root}>
      <Button onClick={handleClick} disabled={soldOut || reachedMax}>
        {label}
      </Button>
      <p role="status" className={styles.message}>
        {message}
      </p>
    </div>
  )
}

export default AddToCartButton
