/* 柏塘山茶2030 · 情报—模型—结果交互工作台（V3） */
(function(){
'use strict';
const E=window.BaitangEvidence,M=window.BaitangMechanism,C=window.BaitangCharts;
const $=id=>document.getElementById(id),stage=$('stage');
if(!E||!M||!C){stage.innerHTML='<p class="muted">模型资料未加载，请刷新或打开上一版。</p>';return}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x).toLocaleString('zh-CN',{maximumFractionDigits:1}),f=x=>Math.round(x*10)/10;
const validPages=['lab','evidence','mechanism','report'],validViews=['hist','cdf','compare','traces','bands'];
const params=new URLSearchParams(location.search);
const weights=(params.get('w')||'').split(',').map(Number);
const state={page:validPages.includes(params.get('page'))?params.get('page'):'lab',
 weights:weights.length===5&&weights.every(x=>Number.isFinite(x)&&x>=0)?M.normalize(weights):M.DEFAULT.slice(),
 preset:'balance',stress:M.STRESSES[params.get('stress')]?params.get('stress'):'none',
 uncertainty:['cautious','central','optimistic'].includes(params.get('u'))?params.get('u'):'central',
 field:M.FIELDS.includes(params.get('field'))?params.get('field'):'valueIndex',
 view:validViews.includes(params.get('view'))?params.get('view'):'hist'};
let result=null,base=null,runKey='',runId=0,notifyTimer;
let structureFilter='all',structureSelected='plant';
const bridge=window.BoluoCaseBridge||null;
const returnInfo=bridge?bridge.getReturn(params):null;
function bridgeBar(){
 if(!returnInfo)return '';
 const caption=returnInfo.origin==='v1031'?'从V1031生活问题进入':returnInfo.origin==='network'?'从博罗产业网络的柏塘山茶节点进入':'从博罗全息关系世界进入';
 return '<div class="case-bridge-bar" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border:1px solid #719881;border-radius:12px;background:linear-gradient(100deg,#1a453b,#17343c);padding:12px 16px;margin-bottom:14px"><div><div style="color:#c8e8c7;font-size:11px;font-weight:800">'+esc(caption)+'</div><div style="color:#a6c3b3;font-size:10px">带着原来的问题进入柏塘，实验结束后返回原来的观察位置。</div></div><a href="'+esc(returnInfo.url)+'" class="btn" style="color:#f5d6a5;border-color:#ba9f75">← '+esc(returnInfo.label)+'</a></div>';
}

function key(){return JSON.stringify([state.weights,state.stress,state.uncertainty])}
function toast(message){const el=$('toast');el.hidden=false;el.textContent=message;clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>el.hidden=true,2500)}
function share(){const p=new URLSearchParams({page:state.page,w:state.weights.map(x=>f(x)).join(','),stress:state.stress,u:state.uncertainty,view:state.view,field:state.field});
if(returnInfo){for(const k of ['origin','focus','scene','returnView','returnHash','case'])if(params.has(k))p.set(k,params.get(k).slice(0,1200));}
const url=location.origin+location.pathname+'?'+p.toString();if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>toast('当前模型条件的链接已复制')).catch(()=>prompt('复制链接',url));else prompt('复制链接',url)}
function nav(){document.querySelectorAll('[data-page]').forEach(el=>{if(el.closest('#stage'))return;el.classList.toggle('active',el.dataset.page===state.page)});
const pages=[['lab','运算','◈'],['evidence','证据','◇'],['mechanism','结构','⌁'],['report','报告','▤']];
$('mobileNav').innerHTML=pages.map(([k,t,i])=>'<button data-page="'+k+'" class="'+(state.page===k?'active':'')+'"><span>'+i+'</span>'+t+'</button>').join('')}
function steps(progress=0){return '<div class="stage-flow">'+[['01','数据采集',E.facts.length+'项可核资料'],['02','建立模型','多产业机制'],['03','运行模型',progress?progress+'%已完成':'等待抽样'],['04','输出分布','2030结果'],['05','解释结果','反证与敏感性']].map(([num,title,sub],i)=>'<div class="stage-piece '+(i<2?'done':i===2?'active':'')+'"><b>'+num+'</b><div><strong>'+title+'</strong><small>'+sub+'</small></div></div>').join('')+'</div>'}
function heading(k,title,description){return '<header class="header-hero"><div class="eyebrow">'+k+' / BAITANG · MODEL 2026—2030</div><h1>'+title+'</h1><p>'+description+'</p></header>'}
function panelHead(title,sub){return '<div class="section-top"><div><div class="eyebrow">EVIDENCE → MODEL → CONSEQUENCE</div><h2>'+title+'</h2><p>'+sub+'</p></div></div>'}
function rawLink(srcId,label){const s=E.source(srcId);return s?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(label||s.title)+' ↗</a>':''}
function assumptions(){return '<div class="lab-what"><b>建模诚实：</b>2025年事实与2030年政策目标为B级公开报道，游客消费与B端订单占比没有经营台账，目前是D级情景假设；无需让所有信息都变成“确定值”。</div>'}
function leverControls(){return M.KEYS.map((id,i)=>'<div class="lever"><label for="lev'+i+'">'+esc(M.LABELS[i])+'<strong id="lv'+i+'">'+Math.round(state.weights[i])+'点</strong></label><input id="lev'+i+'" type="range" min="0" max="70" step="5" data-lever="'+i+'" value="'+Math.round(state.weights[i])+'"></div>').join('')}
function renderControls(){return '<aside class="panel lab-controls"><div class="eyebrow">02 / CONSTRUCT A MODEL</div><h2>选择发展的重心</h2><div class="preset-grid">'+Object.entries(M.PRESETS).map(([id,p])=>'<button data-preset="'+id+'" class="'+(state.preset===id?'active':'')+'">'+esc(p.name)+'</button>').join('')+'</div><div class="resource-budget"><b>100点</b>　有限的假设资源总量<br>五条路径共用，不能全部拉满。</div>'+leverControls()+
'<div class="control-title">发生怎样的苗头？</div><select class="lab-select" id="stressSelect">'+Object.entries(M.STRESSES).map(([id,s])=>'<option value="'+id+'" '+(id===state.stress?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>'+
'<div class="control-title">未取得资料的变量，按哪组区间试？</div><select class="lab-select" id="unknownSelect"><option value="cautious" '+(state.uncertainty==='cautious'?'selected':'')+'>谨慎假设（偏区间下侧）</option><option value="central" '+(state.uncertainty==='central'?'selected':'')+'>中性假设（默认）</option><option value="optimistic" '+(state.uncertainty==='optimistic'?'selected':'')+'>扩张假设（偏区间上侧）</option></select>'+
'<button class="btn primary" data-action="rerun">↻ 运行新的蒙特卡洛样本</button>'+assumptions()+'</aside>'}
const chartTabs=[['hist','2030分布'],['cdf','累计样本占比'],['compare','方案对撞'],['traces','100条样本轨迹'],['bands','年度区间']];
function renderResultsShell(){
return '<section class="panel result-panel"><div class="result-head"><div><div class="eyebrow">04 / ACTUAL STOCHASTIC OUTPUT</div><h2>2030年，几千条路怎样分化？</h2></div><span class="run-state running" id="runState">计算准备中</span></div>'+
'<div class="progress" role="progressbar" id="runProgress" aria-valuemin="0" aria-valuemax="2600" aria-valuenow="0" aria-label="真实完成的抽样数"><div id="runBar"></div></div><div class="run-count"><span id="runCounter">0 / 2,600条样本路径</span><span id="runPct">0%</span></div>'+
'<div class="visual-tabs" id="chartTabs">'+chartTabs.map(([id,label])=>'<button data-chart="'+id+'" class="'+(id===state.view?'active':'')+'">'+label+'</button>').join('')+
'<select id="metricSelect" aria-label="选择结果指标">'+M.FIELDS.map(id=>'<option value="'+id+'" '+(id===state.field?'selected':'')+'>'+esc(M.FIELD_INFO[id].name)+'</option>').join('')+'</select></div>'+
'<div class="chart-canvas" id="chartCanvas"><div class="mc-empty">正在计算样本分布…</div></div>'+
'<div class="output-metrics" id="resultMetrics">'+[0,1,2].map((v)=>'<div class="metric '+(v===1?'feature':'')+'"><label>2030 '+(['P10低位','P50中位','P90高位'][v])+'</label><strong>—</strong><small>模型情景样本</small></div>').join('')+'</div>'+
'<div class="chart-caveat" id="metricCaveat">真实数据只约束已知基线；参数分布大多为C/D级假设。样本份额并不等于已校准的现实概率。</div></section>';
}
function renderLab(){return heading('01','让模型运行，而不是让报告替模型说话。','2025真实基本面 → 分级估算 → 茶叶供给、B端原料茶、品质、茶旅共同建模 → 2030年结果样本 → 找出可能忽略的约束。')+
steps()+ '<div class="lab-layout">'+renderControls()+renderResultsShell()+'</div>'+
'<div class="discovery-grid"><section class="panel"><div class="eyebrow">05 / MODEL SENSITIVITY</div><h3>哪种路径调整最改变模型？</h3><div id="sensitivityResults"><p>模型运行完毕后，分别从另一条路挪10点资源，实际重跑并比较2030年的结果。</p></div></section>'+
'<section class="panel"><div class="eyebrow">05 / RESULTS INTERPRETED</div><h3>结果告诉我们，还要查什么？</h3><div id="interpretResults"><p>先完成模拟，再比较2030年目标约束、B端原料茶和茶旅转换机制。</p></div><div class="buttons"><button class="btn" data-page="evidence">追溯证据 →</button><button class="btn primary" data-page="report">查看人话报告 →</button></div></section></div>'+
'<div class="discovery-grid"><section class="panel"><div class="eyebrow">TOURISM GOAL · NOT A FORECAST</div><h3>2030镇级旅游目标约束</h3><div class="finding-tally">350万 <small style="font-size:15px">人次</small></div><p>报道提出2030年游客接待突破350万人次，同时争取15亿元文旅综合收入。若350万人次恰好实现，收入目标对应约429元/人次。</p><p class="gold" id="goalSummary">样本目标覆盖率尚未运行</p></section>'+
'<section class="panel"><div class="eyebrow">AUDITABLE INTELLIGENCE</div><h3>数据不是只能分成“有”或“没有”</h3><p>已有地方标准DB4413/T 6—2019；加工综合体设计产能150吨干茶/年；B端原料茶份额、加工实际利用率、旅游人均消费则缺直接台账。</p><div class="buttons"><button data-page="evidence" class="btn">打开A/B/C/D情报底座 →</button><a class="btn" href="data-lab.html">已有台账？打开本地数据实验 →</a></div></section></div>';
}
function badge(grade){return '<span class="pill '+(grade||'').toLowerCase()+'">'+esc(grade)+'级</span>'}
function renderEvidence(){
const factCards=E.facts.map(x=>'<article class="panel evidence-card"><div>'+badge(x.grade)+' <span class="pill">'+esc(x.kind)+'</span></div><strong>'+esc(x.name)+'</strong><div class="num">'+esc(x.value)+' '+esc(x.unit)+'</div><p>'+esc(x.qualifier)+'</p><div class="source-link">'+x.sourceIds.map(id=>rawLink(id,E.source(id)?.publisher)).join(' · ')+'</div></article>').join('');
const u=E.unknowns.map(x=>'<tr><td>'+badge(x.grade)+' '+esc(x.name)+'</td><td>'+esc(x.min)+' / '+esc(x.mid)+' / '+esc(x.max)+'</td><td>'+esc(x.rationale)+'</td><td>'+x.sourceIds.map(id=>rawLink(id,'证据')).join(' ')+'</td></tr>').join('');
return heading('02','证据可以不完整，但不能失去边界。','A/B/C/D四级分开；官方标准存在，不等于所有人执行；镇级目标存在，不代表能实现。')+
panelHead('事实、规划与口径冲突','点击来源可核对公开文档。2025年2449吨与2570吨两种口径不会被平均处理。')+
'<div class="evidence-grid">'+factCards+'</div>'+
panelHead('还无法直接测到的变量','合理的推演不是把空白补成确定数字，而是用可质疑、可替换的区间进行条件实验。')+
'<div class="panel"><table class="uncertainty-table"><thead><tr><th>待推断指标</th><th>低 / 中 / 高情景</th><th>为何这样设</th><th>关联资料</th></tr></thead><tbody>'+u+'</tbody></table><p class="tiny">C级为有证据约束的估算；D级为明确标注的探索输入。区间不是统计置信区间，也不是SEM估计系数。</p></div>'+
panelHead('核实材料与原始入口','包含县级十五五规划发布、镇政府报告收录、地方标准和产业调查；未取得全文的资料保留访问局限。')+
'<div class="board">'+E.sources.map(s=>'<div class="panel"><div>'+badge(s.grade)+'</div><div class="name" style="font-size:18px">'+esc(s.title)+'</div><p>'+esc(s.publisher)+' · '+esc(s.date)+'</p><p>'+esc(s.limit)+'</p><div>'+rawLink(s.id,'打开来源')+'</div></div>').join('')+'</div>';
}
function renderMechanism(){
const I=window.BaitangInsights;
if(!I)return '<p>结构可视化尚未加载</p>';
const r=result&&runKey===key()&&result.samples===result.total?result:M.simulate({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102});
const links=['all','tea','b2b','tour'],labels=['全部关系','特色茶','标准化原料茶','茶旅'];
return heading('03','看见柏塘的产业关系，而不是读产业名词。','通过网络节点发现实际证据、推断机制与缺口；再把机制放进2030年的真实模型样本里。')+
'<section class="structure-surface"><div class="structure-world"><div class="structure-world-head"><div><div class="eyebrow">INDUSTRY RELATIONSHIP WORLD</div><h2>产业价值网络 · 待检验机制</h2></div><div class="structure-filters">'+links.map((key,i)=>'<button data-network-filter="'+key+'" class="'+(structureFilter===key?'active':'')+'">'+labels[i]+'</button>').join('')+'</div></div><div id="structureCanvas">'+I.network(structureFilter,structureSelected)+'</div></div>'+
'<aside class="structure-right"><div class="panel" id="structureDetail">'+I.nodeDetail(structureSelected)+'</div><div class="panel"><div class="eyebrow">RELATIONSHIP STATUS</div><h3>关系不是自动证明了的</h3><p>节点显示公开资料对应的事实等级；连线全部表示待验证的产业传导机制，**没有以线粗细伪造交易额或SNA权重**。</p>'+I.sourceLegend()+'</div></aside></section>'+
'<div class="structure-legend"><span>点击任何节点，查看来源和下一项必须补的真实数据</span><span>切换特色茶 / 原料茶 / 茶旅，查看不同机制</span></div>'+
panelHead('产业事实的变化：2024—2025','真实产量报道以并列刻度呈现，另一家媒体的口径用虚线保留。')+
'<div class="structure-report-grid"><div class="viz-block"><div class="eyebrow">REPORTED OBSERVATIONS · B/C</div><h3>茶叶产量的两年变化</h3>'+I.production()+'</div><div class="viz-block"><div class="eyebrow">EVIDENCE & UNCERTAINTY</div><h3>现有信息究竟有多完整？</h3>'+I.evidenceBars()+'<p>证据等级统计包括公开事实、派生指标和未知参数，不是“可信度百分比”。</p></div></div>'+
panelHead('不同产品路线，影响的机制不同','从模型实际生成的2030样本观察结构变化，D级B端份额不冒充真实订单。')+
'<div class="structure-report-grid"><div class="viz-block"><div class="eyebrow">MODEL PRODUCT SPLIT · D-TIER ASSUMPTIONS</div><h3>特色茶与原料茶：两种不同的供给机制</h3>'+I.productMix(r)+'</div><div class="viz-block"><div class="eyebrow">MODEL 2026—2030</div><h3>产业价值能力如何分化？</h3>'+C.draw(r,null,'traces','valueIndex')+'<p>每条细线都来自抽样路径；指数不等于产业产值。</p></div></div>'+
panelHead('茶旅增长与2030目标之间，还差哪些条件？','游客目标和收入目标各有统计范围；先放入约束，再观察模拟样本。')+
'<div class="structure-report-grid"><div class="viz-block"><div class="eyebrow">PUBLIC TARGET VS CONDITIONAL OUTPUT</div><h3>2025基线 / 2030目标 / 模拟分布</h3>'+I.tourismGoal(r)+'</div><div class="viz-block"><div class="eyebrow">DIFFERENT MEASURES · DIFFERENT UNITS</div><h3>2030：多维结果区间</h3>'+I.rangeRows(r)+'</div></div>'+
panelHead('标杆机制对照：要查的是能力，不是名次','同一行对照“已有证据—尚缺样本—可参照机制”，不虚构标杆分数。')+
'<div class="panel">'+I.mechanismMatrix()+'</div>'+
'<div class="buttons" style="margin-top:18px"><button data-page="lab" class="btn primary">回到模型运行台，改变条件 →</button><button data-page="report" class="btn">把这组图加入报告 →</button><button data-page="evidence" class="btn">核对证据来源 →</button></div>';
}
function report(){
const I=window.BaitangInsights;
if(!I)return '<p>报告可视化模块未加载</p>';
const opts={weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102};
const r=result&&runKey===key()&&result.samples===result.total?result:M.simulate(opts);
const baseRun=base&&base.uncertainty===state.uncertainty?base:M.simulate({...opts,weights:M.DEFAULT,stress:'none'});
const end=r.ending,delta=f(end.valueIndex.p50-baseRun.ending.valueIndex.p50),focus=M.LABELS[state.weights.indexOf(Math.max(...state.weights))],cover=r.coverage;
const sensitivity=M.sensitivity({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,seed:20261102});
const observed=E.byId,photoSource=E.source('prov2026');
return heading('04','让模型自己交付一份会说话的报告。','报告里的图形与2030年蒙特卡洛样本、当前情景和A/B/C/D证据库联动。每个结果都能追问依据。')+
'<div class="report-toolbar"><p>2025事实基准 · 2026—2030推演 · '+n(r.samples)+'条模型样本</p><div class="buttons"><button data-action="print" class="btn primary">打印 / 另存PDF</button><button data-action="copy-summary" class="btn">复制研究发现</button><button data-page="lab" class="btn">改变参数，重新出图</button></div></div>'+
'<article class="report-sheet">'+
'<div class="report-hero"><div><div class="eyebrow" style="color:#688975">BAITANG 2030 · LIVE MODEL REPORT</div><h1>柏塘茶，2030年<br>可能有几种走法？</h1><p>不先写一个结论，而是让证据、产业网络与数千条模拟路径共同说明问题。</p><div class="report-title-band"><span>B级公开报道</span><span>·</span><span>C/D级情景假设</span><span>·</span><span>固定随机种子 '+r.seed+'</span></div></div><div class="report-image" role="img" aria-label="茶园环境图"></div></div>'+
'<h2>01　柏塘已经有什么？</h2>'+
'<div class="report-stats"><div><label>2025茶叶产量 · B级</label><strong>'+f(observed('tea2025').value)+'吨</strong><small>另一报道 '+f(observed('tea2025alt').value)+'吨</small></div><div><label>2025茶产业产值 · B级</label><strong>约'+observed('teaValue').value+'亿元</strong><small>统计范围未核</small></div><div><label>2025全镇游客 · B级</label><strong>'+observed('visits').value+'万+</strong><small>不等于茶叶购买人数</small></div></div>'+
'<div class="report-viz-row report-main-graphic"><div class="eyebrow">OBSERVED DATA · 2024—2025</div><div class="report-graphic-label" style="color:#f1dfc4">两年真实产量报道与口径冲突</div>'+I.production()+'</div>'+
'<div class="report-quote">产量有变化，但不能拿这两年的增速直接推到2030年。真正值得研究的是产品、加工和渠道是否发生结构性变化。</div>'+
'<h2>02　它究竟是一张怎样的产业网？</h2><p class="report-section-sub">图中的主体或制度依据公开资料；所有连线为有待检验的机制假设，绝不表示已经发生的订单或交易。</p>'+
'<div class="report-visual-flow">'+I.network('all','')+'</div>'+
'<div class="report-viz-row viz-block"><div class="eyebrow">COMPARATIVE MECHANISMS · NO FAKE RATINGS</div><h3>标杆能借鉴什么，柏塘还要验证什么？</h3>'+I.mechanismMatrix()+'</div>'+
'<h2>03　你的选择，改变哪几种机制？</h2>'+
'<p>本轮最侧重 <strong>'+esc(focus)+'</strong>；压力设置为 <strong>'+esc(M.STRESSES[state.stress].name)+'</strong>；未观测参数采用 <strong>'+({central:'中性',cautious:'谨慎',optimistic:'扩张'}[state.uncertainty])+'</strong>假设。五条路径共用100点资源，并非真实投资预算。</p>'+
'<div class="report-viz-row viz-block"><div class="eyebrow">PRODUCT STRUCTURE · D-TIER RANGE</div><h3>特色品牌茶和B端原料茶不是同一种商业模式</h3>'+I.productMix(r)+'</div>'+
'<h2>04　2030年真正跑出来什么结果？</h2>'+
'<div class="report-stats"><div><label>价值能力指数 P50</label><strong>'+f(end.valueIndex.p50)+'</strong><small>2025=100，非实际产值</small></div><div><label>茶叶供给 P50</label><strong>'+f(end.teaTonnes.p50)+'吨</strong><small>条件模拟，非保证产量</small></div><div><label>全镇游客 P50</label><strong>'+f(end.visitorsWan.p50)+'万</strong><small>未校准的模拟样本</small></div></div>'+
'<div class="report-viz-row report-main-graphic"><div class="eyebrow">2,600 GENERATED OUTCOMES · MONTE CARLO</div><div class="report-graphic-label" style="color:#f4dbb6">2030年结果分布：不是只看一条中位线</div>'+C.draw(r,baseRun,'hist','valueIndex')+'</div>'+
'<div class="report-dual"><div class="report-main-graphic"><div class="eyebrow">CUMULATIVE SAMPLE SHARE</div><div class="report-graphic-label" style="color:#f4dbb6">累计样本占比</div>'+C.draw(r,baseRun,'cdf','valueIndex')+'</div><div class="report-main-graphic"><div class="eyebrow">REAL STOCHASTIC PATHS</div><div class="report-graphic-label" style="color:#f4dbb6">2025—2030路径分叉</div>'+C.draw(r,baseRun,'traces','valueIndex')+'</div></div>'+
'<div class="report-viz-row viz-block"><div class="eyebrow">MULTI-OUTPUT · INDEPENDENT UNITS</div><h3>四种结果，不用一个数字冒充全部发展</h3>'+I.rangeRows(r)+'</div>'+
'<h2>05　目标与模拟，差在什么地方？</h2>'+
'<div class="report-viz-row report-main-graphic"><div class="eyebrow">TOURISM 2030 · TARGET IS NOT FORECAST</div><div class="report-graphic-label" style="color:#f2dfbe">目标350万人次，与条件模拟分布对照</div>'+I.tourismGoal(r)+'</div>'+
'<div class="report-dual"><div class="report-mini"><b>350万人次目标</b><p>在当前假设下，有 '+cover.visitors350+'% 的模型样本达到门槛。</p><small>不是已校准的现实达标概率</small></div><div class="report-mini"><b>15亿元文旅综合收入目标</b><p>有 '+cover.both+'% 的模型样本同时覆盖游客与收入两个目标。</p><small>收入用到D级人均综合收入假设</small></div></div>'+
'<h2>06　不同方案为何会出现不同结果？</h2>'+
'<div class="report-viz-row report-main-graphic"><div class="eyebrow">BASELINE VS CURRENT · SAME RANDOM SEED</div><div class="report-graphic-label" style="color:#f2dfbe">均衡基准与本轮选择：结果分布移动了多少？</div>'+I.scenarioCompare(r,baseRun)+'</div>'+
'<div class="report-viz-row viz-block"><div class="eyebrow">MODEL SENSITIVITY · NOT ESTIMATED SEM</div><h3>调整哪个因素，模型结果变化最大？</h3>'+I.sensitivityRows(sensitivity)+'</div>'+
'<p>当前结果的2030年模型中位比均衡基准 '+(delta>=0?'+':'')+delta+' 指数点。它只是同一组假设中的条件对照，不能被认作真实政策效益或因果效应。</p>'+
'<h2>07　看不见的部分，才是下一步数据采集重点</h2>'+
'<div class="report-viz-row viz-block"><div class="eyebrow">A / B / C / D EVIDENCE MAP</div><h3>现有事实与未知参数的分级分布</h3>'+I.evidenceBars()+'<p>要优先补齐B端采购合同、真实产线利用率、茶叶批次验收、游客消费和协作台账。</p></div>'+
'<div class="report-quote">这台风洞不负责替你选择。它负责告诉你：哪些关系值得验证、哪些条件改变结果、哪些数据缺口足以推翻现在的判断。</div>'+
'<h2>方法和原始依据</h2><p>同一条件下使用固定随机种子进行'+n(r.samples)+'条蒙特卡洛抽样，显示P10/P50/P90、累计样本占比和方案对照。未用本地企业样本校准SEM/SmartPLS路径；没有预测实际茶价、企业利润或政府绩效。C/D未知变量属于透明情景假设，不能宣称为实测概率。</p>'+
'<ol class="source-list">'+E.sources.map(source=>'<li>'+rawLink(source.id,source.title)+'（'+esc(source.grade)+'级 · '+esc(source.publisher)+'；'+esc(source.limit)+'）</li>').join('')+'</ol>'+
'</article>';
}
function setResult(resultObj){result=resultObj;updateChart();updateInterpret();}
function updateChart(){
const plot=$('chartCanvas');if(!plot||!result)return;
const baseline=base||result;
plot.innerHTML=C.draw(result,baseline,state.view,state.field);
const v=result.ending[state.field],meta=M.FIELD_INFO[state.field];
$('resultMetrics').innerHTML=[['P10低位',v.p10],['P50中位',v.p50],['P90高位',v.p90]].map(([lab,value],i)=>'<div class="metric '+(i===1?'feature':'')+'"><label>2030 '+lab+'</label><strong>'+n(value)+'</strong><small>'+esc(meta.unit)+'</small></div>').join('');
$('metricCaveat').textContent=meta.limit+'。抽样分位数是模型条件结果，不是校准后的现实概率；一切估计参数可被新证据替换。';
document.querySelectorAll('[data-chart]').forEach(x=>x.classList.toggle('active',x.dataset.chart===state.view));
if($('metricSelect'))$('metricSelect').value=state.field;
}
function updateInterpret(){
if(!result||state.page!=='lab'||!$('interpretResults'))return;if(result.samples<result.total){$('sensitivityResults').innerHTML='<p class="muted">正在收集 '+n(result.samples)+' 条样本；完成抽样后将重新运行五种路径敏感性试验。</p>';$('interpretResults').innerHTML='<p class="muted">当前分布仍是部分样本，结果解读在全部计算结束后呈现。</p>';return;}
const v=result.ending,goal=result.coverage,baseRun=base||result,delta=f(v.valueIndex.p50-baseRun.ending.valueIndex.p50);
const sensitivity=M.sensitivity({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,seed:20261102});
const largest=Math.max(1,...sensitivity.map(x=>Math.abs(x.deltaIndex)));
$('sensitivityResults').innerHTML='<div class="finding-bars">'+sensitivity.map(x=>'<div class="finding-row"><span>'+esc(x.label)+'</span><div class="bar-rail"><span class="bar-fill" style="width:'+Math.max(3,Math.abs(x.deltaIndex)/largest*100)+'%"></span></div><b>'+(x.deltaIndex>0?'+':'')+x.deltaIndex+'</b></div>').join('')+'</div><p class="tiny">各方案从其他路径转移最多10点资源，使用相同种子和600个样本重跑；只是模型敏感性，非SEM系数或现实效益排名。</p>';
const label=state.stress==='none'?'本轮没有额外指定冲击':'本轮已叠加'+M.STRESSES[state.stress].name;
$('interpretResults').innerHTML='<div class="finding-tally">'+v.valueIndex.p50+' <small style="font-size:13px">指数</small></div><p>2030年茶产业价值能力指数中位，不是实际产值；对照均衡方案变化'+(delta>0?'+':'')+delta+'点。</p><div class="insight-highlight"><b>'+label+'。</b>柏塘2030年游客达到350万人次目标的样本覆盖为'+goal.visitors350+'%，两项目标同时覆盖'+goal.both+'%。这仍取决于D级消费估算，绝非真实达标概率。</div><p>下一步优先补：B端采购合同、茶企真实加工利用率、旅游消费样本。最缺的是约束机制的实测，而不是更多漂亮的指标。</p><button type="button" class="btn" data-action="copy-discovery">复制本轮发现卡 · 可分享、可复验 ↗</button>';
if($('goalSummary'))$('goalSummary').textContent='本轮有'+goal.visitors350+'%的条件样本达到游客350万目标；不代表现实发生概率。';
}
function start(force=false){
if(state.page!=='lab')return;
const k=key();if(!force&&result&&result.samples===result.total&&runKey===k){updateChart();updateInterpret();$('runState').textContent='已完成 '+n(result.samples)+' 条路径';$('runState').classList.remove('running');$('runBar').style.width='100%';$('runCounter').textContent=n(result.samples)+' / '+n(result.samples)+'条样本路径';$('runPct').textContent='100%';return}
runKey=k;result=null;const id=++runId;
const count=2600,seed=20261102;
const session=M.createSession({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:count,seed});
base=M.simulate({weights:M.DEFAULT,stress:'none',uncertainty:state.uncertainty,samples:count,seed});
$('runState').textContent='实际抽样运行中';$('runState').classList.add('running');$('chartCanvas').innerHTML='<div class="mc-empty">样本正在进入分布图…</div>';
function iterate(){
 if(id!==runId||state.page!=='lab')return;
 session.step(220);
 const p=Math.round(session.completed/session.total*100);
 $('runBar').style.width=p+'%';$('runProgress').setAttribute('aria-valuenow',String(session.completed));
 $('runCounter').textContent=n(session.completed)+' / '+n(session.total)+'条样本路径';$('runPct').textContent=p+'%';
 setResult(session.snapshot());
 if(session.done){runKey=k;$('runState').textContent='已完成 · '+n(session.total)+'条';$('runState').classList.remove('running');return}
 const schedule=window.requestAnimationFrame?window.requestAnimationFrame.bind(window):fn=>setTimeout(fn,0);schedule(iterate);
}
const schedule=window.requestAnimationFrame?window.requestAnimationFrame.bind(window):fn=>setTimeout(fn,0);schedule(iterate);
}
function render(){
nav();if(state.page!=='lab')runId++;
stage.innerHTML=bridgeBar()+({lab:renderLab,evidence:renderEvidence,mechanism:renderMechanism,report})[state.page]();
if(state.page==='lab')start();
try{const q=new URLSearchParams(location.search);q.set('page',state.page);history.replaceState(null,'','?'+q.toString())}catch(e){}
}
function goto(page){if(!validPages.includes(page))return;state.page=page;render();window.scrollTo({top:0,behavior:'instant'});stage.focus({preventScroll:true})}
function moveLever(i,value){
const w=state.weights.slice(),v=Math.max(0,Math.min(70,Math.round(value/5)*5)),rest=100-v,oldTotal=w.reduce((s,x,j)=>s+(j===i?0:x),0);
let sum=0;for(let j=0;j<5;j++){if(j===i)continue;w[j]=oldTotal?Math.floor(w[j]/oldTotal*rest):Math.floor(rest/4);sum+=w[j]}
const donor=w.map((v,j)=>({v,j})).filter(x=>x.j!==i).sort((a,b)=>b.v-a.v)[0].j;w[donor]+=rest-sum;w[i]=v;state.weights=w;state.preset='custom';
}
function discoveryText(){
 const r=result&&result.samples===result.total&&runKey===key()?result:M.simulate({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102});
 const v=r.ending.valueIndex,vis=r.ending.visitorsWan;
 return '我的博罗发现｜柏塘山茶 · 2030\n'+
 '我的选择：'+M.LABELS.map((label,i)=>label+' '+f(state.weights[i])+'点').join('、')+'；冲击：'+M.STRESSES[state.stress].name+'；未知变量：'+state.uncertainty+'。\n'+
 '模型情景：价值能力指数P10/P50/P90='+v.p10+'/'+v.p50+'/'+v.p90+'（2025=100）；2030游客P50='+vis.p50+'万人次。\n'+
 '警告：这些条件样本不是现实发生概率，部分输入仍是C/D级假设，需要实际B端采购与游客消费等台账核验。\n'+
 '模型：BaitangMechanism '+M.version+'；随机种子：'+r.seed+'；证据快照：'+E.asOf+'。\n'+
 '复验地址：'+location.href;
}
function summary(){
const r=result||M.simulate({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102});
return '柏塘山茶2030产业风洞\n2025茶叶2449吨、产值约12亿元、游客约130万人次（公开报道，不同报道产量存在差异）。\n2030条件推演茶产业价值能力指数P10/P50/P90：'+['p10','p50','p90'].map(k=>r.ending.valueIndex[k]).join(' / ')+'（2025=100，非真实产值预测）。\n2030游客中位：'+r.ending.visitorsWan.p50+'万人次；本假设样本覆盖350万人次目标：'+r.coverage.visitors350+'%。\n以上涉及C/D级假设，不能作为现实发生概率。';
}
function copyText(s){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>toast('已复制')).catch(()=>prompt('复制内容',s));else prompt('复制内容',s)}
document.addEventListener('click',e=>{
 const node=e.target.closest('[data-node]');if(node){structureSelected=node.dataset.node;const detail=$('structureDetail');if(detail)detail.innerHTML=window.BaitangInsights.nodeDetail(structureSelected);if($('structureCanvas'))$('structureCanvas').innerHTML=window.BaitangInsights.network(structureFilter,structureSelected);return;}
 const filter=e.target.closest('[data-network-filter]');if(filter){structureFilter=filter.dataset.networkFilter;if($('structureCanvas'))$('structureCanvas').innerHTML=window.BaitangInsights.network(structureFilter,structureSelected);document.querySelectorAll('[data-network-filter]').forEach(b=>b.classList.toggle('active',b.dataset.networkFilter===structureFilter));return;}
 const el=e.target.closest('[data-page],[data-preset],[data-chart],[data-action]');
 if(!el)return;
 if(el.dataset.page)return goto(el.dataset.page);
 if(el.dataset.chart){state.view=el.dataset.chart;updateChart();return}
 if(el.dataset.preset){state.preset=el.dataset.preset;state.weights=M.PRESETS[el.dataset.preset].weights.slice();goto('lab');return}
 if(el.dataset.action==='rerun'){start(true);return}
 if(el.dataset.action==='print'){window.print();return}
 if(el.dataset.action==='copy-summary'){copyText(summary());return}
 if(el.dataset.action==='copy-discovery'){copyText(discoveryText());return}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-node]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('change',e=>{
 if(e.target.id==='metricSelect'){state.field=M.FIELDS.includes(e.target.value)?e.target.value:'valueIndex';updateChart();return}
 if(e.target.id==='stressSelect'){state.stress=M.STRESSES[e.target.value]?e.target.value:'none';start(true);return}
 if(e.target.id==='unknownSelect'){state.uncertainty=['cautious','central','optimistic'].includes(e.target.value)?e.target.value:'central';start(true);return}
});
document.addEventListener('input',e=>{const lev=e.target.dataset.lever;if(lev===undefined)return;moveLever(Number(lev),Number(e.target.value));const k=state.weights.map(x=>x);for(let i=0;i<5;i++){$('lv'+i).textContent=Math.round(k[i])+'点';$('lev'+i).value=Math.round(k[i])}document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));clearTimeout(window.__teaDebounce);window.__teaDebounce=setTimeout(()=>start(true),170)});
$('share').addEventListener('click',share);
render();
})();