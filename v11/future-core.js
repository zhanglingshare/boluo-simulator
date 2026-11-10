/* Boluo V11 Page 12 — illustrative structural relationship experiments.
   Not an empirical causal model or forecast. All link weights and output indices are
   controlled teaching assumptions, never inferred actual trade, jobs or revenue. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.BoluoFutureCore=api;
})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const YEAR_START=2026,YEAR_END=2030,STORE_KEY="boluo-v11-future-snapshots-v1";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const NODE=(id,label,x,y,kind="local")=>({id,label,x,y,kind});
const EDGE=(id,a,b,label,w,kind="hypothesis")=>({id,a,b,label,w,kind});
const SCENES={
 manufacturing:{
  title:"工业 · 本地配套",short:"制造业",question:"把一条本地订单连接得更稳，会改变谁的处境？",
  insight:"采购留在本地并不必然提高竞争力。认证、交付和成本也可能成为新的门槛。",
  origin:"factory",local:["supplier","jobs","quality","logistics"],missing:"企业真实采购合同、认证与交付周期、供应商报价和本地新增岗位",
  nodes:[NODE("factory","博罗制造",175,245,"hub"),NODE("supplier","本地配套",420,118),NODE("quality","认证检测",665,85),NODE("logistics","物流服务",430,365),NODE("market","区域市场",860,265,"external"),NODE("jobs","本地就业",667,407),NODE("finance","账期资金",670,265)],
  edges:[EDGE("m-supply","factory","supplier","本地采购？",.34),EDGE("m-quality","supplier","quality","认证链？",.28),EDGE("m-market","factory","market","销售渠道？",.63),EDGE("m-logistics","factory","logistics","物流连接？",.52),EDGE("m-jobs","factory","jobs","岗位传导？",.4),EDGE("m-funding","supplier","finance","资金周转？",.37),EDGE("m-sale","supplier","market","配套外销？",.23),EDGE("m-support","logistics","jobs","物流就业？",.18)],
  candidates:[
   {id:"m-supply",title:"制造 ↔ 本地配套",benefit:"可能增加本地配套的参与机会",tradeoff:"可能提高认证、质量管理和交付协调成本",gap:"按企业和季度取得真实本地采购额、订单履约率与报价对比"},
   {id:"m-quality",title:"配套 ↔ 认证检测",benefit:"可能减少供应商进入新订单的门槛",tradeoff:"新增认证投入也可能推高小企业成本",gap:"核实认证通过率、等待时间、费用与客户验厂结果"},
   {id:"m-logistics",title:"制造 ↔ 物流服务",benefit:"可能改善交付稳定性",tradeoff:"如果只依赖一家物流服务商，韧性可能下降",gap:"实际物流合同、运输时效、备选服务商及成本"},
   {id:"m-new",from:"quality",to:"market",title:"认证 ↔ 区域市场（新联系）",benefit:"可能打开新客户渠道",tradeoff:"外部客户集中度可能同步升高",gap:"潜在采购方、样品测试结果和真实订单转化"}
  ]
 },
 agriculture:{
  title:"农业 · 柏塘价值链",short:"柏塘山茶",question:"茶叶卖出去了，农户与加工环节谁先受益？",
  insight:"加工或渠道更强，未必代表农户回款更快。货款账期和垫资责任必须分开。",
  origin:"grower",local:["processor","brand","grower","jobs"],missing:"茶农收款日期、加工厂垫资台账、渠道真实结算合同、分等级售价及损耗",
  nodes:[NODE("grower","柏塘茶农",175,265,"hub"),NODE("processor","初加工",402,120),NODE("brand","品牌包装",665,90),NODE("channel","外部渠道",865,275,"external"),NODE("settlement","结算账期",665,365),NODE("jobs","季节用工",404,425),NODE("retail","本地商户",665,245)],
  edges:[EDGE("a-process","grower","processor","茶叶加工？",.55),EDGE("a-brand","processor","brand","品牌合作？",.26),EDGE("a-channel","brand","channel","外部渠道？",.5),EDGE("a-settlement","channel","settlement","货款回收？",.3),EDGE("a-paying","settlement","grower","农户结算？",.22),EDGE("a-labor","grower","jobs","季节用工？",.49),EDGE("a-retail","processor","retail","本地零售？",.32),EDGE("a-shop","retail","channel","区域销售？",.23)],
  candidates:[
   {id:"a-process",title:"茶农 ↔ 初加工",benefit:"可能提高本地加工参与度",tradeoff:"加工损耗和垫资压力也可能扩大",gap:"分等级加工收益、损耗率与收购价"},
   {id:"a-paying",title:"结算 ↔ 茶农",benefit:"可能改善农户实际回款节奏",tradeoff:"若渠道货款未到，加工企业可能承担更大垫资压力",gap:"农户实际收款日期、加工商垫资与渠道回款对照"},
   {id:"a-brand",title:"加工 ↔ 品牌",benefit:"可能形成产品溢价",tradeoff:"版费、起订量和渠道抽成可能吞噬增值",gap:"真实包装版费、起订量、等级售价与毛利"},
   {id:"a-new",from:"grower",to:"retail",title:"茶农 ↔ 本地商户（新联系）",benefit:"可能缩短部分销售链条",tradeoff:"自销可能占用农户生产时间和获客成本",gap:"直销转化率、客单价与配送成本"}
  ]
 },
 commuting:{
  title:"通勤 · 就业生活",short:"工作与生活",question:"新增岗位之后，通勤能不能真正接上生活？",
  insight:"通勤连接加强不等于人人通勤变短，住房成本、班次和服务可达性仍可能形成新瓶颈。",
  origin:"factory",local:["jobs","homes","services","route"],missing:"真实岗位到岗、起终点OD样本、高峰时段通勤、实际租金和公共服务使用",
  nodes:[NODE("factory","产业岗位",175,245,"hub"),NODE("jobs","实际到岗",425,112),NODE("route","通勤通道",666,128),NODE("homes","可负担住房",860,275),NODE("services","生活服务",656,422),NODE("center","惠城服务",185,430,"external"),NODE("skill","人才培训",425,344)],
  edges:[EDGE("c-jobs","factory","jobs","岗位到岗？",.42),EDGE("c-route","jobs","route","通勤可达？",.37),EDGE("c-homes","route","homes","职住连接？",.3),EDGE("c-services","homes","services","生活配套？",.45),EDGE("c-skills","factory","skill","技能匹配？",.36),EDGE("c-training","skill","jobs","培训转化？",.29),EDGE("c-center","center","services","跨区服务？",.27),EDGE("c-work","jobs","services","工作生活？",.21)],
  candidates:[
   {id:"c-route",title:"岗位 ↔ 通勤通道",benefit:"可能改善岗位与住所之间的可达性",tradeoff:"交通改善也可能提高远距离通勤吸引力，改变住房需求",gap:"实测高峰OD、班次、通勤费用与不同群体的受益"},
   {id:"c-homes",title:"通勤 ↔ 住房",benefit:"可能让更多岗位匹配可负担住房",tradeoff:"住房供给不等于实际租得起、住得稳",gap:"租金、收入、实际入住和高峰通勤时间"},
   {id:"c-training",title:"培训 ↔ 到岗",benefit:"可能缓解技能岗位的招聘缺口",tradeoff:"培训结业不等于企业实际录用",gap:"岗位要求、受训人数、企业真实到岗及留任"},
   {id:"c-new",from:"center",to:"route",title:"跨区服务 ↔ 通勤（新联系）",benefit:"可能改善跨区域生活服务可达性",tradeoff:"对跨区服务依赖也可能提高家庭出行成本",gap:"跨区就医就学OD、时耗与真实服务使用"}
  ]
 }
};
for(const [key,s] of Object.entries(SCENES)){
 const ids=new Set(s.nodes.map(n=>n.id));
 if(!ids.has(s.origin)||s.nodes.some(n=>!ids.has(n.id))||s.edges.some(e=>!ids.has(e.a)||!ids.has(e.b)||e.a===e.b))throw new Error("Invalid future scene "+key);
 for(const c of s.candidates){const e=s.edges.find(e=>e.id===c.id);if(!e&&(!ids.has(c.from)||!ids.has(c.to)))throw new Error("Invalid future candidate "+c.id);}
}
const clampScore=n=>Math.round(clamp(n,0,100)*10)/10;
function allEdges(scene){return scene.edges.concat(scene.candidates.filter(c=>!scene.edges.some(e=>e.id===c.id)).map(c=>EDGE(c.id,c.from,c.to,c.title,0)));}
function validate(raw){
 const scene=SCENES[raw&&raw.scene]?raw.scene:"manufacturing",s=SCENES[scene];
 const candidate=s.candidates.find(c=>c.id===(raw&&raw.link))||s.candidates[0],has=s.edges.some(e=>e.id===candidate.id);
 const allowed=has?["strengthen","weaken","cut"]:["add"];
 const mode=allowed.includes(raw&&raw.mode)?raw.mode:(has?"strengthen":"add");
 return {scene,link:candidate.id,mode,intensity:clamp(Math.round(Number(raw&&raw.intensity)||0),0,100),year:clamp(Math.round(Number(raw&&raw.year)||YEAR_START),YEAR_START,YEAR_END)};
}
function getCandidate(state){return SCENES[state.scene].candidates.find(c=>c.id===state.link);}
function yearsProgress(year){return clamp((year-YEAR_START)/(YEAR_END-YEAR_START),0,1);}
function changedWeight(base,mode,intensity,year){
 const x=clamp(intensity/100,0,1)*yearsProgress(year);
 if(mode==="add")return clamp(.82*x,0,1);
 if(mode==="strengthen")return clamp(base+(1-base)*.88*x,0,1);
 if(mode==="weaken")return clamp(base*(1-.88*x),0,1);
 if(mode==="cut")return clamp(base*(1-x),0,1);
 return base;
}
function metrics(scene,edges){
 const ids=scene.nodes.map(n=>n.id),n=ids.length,idx=Object.fromEntries(ids.map((id,i)=>[id,i]));
 const matrix=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
 let active=0,total=0;
 for(const e of edges){
  const a=idx[e.a],b=idx[e.b],w=clamp(e.w,0,1);
  matrix[a][b]=Math.max(matrix[a][b],w);matrix[b][a]=Math.max(matrix[b][a],w);
  total+=w;if(w>.03)active++;
 }
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)matrix[i][j]=Math.max(matrix[i][j],matrix[i][k]*matrix[k][j]);
 const src=idx[scene.origin],local=scene.local.filter(id=>id!==scene.origin);
 const localValue=local.reduce((sum,id)=>sum+matrix[src][idx[id]],0)/Math.max(1,local.length);
 let reach=0,count=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){reach+=matrix[i][j];count++;}
 const avgReach=reach/Math.max(count,1);
 const degree=Array(n).fill(0),sum=Array(n).fill(0);
 for(const e of edges){const a=idx[e.a],b=idx[e.b],w=clamp(e.w,0,1);degree[a]+=(w>.08?1:0);degree[b]+=(w>.08?1:0);sum[a]+=w;sum[b]+=w;}
 const redundancy=degree.reduce((s,v)=>s+clamp((v-1)/3,0,1),0)/n;
 const concentration=(Math.max(...sum)/Math.max(sum.reduce((a,b)=>a+b,0),.01));
 return {
  local:clampScore(localValue*100),
  connection:clampScore(avgReach*100),
  resilience:clampScore((.6*avgReach+.4*redundancy)*(1-.3*concentration)*100),
  coordination:clampScore(clamp(12+total/n*30+active/n*5,0,100))
 };
}
function simulate(raw){
 const state=validate(raw),scene=SCENES[state.scene],candidate=getCandidate(state),baseEdges=allEdges(scene);
 const modified=baseEdges.map(e=>({...e,w:e.id===candidate.id?changedWeight(e.w,state.mode,state.intensity,state.year):e.w}));
 const base=metrics(scene,baseEdges),future=metrics(scene,modified);
 const changed=modified.find(e=>e.id===candidate.id),baseline=baseEdges.find(e=>e.id===candidate.id);
 const impact=Math.round((changed.w-baseline.w)*1000)/10;
 const delta={};for(const k of ["local","connection","resilience","coordination"])delta[k]=Math.round((future[k]-base[k])*10)/10;
 const source=scene.nodes.find(n=>n.id===changed.a),target=scene.nodes.find(n=>n.id===changed.b);
 return {state,scene,link:candidate,source:source.label,target:target.label,base,future,delta,baseEdges,edges:modified,linkChange:impact,progress:yearsProgress(state.year),evidence:scene.missing,yearLabel:state.year+"年 · 条件演示",
  effects:[candidate.benefit,candidate.tradeoff,candidate.gap]};
}
function snapshot(raw){
 const r=simulate(raw),saved={
  v:1,scene:r.state.scene,link:r.state.link,mode:r.state.mode,intensity:r.state.intensity,year:r.state.year,
  summary:r.link.title,baseline:r.base,future:r.future,delta:r.delta,
  linkChange:r.linkChange,evidenceGap:r.link.gap,disclaimer:"教学式结构条件演示；未测量真实交易、GDP贡献或因果效应。",savedAt:new Date().toISOString()
 };
 return saved;
}
function cleanSnapshot(raw){
 if(!raw||typeof raw!=="object"||raw.v!==1)return null;
 const state=validate(raw);
 if(state.scene!==raw.scene||state.link!==raw.link||state.mode!==raw.mode||state.intensity!==raw.intensity||state.year!==raw.year)return null;
 const r=simulate(state);
 if(typeof raw.savedAt!=="string"||!Number.isFinite(Date.parse(raw.savedAt)))return null;
 return {...snapshot(state),savedAt:raw.savedAt,baseline:r.base,future:r.future,delta:r.delta};
}
function shareQuery(raw){
 const s=validate(raw),p=new URLSearchParams();
 for(const k of ["scene","link","mode","intensity","year"])p.set(k,String(s[k]));
 return p.toString();
}
return Object.freeze({SCENES,YEAR_START,YEAR_END,STORE_KEY,validate,getCandidate,allEdges,changedWeight,metrics,simulate,snapshot,cleanSnapshot,shareQuery});
});
