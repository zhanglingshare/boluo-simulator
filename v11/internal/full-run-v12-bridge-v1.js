/* Conservative full-pipeline to V12 career bridge. Same run id + seed, independent model state.
 * Neither project delays nor GDP model results are converted into enterprise scores.
 */
(function(){
"use strict";
const KEY="boluo-full-v12-handoff-v1",p=document.getElementById("view-season");
if(!p)return;
const card=document.createElement("section");card.className="career-panel";card.style.cssText="border-color:#ba995f;margin:12px 0;background:linear-gradient(115deg,#213b4c,#1a2939)";card.innerHTML='<h4>◇ 统一情景接力 · V12 原生季度经营</h4><p id="v12RunIntro" class="career-muted">等待统一情景编号。</p><div class="career-controls"><button class="career-btn secondary" id="v12HandoffRun">▶ 用原生 V12 跑12季度</button><a class="career-btn secondary" style="text-decoration:none" href="../../core/workbench/">返回统一工作台</a></div><div id="v12HandoffResult" class="v10-alert">此处读取当前经理阵容，独立运行V12季度状态引擎；不会将72个合成项目强行匹配到主场现实企业档案。</div>';
p.insertBefore(card,p.children[1]||null);
function read(){try{const s=JSON.parse(sessionStorage.getItem(KEY)||"null");return s?.schema==="boluo-v12-independent-handoff/1"&&Number.isSafeInteger(s.seed)?s:null}catch(e){return null}}
function paint(){
 const s=read(),intro=document.getElementById("v12RunIntro");
 intro.textContent=s?"已接收情景 "+s.scenario_id+" ｜固定种子 "+s.seed+" ｜项目延期 "+s.delay+" 年。V12 使用自身经理状态，跨模型仅共享编号和随机种子。":"尚未从统一工作台接收到情景。仍可使用当前经理阵容作独立原生V12实验。";
}
paint();
document.getElementById("v12HandoffRun").onclick=()=>{
 const s=read(),btn=document.getElementById("v12HandoffRun"),output=document.getElementById("v12HandoffResult");
 btn.disabled=true;output.textContent="正在执行原生 V12 配对季度模拟……";
 setTimeout(()=>{
  try{
   if(!window.BoluoCareerUnified)throw Error("原生V12计算接口未加载");
   const horizon=Math.min(12,28-career.quarter);
   if(horizon<1)throw Error("经理赛季已经完成28季度，需重开赛季");
   const seed=s?s.seed:20261120;
   const result=window.BoluoCareerUnified.forecast({}, {seed,n:100,horizon});
   const stats=window.BoluoCareerUnified.stats();
   output.innerHTML='<b style="color:#f4d28b">V12季度引擎已执行｜'+horizon+'季度</b>'+
    '<div class="v9-outcomes"><div class="v9-outcome"><b>'+result.p50+'</b><span>终期能力指数 P50</span></div>'+
    '<div class="v9-outcome"><b>'+result.p10+'–'+result.p90+'</b><span>P10–P90</span></div>'+
    '<div class="v9-outcome"><b>'+result.n+'</b><span>共同种子抽样数</span></div>'+
    '<div class="v9-outcome"><b>'+stats.iterations+'</b><span>累计模型迭代计数</span></div></div>'+
    '<div class="career-muted">该结果来自 V12 实际 careerTick、当前经理阵容与模拟网络，不是宏观GDP，也不是项目延期的可识别经营后果。未把合成研究企业自动绑定现实企业。</div>';
  }catch(err){output.textContent="V12运行失败："+err.message;console.error(err)}
  finally{btn.disabled=false}
 },20);
};
window.addEventListener("focus",paint);
})();
