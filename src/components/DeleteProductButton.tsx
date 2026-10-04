'use client'

import { useTransition } from 'react'
import { Button } from './ui/Button'

// 상품 삭제 버튼 — 확인 후 Server Action 실행 (Step 8-3, 관리 목록)
//
// props
// - productName: 확인 문구와 버튼 이름에 쓴다
// - action:      삭제 Server Action (deleteProductAction.bind(null, id))
//
// 지우면 되돌릴 수 없으므로 한 번 더 묻는다. window.confirm은 브라우저 기본 대화상자라
// 키보드(Enter/Esc)·스크린리더가 기본으로 지원된다. (모양을 바꾸고 싶으면 <dialog>로 직접 만든다)
//
// useTransition: 서버 작업을 기다리는 동안 isPending=true → '삭제 중…'
// (폼이 아니라 버튼 클릭으로 액션을 부르므로 useActionState 대신 startTransition으로 감싼다)

interface DeleteProductButtonProps {
  productName: string
  action: () => Promise<void>
}

export function DeleteProductButton({ productName, action }: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (isPending) return
    if (!window.confirm(`"${productName}" 상품을 삭제할까요? 되돌릴 수 없습니다.`)) return
    startTransition(() => action())
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      aria-disabled={isPending}
      // 목록에 '삭제' 버튼이 여러 개라 상품명을 넣어 구별한다 (화면 글자 '삭제'를 포함 — Label in Name)
      aria-label={`${productName} 삭제`}
    >
      {isPending ? '삭제 중…' : '삭제'}
    </Button>
  )
}
