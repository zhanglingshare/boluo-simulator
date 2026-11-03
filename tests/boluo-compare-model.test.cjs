const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=require('../assets/boluo-compare-model.js');
const evidence=JSON.parse(read('data/relationship-evidence-v1.json'));
const changes=JSON.parse(read('data/relationship-changes-v1.json'));
const sources=JSON.parse(read('data/relationship-sources-v1.json'));
const build=id=>model.build(evidence,changes,sources,id);
const getEdge=(d,id)=>d.edges.find(x=>x.id===id);
const getNode=(d,id)=>d.nodes.find(x=>x.id===id);

test('数据质量门：实体/关系/事件ID唯一，引用完整',()=>{
 const maps=model.validate(evidence,changes);
 assert.equal(maps.nodeMap.size,evidence.nodes.length);
 assert.equal(maps.edgeMap.size,evidence.edges.length);
 assert.equal(new Set(changes.changes.map(x=>x.change_id)).size,changes.changes.length);
 assert.equal(evidence.nodes.length,36);
 assert.equal(evidence.edges.length,45);
 assert.equal(changes.changes.length,12);
});
test('12起变化均能建立局部关系对照，节点位置不随前后状态变化',()=>{
 for(const ch of changes.changes){
  const d=build(ch.change_id);
  assert.equal(d.id,ch.change_id);
  assert.ok(d.nodes.length>0&&d.nodes.length<=14);
  assert.ok(d.edges.length>=d.selectedEdges.length);
  for(const n of d.nodes){
   assert.ok(Number.isFinite(n.position.x)&&Number.isFinite(n.position.y),ch.change_id+': '+n.id);
   assert.ok(n.position.x>=0&&n.position.x<=600);
   assert.ok(n.position.y>=0&&n.position.y<=415);
  }
  for(const e of d.edges){
   assert.ok(d.nodes.some(n=>n.id===e.source),ch.change_id+': missing '+e.source);
   assert.ok(d.nodes.some(n=>n.id===e.target),ch.change_id+': missing '+e.target);
  }
  assert.match(d.caution,/不是两份完整历史网络快照/);
  assert.ok(d.sources.every(x=>x.source_id));
 }
});
test('C004：签约事实、未落地节点和三条候选联系不得被绘制为正式生产网络',()=>{
 const d=build('C004');
 for(const id of ['hpm','crs','acc','lcs']){
  const n=getNode(d,id);
  assert.ok(n);
  assert.equal(n.pending,true);
  assert.equal(n.beforeVisible,false);
  assert.equal(n.afterVisible,true);
 }
 for(const id of ['E019','E020','E021']){
  const edge=getEdge(d,id);
  assert.equal(edge.before,'absent');
  assert.equal(edge.after,'hypothesis');
  assert.match(edge.label,/待验证/);
 }
 assert.equal(d.counts.unverified,3);
 assert.match(d.event.title,/80亿/);
});
test('C005：增资扩产的在建项目保持待验证状态',()=>{
 const d=build('C005');
 assert.ok(getNode(d,'jly').pending);
 assert.ok(getNode(d,'jy').pending);
 assert.equal(getEdge(d,'E018').after,'hypothesis');
 assert.equal(getEdge(d,'E022').after,'hypothesis');
});
test('C001：已收录项目和间接证据不能画成同一证据类型',()=>{
 const d=build('C001');
 assert.equal(getEdge(d,'E001').after,'recorded');
 assert.equal(getEdge(d,'E025').after,'inferred');
 assert.equal(getEdge(d,'E025').before,'absent');
});
test('C006/C007：桥梁施工和通车目标不是已建成道路',()=>{
 let d=build('C006');
 assert.equal(getEdge(d,'E026').before,'normal');
 assert.equal(getEdge(d,'E026').after,'construction');
 d=build('C007');
 assert.equal(getEdge(d,'E027').before,'absent');
 assert.equal(getEdge(d,'E027').after,'construction');
});
test('C008：退出的是熟料生产线，不是删除公司',()=>{
 const d=build('C008');
 assert.equal(getNode(d,'glc').beforeVisible,true);
 assert.equal(getNode(d,'glc').afterVisible,true);
 assert.equal(getNode(d,'glc').closedLine,true);
 assert.equal(getEdge(d,'E044').after,'closed');
});
test('C009/C012：只强调明确变化，不误把背景边标成新增',()=>{
 let d=build('C009');
 assert.equal(getEdge(d,'E045').after,'related');
 assert.equal(getEdge(d,'E030').after,'normal');
 d=build('C012');
 assert.equal(getEdge(d,'E041').after,getEdge(d,'E041').before);
 assert.equal(getEdge(d,'E037').after,'related');
});
test('C010/C011：间接证据边在两侧保持推断性质，不虚构确定因果',()=>{
 for(const id of ['C010','C011']){
  const d=build(id);
  assert.equal(getEdge(d,'E039').before,'inferred');
  assert.equal(getEdge(d,'E039').after,'inferred');
 }
});
test('05页面已绑定统一认知顺序且保留04所选事件',()=>{
 const html=read('relation-compare.html'),who=read('who.html'),journey=read('assets/boluo-journey.js'),app=read('assets/boluo-compare.js');
 assert.match(html,/data-bl-journey="comparison"/);
 for(const file of ['boluo-compare-model.js','boluo-compare.js','boluo-compare.css','boluo-journey.js'])
  assert.ok(html.includes(file));
 assert.ok(who.includes('relation-compare.html?from=basic'));
 assert.ok(journey.includes('relation-compare.html?from=basic'));
 assert.match(app,/url.searchParams.set\('change',c\)/);
 assert.match(app,/before.*after|after.*before/);
 assert.doesNotThrow(()=>new vm.Script(app));
 assert.doesNotThrow(()=>new vm.Script(read('assets/boluo-journey.js')));
});
