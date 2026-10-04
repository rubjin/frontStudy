import path from 'node:path'
import { mergeConfig } from 'vite'
import type { StorybookConfig } from '@storybook/nextjs-vite'

// Storybook 기본 설정 (Step 3-3)
//
// Storybook이란?
// - 컴포넌트를 페이지와 떼어서 하나씩 띄워 보는 '컴포넌트 작업실 + 살아 있는 UI 가이드'.
// - 버튼의 모든 모양, 카드의 품절 상태, 다크 모드처럼 페이지에서는 한 번에 보기 힘든 상태들을 한곳에서 확인한다.
// - 실행: npm run storybook → http://localhost:6006
//
// 이 파일(main.ts)은 'Storybook 자체'의 설정: 어떤 파일을 스토리로 읽을지, 어떤 기능(애드온)을 켤지.
// 화면에 적용할 전역 스타일·테마는 preview.tsx에서 정한다.
const config: StorybookConfig = {
  // 스토리 파일 위치: 컴포넌트 옆에 Button.stories.tsx 처럼 둔다 (코로케이션)
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],

  // 애드온(추가 기능)
  // - addon-docs:   스토리와 props 타입으로 문서 페이지를 자동으로 만든다 (Docs 탭)
  // - addon-a11y:   각 스토리를 axe로 검사해 접근성 문제를 알려 준다 (Accessibility 탭)
  // - addon-themes: 툴바에서 라이트/다크 테마를 바꿔 볼 수 있게 한다
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],

  // 프레임워크: Next.js + Vite
  // next/image, next/link, next/navigation(useRouter) 같은 Next.js 전용 기능을 Storybook 안에서도 흉내 내 준다.
  // (예: BackButton의 router.back()이 Storybook에서 에러 없이 동작)
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },

  // public 폴더를 그대로 제공 → '/images/products/1.jpg' 같은 경로가 Storybook에서도 열린다
  // ./public (Step 6-4): MSW 서비스 워커(mockServiceWorker.js). 사이트의 public/에 두면 실제 배포에도 섞여 나가므로
  //   Storybook 전용 폴더에 따로 둔다. (npx msw init .storybook/public 으로 생성, package.json의 msw.workerDirectory)
  staticDirs: ['../public', './public'],

  // Vite 설정 덧붙이기
  // Next.js의 sassOptions.loadPaths(next.config.ts)와 같은 설정을 Storybook(Vite)에도 해 준다.
  // → 컴포넌트 SCSS 첫 줄 @use 'styles' as *; 가 Storybook에서도 src/styles를 찾는다.
  // mergeConfig: 기존 설정을 지우지 않고 필요한 부분만 합친다
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      css: {
        preprocessorOptions: {
          scss: {
            loadPaths: [path.resolve(process.cwd(), 'src')],
          },
        },
      },
    }),
}

export default config
