import 'server-only'
import { prisma } from '@/lib/db'
import { ALL_CATEGORIES } from '@/lib/filterProducts'
import { DEFAULT_FILTERS, type CatalogFilters } from '@/lib/catalogParams'
import type { SortValue } from '@/lib/sortProducts'
import { simulateNetwork } from '@/lib/mockNetwork'
import type { Prisma, Product as ProductRow } from '@/generated/prisma/client'
import type { Product } from '@/types/product'
import type { ProductListResponse } from '@/types/api'

// 상품 데이터를 "가져오는" 함수 모음 — 서버 전용 데이터 계층 (Step 4-1, 6-1 목록·카테고리, 7-3 나눠 받기, 8-2 DB로 교체)
//
// 왜 페이지에서 데이터를 직접 쓰지 않고 함수를 거치나?
// - Step 4-1에 적어 둔 그대로다: "지금은 목 데이터지만 나중에 DB에서 가져온다. 함수를 한 겹 두면 이 파일 안쪽만 바꾼다."
// - Step 8-2에서 실제로 그렇게 했다. 바뀐 곳은 이 파일뿐 — 함수 이름·인자·돌려주는 모양이 같아서
//   page.tsx, API(app/api), 화면 컴포넌트는 한 줄도 고치지 않았다.
//
// 누가 이 파일을 쓰나? (Step 6-1)
//   서버 컴포넌트(page.tsx)  ──직접 호출──▶ 이 파일 ──▶ DB (lib/db.ts의 prisma)
//   브라우저('use client')  ──fetch──▶ Route Handler(app/api/...) ──▶ 이 파일
// - import 'server-only': 브라우저 코드에서 import하면 빌드 에러. 데이터 접근이 서버에만 있게 지킨다.
//
// Step 8-2: 걸러내기·정렬·나누기를 JS 배열 함수(filter·sort·slice)가 아니라 DB가 한다
// - 예전: 상품 전부를 메모리에 올린 뒤 JS로 거르고 잘랐다. 상품이 100만 개면 100만 개를 읽어야 한다.
// - 지금: where(거르기)·orderBy(정렬)·skip/take(나누기)를 DB에 넘긴다 → DB는 필요한 8개만 읽어 보낸다.
//   (category에 색인을 걸어 둔 이유 — schema.prisma)
//
// 모든 함수는 simulateNetwork()를 먼저 기다린다 — 환경 변수로 느린 서버·실패를 흉내 낼 수 있다 (lib/mockNetwork.ts)

// 목록 조회 조건
export interface ProductQuery {
  /** 검색·카테고리·정렬·품절 숨기기. 빠진 값은 기본값 */
  filters?: Partial<CatalogFilters>
  /** 이 id들만 (장바구니처럼 정해진 상품만 필요할 때). 순서는 id 순 */
  ids?: number[]
  /** 페이지 번호(1부터)와 크기 (Step 7-3). size가 없으면 전부 */
  page?: number
  size?: number
}

// DB의 한 행 → 화면이 쓰는 Product 모양 (Step 8-2)
// DB는 이미지를 열 세 개로 저장하고(schema.prisma), 화면은 image 객체 하나를 쓴다. 이 변환이 둘 사이의 '통역'이다.
// createdAt·updatedAt 같은 DB 전용 열은 화면에 보내지 않는다.
function toProduct(row: ProductRow): Product {
  const { id, name, price, category, rating, stock, imageSrc, imageWidth, imageHeight } = row
  const product: Product = { id, name, price, category, rating, stock }
  // 세 값이 모두 있을 때만 이미지로 본다 (하나라도 없으면 크기를 알 수 없어 next/image가 그릴 수 없다)
  if (imageSrc && imageWidth && imageHeight) {
    product.image = { src: imageSrc, width: imageWidth, height: imageHeight }
  }
  return product
}

// 정렬 기준 → DB 정렬(orderBy)
// 같은 값이면(가격이 같은 상품) id 순 — 정렬 결과가 매번 같아야 '더 보기'로 나눠 받을 때 상품이 겹치거나 빠지지 않는다.
// (예전 JS sort도 같은 값이면 원래 순서 = id 순을 유지했다. 그 결과와 똑같이 맞췄다)
const ORDER_BY: Record<SortValue, Prisma.ProductOrderByWithRelationInput[]> = {
  default: [{ id: 'asc' }],
  'price-asc': [{ price: 'asc' }, { id: 'asc' }],
  'price-desc': [{ price: 'desc' }, { id: 'asc' }],
  rating: [{ rating: 'desc' }, { id: 'asc' }],
}

// 필터 → DB 조건(where). 예전 filterProducts(lib/filterProducts.ts)와 같은 규칙
function toWhere({ query, category, hideSoldOut }: CatalogFilters, ids?: number[]): Prisma.ProductWhereInput {
  const keyword = query.trim()
  return {
    // 조건이 없으면 undefined → Prisma가 그 조건을 빼고 만든다
    id: ids ? { in: ids } : undefined,
    // 상품명 또는 카테고리에 검색어가 들어 있으면. SQLite의 contains(LIKE)는 영문 대소문자를 구분하지 않는다
    OR: keyword ? [{ name: { contains: keyword } }, { category: { contains: keyword } }] : undefined,
    category: category === ALL_CATEGORIES ? undefined : category,
    stock: hideSoldOut ? { gt: 0 } : undefined, // gt: greater than (> 0)
  }
}

// 상품 목록 — DB가 거르고(where) → 정렬하고(orderBy) → 자른다(skip·take)
export async function getProducts({
  filters = {},
  ids,
  page = 1,
  size,
}: ProductQuery = {}): Promise<ProductListResponse> {
  await simulateNetwork()
  const merged = { ...DEFAULT_FILTERS, ...filters }
  const where = toWhere(merged, ids)

  // 전체 개수(count)와 이번 페이지(findMany)를 동시에 묻는다 (Promise.all — 6-2)
  // skip: 앞에서 몇 개를 건너뛸지 = SQL의 OFFSET / take: 몇 개 가져올지 = LIMIT
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: ORDER_BY[merged.sort],
      skip: size === undefined ? undefined : (page - 1) * size,
      take: size,
    }),
  ])

  const nextPage = size !== undefined && page * size < total ? page + 1 : null
  return { items: rows.map(toProduct), total, nextPage }
}

// 카테고리 목록 (상품에 있는 것만, 처음 나온 순서대로, 맨 앞에 '전체')
// groupBy: 카테고리별로 묶는다(SQL의 GROUP BY). _min.id로 '그 카테고리의 첫 상품 번호'를 구해 그 순서로 정렬
export async function getCategories(): Promise<string[]> {
  await simulateNetwork()
  const groups = await prisma.product.groupBy({
    by: ['category'],
    _min: { id: true },
    orderBy: { _min: { id: 'asc' } },
  })
  return [ALL_CATEGORIES, ...groups.map((group) => group.category)]
}

// 주소의 id(문자열)로 상품 하나를 찾는다. 없으면 undefined
//
// 주소에서 온 값은 항상 '문자열'이다. (/products/3 → '3')
// Number('03'), Number('3.0'), Number(' 3')은 모두 3이 되어서 같은 상품이 여러 주소로 열린다.
// (검색엔진은 주소가 다르면 다른 페이지로 보고 '중복 콘텐츠'로 취급한다)
// → '0으로 시작하지 않는 숫자만'인 문자열만 받는다. (예전 String(p.id) === id 비교와 같은 결과)
export async function getProduct(id: string): Promise<Product | undefined> {
  await simulateNetwork()
  if (!/^[1-9]\d*$/.test(id)) return undefined
  // findUnique: 기본 키(id)처럼 하나뿐인 값으로 찾을 때. 없으면 null
  const row = await prisma.product.findUnique({ where: { id: Number(id) } })
  return row ? toProduct(row) : undefined
}

// 모든 상품 id 목록 — 상세 페이지를 빌드할 때 미리 만들어 둘 주소 목록에 쓴다 (generateStaticParams)
// select: 필요한 열(id)만 읽는다 — 다른 열까지 읽을 필요가 없다
export async function getProductIds(): Promise<string[]> {
  const rows = await prisma.product.findMany({ select: { id: true }, orderBy: { id: 'asc' } })
  return rows.map((row) => String(row.id))
}
