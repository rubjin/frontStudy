import type { Preview } from '@storybook/nextjs-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import { CartProvider } from '../src/components/CartProvider'
import { ToastProvider } from '../src/components/ui/Toast'
// 실제 사이트(layout.tsx)와 같은 폰트·전역 스타일을 불러온다
// → 스토리에서 보이는 모양 = 실제 사이트의 모양
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '../src/styles/globals.scss'

// Storybook 화면(미리보기) 전역 설정 (Step 3-3)
//
// preview.tsx는 '모든 스토리에 공통으로 적용되는 것'을 정한다.
// - 전역 CSS (위 import)
// - decorators: 모든 스토리를 감싸는 포장지
// - parameters: 애드온·프레임워크 옵션
const preview: Preview = {
  // tags: ['autodocs'] — 모든 컴포넌트에 Docs(문서) 페이지를 자동으로 만든다.
  // 스토리 + props 타입(TypeScript) + JSDoc 주석을 읽어서 props 표와 예시를 만든다.
  tags: ['autodocs'],

  decorators: [
    // 장바구니 상태 (Step 5-1)
    // 실제 사이트는 layout.tsx가 CartProvider로 감싼다. 담기 버튼·헤더 장바구니 링크처럼 useCart()를 쓰는 컴포넌트가
    // 스토리에서도 동작하도록 모든 스토리를 감싼다. 스토리마다 새 Provider라 장바구니는 스토리끼리 섞이지 않는다.
    // persist={false} (Step 5-3): localStorage에 저장하지 않는다. 스토리들은 같은 주소(=같은 localStorage)라서
    // 저장하면 한 스토리에서 담은 상품이 다른 스토리에 나타난다.
    (Story) => (
      // ToastProvider (Step 5-4): 담기 버튼이 useToast()로 알림을 띄운다. layout.tsx와 같은 순서(토스트가 바깥)
      <ToastProvider>
        <CartProvider persist={false}>
          <Story />
        </CartProvider>
      </ToastProvider>
    ),
    // 다크 모드 전환 (addon-themes)
    // 실제 사이트처럼 <html data-theme="dark">를 붙였다 뗐다 한다.
    // → _themes.scss의 [data-theme='dark'] 변수가 그대로 적용되어, 스토리마다 다크 모드용 코드를 따로 쓸 필요가 없다.
    // 툴바의 붓 아이콘에서 light / dark를 고른다.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],

  parameters: {
    // Next.js App Router 기준으로 next/navigation(useRouter 등)을 흉내 낸다
    nextjs: { appDirectory: true },

    // Controls 탭: props 이름이 on으로 시작하면 이벤트로, color/date가 들어가면 색상·날짜 입력으로 보여 준다
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },

    // 접근성 검사 (addon-a11y)
    // 'todo': 문제를 Accessibility 탭에 보여 주되 실패로 처리하지는 않는다.
    // (Step 10에서 테스트와 연결할 때 'error'로 올려 CI에서 막을 수 있다)
    a11y: { test: 'todo' },
  },
}

export default preview
