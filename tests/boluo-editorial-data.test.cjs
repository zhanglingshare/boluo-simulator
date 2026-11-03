const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const pages=[
 ['01','index-legacy-2026-11-03.html','today'],
 ['02','town.html','town'],
 ['03','industry-changes.html','changes'],
 ['04','who.html','basic'],
 ['05','relation-compare.html','comparison']
];
test('five cognition pages share the same real-world editorial system',()=>{
 for(const [n,p,role] of pages){
  const source=read(p);
  assert.match(source,new RegExp('data-bl-journey="'+role+'"'),n);
  assert.ok(source.includes('assets/boluo-editorial.css'),n+' theme');
  assert.ok(source.includes('assets/boluo-journey.js'),n+' nav');
  assert.equal((source.match(/<style\b/g)||[]).length,(source.match(/<\/style>/g)||[]).length,n+' css closing');
  for(const x of source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(x[1]),p);
 }
});
test('new 03 consumes reviewed changes and model without inventing direct news links',()=>{
 const js=read('assets/boluo-industry-changes.js');
 const source=read('industry-changes.html');
 assert.ok(source.includes('boluo-compare-model.js'));
 assert.match(js,/Model\.validate\(e,c\)/);
 assert.match(js,/Model\.build\(app\.evidence,app\.changes,app\.sources,id\)/);
 assert.match(js,/bl:change-selected/);
 assert.match(js,/relation-compare\.html\?change=/);
 assert.doesNotThrow(()=>new vm.Script(js));
 const history=json('data/relationship-changes-v1.json');
 assert.equal(history.changes.length,12);
});
test('01 and 02 use source snapshots, 02 shows 16 town entries',()=>{
 const hot=json('hot.json'),life=json('life.json');
 assert.equal(life.towns.length,16);
 assert.ok(hot.items.length>=10);
 assert.ok(read('town.html').includes('16个镇街'));
 const app=read('assets/boluo-editorial.js');
 assert.ok(app.includes("fetch('hot.json'"));
 assert.ok(app.includes("data-bl-journey")||app.includes("dataset.blJourney"));
 assert.ok(app.includes("new MutationObserver("));
 assert.doesNotThrow(()=>new vm.Script(app));
 assert.ok(read('index-legacy-2026-11-03.html').includes('id="forecastVote"'));
});
test('04 macro chart never mixes industrial enterprise counts with 100-million-yuan units',()=>{
 const src=read('who.html');
 assert.ok(src.includes("data:[970.87,1005.45]"));
 assert.ok(src.includes("data:['石湾规上','其他镇街规上']"));
 assert.ok(src.includes('value:327'));
 assert.ok(src.includes('value:1080'));
 assert.ok(!src.includes("石湾(企业数)"));
 assert.ok(!src.includes("formatter:'{value}亿'"));
 assert.ok(src.includes('51.88亿'));
 const audit=json('data/boluo-editorial-fact-audit-20261103.json');
 assert.equal(audit.baselines.find(x=>x.id==='gdp_2024').value,970.87);
 assert.equal(audit.baselines.find(x=>x.id==='gdp_2025').value,1005.45);
 assert.equal(audit.baselines.find(x=>x.id==='shiwan_regulated_enterprises_2025').value,327);
});
test('05 return to the canonical 03 while keeping the original advanced v9 page',()=>{
 assert.match(read('assets/boluo-compare.js'),/industry-changes\.html#change=/);
 assert.ok(read('industry-changes.html').includes('holo-home-v9.html'));
 assert.ok(read('relation-compare.html').includes('assets/boluo-editorial.css'));
 const nav=read('assets/boluo-journey.js');
 assert.match(nav,/changes:"industry-changes.html"/);
 assert.match(nav,/industry-changes\.html\?from=today/);
});
