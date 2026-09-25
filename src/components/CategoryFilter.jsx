function CategoryFilter({ categories, value, onChange }) {
  return (
    <div role="group" aria-label="카테고리 필터" className="mb-6 flex flex-wrap gap-2">
      {categories.map((category) => {
        const selected = category === value
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              selected
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter
