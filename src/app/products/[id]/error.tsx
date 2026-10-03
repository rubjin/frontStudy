'use client'

import StatusView from '@/components/StatusView'
import { Button, ButtonLink } from '@/components/ui/Button'
import { formatTitle } from '@/lib/site'
import { useReportError } from '@/lib/useReportError'

// 상품 상세("/products/:id")의 에러 화면 (Step 4-3b)
//
// 상세에서 에러가 났을 때 사용자가 가장 많이 하고 싶은 것: 다시 보기, 아니면 다른 상품 보러 목록으로.
// 공통 에러 화면(app/error.tsx)의 '홈으로 가기'보다 '목록으로'가 이 자리에 맞는 말이다.
//
// 지금은 상세 페이지를 빌드 때 미리 만들어서(●) 실행 중에 에러가 날 일이 거의 없다.
// (빌드 중에 에러가 나면 빌드 자체가 실패해서 배포되지 않는다)
// Step 6~8에서 상품을 API·DB에서 받아오면, 서버가 응답하지 않을 때 이 화면이 보인다.
//
// 없는 상품(/products/999)은 에러가 아니라 404다. → not-found.tsx가 맡는다.
// '없음'(사용자가 고칠 일)과 '고장'(잠시 후 다시)은 안내가 달라야 해서 파일도 나뉘어 있다.
//
// props, 'use client'가 필요한 이유, <title>을 직접 쓰는 이유는 app/error.tsx 주석과 같다.
const TITLE = '상품 정보를 불러오지 못했습니다'

interface ProductErrorProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function ProductError({ error, retry }: ProductErrorProps) {
  useReportError(error)

  return (
    <>
      <title>{formatTitle(TITLE)}</title>
      <StatusView code="500" title={TITLE} description="일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.">
        <Button onClick={() => retry()}>다시 시도</Button>
        <ButtonLink href="/" variant="secondary">
          목록으로
        </ButtonLink>
      </StatusView>
    </>
  )
}
