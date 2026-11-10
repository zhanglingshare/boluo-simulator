(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PATHS={
 new:{name:'新项目兑现',kind:'direct',region:'future',nodes:[
  {title:'项目主体',sub:'谁投资、谁建设？',question:'项目主体、备案内容和实际建设进度，是否对应同一个项目？',evidence:'项目级备案、投资主体、开工日期、施工与设备进场记录。',boundary:'签约数量和计划投资额不等于已经形成固定资产投资，更不等于GDP。'},
  {title:'建设条件',sub:'资金·用地·设备·人才',question:'项目能否按计划取得土地、资金、设备、能源和关键岗位？',evidence:'用地交付、施工许可、设备交付、招聘和投产准备记录。',boundary:'开工不是建成；建设节点必须逐项核验，不能用园区总量代替。'},
  {title:'投产与订单',sub:'产线·客户·持续生产',question:'产线是否真正运行？是否有持续订单、客户和产能利用？',evidence:'设备验收、生产记录、销售开票、订单周期和产能利用率。',boundary:'投产不等于达产；单次试产或一笔订单不能代表稳定经营。'},
  {title:'实际贡献',sub:'增加值·利润·工资',question:'项目新增了多少可核实的本地增加值、利润、工资和就业？',evidence:'企业增加值、营收与利润、工资社保、税收及本地采购。',boundary:'项目投资额不能直接换算成地区生产总值；产值、营收和增加值也不是同一口径。'}
 ]},
 manufacturing:{name:'存量企业扩能',kind:'direct',region:'urban',nodes:[
  {title:'存量企业',sub:'龙头·专精特新·配套厂',question:'哪些既有企业具备订单、市场和扩产基础？',evidence:'企业名录、主营产品、产能利用、客户集中度与经营记录。',boundary:'企业规模大不等于它必然扩产；企业名单不能替代经营数据。'},
  {title:'扩能改造',sub:'技改·设备·产能利用',question:'扩产或技改究竟改变了产能、良率还是单位成本？',evidence:'设备更新、技改项目、产线节拍、良率和单位能耗。',boundary:'设备投入不自动等于生产率提高；必须观察改造前后的可比指标。'},
  {title:'本地供应',sub:'采购·订单·协作',question:'新增产能是否带动本地供应商获得真实订单？',evidence:'采购对象、供应商所在地、合同、发票、回款和交付记录。',boundary:'企业地理邻近不等于供应关系；不能凭产业集聚推断本地采购。'},
  {title:'实际贡献',sub:'产出·利润·岗位',question:'扩能是否带来可持续产出、利润和岗位质量改善？',evidence:'可比口径工业增加值、利润、工资、用工和产能利用率。',boundary:'产值增长可能伴随利润、工资或本地配套不同步，不能只看一个总量。'}
 ]},
 services:{name:'本地价值链延伸',kind:'direct',region:'urban',nodes:[
  {title:'制造业需求',sub:'设计·检测·物流·软件',question:'本地制造企业实际需要哪些专业服务？',evidence:'企业服务采购清单、外包合同、物流费用、检测与软件支出。',boundary:'服务业门类存在不等于制造企业已经购买本地服务。'},
  {title:'服务供给',sub:'本地机构与专业能力',question:'本地服务商是否具备资质、交付能力和稳定供给？',evidence:'服务商名录、资质、人员技能、交付周期和服务质量。',boundary:'注册机构数量不等于有效供给能力，也不代表其客户在博罗。'},
  {title:'真实交易',sub:'合同·采购·回款',question:'制造企业是否与本地服务商发生持续、可核验的交易？',evidence:'采购合同、发票、付款记录、客户所在地和复购情况。',boundary:'意向合作、园区签约或企业之间的关系线索不等于实际交易。'},
  {title:'价值留存',sub:'服务收入·效率·本地增加值',question:'本地服务交易是否形成收入、就业和制造效率改善？',evidence:'服务业营业收入、工资、企业成本变化和本地增加值。',boundary:'不能把服务业营业收入与制造业增加值直接相加，需避免重复计算。'}
 ]},
 innovation:{name:'创新与生产率',kind:'enabler',region:'future',nodes:[
  {title:'研发与人才',sub:'企业需求·研发人员',question:'研发方向是否对应企业真实的生产和市场问题？',evidence:'研发人员、研发投入、技术需求、专利与研发项目记录。',boundary:'研发投入和专利数量不等于技术已经产业化。'},
  {title:'技术验证',sub:'中试·检测·应用验证',question:'技术是否通过中试、检测和客户验证？',evidence:'中试记录、检测报告、试用反馈、技术合同与验证周期。',boundary:'实验室成果不等于稳定量产；技术成熟度需要分阶段判断。'},
  {title:'生产转化',sub:'工艺·产品·设备应用',question:'技术是否进入生产线、产品或工艺流程？',evidence:'生产线应用记录、新产品销售、工艺变更和设备运行数据。',boundary:'设备采购或项目立项不等于技术已进入稳定生产。'},
  {title:'效率变化',sub:'良率·效率·新产品收入',question:'技术应用是否带来可比的效率、良率或新产品收入变化？',evidence:'单位工时产出、良率、单位能耗、新产品收入及利润。',boundary:'效率提升需要同口径前后比较，不能把技术投入直接算作GDP贡献。'}
 ]},
 connect:{name:'外部连接与城市承载',kind:'enabler',region:'east',nodes:[
  {title:'外部资源',sub:'市场·技术·人才',question:'博罗希望连接的外部市场、技术和人才具体在哪里？',evidence:'客户地域、合作项目、人才流动、技术合作和物流方向。',boundary:'融湾是方向，不是自动发生的订单、人才流入或技术转移。'},
  {title:'连接条件',sub:'交通·渠道·制度·平台',question:'跨区域合作需要的交通、渠道、规则和平台是否可用？',evidence:'通勤时耗、物流时效、合作协议执行、平台服务与制度安排。',boundary:'基础设施建成不等于企业已经使用；签约合作不等于业务持续发生。'},
  {title:'区域协作',sub:'订单·供应·人才流动',question:'连接是否形成跨区域订单、供应协作或人才流动？',evidence:'跨区域合同、采购来源、物流流量、岗位来源和人才流动记录。',boundary:'流量增加不等于本地价值留存，必须辨别价值创造和价值经过。'},
  {title:'本地承接',sub:'增加值·岗位·服务需求',question:'外部资源进入后，本地企业和居民是否获得实际机会？',evidence:'本地供应商订单、就业岗位、工资、服务采购与税收。',boundary:'不能把外部市场规模直接当成本地收益；需要追踪收益落点。'}
 ]}
};
const PAIRS=[
 {ids:['new','services'],title:'新项目 × 本地价值链',question:'新项目投产后，设计、检测、物流和专业服务能否由本地企业承接？',evidence:'项目服务采购清单、本地供应商合同、发票与回款记录。',boundary:'园区内有服务商，不代表项目已经采购。'},
 {ids:['manufacturing','innovation'],title:'存量扩能 × 创新生产率',question:'技改和技术应用能否提高良率、效率，或带来新产品收入？',evidence:'技改前后产线数据、良率、单位能耗、新产品销售。',boundary:'不能把设备投资和研发投入直接相加为新增贡献。'},
 {ids:['services','connect'],title:'本地服务 × 外部连接',question:'外部客户和市场是否通过本地设计、检测、物流等服务留下更多价值？',evidence:'客户地域、服务合同、本地服务收入与跨区域订单。',boundary:'市场连接不自动带来本地服务订单。'},
 {ids:['manufacturing','connect'],title:'存量扩能 × 外部市场',question:'新增产能是否获得更稳定的外部客户，同时带动本地配套？',evidence:'客户集中度、订单周期、供应商交易与产能利用。',boundary:'外部订单增长不必然意味着本地供应链同步增强。'},
 {ids:['innovation','services'],title:'创新生产率 × 专业服务',question:'研发、中试、检测和工业软件能否形成持续的本地服务交易？',evidence:'技术服务合同、中试检测订单、软件服务采购与成果转化记录。',boundary:'科研合作或技术平台存在，不代表商业化服务已经发生。'}
];
const VALID=Object.keys(PATHS),qs=new URL(location.href).searchParams;
const impactRoute=qs.get('from')==='impact'?({projects:'new',orders:'manufacturing',livelihood:'connect'}[qs.get('scene')]||'new'):'new';
const fromRoute=VALID.includes(qs.get('route'))?qs.get('route'):impactRoute;
const fromQuery=(qs.get('paths')||'').split(',').filter(x=>VALID.includes(x)).slice(0,3);
const state={selected:fromQuery.length?fromQuery:[fromRoute],primary:fromRoute,node:''};
if(!state.selected.includes(state.primary))state.primary=state.selected[0];
state.node=state.primary+':0';
const toast=msg=>{
 const e=$('toast');if(!e)return;e.textContent=msg;e.classList.add('on');
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('on'),2400);
};
function syncURL(){
 const u=new URL(location.href);
 u.searchParams.set('paths',state.selected.join(','));
 u.searchParams.set('route',state.primary);
 history.replaceState(null,'',u.pathname+u.search+u.hash);
 if(window.BoluoPlan?.setRoute)window.BoluoPlan.setRoute(state.primary);
}
let playTimer=null,playIndex=0;
const PATH_ORDER=Object.keys(PATHS);
const SHORT={new:'新项目',manufacturing:'存量扩能',services:'本地服务',innovation:'创新生产率',connect:'外部连接'};
function stopPlayback(){
 if(playTimer!==null){clearInterval(playTimer);playTimer=null;}
 const btn=$('pathPlay');if(btn){btn.textContent='▶ 播放路径';btn.setAttribute('aria-pressed','false');}
}
function inspector(){
 const [id,indexText]=state.node.split(':'),path=PATHS[id]||PATHS[state.primary],i=Math.max(0,Math.min(3,Number(indexText)||0)),n=path.nodes[i];
 const pct=(i+1)/4*100;
 $('pathInspector').innerHTML=
 '<div class="path-inspector-top"><span class="path-inspector-kicker">'+(path.kind==='direct'?'直接贡献':'放大条件')+' / '+SHORT[id]+'</span><b>环节 '+String(i+1).padStart(2,'0')+' / 04</b></div>'+
 '<h4>'+n.title+'</h4><p>'+n.question+'</p>'+
 '<div class="path-inspector-track"><i style="width:'+pct+'%"></i></div>'+
 '<div class="path-inspector-block"><small>证据点 · 待核验</small><strong>'+n.evidence+'</strong></div>'+
 '<details class="path-inspector-more"><summary>推断边界</summary><p>'+n.boundary+'</p></details>';
 document.querySelectorAll('[data-path-node]').forEach(el=>el.classList.toggle('is-focused',el.dataset.pathNode===state.node));
}
function synergy(){
 const matrix=$('synergyMatrix'),detail=$('synergyDetail');
 const pairs=PAIRS.map(p=>({ ...p,key:[...p.ids].sort().join('|') }));
 let html='<div class="synergy-axis-corner">×</div>';
 PATH_ORDER.forEach(id=>html+='<div class="synergy-axis-label">'+SHORT[id]+'</div>');
 PATH_ORDER.forEach((rowId,ri)=>{
  html+='<div class="synergy-row-label">'+SHORT[rowId]+'</div>';
  PATH_ORDER.forEach((colId,ci)=>{
   if(ri===ci){html+='<span class="synergy-cell is-diagonal" aria-hidden="true">·</span>';return;}
   const pair=pairs.find(p=>p.key===[rowId,colId].sort().join('|'));
   if(!pair){html+='<span class="synergy-cell is-empty" aria-label="尚未定义互补假设"></span>';return;}
   const active=state.selected.includes(rowId)&&state.selected.includes(colId);
   html+='<button type="button" class="synergy-cell is-potential '+(active?'is-active':'')+'" data-pair="'+pair.ids.join(',')+'" aria-pressed="'+active+'" title="'+pair.title+'：点击试验这组路径"><i></i></button>';
  });
 });
 matrix.innerHTML=html;
 const selectedPairs=pairs.filter(p=>p.ids.every(id=>state.selected.includes(id)));
 if(state.selected.length<2){
  detail.innerHTML='<strong>选择第二条路径</strong><span>矩阵亮点代表可供检验的互补假设，不代表已发生的协同。</span>';
 }else if(selectedPairs.length){
  detail.innerHTML=selectedPairs.map(p=>'<article><b>'+p.title+'</b><span>'+p.question+'</span><small>核验：'+p.evidence+'</small></article>').join('');
 }else{
  detail.innerHTML='<strong>当前组合尚无预设互补关系</strong><span>不代表两条路径没有关系。需要进一步核对是否共享资源、争夺要素或形成真实交易。</span>';
 }
}
function graph(){
 const svg=$('pathGraph'),xs=[150,410,670,930],w=184,h=174+(state.selected.length-1)*154;
 let out='<defs><linearGradient id="pathLine" x1="0" x2="1"><stop stop-color="#38c9b4"/><stop offset=".52" stop-color="#65c4ee"/><stop offset="1" stop-color="#f0bd72"/></linearGradient><filter id="pathGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
 state.selected.forEach((id,row)=>{
  const path=PATHS[id],y=132+row*154,primary=id===state.primary;
  out+='<g class="path-row-label '+(primary?'is-primary':'')+'"><text x="22" y="'+(y-63)+'">'+String(row+1).padStart(2,'0')+' / '+(path.kind==='direct'?'直接贡献':'放大条件')+'</text><text x="22" y="'+(y-43)+'">'+SHORT[id]+'</text></g>';
  for(let i=0;i<3;i++){
   const x1=xs[i]+w/2-1,x2=xs[i+1]-w/2+1,edgeId='path-flow-'+row+'-'+i;
   const d='M'+x1+' '+y+' C'+(x1+32)+' '+(y-27)+' '+(x2-32)+' '+(y+27)+' '+x2+' '+y;
   out+='<path id="'+edgeId+'" class="path-edge '+(primary?'is-primary':'')+'" d="'+d+'"/>'+
    '<circle class="flow-particle '+(primary?'is-primary':'')+'" r="'+(primary?5:3.5)+'"><animateMotion dur="'+(2.4+i*.32)+'s" begin="'+(row*.18+i*.2)+'s" repeatCount="indefinite"><mpath href="#'+edgeId+'"/></animateMotion></circle>';
  }
  path.nodes.forEach((n,i)=>{
   const active=state.node===id+':'+i,colors=['#167f83','#276d91','#9a7040','#247d69'];
   out+='<g class="path-node '+(active?'is-focused':'')+' '+(primary?'is-primary':'')+'" data-path-node="'+id+':'+i+'" tabindex="0" role="button" aria-label="'+n.title+'，待核验。'+n.question+'" transform="translate('+xs[i]+','+y+')">'+
    '<circle class="path-node-halo" r="52"/>'+
    '<rect x="'+(-w/2)+'" y="-42" width="'+w+'" height="84" rx="14" fill="'+colors[i]+'"/>'+
    '<circle class="path-node-index-bg" cx="'+(-w/2+19)+'" cy="-20" r="11"/>'+
    '<text class="path-node-index" x="'+(-w/2+19)+'" y="-16" text-anchor="middle">'+String(i+1).padStart(2,'0')+'</text>'+
    '<text class="path-node-title" x="0" y="-5" text-anchor="middle">'+n.title+'</text>'+
    '<text class="path-node-sub" x="0" y="15" text-anchor="middle">'+n.sub+'</text>'+
    '<text class="path-node-status" x="0" y="31" text-anchor="middle">● 待核验</text></g>';
  });
 });
 svg.setAttribute('viewBox','0 0 1080 '+h);svg.innerHTML=out;
}
function targetVisuals(){
 const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rings=[...document.querySelectorAll('[data-ring]')],bars=[...document.querySelectorAll('[data-bar]')],hero=$('.hero-gap-track i'),counter=$('[data-count-to]');
 rings.forEach(el=>{el.style.strokeDasharray='295.31';el.style.strokeDashoffset='295.31';});
 bars.forEach(el=>{el.style.width='0%';});
 if(hero)hero.style.width='0%';
 if(counter)counter.textContent=reduce?'594.55':'0.00';
 const animate=()=>{
  rings.forEach(el=>{const v=Math.max(0,Math.min(100,Number(el.dataset.ring)||0));el.style.strokeDashoffset=String(295.31*(1-v/100));});
  bars.forEach(el=>{el.style.width=Math.max(0,Math.min(100,Number(el.dataset.bar)||0))+'%';});
  if(hero)hero.style.width='62.8%';
 };
 if(reduce){animate();return;}
 requestAnimationFrame(animate);
 if(counter){
  const start=performance.now(),duration=1050,target=594.55;
  const tick=now=>{const t=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-t,3);counter.textContent=(target*eased).toFixed(2);if(t<1)requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
 }
}
function togglePlayback(){
 if(playTimer!==null){stopPlayback();return;}
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){toast('系统已减少动态效果，可手动点击节点逐环查看。');return;}
 const btn=$('pathPlay');playIndex=0;
 const advance=()=>{
  const id=state.primary;state.node=id+':'+playIndex;graph();inspector();
  playIndex=(playIndex+1)%4;
 };
 advance();btn.textContent='Ⅱ 暂停';btn.setAttribute('aria-pressed','true');
 playTimer=setInterval(advance,1350);
}
function updateWindLink(){
 const a=$('enterWind');if(!a)return;
 const u=new URL('./wind.html',location.href);
 u.searchParams.set('from','plan');u.searchParams.set('route',state.primary);
 u.searchParams.set('region',PATHS[state.primary].region);u.searchParams.set('paths',state.selected.join(','));
 u.hash='results';a.href=u.href;
}
function render(){
 document.querySelectorAll('[data-path]').forEach(b=>{
  const on=state.selected.includes(b.dataset.path);
  b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-selected',on);
 });
 $('pathCount').textContent=state.selected.length+' / 3';
 $('pathBuildStatus').textContent='已选 '+state.selected.length+' 条 · '+state.selected.map(id=>SHORT[id]).join(' + ')+' · 流线仅表示机制假设。';
 graph();inspector();synergy();updateWindLink();
}
document.querySelectorAll('[data-path]').forEach(b=>b.addEventListener('click',()=>{
 const id=b.dataset.path;stopPlayback();
 if(state.selected.includes(id)){
  if(state.selected.length===1){toast('至少保留一条路径。');return;}
  state.selected=state.selected.filter(x=>x!==id);
  if(state.primary===id)state.primary=state.selected[state.selected.length-1];
 }else{
  if(state.selected.length>=3){toast('一次最多组合三条路径。');return;}
  state.selected.push(id);state.primary=id;
 }
 state.node=state.primary+':0';syncURL();render();
}));
$('pathGraph').addEventListener('click',e=>{
 const n=e.target.closest('[data-path-node]');if(!n)return;stopPlayback();state.node=n.dataset.pathNode;graph();inspector();
});
$('pathGraph').addEventListener('keydown',e=>{
 if(!['Enter',' '].includes(e.key))return;const n=e.target.closest('[data-path-node]');if(!n)return;
 e.preventDefault();stopPlayback();state.node=n.dataset.pathNode;graph();inspector();
});
$('pathPlay').addEventListener('click',togglePlayback);
$('pathReset').addEventListener('click',()=>{
 stopPlayback();state.selected=[state.primary];state.node=state.primary+':0';syncURL();render();toast('已重置为当前主路径。');
});
$('synergyMatrix').addEventListener('click',e=>{
 const cell=e.target.closest('[data-pair]');if(!cell)return;
 const ids=cell.dataset.pair.split(',');stopPlayback();state.selected=ids;state.primary=ids[0];state.node=state.primary+':0';syncURL();render();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
window.addEventListener('pagehide',stopPlayback);
window.addEventListener('popstate',()=>{
 stopPlayback();const q=new URL(location.href).searchParams,route=VALID.includes(q.get('route'))?q.get('route'):'new';
 const paths=(q.get('paths')||'').split(',').filter(x=>VALID.includes(x)).slice(0,3);
 state.selected=paths.length?paths:[route];state.primary=state.selected.includes(route)?route:state.selected[0];state.node=state.primary+':0';render();
 if(window.BoluoPlan?.setRoute)window.BoluoPlan.setRoute(state.primary);
});
window.BoluoPathLab={getSelected:()=>state.selected.slice(),getPrimary:()=>state.primary};
render();targetVisuals();
if(window.BoluoPlan?.setRoute)window.BoluoPlan.setRoute(state.primary);
})();