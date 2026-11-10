"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pages=["base-target","industry-chain","impact","plan","wind","insights","challenge","region","brief","future"];
const anchors={
 "base-target":["baseCompareYear","treeScene","gdpVal"],
 "industry-chain":["peerBars","peer-benchmark"],
 "impact":["explore","realCase"],
 "plan":["pathBuilder","pathGraph"],
 "wind":["detailChart","distChart","baselineConsole","detailThreshold"],
 "insights":["iqRankingBars","iqSever","iqLab"],
 "challenge":["evidenceOptions","verdictTitle","falsify"],
 "region":["valueFlow","regionalPressure"],
 "brief":["myPath","researchLedger","savedCount"],
 "future":["lab","time","redteam","linkChange"]
};
test("03—12 V11 pages include a single additive visual-story enhancement",()=>{
 for(const [i,p] of pages.entries()){
  const s=read("v11/"+p+".html");
  assert.match(s,/visual-story\.css\?v=20261111-v1/,p+" missing shared design");
  assert.match(s,/visual-story\.js\?v=20261111-v1/,p+" missing behavior");
  assert.equal((s.match(/visual-story\.js/g)||[]).length,1,p+" duplicated enhancement");
  for(const a of anchors[p])assert.ok(s.includes('id="'+a+'"'),p+" lost original "+a);
  assert.match(s,/<main\b/,p+" main removed");
  assert.match(s,/<\/main>/,p+" main closed");
 }
});
test("original wind-tunnel and research archive scripts keep their entrypoints",()=>{
 const w=read("v11/wind.html");
 for(const script of ["wind-experiments.js","wind.js","wind-pathway.js","model.js"])assert.ok(w.includes(script),"missing 07 dependency "+script);
 const b=read("v11/brief.html");
 for(const script of ["brief-data.js","brief.js","future-core.js"])assert.ok(b.includes(script),"missing 11 dependency "+script);
 const f=read("v11/future.html");
 for(const script of ["future-core.js","future.js"])assert.ok(f.includes(script),"missing 12 dependency "+script);
});
test("visual layer reads existing DOM and does not invent effects or replace domain models",()=>{
 const s=read("v11/visual-story.js"),css=read("v11/visual-story.css");
 assert.doesNotThrow(()=>new vm.Script(s,{filename:"visual-story.js"}));
 for(const name of ["#peerBars","#distChart","#iqRankingBars","#verdictTitle","#savedCount","#linkChange"])assert.ok(s.includes(name),"missing data binding "+name);
 for(const caution of ["不是已校准的现实预测","不是经过SEM估计","不做竞争力评分","不代表已发生的交易"])assert.ok(s.includes(caution),"missing uncertainty boundary "+caution);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/@media print/);
 assert.match(css,/v11-copy-folded/);
 assert.match(s,/function foldedText\(/);
 assert.doesNotMatch(s,/localStorage\.setItem|sessionStorage\.setItem|fetch\(/);
});
test("visual shortcuts connect to real controls instead of decorative no-ops",()=>{
 const s=read("v11/visual-story.js");
 for(const term of ['[data-path="','[data-shock]','[data-value-flow="','#iqSever','[data-proof="','getResult','snapshot'])assert.ok(s.includes(term),term);
});
