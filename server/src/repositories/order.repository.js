import pool from '../db/pool.js';

/**
 * 订单数据访问。executor 可传入连接池或事务连接（pg Pool | PoolClient）。
 */
async function run(executor, sql, params) {
  const { rows } = await executor.query(sql, params);
  return rows;
}

export function createOrder(executor = pool, userId, planCode, amount) {
  return run(
    executor,
    "INSERT INTO orders (user_id, plan_code, amount, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
    [userId, planCode, amount],
  ).then((rows) => rows[0].id);
}

export function findPendingOrder(executor = pool, userId, planCode) {
  return run(
    executor,
    "SELECT * FROM orders WHERE user_id = $1 AND plan_code = $2 AND status = 'pending' ORDER BY id DESC LIMIT 1",
    [userId, planCode],
  ).then((rows) => rows[0] || null);
}

export function findById(executor = pool, id) {
  return run(executor, 'SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]).then(
    (rows) => rows[0] || null,
  );
}

/** 事务行锁读取，供支付回调时复核状态。 */
export function findByIdForUpdate(executor, id) {
  return run(executor, 'SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]).then(
    (rows) => rows[0] || null,
  );
}

/** 条件置已支付：仅 pending 单可更新，rowCount=0 说明已被并发处理。 */
export function markPaid(executor = pool, id) {
  return run(
    executor,
    "UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1 AND status = 'pending'",
    [id],
  );
}

export function listByUser(executor = pool, userId) {
  return run(
    executor,
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC',
    [userId],
  );
}
