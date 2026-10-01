import Image from 'next/image'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types/product'
import styles from './ProductDetail.module.scss'

// 상품 상세 화면 (Step 4-1)
//
// 페이지(app/products/[id]/page.tsx)는 "주소로 상품을 찾고, 없으면 404"까지만 맡고,
// 화면 그리기는 이 컴포넌트가 맡는다.
// → 페이지와 분리해 두면 Storybook에서 품절·이미지 없음·세로 사진 같은 상태를 데이터만 바꿔 확인할 수 있다.
//
// 서버 컴포넌트다 ('use client' 없음). 상태·이벤트가 없어서 브라우저로 보낼 JS가 필요 없다.
// (Step 5에서 '장바구니 담기' 버튼이 생기면 그 버튼만 작은 클라이언트 컴포넌트로 뺀다)
//
// props
// - product: 보여 줄 상품

interface ProductDetailProps {
  product: Product
}

// 재고가 이 수 이하이면 '품절 임박'으로 강조한다
const LOW_STOCK = 5

// 상세 사진이 화면에서 차지하는 실제 너비 (ProductDetail.module.scss의 .layout과 맞춘다)
// - 768px 이상: 두 칸 배치에서 왼쪽 칸 ≈ 콘텐츠 최대 1280px의 절반 → 최대 약 600px
// - 그 아래: 한 칸이라 화면 너비 거의 전부
const IMAGE_SIZES = '(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw'

// 재고 수에 따라 보여 줄 문구 (품절 / 품절 임박 / 구매 가능)
function getStockLabel(stock: number): { status: 'soldOut' | 'low' | 'inStock'; label: string } {
  if (stock === 0) return { status: 'soldOut', label: '품절' }
  if (stock <= LOW_STOCK) return { status: 'low', label: `품절 임박 · ${stock}개 남음` }
  return { status: 'inStock', label: '구매 가능' }
}

function ProductDetail({ product }: ProductDetailProps) {
  const { name, price, category, rating, stock, image } = product
  const stockInfo = getStockLabel(stock)

  return (
    <article className={styles.root}>
      {/* 이동 경로(breadcrumb): 지금 위치를 보여 주고 상위 단계로 돌아가게 한다
          - <nav aria-label>: 스크린리더가 '이동 경로 탐색 영역'으로 알려 준다 (헤더 메뉴와 구분)
          - <ol>: 순서가 있는 단계라 ol. 구분 기호(/)는 CSS ::before로 그려서 스크린리더가 읽지 않게 한다
          - aria-current="page": 마지막 항목이 '지금 페이지'임을 알린다 */}
      <nav aria-label="이동 경로" className={styles.breadcrumb}>
        <ol>
          <li>
            <Link href="/">전체 상품</Link>
          </li>
          {/* 카테고리 링크(/?category=오디오)는 4-2에서 필터를 주소로 옮긴 뒤 연결한다 */}
          <li>{category}</li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <div className={styles.layout}>
        <div className={styles.media}>
          {image ? (
            // 목록 카드와 달리 fill + 잘라 내기(cover)가 아니라, 원본 width·height를 넘겨 '원본 비율 그대로' 보여 준다.
            // width·height를 알려 주면 이미지가 오기 전에도 브라우저가 자리 크기를 계산해서 레이아웃이 밀리지 않는다.
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              // 상세 페이지에서는 사진이 주인공이라 상품명을 alt로 준다 (목록 카드는 옆에 상품명 링크가 있어 alt="")
              alt={name}
              sizes={IMAGE_SIZES}
              className={styles.image}
              // 이 사진이 화면에서 가장 큰 요소(LCP)라서 지연 로딩하지 않고, 다른 리소스보다 먼저 받게 한다.
              // (Next.js 16: priority는 폐지 예정. 문서도 대부분 loading·fetchPriority를 권한다)
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            // 이미지가 없는 상품: 목록 카드처럼 상품명 첫 글자
            <span aria-hidden="true" className={styles.initial}>
              {name.charAt(0)}
            </span>
          )}
        </div>

        <div className={styles.info}>
          <p className={styles.category}>{category}</p>
          {/* 상세 페이지의 주제 = 상품명 → 이 페이지의 h1 */}
          <h1 className={styles.name}>{name}</h1>

          <p className={styles.rating}>
            <span aria-hidden="true">★</span> {rating.toFixed(1)}
            <span className="sr-only">5점 만점에 {rating.toFixed(1)}점</span>
          </p>

          <p className={styles.price}>{formatPrice(price)}</p>

          {/* data-status: 상태별 색은 SCSS의 [data-status='low'] 선택자로 (클래스를 조합하지 않아도 됨) */}
          <p className={styles.stock} data-status={stockInfo.status}>
            {stockInfo.label}
          </p>

          <div className={styles.actions}>
            {/* 장바구니 담기 버튼은 Step 5에서 추가한다 */}
            <ButtonLink href="/" variant="secondary">
              목록으로
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductDetail
