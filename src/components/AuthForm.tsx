'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { Button } from './ui/Button'
import { PASSWORD_MIN } from '@/lib/authInput'
import type { AuthFormState } from '@/app/(auth)/actions'
import styles from './ui/Form.module.scss'

// 회원가입·로그인 폼 (Step 9-1)
//
// ProductForm(8-3)과 같은 구조: useActionState로 Server Action 결과(state)를 받아
// 칸별 에러·요약·첫 에러 칸 포커스를 보여 준다. 모양은 ui/Form.module.scss 공통 스타일.
//
// props
// - mode:   'signup'(회원가입) | 'login'(로그인) — 보여 줄 칸과 버튼 문구가 달라진다
// - action: 제출하면 실행할 Server Action (signUpAction / loginAction)
// - next:   로그인 뒤 돌아갈 주소 (?next=/cart). 숨은 칸으로 함께 보낸다
// - initialState: 처음 상태 (Storybook에서 에러 화면을 재현할 때)
//
// 접근성·사용성
// - autoComplete: 브라우저·비밀번호 관리자가 알맞은 값을 채워 준다.
//   로그인 비밀번호는 'current-password'(저장된 것 채우기), 가입은 'new-password'(새 비밀번호 제안)
// - type="email": 모바일에서 @가 있는 자판이 뜬다. 검사는 noValidate로 끄고 서버 문구로 통일(브라우저마다 문구가 달라서)
// - 에러가 나면 첫 에러 칸으로 포커스 (aria-invalid + aria-describedby로 에러 문구를 칸에 연결)
// - 폼 전체 문구(이메일 또는 비밀번호 불일치)는 role="alert"로 바로 읽힌다

type Mode = 'signup' | 'login'

interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
  hint?: string
}

const FIELDS: Record<Mode, Field[]> = {
  signup: [
    { name: 'name', label: '이름', type: 'text', autoComplete: 'name' },
    { name: 'email', label: '이메일', type: 'email', autoComplete: 'email' },
    {
      name: 'password',
      label: '비밀번호',
      type: 'password',
      autoComplete: 'new-password',
      hint: `${PASSWORD_MIN}자 이상`,
    },
    { name: 'passwordConfirm', label: '비밀번호 확인', type: 'password', autoComplete: 'new-password' },
  ],
  login: [
    { name: 'email', label: '이메일', type: 'email', autoComplete: 'email' },
    { name: 'password', label: '비밀번호', type: 'password', autoComplete: 'current-password' },
  ],
}

const SUBMIT_LABEL: Record<Mode, { idle: string; pending: string }> = {
  signup: { idle: '회원가입', pending: '가입 중…' },
  login: { idle: '로그인', pending: '로그인 중…' },
}

// 여러 폼의 state를 함께 받기 위해 칸 이름을 string으로 넓혀 받는다
type FormState = AuthFormState<Record<string, unknown>>

interface AuthFormProps {
  mode: Mode
  action: (state: FormState, formData: FormData) => Promise<FormState>
  next?: string
  initialState?: FormState
}

function AuthForm({ mode, action, next, initialState = {} }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)

  const errors: Record<string, string | undefined> = state.errors ?? {}
  const errorCount = Object.values(errors).filter(Boolean).length

  // 제출 결과가 에러면 첫 번째 에러 칸으로 포커스 (ProductForm과 같은 방식)
  useEffect(() => {
    if (errorCount > 0) {
      formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state, errorCount])

  const submit = SUBMIT_LABEL[mode]

  return (
    <form ref={formRef} action={formAction} noValidate className={styles.form}>
      {(state.message || errorCount > 0) && (
        <p role="alert" className={styles.summary}>
          {state.message ?? `입력값을 확인해 주세요 (${errorCount}개)`}
        </p>
      )}

      {/* 로그인 뒤 돌아갈 주소 — 화면에는 안 보이고 함께 제출된다 */}
      {next && <input type="hidden" name="next" value={next} />}

      {FIELDS[mode].map(({ name, label, type, autoComplete, hint }) => {
        const inputId = `${id}-${name}`
        const hintId = hint ? `${inputId}-hint` : undefined
        const errorId = errors[name] ? `${inputId}-error` : undefined

        return (
          <div key={name} className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              {label}
            </label>
            <div className={styles.control}>
              <input
                id={inputId}
                name={name}
                type={type}
                // 비밀번호 칸은 돌려받지 않으므로 항상 빈 칸으로 시작한다 (actions.ts의 safeValues)
                defaultValue={state.values?.[name] ?? ''}
                autoComplete={autoComplete}
                // 이메일은 첫 글자를 대문자로 바꾸거나 맞춤법 교정을 하지 않게 (모바일 자판)
                autoCapitalize={type === 'email' ? 'none' : undefined}
                spellCheck={type === 'email' ? false : undefined}
                aria-invalid={errors[name] ? true : undefined}
                aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                className={styles.input}
              />
            </div>
            {hint && (
              <p id={hintId} className={styles.hint}>
                {hint}
              </p>
            )}
            {errors[name] && (
              <p id={errorId} className={styles.error}>
                {errors[name]}
              </p>
            )}
          </div>
        )
      })}

      <div className={styles.actions}>
        {/* 제출 중에는 aria-disabled(포커스 유지) + 클릭 막기 — disabled면 포커스가 body로 튕긴다(5-2 원칙) */}
        <Button type="submit" aria-disabled={isPending} onClick={(event) => isPending && event.preventDefault()}>
          {isPending ? submit.pending : submit.idle}
        </Button>
      </div>
    </form>
  )
}

export default AuthForm
