(function page2ChartsEnhance() {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const num = (s) => Number(String(s).replace("−", "-").replace(/[^0-9.+-]/g, ""));
  const fmt = (n) => (n > 0 ? "+" : "") + n.toFixed(1) + "%";
  const pct = (n, a, b) => (n - a) / (b - a) * 100;
  const axis = (v, min, max) => 168 + pct(v, min, max) / 100 * 625;
  const svgWrap = (inner, title) =>
    `<svg viewBox="0 0 840 230" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  function plotGoal(focus) {
    const d = focus === "life"
      ? [["社会消费品零售", 4.5, 5.5, null, "全年目标 / 1—5月累计"]]
      : [["GDP增长", 6.5, 4.0, 7, "全年目标 / 一季度累计"], ["规上工业增加值", 9, 3.5, null, "全年目标(≥9%) / 一季度累计"]];
    let s = `<text x="168" y="15" class="p-axis">统一刻度：同比增长 0—12%；统计期不同</text>`;
    [0, 3, 6, 9, 12].forEach(v => {
      const x = axis(v, 0, 12);
      s += `<line x1="${x}" x2="${x}" y1="26" y2="205" class="p-grid"/><text x="${x}" y="222" text-anchor="middle" class="p-axis">${v}%</text>`;
    });
    d.forEach((x, i) => {
      const [label, target, actual, targetMax, time] = x;
      const y = d.length === 1 ? 104 : 68 + 100 * i, rx = axis(actual, 0, 12), tx = axis(target, 0, 12);
      s += `<text x="10" y="${y-20}" class="p-name">${label}</text><text x="10" y="${y-4}" class="p-axis">${time}</text>`;
      s += `<rect x="168" y="${y-13}" width="625" height="17" rx="8" fill="#e5eff9"/>`;
      s += `<rect x="168" y="${y-13}" width="${rx-168}" height="17" rx="8" class="p-actual"/>`;
      if (targetMax) {
        s += `<rect x="${tx}" y="${y-20}" width="${axis(targetMax,0,12)-tx}" height="30" rx="3" class="p-target"/>`;
      } else {
        s += `<line x1="${tx}" x2="${tx}" y1="${y-22}" y2="${y+13}" stroke="#2d8ae2" stroke-width="4" stroke-dasharray="4 3"/>`;
      }
      s += `<text x="${Math.min(780,rx+10)}" y="${y+1}" class="p-number">${actual.toFixed(1)}%</text>`;
      s += `<text x="${tx}" y="${y-28}" text-anchor="middle" class="p-name">${targetMax?target+"—"+targetMax:(target>=9?"≥":"")+target}%</text>`;
    });
    const mobile = d.map(([label,target,actual,targetMax,time]) => {
      const tw = targetMax ? (targetMax - target) / 12 * 100 : .5;
      return `<div class="p-mobile-row"><div class="p-mobile-head"><b>${label}</b><small>${time}</small></div><div class="p-mobile-rail"><i class="p-mobile-actual" style="width:${actual/12*100}%"></i><i class="p-mobile-target" style="left:${target/12*100}%;width:${tw}%"></i></div><div class="p-mobile-values"><b>${actual.toFixed(1)}% 阶段值</b><span>${targetMax?target+"—"+targetMax:(target>=9?"≥":"")+target}% 全年目标</span></div></div>`;
    }).join("");
    return {svg: svgWrap(s, "年度目标与阶段实际增长率对照，不同统计期不能视作目标完成率"),
      mobile,legend:"<b>■</b> 深蓝：阶段实际　 <em>▯</em> 浅蓝：年度目标 · 不同统计期，仅供参照"};
  }
  function plotHistory(focus) {
    const vals = focus === "life" ? [3.5, 4.3, 5.5] : [3.5, 3.7, 4.0];
    const labels = ["一季度累计", "1—4月累计", "1—5月累计"];
    let s = `<text x="18" y="15" class="p-axis">三个年初至当期的累计同比观测点，不代表当月增速</text>`;
    [0,2,4,6,8].forEach(v => {
      const y=192-v/8*149;
      s+=`<line x1="120" x2="793" y1="${y}" y2="${y}" class="p-grid"/><text x="98" y="${y+4}" text-anchor="end" class="p-axis">${v}%</text>`;
    });
    vals.forEach((v,i)=>{
      const x=198+i*264,y=192-v/8*149;
      s+=`<rect x="${x-28}" y="${y}" width="56" height="${192-y}" rx="6" class="p-actual"/><text x="${x}" y="${y-11}" text-anchor="middle" class="p-number">${fmt(v)}</text><text x="${x}" y="217" text-anchor="middle" class="p-name">${labels[i]}</text>`;
    });
    const mobile=`<div class="p-mobile-history">${vals.map((v,i)=>`<div><b>${fmt(v)}</b><div class="p-mobile-column"><i style="height:${v/8*100}%"></i></div><small>${labels[i]}</small></div>`).join("")}</div>`;
    return {svg:svgWrap(s,"累计同比增速的三个离散观测值，非单月数据"),mobile,legend:"<b>■</b> 蓝柱：不同累计窗口的观测值 · 不能推断单月走势"};
  }
  function plotMechanism(focus) {
    const d=focus==="life" ? [["社会消费品零售",5.5],["限上住宿业", -15.1],["限上餐饮业",1.3]] :
      [["工业投资",-33.2],["规上工业增加值",3.5],["工业用电量",10.3]];
    const zero=axis(0,-40,20);
    let s=`<text x="18" y="15" class="p-axis">同一统计期的不同指标 · 共用同比增速刻度，仅对照方向</text>`;
    [-40,-20,0,10,20].forEach(v=>{const x=axis(v,-40,20);s+=`<line x1="${x}" x2="${x}" y1="29" y2="207" class="${v===0?"p-zero":"p-grid"}"/><text x="${x}" y="225" text-anchor="middle" class="p-axis">${v}%</text>`});
    d.forEach(([name,v],i)=>{
      const y=60+i*63,x=axis(v,-40,20),left=Math.min(zero,x),w=Math.abs(x-zero);
      s+=`<text x="12" y="${y-11}" class="p-name">${name}</text><rect x="${left}" y="${y-14}" width="${w}" height="23" rx="5" class="${v<0?"p-negative":"p-actual"}"/><text x="${v<0?x-10:x+10}" y="${y+2}" text-anchor="${v<0?"end":"start"}" class="p-number">${fmt(v)}</text>`;
    });
    const mobile=d.map(([label,v])=>{
      const width=Math.abs(v)/60*100;const left=v<0?(2/3*100-width):(2/3*100);
      return `<div class="p-mobile-row"><div class="p-mobile-head"><b>${label}</b><strong>${fmt(v)}</strong></div><div class="p-mobile-diverge"><i class="${v<0?"p-left":""}" style="left:${left}%;width:${width}%"></i></div></div>`;
    }).join("");
    return {svg:svgWrap(s,"同比变化零轴对冲图，不同经济指标不做相减或因果推断"),mobile,legend:"<b>■</b> 深蓝：同比增长　 <em>■</em> 灰蓝：同比下降 · 不同指标不能相减"};
  }
  function miniPair(left,right) {
    const l=num(left),r=num(right);
    const x=v=>24+pct(v,-40,30)/100*251,z=x(0);
    let s=`<line x1="${z}" x2="${z}" y1="3" y2="63" class="p-zero"/>`;
    [l,r].forEach((v,i)=>{
      const xx=x(v),a=Math.min(z,xx),w=Math.abs(z-xx),y=8+i*29;
      s+=`<rect x="${a}" y="${y}" width="${w}" height="17" rx="4" class="${v<0?"p-negative":"p-actual"}"/><text x="${v<0?xx-5:xx+5}" y="${y+12}" text-anchor="${v<0?"end":"start"}" class="p-smallnum">${fmt(v)}</text>`;
    });
    return `<div class="p-mini"><svg viewBox="0 0 300 70" role="img" aria-label="两项指标零轴同比增速对冲，不可直接相减">${s}</svg><span>统一−40%至+30%刻度 · 只看方向</span></div>`;
  }
  function unknownMini(kind) {
    const left=kind==="projects"?"计划项目数":"已知事实",right=kind==="projects"?"实际投产待核":"可比指标待核";
    return `<div class="p-unknown"><span>${left}</span><span class="p-arrow">→</span><span>${right}</span><small>缺少同口径进度，拒绝虚构完成率</small></div>`;
  }
  function smallMultiples(el) {
    const facts=[...el.querySelectorAll(".rowfact")];
    const percentages=facts.map(row=>{
      const left=row.querySelector("span")?.textContent.trim()||"";
      const val=row.querySelector("b")?.textContent.trim().split(/\s/)[0]||"";
      if(!/^[+−-]\d+(?:\.\d+)?%$/.test(val))return null;
      return {label:left,val,v:num(val)};
    }).filter(Boolean).slice(0,4);
    if(!percentages.length)return;
    const items=percentages.map(x=>{
      const width=Math.min(50,Math.abs(x.v)/45*50);
      return `<div class="p-multiple-line"><span>${x.label}</span><div class="p-track"><i class="${x.v<0?"negative":""}" style="${x.v<0?"right":"left"}:50%;width:${width}%"></i></div><b>${x.val}</b></div>`;
    }).join("");
    const area=document.createElement("div");area.className="p-multiples";area.innerHTML=items+"<small>共用 −45%至+45% 的同比刻度；指标口径各异</small>";
    el.prepend(area);
  }
  function refresh() {
    const chart=$("#bars");if(!chart)return;
    const ref=$('[data-ref][aria-pressed="true"]')?.dataset.ref||"plan";
    const focus=$('[data-focus][aria-pressed="true"]')?.dataset.focus||"economy";
    const result=ref==="plan"?plotGoal(focus):ref==="history"?plotHistory(focus):plotMechanism(focus);
    chart.className="bars p-rich-charts";
    chart.innerHTML=`<div class="p-svg">${result.svg}</div><div class="p-mobile">${result.mobile}</div><div class="p-legend">${result.legend}</div>`;
    const obs=[...document.querySelectorAll(".obcard")];
    obs.forEach((card,i)=>{
      const old=card.querySelector(".thin-track");if(!old)return;
      const nums=[...card.querySelectorAll(".duo .large")].map(e=>e.textContent.trim());
      const meta=card.querySelector(".obmeta")?.textContent||"";
      const comparable=nums.every(v=>/^[+−-]\d+(\.\d+)?%$/.test(v));
      old.outerHTML=comparable?miniPair(nums[0],nums[1]):unknownMini(meta.includes("项目")||nums[0].includes("171")?"projects":"other");
    });
    document.querySelectorAll("details.industry .industry-content").forEach(el=>{
      if(!el.querySelector(".p-multiples"))smallMultiples(el);
    });
    document.querySelectorAll("#actualMetrics .val").forEach((el,i)=>{
      if(!/^([+−-])?\d+(?:\.\d+)?%$/.test(el.textContent.trim()))return;
      el.classList.add("p-emphasized");
    });
  }
  refresh();
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-ref],[data-focus],[data-track]")){
      requestAnimationFrame(()=>refresh());
    }
  });
})();