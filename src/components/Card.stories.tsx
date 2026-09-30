import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { products } from '@/data/products'
import type { Product } from '@/types/product'
import Card from './Card'
import { toRem } from '@/lib/units'

// Card 스토리 (Step 3-3)
// 목록 페이지에서는 데이터에 따라 우연히 보이는 상태(품절, 이미지 없음, 긴 이름)를 여기서는 일부러 만들어 확인한다.

// 스토리마다 상품 데이터를 조금씩 바꿔 쓰려고 기본 상품을 하나 정해 둔다
const base = products[0] // 800×600 가로형 사진

const meta = {
  title: 'Product/Card',
  component: Card,
  args: { product: base },
  // decorators: 스토리를 감싸는 포장지. 실제 그리드의 카드 폭(약 290px)과 비슷하게 맞춘다.
  decorators: [
    (Story) => (
      <div style={{ width: toRem(290) }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '상품 카드. 상품명에만 링크를 걸고 `::after`를 카드 전체로 늘려 클릭 영역을 넓혔다(늘린 링크). 사진은 원본 비율과 상관없이 정사각형 틀에 `object-fit: cover`로 채운다.',
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// 기본 상품에서 일부 값만 바꾼 상품을 만든다 (전개 연산자로 복사 후 덮어쓰기)
const withOverrides = (overrides: Partial<Product>): Product => ({ ...base, ...overrides })

export const Default: Story = {}

/** 재고 0 → 사진 위에 '품절' 오버레이 */
export const SoldOut: Story = {
  args: { product: withOverrides({ stock: 0 }) },
}

/** 이미지가 없는 상품 → 상품명 첫 글자로 대신 표시 */
export const NoImage: Story = {
  args: { product: withOverrides({ image: undefined }) },
}

/** 상품명이 길 때 줄바꿈되는 모양 확인 */
export const LongName: Story = {
  args: {
    product: withOverrides({ name: '무선 노이즈캔슬링 블루투스 헤드폰 프리미엄 에디션 (그라파이트 블랙, 2026년형)' }),
  },
}

/** 가로로 아주 긴 사진(1200×500) → 좌우가 잘린다 */
export const WideImage: Story = {
  args: { product: products[3] },
}

/** 세로로 아주 긴 사진(500×1000) → 위아래가 잘린다 */
export const TallImage: Story = {
  args: { product: products[10] },
}
