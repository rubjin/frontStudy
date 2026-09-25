import { Link } from 'react-router'

// 404 페이지 — 어떤 Route에도 맞지 않는 주소 (Step 3-1)
//
// SPA에서는 서버가 아니라 React가 주소를 해석하므로, 없는 주소 처리도 직접 만들어야 한다.
// 이 페이지가 없으면 없는 주소로 들어왔을 때 헤더만 있는 빈 화면이 보인다.
function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      {/* 페이지의 주제를 알려 주는 제목이므로 h1을 쓴다 */}
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        홈으로 가기
      </Link>
    </div>
  )
}

export default NotFoundPage
