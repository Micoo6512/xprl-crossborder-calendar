/**
 * 数据库访问层（Cloudflare D1）。
 *
 * D1 通过 Pages 绑定（env.DB）注入，与 Workers 同机部署：无网络跳数、
 * 无连接冷启动，查询经由 SQLite 引擎本地执行。
 *
 * 需要原子性的多表写入（如支付+开通会员）使用 d1.batch()：
 * 同一批次在单个事务内顺序执行、整体提交，见 order.repository.payAndGrant。
 *
 * SQL 方言注意：占位符为 ?（按序绑定）；日期为 TEXT（YYYY-MM-DD / 
 * YYYY-MM-DD HH:MM:SS，UTC）；当前日期用 date('now')。
 */
import { getEnv } from './runtime.js';

export function d1() {
  const binding = getEnv().DB;
  if (!binding) throw new Error('D1 绑定缺失（env.DB）');
  return binding;
}

/**
 * 参数化查询，返回行数组。
 * @param {string} sql
 * @param {unknown[]} [params]
 */
export async function query(sql, params = []) {
  const { results } = await d1().prepare(sql).bind(...params).all();
  return results;
}
