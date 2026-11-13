/* Boluo 2032 | Page 04: relationship intelligence
 * Models/data already exist. This is a scoped, evidence-labelled exploration layer.
 * All links are read from current dataset, never invented or fetched remotely.
 */
(function(root){
"use strict";
const E=root.BoluoEngine,C=root.BoluoCore;
const S=["primary","secondary","tertiary"];
const NAMES={primary:"农业",secondary:"工业",tertiary:"服务业"};
const COLORS={primary:"#63d4ae",secondary:"#6cafe8",tertiary:"#ebad69"};
const TYPES={
 all:"全部关系",professional_service:"专业服务",industrial_supply:"工业配套",
 agricultural_processing:"农业加工",agricultural_distribution:"农业流通"
};
let currentState=null,currentData=null,net=null,selectedMode="structure",
 filterSector="all",filterType="all",visibleLimit=24,selectedAgg=null,selectedActor=null,
 activeEdges=[],currentAgg=null,impact=null,bound=false;
const section=()=>document.querySelector('[data-page="relations"]');
const el=id=>section()?.querySelector("#"+id);
const fmt=n=>Number(n).toLocaleString("zh-CN",{maximumFractionDigits:2});
const fixed=(n,d=1)=>Number(n).toFixed(d);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=s=>String(s??"").length>10?String(s).slice(0,9)+"…":String(s??"");
const sum=a=>a.reduce((t,x)=>t+Number(x||0),0);
const isImported=k=>currentData?.evidence?.[k]==="IMPORTED_UNVERIFIED";
function evidence(){
 const ents=isImported("enterprises"),rels=isImported("relations");
 return ents&&rels?"客户导入 · 双表均待核验":ents||rels?"混合数据 · 未替换部分仍为合成":"合成Demo · 非真实供应链";
}
function isPureDemo(){return !isImported("enterprises")&&!isImported("relations");}
function recompute(){
 if(!currentState?.data)return;
 const changed=currentData!==currentState.data;
 currentData=currentState.data;
 net=E.network(currentData,"all");
 if(changed){selectedAgg=null;selectedActor=null;impact=null;}
 activeEdges=net.graph.edges.filter(e=>(filterType==="all"||e.type===filterType)&&
  (filterSector==="all"||e.a.sector===filterSector||e.b.sector===filterSector));
}
function metric(title,value,note){
 return '<div class="rl-stat"><small>'+safe(title)+'</small><strong'+(title==="数据证据"?' class="rl-status"':'')+'>'+safe(value)+'</strong><span>'+safe(note)+'</span></div>';
}
function renderStats(){
 const activeCross=activeEdges.filter(e=>e.a.sector!==e.b.sector).length;
 el("rl-stats").innerHTML=[
 metric("主体总数",fmt(net.nodes)+"个","当前数据集登记，可能包含孤立主体"),
 metric("有效连接",fmt(activeEdges.length)+"条","按当前产业与关系类型筛选"),
 metric("跨产业连接",fmt(activeCross)+"条","源、目标主体归属不同产业"),
 metric("数据证据",isPureDemo()?"演示关系":"待核验","所有节点与连线都必须核对来源")
 ].join("");
 el("rl-hero-evidence").textContent=evidence();
 el("rl-graph-evidence").textContent=evidence();
}
function aggregate(){
 const nodes=new Map(),edges=new Map();
 function add(company,weight){
  const group=S.includes(company.sector)?company.sector:"tertiary",
    id=group+"::"+String(company.subsector||"未分类");
  let item=nodes.get(id);
  if(!item){item={id,name:String(company.subsector||"未分类"),sector:group,amount:0,degree:0};nodes.set(id,item);}
  item.amount+=weight;item.degree++;
  return item;
 }
 for(const e of activeEdges){
  const a=add(e.a,e.value),b=add(e.b,e.value),key=a.id+"|"+b.id;
  let edge=edges.get(key);
  if(!edge){edge={key,a:a.id,b:b.id,value:0,count:0};edges.set(key,edge);}
  edge.value+=e.value;edge.count++;
 }
 const sorted=[...nodes.values()].sort((a,b)=>b.amount-a.amount);
 const top=sorted.slice(0,Math.min(17,sorted.length));
 const used=new Set(top.map(x=>x.id));
 const links=[...edges.values()].filter(e=>used.has(e.a)&&used.has(e.b)).sort((a,b)=>b.value-a.value).slice(0,visibleLimit);
 return {nodes:top,links,allNodes:sorted.length,allEdges:edges.size};
}
function defs(){
 return '<defs><marker id="rl-arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L6 3 L0 6 z" fill="#a7dce2" opacity=".68"/></marker></defs>';
}
function emptyGraph(text){
 return '<div class="rl-empty">'+safe(text)+'<small>当前筛选范围没有可视化连接。请切换产业、关系类型，或进入数据中心补充数据。</small></div>';
}
function structureSvg(agg){
 const nodes=agg.nodes,links=agg.links;
 if(!links.length)return emptyGraph("当前筛选没有可展示的关系");
 const w=960,h=610,grid={primary:160,secondary:465,tertiary:760},groups={primary:[],secondary:[],tertiary:[]};
 for(const n of nodes)groups[n.sector].push(n);
 const pos=new Map();
 for(const k of S){
  const group=groups[k],gap=group.length>1?480/(group.length-1):0;
  group.forEach((n,i)=>pos.set(n.id,{x:grid[k],y:88+(group.length===1?245:i*gap),node:n}));
 }
 const max=Math.max(1,...links.map(e=>e.value));
 const selected=nodes.some(n=>n.id===selectedAgg)?selectedAgg:null;
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="当前数据集的跨产业细分行业连接图；可点击节点">'+defs();
 for(const k of S){
  svg+='<text x="'+grid[k]+'" y="29" font-weight="850" font-size="18" fill="'+COLORS[k]+'" text-anchor="middle">'+NAMES[k]+'</text>';
  svg+='<line x1="'+grid[k]+'" y1="44" x2="'+grid[k]+'" y2="580" stroke="#ffffff0d" stroke-dasharray="4 10"/>';
 }
 for(const e of links){
  const a=pos.get(e.a),b=pos.get(e.b);if(!a||!b)continue;
  let path;
  if(Math.abs(a.x-b.x)<10){
   const side=a.y<b.y?1:-1,offset=115*side;
   path='M '+a.x+' '+a.y+' C '+(a.x+offset)+' '+a.y+', '+(b.x+offset)+' '+b.y+', '+b.x+' '+b.y;
  }else{
   const dx=b.x-a.x,offset=Math.max(60,Math.abs(dx)*.32)*(dx>0?1:-1);
   path='M '+a.x+' '+a.y+' C '+(a.x+offset)+' '+a.y+', '+(b.x-offset)+' '+b.y+', '+b.x+' '+b.y;
  }
  const highlight=!selected||e.a===selected||e.b===selected,stroke=COLORS[pos.get(e.a).node.sector];
  svg+='<g data-rl-edge="'+safe(e.key)+'" role="button" tabindex="0" aria-label="'+safe(a.node.name+"连接"+b.node.name+",汇总"+e.count+"条")+'">'+
  '<path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="'+fixed(1.5+6*Math.sqrt(e.value/max),2)+'" stroke-opacity="'+(highlight?".45":".08")+'" marker-end="url(#rl-arrow)"><title>'+safe(a.node.name+" → "+b.node.name+", "+e.count+"条, 权重 "+fmt(e.value))+'</title></path></g>';
 }
 for(const n of nodes){
  const p=pos.get(n.id),active=n.id===selected,dim=selected&&!active&&!links.some(e=>(e.a===selected&&e.b===n.id)||(e.b===selected&&e.a===n.id));
  const r=active?23:18,color=COLORS[n.sector],opacity=dim?.38:1;
  svg+='<g role="button" tabindex="0" data-rl-node="'+safe(n.id)+'" opacity="'+opacity+'" aria-label="'+safe(n.name+"所属"+NAMES[n.sector])+'">'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(r+10)+'" fill="'+color+'" opacity="'+(active?".17":".08")+'"/>'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+color+'" fill-opacity=".9" stroke="'+(active?"#f0fffa":"#11334b")+'" stroke-width="'+(active?3:2)+'"/>'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#122f43"/>'+
  '<text x="'+p.x+'" y="'+(p.y-34)+'" text-anchor="middle" font-size="12" font-weight="'+(active?900:760)+'" fill="'+(active?"#effffb":"#b9d3dd")+'">'+safe(label(n.name))+'</text></g>';
 }
 return svg+'</svg>';
}
function topActors(){
 const degree=new Map();
 for(const e of activeEdges){
  for(const n of [e.a,e.b]){
   const old=degree.get(n.id)||{id:n.id,company:n,weight:0,count:0};
   old.weight+=e.value;old.count++;degree.set(n.id,old);
  }
 }
 return [...degree.values()].sort((a,b)=>b.weight-a.weight).slice(0,20);
}
function actorNeighbors(id){
 const m=new Map();
 for(const e of activeEdges){
  if(e.source!==id&&e.target!==id)continue;
  const other=e.source===id?e.b:e.a,out=e.source===id;
  const v=m.get(other.id)||{id:other.id,company:other,weight:0,in:0,out:0,types:new Set()};
  v.weight+=e.value;v[out?"out":"in"]++;v.types.add(e.type);m.set(other.id,v);
 }
 return [...m.values()].sort((a,b)=>b.weight-a.weight).slice(0,12);
}
function actorSvg(){
 const ranked=topActors();
 if(!ranked.length)return emptyGraph("没有匹配的主体关系");
 if(!ranked.some(x=>x.id===selectedActor))selectedActor=ranked[0].id;
 const focus=net.graph.ids.get(selectedActor);if(!focus)return emptyGraph("找不到主体");
 const others=actorNeighbors(selectedActor),incoming=others.filter(x=>x.in>=x.out),
       outgoing=others.filter(x=>x.in<x.out);
 const w=960,h=610,pos=new Map([[focus.id,{x:480,y:308,entity:focus,main:true}]]);
 incoming.forEach((d,i)=>pos.set(d.id,{x:188,y:110+(incoming.length===1?200:i*410/Math.max(1,incoming.length-1)),entity:d.company}));
 outgoing.forEach((d,i)=>pos.set(d.id,{x:768,y:110+(outgoing.length===1?200:i*410/Math.max(1,outgoing.length-1)),entity:d.company}));
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="当前选中主体的直接邻接关系；可点击主体">'+defs();
 svg+='<text x="188" y="44" fill="#a6cad6" font-size="13" text-anchor="middle">主要入向连接</text>'+
      '<text x="480" y="44" fill="#8ae6cf" font-size="13" text-anchor="middle">当前主体</text>'+
      '<text x="768" y="44" fill="#a6cad6" font-size="13" text-anchor="middle">主要出向连接</text>';
 const links=activeEdges.filter(e=>e.source===selectedActor||e.target===selectedActor)
 .filter(e=>pos.has(e.source)&&pos.has(e.target))
 .sort((a,b)=>b.value-a.value).slice(0,Math.max(visibleLimit,12));
 const max=Math.max(1,...links.map(x=>x.value));
 for(const e of links){
  const a=pos.get(e.source),b=pos.get(e.target);if(!a||!b)continue;
  const path='M '+a.x+' '+a.y+' C '+(a.x+(b.x-a.x)*.4)+' '+a.y+', '+(b.x-(b.x-a.x)*.4)+' '+b.y+', '+b.x+' '+b.y;
  svg+='<path d="'+path+'" fill="none" stroke="'+COLORS[e.a.sector]+'" stroke-width="'+fixed(1.5+5*Math.sqrt(e.value/max),2)+'" stroke-opacity=".45" marker-end="url(#rl-arrow)"><title>'+safe((e.a.name||e.source)+" → "+(e.b.name||e.target)+" "+TYPES[e.type])+'</title></path>';
 }
 for(const p of pos.values()){
  const d=p.entity,selected=d.id===selectedActor,color=COLORS[d.sector]||"#8dcab6",r=selected?40:21;
  svg+='<g data-rl-actor="'+safe(d.id)+'" role="button" tabindex="0" aria-label="'+safe((d.name||d.id)+"，"+NAMES[d.sector])+'">'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+(r+10)+'" fill="'+color+'" opacity="'+(selected?".22":".08")+'"/>'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+color+'" stroke="'+(selected?"#fff":"#103449")+'" stroke-width="'+(selected?4:2)+'"/>'+
  '<text x="'+p.x+'" y="'+(p.y+4)+'" text-anchor="middle" font-size="'+(selected?15:12)+'" font-weight="900" fill="#14384c">'+(selected?"●":"•")+'</text>'+
  '<text x="'+p.x+'" y="'+(p.y-r-12)+'" text-anchor="middle" font-size="'+(selected?15:12)+'" font-weight="850" fill="#d6edf0">'+safe(label(d.name||d.id))+'</text>'+
  '<text x="'+p.x+'" y="'+(p.y+r+16)+'" text-anchor="middle" font-size="10" fill="#9ebfc9">'+safe(d.town||NAMES[d.sector]||"")+'</text></g>';
 }
 return svg+'</svg>';
}
function renderInspectorStructure(agg){
 const selected=agg.nodes.find(n=>n.id===selectedAgg)||agg.nodes[0];
 if(!selected){el("rl-inspector").innerHTML='<div><span class="rl-inspector-flag">DATA NOT AVAILABLE</span><h3>当前没有可选择的关系节点</h3><p>请调整筛选条件或导入数据。</p></div>';return;}
 selectedAgg=selected.id;
 const incident=agg.links.filter(e=>e.a===selected.id||e.b===selected.id),
 weight=sum(incident.map(e=>e.value)),counter=sum(incident.map(e=>e.count));
 const prompts={primary:"农产品加工与流通的上下游合同、回款和冷链数据还缺多少？",secondary:"制造业真正向哪些本地服务商采购？有什么外溢？",tertiary:"服务供给是服务本地生产，还是主要承接县外需求？"};
 const adjacency=incident.slice(0,4).map(e=>e.a===selected.id?e.b:e.a)
  .map(id=>agg.nodes.find(n=>n.id===id)?.name||"其他节点");
 el("rl-inspector").innerHTML='<div><span class="rl-inspector-flag">SELECTED INDUSTRY ROLE</span><h3>'+safe(selected.name)+'</h3>'+
 '<p>当前产业：'+safe(NAMES[selected.sector])+'。以下全部由当前数据集筛选与汇总，不表示现实已存在这些交易。</p>'+
 '<div class="rl-inspector-stats"><div><small>可见相关连接</small><strong>'+counter+'条</strong></div><div><small>可见连接权重</small><strong>'+fmt(weight)+'</strong></div></div>'+
 '<div class="rl-inspector-tip"><strong>要继续核实什么？</strong>'+safe(prompts[selected.sector])+'</div></div>'+
 '<div class="rl-inspector-picks"><span>当前视图的其他连接角色</span><div>'+agg.nodes.filter(n=>n.id!==selected.id).slice(0,6).map(n=>
  '<button type="button" data-rl-select="'+safe(n.id)+'">'+safe(label(n.name))+'</button>').join("")+'</div></div>';
}
function renderInspectorActor(){
 const ranked=topActors(),chosen=ranked.find(x=>x.id===selectedActor)||
   (selectedActor?{id:selectedActor,company:net.graph.ids.get(selectedActor)}:ranked[0]);
 if(!chosen?.company){el("rl-inspector").innerHTML='<div><h3>暂无可选主体</h3></div>';return;}
 const d=chosen.company,all=activeEdges.filter(e=>e.source===d.id||e.target===d.id),
 inbound=all.filter(e=>e.target===d.id),outbound=all.filter(e=>e.source===d.id);
 el("rl-inspector").innerHTML='<div><span class="rl-inspector-flag">FOCUSED ACTOR · '+safe(evidence())+'</span>'+
 '<h3>'+safe(d.name||d.id)+'</h3>'+
 '<p>'+safe(NAMES[d.sector]||d.sector||"未分类")+' · '+safe(d.subsector||"细分未知")+' · '+safe(d.town||"地区待补充")+'。'+
 '主体档案来自当前数据表；合成主体不是现实企业。</p>'+
 '<div class="rl-inspector-stats"><div><small>入向关系</small><strong>'+inbound.length+'条</strong></div><div><small>出向关系</small><strong>'+outbound.length+'条</strong></div>'+
 '<div><small>入向权重</small><strong>'+fmt(sum(inbound.map(e=>e.value)))+'</strong></div><div><small>出向权重</small><strong>'+fmt(sum(outbound.map(e=>e.value)))+'</strong></div></div>'+
 '<div class="rl-inspector-tip"><strong>真实研究下一步</strong>优先核实关系双方的合同或采购来源、统计期、金额口径和是否持续合作。</div></div>'+
 '<div class="rl-inspector-picks"><span>点击切换其他高关联演示主体</span><div>'+
 ranked.slice(0,7).map(x=>'<button type="button" class="'+(x.id===d.id?"active":"")+'" data-rl-actor-choice="'+safe(x.id)+'">'+safe(label(x.company.name||x.id))+'</button>').join("")+'</div></div>';
}
function renderGraph(){
 if(selectedMode==="structure"){
  currentAgg=aggregate();
  if(!currentAgg.nodes.some(n=>n.id===selectedAgg))selectedAgg=currentAgg.nodes[0]?.id||null;
  el("rl-graph-stage").innerHTML=structureSvg(currentAgg);
  el("rl-graph-heading").textContent="产业连接 · 细分行业汇总";
  el("rl-visible-summary").textContent="屏幕上显示 "+currentAgg.links.length+"条汇总连线；本视图共归集 "+currentAgg.allEdges+"类行业连接";
  renderInspectorStructure(currentAgg);
 }else{
  currentAgg=null;
  const ranked=topActors();
  if(!net?.graph?.ids?.has(selectedActor)||!activeEdges.some(e=>e.source===selectedActor||e.target===selectedActor))
   selectedActor=ranked[0]?.id||null;
  el("rl-graph-stage").innerHTML=actorSvg();
  el("rl-graph-heading").textContent="主体局部 · 有向连接";
  const neighbors=selectedActor?actorNeighbors(selectedActor):[];
  el("rl-visible-summary").textContent="本次只显示 "+neighbors.length+"个邻接主体；不是全部 "+fmt(net.nodes)+"个主体";
  renderInspectorActor();
 }
}
function resetResults(){
 impact=null;
 el("rl-results").innerHTML='<div class="rl-idle">选择一个主体，改变强度，再运行实验。<small>结果将显示涉及的示意节点与传导层次。</small></div>';
}
function renderShockLabel(){
 const id=selectedActor||topActors()[0]?.id;
 const e=net?.graph?.ids?.get(id);
 el("rl-shock-source").textContent=e?(e.name||e.id)+" · "+NAMES[e.sector]:"当前筛选无可实验主体";
 el("rl-shock-value").textContent=String(el("rl-shock").value)+"%";
 el("rl-run").disabled=!e;
}
function renderQuestions(){
 const qs=[
 ["关系不等于交易事实","当前共 "+fmt(activeEdges.length)+" 条经过格式检查的关系记录。先核实合同、采购方向、统计期和数据授权，避免把Demo连线当真实业务。"],
 ["高连接度不等于高风险","可把高关联主体列入核查清单，但一个主体与很多主体相连，不证明它不可替代。需要订单替代性、供应商切换成本等信息。"],
 ["不要漏掉县外连接","县内网络不代表完整产业链。企业真实采购、客户和物流可能延伸到博罗县外，县域边界之外的缺失应明确保留。"]
 ];
 el("rl-questions").innerHTML=qs.map(([a,b],i)=>'<article class="rl-question-card"><span>待核实 0'+(i+1)+'</span><strong>'+a+'</strong><p>'+b+'</p></article>').join("");
}
function render(){
 if(!section()||!currentState?.data)return;
 recompute();
 renderStats();
 section().querySelectorAll("[data-rl-mode]").forEach(b=>{const active=b.dataset.rlMode===selectedMode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
 section().querySelectorAll("[data-rl-sector]").forEach(b=>{const active=b.dataset.rlSector===filterSector;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
 el("rl-type-filter").value=filterType;
 el("rl-edge-limit").value=String(visibleLimit);el("rl-edge-limit-output").textContent=visibleLimit+"条";
 renderGraph();renderShockLabel();renderQuestions();
}
function run(){
 const id=selectedActor||topActors()[0]?.id;
 if(!id||!net.graph.ids.has(id)){resetResults();return;}
 const drop=Number(el("rl-shock").value)/100;
 impact=E.propagate(net,id,drop);
 const byLevel=[1,2,3].map(level=>impact.waves.filter(x=>x.level===level).length);
 const seen=impact.affected.filter(x=>x.id!==id),top=seen.slice(0,4);
 el("rl-results").innerHTML='<div class="rl-run-header"><span>THREE-STAGE DEMO / 不代表现实损失</span><b>实验完成</b></div>'+
 '<div class="rl-run-top"><div><small>人工设置扰动</small><strong>'+Math.round(drop*100)+'%</strong></div>'+
 '<div><small>示意受影响主体</small><strong>'+seen.length+'个</strong></div><div><small>传播计算层数</small><strong>3层</strong></div></div>'+
 byLevel.map((n,i)=>'<div class="rl-wave-row"><span>第'+(i+1)+'层</span><div class="rl-wave-bar"><i style="width:'+Math.max(0,Math.min(100,n/Math.max(1,...byLevel)*100)).toFixed(1)+'%"></i></div><b>'+n+'次节点触达</b></div>').join("")+
 '<div class="rl-run-results-note"><b>本次示意强度较高的关联主体：</b> '+(top.length?top.map(x=>safe(x.entity?.name||x.id)).join('、'):"暂无向其他节点传播")+
 '<br>结果来自当前全数据集的合成/未核验关系，并非屏幕显示的局部子图。示意传播分值不能换算真实损失金额或达标概率。</div>';
}
function bind(){
 if(bound||!section())return;
 section().addEventListener("click",evt=>{
  const mode=evt.target.closest("[data-rl-mode]");
  if(mode){selectedMode=mode.dataset.rlMode;selectedAgg=null;resetResults();render();return;}
  const sect=evt.target.closest("[data-rl-sector]");
  if(sect){filterSector=sect.dataset.rlSector;selectedAgg=null;selectedActor=null;resetResults();render();return;}
  const agg=evt.target.closest("[data-rl-node],[data-rl-select]");
  if(agg){selectedAgg=agg.dataset.rlNode||agg.dataset.rlSelect;renderGraph();return;}
  const edge=evt.target.closest("[data-rl-edge]");
  if(edge){
   const pair=currentAgg?.links.find(x=>x.key===edge.dataset.rlEdge);
   if(pair){selectedAgg=pair.a;renderGraph();}return;
  }
  const actor=evt.target.closest("[data-rl-actor],[data-rl-actor-choice]");
  if(actor){selectedActor=actor.dataset.rlActor||actor.dataset.rlActorChoice;resetResults();renderGraph();renderShockLabel();return;}
  if(evt.target.closest("#rl-run")){run();return;}
  if(evt.target.closest("#rl-reset")){filterSector="all";filterType="all";selectedMode="structure";visibleLimit=24;selectedAgg=null;selectedActor=null;el("rl-shock").value="35";resetResults();render();}
 });
 section().addEventListener("keydown",evt=>{
  if(evt.key!=="Enter"&&evt.key!==" ")return;
  const node=evt.target.closest("[data-rl-node],[data-rl-actor],[data-rl-edge]");
  if(node){evt.preventDefault();node.click();}
 });
 el("rl-type-filter").addEventListener("change",evt=>{filterType=evt.target.value;selectedAgg=null;selectedActor=null;resetResults();render();});
 el("rl-edge-limit").addEventListener("input",evt=>{visibleLimit=Number(evt.target.value);el("rl-edge-limit-output").textContent=visibleLimit+"条";renderGraph();});
 el("rl-shock").addEventListener("input",evt=>{el("rl-shock-value").textContent=evt.target.value+"%";resetResults();});
 bound=true;
}
root.BoluoRelationsPage={
 bind,
 render(state){currentState=state;render();}
};
})(window);
