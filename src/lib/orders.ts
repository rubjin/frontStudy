import 'server-only'
import { prisma } from '@/lib/db'
import { simulateNetwork } from '@/lib/mockNetwork'
import type { Order as OrderRow, OrderItem as OrderItemRow } from '@/generated/prisma/client'
import type { OrderInput } from '@/lib/orderInput'
import type { Order, OrderProblem } from '@/types/order'

// 주문 데이터 계층 — 서버 전용 (Step 9-3)
//
// lib/products.ts와 같은 역할: 화면·Server Action은 이 함수들만 부르고, DB(Prisma)는 여기서만 다룬다.
//
// 가장 중요한 함수: placeOrder — '재고 확인 → 재고 차감 → 주문 만들기'를 하나의 트랜잭션으로
// - 트랜잭션: 여러 DB 작업을 '전부 성공하거나 전부 없던 일'로 묶는다.
//   재고는 줄였는데 주문 만들기가 실패하면? → 재고만 사라진다. 트랜잭션이면 재고 차감도 함께 취소된다.
// - 동시에 두 사람이 마지막 1개를 주문하면? (경쟁 상태, race condition)
//   "재고 확인"과 "재고 줄이기" 사이에 다른 주문이 끼어들 수 있다. 그래서 줄일 때 조건을 함께 건다:
//   UPDATE ... SET stock = stock - 수량 WHERE id = ? AND stock >= 수량
//   조건에 안 맞으면 0줄이 바뀐다 → 그 순간 재고가 모자라다는 뜻 → 에러를 던져 트랜잭션 전체를 취소한다.

// DB 행 → 화면용 Order
function toOrder(row: OrderRow & { items: OrderItemRow[] }): Order {
  return {
    id: row.id,
    total: row.total,
    createdAt: row.createdAt,
    items: row.items.map(({ productId, name, price, quantity, imageSrc }) => ({
      productId,
      name,
      price,
      quantity,
      imageSrc,
    })),
  }
}

export type PlaceOrderResult = { ok: true; orderId: number } | { ok: false; problems: OrderProblem[] }

// 트랜잭션 도중 '재고가 방금 바뀜'을 알리는 에러 (던지면 트랜잭션이 취소된다)
class StockChangedError extends Error {
  constructor(readonly problem: OrderProblem) {
    super(problem.message)
  }
}

// 주문하기 — lines는 orderInputSchema 검사·mergeOrderLines를 거친 값
export async function placeOrder(userId: string, lines: OrderInput): Promise<PlaceOrderResult> {
  await simulateNetwork()
  const ids = lines.map((line) => line.productId)

  try {
    // $transaction(async (tx) => ...): 안에서 tx로 한 작업은 함수가 끝까지 성공해야 확정된다(에러가 나면 전부 취소)
    return await prisma.$transaction(async (tx) => {
      // 1) 지금 DB의 상품 정보 (가격·재고는 브라우저가 아니라 여기서 읽은 값을 쓴다)
      const products = await tx.product.findMany({ where: { id: { in: ids } } })
      const byId = new Map(products.map((product) => [product.id, product]))

      // 2) 주문할 수 없는 상품 모으기 — 하나라도 있으면 아무것도 바꾸지 않고 알려 준다
      const problems: OrderProblem[] = []
      for (const { productId, quantity } of lines) {
        const product = byId.get(productId)
        if (!product) problems.push({ productId, message: '판매가 끝난 상품이 있습니다.' })
        else if (product.stock === 0) problems.push({ productId, message: `${product.name}: 품절되었습니다.` })
        else if (product.stock < quantity) {
          problems.push({ productId, message: `${product.name}: 재고가 ${product.stock}개 남았습니다.` })
        }
      }
      if (problems.length > 0) return { ok: false, problems }

      // 3) 재고 줄이기 — 조건부(stock >= 수량)로. 그 사이 다른 주문이 가져갔으면 0줄 → 전체 취소
      for (const { productId, quantity } of lines) {
        const { count } = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        })
        if (count === 0) {
          const name = byId.get(productId)?.name ?? '상품'
          throw new StockChangedError({ productId, message: `${name}: 방금 재고가 바뀌었습니다. 다시 확인해 주세요.` })
        }
      }

      // 4) 주문 만들기 — 주문 당시 이름·가격·사진을 복사(스냅숏), 총액은 DB 가격으로 계산
      const items = lines.map(({ productId, quantity }) => {
        const product = byId.get(productId)!
        return { productId, quantity, name: product.name, price: product.price, imageSrc: product.imageSrc }
      })
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      // items: { create: [...] } → 주문과 주문 상품을 한 번에 만든다 (중첩 쓰기)
      const order = await tx.order.create({ data: { userId, total, items: { create: items } } })
      return { ok: true, orderId: order.id }
    })
  } catch (error) {
    if (error instanceof StockChangedError) return { ok: false, problems: [error.problem] }
    throw error
  }
}

// 내 주문 목록 — 최신순. userId로 거르는 것이 곧 '남의 주문은 안 보이게'
export async function getMyOrders(userId: string): Promise<Order[]> {
  await simulateNetwork()
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true }, // include: 관계(주문 상품)도 함께 읽기 (SQL의 JOIN과 비슷)
  })
  return rows.map(toOrder)
}

// 주문 하나 — '이 사용자의' 주문일 때만. 남의 주문 번호를 넣으면 '없음'과 똑같이 undefined
// (id만으로 찾으면 /orders/1, /orders/2 … 를 차례로 넣어 남의 주문을 볼 수 있다 — 흔한 보안 실수(IDOR))
export async function getMyOrder(userId: string, orderId: number): Promise<Order | undefined> {
  await simulateNetwork()
  const row = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } })
  return row ? toOrder(row) : undefined
}
