# Step 2. 카테고리 필터 · 정렬 · 품절 숨기기

> 상태: 진행 중 (2-1 완료)

## 목표
검색 하나만 있던 화면에 **여러 조건(카테고리, 정렬, 품절 숨기기)** 을 동시에 적용한다.
조건이 늘어날 때 코드가 엉키지 않도록 **상태는 어디에 두고, 계산은 어디서 하는지** 구조를 잡는 것이 핵심이다.

## 세부 단계
- [x] **2-1** 카테고리 필터
- [ ] **2-2** 정렬(가격 낮은순·높은순, 평점순)
- [ ] **2-3** 품절 숨기기 + `useMemo` 정리

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
