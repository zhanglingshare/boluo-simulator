/* Core KPI mirror — no new calculations. Reflect existing windtunnel outputs only. */
(function(){
"use strict";
const hit=document.getElementById("hitNum"),p50=document.getElementById("p50Num");
const outHit=document.getElementById("bl-kpi-hit"),outP50=document.getElementById("bl-kpi-p50");
if(!hit||!p50||!outHit||!outP50)return;
function sync(){
 const v=(hit.textContent||"").trim();
 const p=(p50.textContent||"").trim();
 outHit.textContent=/^\d+(\.\d+)?%$/.test(v)?v:"—";
 outP50.textContent=/^\d[\d,]*亿$/.test(p)?p:"—";
}
const ob=new MutationObserver(sync);
ob.observe(hit,{subtree:true,childList:true,characterData:true});
ob.observe(p50,{subtree:true,childList:true,characterData:true});
sync();
})();