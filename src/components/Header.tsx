import Link from 'next/link'
import CartLink from './CartLink'
import ThemeToggle from './ThemeToggle'
import { SITE_NAME } from '@/lib/site'
import styles from './Header.module.scss'

// 상단 헤더 — 모든 페이지에 공통으로 보인다
//
// Step 3-1: 로고를 홈("/")으로 가는 Link로 바꿨다.
// 쇼핑몰에서 로고를 누르면 홈으로 가는 것은 사용자가 기대하는 기본 동작이다.
//
// Step 3-2: 다시 '서버 컴포넌트'가 되었다.
// - 3-1에서는 다크 모드 state 때문에 헤더 전체가 'use client'였다.
// - 다크 모드 버튼을 ThemeToggle로 분리하고, 테마 값은 <html data-theme>에 두도록 바꾸면서
//   헤더 자체에는 상호작용이 없어졌다. → 헤더는 서버에서 HTML로만 그리고, 브라우저로 JS를 보내지 않는다.
// - 원칙 그대로: 'use client'는 상호작용이 필요한 가장 작은 부분(ThemeToggle)에만.
//
// Step 5-1: 장바구니 링크(CartLink)를 다크 모드 버튼 옆에 추가. 장바구니 숫자를 읽어야 해서 이것도 작은 'use client'다.
function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          {/* 'S' 로고는 옆의 'Shoppr' 글자와 중복이라 스크린리더가 읽지 않게 한다 */}
          <span aria-hidden="true" className={styles.logoMark}>
            S
          </span>
          <span className={styles.logoText}>{SITE_NAME}</span>
        </Link>
        {/* 오른쪽 버튼 묶음 */}
        <div className={styles.actions}>
          <CartLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
