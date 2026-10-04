'use client'

import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/queryClient'

// TanStack Query를 사이트 전체에서 쓰게 깔아 두는 Provider (Step 7-1)
//
// TanStack Query란? — '서버에서 받은 데이터' 전용 상태 관리 도구
// 6-3에서 fetch를 직접 다루며 챙긴 것들을 대신 해 준다:
//   로딩·에러 상태, 다시 시도, 요청 취소, 같은 요청 합치기, 결과 저장(캐시), 오래된 데이터 새로 받기
// 장바구니처럼 '내가 바꾸는 상태'는 useReducer(Step 5), '서버에 있는 데이터를 받아 온 것'은 TanStack Query — 역할을 나눈다.
//
// 구조: layout.tsx
//   <QueryProvider>          ← 가장 바깥 (CartProvider가 useQueryClient를 쓰므로 그보다 위)
//     <ToastProvider>
//       <CartProvider> ...
//
// ReactQueryDevtools: 화면 구석의 꽃 아이콘. 캐시에 어떤 키가 있고 상태가 어떤지 보여 준다.
//   개발 모드(npm run dev)에서만 나타나고, 배포 빌드에서는 자동으로 빠진다.

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState로 감싸지 않고 getQueryClient()를 부르는 이유는 lib/queryClient.ts 주석 참고 (브라우저는 하나만)
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
