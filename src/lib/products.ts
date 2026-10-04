import 'server-only'
import { products } from '@/data/products'
import { filterProducts, getCategories as collectCategories } from '@/lib/filterProducts'
import { sortProducts } from '@/lib/sortProducts'
import { DEFAULT_FILTERS, type CatalogFilters } from '@/lib/catalogParams'
import { simulateNetwork } from '@/lib/mockNetwork'
import type { Product } from '@/types/product'
import type { ProductListResponse } from '@/types/api'

// 상품 데이터를 "가져오는" 함수 모음 — 서버 전용 데이터 계층 (Step 4-1, 6-1에서 목록·카테고리 추가)
//
// 왜 페이지에서 products 배열을 직접 쓰지 않고 함수를 거치나?
// - 지금은 목 데이터(data/products.ts)지만, Step 8에서는 DB에서 가져온다.
// - 페이지가 배열을 직접 뒤지면 그때 페이지를 전부 고쳐야 한다.
//   함수를 한 겹 두면 이 파일 안쪽만 바꾸고, 페이지 코드는 그대로 둘 수 있다.
//
// 왜 async인가?
// - 지금은 배열에서 찾는 것이라 바로 끝나지만, API·DB는 응답을 '기다려야' 한다.
// - 처음부터 Promise를 돌려주게 만들어 두면, 나중에 DB로 바꿔도 부르는 쪽(await getProduct(...))은 그대로다.
//
// Step 6-1: 누가 이 파일을 쓰나? (Next.js 공식 권장 구조)
//   서버 컴포넌트(page.tsx)  ──직접 호출──▶ 이 파일 ──▶ 데이터(지금은 목 데이터, Step 8에서 DB)
//   브라우저('use client')  ──fetch──▶ Route Handler(app/api/...) ──▶ 이 파일
// - 서버 컴포넌트는 이미 서버에 있으므로 자기 API를 fetch하지 않고 함수를 바로 부른다.
//   (fetch하면 서버가 자기 자신에게 HTTP 요청을 한 번 더 보내는 셈이라 느리고, 빌드 중에는 서버가 없어서 실패한다)
// - 브라우저는 서버의 함수를 부를 수 없으니 API(주소)를 통해 요청한다.
// - import 'server-only': 브라우저 코드에서 이 파일을 import하면 빌드 에러. 데이터 접근이 서버에만 있게 지킨다.
//
// 모든 함수는 simulateNetwork()를 먼저 기다린다 — 환경 변수로 느린 서버·실패를 흉내 낼 수 있다 (lib/mockNetwork.ts)

// 목록 조회 조건
export interface ProductQuery {
  /** 검색·카테고리·정렬·품절 숨기기. 빠진 값은 기본값 */
  filters?: Partial<CatalogFilters>
  /** 이 id들만 (장바구니처럼 정해진 상품만 필요할 때). 순서는 상품 데이터 순서 */
  ids?: number[]
}

// 상품 목록 — 걸러내기 → 정렬
export async function getProducts({ filters = {}, ids }: ProductQuery = {}): Promise<ProductListResponse> {
  await simulateNetwork()
  const { query, category, sort, hideSoldOut } = { ...DEFAULT_FILTERS, ...filters }

  // Set: '포함되어 있나'를 빠르게 확인하는 모음 (배열의 includes보다 빠르다)
  const idSet = ids ? new Set(ids) : null
  const source = idSet ? products.filter((p) => idSet.has(p.id)) : products

  const items = sortProducts(filterProducts(source, { query, category, hideSoldOut }), sort)
  return { items, total: items.length }
}

// 카테고리 목록 (상품 데이터에 있는 것만, 맨 앞에 '전체')
export async function getCategories(): Promise<string[]> {
  await simulateNetwork()
  return collectCategories(products)
}

// 주소의 id(문자열)로 상품 하나를 찾는다. 없으면 undefined
//
// 주소에서 온 값은 항상 '문자열'이다. (/products/3 → '3')
// 숫자로 바꿔 비교(Number(id) === p.id)하지 않고, 상품 id를 문자열로 바꿔 비교한다.
// - Number('03'), Number('3.0'), Number(' 3')은 모두 3이 되어서 같은 상품이 여러 주소로 열린다.
//   (검색엔진은 주소가 다르면 다른 페이지로 보고 '중복 콘텐츠'로 취급한다)
// - 문자열 비교는 '3' 하나만 통과한다. 'abc'처럼 숫자가 아닌 값도 자연스럽게 undefined가 된다.
export async function getProduct(id: string): Promise<Product | undefined> {
  await simulateNetwork()
  return products.find((p) => String(p.id) === id)
}

// 모든 상품 id 목록 — 상세 페이지를 빌드할 때 미리 만들어 둘 주소 목록에 쓴다 (generateStaticParams)
export async function getProductIds(): Promise<string[]> {
  return products.map((p) => String(p.id))
}
