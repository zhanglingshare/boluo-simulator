/* Boluo V11 page 10 interactive value-chain and regional dependency lab. */
(function(){
"use strict";
const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s)),params=new URL(location.href).searchParams;
const FLOW={
 manufacturing:{headline:"一件工业产品，从原料到客户经过哪些环节？",stages:[["原材料","原料从哪里采购？","采购合同、供应商所在地、结算记录"],["零部件","本地企业参与了哪些配套？","供应商名录、配套采购额、交付记录"],["生产制造","生产环节的增加值在哪里形成？","企业增加值、工资、能耗与产能利用"],["研发与服务","设计、检测、物流由谁提供？","研发及服务合同、服务提供地、费用"],["销售与回款","客户在哪里，货款多久回来？","客户所在地、销售合同、应收账款"]]},
 agriculture:{headline:"一份农产品，从田间到消费者经过哪些环节？",stages:[["种植采收","谁承担季节性用工与生产成本？","种植面积、用工、采收量与成本"],["初加工","加工发生在哪里，谁承担垫资？","加工合同、损耗率、垫资周期"],["品牌包装","品牌和包装费用由谁取得？","版费、起订量、品牌授权与毛利"],["渠道销售","产品通过什么渠道卖出？","渠道合同、订单、退货与账期"],["农户回款","农户何时收到钱，收到多少？","收购价、回款时间、农户实际收入"]]},
 tourism:{headline:"一次游客消费，从到访到本地经营收入经过哪些环节？",stages:[["客源到访","游客从哪里来，为什么来？","客源地抽样、交通方式、到访目的"],["停留过夜","游客停留多久，住在哪里？","过夜率、停留时长、住宿订单"],["消费发生","餐饮、住宿、购物在哪里消费？","分场景消费调查、商户流水"],["渠道分配","平台、旅行社与商户如何分账？","平台佣金、渠道合同、结算周期"],["本地留存","本地就业、工资与经营收益增加多少？","本地用工、工资、经营利润与税收"]]}
};
const ROLE={
 local:{title:"本地做强",desc:"优先检验本地供应链、加工、专业服务和人才培养，哪些环节具备规模与成本条件。",evidence:"本地采购比例、服务合同、岗位技能结构、企业成本比较"},
 connect:{title:"区域协作",desc:"优先识别哪些能力不必重复建设，可以通过跨区域采购、研发、物流和公共服务获得。",evidence:"跨区域合同、服务可达性、协作成本、交付质量与收益分配"},
 resilient:{title:"多元备份",desc:"优先检查客户、供应商、交通和专业服务是否过度集中，以及替代路径能否在冲击时启用。",evidence:"客户与供应商集中度、替代来源数量、切换时间与成本"}
};
const saved=(()=>{try{return JSON.parse(localStorage.getItem("boluo-v11-region-focus")||"null")}catch(e){return null}})();
const state={flow:FLOW[params.get("flow")]?params.get("flow"):(saved&&FLOW[saved.flow]?saved.flow:"manufacturing"),stage:saved&&Number.isInteger(saved.flowStage)?Math.max(0,Math.min(4,saved.flowStage)):0,role:ROLE[params.get("role")]?params.get("role"):(saved&&ROLE[saved.role]?saved.role:"local"),layer:params.get("pressureLayer")||saved&&saved.pressureLayer||"industry",p:{dependency:70,shock:65,substitute:30}};
if(saved&&saved.pressure&&["dependency","shock","substitute"].every(k=>Number.isFinite(saved.pressure[k])&&saved.pressure[k]>=0&&saved.pressure[k]<=100))state.p={dependency:saved.pressure.dependency,shock:saved.pressure.shock,substitute:saved.pressure.substitute};
function score(p){return Math.round(p.dependency*p.shock*(100-p.substitute)/10000)}
function sync(){const u=new URL(location.href);u.searchParams.set("flow",state.flow);u.searchParams.set("role",state.role);u.searchParams.set("pressureLayer",state.layer);history.replaceState(null,"",u.pathname+u.search+u.hash)}
function renderFlow(){
 const f=FLOW[state.flow],box=$("valueFlowTrack");$("valueFlowHeadline").textContent=f.headline;box.replaceChildren();
 f.stages.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.className="value-stage"+(i===state.stage?" active":"");b.dataset.stage=String(i);b.setAttribute("aria-pressed",String(i===state.stage));const num=document.createElement("span");num.textContent="0"+(i+1);const title=document.createElement("strong");title.textContent=s[0];const desc=document.createElement("small");desc.textContent=s[1];b.append(num,title,desc);b.addEventListener("click",()=>{state.stage=i;renderFlow();sync()});box.append(b)});
 const s=f.stages[state.stage];$("valueStageName").textContent=s[0];$("valueStageQuestion").textContent=s[1];$("valueStageEvidence").textContent=s[2];
 all("[data-value-flow]").forEach(b=>{const on=b.dataset.valueFlow===state.flow;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});
}
all("[data-value-flow]").forEach(b=>b.addEventListener("click",()=>{state.flow=b.dataset.valueFlow;state.stage=0;renderFlow();sync()}));
function renderPressure(){
 const p=state.p,v=score(p);
 [["pressureDependency","dependency"],["pressureShock","shock"],["pressureSubstitute","substitute"]].forEach(([id,k])=>{$(id).value=p[k];$(id+"Value").textContent=p[k]});
 $("pressureScore").textContent=v;$("pressureMeter").style.width=v+"%";
 $("pressureInterpretation").textContent=v>=55?"当前设定下，外部依赖与冲击叠加，且替代路径不足，结构暴露相对较高。":v>=28?"当前设定下存在一定外部暴露，是否形成真实影响取决于合同、替代来源和切换成本。":"当前设定下的相对暴露较低，但低指数不等于没有风险，也不证明联系已经多元化。";
 const scenarios=[["当前设定",p.dependency,p.substitute,"current"],["增加替代路径",p.dependency,Math.min(100,p.substitute+25),""],["降低单一依赖",Math.max(0,p.dependency-20),Math.min(100,p.substitute+15),""]];
 const box=$("pressureComparisons");box.replaceChildren();
 scenarios.forEach(x=>{const n=score({dependency:x[1],shock:p.shock,substitute:x[2]}),row=document.createElement("div");row.className="pressure-bar-row "+x[3];const meta=document.createElement("div");meta.className="pressure-bar-meta";const name=document.createElement("span");name.textContent=x[0];const val=document.createElement("strong");val.textContent=n+" / 100";meta.append(name,val);const track=document.createElement("div");track.className="pressure-bar-track";const bar=document.createElement("i");bar.style.width=n+"%";track.append(bar);row.append(meta,track);box.append(row)});
 all("[data-pressure-layer]").forEach(b=>{const on=b.dataset.pressureLayer===state.layer;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});
}
["pressureDependency","pressureShock","pressureSubstitute"].forEach(id=>$(id).addEventListener("input",()=>{const k={pressureDependency:"dependency",pressureShock:"shock",pressureSubstitute:"substitute"}[id];state.p[k]=Number($(id).value);renderPressure()}));
all("[data-pressure-layer]").forEach(b=>b.addEventListener("click",()=>{state.layer=b.dataset.pressureLayer;renderPressure();sync()}));
$("pressureReset").addEventListener("click",()=>{state.p={dependency:70,shock:65,substitute:30};renderPressure()});
function renderRole(){
 const r=ROLE[state.role];$("roleTitle").textContent=r.title;$("roleDescription").textContent=r.desc;$("roleEvidence").textContent=r.evidence;
 all("[data-role]").forEach(b=>{const on=b.dataset.role===state.role;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});
}
all("[data-role]").forEach(b=>b.addEventListener("click",()=>{state.role=b.dataset.role;renderRole();sync()}));
$("roleToQuestion").addEventListener("click",()=>{const topic=state.role==="local"?"factories":"cooperation",target=document.querySelector('#questionPicker [data-topic="'+topic+'"]');if(target)target.click()});
$("saveQuestion").addEventListener("click",()=>{try{const raw=JSON.parse(localStorage.getItem("boluo-v11-region-focus")||"{}");localStorage.setItem("boluo-v11-region-focus",JSON.stringify({...raw,role:state.role,flow:state.flow,flowStage:state.stage,pressureLayer:state.layer,pressure:{...state.p,score:score(state.p)}}))}catch(e){}});
renderFlow();renderPressure();renderRole();
window.BoluoRegionLab={score:()=>score(state.p),state:()=>JSON.parse(JSON.stringify(state))};
})();