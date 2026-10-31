(function boluoEasyApp(){
'use strict';
const META=[
 ['home','◉','今日博罗','博罗变了，跟你有什么关系？','一眼看数字，点一下就明白。'],
 ['change','◎','变化现场','这一件事，会牵动谁？','从2026年的真事开始，看看关系。'],
 ['money','▥','钱从哪来','工业涨，投资怎么还在跌？','三块经济拼图，一眼看明白。'],
 ['trip','♧','去哪玩','周末去博罗哪里玩？','12个镇，点一个就出发。'],
 ['paths','◇','五条路','2030年，你会打哪张牌？','五个开关，自己做一组实验。'],
 ['future','↗','未来','1600亿会轻松达到吗？','两种走法，结果差多少？'],
 ['wind','◌','风洞','事情不按计划走，怎么办？','三个按钮，看看模型会怎么变。'],
 ['blind','✧','没想到','你有没有漏看这一面？','点开才知道，事情没有那么简单。'],
 ['report','▤','我的报告','给朋友看你的博罗发现','不是论文，是你自己玩出来的观察卡。'],
 ['end','★','最后一站','博罗的下一步，没有标准答案。','看懂一点，再问一个好问题。']
];
const IDS={
C001:['🏢','深圳和博罗一起开园'],C002:['⚡','两座储能电站开了'],C003:['🏭','新铜材料厂投产'],C004:['📝','4个大项目签约'],C005:['🔧','有些工厂扩建'],C006:['🌉','石洲大桥正在重建'],C007:['🛣️','惠霞高速在修'],C008:['🏗️','一条水泥生产线关了'],C009:['🌱','石湾工厂环保整改'],C010:['🍒','种荔枝的人开始抱团'],C011:['🌾','博罗农业有了新名片'],C012:['🏞️','国庆游客与民宿']
};
const LESSONS=[
['🏭','工厂在涨，投资却跌','2025年工业增加值涨8.7%，固定资产投资跌18.8%。两件事可以同时发生。'],
['📝','签约了，就等于建成？','签下项目不等于已经开工，更不等于全部投产。'],
['🏞️','游客多，每家店都赚钱？','国庆热闹不代表平时也住满。'],
['🌾','农业不只是种地','农产品还可以加工、销售，连着乡村里很多人的生活。'],
['🌉','一座桥，能影响什么？','修桥阶段和修好以后，可能是两种不同的体验。']
];
const PATHS=['新工厂与新能源','现有工厂做大','旅游与服务业','深圳东莞往来','农业和农产品'];
const PICON=['🏭','🔧','🏞️','🌉','🌾'];
const EVENTS_BIG={C001:['5','家企业集中入驻','园区已开园，不代表全部量产'],C002:['2','座储能电站运行','已并网，不保证每家工厂电费变低'],C003:['100','亿元是2027年目标','生产线已投产，但目标不是实际产值'],C004:['80','亿元计划投资','4个项目签约，不等于钱已经投完'],C005:['在建','部分项目正在推进','不能把在建当成已经投产'],C006:['2 → 6','车道：旧桥到计划新桥','目前是施工期，6车道还不是已通车'],C007:['超80%','2026年7月报道的进度','当时还未通车，之后要看公告'],C008:['2500','吨／日熟料产能退出','只是一条生产线，不是整个公司'],C009:['4','家企业被停产整改','整改不等于永久关停'],C010:['1','个荔枝产业协会成立','成立不等于果农收入马上上涨'],C011:['7','个国家地理标志','获得认定不等于农户收入上涨'],C012:['52.97','万人次（2026年国庆博罗片区）','假期人多，不代表全年都一样']};
const DATA={hot:null,life:null,net:null,changes:null,sources:null};
const S={page:'home',event:'C006',phase:'now',node:0,metric:'industrial',town:'长宁',townFilter:'all',wish:[],paths:[1,1,1,1,1],mode:'plan',k:[100,100,100],blind:-1,role:'博罗居民',ask:'',last:null};
const $=s=>document.getElementById(s),safe=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[x])),url=v=>/^https?:\/\//.test(v||'')?v:'';
const link=(p,t,cl='btn')=>`<a class="${cl}" href="#page=${p}">${t}</a>`;
const button=(t,action,val='',cl='btn')=>`<button class="${cl}" data-action="${action}" data-value="${safe(val)}">${t}</button>`;
const pane=(html)=>`<div class="grid">${html}</div>`;
const card=(html,span=12,style='')=>`<section class="card span${span} ${style}">${html}</section>`;
const cache=new Map();
function latest(){return DATA.changes?.changes||[];}
function currentEvent(){return latest().find(x=>x.change_id===S.event)||latest()[0]||null;}
function simulate(paths,N=3600){if(typeof HT==='undefined')return null;let key=N+'-'+paths.map(x=>[x.mu,x.sd].join(':')).join('_');if(!cache.has(key))cache.set(key,HT.run(42,N,paths));return cache.get(key);}
function plans(trend=false){if(typeof HT==='undefined')return null;return (trend?HT.TREND_PATHS:HT.DEFAULT_PATHS).map(x=>({...x}));}
function tuned(){let a=plans();return a&&a.map((x,i)=>({...x,mu:x.mu*(i===0?S.k[0]/100:i===2?S.k[1]/100:i===3?S.k[2]/100:1),sd:x.sd*(i===0?S.k[0]/100:i===2?S.k[1]/100:i===3?S.k[2]/100:1)}));}
const fmt=n=>Number(n).toFixed(0),rate=n=>Number(n).toFixed(1)+'%';
function result(r){return r?`<div class="numberboard"><div class="numtile"><div class="v">${fmt(r.p10)}</div><div class="l">偏低 · 亿元</div></div><div class="numtile darknum"><div class="v">${fmt(r.p50)}</div><div class="l">中间 · 亿元</div></div><div class="numtile"><div class="v">${fmt(r.p90)}</div><div class="l">偏高 · 亿元</div></div></div>`:'<div class="notice">暂时无法读取计算模型。</div>';}
function notes(){return '<div class="notice">这是一种“假如”的模型实验，不是现实发生的概率，也不能保证未来结果。</div>';}
function home(){
let news=(DATA.hot?.items||[]).slice(0,3),changes=latest().slice(0,4);
return pane(card(`<div class="eyebrow">2025年真实数字 → 2030年参考目标</div><div class="lead" style="margin-top:15px">已经过千亿，<br>还差多少到1600亿？</div><div class="giant" style="color:#a7efd8">595<span class="unit">亿元</span></div><div class="barbox" style="margin:21px 0 10px;background:#285164"><i style="width:62.84%"></i></div><div class="minirow small" style="color:#a8d1d0"><span>2025：1005.45亿</span><span>2030：1600亿参考线</span></div><div class="buttonrow">${link('paths','我来选5张牌 →')}${link('wind','直接玩风洞','btn ghost')}</div>`,7,'dark')
+card(`<div class="cardtitle">先玩哪个？</div><div class="buttonrow">${link('change','🌉 最近的变化','btn outline')}${link('trip','🏞️ 周末去哪玩','btn outline')}${link('money','📊 工业涨、投资跌','btn outline')}${link('future','🎲 看看2030年','btn outline')}</div><div class="cardtitle" style="margin-top:24px">你是谁？</div><div class="buttonrow">${['博罗居民','上班的人','做生意的人','来玩的游客'].map(x=>button(x,'role',x,'choicebtn '+(x===S.role?'on':''))).join('')}</div><p class="muted" style="margin-top:14px">${safe(S.role==='来玩的游客'?'先看看有哪些地方好玩。':S.role==='做生意的人'?'先看谁来了，哪些项目真的开工。':S.role==='上班的人'?'先看工厂和路的变化。':'先找一件和自己有关的事。')}</p>`,5)
+card(`<div class="cardtitle">2026年的真变化 <small>点一个展开</small></div><div class="events">${changes.map(e=>`<button class="event" data-action="event" data-value="${safe(e.change_id)}"><span>${IDS[e.change_id]?.[0]||'🔎'}</span><strong>${safe(IDS[e.change_id]?.[1]||e.title)}</strong><small>${safe(e.event_date)}</small></button>`).join('')||'<p>事件数据暂未加载。</p>'}</div>`,7)
+card(`<div class="cardtitle">最新登记的公开话题 <small>${safe(DATA.hot?.updated||'读取中')}</small></div>${news.map(x=>`<div class="minirow" style="padding:9px 0;border-bottom:1px solid #edf1f2;font-size:13px"><b>${safe(x.title)}</b>${url(x.url)?`<a href="${safe(x.url)}" class="tag" target="_blank" rel="noopener noreferrer">原文</a>`:''}</div>`).join('')||'<p class="muted">还未读取到话题。</p>'}<p class="muted" style="margin-top:12px">消息的日期，以原资料写的日期为准。</p>`,5));
}
function changes(){
let changes=latest(),e=currentEvent();if(!e)return card('变化记录加载中。');
let focus=EVENTS_BIG[e.change_id]||['—','公开变化','具体影响待核实'];let txt=e.before_after||'',parts=txt.split('；'),before=parts[0]?.replace(/^此前：/,'')||'以前的情况',after=parts.slice(1).join('；').replace(/^此后：/,'')||e.title,content=S.phase==='before'?before:S.phase==='now'?after:'未来还不知道，需要继续追踪。';
let edgeIds=new Set(e.involved_edge_ids||[]),ids=new Set(e.involved_node_ids||[]);
(DATA.net?.edges||[]).forEach(x=>{if(edgeIds.has(x.edge_id)){ids.add(x.source_node_id);ids.add(x.target_node_id);}});
let n=Array.from(ids).map(id=>(DATA.net?.nodes||[]).find(x=>x.node_id===id)).filter(Boolean).slice(0,3);
let sources=(DATA.sources?.sources||[]).filter(x=>(e.source_ids||[]).includes(x.source_id)&&url(x.url)).slice(0,4);
return pane(card(`<div class="cardtitle">一条变化，一张图 <small>已记录${changes.length}件</small></div><div class="events">${changes.map(x=>`<button class="event ${S.event===x.change_id?'on':''}" data-action="event" data-value="${safe(x.change_id)}"><span>${IDS[x.change_id]?.[0]||'🔎'}</span><strong>${safe(IDS[x.change_id]?.[1]||x.title)}</strong><small>${safe(x.event_date)}</small></button>`).join('')}</div>`)
+card(`<span class="tag">${safe(e.event_date)}</span><h2 class="lead" style="margin:13px 0">${safe(IDS[e.change_id]?.[1]||e.title)}</h2><div class="card dark" style="box-shadow:none;padding:16px;margin:12px 0"><div class="giant" style="color:#b0efd5">${safe(focus[0])}</div><div style="font-size:15px;font-weight:800">${safe(focus[1])}</div><div style="color:#c6d8dd;font-size:12px;margin-top:7px">${safe(focus[2])}</div></div><div class="phase" style="margin:15px 0">${[['before','以前'],['now','现在'],['future','以后呢？']].map(x=>button(x[1],'phase',x[0],S.phase===x[0]?'on':'' )).join('')}</div><div class="card soft"><div class="lead">${safe(content)}</div><div class="muted">哪一件已经发生，哪件只是计划，要分清。</div></div><div class="cardtitle" style="margin-top:20px">这件事涉及谁？<small>点一下主体</small></div><div class="graphstage ${S.phase}"><div class="graphcenter">${IDS[e.change_id]?.[0]||'◉'} ${safe(IDS[e.change_id]?.[1]||'这件事')}</div><div class="graphlines">${n.map((x,i)=>button(safe(x.name),'node',i,S.node===i?'on':'' )).join('')||'尚无可展示的主体'}</div><div class="graphdetail">${n[S.node]?`这条公开记录提到了：${safe(n[S.node].name)}。但被提到不代表已经受益。`:'联系还要继续核实。'}</div><div class="graphlegend">只表示记录中存在联系，不把猜想画成真实订单。</div></div>`,7)
+card(`<div class="cardtitle">有一个问题别忘了</div><div class="lead" style="color:#9a663b">${safe(e.uncertainty||'后续影响还不知道。')}</div><div class="cardtitle" style="margin-top:23px">看看原始消息</div><div class="buttonrow">${sources.map(x=>`<a class="btn outline" target="_blank" rel="noopener noreferrer" href="${safe(x.url)}">${safe(x.publisher)} ↗</a>`).join('')||'<span class="muted">来源数据未加载。</span>'}</div><div class="buttonrow" style="margin-top:24px"><a class="btn" href="../change-easy.html#story=${safe(e.change_id)}">玩一道猜题 ↗</a>${link('blind','还漏看什么','btn ghost')}</div>`,5));
}
function money(){
let list={industrial:['+8.7%','工厂的工业增加值在增长','2025年规上工业增加值增速'],investment:['−18.8%','固定资产投资减少','2025年固定资产投资增速'],houses:['−47.6%','房地产投资减少更多','2025年房地产开发投资增速'],trade:['+29.1%','进出口增长','2025年外贸进出口增速']};let item=list[S.metric];
return pane(card(`<div class="eyebrow">2025年GDP · 三块拼图</div><div class="giant" style="margin:17px 0;color:#b5f5dd">1005.45<span class="unit">亿元</span></div><div class="splitbar"><span style="width:10.7%;background:#efa953"></span><span style="width:54.6%;background:#45c9b3"></span><span style="width:34.7%;background:#82bbef"></span></div><div class="splitlegend" style="color:#c5dedf"><span>🟠 农业10.7%</span><span>🟢 第二产业54.6%</span><span>🔵 服务业34.7%</span></div><p class="muted" style="color:#a9c8ce;margin:15px 0 0">注意：这不是“大家的钱花到哪里”的银行流水，而是GDP的三部分。</p>`,7,'dark')
+card(`<div class="cardtitle">哪一项让你吃惊？</div><div class="buttonrow">${Object.entries({industrial:'工厂',investment:'投资',houses:'房地产',trade:'外贸'}).map(([v,l])=>button(l,'metric',v,'choicebtn '+(v===S.metric?'on':''))).join('')}</div><div class="giant" style="margin:20px 0;color:${S.metric==='investment'||S.metric==='houses'?'#d4757d':'#0b9783'}">${item[0]}</div><div class="lead">${item[1]}</div><p class="muted">${item[2]}</p>`,5)
+card(`<div class="cardtitle">最奇怪的两个数字</div><div class="splitbig"><div class="bigbox"><small>工业增加值</small><strong style="color:#0ea889">+8.7%</strong></div><div class="bigbox"><small>固定资产投资</small><strong style="color:#d8797e">−18.8%</strong></div></div><p class="muted" style="margin:15px 0 2px">以前建好的工厂今天在生产，但新的投资可能放慢。两种变化可以同时出现。</p><div class="buttonrow">${link('paths','接下来靠什么？ →')}</div>`));
}
function trip(){
const towns=DATA.life?.towns||[],t=towns.find(x=>x.n===S.town)||towns[0],veg=DATA.life?.veg||[];
return pane(card(`<div class="minirow"><div class="lead">想玩？先选一个镇</div><span class="tag">${safe((DATA.life?.updated||'资料加载中').slice(0,10))}</span></div><div class="buttonrow">${['all','山和水','吃吃喝喝','看看村镇'].map(v=>button(v==='all'?'全部':v,'townFilter',v,'choicebtn '+(v===S.townFilter?'on':''))).join('')}</div>`)
+card(`<div class="towns">${towns.filter(x=>S.townFilter==='all'||S.townFilter==='山和水'&&/山|水|河|湖|绿道|田园|驿站/.test((x.plays||[]).join(''))||S.townFilter==='吃吃喝喝'&&(x.foods||[]).length||S.townFilter==='看看村镇'&&/古|村|镇|县城/.test(x.tag+' '+(x.plays||[]).join(''))).map(x=>button(`<span class="emoji">📍</span><b>${safe(x.n)}</b><small>${safe(x.tag)}</small>`,'town',x.n,'town '+(x.n===S.town?'on':''))).join('')||'<p class="muted">没有读到这一类资料。</p>'}</div>`,7)
+card(t?`<span class="tag">${safe(t.n)}</span><div class="lead" style="margin-top:10px">${safe(t.tag)}</div><div class="cardtitle">去看看</div>${(t.plays||[]).map(x=>`<div class="choicebtn" style="margin:6px 0">🏞️ ${safe(x)}</div>`).join('')}<div class="cardtitle" style="margin-top:20px">吃点啥</div>${(t.foods||[]).map(x=>`<div class="choicebtn" style="margin:6px 0">🥢 ${safe(x)}</div>`).join('')}<div class="buttonrow">${button(S.wish.includes(t.n)?'已选 ✓':'加入我的计划 ＋','wish')}${button('发朋友','share','','btn ghost')}</div>`:'<p class="muted">各镇资料加载中。</p>',5)
+card(`<div class="cardtitle">我的周末计划 <small>不是已算好的路线</small></div><div class="lead">${S.wish.map(safe).join(' → ')||'先选一个镇，再邀请朋友一起挑。'}</div><div class="buttonrow">${button('分享计划 ↗','share')}${button('清空','clearwish','','btn ghost')}</div><div class="notice" style="margin-top:12px">这里不编造门票、开门时间和真实路程，出发前要再确认。</div>`)
+card(`<div class="cardtitle">当季农产品</div><div class="events">${veg.map(x=>`<div class="event"><span>🌾</span><strong>${safe(x.n)}</strong><small>${safe(x.d)}</small></div>`).join('')}</div><p class="muted">播种不等于上市。按资料日期参考。</p>`));
}
function paths(){
let a=plans(),q=a&&simulate(a.map((x,i)=>S.paths[i]?x:{...x,mu:0,sd:0})),b=a&&simulate(a);
return pane(card(`<div class="cardtitle">五张牌 · 点一下开关 <small>只是模型开关</small></div><div class="switchgrid">${PATHS.map((x,i)=>button(`<span style="font-size:23px">${PICON[i]}</span><span style="flex:1;text-align:left"><strong>${safe(x)}</strong><small>${S.paths[i]?'本轮保留':'本轮关闭'}</small></span><span class="switch"></span>`,'path',i,'switchcard '+(S.paths[i]?'':'off'))).join('')}</div><div class="buttonrow">${button('全都打开','allpaths','','btn ghost')}${link('future','看看未来','btn outline')}</div>`,7)
+card(`<div class="eyebrow">2030情景 · 中间位置</div><div class="giant" style="color:#b3efd6;margin:20px 0">${q?fmt(q.p50):'—'}<span class="unit">亿元</span></div><div class="lead" style="color:white">${q?rate(q.hit):'—'}</div><p class="muted" style="color:#b1ccd0">模拟越过1600参考线的比例</p><div class="barbox" style="background:#265662;margin:17px 0"><i style="width:${q?Math.min(100,q.p50/1600*100):0}%"></i></div><p style="color:#b2cfd4;font-size:12px">比5张全开时的中间值：${q&&b?Math.round(q.p50-b.p50):'—'}亿</p><p style="color:#b1c8cd;font-size:12px">不是现实预测。把开关关掉，不是让工厂停工。</p>`,5,'dark')
+card(`<div class="lead">五张牌开关，只是换一组“假如”。</div>${notes()}<div class="buttonrow">${link('wind','我来加点意外情况 →')}</div>`));
}
function future(){
const a=plans(),q=a&&simulate(S.mode==='plan'?a:plans(true),5000),other=a&&simulate(S.mode==='plan'?plans(true):a,5000);
const p=a&&simulate(a,5000),t=a&&simulate(plans(true),5000);
return pane(card(`<div class="lead">同样是2030年，两种走法差多少？</div><div class="buttonrow">${button('🚀 计划大多实现','mode','plan','choicebtn '+(S.mode==='plan'?'on':''))}${button('🚶 照当前节奏走','mode','trend','choicebtn '+(S.mode==='trend'?'on':''))}</div>`)
+card(`<div class="eyebrow">模型推出来的中间位置</div><div class="giant" style="color:#a6efd8;margin:18px 0">${q?fmt(q.p50):'—'}<span class="unit">亿元</span></div><div style="font-size:12px;color:#b6ccd0">三个位置，不是三个确定结局</div>${result(q)}<p style="color:#abc9d0;margin:14px 0 0;font-size:12px">2025真实数字：1005.45亿。2030这里全是情景推演。</p>`,7,'dark')
+card(`<div class="cardtitle">能跨过1600吗？</div><div class="giant" style="color:#159e83;margin:18px 0">${q?rate(q.hit):'—'}</div><div class="lead">模拟达到的比例</div><p class="muted">不是博罗真实世界的成功率，是这组假设下的模型计算结果。</p>`,5)
+card(`<div class="cardtitle">两种走法放一起</div><div class="splitbig"><div class="bigbox"><small>计划大多实现</small><strong>${p?fmt(p.p50):'—'}</strong></div><div class="bigbox"><small>保持当前节奏</small><strong>${t?fmt(t.p50):'—'}</strong></div></div><div class="buttonrow">${link('wind','自己改三个条件 →')}</div>`));
}
function wind(){
let a=plans(),r=a&&simulate(tuned(),4000),base=a&&simulate(a,4000),delta=r&&base?Math.round(r.p50-base.p50):0;
const rows=[['新工厂推进',65,115],['游客和服务生意',65,130],['深圳东莞往来',65,125]];
return pane(card(`<div class="cardtitle">三个变化，你来调 <small>100%=原设定</small></div>${rows.map((x,i)=>`<div class="ranger"><label for="s${i}"><span>${safe(x[0])}</span><output id="o${i}">${S.k[i]}%</output></label><input id="s${i}" type="range" min="${x[1]}" max="${x[2]}" step="5" value="${S.k[i]}" data-slider="${i}"></div>`).join('')}<div class="buttonrow">${button('还原','reset','','btn ghost')}${button('分享我的设定','share')}</div>`,5)
+card(`<div class="eyebrow">马上重新计算 · 2030年</div><div class="giant" style="color:#a7f3d8;margin:18px 0">${r?fmt(r.p50):'—'}<span class="unit">亿元</span></div><div class="splitbig"><div class="bigbox" style="background:#ffffff13;color:white;border-color:#43727c"><small style="color:#c2d5d8">比原来的设定</small><strong style="font-size:44px;color:${delta<0?'#ffb4a1':'#a1f1d9'}">${delta>=0?'+':''}${delta}</strong></div><div class="bigbox" style="background:#ffffff13;color:white;border-color:#43727c"><small style="color:#c2d5d8">模拟达到1600的比例</small><strong style="font-size:44px;color:#a1f1d9">${r?rate(r.hit):'—'}</strong></div></div><p style="font-size:12px;color:#b2cfd0;margin:17px 0 0">这不是现实概率。只是你改了假设后的模型结果。</p>`,7,'dark')
+card(`<div class="cardtitle">结果有高有低</div>${result(r)}${notes()}<div class="buttonrow">${link('report','做成我的发现卡 →')}${link('blind','还可能漏看什么','btn ghost')}</div>`));
}
function blind(){
return pane(card(`<div class="lead">你觉得哪句话不太对？</div><div class="muted">点开看看另一面。</div><div class="blindcards">${LESSONS.map((x,i)=>button(`<div style="font-size:30px">${x[0]}</div><strong>${safe(x[1])}</strong><span>${S.blind===i?safe(x[2]):'点一下，揭开答案 →'}</span>`,'blind',i,'blindcard '+(S.blind===i?'on':''))).join('')}</div>`)
+card(`<div class="lead">看到更多可能，才更接近一个好判断。</div><p class="muted">每次你多问一句“还有没有另一面”，就比只看新闻标题多走了一步。</p><div class="buttonrow">${link('report','做我的发现卡 →')}${button('发给朋友猜','share','','btn ghost')}</div>`));
}
function reportContent(){
const r=plans()&&simulate(tuned(),4000);return `我的博罗发现卡｜2026\n2025年GDP：1005.45亿元；2030参考目标：1600亿元。\n我的身份：${S.role}\n我留下的5张牌：${PATHS.filter((x,i)=>S.paths[i]).join('、')||'本轮全部关闭'}\n我的风洞设定：新工厂${S.k[0]}%；旅游${S.k[1]}%；跨市往来${S.k[2]}%。\n2030年模拟中间位置：${r?fmt(r.p50)+'亿元':'未加载'}，只是一组模型情景。\n我的问题：${S.ask||'博罗下一步最该看什么？'}\n来一起玩：https://zhanglingshare.github.io/boluo-simulator/easy/`;
}
function report(){
const r=plans()&&simulate(tuned(),4000);
return pane(card(`<div class="eyebrow">MY BO LUO CARD</div><div class="lead" style="font-size:28px;color:#fff;margin:15px 0">千亿已过，下一步还有很多种可能。</div><div class="numberboard"><div class="numtile darknum"><div class="v">1005</div><div class="l">2025真实 · 亿</div></div><div class="numtile darknum"><div class="v">1600</div><div class="l">2030目标 · 亿</div></div><div class="numtile darknum"><div class="v">${r?fmt(r.p50):'—'}</div><div class="l">我的模型中间值 · 亿</div></div></div><p style="color:#a9cad0;margin:17px 0 0">${safe(S.role)} · 新工厂 ${S.k[0]}% · 旅游 ${S.k[1]}% · 往来 ${S.k[2]}%</p><div class="notice" style="margin-top:14px">这是模拟体验卡，不是政府预测。</div>`,7,'dark')
+card(`<div class="cardtitle">问朋友一个问题</div><p class="muted">不用注册。用自己的话提个问题，把链接发出去。</p><textarea id="question" maxlength="90" rows="4" style="width:100%;border:1px solid #ccdedf;border-radius:10px;padding:12px;resize:vertical" placeholder="比如：游客多，为什么有些店还不赚钱？">${safe(S.ask)}</textarea><div class="buttonrow">${button('复制我的发现卡','copy')}${button('发给朋友讨论','share','','btn ghost')}</div><div class="notice" style="margin-top:15px">没有伪造的在线投票、排名或评论人数。分享的问题只放在链接里。</div>`,5)
+card(`<div class="cardtitle">想看完整证据？</div><div class="buttonrow"><a class="btn outline" href="../who.html">原版统计图 ↗</a><a class="btn outline" href="../future.html">原版未来模型 ↗</a><a class="btn outline" href="../report.html">原版报告 ↗</a></div>`));
}
function ending(){
return pane(card(`<div class="eyebrow">最后一站</div><div style="font-size:clamp(34px,6vw,62px);font-weight:900;line-height:1.3;letter-spacing:-.05em;margin:20px 0">看见数字，<br><span style="color:#a5f0d4">更要看见人。</span></div><p style="font-size:15px;color:#a9d1d6">工厂里的人、来玩的游客、种地的农民。博罗的未来和他们都有关系。</p><div class="buttonrow">${button('分享这个版本','share')}${link('home','再玩一圈','btn ghost')}</div>`,8,'dark')
+card(`<div class="cardtitle">你发现了什么？</div>${LESSONS.slice(0,4).map((x,i)=>`<div class="choicebtn" style="margin-bottom:9px">${x[0]} ${safe(x[1])}</div>`).join('')}<div class="buttonrow">${link('report','写我的发现卡 →')}</div>`,4)
+card(`<div class="lead">给桥，走不走，由你决定。</div><p class="muted">这里负责帮你发现有价值的联系，不替你做决定。</p><div class="buttonrow"><a class="btn outline" href="../index.html">返回专业原版 ↗</a></div>`));
}
function view(){
switch(S.page){case'home':return home();case'change':return changes();case'money':return money();case'trip':return trip();case'paths':return paths();case'future':return future();case'wind':return wind();case'blind':return blind();case'report':return report();case'end':return ending();default:return home();}
}
function render(top=false){
let m=META.find(x=>x[0]===S.page)||META[0];
$('headline').textContent=m[3].replace('<br>',' ');$('subtitle').textContent=m[4];
$('eyebrow').textContent='博罗风洞 · 大众互动版';
$('page-progress').textContent=String(META.indexOf(m)+1).padStart(2,'0')+' / 10';
$('navtabs').innerHTML=META.map(x=>`<a href="#page=${x[0]}" class="navtab ${S.page===x[0]?'on':''}" aria-current="${S.page===x[0]?'page':'false'}">${x[1]} ${x[2]}</a>`).join('');
$('app').innerHTML=view();
if(top)window.scrollTo({top:0,behavior:'smooth'});
}
function parseHash(){
let q=new URLSearchParams(location.hash.replace(/^#/,''));
if(META.some(x=>x[0]===q.get('page')))S.page=q.get('page');
if(/^C0\d\d$/.test(q.get('event')||''))S.event=q.get('event');
if((q.get('town')||'').length<15&&q.get('town'))S.town=q.get('town');
if(q.get('ask')&&(q.get('ask')||'').length<91)S.ask=q.get('ask');
let k=q.get('k');if(/^\d{2,3}-\d{2,3}-\d{2,3}$/.test(k||'')){let v=k.split('-').map(Number);if(v[0]>=65&&v[0]<=115&&v[1]>=65&&v[1]<=130&&v[2]>=65&&v[2]<=125)S.k=v;}
}
function go(page,extra){location.hash='page='+page+(extra?'&'+extra:'');}
function shareUrl(){let h='page='+S.page;if(S.page==='change')h+='&event='+S.event;if(S.page==='trip')h+='&town='+encodeURIComponent(S.town);if(['wind','report'].includes(S.page))h+='&k='+S.k.join('-');if(S.page==='report'&&S.ask)h+='&ask='+encodeURIComponent(S.ask);return location.href.split('#')[0]+'#'+h;}
async function share(){
let text='博罗，变了啥？来点一下，看你发现了什么。';
if(S.page==='trip')text='周末想去：'+(S.wish.join('、')||S.town);
if(S.page==='report')text='我有一个博罗问题：'+(S.ask||'你觉得博罗下一步最该看什么？');
let full=text+'\n'+shareUrl();
try{if(navigator.share){await navigator.share({title:'博罗·一眼看懂',text,url:shareUrl()});return;}if(navigator.clipboard){await navigator.clipboard.writeText(full);snack('链接已复制，发给朋友吧');return;}}catch(e){if(e.name==='AbortError')return;}
window.prompt('复制并发给朋友：',full);
}
async function copy(){let x=reportContent();try{await navigator.clipboard.writeText(x);snack('发现卡复制好了');}catch(e){window.prompt('复制这张卡：',x);}}
function snack(t){$('snack').textContent=t;$('snack').classList.add('show');clearTimeout(window.__skt);window.__skt=setTimeout(()=>$('snack').classList.remove('show'),2300);}
function action(a,v){
switch(a){
case'role':S.role=v;render();break;
case'event':S.event=v;S.node=0;S.phase='now';go('change','event='+v);render();break;
case'phase':S.phase=v;render();break;
case'node':S.node=Number(v);render();break;
case'metric':S.metric=v;render();break;
case'townFilter':S.townFilter=v;render();break;
case'town':S.town=v;render();break;
case'wish':if(!S.wish.includes(S.town))S.wish.push(S.town);render();break;
case'clearwish':S.wish=[];render();break;
case'path':S.paths[Number(v)]=1-S.paths[Number(v)];render();break;
case'allpaths':S.paths=[1,1,1,1,1];render();break;
case'mode':S.mode=v;render();break;
case'reset':S.k=[100,100,100];render();break;
case'blind':S.blind=S.blind===Number(v)?-1:Number(v);render();break;
case'share':share();break;
case'copy':copy();break;
}
}
document.addEventListener('click',e=>{let x=e.target.closest('[data-action]');if(x)action(x.dataset.action,x.dataset.value);});
document.addEventListener('input',e=>{let x=e.target;if(x.dataset.slider!==undefined){let out=$('o'+x.dataset.slider);if(out)out.textContent=x.value+'%';}if(x.id==='question')S.ask=x.value.slice(0,90);});
document.addEventListener('change',e=>{let x=e.target;if(x.dataset.slider!==undefined){S.k[Number(x.dataset.slider)]=Number(x.value);render();}});
$('share-global').onclick=share;
window.addEventListener('hashchange',()=>{let before=S.page;parseHash();render(before!==S.page);});
parseHash();render();
Promise.allSettled([
fetch('../hot.json',{cache:'no-store'}).then(x=>x.json()),
fetch('../life.json',{cache:'no-store'}).then(x=>x.json()),
fetch('../data/relationship-evidence-v1.json',{cache:'no-store'}).then(x=>x.json()),
fetch('../data/relationship-changes-v1.json',{cache:'no-store'}).then(x=>x.json()),
fetch('../data/relationship-sources-v1.json',{cache:'no-store'}).then(x=>x.json())
]).then(res=>{['hot','life','net','changes','sources'].forEach((name,i)=>{if(res[i].status==='fulfilled')DATA[name]=res[i].value;});render();});
})();