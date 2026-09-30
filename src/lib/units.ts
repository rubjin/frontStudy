// 단위 변환 함수 (Step 3-3 보강)
//
// toRem(): 시안(피그마)의 px 숫자를 rem 문자열로 바꾼다.
// SCSS의 to-rem()(src/styles/_functions.scss)과 같은 규칙을 TSX에서 쓰기 위한 함수다.
// 스켈레톤 크기처럼 스타일 값을 props(width="...")로 넘겨야 할 때 쓴다.
//
// 사용 예
//   toRem(24)        → '1.5rem'
//   toRem(12, 16)    → '0.75rem 1rem'   (여러 값은 공백으로 이어 붙임 — padding 같은 줄임 속성용)
//   toRem(0)         → '0'
//   `calc(${toRem(32)} + 2px)` → 'calc(2rem + 2px)'
//
// 왜 rem인가? → 사용자가 브라우저 글자 크기를 키우면 함께 커진다. (자세한 이유는 _functions.scss 주석)

// 기준 글자 크기. SCSS의 $root-font-size와 같아야 한다.
export const ROOT_FONT_SIZE = 16

// ...px: 나머지 매개변수. toRem(12, 16)처럼 개수 제한 없이 받아서 배열(px)로 모은다.
export function toRem(...px: number[]): string {
  return px.map((value) => (value === 0 ? '0' : `${value / ROOT_FONT_SIZE}rem`)).join(' ')
}
