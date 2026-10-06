# Step 8. DB 연동 — Prisma + SQLite, 상품 관리(CRUD)

> 상태: 완료 (2026-10-04, 8-4 보강 2026-10-06)

## 목표
지금까지 상품 데이터는 코드 파일(`src/data/products.ts`)이었다. 바꾸려면 코드를 고쳐 다시 배포해야 한다. 실제 서비스는 데이터가 **DB**에 있고, 관리자가 화면에서 추가·수정·삭제한다.

- DB를 붙이고(Prisma + SQLite) 목 데이터를 옮긴다
- **`lib/products.ts` 안쪽만** DB로 바꾼다 — API 주소·응답 모양·화면 코드는 그대로 (Step 6~7에서 계층을 나눈 효과 확인)
- 관리 화면에서 상품을 만들고·고치고·지운다(CRUD) — Server Actions

## 세부 단계
- [x] **8-1** Prisma + SQLite 설치, 스키마·마이그레이션·시드, DB 클라이언트(`lib/db.ts`)
- [x] **8-2** 데이터 계층을 DB로 교체 (읽기). 교체 전후 API 결과 비교
- [x] **8-3** 상품 관리 화면 — Server Actions로 추가·수정·삭제, 입력값 검사, 캐시 갱신
- [x] **8-4** (보강) 실제 같은 상품 데이터 — DummyJSON 194개를 스냅샷으로 받아 시드, 외부 이미지 허용

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

---

## 8-2. 데이터 계층을 DB로 교체

### 바뀐 파일은 하나
`src/lib/products.ts` **한 파일만** 고쳤다. `getProducts`·`getCategories`·`getProduct`·`getProductIds`의 이름·인자·돌려주는 모양이 같아서 `page.tsx`, `app/api`, 화면 컴포넌트, 장바구니, TanStack Query 코드는 그대로다. Step 4-1에 "나중에 DB로 바꿀 때 이 파일 안쪽만 바꾼다"고 적어 둔 그대로 됐다.

### 걸러내기·정렬·나누기를 DB가 한다
| 하는 일 | 예전 (JS 배열) | 지금 (Prisma → SQL) |
|---|---|---|
| 거르기 | `filterProducts` (`filter`) | `where: { category, stock: { gt: 0 }, OR: [{ name: { contains } }, …] }` → `WHERE` |
| 정렬 | `sortProducts` (`sort`) | `orderBy: [{ price: 'asc' }, { id: 'asc' }]` → `ORDER BY` |
| 나누기 | `slice` | `skip`·`take` → `OFFSET`·`LIMIT` |
| 전체 개수 | `length` | `count({ where })` (목록과 `Promise.all`로 동시에) |
| 카테고리 | `new Set` | `groupBy({ by: ['category'], _min: { id } })` → `GROUP BY` |
| 하나 찾기 | `find` | `findUnique({ where: { id } })` |
- 예전 방식은 상품이 100만 개면 100만 개를 메모리에 올려 걸렀다. DB는 조건에 맞는 8개만 읽어 보낸다.
- `filterProducts`·`sortProducts`는 지우지 않았다 — MSW 목 핸들러(Storybook)가 계속 쓴다.

### 핵심 개념

**1. `toProduct` — DB 모양 → 화면 모양 통역**
DB 행(`imageSrc`·`imageWidth`·`imageHeight`·`createdAt`…) → 화면 `Product`(`image: { src, width, height }`). DB 전용 열은 내보내지 않는다. 화면이 DB 구조를 모르게 하는 경계다.

**2. 정렬이 같을 때의 순서까지 정한다**
가격이 같은 상품이 있으면 DB는 순서를 보장하지 않는다. 그러면 '더 보기'로 나눠 받을 때 같은 상품이 두 페이지에 나오거나 빠질 수 있다. → 항상 두 번째 기준으로 `id`를 붙인다(예전 JS 정렬이 원래 순서를 유지하던 결과와도 같아진다).

**3. 교체 전후를 '비교'로 확인한다**
"같아 보인다"가 아니라, 교체 **전에** API 응답 24가지를 파일로 저장해 두고 교체 **후** 같은 요청의 응답과 비교했다(키 순서만 무시한 완전 일치). 리팩터링·이전 작업에서 쓰는 방법.

**4. 정적 페이지는 DB가 바뀌어도 그대로다 (발견)**
DB의 가격을 직접 바꿔 보면 API·홈(요청마다 생성)은 바로 바뀌지만, 상세 페이지(`●` SSG, 빌드 때 생성)는 **옛 가격 그대로**다. 코드 파일이 데이터일 때는 데이터를 바꾸면 어차피 다시 빌드했으니 문제가 없었다. → 8-3에서 수정할 때 해당 페이지를 다시 만들게(`revalidatePath`) 한다.

### 확인 방법
```bash
npm run build && npx next start -p 3100
curl 'localhost:3100/api/products?sort=price-asc&size=50'
npm run db:studio      # 가격을 바꿔 보고 API·홈·상세 비교
```

검증 결과 (production 빌드, 2026-10-04)
- 교체 전후 비교 **24개 항목 중 다른 것 0개**: 목록 기본·2페이지·전부, 정렬 3종, 카테고리 2종, 검색(`무선`, `usb`/`USB` 대소문자, 앞뒤 공백, 결과 없음), 품절 숨기기, 없는 카테고리, `ids=3,1,999`, 상세 `1`·`3`·`12`·`999`(404)·`02`(404)·`abc`(404), 카테고리 목록 순서, 상세 HTML
- DB에서 2번 가격을 1,000원으로 바꾸면: API `1000`, 홈 HTML `₩1,000`, 상세 HTML `₩329,000`(정적, 옛 값) → 시드로 되돌림
- 화면 회귀: 첫 HTML 8개 + 더 보기, 첫 화면 요청 0, 더 보기·포커스·뒤로·필터 정상, 장바구니 요청·삭제·새 상품, axe 라이트·다크 0
- `tsc`·ESLint·Prettier 통과

---

## 8-3. 상품 관리 화면 — Server Actions로 추가·수정·삭제

### 화면
| 주소 | 내용 |
|---|---|
| `/admin/products` | 상품 표(번호·상품명·카테고리·가격·재고) + 행마다 수정·삭제, 위에 '상품 추가'. 저장 뒤 결과 문구(`?done=created\|updated\|deleted`) |
| `/admin/products/new` | 추가 폼 |
| `/admin/products/3/edit` | 수정 폼 (지금 값이 채워져 있음). 없는 id는 404 |

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/app/admin/layout.tsx` (새 파일) | 관리 화면 전체의 '열어도 되는지' 검사(요청마다 — `await connection()`). 막히면 StatusView 안내. `robots: noindex` |
| `src/lib/admin.ts` (새 파일) | `isAdminEnabled()` — 임시 규칙: 개발 모드는 열림, 배포 빌드는 `ADMIN_ENABLED=1`일 때만. Step 9에서 로그인 검사로 교체 |
| `src/app/admin/products/actions.ts` (새 파일) | Server Actions `createProductAction`·`updateProductAction`·`deleteProductAction`. 권한 검사 → 입력값 검사(zod) → DB → `revalidatePath` → `redirect` |
| `src/lib/productInput.ts` (새 파일) | 입력 규칙(`productInputSchema`, zod)과 칸별 에러 문구 변환(`toFieldErrors`). 빈 숫자 칸 처리, 조사 자동 선택(`가격을`/`재고를`) |
| `src/lib/products.ts` | 쓰기 함수 `createProduct`·`updateProduct`·`deleteProduct` 추가. 없는 상품(Prisma `P2025`)은 에러 대신 `undefined`/`false` |
| `src/app/admin/products/page.tsx`·`page.module.scss` (새 파일) | 관리 목록(표). 좁은 화면에서는 표만 가로 스크롤 |
| `src/app/admin/products/new/page.tsx`, `[id]/edit/page.tsx` (새 파일) | 추가·수정 페이지. 수정은 `updateProductAction.bind(null, id)` |
| `src/components/ProductForm.tsx`·`.module.scss`·`.stories.tsx` (새 파일) | `useActionState` 폼. 칸별 에러(`aria-invalid`·`aria-describedby`), 에러 요약(`role="alert"`), 첫 잘못된 칸 포커스, '저장 중…'(`aria-disabled`). 카테고리는 `datalist` |
| `src/components/DeleteProductButton.tsx` (새 파일) | `confirm`으로 한 번 더 묻고 `useTransition`으로 삭제 액션 실행 |
| `src/app/products/[id]/page.tsx` | `dynamicParams = true`(빌드 뒤 추가한 상품도 열리게), 없는 상품 탭 제목 |
| `src/styles/_tokens.scss`·`_themes.scss` | `$red` 팔레트, `--color-danger`(라이트 red-600 / 다크 red-400) |
| `package.json` | `zod`(dependencies) |

### 핵심 개념

**Server Action** — `'use server'` 파일의 async 함수. `<form action={함수}>`로 넣으면 제출할 때 서버에서 실행된다. API 주소와 fetch 코드를 직접 만들지 않아도 되고, JS가 아직 없어도 일반 폼 제출로 동작한다.
- 대신 **누구나 직접 호출할 수 있는 서버 입구**다. 화면(페이지)을 막아도 액션은 따로 호출된다 → 함수 안에서 ① 권한 ② 입력값을 반드시 다시 검사한다.
- 우리 화면의 폼에서 데이터를 바꿀 때는 Server Action, 외부에서 부르는 공개 API·브라우저가 읽는 데이터는 Route Handler(Step 6).

**입력값 검사는 서버에서 (zod)** — 브라우저 검사(`required`, `min`)는 개발자 도구로 지우거나 직접 요청하면 우회된다. 화면 검사 = 안내, 서버 검사 = 규칙. 폼은 `noValidate`로 브라우저 말풍선을 끄고 서버가 돌려준 문구를 칸 아래에 같은 모양으로 보여 준다.

**useActionState** (React 19) — `[state, formAction, isPending] = useActionState(액션, 처음 상태)`. 액션이 돌려준 값(에러)이 다음 state가 된다. React 19는 제출 뒤 폼을 초기화하므로, 에러일 때 입력값(`values`)을 돌려받아 다시 채운다.

**revalidatePath** — 저장한 뒤 그 데이터를 보여 주는 페이지의 캐시를 버린다. 8-2에서 발견한 '상세(●, 빌드 때 생성)가 옛 가격 그대로' 문제가 이것으로 해결된다. 다음 요청 때 새 데이터로 다시 만든다.

**bind로 id 묶기** — `updateProductAction.bind(null, 3)`: 첫 인자를 미리 채운 함수. 다만 이 값도 요청에 실려 오가므로 바꿔 보낼 수 있다 → 안전은 bind가 아니라 함수 안 권한 검사가 지킨다.

**권한 검사는 요청마다** — layout에 `await connection()`이 없으면 `/admin/products/new`처럼 요청 정보를 안 쓰는 페이지는 빌드 때 미리 만들어지고, 검사도 빌드 때 한 번만 돈다.

### 있었던 일
- layout에서 막힐 때 처음엔 `notFound()`를 썼는데 Next.js 16.3.6 버그(#99287)가 재현됨(빈 `<html id="__next_error__">`) → StatusView 안내로.
- 상세 `dynamicParams`를 true로 돌렸다. 지금 구성(같은 폴더의 `loading.tsx`)에서는 버그가 재현되지 않고 404 화면이 정상 HTML로 나온다. 대신 상태 코드는 200(soft 404, 스트리밍을 먼저 시작하므로). `noindex`가 붙어 검색에는 안 나온다. 진짜 404는 Step 9의 `proxy.ts`에서.
- 390px에서 관리 목록 페이지 전체가 510px로 늘어남 → 표 머리글의 `sr-only`(`position: absolute`)가 스크롤 상자를 빠져나간 것. `.tableWrap`에 `position: relative`.
- 폼을 거치지 않고 칸이 빠진 요청을 보내면 zod 기본 영어 문구가 나옴 → `z.string({ error })`. '재고을(를)' 같은 조사 → 받침으로 고르는 `withParticle`.

### 확인 방법
```bash
npm run dev                   # 개발 모드는 관리 화면이 열려 있다 → localhost:3000/admin/products
# 배포 빌드로 확인 (DB를 복사해 쓰면 개발 DB가 안전하다)
npm run build
cp prisma/dev.db /tmp/test.db
DATABASE_URL="file:/tmp/test.db" ADMIN_ENABLED=1 npx next start -p 3100
```

검증 결과 (production 빌드 + 복사한 DB, 2026-10-04)
- 추가: 빈 값·음수 가격 제출 → 요약 "입력값을 확인해 주세요 (3개)", 칸별 문구 3개, 첫 칸 포커스, 입력값 유지 → 올바른 값 → 목록으로 이동 + "상품을 추가했습니다." + 13행
- 빌드 뒤 추가한 상품 상세 `/products/15` 200 + 이미지 없는 화면, API 카테고리 검색에도 나옴
- 수정: 2번 가격 1,000원 → 상세(●) `₩329,000` → `₩1,000` (**revalidatePath로 갱신**) → 되돌림
- 삭제: 확인 창 취소 → 그대로, 확인 → "상품을 삭제했습니다." + 12행, 그 상세는 404 화면(`lang="ko"`, 상태 200)
- 없는 상품 수정 주소 404, 390px 페이지 가로 넘침 없음(표만 스크롤)
- `ADMIN_ENABLED` 없이: 관리 페이지 3개 모두 안내 화면. **액션 직접 호출**(curl): 추가 → "권한이 없습니다", 삭제 → 거부(500), DB 변화 없음
- axe: 관리 목록·폼 에러 상태·새 상품 상세 라이트/다크 0. Storybook 63개 스토리 렌더링 + axe 라이트/다크 0
- `tsc`·ESLint·Stylelint·Prettier 통과

---

## 8-4. 실제 같은 상품 데이터 — DummyJSON 194개 (보강, 2026-10-06)

### 왜?
상품 12개로는 '더 보기'(8개씩)가 한 번이면 끝나고, 카테고리·검색·정렬도 실감이 안 난다. 실제 쇼핑몰처럼 **사진·가격·평점·재고가 제각각인 상품 수백 개**로 화면을 확인한다.
- 데이터 출처: [DummyJSON](https://dummyjson.com) — 개발·학습용 공개 API. 키·가입 없이 GET으로 받는다. 회사 네트워크에서 접속 확인(이미지 CDN 포함).
- **화면·API·데이터 계층 코드는 한 줄도 안 바꿨다.** 바뀐 것은 DB에 넣는 데이터(시드)와 외부 이미지 허용 설정뿐 — 8-2의 계층 분리가 다시 효과를 냈다.

### 흐름
```
(데이터를 새로 받고 싶을 때만, 인터넷 필요)
npm run data:import   DummyJSON ──▶ 변환(원화·한글 카테고리·이미지 크기) ──▶ prisma/data/dummyjson-products.json (커밋)

(DB 채우기, 네트워크 불필요)
npm run db:seed       JSON 파일 ──▶ 상품 테이블 비우고 194개 넣기
SEED_DATA=mock npm run db:seed    예전 목 데이터 12개로
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `prisma/import-dummyjson.ts` (새 파일) | DummyJSON에서 받아 우리 `Product` 모양으로 변환해 JSON으로 저장. 이미지마다 실제 크기를 잰다(sharp, 8개씩 동시에) |
| `prisma/data/dummyjson-products.json` (새 파일) | 변환 결과 스냅샷(194개, 64KB). 출처·받은 시각·환율을 함께 기록 |
| `prisma/seed.ts` | 데이터 묶음 선택(`SEED_DATA`), upsert → **비우고 한꺼번에 넣기**(`$transaction([deleteMany, createMany])`) |
| `next.config.ts` | `images.remotePatterns`에 `cdn.dummyjson.com/product-images/**`만 허용 |
| `package.json` | `data:import` 명령 |

### 변환 규칙 (외부 모양 → 우리 모양)
| DummyJSON | 우리 | 규칙 |
|---|---|---|
| `title` | `name` | 그대로 (영어 상품명) |
| `price` (달러, 9.99) | `price` (원, 14,000) | × 1,400원, 100원 단위 반올림. 환율은 고정값 |
| `category` (`home-decoration`) | `category` (`홈 데코`) | 24개 한글 표. 표에 없는 새 카테고리는 영어 그대로 + 경고 |
| `rating`, `stock` | 그대로 | 품절(재고 0) 4개, 품절 임박(5개 이하) 13개 |
| `images[0]` | `image { src, width, height }` | 크기는 직접 잼 → 모두 1000×1000 |
| `description`, `brand`, `reviews` … | (버림) | 스키마에 없는 필드. 필요해지면 `schema.prisma`에 열 추가 |

### 핵심 개념

**1. 외부 데이터는 '통역'해서 들인다**
남의 API 모양을 그대로 쓰면 그 API가 바뀔 때 우리 화면 곳곳이 깨진다. 들어오는 입구(`import-dummyjson.ts`) 한 곳에서 우리 모양으로 바꾸면, 나머지 코드는 출처를 모른다. (`lib/products.ts`의 `toProduct`가 DB 모양을 통역하는 것과 같은 생각)

**2. 스냅샷 — 외부 데이터를 파일로 고정**
시드할 때마다 외부 API를 부르면 네트워크가 없거나 API 내용이 바뀌었을 때 결과가 달라진다. 한 번 받아 JSON으로 커밋해 두면 누가 언제 시드해도 같고, 데이터가 바뀌면 Git diff로 보인다.

**3. 외부 이미지와 `next/image` — `remotePatterns`**
- `next/image`는 원본을 **우리 서버가 받아** 화면 크기에 맞게 줄이고 WebP 등으로 바꿔 보낸다. 1000px 원본(62KB) → 카드용 약 7.6KB.
- 아무 주소나 허용하면 남이 우리 서버로 아무 이미지나 변환시키는 데 악용할 수 있다 → 호스트·경로를 좁게 적는다. 허용 안 된 주소는 400.

**4. 시드는 '처음 상태로 되돌리기'**
데이터 묶음을 바꿀 수 있게 되면서 upsert만으로는 이전 묶음이 남는다(194개 → mock 12개로 바꿔도 13~194번이 남음). 그래서 비우고 넣고, 둘을 트랜잭션으로 묶어 중간에 실패해도 빈 DB가 남지 않게 했다. 관리 화면에서 고친 내용도 시드하면 사라진다.

### 있었던 일
- `npm run db:reset`은 Prisma가 AI 도구 실행을 감지하면 사용자 동의를 요구한다(DB 전체 초기화라서). 스키마는 그대로이고 시드가 테이블을 비우므로 `npm run db:seed`로 충분했다.
- 이미지 크기를 재려고 받은 원본은 194개 11MB, 8개씩 동시에 받아 약 3초.

### 확인 방법
```bash
npm run db:seed          # "DummyJSON (… 받음) — 상품 194개를 넣었습니다."
npm run build            # 상세 페이지 194개를 미리 만든다 (Generating static pages 202/202)
npm run start
```
1. 홈: 사진이 나오고 '총 194개의 상품', '더 보기 (8 / 194)'
2. 카테고리 '스마트폰', 검색 `apple`(상품명이 영어라 영어로 검색), 가격 높은순(자동차가 맨 앞)
3. 상품 상세 `/products/100` (Apple Airpods), 없는 상품 `/products/195` → 404 화면
4. 개발자 도구 Network: 이미지가 `/_next/image?url=https://cdn.dummyjson.com/...`로, WebP 몇 KB

검증 결과 (production 빌드 + headless Chrome, 2026-10-06)
- 시드: DummyJSON 194개 ↔ `SEED_DATA=mock` 12개 ↔ 다시 194개 전환 정상
- 빌드: 정적 페이지 202개(상세 194개 포함)
- 이미지 최적화: 직접 요청 200 `image/webp` 7.6KB, 허용 안 된 호스트 400. 브라우저 이미지 응답 43개 모두 200
- 홈 카드 8개·칩 25개·'더 보기 (8 / 194)', '스마트폰' → iPhone들, `apple` → 8개, 가격 높은순 1위 Durango SXT RWD ₩51,800,000
- 상세 100 제목·이동 경로(전체 상품 / 모바일 액세서리 / Apple Airpods)·사진, 195 → 404 화면
- axe 홈·상세 라이트/다크 0, 콘솔 에러 0
- `tsc`·ESLint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- **카테고리 칩 25개**: 모바일(390px)에서 칩 영역이 약 286px라 첫 상품이 화면 아래로 밀린다. 데스크톱도 3줄. → 모바일은 가로 스크롤 한 줄 또는 `<select>`, 데스크톱은 '더 보기' 접기 등 화면 개선 필요
- 상품명이 영어라 한글 검색('무선')은 결과가 없다. 영어로 검색한다.
- 브라우저에 저장된 예전 장바구니(1~12번)는 이제 다른 상품을 가리킨다. 불러올 때 재고에 맞게 정리되지만, 헷갈리면 장바구니를 비운다.
- 상품 설명(`description`)은 버렸다. 상세 화면에 설명을 넣으려면 스키마에 열을 추가(마이그레이션)하고 import·화면을 고친다.
