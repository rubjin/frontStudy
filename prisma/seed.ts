import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { products } from '../src/data/products'

// 시드(seed) — 빈 DB에 처음 넣을 데이터 (Step 8-1)
//
// 실행: npm run db:seed (prisma.config.ts의 migrations.seed 명령 = tsx prisma/seed.ts)
//      npm run db:reset 하면 DB를 지우고 마이그레이션 → 시드까지 다시 한다
//
// Step 1부터 쓰던 목 데이터(src/data/products.ts)를 그대로 DB에 옮긴다.
// → 화면에 보이는 상품이 Step 7까지와 똑같아야 한다(8-2에서 API 결과를 비교).
//
// 여러 번 실행해도 같은 결과(멱등): upsert = 있으면 고치고(update) 없으면 만든다(create).
// id를 목 데이터와 같게 넣어서 /products/3 같은 주소가 그대로 유지된다.
//
// lib/db.ts를 쓰지 않는 이유: 그 파일은 'server-only'(Next.js 전용 표시)라 Next.js 밖(tsx)에서 실행하면 에러가 난다.

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL 환경 변수가 없습니다. (.env 확인)')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

async function main() {
  for (const { id, image, ...fields } of products) {
    // 화면 타입의 image { src, width, height } → DB 열 세 개
    const data = {
      ...fields,
      imageSrc: image?.src ?? null,
      imageWidth: image?.width ?? null,
      imageHeight: image?.height ?? null,
    }
    await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`상품 ${products.length}개를 넣었습니다.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
