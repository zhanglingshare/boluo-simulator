/* Boluo 2032 full research experience, public Demo / local-only data replacement. */
(function(){
"use strict";
const C=window.BoluoCore,E=window.BoluoEngine;
if(!C||!E)throw Error("Research engine modules not loaded");
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=x=>Number(x).toLocaleString("zh-CN",{maximumFractionDigits:1});
const dec=(x,n=2)=>Number(x).toFixed(n);
const pct=x=>dec(x*100,1)+"%";
const labels={primary:"第一产业",secondary:"第二产业",tertiary:"第三产业"};
const colors=["#67d6b3","#4c91db","#eba85c"];
const tableLabels={macro:"宏观经济",enterprises:"产业主体",relations:"企业关系",surveys:"社会调查",projects:"重点项目",workforce:"劳动者与就业"};
const GROUPS=[
 ["研究入口",[["mission","◈","目标与现实"],["industry","▧","工业发展"],["macro","◧","产业底盘"],["relations","◎","产业关系"]]],
 ["发展基本盘",[["industries","▦","行业结构"],["towns","⌖","镇街比较"],["network","◉","完整网络研究"],["projects","◇","项目接续"],["labor","♧","就业与人才"]]],
 ["研究与模型",[["data","▤","数据中心"],["survey","▧","社会调查"],["models","⌘","双轨模型实验室"]]],
 ["决策推演",[["wind","◉","2032风洞"],["stress","↯","压力与敏感性"],["blindspots","⚑","可能忽略什么"],["strategy","➤","行动方案"]]],
 ["研究成果",[["report","▣","研究报告"]]]
];
const STAGES=[["数据体检","统一数据规范及跨表关联","data"],["经济基本面","三次产业、行业与镇街","macro"],["微观与社会调查","企业关系、项目、调查","survey"],["双轨模型验证","程序运行与专业软件对照","models"],["2032情景与压力实验","改变条件，重新计算","wind"],["行动与研究报告","风险、机会、可复现档案","report"]];
const state={data:C.demo(),scenario:"balanced",knobs:{},sim:null,quality:null,model:null,net:null,external:null,
    compare:{A:null,B:null},active:"mission",town:C.TOWNS[0],industry:"all",networkFilter:"all",
    laborFilter:"all",projectDelay:0,staging:null,mapping:null,selectedEnterprise:null,stress:null,version:1};
state.missionFocus="balanced";
let toastTimer;
function toast(text){const e=$("#toast");e.textContent=String(text);e.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.hidden=true,5500);}
function status(text){$("#readiness").textContent=text;}
function stat(name,value,foot,dark=false){return '<div class="stat-card'+(dark?' dark':'')+'"><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong><span>'+esc(foot)+'</span></div>';}
function insight(title,description){return '<div class="insight"><strong>'+esc(title)+'</strong><p>'+esc(description)+'</p></div>';}
function listItem(title,text){return '<div class="compact-item"><div><b>'+esc(title)+'</b>'+esc(text)+'</div></div>';}
function chartBars(data,opts={}){
 const rows=data.slice(0,opts.limit||12),max=Math.max(1,...rows.map(x=>+x.value||0));
 if(!rows.length)return '<p class="fine-print">当前数据暂无可比较的有效记录。</p>';
 return rows.map((r,i)=>'<div class="bar-item"><div class="bar-item-head"><strong>'+esc(r.name)+'</strong><span>'+esc(opts.units||"")+' '+num(r.value)+'</span></div><div class="bar-track"><i style="width:'+Math.max(1,+r.value/max*100).toFixed(2)+'%"></i></div></div>').join("");
}
function svgBarChart(entries,options={}){
 const width=940,height=options.height||300,base=height-46,pad=42,max=Math.max(1,...entries.map(x=>x.value)),count=entries.length,space=(width-pad-8)/Math.max(1,count),bar=Math.min(52,space*.7);
 const bars=entries.map((r,i)=>{
  const h=+r.value/max*(height-94),x=pad+space*i+space/2-bar/2,y=base-h;
  return '<g><rect x="'+dec(x,1)+'" y="'+dec(y,1)+'" width="'+dec(bar,1)+'" height="'+dec(h,1)+'" rx="5" fill="'+(options.colors?.[i]||colors[i%3])+'"><title>'+esc(r.label)+'：'+num(r.value)+'</title></rect><text x="'+dec(x+bar/2,1)+'" y="'+(base+20)+'" text-anchor="middle" fill="#78919d" font-size="12">'+esc(r.label)+'</text></g>';
 }).join("");
 return '<svg role="img" viewBox="0 0 '+width+' '+height+'" aria-label="'+esc(options.aria||"数据柱状对比")+'"><line x1="'+pad+'" y1="'+base+'" x2="920" y2="'+base+'" stroke="#dbe7eb"/>'+bars+'</svg>';
}
function histogram(hist,label="条件模拟结果",options={}){
 const {counts,min,max}=hist;const w=940,h=300,base=244,m=Math.max(1,...counts),space=930/counts.length;
 const bars=counts.map((count,i)=>{const height=count/m*196;
  return '<rect x="'+dec(5+i*space,2)+'" y="'+dec(base-height,2)+'" width="'+dec(Math.max(1,space-2),2)+'" height="'+dec(height,2)+'" rx="3" fill="'+(i%2===0?"#4594c7":"#70c3ce")+'"/>';
 }).join("");
 return '<svg viewBox="0 0 940 300" role="img" aria-label="'+esc(label)+'"><line x1="0" y1="244" x2="940" y2="244" stroke="#dbe7eb"/>'+bars+
  '<text x="8" y="278" fill="#78909b" font-size="15">'+num(min)+(options.units||"")+'</text><text x="930" text-anchor="end" y="278" font-size="15" fill="#78909b">'+num(max)+(options.units||"")+'</text></svg>';
}
function stack(values){
 const s=C.sum(values);return '<div class="share-bar">'+values.map((value,i)=>'<i style="width:'+dec(value/s*100,5)+'%;background:'+colors[i]+'">'+(value/s>.07?pct(value/s):"")+'</i>').join("")+'</div>';
}
function shareCompare(sim){
 return '<div class="share-row"><span>2025</span>'+stack(sim.baseline.values)+'</div>'+
        '<div class="share-row"><span>2032</span>'+stack(sim.sectors.map(x=>x.p50))+'</div>'+
        '<div class="share-row"><span>目标</span>'+stack([.1,.5,.4])+'</div>'+
        '<p class="fine-print">第一产业（绿）/第二产业（蓝）/第三产业（橙）。2032数值来自当前情景的条件中位数；1:5:4仅为研究参考线。</p>';
}
function timelineSvg(sim){
 const rows=sim.baseline.history.filter(x=>+x.year>=2020).map(x=>({year:+x.year,primary:+x.primary,secondary:+x.secondary,tertiary:+x.tertiary})).concat(
   sim.yearly.filter(x=>x.year>2025).map(x=>({year:x.year,primary:x.primary,secondary:x.secondary,tertiary:x.tertiary})));
 const width=960,height=390,base=335,pad=22,max=Math.max(...rows.map(r=>C.sum(E.S.map(k=>r[k]))))*1.06,step=(width-pad*2)/rows.length,bar=step*.62;
 let shapes='<line x1="8" y1="'+base+'" x2="955" y2="'+base+'" stroke="#d7e5eb"/>';
 for(let i=0;i<rows.length;i++){
  const row=rows[i],x=pad+i*step+step/2-bar/2;let bottom=base;
  for(let j=0;j<3;j++){const val=row[E.S[j]],h=val/max*280;bottom-=h;
   shapes+='<rect x="'+dec(x,2)+'" y="'+dec(bottom,2)+'" width="'+dec(bar,2)+'" height="'+dec(h,2)+'" fill="'+colors[j]+'" rx="2"><title>'+row.year+' '+labels[E.S[j]]+'：'+num(val)+'亿元</title></rect>';
  }
  shapes+='<text x="'+dec(x+bar/2,1)+'" y="358" text-anchor="middle" fill="'+(row.year<=2025?"#507386":"#b6814d")+'" font-size="13">'+row.year+'</text>';
 }
 const splitX=pad+6*step;
 shapes+='<line x1="'+splitX+'" x2="'+splitX+'" y1="12" y2="336" stroke="#e2ab67" stroke-width="2" stroke-dasharray="5 6"/><text x="'+(splitX+7)+'" y="23" font-size="12" fill="#ba8b52">未来条件情景</text>';
 return '<svg viewBox="0 0 960 390" aria-label="2020至2032年三次产业增加值堆叠图" role="img">'+shapes+'</svg>';
}
function buttonGo(e){
 const goto=e.target.closest("[data-go]");if(goto){navigate(goto.dataset.go);return true;}return false;
}
function renderNav(){
 const html=GROUPS.map(([label,children])=>'<div class="nav-group-label">'+esc(label)+'</div>'+children.map(([id,icon,text],i)=>
  '<button type="button" class="nav-link'+(id===state.active?' selected':'')+'" data-view="'+id+'"><span class="nav-icon">'+esc(icon)+'</span><span class="nav-label">'+esc(text)+'</span><span class="nav-count">'+String(i+1).padStart(2,"0")+'</span></button>').join("")).join("");
 $("#mainNav").innerHTML=html;
}
function renderGlobal(){
 state.quality=E.quality(state.data);
 $("#topMode").textContent=state.data.meta.mode.replaceAll("_"," ")+" · "+state.version;
 $("#dataVersion").textContent=state.data.meta.dataset_id;
 $("#globalCaveat").textContent=state.data.meta.mode==="DEMO"?
   "2025参考值待复核；企业、关系、问卷、项目、就业及2032情景均为合成或假设。":
   "已导入的数据仍未经来源与统计口径核实，未替换部分保留Demo假设；所有计算结果须谨慎解释。";
 status(state.quality.status==="BLOCKED"?"数据存在阻断问题":state.data.meta.mode==="DEMO"?"Demo可运行":"混合数据 · 待核验");
}
function ensureScenario(){
 if(!state.sim)state.sim=E.simulate(state.data,{scenario:state.scenario,knobs:state.knobs,trials:2000,seed:2032});
 return state.sim;
}
function runScenario(){
 try{state.sim=E.simulate(state.data,{scenario:state.scenario,knobs:state.knobs,trials:2000,seed:2032});
  renderGlobal();renderCurrent();toast("情景已重新计算："+E.SCENARIOS[state.scenario].name);}
 catch(err){status("当前无法完成推演");toast(err.message);}
}
function navigate(page){
 if(!$('[data-page="'+page+'"]'))page="mission";
 state.active=page;history.replaceState(null,"","#"+page);
 $$(".page-section").forEach(x=>x.hidden=x.dataset.page!==page);
 $$(".nav-link").forEach(x=>x.classList.toggle("selected",x.dataset.view===page));
 $("#sectionPath").textContent=GROUPS.flatMap(g=>g[1]).find(x=>x[0]===page)?.[2]||"研究总览";
 $("#sectionCode").textContent=page==="mission"?"01 / TARGET & REALITY":String(GROUPS.flatMap(g=>g[1]).findIndex(x=>x[0]===page)+1).padStart(2,"0")+" / RESEARCH STUDIO";
 $("#sidebar").classList.remove("open");$("#mobileBackdrop").hidden=true;
 renderCurrent();window.scrollTo({top:0,behavior:"instant"});
}
function renderCurrent(){
 try{
  switch(state.active){
   case"mission":return renderMission();
   case"industry":return window.BoluoIndustryPage.render(state);
   case"data":return renderData();
   case"macro":return renderMacro();
   case"relations":return window.BoluoRelationsPage.render(state);
   case"industries":return renderIndustry();
   case"towns":return renderTowns();
   case"network":return renderNetwork();
   case"projects":return renderProjects();
   case"labor":return renderLabor();
   case"survey":return renderSurvey();
   case"models":return renderModels();
   case"wind":return renderWind();
   case"stress":return renderStress();
   case"blindspots":return renderBlindspots();
   case"strategy":return renderStrategy();
   case"report":return renderReport();
  }
 }catch(err){status("研究模块无法运行");toast("当前模块："+err.message);}
}
function renderMission(){
 const row=state.data.tables.macro.find(x=>Number(x.year)===2025);
 const values=row?[Number(row.primary),Number(row.secondary),Number(row.tertiary)]:[];
 const valid=values.length===3&&values.every(x=>Number.isFinite(x)&&x>=0)&&values.reduce((a,b)=>a+b,0)>0;
 const total=valid?values.reduce((a,b)=>a+b,0):null;
 const shares=valid?values.map(x=>x/total):[];
 const sectors=[
  {key:"primary",name:"第一产业",short:"一产",color:"#43b88f",target:10},
  {key:"secondary",name:"第二产业",short:"二产",color:"#579bdc",target:50},
  {key:"tertiary",name:"第三产业",short:"三产",color:"#e2a45d",target:40}
 ];
 const fmt=(x,d=1)=>Number(x).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
 let source="2025公开参考值 · 待复核";
 if(state.data.evidence?.macro==="IMPORTED_UNVERIFIED")source="客户导入数据 · 待核验";
 else if(state.data.meta.mode!=="DEMO"&&state.data.evidence?.macro)source="当前数据版本 · 口径需核验";
 $("#missionStats").innerHTML=[
  stat("2025地区生产总值",valid?fmt(total,2)+"亿元":"待补充",source),
  stat("第一产业增加值",valid?fmt(values[0],2)+"亿元":"待补充",valid?fmt(shares[0]*100,1)+"% · 当前占比":"当前占比待计算"),
  stat("第二产业增加值",valid?fmt(values[1],2)+"亿元":"待补充",valid?fmt(shares[1]*100,1)+"% · 当前占比":"当前占比待计算"),
  stat("第三产业增加值",valid?fmt(values[2],2)+"亿元":"待补充",valid?fmt(shares[2]*100,1)+"% · 当前占比":"当前占比待计算")
 ].join("");
 $("#targetCurrentTotal").textContent=valid?fmt(total,2):"待补充";
 $("#targetCurrentRatio").textContent=valid?shares.map(x=>fmt(x*100,1)).join(" : "):"当前版本缺少完整2025基准";
 $("#targetEvidenceTag").textContent=source;
 $("#targetCurrentBar").innerHTML=valid?sectors.map((s,i)=>'<i class="mix-segment '+s.key+'" style="width:'+Math.max(0,shares[i]*100).toFixed(3)+'%;background:'+s.color+'"></i>').join(""):'<span class="target-empty-bar">当前版本没有完整的2025三次产业基准</span>';
 $("#targetGoalBar").innerHTML=sectors.map(s=>'<i class="mix-segment '+s.key+'" style="width:'+s.target+'%;background:'+s.color+'"></i>').join("");
 $("#targetCurrentLegend").innerHTML=sectors.map((s,i)=>'<div class="target-legend-item"><i style="background:'+s.color+'"></i><div><b>'+s.short+'</b><small>'+(valid?fmt(values[i],2)+'亿元 · '+fmt(shares[i]*100,1)+'%':'待补充')+'</small></div></div>').join("");
 $("#targetGoalLegend").innerHTML=sectors.map(s=>'<div class="target-legend-item"><i style="background:'+s.color+'"></i><div><b>'+s.short+'</b><small>'+s.target.toFixed(1)+'% · 目标</small></div></div>').join("");
 $("#targetDeltas").innerHTML=valid?sectors.map((s,i)=>{
  const delta=s.target-shares[i]*100,sign=delta>0?"+":"";
  return '<article class="target-delta-card"><small>'+s.name+'占比</small><strong>'+fmt(shares[i]*100,1)+'% <span>→</span> '+s.target.toFixed(1)+'%</strong><b class="'+(delta>=0?"up":"down")+'">'+sign+fmt(delta,1)+'个百分点</b></article>';
 }).join(""):'<article class="target-delta-card">完整2025基准数据导入后，系统将自动计算结构差距。</article>';
 renderMissionFocus();
}
function renderMissionFocus(){
 const focusMap={
  balanced:{tag:"整体视角",title:"三个产业一起增长，结构才会变。",description:"先看三次产业各自的增加值、增速和增长贡献，再检查第三产业增长是否足以推动结构向1:5:4靠近。这里比较的是发展条件，不预设最终结果。",look:"三次产业增加值、增速与就业变化",check:"现价/不变价口径、分行业增加值、就业",page:"macro",action:"查看三次产业基本盘"},
  industrial:{tag:"工业观察",title:"工业继续做强，增长从哪里接续？",description:"第二产业目标占比低于2025年，但不意味着工业减量。要把工业绝对增加值、细分行业、存量企业扩能和新项目实际投产放在一起看。",look:"分行业增加值、存量扩能、项目投产",check:"工业增加值口径、项目真实进度、企业经营表现",page:"industries",action:"查看行业结构"},
  service:{tag:"服务业观察",title:"服务业怎样承接工业和居民的真实需求？",description:"第三产业占比需要提高，不能只看消费热度。更值得核实的是制造企业需要什么研发、检测、物流、软件等服务，本地供给能否承接。",look:"生产性服务供给、企业采购与县外采购",check:"服务业分行业增加值、采购流向、服务商能力",page:"network",action:"查看产业关系"},
  agriculture:{tag:"农业观察",title:"农业继续增长，价值链怎样向后延伸？",description:"第一产业目标占比略低于2025年，不意味着农业收缩。要看加工、冷链、品牌、渠道和农业服务，能否让农业增加值与经营收益共同提升。",look:"农产品加工、冷链流通、品牌渠道",check:"农业分行业增加值、加工转化、销售与回款",page:"industries",action:"查看行业结构"}
 };
 const key=focusMap[state.missionFocus]?state.missionFocus:"balanced",item=focusMap[key];
 $$("[data-focus]").forEach(btn=>{const on=btn.dataset.focus===key;btn.classList.toggle("selected",on);btn.setAttribute("aria-pressed",on?"true":"false");});
 $("#targetFocusPanel").innerHTML='<div class="target-focus-copy"><span class="focus-tag">'+esc(item.tag)+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.description)+'</p></div><div class="target-focus-metrics"><div><small>重点观察</small><strong>'+esc(item.look)+'</strong></div><div><small>优先核实</small><strong>'+esc(item.check)+'</strong></div></div><button type="button" class="button primary" data-go="'+item.page+'">'+esc(item.action)+' →</button>';
}
function renderData(){
 const q=state.quality,count=q.counts;
 $("#dataStats").innerHTML=[
  stat("数据覆盖",q.score+"/100","字段完整度，不等于来源可靠度"),
  stat("企业主体",num(count.enterprises),"含不同行业及镇街"),
  stat("调查记录",num(count.surveys),"需要检验抽样与测量"),
  stat("产业关联",num(count.relations),"无效关联："+q.missingEndpoints)
 ].join("");
 $("#datasetCards").innerHTML=Object.entries(tableLabels).map(([name,label],i)=>
  '<div class="dataset-card"><i style="background:'+colors[i%3]+'"></i><div><strong>'+label+'</strong><small>'+esc(state.data.evidence[name]||"UNKNOWN")+'</small></div><b>'+num(count[name]||0)+'</b></div>').join("");
 $("#qualityChecks").innerHTML=[
  {level:"info",scope:"宏观核算",message:"2025基准GDP："+num(ensureScenario().baseline.gdp)+"亿元，三次产业相加一致；现价/不变价仍需逐项校准。"},
  ...q.flags
 ].map(item=>'<div class="quality-item '+esc(item.level||"info")+'"><strong>'+esc(item.scope)+'</strong><p>'+esc(item.message)+'</p></div>').join("");
}
function renderMacroLegacy(){
 const sim=ensureScenario(),parts=sim.sectors;
 $("#macroStats").innerHTML=[
  stat("2025三产总量",num(sim.baseline.gdp)+"亿","公开参考基数"),
  stat("2030目标参考","1600亿","规划节点，非2025观测"),
  stat("2032条件总量P50",num(sim.totals.p50)+"亿","从当前假设计算",true),
  stat("第三产业2032中位占比",pct(parts[2].share.p50),"结构参考40%")
 ].join("");
 $("#macroTimeline").innerHTML=timelineSvg(sim);
 $("#macroShare").innerHTML=shareCompare(sim);
 $("#macroInterpretation").innerHTML=[
  insight("三产共同发展",parts.every((p,i)=>p.p50>sim.baseline.values[i])?"当前条件下，三次产业增加值中位数均高于2025基准。":"存在某个产业的情景中位数没有超过2025基准，需要重新核对增长条件。"),
  insight("结构目标不能替代发展质量","即使接近1:5:4，也要检查就业、生产率、投资效率和资源约束。"),
  insight("历史序列真实性",sim.baseline.history.some(x=>x.evidence==="SYNTHETIC_HISTORY")?"2020—2024默认数据是合成回溯序列，不应当成博罗真实历史趋势。":"当前历史数据经过导入，但来源、行业分类和价格口径仍待核实。"),
  insight("产业增加值不等于营收","服务业企业营业收入、制造业总产值与县域GDP增加值不可直接等同。")
 ].join("");
}
function renderMacro(){return window.BoluoBasePage.render(state);}
function renderIndustry(){
 const scope=$("#industryFilter").value,stateFilter=scope,detail=E.industries(state.data,scope);
 $("#industryStats").innerHTML=[
  stat("当前企业样本",num(detail.n),"当前产业筛选"),
  stat("合成营收合计",num(detail.totalSampleRevenue)+"百万元","不等于增加值"),
  stat("企业就业人数",num(detail.employment),"仅样本就业"),
  stat("行业集中度",dec(detail.concentration,3),"样本营收HHI；非全县指标")
 ].join("");
 $("#subsectorBars").innerHTML=chartBars(detail.bySubsector.map(x=>({name:x.name,value:x.sum})),{units:"百万元",limit:12});
 $("#sizeMix").innerHTML=detail.sizeBands.map(x=>'<div class="size-row"><span>'+esc(x.label)+'</span><strong>'+num(x.count)+'</strong></div>').join("")+
  '<p class="fine-print">分档来自员工数的演示规则，不等同国家正式企业规模划型标准。</p>';
 const filtered=state.data.tables.enterprises.filter(x=>scope==="all"||x.sector===scope).slice(0,70);
 $("#enterpriseTable").innerHTML=filtered.map(x=>'<tr data-company="'+esc(x.id)+'"><td>'+esc(x.name||x.id)+'</td><td>'+esc(x.subsector)+'</td><td>'+esc(x.town)+'</td><td>'+num(x.employees)+'</td><td>'+num(x.revenue)+'</td></tr>').join("");
 const selected=state.data.tables.enterprises.find(x=>x.id===state.selectedEnterprise);
 if(selected)$("#enterpriseDetail").innerHTML='<strong>'+esc(selected.name||selected.id)+'</strong> · '+esc(selected.town)+' · '+esc(selected.subsector)+'<p>员工 '+num(selected.employees)+' 人 · 合成营收 '+num(selected.revenue)+'百万元 · 数据标签 '+esc(selected.evidence)+'</p>', $("#enterpriseDetail").hidden=false;
 else $("#enterpriseDetail").hidden=true;
}
function renderTowns(){
 const rows=state.data.tables.enterprises;
 const towns=[...new Set(rows.map(x=>String(x.town||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
 if(!towns.length)throw Error("当前企业数据缺少镇街字段");
 if(!towns.includes(state.town))state.town=towns[0];
 const maps=towns.map(name=>{
  const companies=rows.filter(x=>x.town===name),parts=E.S.map(k=>companies.filter(x=>x.sector===k).length);
  return {name,n:companies.length,parts,revenue:C.sum(companies.map(x=>x.revenue)),employees:C.sum(companies.map(x=>x.employees))};
 });
 $("#townFilter").innerHTML=towns.map(t=>'<option value="'+esc(t)+'" '+(t===state.town?"selected":"")+'>'+esc(t)+'</option>').join("");
 $("#townMatrix").innerHTML=maps.map(x=>'<button type="button" class="town-cell '+(x.name===state.town?"selected":"")+'" data-town="'+esc(x.name)+'"><b>'+esc(x.name)+'</b><small>合成主体</small><strong>'+x.n+'</strong><div class="mini-stack">'+x.parts.map((v,i)=>'<i style="width:'+(x.n?dec(100*v/x.n,3):0)+'%;background:'+colors[i]+'"></i>').join("")+'</div></button>').join("");
 const t=maps.find(x=>x.name===state.town);
 $("#townDetails").innerHTML=[
  insight("当前镇街："+t.name,"当前合成企业 "+t.n+" 家，员工 "+num(t.employees)+" 人，合成营业收入 "+num(t.revenue)+" 百万元。"),
  insight("三次产业主体数","第一产业 "+t.parts[0]+"，第二产业 "+t.parts[1]+"，第三产业 "+t.parts[2]+"。"),
  insight("不要推断镇级GDP","企业样本可能不覆盖该镇街全部经营主体，收入也不等于产业增加值。"),
  insight("下一步需补充","镇级企业名录、行业统计、就业、项目和服务采购实际记录。")
 ].join("");
 $("#townBars").innerHTML=chartBars(maps.slice().sort((a,b)=>b.revenue-a.revenue).map(x=>({name:x.name,value:x.revenue})),{units:"百万元"});
}
function networkSvg(net){
 const m=net.sectorLinks,max=Math.max(1,...E.S.flatMap(a=>E.S.map(b=>m[a][b]))),points=[[155,165],[460,70],[730,210]];
 let out='<svg role="img" aria-label="三次产业有向关联权重概念图" viewBox="0 0 900 355">';
 E.S.forEach((a,i)=>E.S.forEach((b,j)=>{
  const v=m[a][b];if(v<=0)return;
  const start=points[i],end=points[j];
  if(i===j)return;
  const w=1+12*Math.sqrt(v/max);
  out+='<path d="M'+start.join(" ")+' Q 440 330 '+end.join(" ")+'" fill="none" stroke="'+colors[i]+'" stroke-opacity=".47" stroke-width="'+dec(w,2)+'"><title>'+labels[a]+' → '+labels[b]+' '+num(v)+'百万元</title></path>';
 }));
 points.forEach(([x,y],i)=>{out+='<circle cx="'+x+'" cy="'+y+'" r="61" fill="'+colors[i]+'" fill-opacity=".23" stroke="'+colors[i]+'" stroke-width="3"/><text x="'+x+'" y="'+(y+5)+'" font-size="20" fill="#214a5d" font-weight="850" text-anchor="middle">'+labels[E.S[i]]+'</text>';});
 return out+'</svg>';
}
function renderNetwork(){
 const filter=$("#networkFilter").value;state.networkFilter=filter;
 const net=E.network(state.data,filter);state.net=net;
 $("#networkStats").innerHTML=[
  stat("已登记主体",num(net.nodes),"Demo主体ID"),
  stat("有效有向关系",num(net.edges),"无效关系 "+net.invalid),
  stat("关系金额合计",num(net.total)+"百万元","仅合成采购/供应交易"),
  stat("网络类型",num(net.byType.length),"可按类型分解",true)
 ].join("");
 $("#networkSankey").innerHTML=networkSvg(net);
 $("#networkTypes").innerHTML=chartBars(net.byType.map(x=>({name:x.name,value:x.value})),{units:"百万元"});
 $("#topNetworkEntities").innerHTML=net.top.slice(0,10).map((x,i)=>
  '<button type="button" data-shocknode="'+esc(x.id)+'" class="compact-item" style="text-align:left;background:none;border:0;border-top:1px solid #e9eff2;width:100%;cursor:pointer"><div><b>'+esc(x.entity.name||x.id)+'</b>'+esc(x.entity.subsector)+' · 入向权重 '+num(x.value)+'百万元</div></button>').join("");
 $("#shockNode").innerHTML=net.top.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.entity.name||x.id)+'</option>').join("");
 $("#shockResults").innerHTML=insight("选择主体","点击高关联主体，或从下拉菜单选择后运行断点传播。每一条连线只是合成关系。");
}
function runShock(){
 const net=state.net||E.network(state.data),target=$("#shockNode").value,drop=+$("#shockStrength").value;
 const shock=E.propagate(net,target,drop);
 $("#shockResults").innerHTML=[
  insight("传导实验："+target,"设置原始冲击 "+pct(drop)+"，按三步衰减网络演示规则传播。受影响 "+shock.affected.length+" 个不同节点。"),
  ...shock.affected.slice(0,9).map(x=>insight(x.entity?.name||x.id,"传播示意强度 "+pct(x.impact)+"；具体经营损失未经估计。"))
 ].join("");
}
function renderProjects(){
 const d=E.projects(state.data,state.projectDelay);
 $("#projectStats").innerHTML=[
  stat("项目样本",num(d.n),"不同发展阶段"),
  stat("演示项目投资",num(C.sum(d.byStage.map(x=>x.investment)))+"百万元","投资额≠GDP"),
  stat("计划岗位",num(C.sum(d.byStage.map(x=>x.jobs))),"合成需求，不是实际新增就业"),
  stat("仍未稳定运营",num(d.delayed),"项目状态仍需观察",true)
 ].join("");
 $("#projectFunnel").innerHTML=d.byStage.map(x=>'<div class="funnel-stage"><small>'+esc(x.label)+'</small><strong>'+num(x.n)+'</strong><span>'+num(x.investment)+'百万元</span></div>').join("");
 const yearMap=new Map();for(const p of d.schedule){const y=p.adjustedCommissionYear;yearMap.set(y,(yearMap.get(y)||0)+1);}
 $("#projectTimeline").innerHTML=svgBarChart([...yearMap].sort((a,b)=>a[0]-b[0]).map(([year,value])=>({label:String(year),value})),{aria:"分年份投产项目数量"});
 $("#projectSector").innerHTML=chartBars(d.bySector.map(x=>({name:labels[x.name]||x.name,value:x.sum})),{units:"百万元"});
 $("#projectTable").innerHTML=d.schedule.slice(0,50).map(x=>'<tr><td>'+esc(x.name||x.id)+'</td><td>'+esc(labels[x.sector]||x.sector)+'</td><td>'+esc(x.town)+'</td><td>'+esc(x.stage)+'</td><td>'+num(x.investment)+'百万元</td><td>'+x.adjustedCommissionYear+'</td></tr>').join("");
}
function renderLabor(){
 const d=E.workforce(state.data,$("#laborFilter").value);
 $("#laborStats").innerHTML=[
  stat("劳动者样本",num(d.n),"合成或未核实"),
  stat("平均月工资",num(d.meanWage)+"元","样本均值"),
  stat("平均通勤",num(d.meanCommute)+"分钟","样本均值"),
  stat("高技能错配评分占比",pct(d.skillGapHigh),"模拟主观评分 ≥4",true)
 ].join("");
 $("#laborHistogram").innerHTML=histogram(d.wageHistogram,"合成劳动者月工资分布",{units:"元"});
 $("#laborStructure").innerHTML=[
  insight("通勤范围","P10 "+num(d.commute.p10)+"分钟，P50 "+num(d.commute.p50)+"分钟，P90 "+num(d.commute.p90)+"分钟。"),
  insight("工资范围","P10 "+num(d.wage.p10)+"元，P50 "+num(d.wage.p50)+"元，P90 "+num(d.wage.p90)+"元。"),
  insight("发展与生活承载","扩大产业规模也应检查岗位结构、技能培训、住房、交通和公共服务。"),
  insight("样本研究局限","Demo不是代表性调查，不能推断博罗真实劳动者收入或通勤状况。")
 ].join("");
 $("#laborTowns").innerHTML=chartBars(d.byTown.map(x=>({name:x.name,value:x.count})),{units:"条记录"});
}
function renderSurvey(){
 const rows=state.data.tables.surveys;
 $("#surveyStats").innerHTML=[
  stat("企业问卷",num(rows.length),"合成或已导入未核实"),
  stat("测量构念","3组","SA / SU / OP"),
  stat("问卷指标","10题","均为1—7分"),
  stat("可匹配企业",num(rows.filter(x=>x.enterpriseId).length),"仍需检查主体关联",true)
 ].join("");
 const blocks=[["SA","专业服务可得性","服务商、技术和可使用程度"],["SU","专业服务实际使用","采购行为和服务使用"],["OP","企业经营表现","结果与经营差异"]];
 $("#surveyConstructs").innerHTML=blocks.map(([key,name,desc])=>{
  const inds=key==="SA"?4:3;
  const cols=Array.from({length:inds},(_,i)=>{const k=key+(i+1);return {name:k,value:C.mean(rows.map(x=>+x[k]||0))};});
  return '<div class="construct-box"><div class="h"><strong>'+esc(name)+'</strong><span>'+esc(desc)+'</span></div><div class="construct-bars">'+cols.map(x=>'<div class="construct-col"><label>'+x.name+' · '+dec(x.value,2)+'</label><div class="col-bar"><i style="height:'+dec(100*x.value/7,1)+'%"></i></div></div>').join("")+'</div></div>';
 }).join("");
 const subcounts=new Map();for(const r of rows)subcounts.set(r.subsector||"未分类",(subcounts.get(r.subsector||"未分类")||0)+1);
 $("#surveyDiagnostics").innerHTML=[
  insight("指标有效性","目前可以检查题目数值范围，正式研究仍需要信效度、区分效度与样本代表性判断。"),
  insight("行业样本分布",[...subcounts].slice(0,6).map(([k,v])=>k+" "+v).join("；")),
  insight("问卷适用边界","同一时间、同一被访者的主观评价可能存在共同方法偏差。需要客观经营指标补充验证。")
 ].join("");
 const ids=new Set(state.data.tables.enterprises.map(x=>x.id)),matches=rows.filter(x=>ids.has(x.enterpriseId)).length;
 $("#surveyLinkage").innerHTML='<div class="three-column">'+[
  {name:"企业ID匹配",value:num(matches),foot:"与产业主体表可以连接"},
  {name:"未匹配问卷",value:num(rows.length-matches),foot:"必须核对来源ID"},
  {name:"专业模型入口",value:"3 构念",foot:"程序PLS与SmartPLS外部对照"}
 ].map(x=>'<div class="three-card"><small>'+x.name+'</small><strong>'+x.value+'</strong><span>'+x.foot+'</span></div>').join("")+'</div>'+
 '<p class="fine-print">问卷数据可以揭示相关关系，但不能直接折算为县域GDP增加值或政策净效果。</p>';
}
function renderModels(){
 if(!state.model){
  $("#modelStats").innerHTML=[stat("程序模型","未运行","点击右上角开始"),stat("专业软件","待导入","使用真实SPSS/SmartPLS输出"),
   stat("样本量",num(state.data.tables.surveys.length),"当前问卷数据"),stat("对照状态","未验证","不能伪造专业结果")].join("");
  $("#modelPaths").innerHTML='<p class="fine-print">点击“运行全部程序模型”，计算探索性PLS路径、构念得分回归及Bootstrap置信区间。</p>';
  $("#measurementPanel").innerHTML="";
 }else{
  const m=state.model,paths=m.fit.paths;
  $("#modelStats").innerHTML=[stat("程序研究样本",num(m.n),"同一数据快照"),stat("Bootstrap",num(m.bootstrap-m.failed)+"/"+m.bootstrap,"有效重抽样"),
   stat("PLS迭代",num(m.fit.iterations),m.fit.converged?"达到收敛条件":"未达到预设收敛条件"),
   stat("专业软件",state.external?"已导入":"待导入","必须真实外部运行",true)].join("");
  $("#modelPaths").innerHTML=Object.keys(paths).map(k=>{
   const ci=m.ci[k];return '<div class="path-row"><div><b>'+esc(m.pathLabels[k])+'</b><small>'+(
    ci?"Bootstrap 95% ["+dec(ci.p025,3)+","+dec(ci.p975,3)+"]":"区间不可得")+'</small></div><strong>'+dec(paths[k],3)+'</strong></div>';
  }).join("");
  $("#measurementPanel").innerHTML='<div class="measure-table">'+Object.entries(m.fit.measure).map(([k,v])=>
   '<div class="measure-box"><small>'+k+' / Cronbach α</small><b>'+dec(v.alpha,3)+'</b><span>AVE '+dec(v.ave,3)+' · CR '+dec(v.cr,3)+'</span></div>').join("")+'</div>'+
   '<p class="fine-print">探索性Mode-A算法未经SmartPLS逐项等价验证。测量质量不等于因果识别；不能直接变成GDP贡献。</p>';
 }
 $("#modelComparison").innerHTML=state.external?buildComparison(state.model,state.external):
  insight("等待真实专业软件输出","请先下载当前数据分析包，在SPSS/SmartPLS中独立估计，再导入其实际结果。不能凭空生成第二条轨道。");
 $("#modelDiagnostics").innerHTML=[
  {name:"同数据快照",desc:"两条轨道必须使用相同样本、变量、缺失处理与数据指纹。"},
  {name:"同估计对象",desc:"PLS路径与构念得分回归不一定具有相同估计对象；不能仅比较系数大小。"},
  {name:"不把关联当因果",desc:"社会调查结果需现实经营记录、研究设计和后续追踪支持。"},
  {name:"样本代表性",desc:"便利样本不能直接外推为全县企业总体。"},
  {name:"时间与价格口径",desc:"微观统计关系不能直接换算2032增加值。"},
  {name:"未验证部分保留",desc:"软件版本、模型设定、置信区间和原始报告应进入档案。"}
 ].map(x=>'<div class="review-item"><strong>'+x.name+'</strong>'+x.desc+'</div>').join("");
}
function runModels(){
 const button=$("#runModels");button.disabled=true;status("正在估计程序模型...");
 setTimeout(()=>{try{state.model=E.models(state.data,{seed:319,bootstrap:80});renderModels();status("程序模型已完成 · SmartPLS对照待核对");toast("程序PLS与回归已计算，并保存测量质量及重抽样区间。");}
 catch(err){toast("模型无法估计："+err.message);status("模型数据缺失或不适用");}
 finally{button.disabled=false;}},15);
}
function buildComparison(m,external){
 if(!m)return insight("尚未完成程序估计","请先运行程序模型再对比");
 return '<div class="model-compare-header"><strong>'+esc(external.software)+' '+esc(external.software_version)+'</strong><p class="fine-print">外部结果已导入但尚未获等价性认证。以下差异只用于寻找问题。</p></div>'+
  Object.entries(m.fit.paths).map(([name,value])=>'<div class="path-row"><div><b>'+esc(m.pathLabels[name])+'</b><small>程序 '+dec(value,3)+' · 外部 '+dec(external.paths[name],3)+'</small></div><strong>Δ '+dec(value-external.paths[name],3)+'</strong></div>').join("");
}
function renderWind(){
 const sim=ensureScenario();
 $("#scenarioSelect").innerHTML=Object.entries(E.SCENARIOS).map(([key,v])=>'<option value="'+key+'" '+(key===state.scenario?"selected":"")+'>'+esc(v.name)+'</option>').join("");
 $("#windStats").innerHTML=[
  stat("2032总量P50",num(sim.totals.p50)+"亿","名义增加值条件模拟",true),
  stat("第三产业中位占比",pct(sim.sectors[2].share.p50),"1:5:4参考40%"),
  stat("2030达到1600亿",pct(sim.meet2030Reference),"模型内条件频率 · 非预测"),
  stat("2032接近参考线",pct(sim.nearTarget),"各产业占比误差≤1.5个百分点")
 ].join("");
 $("#windShares").innerHTML=shareCompare(sim);
 $("#windSectorResults").innerHTML=sim.sectors.map(x=>'<div class="three-card"><small>'+x.name+'</small><strong>'+num(x.p50)+'亿</strong><span>P10 '+num(x.p10)+' — P90 '+num(x.p90)+'</span></div>').join("");
 const calibration=sim.calibration;
 $("#windDataConditions").innerHTML=[
  insight("数据如何影响推演","当前快照中的企业经营代理指标、项目阶段、技能、调查和产业采购关系已经提取为辅助条件。它们经过有界的演示映射，而不是经过因果识别的GDP贡献。"),
  insight("当前数据辅助增速修正","第一产业 "+pct(calibration.annualRateDelta[0])+"，第二产业 "+pct(calibration.annualRateDelta[1])+"，第三产业 "+pct(calibration.annualRateDelta[2])+"（均为年增速百分点差）。"+(calibration.enteredDataModules.length?"已导入模块："+calibration.enteredDataModules.join("、"):"当前使用默认Demo，修正值相对于Demo参考为零。"))
 ].join("");
 $("#windTrajectory").innerHTML=timelineSvg(sim);
 $("#windHistogram").innerHTML=histogram(sim.histogram,"2032GDP条件分布",{units:"亿"});
 $("#windPercentiles").innerHTML=["p10","p50","p90"].map(k=>'<div class="three-card"><small>'+k.toUpperCase()+'</small><strong>'+num(sim.totals[k])+'亿</strong></div>').join("");
 $("#scenarioKnobs").innerHTML=Object.entries(E.KNOBS).map(([key,v])=>
  '<div class="knob-control"><label for="knob-'+key+'">'+esc(v.name)+'<output id="output-'+key+'">'+(state.knobs[key]??0)+'</output></label><input data-sim-knob="'+key+'" type="range" id="knob-'+key+'" min="'+v.range[0]+'" max="'+v.range[1]+'" step=".25" value="'+(state.knobs[key]??0)+'"></div>').join("");
 $("#windComparison").innerHTML=["A","B"].map(side=>{
  const snap=state.compare[side];
  return '<div class="comparison-card"><h4>实验'+side+' · '+(snap?esc(snap.scenario.name):"待保存")+'</h4>'+
    (snap?'<strong>'+num(snap.totals.p50)+'亿</strong><p>第三产业占比 '+pct(snap.sectors[2].share.p50)+'；2030条件频率 '+pct(snap.meet2030Reference)+'。数据ID '+esc(snap.meta.dataset_id)+'</p>':'<p>点击顶部“保存为'+side+'”，将当前情景固定到对照席位。</p>')+'</div>';
 }).join("")+
 (state.compare.A&&state.compare.B?'<p class="fine-print" style="grid-column:1/-1">同一2025数据基准下，B相比A的2032总量P50差 '+num(state.compare.B.totals.p50-state.compare.A.totals.p50)+'亿元。请检查两个情景的假设差异。</p>':"");
}
function stressOptions(){
 const knobs={...state.knobs};
 if($("#stressProjects").checked)knobs.project_delay=1;
 if($("#stressTalent").checked)knobs.talent_supply=-1;
 if($("#stressDemand").checked)knobs.external_demand=-1;
 if($("#stressServices").checked)knobs.service_capacity=-1;
 return knobs;
}
function renderStress(){
 const sim=ensureScenario();
 if(!state.stress)$("#stressOutcomes").innerHTML='<p class="fine-print">选择多个不利条件，点击“运行联合压力测试”，把结果与当前基线情景比较。</p>';
 else $("#stressOutcomes").innerHTML='<div class="stress-summary"><small>联合压力后的2032中位数</small><strong>'+num(state.stress.totals.p50)+'亿元</strong><small>相对当前情景 '+num(state.stress.totals.p50-sim.totals.p50)+'亿元 · 仅条件对照</small></div>'+
  '<div class="three-column" style="margin-top:10px">'+state.stress.sectors.map((x,i)=>'<div class="three-card"><small>'+x.name+'</small><strong>'+num(x.p50)+'</strong><span>比基线 '+num(x.p50-sim.sectors[i].p50)+'亿</span></div>').join("")+'</div>';
 if(!$("#sensitivityBars").dataset.ready){
  $("#sensitivityBars").innerHTML='<p class="fine-print">可计算七项发展条件对2032总量的P50差异。首次打开时自动运行。</p>'; 
  setTimeout(()=>{try{
   const items=E.sensitivity(state.data,{scenario:state.scenario,knobs:state.knobs});
   $("#sensitivityBars").innerHTML=chartBars(items.map(x=>({name:x.label,value:Math.abs(x.high-x.low)})),{units:"差异亿元"});
   $("#sensitivityBars").dataset.ready="1";
  }catch(err){$("#sensitivityBars").textContent="敏感性计算失败："+err.message;}},10);
 }
 $("#stressNarrative").innerHTML=[
  insight("条件叠加与非线性风险","项目延期、人才不足与外需下降可能同时出现。当前Demo以有界增长扰动说明如何比较，尚未估计现实传导关系。"),
  insight("哪条路值得红队挑战","如果结构目标只有在极乐观的服务业增速下成立，应优先核对服务采购、人才和实际经营能力。"),
  insight("不要把模型内频率当概率预测","需要历史校准、样本代表性、结构机制验证后才能讨论经验预测表现。")
 ].join("");
}
function renderBlindspots(){
 const gaps=E.blindspots(state.data,ensureScenario()),quality=state.quality;
 $("#blindStats").innerHTML=[
  stat("待核实问题",num(gaps.length),"自动生成的研究警示"),
  stat("高优先级",num(gaps.filter(x=>x.priority==="HIGH").length),"非政策风险等级"),
  stat("无效关系边",num(quality.missingEndpoints),"需要重新核对主体ID"),
  stat("当前数据模式",state.data.meta.mode,"混合数据不得伪称已核实")
 ].join("");
 $("#blindspotCards").innerHTML=gaps.map((item,i)=>
  '<div class="blind-card"><span class="priority">'+esc(item.priority)+' / '+esc(item.category)+' / '+String(i+1).padStart(2,"0")+'</span><h3>'+esc(item.title)+'</h3><p>'+esc(item.detail)+'</p><div class="next"><b>下一步核实：</b>'+esc(item.next)+'</div></div>').join("");
}
function renderStrategy(){
 const actions=E.actions(state.data,ensureScenario());
 $("#actionCards").innerHTML=actions.map((a,i)=>
  '<article class="action-card"><span class="rank">研究优先级 #'+(i+1)+' · '+esc(a.sector)+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.risk)+'</p>'+
  '<div class="evidence"><b>必要条件</b><p>'+esc(a.cost)+'</p><b>需要验证</b><p>'+esc(a.verification)+'</p></div><button class="button outline" type="button" data-action="'+esc(a.id)+'">把这个方向送进2032风洞 →</button></article>').join("");
 $("#actionTrace").innerHTML=[
  insight("研究排序不是政策优劣排名","优先级是Demo结构差距与方法限制下的研究提示，不代表真实效益或财务成本排序。"),
  insight("行动需要证据和工作约束","每个方向都应进一步调查可达客户、实际企业能力、用地资金、人才与项目兑现条件。"),
  insight("给桥，不替用户走","系统展示条件、风险和有待核实的机会；不自行替企业或部门作出决定。")
 ].join("");
}
function buildReport(){
 const data=state.data,sim=ensureScenario(),q=state.quality,gaps=E.blindspots(data,sim),model=state.model,net=E.network(data);
 return {
  data:{id:data.meta.dataset_id,mode:data.meta.mode,schema_version:data.meta.schema_version,count:q.counts,quality:q.status,evidence:data.evidence},
  scenario:{id:sim.meta.scenario,growth:sim.assumedAnnualRates,knobs:sim.knobs,seed:sim.meta.seed,trials:sim.meta.trials,calibration:sim.calibration},
  baseline:sim.baseline,results:{total:sim.totals,sectors:sim.sectors,nearTarget:sim.nearTarget,meet2030:sim.meet2030Reference},
  network:{nodes:net.nodes,edges:net.edges,invalid:net.invalid,types:net.byType},
  models:model?{pls:model.fit,regression:model.benchmark,confidence:model.ci,notes:model.notes}:null,
  external:state.external?{software:state.external.software,software_version:state.external.software_version,paths:state.external.paths}:null,
  data_gaps:q.flags,blindspots:gaps,
  caveats:["Demo合成数据和混合/未核实数据都不得称为博罗实际调查结论。",
    "三次产业必须按增加值口径核算；企业营收、采购金额和项目投资不可直接合计为GDP。",
    "程序探索模型尚未获得专业软件等价性认证，路径关系不构成因果或GDP贡献。",
    "未来结构是条件推演，不是确定预测；官方统计口径及授权需单独确认。"]
 };
}
function markdownReport(r){
 const g=r.results;
 let md='# 博罗2032 · 三次产业协同研究档案\n\n**数据版本：** '+r.data.id+' ｜ **模式：** '+r.data.mode+'\n\n';
 md+='> 研究声明：合成Demo和未经核实导入数据不构成真实博罗的企业调查、经济预测或政策效果。\n\n';
 md+='## 一、2025年宏观基准\n\n'+E.S.map((k,i)=>'- '+labels[k]+'：'+dec(r.baseline.values[i],2)+'亿元').join('\n')+
  '\n- GDP合计：'+dec(r.baseline.gdp,2)+'亿元\n\n';
 md+='## 二、2032情景结果\n\n- 情景：'+E.SCENARIOS[r.scenario.id].name+
  '\n- 总量P10/P50/P90：'+["p10","p50","p90"].map(k=>dec(g.total[k],2)).join(" / ")+'亿元\n';
 md+=g.sectors.map(x=>'- '+x.name+'中位数：'+dec(x.p50,2)+'亿元；P10–P90：'+dec(x.p10,2)+'–'+dec(x.p90,2)+'亿元；占比中位数：'+pct(x.share.p50)).join('\n');
 md+='\n- 接近1:5:4的模型内条件频率：'+pct(g.nearTarget)+'\n- 2030达到1600亿的模型内条件频率：'+pct(g.meet2030)+'\n\n';
 md+='## 三、数据辅助条件（演示规则，不是因果估计）\n\n'+E.S.map((k,i)=>'- '+labels[k]+'：年增长假设辅助修正 '+pct(r.scenario.calibration.annualRateDelta[i])).join('\n')+'\n\n';
 md+='## 三、数据质量及网络\n\n'+Object.entries(r.data.count).map(([k,n])=>'- '+k+'：'+n+'条').join('\n')+
  '\n- 产业网络有效边：'+r.network.edges+'；无效边：'+r.network.invalid+'\n\n';
 md+='## 四、模型结果\n\n'+(r.models?
  Object.entries(r.models.pls.paths).map(([k,v])=>'- '+k+'：探索性系数 '+dec(v,4)).join('\n'):
  '尚未运行程序路径模型。\n')+'\n\n';
 md+='## 五、需要继续核实\n\n'+r.blindspots.map((item,i)=>(i+1)+'. '+item.title+'：'+item.next).join('\n')+'\n\n';
 md+='## 六、科研与使用限制\n\n'+r.caveats.map(x=>'- '+x).join('\n')+'\n\n---\n';
 md+='实验随机种子：'+r.scenario.seed+'；轨迹数：'+r.scenario.trials+'。完整快照与参数请随报告一并导出，以便复现。\n';
 return md;
}
function renderReport(){
 const r=buildReport(),g=r.results;
 $("#reportContent").innerHTML='<div class="eyebrow">BOLUO 2032 / REPRODUCIBLE RESEARCH RECORD</div>'+
  '<h2>博罗2032三次产业协同研究报告</h2><p class="report-warning">数据模式 '+esc(r.data.mode)+'。合成企业、调查和关系不是现实博罗观测；2032结果是条件实验，不是政府正式预测。</p>'+
  '<h3>01 · 当前研究快照</h3><p><strong>'+esc(r.data.id)+'</strong> · 字段质量 '+esc(r.data.quality)+' · 当前情景 '+esc(E.SCENARIOS[r.scenario.id].name)+'</p>'+
  '<h3>02 · 基本盘与2032情景</h3><table><thead><tr><th>产业</th><th>2025基准（亿元）</th><th>2032 P50（亿元）</th><th>2032占比中位数</th></tr></thead><tbody>'+
  E.S.map((k,i)=>'<tr><td>'+labels[k]+'</td><td>'+num(r.baseline.values[i])+'</td><td>'+num(g.sectors[i].p50)+'</td><td>'+pct(g.sectors[i].share.p50)+'</td></tr>').join("")+'</tbody></table>'+
  '<p>2032 GDP P10/P50/P90：'+num(g.total.p10)+' / '+num(g.total.p50)+' / '+num(g.total.p90)+'亿元（条件分布）。</p>'+
  '<h3>03 · 真实数据替换状态</h3><p>'+Object.entries(r.data.count).map(([k,v])=>esc(tableLabels[k])+": "+num(v)).join("；")+'。</p>'+
  '<h3>04 · 程序模型及专业软件</h3><p>'+(r.models?'探索性PLS已运行；有效Bootstrap和路径结果可在研究模型区复核。':'尚未运行程序路径模型。')+
  (r.external?' 外部软件 '+esc(r.external.software)+' 结果已导入，但尚未确认方法等价。':' SPSS/SmartPLS实际分析尚待导入。')+'</p>'+
  '<h3>05 · 最需要进一步核实的问题</h3><ol>'+r.blindspots.slice(0,7).map(x=>'<li><strong>'+esc(x.title)+'</strong>：'+esc(x.next)+'</li>').join("")+'</ol>'+
  '<h3>06 · 使用边界</h3><ul>'+r.caveats.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
}
function download(filename,content,type="application/json"){
 const blob=content instanceof Blob?content:new Blob([content],{type});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportReport(){download("boluo-2032-research-report.md",markdownReport(buildReport()),"text/markdown;charset=utf-8");toast("已导出当前研究报告。");}
function exportRecord(){download("boluo-2032-reproducible-record.json",JSON.stringify({record:buildReport(),dataset:state.data},null,2));toast("已导出数据快照和可复现实验记录（本机文件）。");}
function exportProfessional(){
 if(!state.model)toast("建议先运行程序模型，再对照实际SPSS/SmartPLS结果。");
 const data=state.data,m=state.model;
 const files=Object.fromEntries(Object.entries(data.tables).map(([k,v])=>["data/"+k+".csv",C.encodeCSV(v)]));
 files["manifest.json"]=JSON.stringify({dataset_id:data.meta.dataset_id,mode:data.meta.mode,hash:C.identity(data),counts:state.quality.counts,provenance:data.evidence},null,2);
 files["model/constructs.json"]=JSON.stringify({SA:["SA1","SA2","SA3","SA4"],SU:["SU1","SU2","SU3"],OP:["OP1","OP2","OP3"],paths:["SA->SU","SA->OP","SU->OP"],source:"demo"},null,2);
 files["model/external_result_template.json"]=JSON.stringify({dataset_id:data.meta.dataset_id,data_fingerprint:C.identity(data),n:data.tables.surveys.length,software:"SmartPLS",software_version:"FILL_ME",method:"FILL_ME",paths:{"SA->SU":null,"SA->OP":null,"SU->OP":null},notes:"Only fill with actual software estimates. Different estimators may not be directly comparable."},null,2);
 files["computed/program_model.json"]=m?JSON.stringify(m,null,2):"{}\n";
 files["README.txt"]="BOLUO 2032 OPEN RESEARCH PACKAGE\nAll Demo companies, surveys and relations are synthetic.\nSPSS/SmartPLS use data/surveys.csv, model/constructs.json; run the actual software and retain configuration.\nReturn model/external_result_template.json filled with real estimated coefficients and software metadata. Imported figures are displayed for exploratory comparison only.\nDo not use composite/PLS path coefficients as GDP causal effects.\n";
 download("BOLUO_2032_"+data.meta.mode+"_professional_pack.zip",makeZip(files),"application/zip");
 toast("已导出专业分析包，包含数据、字典和外部结果模板。");
}
function makeZip(files){
 const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
 const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);return c>>>0;});
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
 const s16=(d,i,v)=>d.setUint16(i,v,true),s32=(d,i,v)=>d.setUint32(i,v>>>0,true);
 for(const [name,content] of Object.entries(files)){
  const filename=enc.encode(name),bytes=enc.encode(content),check=crc(bytes),local=new Uint8Array(30+filename.length);
  const l=new DataView(local.buffer);s32(l,0,0x04034b50);s16(l,4,20);s16(l,6,0x800);s32(l,14,check);s32(l,18,bytes.length);s32(l,22,bytes.length);s16(l,26,filename.length);local.set(filename,30);
  locals.push(local,bytes);
  const central=new Uint8Array(46+filename.length),d=new DataView(central.buffer);
  s32(d,0,0x02014b50);s16(d,4,20);s16(d,6,20);s16(d,8,0x800);s32(d,16,check);s32(d,20,bytes.length);s32(d,24,bytes.length);s16(d,28,filename.length);s32(d,42,offset);central.set(filename,46);
  centrals.push(central);offset+=local.length+bytes.length;
 }
 const end=new Uint8Array(22),d=new DataView(end.buffer);s32(d,0,0x06054b50);s16(d,8,centrals.length);s16(d,10,centrals.length);s32(d,12,centrals.reduce((n,a)=>n+a.length,0));s32(d,16,offset);
 return new Blob([...locals,...centrals,end],{type:"application/zip"});
}
async function importExternal(event){
 const file=event.target.files[0];if(!file)return;
 try{const o=JSON.parse(await file.text());
  if(o.dataset_id!==state.data.meta.dataset_id||o.data_fingerprint!==C.identity(state.data))throw Error("数据快照ID或指纹不匹配");
  if(o.n!==state.data.tables.surveys.length)throw Error("问卷样本量不一致");
  if(!o.software_version||o.software_version==="FILL_ME"||!o.method||o.method==="FILL_ME")throw Error("需要填写真实软件版本和估计方法");
  const keys=["SA->SU","SA->OP","SU->OP"];for(const k of keys)if(!Number.isFinite(o.paths?.[k]))throw Error("缺少真正估计的路径："+k);
  state.external=o;if(!state.model)runModels();else renderModels();toast("已导入外部专业软件结果；对照不是等价性认证。");
 }catch(err){toast("外部结果导入失败："+err.message);}finally{event.target.value="";}
}
function applyData(bundle){
 state.data=bundle;state.version++;state.model=null;state.external=null;state.net=null;state.stress=null;state.sim=null;state.compare={A:null,B:null};
 $("#sensitivityBars").dataset.ready="";
 renderGlobal();ensureScenario();renderCurrent();
}
async function stageData(){
 const file=$("#importFile").files[0];if(!file){toast("先选择CSV、Excel或JSON文件");return;}
 $("#importStart").disabled=true;$("#importMessage").textContent="正在读取本地文件，不上传服务器…";
 try{
  const parsed=await C.parseFile(file);
  if(parsed?.tables){
   state.staging={bundle:parsed,source:file.name};$("#mappingArea").hidden=true;
   $("#importMessage").textContent="检测到完整研究数据包。将核对六个数据模块，逐项标记未核验。";
  }else{
   const type=$("#importType").value,headers=Object.keys(parsed[0]),mapping=C.suggestMapping(type,headers);
   state.staging={rows:parsed,headers,type,source:file.name};
   const required=C.REQUIRED[type];
   $("#mappingArea").hidden=false;
   $("#mappingFields").innerHTML=required.map(key=>'<div class="mapping-field"><label for="field-'+key+'">'+esc(key)+'</label><select class="input" data-field="'+esc(key)+'" id="field-'+esc(key)+'"><option value="">（请选择文件列）</option>'+
    headers.map(h=>'<option value="'+esc(h)+'" '+(h===mapping[key]?"selected":"")+'>'+esc(h)+'</option>').join("")+'</select></div>').join("");
   $("#importMessage").textContent="读取到"+parsed.length+"条记录。核对字段映射，之后确认替换。";
  }
  $("#importConfirm").disabled=false;
 }catch(err){toast("文件预检查失败："+err.message);$("#importMessage").textContent=err.message;state.staging=null;$("#importConfirm").disabled=true;}
 finally{$("#importStart").disabled=false;}
}
function confirmImport(){
 const s=state.staging;if(!s){toast("请先读取数据文件");return;}
 try{
  let next=state.data;
  if(s.bundle){
   const provided=s.bundle.tables;if(!provided||typeof provided!=="object")throw Error("JSON数据包必须包含tables");
   for(const type of Object.keys(C.REQUIRED))if(provided[type]){
    next=C.replace(next,type,C.validateOne(type,provided[type]));
   }
  }else{
   const mapping=Object.fromEntries($$("#mappingFields [data-field]").map(x=>[x.dataset.field,x.value]));
   const missing=Object.entries(mapping).filter(([,v])=>!v).map(([k])=>k);
   if(missing.length)throw Error("必须映射字段："+missing.join(","));
   next=C.replace(next,s.type,C.applyMapping(s.rows,mapping));
  }
  applyData(next);$("#importMessage").textContent="导入成功："+state.data.meta.dataset_id+"。合成/未核验标识保持。";
  $("#importConfirm").disabled=true;$("#mappingArea").hidden=true;state.staging=null;toast("已建立新研究快照，全部关联模块将使用当前数据重新计算。");
 }catch(err){toast("导入未通过质量门："+err.message);$("#importMessage").textContent=err.message;}
}
function restoreDemo(){applyData(C.demo());toast("已恢复唯一完整Demo，导入的数据可通过此前导出的JSON重新载入。");}
function downloadTemplate(){
 const type=$("#importType").value;
 download("boluo2032-"+type+"-template.csv",C.encodeCSV(state.data.tables[type].slice(0,5)),"text/csv;charset=utf-8");
}
function exportSnapshot(){download("boluo2032-current-dataset.json",JSON.stringify(state.data,null,2));toast("已下载完整研究数据快照；文件应妥善保存。");}
function actionToWind(id){
 const proposed={ "act-service":{scenario:"service",knobs:{service_capacity:.75}},
  "act-industry":{scenario:"industrial",knobs:{manufacturing_upgrade:.75}},
  "act-agri":{scenario:"agriculture",knobs:{agricultural_upgrade:.75}},
  "act-talent":{scenario:"balanced",knobs:{talent_supply:.75}},
  "act-region":{scenario:"regional",knobs:{local_linkages:.75}}};
 const plan=proposed[id];if(!plan)return;
 state.scenario=plan.scenario;state.knobs={...plan.knobs};state.sim=null;navigate("wind");toast("已将行动方向变为可调节的情景假设，尚不是现实政策效果。");
}
function bind(){
 window.BoluoIndustryPage.bind();
 window.BoluoBasePage.bind();
 window.BoluoRelationsPage.bind();
 $("#mainNav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view);});
 $(".work-area").addEventListener("click",e=>{
  if(buttonGo(e))return;
  const focus=e.target.closest("[data-focus]");if(focus){state.missionFocus=focus.dataset.focus;renderMissionFocus();return;}
  const company=e.target.closest("[data-company]");if(company){state.selectedEnterprise=company.dataset.company;renderIndustry();return;}
  const town=e.target.closest("[data-town]");if(town){state.town=town.dataset.town;renderTowns();return;}
  const node=e.target.closest("[data-shocknode]");if(node){$("#shockNode").value=node.dataset.shocknode;runShock();return;}
  const action=e.target.closest("[data-action]");if(action){actionToWind(action.dataset.action);return;}
 });
 $("#openData").addEventListener("click",()=>navigate("data"));
 $("#openMobileNav").addEventListener("click",()=>{$("#sidebar").classList.toggle("open");$("#mobileBackdrop").hidden=!$("#sidebar").classList.contains("open");});
 $("#mobileBackdrop").addEventListener("click",()=>{$("#sidebar").classList.remove("open");$("#mobileBackdrop").hidden=true;});
 $("#industryFilter").addEventListener("change",renderIndustry);
 $("#townFilter").addEventListener("change",e=>{state.town=e.target.value;renderTowns();});
 $("#networkFilter").addEventListener("change",renderNetwork);
 $("#runNetworkShock").addEventListener("click",runShock);
 $("#shockStrength").addEventListener("input",e=>$("#shockStrengthText").textContent=pct(e.target.value));
 $("#projectDelay").addEventListener("input",e=>{state.projectDelay=+e.target.value;$("#projectDelayOutput").textContent=state.projectDelay+"年";renderProjects();});
 $("#laborFilter").addEventListener("change",renderLabor);
 $("#runModels").addEventListener("click",runModels);
 $("#scenarioSelect").addEventListener("change",e=>{state.scenario=e.target.value;runScenario();});
 $("#scenarioKnobs").addEventListener("input",e=>{if(!e.target.dataset.simKnob)return;const k=e.target.dataset.simKnob;state.knobs[k]=+e.target.value;$("#output-"+k).textContent=e.target.value;});
 $("#scenarioKnobs").addEventListener("change",e=>{if(e.target.dataset.simKnob)runScenario();});
 $("#runWind").addEventListener("click",runScenario);
 $("#pinScenarioA").addEventListener("click",()=>{state.compare.A=ensureScenario();renderWind();toast("当前情景已保存为实验A");});
 $("#pinScenarioB").addEventListener("click",()=>{state.compare.B=ensureScenario();renderWind();toast("当前情景已保存为实验B");});
 $("#runStress").addEventListener("click",()=>{
  try{state.stress=E.simulate(state.data,{scenario:state.scenario,knobs:stressOptions(),trials:2000,seed:2032});renderStress();toast("联合压力实验已重新计算。");}
  catch(err){toast("压力计算失败："+err.message);}
 });
 $("#downloadQuestionnaire").addEventListener("click",()=>download("boluo-survey-dictionary.json",JSON.stringify({SA:["SA1","SA2","SA3","SA4"],SU:["SU1","SU2","SU3"],OP:["OP1","OP2","OP3"],note:"Items are synthetic; validate before field deployment."},null,2)));
 $("#downloadSurveyCsv").addEventListener("click",()=>download("boluo-survey.csv",C.encodeCSV(state.data.tables.surveys),"text/csv;charset=utf-8"));
 $("#exportProfessional").addEventListener("click",exportProfessional);
 $("#externalModelFile").addEventListener("change",importExternal);
 $("#importStart").addEventListener("click",stageData);
 $("#importConfirm").addEventListener("click",confirmImport);
 $("#downloadTemplate").addEventListener("click",downloadTemplate);
 $("#downloadSnapshot").addEventListener("click",exportSnapshot);
 $("#restoreDemoTop").addEventListener("click",restoreDemo);
 $("#exportReport").addEventListener("click",exportReport);
 $("#exportRecord").addEventListener("click",exportRecord);
 $("#printReport").addEventListener("click",()=>window.print());
 window.addEventListener("hashchange",()=>{const page=location.hash.slice(1);if(page!==state.active)navigate(page);});
}
function start(){
 try{state.quality=E.quality(state.data);state.sim=E.simulate(state.data,{scenario:state.scenario,knobs:{},trials:2000,seed:2032});
  renderNav();bind();renderGlobal();navigate(location.hash.slice(1)||"mission");
 }catch(err){status("启动失败："+err.message);toast(err.message);console.error(err);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();