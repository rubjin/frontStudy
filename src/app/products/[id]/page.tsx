import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/ProductDetail'
import { formatPrice } from '@/lib/format'
import { getProduct, getProductIds } from '@/lib/products'

// 상품 상세 페이지 — 주소 "/products/:id" (Step 3-1 뼈대 → Step 4-1 완성)
//
// 이 파일이 하는 일은 세 가지뿐이다. 화면 모양은 ProductDetail 컴포넌트가 맡는다.
// 1) 빌드할 때 미리 만들 주소 목록 알려 주기 (generateStaticParams)
// 2) 주소마다 다른 <title>·설명 만들기 (generateMetadata)
// 3) 주소의 id로 상품을 찾고, 없으면 404 (notFound)
//
// 동적 라우트 (Step 3-1)
// - 폴더 이름 [id] → 그 자리에 오는 값을 params.id로 받는다. 예) /products/3 → { id: '3' }
// - params는 Promise라서 await로 꺼낸다. 그래서 함수가 async다.
// - PageProps<'/products/[id]'>: Next.js가 폴더 구조를 보고 만들어 주는 타입. params에 id가 있다는 것을 안다.

// ─── 1) 정적 생성: 빌드할 때 상세 페이지를 미리 만들어 둔다 ───────────────
// 상품 정보는 자주 바뀌지 않으니, 요청이 올 때마다 만들 필요 없이 빌드할 때 HTML을 만들어 둔다.
// → 사용자가 열면 이미 만들어진 HTML을 바로 보내서 빠르다. (빌드 결과에 ● 표시)
// Step 8-3: 관리 화면에서 고치면 Server Action이 revalidatePath('/products/3')로 이 페이지만 다시 만들게 한다.
//
// dynamicParams — 빌드 때 목록에 없던 id가 오면?
// - Step 4-1~8-2: false — 목록에 없는 id는 바로 404. (Next.js 16.3.6에서 page 안의 notFound() 404 화면이
//   HTML에 안 들어가는 버그 #99287을 피하려고)
// - Step 8-3: true — 관리 화면에서 '빌드 뒤에 추가한 상품'도 열려야 한다. 처음 요청 때 만들고 그 뒤로는 만들어 둔 것을 쓴다.
//   다시 확인해 보니 지금 구성(같은 폴더의 loading.tsx가 있음)에서는 위 버그가 재현되지 않았다:
//   없는 id → <html lang="ko"> + 404 문구가 정상 HTML로 나온다.
//   대신 HTTP 상태 코드가 404가 아니라 200이다(soft 404). loading.tsx 때문에 응답을 '스트리밍'으로 먼저 보내기 시작해서,
//   notFound()가 불릴 때는 이미 상태 코드를 보낸 뒤이기 때문이다. Next.js가 <meta name="robots" content="noindex">를
//   넣어 검색 결과에는 나오지 않는다. (Next.js 문서 loading.js > Status Codes에 적힌 동작)
//   진짜 404 상태 코드가 필요하면 응답 전에 proxy.ts에서 확인해야 한다 → Step 9에서 proxy.ts를 도입할 때 함께 다룬다.
export const dynamicParams = true

export async function generateStaticParams() {
  const ids = await getProductIds()
  // [{ id: '1' }, { id: '2' }, ...] — 폴더 이름 [id]와 같은 키로
  return ids.map((id) => ({ id }))
}

// ─── 2) 페이지별 SEO 정보 ───────────────────────────────────────────────
// 주소에 따라 제목이 달라지므로 객체(metadata)가 아니라 함수(generateMetadata)로 만든다.
// 결과 제목은 레이아웃의 title.template에 들어가서 '무선 노이즈캔슬링 헤드폰 | Shoppr'가 된다.
export async function generateMetadata({ params }: PageProps<'/products/[id]'>): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  // 없는 상품: 404 화면 내용은 아래 page에서 notFound()가 처리한다. 탭 제목만 정해 둔다 (Step 8-3)
  if (!product) return { title: '상품을 찾을 수 없습니다' }

  // 검색 결과·메신저 미리보기에 보일 한 줄 설명
  const description = `${product.category} · ${formatPrice(product.price)} · 평점 ${product.rating.toFixed(1)}`

  return {
    title: product.name,
    description,
    // Open Graph: 카카오톡·슬랙 등에 링크를 붙였을 때 보이는 미리보기 카드
    // (사진 미리보기는 사이트 주소(metadataBase)가 정해지는 배포 단계(Step 11)에서 추가한다)
    openGraph: {
      title: product.name,
      description,
    },
  }
}

// ─── 3) 화면 ─────────────────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params
  const product = await getProduct(id)

  // notFound(): 가장 가까운 not-found.tsx를 보여 준다. (Step 8-3부터 없는 id는 여기로 온다 — 위 dynamicParams 주석)
  // 관리 화면에서 삭제한 상품도 여기서 404가 된다.
  // 함수 안에서 에러를 던져 실행을 멈추기 때문에 return을 쓰지 않아도 된다.
  // TypeScript도 이걸 알아서, 이 줄 아래에서는 product가 undefined가 아니라고(Product) 판단한다.
  if (!product) notFound()

  return <ProductDetail product={product} />
}
