(function(){"use strict";
const root=document.getElementById("expEntry"); if(!root)return;
const el=id=>document.getElementById(id);
const defaultNames=["罗阳街道","龙溪街道","石湾镇","园洲镇","杨村镇","公庄镇","湖镇镇","长宁镇","横河镇","龙华镇","柏塘镇","泰美镇","杨侨镇","麻陂镇","观音阁镇","石坝镇"];
const names=typeof towns!=="undefined"?towns:defaultNames;
const facts={
"罗阳街道":["你以为罗阳只有县城功能？这里也有制造业。","罗阳是县政府驻地，也是16镇街之一。公开资料中能找到制造业项目，但还不能直接回答其行业增加值有多少。","制造、县城服务与产业配套各发挥什么作用？"],
"龙溪街道":["新工厂投产，不等于它的所有产能都已释放。","公开报道能识别生产项目，但产能利用、本地采购和就业变化还需要继续观察。","新增项目与存量产业能够形成什么联系？"],
"园洲镇":["企业扎堆，不等于企业之间已经连成链。","已有制造企业与数字化转型线索，但企业数量不能替代真实订单关系。","本地产业配套是否足够密集？"],
"石湾镇":["产业重镇和规划中的副中心，是两种不同身份。","石湾的制造业活动与罗浮未来城规划需要分开观察：一个是现实生产，一个是未来空间组织。","哪些规划中的功能已经变成现实？"],
"长宁镇":["同一个地名，统计口径可能已经变化。","2025年原长宁镇与福田镇合并。不能简单拿旧行政区数据给新长宁画同比排名。","新长宁的产业活动如何得到可比的观察？"],
"柏塘镇":["看见茶叶，还没看见茶产业的全部。","采收、加工、收购、回款和市场渠道是不同环节。只有产量，不代表已经了解经营状况。","最先需要补的经营证据是什么？"],
"泰美镇":["农业不只在田里，价值还可能在加工与流通。","已有农产品供应基地的公开线索，但平台建设不能直接视为经营收益。","多少生产和流通价值真正留在当地？"],
"杨村镇":["新城是规划，而真实能力需要逐项核验。","杨村是博东新城规划锚点之一，规划方向不等于现有产业已经达到目标。","农、工、服务各有哪些真实基础？"],
"杨侨镇":["和杨村同在一张规划里，产业基础未必一样。","博东新城相关部署涉及杨村、杨侨，但不能从共同规划直接推断能力相同。","哪些现有能力值得优先核验？"],
"湖镇镇":["进入环两山规划，不等于旅游收益已经到手。","生态资源、道路和项目是不同要素，需用真实生产与经营数据观察。","资源如何变成持续的生产经营？"],
"横河镇":["生态潜力与产业收入，不是同一个数字。","环两山规划涉及横河，但规划布局不等于已有产业规模。","有哪些已发生的经营活动可以证明转化？"]
};
const generic=["这个镇街没有完整的统计画像，但仍有办法继续观察。","没有找到统一口径的镇级产业数据，不应以空白推断发展弱。可以先识别公开的企业、产品和项目线索。","如果只补一条证据，最值得寻找什么？"];
const stateExp={mode:"town",town:"罗阳街道"};
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setText(id,s){el(id).textContent=s}
function getInfo(t){return typeof data==="function"?data(t):{e:[],q:"下一条证据是什么？"}}
function renderTown(){
 const d=facts[stateExp.town]||generic,z=getInfo(stateExp.town);
 setText("expPrompt","选一个你熟悉的镇街");setText("expChooseLabel","16个镇街都可以点。先从你熟悉的地方开始。");
 setText("expRevealTitle",d[0]);setText("expRevealSub",d[1]);setText("expRevealNote","值得追问："+d[2]+" 公开资料不完整，因此不能把这句话当作完整的镇级产业结论。");
 const sources=(z.e||[]).slice(0,2);
 el("expRevealPills").innerHTML=sources.length?sources.map(e=>'<a class="exp-pill" href="'+safe(e[2])+'" target="_blank" rel="noopener noreferrer">'+safe(e[0])+' ↗</a>').join(""):'<span class="exp-pill">缺完整的同口径镇级数据</span>';
 el("expRevealStats").innerHTML='<button class="exp-stat" data-exp-next="true"><small>现在看的地方</small><b>'+safe(stateExp.town)+'</b></button><button class="exp-stat" data-exp-ask="true"><small>你可能忽略了</small><b style="font-size:16px">哪些还不知道？</b></button>';
 el("expRevealStats").querySelector("[data-exp-next]").onclick=explore;
 el("expRevealStats").querySelector("[data-exp-ask]").onclick=()=>{if(typeof pick==="function")pick(stateExp.town+"｜"+d[2]);};
 setText("expPrimary","拆开这个镇街看看 →");el("expTownPicker").hidden=false;el("expTownSelect").value=stateExp.town;
}
function renderEconomy(){
 setText("expPrompt","1005亿元里，哪一块最大？");setText("expChooseLabel","从一个想当然的印象，进入真实产业构成。");
 setText("expRevealTitle","第二产业占54.6%。但博罗不只有工业。");
 setText("expRevealSub","2025年GDP为1005.45亿元。第二产业既包括工业也包括建筑业，不能把它说成全县规上工业总产值。");
 el("expRevealPills").innerHTML='<span class="exp-pill">2025年公开统计</span><span class="exp-pill">分母：地区生产总值</span>';
 el("expRevealStats").innerHTML='<button class="exp-stat" data-exp-sector="0"><small>第一产业</small><b>10.7%</b></button><button class="exp-stat" data-exp-sector="1"><small>第二产业</small><b>54.6%</b></button><button class="exp-stat" data-exp-sector="2"><small>第三产业</small><b>34.7%</b></button>';
 el("expRevealStats").querySelectorAll("[data-exp-sector]").forEach(b=>b.onclick=()=>{showDeep(true);document.querySelector('[data-viz-mode="gdp"]')?.click();document.querySelectorAll("[data-viz-tile]")[+b.dataset.expSector]?.click();el("v11VizBoard")?.scrollIntoView({behavior:"smooth",block:"start"});});
 setText("expRevealNote","点击一项，查看真实数据。产业规模、增速和未来潜力不是同一个问题。");
 setText("expPrimary","亲手拆开千亿经济 →");el("expTownPicker").hidden=true;
}
function renderMountains(){
 setText("expPrompt","两座山，只是旅游景点吗？");setText("expChooseLabel","换一个角度，看县域之间的产业协同。");
 setText("expRevealTitle","环两山讨论的不只是景区，还包括产业与空间布局。");
 setText("expRevealSub","这是涉及博罗和龙门等区域的规划框架。拥有景观、获得规划定位，不等于已经形成稳定的产业经营收益。");
 el("expRevealPills").innerHTML='<span class="exp-pill">罗浮山—南昆山</span><span class="exp-pill">跨县域规划</span>';
 el("expRevealStats").innerHTML='<button class="exp-stat" data-exp-next="true"><small>博罗涉及</small><b>5个镇</b></button><button class="exp-stat" data-exp-next="true"><small>空间属性</small><b style="font-size:16px">跨县协同</b></button><button class="exp-stat" data-exp-next="true"><small>最值得核验</small><b style="font-size:16px">产业连接</b></button>';
 el("expRevealStats").querySelectorAll("[data-exp-next]").forEach(b=>b.onclick=explore);
 setText("expRevealNote","博罗涉及园洲、石湾、长宁、湖镇、横河等镇及罗浮山管委会。管委会不是第17个镇街。");
 setText("expPrimary","看看两山和镇街 →");el("expTownPicker").hidden=true;
}
function render(){
 document.querySelectorAll("[data-exp-mode]").forEach(b=>{const active=b.dataset.expMode===stateExp.mode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
 if(stateExp.mode==="town")renderTown();else if(stateExp.mode==="economy")renderEconomy();else renderMountains();
 setText("expModeStep",stateExp.mode==="town"?"先从你熟悉的地方开始":stateExp.mode==="economy"?"把一个数字拆开看":"看见规划与现实之间的距离");
 const r=el("expReveal");r.classList.remove("exp-floating");void r.offsetWidth;r.classList.add("exp-floating");
}
function showDeep(open){document.body.classList.toggle("exp-show-deep",open);setText("expEvidenceBtn",open?"收起统计依据 ↑":"打开全部数据图表 ↗");el("expEvidenceBtn").setAttribute("aria-expanded",String(open));}
function explore(){
 if(stateExp.mode==="town"&&typeof selectTown==="function")selectTown(stateExp.town);
 if(stateExp.mode==="mountains"&&typeof setMode==="function")setMode("ring");
 if(stateExp.mode==="economy"){showDeep(true);document.querySelector('[data-viz-mode="gdp"]')?.click();}
 (stateExp.mode==="economy"?el("v11VizBoard"):el("v11Explore"))?.scrollIntoView({behavior:"smooth",block:"start"});
}
async function share(){
 const content=["我在博罗风洞里发现一件值得继续问的事：",el("expRevealTitle").textContent,el("expRevealSub").textContent,"这来自公开资料整理，不代表完整或已核验的镇级结论。",location.href.split("#")[0]].join("\n");
 try{await navigator.clipboard.writeText(content);if(typeof toast==="function")toast("已复制观察卡");}catch(e){const t=document.createElement("textarea");t.value=content;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();if(typeof toast==="function")toast("已复制观察卡");}
}
const picker=el("expTownSelect");picker.innerHTML=names.map(n=>'<option value="'+safe(n)+'">'+safe(n)+'</option>').join("");
picker.value=stateExp.town;picker.onchange=()=>{stateExp.town=picker.value;render();};
document.querySelectorAll("[data-exp-town]").forEach(b=>b.onclick=()=>{stateExp.mode="town";stateExp.town=b.dataset.expTown;render();});
document.querySelectorAll("[data-exp-mode]").forEach(b=>b.onclick=()=>{stateExp.mode=b.dataset.expMode;render();});
el("expPrimary").onclick=explore;el("expStart").onclick=explore;el("expShare").onclick=share;
el("expEvidenceBtn").onclick=()=>{const open=!document.body.classList.contains("exp-show-deep");showDeep(open);if(open)el("v11VizBoard")?.scrollIntoView({behavior:"smooth",block:"start"});};
render();
})();