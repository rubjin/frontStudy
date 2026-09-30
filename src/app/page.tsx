import { Suspense } from 'react'
import ProductCatalog from '@/components/ProductCatalog'
import CatalogSkeleton from '@/components/CatalogSkeleton'

// 홈 = 상품 목록 페이지 — 주소 "/" (Step 3-1)
//
// Next.js에서는 app/page.tsx 파일이 곧 "/" 주소의 페이지다. (파일 기반 라우팅)
// 이 파일은 서버 컴포넌트로 두고, 상태가 필요한 목록 화면은 ProductCatalog('use client')에 맡긴다.
//
// <Suspense fallback={...}> (Step 3-2 보강)
// - 안쪽 컴포넌트가 '아직 준비되지 않았다'고 알리면(suspend), 준비될 때까지 fallback을 대신 보여 준다.
// - fallback으로 목록 화면과 같은 모양의 스켈레톤(CatalogSkeleton)을 보여 준다.
// - 지금은 ProductCatalog가 기다릴 일이 없어서 스켈레톤이 보이지 않는다. 미리 자리를 만들어 둔 것이다.
//   · Step 4: 검색·필터를 URL로 옮기면서 useSearchParams를 쓰면, Next.js 규칙상 이 Suspense가 꼭 필요하다.
//     (정적 페이지에서 Suspense 없이 쓰면 빌드 에러)
//   · Step 6: API로 상품을 받아오는 동안 스켈레톤이 보인다.
// - Suspense는 '필요한 부분만' 감싼다. h1은 바깥에 있어서 기다리는 동안에도 먼저 보인다.
export default function HomePage() {
  return (
    <>
      {/* 페이지마다 h1이 하나 있어야 스크린리더 사용자가 페이지 주제를 알 수 있다.
          화면에는 로고가 제목 역할을 하므로 sr-only로 눈에는 숨기고 보조기기에만 제공한다. */}
      <h1 className="sr-only">상품 목록</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <ProductCatalog />
      </Suspense>
    </>
  )
}
