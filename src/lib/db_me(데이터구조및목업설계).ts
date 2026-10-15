import 'server-only'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// DB 클라이언트 — 서버 코드는 이 prisma 하나로 DB를 읽고 쓴다 (Step 8-1)
//
// Prisma란? (ORM: 객체 ↔ DB 테이블 연결 도구)
// - SQL 문자열(SELECT * FROM Product WHERE category = '오디오') 대신
//   prisma.product.findMany({ where: { category: '오디오' } }) 처럼 TypeScript로 쓴다.
// - 스키마(prisma/schema.prisma)에서 만든 타입이 붙어 있어 필드 이름을 틀리면 바로 에러가 난다.
//
// 드라이버 어댑터(Prisma 7): Prisma가 DB에 직접 붙지 않고, Node.js용 DB 드라이버(better-sqlite3)를 통해 붙는다.
// Postgres로 바꿀 때(Step 11)는 이 어댑터만 바꾸면 된다.
//
// 왜 globalThis에 담아 두나? (개발 모드 전용)
// - npm run dev는 파일을 고칠 때마다 모듈을 다시 불러온다(Hot Reload). 그때마다 new PrismaClient()를 하면
//   DB 연결이 계속 늘어난다. 한 번 만든 것을 전역 객체에 보관해 다시 쓴다.
// - 배포(production)에서는 모듈을 한 번만 불러오므로 필요 없다.
//
// import 'server-only': DB 접근은 서버에서만. 브라우저 코드에서 import하면 빌드 에러 (6-1과 같은 안전장치)

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL 환경 변수가 없습니다. (.env 확인)')
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
