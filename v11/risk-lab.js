(()=>{"use strict";
const $=id=>document.getElementById(id);
const motion=window.RiskMotion;
const confidence=[80,85,90,95,99,99.5],zScores=[1.282,1.44,1.645,1.96,2.576,2.807];
const ref={
 current:"https://fz0752.com/fontHtml/html/issue/000143025_1.html",
 electronic:"https://news.southcn.com/node_54a44f01a2/26ba1c8a43.shtml",
 govt:"https://www.boluo.gov.cn/zwgk/qt/gzjh/content/post_5842396.html",
 history:"https://epaper.nfnews.com/nfdaily/html/202602/03/content_10162180.html",
 plan:"https://epaper.nfnews.com/nfdaily/html/202610/30/content_10184753.html",
 agri:"https://www.cnbayarea.org.cn/policy/policyrelease/policies/content/mpost_1334549.html",
 firms:"https://www.hznews.com/focus_news/202602/t20260226_1643902.shtml"
};
const cases={
 electronic:{title:"电子信息，离千亿还有多远？",sub:"2025年公开报道产值超过773.8亿元。检验到2030年跨越1000亿元参照线需要什么增长条件。",status:"可算增长条件",label:"假设年均增速",min:-5,max:15,step:.5,initial:5,
  source:[["产业规模",ref.electronic],["制造业规划",ref.plan]],known:[["2025行业产值","超过773.8亿元"],["产业方向","千亿级电子信息集群"]],missing:"2025准确行业产值、2026全年最新值、产能释放、产品结构和订单兑现。",questions:["如果年均增速低于5.3%，千亿参照线是否更难跨越？","扩产能力和企业产品升级，哪项才是核心变量？","产业规模增长能否产生更多本地配套？"]},
 projects:{title:"工业在增长，项目接续会不会掉队？",sub:"生产和投资正在朝不同方向变化。计算投资恢复到2025年同期水平，需要怎样的后续增长。",status:"可算恢复条件",label:"假设今后每年同期投资回升",min:-5,max:35,step:1,initial:10,
 source:[["2026前三季度数据",ref.current],["产业项目报道",ref.firms]],known:[["规上工业增加值（2026前3季）","+8.9%"],["工业投资（2026前3季）","−44.7%"]],missing:"项目分年储备、开工与投产日期、不同项目投资强度、实际产能及产销数据。",questions:["工业投资什么时候能恢复到2025年同期水平？","现有生产与新增项目接续之间存在怎样的时间差？","哪些企业和细分行业更依赖新项目？"]},
 tea:{title:"柏塘春茶，增值到底留在了哪里？",sub:"不把丰收当作高附加值。用单品价值链示例检验：加工和渠道留在本地的比例，怎样影响本地价值留存。",status:"尚缺实测账本",label:"假设加工增值留在本地的比例",min:0,max:100,step:5,initial:35,secondary:{label:"假设渠道增值留在本地的比例",min:0,max:100,step:5,initial:20},
 source:[["县域农文旅发展方向",ref.agri],["博罗规划部署",ref.plan]],known:[["研究对象","柏塘特色茶产业"],["发展方向","加工、品牌、渠道增值"]],missing:"茶青采收量、交易价格、加工成本与损耗、经营主体归属、终端渠道分成、规划中可比增值目标。",questions:["同样一斤春茶，加工与品牌能多留下多少价值？","茶农、加工厂和渠道谁承担了资金周转？","农产品加工率与本地增值率是否被混为一谈？"]},
 ring:{title:"环“两山”，游客来了，价值留下了吗？",sub:"游览量、过夜率和本地消费不能混为一谈。按每100名游客的假设场景检验不同转化条件。",status:"尚缺游客消费账本",label:"假设过夜游客比例",min:0,max:70,step:5,initial:15,secondary:{label:"假设消费由本地经营环节留存的比例",min:0,max:100,step:5,initial:40},
 source:[["县域环两山发展部署",ref.plan],["市十五五规划方向",ref.agri]],known:[["规划框架","环南昆山—罗浮山"],["观察视角","过夜、消费与本地留存"]],missing:"不同镇街的实际游客数、过夜比例、人均消费、外来经营主体和中间投入采购。",questions:["客流越多，为什么本地增加值未必同步增加？","游客过夜率和消费留存哪个更值得补数据？","环两山是否带动本地农产品加工与服务业？"]},
 innovation:{title:"652家数字化转型企业，效率提升了多少？",sub:"有实施数量，不等于有绩效成果。需要真正的转型前后对照；先计算抽样调查的统计精度边界。",status:"绩效转化未测定",label:"计划随机核验的转型企业数",min:20,max:250,step:10,initial:80,secondary:{label:"拟调查的置信水平",min:0,max:5,step:1,initial:3},
 source:[["2025统计公报背景",ref.history],["2026县域产业方向",ref.plan]],known:[["实施数字化转型","652家"],["全县规上工业企业","1,407家"]],missing:"每家企业转型前后产出、成本、设备、就业、行业、选择偏差及可比较的未转型企业样本。",questions:["实施数字化转型的企业，是否真的提升了生产率？","哪些企业有真实的转型前后对照？","创新成果能否形成可持续的本地产业能力？"]}
};
const state={active:"electronic",values:{electronic:[5],projects:[10],tea:[35,20],ring:[15,40],innovation:[80,3]},picked:new Set()};
const presets={electronic:[0,5,10],projects:[0,10,25],tea:[0,35,100],ring:[0,15,50],innovation:[20,80,240]};
let renderedCase="", pendingRender=0, playFrame=0, playing=false, statusTimer=0, returnFocus=null;
const byid={electronic:"电子信息",projects:"工业接续",tea:"柏塘春茶",ring:"环两山",innovation:"创新"};
const fmt=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function current(){return cases[state.active]}
function val(i=0){return state.values[state.active][i]}
function options(id){if(!cases[id])return;stopPlay();state.active=id;document.querySelectorAll("[data-case]").forEach(b=>{const active=b.dataset.case===id;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});render();announce("已切换"+byid[id]+" · 改条件，看差别");}
function text(id,s){$(id).textContent=s}
function badge(s,good=false,missing=false){const t=$("riskBadge");t.className="status"+(good?" ok":missing?" missing":"");t.textContent=s}
function unitNumber(n,unit){return fmt(n,1)+unit}
function setupInputs(){
 const c=current(),v=val();
 text("controlLabel",c.label);text("sliderValue",String(v)+(state.active==="innovation"?"家":"%"));
 const s=$("slider");s.min=c.min;s.max=c.max;s.step=c.step;s.value=v;s.setAttribute("aria-label",c.label);
 const s2=$("secondControl");s2.classList.toggle("invisible",!c.secondary);
 if(c.secondary){text("controlLabel2",c.secondary.label);const f=$("slider2");f.min=c.secondary.min;f.max=c.secondary.max;f.step=c.secondary.step;f.value=val(1);f.setAttribute("aria-label",c.secondary.label);const label=(state.active==="innovation"?confidence[val(1)]:val(1))+"%";text("sliderValue2",label);f.setAttribute("aria-valuetext",label);}
 s.style.setProperty("--range-fill",100*(v-c.min)/(c.max-c.min)+"%");
 if(c.secondary)$("slider2").style.setProperty("--range-fill",100*(val(1)-c.secondary.min)/(c.secondary.max-c.secondary.min)+"%");
}
function chartAxis(min,max,step,threshold){
 let out="";
 const y=n=>232-(n-min)/(max-min)*190;
 for(let i=min;i<=max+.0001;i+=step){const yy=y(i);out+='<line x1="63" x2="735" y1="'+yy+'" y2="'+yy+'" stroke="#d9e7f5" stroke-width="1"/><text x="51" y="'+(yy+4)+'" text-anchor="end">'+fmt(i,0)+'</text>';}
 if(Number.isFinite(threshold)){const yy=y(threshold);out+='<line x1="63" x2="735" y1="'+yy+'" y2="'+yy+'" class="threshold"/><text x="730" y="'+(yy-9)+'" text-anchor="end" fill="#bc7963" style="fill:#bc7963">参照线 '+fmt(threshold,0)+'</text>';}
 return {out,y};
}
function linePlot(labels,values,min,max,step,threshold,unit){
 const a=chartAxis(min,max,step,threshold),xx=i=>75+i*128,coords=values.map((n,i)=>[xx(i),a.y(n)]);
 let out='<svg viewBox="0 0 780 270" role="img" aria-label="条件情景曲线"><title>基于用户假设的阶段变化，不是官方预测</title><defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b93de" stop-opacity=".26"/><stop offset="1" stop-color="#2b93de" stop-opacity="0"/></linearGradient></defs>';
 out+=a.out;
 const line=coords.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" ");
 out+='<path d="'+line+' L '+coords[coords.length-1][0]+' 232 L '+coords[0][0]+' 232 Z" fill="url(#grad)"/><path d="'+line+'" fill="none" stroke="#227ed8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
 coords.forEach((p,i)=>{out+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===coords.length-1?7:5)+'" fill="'+(i===coords.length-1?"#1b76d1":"#76b9ed")+'" stroke="#fff" stroke-width="2"/><text x="'+p[0]+'" y="257" text-anchor="middle">'+escapeHTML(labels[i])+'</text>';});
 out+='<text x="718" y="16" text-anchor="end" style="fill:#7197b9">'+escapeHTML(unit)+'</text></svg>';
 return out;
}
function barPlot(parts,overall){
 const total=parts.reduce((a,b)=>a+b[1],0);
 let out='<svg viewBox="0 0 780 270" role="img" aria-label="条件下各环节价值留存图"><title>自定参数的环节分解示意，不是柏塘实测</title>';
 let x=67;
 parts.forEach((p,i)=>{
  const width=600*(p[1]/total);
  out+='<rect x="'+x+'" y="52" width="'+width+'" height="94" rx="8" fill="'+["#2180d7","#24b7aa","#987edc","#9cb0c6"][i]+'" stroke="#fff" stroke-width="3"/>';
  out+='<text x="'+(x+width/2)+'" y="92" text-anchor="middle" style="fill:white;font-size:15px;font-weight:850">'+escapeHTML(p[0])+'</text><text x="'+(x+width/2)+'" y="118" text-anchor="middle" style="fill:#fff;font-size:15px;font-weight:900">'+fmt(p[1],1)+'</text>';
  x+=width;
 });
 out+='<text x="65" y="183" class="major">其中本地留存（条件估算）</text>';
 out+='<rect x="65" y="198" rx="9" width="602" height="24" fill="#e3edf8"/><rect x="65" y="198" rx="9" width="'+(602*overall/100)+'" height="24" fill="#1aa69d"/>';
 out+='<text x="675" y="219" style="font-weight:900;fill:#117f84">'+fmt(overall,1)+'%</text></svg>';
 return out;
}
function chartTourist(overnight,retention,spend,local){
 let out='<svg viewBox="0 0 780 270" role="img" aria-label="每100位游客条件下的消费构成"><title>假设消费与留存路径，非真实监测</title>';
 const a=100-overnight, x1=125, x2=410;
 out+='<text class="major" x="70" y="41">100名游客（假设）</text><rect x="68" y="57" width="280" height="26" rx="8" fill="#cbdff4"/><rect x="68" y="57" width="'+(2.8*a)+'" height="26" rx="8" fill="#63aef0"/><text x="362" y="76">当日游 '+a+'人</text>';
 out+='<rect x="68" y="99" width="280" height="26" rx="8" fill="#dbeaf5"/><rect x="68" y="99" width="'+(2.8*overnight)+'" height="26" rx="8" fill="#9882e4"/><text x="362" y="118">过夜 '+overnight+'人</text>';
 out+='<path d="M 360 156 Q 400 160 435 170" fill="none" stroke="#79add0" stroke-width="2"/>';
 out+='<text class="major" x="475" y="169">总消费 '+fmt(spend,0)+'元</text>';
 out+='<text class="major" x="475" y="197">本地留存 '+fmt(local,0)+'元</text>';
 out+='<rect x="68" y="220" width="603" height="18" rx="7" fill="#e5eef7"/><rect x="68" y="220" width="'+(6.03*retention)+'" height="18" rx="7" fill="#1aa79b"/>';
 out+='<text x="68" y="260">所示金额均为每100游客的情景量，不代表游客实测消费</text></svg>';
 return out;
}
function chartInnovation(n,moe,level){
 const percent=100*652/1407;
 let out='<svg viewBox="0 0 780 270" role="img" aria-label="数字化转型覆盖比例和潜在抽样误差"><title>覆盖率基于公开统计，误差区间基于拟议抽样计划</title>';
 out+='<circle cx="170" cy="128" r="79" fill="none" stroke="#e5edf7" stroke-width="24"/>';
 out+='<circle cx="170" cy="128" r="79" fill="none" stroke="#2686df" stroke-width="24" stroke-linecap="round" stroke-dasharray="'+(496.4*percent/100)+' 496.4" transform="rotate(-90 170 128)"/>';
 out+='<text x="170" y="129" text-anchor="middle" style="font-size:39px;fill:#136cb9;font-weight:920">'+fmt(percent,1)+'%</text><text x="170" y="154" text-anchor="middle">实施覆盖比例</text>';
 out+='<text x="320" y="78" class="major">抽样计划 '+n+'家</text><rect x="320" y="94" width="370" height="25" rx="8" fill="#e8f0f9"/><rect x="320" y="94" width="'+(370*n/250)+'" height="25" rx="8" fill="#49a3e0"/>';
 out+='<text x="320" y="167" class="major">比例型结果的最大误差半宽 ±'+fmt(moe,1)+'个百分点</text><text x="320" y="195">前提：在652家总体内简单随机抽样；尚未进行调查</text>';
 out+='<text x="320" y="219">不存在已实测的“数字化绩效达成率”</text></svg>';
 return out;
}
function indexReturn(){return (Math.pow(100/55.3,1/4)-1)*100}
function calc(){
 const id=state.active,primary=val(),secondary=val(1),d=current();
 let data={badge:"",good:false,missing:false,major:"",unit:"",detail:"",second:"",secondDetail:"",chart:"",foot:"",chain:[],bars:[]};
 if(id==="electronic"){
   const growth=primary/100,values=Array.from({length:6},(_,i)=>773.8*Math.pow(1+growth,i)),end=values[5];
   const needed=(Math.pow(1000/773.8,1/5)-1)*100;
   data.badge=end>=1000?"下限情景可跨线":"下限情景未跨线";data.good=end>=1000;
   data.major=fmt(end,1);data.unit="亿元 · 2030条件值";data.detail="以2025年报道下限773.8亿元计算。实际基数高于下限，因此图中是保守情景值。";
   data.second=fmt(needed,2)+"%";data.secondDetail="从773.8亿元下限出发，五年复合增长跨越1000亿元的年均增速上界参考。";
   data.chart=linePlot(["2025","2026","2027","2028","2029","2030"],values,Math.min(600,150*Math.floor(Math.min(...values)/150)),150*Math.ceil(Math.max(1000,...values)/150),150,1000,"单位：亿元（假设增长）");
   data.foot="1000亿是千亿级产业规模参照线，不直接冒充规划中明确的2030考核指标。";
   data.chain=["2025产业规模","产能及订单","年均增速假设","2030产业参照"];data.bars=[["3%情景",773.8*Math.pow(1.03,5)],["5%情景",773.8*Math.pow(1.05,5)],["8%情景",773.8*Math.pow(1.08,5)]];
 }else if(id==="projects"){
   const values=[100,55.3,...Array.from({length:4},(_,i)=>55.3*Math.pow(1+primary/100,i+1))],end=values[5];
   const req=indexReturn();
   data.badge=end>=100?"同期指数恢复（假设）":"同期指数未恢复（假设）";data.good=end>=100;
   data.major=fmt(end,1);data.unit="2030年同季投资指数";data.detail="以2025年前三季度工业投资=100、2026年同比−44.7%计算为55.3。此后增速由用户设定。";
   data.second=fmt(req,1)+"%";data.secondDetail="如果2027—2030每年前三季度同口径投资持续增长，需要约此增速才回到2025同期水平。";
   data.chart=linePlot(["2025","2026","2027","2028","2029","2030"],values,0,Math.max(160,40*Math.ceil(Math.max(...values)/40)),40,100,"2025同季投资=100");
   data.foot="这只是投资恢复条件，不是产能增长模型或官方2030工业目标达成率。";
   data.chain=["当前生产增长","当期投资收缩","项目建设时滞","新增产能接续"];data.bars=[["2025同期",100],["2026同期",55.3],["2030情景",end]];
 }else if(id==="tea"){
   const p=primary/100,c=secondary/100;
   const farm=23,process=32,channel=25,external=20,local=farm+process*p+channel*c;
   data.badge="只有情景结果";data.missing=true;
   data.major=fmt(local,1)+"%";data.unit="每100元终端销售额的本地增值留存";data.detail="演示假设：每100元销售额包含种植增值23元、加工32元、渠道25元及外部中间投入20元；各环节本地占比由你调整。";
   data.second=fmt(100-local,1)+"%";data.secondDetail="示例中未在本地经营主体形成的价值比例。实际占比必须用经营数据重估。";
   data.chart=barPlot([["种植增值",23],["加工增值",32],["渠道增值",25],["外部投入",20]],local);
   data.foot="23/32/25/20是包含外部中间投入的示范核算结构，并非柏塘实际成本、交易额或十五五目标完成率。";
   data.chain=["茶青生产","收购加工","品牌渠道","本地价值留存"];data.bars=[["生产本地",23],["加工本地",32*p],["渠道本地",25*c]];
 }else if(id==="ring"){
   const n=primary,retain=secondary/100,all=(100-n)*90+n*600,local=all*retain;
   data.badge="只有情景结果";data.missing=true;
   data.major=fmt(local,0)+"元";data.unit="每100位游客的本地消费留存代理";data.detail="假设当日游每人消费90元、过夜每人600元，按你设定的过夜率与本地留存比例计算。";
   data.second=fmt(all,0)+"元";data.secondDetail="同一100游客假设产生的总消费；不是实际营业额、税收或地区增加值。";
   data.chart=chartTourist(n,secondary,all,local);
   data.foot="消费金额、过夜率及留存份额均为可替换的演示参数。正式核算需游客调查与经营主体数据。";
   data.chain=["游客到访","停留与过夜","消费发生地","本地经营留存"];data.bars=[["到访100人",100],["过夜人数",n],["留存份额",secondary]];
 }else{
   const n=primary,N=652;
   const fpc=Math.sqrt((N-n)/(N-1)),moe=zScores[secondary]*Math.sqrt(.25/n)*fpc*100;
   data.badge="无绩效实测系数";data.missing=true;
   data.major=fmt(100*N/1407,1)+"%";data.unit="数字化转型实施覆盖比例";data.detail="652家实施数字化转型/1407家规上工业企业。该覆盖比例不是生产率提升比例。";
   data.second="±"+fmt(moe,1)+"百分点";data.secondDetail="拟议抽样的最坏情形"+confidence[secondary]+"%误差半宽，假定简单随机抽样，且未考虑非响应偏差。";
   data.chart=chartInnovation(n,moe,confidence[secondary]);
   data.foot="目前没有企业经营绩效和可比调查样本，不能计算真实转型效果。";
   data.chain=["数字化实施","可比经营样本","效果识别","能力转化"];data.bars=[["实施转型",100*N/1407],["其他规上",100*(1-N/1407)],["拟抽样",100*n/N]];
 }
 return data;
}

const townIndex=["罗阳街道","龙溪街道","石湾镇","园洲镇","杨村镇","公庄镇","湖镇镇","长宁镇","横河镇","龙华镇","柏塘镇","泰美镇","杨侨镇","麻陂镇","观音阁镇","石坝镇"];
const inquiryTownFocus={
 electronic:["罗阳街道","园洲镇","石湾镇","湖镇镇"],
 projects:["罗阳街道","龙溪街道","石湾镇","园洲镇"],
 tea:["柏塘镇"],
 ring:["园洲镇","石湾镇","长宁镇","湖镇镇","横河镇"],
 innovation:["罗阳街道","园洲镇"]
};
function renderSpatial(){
 const focus=new Set(inquiryTownFocus[state.active]);
 text("spatialFocus",byid[state.active]);
 text("spatialTip","高亮"+focus.size+"个建议调查入口；没有高亮不代表没有产业。");
 $("spatialNodes").innerHTML=townIndex.map((name,i)=>{
  const a=(i*360/townIndex.length-90)*Math.PI/180;
  const x=50+39*Math.cos(a),y=51+38*Math.sin(a);
  return '<button class="spatial-node '+(focus.has(name)?"focus":"quiet")+'" type="button" data-spatial-town="'+escapeHTML(name)+'" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" title="将'+escapeHTML(name)+'加入调查清单">'+escapeHTML(name.replace("街道",""))+'</button>';
 }).join("");
 $("spatialNodes").querySelectorAll("[data-spatial-town]").forEach(btn=>btn.onclick=()=>{
  const name=btn.dataset.spatialTown;
  pick("镇街调查："+name+"｜围绕"+byid[state.active]+"，哪些企业、产品或项目联系有独立的公开证据？");
 });
}

function render(){
 const c=current(),d=calc(),changed=renderedCase!==state.active;
 text("mainTitle",c.title);text("mainDesc",c.sub);
 badge(d.badge,d.good,d.missing);
 setupInputs();
 motion.html("mainPlot",d.chart,!changed);
 text("mainPlotNote",d.foot);
 text("primaryOutput",d.major);text("primaryUnit",d.unit);text("primaryDetail",d.detail);
 text("secondaryOutput",d.second);text("secondaryUnit",d.secondDetail);
 if(changed)$("chain").innerHTML=d.chain.map((s,i)=>'<span>'+escapeHTML(s)+'</span>'+(i<d.chain.length-1?'<i>→</i>':"")).join("");
 const mx=Math.max(...d.bars.map(x=>x[1]),1);
 motion.html("scenarioBars",d.bars.map(x=>'<div class="barrow"><span>'+escapeHTML(x[0])+'</span><div class="bartrack"><i style="width:'+(100*x[1]/mx).toFixed(3)+'%"></i></div><strong>'+fmt(x[1],1)+'</strong></div>').join(""),!changed);
 if(changed){
 $("known").innerHTML=c.known.map(s=>'<div class="known"><span class="k">●</span><span><b>'+escapeHTML(s[0])+'</b><small>'+escapeHTML(s[1])+'</small></span></div>').join("");
 $("unknown").innerHTML='<div class="known"><span class="u">○</span><span><b>当前没有的关键数据</b><small>'+escapeHTML(c.missing)+'</small></span></div>';
 text("missingText",c.missing);
 text("modelHint",d.foot);
 $("questionList").innerHTML=c.questions.map((s,i)=>'<button class="risk-point" type="button" data-question="'+i+'" title="保存这个疑问"><span></span><span><strong>'+escapeHTML(s)+'</strong><small>点击加入你的研判清单</small></span></button>').join("");
 document.querySelectorAll("[data-question]").forEach(b=>b.onclick=()=>pick(c.questions[Number(b.dataset.question)]));
 $("sources").innerHTML=c.source.map(s=>'<a href="'+escapeHTML(s[1])+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s[0])+' ↗</a>').join('　');
 renderSpatial();
 }
 text("pickCounter",state.picked.size);
 text("chosen",state.picked.size?"已选 "+state.picked.size+" 条追问":"点一个问题，再继续探索");
 renderLive(changed);
 renderedCase=state.active;
 document.dispatchEvent(new CustomEvent("risk-lab:render",{detail:{case:state.active,values:[...state.values[state.active]],changed}}));
}
function metric(id,values){
 const [a,b]=values;
 if(id==="electronic")return {value:773.8*Math.pow(1+a/100,5),label:"2030条件产值",unit:"亿元",digits:1,foot:"以2025年报道下限为基数 · 按所选增速计算",kind:"公开基数 + 增长假设"};
 if(id==="projects")return {value:55.3*Math.pow(1+a/100,4),label:"2030同季投资指数",unit:"指数",digits:1,foot:"2025同期＝100 · 计算投资恢复条件",kind:"公开降幅 + 恢复假设"};
 if(id==="tea")return {value:23+32*a/100+25*b/100,label:"每100元销售额的本地增值",unit:"元",digits:1,foot:"种植23 + 加工32×留存比例 + 渠道25×留存比例",kind:"演示假设 · 非柏塘实测"};
 if(id==="ring")return {value:((100-a)*90+a*600)*b/100,label:"每100游客的本地消费留存代理",unit:"元",digits:0,foot:"当日游90元、过夜600元为演示假设",kind:"演示假设 · 非游客实测"};
 return {value:zScores[b]*Math.sqrt(.25/a)*Math.sqrt((652-a)/651)*100,label:"拟随机抽样的最大误差半宽",prefix:"±",unit:"个百分点",digits:1,foot:confidence[b]+"%置信水平 · 尚未调查，不是转型成效",kind:"拟调查设计 · 无绩效实测"};
}
function initialValues(id){const c=cases[id];return c.secondary?[c.initial,c.secondary.initial]:[c.initial];}
function renderLive(changed){
 const id=state.active,m=metric(id,state.values[id]),base=metric(id,initialValues(id)).value,delta=m.value-base;
 text("liveLabel",m.label);text("livePrefix",m.prefix||"");text("liveUnit",m.unit);text("liveFoot",m.foot);text("labMode",m.kind);
 // Different topics have different units; never animate a number across topic boundaries.
 if(changed){text("liveOutput",fmt(m.value,m.digits));$("liveOutput").dataset.value=String(m.value);}
 motion.number($("liveOutput"),m.value,m.digits,changed?0:240);
 const suffix=id==="innovation"?"个百分点":m.unit;
 text("liveDelta",Math.abs(delta)<.00001?"初始条件 · 试着改变下面的滑块":"比初始条件 "+(delta>=0?"+":"−")+fmt(Math.abs(delta),m.digits)+" "+suffix);
 $("liveDelta").classList.toggle("is-changed",Math.abs(delta)>.00001);
 const labels=id==="innovation"?["少量核验","初始样本","扩大样本"]:["较低条件","初始条件","较高条件"];
 motion.html("scenarioPresets",presets[id].map((n,i)=>'<button type="button" data-live-preset="'+n+'" aria-pressed="'+(n===val())+'"><span>'+labels[i]+'</span><b>'+n+(id==="innovation"?"家":"%")+'</b></button>').join(""),false);
 $("scenarioPresets").querySelectorAll("button").forEach(button=>button.onclick=()=>setValues([+button.dataset.livePreset],"quick"));
 $("motionLab").dataset.case=id;
}
function announce(message){clearTimeout(statusTimer);statusTimer=setTimeout(()=>text("labStatus",message),140);}
function queueRender(){if(!pendingRender)pendingRender=requestAnimationFrame(()=>{pendingRender=0;render();});}
function setValues(values,source="user"){
 if(source!=="play")stopPlay();
 const c=current(),before=state.values[state.active].join();
 values.forEach((n,i)=>{if(n===undefined)return;const p=i?c.secondary:c;if(!p)return;state.values[state.active][i]=Math.max(p.min,Math.min(p.max,+(p.min+Math.round((n-p.min)/p.step)*p.step).toFixed(5)));});
 if(before!==state.values[state.active].join())queueRender();
 if(source!=="play")announce("已联动更新 · "+(source==="heat"?"热力格条件":source==="sensitivity"?"单变量对照":c.label)+"已应用");
}
function playLabel(){
 $("playScenario").innerHTML=playing?'<span aria-hidden="true">Ⅱ</span> 暂停变化':motion.reduced.matches?'逐步比较':'<span aria-hidden="true">▶</span> 播放变化';
 $("playScenario").setAttribute("aria-pressed",String(playing));$("motionLab").classList.toggle("is-playing",playing);
}
function stopPlay(){cancelAnimationFrame(playFrame);playFrame=0;playing=false;playLabel();}
function play(){
 if(playing){stopPlay();announce("已暂停 · 保留当前条件，可继续手动调整");return;}
 if(motion.reduced.matches){const list=presets[state.active],next=list.find(x=>x>val())??list[0];setValues([next],"step");return;}
 playing=true;playLabel();text("labStatus","正在播放假设变化 · 可随时暂停或拖动滑块");
 const id=state.active,keys=[val(),presets[id][0],presets[id][2],cases[id].initial],start=performance.now(),leg=1800;
 const frame=now=>{
  if(!playing||state.active!==id)return;
  const elapsed=now-start,index=Math.min(2,Math.floor(elapsed/leg)),t=Math.min(1,(elapsed-index*leg)/leg),e=(1-Math.cos(Math.PI*t))/2;
  setValues([keys[index]+(keys[index+1]-keys[index])*e],"play");
  if(elapsed>=leg*3){stopPlay();announce("演示完成 · 已回到初始主条件，图表可继续点选");return;}
  playFrame=requestAnimationFrame(frame);
 };
 playFrame=requestAnimationFrame(frame);
}
function pick(q){state.picked.add(byid[state.active]+"｜"+q);text("pickCounter",state.picked.size);text("chosen","已选 "+state.picked.size+" 条追问");toast("已加入待研判清单");}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("on");clearTimeout(window.__tt);window.__tt=setTimeout(()=>t.classList.remove("on"),2500);}
function showDrawer(){
 returnFocus=document.activeElement;
 $("detailOverlay").classList.add("open");
 document.querySelector("main").inert=true;document.querySelector("header").inert=true;
 $("drawerText").innerHTML='<article><h3>证据与情景分开</h3><p>2026年前三季度工业增加值+8.9%、工业投资−44.7%；2025电子信息产值超过773.8亿元；2025规上企业1407家。这些属于有公开报道支持的观测或统计口径。</p></article><article><h3>模型不能冒充实测</h3><p>电子信息使用有界基期的复合增长条件核算，工业投资使用同季指数恢复测试；农业和环“两山”使用价值链/地方留存条件核算；创新转化使用拟议抽样的最大误差分析。所有由用户设置的参数只是条件实验。</p></article><article><h3>当前证据能支持什么</h3><p>公开线索可以帮助发现值得核实的产业联系，但缺少企业交易记录或可比调查时，不能宣称已确定因果影响或收益。</p></article><article><h3>规划与统计口径</h3><p>千亿级电子信息是规模方向的参照，不宣称已核对为2030年具有量化约束的考核目标。没有正式数值目标与基期数据时，“目标达成率”显示为未可计算。</p><p><a href="'+ref.govt+'" target="_blank" rel="noopener noreferrer">博罗县十五五规划发布页</a></p><p><a href="'+ref.current+'" target="_blank" rel="noopener noreferrer">2026年前三季度统计报道</a></p></article>';
 $("closeDrawer").focus();
}
function closeDrawer(){
 $("detailOverlay").classList.remove("open");document.querySelector("main").inert=false;document.querySelector("header").inert=false;
 returnFocus?.focus();
}
function download(){
 if(!state.picked.size){toast("请先选择需要研判的问题");return;}
 const result={project:"博罗决策风洞 V11",page:"03产业目标约束实验",created_at:new Date().toISOString(),items:[...state.picked],scenarios:state.values,notes:"公开事实与情景假设严格分开；条件实验不是政策目标达成率或预测"};
 const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="boluo-v11-industry-risk-questions.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);toast("已导出观察清单");
}
$("tabs").querySelectorAll("[data-case]").forEach(b=>b.onclick=()=>options(b.dataset.case));
$("slider").oninput=e=>setValues([+e.target.value]);
$("slider2").oninput=e=>setValues([undefined,+e.target.value]);
document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{state.values[state.active][0]=+b.dataset.preset;render()});
$("methodBtn").onclick=showDrawer;$("closeDrawer").onclick=closeDrawer;
$("detailOverlay").onclick=e=>{if(e.target===$("detailOverlay"))closeDrawer();};
document.addEventListener("keydown",e=>{
 if(!$("detailOverlay").classList.contains("open"))return;
 if(e.key==="Escape")closeDrawer();
 if(e.key==="Tab"){
  const list=[...$("detailOverlay").querySelectorAll('button,a[href]')],first=list[0],last=list[list.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
$("saveQuestion").onclick=()=>pick(current().questions[0]);
$("exportBtn").onclick=download;
$("playScenario").onclick=play;
$("resetScenario").onclick=()=>{stopPlay();state.values[state.active]=initialValues(state.active);render();announce("已恢复当前专题的初始条件");};
function motionPreference(){
 stopPlay();playLabel();$("reduceMotion").setAttribute("aria-pressed",String(motion.reduced.matches));
 $("reduceMotion").disabled=motion.systemMotion.matches;
 text("reduceMotion",motion.systemMotion.matches?"系统已减少动态":motion.reduced.matches?"恢复动态":"减少动态");
}
$("reduceMotion").onclick=()=>motion.setReduced(!motion.reduced.matches);
motion.reduced.addEventListener("change",motionPreference);
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopPlay();});
window.RiskLab={
 getState:()=>({case:state.active,values:[...state.values[state.active]]}),
 selectCase:options,setValues,metric,
 confidence,zScores
};
options("electronic");motionPreference();
})();
