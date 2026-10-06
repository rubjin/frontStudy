import { spawn } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Prisma Studio 실행 — npm run db:studio (Step 8-4 보강)
//
// 왜 `prisma studio`를 바로 실행하지 않나? — Prisma 7.10 Studio의 버그 우회
// - Studio는 DB 주소에서 종류(프로토콜)를 '://' 앞부분으로 알아낸다.
//   우리 주소 file:./prisma/dev.db 에는 '://'가 없어서 주소 전체를 종류 이름으로 보고
//   "Prisma Studio is not supported for the "file:./prisma/dev.db" protocol." 에러를 낸다.
// - 그렇다고 file://./prisma/dev.db 로 쓰면 Studio가 '//' 뒤를 절대 경로로 읽어 엉뚱한 곳(C:\prisma\dev.db)에
//   빈 DB를 새로 만든다. 상대 경로는 쓸 수 없다.
// - 그래서 이 스크립트가 .env의 DATABASE_URL을 '절대 경로 주소'(file:///C:/.../prisma/dev.db)로 바꿔서 --url로 넘긴다.
//   (마이그레이션·시드·사이트는 원래 주소 그대로 잘 동작하므로 .env는 바꾸지 않는다)
// - Prisma를 올릴 때 `npx prisma studio`가 그냥 되는지 다시 확인하고, 되면 package.json을 원래대로 돌린다.
//
// 추가 옵션은 그대로 넘어간다. 예) npm run db:studio -- --port 5556 --browser none

// .env.local → .env 순서로 읽는다 (prisma.config.ts와 같은 방식, 앞에서 읽은 값이 이긴다)
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch {
    // 파일이 없으면 건너뛴다
  }
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL 환경 변수가 없습니다. (.env 확인)')

// file: 로 시작하는 SQLite 주소만 바꾼다. Postgres 등(postgresql://...)은 '://'가 있어 그대로 동작한다
let studioUrl = databaseUrl
if (databaseUrl.startsWith('file:') && !databaseUrl.startsWith('file://')) {
  // 상대 경로는 프로젝트 루트 기준 (npm 명령은 항상 루트에서 실행된다)
  const absolutePath = path.resolve(process.cwd(), databaseUrl.slice('file:'.length))
  // pathToFileURL: C:\Users\...\dev.db → file:///C:/Users/.../dev.db (한글·공백은 %인코딩)
  // decodeURI: Studio는 주소의 경로를 그대로 파일 경로로 쓰므로 %인코딩을 풀어 둔다
  studioUrl = decodeURI(pathToFileURL(absolutePath).href)
}

// 설치된 prisma CLI를 지금 Node로 직접 실행한다 (셸을 거치지 않아 경로에 공백이 있어도 안전)
const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js')
const child = spawn(process.execPath, [prismaCli, 'studio', '--url', studioUrl, ...process.argv.slice(2)], {
  stdio: 'inherit',
})
child.on('exit', (code) => process.exit(code ?? 0))
