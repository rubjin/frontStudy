// AI 연결 확인 스크립트 (cloude 브랜치 · AI 연동)
// 실행: npm run check:ai
//
// .env.local의 OPENROUTER_API_KEY로 Jev(typesafe/jev-1.13)에 질문 하나를 보내 보고,
// 실패하면 원인을 사람이 이해할 수 있는 말로 알려 준다.
// 키 값 자체는 절대 출력하지 않는다.

import { existsSync } from 'node:fs'
import { TypeSafeClient, noul } from '@typesafe-ai/sdk'

// .env.local 읽기 (Node 20.12+ 내장 기능. 별도 패키지 불필요)
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const key = process.env.OPENROUTER_API_KEY
if (!key) {
  console.log('✗ OPENROUTER_API_KEY가 없습니다.')
  console.log('  1) cp .env.example .env.local')
  console.log('  2) .env.local의 OPENROUTER_API_KEY= 뒤에 키를 붙여 넣기')
  process.exit(1)
}
console.log(`• 키 확인: ${key.slice(0, 6)}… (${key.length}자)`)

const client = new TypeSafeClient({
  apiKey: key,
  baseURL: 'https://openrouter.ai/api',
  defaultModel: 'typesafe/jev-1.13',
  timeout: 15000,
  retry: { maxRetries: 0 },
})

try {
  const started = Date.now()
  const result = await client.systemOne({
    state: '결제가 두 번 됐어요. 오늘 안에 꼭 환불해 주세요.',
    questions: { urgent: noul('이 메시지는 급한 요청인가?') },
  })
  console.log(`✓ Jev 연결 성공 (${Date.now() - started}ms, 모델 ${result.model})`)
  console.log(`  질문: 이 메시지는 급한 요청인가? → 예일 확률 ${result.answers.urgent.noul}`)
  console.log(`  토큰: 입력 ${result.usage.input_tokens} / 출력 ${result.usage.output_tokens}`)
} catch (error) {
  const cause = error?.cause?.code ?? error?.cause?.cause?.code ?? ''
  const status = error?.status
  console.log('✗ Jev 연결 실패')
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY/.test(String(cause) + String(error?.message))) {
    console.log('  원인: 네트워크가 HTTPS 인증서를 바꿔치기하고 있습니다. (회사 보안 장비 등)')
    console.log('  해결: GitHub Codespaces처럼 외부 네트워크에서 실행하세요. 이 PC에서는 가짜 응답으로 개발할 수 있습니다.')
  } else if (status === 401 || status === 403) {
    console.log('  원인: API 키가 틀렸거나 권한이 없습니다. OpenRouter에서 키를 다시 확인하세요.')
  } else if (status === 402) {
    console.log('  원인: OpenRouter 잔액(크레딧)이 부족합니다.')
  } else if (status === 404) {
    console.log('  원인: 모델 ID(typesafe/jev-1.13) 또는 주소를 찾지 못했습니다.')
  } else if (status === 429) {
    console.log('  원인: 요청이 너무 많습니다. 잠시 후 다시 시도하세요.')
  } else {
    console.log(`  원인: ${error?.name ?? 'Error'} ${status ?? ''} ${cause} ${error?.message ?? ''}`.trim())
  }
  process.exit(1)
}
