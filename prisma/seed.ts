import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { products as mockProducts } from '../src/data/products'
import type { Product } from '../src/types/product'
import type { ProductSnapshot } from './import-dummyjson'

// 시드(seed) — 빈 DB에 처음 넣을 데이터 (Step 8-1, 8-4에서 실제 같은 데이터로)
//
// 실행: npm run db:seed (prisma.config.ts의 migrations.seed 명령 = tsx prisma/seed.ts)
//      npm run db:reset 하면 DB를 지우고 마이그레이션 → 시드까지 다시 한다
//
// 어떤 데이터를 넣나? — 환경 변수 SEED_DATA
// - 기본(dummyjson): prisma/data/dummyjson-products.json — DummyJSON 상품 194개 (Step 8-4, import-dummyjson.ts가 만든 파일)
// - SEED_DATA=mock: src/data/products.ts — Step 1부터 쓰던 목 데이터 12개 (예전 화면과 비교할 때)
//   예) SEED_DATA=mock npm run db:reset
// 시드는 네트워크를 쓰지 않는다. 외부 데이터는 미리 받아 둔 JSON 파일에서 읽는다.
//
// 넣는 방법: 지우고 → 한꺼번에 넣기 (트랜잭션)
// - 8-1에서는 upsert(있으면 고치고 없으면 만들기)였다. 데이터 묶음을 바꿀 수 있게 되면서(194개 ↔ 12개)
//   upsert만 하면 이전 묶음의 상품이 남는다(mock으로 돌아가도 13~194번이 남음). 그래서 먼저 비운다.
// - $transaction: 두 작업을 '전부 성공하거나 전부 취소'로 묶는다. 넣다가 실패해도 DB가 빈 채로 남지 않는다.
// - 관리 화면에서 추가·수정한 상품도 지워진다. 시드 = '처음 상태로 되돌리기'다.
// - id를 데이터와 같게 넣어서 /products/3 같은 주소가 데이터 파일의 상품과 일치한다.
//
// lib/db.ts를 쓰지 않는 이유: 그 파일은 'server-only'(Next.js 전용 표시)라 Next.js 밖(tsx)에서 실행하면 에러가 난다.

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL 환경 변수가 없습니다. (.env 확인)')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

const SNAPSHOT_FILE = path.join(process.cwd(), 'prisma', 'data', 'dummyjson-products.json')

function loadProducts(): { label: string; products: Product[] } {
  if (process.env.SEED_DATA === 'mock') return { label: '목 데이터', products: mockProducts }
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8')) as ProductSnapshot
  return { label: `DummyJSON (${snapshot.importedAt.slice(0, 10)} 받음)`, products: snapshot.products }
}

async function main() {
  const { label, products } = loadProducts()

  // 화면 타입의 image { src, width, height } → DB 열 세 개
  const rows = products.map(({ image, ...fields }) => ({
    ...fields,
    imageSrc: image?.src ?? null,
    imageWidth: image?.width ?? null,
    imageHeight: image?.height ?? null,
  }))

  await prisma.$transaction([prisma.product.deleteMany(), prisma.product.createMany({ data: rows })])
  console.log(`${label} — 상품 ${rows.length}개를 넣었습니다.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
