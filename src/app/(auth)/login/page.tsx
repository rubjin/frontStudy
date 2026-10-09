import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import { auth } from '@/lib/auth'
import { safeRedirectPath } from '@/lib/authInput'
import { loginAction } from '../actions'
import styles from '../layout.module.scss'

// 로그인 페이지 — 주소 "/login" (Step 9-1)
//
// ?next=/cart : 로그인한 뒤 돌아갈 주소. (9-2에서 로그인이 필요한 페이지가 이 주소로 보낸다)
// 이미 로그인한 사람이 오면 바로 돌려보낸다 — 로그인 폼을 다시 보여 줄 이유가 없다.
//
// 서버 컴포넌트에서 로그인 상태 확인: auth.api.getSession({ headers })
// - 요청 헤더의 쿠키로 세션을 찾는다. headers()를 읽으므로 이 페이지는 요청마다 만들어진다(ƒ).

export const metadata: Metadata = {
  title: '로그인',
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams
  const nextPath = safeRedirectPath(next)

  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect(nextPath)

  // 회원가입으로 갈 때도 돌아갈 주소를 이어서 넘긴다
  const signUpHref = nextPath === '/' ? '/signup' : `/signup?next=${encodeURIComponent(nextPath)}`

  return (
    <>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.lead}>이메일과 비밀번호로 로그인하세요.</p>
      <AuthForm mode="login" action={loginAction} next={nextPath} />
      <p className={styles.switch}>
        아직 계정이 없으신가요? <Link href={signUpHref}>회원가입</Link>
      </p>
    </>
  )
}
