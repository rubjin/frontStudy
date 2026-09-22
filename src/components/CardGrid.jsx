import { products } from '../data/products'
import Card from './Card'

function CardGrid({ query }) {
  const keyword = query.trim().toLowerCase()
  const visible = keyword
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword)
      )
    : products

  if (visible.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          &lsquo;{query.trim()}&rsquo;에 대한 검색 결과가 없습니다
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          다른 키워드로 검색하거나 카테고리명을 입력해 보세요.
        </p>
      </div>
    )
  }

  return (
    <>
      <p aria-live="polite" className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        총 {visible.length}개의 상품
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visible.map((product) => (
          <li key={product.id}>
            <Card product={product} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default CardGrid
