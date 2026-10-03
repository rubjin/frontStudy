import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import AddToCartButton from './AddToCartButton'
import CartLink from './CartLink'
import CartContents from './CartContents'
import { products } from '@/data/products'
import { toRem } from '@/lib/units'

// 장바구니 스토리 (Step 5-1)
//
// 모든 스토리는 .storybook/preview.tsx에서 CartProvider로 감싸져 있다. (스토리마다 빈 장바구니로 시작)
// '함께 동작' 스토리에서 담기 버튼을 누르면 헤더 배지와 목록이 같이 바뀌는 것 = Context로 state를 나눠 쓰는 모습

const inStock = products[1] // 스마트워치, 재고 5개 → 5번 누르면 '최대 수량'
const soldOut = products[2] // 스피커, 재고 0개

const meta = {
  title: 'Cart/AddToCartButton',
  component: AddToCartButton,
  args: { product: inStock },
  // 상세 화면처럼 가로 flex 줄 안에 넣는다 (알림 문구가 버튼 줄 아래로 내려가는지 확인)
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: toRem(12), maxWidth: toRem(480) }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '상세 화면의 장바구니 담기 버튼. 재고만큼 담으면 비활성화되고, 담은 결과를 `role="status"`로 스크린리더에 알린다.',
      },
    },
  },
} satisfies Meta<typeof AddToCartButton>

export default meta
type Story = StoryObj<typeof meta>

/** 재고 5개 — 다섯 번 누르면 '최대 수량을 담았습니다'로 비활성화 */
export const Default: Story = {}

/** 품절 — 처음부터 누를 수 없다 */
export const SoldOut: Story = {
  args: { product: soldOut },
}

/** 헤더 링크 단독 (빈 장바구니: 배지 없음) */
export const LinkOnly: Story = {
  render: () => <CartLink />,
}

/** 빈 장바구니 화면 */
export const EmptyCart: Story = {
  render: () => <CartContents />,
  decorators: [
    (Story) => (
      <div style={{ width: toRem(480) }}>
        <Story />
      </div>
    ),
  ],
}

/** 담기 버튼 · 헤더 배지 · 장바구니 목록이 같은 state를 쓴다. 버튼을 눌러 세 곳이 함께 바뀌는지 확인 */
export const Together: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: toRem(24), width: toRem(480) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: toRem(12), flexWrap: 'wrap' }}>
        <AddToCartButton product={products[0]} />
        <AddToCartButton product={inStock} />
        <CartLink />
      </div>
      <CartContents />
    </div>
  ),
}
