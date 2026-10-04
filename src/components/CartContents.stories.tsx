import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CartContents from './CartContents'
import CartLink from './CartLink'
import CartSkeleton from './CartSkeleton'
import { CartProvider } from './CartProvider'
import type { CartItem } from '@/types/cart'
import { toRem } from '@/lib/units'

// 장바구니 화면 스토리 (Step 5-2, 5-3에서 Loading 추가)
//
// 상품이 담긴 상태를 보여 주려면 장바구니에 처음부터 상품이 있어야 한다.
// → 스토리마다 CartProvider에 initialItems를 넘겨 감싼다. (preview.tsx의 전역 CartProvider보다 안쪽이라 이쪽이 쓰인다.
//    Context는 '가장 가까운 Provider'의 값을 꺼내기 때문)
// 버튼을 눌러 수량을 바꾸거나 삭제하면 헤더 링크 배지(CartLink)도 함께 바뀐다.
// persist={false}: localStorage에 저장하지 않는다 (preview.tsx 주석 참고)

// 상품 id: 1 무선 헤드폰(재고 12) · 2 스마트워치(재고 5) · 4 기계식 키보드(재고 23)
const filled: CartItem[] = [
  { productId: 1, quantity: 1 },
  { productId: 2, quantity: 2 },
  { productId: 4, quantity: 3 },
]

const meta = {
  title: 'Cart/CartContents',
  component: CartContents,
  decorators: [
    (Story, { parameters }) => (
      <CartProvider initialItems={parameters.cartItems as CartItem[] | undefined} persist={false}>
        <div style={{ display: 'grid', gap: toRem(16), maxWidth: toRem(1024) }}>
          {/* 배지가 같은 state를 쓰는지 보이도록 헤더 링크를 함께 둔다 */}
          <div>
            <CartLink />
          </div>
          <Story />
        </div>
      </CartProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '장바구니 화면. 사진·단가·수량(−/+)·소계·삭제와 주문 요약. 수량은 1 ~ 재고 사이에서만 바뀌고, 끝에 닿은 버튼은 포커스를 잃지 않도록 `aria-disabled`로 비활성화한다.',
      },
    },
  },
} satisfies Meta<typeof CartContents>

export default meta
type Story = StoryObj<typeof meta>

/** 상품 3개가 담긴 장바구니 */
export const Filled: Story = {
  parameters: { cartItems: filled },
}

/** 재고만큼 담음 — + 버튼 비활성, '재고 5개까지' 안내 */
export const AtMaxQuantity: Story = {
  parameters: { cartItems: [{ productId: 2, quantity: 5 }] },
}

/** 불러오는 중 (Step 5-3) — 저장된 장바구니를 읽기 전, 서버 HTML과 브라우저 첫 화면 */
export const Loading: Story = {
  render: () => <CartSkeleton />,
}

/** 빈 장바구니 — 상품 보러 가기 안내 */
export const Empty: Story = {}

/** 작은 화면 (사진 · 상품명 / 수량 · 소계 두 줄 배치) */
export const Mobile: Story = {
  parameters: { cartItems: filled },
  // Storybook 10 기본 뷰포트 목록의 'mobile1'(320px). 툴바의 뷰포트 버튼에서도 바꿀 수 있다
  globals: { viewport: { value: 'mobile1' } },
}
