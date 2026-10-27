// 看见博罗 V2 · M2 引擎与数据底座自动化测试
// 运行：node --test experiments/holo-single/tests/  （或 node m2.engine.test.mjs）
// 覆盖：数据引用完整性 / 16镇街归一 / 事件归属陷阱 / 关系≠流量 / B级区间 / 计算确定性与可复现 / D级缺数据
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const win = new Function('window', scripts[0] + scripts[1] + ';return window;')({});
const E = win.BOLUO_ENGINE, D = win.BOLUO_DATA;
const atlas = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'atlas.json'), 'utf8'));
const model = E.buildModel(E.normalizeLife(D.life), E.normalizeHot(D.hot), atlas);

test('数据层：节点无重复 id', () => {
  const ids = D.nodes.map(n => n.id);
  assert.equal(ids.length, new Set(ids).size, '存在重复节点 id');
});

test('数据层：每条边的 source/target 都存在', () => {
  const ids = new Set(D.nodes.map(n => n.id));
  for (const e of D.edges) {
    assert.ok(ids.has(e.source), `边 ${e.id} source 不存在: ${e.source}`);
    assert.ok(ids.has(e.target), `边 ${e.id} target 不存在: ${e.target}`);
    assert.ok(['A', 'B', 'C'].includes(e.level), `边 ${e.id} 证据等级非法: ${e.level}`);
  }
});

test('数据层：关系边不携带流量数值（关系≠流量）', () => {
  for (const e of D.edges) {
    assert.ok(e.flowValue == null || e.flowValue === '', `边 ${e.id} 不应携带流量数值: ${e.flowValue}`);
  }
});

test('镇街：锚点恰好 16 个，福田并入长宁、不单列', () => {
  assert.equal(model.anchors.length, 16);
  assert.ok(!model.anchorMap.has('福田'), '福田不应单列');
  assert.ok(model.anchorMap.has('长宁'), '缺少长宁');
  assert.deepEqual(E.TOWN_16.length, 16);
});

test('镇街：原福田主体（表面处理 bmc、福田菜心 xc）归一到长宁', () => {
  assert.deepEqual(E.nodeTowns(D.nodes.find(n => n.id === 'bmc').town), ['长宁']);
  assert.deepEqual(E.nodeTowns(D.nodes.find(n => n.id === 'xc').town), ['长宁']);
});

test('事件归属：深博福田产业园（园洲飞地）归园洲，不误归长宁', () => {
  const t = E.classifyEvent({ title: '深博福田产业园开园', summary: '位于园洲镇，深圳福田总部企业落户' }).towns;
  assert.ok(t.includes('园洲'));
  assert.ok(!t.includes('长宁'));
});

test('事件归属：深圳龙华区消息不归属博罗任何镇', () => {
  const t = E.classifyEvent({ title: '深圳龙华区企业外溢', summary: '深圳内部产业布局' }).towns;
  assert.equal(t.length, 0);
});

test('流场：B 级区间 low≤mid≤high，value 恒为 null（不冒认定值）', () => {
  assert.ok(model.flows.length >= 3);
  for (const f of model.flows) {
    const { low, mid, high } = f.range;
    assert.ok(low <= mid && mid <= high, `${f.id} 区间不满足 low≤mid≤high`);
    assert.equal(f.value, null, `${f.id} 不应给出确定值`);
    assert.ok(f.method && f.formula, `${f.id} 缺方法或公式`);
    assert.ok(Array.isArray(f.sources) && f.sources.length >= 2, `${f.id} 至少 2 个独立来源`);
    assert.ok(f.caveats, `${f.id} 缺口径说明 caveats`);
  }
});

test('流场：园洲+石湾→东莞跨界通勤区间为 4500/10000/17000', () => {
  const f = model.flows.find(f => f.id === 'flow_yuanzhou_shiwan_dongguan_commute');
  assert.ok(f);
  assert.deepEqual([f.range.low, f.range.mid, f.range.high], [4500, 10000, 17000]);
});

test('计算：相同假设输入得到相同结果（可复现）', () => {
  const a = E.compute(0.5, 'all', model);
  const b = E.compute(0.5, 'all', model);
  assert.equal(a.totalWeight, b.totalWeight);
  assert.equal(a.edgeCount, D.edges.length);
});

test('计算：改变假设强度，结构指标确实变化（非预制动画）', () => {
  const lo = E.compute(0.16, 'all', model);
  const hi = E.compute(0.88, 'all', model);
  assert.ok(lo.totalWeight < hi.totalWeight, '高强度应得到更大加权和');
});

test('缺数据：未取得人口的镇人口为 null 且标 D 级，不伪造', () => {
  const luoyang = model.anchorMap.get('罗阳');
  assert.equal(luoyang.population, null);
  assert.equal(luoyang.popLevel, 'D');
  const yz = model.anchorMap.get('园洲');
  assert.ok(yz.population > 0);
  assert.equal(yz.popLevel, 'A');
});

test('镇视图：园洲产业层含 6 个主体、外部含深圳/东莞', () => {
  const tv = E.townView('园洲', 'industry', model);
  assert.equal(tv.industries.length, 6);
  assert.ok(tv.external.includes('sz'));
  assert.ok(tv.external.includes('dg'));
});

test('数据底座：D 级缺口已登记（诚实留白）', () => {
  assert.ok(Array.isArray(atlas.dataGaps) && atlas.dataGaps.length >= 1);
});
