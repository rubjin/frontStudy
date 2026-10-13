import type { Metadata } from 'next'
import OrderDetail from '@/components/OrderDetail'
import StatusView from '@/components/StatusView'
import { ButtonLink } from '@/components/ui/Button'
import { getMyOrder } from '@/lib/orders'
import { requireSession } from '@/lib/session'
import styles from '../page.module.scss'

// 주문 상세 — 주소 "/orders/12" (Step 9-3). 주문 직후에는 "/orders/12?placed=1" (주문 완료 안내)
//
// 남의 주문을 볼 수 없게 (IDOR 막기)
// - 주문 번호는 1, 2, 3 … 순서라 쉽게 짐작할 수 있다. 번호만으로 찾으면 /orders/1 을 넣어 남의 주문을 볼 수 있다.
// - getMyOrder(내 id, 주문 번호): '내 주문 중에서' 찾는다. 남의 주문이면 없는 주문과 똑같이 안내한다
//   ('남의 것'이라고 알려 주면 그 번호의 주문이 있다는 사실이 드러난다).
//
// 없는 주문일 때 notFound() 대신 StatusView — Next.js 16.3.6 버그(#99287): page에서 notFound()를 부르면 404 HTML이 비어 나간다

export async function generateMetadata({ params }: PageProps<'/orders/[id]'>): Promise<Metadata> {
  const { id } = await params
  return { title: `주문 ${id}`, robots: { index: false } }
}

export default async function OrderPage({ params, searchParams }: PageProps<'/orders/[id]'>) {
  const { id } = await params
  const { placed } = await searchParams
  const session = await requireSession(`/orders/${id}`)

  // 주소의 번호 검사 — '0으로 시작하지 않는 숫자'만 (lib/products.ts의 getProduct와 같은 규칙)
  const order = /^[1-9]\d*$/.test(id) ? await getMyOrder(session.user.id, Number(id)) : undefined

  if (!order) {
    return (
      <StatusView code="404" title="주문을 찾을 수 없습니다" description="주소가 잘못되었거나 다른 계정의 주문입니다.">
        <ButtonLink href="/orders">내 주문 목록</ButtonLink>
      </StatusView>
    )
  }

  const justPlaced = placed === '1'
  return (
    <>
      <h1 className={styles.title}>{justPlaced ? '주문 완료' : '주문 상세'}</h1>
      <OrderDetail order={order} placed={justPlaced} />
    </>
  )
}
