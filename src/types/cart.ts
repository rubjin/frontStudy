// 장바구니 데이터의 모양 (Step 5-1)
//
// 왜 상품 정보(이름·가격·사진)를 통째로 넣지 않고 id와 수량만 두나?
// - 장바구니에 담은 뒤 가격이 바뀌면, 복사해 둔 가격은 옛날 값으로 남는다. (계산이 틀어진다)
// - id만 두고 화면에 보여 줄 때 상품 데이터에서 찾으면 항상 지금 값이 나온다.
//   → '같은 정보는 한 곳에만' (Step 4-2의 '주소가 유일한 원본'과 같은 생각)
// - 저장할 값이 작아서 Step 5-3에서 localStorage에 넣기도 가볍다.

export interface CartItem {
  /** 상품 id (Product.id) */
  productId: number
  /** 담은 수량. 1 이상, 재고 이하 */
  quantity: number
}

export interface CartState {
  items: CartItem[]
}
