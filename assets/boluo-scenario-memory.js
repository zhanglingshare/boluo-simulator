/* Reuse the existing six-scenario windtunnel calculation across future/report/ending. */
(function(){
"use strict";
const params=new URLSearchParams(location.search);
const labels={base:"规划兑现",investment:"工业投资低迷",property:"房地产继续探底",combined:"投资与地产叠加",trend:"现状延续",upside:"双引擎超预期"};
const query=params.get("scene");
let stored="";try{stored=localStorage.getItem("bl_v1_2026_selected_scenario")||"";}catch(e){}
const key=labels[query]?query:labels[stored]?stored:"";
if(!key)return;
const page=decodeURI(location.pathname).split("/").pop(),wrap=document.querySelector(".wrap");
if(!wrap)return;
const box=document.createElement("section");box.className="bl-scene-memory";box.setAttribute("aria-label","你刚才选择的压力情景");
const label=document.createElement("div");label.className="bl-scene-label";label.textContent="正在延续你的情景 / "+labels[key];
box.append(label);
if(typeof blRunScene==="function"&&typeof HT!=="undefined"&&typeof BL_SCENES!=="undefined"){
 const current=blRunScene(key),base=blRunScene("base");
 const headline=document.createElement("div");headline.className="bl-scene-headline";
 const median=document.createElement("strong");median.textContent=Math.round(current.p50).toLocaleString("zh-CN")+"亿";
 const hit=document.createElement("span");hit.textContent=current.hit.toFixed(1)+"% 达标样本占比";
 headline.append(median,hit);box.append(headline);
 const delta=current.hit-base.hit;
 const detail=document.createElement("p");detail.textContent="同一原风洞模型：P10–P90为 "+Math.round(current.p10).toLocaleString("zh-CN")+"—"+Math.round(current.p90).toLocaleString("zh-CN")+"亿元；与规划兑现基准相比，达标样本占比 "+(delta>=0?"+":"")+delta.toFixed(1)+" 个百分点。";
 box.append(detail);
}
const caveat=document.createElement("p");caveat.className="bl-scene-caveat";
caveat.textContent=page==="future.html"?"当前页的主模拟已读取这一情景的路径参数；部分解释性图表和示例仍保留原有口径，不等于现实预测。":
 page==="report.html"?"这是与你风洞选择一致的情景结果；本报告其余图表仍包含基准和多情景对照，不能全部解读为已自动切换。":
 "本次推演仅是当前条件下的模型结果，不替你作决策。";
box.append(caveat);
const a=document.createElement("a");a.href="windtunnel-v2.html?scene="+encodeURIComponent(key);a.textContent="返回风洞调整 →";box.append(a);
const first=wrap.querySelector(".bl-tail-hero");if(first)first.insertAdjacentElement("afterend",box);else wrap.insertBefore(box,wrap.firstChild);
})();