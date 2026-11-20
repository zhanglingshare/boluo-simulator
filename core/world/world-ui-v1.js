/* Simple industry-manager front end. All shown state comes from BoluoLivingWorld.
 * Public anchors do not change when the synthetic simulation advances.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const W=window.BoluoLivingWorld,C=window.BoluoCore;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=(x,p=1)=>Number(x||0).toLocaleString("zh-CN",{minimumFractionDigits:p,maximumFractionDigits:p});
const storeKey="boluo-living-world-browser-v1";
let bundle=C.demo(),world,worldStart,worldSnapshots=[],selected="none",firmId="I0001",
  scenario="normal",evidence=null,busy=false;
function loadInitial(){
 const fy=evidence?.records?.find(x=>x.period==="FY"&&x.year===2025);
 const old=(()=>{try{return JSON.parse(sessionStorage.getItem(storeKey)||"null")}catch{return null}})();
 const publicBaseline=fy?{year:2025,gdp:fy.gdp,primary:fy.primary,secondary:fy.secondary,tertiary:fy.tertiary,
     source:fy.source,evidence:"published"}:null;
 worldStart=W.createWorld(bundle,{seed:20261120,projectDelayQuarters:4,affectedPct:50,
   publicBaseline,dataFingerprint:C.identity(bundle)});
 if(old?.schema==="boluo-world-session/1"&&old.state?.schema===W.VERSION&&old.state.seed===worldStart.seed
    &&old.state.dataFingerprint===worldStart.dataFingerprint&&old.state.q>=0&&old.state.q<=28){
  world=old.state;scenario=["normal","supply","demand"].includes(old.scenario)?old.scenario:"normal";
  firmId=world.firms.some(x=>x.id===old.firmId)?old.firmId:"I0001";
 }else world=worldStart;
 $("worldScenario").value=scenario;$("selectedFirm").value=firmId;
 worldSnapshots=[world];render();
}
function save(){try{sessionStorage.setItem(storeKey,JSON.stringify({schema:"boluo-world-session/1",state:world,scenario,firmId}))}catch(e){$("runStatus").textContent="模拟已运行，但浏览器无法保存临时进度。"}}
function externalAt(q){
 const active=q>=2&&q<8;
 if(!active)return {};
 if(scenario==="supply")return {demandMultiplier:.94,supplyDisruption:.55};
 if(scenario==="demand")return {demandMultiplier:.70,supplyDisruption:.12};
 return {};
}
function nextProject(){
 return world.projects.filter(p=>!p.activated&&p.arrivalQ>=world.q)
  .sort((a,b)=>a.arrivalQ-b.arrivalQ||a.id.localeCompare(b.id))[0]||null;
}
function actionFor(){
 if(selected==="none")return [];
 if(selected==="expedite"){const p=nextProject();return p?[{type:"expedite",target:p.id}]:[];}
 if(selected==="substitute"||selected==="skills")return [{type:selected,target:firmId}];
 return [];
}
const svgText=(x,y,t,c="#bcd0de",size=11)=>'<text x="'+x+'" y="'+y+'" fill="'+c+'" font-size="'+size+'" font-family="system-ui" text-anchor="middle">'+esc(t)+'</text>';
function drawHistory(){
 const svg=$("historyChart"),h=world.history;
 if(!h.length){svg.innerHTML='<rect x="18" y="20" width="620" height="148" rx="11" fill="#0d293a"/>'+svgText(330,100,"选择行动并推进季度，世界曲线才会形成");return}
 const min=0,max=Math.max(...h.map(x=>x.grossProduction))*1.17;
 const x=i=>38+(h.length===1?0:i/(Math.max(1,h.length-1))*575);
 const y=v=>164-v/Math.max(max,1)*134;
 const line=(key,color)=>'<polyline points="'+h.map((v,i)=>x(i)+','+y(v[key])).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
 const last=h.at(-1);
 svg.innerHTML='<line x1="37" y1="165" x2="630" y2="165" stroke="#658295"/>'+
  [1,2,3].map(i=>'<line x1="37" y1="'+(165-35*i)+'" x2="630" y2="'+(165-35*i)+'" stroke="#386078" stroke-dasharray="3 5" opacity=".5"/>').join("")+
  line("grossProduction","#e7bf7d")+line("sampleValueAddedProxy","#66d8d1")+
  svgText(40,184,h[0].label,"#9ebcca",11)+svgText(589,184,last.label,"#9ebcca",11)+
  svgText(86,16,"━━ 产出","#e7bf7d",12)+svgText(206,16,"━━ 增加值代理","#66d8d1",12);
}
function drawNetwork(){
 const svg=$("networkMap"),center=world.firms.find(f=>f.id===firmId);
 if(!center){svg.innerHTML=svgText(300,146,"没有找到该企业");return}
 const neighbors=world.links.filter(e=>e.buyer===center.id||e.supplier===center.id)
  .sort((a,b)=>b.weight-a.weight).slice(0,12);
 const positions=new Map([[center.id,{x:310,y:145}]]);
 neighbors.forEach((e,i)=>{
  const other=e.buyer===center.id?e.supplier:e.buyer;
  if(!positions.has(other)){const count=positions.size-1,theta=count*(2*Math.PI/Math.max(7,neighbors.length))-.9;
   positions.set(other,{x:310+210*Math.cos(theta),y:147+103*Math.sin(theta)});}
 });
 let lines='',nodes='';
 for(const e of neighbors){
  const source=positions.get(e.supplier),target=positions.get(e.buyer);if(!source||!target)continue;
  lines+='<path d="M'+source.x.toFixed(1)+' '+source.y.toFixed(1)+' L'+target.x.toFixed(1)+' '+target.y.toFixed(1)+'" stroke="#73c4c9" stroke-width="'+Math.min(3,.8+e.weight*.8)+'" opacity=".52" fill="none" stroke-dasharray="4 5"/>';
 }
 for(const [id,p] of positions){
  const central=id===center.id;
  nodes+='<g data-node="'+esc(id)+'" style="cursor:pointer" tabindex="0" role="button" aria-label="查看企业 '+esc(id)+'">'+
   '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+(central?30:17)+'" fill="'+(central?"#2a7e82":"#846e49")+'" stroke="'+(central?"#9bf7e9":"#f4d59f")+'" stroke-width="1.8"/>'+
   svgText(p.x,p.y+3,central?"我":id.replace(/^([A-Z])0+/,"$1"),"#fff",central?13:10)+
   svgText(p.x,p.y+(central?47:31),id,"#bcd7df",10)+'</g>';
 }
 svg.innerHTML='<rect x="4" y="3" width="612" height="281" rx="14" fill="#102d3f"/>'+lines+nodes;
 svg.querySelectorAll("[data-node]").forEach(el=>{
  const activate=()=>{firmId=el.dataset.node;$("selectedFirm").value=firmId;renderFirm();drawNetwork();save()};
  el.addEventListener("click",activate);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate()}});
 });
}
function drawSectors(){
 const h=world.history.at(-1),bars=$("sectorBars"),legend=$("sectorLegend");
 if(!h){bars.innerHTML="";legend.textContent="等待第一季度结算";return}
 const colors={primary:"#8bd59a",secondary:"#edc57e",tertiary:"#72d5d3"};
 const labels={primary:"第一产业",secondary:"第二产业",tertiary:"第三产业"};
 const sum=Math.max(1,h.grossProduction);
 bars.innerHTML=Object.keys(colors).map(k=>'<span style="width:'+(100*h.sectorGross[k]/sum).toFixed(3)+'%;background:'+colors[k]+'"></span>').join("");
 legend.innerHTML=Object.keys(colors).map(k=>'<span><i style="color:'+colors[k]+'">●</i> '+labels[k]+' '+(100*h.sectorGross[k]/sum).toFixed(1)+'%</span>').join("");
}
function renderFirm(){
 const f=world.firms.find(x=>x.id===firmId);
 if(!f)return;
 $("firmName").textContent=(f.closed?"已退出 · ":"")+f.name+" · "+f.id;
 $("firmCash").textContent=n(f.cash);$("firmRaw").textContent=n(f.raw);
 $("firmFinish").textContent=n(f.finished);$("firmCapacity").textContent=n(f.capacity);
 $("firmUse").textContent=n(f.utilization*100,0)+"%";$("firmBacklog").textContent=n(f.backlog);
 $("firmDetail").textContent=f.sector+" / "+f.subsector+" / "+f.town+"。现金、库存与订单来自季度状态更新；不是现实企业数据。";
}
function renderNews(){
 const h=world.history.at(-1),news=$("news");
 if(!h){news.innerHTML='<article>你不操作，830家企业也会自主接单、采购、生产和投资。点击推进季度，观察系统如何改变。</article>';return}
 const msgs=[];
 if(h.policy.length)msgs.push({head:"你的行动已经被记录",s:h.policy.map(x=>x.type+" → "+x.target+"（消耗"+x.cost+"行动点）").join("；")});
 if(h.projectsActivated)msgs.push({head:"项目开始形成产能",s:h.projectsActivated+"宗合成项目在本季度达到预设投产条件，不代表正式达产。"});
 if(h.unmetFinalDemand>h.grossProduction*.08)msgs.push({head:"订单不能全部交付",s:"本季度订单缺口 "+n(h.unmetFinalDemand)+" 百万元等值。可以检查供应和产能约束。",warning:true});
 if(h.external.supplyDisruption>0)msgs.push({head:"供应冲击仍在发生",s:"进口原料可得性受到情景冲击，企业反应取决于自身库存和替代能力。",warning:true});
 if(h.external.demandMultiplier<1)msgs.push({head:"市场需求发生变化",s:"企业订单受到统一需求情景影响，但不同企业的竞争力与供给条件不同。"});
 if(!msgs.length)msgs.push({head:"产业世界自主运行",s:"企业持续完成采购、生产、交货和现金结算。即使没有政策干预，状态也在变化。"});
 news.innerHTML=msgs.slice(0,4).map(x=>'<article class="'+(x.warning?"warning":"")+'"><b>'+esc(x.head)+'</b><div>'+esc(x.s)+'</div></article>').join("");
}
function render(){
 const h=world.history.at(-1),q=world.q;
 $("quarterBadge").innerHTML='<b>'+(q>=28?"2032 Q4":(2026+Math.floor(q/4))+" Q"+(q%4+1))+'</b> '+(q>=28?"赛季完结":"正在经营");
 $("budgetBadge").innerHTML='行动资源 <b>'+world.budget+'</b> 点';
 $("timelineLabel").textContent=q+" / 28季度";$("timelineFill").style.width=(q/28*100)+"%";
 $("firmCount").textContent=world.firms.filter(f=>!f.closed).length.toLocaleString("zh-CN");
 $("edgeCount").textContent=world.links.length.toLocaleString("zh-CN");
 $("projectCount").textContent=world.projects.filter(p=>p.activated).length+" / "+world.projects.length;
 $("ledger").textContent=h?(h.balanced?"已平衡":"未平衡"):"待结算";
 $("grossProduction").textContent=h?n(h.grossProduction,0):"—";
 $("valueAdded").textContent=h?n(h.sampleValueAddedProxy,0):"—";
 $("orderGap").textContent=h?n(h.unmetFinalDemand,0):"—";
 const ratio=h?h.unmetFinalDemand/Math.max(1,h.grossProduction):0;
 $("worldHeadline").textContent=!h?"经营从今天开始":h.projectsActivated?"本季有 "+h.projectsActivated+" 宗项目进入投产环节":ratio>.08?"订单压力正在传导":"企业正在独立经营";
 $("worldSub").textContent=!h?"选择干预或者继续观察，看看这830家合成企业怎样回应环境。":h.label+"：合成样本产出 "+n(h.grossProduction,0)+" 百万元等值。世界会按经济约束推进，而不听命于指标滑杆。";
 $("eventText").textContent=q>=28?"赛季已结束。可以导出完整状态或重新开局。":"本季度有 "+world.projects.filter(p=>!p.activated&&p.arrivalQ>=q).length+" 宗尚待完成的演示项目。你可以干预其中一个，或者让企业自己应对。";
 $("advance").disabled=q>=28;$("advance4").disabled=q>=28;$("compareButton").disabled=q>=28;
 $("runStatus").textContent=q>=28?"✓ 28季度完成，所有季度账目已通过模型内部守恒检查。":"本世界包含 "+world.firms.length+" 家自主主体，已推进 "+q+" 个季度。";
 drawHistory();drawSectors();renderFirm();drawNetwork();renderNews();
 $("debugText").textContent=JSON.stringify({schema:world.schema,q:world.q,seed:world.seed,
  fingerprint:world.dataFingerprint,model:"stock-flow autonomous firms v1",
  count:{firms:world.firms.length,links:world.links.length,projects:world.projects.length},
  publicBaseline:world.publicBaseline,quarterReport:h||null,actions:world.actions.slice(-8),
  warnings:["Synthetic production is NOT county GDP","Company accounts are hypothetical","Project-to-firm assignments are deterministic demo choices"]},null,2);
 for(const el of document.querySelectorAll("[data-action]"))el.classList.toggle("selected",el.dataset.action===selected);
}
async function advance(steps){
 if(busy||world.q>=28)return;
 busy=true;$("advance").disabled=true;$("advance4").disabled=true;
 $("runStatus").textContent="正在结算订单、原料、生产、现金与产业关系……";
 await new Promise(requestAnimationFrame);
 try{
  for(let i=0;i<steps&&world.q<28;i++){
   const choice=i===0?actionFor():[];
   world=W.step(world,choice,externalAt(world.q));
   worldSnapshots.push(world);
  }
  save();render();$("comparison").textContent="已推进时间，选择下一项行动后可重新对照未来四季度。";
 }catch(e){$("runStatus").textContent="模拟停止："+e.message;console.error(e)}
 finally{busy=false;$("advance").disabled=world.q>=28;$("advance4").disabled=world.q>=28}
}
function compare(){
 if(world.q>=28)return;
 try{
  const remaining=Math.min(4,28-world.q),actions=actionFor(),actionsByQuarter=actions.length?{[world.q]:actions}:{};
  const env={};for(let i=0;i<remaining;i++)env[world.q+i]=externalAt(world.q+i);
  const result=W.compare(world,remaining,actionsByQuarter,env);
  const signed=(x)=>x>0?"+"+n(x,2):n(x,2);
  $("comparison").innerHTML=
   '<b>相同初始状态与外部冲击 · '+remaining+'季度</b><p>本次选择：'+esc(selected==="none"?"不干预":selected)+
   '。 对照“不采取行动”，终期合成产出变化 <b style="color:#f5d28b">'+signed(result.delta.grossOutput)+
   '</b> 百万元等值；订单缺口变化 <b>'+signed(result.delta.unmetOrders)+'</b>；现金总量变化 <b>'+signed(result.delta.cash)+'</b>。</p>'+
   '<span class="note">结果可能为零或方向相反；它只是开发规则下的模型响应，不是现实因果效果。</span>';
 }catch(e){$("comparison").textContent="无法完成对照："+e.message}
}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.action;render()}));
$("advance").onclick=()=>advance(1);$("advance4").onclick=()=>advance(4);$("compareButton").onclick=compare;
$("worldScenario").onchange=e=>{scenario=e.target.value;save();render()};
$("reset").onclick=()=>{sessionStorage.removeItem(storeKey);world=worldStart;selected="none";worldSnapshots=[world];render();save()};
$("selectFirmButton").onclick=()=>{
 const id=$("selectedFirm").value.trim();
 if(world.firms.some(x=>x.id===id)){firmId=id;renderFirm();drawNetwork();save()}
 else $("firmDetail").textContent="未找到主体 "+id+"，请从候选列表中选择一个合成企业编号。";
};
$("selectedFirm").addEventListener("change",()=>$("selectFirmButton").click());
$("exportWorld").onclick=()=>{
 const payload={schema:"boluo-world-export/1",model:W.VERSION,source:"lab-2032/core.js synthetic data",
  publicAnchors:evidence||null,scenario,exportedState:world};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="boluo-living-world-"+(world.q||0)+"-quarters.json";
 a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
async function initialize(){
 try{
  const r=await fetch("../data/boluo-public-anchors-2026.v1.json");
  if(!r.ok)throw Error("Public anchor HTTP "+r.status);
  evidence=await r.json();
  $("publicGDP").textContent=n(evidence.records.find(x=>x.year===2025&&x.period==="FY").gdp,2);
  $("public2026").textContent=n(evidence.records.find(x=>x.year===2026&&x.period==="Q3_YTD").gdp,2);
  $("publicSource").innerHTML=evidence.records.slice(0,3).map(x=>'<a href="'+esc(x.source)+'" target="_blank" rel="noopener">'+x.year+' '+esc(x.period)+'</a>').join(" · ");
  $("firmSuggestions").innerHTML=bundle.tables.enterprises.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join("");
  loadInitial();
 }catch(e){$("runStatus").textContent="初始化失败："+e.message;console.error(e)}
}
initialize();
})();
