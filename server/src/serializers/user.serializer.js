import { formatDate, parseDate, today } from '../utils/dateUtils.js';
import { FREE_DAILY_JUMP_LIMIT } from '../constants/membership.js';

/**
 * 将 user 表行序列化为前端所需结构，并基于今日日期实时推导：
 * - 有效会员（到期日 ≥ 今天）
 * - 免费用户今日剩余跳转次数
 */
export function serializeUser(row) {
  if (!row) return null;

  const base = today();
  let isMember = false;
  if (row.membership_expire) {
    isMember = parseDate(row.membership_expire).valueOf() >= base.valueOf();
  }

  const countFresh = row.jump_count_date && formatDate(row.jump_count_date) === formatDate(base);
  const usedJumps = countFresh ? row.daily_jump_count : 0;

  return {
    id: row.id,
    account: row.account,
    registerTime: row.register_time,
    isMember,
    membershipStatus: isMember ? 'member' : row.membership_expire ? 'expired' : 'free',
    membershipExpire: row.membership_expire || null,
    jump: {
      usedToday: isMember ? null : usedJumps,
      remainingToday: isMember ? null : Math.max(0, FREE_DAILY_JUMP_LIMIT - usedJumps),
      dailyLimit: isMember ? null : FREE_DAILY_JUMP_LIMIT,
    },
  };
}
