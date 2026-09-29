import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// ESLint 설정 (Step 3-1에서 Next.js용으로 교체)
// - core-web-vitals: React·Hooks 규칙 + Next.js 권장 규칙(<img> 대신 next/image 등)
// - typescript:      TypeScript 권장 규칙
// 예전 Vite 설정에서 직접 넣던 react, react-hooks 플러그인이 여기에 모두 들어 있다.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
