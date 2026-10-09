import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// 관리자 지정·해제 — npm run auth:make-admin -- 이메일 [--revoke] (Step 9-2)
//
// 예) npm run auth:make-admin -- admin@example.com          → 관리자로
//     npm run auth:make-admin -- admin@example.com --revoke → 일반 회원으로
//
// 왜 화면이 아니라 명령으로 하나?
// - 회원가입은 누구나 할 수 있고, 가입하면 항상 'user'다 (lib/auth.ts의 role input: false).
// - '관리자로 만들기' 화면을 두려면 그 화면을 쓸 '첫 관리자'가 이미 있어야 한다. 첫 관리자는 서버에 접근할 수 있는 사람만
//   만들 수 있어야 하므로, DB에 직접 쓰는 이 명령으로 한다. (실무에서도 첫 관리자는 보통 이렇게 만든다)
// - 먼저 /signup으로 그 이메일로 가입해 두고 실행한다.
//
// 바뀐 역할은 다음 요청부터 적용된다(세션은 그대로, role은 요청마다 DB에서 읽음).
// lib/db.ts를 쓰지 않는 이유는 seed.ts와 같다 ('server-only'라 Next.js 밖에서 실행할 수 없다)

// .env.local → .env 순서로 읽는다 (prisma.config.ts와 같은 방식. 이미 정해진 값은 덮어쓰지 않아 앞에서 읽은 것이 이긴다)
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch {
    // 파일이 없으면 건너뛴다
  }
}

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL 환경 변수가 없습니다. (.env 확인)')

const [email, flag] = process.argv.slice(2)
if (!email) {
  console.error('사용법: npm run auth:make-admin -- 이메일 [--revoke]')
  process.exit(1)
}
const role = flag === '--revoke' ? 'user' : 'admin'

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

async function main() {
  // 가입할 때 이메일을 소문자로 저장하므로(lib/authInput.ts) 찾을 때도 소문자로
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!user) {
    console.error(`${email} 로 가입한 사용자가 없습니다. 먼저 /signup 에서 가입해 주세요.`)
    process.exitCode = 1
    return
  }
  await prisma.user.update({ where: { id: user.id }, data: { role } })
  console.log(`${user.email} (${user.name}) → ${role === 'admin' ? '관리자' : '일반 회원'}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
