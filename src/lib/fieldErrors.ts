import type { z } from 'zod'

// zod 검사 에러 → 칸별 첫 번째 문구 (Step 8-3 productInput.ts에 있던 것을 Step 9-1에서 공통으로 뺌)
//
// 예) { price: '가격을 숫자로 입력해 주세요.', name: '상품명을 입력해 주세요.' }
// 상품 폼과 회원가입·로그인 폼이 같이 쓴다. (원칙: 여러 파일에서 쓰이면 공통 파일로)
//
// <T>: 어떤 폼의 칸 이름인지는 부르는 쪽이 정한다 → toFieldErrors<ProductInput>(error)

/** 칸 이름 → 에러 문구 (에러가 없는 칸은 없음) */
export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function toFieldErrors<T>(error: z.ZodError): FieldErrors<T> {
  const errors: FieldErrors<T> = {}
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T
    errors[field] ??= issue.message // ??= : 아직 없을 때만 넣는다 (칸마다 첫 문구 하나)
  }
  return errors
}
