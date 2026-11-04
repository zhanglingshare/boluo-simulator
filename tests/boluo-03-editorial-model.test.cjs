const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=require('../assets/boluo-compare-model.js');
const data=JSON.parse(read('data/relationship-evidence-v1.json'));
const changes=JSON.parse(read('data/relationship-changes-v1.json'));
const sources=JSON.parse(read('data/relationship-sources-v1.json'));

test('03 event observatory present, external script parses and 05 remains independent',()=>{
 const html=read('industry-changes.html'),js=read('assets/boluo-industry-changes.js');
 assert.match(html,/data-bl-journey="changes"/);
 assert.match(html,/assets\/boluo-journey\.js/);
 assert.match(html,/assets\/boluo-ui\.css/);
 assert.match(html,/assets\/boluo-compare-model\.js/);
 assert.match(html,/assets\/boluo-industry-changes\.js/);
 assert.match(html,/id="ec-graph"/);
 assert.match(html,/id="ec-feed-list"/);
 assert.match(html,/id="detailTitle"/);
 assert.match(html,/relation-compare\.html/);
 assert.match(html,/holo-home-v9\.html/);
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/drawGraph\(\)/);
 assert.match(js,/new CustomEvent\('bl:change-selected'/);
 assert.match(js,/Model\.build\(app\.evidence,app\.changes,app\.sources,id\)/);
});
test('all 12 events and 36/45 graph entries refer to actual published data',()=>{
 const maps=model.validate(data,changes);
 assert.equal(data.nodes.length,36);assert.equal(data.edges.length,45);
 assert.equal(changes.changes.length,12);assert.equal(sources.sources.length,54);
 assert.equal(maps.nodeMap.size,36);
 for(const change of changes.changes){
  const detail=model.build(data,changes,sources,change.change_id);
  assert.ok(detail.nodes.length>0);
  assert.ok(detail.edges.length>=detail.selectedEdges.length);
  assert.match(detail.caution,/并非两份完整历史网络快照/);
 }
});
test('03:C004 signed project is not classified as an operating supply link',()=>{
 const d=model.build(data,changes,sources,'C004');
 assert.deepEqual(d.nodes.filter(x=>x.pending).map(x=>x.id).sort(),['acc','crs','hpm','lcs']);
 assert.deepEqual(d.selectedEdges.map(e=>e.after),['hypothesis','hypothesis','hypothesis']);
});
test('main Skills packs were not silently overwritten and the 01→03 route is stable',()=>{
 const src=read('assets/boluo-journey.js');
 assert.match(src,/changes:"industry-changes.html"/);
 assert.match(src,/industry-changes\.html\?from=today/);
 assert.match(src,/industry-changes\.html\?from=town/);
 assert.match(read('index-legacy-2026-11-03.html'),/industry-changes\.html\?from=today&topic=/);
 assert.match(read('assets/boluo-compare.js'),/industry-changes\.html#change=/);
 const hot=JSON.parse(read('hot.json'));
 assert.ok(hot.items.length>=13&&hot.editorial_reviewed_at==='2026-11-03');
});
