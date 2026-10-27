/* ============================================================
 * observations.js —— 观测值（真实统计，A 级）
 * 全县级关键体征。字段口径见 DATA_DICTIONARY.md。
 * 来源：2025 年博罗统计公报、2026 年政府工作报告、2026 年 1-8 月经济简析；
 * 原版 bl-viz/data.js 已带 BL_SRC 官方链接，此处复用其口径。
 *
 * 注意：这些是"全县级"数据，不可下分到没有镇级数据的单个镇街
 * （例如全县 1-8 月工业投资 -46.7%，不能让园洲或石湾据此变色）。
 * ============================================================ */

export const OBSERVATIONS = [
  { metric: "GDP", value: 1005.45, unit: "亿元", yoy: 5.5, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年博罗县国民经济和社会发展统计公报",
    url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html", note: "广东首个千亿县" },
  { metric: "三次产业结构", value: "10.7 : 54.6 : 34.7", unit: "占比%", yoy: null, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html", note: "一/二/三产" },
  { metric: "人均GDP", value: 81757, unit: "元", yoy: null, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "常住人口", value: 123.9, unit: "万人", yoy: null, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "who.html 引统计公报（城镇化率60.2%）", url: null, note: "城镇74.6万/农村49.3万" },
  { metric: "规上工业增加值", value: null, unit: "同比%", yoy: 8.7, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报（电子设备+23.0%）", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "固定资产投资", value: null, unit: "同比%", yoy: -18.8, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报（工业投资-12.7%、房地产-47.6%）", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "社会消费品零售总额", value: 296.99, unit: "亿元", yoy: 3.9, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "外贸进出口", value: 402.59, unit: "亿元", yoy: 26.1, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "游客接待量", value: 1028.09, unit: "万人次", yoy: 11.7, period: "2025年", geography: "博罗县",
    verificationStatus: "A", source: "2025年统计公报（旅游收入51.88亿/+19.1%）", url: "https://www.boluo.gov.cn/zwgk/zwdt/bmdt/content/post_5712218.html" },
  { metric: "规上工业增加值", value: null, unit: "同比%", yoy: 8.9, period: "2026年1-8月", geography: "博罗县",
    verificationStatus: "A", source: "2026年1-8月经济运行简析（高技术制造+11.1%）", url: null, note: "月度，勿与全年混用" },
  { metric: "工业投资", value: null, unit: "同比%", yoy: -46.7, period: "2026年1-8月", geography: "博罗县",
    verificationStatus: "A", source: "2026年1-8月经济运行简析（固投整体-34.1%）", url: null, note: "县级口径，禁止下分到镇" }
];
