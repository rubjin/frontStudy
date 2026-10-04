import { defineConfig, env } from 'prisma/config'

// Prisma CLI 설정 (Step 8-1) — npx prisma ... 명령이 읽는 파일
//
// Prisma 7부터 접속 주소·마이그레이션 폴더·시드 명령을 schema.prisma가 아니라 이 파일에 적는다.
//
// 환경 변수 불러오기: Prisma CLI는 .env를 스스로 읽지 않는다(Next.js는 읽는다).
// Node.js 내장 process.loadEnvFile()로 .env를 읽는다 — 별도 패키지(dotenv)가 필요 없다.
// .env.local(개인 설정)이 있으면 그것을 먼저 읽는다. 이미 정해진 값은 덮어쓰지 않으므로 앞에서 읽은 것이 이긴다.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch {
    // 파일이 없으면 건너뛴다
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // npx prisma db seed (npm run db:seed) 가 실행할 명령 — 목 데이터를 DB에 넣는다
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // env(): 환경 변수가 없으면 알아보기 쉬운 에러로 알려 준다
    url: env('DATABASE_URL'),
  },
})
