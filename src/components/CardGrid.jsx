import Card from './Card'

function CardGrid({ products, query }) {
  if (products.length === 0) {
    const keyword = query.trim()
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {keyword ? <>&lsquo;{keyword}&rsquo;에 대한 검색 결과가 없습니다</> : '조건에 맞는 상품이 없습니다'}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          다른 키워드로 검색하거나 카테고리를 바꿔 보세요.
        </p>
      </div>
    )
  }

  return (
    <>
      <p aria-live="polite" className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        총 {products.length}개의 상품
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <li key={product.id}>
            <Card product={product} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default CardGrid
