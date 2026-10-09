# 프로젝트 구조 — 폴더·파일별 역할

> 2026-10-06 기준 (Step 8 완료, 8-4 실데이터 보강 포함). 파일마다 맨 위 주석에 "언제(Step), 왜" 만들었는지 더 자세히 적혀 있다.
> 이 문서는 **어디에 무엇이 있고, 무엇을 고치려면 어디를 열어야 하는지** 찾는 지도다.

---

## 0. 큰 그림

```
frontStudy/
├─ src/                  ← 사이트 코드 전부
│  ├─ app/               ← 주소(페이지)와 API — Next.js 파일 기반 라우팅
│  ├─ components/        ← 화면 조각(컴포넌트) + 그 스타일·스토리
│  │  └─ ui/             ← 기능과 무관한 기본 부품 (버튼, 스켈레톤, 토스트…)
│  ├─ lib/               ← 화면이 아닌 코드: 데이터 함수, 규칙, 계산, 훅
│  ├─ types/             ← 여러 파일이 같이 쓰는 데이터 모양(타입)
│  ├─ styles/            ← 디자인 토큰, mixin, 테마, 전역 CSS
│  ├─ data/              ← 목 데이터 12개 (Storybook·MSW와 `SEED_DATA=mock` 시드에서만 사용)
│  ├─ mocks/             ← Storybook용 가짜 API (MSW)
│  └─ generated/         ← Prisma가 만든 DB 클라이언트 (자동 생성, 커밋 안 함)
├─ prisma/               ← DB 설계도·변경 이력·초기 데이터
├─ public/               ← 그대로 서비스되는 정적 파일 (상품 이미지)
├─ docs/                 ← 학습 기록 (steps/)과 안내서 (guides/)
├─ .storybook/           ← Storybook 설정
├─ .husky/               ← 커밋 직전 자동 검사
├─ .vscode/              ← 팀 공통 에디터 설정
└─ (루트 설정 파일들)     ← package.json, next.config.ts, tsconfig.json …
```

### 계층으로 보면
```
 화면        app/**/page.tsx (서버)  ·  components/*.tsx ('use client'는 일부만)
   │  서버는 직접 호출 ↓                  브라우저는 fetch ↓
 API         app/api/**/route.ts  ◀────────  lib/api.ts → lib/queries.ts (TanStack Query)
   │
 데이터      lib/products.ts  (server-only, 데이터 접근은 여기로만)
   │
 DB          lib/db.ts (prisma)  →  prisma/dev.db (SQLite)
```
자세한 흐름은 `docs/guides/api-walkthrough.md`.

### 상태는 종류별로 다른 곳에
| 종류 | 예 | 어디서 관리 |
|---|---|---|
| 서버 데이터의 복사본 | 상품 목록·상품 정보 | TanStack Query (`lib/queries.ts`) |
| 내가 바꾸는 상태 | 장바구니, 토스트 | `useReducer` + Context (`CartProvider`, `ui/Toast`) |
| 주소에 있는 상태 | 검색어·카테고리·정렬·품절 숨기기 | URL 쿼리 (`lib/catalogParams.ts`) |
| 브라우저에 저장 | 장바구니, 다크 모드 | localStorage (`lib/cartStorage.ts`, `lib/theme.ts`) |

---

## 1. `src/app/` — 주소(페이지)와 API

**규칙:** 폴더 경로 = 주소. 약속된 파일 이름만 특별한 역할을 한다.

| 파일 이름 | 역할 |
|---|---|
| `page.tsx` | 그 주소의 화면 |
| `layout.tsx` | 하위 페이지를 감싸는 틀. 페이지를 옮겨도 유지된다 |
| `loading.tsx` | 페이지가 준비되는 동안 보여 줄 화면 (자동 `<Suspense>`) |
| `error.tsx` | 실행 중 에러가 났을 때 그 구간만 대신할 화면 |
| `not-found.tsx` | 없는 주소(404) |
| `route.ts` | 화면 대신 데이터(JSON)를 돌려주는 API |
| `[id]` 폴더 | 그 자리에 오는 값을 `params.id`로 받는 동적 주소 |
| `(이름)` 폴더 | 라우트 그룹 — 주소에 나타나지 않고 파일만 묶는다 |
| 그 밖의 파일 | 주소가 되지 않는다 (같은 폴더에 둔 전용 컴포넌트 등) |

### 전체 목록
```
src/app/
├─ layout.tsx            루트 레이아웃: <html lang="ko">, 다크 모드 깜빡임 방지 스크립트, 폰트,
│                        Provider 3겹(Query → Toast → Cart), Header, <main>. 사이트 기본 metadata(제목 템플릿)
├─ layout.module.scss    <main> 여백·최대 너비
├─ not-found.tsx         404 화면 (StatusView + 이전 페이지로·홈으로)
├─ error.tsx             기본 에러 화면 (구간 전용 error.tsx가 없는 곳)
├─ global-error.tsx      layout.tsx 자체가 고장 났을 때 — <html>부터 직접 그린다
│
├─ (catalog)/            라우트 그룹 → 주소는 그대로 "/"
│  ├─ page.tsx           홈 = 상품 목록. searchParams로 필터를 읽고, 서버에서 첫 페이지를
│  │                     TanStack Query로 미리 받아(prefetch) HTML에 넣는다(HydrationBoundary)
│  ├─ loading.tsx        홈으로 이동할 때의 목록 스켈레톤 (그룹으로 묶어 홈에만 적용)
│  └─ error.tsx          목록 에러: 다시 시도 / 검색 조건 초기화
│
├─ products/[id]/        "/products/3"
│  ├─ page.tsx           상세. generateStaticParams(빌드 때 미리 만들 주소), generateMetadata(페이지별 제목),
│  │                     getProduct 직접 호출, 없으면 notFound()
│  ├─ loading.tsx        상세 스켈레톤
│  └─ error.tsx          상세 에러: 다시 시도 / 목록으로
│
├─ cart/                 "/cart"
│  ├─ page.tsx           제목(h1)과 metadata만. 내용은 CartContents('use client')
│  └─ page.module.scss
│
├─ admin/                "/admin/..." 관리 화면 (Step 8-3)
│  ├─ layout.tsx         요청마다 열어도 되는지 검사(isAdminEnabled). 아니면 안내 화면
│  └─ products/
│     ├─ page.tsx        상품 관리 표 (DB 직접 조회) + 처리 결과 문구(?done=…)
│     ├─ page.module.scss
│     ├─ actions.ts      Server Actions: 추가·수정·삭제 ('use server')
│     │                  순서: 권한 검사 → zod 입력 검사 → DB → revalidatePath → redirect
│     ├─ new/page.tsx    상품 추가 폼
│     └─ [id]/edit/page.tsx  상품 수정 폼 (지금 값을 처음 값으로)
│
├─ api/                  API (Route Handler) — 브라우저용 데이터 창구
│  ├─ products/route.ts       GET /api/products — 목록. 쿼리 q·category·sort·instock·ids·page·size
│  │                          응답 { items, total, nextPage }
│  ├─ products/[id]/route.ts  GET /api/products/3 — 하나. 없으면 404
│  └─ categories/route.ts     GET /api/categories — { items: ['전체', ...] }
│
└─ dev/skeleton/         "/dev/skeleton" 개발용 스켈레톤 미리보기 (production에서는 404)
   ├─ page.tsx
   ├─ SkeletonPreview.tsx       이 페이지 전용 컴포넌트 (주소가 되지 않음)
   └─ SkeletonPreview.module.scss
```

---

## 2. `src/components/` — 화면 조각

**규칙**
- 컴포넌트 하나 = `이름.tsx` + (필요하면) `이름.module.scss` + `이름.stories.tsx`
- 기본은 **서버 컴포넌트**. 클릭·state·브라우저 저장소가 필요한 것만 맨 위에 `'use client'`
- `use…`로 시작하는 파일은 훅(화면을 그리지 않고 동작만 나눠 쓰는 함수)

**'종류' 칸 읽는 법**
- **client**: 파일 맨 위에 `'use client'`가 있다 (브라우저에서도 실행되는 경계)
- **서버**: `'use client'`가 없고 서버 컴포넌트(페이지 등)에서 쓰인다
- **client 안**: `'use client'`는 없지만 client 컴포넌트(`ProductCatalog`) 안에서 import되어 함께 브라우저에서 실행된다. 경계는 한 번만 표시하면 그 아래는 모두 client가 된다

### 레이아웃·공통
| 파일 | 종류 | 역할 |
|---|---|---|
| `Header.tsx` (+scss, stories) | 서버 | 상단 헤더: 로고 링크, 오른쪽에 CartLink·ThemeToggle |
| `ThemeToggle.tsx` (+scss) | client | 다크 모드 버튼. 아이콘·버튼 이름은 CSS로 전환 |
| `StatusView.tsx` (+scss, stories) | 서버 | 404·에러 **페이지** 공통 틀 (코드·제목·설명·버튼 자리). 문구는 각 파일이 넘김 |
| `BackButton.tsx` | client | "이전 페이지로" (기록이 없으면 홈) |
| `icons.tsx` | 서버 | SVG 아이콘 모음 (Moon·Sun·Search·Cart·Plus·Minus·Close…) |
| `QueryProvider.tsx` | client | TanStack Query를 사이트 전체에 깔기 + Devtools(개발 모드) |

### 상품 목록 (홈)
| 파일 | 종류 | 역할 |
|---|---|---|
| `ProductCatalog.tsx` (+scss) | client | 목록 화면의 두뇌: 주소 ↔ 필터, `useInfiniteQuery`, 검색 debounce, 더 보기, 실패·바뀌는 중 표시 |
| `SearchBar.tsx` (+scss) | client 안 | 검색 입력창 (제어 컴포넌트: 값은 부모가) |
| `CategoryFilter.tsx` (+scss) | client 안 | 카테고리 칩 버튼 (`aria-pressed`) |
| `SortSelect.tsx` (+scss) | client 안 | 정렬 `<select>` |
| `SoldOutToggle.tsx` (+scss) | client 안 | 품절 숨기기 체크박스 |
| `CardGrid.tsx` (+scss) | client 안 | 카드 격자 + "n개 상품" + 빈 결과 문구 |
| `Card.tsx` (+scss, stories) | client 안 | 상품 카드 하나 (이미지·이름 링크·가격·평점·담기 버튼) |
| `CardAddButton.tsx` | client | 카드의 담기 버튼 |
| `Filters.stories.tsx` | 스토리 | 검색·카테고리·정렬·품절 숨기기 스토리 묶음 |

### 상품 상세
| 파일 | 종류 | 역할 |
|---|---|---|
| `ProductDetail.tsx` (+scss, stories) | 서버 | 상세 화면: 이동 경로, 원본 비율 사진, 정보, 담기·목록으로 |
| `AddToCartButton.tsx` | client | 상세의 담기 버튼 |

### 장바구니
| 파일 | 종류 | 역할 |
|---|---|---|
| `CartProvider.tsx` | client | 장바구니 state(`useReducer`) + Context + `useCart()` 훅. localStorage 불러오기·저장, 다른 탭과 동기화, 재고 확인(같은 쿼리 키로 미리 받기), `hydrated` |
| `useAddToCart.ts` | 훅 | 두 담기 버튼의 공통 동작: 버튼 상태(품절/최대/가능), 담기 + 토스트 |
| `CartLink.tsx` (+scss) | client | 헤더의 장바구니 링크 + 개수 배지 |
| `CartContents.tsx` (+scss, stories) | client | `/cart` 내용: 목록·수량 −/+·삭제·주문 요약. 로딩/실패/비어 있음/목록 4상태 |
| `useCartProducts.ts` | 훅 | 장바구니 상품 정보를 상품별 쿼리(`useQueries`)로 받기 |
| `CartSkeleton.tsx` | 서버 | 장바구니를 불러오기 전 스켈레톤 ('모름'과 '비어 있음' 구분) |
| `Cart.stories.tsx` | 스토리 | 담기 버튼·카드 버튼·헤더 링크·함께 동작 |

### 로딩 스켈레톤
| 파일 | 어디에 |
|---|---|
| `CardSkeleton.tsx` | 카드 하나 (Card의 SCSS 클래스를 그대로 써서 크기 일치) |
| `CatalogSkeleton.tsx` | 목록 화면 전체 / `gridOnly`로 목록 자리만 |
| `ProductDetailSkeleton.tsx` | `products/[id]/loading.tsx` |
| `Skeletons.stories.tsx` | 스켈레톤과 실제를 나란히 비교하는 스토리 |

### 관리 화면 (Step 8-3)
| 파일 | 종류 | 역할 |
|---|---|---|
| `ProductForm.tsx` (+scss, stories) | client | 추가·수정 공용 폼. `useActionState`로 Server Action 결과를 받아 칸별 에러·요약·첫 칸 포커스 |
| `DeleteProductButton.tsx` | client | 확인(confirm) 후 삭제 액션 실행 (`useTransition`) |

### `src/components/ui/` — 기본 부품
| 파일 | 역할 |
|---|---|
| `Button.tsx` (+scss, stories) | `Button`(`<button>`, 화면 안 동작) / `ButtonLink`(`<a>`, 페이지 이동). `variant`(primary·secondary·ghost)·`size`(md·icon) |
| `Skeleton.tsx` (+scss, stories) | 스켈레톤 조각 하나 (inline/block, 둥글기) |
| `InlineError.tsx` (+scss, stories) | 페이지 **일부**를 못 불러왔을 때 안내 + 다시 시도 (목록·장바구니) |
| `Toast.tsx` (+scss, stories) | `ToastProvider` + `useToast().showToast({ message, action })`. 5초, hover·포커스 중 멈춤 |

---

## 3. `src/lib/` — 화면이 아닌 코드

| 파일 | 어디서 실행 | 역할 |
|---|---|---|
| **데이터·API** | | |
| `db.ts` | 서버 | Prisma DB 클라이언트 `prisma` 하나 (개발 모드에서 연결이 늘지 않게 전역 보관) |
| `products.ts` | 서버 | **데이터 계층.** 읽기 `getProducts`·`getProduct`·`getCategories`·`getProductIds`, 쓰기 `createProduct`·`updateProduct`·`deleteProduct`. DB 행 → 화면 모양 `toProduct` |
| `apiResponse.ts` | 서버 | API 실패 응답 모양 통일 `{ error: { message } }`, 원인은 서버 로그에만 |
| `mockNetwork.ts` | 서버 | `MOCK_API_DELAY_MS`·`MOCK_API_ERROR_RATE`로 느린 서버·실패 흉내 |
| `api.ts` | 브라우저 | `fetchJson`(상태 코드 검사)·`ApiError`·`fetchProduct`·`fetchProducts` — 브라우저의 fetch는 여기로만 |
| `queryClient.ts` | 둘 다 | TanStack Query 저장소 설정 (staleTime 60초, retry 1) |
| `queries.ts` | 둘 다 | 쿼리 정의 `productQueries.list`·`.detail` — **쿼리 키는 여기서만** 만든다 |
| **규칙·검사** | | |
| `cart.ts` | 둘 다 | 장바구니 reducer(add·setQuantity·remove·replace)와 계산(`getCartCount`·`getCartLines`·`getCartTotal`·`sanitizeCartItems`). **장바구니 규칙은 여기에만** |
| `cartStorage.ts` | 브라우저 | 장바구니 localStorage 읽기·쓰기 (`{ version, items }` + 모양 검사) |
| `catalogParams.ts` | 둘 다 | 주소 쿼리 ↔ 필터 값 변환(`parseCatalogParams`·`toCatalogSearch`), 페이지 나누기 값 검사, `PRODUCTS_PAGE_SIZE` |
| `productInput.ts` | 서버(검사) | 관리 폼 입력 검사 규칙(zod 스키마)과 `ProductInput` 타입 — 상품 입력 규칙은 여기에만. 검사는 Server Action에서, 폼은 타입만 가져다 쓴다 |
| `admin.ts` | 서버 | 관리 화면을 열어도 되는지 (개발 모드 또는 `ADMIN_ENABLED=1`, Step 9에서 로그인으로 교체 예정) |
| `filterProducts.ts` · `sortProducts.ts` | 둘 다 | 걸러내기·정렬 순수 함수와 상수(`ALL_CATEGORIES`='전체', `SORT_OPTIONS`). 실제 걸러내기·정렬은 Step 8부터 DB가 하고, 함수는 MSW가, 상수는 목록 화면·데이터 계층이 쓴다 |
| **표시·기타** | | |
| `format.ts` | 둘 다 | `formatPrice(189000)` → `₩189,000` (`Intl`) |
| `units.ts` | 둘 다 | `toRem(px)` — 시안 px를 rem으로 (SCSS `to-rem()`과 같은 규칙) |
| `site.ts` | 둘 다 | `SITE_NAME`, `formatTitle()` ('제목 \| Shoppr') |
| `theme.ts` | 브라우저 | 다크 모드: `<html data-theme>` 읽기·바꾸기·저장, 깜빡임 방지 스크립트 |
| **훅** | | |
| `useDebouncedValue.ts` | 브라우저 | 값이 delay 동안 안 바뀌면 그때 값을 돌려줌 (검색 0.3초) |
| `useReportError.ts` | 브라우저 | 에러 화면 공통 기록 (지금은 console, 나중에 Sentry) |

> **"서버" 표시 파일**은 대부분 맨 위에 `import 'server-only'`가 있어서 브라우저 코드에서 import하면 빌드가 실패한다.

---

## 4. `src/types/` — 데이터 모양

| 파일 | 내용 |
|---|---|
| `product.ts` | `Product`(id·name·price·category·rating·stock·image?), `ProductImage`(src·width·height) — 화면이 쓰는 상품 모양 |
| `cart.ts` | `CartItem`(productId·quantity), `CartState` — 장바구니에는 id와 수량만 |
| `api.ts` | `ProductListResponse`(items·total·nextPage), `CategoryListResponse`, `ApiErrorResponse` — 서버와 브라우저가 같이 import |

---

## 5. `src/styles/` — 디자인 시스템

컴포넌트 SCSS 첫 줄 `@use 'styles' as *;`로 `_index.scss`가 묶어 둔 **함수·토큰·mixin**을 불러온다(`next.config.ts`의 `loadPaths`가 `src`를 등록해 둔 덕분). 테마·폰트는 `globals.scss`가 한 번만 불러온다.

| 파일 | 역할 |
|---|---|
| `_index.scss` | 입구. `_functions`·`_tokens`·`_mixins`를 `@forward`로 묶어 내보낸다 |
| `_functions.scss` | `to-rem(px)` — 시안 px → rem |
| `_tokens.scss` | 디자인 토큰: 색상표(팔레트), `space(n)`(4px 단위), 글자 크기·줄 높이 짝, 둥글기, 그림자, 시간, 브레이크포인트, z-index |
| `_mixins.scss` | `mq(md)`(반응형), `text(sm)`(글자 크기+줄 높이), `focus-ring`, `sr-only`, `container`, `flex-center` |
| `_themes.scss` | 라이트/다크 CSS 변수 `--color-…`. **팔레트 색은 여기서만** 쓰고, 컴포넌트는 변수만 쓴다 |
| `_fonts.scss` | Pretendard + 크기 보정 대체 폰트(폰트 교체 때 레이아웃 이동 방지) |
| `globals.scss` | 전역: `_themes`·`_fonts`를 불러와 테마 변수와 폰트 적용, 리셋, body 기본값, `.sr-only` 클래스. `layout.tsx`가 import |

---

## 6. 나머지 `src/` 폴더

| 폴더/파일 | 역할 |
|---|---|
| `src/data/products.ts` | 상품 12개 목 데이터(로컬 이미지). **사이트 코드는 import하지 않는다** — MSW(`src/mocks`, Storybook)와 `SEED_DATA=mock` 시드만 사용. 사이트의 실제 데이터는 8-4부터 DummyJSON 194개 |
| `src/mocks/handlers.ts` | Storybook용 가짜 API(MSW). 기본 핸들러 + 상황별 `productsLoading`·`productsServerError`·`productsNetworkError` |
| `src/generated/prisma/` | `prisma generate`가 만든 타입 있는 DB 클라이언트. **커밋 안 함**, `npm install` 때 자동 생성 |

---

## 7. `prisma/` — DB

| 파일 | 역할 |
|---|---|
| `schema.prisma` | DB 설계도. `model Product` = 테이블. 고친 뒤 `npm run db:migrate` |
| `migrations/…_init/migration.sql` | 스키마 변경 이력(실제 SQL). DB를 같은 상태로 다시 만들 수 있게 커밋한다 |
| `migrations/migration_lock.toml` | 어떤 DB 종류(sqlite)용 이력인지 |
| `seed.ts` | 초기 데이터 넣기 — 상품 테이블을 비우고 한꺼번에 넣는다(트랜잭션). 기본은 `data/dummyjson-products.json`(194개), `SEED_DATA=mock`이면 `src/data/products.ts`(12개) |
| `import-dummyjson.ts` | `npm run data:import` — DummyJSON에서 상품을 받아 우리 모양으로 변환(원화 가격·한글 카테고리·이미지 크기 측정)해 JSON으로 저장. 데이터를 새로 받을 때만, 인터넷 필요 |
| `studio.ts` | `npm run db:studio` — Prisma Studio(브라우저로 DB 보기·고치기) 실행 도우미. Prisma 7.10 Studio가 `file:./…` 주소를 못 읽는 버그를 피하려고 절대 경로 주소로 바꿔 넘긴다 |
| `data/dummyjson-products.json` | 위 스크립트가 만든 스냅샷(커밋). 시드는 네트워크 없이 이 파일을 읽는다 |
| `dev.db` | SQLite DB 파일. **커밋 안 함** — `npm run db:setup`으로 만든다 |

DB 명령: `db:setup`(처음 한 번: 마이그레이션 + 시드) · `db:seed`(데이터만 처음 상태로) · `db:migrate`(스키마 변경) · `db:reset`(처음부터) · `db:studio`(브라우저로 DB 보기) · `data:import`(DummyJSON 스냅샷 새로 받기)

---

## 8. 그 밖의 폴더

| 폴더 | 역할 |
|---|---|
| `public/images/products/{id}.jpg` | 목 데이터용 샘플 이미지 12장(크기·비율 제각각). Storybook과 `SEED_DATA=mock`에서 사용. 실데이터 사진은 `cdn.dummyjson.com`에서 받는다 |
| `docs/steps/step-NN.md` | 스텝별 학습 기록: 목표·한 일·파일별 설명·핵심 개념·확인 방법·검증 결과 |
| `docs/guides/` | 주제별 안내서 (이 문서, API 따라가기, 역할 경계) |

> Step 9(인증)부터 추가된 파일은 `docs/steps/step-09.md`의 파일별 설명을 본다. (`lib/auth.ts`, `app/(auth)/`, `app/api/auth/`, `AuthForm`, `UserMenu` 등)
| `.storybook/main.ts` | Storybook 설정: 스토리 위치, 애드온(a11y·themes·docs), Sass 경로를 Next와 같게, 정적 폴더 |
| `.storybook/preview.tsx` | 모든 스토리 공통: 전역 CSS·폰트, 다크 모드 툴바, Provider(Query·Toast·Cart), MSW 시작 |
| `.storybook/public/mockServiceWorker.js` | MSW 서비스 워커(생성 파일). 사이트 `public/`이 아니라 여기에 둬서 배포에 섞이지 않음 |
| `.husky/pre-commit` | `git commit` 직전에 `npx lint-staged` 실행 |
| `.vscode/settings.json` | 저장 시 Prettier·ESLint·Stylelint 자동 정리, Stylelint가 scss 검사 |
| `.vscode/extensions.json` | 추천 확장 (EditorConfig·Prettier·ESLint·Stylelint) |

---

## 9. 루트 설정 파일

| 파일 | 역할 |
|---|---|
| `package.json` | 패키지 목록과 명령(`dev`·`build`·`lint`·`lint:css`·`format`·`storybook`·`db:*`·`data:import`). `postinstall`이 Prisma 클라이언트 생성 |
| `package-lock.json` | 설치된 패키지의 정확한 버전 기록 (사람이 고치지 않음) |
| `next.config.ts` | Next.js 설정: Sass `loadPaths`(src), 이미지 허용 경로(내 사이트 `/images/**`, 외부 `cdn.dummyjson.com/product-images/**`) |
| `tsconfig.json` | TypeScript 설정: `@/` = `src/` 별칭, 엄격 모드 |
| `prisma.config.ts` | Prisma CLI 설정: 스키마 위치, 마이그레이션 폴더, 시드 명령, `.env` 읽기 |
| `.env` | 기본 환경 변수(`DATABASE_URL`). 비밀이 아닌 기본값이라 커밋. 개인 값은 `.env.local`(커밋 안 함) |
| `eslint.config.mjs` | 코드 실수 검사: Next·TypeScript·Storybook 규칙 + Prettier와 충돌하는 규칙 끄기 |
| `prettier.config.mjs` / `.prettierignore` | 코드 모양: 세미콜론 없음, 작은따옴표, 한 줄 120자 / `*.md`·lock 파일 제외 |
| `stylelint.config.mjs` | SCSS 검사: 색은 테마 변수만, rem 직접 입력 금지, 글자 px 금지, 클래스 camelCase |
| `lint-staged.config.mjs` | 커밋할 파일만 검사: ts → ESLint·Prettier·tsc / scss → Stylelint·Prettier |
| `.editorconfig` | 에디터 저장 규칙: UTF-8, LF, 스페이스 2칸 |
| `.gitattributes` | Git 줄바꿈을 LF로 통일 (Windows에서도) |
| `.gitignore` | 커밋하지 않을 것: `node_modules`, `.next`, `storybook-static`, `.env*.local`, `src/generated`, `prisma/*.db` |
| `CLAUDE.md` | 프로젝트 규칙·원칙·로드맵·진행 상황 (Claude 작업 지침이자 프로젝트 요약) |
| `README.md` | 프로젝트 소개·실행 방법 (※ Step 3 시점 내용이라 Step 11에서 갱신 예정) |

### 커밋되지 않는(자동으로 생기는) 것
| 폴더/파일 | 만드는 방법 |
|---|---|
| `node_modules/` | `npm install` |
| `src/generated/prisma/` | `npm install` (postinstall) 또는 `npm run db:generate` |
| `prisma/dev.db` | `npm run db:setup` |
| `.next/` | `npm run dev` / `npm run build` (페이지별 타입 `PageProps`도 여기서 생김) |
| `storybook-static/` | `npm run build-storybook` |

> 새 PC·새 작업 폴더에서 에러가 잔뜩 나면 대부분 이것들이 없거나 오래된 것이다:
> `npm install` → `npm run db:setup` → `npm run build` 순서로 실행.

---

## 10. "이걸 바꾸려면 어디를?" 빠른 찾기

| 하고 싶은 일 | 열 파일 |
|---|---|
| 색·간격·글자 크기를 사이트 전체에서 바꾸기 | `styles/_tokens.scss`, `styles/_themes.scss` |
| 버튼 모양 바꾸기 | `components/ui/Button.module.scss` |
| 새 페이지 추가 | `app/새주소/page.tsx` (+ `metadata`) |
| 상품 필드 추가 (예: 할인율) | `prisma/schema.prisma` → `db:migrate` → `types/product.ts` → `lib/products.ts`의 `toProduct` → 화면 |
| 새 API 추가 | `app/api/…/route.ts` + `lib/`의 데이터 함수 (`docs/guides/api-walkthrough.md` 10장) |
| 목록 한 번에 보여 줄 개수 | `lib/catalogParams.ts`의 `PRODUCTS_PAGE_SIZE` |
| 캐시 유지 시간·재시도 횟수 | `lib/queryClient.ts` |
| 장바구니 규칙 (최대 수량 등) | `lib/cart.ts` |
| 관리 폼 입력 규칙·에러 문구 | `lib/productInput.ts` |
| 에러·404 문구 | 해당 `error.tsx` / `not-found.tsx` (모양은 `StatusView`) |
| 로딩 화면 | 해당 `loading.tsx` / `*Skeleton.tsx` |
| Storybook에서 API 상황 흉내 | `mocks/handlers.ts` + 스토리의 `parameters.msw` |
| 커밋 전 검사 항목 | `lint-staged.config.mjs` |
