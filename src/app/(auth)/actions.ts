'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAPIError } from 'better-auth/api'
import { auth } from '@/lib/auth'
import { toFieldErrors, type FieldErrors } from '@/lib/fieldErrors'
import { loginSchema, safeRedirectPath, signUpSchema, type LoginInput, type SignUpInput } from '@/lib/authInput'

// 회원가입·로그인 Server Actions (Step 9-1)
//
// 순서는 상품 관리 액션(8-3)과 같다: 입력값 꺼내기 → zod 검사 → 실제 처리(Better Auth) → redirect
//
// 왜 브라우저에서 authClient.signIn.email()을 부르지 않고 Server Action으로 하나?
// - 입력값 검사와 에러 문구(한글)를 우리 규칙(lib/authInput.ts)으로 정한다.
// - 자바스크립트가 아직 안 받아졌어도 폼 제출이 된다(<form action>은 HTML 기본 동작).
// - 로그인 쿠키는 nextCookies 플러그인(lib/auth.ts)이 응답에 실어 준다.
//
// 비밀번호는 절대 돌려주지 않는다
// - 에러 때 입력값을 다시 채워 주려고 values를 돌려주는데(React 19는 제출 뒤 폼을 비운다), 비밀번호 칸은 뺀다.
//   돌려준 값은 화면(HTML)에 그대로 들어가기 때문이다. 사용자는 비밀번호만 다시 입력한다.

/** 폼이 받는 결과 — useActionState의 state */
export interface AuthFormState<T> {
  errors?: FieldErrors<T>
  /** 폼 전체에 대한 문구 (이메일·비밀번호 불일치 등) */
  message?: string
  /** 에러 때 다시 채울 값 (비밀번호 제외) */
  values?: Record<string, string>
}

export type SignUpFormState = AuthFormState<SignUpInput>
export type LoginFormState = AuthFormState<LoginInput>

// 다시 채울 값 — 비밀번호 칸과 숨은 칸(next)은 빼고
function safeValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key === 'password' || key === 'passwordConfirm' || key.startsWith('$')) continue
    values[key] = String(value)
  }
  return values
}

// Better Auth 에러 코드 → 한글 문구 (코드는 node_modules/@better-auth/core의 BASE_ERROR_CODES)
function errorCode(error: unknown): string | undefined {
  if (!isAPIError(error)) return undefined
  const body = error.body as { code?: string } | undefined
  return body?.code
}

export async function signUpAction(_prev: SignUpFormState, formData: FormData): Promise<SignUpFormState> {
  const values = safeValues(formData)
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: toFieldErrors<SignUpInput>(parsed.error), values }

  const { name, email, password } = parsed.data
  try {
    // 가입 + 자동 로그인(autoSignIn) → 로그인 쿠키가 응답에 실린다(nextCookies)
    // headers: 지금 요청의 헤더(접속 주소·브라우저 정보). Better Auth가 요청 출처 확인·세션 기록에 쓴다
    await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() })
  } catch (error) {
    const code = errorCode(error)
    if (code === 'USER_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
      return { errors: { email: '이미 가입된 이메일입니다. 로그인해 주세요.' }, values }
    }
    // 그 밖의 실패(요청이 너무 많음 등) — 원인은 서버 로그에만
    console.error(error)
    return { message: '회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', values }
  }

  // redirect는 try 밖에서 — Next.js의 redirect()는 '에러를 던지는 방식'이라 try 안에 두면 catch에 잡혀 버린다
  redirect(safeRedirectPath(formData.get('next')))
}

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const values = safeValues(formData)
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: toFieldErrors<LoginInput>(parsed.error), values }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() })
  } catch (error) {
    if (errorCode(error) === 'INVALID_EMAIL_OR_PASSWORD') {
      // 이메일이 틀렸는지 비밀번호가 틀렸는지 알려 주지 않는다
      // → '이 이메일은 가입되어 있다'는 정보를 남이 알아낼 수 없게 (계정 존재 여부 노출 방지)
      return { message: '이메일 또는 비밀번호가 올바르지 않습니다.', values }
    }
    console.error(error)
    return { message: '로그인을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', values }
  }

  redirect(safeRedirectPath(formData.get('next')))
}

// 로그아웃은 헤더의 UserMenu가 브라우저에서 authClient.signOut()으로 한다 (/api/auth/sign-out)
