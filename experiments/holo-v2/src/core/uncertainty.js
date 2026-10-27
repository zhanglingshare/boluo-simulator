/* ============================================================
 * uncertainty.js —— 情报推断 / 不确定性实验（纯函数，确定性）
 *
 * 这是 M2/M3 的计算内核，M1 先交付"可被测试的纯函数"，不接 UI。
 *
 * 科学底线（务必保留）：
 *  1. 本模块使用的是【无量纲联系强度】，明确标记为演示，
 *     绝不输出"每天 X 万人通勤"之类的虚构人数；
 *  2. 经济/活动联系只沿"供应链、资源竞争"两类边传播
 *     （环保/生态边不参与经济活动传导，沿用原版设定）；
 *  3. A 级硬关系在任何情景下都保留基线，B/C 级更依赖情景；
 *  4. 相同输入必须得到相同结果（无随机）；
 *  5. 用户选择的是"测试一种可能的世界"，不覆盖任何官方统计。
 * ============================================================ */

import { NODES, EDGES } from "../data/index.js";

/* 可沿经济/活动联系传导的关系类型 */
const TRANSMISSIBLE = new Set(["供应链", "资源竞争"]);

/* 每跳衰减（沿路径越远，影响越弱） */
const DECAY = 0.85;

/* 证据等级的"情景地板"：A 级联系即便低情景也存在，C 级几乎全靠情景 */
const LEVEL_FLOOR = { A: 0.6, B: 0.3, C: 0.15 };

/* 演示档位（无量纲，非现实区间；真实区间须 M2 取证后填入 scenarios.js） */
export const DEMO_LEVELS = { low: 0.2, mid: 0.5, high: 0.85 };

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function edgeKey(e) { return [e.source, e.target].sort().join("|"); }

/* 单条边在给定情景强度下的无量纲联系强度（单调、非负） */
export function edgeStrength(edge, strength) {
  const s = clamp01(strength);
  const base = edge.weight / 5;                 // 结构权重归一化 0.2..1
  const floor = LEVEL_FLOOR[edge.evidenceLevel] ?? 0.2;
  return base * (floor + (1 - floor) * s);
}

/* 一次区间/强度实验：
 *  输入 seedId（起始主体）与 strength（无量纲 0..1）
 *  输出每条可传播边的强度、每个节点的加权可达性、激活边数与可达节点数。
 *  采用"最大乘积路径"（最可达的一条路径），逐跳衰减。 */
export function runFlowExperiment(opts = {}) {
  const { seedId = "xwd", strength = 0.5, edges = EDGES, nodes = NODES, threshold = 0.12 } = opts;
  const s = clamp01(strength);

  // 仅对可传播边建立带强度的邻接表
  const adj = new Map(nodes.map(n => [n.id, []]));
  const edgeStrengths = new Map();
  for (const e of edges) {
    if (!TRANSMISSIBLE.has(e.relationType)) continue;
    const es = edgeStrength(e, s);
    edgeStrengths.set(edgeKey(e), { strength: es, edge: e });
    adj.get(e.source)?.push({ other: e.target, es });
    adj.get(e.target)?.push({ other: e.source, es });
  }

  // 最大乘积路径（Dijkstra 式松弛，乘积最大化）
  const nodeScores = new Map([[seedId, 1]]);
  const visited = new Set();
  const queue = [seedId];
  while (queue.length) {
    // 取当前得分最高的未访问节点
    let bestI = 0;
    for (let i = 1; i < queue.length; i++) {
      if ((nodeScores.get(queue[i]) ?? 0) > (nodeScores.get(queue[bestI]) ?? 0)) bestI = i;
    }
    const cur = queue.splice(bestI, 1)[0];
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const { other, es } of adj.get(cur) || []) {
      const cand = (nodeScores.get(cur) ?? 0) * es * DECAY;
      if (cand > (nodeScores.get(other) ?? 0)) {
        nodeScores.set(other, cand);
        if (!visited.has(other)) queue.push(other);
      }
    }
  }

  let totalLinkStrength = 0;
  let activeEdges = 0;
  for (const v of edgeStrengths.values()) {
    totalLinkStrength += v.strength;
    if (v.strength >= threshold) activeEdges++;
  }
  let reachableCount = 0;
  for (const [id, score] of nodeScores) {
    if (id !== seedId && score >= threshold) reachableCount++;
  }

  return {
    seedId,
    strength: s,
    kind: "dimensionless-demo",
    isHypothesis: true,
    note: "无量纲联系强度演示，非真实人数/货量/资金量",
    edgeStrengths: [...edgeStrengths.entries()].map(([k, v]) => ({ key: k, strength: v.strength })),
    nodeScores: [...nodeScores.entries()].map(([id, score]) => ({ id, score })),
    totalLinkStrength: Number(totalLinkStrength.toFixed(6)),
    activeEdges,
    reachableCount
  };
}

/* 双世界对照：同一基础数据，只改情景强度。
 * 返回两种世界的结构指标差，用于识别"稳健结论 vs 依赖假设的结论"。 */
export function compareWorlds(seedId, strengthA, strengthB) {
  const worldA = runFlowExperiment({ seedId, strength: strengthA });
  const worldB = runFlowExperiment({ seedId, strength: strengthB });
  const mapA = new Map(worldA.nodeScores.map(x => [x.id, x.score]));
  const mapB = new Map(worldB.nodeScores.map(x => [x.id, x.score]));
  const ids = new Set([...mapA.keys(), ...mapB.keys()]);
  // 稳健：两种世界都可达；依赖假设：仅高情景可达
  const robust = [], assumptionDependent = [];
  const threshold = 0.12;
  for (const id of ids) {
    if (id === seedId) continue;
    const a = mapA.get(id) ?? 0, b = mapB.get(id) ?? 0;
    if (a >= threshold && b >= threshold) robust.push(id);
    else if (b >= threshold && a < threshold) assumptionDependent.push(id);
  }
  return {
    worldA: { strength: strengthA, totalLinkStrength: worldA.totalLinkStrength, activeEdges: worldA.activeEdges, reachableCount: worldA.reachableCount },
    worldB: { strength: strengthB, totalLinkStrength: worldB.totalLinkStrength, activeEdges: worldB.activeEdges, reachableCount: worldB.reachableCount },
    robustNodes: robust,
    assumptionDependentNodes: assumptionDependent
  };
}
