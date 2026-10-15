
//개발용 유틸리티 : 실제 API서버가 없어도 서버 응답이 느리거나 실패하는 상황을 가짜로 만들어주는 개발용 유틸리티

import 'server-only'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function simulateNetwork(): Promise<void> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return

}

