# Step 9. 인증과 주문 — Better Auth, 보호된 페이지, 주문하기

> 상태: 진행 중 (9-1, 9-2, 9-3 완료)

## 목표
지금까지 Shoppr에는 "누구"라는 개념이 없었다. 장바구니는 브라우저에만 있고, 관리 화면은 임시 스위치(`lib/admin.ts`)로 열고 닫았다.
- 회원가입·로그인·로그아웃 (9-1)
- 관리자만 관리 화면에, 로그인한 사람만 주문·내 주문에 (9-2)
- 장바구니 → 주문하기: 서버에서 재고·가격을 다시 확인하고 재고를 줄인다 (9-3)

### 인증 방식 선택 — Better Auth
| 후보 | 판단 |
|---|---|
| **Better Auth 1.7** (선택) | 정식판. Next 16·React 19·Prisma 7 지원. 이메일/비밀번호 기본 제공. Next.js 공식 문서의 인증 라이브러리 목록 첫 번째 |
| Auth.js(NextAuth) v5 | 아직 베타(`5.0.0-beta.32`). 이메일/비밀번호 로그인을 공식적으로 권하지 않는다(GitHub·Google 위주) |
| 직접 구현 (Next 공식 가이드) | bcrypt + jose 세션 쿠키 + DAL. 원리는 가장 잘 배우지만 가이드 스스로 "교육용, 실무는 라이브러리 권장" |

로그인은 작은 실수가 바로 보안 사고가 되는 영역이라, 검증된 라이브러리를 쓰고 **원리(쿠키·해시·세션)는 이해해서 설명할 수 있게** 하는 쪽을 택했다.

## 세부 단계
- [x] **9-1** 로그인 기본: Better Auth 설치, 사용자·세션 테이블, 회원가입·로그인·로그아웃, 헤더 로그인 상태
- [x] **9-2** 권한: 관리자 역할, 임시 권한(`lib/admin.ts`) → 로그인 검사(DAL `lib/session.ts`), `proxy.ts`로 보호된 주소
- [x] **9-3** 주문: 주문하기(서버에서 재고·가격 재확인, 재고 차감 트랜잭션), 주문 완료, 내 주문 목록
- [ ] **9-4** 마무리: 테스트 계정 시드, 접근성 점검, 문서

---

## 9-1. 로그인 기본 — Better Auth

### 구조
```
[회원가입·로그인]  /signup, /login  (app/(auth)/)
   AuthForm ──제출──▶ Server Action (app/(auth)/actions.ts)
                        zod 검사(lib/authInput.ts) → auth.api.signUpEmail / signInEmail (lib/auth.ts)
                        → DB: User·Account(비밀번호 해시)·Session 기록 → 응답에 로그인 쿠키 → redirect(?next)

[헤더 로그인 상태]  모든 페이지
   UserMenu ('use client') ──GET /api/auth/get-session──▶ app/api/auth/[...all]/route.ts → lib/auth.ts → DB(Session)
            ──POST /api/auth/sign-out──▶ (로그아웃: Session 행 삭제 + 쿠키 삭제)
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `prisma/schema.prisma` | `User`·`Session`·`Account`·`Verification` 모델 추가 (Better Auth 1.7 기본 스키마와 같은 필드) |
| `prisma/migrations/…_add_auth/` (새) | 위 테이블을 만드는 SQL |
| `src/lib/auth.ts` (새) | Better Auth 설정(서버 전용): Prisma 어댑터, 이메일/비밀번호(8~128자, 가입 즉시 로그인), `nextCookies` 플러그인 |
| `src/app/api/auth/[...all]/route.ts` (새) | `/api/auth/*` 전부를 Better Auth에 넘김 (`toNextJsHandler`) |
| `src/lib/auth-client.ts` (새) | 브라우저용 `authClient` (`useSession`, `signOut`) |
| `src/lib/authInput.ts` (새) | 가입·로그인 zod 규칙(한글 문구), `safeRedirectPath`(오픈 리다이렉트 방지) |
| `src/lib/fieldErrors.ts` (새) | zod 에러 → 칸별 문구. `productInput.ts`에 있던 것을 공통으로 |
| `src/app/(auth)/` (새) | 라우트 그룹: `layout.tsx`(가운데 좁은 칸), `login/page.tsx`, `signup/page.tsx`, `actions.ts`(Server Actions) |
| `src/components/AuthForm.tsx` (+stories, 새) | 가입·로그인 폼. ProductForm과 같은 구조(`useActionState`, 칸별 에러·요약·첫 칸 포커스) |
| `src/components/ui/Form.module.scss` | `ProductForm.module.scss`를 옮김 — 상품 폼과 로그인 폼이 같이 쓰는 폼 스타일 |
| `src/components/UserMenu.tsx` (+scss, stories, 새) | 헤더의 로그인 상태: 확인 중(회색 자리) / 로그인 링크 / 이름 + 로그아웃 |
| `src/components/Header.tsx` | `UserMenu` 추가 |
| `src/mocks/handlers.ts` | Storybook용 `/api/auth/get-session` 핸들러(기본 로그아웃, `authSignedIn`, `authLoading`) |
| `.env` | `BETTER_AUTH_URL`(사이트 주소, 비밀 아님) |
| `.env.local` (커밋 안 함) | `BETTER_AUTH_SECRET`(비밀 키) |
| `package.json` | `better-auth`, `db:migrate`가 마이그레이션 뒤 `prisma generate`까지 |

### 핵심 개념

**1. 로그인이 실제로 하는 일 — 데이터베이스 세션**
1. 가입: 비밀번호를 **해시**(되돌릴 수 없는 값, `scrypt`)로 바꿔 `Account.password`에 저장. 원래 비밀번호는 어디에도 남지 않는다.
2. 로그인: 입력한 비밀번호를 같은 방식으로 해시해 저장된 값과 비교 → 맞으면 `Session` 행을 만들고, 그 행의 `token`을 **쿠키**로 브라우저에 준다.
3. 이후 요청: 브라우저가 쿠키를 자동으로 보낸다 → 서버가 token으로 `Session`을 찾아 "누구"인지 안다.
4. 로그아웃: `Session` 행을 지우고 쿠키를 지운다 → 그 token은 즉시 쓸모없어진다.

**2. 로그인 쿠키의 안전장치** (확인한 실제 값)
| 속성 | 값 | 뜻 |
|---|---|---|
| `httpOnly` | true | 자바스크립트(`document.cookie`)로 읽을 수 없다 → 악성 스크립트(XSS)가 훔쳐 가기 어렵다 |
| `SameSite` | Lax | 다른 사이트에서 몰래 보낸 요청(CSRF)에는 쿠키가 실리지 않는다 |
| `Secure` | 배포(HTTPS) 때 true | 암호화된 연결에서만 보낸다 (지금은 http://localhost라 false) |
| 유효 기간 | 7일 | 지나면 다시 로그인 |

**3. 비밀 키(`BETTER_AUTH_SECRET`)는 커밋하지 않는다**
- 쿠키 서명·암호화에 쓰는 값. 새면 남이 로그인 쿠키를 위조할 수 있다 → `.env.local`(`.gitignore`)에만.
- 개발 모드는 키가 없어도 기본값으로 돌지만, **배포 모드(`next start`)는 키가 없으면 멈춘다**.
- 새 PC에서는 `.env.local`을 만들고 키를 새로 만든다 (파일 안 주석의 명령).

**4. 회원가입·로그인은 Server Action으로**
- 8-3 상품 폼과 같은 순서: 입력값 → zod 검사(한글 문구) → Better Auth(`auth.api.signUpEmail`) → `redirect`.
- `nextCookies` 플러그인이 Server Action 응답에 로그인 쿠키를 실어 준다.
- 에러 때 입력값을 다시 채워 주지만 **비밀번호는 돌려주지 않는다**(돌려준 값은 HTML에 들어가기 때문).
- `redirect()`는 에러를 던지는 방식이라 `try` **밖**에 둔다(안에 두면 `catch`에 잡힌다).

**5. 에러 문구로 정보를 흘리지 않기**
- 로그인 실패는 "이메일 **또는** 비밀번호가 올바르지 않습니다." — 어느 쪽이 틀렸는지 알려 주면 "이 이메일은 가입되어 있다"를 남이 알아낼 수 있다.
- 가입의 "이미 가입된 이메일입니다"는 그 정보를 알려 주는 셈이지만, 사용자에게 꼭 필요한 안내라 많은 서비스가 이렇게 한다. (막으려면 이메일 인증 메일을 보내는 방식이 필요 — 메일 서버가 있어야 한다)

**6. 오픈 리다이렉트 막기 — `?next=`**
로그인 뒤 돌아갈 주소(`/login?next=/cart`)를 그대로 `redirect`하면 `?next=https://가짜사이트.com`으로 사용자를 피싱 사이트에 보낼 수 있다. `safeRedirectPath`가 `/`로 시작하고 `//`로 시작하지 않는 주소만 허용한다. (확인: `?next=//evil.example.com` → 홈으로)

**7. 헤더의 로그인 상태는 브라우저에서 — 미리 만든 페이지를 지키기**
- 헤더는 모든 페이지에 있다. 서버에서 쿠키를 읽으면(`headers()`) 모든 페이지가 요청마다 만들어져, 미리 만든 상품 상세 194개(●)가 사라진다.
- 로그인 여부는 사람마다 달라 미리 만들 수 없다 → 페이지는 모두에게 같은 HTML, 사람마다 다른 부분만 브라우저에서 채운다. (장바구니 배지와 같은 방식)
- 확인 중(`isPending`)에는 버튼 크기의 회색 자리 — '로그인' 버튼이 먼저 보이면 로그인한 사람에게 잘못된 정보가 번쩍인다. (5-3의 '모름'과 '비어 있음' 구분)
- 로그인은 서버(Server Action)에서 일어나 브라우저의 `useSession`이 모른다 → 로그인·가입 페이지를 떠날 때 `refetch()`.
- 빌드 결과: 상세는 그대로 `●`, `/login`·`/signup`만 `ƒ`(쿠키를 읽어 이미 로그인했으면 돌려보내므로).

**8. 라우트 그룹 `(auth)`**
`/login`, `/signup`이 같은 틀(가운데 480px)을 쓰므로 `(auth)/layout.tsx` 하나로 감쌌다. 괄호 폴더라 주소에는 안 나타난다(4-3a `(catalog)`와 같은 방식).

### 있었던 일
- **폼을 제출하면 서버 에러** (`Prisma schema mismatch — Missing tables user, session…`)
  - Better Auth는 시작할 때 '생성된 Prisma 클라이언트'에 필요한 모델이 있는지 검사한다. DB에는 테이블이 생겼는데 클라이언트(`src/generated/prisma`)는 옛것(상품만)이었다.
  - 원인: **Prisma 7부터 `prisma migrate dev`가 클라이언트를 자동으로 다시 만들지 않는다.** `npm run db:generate` 후 해결.
  - 재발 방지: `npm run db:migrate`를 `prisma migrate dev && prisma generate`로 바꿨다.
- **npm 설치 때 lock 파일 잡음**: 이 PC의 npm 11.1은 `package-lock.json`에서 `libc` 정보를 지운다(192줄). 패키지를 새로 추가할 때는 `npx -y npm@11.21.0 install <패키지>`로 설치해 깨끗한 변경만 남겼다(npm 12는 이 PC의 Node 22.13을 지원하지 않음).
- 스키마 생성 CLI(`npx auth generate`)는 우리 `lib/auth.ts`를 불러오는데, 그 안의 `server-only` 파일 때문에 Next.js 밖에서 실패한다 → Better Auth 패키지의 테이블 정의(`@better-auth/core/dist/db/get-tables.mjs`)를 보고 모델을 직접 옮겼다.

### 확인 방법
```bash
# .env.local에 BETTER_AUTH_SECRET이 있어야 한다 (파일 안 주석 참고)
npm run db:migrate        # 새 PC면 db:setup
npm run build && npm run start
```
1. 헤더 '로그인' → '회원가입' → 빈 칸 제출 → 칸별 문구 4개, 첫 칸 포커스
2. 올바르게 가입 → 홈으로 이동, 헤더에 '이름님 · 로그아웃'
3. 로그아웃 → "로그아웃했습니다." 토스트, 포커스가 '로그인' 링크로
4. 틀린 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다."
5. 개발자 도구 Application → Cookies: `better-auth.session_token`이 HttpOnly
6. `npm run db:studio` → `Account.password`가 해시(긴 무작위 문자열)인지

검증 결과 (production 빌드 + DB 복사본 + headless Chrome, 2026-10-09)
- 빌드: 상세 `●` 유지, `/login`·`/signup`·`/api/auth/[...all]` `ƒ`
- 빈 가입 → 요약 "(4개)" + 칸별 4개, 포커스 `name` / 잘못된 이메일·짧은 비밀번호·불일치 → 3개, 포커스 `email`, 이름·이메일 값 유지·비밀번호 칸 비움
- 가입(`Tester@Example.com`) → `/`, 헤더 "테스터님 · 로그아웃", DB 이메일 소문자 저장, 비밀번호 해시 161자(원문 없음), 쿠키 `HttpOnly`·`SameSite=Lax`·7일
- 로그인 상태로 `/login` → `/`로 돌려보냄
- 로그아웃(상세 페이지에서) → 토스트, 포커스 '로그인' 링크(`/login?next=/products/5`)
- 중복 이메일 가입 → "이미 가입된 이메일입니다." / 틀린 비밀번호 → 공통 문구
- `?next=/cart` 로그인 → `/cart` / `?next=//evil.example.com` → 숨은 칸 값 `/`, 도착 `/`
- 390px 헤더: 이름 숨김, 로그아웃만
- axe 가입 에러·로그인 실패 화면 라이트/다크 0, 콘솔 에러 0
- Storybook 71개(새 스토리 AuthForm 4·UserMenu 3·Header 1) × 라이트/다크 렌더링 정상, axe 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 이메일 인증·비밀번호 재설정 없음 (메일 서버 필요). 같은 이메일 중복 가입 시 '이미 가입됨'을 알려 준다.
- ~~관리 화면은 아직 임시 스위치(`lib/admin.ts`)~~ → 9-2에서 로그인·역할 검사로
- ~~장바구니는 아직 브라우저에만 있다~~ → 9-3에서 주문할 때 상품 id·수량을 서버로 보낸다 (장바구니 자체는 여전히 브라우저에)

---

## 9-2. 권한 — 관리자 역할, 세션 확인 한 곳에(DAL), `proxy.ts`

### 왜?
8-3의 관리 화면은 임시 스위치(`lib/admin.ts`: 개발 모드이거나 `ADMIN_ENABLED=1`이면 **누구에게나** 열림)였다. 이제 로그인이 생겼으니 **"관리자로 로그인한 사람만"**으로 바꾼다.

### 검사가 세 겹인 이유
```
요청 /admin/products/5/edit
 ① proxy.ts          로그인 쿠키가 '있는지'만 (DB 조회 없음, 빠름)   없으면 → /login?next=/admin/products/5/edit
 ② admin/layout.tsx  세션이 진짜인지(DB) + 관리자인지                 아니면 → 로그인 페이지 / 403 안내
 ③ actions.ts        Server Action 안에서 다시 관리자인지              아니면 → "권한이 없습니다"
```
- ①은 **빠른 문지기**: 로그인 안 한 대부분의 사람을 페이지를 그리기 전에 돌려보낸다. 쿠키가 있어도 만료·위조일 수 있으니 이것만 믿으면 안 된다.
- ②는 **페이지 보호**: 화면(관리 데이터)이 나가기 전에 진짜로 확인.
- ③은 **기능 보호**: Server Action은 화면과 상관없이 직접 호출할 수 있다(8-3). 화면을 막아도 함수 안에서 다시 검사해야 한다.
- ②③은 같은 함수(`lib/session.ts`)를 쓴다 — Next.js 문서가 말하는 **데이터 접근 계층(DAL)**: 권한 검사를 한 곳에 모아 빠뜨리거나 다르게 짜지 않게.

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `prisma/schema.prisma` + 마이그레이션 `add_user_role` | `User.role` (`'user'` 기본, `'admin'`) |
| `src/lib/auth.ts` | `user.additionalFields.role` — `input: false`(가입 요청으로 정할 수 없음) |
| `src/lib/session.ts` (새) | DAL: `getSession`(요청 안에서 `cache`), `isAdmin`, `loginPath`, `requireSession`, `canManageProducts` |
| `src/proxy.ts` (새) | `/admin/:path*`에서 로그인 쿠키가 없으면 `/login?next=원래 주소` |
| `src/app/admin/layout.tsx` | 임시 스위치 → 세션·역할 확인. 로그인 안 함 → 로그인 페이지, 관리자 아님 → 403 안내 |
| `src/app/admin/products/actions.ts` | `isAdminEnabled()` → `await canManageProducts()` |
| `src/lib/admin.ts` | **삭제** (`ADMIN_ENABLED` 환경 변수도 더 이상 쓰지 않음) |
| `prisma/make-admin.ts` (새) | `npm run auth:make-admin -- 이메일 [--revoke]` — 관리자 지정·해제 |
| `src/lib/auth-client.ts` | `inferAdditionalFields<typeof auth>()` — 브라우저에서도 `session.user.role` 타입 |
| `src/components/UserMenu.tsx` (+stories) | 관리자에게만 '관리' 링크 |
| `src/mocks/handlers.ts` | `signedInAs()`로 정리, `authSignedInAdmin` |
| `package.json` | `auth:make-admin`, `db:migrate` 정리(`postdb:migrate`로 generate) |

### 핵심 개념

**1. 인증(Authentication)과 인가(Authorization)**
| | 인증 (9-1) | 인가 (9-2) |
|---|---|---|
| 질문 | 누구인가? | 이 사람이 이걸 해도 되나? |
| 방법 | 이메일·비밀번호 → 세션 | 세션의 `role`을 보고 판단 |
| 실패하면 | 로그인 페이지로 | 403 "관리자만 이용할 수 있습니다" |

로그인 안 한 사람을 403 화면에 두면 "로그인하면 되나?"를 모르고, 로그인한 일반 회원을 로그인 페이지로 보내면 이미 로그인했는데 어리둥절하다 → 둘을 다르게 안내한다.

**2. 사용자가 역할을 정할 수 없게 — `input: false`**
가입 요청은 누구나 만들어 보낼 수 있다(브라우저 개발자 도구, curl). `role`을 입력으로 받으면 `{"role":"admin"}`을 끼워 넣어 관리자로 가입할 수 있다. `input: false`면 보내도 무시된다. (확인: 가입 API에 `role: "admin"` → 저장된 값 `user`)

**3. 첫 관리자는 명령으로**
'관리자 지정' 화면은 그 화면을 쓸 관리자가 이미 있어야 한다. 첫 관리자는 서버(DB)에 접근할 수 있는 사람만 만들 수 있어야 하므로 명령(`npm run auth:make-admin`)으로. 역할은 요청마다 DB에서 읽으므로 다시 로그인하지 않아도 다음 요청부터 바뀐다.

**4. `proxy.ts` — Next.js 16의 middleware**
- `src/proxy.ts`(app과 같은 위치)에 `proxy` 함수를 내보내면, `matcher`에 맞는 요청에서 페이지보다 먼저 실행된다.
- `matcher`로 범위를 좁힌다. 없으면 이미지·CSS 요청까지 모두 검사한다.
- 쿠키만 보는 검사라 DB가 필요 없고 빠르다. 대신 진짜 검사가 아니다(Better Auth 문서: "THIS IS NOT SECURE!").
- 레이아웃은 지금 주소를 몰라 `?next`를 관리 목록으로만 주지만, proxy는 요청 주소를 알아서 **원래 페이지로 정확히** 돌려보낸다.

**5. 메뉴 숨기기는 보안이 아니다**
헤더의 '관리' 링크는 관리자에게만 보이지만, 이건 편의다. 주소를 직접 쳐도 ①②가 막고, 폼을 손에 넣어도 ③이 막는다.

**6. `cache()` — 한 요청 안에서 세션 조회 한 번**
레이아웃·페이지·컴포넌트가 각각 `getSession()`을 불러도 같은 요청 안에서는 결과를 재사용한다(React `cache`). 다음 요청에서는 새로 조회한다.

### 있었던 일
- **마이그레이션이 5분 넘게 멈춤 → "database is locked"**
  - 9-1에서 `db:migrate`를 `prisma migrate dev && prisma generate`로 바꿨는데, `npm run db:migrate -- --name add_user_role`의 `--name`이 **뒤의 `generate`로** 넘어갔다. 이름이 없는 `migrate dev`는 이름을 묻는 입력을 기다리며 멈췄고, 그 프로세스가 DB를 잠갔다.
  - 해결: 멈춘 프로세스를 끄고, `"db:migrate": "prisma migrate dev"` + `"postdb:migrate": "prisma generate"`로 나눴다. npm은 `post이름` 스크립트를 자동으로 이어서 실행하고, `--` 뒤 옵션은 `migrate dev`로 간다.

### 확인 방법
```bash
npm run db:migrate                                  # 새 PC면 db:setup
npm run build && npm run start
# /signup으로 관리자로 쓸 계정을 가입한 뒤
npm run auth:make-admin -- 그이메일@example.com
```
1. 로그아웃 상태로 `/admin/products/5/edit` → `/login?next=/admin/products/5/edit` → 관리자로 로그인 → 그 수정 페이지
2. 일반 회원으로 로그인 → `/admin/products` → "관리자만 이용할 수 있습니다"(403), 헤더에 '관리' 링크 없음
3. 관리자로 로그인 → 헤더 '관리' 링크 → 상품 관리 표
4. `npm run auth:make-admin -- 이메일 --revoke` → 새로고침하면 403

검증 결과 (production 빌드 + DB 복사본 + curl·headless Chrome, 2026-10-09)
- 빌드: 상세 `●` 유지, `ƒ Proxy (Middleware)`, 관리 페이지 `ƒ`
- 쿠키 없음: `/admin/products` → 307 `/login?next=%2Fadmin%2Fproducts`, `/admin/products/5/edit` → 307 `next=%2Fadmin%2Fproducts%2F5%2Fedit`, `/products/5` → 200(proxy 대상 아님)
- 가짜 쿠키 → 307 로그인 페이지
- 가입 API에 `"role":"admin"` → 저장 `user`
- 일반 회원: 헤더에 '관리' 없음, `/admin/products` → 403 안내(axe 라이트/다크 0)
- `auth:make-admin` → 헤더에 '관리', `/admin/products` 표 194행 / `--revoke` → 다시 403
- **관리 폼을 연 채 쿠키를 일반 회원 것으로 바꿔 제출 → "상품을 관리할 권한이 없습니다."** (Server Action 자체 검사)
- 로그아웃 상태 수정 페이지 → 로그인 → 같은 수정 페이지로 복귀
- 콘솔 에러 0, Storybook 72개(새 `SignedInAdmin`) × 라이트/다크 정상·axe 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 관리자 지정 화면 없음(명령으로만). 관리자 여러 명·세부 권한(상품만, 주문만)은 Better Auth `admin` 플러그인이나 권한 표로 확장할 수 있다.
- 403 안내는 상태 코드 200 + noindex (`forbidden()`은 아직 실험 기능, `notFound()`는 16.3.6 버그)
- 9-3: 주문하기·내 주문 목록 — `proxy.ts` matcher와 `requireSession`을 주문 페이지에도 쓴다

---

## 9-3. 주문 — 서버에서 재고·가격 재확인, 재고 차감, 내 주문

### 흐름
```
/cart  CheckoutButton ('주문하기')
  로그아웃이면 → /login?next=/cart
  placeOrderAction([{ productId, quantity }])        ← 가격은 보내지 않는다
    ① 로그인 확인 (lib/session.ts)
    ② 입력 검사 (lib/orderInput.ts — zod, 같은 상품 합치기)
    ③ lib/orders.ts placeOrder — 한 트랜잭션
         DB에서 지금 가격·재고 읽기 → 모자라면 아무것도 안 바꾸고 problems
         재고 차감 (조건부: stock >= 수량) → 주문 + 주문 상품(스냅숏) 만들기
    ④ revalidatePath (홈, 관리 목록, 그 상품 상세, 내 주문)
  ok       → 장바구니 비우기 → 상품 캐시 무효화 → /orders/번호?placed=1
  problems → 상품별 이유 목록 + 장바구니에 지금 재고 안내
/orders           내 주문 목록 (내 것만)
/orders/[id]      주문 상세 (내 것이 아니면 '찾을 수 없음')
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `prisma/schema.prisma` + 마이그레이션 `add_orders` | `Order`(사용자·총액·일시), `OrderItem`(주문 당시 이름·가격·사진 스냅숏, 상품 삭제 시 `productId` null) |
| `src/types/order.ts` (새) | `Order`, `OrderLine`, `OrderProblem` |
| `src/lib/orderInput.ts` (새) | 주문 입력 zod 규칙(최대 50종·수량 1~99), `mergeOrderLines` |
| `src/lib/orders.ts` (새, 서버 전용) | `placeOrder`(트랜잭션), `getMyOrders`, `getMyOrder`(내 주문만) |
| `src/app/orders/actions.ts` (새) | `placeOrderAction` — 로그인 → 검사 → 주문 → revalidate, 결과를 돌려줌(redirect 안 함) |
| `src/app/orders/page.tsx`, `[id]/page.tsx` (새) | 내 주문 목록 / 주문 상세(주문 완료 안내 겸용). `requireSession` |
| `src/components/CheckoutButton.tsx` (+scss, stories, 새) | 주문하기 버튼: 로그인 여부, 주문 중, 결과 처리, 실패 목록(`role="alert"`) |
| `src/components/OrderList.tsx`·`OrderDetail.tsx` (+scss, `Orders.stories.tsx`, 새) | 주문 목록·상세 화면 (서버 컴포넌트, 데이터는 props) |
| `src/components/CartContents.tsx` | `placeOrder` props → CheckoutButton. 재고보다 많이 담긴 줄 안내("수량을 줄여 주세요", "품절 — 삭제해 주세요") |
| `src/app/cart/page.tsx` | 서버 페이지가 Server Action을 props로 넘김 |
| `src/components/CartProvider.tsx` | `clear()` — 주문 뒤 장바구니 비우기 |
| `src/components/UserMenu.tsx`·`.module.scss` | '내 주문' 링크, 버튼 글자 한 줄(`nowrap`) |
| `src/components/Header.module.scss` | 640px 미만에서 로고 글자 'Shoppr'를 화면에서만 숨김(sr-only) |
| `src/proxy.ts` | matcher에 `/orders/:path*` |
| `src/lib/format.ts` | `formatDateTime` (서울 시간) |
| `src/mocks/handlers.ts` | `authSignedOut` |

### 핵심 개념

**1. 장바구니는 '지금 가격', 주문은 '그때 가격' — 스냅숏**
| | 장바구니 (Step 5) | 주문 (9-3) |
|---|---|---|
| 저장 | 상품 id·수량만 | 이름·가격·사진을 **복사** |
| 가격이 바뀌면 | 장바구니도 새 가격 | 주문은 그대로 (영수증) |
| 상품이 삭제되면 | 장바구니에서 빠짐 | 기록은 남음, 링크만 사라짐("판매 종료") |

**2. 브라우저가 보낸 가격은 믿지 않는다**
주문 요청에는 `productId`와 `quantity`만 있다. 가격을 보내게 하면 개발자 도구로 1원으로 바꿔 보낼 수 있다. 총액은 서버가 **DB 가격**으로 계산한다. (확인: 총액 2,248,400원 = DB 가격 1,120,000×2 + 2,800×3)

**3. 트랜잭션 — 전부 되거나 전부 안 되거나**
"재고 차감"과 "주문 만들기" 중 하나만 성공하면 안 된다(재고만 사라지거나, 재고를 안 줄인 주문이 생김). `prisma.$transaction(async (tx) => …)` 안의 작업은 함수가 끝까지 성공해야 확정되고, 중간에 에러가 나면 전부 취소된다. 상품 하나라도 재고가 모자라면 다른 상품의 재고도 줄지 않는다.

**4. 동시에 마지막 1개를 주문하면? — 조건부 차감**
"재고 확인"과 "재고 차감" 사이에 다른 주문이 끼어들 수 있다(경쟁 상태). 그래서 차감할 때 조건을 함께 건다:
```ts
tx.product.updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })
// 조건에 안 맞으면 0줄 → 그 사이 재고가 줄었다는 뜻 → 에러를 던져 트랜잭션 전체 취소
```
DB가 "확인하고 줄이기"를 한 번에 하므로 재고가 음수가 될 수 없다.

**5. 남의 주문을 볼 수 없게 — IDOR 막기**
주문 번호는 1, 2, 3 … 이라 짐작하기 쉽다. 번호만으로 찾으면 `/orders/1`을 넣어 남의 주문을 볼 수 있다(흔한 보안 실수, IDOR). `getMyOrder(내 id, 번호)`는 **내 주문 중에서만** 찾고, 남의 주문이면 없는 주문과 **똑같이** 안내한다('남의 것'이라고 알려 주면 그 번호의 주문이 있다는 게 드러난다).

**6. Server Action을 props로 넘기기**
`CartContents`('use client')가 `app/orders/actions.ts`를 직접 import하면 Storybook에서 서버 전용 코드(`server-only`)를 불러오다 깨진다. 서버 페이지(`cart/page.tsx`)가 `placeOrderAction`을 props로 넘기고, 스토리는 가짜 함수를 넘긴다 — 성공·재고 부족·주문 중을 서버 없이 재현할 수 있다.

**7. redirect 대신 결과 돌려주기**
주문이 성공하면 브라우저가 할 일이 있다: 장바구니 비우기(localStorage), 상품 캐시 무효화(재고가 줄었으므로). 액션에서 바로 redirect하면 그럴 틈이 없다 → `{ status: 'ok', orderId }`를 받아 화면이 정리하고 이동한다.

### 있었던 일
- **좁은 화면 헤더가 깨짐**: 관리자로 로그인하면 '내 주문·관리·로그아웃'이 늘어나 360px에서 '내/주/문'이 한 글자씩 세로로 꺾였다(가로 넘침은 없어 넘침 검사로는 못 잡고 스크린샷으로 발견). → 버튼 글자 `nowrap` + 640px 미만에서 로고 글자 숨김(sr-only라 로고 링크 이름은 유지). 320px까지 한 줄 확인.
- **품절된 줄의 안내가 "재고 0개까지"**: 주문하려다 재고가 바뀐 걸 알게 된 경우를 위해 "품절 — 삭제해 주세요", "재고 N개 — 수량을 줄여 주세요"로 상황별 문구.
- 테스트 스크립트에서 DB를 고칠 때 셸 따옴표(`"Order"` 표 이름) 문제로 실패 → 셸을 거치지 않는 `execFileSync`로.

### 확인 방법
```bash
npm run db:migrate && npm run build && npm run start
```
1. 로그아웃 상태로 상품을 담고 `/cart` → '로그인하고 주문하기' → 로그인 → 장바구니로 돌아옴 → '주문하기'
2. '주문 완료' 화면: 안내 문구, 주문 번호·일시, 상품·수량·총액. 헤더 장바구니 배지가 사라짐
3. 상품 상세에서 재고가 줄었는지 (재고 5개 이하면 "품절 임박 · N개 남음")
4. '내 주문' → 목록에 방금 주문
5. 다른 계정으로 로그인해 `/orders/1` → "주문을 찾을 수 없습니다"
6. 재고 부족: `npm run db:studio`로 담은 상품의 재고를 줄인 뒤 '주문하기' → 상품별 이유 목록, 재고·주문 수 그대로

검증 결과 (production 빌드 + DB 복사본 + headless Chrome, 2026-10-13)
- 로그아웃: `/orders` → `/login?next=%2Forders`, 장바구니 '로그인하고 주문하기' → `/login?next=%2Fcart`
- 주문 성공: `/orders/1?placed=1` "주문 완료" + 안내, 총액 ₩2,248,400(DB 가격 계산), 장바구니 비워짐, DB 재고 7→5·8→5, 상세(●) "품절 임박 · 5개 남음"으로 갱신, 내 주문 목록 1건
- 그 사이 재고 1·품절로 바꾸고 주문 → "Wooden Bathroom Sink With Mirror: 재고가 1개 남았습니다." / "Apple: 품절되었습니다.", **DB 재고·주문 수 그대로**(트랜잭션 취소), 장바구니 안내 "재고 1개 — 수량을 줄여 주세요" / "품절 — 삭제해 주세요"
- 다른 계정으로 남의 주문 `/orders/1` → "주문을 찾을 수 없습니다", `/orders/abc`도 같음
- 헤더: 관리자 320·360·390px 한 줄(버튼 높이 36 동일), 가로 넘침 없음, 1280px 로고 글자 보임
- axe 주문 완료·내 주문·실패 안내 라이트/다크 0, 콘솔 에러 0
- Storybook 81개(새 CheckoutButton 4·Orders 5) × 라이트/다크 렌더링 정상·axe 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 결제 없음 — 주문 접수까지만 ("결제 없이 주문만 접수됩니다" 안내). 실제로는 결제(PG) 성공 뒤 주문 확정, 실패 시 재고 되돌리기가 필요하다.
- 주문 취소·배송 상태 없음 (`Order`에 `status`를 더하고 취소 시 재고를 되돌리는 트랜잭션)
- 장바구니는 여전히 브라우저(localStorage)에만 — 다른 기기에서 로그인하면 장바구니가 따라오지 않는다
- 동시 주문(마지막 1개를 두 사람이 동시에)은 조건부 차감으로 막도록 짰지만, 실제 동시 요청으로는 시험하지 않았다 → Step 10 테스트에서
