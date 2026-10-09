import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

// 로그인 API — /api/auth/* (Step 9-1, Better Auth)
//
// [...all]: '나머지 경로 전부'를 받는 동적 폴더(catch-all). /api/auth/get-session, /api/auth/sign-out … 이 모두 여기로 온다.
// 주소마다 route.ts를 만들지 않고, Better Auth가 경로를 보고 알맞은 기능을 실행한다.
//
// 브라우저에서 쓰는 것 (lib/auth-client.ts가 부른다)
// - GET  /api/auth/get-session  지금 로그인한 사용자 (헤더의 로그인 상태 표시)
// - POST /api/auth/sign-out     로그아웃
// 회원가입·로그인은 이 API 대신 Server Action(app/(auth)/actions.ts)으로 한다 — 입력값 검사·한글 문구를 우리가 정하려고.
export const { GET, POST } = toNextJsHandler(auth)
