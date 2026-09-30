'use client'

import type { ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/Button'

// '이전 페이지로' 버튼 (Step 3-1)
//
// 왜 링크(ButtonLink)가 아니라 버튼(Button)인가?
// - 링크는 '정해진 주소(href)'로 간다. 그런데 '이전 페이지'는 사용자마다 다르고, 주소를 미리 알 수 없다.
// - 브라우저의 방문 기록(history)에서 한 칸 뒤로 가는 '동작'이므로 <button> + router.back()이 맞다.
//   (브라우저의 뒤로 가기 버튼을 누르는 것과 같다)
//
// Button을 쓰면 되는데 왜 따로 만들었나?
// - 새 버튼을 만든 게 아니라 Button을 '감싸서 동작만 더한' 컴포넌트다. 모양은 여전히 Button이 맡는다.
//     ui/Button   = 모양만 (무슨 동작을 할지 모름)
//     BackButton  = Button + 정해진 동작(뒤로 가기, 기록 없으면 홈으로)
// - not-found.tsx(서버 컴포넌트)에서 <Button onClick={() => router.back()}>로 직접 쓸 수는 없다.
//   · useRouter 같은 훅은 서버 컴포넌트에서 못 쓴다.
//   · 서버 컴포넌트는 클라이언트 컴포넌트에 '함수'(onClick)를 props로 넘길 수 없다.
//     서버의 props는 HTML과 함께 텍스트(JSON)로 전송되는데, 함수는 텍스트로 바꿀 수 없기 때문이다.
//   · not-found.tsx 전체를 'use client'로 만들면 metadata를 못 내보낸다.
//   → 클릭이 필요한 이 버튼만 'use client'로 뺐다. (원칙: 'use client'는 필요한 곳에만 작게)
// - '기록이 없으면 홈으로' 같은 판단이 한 곳에 모여 있어서, 상세 페이지 등 다른 곳에서도 그대로 재사용한다.
//
// props
// - fallbackHref: 돌아갈 기록이 없을 때 대신 갈 주소 (기본값 '/')
// - children:     버튼 글자 (기본값 '이전 페이지로')
// - 그 밖에 variant, size, className, disabled 등 Button이 받는 props를 모두 받는다.
//
// Omit<ComponentProps<typeof Button>, 'onClick'>
// - ComponentProps<typeof Button>: Button이 받는 props 타입을 그대로 가져온다.
//   → Button에 variant가 추가되면 BackButton도 자동으로 받을 수 있다. (타입을 복사하지 않는다)
// - Omit<..., 'onClick'>: 그중 onClick만 뺀다. 클릭 동작은 BackButton이 정하므로 밖에서 바꾸지 못하게 한다.
type BackButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  fallbackHref?: string
}

// ...rest: fallbackHref, variant, children을 뺀 나머지 props(size, className...)를 Button에 그대로 넘긴다
function BackButton({
  fallbackHref = '/',
  variant = 'secondary',
  children = '이전 페이지로',
  ...rest
}: BackButtonProps) {
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
    <Button {...rest} variant={variant} onClick={handleClick}>
      {/* 화살표는 장식이라 스크린리더가 읽지 않게 한다 */}
      <span aria-hidden="true">←</span>
      {children}
    </Button>
  )
}

export default BackButton
