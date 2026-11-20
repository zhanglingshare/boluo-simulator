/* Boluo unified execution adapter v1 | synthetic research only.
 * Calls ORIGINAL BoluoCore.demo and BoluoEngine.simulate without modifying them.
 * Project delays are schedule changes; macro effect is a SEPARATE scenario proxy.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.BoluoProjectBridge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const assert=(v,msg)=>{if(!v)throw Error(msg)};
const deepCopy=x=>JSON.parse(JSON.stringify(x));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function projectSchedule(data,years,affectedPct=50){
 assert(Number.isInteger(years)&&years>=0&&years<=3,"Project delay must be integer years 0..3");
 assert(Number.isFinite(affectedPct)&&affectedPct>=0&&affectedPct<=100,"Affected percent 0..100");
 const projects=data.tables.projects||[];
 const eligible=projects.filter(p=>p.stage!=="operating"&&Number.isFinite(Number(p.commissionYear)))
    .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const selected=new Set(eligible.slice(0,Math.round(eligible.length*affectedPct/100)).map(x=>String(x.id)));
 const rows=projects.map(p=>{
  const before=Number(p.commissionYear), moved=selected.has(String(p.id))&&years>0;
  return {id:String(p.id),sector:p.sector,stage:p.stage,before,after:before+(moved?years:0),moved};
 });
 const countBy=(key,year)=>rows.filter(x=>x.stage!=="operating"&&Number.isFinite(x[key])&&x[key]<=year).length;
 return {eligible:eligible.length,selected:selected.size,delayed:rows.filter(x=>x.moved).length,
  crossed2032:rows.filter(x=>x.moved&&x.before<=2032&&x.after>2032).length,
  before2032:countBy("before",2032),after2032:countBy("after",2032),rows,
  warning:"计划投产时点调整，不代表实际竣工、收入、增加值或项目成功概率。"};
}
function run(scenario,variableDictionary,modelRegistry,runtime,options={}){
 assert(runtime&&runtime.Core&&runtime.Engine&&runtime.Contracts,"Missing original runtime or contract layer");
 const {Core,Engine,Contracts}=runtime;
 const valid=Contracts.validateScenario(scenario,variableDictionary);
 assert(valid.ok,"Scenario contract invalid: "+JSON.stringify(valid.errors));
 assert(scenario.evidence_mode==="demo","V1 demo bridge rejects mixed or verified datasets");
 assert(scenario.model_id==="lab2032.sector_sim","Model selection must be lab2032.sector_sim");
 const m=Contracts.modelCheck(scenario.model_id,modelRegistry);
 assert(m.ok,"Model is not registered");
 const delta=scenario.changes.find(c=>c.variable==="project.delay_years");
 assert(delta&&Number.isInteger(delta.value),"Project delay integer required");
 const source=options.data||Core.demo();
 assert(source.meta?.mode==="DEMO","Only synthetic demo permitted in v1");
 const fingerprint=Core.identity(source);
 const frozen=deepCopy(source);
 const sharePct=options.affectedPct??50;
 const schedule=projectSchedule(frozen,delta.value,sharePct);
 // A normalized proxy knob is NOT an identified mapping from 1 year to GDP.
 // Explicitly separate accounting for schedule and assumption-based macro scenario.
 const proxy=options.proxyStrength??0.5;
 assert(Number.isFinite(proxy)&&proxy>=0&&proxy<=1,"Proxy strength must be 0..1");
 const draws=options.draws??500;
 assert(Number.isInteger(draws)&&draws>=300&&draws<=8000,"Draw count invalid");
 const common={scenario:"balanced",seed:scenario.seed,trials:draws};
 const base=Engine.simulate(frozen,common);
 const stressed=Engine.simulate(frozen,{...common,knobs:{project_delay:delta.value>0?proxy:0}});
 const summarize=r=>({gdp:r.totals,sectorShare:r.sectors.map(x=>({sector:x.key,p10:x.share.p10,p50:x.share.p50,p90:x.share.p90})),yearly:r.yearly});
 const result={
  protocol:"boluo-execution/1",scenario_id:scenario.scenario_id,data_snapshot:scenario.data_snapshot,
  demo_identity:fingerprint,seed:scenario.seed,model_id:m.model.id,model_version:m.model.version,
  evidence_mode:"demo",projects:schedule,
  baseline:summarize(base),illustrativeMacroStress:summarize(stressed),
  macroDifference:+(stressed.totals.p50-base.totals.p50).toFixed(4),
  mapping:{type:"assumption_only",normalized_project_delay_knob:delta.value>0?proxy:0,
   schedule_delay_years:delta.value,affected_project_pct:sharePct,
   causal_link_established:false,
   explanation:"Schedule shift and macro growth proxy are two parallel tests. No empirical relationship between delayed project years and GDP is established."},
  warnings:["All firm, project, network and history records are synthetic demo; 2025 macro reference unverified.",
            "Macro model uses explicit authored project_delay knob, NOT the moved project years.",
            "GDP result here uses sector value added and is NOT gross industrial output or the 1:5:4 gross-output target.",
            "Do not infer policy causal effects or real-world target achievement."]
 };
 assert(Core.identity(source)===fingerprint,"Existing dataset was mutated");
 return result;
}
return Object.freeze({projectSchedule,run});
});
