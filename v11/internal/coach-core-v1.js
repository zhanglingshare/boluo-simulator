/* Boluo Industry Coach V11 | pure, repeatable SCENARIO engine.
 * Numerical relationships, coefficient ranges and input distributions below
 * are developer assumptions, NOT empirical estimates, prediction or SEM fit.
 * Reuses the seeded sampling and percentile approach of legacy/model.js.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  if(root) root.BoluoCoachCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const round=(x,p=1)=>+x.toFixed(p);
 function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}}
 function normal(random){let u=0,v=0;while(!u)u=random();while(!v)v=random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
 function quant(sorted,q){const x=(sorted.length-1)*q,lo=Math.floor(x),hi=Math.ceil(x);return sorted[lo]*(1-(x-lo))+sorted[hi]*(x-lo)}
 const POLICY={
  balanced:{label:"稳健经营",growth:.11,skill:.08,buffer:.06,cost:4},
  technology:{label:"技术突破",growth:.34,skill:.38,buffer:.02,cost:14},
  supply:{label:"补链强链",growth:.14,skill:.08,buffer:.24,cost:10},
  market:{label:"开拓市场",growth:.29,skill:.13,buffer:.08,cost:11},
  reserve:{label:"培养接棒",growth:.08,skill:.24,buffer:.14,cost:9},
  cash:{label:"保留资源",growth:.015,skill:0,buffer:.18,cost:0}
 };
 const FACTORS=[
  {key:"talent",label:"人才供给",low:.80,high:1.20},
  {key:"funding",label:"资金可用",low:.80,high:1.20},
  {key:"network",label:"替代连接",low:.75,high:1.25},
  {key:"market",label:"市场需求",low:.80,high:1.20},
  {key:"volatility",label:"冲击波动",low:.75,high:1.25}
 ];
 function readiness(input){
  const used=input.resources||[0,0,0,0,0];
  const margins=used.map(x=>clamp(1-x/100,-1,1));
  return {cash:clamp(margins[1],-1,1),talent:clamp(margins[3],-1,1),network:clamp(input.networkScore||0,-5,5),resilience:clamp(input.resilience||0,0,24),recovery:clamp(input.recovery||0,0,35),stress:clamp(input.fatigue||0,0,45)};
 }
 function trajectory(input,options,seed){
  const opt=options||{},random=rng(seed),param=POLICY[opt.policy]||POLICY[input.policy]||POLICY.balanced;
  const r=readiness(input), horizon=clamp(Math.floor(opt.horizon||input.horizon||28),1,28);
  const dims={talent:1,funding:1,network:1,market:1,volatility:1,...(opt.factors||{})};
  let value=clamp(Number(input.score)||0,0,100), shockMemory=0, injury=r.recovery*.16,capacity=0,redundancy=r.resilience*.03+r.network*.05;
  const series=[value];
  for(let t=1;t<=horizon;t++){
    const globalShock=normal(random);
    shockMemory=.38*shockMemory+.92*globalShock;
    const market=clamp(dims.market*(1+.05*shockMemory),.35,1.65);
    const budgetAvailable=clamp((.25+r.cash*1.2)*dims.funding,.05,1.3);
    const talentAvailable=clamp((.4+r.talent)*dims.talent,.05,1.4);
    const investment=clamp(budgetAvailable-(param.cost/75)*dims.funding,.03,1.2);
    const productive=param.growth*(.25+.4*investment+.35*talentAvailable)+.12*(market-1)+.06*capacity;
    capacity=clamp(capacity*.93+param.skill*.1*talentAvailable,0,4);
    redundancy=clamp(redundancy*.92+param.buffer*.035*dims.network,0,.65);
    const disturbance=normal(random)*(.85*dims.volatility)*(1-redundancy*.42);
    const eventChance=clamp(.13*dims.volatility*(1+.12*Math.max(0,r.network<0?-r.network:0)),.02,.4);
    const event=random()<eventChance?(.9+random()*3.7)*(1-redundancy*.5):0;
    injury=clamp(injury*.73+event*.42,0,17);
    const budgetPenalty=Math.max(0,param.cost/100-r.cash*.19)*.8;
    value=clamp(value+productive+.10+disturbance-event*.9-injury*.09-budgetPenalty-r.stress*.006,0,100);
    series.push(round(value,2));
  }
  return series;
 }
 function summarize(rows,input){
  const horizon=rows[0].length-1,last=rows.map(row=>row[horizon]).sort((a,b)=>a-b);
  const values=[];
  for(let t=0;t<=horizon;t++){
   const v=rows.map(row=>row[t]).sort((a,b)=>a-b);
   values.push({q:t,p10:round(quant(v,.1)),p50:round(quant(v,.5)),p90:round(quant(v,.9))});
  }
  const anchor=Number(input.score)||0, above=last.filter(x=>x>=anchor).length;
  return {n:rows.length,horizon,p10:round(quant(last,.1)),p50:round(quant(last,.5)),p90:round(quant(last,.9)),atOrAboveStart:round(above/last.length*100),path:values,anchor:round(anchor)};
 }
 function forecast(input,options){
  const o=options||{},n=clamp(Math.floor(o.n||900),100,3000),seed=(o.seed??20261120)>>>0;
  const rows=[];
  for(let k=0;k<n;k++)rows.push(trajectory(input,o,(seed+(k+1)*2654435761)>>>0));
  return summarize(rows,input);
 }
 function sensitivity(input,options){
  const o=options||{},sample=clamp(Math.floor(o.n||140),40,320),horizon=o.horizon||input.horizon||28;
  const base=forecast(input,{...o,n:sample,horizon});
  const items=FACTORS.map(f=>{
   const low=forecast(input,{...o,n:sample,horizon,factors:{...(o.factors||{}),[f.key]:f.low}});
   const high=forecast(input,{...o,n:sample,horizon,factors:{...(o.factors||{}),[f.key]:f.high}});
   return {key:f.key,label:f.label,low:low.p50,high:high.p50,delta:round(high.p50-low.p50),amplitude:round(Math.abs(high.p50-low.p50)),range:[f.low,f.high]};
  }).sort((a,b)=>b.amplitude-a.amplitude);
  return {base:base.p50,items,method:"paired parameter scans using seeded stochastic scenario proxy; not variance decomposition or SEM"};
 }
 function pairedPolicies(input,other,options){
  const o=options||{},n=clamp(Math.floor(o.n||450),100,1000),seed=(o.seed??20261120)>>>0;
  const diffs=[];
  for(let i=0;i<n;i++){
   const s=(seed+(i+1)*2654435761)>>>0;
   const a=trajectory(input,{...o,policy:input.policy},s);
   const b=trajectory(input,{...o,policy:other},s);
   diffs.push(b.at(-1)-a.at(-1));
  }
  diffs.sort((a,b)=>a-b);
  return {other,n,p10:round(quant(diffs,.1)),p50:round(quant(diffs,.5)),p90:round(quant(diffs,.9)),improved:round(100*diffs.filter(x=>x>0).length/n)};
 }
 function graph(input){
  const roster=(input.roster||[]).map(x=>x.id),edge=(input.edges||[]).filter(x=>x.w>0&&x.a&&x.b);
  const ids=new Set(roster),links=edge.filter(x=>ids.has(x.a)||ids.has(x.b));
  const totalWeight=links.reduce((s,x)=>s+x.w,0);
  const nodeScores=roster.map(id=>{
   const incident=links.filter(x=>x.a===id||x.b===id);
   const weighted=incident.reduce((s,x)=>s+x.w,0);
   const neighbors=new Set(incident.map(x=>x.a===id?x.b:x.a));
   const outside=[...neighbors].filter(n=>!ids.has(n)).length;
   const selectedNeighbors=[...neighbors].filter(n=>ids.has(n)).length;
   const removalLoss=links.reduce((s,x)=>s+(x.a===id||x.b===id?x.w:0),0);
   return {id,links:incident.length,weighted:round(weighted,2),external:outside,internal:selectedNeighbors,removalShare:round(100*removalLoss/Math.max(.01,totalWeight))};
  }).sort((a,b)=>b.weighted-a.weighted);
  return {nodes:nodeScores,assumedLinks:links.length,totalWeight:round(totalWeight,2),isolated:nodeScores.filter(x=>!x.links).map(x=>x.id)};
 }
 function mechanism(input){
  const p=input.policy||"balanced",c=POLICY[p]||POLICY.balanced;
  const baseTalent=.28+.1*(c.skill/.4);
  const paths=[
   {from:"资源投入",to:"技术转化",coef:round(.30+c.skill*.32,2)},
   {from:"人才供给",to:"技术转化",coef:round(baseTalent,2)},
   {from:"技术转化",to:"生产能力",coef:round(.34+c.growth*.20,2)},
   {from:"产业协同",to:"供应替代",coef:round(.26+c.buffer*.37,2)},
   {from:"供应替代",to:"系统韧性",coef:round(.38+c.buffer*.22,2)}
  ];
  return {paths,indirect:round(paths[0].coef*paths[2].coef,3),techPath:paths[2].coef,supplyPath:paths[4].coef,disclosure:"mechanism coefficients are authored demonstration assumptions, not estimated SEM paths"};
 }
 return {rng,quant,POLICY,FACTORS,forecast,sensitivity,pairedPolicies,graph,mechanism,trajectory};
});
