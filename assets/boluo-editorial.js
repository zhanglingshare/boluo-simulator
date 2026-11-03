/* 博罗 · 01/02 editorial intelligence presentation.
 * Only reads published hot.json/life.json; never fabricates event-to-relationship causality.
 */
(function(){
'use strict';
const page=document.body?.dataset.blJourney;
if(page!=='today'&&page!=='town')return;
const $=id=>document.getElementById(id);
const h=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=String(text);return e;};
const categories={industry:'产业',livelihood:'民生',city:'城市',agriculture:'农业',tourism:'文旅',ind:'产业',life:'民生',agri:'农业',fun:'文旅'};
function niceDate(v){return String(v||'未注明').slice(0,16);}
function formatCount(n){return Number(n||0).toLocaleString('zh-CN');}
if(page==='today'){
 const hero=document.querySelector('.bl-hero-visual');
 const anchor=document.querySelector('.toolbar');
 const band=h('section');band.id='today-intelligence-band';band.setAttribute('aria-label','公开信息观察结构');
 band.innerHTML='<div class="ed-overline">PUBLIC SIGNALS · 博罗公开信息</div><div class="ed-intelligence-grid"><div><h2 class="ed-intelligence-title">从12条碎片情报，找到值得追问的线索</h2><p class="ed-intelligence-dek">新闻不等于产业结构变化。先辨认已报道的事实，再进入03对照真正收录的关系变化。</p><div class="ed-intelligence-bars" id="ed-hot-bars"><div class="ed-note">正在读取话题快照…</div></div></div><div class="ed-intelligence-aside"><div class="ed-overline">THIS SNAPSHOT</div><strong id="ed-hot-count">—</strong><p id="ed-hot-source">等待公开信息快照</p><a class="ed-link" href="industry-changes.html?from=today">03 · 去看产业变化 →</a></div></div>';
 if(anchor)anchor.parentNode.insertBefore(band,anchor);
 if(hero){
  const view=h('div');view.style.cssText='height:100%;min-height:285px;padding:clamp(16px,2vw,25px);display:flex;flex-direction:column;justify-content:space-between;background:#f9fafb';
  view.innerHTML='<div><div class="ed-overline">EVIDENCE DESK / 01</div><h3 style="font-size:23px;line-height:1.3;margin:17px 0 5px;color:#22394d">世界先发生，<br>判断才开始。</h3><p style="font-size:11px;color:#637789;line-height:1.9">每条信息都有日期、来源与核验状态。<br>并不是每条新闻都能改变产业关系。</p></div><div id="ed-hero-signal" style="border-top:1px solid #e2e6e9;padding-top:16px"><div class="ed-overline">一条值得继续观察的线索</div><div style="color:#526475;font-size:12px;margin-top:7px">正在读取最新已收录话题…</div></div><div style="display:flex;align-items:center;justify-content:space-between;color:#7d8995;font-size:10px"><span>公开资料快照</span><b style="color:#922f39">沿线索进入03 →</b></div>';
  hero.replaceChildren(view);hero.setAttribute('aria-label','根据近期已收录真实信息进入产业变化');
 }
 const note=h('p','ed-note','核验规则：目录页不能代替具体原文；点击卡片可展开事件日期、摘要与来源入口。');
 if(anchor)anchor.parentNode.insertBefore(note,anchor);
 fetch('hot.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{
  const items=Array.isArray(data.items)?data.items:[];
  const count=items.length;
  band.querySelector('.ed-intelligence-title').textContent='从'+count+'条公开线索，观察博罗正在发生什么';
  $('ed-hot-count').textContent=formatCount(count)+' 条';
  $('ed-hot-source').textContent='数据快照 '+niceDate(data.updated||data.fetched_at)+'。这是公开资料收集量，不是实时新闻数量。';
  const tally={产业:0,民生:0,城市:0,农业:0,文旅:0};
  for(const item of items){let key=categories[item.cat]||categories[item.category]||'城市';tally[key]=(tally[key]||0)+1;}
  const bars=$('ed-hot-bars');bars.replaceChildren();
  Object.entries(tally).forEach(([label,n])=>{
   const r=h('div','ed-barrow');r.append(h('span',null,label));
   const track=h('div','ed-bar-track'),fill=h('div','ed-bar-fill');fill.style.width=count?(100*n/count)+'%':'0%';track.append(fill);
   r.append(track,h('b',null,n));bars.append(r);
  });
  if(hero&&items[0]){
   const signal=$('ed-hero-signal');
   if(signal){
    signal.replaceChildren(h('div','ed-overline','一条值得继续观察的线索'),h('b',null,items[0].title));
    signal.lastChild.style.cssText='display:block;font-size:17px;margin-top:7px;line-height:1.55;color:#25394c';
    signal.append(h('p','ed-note','事件日期 '+niceDate(items[0].event_date)+' · '+(items[0].verified_status||'待核实')+' · 非关系变化证明'));
   }
  }
 }).catch(()=>{
  $('ed-hot-count').textContent='—';
  $('ed-hot-source').textContent='当前无法读取信息快照；可从原始资料入口继续查看。';
 });
}
if(page==='town'){
 const grid=$('grid'),scan=document.querySelector('.scan');
 if(!grid||!scan)return;
 const tools=h('div');tools.id='ed-town-tools';tools.setAttribute('aria-label','镇街主题筛选');
 const group=['全部','美食','山水','特色农品','产业生活'];
 group.forEach((v,i)=>{const b=h('button','ed-filter'+(i===0?' active':''),v);b.type='button';b.dataset.edType=v;b.setAttribute('aria-pressed',String(i===0));tools.append(b);});
 const count=h('span');count.id='ed-town-count';count.setAttribute('aria-live','polite');tools.append(count);
 const search=h('input');search.type='search';search.placeholder='搜索镇街、美食或去处';search.setAttribute('aria-label','搜索镇街、美食或去处');tools.append(search);
 grid.parentNode.insertBefore(tools,grid);
 const shortTheme=(card,key)=>{
  const rows=[...card.querySelectorAll('.row')].map(n=>n.innerText||n.textContent||'');
  const foods=rows.filter(x=>/吃/.test(x)).join(' ');
  const plays=rows.filter(x=>/玩/.test(x)).join(' ');
  const text=(card.innerText||card.textContent||'');
  if(key==='美食')return foods.trim().length>2;
  if(key==='山水')return /山|湖|江|峰|峡|径|林|田园|瀑|漂流|湿地|公园/.test(plays);
  if(key==='特色农品')return /茶|菜|柑|橘|橙|果|鸡|笋|花生|鱼|米|农/.test(text);
  if(key==='产业生活')return /产业|制造|园区|县城|商圈|夜市|圩镇|居住|工业/.test(text);
  return true;
 };
 let current='全部',query='';
 const apply=()=>{
  const cards=[...grid.querySelectorAll('.town')];
  let visible=0;
  cards.forEach(card=>{
   const text=(card.innerText||card.textContent||'').toLowerCase();
   const show=(current==='全部'||shortTheme(card,current))&&(!query||text.includes(query));
   card.hidden=!show;card.style.display=show?'':'none';if(show)visible++;
  });
  count.textContent='展示 '+visible+' / '+cards.length+' 镇街';
 };
 tools.querySelectorAll('button').forEach(b=>b.onclick=()=>{
  current=b.dataset.edType;
  tools.querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
  apply();
 });
 search.addEventListener('input',()=>{query=search.value.trim().toLowerCase();apply();});
 const obs=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))apply();});
 obs.observe(grid,{childList:true});
 apply();
 const sub=scan.querySelector('.sub');
 if(sub)sub.textContent='16个镇街的美食、山水、农品与生活线索。按主题筛选，也可以看看系统推荐的三个镇。';
 document.querySelectorAll('a[href="network.html"]').forEach(a=>{
  if(a.closest('.next')){a.href='industry-changes.html?from=town';a.textContent='继续观察：这些日常线索如何连接产业变化 →';}
 });
}
})();