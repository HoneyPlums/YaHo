// lib/ai/types.ts
//
// PRD 13번 ERD의 companies 테이블 구조와 동일하게 맞춘 타입.
// Backend/DB 담당의 PostgreSQL 스키마와 필드명을 반드시 일치시킬 것.

export interface Company {
  id: string // uuid, ChromaDB 문서 ID와 동일하게 사용 (PRD 13.1)
  name: string
  region: string
  industry: string
  job_position: string
  employment_type: string
  benefits: string
  description: string
  source_url: string
  created_at?: string
}

export interface SearchResultItem {
  company: Company
  similarity: number // 코사인 유사도, 0~1
}

export interface RecommendationItem {
  companyId: string
  reason: string // Gemini가 생성한 추천 이유
}
