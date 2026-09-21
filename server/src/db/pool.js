import { Pool } from 'pg';
import config from '../config/index.js';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * 参数化查询，返回行数组。
 * @param {string} sql
 * @param {unknown[]} [params]
 */
export async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * 在单个连接内执行事务。
 * @param {(client: import('pg').PoolClient) => Promise<T>} worker
 * @returns {Promise<T>}
 */
export async function withTransaction(worker) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await worker(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
