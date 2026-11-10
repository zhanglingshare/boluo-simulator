(function(){
'use strict';
var YEARS=[
 {y:2020,g:619.04,n:'2020年，博罗GDP为619.04亿元。'},
 {y:2021,g:741.46,n:'2021年，博罗GDP达到741.46亿元。'},
 {y:2022,g:801.39,n:'2022年，博罗GDP达到801.39亿元。'},
 {y:2023,g:838.89,n:'2023年，博罗GDP达到838.89亿元。'},
 {y:2024,g:970.87,n:'2024年GDP最终核实为970.87亿元，早期952.24亿元是初步数。'},
 {y:2025,g:1005.45,n:'2025年GDP首次突破千亿元，按不变价增长5.5%。'}
];
var SECTORS=[
 {id:'s1',name:'第一产业',value:107.44,share:10.7,growth:7.8,color:'#d8ad72',x:274,y:276,icon:'田',topic:'农业生产的价值，怎样更多留在本地？',description:'2025年第一产业增加值107.44亿元，占GDP约10.7%，按不变价增长7.8%。农业的价值不止在产量，还要继续观察加工、渠道和收益回流。',q:['已知：第一产业增加值107.44亿元，实际增长7.8%。','待核：重点农产品加工、渠道回款与农户收益的传导链。'],to:'./industry-chain.html?sector=agri'},
 {id:'s2',name:'第二产业',value:549.01,share:54.6,growth:6.9,color:'#4bbde7',x:502,y:187,icon:'厂',topic:'制造业是博罗的主枝，下一棒由谁接？',description:'2025年第二产业增加值549.01亿元，占GDP约54.6%，按不变价增长6.9%。这是现有经济体量最大的产业分枝，但未来增量仍要看项目投产、订单、配套和增加值形成。',q:['已知：第二产业增加值549.01亿元，实际增长6.9%。','待核：新增项目投产节奏、订单持续性和本地配套比例。'],to:'./industry-chain.html?sector=precision'},
 {id:'s3',name:'第三产业',value:349.00,share:34.7,growth:2.7,color:'#50d5b1',x:721,y:274,icon:'网',topic:'服务业体量不小，价值创造能否提速？',description:'2025年第三产业增加值349.00亿元，占GDP约34.7%，按不变价增长2.7%。旅游、物流、商贸和生产性服务业，需要继续区分客流热度与本地实际增加值。',q:['已知：第三产业增加值349.00亿元，实际增长2.7%。','待核：旅游、物流、生产性服务等环节的本地增加值。'],to:'./industry-chain.html?sector=tour'}
];
var ROOTS=[
 {id:'r1',name:'企业与产业链',icon:'◇',topic:'企业之间，谁真正向谁采购？',description:'企业共处一个园区，不等于已经形成交易关系。产业协作需要订单、合同、配套采购等证据支撑。',q:['已知：博罗具有制造业集群与工业主体基础。','待核：关键企业之间的订单、合同和本地配套比例。']},
 {id:'r2',name:'人才与技能',icon:'♙',topic:'新产线长出来，人才跟得上吗？',description:'制造业新增产线、服务业发展，都需要匹配的人才。没有分行业岗位、技能和通勤数据，不应直接给出人才缺口数字。',q:['已知：人才是产业升级的重要生产要素。','待核：分行业岗位需求、技能匹配和人才流动。']},
 {id:'r3',name:'资金与项目',icon:'¥',topic:'签约资金，什么时候变成生产能力？',description:'项目从签约到开工、投产，再到形成增加值，存在时间差。投资额不能直接换算成GDP增量。',q:['已知：投资、在建项目与已投产项目是不同状态。','待核：资金到位、竣工、试产、订单和产出的逐项进展。']},
 {id:'r4',name:'市场与订单',icon:'◎',topic:'工厂能生产，谁来购买？',description:'市场和订单可能来自县域之外。判断产业韧性，需要观察客户集中度、订单稳定性和市场变化。',q:['已知：博罗产业面向更广阔的大湾区市场。','待核：主要客户、市场集中度和订单持续性。']},
 {id:'r5',name:'交通与物流',icon:'⇢',topic:'道路通了，企业协作真的更顺了吗？',description:'交通设施创造连接条件，却不自动创造订单与价值。还需要物流时效、通勤流和企业实际使用情况。',q:['已知：区域交通是产业协同的重要条件。','待核：货运流、通勤流及道路改善后的实际效果。']},
 {id:'r6',name:'制度与平台',icon:'▦',topic:'园区变大，项目转化效率怎样？',description:'园区、制度与公共服务构成产业生长环境。规划面积和招商数量不能直接代表产业贡献。',q:['已知：产业平台建设是十五五的重要方向。','待核：用地、厂房、配套、入驻、投产到产出的转化效率。']}
];
var TARGETS=[
 {id:'gdp',icon:'◎',label:'GDP',value:'1600亿元',base:'2025年：1005.45亿元',topic:'五年再增加594.55亿元，需要什么条件？',description:'1600亿元是2030年规划目标，不是模型预测。与2025年现价规模相比，目标差额为594.55亿元，两端规模增幅约59.1%，隐含名义复合变化率约9.74%。这不是实际GDP增速。',q:['现实基准：2025年GDP为1005.45亿元。','规划目标：2030年GDP达到1600亿元。','需要继续核对：新增产出来自哪些产业、项目和需求。']},
 {id:'firms',icon:'▣',label:'规上工业企业',value:'突破2500家',base:'2025年公开报道约1407家',topic:'企业数量增长，能否同步转化为产业价值？',description:'公开报道的2025年规上工业企业约1407家，2030年目标为突破2500家。两者需要进一步核对统计口径和时点；企业数量增加也不意味着增加值同比例增加。',q:['公开报道：2025年规上工业企业约1407家。','规划目标：2030年突破2500家。','需要继续核对：企业规模、投产状态、产出和存续情况。']},
 {id:'output',icon:'▥',label:'规上工业总产值',value:'突破3600亿元',base:'本页缺少可比的2025基准',topic:'总产值达到3600亿元，增加值会是多少？',description:'工业总产值是生产活动的总产出，GDP核算关注增加值。企业间中间投入会在总产值中重复体现，因此两者不能直接相加。当前缺少可比的2025年基准，不显示完成度。',q:['规划目标：2030年规上工业总产值突破3600亿元。','缺少基准：需要同口径的2025年规上工业总产值。','需要继续核对：增加值率、产能利用和新增订单。']},
 {id:'hightech',icon:'✦',label:'高新技术企业存量',value:'突破900家',base:'本页缺少可比的2025基准',topic:'高企数量增加，创新成果能否转化？',description:'高新技术企业存量是创新主体数量，不等于新增产出，也不能单独证明产业竞争力。需要继续观察研发投入、成果转化、产品收入和企业成长。当前不显示完成度。',q:['规划目标：2030年高新技术企业存量突破900家。','缺少基准：需要同口径的2025年高企存量。','需要继续核对：研发投入、成果转化和企业成长。']}
];
var state={year:2025,mode:'rings',selected:null,playing:false,playTimer:null,activeEvidence:'r1'};
var $=function(id){return document.getElementById(id)};
var fmt=function(n){return Number(n).toFixed(2)};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
function current(){return YEARS[state.year-2020]}
function selectedObj(){if(!state.selected)return null;var v=state.selected;return v.type==='sector'?SECTORS.find(function(x){return x.id===v.id}):v.type==='root'?ROOTS.find(function(x){return x.id===v.id}):TARGETS.find(function(x){return x.id===v.id})}
function setPlaying(v){state.playing=v;$('playBtn').textContent=v?'Ⅱ':'▶';$('playBtn').setAttribute('aria-label',v?'暂停年轮播放':'播放2020年至2025年演变');if(!v&&state.playTimer){clearInterval(state.playTimer);state.playTimer=null}}
function setMode(mode){if(!['rings','roots','branches','target'].includes(mode))return;state.mode=mode;if(mode==='target')state.selected={type:'goal',id:'gdp'};else if(mode==='rings')state.selected=null;else if(mode==='branches')state.selected={type:'sector',id:'s2'};else state.selected={type:'root',id:'r1'};render()}
function selectYear(y){state.year=Math.max(2020,Math.min(2025,Number(y)));if(state.year!==2025&&state.selected&&state.selected.type==='sector')state.selected=null;$('yearSlider').value=state.year;render()}
function setSelected(type,id){if(type==='sector'&&state.year!==2025)state.year=2025;if(type==='goal')state.mode='target';else if(type==='sector')state.mode='branches';else if(type==='root')state.mode='roots';state.selected={type:type,id:id};if(type==='root')state.activeEvidence=id;render()}
function randomGen(seed){var a=seed;return function(){a=(a*1664525+1013904223)>>>0;return a/4294967296}}
function landscape(){var out='';var rng=randomGen(19);for(var i=0;i<82;i++){var x=i*15-30;var h=8+rng()*42;out+='<rect x="'+x.toFixed(0)+'" y="'+(558-h).toFixed(0)+'" width="'+(8+rng()*9).toFixed(0)+'" height="'+h.toFixed(0)+'" fill="#174f66" opacity="'+(.12+rng()*.19).toFixed(2)+'"/>'}out+='<path d="M0 559 Q110 545 230 560 T500 560 T780 559 T1000 559 L1000 770 L0 770Z" fill="url(#ground)"/>';return out}
function nodeText(str,x,y,size,color){return '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" font-weight="800" text-anchor="middle" font-family="Inter, PingFang SC, sans-serif">'+esc(str)+'</text>'}
function drawTree(){
 var d=current(),sz=.73+(d.g/1005.45)*.27;
 var leafCount=Math.round(108*(.57+d.g/1005.45*.43));
 var out='<g class="landscape">'+landscape()+'</g>';
 out+='<g opacity=".35"><ellipse cx="500" cy="559" rx="340" ry="38" fill="#198e82" filter="url(#treeGlow)"/></g>';
 out+='<g class="roots-group" opacity="'+(state.mode==='roots'?'1':'.74')+'">';
 var rootpaths=['M500 549 Q430 575 365 594 T170 616','M498 550 Q439 611 303 681','M503 547 Q475 635 457 701','M507 544 Q566 625 645 696','M508 542 Q600 563 692 585 T827 628','M511 535 Q612 510 748 538 T848 546'];
 ROOTS.forEach(function(r,i){out+='<path d="'+rootpaths[i]+'" fill="none" stroke="#8b5e3f" stroke-width="'+(11-i*.85)+'" stroke-linecap="round" opacity=".82"/><path class="root-path" d="'+rootpaths[i]+'" fill="none" stroke="'+(state.mode==='roots'?'#71efce':'#2bbaaf')+'" stroke-width="'+(state.mode==='roots'?2.6:1.65)+'" stroke-linecap="round" opacity="'+(state.mode==='roots'?.96:.5)+'"/>'});
 for(var r=0;r<31;r++){var rng0=randomGen(r*39+19);var p=200+rng0()*600,q=585+rng0()*145;out+='<circle class="glimmer" cx="'+p.toFixed(1)+'" cy="'+q.toFixed(1)+'" r="'+(.7+rng0()*2).toFixed(1)+'" fill="'+(r%4===0?'#ffda88':'#73dcd2')+'" opacity=".55"/>'}
 out+='</g>';
 out+='<g class="tree-crown" transform="translate(500 535) scale('+sz.toFixed(3)+') translate(-500 -535)">';
 out+='<path d="M475 559 Q485 500 478 461 Q474 424 448 380 Q419 349 358 327 M501 542 Q503 470 518 415 Q541 361 625 321 M497 481 Q484 383 490 303 L501 235 M498 432 Q454 364 392 289 M518 442 Q575 369 680 293" fill="none" stroke="url(#bark)" stroke-width="39" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>';
 out+='<path d="M479 552 Q487 483 486 441 Q472 380 445 353 M503 528 Q499 447 513 404 Q543 352 617 312 M492 400 Q490 340 501 245" stroke="url(#branchGlow)" stroke-width="5" stroke-linecap="round" fill="none" opacity=".72" filter="url(#softGlow)"/>';
 var cloud=[[267,289,118,85],[371,226,120,98],[493,165,147,105],[630,215,146,104],[738,294,111,86],[493,305,202,112],[340,355,130,79],[658,361,145,84]];
 cloud.forEach(function(c,i){out+='<ellipse cx="'+c[0]+'" cy="'+c[1]+'" rx="'+c[2]+'" ry="'+c[3]+'" fill="url(#leaves)" opacity="'+(.73+(i%3)*.08)+'"/><ellipse cx="'+(c[0]-9)+'" cy="'+(c[1]-19)+'" rx="'+(c[2]*.8)+'" ry="'+(c[3]*.8)+'" fill="url(#leafBright)" opacity=".36"/>'});
 var rng=randomGen(777);for(var l=0;l<leafCount;l++){var xx=220+rng()*560,yy=120+rng()*300;var ell=((xx-500)*(xx-500)/(312*312))+((yy-267)*(yy-267)/(169*169));if(ell<1.32){var rad=.7+rng()*2.2;out+='<circle class="glimmer" cx="'+xx.toFixed(1)+'" cy="'+yy.toFixed(1)+'" r="'+rad.toFixed(1)+'" fill="'+(l%6===0?'#f1d78b':l%3===0?'#9dffbc':'#62d9b2')+'" opacity="'+(.36+rng()*.44).toFixed(2)+'" style="animation-delay:-'+(l%8)+'s"/>'}}
 out+='</g>';
 out+='<path d="M480 559 Q483 515 484 471 L484 432 Q498 414 512 436 L519 482 Q523 519 520 559 Z" fill="url(#bark)" stroke="#f1c882" stroke-opacity=".33" stroke-width="2"/>';
 out+='<g class="tree-ring" opacity="'+(state.mode==='rings'?'1':'.43')+'"><ellipse cx="502" cy="490" rx="31" ry="24" fill="#3a302b" stroke="#dab477" stroke-width="3"/>';for(var k=0;k<6;k++){out+='<ellipse cx="502" cy="490" rx="'+(4+k*4.6)+'" ry="'+(3+k*3.6)+'" stroke="'+(k===5?'#e9bd7b':'#b7854d')+'" stroke-opacity="'+(.35+k*.06)+'" stroke-width="1.3" fill="none"/>'}out+='</g>';
 if(state.mode==='target'){out+='<g class="target-outline" opacity="1"><ellipse cx="500" cy="269" rx="363" ry="221" stroke="#f4ce8c" stroke-width="2" fill="none" filter="url(#treeGlow)"/><path d="M500 36V75 M500 465V505 M122 270H161 M840 270H880" stroke="#f4ce8c" stroke-width="2" stroke-dasharray="6 5"/></g><g class="target-node" tabindex="0" role="button" aria-label="2030目标1600亿元" data-goal="gdp"><rect x="663" y="71" width="242" height="72" rx="12" fill="#082a38" fill-opacity=".93" stroke="#edc988" stroke-width="1.7"/>'+nodeText('2030 目标轮廓',784,95,13,'#f1cf90')+nodeText('1600 亿元',784,126,22,'#f3e3b9')+'</g>'}
 if(state.year===2025){SECTORS.forEach(function(s){var sel=state.selected&&state.selected.type==='sector'&&state.selected.id===s.id;var dim=state.selected&&state.selected.type==='sector'&&!sel;out+='<g tabindex="0" role="button" class="sector-node '+(sel?'selected ':'')+(dim?'dim':'')+'" aria-label="'+s.name+' '+fmt(s.value)+'亿元" data-sector="'+s.id+'"><circle class="node-ring" cx="'+s.x+'" cy="'+s.y+'" r="51" stroke="'+s.color+'" stroke-width="'+(sel?3:1.5)+'" fill="#082c3a" fill-opacity=".92" filter="url(#softGlow)"/><circle cx="'+s.x+'" cy="'+s.y+'" r="46" stroke="'+s.color+'" stroke-opacity=".42" stroke-width="1" fill="none"/>'+nodeText(s.name,s.x,s.y-15,15,'#eafff8')+nodeText(fmt(s.value)+'亿',s.x,s.y+16,21,s.color)+nodeText(s.share+'%',s.x,s.y+33,11,'#97b6bf')+'</g>'})}else{out+='<g><rect x="367" y="220" width="267" height="55" rx="13" fill="#092b3c" fill-opacity=".93" stroke="#c8b77e" stroke-dasharray="6 5"/>'+nodeText(state.year+'年 · GDP '+fmt(d.g)+'亿元',501,253,18,'#eafae7')+'</g>'}
 ROOTS.forEach(function(r){var sel=state.selected&&state.selected.type==='root'&&state.selected.id===r.id;out+='<g tabindex="0" role="button" class="root-node '+(sel?'selected':'')+'" data-root="'+r.id+'" aria-label="查看'+r.name+'证据"><rect class="node-ring" x="'+(r.x-65)+'" y="'+(r.y-20)+'" width="130" height="40" rx="20" fill="#062e39" fill-opacity=".95" stroke="'+(sel?'#8affd4':state.mode==='roots'?'#4dd3b9':'#367e8b')+'" stroke-width="1.3"/><circle cx="'+(r.x-45)+'" cy="'+r.y+'" r="13" fill="#0d766d" stroke="#76e4b7" stroke-width=".9"/>'+nodeText(r.icon,r.x-45,r.y+5,14,'#dffff4')+'<text x="'+(r.x-26)+'" y="'+(r.y+4.5)+'" fill="#c4edf0" font-size="12" font-weight="700">'+esc(r.name)+'</text></g>'});
 if(state.mode==='rings'){out+='<g><rect x="402" y="570" width="197" height="46" rx="12" fill="#093844" fill-opacity=".94" stroke="#7eaa8266"/>'+nodeText('2020 — '+state.year+' · 经济年轮',501,598,15,'#bcf6dc')+'</g>'}
 $('treeWorld').innerHTML=out;
}
function renderKpis(){var d=current();$('yearStory').textContent=d.n;$('yearOn').textContent=state.year;$('timelineDesc').textContent=state.year+' · '+fmt(d.g)+'亿元';$('historyValue').textContent=fmt(d.g);$('historyYear').textContent=state.year;$('historyGrowth').textContent=state.year===2025?'实际增长 5.5%':'历史现价规模';$('sceneName').textContent=state.mode==='target'?'2030 · 目标轮廓':state.year+' · '+({rings:'经济年轮',roots:'根系联系',branches:'产业枝条'})[state.mode];$('yearSlider').value=state.year}
function renderHistory(){
 var svg=$('historySvg'),w=860,h=245,left=55,right=24,top=24,bottom=38,min=560,max=1080;
 var x=function(i){return left+i*(w-left-right)/(YEARS.length-1)};
 var y=function(v){return top+(max-v)*(h-top-bottom)/(max-min)};
 var out='<defs><linearGradient id="historyFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4be0c0" stop-opacity=".3"/><stop offset="1" stop-color="#4be0c0" stop-opacity="0"/></linearGradient></defs>';
 [600,700,800,900,1000].forEach(function(v){out+='<line class="grid-line" x1="'+left+'" y1="'+y(v)+'" x2="'+(w-right)+'" y2="'+y(v)+'"/><text class="axis-label" x="'+(left-12)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>'});
 var line='',area='';YEARS.forEach(function(d,i){line+=(i?' L':'M')+x(i).toFixed(1)+' '+y(d.g).toFixed(1)});area=line+' L'+x(5)+' '+(h-bottom)+' L'+x(0)+' '+(h-bottom)+' Z';
 out+='<path class="trend-area" d="'+area+'"/><path class="trend-line" d="'+line+'"/>';
 YEARS.forEach(function(d,i){var active=state.year===d.y;out+='<g class="trend-point '+(active?'active':'')+'" tabindex="0" role="button" data-year="'+d.y+'" aria-label="'+d.y+'年GDP '+fmt(d.g)+'亿元"><circle cx="'+x(i)+'" cy="'+y(d.g)+'" r="'+(active?7:5)+'"/><text x="'+x(i)+'" y="'+(y(d.g)-14)+'">'+Math.round(d.g)+'</text><text class="year-label '+(active?'active':'')+'" x="'+x(i)+'" y="'+(h-10)+'">'+d.y+'</text></g>'});
 svg.innerHTML=out;
 var buttons='';YEARS.forEach(function(d){buttons+='<button type="button" data-year="'+d.y+'" class="'+(state.year===d.y?'active':'')+'">'+d.y+'</button>'});$('historyChart').innerHTML=buttons;
}
function renderStructure(){
 var circumference=2*Math.PI*72,offset=0,svg='<svg class="donut-svg" viewBox="0 0 220 220" role="img" aria-label="2025年三次产业增加值占比">';
 svg+='<circle class="donut-track" cx="110" cy="110" r="72"/>';
 SECTORS.forEach(function(s){var length=circumference*s.share/100;var dim=state.selected&&state.selected.type==='sector'&&state.selected.id!==s.id;svg+='<circle class="donut-seg '+(dim?'dim':'')+'" data-sector="'+s.id+'" cx="110" cy="110" r="72" stroke="'+s.color+'" stroke-dasharray="'+length.toFixed(2)+' '+(circumference-length).toFixed(2)+'" stroke-dashoffset="'+(-offset).toFixed(2)+'"/>';offset+=length});
 svg+='<text class="donut-center-big" x="110" y="106">100%</text><text class="donut-center-small" x="110" y="124">三次产业结构</text></svg>';$('structureDonut').innerHTML=svg;
 var cards='';SECTORS.forEach(function(s){var active=state.selected&&state.selected.type==='sector'&&state.selected.id===s.id;cards+='<button type="button" class="sector-card '+(active?'active':'')+'" data-sector="'+s.id+'"><span class="sector-name"><i style="background:'+s.color+'"></i>'+s.name+'</span><strong class="sector-value">'+fmt(s.value)+'亿</strong><span class="sector-share">占比 '+s.share+'%</span><b class="sector-growth">+'+s.growth+'%</b></button>'});$('sectorStack').innerHTML=cards;
 var bars='';SECTORS.forEach(function(s){bars+='<div class="growth-row"><span class="name">'+s.name+'</span><span class="growth-track"><i style="width:'+(s.growth/8.5*100)+'%;background:'+s.color+'"></i></span><strong>+'+s.growth+'%</strong></div>'});$('sectorGrowth').innerHTML=bars;
 var focus=state.selected&&state.selected.type==='sector'?SECTORS.find(function(s){return s.id===state.selected.id}):null;
 $('sectorInsight').innerHTML=focus?'<b>'+focus.name+' · '+fmt(focus.value)+'亿元</b><br>占GDP '+focus.share+'%，实际增长 '+focus.growth+'%。点击树枝可继续查看对应的产业接续现场。':'<b>结构观察</b><br>第二产业占比最大；第一产业增速最高；第三产业体量不小但增速相对较低。体量、增速和增长贡献不是同一个概念。';
}
function renderTargetOptions(){var html='';TARGETS.forEach(function(t){var active=state.selected&&state.selected.type==='goal'&&state.selected.id===t.id;html+='<button type="button" class="goal-option '+(active?'active':'')+'" data-goal="'+t.id+'"><span class="goal-glyph">'+t.icon+'</span><span><strong>'+t.label+'</strong><small>'+t.value+'</small></span></button>'});$('targetOptions').innerHTML=html}
function renderGoals(){
 var html='';
 TARGETS.forEach(function(t){
  var active=state.selected&&state.selected.type==='goal'&&state.selected.id===t.id;
  if(t.id==='gdp'){html+='<button type="button" class="goal-card '+(active?'active':'')+'" data-goal="'+t.id+'"><span class="goal-top">01 / GDP <i>规划目标</i></span><div class="goal-number">1600亿元</div><div class="goal-base">2025年基准：1005.45亿元</div><div class="goal-gap">规模差额 +594.55亿元</div><div class="goal-track"><i style="width:62.84%"></i></div><div class="goal-caveat">当前规模相当于目标规模的62.8%，不是完成率或预测概率</div></button>'}
  else if(t.id==='firms'){html+='<button type="button" class="goal-card '+(active?'active':'')+'" data-goal="'+t.id+'"><span class="goal-top">02 / 企业主体 <i>规划目标</i></span><div class="goal-number">2500家以上</div><div class="goal-base">2025年公开报道约1407家</div><div class="goal-gap">数量对照 · 统计口径待核</div><span class="unknown-base">约数基准，不作完成率判断</span></button>'}
  else if(t.id==='output'){html+='<button type="button" class="goal-card '+(active?'active':'')+'" data-goal="'+t.id+'"><span class="goal-top">03 / 工业产出 <i>规划目标</i></span><div class="goal-number">3600亿元以上</div><div class="goal-base">规上工业总产值目标</div><div class="goal-gap">工业总产值 ≠ GDP</div><span class="unknown-base">2025同口径基准待补</span></button>'}
  else{html+='<button type="button" class="goal-card '+(active?'active':'')+'" data-goal="'+t.id+'"><span class="goal-top">04 / 创新主体 <i>规划目标</i></span><div class="goal-number">900家以上</div><div class="goal-base">高新技术企业存量目标</div><div class="goal-gap">数量不等于创新转化</div><span class="unknown-base">2025同口径基准待补</span></button>'}
 });
 $('goalGrid').innerHTML=html;
}
function renderEvidence(){
 var html='';ROOTS.forEach(function(r){var active=state.activeEvidence===r.id;html+='<button type="button" class="evidence-card '+(active?'active':'')+'" data-root="'+r.id+'"><span class="evidence-top"><i class="evidence-icon">'+r.icon+'</i><small class="evidence-status">研究方向 / 待核关系</small></span><strong>'+r.name+'</strong><p>'+r.topic+'</p></button>'});$('evidenceGrid').innerHTML=html;
 var r=ROOTS.find(function(x){return x.id===state.activeEvidence})||ROOTS[0];
 $('evidenceDetail').innerHTML='<div><h3>'+r.name+'：'+r.topic+'</h3><p>'+r.description+'</p></div><ul>'+r.q.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ul>';
}
function renderInspector(){
 var data=selectedObj(),h='';
 if(!data){var d=current();h='<div class="inspector-type">当前观察 · '+state.year+'年</div><h3 class="inspector-title">'+fmt(d.g)+'亿元</h3><div class="inspector-body">'+esc(d.n)+'<br><br>点选产业、目标或根系，追问规模背后的支撑条件。</div><ul class="inspector-list"><li class="known">年度GDP为历史统计记录。</li><li>树的形态是结构隐喻，不代表生产函数或真实资金流。</li></ul>'}
 else{
  var type=state.selected.type,head=type==='sector'?'产业结构 · 2025':type==='root'?'支撑条件 · 证据边界':'2030目标 · 规划';
  h='<div class="inspector-type">'+head+'</div><h3 class="inspector-title">'+esc(data.topic)+'</h3><div class="inspector-body">'+esc(data.description)+'</div><ul class="inspector-list">'+data.q.map(function(q){return '<li class="'+(/^(已知|现实基准|公开报道)/.test(q)?'known':'')+'">'+esc(q)+'</li>'}).join('')+'</ul>';
  h+=type==='sector'?'<a class="inspector-cta" href="'+data.to+'">带着这条产业枝线进入04 ↗</a>':type==='root'?'<a class="inspector-cta" href="./holo.html">回到02核对关系现场 ↗</a>':'<a class="inspector-cta" href="./industry-chain.html">进入04查看产业现场 ↗</a>';
 }
 $('inspector').innerHTML=h;
}
function renderInsight(){
 var s=selectedObj(),t=$('sceneInsight');
 if(state.mode==='target'&&!s){t.innerHTML='<span class="insight-kicker">2030目标轮廓</span><strong>1600亿元不是已经结出的果实</strong><p>规划目标需要真实产业、项目和市场条件共同支撑。</p>';return}
 if(s){t.innerHTML='<span class="insight-kicker">'+(state.selected.type==='sector'?'正在观察 · 产业枝条':state.selected.type==='root'?'正在观察 · 地下根系':'正在观察 · 十五五目标')+'</span><strong>'+esc(s.topic)+'</strong><p>'+esc(s.description).slice(0,64)+'…</p>';return}
 t.innerHTML='<span class="insight-kicker">现实之树 · '+state.year+'</span><strong>'+fmt(current().g)+'亿元的年度经济规模</strong><p>年轮来自历史GDP统计；树冠与根系是结构地图，不是预测或因果模型。</p>';
}
function renderModes(){Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'),function(b){var on=b.dataset.mode===state.mode;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))})}
function render(){renderKpis();renderHistory();renderStructure();renderTargetOptions();renderGoals();renderEvidence();renderInspector();drawTree();renderInsight();renderModes()}
document.addEventListener('click',function(e){
 var t=e.target.closest('[data-year],[data-sector],[data-root],[data-goal],[data-mode]');
 if(!t)return;
 if(t.dataset.year){setPlaying(false);selectYear(t.dataset.year)}
 else if(t.dataset.sector){setPlaying(false);setSelected('sector',t.dataset.sector)}
 else if(t.dataset.root){setPlaying(false);setSelected('root',t.dataset.root)}
 else if(t.dataset.goal){setPlaying(false);setSelected('goal',t.dataset.goal)}
 else if(t.dataset.mode){setPlaying(false);setMode(t.dataset.mode)}
});
document.addEventListener('keydown',function(e){var t=e.target.closest('[data-sector],[data-root],[data-goal],[data-year]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
$('yearSlider').addEventListener('input',function(e){setPlaying(false);selectYear(e.target.value)});
$('playBtn').addEventListener('click',function(){
 if(state.playing){setPlaying(false);return}
 if(state.year>=2025)state.year=2020;
 state.mode='rings';state.selected=null;setPlaying(true);render();
 state.playTimer=setInterval(function(){if(state.year>=2025){setPlaying(false);return}selectYear(state.year+1)},1050);
});
$('resetView').addEventListener('click',function(){setPlaying(false);state.year=2025;state.mode='rings';state.selected=null;render()});
$('revisions').addEventListener('click',function(){setPlaying(false);state.year=2024;state.mode='rings';state.selected=null;render();$('inspector').innerHTML='<div class="inspector-type">统计修订 · 2024年</div><h3 class="inspector-title">952.24亿 → 970.87亿元</h3><div class="inspector-body">952.24亿元是早期初步核算值，970.87亿元是最终核实值。本页历史年轮统一采用最终核实值，避免把统计修订误读为当期新增产出。</div>'});
var dlg=$('evidenceDialog');
$('evidenceBtn').addEventListener('click',function(){if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','open')});
$('closeEvidence').addEventListener('click',function(){if(dlg.close)dlg.close();else dlg.removeAttribute('open')});
dlg.addEventListener('click',function(e){if(e.target===dlg&&dlg.close)dlg.close()});
document.addEventListener('click',function(e){var link=e.target.closest('.v11-mobile-panel a');if(link){var d=link.closest('details');if(d)d.open=false}});
render();
})();