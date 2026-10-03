import ProductDetailSkeleton from '@/components/ProductDetailSkeleton'

// 로딩 화면 — 상품 상세("/products/:id")가 준비되는 동안 (Step 4-3)
//
// app/loading.tsx(목록 스켈레톤)가 이미 있는데 왜 또 만드나?
// - Next.js는 '가장 가까운' loading.tsx를 쓴다. 이 파일이 없으면 상세로 갈 때 목록 모양 스켈레톤이 떴다가
//   상세 화면으로 바뀌어서, 모양이 크게 달라 오히려 어색하다.
// - 로딩 화면은 '곧 나올 화면의 모양'이어야 의미가 있으므로, 주소(폴더)마다 맞는 스켈레톤을 둔다.
//
// 지금은 상세 페이지를 빌드 때 미리 만들어 두어서(●) 거의 보이지 않는다.
// 확인하려면 개발자 도구 Network 탭에서 느린 네트워크(Slow 4G)로 바꾸고 목록에서 상품을 눌러 본다.
export default function Loading() {
  return <ProductDetailSkeleton />
}
