// FE/data/2026_청끌기업.csv (BEPA 청끌기업 120개) + FE/data/잡아드림_기업정책17개.csv (청년정책 17개)를
// 읽어 companies/policies 테이블을 통째로 새로 채운다. 기존 데모용 데이터는 지워지고 실데이터로 교체된다.
//   node scripts/seed-real-data.mjs
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parse } from 'csv-parse/sync'
import { getPool } from '../lib/db/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const dataDir = join(__dirname, '../data')

function toInt(value) {
  if (value === undefined || value === null || value === '') return null
  const n = parseInt(String(value).replace(/,/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

async function seedCompanies(pool) {
  const rows = parse(readFileSync(join(dataDir, '2026_청끌기업.csv'), 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  })

  for (const row of rows) {
    await pool.query(
      `insert into companies (
         id, name, category, industry, company_size, avg_starting_salary, avg_annual_salary,
         revenue, employee_total, employee_regular, employee_nonregular,
         worklife_balance_score, worklife_balance_detail, training_score, training_detail,
         welfare_score, welfare_detail, region, products_services, certifications
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       on conflict (id) do update set
         name = excluded.name, category = excluded.category, industry = excluded.industry,
         company_size = excluded.company_size, avg_starting_salary = excluded.avg_starting_salary,
         avg_annual_salary = excluded.avg_annual_salary, revenue = excluded.revenue,
         employee_total = excluded.employee_total, employee_regular = excluded.employee_regular,
         employee_nonregular = excluded.employee_nonregular,
         worklife_balance_score = excluded.worklife_balance_score,
         worklife_balance_detail = excluded.worklife_balance_detail,
         training_score = excluded.training_score, training_detail = excluded.training_detail,
         welfare_score = excluded.welfare_score, welfare_detail = excluded.welfare_detail,
         region = excluded.region, products_services = excluded.products_services,
         certifications = excluded.certifications`,
      [
        `c${row['연번']}`,
        row['회사명'],
        row['청끌기업분야'],
        row['업종(대분류)'],
        row['기업규모'],
        toInt(row['평균초임(천원)']),
        toInt(row['평균연봉(천원)']),
        toInt(row["'25.매출액(백만원)"]),
        toInt(row['직원수(계)']),
        toInt(row['직원수(정규직)']),
        toInt(row['직원수(비정규직)']),
        toInt(row['워라밸(10점 만점)']),
        row['워라밸 선택항목'] || null,
        toInt(row['직무교육(6점 만점)']),
        row['직무교육 선택항목'] || null,
        toInt(row['복리후생(12점 만점)']),
        row['복리후생 선택항목'] || null,
        row['소재지'],
        row['주요제품/서비스'],
        row['비고(주요 인증제도 등)'] || null,
      ],
    )
  }
  console.log(`companies: ${rows.length}건 upsert 완료`)
}

async function seedPolicies(pool) {
  const rows = parse(readFileSync(join(dataDir, '잡아드림_기업정책17개.csv'), 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  })

  // 정책 17개는 이번에 완전히 교체되는 것이므로 기존 행을 비우고 새로 넣는다.
  await pool.query('delete from policies')

  for (const row of rows) {
    await pool.query(
      `insert into policies (id, name, description, target_age_min, target_age_max, target_region, target_employment_status, deadline, application_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do update set
         name = excluded.name, description = excluded.description,
         target_age_min = excluded.target_age_min, target_age_max = excluded.target_age_max,
         target_region = excluded.target_region, target_employment_status = excluded.target_employment_status,
         deadline = excluded.deadline, application_url = excluded.application_url`,
      [
        row.id,
        row.name,
        row.description,
        toInt(row.target_age_min),
        toInt(row.target_age_max),
        row.target_region,
        row.target_employment_status,
        row.deadline,
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
