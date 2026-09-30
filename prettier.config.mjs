// Prettier 설정 (Step 3-4b)
//
// 역할: 코드 "모양"(따옴표, 세미콜론, 줄 길이, 들여쓰기)을 자동으로 다시 써 준다.
// - 실행: npm run format (고치기) / npm run format:check (검사만, 고치지 않음)
// - ESLint는 "실수"(안 쓰는 변수, Hooks 규칙 위반)를 찾고, Prettier는 "모양"만 맡는다.
//   둘이 부딪히지 않도록 eslint.config.mjs에 eslint-config-prettier를 넣었다.
//
// 왜 .prettierrc(JSON)가 아니라 .mjs인가?
// - JSON에는 주석을 쓸 수 없다. 설정마다 "왜 이 값인지"를 적어 두려고 JS 파일로 만들었다.
// - 아래 @type 주석 덕분에 VS Code에서 옵션 이름 자동 완성·오타 검사가 된다.
//
// 들여쓰기(2칸)·줄바꿈(LF)은 .editorconfig 값을 Prettier가 그대로 읽으므로 여기에 다시 적지 않는다.

/** @type {import('prettier').Config} */
const config = {
  // 세미콜론 없음 — Step 1부터 써 온 스타일 그대로
  semi: false,
  // 문자열은 작은따옴표. (JSX 속성은 HTML처럼 큰따옴표 유지: jsxSingleQuote 기본값 false)
  singleQuote: true,
  // 한 줄 최대 길이. 기본값 80은 한글 주석·JSX className 조합이 너무 자주 꺾여서 120으로 늘렸다
  printWidth: 120,
  // 객체 키 따옴표(quoteProps)는 기본값 'as-needed' — 필요한 키('aria-label', 'price-asc')에만 붙인다.
  // 'consistent'(하나라도 필요하면 전부)는 React props 객체에서 variant·size까지 따옴표가 붙어 오히려 어색했다.
}

// 부분만 정리에서 빼고 싶을 때: 바로 윗줄에 `// prettier-ignore` (JSX 안은 {/* prettier-ignore */})
// 예) src/data/products.ts — 표처럼 열을 맞춘 목 데이터

export default config
