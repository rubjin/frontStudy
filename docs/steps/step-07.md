# Step 7. TanStack Query — 서버 데이터 캐싱, 검색 debounce, 더 보기

> 상태: 진행 중 (7-1 완료)

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
- [ ] **7-2** 목록을 API로: 서버에서 미리 받아 캐시에 넣기(hydration), 필터별 캐시, 검색 debounce
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
