/* 柏塘V3：结构与报告专用证据和模型可视化；不生成假实测关系权重 */
(function(root){
'use strict';
const E=root.BaitangEvidence,M=root.BaitangMechanism;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=x=>(Math.round(Number(x)*10)/10).toLocaleString('zh-CN',{maximumFractionDigits:1});
const nodes=[
{id:'garden',x:98,y:250,t:'柏塘茶园',s:'茶叶供给',k:'B',stat:'4.32万亩',src:'tea2026',description:'茶园规模、2024—2025产量已有报道。茶树品种与逐日采摘效率尚未接入。',unknown:'分品种产量、天气、春茶峰值用工',tags:['tea','b2b']},
{id:'quality',x:300,y:148,t:'品质与标准',s:'批次一致性',k:'A',stat:'地方标准',src:'std',description:'DB4413/T 6—2019已有登记。标准存在是A级事实，但执行覆盖率、买方验收率尚未核实。',unknown:'批次检测、分级、验收与退货',tags:['tea','b2b']},
{id:'plant',x:519,y:142,t:'新加工综合体',s:'设计产能',k:'B',stat:'150吨/年',src:'prov2026',description:'报道披露单体设计加工能力30万斤干茶，折算150吨。不是全镇加工产能，更非实际运行量。',unknown:'投产日期、实际使用率、规格、订单',tags:['tea','b2b']},
{id:'brand',x:744,y:95,t:'特色茶与品牌',s:'面向消费者',k:'C',stat:'路径假设',src:'nf2026',description:'特色茶产品与品牌是现实方向，但本地连续销售量、售价与复购结构缺可比台账。',unknown:'产品分级、终端销售、退货与复购',tags:['tea']},
{id:'b2b',x:740,y:250,t:'标准化原料茶',s:'面向B端采购',k:'D',stat:'份额待测',src:'nf2026',description:'公开报道的产业发展方向。真实B端订单量和份额尚无同口径证据；V3份额分布是D级假设。',unknown:'采购合同、成交吨数、规格、账期',tags:['b2b']},
{id:'market',x:971,y:161,t:'渠道与采购方',s:'连续订单',k:'D',stat:'网络待测',src:'nf2026',description:'渠道和买方存在是一般产业机制，柏塘具体客户网络、集中度、复购率需要实际合同证据。',unknown:'买方名录、持续订单、渠道成本',tags:['tea','b2b']},
{id:'tour',x:522,y:404,t:'茶旅服务',s:'全镇游客',k:'B',stat:'130万+人次',src:'tour2026',description:'2025年全镇游客130万人次以上是公开报道基线；并不等于茶叶购买人次。',unknown:'到访-消费-过夜-复访转化',tags:['tour']},
{id:'visitor',x:972,y:398,t:'在地消费与回访',s:'消费留存',k:'D',stat:'客单待测',src:'tour2026',description:'2030旅游目标为350万人次、文旅综合收入15亿元。实际人均综合收入尚无可核台账。',unknown:'真实人均综合收入、购买与留存',tags:['tour']},
{id:'coord',x:285,y:397,t:'协会与科研',s:'组织协同',k:'B',stat:'58家主体',src:'tea2026',description:'茶企与合作社数量、科研合作与协会组织有报道，但实际跨主体网络强度不可直接从主体数量推得。',unknown:'联合采购、检测共享、真实协作频次',tags:['tea','b2b','tour']}
];
const edges=[
['garden','quality','C','tea'],['quality','plant','C','b2b'],['plant','brand','C','tea'],['plant','b2b','C','b2b'],['brand','market','C','tea'],['b2b','market','C','b2b'],['garden','tour','C','tour'],['tour','visitor','C','tour'],['market','visitor','C','tour'],['coord','quality','C','tea'],['coord','plant','C','b2b'],['coord','tour','C','tour']];
const by=id=>nodes.find(n=>n.id===id);
function network(active='all',selected='plant'){
const isOn=tag=>active==='all'||tag===active;
const defs='<defs><radialGradient id="netA"><stop stop-color="#68ba9a" stop-opacity=".4"/><stop offset="1" stop-color="#68ba9a" stop-opacity="0"/></radialGradient><linearGradient id="netWire" x1="0" x2="1"><stop stop-color="#82e1b9" stop-opacity=".6"/><stop offset="1" stop-color="#f3c27d" stop-opacity=".9"/></linearGradient></defs>';
const wires=edges.filter(e=>isOn(e[3])).map(([from,to,grade,tag])=>{const a=by(from),b=by(to);const line='M'+a.x+' '+a.y+'Q'+((a.x+b.x)/2)+' '+((a.y+b.y)/2-24)+' '+b.x+' '+b.y;return '<path class="structure-link '+(tag===active?'focus':'')+'" d="'+line+'"><title>'+a.t+' → '+b.t+'：C级待验证机制，不是已证实交易关系</title></path>'}).join('');
const items=nodes.map(n=>{const dim=active!=='all'&&!n.tags.includes(active),picked=selected===n.id;return '<g class="structure-node '+(picked?'picked ':'')+(dim?'dim':'')+'" transform="translate('+n.x+' '+n.y+')" data-node="'+n.id+'" tabindex="0" role="button" aria-label="选择'+n.t+'"><circle class="structure-halo" r="74"/><circle class="structure-ring" r="55"/><circle class="structure-body" r="46"/><text class="structure-grade" y="-19">'+n.k+'级</text><text class="structure-title" y="4">'+n.t+'</text><text class="structure-meta" y="25">'+n.stat+'</text></g>'}).join('');
return '<svg viewBox="0 0 1080 510" class="structure-svg" role="img" aria-label="柏塘茶产业网络关系示意，所有连线为待验证机制而非实测SNA权重">'+defs+'<ellipse cx="550" cy="265" rx="515" ry="220" class="structure-field"/>'+wires+items+'<text x="550" y="490" class="structure-foot">线 = 机制假设（C级）；节点等级 = 对该主体或制度存在性的证据，不代表实际交易已被核实</text></svg>';
}
function nodeDetail(id){const n=by(id)||by('plant'),s=E.source(n.src);return '<div class="structure-selected"><div class="eyebrow">SELECTED NODE / '+esc(n.k)+'级 · '+esc(n.s)+'</div><h3>'+esc(n.t)+'</h3><div class="structure-value">'+esc(n.stat)+'</div><p>'+esc(n.description)+'</p><div class="structure-unknown"><b>下一步需要查</b><span>'+esc(n.unknown)+'</span></div>'+(s?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">查看关联来源 · '+esc(s.publisher)+' ↗</a>':'')+'</div>'}
function production(){
const a=E.byId('tea2024').value,b=E.byId('tea2025').value,alt=E.byId('tea2025alt').value,max=2800;
const bar=(name,val,y,className)=>'<text x="28" y="'+(y+26)+'" class="v-label">'+name+'</text><rect x="154" y="'+y+'" width="'+((val/max)*770)+'" height="45" rx="8" class="'+className+'"/><text x="'+(166+val/max*770)+'" y="'+(y+28)+'" class="v-number">'+f(val)+' 吨</text>';
return '<svg viewBox="0 0 1090 235" class="v-svg" role="img" aria-label="2024年2188吨与2025年2449吨的报道产量对比，另一个2025口径2570吨">'+bar('2024 报道',a,34,'v-bar-muted')+bar('2025 报道',b,104,'v-bar-gold')+'<line x1="'+(154+alt/max*770)+'" x2="'+(154+alt/max*770)+'" y1="95" y2="162" class="v-conflict"/><text x="'+(160+alt/max*770)+'" y="188" class="v-conflict-text">另一报道 '+alt+'吨</text><text x="154" y="220" class="v-note">2024→2025：按2188→2449派生约 +11.9%（C级），不外推为2030增速</text></svg>';
}
function tourismGoal(run){
const end=run?.ending?.visitorsWan,low=end?.p10,mid=end?.p50,high=end?.p90;
const x=n=>164+(n/500)*780;
const bar=(name,v,y,c)=>'<text x="20" y="'+(y+23)+'" class="v-label">'+name+'</text><rect x="164" y="'+y+'" width="'+(v/500*780)+'" height="37" rx="7" class="'+c+'"/><text x="'+(177+v/500*780)+'" y="'+(y+24)+'" class="v-number">'+f(v)+'万</text>';
return '<svg viewBox="0 0 1080 290" class="v-svg" role="img" aria-label="2025游客130万人次、2030目标350万人次及当前模型样本分位结果">'+bar('2025基线',130,38,'v-bar-muted')+bar('2030目标',350,105,'v-bar-gold')+(end?'<line x1="'+x(low)+'" x2="'+x(high)+'" y1="212" y2="212" stroke="#9de0be" stroke-width="10" stroke-linecap="round"/><circle cx="'+x(mid)+'" cy="212" r="11" fill="#ffd18a" stroke="#0d302e" stroke-width="3"/><text x="20" y="217" class="v-label">2030模型</text><text x="'+x(mid)+'" y="245" class="v-number" text-anchor="middle">P50 '+f(mid)+'万</text><text x="'+x(low)+'" y="190" class="v-note" text-anchor="middle">P10</text><text x="'+x(high)+'" y="190" class="v-note" text-anchor="middle">P90</text>':'')+'<text x="164" y="282" class="v-note">350万是公开报道的规划目标；模型区间依赖C/D级假设，不是统计预测区间。</text></svg>';
}
function productMix(run){
const p=run?.ending?.b2bSharePct;const pct=p?p.p50:22;
const l=930*(100-pct)/100,r=930*pct/100;
return '<svg viewBox="0 0 1070 245" class="v-svg" role="img" aria-label="模型设定的2030原料茶与特色茶产品份额分流，非实际市场结构"><text x="40" y="34" class="v-label">2030 模型产品结构假设</text><rect x="40" y="57" width="'+l+'" height="66" rx="10" class="v-bar-jade"/><rect x="'+(40+l)+'" y="57" width="'+r+'" height="66" rx="10" class="v-bar-gold"/><text x="62" y="97" class="v-inner-label">其他/特色茶 '+f(100-pct)+'%</text><text x="'+(48+l)+'" y="97" class="v-inner-label">原料茶 '+f(pct)+'%</text><text x="40" y="165" class="v-note">特色茶 + 标准化原料茶：是两种需求和交付机制，不是两个已经查实的市场份额</text><text x="40" y="195" class="v-note">原料茶P10—P90：'+(p?f(p.p10)+'%—'+f(p.p90)+'%':'待运行')+'。缺真实采购订单及分类销量（D级）。</text><text x="40" y="222" class="v-note">150吨是单体年设计加工能力，并不是全镇加工能力或实际新增产量。</text></svg>';
}
function evidenceBars(){
const records=[...E.facts,...E.unknowns],counts={A:0,B:0,C:0,D:0};for(const x of records)counts[x.grade]++;
const total=records.length;
const colors={A:'#8ddac1',B:'#e4bd83',C:'#94adc6',D:'#e39c91'};
const bars=Object.entries(counts).map(([grade,count],i)=>{
const x=30+i*255,width=Math.max(2,count/total*225);
return '<g><text x="'+x+'" y="28" class="v-label">'+grade+'级 '+count+'项</text><rect x="'+x+'" y="53" width="225" height="18" rx="6" fill="#d9e7dd22"/><rect x="'+x+'" y="53" width="'+width+'" height="18" rx="6" fill="'+colors[grade]+'"/><text x="'+x+'" y="97" class="v-note">'+({A:'原始事实/标准',B:'公开报道或目标',C:'推断/派生',D:'需真实台账'}[grade])+'</text></g>'}).join('');
return '<svg class="v-svg" viewBox="0 0 1070 130" role="img" aria-label="当前事实和未知参数按A B C D证据等级统计">'+bars+'</svg>';
}
function mechanismMatrix(){
const rows=[
['品质与批次','标准登记','执行率待测','英德'],
['B端原料茶','发展方向','订单份额待测','英德 / 安溪'],
['品牌与渠道','已有组织','复购数据待测','安溪'],
['茶旅与消费','游客报道','收入留存待测','武夷山'],
['组织与协同','主体数量','实际网络待测','安溪']
];
return '<div class="matrix"><div class="matrix-header"><span>产业机制</span><span>有何可核证据</span><span>缺少的实测</span><span>机制参考</span></div>'+rows.map((r,i)=>'<div class="matrix-row"><b>'+r[0]+'</b><span><i class="matrix-dot verified"></i>'+r[1]+'</span><span><i class="matrix-dot missing"></i>'+r[2]+'</span><span>'+r[3]+'</span></div>').join('')+'</div>';
}
function rangeRows(run){
if(!run)return '';
const keys=['valueIndex','teaTonnes','visitorsWan','tourismRevenueYi'];
const scales={valueIndex:[65,190],teaTonnes:[1700,3700],visitorsWan:[90,510],tourismRevenueYi:[0,30]};
return '<div class="range-multiples">'+keys.map(k=>{const b=run.ending[k],inf=M.FIELD_INFO[k],scale=scales[k],x=n=>Math.max(0,Math.min(100,(n-scale[0])/(scale[1]-scale[0])*100));
return '<div class="range-row"><div><b>'+esc(inf.name)+'</b><small>'+esc(inf.unit)+'</small></div><div class="range-rail"><div class="range-band" style="left:'+x(b.p10)+'%;width:'+Math.max(0,x(b.p90)-x(b.p10))+'%"></div><span class="range-p50" style="left:'+x(b.p50)+'%"></span></div><strong>'+f(b.p50)+'</strong><small>P10 '+f(b.p10)+' / P90 '+f(b.p90)+'</small></div>'}).join('')+'</div><p class="viz-disclaimer">各指标采用独立的展示刻度，不可直接比较横条长度。数值是条件模拟，不是现实预测。</p>';
}
function sensitivityRows(items){
 const scale=Math.max(1,...items.map(x=>Math.abs(x.deltaIndex)));
 return '<div class="viz-sensitivity">'+items.map((x,i)=>'<div class="sens-row"><span>'+esc(x.label)+'</span><div class="sens-track"><div class="sens-fill '+(x.deltaIndex<0?'negative':'')+'" style="width:'+Math.max(2,Math.abs(x.deltaIndex)/scale*100)+'%"></div></div><b>'+(x.deltaIndex>0?'+':'')+f(x.deltaIndex)+'</b></div>').join('')+'</div><div class="viz-disclaimer">每条路按相同随机种子独立重跑（600样本），从最大其他路径挪最多10点。仅是模型敏感性，不是SEM因果系数。</div>';
}
function scenarioCompare(run,baseline){
 const current=run.ending.valueIndex,ref=baseline.ending.valueIndex;
 const all=[current.p10,current.p90,ref.p10,ref.p90],lo=Math.floor((Math.min(...all)-8)/10)*10,hi=Math.ceil((Math.max(...all)+8)/10)*10;
 const X=n=>183+(n-lo)/(hi-lo)*775;
 const rail=(name,b,y,cls)=>'<text x="22" y="'+(y+5)+'" class="v-label">'+name+'</text><line x1="'+X(b.p10)+'" y1="'+y+'" x2="'+X(b.p90)+'" y2="'+y+'" class="'+cls+'" stroke-width="12" stroke-linecap="round"/><circle cx="'+X(b.p50)+'" cy="'+y+'" r="10" fill="#f9deaf" stroke="#173c38" stroke-width="3"/><text x="'+X(b.p50)+'" y="'+(y-21)+'" text-anchor="middle" class="v-number">P50 '+f(b.p50)+'</text>';
 return '<svg class="v-svg" viewBox="0 0 1070 260" role="img" aria-label="均衡基准与当前选择在2030价值能力指数的分位区间对照">'+rail('均衡基准',ref,83,'v-range-jade')+rail('当前选择',current,182,'v-range-gold')+'<text x="183" y="248" class="v-note">2025=100 · 两方案使用相同种子和样本规模 · P10—P90为条件抽样范围</text></svg>';
}
function sourceLegend(){return '<div class="viz-grade-legend"><span>A · 官方标准存在</span><span>B · 媒体报道数据</span><span>C · 机制或推断</span><span>D · 尚缺台账</span></div>'}
root.BaitangInsights=Object.freeze({nodes,network,nodeDetail,production,tourismGoal,productMix,evidenceBars,mechanismMatrix,rangeRows,sensitivityRows,scenarioCompare,sourceLegend});
})(typeof window!=='undefined'?window:globalThis);
