import 'server-only'

// 느린 서버·실패를 흉내 내는 함수 (Step 6-1)
//
// 왜 필요한가?
// - 지금 데이터는 메모리(목 데이터 파일)에 있어서 0ms 만에 응답한다. 로딩 화면·에러 화면을 볼 기회가 없다.
// - 실제 API·DB는 느릴 때도, 실패할 때도 있다. 그 상황의 화면을 개발 중에 확인하려고 일부러 늦추고 실패시킨다.
//
// 환경 변수로 켠다 (기본은 꺼짐 → 평소에는 영향 없음)
//   MOCK_API_DELAY_MS=1500   모든 데이터 요청을 1.5초 늦춘다
//   MOCK_API_ERROR_RATE=0.3  30% 확률로 실패한다 (0 ~ 1)
// 예) MOCK_API_DELAY_MS=1500 npm run dev
//     .env.local 파일에 적어 두어도 된다 (커밋되지 않음)
//
// import 'server-only': 이 파일을 브라우저용 코드('use client')에서 import하면 빌드가 실패하게 한다.
// 서버에서만 의미 있는 코드(환경 변수, DB 접근)가 실수로 브라우저 번들에 섞이는 것을 막는 안전장치.

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function simulateNetwork(): Promise<void> {
  // 빌드 중(상세 페이지를 미리 만들 때)에는 흉내 내지 않는다.
  // .env.local에 실패 확률을 적어 두면 빌드도 무작위로 실패하기 때문이다. NEXT_PHASE는 Next.js가 넣어 주는 값
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  // 환경 변수는 항상 문자열(또는 undefined). Number()로 바꾸고, 숫자가 아니면 0
  const delay = Number(process.env.MOCK_API_DELAY_MS) || 0
  const errorRate = Number(process.env.MOCK_API_ERROR_RATE) || 0

  if (delay > 0) await wait(delay)
  if (errorRate > 0 && Math.random() < errorRate) {
    throw new Error('[mock] 데이터 서버 응답 실패 (MOCK_API_ERROR_RATE)')
  }
}
