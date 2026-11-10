"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("page 10 exists, covers data, region graph, tradeoffs and a user question",()=>{
 const h=read("v11/region.html");
 for(const id of ["regionRows","compareValue","regionalGraph","graphNodes","graphEdges","graphParticles","focusName","focusMissing","tradeoffCards","tradeoffEvidence","questionPicker","chosenQuestion","downloadQuestion","shareCanvas","valueFlowTrack","valueStageEvidence","pressureDependency","pressureShock","pressureSubstitute","pressureScore","pressureComparisons","roleOptions","roleEvidence"])assert.match(h,new RegExp('id="'+id+'"'));
 for(const layer of ["industry","people","services","rural"])assert.match(h,new RegExp('data-layer="'+layer+'"'));
 for(const key of ["all","fact","plan","question"])assert.match(h,new RegExp('data-filter="'+key+'"'));
 assert.match(h,/2025 · 第二产业占GDP比重/);
 assert.match(h,/54\.6/);assert.match(h,/56\.1/);
 assert.match(h,/暂无|待核实|不能|不预设/);
});
test("comparison uses actual 2025 official series with correct footnotes and no fake scoring",()=>{
 const h=read("v11/region.html"),js=read("v11/region.js");
 assert.match(js,/10\.7,54\.6,34\.7/);
 assert.match(js,/\.3,56\.1,43\.6/);
 assert.match(js,/3\.4,27\.6,69\.0/);
 assert.match(h,/tjj\.dg\.gov\.cn\/tjzl\/tjgb/);
 assert.match(h,/www\.hcq\.gov\.cn/);
 assert.match(h,/maptable\.com\/tjgb/);
 assert.match(h,/不是竞争力评分/);
 assert.match(h,/非实测金额/);
 assert.match(h,/不是经济损失测算/);
});
test("no unverified economic network is presented as observed commerce",()=>{
 const h=read("v11/region.html"),js=read("v11/region.js");
 assert.match(h,/属地或公开事实/);
 assert.match(h,/规划与协作方向/);
 assert.match(h,/待核实的经济联系/);
 assert.match(h,/不表示经济贡献或真实依赖强度/);
 assert.doesNotMatch(h+js,/SmartPLS|PLS-SEM|\bSEM\b|\bSNA\b|蒙特卡洛|结构系数权重|因果系数|真实交易概率/);
 assert.doesNotThrow(()=>new Function(js));
});
test("page 10 integrates all nine pages, and does not point to a nonexistent 11th page",()=>{
 const pages=["index","reality","industry-base","relations","impact","plan","wind","insights","challenge"];
 for(const p of pages)assert.match(read("v11/"+p+".html"),/href="\.\/region\.html"/,p+" link to 10");
 const h=read("v11/region.html");
 for(const page of pages)assert.ok(h.includes('href="./'+page+'.html"'),page+" from 10");
 assert.doesNotMatch(h,/href=["'][^"']*(future-lab|page11|11\.html)/);
});
