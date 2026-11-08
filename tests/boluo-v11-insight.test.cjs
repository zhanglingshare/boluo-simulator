"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const window={};
vm.runInNewContext(read("v11/sem-demo.js"),{window});
vm.runInNewContext(read("v11/insight-engine.js"),{window});
const engine=window.BoluoInsightEngine;
const targets=window.BoluoSemDemo.targets;
test("three target layers expose five real question slots (not fake observations)",()=>{
 for(const name of ["growth","retention","resilience"]){
  const factors=engine.create(targets[name]);
  assert.equal(factors.length,5,name);
  assert.ok(factors.every(f=>f.missing&&f.why&&f.name&&f.link),name);
  assert.ok(factors.every(f=>f.importance>=0&&f.importance<=100&&f.performance>=0&&f.performance<=100));
 }
});
test("hypothetical cut changes the explanatory quantity, NOT underlying observed data",()=>{
 const f=engine.create(targets.growth),id=f[0].id;
 const before=engine.analyze(f,id,70,false),after=engine.analyze(f,id,70,true);
 assert.ok(before.current>after.current);
 assert.ok(Math.abs((before.current-after.current)-before.contribution)<1e-10);
 assert.equal(before.selected.name,after.selected.name);
 assert.equal(before.rows.length,after.rows.length);
 assert.ok(before.current<=100&&before.current>=0);
});
test("changing importance, operating quality or substitute capacity genuinely recomputes",()=>{
 const [f]=engine.create(targets.retention);
 const base=engine.exposure(f,70);
 const moreImportant={...f,importance:100};
 const improved={...f,performance:90};
 const substituted={...f,substitute:100};
 assert.ok(engine.exposure(moreImportant,70)>base);
 assert.ok(engine.exposure(improved,70)<base);
 assert.ok(engine.exposure(substituted,70)<base);
 assert.ok(engine.exposure(f,95)>engine.exposure(f,20));
 assert.equal(engine.exposure({...f,importance:100,performance:0,substitute:0},100),100);
 assert.equal(engine.exposure({...f,importance:100,performance:100,substitute:0},100),0);
});
test("heatmap 6-by-6 values are real scenario calculations",()=>{
 const f=engine.create(targets.resilience)[0];
 const heat=engine.grid(f);
 assert.equal(heat.length,6);
 assert.ok(heat.every(row=>row.length===6));
 for(const row of heat)for(const cell of row)assert.ok(Math.abs(cell.value-engine.exposure(f,cell.severity,cell.substitute))<1e-9);
 assert.ok(heat[0][0].value<heat[5][0].value);
 assert.ok(heat[5][0].value>heat[5][5].value);
});
test("new page works through a single linked state and is honest about data",()=>{
 const html=read("v11/insights.html"),js=read("v11/insight-workbench.js"),css=read("v11/insight-workbench.css");
 for(const id of ["iqNetworkNodes","iqNetworkLines","iqSeverity","iqImportance","iqPerformance","iqSubstitute",
  "iqHubValue","iqRankingBars","iqHeatGrid","iqComparisons","iqSever","iqRun","iqToWind","iqCopy","iqShareTop","iqWhy","iqMissing"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/不是GDP损失/);
 assert.match(html,/切断联系只表示暂不采用这条解释/);
 assert.match(html,/2026年前三季度/);
 assert.doesNotMatch(html,/SmartPLS|PLS-SEM|SEM|IPMA|Bootstrap|蒙特卡洛/);
 assert.match(js,/core\.analyze/);
 assert.match(js,/core\.grid/);
 assert.match(js,/state\.severity/);
 assert.match(js,/state\.cut/);
 assert.match(js,/history\.replaceState/);
 assert.match(js,/bs","bv","n","line","view","bp0"/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(read("v11/insight-engine.js")));
});
