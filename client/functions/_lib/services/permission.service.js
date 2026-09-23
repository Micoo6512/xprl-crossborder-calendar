import * as userRepo from '../repositories/user.repository.js';
import { parseDate, today } from '../dateUtils.js';
import { REGION_CODES, FREE_REGION_CODES, isValidRegion } from '../constants/regions.js';

/**
 * 基于 JWT 载荷构建访问者上下文。
 * 会员身份以数据库到期时间为准（不信任 Token 中的状态）。
 * @param {{id:number}|null} jwtPayload
 */
export async function buildViewer(jwtPayload) {
  if (!jwtPayload) return { user: null, isMember: false, isVisitor: true };

  const user = await userRepo.findById(jwtPayload.id);
  if (!user) return { user: null, isMember: false, isVisitor: true };

  const base = today();
  const isMember = Boolean(
    user.membership_expire && parseDate(user.membership_expire).valueOf() >= base.valueOf(),
  );

  return { user, isMember, isVisitor: false };
}

/**
 * 计算实际可访问区域：
 * - 会员：用户选择（未选 = 全部五大区域）
 * - 免费/访客：强制收敛到免费区域（NA/EU）
 * @param {string[]} selectedRegions
 */
export function resolveEffectiveRegions(selectedRegions, viewer) {
  const wanted = selectedRegions.length ? selectedRegions : REGION_CODES;
  const allowed = wanted.filter(isValidRegion);
  if (viewer.isMember) return allowed;
  return allowed.filter((code) => FREE_REGION_CODES.includes(code));
}

/** 是否可查看完整商品清单（仅会员） */
export function canViewAllGoods(viewer) {
  return viewer.isMember;
}
