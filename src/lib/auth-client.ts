import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '@/lib/auth'

// 브라우저용 로그인 도우미 (Step 9-1, Better Auth)
//
// lib/auth.ts(서버 전용)와 짝. 브라우저 코드('use client')는 이 파일로 /api/auth/* 를 부른다.
// - authClient.useSession(): 지금 로그인한 사용자 { data, isPending } — 헤더의 UserMenu
// - authClient.signOut(): 로그아웃
//
// baseURL을 적지 않으면 지금 페이지와 같은 주소(origin)의 /api/auth로 요청한다.
// (Storybook에서는 MSW가 이 요청을 가로챈다 — src/mocks/handlers.ts)
//
// inferAdditionalFields<typeof auth>() (Step 9-2): 서버 설정에 더한 사용자 필드(role)를 브라우저 쪽 타입에도 알려 준다
// → session.user.role을 타입 에러 없이 쓸 수 있다.
// import type: 타입만 가져온다. 빌드하면 사라지므로 서버 전용 파일(lib/auth.ts)의 코드가 브라우저로 오지 않는다
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})
