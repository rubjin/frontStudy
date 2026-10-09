import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, type AuthSession } from '@/lib/auth'

// 로그인·권한 확인 — 서버 전용 '데이터 접근 계층(DAL)' (Step 9-2)
//
// Next.js 공식 문서(authentication)가 권하는 방식: 권한 검사를 '데이터 가까이' 한 곳에 모은다.
// - 페이지·레이아웃·Server Action이 모두 이 함수들을 거친다 → 검사 방법이 하나뿐이라 빠뜨리거나 다르게 짤 일이 없다.
// - proxy.ts(주소 앞단의 빠른 검사)는 '쿠키가 있는지'만 본다. 진짜 검사(세션이 유효한지, 관리자인지)는 여기서 한다.
//   proxy만 믿으면 안 되는 이유: Server Action은 페이지 주소와 상관없이 직접 호출할 수 있다(8-3에서 확인).
//
// 역할(role)은 사용자 표의 열이다 (lib/auth.ts의 additionalFields, schema.prisma의 User.role)

export type Role = 'user' | 'admin'

// 지금 요청의 세션 (로그인 안 했으면 null)
// cache(): 한 번의 요청(화면 하나를 그리는 동안) 안에서는 결과를 재사용한다.
// 레이아웃·페이지·컴포넌트가 각각 불러도 DB 조회는 한 번. 다음 요청에서는 새로 조회한다.
export const getSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() })
})

export function isAdmin(session: AuthSession | null): boolean {
  return session?.user.role === 'admin'
}

// 로그인 페이지 주소 (?next = 로그인 뒤 돌아올 곳)
export function loginPath(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`
}

// 로그인이 꼭 필요한 페이지에서 — 안 했으면 로그인 페이지로 보내고, 했으면 세션을 돌려준다
// next: 지금 페이지 주소 (로그인 뒤 돌아오도록)
export async function requireSession(next: string): Promise<AuthSession> {
  const session = await getSession()
  if (!session) redirect(loginPath(next))
  return session
}

// Server Action용 관리자 확인 — 화면 이동 없이 true/false만 (액션은 결과 문구로 알린다)
export async function canManageProducts(): Promise<boolean> {
  return isAdmin(await getSession())
}
