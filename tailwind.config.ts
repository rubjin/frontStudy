import type { Config } from 'tailwindcss'

// Tailwind 설정 (Step 3-1에서 TS로 바꾸고 content 경로만 수정)
// Step 3-2에서 SCSS Module로 전환하면서 삭제한다.
// 여기 있는 primary/accent 색상표는 3-2에서 SCSS 디자인 토큰으로 옮긴다.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
    },
  },
  plugins: [],
}

export default config
