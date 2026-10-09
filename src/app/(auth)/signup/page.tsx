import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import { auth } from '@/lib/auth'
import { safeRedirectPath } from '@/lib/authInput'
import { signUpAction } from '../actions'
import styles from '../layout.module.scss'

// 회원가입 페이지 — 주소 "/signup" (Step 9-1)
//
// 가입하면 바로 로그인되고(lib/auth.ts의 autoSignIn) ?next 주소(없으면 홈)로 이동한다.
// 이미 로그인한 사람이 오면 돌려보낸다. (login/page.tsx와 같은 구조)

export const metadata: Metadata = {
  title: '회원가입',
}

export default async function SignUpPage({ searchParams }: PageProps<'/signup'>) {
  const { next } = await searchParams
  const nextPath = safeRedirectPath(next)

  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect(nextPath)

  const loginHref = nextPath === '/' ? '/login' : `/login?next=${encodeURIComponent(nextPath)}`

  return (
    <>
      <h1 className={styles.title}>회원가입</h1>
      <p className={styles.lead}>이메일과 비밀번호만 있으면 가입할 수 있습니다.</p>
      <AuthForm mode="signup" action={signUpAction} next={nextPath} />
      <p className={styles.switch}>
        이미 계정이 있으신가요? <Link href={loginHref}>로그인</Link>
      </p>
    </>
  )
}
