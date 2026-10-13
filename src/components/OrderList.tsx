import { ButtonLink } from './ui/Button'
import { formatDateTime, formatPrice } from '@/lib/format'
import type { Order } from '@/types/order'
import styles from './OrderList.module.scss'

// 내 주문 목록 (Step 9-3)
//
// 페이지(app/orders/page.tsx)가 로그인한 사용자의 주문만 골라 넘겨준다. 이 컴포넌트는 그리기만 한다(서버 컴포넌트).
//
// props
// - orders: 최신순 주문들. 비어 있으면 '아직 주문한 상품이 없습니다' 안내
//
// 마크업
// - 주문 하나 = article(독립된 내용 덩어리) + h2(주문 번호). 페이지 h1('내 주문') 아래 단계라 제목 순서가 맞다.
// - '주문 상세' 링크 이름에 주문 번호를 넣는다 — 스크린리더의 링크 목록에서 '주문 상세'만 여러 개 나오면 구별이 안 된다.

interface OrderListProps {
  orders: Order[]
}

// "Apple Airpods 외 2개" — 첫 상품 이름 + 나머지 종류 수
function summarize(order: Order): string {
  const [first, ...rest] = order.items
  if (!first) return '상품 없음'
  return rest.length > 0 ? `${first.name} 외 ${rest.length}개` : first.name
}

function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>아직 주문한 상품이 없습니다.</p>
        <ButtonLink href="/">상품 보러 가기</ButtonLink>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {orders.map((order) => (
        <li key={order.id}>
          <article className={styles.card}>
            <div className={styles.head}>
              <h2 className={styles.title}>주문 번호 {order.id}</h2>
              <time dateTime={order.createdAt.toISOString()} className={styles.date}>
                {formatDateTime(order.createdAt)}
              </time>
            </div>
            <p className={styles.summary}>{summarize(order)}</p>
            <div className={styles.foot}>
              <p className={styles.total}>{formatPrice(order.total)}</p>
              <ButtonLink href={`/orders/${order.id}`} variant="secondary">
                주문 상세<span className="sr-only"> (주문 번호 {order.id})</span>
              </ButtonLink>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

export default OrderList
