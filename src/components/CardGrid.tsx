import Card from './Card'
import type { Product } from '@/types/product'
import styles from './CardGrid.module.scss'

// 첫 화면에 보이는 카드 수(넓은 화면 4열 기준 첫 줄). 이 카드들의 이미지만 지연 없이 바로 불러온다.
const EAGER_COUNT = 4

// 상품 카드 목록 (Step 1에서 만들고 Step 2에서 역할을 줄임)
//
// Step 1에서는 이 컴포넌트가 직접 검색어로 목록을 걸러냈다.
// Step 2부터는 걸러내기를 App + filterProducts가 맡고,
// 여기서는 '받은 목록을 보여 주는 일'만 한다. (역할 분리)
//
// props
// - products: 이미 걸러진 상품 배열
// - query:    검색어 (결과가 없을 때 안내 문구에 쓰려고 받는다)
interface CardGridProps {
  products: Product[]
  query: string
}

function CardGrid({ products, query }: CardGridProps) {
  // 빈 상태 화면: 결과가 0개일 때 빈 화면 대신 이유와 다음 행동을 알려 준다.
  // 포트폴리오에서 '빈 상태/로딩/에러'까지 챙긴 UI는 좋은 인상을 준다.
  if (products.length === 0) {
    const keyword = query.trim()
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>
          {/* 검색어가 있으면 검색어를 보여 주고, 없으면(카테고리만 고른 경우) 일반 문구 */}
          {/* <>...</>는 Fragment: 불필요한 태그 없이 여러 요소를 묶을 때 쓴다 */}
          {keyword ? <>&lsquo;{keyword}&rsquo;에 대한 검색 결과가 없습니다</> : '조건에 맞는 상품이 없습니다'}
        </p>
        <p className={styles.emptyHint}>
          다른 키워드로 검색하거나 카테고리를 바꿔 보세요.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* aria-live="polite": 개수가 바뀌면 스크린리더가 하던 말을 끝낸 뒤 읽어 준다 */}
      <p aria-live="polite" className={styles.count}>
        총 {products.length}개의 상품
      </p>
      {/* 목록이므로 div 대신 ul/li를 쓴다 (시맨틱 마크업) */}
      <ul className={styles.grid}>
        {/* index: 몇 번째 카드인지. 첫 줄(최대 4개)만 이미지를 즉시 불러온다 (Step 3-2 보강) */}
        {products.map((product, index) => (
          // key는 index 대신 고유한 id를 쓴다.
          // index를 쓰면 필터로 순서가 바뀔 때 React가 항목을 헷갈릴 수 있다.
          <li key={product.id}>
            <Card product={product} eager={index < EAGER_COUNT} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default CardGrid
