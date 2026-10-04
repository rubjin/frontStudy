import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import storybook from 'eslint-plugin-storybook'
import prettier from 'eslint-config-prettier/flat'

// ESLint 설정 (Step 3-1에서 Next.js용으로 교체)
// - core-web-vitals: React·Hooks 규칙 + Next.js 권장 규칙(<img> 대신 next/image 등)
// - typescript:      TypeScript 권장 규칙
// 예전 Vite 설정에서 직접 넣던 react, react-hooks 플러그인이 여기에 모두 들어 있다.
// - storybook (Step 3-3): *.stories.tsx 작성 규칙 (예: 스토리 이름 규칙, 기본 export 필수)
// - prettier (Step 3-4b): 코드 "모양"에 관한 ESLint 규칙(들여쓰기, 따옴표 등)을 모두 끈다.
//   모양은 Prettier가 맡으므로, 두 도구가 서로 다른 답을 요구하며 부딪히지 않게 한다.
//   앞 설정의 규칙을 덮어써서 끄는 방식이라 반드시 배열의 "마지막"에 둔다.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...storybook.configs['flat/recommended'],
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'storybook-static/**',
    // MSW 서비스 워커 (Step 6-4) — 라이브러리가 생성하는 파일
    '.storybook/public/mockServiceWorker.js',
    // Prisma가 만든 DB 클라이언트 (Step 8-1) — 생성물
    'src/generated/**',
  ]),
])
