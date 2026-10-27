/* ============================================================
 * scenarios.js —— 探索情景（M2/M3 接口，M1 不实现 UI）
 *
 * 这里定义"未知变量"的元数据与合法取值域，但【不预设任何数值结论】。
 * 用户选择的区间代表"测试一种可能的世界"，不覆盖官方统计。
 *
 * 里程碑安排：
 *   M1 只定义结构 + 提供 core/uncertainty.js 的可复算纯函数（供测试）。
 *   M2 接入真实约束后，给第一个变量（园洲—东莞跨界活动强度）做区间实验。
 *   M3 做双世界 A/B 对照。
 *
 * 重要：本文件中的 low/mid/high 一律为 null（M1 不估计），
 * 任何后续填入都必须经 EVIDENCE_LEDGER 登记约束依据。
 * ============================================================ */

export const SCENARIO_VARIABLES = [
  {
    id: "yuanzhou_dongguan_crossflow",
    label: "园洲—东莞跨界活动流动强度",
    unit: "无量纲强度指数（演示）",
    nodePair: ["dg", "xwd"],
    groupsAffected: ["industry", "external"],
    /* 无量纲、明确标注为演示：仅用于验证"输入→重算→画面"链路，
       不代表通勤人数，也不输出"每天 X 万人"。 */
    dimension: "dimensionless",
    range: { low: null, mid: null, high: null },
    assumptionSource: "待 M2 接入交通/就业/人口约束后估计",
    dependencies: ["edge_weight", "reachability"],
    version: "v0.1-stub",
    status: "stub",
    note: "M1 接口桩；不提供任何具体人数结论。"
  }
];

/* 不确定性引擎的演示参数域（仅无量纲强度，0..1），
   让 core/uncertainty.js 的重算可被自动化测试验证。
   真实流量变量不在此范围。 */
export const DEMO_STRENGTH_DOMAIN = { min: 0, max: 1, defaultMid: 0.5 };
