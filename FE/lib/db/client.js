import pg from 'pg'

const { Pool } = pg

let pool

// 서버리스 함수는 호출마다 새로 로드될 수 있어, 모듈 스코프에 Pool을 캐싱해
// 같은 실행 컨테이너 안에서는 커넥션을 재사용한다.
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다 (.env.local 확인)')
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

export async function query(text, params) {
  return getPool().query(text, params)
}
