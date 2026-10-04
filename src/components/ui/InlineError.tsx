import { Button } from './Button'
import styles from './InlineError.module.scss'

// 화면 '일부'를 불러오지 못했을 때의 안내 + 다시 시도 (Step 7-2, 6-3 장바구니에 있던 것을 공통으로 뺌)
//
// StatusView(404·에러 '페이지' 전체, h1 포함)와 다른 점: 페이지 안의 한 영역(목록, 장바구니 내용)만 대신한다.
// 장바구니와 목록 두 곳에서 쓰게 되어 ui/로 옮겼다. (원칙: 여러 파일에서 쓰이면 공통으로)
//
// props
// - title:       무엇을 못 했는지 ('상품 목록을 불러오지 못했습니다.')
// - description: 사용자가 할 일 ('잠시 후 다시 시도해 주세요.')
// - onRetry:     다시 시도 버튼을 눌렀을 때
// - retrying:    다시 받는 중이면 true → 버튼이 '다시 시도 중…'(aria-disabled). 연타로 요청이 겹치지 않게
//
// 접근성: role="alert" — 나타나는 즉시 스크린리더가 읽는다(status보다 급한 알림)
// retrying 동안 disabled가 아니라 aria-disabled: 누른 버튼이 비활성화되며 포커스가 튕기지 않게 (Step 5-2 원칙)

interface InlineErrorProps {
  title: string
  description: string
  onRetry: () => void
  retrying?: boolean
}

export function InlineError({ title, description, onRetry, retrying = false }: InlineErrorProps) {
  return (
    <div role="alert" className={styles.root}>
      <p className={styles.title}>{title}</p>
      <p>{description}</p>
      <Button className={styles.button} aria-disabled={retrying} onClick={() => !retrying && onRetry()}>
        {retrying ? '다시 시도 중…' : '다시 시도'}
      </Button>
    </div>
  )
}
