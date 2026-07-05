// data/companies.csv, data/policies.csv (PRD 13.3 컬럼 형식)를 읽어 DB에 upsert한다.
// 데이터 담당(PRD 9.4)이 CSV를 채워 커밋하면 아래처럼 실행:
//   node scripts/seed.js
import { config } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parse } from 'csv-parse/sync'
import { getPool } from '../lib/db/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const dataDir = join(__dirname, '../data')
const companiesPath = join(dataDir, 'companies.csv')
const policiesPath = join(dataDir, 'policies.csv')

function readCsv(path) {
  if (!existsSync(path)) {
    console.log(`건너뜀: ${path} 가 아직 없습니다`)
    return []
  }
  return parse(readFileSync(path, 'utf-8'), { columns: true, skip_empty_lines: true, trim: true })
}

// job_position/skills_wanted/benefits/keywords는 DB에서 text[]이므로,
// 스프레드시트에서는 "백엔드 개발자|신입 개발자"처럼 파이프(|)로 구분해 입력한다 (콤마는 CSV 구분자와 겹쳐서 사용 안 함).
function splitList(value) {
  if (!value) return []
  return String(value)
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean)
}

async function seedCompanies(pool) {
  const rows = readCsv(companiesPath)
  for (const row of rows) {
    const financialHealth =
      row.financial_health_rating || row.financial_health_detail
        ? { rating: row.financial_health_rating || null, detail: row.financial_health_detail || null }
        : null

    await pool.query(
      `insert into companies (
         id, name, region, industry, job_position, employment_type, skills_wanted, benefits,
         description, source_url, financial_health, growth_potential, stability, salary_level,
         work_life_balance, keywords
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       on conflict (id) do update set
         name = excluded.name, region = excluded.region, industry = excluded.industry,
         job_position = excluded.job_position, employment_type = excluded.employment_type,
         skills_wanted = excluded.skills_wanted, benefits = excluded.benefits,
         description = excluded.description, source_url = excluded.source_url,
         financial_health = excluded.financial_health, growth_potential = excluded.growth_potential,
         stability = excluded.stability, salary_level = excluded.salary_level,
         work_life_balance = excluded.work_life_balance, keywords = excluded.keywords`,
      [
        row.id,
        row.name,
        row.region,
        row.industry,
        splitList(row.job_position),
        row.employment_type || null,
        splitList(row.skills_wanted),
        splitList(row.benefits),
        row.description,
        row.source_url || null,
        financialHealth ? JSON.stringify(financialHealth) : null,
        row.growth_potential || null,
        row.stability || null,
        row.salary_level || null,
        row.work_life_balance || null,
        splitList(row.keywords),
      ],
    )
  }
  console.log(`companies: ${rows.length}건 upsert 완료`)
}

async function seedPolicies(pool) {
  const rows = readCsv(policiesPath)
  for (const row of rows) {
    await pool.query(
      `insert into policies (id, name, description, target_age_min, target_age_max, target_region, target_employment_status, deadline, application_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update set
         name = excluded.name, description = excluded.description,
         target_age_min = excluded.target_age_min, target_age_max = excluded.target_age_max,
         target_region = excluded.target_region, target_employment_status = excluded.target_employment_status,
         deadline = excluded.deadline, application_url = excluded.application_url`,
      [
        row.id,
        row.name,
        row.description,
        row.target_age_min || null,
        row.target_age_max || null,
        row.target_region,
        row.target_employment_status,
        row.deadline || null,
        row.application_url,
      ],
    )
  }
  console.log(`policies: ${rows.length}건 upsert 완료`)
}

const pool = getPool()
await seedCompanies(pool)
await seedPolicies(pool)
await pool.end()
