/**
 * 一键搜索平台定义。
 * urlTemplate 使用 {kw} 占位符，运行时替换为按 encoding 编码后的关键词。
 * encoding 默认 utf-8；1688 搜索参数使用 GBK 编码（页面 charset=GBK）。
 */
import iconv from 'iconv-lite';

export const PLATFORMS = [
  { code: 'temu', name: 'Temu', group: 'cross', icon: 'temu', urlTemplate: 'https://www.temu.com/search_result.html?search_key={kw}' },
  { code: 'amazon', name: 'Amazon', group: 'cross', icon: 'amazon', urlTemplate: 'https://www.amazon.com/s?k={kw}' },
  { code: 'etsy', name: 'Etsy', group: 'cross', icon: 'etsy', urlTemplate: 'https://www.etsy.com/search?q={kw}' },
  { code: '1688', name: '1688', group: 'domestic', icon: '1688', encoding: 'gbk', urlTemplate: 'https://s.1688.com/selloffer/offer_search.htm?keywords={kw}' },
  { code: 'yiwugo', name: '义乌购', group: 'domestic', icon: 'yiwugo', urlTemplate: 'https://yiwugo.com/search?q={kw}' },
  { code: 'pddwholesale', name: '拼多多批发', group: 'domestic', icon: 'pdd', urlTemplate: 'https://pifa.pinduoduo.com/search?keyword={kw}' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((item) => [item.code, item]));

export function isValidPlatform(code) {
  return Boolean(PLATFORM_MAP[code]);
}

/**
 * 将字节缓冲区逐字节做百分号编码（用于 GBK 等非 UTF-8 编码的搜索参数）。
 * @param {Buffer} buffer
 * @returns {string}
 */
function percentEncodeBytes(buffer) {
  return Array.from(buffer, (byte) => `%${byte.toString(16).toUpperCase().padStart(2, '0')}`).join('');
}

/**
 * 生成平台搜索 URL：关键词按平台要求的字符集编码后填入模板。
 * @param {string} platformCode
 * @param {string} keyword
 */
export function buildPlatformUrl(platformCode, keyword) {
  const platform = PLATFORM_MAP[platformCode];
  if (!platform) return null;
  const encoded = platform.encoding === 'gbk'
    ? percentEncodeBytes(iconv.encode(keyword, 'gbk'))
    : encodeURIComponent(keyword);
  return platform.urlTemplate.replace('{kw}', encoded);
}
