// DB 스키마를 적용한다. 처음 세팅할 때, 그리고 schema.sql이 바뀔 때마다 실행.
//   node scripts/migrate.js
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getPool } from '../lib/db/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })
const schema = readFileSync(join(__dirname, '../lib/db/schema.sql'), 'utf-8')

const pool = getPool()
await pool.query(schema)
console.log('스키마 적용 완료 (companies, policies, recommendations_cache)')
await pool.end()
