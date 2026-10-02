'use client'

import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import SortSelect from './SortSelect'
import SoldOutToggle from './SoldOutToggle'
import CardGrid from './CardGrid'
import { products } from '@/data/products'
import { filterProducts, getCategories } from '@/lib/filterProducts'
import { SORT_OPTIONS, sortProducts } from '@/lib/sortProducts'
import { parseCatalogParams, toCatalogSearch, type CatalogFilters } from '@/lib/catalogParams'
import styles from './ProductCatalog.module.scss'

// 상품 목록 화면 — 검색·필터·정렬 (Step 3-1 → Step 4-2에서 상태를 주소로 옮김)
//
// Step 3-1: 왜 app/page.tsx에 바로 쓰지 않고 따로 뺐나?
// - 상호작용(입력·클릭)이 있어서 'use client'가 필요하다. page.tsx는 서버 컴포넌트로 두고 이 부분만 분리했다.
//
// Step 4-2: 상태를 useState → 주소 쿼리(?q=...&category=...)로
// - 예전 문제: 상세 페이지에 갔다가 돌아오거나 새로고침하면 검색어·필터가 모두 초기화됐다.
// - 이제 '주소'가 유일한 원본(single source of truth)이다.
//   읽기: useSearchParams()로 주소의 쿼리를 읽어 필터 값으로 바꾼다 (parseCatalogParams)
//   쓰기: 바뀐 필터 값을 주소로 만들어 window.history에 넣는다 (toCatalogSearch)
//   → 주소가 바뀌면 useSearchParams가 새 값을 돌려주고, 화면이 다시 그려진다.
// - useState가 없어졌다. 같은 값을 state와 주소 두 곳에 두면 어긋나기 쉽기 때문이다.
//
// 왜 router.push가 아니라 window.history인가?
// - router.push/replace는 '페이지 이동'이라 서버에 새 화면(RSC)을 요청한다. 검색어 한 글자마다 요청이 간다.
// - window.history.pushState/replaceState는 주소만 바꾸고 서버 요청이 없다.
//   Next.js가 이 호출을 감지해서 useSearchParams도 같이 갱신해 준다. (Next.js 공식 문서의 방법)
// - 걸러내기는 어차피 브라우저에 있는 상품 데이터로 하므로 서버에 물어볼 필요가 없다.
//   (Step 6에서 API로 바꾸면 그때 '주소가 바뀌면 다시 가져오기'를 붙인다)
//
// push vs replace — '뒤로 가기'를 눌렀을 때 무엇이 돌아오면 자연스러운가?
// - 카테고리·정렬·품절 숨기기: 한 번 고르는 '선택' → pushState (방문 기록에 쌓임. 뒤로 가기 = 직전 선택으로)
// - 검색어: 한 글자마다 바뀜 → replaceState (기록을 덮어씀. '무', '무선'... 글자마다 뒤로 가기를 눌러야 하면 불편하다)

// 카테고리 목록은 상품 데이터가 바뀌지 않는 한 항상 같아서 컴포넌트 밖에서 한 번만 계산한다.
// ※ Step 6에서 데이터를 API로 받아오면 컴포넌트 안으로 옮기게 된다.
const categories = getCategories(products)

function ProductCatalog() {
  // 지금 주소의 쿼리와 경로("/") — 주소가 바뀌면 새 값으로 다시 그려진다
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // 주소 → 필터 값. 잘못된 값(?sort=abc)은 여기서 기본값으로 바뀐다
  const filters = parseCatalogParams(searchParams, categories)
  const { query, category, sort, hideSoldOut } = filters

  // 필터 하나를 바꾸고 주소에 반영한다
  // - patch: 바꿀 값만 담은 객체. 예) { category: '오디오' } → 나머지 필터는 그대로 유지
  // - Partial<CatalogFilters>: CatalogFilters의 모든 필드를 '있어도 되고 없어도 되게' 만든 타입
  function updateFilters(patch: Partial<CatalogFilters>, mode: 'push' | 'replace') {
    const url = pathname + toCatalogSearch({ ...filters, ...patch })
    // 첫 번째 인자(state)는 쓰지 않으므로 null, 두 번째는 옛 브라우저 호환용이라 빈 문자열
    if (mode === 'push') window.history.pushState(null, '', url)
    else window.history.replaceState(null, '', url)
  }

  // 화면에 보여 줄 상품 목록 (파생 상태 + useMemo, Step 2-3)
  // 필터 값이 하나라도 바뀌었을 때만 다시 계산한다. 계산 순서: ① 걸러내기 → ② 정렬
  const visible = useMemo(() => {
    const filtered = filterProducts(products, { query, category, hideSoldOut })
    return sortProducts(filtered, sort)
  }, [query, category, hideSoldOut, sort])

  return (
    <>
      <SearchBar value={query} onChange={(value) => updateFilters({ query: value }, 'replace')} />

      {/* 툴바: 카테고리 필터(왼쪽)와 보기 옵션(오른쪽: 품절 숨기기 + 정렬)
          모바일에서는 세로로 쌓고, 640px 이상에서 한 줄로 양끝 정렬 */}
      <div className={styles.toolbar}>
        <CategoryFilter
          categories={categories}
          value={category}
          onChange={(value) => updateFilters({ category: value }, 'push')}
        />
        <div className={styles.options}>
          <SoldOutToggle checked={hideSoldOut} onChange={(value) => updateFilters({ hideSoldOut: value }, 'push')} />
          <SortSelect
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => updateFilters({ sort: value }, 'push')}
          />
        </div>
      </div>

      <CardGrid products={visible} query={query} />
    </>
  )
}

export default ProductCatalog
