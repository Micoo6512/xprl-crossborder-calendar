import { query } from '../db/pool.js';

export function findByAccount(account) {
  return query('SELECT * FROM "user" WHERE account = $1 LIMIT 1', [account]).then((rows) => rows[0] || null);
}

export function findById(id) {
  return query('SELECT * FROM "user" WHERE id = $1 LIMIT 1', [id]).then((rows) => rows[0] || null);
}

export function createUser(account, passwordHash) {
  return query(
    'INSERT INTO "user" (account, password_hash) VALUES ($1, $2) RETURNING id',
    [account, passwordHash],
  ).then((rows) => ({ id: rows[0].id }));
}

/**
 * 更新当日跳转计数。
 */
export function updateJumpCount(userId, count, countDate) {
  return query(
    'UPDATE "user" SET daily_jump_count = $1, jump_count_date = $2 WHERE id = $3',
    [count, countDate, userId],
  );
}

/**
 * 原子递增免费用户当日跳转次数：
 * - 计数日期不是今天：计数重置为 1（跨日自动恢复）
 * - 计数日期为今天：+1，且仅当 < 2 时允许
 * 返回受影响行数；为 0 表示已达当日限额。
 */
export function incrementFreeJumpCount(userId, countDate) {
  return query(
    `UPDATE "user"
     SET daily_jump_count = CASE WHEN jump_count_date = $1 THEN daily_jump_count + 1 ELSE 1 END,
         jump_count_date = $1
     WHERE id = $2
       AND (jump_count_date IS NULL OR jump_count_date <> $1 OR daily_jump_count < $3)`,
    [countDate, userId, 2],
  ).then((result) => result.rowCount);
}

/**
 * 更新会员状态与到期日。
 */
export function updateMembership(userId, status, expireDate) {
  return query(
    'UPDATE "user" SET membership_status = $1, membership_expire = $2 WHERE id = $3',
    [status, expireDate, userId],
  );
}

/**
 * 更新登录密码（参数为 bcrypt 哈希）。
 */
export function updatePassword(userId, passwordHash) {
  return query('UPDATE "user" SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}
