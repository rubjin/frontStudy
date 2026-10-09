'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button, ButtonLink } from './ui/Button'
import { Skeleton } from './ui/Skeleton'
import { useToast } from './ui/Toast'
import { authClient } from '@/lib/auth-client'
import { toRem } from '@/lib/units'
import styles from './UserMenu.module.scss'

// 헤더의 로그인 상태 — '로그인' 링크 / '이름 + 로그아웃' (Step 9-1)
//
// 왜 서버(Header)가 아니라 브라우저에서 로그인 상태를 확인하나?
// - 헤더는 모든 페이지에 들어간다. 서버에서 쿠키(headers())를 읽으면 '모든 페이지'가 요청마다 만들어지는 페이지가 되어
//   미리 만들어 둔 상품 상세 194개(●)가 사라진다. 로그인 여부는 사람마다 다르니 미리 만들 수 없는 정보다.
// - 그래서 페이지는 모두에게 같은 HTML로 두고, 사람마다 다른 부분(로그인 상태)만 브라우저에서 채운다.
//   장바구니 배지(CartLink)와 같은 방식이다. (Step 5-3: 브라우저에만 있는 값은 첫 렌더에 쓰지 않는다)
//
// authClient.useSession(): GET /api/auth/get-session 으로 지금 로그인한 사용자를 받는다
// - isPending(확인 중) → 회색 자리(스켈레톤). '로그인' 버튼을 먼저 보여 주면 로그인한 사람에게 잘못된 정보가 번쩍인다
//   (장바구니의 '아직 모름'과 '비어 있음'을 구분한 것과 같은 이유)
// - data 없음 → '로그인' 링크 / data 있음 → 이름 + '로그아웃'
//
// 로그인·가입 뒤 다시 확인하기
// - 로그인은 Server Action(서버)에서 일어나서, 브라우저의 useSession은 바뀐 것을 모른다.
// - 로그인·가입 페이지에서 다른 페이지로 넘어갈 때(= 성공해서 이동했을 때) refetch()로 다시 묻는다.
//
// Step 9-2: 관리자(role === 'admin')에게만 '관리' 링크 → /admin/products
// - 링크를 숨기는 건 '편의'일 뿐 보안이 아니다. 주소를 직접 쳐도 관리 화면은 admin/layout.tsx가 막는다.
//
// 로그아웃 뒤 포커스
// - '로그아웃' 버튼이 '로그인' 링크로 바뀌며 사라진다 → 포커스가 body로 튕긴다(5-2 원칙)
//   → 새로 나타난 '로그인' 링크로 포커스를 옮긴다.

// 여기서 다른 페이지로 넘어가면 로그인 상태가 바뀌었을 수 있다
const AUTH_PATHS = ['/login', '/signup']

function UserMenu() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  // 로그인·가입 페이지에서 떠날 때 다시 확인
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname && AUTH_PATHS.includes(prevPathRef.current)) void refetch()
    prevPathRef.current = pathname
  }, [pathname, refetch])

  // 로그아웃 뒤 '로그인' 링크로 포커스
  const loginLinkRef = useRef<HTMLAnchorElement>(null)
  const [focusLogin, setFocusLogin] = useState(false)
  useEffect(() => {
    if (focusLogin && !session && loginLinkRef.current) {
      loginLinkRef.current.focus()
      setFocusLogin(false)
    }
  }, [focusLogin, session])

  const [signingOut, setSigningOut] = useState(false)
  async function signOut() {
    if (signingOut) return // aria-disabled라 클릭이 막히지 않으므로 직접 거른다
    setSigningOut(true)
    await authClient.signOut()
    setSigningOut(false)
    setFocusLogin(true)
    showToast({ message: '로그아웃했습니다.' })
    // 서버 컴포넌트(로그인한 사람만 보는 화면 등)를 다시 그리게 한다
    router.refresh()
  }

  if (isPending) {
    // 확인 중: '로그인' 버튼 크기의 회색 자리 (role="status" 없이 — 헤더에서 매번 '불러오는 중'을 읽으면 시끄럽다)
    // 높이 36px = ghost 버튼(위아래 여백 8px × 2 + 줄 높이 20px, 테두리 없음)
    return <Skeleton width={toRem(64)} height={toRem(36)} />
  }

  if (!session) {
    // 지금 페이지로 돌아오도록 ?next=지금 주소. 로그인·가입 페이지에서는 붙이지 않는다
    const href =
      AUTH_PATHS.includes(pathname) || pathname === '/' ? '/login' : `/login?next=${encodeURIComponent(pathname)}`
    return (
      <ButtonLink ref={loginLinkRef} href={href} variant="ghost">
        로그인
      </ButtonLink>
    )
  }

  return (
    <div className={styles.root}>
      {/* 이름은 넓은 화면에서만 (좁은 헤더에서는 로고·버튼 자리가 부족) */}
      <span className={styles.name}>
        <span className={styles.nameText}>{session.user.name}</span>님
      </span>
      {session.user.role === 'admin' && (
        <ButtonLink href="/admin/products" variant="ghost">
          관리
        </ButtonLink>
      )}
      <Button variant="ghost" onClick={signOut} aria-disabled={signingOut}>
        로그아웃
      </Button>
    </div>
  )
}

export default UserMenu
