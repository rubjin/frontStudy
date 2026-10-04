'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { Button, ButtonLink } from './ui/Button'
import type { ProductFormState } from '@/app/admin/products/actions'
import type { ProductInput } from '@/lib/productInput'
import styles from './ProductForm.module.scss'

// 상품 추가·수정 폼 (Step 8-3, 관리 화면)
//
// props
// - action:        제출하면 실행할 Server Action (createProductAction 또는 updateProductAction.bind(null, id))
// - defaultValues: 처음 채워 둘 값 (수정할 때 지금 상품 정보)
// - categories:    카테고리 입력칸 추천 목록 (datalist — 고르거나 새로 입력)
// - submitLabel:   제출 버튼 글자 ('추가', '저장')
// - initialState:  처음 결과 상태 (Storybook에서 에러 화면을 보여 줄 때)
//
// useActionState(액션, 처음 상태) → [지금 상태, 폼에 넣을 액션, 진행 중인지]  (React 19)
// - 제출하면 액션이 서버에서 실행되고, 돌려준 값(에러 등)이 다음 state가 된다.
// - isPending: 서버 응답을 기다리는 중 → 버튼을 '저장 중…'으로 (두 번 제출 방지)
// - 성공하면 액션이 redirect하므로 이 화면을 떠난다. 실패하면 state.errors로 칸별 문구를 보여 준다.
//
// 입력값 검사는 서버(actions.ts + lib/productInput.ts)가 한다. noValidate로 브라우저 기본 말풍선을 끄고
// 서버가 돌려준 문구를 칸 아래에 보여 준다 → 모든 에러가 같은 모양·같은 문구로 나오고, 스크린리더도 같은 방법으로 읽는다.
//
// 접근성
// - 칸마다 <label>, 에러 문구는 aria-describedby로 칸에 연결, 잘못된 칸은 aria-invalid="true"
// - 제출 후 에러가 있으면 요약(role="alert": "입력값을 확인해 주세요 (2개)")을 읽어 주고, 첫 번째 잘못된 칸으로 포커스
// - '저장 중…'은 disabled가 아니라 aria-disabled (누른 버튼에서 포커스가 튕기지 않게, Step 5-2 원칙)

type FieldName = keyof ProductInput

interface ProductFormProps {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaultValues?: Partial<Record<FieldName, string | number>>
  categories: string[]
  submitLabel: string
  initialState?: ProductFormState
}

// 칸 정의 — 순서대로 그린다. inputMode: 휴대폰에서 숫자 키패드를 띄운다
// (type="number"는 마우스 휠로 값이 바뀌거나 'e'가 입력되는 등 불편이 있어 text + inputMode를 쓴다)
// prettier-ignore
const FIELDS: { name: FieldName; label: string; inputMode?: 'numeric' | 'decimal'; hint?: string; suffix?: string }[] = [
  { name: 'name',     label: '상품명' },
  { name: 'category', label: '카테고리', hint: '목록에서 고르거나 새로 입력하세요.' },
  { name: 'price',    label: '가격',     inputMode: 'numeric', suffix: '원' },
  { name: 'stock',    label: '재고',     inputMode: 'numeric', suffix: '개', hint: '0이면 품절로 표시됩니다.' },
  { name: 'rating',   label: '평점',     inputMode: 'decimal', hint: '0 ~ 5' },
]

export function ProductForm({
  action,
  defaultValues = {},
  categories,
  submitLabel,
  initialState = {},
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const id = useId() // 칸 id·에러 문구 id의 앞부분 (같은 폼이 두 번 나와도 겹치지 않게)
  const formRef = useRef<HTMLFormElement>(null)

  const errors = state.errors ?? {}
  const errorCount = Object.keys(errors).length

  // 에러가 돌아오면 첫 번째 잘못된 칸으로 포커스
  useEffect(() => {
    if (errorCount === 0) return
    formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
  }, [state, errorCount])

  return (
    <form ref={formRef} action={formAction} noValidate className={styles.form}>
      {/* 폼 전체 문구 (권한 없음, 이미 삭제됨) / 에러 요약 */}
      {(state.message || errorCount > 0) && (
        <p role="alert" className={styles.summary}>
          {state.message ?? `입력값을 확인해 주세요 (${errorCount}개)`}
        </p>
      )}

      {FIELDS.map(({ name, label, inputMode, hint, suffix }) => {
        const inputId = `${id}-${name}`
        const hintId = hint ? `${inputId}-hint` : undefined
        const errorId = errors[name] ? `${inputId}-error` : undefined
        // 에러로 돌아왔을 때는 사용자가 입력했던 값, 아니면 처음 값
        // (React 19는 액션이 끝나면 폼을 초기화한다 — defaultValue를 바꿔 두면 그 값으로 다시 채워진다)
        const value = state.values?.[name] ?? defaultValues[name] ?? ''

        return (
          <div key={name} className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              {label}
            </label>
            <div className={styles.control}>
              <input
                id={inputId}
                name={name}
                defaultValue={String(value)}
                inputMode={inputMode}
                list={name === 'category' ? `${id}-categories` : undefined}
                autoComplete="off"
                aria-invalid={errors[name] ? true : undefined}
                // 설명 → 에러 순서로 읽힌다
                aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                className={styles.input}
              />
              {suffix && (
                <span aria-hidden="true" className={styles.suffix}>
                  {suffix}
                </span>
              )}
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

      {/* datalist: 입력칸에 추천 목록을 붙인다. '전체'는 실제 카테고리가 아니라 뺀다 */}
      <datalist id={`${id}-categories`}>
        {categories
          .filter((category) => category !== '전체')
          .map((category) => (
            <option key={category} value={category} />
          ))}
      </datalist>

      <div className={styles.actions}>
        <Button
          type="submit"
          aria-disabled={isPending}
          // 진행 중에는 제출을 막는다 (aria-disabled는 클릭을 막지 않으므로 직접)
          onClick={(event) => isPending && event.preventDefault()}
        >
          {isPending ? '저장 중…' : submitLabel}
        </Button>
        <ButtonLink href="/admin/products" variant="secondary">
          취소
        </ButtonLink>
      </div>
    </form>
  )
}
