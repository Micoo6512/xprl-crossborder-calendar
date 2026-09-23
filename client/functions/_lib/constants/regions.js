/**
 * 区域编码与中文名称（跨境专用五大区域）。
 */
export const REGIONS = [
  { code: 'NA', name: '北美', desc: '美国、加拿大' },
  { code: 'EU', name: '欧洲', desc: '欧盟、英国' },
  { code: 'ME', name: '中亚中东', desc: '中亚五国、沙特、阿联酋等穆斯林区域' },
  { code: 'SEA', name: '东南亚', desc: '泰国、越南、新加坡、马来西亚、印尼、菲律宾' },
  { code: 'LATAM', name: '拉美', desc: '巴西、墨西哥' },
];

export const REGION_CODES = REGIONS.map((item) => item.code);

export const REGION_NAME_MAP = Object.fromEntries(REGIONS.map((item) => [item.code, item.name]));

/** 免费用户开放的区域 */
export const FREE_REGION_CODES = ['NA', 'EU'];

export function isValidRegion(code) {
  return REGION_CODES.includes(code);
}

export function regionNames(codes) {
  return codes.map((code) => REGION_NAME_MAP[code]).filter(Boolean);
}
