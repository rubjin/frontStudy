'use client'

import { useEffect, useState } from 'react'

// 값이 바뀌고 delay(ms) 동안 '더 바뀌지 않으면' 그때 바뀐 값을 돌려주는 훅 (Step 7-2, 검색 debounce)
//
// 왜 필요한가?
// - 검색어로 서버에 요청하게 바뀌었다(7-2). '무선 이어폰'을 치면 ㅁ, 무, 무ㅅ, 무서, 무선 ... 글자마다 요청이 나간다.
// - 입력이 잠깐 멈췄을 때(300ms) 한 번만 요청하면 된다. 이렇게 '연달아 일어나는 일을 마지막 한 번으로 모으는 것'을 debounce라 한다.
//   (엘리베이터 문: 사람이 계속 타면 닫히지 않고, 마지막 사람이 탄 뒤 몇 초 지나야 닫힌다)
//
// 입력창 자체는 늦추지 않는다 — 입력창은 원래 값(주소의 q)을 바로 보여 주고, '요청에 쓸 값'만 늦춘다.
//
// 사용: const debouncedQuery = useDebouncedValue(query, 300)
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    // 값이 바뀔 때마다 타이머를 새로 건다
    const timer = window.setTimeout(() => setDebounced(value), delay)
    // 정리 함수: delay가 지나기 전에 값이 또 바뀌면 이전 타이머를 취소한다 → 마지막 값만 남는다
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
