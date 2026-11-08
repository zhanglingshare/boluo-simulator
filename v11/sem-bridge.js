(() => {
"use strict";
const m=window.BoluoSemDemo;
if(!m)return;
const $=id=>document.getElementById(id);
const input=$("semInvestment"),network=$("semNetwork");
if(!input||!network)return;
const fmt=n=>(n>0?"+":"")+n.toFixed(2);
function draw(){
const x=Number(input.value),z=Number(network.value);
const out=m.calculate({investmentIndex:x,network:z,coefficients:window.BoluoPathLab?.getCoefficients?.()});
$("semInvestValue").textContent=x.toFixed(1);
$("semNetworkValue").textContent=String(z);
$("semDirect").textContent=fmt(out.direct);
$("semIndirect").textContent=fmt(out.indirect);
$("semTotal").textContent=fmt(out.total);
$("semMediator").textContent=fmt(out.mediator);
$("semPathAdjusted").textContent=out.moderated.toFixed(2);
$("semDirectBar").style.width=Math.min(100,Math.abs(out.direct)*100).toFixed(1)+"%";
$("semIndirectBar").style.width=Math.min(100,Math.abs(out.indirect)*100).toFixed(1)+"%";
$("semDirectBar").dataset.sign=out.direct<0?"neg":"pos";
$("semIndirectBar").dataset.sign=out.indirect<0?"neg":"pos";
const delta=x-m.anchors.investmentIndex;
$("semInterpret").textContent=(Math.abs(delta)<.2?
"当前投资指数与公开观察锚点相同，教学模型的相对响应为零。":
"投资指数相对2026年同期观察锚点"+(delta>=0?"提高":"降低")+Math.abs(delta).toFixed(1)+"个指数点。")+
" 在本组教学假设下，中介响应为"+fmt(out.indirect)+"、直接响应为"+fmt(out.direct)+"。这些是无量纲结构响应，不是GDP亿元，也不是实证效应。";
const u=new URL("./insights.html",location.href);
const qs=new URL(location.href).searchParams;
["shock","strength","buffer","active","bs","bv","n","line","view","bp0","bp1","bp2","bp3","bp4"].forEach(key=>{if(qs.has(key))u.searchParams.set(key,qs.get(key));});
const suggested={delay:"project",invest:"project",orders:"network",traffic:"people"};
const shock=qs.get("shock");
u.searchParams.set("focus",shock==="orders"?"retention":shock==="traffic"?"resilience":"growth");
u.searchParams.set("factor",suggested[shock]||"project");
$("semToEight").href=u.href;
}
input.addEventListener("input",draw);network.addEventListener("input",draw);
$("semReset").addEventListener("click",()=>{input.value=String(m.anchors.investmentIndex);network.value="50";draw();});
$("semToEight").addEventListener("click",draw);
$("semToEight").addEventListener("pointerenter",draw);
$("semToEight").addEventListener("focus",draw);
draw();
window.BoluoSemBridge={calculate:m.calculate,render:draw};
})();
