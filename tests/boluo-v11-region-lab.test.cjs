"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("page 10 includes interactive value chain, regional pressure test and role choices",()=>{
 const h=read("v11/region.html"),js=read("v11/region-lab.js"),css=read("v11/region.css");
 for(const id of ["valueFlowTrack","valueStageName","valueStageQuestion","valueStageEvidence","pressureDependency","pressureShock","pressureSubstitute","pressureScore","pressureComparisons","roleOptions","roleEvidence"])assert.match(h,new RegExp('id="'+id+'"'));
 for(const k of ["manufacturing","agriculture","tourism"])assert.match(h,new RegExp('data-value-flow="'+k+'"'));
 for(const k of ["local","connect","resilient"])assert.match(h,new RegExp('data-role="'+k+'"'));
 assert.match(js,/function score\(p\)/);assert.match(js,/boluo-v11-region-focus/);
 assert.match(css,/\.value-flow-track/);assert.match(css,/\.pressure-layout/);assert.match(css,/\.role-options/);
 assert.doesNotThrow(()=>new Function(js));
});
test("new experiment labels its output as scenario index, not measured economic loss",()=>{
 const h=read("v11/region.html");
 assert.match(h,/不是经济损失测算/);assert.match(h,/非实测金额/);assert.match(h,/不是企业实测、概率、GDP损失或因果系数/);
});
