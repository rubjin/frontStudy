import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import BackButton from './BackButton'
import StatusView from './StatusView'
import { Button, ButtonLink } from './ui/Button'

// StatusView 스토리 (Step 3-3)
// 404·에러 화면의 공통 틀. 실제 페이지에서는 일부러 에러를 내야 볼 수 있는 화면을 여기서 바로 확인한다.

const meta = {
  title: 'Feedback/StatusView',
  component: StatusView,
  parameters: {
    docs: {
      description: {
        component:
          '404·에러처럼 **모양은 같고 문구·버튼만 다른** 안내 화면의 공통 틀. 문구는 쓰는 쪽(`not-found.tsx`, `error.tsx`)이 넘기고, 버튼은 `children`으로 받는다.',
      },
    },
  },
} satisfies Meta<typeof StatusView>

export default meta
type Story = StoryObj<typeof meta>

/** app/not-found.tsx와 같은 구성 */
export const NotFound: Story = {
  args: {
    code: '404',
    title: '페이지를 찾을 수 없습니다',
    description: '주소가 잘못되었거나 삭제된 페이지입니다.',
    children: (
      <>
        <BackButton />
        <ButtonLink href="/">홈으로 가기</ButtonLink>
      </>
    ),
  },
}

/** app/error.tsx와 같은 구성 */
export const ServerError: Story = {
  args: {
    code: '500',
    title: '문제가 발생했습니다',
    description: '일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.',
    children: (
      <>
        <Button onClick={fn()}>다시 시도</Button>
        <ButtonLink href="/" variant="secondary">
          홈으로 가기
        </ButtonLink>
      </>
    ),
  },
}

/** 코드·설명·버튼 없이 제목만 (필수 props는 title 하나) */
export const TitleOnly: Story = {
  args: { title: '준비 중인 페이지입니다' },
}
