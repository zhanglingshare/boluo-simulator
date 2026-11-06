'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../v11/relations-world-data.js'),W=require('../v11/relations-world-core.js'),L=require('../v11/relations-world-layout.js');
const raw=['evidence','sources','changes'].map(n=>JSON.parse(fs.readFileSync(path.join(__dirname,'../data/relationship-'+n+'-v1.json'),'utf8')));
const baseline=JSON.stringify(raw),atlas=W.build(...raw),read=q=>W.read(q,atlas);
test('nine sourced scenes have real nodes, complete links and cumulative exploration steps',()=>{
 assert.equal(D.scenes.length,9);assert.equal(Object.keys(D.sources).length,7);
 for(const s of D.scenes){assert.ok(atlas.nodes.has(s.root));assert.ok(atlas.sources.has(s.source));assert.equal(s.steps.length,4);assert.equal(s.metrics.length,2);
  const all=new Set(s.steps.flatMap(s=>s.nodes));assert.deepEqual([...all].sort(),[...s.nodes].sort());
  for(const id of s.edges){const e=atlas.edges.get(id);assert.ok(e,id);assert.ok(s.nodes.includes(e.a)&&s.nodes.includes(e.b),s.id+':'+id);}
 }
});
test('registry imports preserve all 36 original objects and do not mutate original records',()=>{
 assert.deepEqual(atlas.registry,{nodes:36,edges:45,changes:12});assert.equal(JSON.stringify(raw),baseline);
 const visible=new Set(W.visible(read('?mode=atlas'),atlas).nodes.map(n=>n.id));for(const n of raw[0].nodes)assert.ok(visible.has(n.node_id),n.node_id);
 assert.equal(atlas.edges.get('E017').kind,'inferred');assert.equal(atlas.edges.get('E023').kind,'inferred');
 assert.ok(!W.visible(read('?mode=atlas&candidates=1'),atlas).edges.some(e=>e.id==='E044'));
});
test('undisclosed past is not zero and a closed clinker line does not erase its company',()=>{
 const s=read('?case=cement&mode=compare'),v=W.visible(s,atlas);assert.ok(v.nodes.some(n=>n.id==='glc'));assert.ok(v.nodes.some(n=>n.id==='glc-line'));
 const e=atlas.edges.get('clinker-output');assert.equal(W.status(e,'before'),'record');assert.equal(W.status(e,'current'),'closed');
 assert.equal(v.edges.filter(e=>W.status(e,'current')==='closed').length,1);
 for(const e of W.visible(read('?case=tea'),atlas).edges)assert.equal(W.status(e,'before'),'unreported');
 const legacy=W.sceneFor(read('?change=C004'),atlas);assert.match(legacy.compare.note,/未披露.*不存在/);
});
test('source snapshots separate scopes, plans and personal outcome questions',()=>{
 const scene=id=>D.scenes.find(s=>s.id===id);
 assert.match(scene('hande').metrics[1].note,/分母/);
 assert.match(atlas.nodes.get('tea-work').detail,/就业|岗位/);assert.match(D.sources.tea.scope,/新增招聘/);
 assert.match(D.sources.mobility.scope,/试运行至6月上旬/);assert.match(D.sources.copper.scope,/目标.*当前/);
 assert.equal(atlas.nodes.get('graduates').kind,'question');assert.equal(atlas.nodes.get('litchi-income').kind,'question');
 assert.match(scene('talent').metrics[0].value,/3/);
});
test('shared scenes round-trip only public choices and reject arbitrary node IDs and protocols',()=>{
 for(const c of D.scenes){const s=read('?case='+c.id+'&mode=compare&focus='+c.root+'&depth=1'),q=W.query({...s,body:'private note',url:'https://secret.example/'},atlas,true);assert.equal(new URLSearchParams(q).get('share'),'1');assert.ok(!q.includes('private'));assert.ok(!q.includes('secret'));assert.deepEqual(read(q),s);}
 const invalid=read('?case=__proto__&focus=constructor&edge=toString&mode=bad&step=999&depth=-9&group=__proto__');assert.equal(invalid.case,'hande');assert.equal(invalid.focus,'');assert.equal(invalid.edge,'');assert.equal(invalid.group,'all');assert.equal(invalid.step,3);assert.equal(invalid.depth,0);
 for(const url of ['javascript:alert(1)','data:text/html,hi','https://user:pw@example.com'])assert.equal(W.safeURL(url),'');
 assert.equal(W.normalizeRecord({case:'tea',body:'hello',url:'javascript:hi'},atlas),null);const note=W.normalizeRecord({case:'tea',body:'x'.repeat(900),date:'2026-11-07'},atlas);assert.equal(note.body.length,600);assert.equal(note.status,'unreviewed');
 assert.equal(W.normalizeRecord({},atlas),null);assert.equal(W.read('?change=C004',W.build()).change,'C004');assert.equal(W.sceneFor(read('?change=C008'),atlas).id,'cement');
});
test('layouts keep subject cards separate at desktop, phone, comparison and expanded sizes',()=>{
 for(const s of D.scenes)for(const mobile of[false,true])for(const mode of['trace','compare','atlas']){
  const v=W.visible(read('?case='+s.id+'&mode='+mode+'&step=3'),atlas),l=L.arrange(v.nodes,s.root,{mobile,atlas:mode==='atlas',compact:mode==='compare'}),cards=[...l.positions.values()];
  assert.equal(cards.length,v.nodes.length);for(let i=0;i<cards.length;i++){assert.ok(Number.isFinite(cards[i].x));for(let j=i+1;j<cards.length;j++)assert.equal(L.overlap(cards[i],cards[j]),0,s.id+'/'+mode+'/'+mobile+': '+i+','+j);}
 }
 const v=W.visible(read('?case=hande&focus=yuanzhou&depth=2'),atlas);assert.ok(v.nodes.length<=20);assert.ok(v.nodes.some(n=>n.id==='jf'));
});
