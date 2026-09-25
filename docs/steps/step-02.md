# Step 2. 카테고리 필터 · 정렬 · 품절 숨기기

> 상태: 완료 (2-1, 2-2, 2-3)

## 목표
검색 하나만 있던 화면에 **여러 조건(카테고리, 정렬, 품절 숨기기)** 을 동시에 적용한다.
조건이 늘어날 때 코드가 엉키지 않도록 **상태는 어디에 두고, 계산은 어디서 하는지** 구조를 잡는 것이 핵심이다.

## 세부 단계
- [x] **2-1** 카테고리 필터
- [x] **2-2** 정렬(가격 낮은순·높은순, 평점순)
- [x] **2-3** 품절 숨기기 + `useMemo` 정리

---

## 2-1. 카테고리 필터

### 바뀐 구조
Step 1에서는 `CardGrid`가 목록을 **걸러내고 보여 주는 일**을 둘 다 했다.
필터가 늘어나면 `CardGrid`가 모든 조건을 알아야 해서 복잡해진다. 그래서 역할을 나눴다.

```
App (상태: query, category)
 ├─ SearchBar        ← value / onChange 로 검색어를 주고받음
 ├─ CategoryFilter   ← value / onChange 로 카테고리를 주고받음
 └─ CardGrid         ← 이미 걸러진 목록(products)을 받아 보여 주기만 함

filterProducts()  ← 걸러내는 계산만 담당하는 순수 함수 (src/lib)
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `src/lib/filterProducts.js` (새 파일) | `getCategories()`: 데이터에서 카테고리 목록 추출 · `filterProducts()`: 검색어 + 카테고리로 걸러내기 |
| `src/components/CategoryFilter.jsx` (새 파일) | 카테고리 버튼 목록. 선택 값은 부모가 관리(제어 컴포넌트) |
| `src/App.jsx` | `category` 상태 추가. 걸러낸 목록을 계산해 `CardGrid`에 전달 |
| `src/components/CardGrid.jsx` | 걸러내기 로직 제거. 검색어 없이 결과가 0개일 때 쓸 문구 추가 |

### 핵심 개념

**1. 상태 끌어올리기 (lifting state up)**
검색어와 카테고리는 여러 컴포넌트가 함께 쓴다. 그래서 공통 부모인 `App`에 두고 props로 내려준다.
상태가 한 곳에 있으니 "검색어 + 카테고리"를 한 번에 계산할 수 있다.

**2. 파생 상태 — 계산할 수 있는 값은 state로 만들지 않는다**
```js
// ❌ 이렇게 하지 않는다
const [visible, setVisible] = useState(products)
// query나 category가 바뀔 때마다 setVisible을 잊지 않고 불러야 한다 → 버그의 원인

// ✅ 렌더링할 때마다 계산한다
const visible = filterProducts(products, { query, category })
```

**3. 순수 함수로 로직 분리**
`filterProducts`는 JSX를 쓰지 않고, 같은 입력이면 항상 같은 결과를 낸다.
→ 재사용하기 쉽고, Step 9에서 테스트를 붙이기 쉽다.

**4. `new Set`으로 중복 제거**
```js
[...new Set(['오디오', '오디오', '웨어러블'])] // → ['오디오', '웨어러블']
```
카테고리를 직접 적지 않고 데이터에서 뽑아서, 상품이 추가되면 버튼도 자동으로 생긴다.

**5. 접근성: `aria-pressed`**
토글 버튼에 `aria-pressed={true/false}`를 달면 스크린리더가 "선택됨/선택 안 됨"을 읽어 준다.
`role="group"` + `aria-label`로 버튼 묶음에 이름도 붙였다.

### 확인 방법
1. `npm run dev` 실행
2. 카테고리 버튼을 누르면 목록이 바뀌는지 확인
3. "오디오" 선택 후 "무선" 검색 → 2개가 나오는지 확인 (검색 + 카테고리 동시 적용)
4. "저장장치" 선택 후 "헤드폰" 검색 → 빈 상태 화면이 나오는지 확인

---

## 2-2. 정렬

### 바뀐 구조
```
App (상태: query, category, sort)
 ├─ SearchBar
 ├─ 툴바
 │   ├─ CategoryFilter
 │   └─ SortSelect      ← value / onChange 로 정렬 기준을 주고받음 (새로 추가)
 └─ CardGrid

products ─① filterProducts() → filtered ─② sortProducts() → visible → CardGrid
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `src/lib/sortProducts.js` (새 파일) | `SORT_OPTIONS`: 정렬 옵션 목록 · `sortProducts()`: 기준에 맞게 정렬한 새 배열 반환 |
| `src/components/SortSelect.jsx` (새 파일) | 정렬 기준 `<select>`. `label`과 `id`로 연결 |
| `src/App.jsx` | `sort` 상태 추가. 걸러내기 → 정렬 순서로 계산. 필터와 정렬을 한 줄에 놓는 툴바 추가 |
| `src/components/CategoryFilter.jsx` | 바깥 여백(`mb-6`)을 빼고 부모 툴바가 간격을 정하도록 변경 |

### 핵심 개념

**1. `sort()`의 비교 함수**
```js
products.sort((a, b) => a.price - b.price) // 결과가 음수면 a가 앞 → 오름차순
products.sort((a, b) => b.price - a.price) // 뒤집으면 내림차순
```
Step 1에서 가격을 숫자로 바꿔 둔 덕분에 빼기 한 번으로 비교할 수 있다.

**2. 불변성 — 원본 배열을 바꾸지 않는다**
```js
// ❌ sort()는 원본을 직접 바꾼다 → '기본순'으로 돌아갈 수 없게 됨
return products.sort(compare)

// ✅ 복사본을 만들어 정렬한다
return [...products].sort(compare)
```
React는 "값이 바뀌었는지"를 보고 화면을 다시 그린다. 원본을 직접 고치면 React가 변화를 알아차리지 못하거나,
다른 곳에서 쓰는 데이터까지 망가질 수 있다. **props와 state는 직접 수정하지 않는다**가 React의 기본 규칙이다.
(`filter`, `map`은 원래 새 배열을 만들어서 안전하고, `sort`, `reverse`, `push`, `splice`는 원본을 바꾸니 주의)

**3. 설정을 데이터로 — `SORT_OPTIONS` 배열**
옵션을 JSX에 직접 쓰지 않고 `{ value, label }` 배열로 만들어 `map`으로 그린다.
정렬 기준을 추가할 때 JSX는 건드리지 않고 배열과 비교 함수만 추가하면 된다.

**4. 접근성: `label` + `htmlFor`**
`<label htmlFor="sort">`와 `<select id="sort">`를 연결하면 스크린리더가 "정렬"이라는 이름을 읽어 주고,
라벨을 클릭해도 select에 포커스가 간다. (JSX에서는 `for` 대신 `htmlFor`)

**5. 여백은 배치하는 쪽이 정한다**
`CategoryFilter`에서 `mb-6`을 빼고 툴바 `div`가 간격을 맡게 했다.
컴포넌트 안에 바깥 여백이 박혀 있으면 다른 위치에 재사용할 때 여백이 방해가 된다. (퍼블리싱에서도 익숙한 원칙)

### 확인 방법
1. "가격 낮은순" → 첫 카드가 ₩38,000(노트북 거치대)인지 확인
2. "평점 높은순" → 첫 카드가 ★4.8(기계식 키보드)인지 확인
3. 정렬을 바꾼 뒤 "기본순"으로 돌아오면 처음 순서(헤드폰부터)로 돌아오는지 확인 → 불변성이 지켜졌다는 뜻
4. "주변기기" + "가격 높은순"처럼 필터와 정렬이 함께 적용되는지 확인
5. 브라우저 폭을 좁히면 필터와 정렬이 세로로 쌓이는지 확인

---

## 2-3. 품절 숨기기 + `useMemo`

### 바뀐 구조
```
App (상태: query, category, sort, hideSoldOut)
 ├─ SearchBar
 ├─ 툴바
 │   ├─ CategoryFilter
 │   └─ 보기 옵션
 │       ├─ SoldOutToggle   ← checked / onChange (새로 추가)
 │       └─ SortSelect
 └─ CardGrid

useMemo( ① filterProducts({ query, category, hideSoldOut }) → ② sortProducts(sort) )
        └ 의존성: [query, category, hideSoldOut, sort] 중 하나가 바뀔 때만 다시 계산
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `src/components/SoldOutToggle.jsx` (새 파일) | 품절 숨기기 체크박스. `checked` / `e.target.checked` 사용 |
| `src/lib/filterProducts.js` | `hideSoldOut` 조건 추가. 기본값 매개변수(`= false`)로 기존 호출이 깨지지 않게 함 |
| `src/App.jsx` | `hideSoldOut` 상태 추가. 목록 계산을 `useMemo`로 감쌈. 툴바 오른쪽에 보기 옵션 묶음 추가 |

### 핵심 개념

**1. 조건 추가가 쉬운 구조 — 2-1에서 잡은 구조의 효과**
2-1에서 `filterProducts(products, { query, category })`처럼 조건을 객체로 받게 해 두었다.
그래서 이번에는 `hideSoldOut` 한 줄만 추가하면 됐고, `CardGrid`는 전혀 고치지 않았다.
**"기능을 추가할 때 고쳐야 하는 파일이 적다"** 가 좋은 구조의 기준이다.

**2. 기본값 매개변수**
```js
function filterProducts(products, { query, category, hideSoldOut = false }) { ... }
```
`hideSoldOut`을 넘기지 않으면 `false`로 처리된다. 새 옵션을 추가해도 기존 호출 코드가 그대로 동작한다.

**3. 체크박스는 `checked`**
| input 종류 | 상태 연결 | 이벤트에서 읽는 값 |
| --- | --- | --- |
| text, select | `value` | `e.target.value` (문자열) |
| checkbox | `checked` | `e.target.checked` (true/false) |

**4. `useMemo` — 계산 결과 기억하기**
```js
const visible = useMemo(() => {
  const filtered = filterProducts(products, { query, category, hideSoldOut })
  return sortProducts(filtered, sort)
}, [query, category, hideSoldOut, sort])
```
- React는 state가 바뀌면 컴포넌트 함수 전체를 다시 실행한다. 다크 모드만 바꿔도 목록 계산이 다시 돈다.
- `useMemo`를 쓰면 **의존성 배열의 값이 바뀔 때만** 다시 계산하고, 아니면 지난 결과를 재사용한다.
- **의존성 배열에 계산에 쓰는 값을 빠뜨리면** 값이 바뀌어도 화면이 갱신되지 않는다. ESLint 경고(`react-hooks/exhaustive-deps`)를 꼭 확인한다.

**솔직한 이야기: 지금은 꼭 필요하지 않다**
상품이 12개라 `useMemo` 없이도 성능 차이는 거의 없다. 이번에는 **개념을 익히려고** 넣었다.
실무에서는 모든 계산에 `useMemo`를 붙이지 않는다. 기억하는 것 자체에도 비용이 들고 코드가 복잡해지기 때문이다.
이럴 때 쓴다.
- 목록이 수백~수천 개로 크거나 계산이 무거울 때
- 계산 결과를 자식 컴포넌트에 props로 넘기고, 자식이 `React.memo`로 불필요한 렌더링을 막고 있을 때 (배열은 매번 새로 만들면 '다른 값'으로 취급되기 때문)

면접에서 "`useMemo`를 언제 쓰나요?"라는 질문에 **"필요할 때만 쓴다"** 와 그 이유를 말할 수 있으면 좋다.

**5. 접근성: label로 input 감싸기**
`<label><input type="checkbox" /> 품절 상품 숨기기</label>` 처럼 감싸면 `htmlFor`/`id` 없이도 연결된다.
글자를 눌러도 체크되니 클릭 영역이 넓어진다. 체크박스 색은 `accent-color`로만 바꿔서, 브라우저 기본 체크박스의 키보드·스크린리더 지원을 그대로 살렸다.

### 확인 방법
1. "품절 상품 숨기기"를 체크 → 상품 수가 12개에서 10개로 줄어드는지 (스피커, 오픈형 이어폰이 사라짐)
2. "오디오" + 품절 숨기기 → 헤드폰 1개만 남는지
3. 체크박스 옆 **글자**를 눌러도 체크되는지
4. Tab 키로 이동해서 Space 키로 체크할 수 있는지 (키보드 접근성)
5. 다크 모드를 켜고 꺼도 필터 상태가 유지되는지

---

## Step 2 정리 — 면접에서 이렇게 말할 수 있다
> "검색·카테고리·재고·정렬 조건을 모두 상위 컴포넌트의 state로 관리하고, 화면에 보여 줄 목록은 state로 따로 저장하지 않고 파생 값으로 계산했습니다.
> 걸러내기와 정렬은 순수 함수로 분리해 컴포넌트와 독립적으로 테스트할 수 있게 했고, `sort()`가 원본을 바꾸는 문제는 배열을 복사해서 불변성을 지켰습니다."

## 다음 스텝 예고 — Step 3 라우팅
지금은 새로고침하면 검색어와 필터가 모두 초기화되고, 필터를 건 화면을 링크로 공유할 수도 없다.
Step 3에서는 react-router로 **상품 상세 페이지**를 만들고, 필터 상태를 **URL 쿼리**(`?category=오디오&sort=price-asc`)로 옮겨서 이 문제를 해결한다.
