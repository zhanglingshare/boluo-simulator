/* V11 Decision Brief data adapter v2. Public selections only; never invent absent results. */
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
const SHOCK=Object.freeze({delay:"关键项目晚一年",invest:"投资接续走弱",orders:"本地订单外流",traffic:"通勤压力上升"});
const CLAIM=Object.freeze({project:"投资下降，下一棒可能接不上。",orders:"工业增长，未必让本地配套受益。",people:"数字增长，未必同步改善居民获得。",agri:"农产品卖出去了，价值未必留在本地。"});
const RIVALS=Object.freeze({
 project:["现有产能仍可能支撑增长。","其他项目可能提前接棒。","投资统计期与生产周期可能错开。"],
 orders:["本地供应商可能已经拿到新订单。","供应链转移存在时间差。","利润和工资可能在别的环节体现。"],
 people:["就业机会可能滞后于项目投产。","通勤与居住条件可能正在改善。","收入变化可能没有被同步观察到。"],
 agri:["本地加工可能正在提高价值留存。","渠道与账期可能吞噬现金流。","产品结构与季节性可能改变表面表现。"]
});
const EVIDENCE=Object.freeze({
 project:["项目投产的真实进度","存量产能与订单","可替代项目的兑现记录"],
 orders:["真实的本地采购合同","配套企业客户结构","本地增加值与收入记录"],
 people:["实际新增岗位与到岗记录","真实通勤时间和成本","可比工资和就业数据"],
 agri:["本地加工量与加工损耗","渠道合同、账期与农户结算","分环节价格与收益记录"]
});
const PROOF=Object.freeze({unknown:"尚缺决定性证据",current:"用户自评：更支持原判断",alternative:"用户自评：更支持竞争解释"});
const REGION=Object.freeze({
 factories:{title:"工厂与订单",question:"工业增长以后，本地配套得到多少真实订单？",evidence:"采购合同、供应商与本地配套收益"},
 people:{title:"工作与生活",question:"产业聚集后，工作与生活配套能否真正接上？",evidence:"真实岗位、出行时耗和居住成本"},
 tourism:{title:"城市与乡村",question:"游客和农产品增长，收益到底在哪一环留下？",evidence:"过夜消费、农户与加工渠道收入"},
 cooperation:{title:"博罗与大湾区",question:"哪些外部联系值得加强，哪些依赖需要备选方案？",evidence:"跨城服务合同、客户集中度与替代成本"}
});
const REGION_LAYERS=Object.freeze({industry:"产业与订单",people:"人才与通勤",services:"生产性服务",rural:"农业与消费"});
const ROLES=Object.freeze({local:"本地做强",connect:"区域协作",resilient:"多元备份"});
const FLOWS=Object.freeze({
 manufacturing:{title:"制造业价值链",stages:["原材料","零部件","生产制造","研发与服务","销售与回款"]},
 agriculture:{title:"农产品价值链",stages:["种植采收","初加工","品牌包装","渠道销售","农户回款"]},
 tourism:{title:"游客消费链",stages:["客源到访","停留过夜","消费发生","渠道分配","本地留存"]}
});
const PLAN_ROUTES=Object.freeze({new:"新投产项目",manufacturing:"主导产业扩能",innovation:"创新转化",services:"生产性服务",connect:"融深融湾"});
const IMPACT_SCENES=Object.freeze({projects:"项目接续",industry:"产业变化",traffic:"通勤变化",orders:"订单变化",new:"项目接续"});
const PATHS=Object.freeze({new:"新项目兑现",manufacturing:"存量企业扩能",services:"本地价值链延伸",innovation:"创新与生产率",connect:"外部连接与城市承载"});
const HORIZONS=Object.freeze(["未设定","未来一个季度","未来半年","未来一年","下一轮统计发布","项目下一关键节点"]);
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const safeText=(v,max=160)=>typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
const safeDate=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v)?v:"";
function tryRead(store,key,fall){try{const s=store&&store.getItem(key);if(!s)return fall;const v=JSON.parse(s);return v===null?fall:v;}catch(e){return fall}}
function latest(store,key){const raw=tryRead(store,key,[]);return Array.isArray(raw)?raw.find(x=>x&&typeof x==="object")||null:null}
function cleanStat(x){if(!x||typeof x!=="object")return null;const arr=["p10","p50","p90"].map(k=>Number(x[k]));if(!arr.every(Number.isFinite)||arr.some(v=>v<0||v>1e6)||!(arr[0]<=arr[1]&&arr[1]<=arr[2]))return null;return {p10:arr[0],p50:arr[1],p90:arr[2]}}
function validScenario(s){return s&&SHOCK[s]!==undefined?s:""}
function cleanWindParams(p){
 if(!p||typeof p!=="object")return null;
 const out={};
 if(finite(p.baseScale))out.baseScale=clamp(p.baseScale,.6,1.4);
 if(finite(p.volScale))out.volScale=clamp(p.volScale,.5,1.8);
 if(finite(p.count))out.count=clamp(Math.round(p.count),2000,12000);
 if(Array.isArray(p.paths))out.paths=p.paths.slice(0,5).map(v=>finite(v)?clamp(v,.5,1.5):1);
 return Object.keys(out).length?out:null;
}
function cleanDistribution(d){
 if(!d||typeof d!=="object")return null;
 const out={};
 if(finite(d.threshold)&&d.threshold>=0&&d.threshold<=10000)out.threshold=d.threshold;
 if(["density","hist","cdf"].includes(d.view))out.view=d.view;
 return Object.keys(out).length?out:null;
}
function cleanPressure(p){
 if(!p||typeof p!=="object")return null;
 const keys=["dependency","shock","substitute"];
 if(!keys.every(k=>finite(p[k])&&p[k]>=0&&p[k]<=100))return null;
 const dependency=Math.round(p.dependency),shock=Math.round(p.shock),substitute=Math.round(p.substitute);
 return {dependency,shock,substitute,score:Math.round(dependency*shock*(100-substitute)/10000),adjusted:p.touched===true};
}
function load(store,session){
 const discovery=tryRead(store,KEYS.discovery,[]);
 const impact=latest(store,KEYS.impact);
 const plan=latest(store,KEYS.plan);
 const rawWind=latest(store,KEYS.wind);
 const rawSession=tryRead(session,KEYS.windTemporary,null);
 const insight=tryRead(store,KEYS.insight,null);
 const challenge=tryRead(store,KEYS.challenge,null);
 const region=tryRead(store,KEYS.region,null);
 const params=rawWind&&cleanWindParams(rawWind.baselineParams);
 const distribution=rawWind&&cleanDistribution(rawWind.distribution);
 const savedWind=rawWind&&validScenario(rawWind.shock)&&finite(rawWind.median)&&finite(rawWind.baseline)?{
  shock:rawWind.shock,name:SHOCK[rawWind.shock],strength:finite(rawWind.strength)?clamp(rawWind.strength,.6,1.4):1,
  buffer:Boolean(rawWind.buffer),active:rawWind.active!==false,median:rawWind.median,baseline:rawWind.baseline,
  paths:Array.isArray(rawWind.paths)?rawWind.paths.filter(x=>PATHS[x]).slice(0,3):[],
  pathLabels:Array.isArray(rawWind.paths)?rawWind.paths.filter(x=>PATHS[x]).slice(0,3).map(x=>PATHS[x]):[],
  primary:PATHS[rawWind.primary]?rawWind.primary:"",primaryLabel:PATHS[rawWind.primary]||"",
  scope:rawWind.scope==="selected"?"仅所选路径":"全县总体",date:safeDate(rawWind.savedAt),
  baselineParams:params,distribution,source:"saved"
 }:null;
 const temp=rawSession&&validScenario(rawSession.shock)&&cleanStat(rawSession.base)&&cleanStat(rawSession.stress)?{
  shock:rawSession.shock,strength:finite(rawSession.strength)?clamp(rawSession.strength,.6,1.4):1,buffer:Boolean(rawSession.buffer),
  base:cleanStat(rawSession.base),stress:cleanStat(rawSession.stress),date:safeDate(rawSession.savedAt)
 }:null;
 const paired=Boolean(savedWind&&temp&&savedWind.shock===temp.shock&&Math.abs(savedWind.strength-temp.strength)<.011&&savedWind.buffer===temp.buffer&&Math.abs(savedWind.median-temp.stress.p50)<.51&&Math.abs(savedWind.baseline-temp.base.p50)<.51);
 const chosenWind=savedWind||temp&&{shock:temp.shock,name:SHOCK[temp.shock],strength:temp.strength,buffer:temp.buffer,active:true,baseline:temp.base.p50,median:temp.stress.p50,date:temp.date,source:"temporary",paths:[],pathLabels:[],scope:"临时结果",baselineParams:null,distribution:null};
 const cleanDiscovery=Array.isArray(discovery)?discovery.filter(v=>v&&typeof v==="object"&&typeof v.inquiry==="string").slice(0,50).map(v=>({topic:safeText(v.topic,30),inquiry:safeText(v.inquiry,100),town:safeText(v.town,60),event:safeText(v.event,65)})):[];
 const cleanPlan=plan&&typeof plan==="object"&&safeText(plan.route,40)?{route:safeText(plan.route,40),routeTitle:PLAN_ROUTES[plan.route]||"已保存的规划方向",region:safeText(plan.region,60),year:String(plan.year||"").slice(0,4),date:safeDate(plan.savedAt)}:null;
 const cleanImpact=impact&&typeof impact==="object"&&safeText(impact.scene,40)?{scene:safeText(impact.scene,40),sceneTitle:IMPACT_SCENES[impact.scene]||"已保存影响链",step:Math.max(0,Math.min(4,Math.floor(Number(impact.step)||0))),date:safeDate(impact.savedAt)}:null;
 const cleanInsight=insight&&typeof insight==="object"&&safeText(insight.factor,50)?{
  focus:safeText(insight.target,40),factor:safeText(insight.factor,50),name:safeText(insight.name,100),missing:safeText(insight.missing,220),
  question:safeText(insight.question,230),date:safeDate(insight.savedAt)
 }:null;
 const cleanChallenge=challenge&&typeof challenge==="object"&&CLAIM[challenge.claim]?{
  claim:challenge.claim,title:CLAIM[challenge.claim],
  rival:Math.max(0,Math.min(2,Math.floor(Number(challenge.rival)||0))),
  rivalTitle:RIVALS[challenge.claim][Math.max(0,Math.min(2,Math.floor(Number(challenge.rival)||0)))],
  evidence:Math.max(0,Math.min(2,Math.floor(Number(challenge.evidence)||0))),
  evidenceTitle:EVIDENCE[challenge.claim][Math.max(0,Math.min(2,Math.floor(Number(challenge.evidence)||0)))],
  proof:PROOF[challenge.proof]?challenge.proof:"unknown",
  proofLabel:PROOF[challenge.proof]||PROOF.unknown,
  note:safeText(challenge.note,120),falsifier:safeText(challenge.falsifier,180),
  threshold:safeText(challenge.threshold,100),horizon:HORIZONS.includes(challenge.horizon)?challenge.horizon:"未设定",
  confidence:finite(challenge.confidence)?clamp(Math.round(challenge.confidence),0,100):50,
  date:safeDate(challenge.at),
  savedUrl:typeof challenge.url==="string"&&challenge.url.startsWith("https://zhanglingshare.github.io/boluo-simulator/")?challenge.url:""
 }:null;
 const pressure=region&&cleanPressure(region.pressure);
 const flow=region&&FLOWS[region.flow]?region.flow:"";
 const flowStage=flow&&Number.isInteger(region.flowStage)?clamp(region.flowStage,0,4):null;
 const cleanRegion=region&&typeof region==="object"&&REGION[region.topic]?{
  topic:region.topic,layer:REGION_LAYERS[region.layer]?region.layer:"",layerTitle:REGION_LAYERS[region.layer]||"未选择",
  title:REGION[region.topic].title,question:safeText(region.question,230)||REGION[region.topic].question,
  evidence:safeText(region.evidence,220)||REGION[region.topic].evidence,
  role:ROLES[region.role]?region.role:"",roleTitle:ROLES[region.role]||"",
  pressure,flow,flowTitle:flow?FLOWS[flow].title:"",
  flowStage,flowStageTitle:flowStage===null?"":FLOWS[flow].stages[flowStage],
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
 return {v:2,discovery:cleanDiscovery,impact:cleanImpact,plan:cleanPlan,wind:chosenWind,windSaved:!!savedWind,windRange:paired?temp:null,windRangeTemporary:!savedWind?temp:null,insight:cleanInsight,challenge:cleanChallenge,region:cleanRegion,steps,completed:steps.filter(s=>s.exists).length,total:steps.length};
}
function textSummary(d){
 const rows=["博罗 V11｜我的决策档案 2.0","公开事实：2025年GDP现价1005.45亿元；2026年前三季度规上工业增加值同比+8.9%，工业投资同比−44.7%（统计口径不同，不据此推断因果）。",""];
 if(d.wind){
  rows.push("【07 条件实验】"+d.wind.name+"；压力档位 "+d.wind.strength+"；缓冲 "+(d.wind.buffer?"开启":"关闭")+"；作用范围 "+d.wind.scope+"；基准P50 "+Math.round(d.wind.baseline)+"亿元，压力P50 "+Math.round(d.wind.median)+"亿元（"+(d.windSaved?"本机明确保存":"仅临时计算")+"，非真实预测）。");
  if(d.wind.pathLabels&&d.wind.pathLabels.length)rows.push("所选路径："+d.wind.pathLabels.join("、")+"。");
  if(d.wind.baselineParams)rows.push("基准条件："+JSON.stringify(d.wind.baselineParams)+"。");
 }else rows.push("【07 条件实验】尚无已保存的条件实验。");
 if(d.insight)rows.push("【08 待核实联系】"+(d.insight.name||d.insight.factor)+"；问题："+d.insight.question+"；缺失证据："+d.insight.missing+"。");
 if(d.challenge){
  rows.push("【09 竞争解释】原判断："+d.challenge.title+"；竞争解释："+d.challenge.rivalTitle+"；待检验证据："+d.challenge.evidenceTitle+"；状态："+d.challenge.proofLabel+"。");
  rows.push("反证条件："+(d.challenge.falsifier||"尚未填写")+"；阈值："+(d.challenge.threshold||"未设定")+"；期限："+d.challenge.horizon+"；主观确信："+d.challenge.confidence+"/100。");
 }
 if(d.region){
  rows.push("【10 区域观察】"+d.region.question+"；关注层："+d.region.layerTitle+"；角色假设："+(d.region.roleTitle||"未保存")+"；价值链："+(d.region.flowTitle||"未选择")+(d.region.flowStageTitle?" / "+d.region.flowStageTitle:"")+"。");
  if(d.region.pressure)rows.push("区域压力条件："+(d.region.pressure.adjusted?"滑杆已调整":"默认初始档位，未记录手动调整")+"；依赖 "+d.region.pressure.dependency+"/100；冲击 "+d.region.pressure.shock+"/100；替代能力 "+d.region.pressure.substitute+"/100；结构暴露指数 "+d.region.pressure.score+"/100（演示条件，不是经济损失或概率）。");
  rows.push("待补证据："+d.region.evidence+"。");
 }
 if(d.plan)rows.push("【06 规划关注】"+d.plan.routeTitle+(d.plan.region?" / "+d.plan.region:"")+"。");
 if(d.impact)rows.push("【05 影响观察】"+d.impact.sceneTitle+"；已保存影响链第 "+(d.impact.step+1)+" 步。");
 if(d.discovery.length)rows.push("【01 发现】保存了 "+d.discovery.length+" 条追问。");
 rows.push("","记录完整度："+d.completed+"/"+d.total+"个可保存环节。未保存不代表没有访问；缺失结果不补造。","本档案读取当前浏览器主动保存的选择，不是官方结论，不含私人模型或未公开算法。");
 return rows.join("\n");
}
return Object.freeze({KEYS,SHOCK,CLAIM,RIVALS,EVIDENCE,PROOF,REGION,REGION_LAYERS,ROLES,FLOWS,PLAN_ROUTES,IMPACT_SCENES,PATHS,HORIZONS,load,textSummary,cleanStat,cleanPressure,safeText});
});
