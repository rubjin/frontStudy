// AI 연결 확인 스크립트 (cloude 브랜치 · AI 연동)
// 실행: npm run check:ai
//
// .env.local(또는 Codespaces Secret)의 OPENROUTER_API_KEY로
// ① Jev에 질문 하나, ② models.ts에 등록한 LLM들에 짧은 요청 하나씩을 보내 보고,
// 실패하면 원인을 사람이 이해할 수 있는 말로 알려 준다.
//
// 모델 목록은 src/lib/ai/models.ts 하나에서 가져온다. (Node 22.18+/24는 .ts 파일을 바로 import 할 수 있다)
// 옵션: --jev-only  LLM 확인은 건너뛴다
// 무료 모델만 호출한다. 유료 모델(Jev 등)은 '건너뜀'으로만 표시한다. (models.ts의 isFreeModel)
// 키 값 자체는 절대 출력하지 않는다.

import { existsSync } from 'node:fs'
import { TypeSafeClient, noul } from '@typesafe-ai/sdk'
import { FALLBACK_MODELS, isFreeModel, JUDGE_MODEL, REVIEW_MODELS } from '../src/lib/ai/models.ts'

// .env.local 읽기 (Node 20.12+ 내장 기능. 별도 패키지 불필요)
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const key = process.env.OPENROUTER_API_KEY
if (!key) {
  // CODESPACES: GitHub Codespaces 안에서는 'true'로 자동 설정되는 환경 변수
  const inCodespaces = process.env.CODESPACES === 'true'
  // 이름이 비슷한 변수가 있으면 오타일 수 있으니 이름만 보여 준다 (값은 출력하지 않음)
  const similar = Object.keys(process.env).filter((name) => name !== 'OPENROUTER_API_KEY' && /OPENROUTER|OPEN_ROUTER/i.test(name))

  console.log('✗ OPENROUTER_API_KEY가 없습니다.')
  console.log(`  실행 위치: ${inCodespaces ? 'GitHub Codespaces' : '이 컴퓨터(로컬)'} · .env.local ${existsSync('.env.local') ? '있음(키 줄이 비어 있음)' : '없음'}`)
  if (similar.length) console.log(`  비슷한 이름의 변수가 있습니다: ${similar.join(', ')} → 이름을 OPENROUTER_API_KEY로 맞추세요.`)

  if (inCodespaces) {
    console.log('  Codespaces Secret을 확인하세요.')
    console.log('  1) GitHub → Settings → Codespaces → Secrets 에 이름이 정확히 OPENROUTER_API_KEY 인지')
    console.log('     (저장소 Settings의 Actions secrets에 넣으면 Codespaces에는 들어오지 않습니다)')
    console.log('  2) 그 Secret의 Repository access에 이 저장소가 포함돼 있는지')
    console.log('  3) Codespace를 만든 뒤에 등록했다면 다시 시작: F1 → "Codespaces: Rebuild Container"')
    console.log('  확인 명령: echo ${OPENROUTER_API_KEY:+키 있음}')
  } else {
    console.log('  1) cp .env.example .env.local')
    console.log('  2) .env.local의 OPENROUTER_API_KEY= 뒤에 키를 붙여 넣기 (프로젝트 맨 위 폴더)')
    console.log('  ※ 회사 네트워크에서는 키를 넣어도 연결이 막힐 수 있습니다. 그때는 Codespaces에서 확인하세요.')
  }
  process.exit(1)
}
console.log(`• 키 확인: ${key.slice(0, 6)}… (${key.length}자)`)

// 실패 원인을 사람이 읽을 수 있는 문장으로 (status: HTTP 상태 코드, detail: 에러 메시지·코드)
function explain(status, detail = '') {
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY/.test(detail)) {
    return '네트워크가 HTTPS 인증서를 바꿔치기하고 있습니다(회사 보안 장비 등). GitHub Codespaces에서 실행하세요. 이 PC에서는 가짜 응답으로 개발할 수 있습니다.'
  }
  if (status === 400) return `요청 형식 오류: ${detail.slice(0, 160)}`
  if (status === 401 || status === 403) return 'API 키가 틀렸거나 권한이 없습니다. OpenRouter에서 키를 확인하세요.'
  if (status === 402) return 'OpenRouter 잔액(크레딧)이 부족합니다.'
  if (status === 404) return '모델 ID를 찾지 못했습니다. src/lib/ai/models.ts의 ID를 OpenRouter 모델 페이지와 비교하세요.'
  if (status === 429) return '요청 한도 초과. 무료 모델은 분당 약 20회·하루 약 50회 제한이 있습니다. 잠시 후 다시 시도하세요.'
  return `${status ?? ''} ${detail}`.trim()
}

// ─── ① Jev ───────────────────────────────────────────────
// 무료 모델만 쓰기로 해서(models.ts) Jev가 유료면 호출하지 않고 건너뛴다
let networkBlocked = false
// Jev가 실패하면 LLM이 모두 성공해도 전체 결과는 실패(종료 코드 1)여야 한다 (AI 교차 리뷰 GLM 지적)
let jevFailed = false
if (!isFreeModel(JUDGE_MODEL.id)) {
  console.log(`• ${JUDGE_MODEL.label}: 유료 모델이라 호출하지 않습니다`)
} else try {
  const client = new TypeSafeClient({
    apiKey: key,
    baseURL: 'https://openrouter.ai/api',
    defaultModel: JUDGE_MODEL.id,
    timeout: 15000,
    retry: { maxRetries: 0 },
  })
  const started = Date.now()
  const result = await client.systemOne({
    state: '결제가 두 번 됐어요. 오늘 안에 꼭 환불해 주세요.',
    questions: { urgent: noul('이 메시지는 급한 요청인가?') },
  })
  console.log(`✓ ${JUDGE_MODEL.label} 연결 성공 (${Date.now() - started}ms, 모델 ${result.model})`)
  console.log(`  질문: 이 메시지는 급한 요청인가? → 예일 확률 ${result.answers.urgent.noul}`)
  console.log(`  토큰: 입력 ${result.usage.input_tokens} / 출력 ${result.usage.output_tokens}`)
} catch (error) {
  const detail = `${error?.cause?.code ?? ''} ${error?.cause?.cause?.code ?? ''} ${error?.message ?? ''}`
  jevFailed = true
  networkBlocked = /CERT|SELF_SIGNED|UNABLE_TO_VERIFY/.test(detail)
  console.log(`✗ ${JUDGE_MODEL.label} 연결 실패`)
  console.log(`  원인: ${explain(error?.status, detail)}`)
}

// ─── ② LLM들 ─────────────────────────────────────────────
// 대체 호출(models 배열) 대신 모델마다 따로 부른다 → 틀린 ID가 다음 모델에 가려지지 않는다
//
// 종료 코드: process.exit()로 강제 종료하지 않고 process.exitCode만 정한다.
// Windows에서 네트워크 연결을 정리하는 도중 process.exit()를 부르면 Node가 충돌해 종료 코드 127이 나왔다. (실측)
// exitCode만 정해 두면 남은 정리 작업이 끝난 뒤 자연스럽게 그 코드로 끝난다.
process.exitCode = jevFailed ? 1 : 0

if (networkBlocked) {
  console.log('• LLM 확인은 건너뜁니다 (같은 네트워크 문제로 모두 실패합니다)')
} else if (!process.argv.includes('--jev-only')) {
  // 같은 모델이 두 역할에 있으면 한 번만 확인하고, 유료 모델은 호출하지 않는다
  const byId = new Map()
  for (const [list, role] of [[FALLBACK_MODELS, '대체 해석'], [REVIEW_MODELS, '코드 리뷰']]) {
    for (const model of list) {
      const found = byId.get(model.id)
      if (found) found.role += '·' + role
      else byId.set(model.id, { ...model, role })
    }
  }
  const all = [...byId.values()]
  for (const model of all.filter((m) => !isFreeModel(m.id))) {
    console.log(`• ${model.label}: 유료 모델이라 호출하지 않습니다 (models.ts에서 :free 모델로 바꾸세요)`)
  }
  const targets = all.filter((m) => isFreeModel(m.id))

  console.log('\n• LLM 모델 확인 (모델당 짧은 요청 1회)')
  for (const model of targets) {
    const started = Date.now()
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Shoppr check:ai' },
        // 무료 모델은 모두 추론 모델이라 생각할 토큰을 조금 준다 (무료라 비용 없음)
        body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: 'OK라고만 답해' }], max_tokens: 200, reasoning: { effort: 'low' } }),
        signal: AbortSignal.timeout(60000), // 추론 모델(GLM 등)은 느릴 수 있다
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        process.exitCode = 1
        console.log(`  ✗ ${model.label.padEnd(18)} ${model.role.padEnd(8)} ${explain(response.status, body?.error?.message ?? '')}`)
        continue
      }
      console.log(`  ✓ ${model.label.padEnd(18)} ${model.role.padEnd(8)} ${Date.now() - started}ms · 실제 모델 ${body.model}`)
    } catch (error) {
      process.exitCode = 1
      console.log(`  ✗ ${model.label.padEnd(18)} ${model.role.padEnd(8)} ${explain(undefined, `${error?.cause?.code ?? ''} ${error?.message ?? ''}`)}`)
    }
  }
}
