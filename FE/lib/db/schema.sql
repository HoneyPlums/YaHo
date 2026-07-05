-- BEPA 청끌기업 실데이터(FE/data/2026_청끌기업.csv) + 청년정책 17개(FE/data/잡아드림_기업정책17개.csv) 기준 스키마.
-- scripts/seed-real-data.mjs가 이 두 CSV를 읽어 DB를 채운다.

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  industry TEXT,
  company_size TEXT,
  avg_starting_salary INT,
  avg_annual_salary INT,
  revenue INT,
  employee_total INT,
  employee_regular INT,
  employee_nonregular INT,
  worklife_balance_score INT,
  worklife_balance_detail TEXT,
  training_score INT,
  training_detail TEXT,
  welfare_score INT,
  welfare_detail TEXT,
  region TEXT,
  products_services TEXT,
  certifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- deadline은 '2026.3.27' 같은 실제 날짜뿐 아니라 '상시', '연중(정기모집)' 같은
-- 자유 텍스트도 들어오므로 DATE가 아니라 TEXT로 저장한다.
CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_age_min INTEGER,
  target_age_max INTEGER,
  target_region TEXT,
  target_employment_status TEXT,
  deadline TEXT,
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
