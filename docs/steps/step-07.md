# Step 7. TanStack Query — 서버 데이터 캐싱, 검색 debounce, 더 보기

> 상태: 진행 중 (7-1, 7-2 완료)

## 목표
Step 6에서 데이터를 API로 받게 했더니, 직접 fetch할 때 챙길 것이 많았다(로딩·에러·다시 시도·취소·중복 요청). 그리고 두 가지 문제가 남았다.
- `/cart`에서 **같은 요청이 두 번**(CartProvider 재고 확인 + 화면 표시)
- 그 두 요청이 **순서대로**(워터폴) 나가서 지연 1.5초면 목록이 3.7초 뒤에 보임

**TanStack Query**는 '서버에서 받아 온 데이터'를 **키별로 저장(캐시)**하고, 로딩·에러·다시 시도·취소·중복 요청 합치기를 대신 해 주는 도구다.

### 상태의 종류를 나눠 생각하기
| 종류 | 예 | 도구 |
|---|---|---|
| 내가 만들고 바꾸는 상태 (클라이언트 상태) | 장바구니 수량, 토스트 | `useReducer`·Context (Step 5) |
| 주소에 있는 상태 | 검색어·필터 | URL 쿼리 (Step 4-2) |
| 서버에 있는 데이터의 복사본 (서버 상태) | 상품 목록, 상품 정보 | **TanStack Query** |
서버 상태는 "언제 받았는지, 지금도 최신인지, 받는 중인지, 실패했는지"를 함께 관리해야 해서 일반 state와 성격이 다르다.

## 세부 단계
- [x] **7-1** 설치·설정, 장바구니 상품 정보를 상품별 캐시로 → 중복 요청·워터폴 해결
- [x] **7-2** 목록을 API로: 서버에서 미리 받아 캐시에 넣기(hydration), 필터별 캐시, 검색 debounce
- [ ] **7-3** 더 보기: `useInfiniteQuery`로 나눠 받기

---

## 7-1. 설치·설정 + 장바구니를 캐시로

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/queryClient.ts` (새 파일) | `makeQueryClient`(staleTime 60초, retry 1) / `getQueryClient`(서버는 요청마다 새로, 브라우저는 하나) |
| `src/lib/queries.ts` (새 파일) | 쿼리 정의 `productQueries.detail(id)` — 키 `['products', 'detail', id]` + `fetchProduct`. `retryOnMount: false` |
| `src/components/QueryProvider.tsx` (새 파일) | `QueryClientProvider` + `ReactQueryDevtools`(개발 모드에서만) |
| `src/lib/api.ts` | `fetchProduct(id)` — 404는 에러가 아니라 `null` |
| `src/components/useCartProducts.ts` | 6-3의 직접 구현 → `useQueries`(상품마다 쿼리) + `combine`. 반환 모양은 그대로라 `CartContents`는 수정 없음 |
| `src/components/CartProvider.tsx` | 재고 확인을 `queryClient.fetchQuery(productQueries.detail(id))`로 → 결과가 캐시에 남아 화면이 그대로 씀 |
| `src/app/layout.tsx` | `QueryProvider`를 가장 바깥에 |
| `.storybook/preview.tsx` | 스토리마다 새 `QueryClient`(retry 없음) — 스토리끼리 캐시가 섞이지 않게 |
| `src/mocks/handlers.ts` | 상황별 핸들러가 `/api/products`와 `/api/products/:id`를 모두 덮게 |
| `package.json` | `@tanstack/react-query`, `@tanstack/react-query-devtools` |

### 핵심 개념

**1. 쿼리 키 = 캐시의 이름**
```ts
useQuery({ queryKey: ['products', 'detail', 3], queryFn: () => fetchProduct(3) })
```
- 같은 키를 쓰는 곳이 여러 군데여도 요청은 **한 번**, 결과는 함께 쓴다.
- 키는 넓은 것 → 좁은 것 순서의 배열. `['products']`로 상품 관련 캐시를 한꺼번에 지울 수 있다.
- `queryOptions()`로 키와 함수를 묶어 두고(`lib/queries.ts`) 어디서나 같은 정의를 쓴다 → 키 오타로 캐시를 못 나눠 쓰는 실수를 막는다.

**2. staleTime — 언제까지 '신선'한가**
기본값 0은 "받자마자 오래됨" → 컴포넌트가 새로 나타날 때마다 다시 요청한다. 상품 정보는 자주 바뀌지 않으니 60초. 그동안은 캐시만 쓴다.

**3. QueryClient는 서버에서는 요청마다, 브라우저에서는 하나**
서버에서 하나를 같이 쓰면 다른 사용자의 데이터가 섞일 수 있다. 브라우저에서 렌더링 때마다 새로 만들면 캐시가 매번 날아간다. (TanStack Query 공식 Next.js 가이드 방식)

**4. 상품별 키로 나눈 이유 (`useQueries`)**
`['products', 'byIds', '2,5']`처럼 목록 하나로 묶으면 하나만 빼도 키가 바뀌어 **전부 다시** 받는다. 상품마다 키를 두면:
- 수량 변경·삭제 → 요청 0
- 새로 담은 상품 → 그 상품만 요청
- CartProvider가 `fetchQuery`로 받아 둔 것을 `/cart` 화면이 그대로 씀 → 중복 요청·워터폴 해결

**5. 6-3 직접 구현과 비교**
| 6-3 직접 | 7-1 TanStack Query |
|---|---|
| `useState` 4개 + `useEffect` + 계산 | `useQueries` + `combine` |
| `AbortController` 직접 | `queryFn`의 `signal` |
| `checkedIds`로 물어본 id 기억 | 키별 캐시 |
| `attempt`를 올려 다시 시도 | `refetch()` |
| 다른 컴포넌트와 결과 공유 불가 | 같은 키면 자동 공유 |

**6. retry와 retryOnMount**
- 기본 3번 재시도는 실패 화면까지 7초 가까이 걸린다 → 1번.
- `retryOnMount: false`: CartProvider의 확인이 이미 실패했는데 `/cart`가 열리면서 같은 쿼리를 또 2번 요청하던 것(총 4번, 실패 화면 2.2초)을 막는다 → 2번, 1.2초. 그 뒤는 사용자가 '다시 시도'로 정한다.

**7. Storybook은 스토리마다 새 캐시**
사이트처럼 캐시를 하나 쓰면 Filled 스토리에서 받은 상품이 남아 ServerError 스토리에서도 성공 화면이 나온다. 스토리용 Provider가 `useState(() => new QueryClient())`로 스토리마다 새로 만든다.

### 확인 방법
1. `npm run dev` → 화면 구석 꽃 아이콘(Devtools) → `/cart`에서 `["products","detail",2]` 같은 키 확인
2. Network 탭: `/cart` 새로고침 때 상품마다 `/api/products/2` 한 번씩
3. 수량 변경·삭제 → 요청 없음 / 홈에서 새 상품 담고 `/cart` → 그 상품만 요청
4. `MOCK_API_DELAY_MS=1500` → 약 1.7초 만에 목록

검증 결과 (production 빌드 + headless Chrome, 2026-10-04)
- `/cart` 요청: 6-3 `ids=2,5` × **2번** → 7-1 `/api/products/2`, `/5`, `/999` 각 **1번** (999는 일부러 넣은 없는 상품 → 404 → 장바구니에서 빠지고 조정 토스트)
- 지연 1.5초: 목록 표시 **3.7초 → 1.7초**
- 삭제 후 요청 0, 새로 담은 상품(7)만 요청
- 실패: 요청 2번(자동 재시도 포함) 뒤 1.2초에 안내 → 다시 시도 1번 → 목록 + 포커스 `H2 담은 상품 2`
- 5-3 회귀(새로고침 유지·탭 동기화·값 정리·스켈레톤 크기·axe) 통과. 콘솔은 999번의 404 한 줄뿐(의도)
- Storybook 55개 × 라이트/다크 정상·axe 0. 처음엔 상황별 MSW 핸들러가 목록 주소만 덮어서 장바구니 오류 스토리가 '비어 있음'으로 나옴 → 두 주소 모두 덮도록 수정
- `tsc`·ESLint·Prettier 통과

---

## 7-2. 목록을 API로 — 서버에서 미리 받기(hydration), 필터별 캐시, 검색 debounce

### 왜 바꾸나?
6-2까지는 서버가 **전체 상품**을 넘기고 브라우저가 걸렀다. 상품이 수천 개면 전부 보낼 수 없다. 서버(API)가 걸러서 필요한 것만 보내야 한다(7-3에서 나눠 보내기까지).

### 흐름
```
첫 요청  /?category=오디오
  서버 page.tsx ─ CatalogData
     queryClient.prefetchQuery(키 ['products','list',{오디오}], 서버용 queryFn = lib/products 직접)
     <HydrationBoundary state={dehydrate(queryClient)}>      ← 캐시 내용을 HTML과 함께 보냄
        <ProductCatalog />  useQuery(같은 키) → 캐시에 이미 있음 → 요청 없이 그림
필터 변경  주소 쿼리 → 필터 → 키 변경 → GET /api/products?category=웨어러블  (한 번 본 조건은 캐시)
검색어     입력창은 즉시, 요청은 입력이 300ms 멈춘 뒤 한 번
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/app/(catalog)/page.tsx` | `searchParams`로 필터를 읽어 `prefetchQuery`(카테고리와 `Promise.all`) → `HydrationBoundary`. `connection()` 제거(쿼리를 읽으면 자동으로 요청마다) |
| `src/components/ProductCatalog.tsx` | 전체 상품 props·`useMemo` 걸러내기 제거 → `useQuery(productQueries.list(...))` + `keepPreviousData`. 바뀌는 중 흐리게·`aria-busy`, 실패 `InlineError`, 다시 시도 후 결과 영역으로 포커스 |
| `src/lib/queries.ts` | `productQueries.list(filters)` — 키에 넣기 전 검색어 앞뒤 공백 정리 |
| `src/lib/api.ts` | `fetchProducts(filters)` — 주소 만들기는 `toCatalogSearch` 그대로 |
| `src/lib/useDebouncedValue.ts` (새 파일) | 값이 delay 동안 안 바뀌면 그 값을 돌려주는 훅 |
| `src/components/ui/InlineError.tsx`·`.module.scss`·`.stories.tsx` (새 파일) | 영역 안 실패 안내 + 다시 시도(`retrying` 중 `aria-disabled`). 장바구니(6-3)에 있던 것을 공통으로 |
| `src/components/CartContents.tsx`·`.module.scss` | `InlineError` 사용, `.error` 스타일 삭제 |
| `src/components/CatalogSkeleton.tsx` | `gridOnly` — 검색창·툴바 없이 목록 자리만 |
| `src/app/dev/skeleton/*` | 카테고리만 넘김(목록은 ProductCatalog가 받음) |

### 핵심 개념

**1. prefetch + hydration — 서버가 받은 것을 브라우저 캐시의 시작값으로**
- `useQuery`만 쓰면 첫 화면에서 브라우저가 API를 요청한다 → 첫 HTML에 목록이 없고(SEO·체감 속도 손해), 요청이 한 번 더 왕복한다.
- 서버에서 **같은 키**로 미리 받아(`prefetchQuery`) 캐시를 직렬화(`dehydrate`)해 보내면, 브라우저 캐시가 그 데이터로 시작한다(`HydrationBoundary`).
- 키는 같고 `queryFn`만 서버용으로 바꾼다: `{ ...productQueries.list(filters), queryFn: () => getProducts(...) }` — 서버는 자기 API를 fetch하지 않는다(6-1 원칙).
- 7-1의 `staleTime` 60초가 여기서도 중요하다. 0이면 브라우저가 받자마자 "오래됨"으로 보고 다시 요청한다.

**2. 키가 같아야 캐시를 나눠 쓴다**
서버와 브라우저가 키를 **똑같이** 만들어야 한다. 그래서 키를 만드는 곳을 `productQueries.list` 하나로 두고, 검색어 공백 정리도 그 안에서 한다. 카테고리 검사는 서버에서 하면 워터폴이 생겨(카테고리 목록 → 목록) 생략하고 동시에 받는다 — 정상 주소면 키가 같다.

**3. `placeholderData: keepPreviousData` — 바뀌는 동안 이전 결과 유지**
새 키는 캐시가 비어 있어 기본은 '로딩'(스켈레톤)이다. 필터를 누를 때마다 목록이 스켈레톤으로 깜빡이면 불편하다 → 이전 결과를 흐리게(`opacity: 0.6`) 보여 주고, 새 결과가 오면 바꾼다. `aria-busy="true"`로 스크린리더에 "바뀌는 중"을 알린다.

**4. debounce — 연달아 일어나는 일을 마지막 한 번으로**
- 입력창(주소의 `q`)은 바로 바뀌고, **요청에 쓰는 값만** 300ms 늦춘다(`useDebouncedValue`).
- 값이 바뀔 때마다 타이머를 새로 걸고, 이전 타이머는 effect 정리 함수에서 취소 → 마지막 값만 남는다.
- 입력 중(아직 요청 전)에도 목록을 흐리게 해서 "결과가 곧 바뀐다"를 보여 준다.

**5. 무엇이 어디로 갔나 (Step 2 → 7)**
| | Step 2 | Step 4-2 | Step 6-2 | Step 7-2 |
|---|---|---|---|---|
| 필터 상태 | useState | URL | URL | URL |
| 상품 데이터 | import | import | 서버 → props | **TanStack Query** (서버 prefetch) |
| 걸러내기·정렬 | 브라우저 useMemo | 〃 | 〃 | **서버(API)** |

### 확인 방법
1. `curl 'localhost:3000/?category=오디오'` → HTML에 오디오 상품만
2. Network 탭: 첫 화면에 `/api/products` 요청 없음
3. 검색창에 빠르게 '무선 이어폰' → 요청 1번, 입력 중 목록이 흐려짐
4. 카테고리 바꾸기 → 요청 1번 → 뒤로 가기 → 요청 없이 즉시
5. `npm run dev` → Devtools에서 `["products","list",{...}]` 키들 확인

검증 결과 (production 빌드 + headless Chrome, 2026-10-04)
- 첫 HTML(`?category=오디오&sort=rating`): 헤드폰 있음, 키보드 없음 (서버가 거른 결과)
- 첫 화면 브라우저 `/api/products` 요청 **0**
- '무선 이어폰' 80ms 간격 입력(6글자) → 요청 **1번** (`/api/products?q=무선+이어폰&sort=rating`), 입력 직후 `aria-busy="true"`
- 카테고리 '오디오' → 요청 1번 / 뒤로 가기 → 요청 0, 즉시
- 빈 결과 문구 정상, axe 라이트·다크 0, 콘솔 0
- 목록 요청 실패(가로채기) → 요청 2번(자동 재시도 1) → InlineError → 다시 시도 1번 → 목록, 포커스가 결과 영역으로
- 지연 1.5초: 스켈레톤 192ms → 목록 1661ms (카테고리·목록 동시라 지연 한 번)
- Storybook 58개 × 라이트/다크 정상·axe 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 남은 것
- API가 조건에 맞는 상품을 **전부** 보낸다 → 7-3 나눠 받기(더 보기)
