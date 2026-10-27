import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
 M3_VERSION, COMMUTE_FLOW_ID, U_ANCHORS, JOBS_BASE,
 simulate, scenariosFromFlow, uToFlow, nearestAnchor, sensitivity
} from '../m3/engine.mjs';

// M2 事实底座（节点/边）
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>\s*(\/\*[\s\S]*?window\.BOLUO_DATA=[\s\S]*?)<\/script>/);
assert.ok(match);
const ctx={window:{}};
vm.runInNewContext(match[1],ctx);
const D=ctx.window.BOLUO_DATA;

// M2 情报底座（B 级流场）
const atlas=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
const flow=atlas.flows.find(f=>f.id===COMMUTE_FLOW_ID);
assert.ok(flow,'atlas 必须包含园洲—东莞通勤流场');

test('三情景锚点绑定真实 B 级人次与系数',()=>{
 const s=scenariosFromFlow(flow);
 assert.equal(s.low.persons,flow.range.low);
 assert.equal(s.mid.persons,flow.range.mid);
 assert.equal(s.high.persons,flow.range.high);
 assert.equal(s.low.u,U_ANCHORS.low.u);
 assert.equal(s.low.multiplier,flow.scenarios.low.multiplier);
 // 结构系数自洽：基数 × 系数 ≈ 区间（取整误差内）
 for(const k of ['low','mid','high']){
  const expect=JOBS_BASE*s[k].multiplier;
  assert.ok(Math.abs(expect-s[k].persons)<Math.max(400,expect*0.12)),
   `${k}: ${expect} vs ${s[k].persons}`;
 }
});

test('结构强度 u 单调映射到人次情景',()=>{
 const prev=[];
 for(let i=0;i<=20;i++){
  const u=i/20;const m=uToFlow(u,flow);prev.push(m.persons);
  assert.equal(m.kind,'C');
  assert.ok(m.band[0]<=m.persons&&m.persons<=m.band[1]);
  assert.ok(m.persons>=flow.range.low&&m.persons<=flow.range.high);
 }
 for(let i=1;i<prev.length;i++)assert.ok(prev[i]>=prev[i-1],'人次随 u 单调不减');
});

test('锚点处人次与区间一致',()=>{
 assert.equal(uToFlow(U_ANCHORS.low.u,flow).persons,flow.range.low);
 assert.equal(uToFlow(U_ANCHORS.mid.u,flow).persons,flow.range.mid);
 assert.equal(uToFlow(U_ANCHORS.high.u,flow).persons,flow.range.high);
});

test('超出 B 区间不向外外推（钳制）',()=>{
 assert.equal(uToFlow(0,flow).persons,flow.range.low);
 assert.equal(uToFlow(1,flow).persons,flow.range.high);
 assert.equal(uToFlow(0,flow).withinB,false);
 assert.equal(uToFlow(0.5,flow).withinB,true);
});

test('区间映射不产出 GDP、概率或精确人数',()=>{
 const m=uToFlow(0.5,flow);
 assert.ok(!('gdp' in m)&&!('probability' in m));
 assert.ok(Array.isArray(m.band)&&m.band[1]>m.band[0]);
 assert.equal(m.note.includes('不是统计值'),true);
});

test('自定义插值可复算（确定性）',()=>{
 const a=uToFlow(0.63,flow),b=uToFlow(0.63,flow);
 assert.deepEqual(a,b);
});

test('nearestAnchor 归类正确',()=>{
 assert.equal(nearestAnchor(0.2).key,'low');
 assert.equal(nearestAnchor(0.5).key,'mid');
 assert.equal(nearestAnchor(0.85).key,'high');
 assert.equal(nearestAnchor(0.2).exact,true);
});

test('敏感性：可达性随 u 单调不减',()=>{
 const r=sensitivity(D.nodes,D.edges,flow).reachCount;
 assert.ok(r.u0<=r.low&&r.low<=r.mid&&r.mid<=r.high&&r.high<=r.u1);
 assert.equal(r.low,simulate(D.nodes,D.edges,U_ANCHORS.low.u).reachable.length);
 assert.equal(r.high,simulate(D.nodes,D.edges,U_ANCHORS.high.u).reachable.length);
});

test('敏感性：起点始终稳健可达，且存在条件性主体',()=>{
 const s=sensitivity(D.nodes,D.edges,flow);
 assert.ok(s.stableIn.some(x=>x.id==='dg'));
 assert.ok(s.conditional.length>0);
 for(const c of s.conditional)assert.ok(c.threshold>=0&&c.threshold<=1);
});

test('敏感性：稳健/条件性/永不连通三类互斥且穷尽',()=>{
 const s=sensitivity(D.nodes,D.edges,flow);
 const n=s.stableIn.length+s.stableOut.length+s.conditional.length;
 assert.equal(n,D.nodes.length);
});

test('敏感性提供下一步最有价值数据',()=>{
 const s=sensitivity(D.nodes,D.edges,flow);
 assert.ok(typeof s.nextBestData==='string'&&s.nextBestData.length>5);
});

test('敏感性结果不含真实经济产出字段',()=>{
 const s=sensitivity(D.nodes,D.edges,flow);
 const js=JSON.stringify(s);
 assert.equal(js.includes('gdp'),false);
 assert.equal(js.includes('probability'),false);
});

test('模型版本随引擎升级',()=>{
 assert.equal(M3_VERSION,'m3-structural-0.2');
});
