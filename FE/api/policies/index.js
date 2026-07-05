import { getPoliciesByRegion } from '../../lib/db/queries.js'

// GET /api/policies?region=지역명
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const region = typeof req.query.region === 'string' ? req.query.region.trim() : ''
  if (!region) {
    res.status(400).json({ error: 'query parameter "region"이 필요합니다' })
    return
  }

  try {
    const policies = await getPoliciesByRegion(region)
    res.status(200).json({ policies })
  } catch (err) {
    console.error('GET /api/policies failed', err)
    res.status(500).json({ error: '정책 조회에 실패했습니다' })
  }
}
