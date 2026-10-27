/* ============================================================
 * holo.test.js —— 博罗 V2 M1 数据层 / 计算层 自动化测试（node:test）
 *
 * 运行：在 experiments/holo-v2/ 下执行 `node --test tests/`
 *
 * 覆盖总指令「技术测试」中可在 Node 侧验证的条款：
 *  - 节点/边引用完整、无重复节点 id（同端点不同关系类型合法）
 *  - A/B/C 证据等级正确
 *  - 真实关系不被误当作有数量的流量（weightType/direction 硬校验）
 *  - 缺失数据呈现未知状态（FLOWS 为空，不生成默认真实值）
 *  - 调整假设后计算确实改变，且相同参数可复现
 *  - 两阶段布局确定性（同 seed 逐字段相等）+ 五群锚点互不重叠
 *  - 观测值可回溯（统计期/口径/来源）
 * 渲染层（three.js / WebGL）与交互层由 scripts/screenshot.mjs 浏览器实测。
 * ============================================================ */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NODES, EDGES, FLOWS, OBSERVATIONS, GROUPS, validateDataset, degrees
} from "../src/data/index.js";
import { computeLayouts, LAYOUT_SEED } from "../src/core/layout.js";
import { buildAdjacency, degreeOf } from "../src/core/graph.js";
import {
  runFlowExperiment, compareWorlds, edgeStrength, DEMO_LEVELS
} from "../src/core/uncertainty.js";

/* ---------- 一、数据集自检 ---------- */

test("validateDataset 通过：无错误、统计数与人工清点一致（27 节点 / 30 边）", () => {
  const r = validateDataset();
  assert.equal(r.ok, true, "不应有结构错误：" + r.errors.join("；"));
  assert.deepEqual(r.errors, []);
  assert.equal(r.stats.nodeCount, 27);
  assert.equal(r.stats.edgeCount, 30);
});

test("证据等级分布 A12 / B17 / C1，且全部为合法等级", () => {
  const r = validateDataset();
  assert.deepEqual(r.stats.edgesByLevel, { A: 12, B: 17, C: 1 });
  for (const e of EDGES) {
    assert.ok(["A", "B", "C"].includes(e.evidenceLevel), `非法等级 ${e.evidenceLevel}`);
  }
});

test("关系类型分布：供应链19 / 环保约束3 / 资源竞争2 / 生态补偿6", () => {
  const r = validateDataset();
  assert.deepEqual(r.stats.edgesByKind, {
    "供应链": 19, "环保约束": 3, "资源竞争": 2, "生态补偿": 6
  });
});

test("五大星群节点数：产业11 / 生活2 / 文旅3 / 农业7 / 外部4", () => {
  const r = validateDataset();
  assert.deepEqual(r.stats.nodesByGroup, {
    industry: 11, living: 2, tourism: 3, agri: 7, external: 4
  });
});

/* ---------- 二、节点 / 边引用完整 ---------- */

test("节点 id 唯一且非空", () => {
  const ids = new Set();
  for (const n of NODES) {
    assert.ok(n.id, "存在空 id");
    assert.equal(ids.has(n.id), false, `重复 id: ${n.id}`);
    ids.add(n.id);
  }
});

test("每条边的两个端点都存在于节点表", () => {
  const ids = new Set(NODES.map(n => n.id));
  for (const e of EDGES) {
    assert.ok(ids.has(e.source), `边端点不存在: ${e.source}`);
    assert.ok(ids.has(e.target), `边端点不存在: ${e.target}`);
  }
});

test("同一对端点允许存在不同关系类型，但同一关系类型不得重复", () => {
  const seen = new Set();
  for (const e of EDGES) {
    const key = [e.source, e.target].sort().join("|") + "#" + e.relationType;
    assert.equal(seen.has(key), false, `重复边: ${key}`);
    seen.add(key);
  }
  // htd-lq 同时存在「供应链」与「资源竞争」两条不同类型边（合法）
  const pair = EDGES.filter(e =>
    [e.source, e.target].sort().join("|") === ["htd", "lq"].sort().join("|"));
  const kinds = new Set(pair.map(e => e.relationType));
  assert.ok(kinds.size >= 2, "htd-lq 应存在两种不同关系类型");
});

test("孤立节点如实保留：福田菜心 xc、石坝胡须鸡 sb（暂无已验证连接，不删不补）", () => {
  const deg = degrees();
  assert.equal(deg.xc, 0);
  assert.equal(deg.sb, 0);
  const r = validateDataset();
  assert.ok(r.stats.isolated.includes("xc"));
  assert.ok(r.stats.isolated.includes("sb"));
  // 孤立节点是 warning 而非 error
  assert.equal(r.ok, true);
});

/* ---------- 三、关系 ≠ 流量（科学底线） ---------- */

test("M1 所有边都是结构权重关系线：weightType=structural、direction=undirected", () => {
  for (const e of EDGES) {
    assert.equal(e.weightType, "structural",
      `${e.source}-${e.target} 禁止把关系权重 w 当作流量`);
    assert.equal(e.direction, "undirected",
      `${e.source}-${e.target} 在无已验证流向时必须 undirected`);
  }
});

test("权重 w 仅为 1..5 的结构强度，不携带人/货/资金单位", () => {
  for (const e of EDGES) {
    assert.ok(e.weight >= 1 && e.weight <= 5, `w 越界: ${e.weight}`);
    assert.equal(typeof e.weight, "number");
  }
});

/* ---------- 四、缺失数据 → 未知，不伪造 ---------- */

test("FLOWS 为空：没有任何可核验流量时，不生成默认的『真实』流向/流量", () => {
  assert.ok(Array.isArray(FLOWS));
  assert.equal(FLOWS.length, 0);
  assert.equal(validateDataset().stats.flowCount, 0);
});

test("每条 A 级观测值都可回溯到指标、统计期、口径与来源", () => {
  assert.ok(OBSERVATIONS.length >= 8, "应承接 who.html 的核心经济指标");
  for (const o of OBSERVATIONS) {
    assert.ok(o.metric, "观测缺少 metric");
    // 同比类指标 value 为 null、用 yoy 承载；二者至少有一个有效
    assert.ok(o.value !== null && o.value !== undefined || o.yoy !== null && o.yoy !== undefined,
      `观测「${o.metric}」缺少 value 或 yoy`);
    assert.ok(o.period, `观测「${o.metric}」缺少统计期 period`);
    assert.ok(o.source, `观测「${o.metric}」缺少来源 source`);
    assert.ok(o.geography, `观测「${o.metric}」缺少空间口径 geography`);
  }
});

test("县级指标（工业投资 -46.7%）不得被下分到无数据镇街", () => {
  const inv = OBSERVATIONS.find(o => /工业投资/.test(o.metric));
  assert.ok(inv, "应包含工业投资观测");
  assert.equal(inv.geography, "博罗县", "工业投资为县级口径");
  // 没有任何镇级节点/字段直接携带该值
  for (const n of NODES) {
    assert.equal(n.investmentGrowth, undefined, "节点上不应内插县级投资增速");
  }
});

/* ---------- 五、图结构 ---------- */

test("邻接表可构建，度与边表一致", () => {
  const adj = buildAdjacency();
  const deg = degrees();
  for (const n of NODES) {
    assert.equal(degreeOf(adj, n.id), deg[n.id], `节点 ${n.id} 度不一致`);
  }
});

/* ---------- 六、两阶段社区保持布局：确定性 + 不重叠 ---------- */

test("布局确定性：同 seed 两次结果逐字段相等（空间记忆稳定，不随机飞散）", () => {
  const A = computeLayouts({ seed: LAYOUT_SEED });
  const B = computeLayouts({ seed: LAYOUT_SEED });
  for (const mode of ["overview", "industry"]) {
    assert.equal(A[mode].size, B[mode].size);
    for (const [id, p] of A[mode]) {
      const q = B[mode].get(id);
      assert.ok(q, `${mode} 缺少节点 ${id}`);
      assert.equal(p.x, q.x, `${mode}/${id} x 不确定`);
      assert.equal(p.y, q.y, `${mode}/${id} y 不确定`);
      assert.equal(p.z, q.z, `${mode}/${id} z 不确定`);
    }
  }
});

test("不同 seed 会产生不同布局（布局确实由确定性算法驱动，而非写死常量）", () => {
  const A = computeLayouts({ seed: 42 });
  const B = computeLayouts({ seed: 99 });
  let diff = 0;
  for (const [id, p] of A.overview) {
    const q = B.overview.get(id);
    if (Math.abs(p.x - q.x) > 1e-9 || Math.abs(p.y - q.y) > 1e-9) diff++;
  }
  assert.ok(diff > 0, "不同 seed 应导致布局差异");
});

test("每个节点在 overview/industry 两套布局中都有位置", () => {
  const L = computeLayouts();
  for (const n of NODES) {
    assert.ok(L.overview.get(n.id), `overview 缺位置: ${n.id}`);
    assert.ok(L.industry.get(n.id), `industry 缺位置: ${n.id}`);
  }
});

test("全景五群锚点两两间距足够（跨群边不参与布局，星群不重叠）", () => {
  const L = computeLayouts();
  const a = L.anchors;
  const ids = Object.keys(a);
  let minD = Infinity;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const d = Math.hypot(
        a[ids[i]].x - a[ids[j]].x,
        a[ids[i]].y - a[ids[j]].y,
        a[ids[i]].z - a[ids[j]].z
      );
      minD = Math.min(minD, d);
    }
  }
  assert.ok(minD >= 12, `最小锚点间距过小: ${minD.toFixed(2)}`);
});

/* ---------- 七、不确定性实验：真重算、可复现、不伪装事实 ---------- */

test("情景强度低→中→高，总联系强度与可达节点单调增强（输入变，结果变）", () => {
  const low = runFlowExperiment({ seedId: "xwd", strength: DEMO_LEVELS.low });
  const mid = runFlowExperiment({ seedId: "xwd", strength: DEMO_LEVELS.mid });
  const high = runFlowExperiment({ seedId: "xwd", strength: DEMO_LEVELS.high });
  assert.ok(low.totalLinkStrength < mid.totalLinkStrength, "低→中 总强度应上升");
  assert.ok(mid.totalLinkStrength < high.totalLinkStrength, "中→高 总强度应上升");
  assert.ok(low.reachableCount <= mid.reachableCount);
  assert.ok(mid.reachableCount <= high.reachableCount);
  // 回归基准值（当前算法与数据下）
  assert.deepEqual(
    [low.totalLinkStrength, mid.totalLinkStrength, high.totalLinkStrength],
    [5.296, 6.76, 8.468]
  );
  assert.deepEqual(
    [low.reachableCount, mid.reachableCount, high.reachableCount],
    [4, 5, 8]
  );
});

test("相同参数完全可复现（无随机）", () => {
  const a = runFlowExperiment({ seedId: "xwd", strength: 0.5 });
  const b = runFlowExperiment({ seedId: "xwd", strength: 0.5 });
  assert.deepEqual(a, b);
});

test("实验结果明确标注为『无量纲演示假设』，绝不输出真实人数/货量", () => {
  const r = runFlowExperiment({ seedId: "xwd", strength: 0.5 });
  assert.equal(r.isHypothesis, true);
  assert.equal(r.kind, "dimensionless-demo");
  assert.ok(/非真实|无量纲/.test(r.note));
  // 结果对象中不出现任何『人/吨/元/万』单位字段
  for (const es of r.edgeStrengths) {
    assert.equal(es.unit, undefined);
    assert.equal(es.people, undefined);
  }
});

test("边强度非负、随情景单调，并尊重证据等级地板（A 级在低情景仍保留基线）", () => {
  const edgeA = { weight: 5, evidenceLevel: "A", relationType: "供应链" };
  const edgeC = { weight: 5, evidenceLevel: "C", relationType: "供应链" };
  assert.ok(edgeStrength(edgeA, 0.2) > edgeStrength(edgeC, 0.2),
    "同等权重下 A 级低情景基线应高于 C 级");
  assert.ok(edgeStrength(edgeC, 0.2) < edgeStrength(edgeC, 0.85), "C 级应随情景显著增强");
  assert.ok(edgeStrength(edgeA, 0.2) >= 0);
});

test("双世界对照：识别稳健结论与依赖假设的结论（低/高世界各 4 个）", () => {
  const TH = 0.12;
  const reachable = lv => new Set(
    runFlowExperiment({ seedId: "xwd", strength: DEMO_LEVELS[lv] })
      .nodeScores.filter(s => s.id !== "xwd" && s.score >= TH)
      .map(s => s.id));
  const lowIds = reachable("low");
  const highIds = reachable("high");

  const cmp = compareWorlds("xwd", DEMO_LEVELS.low, DEMO_LEVELS.high);
  assert.equal(cmp.robustNodes.length, 4);
  assert.equal(cmp.assumptionDependentNodes.length, 4);
  // 稳健结论：低、高两个世界都可达
  for (const id of cmp.robustNodes) {
    assert.ok(lowIds.has(id) && highIds.has(id), `稳健节点 ${id} 应在两世界都可达`);
  }
  // 依赖假设：仅高世界可达，低世界不可达
  for (const id of cmp.assumptionDependentNodes) {
    assert.equal(lowIds.has(id), false, `依赖假设节点 ${id} 不应在低世界可达`);
    assert.ok(highIds.has(id), `依赖假设节点 ${id} 应在高世界可达`);
  }
});
