import { useEffect } from 'react'

// 에러 기록 훅 — error.tsx 파일들이 공통으로 쓴다 (Step 4-3b)
//
// 왜 따로 뺐나?
// - 에러 화면이 app/error.tsx 하나에서 구간별로 늘어났다. (홈 (catalog)/error.tsx, 상세 products/[id]/error.tsx)
// - 파일마다 useEffect(() => console.error(error))를 복사해 두면,
//   나중에 실무처럼 에러 수집 서비스(Sentry 등)로 보내도록 바꿀 때 모든 파일을 고쳐야 한다.
// - 이 훅 한 곳만 고치면 모든 에러 화면에 적용된다.
//
// 훅(use로 시작하는 함수)이란?
// - useState·useEffect 같은 React 기능을 묶어서 재사용하는 함수. 이름이 use로 시작해야 React가 훅 규칙을 검사해 준다.
// - 컴포넌트처럼 화면을 그리지 않고 '동작'만 나눠 쓴다.
//
// 'use client'를 적지 않은 이유: 이 파일은 컴포넌트가 아니라 훅이라서, 부르는 쪽(error.tsx)이 클라이언트면 같이 클라이언트에서 돈다.
//
// 매개변수
// - error: Next.js가 error.tsx에 넘겨준 에러 객체. digest는 서버 로그에서 같은 에러를 찾는 번호
export function useReportError(error: Error & { digest?: string }) {
  // 화면이 그려진 뒤 한 번, 그리고 다른 에러로 바뀔 때마다 기록한다
  useEffect(() => {
    console.error(error)
  }, [error])
}
