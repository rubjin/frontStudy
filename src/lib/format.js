const priceFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
})

export function formatPrice(price) {
  return priceFormatter.format(price)
}
