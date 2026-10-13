import type { Metadata } from 'next'
import OrderList from '@/components/OrderList'
import { getMyOrders } from '@/lib/orders'
import { requireSession } from '@/lib/session'
import styles from './page.module.scss'

// 내 주문 목록 — 주소 "/orders" (Step 9-3)
//
// 로그인이 꼭 필요한 페이지
// - proxy.ts가 쿠키가 없는 사람을 먼저 로그인 페이지로 보낸다(빠른 1차 검사).
// - requireSession: 쿠키가 있어도 세션이 진짜인지 DB로 확인하고, 아니면 로그인 페이지로 (9-2 DAL)
// - getMyOrders(사용자 id): 그 사용자의 주문만 — 남의 주문이 섞일 수 없다
//
// 쿠키를 읽으므로 요청마다 만들어진다(ƒ). 사람마다 내용이 다른 페이지라 당연하다.

export const metadata: Metadata = {
  title: '내 주문',
  robots: { index: false }, // 사람마다 다른 내용 — 검색 결과에 나올 이유가 없다
}

export default async function OrdersPage() {
  const session = await requireSession('/orders')
  const orders = await getMyOrders(session.user.id)

  return (
    <>
      <h1 className={styles.title}>내 주문</h1>
      <OrderList orders={orders} />
    </>
  )
}
