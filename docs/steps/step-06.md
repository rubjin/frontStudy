# Step 6. API 연동 — Route Handler 목 API, 서버 vs 클라이언트에서 데이터 받기

> 상태: 진행 중 (6-1 완료)

## 목표
지금까지 상품 데이터는 `data/products.ts` 파일을 **화면 코드가 직접 import**했다. 브라우저 코드(`'use client'`)도 import해서 상품 데이터 전체가 자바스크립트 번들에 들어 있었다. 실제 서비스는 데이터가 서버(API·DB)에 있고, 화면은 그것을 **요청해서 받아야** 한다.

- 서버에 **API(주소로 데이터를 주는 곳)**를 만든다 — Next.js Route Handler
- 데이터를 **어디서 받을지** 두 가지를 비교한다
  - 서버 컴포넌트: 서버에서 데이터 함수를 바로 부른다 → HTML에 내용이 들어간다 (목록·상세)
  - 클라이언트 컴포넌트: 브라우저에서 `fetch('/api/...')` → 로딩·에러·빈 상태를 직접 처리한다 (장바구니)
- 느린 서버·실패를 흉내 내서 로딩·에러 화면을 확인한다

## 세부 단계
- [x] **6-1** Route Handler 목 API: `/api/products`(검색·필터·정렬·ids), `/api/products/[id]`, `/api/categories`. 서버 전용 데이터 계층, 지연·실패 흉내
- [ ] **6-2** 목록: 서버 컴포넌트에서 데이터 받기 + Suspense 스트리밍. 브라우저 번들에서 상품 데이터 빼기
- [ ] **6-3** 장바구니: 클라이언트에서 fetch — 로딩·에러·재시도, 요청 취소(AbortController)
- [ ] **6-4** Storybook: MSW로 API 흉내 (fetch하는 컴포넌트의 스토리)

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
