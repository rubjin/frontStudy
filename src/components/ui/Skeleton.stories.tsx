import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Skeleton } from './Skeleton'
import { toRem } from '@/lib/units'

// Skeleton 스토리 (Step 3-3)
// 로딩 중 자리 표시 조각. 실제로는 CardSkeleton·CatalogSkeleton이 조립해서 쓴다.
// 툴바에서 다크 모드로 바꿔 색이 테마를 따라가는지, 반짝임 애니메이션이 보이는지 확인한다.

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  argTypes: {
    radius: { control: 'inline-radio', options: ['md', 'lg', 'full'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '로딩 중에 최종 화면과 같은 모양을 보여 주는 회색 조각. `block`이 없으면 **글자처럼 줄 안에** 들어가서 원래 줄 높이를 유지하고, `block`이면 한 줄 전체를 차지하는 상자가 된다. 스크린리더에는 숨겨진다(`aria-hidden`).',
      },
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/** 글자 한 줄 자리. Controls에서 width를 바꿔 본다. */
export const Inline: Story = {
  args: { width: toRem(192) },
}

/** 이미지·입력창 자리처럼 한 줄 전체를 차지하는 상자 */
export const Block: Story = {
  args: { block: true, height: toRem(128), radius: 'lg' },
}

/** 둥글기 비교 */
export const Radius: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: toRem(16), alignItems: 'center' }}>
      <Skeleton width={toRem(96)} height={toRem(32)} radius="md" />
      <Skeleton width={toRem(96)} height={toRem(32)} radius="lg" />
      <Skeleton width={toRem(96)} height={toRem(32)} radius="full" />
    </div>
  ),
}

/**
 * 글자 태그 안에 넣으면 줄 높이가 그대로 유지된다.
 * 왼쪽(실제 글자)과 오른쪽(스켈레톤)의 높이가 같은지 비교한다.
 */
export const KeepsLineHeight: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: toRem(32), alignItems: 'flex-start' }}>
      <p style={{ fontSize: toRem(18), lineHeight: toRem(28), outline: '1px dashed gray' }}>₩189,000</p>
      <p style={{ fontSize: toRem(18), lineHeight: toRem(28), outline: '1px dashed gray' }}>
        <Skeleton width={toRem(88)} />
      </p>
    </div>
  ),
}
