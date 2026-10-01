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
// 상품이 12개뿐이고 자주 바뀌지 않으니, 요청이 올 때마다 만들 필요 없이 빌드할 때 HTML을 만들어 둔다.
// → 사용자가 열면 이미 만들어진 HTML을 바로 보내서 빠르다. (빌드 결과에 ● 표시)
//
// dynamicParams = false: 이 목록에 없는 id(/products/999, /products/abc)는 '맞는 주소가 없음'으로 보고 바로 404
// - 기본값(true)이면 그 자리에서 페이지를 만들어 보고, 아래 page의 notFound()가 404를 낸다.
// - 그런데 Next.js 16.3.6에는 page 안에서 notFound()를 부르면 404 화면이 HTML에 들어가지 않는 버그가 있다.
//   (빈 <html id="__next_error__">만 보내고 브라우저 JS가 화면을 그림 → lang 없음, 다크 모드 풀림, JS 꺼지면 빈 화면)
//   https://github.com/vercel/next.js/issues/99287 (2026-10 기준 미해결)
// - false로 두면 '맞는 주소가 없는' 경로로 처리되어 app/not-found.tsx가 정상 HTML로 나간다. (확인함)
// - 대가: 상품 전용 404 문구 대신 사이트 공통 404 문구가 나온다.
//   Step 8(DB)에서 빌드 뒤에 추가된 상품도 열려야 하면 true로 돌려야 하므로, 그때 버그가 고쳐졌는지 다시 확인한다.
export const dynamicParams = false

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

  // 없는 상품: 여기서는 제목만 정하고 끝낸다. 404 화면과 제목은 아래 page에서 notFound()가 처리한다
  if (!product) return {}

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

  // notFound(): 가장 가까운 not-found.tsx를 보여 주고 HTTP 404를 보낸다.
  // 지금은 dynamicParams = false라서 없는 id는 여기까지 오지 않는다. 그래도 남겨 두는 이유:
  // 목록(generateStaticParams)과 데이터가 어긋나거나 dynamicParams를 true로 돌렸을 때를 대비한 안전장치.
  // 함수 안에서 에러를 던져 실행을 멈추기 때문에 return을 쓰지 않아도 된다.
  // TypeScript도 이걸 알아서, 이 줄 아래에서는 product가 undefined가 아니라고(Product) 판단한다.
  if (!product) notFound()

  return <ProductDetail product={product} />
}
