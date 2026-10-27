/* ============================================================
 * meta.js —— 视觉语义与分组元数据（数据层）
 * 全息只是语言，数据才是世界的骨架。
 * 颜色 / 线型 / 大小均有明确含义，禁止"为好看而发光"。
 * ============================================================ */

/* 8 类主体类型（沿用原版 network.html 的 type 口径，色相一致、亮度提升为全息霓虹） */
export const TYPE_META = {
  eco:       { label: "生态底座",     color: 0x38bdf8, r: 1.75 },
  anchor:    { label: "链主企业",     color: 0x34d399, r: 1.45 },
  champ:     { label: "小巨人（聚合）", color: 0x22d3ee, r: 1.28 },
  capillary: { label: "产业群落（聚合）", color: 0x8aa0bd, r: 1.08 },
  legacy:    { label: "老厂基盘（聚合）", color: 0xfbb247, r: 1.32 },
  agri:      { label: "农业康养",     color: 0xa3e635, r: 0.92 },
  gi:        { label: "国家地理标志",  color: 0xfbbf24, r: 0.82 },
  ext:       { label: "外部城市",     color: 0xc4b5fd, r: 1.18 }
};

/* 聚合型节点：代表一类主体的集合（非单一企业），用虚线外环区分 */
export const CLUSTER_TYPES = new Set(["champ", "capillary", "legacy"]);

/* 五大星群（导航 / 语义分组，非真实地理分区）
 * 注意：这是帮助用户建立心智模型的语义聚类，不是博罗的五个行政区。
 * M1 以"产业制造"为可深入样板；生活/文旅/农业节点将随 life.json 在 M2 充实。 */
export const GROUPS = [
  { id: "industry", label: "产业制造",   color: 0x34d399, hint: "链主 · 小巨人 · 产业群落 · 老厂基盘" },
  { id: "living",   label: "城镇生活",   color: 0x38bdf8, hint: "水源与城镇生活底座（M2 接入生活数据）" },
  { id: "tourism",  label: "山水文旅康养", color: 0x5fd0c5, hint: "环两山 · 户外 · 中医药康养" },
  { id: "agri",     label: "农业乡村",   color: 0xfbbf24, hint: "地理标志 · 特色农品" },
  { id: "external", label: "外部联系",   color: 0xc4b5fd, hint: "广莞深惠 · 产业外溢与客源" }
];
export const GROUP_META = Object.fromEntries(GROUPS.map(g => [g.id, g]));

/* 证据等级 → 视觉语法（四级：A 观测 / B 推断 / C 假设 / D 未知）
 * 这是项目最核心的视觉纪律，渲染层必须严格遵守。 */
export const LEVEL_META = {
  A: { label: "直接观测 · 公开硬数据", line: "solid",  opacity: 0.92, note: "统计公报 / 工商注册 / 政府公开材料可核验" },
  B: { label: "交叉推断 · 合理假设",   line: "solid",  opacity: 0.32, note: "基于行业代码、投入产出与公开资料的推断关系" },
  C: { label: "待核实 · 弱证据",       line: "dashed", opacity: 0.55, note: "仅有方向性线索，尚待独立来源证实" },
  D: { label: "未知 · 暂无数据",       line: "none",   opacity: 0.0,  note: "证据不足，显示为空心/未完成，不以光效补齐" }
};

/* 关系类型配色（边色） */
export const KIND_META = {
  "供应链":   { color: 0x4db8ff, label: "供应链 / 产业配套" },
  "环保约束": { color: 0xef4444, label: "环保硬约束" },
  "资源竞争": { color: 0xf59e0b, label: "资源 / 空间竞争" },
  "生态补偿": { color: 0x38bdf8, label: "生态补偿 / 康养对流" }
};

/* 三种线的语义（严禁混用）：
 *  - 关系线 relation：证明两主体存在联系（无方向、无数量）
 *  - 流向线 flowDir：有方向证据（静态方向标识，暂无）
 *  - 流量线 flowVol：有数量口径（线宽/脉冲映射规模，暂无）
 * M1 的 30 条边全部是"关系线"，不是流量线。 */
export const LINE_SEMANTICS = {
  relation: "关系线：仅表达存在联系，不代表流向与流量",
  flowDir:  "流向线：有方向证据（M2 起，待接入）",
  flowVol:  "流量线：有数量口径（M3 起，需真实数据）"
};
