import { query } from '../db.js';

export function findByAccount(account) {
  return query('SELECT * FROM "user" WHERE account = ? LIMIT 1', [account]).then((rows) => rows[0] || null);
}

export function findById(id) {
  return query('SELECT * FROM "user" WHERE id = ? LIMIT 1', [id]).then((rows) => rows[0] || null);
}

export function createUser(account, passwordHash) {
  return query(
    'INSERT INTO "user" (account, password_hash) VALUES (?, ?) RETURNING id',
    [account, passwordHash],
  ).then((rows) => ({ id: rows[0].id }));
}

/**
 * 更新当日跳转计数。
 */
export function updateJumpCount(userId, count, countDate) {
  return query(
    'UPDATE "user" SET daily_jump_count = ?, jump_count_date = ? WHERE id = ?',
    [count, countDate, userId],
  );
}

/**
 * 原子递增免费用户当日跳转次数：
 * - 计数日期不是今天：计数重置为 1（跨日自动恢复）
 * - 计数日期为今天：+1，且仅当 < 2 时允许
 * 返回受影响行数；为 0 表示已达当日限额。
 *
 * 用 RETURNING id 后以返回行数判断是否更新成功（D1 结果同样以行数组为准）。
 */
export async function incrementFreeJumpCount(userId, countDate) {
  const rows = await query(
    `UPDATE "user"
     SET daily_jump_count = CASE WHEN jump_count_date = ? THEN daily_jump_count + 1 ELSE 1 END,
         jump_count_date = ?
     WHERE id = ?
       AND (jump_count_date IS NULL OR jump_count_date <> ? OR daily_jump_count < ?)
     RETURNING id`,
    [countDate, countDate, userId, countDate, 2],
  );
  return rows.length;
}

/**
 * 更新会员状态与到期日。
 */
export function updateMembership(userId, status, expireDate) {
  return query(
    'UPDATE "user" SET membership_status = ?, membership_expire = ? WHERE id = ?',
    [status, expireDate, userId],
  );
}

/**
 * 更新登录密码（参数为 bcrypt 哈希）。
 */
export function updatePassword(userId, passwordHash) {
  return query('UPDATE "user" SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}
