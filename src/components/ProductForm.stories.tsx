import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductForm } from './ProductForm'
import { DeleteProductButton } from './DeleteProductButton'

// 상품 관리 폼 스토리 (Step 8-3)
//
// 실제 사이트에서는 action에 Server Action(서버 함수)을 넣는다. Storybook에는 서버가 없으므로
// 같은 모양((state, formData) => Promise<state>)의 가짜 함수를 넣는다.
// '제출하면 에러' 스토리: 가짜 액션이 서버처럼 검사 결과를 돌려준다 → 칸별 문구·요약·첫 칸 포커스를 확인

const categories = ['전체', '오디오', '웨어러블', '주변기기']

// 0.6초 기다린 뒤 결과를 돌려주는 가짜 액션 (저장 중… 상태를 볼 수 있게)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 가짜 액션의 타입 = ProductForm이 받는 action의 타입 (Parameters<typeof 컴포넌트>[0] = props 타입)
type FormAction = Parameters<typeof ProductForm>[0]['action']

const failingAction: FormAction = async (_prev, formData) => {
  await wait(600)
  return {
    errors: { name: '상품명을 입력해 주세요.', price: '가격을 숫자로 입력해 주세요.' },
    values: Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)])),
  }
}

const noopAction: FormAction = async () => {
  await wait(600)
  return {}
}

const meta = {
  title: 'Admin/ProductForm',
  component: ProductForm,
  args: { action: noopAction, categories, submitLabel: '추가', defaultValues: { rating: 0, stock: 0 } },
  parameters: {
    docs: {
      description: {
        component:
          '관리 화면의 상품 추가·수정 폼. 검사는 서버(Server Action + zod)가 하고, 돌려준 칸별 문구를 aria-describedby로 칸에 연결한다. 에러가 있으면 요약(role="alert")과 첫 잘못된 칸 포커스.',
      },
    },
  },
} satisfies Meta<typeof ProductForm>

export default meta
type Story = StoryObj<typeof meta>

/** 추가 — 빈 폼 */
export const Create: Story = {}

/** 수정 — 지금 값이 채워진 폼 */
export const Edit: Story = {
  args: {
    submitLabel: '저장',
    defaultValues: { name: '스마트워치 5세대', category: '웨어러블', price: 329000, stock: 5, rating: 4.3 },
  },
}

/** 서버 검사 에러 (처음부터 에러 상태) */
export const WithErrors: Story = {
  args: {
    initialState: {
      errors: { name: '상품명을 입력해 주세요.', price: '가격은 0 이상이어야 합니다.' },
      values: { name: '', category: '오디오', price: '-1', stock: '3', rating: '4' },
    },
  },
}

/** 제출하면 에러 — '추가'를 눌러 저장 중… → 에러 → 첫 칸 포커스 */
export const SubmitFails: Story = {
  args: { action: failingAction },
}

/** 삭제 버튼 — 누르면 확인 대화상자 */
export const DeleteButton: Story = {
  render: () => (
    <DeleteProductButton
      productName="스마트워치 5세대"
      action={async () => {
        await wait(600)
      }}
    />
  ),
}
