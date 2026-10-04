import { Skeleton } from './ui/Skeleton'
import CardSkeleton from './CardSkeleton'
import { toRem } from '@/lib/units'
import searchStyles from './SearchBar.module.scss'
import filterStyles from './CategoryFilter.module.scss'
import catalogStyles from './ProductCatalog.module.scss'
import gridStyles from './CardGrid.module.scss'

// 상품 목록 화면 전체의 스켈레톤 (Step 3-2 보강)
//
// 어디에 쓰나?
// - app/(catalog)/page.tsx의 <Suspense fallback={<CatalogSkeleton />}>
// - app/(catalog)/loading.tsx (Step 4-3): 다른 페이지에서 홈으로 이동할 때
// - Step 4: 검색·필터를 URL(useSearchParams)로 옮기면 Next.js가 ProductCatalog를 Suspense로 감싸라고 요구한다.
//   (정적 페이지에서 useSearchParams를 Suspense 없이 쓰면 빌드가 실패한다)
//   그때 URL을 읽기 전까지 이 스켈레톤이 보인다.
// - Step 6: 상품 데이터를 API로 받아오면 응답을 기다리는 동안 이 스켈레톤이 보인다.
// ※ 지금(Step 3)은 데이터가 파일에 있어서 기다릴 일이 없으므로 실제로는 거의 보이지 않는다.
//
// 크기 맞추기: 각 영역의 실제 SCSS 클래스(.wrap, .toolbar, .grid ...)를 그대로 가져와서
// 여백·배치·반응형 열 개수가 진짜 화면과 똑같이 나오게 했다.
// 다른 컴포넌트의 .module.scss도 import해서 쓸 수 있다. (이름이 겹치지 않도록 xxxStyles로 받는다)
//
// 접근성
// - role="status": 스크린리더가 이 안의 글자를 '상태 알림'으로 읽어 준다. (aria-live="polite"와 같은 효과)
// - 회색 조각들은 읽을 내용이 없으니 aria-hidden, 대신 sr-only 문장 하나로 "불러오는 중"을 알린다.

// 보여 줄 카드 개수: 넓은 화면(4열)에서 두 줄을 채우는 정도
const CARD_COUNT = 8
// 카테고리 칩 개수와 폭(px) (실제 칩처럼 폭을 조금씩 다르게 해서 자연스럽게)
const CHIP_WIDTHS = [56, 64, 72, 72, 80, 72, 72]

// 칩·선택 상자 높이 = 위아래 여백(6px × 2) + 줄 높이(20px) + 테두리(1px × 2)
// 테두리는 글자 크기와 상관없이 1px이어야 하므로 rem으로 바꾸지 않고 calc로 더한다
// (선택 상자는 브라우저가 line-height를 무시하므로 SortSelect.module.scss에서 같은 높이를 직접 지정해 두었다)
const CONTROL_HEIGHT = `calc(${toRem(32)} + 2px)`
// 검색창 높이 = 위아래 여백(12px × 2) + 줄 높이(24px) + 테두리(1px × 2)
const SEARCH_HEIGHT = `calc(${toRem(48)} + 2px)`

// props
// - gridOnly: true면 검색창·툴바 없이 개수 + 카드 자리만 (Step 7-2)
//   ProductCatalog가 검색창·툴바는 이미 그렸고 '목록 데이터만' 기다릴 때 쓴다
interface CatalogSkeletonProps {
  gridOnly?: boolean
}

function CatalogSkeleton({ gridOnly = false }: CatalogSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">상품 목록을 불러오는 중입니다.</span>

      <div aria-hidden="true">
        {!gridOnly && (
          <>
            <div className={searchStyles.wrap}>
              <Skeleton block height={SEARCH_HEIGHT} radius="lg" />
            </div>

            <div className={catalogStyles.toolbar}>
              <div className={filterStyles.group}>
                {CHIP_WIDTHS.map((px, index) => (
                  // 순서가 절대 바뀌지 않는 고정 목록이라 index를 key로 써도 안전하다
                  <Skeleton key={index} width={toRem(px)} height={CONTROL_HEIGHT} radius="full" />
                ))}
              </div>
              <div className={catalogStyles.options}>
                <Skeleton width={toRem(120)} height={toRem(20)} />
                <Skeleton width={toRem(112)} height={CONTROL_HEIGHT} />
              </div>
            </div>
          </>
        )}

        <p className={gridStyles.count}>
          <Skeleton width={toRem(96)} />
        </p>

        <div className={gridStyles.grid}>
          {/* Array.from({ length: 8 }): 길이 8짜리 빈 배열을 만들어 map으로 카드 8개를 그린다 */}
          {Array.from({ length: CARD_COUNT }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CatalogSkeleton
