const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const data=JSON.parse(read('data/boluo-plan-life.v1.json'));
test('planning goals have dated sources and explicit limitations',()=>{
 assert.equal(data.schema,'boluo-plan-life-v1');
 assert.ok(data.updatedAt<=new Date().toISOString().slice(0,10));
 assert.ok(data.sources.some(s=>s.type.includes('官方')));
 assert.equal(data.headlineMetrics.find(x=>x.id==='gdp').baseline,1005.45);
 assert.equal(data.headlineMetrics.find(x=>x.id==='gdp').target,1600);
 assert.ok(data.headlineMetrics.every(x=>x.caution&&x.sources.length>=1));
 const ids=new Set(data.sources.map(x=>x.id));
 for(const m of data.headlineMetrics)assert.ok(m.sources.every(x=>ids.has(x)),m.id+' has unknown provenance');
 for(const s of data.sources){assert.match(s.url,/^https?:\/\/.+/);assert.ok(s.title);}
});
test('all planning edges have concrete conditional mechanisms, never economic loss numbers',()=>{
 const roles=new Set(data.roles.map(x=>x.id)),shocks=new Set(data.shocks.map(x=>x.id)),src=new Set(data.sources.map(x=>x.id));
 assert.ok(data.roles.length>=6);assert.ok(data.themes.length>=5);
 for(const theme of data.themes){
  assert.ok(theme.sources.length>=1&&theme.sources.every(x=>src.has(x)),theme.id);
  assert.ok(shocks.has(theme.pressure),theme.id);
  assert.ok(theme.blindspot.length>10,theme.id);
  for(const r of theme.roles){
   assert.ok(roles.has(r),theme.id+' unknown role');
   assert.equal(theme.mechanisms[r].length,4,theme.id+' mechanism must show four explicit gates for '+r);
  }
 }
 assert.ok(data.note.includes('未在本版本'));
});
test('six pages include shared design and a native, accessible next-step progression',()=>{
 const pages=['index-legacy-2026-11-03.html','town.html','industry-changes.html','who.html','relation-compare.html','plan-with-me.html'];
 for(const page of pages){
  const html=read(page);
  assert.match(html,/assets\/boluo-ui.css/,page);
  assert.match(html,/class="[^"]*mh-six/,page);
  assert.match(html,/data-bl-journey=/,page);
 }
 const j=read('assets/boluo-journey.js');
 assert.match(j,/planning:"plan-with-me\.html"/);
 assert.match(j,/\["06","planning","规划与你"\]/);
 assert.match(j,/nextAnchor\.href="choices\.html"/);
 assert.match(j,/dest="plan-with-me\.html\?from=comparison"/);
});
test('single visual system keeps contrast, graph semantics and reduced motion',()=>{
 const css=read('assets/boluo-ui.css');
 assert.match(css, /--ui-bg:#0e1420/);
 assert.match(css, /--ui-text:#eef2fb/);
 assert.match(css, /--ui-blue:#5ac8fa/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /focus-visible/);
 assert.match(css, /ec-graph-label/);
 assert.doesNotMatch(css, /drop-shadow\(/);
 for(const p of ['future-lab.html','future.html','report.html','experiments/holo-single/index.html','tea/index.html']){
  assert.match(read(p), /assets\/boluo-system.js/);
  assert.match(read(p), /assets\/boluo-ui.css/);
 }
});
