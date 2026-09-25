import { Link } from 'react-router'
import { Moon, Sun } from './icons'

// 상단 헤더 — 모든 페이지에 공통으로 보인다
//
// Step 3-1: 로고를 홈("/")으로 가는 Link로 바꿨다.
// 쇼핑몰에서 로고를 누르면 홈으로 가는 것은 사용자가 기대하는 기본 동작이다.
//
// props
// - dark:     현재 다크 모드 여부 (아이콘 모양을 정할 때 사용)
// - onToggle: 다크 모드 버튼을 눌렀을 때 호출할 함수

function Header({ dark, onToggle }) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            {/* 'S' 로고는 옆의 'Shoppr' 글자와 중복이라 스크린리더가 읽지 않게 한다 */}
            <div aria-hidden="true" className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">Shoppr</span>
          </Link>
          <button
            onClick={onToggle}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {dark ? <Sun /> : <Moon />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
