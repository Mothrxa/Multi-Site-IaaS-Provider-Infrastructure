import pg from 'pg'

const { Pool } = pg

let _pool = null

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.CLOUD_DATABASE_URL || 'postgres://admin:admin@localhost:5432/cloud',
    })
  }
  return _pool
}

function toPg(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

export const cloudDb = {
  prepare(sql) {
    const text = toPg(sql)
    return {
      get:  async (...params) => (await getPool().query(text, params)).rows[0],
      all:  async (...params) => (await getPool().query(text, params)).rows,
      run:  async (...params) => { const r = await getPool().query(text, params); return { changes: r.rowCount } },
    }
  },
  exec: async (sql) => { await getPool().query(sql) },
}
