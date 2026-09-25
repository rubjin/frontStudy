import { formatPrice } from '../lib/format'

// 상품 카드 한 장 (Step 1)
//
// Step 1 이전에는 name, price를 각각 props로 받았지만,
// 이제는 상품 객체(product) 하나를 통째로 받는다.
// → 상품 필드가 늘어나도 부모 쪽 코드를 고칠 필요가 없다.
function Card({ product }) {
  // 구조 분해 할당: product.name, product.price ... 를 짧은 변수로 꺼낸다
  const { name, price, category, rating, stock } = product
  // 재고 0 → 품절. 조건을 이름 있는 변수로 만들어 두면 JSX가 읽기 쉬워진다
  const soldOut = stock === 0

  return (
    // 카드처럼 그 자체로 의미가 완결되는 콘텐츠는 div 대신 article을 쓴다 (시맨틱 마크업)
    <article className="group h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 transition-all duration-300">
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
        {name}
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
