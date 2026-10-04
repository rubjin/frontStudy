'use client'

import { useCart } from './CartProvider'
import { Cart } from './icons'
import { ButtonLink } from './ui/Button'
import styles from './CartLink.module.scss'

// 헤더의 장바구니 링크 + 담긴 개수 배지 (Step 5-1)
//
// Header는 서버 컴포넌트로 두고, 장바구니 숫자를 읽어야 하는 이 부분만 'use client' (ThemeToggle과 같은 방식)
//
// 페이지 이동이므로 ButtonLink(<a>) — 화면 안 동작이 아니다. (CLAUDE.md 원칙)
//
// 접근성: 링크 이름
// - 눈에 보이는 건 아이콘과 숫자뿐이라, 스크린리더용 글자를 sr-only로 넣는다.
// - 읽히는 이름: 0개일 때 '장바구니', 담겨 있으면 '장바구니 3개'
// - aria-label="장바구니 3개"로 한 번에 줄 수도 있지만, 화면 글자(숫자)와 읽히는 글자가 같은 곳에서 나오게 하는 편이
//   번역 도구·음성 제어("장바구니 클릭")에 더 안전하다.
//
// 하이드레이션: 서버는 항상 빈 장바구니(0개)로 그린다. 브라우저도 처음엔 0개로 시작해서 결과가 같다.
// (Step 5-3) 저장된 장바구니는 CartProvider가 하이드레이션 '뒤'에 불러온다 → 그때 배지가 나타난다.
// 처음부터 저장된 개수로 그리면 서버 HTML(0개)과 달라 하이드레이션 불일치가 난다. (CartProvider 주석 참고)
function CartLink() {
  const { count } = useCart()

  return (
    <ButtonLink href="/cart" variant="ghost" size="icon" className={styles.link}>
      <Cart />
      <span className="sr-only">장바구니</span>
      {count > 0 && (
        <span className={styles.badge}>
          {/* 99개를 넘으면 배지가 너무 넓어져서 99+로 줄인다 */}
          {count > 99 ? '99+' : count}
          <span className="sr-only">개</span>
        </span>
      )}
    </ButtonLink>
  )
}

export default CartLink
