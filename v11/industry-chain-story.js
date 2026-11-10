(function(){
'use strict';
const D=window.BoluoDiscoveryData,API=window.BoluoIndustryChain;
if(!D||!API||!document.getElementById('handoffRunway'))return;
const $=id=>document.getElementById(id);
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const events=D.events.filter(e=>e.state!=='stat'),byId=new Map(D.events.map(e=>[e.id,e]));
const status=[
 {k:'live',label:'已投产',color:'#218d7e',note:'已投产或已启用'},
 {k:'build',label:'在建',color:'#6897c2',note:'仍待核实投产'},
 {k:'sign',label:'签约',color:'#d0a04c',note:'尚未形成投产事实'},
 {k:'out',label:'退出或受阻',color:'#bd5a52',note:'关停或未动工'}
];
const kind=e=>e.state==='live'?'live':e.state==='out'?'out':e.stage===1?'sign':'build';
const sectors=API.getSectors();
const belong=new Map();
sectors.forEach(s=>s.all.forEach(id=>belong.set(id,s.key)));
const extras=new Set(events.filter(e=>!belong.has(e.id)).map(e=>e.id));
const plans={
 copper:{head:'材料走向应用，还缺一张真实订单图',sub:'铜箔、电池应用和回收属于产业逻辑上的相邻环节，不能据此认定企业已经相互供货。',steps:[
  {key:'raw',title:'原材料与配套',hint:'采购来源待核',ids:[],question:'原料采购来自哪里？'},
  {key:'foil',title:'铜箔生产',hint:'生产线点火',ids:['copper'],question:'点火后，实际产销和客户是谁？'},
  {key:'cell',title:'电池与储能应用',hint:'相关生产与建设主体',ids:['shenyuan','xincheng','jinliyuan'],question:'这些主体与本地铜箔厂有真实订单吗？'},
  {key:'recycle',title:'回收与再利用',hint:'回收主体已公开',ids:['jiage'],question:'回收规模、来源和本地循环如何核实？'},
  {key:'orders',title:'订单兑现',hint:'交易链条暂无证据',ids:[],question:'客户、订单、达产情况在哪里？'}
 ]},
 precision:{head:'制造主体密集，材料与客户仍未连上',sub:'精密机械、电子、液冷部件并非天然属于同一条直接供应链，这里仅展示不同生产功能及公开主体分布。',steps:[
  {key:'material',title:'材料与零部件来源',hint:'上游来源未披露',ids:[],question:'关键原料从哪里来？'},
  {key:'machine',title:'加工与制造',hint:'生产主体集中',ids:['hande','xingrui','sanren','quanli','yixin','jiayou','longxi','jintian'],question:'哪些主体已经形成稳定订单？'},
  {key:'assembly',title:'电子产品与相关配套',hint:'已见电子及液冷主体',ids:['qicaihong','xunling'],question:'主体之间是否存在可核验的本地配套？'},
  {key:'market',title:'下游客户',hint:'客户网络待核',ids:[],question:'产品进入什么市场，客户有多集中？'}
 ]},
 food:{head:'灌装和加工线可见，上游原料与渠道仍模糊',sub:'三条已投产加工线可以核验，但不能由生产线数量推断全县食品产业产值或原料本地化程度。',steps:[
  {key:'sourcing',title:'原料与采购',hint:'来源占比待核',ids:[],question:'农产品有多少来自博罗？'},
  {key:'packing',title:'加工与无菌灌装',hint:'可见已投产主体',ids:['yetai','dongweifeng','xianghao'],question:'每条产线的实际利用率是多少？'},
  {key:'sales',title:'渠道与配送',hint:'渠道信息未披露',ids:[],question:'销售网络和主要客户在哪里？'},
  {key:'cash',title:'消费与回款',hint:'营收回流待核',ids:[],question:'订单和回款何时确认？'}
 ]},
 build:{head:'看到的是产能退出，不是整条建材链消失',sub:'公庄一条熟料线的关停，是特定产线记录。不能外推为博罗整个水泥产业停产。',steps:[
  {key:'mineral',title:'原料供给',hint:'本页暂无项目级记录',ids:[],question:'熟料线原料供应怎么变化？'},
  {key:'clinker',title:'熟料产线',hint:'一条产线已退出',ids:['cement'],question:'产能置换和设备处置的下一步是什么？'},
  {key:'products',title:'水泥与建材应用',hint:'现有主体未形成样本',ids:[],question:'退出后由谁供给下游？'},
  {key:'transition',title:'产能与就业转移',hint:'退出后的影响待核',ids:[],question:'原产能和人员流向哪里？'}
 ]},
 tour:{head:'游客来了，钱在哪些环节留了下来？',sub:'到达、体验、停留、消费、本地价值回流是分析过程，不是假定已经发生的消费交易。',steps:[
  {key:'access',title:'交通与到达',hint:'交通节点已通车',ids:['road218'],question:'通车后实际客流与停留如何变化？'},
  {key:'experience',title:'游玩与体验',hint:'活动设施和项目',ids:['mofang','henghe','fubo','litian'],question:'体验项目的付费转化有多少？'},
  {key:'stay',title:'住宿与停留',hint:'民宿与片区改造',ids:['minsu','luofushanju'],question:'过夜率、入住率和停留时间是多少？'},
  {key:'spend',title:'商业与消费',hint:'商业设施可观察',ids:['tianhong','taimeig','dongshan'],question:'消费额有多少在县内留存？'},
  {key:'retained',title:'本地价值回流',hint:'缺少本地采购和工资口径',ids:[],question:'本地采购、雇工收入与利润留存多少？'}
 ]},
 agri:{head:'干茶2500斤已经过加工，不是鲜叶原料',sub:'柏塘新陂合作社干茶产量是一条合作社统计记录，不是全县茶产量，也不是一个已投产项目。',steps:[
  {key:'leaf',title:'种植与鲜叶',hint:'鲜叶产量缺口',ids:[],question:'本地鲜叶产量、采摘用工有多少？'},
  {key:'process',title:'制茶与干茶',hint:'合作社产出统计',ids:['tea'],question:'干茶产量如何转成加工增加值？'},
  {key:'channel',title:'销售与渠道',hint:'销售额与渠道待核',ids:[],question:'谁收购、谁加工、谁销售？'},
  {key:'payment',title:'资金回流',hint:'农户收入与回款待核',ids:[],question:'茶农与加工厂分别何时收到钱？'}
 ]}
};
const gaps={
 copper:[['订单','关联企业未披露直接采购合同'],['达产','投产与达产之间的实际产销未核'],['回收','回收量与本地循环比例未核'],['客户','真实下游客户待披露'],['时间','新增项目产出兑现时点待核'],['配套','材料来源及本地配套份额待核']],
 precision:[['材料','关键加工材料从何处来'],['订单','客户名单与集中度未披露'],['进度','在建项目投产节点待核'],['配套','主体间实际供货关系未证实'],['产出','产值到增加值的转化口径缺失'],['人才','新设备与技能匹配待核']],
 food:[['原料','本地农产品采购比例待核'],['产能','生产线开动与实际利用率不同'],['订单','下游渠道与客户未披露'],['物流','供应链流向与冷链信息待核'],['回款','实际结算和账期待核'],['增加值','加工净增值口径待核']],
 build:[['置换','关停产能如何置换'],['就业','人员转移与安置情况'],['供应','下游供给由谁接续'],['设备','设备拆除后的去向'],['资产','土地与厂房再利用'],['范围','不能从一条线推断行业全局']],
 tour:[['过夜','真实过夜率与入住率'],['客单价','游客实际人均消费'],['本地采购','消费产业本地采购比例'],['客流','设施启用与游客流量不是一回事'],['回流','利润与工资有多少留在本地'],['季节性','旺淡季表现与承载能力']],
 agri:[['鲜叶','鲜叶投入与干茶产出未能直接对照'],['加工','设备和加工能力尚需核实'],['渠道','主要经销与直销渠道缺失'],['账期','加工厂与茶农回款时点需核实'],['农户','实际覆盖农户数未公开'],['范围','一家合作社不能代表全县']]
};
let activeStep=null,selectedId=null,runFilter='all',timelineFilter='all',selectionKey='copper',activeGap=0;
const displayTitle=e=>(e.title||e.id).replace(/^[^·]+·\s*/,'');
const labelMonth=e=>e.month===0||!Number.isFinite(e.month)?'月份待核':e.month===12?'12月计划/线索':e.month+'月线索';
function openRecord(id){
 const e=byId.get(id);if(!e)return;
 selectedId=id;
 const sector=belong.get(id);
 if(sector&&API.getState().active!==sector)API.selectSector(sector);
 if(sector){API.selectEvent(id);}
 render();
 const episode=$('storyEpisode');
 if(episode&&window.matchMedia('(max-width:620px)').matches)episode.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderRunway(){
 const host=$('handoffRunway');
 if(!host)return;
 let sample=events.filter(e=>runFilter==='all'||(runFilter==='sector'&&belong.get(e.id)===selectionKey)||(runFilter==='shared'&&extras.has(e.id)));
 const total=events.length;
 const allCounts=status.map(x=>events.filter(e=>kind(e)===x.k).length);
 $('runwayTotal').textContent=String(total);
 $('runwayInFlight').textContent=String(allCounts[1]+allCounts[2]);
 $('runwayOut').textContent=String(allCounts[3]);
 $('runwayLive').textContent=String(allCounts[0]);
 document.querySelectorAll('[data-run-filter]').forEach(b=>{const on=b.dataset.runFilter===runFilter;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on))});
 host.innerHTML=status.map(x=>{
  const list=sample.filter(e=>kind(e)===x.k);
  const cards=list.map(e=>'<button type="button" class="runway-node '+(selectedId===e.id?'is-active':'')+'" data-story-id="'+esc(e.id)+'" title="'+esc(e.title)+'"><strong>'+esc(displayTitle(e))+'</strong><span><i>'+esc(labelMonth(e))+'</i><b class="stage">'+(extras.has(e.id)?'平台/通道':(belong.get(e.id)?'产业现场':'其他'))+'</b></span></button>').join('');
  return '<div class="runway-lane"><div class="runway-label '+x.k+'"><strong>'+x.label+'</strong><b>'+list.length+'</b><span>'+x.note+'</span></div><div class="runway-records">'+(cards||'<span class="runway-missing">这一筛选范围暂无对应记录</span>')+'</div></div>';
 }).join('');
 $('runFilterNote').textContent=runFilter==='all'?'37条公开记录已列出；每个卡片是一条记录，聚合项目仍按一条显示':runFilter==='sector'?'仅筛选当前产业已归类的公开记录，不能当作全县产业全样本':'公共平台与交通通道独立列示，不强行归入单一产业链';
}
function renderSectorNav(){
 const nav=$('storySectorTabs');if(!nav)return;
 nav.innerHTML=sectors.map(s=>'<button type="button" data-story-sector="'+esc(s.key)+'" class="'+(selectionKey===s.key?'active':'')+'" aria-pressed="'+(selectionKey===s.key)+'">'+esc(s.short||s.name)+'</button>').join('');
}
function renderValue(){
 const host=$('industryValueRail'),plan=plans[selectionKey];
 if(!host||!plan)return;
 const step=plan.steps.find(x=>x.key===activeStep)||plan.steps.find(x=>x.ids.length)||plan.steps[0];
 if(!activeStep)activeStep=step.key;
 $('valueStoryTitle').textContent=plan.head;
 $('valueStorySub').textContent=plan.sub;
 host.innerHTML=plan.steps.map((p,i)=>{
  const records=p.ids.map(id=>byId.get(id)).filter(Boolean);
  const statCount=records.filter(e=>e.state==='stat').length,siteCount=records.length-statCount;
  const isActive=p.key===activeStep;
  const nodes=records.map(e=>'<button class="phase-site '+(e.state==='stat'?'stat':'')+(selectedId===e.id?' active':'')+'" type="button" data-story-id="'+esc(e.id)+'"><span class="name">'+esc(displayTitle(e))+'</span><span class="tag">'+(e.state==='stat'?'统计':'现场')+'</span></button>').join('');
  return '<div class="value-phase '+(isActive?'active':'')+'">'+
   '<button class="phase-top" type="button" data-story-step="'+esc(p.key)+'" aria-pressed="'+isActive+'"><span class="step">环节 0'+(i+1)+'</span><strong>'+esc(p.title)+'</strong><small>'+esc(p.hint)+'</small><span class="counters"><b>'+siteCount+'</b><span>公开现场'+(statCount?' · '+statCount+'条统计':'')+'</span></span></button>'+
   '<div class="phase-sites">'+(nodes||'<div class="phase-empty">暂无可核实的主体现场<br>不等于现实中不存在</div>')+'</div></div>';
 }).join('');
 const match=plan.steps.find(x=>x.key===activeStep)||step;
 $('valueFocusTitle').textContent=match.title;
 $('valueFocusNote').textContent=match.question;
}
function renderEpisode(){
 const host=$('storyEpisode');if(!host)return;
 const plan=plans[selectionKey];
 if(selectedId&&byId.has(selectedId)){
  const e=byId.get(selectedId),b=e.state==='stat'?'统计口径':status.find(x=>x.k===kind(e))?.label||'待核';
  const src=D.sources?.[e.source];
  host.innerHTML='<div class="episode-head"><strong>当前公开线索 · '+esc(b)+'</strong><span>'+esc(labelMonth(e))+'</span></div>'+
   '<h3 class="episode-title">'+esc(e.title)+'</h3><p class="episode-deck">'+esc(e.subtitle||e.question||'此处为公开线索，尚不能单独证明上下游交易关系')+'</p>'+
   '<div class="episode-meta"><span>镇街：'+esc(e.town||'全县/未注明')+'</span><span>原始口径：'+esc((e.big||'')+(e.unit||''))+'</span><span>数据源：'+esc(src?.publisher||e.source||'待核')+'</span></div>'+
   '<details class="episode-evidence"><summary>查看证据边界与追问</summary><p>'+esc(e.question||'需要进一步核对投产、订单与实际产出。')+' '+esc(src?.note||'')+'</p></details>';
 }else{
  const step=plan?.steps.find(x=>x.key===activeStep)||plan?.steps[0];
  host.innerHTML='<div class="episode-head"><strong>当前价值链观察</strong><span>未选中公开主体</span></div><h3 class="episode-title">'+esc(step?.title||'选择一条产业链')+'</h3>'+
   '<p class="episode-deck">'+esc(step?.question||'点击左侧节点看真实公开信息和待核问题。')+'</p><div class="episode-meta"><span>虚线连接仅为价值形成逻辑</span><span>不是企业间已证实交易</span></div>';
 }
}
function renderTimeline(){
 const host=$('storyTimeline');if(!host)return;
 const sample=timelineFilter==='current'?events.filter(e=>belong.get(e.id)===selectionKey):events;
 const range=[...Array.from({length:12},(_,i)=>i+1),0];
 host.innerHTML=range.map(month=>{
  const rows=sample.filter(e=>Number.isFinite(e.month)?e.month===month:month===0);
  const future=month===12;
  const label=month===0?'未标月':month===12?'12 / 计划':month+'月';
  const points=rows.map(e=>'<button type="button" class="timeline-dot '+kind(e)+(e.id===selectedId?' active':'')+'" data-story-id="'+esc(e.id)+'" title="'+esc(e.title)+' | '+esc(labelMonth(e))+'" aria-label="'+esc(e.title)+' '+esc(labelMonth(e))+'"></button>').join('');
  return '<div class="timeline-month '+(future?'future':'')+(month===0?' timeline-unknown':'')+'"><strong>'+label+'</strong><div class="timeline-stack">'+points+'</div><div style="font-size:9px;color:#93a0aa;text-align:center">'+rows.length+'条</div></div>';
 }).join('');
 document.querySelectorAll('[data-story-timeline]').forEach(b=>{const on=b.dataset.storyTimeline===timelineFilter;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on))});
}
function renderGaps(){
 const plan=gaps[selectionKey]||gaps.copper;
 $('storyGaps').innerHTML=plan.map((g,i)=>'<button class="gap-node '+(activeGap===i?'active':'')+'" type="button" data-story-gap="'+i+'"><span class="num">缺口 0'+(i+1)+'</span><strong>'+esc(g[0])+'</strong><span>'+esc(g[1])+'</span></button>').join('');
 $('gapFocusLabel').textContent=plan[activeGap][0];
 $('gapFocusBody').textContent=plan[activeGap][1]+'；下一步需要能够定位到具体主体或统计口径的材料。';
}
function render(){
 const s=API.getState();
 if(s.active!==selectionKey){selectionKey=s.active;activeStep=null;activeGap=0;if(s.detId)selectedId=s.detId}
 renderSectorNav();renderRunway();renderValue();renderEpisode();renderTimeline();renderGaps();
}
document.addEventListener('click',e=>{
 const record=e.target.closest('[data-story-id]');if(record){openRecord(record.dataset.storyId);return}
 const sector=e.target.closest('[data-story-sector]');if(sector){selectedId=null;activeStep=null;activeGap=0;selectionKey=sector.dataset.storySector;API.selectSector(selectionKey);render();return}
 const step=e.target.closest('[data-story-step]');if(step){activeStep=step.dataset.storyStep;selectedId=null;render();return}
 const lane=e.target.closest('[data-run-filter]');if(lane){runFilter=lane.dataset.runFilter;renderRunway();return}
 const time=e.target.closest('[data-story-timeline]');if(time){timelineFilter=time.dataset.storyTimeline;renderTimeline();return}
 const gap=e.target.closest('[data-story-gap]');if(gap){activeGap=Number(gap.dataset.storyGap);renderGaps();return}
});
window.addEventListener('boluo:industry-state',e=>{if(e.detail?.active!==selectionKey){selectionKey=e.detail.active;selectedId=e.detail.detId||null;activeStep=null;activeGap=0}else if(e.detail?.detId){selectedId=e.detail.detId}render()});
render();
})();