// Stylelint 설정 (Step 3-4c)
//
// 역할: CSS/SCSS의 "실수"와 "프로젝트 규칙 위반"을 찾는다. (CSS판 ESLint)
// - 실행: npm run lint:css (검사) / npm run lint:css -- --fix (고칠 수 있는 것은 자동 수정)
// - 모양(들여쓰기·따옴표)은 Prettier가 맡는다. Stylelint 16부터 모양 규칙이 빠져서 둘은 부딪히지 않는다.
//
// 구성
// 1) stylelint-config-standard-scss: 널리 쓰는 추천 규칙 + SCSS 문법 이해(@use, @include, $변수, // 주석)
// 2) 추천 규칙 중 이 프로젝트와 맞지 않는 것 조정 (아래에 이유)
// 3) 프로젝트 규칙: CLAUDE.md에 글로만 적어 두던 약속을 도구가 지키게 한다

// 여러 규칙에서 같이 쓰는 안내 문구
const USE_THEME_VAR = '색은 테마 변수 var(--color-...)만 쓴다. 새 색이 필요하면 src/styles/_themes.scss에 변수를 추가'

/** @type {import('stylelint').Config} */
const config = {
  extends: ['stylelint-config-standard-scss'],

  rules: {
    // ─── 1. 추천 규칙 조정 ─────────────────────────────────

    // CSS Module 클래스는 TSX에서 styles.soldOut처럼 "점(.)으로" 꺼내 쓴다.
    // 추천값 kebab-case(sold-out)면 styles['sold-out']로 써야 해서 camelCase로 바꿨다.
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: (name) => `클래스 이름 ${name}은(는) camelCase로 (CSS Module에서 styles.이름으로 쓰기 위해)` },
    ],
    // :global(...)은 CSS Module 전용 문법 (모듈 밖의 선택자, 예: html[data-theme])
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
    // 투명도는 0.6처럼 숫자로 (opacity: 0.5와 같은 방식. 추천값은 60%)
    'alpha-value-notation': 'number',
    // 글꼴 이름은 대소문자 그대로 (추천 규칙은 값 키워드를 소문자로 바꾸라고 한다)
    'value-keyword-case': ['lower', { ignoreKeywords: ['Pretendard', 'BlinkMacSystemFont'] }],

    // 빈 줄 규칙들 끄기 — "선언 앞에 빈 줄" 같은 모양 규칙이다.
    // 이 프로젝트는 설명 주석과 선언을 붙여 쓰는 곳이 많아서, 켜 두면 주석 문단이 흩어진다.
    'declaration-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'scss/dollar-variable-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,
    // 빈 // 줄로 긴 주석의 문단을 나누기 때문에 끈다
    'scss/comment-no-empty': null,

    // ─── 2. 프로젝트 규칙 ──────────────────────────────────

    // 색: #fff, rgb(), red 같은 값을 직접 쓰지 않는다 → 다크 모드에서 안 바뀌는 색이 생기는 것을 막는다
    'color-no-hex': [true, { message: USE_THEME_VAR }],
    'color-named': ['never', { message: USE_THEME_VAR }],
    'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla'], { message: USE_THEME_VAR }],

    // 크기: rem을 직접 계산해 쓰지 않는다 → to-rem(시안 px) 또는 space(n)
    'unit-disallowed-list': [
      ['rem'],
      { message: 'rem을 직접 쓰지 말고 to-rem(시안 px) 또는 space(n)을 쓴다 (src/styles/_functions.scss)' },
    ],
    // 글자 크기·줄 높이는 px 금지 → 사용자가 브라우저 글자 크기를 키우면 같이 커지도록 (WCAG 1.4.4)
    'declaration-property-unit-disallowed-list': [
      { 'font-size': ['px'], 'line-height': ['px'] },
      { message: '글자 크기·줄 높이는 px 대신 @include text(크기) 또는 to-rem(px)을 쓴다' },
    ],

    // 중첩은 3단계까지 — 깊어지면 선택자가 길어지고(우선순위↑) 덮어쓰기 어려워진다
    'max-nesting-depth': [3, { ignoreAtRules: ['include', 'media'] }],
  },

  overrides: [
    {
      // 색을 "정의"하는 곳: 팔레트(_tokens)와 테마 변수(_themes). 여기서만 실제 색 값을 쓸 수 있다
      files: ['src/styles/_tokens.scss', 'src/styles/_themes.scss'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
      },
    },
    {
      // 전역 CSS는 CSS Module이 아니라 className="sr-only"처럼 문자열로 쓴다 → 일반적인 kebab-case 유지
      files: ['src/styles/globals.scss'],
      rules: {
        'selector-class-pattern': null,
      },
    },
    {
      // to-rem() 함수를 "정의"하는 곳이라 rem 단위를 써야 한다
      files: ['src/styles/_functions.scss'],
      rules: {
        'unit-disallowed-list': null,
      },
    },
  ],
}

export default config
