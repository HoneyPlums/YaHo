import { query } from './client.js'

// AI/RAG 담당(PRD 9.2)이 벡터 검색 함수를 붙이기 전까지 쓰는 임시 폴백.
// 최종 검색은 lib/ai의 벡터 유사도 검색 결과(Top-K company id 목록)를 받아
// getCompaniesByIds로 상세정보만 조회하는 흐름으로 교체될 예정 (PRD 14.2 참고).
export async function searchCompaniesFallback(keyword) {
  const { rows } = await query(
    `select * from companies
     where name ilike $1
        or category ilike $1
        or industry ilike $1
        or region ilike $1
        or products_services ilike $1
        or company_size ilike $1
     order by created_at desc
     limit 5`,
    [`%${keyword}%`],
  )
  return rows
}

export async function getCompaniesByIds(ids) {
  const { rows } = await query(`select * from companies where id = any($1::text[])`, [ids])
  return rows
}

export async function getCompanyById(id) {
  const { rows } = await query(`select * from companies where id = $1`, [id])
  return rows[0] ?? null
}

// PRD 13.2: region 매칭만 자동으로 하고, 연령/취업상태는 자격요건 텍스트로 노출한다.
// BEPA 실데이터의 company.region은 "강서구"처럼 구/군 단위만 담고 있고(부산 접두어 없음),
// 이 프로젝트 자체가 부산 청년 대상으로 범위가 고정되어 있어(README 참고),
// target_region이 "부산" 또는 "전국"이면 이 데이터셋의 모든 기업에 적용된다고 본다.
export async function getPoliciesByRegion(region) {
  const { rows } = await query(
    `select * from policies
     where target_region = '전국' or target_region = '부산'
     order by
       case when target_region = '전국' then 0 else 1 end,
       deadline nulls last`,
  )
  return rows
}

export async function getCachedRecommendation(queryText, companyId) {
  const { rows } = await query(
    `select reason_text from recommendations_cache where query_text = $1 and company_id = $2`,
    [queryText, companyId],
  )
  return rows[0]?.reason_text ?? null
}

export async function saveCachedRecommendation(queryText, companyId, reasonText) {
  await query(
    `insert into recommendations_cache (query_text, company_id, reason_text)
     values ($1, $2, $3)
     on conflict (query_text, company_id) do update set reason_text = excluded.reason_text`,
    [queryText, companyId, reasonText],
  )
}
