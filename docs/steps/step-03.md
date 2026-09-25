# Step 3. 라우팅 — 상세 페이지 · URL로 상태 관리

> 상태: 진행 중 (3-1 완료)

## 목표
지금까지는 화면이 하나뿐이었다. 실제 서비스에는 **주소(URL)마다 다른 페이지**가 있다.
react-router로 목록 · 상세 · 404 페이지를 나누고, 마지막에는 검색·필터 상태를 URL에 담아 **새로고침해도 유지되고 링크로 공유할 수 있게** 만든다.

## 세부 단계
- [x] **3-1** 라우터 설치, 페이지 나누기(목록 / 상세 뼈대 / 404), 카드를 링크로
- [ ] **3-2** 상품 상세 페이지 완성
- [ ] **3-3** 검색·필터·정렬 상태를 URL 쿼리로 옮기기

---

## 3-1. 라우터 설치와 페이지 나누기

### 설치
```bash
npm install react-router@7
```
> 최신 react-router(v8)는 React 19가 필요하다. 이 프로젝트는 React 18이라 v7을 설치했다.
> 라이브러리를 설치할 때는 **내 프로젝트의 React 버전과 맞는지(peerDependencies)** 확인하는 습관을 들이자.
> 확인 명령: `npm view react-router peerDependencies`

### 바뀐 구조
```
main.jsx
 └─ BrowserRouter          ← 주소 정보를 앱 전체에 제공
     └─ App (상태: dark)    ← 모든 페이지 공통 레이아웃
         ├─ Header          ← 로고 = 홈 링크
         └─ Routes          ← 주소에 맞는 페이지 하나만 보여 줌
             ├─ "/"              → ProductListPage   (Step 2의 목록 화면 + 상태 전부)
             ├─ "/products/:id"  → ProductDetailPage (지금은 뼈대)
             └─ "*"              → NotFoundPage
```

### 파일별 설명
| 파일 | 역할 |
| --- | --- |
| `src/main.jsx` | 앱을 `BrowserRouter`로 감쌈 |
| `src/App.jsx` | 레이아웃 + `Routes`만 담당. 목록 관련 상태는 목록 페이지로 이동 |
| `src/pages/ProductListPage.jsx` (새 파일) | Step 2까지 App에 있던 목록 화면을 그대로 옮김 |
| `src/pages/ProductDetailPage.jsx` (새 파일) | `useParams`로 id를 꺼내 보여 주는 뼈대 |
| `src/pages/NotFoundPage.jsx` (새 파일) | 없는 주소일 때 보여 줄 404 화면 |
| `src/components/Card.jsx` | 상품명에 `Link`를 걸고 '늘린 링크' 패턴으로 카드 전체를 클릭 영역으로 |
| `src/components/Header.jsx` | 로고를 홈으로 가는 `Link`로 변경 |

### 핵심 개념

**1. SPA와 클라이언트 라우팅**
실제 HTML 파일은 `index.html` 하나뿐이다. 주소가 바뀌면 서버에서 새 페이지를 받지 않고 **React가 화면만 바꿔 끼운다.**
그래서 페이지를 옮겨도 다크 모드 상태가 유지되고, 화면 전환이 빠르다.

**2. `<Link>` vs `<a href>`**
```jsx
<a href="/products/3">   // 페이지 전체를 새로 불러옴 → 상태가 전부 초기화됨
<Link to="/products/3">  // 주소만 바꾸고 React가 화면을 교체 → 상태 유지
```
앱 안에서 이동할 때는 `Link`, 외부 사이트로 갈 때는 `a`를 쓴다.
`Link`도 실제로는 `<a>` 태그로 그려지므로 가운데 클릭(새 탭 열기)이나 접근성은 그대로 유지된다.

**3. 동적 경로와 `useParams`**
```jsx
<Route path="/products/:id" element={<ProductDetailPage />} />

const { id } = useParams() // /products/3 → id = '3' (문자열!)
```
상품이 100개여도 Route는 하나면 된다. 주소에서 온 값은 **항상 문자열**이라 숫자와 비교할 때 `Number(id)`로 바꿔야 한다.

**4. `pages/`와 `components/` 나누기**
- `pages/`: 주소 하나에 대응하는 페이지
- `components/`: 여러 곳에서 재사용하는 부품
폴더만 봐도 "이 앱에 어떤 화면이 있는지" 알 수 있다.

**5. 늘린 링크(stretched link) 패턴 — 퍼블리셔 강점**
```jsx
<article className="relative ...">
  <h3>
    <Link to="/products/1" className="after:absolute after:inset-0">상품명</Link>
  </h3>
</article>
```
- 카드 전체를 `<a>`로 감싸면 스크린리더가 카드 안의 모든 글자를 링크 이름으로 한꺼번에 읽는다.
- 링크는 상품명에만 걸고, `::after` 가상 요소를 카드 크기만큼 늘려서 **클릭 영역만 카드 전체로** 만든다.
- 키보드 포커스는 `has-[:focus-visible]:ring-2`로 카드 전체에 테두리를 그려 보여 준다. CSS `:has()` 선택자를 사용한 것이다.

**6. 404 페이지**
SPA에서는 React가 주소를 해석하므로 **없는 주소 처리도 직접** 해야 한다. `path="*"`는 위의 어떤 Route와도 맞지 않을 때 쓰인다.

### 알려진 문제 (의도적으로 남겨 둠 → 3-3에서 해결)
1. 카테고리를 "오디오"로 바꾼다
2. 카드를 눌러 상세 페이지로 간다
3. "목록으로"를 누르거나 뒤로 가기를 한다
4. → **필터가 "전체"로 초기화된다**

목록 페이지가 사라졌다가 새로 만들어지면서 `useState` 값도 처음으로 돌아가기 때문이다.
3-3에서 이 상태를 URL(`/?category=오디오`)에 저장해서 해결한다.

### 확인 방법
1. 카드 아무 곳(이미지, 가격 등)을 눌러도 상세 페이지로 이동하는지. 주소가 `/products/번호`로 바뀌는지
2. 브라우저 뒤로 가기가 동작하는지
3. 헤더 로고를 누르면 목록으로 돌아오는지
4. 주소창에 `/abc`를 입력하면 404 페이지가 나오는지
5. 다크 모드를 켜고 페이지를 이동해도 다크 모드가 유지되는지
6. Tab 키로 카드를 이동할 때 카드 전체에 파란 테두리가 생기는지
7. 위의 "알려진 문제"를 직접 재현해 보기
