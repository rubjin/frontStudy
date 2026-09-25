export const ALL_CATEGORIES = '전체'

export function getCategories(products) {
  return [ALL_CATEGORIES, ...new Set(products.map((p) => p.category))]
}

export function filterProducts(products, { query, category }) {
  const keyword = query.trim().toLowerCase()

  return products.filter((p) => {
    const matchesKeyword =
      !keyword ||
      p.name.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword)
    const matchesCategory = category === ALL_CATEGORIES || p.category === category

    return matchesKeyword && matchesCategory
  })
}
