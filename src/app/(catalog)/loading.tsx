import CatalogSkeleton from '@/components/CatalogSkeleton'

// 로딩 화면 — 홈("/", 상품 목록)이 준비되는 동안 (Step 4-3)
//
// loading.tsx란?
// - 같은 폴더의 page.tsx를 Next.js가 자동으로 <Suspense fallback={<Loading />}>로 감싸 준다.
//   즉 직접 쓰면 아래와 같은 코드를 파일 이름 규칙으로 대신해 주는 것이다.
//     <Header />                          ← layout.tsx: 그대로 보이고 계속 누를 수 있다
//     <Suspense fallback={<Loading />}>   ← loading.tsx
//       <HomePage />                      ← page.tsx
//     </Suspense>
// - 페이지 전체가 아니라 '바뀌는 부분'만 로딩 화면으로 바꾼다. 헤더(다크 모드 버튼 등)는 그대로다.
//
// 왜 필요한가?
// - 홈은 Step 4-2부터 요청이 올 때마다 서버에서 만든다(ƒ). 상세에서 '목록으로'를 누르면 서버 응답을 기다려야 한다.
// - loading.tsx가 없으면 그동안 화면이 아무 반응 없이 이전 페이지에 멈춰 있다. (눌렸는지 알 수 없어서 또 누르게 됨)
// - loading.tsx가 있으면 Next.js가 이 로딩 화면을 '미리 받아(prefetch)' 두었다가, 누르는 즉시 보여 준다.
//
// 왜 app/loading.tsx가 아니라 (catalog) 폴더 안에 있나? — 라우트 그룹
// - loading.tsx는 같은 폴더와 '하위 폴더 전체'에 적용된다. app/ 바로 아래에 두면 상세·404 페이지까지 감싼다.
// - 실제로 그렇게 했더니 상세 페이지의 첫 HTML에 '목록 모양' 스켈레톤이 먼저 들어가서,
//   새로고침할 때 목록 스켈레톤이 한 프레임 번쩍였다가 상세 화면으로 바뀌었다. (JS를 끄면 목록 스켈레톤만 남음)
// - 괄호로 감싼 폴더 (catalog)는 '라우트 그룹'이다. 주소에는 나타나지 않고(여전히 "/"), 파일을 묶는 용도로만 쓴다.
//   홈(page.tsx)과 이 파일만 이 그룹에 넣어서, 목록 로딩 화면이 홈에만 적용되게 했다.
// - 상세 페이지는 자기 모양의 로딩 화면(app/products/[id]/loading.tsx)을 따로 둔다.
//
// page.tsx 안의 <Suspense fallback={<CatalogSkeleton />}>와의 차이
// - loading.tsx: 페이지 '전체'를 기다릴 때 (다른 페이지에서 홈으로 이동, 서버에서 페이지 만드는 중)
// - page.tsx의 Suspense: 페이지 '안의 일부'를 기다릴 때 (ProductCatalog가 주소 쿼리를 읽는 중)
// 둘 다 같은 스켈레톤이라 사용자에게는 하나의 로딩 화면으로 이어져 보인다.
//
// 서버 컴포넌트다. 받는 props는 없다.
export default function Loading() {
  return <CatalogSkeleton />
}
