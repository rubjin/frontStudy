# Step 9. 인증과 주문 — Better Auth, 보호된 페이지, 주문하기

> 상태: 진행 중 (9-1 완료)

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
- [ ] **9-2** 권한: 관리자 역할, 임시 권한(`lib/admin.ts`) → 로그인 검사, `proxy.ts`로 보호된 주소
- [ ] **9-3** 주문: 주문하기(서버에서 재고·가격 재확인, 재고 차감), 주문 완료, 내 주문 목록
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
- 관리 화면은 아직 임시 스위치(`lib/admin.ts`) → 9-2에서 로그인·역할 검사로
- 장바구니는 아직 브라우저에만 있다(로그인과 무관) → 9-3 주문 때 서버로 보낸다
