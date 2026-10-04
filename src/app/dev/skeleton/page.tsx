import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SkeletonPreview from './SkeletonPreview'
import { getCategories } from '@/lib/products'

// 개발용 스켈레톤 미리보기 페이지 — 주소 "/dev/skeleton" (Step 3-2 보강)
//
// 왜 필요한가?
// - 지금은 상품 데이터가 파일에 있어서 기다릴 일이 없으므로, 실제 화면에서는 스켈레톤이 거의 보이지 않는다.
// - 스켈레톤 모양과, 실제 화면으로 바뀔 때 레이아웃이 움직이지 않는지를 눈으로 확인하려고 만든 개발자용 페이지다.
// - Step 3-3에서 Storybook을 만들면 컴포넌트 단위 확인은 Storybook이 맡는다.
//   이 페이지는 '실제 레이아웃(헤더·본문 폭) 안에서' 교체 과정을 보는 용도로 남겨 둔다.
//
// 배포 환경에서는 404
// - process.env.NODE_ENV: 개발 서버(npm run dev)에서는 'development', 빌드·배포(next build/start)에서는 'production'
// - notFound(): 호출하면 그 자리에서 렌더링을 멈추고 not-found.tsx(404 화면)를 보여 준다.
// → 사용자는 이 페이지에 들어올 수 없고, 개발 중인 우리만 볼 수 있다.

export const metadata: Metadata = {
  title: '스켈레톤 미리보기 (개발용)',
  // 혹시 노출되더라도 검색엔진에 올라가지 않게
  robots: { index: false, follow: false },
}

export default async function SkeletonDevPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  // Step 6-2: 카테고리를 서버에서 받아 넘긴다. (7-2부터 목록은 ProductCatalog가 브라우저에서 API로 받는다)
  const categories = await getCategories()
  return <SkeletonPreview categories={categories} />
}
