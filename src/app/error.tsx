'use client'

import { useEffect } from 'react'
import StatusView from '@/components/StatusView'
import { Button, ButtonLink } from '@/components/ui/Button'
import { formatTitle } from '@/lib/site'

// 에러 페이지 — 페이지를 그리다가 예상하지 못한 에러가 났을 때 (Step 3-1)
//
// 왜 필요한가?
// - 이 파일이 없으면 코드 한 곳에서 에러가 나도 화면 전체가 하얗게 멈추거나 Next.js 기본 에러 화면이 뜬다.
// - error.tsx가 있으면 그 자리만 이 화면으로 바꿔 끼우고, 헤더(layout)는 그대로 남는다.
//   → React의 '에러 경계(Error Boundary)'를 Next.js가 파일 이름 규칙으로 만들어 주는 것이다.
// - Step 6에서 API를 불러오다 실패하는 경우도 이 화면이 받는다.
//
// 'use client'가 꼭 필요한 이유
// 에러 경계는 브라우저에서 동작하고, '다시 시도' 버튼에 onClick이 있기 때문이다.
//
// props (Next.js가 넘겨준다)
// - error: 발생한 에러 객체
//   · message: 에러 내용. 운영(배포) 환경에서 서버 에러는 보안상 일반 문구로 바뀌어 온다.
//   · digest:  서버 로그에서 같은 에러를 찾을 때 쓰는 식별 번호
// - retry: 에러 난 부분을 다시 불러와 그려 보는 함수. 일시적인 네트워크 문제라면 이걸로 복구된다.
//   (예전 Next.js 문서에는 reset으로 나오지만, 지금 버전에서는 retry를 권장한다)
// 탭 제목(<title>)과 화면 제목(StatusView)에 같은 문구를 쓰므로 상수로 한 번만 적는다
const TITLE = '문제가 발생했습니다'

interface ErrorPageProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  // 에러를 콘솔에 남긴다. 실무에서는 여기서 Sentry 같은 에러 수집 서비스로 보낸다.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    // Fragment(<>): <title>과 StatusView를 함께 돌려주려고 감싼다
    <>
      {/* error.tsx는 'use client'라서 metadata를 내보낼 수 없다.
          대신 React 19부터는 컴포넌트 어디에서든 <title>을 쓰면 React가 <head>로 옮겨 준다.
          이 방식은 레이아웃의 title.template이 적용되지 않으므로, 같은 형식을 만드는 formatTitle로 직접 감싼다. */}
      <title>{formatTitle(TITLE)}</title>
      <StatusView code="500" title={TITLE} description="일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.">
        {/* 다시 시도 = 현재 화면에서 동작 실행 → Button (가장 중요한 행동이라 primary) */}
        <Button onClick={() => retry()}>다시 시도</Button>
        {/* 홈으로 = 페이지 이동 → ButtonLink (보조 행동이라 secondary) */}
        <ButtonLink href="/" variant="secondary">
          홈으로 가기
        </ButtonLink>
      </StatusView>
    </>
  )
}
