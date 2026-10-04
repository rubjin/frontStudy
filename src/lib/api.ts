import { toCatalogSearch, type CatalogFilters } from '@/lib/catalogParams'
import type { Product } from '@/types/product'
import type { ApiErrorResponse, ProductListResponse } from '@/types/api'

// 브라우저에서 우리 API(/api/...)를 부르는 함수 모음 (Step 6-3)
//
// 서버 컴포넌트는 lib/products.ts(서버 전용)를 직접 부르고, 브라우저('use client')는 이 파일을 통해 fetch한다.
// fetch를 컴포넌트마다 직접 쓰지 않고 여기 모으는 이유
// - fetch는 404·500이어도 '성공'으로 끝난다(에러를 던지지 않는다). 매번 response.ok를 검사해야 하는데 빠뜨리기 쉽다.
// - 실패 응답({ error: { message } }, lib/apiResponse.ts)에서 문구를 꺼내는 방법을 한 곳에 둔다.
// - 주소·쿼리 만드는 방법이 한 곳에 있어 API가 바뀌면 여기만 고친다. (Step 7 TanStack Query도 이 함수들을 쓴다)

// API 실패를 나타내는 에러
// class ... extends Error: 기본 Error에 status(HTTP 상태 코드)를 더한 '우리만의 에러 종류'
// → 받는 쪽에서 error instanceof ApiError && error.status === 404 처럼 종류별로 다르게 처리할 수 있다
export class ApiError extends Error {
  /** HTTP 상태 코드. 서버에 닿지도 못했으면(네트워크 끊김) 0 */
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// JSON API 요청 → 성공하면 본문(T), 실패하면 ApiError를 던진다
// <T>: 제네릭 — '돌려줄 데이터의 타입'을 부르는 쪽에서 정한다. fetchJson<Product>('/api/products/1')
// signal: 요청 취소용 (AbortController, 아래 useCartProducts 주석)
export async function fetchJson<T>(url: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    // 취소(AbortError)는 실패가 아니라 '그만둔 것'이라 그대로 다시 던진다 (받는 쪽에서 무시)
    if (signal?.aborted) throw error
    // 서버에 닿지도 못함: 인터넷 끊김, 서버 꺼짐 등
    throw new ApiError(0, '네트워크 연결을 확인해 주세요.')
  }

  if (!response.ok) {
    // 실패 응답에서 문구 꺼내기. 본문이 JSON이 아닐 수도 있으니(프록시 오류 페이지 등) 실패하면 기본 문구
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new ApiError(response.status, body?.error?.message ?? '요청을 처리하지 못했습니다.')
  }
  return (await response.json()) as T
}

// 상품 목록 (Step 7-2, 목록 화면). GET /api/products?q=...&category=...&page=2&size=8
// 필터 쿼리는 목록 화면 주소와 같은 형식이라 주소를 만드는 함수(toCatalogSearch)를 그대로 쓴다
// paging (Step 7-3): 몇 번째 페이지를 몇 개씩
export async function fetchProducts(
  filters: CatalogFilters,
  paging: { page: number; size: number },
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const params = new URLSearchParams(toCatalogSearch(filters))
  params.set('page', String(paging.page))
  params.set('size', String(paging.size))
  return fetchJson<ProductListResponse>(`/api/products?${params}`, { signal })
}

// 상품 하나 (Step 7-1, 장바구니). GET /api/products/3
// 404(판매 종료 등으로 없는 상품)는 에러가 아니라 null — '없음'도 정상적인 답이다.
// (에러로 던지면 장바구니 전체가 '불러오지 못했습니다'가 된다. 없는 상품은 장바구니에서 빼면 된다)
export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product | null> {
  try {
    return await fetchJson<Product>(`/api/products/${id}`, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// 정해진 id의 상품들 (6-3 장바구니에서 썼다. 7-1부터는 상품별 캐시를 위해 fetchProduct를 쓴다)
// GET /api/products?ids=1,2,5
export async function fetchProductsByIds(ids: number[], signal?: AbortSignal): Promise<Product[]> {
  if (ids.length === 0) return []
  const params = new URLSearchParams({ ids: ids.join(',') })
  const data = await fetchJson<ProductListResponse>(`/api/products?${params}`, { signal })
  return data.items
}
