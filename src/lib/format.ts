// 화면에 보여 줄 형태로 값을 바꾸는 함수 모음 (Step 1)
//
// 데이터에는 가격을 숫자(189000)로 저장하고, 화면에 보여 줄 때만 '₩189,000'으로 바꾼다.
// 숫자로 저장해야 정렬(Step 2)이나 합계 계산(장바구니, Step 5)을 할 수 있기 때문이다.
// 처음부터 '₩189,000' 같은 문자열로 저장하면 계산할 때마다 다시 숫자로 바꿔야 한다.

// Intl.NumberFormat: 브라우저에 내장된 숫자 포맷 기능
// - 'ko-KR': 한국 표기 방식 (천 단위 콤마)
// - style: 'currency', currency: 'KRW': 원화 기호(₩)를 붙인다
// 포맷터를 만드는 비용이 있으므로 파일 맨 위에서 한 번만 만들고 재사용한다.
const priceFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
})

// 예) formatPrice(189000) → '₩189,000'
// (price: number): string → 숫자를 받아 문자열을 돌려준다는 타입 표시 (Step 3-1)
export function formatPrice(price: number): string {
  return priceFormatter.format(price)
}

// 날짜·시각 표시 (Step 9-3, 주문 일시) — 예) 2026. 10. 9. 오후 6:30
// Intl.DateTimeFormat: 나라별 날짜 표기를 브라우저·Node가 알아서 만들어 준다 (formatPrice의 Intl.NumberFormat과 같은 방식)
// timeZone을 서울로 고정 — 서버(배포 시 보통 UTC)와 브라우저가 같은 시각을 보여 주게
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
})

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date)
}
