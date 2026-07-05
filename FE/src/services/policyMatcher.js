// 기업의 지역(location)과 정책의 targetRegion을 비교해 관련 청년 지원정책을 찾는다.
// PRD 13.2 설계 노트대로 companies ↔ policies는 고정 FK로 연결하지 않고,
// 추천 시점에 지역 기준으로만 매칭한다. 자격요건(연령·취업상태)은 로그인이 없어
// 자동 판정할 수 없으므로 텍스트로 안내하고 사용자가 스스로 확인하도록 한다.

import { mockPolicies } from '../data/mockPolicies'

export function getMatchingPolicies(company, limit = 3) {
  const matched = mockPolicies.filter(
    (policy) => policy.targetRegion === '전국' || company.location.includes(policy.targetRegion),
  )

  // 구/군 단위로 좁게 특화된 정책 → 부산 전역 정책 → 전국 정책 순으로 우선 노출
  matched.sort((a, b) => specificity(b.targetRegion) - specificity(a.targetRegion))

  return matched.slice(0, limit)
}

function specificity(targetRegion) {
  if (targetRegion === '전국') return 0
  return targetRegion.split(' ').length // '부산' → 1, '부산 사상구' → 2
}

function toCamelCasePolicy(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetAgeMin: row.target_age_min,
    targetAgeMax: row.target_age_max,
    targetRegion: row.target_region,
    targetEmploymentStatus: row.target_employment_status,
    deadline: row.deadline,
    applicationUrl: row.application_url,
  }
}

// 실제 DB(/api/policies)에서 기업 지역 기준 정책을 가져오고, API 실패 시(로컬 개발 중
// vercel dev 미사용, 네트워크 오류, 한도 초과 등) 로컬 mock 매칭으로 대체한다.
export async function getPoliciesForCompany(company, limit = 3) {
  try {
    const res = await fetch(`/api/policies?region=${encodeURIComponent(company.location)}`)
    if (!res.ok) throw new Error(`정책 조회 실패 (${res.status})`)
    const { policies } = await res.json()
    return policies.map(toCamelCasePolicy).slice(0, limit)
  } catch (err) {
    console.warn('정책 API 호출 실패, 로컬 mock 데이터로 대체합니다', err)
    return getMatchingPolicies(company, limit)
  }
}

export function isPolicyExpired(policy) {
  if (!policy.deadline) return false
  return new Date(policy.deadline) < new Date()
}
