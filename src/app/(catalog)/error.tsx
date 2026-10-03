'use client'

import StatusView from '@/components/StatusView'
import { Button } from '@/components/ui/Button'
import { formatTitle } from '@/lib/site'
import { useReportError } from '@/lib/useReportError'

// 상품 목록(홈 "/")의 에러 화면 (Step 4-3b)
//
// app/error.tsx가 이미 있는데 왜 또 만드나? — 구간별 에러 화면
// - error.tsx는 '가장 가까운' 것이 쓰인다. (loading.tsx와 같은 규칙)
//   홈에서 에러가 나면 이 파일이, 상세에서 나면 products/[id]/error.tsx가, 나머지는 app/error.tsx가 받는다.
// - 공통 에러 화면의 '홈으로 가기'는 홈에서 에러가 났을 때 같은 (고장 난) 페이지로 보낼 뿐이다.
//   어디서 에러가 났는지 알면 그 자리에 맞는 문구와 해결 방법을 줄 수 있다.
//
// 이 화면의 버튼
// - 다시 시도: 서버에 이 구간을 다시 요청해서 그린다 (일시적인 네트워크·서버 문제라면 복구된다)
// - 검색 조건 초기화: 주소의 쿼리(?q=...&category=...)를 지우고 다시 그린다.
//   4-2부터 필터가 주소에 들어가므로, 특정 검색 조건이 에러를 일으킨 경우 여기서 빠져나올 수 있다.
//
// 왜 '검색 조건 초기화'가 ButtonLink(href="/")가 아니라 Button인가? (확인하다 발견한 문제)
// - 처음엔 "/"로 가는 링크로 만들었다. 그런데 눌러도 주소만 바뀌고 에러 화면이 그대로 남았다.
// - Next.js의 에러 경계는 '경로(pathname)가 바뀔 때'만 에러 상태를 지운다.
//   /?q=... → / 는 경로가 똑같이 "/"라서 '같은 페이지'로 보고 에러 화면을 유지한다.
// - 그래서 직접 두 가지를 한다: ① 주소의 쿼리를 지우고(ProductCatalog와 같은 pushState 방식) ② retry()로 다시 그리기.
//   다른 페이지로 '이동'이 아니라 이 화면 안의 '동작'이므로 Button이 맞다. (CLAUDE.md 원칙)
//
// 감싸는 범위 (구조)
//   layout.tsx (헤더)              ← 에러가 나도 그대로. 다크 모드·로고 링크 계속 동작
//   └ (catalog)/error.tsx          ← 여기서 에러를 잡아 이 화면으로 바꿔 끼운다
//     └ (catalog)/loading.tsx
//       └ (catalog)/page.tsx       ← 이 안(ProductCatalog 포함)에서 난 에러
//
// props, 'use client'가 필요한 이유, <title>을 직접 쓰는 이유는 app/error.tsx 주석과 같다.
const TITLE = '상품 목록을 불러오지 못했습니다'

// 쿼리를 지운 주소 = 처음 화면
const CATALOG_HOME = '/'

interface CatalogErrorProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function CatalogError({ error, retry }: CatalogErrorProps) {
  useReportError(error)

  function resetFilters() {
    // ① 주소만 "/"로 (서버 요청 없음). 뒤로 가기를 누르면 에러가 났던 검색 조건으로 돌아간다
    window.history.pushState(null, '', CATALOG_HOME)
    // ② 에러 상태를 지우고, 바뀐 주소 기준으로 이 구간을 다시 받아 그린다
    retry()
  }

  return (
    <>
      <title>{formatTitle(TITLE)}</title>
      <StatusView
        code="500"
        title={TITLE}
        description="잠시 후 다시 시도해 주세요. 계속 안 되면 검색 조건을 초기화해 보세요."
      >
        <Button onClick={() => retry()}>다시 시도</Button>
        <Button variant="secondary" onClick={resetFilters}>
          검색 조건 초기화
        </Button>
      </StatusView>
    </>
  )
}
