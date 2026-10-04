'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import SortSelect from './SortSelect'
import SoldOutToggle from './SoldOutToggle'
import CardGrid from './CardGrid'
import CatalogSkeleton from './CatalogSkeleton'
import { InlineError } from './ui/InlineError'
import { Button } from './ui/Button'
import { SORT_OPTIONS } from '@/lib/sortProducts'
import { parseCatalogParams, toCatalogSearch, type CatalogFilters } from '@/lib/catalogParams'
import { productQueries } from '@/lib/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { ApiError } from '@/lib/api'
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
// - (Step 7-2) 주소가 바뀌면 필터 값이 바뀌고 → 쿼리 키가 바뀌고 → TanStack Query가 그 조건의 목록을 API로 받는다.
//   페이지(RSC) 전체가 아니라 목록 데이터(JSON)만 요청한다.
//
// push vs replace — '뒤로 가기'를 눌렀을 때 무엇이 돌아오면 자연스러운가?
// - 카테고리·정렬·품절 숨기기: 한 번 고르는 '선택' → pushState (방문 기록에 쌓임. 뒤로 가기 = 직전 선택으로)
// - 검색어: 한 글자마다 바뀜 → replaceState (기록을 덮어씀. '무', '무선'... 글자마다 뒤로 가기를 눌러야 하면 불편하다)

// Step 6-2: 상품·카테고리를 props로 받았다 (전체 상품을 받아 브라우저에서 걸러냄)
// Step 7-2: 상품 목록은 TanStack Query로 '걸러진 결과'를 API에서 받는다
// - 왜? 상품이 수천 개가 되면 전부 받아 브라우저에서 거를 수 없다. 서버가 거르고 필요한 만큼만 보낸다(7-3 더 보기).
// - 첫 화면: 서버(page.tsx)가 같은 키로 미리 받아 캐시에 넣어 둔다(HydrationBoundary) → 첫 HTML에 목록이 있고, 브라우저는 다시 요청하지 않는다.
// - 필터를 바꾸면: 키 ['products','list',{필터}]가 바뀌어 그 조건으로 요청. 한 번 본 조건은 캐시에서 바로 나온다(뒤로 가기 즉시).
// - placeholderData: keepPreviousData — 새 조건의 결과가 오는 동안 이전 목록을 흐리게 보여 준다(스켈레톤으로 깜빡이지 않게).
// - 검색어는 300ms debounce (lib/useDebouncedValue) — 입력이 멈췄을 때 한 번만 요청
//
// Step 7-3: 나눠 받기 — useInfiniteQuery + '더 보기' 버튼
// - 처음엔 8개(PRODUCTS_PAGE_SIZE)만 받고, '더 보기'를 누르면 다음 8개를 이어 붙인다.
// - 왜 스크롤하면 저절로 불러오는 '무한 스크롤'이 아니라 버튼인가? (접근성·사용성)
//   · 무한 스크롤은 페이지 맨 아래(푸터)에 영영 닿을 수 없다. 키보드·스크린리더 사용자는 언제 내용이 늘어나는지 알기 어렵다.
//   · 버튼은 사용자가 '더 볼지'를 정하고, 몇 개 중 몇 개를 봤는지 알 수 있다.
// - 더 불러온 뒤에는 '새로 나온 첫 상품'으로 포커스를 옮긴다 → 키보드 사용자가 이어서 볼 수 있고,
//   마지막 페이지라 버튼이 사라져도 포커스가 튕기지 않는다 (Step 5-2 원칙)
//
// props
// - categories: 카테고리 버튼 목록 ('전체' 포함). 거의 바뀌지 않아 서버가 한 번 받아 넘긴다
interface ProductCatalogProps {
  categories: string[]
}

// 검색어 입력이 이만큼 멈추면 요청한다 (ms)
const SEARCH_DEBOUNCE_MS = 300

function ProductCatalog({ categories }: ProductCatalogProps) {
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

  // 요청에 쓸 검색어 — 입력창(query)은 바로 바뀌고, 요청은 입력이 멈춘 뒤에 (Step 7-2)
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

  // 상품 목록 (Step 7-2) — 예전의 useMemo(걸러내기·정렬)는 서버(API)가 한다
  // - isPlaceholderData: 지금 보이는 것이 '이전 조건의 결과'인지 (새 결과를 받는 중)
  // - isFetching: 요청이 진행 중인지 (처음이든 다시 받기든)
  // (7-3) useInfiniteQuery — data.pages에 받은 페이지들이 차례로 쌓인다
  // - hasNextPage: 다음 페이지가 있는지 (getNextPageParam이 undefined가 아니면)
  // - fetchNextPage(): 다음 페이지 받기 / isFetchingNextPage: 받는 중
  // - isFetchNextPageError: '더 보기'만 실패 (이미 받은 페이지는 그대로 보여 준다)
  const {
    data,
    error,
    isError,
    isFetching,
    isPlaceholderData,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    ...productQueries.list({ query: debouncedQuery, category, sort, hideSoldOut }),
    placeholderData: keepPreviousData,
  })

  // 받은 페이지들을 한 줄로 이어 붙인다. 전체 개수는 서버가 알려 준 total
  const items = data?.pages.flatMap((page) => page.items) ?? []
  const total = data?.pages[0]?.total ?? 0

  // 결과가 바뀌는 중 — 아직 입력 중(요청 전)이거나 새 조건의 결과를 받는 중
  // → 목록을 흐리게 + aria-busy. 이전 결과를 지우지 않아 화면이 덜컹거리지 않는다
  const updating = query.trim() !== debouncedQuery.trim() || (isFetching && isPlaceholderData)

  // 다시 시도 후 포커스 (Step 5-2 원칙) — 성공하면 '다시 시도' 버튼이 사라지므로 결과 영역으로 옮긴다
  const resultsRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useRef(false)
  useEffect(() => {
    if (pendingFocusRef.current && !isError && data) {
      pendingFocusRef.current = false
      resultsRef.current?.focus()
    }
  }, [isError, data])

  function retry() {
    pendingFocusRef.current = true
    void refetch()
  }

  // 더 보기 (Step 7-3)
  // focusIndexRef: 더 불러온 뒤 포커스를 줄 카드 번호(= 지금까지 받은 개수 = 새로 온 첫 카드). 화면에 안 보이는 값이라 ref
  const focusIndexRef = useRef<number | null>(null)
  function loadMore() {
    if (isFetchingNextPage) return // aria-disabled라 클릭이 막히지 않으므로 직접 거른다
    focusIndexRef.current = items.length
    void fetchNextPage()
  }
  useEffect(() => {
    const index = focusIndexRef.current
    if (index === null || items.length <= index) return
    focusIndexRef.current = null
    // 새로 나온 첫 카드의 상품명 링크
    resultsRef.current?.querySelectorAll<HTMLAnchorElement>('article h2 a')[index]?.focus()
  }, [items.length])

  // 결과 영역 — 상태별로 (Step 7-2)
  let results
  if (isError && !isFetchNextPageError) {
    results = (
      <InlineError
        title="상품 목록을 불러오지 못했습니다."
        description={error instanceof ApiError && error.status === 0 ? error.message : '잠시 후 다시 시도해 주세요.'}
        onRetry={retry}
        retrying={isFetching}
      />
    )
  } else if (!data) {
    // 미리 받은 데이터가 없는 첫 요청 (사이트에서는 서버가 미리 받아 두므로 거의 없다. /dev/skeleton 등)
    results = <CatalogSkeleton gridOnly />
  } else {
    // 빈 결과 문구는 '결과를 만든' 검색어로 (입력 중인 글자가 아니라)
    results = (
      <>
        <CardGrid products={items} query={debouncedQuery} total={total} />
        {/* 더 보기 영역 (Step 7-3) */}
        {isFetchNextPageError ? (
          <div className={styles.loadMore}>
            <InlineError
              title="상품을 더 불러오지 못했습니다."
              description={
                error instanceof ApiError && error.status === 0 ? error.message : '잠시 후 다시 시도해 주세요.'
              }
              onRetry={loadMore}
              retrying={isFetchingNextPage}
            />
          </div>
        ) : (
          hasNextPage && (
            <div className={styles.loadMore}>
              {/* 몇 개 중 몇 개를 봤는지 함께 보여 준다 — 얼마나 남았는지 알 수 있게 */}
              <Button variant="secondary" onClick={loadMore} aria-disabled={isFetchingNextPage}>
                {isFetchingNextPage ? '불러오는 중…' : `더 보기 (${items.length} / ${total})`}
              </Button>
            </div>
          )
        )}
      </>
    )
  }

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

      {/* 결과 영역. tabIndex={-1}: 다시 시도 후 코드로 포커스를 옮길 수 있게 (Tab 순서에는 안 들어감)
          aria-busy: 바뀌는 중이라는 표시 — 스크린리더가 바뀌는 도중의 내용을 읽지 않고 기다린다 */}
      <div
        ref={resultsRef}
        tabIndex={-1}
        aria-busy={updating}
        className={clsx(styles.results, updating && styles.updating)}
      >
        {results}
      </div>
    </>
  )
}

export default ProductCatalog
