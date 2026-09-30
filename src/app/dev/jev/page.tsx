import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import clsx from 'clsx'
import { getJevMode, JEV_MODEL } from '@/lib/ai/jev'
import { FALLBACK_MODELS } from '@/lib/ai/models'
import { classifySearchIntent, type DecidedBy, type SearchAction } from '@/lib/ai/searchIntent'
import styles from './page.module.scss'

// 개발용 Jev 확인 페이지 — 주소 "/dev/jev" (cloude 브랜치 · AI 연동)
//
// 검색 문장 예시들을 Jev로 분류해서 표로 보여 준다.
// - 서버 컴포넌트에서 askJev(서버 전용)를 부르는 '실제 사용 예시'이기도 하다. 브라우저로는 키가 나가지 않는다.
// - 키가 없거나 네트워크가 막히면 '가짜 응답'으로 표시된다. (출처 칸에서 확인)
// - 배포 환경에서는 404 (dev/skeleton과 같은 규칙)

export const metadata: Metadata = {
  title: 'Jev 확인 (개발용)',
  robots: { index: false, follow: false },
}

// 요청마다 새로 분류한다. (빌드할 때 한 번 분류해서 굳혀 두지 않도록)
export const dynamic = 'force-dynamic'

const SAMPLE_QUERIES = [
  '5만원 이하 선물용 이어폰',
  '사무실에서 쓸 조용한 키보드',
  '영상 편집용 큰 모니터 50만원까지',
  '노트북 받침대',
  '여자친구 생일 선물',
  '오늘 날씨 어때',
]

const ACTION_LABEL: Record<SearchAction, string> = {
  apply: '바로 적용',
  confirm: '사용자 확인',
  fallback: '대체 처리',
}

const DECIDED_LABEL: Record<DecidedBy, string> = {
  jev: 'Jev',
  llm: 'LLM 대체',
  none: '판단 못 함',
}

const REASON_LABEL = {
  'no-key': '키 없음 (.env.local)',
  paid: 'Jev는 유료라 꺼 둠',
  forced: 'AI_MOCK=1',
  network: '연결 실패 (네트워크)',
  error: '요청 실패 (서버 로그 확인)',
} as const

// 0.853 → '85%'
const percent = (value: number) => `${Math.round(value * 100)}%`

export default async function JevDevPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const mode = getJevMode()
  // Promise.all: 여러 요청을 동시에 보내고 모두 끝날 때까지 기다린다 (하나씩 기다리는 것보다 빠르다)
  const results = await Promise.all(SAMPLE_QUERIES.map((query) => classifySearchIntent(query)))

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Jev 확인 (개발용)</h1>
        <p className={styles.meta}>
          모델 <code>{JEV_MODEL}</code> · 설정{' '}
          <span className={clsx(styles.badge, mode.source === 'jev' ? styles.live : styles.mock)}>
            {mode.source === 'jev' ? '실제 API' : `가짜 응답 · ${REASON_LABEL[mode.reason!]}`}
          </span>
        </p>
        <p className={styles.hint}>
          확신도 85% 이상은 바로 적용, 60~85%는 사용자 확인, 60% 미만은 대체 처리합니다. 가짜 응답은 확신도가 0%라서 항상 대체 처리로
          나옵니다. 연결 상태는 터미널에서 <code>npm run check:ai</code>로 확인합니다.
        </p>
        <p className={styles.hint}>
          Jev가 확신하지 못하면 LLM이 다시 해석합니다: {FALLBACK_MODELS.map((model) => model.label).join(' → ')}. LLM 해석은 자동 적용하지
          않고 항상 사용자 확인으로 보냅니다.
        </p>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">검색 문장</th>
              <th scope="col">카테고리</th>
              <th scope="col">확신도</th>
              <th scope="col">가격대</th>
              <th scope="col">선물용</th>
              <th scope="col">행동</th>
              <th scope="col">결정</th>
              <th scope="col">출처</th>
            </tr>
          </thead>
          <tbody>
            {results.map((intent) => (
              <tr key={intent.query}>
                <td>{intent.query}</td>
                <td>{intent.category}</td>
                {/* LLM이 정한 카테고리 옆에 Jev의 낮은 확신도를 붙이면 모순이라 보여 주지 않는다 */}
                <td className={styles.num}>{intent.decidedBy === 'llm' ? '— (LLM)' : percent(intent.categoryConfidence)}</td>
                <td>{intent.priceLabel}</td>
                <td className={styles.num}>{percent(intent.giftProbability)}</td>
                <td>
                  {/* data-action: 행동 종류에 따라 색을 바꾼다 (SCSS에서 속성 선택자로) */}
                  <span className={styles.action} data-action={intent.action}>
                    {ACTION_LABEL[intent.action]}
                  </span>
                </td>
                <td>
                  {DECIDED_LABEL[intent.decidedBy]}
                  {/* LLM이 답했으면 실제 모델, 실패했으면 이유 */}
                  {intent.llm && <span className={styles.sub}> · {intent.llm.model ?? intent.llm.reason}</span>}
                </td>
                <td>{intent.source === 'jev' ? 'Jev' : `가짜 (${intent.reason})`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
