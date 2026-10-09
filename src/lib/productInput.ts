import { z } from 'zod'
import { toFieldErrors as toFieldErrorsOf, type FieldErrors } from '@/lib/fieldErrors'

// 상품 입력값 검사 규칙 — 관리 화면의 추가·수정 폼 (Step 8-3)
//
// 왜 서버에서 검사하나? (input의 required·min 속성이 있어도)
// - 브라우저 검사는 '친절'을 위한 것이다. 개발자 도구로 속성을 지우거나, 폼 없이 직접 요청을 보내면 얼마든지 우회된다.
// - DB에 들어가기 전 마지막 관문인 서버에서 반드시 다시 검사한다. (화면 검사 = 안내, 서버 검사 = 규칙)
//
// zod: '값의 모양과 규칙'을 선언해 두고 검사하는 라이브러리
// - schema.safeParse(값) → { success: true, data } 또는 { success: false, error }
// - 검사를 통과한 data는 타입까지 정해진다(문자열 '1000' → 숫자 1000). z.infer로 TypeScript 타입도 뽑는다
// - 규칙과 에러 문구가 한 곳에 있어 폼·API가 같은 규칙을 쓴다

// 받침에 맞는 조사 붙이기 — '가격을(를)'처럼 둘 다 적지 않으려고
// 한글 글자는 코드가 '가'(0xAC00)부터 28개(받침 없음 + 받침 27개)씩 묶여 있다 → 28로 나눈 나머지가 0이면 받침 없음
// 예) withParticle('가격', '을', '를') → '가격을' / withParticle('재고', '을', '를') → '재고를'
function withParticle(word: string, withBatchim: string, withoutBatchim: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasBatchim ? withBatchim : withoutBatchim)
}

// 폼에서 오는 값은 모두 문자열이다(FormData). 숫자 칸을 비우면 '' → Number('')는 0이 되어 '입력 안 함'이 0원으로 통과한다.
// → 빈 문자열은 undefined로 바꿔서 '필수 입력' 에러가 나게 한 뒤, 숫자로 바꿔(coerce) 검사한다
function numberField(label: string, { min, max, int = true }: { min: number; max: number; int?: boolean }) {
  const topic = withParticle(label, '은', '는') // 가격은 / 재고는
  let schema = z.coerce.number({ error: `${withParticle(label, '을', '를')} 숫자로 입력해 주세요.` })
  if (int) schema = schema.int(`${topic} 정수로 입력해 주세요.`)
  schema = schema
    .min(min, `${topic} ${min.toLocaleString('ko-KR')} 이상이어야 합니다.`)
    .max(max, `${topic} ${max.toLocaleString('ko-KR')} 이하여야 합니다.`)
  return z.preprocess((value) => (value === '' || value === null ? undefined : value), schema)
}

export const productInputSchema = z.object({
  // trim(): 앞뒤 공백을 지운 뒤 검사 — '   '만 입력하면 빈 값으로 본다
  // z.string({ error }): 칸 자체가 없을 때(폼을 거치지 않은 요청)의 문구. 없으면 zod 기본 영어 문구가 나온다(8-3 검증에서 발견)
  name: z
    .string({ error: '상품명을 입력해 주세요.' })
    .trim()
    .min(1, '상품명을 입력해 주세요.')
    .max(60, '상품명은 60자 이하로 입력해 주세요.'),
  category: z
    .string({ error: '카테고리를 입력해 주세요.' })
    .trim()
    .min(1, '카테고리를 입력해 주세요.')
    .max(20, '카테고리는 20자 이하로 입력해 주세요.'),
  price: numberField('가격', { min: 0, max: 100_000_000 }),
  stock: numberField('재고', { min: 0, max: 9_999 }),
  rating: numberField('평점', { min: 0, max: 5, int: false }),
})

/** 검사를 통과한 상품 입력값 */
export type ProductInput = z.infer<typeof productInputSchema>

/** 칸별 에러 문구 */
export type ProductFieldErrors = FieldErrors<ProductInput>

// zod 에러 → 칸별 첫 번째 문구. Step 9-1에서 공통 함수(lib/fieldErrors.ts)로 옮기고 여기서는 상품 칸 이름으로 고정해 부른다
export function toFieldErrors(error: z.ZodError): ProductFieldErrors {
  return toFieldErrorsOf<ProductInput>(error)
}
