import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CartProvider } from '@/components/CartProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { QueryProvider } from '@/components/QueryProvider'
import Header from '@/components/Header'
import { SITE_NAME, formatTitle } from '@/lib/site'
import { themeInitScript } from '@/lib/theme'
// 한글 웹폰트 Pretendard (Step 3-2)
// dynamic subset: 폰트 파일(2MB)을 약 90조각으로 나눠 두고, CSS의 unicode-range로
// '화면에 실제로 나온 글자가 들어 있는 조각'만 브라우저가 내려받는다. → 한글 폰트를 가볍게 쓰는 실무 표준 방법
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
// 전역 스타일: 테마 색상 변수, 리셋, body 기본값 (Step 3-2에서 globals.css → styles/globals.scss)
import '@/styles/globals.scss'
import styles from './layout.module.scss'

// 루트 레이아웃 — 모든 페이지를 감싸는 공통 틀 (Step 3-1, Vite의 App.jsx + index.html 역할)
//
// Next.js App Router의 규칙
// - src/app/ 안의 '폴더 구조 = 주소'다. react-router의 <Routes>/<Route>를 직접 쓰지 않는다.
//     app/(catalog)/page.tsx       → "/"  (괄호 폴더 = 라우트 그룹, 주소에 안 나타남. Step 4-3)
//     app/products/[id]/page.tsx   → "/products/3"  ([id]가 react-router의 :id)
//     app/not-found.tsx            → 없는 주소일 때
// - layout.tsx는 페이지가 바뀌어도 다시 만들어지지 않고 유지된다. → 헤더처럼 공통 부분을 둔다.
// - 이 파일이 <html>, <body>를 직접 그린다. (Vite에서는 index.html에 있던 부분)
//
// 이 컴포넌트는 '서버 컴포넌트'다 ('use client'가 없음)
// - 서버에서 HTML로 미리 그려서 보내므로 첫 화면이 빠르고, 검색엔진이 내용을 읽을 수 있다.
// - 대신 useState, onClick 같은 브라우저 기능은 못 쓴다. 그런 부분은 ThemeToggle(다크 모드 버튼)처럼 작은 'use client' 컴포넌트로 따로 뺀다.

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
    // formatTitle('%s') → '%s | Shoppr'. error 페이지의 <title>과 같은 형식을 쓰려고 함수로 만든다 (lib/site.ts)
    template: formatTitle('%s'),
    default: `${SITE_NAME} — 상품 목록 쇼핑몰`,
  },
  description: '검색·카테고리 필터·정렬을 지원하는 상품 목록 쇼핑몰 UI — 프론트엔드 포트폴리오',
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
}

// children: 현재 주소에 맞는 page.tsx가 이 자리에 들어온다. (react-router의 <Routes> 자리)
// Readonly<{ children: ReactNode }>: props를 읽기만 한다는 타입. ReactNode는 'JSX로 그릴 수 있는 모든 것'
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // lang="ko": 스크린리더가 한국어 발음으로 읽게 한다 (예전 index.html은 "en"이었다)
    // suppressHydrationWarning: <html> 태그 '한 단계'의 속성이 서버 HTML과 달라도 경고를 내지 않게 한다
    // - 하이드레이션: 서버가 보낸 HTML에 브라우저의 React가 이벤트를 연결하는 과정. 이때 두 결과가 다르면 경고한다.
    // - <html>은 React보다 먼저 바뀌는 경우가 있다.
    //   · 브라우저 확장 프로그램(다크 리더, 번역기 등)이 속성을 추가할 때
    //   · Step 3-2: 새로고침 때 다크 모드 깜빡임을 막으려고, React보다 먼저 실행되는 스크립트가 data-theme을 붙일 때
    // - 자식 태그의 차이는 여전히 경고하므로 진짜 버그를 가리지 않는다. 경고를 끄는 도구라 이 태그에만 쓴다.
    // ※ Step 3-2부터 실제로 필요하다: 아래 <script>가 서버 HTML에 없던 data-theme="dark"를 <html>에 붙이기 때문.
    //   이 속성을 지우고 다크 모드로 새로고침하면 콘솔에 하이드레이션 경고가 뜬다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 다크 모드 깜빡임 방지 스크립트 (Step 3-2, lib/theme.ts)
            <head>에 넣어서 화면(body)이 그려지기 전에 실행되게 한다.
            dangerouslySetInnerHTML: 문자열을 태그 안에 그대로 넣는 React 문법.
            이름이 무서운 이유는 사용자가 입력한 값을 넣으면 XSS 공격에 뚫리기 때문이다.
            여기는 우리가 직접 쓴 고정 문자열이라 안전하다. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {/* 장바구니 상태 (Step 5-1): 헤더(개수)와 페이지(담기 버튼·장바구니 화면)가 함께 써야 해서 둘을 모두 감싼다.
            CartProvider는 클라이언트 컴포넌트지만, children으로 넣은 Header·페이지는 서버 컴포넌트 그대로다. */}
        {/* 토스트 알림 (Step 5-4): CartProvider보다 바깥에 둔다 — 장바구니가 불러오면서 '수량 조정' 알림을 띄우기 때문
            (Context는 자기보다 바깥(위)의 Provider만 꺼낼 수 있다) */}
        {/* TanStack Query (Step 7-1): 서버 데이터 캐시. CartProvider가 쓰므로 가장 바깥 */}
        <QueryProvider>
          <ToastProvider>
            <CartProvider>
              <Header />
              <main className={styles.main}>{children}</main>
            </CartProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
