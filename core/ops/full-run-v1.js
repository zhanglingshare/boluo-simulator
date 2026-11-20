/* Full-pipeline research demonstrator, v1. No model rewrites.
  Uses BoluoCore/BoluoEngine, project adapter, V13 enterprise profiles and Coach V11.
  Public observed signals are not input as synthetic historical observations. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.BoluoFullRun=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const assert=(condition,text)=>{if(!condition)throw new Error(text)};
const clean=(x,n=2)=>Math.round(Number(x)*10**n)/10**n;
const clone=x=>JSON.parse(JSON.stringify(x));
const bounded=(x,a,b)=>Math.max(a,Math.min(b,Number(x)));
function validateAnchors(publicData){
 assert(publicData?.schema==="boluo-public-anchors/1","Missing sourced public anchors");
 for(const p of publicData.records){
  assert(Math.abs(p.gdp-(p.primary+p.secondary+p.tertiary))<.015,"GDP and sector sum differ: "+p.period);
  assert(p.source?.startsWith("https://"),"Public record has no traceable source");
 }
 const fy=publicData.records.find(x=>x.period==="FY"&&x.year===2025);
 assert(fy&&Math.abs(fy.gdp-1005.45)<.01,"Wrong 2025 public baseline");
 return {records:publicData.records.map(x=>({...x,comparable_with_previous_annual:x.period==="FY"})),
  goals:publicData.planning.map(x=>({...x,attainment_not_evaluated:true})),
  caveat:"2026 Q1 and Q3 are cumulative periods, not full-year forecasts. Never annualize automatically."};
}
function run(options={},engines,publicData){
 assert(engines&&engines.Core&&engines.Engine&&engines.Bridge&&engines.Attributes&&engines.Coach,"Original engines required");
 const {Core:C,Engine:E,Bridge,Attributes:A,Coach}=engines;
 const seed=options.seed??20261120,trials=options.trials??500,delay=options.delay??1,
   affectedPct=options.affectedPct??50,proxy=options.proxy??.5,
   sourceShock=options.sourceShock??.35,bootstrap=options.bootstrap??80;
 assert(Number.isSafeInteger(seed)&&seed>=0&&seed<=4294967295,"Invalid seed");
 assert(Number.isInteger(trials)&&trials>=300&&trials<=3000,"Trials must be 300..3000");
 assert(Number.isInteger(delay)&&delay>=0&&delay<=3,"Delay must be 0..3 years");
 assert(Number.isFinite(affectedPct)&&affectedPct>=0&&affectedPct<=100,"Affected must be 0..100%");
 assert(Number.isFinite(proxy)&&proxy>=0&&proxy<=1,"Proxy parameter must be 0..1");
 assert(Number.isFinite(sourceShock)&&sourceShock>=0&&sourceShock<=1,"Network stress must be 0..1");
 assert(Number.isInteger(bootstrap)&&bootstrap>=50&&bootstrap<=200,"Bootstrap 50..200");
 const anchor=validateAnchors(publicData);
 const data=options.data||C.demo();
 assert(data.meta?.mode==="DEMO","Full run v1 deliberately refuses unreviewed imported real datasets");
 const fingerprint=C.identity(data),stableData=clone(data);
 const completed=[];
 const section=(id,work)=>{const output=work();completed.push({id,executed:true});return output};
 const publicRecords=section("public_evidence",()=>anchor);
 const quality=section("data_quality",()=>{
  const q=E.quality(stableData);
  return {counts:q.counts||C.inspect(stableData).counts,invalidEdges:q.relations.invalid,
   surveySize:q.survey.n,sectorCounts:q.companies.sectorCounts,mode:stableData.meta.mode};
 });
 const project=section("project_pipeline",()=>{
  const shape=Bridge.projectSchedule(stableData,delay,affectedPct);
  const old=E.projects(stableData,delay);
  return {total:old.n,stage:old.byStage,schedule:{eligible:shape.eligible,delayed:shape.delayed,
    before2032:shape.before2032,after2032:shape.after2032,crossed2032:shape.crossed2032},
    shift_detail:shape.rows.filter(x=>x.moved).slice(0,15),unit:"project_count",evidence:"synthetic"};
 });
 const industry=section("enterprise_industry",()=>{
  const result=E.industries(stableData);
  return {enterpriseCount:result.n,aggregateSampleRevenue:clean(result.totalSampleRevenue),
    sectorCounts:result.bySector.map(x=>({sector:x.name,n:x.count})),townTop:result.byTown.slice(0,5)
      .map(x=>({town:x.name,count:x.count})),revenueUnit:"synthetic million_CNY",notGDP:true};
 });
 const talent=section("labor_constraints",()=>{
  const w=E.workforce(stableData);
  return {count:w.n,meanCommute:clean(w.meanCommute),meanWage:clean(w.meanWage),
    highSkillGapFraction:clean(w.skillGapHigh,3),evidence:"synthetic survey",unit:"minutes/CNY_per_month"};
 });
 const enterprise=section("enterprise_v13",()=>{
  const p=stableData.tables.enterprises.find(x=>x.sector==="secondary");
  assert(p,"No synthetic manufacturing enterprise");
  const clamp=x=>bounded(x,8,94);
  // V13 requires SIX ability axes. The mapping below is purely developer-chosen.
  const axis=[clamp(p.capacity*100),clamp(40+50*p.innovation),clamp(35+55*p.productivity),
    clamp(43+44*p.capacity),clamp(38+50*p.innovation),clamp(45+43*p.capacity)].map(x=>clean(x,1));
  const rating={values:axis,ovr:clean(axis.reduce((a,b)=>a+b,0)/6,1),
    pot:clamp(axis.reduce((a,b)=>a+b,0)/6+8)};
  const profile=A.profile({id:p.id,team:p.sector,club:p.subsector,role:"synthetic",tags:[]},rating);
  return {id:p.id,synthetic:true,tacticalAttributes:profile.all.length,axis,overall:rating.ovr,
    groups:profile.groups.map(x=>({id:x.id,name:x.name,score:x.score})),
    exposure:profile.exposures||null,
    warning:"Six synthetic profile axes are arbitrary transparent mappings of synthetic fields; not six real measurements."};
 });
 const relationship=section("network_propagation",()=>{
  const net=E.network(stableData);
  const roots=[...net.graph.adjacency.keys()].sort();
  assert(roots.length,"No network edges");
  const source=options.sourceId&&net.graph.ids.has(options.sourceId)?options.sourceId:roots[0];
  assert(net.graph.adjacency.has(source),"Chosen source has no outgoing edges");
  const spread=E.propagate(net,source,sourceShock);
  return {nodes:net.nodes,edges:net.edges,invalid:net.invalid,source,depth:3,
    shock:sourceShock,affected:spread.affected.length,
    hotspots:spread.affected.slice(0,7).map(x=>({id:x.id,impact:clean(x.impact*100)})),
    waves:spread.waves.length,warning:spread.warning};
 });
 const macro=section("macroeconomic_montecarlo",()=>{
  const common={seed,trials,scenario:"balanced"};
  const a=E.simulate(stableData,common);
  const b=E.simulate(stableData,{...common,knobs:{project_delay:delay>0?proxy:0}});
  const compact=r=>({p10:clean(r.totals.p10),p50:clean(r.totals.p50),p90:clean(r.totals.p90),
    shares:r.sectors.map(x=>({sector:x.key,p10:clean(x.share.p10*100),p50:clean(x.share.p50*100),p90:clean(x.share.p90*100)})),
    yearly:r.yearly.map(x=>({year:x.year,gdp:clean(x.gdp)})),
    meet2030ReferenceModelFrequency:clean(r.meet2030Reference*100,1)});
  return {baseline:compact(a),assumedPressure:compact(b),
    medianDiff:clean(b.totals.p50-a.totals.p50),trials,seed,
    accounting:"GDP_sector_value_added",targetBasis:"2030 1600 GDP reference; not 2032 1:5:4 gross output",
    coupling:"NONE: GDP stress is separately specified macro proxy. Project schedule never converted to GDP.",proxy:delay>0?proxy:0};
 });
 const sensitivity=section("sensitivity",()=>{
  const rows=E.sensitivity(stableData,{seed,scenario:"balanced",knobs:{project_delay:delay>0?proxy:0}});
  return {rows:rows.map(x=>({name:x.name,label:x.label,low:clean(x.low),high:clean(x.high)})),
    method:"existing full model rerun with fixed seed and single-knob bounds; NOT causal effects",output:"scenario GDP median difference, 亿"};
 });
 const path=section("survey_pls",()=>{
  const fit=E.models(stableData,{seed,bootstrap});
  return {n:fit.n,model:fit.model_id,bootstrap:fit.bootstrap,failed:fit.failed,
    paths:fit.fit.paths,intervals:fit.ci,
    warnings:fit.notes};
 });
 const coach=section("coach_v11_proxy",()=>{
  // This is independent synthetic input, not V12 state or a derived macro forecast.
  const input={score:enterprise.overall,policy:"balanced",
    resources:[60,50,55,50,48],networkScore:0.5,resilience:8,recovery:4,fatigue:3,horizon:28};
  const result=Coach.forecast(input,{seed,n:200,horizon:28});
  const method=Coach.mechanism(input);
  return {n:result.n,scoreStart:result.anchor,p10:result.p10,p50:result.p50,p90:result.p90,
    trajectory:result.path,mechanismPaths:method.paths,syntheticN:method.n,
    warning:"Coach V11 proxy, not full V12 careerTick; independent synthetic mechanism and input mapping. No causal link to GDP."};
 });
 const blindspots=section("blindspot_and_review",()=>{
  const notes=E.blindspots(stableData);
  return notes.map(n=>({priority:n.priority,title:n.title,category:n.category,next:n.next})).slice(0,12);
 });
 assert(fingerprint===C.identity(data),"Data bundle mutated by pipeline");
 const payload={schema:"boluo-full-run/1",scenario_id:options.scenarioId||"BL-FULL-DEMO-20261120",
   as_of:"2026-11-20",dataset_id:data.meta.dataset_id,fingerprint,seed,
   status:"complete_synthetic_demonstration_not_approved_for_decisions",
   modules:completed,public:publicRecords,quality,project,industry,talent,enterprise,
   relationship,macro,sensitivity,path,coach,blindspots,
   compatibility:{project_to_macro:false,network_to_macro:false,pls_to_gdp:false,
    coach_to_real_enterprise:false,firm_revenue_to_gdp:false,
    reason:"Distinct accounting populations, synthetic records, and unestimated cross-model structural coefficients"},
   assumptions:{delay,affectedPct,proxy,sourceShock,bootstrap,trials,
    all_company_and_relationship_data:"synthetic",real_data_only:"2025 and 2026 published high-level GDP summaries"},
   nextEvidence:["Verified enterprise orders/capacity/profit and firm IDs",
    "Project-level plans, commissioning evidence and project-to-enterprise links",
    "Verified directed procurement/contract networks",
    "Representative surveys with sample frame and temporal identification",
    "Gross output accounting mapping separate from value added"]};
 return payload;
}
return Object.freeze({run,validateAnchors});
});
