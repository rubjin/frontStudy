import { useMemo, useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import SortSelect from './components/SortSelect'
import SoldOutToggle from './components/SoldOutToggle'
import CardGrid from './components/CardGrid'
import { products } from './data/products'
import { ALL_CATEGORIES, filterProducts, getCategories } from './lib/filterProducts'
import { SORT_OPTIONS, sortProducts } from './lib/sortProducts'

// 카테고리 목록은 상품 데이터가 바뀌지 않는 한 항상 같다.
// 그래서 컴포넌트 밖에서 한 번만 계산한다. (컴포넌트 안에 두면 렌더링마다 다시 계산됨)
// ※ Step 5에서 데이터를 API로 받아오면 이 부분은 컴포넌트 안으로 옮기게 된다.
const categories = getCategories(products)

// 앱의 최상위 컴포넌트
// - 화면 전체에서 공유해야 하는 상태(다크 모드, 검색어, 카테고리, 정렬, 품절 숨기기)를 여기서 관리한다.
// - 자식 컴포넌트에는 props로 '값'과 '값을 바꾸는 함수'를 내려준다.
//   이렇게 상태를 공통 부모로 올리는 것을 '상태 끌어올리기(lifting state up)'라고 한다.
function App() {
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  // 정렬 기준. SORT_OPTIONS의 value 중 하나가 들어간다 (Step 2-2)
  const [sort, setSort] = useState('default')
  // 품절 상품 숨기기 여부 (Step 2-3)
  const [hideSoldOut, setHideSoldOut] = useState(false)

  // 화면에 보여 줄 상품 목록
  // useState로 따로 저장하지 않고 계산해서 만든다. (= 파생 상태)
  // 이유: query, category, sort, hideSoldOut만 있으면 언제든 다시 계산할 수 있으므로,
  //       state로 또 저장하면 원본과 값이 어긋나는 버그가 생기기 쉽다.
  //
  // 계산 순서: ① 걸러내기 → ② 정렬
  // 걸러내기를 먼저 하면 정렬할 개수가 줄어들어 조금 더 효율적이다.
  //
  // useMemo (Step 2-3): 계산 결과를 기억해 두는 Hook
  // - 형태: useMemo(() => 계산식, [의존성 배열])
  // - 의존성 배열 안의 값 중 하나라도 바뀌었을 때만 다시 계산하고,
  //   아니면 지난번 결과를 그대로 돌려준다.
  // - 예) 다크 모드 버튼을 누르면 App이 다시 렌더링되지만,
  //       dark는 배열에 없으므로 목록 계산은 건너뛴다.
  // ⚠️ 의존성 배열에 계산에 쓰는 값을 빠뜨리면 화면이 옛날 값으로 멈춘다.
  //    ESLint(react-hooks/exhaustive-deps)가 빠진 값을 경고해 주니 경고를 무시하지 말 것.
  const visible = useMemo(() => {
    const filtered = filterProducts(products, { query, category, hideSoldOut })
    return sortProducts(filtered, sort)
  }, [query, category, hideSoldOut, sort])

  return (
    // 다크 모드: 최상위에 'dark' 클래스를 붙이면 Tailwind의 dark: 스타일이 적용된다
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        {/* setDark((d) => !d): 이전 값을 받아 뒤집는 함수형 업데이트 */}
        <Header dark={dark} onToggle={() => setDark((d) => !d)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchBar value={query} onChange={setQuery} />

          {/* 툴바: 카테고리 필터(왼쪽)와 보기 옵션(오른쪽: 품절 숨기기 + 정렬)
              모바일에서는 세로로 쌓고(flex-col), sm 이상에서 한 줄로 양끝 정렬 */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CategoryFilter categories={categories} value={category} onChange={setCategory} />
            {/* shrink-0: 공간이 좁아도 이 묶음은 줄어들지 않게 해서 글자가 줄바꿈되지 않도록 한다 */}
            <div className="flex shrink-0 items-center gap-4">
              <SoldOutToggle checked={hideSoldOut} onChange={setHideSoldOut} />
              <SortSelect options={SORT_OPTIONS} value={sort} onChange={setSort} />
            </div>
          </div>

          <CardGrid products={visible} query={query} />
        </main>
      </div>
    </div>
  )
}

export default App
