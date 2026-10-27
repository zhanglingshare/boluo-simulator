/* ============================================================
 * index.js —— 数据门面：统一导出 + 数据集自检
 * 启动时与自动化测试都调用 validateDataset()，确保结构真实、
 * 证据等级合法、关系不被误当作流量。
 * ============================================================ */

import { NODES, YUANZHOU_FOCUS } from "./nodes.js";
import { EDGES } from "./edges.js";
import { OBSERVATIONS } from "./observations.js";
import { FLOWS, FLOW_TYPES } from "./flows.js";
import { SCENARIO_VARIABLES, DEMO_STRENGTH_DOMAIN } from "./scenarios.js";
import { TYPE_META, GROUPS, LEVEL_META, KIND_META, CLUSTER_TYPES } from "./meta.js";

export {
  NODES, EDGES, OBSERVATIONS, FLOWS, FLOW_TYPES,
  SCENARIO_VARIABLES, DEMO_STRENGTH_DOMAIN, YUANZHOU_FOCUS,
  TYPE_META, GROUPS, LEVEL_META, KIND_META, CLUSTER_TYPES
};

const nodeById = () => new Map(NODES.map(n => [n.id, n]));

/* 度（无向，边计数） */
export function degrees() {
  const deg = Object.fromEntries(NODES.map(n => [n.id, 0]));
  EDGES.forEach(e => {
    if (deg[e.source] != null) deg[e.source]++;
    if (deg[e.target] != null) deg[e.target]++;
  });
  return deg;
}

/* 数据集完整性自检。返回 {ok, errors[], warnings[], stats}。 */
export function validateDataset() {
  const errors = [];
  const warnings = [];

  // 1) 节点 id 唯一、非空
  const ids = new Set();
  for (const n of NODES) {
    if (!n.id) errors.push("存在缺少 id 的节点");
    if (ids.has(n.id)) errors.push("节点 id 重复: " + n.id);
    ids.add(n.id);
    if (!TYPE_META[n.type]) errors.push(`节点 ${n.id} 的 type 非法: ${n.type}`);
    if (!GROUPS.find(g => g.id === n.group)) errors.push(`节点 ${n.id} 的 group 非法: ${n.group}`);
    if (!Array.isArray(n.sources) || n.sources.length === 0)
      warnings.push(`节点 ${n.id} 缺少 sources 来源`);
  }

  // 2) 边端点存在、等级/权重/类型合法
  const edgeKeys = new Set();
  for (const e of EDGES) {
    if (!ids.has(e.source)) errors.push(`边端点不存在: ${e.source}->${e.target}`);
    if (!ids.has(e.target)) errors.push(`边端点不存在: ${e.source}->${e.target}`);
    if (!LEVEL_META[e.evidenceLevel]) errors.push(`边 ${e.source}-${e.target} 证据等级非法: ${e.evidenceLevel}`);
    if (!(e.weight >= 1 && e.weight <= 5)) errors.push(`边 ${e.source}-${e.target} 权重越界: ${e.weight}`);
    if (!KIND_META[e.relationType]) errors.push(`边 ${e.source}-${e.target} 关系类型非法: ${e.relationType}`);
    // 防流量误用：M1 所有边必须是结构权重关系线
    if (e.weightType !== "structural")
      errors.push(`边 ${e.source}-${e.target} 的 weightType 必须为 structural，禁止把关系权重当流量`);
    if (e.direction !== "undirected")
      errors.push(`边 ${e.source}-${e.target} 在 M1 必须为 undirected（无已验证流向）`);
    // 同一对节点可以存在多种关系（如供应链 + 资源竞争），仅当关系类型也相同才判重
    const key = [e.source, e.target].sort().join("|") + "#" + e.relationType;
    if (edgeKeys.has(key)) warnings.push(`存在重复边: ${e.source}-${e.target}（${e.relationType}）`);
    edgeKeys.add(key);
  }

  // 3) Flow 完整性：若有流量必须带数值或区间 + 方法 + 来源
  for (const f of FLOWS) {
    if (!ids.has(f.origin) || !ids.has(f.destination)) errors.push(`Flow 端点不存在: ${f.origin}->${f.destination}`);
    if (f.value == null && !(f.range && f.range.low != null)) errors.push(`Flow ${f.origin}->${f.destination} 缺少 value 或 range`);
    if (!f.method || !f.timeWindow) errors.push(`Flow ${f.origin}->${f.destination} 缺少 method/timeWindow`);
    if (!Array.isArray(f.sourceRefs) || f.sourceRefs.length === 0) errors.push(`Flow ${f.origin}->${f.destination} 缺少来源`);
  }

  // 4) 孤立节点（无边）——不是错误，如实提示（说明暂无已验证连接）
  const deg = degrees();
  const isolated = NODES.filter(n => deg[n.id] === 0).map(n => n.id);
  if (isolated.length) warnings.push("孤立节点（暂无已验证连接，如实保留）：" + isolated.join("、"));

  // 5) 统计
  const stats = {
    nodeCount: NODES.length,
    edgeCount: EDGES.length,
    edgesByLevel: { A: 0, B: 0, C: 0 },
    edgesByKind: {},
    nodesByGroup: Object.fromEntries(GROUPS.map(g => [g.id, 0])),
    flowCount: FLOWS.length,
    isolated
  };
  EDGES.forEach(e => {
    stats.edgesByLevel[e.evidenceLevel]++;
    stats.edgesByKind[e.relationType] = (stats.edgesByKind[e.relationType] || 0) + 1;
  });
  NODES.forEach(n => { stats.nodesByGroup[n.group]++; });

  return { ok: errors.length === 0, errors, warnings, stats };
}

export const dataset = {
  nodes: NODES, edges: EDGES, observations: OBSERVATIONS,
  flows: FLOWS, scenarios: SCENARIO_VARIABLES, nodeById
};
