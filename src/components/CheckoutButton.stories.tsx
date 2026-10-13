import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CheckoutButton from './CheckoutButton'
import { CartProvider } from './CartProvider'
import { authSignedIn, authSignedOut } from '@/mocks/handlers'
import { toRem } from '@/lib/units'
import type { PlaceOrderState } from '@/app/orders/actions'

// 장바구니 '주문하기' 버튼 스토리 (Step 9-3)
//
// 실제 주문은 Server Action(서버)이라 Storybook에서는 실행할 수 없다 → placeOrder에 상황별 가짜 함수를 넣는다.
// 로그인 상태는 MSW(get-session)로, 장바구니는 CartProvider initialItems로 재현한다.

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 성공: 잠깐 기다렸다가 주문 번호를 돌려준다 (Storybook은 실제로 이동하지 않는다)
async function placeOrderOk(): Promise<PlaceOrderState> {
  await wait(600)
  return { status: 'ok', orderId: 1 }
}

// 재고 부족: 어떤 상품이 왜 안 되는지 목록
async function placeOrderProblems(): Promise<PlaceOrderState> {
  await wait(600)
  return {
    status: 'problems',
    problems: [
      { productId: 2, message: '스마트워치 5세대: 재고가 1개 남았습니다.' },
      { productId: 3, message: '휴대용 블루투스 스피커: 품절되었습니다.' },
    ],
  }
}

// 응답이 오지 않음 → '주문하는 중…'이 계속 보인다
function placeOrderPending(): Promise<PlaceOrderState> {
  return new Promise(() => {})
}

const meta = {
  title: 'Cart/CheckoutButton',
  component: CheckoutButton,
  args: { placeOrder: placeOrderOk },
  decorators: [
    (Story) => (
      <CartProvider initialItems={[{ productId: 2, quantity: 2 }]} persist={false}>
        <div style={{ width: toRem(320) }}>
          <Story />
        </div>
      </CartProvider>
    ),
  ],
  parameters: {
    msw: { handlers: { auth: authSignedIn } },
    docs: {
      description: {
        component:
          '장바구니의 주문하기 버튼. 상품 id와 수량만 서버로 보내고(가격은 서버가 DB로 계산), 결과에 따라 주문 완료로 이동하거나 재고 부족 목록을 보여 준다. 로그아웃 상태면 로그인하고 주문하기.',
      },
    },
  },
} satisfies Meta<typeof CheckoutButton>

export default meta
type Story = StoryObj<typeof meta>

/** 로그인한 상태 — 누르면 '주문하는 중…' 뒤 주문 완료 페이지로 이동(스토리에서는 이동만 흉내) */
export const SignedIn: Story = {}

/** 로그아웃 상태 — '로그인하고 주문하기' */
export const SignedOut: Story = {
  parameters: { msw: { handlers: { auth: authSignedOut } } },
}

/** 재고가 모자라 주문하지 못함 — 버튼을 누르면 상품별 이유가 나온다 */
export const StockProblems: Story = {
  args: { placeOrder: placeOrderProblems },
}

/** 서버 응답을 기다리는 중 — 버튼을 누르면 '주문하는 중…'에서 멈춘다 */
export const Pending: Story = {
  args: { placeOrder: placeOrderPending },
}
