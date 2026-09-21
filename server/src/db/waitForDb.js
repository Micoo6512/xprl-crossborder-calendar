import pool from './pool.js';

/**
 * 启动阶段轮询等待数据库就绪（容器初始化可能耗时）。
 * @param {number} retries
 * @param {number} intervalMs
 */
export default async function waitForDb(retries = 30, intervalMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return;
    } catch (error) {
      console.log(`[waitForDb] 第 ${attempt}/${retries} 次连接未就绪：${error.code || error.message}`);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
