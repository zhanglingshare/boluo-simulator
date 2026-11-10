/* V11 Decision Brief data adapter. Public selections only; never invent absent results. */
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;root.BoluoBriefData=api;})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const KEYS=Object.freeze({
 discovery:"boluo-v11/discovery-questions/v1",
 impact:"boluo-impact-traces-v1",
 plan:"boluo-v11-plan-snapshots",
 wind:"boluo-v11-wind-experiments",
 windTemporary:"boluo-v11-challenge-07",
 insight:"boluo-v11-insight-focus",
 challenge:"boluo-v11-challenge-last",
 region:"boluo-v11-region-focus"
});
const SHOCK=Object.freeze({delay:"项目延期",invest:"投资接续走弱",orders:"订单外流",traffic:"通勤压力"});
const CLAIM=Object.freeze({project:"投资下降，下一棒可能接不上。",orders:"工业增长，未必让本地配套受益。",people:"数字增长，未必同步改善居民获得。"});
const PROOF=Object.freeze({unknown:"尚缺决定性证据",current:"用户自评：更支持原判断",alternative:"用户自评：更支持竞争解释"});
const REGION=Object.freeze({
 factories:{title:"工厂与订单",question:"工业增长以后，本地配套得到多少真实订单？",evidence:"采购合同、供应商与本地配套收益"},
 people:{title:"工作与生活",question:"产业聚集后，工作与生活配套能否真正接上？",evidence:"真实岗位、出行时耗和居住成本"},
 tourism:{title:"城市与乡村",question:"游客和农产品增长，收益到底在哪一环留下？",evidence:"过夜消费、农户与加工渠道收入"},
 cooperation:{title:"博罗与大湾区",question:"哪些外部联系值得加强，哪些依赖需要备选方案？",evidence:"跨城服务合同、客户集中度与替代成本"}
});
const PLAN_ROUTES=Object.freeze({new:"新投产项目",manufacturing:"主导产业扩能",innovation:"创新转化",services:"生产性服务",connect:"融深融湾"});
const IMPACT_SCENES=Object.freeze({projects:"项目接续",industry:"产业变化",traffic:"通勤变化",orders:"订单变化",new:"项目接续"});
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const safeText=(v,max=160)=>typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
const safeDate=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v)?v:"";
function tryRead(store,key,fall){try{const s=store&&store.getItem(key);if(!s)return fall;const v=JSON.parse(s);return v===null?fall:v;}catch(e){return fall}}
function latest(store,key){const raw=tryRead(store,key,[]);return Array.isArray(raw)?raw.find(x=>x&&typeof x==="object")||null:null}
function cleanStat(x){if(!x||typeof x!=="object")return null;const arr=["p10","p50","p90"].map(k=>Number(x[k]));if(!arr.every(Number.isFinite)||arr.some(v=>v<0||v>1e6)||!(arr[0]<=arr[1]&&arr[1]<=arr[2]))return null;return {p10:arr[0],p50:arr[1],p90:arr[2]}}
function validScenario(s){return s&&SHOCK[s]!==undefined?s:"";}
function load(store,session){
 const discovery=tryRead(store,KEYS.discovery,[]);
 const impact=latest(store,KEYS.impact);
 const plan=latest(store,KEYS.plan);
 const rawWind=latest(store,KEYS.wind);
 const rawSession=tryRead(session,KEYS.windTemporary,null);
 const insight=tryRead(store,KEYS.insight,null);
 const challenge=tryRead(store,KEYS.challenge,null);
 const region=tryRead(store,KEYS.region,null);
 const savedWind=rawWind&&validScenario(rawWind.shock)&&finite(rawWind.median)&&finite(rawWind.baseline)?{
  shock:rawWind.shock,name:SHOCK[rawWind.shock],strength:finite(rawWind.strength)?rawWind.strength:1,buffer:Boolean(rawWind.buffer),baseline:rawWind.baseline,median:rawWind.median,
  date:safeDate(rawWind.savedAt),source:"saved",baseParams:rawWind.baselineParams||null,distribution:rawWind.distribution||null
 }:null;
 const temp=rawSession&&validScenario(rawSession.shock)&&cleanStat(rawSession.base)&&cleanStat(rawSession.stress)?{
  shock:rawSession.shock,strength:finite(rawSession.strength)?rawSession.strength:1,buffer:Boolean(rawSession.buffer),
  base:cleanStat(rawSession.base),stress:cleanStat(rawSession.stress),date:safeDate(rawSession.savedAt)
 }:null;
 const paired=Boolean(savedWind&&temp&&savedWind.shock===temp.shock&&Math.abs(savedWind.strength-temp.strength)<0.011&&savedWind.buffer===temp.buffer&&Math.abs(savedWind.median-temp.stress.p50)<.51&&Math.abs(savedWind.baseline-temp.base.p50)<.51);
 const chosenWind=savedWind||temp&&{shock:temp.shock,name:SHOCK[temp.shock],strength:temp.strength,buffer:temp.buffer,baseline:temp.base.p50,median:temp.stress.p50,date:temp.date,source:"temporary"};
 const cleanDiscovery=Array.isArray(discovery)?discovery.filter(v=>v&&typeof v==="object"&&typeof v.inquiry==="string").slice(0,50).map(v=>({topic:safeText(v.topic,30),inquiry:safeText(v.inquiry,50),town:safeText(v.town,60),event:safeText(v.event,65)})):[];
 const cleanPlan=plan&&typeof plan==="object"&&safeText(plan.route,40)?{route:safeText(plan.route,40),routeTitle:PLAN_ROUTES[plan.route]||"已保存的规划方向",region:safeText(plan.region,60),year:String(plan.year||"").slice(0,4),date:safeDate(plan.savedAt)}:null;
 const cleanImpact=impact&&typeof impact==="object"&&safeText(impact.scene,40)?{scene:safeText(impact.scene,40),sceneTitle:IMPACT_SCENES[impact.scene]||"已保存影响链",step:Math.max(0,Math.min(4,Math.floor(Number(impact.step)||0))),date:safeDate(impact.savedAt)}:null;
 const cleanInsight=insight&&typeof insight==="object"&&safeText(insight.factor,50)?{
  focus:safeText(insight.target,40),factor:safeText(insight.factor,50),name:safeText(insight.name,100),missing:safeText(insight.missing,220),
  question:safeText(insight.question,230),date:safeDate(insight.savedAt)
 }:null;
 const cleanChallenge=challenge&&typeof challenge==="object"&&CLAIM[challenge.claim]?{
  claim:challenge.claim,title:CLAIM[challenge.claim],
  rival:Math.max(0,Math.min(2,Math.floor(Number(challenge.rival)||0))),
  evidence:Math.max(0,Math.min(2,Math.floor(Number(challenge.evidence)||0))),
  proof:PROOF[challenge.proof]?challenge.proof:"unknown",
  note:safeText(challenge.note,120),date:safeDate(challenge.at),
  savedUrl:typeof challenge.url==="string"&&challenge.url.startsWith("https://zhanglingshare.github.io/boluo-simulator/")?challenge.url:""
 }:null;
 const cleanRegion=region&&typeof region==="object"&&REGION[region.topic]?{
  topic:region.topic,layer:safeText(region.layer,30),title:REGION[region.topic].title,
  question:safeText(region.question,230)||REGION[region.topic].question,
  evidence:safeText(region.evidence,220)||REGION[region.topic].evidence,
  role:({local:"本地做强",connect:"区域协作",resilient:"多元备份"})[region.role]||"",
  exposure:region.pressure&&finite(region.pressure.score)?Math.max(0,Math.min(100,Math.round(region.pressure.score))):null,
  flow:({manufacturing:"制造业价值链",agriculture:"农产品价值链",tourism:"游客消费链"})[region.flow]||"",
  date:safeDate(region.date)
 }:null;
 const steps=[
  {id:"discovery",name:"发现",page:"index.html",exists:cleanDiscovery.length>0,detail:cleanDiscovery.length+"条已保存追问"},
  {id:"impact",name:"影响",page:"impact.html",exists:!!cleanImpact,detail:cleanImpact?cleanImpact.sceneTitle:"尚未保存"},
  {id:"plan",name:"规划",page:"plan.html",exists:!!cleanPlan,detail:cleanPlan?cleanPlan.routeTitle:"尚未保存"},
  {id:"wind",name:"风洞",page:"wind.html",exists:!!savedWind,detail:savedWind?"已保存条件实验":temp?"只有临时结果":"尚未保存"},
  {id:"insight",name:"联系",page:"insights.html",exists:!!cleanInsight,detail:cleanInsight?cleanInsight.name||"已保存关系":"尚未保存"},
  {id:"challenge",name:"反驳",page:"challenge.html",exists:!!cleanChallenge,detail:cleanChallenge?"已保存判断":"尚未保存"},
  {id:"region",name:"区域",page:"region.html",exists:!!cleanRegion,detail:cleanRegion?cleanRegion.title:"尚未保存"}
 ];
 return {v:1,discovery:cleanDiscovery,impact:cleanImpact,plan:cleanPlan,wind:chosenWind,windSaved:!!savedWind,windRange:paired?temp:null,windRangeTemporary:!savedWind?temp:null,insight:cleanInsight,challenge:cleanChallenge,region:cleanRegion,steps,completed:steps.filter(s=>s.exists).length,total:steps.length};
}
function textSummary(d){
 const rows=["博罗 V11｜我的决策报告","公开事实：2026年前三季度规上工业增加值 +8.9%，工业投资 −44.7%（不同口径，不可推断因果）。"];
 if(d.wind)rows.push("条件实验："+d.wind.name+"；基准中位数 "+Math.round(d.wind.baseline)+" 亿元，调整后中位数 "+Math.round(d.wind.median)+" 亿元（"+(d.windSaved?"本机已保存":"临时计算")+"；非真实预测）。");
 if(d.insight)rows.push("待核实联系："+(d.insight.name||d.insight.factor)+"；证据："+d.insight.missing);
 if(d.challenge)rows.push("我的判断："+d.challenge.title+"；"+PROOF[d.challenge.proof]+"。");
 if(d.region)rows.push("区域追问："+d.region.question);
 rows.push("已保存的环节："+d.completed+"/"+d.total+"。未保存不代表没有访问；缺失结果不补造。");
 rows.push("本报告基于当前浏览器已保存的选择，内容不是官方政策结论或企业实测。");
 return rows.join("\n");
}
return Object.freeze({KEYS,SHOCK,CLAIM,PROOF,REGION,PLAN_ROUTES,load,textSummary,cleanStat,safeText});
});