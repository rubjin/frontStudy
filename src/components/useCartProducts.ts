'use client'

import { useQueries } from '@tanstack/react-query'
import { productQueries } from '@/lib/queries'
import { ApiError } from '@/lib/api'
import type { Product } from '@/types/product'

// 장바구니에 담긴 상품들의 정보(이름·가격·사진·재고)를 API로 받아 오는 훅 (Step 6-3 → 7-1 TanStack Query로 교체)
//
// 왜 브라우저에서 받나? (6-2 목록은 서버에서 받았다)
// - 장바구니 내용(어떤 상품 id인지)은 브라우저의 localStorage에만 있다. 서버는 모른다.
//
// 6-3에서 직접 만든 것 → 7-1에서 TanStack Query가 대신 하는 것
// | 6-3 직접 구현                         | 7-1                                      |
// | useState 4개 + useEffect + 계산       | useQueries 하나                           |
// | AbortController 직접                  | queryFn의 signal (라이브러리가 취소)       |
// | checkedIds로 '물어본 id' 기억          | 상품별 캐시 ['products','detail',id]       |
// | attempt를 올려 다시 시도               | refetch()                                 |
// | (못 함) CartProvider와 결과 나눠 쓰기   | 같은 키 → 요청 한 번, 결과 공유            |
//
// 상품별로 하나씩 요청하는 이유 (useQueries = 여러 개의 useQuery)
// - 키가 상품마다 따로라서: 수량을 바꾸거나 삭제해도 새 요청이 없고, 새로 담은 상품만 요청한다.
//   ['products','byIds','2,5'] 처럼 목록 하나로 묶으면 하나만 빼도 키가 바뀌어 전부 다시 받아야 한다.
// - CartProvider(재고 확인)가 같은 키로 미리 받아 두므로 /cart는 캐시에서 바로 그린다 → 6-3의 '같은 요청 2번'·워터폴 해결.
//
// 인자·반환은 6-3과 같다 (CartContents는 고칠 것이 없다)
// - ids, enabled → products, status('loading'|'error'|'success'), error, retry()

type Status = 'loading' | 'error' | 'success'

export function useCartProducts(ids: number[], enabled = true) {
  return useQueries({
    // 상품 id마다 쿼리 하나. enabled: false면 요청하지 않는다(장바구니를 불러오기 전)
    queries: ids.map((id) => ({ ...productQueries.detail(id), enabled })),
    // combine: 여러 쿼리의 결과를 화면에서 쓰기 좋은 하나의 값으로 합친다
    combine: (results) => {
      // data가 null(404, 판매 종료)인 것은 뺀다 → 화면에 줄이 생기지 않는다
      const products = results.flatMap((r) => (r.data ? [r.data] : [])) as Product[]
      const failed = results.filter((r) => r.isError)
      const error = (failed[0]?.error as ApiError | undefined) ?? null

      let status: Status = 'success'
      if (error) status = 'error'
      // isPending: 아직 데이터가 한 번도 없음 (enabled: false여도 true)
      else if (results.some((r) => r.isPending)) status = 'loading'

      return {
        products,
        status,
        error,
        // 실패한 것만 다시 요청
        retry: () => failed.forEach((r) => void r.refetch()),
      }
    },
  })
}
