(function(){
'use strict';
const $=id=>document.getElementById(id);
const sectors=[
 {id:'electronics',name:'计算机、通信及其他电子设备制造业',short:'电子信息',s24:20.2,g24:10.4,s25:23.2,g25:23.0,physical:['电子元件产量 +5.0%','印制电路板产量 -0.1%'],question:'增长很快，但需要继续核对订单集中度、关键零部件本地配套率、产能利用率和出口市场变化。',summary:'权重和增速同时上升，是当前最显眼的增长支柱。份额提高不等于利润率、本地采购或企业抗风险能力同步提高。'},
 {id:'electrical',name:'电气机械和器材制造业',short:'电气机械',s24:14.0,g24:5.6,s25:14.2,g25:13.7,physical:['锂离子电池产量 -4.3%'],question:'需要拆开看电机、电气设备、储能相关产品等细分行业，核对新增产出来自存量企业扩产还是新项目。',summary:'行业权重基本稳定，增速明显加快。下一步要辨别增长来源和细分产品结构。'},
 {id:'rubber',name:'橡胶和塑料制品业',short:'橡胶塑料',s24:10.5,g24:13.2,s25:9.6,g25:-4.2,physical:['塑料制品产量 +7.9%'],question:'需要核对产品价格、订单、原料成本、产能利用率和企业退出情况，不能仅凭一个行业增速判断长期趋势。',summary:'行业份额和增速同时回落，是当前结构中值得追问的反向信号。'},
 {id:'metal',name:'金属制品业',short:'金属制品',s24:8.2,g24:11.5,s25:8.2,g25:11.1,question:'需要识别其服务于哪些本地制造行业，哪些采购是真实发生的本地供货。',summary:'份额稳定、增速保持两位数。关键不只是规模，而是与装备、电子、新能源等产业的真实连接。'},
 {id:'power',name:'电力、热力生产和供应业',short:'电力热力',s24:6.3,g24:10.4,s25:6.2,g25:14.0,question:'需要分清电力供应增长与制造业用能需求、能源价格及新增供给之间的关系。',summary:'行业增速加快，但行业增加值占比变化不大。它是产业运行的支撑条件，不宜直接等同于制造业升级。'},
 {id:'other',name:'其他行业合计',short:'其他行业',s24:40.8,g24:null,s25:38.6,g25:null,question:'目前没有在本页逐项列出其行业增速。需要进一步拆分，避免把“其他”当成一个同质产业。',summary:'其他行业合计仍占38.6%，这块内部结构较大，公开摘要未提供可比的单项增速。'}
];
const peers=[
 {id:'boluo',name:'博罗',rank:1,gdp:952.24,growth:4.0,primary:11.0,secondary:53.9,tertiary:35.1,secondGrowth:6.9,role:'本县基准',note:'2024年统计公报初步核算口径。工业投资增长10.5%，规上工业增加值增长7.9%。'},
 {id:'huidong',name:'惠东',rank:4,gdp:828.51,growth:3.5,primary:11.8,secondary:35.1,tertiary:53.1,secondGrowth:7.6,role:'同市结构对照',note:'同属惠州、同一县域发展赛道，但第三产业占比更高。2024年规上工业增加值增长5.0%，工业投资下降9.6%。'},
 {id:'sihui',name:'四会',rank:2,gdp:818.40,growth:1.8,primary:9.3,secondary:51.8,tertiary:38.9,secondGrowth:-0.2,role:'制造业对照',note:'2024年第二产业占比超过一半，但第二产业增加值同比下降0.2%。说明产业权重高不自动等于当年增长快。'},
 {id:'heshan',name:'鹤山',rank:8,gdp:530.71,growth:5.1,primary:7.0,secondary:54.8,tertiary:38.2,secondGrowth:8.1,role:'制造业对照',note:'2024年第二产业占比54.8%，规上工业增加值增长8.2%，工业投资增长6.5%。'}
];
let selectedSector='electronics',selectedPeer='boluo',selectedYear=2025,sectorThreshold=10;
const pct=n=>(n>0?'+':'')+n.toFixed(1)+'%';
const pp=n=>(n>0?'+':'')+n.toFixed(1)+'个百分点';
function renderSectorList(){
 const host=$('sectorList');
 host.innerHTML=sectors.map(s=>{
  const active=s.id===selectedSector;
  const w24=s.s24/45*100,w25=s.s25/45*100;
  const growth=s.g25==null?'—':pct(s.g25);
  return '<button type="button" class="sector-row '+(active?'active':'')+'" data-sector="'+s.id+'" aria-pressed="'+active+'">'+
   '<span class="sector-name">'+s.short+'<small>'+s.name+'</small></span>'+
   '<span class="sector-bars" aria-label="2024占比 '+s.s24+'%，2025占比 '+s.s25+'%"><i class="old" style="width:'+w24+'%"></i><i class="new" style="width:'+w25+'%"></i></span>'+
   '<span class="sector-share">'+s.s25.toFixed(1)+'%</span><span class="sector-growth '+(s.g25==null?'na':s.g25<0?'down':'')+'">'+growth+'</span></button>';
 }).join('');
}
function renderSectorMap(){
 const host=$('sectorMap');if(!host)return;
 const W=760,H=330,L=66,R=28,T=30,B=48,iw=W-L-R,ih=H-T-B;
 const x=v=>L+(v/26)*iw,y=v=>T+((26-v)/34)*ih;
 const xt=[0,5,10,15,20,25],yt=[-5,0,10,20,25];
 const getShare=z=>selectedYear===2024?z.s24:z.s25;
 const getGrowth=z=>selectedYear===2024?z.g24:z.g25;
 let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+selectedYear+'年行业增加值占比与增速象限图">';
 svg+='<defs><linearGradient id="sectorGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#70e0c4" stop-opacity=".2"/><stop offset="1" stop-color="#70e0c4" stop-opacity="0"/></linearGradient><filter id="sectorBlur"><feGaussianBlur stdDeviation="7"/></filter></defs>';
 svg+='<rect x="'+L+'" y="'+T+'" width="'+iw+'" height="'+ih+'" fill="url(#sectorGlow)" opacity=".18"/>';
 svg+='<rect x="'+x(sectorThreshold)+'" y="'+T+'" width="'+(W-R-x(sectorThreshold))+'" height="'+ih+'" fill="#64d7bc" fill-opacity=".035"/>';
 yt.forEach(t=>{svg+='<line class="quad-line" x1="'+L+'" y1="'+y(t)+'" x2="'+(W-R)+'" y2="'+y(t)+'"/><text class="quad-label" x="'+(L-12)+'" y="'+(y(t)+4)+'" text-anchor="end">'+t+'%</text>'});
 xt.forEach(t=>{svg+='<line class="quad-line" x1="'+x(t)+'" y1="'+T+'" x2="'+x(t)+'" y2="'+(H-B)+'"/><text class="quad-label" x="'+x(t)+'" y="'+(H-22)+'" text-anchor="middle">'+t+'%</text>'});
 svg+='<line class="quad-axis" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'"/><line class="quad-axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/>';
 svg+='<line class="quad-threshold" x1="'+x(sectorThreshold)+'" y1="'+T+'" x2="'+x(sectorThreshold)+'" y2="'+(H-B)+'"/>';
 svg+='<text class="quad-threshold-label" x="'+(x(sectorThreshold)+5)+'" y="'+(T+12)+'">观察线 '+sectorThreshold+'%</text>';
 svg+='<text class="quad-label axis-title" x="'+(L+iw/2)+'" y="'+(H-5)+'" text-anchor="middle">行业占规上工业增加值比重 →</text>';
 svg+='<text class="quad-label axis-title" transform="translate(14 '+(T+ih/2)+') rotate(-90)" text-anchor="middle">行业增加值同比增速 →</text>';
 const positions={electronics:[18,-18,'start'],electrical:[17,-16,'start'],rubber:[18,24,'start'],metal:[-13,25,'end'],power:[-12,-17,'end']};
 const colors={electronics:'#70e0c4',electrical:'#73b6e9',rubber:'#ff8b79',metal:'#a4d58e',power:'#e0bd79'};
 sectors.filter(z=>getGrowth(z)!=null).forEach((z,i)=>{
  const share=getShare(z),growth=getGrowth(z),cx=x(share),cy=y(growth),rad=8+Math.sqrt(share)*2,active=z.id===selectedSector,above=share>=sectorThreshold;
  const [dx,dy,anchor]=positions[z.id];
  svg+='<g class="sector-point '+(active?'active ':'')+(above?'above-threshold':'below-threshold')+'" data-sector="'+z.id+'" role="button" tabindex="0" aria-label="选择'+z.short+'：'+selectedYear+'年占比'+share+'%，增速'+pct(growth)+'">';
  svg+='<circle class="quad-halo" cx="'+cx+'" cy="'+cy+'" r="'+(rad+9)+'" fill="'+colors[z.id]+'" opacity="'+(active?'.2':'.09')+'"/>';
  svg+='<circle class="quad-dot" cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="'+colors[z.id]+'"/>';
  svg+='<text class="quad-name" x="'+(cx+dx)+'" y="'+(cy+dy)+'" text-anchor="'+anchor+'">'+z.short+'</text></g>';
 });
 svg+='</svg><div class="viz-tooltip" id="sectorTooltip" role="status" aria-live="polite"></div>';
 host.innerHTML=svg;
 const count=sectors.filter(z=>getGrowth(z)!=null&&getShare(z)>=sectorThreshold).length;
 $('sectorThresholdValue').textContent=sectorThreshold+'%';
 $('sectorThresholdResult').textContent=count;
 $('sectorMapState').textContent=selectedYear+'年结构切片 · '+count+'个行业高于观察线';
 document.querySelectorAll('[data-year]').forEach(b=>{const active=Number(b.dataset.year)===selectedYear;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
function renderSectorDetail(){
 const s=sectors.find(x=>x.id===selectedSector)||sectors[0];
 const share=selectedYear===2024?s.s24:s.s25,growth=selectedYear===2024?s.g24:s.g25,delta=s.s25-s.s24,rate=growth==null?'未披露':pct(growth),change=s.g24==null?'未披露':pp(s.g25-s.g24);
 $('sectorDetail').innerHTML='<span class="detail-kicker">SELECTED INDUSTRY / 选中行业</span>'+
 '<h3>'+s.short+'</h3><p>'+s.summary+'</p>'+
 '<div class="detail-stat-grid"><div class="detail-stat"><strong>'+share.toFixed(1)+'%</strong><span>'+selectedYear+'年占规上工业增加值比重</span></div>' +
 '<div class="detail-stat"><strong>'+rate+'</strong><span>'+selectedYear+'年增加值同比</span></div>'+
 '<div class="detail-stat"><strong>'+pp(delta)+'</strong><span>占比较2024年变化</span></div>'+
 '<div class="detail-stat"><strong>'+(s.g24==null?'—':change)+'</strong><span>增速较2024年变化</span></div></div>'+
 (s.physical?'<div class="detail-question physical-check"><b>产品产量交叉核验：</b>'+s.physical.join(' · ')+'。产品产量与行业增加值不是同一指标，不能直接相减，但值得拆开看产品结构。</div>':'')+
 '<div class="detail-question"><b>值得继续核实：</b>'+s.question+'</div>'+
 '<div class="mini-chips"><span>2024占比 '+s.s24.toFixed(1)+'%</span><span>2024增速 '+(s.g24==null?'未披露':pct(s.g24))+'</span><span>2025占比 '+s.s25.toFixed(1)+'%</span></div>';
 document.querySelectorAll('[data-sector]').forEach(b=>{b.classList.toggle('active',b.dataset.sector===selectedSector);b.setAttribute('aria-pressed',String(b.dataset.sector===selectedSector))});
}
function renderPeerBars(){
 $('peerBars').innerHTML=peers.map(p=>'<div class="peer-row"><div class="peer-name">'+p.name+'<small>GDP '+p.gdp.toFixed(1)+'亿</small></div><button type="button" class="peer-stack '+(p.id===selectedPeer?'active':'')+'" data-peer="'+p.id+'" aria-label="'+p.name+'，第一产业 '+p.primary+'%，第二产业 '+p.secondary+'%，第三产业 '+p.tertiary+'%">'+
 '<span class="p1" style="width:'+p.primary+'%">'+(p.primary>=8?p.primary.toFixed(1):'')+'</span>'+
 '<span class="p2" style="width:'+p.secondary+'%">'+p.secondary.toFixed(1)+'</span>'+
 '<span class="p3" style="width:'+p.tertiary+'%">'+p.tertiary.toFixed(1)+'</span></button></div>').join('');
 document.querySelectorAll('[data-peer]').forEach(b=>b.classList.toggle('active',b.dataset.peer===selectedPeer));
}
function renderScatter(){
 const W=600,H=310,L=50,R=22,T=22,B=43,iw=W-L-R,ih=H-T-B;
 const x=v=>L+(v-30)/30*iw,y=v=>T+(6.5-v)/6.5*ih;
 const xTicks=[30,40,50,60],yTicks=[0,2,4,6];
 let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="2024年第二产业占比与GDP增速对照散点图">';
 yTicks.forEach(t=>{svg+='<line class="scatter-grid" x1="'+L+'" y1="'+y(t)+'" x2="'+(W-R)+'" y2="'+y(t)+'"/><text class="scatter-tick" x="'+(L-9)+'" y="'+(y(t)+3)+'" text-anchor="end">'+t+'%</text>'});
 xTicks.forEach(t=>{svg+='<line class="scatter-grid" x1="'+x(t)+'" y1="'+T+'" x2="'+x(t)+'" y2="'+(H-B)+'"/><text class="scatter-tick" x="'+x(t)+'" y="'+(H-20)+'" text-anchor="middle">'+t+'%</text>'});
 svg+='<line class="scatter-axis" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'"/><line class="scatter-axis" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/>';
 svg+='<text class="scatter-tick" x="'+(L+iw/2)+'" y="'+(H-3)+'" text-anchor="middle">第二产业增加值占GDP比重 →</text>';
 svg+='<text class="scatter-tick" transform="translate(12 '+(T+ih/2)+') rotate(-90)" text-anchor="middle">GDP实际增速 →</text>';
 peers.forEach(p=>{
  const cx=x(p.secondary),cy=y(p.growth),rad=8+Math.sqrt(p.gdp/952.24)*8,active=p.id===selectedPeer;
  const dx=p.id==='heshan'?10:p.id==='sihui'?10:p.id==='huidong'?10:-10,anchor=p.id==='boluo'?'end':'start';
  const dy=p.id==='heshan'?-13:p.id==='sihui'?19:p.id==='huidong'?18:-13;
  svg+='<g data-peer="'+p.id+'" role="button" tabindex="0" aria-label="选择'+p.name+'"><circle class="scatter-dot '+(active?'active':'')+'" cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="'+(p.id==='boluo'?'#1d8c80':p.id==='huidong'?'#c39a5b':p.id==='sihui'?'#668cb2':'#5c9b78')+'" fill-opacity=".86" stroke="'+(active?'#172f3f':'#fff')+'" stroke-width="'+(active?3:2)+'"/><text class="scatter-label" x="'+(cx+dx)+'" y="'+(cy+dy)+'" text-anchor="'+anchor+'">'+p.name+'</text></g>';
 });
 svg+='</svg>';
 $('peerScatter').innerHTML=svg;
}
function renderPeerDetail(){
 const p=peers.find(x=>x.id===selectedPeer)||peers[0];
 $('peerSelected').innerHTML='<strong>'+p.name+' · '+p.role+' · 2026综合发展力第'+p.rank+'位</strong><br>2024 GDP '+p.gdp.toFixed(2)+'亿元，实际增长 '+pct(p.growth)+'；第二产业占比 '+p.secondary.toFixed(1)+'%，第二产业增加值增长 '+pct(p.secondGrowth)+'。<br>'+p.note;
 renderPeerBars();renderScatter();
}
function renderInvestment(){
 const items=[
  {label:'2024 工业增加值',v:7.9,kind:'pos',max:14},
  {label:'2025 工业增加值',v:8.7,kind:'pos',max:14},
  {label:'2024 工业投资',v:10.5,kind:'pos',max:14},
  {label:'2025 工业投资',v:-12.7,kind:'neg',max:14}
 ];
 $('investmentBars').innerHTML=items.map(x=>'<div class="dual-row"><span>'+x.label+'</span><span class="dual-track"><i class="dual-fill '+(x.v<0?'neg':'')+'" style="width:'+Math.abs(x.v)/x.max*50+'%"></i></span><b class="dual-value">'+pct(x.v)+'</b></div>').join('');
}
function renderScale(){
 const pieces=[{name:'小微型',share:56.8,growth:9.7,color:'#238d81'},{name:'中型',share:24.0,growth:4.8,color:'#6493b6'},{name:'大型',share:19.2,growth:10.8,color:'#c59a55'}];
 $('scaleStack').innerHTML=pieces.map(p=>'<span style="width:'+p.share+'%;background:'+p.color+'" title="'+p.name+' '+p.share+'%"></span>').join('');
 $('scaleLegend').innerHTML=pieces.map(p=>'<div><strong><i class="legend-dot" style="background:'+p.color+'"></i>'+p.share.toFixed(1)+'%</strong><span>'+p.name+' · 增加值 '+pct(p.growth)+'</span></div>').join('');
}
function renderSlider(){
 const slider=$('netAdds'),v=Number(slider.value),total=1407+v*5,gap=2500-total;
 $('netAddsValue').textContent=v+'家/年';
 $('netAddsTotal').textContent=total.toLocaleString('zh-CN')+'家';
 $('netAddsGap').textContent=gap>=0?'距2500家底线还差 '+gap+' 家':'超过2500家底线 '+Math.abs(gap)+' 家';
 $('netAddsGap').style.color=gap>0?'#a25c42':'#20786f';
}
function render(){
 renderSectorList();renderSectorMap();renderSectorDetail();renderPeerDetail();renderInvestment();renderScale();renderSlider();
}
document.addEventListener('click',e=>{
 const y=e.target.closest('[data-year]');if(y){selectedYear=Number(y.dataset.year);renderSectorMap();renderSectorDetail();return}
 const s=e.target.closest('[data-sector]');if(s){selectedSector=s.dataset.sector;renderSectorList();renderSectorMap();renderSectorDetail();return}
 const p=e.target.closest('[data-peer]');if(p){selectedPeer=p.dataset.peer;renderPeerDetail();return}
});
document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'&&e.key!==' ')return;
 const sector=e.target.closest('#sectorMap [data-sector]');
 if(sector){e.preventDefault();selectedSector=sector.dataset.sector;renderSectorList();renderSectorMap();renderSectorDetail();return}
 const peer=e.target.closest('#peerScatter [data-peer]');
 if(peer){e.preventDefault();selectedPeer=peer.dataset.peer;renderPeerDetail()}
});
$('sectorThreshold').addEventListener('input',e=>{sectorThreshold=Number(e.target.value);renderSectorMap()});
$('netAdds').addEventListener('input',renderSlider);
const map=$('sectorMap');
map.addEventListener('pointermove',e=>{
 const point=e.target.closest('[data-sector]');
 const tip=$('sectorTooltip');
 if(!point||!tip){if(tip)tip.classList.remove('show');return}
 const z=sectors.find(x=>x.id===point.dataset.sector);if(!z)return;
 const share=selectedYear===2024?z.s24:z.s25,growth=selectedYear===2024?z.g24:z.g25;
 tip.innerHTML='<b>'+z.short+'</b><span>'+selectedYear+'年占比 <strong>'+share.toFixed(1)+'%</strong></span><span>增加值增速 <strong>'+pct(growth)+'</strong></span><small>点击查看结构详情</small>';
 const rect=map.getBoundingClientRect(),left=Math.min(Math.max(8,e.clientX-rect.left+14),rect.width-180),top=Math.max(8,e.clientY-rect.top-18);
 tip.style.left=left+'px';tip.style.top=top+'px';tip.classList.add('show');
});
map.addEventListener('pointerleave',()=>{$('sectorTooltip').classList.remove('show')});
document.addEventListener('pointerover',e=>{
 const el=e.target.closest('[data-sector]');if(!el)return;
 document.querySelectorAll('[data-sector="'+el.dataset.sector+'"]').forEach(n=>n.classList.add('linked-hover'));
});
document.addEventListener('pointerout',e=>{
 const el=e.target.closest('[data-sector]');if(!el)return;
 if(e.relatedTarget&&e.relatedTarget.closest('[data-sector="'+el.dataset.sector+'"]'))return;
 document.querySelectorAll('[data-sector="'+el.dataset.sector+'"]').forEach(n=>n.classList.remove('linked-hover'));
});
const progress=$('readingProgress');
let ticking=false;
const updateProgress=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;progress.style.width=(max>0?window.scrollY/max*100:0)+'%';ticking=false};
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateProgress);ticking=true}},{passive:true});
updateProgress();
if('IntersectionObserver'in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08});
 document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
 const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.insight-rail a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}}),{rootMargin:'-20% 0px -65% 0px'});
 document.querySelectorAll('.section[id]').forEach(el=>sectionObserver.observe(el));
}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'))}
render();
})();