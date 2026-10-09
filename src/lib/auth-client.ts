import { createAuthClient } from 'better-auth/react'

// 브라우저용 로그인 도우미 (Step 9-1, Better Auth)
//
// lib/auth.ts(서버 전용)와 짝. 브라우저 코드('use client')는 이 파일로 /api/auth/* 를 부른다.
// - authClient.useSession(): 지금 로그인한 사용자 { data, isPending } — 헤더의 UserMenu
// - authClient.signOut(): 로그아웃
//
// baseURL을 적지 않으면 지금 페이지와 같은 주소(origin)의 /api/auth로 요청한다.
// (Storybook에서는 MSW가 이 요청을 가로챈다 — src/mocks/handlers.ts)
export const authClient = createAuthClient()
