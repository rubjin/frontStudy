import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { Product } from '../src/types/product'

// 실제 같은 상품 데이터 가져오기 — DummyJSON → prisma/data/dummyjson-products.json (Step 8-4)
//
// 실행: npm run data:import   (인터넷 연결 필요. 데이터를 새로 받고 싶을 때만)
// 그다음: npm run db:reset    (DB를 지우고 → 마이그레이션 → 시드. 시드가 이 JSON을 DB에 넣는다)
//
// DummyJSON(https://dummyjson.com)이란?
// - 개발·학습용 공개 가짜 API. 실제 쇼핑몰처럼 상품 194개(사진·가격·평점·재고·카테고리)를 준다.
// - 회원가입·키 없이 GET으로 받을 수 있다. (회사 네트워크에서도 접속 확인, 2026-10-06)
//
// 왜 시드할 때마다 받지 않고 JSON 파일로 저장(스냅샷)해 두나?
// - 시드는 네트워크 없이도, 누가 언제 실행해도 같은 결과여야 한다. (외부 API는 내용이 바뀌거나 꺼질 수 있다)
// - 저장한 파일을 커밋하면 어떤 데이터가 들어가는지 Git으로 보이고, 바뀌면 diff로 확인할 수 있다.
//
// 이 파일이 하는 일 = 외부 데이터 모양 → 우리 모양(types/product.ts)으로 '통역'
// | DummyJSON                 | 우리                                    |
// | title                     | name                                    |
// | price (달러, 소수)         | price (원, 정수, 100원 단위)            |
// | category ('home-decoration') | category ('홈 데코', 한글)           |
// | rating (4.94)             | rating 그대로 (화면은 소수 한 자리)      |
// | stock                     | stock 그대로 (0이면 품절)                |
// | images[0] (주소만)         | image { src, width, height } — 크기는 직접 잰다 |
// description·brand·reviews 등 우리 스키마에 없는 필드는 버린다. (필요해지면 schema.prisma에 열을 더한다)
//
// 'server-only'가 붙은 lib/ 파일(db.ts 등)은 쓰지 않는다 — seed.ts와 같은 이유로 Next.js 밖(tsx)에서 실행되기 때문

const SOURCE_URL = 'https://dummyjson.com/products?limit=0&select=id,title,category,price,rating,stock,images'
// npm 명령(npm run data:import)은 항상 프로젝트 루트에서 실행된다
const OUTPUT_FILE = path.join(process.cwd(), 'prisma', 'data', 'dummyjson-products.json')

// 1달러 = 1,400원으로 가정하고 100원 단위로 반올림 (예: 9.99달러 → 13,986원 → 14,000원)
// 환율은 고정값이다. 실제 쇼핑몰이라면 원화 가격을 따로 관리한다.
const KRW_PER_USD = 1400
const toKrw = (usd: number) => Math.round((usd * KRW_PER_USD) / 100) * 100

// 이미지 크기를 잴 때 동시에 받을 개수 (194개를 하나씩 받으면 느리고, 한꺼번에 받으면 서버에 부담)
const CONCURRENCY = 8

// 카테고리 이름 한글로 (화면의 카테고리 버튼·이동 경로에 그대로 나온다)
const CATEGORY_KO: Record<string, string> = {
  beauty: '뷰티',
  fragrances: '향수',
  furniture: '가구',
  groceries: '식료품',
  'home-decoration': '홈 데코',
  'kitchen-accessories': '주방용품',
  laptops: '노트북',
  'mens-shirts': '남성 셔츠',
  'mens-shoes': '남성 신발',
  'mens-watches': '남성 시계',
  'mobile-accessories': '모바일 액세서리',
  motorcycle: '오토바이',
  'skin-care': '스킨케어',
  smartphones: '스마트폰',
  'sports-accessories': '스포츠 용품',
  sunglasses: '선글라스',
  tablets: '태블릿',
  tops: '상의',
  vehicle: '자동차',
  'womens-bags': '여성 가방',
  'womens-dresses': '여성 원피스',
  'womens-jewellery': '여성 주얼리',
  'womens-shoes': '여성 신발',
  'womens-watches': '여성 시계',
}

// DummyJSON 응답 중 우리가 쓰는 부분의 모양
interface DummyProduct {
  id: number
  title: string
  category: string
  price: number
  rating: number
  stock: number
  images: string[]
}

// 저장할 파일의 모양 — 어디서·언제·어떤 기준으로 만든 데이터인지 함께 남긴다
export interface ProductSnapshot {
  source: string
  importedAt: string
  krwPerUsd: number
  products: Product[]
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`)
  return (await response.json()) as T
}

// 이미지를 받아 실제 가로·세로를 잰다
// sharp: 이미지 처리 라이브러리. next/image가 사진을 줄이고 WebP로 바꿀 때 쓰는 바로 그 라이브러리라 Next.js와 함께 설치되어 있다
async function measureImage(url: string): Promise<{ width: number; height: number }> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`)
  const { width, height } = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
  if (!width || !height) throw new Error(`${url} → 크기를 읽지 못했습니다`)
  return { width, height }
}

// 목록을 CONCURRENCY개씩 나눠 동시에 처리한다 (일꾼 8명이 줄을 서서 하나씩 가져가는 방식)
async function mapWithConcurrency<T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index])
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

async function main() {
  console.log('DummyJSON에서 상품을 받는 중…')
  const { products } = await fetchJson<{ products: DummyProduct[] }>(SOURCE_URL)

  // 한글 이름이 없는 카테고리(DummyJSON에 새로 생긴 것)는 영어 그대로 쓰고 알려 준다
  const unknown = [...new Set(products.map((p) => p.category))].filter((c) => !CATEGORY_KO[c])
  if (unknown.length) console.warn(`한글 이름이 없는 카테고리(영어 그대로 사용): ${unknown.join(', ')}`)

  console.log(`상품 ${products.length}개의 이미지 크기를 재는 중…`)
  const converted = await mapWithConcurrency(products, async (p): Promise<Product> => {
    const product: Product = {
      id: p.id,
      name: p.title,
      price: toKrw(p.price),
      category: CATEGORY_KO[p.category] ?? p.category,
      rating: p.rating,
      stock: p.stock,
    }
    const src = p.images[0]
    if (src) product.image = { src, ...(await measureImage(src)) }
    return product
  })

  const snapshot: ProductSnapshot = {
    source: SOURCE_URL,
    importedAt: new Date().toISOString(),
    krwPerUsd: KRW_PER_USD,
    products: converted.sort((a, b) => a.id - b.id),
  }
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  // 사람이 읽고 diff로 비교하기 좋게 들여쓰기 2칸
  await writeFile(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`)

  const categories = new Set(converted.map((p) => p.category)).size
  console.log(
    `저장했습니다: ${path.relative(process.cwd(), OUTPUT_FILE)} (상품 ${converted.length}개, 카테고리 ${categories}개)`,
  )
  console.log('DB에 넣으려면: npm run db:reset')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
