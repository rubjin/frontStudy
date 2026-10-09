import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import StatusView from '@/components/StatusView'
import { ButtonLink } from '@/components/ui/Button'
import { getSession, isAdmin, loginPath } from '@/lib/session'

// 관리 화면 공통 레이아웃 — 주소 "/admin/..." (Step 8-3, 9-2에서 로그인·역할 검사로 교체)
//
// 이 폴더 아래 모든 페이지에 적용된다(layout은 하위 페이지를 감싼다).
// 여기서 한 번 '열어도 되는지' 검사해서, 페이지마다 같은 검사를 반복하지 않는다. (Server Action은 actions.ts에서 따로 검사)
//
// Step 9-2: 임시 스위치(lib/admin.ts, ADMIN_ENABLED) → 로그인·역할 검사(lib/session.ts)
// 1) 로그인 안 함 → 로그인 페이지로 (로그인 뒤 관리 목록으로 돌아오게 ?next)
//    (proxy.ts가 쿠키가 없으면 먼저 돌려보내지만, 쿠키가 있어도 만료·위조일 수 있어 여기서 진짜로 확인한다)
// 2) 로그인했지만 관리자가 아님 → '권한 없음' 안내 (로그인 페이지로 보내면 이미 로그인한 사람은 어리둥절하다)
// 3) 관리자 → 하위 페이지
//
// 요청마다 검사: getSession()이 요청 헤더(쿠키)를 읽으므로 이 아래 페이지는 모두 요청마다 만들어진다(ƒ).
// (8-3에서는 쿠키를 안 읽어서 await connection()으로 직접 표시했다 — 미리 만든 페이지에 권한 검사를 맡기지 않는다)
//
// 막혔을 때 notFound()·forbidden() 대신 안내 화면을 직접 그리는 이유
// - Next.js 16.3.6 버그(#99287, Step 4-1): layout에서 notFound()를 부르면 404 화면이 HTML에 들어가지 않는다.
// - forbidden()(403 화면)은 아직 실험 기능(authInterrupts)이다.
// - StatusView로 정직하게 안내한다. 하위 페이지(children)를 그리지 않으므로 관리 데이터는 전혀 나가지 않는다.

export const metadata: Metadata = {
  // 관리 화면은 검색 결과에 나올 이유가 없다
  robots: { index: false, follow: false },
}

// 로그인 뒤 돌아올 곳 — 레이아웃은 지금 주소를 모르므로 관리 화면의 첫 페이지로
const ADMIN_HOME = '/admin/products'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect(loginPath(ADMIN_HOME))

  if (!isAdmin(session)) {
    return (
      <StatusView
        code="403"
        title="관리자만 이용할 수 있습니다"
        description="관리자 계정으로 로그인했는지 확인해 주세요."
      >
        <ButtonLink href="/">홈으로 가기</ButtonLink>
      </StatusView>
    )
  }
  return children
}
