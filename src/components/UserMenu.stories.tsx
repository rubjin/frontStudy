import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import UserMenu from './UserMenu'
import { authLoading, authSignedIn, authSignedInAdmin } from '@/mocks/handlers'

// 헤더 로그인 상태 스토리 (Step 9-1)
// UserMenu는 GET /api/auth/get-session으로 로그인 상태를 받는다 → MSW 핸들러(src/mocks/handlers.ts)로 상태별 재현
// 기본(preview.tsx)은 로그아웃 상태. 스토리에서 auth 키만 바꿔 끼운다.

const meta = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '헤더의 로그인 상태. 페이지를 미리 만들어 둘 수 있게 서버가 아니라 브라우저에서 로그인 여부를 확인한다(장바구니 배지와 같은 방식). 확인 중에는 회색 자리, 로그아웃이면 로그인 링크, 로그인이면 이름(넓은 화면) + 로그아웃.',
      },
    },
  },
} satisfies Meta<typeof UserMenu>

export default meta
type Story = StoryObj<typeof meta>

/** 로그아웃 상태 — '로그인' 링크 */
export const SignedOut: Story = {}

/** 로그인 상태 — 이름 + 로그아웃 (이름은 640px 이상에서만 보인다) */
export const SignedIn: Story = {
  parameters: { msw: { handlers: { auth: authSignedIn } } },
}

/** 관리자로 로그인 (Step 9-2) — '관리' 링크가 더 보인다 */
export const SignedInAdmin: Story = {
  parameters: { msw: { handlers: { auth: authSignedInAdmin } } },
}

/** 로그인 상태 확인 중 — 버튼 크기의 회색 자리 */
export const Checking: Story = {
  parameters: { msw: { handlers: { auth: authLoading } } },
}
