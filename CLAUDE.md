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
- 스택: Vite + React 18 + Tailwind CSS 3 (다크 모드는 `dark` 클래스 방식) + react-router 7 (v8은 React 19 필요라 v7 사용)
- 구조: `src/pages/` (ProductListPage, ProductDetailPage, NotFoundPage), `src/components/` (Header, SearchBar, CategoryFilter, SortSelect, SoldOutToggle, CardGrid, Card, icons), `src/data/products.js` (목 데이터), `src/lib/` (format, filterProducts, sortProducts — 순수 함수)
- 스텝별 설명: `docs/steps/`
- 실행: `npm run dev` / 빌드: `npm run build` / 린트: `npm run lint`

## 로드맵

### Phase 1. React 기본기 (프론트 상태 관리)
- [x] **Step 1** 데이터 분리, price 숫자화 + `Intl` 포맷, 검색 연결, 빈 상태 화면
- [x] **Step 2** 카테고리 필터 + 정렬(가격·평점) + 품절 숨기기. 파생 상태, `useMemo`, 컴포넌트 분리
- [ ] **Step 3** 라우팅(react-router): 상품 상세 페이지, 검색·필터 상태를 URL 쿼리로 관리
- [ ] **Step 4** 장바구니: Context + `useReducer`(또는 Zustand), localStorage 저장

### Phase 2. API 연동
- [ ] **Step 5** 목 API(json-server 또는 MSW)로 데이터를 옮기고 `fetch`로 불러오기. 로딩·에러·빈 상태 처리
- [ ] **Step 6** TanStack Query 도입: 캐싱, 검색 debounce, 페이지네이션 또는 무한 스크롤

### Phase 3. 백엔드 맛보기
- [ ] **Step 7** Node(Express) + DB(SQLite/Postgres) 또는 Supabase로 실제 REST API 만들기 (상품 CRUD)
- [ ] **Step 8** 인증(회원가입·로그인, JWT/세션)과 주문 기능. 보호된 라우트

### Phase 4. 품질 · 배포 · 포트폴리오화
- [ ] **Step 9** TypeScript 전환, Vitest + Testing Library 테스트
- [ ] **Step 10** 배포(프론트 Vercel/Netlify, 백엔드 Render 등), 접근성·성능 점검(Lighthouse) — 퍼블리셔 강점 어필, README에 기술적 의사결정 정리

## 진행 상황
- 2026-09-22: Step 1 완료 (커밋 `7722df3`)
- 2026-09-25: 이전 Codespace에서 진행하던 Step 2가 커밋되지 않아 유실됨. Step 2부터 다시 시작.
  - Step 2 완료: 2-1 카테고리 필터, 2-2 정렬, 2-3 품절 숨기기 + useMemo. 코드 주석과 `docs/steps/` 스텝 설명 문서 추가.
  - Step 3 진행 중: 3-1 라우터 설치, 페이지 나누기 완료. 다음은 3-2 상세 페이지.
  - 이 로드맵은 원래 계획이 사라진 뒤 대화와 코드 기준으로 다시 정리한 것이다. 사용자가 기억하는 원래 계획과 다르면 이 파일을 수정한다.
