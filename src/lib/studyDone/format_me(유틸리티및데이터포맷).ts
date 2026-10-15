//가격 포맷 (입력: number -> 반환 : string)
//날짜 포맷 (입력: Date -> 반환 : string)


//숫자 포맷터 객체 생성 후 참조 변수에 할당
const priceFormatter = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
})

//숫자를 받아 문자열을 돌려줌
export function formatPrice(price: number): string {
    return priceFormatter.format(price)
}

//날짜 포맷터 객체 생성 후 참조 변수에 할당
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul'
})

export function formatDateTime(date: Date): string {
    return dateTimeFormatter.format(date)
}