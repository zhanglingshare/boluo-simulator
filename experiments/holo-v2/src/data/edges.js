/* ============================================================
 * edges.js —— 30 条关系（真实 / 推断 / 待核实）
 * 数据来源：原版 network.html 的 rawEdges（A/B/C + w + kind 原样保留）。
 *
 * 【关键纪律】这 30 条全部是"关系线（relation）"，不是"流量线"：
 *   - direction 一律 "undirected"：M1 不掌握任何经过验证的流向 / 数量证据；
 *   - weight(w,1-5) 是"结构权重 / 证据强度"，weightType 已标明，
 *     严禁把它当作物流量、资金量或通勤人数去驱动"真实流量"。
 *   - 真实 Flow 一律走 flows.js；flows.js 当前为空。
 * ============================================================ */

const SR = ["network.html"];
const TS = "2026年公开资料";

export const EDGES = [
  /* —— 供应链 / 产业配套 —— */
  { source: "dg", target: "mj",  relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 5, weightType: "structural",
    description: "隔东江与东莞石龙相望·模具厂迁入（天倬东莞50亩→石湾150亩）", sourceRefs: SR, timeScope: TS },
  { source: "dg", target: "ddc", relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 4, weightType: "structural",
    description: "台铃/小刀等电动车厂从东莞方向落户石湾", sourceRefs: SR, timeScope: TS },
  { source: "dg", target: "htd", relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 4, weightType: "structural",
    description: "园洲/石湾承接东莞电子信息外溢·园洲年产值380亿", sourceRefs: SR, timeScope: TS },
  { source: "dg", target: "lq",  relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "五金/塑料小厂随边界扩散", sourceRefs: SR, timeScope: TS },
  { source: "sz", target: "xwd", relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 4, weightType: "structural",
    description: "欣旺达深圳总部·锂威园洲生产基地", sourceRefs: SR, timeScope: TS },
  { source: "sz", target: "jq",  relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 4, weightType: "structural",
    description: "深博福田产业园25宗项目·总投资54亿·产值超100亿", sourceRefs: SR, timeScope: TS },
  { source: "gz", target: "mj",  relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "石湾西北毗邻增城·三市交界承接外溢", sourceRefs: SR, timeScope: TS },
  { source: "mj", target: "ddc", relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 2, weightType: "structural",
    description: "模具零部件", sourceRefs: SR, timeScope: TS },
  { source: "bmc", target: "ddc", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "喷涂配套", sourceRefs: SR, timeScope: TS },
  { source: "jf", target: "htd", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "靶材供应", sourceRefs: SR, timeScope: TS },
  { source: "gj", target: "htd", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "精密配套", sourceRefs: SR, timeScope: TS },
  { source: "sj", target: "lq",  relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "技术升级", sourceRefs: SR, timeScope: TS },
  { source: "xwd", target: "mj", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "电池结构件", sourceRefs: SR, timeScope: TS },
  { source: "jq", target: "ddc", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "汽车零部件", sourceRefs: SR, timeScope: TS },
  { source: "lq", target: "htd", relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "五金配套", sourceRefs: SR, timeScope: TS },

  /* —— 环保硬约束 —— */
  { source: "dj", target: "bmc", relationType: "环保约束", direction: "undirected", evidenceLevel: "A", weight: 3, weightType: "structural",
    description: "排污上限约束", sourceRefs: SR, timeScope: TS },
  { source: "dj", target: "bss", relationType: "环保约束", direction: "undirected", evidenceLevel: "A", weight: 3, weightType: "structural",
    description: "饮用水源", sourceRefs: SR, timeScope: TS },
  { source: "dj", target: "lq",  relationType: "环保约束", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "沿江工业约束", sourceRefs: SR, timeScope: TS },

  /* —— 资源 / 空间竞争 —— */
  { source: "xwd", target: "lq", relationType: "资源竞争", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "用电/用地竞争", sourceRefs: SR, timeScope: TS },
  { source: "htd", target: "lq", relationType: "资源竞争", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "腾笼换鸟", sourceRefs: SR, timeScope: TS },

  /* —— 生态补偿 / 康养对流 —— */
  { source: "lswh", target: "lfsgy", relationType: "生态补偿", direction: "undirected", evidenceLevel: "A", weight: 3, weightType: "structural",
    description: "文旅+医药", sourceRefs: SR, timeScope: TS },
  { source: "lswh", target: "hh",   relationType: "生态补偿", direction: "undirected", evidenceLevel: "A", weight: 2, weightType: "structural",
    description: "户外运动", sourceRefs: SR, timeScope: TS },
  { source: "lswh", target: "sc",   relationType: "生态补偿", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "茶旅融合", sourceRefs: SR, timeScope: TS },
  { source: "lswh", target: "lsz",  relationType: "生态补偿", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "荔枝采摘", sourceRefs: SR, timeScope: TS },
  { source: "gz", target: "lfsgy",  relationType: "生态补偿", direction: "undirected", evidenceLevel: "C", weight: 2, weightType: "structural",
    description: "省中医院合作（待核实）", sourceRefs: SR, timeScope: TS },
  { source: "hz", target: "lswh",   relationType: "生态补偿", direction: "undirected", evidenceLevel: "B", weight: 2, weightType: "structural",
    description: "文旅客流+行政", sourceRefs: SR, timeScope: TS },

  /* —— 农业 / 水利（关系类型按原版归为供应链）—— */
  { source: "dj", target: "lsmd",  relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "灌溉", sourceRefs: SR, timeScope: TS },
  { source: "gyght", target: "gyg", relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 1, weightType: "structural",
    description: "观音阁同镇", sourceRefs: SR, timeScope: TS },
  { source: "gyg", target: "dj",   relationType: "供应链", direction: "undirected", evidenceLevel: "B", weight: 1, weightType: "structural",
    description: "东江沙壤", sourceRefs: SR, timeScope: TS },
  { source: "zw", target: "xwd",   relationType: "供应链", direction: "undirected", evidenceLevel: "A", weight: 2, weightType: "structural",
    description: "铜杆→电池（产业链上下游）", sourceRefs: SR, timeScope: TS }
];
