import Image from 'next/image'
import Link from 'next/link'
import { ButtonLink } from './ui/Button'
import { formatDateTime, formatPrice } from '@/lib/format'
import type { Order } from '@/types/order'
import styles from './OrderDetail.module.scss'

// 주문 상세 — 주문 완료 화면 겸용 (Step 9-3)
//
// 페이지(app/orders/[id]/page.tsx)가 '내 주문인지' 확인하고 데이터를 넘겨준다. 이 컴포넌트는 그리기만 한다.
// 서버 컴포넌트다(상태·이벤트 없음) → 스토리에서 데이터만 바꿔 여러 상태를 볼 수 있다.
//
// props
// - order:  보여 줄 주문 (주문 당시 이름·가격이 복사된 스냅숏 — types/order.ts)
// - placed: 방금 주문했는지 (?placed=1) → 위에 '주문이 완료되었습니다' 안내
//
// 상품명 링크
// - 상품이 아직 있으면 상세로 링크, 삭제된 상품(productId: null)은 글자만. 주문 기록은 그대로 남는다.
// - 가격은 '주문 당시 가격'이다. 지금 상세 페이지 가격과 다를 수 있다 (영수증과 같다)

interface OrderDetailProps {
  order: Order
  placed?: boolean
}

// 썸네일 실제 크기 (OrderDetail.module.scss의 $thumb-size와 맞춘다)
const THUMB_SIZES = '64px'

function OrderDetail({ order, placed = false }: OrderDetailProps) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={styles.root}>
      {/* 방금 주문했을 때만. role="status": 페이지가 바뀐 뒤 스크린리더가 이 안내를 읽어 준다 */}
      {placed && (
        <p role="status" className={styles.placed}>
          주문이 완료되었습니다. 주문 내역은 ‘내 주문’에서 다시 볼 수 있습니다.
        </p>
      )}

      {/* dl: '이름 – 값' 짝 목록 (주문 번호: 12) */}
      <dl className={styles.meta}>
        <div>
          <dt>주문 번호</dt>
          <dd>{order.id}</dd>
        </div>
        <div>
          <dt>주문 일시</dt>
          {/* time: 기계가 읽을 수 있는 날짜(dateTime)와 사람이 읽는 글자를 함께 */}
          <dd>
            <time dateTime={order.createdAt.toISOString()}>{formatDateTime(order.createdAt)}</time>
          </dd>
        </div>
      </dl>

      <ul className={styles.list} aria-label="주문한 상품">
        {order.items.map((item, index) => (
          // 같은 상품이 한 주문에 두 줄로 들어가지 않지만(mergeOrderLines), 삭제된 상품은 productId가 null이라 index도 섞는다
          <li key={`${item.productId ?? 'deleted'}-${index}`} className={styles.item}>
            <div className={styles.thumb}>
              {item.imageSrc ? (
                <Image src={item.imageSrc} alt="" fill sizes={THUMB_SIZES} className={styles.image} />
              ) : (
                <span aria-hidden="true">{item.name.charAt(0)}</span>
              )}
            </div>
            <div className={styles.info}>
              {item.productId ? (
                <Link href={`/products/${item.productId}`} className={styles.name}>
                  {item.name}
                </Link>
              ) : (
                <span className={styles.name}>
                  {item.name} <span className={styles.ended}>(판매 종료)</span>
                </span>
              )}
              <p className={styles.unit}>
                {formatPrice(item.price)} × {item.quantity}개
              </p>
            </div>
            <p className={styles.subtotal}>
              <span className="sr-only">소계 </span>
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className={styles.summary}>
        <div>
          <dt>상품 수</dt>
          <dd>{totalQuantity}개</dd>
        </div>
        <div className={styles.totalRow}>
          <dt>총 결제 금액</dt>
          <dd className={styles.total}>{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <ButtonLink href="/orders" variant="secondary">
          내 주문 목록
        </ButtonLink>
        <ButtonLink href="/">쇼핑 계속하기</ButtonLink>
      </div>
    </div>
  )
}

export default OrderDetail
