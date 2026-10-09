import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import AuthForm from './AuthForm'
import { toRem } from '@/lib/units'

// 회원가입·로그인 폼 스토리 (Step 9-1)
//
// 실제 제출은 Server Action(서버)이라 Storybook에서는 실행할 수 없다.
// 대신 '제출하면 이런 결과가 온다'를 흉내 내는 가짜 action을 넣고, 에러 상태는 initialState로 바로 보여 준다.

type FormState = Parameters<typeof AuthForm>[0]['initialState']

// 가짜 action: 비어 있는 칸을 에러로 돌려준다 (서버 검사 결과 흉내)
async function fakeAction(_state: NonNullable<FormState>, formData: FormData): Promise<NonNullable<FormState>> {
  const errors: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key !== 'next' && String(value).trim() === '') errors[key] = '값을 입력해 주세요. (스토리용 가짜 검사)'
  }
  return Object.keys(errors).length
    ? { errors }
    : { message: '스토리에서는 실제로 가입·로그인되지 않습니다. (Server Action은 서버에서 실행)' }
}

const meta = {
  title: 'Auth/AuthForm',
  component: AuthForm,
  args: { mode: 'login', action: fakeAction },
  decorators: [
    (Story) => (
      <div style={{ width: toRem(480) }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '회원가입·로그인 폼. 서버(Server Action)의 검사 결과를 받아 칸별 에러·요약을 보여 주고 첫 에러 칸으로 포커스한다. 모양은 `ui/Form.module.scss`(상품 폼과 공통).',
      },
    },
  },
} satisfies Meta<typeof AuthForm>

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {}

export const SignUp: Story = {
  args: { mode: 'signup' },
}

/** 빈 칸으로 제출했을 때 — 칸별 문구 + 요약 */
export const SignUpErrors: Story = {
  args: {
    mode: 'signup',
    initialState: {
      errors: {
        email: '이메일 형식이 올바르지 않습니다. 예) name@example.com',
        password: '비밀번호는 8자 이상이어야 합니다.',
        passwordConfirm: '비밀번호가 서로 다릅니다.',
      },
      values: { name: '홍길동', email: 'hong@' },
    },
  },
}

/** 이메일 또는 비밀번호가 틀렸을 때 — 어느 쪽이 틀렸는지 알려 주지 않는다 */
export const LoginFailed: Story = {
  args: {
    initialState: { message: '이메일 또는 비밀번호가 올바르지 않습니다.', values: { email: 'hong@example.com' } },
  },
}
