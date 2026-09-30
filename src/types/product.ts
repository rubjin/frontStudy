// 상품 데이터의 '모양'을 정의한 타입 (Step 3-1, TypeScript 도입)
//
// 왜 타입이 필요한가?
// - JS에서는 product.prcie 처럼 오타를 내도 실행해 보기 전까지 모른다.
// - 타입을 정해 두면 에디터가 즉시 빨간 줄로 알려 주고, 자동완성도 된다.
// - 여러 파일(데이터, 필터, 카드...)이 같은 모양을 쓰므로 한 곳에 모아 두고 import 한다.
//
// interface: 객체가 어떤 필드를 어떤 타입으로 가져야 하는지 적는 '설계도'

// 상품 이미지 정보 (Step 3-2 보강)
// 원본 크기(width, height)를 함께 두는 이유:
// - 이미지가 도착하기 전에도 브라우저가 '자리 크기'를 알 수 있어서, 로딩될 때 레이아웃이 밀리지 않는다. (CLS 방지)
// - 목록 카드는 정사각형 틀에 잘라 넣지만(fill), 상세 페이지(Step 4)는 원본 비율 그대로 보여 줄 때 이 값이 필요하다.
// - 실제 API(Step 6~)도 보통 이미지 주소와 크기를 함께 돌려준다.
export interface ProductImage {
  /** public/ 기준 경로 또는 이미지 주소 */
  src: string
  /** 원본 가로(px) */
  width: number
  /** 원본 세로(px) */
  height: number
}

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
  /** 대표 이미지. 없을 수도 있다(?) → 없으면 카드가 상품명 첫 글자로 대신 표시 */
  image?: ProductImage
}
