// 상품 목록을 걸러내는 로직만 모아 둔 파일 (Step 2)
//
// 왜 컴포넌트 밖으로 뺐나?
// - 이 함수들은 JSX를 쓰지 않는 '순수 함수'다.
//   순수 함수란: 같은 입력을 넣으면 항상 같은 결과가 나오고, 바깥 값을 바꾸지 않는 함수.
// - 화면과 분리해 두면 어디서든 재사용할 수 있고, 테스트(Step 9)도 쉽다.
// - 나중에 데이터를 API에서 받아와도(Step 5) 이 함수는 그대로 쓸 수 있다.

// '전체' 문자열을 여러 파일에서 쓰기 때문에 상수로 만들어 둔다.
// 오타로 '젼체'처럼 써서 생기는 버그를 막을 수 있다.
export const ALL_CATEGORIES = '전체'

// 상품 데이터에서 카테고리 목록을 뽑아낸다.
// 예) ['전체', '오디오', '웨어러블', '주변기기', ...]
export function getCategories(products) {
  // products.map(...)      → 모든 상품의 카테고리만 모은 배열 (중복 있음)
  // new Set(...)           → Set은 중복을 허용하지 않는 자료구조라 중복이 자동으로 제거된다
  // [...new Set(...)]      → 전개 연산자(...)로 Set을 다시 배열로 펼친다
  // 맨 앞에 '전체'를 붙여서 버튼 목록 첫 번째로 나오게 한다
  return [ALL_CATEGORIES, ...new Set(products.map((p) => p.category))]
}

// 검색어(query), 카테고리(category), 품절 숨기기(hideSoldOut) 조건을 모두 만족하는 상품만 돌려준다.
// 두 번째 인자를 객체로 받는 이유: 조건이 늘어나도 인자 순서를 신경 쓰지 않고
// { 이름: 값 } 형태로 추가할 수 있다. (실제로 Step 2-3에서 hideSoldOut을 이렇게 추가했다)
//
// hideSoldOut = false: 기본값 매개변수.
// 호출하는 쪽에서 hideSoldOut을 안 넘기면 false로 취급한다. → 기존 호출 코드가 깨지지 않는다.
export function filterProducts(products, { query, category, hideSoldOut = false }) {
  // 앞뒤 공백을 지우고(trim) 소문자로 바꿔서(toLowerCase) 대소문자 구분 없이 비교한다.
  const keyword = query.trim().toLowerCase()

  // filter는 콜백이 true를 돌려준 요소만 모아 '새 배열'을 만든다. (원본은 그대로)
  return products.filter((p) => {
    // 검색어 조건: 검색어가 비어 있으면(!keyword) 무조건 통과,
    // 아니면 상품명이나 카테고리에 검색어가 포함돼 있으면 통과
    const matchesKeyword =
      !keyword ||
      p.name.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword)

    // 카테고리 조건: '전체'를 골랐으면 무조건 통과, 아니면 카테고리가 같아야 통과
    const matchesCategory = category === ALL_CATEGORIES || p.category === category

    // 재고 조건 (Step 2-3): 숨기기를 켰으면 재고가 있어야(stock > 0) 통과, 껐으면 무조건 통과
    const matchesStock = !hideSoldOut || p.stock > 0

    // 세 조건을 모두 만족해야(&&) 목록에 남는다
    return matchesKeyword && matchesCategory && matchesStock
  })
}
