import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import ProductCatalog from '@/components/ProductCatalog'
import CatalogSkeleton from '@/components/CatalogSkeleton'
import { getCategories, getProducts } from '@/lib/products'
import { parseCatalogParams } from '@/lib/catalogParams'
import { makeQueryClient } from '@/lib/queryClient'
import { productQueries } from '@/lib/queries'

// 홈 = 상품 목록 페이지 — 주소 "/" (Step 3-1)
//
// Next.js에서는 app/page.tsx 파일이 곧 "/" 주소의 페이지다. (파일 기반 라우팅)
// Step 4-3: app/(catalog)/page.tsx로 옮겼다. 괄호 폴더(라우트 그룹)는 주소에 나타나지 않으므로 주소는 그대로 "/"다.
//           목록 로딩 화면(loading.tsx)을 홈에만 적용하려고 묶었다. 이유는 같은 폴더의 loading.tsx 주석 참고.
// 이 파일은 서버 컴포넌트로 두고, 상호작용이 필요한 목록 화면은 ProductCatalog('use client')에 맡긴다.
//
// 요청마다 만든다 (ƒ)
// - Step 4-2: 쿼리마다 목록이 달라서 connection()으로 '미리 만들지 말라'고 표시했다.
// - Step 7-2: 이제 searchParams(주소 쿼리)를 직접 읽는다. 쿼리를 읽는 페이지는 자동으로 요청마다 만들어져서 connection()을 뺐다.
//
// Step 6-2: 서버 컴포넌트에서 데이터 받기 + Suspense 스트리밍 (CatalogData를 Suspense 안에)
//
// Step 7-2: 서버에서 미리 받아 TanStack Query 캐시에 넣어 넘기기 (prefetch + hydration)
// - ProductCatalog는 이제 useQuery로 목록을 받는다. 그냥 두면 첫 화면에서 브라우저가 API를 요청하므로
//   첫 HTML에 목록이 없고(스켈레톤), 요청이 한 번 더 왕복한다.
// - 그래서 서버가 '브라우저가 쓸 것과 같은 키'로 미리 받아 캐시에 넣고(prefetchQuery),
//   그 캐시를 직렬화(dehydrate)해서 HydrationBoundary로 넘긴다. 브라우저의 캐시가 그 데이터로 시작한다(hydrate).
//   → 첫 HTML에 목록이 있고, 브라우저는 staleTime(60초) 동안 다시 요청하지 않는다.
// - 서버는 자기 API를 fetch하지 않고 lib/products를 직접 부른다(6-1 원칙). 키는 같고 가져오는 방법(queryFn)만 다르다.
export default async function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <>
      {/* 페이지마다 h1이 하나 있어야 스크린리더 사용자가 페이지 주제를 알 수 있다.
          화면에는 로고가 제목 역할을 하므로 sr-only로 눈에는 숨기고 보조기기에만 제공한다. */}
      <h1 className="sr-only">상품 목록</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogData searchParams={searchParams} />
      </Suspense>
    </>
  )
}

// 데이터를 받아서 목록 화면에 넘기는 서버 컴포넌트 (Step 6-2, 7-2)
// searchParams를 Promise 그대로 받아 여기서 await한다 → 기다리는 동안 Suspense의 스켈레톤이 먼저 나간다
async function CatalogData({ searchParams }: { searchParams: PageProps<'/'>['searchParams'] }) {
  // { q: '무선', category: ['a', 'b'] } 같은 객체 → URLSearchParams (같은 키가 여러 번이면 첫 값)
  const raw = await searchParams
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first !== undefined) params.set(key, first)
  }

  // 카테고리 검사(없는 카테고리 → '전체')에는 카테고리 목록이 필요하지만, 그걸 먼저 기다리면 워터폴이 된다.
  // 그래서 목록은 검사 없이(null) 바로 요청하고 카테고리와 '동시에' 기다린다(Promise.all).
  // 정상적인 주소라면 브라우저가 검사 후 만드는 키와 같다. (없는 카테고리 주소면 키가 달라 브라우저가 한 번 더 요청 — 드문 경우)
  const filters = parseCatalogParams(params, null)
  const queryClient = makeQueryClient()
  const [categories] = await Promise.all([
    getCategories(),
    // ...productQueries.list(filters): 키는 브라우저와 같게, queryFn만 서버용(직접 호출)으로 바꾼다
    queryClient.prefetchQuery({
      ...productQueries.list(filters),
      queryFn: () => getProducts({ filters: { ...filters, query: filters.query.trim() } }),
    }),
  ])

  return (
    // dehydrate: 캐시 내용을 브라우저로 보낼 수 있는 데이터로 바꾼다
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductCatalog categories={categories} />
    </HydrationBoundary>
  )
}
