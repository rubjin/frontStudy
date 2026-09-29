import type { ReactNode } from 'react'
import styles from './StatusView.module.scss'

// 상태 안내 화면 공통 컴포넌트 (Step 3-1)
//
// 404(없는 페이지), 500(서버·실행 에러), 없는 상품 같은 화면은
// '큰 코드 · 제목 · 설명 · 버튼'이라는 모양은 같고 문구와 버튼만 다르다.
// 파일마다 마크업을 복사해 두면 디자인을 바꿀 때 모든 파일을 고쳐야 하므로,
// 모양은 여기 한 곳에 두고 각 에러 파일(not-found.tsx, error.tsx ...)은 내용만 넘긴다.
// → 퍼블리셔 관점: 공통 '템플릿 마크업'을 하나 만들고 페이지마다 텍스트만 바꿔 끼우는 것과 같다.
//
// 이 컴포넌트는 useState나 onClick을 직접 쓰지 않으므로 'use client'가 없다.
// 그래서 서버 컴포넌트(not-found.tsx)와 클라이언트 컴포넌트(error.tsx) 양쪽에서 다 쓸 수 있다.
// (버튼의 onClick은 error.tsx가 만들어서 children으로 넘긴다)
//
// props
// - code:        화면 위에 크게 보여 줄 상태 코드 (예: '404'). 선택
// - title:       제목. 페이지의 주제이므로 h1으로 그린다
// - description: 설명 문구. 선택
// - children:    버튼·링크 자리. 에러 종류마다 필요한 행동(홈으로, 다시 시도...)이 달라서 밖에서 받는다
//                보통 ui/Button의 Button(동작)·ButtonLink(이동)를 넣는다.
interface StatusViewProps {
  code?: string
  title: string
  description?: string
  children?: ReactNode
}

function StatusView({ code, title, description, children }: StatusViewProps) {
  return (
    <div className={styles.root}>
      {/* 상태 코드는 장식용 큰 글씨. 제목이 뜻을 전달하므로 스크린리더에는 숨긴다 */}
      {code && (
        <p aria-hidden="true" className={styles.code}>
          {code}
        </p>
      )}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {/* 버튼이 여러 개일 수 있으므로 가로로 나열하고, 좁은 화면에서는 줄바꿈(flex-wrap) */}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}

export default StatusView
