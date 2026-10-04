# Step 6. API 연동 — Route Handler 목 API, 서버 vs 클라이언트에서 데이터 받기

> 상태: 완료 (2026-10-04)

## 목표
지금까지 상품 데이터는 `data/products.ts` 파일을 **화면 코드가 직접 import**했다. 브라우저 코드(`'use client'`)도 import해서 상품 데이터 전체가 자바스크립트 번들에 들어 있었다. 실제 서비스는 데이터가 서버(API·DB)에 있고, 화면은 그것을 **요청해서 받아야** 한다.

- 서버에 **API(주소로 데이터를 주는 곳)**를 만든다 — Next.js Route Handler
- 데이터를 **어디서 받을지** 두 가지를 비교한다
  - 서버 컴포넌트: 서버에서 데이터 함수를 바로 부른다 → HTML에 내용이 들어간다 (목록·상세)
  - 클라이언트 컴포넌트: 브라우저에서 `fetch('/api/...')` → 로딩·에러·빈 상태를 직접 처리한다 (장바구니)
- 느린 서버·실패를 흉내 내서 로딩·에러 화면을 확인한다

## 세부 단계
- [x] **6-1** Route Handler 목 API: `/api/products`(검색·필터·정렬·ids), `/api/products/[id]`, `/api/categories`. 서버 전용 데이터 계층, 지연·실패 흉내
- [x] **6-2** 목록: 서버 컴포넌트에서 데이터 받기 + Suspense 스트리밍. 브라우저 번들에서 상품 데이터 빼기
- [x] **6-3** 장바구니: 클라이언트에서 fetch — 로딩·에러·재시도, 요청 취소(AbortController)
- [x] **6-4** Storybook: MSW로 API 흉내 (fetch하는 컴포넌트의 스토리)

---

## 6-1. Route Handler 목 API

### 구조
```
서버 컴포넌트(page.tsx) ──직접 호출──▶ lib/products.ts ──▶ data/products.ts (Step 8: DB)
                                        ▲  (import 'server-only')
브라우저('use client') ──fetch──▶ app/api/**/route.ts
```
- 서버 컴포넌트는 이미 서버에 있으므로 **자기 API를 fetch하지 않고** 데이터 함수를 바로 부른다. (Next.js 공식 문서: 서버에서 자기 API를 부르면 HTTP 왕복이 한 번 더 생겨 느리고, 빌드 중에는 서버가 없어서 실패한다)
- 브라우저는 서버의 함수를 부를 수 없으니 **주소(API)**로 요청한다.
- 둘 다 같은 `lib/products.ts`를 쓰므로 규칙(걸러내기·정렬)이 한 곳에 있다.

### API 목록
| 주소 | 응답 | 실패 |
|---|---|---|
| `GET /api/products` | `{ items: Product[], total }` | 500 `{ error: { message } }` |
| `?q=무선&category=오디오&sort=price-asc&instock=1` | 목록 화면 주소와 같은 쿼리 이름 | |
| `?ids=1,2,5` | 이 상품들만 (장바구니용, 최대 100개, 정수만) | |
| `GET /api/products/3` | `Product` | 404 / 500 `{ error }` |
| `GET /api/categories` | `{ items: ['전체', ...] }` | 500 `{ error }` |
| `POST` 등 다른 메서드 | | 405 (Next.js가 자동) |

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/app/api/products/route.ts` (새 파일) | 목록 API. 쿼리 → `parseCatalogParams` → `getProducts` |
| `src/app/api/products/[id]/route.ts` (새 파일) | 상품 하나. 없으면 404. `RouteContext<'/api/products/[id]'>`로 params 타입 |
| `src/app/api/categories/route.ts` (새 파일) | 카테고리 목록. `dynamic = 'force-dynamic'` |
| `src/lib/products.ts` | `import 'server-only'`, `getProducts({ filters, ids })`·`getCategories()` 추가. 모든 함수가 `simulateNetwork()`를 먼저 기다림 |
| `src/lib/mockNetwork.ts` (새 파일) | 환경 변수 `MOCK_API_DELAY_MS`·`MOCK_API_ERROR_RATE`로 지연·실패 흉내. 빌드 중에는 꺼짐 |
| `src/lib/apiResponse.ts` (새 파일) | `errorResponse`·`serverErrorResponse` — 실패 응답 모양 통일, 원인은 서버 로그에만 |
| `src/types/api.ts` (새 파일) | `ProductListResponse`·`CategoryListResponse`·`ApiErrorResponse` — 서버와 브라우저가 같은 타입 |
| `src/lib/catalogParams.ts` | `categories`에 `null`을 주면 카테고리 검사 생략 (API용) |
| `package.json` | `server-only` 추가 |

### 핵심 개념

**1. Route Handler — 데이터를 돌려주는 파일**
- `page.tsx`가 화면(HTML)을 돌려준다면 `route.ts`는 데이터(JSON)를 돌려준다. 폴더 경로가 주소가 된다(`app/api/products/route.ts` → `/api/products`).
- 함수 이름이 HTTP 메서드다. `export async function GET(request)` → GET 요청이 오면 실행, 없는 메서드는 405.
- 웹 표준 `Request`/`Response`를 그대로 쓴다. `Response.json(객체, { status })`가 JSON 문자열 + `Content-Type` 헤더를 만들어 준다.
- 같은 폴더에 `page.tsx`와 `route.ts`를 함께 둘 수 없다. 그래서 API는 `app/api/` 아래에 모았다.

**2. 상태 코드로 결과를 알린다**
- 없는 상품을 `200 null`로 보내지 않고 **404**, 서버 문제는 **500**. 받는 쪽이 `response.ok`(200번대인지)만 보고 성공·실패를 나눌 수 있다(6-3).
- 실패 응답은 항상 `{ error: { message } }` 한 모양. 자세한 원인(스택, 파일 경로)은 서버 로그에만 남기고 밖으로 보내지 않는다.

**3. 주소로 들어온 값은 믿지 않는다 (Step 4-2와 같은 원칙)**
- `ids=1,x,3` → 정수만 `[1, 3]`, 최대 100개. `sort=abc` → 기본 정렬.
- 카테고리는 API에서는 검사하지 않는다. 없는 카테고리를 요청하면 **결과 0개**가 정답이다. 처음엔 카테고리 목록을 먼저 조회해서 검사했는데, 그러면 데이터 조회가 두 번이라 지연 흉내(1.2초)가 2.4초가 됐다 → 화면(목록 페이지)에서만 '전체'로 바꿔 준다.

**4. `import 'server-only'` — 서버 코드가 브라우저로 새는 것을 막기**
- 데이터 접근(나중엔 DB 비밀번호가 든 환경 변수)은 서버에만 있어야 한다. 이 한 줄이 있는 파일을 `'use client'` 쪽에서 import하면 **빌드가 실패**한다.
- 확인: 임시로 클라이언트 컴포넌트에서 `lib/products`를 import → `You're importing a module that depends on "server-only"` 빌드 에러 → 되돌림.

**5. 느린 서버·실패 흉내 — 환경 변수**
```bash
MOCK_API_DELAY_MS=1500 npm run dev          # 모든 데이터 조회 1.5초
MOCK_API_ERROR_RATE=0.3 npm run dev         # 30% 확률로 실패
```
`.env.local`에 적어 두어도 된다(커밋 안 됨). 빌드 중(`NEXT_PHASE`)에는 꺼진다 — 실패 확률 때문에 빌드가 무작위로 깨지지 않게.

### 확인 방법
```bash
npm run build && npx next start -p 3100
curl 'localhost:3100/api/products?category=오디오&sort=price-desc'
curl -i localhost:3100/api/products/999          # 404
curl -X POST -i localhost:3100/api/products      # 405
MOCK_API_DELAY_MS=1200 MOCK_API_ERROR_RATE=1 npx next start -p 3100   # 1.2초 뒤 500
```

검증 결과 (2026-10-04)
- 빌드: `ƒ /api/products`, `ƒ /api/products/[id]`, `ƒ /api/categories`
- 전체 12개 / 오디오·가격 높은 순 3개 / `q=무선&instock=1` 2개 / `ids=2,x,5,999` → 2·5 / `sort=abc` → 기본 정렬 / `category=nope` → 0개
- `/api/products/2` 200, `/999`·`/02` 404, POST 405, `/api/categories` 7개
- 지연 1.2초: 응답 1.21초(한 번만 기다림). 실패 100%: 500 `{"error":{"message":"상품 목록을 불러오지 못했습니다."}}`, 서버 로그에 원인
- `server-only` 빌드 차단 확인
- `tsc`·ESLint·Stylelint·Prettier 통과

### 다음
- 목록 화면은 아직 `ProductCatalog`('use client')가 데이터 파일을 직접 import한다 → 6-2

---

## 6-2. 목록 — 서버 컴포넌트에서 데이터 받기

### 바뀐 흐름
```
예전: ProductCatalog('use client') ── import ──▶ data/products.ts   (상품 데이터가 브라우저 JS 번들에)
지금: (catalog)/page.tsx (서버)
       └ <Suspense fallback={<CatalogSkeleton />}>
           └ CatalogData (async 서버 컴포넌트)
               await Promise.all([getProducts(), getCategories()])   ← lib/products.ts 직접 호출
               └ <ProductCatalog products={...} categories={...} />   ← props로 넘김
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/app/(catalog)/page.tsx` | `CatalogData`(async 서버 컴포넌트)를 Suspense 안에 두고 데이터를 받아 넘김 |
| `src/components/ProductCatalog.tsx` | `products`·`categories`를 props로. 데이터 파일 import 제거. `useMemo` 의존성에 `products` 추가 |
| `src/app/dev/skeleton/page.tsx`·`SkeletonPreview.tsx` | 같은 방식으로 데이터를 받아 넘김 |

### 핵심 개념

**1. 서버 컴포넌트는 async로 데이터를 기다릴 수 있다**
`async function CatalogData() { const data = await getProducts() ... }` — useEffect·로딩 state 없이 그냥 `await`. 서버에서 끝까지 만든 결과(HTML)가 브라우저로 간다. 클라이언트 컴포넌트는 async가 될 수 없다(6-3에서 비교).

**2. 스트리밍 — 기다리는 부분만 Suspense 안에**
- `page`에서 바로 `await`하면 데이터가 올 때까지 **아무것도** 보내지 못한다(흰 화면).
- 기다리는 부분을 `CatalogData`로 빼서 `<Suspense>` 안에 두면: ① 틀(h1 + 스켈레톤)을 먼저 보내고 ② 데이터가 준비되면 같은 응답에 이어서 목록을 보낸다. 브라우저가 스켈레톤 자리를 목록으로 바꿔 끼운다.
- 4-3a에서 "홈 첫 로딩 1프레임 스켈레톤은 Step 6에서 재검토"라고 했던 그 Suspense가 이제 실제 역할을 한다.

**3. `Promise.all` — 서로 상관없는 요청은 동시에**
상품과 카테고리를 하나씩 `await`하면 지연이 더해진다(1초 + 1초). `Promise.all`로 동시에 보내면 둘 중 긴 쪽만큼(1초). 앞 요청 결과가 뒤 요청에 필요할 때만 순서대로 기다린다. (순서대로 기다리느라 늦어지는 것을 '워터폴'이라 부른다)

**4. 데이터는 props로 — 컴포넌트는 출처를 모른다**
`ProductCatalog`는 이제 데이터가 파일·API·DB 중 어디서 왔는지 모른다. 그래서 출처가 바뀌어도 그대로고, Storybook·테스트에서는 가짜 데이터를 props로 넣으면 된다. 서버 → 클라이언트 props는 JSON으로 바꿀 수 있는 값이어야 한다(Product는 해당).

**5. 실패하면 error.tsx**
`CatalogData`에서 에러가 나면 4-3b의 `(catalog)/error.tsx`가 보이고 '다시 시도'(`retry()`)로 서버에 다시 요청한다. 배포 모드 브라우저 콘솔의 `Minified React error #441`은 "서버 컴포넌트에서 에러가 났지만 메시지는 숨김"이라는 뜻으로, `useReportError`가 기록한 것이다. 실제 원인은 서버 로그에만 남는다(보안상 브라우저에 보내지 않음).

### 확인 방법
```bash
npm run build                                    # / 는 그대로 ƒ
MOCK_API_DELAY_MS=1500 npx next start -p 3100   # 새로고침 → 스켈레톤 1.5초 → 목록
MOCK_API_ERROR_RATE=1 npx next start -p 3100    # 에러 화면
MOCK_API_ERROR_RATE=0.6 npx next start -p 3100  # '다시 시도'를 몇 번 누르면 목록
```

검증 결과 (2026-10-04, 첫 HTML을 조각 단위로 받은 시각 기록)
- 지연 없음: 230ms에 응답 끝, HTML에 상품명 포함
- 지연 1.5초: **171ms**에 스켈레톤 조각 도착 → **1637ms**에 상품명 조각 도착(같은 응답 안에서 이어서). `<html lang="ko">` 정상
- 실패 100%: 브라우저에서 "상품 목록을 불러오지 못했습니다 · 다시 시도 · 검색 조건 초기화"
- 실패 60%: '다시 시도' 0~4번 만에 목록 12개로 복구
- 정상: 필터('오디오') → `?category=오디오&sort=rating`, 3개, 콘솔 에러 0
- `tsc`·ESLint 통과

### 남은 것
- 상품 데이터가 아직 브라우저 JS 묶음에 있다 — layout의 `CartProvider`와 `CartContents`가 데이터 파일을 import하기 때문 → 6-3
- 필터를 바꿀 때 서버에 묻지 않고 받아 둔 전체 상품을 브라우저에서 거른다. 상품이 많아지면 서버에 걸러 달라고 해야 한다 → Step 7

---

## 6-3. 장바구니 — 클라이언트에서 fetch

### 왜 장바구니는 브라우저에서 받나?
장바구니에 **어떤 상품이 들었는지는 브라우저의 localStorage에만** 있다. 서버는 무엇을 보내야 할지 모른다. 그래서 브라우저가 `/api/products?ids=2,5`로 직접 요청한다(Next.js 문서: Storage API에 의존하는 데이터는 클라이언트 fetch).

### 서버 컴포넌트 vs 클라이언트 fetch 비교
| | 서버 컴포넌트 (6-2 목록) | 클라이언트 fetch (6-3 장바구니) |
|---|---|---|
| 데이터 받는 곳 | 서버: `lib/products` 직접 호출 | 브라우저: `fetch('/api/...')` |
| 첫 HTML | 내용이 들어 있음 (검색엔진 OK) | 스켈레톤만 (내용은 JS 실행 후) |
| 기다리는 방법 | `await` + Suspense가 스켈레톤 | 로딩 상태를 직접 계산해서 스켈레톤 |
| 실패 | `error.tsx`가 잡음 | 직접 잡아서 안내 + 다시 시도 |
| 요청 취소 | 필요 없음 | `AbortController` (화면 떠남·조건 바뀜) |
| 비밀 값(DB 비밀번호 등) | 쓸 수 있음 | 절대 안 됨 (브라우저에 다 보임) |
| 언제 쓰나 | 대부분의 화면 데이터 | 브라우저만 아는 값(localStorage·위치·입력 중인 값)에 따라 달라지는 데이터 |

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/api.ts` (새 파일) | 브라우저용 `fetchJson`(`response.ok` 검사, 실패 문구 꺼내기, 네트워크 끊김 → status 0) + `ApiError` + `fetchProductsByIds` |
| `src/components/useCartProducts.ts` (새 파일) | 장바구니 id들의 상품 정보. 아직 안 물어본 id만 요청, `AbortController`, 다시 시도, 상태는 계산(파생) |
| `src/components/CartContents.tsx`·`.module.scss` | 데이터 파일 import 제거 → `useCartProducts`. 로딩 = 스켈레톤, 실패 = `role="alert"` 안내 + 다시 시도(받은 뒤 제목으로 포커스) |
| `src/components/CartProvider.tsx` | 데이터 파일 import 제거 → 저장값의 재고 확인을 `fetchProductsByIds`로. 실패하면 저장값 그대로 사용. 5-3의 eslint 예외 주석 삭제 |

### 핵심 개념

**1. fetch는 404·500이어도 에러를 던지지 않는다**
`fetch`가 실패(reject)하는 건 서버에 **닿지도 못했을 때**(네트워크 끊김)뿐이다. 404·500은 "응답은 받았음"이라 성공으로 끝난다. 그래서 `response.ok`(200번대인지)를 꼭 검사해야 하는데, 컴포넌트마다 쓰면 빠뜨린다 → `lib/api.ts`의 `fetchJson`에서 한 번에 처리하고 `ApiError(status, message)`를 던진다.

**2. 직접 fetch할 때 챙길 것 4가지** (`useCartProducts`)
1. 로딩 — 아직 안 받은 id가 있으면 `'loading'`
2. 에러 — 실패를 기억하고 '다시 시도'(`attempt`를 올려 effect 재실행)
3. 취소 — `AbortController`. effect 정리 함수에서 `abort()` → 화면을 떠났거나 조건이 바뀐 뒤 늦게 온 응답이 화면을 덮어쓰지 않는다
4. 중복 요청 막기 — 이미 물어본 id(`checkedIds`)는 다시 안 묻는다. 수량 변경·삭제로는 요청이 안 나간다
- 로딩·에러 상태를 `setLoading(true/false)`로 켜고 끄지 않고 **계산**한다("안 받은 id가 있으면 로딩"). 끄는 걸 빠뜨리는 버그가 없고, effect 안에서 state를 바로 바꾸지 않아 ESLint 경고도 없다.

**3. 브라우저 번들에서 데이터가 빠졌다**
이제 `data/products.ts`를 import하는 곳은 서버 전용 `lib/products.ts`뿐이다. 빌드 결과 `.next/static/chunks/*.js`에 상품명이 든 파일 **0개**(6-2까지는 1개).

**4. 실패해도 장바구니는 지킨다**
CartProvider가 재고 확인에 실패하면 저장된 값을 정리하지 않고 그대로 쓴다. 장바구니가 통째로 사라지는 것보다 낫고, 재고 한도는 담기·수량 변경 때 reducer가 다시 검사한다.

**5. 다시 시도 후 포커스**
'다시 시도' 버튼은 누르면 스켈레톤으로 바뀌며 사라진다(5-2의 사라지는 버튼 문제) → 응답이 와서 목록이 그려진 뒤 '담은 상품' 제목으로 포커스를 옮긴다.

### 확인 방법
1. 빌드 후 `grep -l "버티컬 무선 마우스" .next/static/chunks/*.js` → 없음
2. 상품을 담고 `/cart` 새로고침 → 개발자 도구 Network에 `/api/products?ids=...`
3. `MOCK_API_DELAY_MS=1500` → 스켈레톤 → 목록 / `MOCK_API_ERROR_RATE=1` → 실패 안내
4. 개발자 도구 Network → Offline → '다시 시도' → "네트워크 연결을 확인해 주세요."

검증 결과 (production 빌드 + headless Chrome, 2026-10-04)
- 상품명이 든 브라우저 JS 파일: 1개 → **0개**
- 정상: `/cart` 목록·합계(₩717,000)·배지 3개, 콘솔 0
- 지연 1.5초: 스켈레톤("장바구니를 불러오는 중입니다.") → 목록
- 실패 100%: 안내 + 다시 시도, axe 라이트·다크 위반 0
- 요청 가로채기로 처음 2번 실패(500 / 네트워크 끊김) → 각각 "잠시 후 다시 시도해 주세요." / "네트워크 연결을 확인해 주세요." → 다시 시도 → 목록, 포커스 `H2 담은 상품 2`
- 5-3 검증 다시 실행: 새로고침 유지·탭 동기화·잘못된 값 정리·스켈레톤 크기 일치·콘솔 0
- `tsc`·ESLint 통과

### 발견한 문제 → Step 7에서
- **같은 요청이 두 번**: `/cart`를 열면 `/api/products?ids=2,5`가 2번 나간다(CartProvider 재고 확인 + CartContents 표시용). 서로 결과를 나눠 쓰지 못한다.
- **워터폴**: CartContents는 CartProvider가 끝난 뒤(hydrated)에야 요청을 시작한다. 지연 1.5초면 1.5 + 1.5 = **약 3.7초** 뒤에 목록이 보인다.
- → 요청 결과를 **주소(키)별로 저장해 두고 나눠 쓰는 캐시**가 있으면 둘 다 해결된다. 그게 TanStack Query다(7-1).
- Storybook의 장바구니 스토리는 API 서버가 없어 실패 화면이 된다 → 6-4 MSW

---

## 6-4. Storybook — MSW로 API 흉내

### 왜 필요한가?
Storybook은 Next.js 서버 없이 컴포넌트만 띄운다. 6-3부터 `CartContents`가 `/api/products`를 fetch하므로, Storybook에서는 받을 곳이 없어 항상 실패 화면이 된다.

**MSW(Mock Service Worker)**는 브라우저의 **서비스 워커**(페이지와 네트워크 사이에서 요청을 가로챌 수 있는 브라우저 기능)로 `fetch` 요청을 가로채, 우리가 정한 응답을 돌려준다.
- 컴포넌트 코드는 그대로다. "Storybook이면 가짜 데이터" 같은 분기를 컴포넌트에 넣지 않는다.
- 서버 오류·네트워크 끊김·끝나지 않는 로딩을 스토리마다 원하는 대로 만든다(실제 서버로는 재현이 어렵다).
- Step 10 테스트(Vitest·Playwright)에서도 같은 핸들러를 쓴다.

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/mocks/handlers.ts` (새 파일) | `handlers`(기본: products·categories) + 상황별 `productsLoading`·`productsServerError`·`productsNetworkError`. 응답 타입은 `types/api.ts`, 걸러내기·정렬은 실제 API와 같은 순수 함수 |
| `.storybook/public/mockServiceWorker.js` (생성) | `npx msw init .storybook/public --save`. 사이트의 `public/`이 아니라 Storybook 전용 폴더 → 실제 배포에 섞이지 않음 |
| `.storybook/main.ts` | `staticDirs`에 `./public` 추가 |
| `.storybook/preview.tsx` | `loaders: [mswLoader()]`(스토리 그리기 전에 워커 시작), `parameters.msw.handlers` 기본값 |
| `src/components/CartContents.stories.tsx` | `Fetching`·`ServerError`·`NetworkError` 스토리 (상품 API만 바꿔 끼움) |
| `src/lib/catalogParams.ts` | `parseIdList` — API와 MSW가 같이 쓰도록 route.ts에서 옮김 |
| `package.json` | `msw`·`msw-storybook-addon`(dev), `msw.workerDirectory` |
| `.prettierignore`·`eslint.config.mjs` | 생성 파일(워커) 제외 |

### 핵심 개념

**1. 핸들러 = "이 주소로 요청이 오면 이렇게 답한다"**
```ts
http.get('/api/products/:id', ({ params }) => HttpResponse.json(product))   // :id = Next.js의 [id]
HttpResponse.json(body, { status: 500 })   // 서버 오류
HttpResponse.error()                       // 응답 없음 = 네트워크 끊김 (fetch가 reject)
await delay('infinite')                    // 영원히 기다림 = 로딩 화면 고정
```

**2. 키 이름별 묶음으로 덮어쓰기**
`preview.tsx`에 `msw: { handlers: { products, categories } }`를 깔고, 스토리는 `msw: { handlers: { products: productsServerError } }`처럼 **바꿀 키만** 적는다. 카테고리 API는 기본값 그대로.

**3. 목은 진짜와 같은 규칙으로**
목 응답이 실제 API와 다르면 Storybook에서는 되는데 실제로는 깨진다. 그래서 응답은 `types/api.ts` 타입으로 검사하고, 걸러내기·정렬·`ids` 해석은 실제 API와 **같은 함수**를 import했다. (`lib/products.ts`는 `server-only`라 브라우저에서 못 쓰므로, 그 안쪽의 순수 함수들을 직접 조합)

**4. 워커 파일 위치**
`public/`에 두면 `next build` 결과에도 `/mockServiceWorker.js`가 생겨 실제 사이트에 섞인다. `.storybook/public`에 두고 Storybook `staticDirs`에만 추가했다. `package.json`의 `msw.workerDirectory`가 이 위치를 기억해서, msw를 업데이트하면 워커 파일도 같이 갱신된다.

### 확인 방법
1. `npm run storybook` → `Cart/CartContents`: Filled(목록) · Fetching(스켈레톤) · ServerError · NetworkError
2. 개발자 도구 콘솔에 `[MSW] Mocking enabled.` (워커가 켜짐)

검증 결과 (2026-10-04)
- Storybook 빌드 결과에 `mockServiceWorker.js` 포함, Next 빌드 결과(`.next/static`)·`public/`에는 없음
- Filled: 목록 3줄·배지 6개 / Fetching: "장바구니를 불러오는 중입니다." / ServerError: "잠시 후 다시 시도해 주세요." / NetworkError: "네트워크 연결을 확인해 주세요." / AtMaxQuantity·Empty 정상
- 스토리 55개 × 라이트/다크 렌더링 정상·axe 위반 0
- `tsc`·ESLint·Prettier 통과

---

## Step 6 정리
| 배운 것 | 어디에 |
|---|---|
| Route Handler로 API 만들기, 상태 코드·실패 응답 통일 | `app/api/**/route.ts`, `lib/apiResponse.ts` |
| 서버 전용 데이터 계층 (`server-only`) | `lib/products.ts` |
| 서버 컴포넌트에서 데이터 받기 + Suspense 스트리밍 + `Promise.all` | `(catalog)/page.tsx` |
| 클라이언트 fetch: `response.ok`, 로딩·에러·다시 시도·취소 | `lib/api.ts`, `useCartProducts` |
| 느린 서버·실패 흉내 (환경 변수) | `lib/mockNetwork.ts` |
| 브라우저에서 API 흉내 (MSW) | `src/mocks/handlers.ts`, Storybook |

### Step 7에서 풀 문제
- `/cart`에서 같은 요청 2번 + 워터폴(지연 1.5초 → 3.7초)
- 목록 필터는 아직 받아 둔 전체 상품을 브라우저에서 거른다. 상품이 많아지면 서버에 '걸러서·나눠서' 달라고 해야 한다 → 검색 debounce, 더 보기
