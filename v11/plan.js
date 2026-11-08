(() => {
'use strict';
const $=id=>document.getElementById(id);
const all=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=(v,allowed,fallback)=>allowed.includes(v)?v:fallback;
const SOURCES={
 goals:{title:'十五五主要目标与2025年基数',url:'https://epaper.nfnews.com/nfdaily/html/202601/27/content_10161535.html',date:'2026-01-27'},
 review:{title:'2026年政府工作报告回顾十四五成果',url:'https://epaper.nfnews.com/nfdaily/html/202602/03/content_10162180.html',date:'2026-02-03'},
 regions:{title:'三区三核空间功能与镇街范围',url:'https://epaper.nfnews.com/nfdaily/html/202512/30/content_10158677.html',date:'2025-12-30'},
 layout:{title:'千亿强县再出发，三区三核开新局',url:'https://epaper.nfnews.com/nfdaily/html/202610/30/content_10184753.html?origin=4',date:'2026-10-30'},
 annual:{title:'2026年博罗政府工作报告主要目标',url:'https://epaper.nfnews.com/nfdaily/html/202602/06/content_10162500.html',date:'2026-02-06'},
 latest:{title:'博罗2026年前三季度主要经济运行数据',url:'https://www.fz0752.com/fontHtml/html/issue/000143025_1.html',date:'2026-11-05'},
 future:{title:'博罗与深圳福田共建罗浮未来城',url:'https://www.chinanews.com/dwq/2026/08-25/10683931.shtml',date:'2026-08-25'},
 government:{title:'博罗县政府门户网站（2026年8月31日列示纲要印发通知）',url:'https://www.boluo.gov.cn/',date:'2026-08-31'}
};
const GOALS={
 scale:[
  {id:'gdp',label:'地区生产总值',title:'1600亿元',base:'1005.45亿元',year:'2025年GDP（已公布）',goal:'1600亿元',share:1005.45/1600*100,gap:'静态差额 594.55亿元',warning:'以2025年GDP与2030年规划目标做规模对照，不是未来增长贡献或达标概率。'},
  {id:'firms',label:'规上工业企业',title:'突破2500家',base:'1407家',year:'2025年期末企业数',goal:'突破2500家',share:1407/2500*100,gap:'较2500家门槛至少多1094家',warning:'目标是“突破2500家”；1407家为2025年历史基数。增加量不是只需新注册企业，还包含升规、退规、迁移。'},
  {id:'industry',label:'规上工业总产值',title:'突破3600亿元',base:'预计突破2000亿元',year:'2025年预计口径',goal:'突破3600亿元',share:null,gap:'历史基数仍需年报确认',warning:'2025年“预计突破2000亿元”不是可比的精确最终数，不据此画出具体达成百分比或净差额。'},
  {id:'innovation',label:'高新技术企业',title:'突破900家',base:'710家',year:'2025年存量数',goal:'突破900家',share:710/900*100,gap:'超过900家门槛需净增加至少191家',warning:'高新技术企业存量目标与规上工业企业数量口径不同，不可相加。'}
 ],
 quality:[
  {id:'qSupply',label:'本地供应网络',title:'订单是否留在博罗',base:'缺少县域完整采购矩阵',year:'待补充县域交易资料',goal:'观察真实本地采购',share:null,gap:'优先补：供应商与订单',warning:'该项是研究性观察维度，未把它冒充官方2030年量化目标。'},
  {id:'qRnD',label:'研发与技术',title:'研发能否转化成果',base:'有公开企业与研发信号',year:'需确认可比统计口径',goal:'观察投入与转化',share:null,gap:'优先补：研发及产出',warning:'企业数量增长不等于研发产出增长，不虚构研发投入达成度。'},
  {id:'qServices',label:'生产性服务业',title:'设计与物流能否配套',base:'产业规划已提出方向',year:'规模与岗位数据待核',goal:'观察服务型制造',share:null,gap:'优先补：服务交易与岗位',warning:'生产性服务业具有多种分类与统计范围，未核实数据前不做定量占比。'},
  {id:'qPeople',label:'居民实际受益',title:'岗位与生活是否同步',base:'不同镇街数据不齐',year:'缺少连续可比序列',goal:'观察收入与承载',share:null,gap:'优先补：工资、通勤、服务',warning:'县域GDP不等于个人收入，也不意味着公共服务在每个镇街同步改善。'}
 ]
};
const N=(id,name,sub,kind,ask,description)=>({id,name,sub,kind,ask,description});
const REGIONS={
 future:{
 title:'罗浮未来城 · 产业与城市功能一起生长',role:'产城人文旅融合未来城区',
 headline:'产业聚集之后，人能否真正住下来？',
 description:'石湾、园洲、长宁与跨区域协作构成重要空间安排；生产、交通、居住与公共服务需要共同观察。布局并不等于所有配套已经建成。',
 question:'新增产业岗位能否与实际住房、通勤、教育和医疗形成可达的连接？',
 source:'future', evidence:'“三区三核”、罗浮未来城及福博共建方向有公开依据；实际承载与就业协同还需要项目级与出行数据。',
 nodes:[
 N('towns','石湾·园洲','县域副中心','planned','园区岗位和周边通勤如何衔接？','石湾、园洲构成县域副中心，是罗浮未来城空间布局的重要组成部分。'),
 N('luofu','长宁·罗浮山','文旅与城镇功能','planned','文旅、康养与日常生活服务有没有联动？','长宁及罗浮山相关区域参与未来城区谋划；需分别查看项目和功能进展。'),
 N('industry','先进制造','产业与订单','planned','已有产线和本地供应网络是否真正连接？','三大主导产业和制造业集聚是发展方向，不能自动推断某家企业已形成新订单。'),
 N('shenzhen','福博协同','跨区域合作','planned','合作项目是否已经由签约进入落地？','深圳福田与博罗对口协作、未来城协同规划有公开报道，实际建设和经营应分开核实。'),
 N('commute','通勤与住房','产城依赖','condition','跨镇交通与居住成本是否阻碍就业承接？','交通、就业与居住构成可能的承载条件，需要实际时耗和居住数据验证。'),
 N('service','学校与医疗','公共服务承载','condition','新增人口是否对应足够的学位、医疗和养老服务？','教育、医疗与人口吸引力之间存在需要调查的机制联系。')
 ]},
 urban:{
 title:'县域主城 · 制造升级与综合服务衔接',role:'同城融湾先行区',
 headline:'产业能力在增强，城市服务会同步升级吗？',
 description:'以罗阳、龙溪、龙华和县城周边空间为重要功能范围，关注新一代电子信息、新材料、服务业与综合服务承接。',
 question:'高端制造、研发、现代物流和城市服务之间，有没有可核实的协同？',
 source:'regions', evidence:'县域主城的空间功能和产业方向有公开布局；真实供应链订单与新增高质量岗位仍待核对。',
 nodes:[
 N('luoyang','罗阳·龙溪','主城产业服务','planned','产业、就业、城市服务是否相互支撑？','县域主城以罗阳、龙溪等地区为重点，承担综合服务与产业升级功能。'),
 N('longhua','龙华·湖镇周边','空间协同','planned','产业功能是否有清晰分工、交通是否可达？','公开空间构想涉及龙华与湖镇靠县城区域，具体边界和建设项目应以正式规划为准。'),
 N('electronics','电子信息','主导产业','planned','企业增长能否转化为本地技术和供应？','新一代电子信息是博罗三大主导产业之一，不能直接由产值推断研发和采购网络。'),
 N('park','经济开发区','一区多园方向','planned','园区项目具体到了哪个阶段？','县域主城强调高标准建设省级经济开发区，实施园区承载能力建设。'),
 N('research','研发与人才','技术条件','condition','企业研发需求与人才供给是否匹配？','研发、产业和人才是可能的联动条件，需研发投入、岗位与技能数据核实。'),
 N('logistics','现代物流服务','生产性服务','condition','企业是否能获得足够的设计、供应链与物流服务？','生产性服务业拟促进先进制造，具体产业服务交易尚待核实。')
 ]},
 east:{
 title:'博东新城 · 把农业、加工与消费连接起来',role:'城乡三产融合样板区',
 headline:'农产品走出村庄之后，价值留在谁手里？',
 description:'博东八镇围绕现代农业、食品加工、农文旅及商贸服务展开布局，杨村—杨侨一体规划博东新城。',
 question:'从种养到加工、仓储、品牌和市场，哪个环节最需要补上？',
 source:'regions',evidence:'博东八镇、食品谷和杨村—杨侨建设方向有公开报道；农产品实际利润分配和交易网络仍需逐环核对。',
 nodes:[
 N('yangcun','杨村·杨侨','博东新城核心','planned','服务中心能否降低企业与农户的交易成本？','杨村、杨侨一体规划博东新城，建设商贸与综合服务中心。'),
 N('towns','博东八镇','县域东部','planned','区域之间的加工和消费联系是否已形成？','涉及泰美、柏塘、公庄、杨村、杨侨、麻陂、观音阁、石坝等镇的功能分工。'),
 N('farm','现代农业','农产品生产','planned','产地到加工地的批次、运输与损耗如何？','现代农业和标准化生产是产业发展方向，但不能直接推出农户实际增收。'),
 N('food','食品加工','食品谷方向','planned','加工端是否具备长期订单与回款能力？','食品谷及农产品加工服务是规划布局，不代表企业利润已实现。'),
 N('tourism','农文旅康养','服务与消费','condition','游客消费是否进入农户、加工和本地商户？','文旅消费能否形成更广泛收入，需要过夜停留、消费与本地采购等证据。'),
 N('market','冷链与市场','交易流通条件','condition','冷链、回款和销售渠道怎样衔接？','流通设施与稳定采购是可能的制约环节，具体经营数据尚不完整。')
 ]}
};
const ROUTES={
 new:{title:'项目引进后，真正形成产出了吗？',subtitle:'签约、开工、建成、投产、形成产出逐层核实；规划金额不能当作实际GDP。',region:'future',question:'缺的是项目真实进度，还是投产后的订单和产出？'},
 manufacturing:{title:'主导产业扩能，配套企业能否一起成长？',subtitle:'三大主导产业的企业扩张不等于本地配套自动增长，应跟踪采购、产能与利润。',region:'urban',question:'产业规模增长，有多少来自新增产能与本地采购？'},
 innovation:{title:'科技与未来产业，如何跨过成果转化？',subtitle:'研发投入、技术验证、产业化、规模化经营是不同阶段。',region:'future',question:'研发活动能否持续形成可验证的产品、订单与价值？'},
 services:{title:'生产性服务业，能否成为制造升级的“第二引擎”？',subtitle:'设计、测试、物流、软件与专业服务应逐项确认需求与交易。',region:'urban',question:'企业需要的服务，能否被本地供应并形成实际收益？'},
 connect:{title:'跨城合作与城乡融合，怎样走向真实收益？',subtitle:'区域合作、城镇建设、农产品流通和居民受益需要不同的落实证据。',region:'east',question:'跨区域市场与城乡经济联系，真正落在哪些订单和服务上？'}
};
const STAGES=[
 {badge:'历史累计项目 · 引进',title:'十四五时期园区引进项目646宗',text:'政府工作报告历史回顾披露“园区引进项目646宗”。它是五年内的累计项目记录，不意味着其中646个在2026年都处于同一建设阶段。',source:'review'},
 {badge:'项目状态 · 待核实',title:'开工不能用签约数量替代',text:'需要明确每个项目的批准、土地、建设手续和实际开工日期；目前没有项目逐宗清单，不展示自造的开工数量。',source:'review'},
 {badge:'施工完成 · 待核实',title:'建成、验收和移交是不同节点',text:'厂房封顶、设备安装、验收交付和正式运营之间可能存在时间差。需要阶段记录确认，不能自动跳过。',source:'annual'},
 {badge:'历史累计项目 · 投产',title:'十四五时期园区投产项目458宗',text:'这是另一项历史累计披露。引进646宗与投产458宗未证实为同一封闭批次，不得直接相减或算作投产转化率。',source:'review'},
 {badge:'实际贡献 · 待核实',title:'投产不等于达产，更不等于GDP贡献',text:'最后要核对产能利用、销售、增加值、利润、工资以及真实的本地配套。项目投资规模不可以直接转换为地区生产总值。',source:'latest'}
];
const YEAR={
 2026:{plan:'年度GDP增长预期 6.5%—7%',detail:'政府工作报告的2026年目标；不是全年实绩。',fact:'前三季度GDP同比 +4.1%',factDetail:'2026年1—9月累计，同比增长；同时规上工业增加值+8.9%，工业投资−44.7%。',warning:'截至2026年前三季度的累计同比不等于全年结果，也不能直接作2030年目标兑现率。'},
 2027:{plan:'未录入经核实的2027年度分解目标',detail:'需要当年正式年度计划与具体项目清单；不通过线性插值伪造任务。',fact:'年度实际数据尚未发生',factDetail:'截至2026-11-07，2027年在未来。',warning:'未来年份留白，不等于计划不存在；只表示本次公开来源尚未核实相应年度指标。'},
 2028:{plan:'未录入经核实的2028年度分解目标',detail:'应以届时正式年度计划和动态更新为准。',fact:'年度实际数据尚未发生',factDetail:'截至2026-11-07，2028年在未来。',warning:'不能把2030目标均匀分配到2028并冒充政府考核要求。'},
 2029:{plan:'未录入经核实的2029年度分解目标',detail:'后续年度规划实施评估与项目兑现进度需独立核验。',fact:'年度实际数据尚未发生',factDetail:'截至2026-11-07，2029年在未来。',warning:'规划进度的判断需要项目、经济和公共服务的真实观察。'},
 2030:{plan:'GDP达到1600亿元；规上工业企业突破2500家',detail:'十五五总体规划目标，另有规上工业总产值突破3600亿元等目标。',fact:'2030年尚无实际结果',factDetail:'2030年度实绩应待届时公布。',warning:'规划目标只是应努力达到的状态，绝不能提前展示为已实现的成果。'}
};
const GAPS={
 project:{title:'一个项目从签约到实际产出，隔着几道门？',text:'项目总量是起点，不是经济成果。把逐宗进度与企业产出分开核对，才知道哪一环节真正出现延迟。',evidence:'优先补充：项目级开工、建设、投产、达产和产出记录'},
 supply:{title:'产业集聚不等于本地采购已经发生。',text:'园区里企业邻近不等于互相供货。真正重要的是可核实的采购、订单、付款以及备用客户。',evidence:'优先补充：本地采购占比、订单对象与供应替代'},
 people:{title:'就业岗位形成了，生活服务跟得上吗？',text:'从厂区到工作岗位，再到居住、交通、学校和医疗，是不同的兑现阶段；统计总量可能掩盖局部供需错位。',evidence:'优先补充：招聘、工时、通勤、住房、学位与医疗可达性'}
};
const params=new URLSearchParams(location.search);
const state={
 region:pick(params.get('region'),Object.keys(REGIONS),'future'),
 route:pick(params.get('route'),Object.keys(ROUTES),'new'),
 goalMode:pick(params.get('lens'),['scale','quality'],'scale'),
 goal:params.get('goal')||'gdp',
 stage:Math.min(4,Math.max(0,Number(params.get('stage'))||0)),
 year:pick(params.get('year'),Object.keys(YEAR),'2026'),
 gap:pick(params.get('gap'),Object.keys(GAPS),'project'),
 focus:'',playing:false,step:6,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches
};
if(!GOALS[state.goalMode].some(x=>x.id===state.goal))state.goal=GOALS[state.goalMode][0].id;
const fromImpact=params.get('from')==='impact'?pick(params.get('scene'),['projects','orders','livelihood'],'projects'):null;
if(fromImpact && !params.has('route')) state.route={projects:'new',orders:'manufacturing',livelihood:'connect'}[fromImpact];
if(fromImpact && !params.has('region')) state.region=ROUTES[state.route].region;
const initialFocus=params.get('focus');
if(REGIONS[state.region].nodes.some(n=>n.id===initialFocus))state.focus=initialFocus;
let timer=0,toastTimer=0,yearTimer=0;
function stop(){
 if(timer)clearInterval(timer);timer=0;state.playing=false;
 $('playNetwork').setAttribute('aria-pressed','false');$('playNetwork').innerHTML='▶ <span>播放</span>';
 $('planGraph').classList.remove('playing');
}
function toast(msg){const e=$('toast');e.textContent=msg;e.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('on'),2700);}
function syncURL(){
 try{const u=new URL(location.href);Object.entries({region:state.region,route:state.route,lens:state.goalMode,goal:state.goal,stage:state.stage,year:state.year,gap:state.gap}).forEach(([k,v])=>u.searchParams.set(k,String(v)));if(state.focus)u.searchParams.set('focus',state.focus);else u.searchParams.delete('focus');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}
}
function goalRender(){
 const arr=GOALS[state.goalMode],g=arr.find(x=>x.id===state.goal)||arr[0];
 all('[data-goal]').forEach((b,i)=>{
  const v=arr[i];b.dataset.goal=v.id;b.innerHTML='<small>'+esc(v.label)+'</small><strong>'+esc(v.title)+'</strong>';b.setAttribute('aria-pressed',String(v.id===g.id));
 });
 all('[data-lens]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lens===state.goalMode)));
 $('baseValue').textContent=g.base;$('baseYear').textContent=g.year;$('goalValue').textContent=g.goal;
 $('goalLimit').textContent=state.goalMode==='quality'?'研究性观察方向':'2030规划目标，非实绩';
 $('goalGap').textContent=g.gap;$('goalWarning').textContent=g.warning;
 $('goalShare').textContent=g.share===null?'没有可核实的同口径目标进度':'2025历史基数约为目标门槛的'+g.share.toFixed(1)+'%';
 $('goalFill').style.width=(g.share===null?0:g.share.toFixed(2))+'%';
 const progress=$('goalProgress');if(g.share===null){progress.removeAttribute('aria-valuenow');progress.setAttribute('aria-valuetext','暂无可核实量化对照');}else{progress.setAttribute('aria-valuenow',String(Math.round(g.share)));progress.setAttribute('aria-valuetext',g.share.toFixed(1)+'% 为历史基数对照，不是达标率');}
 $('qualityNote').textContent=state.goalMode==='quality'?'没有核实的2030定量目标时，质量维度不显示虚假百分比。':'规模是目标，兑现必须追踪实际贡献。';
}
function point(n,i,mobile){
 if(mobile){
  const a=[[102,65],[318,65],[102,284],[318,284],[102,371],[318,371]];
  return {x:a[i][0],y:a[i][1],w:149,h:57};
 }
 const a=[[203,121],[710,120],[156,318],[761,318],[315,440],[621,440]];
 return {x:a[i][0],y:a[i][1],w:184,h:69};
}
function edgePath(a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 const d=Math.sqrt(dx*dx+dy*dy)||1;
 const sx=a.x+dx/d*91,sy=a.y+dy/d*46;
 const ex=b.x-dx/d*72,ey=b.y-dy/d*31;
 const bend=dx<0?-24:24;
 return 'M'+sx.toFixed(1)+','+sy.toFixed(1)+' Q'+((sx+ex)/2+bend).toFixed(1)+','+((sy+ey)/2-18).toFixed(1)+' '+ex.toFixed(1)+','+ey.toFixed(1);
}
function graphRender(){
 const reg=REGIONS[state.region],svg=$('planGraph'),mobile=matchMedia('(max-width:720px)').matches;
 const w=mobile?420:920,h=mobile?420:505;
 svg.setAttribute('viewBox','0 0 '+w+' '+h);
 const center={x:w/2,y:mobile?190:250,w:mobile?194:235,h:mobile?81:99};
 const pts=reg.nodes.map((n,i)=>point(n,i,mobile));
 let edges='<g aria-hidden="true">',nodes='';
 reg.nodes.forEach((n,i)=>{
   const p=pts[i],active=i<state.step;
   const dim=state.focus&&state.focus!==n.id;
   const cls=(n.kind==='condition'?' conditional':'')+(active?' lit':' waiting')+(dim?' dimmed':'');
   edges+='<path class="p-edge'+cls+'" d="'+edgePath(center,p)+'"/>';
 });
 edges+='</g>';
 nodes+='<g class="p-node '+(state.focus?'dimmed':'')+'" data-kind="core" data-node="core" transform="translate('+center.x+','+center.y+')" tabindex="0" role="button" aria-label="'+esc(reg.title)+'，点击查看区域中心">'+
 '<rect x="'+(-center.w/2)+'" y="'+(-center.h/2)+'" rx="22" width="'+center.w+'" height="'+center.h+'"/>'+
 '<text y="-6">'+esc(state.region==='future'?'罗浮未来城':state.region==='urban'?'县域主城':'博东新城')+'</text><text class="p-sub" y="24">2030规划空间核心</text></g>';
 reg.nodes.forEach((n,i)=>{
   const p=pts[i],active=i<state.step,dim=state.focus&&state.focus!==n.id;
   nodes+='<g class="p-node '+(state.focus===n.id?'active ':'')+(dim?'dimmed ':'')+(!active?'pending ':'')+(state.playing?(i===state.step-1?'newly-lit':'no-entry'):'')+'" data-node="'+esc(n.id)+'" data-kind="'+(n.kind==='condition'?'condition':'planned')+'" tabindex="0" role="button" aria-label="'+esc(n.name)+'，'+esc(n.sub)+'" transform="translate('+p.x+','+p.y+')" style="animation-delay:'+(i*90)+'ms">'+
   '<rect x="'+(-p.w/2)+'" y="'+(-p.h/2)+'" width="'+p.w+'" height="'+p.h+'" rx="14"/><text y="-5">'+esc(n.name)+'</text><text class="p-sub" y="18">'+esc(n.sub)+'</text></g>';
 });
 svg.innerHTML='<defs><filter id="pGlow"><feGaussianBlur stdDeviation="3"/></filter></defs>'+
 '<g>'+edges+'</g><circle class="p-ring" cx="'+center.x+'" cy="'+center.y+'" r="72"/><g>'+nodes+'</g>';
 svg.classList.toggle('playing',state.playing&&!state.reduced);
 $('regionTitle').textContent=reg.title;
 $('graphStatus').textContent=state.playing?'正在展开 '+state.step+' / 6 条联系':'点一个节点，查看它依赖什么';
}
function inspectorRender(){
 const reg=REGIONS[state.region],n=reg.nodes.find(x=>x.id===state.focus);
 $('regionRole').textContent=reg.role;
 $('regionHeadline').textContent=n?n.name+'：这条连接准备好了吗？':reg.headline;
 $('regionDescription').textContent=n?n.description:reg.description;
 $('regionQuestion').textContent=n?n.ask:reg.question;
 $('regionEvidenceTitle').textContent=n?(n.kind==='condition'?'需要独立核实的机制':'公开规划包含的方向'):'规划方向有公开依据';
 $('regionEvidenceText').textContent=n?(n.kind==='condition'?'并非已证实的因果关系或已达标指标。':'产业或空间联系已见于公开资料，但项目进度、效果和交易仍需核对。'):reg.evidence;
 all('[data-region]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.region===state.region)));
}
function routeRender(){
 const r=ROUTES[state.route];
 all('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===state.route)));
 $('routeTitle').textContent=r.title;$('routeSubtitle').textContent=r.subtitle;
}
function stageRender(){
 const s=STAGES[state.stage],isNew=state.route==='new';
 let badge=s.badge,title=s.title,content=s.text;
 if(!isNew){
   const r=ROUTES[state.route];
   badge='研究性路径 · 第'+(state.stage+1)+'阶段';
   const labels=['路径纳入规划','落实关键要素','项目与能力建设','进入实际运营','产生可核实贡献'];
   title=labels[state.stage]+'：'+(state.stage===4?r.question:r.title);
   const m=['具体任务与主体需要明确，规划文本不能替代责任分解。','资金、用地、人才、交通和服务等条件是否已落实？','建设或组织工作有没有可核实的具体阶段记录？','已经运营或生产并不意味着产生稳定收益。','最终要追踪产出、就业、利润、研发或本地收入，并留意反向作用。'];
   content=m[state.stage]+' 当前只显示可核实的项目阶段，没有凭空填入未知数量。';
 }
 $('stageBadge').textContent=badge;$('stageTitle').textContent=title;$('stageText').textContent=content;
 all('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===state.stage)));
 const smallStage=matchMedia('(max-width:720px)').matches;
 $('stageWave').setAttribute('viewBox',smallStage?'0 0 420 142':'0 0 680 158');
 const pos=smallStage?[46,128,210,292,374]:[70,207,340,473,607],ys=78;
 const shine=pos[state.stage],start=pos[0],end=pos[4],mid=smallStage?210:340;
 let svg='<defs><linearGradient id="pipelineG"><stop stop-color="#6bb7ff"/><stop offset="1" stop-color="#6de4f1"/></linearGradient></defs>'+
 '<path d="M'+start+' 78H'+end+'" stroke="#4d79aa" stroke-width="9" stroke-linecap="round" fill="none"/>'+
 '<path d="M'+start+' 78H'+shine+'" stroke="url(#pipelineG)" stroke-width="9" stroke-linecap="round" fill="none" style="filter:drop-shadow(0 0 8px #57aef6)"/>'+ '<path class="gate-flow" d="M'+start+' 78H'+shine+'"/>'+ '<circle class="gate-halo" cx="'+shine+'" cy="78" r="32"/>';
 pos.forEach((x,i)=>{
  const active=i<=state.stage,selected=i===state.stage;
  svg+='<circle cx="'+x+'" cy="'+ys+'" r="'+(selected?26:21)+'" fill="'+(selected?'#d5f3ff':active?'#70b9ff':'#244d7a')+'" stroke="'+(selected?'#ffd58b':active?'#c0e4ff':'#678db6')+'" stroke-width="'+(selected?4:2)+'" style="'+(selected?'filter:drop-shadow(0 0 12px #67c8ff)':'')+'"/>'+
  '<text x="'+x+'" y="85" text-anchor="middle" font-size="15" font-weight="850" fill="'+(active?'#134779':'#b0c7df')+'">0'+(i+1)+'</text>';
 });
 svg+='<text x="'+mid+'" y="32" text-anchor="middle" font-size="14" fill="#a4c9ed" font-weight="720">五道兑现门 · 每道都需要证据</text>'+
 '<text x="'+mid+'" y="135" text-anchor="middle" fill="#f7cd83" font-size="14" font-weight="830">当前：第'+(state.stage+1)+'道门 · '+(isNew?'核查项目进度':'核查执行条件')+'</text>';
 $('stageWave').innerHTML=svg;
}
function yearRender(){
 const d=YEAR[state.year];
 all('[data-year]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.year===state.year)));
 $('yearPlan').textContent=d.plan;$('yearPlanDetail').textContent=d.detail;$('yearFact').textContent=d.fact;$('yearFactDetail').textContent=d.factDetail;$('yearWarning').textContent=d.warning;
 // Restart subtle card transition on each selection; no synthetic values.
 document.querySelectorAll('.year-readout>div').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation='';});
}
function gapRender(){
 const g=GAPS[state.gap];all('[data-gap]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gap===state.gap)));
 $('gapTitle').textContent=g.title;$('gapText').textContent=g.text;$('gapEvidence').textContent=g.evidence;
}
function render(){
 goalRender();graphRender();inspectorRender();routeRender();stageRender();yearRender();gapRender();syncURL();
}
all('[data-goal]').forEach(b=>b.addEventListener('click',()=>{state.goal=b.dataset.goal;goalRender();syncURL();}));
all('[data-lens]').forEach(b=>b.addEventListener('click',()=>{state.goalMode=b.dataset.lens;state.goal=GOALS[state.goalMode][0].id;goalRender();syncURL();}));
all('[data-region]').forEach(b=>b.addEventListener('click',()=>{stop();state.region=b.dataset.region;state.focus='';state.step=6;render();}));
all('[data-route]').forEach(b=>b.addEventListener('click',()=>{stop();state.route=b.dataset.route;state.region=ROUTES[state.route].region;state.focus='';state.stage=0;state.step=6;render();}));
all('[data-stage]').forEach(b=>b.addEventListener('click',()=>{state.stage=Number(b.dataset.stage);stageRender();syncURL();}));
all('[data-year]').forEach(b=>b.addEventListener('click',()=>{state.year=b.dataset.year;yearRender();syncURL();}));
all('[data-gap]').forEach(b=>b.addEventListener('click',()=>{state.gap=b.dataset.gap;gapRender();syncURL();}));
function graphPick(e){
 const b=e.target.closest('[data-node]');if(!b)return;
 stop();const id=b.dataset.node;state.focus=id==='core'?'':state.focus===id?'':id;render();
}
$('planGraph').addEventListener('click',graphPick);
$('planGraph').addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const b=e.target.closest('[data-node]');if(!b)return;e.preventDefault();graphPick(e);});
$('graphReset').addEventListener('click',()=>{stop();state.focus='';state.step=6;render();});
$('playNetwork').addEventListener('click',()=>{
 if(state.playing){stop();$('graphStatus').textContent='动画已暂停，可直接点节点查看';return;}
 if(state.reduced){state.step=6;render();toast('已开启减少动态，直接展示六类依赖');return;}
 state.focus='';state.step=0;state.playing=true;render();
 $('playNetwork').setAttribute('aria-pressed','true');$('playNetwork').innerHTML='Ⅱ <span>暂停</span>';
 timer=setInterval(()=>{
   if(state.step>=6){stop();graphRender();return;}
   state.step++;graphRender();syncURL();
   if(state.step===6){clearInterval(timer);timer=0;setTimeout(()=>{if(state.playing)stop();},900);}
 },920);
});
$('reduceMotion').addEventListener('click',()=>{stop();state.reduced=!state.reduced;$('reduceMotion').setAttribute('aria-pressed',String(state.reduced));$('reduceMotion').textContent=state.reduced?'恢复动态':'减少动态';graphRender();});
function dialog(title,body){
 $('dialogTitle').textContent=title;$('dialogBody').innerHTML=body;
 if(!$('detailDialog').open)$('detailDialog').showModal();
}
$('dialogClose').addEventListener('click',()=>$('detailDialog').close());
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close();});
function refs(){
 return Object.values(SOURCES).map(s=>'<p><a href="'+s.url+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'（'+esc(s.date)+'） ↗</a></p>').join('');
}
$('openRegionSource').addEventListener('click',()=>{
 const s=SOURCES[REGIONS[state.region].source],r=REGIONS[state.region];
 dialog('三区三核 · '+r.role,'<p>'+esc(r.description)+'</p><h3>已公开的规划安排</h3><p>'+esc(r.evidence)+'</p>'+
 '<p><a href="'+s.url+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'（'+esc(s.date)+'） ↗</a></p><h3>这张图不能证明什么？</h3><p>空间功能规划不等于企业已形成交易，交通、学校和医疗联系仍需要实测可达性与项目进展核实；连线不代表已证实的交易或经济影响。</p>');
});
$('stageSource').addEventListener('click',()=>{
 const s=STAGES[state.stage],ref=SOURCES[s.source];
 dialog('项目兑现阶段 · 口径核查','<p>'+esc(s.text)+'</p><p>项目阶段应当逐项核实，不能用不同批次的历史总量计算实际转化率。</p>'+
 '<p><a href="'+ref.url+'" target="_blank" rel="noopener noreferrer">'+esc(ref.title)+' ↗</a></p>');
});
$('openMethod').addEventListener('click',()=>{
 dialog('公开资料与使用限制',
 '<h3>规划目标不是已经实现的结果</h3><p>2030年目标来自公开规划；2025年为历史规模，2026年前三季度数据只覆盖当时的统计窗口。未来年度暂缺的正式数据不会自动补造。</p>'+
 '<h3>项目进度仍需要实际资料</h3><p>十四五期间披露园区引进项目646宗、投产458宗，但未确认两者属于同一批项目，不能直接作为项目投产转化率。规划中的空间联系也不等于企业已经签订采购合同。</p>'+
 '<h3>五个关注方向</h3><p>项目、主导产业、科技创新、生产性服务及区域合作，是本页提供的观察入口；它们不是官方GDP目标的五项定量分解，当前页面也不提供真实成功概率。</p>'+
 '<h3>规划原始资料的边界</h3><p>县政府官网列示2026年8月31日纲要印发通知。本页尚未逐字比对可下载的规划纲要完整原文；重要指标与项目须以最新正式文件为准。</p><h3>核对入口</h3>'+refs());
});
function shareLink(){
 syncURL();const url=new URL(location.href);url.hash='network';return url.href;
}
async function share(){
 const link=shareLink();
 try{if(!navigator.clipboard?.writeText)throw Error('unsupported');await navigator.clipboard.writeText(link);toast('已复制包含当前规划核心、路线与年份的链接');}
 catch{dialog('手动复制分享链接','<p>此链接只携带公开场景和你的观察选项。</p><input id="shareFallback" style="width:100%;border:1px solid #c9dff6;border-radius:9px;padding:10px" readonly value="'+esc(link)+'">');const e=$('shareFallback');e.focus();e.select();}
}
$('sharePage').addEventListener('click',share);$('copyPlan').addEventListener('click',share);
$('savePlan').addEventListener('click',()=>{
 const record={region:state.region,route:state.route,lens:state.goalMode,goal:state.goal,stage:state.stage,year:state.year,gap:state.gap,savedAt:new Date().toISOString()};
 try{const key='boluo-v11-plan-snapshots',old=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify([record,...(Array.isArray(old)?old:[])].slice(0,20)));toast('已保存关注点到本机；可继续分享链接');}
 catch{toast('本机存储不可用，请使用分享链接');}
});
$('enterWind').addEventListener('click',e=>{
 const u=new URL('./wind.html',location.href);
 u.searchParams.set('from','plan');
 u.searchParams.set('route',state.route);
 u.searchParams.set('region',state.region);
 u.hash='results';
 e.currentTarget.href=u.href;
});
$('viewSaved').addEventListener('click',()=>{
 let items=[];try{const data=JSON.parse(localStorage.getItem('boluo-v11-plan-snapshots')||'[]');items=Array.isArray(data)?data:[];}catch{}
 if(!items.length){dialog('我的规划关注点','<p>暂时没有保存记录。选择空间核心、目标、路径与年份后点击“保存本机关注点”。</p>');return;}
 const content=items.slice(0,20).map((r,i)=>{
  const region=pick(r.region,Object.keys(REGIONS),'future'),route=pick(r.route,Object.keys(ROUTES),'new'),year=pick(String(r.year),Object.keys(YEAR),'2026');
  const u=new URL(location.href);u.searchParams.set('region',region);u.searchParams.set('route',route);u.searchParams.set('year',year);u.searchParams.delete('focus');u.hash='network';
  return '<div class="fact-row"><strong>0'+(i+1)+' · '+esc(REGIONS[region].role)+' · '+esc(year)+'</strong><p>'+esc(ROUTES[route].title)+'</p><a href="'+esc(u.href)+'">恢复这条观察 ↗</a></div>';
 }).join('');
 dialog('我的规划关注点 · 本机保存','<p>最近保存的'+items.length+'条记录，数据只在当前浏览器中。</p>'+content);
});
if(fromImpact){
 const label={projects:'工业投资 −44.7%：项目接续',orders:'工业增长 +8.9%：本地订单',livelihood:'社零 +3.6%：居民与商户'}[fromImpact];
 $('carryFromImpact').hidden=false;$('carryText').textContent=label+' → 查看规划接续条件';
 $('carryBack').href='./impact.html?scene='+fromImpact+'&step=3#explore';
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',stop);
window.addEventListener('resize',()=>graphRender(),{passive:true});
window.addEventListener('popstate',()=>{
 stop();const p=new URL(location.href).searchParams;
 state.region=pick(p.get('region'),Object.keys(REGIONS),'future');state.route=pick(p.get('route'),Object.keys(ROUTES),'new');
 state.goalMode=pick(p.get('lens'),['scale','quality'],'scale');state.goal=GOALS[state.goalMode].some(x=>x.id===p.get('goal'))?p.get('goal'):GOALS[state.goalMode][0].id;
 state.stage=Math.max(0,Math.min(4,Number(p.get('stage'))||0));state.year=pick(p.get('year'),Object.keys(YEAR),'2026');
 state.gap=pick(p.get('gap'),Object.keys(GAPS),'project');state.focus=REGIONS[state.region].nodes.some(n=>n.id===p.get('focus'))?p.get('focus'):'';render();
});
const disclosureBreakpoint=matchMedia('(max-width:980px)');
function syncEvidenceDisclosure() {
 $('regionDetails').open=!disclosureBreakpoint.matches;
}
syncEvidenceDisclosure();
if(typeof disclosureBreakpoint.addEventListener==='function')disclosureBreakpoint.addEventListener('change',syncEvidenceDisclosure);
else if(typeof disclosureBreakpoint.addListener==='function')disclosureBreakpoint.addListener(syncEvidenceDisclosure);
const goalsBreakpoint=matchMedia('(max-width:720px)');
function syncGoalDisclosure(){
 $('goalsDisclosure').open=!goalsBreakpoint.matches;
}
syncGoalDisclosure();
if(typeof goalsBreakpoint.addEventListener==='function')goalsBreakpoint.addEventListener('change',syncGoalDisclosure);
else if(typeof goalsBreakpoint.addListener==='function')goalsBreakpoint.addListener(syncGoalDisclosure);
render();
window.BoluoPlan={getState:()=>({...state}),getRegion:()=>state.region,regions:Object.keys(REGIONS)};
})();