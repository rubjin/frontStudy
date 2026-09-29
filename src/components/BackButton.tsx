'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/Button'

// '이전 페이지로' 버튼 (Step 3-1)
//
// 왜 링크(ButtonLink)가 아니라 버튼(Button)인가?
// - 링크는 '정해진 주소(href)'로 간다. 그런데 '이전 페이지'는 사용자마다 다르고, 주소를 미리 알 수 없다.
// - 브라우저의 방문 기록(history)에서 한 칸 뒤로 가는 '동작'이므로 <button> + router.back()이 맞다.
//   (브라우저의 뒤로 가기 버튼을 누르는 것과 같다)
//
// 왜 따로 파일을 만들었나?
// - onClick과 useRouter는 브라우저에서만 동작하므로 'use client'가 필요하다.
// - not-found.tsx는 서버 컴포넌트로 두고(metadata도 내보내야 함), 클릭이 필요한 이 버튼만 클라이언트로 뺐다.
//   → Step 3-1에서 정한 원칙: 'use client'는 필요한 곳에만 작게.
//
// props
// - fallbackHref: 돌아갈 기록이 없을 때 대신 갈 주소 (기본값 '/')
// - variant:      버튼 모양 (Button의 variant 그대로)
// - children:     버튼 글자 (기본값 '이전 페이지로')
interface BackButtonProps {
  fallbackHref?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children?: ReactNode
}

function BackButton({ fallbackHref = '/', variant = 'secondary', children = '이전 페이지로' }: BackButtonProps) {
  // useRouter: 코드로 페이지를 이동시키는 도구 (next/navigation — App Router용. next/router가 아님에 주의)
  const router = useRouter()

  function handleClick() {
    // 돌아갈 기록이 없는 경우: 주소창에 직접 입력했거나, 새 탭에서 이 페이지를 처음 열었을 때
    // → back()을 하면 아무 일도 안 일어나거나 다른 사이트로 나가 버리므로 fallbackHref로 보낸다.
    // history.length: 이 탭의 방문 기록 개수. 첫 페이지면 1이다.
    // ※ 다른 사이트에서 링크를 타고 들어온 경우까지 완벽히 구분하지는 못한다. (그때는 그 사이트로 돌아간다)
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant={variant} onClick={handleClick}>
      {/* 화살표는 장식이라 스크린리더가 읽지 않게 한다 */}
      <span aria-hidden="true">←</span>
      {children}
    </Button>
  )
}

export default BackButton
