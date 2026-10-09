import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Proxy — 페이지를 그리기 전에 먼저 실행되는 '문지기' (Step 9-2)
//
// proxy.ts란? (Next.js 16에서 middleware.ts의 새 이름)
// - src/proxy.ts에 두면 matcher에 맞는 요청이 들어올 때 페이지·레이아웃보다 먼저 실행된다.
// - 여기서 redirect하면 페이지를 그리지도 않고 바로 다른 주소로 보낸다 → 빠르다.
//
// 여기서 하는 일: 로그인 쿠키가 '아예 없으면' 로그인 페이지로 (?next=원래 주소)
// - getSessionCookie: 쿠키가 '있는지'만 본다. DB를 조회하지 않아 빠르다.
// - 그래서 이건 '낙관적 검사'(optimistic check)다. 쿠키가 있어도 만료·위조·관리자 아님일 수 있다.
//   → 진짜 검사는 페이지·레이아웃·Server Action에서 lib/session.ts(DB 조회)로 다시 한다.
//   Next.js 문서: "Proxy는 첫 관문일 뿐, 유일한 방어선이어서는 안 된다."
//   Better Auth 문서도 쿠키만 보는 검사에 "THIS IS NOT SECURE!"라고 적어 두었다.
//
// 그럼 왜 두나?
// - 로그인 안 한 사람(쿠키 없음)이 대부분이라, 이들을 페이지를 그리기 전에 바로 돌려보내면 서버 일이 줄고 빠르다.
// - 레이아웃은 지금 주소를 몰라 ?next를 '관리 목록'으로만 줄 수 있지만, proxy는 요청 주소를 알아서 정확히 돌려보낸다.
//   (/admin/products/5/edit에서 로그인하면 그 페이지로 다시 온다)

export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname + search)
  return NextResponse.redirect(loginUrl)
}

// matcher: 로그인이 필요한 주소에서만 실행한다 (모든 요청에서 돌면 이미지·CSS 요청까지 검사하게 된다)
// :path* = 그 아래 모든 경로. (9-3에서 주문 관련 주소를 더한다)
export const config = {
  matcher: ['/admin/:path*'],
}
