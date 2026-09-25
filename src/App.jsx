import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import CardGrid from './components/CardGrid'
import { products } from './data/products'
import { ALL_CATEGORIES, filterProducts, getCategories } from './lib/filterProducts'

// 카테고리 목록은 상품 데이터가 바뀌지 않는 한 항상 같다.
// 그래서 컴포넌트 밖에서 한 번만 계산한다. (컴포넌트 안에 두면 렌더링마다 다시 계산됨)
// ※ Step 5에서 데이터를 API로 받아오면 이 부분은 컴포넌트 안으로 옮기게 된다.
const categories = getCategories(products)

// 앱의 최상위 컴포넌트
// - 화면 전체에서 공유해야 하는 상태(다크 모드, 검색어, 카테고리)를 여기서 관리한다.
// - 자식 컴포넌트에는 props로 '값'과 '값을 바꾸는 함수'를 내려준다.
//   이렇게 상태를 공통 부모로 올리는 것을 '상태 끌어올리기(lifting state up)'라고 한다.
function App() {
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)

  // 화면에 보여 줄 상품 목록
  // useState로 따로 저장하지 않고, 렌더링할 때마다 계산한다. (= 파생 상태)
  // 이유: query와 category만 있으면 언제든 다시 계산할 수 있으므로,
  //       state로 또 저장하면 원본과 값이 어긋나는 버그가 생기기 쉽다.
  const visible = filterProducts(products, { query, category })

  return (
    // 다크 모드: 최상위에 'dark' 클래스를 붙이면 Tailwind의 dark: 스타일이 적용된다
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        {/* setDark((d) => !d): 이전 값을 받아 뒤집는 함수형 업데이트 */}
        <Header dark={dark} onToggle={() => setDark((d) => !d)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchBar value={query} onChange={setQuery} />
          <CategoryFilter categories={categories} value={category} onChange={setCategory} />
          <CardGrid products={visible} query={query} />
        </main>
      </div>
    </div>
  )
}

export default App
