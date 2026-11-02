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
function key(){return JSON.stringify([state.weights,state.stress,state.uncertainty])}
function toast(message){const el=$('toast');el.hidden=false;el.textContent=message;clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>el.hidden=true,2500)}
function share(){const p=new URLSearchParams({page:state.page,w:state.weights.map(x=>f(x)).join(','),stress:state.stress,u:state.uncertainty,view:state.view,field:state.field});
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
const cards=[
['01','品质标准与特色茶','已有地方标准、科研协作和区域品牌建设。模型将标准执行和品牌渠道影响分开，不以“有没有标准”替代“标准是否执行”。','真正需要：连续批次抽检、产品等级、验收记录、退货率。'],
['02','标准化原料茶与B端采购','产业综合体设计150吨干茶年产能力，发展B端原料茶是公开报道方向；不能把150吨当成新增全镇产量。','真正需要：工厂实际利用率、产品配方、订单分类、采购合同。'],
['03','茶旅、停留和本地收入','2025年全镇游客约130万人次，2030年提出350万人次、15亿元综合收入目标。','真正需要：过夜率、消费结构、重复购买、本地收入留存。'],
['04','组织协同和劳动力','58家茶企合作社、产业协会和产学研合作网络已出现，但协同关系强度不能只靠成员数推定。','真正需要：季节采工到岗、共享加工与质量台账、采购网络证据。']
];
const benchmarks=[
{name:'英德',title:'规模化供给与品牌标准',why:'研究批次稳定和与大型采购方的规格匹配',caution:'市级全产业链收入不能同镇级产值直接对比'},
{name:'安溪',title:'加工配套和市场网络',why:'研究专业化分工与长期渠道协同',caution:'县域完整产业链与镇域资源条件并不等同'},
{name:'武夷山',title:'茶文化与消费体验',why:'研究茶旅、住宿和后续产品消费能否连成链',caution:'有茶旅项目不等于游客转化率已被证实'}
];
return heading('03','重点不是造一张更大的网，而是找到机制。','每个模型变量都对应可验证的现实行为：批次、订单、产线利用、游客消费和跨企业协作。')+
panelHead('四个相互作用的产业机制','模型不是把“旅游、加工、品质”当作独立加分项：它们存在共同约束、产品分流与资源竞争。')+
'<div class="policy-flow">'+cards.map(c=>'<article class="panel policy-card"><div class="count">'+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[2]+'</p><div class="insight-highlight">'+c[3]+'</div></article>').join('')+'</div>'+
panelHead('标杆的意义，是机制，不是直接比较数值','这些参考案例是研究问题的来源，不能简单将外地增长率套进柏塘。')+
'<div class="board">'+benchmarks.map(b=>'<article class="panel"><div class="eyebrow">BENCHMARK CASE</div><h3>'+b.name+'</h3><div class="gold">'+b.title+'</div><p>'+b.why+'</p><p class="tiny">'+b.caution+'</p></article>').join('')+'</div>'+
'<div class="insight-highlight"><b>结构性发现：</b>如果标准化原料茶增强，可能改善采购稳定性，但未必同步提高特色茶品牌溢价；茶旅客流增加，也不等于同等比例的本地综合收入增加。两者必须分别测试。</div>'+
'<div class="buttons" style="margin-top:18px"><button data-page="lab" class="btn primary">把不同机制放进2030风洞 →</button></div>';
}
function report(){
const r=result&&runKey===key()?result:M.simulate({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102});
const baseRun=base||M.simulate({weights:M.DEFAULT,stress:'none',uncertainty:state.uncertainty,samples:2600,seed:20261102});
const end=r.ending,delta=f(end.valueIndex.p50-baseRun.ending.valueIndex.p50),focus=M.LABELS[state.weights.indexOf(Math.max(...state.weights))],coverage=r.coverage;
return heading('04','柏塘山茶 · 人话版模型报告','这份报告跟随你本次选择的产业路径、压力情景和C/D估算条件变化，不是静态宣传稿。')+
'<div class="report-toolbar"><p>完整专业内核，图文方式讲清楚结果与盲点。</p><div class="buttons"><button data-action="print" class="btn primary">打印 / 另存PDF</button><button data-action="copy-summary" class="btn">复制核心发现</button><button data-page="lab" class="btn">返回改条件</button></div></div>'+
'<article class="report-sheet"><div class="report-hero"><div><div class="eyebrow" style="color:#688975">BAITANG 2030 · EVIDENCE-LED WIND TUNNEL</div><h1>柏塘茶，<br>到2030年可能走向哪里？</h1><p>茶园不是从零开始，问题是如何把品质、产品、渠道和茶旅服务真正接起来。</p><p class="tiny">公开资料快照 2026-11-02 · 固定种子'+r.seed+' · '+n(r.samples)+'条条件模拟路径</p></div><div class="report-image" role="img" aria-label="柏塘茶园视觉背景"></div></div>'+
'<h2>01　先看真实基本面</h2><div class="report-stats"><div><label>2025茶叶产量</label><strong>2449吨</strong><small>另有2570吨报道口径</small></div><div><label>2025茶产业产值</label><strong>约12亿元</strong><small>统计范围待核</small></div><div><label>2025全镇游客</label><strong>约130万人次</strong><small>并非茶叶购买人数</small></div></div><p>柏塘有现行的地理标志地方标准、58家合作社与茶企、新建茶产业综合体及茶旅场景。2025年游客人次为报道的近似下限参考。</p>'+
'<h2>02　别人做对了什么？</h2><div class="report-text"><div class="report-card"><b>英德、安溪</b><p>标准化供应和长期渠道网络值得研究，但不能照抄县市级产业规模。</p></div><div class="report-card"><b>武夷山</b><p>体验、住宿、消费互相带动；值得看真实留存，而不只是游客量。</p></div></div>'+
'<h2>03　你刚才选择的道路</h2><p>本轮侧重<strong>'+esc(focus)+'</strong>；资源权重为'+state.weights.map((v,i)=>M.LABELS[i]+f(v)+'点').join('，')+'。风险情景为<strong>'+esc(M.STRESSES[state.stress].name)+'</strong>，C/D估算采用<strong>'+({central:'中性',cautious:'谨慎',optimistic:'扩张'}[state.uncertainty])+'</strong>假设。</p>'+
'<h2>04　2030年模型运行结果</h2><div class="report-stats"><div><label>2030茶产业价值能力指数P50</label><strong>'+end.valueIndex.p50+'</strong><small>2025=100，非真实产值</small></div><div><label>2030游客人次P50</label><strong>'+end.visitorsWan.p50+'万</strong><small>仅条件推演</small></div><div><label>2030茶叶供给P50</label><strong>'+end.teaTonnes.p50+'吨</strong><small>不直接等于成交量</small></div></div><div class="report-chart">'+C.draw(r,baseRun,'hist','valueIndex')+'</div>'+
'<div class="report-quote">看图一句话：同一套事实，在不同的产业机制和未知变量下，可以出现差别很大的2030结果。最重要的不是挑最漂亮的一条，而是查清造成差异的条件。</div>'+
'<h2>05　2030旅游目标，条件样本支持到什么程度？</h2><p>政府报道提出游客超过350万人次、文旅综合收入15亿元。按目前有假设的模型，游客目标在'+coverage.visitors350+'%的抽样中被覆盖；两项目标同时被覆盖的抽样占'+coverage.both+'%。这些不是现实预测概率，因为旅游人均收入等参数仍为D级假设。</p>'+
'<h2>06　可能最值得补的证据</h2><div class="report-text"><div class="report-card"><b>茶叶与B端</b><p>补批次检测、原料茶合同、综合体真实利用率。先确认产品结构怎样改变，才能谈增长。</p></div><div class="report-card"><b>茶旅与价值留存</b><p>补游客停留时间、客单与文旅收入统计范围。只增加客流不保证实现收入目标。</p></div></div><p>模型内当前与均衡基准的2030指数中位差额为'+(delta>0?'+':'')+delta+'点。这是情景对照，不能认定为真实政策收益。</p>'+
'<h2>数据与模型边界</h2><p>事实为政府规划、地方标准和公开报道；产量口径冲突没有被平均。假设包含游客增速、B端份额、加工使用率与人均旅游收入。没有柏塘真实企业样本，不宣称已有SmartPLS或SEM有效路径系数，也不预测实际茶价、企业利润或政绩。</p><ol class="source-list">'+E.sources.slice(0,9).map(s=>'<li>'+rawLink(s.id,s.title)+'（'+esc(s.grade)+'级；'+esc(s.publisher)+'）</li>').join('')+'</ol></article>';
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
if(!result||state.page!=='lab'||!$('interpretResults'))return;
const v=result.ending,goal=result.coverage,baseRun=base||result,delta=f(v.valueIndex.p50-baseRun.ending.valueIndex.p50);
const sensitivity=M.sensitivity({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,seed:20261102});
const largest=Math.max(1,...sensitivity.map(x=>Math.abs(x.deltaIndex)));
$('sensitivityResults').innerHTML='<div class="finding-bars">'+sensitivity.map(x=>'<div class="finding-row"><span>'+esc(x.label)+'</span><div class="bar-rail"><span class="bar-fill" style="width:'+Math.max(3,Math.abs(x.deltaIndex)/largest*100)+'%"></span></div><b>'+(x.deltaIndex>0?'+':'')+x.deltaIndex+'</b></div>').join('')+'</div><p class="tiny">各方案从其他路径转移最多10点资源，使用相同种子和600个样本重跑；只是模型敏感性，非SEM系数或现实效益排名。</p>';
const label=state.stress==='none'?'本轮没有额外指定冲击':'本轮已叠加'+M.STRESSES[state.stress].name;
$('interpretResults').innerHTML='<div class="finding-tally">'+v.valueIndex.p50+' <small style="font-size:13px">指数</small></div><p>2030年茶产业价值能力指数中位，不是实际产值；对照均衡方案变化'+(delta>0?'+':'')+delta+'点。</p><div class="insight-highlight"><b>'+label+'。</b>柏塘2030年游客达到350万人次目标的样本覆盖为'+goal.visitors350+'%，两项目标同时覆盖'+goal.both+'%。这仍取决于D级消费估算，绝非真实达标概率。</div><p>下一步优先补：B端采购合同、茶企真实加工利用率、旅游消费样本。最缺的是约束机制的实测，而不是更多漂亮的指标。</p>';
if($('goalSummary'))$('goalSummary').textContent='本轮有'+goal.visitors350+'%的条件样本达到游客350万目标；不代表现实发生概率。';
}
function start(force=false){
if(state.page!=='lab')return;
const k=key();if(!force&&result&&runKey===k){updateChart();updateInterpret();$('runState').textContent='已完成 '+n(result.samples)+' 条路径';$('runState').classList.remove('running');$('runBar').style.width='100%';$('runCounter').textContent=n(result.samples)+' / '+n(result.samples)+'条样本路径';$('runPct').textContent='100%';return}
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
stage.innerHTML=({lab:renderLab,evidence:renderEvidence,mechanism:renderMechanism,report})[state.page]();
if(state.page==='lab')start();
try{const q=new URLSearchParams(location.search);q.set('page',state.page);history.replaceState(null,'','?'+q.toString())}catch(e){}
}
function goto(page){if(!validPages.includes(page))return;state.page=page;render();window.scrollTo({top:0,behavior:'instant'});stage.focus({preventScroll:true})}
function moveLever(i,value){
const w=state.weights.slice(),v=Math.max(0,Math.min(70,Math.round(value/5)*5)),rest=100-v,oldTotal=w.reduce((s,x,j)=>s+(j===i?0:x),0);
let sum=0;for(let j=0;j<5;j++){if(j===i)continue;w[j]=oldTotal?Math.floor(w[j]/oldTotal*rest):Math.floor(rest/4);sum+=w[j]}
const donor=w.map((v,j)=>({v,j})).filter(x=>x.j!==i).sort((a,b)=>b.v-a.v)[0].j;w[donor]+=rest-sum;w[i]=v;state.weights=w;state.preset='custom';
}
function summary(){
const r=result||M.simulate({weights:state.weights,stress:state.stress,uncertainty:state.uncertainty,samples:2600,seed:20261102});
return '柏塘山茶2030产业风洞\n2025茶叶2449吨、产值约12亿元、游客约130万人次（公开报道，不同报道产量存在差异）。\n2030条件推演茶产业价值能力指数P10/P50/P90：'+['p10','p50','p90'].map(k=>r.ending.valueIndex[k]).join(' / ')+'（2025=100，非真实产值预测）。\n2030游客中位：'+r.ending.visitorsWan.p50+'万人次；本假设样本覆盖350万人次目标：'+r.coverage.visitors350+'%。\n以上涉及C/D级假设，不能作为现实发生概率。';
}
function copyText(s){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>toast('已复制')).catch(()=>prompt('复制内容',s));else prompt('复制内容',s)}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-page],[data-preset],[data-chart],[data-action]');
 if(!el)return;
 if(el.dataset.page)return goto(el.dataset.page);
 if(el.dataset.chart){state.view=el.dataset.chart;updateChart();return}
 if(el.dataset.preset){state.preset=el.dataset.preset;state.weights=M.PRESETS[el.dataset.preset].weights.slice();goto('lab');return}
 if(el.dataset.action==='rerun'){start(true);return}
 if(el.dataset.action==='print'){window.print();return}
 if(el.dataset.action==='copy-summary'){copyText(summary());return}
});
document.addEventListener('change',e=>{
 if(e.target.id==='metricSelect'){state.field=M.FIELDS.includes(e.target.value)?e.target.value:'valueIndex';updateChart();return}
 if(e.target.id==='stressSelect'){state.stress=M.STRESSES[e.target.value]?e.target.value:'none';start(true);return}
 if(e.target.id==='unknownSelect'){state.uncertainty=['cautious','central','optimistic'].includes(e.target.value)?e.target.value:'central';start(true);return}
});
document.addEventListener('input',e=>{const lev=e.target.dataset.lever;if(lev===undefined)return;moveLever(Number(lev),Number(e.target.value));const k=state.weights.map(x=>x);for(let i=0;i<5;i++){$('lv'+i).textContent=Math.round(k[i])+'点';$('lev'+i).value=Math.round(k[i])}document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));clearTimeout(window.__teaDebounce);window.__teaDebounce=setTimeout(()=>start(true),170)});
$('share').addEventListener('click',share);
render();
})();