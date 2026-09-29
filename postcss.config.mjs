// PostCSS 설정 — Tailwind를 CSS로 변환한다.
// Step 3-2에서 SCSS Module로 전환하면 이 파일과 Tailwind는 삭제한다.
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
