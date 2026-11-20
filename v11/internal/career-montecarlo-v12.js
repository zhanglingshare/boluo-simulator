/* BORO V12 | Monte Carlo scenarios execute the ACTUAL V10 careerTick transition.
 * Reuses enterprise capability changes, five resource caps, manager chemistry,
 * V5 network shock transmission, quarterly recovery, virtual competitor and
 * qualified bench promotion. Inputs remain development assumptions.
 * Draws are paired across strategies, deterministic by seed; no real probabilities.
 */
(function(){
 "use strict";
 if(!window.BoluoCoachCore || typeof careerTick!=="function")return;
 const Core=window.BoluoCoachCore;
 const oldProxy={forecast:Core.forecast,sensitivity:Core.sensitivity,pairedPolicies:Core.pairedPolicies};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const round=(v,p=1)=>+v.toFixed(p);
 const FACTORS=Core.FACTORS;
 const cache=new Map(),MAX_CACHE=16;
 let iterations=0;
 function memo(key,fn){if(cache.has(key))return cache.get(key);const r=fn();if(cache.size>=MAX_CACHE)cache.delete(cache.keys().next().value);cache.set(key,r);return r}
 function standardNormal(rand){
  let u=0,v=0;while(!u)u=rand();while(!v)v=rand();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
 }
 function snapshot(){
  // Model state is cloned once per analysis, not 28 copies per draw.
  const simplified={
   ...career,history:[],journal:[],snapshots:[],curve:[],
   comparison:{A:null,B:null},
   training:{...career.training},spent:career.spent.slice(),
   companyStates:JSON.parse(JSON.stringify(career.companyStates||{})),
   initialSlots:{...(career.initialSlots||manager.slots)}
  };
  return {
   data:JSON.stringify(simplified),slots:{...manager.slots},
   year:manager.year,event:manager.event,
   wt:{...wtState},
   linkWeights:wtLinks.map(x=>x.w),caps:managerCaps.slice(),
   policy:career.policy,atQuarter:career.quarter
  };
 }
 function tapeFor(seed,factors){
  const rand=Core.rng(seed>>>0);
  const fac={funding:1,talent:1,network:1,market:1,volatility:1,...(factors||{})};
  const steps=[];
  for(let q=0;q<28;q++){
   const baseline=careerSeed(q),u=rand(),u2=rand(),marketNoise=standardNormal(rand),
         talentNoise=standardNormal(rand),fundingNoise=standardNormal(rand),
         networkNoise=standardNormal(rand),severityNoise=standardNormal(rand);
   // Keep the old deterministic V10 external event calendar as the modal outcome,
   // but permit extra risk events and opportunities under an explicit draw.
   let eventIndex=baseline;
   const extraRisk=clamp(.11+.16*(fac.volatility-1),.02,.28);
   if(u<extraRisk)eventIndex=Math.floor(u2*3);
   else if(u>.94)eventIndex=3+Math.floor(u2*3);
   const market=clamp(fac.market*(1+.09*marketNoise),.62,1.48);
   const talent=clamp(fac.talent*(1+.08*talentNoise),.65,1.45);
   const funding=clamp(fac.funding*(1+.07*fundingNoise),.72,1.32);
   const network=clamp(fac.network*(1+.08*networkNoise),.65,1.4);
   steps.push({
    eventIndex, funding, talent, network, market,
    shockScale:clamp(fac.volatility*(1+.23*severityNoise),.45,1.8),
    boost:[market,clamp(talent*.7+funding*.3,.65,1.38),network],
    companyGrowth:clamp(market*.55+talent*.3+funding*.15,.65,1.42)
   });
  }
  return steps;
 }
 function restore(saved){
  career=saved.career;manager.slots=saved.slots;
  manager.year=saved.year;manager.event=saved.event;
  Object.assign(wtState,saved.wt);
  managerCaps.forEach((x,i)=>{managerCaps[i]=saved.caps[i]});
  wtLinks.forEach((x,i)=>{x.w=saved.links[i]});
  v10Simulating=saved.batch;v10ShockScale=saved.scale;v12Scenario=saved.scenario;
 }
 function runBatch(work){
  const saved={
   career,slots:manager.slots,year:manager.year,event:manager.event,wt:{...wtState},
   caps:managerCaps.slice(),links:wtLinks.map(e=>e.w),
   batch:v10Simulating,scale:v10ShockScale,scenario:v12Scenario
  };
  try{
   v10Simulating=true;v10ShockScale=1;
   return work(snapshot());
  }finally{
   restore(saved);
  }
 }
 function runOne(baseline,steps,policy){
  career=JSON.parse(baseline.data);
  manager.slots={...baseline.slots};
  manager.year=baseline.year;manager.event=baseline.event;
  Object.assign(wtState,baseline.wt);
  const timeline=[careerScore()];
  v12Scenario={steps,current:null};
  // The selected strategy is held through the remaining quarters.
  for(let q=career.quarter;q<28;q++){
   const x=steps[q];
   // Apply quarterly funding/talent availability to the SAME five resource constraints.
   managerCaps.forEach((_,i)=>{managerCaps[i]=baseline.caps[i]});
   managerCaps[1]=baseline.caps[1]*x.funding;
   managerCaps[3]=baseline.caps[3]*x.talent;
   // Evolve hypothetical network weights, used by BOTH chemistry and propagation.
   wtLinks.forEach((edge,i)=>{edge.w=clamp(baseline.linkWeights[i]*x.network,.02,.98)});
   v12Scenario.current=x;
   career.policy=policy;
   careerTick();
   // A preselected bench candidate is promoted only if V10's actual readiness
   // and actual resource conditions both permit it.
   if(career.bench && career.benchReady>=1.5)v10TryPromote();
   career.score=careerScore();
   timeline.push(career.score);
   iterations++;
  }
  return timeline;
 }
 function stateKey(baseline){
  return JSON.stringify([baseline.data,baseline.slots,baseline.year,baseline.event,baseline.wt,
   baseline.linkWeights,baseline.caps,scorePreset,overrides]);
 }
 function runScenarios(baseline,options,withPaths){
  const o=options||{},n=clamp(Math.floor(o.n||450),30,1500),
        seed=(o.seed??20261120)>>>0,policy=o.policy||baseline.policy,
        horizon=clamp(Math.floor(o.horizon??28-baseline.atQuarter),1,28-baseline.atQuarter),
        rows=[];
  for(let i=0;i<n;i++){
   const drawSeed=(seed+Math.imul(i+1,0x9e3779b9))>>>0;
   const tape=tapeFor(drawSeed,o.factors);
   const series=runOne(baseline,tape,policy).slice(0,horizon+1);
   rows.push(series);
  }
  const last=rows.map(x=>x.at(-1)).sort((a,b)=>a-b),
        p=(t,q)=>round(Core.quant(t,q)),
        path=[];
  if(withPaths){
   for(let q=0;q<=horizon;q++){
    const sample=rows.map(row=>row[q]).sort((a,b)=>a-b);
    path.push({q,p10:p(sample,.1),p50:p(sample,.5),p90:p(sample,.9)});
   }
  }
  const start=round(rows[0][0]),good=last.filter(v=>v>=start).length;
  return {n,horizon,p10:p(last,.1),p50:p(last,.5),p90:p(last,.9),
   atOrAboveStart:round(100*good/n),path,anchor:start,
   kernel:"v10/careerTick",seed,draws:n};
 }
 function forecast(_ctx,o={}){
  return runBatch(baseline=>{
   const key=JSON.stringify(["forecast",stateKey(baseline),o]);
   return memo(key,()=>runScenarios(baseline,o,true));
  });
 }
 function sensitivity(_ctx,o={}){
  return runBatch(baseline=>{
   const key=JSON.stringify(["sensitivity",stateKey(baseline),o]);
   return memo(key,()=>{
    const n=clamp(Math.floor(o.n||85),30,180),common={...o,n},
          baselineStats=runScenarios(baseline,common,false);
    const items=FACTORS.map(f=>{
     const low=runScenarios(baseline,{...common,factors:{...(o.factors||{}),[f.key]:f.low}},false);
     const high=runScenarios(baseline,{...common,factors:{...(o.factors||{}),[f.key]:f.high}},false);
     return {key:f.key,label:f.label,low:low.p50,high:high.p50,
      delta:round(high.p50-low.p50),amplitude:round(Math.abs(high.p50-low.p50)),
      range:[f.low,f.high]};
    }).sort((a,b)=>b.amplitude-a.amplitude);
    return {base:baselineStats.p50,items,method:"parameter scan re-running real V10 careerTick under common seeded stochastic events; no causal inference"};
   });
  });
 }
 function pairedPolicies(ctx,other,o={}){
  return runBatch(baseline=>{
   const key=JSON.stringify(["paired",stateKey(baseline),ctx.policy,other,o]);
   return memo(key,()=>{
    const n=clamp(Math.floor(o.n||250),30,750),seed=(o.seed??20261120)>>>0,
          first=ctx.policy||baseline.policy,diffs=[];
    for(let i=0;i<n;i++){
     const drawSeed=(seed+Math.imul(i+1,0x9e3779b9))>>>0,tape=tapeFor(drawSeed,o.factors);
     const a=runOne(baseline,tape,first),b=runOne(baseline,tape,other);
     const horizon=clamp(Math.floor(o.horizon??28-baseline.atQuarter),1,28-baseline.atQuarter);
     diffs.push(b[horizon]-a[horizon]);
    }
    diffs.sort((a,b)=>a-b);
    const p=q=>round(Core.quant(diffs,q));
    return {other,n,p10:p(.1),p50:p(.5),p90:p(.9),
      improved:round(100*diffs.filter(v=>v>0).length/n),
      kernel:"v10/careerTick",seed,paired:true};
   });
  });
 }
 Core.legacyProxy=oldProxy;
 Core.forecast=forecast;Core.sensitivity=sensitivity;Core.pairedPolicies=pairedPolicies;
 Core.kernel="V12: shared V10 careerTick + V5 propagation + V9 company state";
 window.BoluoCareerUnified={
  forecast,sensitivity,pairedPolicies,tapeFor,
  stats:()=>({iterations,cached:cache.size,kernel:Core.kernel}),
  clearCache:()=>cache.clear()
 };
})();
