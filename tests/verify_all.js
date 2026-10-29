#!/usr/bin/env node
/* verify_all.js — 发布前质量门（语法 + 口径 + 数据 + 证据 四类断言）
   全过 exit 0，任一失败 exit 1。供 GitHub Actions 与本地 `node tests/verify_all.js` 使用。 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let fails = 0;
const ok = m => console.log('  ✓ ' + m);
const bad = m => { fails++; console.log('  ✗ ' + m); };

console.log('── 1) HTML 内联 script 语法 ──');
const htmlFiles = ["index.html", "network.html", "who.html", "choices.html", "future.html", "windtunnel.html", "blindspot.html", "report.html", "ending.html", "town.html", "holo.html", "holo-home-v6.html", "holo-home-v7.html", "holo-home-v8.html", "holo-home-v9.html", "holo-home-v10.html"];
for (const f of htmlFiles) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { bad('缺少页面文件 ' + f); continue; }
  const html = fs.readFileSync(fp, 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  blocks.forEach((code, i) => { try { new Function(code); } catch (e) { bad(f + ' 第' + (i + 1) + '个script块语法错误: ' + e.message); } });
  ok(f + '（' + blocks.length + ' 块）');
}

console.log('── 2) 模型口径断言（SEED=42 N=10000，规划兑现基准路径；与页面口径同源）──');
const HT = require(path.join(root, 'model.js'));
const SEED = 42, N = 10000;
const res = HT.run(SEED, N, HT.DEFAULT_PATHS);
const near = (a, b, t) => Math.abs(a - b) <= t;
if (!near(res.p10, 1481, 8)) bad('p10 应≈1481，实际 ' + Math.round(res.p10));
else ok('p10 = ' + Math.round(res.p10));
if (!near(res.p50, 1600, 8)) bad('p50 应≈1600，实际 ' + Math.round(res.p50));
else ok('p50 = ' + Math.round(res.p50));
if (!near(res.p90, 1722, 8)) bad('p90 应≈1722，实际 ' + Math.round(res.p90));
else ok('p90 = ' + Math.round(res.p90));
if (!near(res.hit, 50.1, 1.2)) bad('hit 应≈50.1%（规划兑现基准），实际 ' + res.hit.toFixed(2) + '%');
else ok('hit = ' + res.hit.toFixed(2) + '%');
if (!near(HT.BASE, 1005.45, 0.05)) bad('BASE 应≈1005.45，实际 ' + HT.BASE);
else ok('BASE = ' + HT.BASE);
if (HT.TARGET !== 1600) bad('TARGET 应=1600，实际 ' + HT.TARGET);
else ok('TARGET = ' + HT.TARGET);

console.log('── 3) 每日数据文件（v2 审计字段）──');
for (const f of ['hot.json', 'life.json']) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { bad('缺少 ' + f); continue; }
  try {
    const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (!d.updated) bad(f + ' 缺 updated');
    if (d.schema_version !== 2) bad(f + ' schema_version 应为 2，实际 ' + d.schema_version);
    if (!d.fetched_at) bad(f + ' 缺 fetched_at');
    if (!Array.isArray(d.items) && !Array.isArray(d.spots) && !Array.isArray(d.towns)) bad(f + ' 缺主体数组');
    if (f === 'hot.json' && d.items.some(x => !x.url || !x.source)) bad('hot.json 存在缺 url/source 条目');
    if (f === 'hot.json' && d.items.some(x => !x.verified_status)) bad('hot.json 存在缺 verified_status 条目');
    const arr = d.items || d.spots || d.towns || [];
    ok(f + ' 可解析 v2（updated=' + d.updated + '，' + arr.length + '条）');
  } catch (e) { bad(f + ' JSON 解析失败: ' + e.message); }
}

console.log('── 4) 事件证据库（evidence/events/*.json）──');
const evDir = path.join(root, 'evidence', 'events');
const evFiles = fs.existsSync(evDir) ? fs.readdirSync(evDir).filter(f => f.endsWith('.json')) : [];
const reqFields = ['event_id','region','event_type','subject','source_url','evidence_level','status','related_paths','parameter_change','requires_review'];
const evIds = new Set();
if (!evFiles.length) ok('暂无候选事件（目录存在即可，不视为失败）');
for (const f of evFiles) {
  try {
    const ev = JSON.parse(fs.readFileSync(path.join(evDir, f), 'utf8'));
    for (const k of reqFields) if (!(k in ev)) bad(f + ' 缺字段 ' + k);
    if (evIds.has(ev.event_id)) bad(f + ' event_id 重复: ' + ev.event_id);
    evIds.add(ev.event_id);
    if (ev.status === 'approved' && ev.parameter_change == null) bad(f + ' approved 但 parameter_change 为 null（禁止无凭据入库）');
    if (ev.status !== 'rejected' && ev.parameter_change != null && ev.requires_review !== true) bad(f + ' parameter_change 非空但未标 requires_review');
    ok(f + '（' + ev.event_id + ' · ' + ev.status + '）');
  } catch (e) { bad(f + ' 解析失败: ' + e.message); }
}

console.log('── 5) V9 交互回归断言 ──');
const v9Path = path.join(root, 'holo-home-v9.html');
if (!fs.existsSync(v9Path)) {
  bad('缺少 holo-home-v9.html，无法检查交互回归');
} else {
  const v9 = fs.readFileSync(v9Path, 'utf8');
  const checks = [
    ['探索问题先清除旧筛选', v9.includes('function setQuestion(q){stopPlay();activeQuestion=q;activeFilter="all";')],
    ['节点拖动有移动阈值，避免点击误判为拖动', v9.includes('if(!drag.moved&&Math.sqrt(dx*dx+dy*dy)<4)return;')],
    ['节点拖动使用 SVG 坐标变换', v9.includes('function screenToSvg(ev)')],
    ['新节点接入有动态连线', v9.includes('class:"new-link"')],
    ['手动交互可以停止自动播放', v9.includes('function stopPlay()')],
    ['搜索无结果时给出明确反馈', v9.includes('没有找到对应的关系群落')]
  ];
  checks.forEach(([label, passed]) => passed ? ok(label) : bad(label));
}


console.log('── 6) V10 公开证据关系网络与引用完整性 ──');
const v10Path = path.join(root, 'holo-home-v10.html');
const evidencePath = path.join(root, 'data', 'relationship-evidence-v1.json');
const sourcesPath = path.join(root, 'data', 'relationship-sources-v1.json');
const changesPath = path.join(root, 'data', 'relationship-changes-v1.json');
if (![v10Path, evidencePath, sourcesPath, changesPath].every(fs.existsSync)) {
  bad('V10 或关系证据底座文件缺失');
} else {
  const v10 = fs.readFileSync(v10Path, 'utf8');
  let ed, sd, cd;
  try {
    ed = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    sd = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
    cd = JSON.parse(fs.readFileSync(changesPath, 'utf8'));
  } catch (e) { bad('关系证据 JSON 解析失败: ' + e.message); }
  if (ed && sd && cd) {
    if (ed.nodes.length !== ed.node_count) bad('relationship-evidence 节点计数不匹配');
    else ok('关系节点计数一致（' + ed.nodes.length + '）');
    if (ed.edges.length !== ed.edge_count) bad('relationship-evidence 关系计数不匹配');
    else ok('关系边计数一致（' + ed.edges.length + '）');
    const nodeIds = new Set(ed.nodes.map(n => n.node_id));
    const edgeIds = new Set(ed.edges.map(e => e.edge_id));
    const sourceIds = new Set(sd.sources.map(s => s.source_id));
    for (const e of ed.edges) {
      if (!nodeIds.has(e.source_node_id) || !nodeIds.has(e.target_node_id)) bad(e.edge_id + ' 存在悬空节点引用');
      for (const sid of e.source_ids || []) if (!sourceIds.has(sid)) bad(e.edge_id + ' 引用了不存在的来源 ' + sid);
    }
    for (const n of ed.nodes) for (const sid of n.source_ids || []) if (!sourceIds.has(sid)) bad(n.node_id + ' 引用了不存在的来源 ' + sid);
    for (const change of cd.changes) {
      for (const id of change.involved_node_ids || []) if (!nodeIds.has(id)) bad(change.change_id + ' 引用了不存在的节点 ' + id);
      for (const id of change.involved_edge_ids || []) if (!edgeIds.has(id)) bad(change.change_id + ' 引用了不存在的关系 ' + id);
      for (const sid of change.source_ids || []) if (!sourceIds.has(sid)) bad(change.change_id + ' 引用了不存在的来源 ' + sid);
    }
    ok('节点、关系、变化事件与来源引用完整性已检查');
  }
  const uiChecks = [
    ['V10 可切换概念网络与证据网络', v10.includes('id="conceptMode"') && v10.includes('id="evidenceMode"')],
    ['V10 从 data/ 加载关系、来源与变化数据', v10.includes('relationship-evidence-v1.json') && v10.includes('relationship-sources-v1.json') && v10.includes('relationship-changes-v1.json')],
    ['V10 证据关系可点击查看来源', v10.includes('function showEvidenceEdge(id)') && v10.includes('function sourceLinks(ids)')],
    ['V10 以 A/B/C 线型区分证据等级', v10.includes('evidence-edge.grade-b') && v10.includes('evidence-edge.grade-c')],
    ['V10 明确声明线粗不代表关系强度', v10.includes('线粗不代表关系强度')],
    ['V10 使用关系方向箭头', v10.includes('id="evidenceArrow"') && v10.includes('marker-end')]
  ];
  uiChecks.forEach(([label, passed]) => passed ? ok(label) : bad(label));
}

console.log(fails ? '\n✗ 共 ' + fails + ' 项失败' : '\n✓ 全部通过');
process.exit(fails ? 1 : 0);
