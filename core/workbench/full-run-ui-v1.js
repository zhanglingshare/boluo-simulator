/* Read-only composition UI added to the existing unified workbench.
   All units and evidence boundaries remain visible. */
(function(){
"use strict";
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shell=document.createElement("section");shell.id="boluoFullRunPanel";shell.className="panel";shell.style.marginTop="16px";
shell.innerHTML='<div class="ey">ONE SCENARIO / ELEVEN CALCULATIONS</div><h2 style="font-size:23px;color:var(--gold)">05 · 全模型联合运行</h2><p>这不是12张互相割裂的页面：一次运行为11类研究计算建立共同数据指纹和可追溯档案。源自公开信息的观察与合成情景分开呈现。</p><div class="cards" id="fullCards"><div class="card"><small>已运行环节</small><strong id="fullModuleCount">—</strong></div><div class="card"><small>合成企业 / 关系网络</small><strong id="fullDataCount">—</strong></div><div class="card"><small>合成问卷路径估计</small><strong id="fullPlsCount">—</strong></div></div><p style="margin-top:14px"><button id="fullRunButton">▶ 运行全部11个模块</button> <button id="fullExportButton" style="background:#173a48;color:#b4e1e6;border-color:#567886">下载完整运行档案</button> <button id="fullToCareer" style="background:#173a48;color:#b4e1e6;border-color:#567886">送到 V12 经理模式</button></p><p id="fullRunStatus" class="tips" role="status">准备执行。</p><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:12px" id="fullResults"></div><div id="fullEvidence" class="tips" style="margin-top:14px"></div>';
const footer=document.querySelector("footer");if(footer)footer.before(shell);else document.querySelector("main").append(shell);
const btn=$("fullRunButton"),exportButton=$("fullExportButton"),career=$("fullToCareer");
let latest=null;
const box=(title,body)=>'<article class="card" style="min-height:180px"><h2>'+title+'</h2>'+body+'</article>';
const fact=(label,value,unit)=>'<div style="display:flex;justify-content:space-between;border-bottom:1px solid #304759;padding:5px 0;font-size:12px"><span>'+label+'</span><b style="color:#f0d28c">'+value+'</b><small>'+unit+'</small></div>';
const renderPolyline=(arr,stress)=>{const x=(i)=>23+i*(275/(arr.length-1)),values=[...arr,...stress].map(x=>x.gdp),lo=Math.min(...values)*.97,hi=Math.max(...values)*1.03,y=(v)=>130-(v-lo)/(hi-lo)*112;return '<svg style="width:100%;height:165px" viewBox="0 0 322 165" role="img" aria-label="2025至2032两种合成情景中位数轨迹"><line x1="20" y1="138" x2="305" y2="138" stroke="#8ca6b9"/><polyline points="'+arr.map((p,i)=>x(i)+','+y(p.gdp)).join(' ')+'" stroke="#f2c880" fill="none" stroke-width="2.5"/><polyline points="'+stress.map((p,i)=>x(i)+','+y(p.gdp)).join(' ')+'" stroke="#6bded4" fill="none" stroke-width="2.5"/><text x="20" y="156" fill="#aac2cd" font-size="11">2025</text><text x="269" y="156" fill="#aac2cd" font-size="11">2032</text><text x="20" y="15" fill="#f2c880" font-size="11">基准</text><text x="75" y="15" fill="#6bded4" font-size="11">压力假设</text></svg>'};
const tally=(r)=>{
 const h=r.macro,s=r.sensitivity,p=r.path,n=r.relationship;
 const exp=r.enterprise,arr=h.baseline.yearly,st=h.assumedPressure.yearly;
 const coefs=Object.entries(p.paths||{}).map(([key,value])=>fact(esc(key),Number(value).toFixed(3),"合成路径系数")).slice(0,6).join("");
 const hotspots=n.hotspots.map(x=>fact(esc(x.id),x.impact.toFixed(1),"压力指数")).join("");
 const sens=s.rows.slice(0,5).map(x=>fact(esc(x.label),x.low.toFixed(1)+" / "+x.high.toFixed(1),"亿元(情景差)")).join("");
 const groups=exp.groups.map(x=>fact(esc(x.name),Number(x.score).toFixed(1),"合成分")).join("");
 $("fullModuleCount").textContent=r.modules.length+" / 11";
 $("fullDataCount").textContent=r.quality.counts.enterprises+" / "+r.relationship.edges;
 $("fullPlsCount").textContent=p.n+"份";
 $("fullResults").innerHTML=
 box("Ⅰ 公开观测 · 真值锚点",r.public.records.map(x=>fact(x.year+" "+x.period,Number(x.gdp).toFixed(2),"亿元 GDP")).join("")+'<p class="tips">2026是累计期；不能与2025全年直接相比。</p>')+
 box("Ⅱ 项目兑现 · 合成项目",fact("模拟项目",r.project.total,"宗")+fact("延期主体",r.project.schedule.delayed,"宗")+fact("跨过2032边界",r.project.schedule.crossed2032,"宗")+'<p class="tips">移动计划投产年份，不等于新增GDP损失。</p>')+
 box("Ⅲ 宏观情景 · 同种子模拟",renderPolyline(arr,st)+fact("2032中位数 基准",h.baseline.p50,"亿元")+fact("2032中位数 压力",h.assumedPressure.p50,"亿元")+fact("P10–P90 基准",h.baseline.p10+"–"+h.baseline.p90,"亿元"))+
 box("Ⅳ 产业结构 · 增加值口径",h.baseline.shares.map(x=>fact(({primary:"第一产业",secondary:"第二产业",tertiary:"第三产业"})[x.sector],x.p50.toFixed(1),"%")).join("")+'<p class="tips">这里只展示增加值结构，绝不替代2032总产出布局研究目标。</p>')+
 box("Ⅴ 企业球探 · V13 真实函数",'<p>选取合成制造企业 '+esc(exp.id)+'；原V13生成36项战术指标。</p>'+groups)+
 box("Ⅵ 有向产业网络 · 三步传导",fact("合成节点",n.nodes,"家")+fact("关系边",n.edges,"条")+fact("触达主体",n.affected,"个")+hotspots+'<p class="tips">受影响量为抽象传播指标，不是企业损失率。</p>')+
 box("Ⅶ 市场与约束 · 合成劳动者",fact("样本",r.talent.count,"人")+fact("平均通勤",r.talent.meanCommute,"分钟")+fact("高技能缺口占比",(r.talent.highSkillGapFraction*100).toFixed(1),"%")+'<p class="tips">不代表博罗真实就业和通勤调查。</p>')+
 box("Ⅷ 敏感性 · 旧模型再计算",sens+'<p class="tips">每次重跑宏观引擎；非政策因果效应。</p>')+
 box("Ⅸ 调查结构 · 探索PLS",fact("合成问卷",p.n,"份")+fact("重抽样次数",p.bootstrap,"次")+coefs+'<p class="tips">不等同SmartPLS认证，不支持现实因果推断。</p>')+
 box("Ⅹ 经营轨迹 · Coach V11",fact("起始能力指数",r.coach.scoreStart,"分")+fact("28季度中位数",r.coach.p50,"分")+fact("P10–P90",r.coach.p10+"–"+r.coach.p90,"分")+'<p class="tips">这是V11独立代理，不是依赖league状态的V12 careerTick。</p>')+
 box("Ⅺ 结构盲点与核验任务",r.blindspots.slice(0,5).map(x=>'<p class="tips"><b>'+esc(x.title)+'</b>：'+esc(x.next)+'</p>').join(""))+
 box("贯穿全程 · 不可比边界",'<p class="tips">宏观增加值 ≠ 企业营收 ≠ 工业总产值 ≠ 能力分数。</p><p class="tips">项目延期、企业关系、SEM路径目前没有实证参数可直接换算GDP。</p><p class="tips">状态：演示计算完成；因果校准和真实部门接口未完成。</p>');
 $("fullEvidence").innerHTML='<b>数据指纹：</b><code>'+esc(r.fingerprint)+'</code>　<b>随机种子：</b>'+r.seed+'　<b>计算环节：</b>'+r.modules.map(x=>esc(x.id)).join(" · ")+
 '<p>公开统计来源：'+r.public.records.map(x=>'<a href="'+esc(x.source)+'" target="_blank" rel="noopener">'+x.year+' '+esc(x.period)+'</a>').join(' · ')+'</p>';
};
async function start(){
 btn.disabled=true;$("fullRunStatus").textContent="正在使用原有引擎计算 11 个模块……";
 await new Promise(r=>setTimeout(r,20));
 try{
  const publicData=await(await fetch("../data/boluo-public-anchors-2026.v1.json")).json();
  const o={seed:20261120,trials:+$("draws").value,delay:+$("delay").value,
    affectedPct:+$("affected").value,proxy:+$("proxy").value,sourceShock:.35,bootstrap:60,
    scenarioId:"BL-FULL-DEMO-20261120"};
  latest=BoluoFullRun.run(o,{Core:BoluoCore,Engine:BoluoEngine,
     Bridge:BoluoProjectBridge,Attributes:BoluoEnterpriseAttributes,Coach:BoluoCoachCore},publicData);
  tally(latest);$("fullRunStatus").textContent="✓ 全链执行成功。原始模型未改动，数据快照和固定种子已记录。";
 }catch(error){console.error(error);$("fullRunStatus").textContent="✕ 全链执行失败："+error.message}
 finally{btn.disabled=false}
}
btn.onclick=start;exportButton.onclick=()=>{
 if(!latest){$("fullRunStatus").textContent="请先运行全部模块";return;}
 const blob=new Blob([JSON.stringify(latest,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="boluo-full-run-demo-v1.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
career.onclick=()=>{
 if(!latest){$("fullRunStatus").textContent="请先运行全链";return;}
 const handoff={schema:"boluo-v12-independent-handoff/1",scenario_id:latest.scenario_id,
    seed:latest.seed,dataset_fingerprint:latest.fingerprint,delay:latest.assumptions.delay,
    evidence_mode:"demo",warning:"V12's own synthetic manager state; not the 830 synthetic enterprise dataset"};
 sessionStorage.setItem("boluo-full-v12-handoff-v1",JSON.stringify(handoff));
 location.href="../../v11/internal/league.html#season";
};
start();
})();
