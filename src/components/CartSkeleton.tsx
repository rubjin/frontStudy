import { Skeleton } from './ui/Skeleton'
import { toRem } from '@/lib/units'
import styles from './CartContents.module.scss'

// 장바구니 화면의 스켈레톤 (Step 5-3)
//
// 언제 보이나?
// - 서버 HTML과 브라우저 첫 화면. 서버는 localStorage를 볼 수 없어서 장바구니가 비었는지 아닌지 '모른다'.
// - CartProvider가 저장된 값을 불러오면(hydrated) 실제 목록 또는 '비어 있음'으로 바뀐다. 보통 한두 프레임이다.
// - 이게 없으면 상품이 담겨 있어도 새로고침할 때마다 "장바구니가 비어 있습니다"가 번쩍 보였다 사라진다.
//
// 크기 맞추기: CartContents.module.scss의 실제 클래스(.layout, .item, .thumb ...)를 그대로 써서
// 배치·반응형(모바일 두 줄 ↔ 넓은 화면 한 줄)이 진짜 화면과 같게 했다. (CatalogSkeleton과 같은 방식)
// 상품 줄 수는 알 수 없으니 2줄을 보여 준다. 실제 개수와 다르면 그만큼은 높이가 바뀐다.
//
// 주의: .heading·.summaryRow는 display: flex다. flex 안에 Skeleton을 바로 넣으면 Skeleton 자체가 flex 항목이 되어
// 높이가 조각 높이(0.8em)로 줄어든다. <span>으로 한 번 감싸면 span이 글자 줄(line-height) 높이를 가져서 실제 글자와 같아진다.
// (처음엔 감싸지 않아 목록이 13.6px, 요약 상자가 11.2px 낮았다 — 실제 화면과 크기를 비교해서 찾음)
//
// 접근성: role="status" + sr-only 문장으로 한 번만 알리고, 회색 조각은 aria-hidden

const ROW_COUNT = 2

// 버튼 높이 (ui/Button.module.scss)
// - 수량 −/+ (secondary, icon): 여백 8px × 2 + 아이콘 16px + 테두리 1px × 2
// - 삭제 ✕ (ghost, icon): 테두리 없음
// - 쇼핑 계속하기 (secondary, md): 여백 8px × 2 + 줄 높이 20px + 테두리 1px × 2
// 테두리는 rem으로 바꾸지 않고 calc로 더한다 (CatalogSkeleton과 같은 이유)
const STEPPER_BUTTON = `calc(${toRem(32)} + 2px)`
const REMOVE_BUTTON = toRem(32)
const CONTINUE_BUTTON = `calc(${toRem(36)} + 2px)`
// 수량 칸 폭 = 버튼 2개 + 숫자 칸 32px + 간격 4px × 2
const STEPPER_WIDTH = `calc(${toRem(32 * 2 + 32 + 4 * 2)} + 4px)`

function CartSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">장바구니를 불러오는 중입니다.</span>

      <div aria-hidden="true" className={styles.layout}>
        <div>
          <p className={styles.heading}>
            <span>
              <Skeleton width={toRem(96)} />
            </span>
          </p>
          <ul className={styles.list}>
            {Array.from({ length: ROW_COUNT }, (_, index) => (
              <li key={index} className={styles.item}>
                <div className={styles.thumb}>
                  <Skeleton block height="100%" radius="lg" className={styles.thumbFill} />
                </div>
                <div className={styles.info}>
                  <p>
                    <Skeleton width="60%" />
                  </p>
                  <p className={styles.price}>
                    <Skeleton width={toRem(72)} />
                  </p>
                </div>
                <div className={styles.quantityArea}>
                  <Skeleton width={STEPPER_WIDTH} height={STEPPER_BUTTON} />
                </div>
                <p className={styles.subtotal}>
                  <Skeleton width={toRem(88)} />
                </p>
                <div className={styles.remove}>
                  <Skeleton width={REMOVE_BUTTON} height={REMOVE_BUTTON} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.summary}>
          <p className={styles.summaryTitle}>
            <Skeleton width={toRem(72)} />
          </p>
          <div className={styles.summaryList}>
            <p className={styles.summaryRow}>
              <span>
                <Skeleton width={toRem(48)} />
              </span>
              <span>
                <Skeleton width={toRem(32)} />
              </span>
            </p>
            <p className={styles.summaryRow}>
              <span>
                <Skeleton width={toRem(48)} />
              </span>
              <span className={styles.total}>
                <Skeleton width={toRem(112)} />
              </span>
            </p>
          </div>
          <Skeleton block height={CONTINUE_BUTTON} />
        </div>
      </div>
    </div>
  )
}

export default CartSkeleton
