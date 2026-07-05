import { searchCompaniesFallback } from '../../lib/db/queries.js'

// GET /api/companies?q=자연어질의
// TODO: AI/RAG 담당(PRD 9.2)의 벡터 검색이 준비되면 searchCompaniesFallback 대신
// lib/ai의 임베딩+ChromaDB 검색 결과(Top-K id) -> getCompaniesByIds 흐름으로 교체할 것 (PRD 14.2)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q) {
    res.status(400).json({ error: 'query parameter "q"가 필요합니다' })
    return
  }

  try {
    const companies = await searchCompaniesFallback(q)
    res.status(200).json({ companies })
  } catch (err) {
    console.error('GET /api/companies failed', err)
    res.status(500).json({ error: '기업 검색에 실패했습니다' })
  }
}
