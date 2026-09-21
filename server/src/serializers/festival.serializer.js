import {
  daysUntil,
  deadlineOf,
  formatDate,
  parseDate,
  today,
} from '../utils/dateUtils.js';
import { REGION_NAME_MAP } from '../constants/regions.js';
import { DEADLINE_URGENT_DAYS } from '../constants/membership.js';

/**
 * 节日列表卡片序列化：倒计时、备货截止日及其紧急程度。
 */
export function serializeFestivalListItem(row, prepDays, base = today()) {
  const deadline = deadlineOf(row.festival_date, prepDays);
  const deadlineDaysFromToday = daysUntil(deadline, base);

  return {
    id: row.id,
    name: row.name,
    enName: row.en_name,
    festivalDate: formatDate(row.festival_date),
    year: row.year,
    regions: row.regions.split(',').map((code) => ({ code, name: REGION_NAME_MAP[code] })),
    daysUntil: daysUntil(row.festival_date, base),
    prepDays,
    deadline: formatDate(deadline),
    deadlineUrgent: deadlineDaysFromToday <= DEADLINE_URGENT_DAYS,
    goodsCount: Number(row.goods_count),
    intro: row.intro,
    advice: row.advice,
  };
}

/**
 * 单条商品序列化。
 */
export function serializeGoods(row) {
  return {
    id: row.id,
    festivalId: row.festival_id,
    name: row.goods_name,
    enKeyword: row.en_keyword,
    priority: row.priority,
    sortOrder: row.sort_order,
  };
}

/**
 * 节日详情序列化：商品按可见/锁定拆分（免费用户减半）。
 * @param {object} festivalRow
 * @param {object[]} goodsRows
 * @param {boolean} canViewAllGoods
 */
export function serializeFestivalDetail(festivalRow, goodsRows, canViewAllGoods, prepDays, base = today()) {
  const allGoods = goodsRows.map(serializeGoods);
  const visibleCount = canViewAllGoods
    ? allGoods.length
    : Math.ceil(allGoods.length / 2);

  return {
    ...serializeFestivalListItem(festivalRow, prepDays, base),
    goodsCount: allGoods.length,
    goods: allGoods.slice(0, visibleCount),
    lockedGoodsCount: allGoods.length - visibleCount,
  };
}

export { parseDate };
