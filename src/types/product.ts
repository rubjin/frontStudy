// 상품 데이터의 '모양'을 정의한 타입 (Step 3-1, TypeScript 도입)
//
// 왜 타입이 필요한가?
// - JS에서는 product.prcie 처럼 오타를 내도 실행해 보기 전까지 모른다.
// - 타입을 정해 두면 에디터가 즉시 빨간 줄로 알려 주고, 자동완성도 된다.
// - 여러 파일(데이터, 필터, 카드...)이 같은 모양을 쓰므로 한 곳에 모아 두고 import 한다.
//
// interface: 객체가 어떤 필드를 어떤 타입으로 가져야 하는지 적는 '설계도'
export interface Product {
  id: number
  name: string
  /** 가격(원). 계산·정렬을 위해 숫자로 저장. 표시는 formatPrice로 */
  price: number
  category: string
  /** 평점 0~5 */
  rating: number
  /** 재고 수량. 0이면 품절 */
  stock: number
}
