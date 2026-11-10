"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const C=require("../v11/future-core.js"),root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const base={scene:"manufacturing",link:"m-supply",mode:"strengthen",intensity:70,year:2030};
test("three scenarios expose named nodes, evidence gaps and controlled relation candidates",()=>{
 assert.deepEqual(Object.keys(C.SCENES),["manufacturing","agriculture","commuting"]);
 for(const [key,s] of Object.entries(C.SCENES)){
  assert.ok(s.nodes.length>=6,key);
  assert.ok(s.edges.length>=6,key);
  assert.ok(s.candidates.length>=3,key);
  assert.ok(s.missing.length>=10,key);
  const ids=new Set(s.nodes.map(n=>n.id));
  for(const e of C.allEdges(s)){assert.ok(ids.has(e.a));assert.ok(ids.has(e.b));assert.ok(e.w>=0&&e.w<=1);}
 }
});
test("baseline remains fixed when one link is changed, and the 2026 worlds coincide",()=>{
 const a=C.simulate(base),b=C.simulate({...base,intensity:100,year:2030}),initial=C.simulate({...base,year:2026});
 assert.deepEqual(a.base,b.base);
 assert.deepEqual(initial.base,initial.future);
 assert.equal(initial.linkChange,0);
 assert.ok(a.linkChange>0);
 assert.ok(a.future.connection>a.base.connection);
 assert.equal(Object.keys(a.delta).length,4);
 assert.ok(a.edges.filter(x=>x.id===base.link).length===1);
});
test("removing a connection does not silently add another one",()=>{
 const result=C.simulate({...base,mode:"cut",intensity:100,year:2030});
 const edge=result.edges.find(e=>e.id==="m-supply");
 assert.equal(edge.w,0);
 assert.ok(result.future.connection<result.base.connection);
 assert.ok(result.linkChange<0);
 assert.equal(result.baseEdges.length,result.edges.length);
});
test("a new candidate link can be added without being labeled as an observed transaction",()=>{
 const result=C.simulate({scene:"agriculture",link:"a-new",mode:"add",intensity:95,year:2030});
 assert.equal(result.baseEdges.find(e=>e.id==="a-new").w,0);
 assert.ok(result.edges.find(e=>e.id==="a-new").w>.7);
 assert.ok(result.future.connection>result.base.connection);
 assert.match(result.link.gap,/真实|转化|成本/);
});
test("bounded state, URL reproducibility and saved snapshot validation",()=>{
 const invalid=C.validate({scene:"unknown",link:"missing",mode:"add",intensity:800,year:2080});
 assert.equal(invalid.scene,"manufacturing");
 assert.equal(invalid.intensity,100);
 assert.equal(invalid.year,2030);
 assert.equal(invalid.mode,"strengthen");
 const u=C.shareQuery(base),query=Object.fromEntries(new URLSearchParams(u));
 assert.deepEqual(C.validate(query),base);
 const saved=C.snapshot(base),clean=C.cleanSnapshot(saved);
 assert.ok(clean&&clean.summary.length>0);
 assert.deepEqual(clean.state,undefined);
 assert.deepEqual(clean.baseline,saved.baseline);
 assert.ok(Math.abs(clean.linkChange-saved.linkChange)<.001);
 assert.equal(C.cleanSnapshot({...saved,year:2090}),null);
 assert.equal(C.cleanSnapshot({...saved,scene:"invalid"}),null);
 assert.equal(C.cleanSnapshot({...saved,mode:"add"}),null);
 assert.equal(C.cleanSnapshot({...saved,savedAt:"invalid"}),null);
});
test("public descriptions prohibit causal or economic reinterpretation",()=>{
 const html=read("v11/future.html"),js=read("v11/future.js"),css=read("v11/future.css");
 for(const id of ["networkA","networkB","linkOptions","modeOptions","intensityRange","yearRange","yearValue","metricsGrid","trendChart","opportunity","tradeoff","evidenceGap","saveExperiment","copyFutureLink","exportFuture","historyList","worldTabA","worldTabB"])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const key of ["manufacturing","agriculture","commuting"])assert.match(html,new RegExp('data-scene="'+key+'"'));
 assert.match(html,/非真实企业交易/);
 assert.match(html,/非GDP、收益或概率/);
 assert.match(html,/不是对2027—2030年真实经济数据的预测/);
 assert.match(js,/C\.simulate/);assert.match(js,/localStorage\.setItem\(C\.STORE_KEY/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotThrow(()=>new Function(js));
});
