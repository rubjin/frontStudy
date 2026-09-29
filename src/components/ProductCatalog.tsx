'use client'

import { useMemo, useState } from 'react'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import SortSelect from './SortSelect'
import SoldOutToggle from './SoldOutToggle'
import CardGrid from './CardGrid'
import { products } from '@/data/products'
import { ALL_CATEGORIES, filterProducts, getCategories } from '@/lib/filterProducts'
import { SORT_OPTIONS, sortProducts, type SortValue } from '@/lib/sortProducts'

// 상품 목록 화면 — 검색·필터·정렬 상태를 가진 클라이언트 컴포넌트 (Step 3-1)
//
// Step 2까지 App.jsx에 있던 목록 화면 → react-router 시절 pages/ProductListPage.jsx → 지금 이 파일.
//
// Step 3-1 (Next.js 전환): 왜 app/page.tsx에 바로 쓰지 않고 따로 뺐나?
// - 이 화면은 useState(검색어, 카테고리...)를 쓰므로 'use client'가 필요하다.
// - page.tsx 전체를 클라이언트로 만들면 페이지 제목·설명 같은 정적인 부분까지 브라우저로 넘어간다.
// - 그래서 page.tsx는 서버 컴포넌트로 두고, 상호작용이 필요한 이 부분만 'use client'로 분리했다.
//
// '@/...' 경로: tsconfig.json의 paths 설정으로 '@/'가 'src/'를 가리킨다.
// '../../lib/...'처럼 ../를 세지 않아도 되고, 파일을 옮겨도 import가 덜 깨진다.
//
// ⚠️ 알려진 문제 (Step 4에서 URL 쿼리로 해결 예정)
// 검색·필터 상태가 이 페이지의 useState에 있어서, 상세 페이지에 갔다가 돌아오면
// 이 컴포넌트가 새로 만들어지면서 상태가 모두 초기화된다. 새로고침해도 마찬가지다.

// 카테고리 목록은 상품 데이터가 바뀌지 않는 한 항상 같다.
// 그래서 컴포넌트 밖에서 한 번만 계산한다. (컴포넌트 안에 두면 렌더링마다 다시 계산됨)
// ※ Step 6에서 데이터를 API로 받아오면 이 부분은 컴포넌트 안으로 옮기게 된다.
const categories = getCategories(products)

function ProductCatalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  // 정렬 기준. SORT_OPTIONS의 value 중 하나가 들어간다 (Step 2-2)
  // useState<SortValue>: 이 state에는 SortValue 타입만 들어갈 수 있다고 알려 준다 (제네릭)
  const [sort, setSort] = useState<SortValue>('default')
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

export default ProductCatalog
