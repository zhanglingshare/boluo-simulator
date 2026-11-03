#!/usr/bin/env node
/*
 * 结构重要性 · 待观察价值：后台统一计算，前端只呈现（不写浏览器固定权重）。
 *
 * structure_score = 影响范围（牵动主体数×2 + 联系数×2 + 涉及节点网络度×0.35）
 *                 + 节点类型权重和（链主/冠军/老厂/新主体/群落/农业/生态/能源/外部）
 *                 + 事件结构方向（结构性永久退出最高；进入型次之；增强/减弱更低）
 *                 + 近 30 天新近事件 +1
 *
 * 口径红线：该分值只表示网络结构层面的重要性与待观察价值，不等于现实经济影响；
 * C 级待验证边、签约待落地项目不视为已发生事实。
 *
 * 用法：node scripts/compute-structure-score.js [--write]
 *      不带 --write 仅打印结果；带 --write 写回 data/relationship-changes-v1.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_PATH = path.join(ROOT, "data/relationship-evidence-v1.json");
const CHANGES_PATH = path.join(ROOT, "data/relationship-changes-v1.json");

const NODE_TYPE_W = { anchor: 5, champion: 4, legacy: 3, new: 3, cluster: 2, agriculture: 2, eco: 2, energy: 2, external: 1 };
const DIRECTION_W = { exit: 15, new_entity: 2, new_edge: 2, strengthen: 1, weaken: 1 };

function parseDate(raw) {
  const s = String(raw || "").trim();
  let m;
  if ((m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/(\d{4})-(\d{1,2})/))) {
    let yr = +m[1], mo = +m[2];
    const end = s.match(/至\s*(\d{1,2})/);
    if (end) mo = +end[1];
    return new Date(yr, mo - 1, 1);
  }
  return null;
}

const evidence = JSON.parse(fs.readFileSync(EVIDENCE_PATH, "utf8"));
const changesDoc = JSON.parse(fs.readFileSync(CHANGES_PATH, "utf8"));

const nodeMap = {};
evidence.nodes.forEach(n => { nodeMap[n.node_id] = n; });
const degree = {};
evidence.nodes.forEach(n => { degree[n.node_id] = 0; });
evidence.edges.forEach(e => {
  degree[e.source_node_id] = (degree[e.source_node_id] || 0) + 1;
  degree[e.target_node_id] = (degree[e.target_node_id] || 0) + 1;
});

const now = new Date();
const rows = changesDoc.changes.map(c => {
  const nodes = c.involved_node_ids || [], edges = c.involved_edge_ids || [];
  let degreeSum = 0, typeSum = 0;
  nodes.forEach(id => {
    const n = nodeMap[id];
    if (n) { degreeSum += degree[id] || 0; typeSum += NODE_TYPE_W[n.node_type] || 1; }
  });
  const rangeScore = nodes.length * 2 + edges.length * 2 + degreeSum * 0.35;
  let direction = DIRECTION_W[c.change_type] || 1;
  const d = parseDate(c.event_date);
  if (d) {
    const age = (now.getTime() - d.getTime()) / 86400000;
    if (age <= 30) direction += 1;
  }
  const score = Math.round((rangeScore + typeSum + direction) * 10) / 10;
  return { change_id: c.change_id, change_type: c.change_type, event_date: c.event_date, structure_score: score };
});

rows.sort((a, b) => b.structure_score - a.structure_score);
const maxScore = rows.length ? rows[0].structure_score : 1;
rows.forEach(r => { r.bar = Math.max(8, Math.round(r.structure_score / maxScore * 100)); });

rows.forEach(r => console.log(r.change_id.padEnd(6), r.change_type.padEnd(12), r.event_date.padEnd(10), "score=", String(r.structure_score).padStart(5), "bar=", r.bar));

if (process.argv.includes("--write")) {
  const scoreById = {};
  rows.forEach(r => { scoreById[r.change_id] = r.structure_score; });
  changesDoc.changes.forEach(c => { c.structure_score = scoreById[c.change_id]; });
  changesDoc.score_meta = {
    name: "结构重要性 · 待观察价值",
    method: "影响范围（牵动主体/联系数、涉及节点网络度）+ 节点类型权重 + 事件结构方向 + 近30天新近度，后台统一计算",
    weights: {
      node_type: NODE_TYPE_W,
      direction: { exit: 15, new_entity: 2, new_edge: 2, strengthen: 1, weaken: 1 },
      range: "主体数×2 + 联系数×2 + 节点度之和×0.35",
      recent_bonus: "近30天事件 +1"
    },
    disclaimer: "结构排序仅反映网络结构层面的重要性与待观察价值，不等于现实经济影响；C级待验证边、签约待落地项目不视为已发生事实",
    generated_by: "scripts/compute-structure-score.js",
    generated_at: new Date().toISOString().replace("T", " ").slice(0, 16)
  };
  fs.writeFileSync(CHANGES_PATH, JSON.stringify(changesDoc, null, 2) + "\n", "utf8");
  console.log("\n已写回 " + path.relative(ROOT, CHANGES_PATH));
}
