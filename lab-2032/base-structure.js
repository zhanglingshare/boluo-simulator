/* Boluo 2032 | Page 03: Economic Base
 * Public statistical facts are kept separate by year, period, price basis and statistical object.
 * 2032 1:5:4 is a user-provided research reference, not an approved official target.
 */
(function(root){
"use strict";
const YEARS=[
 {year:2020,gdp:619.04,note:"经济总量约619亿元。"},
 {year:2021,gdp:741.46,note:"经济总量继续扩大。"},
 {year:2022,gdp:801.39,note:"经济总量跨过800亿元。"},
 {year:2023,gdp:838.89,note:"年度GDP约839亿元。"},
 {year:2024,gdp:970.87,note:"最终核实数为970.87亿元；早期952.24亿元是初步数。"},
 {year:2025,gdp:1005.45,note:"GDP首次突破千亿元，按不变价格计算实际增长5.5%。"}
];
const SECTORS=[
 {id:"primary",name:"第一产业",short:"一产",plain:"农业",value:107.44,share:10.7,growth:7.8,target:10,color:"#49ad91",
  headline:"农业不只看产量，还要看价值留下多少。",
  note:"2025年第一产业增加值107.44亿元，按不变价格增长7.8%。农产品产量、加工增值、渠道回款和农户收益，是不同环节，不能用单一产量代替产业价值。",
  metrics:[["农作物总播种面积","122.84","万亩"],["蔬菜产量","118.07","万吨"]],
  question:"还需要核实农产品加工率、产地价格、冷链损耗、渠道回款和农户最终收益。"
 },
 {id:"secondary",name:"第二产业",short:"二产",plain:"工业与建筑业",value:549.01,share:54.6,growth:6.9,target:50,color:"#4d96cb",
  headline:"第二产业是最大底盘，但它不等于工业。",
  note:"2025年第二产业增加值549.01亿元，按不变价格增长6.9%。其中包含工业和建筑业；规上工业增加值是工业的一项统计口径，不能直接替代整个第二产业。",
  metrics:[["规上工业企业","1,407","家"],["规上工业增加值增速","+8.7","%"]],
  question:"还需要核实工业与建筑业各自增加值、企业产能利用、项目投产转化、本地配套采购和劳动生产率。"
 },
 {id:"tertiary",name:"第三产业",short:"三产",plain:"服务业",value:349.00,share:34.7,growth:2.7,target:40,color:"#d89b59",
  headline:"服务业占比离结构参考线最远，内部冷热也不相同。",
  note:"2025年第三产业增加值349.00亿元，按不变价格增长2.7%。零售、文旅、物流、金融和生产性服务的统计对象不同，不能把它们简单相加成服务业增加值。",
  metrics:[["社会消费品零售总额","296.99","亿元"],["旅游综合收入","51.88","亿元"]],
  question:"还需要核实生产性服务企业数量、服务收入、制造业采购来源、服务业就业和各细分行业增加值。"
 }
];
const PULSE=[
 {id:"primary",name:"第一产业",value:79.48,growth:6.2,color:"#62c7a2"},
 {id:"secondary",name:"第二产业",value:418.45,growth:5.4,color:"#68b5e4"},
 {id:"tertiary",name:"第三产业",value:223.17,growth:1.2,color:"#e6b06e"}
];
const SERVICES={
 producer:{
  title:"生产性服务：有些环节跑得比服务业整体快。",
  intro:"生产性服务包括物流、仓储、商务、技术和信息等为企业生产经营提供支持的活动。现有数据出现了分化信号，但还不能证明这些服务已充分嵌入本地制造业。",
  metrics:[
   ["交通运输、仓储和邮政业增加值","+7.7%","2026年前三季度 · 增加值"],
   ["租赁和商务服务业增加值","+5.5%","2026年前三季度 · 增加值"],
   ["规上服务业营业收入","+6.3%","2026年1—8月 · 营业收入"],
   ["规上交通运输服务业营业收入","+32.5%","2026年1—8月 · 营业收入"]
  ],
  caution:"增加值增速与营业收入增速不是同一指标。服务业企业营业收入增长，也不自动等于本地制造企业采购了更多服务。"
 },
 living:{
  title:"生活性服务：消费场景有增长，也有分化。",
  intro:"批发、零售、住宿、餐饮服务连接居民消费与本地商贸。商品销售额和营业额是经营指标，不等于行业增加值。",
  metrics:[
   ["批发业商品销售额","+13.9%","2025全年 · 商品销售额"],
   ["零售业商品销售额","+10.5%","2025全年 · 商品销售额"],
   ["住宿业营业额","−2.3%","2025全年 · 营业额"],
   ["餐饮业营业额","+2.3%","2025全年 · 营业额"]
  ],
  caution:"四项指标都不是服务业增加值。要继续区分本地消费、外来消费、平台抽佣、商户利润和就业收入。"
 },
 tourism:{
  title:"文旅消费：客流增长，不等于价值全部留在本地。",
  intro:"旅游人数和旅游综合收入可以观察市场热度，但还要看游客停留、消费结构、供应商采购和本地经营主体获得了多少。",
  metrics:[
   ["全年接待游客","1,028.09","万人次 · 2025全年"],
   ["游客数量同比","+11.7%","2025全年 · 人次"],
   ["旅游综合收入","51.88","亿元 · 2025全年"],
   ["旅游综合收入同比","+19.1%","2025全年 · 综合收入"]
  ],
  caution:"旅游综合收入不等于GDP增加值，也不等于本地企业净收益。要看留宿、消费品类、复游、渠道成本与本地采购。"
 }
};
const GAPS={
 primary:{
  title:"农业：从“产了多少”继续追到“价值留下多少”。",
  desc:"公开统计已经能看到种养规模和产量，但产品分级、加工、渠道、价格与农户收益之间仍缺少可连续核对的连接。",
  items:["分品类产量与产地价格","加工转化率与加工产值","冷链仓储与损耗","订单、渠道与回款周期","农户收入与利润分配","农业服务主体和就业"]
 },
 secondary:{
  title:"工业：从“企业和产值”继续追到“产能与增加值”。",
  desc:"工业主体数量和行业增速能看见规模，但还需要企业级产能、订单、采购、项目投产和劳动生产率，才能判断增长是否可持续。",
  items:["企业产能利用率","项目签约、开工、投产状态","企业增加值与劳动生产率","本地供应商采购比例","订单、客户集中度与出口","能耗、用工与技能缺口"]
 },
 tertiary:{
  title:"服务业：从“行业增长”继续追到“谁在购买、价值留在哪”。",
  desc:"服务业总量增速掩盖内部差异。关键是识别哪些服务真正服务本地企业，哪些依赖外部需求，哪些收入最终留在博罗。",
  items:["生产性服务企业名录","服务业分行业增加值","企业服务收入和客户结构","制造业采购服务金额与来源","服务业岗位、工资和技能","本地采购、利润与税收留存"]
 }
};
let selectedSector="tertiary",selectedYear=2025,selectedService="producer",selectedGap="primary",bound=false;
const section=()=>document.querySelector('[data-page="macro"]');
const q=s=>section()?.querySelector(s)||null;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const signed=n=>(n>0?"+":"")+fmt(n)+"%";
function setActive(selector,attr,value){
 section()?.querySelectorAll(selector).forEach(b=>{
  const active=b.getAttribute(attr)===String(value);
  b.classList.toggle("active",active);b.setAttribute("aria-pressed",active?"true":"false");
 });
}
function renderMix(){
 const values=[10.7,54.6,34.7],refs=[10,50,40];
 const rows=[["2025实际",values],["2032参考",refs]];
 q("#base-mix-chart").innerHTML=rows.map(([label,v])=>
  '<div class="base-mix-row"><span class="base-mix-label">'+label+'</span><div class="base-mix-track">'+SECTORS.map((s,i)=>
   '<i class="base-mix-segment '+s.id+'" style="width:'+v[i]+'%;background:'+s.color+'">'+(v[i]>=10?fmt(v[i])+'%':"")+'</i>').join("")+'</div><strong class="base-mix-total">100%</strong></div>'
 ).join("");
 q("#base-mix-legend").innerHTML=SECTORS.map(s=>'<span><i style="background:'+s.color+'"></i>'+s.name+'</span>').join("");
 setActive("#base-sector-select button","data-base-sector",selectedSector);
 const d=SECTORS.find(x=>x.id===selectedSector)||SECTORS[0],gap=d.share-d.target;
 q("#base-sector-detail").innerHTML='<div><h3>'+d.name+' · '+d.plain+'</h3><p>'+d.headline+'<br>'+d.note+'</p><p style="margin-top:8px;color:#e8c58f">继续核实：'+d.question+'</p></div>'+
  '<div class="base-sector-metrics"><div><small>2025增加值 · 现价</small><strong>'+fmt(d.value,2)+'亿</strong></div>'+
  '<div><small>占GDP比重</small><strong>'+fmt(d.share,1)+'%</strong></div>'+
  '<div><small>实际增速 · 不变价</small><strong>'+signed(d.growth)+'</strong></div>'+
  '<div><small>与2032结构参考差距</small><strong class="'+(gap<0?"down":"")+'">'+(gap>0?"+":"")+fmt(gap,1)+'个百分点</strong></div></div>';
}
function renderHistory(){
 const w=850,h=245,p={l:40,r:22,t:20,b:36},max=1100,base=h-p.b;
 const x=i=>p.l+i*(w-p.l-p.r)/(YEARS.length-1);
 const y=v=>base-v/max*(h-p.t-p.b);
 let svg='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="2020至2025年博罗地区生产总值现价规模">';
 [0,500,1000].forEach(v=>{svg+='<line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e7eff2" stroke-dasharray="3 5"/><text x="'+(p.l-8)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="#8ba0a9">'+v+'</text>';});
 const pts=YEARS.map((d,i)=>x(i)+","+y(d.gdp)).join(" ");
 svg+='<polyline points="'+pts+'" fill="none" stroke="#4a9eab" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
 YEARS.forEach((d,i)=>{const active=d.year===selectedYear;
  svg+='<g data-history-year="'+d.year+'" tabindex="0" role="button" aria-label="'+d.year+'年GDP '+fmt(d.gdp,2)+'亿元"><circle cx="'+x(i)+'" cy="'+y(d.gdp)+'" r="'+(active?17:12)+'" fill="'+(active?"#4ab398":"#6babc0")+'" opacity="'+(active?".18":".10")+'"/><circle cx="'+x(i)+'" cy="'+y(d.gdp)+'" r="'+(active?7:5)+'" fill="'+(active?"#268b7d":"#579ab5")+'" stroke="#fff" stroke-width="2"/><text x="'+x(i)+'" y="'+(y(d.gdp)-17)+'" text-anchor="middle" font-size="'+(active?14:11)+'" font-weight="'+(active?900:700)+'" fill="'+(active?"#1b6d78":"#6b8998")+'">'+Math.round(d.gdp)+'</text><text x="'+x(i)+'" y="'+(base+21)+'" text-anchor="middle" font-size="11" fill="#7f98a3">'+d.year+'</text></g>';
 });
 svg+='</svg>';q("#base-history-chart").innerHTML=svg;
 q("#base-history-years").innerHTML=YEARS.map(d=>'<button type="button" data-history-year="'+d.year+'" class="'+(selectedYear===d.year?"active":"")+'" aria-pressed="'+(selectedYear===d.year)+'">'+d.year+'</button>').join("");
 const d=YEARS.find(x=>x.year===selectedYear)||YEARS[5];
 q("#base-history-detail").innerHTML='<span>'+d.year+' · 年度GDP</span><strong>'+fmt(d.gdp,2)+'亿</strong><small>'+d.note+'</small>';
}
function renderPulse(){
 q("#base-pulse-chart").innerHTML=PULSE.map(d=>
  '<div class="base-growth-row"><span>'+d.name+'</span><div class="base-growth-track"><i class="base-growth-fill" style="display:block;width:'+d.growth/7*100+'%;background:'+d.color+'"></i></div><strong class="base-growth-value">'+signed(d.growth)+'</strong></div>'
 ).join("");
 const total=721.10;
 const shares=PULSE.map(d=>d.value/total*100);
 q("#base-pulse-shares").innerHTML=PULSE.map((d,i)=>
  '<span>'+d.name+'：<b>'+fmt(shares[i],1)+'%</b> · '+fmt(d.value,2)+'亿元</span>'
 ).join("");
}
function renderService(){
 setActive("#base-service-tabs button","data-service-view",selectedService);
 const d=SERVICES[selectedService];
 q("#base-service-content").innerHTML='<div class="base-service-main"><h3>'+d.title+'</h3><p>'+d.intro+'</p><p style="margin-top:10px;color:#b17b43;font-weight:700">'+d.caution+'</p></div>'+
 '<div class="base-service-metrics">'+d.metrics.map(([label,value,period])=>
  '<div class="base-service-metric"><small>'+label+'</small><strong>'+value+'</strong><em>'+period+'</em></div>').join("")+'</div>';
}
function renderGap(){
 setActive("#base-gap-tabs button","data-gap-sector",selectedGap);
 const d=GAPS[selectedGap];
 q("#base-gap-content").innerHTML='<div class="gap-lead"><h3>'+d.title+'</h3><p>'+d.desc+'</p></div><div class="base-gap-list">'+d.items.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>';
}
function renderSources(){
 const items=[
  ["2025年博罗县国民经济和社会发展统计公报（网络转录）","https://maptable.com/tjgb/2025/%E6%83%A0%E5%B7%9E%E5%B8%82/%E5%8D%9A%E7%BD%97%E5%8E%BF/report/hui-zhou-shi-2025-nian-bo-luo-guo-min-jing-ji-he-she-hui-fa-zhan-tong-ji-gong-bao-2"],
  ["博罗县2026年前三季度经济运行情况（南方+报道）","https://www.fz0752.com/fontHtml/html/issue/000143025_1.html"],
  ["博罗县2025年GDP与产业结构报道","https://epaper.nfnews.com/nfdaily/html/202602/03/content_10162180.html"],
  ["博罗县“十五五”规划纲要印发通知（官方）","https://www.boluo.gov.cn/zwgk/qt/gzjh/content/post_5842396.html"]
 ];
 q("#base-source-list").innerHTML='<ul>'+items.map(([label,url])=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a></li>').join("")+'</ul>'+
 '<p style="font-size:10px;line-height:1.85;color:#718995">统计边界：GDP及产业增加值金额按现价计算，增长速度按不变价格计算；2025 GDP、金融业增加值、交通运输仓储邮政业增加值及规上工业增加值增速为快报数。2026年前三季度为累计数据，不与2025全年直接比较。2032年1:5:4仅为结构研究参考，不是已批准的正式规划指标，也没有据此虚构2032年GDP总量或产业金额。服务业分行业的增加值、营业收入、销售额、营业额和旅游综合收入分别保留原统计对象，不混算。</p>';
}
function render(){
 if(!section())return;
 renderMix();renderHistory();renderPulse();renderService();renderGap();renderSources();
}
function handleClick(ev){
 const sector=ev.target.closest("[data-base-sector]");
 if(sector){selectedSector=sector.dataset.baseSector;renderMix();return;}
 const year=ev.target.closest("[data-history-year]");
 if(year){selectedYear=Number(year.dataset.historyYear);renderHistory();return;}
 const service=ev.target.closest("[data-service-view]");
 if(service){selectedService=service.dataset.serviceView;renderService();return;}
 const gap=ev.target.closest("[data-gap-sector]");
 if(gap){selectedGap=gap.dataset.gapSector;renderGap();}
}
function bind(){
 if(bound||!section())return;
 section().addEventListener("click",handleClick);
 section().addEventListener("keydown",ev=>{
  if(ev.key!=="Enter"&&ev.key!==" ")return;
  const t=ev.target.closest("[data-history-year]");
  if(!t)return;ev.preventDefault();selectedYear=Number(t.dataset.historyYear);renderHistory();
 });
 bound=true;
}
root.BoluoBasePage={render,bind};
})(window);
