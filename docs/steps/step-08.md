# Step 8. DB 연동 — Prisma + SQLite, 상품 관리(CRUD)

> 상태: 진행 중 (8-1 완료)

## 목표
지금까지 상품 데이터는 코드 파일(`src/data/products.ts`)이었다. 바꾸려면 코드를 고쳐 다시 배포해야 한다. 실제 서비스는 데이터가 **DB**에 있고, 관리자가 화면에서 추가·수정·삭제한다.

- DB를 붙이고(Prisma + SQLite) 목 데이터를 옮긴다
- **`lib/products.ts` 안쪽만** DB로 바꾼다 — API 주소·응답 모양·화면 코드는 그대로 (Step 6~7에서 계층을 나눈 효과 확인)
- 관리 화면에서 상품을 만들고·고치고·지운다(CRUD) — Server Actions

## 세부 단계
- [x] **8-1** Prisma + SQLite 설치, 스키마·마이그레이션·시드, DB 클라이언트(`lib/db.ts`)
- [ ] **8-2** 데이터 계층을 DB로 교체 (읽기). 교체 전후 API 결과 비교
- [ ] **8-3** 상품 관리 화면 — Server Actions로 추가·수정·삭제, 입력값 검사, 캐시 갱신

---

## 8-1. Prisma + SQLite 설정

### 용어
| 용어 | 뜻 |
|---|---|
| DB(데이터베이스) | 데이터를 표(테이블)로 저장하는 프로그램. 행 = 상품 하나, 열 = 이름·가격… |
| SQLite | 파일 하나(`prisma/dev.db`)로 된 DB. 서버 설치가 필요 없어 개발·학습용으로 좋다 |
| ORM (Prisma) | SQL 대신 TypeScript 객체로 DB를 다루는 도구. `prisma.product.findMany({ where: { category: '오디오' } })` |
| 스키마 | 테이블 설계도 (`prisma/schema.prisma`) |
| 마이그레이션 | 스키마 변경을 SQL 파일로 기록하고 DB에 적용하는 것. 기록이 커밋되므로 모두의 DB가 같은 모양이 된다 |
| 시드 | 빈 DB에 처음 넣는 데이터 |

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `prisma/schema.prisma` (새 파일) | `Product` 모델: id(자동 증가)·name·price(정수)·category(색인)·rating·stock·imageSrc/Width/Height(없어도 됨)·createdAt·updatedAt |
| `prisma/migrations/2026…_init/migration.sql` (생성) | `CREATE TABLE "Product" …` — 스키마에서 만든 SQL. 커밋한다 |
| `prisma.config.ts` (새 파일) | Prisma 7 CLI 설정: 스키마·마이그레이션 폴더·시드 명령·접속 주소. `.env.local` → `.env` 순서로 읽음(Node 내장 `process.loadEnvFile`) |
| `prisma/seed.ts` (새 파일) | 목 데이터 12개를 `upsert`(있으면 수정, 없으면 생성)로 넣음 — 여러 번 실행해도 같은 결과, id 그대로 |
| `src/lib/db.ts` (새 파일) | `prisma` 클라이언트 하나. 드라이버 어댑터(`better-sqlite3`), 개발 모드에서는 전역에 보관(Hot Reload 때 연결이 늘지 않게), `server-only` |
| `.env` (새 파일, 커밋) | `DATABASE_URL="file:./prisma/dev.db"` — 비밀이 아닌 기본값만. 비밀은 `.env.local`(커밋 안 됨) |
| `package.json` | `prisma`(dev)·`@prisma/client`·`@prisma/adapter-better-sqlite3`·`tsx`(dev). 스크립트 `postinstall`(클라이언트 생성), `db:migrate`·`db:seed`·`db:setup`·`db:reset`·`db:studio` |
| `.gitignore` | `/src/generated/`(생성된 클라이언트), `/prisma/*.db`(DB 파일) |
| `eslint.config.mjs` | `src/generated/**` 제외 |

### 명령 정리
| 명령 | 언제 |
|---|---|
| `npm run db:setup` | **새로 받은 작업 폴더에서 한 번** — 마이그레이션 적용 + 시드 |
| `npm run db:migrate` | `schema.prisma`를 고친 뒤 — 마이그레이션 파일 생성·적용 (이름을 물어본다) |
| `npm run db:seed` | 목 데이터 다시 넣기 |
| `npm run db:reset` | DB를 지우고 처음부터(마이그레이션 + 시드) |
| `npm run db:studio` | 브라우저에서 DB 표 보기·고치기 (Prisma Studio) |
| `npm run db:generate` | 생성된 클라이언트만 다시 만들기 (`npm install` 때 자동) |

### 핵심 개념

**1. 스키마 → 마이그레이션 → 클라이언트**
`schema.prisma`를 고치고 `db:migrate`를 실행하면 ① 변경을 SQL로 만든 파일이 `prisma/migrations/`에 생기고 ② DB에 적용된다. `db:generate`가 스키마에 맞는 **타입 있는 클라이언트**를 `src/generated/prisma`에 만든다 — `prisma.product.findMany()`의 결과 타입이 자동으로 정해진다.

**2. 화면 타입과 DB 모양은 다를 수 있다**
화면은 `image: { src, width, height }` 객체를 쓰지만 DB는 열 세 개(`imageSrc`·`imageWidth`·`imageHeight`)로 저장한다. 둘을 잇는 변환은 데이터 계층(8-2의 `toProduct`)에 둔다. 화면 코드는 DB 모양을 모른다.

**3. 돈은 정수**
`price Int`. 소수(Float)는 0.1 + 0.2 = 0.30000000000000004 같은 오차가 있다. 원 단위는 정수로 충분하다.

**4. `.env` vs `.env.local`**
`.env`(커밋): 비밀이 아닌 기본값 — 저장소를 받으면 바로 실행된다. `.env.local`(커밋 안 됨): 비밀 값·개인 설정, `.env`보다 우선. Next.js는 둘 다 자동으로 읽고, Prisma CLI는 `prisma.config.ts`에서 읽게 했다.

**5. Prisma 7에서 달라진 점**
- 클라이언트가 `node_modules`가 아니라 지정한 폴더(`src/generated/prisma`)에 생성된다 → `import { PrismaClient } from '@/generated/prisma/client'`
- DB 접속은 **드라이버 어댑터**(`PrismaBetterSqlite3`)를 통해. Postgres로 바꿀 때 어댑터만 바꾼다
- 설정은 `prisma.config.ts`, `migrate dev`가 클라이언트 생성·시드를 자동으로 하지 않는다

### 설치 중 있었던 일
- `npm view prisma version`의 latest 태그가 RC(`8.0.0-rc.19`)였다 → `@prisma/client`와 같은 **안정 버전 7.10.0**으로 고정
- `prisma init`이 요청하지 않은 AI 도구용 파일(`.claude/skills`, `.windsurf/`, `.agents/`, `skills-lock.json`)과 `prisma7.config.ts`, 영문 `.env`까지 만들었다 → 모두 지우고 필요한 파일만 직접 작성
- npm 11의 "install scripts not yet covered by allowScripts" 경고가 나오지만, `better-sqlite3`는 동작 확인, Prisma 엔진도 준비됨(`npx prisma --version`)

### 확인 방법
```bash
npm run db:setup          # 또는 처음 만들 때 npm run db:migrate
npm run db:studio         # 브라우저에서 Product 표에 12행
```

검증 결과 (2026-10-04)
- `migrate dev --name init` → `CREATE TABLE "Product"` + `CREATE INDEX "Product_category_idx"`
- 시드 → 12행(id 1~12, 이미지 경로 포함). 한 번 더 실행해도 12행(멱등)
- `tsc`·ESLint·Prettier 통과. 아직 화면은 목 데이터 그대로(8-2에서 교체)
