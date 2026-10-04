import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { InlineError } from './InlineError'

// 영역 안 불러오기 실패 안내 스토리 (Step 7-2)

const meta = {
  title: 'UI/InlineError',
  component: InlineError,
  args: {
    title: '상품 목록을 불러오지 못했습니다.',
    description: '잠시 후 다시 시도해 주세요.',
    onRetry: fn(),
  },
} satisfies Meta<typeof InlineError>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 */
export const Default: Story = {}

/** 네트워크 끊김 문구 */
export const Offline: Story = {
  args: { description: '네트워크 연결을 확인해 주세요.' },
}

/** 다시 받는 중 — 버튼 aria-disabled */
export const Retrying: Story = {
  args: { retrying: true },
}
