'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'
import { ButtonLink } from './ui/Button'
import { products } from '@/data/products'
import { formatPrice } from '@/lib/format'
import styles from './CartContents.module.scss'

// 장바구니에 담긴 상품 목록 (Step 5-1, 최소 버전)
//
// 장바구니 state에는 상품 id와 수량만 있다(types/cart.ts). 이름·가격은 상품 데이터에서 찾아서 보여 준다.
// → 가격이 바뀌어도 장바구니에는 항상 지금 가격이 나온다.
// (지금은 목 데이터 파일에서 찾는다. Step 6에서 API로 바뀌면 이 부분만 바꾼다)
//
// Step 5-2에서 수량 +/−, 삭제, 합계, 상품 사진을 추가하고 모양을 다듬는다.

function CartContents() {
  const { items } = useCart()

  // 빈 장바구니: 다음에 할 일(상품 보러 가기)을 함께 안내한다
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>장바구니가 비어 있습니다.</p>
        <ButtonLink href="/">상품 보러 가기</ButtonLink>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {items.map(({ productId, quantity }) => {
        const product = products.find((p) => p.id === productId)
        // 데이터에서 사라진 상품(판매 종료 등)은 건너뛴다. 5-3에서 저장된 장바구니를 불러올 때 생길 수 있다
        if (!product) return null

        return (
          <li key={productId} className={styles.item}>
            <Link href={`/products/${productId}`} className={styles.name}>
              {product.name}
            </Link>
            <span className={styles.meta}>
              {formatPrice(product.price)} × {quantity}개
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default CartContents
