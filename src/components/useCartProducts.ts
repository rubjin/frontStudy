'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchProductsByIds } from '@/lib/api'
import type { Product } from '@/types/product'

// 장바구니에 담긴 상품들의 정보(이름·가격·사진·재고)를 API로 받아 오는 훅 (Step 6-3)
//
// 왜 브라우저에서 받나? (6-2 목록은 서버에서 받았다)
// - 장바구니 내용(어떤 상품 id인지)은 브라우저의 localStorage에만 있다. 서버는 모른다.
//   → '무엇을 요청할지'를 브라우저만 알기 때문에, 브라우저가 직접 요청해야 한다. (Next.js 문서: Storage API에 의존하는 데이터)
//
// 브라우저에서 fetch하면 직접 챙겨야 하는 것들 (서버 컴포넌트는 Suspense·error.tsx가 대신 해 줬다)
// 1) 로딩 상태 — 응답이 오기 전 화면 (스켈레톤)
// 2) 에러 상태 — 실패 문구 + 다시 시도
// 3) 요청 취소 — 응답이 오기 전에 화면을 떠나거나 조건이 바뀌면, 늦게 온 응답이 엉뚱한 화면을 덮어쓰지 않게
// 4) 같은 것을 다시 요청하지 않기 — 수량만 바꿨는데 매번 다시 받으면 낭비
// → Step 7의 TanStack Query가 이 네 가지(+ 캐싱)를 대신 해 주는 도구다. 먼저 직접 만들어 보고 무엇을 덜어 주는지 비교한다.
//
// 인자
// - ids:     필요한 상품 id 목록 (장바구니 항목)
// - enabled: false면 요청하지 않는다 (장바구니를 아직 불러오기 전)
//
// 반환
// - products: 지금까지 받은 상품들
// - status:   'loading'(아직 안 받은 id가 있음) | 'error' | 'success'
// - error:    실패 이유 (ApiError)
// - retry():  다시 시도

type Status = 'loading' | 'error' | 'success'

export function useCartProducts(ids: number[], enabled = true) {
  const [products, setProducts] = useState<Product[]>([])
  // 이미 물어본 id들 (응답에 없어도 포함 — 판매 종료된 상품을 계속 다시 묻지 않게)
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<number>>(new Set())
  // 실패: 어떤 요청(key)이 실패했는지까지 기억한다. 다른 요청(장바구니가 바뀜)에는 이전 실패를 보여 주지 않기 위해
  const [failure, setFailure] = useState<{ key: string; error: ApiError } | null>(null)
  // 다시 시도 버튼을 누를 때마다 1씩 올린다 → useEffect가 다시 실행된다
  const [attempt, setAttempt] = useState(0)

  // 아직 물어보지 않은 id만 요청한다 (4) — 수량 변경·삭제로는 새 요청이 생기지 않는다
  const missing = ids.filter((id) => !checkedIds.has(id))
  // 배열은 매번 새로 만들어져 useEffect 의존성으로 쓰면 매번 실행된다 → 비교 가능한 문자열로
  const missingKey = missing.join(',')

  useEffect(() => {
    if (!enabled || !missingKey) return

    // AbortController: 진행 중인 fetch를 취소하는 도구 (3)
    // 정리 함수(return)에서 abort() → 화면을 떠나거나 missingKey가 바뀌면 이전 요청을 취소한다
    const controller = new AbortController()
    const requested = missingKey.split(',').map(Number)

    fetchProductsByIds(requested, controller.signal)
      .then((items) => {
        // 이전 상태를 바탕으로 합친다(함수형 업데이트) — 그 사이 다른 응답이 먼저 와서 바뀌었을 수 있다
        setProducts((prev) => [...prev.filter((p) => !requested.includes(p.id)), ...items])
        setCheckedIds((prev) => new Set([...prev, ...requested]))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return // 취소한 요청은 무시
        setFailure({ key: missingKey, error: error instanceof ApiError ? error : new ApiError(0, String(error)) })
      })

    return () => controller.abort()
    // attempt: 다시 시도 때 같은 missingKey로 한 번 더 실행하려고 넣었다
  }, [enabled, missingKey, attempt])

  const retry = useCallback(() => {
    setFailure(null)
    setAttempt((n) => n + 1)
  }, [])

  // 상태는 따로 저장하지 않고 계산한다 (파생 상태) — '로딩 중' 플래그를 켜고 끄는 걸 빠뜨리는 버그가 없다
  const error = failure && failure.key === missingKey ? failure.error : null
  let status: Status = 'success'
  if (error) status = 'error'
  else if (!enabled || missing.length > 0) status = 'loading'

  return { products, status, error, retry }
}
