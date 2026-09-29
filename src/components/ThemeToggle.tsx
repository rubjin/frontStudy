'use client'

import { Moon, Sun } from './icons'
import { Button } from './ui/Button'
import { applyTheme, getCurrentTheme } from '@/lib/theme'
import styles from './ThemeToggle.module.scss'

// 다크 모드 전환 버튼 (Step 3-2 — Header에서 분리)
//
// Step 3-1에서는 Header가 useState로 다크 모드를 들고 있었다. 3-2에서 바뀐 점:
// 1) 테마 값은 React state가 아니라 <html data-theme> 속성에 있다.
//    → 버튼은 속성을 읽고 뒤집기만 한다. useState, useEffect가 필요 없다.
// 2) 해/달 아이콘 전환은 CSS가 한다 (ThemeToggle.module.scss).
//    → React가 '지금 테마'를 몰라도 되므로, 서버 HTML과 브라우저 결과가 달라지는 문제(하이드레이션 불일치)가 없다.
//      만약 state로 아이콘을 골랐다면: 서버는 항상 '라이트'로 그리는데 브라우저는 '다크'라서 아이콘이 어긋난다.
// 3) 클릭이 필요한 이 버튼만 'use client'. Header는 다시 서버 컴포넌트가 되었다.
//
// 접근성: 버튼 이름도 CSS로 바꾼다
// - 라이트일 때는 '다크 모드로 전환', 다크일 때는 '라이트 모드로 전환'이라고 읽혀야 한다.
// - 두 이름을 모두 넣고 지금 테마에 맞지 않는 쪽을 display: none으로 숨긴다.
//   display: none은 스크린리더도 읽지 않으므로, 보이는 쪽 이름만 버튼 이름이 된다.
function ThemeToggle() {
  function handleClick() {
    applyTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      <span className={styles.showInLight}>
        <Moon />
        <span className="sr-only">다크 모드로 전환</span>
      </span>
      <span className={styles.showInDark}>
        <Sun />
        <span className="sr-only">라이트 모드로 전환</span>
      </span>
    </Button>
  )
}

export default ThemeToggle
