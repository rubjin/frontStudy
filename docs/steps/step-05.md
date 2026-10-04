# Step 5. 장바구니 — Context + useReducer

> 상태: 진행 중 (5-1 ~ 5-3 완료)

## 목표
지금까지의 상태(검색어·필터)는 **한 화면 안에서만** 쓰였다. 장바구니는 다르다.
- 상세 페이지에서 담고, 헤더에서 개수를 보고, `/cart`에서 목록을 본다. **멀리 떨어진 컴포넌트들이 같은 상태를 나눠 쓴다.**
- 담기·수량 변경·삭제처럼 **바꾸는 방법이 여러 가지**이고, "재고보다 많이 담을 수 없다" 같은 규칙이 있다.

이 두 문제를 React 기본 기능인 **Context**(나눠 쓰기)와 **useReducer**(규칙을 한 곳에)로 푼다.

### 왜 Zustand가 아니라 Context + useReducer인가?
- 설치 없이 React만으로 되는 기본기다. 면접에서 "전역 상태를 어떻게 관리했나"의 기본 답이 된다.
- Zustand·Redux Toolkit은 이 구조(저장소 + 바꾸는 함수)를 더 편하게 만든 도구다. 기본 구조를 먼저 알면 도구를 고를 이유를 설명할 수 있다.

## 세부 단계
- [x] **5-1** 장바구니 상태 기본: reducer + Context Provider + `useCart`, 상세 '장바구니 담기', 헤더 개수 배지, 최소 `/cart`
- [x] **5-2** 장바구니 페이지 완성: 수량 +/−, 삭제, 합계, 사진
- [x] **5-3** localStorage 저장: 새로고침 유지, 하이드레이션 불일치 처리, 다른 탭과 동기화
- [ ] **5-4** 마무리: 목록 카드에서 바로 담기, 담기 알림, 재고 한도 안내

---

## 5-1. 장바구니 상태 기본

### 구조
```
layout.tsx (서버)
└ <CartProvider>                 ← 장바구니 state가 여기 있다 (useReducer)
   ├ <Header /> (서버)
   │  └ <CartLink />             ← useCart().count → 배지 숫자
   └ <main>{children}</main>
      ├ /products/2
      │  └ ProductDetail (서버)
      │     └ <AddToCartButton /> ← useCart().addItem(product)
      └ /cart
         └ <CartContents />      ← useCart().items → 목록
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/types/cart.ts` (새 파일) | `CartItem { productId, quantity }`, `CartState { items }` |
| `src/lib/cart.ts` (새 파일) | `cartReducer`(담기 규칙), `getCartCount`·`getQuantityInCart`(계산 함수) — React와 무관한 순수 함수 |
| `src/components/CartProvider.tsx` (새 파일) | `useReducer`로 state를 들고 Context로 나눠 줌. `useCart()` 훅 |
| `src/components/AddToCartButton.tsx` (새 파일) | 담기 버튼. 품절·최대 수량이면 비활성, 결과를 `role="status"`로 알림 |
| `src/components/CartLink.tsx` (새 파일) | 헤더의 장바구니 링크 + 개수 배지 |
| `src/components/CartContents.tsx` (새 파일) | `/cart`의 목록 (최소 버전), 빈 장바구니 안내 |
| `src/app/cart/page.tsx` (새 파일) | `/cart` 페이지. 서버 컴포넌트, `title: '장바구니'`, 검색 제외(`robots: { index: false }`) |
| `src/app/layout.tsx` | Header와 main을 `<CartProvider>`로 감쌈 |
| `src/components/Header.tsx` | 오른쪽에 `CartLink` + `ThemeToggle` 묶음 |
| `src/components/ProductDetail.tsx` | 버튼 줄에 `AddToCartButton` |
| `src/components/icons.tsx` | `Cart` 아이콘 |
| `.storybook/preview.tsx` | 모든 스토리를 `CartProvider`로 감쌈 |
| `src/components/Cart.stories.tsx` (새 파일) | 기본·품절·링크 단독·빈 장바구니·함께 동작 |

### 핵심 개념

**1. Context — 멀리 떨어진 컴포넌트에 값 나눠 주기**
- 헤더의 배지와 상세의 버튼은 공통 부모가 `layout.tsx`뿐이다. props로 넘기면 중간 컴포넌트(Header, page, ProductDetail)가 쓰지도 않는 값을 계속 넘겨야 한다(**props drilling**).
- Context는 위에서 한 번 깔아 두면 아래 어디서든 꺼내 쓰는 통로다.
```tsx
const CartContext = createContext<CartContextValue | null>(null)   // 1) 통로 만들기
<CartContext value={value}>{children}</CartContext>                 // 2) 위에서 값 넣기 (React 19 문법)
const { count } = useContext(CartContext)                           // 3) 아래에서 꺼내기 → useCart()로 감쌈
```

**2. useReducer — 바꾸는 규칙을 한 곳에**
```tsx
const [state, dispatch] = useReducer(cartReducer, { items: [] })
dispatch({ type: 'add', productId: 2, maxQuantity: 5 })   // 컴포넌트는 "무엇을"만 알린다
// → React가 cartReducer(state, action)을 실행 → 결과로 다시 그림  // "어떻게"는 reducer가 정한다
```
- 재고 한도 규칙은 reducer에 있다. 버튼이 '최대 수량' 상태로 비활성화되는 것은 사용자에게 **이유를 보여 주는 것**이고, 규칙 자체는 버튼이 몇 개로 늘어나도 reducer 하나다.
- reducer는 **순수 함수**다: 받은 state를 고치지 않고 새 객체를 돌려준다. (`push`나 `item.quantity++`를 쓰면 React가 바뀐 줄 몰라서 화면이 안 바뀐다)

**3. 장바구니에는 id와 수량만**
가격·이름을 복사해 두면 가격이 바뀌었을 때 장바구니만 옛날 가격이 된다. id만 두고 보여 줄 때 상품 데이터에서 찾는다(4-2의 "같은 정보는 한 곳에만"). 저장할 값도 작아서 5-3의 localStorage에 유리하다.

**4. 클라이언트 Provider로 서버 컴포넌트를 감싸도 된다**
`CartProvider`는 `'use client'`지만 `children`으로 받은 Header·페이지는 서버에서 이미 그려진 결과라 **서버 컴포넌트 그대로**다. 그래서 Provider는 children을 받는 모양으로 만든다. (Provider 파일 안에서 직접 import해 그리면 클라이언트 컴포넌트가 된다)

**5. Context value와 useMemo**
Context는 value가 **다른 객체**가 되면 꺼내 쓰는 모든 컴포넌트를 다시 그린다. `useMemo`로 state가 바뀔 때만 새 객체를 만든다.

**6. 접근성**
- 담기 버튼: 눌러도 화면 위쪽 배지만 바뀌면 스크린리더 사용자는 담겼는지 모른다 → `role="status"` 문구 "장바구니에 담았습니다. 현재 n개". 영역은 처음부터 DOM에 두고(비어 있음), 숫자를 넣어 매번 글자가 달라지게 했다.
- 헤더 링크: 아이콘뿐이라 `sr-only`로 "장바구니", 배지 숫자 뒤에 "개" → 읽히는 이름 "장바구니 5 개".
- 알림 문구는 `display: contents` + `order`로 버튼 줄 아래에 놓았다(버튼 사이에 끼지 않게).

### 확인 방법
1. `npm run build` → `○ /cart`, 상세는 그대로 `●`
2. 상세(재고 5개짜리 스마트워치 `/products/2`)에서 '장바구니 담기' → 헤더 배지 1, 문구 "현재 1개"
3. 다섯 번 → 버튼이 '최대 수량을 담았습니다'로 비활성화
4. 목록으로 → 다른 상품 담기 → 배지가 이어서 증가 → 헤더 장바구니 → `/cart`에 두 상품
5. 품절 상품(`/products/3`) → '품절' 비활성화
6. 새로고침 → 장바구니가 비어 있음 (**아직 정상**, 5-3에서 저장)
7. Storybook `Cart/AddToCartButton` → `Together`에서 버튼·배지·목록이 함께 바뀌는지

검증 결과 (production 빌드 + headless Chrome)
- 위 2~6 모두 확인. 링크 이름 "장바구니" → "장바구니 1 개" → "장바구니 6 개"
- 상세(담은 뒤)·`/cart`(목록·빈 화면) axe 라이트·다크 위반 0, 콘솔 에러·하이드레이션 경고 0
- 1280·390px에서 알림 문구가 버튼 줄 아래에 표시
- Storybook 스토리 43개 × 라이트/다크 렌더링 정상·axe 위반 0, `Together` 클릭 → 배지 2개·목록 2줄
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 새로고침하면 비워진다 → 5-3
- `/cart`는 수량 조절·삭제·합계가 없다 → 5-2
- 상품 데이터를 클라이언트에서 목 데이터 파일로 찾는다(`CartContents`). Step 6에서 API로 바뀐다.

---

## 5-2. 장바구니 페이지 완성

### 목표
`/cart`에서 수량을 바꾸고, 빼고, 총 금액을 확인할 수 있게 한다. reducer에 **바꾸는 방법(action)을 추가**하는 과정과, 버튼이 사라지거나 비활성화될 때의 **키보드 포커스** 문제를 다룬다.

### 화면 구조
```
/cart
 h1 장바구니
 ┌ section "담은 상품 3" ────────────────────────┐ ┌ section "주문 요약" ┐
 │ [사진] 스마트워치 5세대   [−] 2 [+]  ₩658,000 ✕ │ │ 상품 수        4개  │
 │        ₩329,000                               │ │ 총 금액  ₩996,000   │
 │ [사진] ...                                     │ │ [쇼핑 계속하기]      │
 └───────────────────────────────────────────────┘ └────────────────────┘
  lg(1024px) 이상: 2열 + 요약 sticky / 그 아래: 요약이 목록 밑으로, 한 줄이 두 줄(사진·이름 / 수량·소계)
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/cart.ts` | action에 `setQuantity`(1 ~ 재고로 맞춤, 0이어도 삭제하지 않음)·`remove` 추가. 화면용 계산 `getCartLines(state, products)`(id → 상품 정보 + 소계, 없는 상품은 뺌)·`getCartTotal(lines)` |
| `src/components/CartProvider.tsx` | `setQuantity(product, n)`·`removeItem(id)` 제공. `initialItems` prop(스토리용, 초기화 함수로 처음 한 번만 사용) |
| `src/components/CartContents.tsx` | 사진·단가·수량 −/+·소계·삭제, 주문 요약(`<dl>`). 알림(`role="status"`), `aria-disabled`, 삭제 후 포커스 이동 |
| `src/components/CartContents.module.scss` | `grid-template-areas`로 한 줄 배치(모바일 2줄 ↔ sm 이상 1줄), lg 2열 + sticky 요약 |
| `src/components/ui/Button.module.scss` | hover 제외 조건에 `[aria-disabled='true']` 추가 |
| `src/components/icons.tsx` | `Minus`·`Plus`·`Close` (16px) |
| `src/components/CartContents.stories.tsx` (새 파일) | Filled · AtMaxQuantity · Empty · Mobile. 헤더 링크도 함께 보여 배지 연동 확인 |
| `src/components/Cart.stories.tsx` | 빈 장바구니 스토리를 위 파일로 옮김 |
| `src/app/cart/page.tsx` | 주석만 갱신 (내용은 CartContents) |

### 핵심 개념

**1. action 추가 = reducer에 case 추가**
```ts
export type CartAction =
  | { type: 'add'; productId: number; maxQuantity: number }
  | { type: 'setQuantity'; productId: number; quantity: number; maxQuantity: number }
  | { type: 'remove'; productId: number }
```
- 컴포넌트는 `setQuantity(product, 3)`만 부르고, "1보다 작게·재고보다 많게는 안 된다"는 reducer가 정한다.
- `+1`/`−1` 대신 **"이 수량으로"**를 받는다 → 나중에 수량 입력칸이 생겨도 같은 action.
- 0으로 내려도 삭제하지 않는다. 삭제는 `remove`로만 → `−` 연타로 상품이 실수로 사라지지 않는다.
- 새 action을 유니온에 추가하고 `case`를 빠뜨리면 TypeScript가 "undefined를 돌려줄 수 있다"고 알려 준다.
- 삭제는 `filter`(새 배열), 수량 변경은 `map` + `{ ...item, quantity }`(새 객체) — 원본을 고치지 않는다.

**2. 화면용 값은 계산해서 쓴다 (파생 상태)**
- 소계·총 금액·상품 수를 state에 저장하지 않는다. `items`에서 그때그때 `getCartLines` → `getCartTotal`로 계산한다(Step 2와 같은 원칙). 저장하면 수량을 바꿀 때 합계도 같이 고쳐야 하고, 하나를 빠뜨리면 숫자가 어긋난다.
- `getCartLines`는 상품 목록을 **매개변수로 받는다** → 목 데이터에서 API(Step 6)로 바뀌어도 함수는 그대로.
- `flatMap`: 찾은 상품은 `[줄]`, 없는 상품은 `[]`로 바꿔 한 번에 빼기(map + filter).

**3. `disabled` 대신 `aria-disabled` — 포커스를 잃지 않게**
- 재고 5개짜리에서 `+`를 다섯 번째로 누르는 순간 버튼이 `disabled`가 되면, **포커스가 있던 요소가 비활성화되어 포커스가 body로 튕긴다.** 키보드 사용자는 처음부터 다시 Tab.
- `aria-disabled="true"`는 스크린리더에 "흐리게 표시됨"으로 읽히고 모양도 비활성이지만 포커스는 남는다. 대신 **클릭을 직접 막아야** 한다(`changeQuantity`에서 범위 밖이면 return).
- "왜 안 눌리지?"를 글로 알려 준다: 최대일 때 `재고 5개까지`.
- 상세 페이지의 '장바구니 담기'(5-1)는 `disabled` 그대로다. 눌러서 비활성화되는 마지막 순간에 포커스가 튕기는 같은 문제가 있다 → 5-4에서 정리.

**4. 삭제 후 포커스 옮기기**
- 삭제 버튼은 줄과 함께 DOM에서 사라진다 → 역시 포커스가 body로.
- 삭제 뒤에는 목록 제목(`h2 담은 상품`)으로, 마지막 상품이면 "장바구니가 비어 있습니다." 문구로 포커스를 옮긴다.
  - 제목·문단은 원래 포커스를 못 받으므로 `tabIndex={-1}`(Tab 순서에는 없고 코드로만 포커스).
  - `removeItem` 직후에는 화면이 아직 안 바뀌었다 → **다시 그린 뒤** 실행되는 `useEffect`에서 `focus()`.
  - "방금 삭제했다" 표시는 화면에 안 보이는 값이라 `useRef`에 둔다(state면 바꿀 때마다 다시 그려짐).

**5. 알림 문구 (`role="status"`)**
수량을 바꾸면 "스마트워치 5세대 수량 4개", 삭제하면 "…, 장바구니에서 삭제했습니다."를 읽어 준다. 영역은 빈 장바구니가 되어도 사라지지 않게 맨 바깥에 둔다.

**6. 마크업**
- 아이콘 버튼 이름에 상품명을 넣는다: "스마트워치 5세대 수량 늘리기" — 상품마다 같은 버튼이 있어서 "늘리기"만으로는 구별이 안 된다.
- `role="group"` + `aria-label="… 수량"`: −, 숫자, + 를 한 묶음으로.
- 주문 요약은 `<dl>`(이름–값 목록), 영역은 `<section aria-labelledby>`로 제목과 연결. id는 `useId()`로 만든다(같은 컴포넌트가 두 번 나와도 겹치지 않게).
- `grid-template-areas`로 배치를 그림처럼 적고, 브레이크포인트에서 그림만 바꾼다.

**7. Context는 가장 가까운 Provider의 값을 쓴다**
스토리에서 `<CartProvider initialItems={...}>`로 한 번 더 감싸면 preview.tsx의 전역 Provider보다 안쪽이라 이쪽 값이 쓰인다.

### 확인 방법
1. `npm run build` → `○ /cart` 그대로
2. 상세에서 스마트워치 2개·헤드폰·키보드 담기 → `/cart`에 3줄, 상품 수 4개, 총 금액 ₩996,000
3. 스마트워치 `+` 연타 → 5개에서 멈춤, `재고 5개까지`, 포커스는 `+`에 남음
4. 1개짜리 `−` → 변화 없음(흐린 버튼)
5. `✕` → 줄이 사라지고 포커스가 '담은 상품' 제목으로, 마지막 상품이면 '비어 있음' 문구로
6. 헤더 배지가 모든 변경을 따라감
7. 390px에서 두 줄 배치, 가로 스크롤 없음 / 1280px에서 요약이 오른쪽
8. Storybook `Cart/CartContents`

검증 결과 (production 빌드 + headless Chrome, 2026-10-04)
- 위 2~7 모두 확인. 알림 문구·포커스 위치·배지(`장바구니 4 개` → `7 개` → … → `장바구니`) 정상
- `/cart`(상품 있음·빈) axe 라이트·다크 위반 0, 콘솔 에러·경고 0
  - 처음엔 다크에서 대비 위반이 나왔는데, 테마를 바꾸자마자 검사해서 **색 전환 애니메이션(300ms) 중간 색**을 잰 것이었다. 전환이 끝난 뒤 검사하면 0
- Storybook 스토리 46개 × 라이트/다크 렌더링 정상·axe 위반 0. `Filled`에서 `+` → 배지·합계 함께 변경
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 새로고침하면 비워진다 → 5-3 (localStorage)
- 저장된 장바구니를 불러오면 "담은 뒤 재고가 줄어 수량 > 재고" "품절된 상품"이 생길 수 있다 → 5-3에서 불러올 때 정리
- 상세의 담기 버튼은 `disabled`라 마지막 클릭에 포커스가 튕긴다 → 5-4
- 주문하기 버튼은 Step 9(주문 기능)에서

---

## 5-3. localStorage 저장

### 목표
새로고침하거나 탭을 닫았다 열어도 장바구니가 남게 한다. 그 과정에서 생기는 세 가지 문제를 다룬다.
1. **하이드레이션 불일치** — 서버는 localStorage를 볼 수 없다
2. **'비어 있음'과 '아직 모름'의 구분** — 불러오기 전에 '비어 있음'이 번쩍이는 문제
3. **저장된 값을 믿지 않기** — 예전에 저장한 값(판매 종료·재고 감소), 다른 탭의 변경

### 흐름
```
서버 HTML           : 배지 없음, /cart는 스켈레톤("불러오는 중")      ← 서버는 장바구니를 모른다
브라우저 첫 화면     : 서버와 똑같이 그림 (hydrated = false)          ← 하이드레이션 불일치 없음
useEffect (화면 붙은 뒤): localStorage 읽기 → 정리(sanitize) → dispatch({ type: 'replace' }) + hydrated = true
다시 그림           : 배지 3, /cart 목록
이후 state가 바뀔 때마다 : localStorage에 저장
다른 탭에서 바뀌면    : storage 이벤트 → 다시 읽기 → replace
```

### 파일별 설명
| 파일 | 역할 |
|---|---|
| `src/lib/cartStorage.ts` (새 파일) | `CART_STORAGE_KEY`(`'shoppr-cart'`), `loadCartItems()`(JSON 파싱 + 버전·모양 검사, 실패하면 `[]`), `saveCartItems()`(같은 값이면 안 씀). 저장 형식 `{"version":1,"items":[...]}` |
| `src/lib/cart.ts` | action `replace`(통째로 바꾸기), `sanitizeCartItems(items, products)`(없는 상품·품절·중복 제거, 재고 초과는 재고만큼) |
| `src/components/CartProvider.tsx` | 불러오기·storage 이벤트(useEffect) / 저장(useEffect) / `hydrated` 값 제공 / `persist` prop |
| `src/components/CartSkeleton.tsx` (새 파일) | 불러오기 전 `/cart` 화면. CartContents의 실제 클래스 사용 |
| `src/components/CartContents.tsx` | `hydrated`가 false면 스켈레톤 |
| `src/components/CartContents.module.scss` | `.thumbFill`(스켈레톤용) |
| `.storybook/preview.tsx`, `CartContents.stories.tsx` | `persist={false}`, `Loading` 스토리 추가 |
| `src/components/CartLink.tsx` | 주석만 |

### 핵심 개념

**1. 하이드레이션 불일치 — 왜 처음부터 저장된 값으로 그리지 않나**
- 하이드레이션: 서버가 보낸 HTML에 React가 이벤트를 연결하면서, **브라우저에서 그린 첫 화면이 서버 HTML과 같은지** 확인하는 과정.
- 서버는 사용자의 localStorage를 볼 수 없으니 항상 "0개"로 그린다. 브라우저가 `useReducer(..., () => localStorage에서 읽기)`로 처음부터 "3개"를 그리면 서버(0)와 달라서 **경고 + 그 부분을 버리고 다시 그림**.
- 그래서 첫 화면은 서버와 똑같이(빈 장바구니) 그리고, `useEffect`(화면이 붙은 **뒤**에 브라우저에서만 실행)에서 불러온다.
- 다크 모드(3-2)는 `<head>` 스크립트로 해결했다. 그건 **CSS(속성 하나)**라 React가 그리기 전에 바꿔도 되지만, 장바구니는 **React가 그리는 내용(숫자·목록)**이라 같은 방법을 못 쓴다.

**2. '비어 있음' ≠ '아직 모름' — `hydrated`**
- 불러오기 전 `items`는 `[]`다. 이걸 그대로 쓰면 `/cart`를 새로고침할 때마다 "장바구니가 비어 있습니다"가 번쩍인다.
- `hydrated`(불러왔는지)를 Context로 함께 주고, false인 동안은 스켈레톤을 보여 준다. 서버 HTML에도 스켈레톤이 들어간다.
- 저장도 `hydrated` 뒤에만 한다. 안 그러면 첫 렌더의 빈 `[]`로 저장된 값을 **덮어써 버린다.**
- `useEffect` 안의 `setHydrated(true)`는 ESLint `react-hooks/set-state-in-effect`에 걸린다. 보통은 "렌더 중에 계산하라"는 좋은 경고지만, 여기는 **브라우저에서만 알 수 있는 값**을 하이드레이션 뒤에 반영하는 의도된 경우라 그 줄만 이유를 적고 끈다.

**3. 저장된 값은 믿지 않는다**
- localStorage는 개발자 도구로 누구나 고칠 수 있고, 예전 버전 코드가 저장한 값일 수도 있다.
  - `loadCartItems`: JSON이 깨졌거나, 버전이 다르거나, 배열이 아니면 `[]`. 항목은 `productId`·`quantity`가 정수이고 `quantity >= 1`인 것만(**타입 가드** `value is CartItem`).
  - `sanitizeCartItems`: 지금 상품 데이터에 맞춘다 — 없는 상품·품절은 빼고, 재고를 넘으면 재고만큼, 같은 상품이 두 번이면 처음 것만.
- 저장 형식에 `version`을 넣었다. 나중에 형식을 바꾸면 예전 값을 알아보고 버리거나 옮길 수 있다.
- localStorage 접근은 `try...catch` — 사생활 보호 모드·저장 공간 부족에서 에러가 나도 장바구니는 이번 방문 동안 그대로 동작(`lib/theme.ts`와 같은 방식).

**4. 다른 탭과 맞추기 — `storage` 이벤트**
- 탭 A에서 localStorage를 바꾸면 **같은 사이트의 다른 탭들**에 `storage` 이벤트가 온다(바꾼 탭 자신에게는 안 온다).
- 받으면 다시 읽어서 `replace`. 탭 B의 배지·목록이 바로 바뀐다. `localStorage.clear()`면 `event.key`가 `null`.
- 받은 값을 저장 effect가 다시 저장하려 할 때 같은 문자열이면 쓰지 않는다(`saveCartItems`) — 탭끼리 주고받는 낭비 방지.
- `useEffect`의 정리 함수(`return () => removeEventListener`)로 연결을 끊는다.

**5. Storybook에서는 저장하지 않는다 — `persist={false}`**
스토리는 모두 같은 주소(= 같은 localStorage)다. 저장하면 `Together`에서 담은 상품이 다른 스토리에 나타나 결과가 매번 달라진다.

**6. 스켈레톤 크기 맞추기에서 배운 것**
`.heading`·`.summaryRow`는 `display: flex`다. flex 안에 `<Skeleton>`을 바로 넣으면 조각 자체가 flex 항목이 되어 높이가 조각 높이(0.8em)로 줄어든다. `<span>`으로 감싸면 span이 글자 줄 높이를 가진다. 처음엔 목록이 13.6px, 요약 상자가 11.2px 낮았는데 실제 화면과 측정해 비교해서 찾았다.

### 확인 방법
1. `npm run build` → `○ /cart` 그대로(정적). `curl localhost:3000/cart` → "장바구니를 불러오는 중" 있음, "비어 있음" 없음
2. 상세에서 담기 → 새로고침 → 배지 유지. `/cart` 새로고침 → '비어 있음'이 번쩍이지 않음
3. 개발자 도구 Application → Local Storage → `shoppr-cart` 값 확인
4. 탭 두 개: 한쪽에서 담기·삭제 → 다른 쪽 배지·목록이 바로 바뀜
5. `shoppr-cart` 값을 이상하게 고치고 새로고침 → 정리된 장바구니
6. 콘솔에 하이드레이션 경고 없음

검증 결과 (production 빌드 + headless Chrome, 2026-10-04)
- 서버 HTML: 스켈레톤 O, '비어 있음' X. `/cart` 처음 열기·새로고침 모두 화면에 나타난 문구 기록(MutationObserver)에 '비어 있음' 없음
- 상세에서 담고 다른 상세를 새로 열기 → `장바구니 2 개`, 저장값 `{"version":1,"items":[{"productId":2,"quantity":2},{"productId":1,"quantity":1}]}`
- 탭 B에서 담기 → 탭 A 배지 4개·목록 3줄 / 탭 A에서 삭제 → 탭 B 배지 2개 / 탭 B에서 `clear()` → 탭 A 비어 있음
- `[스마트워치 9개, 품절 스피커, 없는 999, 헤드폰 1, 헤드폰 중복, productId 'x', 수량 0]` → 스마트워치 5개(재고)·헤드폰 1개만, 정리된 값으로 다시 저장
- 깨진 JSON · version 2 · 배열 → 빈 장바구니, 에러 없음
- 스켈레톤 vs 실제(1280·390px): 줄 높이 129/123px, 목록 시작 위치, 요약 상자 높이, 썸네일 폭 모두 같음
- `/cart` axe 라이트·다크 위반 0, 콘솔 에러·경고(하이드레이션 포함) 0
- Storybook 스토리 47개 × 라이트/다크 렌더링 정상·axe 위반 0
- `tsc`·ESLint·Stylelint·Prettier 통과

### 알려진 한계 · 다음에 할 일
- 상세의 담기 버튼은 불러오기 전 잠깐 '장바구니 담기'였다가, 이미 재고만큼 담겨 있으면 '최대 수량'으로 바뀐다(드묾). 5-4에서 버튼을 정리할 때 함께 본다.
- 불러올 때 수량이 줄거나 상품이 빠져도 사용자에게 알려 주지 않는다. 실제 쇼핑몰은 "재고가 바뀌어 수량을 조정했습니다" 같은 안내를 띄운다 → 필요하면 5-4.
- 스켈레톤은 2줄 고정이라 담긴 상품이 1개나 3개 이상이면 불러온 순간 높이가 바뀐다.
- 로그인 사용자의 장바구니를 서버에 저장(여러 기기에서 같은 장바구니)은 Step 9.
