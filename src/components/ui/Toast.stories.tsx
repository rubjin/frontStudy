import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'
import { ToastProvider, useToast, type ToastOptions } from './Toast'

// 토스트 알림 스토리 (Step 5-4)
//
// 토스트는 컴포넌트를 직접 그리는 게 아니라 useToast()의 showToast()로 띄운다.
// → 스토리에서는 버튼(Trigger)을 눌러 띄우고, 'Shown'은 화면이 열리자마자 띄워서 모양·접근성 검사를 바로 볼 수 있게 했다.
// ToastProvider는 preview.tsx에서 이미 감싸고 있다.

// 버튼을 누르면 토스트를 띄운다. autoShow면 처음 한 번 바로 띄운다
function Trigger({ autoShow = false, ...options }: ToastOptions & { autoShow?: boolean }) {
  const { showToast } = useToast()

  useEffect(() => {
    if (autoShow) showToast(options)
    // 처음 한 번만 (options는 매번 새 객체라 의존성에 넣으면 계속 다시 띄운다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Button onClick={() => showToast(options)}>알림 띄우기</Button>
}

const meta = {
  title: 'UI/Toast',
  component: ToastProvider,
  args: {
    // ToastProvider의 children 자리에 Trigger를 넣지 않고 render에서 그린다. (args 표시용 기본값)
    children: null,
  },
  parameters: {
    // 토스트가 화면 아래에 고정되므로 미리보기 높이를 확보한다
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '화면 아래에 잠깐 떴다 사라지는 알림. `useToast().showToast({ message, action })`으로 띄운다. 5초 뒤 닫히고, 마우스를 올리거나 포커스가 안에 있으면 멈춘다. 알림 영역(`role="status"`)은 항상 DOM에 있어 스크린리더가 읽는다.',
      },
      story: { inline: false, iframeHeight: 200 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

/** 버튼을 눌러 띄우기 (링크 포함) */
export const Default: Story = {
  render: () => (
    <Trigger
      message="스마트워치 5세대 — 장바구니에 담았습니다. 현재 1개"
      action={{ href: '/cart', label: '장바구니 보기' }}
    />
  ),
}

/** 열리자마자 떠 있는 상태 (모양·접근성 확인용) */
export const Shown: Story = {
  render: () => (
    <Trigger
      autoShow
      message="스마트워치 5세대 — 장바구니에 담았습니다. 현재 1개"
      action={{ href: '/cart', label: '장바구니 보기' }}
    />
  ),
}

/** 문구만 */
export const MessageOnly: Story = {
  render: () => <Trigger autoShow message="저장했습니다." />,
}

/** 긴 문구 — 좁은 화면에서 줄바꿈 */
export const LongMessage: Story = {
  render: () => (
    <Trigger
      autoShow
      message="재고가 바뀐 상품이 있어 장바구니 수량을 조정했습니다. 장바구니에서 수량과 금액을 다시 확인해 주세요."
      action={{ href: '/cart', label: '장바구니 보기' }}
    />
  ),
  globals: { viewport: { value: 'mobile1' } },
}
