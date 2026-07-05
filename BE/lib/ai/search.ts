// lib/ai/search.ts
//
// 벡터 유사도 검색 (ChromaDB)
// PRD 9.2 체크리스트, PRD 14.2/14.3/14.4 참고
//
// 역할 분리 원칙(PRD 14.3): ChromaDB는 "벡터끼리 가까운 것 찾기"만 담당.
// "왜 적합한지" 이유는 여기서 만들지 않고 generate.ts로 넘김.
//
// 필요 패키지: npm install chromadb

import { ChromaClient, type Collection } from 'chromadb'
import { embedQuery } from './embedding'
import type { Company, SearchResultItem } from './types'

const COLLECTION_NAME = 'companies'

// ── PRD 14.4 확정값 ───────────────────────────────────────────────────────
export const TOP_K = 5 // 화면 카드 개수와 반드시 일치시킬 것 (PRD 14.4)

// TODO: 실데이터 테스트 후 확정 (PRD 14.4)
// 코사인 유사도는 0(전혀 다름)~1(완전히 같음) 범위.
// 이 값 미만이면 "검색 결과 없음" Empty State로 처리해야
// PRD 6.2의 예외 플로우가 실제로 동작함 (임계값 없으면 항상 뭔가 반환됨).
export const SIMILARITY_THRESHOLD = 0.5

let clientInstance: ChromaClient | null = null
let collectionInstance: Collection | null = null

async function getCollection(): Promise<Collection> {
  if (collectionInstance) return collectionInstance

  clientInstance = new ChromaClient({
    path: process.env.CHROMA_URL || 'http://localhost:8000',
  })

  collectionInstance = await clientInstance.getOrCreateCollection({
    name: COLLECTION_NAME,
  })

  return collectionInstance
}

/**
 * 사용자 자연어 질의로 유사 기업 Top-K를 검색.
 * PRD 14.4: Claude(Gemini)는 이 결과의 순서를 재정렬하지 않고 이유만 붙임.
 *
 * @returns 임계값을 넘는 결과만 포함된 배열. 빈 배열이면 Empty State 처리.
 */
export async function searchCompanies(
  queryText: string
): Promise<SearchResultItem[]> {
  const collection = await getCollection()
  const queryVector = await embedQuery(queryText)

  const raw = await collection.query({
    queryEmbeddings: [queryVector],
    nResults: TOP_K,
  })

  const ids = raw.ids[0] ?? []
  const metadatas = raw.metadatas[0] ?? []
  const distances = raw.distances[0] ?? []

  const results: SearchResultItem[] = []

  for (let i = 0; i < ids.length; i++) {
    // ChromaDB 기본 거리(cosine distance) → 유사도로 변환
    const distance = distances[i] ?? 1
    const similarity = 1 - distance

    // PRD 14.4: 임계값 미만은 결과에서 제외 → Empty State 트리거
    if (similarity < SIMILARITY_THRESHOLD) continue

    const meta = metadatas[i] as unknown as Company
    results.push({ company: meta, similarity })
  }

  return results
}

/**
 * 인덱싱 스크립트(scripts/ingest.ts)에서 사용.
 * 기업 벡터 + 원본 데이터를 ChromaDB에 저장.
 */
export async function upsertCompanyVector(
  company: Company,
  vector: number[]
): Promise<void> {
  const collection = await getCollection()

  await collection.upsert({
    ids: [company.id],
    embeddings: [vector],
    metadatas: [company as unknown as Record<string, string>],
  })
}
