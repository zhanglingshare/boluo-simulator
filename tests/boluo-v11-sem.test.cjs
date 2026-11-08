"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("07 presents real-world conditions rather than coefficient formulas",()=>{
 const html=read("v11/wind.html");
 for(const id of ["baseScale","baseVol","basePathControls","baseCount","baseRun","detailChart","quantileRows","detailThreshold","conditionBoard","conditionDelta","conditionToEight"])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const name of ["delay","orders","traffic"])assert.ok(html.includes('data-shock="'+name+'"'),name);
 assert.doesNotMatch(html,/SmartPLS|PLS-SEM|\bSEM\b|蒙特卡洛|Monte Carlo|中介、调节|路径系数|系数工作台|sem-demo\.js|path-lab\.js|sem-bridge\.js|sem-viz-stage\.js/);
 assert.match(html,/不是已经发生的未来/);
});
test("07 retains responsive, event-driven distributions and navigation",()=>{
 const html=read("v11/wind.html");
 for(const p of ["v11/wind.js","v11/wind-experiments.js","v11/condition-bridge.js","v11/wind-exp.css"])
  assert.ok(fs.existsSync(path.join(root,p)),p);
 for(const p of ["v11/wind.js","v11/wind-experiments.js","v11/condition-bridge.js"]){
  const src=read(p);assert.doesNotThrow(()=>new Function(src),p);
 }
 assert.match(read("v11/wind.js"),/boluo:wind-run/);
 assert.match(read("v11/wind.js"),/BoluoExperimentBaseline/);
 assert.match(read("v11/condition-bridge.js"),/BoluoWind/);
 assert.match(read("v11/condition-bridge.js"),/getDistributions/);
 assert.match(read("v11/wind-experiments.js"),/data-dist-view/);
 assert.match(read("v11/wind-experiments.js"),/quantileRows/);
 assert.match(html,/id="conditionToEight"/);
});
test("08 loads public questions separately from path coefficient demonstration",()=>{
 const html=read("v11/insights.html");
 assert.match(html,/insight-topics\.js/);
 assert.doesNotMatch(html,/sem-demo\.js/);
 assert.match(html,/id="iqNetworkNodes"/);
 assert.match(html,/id="iqHeatGrid"/);
 assert.match(html,/id="iqSever"/);
 assert.match(html,/切断联系只表示暂不采用这条解释/);
 const topics=read("v11/insight-topics.js");
 assert.doesNotMatch(topics,/xToM|mToY|moderation|calculate\(/);
 assert.doesNotThrow(()=>new Function(topics));
});
test("only public facts and results are described in current pages",()=>{
 for(const path of ["v11/wind.html","v11/insights.html"]){
  const html=read(path);
  assert.doesNotMatch(html,/SmartPLS|PLS-SEM|\bIPMA\b|蒙特卡洛|Monte Carlo|Bootstrap/);
 }
 assert.match(read("v11/wind.html"),/2025年GDP实际基数固定/);
 assert.match(read("v11/insights.html"),/不是GDP损失/);
});
