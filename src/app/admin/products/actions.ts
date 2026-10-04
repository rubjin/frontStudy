'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createProduct, deleteProduct, updateProduct } from '@/lib/products'
import { productInputSchema, toFieldErrors, type ProductFieldErrors } from '@/lib/productInput'
import { isAdminEnabled } from '@/lib/admin'

// 상품 추가·수정·삭제 Server Actions (Step 8-3)
//
// Server Action이란? — 'use server' 파일의 async 함수
// - 폼의 action에 이 함수를 넣으면(<form action={createProductAction}>) 제출할 때 브라우저가 서버로 요청을 보내고,
//   서버에서 이 함수가 실행된다. API 주소(route.ts)와 fetch 코드를 직접 만들 필요가 없다.
// - JS가 아직 안 받아졌어도 일반 HTML 폼 제출로 동작한다(점진적 향상).
// - 반대로 말하면, 이 함수들은 누구나 호출할 수 있는 '서버 입구'다. 그래서 ① 권한 ② 입력값을 함수 안에서 반드시 검사한다.
//
// Route Handler(app/api)와 언제 나눠 쓰나?
// - 우리 화면의 폼에서 데이터를 바꿀 때 → Server Action (지금)
// - 다른 앱·외부 서비스가 부르는 공개 API, 브라우저에서 읽어 오는 데이터(GET) → Route Handler (Step 6)
//
// 저장한 뒤 할 일
// - revalidatePath: 이 데이터를 보여 주는 페이지의 캐시를 버린다. 특히 상세 페이지는 빌드 때 만든 정적 페이지(●)라서
//   이걸 안 하면 가격을 바꿔도 옛 가격이 계속 보인다(8-2에서 발견). 다음 요청 때 새 데이터로 다시 만든다.
// - redirect: 목록으로 돌아간다. 주소의 ?done=... 으로 결과 문구를 보여 준다.

/** 폼이 받는 결과 — useActionState의 state */
export interface ProductFormState {
  /** 칸별 에러 문구 */
  errors?: ProductFieldErrors
  /** 폼 전체에 대한 문구 (권한 없음, 이미 삭제됨 등) */
  message?: string
  /** 에러일 때 사용자가 입력했던 값 — React 19는 제출 뒤 폼을 초기화하므로 다시 채워 주기 위해 돌려준다 */
  values?: Record<string, string>
}

// 상품 데이터를 보여 주는 화면들의 캐시 버리기
function revalidateProductPages(id?: number) {
  revalidatePath('/') // 홈 목록
  revalidatePath('/admin/products') // 관리 목록
  if (id !== undefined) revalidatePath(`/products/${id}`) // 그 상품의 상세
}

// FormData → 일반 객체 ({ name: '...', price: '1000', ... })
function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]))
}

// useActionState와 함께 쓰는 액션은 (이전 state, formData) 두 인자를 받는다
export async function createProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  if (!isAdminEnabled()) return { message: '상품을 관리할 권한이 없습니다.' }

  const values = formValues(formData)
  const parsed = productInputSchema.safeParse(values)
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values }

  const product = await createProduct(parsed.data)
  revalidateProductPages(product.id)
  // redirect는 에러를 던져서 이동시킨다 → try/catch 안에 두지 않는다
  redirect(`/admin/products?done=created&id=${product.id}`)
}

// 수정 — id는 폼 칸이 아니라 bind로 미리 묶어 둔다: updateProductAction.bind(null, 3) (Next.js 문서의 방법)
// 폼 값(입력 내용)과 '어느 상품인지'를 나눠서 다루기 쉽다. 단, bind한 값도 요청과 함께 오가는 값이라
// 마음먹으면 바꿔서 보낼 수 있다. 그래서 안전은 bind가 아니라 함수 안의 권한 검사가 지킨다
// (Step 9: '이 사용자가 이 상품을 고칠 수 있는가'까지 검사)
export async function updateProductAction(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  if (!isAdminEnabled()) return { message: '상품을 관리할 권한이 없습니다.' }

  const values = formValues(formData)
  const parsed = productInputSchema.safeParse(values)
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values }

  const product = await updateProduct(id, parsed.data)
  if (!product) return { message: '이미 삭제된 상품입니다. 목록에서 다시 확인해 주세요.', values }

  revalidateProductPages(id)
  redirect(`/admin/products?done=updated&id=${id}`)
}

// 삭제 — 확인 대화상자는 버튼(DeleteProductButton)이 띄운다
export async function deleteProductAction(id: number): Promise<void> {
  if (!isAdminEnabled()) throw new Error('상품을 관리할 권한이 없습니다.')
  await deleteProduct(id) // 이미 없으면 false지만 결과(목록에서 사라짐)는 같으므로 그대로 진행
  revalidateProductPages(id)
  redirect('/admin/products?done=deleted')
}
