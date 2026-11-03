/* 博罗 · native six-page UX enhancement
   Real local search of six observed pages and the recorded change-event corpus.
   Does NOT mutate any evidence graph, infer causal links or generate data.
*/
(function(){
"use strict";
const body=document.body;
if(!body||!body.classList.contains("mh-six"))return;
const journey=body.getAttribute("data-bl-journey");
if(!["today","town","changes","basic","comparison","planning"].includes(journey))return;
const nav=document.getElementById("bl-journey-bar");
if(!nav)return;
const el=(tag,klass,value)=>{
 const n=document.createElement(tag);
 if(klass)n.className=klass;
 if(value!=null)n.textContent=String(value);
 return n;
};
const pages=[
 {id:"today",number:"01",title:"今日博罗",hint:"公开情报与现实信号",url:"index-legacy-2026-11-03.html"},
 {id:"town",number:"02",title:"各镇好玩好吃",hint:"镇街生活与地区观察",url:"town.html"},
 {id:"changes",number:"03",title:"产业变化",hint:"证据关系和事件时间线",url:"industry-changes.html"},
 {id:"basic",number:"04",title:"博罗基本面",hint:"结构数据、经济指标和约束",url:"who.html"},
 {id:"comparison",number:"05",title:"关系前后对比",hint:"同一组主体的两种已记录状态",url:"relation-compare.html"},
 {id:"planning",number:"06",title:"规划与你",hint:"十五五目标与个人生活的条件",url:"plan-with-me.html"}
];
const btn=el("button","sn-search-open");
btn.type="button";btn.setAttribute("aria-label","搜索页面和已收录的变化事件，快捷键 Command K 或 Control K");
btn.setAttribute("aria-haspopup","dialog");btn.setAttribute("aria-expanded","false");
btn.append(el("span","sn-search-icon","⌕"),el("span","sn-search-label","搜索页面与变化"),el("span","sn-search-kbd","⌘K"));
const next=nav.querySelector(".blj-next");
nav.insertBefore(btn,next||null);
const backdrop=el("div","sn-command-backdrop");backdrop.hidden=true;
const dialog=el("div","sn-command");dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
dialog.setAttribute("aria-label","搜索真实页面与结构事件");
const header=el("div","sn-command-header");
header.append(el("span","sn-search-icon","⌕"));
const input=el("input");input.type="search";input.placeholder="搜索页面、事件标题或 C004";input.autocomplete="off";
input.setAttribute("aria-label","搜索页面或结构事件");
const close=el("button","sn-command-close","Esc");close.type="button";close.setAttribute("aria-label","关闭搜索");
header.append(input,close);
const list=el("div","sn-command-group");
list.setAttribute("role","listbox");
const foot=el("div","sn-command-foot","仅搜索已接入的六页和结构事件库；情报快照不等于实时全县数据。↑↓ 选择 · Enter 打开 · Esc 关闭");
dialog.append(header,list,foot);backdrop.append(dialog);body.append(backdrop);
let active=-1,results=[],eventPromise=null,originFocus=null,request=0;
const isOpen=()=>!backdrop.hidden;
const normalized=t=>String(t||"").toLocaleLowerCase("zh-CN").trim();
function getEvents(){
 if(!eventPromise){
  eventPromise=fetch("data/relationship-changes-v1.json",{cache:"no-store"})
   .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
   .then(data=>{
    if(!Array.isArray(data.changes))throw Error("事件格式不完整");
    return data.changes.filter(e=>/^C\d{3}$/.test(e.change_id||"")).map(e=>({
      id:e.change_id,number:e.change_id,title:e.title||e.change_id,
      hint:(e.event_date||"已收录")+" · 研究性结构事件",type:"event",
      url:"industry-changes.html?change="+encodeURIComponent(e.change_id)
    }));
   }).catch(err=>{
    eventPromise=null;throw err;
   });
 }
 return eventPromise;
}
function makeRow(result,index){
 const a=el("a","sn-command-item");a.href=result.url;
 a.dataset.snIndex=String(index);a.setAttribute("role","option");a.setAttribute("aria-selected",String(index===active));
 a.append(el("span","sn-item-icon",result.number));
 const copy=el("span","sn-item-copy");
 copy.append(el("strong",null,result.title),el("small",null,result.hint));
 a.append(copy,el("span","sn-item-arrow","↗"));
 a.addEventListener("pointermove",()=>setActive(index,false));
 return a;
}
function setActive(index,scroll){
 const items=[...list.querySelectorAll(".sn-command-item")];
 if(index<0||index>=items.length)return;
 active=index;
 items.forEach((x,i)=>x.setAttribute("aria-selected",String(i===index)));
 if(scroll)items[index].scrollIntoView({block:"nearest",behavior:"auto"});
}
function render(events,error){
 const query=normalized(input.value);
 results=[
  ...pages.map(p=>({...p,type:"page"})),
  ...(events||[])
 ].filter(p=>!query||normalized(p.title+" "+p.hint+" "+p.id+" "+p.number).includes(query));
 const shown=results.slice(0,24);
 list.replaceChildren();active=shown.length?0:-1;
 let prevType="";
 shown.forEach((x,index)=>{
  if(x.type!==prevType){
   list.append(el("div","sn-command-caption",x.type==="page"?"六页导航":"实际收录事件 · 点击进入03查看证据"));
   prevType=x.type;
  }
  list.append(makeRow(x,index));
 });
 if(error)list.append(el("div","sn-command-empty","变化事件暂时无法读取："+error+"。仍可以搜索六页导航。"));
 else if(!shown.length)list.append(el("div","sn-command-empty","没有找到匹配的已收录页面或事件。试试镇街、产业、C004 等关键词。"));
}
async function refresh(){
 const token=++request;
 render([],null);
 try{
  const events=await getEvents();
  if(token===request&&isOpen())render(events,null);
 }catch(err){
  if(token===request&&isOpen())render([],err.message);
 }
}
function open(){
 if(isOpen())return;
 originFocus=document.activeElement;
 backdrop.hidden=false;btn.setAttribute("aria-expanded","true");
 input.value="";refresh();
 requestAnimationFrame(()=>input.focus());
}
function hide(){
 if(!isOpen())return;
 backdrop.hidden=true;btn.setAttribute("aria-expanded","false");request++;
 if(originFocus&&typeof originFocus.focus==="function")originFocus.focus();
}
btn.addEventListener("click",open);close.addEventListener("click",hide);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)hide();});
input.addEventListener("input",()=>refresh());
dialog.addEventListener("keydown",e=>{
 if(e.key==="ArrowDown"||e.key==="ArrowUp"){
  e.preventDefault();const rows=[...list.querySelectorAll(".sn-command-item")];
  if(!rows.length)return;
  setActive((active+(e.key==="ArrowDown"?1:rows.length-1))%rows.length,true);
 }else if(e.key==="Enter"){
  const rows=[...list.querySelectorAll(".sn-command-item")];
  if(rows.length&&active>=0){
   e.preventDefault();const href=rows[active].getAttribute("href");
   if(href)location.assign(href);
  }
 }else if(e.key==="Tab"){
  // Modal focus remains inside the search control / close button / result list.
  const focusables=[input,close,...list.querySelectorAll("a")];
  const index=focusables.indexOf(document.activeElement);
  if(e.shiftKey&&index===0){e.preventDefault();focusables[focusables.length-1].focus();}
  else if(!e.shiftKey&&index===focusables.length-1){e.preventDefault();focusables[0].focus();}
 }
});
document.addEventListener("keydown",e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){
  e.preventDefault();isOpen()?hide():open();
 }else if(e.key==="Escape"&&isOpen()){
  e.preventDefault();hide();
 }
});
/* Existing 03 graph is the functional inspector. Focus mode only changes
   workspace layout; original node interactions and A/B/C evidence remain intact. */
if(journey==="changes"){
 const graph=document.querySelector(".ec-graph-panel");
 if(graph){
  const actions=el("div","sn-stage-tools");
  const focus=el("button","sn-stage-tool","专注关系网络");
  focus.type="button";focus.setAttribute("aria-pressed","false");
  focus.setAttribute("aria-label","展开关系网络并暂时收起事件和证据侧栏");
  focus.addEventListener("click",()=>{
   const on=body.classList.toggle("sn-graph-focus");
   focus.setAttribute("aria-pressed",String(on));
   focus.textContent=on?"退出专注 · 恢复证据栏":"专注关系网络";
   focus.setAttribute("aria-label",on?"恢复事件和证据侧栏":"展开关系网络并暂时收起事件和证据侧栏");
  });
  actions.append(focus);
  const graphActions=graph.querySelector(".ec-graph-actions");
  if(graphActions)graphActions.insertAdjacentElement("beforebegin",actions);
  else graph.append(actions);
 }
}
/* Use role labels from existing plan-life dataset, not new fictional personas.
   Plan-life code re-creates the buttons on selection. */
if(journey==="planning"){
 const host=document.getElementById("pl-roles");
 if(host){
  const glyphs={commuter:"通",worker:"工",parent:"家",shop:"店",farmer:"农",graduate:"职"};
  function decorate(){
   for(const item of host.querySelectorAll(".pl-role")){
    if(item.querySelector(".sn-role-glyph"))continue;
    const glyph=el("span","sn-role-glyph",glyphs[item.dataset.role]||"人");
    glyph.setAttribute("aria-hidden","true");item.prepend(glyph);
   }
  }
  const observer=new MutationObserver(decorate);
  observer.observe(host,{childList:true});
  decorate();
 }
}
})();
