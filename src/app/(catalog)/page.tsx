import { Suspense } from 'react'
import { connection } from 'next/server'
import ProductCatalog from '@/components/ProductCatalog'
import CatalogSkeleton from '@/components/CatalogSkeleton'
import { getCategories, getProducts } from '@/lib/products'

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
// - 상세 페이지(products/[id])는 쿼리가 없어서 그대로 미리 만든다(●).
//
// Step 6-2: 서버 컴포넌트에서 데이터 받기
// - 상품·카테고리를 서버에서 lib/products.ts 함수로 '직접' 받는다. 자기 API(/api/products)를 fetch하지 않는다.
//   (이미 서버 안이라 HTTP 왕복이 필요 없다 — lib/products.ts 주석)
// - 받은 데이터는 props로 ProductCatalog에 넘긴다. 브라우저 JS 번들에는 더 이상 상품 데이터가 없다.
//   (props는 HTML 안의 RSC 데이터로 함께 전송된다. 첫 화면 HTML에 목록이 그대로 들어간다 → 검색엔진에 유리)
//
// <Suspense fallback={...}> — 스트리밍
// - 데이터를 받는 부분(CatalogData)을 Suspense로 감쌌다. 데이터가 느리면(MOCK_API_DELAY_MS)
//   ① 서버가 먼저 h1 + 스켈레톤을 브라우저로 보내고 ② 데이터가 준비되면 실제 목록을 이어서 보낸다(스트리밍).
//   → 사용자는 빈 흰 화면 대신 바로 화면 틀을 본다.
// - 데이터를 page에서 바로 await하면 Suspense '바깥'에서 기다리게 되어, 데이터가 올 때까지 아무것도 보내지 못한다.
//   그래서 기다리는 부분을 별도 컴포넌트(CatalogData)로 빼서 Suspense '안'에 둔다.
// - 다른 페이지에서 홈으로 '이동'할 때의 로딩 화면은 같은 폴더의 loading.tsx가 맡는다 (Step 4-3)
// - 데이터 받기가 실패하면 같은 폴더의 error.tsx(Step 4-3b)가 보인다.
export default async function HomePage() {
  await connection()

  return (
    <>
      {/* 페이지마다 h1이 하나 있어야 스크린리더 사용자가 페이지 주제를 알 수 있다.
          화면에는 로고가 제목 역할을 하므로 sr-only로 눈에는 숨기고 보조기기에만 제공한다. */}
      <h1 className="sr-only">상품 목록</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogData />
      </Suspense>
    </>
  )
}

// 데이터를 받아서 목록 화면에 넘기는 서버 컴포넌트 (Step 6-2)
// async 컴포넌트: 서버 컴포넌트는 async 함수로 만들고 안에서 await할 수 있다. (클라이언트 컴포넌트는 안 된다)
async function CatalogData() {
  // Promise.all: 두 요청을 '동시에' 보내고 둘 다 끝날 때까지 기다린다.
  // 하나씩 await하면 상품(1초) → 카테고리(1초) = 2초. 동시에 하면 1초. (서로 상관없는 요청은 순서대로 기다리지 않는다)
  const [{ items }, categories] = await Promise.all([getProducts(), getCategories()])
  return <ProductCatalog products={items} categories={categories} />
}
