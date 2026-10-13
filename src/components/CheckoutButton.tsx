'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from './CartProvider'
import { Button } from './ui/Button'
import { authClient } from '@/lib/auth-client'
import { productQueries } from '@/lib/queries'
import type { PlaceOrderState } from '@/app/orders/actions'
import styles from './CheckoutButton.module.scss'

// 장바구니의 '주문하기' 버튼 (Step 9-3)
//
// props
// - placeOrder: 주문 Server Action (app/orders/actions.ts의 placeOrderAction).
//   이 컴포넌트가 직접 import하지 않고 서버 페이지(cart/page.tsx)가 넘겨준다.
//   → Storybook처럼 서버가 없는 곳에서는 가짜 함수를 넘겨 상황(성공·재고 부족)을 재현할 수 있다.
//   (서버 컴포넌트는 Server Action을 클라이언트 컴포넌트에 props로 넘길 수 있다)
//
// 흐름
// 1) 로그아웃 상태 → '로그인하고 주문하기' → /login?next=/cart (로그인 뒤 장바구니로 돌아온다)
// 2) 누르면 장바구니의 [{ productId, quantity }]만 보낸다. 가격은 보내지 않는다(서버가 DB 가격으로 계산)
// 3) 결과
//    - ok        → 장바구니 비우기 → 상품 캐시 새로 고치기(재고가 줄었으므로) → /orders/번호?placed=1
//    - problems  → 어떤 상품이 왜 안 되는지 목록으로 알려 주고, 상품 정보를 다시 받아 장바구니에 지금 재고를 보여 준다
//    - unauthenticated (그 사이 로그인이 풀림) → 로그인 페이지로
//
// useTransition: 서버 요청이 진행 중인지(isPending) 알려 준다 → 버튼을 '주문하는 중…' + aria-disabled
// (aria-disabled: 포커스를 잃지 않게. 클릭은 직접 막는다 — 5-2 원칙)

const CART_PATH = '/cart'

interface CheckoutButtonProps {
  placeOrder: (lines: { productId: number; quantity: number }[]) => Promise<PlaceOrderState>
}

function CheckoutButton({ placeOrder }: CheckoutButtonProps) {
  const { items, clear } = useCart()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  // 실패 안내 (재고 부족 목록 또는 한 줄 문구)
  const [problems, setProblems] = useState<string[]>([])

  const loginHref = `/login?next=${encodeURIComponent(CART_PATH)}`
  // 버튼과 안내 문구를 aria-describedby로 잇는 id (같은 컴포넌트가 두 번 나와도 겹치지 않게 useId)
  const noteId = useId()

  function submit() {
    if (isPending || items.length === 0) return
    if (!session) {
      router.push(loginHref)
      return
    }
    setProblems([])
    startTransition(async () => {
      const result = await placeOrder(items.map(({ productId, quantity }) => ({ productId, quantity })))
      switch (result.status) {
        case 'ok':
          clear()
          // 재고가 바뀐 상품 정보를 다음에 볼 때 새로 받게 한다 (['products']로 시작하는 캐시 전부)
          await queryClient.invalidateQueries({ queryKey: productQueries.all })
          router.push(`/orders/${result.orderId}?placed=1`)
          break
        case 'problems':
          setProblems(result.problems.map((problem) => problem.message))
          await queryClient.invalidateQueries({ queryKey: productQueries.all })
          break
        case 'invalid':
          setProblems([result.message])
          break
        case 'unauthenticated':
          router.push(loginHref)
          break
      }
    })
  }

  // 로그인 여부를 확인 중이면 '주문하기'로 둔다 (누르면 위 submit이 로그인 여부를 다시 본다)
  const label = isPending ? '주문하는 중…' : !sessionPending && !session ? '로그인하고 주문하기' : '주문하기'

  return (
    <div className={styles.root}>
      <Button
        onClick={submit}
        aria-disabled={isPending || items.length === 0}
        className={styles.button}
        // 결제 단계가 없다는 것을 버튼 가까이에서 알린다
        aria-describedby={noteId}
      >
        {label}
      </Button>
      <p id={noteId} className={styles.note}>
        결제 없이 주문만 접수됩니다. (포트폴리오 예제)
      </p>
      {/* role="alert": 주문이 안 된 이유를 바로 읽어 준다. 목록이 있을 때만 그린다(새로 나타날 때 읽힘) */}
      {problems.length > 0 && (
        <div role="alert" className={styles.problems}>
          <p className={styles.problemsTitle}>주문하지 못했습니다. 장바구니를 확인해 주세요.</p>
          <ul>
            {problems.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CheckoutButton
