/**
 * 节日窗口与会员权限常量（硬性业务规则）。
 */
export const FESTIVAL_WINDOW = {
  minDays: 30,
  maxDays: 60,
};

export const PREP_DAYS_OPTIONS = [30, 45];
export const DEFAULT_PREP_DAYS = 30;

export const FREE_DAILY_JUMP_LIMIT = 2;

/** 备货截止日紧急高亮阈值（距截止日 ≤ 7 天） */
export const DEADLINE_URGENT_DAYS = 7;

export const MEMBERSHIP_STATUS = {
  FREE: 'free',
  MEMBER: 'member',
  EXPIRED: 'expired',
};
