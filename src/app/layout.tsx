import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Header from '@/components/Header'
import './globals.css'

// 루트 레이아웃 — 모든 페이지를 감싸는 공통 틀 (Step 3-1, Vite의 App.jsx + index.html 역할)
//
// Next.js App Router의 규칙
// - src/app/ 안의 '폴더 구조 = 주소'다. react-router의 <Routes>/<Route>를 직접 쓰지 않는다.
//     app/page.tsx                 → "/"
//     app/products/[id]/page.tsx   → "/products/3"  ([id]가 react-router의 :id)
//     app/not-found.tsx            → 없는 주소일 때
// - layout.tsx는 페이지가 바뀌어도 다시 만들어지지 않고 유지된다. → 헤더처럼 공통 부분을 둔다.
// - 이 파일이 <html>, <body>를 직접 그린다. (Vite에서는 index.html에 있던 부분)
//
// 이 컴포넌트는 '서버 컴포넌트'다 ('use client'가 없음)
// - 서버에서 HTML로 미리 그려서 보내므로 첫 화면이 빠르고, 검색엔진이 내용을 읽을 수 있다.
// - 대신 useState, onClick 같은 브라우저 기능은 못 쓴다. 그런 부분은 Header처럼 따로 뺀다.

// metadata: <title>, <meta name="description"> 등 <head> 안의 태그를 만들어 준다. (예전 index.html의 <head>)
//
// 페이지별 metadata 규칙
// - 각 page.tsx / not-found.tsx에서 metadata를 내보내면, 이 레이아웃의 값 위에 '덮어쓴다'.
//   (적지 않은 항목은 레이아웃 값을 그대로 물려받는다)
// - title.template: 자식 페이지가 title: '페이지를 찾을 수 없습니다'만 적어도
//   '%s' 자리에 들어가서 '페이지를 찾을 수 없습니다 | Shoppr'가 된다. → 사이트 이름을 페이지마다 반복하지 않는다.
// - title.default: 자식 페이지가 title을 안 적었을 때 쓰는 값. (template을 쓰려면 꼭 있어야 한다)
//   홈("/")은 title을 따로 적지 않아서 이 값이 쓰인다.
//
// 왜 페이지마다 제목이 달라야 하나?
// - 브라우저 탭·방문 기록·북마크에서 페이지를 구분할 수 있다.
// - 스크린리더는 페이지를 옮길 때 <title>을 먼저 읽어 준다. (접근성: WCAG 2.4.2 페이지 제목)
// - 검색 결과에 보이는 제목이 된다. (SEO)
//
// openGraph: 카카오톡·슬랙 등에 링크를 붙였을 때 보이는 미리보기 카드 정보.
// ※ 미리보기 이미지(og:image)는 절대 주소가 필요해서, 배포 주소가 생기는 Step 11에서 metadataBase와 함께 추가한다.
export const metadata: Metadata = {
  title: {
    template: '%s | Shoppr',
    default: 'Shoppr — 상품 목록 쇼핑몰',
  },
  description: '검색·카테고리 필터·정렬을 지원하는 상품 목록 쇼핑몰 UI — 프론트엔드 포트폴리오',
  openGraph: {
    siteName: 'Shoppr',
    locale: 'ko_KR',
    type: 'website',
  },
}

// children: 현재 주소에 맞는 page.tsx가 이 자리에 들어온다. (react-router의 <Routes> 자리)
// Readonly<{ children: ReactNode }>: props를 읽기만 한다는 타입. ReactNode는 'JSX로 그릴 수 있는 모든 것'
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // lang="ko": 스크린리더가 한국어 발음으로 읽게 한다 (예전 index.html은 "en"이었다)
    // suppressHydrationWarning: Header가 브라우저에서 class="dark"를 붙여도 경고를 내지 않게 한다
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </body>
    </html>
  )
}
