'use client'

import { useEffect, useState } from 'react'
import CatalogSkeleton from '@/components/CatalogSkeleton'
import ProductCatalog from '@/components/ProductCatalog'
import { Button } from '@/components/ui/Button'
import styles from './SkeletonPreview.module.scss'

// 스켈레톤 ↔ 실제 화면 전환 미리보기 (Step 3-2 보강, /dev/skeleton 전용)
//
// page.tsx 옆에 둔 이유: 이 페이지에서만 쓰는 컴포넌트라서 components/에 두지 않고 같은 폴더에 둔다. (코로케이션)
// app/ 폴더 안이라도 page.tsx가 아닌 파일은 주소가 되지 않는다.
//
// 모드
// - skeleton: 스켈레톤만
// - real:     실제 목록 화면
// - loading:  스켈레톤을 LOADING_MS 동안 보여 준 뒤 실제 화면으로 바꾼다 (실제 로딩 재현)

type Mode = 'skeleton' | 'real' | 'loading'

const LOADING_MS = 2000

function SkeletonPreview() {
  const [mode, setMode] = useState<Mode>('skeleton')

  // 'loading' 모드가 되면 타이머를 걸고, 시간이 지나면 'real'로 바꾼다.
  // return의 함수(정리 함수): 타이머가 끝나기 전에 다른 버튼을 누르거나 페이지를 떠나면 타이머를 취소한다.
  // (취소하지 않으면 이미 다른 모드로 바꿨는데 2초 뒤에 멋대로 'real'로 바뀌는 버그가 생긴다)
  useEffect(() => {
    if (mode !== 'loading') return
    const timer = setTimeout(() => setMode('real'), LOADING_MS)
    return () => clearTimeout(timer)
  }, [mode])

  const showSkeleton = mode !== 'real'

  return (
    <>
      <div className={styles.panel}>
        <h1 className={styles.title}>스켈레톤 미리보기 (개발용)</h1>
        {/* 토글 버튼: 지금 선택된 모드를 aria-pressed로 알린다 */}
        <div role="group" aria-label="보기 모드" className={styles.actions}>
          <Button
            variant={mode === 'skeleton' ? 'primary' : 'secondary'}
            aria-pressed={mode === 'skeleton'}
            onClick={() => setMode('skeleton')}
          >
            스켈레톤
          </Button>
          <Button variant={mode === 'real' ? 'primary' : 'secondary'} aria-pressed={mode === 'real'} onClick={() => setMode('real')}>
            실제 화면
          </Button>
          <Button
            variant={mode === 'loading' ? 'primary' : 'secondary'}
            aria-pressed={mode === 'loading'}
            onClick={() => setMode('loading')}
          >
            로딩 재현 ({LOADING_MS / 1000}초)
          </Button>
        </div>
        <p className={styles.hint}>
          로딩 재현을 누르고 스켈레톤이 실제 화면으로 바뀌는 순간 검색창·칩·카드가 움직이지 않는지 확인하세요. 개발 서버에서만 열리는
          페이지입니다.
        </p>
      </div>

      {showSkeleton ? <CatalogSkeleton /> : <ProductCatalog />}
    </>
  )
}

export default SkeletonPreview
