import dayjs from 'dayjs';
import { FESTIVAL_WINDOW } from './constants/membership.js';

/**
 * 纯日期工具：所有比较均基于当天 00:00 的「日期」语义，
 * 不引入时分秒，避免边界漂移。
 */
export function today() {
  return dayjs().startOf('day');
}

export function parseDate(value) {
  return dayjs(value).startOf('day');
}

export function formatDate(value, pattern = 'YYYY-MM-DD') {
  return dayjs(value).format(pattern);
}

/**
 * 目标日期距基准日期的天数（目标 - 基准）。
 * @param {string|dayjs.Dayjs} target
 * @param {string|dayjs.Dayjs} [base]
 */
export function daysUntil(target, base = today()) {
  return parseDate(target).diff(parseDate(base), 'day');
}

/** 日期加 n 天 */
export function addDays(value, days) {
  return parseDate(value).add(days, 'day');
}

/** 日期减 n 天 */
export function subtractDays(value, days) {
  return parseDate(value).subtract(days, 'day');
}

/**
 * 是否落在节日展示窗口：minDays ≤ 距今天数 ≤ maxDays（闭区间）。
 */
export function isInFestivalWindow(target, base = today()) {
  const days = daysUntil(target, base);
  return days >= FESTIVAL_WINDOW.minDays && days <= FESTIVAL_WINDOW.maxDays;
}

/**
 * 最晚备货截止日 = 节日日期 − 备货天数。
 * @returns {dayjs.Dayjs}
 */
export function deadlineOf(festivalDate, prepDays) {
  return subtractDays(festivalDate, prepDays);
}
