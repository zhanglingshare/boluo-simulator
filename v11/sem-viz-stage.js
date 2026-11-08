/* V11 visual stages: observation charts and theory-example interactions.
   No fitted SmartPLS coefficients and no economic-loss conversion. */
(() => {
"use strict";
const m=window.BoluoSemDemo;
if(!m)return;
const $=id=>document.getElementById(id);
const mark=(n)=>(n>0?"+":"")+Number(n).toFixed(2);
function put(id,v){const e=$(id);if(e)e.textContent=v;}
function setChartBar(id,v){
 const e=$(id);if(!e)return;
 const n=Number.isFinite(+v)?Number(v):0;
 const width=Math.min(48,Math.abs(n)/.6*48);
 e.style.left=(n<0?50-width:50)+"%";
 e.style.width=width+"%";
 e.closest(".viz-bar-row")?.classList.toggle("negative",n<0);
 e.setAttribute("aria-label",n<0?"负向结构响应":"正向结构响应");
}
function initSeven(){
 const st=$("semVisualStage"),investment=$("semInvestment"),network=$("semNetwork");
 if(!st||!investment||!network)return;
 const nodes=[...st.querySelectorAll("[data-sem-focus]")];
 const help={
 x:{title:"X · 项目接续",body:"投资指数下降是观察事实；它是否压缩下一轮项目接续，还需要逐项目进度来判断。"},
 m:{title:"M · 产能兑现",body:"这是中介变量：从投资到投产存在设备安装、试产和达产时间差。要用项目与产线数据验证。"},
 y:{title:"Y · 增长接续",body:"工业增加值与GDP并不是一个单位。下方响应只展示结构假设如何变化，不能换算成实际GDP。"}
 };
 let focused="m";
 function focusNode(x){
 focused=help[x]?x:"m";
 nodes.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.semFocus===focused)));
 put("vizFocusTitle",help[focused].title);put("vizFocusBody",help[focused].body);
 }
 nodes.forEach(b=>b.addEventListener("click",()=>focusNode(b.dataset.semFocus)));
 function render(){
 const out=m.calculate({investmentIndex:Number(investment.value),network:Number(network.value)});
 put("vizScenarioIndex",out.investmentIndex.toFixed(1));
 put("vizScenarioNetwork",String(out.network));
 put("vizDirect",mark(out.direct));
 put("vizIndirect",mark(out.indirect));
 put("vizTotal",mark(out.total));
 put("vizPathM",mark(out.mediator));
 put("vizPathY",out.moderated.toFixed(2));
 setChartBar("vizBarDirect",out.direct);setChartBar("vizBarIndirect",out.indirect);setChartBar("vizBarTotal",out.total);
 st.dataset.direction=out.total<0?"negative":out.total>0?"positive":"neutral";
 st.classList.remove("is-recomputing");
 void st.offsetWidth;
 st.classList.add("is-recomputing");
 st.querySelectorAll("[data-viz-preset]").forEach(b=>b.setAttribute("aria-pressed",String(Math.abs(out.investmentIndex-Number(b.dataset.vizPreset))<.15)));
 }
 investment.addEventListener("input",render);
 network.addEventListener("input",render);
 $("semReset")?.addEventListener("click",render);
 st.querySelectorAll("[data-viz-preset]").forEach(b=>b.addEventListener("click",()=>{
  investment.value=b.dataset.vizPreset;
  if(b.dataset.networkPreset)network.value=b.dataset.networkPreset;
  investment.dispatchEvent(new Event("input",{bubbles:true}));
  network.dispatchEvent(new Event("input",{bubbles:true}));
  render();
 }));
 focusNode(focused);render();
 window.BoluoStageSeven={render,getFocus:()=>focused};
}
function initEight(){
 const scene=$("blindspotScene");
 if(!scene||!window.BoluoInsights)return;
 const dots=$("blindspotOrbit");
 let severed=false;
 const coords=[
 [160,86],[500,55],[840,86],[190,344],[810,344]
 ];
 function makeEdges(){
 const lines=$("blindspotSvg");
 if(!lines)return;
 lines.replaceChildren();
 for(let i=0;i<5;i++){
 const p=document.createElementNS("http://www.w3.org/2000/svg","path");
 const [x,y]=coords[i];
 const midx=(x+500)/2, midy=(y+215)/2+(y<215?-14:14);
 p.setAttribute("d",`M ${x} ${y} Q ${midx} ${midy} 500 215`);
 p.setAttribute("class","link");
 p.dataset.visEdge=String(i);
 lines.append(p);
 }
 }
 function render(){
 const s=window.BoluoInsights.getState();
 const target=m.targets[s.target]||m.targets.growth;
 const selected=target.factors.find(x=>x.id===s.factor)||target.factors[0];
 put("blindspotCenterTitle",target.title);
 put("blindspotTarget",severed?"刚才这条假设连线被你断开：若该机制并不存在，仅凭现有公开数据，不能用它解释“"+target.title+"”。":"当前目标："+target.question);
 put("blindspotWhy",severed?"联系一旦不成立，原来的解释就失去这条依据。先核对： "+selected.why:selected.why);
 scene.setAttribute("data-cut",String(severed));
 put("blindspotMissing",selected.missing);
 dots.replaceChildren();
 target.factors.forEach((f,i)=>{
 const b=document.createElement("button");
 b.type="button";b.className="blindspot-orbit";b.dataset.i=String(i);b.dataset.factor=f.id;
 b.setAttribute("aria-pressed",String(selected.id===f.id));
 b.setAttribute("aria-label","打开"+f.name+"的核验问题");
 const no=document.createElement("small");no.textContent="候选联系 "+String(i+1).padStart(2,"0");
 const title=document.createElement("strong");title.textContent=f.name;
 b.append(no,title);
 b.addEventListener("click",()=>{
 const targetBtn=$("mapDots")?.querySelector('[data-factor="'+f.id+'"]');
 if(targetBtn){severed=false;targetBtn.click();render();}
 });
 dots.append(b);
 });
 scene.querySelectorAll("[data-vis-edge]").forEach((p,i)=>{
   const isSelected=target.factors[i]?.id===selected.id;
   p.classList.toggle("is-active",isSelected&&!severed);
   p.classList.toggle("is-cut",isSelected&&severed);
 });
 const toggle=$("blindspotToggle");
 if(toggle){toggle.textContent=severed?"重新连接这条假设":"断开这条假设连线";toggle.setAttribute("aria-pressed",String(severed));}
 }
 makeEdges();
 document.querySelectorAll("[data-target]").forEach(b=>b.addEventListener("click",()=>{severed=false;render();}));
 $("mapDots")?.addEventListener("click",()=>{severed=false;render();});
 window.addEventListener("popstate",()=>{severed=false;render();});
 $("blindspotToggle")?.addEventListener("click",()=>{severed=!severed;render();});
 $("blindspotNext")?.addEventListener("click",()=>{
 const s=window.BoluoInsights.getState();
 const t=m.targets[s.target]||m.targets.growth;
 const sorted=[...t.factors].sort((a,b)=>b.importance*(100-b.performance)-a.importance*(100-a.performance));
 const i=sorted.findIndex(x=>x.id===s.factor);
 const next=sorted[(i+1)%sorted.length]||sorted[0];
 const btn=$("mapDots")?.querySelector('[data-factor="'+next.id+'"]');
 if(btn)btn.click();
 severed=false;render();
 });
 render();
 window.BoluoStageEight={render};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{initSeven();initEight();});
else{initSeven();initEight();}
})();
