
/* UTEK capability engine V15: deterministic simulation, no external APIs. */
(function(root){ 'use strict';
const DIMS=['专业可靠性','证据完整度','适用边界','复用质量','协作连接','执行可控'];
const STAGES=['隐性经验','候选捕获','专家成文','影子验证','分级授权','成熟能力','跨站点复用'];
const PATHS=['词元协作','大模型直接处理','人工处理'];
const clamp=(x,l=0,h=1)=>Math.max(l,Math.min(h,x));
const round=(v,n=1)=>Number(v.toFixed(n));
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rnd(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
// Append-only event ledger. In-browser checksum is a non-cryptographic demo consistency check, NOT immutable secure auditing.
class Ledger {
 constructor(){this.events=[];this.seq=0;this.tip='GENESIS';}
 append(token,kind,payload,week){const seq=++this.seq; const ev={seq,id:'EV-'+String(seq).padStart(5,'0'),token,kind,week,...payload,prev:this.tip};const canonical=JSON.stringify(ev);ev.checksum=hash(canonical).toString(16).padStart(8,'0');this.tip=ev.checksum;this.events.push(Object.freeze(ev));return ev;}
 verify(){let prev='GENESIS';for(const ev of this.events){const {checksum,...body}=ev;if(ev.prev!==prev||hash(JSON.stringify(body)).toString(16).padStart(8,'0')!==checksum)return false;prev=checksum;}return true;}
 export(){return {warning:'完全合成的研发演示数据；前端校验链不具备密码学不可篡改性，不能替代生产审计',revision:'v15-p0',events:this.events,valid:this.verify()};}
}
function wilson(success,n,z=1.96){if(!n)return {lo:0,hi:1};let p=success/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return {lo:clamp(c-m),hi:clamp(c+m)};}
function gmean(a){return Math.pow(a.reduce((v,x)=>v*Math.max(.00001,x),1),1/a.length);}
function measurements(events,def){const calls=events.filter(e=>e.kind==='call'),n=calls.length; const successes=calls.filter(e=>e.success).length, reviews=calls.filter(e=>e.reviewAgree).length,incidents=calls.filter(e=>e.incident).length,critical=calls.filter(e=>e.critical).length,evCovered=calls.reduce((a,e)=>a+e.covered,0),evPossible=calls.reduce((a,e)=>a+e.possible,0),current=calls.filter(e=>e.fresh).length,within=calls.filter(e=>e.within).length,refusals=calls.filter(e=>e.refuseCorrect).length,invalid=calls.filter(e=>e.invalid).length,gateOk=calls.filter(e=>e.gateOk).length,observable=calls.filter(e=>e.observable).length,rollbackTests=calls.filter(e=>e.rollbackTest).length,rollbackOK=calls.filter(e=>e.rollbackOK).length;
const conf=wilson(successes,n),rev=wilson(reviews,n),ownerSet=new Set(calls.filter(e=>e.success).map(e=>e.caller)),domainSet=new Set(calls.filter(e=>e.success).map(e=>e.domain));
const reliability=conf.lo*rev.lo*(1-incidents/Math.max(1,n));
const evidence=clamp(evCovered/Math.max(1,evPossible))*.62+clamp(current/Math.max(1,n))*.20+clamp(calls.filter(e=>e.provenance).length/Math.max(1,n))*.18;
const bound=clamp(within/Math.max(1,n))*.55+clamp(refusals/Math.max(1,invalid))*.45;
const reuse=clamp(Math.log1p(ownerSet.size)/Math.log(9))*.36+clamp(Math.log1p(domainSet.size)/Math.log(5))*.30+clamp(calls.filter(e=>e.composed).length/Math.max(1,n))*.34;
const collaboration=clamp(def.team.length/6)*.32+clamp(calls.filter(e=>e.handoff).length/Math.max(1,n))*.38+clamp(calls.filter(e=>e.composed).length/Math.max(1,n))*.30;
const controllability=clamp(gateOk/Math.max(1,n))*.38+clamp(observable/Math.max(1,n))*.32+(rollbackTests?rollbackOK/rollbackTests:.5)*.20+clamp(1-def.risk/5)*.10;
const vals=[reliability,evidence,bound,reuse*Number(reliability>=.48),collaboration,controllability].map(x=>round(clamp(x)*100));
const mature=n>=30&&conf.lo>=.70&&vals.every(v=>v>=54)&&!critical&&vals[0]>=65&&vals[5]>=65;
const authority=critical?0:n<20?1:vals[5]<65||vals[0]<65?1:vals.every(v=>v>=70)&&n>=50?3:2;
const reasons=[...(critical?['出现严重事件：禁止自动执行']:[]),...(n<20?['样本少于20次：仅供参考']:[]),...(vals[0]<65?['专业可靠性偏低']:[]),...(vals[5]<65?['执行可控性偏低']:[])];
return {n,successes,reviews,incidents,critical,successRate:round(100*successes/Math.max(1,n)),confidence:{lo:round(conf.lo*100),hi:round(conf.hi*100)},dimensions:Object.fromEntries(DIMS.map((d,i)=>[d,vals[i]])),vals,maturity:round(100*gmean(vals.map(v=>Math.max(1,v)/100))),mature,authority,reasons,uniqueCallers:ownerSet.size,uniqueDomains:domainSet.size,failed:n-successes,rollbackTests,rollbackOK};}
function makeSamples(def,ledger,n=48){const r=rnd(hash(def.id));const token=def.token;ledger.append(token,'experience',{source:'synthetic_expert_interview',notes:'模拟捕获的一项隐性经验'},0);ledger.append(token,'captured',{source:'expert_practice',notes:'从典型任务中识别到候选经验'},0);
ledger.append(token,'draft',{owner:def.owner,boundary:def.domain,requiredEvidence:def.evidence},1);
for(let i=0;i<n;i++){const week=2+Math.floor(i/7),failure=r()<(.07+(100-def.initial)/550),incident=failure&&r()<.13,critical=incident&&def.risk===3&&r()<.27,possible=4,covered=2+(r()<.78?1:0)+(r()<.86?1:0);let e=ledger.append(token,'call',{success:!failure,reviewAgree:!failure||r()<.4,incident,critical,possible,covered,provenance:r()<.91,fresh:r()<.89,within:r()<.92,invalid:r()<.17,refuseCorrect:r()<.82,gateOk:r()<(.98-def.risk*.025),observable:r()<.97,rollbackTest:r()<.30,rollbackOK:r()<.97,caller:'U'+(1+Math.floor(r()*7)),domain:['总部','站点甲','站点乙','服务组'][Math.floor(r()*4)],composed:r()<.70,handoff:r()<.8,latency:round(7+r()*15),humanReview:r()<.58},week);if(failure&&r()<.7)ledger.append(token,'correction',{of:e.id,reviewer:def.owner,reason:'专家纠正或补充证据'},week);}
let metric=measurements(ledger.events.filter(e=>e.token===token),def);ledger.append(token,'shadow',{sampleCount:n,reviewer:def.owner},9);ledger.append(token,'authorization',{level:metric.authority,reviewer:def.owner,allowRealExecution:false},10);
if(metric.mature)ledger.append(token,'mature',{basis:'统计门槛通过',dimensionValues:metric.vals},11);
if(metric.mature&&metric.uniqueDomains>=2)ledger.append(token,'reuse',{domains:metric.uniqueDomains,compliance:'仍需跨站点审核'},12);
return metric;}
function funnel(events){const cnt={captured:0,draft:0,shadow:0,authorization:0,mature:0,reuse:0};for(const e of events)if(Object.hasOwn(cnt,e.kind))cnt[e.kind]++;return [{name:STAGES[0],count:events.filter(e=>e.kind==='experience').length},{name:STAGES[1],count:cnt.captured},{name:STAGES[2],count:cnt.draft},{name:STAGES[3],count:cnt.shadow},{name:STAGES[4],count:cnt.authorization},{name:STAGES[5],count:cnt.mature},{name:STAGES[6],count:cnt.reuse}];}
function benchmark(def,metric){const r=rnd(hash(def.id+'bench'));const original=def.base;let ref=metric.successRate/100, qualityBase=clamp(61+ref*30);return [
{name:PATHS[0],time:round(original*(.57+(100-metric.vals[0])*.002)),quality:round(qualityBase),cost:round(def.weight*(.48+r()*.13)),human:round(original*.28),caveat:'包含人工审核，尚未连接真实工具'},
{name:PATHS[1],time:round(original*(.64+r()*.12)),quality:round(qualityBase-8-r()*8),cost:round(def.weight*(.56+r()*.16)),human:round(original*.32),caveat:'裸模型输出需额外人工核验'},
{name:PATHS[2],time:round(original),quality:round(qualityBase-5-r()*5),cost:round(def.weight*(.89+r()*.15)),human:round(original*.95),caveat:'人工路径同样存在质量差异'}];}
function createWorld(scenarios){const ledger=new Ledger(),profiles={};for(const d of scenarios)profiles[d.id]=makeSamples(d,ledger,50);return {scenarios,ledger,profiles,updated(){this.profiles=Object.fromEntries(scenarios.map(d=>[d.id,measurements(ledger.events.filter(e=>e.token===d.token),d)]));return this.profiles;},run(id){const d=scenarios.find(s=>s.id===id);if(!d)throw Error('Unknown scenario');const n=ledger.events.filter(e=>e.kind==='call'&&e.token===d.token).length;const r=rnd(hash(id+'new'+n));const fail=r()<.10;ledger.append(d.token,'call',{success:!fail,reviewAgree:!fail,incident:false,critical:false,possible:4,covered:3,provenance:true,fresh:true,within:true,invalid:false,refuseCorrect:true,gateOk:true,observable:true,rollbackTest:false,rollbackOK:false,caller:'LIVE-USER',domain:d.domain,composed:true,handoff:true,latency:round(9+r()*4),humanReview:true},14+Math.floor(n/7));if(fail)ledger.append(d.token,'correction',{reason:'新增模拟失败，进入人工复核',reviewer:d.owner},14+Math.floor(n/7));this.updated();return {profile:this.profiles[d.id],paths:benchmark(d,this.profiles[d.id]),recent:ledger.events.filter(e=>e.token===d.token).slice(-7)};},stats(){const p=Object.values(this.profiles),events=ledger.events;return {tokens:p.length,calls:events.filter(e=>e.kind==='call').length,experienceCaptured:events.filter(e=>e.kind==='captured').length,approved:events.filter(e=>e.kind==='mature').length,weak:p.filter(x=>x.vals.some(v=>v<55)).length,lessons:events.filter(e=>e.kind==='correction').length,learningRate:round(events.filter(e=>e.kind==='mature').length/Math.max(1,events.filter(e=>e.kind==='captured').length)*100),verified:ledger.verify()};}};}
const api={DIMS,STAGES,PATHS,Ledger,wilson,measurements,makeSamples,funnel,benchmark,createWorld,hash};root.UTEK_ENGINE=api;
})(typeof window!=='undefined'?window:globalThis);
if(typeof module!=='undefined')module.exports=globalThis.UTEK_ENGINE;

