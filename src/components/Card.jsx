import { formatPrice } from '../lib/format'

function Card({ product }) {
  const { name, price, category, rating, stock } = product
  const soldOut = stock === 0

  return (
    <article className="group h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 transition-all duration-300">
      <div className="relative aspect-square mb-4 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <span aria-hidden="true" className="text-4xl text-primary-500 dark:text-primary-400 font-bold opacity-50">
          {name.charAt(0)}
        </span>
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
          {formatPrice(price)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span aria-hidden="true">★</span> {rating.toFixed(1)}
          <span className="sr-only">5점 만점에 {rating.toFixed(1)}점</span>
        </p>
      </div>
    </article>
  )
}

export default Card
