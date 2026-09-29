import ProductCatalog from '@/components/ProductCatalog'

// 홈 = 상품 목록 페이지 — 주소 "/" (Step 3-1)
//
// Next.js에서는 app/page.tsx 파일이 곧 "/" 주소의 페이지다. (파일 기반 라우팅)
// 이 파일은 서버 컴포넌트로 두고, 상태가 필요한 목록 화면은 ProductCatalog('use client')에 맡긴다.
export default function HomePage() {
  return (
    <>
      {/* 페이지마다 h1이 하나 있어야 스크린리더 사용자가 페이지 주제를 알 수 있다.
          화면에는 로고가 제목 역할을 하므로 sr-only로 눈에는 숨기고 보조기기에만 제공한다. */}
      <h1 className="sr-only">상품 목록</h1>
      <ProductCatalog />
    </>
  )
}
