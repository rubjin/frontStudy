import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types/product'
import styles from './Card.module.scss'

// 상품 카드 한 장 (Step 1)
//
// Step 1 이전에는 name, price를 각각 props로 받았지만,
// 이제는 상품 객체(product) 하나를 통째로 받는다.
// → 상품 필드가 늘어나도 부모 쪽 코드를 고칠 필요가 없다.
//
// Step 3-1: 카드 전체를 눌러 상세 페이지로 이동할 수 있게 했다.
// 방법: '늘린 링크(stretched link)' 패턴
// - 링크(<Link>)는 상품명에만 건다.
// - 링크의 ::after 가상 요소를 position: absolute; inset: 0 으로 늘려서 카드 전체를 덮게 한다. (Card.module.scss .link)
//   (가상 요소의 기준점은 relative가 있는 article)
// 왜 카드 전체를 <a>로 감싸지 않나?
// - 스크린리더가 카드 안의 모든 글자(카테고리, 가격, 평점...)를 링크 이름으로 한꺼번에 읽어서 듣기 힘들다.
// - 이 방식이면 링크 이름은 '상품명'만 되고, 클릭 영역은 카드 전체가 된다.
//
// Step 3-1 (Next.js 전환)
// - react-router의 <Link to>가 아니라 next/link의 <Link href>를 쓴다. 역할은 같다.
// - props 타입(CardProps)을 정의했다. product에 Product 모양이 아닌 값을 넘기면 에디터가 에러를 낸다.
//
// props
// - product: 보여 줄 상품 객체
interface CardProps {
  product: Product
}

function Card({ product }: CardProps) {
  // 구조 분해 할당: product.name, product.price ... 를 짧은 변수로 꺼낸다
  const { name, price, category, rating, stock } = product
  // 재고 0 → 품절. 조건을 이름 있는 변수로 만들어 두면 JSX가 읽기 쉬워진다
  const soldOut = stock === 0

  return (
    // 카드처럼 그 자체로 의미가 완결되는 콘텐츠는 div 대신 article을 쓴다 (시맨틱 마크업)
    // 키보드 포커스가 안쪽 링크에 오면 카드 전체에 테두리 → Card.module.scss의 .card:has(:focus-visible)
    <article className={styles.card}>
      {/* 이미지 대신 쓰는 자리 표시 영역. relative는 품절 오버레이의 기준점 */}
      <div className={styles.thumb}>
        {/* 장식용 글자라서 aria-hidden으로 스크린리더가 읽지 않게 한다 */}
        <span aria-hidden="true" className={styles.initial}>
          {name.charAt(0)}
        </span>
        {/* 조건부 렌더링: soldOut이 true일 때만 && 뒤의 요소가 그려진다 */}
        {soldOut && (
          <span className={styles.soldOut}>
            품절
          </span>
        )}
      </div>

      <p className={styles.category}>
        {category}
      </p>
      <h3 className={styles.name}>
        {/* .link: ::after를 카드 크기만큼 늘려 카드 전체를 클릭 영역으로 (늘린 링크) */}
        <Link href={`/products/${product.id}`} className={styles.link}>
          {name}
        </Link>
      </h3>

      <div className={styles.meta}>
        <p className={styles.price}>
          {/* 숫자 가격을 '₩189,000' 형태로 바꿔서 보여 준다 */}
          {formatPrice(price)}
        </p>
        <p className={styles.rating}>
          {/* 별 기호는 화면용(aria-hidden), 문장은 스크린리더용(sr-only)으로 나눠 제공 */}
          {/* toFixed(1): 4 → '4.0'처럼 소수점 한 자리로 맞춘다 */}
          <span aria-hidden="true">★</span> {rating.toFixed(1)}
          <span className="sr-only">5점 만점에 {rating.toFixed(1)}점</span>
        </p>
      </div>
    </article>
  )
}

export default Card
