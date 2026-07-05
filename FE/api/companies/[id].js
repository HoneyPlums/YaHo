import { getCompanyById } from '../../lib/db/queries.js'
import { getPoliciesByRegion } from '../../lib/db/queries.js'

// GET /api/companies/:id — 기업 상세 + 지역 매칭 청년 지원정책 (PRD 6.1, 13.2)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { id } = req.query

  try {
    const company = await getCompanyById(id)
    if (!company) {
      res.status(404).json({ error: '해당 기업을 찾을 수 없습니다' })
      return
    }
    const policies = await getPoliciesByRegion(company.region)
    res.status(200).json({ company, policies })
  } catch (err) {
    console.error('GET /api/companies/[id] failed', err)
    res.status(500).json({ error: '기업 상세 조회에 실패했습니다' })
  }
}
