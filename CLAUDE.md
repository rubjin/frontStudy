# frontStudy — 프론트엔드 전향 포트폴리오

## 배경
- 사용자는 **웹 퍼블리셔**이고, AI 확산으로 퍼블리셔 구인이 줄어 **프론트엔드 개발자로 전향**하려고 포트폴리오를 만드는 중이다.
- 목표: 마크업·CSS 강점에 **React 상태 관리 → API 연동 → 간단한 백엔드 → 배포**까지 보여 주는 포트폴리오를 완성한다.
- 방식: 계획을 스텝으로 나누고 **한 스텝씩 같이 진행**한다. 스텝이 끝날 때마다 커밋·push해서 Codespace가 바뀌어도 작업이 남게 한다.

## Claude 작업 규칙
- 설명은 한국어로, 퍼블리셔 관점에서 이해하기 쉽게 한다. 새 개념은 "왜 필요한지"부터 설명한다.
- 한 번에 다 만들지 말고, 사용자가 직접 따라 해 볼 수 있는 크기로 나눈다.
- **코드에는 주석을 상세히 단다.** 파일 맨 위에 역할과 몇 번째 스텝에서 만들었는지, props 설명, 새로 나온 문법·개념이 왜 필요한지를 적는다.
- **스텝마다 설명 문서를 `docs/steps/step-NN.md`로 남긴다.** 목표, 한 일, 파일별 설명, 핵심 개념, 확인 방법을 적는다. 세부 단계가 끝날 때마다 갱신한다.
- 스텝이 끝나면 이 파일의 **진행 상황**을 갱신한다.
- push는 사용자에게 확인받은 뒤에 한다.

## 브랜치
- `main`: Step 1~3-3 학습 진행분.
- **`cloude`**: 2026-09-30부터 AI 연동 작업(Jev·Qwen·Gemini)은 이 브랜치에서만 한다. 작업 전 `git branch --show-current`로 확인.

## AI 연동 (cloude 브랜치)
- **무료 모델만 사용 (2026-09-30 사용자 결정).** `models.ts`의 `isFreeModel()`(`:free` 또는 `openrouter/free`)이 false인 모델은 앱·스크립트 어디서도 호출하지 않는다. Jev는 유료라 꺼짐(`reason: 'paid'`). 무료 한도: 분당 약 20회·하루 약 50회
- 현재 무료 모델: 대체 해석 `qwen/qwen3.8-27b:free` → `nvidia/nemotron-3-super-120b-a12b:free`, 리뷰 Qwen3.8 27B + `cohere/north-mini-code:free`. 실측: 유료 대비 느리고(4~6초) 가끔 형식 오류
- 구조: Claude Code·Gemini·Qwen은 코드를 쓰고, **TypeSafe Jev**(판단 전용 모델: choice/score/noul + confidence)는 작업 분배·위험도·검색 의도를 판단한다. 아키텍처: https://claude.ai/code/artifact/a726702d-e2f3-4c58-8dcc-a55ae3fafce3 , 설명 `docs/ai/`
- `src/lib/ai/jev.ts`: `askJev()` 서버 전용(`import 'server-only'`). OpenRouter 경유(baseURL `https://openrouter.ai/api`, 모델 `typesafe/jev-1.13`). 확신도 문턱 `CONFIDENCE.AUTO=0.85`, `CONFIRM=0.6`
- 키 없음·`AI_MOCK=1`·연결 실패 시 예외 대신 **확신도 0인 가짜 응답**(`source: 'mock'`, `reason`) → 항상 fallback. 가짜 답이 실제 판단처럼 쓰이면 안 된다
- 키: `OPENROUTER_API_KEY`는 `.env.local`(gitignore)에만. 채팅·코드·커밋에 키를 적지 않는다. 사용자는 OpenRouter 키 보유(2026-09-30)
- 확인: `npm run check:ai`(Jev + 모델 6개, 원인 구분), 개발 페이지 `/dev/jev`(production 404). 네트워크가 막히면 Codespaces(Secrets에 키 등록)에서 확인. 사용자는 회사 네트워크 설정을 확인하기 어렵다고 함
- 모델 목록은 `src/lib/ai/models.ts` 한 곳(앱·스크립트 공용). 무료 목록은 OpenRouter `/api/v1/models`에서 가격 0인 것을 직접 조회해 고른다(검색 결과는 출처마다 다름). 모델 ID를 추측하지 말고 `npm run check:ai`로 확인
- `src/lib/ai/llm.ts` `askLlmJson()`: OpenRouter `models` 자동 대체 + JSON 스키마 강제 + `validate` 재검사. **LLM 결과는 자동 적용하지 않고 사용자 확인만**. 추론 모델은 대체 목록에 넣지 않음(max_tokens 300). 제한 시간 8초(6초는 실측 실패)
- `npm run review:ai`: Jev 위험도 + GLM·Kimi 교차 리뷰(비용 출력, 직접 실행만). AI 리뷰 지적은 코드와 대조한 뒤 반영
- 스크립트에서 네트워크 사용 후 `process.exit()` 금지(Windows 충돌, 종료 코드 127) → `process.exitCode`
- 2026-09-30 이후 이 PC에서 OpenRouter 연결됨(처음엔 SSL 차단). 사용자 `.env.local`에 키 있음
- 서버 전용 TS 파일 단독 실행 확인: `npx -y tsx --conditions=react-server <파일.mts>` (최상위 await 대신 async 함수)

## 프로젝트
- 이름: **Shoppr** (상품 목록 쇼핑몰 UI)
- 스택: **Next.js 16 (App Router) + React 19 + TypeScript**
  - 스타일: **SCSS Module** (`*.module.scss`) + 디자인 토큰. Tailwind는 3-2에서 제거
    - `src/styles/`: `_functions.scss`(`to-rem`), `_tokens.scss`(색상표·`space()`·글자·둥글기·브레이크포인트), `_mixins.scss`(`mq`·`text`·`focus-ring`·`sr-only`·`container`), `_themes.scss`(라이트/다크 CSS 변수), `globals.scss`
    - 컴포넌트 SCSS 첫 줄은 `@use 'styles' as *;` (`next.config.ts`의 `sassOptions.loadPaths`에 `src` 등록. `'@/styles'`는 Sass에서 안 됨)
    - 크기는 시안 px를 `to-rem(px)`(SCSS, `_functions.scss`) / `toRem(px)`(TS, `lib/units.ts`)로 적는다. rem을 직접 계산해 쓰지 않는다. 4px 간격 체계 값은 `space(n)`. 테두리·그림자·blur·브레이크포인트는 px 유지
    - 색은 반드시 테마 변수 `var(--color-...)`만 쓴다. 팔레트(`$gray` 등)는 `_themes.scss`에서만 사용
    - 여러 클래스 조합은 `clsx`. 상태 스타일은 가능하면 aria 속성 선택자(`[aria-pressed='true']`)
  - 다크 모드: `<html data-theme="dark">` + localStorage(`lib/theme.ts`). `<head>`의 `themeInitScript`로 깜빡임 방지. 아이콘·버튼 이름은 CSS로 전환(ThemeToggle)
  - 이미지: `next/image`. 샘플은 `public/images/products/{id}.jpg`(크기·비율 제각각, sharp로 생성. 실제 사진으로 교체할 때는 같은 파일 이름 + `products.ts`의 width/height 수정). 카드는 `fill` + `sizes` + `object-fit: cover`, 첫 줄만 `loading="eager"`(`priority`는 16에서 폐지 예정). `images.localPatterns`로 `/images/**`만 허용
  - 폰트: Pretendard dynamic subset (`pretendard` 패키지 CSS를 layout에서 import). `_fonts.scss`의 `'Pretendard Fallback'`(맑은 고딕 + `size-adjust`, 실측값)으로 폰트 교체 때 레이아웃 이동 방지. 폰트 스택은 `fonts.$font-family-base`
  - 컴포넌트 문서화: **Storybook 10** (`@storybook/nextjs-vite`). `npm run storybook`(6006) / `npm run build-storybook`
    - `.storybook/main.ts`: Sass loadPaths를 Next 설정과 같게(`viteFinal`), `staticDirs: public` / `preview.tsx`: 전역 CSS·폰트, `withThemeByDataAttribute`(html data-theme), `autodocs`, `a11y: { test: 'todo' }`
    - 스토리는 컴포넌트 옆 `*.stories.tsx`. 제어 컴포넌트는 `useArgs`로 조작 가능하게. 새 컴포넌트를 만들면 스토리도 만든다
    - 확인: 빌드 후 정적 서버 + 헤드리스 Chrome으로 모든 스토리 렌더링 + axe 검사(라이트/다크). 첫 로딩이 느리니 고정 대기 대신 렌더 완료를 기다릴 것
- 구조
  - `src/app/` — 파일 기반 라우팅. `layout.tsx`(공통 틀·Header), `page.tsx`("/"), `products/[id]/page.tsx`(상세), `not-found.tsx`(404), `error.tsx`(실행 에러), `global-error.tsx`(레이아웃 에러), `dev/skeleton/`(개발용 스켈레톤 미리보기, production에서 404)
  - `src/components/ui/` — 기능과 무관한 기본 부품. Button(`Button`=`<button>` / `ButtonLink`=`<a>`, `variant`·`size`), Skeleton(스켈레톤 조각)
  - `src/components/` — Header(서버 컴포넌트), ThemeToggle(`'use client'`), ProductCatalog(목록 화면·상태, `'use client'`), StatusView(404·에러 공통 화면), BackButton(이전 페이지로), CardSkeleton·CatalogSkeleton(로딩 스켈레톤, `page.tsx`의 Suspense fallback), SearchBar, CategoryFilter, SortSelect, SoldOutToggle, CardGrid, Card, icons
  - `src/lib/` — format, filterProducts, sortProducts (순수 함수), site(`SITE_NAME`, `formatTitle`) / `src/data/products.ts` (목 데이터) / `src/types/` (공통 타입)
  - import는 `@/` 별칭(= `src/`) 사용
- 원칙: `page.tsx`·`layout.tsx`는 서버 컴포넌트로 두고, 상태·이벤트가 필요한 부분만 작은 `'use client'` 컴포넌트로 뺀다.
- 원칙: 스켈레톤은 실제 컴포넌트의 SCSS 클래스를 그대로 써서 크기를 맞춘다(치수를 따로 적지 않음). 바꾼 뒤에는 실제 화면과 영역 크기를 비교해 확인한다.
- 원칙: 버튼 모양이 필요하면 직접 클래스를 쓰지 말고 `ui/Button`을 쓴다. 페이지 이동은 `ButtonLink`, 화면 안 동작은 `Button`.
- 원칙: 404·에러처럼 모양이 같은 안내 화면은 `StatusView`를 재사용하고, 각 파일은 문구와 버튼만 정한다. 공통 틀에는 문구를 넣지 않는다.
- 원칙: 같은 값이 한 파일 안에서 반복되면 그 파일의 상수로, 여러 파일에서 쓰이면 공통 파일(`lib/`, 나중에 `constants/`)로 모은다.
- 원칙: 페이지를 만들면 metadata도 함께 정한다. 레이아웃에 `title.template: '%s | Shoppr'`가 있으므로 페이지는 `title`만 적는다. 고정 제목은 `metadata` 객체, 주소에 따라 다르면 `generateMetadata`, `'use client'` 파일은 `<title>` 태그.
- Next.js 16 주의: `error.tsx`의 복구 함수는 `retry`(예전 `reset`). API가 헷갈리면 `node_modules/next/dist/docs/`의 설치 버전 문서를 확인한다.
- 스텝별 설명: `docs/steps/`
- 실행: `npm run dev` / 빌드: `npm run build` / 린트: `npm run lint` / 타입 검사: `npx tsc --noEmit`
- 참고: 사용자가 `npm run dev`(localhost:3000)를 켜 두는 경우가 많다. Next.js 16은 같은 폴더에서 dev 서버를 두 개 못 띄우므로, 검증은 `npm run build` 후 `next start -p <다른 포트>`로 하거나 켜진 3000 서버를 읽기 전용으로 쓴다. 파일을 임시로 바꾸면 사용자 화면에도 반영된다.
- 참고: 회사 네트워크 — npm 저장소는 연결되지만 이미지 사이트(Unsplash·Pexels·Wikimedia·Picsum)는 회사 SSL 검사 인증서 때문에 Node는 `SELF_SIGNED_CERT_IN_CHAIN`, curl은 오류 35로 실패한다. 인증서 검사를 끄지 말 것(`NODE_TLS_REJECT_UNAUTHORIZED=0` 금지). 필요하면 사용자에게 브라우저로 받아 달라고 하거나, 동의를 받아 회사 루트 인증서를 `NODE_EXTRA_CA_CERTS`로 지정한다. (2026-09-30 사용자는 샘플 이미지 유지 선택)
- 참고: Windows(`core.autocrlf=true`)에서 작업하면 작업 폴더 파일이 CRLF다. 스크립트로 문자열 치환할 때 줄바꿈 주의 (Step 3-4에서 `.gitattributes`로 정리 예정)

## 로드맵
> 2026-09-29: 실무에서 많이 쓰는 구성으로 방향 전환. Vite → **Next.js**, JS → **TypeScript**(원래 Step 9 → 앞당김), Tailwind → **SCSS Module**, **Storybook** 추가.
> 이에 맞춰 Step 3 이후 번호를 다시 매겼다. (예전 Step 3 라우팅 → Step 4, 장바구니 → Step 5 …)

### Phase 1. React 기본기 + 실무 개발 환경
- [x] **Step 1** 데이터 분리, price 숫자화 + `Intl` 포맷, 검색 연결, 빈 상태 화면
- [x] **Step 2** 카테고리 필터 + 정렬(가격·평점) + 품절 숨기기. 파생 상태, `useMemo`, 컴포넌트 분리
- [ ] **Step 3** 실무 환경 전환
  - [x] 3-1 Vite → Next.js(App Router) + TypeScript. 서버/클라이언트 컴포넌트 구분, 파일 기반 라우팅
  - [x] 3-2 SCSS Module 전환: 디자인 토큰(`_tokens.scss`), mixin(반응형·포커스), CSS 변수 테마(`data-theme`) + 다크 모드 localStorage 저장·깜빡임 방지, `next/font`. Tailwind 제거
  - [x] 3-3 Storybook: 컴포넌트별 `*.stories.tsx`, Controls/Docs 자동 문서, a11y addon, 다크 모드 전환 툴바
  - [ ] 3-4 코드 품질 도구: Prettier, Stylelint(SCSS), husky + lint-staged(커밋 전 자동 검사), `.editorconfig`·`.gitattributes`
- [ ] **Step 4** 라우팅 심화: 상품 상세 완성(`notFound()`, `generateMetadata`로 페이지별 SEO), 검색·필터·정렬을 `searchParams`(URL 쿼리)로 관리, `loading.tsx`·`error.tsx`
- [ ] **Step 5** 장바구니: Context + `useReducer`(또는 Zustand), localStorage 저장

### Phase 2. API 연동
- [ ] **Step 6** Next.js Route Handler(`app/api`)로 목 API 만들기 → 서버 컴포넌트에서 fetch vs 클라이언트에서 fetch 비교. 로딩·에러·빈 상태 처리. (MSW는 Storybook·테스트용 목킹에 사용)
- [ ] **Step 7** TanStack Query 도입: 캐싱, 검색 debounce, 페이지네이션 또는 무한 스크롤

### Phase 3. 백엔드 맛보기
- [ ] **Step 8** DB 연동(Prisma + SQLite/Postgres 또는 Supabase)으로 상품 CRUD. Route Handler / Server Actions
- [ ] **Step 9** 인증(Auth.js 등, 회원가입·로그인)과 주문 기능. `proxy.ts`(구 middleware)로 보호된 라우트

### Phase 4. 품질 · 배포 · 포트폴리오화
- [ ] **Step 10** 테스트: Vitest + Testing Library(단위·컴포넌트), Storybook 인터랙션 테스트, Playwright(E2E). GitHub Actions CI(lint·타입·테스트·빌드)
- [ ] **Step 11** 배포(Vercel), 접근성·성능 점검(Lighthouse, axe) — 퍼블리셔 강점 어필, README에 기술적 의사결정 정리, Storybook 배포(Chromatic 또는 GitHub Pages)

## 진행 상황
- 2026-09-22: Step 1 완료 (커밋 `7722df3`)
- 2026-09-25: 이전 Codespace에서 진행하던 Step 2가 커밋되지 않아 유실됨. Step 2부터 다시 시작.
  - Step 2 완료: 2-1 카테고리 필터, 2-2 정렬, 2-3 품절 숨기기 + useMemo. 코드 주석과 `docs/steps/` 스텝 설명 문서 추가.
  - (구) Step 3-1 react-router 설치, 페이지 나누기 완료 (커밋 `cbd77f1`).
  - 이 로드맵은 원래 계획이 사라진 뒤 대화와 코드 기준으로 다시 정리한 것이다. 사용자가 기억하는 원래 계획과 다르면 이 파일을 수정한다.
- 2026-09-29: 실무형 구성으로 전환 결정 (Next.js + TypeScript + SCSS Module + Storybook). 로드맵 재정리.
  - Step 3-1 완료: Vite → Next.js 16 + React 19 + TypeScript. react-router 제거, App Router로 페이지 이전. 스타일은 아직 Tailwind.
  - 3-1 보강: 에러 화면 공통화 — `StatusView` + `not-found.tsx` / `error.tsx` / `global-error.tsx`.
  - 3-1 보강: 404에 '이전 페이지로'(`BackButton`, 기록 없으면 홈) 추가.
  - 3-1 보강: 공통 버튼 `ui/Button`(Button/ButtonLink) — 에러 화면·헤더 다크 모드 버튼에 적용.
  - 3-1 보강: 페이지별 metadata — 레이아웃 title template·description·Open Graph, not-found·상세(`generateMetadata`)·error 제목.
  - Step 3-2 완료: Tailwind → SCSS Module. 디자인 토큰·mixin·CSS 변수 테마, 다크 모드 localStorage 유지 + 깜빡임 방지, Header 서버 컴포넌트화(ThemeToggle 분리), Pretendard, 검색창 aria-label.
  - 3-2 보강(2026-09-30): 새로고침 때 움찔(FOUT) 원인 측정 → 크기 보정 대체 폰트로 CLS 0.00066 → 0.00003.
  - 3-2 보강: 스켈레톤 UI(`ui/Skeleton`, CardSkeleton, CatalogSkeleton) + `page.tsx` Suspense. 실제 화면과 크기 일치 검증(1280·390px), `<select>` 높이 명시.
  - 3-2 보강: 개발용 미리보기 `/dev/skeleton`(스켈레톤/실제/로딩 재현, production 404).
  - 3-2 보강: 상품 샘플 이미지(크기 제각각 12장) + `next/image`. 카드 틀 크기 일정, WebP 3~8KB로 전송 확인.
  - Step 3-3 완료: Storybook 10 + nextjs-vite, 스토리 29개(UI·Product·Feedback·Layout), 다크 모드 툴바, autodocs, a11y. axe 검사에서 StatusView 코드 숫자 대비 부족 발견 → 수정(58/58 통과).
  - 3-3 보강: px→rem 함수 `to-rem()`(SCSS)·`toRem()`(TS) 도입, 토큰·스켈레톤·스토리 적용. 컴파일 결과 CSS 전후 동일 확인.
  - 다음은 3-4 코드 품질 도구 (Prettier, Stylelint, husky + lint-staged, .gitattributes).
