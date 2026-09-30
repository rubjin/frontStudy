# AI 연동 2. 여러 모델 역할 나누기 — 대체 해석 · 교차 리뷰 (cloude 브랜치)

> 상태: 완료 · 2026-09-30 실제 API로 확인
> 아키텍처 그림: https://claude.ai/code/artifact/a726702d-e2f3-4c58-8dcc-a55ae3fafce3

## 목표
Gemini, Qwen, Claude, GPT, DeepSeek, GLM, Jev, Kimi 중 **아직 안 쓰던 모델을 실제로 쓸모 있는 자리에** 넣는다. 모두 OpenRouter 키 하나로 부른다.

## 어떤 모델을 어디에 (src/lib/ai/models.ts)
| 역할 | 모델 | 왜 |
| --- | --- | --- |
| 판단 | Jev 1.13 | 정해진 답 + 확신도. 분명한 검색은 0.2~0.5초에 99~100% |
| 대체 해석 1순위 | DeepSeek V4 Flash | 가장 쌈(약 $0.10 / $0.20), 빠름 |
| 대체 해석 2순위 | Gemini 3.8 Flash | 응답이 일정(두 번 모두 1.9초), 다국어 강함 |
| 대체 해석 3순위 | GPT-6 Luna | 쌈($0.10 / $0.50)이지만 응답이 들쭉날쭉(1.4~11.9초) |
| 교차 리뷰 | GLM 5.3, Kimi K3 | 코딩에 강한 다른 회사 모델이 Claude가 쓴 코드를 검토 |
| 선택 리뷰어 | Qwen3.8 Max | 고성능이지만 비쌈($2 / $6). `--with-qwen`일 때만 |
| 개발(구현) | Claude Code | 이 저장소에서 코드를 쓰는 에이전트 |

모델 ID는 추측하지 않고 OpenRouter 페이지·검색으로 확인한 뒤 `npm run check:ai`로 **7개 모두 실제 응답**하는 것을 확인했다.
> 웹 조회 도구로 받은 OpenRouter 모델 목록은 ID 형식이 이상하고(`anthropic/...`) Jev·DeepSeek이 빠져 있었다. 그래서 모델별 페이지와 검색으로 교차 확인했다.

## 1. 대체 해석 — Jev가 확신하지 못한 검색어 (src/lib/ai/llm.ts)
```
검색어 → Jev ─ 확신 ≥ 0.85 → 바로 적용
             ├ 0.6 ~ 0.85  → 사용자 확인
             ├ '관련 없음'을 확신 → 끝 (LLM 안 부름)
             └ < 0.6       → LLM(DeepSeek → Gemini → GPT) → 사용자 확인만
```
- **모델 자동 대체**: OpenRouter `models` 배열. 앞 모델이 오류(다운·과부하)면 다음 모델로. 응답의 `model`로 실제로 답한 모델을 안다.
- **답 형식 강제**: `response_format`(JSON 스키마, 카테고리는 `enum`) + `provider.require_parameters: true`
- **코드에서 다시 검사**: 스키마를 지켰더라도 허용된 카테고리·가격 단계인지 `validate`로 확인
- **LLM 결과는 자동 적용하지 않는다**: 같은 "여자친구 생일 선물"이 한 번은 '알수없음', 한 번은 '웨어러블'로 나왔다. 확신도가 없는 답이라 항상 사용자 확인으로만 보낸다.
- **실패해도 멈추지 않는다**: 키 없음·연결 실패·시간 초과·형식 오류는 `data: null` + `reason`

### 실제 결과 (2026-09-30)
| 검색 문장 | 결과 | 결정 | 시간 |
| --- | --- | --- | --- |
| 5만원 이하 선물용 이어폰 | 오디오 100% · 5만원 이하 · 선물 95% → 바로 적용 | Jev | 0.48초 |
| 사무실에서 쓸 조용한 키보드 | 주변기기 100% → 바로 적용 | Jev | 0.24초 |
| 영상 편집용 큰 모니터 50만원까지 | 디스플레이 100% · 30만원 초과 → 바로 적용 | Jev | 0.25초 |
| 노트북 받침대 | 액세서리 99% → 바로 적용 | Jev | 0.21초 |
| 책상 위 선 정리 | 액세서리 65% → 사용자 확인 | Jev | 0.32초 |
| 운동할 때 쓸 거 | Jev 50% → DeepSeek '웨어러블' → 사용자 확인 | LLM | 4.5초 |
| 오늘 날씨 어때 | 알수없음 99~100% → LLM 안 부름 | Jev | 0.3초 (처음엔 LLM을 불러 6.2초 낭비 → 고침) |

## 2. 교차 리뷰 — `npm run review:ai` (scripts/review-ai.mjs)
```bash
npm run review:ai                # staged 변경 (없으면 작업 중 변경)
npm run review:ai -- --last      # 마지막 커밋
npm run review:ai -- --with-qwen # Qwen3.8 Max 추가 (비쌈)
```
- **Jev**: 위험도 0~3("문서만" ~ "보안·API 키 등 핵심") + "테스트가 필요한가" 확률. 위험도 2 이상 또는 확신도 60% 미만이면 "사람이 꼼꼼히 보라"
- **GLM 5.3 · Kimi K3**: 동시에 리뷰. 프로젝트 규칙(서버 전용 키, CSS 변수, to-rem, 접근성)을 알려 주고 "실제 문제만 최대 5개"
- 비용: diff 길이 제한, 실행마다 실제 비용 출력. 직접 실행할 때만 동작

### 첫 실행 — 이 기능 자체를 리뷰 (비용 약 $0.02)
Jev: 위험도 2.20 / 3("여러 화면이나 공통 모듈에 영향", 확신도 78%). GLM 10초, Kimi 95초.
| 지적 | 판단 | 조치 |
| --- | --- | --- |
| `check:ai`가 Jev 실패해도 성공(0)으로 끝남 (GLM) | 맞음 | `jevFailed`를 종료 코드에 반영 |
| 연결 실패는 `source:'mock'`, HTTP 실패는 `'llm'` — 기준이 섞임 (GLM·Kimi 둘 다) | 맞음 | 시도 안 함만 mock, 시도 후 실패는 llm + reason |
| LLM이 정한 카테고리 옆에 Jev의 낮은 확신도가 표시됨 (GLM) | 맞음 | `/dev/jev`에서 LLM 결정이면 "— (LLM)" |
| 대체 해석이 최대 8초 붙잡음 (GLM) | 일부 | 6초로 줄였다가 실측에서 시간 초과가 생겨 8초로 되돌림. 검색창 연결 때 비동기로 해결 예정 |
| `.ts` 직접 import는 Node 22.18+ 전용인데 `engines` 없음 (GLM·Kimi 둘 다) | 맞음 | `"engines": { "node": ">=22.18" }` |
| 추론 모델이면 `max_tokens: 300`에서 JSON이 잘림 (Kimi) | 규칙화 | 대체 모델에 추론 모델을 넣지 않는다고 명시 |
| 답이 배열(멀티파트)이면 빈 답 (Kimi) | 맞음 | 문자열·배열 모두 처리 |

**AI 리뷰도 그대로 믿지 않는다.** 하나씩 코드와 대조했고, "타임아웃을 2~3초로"라는 제안은 실측과 맞지 않아 따르지 않았다.

## 직접 확인하다 찾은 버그 (리뷰와 별개)
1. **본문을 읽다가 시간 초과 → 기능 전체가 멈춤**: `fetch`만 `try`로 감싸고 `response.json()`은 밖에 있었다. 제한 시간은 본문을 읽는 동안에도 적용된다. → 전체를 `try`로 감싸고 `reason: 'timeout'`
2. **Windows에서 `process.exit()` 충돌(종료 코드 127)**: 네트워크 연결을 정리하는 도중 강제 종료하면 Node가 `Assertion failed ... async.c`로 죽는다. → `process.exitCode`만 정하고 자연스럽게 끝나게

## 핵심 개념
- **판단(Jev)과 생성(LLM)을 나눈다**: 확신도가 있는 판단은 자동 처리, 확신도가 없는 LLM 답은 사람(사용자)에게 확인
- **싼 모델부터**: 대부분 첫 모델에서 끝나므로 평균 비용이 낮다. 순서는 가격과 **응답 시간의 일정함**을 함께 본다
- **교차 리뷰**: 같은 회사 모델은 같은 실수를 할 수 있다. 다른 회사 모델 2개가 동시에 보면 서로 놓친 것을 잡는다. 이번에도 두 모델이 공통으로 지적한 2건은 모두 실제 문제였다
- **모델 목록은 한 곳에**: `models.ts`를 앱(`llm.ts`)과 스크립트(`check:ai`, `review:ai`)가 함께 쓴다. Node 22.18+는 `.ts`를 바로 import할 수 있다

## 확인 방법
1. `npm run check:ai` → Jev + 모델 6개 모두 ✓
2. `npm run dev` → http://localhost:3000/dev/jev → 위쪽 "실제 API", 표의 결정 칸(Jev / LLM 대체 / 판단 못 함)
3. 파일을 조금 고치고 `git add` → `npm run review:ai` → 위험도와 두 모델의 리뷰, 비용 확인

## 다음 단계
- 검색창에 연결 (Step 4 URL 쿼리와 함께): Jev 결과를 먼저 보여 주고, LLM 해석은 나중에 "이런 걸 찾으세요?"로 덧붙여 사용자가 기다리지 않게
- 같은 검색어 결과 캐시 (비용·시간 절약)
- `review:ai`를 3-4의 커밋 전 검사(husky)에 선택적으로 연결

## 참고
- [OpenRouter Model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks)
- [OpenRouter Structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [DeepSeek V4 Flash](https://openrouter.ai/deepseek/deepseek-v4-flash) · [Kimi K3](https://openrouter.ai/moonshotai/kimi-k3) · [GLM 5.3](https://openrouter.ai/compare/z-ai/glm-5.3) · [Qwen3.8 Max vs Kimi K3](https://openrouter.ai/compare/qwen/qwen3.8-max/moonshotai/kimi-k3) · [Gemini 3.8 Flash vs GPT-6 Luna](https://openrouter.ai/compare/google/gemini-3.8-flash/openai/gpt-6-luna)
