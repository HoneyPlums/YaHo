// lib/ai/generate.ts
//
// 검색된 Top-K 기업을 보고 "왜 적합한지" 추천 이유 생성 (Gemini API)
// PRD 9.2 체크리스트, PRD 14.3/14.4 참고
//
// 역할 분리 원칙(PRD 14.3): Gemini는 이유 생성만 하고,
// 순서 재정렬이나 별도 필터링은 하지 않음 (검색 결과 순서 그대로 유지).
//
// PRD 14.4 필수 규칙: 기업별로 API를 5번 나눠 부르지 않고
// Top-K 전체를 프롬프트 하나에 넣어 한 번에 배치 처리할 것.

import { genAI, GENERATION_MODEL } from './gemini-client'
import type { SearchResultItem, RecommendationItem } from './types'

/**
 * 검색된 기업 목록 + 사용자 질의 → 기업별 추천 이유를 한 번의 호출로 생성.
 *
 * @param queryText   사용자가 입력한 원본 자연어 질의
 * @param results     search.ts의 searchCompanies() 반환값 (이미 임계값 필터링됨)
 */
export async function generateRecommendationReasons(
  queryText: string,
  results: SearchResultItem[]
): Promise<RecommendationItem[]> {
  // 빈 배열이면 Gemini 호출 자체를 하지 않음 (한도 절약, PRD 14.4)
  if (results.length === 0) return []

  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const companyBlocks = results
    .map((r, idx) => {
      const c = r.company
      return `[기업 ${idx + 1} | id: ${c.id}]
이름: ${c.name}
지역: ${c.region}
업종: ${c.industry}
직무: ${c.job_position}
고용형태: ${c.employment_type}
복지: ${c.benefits}
설명: ${c.description}`
    })
    .join('\n\n')

  const prompt = `당신은 취업 준비생을 돕는 컨설턴트입니다.
아래 구직자의 검색 조건과, 이미 벡터 검색으로 좁혀진 기업 후보 목록을 보고
각 기업이 왜 이 조건에 적합한지 이유를 한국어로 작성하세요.

[구직자 검색 조건]
${queryText}

[검색된 기업 후보 ${results.length}개]
${companyBlocks}

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 코드블록 없이 JSON만 출력합니다.
{
  "recommendations": [
    { "companyId": "위에 표시된 id 값 그대로", "reason": "2~3문장의 구체적인 추천 이유" }
  ]
}

규칙:
- recommendations는 입력된 기업 순서 그대로, 정확히 ${results.length}개 포함
- 기업 순서를 바꾸거나 일부를 생략하지 말 것 (재정렬/필터링 금지)
- reason은 구직자 조건과 기업 정보를 구체적으로 연결해서 작성`

  const response = await model.generateContent(prompt)
  const raw = response.response.text().trim()

  try {
    const parsed = JSON.parse(raw) as {
      recommendations: RecommendationItem[]
    }
    return parsed.recommendations
  } catch {
    // 파싱 실패 시 폴백: 이유 없이 기업 ID만 반환해 화면이 죽지 않게 함.
    // PRD 6.2 "AI 응답 실패" 예외 플로우와 연결해서 에러 상태 처리 권장.
    return results.map((r) => ({
      companyId: r.company.id,
      reason: '',
    }))
  }
}
