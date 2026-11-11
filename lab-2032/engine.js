/* Research engines run in the visitor's browser. Outputs for synthetic demo are NOT empirical predictions. */
(function(root){
"use strict";
const C=root.BoluoCore,S=C.SECTORS;
const NAMES={primary:"第一产业",secondary:"第二产业",tertiary:"第三产业"};
const TARGET=[.10,.50,.40],SCENARIOS={
 balanced:{name:"三产协同",delta:[0,0,0],description:"各产业共同增长"},
 industrial:{name:"制造业升级",delta:[.001,.019,.004],description:"制造业能力提升并带来专业服务机会"},
 agriculture:{name:"农业价值提升",delta:[.026,.005,.010],description:"农业提质、加工和流通共同变化"},
 service:{name:"生产性服务扩张",delta:[.002,.007,.023],description:"专业服务市场和供给能力增强"},
 stress:{name:"项目与人才承压",delta:[-.007,-.019,-.016],description:"不利条件叠加"},
 regional:{name:"区域联动",delta:[.004,.012,.014],description:"订单、专业服务与区域市场联动"}
};
const KNOBS={
 agricultural_upgrade:{name:"农业提质",effect:[.022,.002,.004],range:[-1,1]},
 manufacturing_upgrade:{name:"制造业升级",effect:[.001,.017,.005],range:[-1,1]},
 service_capacity:{name:"专业服务",effect:[.002,.006,.020],range:[-1,1]},
 talent_supply:{name:"人才与技能",effect:[0,.009,.014],range:[-1,1]},
 project_delay:{name:"项目延期",effect:[0,-.017,-.006],range:[0,1]},
 external_demand:{name:"外部需求",effect:[.008,.015,.014],range:[-1,1]},
 local_linkages:{name:"本地产业联系",effect:[.003,.005,.012],range:[-1,1]}
};
function qs(a){const s=a.slice().sort((x,y)=>x-y);const q=t=>{const i=(s.length-1)*t,l=Math.floor(i),h=Math.ceil(i);return s[l]*(1-(i-l))+s[h]*(i-l);};return {p10:q(.1),p50:q(.5),p90:q(.9),p025:q(.025),p975:q(.975)};}
function baseline(data){
 const rows=data.tables.macro.slice().sort((a,b)=>Number(a.year)-Number(b.year));
 const current=rows.filter(r=>+r.year===2025);
 if(current.length!==1)throw Error("缺少唯一2025年产业增加值记录");
 const vals=S.map(k=>+current[0][k]),gdp=C.sum(vals);
 if(vals.some(x=>!Number.isFinite(x)||x<=0))throw Error("产业增加值无效");
 const available=rows.filter(x=>+x.year<=2025&&+x.year>=2020),earliest=available[0];
 let rates=[.052,.079,.083],basis="DEMO_FALLBACK_ASSUMPTION";
 if(available.length>=3&&earliest.year<2025){
  const years=2025-earliest.year;
  rates=S.map((k,i)=>C.clamp(Math.pow(vals[i]/Math.max(.001,+earliest[k]),1/years)-1,-.08,.20));
  basis="HISTORICAL_CAGR_DESCRIPTIVE_NOT_FORECAST";
 }
 return {year:2025,values:vals,gdp,shares:vals.map(x=>x/gdp),growthRates:rates,growthBasis:basis,history:rows};
}
/* Observable dataset diagnostics may condition a scenario, but never imply policy causality.
 * Each coefficient below is an explicitly assumed, bounded "what-if" coupling.
 * This is intentionally NOT a regression-to-GDP or structural causal calibration.
 */
let demoSignalReference=null;
function rawSignals(data){
 const tables=data.tables||{},firms=tables.enterprises||[],projects=tables.projects||[],workers=tables.workforce||[],surveys=tables.surveys||[];
 const bySector=Object.fromEntries(S.map(k=>{
  const rows=firms.filter(e=>e.sector===k&&Number(e.employees)>0&&Number.isFinite(Number(e.revenue)));
  return [k,rows.length?C.mean(rows.map(e=>Number(e.revenue)/Number(e.employees))):null];
 }));
 const stageScore={signed:0,construction:.18,commissioning:.55,operating:1};
 const readiness=projects.length?C.mean(projects.map(p=>stageScore[p.stage]??0)):null;
 const fit=workers.length?C.mean(workers.map(w=>1-C.clamp((Number(w.skillGap)||0)/5,0,1))):null;
 const access=surveys.length?C.mean(surveys.map(r=>C.mean(["SA1","SA2","SA3","SA4"].map(k=>Number(r[k])||0))))/7:null;
 const idMap=new Map(firms.map(e=>[String(e.id),e]));let same=0,total=0;
 for(const edge of tables.relations||[]){
  const a=idMap.get(String(edge.source)),b=idMap.get(String(edge.target)),v=Number(edge.value);
  if(!a||!b||!Number.isFinite(v)||v<0)continue;
  total+=v;if(a.town===b.town)same+=v;
 }
 return {revenuePerWorkerProxy:bySector,projectReadiness:readiness,workforceSkillFit:fit,
  surveyServiceAccess:access,localRelationShare:total?same/total:null};
}
function dataConditions(data){
 if(!demoSignalReference)demoSignalReference=rawSignals(C.demo());
 const raw=rawSignals(data),ref=demoSignalReference,diff=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?a-b:0;
 const productivity=S.map(k=>{
  const a=raw.revenuePerWorkerProxy[k],b=ref.revenuePerWorkerProxy[k];
  return Number.isFinite(a)&&Number.isFinite(b)&&b>0?C.clamp((a/b-1)*.006,-.012,.012):0;
 });
 const pr=C.clamp(diff(raw.projectReadiness,ref.projectReadiness)*.014,-.009,.009);
 const wr=C.clamp(diff(raw.workforceSkillFit,ref.workforceSkillFit)*.014,-.009,.009);
 const sv=C.clamp(diff(raw.surveyServiceAccess,ref.surveyServiceAccess)*.012,-.009,.009);
 const lk=C.clamp(diff(raw.localRelationShare,ref.localRelationShare)*.012,-.009,.009);
 const annualDelta=[
  productivity[0]+pr*.20+wr*.10+lk*.15,
  productivity[1]+pr*.85+wr*.75+lk*.30,
  productivity[2]+pr*.35+wr+sv+lk
 ].map(v=>C.clamp(v,-.025,.025));
 return {raw,reference:ref,annualRateDelta:annualDelta,
  enteredDataModules:Object.entries(data.evidence||{}).filter(([,v])=>v==="IMPORTED_UNVERIFIED").map(([k])=>k),
  status:"HEURISTIC_CONDITIONS_NOT_CAUSAL_CALIBRATION",
  explanation:"宏观历史CAGR决定描述性基线；企业人均营收代理、项目进展、技能、调查与本地采购的偏离只以事先限定的演示系数调整情景增速。并无因果识别，不是正式政策预测。"};
}
function config(given={}){
 const scenario=SCENARIOS[given.scenario] ? given.scenario:"balanced";
 const knobs={};for(const [name,meta]of Object.entries(KNOBS)){
  const raw=Number(given.knobs?.[name]||0);
  if(!Number.isFinite(raw)||raw<meta.range[0]||raw>meta.range[1])throw Error(meta.name+"参数超出合理范围");
  knobs[name]=raw;
 }
 const trials=Number(given.trials||1800),seed=Number(given.seed??2032);
 if(!Number.isInteger(trials)||trials<300||trials>8000)throw Error("模拟轨迹必须为300至8000");
 if(!Number.isInteger(seed)||seed<0||seed>2**32-1)throw Error("随机种子不合法");
 return {scenario,knobs,trials,seed};
}
function simulate(data,raw={}){
 const p=config(raw),base=baseline(data),conditioning=dataConditions(data);
 const rates=base.growthRates.map((v,i)=>v+SCENARIOS[p.scenario].delta[i]+conditioning.annualRateDelta[i]);
 for(const [name,value]of Object.entries(p.knobs))for(let i=0;i<3;i++)rates[i]+=KNOBS[name].effect[i]*value;
 if(rates.some(x=>x<=-.23||x>=.36))throw Error("增长假设超出引擎有效区间");
 const random=C.rng(p.seed),draws=[[],[],[]],total=[],shares=[[],[],[]],paths=Array.from({length:8},(_,i)=>({year:2025+i,primary:[],secondary:[],tertiary:[],gdp:[]}));
 for(let n=0;n<p.trials;n++){
  const vals=base.values.slice();
  paths[0].primary.push(vals[0]);paths[0].secondary.push(vals[1]);paths[0].tertiary.push(vals[2]);paths[0].gdp.push(C.sum(vals));
  for(let y=1;y<=7;y++){
   const z=[C.normal(random),C.normal(random),C.normal(random)];
   const shock=[.027*z[0],.036*(.22*z[0]+.9755*z[1]),.042*(.14*z[0]+.30*z[1]+.943*z[2])];
   for(let j=0;j<3;j++)vals[j]*=1+C.clamp(rates[j]+shock[j],-.19,.30);
   const year=paths[y];year.primary.push(vals[0]);year.secondary.push(vals[1]);year.tertiary.push(vals[2]);year.gdp.push(C.sum(vals));
  }
  const t=C.sum(vals);total.push(t);
  for(let j=0;j<3;j++){draws[j].push(vals[j]);shares[j].push(vals[j]/t);}
 }
 const totals=qs(total),sectors=S.map((k,i)=>({...qs(draws[i]),share:qs(shares[i]),name:NAMES[k],key:k}));
 const yearly=paths.map(y=>({year:y.year,...Object.fromEntries([...S,"gdp"].map(k=>[k,qs(y[k]).p50]))}));
 const closeness=total.reduce((acc,v,i)=>{
  return acc; // closeness below computed from shares cross arrays to avoid sorted-shares correlation
 },0);
 // Recalculate joint target closeness using saved per trial shares before sorting.
 const targetCount=shares[0].reduce((n,v,i)=>n+(Math.max(Math.abs(v-TARGET[0]),Math.abs(shares[1][i]-TARGET[1]),Math.abs(shares[2][i]-TARGET[2]))<=.015?1:0),0);
 const within2030=paths[5].gdp.filter(x=>x>=1600).length/p.trials;
 const bins=28,min=Math.min(...total),max=Math.max(...total),counts=Array(bins).fill(0);
 for(const v of total)counts[Math.min(bins-1,Math.floor((v-min)/Math.max(1e-12,max-min)*bins))]++;
 return {meta:{dataset_id:data.meta.dataset_id,mode:data.meta.mode,seed:p.seed,trials:p.trials,scenario:p.scenario,
   evidence:"CONDITIONAL_SIMULATION",model:"nominal-sector-growth-sensitivity-v2",growth_basis:base.growthBasis,
   warning:"结果依赖历史/合成基准、增长和扰动假设；概率仅为模型内条件频率，不是政策成功概率。"},
  scenario:SCENARIOS[p.scenario],knobs:p.knobs,assumedAnnualRates:rates,calibration:conditioning,baseline:base,totals,sectors,yearly,
  nearTarget:targetCount/p.trials,meet2030Reference:within2030,
  histogram:{min,max,counts},target:TARGET,conditional:true};
}
function compareScenarios(data,a,b){
 const sa=simulate(data,a),sb=simulate(data,b);return {a:sa,b:sb,gdpDifference:sb.totals.p50-sa.totals.p50,
  sectors:S.map((k,i)=>({key:k,name:NAMES[k],delta:sb.sectors[i].p50-sa.sectors[i].p50,
  shareDelta:sb.sectors[i].share.p50-sa.sectors[i].share.p50}))};
}
function sensitivity(data,baselineParams={}){
 const p=config(baselineParams),anchor=simulate(data,{...p,trials:450});
 const result=[];for(const [name,meta] of Object.entries(KNOBS)){
  const up=simulate(data,{...p,trials:450,knobs:{...p.knobs,[name]:meta.range[1]}});
  const down=simulate(data,{...p,trials:450,knobs:{...p.knobs,[name]:meta.range[0]}});
  result.push({name,label:meta.name,low:down.totals.p50-anchor.totals.p50,
    high:up.totals.p50-anchor.totals.p50,
    bySector:S.map((k,i)=>up.sectors[i].p50-down.sectors[i].p50)});
 }
 return result.sort((a,b)=>Math.abs(b.high-b.low)-Math.abs(a.high-a.low));
}
function group(rows,key,value){const map=new Map();for(const r of rows){const k=String(r[key]??"未知");if(!map.has(k))map.set(k,{name:k,count:0,sum:0,employees:0});const a=map.get(k);a.count++;a.sum+=Number(r[value]||0);a.employees+=Number(r.employees||0);}return [...map.values()].sort((a,b)=>b.sum-a.sum);}
function industries(data,scope="all"){
 const rows=data.tables.enterprises.filter(x=>scope==="all"||x.sector===scope);
 const bySector=group(rows,"sector","revenue"),bySubsector=group(rows,"subsector","revenue"),byTown=group(rows,"town","revenue");
 const total=C.sum(rows.map(x=>x.revenue));const concentration=bySubsector.length?C.sum(bySubsector.map(x=>Math.pow(x.sum/Math.max(1,total),2))):0;
 const sizeBands=[["微型",0,20],["小型",20,100],["中型",100,300],["大型",300,1e12]].map(([label,a,b])=>({label,count:rows.filter(x=>+x.employees>=a&&+x.employees<b).length}));
 return {scope,n:rows.length,totalSampleRevenue:total,employment:C.sum(rows.map(x=>x.employees)),bySector,bySubsector,byTown,sizeBands,concentration,
  warning:"企业为合成样本；营业收入不是地区增加值。样本汇总不能代表博罗全部企业。"};
}
function projects(data,delay=0){
 const stages=["signed","construction","commissioning","operating"],labels={signed:"签约",construction:"建设",commissioning:"投产爬坡",operating:"稳定运营"};
 const rows=data.tables.projects;return {n:rows.length,
  byStage:stages.map(stage=>({stage,label:labels[stage],n:rows.filter(x=>x.stage===stage).length,
    investment:C.sum(rows.filter(x=>x.stage===stage).map(x=>x.investment)),jobs:C.sum(rows.filter(x=>x.stage===stage).map(x=>x.jobs))})),
  bySector:group(rows,"sector","investment"),
  schedule:rows.map(x=>({...x,adjustedCommissionYear:Number(x.commissionYear)+(x.stage==="operating"?0:Number(delay))})),
  delayed:rows.filter(x=>x.stage!=="operating").length,
  caveat:"项目签约与投资金额不等于GDP贡献。投产年份是合成项目阶段时间。"};
}
function workforce(data,filter="all"){
 const rows=data.tables.workforce.filter(x=>filter==="all"||x.sector===filter),n=rows.length;
 const commute=rows.map(x=>+x.commute),wage=rows.map(x=>+x.wage);
 return {n,meanCommute:C.mean(commute),meanWage:C.mean(wage),commute:qs(commute),wage:qs(wage),
  skillGapHigh:rows.filter(x=>x.skillGap>=4).length/Math.max(1,n),byTown:group(rows,"town","wage"),
  bySector:group(rows,"sector","wage"),wageHistogram:bins(wage,12),
  warning:"劳动者记录为合成样本，工资、通勤和技能数据非现实博罗调查结论。"};
}
function bins(values,count=14){if(!values.length)return {min:0,max:1,counts:Array(count).fill(0)};const min=Math.min(...values),max=Math.max(...values),cts=Array(count).fill(0);for(const v of values)cts[Math.min(count-1,Math.floor((v-min)/Math.max(1e-10,max-min)*count))]++;return {min,max,counts:cts};}
function network(data,filter="all"){
 const companies=data.tables.enterprises,ids=new Map(companies.map(x=>[String(x.id),x])),edges=[],inmap=new Map(),outmap=new Map(),byType=new Map(),serviceTown=new Map();
 let invalid=0,total=0;
 for(const edge of data.tables.relations){
  const a=ids.get(String(edge.source)),b=ids.get(String(edge.target)),v=Number(edge.value);
  if(!a||!b||!Number.isFinite(v)||v<0){invalid++;continue}
  if(filter!=="all"&&a.sector!==filter&&b.sector!==filter)continue;
  edges.push({...edge,a,b,value:v});total+=v;
  inmap.set(b.id,(inmap.get(b.id)||0)+v);outmap.set(a.id,(outmap.get(a.id)||0)+v);
  byType.set(edge.type,(byType.get(edge.type)||0)+v);
  if(b.sector==="tertiary")serviceTown.set(b.town,(serviceTown.get(b.town)||0)+v);
 }
 const top=[...inmap].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([id,value])=>({id,value,entity:ids.get(id)}));
 const adjacency=new Map();for(const e of edges){if(!adjacency.has(e.source))adjacency.set(e.source,[]);adjacency.get(e.source).push({id:e.target,weight:e.value});}
 return {nodes:ids.size,edges:edges.length,invalid,total,top,byType:[...byType].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
  byServiceTown:[...serviceTown].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
  sectorLinks:sectorMatrix(edges),graph:{ids,edges,adjacency},
  warning:"关系网络为合成数据。中心性是网络结构指标，不能直接代表经济增加值或因果影响。"};
}
function sectorMatrix(edges){
 const matrix=Object.fromEntries(S.map(a=>[a,Object.fromEntries(S.map(b=>[b,0]))]));
 for(const e of edges)matrix[e.a.sector][e.b.sector]+=e.value;
 return matrix;
}
function propagate(net,origin,drop=.35){
 if(!net.graph.ids.has(origin))throw Error("请选择存在的Demo主体");
 const effect=new Map([[origin,drop]]),waves=[{level:0,id:origin,impact:drop}];
 let front=new Map([[origin,drop]]);
 for(let step=1;step<=3;step++){
  const next=new Map();
  for(const [source,magnitude] of front){
   const targets=net.graph.adjacency.get(source)||[],total=C.sum(targets.map(x=>x.weight));
   for(const t of targets){
    const delta=magnitude*(t.weight/Math.max(1e-8,total))*.42;
    if(delta<.002)continue;
    next.set(t.id,(next.get(t.id)||0)+delta);
   }
  }
  for(const [id,value] of next){
   effect.set(id,(effect.get(id)||0)+value);waves.push({level:step,id,impact:value});
  }front=next;
 }
 return {origin,drop,affected:[...effect].sort((a,b)=>b[1]-a[1]).map(([id,impact])=>({id,impact,entity:net.graph.ids.get(id)})),waves,
  warning:"三步传播是透明的演示规则，不是对真实供应链冲击的经验估计。"};
}
const BLOCKS={SA:["SA1","SA2","SA3","SA4"],SU:["SU1","SU2","SU3"],OP:["OP1","OP2","OP3"]},PATHLABEL={"SA->SU":"服务可得性→使用","SA->OP":"服务可得性→绩效","SU->OP":"使用→绩效"};
function std(values){const m=C.mean(values),sd=Math.sqrt(C.mean(values.map(v=>(v-m)**2)));if(sd<1e-9)throw Error("指标零方差，请检查问卷");return values.map(v=>(v-m)/sd);}
function dot(a,b){return C.mean(a.map((x,i)=>x*b[i]));}
function ols2(x1,x2,y){const a=dot(x1,x2),b=dot(x1,y),c=dot(x2,y);if(1-a*a<.0001)throw Error("强共线性，不可估计");return [(b-a*c)/(1-a*a),(c-a*b)/(1-a*a)];}
function cronbach(matrix){
 const k=matrix.length,tot=matrix[0].map((_,i)=>C.sum(matrix.map(col=>col[i]))),vari=v=>C.mean(v.map(x=>(x-C.mean(v))**2));
 return k/(k-1)*(1-C.sum(matrix.map(vari))/Math.max(1e-10,vari(tot)));
}
function surveyBlocks(rows){
 if(rows.length<60)throw Error("该演示路径模型至少需要60条完整数据，这不是正式功效阈值");
 const blocks={};
 for(const [name,inds]of Object.entries(BLOCKS)){
  blocks[name]=inds.map(ind=>std(rows.map(r=>{const value=Number(r[ind]);if(!Number.isInteger(value)||value<1||value>7)throw Error(ind+"必须为1—7整数");return value;})));
 }return blocks;
}
function pls(blocks){
 const n=blocks.SA[0].length,names=["SA","SU","OP"],neighbors={SA:["SU","OP"],SU:["SA","OP"],OP:["SA","SU"]};
 let weights=Object.fromEntries(names.map(k=>[k,blocks[k].map(()=>1/Math.sqrt(blocks[k].length))])),iter=0,delta=Infinity;
 let scores={};
 for(iter=0;iter<140;iter++){
  scores=Object.fromEntries(names.map(k=>[k,std(Array.from({length:n},(_,i)=>C.sum(blocks[k].map((col,j)=>col[i]*weights[k][j]))))]));
  const updated={};
  for(const k of names){
   const proxy=Array.from({length:n},(_,i)=>C.sum(neighbors[k].map(other=>(dot(scores[k],scores[other])>=0?1:-1)*scores[other][i])));
   const w=blocks[k].map(col=>dot(col,proxy));const norm=Math.sqrt(C.sum(w.map(x=>x*x)));
   if(norm<1e-10)throw Error("PLS外部权重不可识别");
   let next=w.map(x=>x/norm);if(C.sum(next)<0)next=next.map(x=>-x);updated[k]=next;
  }
  delta=Math.max(...names.map(k=>Math.sqrt(C.sum(weights[k].map((v,i)=>(v-updated[k][i])**2)))));
  weights=updated;if(delta<1e-7)break;
 }
 scores=Object.fromEntries(names.map(k=>[k,std(Array.from({length:n},(_,i)=>C.sum(blocks[k].map((col,j)=>col[i]*weights[k][j]))))]));
 const direct=ols2(scores.SA,scores.SU,scores.OP);
 const paths={"SA->SU":dot(scores.SA,scores.SU),"SA->OP":direct[0],"SU->OP":direct[1]};
 const measure={};
 for(const k of names){
  const loads=blocks[k].map(col=>dot(col,scores[k])),ave=C.mean(loads.map(x=>x*x)),sum=C.sum(loads),error=C.sum(loads.map(x=>1-x*x));
  measure[k]={alpha:cronbach(blocks[k]),ave,cr:sum*sum/Math.max(.00001,sum*sum+error),
   loadings:Object.fromEntries(BLOCKS[k].map((name,i)=>[name,loads[i]]))};
 }
 const pred=scores.OP.map((_,i)=>direct[0]*scores.SA[i]+direct[1]*scores.SU[i]);
 return {paths,measure,r2:{SU:paths["SA->SU"]**2,OP:1-C.mean(pred.map((x,i)=>(scores.OP[i]-x)**2))},converged:delta<1e-7,iterations:iter+1};
}
function regression(blocks){
 const get=k=>std(Array.from({length:blocks[k][0].length},(_,i)=>C.mean(blocks[k].map(col=>col[i]))));
 const a=get("SA"),b=get("SU"),c=get("OP"),d=ols2(a,b,c);
 return {paths:{"SA->SU":dot(a,b),"SA->OP":d[0],"SU->OP":d[1]},r2:{SU:dot(a,b)**2,OP:1-C.mean(c.map((v,i)=>(v-d[0]*a[i]-d[1]*b[i])**2))}};
}
function models(data,opt={}){
 const rows=data.tables.surveys,blocks=surveyBlocks(rows),fit=pls(blocks),benchmark=regression(blocks);
 const seed=opt.seed??319,count=opt.bootstrap??120,random=C.rng(seed),samples=Object.fromEntries(Object.keys(fit.paths).map(k=>[k,[]]));let fail=0;
 for(let b=0;b<count;b++){
  const inds=Array.from({length:rows.length},()=>Math.floor(random()*rows.length));
  try{const sub=Object.fromEntries(Object.entries(blocks).map(([k,cols])=>[k,cols.map(col=>std(inds.map(i=>col[i])))]));
   const result=pls(sub);for(const k of Object.keys(samples))samples[k].push(result.paths[k]);
  }catch(e){fail++;}
 }
 const ci=Object.fromEntries(Object.entries(samples).map(([k,a])=>[k,a.length>=count*.8?qs(a):null]));
 return {n:rows.length,dataset_id:data.meta.dataset_id,fit,benchmark,ci,bootstrap:count,failed:fail,
  model_id:"experimental-mode-a-pls-v2",software:"browser-js",data_fingerprint:C.identity(data),pathLabels:PATHLABEL,
  notes:["程序PLS为教学及工程验证实现；尚未逐项通过SmartPLS等价认证。",
         "显著性、拟合和路径系数均不意味着因果识别，更不能直接用于GDP增量。",
         "构念测量还需检验区分效度、共同方法偏差、样本代表性和外部验证。"]};
}
function quality(data){
 const basic=C.inspect(data),rows=data.tables.surveys||[],rels=data.tables.relations||[],ent=data.tables.enterprises||[];
 const diversity=new Set(rows.map(x=>x.subsector)).size;
 return {...basic,coverageText:Object.entries(basic.counts).map(([k,v])=>({name:k,n:v,pct:Math.round(basic.coverage[k]*100)})),
  survey:{n:rows.length,diversity,duplicateKeys:rows.length-new Set(rows.map(x=>x.id)).size,
    sufficientForDemonstration:rows.length>=60},
  relations:{n:rels.length,invalid:basic.missingEndpoints},
  companies:{n:ent.length,sectorCounts:Object.fromEntries(S.map(k=>[k,ent.filter(x=>x.sector===k).length]))}};
}
function blindspots(data,sim=null){
 const check=quality(data),notes=[
 {priority:"HIGH",title:"产业占比不是发展质量",category:"统计口径",detail:"结构目标应与绝对增加值、劳动生产率、就业质量同时比较。",next:"核对2025各产业增加值与2026—2032价格口径"},
 {priority:"HIGH",title:"营业收入不能直接转成增加值",category:"经济核算",detail:"企业营收、项目投资与GDP是不同经济概念，不允许简单加总。",next:"补充行业增加值率、统计口径和项目投产证据"},
 {priority:"HIGH",title:"产业关系可能大量缺失",category:"网络结构",detail:"宏观统计无法提供完整企业采购关系；样本网络不代表全县网络。",next:"设计重点制造企业采购与服务商关系调查"},
 {priority:"MEDIUM",title:"问卷关系不等于政策因果",category:"科研识别",detail:"SEM及PLS-SEM估计依赖样本、测量模型与假设。",next:"通过企业实际经营记录、纵向调查或对照设计核验"},
 {priority:"MEDIUM",title:"项目投资不等于投产贡献",category:"项目接续",detail:"项目从开工到正常经营存在时滞，贡献应分阶段核验。",next:"追踪投产、产能爬坡、订单及实际用工"}
 ];
 if(check.missingEndpoints)notes.unshift({priority:"HIGH",title:"供应关系存在断链",category:"数据质量",detail:"有"+check.missingEndpoints+"条关系无法匹配企业主体。",next:"对照企业ID清单修复关系数据"});
 if(check.survey.n<100)notes.unshift({priority:"HIGH",title:"问卷样本过少",category:"样本",detail:"当前仅"+check.survey.n+"条问卷，复杂模型的统计功效可能不足。",next:"开展样本量与统计功效分析"});
 if(data.meta.mode!=="DEMO")notes.unshift({priority:"HIGH",title:"真实数据混合了合成假设",category:"溯源",detail:"当前研究快照为"+data.meta.mode+"，未替换部分仍是合成数据。",next:"逐模块核对来源及样本框，未校准前不得输出真实预测"});
 if(sim&&sim.sectors[2].share.p50<.4)notes.push({priority:"MEDIUM",title:"服务业结构参考线未达到",category:"情景",detail:"在当前Demo增速假设下第三产业结构中位数低于40%。",next:"检验具体服务业市场需求和项目兑现条件"});
 return notes;
}
function actions(data,sim){
 const sectorShare=sim.sectors.map(x=>x.share.p50),deviation=sectorShare.map((v,i)=>Math.abs(v-TARGET[i]));
 const choices=[
 {id:"act-service",title:"补齐制造业专业服务缺口",sector:"tertiary",fit:deviation[2],cost:"需要服务商能力、真实客户和技术人才",verification:"企业采购记录、本地承接率、服务商供给",risk:"制造企业需求可能由县外供应商承接"},
 {id:"act-industry",title:"工业扩能和项目兑现",sector:"secondary",fit:deviation[1],cost:"建设周期、能源与资金要求",verification:"投产阶段、订单、实际产能和增加值",risk:"投资金额不必然形成稳定产出"},
 {id:"act-agri",title:"农业提质、加工与销售协同",sector:"primary",fit:deviation[0],cost:"用工季节性、加工设施与渠道回款",verification:"农户收益、加工订单、回款和增值结构",risk:"跨产业核算不当可能造成重复计量"},
 {id:"act-talent",title:"岗位技能与通勤配套",sector:"cross",fit:.12,cost:"培训、住房、通勤和财政资源",verification:"岗位缺口、技能匹配、工资和稳定率",risk:"人才需求可能随产业条件改变"},
 {id:"act-region",title:"强化区域订单和服务链接",sector:"cross",fit:.10,cost:"物流时效、协作规则和质量能力",verification:"跨县区采购关系及可持续订单",risk:"对外部单一市场形成新的依赖"}
 ];
 return choices.map(x=>({...x,score:Math.round(40+Math.min(1,x.fit)*180)})).sort((a,b)=>b.score-a.score)
  .map(x=>({...x,scoreMeaning:"Demo问题优先级，用于排序，不是政策效果评价"}));
}
root.BoluoEngine={S,NAMES,TARGET,SCENARIOS,KNOBS,qs,bins,baseline,rawSignals,dataConditions,simulate,compareScenarios,sensitivity,industries,projects,workforce,network,propagate,
 models,quality,blindspots,actions};
})(window);