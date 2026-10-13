// 주문 데이터의 모양 (Step 9-3)
//
// 주문 상품(OrderLine)은 주문 당시의 이름·가격을 복사해 둔 '스냅숏'이다. (schema.prisma의 OrderItem 주석)
// 장바구니(CartItem: id와 수량만)와 반대인 이유: 영수증은 나중에 가격이 바뀌어도 그대로여야 한다.

export interface OrderLine {
  /** 원래 상품 id. 상품이 삭제됐으면 null (그래도 주문 기록은 남는다) */
  productId: number | null
  name: string
  /** 주문 당시 단가(원) */
  price: number
  quantity: number
  imageSrc: string | null
}

export interface Order {
  id: number
  /** 총 금액(원) — 서버가 DB 가격으로 계산한 값 */
  total: number
  createdAt: Date
  items: OrderLine[]
}

// 주문하기에서 서버가 돌려주는 '주문할 수 없는 상품' 정보
export interface OrderProblem {
  productId: number
  /** 화면에 보여 줄 문구 — 예) 'Apple Airpods: 재고가 2개 남았습니다.' */
  message: string
}
