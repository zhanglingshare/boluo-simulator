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
body.classList.add('sn-app');
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
const iconPaths={
 today:'M4 5h16v15H4z M8 2v5 M16 2v5 M4 10h16 M8 14h3 M8 17h6',
 town:'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z M9 9a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
 changes:'M8.8 6.7l6.4 1.6 M6.7 8.8l1.6 7.4 M16 11.4l-5 5.2 M9 6a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M21 9a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M12 19a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
 basic:'M4 20h17 M6 16V9h3v7 M12 16V4h3v12 M18 16v-5h3v5',
 comparison:'M3 5h7v14H3z M14 5h7v14h-7z M6 9h1 M17 9h1 M6 13h1 M17 13h1',
 planning:'M12 4v7l5 3 M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0',
 search:'M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13 M16 16l5 5',
 layers:'M3 8l9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5',
 arrow:'M5 12h14 M14 7l5 5-5 5',
 commuter:'M6 17v3 M18 17v3 M4 16V9l2-5h12l2 5v7z M4 10h16 M7 14h1 M16 14h1',
 worker:'M4 8h16v13H4z M8 8V4h8v4 M4 13h16 M10 13v3h4v-3',
 parent:'M12 13a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M5 21v-2a7 7 0 0 1 14 0v2 M3 10a3 3 0 0 0 3 3 M21 10a3 3 0 0 1-3 3',
 shop:'M4 10v11h16V10 M3 10l2-6h14l2 6 M3 10a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0 M9 21v-6h6v6',
 farmer:'M12 22V10 M12 14C2 14 3 4 3 4s10-1 9 10 M12 11c0-9 9-9 9-9s2 10-9 9',
 graduate:'M2 8l10-5 10 5-10 5z M6 10v6c3 3 9 3 12 0v-6 M22 8v9'
};
function icon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','sn-icon');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',iconPaths[name]||iconPaths.layers);svg.append(path);return svg;
}
/* The existing navigation keeps its links and event context; only its layout changes. */
const currentPage=pages.find(p=>p.id===journey);
const shortNames={today:'今日',town:'各镇',changes:'产业',basic:'基本面',comparison:'对比',planning:'与你'};
const navNames={today:'今日博罗',town:'各镇探索',changes:'产业变化',basic:'博罗基本面',comparison:'前后对比',planning:'规划与你'};
const brand=nav.querySelector('.blj-brand');
if(brand){
 const mark=el('span','sn-app-symbol');mark.setAttribute('aria-hidden','true');
 for(let i=0;i<4;i++)mark.append(el('i'));
 brand.prepend(mark);
 brand.querySelector('strong').textContent='博罗观察';
 brand.querySelector('small').textContent='先看见不一样的博罗';
}
const navLinks=pages.map(p=>nav.querySelector('.blj-link[href="'+p.url+'"]')).filter(Boolean);
const compactNav=window.matchMedia('(max-width:800px)');
function labelNav(){
 navLinks.forEach((link,i)=>{
  const p=pages[i];if(!p)return;
  link.setAttribute('aria-label',p.number+' '+p.title);
  link.replaceChildren(icon(p.id),el('span','sn-nav-name',compactNav.matches?shortNames[p.id]:navNames[p.id]));
 });
}
labelNav();compactNav.addEventListener?.('change',labelNav);
const navSection=el('div','sn-nav-section','六次发现');navSection.setAttribute('aria-hidden','true');nav.append(navSection);
const locationLabel=el('div','sn-location');locationLabel.append(el('small',null,'发现'),el('span',null,'/'),icon(journey),el('b',null,navNames[journey]));
nav.append(locationLabel);
const sidebarFoot=el('div','sn-sidebar-foot');
const original=el('a');original.href='windtunnel.html';original.append(icon('layers'),el('span',null,'进入决策风洞'),icon('arrow'));
const sourceStatus=el('div','sn-sidebar-status');sourceStatus.append(el('b',null,'数据快照'),el('span','sn-data-date','正在读取日期…'));
const statusLine=el('div');statusLine.append(el('i'),document.createTextNode('公开资料 · 证据分级'));sourceStatus.append(statusLine);
sidebarFoot.append(original,sourceStatus);body.append(sidebarFoot);
const main=body.querySelector('main,.wrap');
if(main){
 if(!main.id)main.id='sn-main-content';
 if(main.tagName!=='MAIN')main.setAttribute('role','main');
 const skip=el('a','sn-skip','跳到主要内容');skip.href='#'+main.id;body.prepend(skip);
 main.setAttribute('tabindex','-1');
}
const contextControl=el('details','sn-context-control');
const contextSummary=el('summary');contextSummary.append(icon('layers'),el('span',null,'观察线索'));contextControl.append(contextSummary);
contextSummary.setAttribute('aria-label','展开当前观察线索与跨页上下文');
const contextSheet=el('div','sn-context-sheet');
for(const panel of body.querySelectorAll('.v3-story-ribbon,#bl-journey-context'))contextSheet.append(panel);
contextControl.append(contextSheet);nav.append(contextControl);
const blindspotTrigger=body.querySelector('.ibi-trigger');
if(blindspotTrigger)nav.insertBefore(blindspotTrigger,contextControl);
document.addEventListener('click',e=>{if(!contextControl.contains(e.target))contextControl.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')contextControl.open=false;});
fetch('data/relationship-changes-v1.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{
 const raw=String(d.generated_at||'');const date=raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
 sourceStatus.querySelector('.sn-data-date').textContent=date?'结构库 · '+date:'结构库 · 日期未注明';
}).catch(()=>{sourceStatus.querySelector('.sn-data-date').textContent='结构库暂不可读取';});
const btn=el("button","sn-search-open");
btn.type="button";btn.setAttribute("aria-label","搜索页面和已收录的变化事件，快捷键 Command K 或 Control K");
btn.setAttribute("aria-haspopup","dialog");btn.setAttribute("aria-expanded","false");
btn.append(icon('search'),el("span","sn-search-label","搜索页面与变化"),el("span","sn-search-kbd","⌘K"));
const next=nav.querySelector(".blj-next");
nav.insertBefore(btn,next||null);
nav.insertBefore(locationLabel,btn);
function syncNextNavigation(){
 const destination=next?.querySelector('a')?.getAttribute('href');if(!destination)return;
 const file=destination.split(/[?#]/)[0];
 for(const link of navLinks){
  if((link.getAttribute('href')||'').split(/[?#]/)[0]===file)link.setAttribute('href',destination);
 }
}
document.addEventListener('bl:change-selected',syncNextNavigation);
document.addEventListener('bl:compare-selected',syncNextNavigation);
syncNextNavigation();
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
    const glyph=el("span","sn-role-glyph");glyph.append(icon(item.dataset.role));
    glyph.setAttribute("aria-hidden","true");item.prepend(glyph);
   }
  }
  const observer=new MutationObserver(decorate);
  observer.observe(host,{childList:true});
  decorate();
 }
}
/* Progressive disclosures keep source material available without overwhelming the stage. */
function fold(target,selector,title,klass='sn-fold'){
 if(!target)return null;
 const selected=[...document.querySelectorAll(selector)];if(!selected.length)return null;
 const details=el('details',klass);details.append(el('summary',null,title));
 for(const item of selected)details.append(item);
 target.append(details);return details;
}
if(journey==='today'){
 const hero=body.querySelector('.bl-hero-copy');
 if(hero){
  const scan=el('div','sn-today-scan');scan.setAttribute('aria-label','已收录话题的类别分布');
  const count=el('div','sn-scan-count');const number=el('strong',null,'—');count.append(number,el('small',null,'条公开线索'));
  const chart=el('div','sn-category-chart');scan.append(count,chart);hero.append(scan);
  const cats=[['industry','产业'],['livelihood','民生'],['city','城市'],['tourism','文旅'],['food','美食']];
  function readSnapshot(){
   fetch('hot.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    if(!Array.isArray(data.items))throw Error();
    const items=data.items;number.textContent=String(items.length);chart.replaceChildren();
    const counts=cats.map(([key])=>items.filter(x=>x.cat===key).length),max=Math.max(1,...counts);
    cats.forEach(([key,label],i)=>{
     const column=el('div','sn-category-column');const bar=el('i');bar.style.height=(counts[i]/max*42)+'px';
     column.setAttribute('aria-label',label+' '+counts[i]+' 条');bar.setAttribute('aria-hidden','true');
     column.append(el('span',null,counts[i]),bar,el('small',null,label));chart.append(column);
    });
   }).catch(()=>{number.textContent='—';chart.textContent='话题快照暂不可读取';});
  }
  readSnapshot();document.getElementById('btnScan')?.addEventListener('click',readSnapshot);
 }
 // Existing topic cards are clickable by mouse; Enter and Space do the same thing.
 const feed=document.getElementById('topicList');
 if(feed){
  const decorateCards=()=>{for(const card of feed.querySelectorAll('.tcard')){
   if(card.dataset.snKeyboard)return;card.dataset.snKeyboard='true';card.tabIndex=0;
   card.setAttribute('role','group');card.setAttribute('aria-label','公开话题：'+(card.dataset.t||'公开话题'));
   card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
  }};
  new MutationObserver(decorateCards).observe(feed,{childList:true});decorateCards();
 }
}
if(journey==='town'){
 const focus=body.querySelector('.v3-town-focus');
 if(focus){
  const art=el('div','sn-town-art');art.setAttribute('aria-hidden','true');
  const landscape=document.createElementNS('http://www.w3.org/2000/svg','svg');landscape.setAttribute('viewBox','0 0 440 170');landscape.setAttribute('preserveAspectRatio','xMidYMid slice');
  for(const [name,attrs] of [
   ['circle',{cx:340,cy:37,r:16,fill:'#e2dbc5'}],
   ['path',{d:'M0 133L80 43L121 90L168 18L240 109L290 64L366 124L440 77V170H0Z',fill:'#d0dfd9'}],
   ['path',{d:'M0 146L107 101L163 132L250 68L328 133L388 104L440 131V170H0Z',fill:'#a8c6ba'}],
   ['path',{d:'M0 163Q85 112 192 151T440 146V170H0Z',fill:'#7ba996'}],
   ['path',{d:'M295 121Q234 142 283 154T269 174H316Q334 162 296 153T321 130Z',fill:'#edf4f4'}]
  ]){const part=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs))part.setAttribute(k,v);landscape.append(part);}
  art.append(landscape);focus.prepend(art);
 }
 const board=body.querySelector('.v3-town-board');
 board?.addEventListener('keydown',e=>{
  const dirs={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4};if(!(e.key in dirs))return;
  const choices=[...board.querySelectorAll('button')],at=choices.indexOf(e.target);if(at<0)return;
  e.preventDefault();const to=choices[(at+dirs[e.key]+choices.length)%choices.length];to.focus();to.click();
 });
}
if(journey==='changes'){
 fold(body.querySelector('.ec-detail'),'.ec-uncertainty,.ec-source-title,.ec-sources,.ec-intro-explain','证据、边界与待核实项');
}
if(journey==='basic'){
 const wrap=body.querySelector('.wrap');
 if(wrap){
  wrap.prepend(el('div','sn-page-eyebrow','04 / THE FOUNDATION · 2025统计基准'));
  const note=wrap.querySelector('.be-quality-note');
  if(note){const disclosure=el('details','sn-data-disclosure');disclosure.append(el('summary',null,'数据口径与核查依据'));note.before(disclosure);disclosure.append(note);}
 }
 if(window.echarts){
  for(let i=1;i<=7;i++){
   const host=document.getElementById('c'+i),chart=host&&window.echarts.getInstanceByDom(host);if(!chart)continue;
   const opt=chart.getOption(),series=(opt.series||[]).map(s=>({label:{color:'#a0aec3',fontSize:12},...(i===1&&s.type==='line'?{areaStyle:{color:'#20354a',opacity:.5}}:{})}));
   chart.setOption({animation:!window.matchMedia('(prefers-reduced-motion:reduce)').matches,animationDuration:650,textStyle:{fontFamily:'-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif',color:'#a0aec3'},series});
   const resize=new ResizeObserver(()=>chart.resize());resize.observe(host);
  }
 }
}
if(journey==='comparison'){
 const stage=body.querySelector('.bc-stage');
 if(stage){
  const holder=el('div');stage.after(holder);
  fold(holder,'.v3-delta-list,.v3-delta-warning,.bc-brief-metrics','展开逐条联系与数据底座');
 }
}
const motion=window.matchMedia('(prefers-reduced-motion:reduce)');
function feedback(selector){
 if(motion.matches)return;
 for(const target of body.querySelectorAll(selector)){
  target.classList.remove('sn-status-flash');void target.offsetWidth;target.classList.add('sn-status-flash');
 }
}
document.addEventListener('bl:change-selected',()=>feedback('.ec-graph-top,.ec-detail h2'));
document.addEventListener('bl:compare-selected',()=>feedback('.bc-brief-main,.v3-delta-summary'));
body.querySelector('#pl-roles')?.addEventListener('click',()=>feedback('.pl-stage,.pl-result'));
body.querySelector('#pl-themes')?.addEventListener('click',()=>feedback('.pl-stage,.pl-result'));
body.querySelector('#pl-shock')?.addEventListener('change',()=>feedback('.pl-result,.pl-step-list'));
if(main){const note=el('p','sn-footer-note','博罗观察 · 给你看见联系的窗口，下一步由你决定。');main.append(note);}
})();
