// 다크 모드(테마) 관련 값과 함수 (Step 3-2)
//
// 테마는 React state가 아니라 <html data-theme="dark"> 속성 하나에 저장한다.
// - CSS가 이 속성을 보고 색을 바꾼다 (styles/_themes.scss)
// - 사용자가 고른 값은 localStorage에 저장해서 새로고침해도 유지한다

export type Theme = 'light' | 'dark'

// localStorage에 저장할 때 쓰는 이름. 여러 곳에서 같은 이름을 써야 하므로 상수로 둔다.
export const THEME_STORAGE_KEY = 'theme'

// 테마 적용 + 저장
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme // <html data-theme="dark">
  // localStorage는 사생활 보호 모드 등에서 에러가 날 수 있다.
  // 저장에 실패해도 화면 전환은 되도록 try...catch로 감싼다.
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // 저장 실패는 무시한다 (이번 방문 동안만 유지됨)
  }
}

// 지금 적용된 테마
export function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// 깜빡임(FOUC) 방지 스크립트 — layout.tsx의 <head>에 '문자열 그대로' 넣는다
//
// 왜 필요한가?
// - 서버는 사용자의 localStorage를 볼 수 없어서, HTML은 항상 라이트 모드로 온다.
// - React가 브라우저에서 실행된 뒤에 다크 모드를 적용하면, 그 사이 잠깐 흰 화면이 번쩍인다.
//   (Flash Of Unstyled Content — 다크 모드 사용자에게 매우 거슬린다)
// - 그래서 화면이 그려지기 '전'에, React보다 먼저 실행되는 작은 스크립트로 data-theme을 붙인다.
//
// 순서: ① 저장된 값이 있으면 그것 ② 없으면 운영체제 설정(prefers-color-scheme) ③ 그래도 없으면 라이트
//
// 왜 문자열인가? 이 코드는 번들(React 코드)에 들어가지 않고 HTML에 그대로 박혀서 즉시 실행되어야 한다.
// 그래서 import 없이 동작하는 옛날 문법(var, function)으로 쓰고, 즉시 실행 함수 (function(){ ... })() 로 감싼다.
export const themeInitScript = `(function () {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`
