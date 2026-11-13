/* 07 Project conversion and arrival-year comparison.
 * All project rows derive from the current studio dataset, NOT public project counts.
 * Scenario moves scheduled commissioning years only, without any GDP conversion.
 */
(function(root){
"use strict";
const E=root.BoluoEngine,C=root.BoluoCore;
const S=[
 {id:"signed",name:"已签约",prompt:"签约不代表已完成土地、环评、融资或实际开工。",
  checks:["核验合同及项目主体","核实用地、环评与能评进度","确认融资和正式开工条件"]},
 {id:"construction",name:"建设中",prompt:"施工进度与实际投资完成额不等于投产，更不等于稳定增加值。",
  checks:["实地核验土建与设备安装节点","核实投资完成额口径及有效性","确认验收、试运行的具体计划"]},
 {id:"commissioning",name:"投产爬坡",prompt:"设备开机和首批产品，并不代表产能、订单和效率已经达产。",
  checks:["确认实际投产日期和良品率","核实产能利用与实际订单","采集销售收入、用工与增加值核算资料"]},
 {id:"operating",name:"稳定运营",prompt:"稳定运营也要看收入、利润和生产性服务采购的持续性。",
  checks:["核实投产、达产、稳定运营时间","区分营业收入与增加值","追踪就业、税收与本地服务采购"]}
];
const SECTORS={all:"全部产业",primary:"第一产业",secondary:"第二产业",tertiary:"第三产业"};
const YEARS=Array.from({length:10},(_,i)=>2026+i);
let state=null,projectSource=null,sector="all",stage="construction",delay=1,affected=50,selectedYear=2032,selectedId=null,bound=false;
const rootEl=()=>document.querySelector('[data-page="pipeline"]');
const q=id=>rootEl()?.querySelector("#"+id);
const safe=x=>String(x??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const f=(x,d=0)=>Number(x).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const sum=a=>a.reduce((n,v)=>n+Number(v||0),0);
const stageName=x=>S.find(s=>s.id===x)?.name||String(x||"未知阶段");
const evidence=()=>{
 const v=String(projectSource?.evidence?.projects||"");
 if(v.includes("IMPORTED_UNVERIFIED"))return "导入项目表 · 待核验";
 if(v==="SYNTHETIC")return "合成Demo · 非真实项目清单";
 return v?"项目来源："+v:"数据来源未标定 · 待核验";
};
function setButtons(selector,key,val){
 rootEl()?.querySelectorAll(selector).forEach(b=>{
  const is=b.getAttribute(key)===val;b.classList.toggle("active",is);b.setAttribute("aria-pressed",String(is));
 });
}
function rows(){
 return (projectSource?.tables?.projects||[]).filter(p=>sector==="all"||p.sector===sector);
}
function scenario(){
 // Existing engine provides stage counts. Targeted delay is an optional display-side
 // extension: stable ID ordering selects the affected subset deterministically.
 const raw=rows(),pending=raw.filter(p=>p.stage!=="operating"&&Number.isFinite(Number(p.commissionYear)));
 const ranked=pending.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const affectedIds=new Set(ranked.slice(0,Math.round(ranked.length*affected/100)).map(p=>String(p.id)));
 const result=pending.map(p=>{
  const before=Number(p.commissionYear),moved=affectedIds.has(String(p.id))&&delay>0;
  return {...p,before,after:before+(moved?delay:0),moved,extension:moved?delay:0};
 });
 const baselineBefore2032=result.filter(p=>p.before<=2032).length,
       changedBefore2032=result.filter(p=>p.after<=2032).length,
       crosses2032=result.filter(p=>p.before<=2032&&p.after>2032).length;
 const years=YEARS.map(y=>({year:y,
  baseline:result.filter(p=>p.before===y).length,
  adjusted:result.filter(p=>p.after===y).length,
  arrivals:result.filter(p=>p.before===y||p.after===y)}));
 return {raw,pending:result,affectedIds,affectedCount:result.filter(p=>p.moved).length,
 baselineBefore2032,changedBefore2032,crosses2032,years,
 stable:raw.filter(p=>p.stage==="operating").length,
 unknownYear:raw.filter(p=>p.stage!=="operating"&&!Number.isFinite(Number(p.commissionYear))).length};
}
function renderFunnel(){
 const analysis=E.projects(projectSource,0),subset=rows(),den=Math.max(1,subset.length);
 q("pl-dataset-label").textContent=evidence()+" · "+subset.length+"宗当前筛选项目，不是2026年171宗真实清单";
 q("pl-funnel").innerHTML=S.map((d,i)=>{
  const r=subset.filter(p=>p.stage===d.id),amount=sum(r.map(x=>x.investment));
  return '<button type="button" data-pl-stage="'+d.id+'" class="pl-stage'+(stage===d.id?" active":"")+'" aria-pressed="'+(stage===d.id)+'" style="--stage-width:'+Math.max(2,r.length/den*100).toFixed(1)+'%">'+
  '<span>'+(i+1).toString().padStart(2,"0")+' / '+d.name+'</span><strong>'+r.length+'<small>宗</small></strong>'+
  '<b>项目投资合计 '+f(amount,1)+'百万元</b><i></i></button>';
 }).join("");
 const d=S.find(x=>x.id===stage)||S[0],focus=subset.filter(x=>x.stage===stage),value=sum(focus.map(x=>x.investment));
 q("pl-funnel-detail").innerHTML='<span>CURRENT STAGE / '+evidence()+'</span><h3>'+d.name+'，需要确认什么？</h3><p>'+d.prompt+' 当前筛选数据处于这一阶段的项目共'+focus.length+'宗，不等于阶段转换率或真实项目进度。</p>';
 q("pl-funnel-stats").innerHTML=
  '<div><small>本阶段项目数量</small><strong>'+focus.length+'宗</strong></div>'+
  '<div><small>本阶段投资计划合计</small><strong>'+f(value,1)+'</strong></div>';
}
function renderTimeline(result){
 q("pl-delay").value=String(delay);q("pl-delay-label").textContent=delay+"年";
 q("pl-affected").value=String(affected);q("pl-affected-label").textContent=affected+"%";
 setButtons("#pl-sector-switch button","data-pl-sector",sector);
 const highest=Math.max(1,...result.years.flatMap(y=>[y.baseline,y.adjusted]));
 q("pl-timeline").innerHTML=result.years.map(y=>
 '<button type="button" data-pl-year="'+y.year+'" class="pl-year-column'+(y.year===selectedYear?" active":"")+(y.year===2032?" reference":"")+'" aria-pressed="'+(y.year===selectedYear)+'" aria-label="'+y.year+'年基线'+y.baseline+'宗，情景'+y.adjusted+'宗">'+
 '<span class="pl-year-num">'+y.year+'</span><span class="pl-year-bars">'+
 '<span><small>'+y.baseline+'</small><i style="--bar-height:'+Math.max(3,y.baseline/highest*151).toFixed(1)+'px"></i></span>'+
 '<span><small>'+y.adjusted+'</small><i class="adjusted" style="--bar-height:'+Math.max(3,y.adjusted/highest*151).toFixed(1)+'px"></i></span>'+
 '</span><em>'+(y.year===2032?"参考线":"")+'</em></button>'
 ).join("");
 const selected=result.years.find(x=>x.year===selectedYear)||result.years[6];
 q("pl-cohort").innerHTML=
 '<div><span>'+selectedYear+'年 · 原计划到达</span><strong>'+selected.baseline+'宗</strong></div>'+
 '<div><span>'+selectedYear+'年 · 条件调整后</span><strong>'+selected.adjusted+'宗</strong></div>'+
 '<div><span>当前筛选 · 尚未运营项目</span><strong>'+result.pending.length+'宗</strong></div>';
 q("pl-timeline-scope").textContent=SECTORS[sector]+" · "+result.pending.length+"宗未运营项目";
 q("pl-stress-summary").innerHTML=
 '<div><small>示例受影响项目</small><strong>'+result.affectedCount+'宗</strong></div>'+
 '<div><small>跨过2032参考边界</small><strong class="'+(result.crosses2032?"warn":"")+'">'+result.crosses2032+'宗</strong></div>'+
 '<div><small>原计划2032前入列</small><strong>'+result.baselineBefore2032+'宗</strong></div>'+
 '<div><small>调整后2032前入列</small><strong>'+result.changedBefore2032+'宗</strong></div>';
}
function listCandidates(result){
 const byYear=result.pending.filter(p=>p.before===selectedYear||p.after===selectedYear);
 if(byYear.length)return byYear.slice().sort((a,b)=>Number(b.moved)-Number(a.moved)||a.before-b.before||String(a.id).localeCompare(String(b.id)));
 return result.pending.slice().sort((a,b)=>a.after-b.after||String(a.id).localeCompare(String(b.id)));
}
function renderProjects(result){
 const cohort=listCandidates(result),visible=cohort.slice(0,28);
 if(!visible.some(p=>String(p.id)===String(selectedId)))selectedId=visible[0]?.id||null;
 const selected=result.pending.find(p=>String(p.id)===String(selectedId));
 q("pl-list-title").textContent=cohort.some(p=>p.before===selectedYear||p.after===selectedYear)?
  selectedYear+"年涉及的示例项目":"本年度暂无项目，显示后续计划";
 q("pl-list-count").textContent=cohort.length+"宗 · 最多显示28宗";
 if(!visible.length){
  q("pl-project-items").innerHTML='<div style="padding:24px;color:#718b98;font-size:12px">当前筛选下没有未运营项目。可以切换产业，或导入新的项目数据。</div>';
 }else{
  q("pl-project-items").innerHTML=visible.map(p=>
   '<button type="button" data-pl-project="'+safe(p.id)+'" class="'+(String(p.id)===String(selectedId)?"active":"")+'" aria-pressed="'+(String(p.id)===String(selectedId))+'">'+
   '<strong>'+safe(p.name||p.id)+'</strong><small>'+safe(stageName(p.stage))+' / '+safe(SECTORS[p.sector]||p.sector)+'</small>'+
   '<em class="'+(p.moved?"moved":"")+'">'+p.before+' → '+p.after+'</em></button>').join("");
 }
 if(!selected){
  q("pl-project-detail").innerHTML='<span>PROJECT DATA</span><h3>当前范围没有可选项目</h3><p>可以改产业或在数据中心导入有ID、阶段、计划投产年份的真实项目表。</p>';
 }else{
  q("pl-project-detail").innerHTML='<span>SELECTED PROJECT / '+safe(evidence())+'</span><h3>'+safe(selected.name||selected.id)+'</h3>'+
   '<p>'+safe(SECTORS[selected.sector]||selected.sector)+' · '+safe(stageName(selected.stage))+
   ' · '+safe(selected.town||"区域待补充")+'。项目ID：'+safe(selected.id)+'</p>'+
   '<div class="pl-project-detail-grid"><div><small>示例计划投产</small><strong>'+selected.before+'年</strong></div>'+
   '<div><small>情景调整后</small><strong>'+selected.after+'年</strong></div>'+
   '<div><small>登记投资额 · 百万元</small><strong>'+f(selected.investment||0,1)+'</strong></div>'+
   '<div><small>条件延后</small><strong>'+selected.extension+'年</strong></div></div>'+
   '<div class="pl-project-detail-warning">'+(selected.moved?
   '这个项目属于本次人为选中的受扰动样本。项目是否真正延期、延期原因与投产后的增加值仍需现场核验。':
   '这个项目没有被本次条件选中，不代表现实中没有延期风险。')+'</div>';
 }
 renderChecklist(selected?.stage||stage);
}
function renderChecklist(stageId){
 const d=S.find(x=>x.id===stageId)||S[0];
 q("pl-validation-list").innerHTML='<strong>'+d.name+' · 优先核实的三件事</strong><ul>'+
  d.checks.map(t=>'<li>'+safe(t)+'</li>').join("")+'</ul>'+
  '<p>任何客户修正先记为待核验。只有资料来源、授权、时间、统计口径及复核过程完整，才考虑升级证据等级。</p>';
}
function downloadJSON(file,body){
 const blob=new Blob([JSON.stringify(body,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportScenario(){
 const r=scenario();
 downloadJSON("boluo-project-arrival-scenario.json",{
  schema:"BOLUO_PROJECT_ARRIVAL_V1",createdAt:new Date().toISOString(),
  evidence:evidence(),dataset_id:projectSource?.meta?.dataset_id||"unknown",
  scope:{sector,stageFilter:"none",selectedYear},assumptions:{delayYears:delay,affectedShare:affected,
   selection:"First round(n*share) records sorted by project ID; future commissioning only, operating excluded"},
  result:{totalRecords:r.raw.length,pendingRecords:r.pending.length,operatingRecords:r.stable,
   baselineBefore2032:r.baselineBefore2032,scenarioBefore2032:r.changedBefore2032,
   crossing2032:r.crosses2032,years:r.years.map(({year,baseline,adjusted})=>({year,baseline,adjusted})),
   projects:r.pending.map(p=>({id:p.id,name:p.name,sector:p.sector,stage:p.stage,
    investment:p.investment,scheduledYear:p.before,scenarioYear:p.after,shiftYears:p.extension}))},
  caution:"Counts of scheduled project milestones only; not investment completed, actual operating output or GDP."
 });
}
function exportChecklist(){
 const r=scenario(),candidate=r.pending.find(p=>String(p.id)===String(selectedId));
 const d=S.find(x=>x.id===(candidate?.stage||stage))||S[0];
 downloadJSON("boluo-project-evidence-todo.json",{
  schema:"BOLUO_PROJECT_EVIDENCE_V1",createdAt:new Date().toISOString(),status:"PENDING_VERIFICATION",
  grade:"NOT_ASSIGNED",dataset_id:projectSource?.meta?.dataset_id||"unknown",
  evidence:evidence(),project:candidate?{id:candidate.id,name:candidate.name,stage:candidate.stage,
   plannedYear:candidate.before,scenarioYear:candidate.after}:null,
  verifyingStage:d.name,fields:d.checks,
  note:"Field inquiry only; data grade A requires provenance and independent verification."
 });
}
function render(st){
 if(!rootEl())return;
 const changed=projectSource!==st?.data;state=st;projectSource=st?.data;
 if(changed)selectedId=null;
 renderFunnel();
 const r=scenario();renderTimeline(r);renderProjects(r);
}
function bind(){
 if(bound||!rootEl())return;
 rootEl().addEventListener("click",evt=>{
  const s=evt.target.closest("[data-pl-stage]");if(s){stage=s.dataset.plStage;renderFunnel();renderChecklist(stage);return;}
  const sectorBtn=evt.target.closest("[data-pl-sector]");if(sectorBtn){sector=sectorBtn.dataset.plSector;selectedId=null;render(state);return;}
  const y=evt.target.closest("[data-pl-year]");if(y){selectedYear=Number(y.dataset.plYear);selectedId=null;render(state);return;}
  const p=evt.target.closest("[data-pl-project]");if(p){selectedId=p.dataset.plProject;renderProjects(scenario());return;}
  if(evt.target.closest("#pl-reset")){delay=1;affected=50;selectedYear=2032;selectedId=null;render(state);return;}
  if(evt.target.closest("#pl-export-scenario")){exportScenario();return;}
  if(evt.target.closest("#pl-export-checklist")){exportChecklist();return;}
 });
 q("pl-delay").addEventListener("input",evt=>{delay=Number(evt.target.value);selectedId=null;render(state);});
 q("pl-affected").addEventListener("input",evt=>{affected=Number(evt.target.value);selectedId=null;render(state);});
 bound=true;
}
root.BoluoProjectPage={render,bind,scenario};
})(window);
