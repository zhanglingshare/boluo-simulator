/* BOLUO cognition journey · 01 真实信息 → 03 微观变化 → 04 县域基准
 * URL 持续传递“观察线索/选中事件”；线索不等于已确认的结构变化。
 * 独立模块：不改页面模型和图谱，不自动给情报制造因果解释。
 */
(function(){
"use strict";
var body=document.body;
if(!body)return;
var page=body.getAttribute("data-bl-journey");
if(!/^(today|town|changes|basic|comparison|planning)$/.test(page))return;
var root="index-legacy-2026-11-03.html";
var params=new URLSearchParams(location.search);
var queryTopic=(params.get("topic")||"").slice(0,140);
var queryChange=(params.get("change")||"").match(/^C\d{3}$/)?.[0]||null;
var from=(params.get("from")||"").slice(0,20);
var focusId=null;
function id(x){return document.getElementById(x);}
function el(tag,cls,text){
 var n=document.createElement(tag);if(cls)n.className=cls;
 if(text!=null)n.textContent=String(text);return n;
}
function pageUrl(code){
 return ({today:root,town:"town.html",changes:"industry-changes.html",basic:"who.html",comparison:"relation-compare.html",planning:"plan-with-me.html"})[code];
}
var nav=document.createElement("nav");nav.id="bl-journey-bar";nav.setAttribute("aria-label","博罗真实世界感知顺序");
var brand=el("a","blj-brand");brand.href=root;brand.append(el("strong",null,"博罗 · 真实世界观察"),el("small",null,"碎片感知 → 微观变化 → 宏观底盘 → 关系对比 → 规划与你"));
nav.append(brand);
var links=el("div","blj-links");
[
 ["01","today","今日博罗"],["02","town","各镇好玩好吃"],
 ["03","changes","产业变化"],["04","basic","博罗基本面"],["05","comparison","前后对比"],["06","planning","规划与你"]
].forEach(function(t){
 var a=el("a","blj-link");a.href=pageUrl(t[1]);a.append(el("em",null,t[0]),document.createTextNode(t[2]));
 if(page===t[1])a.setAttribute("aria-current","page");
 links.appendChild(a);
});
nav.append(links);
// 在窄屏中让当前认知步骤可见，避免第05步被横向导航遮住。
if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){
 var active=links.querySelector('[aria-current="page"]');
 if(active&&links.scrollWidth>links.clientWidth){
  var left=active.offsetLeft-links.offsetLeft-(links.clientWidth-active.offsetWidth)/2;
  links.scrollLeft=Math.max(0,left);
 }
});
var next=el("div","blj-next");
var nextCaption=el("span",null,"继续观察");next.append(nextCaption);
var nextAnchor=el("a",null,"");
nextAnchor.id="bl-journey-next";
next.append(nextAnchor);
nav.append(next);
body.insertBefore(nav,body.firstChild);
var context=el("section");context.id="bl-journey-context";
context.hidden=true;context.setAttribute("aria-live","polite");
var ctxTag=el("span","blj-tag"),ctxMessage=el("div","blj-message"),ctxLink=el("a");
context.append(ctxTag,ctxMessage,ctxLink);
nav.insertAdjacentElement("afterend",context);
function renderContext(tag,message,note,href,label){
 if(!tag){context.hidden=true;return;}
 context.hidden=false;ctxTag.textContent=tag;
 ctxMessage.replaceChildren(el("strong",null,message));
 if(note)ctxMessage.append(el("small","blj-small",note));
 ctxLink.href=href||"#";ctxLink.textContent=label||"返回";
}
function getChange(){
 var hash=(location.hash||"").match(/(?:^#|&)change=(C\d{3})(?:$|&)/);
 return hash?.[1]||focusId||queryChange||null;
}
function setNext(change){
 if(page==="today"){
  nextAnchor.href="industry-changes.html?from=today";nextAnchor.textContent="03 看产业变化 →";
 }else if(page==="town"){
  nextAnchor.href="industry-changes.html?from=town";nextAnchor.textContent="03 看产业变化 →";
 }else if(page==="changes"){
  var dest="who.html?from=changes";if(change)dest+="&change="+encodeURIComponent(change);
  nextAnchor.href=dest;nextAnchor.textContent="04 进入博罗基本面 →";
 }else if(page==="basic"){
  var dest="relation-compare.html?from=basic";if(change)dest+="&change="+encodeURIComponent(change);
  nextAnchor.href=dest;nextAnchor.textContent="05 看前后关系变化 →";
 }else if(page==="comparison"){
  var dest="plan-with-me.html?from=comparison";if(change)dest+="&change="+encodeURIComponent(change);
  nextAnchor.href=dest;nextAnchor.textContent="06 看规划与你 →";
  var direct=body.querySelector("[data-bl-plan-link]");if(direct)direct.href=dest;
 }else if(page==="planning"){
  nextAnchor.href="choices.html";nextAnchor.textContent="继续看原版五条路径 →";
 }
}
setNext(getChange());
if(page==="comparison"){document.addEventListener("bl:compare-selected",function(e){if(e.detail?.changeId){focusId=e.detail.changeId;setNext(getChange());}});}
if(page==="changes"){
 var handoffLabel=function(){
  var c=getChange();setNext(c);
  var title=(id("detailTitle")?.textContent||"").trim().slice(0,130);
  if(queryTopic){
   renderContext("现实线索","来自今日博罗："+queryTopic,
    (c?"当前已选择 "+c+(title?" · "+title:"")+"。":"请从下方选择一项结构变化。")+" 原始话题与本页变化不自动视为同一事件。",
    root,"返回今日博罗");
  }else if(from==="town"){
   renderContext("镇街线索","从各镇好玩好吃进入产业变化",
    "镇街生活信息是观察入口；此页只展示进入结构变化库的记录。",
    "town.html","返回镇街观察");
  }else if(c){
   renderContext("结构事件","当前聚焦 "+c+(title?" · "+title:""),
    "观察具体主体与关系后，可进入宏观基本面核对整个县域的条件。",
    "who.html?from=changes&change="+encodeURIComponent(c),"带着这条变化看基本面");
  }
 };
 document.addEventListener("bl:change-selected",function(e){
  var c=e.detail&&e.detail.changeId;
  if(c&&/^C\d{3}$/.test(c))focusId=c;
  handoffLabel();
 });
 window.addEventListener("popstate",handoffLabel);
 window.addEventListener("hashchange",handoffLabel);
 handoffLabel();
}
if(page==="town"){
 renderContext("感知入口","一个镇街的吃喝玩乐，也是认识区域产业和生活的线索",
  "此页仍是独立的真实世界观察入口，不需要经过游戏化身份选择。",
  root,"回到今日博罗");
}
function splitBeforeAfter(text){
 text=String(text||"");
 var parts=text.split(/此前[：:]/);
 if(parts.length<2)return {before:"",after:text};
 var next=parts.slice(1).join("此前：").split(/此后[：:]/);
 return {before:(next[0]||"").trim(),after:next.slice(1).join("此后：").trim()};
}
if(page==="basic"){
 var directNext=id("bl-compare-next");
 if(directNext)directNext.href="relation-compare.html?from=basic"+(queryChange?"&change="+encodeURIComponent(queryChange):"");
 var card=el("section");card.id="bl-journey-baseline";card.hidden=true;
 var wrap=body.querySelector(".wrap")||body;
 var place=wrap.querySelector(".kpis")||wrap.firstElementChild;
 if(place)wrap.insertBefore(card,place);else wrap.appendChild(card);
 var show=()=>{};
 if(queryChange){
  card.hidden=false;
  var eyebrow=el("div","blj-eyebrow","从03 · 产业变化，进入04 · 县域基本面");
  var title=el("h2",null,"正在核对 "+queryChange+" 的宏观背景");
  var lead=el("p",null,"先看宏观底盘：这页提供县域基准，而不是对单一事件经济影响的证明。");
  var fields=el("div","blj-fields");
  var warning=el("p","blj-warning","该事件与宏观指标之间的传导关系仍需要进一步模型检验，不能直接把预计产值计入当前GDP。");
  var actions=el("div","blj-links");
  var back=el("a",null,"← 返回选中的变化");
  back.href="industry-changes.html?from=basic#change="+encodeURIComponent(queryChange);
  var today=el("a",null,"再看今日情报");today.href=root;
  actions.append(back,today);card.append(eyebrow,title,lead,fields,warning,actions);
  function field(label,value){
   var x=el("div","blj-fact");x.append(el("b",null,label),el("span",null,value));fields.appendChild(x);
  }
  fetch("data/relationship-changes-v1.json",{cache:"no-store"})
  .then(function(resp){if(!resp.ok)throw Error("HTTP "+resp.status);return resp.json();})
  .then(function(payload){
   var c=(payload.changes||[]).find(function(v){return v.change_id===queryChange;});
   if(!c){title.textContent="当前变化编号未收录："+queryChange;lead.textContent="请返回变化现场选择已经收录的事件。";return;}
   title.textContent=c.title||queryChange;
   lead.textContent="你正在从一项微观变化，转向博罗的宏观基本盘。此页的GDP、产业、投资和人口数据不是该事件的结果。";
   var ba=splitBeforeAfter(c.before_after);
   if(ba.before)field("此前",ba.before);
   if(ba.after)field("当前记录",ba.after);
   if(c.uncertainty)warning.textContent="仍待核实："+c.uncertainty+"。本页宏观指标不能直接证明这件事的净影响。";
  }).catch(function(){
   title.textContent="带着 "+queryChange+" 查看宏观基本盘";
   lead.textContent="事件详情暂不可读取。县域基本面仍可浏览，返回变化现场可重新核验该事件。";
  });
 }else if(from==="changes"){
  card.hidden=false;card.append(
   el("div","blj-eyebrow","03 → 04 · 从微观变化到县域基本盘"),
   el("h2",null,"现在换个尺度，看整个博罗有什么、可能缺什么"),
   el("p",null,"这页展示县域整体基准，不等于任何单一项目或新闻已经改变了GDP。"));
 }
}
})();
