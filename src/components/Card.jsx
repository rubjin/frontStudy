import { Link } from 'react-router'
import { formatPrice } from '../lib/format'

// 상품 카드 한 장 (Step 1)
//
// Step 1 이전에는 name, price를 각각 props로 받았지만,
// 이제는 상품 객체(product) 하나를 통째로 받는다.
// → 상품 필드가 늘어나도 부모 쪽 코드를 고칠 필요가 없다.
//
// Step 3-1: 카드 전체를 눌러 상세 페이지로 이동할 수 있게 했다.
// 방법: '늘린 링크(stretched link)' 패턴
// - 링크(<Link>)는 상품명에만 건다.
// - 링크에 after:absolute after:inset-0 을 줘서, 보이지 않는 가상 요소가 카드 전체를 덮게 한다.
//   (가상 요소의 기준점은 relative가 있는 article)
// 왜 카드 전체를 <a>로 감싸지 않나?
// - 스크린리더가 카드 안의 모든 글자(카테고리, 가격, 평점...)를 링크 이름으로 한꺼번에 읽어서 듣기 힘들다.
// - 이 방식이면 링크 이름은 '상품명'만 되고, 클릭 영역은 카드 전체가 된다.
function Card({ product }) {
  // 구조 분해 할당: product.name, product.price ... 를 짧은 변수로 꺼낸다
  const { name, price, category, rating, stock } = product
  // 재고 0 → 품절. 조건을 이름 있는 변수로 만들어 두면 JSX가 읽기 쉬워진다
  const soldOut = stock === 0

  return (
    // 카드처럼 그 자체로 의미가 완결되는 콘텐츠는 div 대신 article을 쓴다 (시맨틱 마크업)
    // has-[:focus-visible]: 안쪽 링크에 키보드 포커스가 오면 카드 전체에 테두리(ring)를 그린다.
    //   → 키보드 사용자가 지금 어느 카드에 있는지 알 수 있다. (마우스 클릭 때는 안 보임)
    <article className="group relative h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500">
      {/* 이미지 대신 쓰는 자리 표시 영역. relative는 품절 오버레이의 기준점 */}
      <div className="relative aspect-square mb-4 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        {/* 장식용 글자라서 aria-hidden으로 스크린리더가 읽지 않게 한다 */}
        <span aria-hidden="true" className="text-4xl text-primary-500 dark:text-primary-400 font-bold opacity-50">
          {name.charAt(0)}
        </span>
        {/* 조건부 렌더링: soldOut이 true일 때만 && 뒤의 요소가 그려진다 */}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/60 text-sm font-semibold text-white">
            품절
          </span>
        )}
      </div>

      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        {category}
      </p>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {/* focus:outline-none: 링크 자체의 기본 포커스 선은 숨기고, 위의 카드 ring으로 대신 보여 준다 */}
        <Link to={`/products/${product.id}`} className="after:absolute after:inset-0 focus:outline-none">
          {name}
        </Link>
      </h3>

      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
          {/* 숫자 가격을 '₩189,000' 형태로 바꿔서 보여 준다 */}
          {formatPrice(price)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
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
