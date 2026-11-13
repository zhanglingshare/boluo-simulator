/* Boluo 2032 | 06 Agricultural value-chain laboratory.
 * Published statistics are displayed as provenance-labelled context.
 * All cashflow figures are reproducible WHAT-IF results, not forecasts.
 * In-browser datasets are read from the current studio state.
 */
(function(root){
"use strict";
const E=root.BoluoEngine,C=root.BoluoCore;
const STAGES=[
 {id:"grow",icon:"🌱",name:"田间采收",subtitle:"有产量 ≠ 有利润",
  title:"谁能在短季里把产品采出来？",
  desc:"种植面积和产量提供了产业底盘，但真正影响季节性收益的可能是劳动力、采摘窗口、鲜叶质量和天气。公开统计无法直接给出每日劳动力可用率。",
  verify:["春茶实际采摘天数和每日鲜叶量","实际采工数量、用工单价与缺工时段","茶农实得收购价和鲜叶分级"]},
 {id:"process",icon:"⚙",name:"分级加工",subtitle:"产量 ≠ 加工能力",
  title:"收得上来，还要加工得出去。",
  desc:"茶叶加工与成品分级决定产品形态；产业园设计产能并不等于当季有效产能或最终可售量。要区分鲜叶、干茶及加工转化率。",
  verify:["每日有效加工能力与设备利用率","鲜叶到干茶的转化率和损耗","分级率、加工费和实际订单"]},
 {id:"market",icon:"↗",name:"渠道销售",subtitle:"销售额 ≠ 本地留存",
  title:"卖出去了，收益留在谁手里？",
  desc:"渠道和消费者可能位于县外。销售额、旅游消费和农户收益不是同一个数字，必须识别收款主体、费用与利润分配。",
  verify:["渠道订单及客户所在地区","每级采购价、销售价和渠道成本","跨县销售、退货和库存变动"]},
 {id:"cash",icon:"◷",name:"付款回笼",subtitle:"收入 ≠ 现金到账",
  title:"账上有收入，现金可能还在路上。",
  desc:"茶农收款、加工方付款及渠道回款存在时间差。短季中峰值资金占用必须按每一批采摘和付款逐日计算，而不是简单乘以账期差。",
  verify:["采购款实际支付日与分批付款安排","订单签收及渠道回款日期","库存、融资利率与周转资金来源"]}
];
const QUESTION=[{
 id:"harvest",title:"季节性用工与损耗",heading:"最先核实的不是总产量，而是25天左右高峰能不能采完",
 who:"合作社、茶农、收购站和劳务组织",
 fields:["实际采摘窗口与日采摘量","高峰采工人数和缺工比例","天气导致的弃采与损耗","不同等级鲜叶的收购价"]
},{
 id:"processing",title:"加工转化与产品分级",heading:"加工能力不足，可能把鲜叶变成库存与品质风险",
 who:"加工企业、合作社及园区运营方",
 fields:["鲜叶/干茶换算口径","每日开机小时与有效加工量","加工损耗、等级占比与次品率","产线设计能力与实际订单差异"]
},{
 id:"channel",title:"渠道回款与占款",heading:"关键不是75天这个数字，而是哪一批茶、哪一天真正收到钱",
 who:"加工厂财务、茶商、电商渠道与采购商",
 fields:["分批付款与回款流水","采购/销售价与单位毛利","合同账期、预付款及退货条款","存货与银行授信成本"]
},{
 id:"local",title:"本地增加值与价值留存",heading:"先分清产值、增加值、销售收入与农户净收入",
 who:"农业农村部门、统计部门、龙头企业、合作社",
 fields:["茶叶产值核算边界","本地加工服务和渠道采购额","各主体工资、税费与利润","县外供应商和渠道比例"]
}];
const INIT={season:25,pick:85,process:90,farmPay:12,channelPay:75,dayCost:10};
let state=null,scope="county",stage="grow",kind="agricultural_processing",selectedQuestion="harvest",
 params={...INIT},bound=false;
const section=()=>document.querySelector('[data-page="agri"]');
const $=id=>section()?.querySelector("#"+id);
const safe=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const f=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const sum=x=>x.reduce((a,b)=>a+b,0);
const currentData=()=>state?.data;
const provenance=()=>{
 const t=currentData()?.evidence||{};
 const e=String(t.enterprises||""),r=String(t.relations||"");
 if(e.includes("IMPORTED_UNVERIFIED")&&r.includes("IMPORTED_UNVERIFIED"))return "导入企业及关系表 · 待核验";
 if(e.includes("IMPORTED_UNVERIFIED")||r.includes("IMPORTED_UNVERIFIED"))return "混合Demo/导入资料 · 待核验";
 return "默认合成Demo · 非真实交易";
};
const buttonActive=(selector,attribute,val)=>section()?.querySelectorAll(selector).forEach(b=>{
 const on=b.getAttribute(attribute)===val;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));
});
function renderFacts(){
 buttonActive("#ag-scope-switch button","data-ag-scope",scope);
 const county=[
  ["107.44亿元","2025第一产业增加值","地区生产总值的组成部分"],
  ["+7.8%","2025第一产业增加值增速","按不变价的同比增长"],
  ["36.03亿元","2026年一季度农林牧渔业总产值","总产值，不是GDP增加值"],
  ["+6.5%","2026年一季度农林牧渔业总产值增速","与2025全年增速不可直接相减"]
 ];
 const tea=[
  ["4.32万亩","柏塘山茶种植面积","2026年4月报道，约数"],
  ["2449吨","柏塘2025年茶叶产量","报道中的镇域全年产量"],
  ["约12亿元","柏塘2025年茶叶总产值","产值，不是增加值"],
  ["58家","当地茶企与合作社","报道中的行业主体数量"]
 ];
 $("ag-real-grid").innerHTML=(scope==="county"?county:tea).map(([value,name,foot])=>
 '<div class="ag-real-cell"><span>'+safe(name)+'</span><strong>'+safe(value)+'</strong><small>'+safe(foot)+'</small></div>').join("");
 $("ag-evidence-line").textContent=scope==="county"?
 "事实边界：全县第一产业增加值反映新创造的增加值；农林牧渔业总产值不是同一口径。2026一季度与2025全年时间范围不同。":
 "媒体报道：柏塘茶园面积约4.32万亩，2025产量2449吨、总产值约12亿元。不是正式核定的GDP增加值，也没有各环节利润与回款证据。柏塘是一个可观察的案例，不等于全县农业。";
}
function renderChain(){
 buttonActive("#ag-chain-tracks button","data-ag-stage",stage);
 $("ag-chain-tracks").innerHTML=STAGES.map((d,i)=>
  '<button type="button" data-ag-stage="'+d.id+'" class="'+(stage===d.id?"active":"")+'" aria-pressed="'+(stage===d.id)+'">'+
  '<i aria-hidden="true">'+d.icon+'</i><strong>'+d.name+'</strong><small>'+d.subtitle+'</small></button>').join("");
 const d=STAGES.find(s=>s.id===stage);
 $("ag-chain-detail").innerHTML='<span>STEP '+String(STAGES.indexOf(d)+1).padStart(2,"0")+' / WHAT TO VERIFY</span>'+
  '<h3>'+d.title+'</h3><p>'+d.desc+'</p><ul>'+d.verify.map(x=>'<li>'+safe(x)+'</li>').join("")+'</ul>';
}
function simulate(options){
 // Uniform harvest batches indexed 0..H-1; each day's modeled purchase value
 // is the adjusted daily baseline, debited at farmerPay and credited at channelPay.
 const p=options,day=p.dayCost*Math.min(p.pick,p.process)/100,
 horizon=p.season+Math.max(p.farmPay,p.channelPay)+1,path=[];
 let outstanding=0,peak=0,peakDay=0,positiveDays=0,centroid=0;
 for(let t=0;t<=horizon;t++){
  if(t>=p.farmPay&&t<p.farmPay+p.season)outstanding+=day;
  if(t>=p.channelPay&&t<p.channelPay+p.season)outstanding-=day;
  // Floating point correction near zero to avoid -0 on the SVG line.
  if(Math.abs(outstanding)<1e-9)outstanding=0;
  peak=Math.max(peak,outstanding);
  if(outstanding>=peak-1e-8&&outstanding>0&&peakDay===0)peakDay=t;
  if(outstanding>0)positiveDays++;
  centroid+=outstanding;
  path.push({day:t,amount:Math.max(0,outstanding)});
 }
 const fullValue=day*p.season;
 return {path,peak,peakDay,positiveDays,centroid,day,fullValue,
  window:p.season,delay:p.channelPay-p.farmPay,release:p.channelPay+p.season-1,
  effective:Math.min(p.pick,p.process),
  primaryBottleneck:p.pick<p.process?"采摘劳力":p.process<p.pick?"加工承接":"采摘与加工"};
}
function drawCash(result){
 const data=result.path, max=Math.max(1,result.peak),w=870,h=285,left=55,right=22,top=18,bottom=40;
 const x=t=>left+t/(data[data.length-1].day||1)*(w-left-right);
 const y=amount=>h-bottom-amount/max*(h-bottom-top);
 const points=data.map(d=>x(d.day).toFixed(2)+","+y(d.amount).toFixed(2)).join(" ");
 const fill=left+","+(h-bottom)+" "+points+" "+x(data[data.length-1].day)+","+(h-bottom);
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="逐日累计待回款资金：峰值'+f(result.peak,1)+'万元">';
 [0,.25,.5,.75,1].forEach(p=>{
  const yy=y(max*p);svg+='<line x1="'+left+'" x2="'+(w-right)+'" y1="'+yy+'" y2="'+yy+'" stroke="#ffffff20" stroke-dasharray="4 6"/>'+
  '<text x="'+(left-11)+'" y="'+(yy+4)+'" fill="#b2d1ca" text-anchor="end" font-size="11">'+f(max*p,0)+'</text>';
 });
 svg+='<text x="8" y="14" font-size="11" fill="#b2d1ca">万元</text>';
 for(let t=0;t<data.length;t+=Math.max(10,Math.round(data.length/5))){
  svg+='<text x="'+x(t)+'" y="'+(h-12)+'" text-anchor="middle" fill="#a3c4bd" font-size="11">'+t+'天</text>';
 }
 svg+='<polygon points="'+fill+'" fill="#66cdb1" fill-opacity=".13"/>'+
 '<polyline points="'+points+'" fill="none" stroke="#90e8c2" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+
 '<circle cx="'+x(result.peakDay)+'" cy="'+y(result.peak)+'" r="7" fill="#ffe0aa" stroke="#0f3440" stroke-width="2"/>'+
 '<text x="'+Math.min(w-100,Math.max(100,x(result.peakDay)))+'" y="'+Math.max(15,y(result.peak)-15)+'" text-anchor="middle" fill="#ffe0aa" font-weight="850" font-size="12">峰值 '+f(result.peak,1)+'万</text></svg>';
 $("ag-cash-chart").innerHTML=svg;
}
function renderCash(){
 const ids=[["season","season","天"],["pick","pick","%"],["process","process","%"],["farm-pay","farmPay","天"],["channel-pay","channelPay","天"],["day-cost","dayCost","万元"]];
 for(const [id,key,suffix]of ids){
  const ctl=$("ag-"+id),val=$("ag-"+id+"-v");if(ctl&&val){ctl.value=String(params[key]);val.textContent=params[key]+suffix;}
 }
 const r=simulate(params);
 $("ag-output-metrics").innerHTML=[
  ["逐批付款至回款间隔",r.delay+"天","不是资金缺口金额"],
  ["峰值占款示意",f(r.peak,1)+"万元","模拟金额，不是实际融资需求"],
  ["本季样本采购基线",f(r.fullValue,1)+"万元","仅覆盖简化的采摘/收购付款"]
 ].map(([title,value,foot],i)=>'<div><small>'+title+'</small><strong class="'+(i===1?"alert":"")+'">'+value+'</strong><small>'+foot+'</small></div>').join("");
 drawCash(r);
 const lower=Math.round(r.effective);
 $("ag-sim-finding").innerHTML='<strong>模型在第'+r.peakDay+'天触及约'+f(r.peak,1)+'万元的资金占用峰值。</strong>'+
 '<p>假设每天采购付款基准'+params.dayCost+'万元，受'+r.primaryBottleneck+'约束后有效比例'+lower+'%，每日对应'+f(r.day,2)+'万元。'+
 '采摘窗口'+params.season+'天，每批货款在采摘后'+params.farmPay+'天支付、'+params.channelPay+'天收回；所有批次最迟在第'+r.release+'天回笼。'+
 '这是逐日资金流水的条件演示，没有对真实茶农收入、现金缺口和政策绩效作估计。</p>';
 return r;
}
function networkAggregate(){
 const data=currentData();const nodes=data?.tables?.enterprises||[],raw=data?.tables?.relations||[];
 const ids=new Map(nodes.map(x=>[String(x.id),x]));
 const valid=raw.filter(x=>x.type===kind&&Number(x.value)>0&&ids.has(String(x.source))&&ids.has(String(x.target)))
  .filter(x=>ids.get(String(x.source)).sector==="primary"&&ids.get(String(x.target)).sector===(kind==="agricultural_processing"?"secondary":"tertiary"));
 const sums=new Map();
 for(const edge of valid){
  const src=ids.get(String(edge.source)),dst=ids.get(String(edge.target));
  const label=String(src.subsector||"未分类")+" → "+String(dst.subsector||"未分类");
  const entry=sums.get(label)||{label,weight:0,count:0};
  entry.weight+=Number(edge.value);entry.count++;sums.set(label,entry);
 }
 return {valid,groups:[...sums.values()].sort((a,b)=>b.count-a.count).slice(0,6),
  sources:new Set(valid.map(x=>String(x.source))).size,
  targets:new Set(valid.map(x=>String(x.target))).size};
}
function renderNetwork(){
 buttonActive("#ag-link-selector button","data-ag-kind",kind);
 const a=networkAggregate();
 const stats=[["有效关系记录",a.valid.length+"条"],["关联农业样本主体",a.sources+"个"],["关联目标样本主体",a.targets+"个"]];
 $("ag-network-stats").innerHTML=stats.map(([label,value])=>
 '<div><small>'+label+'</small><strong>'+value+'</strong></div>').join("");
 const max=Math.max(1,...a.groups.map(x=>x.count));
 $("ag-network-chart").innerHTML=a.groups.length?a.groups.map(x=>
 '<div class="ag-network-row"><span title="'+safe(x.label)+'">'+safe(x.label)+'</span>'+
 '<div class="ag-network-meter"><i style="width:'+(100*x.count/max).toFixed(1)+'%"></i></div><b>'+x.count+'条</b></div>').join(""):
 '<div style="padding:24px;text-align:center;color:#7895a0;font-size:12px">当前样本没有匹配的有向农业关系。请检查数据分类与来源。</div>';
 $("ag-network-caveat").textContent="数据性质："+provenance()+"。此图仅覆盖当前数据表中关系类型为"+
  (kind==="agricultural_processing"?"农业加工":"农业流通")+"的有效主体ID记录。未记录的连接不等于实际不存在；这不是柏塘山茶的真实采购网络。";
}
function renderQuestions(){
 buttonActive("#ag-questions button","data-ag-question",selectedQuestion);
 $("ag-questions").innerHTML=QUESTION.map(x=>
  '<button type="button" class="'+(x.id===selectedQuestion?"active":"")+'" data-ag-question="'+x.id+'" aria-pressed="'+(x.id===selectedQuestion)+'">'+x.title+' →</button>').join("");
 const item=QUESTION.find(x=>x.id===selectedQuestion)||QUESTION[0];
 $("ag-questions-detail").innerHTML='<h3>'+item.heading+'</h3><p>建议向 '+item.who+' 核验：</p>'+
 '<ul>'+item.fields.map(x=>'<li>'+x+'</li>').join("")+'</ul>'+
 '<button type="button" id="ag-export-questions">导出这张核验清单 JSON ↓</button>'+
 '<p>这份清单只是研究建议。待客户指出差异后仍须核实来源、时间、统计对象与数据授权，不能仅凭口头反馈变成A级。</p>';
}
function exportJSON(filename,body){
 const blob=new Blob([JSON.stringify(body,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportExperiment(){
 const r=simulate(params);
 exportJSON("boluo-agriculture-cashflow-demo.json",{
  schema:"BOLUO_AGRI_CASHFLOW_V1",createdAt:new Date().toISOString(),evidence:"DEMONSTRATION_ASSUMPTIONS_NOT_VERIFIED",
  case:"Baitang tea harvest seasonal cashflow thought experiment",scope:scope,assumptions:params,
  units:{dayCost:"ten thousand CNY/day, before effective constraints",peak:"ten thousand CNY",flow:"ten thousand CNY"},
  results:{peak:r.peak,peakDay:r.peakDay,delay:r.delay,totalExamplePurchases:r.fullValue,
   effectiveCapacityPercent:r.effective,days:r.path.length-1,flow:r.path},
  caveat:"Demonstration-only. No verified actual price, staffing, financing, output, profits, GDP or policy effect."
 });
}
function exportQuestion(){
 const item=QUESTION.find(x=>x.id===selectedQuestion)||QUESTION[0];
 exportJSON("boluo-agriculture-verification-"+selectedQuestion+".json",{
  schema:"BOLUO_AGRI_EVIDENCE_TASK_V1",createdAt:new Date().toISOString(),
  subject:item.heading,peopleToVerify:item.who,fields:item.fields,
  state:"PENDING_VERIFICATION",grade:"NOT_ASSIGNED",sourceDataStatus:provenance(),
  note:"Requested data/feedback does not automatically qualify for grade A."
 });
}
function render(st){
 if(!section())return;
 const changed=state?.data!==st?.data;state=st;
 renderFacts();renderChain();renderCash();renderNetwork();renderQuestions();
 if(changed)$("ag-network-caveat").dataset.datasetChanged="true";
}
function bind(){
 if(bound||!section())return;
 section().addEventListener("click",e=>{
  const scopeButton=e.target.closest("[data-ag-scope]");
  if(scopeButton){scope=scopeButton.dataset.agScope;renderFacts();return;}
  const st=e.target.closest("[data-ag-stage]");
  if(st){stage=st.dataset.agStage;renderChain();return;}
  const kindButton=e.target.closest("[data-ag-kind]");
  if(kindButton){kind=kindButton.dataset.agKind;renderNetwork();return;}
  const question=e.target.closest("[data-ag-question]");
  if(question){selectedQuestion=question.dataset.agQuestion;renderQuestions();return;}
  if(e.target.closest("#ag-reset")){params={...INIT};renderCash();return;}
  if(e.target.closest("#ag-export")){exportExperiment();return;}
  if(e.target.closest("#ag-export-questions")){exportQuestion();}
 });
 const names={"ag-season":"season","ag-pick":"pick","ag-process":"process",
  "ag-farm-pay":"farmPay","ag-channel-pay":"channelPay","ag-day-cost":"dayCost"};
 for(const [id,key]of Object.entries(names))$(id).addEventListener("input",e=>{
  params[key]=Number(e.target.value);renderCash();
 });
 bound=true;
}
root.BoluoAgriculturePage={render,bind,simulate};
})(window);
