import * as festivalRepo from '../repositories/festival.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { buildViewer } from './permission.service.js';
import { isValidPlatform, buildPlatformUrl, PLATFORM_MAP } from '../constants/platforms.js';
import { FREE_DAILY_JUMP_LIMIT } from '../constants/membership.js';
import { formatDate, today } from '../utils/dateUtils.js';
import AppError from '../utils/AppError.js';

/**
 * 一键搜索跳转：服务端统一鉴权、限额并生成编码后的平台搜索 URL。
 * 跨境平台（Temu/Amazon/Etsy）使用英文关键词；
 * 国内进货平台（1688/义乌购/拼多多批发）使用商品中文名称。
 * @param {{goodsId:number, platform:string}} payload
 * @param {{id:number}|null} jwtPayload
 */
export async function createSearchJump(payload, jwtPayload) {
  const viewer = await buildViewer(jwtPayload);
  if (viewer.isVisitor) {
    throw AppError.unauthorized('登录后即可使用一键搜索（免费用户每日 2 次）', 'LOGIN_REQUIRED');
  }

  const { goodsId, platform } = payload;
  if (!isValidPlatform(platform)) {
    throw AppError.badRequest('不支持的平台', 'INVALID_PLATFORM');
  }

  const goods = await festivalRepo.findGoodsById(goodsId);
  if (!goods) throw AppError.notFound('商品不存在', 'GOODS_NOT_FOUND');

  // 按平台类型选择搜索词：跨境 → 英文关键词；国内进货 → 中文名称
  const searchKeyword = PLATFORM_MAP[platform].group === 'domestic'
    ? goods.goods_name
    : goods.en_keyword;
  const searchUrl = buildPlatformUrl(platform, searchKeyword);

  // 防御越权：免费用户不能通过猜测 goodsId 访问受限区域商品
  if (!viewer.isMember) {
    const festival = await festivalRepo.findFestivalById(goods.festival_id);
    const accessible = festival?.regions
      .split(',')
      .some((code) => code === 'NA' || code === 'EU');
    if (!accessible) throw AppError.forbidden('升级会员后可搜索该区域商品', 'REGION_LOCKED');

    const countDate = formatDate(today());
    const affected = await userRepo.incrementFreeJumpCount(viewer.user.id, countDate);
    if (affected === 0) {
      throw AppError.forbidden('今日免费跳转次数（2 次）已用完，升级会员无限次搜索', 'JUMP_LIMIT');
    }

    const updated = await userRepo.findById(viewer.user.id);
    const remaining = Math.max(0, FREE_DAILY_JUMP_LIMIT - updated.daily_jump_count);
    return { url: searchUrl, keyword: searchKeyword, platform, remaining };
  }

  return { url: searchUrl, keyword: searchKeyword, platform, remaining: null };
}
