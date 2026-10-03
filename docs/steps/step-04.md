# Step 4. 라우팅 심화 — 상품 상세 · URL 상태 · 로딩/에러

> 상태: 진행 중 (4-1, 4-2, 4-3a 완료)

## 목표
Step 3에서 Next.js로 옮기면서 상세 페이지는 "주소의 id를 보여 주는 뼈대"만 만들었다.
Step 4에서는 **주소(URL)를 제대로 다루는 법**을 익힌다.
- 주소마다 다른 내용과 SEO 정보, 없는 주소는 404
- 검색·필터·정렬 상태를 주소에 담아서 새로고침·공유·뒤로 가기에도 유지
- 페이지를 불러오는 중·에러 화면을 구간별로

## 세부 단계
- [x] **4-1** 상품 상세 완성: 데이터 함수, `notFound()`, `generateMetadata`, `generateStaticParams`, 상세 화면 컴포넌트
- [x] **4-2** 검색·카테고리·정렬·품절 숨기기를 `searchParams`(URL 쿼리)로
- [ ] **4-3** `loading.tsx`(구간 로딩 화면)·구간별 `error.tsx`
  - [x] 4-3a `loading.tsx` — 홈·상세 로딩 화면, 라우트 그룹 `(catalog)`
  - [ ] 4-3b 구간별 `error.tsx`

---

## 4-1. 상품 상세 페이지 완성

### 바뀐 구조
```
주소 /products/3
  └ app/products/[id]/page.tsx       ← 주소로 상품 찾기 · 404 · 제목/설명 (데이터 담당)
       ├ lib/products.ts  getProduct('3')   ← 데이터 가져오기 (지금은 목 데이터, Step 6에서 API)
       └ components/ProductDetail.tsx        ← 화면 그리기 (Storybook으로 상태별 확인)
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/products.ts` (새 파일) | `getProduct(id)`: 주소의 id로 상품 찾기 · `getProductIds()`: 미리 만들 주소 목록 |
| `src/components/ProductDetail.tsx` (새 파일) | 상세 화면. 이동 경로, 원본 비율 사진, 상품명(h1)·평점·가격·재고 상태, 목록으로 버튼 |
| `src/components/ProductDetail.module.scss` (새 파일) | 768px 이상 두 칸 배치, 사진 최대 높이 제한, 재고 상태별 색(`[data-status]`) |
| `src/components/ProductDetail.stories.tsx` (새 파일) | 기본 · 품절 임박 · 품절 · 세로 사진 · 가로 사진 · 이미지 없음 · 긴 이름 |
| `src/app/products/[id]/page.tsx` | 뼈대 → `generateStaticParams` + `dynamicParams = false` + `generateMetadata` + `notFound()` |
| `src/app/products/[id]/page.module.scss` | 삭제 (화면이 ProductDetail로 옮겨감) |
| `src/app/not-found.tsx` | 주석만 수정 (없는 상품도 이 화면이 맡음) |

### 핵심 개념

**1. 페이지와 데이터 사이에 함수 한 겹 (`lib/products.ts`)**
```ts
export async function getProduct(id: string): Promise<Product | undefined> {
  return products.find((p) => String(p.id) === id)
}
```
- 페이지가 `products` 배열을 직접 뒤지면, Step 6(API)·Step 8(DB)로 바꿀 때 페이지를 전부 고쳐야 한다. 함수를 거치면 **이 파일 안쪽만** 바꾸면 된다.
- 지금은 바로 끝나는 일인데 `async`인 이유: API·DB는 기다려야 한다. 처음부터 Promise를 돌려주면 나중에 `fetch`로 바꿔도 부르는 쪽(`await getProduct(id)`)은 그대로다.
- **id를 문자열로 비교**: 주소에서 온 값은 항상 문자열이다. `Number(id) === p.id`로 비교하면 `Number('03')`, `Number('3.0')`이 모두 3이 되어 같은 상품이 여러 주소로 열린다(검색엔진은 '중복 콘텐츠'로 본다). `String(p.id) === id`는 `'3'` 하나만 통과시킨다.

**2. `notFound()` — 없으면 404**
```ts
const product = await getProduct(id)
if (!product) notFound()
return <ProductDetail product={product} />   // 여기서 product는 Product 타입 (undefined 아님)
```
- 에러를 던져서 실행을 멈추므로 `return`이 필요 없다. 반환 타입이 `never`라서 TypeScript도 다음 줄의 `product`가 반드시 있다고 안다(타입 좁히기).

**3. `generateMetadata` — 주소마다 다른 제목·설명**
- 고정 제목은 `export const metadata = {...}`, 주소에 따라 다르면 `generateMetadata` 함수.
- 결과: `<title>무선 노이즈캔슬링 헤드폰 | Shoppr</title>`, `<meta name="description" content="오디오 · ₩189,000 · 평점 4.6">`, `og:title`
- 사진 미리보기(`og:image`)는 사이트 전체 주소(`metadataBase`)가 필요해서 배포 단계(Step 11)에서 추가한다.

**4. `generateStaticParams` — 빌드할 때 미리 만들기 (SSG)**
```ts
export async function generateStaticParams() {
  const ids = await getProductIds()
  return ids.map((id) => ({ id }))   // [{ id: '1' }, { id: '2' }, ...]
}
```
빌드 결과가 바뀐다.
```
전: └ ƒ /products/[id]          ← 요청 올 때마다 서버에서 만듦 (Dynamic)
후: └   /products/[id]
      ├ ● /products/1           ← 빌드할 때 HTML을 미리 만들어 둠 (SSG)
      └ ● [+11 more paths]
```
상품 12개는 자주 안 바뀌므로 미리 만들어 두면 요청이 오자마자 완성된 HTML을 보낸다.

**5. Next.js 버그를 만나서 `dynamicParams = false`로 우회** ⚠️
검증하다가 **없는 상품 주소(`/products/999`)에서 다크 모드가 풀리는 것**을 발견했다.

| | `/nope` (맞는 경로 없음) | `/products/999` (page에서 `notFound()`) |
|---|---|---|
| 상태 코드 | 404 | 404 |
| 서버가 보낸 HTML | `<html lang="ko">` + 헤더 + 404 화면 | **`<html id="__next_error__">` + 빈 body** |
| 브라우저 | 정상 | JS가 화면을 처음부터 그림 → `data-theme` 사라짐(다크 모드 풀림), 탭 제목 틀림 |
| JS 꺼짐 | 정상 | 빈 화면 |

원인을 좁혀 간 순서:
1. `generateStaticParams`를 빼도 같음 → 정적 생성 탓이 아님
2. 상품 전용 `not-found.tsx`를 빼도 같음 → 그 파일 탓이 아님
3. 기존 `/dev/skeleton`(production에서 `notFound()`)도 같음 → **page에서 `notFound()`를 부르면 항상**
4. Next.js 소스와 이슈 검색 → **16.3.6의 알려진 미해결 버그** [vercel/next.js#99287](https://github.com/vercel/next.js/issues/99287)
   - 404 화면을 감싸는 경계(`HTTPAccessFallbackBoundary`)가 클라이언트용 에러 경계라서 서버 렌더링 중에는 동작하지 않고, Next가 빈 껍데기로 대신한다.

우회: `export const dynamicParams = false`
- `generateStaticParams`에 없는 id는 page를 실행하지 않고 **'맞는 경로 없음'으로 처리** → `/nope`과 같은 정상 경로로 `app/not-found.tsx`가 나간다.
- 대가 1: 상품 전용 404 문구("상품을 찾을 수 없습니다")를 쓸 수 없어서 만들었던 `products/[id]/not-found.tsx`를 지웠다. 사이트 공통 404가 나온다.
- 대가 2: 빌드 뒤에 추가된 상품은 열리지 않는다. 목 데이터라 지금은 문제없지만, **Step 8(DB)에서 다시 판단**해야 한다. 그때 버그가 고쳐졌으면 `true`로 돌리고 상품 전용 404를 되살린다.
- `notFound()` 코드는 남겼다. 목록과 데이터가 어긋날 때의 안전장치이고, 타입 좁히기에도 필요하다.

> 배운 점: 상태 코드(404)만 보고 "됐다"고 하면 놓친다. **서버가 보낸 HTML**과 **실제 브라우저(다크 모드)**까지 확인해야 보이는 문제가 있다.

**6. 상세 화면의 마크업 (퍼블리셔 포인트)**
- **이동 경로(breadcrumb)**: `<nav aria-label="이동 경로">` + `<ol>` + 마지막 항목 `aria-current="page"`.
  구분 기호 `/`는 CSS `content: '/' / ''`로 그린다. 슬래시 뒤의 `''`는 **대체 텍스트**라서 스크린리더가 "슬래시"라고 읽지 않는다.
- **h1 = 상품명**: 페이지마다 주제가 하나. 목록 카드에서는 h3였던 상품명이 상세에서는 h1.
- **사진 alt**: 목록 카드는 옆에 상품명 링크가 있어서 `alt=""`(장식), 상세는 사진이 주인공이라 `alt={상품명}`.
- **원본 비율 사진**: 카드는 `fill` + `object-fit: cover`(정사각형에 잘라 채우기). 상세는 `width`·`height`를 넘겨 **원본 비율 그대로** + `max-height` + `object-fit: contain`(잘리지 않고 남는 곳은 배경). `width`·`height` 덕분에 사진이 오기 전에도 자리 크기가 정해져서 CLS 0.
- **LCP 사진 먼저 받기**: 상세 사진은 화면에서 가장 큰 요소(LCP)라 `loading="eager"` + `fetchPriority="high"`. (Next.js 16에서 `priority`는 폐지 예정, 문서도 이 두 속성을 권함)
- **재고 상태**: `data-status="low"` 같은 속성으로 상태를 표시하고 SCSS는 `&[data-status='low']`로 색만 바꾼다. 클래스를 조합할 필요가 없다.

### 확인 방법
1. `npm run build` → `/products/[id]` 아래에 `● /products/1` … 12개
2. `/products/1` → 상품명이 제목인 상세 화면, 탭 제목 `무선 노이즈캔슬링 헤드폰 | Shoppr`
3. `/products/11`(세로 사진) → 사진이 잘리지 않고 높이 560px 안에, 좌우에 배경
4. `/products/999`, `/products/abc`, `/products/03` → 404 "페이지를 찾을 수 없습니다". **다크 모드로 바꾼 뒤 열어도** 다크로 보이는지
5. 페이지 소스 보기(`Ctrl+U`)에서 `/products/999`가 `<html lang="ko">`로 시작하는지 (`__next_error__`면 버그 재발)
6. Storybook **Product/ProductDetail** → 품절 임박·품절·사진 비율별 모양

검증 결과 (production 빌드 + headless Chrome, 1280·390px × 라이트·다크)
- 상세 3개 + 404: axe 위반 0, 콘솔 에러 0, CLS 0
- 사진은 화면에 맞는 크기(`w=640`)로 전송
- Storybook ProductDetail 7개 × 라이트·다크: 렌더링·axe 모두 통과

### 알려진 한계 · 다음에 할 일
- ~~홈 화면 제목 순서: axe `heading-order`(h1 다음 바로 카드의 h3)~~ → 4-2에서 카드 상품명을 h2로 바꿔 해결
- **`/dev/skeleton`**도 production에서 같은 `notFound()` 버그로 빈 껍데기를 보낸다. 개발용 페이지라 영향은 작지만 기록해 둔다.
- ~~이동 경로의 카테고리는 글자만~~ → 4-2에서 `/?category=오디오` 링크로 연결
- 장바구니 담기 버튼은 Step 5.

---

## 4-2. 검색·필터·정렬을 주소(URL 쿼리)로

### 왜 필요한가?
Step 3까지 검색어·카테고리·정렬·품절 숨기기는 `ProductCatalog`의 `useState`에 있었다.
- 상품 상세에 갔다가 **뒤로 오면 초기화**된다 (컴포넌트가 새로 만들어지면서 state도 처음 값으로)
- **새로고침**해도 초기화된다
- "오디오 중에 가격 낮은순" 화면을 **링크로 공유할 수 없다**

쇼핑몰은 보통 필터를 주소에 담는다. (`/?category=오디오&sort=price-asc`)
주소가 곧 화면 상태라서, 주소만 있으면 언제든 같은 화면을 다시 만들 수 있다.

### 주소 형식
| 키 | 값 | 기본값 (주소에 안 적음) |
|---|---|---|
| `q` | 검색어 | 없음 |
| `category` | 카테고리 이름 | 전체 |
| `sort` | `price-asc` · `price-desc` · `rating` | 기본순 |
| `instock` | `1` = 품절 상품 숨기기 | 보이기 |

예) `/?q=무선+이어폰` (띄어쓰기는 `+`), `/?category=오디오&sort=price-asc`, 처음 화면은 그냥 `/`

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/catalogParams.ts` (새 파일) | `parseCatalogParams`: 주소 → 필터 값 (잘못된 값은 기본값으로) · `toCatalogSearch`: 필터 값 → `?q=...` |
| `src/components/ProductCatalog.tsx` | `useState` 4개 제거 → `useSearchParams`로 읽고 `window.history`로 쓰기 |
| `src/app/page.tsx` (4-3a에서 `app/(catalog)/page.tsx`로 이동) | `await connection()` 추가 → 요청마다 서버에서 만듦 (빌드 결과 `○ /` → `ƒ /`) |
| `src/components/Card.tsx` | 상품명 h3 → h2 (홈의 제목 순서 문제 해결) |
| `src/components/ProductDetail.tsx` | 이동 경로의 카테고리를 `/?category=...` 링크로 |
| `src/pages/` (빈 폴더) | 삭제. Vite 시절 남은 빈 폴더라 Git에는 없었지만, Next.js가 Pages Router가 섞인 프로젝트로 보고 타입을 바꿨다 (아래 핵심 개념 6) |

### 핵심 개념

**1. 주소가 유일한 원본 (single source of truth)**
```tsx
// 전 (Step 3)                              // 후 (Step 4-2)
const [query, setQuery] = useState('')     const searchParams = useSearchParams()
const [category, setCategory] = ...        const { query, category, sort, hideSoldOut } =
const [sort, setSort] = ...                  parseCatalogParams(searchParams, categories)
const [hideSoldOut, ...] = ...
```
- 같은 값을 state와 주소 **두 곳에 두면 어긋나기 쉽다**(뒤로 가기를 하면 주소는 바뀌었는데 state는 그대로…). 그래서 state를 없애고 주소만 본다.
- 흐름: 입력 → 주소를 바꿈 → `useSearchParams`가 새 값을 줌 → 다시 그려짐

**2. 주소 쓰기: `router.push`가 아니라 `window.history`**
| | `router.push` / `replace` | `window.history.pushState` / `replaceState` |
|---|---|---|
| 하는 일 | 페이지 이동 → 서버에 새 화면(RSC) 요청 | 주소만 바꿈, 서버 요청 없음 |
| `useSearchParams` | 갱신됨 | Next.js가 감지해서 갱신해 줌 (공식 문서의 방법) |
| 이번에 맞는 경우 | 서버가 데이터를 다시 만들어야 할 때 | 브라우저에 있는 데이터로 거르기만 할 때 ✔ |

검색어 한 글자마다 서버에 요청할 필요가 없다. 확인 결과 필터를 바꿀 때 서버 요청 **0건**.
(Step 6에서 API로 바꾸면 "주소가 바뀌면 다시 가져오기"를 붙이고, Step 7에서 검색어 debounce를 다룬다)

**3. push와 replace — "뒤로 가기"의 경험 설계**
| 동작 | 방식 | 뒤로 가기를 누르면 |
|---|---|---|
| 카테고리·정렬·품절 숨기기 | `pushState` (기록에 쌓음) | 직전 선택으로 돌아감 |
| 검색어 입력 | `replaceState` (기록을 덮어씀) | 검색 전 화면으로 (글자마다 뒤로 가기 X) |

'무', '무선', '무선 이'… 글자마다 기록이 쌓이면 뒤로 가기를 열 번 눌러야 한다.

**4. 주소는 믿지 않는다 — 읽을 때 검사**
주소는 누구나 고칠 수 있다. `?sort=abc&category=없음` → `sort`는 목록에 없으니 기본순, `category`도 실제 카테고리가 아니니 전체.
검사 없이 쓰면 칩이 하나도 선택되지 않은 채 빈 화면이 되거나, 정렬 함수가 엉뚱하게 동작할 수 있다.

**5. 첫 HTML에 목록 넣기 — `connection()`**
- 홈은 원래 빌드할 때 미리 만든 페이지(○)였다. 그런데 미리 만들 때는 **주소의 쿼리를 모른다.**
- 그 상태에서 `useSearchParams`를 쓰면 Next.js는 목록 부분을 HTML에서 빼고 브라우저에서 그린다 → 처음엔 스켈레톤만 보이고, **HTML에 상품 목록이 없다** (검색엔진·느린 기기에 불리).
- `await connection()` = "요청이 올 때까지 기다려라(미리 만들지 마라)". 요청마다 서버에서 만들어서 `/?category=오디오`의 HTML에 오디오 상품 3개가 들어간다.
- 대가: 요청마다 서버가 일한다. 상품 12개를 거르는 정도라 부담은 거의 없다. 상세 페이지는 쿼리가 없어서 그대로 미리 만든다(●).

**6. 띄어쓰기가 사라지는 버그를 미리 막기**
처음엔 주소에 쓸 때 검색어를 `trim()`했다. 그런데 입력창이 주소 값을 따라가므로, '무선 '을 치는 순간 공백이 지워져 **'무선 이어폰'을 입력할 수 없다.** → 주소에는 그대로 적고, 공백 제거는 거를 때(`filterProducts`)만 한다.

**7. 빈 `src/pages` 폴더와 타입 에러**
`useSearchParams()` 결과를 넘기는데 "`null`일 수도 있다"는 타입 에러가 났다. 문서에 "pages 폴더가 있으면 null일 수 있다"고 되어 있는데, Vite+react-router 시절의 **빈 `src/pages` 폴더**가 남아 있었다(빈 폴더는 Git에 안 올라가서 몰랐다).
Next.js는 이 폴더가 있으면 Pages Router가 섞인 프로젝트로 보고 호환용 타입을 붙인다. 폴더를 지우고 다시 빌드하자 해결됐다.

**8. 제목 단계 (heading-order)**
홈은 h1(상품 목록, sr-only) 다음에 바로 카드가 온다. 카드 상품명이 h3이면 h2를 건너뛴다. 스크린리더 사용자는 제목 단계로 페이지 구조를 파악하므로 → 카드 상품명을 h2로. 크기는 클래스가 정해서 모양은 그대로다(전역 CSS에서 제목 기본 크기를 지웠음).

### 확인 방법
1. `npm run build` → `ƒ /` (요청마다 생성), `● /products/...` (그대로)
2. "무선 이어폰"을 입력 → 주소가 `/?q=무선+이어폰`, 띄어쓰기가 사라지지 않는지
3. 오디오 → 가격 낮은순 → **뒤로 가기** 한 번 → 정렬만 기본순으로 돌아가는지
4. 카드를 눌러 상세로 갔다가 뒤로 → 필터가 그대로인지
5. 상세 이동 경로의 카테고리(예: 디스플레이) → 그 카테고리만 고른 목록
6. `/?sort=abc&category=없음` → 전체·기본순으로 열리는지
7. 페이지 소스 보기(`Ctrl+U`)로 `/?category=오디오` → HTML에 오디오 상품만 있는지

검증 결과 (production 빌드 + headless Chrome)
- 서버 HTML: `/`=12개, `?q=무선`=3개, `?category=오디오&sort=price-asc`=3개(스피커가 맨 앞), `?instock=1`=10개, 잘못된 값=12개
- 브라우저: 빠른 타이핑(10ms 간격)에도 '무선 이어폰' 그대로, 검색은 기록 안 늘어남, 카테고리+정렬은 기록 2개, 뒤로 가기·상세 왕복·이동 경로 링크·새로고침 모두 정상, 필터 변경 시 서버 요청 0건
  - 요청이 하나 보였는데 `/products/9?_rsc=…`였다. 검색 결과에 나타난 카드의 상세 페이지를 `Link`가 미리 받아 두는 것(prefetch)이라 정상
- axe 홈 라이트·다크 위반 0 (heading-order 해결), 콘솔 에러 0
- Storybook Card·ProductDetail·Skeletons 렌더링·axe 통과

---

## 4-3a. `loading.tsx` — 페이지를 기다리는 동안의 화면

### 왜 필요한가?
4-2에서 홈을 요청마다 서버에서 만드는 페이지(`ƒ`)로 바꿨다. 그래서 상세에서 **'목록으로'를 누르면 서버 응답을 기다려야** 한다.
- 지금까지는 그동안 **아무 반응 없이 상세 화면에 멈춰** 있었다. 눌렸는지 알 수 없어서 또 누르게 된다.
- `loading.tsx`가 있으면 누르는 **즉시** 목록 스켈레톤이 뜨고, 응답이 오면 실제 목록으로 바뀐다.

> 퍼블리셔 관점: 링크를 눌렀는데 화면이 그대로면 "고장 났나?" 싶다. 버튼 눌림 상태(`:active`)를 주는 것과 같은 이유로, 페이지 이동에도 "눌렸어요" 신호가 필요하다.

### 바뀐 구조
```
src/app/
├ layout.tsx                ← 헤더 (로딩 중에도 그대로, 계속 누를 수 있음)
├ (catalog)/                ← 라우트 그룹: 주소에 안 나타남 → 여전히 "/"
│  ├ page.tsx               ← 홈 (app/page.tsx에서 이동, 내용 그대로)
│  └ loading.tsx            ← 홈 로딩 화면 = CatalogSkeleton
└ products/[id]/
   ├ page.tsx
   └ loading.tsx            ← 상세 로딩 화면 = ProductDetailSkeleton
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/app/(catalog)/loading.tsx` (새 파일) | 홈 로딩 화면. `CatalogSkeleton`을 그대로 쓴다 |
| `src/app/(catalog)/page.tsx` | `app/page.tsx`에서 **이동만** (주석 추가). 주소는 그대로 `/` |
| `src/app/products/[id]/loading.tsx` (새 파일) | 상세 로딩 화면 |
| `src/components/ProductDetailSkeleton.tsx` (새 파일) | 상세 화면 스켈레톤. `ProductDetail.module.scss`의 클래스를 그대로 써서 크기를 맞춤 |
| `src/components/ProductDetail.module.scss` | 정사각형 사진 자리 규칙을 `.initial, .mediaSkeleton`으로 묶음 (이미지 없는 상품과 스켈레톤이 공유) |
| `src/components/Skeletons.stories.tsx` | `Detail`, `DetailCompare`(스켈레톤과 실제 상세를 위아래로) 스토리 추가 |
| `src/app/layout.tsx`, `CatalogSkeleton.tsx` | 주석의 경로만 수정 |

### 핵심 개념

**1. `loading.tsx` = 자동 `<Suspense>`**
```tsx
// Next.js가 파일 이름 규칙으로 만들어 주는 구조
<Layout>                              {/* layout.tsx — 그대로 유지 */}
  <Suspense fallback={<Loading />}>   {/* loading.tsx */}
    <Page />                          {/* page.tsx */}
  </Suspense>
</Layout>
```
- Step 3-2에서 `page.tsx` 안에 직접 쓴 `<Suspense fallback={<CatalogSkeleton />}>`와 같은 원리다.
- 차이: `page.tsx` 안의 Suspense는 **페이지 안의 일부**(ProductCatalog)를 기다리고, `loading.tsx`는 **페이지 전체**(다른 주소로 이동)를 기다린다.
- 로딩 화면은 링크가 화면에 보일 때 **미리 받아 둔다(prefetch)**. 그래서 서버가 느려도 누르는 즉시 보인다.

**2. 가장 가까운 `loading.tsx`가 쓰이고, 하위 폴더 전체에 적용된다**
처음엔 `app/loading.tsx`에 두었다. 그랬더니 **상세 페이지와 404까지** 감싸서 문제가 생겼다.
- 상세 페이지의 첫 HTML에 **목록 모양 스켈레톤**이 먼저 들어가고, 실제 상세 내용은 숨겨진 채(`<div hidden>`) 뒤따라와서 스크립트가 바꿔 끼웠다.
- 새로고침하면 목록 스켈레톤이 **한 프레임 번쩍** → 상세 화면. JS를 끄면 목록 스켈레톤만 남았다.
- 작업 전에는 상세 HTML에 내용이 바로 들어 있었으므로, 이번 작업이 만든 문제였다.

**3. 라우트 그룹 `(폴더)` — 주소는 그대로, 파일만 묶기**
- 괄호로 감싼 폴더는 **주소에 나타나지 않는다.** `app/(catalog)/page.tsx` → 여전히 `/`
- 홈과 그 로딩 화면만 `(catalog)`에 넣어서, 목록 스켈레톤이 **홈에만** 적용되게 했다.
- 결과: 상세·404의 첫 HTML은 작업 전과 같이 내용이 바로 들어가고, 깜빡임도 사라졌다.
- 쓰임새: 같은 주소 체계 안에서 "이 페이지들만 같은 로딩·레이아웃을 쓰게" 묶을 때. (나중에 `(shop)`, `(auth)`처럼 구역 나누기)

**4. 상세 스켈레톤 — 사진 자리는 맞출 수 없다**
- 글자·버튼은 `ProductDetail.module.scss` 클래스를 그대로 써서 위치가 **완전히 같다**.
- 사진은 상품마다 비율이 달라서(4:3, 세로, 정사각형) 미리 알 수 없다 → '이미지 없는 상품'과 같은 **정사각형** 자리를 보여 준다.
- 그래서 모바일(한 칸 배치)에서는 사진 비율만큼 아래 내용이 내려가거나 올라간다. 화면 전체가 한 번에 바뀌는 순간이라 읽던 내용이 밀리지는 않는다.
- `loading.tsx`는 props를 받지 않아서(어떤 상품인지 모름) 사진 비율을 알려 줄 방법이 없다. 정사각형이 가장 무난한 선택이다.

**5. 상세 로딩 화면은 지금 거의 안 보인다**
상세 페이지는 빌드 때 미리 만들어 두고(`●`), 목록 카드의 링크가 페이지를 통째로 미리 받아 둔다. 느린 네트워크에서 직접 이동시켜도 로딩 화면 없이 바로 바뀌었다.
Step 6~8에서 상품을 API·DB로 받아오면 기다리는 시간이 생기고, 그때부터 쓰인다. 지금 만들어 두는 이유는 "주소마다 맞는 로딩 화면"이라는 구조를 먼저 잡기 위해서다.

### 확인 방법
1. `npm run build` → `ƒ /`, `● /products/...` (전과 같음)
2. `npm run start` → 상품 상세에서 개발자 도구 Network를 **Slow 4G**로 바꾸고 '목록으로' → 누르자마자 목록 스켈레톤
3. 상세 페이지에서 새로고침 → 목록 스켈레톤이 번쩍이지 않는지
4. Storybook `Product/Skeletons` → `Detail Compare`에서 스켈레톤과 실제 상세의 글자 줄·버튼 위치 비교

검증 결과 (production 빌드 + headless Chrome)
- '목록으로' 클릭 0.2초 뒤(지연 3초 네트워크) 목록 스켈레톤 표시 — 1280·390px
- 첫 HTML: `/products/3`·404는 로딩 경계 없이 내용 바로(작업 전과 같음). `app/loading.tsx`였을 때는 목록 스켈레톤 + 숨긴 내용이었음
- 첫 로딩 깜빡임(화면 그리기 전 프레임에 스켈레톤이 있는지): 상세·404 없음 / 홈 1프레임
  - 홈의 1프레임은 `loading.tsx`를 빼고 빌드해도 똑같았다. 4-2의 `page.tsx` 안 Suspense(useSearchParams) 때문에 생기던 것 → 아래 "알려진 한계"
- 상세 스켈레톤 vs 실제(Storybook `DetailCompare`): 1280·390px 모두 이동 경로·카테고리·상품명·평점·가격·재고·버튼 크기 같음. 사진 자리만 다름(정사각형 vs 4:3), 390px에서는 그만큼(89px) 아래 내용 위치가 다름
- Storybook 스토리 38개 × 라이트/다크 렌더링 정상, axe 위반 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- **홈의 첫 HTML**: 목록이 HTML에 들어 있긴 하지만(검색엔진 OK), 스켈레톤 다음 숨긴 `<div hidden>`에 있다가 스크립트로 바꿔 끼운다. 그래서 첫 로딩 때 스켈레톤이 1프레임 보이고, JS를 끄면 스켈레톤만 남는다. 4-2부터 있던 동작이다. `useSearchParams` 대신 서버에서 `searchParams`를 읽어 넘기면 없앨 수 있는지 Step 6(서버에서 데이터 받기)에서 다시 본다.
- 4-3b: 구간별 `error.tsx`
- 이 작업 폴더는 3-4a(`.gitattributes`) 전에 받아 둔 것이라 파일 45개가 CRLF로 남아 있었다(`git status`에는 안 보임). 해당 파일을 지우고 저장소에서 다시 꺼내 LF로 맞췄다. 다른 PC도 `git ls-files --eol | grep w/crlf`로 확인할 수 있다.
