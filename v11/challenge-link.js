/* Public page-07 result handoff to page 09; no weights or model internals. */
(()=>{"use strict";
 const link=document.getElementById("goDecisionChallenge");
 if(!link)return;
 const keep=["shock","strength","buffer","active","bs","bv","bp0","bp1","bp2","bp3","bp4","n","line","view"];
 const key="boluo-v11-challenge-07";
 function update(detail){
  const url=new URL("./challenge.html",location.href),current=new URL(location.href).searchParams;
  keep.forEach(k=>{if(current.has(k))url.searchParams.set(k,current.get(k))});
  const state=window.BoluoWind?.getState?.(),results=window.BoluoWind?.getResults?.();
  if(state)url.searchParams.set("shock",state.shock);
  link.href=url.href;
  if(!state||!results?.base||!results?.stress)return;
  const summary=(s)=>({p10:Number(s.p10),p50:Number(s.p50),p90:Number(s.p90)});
  const snapshot={v:1,shock:state.shock,strength:state.strength,buffer:state.buffer,base:summary(results.base),stress:summary(results.stress),savedAt:new Date().toISOString()};
  try{sessionStorage.setItem(key,JSON.stringify(snapshot))}catch(e){}
 }
 window.addEventListener("boluo:wind-run",e=>update(e.detail));
 update();
})();