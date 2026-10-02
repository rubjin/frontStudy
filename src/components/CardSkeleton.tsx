import clsx from 'clsx'
import { Skeleton } from './ui/Skeleton'
import { toRem } from '@/lib/units'
import styles from './Card.module.scss'

// 상품 카드 스켈레톤 (Step 3-2 보강)
//
// 핵심: 실제 Card와 '크기가 완전히 같아야' 한다.
// - 크기가 다르면 진짜 카드로 바뀌는 순간 레이아웃이 움직인다. (폰트 교체 때 본 레이아웃 이동과 같은 문제)
// - 그래서 치수를 따로 적지 않고 Card.module.scss의 클래스(.card, .thumb, .category ...)를 그대로 쓴다.
//   → 카드 디자인(여백, 비율, 글자 크기)이 바뀌면 스켈레톤도 자동으로 따라 바뀐다.
// - 글자 자리는 원래 글자 태그(.category, .name ...) 안에 Skeleton 조각을 넣는다.
//   조각은 줄 높이보다 낮게 그려지므로, 줄 높이 = 원래 글자 줄 높이가 그대로 유지된다.
//
// 카드와 다른 점
// - <article>, <h2>, <a> 대신 <div>, <p>를 쓴다. 아직 내용이 없는데 '제목'이나 '링크'로 읽히면 안 되기 때문이다.
// - .isSkeleton으로 hover 떠오르기 효과를 끈다.
function CardSkeleton() {
  return (
    <div className={clsx(styles.card, styles.isSkeleton)}>
      <div className={styles.thumb}>
        <Skeleton block height="100%" radius="lg" className={styles.thumbFill} />
      </div>
      <p className={styles.category}>
        <Skeleton width={toRem(48)} />
      </p>
      <p className={styles.name}>
        <Skeleton width="75%" />
      </p>
      <div className={styles.meta}>
        <p className={styles.price}>
          <Skeleton width={toRem(88)} />
        </p>
        <p className={styles.rating}>
          <Skeleton width={toRem(40)} />
        </p>
      </div>
    </div>
  )
}

export default CardSkeleton
