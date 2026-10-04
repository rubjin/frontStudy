import { ALL_CATEGORIES } from '@/lib/filterProducts'
import { SORT_OPTIONS, type SortValue } from '@/lib/sortProducts'

// 목록 화면의 검색·필터·정렬 상태 ↔ 주소 쿼리(?q=...&category=...) 변환 (Step 4-2)
//
// 왜 상태를 주소에 담나?
// - Step 3까지는 useState에 있어서 새로고침하거나 상세 페이지에 갔다가 돌아오면 초기화됐다.
// - 주소에 담으면 새로고침·뒤로 가기·링크 공유를 해도 같은 화면이 나온다.
//   예) /?q=무선&category=오디오&sort=price-asc&instock=1
//
// 주소 형식 (기본값은 주소에 적지 않아서 처음 화면은 그냥 "/")
// | 키       | 값                        | 기본값(생략)  |
// | q        | 검색어                    | ''            |
// | category | 카테고리 이름              | '전체'        |
// | sort     | price-asc · price-desc · rating | 'default' |
// | instock  | 1 = 품절 상품 숨기기       | 없음(보이기)  |

// 화면이 쓰는 필터 값 한 묶음
export interface CatalogFilters {
  query: string
  category: string
  sort: SortValue
  hideSoldOut: boolean
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  category: ALL_CATEGORIES,
  sort: 'default',
  hideSoldOut: false,
}

// 주소 쿼리의 키 이름. 읽기·쓰기 두 함수가 같은 이름을 써야 하므로 한 곳에 모은다
const KEYS = { query: 'q', category: 'category', sort: 'sort', hideSoldOut: 'instock' } as const

// 정렬 값 목록 — 주소에 없는 값(?sort=abc)이 들어오면 기본값으로 바꾸기 위해 쓴다
const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value))

// 주소 쿼리 → 필터 값 (읽기)
//
// ⚠️ 주소는 사용자가 마음대로 고칠 수 있다. 들어온 값을 그대로 믿지 말고 '허용된 값인지' 검사한다.
// - sort가 목록에 없으면 'default'
// - category가 실제 카테고리가 아니면 '전체' (없는 카테고리를 고른 상태로 빈 화면이 되는 것을 막는다)
//
// params: URLSearchParams — 브라우저의 useSearchParams()가 돌려주는 값과 같은 모양 (get으로 꺼낸다)
// categories: 허용할 카테고리 목록
//   null이면 검사하지 않고 그대로 쓴다 (Step 6-1, API용). API는 없는 카테고리를 '결과 0개'로 답하면 되므로
//   카테고리 목록을 먼저 조회할 필요가 없다. (화면은 빈 화면 대신 '전체'를 보여 주는 게 친절해서 검사한다)
export function parseCatalogParams(
  params: Pick<URLSearchParams, 'get'>,
  categories: readonly string[] | null,
): CatalogFilters {
  const sort = params.get(KEYS.sort) ?? ''
  const category = params.get(KEYS.category) ?? ''

  return {
    // ?? : 왼쪽이 null(키가 없음)이면 오른쪽 값을 쓴다
    query: params.get(KEYS.query) ?? DEFAULT_FILTERS.query,
    category: category && (categories === null || categories.includes(category)) ? category : DEFAULT_FILTERS.category,
    // SORT_VALUES로 검사했으므로 SortValue라고 알려 준다 (as: 타입 단언)
    sort: SORT_VALUES.has(sort) ? (sort as SortValue) : DEFAULT_FILTERS.sort,
    hideSoldOut: params.get(KEYS.hideSoldOut) === '1',
  }
}

// 필터 값 → 주소 쿼리 문자열 (쓰기). 예) '?q=%EB%AC%B4%EC%84%A0&sort=rating', 모두 기본값이면 ''
//
// URLSearchParams: 쿼리 문자열을 만들어 주는 브라우저 내장 도구.
// 한글·공백·& 같은 특수 문자를 주소에 쓸 수 있는 형태로 알아서 바꿔 준다(인코딩). 직접 문자열을 이어 붙이면 깨지기 쉽다.
// 서버(Node.js)에도 같은 이름으로 있어서 서버 컴포넌트에서도 쓸 수 있다. (ProductDetail의 카테고리 링크)
export function toCatalogSearch(filters: Partial<CatalogFilters>): string {
  const { query, category, sort, hideSoldOut } = { ...DEFAULT_FILTERS, ...filters }
  const params = new URLSearchParams()

  // 기본값과 다른 것만 적는다 → 주소가 짧고 깔끔해진다
  // 검색어는 trim하지 않고 그대로 적는다. 입력창이 주소 값을 따라가므로, 지우면 '무선 '에서 띄어쓰기가 사라져
  // '무선 이어폰'을 입력할 수 없다. (공백만 있는 경우만 생략. 검색할 때의 trim은 filterProducts가 한다)
  if (query.trim()) params.set(KEYS.query, query)
  if (category !== DEFAULT_FILTERS.category) params.set(KEYS.category, category)
  if (sort !== DEFAULT_FILTERS.sort) params.set(KEYS.sort, sort)
  if (hideSoldOut) params.set(KEYS.hideSoldOut, '1')

  const search = params.toString()
  return search ? `?${search}` : ''
}
