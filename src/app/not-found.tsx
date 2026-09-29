import type { Metadata } from 'next'
import BackButton from '@/components/BackButton'
import StatusView from '@/components/StatusView'
import { ButtonLink } from '@/components/ui/Button'

// 404 페이지 — 어떤 페이지에도 맞지 않는 주소 (Step 3-1)
//
// react-router 시절에는 <Route path="*">로 직접 연결했다.
// Next.js에서는 app/not-found.tsx라는 '약속된 파일 이름'만 만들면 자동으로 쓰인다.
// 서버가 HTTP 상태 코드도 404로 보내 주므로, 검색엔진이 '없는 페이지'로 제대로 인식한다.
// (SPA에서는 없는 주소도 200 OK로 응답하는 문제가 있었다)
//
// 화면 모양은 StatusView가 맡고, 이 파일은 404에 맞는 문구와 버튼만 정한다.
// 나중에 Step 4에서 없는 상품 id(/products/999)용 not-found.tsx를 따로 만들 때도 StatusView를 재사용한다.
//
// metadata: 레이아웃의 title.template('%s | Shoppr')에 들어가서 '페이지를 찾을 수 없습니다 | Shoppr'가 된다.
// 404 응답에는 Next.js가 <meta name="robots" content="noindex">를 자동으로 넣어 준다.
// → 없는 페이지가 검색 결과에 나오지 않도록 따로 설정할 필요가 없다.
export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
}

function NotFoundPage() {
  return (
    <StatusView code="404" title="페이지를 찾을 수 없습니다" description="주소가 잘못되었거나 삭제된 페이지입니다.">
      {/* 이전 페이지로 = 방문 기록에서 뒤로 가는 '동작' → Button을 쓰는 BackButton (보조 행동이라 secondary)
          서버 컴포넌트 안에 클라이언트 컴포넌트를 넣는 것은 괜찮다. (반대 방향은 안 됨) */}
      <BackButton />
      {/* 홈으로 = 정해진 주소로 '이동' → <a>를 그리는 ButtonLink (주요 행동이라 primary) */}
      <ButtonLink href="/">홈으로 가기</ButtonLink>
    </StatusView>
  )
}

export default NotFoundPage
