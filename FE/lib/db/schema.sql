-- 실제 Neon DB에 이미 적용되어 있는 스키마 (FE의 mockCompanies.js/mockPolicies.js 구조를
-- 그대로 옮긴 형태). CREATE TABLE IF NOT EXISTS라 기존 데이터를 건드리지 않고,
-- 새 환경에 처음 세팅할 때만 이 구조로 테이블을 만든다.

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  industry TEXT,
  job_position TEXT[],
  employment_type TEXT,
  skills_wanted TEXT[],
  benefits TEXT[],
  description TEXT,
  source_url TEXT,
  financial_health JSONB,
  growth_potential INTEGER,
  stability INTEGER,
  salary_level INTEGER,
  work_life_balance INTEGER,
  keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_age_min INTEGER,
  target_age_max INTEGER,
  target_region TEXT,
  target_employment_status TEXT,
  deadline DATE,
  application_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  reason_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (query_text, company_id)
);

CREATE INDEX IF NOT EXISTS idx_policies_target_region ON policies(target_region);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_query ON recommendations_cache(query_text);
