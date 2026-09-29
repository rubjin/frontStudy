'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Moon, Sun } from './icons'

// 상단 헤더 — 모든 페이지에 공통으로 보인다
//
// Step 3-1: 로고를 홈("/")으로 가는 Link로 바꿨다.
// 쇼핑몰에서 로고를 누르면 홈으로 가는 것은 사용자가 기대하는 기본 동작이다.
//
// Step 3-1 (Next.js 전환): 다크 모드 상태를 App.jsx에서 이 컴포넌트로 옮겼다.
// - Next.js의 layout.tsx는 기본이 '서버 컴포넌트'라 useState를 쓸 수 없다.
// - 그래서 상태가 필요한 부분(다크 모드 버튼)만 'use client' 컴포넌트로 만든다.
//   → 클라이언트 컴포넌트를 '필요한 곳에만 작게' 두는 것이 Next.js의 기본 설계 방식이다.
// - 'dark' 클래스는 예전처럼 감싸는 div가 아니라 <html> 태그에 직접 붙인다.
//
// 'use client'란?
// 파일 맨 위에 적으면 "이 컴포넌트는 브라우저에서도 실행된다"는 표시가 된다.
// useState, useEffect, onClick 같은 상호작용은 브라우저에서만 동작하므로 이 표시가 필요하다.
//
// ⚠️ 알려진 한계 (Step 3-2에서 개선)
// 새로고침하면 다크 모드가 풀린다. 3-2에서 CSS 변수 테마로 바꾸면서 localStorage 저장까지 다룬다.
function Header() {
  const [dark, setDark] = useState(false)

  // useEffect: 렌더링이 끝난 뒤 'React 바깥'의 것(여기서는 <html> 태그)을 바꿀 때 쓴다.
  // [dark]: dark 값이 바뀔 때마다 다시 실행한다.
  // classList.toggle('dark', dark): dark가 true면 클래스를 붙이고, false면 뗀다.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            {/* 'S' 로고는 옆의 'Shoppr' 글자와 중복이라 스크린리더가 읽지 않게 한다 */}
            <div aria-hidden="true" className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">Shoppr</span>
          </Link>
          <button
            type="button"
            // setDark((d) => !d): 이전 값을 받아 뒤집는 함수형 업데이트
            onClick={() => setDark((d) => !d)}
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
