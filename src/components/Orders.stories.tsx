import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import OrderDetail from './OrderDetail'
import OrderList from './OrderList'
import type { Order } from '@/types/order'

// 주문 화면 스토리 (Step 9-3) — 주문 상세(완료 안내 포함)와 내 주문 목록
// 실제 페이지는 서버가 '내 주문'만 골라 넘겨준다. 여기서는 데이터를 직접 넣는다.
// 사진은 Storybook에서도 보이도록 public/의 목 데이터 이미지를 쓴다.

const order: Order = {
  id: 12,
  total: 841000,
  createdAt: new Date('2026-10-09T09:30:00Z'),
  items: [
    { productId: 1, name: '무선 노이즈캔슬링 헤드폰', price: 189000, quantity: 1, imageSrc: '/images/products/1.jpg' },
    { productId: 2, name: '스마트워치 5세대', price: 326000, quantity: 2, imageSrc: '/images/products/2.jpg' },
  ],
}

// 주문한 뒤 상품이 삭제된 경우 — productId가 null, 주문 당시 이름·가격은 그대로
const orderWithDeleted: Order = {
  id: 7,
  total: 59000,
  createdAt: new Date('2026-10-01T03:00:00Z'),
  items: [{ productId: null, name: '버티컬 무선 마우스', price: 59000, quantity: 1, imageSrc: null }],
}

const meta = {
  title: 'Orders/OrderDetail',
  component: OrderDetail,
  args: { order },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '주문 상세. 상품 이름·가격은 주문 당시 값(스냅숏)이라 지금 가격과 다를 수 있다. 삭제된 상품은 링크 없이 "(판매 종료)".',
      },
    },
  },
} satisfies Meta<typeof OrderDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Detail: Story = {}

/** 방금 주문했을 때 (?placed=1) — 위에 완료 안내 */
export const JustPlaced: Story = {
  args: { placed: true },
}

/** 주문 뒤 삭제된 상품 — 링크 없이 '판매 종료' */
export const DeletedProduct: Story = {
  args: { order: orderWithDeleted },
}

/** 내 주문 목록 */
export const List: Story = {
  render: () => <OrderList orders={[order, orderWithDeleted]} />,
}

/** 주문이 없을 때 */
export const ListEmpty: Story = {
  render: () => <OrderList orders={[]} />,
}
