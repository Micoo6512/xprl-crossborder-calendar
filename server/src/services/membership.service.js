import { addDays, formatDate, parseDate, today } from '../utils/dateUtils.js';

/**
 * 在事务内开通/叠加会员。
 * 基准日 = max(今日, 当前有效到期日)，再叠加 durationDays。
 * @param {import('pg').PoolClient} conn
 * @param {number} userId
 * @param {number} durationDays
 * @returns {Promise<string>} 新到期日 YYYY-MM-DD
 */
export async function activateMembership(conn, userId, durationDays) {
  const { rows } = await conn.query('SELECT * FROM "user" WHERE id = $1 FOR UPDATE', [userId]);
  const userRow = rows[0];

  const base = today();
  const currentExpire = userRow.membership_expire ? parseDate(userRow.membership_expire) : null;
  const startFrom = currentExpire && currentExpire.valueOf() >= base.valueOf() ? currentExpire : base;
  const newExpire = addDays(startFrom, durationDays);
  const expireText = formatDate(newExpire);

  await conn.query(
    'UPDATE "user" SET membership_status = $1, membership_expire = $2 WHERE id = $3',
    ['member', expireText, userId],
  );

  return expireText;
}
