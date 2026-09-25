// 상품 목록을 정렬하는 로직 (Step 2-2)
//
// filterProducts.js와 마찬가지로 JSX를 쓰지 않는 순수 함수만 모아 둔다.
// '걸러내기'와 '정렬'은 하는 일이 달라서 파일을 나눴다.

// 정렬 옵션 목록
// - value: 코드에서 쓰는 값 (state에 저장되는 값)
// - label: 화면에 보여 줄 이름
// 옵션을 배열로 만들어 두면 <select>의 <option>을 map으로 그릴 수 있고,
// 옵션을 추가할 때 이 배열과 아래 COMPARATORS만 고치면 된다.
export const SORT_OPTIONS = [
  { value: 'default', label: '기본순' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
  { value: 'rating', label: '평점 높은순' },
]

// 정렬 기준별 '비교 함수'
// sort()는 두 요소 a, b를 비교 함수에 넣어 결과로 순서를 정한다.
// - 결과가 음수 → a를 앞에
// - 결과가 양수 → b를 앞에
// - 0          → 순서 유지
// 그래서 a.price - b.price는 오름차순(작은 값이 앞), b.price - a.price는 내림차순이 된다.
// ※ price가 문자열('₩189,000')이었다면 이런 빼기 계산이 불가능하다. Step 1에서 숫자로 바꾼 이유!
const COMPARATORS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'rating': (a, b) => b.rating - a.rating,
}

// 선택한 정렬 기준(sort)으로 정렬한 '새 배열'을 돌려준다.
export function sortProducts(products, sort) {
  const compare = COMPARATORS[sort]

  // 'default'처럼 비교 함수가 없는 기준이면 데이터 순서 그대로 돌려준다
  if (!compare) return products

  // ⚠️ 중요: sort()는 원본 배열 자체를 바꿔 버린다(mutate).
  // products를 바로 sort하면 원본 데이터 순서가 망가져서 '기본순'으로 돌아갈 수 없게 된다.
  // 그래서 [...products]로 복사본을 만든 뒤 정렬한다.
  // React에서는 state나 props로 받은 배열·객체를 직접 바꾸지 않는 것이 기본 규칙이다. (불변성)
  return [...products].sort(compare)
}
