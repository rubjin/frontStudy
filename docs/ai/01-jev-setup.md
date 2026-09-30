# AI 연동 1. Jev 연결 준비 (cloude 브랜치)

> 상태: 완료 · 2026-09-30 같은 PC에서 네트워크가 열려 실제 Jev 응답 확인 (다음 문서: 02-multi-model.md)
> 아키텍처 그림: https://claude.ai/code/artifact/a726702d-e2f3-4c58-8dcc-a55ae3fafce3

## 목표
- Claude Code·Gemini·Qwen은 **코드를 쓰고**, TypeSafe의 **Jev는 판단한다**(작업 분배, 위험도, 검색 의도).
- 이 단계에서는 Jev를 서버에서 안전하게 부를 수 있는 기반을 만든다. 키가 없거나 네트워크가 막혀도 개발이 멈추지 않게 한다.

## Jev란?
- 글이나 코드를 만드는 LLM이 **아니다**. 미리 정한 답 중 하나와 **확신도(confidence)** 를 돌려주는 판단 전용 모델이다.
- 질문 형식 3가지

  | 형식 | 돌려주는 것 | 예 |
  | --- | --- | --- |
  | `choice` | 보기 중 하나 + 확신도 + 보기별 확률 | 검색어의 카테고리 |
  | `score` | 점수(0부터) + 확신도 | 가격대 0~4, 위험도 0~3 |
  | `noul` | 예일 확률 0~1 | 선물용인가? 테스트가 필요한가? |
- 답은 정해 둔 보기 밖으로 나오지 않는다. "JSON으로 답해 줘"라고 LLM에 부탁했다가 형식이 깨지는 문제가 없다.
- 공식 문서도 "코딩 에이전트의 모델을 Jev로 바꾸지 말고, 구조화된 판단에 따로 쓰라"고 권한다.

## 한 일
| 파일 | 역할 |
| --- | --- |
| `package.json` | `@typesafe-ai/sdk@0.6.0`(Jev 공식 SDK), `server-only`, `check:ai` 스크립트 |
| `.env.example` (새 파일) | 필요한 환경 변수 목록. 복사해서 `.env.local`을 만든다 |
| `.gitignore` | `.env*` 제외, `.env.example`만 커밋 |
| `src/lib/ai/jev.ts` (새 파일) | 서버 전용 Jev 클라이언트 `askJev()`. OpenRouter 경유, 확신도 문턱 `CONFIDENCE`, 실패 시 가짜 응답 |
| `src/lib/ai/searchIntent.ts` (새 파일) | 첫 사용 예: 검색 문장 → 카테고리·가격대·선물 여부 + 행동(apply/confirm/fallback) |
| `src/app/dev/jev/` (새 파일) | 개발용 확인 페이지 `/dev/jev`. 배포 환경에서는 404 |
| `scripts/check-ai.mjs` (새 파일) | 연결 확인. 실패 원인을 네트워크/키/잔액/모델로 구분해 알려 줌 |

## 핵심 개념

**1. API 키는 서버에만**
```ts
import 'server-only' // 이 파일을 'use client' 쪽에서 import하면 빌드 실패
```
키로 요금이 청구된다. 브라우저 코드에 들어가면 개발자 도구로 누구나 꺼내 쓸 수 있다. 그래서 Jev는 서버 컴포넌트, Route Handler, Server Action에서만 부른다. 키는 `.env.local`에만 두고 채팅·코드·커밋에 적지 않는다.

**2. OpenRouter 경유**
OpenRouter 키 하나로 Jev·Gemini·Qwen을 모두 부를 수 있다. SDK는 기본 주소 뒤에 `/v1/systemone`을 붙이므로 기본 주소를 `https://openrouter.ai/api`로, 모델을 `typesafe/jev-1.13`으로 지정했다.

**3. 확신도에 따라 행동을 나눈다** (TypeSafe 문서의 confidence-gated routing 권장값)
| 확신도 | 행동 | 검색에서 |
| --- | --- | --- |
| 0.85 이상 | 자동 처리 | 필터 바로 적용 (`apply`) |
| 0.6 ~ 0.85 | 확인 | "오디오 카테고리로 볼까요?" (`confirm`) |
| 0.6 미만 | 넘김 | 자동 적용 안 함, 이후 Qwen → Gemini 대체 (`fallback`) |

**4. 실패해도 멈추지 않는다 — 안전한 가짜 응답**
키 없음(`no-key`), `AI_MOCK=1`(`forced`), 연결 실패(`network`), 요청 실패(`error`)일 때 `askJev()`는 예외를 던지지 않고 **모든 확신도가 0인 답**을 돌려준다. 그러면 위 표의 규칙에 따라 항상 `fallback`이 되어, 가짜 답이 실제 판단처럼 쓰이는 일이 없다. 결과의 `source`('jev' | 'mock')와 `reason`으로 어디서 온 답인지 알 수 있다.

**5. 질문은 작게 여러 개, 한 번에**
검색 의도를 큰 질문 하나로 묻지 않고 `category`(choice), `price`(score), `gift`(noul) 세 개로 나눠 한 요청에 보낸다. 공식 문서의 권장 방식이다.

## 확인 결과 (2026-09-30, 회사 PC)
| 확인 | 결과 |
| --- | --- |
| 키 없이 `npm run check:ai` | 키 넣는 방법 안내 |
| 가짜 키로 `npm run check:ai` | "네트워크가 HTTPS 인증서를 바꿔치기" → Codespaces 안내 (정확히 진단) |
| 키 없음 / `AI_MOCK=1` / 가짜 키로 `classifySearchIntent()` | 셋 다 에러 없이 `source: mock`, 확신도 0, `action: fallback` |
| `server-only` 없이(브라우저 조건) 불러오기 | 에러로 막힘 (정상) |
| 개발 서버 `/dev/jev` | 200, "가짜 응답 · 키 없음" 표시 |
| 타입 검사 · lint · 빌드 | 통과 |

처음에는 이 PC에서 모든 AI API가 `SELF_SIGNED_CERT_IN_CHAIN`으로 막혔다. 이후 같은 PC에서 OpenRouter 연결이 열려 실제 키로 확인했다: Jev가 "결제가 두 번 됐어요. 오늘 안에 꼭 환불해 주세요"를 급한 요청일 확률 0.94로 판단 (0.7초).

## 직접 해 보기
1. `cp .env.example .env.local` 후 `OPENROUTER_API_KEY=` 뒤에 키 붙여 넣기 (채팅에 붙여 넣지 않기)
2. `npm run check:ai`
   - 회사 PC: "인증서" 원인이 나오면 정상. 아래 Codespaces에서 확인
   - Codespaces: `✓ Jev 연결 성공`이 나와야 한다
3. 개발 서버를 **다시 시작**(`.env.local`은 시작할 때 읽힌다) → http://localhost:3000/dev/jev
   - 키가 있고 연결되면 "실제 API", 확신도가 0이 아닌 값으로 나온다
   - "오늘 날씨 어때"는 `알수없음` 또는 낮은 확신도 → `대체 처리`가 나오면 정상

### Codespaces에서 실제 호출 확인하기
1. `cloude` 브랜치를 GitHub에 push (사용자 확인 후)
2. GitHub 저장소 → Code → Codespaces → `cloude` 브랜치로 생성
3. Codespaces 설정 → Secrets에 `OPENROUTER_API_KEY` 등록 (파일에 적지 않아도 환경 변수로 들어온다)
4. `npm install && npm run check:ai && npm run dev`

## 다음 단계
- 3단계: Step 4(검색·필터를 URL로)와 합쳐 검색창에 `classifySearchIntent` 연결 (Route Handler)
- 4단계: `fallback`일 때 Qwen → Gemini 대체 처리
- 5단계: 커밋 전 diff 위험 점수 (3-4 husky와 연결)

## 참고
- [TypeSafe Quick start](https://docs.typesafe.ai/introduction/quickstart.md)
- [Jev with coding agents](https://docs.typesafe.ai/introduction/coding-agents.md)
- [Confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing.md)
- [TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript.md)
- [Jev on OpenRouter](https://openrouter.ai/docs/guides/community/jev)
