'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, ButtonLink } from './Button'
import { Close } from '../icons'
import styles from './Toast.module.scss'

// 토스트 알림 — 화면 아래에 잠깐 떴다 사라지는 안내 (Step 5-4)
//
// 왜 필요한가?
// - 목록 카드에서 '담기'를 누르면 눈에 보이는 변화는 헤더 숫자뿐이라 '담겼나?' 싶다. 결과를 눈에 띄게 알려 준다.
// - 담기 버튼이 상세·목록 카드 두 곳에 있고, 장바구니를 불러올 때(재고 조정 안내)도 알릴 일이 있다.
//   알림 영역을 버튼마다 만들지 않고 화면에 '하나'만 두고, 어디서든 useToast()로 띄운다. (장바구니와 같은 Context 패턴)
// - 장바구니와 상관없는 기본 부품이라 components/ui/에 둔다. (주문 완료·로그인 등 다른 기능에서도 쓴다)
//
// 쓰는 법
//   const { showToast } = useToast()
//   showToast({ message: '장바구니에 담았습니다.', action: { href: '/cart', label: '장바구니 보기' } })
//
// 접근성
// - 알림 영역(role="status")은 '항상' DOM에 있고, 토스트 내용만 그 안에 넣었다 뺀다.
//   영역을 토스트와 함께 새로 만들면 '바뀜'을 감지하지 못하는 스크린리더가 많다. (AddToCartButton 5-1과 같은 이유)
// - 저절로 사라지는 시간(TOAST_DURATION)은 마우스를 올리거나 키보드 포커스가 안에 있는 동안 멈춘다.
//   링크를 누르려는데 사라지면 안 되고, 읽는 속도는 사람마다 다르다. (WCAG 2.2.1 시간 조절)
// - 닫기 버튼을 둔다. 포커스를 토스트로 강제로 옮기지는 않는다(하던 일을 방해하지 않게).
// - 닫기 버튼으로 닫으면 버튼이 토스트와 함께 사라져 포커스가 body로 튕긴다(5-2와 같은 문제).
//   → 토스트에 들어오기 직전에 포커스가 있던 요소(예: 담기 버튼)로 되돌린다.

/** 저절로 사라지기까지의 시간 (ms) */
const TOAST_DURATION = 5000

export interface ToastOptions {
  /** 알림 문구 */
  message: string
  /** 함께 보여 줄 링크 (예: 장바구니 보기) */
  action?: { href: string; label: string }
}

// 지금 떠 있는 토스트. id는 같은 문구를 다시 띄울 때도 '새 알림'으로 구분하기 위한 번호
interface ToastItem extends ToastOptions {
  id: number
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// props
// - children: 토스트를 띄울 수 있는 영역(layout에서는 사이트 전체)
export function ToastProvider({ children }: { children: ReactNode }) {
  // 한 번에 하나만 보여 준다. 새 알림이 오면 이전 것을 바꿔 끼운다 (여러 개 쌓이면 화면을 가린다)
  const [toast, setToast] = useState<ToastItem | null>(null)
  // 마우스가 위에 있거나 포커스가 안에 있으면 true → 사라지는 시간을 멈춘다
  const [paused, setPaused] = useState(false)
  // 다음 토스트 번호. 화면에 보일 값이 아니라 ref
  const nextId = useRef(1)
  // 토스트로 들어오기 직전에 포커스가 있던 요소 (닫을 때 되돌릴 곳)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // useCallback: 함수를 다시 그릴 때마다 새로 만들지 않고 같은 함수를 유지한다.
  // showToast는 Context로 나눠 주므로, 매번 새 함수면 useToast()를 쓰는 모든 컴포넌트가 다시 그려진다. (useMemo와 같은 이유)
  const showToast = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: nextId.current++ })
  }, [])

  const close = useCallback(() => {
    setToast(null)
    setPaused(false)
  }, [])

  // 닫기 버튼: 닫고 포커스를 되돌린다. (isConnected: 그 요소가 아직 화면(DOM)에 있는지)
  function closeAndReturnFocus() {
    close()
    const target = returnFocusRef.current
    returnFocusRef.current = null
    if (target?.isConnected) target.focus()
  }

  // 시간이 지나면 닫기. 새 토스트(id 변경)가 오거나 멈춤이 풀리면 처음부터 다시 잰다
  useEffect(() => {
    if (!toast || paused) return
    const timer = window.setTimeout(close, TOAST_DURATION)
    // 정리 함수: 다음 실행 전에 이전 타이머를 지운다 (안 지우면 새 토스트가 이전 타이머 때문에 일찍 닫힌다)
    return () => window.clearTimeout(timer)
  }, [toast, paused, close])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext value={value}>
      {children}
      {/* 알림 영역: 비어 있어도 항상 둔다. 화면 아래 가운데에 고정 */}
      <div role="status" className={styles.viewport}>
        {toast && (
          <div
            // key: 같은 자리에 새 토스트가 오면 새 요소로 만들어 등장 애니메이션을 다시 재생한다
            key={toast.id}
            className={styles.toast}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            // onFocus/onBlur는 React에서 안쪽 요소의 포커스도 받는다(버블링) → '포커스가 안에 있는 동안'
            onFocus={(event) => {
              setPaused(true)
              // relatedTarget: 포커스가 '어디서' 왔는지. 토스트 바깥에서 들어온 경우에만 기억한다
              const from = event.relatedTarget
              if (from instanceof HTMLElement && !event.currentTarget.contains(from)) returnFocusRef.current = from
            }}
            onBlur={(event) => {
              // 토스트 안의 다른 버튼으로 옮겨 가는 중이면 멈춘 상태 유지
              if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
            }}
          >
            <p className={styles.message}>{toast.message}</p>
            {toast.action && (
              <ButtonLink href={toast.action.href} variant="ghost" className={styles.action} onClick={close}>
                {toast.action.label}
              </ButtonLink>
            )}
            <Button variant="ghost" size="icon" aria-label="알림 닫기" onClick={closeAndReturnFocus}>
              <Close />
            </Button>
          </div>
        )}
      </div>
    </ToastContext>
  )
}

// 토스트 띄우기 — const { showToast } = useToast()
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast는 <ToastProvider> 안에서만 쓸 수 있습니다. (app/layout.tsx 확인)')
  }
  return context
}
