"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const D=require("../v11/brief-data.js");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const stamp="2026-11-11T02:00:00.000Z";
function storage(values={}){return {getItem:key=>Object.prototype.hasOwnProperty.call(values,key)?JSON.stringify(values[key]):null};}
const fixture={
 [D.KEYS.discovery]:[{topic:"industry",inquiry:"核实本地供应商订单",town:"石湾",event:"企业扩产"}],
 [D.KEYS.impact]:[{scene:"traffic",step:2,savedAt:stamp}],
 [D.KEYS.plan]:[{route:"connect",region:"博罗",year:"2030",savedAt:stamp}],
 [D.KEYS.wind]:[{shock:"orders",strength:1.2,buffer:true,active:true,paths:["manufacturing","services"],primary:"manufacturing",scope:"selected",median:1510,baseline:1580,baselineParams:{baseScale:1.05,volScale:1.1,count:5000,paths:[1,.9,1.1,1,1]},distribution:{threshold:1600,view:"cdf"},savedAt:stamp}],
 [D.KEYS.insight]:{target:"manufacturing",factor:"supplier",name:"本地配套采购",missing:"供应商所在地与采购合同",question:"新增订单究竟留在谁手上？",savedAt:stamp},
 [D.KEYS.challenge]:{v:2,claim:"orders",rival:2,evidence:0,proof:"alternative",note:"核实供应商清单",falsifier:"本地采购份额连续两个季度上升",threshold:"本地采购占比高于60%",horizon:"未来半年",confidence:72,at:stamp},
 [D.KEYS.region]:{topic:"cooperation",layer:"people",date:stamp,role:"resilient",flow:"agriculture",flowStage:4,pressure:{dependency:90,shock:90,substitute:10,score:999,touched:true}}
};
test("empty browser produces seven honest uncompleted stages and no fabricated experiment",()=>{
 const d=D.load(storage(),storage());
 assert.equal(d.completed,0);assert.equal(d.total,7);assert.equal(d.wind,null);assert.equal(d.region,null);
 assert.match(D.textSummary(d),/尚无已保存的条件实验/);
 assert.match(D.textSummary(d),/未保存不代表没有访问/);
});
test("research dossier retains bounded replay parameters and user-entered falsifiers",()=>{
 const d=D.load(storage(fixture),storage({[D.KEYS.windTemporary]:{shock:"orders",strength:1.2,buffer:true,base:{p10:1400,p50:1580,p90:1700},stress:{p10:1300,p50:1510,p90:1650},savedAt:stamp}}));
 assert.equal(d.completed,7);assert.equal(d.windSaved,true);
 assert.equal(d.wind.scope,"仅所选路径");
 assert.deepEqual(d.wind.pathLabels,["存量企业扩能","本地价值链延伸"]);
 assert.equal(d.wind.baselineParams.count,5000);
 assert.equal(d.wind.distribution.view,"cdf");
 assert.equal(d.windRange.stress.p50,1510);
 assert.equal(d.challenge.rivalTitle,"利润和工资可能在别的环节体现。");
 assert.equal(d.challenge.evidenceTitle,"真实的本地采购合同");
 assert.equal(d.challenge.falsifier,"本地采购份额连续两个季度上升");
 assert.equal(d.challenge.confidence,72);
 assert.equal(d.region.flowStageTitle,"农户回款");
 assert.equal(d.region.roleTitle,"多元备份");
 assert.deepEqual(d.region.pressure,{dependency:90,shock:90,substitute:10,score:73,adjusted:true});
 const summary=D.textSummary(d);
 for(const term of ["反证条件","本地采购占比高于60%","结构暴露指数 73/100","存量企业扩能","农户回款"])assert.ok(summary.includes(term),term);
 assert.doesNotMatch(summary,/SmartPLS|PLS-SNA|Monte Carlo|蒙特卡洛/);
});
test("untrusted and out-of-range scenario parameters are bounded or omitted",()=>{
 const bad={...fixture,[D.KEYS.wind]:[{shock:"orders",strength:9,buffer:false,median:100,baseline:120,baselineParams:{baseScale:8,volScale:-2,count:1,paths:[9,-3,1]},distribution:{threshold:99999,view:"private"},savedAt:stamp}]};
 const d=D.load(storage(bad),storage());
 assert.equal(d.wind.strength,1.4);
 assert.deepEqual(d.wind.baselineParams,{baseScale:1.4,volScale:.5,count:2000,paths:[1.5,.5,1]});
 assert.equal(d.wind.distribution,null);
 assert.equal(d.region.pressure.score,73);assert.equal(d.region.pressure.adjusted,true);
});
test("page 11 exposes a research trace, evidence backlog, replay and export controls",()=>{
 const h=read("v11/brief.html"),js=read("v11/brief.js"),css=read("v11/brief.css");
 for(const id of ["researchLedger","ledgerSaved","ledgerExperiments","ledgerFalsifiers","ledgerOpen","windAudit","challengeAudit","regionAudit","evidenceQueue","reportStamp"])assert.match(h,new RegExp('id="'+id+'"'));
 assert.match(h,/保存为 PDF/);assert.match(h,/可核对的记录 JSON/);
 assert.match(js,/buildWindReplay/);assert.match(js,/buildRegionReplay/);assert.match(js,/renderLedger/);assert.match(js,/boluo-v11-research-dossier/);
 assert.match(css,/\.ledger-grid/);assert.match(css,/\.evidence-queue/);assert.match(css,/@media print/);
 assert.doesNotThrow(()=>new Function(js));
});
test("page 10 replay link parser restores all three slider values and selected flow stage",()=>{
 const js=read("v11/region-lab.js");
 assert.ok(js.includes("v!==null&&/^[0-9]+$/.test(v)"));
 assert.match(js,/flowStage/);
 assert.doesNotThrow(()=>new Function(js));
});
