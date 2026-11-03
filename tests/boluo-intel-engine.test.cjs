const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Engine=require('../assets/boluo-intel-engine.js');
const read=k=>JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/relationship-'+k+'-v1.json'),'utf8'));
const data=[read('evidence'),read('changes'),read('sources')];
test('existing source bundle, event and relationship references validate',()=>{
 const s=Engine.withInputs(...data,'C004');
 assert.equal(s.recordCount.nodes,36);assert.equal(s.recordCount.edges,45);assert.equal(s.recordCount.sources,54);
 assert.equal(s.model.id,'C004');assert.ok(s.model.edges.length>0);
 assert.equal(s.missingSourceIds.length,0,'all actual event and edge references resolve');
});
test('uncertain evidence remains conditional, never auto promoted to observed edge',()=>{
 const s=Engine.withInputs(...data,'C004');
 const edges=s.edges.filter(x=>x.focus);
 assert.ok(edges.some(e=>e.grade==='C'),'signature case includes hypotheses');
 const a=Engine.inspect(s,{mode:'A'});
 const ab=Engine.inspect(s,{mode:'AB'});
 const all=Engine.inspect(s,{mode:'ABC'});
 assert.ok(a.scenarios[0].edges<=ab.scenarios[1].edges);
 assert.ok(ab.scenarios[1].edges<=all.scenarios[2].edges);
 assert.ok(a.scenarios[0].reachable<=all.scenarios[2].reachable);
 assert.ok(all.blindspots.some(b=>b.kind==='关系待核验'));
 assert.ok(all.blindspots.some(b=>b.kind==='机制盲区'));
});
test('a single-edge stress is deterministic and only changes recorded reachability',()=>{
 const s=Engine.withInputs(...data,'C006');
 const pivot=s.model.coreIds[0],base=Engine.inspect(s,{mode:'ABC',pivot});
 const edge=base.scan[0]?.edgeId;assert.ok(edge);
 const drop=Engine.inspect(s,{mode:'ABC',pivot,omitEdge:edge});
 const same=Engine.inspect(s,{mode:'ABC',pivot,omitEdge:edge});
 assert.equal(drop.runId,same.runId);
 assert.notEqual(drop.runId,base.runId);
 assert.ok(drop.after<=drop.baseline);
 assert.equal(drop.lostIds.length,drop.baseline-drop.after);
 assert.equal(drop.removed.edgeId,edge);
 assert.ok(drop.constraints.some(x=>x.includes('不证明')));
});
test('run export contains original inputs, exact conditions and investigator notes',()=>{
 const s=Engine.withInputs(...data,'C008'),run=Engine.inspect(s,{mode:'AB'});
 const exported=Engine.exportRun(s,run,'核验熟料生产线退出范围');
 assert.equal(exported.manifest.runId,run.runId);
 assert.equal(exported.inputs.evidence.edges.length,45);
 assert.equal(exported.inputs.changes.changes.length,12);
 assert.equal(exported.inputs.sources.sources.length,54);
 assert.match(exported.selection.analystNotes,/熟料/);
 const round=Engine.withInputs(exported.inputs.evidence,exported.inputs.changes,exported.inputs.sources,exported.selection.eventId);
 const replay=Engine.inspect(round,exported.selection);
 assert.equal(replay.runId,run.runId);
});
test('invalid references and missing source collection fail instead of hallucinating fallback',()=>{
 assert.throws(()=>Engine.withInputs(data[0],data[1],{sources:[]},'C999'),/没有找到变化/);
 const bad={...data[0],edges:[...data[0].edges,{...data[0].edges[0],edge_id:'FAIL',source_node_id:'not-an-entity'}]};
 assert.throws(()=>Engine.load(bad,data[1],data[2],'C001'),/关系端点缺失/);
});