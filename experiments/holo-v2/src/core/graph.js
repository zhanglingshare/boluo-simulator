/* graph.js —— 图结构与结构指标（纯函数，不依赖 three，可在 node 测试） */

import { NODES, EDGES } from "../data/index.js";

/* 无向邻接表：nodeId -> [{other, edge}] */
export function buildAdjacency(nodes = NODES, edges = EDGES) {
  const adj = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source).push({ other: e.target, edge: e });
    adj.get(e.target).push({ other: e.source, edge: e });
  }
  return adj;
}

export function degreeOf(adj, id) {
  return adj.has(id) ? adj.get(id).length : 0;
}

/* 仅保留满足证据等级阈值的边（A < B < C；阈值 maxLevel 控制显示到哪一级）。
   levelRank: A=1,B=2,C=3；显示 <= maxLevel 的边。 */
export function filterEdgesByLevel(edges, maxLevel) {
  const rank = { A: 1, B: 2, C: 3 };
  const max = rank[maxLevel] ?? 3;
  return edges.filter(e => rank[e.evidenceLevel] <= max);
}

/* BFS 最短跳数（可按证据等级过滤） */
export function shortestPaths(adj, sourceId, edges) {
  const allowed = new Set(edges.map(e => e.source + "|" + e.target));
  const dist = new Map([[sourceId, 0]]);
  const queue = [sourceId];
  while (queue.length) {
    const cur = queue.shift();
    for (const { other, edge } of adj.get(cur) || []) {
      const key = [cur, other].sort().join("|");
      if (!allowed.has(key)) continue;
      if (!dist.has(other)) { dist.set(other, dist.get(cur) + 1); queue.push(other); }
    }
  }
  return dist;
}

/* 节点过滤：按星群 id 集合 */
export function nodesInGroups(nodes, groups) {
  const set = new Set(groups);
  return new Set(nodes.filter(n => set.has(n.group)).map(n => n.id));
}

/* 一度邻居（用于"追踪"：点选节点后高亮其直接关系） */
export function neighborsOf(adj, id) {
  return new Set((adj.get(id) || []).map(x => x.other));
}

/* 关系摘要（用于浮卡） */
export function edgesOf(edges, id) {
  return edges.filter(e => e.source === id || e.target === id)
    .map(e => ({
      other: e.source === id ? e.target : e.source,
      edge: e
    }));
}
