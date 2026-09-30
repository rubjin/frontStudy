// lint-staged 설정 (Step 3-4d)
//
// 역할: 커밋할 파일(stage에 올린 파일)에만 검사·정리 명령을 실행한다.
// - 실행 시점: git commit 직전, .husky/pre-commit이 `npx lint-staged`를 부른다.
// - 왜 "바뀐 파일만"? 전체 검사는 파일이 늘수록 느려진다. 커밋할 때마다 몇십 초씩 기다리면 결국 아무도 안 쓴다.
//
// 동작 방식
// - 키: 파일 패턴(glob), 값: 그 파일에 차례로 실행할 명령 배열
// - 명령 뒤에 해당 파일 경로들이 자동으로 붙는다. 예) eslint --fix src/components/Card.tsx
// - --fix / --write로 고친 내용은 자동으로 커밋에 다시 포함된다.
// - 명령 중 하나라도 실패하면(고칠 수 없는 에러) 커밋이 취소되고, 파일은 커밋 전 상태로 되돌아간다.
//
// 주의: 패턴끼리 겹치면(같은 파일이 두 패턴에 걸리면) 두 작업이 동시에 같은 파일을 고치다 충돌할 수 있다.
//       그래서 확장자별로 겹치지 않게 나눴다.

/** @type {import('lint-staged').Configuration} */
const config = {
  // TypeScript: 실수 검사(ESLint) → 모양 정리(Prettier) → 타입 검사(tsc)
  // --no-warn-ignored: eslint.config.mjs에서 제외한 파일(next-env.d.ts 등)이 넘어와도 경고하지 않는다
  // tsc: 타입은 파일 하나만 봐서는 알 수 없다 (A 파일 수정이 B 파일의 타입을 깨뜨릴 수 있음)
  //      → 함수 형태로 쓰면 파일 경로를 붙이지 않고, 프로젝트 전체를 한 번 검사한다
  '*.{ts,tsx}': ['eslint --fix --no-warn-ignored', 'prettier --write', () => 'tsc --noEmit'],

  // JavaScript(설정 파일 등): 타입 검사 없이 ESLint → Prettier
  '*.{js,mjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],

  // SCSS: 규칙 검사(Stylelint) → 모양 정리(Prettier)
  '*.scss': ['stylelint --fix', 'prettier --write'],

  // 그 밖에 Prettier가 정리하는 파일 (마크다운은 .prettierignore에서 제외)
  '*.{json,css,yml,yaml}': 'prettier --write',
}

export default config
