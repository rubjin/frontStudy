import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Card from './Card'
import CardSkeleton from './CardSkeleton'
import CatalogSkeleton from './CatalogSkeleton'
import ProductDetail from './ProductDetail'
import ProductDetailSkeleton from './ProductDetailSkeleton'
import { products } from '@/data/products'
import { toRem } from '@/lib/units'

// 로딩 스켈레톤 스토리 (Step 3-3, Step 4-3에서 상세 스켈레톤 추가)
// 스켈레톤들은 props가 없어서 한 파일에 모았다.
// '실제 카드와 나란히' 스토리로 크기가 같은지 눈으로 비교한다.

const meta = {
  title: 'Product/Skeletons',
  component: CardSkeleton,
  parameters: {
    docs: {
      description: {
        component:
          '실제 컴포넌트의 SCSS 클래스를 그대로 써서 **크기가 실제 화면과 똑같은** 로딩 스켈레톤. `app/(catalog)/page.tsx`의 `<Suspense fallback>`과 각 주소의 `loading.tsx`(Step 4-3)로 쓰인다.',
      },
    },
  },
} satisfies Meta<typeof CardSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const CardOnly: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: toRem(290) }}>
        <Story />
      </div>
    ),
  ],
}

/** 왼쪽 스켈레톤, 오른쪽 실제 카드 — 높이·여백이 같아야 한다 */
export const CardSideBySide: Story = {
  render: () => (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(2, ${toRem(290)})`, gap: toRem(24), alignItems: 'start' }}
    >
      <CardSkeleton />
      <Card product={products[0]} />
    </div>
  ),
}

/** 목록 화면 전체 스켈레톤 (검색창·툴바·개수·카드 8개) */
export const Catalog: Story = {
  render: () => <CatalogSkeleton />,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ padding: toRem(32) }}>
        <Story />
      </div>
    ),
  ],
}

/** 상품 상세 스켈레톤 (app/products/[id]/loading.tsx) */
export const Detail: Story = {
  render: () => <ProductDetailSkeleton />,
  parameters: { layout: 'padded' },
}

/** 위 스켈레톤, 아래 실제 상세 — 사진 자리를 뺀 글자 줄·버튼 위치가 같아야 한다 (사진은 상품마다 비율이 달라 정사각형으로 표시) */
export const DetailCompare: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: toRem(48) }}>
      <ProductDetailSkeleton />
      <ProductDetail product={products[0]} />
    </div>
  ),
  parameters: { layout: 'padded' },
}
