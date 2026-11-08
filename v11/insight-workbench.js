(()=>{
"use strict";
const data=window.BoluoPublicTopics,core=window.BoluoInsightEngine;
if(!data||!core){const e=document.getElementById("iqGoalPrompt");if(e)e.textContent="情景引擎未加载，请刷新页面";return;}
const $=id=>document.getElementById(id);
const targetNames=Object.keys(data.targets);
const coords=[[18,19],[50,12],[82,19],[19,81],[81,81]];
const seedParams=new URL(location.href).searchParams;
const incomingShock={delay:"project",invest:"project",orders:"network",traffic:"people"};
const clamp=core.clamp;
const state={
 target:targetNames.includes(seedParams.get("focus"))?seedParams.get("focus"):"growth",
 selectedId:seedParams.get("factor")||incomingShock[seedParams.get("shock")]||null,
 severity:clamp(seedParams.get("sv")??70,10,100),
 cut:seedParams.get("cut")==="1",
 touched:0,
 sources:{},
 playing:false
};
for(const t of targetNames)state.sources[t]=core.create(data.targets[t]);
function initFromUrl(){
 const t=state.target,ix=seedParams.get("ix");
 if(!ix)return;
 const parts=ix.split(".");
 if(parts.length!==state.sources[t].length)return;
 parts.forEach((part,i)=>{
  const v=part.split("-").map(Number);
  if(v.length!==3||v.some(n=>!Number.isFinite(n)))return;
  const f=state.sources[t][i];f.importance=clamp(v[0],0,100);f.performance=clamp(v[1],0,100);f.substitute=clamp(v[2],0,100);
 });
}
initFromUrl();
function source(){return state.sources[state.target];}
function active(){return source().find(f=>f.id===state.selectedId)||source()[0];}
function actualSelected(){state.selectedId=active().id;return active();}
function measure(){return core.analyze(source(),active().id,state.severity,state.cut);}
function paintLink(e,settings){
 if(!e)return;
 const s=settings||{};
 e.classList.toggle("is-selected",!!s.selected&&!s.cut);
 e.classList.toggle("is-cut",!!s.selected&&!!s.cut);
 e.classList.toggle("is-muted",!s.selected);
 e.style.strokeWidth=(2+Math.min(5,Number(s.width)||0)).toFixed(1);
}
function drawNodes(result){
 const container=$("iqNetworkNodes"),svg=$("iqNetworkLines");
 const list=source(),selected=active();
 const key=state.target;
 if(container.dataset.builtFor!==key){
  container.replaceChildren();svg.replaceChildren();
  const defs=document.createElementNS("http://www.w3.org/2000/svg","defs");
  const marker=document.createElementNS("http://www.w3.org/2000/svg","marker");
  marker.setAttribute("id","iqArrow");marker.setAttribute("viewBox","0 0 10 10");marker.setAttribute("refX","8");marker.setAttribute("refY","5");marker.setAttribute("markerWidth","6");marker.setAttribute("markerHeight","6");marker.setAttribute("orient","auto");
  const arrow=document.createElementNS("http://www.w3.org/2000/svg","path");arrow.setAttribute("d","M0 0 L10 5 L0 10 Z");arrow.setAttribute("fill","#6cd9e7");marker.append(arrow);defs.append(marker);svg.append(defs);
  list.forEach((f,i)=>{
   const p=document.createElementNS("http://www.w3.org/2000/svg","path");
   p.dataset.edge=f.id;
   p.classList.add("iq-edge");
   const [px,py]=coords[i],x=px*10,y=py*5;
   const bend=(i===1?-60:i===3||i===4?42:-38);
   p.setAttribute("d",`M ${x} ${y} Q ${(x+500)/2} ${(y+255)/2+bend} 500 255`);
   p.setAttribute("marker-end","url(#iqArrow)");svg.append(p);
   const button=document.createElement("button");button.type="button";button.className="iq-node";button.dataset.node=f.id;
   button.style.left=px+"%";button.style.top=py+"%";
   const small=document.createElement("small");small.textContent="联系 "+String(i+1).padStart(2,"0");
   const title=document.createElement("strong");title.textContent=f.name;
   const score=document.createElement("b");score.dataset.nodeScore=f.id;score.textContent="—";
   button.append(small,title,score);
   button.addEventListener("click",()=>selectFactor(f.id,true));
   container.append(button);
  });
  container.dataset.builtFor=key;
 }
 list.forEach((f,i)=>{
  const row=result.rows[i],on=f.id===selected.id;
  const btn=container.querySelector('[data-node="'+f.id+'"]');
  if(btn){btn.setAttribute("aria-pressed",String(on));btn.classList.toggle("is-cut",on&&state.cut);
    btn.setAttribute("aria-label","选择"+f.name+"，当前情景贡献"+row.score.toFixed(1)+"，需核实："+f.missing);
    const score=btn.querySelector("b");if(score)score.textContent=on&&state.cut?"归因排除":row.score.toFixed(1);
  }
  const edge=svg.querySelector('[data-edge="'+f.id+'"]');
  paintLink(edge,{selected:on,cut:state.cut,width:row.score/8});
 });
}
function format(v){return (Number.isFinite(v)?v:0).toFixed(1);}
function controls(){
 const p=active();
 const fields=[["iqSeverity",state.severity],["iqImportance",p.importance],["iqPerformance",p.performance],["iqSubstitute",p.substitute]];
 for(const [id,val] of fields){const input=$(id);if(input)input.value=String(val);
   const valText=$(id+"Value");if(valText)valText.textContent=String(val);}
 $("iqSever").setAttribute("aria-pressed",String(state.cut));
 $("iqSever").innerHTML=state.cut?'<span aria-hidden="true">↺</span> 恢复这条假设联系':'<span aria-hidden="true">⤫</span> 假设这条联系不存在';
 const label=$("iqFocusDescription");
 label.textContent="当前环节："+p.name+"。请调一个条件，再观察整张关系网络和下方三种对照如何改变。";
 document.querySelectorAll("[data-iq-target]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.iqTarget===state.target)));
 $("iqGoalPrompt").textContent=data.targets[state.target].question;
}
function drawRanking(result){
 const cont=$("iqRankingBars");cont.replaceChildren();
 const selected=active();
 const ranked=[...result.rows].map(r=>({...r,effective:r.isSelected&&state.cut?0:r.score})).sort((a,b)=>b.effective-a.effective);
 const max=Math.max(5,...ranked.map(r=>r.effective));
 for(let i=0;i<ranked.length;i++){
  const f=ranked[i],btn=document.createElement("button");btn.type="button";btn.className="iq-rank-button";
  btn.setAttribute("aria-pressed",String(f.id===selected.id));
  btn.setAttribute("aria-label","第"+(i+1)+"位"+f.name+"，情景暴露指数"+format(f.effective)+"，点击查看");
  const top=document.createElement("span"),name=document.createElement("span"),value=document.createElement("strong");
  name.textContent=String(i+1).padStart(2,"0")+" · "+f.name;value.textContent=format(f.effective);top.append(name,value);
  const track=document.createElement("div");track.className="iq-bar-track";
  const fill=document.createElement("i");fill.className="iq-bar-fill";fill.style.width=Math.max(0,f.effective/max*100).toFixed(1)+"%";
  track.append(fill);btn.append(top,track);
  btn.addEventListener("click",()=>selectFactor(f.id,true));cont.append(btn);
 }
 const rank=ranked.findIndex(f=>f.id===selected.id)+1;
 $("iqActiveRank").textContent=rank+" / "+ranked.length;
}
function drawHeat(result){
 const cont=$("iqHeatGrid");cont.replaceChildren();
 const sourceGrid=core.grid(active());
 const max=Math.max(8,...sourceGrid.flatMap(row=>row.map(c=>c.value)));
 for(const row of sourceGrid)for(const cell of row){
  const b=document.createElement("button");b.type="button";b.className="iq-heat-cell";
  const normalized=Math.min(1,cell.value/max);
  const hue=190-normalized*160;
  const saturation=40+normalized*45,lightness=19+normalized*21;
  b.style.setProperty("--cell",`hsl(${hue.toFixed(0)} ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`);
  b.textContent=format(cell.value);
  const bottom=document.createElement("span");bottom.textContent=cell.severity+"/"+cell.substitute;b.append(bottom);
  b.setAttribute("title","冲击"+cell.severity+"，替代"+cell.substitute+"：相对指数"+format(cell.value));
  b.setAttribute("aria-label","冲击"+cell.severity+"、替代"+cell.substitute+"：情景暴露指数"+format(cell.value)+"。点击将此条件带入实验");
  const pressed=(Math.abs(state.severity-cell.severity)<=7.5&&Math.abs(active().substitute-cell.substitute)<=10);
  b.setAttribute("aria-pressed",String(pressed));
  b.addEventListener("click",()=>{
   state.severity=cell.severity;active().substitute=cell.substitute;state.cut=false;noteAction();render(true);
  });
  cont.append(b);
 }
}
function compare(result){
 const target=$("iqComparisons");target.replaceChildren();
 const rows=[
  {name:"原连接 · 无替代",value:result.scenarioWithoutSubstitution},
  {name:"原连接 · 有替代",value:result.scenarioWithBuffer},
  {name:"删除这条解释",value:result.excluded}
 ];
 const mx=Math.max(5,...rows.map(r=>r.value));
 for(const r of rows){
  const box=document.createElement("div");box.className="iq-compare-row";
  const header=document.createElement("div"),label=document.createElement("span"),num=document.createElement("strong");
  label.textContent=r.name;num.textContent=format(r.value);header.append(label,num);
  const track=document.createElement("div");track.className="iq-compare-track";
  const fill=document.createElement("i");fill.style.width=(r.value/mx*100).toFixed(1)+"%";
  track.append(fill);box.append(header,track);target.append(box);
 }
}
function textReadout(result){
 const selected=active(),ranked=[...result.rows].map(r=>({...r,effective:r.isSelected&&state.cut?0:r.score})).sort((a,b)=>b.effective-a.effective);
 const position=ranked.findIndex(r=>r.id===selected.id)+1;
 const name=data.targets[state.target].title;
 $("iqHubValue").textContent=format(result.current);
 $("iqHubLabel").textContent=name;
 $("iqHubChange").textContent=state.cut?"排除这一解释：−"+format(result.contribution):"相对指数 / 非经济损失";
 $("iqNodeIndex").textContent=String(source().findIndex(f=>f.id===selected.id)+1).padStart(2,"0")+" / 05";
 $("iqLinkStatus").textContent=state.cut?"已从解释中排除":"假设连通";
 $("iqActiveName").textContent=selected.name;
 $("iqActiveScore").textContent=state.cut?"0.0（排除）":format(result.selected.score);
 $("iqActiveRank").textContent=position+" / "+ranked.length;
 $("iqStageHeadline").textContent=state.cut?"切断的是一种解释，不是现实中的风险。":position===1?"这一环，在当前设定下最值得优先核验。":"它未必最大，但调整条件可能改变整个排序。";
 $("iqStageExplain").textContent=state.cut
  ?"这条联系原本贡献"+format(result.contribution)+"个相对指数点。现在排除它，整图解释指数随之下降；不能把这种下降误读为真实经济改善。"
  :"当前“"+selected.name+"”贡献"+format(result.contribution)+"个全图相对指数点。改变替代能力或表现后，排序和解释分配会自动重算。";
 $("iqWhy").textContent=selected.why;
 $("iqMissing").textContent=selected.missing;
 $("iqExitSummary").textContent="当前关注“"+selected.name+"”："+selected.why+" 下一步最好补充："+selected.missing;
 const c=$("iqChangeCounter");
 c.textContent=state.touched?("你已改变 "+state.touched+" 次实验条件"):"当前为假设初始状态";
}
function nextURL(){
 const u=new URL(location.href);
 u.searchParams.set("focus",state.target);
 u.searchParams.set("factor",active().id);
 u.searchParams.set("sv",String(state.severity));
 u.searchParams.set("cut",state.cut?"1":"0");
 u.searchParams.set("ix",source().map(f=>[Math.round(f.importance),Math.round(f.performance),Math.round(f.substitute)].join("-")).join("."));
 return u;
}
function windURL(){
 const u=new URL("./wind.html",location.href),p=new URL(location.href).searchParams;
 for(const key of ["bs","bv","n","line","view","bp0","bp1","bp2","bp3","bp4","buffer"]){if(p.has(key))u.searchParams.set(key,p.get(key));}
 u.searchParams.set("shock",active().link||"delay");
 u.searchParams.set("strength",String(Math.round((.6+.8*state.severity/100)*5)/5));
 u.searchParams.set("active","1");
 u.hash="results";
 return u.href;
}
function render(sync=true){
 const factor=actualSelected(),result=measure();
 controls();drawNodes(result);drawRanking(result);drawHeat(result);compare(result);textReadout(result);
 $("iqToWind").href=windURL(); const challenge=new URL("./challenge.html",location.href);const current=nextURL();for(const k of ["focus","factor","sv","cut","shock","strength","buffer","active","bs","bv","bp0","bp1","bp2","bp3","bp4","n","line","view"]){if(current.searchParams.has(k))challenge.searchParams.set(k,current.searchParams.get(k));} $("iqToChallenge").href=challenge.href;
 if(sync){try{const u=nextURL();history.replaceState(null,"",u.pathname+u.search+u.hash);}catch{}}
 return result;
}
function selectFactor(id,action=false){
 if(!source().some(f=>f.id===id))return;
 state.selectedId=id;state.cut=false;
 if(action)noteAction();
 render();
}
function noteAction(){state.touched++;}
function changeGoal(target){
 if(!data.targets[target])return;
 state.target=target;state.selectedId=source()[0].id;
 state.cut=false;noteAction();render();
}
document.querySelectorAll("[data-iq-target]").forEach(b=>b.addEventListener("click",()=>changeGoal(b.dataset.iqTarget)));
for(const id of ["iqSeverity","iqImportance","iqPerformance","iqSubstitute"]){
 $(id).addEventListener("input",e=>{
  const n=+e.target.value;
  if(id==="iqSeverity")state.severity=clamp(n,10,100);
  if(id==="iqImportance")active().importance=clamp(n,5,100);
  if(id==="iqPerformance")active().performance=clamp(n,0,100);
  if(id==="iqSubstitute")active().substitute=clamp(n,0,100);
  noteAction();render();
 });
}
$("iqSever").addEventListener("click",()=>{state.cut=!state.cut;noteAction();render();});
$("iqCycle").addEventListener("click",()=>{
 const s=source(),i=s.findIndex(f=>f.id===active().id);
 selectFactor(s[(i+1)%s.length].id,true);
});
$("iqReset").addEventListener("click",()=>{
 state.sources[state.target]=core.create(data.targets[state.target]);
 state.severity=70;state.cut=false;state.selectedId=source()[0].id;noteAction();render();
});
let pulseTimer=0;
$("iqRun").addEventListener("click",()=>{
 render();
 const net=$("iqNetwork");net.classList.remove("is-running");void net.offsetWidth;net.classList.add("is-running");
 $("iqRun").textContent="正在重排关系…";
 clearTimeout(pulseTimer);
 pulseTimer=setTimeout(()=>{net.classList.remove("is-running");$("iqRun").innerHTML='<span aria-hidden="true">▶</span> 运行结构压力实验';},1300);
});
function toast(text){
 const el=$("iqToast");el.textContent=text;el.classList.add("on");
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("on"),2600);
}
async function copy(value){
 try{if(!navigator.clipboard?.writeText)throw Error("unavailable");await navigator.clipboard.writeText(value);toast("已复制");}
 catch{
  const inp=document.createElement("textarea");inp.value=value;inp.setAttribute("readonly","");inp.style.position="fixed";inp.style.opacity="0";document.body.append(inp);inp.focus();inp.select();let ok=false;
  try{ok=document.execCommand("copy");}catch{}inp.remove();toast(ok?"已复制":"自动复制不可用，请通过浏览器分享链接");
 }
}
$("iqCopy").addEventListener("click",()=>copy("博罗·结构核验："+active().name+"。"+active().why+" 优先补充："+active().missing+"。这是情景假设，不是已证实的关系。\n"+nextURL().href));
$("iqShareTop").addEventListener("click",()=>copy(nextURL().href));
if(seedParams.get("shock")){
 const names={delay:"项目延期",invest:"投资接续走弱",orders:"订单外流",traffic:"通勤压力"};
 const shock=seedParams.get("shock");
 if(names[shock]){
  $("iqArrival").hidden=false;
  $("iqArrival").textContent="已带入第七页的研究问题："+names[shock]+"。你在第七页设置的基准和条件会保留在返回链接中；本页的相对指数不会冒充实际GDP变化。";
 }
}
window.addEventListener("popstate",()=>{
 const p=new URL(location.href).searchParams;
 state.target=targetNames.includes(p.get("focus"))?p.get("focus"):"growth";
 state.selectedId=p.get("factor")||source()[0].id;
 state.severity=clamp(p.get("sv")??70,10,100);
 state.cut=p.get("cut")==="1";
 state.sources[state.target]=core.create(data.targets[state.target]);
 const ix=p.get("ix");
 if(ix){
  const parts=ix.split(".");
  if(parts.length===source().length)parts.forEach((part,i)=>{
   const v=part.split("-").map(Number);
   if(v.length===3&&v.every(Number.isFinite)){
    source()[i].importance=clamp(v[0],0,100);source()[i].performance=clamp(v[1],0,100);source()[i].substitute=clamp(v[2],0,100);
   }
  });
 }
 render(false);
});
function revealCurrentMobileNav(){
 const nav=document.querySelector?.(".mobile-nav");
 const current=nav?.querySelector?.('[aria-current="page"]');
 if(!nav||!current||!nav.clientWidth)return;
 const wanted=current.offsetLeft+current.offsetWidth-nav.clientWidth+12;
 if(wanted>0)nav.scrollLeft=Math.min(nav.scrollWidth-nav.clientWidth,Math.max(0,wanted));
}
window.addEventListener("resize",revealCurrentMobileNav);
setTimeout(revealCurrentMobileNav,0);
window.BoluoInsightsV2={getState:()=>({
 target:state.target,factor:active().id,severity:state.severity,cut:state.cut,touched:state.touched,parameters:source().map(f=>({id:f.id,importance:f.importance,performance:f.performance,substitute:f.substitute}))
}),compute:()=>measure(),windUrl:windURL,select:selectFactor};
render();
})();
