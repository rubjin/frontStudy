import { z } from 'zod'

// 주문하기 입력값 검사 (Step 9-3)
//
// 브라우저가 보내는 것은 장바구니의 [{ productId, quantity }] 뿐이다. 가격·이름은 받지 않는다.
// - 가격을 브라우저에서 받으면 개발자 도구로 1원으로 바꿔 보낼 수 있다. 금액은 서버가 DB 가격으로 계산한다.
// - Server Action은 누구나 직접 호출할 수 있으므로(8-3) 모양·범위를 서버에서 다시 검사한다.

// 한 주문에 담을 수 있는 상품 종류·수량의 상한 — 비정상적으로 큰 요청으로 서버를 괴롭히지 못하게
const MAX_LINES = 50
const MAX_QUANTITY = 99

export const orderInputSchema = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(MAX_QUANTITY),
    }),
  )
  .min(1, '장바구니가 비어 있습니다.')
  .max(MAX_LINES, `한 번에 ${MAX_LINES}종류까지 주문할 수 있습니다.`)

export type OrderInput = z.infer<typeof orderInputSchema>

// 같은 상품이 두 줄로 오면(정상 화면에서는 없지만 직접 보낸 요청이면 가능) 수량을 합친다
// → 재고 검사를 상품마다 한 번만, 정확하게 하려고
export function mergeOrderLines(lines: OrderInput): OrderInput {
  const merged = new Map<number, number>()
  for (const { productId, quantity } of lines) merged.set(productId, (merged.get(productId) ?? 0) + quantity)
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }))
}
