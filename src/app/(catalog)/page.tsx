import { Suspense } from 'react'
import { connection } from 'next/server'
import ProductCatalog from '@/components/ProductCatalog'
import CatalogSkeleton from '@/components/CatalogSkeleton'

// 홈 = 상품 목록 페이지 — 주소 "/" (Step 3-1)
//
// Next.js에서는 app/page.tsx 파일이 곧 "/" 주소의 페이지다. (파일 기반 라우팅)
// Step 4-3: app/(catalog)/page.tsx로 옮겼다. 괄호 폴더(라우트 그룹)는 주소에 나타나지 않으므로 주소는 그대로 "/"다.
//           목록 로딩 화면(loading.tsx)을 홈에만 적용하려고 묶었다. 이유는 같은 폴더의 loading.tsx 주석 참고.
// 이 파일은 서버 컴포넌트로 두고, 상호작용이 필요한 목록 화면은 ProductCatalog('use client')에 맡긴다.
//
// Step 4-2: await connection() — 이 페이지는 요청이 올 때마다 서버에서 만든다 (빌드 결과 ○ → ƒ)
// - ProductCatalog가 주소의 쿼리(useSearchParams)로 필터를 정한다. 쿼리는 요청이 와야 알 수 있다.
// - 빌드할 때 미리 만들어 두면(○) 쿼리를 모르니까, Next.js는 목록 부분을 HTML에서 빼고
//   브라우저에서 그리게 한다(아래 Suspense의 스켈레톤이 먼저 보임).
//   → 첫 HTML에 상품 목록이 없으면 검색엔진·느린 기기에 불리하다. 쇼핑몰 목록은 HTML에 있어야 한다.
// - connection()은 "요청이 들어올 때까지 기다린다 = 미리 만들지 말라"는 표시다.
//   요청마다 만들지만, 상품 12개를 거르는 정도라 서버 부담은 거의 없다.
// - 상세 페이지(products/[id])는 쿼리가 없어서 그대로 미리 만든다(●).
//
// <Suspense fallback={...}> (Step 3-2 보강)
// - 안쪽 컴포넌트가 '아직 준비되지 않았다'고 알리면, 준비될 때까지 fallback(목록 모양의 스켈레톤)을 보여 준다.
// - 지금은 서버에서 목록을 바로 만들어서 스켈레톤이 보이지 않는다.
//   Step 6에서 API로 상품을 받아오는 동안 보이게 된다.
//   (다른 페이지에서 홈으로 '이동'할 때의 로딩 화면은 같은 폴더의 loading.tsx가 맡는다 — Step 4-3)
// - useSearchParams를 쓰는 컴포넌트는 Suspense 안에 두는 것이 Next.js 권장이다.
export default async function HomePage() {
  await connection()

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
