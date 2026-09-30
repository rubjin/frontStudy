import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import SoldOutToggle from './SoldOutToggle'
import SortSelect from './SortSelect'
import { products } from '@/data/products'
import { getCategories } from '@/lib/filterProducts'
import { SORT_OPTIONS } from '@/lib/sortProducts'
import { toRem } from '@/lib/units'

// 검색·필터·정렬 컨트롤 스토리 (Step 3-3)
//
// 이 컴포넌트들은 '제어 컴포넌트'라서 값(value)을 스스로 기억하지 않는다. (부모가 value와 onChange를 내려줌)
// 그래서 스토리에서 그냥 그리면 클릭해도 값이 바뀌지 않는다.
// → useArgs로 'Storybook의 args'를 부모 state처럼 써서, 클릭하면 args가 바뀌고 다시 그려지게 한다.
//   Controls 탭의 값도 함께 바뀌어서, 조작과 props가 연결되는 것을 눈으로 볼 수 있다.
//
// 각 컴포넌트가 '자기 파일'을 갖는 게 보통이지만, 여기서는 목록 툴바를 이루는 작은 컨트롤 4개를 한 파일에 모았다.

const categories = getCategories(products)

const meta = {
  title: 'Product/Filters',
  component: CategoryFilter,
  parameters: {
    docs: {
      description: {
        component:
          '목록 화면 툴바의 컨트롤들. 모두 **제어 컴포넌트**(값은 부모가 관리, 변경은 onChange로 알림)다. 선택된 카테고리는 클래스가 아니라 `aria-pressed="true"` 선택자로 스타일을 입힌다.',
      },
    },
  },
} satisfies Meta<typeof CategoryFilter>

export default meta
type Story = StoryObj<typeof meta>

/** 카테고리 칩: 눌러서 선택이 바뀌는지, 키보드(Tab·Enter)로도 되는지 확인 */
export const Category: Story = {
  args: { categories, value: categories[0], onChange: fn() },
  render: function Render(args) {
    // useArgs: [현재 args, args를 바꾸는 함수]. 컴포넌트처럼 쓰려고 함수 이름을 대문자로 시작한다(Hook 규칙).
    const [, updateArgs] = useArgs()
    return (
      <CategoryFilter
        {...args}
        onChange={(value) => {
          args.onChange(value) // Actions 탭에 기록
          updateArgs({ value }) // 선택 상태 반영
        }}
      />
    )
  },
}

/** 검색창: 입력하면 Controls의 value도 같이 바뀐다 */
export const Search: StoryObj<typeof SearchBar> = {
  args: { value: '', onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div style={{ maxWidth: toRem(576) }}>
        <SearchBar
          {...args}
          onChange={(value) => {
            args.onChange(value)
            updateArgs({ value })
          }}
        />
      </div>
    )
  },
}

/** 정렬 선택 상자 */
export const Sort: StoryObj<typeof SortSelect> = {
  args: { options: SORT_OPTIONS, value: 'default', onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <SortSelect
        {...args}
        onChange={(value) => {
          args.onChange(value)
          updateArgs({ value })
        }}
      />
    )
  },
}

/** 품절 숨기기 체크박스 */
export const SoldOut: StoryObj<typeof SoldOutToggle> = {
  args: { checked: false, onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <SoldOutToggle
        {...args}
        onChange={(checked) => {
          args.onChange(checked)
          updateArgs({ checked })
        }}
      />
    )
  },
}
