'use strict';
const assert = require('node:assert/strict');
const I = require('../research/tea-intelligence.js');
const ids = new Set(I.sources.map(s=>s.id));
const nodes = new Set(I.entities.map(n=>n.id));
const edges = new Set(I.relations.map(e=>e.id));
let checks=0;
function test(name,fn){fn();checks++;console.log('✓ '+name);}
test('所有主体、关系与研判都可回查来源',()=>{
  assert.equal(ids.size,I.sources.length);assert.equal(nodes.size,I.entities.length);assert.equal(edges.size,I.relations.length);
  for(const s of I.sources){assert.ok(s.origin_group);assert.ok(s.limits);assert.match(s.url,/^https:\/\//);}
  for(const n of I.entities) for(const id of n.sources)assert.ok(ids.has(id),n.id+':'+id);
  for(const e of I.relations){assert.ok(nodes.has(e.from));assert.ok(nodes.has(e.to));assert.ok(e.scope);for(const id of e.sources)assert.ok(ids.has(id));}
  for(const h of I.hypotheses){assert.ok(h.alternatives.length);assert.ok(h.falsifier);for(const b of h.basis)for(const id of b.sources)assert.ok(ids.has(id));for(const id of h.bridge.entities)assert.ok(nodes.has(id));}
});
test('每张关系图的线都有可见端点',()=>{
  for(const key of Object.keys(I.graphs)){const g=I.graph(key),shown=new Set(g.nodes.map(n=>n.id));assert.ok(g.nodes.length);for(const e of g.edges){assert.ok(shown.has(e.from),key+':'+e.id);assert.ok(shown.has(e.to),key+':'+e.id);}}
});
test('缺口与推断不会升级成已经确认的主体或合作',()=>{
  for(const key of Object.keys(I.graphs)){const g=I.graph(key);for(const n of g.nodes)if(n.gap)assert.equal(n.registered,false);for(const e of g.edges)if(['hypothesis','lead'].includes(e.status))assert.equal(e.recorded,false);}
  assert.ok(I.entities.find(n=>n.id==='t-school').gap);
});
test('冲突数值、设计产能和成员范围各自保留',()=>{
  const output=I.metrics.filter(m=>m.conflict_group==='2025-town-output');assert.deepEqual(output.map(m=>m.value),[2449,2570]);assert.equal(new Set(output.map(m=>m.source)).size,2);
  const design=I.metrics.find(m=>m.nature==='design');assert.equal(design.value,300000);assert.match(design.unit,/干茶/);assert.notEqual(design.scope,output[0].scope);
  assert.notEqual(I.metrics.find(m=>m.id==='m6').scope,I.metrics.find(m=>m.id==='m7').scope);
});
test('过期调研线索不会被当作当前机会',()=>{
  for(const l of I.leads){assert.equal(l.status,'closed_historical');assert.ok(l.deadline<I.snapshot_at);assert.equal(l.original_verified,false);assert.ok(ids.has(l.source));}
});
test('样品拒收与供货中断引向不同调查',()=>{
  assert.match(I.assess({sample:'rejected'}).title,/样品/);
  assert.match(I.assess({sample:'accepted',supply:'unstable'}).title,/交付中断/);
});
test('反面证据能降低原假设的优先性',()=>{
  assert.match(I.assess({sample:'accepted',supply:'steady',repeat:'no'}).title,/降低/);
  assert.match(I.assess({sample:'accepted',supply:'steady',repeat:'no'}).body,/价格/);
  assert.match(I.assess({sample:'accepted',supply:'steady',repeat:'yes'}).body,/费用/);
});
test('未知不会被填成失败或人才短缺',()=>{
  assert.match(I.assess({}).title,/区分原因/);
  assert.match(I.assess({}).body,/不等于一定缺人才/);
});
console.log(checks+'项情报一致性检查通过。');
