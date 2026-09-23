import * as festivalRepo from '../repositories/festival.repository.js';
import {
  addDays,
  formatDate,
  parseDate,
  today,
} from '../dateUtils.js';
import { FESTIVAL_WINDOW, PREP_DAYS_OPTIONS, DEFAULT_PREP_DAYS } from '../constants/membership.js';
import AppError from '../appError.js';
import { buildViewer, resolveEffectiveRegions, canViewAllGoods } from './permission.service.js';
import {
  serializeFestivalListItem,
  serializeFestivalDetail,
} from '../serializers/festival.serializer.js';

function normalizePrepDays(value) {
  if (value === undefined || value === '') return DEFAULT_PREP_DAYS;
  const parsed = Number(value);
  if (!PREP_DAYS_OPTIONS.includes(parsed)) {
    throw AppError.badRequest('备货周期仅支持 30 或 45 天', 'INVALID_PREP_DAYS');
  }
  return parsed;
}

/**
 * 基准日期：默认服务器今日，允许用户自定义（格式 YYYY-MM-DD），
 * 仅允许在今日前后 2 年内。
 */
function normalizeBaseDate(value) {
  if (value === undefined || value === '') return today();

  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw AppError.badRequest('基准日期格式应为 YYYY-MM-DD', 'INVALID_BASE_DATE');
  }

  const parsed = parseDate(text);
  if (!parsed.isValid() || formatDate(parsed) !== text) {
    throw AppError.badRequest('基准日期不是有效日期', 'INVALID_BASE_DATE');
  }

  const offset = parsed.diff(today(), 'day');
  if (Math.abs(offset) > 730) {
    throw AppError.badRequest('基准日期仅支持今日前后 2 年内', 'INVALID_BASE_DATE');
  }
  return parsed;
}

function parseRegionParam(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * 节日列表：基准日 + 30/60 天窗口，按倒计时升序。
 */
export async function listFestivals(queryParams, jwtPayload) {
  const prepDays = normalizePrepDays(queryParams.prepDays);
  const base = normalizeBaseDate(queryParams.baseDate);
  const viewer = await buildViewer(jwtPayload);
  const regions = resolveEffectiveRegions(parseRegionParam(queryParams.regions), viewer);

  if (!regions.length) return [];

  const rows = await festivalRepo.findFestivalsInWindow({
    dateFrom: formatDate(addDays(base, FESTIVAL_WINDOW.minDays)),
    dateTo: formatDate(addDays(base, FESTIVAL_WINDOW.maxDays)),
    regions,
  });

  return rows.map((row) => serializeFestivalListItem(row, prepDays, base));
}

/**
 * 节日详情：免费用户商品减半，会员全部可见。
 */
export async function getFestivalDetail(id, queryParams, jwtPayload) {
  const prepDays = normalizePrepDays(queryParams.prepDays);
  const base = normalizeBaseDate(queryParams.baseDate);
  const viewer = await buildViewer(jwtPayload);

  const festival = await festivalRepo.findFestivalById(id);
  if (!festival) throw AppError.notFound('节日不存在', 'FESTIVAL_NOT_FOUND');

  // 免费/访客无权访问受限区域节日
  if (!viewer.isMember) {
    const accessible = festival.regions
      .split(',')
      .some((code) => code === 'NA' || code === 'EU');
    if (!accessible) throw AppError.forbidden('升级会员后可查看该区域节日', 'REGION_LOCKED');
  }

  const goodsRows = await festivalRepo.findGoodsByFestivalId(id);
  return serializeFestivalDetail(festival, goodsRows, canViewAllGoods(viewer), prepDays, base);
}
