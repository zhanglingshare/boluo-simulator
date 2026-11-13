/* Boluo 2032 | 05 Productive services & evidence-driven bridge
 * Uses real 2025/2026 statistical signals only for background context.
 * The relation matrix and scenario use the current user data tables, NEVER infer county-wide gaps.
 * No network requests; user feedback is in-memory only, locally exportable.
 */
(function(root){
"use strict";
const E=root.BoluoEngine,C=root.BoluoCore;
const SIGNALS=[
 {id:"all",name:"第三产业整体",growth:1.2,scope:"第三产业增加值",question:"第三产业整体仅增长1.2%，不能推断各类生产性服务都在减速。"},
 {id:"transport",name:"交通运输、仓储、邮政",growth:7.7,scope:"交通运输、仓储和邮政业增加值",question:"交通运输增长快于整体第三产业，但服务的是县内工厂还是跨区域市场？公开增速无法回答。"},
 {id:"business",name:"租赁和商务服务",growth:5.5,scope:"租赁和商务服务业增加值",question:"商务服务增长不等于制造企业采购了更多本地专业服务。需要客户来源和服务内容。"},
 {id:"second",name:"第二产业整体",growth:5.4,scope:"第二产业增加值，含工业与建筑业",question:"产业增长可以带动服务需求，但两项增速不能直接建立因果。"},
 {id:"first",name:"第一产业整体",growth:6.2,scope:"第一产业增加值",question:"农业增长是否带动加工、冷链、流通和专业服务，尚需真实采购与收益数据。"}
];
const CASES={
 secondary:{title:"工业 → 生产性服务",code:"professional_service",from:"secondary",question:"工业企业究竟向哪些本地服务机构采购？",subtitle:"工业样本连接服务样本"},
 primary:{title:"农业 → 服务与流通",code:"agricultural_distribution",from:"primary",question:"农业流通与服务之间的采购方向、合同、销售回款是否可以核实？",subtitle:"农业样本连接服务样本"}
};
let appState=null,sourceData=null,graph=null,origin="secondary",weightMode="all",shownEdges=[],currentSignal="all",rows=[],cols=[],cells=[],focused=null,
 scenarioDemand=20,scenarioResponse=10,lastScenario=false,feedbackChoice=null,feedback=[],bound=false;
const section=()=>document.querySelector('[data-page="service"]');
const q=id=>section()?.querySelector("#"+id);
const safe=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const f0=n=>Number(n).toLocaleString("zh-CN",{maximumFractionDigits:0});
const money=n=>fmt(n,2)+" 百万元";
const sum=a=>a.reduce((a,b)=>a+Number(b||0),0);
const evidence=()=>{
 const data=sourceData,enterprise=data?.evidence?.enterprises||"",relations=data?.evidence?.relations||"";
 const imported=k=>String(k).includes("IMPORTED_UNVERIFIED");
 return imported(enterprise)&&imported(relations)?"客户导入双表 · 均待核验":
  imported(enterprise)||imported(relations)?"混合Demo与导入数据 · 待核验":"合成Demo · 非真实交易";
};
function setButtons(sel,attr,value){
 section()?.querySelectorAll(sel).forEach(b=>{
  const active=b.getAttribute(attr)===value;b.classList.toggle("active",active);
  b.setAttribute("aria-pressed",String(active));
 });
}
function buildCells(){
 if(!graph)return;
 const mode=CASES[origin],available=graph.graph.edges.filter(e=>
  e.a.sector===mode.from&&e.b.sector==="tertiary"&&e.type===mode.code&&Number(e.value)>0);
 const fraction=weightMode==="top10"?.10:weightMode==="top25"?.25:1;
 const valid=fraction===1?available:available.slice().sort((a,b)=>b.value-a.value)
  .slice(0,Math.max(1,Math.ceil(available.length*fraction)));
 shownEdges=valid;
 const src=sourceData.tables.enterprises.filter(e=>e.sector===mode.from),
       dst=sourceData.tables.enterprises.filter(e=>e.sector==="tertiary");
 const makeNames=a=>[...new Set(a.map(x=>String(x.subsector||"未分类")))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
 const allRows=makeNames(src),allCols=makeNames(dst);
 const sums=new Map();
 for(const e of valid){
  const k=String(e.a.subsector||"未分类")+"||"+String(e.b.subsector||"未分类");
  if(!sums.has(k))sums.set(k,{value:0,count:0,buyers:new Set(),providers:new Set()});
  const o=sums.get(k);o.value+=e.value;o.count++;o.buyers.add(String(e.source));o.providers.add(String(e.target));
 }
 // Limit the rendered sample matrix, but never imply omitted categories are nonexistent.
 const rowRank=n=>sum([...sums].filter(([k])=>k.startsWith(n+"||")).map(([,v])=>v.value));
 const colRank=n=>sum([...sums].filter(([k])=>k.endsWith("||"+n)).map(([,v])=>v.value));
 rows=allRows.sort((a,b)=>rowRank(b)-rowRank(a)||a.localeCompare(b,"zh-CN")).slice(0,8);
 cols=allCols.sort((a,b)=>colRank(b)-colRank(a)||a.localeCompare(b,"zh-CN")).slice(0,8);
 cells=rows.flatMap((r,ri)=>cols.map((c,ci)=>{
  const entry=sums.get(r+"||"+c)||{value:0,count:0,buyers:new Set(),providers:new Set()};
  return {...entry,row:r,col:c,ri,ci,key:r+"||"+c};
 }));
 if(!focused||!cells.some(x=>x.key===focused)){
  const first=cells.filter(x=>x.count>0).sort((a,b)=>b.value-a.value)[0]||cells[0]||null;
  focused=first?.key||null;
 }
 return {valid,allRows,allCols,sourceCount:src.length,targetCount:dst.length};
}
function activePair(){return cells.find(x=>x.key===focused)||cells[0]||null;}
function renderSignal(){
 const max=Math.max(...SIGNALS.map(x=>x.growth));
 q("svc-signal-bars").innerHTML=SIGNALS.map(x=>
  '<button type="button" data-svc-signal="'+x.id+'" class="'+(currentSignal===x.id?"active":"")+'" aria-pressed="'+(x.id===currentSignal)+'">'+
  '<span class="svc-signal-label">'+safe(x.name)+'</span><strong>+'+fmt(x.growth,1)+'%</strong>'+
  '<span class="svc-mini-meter"><i style="width:'+fmt(x.growth/max*100,1)+'%"></i></span></button>'
 ).join("");
 const d=SIGNALS.find(x=>x.id===currentSignal)||SIGNALS[0];
 q("svc-signal-explain").innerHTML='<div><strong>'+safe(d.scope)+'</strong><p>'+safe(d.question)+'</p></div>'+
 '<span>统计时段：2026年1—9月<br>指标类型：实际增加值同比增速<br>数据性质：公开转录，正式研究前复核原始公报</span>';
}
function renderMatrix(){
 const p=buildCells(),rowN=rows.length,colN=cols.length;
 q("svc-sample-badge").textContent=evidence();
 setButtons("#svc-sector-switch button","data-svc-origin",origin);
 setButtons("#svc-weight-filter button","data-svc-weight",weightMode);
 if(rowN===0||colN===0){
  q("svc-matrix-hint").textContent="当前数据缺少可对照的产业和服务行业分类。没有记录不能解释为零市场需求。";
  q("svc-matrix").innerHTML='<div style="padding:36px;text-align:center;color:#7793a0">当前数据没有相应产业或服务主体分类，无法生成关系矩阵。</div>';
  q("svc-matrix").style.gridTemplateColumns="1fr";
  q("svc-pair-detail").innerHTML='<div class="svc-detail-overline">DATA MISSING</div><h3>这不是零需求，是数据尚未齐全。</h3><p>可以在数据中心导入企业主体与关系表，核对ID和业务关系类型，再回来重新计算。</p>';
  q("svc-sample-strip").innerHTML="";
  q("svc-feedback-topic").textContent="当前缺少可核验的产业关系";
  q("svc-sim-run").disabled=true;lastScenario=false;resetScenario(true);
  return;
 }
 q("svc-matrix").style.gridTemplateColumns='118px repeat('+colN+',minmax(57px,1fr))';
 const max=Math.max(1,...cells.map(x=>x.count));
 let html='<div class="svc-matrix-top"><div class="svc-matrix-axis header">需求方 ↓ / 服务 →</div>'+
  cols.map(c=>'<div class="svc-matrix-axis header">'+safe(c)+'</div>').join("")+'</div>';
 for(let ri=0;ri<rowN;ri++){
  html+='<div class="svc-matrix-row"><div class="svc-matrix-axis row">'+safe(rows[ri])+'</div>';
  for(let ci=0;ci<colN;ci++){
   const cell=cells.find(x=>x.ri===ri&&x.ci===ci);
   const ratio=cell.count/max;
   const level=cell.count===0?0:ratio<.28?1:ratio<.56?2:ratio<.85?3:4;
   html+='<button type="button" class="svc-matrix-cell '+(focused===cell.key?"active":"")+
   '" data-svc-cell="'+ri+'-'+ci+'" data-level="'+level+
   '" role="gridcell" aria-selected="'+(focused===cell.key)+'" aria-label="'+safe(rows[ri]+"与"+cols[ci]+
   "，样本有效关系"+cell.count+"条")+'"><strong>'+ (cell.count||"·")+'</strong></button>';
  }
  html+='</div>';
 }
 q("svc-matrix").innerHTML=html;
 q("svc-matrix").setAttribute("aria-label",(origin==="secondary"?"工业":"农业")+"细分行业与服务业的演示关系矩阵");
 renderPairDetail();
 const valid=p.valid;
 const uniqueBuyers=new Set(valid.map(x=>String(x.source))).size;
 const uniqueServiceProviders=new Set(valid.map(x=>String(x.target))).size;
 const total=valid.reduce((s,x)=>s+x.value,0);
 q("svc-sample-strip").innerHTML=[
  ["可匹配样本关系",f0(valid.length)+"条","具有有效主体ID与指定关系类型"],
  ["样本需求方",f0(uniqueBuyers)+"个","至少出现一条样本关系"],
  ["样本服务方",f0(uniqueServiceProviders)+"个","至少出现一条样本关系"],
  ["关系权重合计",money(total),"演示交易权重，不是地区增加值"]
 ].map(([title,value,foot])=>'<div><small>'+safe(title)+'</small><strong>'+safe(value)+'</strong><span>'+safe(foot)+'</span></div>').join("");
 q("svc-matrix-hint").textContent="横轴为服务细分行业，纵轴为需求方细分行业。颜色仅对应已匹配的样本关系条数。"+
 (weightMode==="all"?"当前显示全部符合类型的样本关系。":"当前只显示按关系权重排序的"+
 (weightMode==="top25"?"前25%":"前10%")+"条记录；空格可能是筛选造成，并不代表没有交易。")+
 (p.allRows.length>rows.length||p.allCols.length>cols.length?
  " 另因类别过多，只展示权重较高的前"+rows.length+"类需求和前"+cols.length+"类服务；其他类别未展示。":
  "");
 q("svc-sim-origin").textContent=CASES[origin].title+" · "+(weightMode==="all"?"全部关系":weightMode==="top25"?"权重前25%":"权重前10%")+" · "+evidence();
 q("svc-sim-run").disabled=total<=0;
 q("svc-feedback-topic").textContent=activePair()?activePair().row+" → "+activePair().col:"当前数据缺少关系类型";
}
function renderPairDetail(){
 const d=activePair();
 if(!d){q("svc-pair-detail").innerHTML='<div><span class="svc-detail-overline">NO MATCHED PAIR</span><h3>暂无可展示的细分行业组合。</h3></div>';return;}
 const state=d.count>0?"已观察到演示样本连接":"当前样本未见连接";
 q("svc-pair-detail").innerHTML='<div><span class="svc-detail-overline">SELECTED PAIR / '+safe(evidence())+'</span>'+
 '<h3>'+safe(d.row)+'<br>↘ '+safe(d.col)+'</h3>'+
 '<p>'+state+'。关系来自本地当前数据表，只用于提出问题，不证明真实交易范围。</p>'+
 '<div class="svc-detail-stats"><div><small>样本关系条数</small><strong>'+f0(d.count)+'条</strong></div>'+
 '<div><small>合成/待核验权重</small><strong>'+fmt(d.value,2)+'</strong></div>'+
 '<div><small>关联需求主体</small><strong>'+f0(d.buyers.size)+'个</strong></div>'+
 '<div><small>关联服务主体</small><strong>'+f0(d.providers.size)+'个</strong></div></div></div>'+
 '<div class="svc-detail-warning"><strong>真正该核实的事</strong>'+
 (d.count>0?"合同与支付是否真实？服务商在哪？同一服务能否由县内其他主体承接？":"空格仅代表当前样本没有记录。是没有采购、没采集、没覆盖县外服务商，还是分类口径不同？")+
 '</div>';
 q("svc-feedback-topic").textContent=d.row+" → "+d.col;
}
function resetScenario(clear){
 lastScenario=false;
 q("svc-sim-result").innerHTML='<div class="svc-sim-welcome">'+(clear?"当前样本缺少可用关系，不能运行演示。":"调整条件，然后运行。")+
 '<small>这只是基于当前关系权重的条件对照，不会自动产生经济预测。</small></div>';
}
function renderScenario(){
 // The scenario must use the SAME filtered record set as the visible matrix.
 const base=sum(shownEdges.map(e=>e.value));
 const demand=base*(1+scenarioDemand/100),capacity=base*(1+scenarioResponse/100),gap=Math.max(0,demand-capacity);
 if(base<=0){resetScenario(true);return;}
 const ratio=gap/demand*100,top=Math.max(1,demand,capacity),isGap=gap>0.000001;
 q("svc-sim-result").innerHTML='<div class="svc-sim-result-head"><span>WHAT-IF / RULE-BASED DEMO</span>'+
 '<strong>'+(isGap?"出现条件性未承接差额":"假设承接量可以覆盖需求")+'</strong></div>'+
 '<div class="svc-sim-metrics"><div><small>样本原关系权重</small><strong>'+fmt(base,1)+'</strong></div>'+
 '<div><small>条件性差额</small><strong class="'+(isGap?"warn":"")+'">'+fmt(gap,1)+'</strong></div>'+
 '<div><small>差额占假设需求</small><strong class="'+(isGap?"warn":"")+'">'+fmt(ratio,1)+'%</strong></div></div>'+
 '<div class="svc-sim-bar-row"><div><span>需求情景（基线 × '+fmt(1+scenarioDemand/100,2)+'）</span><b>'+fmt(demand,2)+'</b></div>'+
 '<div class="svc-sim-track"><i class="demand" style="width:'+fmt(demand/top*100,1)+'%"></i></div></div>'+
 '<div class="svc-sim-bar-row"><div><span>承接情景（基线 × '+fmt(1+scenarioResponse/100,2)+'）</span><b>'+fmt(capacity,2)+'</b></div>'+
 '<div class="svc-sim-track"><i class="capacity" style="width:'+fmt(capacity/top*100,1)+'%"></i></div></div>'+
 '<div class="svc-sim-note">单位：当前数据集关系权重（契约约定为百万元），不是地区真实供需总量。基线是已记录交易而非经过验证的服务产能；差额只在该人工假设下成立。<b>不能将 '+fmt(gap,1)+' 解释成“博罗缺少这么多服务业增加值”。</b></div>';
 lastScenario=true;
}
function changeOrigin(v){
 origin=v;focused=null;feedbackChoice=null;
 setButtons("#svc-feedback-choices button","data-svc-feedback","NOTHING_SELECTED");
 resetScenario();renderMatrix();
}
function feedbackSummary(){
 q("svc-feedback-count").textContent=feedback.length+" 条本地反馈";
 q("svc-feedback-export").disabled=!feedback.length;
}
function saveFeedback(){
 const pair=activePair();
 if(!pair||!feedbackChoice){q("svc-feedback-status").textContent="请先选一个关系格子，再选择反馈意见。";return;}
 const obj={
  type:"RELATION_EVIDENCE_REVIEW",state:"PENDING_VERIFICATION",
  dataset_fingerprint:C.identity(sourceData),dataset_version:String(sourceData.meta?.dataset_id||""),
  observed_at:new Date().toISOString(),category:origin,from_subsector:pair.row,to_service_subsector:pair.col,
  observed_demo_records:pair.count,selection:feedbackChoice,
  verification_grade:"NOT_ASSIGNED",source_note:evidence(),
  reminder:"该反馈不是A级数据，未完成来源及授权核验。"
 };
 feedback.push(obj);feedbackSummary();
 q("svc-feedback-status").textContent="已记入待核验清单。当前会话已保存 "+feedback.length+" 条，仅存在本地内存，不会自动升级证据等级。";
}
function exportFeedback(){
 if(!feedback.length)return;
 const body=JSON.stringify({schema:"BOLUO_SERVICE_REVIEW_V1",created:new Date().toISOString(),entries:feedback},null,2);
 const blob=new Blob([body],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob);
 const link=document.createElement("a");link.href=url;link.download="boluo-service-review.json";document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),600);
}
function render(state){
 if(!section())return;
 appState=state;const changed=sourceData!==state.data;sourceData=state.data;
 if(changed){graph=E.network(sourceData,"all");focused=null;lastScenario=false;feedbackChoice=null;resetScenario();}
 renderSignal();renderMatrix();feedbackSummary();
}
function bind(){
 if(bound||!section())return;
 section().addEventListener("click",event=>{
  const signal=event.target.closest("[data-svc-signal]");
  if(signal){currentSignal=signal.dataset.svcSignal;renderSignal();return;}
  const source=event.target.closest("[data-svc-origin]");
  if(source){changeOrigin(source.dataset.svcOrigin);return;}
  const weight=event.target.closest("[data-svc-weight]");
  if(weight){weightMode=weight.dataset.svcWeight;focused=null;feedbackChoice=null;
   resetScenario();renderMatrix();setButtons("#svc-feedback-choices button","data-svc-feedback","none");return;}
  const cell=event.target.closest("[data-svc-cell]");
  if(cell){const [ri,ci]=cell.dataset.svcCell.split("-").map(Number);const item=cells.find(x=>x.ri===ri&&x.ci===ci);
   if(item){focused=item.key;feedbackChoice=null;
    setButtons("#svc-feedback-choices button","data-svc-feedback","none");
    renderMatrix();q("svc-feedback-status").textContent="已切换待核实关系；尚未提交反馈。";}return;}
  const choice=event.target.closest("[data-svc-feedback]");
  if(choice){feedbackChoice=choice.dataset.svcFeedback;setButtons("#svc-feedback-choices button","data-svc-feedback",feedbackChoice);return;}
  if(event.target.closest("#svc-sim-run")){renderScenario();return;}
  if(event.target.closest("#svc-sim-reset")){scenarioDemand=20;scenarioResponse=10;q("svc-demand").value="20";q("svc-response").value="10";
   q("svc-demand-value").textContent="+20%";q("svc-response-value").textContent="+10%";resetScenario();return;}
  if(event.target.closest("#svc-feedback-save")){saveFeedback();return;}
  if(event.target.closest("#svc-feedback-export")){exportFeedback();return;}
 });
 for(const [id,key]of [["svc-demand","scenarioDemand"],["svc-response","scenarioResponse"]]){
  q(id).addEventListener("input",event=>{
   const num=Number(event.target.value);
   if(key==="scenarioDemand"){scenarioDemand=num;q("svc-demand-value").textContent="+"+num+"%";}
   else {scenarioResponse=num;q("svc-response-value").textContent="+"+num+"%";}
   if(lastScenario)renderScenario();
  });
 }
 bound=true;
}
root.BoluoServicePage={render,bind};
})(window);
