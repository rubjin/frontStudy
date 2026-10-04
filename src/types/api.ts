import type { Product } from './product'

// API 응답의 모양 (Step 6-1)
//
// 서버(Route Handler)와 브라우저(fetch하는 쪽)가 '같은 타입'을 import한다.
// → 서버에서 필드 이름을 바꾸면 브라우저 코드에서 바로 타입 에러가 난다. (따로 적으면 한쪽만 바뀌어 런타임에 깨진다)
//
// 목록 응답을 배열 하나([...])가 아니라 객체({ items, total })로 감싸는 이유:
// - 나중에 필드를 더할 수 있다. Step 7-3 더 보기(페이지 나누기)에서 '다음 페이지가 있는지'를 함께 보내야 한다.
//   처음부터 배열로 보내면 그때 응답 모양이 바뀌어 쓰는 쪽을 전부 고쳐야 한다.

/** GET /api/products */
export interface ProductListResponse {
  items: Product[]
  /** 조건에 맞는 전체 개수 */
  total: number
}

/** GET /api/categories */
export interface CategoryListResponse {
  items: string[]
}

/** 실패했을 때(4xx·5xx)의 응답 — 모든 API가 같은 모양으로 보낸다 */
export interface ApiErrorResponse {
  error: { message: string }
}
