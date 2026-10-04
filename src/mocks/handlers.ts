import { delay, http, HttpResponse } from 'msw'
import { products } from '@/data/products'
import { filterProducts, getCategories } from '@/lib/filterProducts'
import { sortProducts } from '@/lib/sortProducts'
import { parseCatalogParams, parseIdList } from '@/lib/catalogParams'
import type { ApiErrorResponse, CategoryListResponse, ProductListResponse } from '@/types/api'

// MSW 요청 핸들러 — 우리 API(/api/...)를 브라우저 안에서 흉내 낸다 (Step 6-4)
//
// 왜 필요한가?
// - Storybook은 Next.js 서버 없이 컴포넌트만 띄운다. /api/products를 fetch하는 컴포넌트(CartContents)는
//   Storybook에서 받을 곳이 없어 항상 '실패' 화면이 된다.
// - MSW(Mock Service Worker)는 브라우저의 서비스 워커로 fetch 요청을 '가로채서' 우리가 정한 응답을 돌려준다.
//   컴포넌트 코드는 그대로(진짜 fetch) — 네트워크 단계에서만 바뀌므로 '가짜 API용 코드'를 컴포넌트에 넣지 않아도 된다.
// - 실패·지연·네트워크 끊김도 스토리마다 마음대로 만들 수 있다. (실제 서버로는 재현하기 어렵다)
// - Step 10 테스트(Vitest·Playwright)에서도 같은 핸들러를 쓴다.
//
// 응답 모양은 types/api.ts 타입으로 맞춘다 → 실제 API와 어긋나면 타입 에러가 난다.
// 걸러내기·정렬은 실제 API와 같은 순수 함수(lib/filterProducts, sortProducts, catalogParams)를 쓴다.
// (lib/products.ts는 server-only라 브라우저에서 import할 수 없다)
//
// 키 이름별 묶음(Record)으로 내보내는 이유:
// 스토리에서 parameters.msw.handlers.products만 바꿔 끼우면 '상품 API만 실패'처럼 일부만 덮어쓸 수 있다.

// 상품 목록 + 상품 하나
const productHandlers = [
  http.get('/api/products', ({ request }) => {
    const { searchParams } = new URL(request.url)
    const ids = parseIdList(searchParams.get('ids'))
    const { query, category, sort, hideSoldOut } = parseCatalogParams(searchParams, null)
    const source = ids ? products.filter((p) => ids.includes(p.id)) : products
    const items = sortProducts(filterProducts(source, { query, category, hideSoldOut }), sort)
    return HttpResponse.json<ProductListResponse>({ items, total: items.length })
  }),
  // :id — 주소의 이 자리 값이 params.id로 들어온다 (Next.js의 [id]와 같은 역할)
  http.get('/api/products/:id', ({ params }) => {
    const product = products.find((p) => String(p.id) === params.id)
    if (!product) {
      return HttpResponse.json<ApiErrorResponse>({ error: { message: '상품을 찾을 수 없습니다.' } }, { status: 404 })
    }
    return HttpResponse.json(product)
  }),
]

const categoryHandlers = [
  http.get('/api/categories', () => HttpResponse.json<CategoryListResponse>({ items: getCategories(products) })),
]

// 기본 핸들러 — .storybook/preview.tsx가 모든 스토리에 깐다
export const handlers = {
  products: productHandlers,
  categories: categoryHandlers,
}

// ─── 스토리에서 바꿔 끼우는 상황별 핸들러 ───────────────────
// 상품 API 주소 두 개(목록, 하나)를 모두 덮는다. 'products' 키를 통째로 바꾸므로 하나만 적으면 나머지 주소는 처리할 곳이 없어진다.
// (Step 7-1에서 장바구니가 목록(?ids=) 대신 상품 하나(/api/products/:id)를 쓰게 바뀌면서 발견)
const PRODUCT_PATHS = ['/api/products', '/api/products/:id']

// 응답이 오지 않음 → 로딩 화면 그대로 (delay('infinite'): 영원히 기다린다)
export const productsLoading = PRODUCT_PATHS.map((path) =>
  http.get(path, async () => {
    await delay('infinite')
  }),
)

// 서버 오류 500
export const productsServerError = PRODUCT_PATHS.map((path) =>
  http.get(path, () =>
    HttpResponse.json<ApiErrorResponse>({ error: { message: '상품 정보를 불러오지 못했습니다.' } }, { status: 500 }),
  ),
)

// 네트워크 끊김 — HttpResponse.error(): 응답 자체가 없음 (fetch가 실패로 끝난다)
export const productsNetworkError = PRODUCT_PATHS.map((path) => http.get(path, () => HttpResponse.error()))
