(()=>{"use strict";
const root=document.getElementById("v11VizBoard");if(!root)return;
const get=id=>document.getElementById(id);
const sources={
  bulletin:"https://maptable.com/tjgb/2025/%E6%83%A0%E5%B7%9E%E5%B8%82/%E5%8D%9A%E7%BD%97%E5%8E%BF/report/hui-zhou-shi-2025-nian-bo-luo-guo-min-jing-ji-he-she-hui-fa-zhan-tong-ji-gong-bao-2",
  economy:"https://epaper.nfnews.com/nfdaily/html/202602/03/content_10162180.html",
  enterprise:"https://epaper.nfnews.com/nfdaily/html/202602/10/content_10162866.html",
  previous:"https://zgrkk.com/reports/3155.html"
};
const sectorGDP=[
 {name:"第一产业",short:"第一产业",share:10.7,amount:107.44,growth:7.8,color:"#1fa79a"},
 {name:"第二产业",short:"第二产业",share:54.6,amount:549.01,growth:6.9,color:"#2678d3"},
 {name:"第三产业",short:"第三产业",share:34.7,amount:349.00,growth:2.7,color:"#8a6edd"}
];
const industry=[
 {name:"计算机、通信和其他电子设备制造业",short:"电子信息设备",share:23.2,growth:23.0,prev:10.4,color:"#206cdd"},
 {name:"电气机械和器材制造业",short:"电气机械",share:14.2,growth:13.7,prev:5.6,color:"#7961df"},
 {name:"橡胶和塑料制品业",short:"橡胶塑料",share:9.6,growth:-4.2,prev:13.2,color:"#15acac"},
 {name:"金属制品业",short:"金属制品",share:8.2,growth:11.1,prev:11.5,color:"#ed9950"},
 {name:"电力、热力生产和供应业",short:"电力热力",share:6.2,growth:14.0,prev:10.4,color:"#d27383"},
 {name:"其他规上工业行业合计",short:"其他行业",share:38.6,growth:null,prev:null,color:"#7895b9"}
];
const products=[
 {name:"中成药",growth:-24.9,unit:"4893.2吨"},
 {name:"涂料",growth:16.2,unit:"8.52万吨"},
 {name:"饮料",growth:13.4,unit:"374.2万吨"},
 {name:"服装",growth:9.8,unit:"1642.6万件"},
 {name:"电子元件",growth:5.0,unit:"131.5亿只"},
 {name:"印制电路板",growth:-0.1,unit:"763.6万平方米"}
];
const tiers=[
 {name:"百亿元级",count:2,comment:"产值百亿元级企业"},
 {name:"10亿元以上",count:22,comment:"含百亿元级"},
 {name:"1亿元以上",count:396,comment:"含10亿元以上"},
 {name:"规上企业总量",count:1407,comment:"全县规上工业企业"}
];
const coverage={
 "罗阳街道":[1,0,0,0],
 "龙溪街道":[1,0,0,0],
 "石湾镇":[0,0,1,1],
 "园洲镇":[1,0,1,1],
 "杨村镇":[0,0,1,0],
 "公庄镇":[0,0,0,0],
 "湖镇镇":[0,0,0,1],
 "长宁镇":[0,0,1,1],
 "横河镇":[0,0,0,1],
 "龙华镇":[0,0,0,0],
 "柏塘镇":[0,0,0,0],
 "泰美镇":[0,1,0,0],
 "杨侨镇":[0,0,1,0],
 "麻陂镇":[0,0,0,0],
 "观音阁镇":[0,0,0,0],
 "石坝镇":[0,0,0,0]
};
const v={mode:"industry",current:0,growthMode:"industry",growthCurrent:0,tier:3};
const fmt=n=>n.toLocaleString("zh-CN");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function binaryTiles(entries,x,y,w,h){
 if(entries.length===1)return [{...entries[0],x,y,w,h}];
 const total=entries.reduce((s,e)=>s+e.share,0);let split=0,acc=0;
 while(split<entries.length-1&&acc<total/2){acc+=entries[split].share;split++}
 const f=Math.max(.08,Math.min(.92,acc/total)),left=entries.slice(0,split),right=entries.slice(split);
 return w>=h?binaryTiles(left,x,y,w*f,h).concat(binaryTiles(right,x+w*f,y,w*(1-f),h)):binaryTiles(left,x,y,w,h*f).concat(binaryTiles(right,x,y+h*f,w,h*(1-f)));
}
function renderTree(){
 const ds=v.mode==="industry"?industry:sectorGDP;
 const t=binaryTiles(ds,0,0,100,100);
 get("vizTree").innerHTML=t.map((d,i)=>{
  const title=d.short;const compact=d.w*d.h<1050;
  return '<button class="viz-tile '+(compact?'compact ':'')+(v.current===i?'selected':'')+'" data-viz-tile="'+i+'" aria-label="'+esc(d.name)+' 占比'+d.share+'%" style="left:'+d.x+'%;top:'+d.y+'%;width:'+d.w+'%;height:'+d.h+'%;background:'+d.color+'"><span class="viz-tile-title">'+esc(title)+'</span><strong class="viz-tile-pct">'+d.share.toFixed(1)+'%</strong><span class="viz-tile-note">'+(v.mode==="industry"?(d.growth===null?"其他行业":"同比 "+(d.growth>=0?"+":"")+d.growth.toFixed(1)+"%"):"增加值 "+d.amount.toFixed(2)+"亿元")+'</span></button>';
 }).join("");
 get("vizTree").querySelectorAll("[data-viz-tile]").forEach(b=>b.onclick=()=>{v.current=Number(b.dataset.vizTile);renderTree()});
 const s=ds[v.current];
 get("vizTreeDetail").innerHTML='<div><strong>'+esc(s.name)+'</strong><small>'+(v.mode==="industry"?'占全县规上工业增加值比重（2025年）':'占全县地区生产总值比重（2025年）')+'</small></div><div class="viz-big">'+s.share.toFixed(1)+'%</div>';
 get("vizFocus").innerHTML=v.mode==="industry"?(s.growth===null?"“其他行业”是未单列行业合计，不能把它当作一个行业来比较增速。":s.short+"：2025年增加值同比 "+(s.growth>=0?"+":"")+s.growth.toFixed(1)+"%；规模占比与增长速度是两种不同信息。"):s.short+"：2025年增加值 "+s.amount.toFixed(2)+" 亿元，同比 "+(s.growth>0?"+":"")+s.growth.toFixed(1)+"%。";
 get("vizFocusAdd").onclick=()=>{const q=v.mode==="industry"?s.name+"在工业结构中的位置，与其增速变化之间有什么不同？":s.name+"的增加值规模与增长速度可以分别说明什么？";if(typeof pick==="function")pick("产业底盘｜"+q);else if(typeof toast==="function")toast("关注事项："+q)};
}
function viewTree(mode){
 v.mode=mode;v.current=0;
 document.querySelectorAll("[data-viz-mode]").forEach(b=>{b.classList.toggle("active",b.dataset.vizMode===mode);b.setAttribute("aria-pressed",String(b.dataset.vizMode===mode))});
 get("vizTreeLabel").textContent=mode==="industry"?"2025年规上工业行业构成":"2025年GDP三次产业构成";
 get("vizTreeDenom").textContent=mode==="industry"?"分母：全县规上工业增加值（不是GDP或工业总产值）":"分母：全县GDP 1005.45亿元";
 renderTree();
}
function renderGrowth(){
 document.querySelectorAll("[data-viz-growth]").forEach(b=>{b.classList.toggle("active",b.dataset.vizGrowth===v.growthMode);b.setAttribute("aria-pressed",String(b.dataset.vizGrowth===v.growthMode))});
 get("vizGrowthLabel").textContent=v.growthMode==="industry"?"五大行业：2024 vs 2025 同比增速":"主要产品：2025产量同比增速";
 get("vizGrowthMeta").textContent=v.growthMode==="industry"?"两年同名行业增速对照｜单位：%｜2024灰点，2025彩点":"只比较各产品自身的同比方向；不同计量单位不得比较产量规模。";
 if(v.growthMode==="industry"){
  const lo=-10,hi=26,xx=z=>175+(z-lo)/(hi-lo)*355;
  const ticks=[-10,0,10,20],rows=industry.slice(0,5);
  const svg=['<svg viewBox="0 0 560 300" role="img" aria-label="五大行业2024年和2025年同比增长率哑铃对比图">'];
  ticks.forEach(val=>{svg.push('<line class="'+(val===0?"zero":"gridline")+'" x1="'+xx(val)+'" x2="'+xx(val)+'" y1="23" y2="266"/><text class="tick" text-anchor="middle" x="'+xx(val)+'" y="289">'+val+'%</text>')});
  rows.forEach((d,i)=>{
   const y=51+i*45,sel=v.growthCurrent===i,positive=d.growth>=0;
   svg.push('<g class="viz-growth-point" tabindex="0" role="button" data-viz-industry="'+i+'" aria-label="'+esc(d.short)+' 2024年'+d.prev+'%，2025年'+d.growth+'%">');
   svg.push('<rect x="0" y="'+(y-19)+'" width="550" height="38" rx="8" fill="'+(sel?"#e9f4ff":"transparent")+'"/>');
   svg.push('<text x="164" y="'+(y+4)+'" text-anchor="end" font-weight="'+(sel?"800":"600")+'">'+esc(d.short)+'</text>');
   svg.push('<line x1="'+xx(d.prev)+'" x2="'+xx(d.growth)+'" y1="'+y+'" y2="'+y+'" stroke="'+(sel?"#217fd8":"#9eb7d4")+'" stroke-width="3.3" stroke-linecap="round"/>');
   svg.push('<circle cx="'+xx(d.prev)+'" cy="'+y+'" r="6" stroke="#87a4c1" stroke-width="1" fill="#d0dce9"/><circle cx="'+xx(d.growth)+'" cy="'+y+'" r="7" stroke="#fff" stroke-width="2" fill="'+(positive?"#1a83cf":"#e27360")+'"/>');
   svg.push('<title>'+esc(d.name)+'：2024年同比'+d.prev+'%，2025年同比'+d.growth+'%（2025占比'+d.share+'%）</title></g>');
  });
  svg.push('</svg>');
  get("vizGrowthPlot").innerHTML=svg.join("");
  get("vizGrowthPlot").querySelectorAll("[data-viz-industry]").forEach(el=>{
   el.onclick=()=>{v.growthCurrent=Number(el.dataset.vizIndustry);renderGrowth()};
   el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();el.click()}}
  });
  const item=rows[v.growthCurrent],diff=item.growth-item.prev;
  get("vizGrowthInsight").innerHTML='<b>'+esc(item.short)+'</b>：2024年 +'+item.prev.toFixed(1)+'%，2025年 '+(item.growth>=0?"+":"")+item.growth.toFixed(1)+'%，增速较上年'+(diff>=0?"提高":"回落")+Math.abs(diff).toFixed(1)+'个百分点。<span class="light">数据不证明具体成因。</span>';
 }else{
   const max=30;const layout=products.map(p=>{
    const left=p.growth<0?(50-Math.abs(p.growth)/max*47):50,w=Math.abs(p.growth)/max*47;
    return '<div class="viz-prod-bar" title="'+esc(p.name)+' '+p.unit+'，增速 '+p.growth+'%"><b>'+esc(p.name)+'</b><div class="viz-prod-track"><span class="mid"></span><i style="left:'+left+'%;width:'+w+'%;background:'+(p.growth<0?"#e88c70":"#1e8fc2")+'"></i></div><small style="color:'+(p.growth<0?"#c86b58":"#167d9f")+'">'+(p.growth>0?"+":"")+p.growth.toFixed(1)+'%</small></div>';
   }).join('');
   get("vizGrowthPlot").innerHTML='<div class="viz-product-plot" style="width:100%"><p class="viz-mode-hint">向左为下降 · 中线为0 · 向右为增长</p>'+layout+'<p class="viz-mode-hint">同一图只比较百分比，不比较产品数量或价值。</p></div>';
   get("vizGrowthInsight").innerHTML='<b>中成药产量 −24.9%，涂料 +16.2%</b>。产品增速方向存在差异，但这些产品的计量单位和产业权重不同，不能直接相加。';
 }
}
function renderTiers(){
 const html=tiers.map((t,i)=>{
  const pct=100*Math.log10(t.count+1)/Math.log10(1408);
  return '<div class="viz-scale-row '+(v.tier===i?'selected':'')+'" data-tier="'+i+'" role="button" tabindex="0" aria-label="'+t.name+' '+t.count+'家，查看说明"><span class="lab">'+t.name+'</span><div class="viz-scale-track"><b style="width:'+Math.max(8,pct).toFixed(2)+'%"></b></div><strong class="value">'+fmt(t.count)+'</strong></div>';
 }).join('');
 get("vizTierList").innerHTML=html;
 get("vizTierList").querySelectorAll("[data-tier]").forEach(b=>{
 b.onclick=()=>{v.tier=Number(b.dataset.tier);renderTiers()};
 b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();b.click()}}
 });
 const t=tiers[v.tier];
 get("vizTierDetail").textContent=t.name+"：共 "+fmt(t.count)+" 家。"+t.comment+"。四个梯队是包含关系，不是四组相互独立企业。";
}
function renderTownMatrix(){
 const names=(typeof towns!=="undefined"&&Array.isArray(towns))?towns:Object.keys(coverage);
 const fields=["制造项目","农林流通","功能规划","环两山"];
 let html='<div class="head">16镇街</div>'+fields.map(x=>'<div class="head">'+x+'</div>').join('');
 names.forEach(n=>{
  html+='<button class="townlab '+(typeof state!=="undefined"&&state.selected===n&&state.mode==="town"?"selected-town":"")+'" data-matrix-town="'+esc(n)+'">'+esc(n)+'</button>';
  coverage[n].forEach((flag,i)=>{
   html+='<button class="'+(flag?'yes':'no')+'" data-matrix-town="'+esc(n)+'" title="'+esc(n)+' · '+fields[i]+'：'+(flag?'本页已整理公开线索':'本页尚未整理可核验线索')+'">'+(flag?"●":"—")+'</button>';
  });
 });
 get("vizEvidenceMatrix").innerHTML=html;
 get("vizEvidenceMatrix").querySelectorAll("[data-matrix-town]").forEach(b=>b.onclick=()=>{
  const n=b.dataset.matrixTown;if(typeof selectTown==="function")selectTown(n);
  renderTownMatrix();
  const d=(typeof data==="function"?data(n):{q:"需要补充产业线索"});
  get("vizMatrixDetail").innerHTML='<b>'+esc(n)+'</b> · 已整理 '+(coverage[n].reduce((x,y)=>x+y,0))+'/'+fields.length+' 类线索。灰格只是本站暂未收录，不代表该镇没有相关产业。';
  if(window.matchMedia("(max-width:680px)").matches)get("detailTitle")?.scrollIntoView({block:"center",behavior:"smooth"});
 });
 const count=names.reduce((sum,n)=>sum+coverage[n].reduce((a,b)=>a+b,0),0);
 get("vizMatrixCaption").textContent="● 已在本页整理公开线索；— 尚未整理。"+count+"/"+(names.length*fields.length)+"格有资料，不作镇街发展水平排名。";
}
function init(){
 document.querySelectorAll("[data-viz-mode]").forEach(b=>b.onclick=()=>viewTree(b.dataset.vizMode));
 document.querySelectorAll("[data-viz-growth]").forEach(b=>b.onclick=()=>{v.growthMode=b.dataset.vizGrowth;renderGrowth()});
 get("vizMatrixExplain").onclick=()=>{if(typeof drawer==="function")drawer("16镇街公开线索覆盖矩阵",'<div class="source"><b>它衡量什么？</b><p>矩阵只表示本页是否整理出相关的、具有公开出处的线索，不代表真实产业规模、强度或发展速度。</p></div><div class="source"><b>为什么保留灰格？</b><p>未收录数据不等于某个镇没有企业、农林经营或产业规划。不同镇公开信息覆盖不均，暂时不能用来计算区域产业能力评分。</p></div><div class="source"><b>哪些是真正的数量？</b><p>图表中的GDP、规上工业行业占比、企业梯队和创新资源属于具体统计数值；地图节点与线索矩阵不能替代镇级统计。</p></div>');};
 get("vizPyramidExplain").onclick=()=>{if(typeof drawer==="function")drawer("企业梯队统计口径",'<div class="source"><b>数量是累计门槛</b><p>百亿级2家、产值10亿元以上22家、1亿元以上396家，均为规上工业企业总量1407家的子集；不能把四组相加。</p><a href="'+sources.enterprise+'" target="_blank" rel="noopener noreferrer">查看2026年2月南方日报报道 ↗</a></div><div class="source"><b>图形宽度</b><p>考虑差距跨越多个数量级，采用对数刻度，以保留小数量梯队的可见度。精确数量以文字为准。</p></div>');};
 get("vizIndustrySource").href=sources.bulletin;
 get("vizGrowthSource").href=sources.bulletin;
 get("vizTierSource").href=sources.enterprise;
 get("vizCapabilitySource").href=sources.bulletin;
 viewTree("industry");renderGrowth();renderTiers();renderTownMatrix();
 // Listen to town switching in the existing view without modifying its behavior.
 const originalSelect=typeof selectTown==="function"?selectTown:null;
 if(originalSelect){document.querySelectorAll("[data-mode],[data-town]").forEach(el=>el.addEventListener("click",()=>setTimeout(renderTownMatrix,0)));}
 get("vizMatrixNotice").onclick=()=>{if(typeof drawer==="function")drawer("如何从缺失数据继续思考？",'<div class="source"><b>已知</b><p>先展示可核验的产值、企业、园区和产业项目。</p></div><div class="source"><b>未知</b><p>缺少同口径镇级数据时，让图表留白，不猜测排名和企业间交易额。</p></div><div class="source"><b>追问</b><p>点选一个镇街，再问：最关键的生产活动是什么？存在什么尚待验证的连接？用户可把问题加入待研判清单，而不是直接由系统替用户下结论。</p></div>');};
}
init();
})();