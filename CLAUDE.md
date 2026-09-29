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

## 프로젝트
- 이름: **Shoppr** (상품 목록 쇼핑몰 UI)
- 스택: **Next.js 16 (App Router) + React 19 + TypeScript**
  - 스타일: 현재 Tailwind CSS 3 (다크 모드는 `<html>`의 `dark` 클래스) → **Step 3-2에서 SCSS Module로 전환 예정** (Tailwind 제거)
  - 컴포넌트 문서화: Storybook (Step 3-3 예정)
- 구조
  - `src/app/` — 파일 기반 라우팅. `layout.tsx`(공통 틀·Header), `page.tsx`("/"), `products/[id]/page.tsx`(상세), `not-found.tsx`(404), `error.tsx`(실행 에러), `global-error.tsx`(레이아웃 에러), `globals.css`
  - `src/components/` — Header, ProductCatalog(목록 화면·상태, `'use client'`), StatusView(404·에러 공통 화면), SearchBar, CategoryFilter, SortSelect, SoldOutToggle, CardGrid, Card, icons
  - `src/lib/` — format, filterProducts, sortProducts (순수 함수) / `src/data/products.ts` (목 데이터) / `src/types/` (공통 타입)
  - import는 `@/` 별칭(= `src/`) 사용
- 원칙: `page.tsx`·`layout.tsx`는 서버 컴포넌트로 두고, 상태·이벤트가 필요한 부분만 작은 `'use client'` 컴포넌트로 뺀다.
- 원칙: 404·에러처럼 모양이 같은 안내 화면은 `StatusView`를 재사용하고, 각 파일은 문구와 버튼만 정한다.
- 원칙: 페이지를 만들면 metadata도 함께 정한다. 레이아웃에 `title.template: '%s | Shoppr'`가 있으므로 페이지는 `title`만 적는다. 고정 제목은 `metadata` 객체, 주소에 따라 다르면 `generateMetadata`, `'use client'` 파일은 `<title>` 태그.
- Next.js 16 주의: `error.tsx`의 복구 함수는 `retry`(예전 `reset`). API가 헷갈리면 `node_modules/next/dist/docs/`의 설치 버전 문서를 확인한다.
- 스텝별 설명: `docs/steps/`
- 실행: `npm run dev` / 빌드: `npm run build` / 린트: `npm run lint` / 타입 검사: `npx tsc --noEmit`
- 참고: Windows(`core.autocrlf=true`)에서 작업하면 작업 폴더 파일이 CRLF다. 스크립트로 문자열 치환할 때 줄바꿈 주의 (Step 3-4에서 `.gitattributes`로 정리 예정)

## 로드맵
> 2026-09-29: 실무에서 많이 쓰는 구성으로 방향 전환. Vite → **Next.js**, JS → **TypeScript**(원래 Step 9 → 앞당김), Tailwind → **SCSS Module**, **Storybook** 추가.
> 이에 맞춰 Step 3 이후 번호를 다시 매겼다. (예전 Step 3 라우팅 → Step 4, 장바구니 → Step 5 …)

### Phase 1. React 기본기 + 실무 개발 환경
- [x] **Step 1** 데이터 분리, price 숫자화 + `Intl` 포맷, 검색 연결, 빈 상태 화면
- [x] **Step 2** 카테고리 필터 + 정렬(가격·평점) + 품절 숨기기. 파생 상태, `useMemo`, 컴포넌트 분리
- [ ] **Step 3** 실무 환경 전환
  - [x] 3-1 Vite → Next.js(App Router) + TypeScript. 서버/클라이언트 컴포넌트 구분, 파일 기반 라우팅
  - [ ] 3-2 SCSS Module 전환: 디자인 토큰(`_tokens.scss`), mixin(반응형·포커스), CSS 변수 테마(`data-theme`) + 다크 모드 localStorage 저장·깜빡임 방지, `next/font`. Tailwind 제거
  - [ ] 3-3 Storybook: 컴포넌트별 `*.stories.tsx`, Controls/Docs 자동 문서, a11y addon, 다크 모드 전환 툴바
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
  - 3-1 보강: 페이지별 metadata — 레이아웃 title template·description·Open Graph, not-found·상세(`generateMetadata`)·error 제목.
  - 다음은 3-2 SCSS Module 전환.
