import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { fetchProduct, fetchProducts } from '@/lib/api'
import { PRODUCTS_PAGE_SIZE, type CatalogFilters } from '@/lib/catalogParams'

// 쿼리 정의 모음 — '어떤 키로, 어떻게 가져오는지' (Step 7-1)
//
// 쿼리 키(queryKey): 캐시에서 데이터를 찾는 이름. 배열로 쓰고, 앞에서부터 넓은 → 좁은 순서로 적는다.
//   ['products']                     상품 관련 전부 (한꺼번에 무효화할 때)
//   ['products', 'detail', 3]        상품 3번 하나
//   ['products', 'list', {필터}]     이 필터 조건의 목록 (Step 7-2) — 객체도 키가 될 수 있다(내용이 같으면 같은 키)
// 같은 키 = 같은 데이터. 두 컴포넌트가 같은 키를 쓰면 요청은 한 번만 나가고 결과를 나눠 쓴다.
//
// queryOptions(): 키와 가져오는 함수(queryFn)를 한 묶음으로 만든다.
// → useQuery(productQueries.detail(3)), queryClient.fetchQuery(productQueries.detail(3)) 처럼 어디서나 같은 정의를 쓴다.
//   키를 손으로 여러 번 적다가 오타가 나서 캐시를 못 나눠 쓰는 실수를 막는다. 데이터 타입도 따라온다.
//
// queryFn이 받는 signal: TanStack Query가 요청을 취소할 때 쓰는 AbortSignal.
// 6-3에서 직접 만든 AbortController를 이제 라이브러리가 대신 관리한다.

// 목록 키에 넣을 필터를 정리한다 — 검색어 앞뒤 공백 제거
// '무선'과 '무선 '이 다른 키가 되면 같은 결과를 두 번 요청한다. 서버(미리 받기)와 브라우저가 같은 키를 만들어야 하는 이유도 있다
function normalizeFilters(filters: CatalogFilters): CatalogFilters {
  return { ...filters, query: filters.query.trim() }
}

export const productQueries = {
  all: ['products'] as const,
  // 상품 목록 (Step 7-2) → 7-3에서 '나눠 받는 목록'(무한 쿼리)으로
  // infiniteQueryOptions: 페이지를 차례로 이어 붙이는 쿼리. 캐시에는 { pages: [1페이지 응답, 2페이지 응답, ...] }가 쌓인다
  // - initialPageParam: 첫 페이지 번호
  // - getNextPageParam: 마지막으로 받은 응답을 보고 다음 페이지 번호를 정한다. undefined면 '더 없음'(hasNextPage = false)
  //   → 서버가 알려 주는 nextPage를 그대로 쓴다. '다음이 있는지'는 데이터를 가진 서버가 판단하는 게 정확하다
  list: (filters: CatalogFilters) => {
    const normalized = normalizeFilters(filters)
    return infiniteQueryOptions({
      queryKey: [...productQueries.all, 'list', normalized] as const,
      queryFn: ({ pageParam, signal }) =>
        fetchProducts(normalized, { page: pageParam, size: PRODUCTS_PAGE_SIZE }, signal),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    })
  },
  detail: (id: number) =>
    queryOptions({
      queryKey: [...productQueries.all, 'detail', id] as const,
      queryFn: ({ signal }) => fetchProduct(id, signal),
      // 이미 실패한 쿼리를 새 컴포넌트가 쓰기 시작할 때 자동으로 또 요청하지 않는다.
      // CartProvider의 재고 확인이 실패(자동 재시도 포함 2번)한 직후 /cart가 열리면, 기본값(true)은 2번을 더 요청해서
      // 실패 화면이 2초 늦게 뜬다. 실패는 바로 보여 주고, 다시 받을지는 사용자가 '다시 시도'로 정한다.
      retryOnMount: false,
    }),
}
