/* ============================================================
 * flows.js —— 流量（有方向、有数量的流动）
 *
 * 【M1 现状：空数组。这是有意为之，不是遗漏。】
 * 公开资料中没有可核验的镇际 / 跨界人员、货物、资金流动矩阵。
 * network.html 的关系权重 w 只代表"结构权重/证据强度"，
 * 绝不能把它换算成"每天 X 万人、X 万吨货、X 亿元资金"。
 *
 * 只有当取得带统计口径的真实数据（道路断面、就业人口、
 * 匿名聚合通勤、游客来源地等）并通过证据约束后，才允许新增 Flow。
 *
 * Flow 字段规范（DATA_DICTIONARY.md）：
 *   origin, destination : 端点节点 id
 *   flowType            : people / freight / capital / info / tourist
 *   value               : 数值（与 range 二选一）
 *   range               : { low, high }（带约束的区间）
 *   unit                : 单位（人/日、吨/年、亿元/年 …）
 *   timeWindow          : 统计时段（如 2026 年工作日日均）
 *   method              : 推断方法与约束（区间分析 / 网络流约束 / 贝叶斯）
 *   evidenceLevel       : A / B / C
 *   sourceRefs          : 可追溯来源
 *   isHypothesis        : true 表示用户探索假设（非事实）
 * ============================================================ */

export const FLOWS = [];

export const FLOW_TYPES = {
  people: "人员 / 通勤流动",
  tourist: "游客来源与去向",
  freight: "物流",
  capital: "资金",
  info: "信息 / 技术传播"
};
