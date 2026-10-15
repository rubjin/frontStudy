import { isServer, QueryClient } from '@tanstack/react-query'

// TanStack Query의 QueryClient(캐시 저장소) 만들기 (Step 7-1)
//
// QueryClient = 요청 결과를 '키'별로 보관하는 저장소. 같은 키로 다시 요청하면 저장된 결과를 바로 쓴다.
//
// 기본 설정
// - staleTime 60초: 받은 데이터를 60초 동안은 '신선하다'고 본다 → 그동안 같은 키를 다시 써도 요청하지 않는다.
//   (기본값 0이면 컴포넌트가 새로 나타날 때마다 다시 요청한다. 상품 정보는 자주 바뀌지 않으니 60초)
//   서버에서 미리 받아 넘긴 데이터(7-2)를 브라우저가 바로 다시 요청하지 않게 하는 데도 필요하다.
// - retry 1: 실패하면 1번만 다시 시도 (기본 3번은 실패 화면이 뜨기까지 7초 가까이 걸린다)
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  })
}

// 브라우저에서는 하나만 만들어 계속 쓴다 (페이지를 옮겨도 캐시 유지)
let browserQueryClient: QueryClient | undefined

// 어디서 부르느냐에 따라 다르게 (TanStack Query 공식 Next.js 가이드 방식)
// - 서버: 요청마다 새로 만든다. 하나를 같이 쓰면 다른 사용자의 데이터가 섞일 수 있다.
// - 브라우저: 처음 한 번만 만든다. 렌더링 중에 새로 만들면 캐시가 매번 날아간다.
export function getQueryClient() {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
