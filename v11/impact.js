(() => {
'use strict';
const $=id=>document.getElementById(id), all=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source='https://fz0752.com/fontHtml/html/issue/000143025_1.html';
const facts=[
{id:'industry',name:'规上工业增加值',number:'+8.9%',label:'工业增加值',sub:'+8.9% · 同比',detail:'2026年前三季度博罗规上工业增加值增长8.9%，不能代表所有企业同速增长，更不能把该值当利润。'},
{id:'investment',name:'工业投资',number:'−44.7%',label:'工业投资',sub:'−44.7% · 同比',detail:'2026年前三季度工业投资同比下降44.7%，可能涉及建设阶段和统计基数，不能直接理解为所有项目延期。'},
{id:'power',name:'工业用电量',number:'+12.0%',label:'工业用电量',sub:'+12.0% · 同比',detail:'工业用电量增长12%，不等于工业产值、企业利润或岗位同比增长12%。'},
{id:'retail',name:'社会消费品零售总额',number:'+3.6%',label:'社零总额',sub:'+3.6% · 同比',detail:'社会消费品零售总额增长3.6%，不表示所有镇街、商户或居民收入同速增加。'}
];
const make=(id,name,sub,x,y,kind,detail,ask)=>({id,name,sub,x,y,kind,detail,ask});
const scenes={
projects:{
 title:'项目接续：投资收缩，谁可能先受影响？',origin:'工业投资同比 −44.7%',mid:'项目进度 → 设备需求 → 本地配套',unknown:'哪些项目真正发生延期？',
 intro:'工业投资下降不等于所有在建项目都延误；既有产线仍可能支撑当前增长。先把项目状态核实清楚。',
 nodes:[
 make('origin','工业投资','−44.7% · 已公布',100,192,'observed','工业投资下降44.7%是公开事实，不等于所有项目暂停。','项目投资下降究竟来自哪个建设阶段？'),
 make('project','在建项目','进度待核实',248,91,'unknown','公开项目清单中的签约、开工、投产不能当作同一状态。','哪些项目的实际投产进度发生变化？'),
 make('equipment','设备需求','采购待核实',243,285,'hypothesis','项目节奏可能改变设备需求，但目前没有公开的全县设备采购交易矩阵。','设备到货、招标、安装与验收进展如何？'),
 make('supplier','本地配套','交易待核实',423,126,'hypothesis','如果设备采购变化，必须确认是否由博罗企业供应才能判断本地关联。','本地配套采购占比与替代客户在哪里？'),
 make('employment','岗位工时','尚待核实',498,288,'hypothesis','不能把工业投资降幅直接换算为失业人数，需招聘、工时和工资证据。','对应行业招聘、工资和工作时长实际如何？')
 ],
 steps:['已知：投资同比 −44.7%，但当期工业增加值仍增长。','第1层：项目开工、进度与投产是否存在时间差？','第2层：设备、工程与施工采购有没有跟着变化？','第3层：真正发生交易的本地配套企业是谁？','第4层：是否传至岗位与工时，必须有独立证据。'],
 questions:{business:'我的订单来自既有产线，还是依赖新项目建设？',people:'我的工作是依靠现有工厂，还是新项目的投产？',policy:'哪一批项目的开工、达产与设备采购值得优先核查？'}
},
orders:{
 title:'本地订单：大厂增长，谁真正接住了？',origin:'工业增加值同比 +8.9%',mid:'产线增长 → 采购订单 → 本地配套',unknown:'县内真实采购关系有多强？',
 intro:'产出增长不等于本地配套企业都拿到订单。产值、增加值、采购、利润和薪酬属于不同经济口径。',
 nodes:[
 make('origin','工业增加值','+8.9% · 已公布',100,192,'observed','全县规上工业增加值同比增长8.9%，但不意味着每家企业订单都在增加。','增长究竟集中在什么产业和企业？'),
 make('production','既有产线','产能待核实',248,91,'unknown','增长可能来自既有产线释放或产品结构变化，无法仅用总体增速判断。','哪部分增长来自存量企业？'),
 make('orders','采购订单','合同待核实',243,285,'hypothesis','工业增长可能伴随投入品需求变化，但订单增减及供应地区需要独立核实。','企业真实采购合同有何变化？'),
 make('supplier','本地供应商','占比待核实',423,126,'hypothesis','企业地理上邻近不代表已经发生供应链交易。','县内采购占比、供应商名录和交易频率如何？'),
 make('local','本地留存','收益待核实',498,288,'hypothesis','采购增长也不自动等于本地利润或收入提升。','利润、研发投入与当地工资有无同步变化？')
 ],
 steps:['已知：工业增加值增长8.9%，不代表所有企业增长。','第1层：现有产能是否形成新增产出？','第2层：供应链采购额、订单结构是否变化？','第3层：订单是否真的交给了县内企业？','第4层：利润与就业收益是否留在本地？'],
 questions:{business:'增长的是我的真实客户，还是没有交易的另一家工厂？',people:'工业增长有没有变成真实招聘和工资改善？',policy:'产业集聚是否形成可核实的县内订单网络？'}
},
livelihood:{
 title:'就业消费：数字增长，谁真正感受到了？',origin:'社零同比 +3.6%',mid:'消费结构 → 商户经营 → 工作收入',unknown:'哪些行业、人群没有同步受益？',
 intro:'社会消费品零售总额增长3.6%，但行业分化仍可能存在。总体恢复不等于个人收入同幅改善。',
 nodes:[
 make('origin','社零总额','+3.6% · 已公布',100,192,'observed','前三季度社零同比增长3.6%，只是全县消费品零售总量变化。','增长发生在什么行业与地区？'),
 make('category','消费结构','行业待核实',248,91,'unknown','批零、住宿、餐饮等统计口径不一样，总量不能表示各类商户都变好。','哪些消费子行业显著分化？'),
 make('merchant','本地商户','经营待核实',243,285,'hypothesis','零售总量变化不等于每家商户营收或利润改善。','客流、营业额和成本实际如何？'),
 make('work','岗位工时','招聘待核实',423,126,'hypothesis','商户经营与岗位工时可能有关，但须逐行业核对。','招聘、工时与工资是否实际改变？'),
 make('family','家庭实际感受','收支待核实',498,288,'hypothesis','生活感受同时受工资、物价、通勤与住房成本影响。','收入与生活成本究竟如何变化？')
 ],
 steps:['已知：社零同比增长3.6%，并非所有行业相同。','第1层：增长来自什么消费类别？','第2层：本地商户实际经营是否改善？','第3层：改善是否影响招聘、工时或薪酬？','第4层：家庭收入与生活成本是否同步？'],
 questions:{business:'全县消费更好，是否正好是我的细分市场？',people:'商店更热闹，是否真的改变我的收入与成本？',policy:'哪些镇街、行业或人群没有共享增长？'}
}
};
const horizon={
3:{
 projects:[['项目状态','签约、开工、建成、投产是否混淆？'],['设备进度','招标、安装与到货是否延误？'],['招聘线索','施工与设备安装岗位有无变化？']],
 orders:[['产线进度','产能利用率和新投产贡献如何？'],['采购分布','头部企业采购来自县内还是县外？'],['订单合同','本地配套供应有没有实际增加？']],
 livelihood:[['细分消费','批发、零售、住宿、餐饮有无分化？'],['商户客流','营业收入与成本出现何种变化？'],['就业招聘','招聘岗位与工资是否有证据？']]
},
6:{
 projects:[['项目接续','新开工与投产的转化情况'],['产线试运','新建厂房和生产线能否达产？'],['企业订单','本地设备与工程采购是否改变？']],
 orders:[['订单持续','头部企业新增订单是否延续？'],['中小企业','真实配套供应商有多少？'],['替代客户','是否存在县外或其他客户？']],
 livelihood:[['工资工时','真实岗位、工资和工时的变化'],['经营利润','商户是否只有流水增长？'],['消费流向','在本地花掉与流向县外有何差别？']]
},
12:{
 projects:[['新增产能','建成产线的真实贡献'],['投资重启','工业投资是否出现周期切换？'],['经营结果','岗位与产出是否实际形成？']],
 orders:[['网络更替','供应商数量与依赖度变化'],['利润留存','县内利润与研发投入情况'],['替代韧性','关键供应商有无更多客户？']],
 livelihood:[['家庭成本','住房与通勤负担变化'],['产业传递','工业收入是否进入本地消费？'],['空间差异','镇街是否同步获得增长？']]
}};
const matrix={
 fragile:['高暴露 × 弱替代','若对少数客户高度依赖，且难以转换订单，应优先核查采购占比与替代周期。不是对某家企业的定论。'],
 buffered:['高暴露 × 强替代','直接暴露可能很高，但替代客户或产能调整可能缓冲影响。需查切换成本与实际时间。'],
 limited:['低暴露 × 弱替代','替代能力不强并不自动意味着巨大风险；若实际关联很少，影响可能有限。'],
 adaptable:['低暴露 × 强替代','潜在调整空间相对较大，仍需要多期真实订单验证。']
};
const params=new URL(location.href).searchParams;
const within=(v,a,f)=>a.includes(v)?v:f;
const state={
 scene:within(params.get('scene'),Object.keys(scenes),'projects'),mode:within(params.get('mode'),['compare','trace'],'compare'),
 lens:within(params.get('lens'),['business','people','policy'],'business'),
 buffer:within(params.get('buffer'),['unknown','weak','strong'],'unknown'),
 horizon:[3,6,12].includes(+params.get('horizon'))?+params.get('horizon'):3,
 step:Math.min(4,Math.max(0,Number(params.get('step'))||0)),focus:'',quadrant:'',playing:false,
 reduced:matchMedia('(prefers-reduced-motion: reduce)').matches
};
const validFocus=params.get('focus');
state.focus=Object.values(scenes).some(s=>s.nodes.some(n=>n.id===validFocus))||facts.some(f=>f.id===validFocus)?validFocus:'';
let timer=0,toastTimer=0;
function stop(){
 if(timer)clearInterval(timer);timer=0;state.playing=false;
 $('playShock').setAttribute('aria-pressed','false');$('playIcon').textContent='▶';$('playLabel').textContent='播放冲击波';
 document.querySelector('.play-status').classList.remove('playing');
}
function notify(message){
 const e=$('toast');e.textContent=message;e.classList.add('on');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>e.classList.remove('on'),2700);
}
function urlSync(){
 try{
 const u=new URL(location.href);
 Object.entries({scene:state.scene,mode:state.mode,lens:state.lens,buffer:state.buffer,horizon:state.horizon,step:state.step}).forEach(([k,v])=>u.searchParams.set(k,String(v)));
 if(state.focus)u.searchParams.set('focus',state.focus);else u.searchParams.delete('focus');
 history.replaceState(null,'',u.pathname+u.search+u.hash);
 }catch{}
}
function nodeCard(n,index,active=false,fact=false){
 const w=fact?188:134,h=fact?81:68,sel=state.focus===n.id;
 const kind=fact?'observed':n.kind;
 return '<g transform="translate('+n.x+','+n.y+')" class="signal-node '+(active?'activated ':'')+(sel?'selected ':'')+(state.mode==='trace'&&state.focus&&!sel&&!fact?'dimmed':'')+'" data-node="'+esc(n.id)+'" data-kind="'+kind+'" role="button" tabindex="0" aria-label="'+esc(n.name)+'，'+esc(n.sub)+'" style="animation-delay:'+(index*90)+'ms">'+
 '<rect class="node-box" x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" rx="14"/>'+
 '<rect class="node-glow" x="'+(-w/2-4)+'" y="'+(-h/2-4)+'" width="'+(w+8)+'" height="'+(h+8)+'" rx="17"/>'+
 '<text y="-4">'+esc(n.name)+'</text><text class="node-sub" y="18">'+esc(n.sub)+'</text></g>';
}
function renderFact(){
 const mobile=matchMedia('(max-width:620px)').matches;
 $('factNetwork').setAttribute('viewBox',mobile?'0 0 420 400':'0 0 600 384');
 const coords=mobile?[[105,105],[315,105],[105,284],[315,284]]:[[167,105],[430,105],[167,278],[430,278]];
 const nodes=facts.map((f,i)=>({...f,name:f.label,x:coords[i][0],y:coords[i][1]}));
 $('factNetwork').innerHTML='<text x="'+(mobile?210:300)+'" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="#a7c8ec">四项独立指标 · 无法直接推算因果</text>'+
 nodes.map((n,i)=>nodeCard(n,i,false,true)).join('')+
 '<text x="'+(mobile?210:300)+'" y="196" text-anchor="middle" font-weight="800" font-size="'+(mobile?11:13)+'" fill="#f3cc8d">≠ 不能从宏观指标直接推算企业损失</text>';
}
function edgePath(a,b){
 const dx=b.x-a.x, dy=b.y-a.y;
 if(Math.abs(dx)<18){return 'M'+a.x+','+(a.y+Math.sign(dy)*36)+' C'+(a.x+80)+','+(a.y+Math.sign(dy)*55)+' '+(b.x+80)+','+(b.y-Math.sign(dy)*55)+' '+b.x+','+(b.y-Math.sign(dy)*36);}
 const sign=Math.sign(dx),sx=a.x+sign*50,ex=b.x-sign*50,m=(sx+ex)/2;
 return 'M'+sx+','+a.y+' C'+m+','+a.y+' '+m+','+b.y+' '+ex+','+b.y;
}
function renderScenario(){
 const scene=scenes[state.scene],mobile=matchMedia('(max-width:620px)').matches;
 const mobileXY=[[210,75],[100,209],[315,209],[100,390],[315,390]];
 const nodes=mobile?scene.nodes.map((n,i)=>({...n,x:mobileXY[i][0],y:mobileXY[i][1]})):scene.nodes;
 $('scenarioNetwork').setAttribute('viewBox',mobile?'0 0 420 490':'0 0 600 384');
 let lines='';
 const chain=[[0,1],[1,2],[2,3],[3,4]];
 chain.forEach(([i,j],index)=>{
  const a=nodes[i],b=nodes[j],d=edgePath(a,b),lit=index<state.step;
  const focused=state.focus&&(state.focus===a.id||state.focus===b.id),buffer=state.buffer==='strong'&&index>1;
  lines+='<path class="flow-link hypothesis '+(lit?'active ':'inactive ')+(buffer?'buffered ':'')+(focused?'focused ':'')+'" d="'+d+'" aria-hidden="true"/>';
  if(lit&&index===state.step-1&&!state.reduced)
    lines+='<circle class="tracer" r="6" aria-hidden="true"><animateMotion path="'+d+'" dur=".92s" repeatCount="1" fill="freeze"/></circle>';
 });
 const rings=state.step>0?'<circle class="wave-ring" cx="'+nodes[0].x+'" cy="'+nodes[0].y+'" r="26"/><circle class="wave-ring second" cx="'+nodes[0].x+'" cy="'+nodes[0].y+'" r="36"/>':'';
 $('scenarioNetwork').classList.toggle('playing',state.playing&&!state.reduced);
 $('scenarioNetwork').innerHTML='<text x="'+(mobile?210:300)+'" y="29" text-anchor="middle" font-size="13" font-weight="700" fill="#b1d1f4">条件路径 · 非实测损失</text>'+
 '<g>'+lines+rings+'</g><g>'+nodes.map((n,i)=>nodeCard(n,i<=state.step)).join('')+'</g>';
 $('scenarioCaption').textContent=scene.steps[state.step];
}
function renderInspector(){
 const sc=scenes[state.scene];
 const node=sc.nodes.find(x=>x.id===state.focus),fact=facts.find(x=>x.id===state.focus);
 $('selectionTag').textContent=node?(node.kind==='observed'?'已知信号':'待核实联系'):fact?'已公布数据':state.step?'第'+state.step+'层':'观察起点';
 $('inspectorTitle').textContent=node?node.name+'：'+(node.kind==='observed'?'真实信号':'联系待确认'):fact?fact.name+' '+fact.number:state.step?sc.steps[state.step]:sc.title;
 $('inspectorText').textContent=node?node.detail:fact?fact.detail:state.step?'被点亮的是需要核实的可能路径，不是已经识别的经济因果。':sc.intro;
 $('inspectorQuestion').textContent=node?node.ask:fact?'这项统计信号与哪些真实主体和关系有关？':sc.questions[state.lens];
 $('chainStart').textContent=sc.origin;$('chainMiddle').textContent=sc.mid;$('chainEnd').textContent=sc.unknown;
 $('bufferResult').textContent=state.buffer==='unknown'?'目前没有完整公开数据确认替代客户、供应商及调整时间。':
 state.buffer==='weak'?'条件假设：替代渠道不足，这条路径更需要核查；并非已测算出损失。':
 '条件假设：有可用的替代客户或渠道，部分影响可能被缓冲；需真实交易记录确认。';
}
function renderSignals(){
 const arr=horizon[state.horizon][state.scene];
 $('signalRows').innerHTML=arr.map((r,i)=>'<div class="signal-row" style="animation-delay:'+(i*80)+'ms"><span class="signal-num">0'+(i+1)+'</span><div><strong>'+esc(r[0])+'</strong><p>'+esc(r[1])+'</p></div><span class="signal-status">需核实</span></div>').join('');
 $('horizonTakeaway').textContent=state.horizon===3?'先分辨最新信号与实际项目状态。':
 state.horizon===6?'再核实订单、项目或商户经营是否发生第二层变化。':
 '最后对照真实的经营、收入与生活结果，检验早先的传导假设。';
}
function renderMatrix(){
 all('[data-quadrant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.quadrant===state.quadrant)));
 const d=matrix[state.quadrant]||['先别给企业打风险分','无真实采购占比和可替代性资料时，这四个象限只是核验框架，不是博罗企业真实坐标。'];
 $('matrixInsight').innerHTML='<strong>'+esc(d[0])+'</strong><p>'+esc(d[1])+'</p>';
}
function render(){
 if(state.focus&&!scenes[state.scene].nodes.some(n=>n.id===state.focus)&&!facts.some(n=>n.id===state.focus))state.focus='';
 all('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===state.scene)));
 all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
 all('[data-lens]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lens===state.lens)));
 all('[data-buffer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.buffer===state.buffer)));
 all('[data-horizon]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.horizon===state.horizon)));
 $('stageTitle').textContent=scenes[state.scene].title;
 $('impactStep').value=state.step;$('stepOutput').textContent=state.step+' / 4';
 $('stageDuo').classList.toggle('focus-mode',state.mode==='trace');
 $('playStatus').textContent=scenes[state.scene].steps[state.step];
 $('reduceMotion').textContent=state.reduced?'恢复动态':'减少动态';
 $('reduceMotion').setAttribute('aria-pressed',String(state.reduced));
 renderFact();renderScenario();renderInspector();renderSignals();renderMatrix();urlSync();
}
function change(upd,reset=false){stop();Object.assign(state,upd);if(reset){state.step=0;state.focus='';}render();}
all('[data-case]').forEach(b=>b.addEventListener('click',()=>change({scene:b.dataset.case},true)));
all('[data-mode]').forEach(b=>b.addEventListener('click',()=>change({mode:b.dataset.mode})));
all('[data-lens]').forEach(b=>b.addEventListener('click',()=>change({lens:b.dataset.lens,focus:''})));
all('[data-buffer]').forEach(b=>b.addEventListener('click',()=>change({buffer:b.dataset.buffer})));
all('[data-horizon]').forEach(b=>b.addEventListener('click',()=>change({horizon:+b.dataset.horizon})));
all('[data-quadrant]').forEach(b=>b.addEventListener('click',()=>{state.quadrant=b.dataset.quadrant;renderMatrix();}));
function showDialog(title,body){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=body;if(!$('detailDialog').open)$('detailDialog').showModal();}
$('dialogClose').addEventListener('click',()=>$('detailDialog').close());
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close();});
function factDialog(id){
 const f=facts.find(x=>x.id===id);if(!f)return;
 showDialog(f.name+' · '+f.number,'<p><strong>2026年前三季度 · 同比</strong></p><div class="fact-row">'+esc(f.detail)+'</div><p>来源：2026年11月5日公开报道引述博罗县统计局发布的经济运行数据。</p><p><a href="'+source+'" target="_blank" rel="noopener noreferrer">查看公开报道 ↗</a></p>');
}
all('[data-fact]').forEach(b=>b.addEventListener('click',()=>factDialog(b.dataset.fact)));

const realCaseSource='https://epaper.nfnews.com/nfdaily/html/202609/22/content_10181994.html?origin=4';
const caseDetails={
 local:'汉德精密受访表示，本地配套采购从最初不足10%提升到报道时约40%。40%的分母为汉德配套采购，不是本地所有企业订单。',
 hande:'汉德精密是园洲案例的中心企业。公开采访展示了本地配套采购与具体供应商订单关系，但不能代表博罗全部产业网络。',
 supplier:'密特斯滤清器负责人称，约40%的业务来自汉德。40%的分母为密特斯自己的业务，与汉德本地采购约40%不是同一个分母，不能相加或相减。'
};
function caseDetail(key){
 const msg=caseDetails[key]||caseDetails.hande;
 showDialog('真实关系样本 · 2026年9月22日',
 '<p>'+esc(msg)+'</p><div class="fact-row"><strong>关系记录≠经济因果</strong><p>订单、采购与岗位、利润、现金回笼是不同信息。该报道仅支持相应采访记录，不代表完整供应链。</p></div>'+
 '<p><a href="'+realCaseSource+'" target="_blank" rel="noopener noreferrer">查看南方日报公开报道 ↗</a></p>'+
 '<p><a href="./relations.html?case=hande&mode=trace&view=orders">返回第四页查看原始互动关系 ↗</a></p>');
}
$('evidenceCaseDetail').addEventListener('click',()=>caseDetail('hande'));
$('caseEvidence').addEventListener('click',e=>{const n=e.target.closest('[data-case-evidence]');if(n)caseDetail(n.dataset.caseEvidence);});
$('caseEvidence').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('[data-case-evidence]');if(!n)return;e.preventDefault();caseDetail(n.dataset.caseEvidence);});

function handlePick(e){
 const n=e.target.closest('[data-node]');if(!n)return;
 state.focus=state.focus===n.dataset.node?'':n.dataset.node;stop();render();
}
['factNetwork','scenarioNetwork'].forEach(id=>{
 $(id).addEventListener('click',handlePick);
 $(id).addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const n=e.target.closest('[data-node]');if(!n)return;e.preventDefault();handlePick(e);});
});
$('impactStep').addEventListener('input',e=>change({step:Math.round(+e.target.value)}));
function start(){
 if(state.playing){stop();$('playStatus').textContent='已暂停，可直接拖动路径进度';return;}
 if(state.step>=4)state.step=0;state.focus='';render();
 if(state.reduced){state.step=4;render();notify('已按减少动态设置直接呈现完整影响链');return;}
 state.playing=true;$('playShock').setAttribute('aria-pressed','true');$('playIcon').textContent='Ⅱ';$('playLabel').textContent='暂停';
 document.querySelector('.play-status').classList.add('playing');
 timer=setInterval(()=>{
   if(state.step>=4){stop();return;}
   state.step++;render();state.playing=true;
   $('playShock').setAttribute('aria-pressed','true');$('playIcon').textContent='Ⅱ';$('playLabel').textContent='暂停';
   document.querySelector('.play-status').classList.add('playing');
   if(state.step===4){clearInterval(timer);timer=0;setTimeout(()=>{if(state.playing)stop();},1300);}
 },1350);
}
$('playShock').addEventListener('click',start);
$('resetShock').addEventListener('click',()=>change({step:0,focus:'',buffer:'unknown',quadrant:''}));
$('reduceMotion').addEventListener('click',()=>{stop();state.reduced=!state.reduced;render();});
function openEvidence(){
 const rows=facts.map(f=>'<div class="fact-row"><strong>'+esc(f.name)+'　'+esc(f.number)+'</strong><p>'+esc(f.detail)+'</p></div>').join('');
 showDialog('公开依据与方法边界','<p>这里的公开观察全部为2026年前三季度博罗县域同比数据，统计对象不同，不能相减。</p>'+rows+
 '<h3>条件传导与实测事实的界线</h3><p>右侧网络为需要核验的传导机制；虚线不代表已经发生的企业采购、因果关系或就业损失。节点大小、线宽与动画速度没有经济计量含义。没有可核验交易资料，不提供虚假的风险概率。</p>'+
 '<h3>下一步补什么证据</h3><p>项目真实开工与投产进度、采购合同与供应地区、替代客户、招聘与工资等。证据可逐层升级，不将未经核实的机制直接写成实测联系。</p>'+
 '<h3>公开资料</h3><p><a href="'+source+'" target="_blank" rel="noopener noreferrer">南方+记者廖钰娴，2026年11月5日报道（公开转载）↗</a></p>');
}
$('openEvidence').addEventListener('click',openEvidence);$('sourceFoot').addEventListener('click',openEvidence);
function link(){urlSync();const u=new URL(location.href);u.hash='explore';return u.href;}
async function share(){
 const href=link();
 try{if(!navigator.clipboard?.writeText)throw Error('No clipboard');await navigator.clipboard.writeText(href);notify('当前条件与观察视角的分享链接已复制');}
 catch{showDialog('分享当前影响链','<p>分享内容只包含公开场景，不包含本机补充信息。</p><input id="shareFallback" readonly style="width:100%;padding:12px;border:1px solid #aacff2;border-radius:9px" value="'+esc(href)+'"><p>请长按复制以上链接。</p>');$('shareFallback').focus();$('shareFallback').select();}
}
$('shareBtn').addEventListener('click',share);$('copyTrace').addEventListener('click',share);
$('saveTrace').addEventListener('click',()=>{
 const record={scene:state.scene,step:state.step,lens:state.lens,buffer:state.buffer,source:'public-conditional',url:link(),savedAt:new Date().toISOString()};
 try{const k='boluo-impact-traces-v1',v=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify([record,...(Array.isArray(v)?v:[])].slice(0,30)));notify('这条影响链已保存到本机，亦可分享链接');}
 catch{notify('无法使用本机存储，请使用分享链接保存');}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);window.addEventListener('resize',()=>{renderFact();renderScenario();},{passive:true});
window.addEventListener('popstate',()=>{stop();const p=new URL(location.href).searchParams;state.scene=within(p.get('scene'),Object.keys(scenes),'projects');state.step=Math.min(4,Math.max(0,+p.get('step')||0));state.mode=within(p.get('mode'),['compare','trace'],'compare');state.focus=p.get('focus')||'';render();});
render();
window.BoluoImpactUI={getState:()=>({...state}),getCase:()=>state.scene,getSteps:()=>scenes[state.scene].steps.slice()};
})();
