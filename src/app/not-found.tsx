import Link from 'next/link'

// 404 페이지 — 어떤 페이지에도 맞지 않는 주소 (Step 3-1)
//
// react-router 시절에는 <Route path="*">로 직접 연결했다.
// Next.js에서는 app/not-found.tsx라는 '약속된 파일 이름'만 만들면 자동으로 쓰인다.
// 서버가 HTTP 상태 코드도 404로 보내 주므로, 검색엔진이 '없는 페이지'로 제대로 인식한다.
// (SPA에서는 없는 주소도 200 OK로 응답하는 문제가 있었다)
//
// 나중에 Step 4에서 없는 상품 id(/products/999)일 때 notFound()를 호출하면 이 화면이 나온다.
function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      {/* 페이지의 주제를 알려 주는 제목이므로 h1을 쓴다 */}
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        홈으로 가기
      </Link>
    </div>
  )
}

export default NotFoundPage
