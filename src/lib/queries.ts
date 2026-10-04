import { queryOptions } from '@tanstack/react-query'
import { fetchProduct } from '@/lib/api'

// 쿼리 정의 모음 — '어떤 키로, 어떻게 가져오는지' (Step 7-1)
//
// 쿼리 키(queryKey): 캐시에서 데이터를 찾는 이름. 배열로 쓰고, 앞에서부터 넓은 → 좁은 순서로 적는다.
//   ['products']                     상품 관련 전부 (한꺼번에 무효화할 때)
//   ['products', 'detail', 3]        상품 3번 하나
// 같은 키 = 같은 데이터. 두 컴포넌트가 같은 키를 쓰면 요청은 한 번만 나가고 결과를 나눠 쓴다.
//
// queryOptions(): 키와 가져오는 함수(queryFn)를 한 묶음으로 만든다.
// → useQuery(productQueries.detail(3)), queryClient.fetchQuery(productQueries.detail(3)) 처럼 어디서나 같은 정의를 쓴다.
//   키를 손으로 여러 번 적다가 오타가 나서 캐시를 못 나눠 쓰는 실수를 막는다. 데이터 타입도 따라온다.
//
// queryFn이 받는 signal: TanStack Query가 요청을 취소할 때 쓰는 AbortSignal.
// 6-3에서 직접 만든 AbortController를 이제 라이브러리가 대신 관리한다.

export const productQueries = {
  all: ['products'] as const,
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
