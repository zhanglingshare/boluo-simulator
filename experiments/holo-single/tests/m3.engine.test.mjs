import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {M3_VERSION,FOCAL_IDS,simulate,compareWorlds,snapshotSignature,validateSaved,basePositions,weight} from '../m3/engine.mjs';

// 从M2内联底座直接解析事实；不重编造第二套测试图。
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>\s*(\/\*[\s\S]*?window\.BOLUO_DATA=[\s\S]*?)<\/script>/);
assert.ok(match,'M2事实底座必须存在');
const ctx={window:{}};
vm.runInNewContext(match[1],ctx);
const D=ctx.window.BOLUO_DATA;
const a=()=>simulate(D.nodes,D.edges,.2);
const b=()=>simulate(D.nodes,D.edges,.8);

test('保留M2的27主体、30关系底座',()=>{
 assert.equal(D.nodes.length,27);assert.equal(D.edges.length,30);
});
test('情景引擎无外部真实流量值',()=>{
 const output=a();assert.equal(output.hypothesis,true);assert.equal(output.dimension,'dimensionless');
 assert.ok(!('commuters' in output));assert.ok(!('gdp' in output));assert.ok(!('flowValue' in output));
});
test('所有A级关系严格不变',()=>{
 const x=a(),y=b();for(const e of x.edges.filter(e=>e.level==='A')){
  assert.equal(e.weight,1);assert.equal(y.edges.find(f=>f.id===e.id).weight,1);
 }
});
test('仅白名单B级联系受参数影响',()=>{
 const x=a(),y=b();for(const e of x.edges){
  const diff=Math.abs(e.weight-y.edges.find(f=>f.id===e.id).weight);
  assert.equal(diff>1e-9,FOCAL_IDS.includes(e.id)&&e.level!=='A');
 }
});
test('改变假设后重算总联系强度',()=>assert.ok(b().totalWeight>a().totalWeight));
test('高低情景确实改变可达性集合',()=>assert.ok(b().reachable.length>a().reachable.length));
test('两世界相同节点集合、相同基准坐标',()=>{
 const x=a(),y=b(),base=basePositions(D.nodes);
 assert.deepEqual(x.nodes.map(n=>n.id),y.nodes.map(n=>n.id));
 assert.deepEqual([...base.keys()].sort(),Array.from(D.nodes,n=>n.id).sort());
});
test('不受实验影响的节点坐标不随情景更改',()=>{
 const x=a(),y=b(),affected=new Set(D.edges.filter(e=>FOCAL_IDS.includes(e.id)).flatMap(e=>[e.source,e.target]));
 for(const n of D.nodes)if(!affected.has(n.id))assert.deepEqual(x.positions.get(n.id),y.positions.get(n.id));
});
test('相同输入、相同数据可以复算',()=>{
 const x=simulate(D.nodes,D.edges,.5),y=simulate(D.nodes,D.edges,.5);
 assert.equal(x.totalWeight,y.totalWeight);assert.deepEqual(x.reachable,y.reachable);
 assert.deepEqual([...x.positions],[...y.positions]);
});
test('输入区间被限制在0..1',()=>{
 assert.equal(simulate(D.nodes,D.edges,-10).input,0);
 assert.equal(simulate(D.nodes,D.edges,22).input,1);
});
test('比较世界正确识别两者共同与条件性节点',()=>{
 const c=compareWorlds(a(),b());assert.ok(c.common.length>0);
 assert.ok(c.onlyB.length>0);assert.equal(c.onlyA.length,0);
 assert.equal(c.changedCount,FOCAL_IDS.length);
});
test('模型输出不声称GDP、经济预测或实际人数',()=>{
 const obj=JSON.stringify(compareWorlds(a(),b()));assert.equal(obj.includes('1349'),false);
 assert.equal(obj.includes('commuters'),false);
});
test('保存的情景需要同模型版本和同一份数据',()=>{
 const data={modelVersion:M3_VERSION,signature:snapshotSignature(D.nodes,D.edges),inputs:[.2,.8]};
 assert.deepEqual(validateSaved(data,D.nodes,D.edges),[.2,.8]);
 assert.throws(()=>validateSaved({...data,modelVersion:'old'},D.nodes,D.edges));
 assert.throws(()=>validateSaved({...data,signature:'other'},D.nodes,D.edges));
 assert.throws(()=>validateSaved({...data,inputs:[-1,3]},D.nodes,D.edges));
});
test('无效关系端点必须显式报错',()=>{
 assert.throws(()=>simulate(D.nodes,[...D.edges,{...D.edges[0],target:'unknown-id'}],.2));
});
test('原M2网页可继续调用其原有脚本',()=>{
 assert.ok(html.includes('window.BOLUO_ENGINE'));
 assert.ok(html.includes('data/atlas.json'));
 assert.ok(html.includes('m3/ui.mjs'));
});
test('权重调整不把A级证据当作概率',()=>{
 const aa=D.edges.find(e=>e.level==='A');assert.equal(weight(aa,0),1);
 assert.equal(weight(aa,1),1);
});
