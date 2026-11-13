/* Boluo 2032 | Page 02 Industrial Growth
 * All fixed values: publicly reported 2024/2025 aggregate statistics.
 * No computed industry amounts, fake enterprise network, or causal coefficients.
 * Synthetic corporate samples live in the separate "industries" workspace.
 */
(function(root){
"use strict";
const YEARS={
  2024:{production:7.9,investment:10.5,headline:"工业与投资都在增长。",note:"2024年规上工业增加值增长7.9%，工业投资增长10.5%。两项指标同向，不代表工业投资直接决定当年增加值。"},
  2025:{production:8.7,investment:-12.7,headline:"工业仍在增长，为什么投资下降？",note:"2025年规上工业增加值增长8.7%，工业投资下降12.7%。这是需要解释的结构信号，而非已证明的投资与产出因果关系。"}
};
const INDUSTRIES=[
 {id:"electronics",label:"计算机、通信和其他电子设备制造业",short:"电子信息",share:23.2,growth:23.0,question:"增长是否依赖少数大企业、订单和外需？需要核实客户结构、订单持续性及本地配套。"},
 {id:"electrical",label:"电气机械和器材制造业",short:"电气机械",share:14.2,growth:13.7,question:"新增订单和存量产能分别贡献多少？需核对企业产能、项目投产与细分产品结构。"},
 {id:"rubber",label:"橡胶和塑料制品业",short:"橡胶塑料",share:9.6,growth:-4.2,question:"下滑来自需求、价格、产能还是产品转换？不能只凭同比增速判定产业衰退。"},
 {id:"metal",label:"金属制品业",short:"金属制品",share:8.2,growth:11.1,question:"增长是否有可持续订单和本地配套支撑？需观察工业客户结构及资本开支。"},
 {id:"power",label:"电力、热力生产和供应业",short:"电力热力",share:6.2,growth:14.0,question:"能源供应增长与制造业需求的变化是否一致？两个行业口径不可直接替代。"}
];
const SIZES=[
 {id:"small",name:"小微型",share:56.8,growth:9.7,color:"#46ad9e"},
 {id:"medium",name:"中型",share:24.0,growth:4.8,color:"#5797d1"},
 {id:"large",name:"大型",share:19.2,growth:10.8,color:"#e0a768"}
];
const REGIONS=[
 {id:"boluo",name:"博罗",share:53.9,growth:7.9,comment:"博罗2024年二产占GDP53.9%，规上工业增加值增长7.9%。与其他县区比较只是发现结构差异，不是绩效排名。"},
 {id:"heshan",name:"鹤山",share:54.8,growth:8.2,comment:"鹤山2024年二产占GDP54.8%，规上工业增加值增长8.2%。与博罗结构和增速接近，但行业构成可能不同。"},
 {id:"huidong",name:"惠东",share:35.1,growth:5.0,comment:"惠东2024年二产比重约35.1%，规上工业增加值增长约5.0%。工业比重明显低于博罗，需进一步理解产业结构与统计范围。"},
 {id:"sihui",name:"四会",share:51.8,growth:-1.2,comment:"四会2024年二产占GDP约51.8%，规上工业增加值下降1.2%。统计边界与行业构成可能影响比较，尤其不能用一个年度下结论。"}
];
const CAPACITY=[
 {value:"686",label:"高新技术企业",detail:"2025年末，含迁入企业"},
 {value:"652",label:"规上工业数字化转型企业",detail:"已实行数字化转型的规上企业"},
 {value:"1,584",label:"有效发明专利",detail:"2025年末有效数量"},
 {value:"54",label:"省级工程中心",detail:"2025年末"},
 {value:"137",label:"市级工程中心",detail:"2025年末"}
];
const SOURCES=[
 ["2025年博罗国民经济和社会发展统计公报（网络转录）","https://maptable.com/tjgb/2025/%E6%83%A0%E5%B7%9E%E5%B8%82/%E5%8D%9A%E7%BD%97%E5%8E%BF/report/hui-zhou-shi-2025-nian-bo-luo-guo-min-jing-ji-he-she-hui-fa-zhan-tong-ji-gong-bao-2"],
 ["博罗县2025年经济计划：含2024年完成数据","https://www.boluo.gov.cn/blgk/qjmb/content/post_5504574.html"],
 ["鹤山市2024年计划执行情况与2025年计划草案","https://www.heshan.gov.cn/zwgk/ghjh/content/post_3278092.html"],
 ["惠东县2024年统计公报（含官方PDF）","https://www.huidong.gov.cn/hdxwz/zwgk/sjfb/tjgb/content/mpost_5511757.html"],
 ["四会市2024年统计公报（第三方转录）","https://zgrkk.com/reports/3274.html"],
 ["2026年10月博罗产业发展报道","https://epaper.nfnews.com/nfdaily/html/202610/30/content_10184753.html?origin=5"]
];
let selectedYear=2025,chartType="scatter",selectedIndustry="electronics",selectedSize="small",selectedRegion="boluo";
let bound=false;
const section=()=>document.querySelector('[data-page="industry"]');
const query=(s)=>section()?.querySelector(s)||null;
const escapeHTML=x=>String(x==null?"":x).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const fixed=(n,d=1)=>Number(n).toFixed(d);
const signed=n=>(n>0?"+":"")+fixed(n)+"%";
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const position=(v,min,max,a,b)=>a+(v-min)/(max-min)*(b-a);
function updateButtons(selector,attr,selected){
 section()?.querySelectorAll(selector).forEach(b=>{const active=b.getAttribute(attr)===String(selected);
  b.classList.toggle("active",active);b.setAttribute("aria-pressed",active?"true":"false");
 });
}
function meter(n){
 const width=Math.abs(n)/25*49,neg=n<0,left=neg?50-width:50;
 return '<div class="in-meter" aria-label="'+escapeHTML(signed(n))+'"><i class="in-meter-fill'+(neg?' negative':'')+'" style="left:'+fixed(left,2)+'%;width:'+fixed(width,2)+'%"></i></div>';
}
function renderYear(){
 const d=YEARS[selectedYear];
 updateButtons("#in-year-tabs button","data-industrial-year",selectedYear);
 const rows=[["规上工业增加值",d.production],["工业投资",d.investment]];
 query("#in-year-comparison").innerHTML=rows.map(([label,value])=>
   '<div class="in-meter-row"><span class="label">'+label+'</span>'+meter(value)+
   '<strong class="value'+(value<0?' negative':'')+'">'+signed(value)+'</strong></div>').join("")+
   '<div class="in-meter-caption">左侧为负增长 · 中线为0 · 右侧为正增长。所有数值均为同比增速。</div>';
 query("#in-year-headline").textContent=d.headline;
 query("#in-year-note").textContent=d.note;
}
function industryScatter(){
 const w=920,h=395,p={l:76,r:64,t:35,b:64},x=v=>position(v,0,28,p.l,w-p.r),
  y=v=>position(v,-8,27,h-p.b,p.t);
 let out='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="行业增加值占比与行业增长率散点图">';
 for(const v of [-5,0,10,20]){
  const yy=y(v);out+='<line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(v===0?'#91aab7':'#e7eff3')+'" stroke-dasharray="'+(v===0?'5 4':'2 5')+'"/>'+
   '<text class="in-axis" x="'+(p.l-13)+'" y="'+(yy+4)+'" text-anchor="end">'+v+'%</text>';
 }
 for(const v of [0,5,10,15,20,25])out+='<text class="in-axis" x="'+x(v)+'" y="'+(h-p.b+24)+'" text-anchor="middle">'+v+'%</text>';
 out+='<text class="in-axis" x="'+(w/2)+'" y="'+(h-8)+'" text-anchor="middle">行业增加值占规上工业增加值的比重</text>'+
 '<text class="in-axis" x="22" y="'+(h/2)+'" text-anchor="middle" transform="rotate(-90 22 '+h/2+')">行业同比增速</text>';
 for(const d of INDUSTRIES){
  const xx=x(d.share),yy=y(d.growth),rad=14+Math.sqrt(d.share)*6.2,active=d.id===selectedIndustry,
   fill=d.growth<0?"#d58b73":"#5a9fce";
  out+='<g data-industrial-key="'+d.id+'" role="button" tabindex="0" aria-label="'+escapeHTML(d.short+'：占比'+d.share+'%，增速'+signed(d.growth))+'">'+
   '<circle cx="'+xx+'" cy="'+yy+'" r="'+(rad+6)+'" fill="'+fill+'" opacity="'+(active?.18:.065)+'"/>'+
   '<circle cx="'+xx+'" cy="'+yy+'" r="'+rad+'" fill="'+fill+'" fill-opacity="'+(active?.78:.42)+'" stroke="'+(active?'#1a657d':'#ffffff')+'" stroke-width="'+(active?4:2)+'"/>'+
   '<text x="'+xx+'" y="'+(yy+5)+'" font-size="16" font-weight="850" text-anchor="middle" fill="#163c53">'+escapeHTML(d.short)+'</text>'+
   '<text x="'+xx+'" y="'+(yy+rad+19)+'" font-size="12" text-anchor="middle" fill="#577b8d">'+d.share+'% · '+signed(d.growth)+'</text><title>'+escapeHTML(d.label)+'：'+d.share+'%，'+signed(d.growth)+'</title></g>';
 }
 out+='</svg>';return out;
}
function industryRank(){
 const max=27;
 return '<div role="group" aria-label="各行业增速双向对照">'+INDUSTRIES.map(d=>{
  const width=Math.abs(d.growth)/max*47,left=d.growth<0?50-width:50;
  return '<button type="button" class="in-lolli'+(d.id===selectedIndustry?' active':'')+'" data-industrial-key="'+d.id+'">'+
   '<span class="in-lolli-label">'+escapeHTML(d.short)+'<small style="display:block;font-weight:500;color:#8ba0ab">'+fixed(d.share)+'%占比</small></span>'+
   '<span class="in-lolli-track"><i class="in-lolli-fill'+(d.growth<0?' negative':'')+'" style="left:'+fixed(left)+'%;width:'+fixed(width)+'%"></i></span>'+
   '<span class="in-lolli-value">'+signed(d.growth)+'</span></button>';
 }).join("")+'</div><p class="in-meter-caption">左侧为负增速，右侧为正增速。列表并非行业增加值的金额排名。</p>';
}
function renderIndustry(){
 updateButtons("#in-chart-modes button","data-industrial-chart",chartType);
 query("#in-industry-chart").innerHTML=chartType==="scatter"?industryScatter():industryRank();
 const d=INDUSTRIES.find(x=>x.id===selectedIndustry)||INDUSTRIES[0];
 query("#in-industry-detail").innerHTML='<span class="in-focus-overline">SELECTED INDUSTRY · 2025</span>'+
  '<h3>'+escapeHTML(d.label)+'</h3><div class="in-focus-stats">'+
  '<div><small>规上增加值占比</small><strong>'+fixed(d.share)+'%</strong></div>'+
  '<div><small>同比增速</small><strong'+(d.growth<0?' class="negative"':'')+'>'+signed(d.growth)+'</strong></div></div>'+
  '<p>占比只反映该行业在规上工业增加值中的权重，不能推算该行业的绝对增加值。</p>'+
  '<div class="in-focus-action"><b>值得继续核实</b>'+escapeHTML(d.question)+'</div>';
}
function renderSize(){
 updateButtons("#in-size-tabs button","data-size",selectedSize);
 query("#in-size-chart").innerHTML='<div class="in-size-bars">'+SIZES.map(d=>
   '<button data-size="'+d.id+'" type="button" class="'+(d.id===selectedSize?'active':'')+'" style="width:'+d.share+'%;background:'+d.color+'" aria-label="'+d.name+'占比'+d.share+'%，同比增长'+d.growth+'%"></button>').join("")+'</div>'+
   '<div class="in-size-labels"><span>小微型 56.8%</span><span>中型 24.0%</span><span>大型 19.2%</span></div>';
 const d=SIZES.find(x=>x.id===selectedSize)||SIZES[0];
 query("#in-size-detail").innerHTML='<div><small>'+d.name+'增加值占比</small><strong>'+fixed(d.share)+'%</strong></div>'+
 '<div><small>'+d.name+'增加值同比</small><strong>+'+fixed(d.growth)+'%</strong></div>';
}
function regionScatter(){
 const w=920,h=350,p={l:72,r:52,t:42,b:57},x=v=>position(v,25,65,p.l,w-p.r),
 y=v=>position(v,-4,12,h-p.b,p.t);
 let out='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="2024年县区二产占比与规上工业增加值增速散点图">';
 for(const v of [-4,0,4,8,12]){
  const yy=y(v);out+='<line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(v===0?"#9cb3be":"#e6edf1")+'" stroke-dasharray="4 5"/><text class="in-axis" text-anchor="end" x="'+(p.l-10)+'" y="'+(yy+4)+'">'+v+'%</text>';
 }
 for(const v of [30,40,50,60])out+='<text class="in-axis" x="'+x(v)+'" y="'+(h-p.b+22)+'" text-anchor="middle">'+v+'%</text>';
 out+='<text class="in-axis" x="'+(w/2)+'" y="'+(h-4)+'" text-anchor="middle">第二产业占GDP比重</text>';
 for(const d of REGIONS){
  const active=d.id===selectedRegion,xx=x(d.share),yy=y(d.growth),r=active?21:16;
  out+='<g data-region-key="'+d.id+'" role="button" tabindex="0" aria-label="'+escapeHTML(d.name+'，二产占比'+d.share+'%，规上工业增加值增速'+signed(d.growth))+'">'+
   '<circle cx="'+xx+'" cy="'+yy+'" r="'+(r+10)+'" fill="'+(active?"#45b4a4":"#78a7c4")+'" opacity=".15"/>'+
   '<circle cx="'+xx+'" cy="'+yy+'" r="'+r+'" fill="'+(active?"#328c9e":"#8baec2")+'" stroke="#fff" stroke-width="3"/>'+
   '<text x="'+xx+'" y="'+(yy-r-15)+'" text-anchor="middle" fill="#2d6076" font-size="17" font-weight="850">'+d.name+'</text>'+
   '<text x="'+xx+'" y="'+(yy+5)+'" text-anchor="middle" fill="#fff" font-size="10" font-weight="850">'+signed(d.growth)+'</text></g>';
 }
 return out+'</svg>';
}
function renderRegions(){
 query("#in-region-chart").innerHTML=regionScatter();
 query("#in-region-pills").innerHTML=REGIONS.map(d=>
  '<button type="button" data-region-key="'+d.id+'" class="'+(selectedRegion===d.id?'active':'')+'" aria-pressed="'+(selectedRegion===d.id)+'">'+d.name+'</button>').join("");
 const d=REGIONS.find(x=>x.id===selectedRegion)||REGIONS[0];
 query("#in-region-detail").innerHTML='<span class="in-focus-overline">REGIONAL COMPARISON / 2024</span>'+
 '<h3>'+d.name+' · 结构参照</h3><div class="in-focus-stats">'+
 '<div><small>二产占GDP</small><strong>'+fixed(d.share)+'%</strong></div>'+
 '<div><small>规上工业增速</small><strong'+(d.growth<0?' class="negative"':'')+'>'+signed(d.growth)+'</strong></div></div>'+
 '<p>'+escapeHTML(d.comment)+'</p><div class="in-focus-action"><b>比较边界</b>同为2024年，但各地行业结构、价格及统计范围存在差异。本图不判断因果或发展优劣。</div>';
}
function renderCapacity(){
 query("#in-capacity-grid").innerHTML=CAPACITY.map(x=>'<div class="in-capacity-cell"><strong>'+x.value+'</strong><span><b>'+escapeHTML(x.label)+'</b><br>'+escapeHTML(x.detail)+'</span></div>').join("");
}
function renderSources(){
 query("#in-source-entries").innerHTML='<ul>'+SOURCES.map(([label,url])=>'<li><a target="_blank" rel="noopener noreferrer" href="'+escapeHTML(url)+'">'+escapeHTML(label)+'</a></li>').join("")+'</ul>'+
 '<p style="font-size:11px;color:#718996;line-height:1.8">数据性质：2025博罗、2024县区为公开统计的转录或官方资料；正式科研使用前需复核原始统计公报。2025行业增速是同比增长，行业占比是规上工业增加值权重。总二产增加值包含建筑业，不可等同规上工业增加值。企业数量占比不可与企业增加值占比混用。县区结构对照为探索性参照，非标准化因果比较。此页不使用、也不展示Demo合成企业数据。</p>';
}
function render(){
 if(!section())return;
 renderYear();renderIndustry();renderSize();renderRegions();renderCapacity();renderSources();
}
function handleSelect(ev){
 const year=ev.target.closest("[data-industrial-year]");
 if(year){selectedYear=Number(year.dataset.industrialYear);renderYear();return;}
 const mode=ev.target.closest("[data-industrial-chart]");
 if(mode){chartType=mode.dataset.industrialChart;renderIndustry();return;}
 const ind=ev.target.closest("[data-industrial-key]");
 if(ind){selectedIndustry=ind.dataset.industrialKey;renderIndustry();return;}
 const size=ev.target.closest("[data-size]");
 if(size){selectedSize=size.dataset.size;renderSize();return;}
 const region=ev.target.closest("[data-region-key]");
 if(region){selectedRegion=region.dataset.regionKey;renderRegions();}
}
function bind(){
 if(bound||!section())return;
 section().addEventListener("click",handleSelect);
 section().addEventListener("keydown",ev=>{
  if(ev.key!=="Enter"&&ev.key!==" ")return;
  const target=ev.target.closest("[data-industrial-key],[data-region-key]");
  if(!target)return;ev.preventDefault();handleSelect({target});
 });
 bound=true;
}
root.BoluoIndustryPage={render,bind};
})(window);
