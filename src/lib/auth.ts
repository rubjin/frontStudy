import 'server-only'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/db'

// 로그인(인증) 설정 — 서버 전용 (Step 9-1, Better Auth)
//
// 인증 라이브러리를 쓰는 이유 (Next.js 공식 문서도 직접 구현보다 라이브러리를 권한다)
// - 로그인은 작은 실수가 바로 보안 사고가 된다: 비밀번호를 그대로 저장, 쿠키를 자바스크립트가 읽을 수 있게 설정,
//   다른 사이트에서 보낸 요청(CSRF)을 그냥 받기, 로그인 시도를 무한히 허용 …
// - Better Auth는 이것들을 기본값으로 막아 준다
//   · 비밀번호: Node.js 내장 scrypt로 '해시'(되돌릴 수 없는 값)만 저장 — DB가 털려도 원래 비밀번호는 모른다
//   · 세션 쿠키: httpOnly(자바스크립트로 못 읽음 → XSS로 훔쳐 가기 어려움) + SameSite=Lax + 배포 시 Secure(HTTPS만)
//   · 요청 출처 확인: BETTER_AUTH_URL(.env)에서 온 요청만 받는다
//   · 같은 IP의 반복 시도 제한(rate limit) — 배포 모드에서 켜진다
//
// 세션 방식: 데이터베이스 세션
// - 로그인하면 Session 표에 행이 생기고, 브라우저 쿠키에는 그 행을 찾는 token만 들어간다.
// - 요청이 오면 쿠키의 token으로 Session을 찾아 누구인지 안다. 로그아웃 = 그 행을 지운다(즉시 무효).
//
// 누가 이 파일을 쓰나?
// - app/api/auth/[...all]/route.ts — 브라우저의 로그인 상태 확인·로그아웃 요청을 받는 API
// - app/(auth)/actions.ts — 회원가입·로그인 Server Action
// - (9-2) 페이지·Server Action의 권한 검사

export const auth = betterAuth({
  // 사용자·세션을 우리 DB(Prisma)에 저장한다. 테이블은 schema.prisma의 User·Session·Account·Verification
  database: prismaAdapter(prisma, { provider: 'sqlite' }),

  // 이메일 + 비밀번호 로그인. (GitHub·Google 로그인은 각 서비스에 앱 등록이 필요해서 지금은 쓰지 않는다)
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // 가입하면 바로 로그인된 상태로 (이메일 인증 메일은 보내지 않는다 — 메일 서버가 필요)
    autoSignIn: true,
  },

  // 사용자 표에 우리 필드 추가 (Step 9-2) — Better Auth 기본 필드(이름·이메일 …) 말고 우리 서비스에 필요한 것
  // - role: 'user' | 'admin'. 세션을 꺼내면 session.user.role로 함께 온다
  // - input: false → 회원가입 요청에 role을 넣어 보내도 무시한다. (넣으면 누구나 'admin'으로 가입할 수 있다!)
  //   관리자 지정은 서버에서만: npm run auth:make-admin -- 이메일
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
    },
  },

  // nextCookies: Server Action 안에서 Better Auth를 부를 때 응답 쿠키(로그인 쿠키)가 실제 브라우저에 실리게 한다.
  // 플러그인 배열의 '마지막'에 둬야 한다 (Better Auth 문서)
  plugins: [nextCookies()],
})

/** 로그인한 사용자의 세션 (없으면 null) — auth.api.getSession의 결과 타입 */
export type AuthSession = typeof auth.$Infer.Session
