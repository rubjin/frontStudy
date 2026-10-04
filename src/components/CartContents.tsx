'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import { useCart } from './CartProvider'
import { Button, ButtonLink } from './ui/Button'
import { Close, Minus, Plus } from './icons'
import CartSkeleton from './CartSkeleton'
import { products } from '@/data/products'
import { formatPrice } from '@/lib/format'
import { getCartLines, getCartTotal } from '@/lib/cart'
import type { Product } from '@/types/product'
import styles from './CartContents.module.scss'

// 장바구니 화면 내용 — 담은 상품 목록 + 주문 요약 (Step 5-1 최소 버전 → 5-2에서 완성)
//
// 장바구니 state에는 상품 id와 수량만 있다(types/cart.ts). 이름·가격·사진은 상품 데이터에서 찾아서 보여 준다.
// → 가격이 바뀌어도 장바구니에는 항상 지금 가격이 나온다.
// (지금은 목 데이터 파일을 넘긴다. Step 6에서 API로 바뀌면 getCartLines에 넘기는 목록만 바꾼다)
//
// 5-2에서 추가한 것
// - 상품 사진, 단가, 소계(단가 × 수량), 주문 요약(상품 수, 총 금액)
// - 수량 −/+ 버튼: 1개 미만·재고 초과는 reducer가 막고(lib/cart.ts), 버튼은 '더 못 누르는 이유'를 보여 준다
// - 삭제 버튼
//
// 접근성 (5-2)
// 1) 바뀐 결과 알리기 — role="status"
//    + 를 누르면 눈으로는 숫자·금액이 바뀌는 게 보이지만, 스크린리더는 버튼에 머물러 있어 아무것도 읽지 않는다.
//    → 'OO 수량 3개' 같은 문구를 알림 영역에 넣는다. (AddToCartButton과 같은 방식. 영역은 항상 DOM에 둔다)
// 2) 끝에 닿은 버튼 — disabled 대신 aria-disabled
//    재고만큼 +를 누르면 + 버튼이 비활성화된다. disabled를 쓰면 '지금 포커스가 있는 버튼'이 비활성화되면서
//    포커스가 페이지 맨 처음(body)으로 튕겨 나간다. 키보드 사용자는 처음부터 다시 Tab을 눌러 와야 한다.
//    aria-disabled="true"는 모양·읽기는 '비활성'이지만 포커스는 그대로 남는다. 대신 클릭 처리는 직접 막는다.
// 3) 삭제 후 포커스 옮기기
//    삭제 버튼을 누르면 그 버튼이 줄과 함께 사라진다 → 포커스가 body로 튕긴다(2와 같은 문제).
//    → 삭제 뒤에는 목록 제목('담은 상품')으로, 마지막 상품을 지웠으면 '비어 있음' 문구로 포커스를 옮긴다.
//      제목·문구는 원래 포커스를 받지 않는 요소라 tabIndex={-1}을 준다. (-1: Tab 순서에는 안 들어가고 코드로만 포커스 가능)
//
// 5-3: 저장된 장바구니를 불러오기 전(hydrated = false)에는 스켈레톤(CartSkeleton)
//   서버 HTML과 브라우저 첫 화면에서는 장바구니가 비었는지 '아직 모른다'. 이때 '비어 있음'을 보여 주면
//   상품이 담겨 있어도 새로고침할 때마다 '비어 있음'이 번쩍인다. → '모름' 상태를 따로 그린다.

// 썸네일 칸의 실제 표시 크기 (CartContents.module.scss .thumb와 맞춘다) — next/image가 알맞은 크기의 파일을 고르는 데 쓴다
const THUMB_SIZES = '96px'

function CartContents() {
  const { items, setQuantity, removeItem, hydrated } = useCart()
  // 알림 문구 (role="status"). 처음엔 비어 있다
  const [message, setMessage] = useState('')

  // 삭제 뒤 포커스를 옮길 대상: 목록 제목 또는 '비어 있음' 문구 (둘 중 화면에 있는 쪽)
  // useRef: 다시 그려도 유지되는 상자. .current에 실제 DOM 요소가 들어온다
  const headingRef = useRef<HTMLHeadingElement>(null)
  const emptyRef = useRef<HTMLParagraphElement>(null)
  // '방금 삭제했다' 표시. 화면을 다시 그릴 필요는 없는 값이라 state가 아니라 ref에 둔다
  // (state에 두면 이 값을 바꿀 때마다 다시 그려진다)
  const focusAfterRemoveRef = useRef(false)

  // useId: 서버·브라우저에서 같은 고유 id를 만든다. 제목과 영역을 aria-labelledby로 잇는 데 쓴다
  // (id를 직접 'cart-items'처럼 적으면 같은 컴포넌트가 두 번 나올 때(Storybook Docs 등) 겹친다)
  const itemsHeadingId = useId()
  const summaryHeadingId = useId()

  // 화면에 쓸 줄 목록과 합계 — state(items)에서 그때그때 계산한다 (Step 2의 '파생 상태': 따로 state로 두지 않는다)
  const lines = getCartLines({ items }, products)
  const total = getCartTotal(lines)
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)

  // 삭제 후 포커스 옮기기
  // removeItem을 부른 직후에는 아직 화면이 바뀌기 전이다. 다시 그려진 '뒤'에 실행되는 useEffect에서 옮긴다.
  useEffect(() => {
    if (!focusAfterRemoveRef.current) return
    focusAfterRemoveRef.current = false
    // ?? : 앞의 값이 null이면 뒤의 값. 목록 제목이 없으면(빈 장바구니) 빈 문구로
    ;(headingRef.current ?? emptyRef.current)?.focus()
  }, [items])

  function changeQuantity(product: Product, next: number) {
    // aria-disabled 버튼은 클릭이 막히지 않으므로 여기서 거른다 (reducer도 막지만, 알림 문구가 바뀌지 않게)
    if (next < 1 || next > product.stock) return
    setQuantity(product, next)
    setMessage(`${product.name} 수량 ${next}개`)
  }

  function remove(product: Product) {
    focusAfterRemoveRef.current = true
    removeItem(product.id)
    setMessage(`${product.name}, 장바구니에서 삭제했습니다.`)
  }

  return (
    <>
      {/* 알림 영역: 화면에는 안 보이고 스크린리더만 읽는다. 빈 장바구니가 되어도 사라지지 않게 맨 바깥에 둔다 */}
      <p role="status" className="sr-only">
        {message}
      </p>

      {!hydrated ? (
        <CartSkeleton />
      ) : lines.length === 0 ? (
        // 빈 장바구니: 다음에 할 일(상품 보러 가기)을 함께 안내한다
        <div className={styles.empty}>
          <p ref={emptyRef} tabIndex={-1} className={styles.focusTarget}>
            장바구니가 비어 있습니다.
          </p>
          <ButtonLink href="/">상품 보러 가기</ButtonLink>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* section + aria-labelledby: 제목이 있는 영역 → 스크린리더의 '영역 목록'에 '담은 상품'으로 나온다 */}
          <section aria-labelledby={itemsHeadingId}>
            <h2 id={itemsHeadingId} ref={headingRef} tabIndex={-1} className={clsx(styles.heading, styles.focusTarget)}>
              담은 상품 <span className={styles.headingCount}>{lines.length}</span>
            </h2>

            <ul className={styles.list}>
              {lines.map(({ product, quantity, subtotal }) => {
                const atMin = quantity <= 1
                const atMax = quantity >= product.stock

                return (
                  <li key={product.id} className={styles.item}>
                    <div className={styles.thumb}>
                      {product.image ? (
                        // alt="": 바로 옆에 상품명 링크가 있어서 장식 이미지로 본다 (Card와 같은 이유)
                        <Image src={product.image.src} alt="" fill sizes={THUMB_SIZES} className={styles.image} />
                      ) : (
                        <span aria-hidden="true">{product.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className={styles.info}>
                      <Link href={`/products/${product.id}`} className={styles.name}>
                        {product.name}
                      </Link>
                      <p className={styles.price}>{formatPrice(product.price)}</p>
                    </div>

                    <div className={styles.quantityArea}>
                      {/* role="group" + aria-label: −, 숫자, + 를 '스마트워치 수량'이라는 한 묶음으로 읽게 한다 */}
                      <div role="group" aria-label={`${product.name} 수량`} className={styles.stepper}>
                        <Button
                          variant="secondary"
                          size="icon"
                          // 아이콘만 있는 버튼이라 이름을 붙인다. 상품마다 같은 버튼이 있으므로 상품명을 넣어 구별한다
                          aria-label={`${product.name} 수량 줄이기`}
                          aria-disabled={atMin}
                          onClick={() => changeQuantity(product, quantity - 1)}
                        >
                          <Minus />
                        </Button>
                        <span className={styles.quantity}>
                          {quantity}
                          <span className="sr-only">개</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="icon"
                          aria-label={`${product.name} 수량 늘리기`}
                          aria-disabled={atMax}
                          onClick={() => changeQuantity(product, quantity + 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                      {/* + 가 왜 안 눌리는지 글로 알려 준다 (흐린 버튼만으로는 이유를 알 수 없다) */}
                      {atMax && <p className={styles.hint}>재고 {product.stock}개까지</p>}
                    </div>

                    <p className={styles.subtotal}>
                      <span className="sr-only">소계 </span>
                      {formatPrice(subtotal)}
                    </p>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${product.name} 삭제`}
                      className={styles.remove}
                      onClick={() => remove(product)}
                    >
                      <Close />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* 주문 요약 — 큰 화면에서는 오른쪽에 붙어 따라온다(sticky) */}
          <section aria-labelledby={summaryHeadingId} className={styles.summary}>
            <h2 id={summaryHeadingId} className={styles.summaryTitle}>
              주문 요약
            </h2>
            {/* dl(설명 목록): '이름 – 값' 짝을 표시하는 태그. 표 없이 '항목: 값' 목록을 만들 때 쓴다 */}
            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>상품 수</dt>
                <dd>{totalQuantity}개</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>총 금액</dt>
                <dd className={styles.total}>{formatPrice(total)}</dd>
              </div>
            </dl>
            {/* 주문하기는 Step 9(주문 기능)에서. 지금은 쇼핑을 이어가는 링크만 */}
            <ButtonLink href="/" variant="secondary" className={styles.continue}>
              쇼핑 계속하기
            </ButtonLink>
          </section>
        </div>
      )}
    </>
  )
}

export default CartContents
