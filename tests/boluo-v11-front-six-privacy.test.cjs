"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pages=["index","reality","industry-base","relations","impact","plan"];
test("public pages 01-06 offer an experience rather than a guide to private methods",()=>{
 for(const p of pages){
   const html=read("v11/"+p+".html");
   assert.match(html,/<h1\b/i,p+" page title");
   assert.doesNotMatch(html,/SmartPLS|PLS-SEM|\bSEM\b|\bSNA\b|蒙特卡洛|情报初筛|研究性归纳|模型参数校准|METHODS & EVIDENCE/i,p);
   assert.match(html,/href=["']\.\/wind\.html/,p+" keeps downstream route");
 }
});
test("01 discovery keeps questions and actual data scope without exposing how to prioritize them",()=>{
 const html=read("v11/index.html");
 assert.match(html,/这些变化，哪条和你有关/);
 assert.match(html,/id="inquiryButtons"/);
 assert.doesNotMatch(html,/你想先核对哪一种解释/);
});
test("02 statistics uses a fact-only data scope drawer, not a research walkthrough",()=>{
 const html=read("v11/reality.html");
 assert.match(html,/function openMethods\(\)/);
 assert.match(html,/function openAbout\(\)/);
 assert.match(html,/哪些是当前有的数据|当前有的数据/);
 assert.match(html,/统计窗口/);
 assert.doesNotMatch(html,/借鉴SEM|情报流转|信号入池规则|历史云团/);
 assert.match(html,/id="evidenceHeatmap"/);
});
test("03 industry retains real scenario controls, but explains sources without teaching method selection",()=>{
 const html=read("v11/industry-base.html");
 const js=read("v11/risk-lab.js"),viz=read("v11/risk-visuals.js");
 assert.match(html,/id="riskVisuals"/);
 assert.match(html,/data-case="projects"/);
 assert.match(html,/id="methodBtn"/);
 assert.match(js,/哪些是已公布的数字/);
 assert.doesNotMatch(js,/电子信息使用有界基期的复合增长条件核算|同季指数恢复测试|拟议抽样的最大误差分析/);
 assert.doesNotMatch(viz,/SEM路径系数|SNA \/ SEM/);
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(viz));
});
test("04 network relationship switches, sharing and provenance remain",()=>{
 const html=read("v11/relations.html");
 for(const id of ["stagePeriod","openSelectedEvidence","shareFinding","relationshipStage"])assert.ok(html.includes(id),id);
 for(const category of ["record","inferred","question"])assert.match(html,new RegExp('data-kind="'+category+'"'));
 assert.match(html,/待确认/);
});
test("05 and 06 retain interactions, and remove explanations of private research flow",()=>{
 const i=read("v11/impact.html"),p=read("v11/plan.html");
 const ii=read("v11/impact.js"),pp=read("v11/plan.js");
 assert.match(i,/data-case="orders"/);
 assert.match(i,/id="sourceFoot"/);
 assert.match(ii,/公开资料与结果边界/);
 assert.match(p,/data-region="urban"/);
 assert.match(p,/id="openMethod"/);
 assert.match(pp,/五个关注方向/);
 assert.doesNotMatch(pp,/五条路径是研究性归纳|本路径属于研究性归纳/);
 assert.doesNotThrow(()=>new Function(ii));
 assert.doesNotThrow(()=>new Function(pp));
});
