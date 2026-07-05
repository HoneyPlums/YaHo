// scripts/ingest.ts
//
// PRD 9.2 체크리스트, PRD 14.1 참고
// 실행: npx tsx scripts/ingest.ts (또는 package.json에 "ingest" 스크립트 등록)
//
// 흐름: PostgreSQL에서 기업 목록 조회 → 텍스트 조합 → Gemini 임베딩 → ChromaDB 저장
//
// ⚠️ getAllCompanies()는 Backend/DB 담당이 lib/db/에 만드는 함수입니다.
//    아직 준비되지 않았다면 채팅으로 먼저 함수 시그니처를 맞춰두세요.
//    예: export async function getAllCompanies(): Promise<Company[]>

import { buildCompanyDocument, embedDocument } from '../lib/ai/embedding'
import { upsertCompanyVector } from '../lib/ai/search'
import type { Company } from '../lib/ai/types'

// TODO: Backend/DB 담당의 실제 함수로 교체
// import { getAllCompanies } from '../lib/db/companies'
async function getAllCompanies(): Promise<Company[]> {
  throw new Error(
    'lib/db/companies의 getAllCompanies()를 아직 연결하지 않았습니다. ' +
      'Backend/DB 담당과 함수 시그니처를 맞춘 뒤 위 import로 교체하세요.'
  )
}

async function main() {
  console.log('📂 PostgreSQL에서 기업 데이터 조회 중...')
  const companies = await getAllCompanies()
  console.log(`   → ${companies.length}개 기업 발견`)

  let success = 0
  let failed = 0

  for (const company of companies) {
    try {
      const doc = buildCompanyDocument(company)
      const vector = await embedDocument(doc)
      await upsertCompanyVector(company, vector)

      success++
      console.log(`  ✅ [${success}/${companies.length}] ${company.name}`)

      // 무료 티어 요청 빈도 제한 대비 딜레이
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      failed++
      console.error(`  ❌ ${company.name} 인덱싱 실패:`, err)
    }
  }

  console.log(`\n🎉 인덱싱 완료 — 성공 ${success}개, 실패 ${failed}개`)
}

main().catch((err) => {
  console.error('인덱싱 스크립트 실행 중 오류:', err)
  process.exit(1)
})
