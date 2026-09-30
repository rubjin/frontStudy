import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { Moon } from '../icons'
import { Button, ButtonLink } from './Button'

// Button 스토리 (Step 3-3)
//
// 스토리(story)란? 컴포넌트의 '한 가지 상태'를 이름 붙여 저장해 둔 것.
// 예) Primary, Disabled ... → Storybook 왼쪽 메뉴에 하나씩 나오고, 클릭하면 그 상태로 그려진다.
//
// 파일 구조
// - export default meta: 이 파일의 스토리들이 공통으로 쓰는 설정 (어떤 컴포넌트인지, 기본 props)
// - export const 이름: StoryObj = { args: {...} } → 스토리 하나. args가 그 상태의 props다.
// 스토리 파일을 컴포넌트 옆에 두면(Button.tsx ↔ Button.stories.tsx) 컴포넌트를 고칠 때 함께 보게 된다.

const meta = {
  // 왼쪽 메뉴에서의 위치: 'UI' 폴더 안의 'Button'
  title: 'UI/Button',
  component: Button,
  // 모든 스토리의 기본 props
  // fn(): 가짜 함수. 버튼을 누르면 Actions 탭에 'onClick 호출됨'이 기록된다.
  args: { children: '버튼', onClick: fn() },
  // Controls 탭에서 variant·size를 고르는 방식
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'inline-radio', options: ['md', 'icon'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '공통 버튼. **동작은 `Button`(`<button>`), 페이지 이동은 `ButtonLink`(`<a>`)** 를 쓴다. 모양은 `variant`(역할)와 `size`로 고른다.',
      },
    },
  },
} satisfies Meta<typeof Button>
// satisfies: meta가 Meta 타입에 맞는지 검사하면서도, 실제로 적은 값의 정확한 타입은 그대로 유지한다.
// → 아래 StoryObj<typeof meta>가 args의 기본값까지 알 수 있다.

export default meta
type Story = StoryObj<typeof meta>

/** 화면에서 가장 중요한 행동 하나에 쓴다. */
export const Primary: Story = {
  args: { variant: 'primary', children: '다시 시도' },
}

/** 보조 행동. primary 옆에 둔다. */
export const Secondary: Story = {
  args: { variant: 'secondary', children: '취소' },
}

/** 배경 없는 버튼. 툴바·아이콘 버튼에 쓴다. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: '더보기' },
}

/** 아이콘만 있는 버튼은 스크린리더가 읽을 이름(aria-label)이 꼭 필요하다. */
export const IconOnly: Story = {
  args: { variant: 'ghost', size: 'icon', 'aria-label': '다크 모드로 전환', children: <Moon /> },
}

/** 비활성: 클릭해도 onClick이 호출되지 않는다. (Actions 탭에 기록이 안 남는 것 확인) */
export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: '저장' },
}

/** 모양은 버튼, 실제 태그는 `<a>`. 페이지 이동에 쓴다. */
export const AsLink: Story = {
  // render: args 대신 직접 그릴 때. ButtonLink는 이 파일의 기본 컴포넌트(Button)와 달라서 render로 그린다.
  render: () => (
    <ButtonLink href="/" variant="secondary">
      홈으로 가기
    </ButtonLink>
  ),
}

/** 모든 모양을 한눈에 비교 (디자인 검수용) */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="primary" disabled>
        Disabled
      </Button>
      <Button {...args} variant="ghost" size="icon" aria-label="다크 모드로 전환">
        <Moon />
      </Button>
    </div>
  ),
}
