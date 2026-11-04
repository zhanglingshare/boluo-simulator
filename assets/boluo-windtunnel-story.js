/* Three-line human interpretation of original 2026 pressure scenarios. No new parameters. */
(function(){
"use strict";
const compare=document.getElementById("pressCompare"),grid=document.getElementById("pressGrid");
if(!compare||!grid||typeof blRunScene!=="function"||typeof BL_SCENES==="undefined")return;
const title={
base:"规划兑现基准：关键是项目能否按设定节奏落地。",
investment:"如果工业投资低迷持续，新投产接力可能面临延迟压力。",
property:"如果房地产继续探底，相关配套与三产路径可能受到约束。",
combined:"工业投资与地产压力叠加，多条路径可能同时承压。",
trend:"不加码的现状延续情景，不能被误读为确定会发生的未来。",
upside:"如果电子信息和新能源项目提前放量，结果可能向好。"
};
const panel=document.createElement("section");panel.className="bl-press-story";panel.setAttribute("aria-live","polite");
const header=document.createElement("strong");header.textContent="这次推演，现实里可能意味着什么？";
const lines=[document.createElement("p"),document.createElement("p"),document.createElement("p")];
lines.forEach((p,i)=>{const tag=document.createElement("b");tag.textContent=["01 结果：","02 机制：","03 尚缺："][i];p.append(tag,document.createTextNode(""))});
panel.append(header,...lines);
compare.insertAdjacentElement("afterend",panel);
function setLine(index,value){
 const p=lines[index];
 while(p.childNodes.length>1)p.removeChild(p.lastChild);
 p.append(document.createTextNode(value));
}
function update(key){
 if(!BL_SCENES[key])key="base";
 const a=blRunScene(key),b=blRunScene("base"),delta=a.hit-b.hit,dp=a.p50-b.p50;
 setLine(0,"相较规划兑现基准，达标样本占比变化 "+(delta>0?"+":"")+delta.toFixed(1)+" 个百分点，2030中位结果变化 "+(dp>0?"+":"")+Math.round(dp)+" 亿元。");
 setLine(1,title[key]);
 setLine(2,"具体镇街订单、消费、就业等二次传导尚无充分的微观证据与模型映射，不把这条影响链当作事实。");
}
grid.addEventListener("click",e=>{const b=e.target.closest("[data-key]");if(b)update(b.dataset.key)});
const selected=grid.querySelector(".ptile.sel");update(selected?.dataset.key|| (typeof blInitialScene==="function"?blInitialScene():"base"));
})();