'use client'

import StatusView from '@/components/StatusView'
import { Button } from '@/components/ui/Button'
import { formatTitle } from '@/lib/site'
import './globals.css'

// 최후의 에러 화면 — 루트 레이아웃(layout.tsx) 자체에서 에러가 났을 때 (Step 3-1)
//
// error.tsx와 무엇이 다른가?
// - error.tsx는 layout.tsx '안쪽'(페이지)의 에러만 잡는다. 헤더는 그대로 남는다.
// - layout.tsx(예: Header)에서 에러가 나면 틀 자체가 무너지므로 error.tsx로는 못 잡는다.
// - 그때 이 파일이 layout.tsx를 '통째로 대신'한다. 그래서 <html>, <body>를 직접 그려야 하고,
//   layout.tsx에서 불러오던 globals.css도 여기서 다시 import 해야 스타일이 적용된다.
// - 헤더가 없으므로 '홈으로' 링크 대신 '다시 시도'만 둔다.
//
// 거의 볼 일이 없는 화면이지만, 없으면 사용자는 아무 안내 없는 빈 화면을 보게 된다.
// metadata를 쓸 수 없는 클라이언트 컴포넌트라서 <title> 태그를 직접 넣는다. (React 19부터 가능)
// 탭 제목과 화면 제목에 같은 문구를 쓰므로 상수로 한 번만 적는다
const TITLE = '문제가 발생했습니다'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <title>{formatTitle(TITLE)}</title>
        <main className="mx-auto max-w-7xl px-4">
          <StatusView code="500" title={TITLE} description="페이지를 불러오지 못했습니다. 다시 시도해 주세요.">
            <Button onClick={() => retry()}>다시 시도</Button>
          </StatusView>
        </main>
      </body>
    </html>
  )
}
