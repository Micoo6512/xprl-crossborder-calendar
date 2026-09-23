/**
 * 会员定价方案（已定版，不可改）。
 * durationDays：月卡 30 天、年卡 365 天。
 */
export const PLANS = [
  {
    code: 'monthly',
    name: '月度会员',
    price: 9.9,
    durationDays: 30,
    tagline: '低门槛试用，随用随开',
  },
  {
    code: 'yearly',
    name: '年度会员',
    price: 89,
    durationDays: 365,
    tagline: '主推方案，折合每天仅 0.24 元',
    recommended: true,
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((plan) => [plan.code, plan]));

export function getPlan(code) {
  return PLAN_MAP[code];
}
