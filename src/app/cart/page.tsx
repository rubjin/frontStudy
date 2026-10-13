import type { Metadata } from 'next'
import CartContents from '@/components/CartContents'
import { placeOrderAction } from '@/app/orders/actions'
import styles from './page.module.scss'

// 장바구니 페이지 — 주소 "/cart" (Step 5-1, 5-2에서 내용 완성)
//
// 페이지 자체는 서버 컴포넌트로 두고, 장바구니 내용(브라우저에만 있는 state)을 읽는 부분만 CartContents('use client')에 맡긴다.
// 장바구니는 사람마다 다르고 브라우저에 있으므로, 서버는 '빈 틀'만 그리고 내용은 브라우저에서 채워진다.
//
// 5-2: 수량 변경·삭제·합계·사진은 모두 CartContents 안에 있다. 이 파일은 제목(h1)과 metadata만 정한다.

export const metadata: Metadata = {
  title: '장바구니',
  // 사람마다 내용이 다른 페이지라 검색 결과에 나올 이유가 없다
  robots: { index: false },
}

export default function CartPage() {
  return (
    <>
      <h1 className={styles.title}>장바구니</h1>
      {/* 주문 Server Action을 props로 넘긴다 (Step 9-3) — 서버 컴포넌트는 Server Action을 클라이언트 컴포넌트에 넘길 수 있다 */}
      <CartContents placeOrder={placeOrderAction} />
    </>
  )
}
