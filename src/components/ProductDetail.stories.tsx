import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { products } from '@/data/products'
import type { Product } from '@/types/product'
import ProductDetail from './ProductDetail'

// ProductDetail 스토리 (Step 4-1)
// 상세 페이지는 주소(id)로 상품을 고르지만, 여기서는 상품 데이터를 직접 넘겨서
// 재고 상태(품절·품절 임박)와 사진 비율(가로·세로·없음)별 모양을 한눈에 확인한다.

const base = products[0] // 800×600 가로형 사진, 재고 12개

const meta = {
  title: 'Product/ProductDetail',
  component: ProductDetail,
  args: { product: base },
  parameters: {
    // 페이지 전체 폭으로 보여 준다 (두 칸 배치는 768px 이상에서)
    layout: 'padded',
    docs: {
      description: {
        component:
          '상품 상세 화면. 사진은 원본 비율 그대로(`object-fit: contain`, 최대 높이 제한) 보여 주고, 재고 수에 따라 구매 가능 / 품절 임박 / 품절을 표시한다.',
      },
    },
  },
} satisfies Meta<typeof ProductDetail>

export default meta
type Story = StoryObj<typeof meta>

const withOverrides = (overrides: Partial<Product>): Product => ({ ...base, ...overrides })

export const Default: Story = {}

/** 재고 5개 이하 → '품절 임박 · n개 남음' 강조 */
export const LowStock: Story = {
  args: { product: withOverrides({ stock: 3 }) },
}

/** 재고 0 → '품절' */
export const SoldOut: Story = {
  args: { product: withOverrides({ stock: 0 }) },
}

/** 세로로 긴 사진(500×1000) → 높이를 제한하고 좌우에 배경이 보인다 (잘리지 않음) */
export const TallImage: Story = {
  args: { product: products[10] },
}

/** 가로로 긴 사진(1200×500) → 칸 너비에 맞춰 낮게 */
export const WideImage: Story = {
  args: { product: products[3] },
}

/** 이미지 없음 → 정사각형 자리에 상품명 첫 글자 */
export const NoImage: Story = {
  args: { product: withOverrides({ image: undefined }) },
}

/** 긴 상품명 → 이동 경로와 제목이 줄바꿈되는지 */
export const LongName: Story = {
  args: {
    product: withOverrides({ name: '무선 노이즈캔슬링 블루투스 헤드폰 프리미엄 에디션 (그라파이트 블랙, 2026년형)' }),
  },
}
