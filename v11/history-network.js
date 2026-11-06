
(() => {
  'use strict';
  const root = document.getElementById('bhHistory');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const sources = {
    park: { name: '惠州市商务局 · 产业园情况简介（2022）', url: 'https://swj.huizhou.gov.cn/rdzt/tzcj/zdpt/content/post_4315332.html' },
    government: { name: '博罗县2022年政府工作报告 · 2021年项目进展', url: 'https://www.zgcounty.com/news/38366.html' },
    infra: { name: '惠州文明网 · 园区基础设施与博罗产投（2023）', url: 'https://hz.wenming.cn/ecjj/202304/t20230413_8045528.htm' },
    projects: { name: '博罗产投转载惠州日报 · 2023年集中动工投产', url: 'https://www.blznzbgs.com/News_show/?id=498' },
    storage: { name: '博罗文明网 · 新型储能产业（2023）', url: 'https://gdbl.wenming.cn/wmbb/202308/t20230810_3436251.html' },
    mobility: { name: '南方+ · 博罗电动车制造（2024）', url: 'https://static.nfnews.com/content/202411/11/c10241422.html' },
    industry24: { name: '南方日报 · 博罗工业发展（2025）', url: 'https://epaper.nfnews.com/m/ipaper/nfrb/html/202509/26/content_10148839.html' },
    industry25: { name: '南方网 · 八个百亿级集群（2026）', url: 'https://news.southcn.com/node_54a44f01a2/26ba1c8a43.shtml' },
    huatong: { name: '南方日报 · 惠州华通突破百亿（2026）', url: 'https://epaper.nfnews.com/nfdaily/html/202602/10/content_10162866.html' },
    daikin: { name: '南方日报 · 大金华南基地落地（2025）', url: 'https://epaper.nfnews.com/m/ipaper/nfrb/html/202509/26/content_10148839.html' },
    gdp: { name: '暨南大学乡村振兴研究院 · 2025年博罗GDP', url: 'https://irrr.jnu.edu.cn/2026/0430/c28579a854658/page.htm' }
  };
  // Years denote the observation / publicly reported milestone, NOT a firm's founding year.
  const N = [
    {id:'core', name:'博罗产业',sub:'县域增长网络',year:2020,group:'core',x:506,y:249,w:164,mx:213,my:360,mw:154,title:'主角不是一家企业，是博罗的产业网络',detail:'把年份向前拨，产业园、项目、行业和生产基地逐步出现。图上的节点是代表性样本，并非全县企业清单。',question:'增长来自少数节点，还是能持续扩展的本地联系？',source:'industry25'},
    {id:'park',name:'智能装备产业园',sub:'2020平台布局',year:2020,group:'platform',x:284,y:160,w:176,mx:128,my:174,mw:154,title:'先建能够接住企业的平台',detail:'2020年引入重大项目并推进智能装备产业园，园区定位覆盖智能制造、新材料、新能源等。园区是产业承载平台，不等于所有园内企业互为供应商。',question:'园区能否从地理聚集走向实际协作？',source:'park'},
    {id:'zhengwei',name:'正威项目',sub:'2020引进、动工',year:2020,group:'project',x:100,y:100,w:128,mx:70,my:69,mw:116,title:'2020：大项目落下第一根锚',detail:'惠州市商务局披露，2020年6月园区引进正威项目，10月动工，2021年一期建成投产。这里仅表示当时的项目进度，不代表2026年现状或承诺产能已实现。',question:'大项目后来保持了多少产能与本地采购？',source:'park'},
    {id:'yuanzhou',name:'园洲 · 石湾',sub:'园区空间承载',year:2021,group:'platform',x:265,y:338,w:139,mx:82,my:281,mw:132,title:'产业发展的空间开始集中',detail:'博罗智能装备产业园跨园洲和石湾。图示为园区地域与项目关系，不表示两镇之间存在特定交易流量。',question:'企业是邻居，还是有订单的合作伙伴？',source:'park'},
    {id:'sunwoda',name:'欣旺达',sub:'2021二期投产',year:2021,group:'energy',x:91,y:260,w:133,mx:326,my:172,mw:124,title:'2021：电池制造成为关键支点',detail:'县政府工作报告列明欣旺达二期竣工投产。2023年储能报道又披露欣旺达在园洲的制造布局。这里没有把相邻企业画成未经核实的直接采购关系。',question:'电芯、包装与系统集成分别有多少本地配套？',source:'storage'},
    {id:'xiaodao',name:'小刀电动车',sub:'2021一期投产',year:2021,group:'mobility',x:119,y:406,w:135,mx:84,my:478,mw:125,title:'2021：新增整车制造节点',detail:'公开报道称，小刀博罗基地2021年10月投产。它标志着本地整车制造能力的形成，但产能和带动效应应分别核实。',question:'整车走出博罗时，零部件有多少留在本地制造？',source:'mobility'},
    {id:'infra',name:'园区基础设施',sub:'2022六项建设',year:2022,group:'platform',x:442,y:82,w:140,mx:207,my:70,mw:136,title:'2022：看不见的基础设施，也在搭网络',detail:'2022年博罗产投推动园区道路、电力迁建、污水管网等6项基础设施建设工程。它们改善承载条件，不意味着单个企业的订单必然增长。',question:'土地、道路、电力和配套，哪项最影响下一批项目达产？',source:'infra'},
    {id:'invest',name:'博罗产投',sub:'2023平台升级',year:2023,group:'platform',x:578,y:409,w:126,mx:344,my:69,mw:125,title:'2023：园区开发组织升级',detail:'2023年，博罗智能装备产业园开发有限公司升级为博罗县产业投资集团。主要关注园区基础设施和产业承载能力。',question:'项目入园之后，谁来协调长期的要素与设施？',source:'infra'},
    {id:'energy',name:'新型储能',sub:'2023产业集聚',year:2023,group:'energy',x:689,y:124,w:124,mx:334,my:281,mw:123,title:'2023：储能不再只是单个工厂',detail:'2023年上半年，博罗新能源电池制造业规上企业22家，相关新型储能产业报道披露产值48.3亿元。这里是行业统计，不是欣旺达一家的产值。',question:'产业规模扩大后，电芯、储能系统、服务环节有多少在本地完成？',source:'storage'},
    {id:'mobility',name:'智能出行',sub:'整车集聚',year:2021,group:'mobility',x:757,y:344,w:122,mx:85,my:574,mw:118,title:'从一座整车厂，长出一条产业分支',detail:'博罗从2020年前后布局电动车产业；小刀、台铃、新日等整车项目陆续投产。产业分支的线是所属关系，不是企业间供货凭证。',question:'龙头在此生产，与供应商在此交易，是两回事。',source:'mobility'},
    {id:'tailing',name:'台铃',sub:'2023一期投产',year:2023,group:'mobility',x:911,y:411,w:110,mx:213,my:574,mw:110,title:'2023：台铃一期投产',detail:'台铃科技（广东）有限公司项目一期于2023年1月竣工投产。与小刀厂区邻近的公开报道，不应被解释为二者存在供应链交易。',question:'整车企业密集起来，配件厂是否同步受益？',source:'mobility'},
    {id:'xinri',name:'新日',sub:'2023投产',year:2023,group:'mobility',x:911,y:334,w:110,mx:334,my:574,mw:110,title:'2023：石湾有了整车产线',detail:'2023年6月，石湾的新日机电项目投产。报道将其称为石湾首个电动车整车生产项目。',question:'新加入的整车产线，会改变哪个镇街的就业和配套？',source:'mobility'},
    {id:'electronic',name:'电子信息',sub:'2024近650亿元',year:2024,group:'electronic',x:788,y:225,w:140,mx:332,my:467,mw:126,title:'2024：电子信息成为大枝干',detail:'2024年博罗新一代电子信息产业规上工业总产值近650亿元；该口径是一个产业合计值，不能与全县GDP、工业增加值直接相加。',question:'高产值究竟沉淀为本地利润、研发与配套了吗？',source:'industry24'},
    {id:'huatong',name:'惠州华通',sub:'2025产值破百亿',year:2025,group:'electronic',x:941,y:171,w:130,mx:332,my:671,mw:122,title:'2025：电子信息出现另一家百亿企业',detail:'2026年2月报道披露，惠州华通2025年产值突破百亿元，成为博罗第二家百亿产值企业。它与电子信息行业相连，未声明它直接向图中某家企业供货。',question:'头部企业的创新收益，能否扩散到本地中小企业？',source:'huatong'},
    {id:'daikin',name:'大金空调',sub:'2025基地投产',year:2025,group:'project',x:321,y:417,w:124,mx:86,my:669,mw:116,title:'2025：外资制造项目加入',detail:'大金华南空调生产基地在博罗罗阳投产。报道的“达产后70亿元”是项目预期营业额，不是2025年已实现的产值，未用于绘图数值。',question:'外资制造基地带来的技术、岗位和配套，有多少可留在本地？',source:'daikin'},
    {id:'food',name:'绿色食品',sub:'2025集群成形',year:2025,group:'food',x:665,y:65,w:120,mx:208,my:478,mw:117,title:'2025：增长不止靠制造业车间',detail:'博罗现代食品产业被列为百亿级产业集群之一，围绕绿色农产品供应基地及食品加工龙头推进产业链建设。',question:'加工、品牌、销售利润是否能更多回到产地？',source:'industry25'},
    {id:'farmbase',name:'绿色农产品基地',sub:'供应平台',year:2025,group:'food',x:895,y:61,w:159,mx:207,my:673,mw:137,title:'农业与工业之间出现新节点',detail:'粤港澳大湾区（广东·惠州）绿色农产品生产供应基地被报道为食品产业的关键平台。这条线只表示平台属于当地食品产业布局。',question:'农户、加工厂、市场之间的真实采购网络，还缺哪些数据？',source:'industry25'}
  ];
  const E = [
    ['core','park',2020,true],['park','zhengwei',2020,true],
    ['park','yuanzhou',2021,true],['core','sunwoda',2021,true],
    ['core','mobility',2021,false],['mobility','xiaodao',2021,true],
    ['park','infra',2022,true],['infra','invest',2023,true],
    ['core','energy',2023,false],['energy','sunwoda',2023,true],
    ['mobility','tailing',2023,true],['mobility','xinri',2023,true],
    ['core','electronic',2024,false],['electronic','huatong',2025,true],
    ['core','daikin',2025,true],['core','food',2025,false],['food','farmbase',2025,true]
  ];
  const Y = {
    2020:{title:'把分散的工业，放进更大的产业平台',sub:'智能装备产业园与大项目布局，是后来产业集聚的重要起点。',value:'>1000亿',label:'当年全县规上工业总产值',source:'industry25'},
    2021:{title:'产业园开始接住新产线',sub:'正威一期、欣旺达二期、小刀一期等项目推进或投产；图中不以未公开的交易线补全供应链。',value:'1308.6亿',label:'全年规上工业总产值',source:'government'},
    2022:{title:'真正承载产业的，还有路、电、管网',sub:'园区基础设施工程推进；交通与要素供应是集群的先决条件。',value:'6项',label:'园区基础设施工程',source:'infra'},
    2023:{title:'从单体项目，长出储能与整车分支',sub:'183宗项目集中动工投产，其中101宗新动工、82宗投产；两种状态不能混为一谈。',value:'183宗',label:'当年2月集中动工及投产项目',source:'projects'},
    2024:{title:'电子信息成为越来越粗的产业枝干',sub:'2024年工业总产值超过1800亿元，电子信息行业规模接近650亿元。',value:'近650亿',label:'新一代电子信息产业规上产值',source:'industry24'},
    2025:{title:'规模跨过千亿，产业节点继续增加',sub:'GDP与工业总产值是不同指标。华通破百亿、大金新基地和绿色食品产业是不同方向的新观察点。',value:'1005.45亿',label:'2025年地区生产总值（GDP）',source:'gdp'},
    2026:{title:'下一道题：长得大，还是连得紧？',sub:'2026年发布的回顾资料披露8个百亿级产业集群；真实供应、订单、利润与研发协同仍需核对。',value:'8个',label:'截至2025年形成的百亿级产业集群',source:'industry25'}
  };
  const u = new URL(location.href), requestedYear = Number(u.searchParams.get('history'));
  let year = Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2026 ? requestedYear : 2026;
  let focus = N.some(n=>n.id === u.searchParams.get('entity')) ? u.searchParams.get('entity') : '';
  let category = 'all', playing = false, timer = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const filterButtons = Array.from(root.querySelectorAll('[data-bh-filter]'));
  const years = Array.from(root.querySelectorAll('[data-bh-year]'));
  const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nodeById = Object.fromEntries(N.map(n=>[n.id,n]));
  function point(n, mobile) { return {x:mobile?n.mx:n.x,y:mobile?n.my:n.y,w:mobile?n.mw:n.w,h:mobile?50:(n.id==='core'?74:54)}; }
  function stop() { clearInterval(timer); timer=0; playing=false; $('bhPlay').setAttribute('aria-pressed','false'); $('bhPlay').innerHTML='▶ <span>播放六年变化</span>'; }
  function renderInfo() {
    const n = focus ? nodeById[focus] : null, data = n && n.year <= year ? n : null;
    const story = Y[year], s = sources[data ? data.source : story.source];
    $('bhInfoKicker').textContent = data ? '关键节点 · ' + data.year : year + ' / 此时的博罗';
    $('bhInfoTitle').textContent = data ? data.title : (year === 2026 ? '我们还不知道，这些线有多粗。' : story.title);
    $('bhInfoBody').textContent = data ? data.detail : (year===2026 ? '这张图的线记录产业归属、项目建设和公开报道，并不证明企业之间有直接交易。八个百亿集群属于产业规模，不能据此测出供应链的韧性。' : story.sub);
    $('bhQuestion').textContent = data ? data.question : (year===2026 ? '如果核心订单外流、关键项目延期，哪些本地企业最先感受到？' : '下一年，哪一条连接会出现？谁将从中受益？');
    $('bhSource').href=s.url; $('bhSource').textContent='查看这条依据 ↗'; $('bhSource').setAttribute('aria-label','查看依据：'+s.name);
    $('bhSourceName').textContent=s.name;
  }
  function renderGraph() {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const svg = $('bhSvg'), now = N.filter(n => n.year <= year);
    svg.setAttribute('viewBox',mobile?'0 0 420 730':'0 0 1040 470');
    const linked = new Set(focus ? [focus] : []);
    if(focus) E.forEach(e => {if(e[0]===focus)linked.add(e[1]);if(e[1]===focus)linked.add(e[0]);});
    const enabled = n => category === 'all' || n.group === category || n.id === 'core';
    const dim = n => (focus ? !linked.has(n.id) : !enabled(n));
    let links = '<g aria-hidden="true">';
    E.filter(e => e[2] <= year).forEach(e => {
      const a=nodeById[e[0]], b=nodeById[e[1]];
      const A=point(a,mobile),B=point(b,mobile),dx=B.x-A.x,dy=B.y-A.y;
      const curved = Math.abs(dx)>Math.abs(dy) ? 'M'+A.x+','+A.y+' C'+(A.x+dx*.53)+','+A.y+' '+(A.x+dx*.47)+','+B.y+' '+B.x+','+B.y :
        'M'+A.x+','+A.y+' C'+A.x+','+(A.y+dy*.53)+' '+B.x+','+(A.y+dy*.47)+' '+B.x+','+B.y;
      const faded = (focus && e[0]!==focus && e[1]!==focus) || (!focus && category!=='all' && !enabled(a) && !enabled(b));
      const lit = focus && (e[0]===focus || e[1]===focus);
      links+='<path d="'+curved+'" class="bh-link '+(e[3]?'bh-link-strong ':'')+(faded?'bh-dim ':'')+(lit?'bh-lit ':'')+'" aria-hidden="true"/>';
    });
    links+='</g><g>';
    now.forEach(n=>{
      const p=point(n,mobile),isDim=dim(n),isSel=focus===n.id;
      links+='<g class="bh-node '+(isSel?'bh-selected ':'')+(isDim?'bh-dim':'')+'" data-bh-id="'+esc(n.id)+'" data-group="'+esc(n.group)+'" transform="translate('+p.x+','+p.y+')" tabindex="0" role="button" aria-pressed="'+isSel+'" aria-label="'+esc(n.name)+'，'+esc(n.sub)+'，点按查看依据" style="animation-delay:'+Math.min(320,(n.year-2020)*38)+'ms">';
      links+='<rect class="bh-node-box" x="'+(-p.w/2)+'" y="'+(-p.h/2)+'" width="'+p.w+'" height="'+p.h+'" rx="'+(n.id==='core'?20:13)+'"/>';
      links+='<text y="-3">'+esc(n.name)+'</text><text class="bh-node-sub" y="17">'+esc(n.sub)+'</text></g>';
    });
    if(year===2026) {
      const p=point(nodeById.core,mobile),rad=mobile?95:106;
      links+='<circle class="bh-breath" cx="'+p.x+'" cy="'+p.y+'" r="'+rad+'"/>';
      links+='<text class="bh-unknown" x="'+p.x+'" y="'+(p.y+rad+24)+'">真实订单网络：待核实</text>';
    }
    links+='</g>';svg.innerHTML=links;
    $('bhMapStatus').textContent=year+'年 · 可见'+now.length+'个代表性节点';
  }
  function syncUrl() {
    try {const url=new URL(location.href);url.searchParams.set('history',year);if(focus)url.searchParams.set('entity',focus);else url.searchParams.delete('entity');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
    catch {}
  }
  function render() {
    if (focus && nodeById[focus].year>year)focus='';
    const y=Y[year];
    $('bhYearText').textContent=year;
    $('bhStoryTitle').textContent=y.title;$('bhStorySub').textContent=y.sub;
    $('bhMetric').textContent=y.value;$('bhMetricLabel').textContent=y.label;
    years.forEach(b=>{const on=Number(b.dataset.bhYear)===year;b.setAttribute('aria-current',String(on));b.setAttribute('aria-pressed',String(on));});
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bhFilter===category)));
    renderGraph();renderInfo();syncUrl();
  }
  function selectYear(next) { year=Math.min(2026,Math.max(2020,next));render(); }
  years.forEach(b=>b.addEventListener('click',()=>{stop();selectYear(Number(b.dataset.bhYear));}));
  filterButtons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.bhFilter;render();}));
  $('bhSvg').addEventListener('click',e=>{const target=e.target.closest('[data-bh-id]');if(!target)return;focus=focus===target.dataset.bhId?'':target.dataset.bhId;render();});
  $('bhSvg').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const target=e.target.closest('[data-bh-id]');if(!target)return;e.preventDefault();focus=focus===target.dataset.bhId?'':target.dataset.bhId;render();});
  $('bhShare').addEventListener('click', async () => {
    syncUrl();
    const shareUrl = new URL(location.href); shareUrl.hash = '#bhHistory';
    try { await navigator.clipboard.writeText(shareUrl.href); $('bhShare').textContent='已复制当前年份链接'; }
    catch { window.prompt('复制这一年的公开网络链接',shareUrl.href); }
  });
  $('bhPlay').addEventListener('click',()=>{
    if(playing){stop();return;}
    if(year===2026)year=2020;else year=2020;
    focus='';category='all';render();
    if(prefersReduced.matches){year=2026;render();return;}
    playing=true;$('bhPlay').setAttribute('aria-pressed','true');$('bhPlay').innerHTML='Ⅱ <span>暂停回放</span>';
    timer=setInterval(()=>{if(year>=2026){stop();return;}year++;render();if(year===2026)stop();},1150);
  });
  window.addEventListener('resize',()=>renderGraph(),{passive:true});
  window.addEventListener('pagehide',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('popstate',()=>{stop();const url=new URL(location.href);const y=Number(url.searchParams.get('history'));if(y>=2020&&y<=2026)year=y;focus=N.some(n=>n.id===url.searchParams.get('entity'))?url.searchParams.get('entity'):'';render();});
  render();
})();
