import { query, d1 } from '../db.js';

/**
 * 订单数据访问。所有方法均走 D1 绑定，返回行数组。
 */

/** 插入待支付订单，返回新订单 id。并发重复由部分唯一索引拦截。 */
export async function insertOrder(userId, planCode, amount) {
  const rows = await query(
    "INSERT INTO orders (user_id, plan_code, amount, status) VALUES (?, ?, ?, 'pending') RETURNING id",
    [userId, planCode, amount],
  );
  return rows[0].id;
}

/** 查该用户该方案当前的待支付订单（用于幂等复用）。 */
export async function findPending(userId, planCode) {
  const rows = await query(
    "SELECT * FROM orders WHERE user_id = ? AND plan_code = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
    [userId, planCode],
  );
  return rows[0] || null;
}

export async function findById(id) {
  const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * 支付并开通会员——d1.batch() 在单个事务内原子执行两条语句：
 *   1) 仅当订单仍为 pending 时置为 paid（条件更新，天然幂等）；
 *   2) 仅当订单是【本次请求刚被置为 paid】（paid_at = 本请求时间戳）时，
 *      更新该用户的会员到期日：基准日 = max(今天, 当前到期日)，再叠加天数。
 *
 * 并发/重复回调场景：
 *   - 订单已被其他请求支付 → 语句 1 命中 0 行；
 *   - paid_at 是别次请求的时间戳 → 语句 2 的 EXISTS 不成立，命中 0 行。
 * 绝不多送会员。
 *
 * @param {number} orderId
 * @param {number} userId
 * @param {number} durationDays
 * @param {string} paidAt 本请求的支付时间（'YYYY-MM-DD HH:MM:SS'，UTC），
 *   两语句共享同一时间戳以建立「本次支付」关联。
 * @returns {Promise<Array<{expire: string}>>} 首次支付命中 1 行；已处理则 []
 */
export function payAndGrant(orderId, userId, durationDays, paidAt) {
  const db = d1();
  return db.batch([
    db
      .prepare(
        "UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'pending' RETURNING id, user_id",
      )
      .bind(paidAt, orderId),
    db
      .prepare(
        `UPDATE "user"
         SET membership_status = 'member',
             membership_expire = CASE
               WHEN membership_expire IS NULL OR date(membership_expire) < date('now')
                 THEN date('now', '+' || ? || ' days')
               ELSE date(membership_expire, '+' || ? || ' days')
             END
         WHERE id = ?
           AND EXISTS (
             SELECT 1 FROM orders
              WHERE id = ? AND status = 'paid' AND paid_at = ?
           )
         RETURNING membership_expire AS expire`,
      )
      .bind(durationDays, durationDays, userId, orderId, paidAt),
  ]).then((results) => results[1].results);
}
