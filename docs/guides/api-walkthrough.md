# API 연동 따라가기 — 샘플: "상품 3번 가져오기"

> Step 6~8에서 만든 API 연동을 **요청 하나**로 처음부터 끝까지 따라가 본다.
> 샘플로 고른 것은 `GET /api/products/3`(상품 하나). DB → 서버 함수 → API → 브라우저 → 캐시 → 화면이 한 줄로 이어져서, 이 하나만 이해하면 목록 API(`/api/products`)도 같은 구조로 읽힌다.

---

## 0. 한눈에 보기

### 식당 비유
| 식당 | Shoppr | 파일 |
|---|---|---|
| 창고(재료 보관) | DB (SQLite) | `prisma/schema.prisma`, `prisma/dev.db` |
| 주방장(재료 꺼내 요리) | 데이터 계층 | `src/lib/products.ts` |
| 주문 창구 | API (Route Handler) | `src/app/api/products/[id]/route.ts` |
| 주문서 양식 | 응답 타입 | `src/types/api.ts`, `src/types/product.ts` |
| 손님의 주문 담당 직원 | 브라우저용 fetch 함수 | `src/lib/api.ts` |
| 손님 테이블 위 메모(받은 음식 기록) | 캐시 (TanStack Query) | `src/lib/queries.ts`, `src/lib/queryClient.ts` |
| 손님 | 화면 | `useCartProducts.ts` → `CartContents.tsx` |

### 두 갈래 길
같은 "상품 3번"을 **두 곳**에서 가져간다. 길은 다르지만 마지막엔 같은 함수(`getProduct`)를 지난다.

```
[A] 상세 페이지 /products/3  (서버 컴포넌트)
    products/[id]/page.tsx ──직접 호출──▶ lib/products.ts getProduct('3') ──▶ DB
                                          (HTTP 없음. 서버 안에서 함수 호출)

[B] 장바구니 /cart  (브라우저)
    CartContents ─▶ useCartProducts ─▶ TanStack Query 캐시 ['products','detail',3]
        └ 캐시에 없으면 ─▶ lib/api.ts fetchProduct(3) ──HTTP GET /api/products/3──▶
              app/api/products/[id]/route.ts ─▶ lib/products.ts getProduct('3') ─▶ DB
```

**왜 두 갈래인가?**
- 상세 페이지는 누가 보든 같은 내용이고 검색엔진에도 보여야 한다 → 서버가 미리 받아 **HTML에 넣는다**.
- 장바구니는 무엇을 담았는지가 **브라우저의 localStorage에만** 있다 → 서버는 뭘 보낼지 모르니 브라우저가 직접 요청한다.

---

## 1. 창고 — DB 설계 (`prisma/schema.prisma`)

```prisma
model Product {
  id       Int    @id @default(autoincrement())   // 기본 키, 자동 번호
  name     String
  price    Int                                     // 돈은 정수로 (소수 오차 방지)
  category String
  rating   Float  @default(0)
  stock    Int    @default(0)
  imageSrc    String?                              // ?: 비어도 됨 (이미지 없는 상품)
  imageWidth  Int?
  imageHeight Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([category])                              // 카테고리로 거르는 조회를 빠르게
}
```
- `model` 하나 = 테이블 하나, 필드 = 열.
- 화면 타입(`types/product.ts`)과 **모양이 다르다**: DB는 이미지를 열 3개로 저장하고, 화면은 `image: { src, width, height }` 객체 하나를 쓴다. 이 차이는 3단계의 `toProduct`가 메운다.

DB에 접속하는 객체는 `src/lib/db.ts`의 `prisma` 하나뿐이다. 서버 코드는 모두 이걸 import한다.

---

## 2. 주방장 — 데이터 계층 (`src/lib/products.ts`)

```ts
import 'server-only'   // ← 브라우저 코드에서 import하면 빌드 실패 (DB 접근이 새어 나가지 않게)

export async function getProduct(id: string): Promise<Product | undefined> {
  await simulateNetwork()                        // (선택) 느린 서버·실패 흉내 — 6장
  if (!/^[1-9]\d*$/.test(id)) return undefined   // '03', 'abc', '3.0' 같은 주소는 거절
  const row = await prisma.product.findUnique({ where: { id: Number(id) } })
  return row ? toProduct(row) : undefined        // DB 행 → 화면용 Product
}

function toProduct(row: ProductRow): Product {
  const { id, name, price, category, rating, stock, imageSrc, imageWidth, imageHeight } = row
  const product: Product = { id, name, price, category, rating, stock }
  if (imageSrc && imageWidth && imageHeight) {
    product.image = { src: imageSrc, width: imageWidth, height: imageHeight }
  }
  return product                                 // createdAt 같은 DB 전용 열은 내보내지 않는다
}
```

**포인트**
| 줄 | 왜 |
|---|---|
| `import 'server-only'` | DB 비밀번호·DB 접근 코드가 브라우저 JS에 섞이는 사고를 **빌드 단계에서** 막는다 |
| `id: string` | 주소에서 온 값은 항상 문자열이다(`/products/3` → `'3'`) |
| 정규식 검사 | `Number('03')`도 3이 되어 같은 상품이 여러 주소로 열리는 것(중복 콘텐츠)을 막는다 |
| 없으면 `undefined` | "없음"은 에러가 아니라 정상적인 답. 404로 바꾸는 건 부르는 쪽이 정한다 |
| `toProduct` | DB 모양 ↔ 화면 모양 "통역". DB 구조가 바뀌어도 여기만 고친다 |

> **이 파일이 핵심인 이유:** Step 8-2에서 목 데이터 → DB로 바꿀 때 **이 파일 안쪽만** 바꿨다. 함수 이름·인자·돌려주는 모양이 같아서 API·페이지·화면은 한 줄도 안 고쳤다. (교체 전후 API 응답 24가지 완전 일치 확인)

---

## 3. 갈래 [A] — 서버 컴포넌트는 함수를 바로 부른다 (`src/app/products/[id]/page.tsx`)

```tsx
export default async function ProductDetailPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params          // /products/3 → '3'
  const product = await getProduct(id) // ← fetch가 아니라 함수 호출
  if (!product) notFound()             // 없으면 404 화면
  return <ProductDetail product={product} />
}
```
- 서버 컴포넌트는 이미 서버에 있다. 자기 API(`/api/products/3`)를 fetch하면 **서버가 자기한테 HTTP로 한 번 더 왕복**하는 셈이라 느리고, 빌드 중에는 서버가 없어서 실패한다.
- `async` + `await`만으로 끝. 로딩 state가 필요 없다(기다리는 동안은 같은 폴더의 `loading.tsx` 스켈레톤).

**여기서 갈래 [A]는 끝이다.** 나머지는 브라우저 갈래 [B]를 따라간다.

---

## 4. 주문 창구 — API (`src/app/api/products/[id]/route.ts`)

```ts
export async function GET(_request: NextRequest, context: RouteContext<'/api/products/[id]'>) {
  try {
    const { id } = await context.params                        // 주소의 [id] 자리 → '3'
    const product = await getProduct(id)                       // 2장의 같은 함수
    if (!product) return errorResponse(404, '상품을 찾을 수 없습니다.')
    return Response.json(product)                              // 200 + JSON
  } catch (error) {
    return serverErrorResponse(error, '상품 정보를 불러오지 못했습니다.')  // 500
  }
}
```

| 개념 | 설명 |
|---|---|
| 폴더 = 주소 | `app/api/products/[id]/route.ts` → `/api/products/:id` (페이지와 같은 규칙) |
| 함수 이름 = 요청 방식 | `GET`을 export하면 GET 요청에 실행. `POST` 등 없는 방식은 Next.js가 자동으로 405 |
| `Response.json(값, { status })` | JSON 글자 + `Content-Type` 헤더를 만들어 준다 (웹 표준) |
| 상태 코드 | 200 성공 / 404 없음 / 500 서버 문제. 받는 쪽이 **본문을 열지 않고** 결과를 안다 |

### 실패 응답은 한 모양 (`src/lib/apiResponse.ts`)
```ts
export function errorResponse(status: number, message: string) {
  return Response.json({ error: { message } }, { status })   // 항상 { error: { message } }
}
export function serverErrorResponse(error: unknown, message: string) {
  console.error(error)          // 자세한 원인은 서버 로그에만
  return errorResponse(500, message)   // 밖으로는 일반 문구만 (내부 구조가 새지 않게)
}
```

### 실제 응답
```bash
curl -i localhost:3000/api/products/3
# HTTP/1.1 200 OK
# {"id":3,"name":"Powder Canister","price":21000,"category":"뷰티","rating":4.64,"stock":89,
#  "image":{"src":"https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp","width":1000,"height":1000}}
# (Step 8-4부터 DummyJSON 데이터. SEED_DATA=mock으로 시드하면 예전 목 데이터 "휴대용 블루투스 스피커")

curl -i localhost:3000/api/products/03     # 404 — '03' 같은 주소는 거절 (2장 정규식)
curl -i -X POST localhost:3000/api/products/3   # 405 — GET만 만들었으므로

curl -i localhost:3000/api/products/999
# HTTP/1.1 404 Not Found
# {"error":{"message":"상품을 찾을 수 없습니다."}}
```

### 주문서 양식 — 타입 공유 (`src/types/api.ts`, `src/types/product.ts`)
서버(route.ts)와 브라우저(lib/api.ts)가 **같은 타입 파일**을 import한다. 서버에서 필드 이름을 바꾸면 브라우저 코드에 바로 빨간 줄이 생긴다. 따로 적어 두면 한쪽만 바뀌어 실행 중에야 깨진다.

---

## 5. 주문 담당 직원 — 브라우저의 fetch (`src/lib/api.ts`)

### 함정: fetch는 404·500이어도 에러를 던지지 않는다
`fetch`가 실패(reject)하는 건 **서버에 닿지도 못했을 때**(네트워크 끊김)뿐이다. 404·500은 "응답은 받았음"이라 성공으로 끝난다. → `response.ok`(200번대인지)를 꼭 검사해야 하는데, 컴포넌트마다 쓰면 빠뜨린다. 그래서 한 곳에 모았다.

```ts
export class ApiError extends Error {   // 기본 Error + status(상태 코드)
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export async function fetchJson<T>(url: string, { signal } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (signal?.aborted) throw error                          // 취소는 실패가 아님
    throw new ApiError(0, '네트워크 연결을 확인해 주세요.')     // 서버에 못 닿음 → status 0
  }
  if (!response.ok) {                                         // 404·500 등
    const body = await response.json().catch(() => null)      // 4장의 { error: { message } } 읽기
    throw new ApiError(response.status, body?.error?.message ?? '요청을 처리하지 못했습니다.')
  }
  return (await response.json()) as T                         // <T>: 받을 데이터 타입은 부르는 쪽이 정함
}

export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product | null> {
  try {
    return await fetchJson<Product>(`/api/products/${id}`, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null   // 없음 = 정상적인 답
    throw error                                                          // 500·네트워크 = 진짜 실패
  }
}
```

**경우별로 어떻게 되나**
| 상황 | fetch | fetchJson | fetchProduct | 화면 |
|---|---|---|---|---|
| 200 | 성공 | Product 반환 | Product | 목록에 표시 |
| 404 (판매 종료) | 성공 | `ApiError(404)` | **`null`** | 장바구니에서 조용히 빠짐 |
| 500 | 성공 | `ApiError(500, '상품 정보를…')` | 그대로 던짐 | "잠시 후 다시 시도해 주세요" + 다시 시도 |
| 네트워크 끊김 | **실패** | `ApiError(0, '네트워크…')` | 그대로 던짐 | "네트워크 연결을 확인해 주세요" + 다시 시도 |

> 404를 `null`로 바꾸는 이유: 에러로 던지면 상품 하나 때문에 **장바구니 전체**가 "불러오지 못했습니다"가 된다. 없는 상품은 빼면 된다.

---

## 6. 손님 테이블 위 메모 — 캐시 (`src/lib/queries.ts`, `src/lib/queryClient.ts`)

### 왜 캐시가 필요했나 (Step 6-3 → 7-1)
직접 fetch하던 6-3에서는 `/cart`를 열면 **같은 요청이 두 번**(CartProvider 재고 확인 + 화면 표시) 나갔고, 둘이 **순서대로** 나가서(워터폴) 서버가 1.5초 느리면 목록이 3.7초 뒤에 보였다.
→ "받은 결과를 이름표 붙여 저장해 두고, 같은 이름표면 다시 요청하지 않는다" = **캐시**. 이걸 해 주는 도구가 TanStack Query.

### 쿼리 정의 — 이름표(키)와 가져오는 방법을 한 묶음으로
```ts
export const productQueries = {
  all: ['products'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...productQueries.all, 'detail', id] as const,   // ['products', 'detail', 3]
      queryFn: ({ signal }) => fetchProduct(id, signal),          // 5장의 함수. signal = 취소용
      retryOnMount: false,
    }),
}
```
- **쿼리 키 = 캐시 이름표.** 같은 키를 쓰는 곳이 여러 군데여도 요청은 **한 번**, 결과는 함께 쓴다.
- 키는 넓은 것 → 좁은 것 순서의 배열. `['products']`로 상품 관련 캐시를 한꺼번에 지울 수 있다.
- 키를 여기 **한 곳**에서만 만든다. 여기저기서 손으로 쓰면 오타 하나로 캐시를 못 나눠 쓴다.

### 저장소 설정 (`queryClient.ts`)
| 설정 | 값 | 이유 |
|---|---|---|
| `staleTime` | 60초 | 받은 데이터를 60초간 "신선"하다고 보고 다시 요청 안 함 (기본 0이면 화면에 나타날 때마다 요청) |
| `retry` | 1 | 실패 시 자동 재시도 1번 (기본 3번이면 실패 화면까지 7초 가까이) |
| 서버/브라우저 | 서버는 요청마다 새로, 브라우저는 하나 | 서버에서 공유하면 다른 사용자 데이터가 섞일 수 있음 |

---

## 7. 손님 — 화면 (`useCartProducts.ts` → `CartContents.tsx`)

### 훅: 상품마다 쿼리 하나씩 (`src/components/useCartProducts.ts`)
```ts
export function useCartProducts(ids: number[], enabled = true) {
  return useQueries({
    queries: ids.map((id) => ({ ...productQueries.detail(id), enabled })),   // 상품별 키
    combine: (results) => {                                                  // 여러 결과 → 화면용 값 하나
      const products = results.flatMap((r) => (r.data ? [r.data] : []))     // null(404)은 뺌
      const failed = results.filter((r) => r.isError)
      const error = failed[0]?.error ?? null
      let status = 'success'
      if (error) status = 'error'
      else if (results.some((r) => r.isPending)) status = 'loading'
      return { products, status, error, retry: () => failed.forEach((r) => r.refetch()) }
    },
  })
}
```
**왜 상품마다 키를 따로?** `['products','byIds','2,5']`처럼 묶으면 하나만 빼도 키가 바뀌어 **전부 다시** 받는다. 따로 두면 수량 변경·삭제 → 요청 0, 새로 담은 상품 → 그것만 요청.

### 같은 키를 미리 채워 두는 쪽 (`src/components/CartProvider.tsx`)
```ts
Promise.all(saved.map((item) => queryClient.fetchQuery(productQueries.detail(item.productId))))
```
사이트에 들어오면 CartProvider가 저장된 장바구니의 재고를 확인하려고 **같은 키**로 미리 받아 둔다. 곧이어 `/cart`를 열면 `useCartProducts`가 캐시에서 바로 그린다 → 중복 요청·워터폴 해결 (지연 1.5초 기준 **3.7초 → 1.7초**).

### 화면: 상태 4가지 (`src/components/CartContents.tsx`)
| 상태 | 화면 | 접근성 |
|---|---|---|
| 불러오기 전·받는 중 | `CartSkeleton` (실제와 크기 같은 회색 자리) | sr-only "불러오는 중" |
| 실패 | `InlineError` — 문구 + 다시 시도 | 네트워크 끊김(status 0)이면 문구를 다르게. 다시 시도 후 목록 제목으로 포커스 |
| 비어 있음 | "장바구니가 비어 있습니다" + 상품 보러 가기 | |
| 성공 | 목록 + 주문 요약 | |

---

## 8. 요청 하나의 일생 (시간 순서)

사용자가 `/cart`를 열었을 때, 장바구니에 상품 3번이 있다면:

```
 1. 브라우저 CartProvider      localStorage에서 [{productId: 3, quantity: 1}] 읽음
 2.          〃                queryClient.fetchQuery(['products','detail',3])
 3. TanStack Query             캐시에 키가 없음 → queryFn 실행
 4. lib/api.ts                 fetchProduct(3) → fetchJson('/api/products/3')
 5. ─────── HTTP GET /api/products/3 ───────▶
 6. 서버 route.ts              GET() 실행, params.id = '3'
 7. lib/products.ts            simulateNetwork() → 정규식 통과 → prisma.product.findUnique
 8. DB                         행 하나 반환 → toProduct()로 화면 모양으로
 9. route.ts                   Response.json(product) → 200
10. ◀────── 200 { id: 3, name: ... } ───────
11. fetchJson                  response.ok = true → JSON 반환
12. TanStack Query             캐시 ['products','detail',3]에 저장 (60초 신선)
13. CartContents               useCartProducts → 같은 키 → 캐시에 있음 → 요청 없이 status 'success'
14. 화면                       스켈레톤 → 목록으로 교체
```
60초 안에 다시 `/cart`에 오면 5~11번이 통째로 생략된다.

---

## 9. 개발 중 확인하는 방법

### 느린 서버·실패 흉내 (`src/lib/mockNetwork.ts`)
2장의 `simulateNetwork()`가 환경 변수를 읽는다. `.env.local`에 적거나 명령 앞에 붙인다.
```bash
MOCK_API_DELAY_MS=1500 npm run dev     # 모든 조회 1.5초 → 스켈레톤 확인
MOCK_API_ERROR_RATE=1 npm run dev      # 항상 500 → 실패 화면 확인
MOCK_API_ERROR_RATE=0.5 npm run dev    # 반반 → '다시 시도'로 복구되는지
```
(빌드 중에는 꺼진다 — 빌드가 무작위로 실패하지 않게)

### 브라우저 개발자 도구
- **Network 탭:** `/cart` 새로고침 → `/api/products/3`이 **한 번만** 나가는지. Offline으로 바꾸고 '다시 시도' → "네트워크 연결을 확인해 주세요"
- **TanStack Query Devtools** (`npm run dev`일 때 화면 구석 꽃 아이콘): `["products","detail",3]` 키, 신선/오래됨 상태

### Storybook — MSW (`src/mocks/handlers.ts`)
Storybook에는 Next.js 서버가 없어서 `/api/products/3`에 답할 곳이 없다. MSW가 브라우저 안에서 요청을 가로채 **진짜 API와 같은 모양**으로 답한다.
```ts
http.get('/api/products/:id', ({ params }) => {             // :id = Next.js의 [id]
  const product = products.find((p) => String(p.id) === params.id)
  if (!product) return HttpResponse.json({ error: { message: '상품을 찾을 수 없습니다.' } }, { status: 404 })
  return HttpResponse.json(product)
})
```
스토리마다 `productsLoading`(끝나지 않는 로딩)·`productsServerError`(500)·`productsNetworkError`(끊김)로 바꿔 끼운다. 컴포넌트 코드는 그대로.

---

## 10. 새 API를 만든다면 — 순서 체크리스트

예: "상품 리뷰 목록" `GET /api/products/3/reviews`를 만든다면, 이 문서의 순서 그대로다.

1. **DB** — `schema.prisma`에 `Review` 모델 → `npm run db:migrate`
2. **화면 타입** — `src/types/`에 `Review`, 응답 타입은 `types/api.ts`에 (`{ items, total }`처럼 객체로 감싸기 — 나중에 필드 추가 가능)
3. **데이터 함수** — `lib/`에 `getReviews(productId)` (`server-only`, 들어온 값 검사, DB 행 → 화면 모양 변환)
4. **API** — `app/api/products/[id]/reviews/route.ts`에 `GET`. 성공 `Response.json`, 실패 `errorResponse`/`serverErrorResponse`
5. **어디서 받을지 결정**
   - 누구나 같은 내용·검색엔진 필요 → 서버 컴포넌트에서 3번 함수를 **직접** 호출 (6까지 건너뜀)
   - 브라우저만 아는 값에 따라 다름 → 6번으로
6. **브라우저 fetch** — `lib/api.ts`에 `fetchReviews(id, signal)` (`fetchJson` 사용)
7. **쿼리 정의** — `lib/queries.ts`에 `reviewQueries.list(productId)` (키 `['reviews', 'list', productId]`)
8. **화면** — `useQuery(reviewQueries.list(id))` → 로딩(스켈레톤)·실패(`InlineError`)·비어 있음·성공 4가지
9. **MSW** — `src/mocks/handlers.ts`에 같은 모양으로 핸들러 + 스토리
10. **확인** — curl(200·404), `MOCK_API_DELAY_MS`·`MOCK_API_ERROR_RATE`, Network 탭, axe

---

## 11. 면접용 요약 (30초)

> "API는 Next.js Route Handler로 만들고, 상태 코드와 실패 응답 모양을 통일했습니다. 데이터 접근은 서버 전용 파일 하나로 모아서, 목 데이터를 Prisma DB로 바꿀 때 그 파일만 고쳤고 API 응답 24가지가 전후로 같은 것을 확인했습니다.
> 누구나 같은 데이터는 서버 컴포넌트에서 직접 받아 HTML에 넣고, 장바구니처럼 브라우저만 아는 값에 따라 달라지는 데이터는 브라우저에서 받았습니다. 처음엔 fetch를 직접 다뤄 로딩·에러·취소·중복 방지를 구현했는데, 같은 요청이 두 번 나가고 워터폴로 3.7초가 걸리는 문제를 발견해 TanStack Query의 키별 캐시로 바꿔 1.7초로 줄였습니다."

---

### 관련 문서
- `docs/steps/step-06.md` — Route Handler, 서버 vs 클라이언트 fetch, MSW
- `docs/steps/step-07.md` — TanStack Query, prefetch + hydration(목록), debounce, 더 보기
- `docs/steps/step-08.md` — Prisma DB 교체, Server Actions
- `docs/guides/project-structure.md` — 폴더·파일 역할
