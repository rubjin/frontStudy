import { z } from 'zod'
import type { FieldErrors } from '@/lib/fieldErrors'

// 회원가입·로그인 입력값 검사 규칙 (Step 9-1)
//
// productInput.ts와 같은 방식: 서버(Server Action)에서 zod로 검사하고, 문구는 한글로 직접 정한다.
// Better Auth도 이메일 형식·비밀번호 길이를 검사하지만 영어 문구라서, 그 전에 우리가 먼저 검사한다.
// (비밀번호 길이 8~128은 lib/auth.ts의 minPasswordLength·maxPasswordLength와 같아야 한다)

export const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

// 이메일: 앞뒤 공백 제거 + 소문자로 (Kim@Example.com과 kim@example.com을 같은 사람으로)
const emailField = z
  .string({ error: '이메일을 입력해 주세요.' })
  .trim()
  .toLowerCase()
  .min(1, '이메일을 입력해 주세요.')
  .pipe(z.email('이메일 형식이 올바르지 않습니다. 예) name@example.com'))

export const signUpSchema = z
  .object({
    name: z
      .string({ error: '이름을 입력해 주세요.' })
      .trim()
      .min(1, '이름을 입력해 주세요.')
      .max(30, '이름은 30자 이하로 입력해 주세요.'),
    email: emailField,
    // 비밀번호는 trim하지 않는다 — 공백도 비밀번호의 일부일 수 있다
    password: z
      .string({ error: '비밀번호를 입력해 주세요.' })
      .min(PASSWORD_MIN, `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`)
      .max(PASSWORD_MAX, `비밀번호는 ${PASSWORD_MAX}자 이하여야 합니다.`),
    passwordConfirm: z
      .string({ error: '비밀번호를 한 번 더 입력해 주세요.' })
      .min(1, '비밀번호를 한 번 더 입력해 주세요.'),
  })
  // refine: 칸 하나가 아니라 '두 칸의 관계'를 검사한다. path로 에러를 어느 칸에 붙일지 정한다
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 서로 다릅니다.',
    path: ['passwordConfirm'],
  })

export const loginSchema = z.object({
  email: emailField,
  // 로그인에서는 길이 규칙을 검사하지 않는다 — 틀린 비밀번호와 똑같이 '이메일 또는 비밀번호가 올바르지 않습니다'로 안내한다
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignUpFieldErrors = FieldErrors<SignUpInput>
export type LoginFieldErrors = FieldErrors<LoginInput>

// 로그인 뒤 돌아갈 주소(?next=/cart)가 '우리 사이트 안의 주소'인지 확인
// 확인 없이 redirect(next)하면 ?next=https://가짜사이트.com 으로 사용자를 다른 사이트로 보내는 데 악용된다(오픈 리다이렉트).
// '/'로 시작하고 '//'(다른 사이트를 뜻하는 주소)·'/\'로 시작하지 않을 때만 허용한다
export function safeRedirectPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback
  }
  return next
}
