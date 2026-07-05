// lib/ai/gemini-client.ts
//
// Gemini API 클라이언트 — 임베딩(embedding.ts)과 생성(generate.ts)이 공유해서 사용.
// PRD 14.4: 임베딩·생성 모두 Gemini 하나로 통합 (별도 임베딩 서비스 쓰지 않음)
//
// 필요 패키지: npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY가 설정되지 않았습니다. .env.local에 GEMINI_API_KEY=... 를 추가하세요.'
  )
}

export const genAI = new GoogleGenerativeAI(apiKey)

// ── 모델명 상수 ────────────────────────────────────────────────────────────
// PRD 14.4 원칙("개발 시작 전 Google AI Studio에서 확인")에 따라 확정한 값.
// 무료 등급 확인됨(2026-07 기준). 변경 시 이 상수만 고치면 전체 반영됨.
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const GENERATION_MODEL = 'gemini-2.5-flash'
