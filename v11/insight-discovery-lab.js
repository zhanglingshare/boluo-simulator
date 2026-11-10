/* V11 / 08 — variable discovery, competing explanations and evidence handoff. */
(function(){
"use strict";
const core=window.BoluoDiscoveryCore;
const $=function(id){return document.getElementById(id);};
if(!core||!$("iqSignals"))return;
const initialFactor=new URL(location.href).searchParams.get("factor")||"project";
const state={signal:(core.signals.find(function(x){return x.factor===initialFactor;})||core.signals[0]).id,signalTouched:false,variable:(core.variables.find(function(x){return x.factor===initialFactor;})||core.variables[0]).id,variableTouched:false,custom:[],edges:[],hypothesis:(core.hypotheses.find(function(x){return x.factor===initialFactor;})||core.hypotheses[0]).id,hypothesisTouched:false,dependence:75,shock:70,substitute:35,watch:[],proof:{},customCount:0};
const key="boluo-v11-evidence-watchlist";
try{const saved=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(saved))state.watch=saved.filter(x=>typeof x==="string");}catch(e){}
try{const proof=JSON.parse(localStorage.getItem(key+"-proof")||"{}");if(proof&&typeof proof==="object")state.proof=proof;}catch(e){}
try{const custom=JSON.parse(localStorage.getItem(key+"-custom")||"[]");if(Array.isArray(custom)){state.custom=custom.filter(function(v){return v&&typeof v.id==="string"&&typeof v.name==="string";}).slice(0,5).map(function(v){return {id:v.id,name:v.name.slice(0,32),group:"用户补充",factor:"network",why:"这是用户提出的新变量，尚未被公开证据或模型验证。",mechanism:"尚未定义。请先确认它与哪些现有变量存在可观察的联系，不预设因果方向。",question:"用什么指标、样本和时间范围观察这个变量？",evidence:"需要补充数据持有者、原始记录和可复核口径。",relations:[],custom:true};});state.customCount=state.custom.length;}}catch(e){}
try{const edges=JSON.parse(localStorage.getItem(key+"-edges")||"[]");if(Array.isArray(edges))state.edges=edges.filter(function(e){return e&&typeof e.from==="string"&&typeof e.to==="string"&&e.from!==e.to;}).slice(0,30);}catch(e){}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function toast(txt){const n=$("iqToast");if(!n)return;n.textContent=txt;n.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){n.classList.remove("on");},2600);}
function allVariables(){return core.variables.concat(state.custom);}
function currentVariable(){return allVariables().find(function(v){return v.id===state.variable;})||core.variables[0];}
function selectedSignal(){return core.signals.find(function(s){return s.id===state.signal;})||core.signals[0];}
function selectedHypothesis(){return core.hypotheses.find(function(h){return h.id===state.hypothesis;})||core.hypotheses[0];}
function factorUrl(factor,focus,missing,blind,evidenceName){
 const u=new URL("./challenge.html",location.href);
 const activeVariable=currentVariable(),variable=state.variableTouched?activeVariable:(activeVariable.factor===factor?activeVariable:allVariables().find(function(v){return v.factor===factor;})||activeVariable);
 const activeSignal=selectedSignal(),signal=state.signalTouched?activeSignal:(activeSignal.factor===factor?activeSignal:core.signals.find(function(s){return s.factor===factor;})||activeSignal);
 const activeHypothesis=selectedHypothesis(),hypothesis=state.hypothesisTouched?activeHypothesis:(activeHypothesis.factor===factor?activeHypothesis:core.hypotheses.find(function(x){return x.factor===factor;})||null);
 u.searchParams.set("focus",focus||"growth");u.searchParams.set("factor",factor||"network");
 u.searchParams.set("blind",blind||"");u.searchParams.set("missing",missing||"");
 u.searchParams.set("v08",variable.id);u.searchParams.set("vname",variable.name);
 u.searchParams.set("s08",signal.id);u.searchParams.set("sname",signal.title);
 if(hypothesis){u.searchParams.set("h08",hypothesis.id);u.searchParams.set("hname",hypothesis.title);}else{u.searchParams.delete("h08");u.searchParams.delete("hname");}
 u.searchParams.set("e08",blind||"");u.searchParams.set("ename",evidenceName||"");
 u.searchParams.set("equestion",missing||"");
 const links=state.edges.filter(function(e){return e.from===variable.id||e.to===variable.id;}).map(function(e){return e.from===variable.id?e.to:e.from;});
 if(links.length)u.searchParams.set("edge08",links.join(","));
 return u.href;
}
function renderSignals(){
 const wrap=$("iqSignalGrid");wrap.replaceChildren();
 core.signals.forEach(function(s){
  const b=el("button","iq-signal-card"+(s.id===state.signal?" active":""));
  b.type="button";b.dataset.signal=s.id;
  b.append(el("span","iq-signal-kicker",s.label));
  b.append(el("strong","iq-signal-title",s.title));
  const pair=el("span","iq-signal-pair");
  const left=el("span","iq-signal-metric"),right=el("span","iq-signal-metric");
  left.append(el("b","",s.valueA),el("small","",s.nameA));
  right.append(el("b","",s.valueB),el("small","",s.nameB));
  pair.append(left,el("i","", "↔"),right);
  b.append(pair,el("small","iq-signal-period",s.period));
  b.setAttribute("aria-pressed",String(s.id===state.signal));
  b.addEventListener("click",function(){state.signal=s.id;state.signalTouched=true;renderSignals();renderSignalDetail();});
  wrap.append(b);
 });
}
function renderSignalDetail(){
 const s=selectedSignal();
 $("iqSignalDetailTitle").textContent=s.title;
 $("iqSignalDetailText").textContent=s.detail;
 $("iqSignalQuestion").textContent=s.question;
 $("iqSignalEvidence").textContent=s.evidence;
 const src=$("iqSignalSource");src.hidden=!s.source;if(s.source)src.href=s.source;
 $("iqSignalSource").textContent=s.source?"查看原有公开统计来源 ↗":"这是待核验问题，不对应一项已确认统计";
 $("iqSignalType").textContent=s.kind==="observed"?"公开统计信号":"研究问题 · 尚待证据";
}
function variableRelations(v){
 const ids=(v.relations||[]).concat(state.edges.filter(function(e){return e.from===v.id||e.to===v.id;}).map(function(e){return e.from===v.id?e.to:e.from;}));
 return Array.from(new Set(ids)).slice(0,6).map(function(id){return allVariables().find(function(x){return x.id===id;});}).filter(Boolean);
}
function renderVariables(){
 const list=$("iqVariableList");list.replaceChildren();
 allVariables().forEach(function(v){
  const b=el("button","iq-variable-choice"+(v.id===state.variable?" active":""));
  b.type="button";b.dataset.variable=v.id;b.setAttribute("aria-pressed",String(v.id===state.variable));
  b.append(el("small","",v.group||"用户补充"),el("strong","",v.name));
  if(v.custom)b.append(el("em","","自定义 · 待验证"));
  b.addEventListener("click",function(){state.variable=v.id;state.variableTouched=true;renderVariables();renderVariableDetail();});
  list.append(b);
 });
 const relationSelect=$("iqRelationTarget");relationSelect.replaceChildren();
 allVariables().filter(function(x){return x.id!==state.variable;}).forEach(function(x){const option=document.createElement("option");option.value=x.id;option.textContent=x.name;relationSelect.append(option);});
 const v=currentVariable(),neighbors=variableRelations(v),center=$("iqVariableNodes"),svg=$("iqVariableLines");
 center.replaceChildren();svg.replaceChildren();
 const ns="http://www.w3.org/2000/svg";
 const centerPos=[500,280],positions=[[500,55],[835,155],[835,405],[500,505],[165,405],[165,155]];
 neighbors.forEach(function(n,i){
  const line=document.createElementNS(ns,"line");line.setAttribute("x1",centerPos[0]);line.setAttribute("y1",centerPos[1]);line.setAttribute("x2",positions[i][0]);line.setAttribute("y2",positions[i][1]);line.setAttribute("class","iq-variable-edge");svg.append(line);
 });
 const centerNode=el("div","iq-variable-hub");centerNode.append(el("small","","当前变量"),el("strong","",v.name),el("span","",v.group||"用户补充"));center.append(centerNode);
 neighbors.forEach(function(n,i){
  const b=el("button","iq-variable-node");b.type="button";b.textContent=n.name;b.style.left=(positions[i][0]/10)+"%";b.style.top=(positions[i][1]/5.6)+"%";b.title="点击切换到"+n.name;b.addEventListener("click",function(){state.variable=n.id;renderVariables();renderVariableDetail();});center.append(b);
 });
 if(!neighbors.length){const note=el("p","iq-variable-empty","这是新加入的变量。系统不会擅自替它建立因果关系，请先补充可核验的连接证据。");center.append(note);}
 $("iqVariableCount").textContent=String(allVariables().length)+" 个候选变量 · 关系均为待检验假设";
 renderVariableDetail();
}
function renderVariableDetail(){
 const v=currentVariable();
 $("iqVariableWhy").textContent=v.why||"由用户提出，尚无可核验解释。";
 $("iqVariableMechanism").textContent=v.mechanism||"尚未建立关系假设。需要补充定义、方向和证据后再纳入实验。";
 $("iqVariableQuestion").textContent=v.question||"这项变量如何被观测？";
 $("iqVariableEvidence").textContent=v.evidence||"请补充可核验的数据来源。";
 const hasRelations=variableRelations(v).length>0;
 $("iqVariableStatus").textContent=v.custom?(hasRelations?"用户自定义 · 候选联系待核验":"用户自定义 · 尚未建立关系"):"候选变量 · 待验证关系";
}
function addCustomVariable(){
 const input=$("iqCustomVariable"),name=(input.value||"").trim().slice(0,32);
 if(!name){toast("先输入一个变量名称");return;}
 if(allVariables().some(function(v){return v.name.toLowerCase()===name.toLowerCase();})){toast("这个变量已经在列表中");return;}
 if(state.custom.length>=5){toast("自定义变量最多添加5个，避免关系图失焦");return;}
 state.customCount++;
 const id="custom-"+state.customCount;
 state.custom.push({id:id,name:name,group:"用户补充",factor:"network",why:"这是用户提出的新变量。它可能重要，但目前尚未被公开证据或模型验证。",mechanism:"尚未定义。请先确认它与哪些现有变量存在可观察的联系，不预设因果方向。",question:"用什么指标、样本和时间范围观察这个变量？",evidence:"需要用户补充数据持有者、原始记录和可复核口径。",relations:[],custom:true});
 try{localStorage.setItem(key+"-custom",JSON.stringify(state.custom.map(function(v){return {id:v.id,name:v.name};})));}catch(e){}
 state.variable=id;state.variableTouched=true;input.value="";renderVariables();toast("已加入候选变量，尚未自动建立因果关系");
}
function renderHypotheses(){
 const wrap=$("iqHypothesisChoices");wrap.replaceChildren();
 core.hypotheses.forEach(function(h){
  const b=el("button","iq-hypothesis"+(h.id===state.hypothesis?" active":""));b.type="button";b.dataset.hypothesis=h.id;b.setAttribute("aria-pressed",String(h.id===state.hypothesis));
  b.append(el("small","","解释 "+String(core.hypotheses.indexOf(h)+1).padStart(2,"0")),el("strong","",h.title),el("span","",h.summary));
  b.addEventListener("click",function(){state.hypothesis=h.id;state.hypothesisTouched=true;renderHypotheses();renderHypothesisDetail();});
  wrap.append(b);
 });
}
function renderHypothesisDetail(){
 const h=selectedHypothesis();
 $("iqHypothesisTitle").textContent=h.title+"：如何验证？";
 $("iqHypothesisSummary").textContent=h.summary;
 const p=$("iqPredictions");p.replaceChildren();h.predictions.forEach(function(t){p.append(el("li","",t));});
 const e=$("iqDiscriminatingEvidence");e.replaceChildren();h.evidence.forEach(function(t,i){
  const row=el("div","iq-discriminator");
  row.append(el("span","",String(i+1).padStart(2,"0")),el("strong","",t));
  const group=el("div","iq-proof-state");
  ["unknown","supports","weakens"].forEach(function(status){
   const labels={unknown:"未核验",supports:"初步支持",weakens:"出现反证"};
   const b=el("button",state.proof[h.id+"-"+i]===status?"active":"",labels[status]);b.type="button";b.setAttribute("aria-pressed",String(state.proof[h.id+"-"+i]===status));
   b.addEventListener("click",function(){state.proof[h.id+"-"+i]=status;try{localStorage.setItem(key+"-proof",JSON.stringify(state.proof));}catch(e){}renderHypothesisDetail();});
   group.append(b);
  });
  row.append(group);e.append(row);
 });
 const count=h.evidence.filter(function(t,i){return state.proof[h.id+"-"+i]&&state.proof[h.id+"-"+i]!=="unknown";}).length;
 $("iqHypothesisStatus").textContent=count?("你已标记 "+count+" 项证据状态 · 用户自评，非平台核验"):"尚未标记证据状态 · 不能据此判断哪种解释胜出";
}
function renderBreakpoint(){
 const dep=state.dependence,shock=state.shock,sub=state.substitute;
 $("iqBreakDependenceValue").textContent=dep;$("iqBreakShockValue").textContent=shock;$("iqBreakSubstituteValue").textContent=sub;
 $("iqBreakScore").textContent=core.exposure(dep,shock,sub).toFixed(1);
 const shocks=[20,40,60,80,100],subs=[0,25,50,75,100],grid=core.heatmap(dep,shocks,subs),max=100;
 const wrap=$("iqBreakGrid");wrap.replaceChildren();
 const header=el("div","iq-break-head");header.append(el("span","","冲击 ↓ / 替代能力 →"));subs.forEach(function(x){header.append(el("b","",String(x)));});wrap.append(header);
 grid.forEach(function(row){
  const line=el("div","iq-break-row");line.append(el("span","",String(row[0].shock)));
  row.forEach(function(c){
   const b=el("button","iq-break-cell");b.type="button";b.textContent=c.value.toFixed(0);b.style.background="hsl("+(190-c.value*1.45)+" 64% "+(95-c.value*.35)+"%)";b.setAttribute("aria-label","冲击"+c.shock+"，替代能力"+c.substitute+"，相对暴露指数"+c.value);
   b.setAttribute("aria-pressed",String(c.shock===shock&&c.substitute===sub));
   b.addEventListener("click",function(){state.shock=c.shock;state.substitute=c.substitute;$("iqBreakShock").value=state.shock;$("iqBreakSubstitute").value=state.substitute;renderBreakpoint();});
   line.append(b);
  });wrap.append(line);
 });
 $("iqBreakInterpretation").textContent="在当前教学假设下，依赖程度 "+dep+"、冲击强度 "+shock+"、替代能力 "+sub+" 对应相对暴露指数 "+core.exposure(dep,shock,sub).toFixed(1)+"。改变任一条件，矩阵同步重算。";
}
function renderEvidence(){
 const wrap=$("iqEvidenceCards");wrap.replaceChildren();
 core.evidence.forEach(function(item){
  const card=el("article","iq-evidence-card"+(state.watch.includes(item.id)?" selected":""));
  const top=el("div","iq-evidence-card-top");top.append(el("span","",item.variable),el("small","",state.watch.includes(item.id)?"已加入关注":"待补证据"));card.append(top);
  card.append(el("h4","",item.name),el("p","",item.question));
  const meta=el("dl","iq-evidence-meta");meta.append(el("dt","","可能持有者"),el("dd","",item.holder),el("dt","","为什么重要"),el("dd","",item.impact));card.append(meta);
  const actions=el("div","iq-evidence-actions");
  const save=el("button","iq-evidence-save",state.watch.includes(item.id)?"移出关注清单":"加入关注清单");save.type="button";save.setAttribute("aria-pressed",String(state.watch.includes(item.id)));
  save.addEventListener("click",function(){if(state.watch.includes(item.id))state.watch=state.watch.filter(function(x){return x!==item.id;});else state.watch.push(item.id);persistWatch();renderEvidence();});
  const challenge=el("a","iq-evidence-challenge","带入09判断挑战 ↗");challenge.href=factorUrl(item.factor,item.focus,item.question,item.id,item.name);
  challenge.addEventListener("click",function(event){event.preventDefault();location.href=factorUrl(item.factor,item.focus,item.question,item.id,item.name);});
  actions.append(save,challenge);card.append(actions);wrap.append(card);
 });
 $("iqWatchCount").textContent=String(state.watch.length)+" 项已加入本机关注清单";
}
function persistWatch(){try{localStorage.setItem(key,JSON.stringify(state.watch));toast("关注清单已保存在本机");}catch(e){toast("浏览器未允许本机保存");}}
function exportWatch(){
 const records=core.evidence.filter(function(e){return state.watch.includes(e.id);});
 if(!records.length){toast("先把至少一项证据加入关注清单");return;}
 const text=records.map(function(e){return e.name+"\n待核验："+e.question+"\n可能持有者："+e.holder+"\n影响："+e.impact;}).join("\n\n");
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast("关注清单已复制");}).catch(function(){fallbackCopy(text);});}else fallbackCopy(text);
}
function fallbackCopy(text){const t=el("textarea","");t.value=text;document.body.append(t);t.select();let ok=false;try{ok=document.execCommand("copy");}catch(e){}t.remove();toast(ok?"关注清单已复制":"复制不可用，请逐项查看");}
function bind(){
 $("iqCustomAdd").addEventListener("click",addCustomVariable);
 $("iqCustomVariable").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();addCustomVariable();}});
 $("iqRelationAdd").addEventListener("click",function(){
  const from=state.variable,to=$("iqRelationTarget").value;
  if(!to||from===to){toast("请选择两个不同的变量");return;}
  const exists=state.edges.some(function(e){return (e.from===from&&e.to===to)||(e.from===to&&e.to===from);});
  if(exists){toast("这条候选联系已经存在");return;}
  state.edges.push({from:from,to:to});
  try{localStorage.setItem(key+"-edges",JSON.stringify(state.edges));}catch(e){}
  renderVariables();toast("候选联系已加入网络，仍待证据核验");
 });
 [["iqBreakDependence","dependence"],["iqBreakShock","shock"],["iqBreakSubstitute","substitute"]].forEach(function(pair){
  $(pair[0]).addEventListener("input",function(e){state[pair[1]]=core.clamp(e.target.value,0,100);renderBreakpoint();});
 });
 $("iqBreakReset").addEventListener("click",function(){state.dependence=75;state.shock=70;state.substitute=35;$("iqBreakDependence").value=75;$("iqBreakShock").value=70;$("iqBreakSubstitute").value=35;renderBreakpoint();});
 $("iqExportWatch").addEventListener("click",exportWatch);
 $("iqSaveAllWatch").addEventListener("click",persistWatch);
 const cta=$("iqToChallenge");
 if(cta)cta.addEventListener("click",function(){
  const v=currentVariable(),evidenceItem=core.evidence.find(function(e){return e.variable===v.name;})||core.evidence.find(function(e){return e.factor===v.factor;});
  if(evidenceItem)cta.href=factorUrl(v.factor,evidenceItem.focus,v.question,evidenceItem.id,evidenceItem.name);
 });
}
function init(){
 renderSignals();renderSignalDetail();renderVariables();renderHypotheses();renderHypothesisDetail();renderBreakpoint();renderEvidence();bind();
 const p=new URL(location.href).searchParams;
 if(p.get("blind")){const item=core.evidence.find(function(e){return e.id===p.get("blind");});if(item){state.signal="industrial-gap";renderSignals();renderSignalDetail();$("iqArrival").hidden=false;$("iqArrival").textContent="已从第九页带回一项待核验问题："+item.question;}}
}
window.BoluoDiscoveryLab=Object.freeze({getState:function(){return {signal:state.signal,variable:state.variable,hypothesis:state.hypothesis,watch:state.watch.slice(),dependence:state.dependence,shock:state.shock,substitute:state.substitute};},exposure:core.exposure,selectVariable:function(id){if(allVariables().some(function(v){return v.id===id;})){state.variable=id;renderVariables();return true;}return false;}});
init();
})();