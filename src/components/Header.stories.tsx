import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Header from './Header'
import ThemeToggle from './ThemeToggle'
import { authSignedIn } from '@/mocks/handlers'

// Header · ThemeToggle 스토리 (Step 3-3)
//
// ThemeToggle은 <html data-theme>을 직접 바꾼다.
// Storybook 툴바의 테마 선택(addon-themes)도 같은 속성을 바꾸므로, 둘 중 어느 것으로 바꿔도 화면이 따라간다.
// (ThemeToggle은 localStorage에도 저장한다 — Storybook과 실제 사이트는 주소가 달라 저장소가 섞이지 않는다)

const meta = {
  title: 'Layout/Header',
  component: Header,
  // fullscreen: 여백 없이 화면 끝까지 (헤더는 가로 전체를 쓰므로)
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '모든 페이지 상단의 헤더. 서버 컴포넌트이고, 상호작용이 필요한 다크 모드 버튼(ThemeToggle)만 클라이언트 컴포넌트다.',
      },
    },
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 로그인한 상태 (Step 9-1) — 헤더 오른쪽에 이름 + 로그아웃 */
export const SignedIn: Story = {
  parameters: { msw: { handlers: { auth: authSignedIn } } },
}

/** 다크 모드 버튼 단독. 눌러서 아이콘·버튼 이름(Accessibility 탭)이 바뀌는지 확인 */
export const ThemeToggleOnly: Story = {
  render: () => <ThemeToggle />,
  parameters: { layout: 'centered' },
}
