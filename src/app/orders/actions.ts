'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { mergeOrderLines, orderInputSchema } from '@/lib/orderInput'
import { placeOrder } from '@/lib/orders'
import type { OrderProblem } from '@/types/order'

// 주문하기 Server Action (Step 9-3)
//
// 장바구니 화면의 '주문하기' 버튼이 부른다: placeOrderAction([{ productId: 3, quantity: 2 }, ...])
// - 폼 제출이 아니라 함수 호출로 쓴다. 장바구니는 브라우저 state(localStorage)에 있어서 폼 칸이 아니기 때문이다.
// - 상품 관리 액션(8-3)과 같은 순서: ① 권한(로그인) ② 입력값(zod) ③ DB(lib/orders.ts) ④ 바뀐 페이지 갱신
//
// redirect하지 않고 결과를 돌려주는 이유
// - 성공하면 브라우저가 장바구니를 비우고(localStorage) 상품 캐시를 새로 고친 '뒤' 주문 완료 페이지로 가야 한다.
//   여기서 redirect하면 그 정리를 할 틈이 없다. → { status: 'ok', orderId }를 받아 화면(CheckoutButton)이 처리한다.

export type PlaceOrderState =
  | { status: 'ok'; orderId: number }
  | { status: 'unauthenticated' }
  | { status: 'invalid'; message: string }
  | { status: 'problems'; problems: OrderProblem[] }

export async function placeOrderAction(lines: unknown): Promise<PlaceOrderState> {
  // ① 로그인한 사람만 (proxy.ts·페이지와 상관없이 함수 안에서 다시 확인)
  const session = await getSession()
  if (!session) return { status: 'unauthenticated' }

  // ② 입력값 — unknown으로 받아 zod로 모양을 확인한다 (직접 호출하면 무엇이든 들어올 수 있다)
  const parsed = orderInputSchema.safeParse(lines)
  if (!parsed.success)
    return { status: 'invalid', message: parsed.error.issues[0]?.message ?? '주문 내용이 올바르지 않습니다.' }
  const orderLines = mergeOrderLines(parsed.data)

  // ③ 재고 확인·차감·주문 생성 (한 트랜잭션)
  const result = await placeOrder(session.user.id, orderLines)
  if (!result.ok) return { status: 'problems', problems: result.problems }

  // ④ 재고가 바뀐 페이지를 다시 만들게 한다 (상세는 미리 만든 페이지 ● — 그대로 두면 옛 재고가 보인다, 8-3과 같은 이유)
  revalidatePath('/')
  revalidatePath('/admin/products')
  for (const { productId } of orderLines) revalidatePath(`/products/${productId}`)
  revalidatePath('/orders')

  return { status: 'ok', orderId: result.orderId }
}
