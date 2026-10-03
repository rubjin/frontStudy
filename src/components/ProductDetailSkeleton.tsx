import { Skeleton } from './ui/Skeleton'
import { toRem } from '@/lib/units'
import styles from './ProductDetail.module.scss'

// 상품 상세 화면의 스켈레톤 (Step 4-3)
//
// 어디에 쓰나? → app/products/[id]/loading.tsx
// - 목록에서 상품을 눌러 상세로 갈 때, 상세 페이지가 준비되기 전까지 이 화면이 보인다.
// - 지금 상세 페이지는 빌드할 때 미리 만들어 두어서(●) 거의 바로 뜬다.
//   Step 6~8에서 상품을 API·DB로 받아오면 기다리는 시간이 생기고, 그때 이 화면이 제 역할을 한다.
//
// 크기 맞추기 (CardSkeleton과 같은 원칙)
// - 치수를 따로 적지 않고 ProductDetail.module.scss의 클래스(.layout, .media, .name ...)를 그대로 쓴다.
// - 글자 자리는 원래 글자 태그와 같은 클래스의 <p> 안에 Skeleton 조각을 넣어서 줄 높이를 똑같이 유지한다.
// - 예외: 사진. 실제 사진은 상품마다 비율이 달라서(가로·세로·정사각형) 미리 알 수 없다.
//   그래서 '이미지 없는 상품'과 같은 정사각형 자리(.mediaSkeleton)를 보여 준다.
//   사진이 들어오면 높이가 바뀔 수 있지만, 화면 전체가 한 번에 바뀌는 순간이라 사용자가 보던 내용이 밀리지는 않는다.
//
// 실제 화면과 다른 점
// - <article>, <nav>, <h1>, <a> 대신 <div>, <p>를 쓴다. 아직 내용이 없는데 제목·링크·이동 경로로 읽히면 안 된다.
//
// 접근성: CatalogSkeleton과 같다. role="status" + sr-only 문장 하나로 "불러오는 중"을 알리고, 조각은 숨긴다.

// '목록으로' 버튼 자리 (ui/Button의 secondary md 크기)
// 높이 = 위아래 여백(8px × 2) + 줄 높이(20px) + 테두리(1px × 2). 테두리는 rem으로 바꾸지 않고 calc로 더한다
const BUTTON_HEIGHT = `calc(${toRem(36)} + 2px)`

function ProductDetailSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">상품 정보를 불러오는 중입니다.</span>

      <div aria-hidden="true">
        {/* 이동 경로: 전체 상품 / 카테고리 / 상품명 */}
        <div className={styles.breadcrumb}>
          <Skeleton width={toRem(200)} />
        </div>

        <div className={styles.layout}>
          <div className={styles.media}>
            {/* height="auto": Skeleton의 기본 높이 대신 .mediaSkeleton의 aspect-ratio(정사각형)로 높이를 정한다 */}
            <Skeleton block height="auto" className={styles.mediaSkeleton} />
          </div>

          <div className={styles.info}>
            <p className={styles.category}>
              <Skeleton width={toRem(56)} />
            </p>
            <p className={styles.name}>
              <Skeleton width="80%" />
            </p>
            <p className={styles.rating}>
              <Skeleton width={toRem(40)} />
            </p>
            <p className={styles.price}>
              <Skeleton width={toRem(140)} />
            </p>
            <p className={styles.stock}>
              <Skeleton width={toRem(64)} />
            </p>
            <div className={styles.actions}>
              <Skeleton width={toRem(90)} height={BUTTON_HEIGHT} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailSkeleton
