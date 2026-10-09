import type { ReactNode } from 'react'
import styles from './layout.module.scss'

// 회원가입·로그인 공통 틀 — 라우트 그룹 (auth) (Step 9-1)
//
// 괄호 폴더 (auth)는 주소에 나타나지 않는다 → /login, /signup (4-3a의 (catalog)와 같은 방식)
// 두 페이지가 같은 모양(가운데 좁은 칸)을 쓰므로 이 레이아웃 하나로 감싼다.
// 루트 layout.tsx(헤더) 안쪽에 들어가므로 헤더는 그대로 보인다.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>
}
