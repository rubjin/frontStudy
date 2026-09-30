// AI 교차 리뷰 스크립트 (cloude 브랜치 · AI 연동 5단계)
// 실행: npm run review:ai            → 커밋 전 변경 사항(staged, 없으면 작업 중 변경) 리뷰
//       npm run review:ai -- --last  → 마지막 커밋 리뷰
//       npm run review:ai -- --with-qwen  → Qwen3.8 Max를 세 번째 리뷰어로 추가 (비쌈)
//
// 하는 일
// ① Jev(판단): 변경의 위험도(0~3)와 "테스트가 필요한가"를 확신도와 함께 채점
// ② GLM 5.3 · Kimi K3(LLM): 서로 다른 회사 모델이 동시에 코드 리뷰 → 한 모델이 놓친 것을 다른 모델이 잡는다
//    (이 코드는 Claude가 썼으므로, 다른 회사 모델이 검토하는 '교차 리뷰'가 된다)
//
// 비용 관리
// - 직접 실행할 때만 동작한다. (커밋할 때마다 자동으로 돌지 않는다)
// - diff가 너무 길면 잘라서 보낸다. 실행이 끝나면 OpenRouter가 알려 준 실제 비용을 출력한다.
// - 모델 목록은 src/lib/ai/models.ts 하나에서 가져온다.

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { TypeSafeClient, noul, score } from '@typesafe-ai/sdk'
import { JUDGE_MODEL, OPTIONAL_REVIEW_MODELS, REVIEW_MODELS } from '../src/lib/ai/models.ts'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')
const key = process.env.OPENROUTER_API_KEY
if (!key) {
  console.log('✗ OPENROUTER_API_KEY가 없습니다. 먼저 npm run check:ai 로 설정을 확인하세요.')
  process.exit(1)
}

// 답은 보통 문자열이지만 일부 모델은 [{ type: 'text', text }] 배열로 준다
const textOf = (content) =>
  typeof content === 'string' ? content : Array.isArray(content) ? content.map((part) => part?.text ?? '').join('') : ''

// ─── 리뷰할 변경 사항 고르기 ────────────────────────────────
// lock 파일·빌드 결과처럼 사람이 쓰지 않은 파일은 뺀다 (길기만 하고 리뷰할 내용이 없다)
const EXCLUDE = ":(exclude)package-lock.json :(exclude)*.png :(exclude)*.jpg"
const git = (args) => execSync(`git ${args} -- . ${EXCLUDE}`, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })

let target
let diff
if (process.argv.includes('--last')) {
  target = '마지막 커밋'
  diff = git('diff HEAD~1 HEAD')
} else {
  diff = git('diff --cached')
  target = 'staged(커밋 대기) 변경'
  if (!diff.trim()) {
    diff = git('diff HEAD')
    target = '작업 중 변경(아직 add 안 함)'
  }
}
if (!diff.trim()) {
  console.log('리뷰할 변경 사항이 없습니다. (마지막 커밋을 보려면: npm run review:ai -- --last)')
  process.exit(0)
}

// 길이 제한: Jev는 문맥이 3.2만 토큰이라 더 짧게, LLM은 비용 때문에 제한
const JEV_LIMIT = 24000
const LLM_LIMIT = 60000
const cut = (text, limit) => (text.length > limit ? `${text.slice(0, limit)}\n\n...(길어서 ${text.length - limit}자 생략)` : text)
const files = [...diff.matchAll(/^diff --git a\/(.+?) b\//gm)].map((match) => match[1])
console.log(`• 리뷰 대상: ${target} · 파일 ${files.length}개 · ${diff.length.toLocaleString()}자${diff.length > LLM_LIMIT ? ' (길어서 일부만 보냄)' : ''}`)

// ─── ① Jev: 위험도 채점 ────────────────────────────────────
const jev = new TypeSafeClient({ apiKey: key, baseURL: 'https://openrouter.ai/api', defaultModel: JUDGE_MODEL.id, timeout: 30000 })
const jevTask = jev
  .systemOne({
    state: cut(diff, JEV_LIMIT),
    questions: {
      risk: score('이 코드 변경이 기존 기능을 망가뜨릴 위험은?', [
        '문서·주석·스타일만 바뀜',
        '작은 동작 변경, 영향 범위 좁음',
        '여러 화면이나 공통 모듈에 영향',
        '데이터·보안·결제·API 키 등 핵심 동작에 영향',
      ]),
      needsTests: noul('이 변경은 자동 테스트를 추가하거나 고쳐야 하는가?'),
    },
  })
  .then((result) => ({ ok: true, result }))
  .catch((error) => ({ ok: false, error }))

// ─── ② LLM 리뷰어들 (동시에) ───────────────────────────────
const SYSTEM = `너는 시니어 프론트엔드 코드 리뷰어다. 한국어로 답한다.
프로젝트: Next.js 16(App Router) + React 19 + TypeScript + SCSS Module 쇼핑몰(Shoppr). 작성자는 웹 퍼블리셔 출신 학습자.
프로젝트 규칙: 서버/클라이언트 컴포넌트 분리('use client'는 최소), API 키는 서버 전용(server-only), 색은 CSS 변수, 크기는 to-rem(), 접근성(aria, 대비) 중시, 주석은 한국어로 자세히.
diff를 보고 실제 문제만 최대 5개 골라라: 버그, 보안(키 노출 등), 접근성, 규칙 위반, 성능 순서로 중요한 것부터.
각 항목: "[심각도: 높음/중간/낮음] 파일:줄 — 문제 — 고치는 방법" 한 줄씩. 문제가 없으면 "특별한 문제 없음" 한 줄.
칭찬·요약·서론은 쓰지 않는다.`

const reviewers = [...REVIEW_MODELS, ...(process.argv.includes('--with-qwen') ? OPTIONAL_REVIEW_MODELS : [])]
const reviewTasks = reviewers.map(async (model) => {
  const started = Date.now()
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Shoppr review:ai' },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `변경된 파일: ${files.join(', ')}\n\n${cut(diff, LLM_LIMIT)}` },
        ],
        max_tokens: 4000, // 추론 모델은 생각하는 데도 토큰을 쓰므로 여유 있게
        reasoning: { effort: 'low' }, // 리뷰는 빠르게 (지원하는 모델만 적용됨)
        usage: { include: true }, // 응답에 실제 비용(usage.cost)을 포함
      }),
      signal: AbortSignal.timeout(180000),
    })
    const body = await response.json()
    if (!response.ok) return { model, ok: false, message: `HTTP ${response.status} ${body?.error?.message ?? ''}` }
    return {
      model,
      ok: true,
      text: textOf(body.choices?.[0]?.message?.content).trim() || '(빈 답)',
      seconds: ((Date.now() - started) / 1000).toFixed(1),
      cost: body.usage?.cost ?? 0,
    }
  } catch (error) {
    return { model, ok: false, message: error?.name === 'TimeoutError' ? '시간 초과(3분)' : String(error?.message ?? error) }
  }
})

// ─── 결과 출력 ─────────────────────────────────────────────
const [jevOutcome, ...reviews] = await Promise.all([jevTask, ...reviewTasks])

console.log(`\n■ ${JUDGE_MODEL.label} 위험도 판단`)
if (jevOutcome.ok) {
  const { risk, needsTests } = jevOutcome.result.answers
  const level = Math.round(risk.score)
  console.log(`  위험도 ${risk.score.toFixed(2)} / 3 → "${risk.legend[level]}" (확신도 ${Math.round(risk.confidence * 100)}%)`)
  console.log(`  테스트 필요 확률 ${Math.round(needsTests.noul * 100)}%`)
  // 설계 문서의 규칙: 위험도 2 이상이거나 확신도 0.6 미만이면 사람이 꼼꼼히 본다
  if (risk.score >= 2 || risk.confidence < 0.6) console.log('  → 사람이 꼼꼼히 검토하세요. (위험도 2 이상 또는 확신도 60% 미만)')
} else {
  console.log(`  ✗ 실패: ${jevOutcome.error?.message ?? jevOutcome.error}`)
}

let totalCost = 0
for (const review of reviews) {
  console.log(`\n■ ${review.model.label} 리뷰${review.ok ? ` (${review.seconds}초, $${review.cost.toFixed(4)})` : ''}`)
  if (!review.ok) {
    console.log(`  ✗ 실패: ${review.message}`)
    continue
  }
  totalCost += review.cost
  console.log(review.text.split('\n').map((line) => `  ${line}`).join('\n'))
}
console.log(`\n• LLM 리뷰 비용 합계 약 $${totalCost.toFixed(4)} (Jev는 입력 토큰만 과금)`)
console.log('• AI 리뷰는 참고용입니다. 지적이 맞는지 직접 확인하고 판단하세요.')
