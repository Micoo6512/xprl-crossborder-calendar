/**
 * 平台展示元信息（与后端 platform code 对应）。
 * color：品牌色；letter：图标占位字母。
 */
export const PLATFORMS = [
  { code: 'temu', name: 'Temu', group: 'cross', color: '#fb7701', letter: 'T' },
  { code: 'amazon', name: 'Amazon', group: 'cross', color: '#131921', letter: 'a' },
  { code: 'etsy', name: 'Etsy', group: 'cross', color: '#f1641e', letter: 'E' },
  { code: '1688', name: '1688', group: 'domestic', color: '#ff6a00', letter: '阿' },
  { code: 'yiwugo', name: '义乌购', group: 'domestic', color: '#e4393c', letter: '义' },
  { code: 'pddwholesale', name: '拼多多批发', group: 'domestic', color: '#e02e24', letter: '拼' },
];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((item) => [item.code, item]),
);
