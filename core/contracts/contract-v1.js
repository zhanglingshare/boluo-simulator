/* Boluo contract v1: data validation and compatibility only, no economic calculation.
 * Works as Node CommonJS or standalone browser global. No automatic legacy rewrites.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.BoluoContracts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERSION="boluo-scenario/1";
const ERROR=(code,message)=>({code,message});
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const plain=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
const slug=s=>typeof s==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(s);
const jsonSafe=o=>{try{return JSON.parse(JSON.stringify(o))}catch{return null}};
function validateScenario(s,dictionary){
 const errors=[];
 if(!plain(s))return {ok:false,errors:[ERROR("OBJECT","Scenario must be an object")]};
 if(s.schema!==VERSION)errors.push(ERROR("SCHEMA","Expected "+VERSION));
 for(const key of ["scenario_id","baseline_id","data_snapshot"])if(!slug(s[key]))errors.push(ERROR("IDENTIFIER","Invalid "+key));
 if(!plain(s.period)||!/^20\d{2}-Q[1-4]$/.test(s.period.start||"")||!/^20\d{2}-Q[1-4]$/.test(s.period.end||""))errors.push(ERROR("PERIOD","Quarter bounds required"));
 else {
  const toIndex=x=>Number(x.slice(0,4))*4+Number(x.slice(-1));
  if(toIndex(s.period.start)>toIndex(s.period.end))errors.push(ERROR("PERIOD_ORDER","start exceeds end"));
 }
 if(!Number.isSafeInteger(s.seed)||s.seed<0||s.seed>4294967295)errors.push(ERROR("SEED","Unsigned 32-bit seed required"));
 if(!Array.isArray(s.changes)||s.changes.length>100)errors.push(ERROR("CHANGES","changes must be array (max 100)"));
 else {
  const validKinds=new Set(["decision","exogenous","state","structure"]);
  const vars=new Map((dictionary&&dictionary.variables||[]).map(v=>[v.id,v]));
  for(const [i,c] of s.changes.entries()){
   if(!plain(c)||!slug(c.variable)||!validKinds.has(c.kind)||!finite(c.value)||typeof c.unit!=="string")
    {errors.push(ERROR("CHANGE_FORMAT","Invalid change #"+i));continue}
   const def=vars.get(c.variable);
   if(!def){errors.push(ERROR("UNKNOWN_VARIABLE","Unknown "+c.variable));continue}
   if(def.availability==="proposed")errors.push(ERROR("NOT_IMPLEMENTED","Variable is only proposed: "+c.variable));
   if(def.unit!==c.unit)errors.push(ERROR("UNIT_MISMATCH",c.variable+" expected "+def.unit+", got "+c.unit));
   if(!["decision","exogenous","state","structure"].includes(def.kind)||def.kind!==c.kind)
    errors.push(ERROR("KIND_MISMATCH","Change category mismatches registered variable: "+c.variable));
  }
 }
 if(typeof s.evidence_mode!=="string"||!["demo","mixed_unverified","verified"].includes(s.evidence_mode))errors.push(ERROR("EVIDENCE_MODE","Explicit evidence mode required"));
 if(s.evidence_mode==="verified"&&!s.review_id)errors.push(ERROR("REVIEW","Verified mode requires review_id"));
 if(s.review_id&&!slug(s.review_id))errors.push(ERROR("REVIEW_ID","Invalid review ID"));
 if(s.model_id&&!slug(s.model_id))errors.push(ERROR("MODEL_ID","Invalid model ID"));
 return {ok:!errors.length,errors};
}
function modelCheck(id,registry){
 const model=(registry&&registry.models||[]).find(m=>m.id===id);
 if(!model)return {ok:false,code:"UNKNOWN_MODEL",message:"Model is not registered"};
 return {ok:true,model,status:model.status,ready:model.status==="integrated_verified"};
}
function compareOutputs(a,b,registry){
 if(!plain(a)||!plain(b)||!a.model_id||!b.model_id)return {ok:false,code:"UNREGISTERED_RESULT"};
 const A=modelCheck(a.model_id,registry),B=modelCheck(b.model_id,registry);
 if(!A.ok||!B.ok)return {ok:false,code:"UNKNOWN_MODEL"};
 const block=(registry.incompatibilities||[]).find(x=>(x.a===a.model_id&&x.b===b.model_id)||(x.a===b.model_id&&x.b===a.model_id));
 if(block)return {ok:false,code:"INCOMPATIBLE_MODELS",reason:block.reason};
 for(const key of ["measure","unit","period","data_snapshot"]){
  if(typeof a[key]!=="string"||typeof b[key]!=="string"||a[key]!==b[key])
   return {ok:false,code:"DIMENSION_MISMATCH",reason:"Different or missing "+key};
 }
 if(a.model_id===b.model_id&&a.model_version!==b.model_version)return {ok:false,code:"VERSION_MISMATCH"};
 if(!a.model_version||!b.model_version)return {ok:false,code:"MISSING_VERSION"};
 return {ok:true,code:"COMPARABLE_METADATA_ONLY",note:"Same units, window and data snapshot; this is not statistical or causal equivalence"};
}
function envelope(s,model,result,metadata={}){
 const data=jsonSafe(result);
 if(data===null)throw Error("Result must be JSON serializable");
 return Object.freeze({
  schema:"boluo-result/1",scenario_id:s.scenario_id,model_id:model.id,model_version:model.version,
  baseline_id:s.baseline_id,data_snapshot:s.data_snapshot,seed:s.seed,evidence_mode:s.evidence_mode,
  status:"unverified",generated_at:metadata.generated_at||null,measure:metadata.measure||null,
  unit:metadata.unit||null,period:metadata.period||null,result:data
 });
}
return Object.freeze({VERSION,validateScenario,modelCheck,compareOutputs,envelope});
});
