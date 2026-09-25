import { useMemo, useState } from 'react'
import SearchBar from '../components/SearchBar'
import CategoryFilter from '../components/CategoryFilter'
import SortSelect from '../components/SortSelect'
import SoldOutToggle from '../components/SoldOutToggle'
import CardGrid from '../components/CardGrid'
import { products } from '../data/products'
import { ALL_CATEGORIES, filterProducts, getCategories } from '../lib/filterProducts'
import { SORT_OPTIONS, sortProducts } from '../lib/sortProducts'

// 상품 목록 페이지 — 주소 "/" (Step 3-1)
//
// Step 2까지 App.jsx에 있던 목록 화면을 그대로 옮겨 왔다.
// pages/ 폴더: 주소 하나에 대응하는 '페이지' 컴포넌트를 모아 둔다.
// components/ 폴더: 여러 페이지에서 재사용하는 '부품' 컴포넌트를 모아 둔다.
//
// ⚠️ 알려진 문제 (Step 3-3에서 해결 예정)
// 검색·필터 상태가 이 페이지의 useState에 있어서, 상세 페이지에 갔다가 돌아오면
// 이 컴포넌트가 새로 만들어지면서 상태가 모두 초기화된다. 새로고침해도 마찬가지다.

// 카테고리 목록은 상품 데이터가 바뀌지 않는 한 항상 같다.
// 그래서 컴포넌트 밖에서 한 번만 계산한다. (컴포넌트 안에 두면 렌더링마다 다시 계산됨)
// ※ Step 5에서 데이터를 API로 받아오면 이 부분은 컴포넌트 안으로 옮기게 된다.
const categories = getCategories(products)

function ProductListPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  // 정렬 기준. SORT_OPTIONS의 value 중 하나가 들어간다 (Step 2-2)
  const [sort, setSort] = useState('default')
  // 품절 상품 숨기기 여부 (Step 2-3)
  const [hideSoldOut, setHideSoldOut] = useState(false)

  // 화면에 보여 줄 상품 목록 (파생 상태 + useMemo, Step 2-3)
  // - 의존성 배열의 값 중 하나라도 바뀌었을 때만 다시 계산한다.
  // - 계산 순서: ① 걸러내기 → ② 정렬
  const visible = useMemo(() => {
    const filtered = filterProducts(products, { query, category, hideSoldOut })
    return sortProducts(filtered, sort)
  }, [query, category, hideSoldOut, sort])

  return (
    <>
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
    </>
  )
}

export default ProductListPage
