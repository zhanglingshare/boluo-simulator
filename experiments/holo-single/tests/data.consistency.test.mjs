import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..', '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');

const network = read('network.html');
const holo = read('experiments/holo-single/index.html');
const manifest = JSON.parse(read('data-manifest.json'));
const atlas = JSON.parse(read('experiments/holo-single/data/atlas.json'));

test('network 边数据：真实边只有 A/B，无 C（C 全局=假设）', () => {
  const levels = [...network.matchAll(/level:"([ABC])"/g)].map(m => m[1]);
  assert.ok(levels.length > 20, '应提取到边 level');
  assert.ok(!levels.includes('C'), '不应存在 level C 边（弱证据应 B+weak 点线）');
});

test('network 唯一的点线边为 B + weak', () => {
  assert.match(network, /level:"B",weak:true/);
});

test('network 冲击按钮：不再用 A/B/C/D 作情景编号', () => {
  for (const ch of ['A 链主飞走', 'B 东江喊停', 'C 老厂腾退', 'D 外溢退潮']) {
    assert.ok(!network.includes(`>${ch}<`), `不应再有按钮文字 ${ch}`);
  }
  assert.match(network, />链主飞走</);
  assert.match(network, />外溢退潮</);
});

test('全息版边数组：第3元素（等级）无 C', () => {
  const seg = holo.slice(holo.indexOf('const edges=['), holo.indexOf('].map(([source'));
  const grades = [...seg.matchAll(/\['[^']+','[^']+','([ABC])'/g)].map(m => m[1]);
  assert.ok(grades.length > 20, '应提取到全息边等级');
  assert.ok(!grades.includes('C'), '全息边不应有 C');
});

test('全息版证据筛选 grade 只有 all/A/B', () => {
  assert.match(holo, /vals=\['all','A','B'\]/);
});

test('全息边映射保留 weak 字段', () => {
  assert.match(holo, /\[source,target,level,kind,detail,weak\]/);
  assert.match(holo, /weak:!!weak/);
});

test('manifest 可解析且每个资产带版本/更新字段', () => {
  assert.equal(manifest.manifest_version, 'data-manifest/1');
  for (const a of manifest.assets) {
    assert.ok(a.id && a.layer && a.evidence, `资产 ${a.id} 字段不全`);
  }
});

test('atlas 证据图例与统一字典一致（A/B/C/D）', () => {
  const legend = atlas.evidence_legend;
  for (const k of ['A', 'B', 'C', 'D']) assert.ok(legend[k], `缺证据等级 ${k}`);
  assert.match(legend.A, /直接观测/);
  assert.match(legend.C, /假设|情景/);
  assert.match(legend.D, /未知/);
});

test('节点数 27 与 manifest 一致', () => {
  assert.equal(manifest.node_count, 27);
  assert.equal(manifest.town_anchor_count, 16);
});
