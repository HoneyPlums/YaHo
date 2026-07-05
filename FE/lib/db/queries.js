import { query } from './client.js'

// AI/RAG 담당(PRD 9.2)이 벡터 검색 함수를 붙이기 전까지 쓰는 임시 폴백.
// 최종 검색은 lib/ai의 벡터 유사도 검색 결과(Top-K company id 목록)를 받아
// getCompaniesByIds로 상세정보만 조회하는 흐름으로 교체될 예정 (PRD 14.2 참고).
export async function searchCompaniesFallback(keyword) {
  // job_position/keywords/skills_wanted는 text[] 컬럼이라 ilike를 바로 못 쓰므로
  // array_to_string으로 풀어서 비교한다.
  const { rows } = await query(
    `select * from companies
     where name ilike $1
        or description ilike $1
        or region ilike $1
        or industry ilike $1
        or array_to_string(job_position, ' ') ilike $1
        or array_to_string(keywords, ' ') ilike $1
        or array_to_string(skills_wanted, ' ') ilike $1
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
export async function getPoliciesByRegion(region) {
  const { rows } = await query(
    `select * from policies where target_region = $1 or target_region = '전국' order by deadline nulls last`,
    [region],
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
