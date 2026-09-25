import { useState } from 'react'
import { Route, Routes } from 'react-router'
import Header from './components/Header'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import NotFoundPage from './pages/NotFoundPage'

// 앱의 최상위 컴포넌트 = 모든 페이지가 함께 쓰는 '레이아웃'
//
// Step 3-1에서 역할이 바뀌었다.
// - 이전: 검색·필터·정렬 상태와 목록 화면을 모두 여기서 관리
// - 이후: 모든 페이지에 공통인 것(다크 모드, 헤더)만 여기에 두고,
//         주소(URL)에 따라 어떤 페이지를 보여 줄지만 정한다.
//         목록 관련 상태는 ProductListPage로 옮겼다.
//
// SPA(Single Page Application)란?
// 실제 HTML 파일은 index.html 하나뿐이고, 주소가 바뀌면 React가 화면만 바꿔 끼운다.
// 페이지를 새로 받아오지 않으니 빠르고, 다크 모드 같은 상태도 페이지를 옮겨도 유지된다.
function App() {
  const [dark, setDark] = useState(false)

  return (
    // 다크 모드: 최상위에 'dark' 클래스를 붙이면 Tailwind의 dark: 스타일이 적용된다
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        {/* 헤더는 Routes 밖에 있어서 어느 페이지에서나 보인다.
            setDark((d) => !d): 이전 값을 받아 뒤집는 함수형 업데이트 */}
        <Header dark={dark} onToggle={() => setDark((d) => !d)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Routes: 현재 주소와 맞는 Route 하나만 골라서 보여 준다
              - path="/"              → 상품 목록
              - path="/products/:id"  → 상품 상세. ':id'는 '이 자리에 오는 값을 id라고 부른다'는 뜻
                                         예) /products/3 → id = '3'
              - path="*"              → 위에 맞는 게 없을 때(없는 주소) 404 페이지 */}
          <Routes>
            <Route path="/" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
