/* V11 / Interpretive structural experience.
   Every output is a scenario index built from editable teaching assumptions.
   It is NOT an observed probability, GDP change, or fitted causal estimate. */
(()=>{
"use strict";
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+n)?+n:a));
const create=target=>target.factors.map(f=>({
 id:f.id,name:f.name,kind:f.kind,why:f.why,missing:f.missing,link:f.link,
 importance:clamp(f.importance,0,100),performance:clamp(f.performance,0,100),substitute:35
}));
function exposure(f,severity,substitute=f.substitute){
 /* Max 100, conditional relative index. Not a measured economic quantity. */
 const importance=clamp(f.importance,0,100)/100;
 const gap=(100-clamp(f.performance,0,100))/100;
 const shock=clamp(severity,0,100)/100;
 const buffer=1-.75*(clamp(substitute,0,100)/100);
 return importance*gap*shock*buffer*100;
}
function analyze(factors,selectedId,severity,cut=false){
 const rows=factors.map(f=>({
  ...f,score:exposure(f,severity),unbuffered:exposure(f,severity,0),
  isSelected:f.id===selectedId
 }));
 const selected=rows.find(f=>f.id===selectedId)||rows[0];
 const full=rows.reduce((s,f)=>s+f.score,0)/Math.max(1,rows.length);
 const excluded=full-selected.score/Math.max(1,rows.length);
 const current=cut?excluded:full;
 const ranked=[...rows].sort((a,b)=>b.score-a.score);
 const priorityRank=ranked.findIndex(f=>f.id===selected.id)+1;
 return {rows,ranked,selected,full,excluded,current,
  priorityRank,contribution:selected.score/rows.length,
  fragility:selected.score,
  highImpact:ranked[0],selectedUnbuffered:selected.unbuffered,
  scenarioWithoutSubstitution:rows.reduce((sum,f)=>sum+(f.id===selected.id?f.unbuffered:f.score),0)/rows.length,
  scenarioWithBuffer:full
 };
}
function grid(f,levels=[20,35,50,65,80,95],substitutes=[0,20,40,60,80,100]){
 return levels.map(severity=>substitutes.map(substitute=>({
  severity,substitute,value:exposure(f,severity,substitute)
 })));
}
window.BoluoInsightEngine=Object.freeze({clamp,create,exposure,analyze,grid});
})();
