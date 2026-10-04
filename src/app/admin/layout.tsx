import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { connection } from 'next/server'
import StatusView from '@/components/StatusView'
import { ButtonLink } from '@/components/ui/Button'
import { isAdminEnabled } from '@/lib/admin'

// 관리 화면 공통 레이아웃 — 주소 "/admin/..." (Step 8-3)
//
// 이 폴더 아래 모든 페이지에 적용된다(layout은 하위 페이지를 감싼다).
// 여기서 한 번 '열어도 되는지' 검사해서, 페이지마다 같은 검사를 반복하지 않는다. (Server Action은 actions.ts에서 따로 검사)
// Step 9에서 로그인 검사로 바뀐다 → lib/admin.ts
//
// await connection(): '요청이 올 때마다' 검사하게 한다
// - 이게 없으면 /admin/products/new처럼 요청 정보를 쓰지 않는 페이지는 빌드 때 미리 만들어진다(○).
//   그러면 검사도 빌드 때 한 번만 실행되어, 빌드한 환경에 따라 아무에게나 열리거나 항상 막힌다. (8-3 빌드에서 발견)
// - 권한 검사는 반드시 요청마다 — 미리 만든 페이지에 권한 검사를 맡기지 않는다.
//
// 막혔을 때 notFound()가 아니라 안내 화면을 직접 그리는 이유
// - 처음엔 notFound()를 썼는데, Next.js 16.3.6 버그(#99287, Step 4-1)가 여기서 재현됐다:
//   404 화면이 HTML에 들어가지 않고 빈 <html id="__next_error__">만 나간다(lang 없음, JS 꺼지면 빈 화면).
// - 그래서 StatusView로 '열려 있지 않다'고 정직하게 안내한다. 상태 코드는 200이지만 robots noindex라 검색에 안 나온다.
//   Step 9에서 proxy.ts로 로그인 페이지로 보내거나(redirect) 403을 돌려주도록 바꾼다.
// - 안내 화면이어도 하위 페이지(children)를 그리지 않으므로 관리 데이터는 전혀 나가지 않는다.

export const metadata: Metadata = {
  // 관리 화면은 검색 결과에 나올 이유가 없다
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection()

  if (!isAdminEnabled()) {
    return (
      <StatusView
        title="관리 화면이 열려 있지 않습니다"
        description="로그인 기능이 준비되면 관리자만 이용할 수 있습니다."
      >
        <ButtonLink href="/">홈으로 가기</ButtonLink>
      </StatusView>
    )
  }
  return children
}
