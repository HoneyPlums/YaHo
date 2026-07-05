// RAG 파이프라인의 "검색(Retrieval) + 생성(Generation)" 단계를 흉내 내는 mock API 레이어.
// 실제 서비스에서는 이 함수가
//   1) 사용자 입력을 embedding
//   2) vector DB(Chroma/FAISS)에서 Top-K 기업 chunk 검색
//   3) LLM(OpenAI/Claude API)에 검색 결과 + 사용자 프로필을 넘겨 추천 이유 생성
// 을 순서대로 호출하는 REST 엔드포인트를 fetch로 감싸는 형태로 대체된다.
// 지금은 백엔드가 없으므로 mockCompanies.js를 "vector DB 검색 결과"처럼 다루고,
// 겹치는 항목을 스코어링해 그럴듯한 추천 이유를 즉석에서 생성한다.

import { mockCompanies } from '../data/mockCompanies'
import { clampScore, PRIORITY_WEIGHTS } from '../utils/scoreFormatter'
import { getPoliciesForCompany } from './policyMatcher'

const SIMULATED_LATENCY_MS = 1100

function tokenize(value) {
  if (!value) return []
  return String(value)
    .split(/[,\s/·|]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function overlaps(userTokens, companyTokens) {
  const matched = []
  for (const userToken of userTokens) {
    for (const companyToken of companyTokens) {
      if (
        companyToken.includes(userToken) ||
        userToken.includes(companyToken)
      ) {
        matched.push(companyToken)
      }
    }
  }
  return [...new Set(matched)]
}

// 사용자 입력과 기업 데이터를 비교해 차원별 적합도(0~100)와 매칭 근거를 계산한다.
function scoreCompany(company, userProfile) {
  const {
    industry = '',
    jobRole = '',
    skills = '',
    location = '',
    benefits = [],
    freeText = '',
  } = userProfile

  const userSkillTokens = tokenize(skills)
  const userFreeTextTokens = tokenize(freeText)
  const userIndustryTokens = tokenize(industry)
  const userJobTokens = tokenize(jobRole)

  const industryMatch = overlaps(userIndustryTokens, [company.industry, ...company.keywords])
  const jobMatch = overlaps(userJobTokens, company.jobs)
  const skillMatch = overlaps(userSkillTokens, company.skillsWanted)
  const locationMatch =
    location && (location === '부산 전체' || company.location.includes(location)) ? [company.location] : []
  const benefitMatch = overlaps(benefits, company.benefits)
  const freeTextMatch = overlaps(userFreeTextTokens, [
    ...company.keywords,
    ...company.skillsWanted,
    company.industry,
  ])

  const matchingKeywords = [
    ...new Set([...industryMatch, ...jobMatch, ...skillMatch, ...locationMatch, ...benefitMatch, ...freeTextMatch]),
  ]

  // 직무적합성(match) 차원 점수: 겹친 항목 수에 비례, 5개 이상 겹치면 만점
  const overlapCount =
    industryMatch.length * 2 + jobMatch.length * 2 + skillMatch.length * 2 + locationMatch.length + benefitMatch.length + freeTextMatch.length
  const matchDimensionScore = clampScore((overlapCount / 8) * 100)

  const weights = PRIORITY_WEIGHTS[userProfile.priority] || PRIORITY_WEIGHTS['직무적합성']
  const weightedScore =
    company.growthPotential * 20 * weights.growthPotential +
    company.stability * 20 * weights.stability +
    company.salaryLevel * 20 * weights.salaryLevel +
    company.workLifeBalance * 20 * weights.workLifeBalance +
    matchDimensionScore * weights.match

  // 데모 안정성을 위해 baseline matchScore(설계된 예시값)와 30:70으로 블렌딩
  const finalScore = clampScore(weightedScore * 0.7 + company.matchScore * 0.3)

  const dynamicReasons = []
  if (industryMatch.length) dynamicReasons.push(`관심 산업과 일치하는 키워드: ${industryMatch.join(', ')}`)
  if (jobMatch.length) dynamicReasons.push(`희망 직무와 일치: ${jobMatch.join(', ')}`)
  if (skillMatch.length) dynamicReasons.push(`보유 기술 스택과 일치: ${skillMatch.join(', ')}`)
  if (locationMatch.length) dynamicReasons.push(`근무 희망 지역과 일치: ${locationMatch.join(', ')}`)
  if (benefitMatch.length) dynamicReasons.push(`선호 복지와 일치: ${benefitMatch.join(', ')}`)
  if (freeTextMatch.length) dynamicReasons.push(`자유 입력 내용과 관련된 키워드: ${freeTextMatch.join(', ')}`)

  return {
    finalScore,
    matchingKeywords,
    reasons: dynamicReasons.length ? dynamicReasons : company.reasons,
  }
}

/**
 * 사용자 프로필을 받아 Top-K 추천 기업 목록을 반환한다.
 * 실제 네트워크 호출을 흉내 내기 위해 인위적인 지연을 둔다.
 */
export function getRecommendations(userProfile, topK = 5) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const scored = mockCompanies
        .map((company) => {
          const { finalScore, matchingKeywords, reasons } = scoreCompany(company, userProfile)
          return { ...company, matchScore: finalScore, matchingKeywords, reasons }
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, topK)

      // 정책은 실제 DB(/api/policies)에서 지역 기준으로 조회하고, 실패 시 로컬 mock으로 대체한다.
      const withPolicies = await Promise.all(
        scored.map(async (company) => ({
          ...company,
          policies: await getPoliciesForCompany(company),
        })),
      )

      resolve(withPolicies)
    }, SIMULATED_LATENCY_MS)
  })
}
