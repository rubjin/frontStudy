import Image from 'next/image'
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
// Step 3-2 보강: 상품 이미지 (next/image)
// - 원본 크기·비율이 제각각(가로형, 세로형, 파노라마...)이어도 카드 모양은 항상 같아야 한다.
//   → 정사각형 틀(.thumb, aspect-ratio: 1) 안에 fill로 꽉 채우고, object-fit: cover로 넘치는 부분을 잘라 낸다.
//   (퍼블리셔에게 익숙한 background-size: cover 와 같은 동작을 <img>에 적용하는 것)
// - next/image를 쓰는 이유 (그냥 <img> 대신)
//   · 화면 크기에 맞는 크기로 자동 변환·압축해서 보낸다. (1600px 원본을 카드 크기 약 290px로)
//   · WebP 같은 가벼운 형식으로 바꿔 준다.
//   · 기본이 지연 로딩(loading="lazy") — 화면 밖 이미지는 스크롤해서 가까워질 때 받는다.
// - 이미지가 없는 상품은 예전처럼 상품명 첫 글자를 보여 준다.
//
// props
// - product: 보여 줄 상품 객체
// - eager:   true면 이미지를 즉시 불러온다. 첫 화면(첫 줄)에 보이는 카드에만 켠다.
//            화면 밖 이미지까지 즉시 받으면 오히려 첫 화면이 느려지므로 기본은 false(지연 로딩)
interface CardProps {
  product: Product
  eager?: boolean
}

// sizes: '이 이미지가 화면에서 실제로 몇 px 너비로 보이는지' 브라우저에 알려 주는 값
// - 브라우저는 이 값을 보고 Next.js가 만들어 둔 여러 크기 중 알맞은 것 하나만 받는다.
// - 없으면 fill 이미지는 화면 전체 너비(100vw)로 가정해서 필요 이상으로 큰 파일을 받는다.
// - 그리드 열 개수(CardGrid.module.scss)와 맞춘다: 1280px 이상 4열(카드 약 290px), 1024px 이상 3열, 640px 이상 2열, 그 아래 1열
const THUMB_SIZES = '(min-width: 1280px) 290px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'

function Card({ product, eager = false }: CardProps) {
  // 구조 분해 할당: product.name, product.price ... 를 짧은 변수로 꺼낸다
  const { name, price, category, rating, stock, image } = product
  // 재고 0 → 품절. 조건을 이름 있는 변수로 만들어 두면 JSX가 읽기 쉬워진다
  const soldOut = stock === 0

  return (
    // 카드처럼 그 자체로 의미가 완결되는 콘텐츠는 div 대신 article을 쓴다 (시맨틱 마크업)
    // 키보드 포커스가 안쪽 링크에 오면 카드 전체에 테두리 → Card.module.scss의 .card:has(:focus-visible)
    <article className={styles.card}>
      {/* 이미지 영역. relative는 fill 이미지와 품절 오버레이의 기준점 */}
      <div className={styles.thumb}>
        {image ? (
          <Image
            src={image.src}
            // alt="": 바로 아래에 상품명이 링크로 있어서, 이미지 설명이 같은 이름을 한 번 더 읽는 중복이 된다.
            // 이렇게 옆에 같은 정보가 있는 이미지는 '장식'으로 보고 빈 alt를 준다. (alt 속성 자체를 빼면 안 됨)
            // 상세 페이지처럼 이미지가 주인공인 곳에서는 상품명을 alt로 준다. (Step 4)
            alt=""
            // fill: width/height 대신 부모(.thumb)를 꽉 채운다. 부모에 position: relative와 크기가 있어야 한다.
            fill
            sizes={THUMB_SIZES}
            className={styles.image}
            loading={eager ? 'eager' : 'lazy'}
          />
        ) : (
          // 이미지가 없는 상품: 상품명 첫 글자. 장식용 글자라서 aria-hidden
          <span aria-hidden="true" className={styles.initial}>
            {name.charAt(0)}
          </span>
        )}
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
