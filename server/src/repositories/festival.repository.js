import { query } from '../db/pool.js';

/**
 * 查询日期区间内的节日，并按区域过滤。
 * 区域用 LIKE 做 OR 连接（regions 为逗号分隔字符串）。
 * @param {{ dateFrom: string, dateTo: string, regions: string[] }} options
 */
export async function findFestivalsInWindow({ dateFrom, dateTo, regions }) {
  const regionClauses = regions.map((_, i) => `POSITION($${i + 3} IN f.regions) > 0`);
  const whereSql = [
    'f.festival_date BETWEEN $1 AND $2',
    `(${regionClauses.join(' OR ')})`,
  ].join(' AND ');

  const sql = `
    SELECT f.*, COUNT(g.id) AS goods_count
    FROM festival f
    LEFT JOIN festival_goods g ON g.festival_id = f.id
    WHERE ${whereSql}
    GROUP BY f.id
    ORDER BY f.festival_date ASC, f.id ASC
  `;

  return query(sql, [dateFrom, dateTo, ...regions]);
}

export async function findFestivalById(id) {
  const rows = await query('SELECT * FROM festival WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findGoodsByFestivalId(festivalId) {
  return query(
    'SELECT * FROM festival_goods WHERE festival_id = $1 ORDER BY sort_order ASC, id ASC',
    [festivalId],
  );
}

export async function findGoodsById(id) {
  const rows = await query('SELECT * FROM festival_goods WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}
