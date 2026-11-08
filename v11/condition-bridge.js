/* Page 07: public-facing condition comparison. Only consumes existing result summaries. */
(()=>{"use strict";
 const $=id=>document.getElementById(id);
 const notes={
  delay:"核验真实项目的开工、设备安装与投产日期；施工进展不等于实际产出。",
  invest:"核验工业投资变化来自哪些项目阶段，不能把投资降幅直接当成GDP降幅。",
  orders:"核验本地企业是否真的获得或失去采购订单；邻近不等于交易关系。",
  traffic:"核验通勤时耗、关键岗位招聘和服务可达性；拥堵不等于可直接估计的GDP损失。"
 };
 function paint(details){
  const r=details?.results||window.BoluoWind?.getDistributions?.();
  const st=window.BoluoWind?.getState?.();
  if(!r?.base?.p50||!st)return;
  const delta=r.stress.p50-r.base.p50;
  const fmt=v=>Math.round(Math.abs(v)).toLocaleString("zh-CN");
  $("conditionDelta").textContent=(delta>0?"+":delta<0?"−":"") + fmt(delta) +"亿元";
  $("conditionRange").textContent="当前区间 P10—P90："+fmt(r.stress.p10)+"—"+fmt(r.stress.p90)+"亿元";
  $("conditionQuestion").textContent=notes[st.shock]||"核验相关实际条件，再比较结果。";
  const dest=new URL("./insights.html",location.href);
  const u=new URL(location.href);
  for(const k of ["bs","bv","n","line","view","bp0","bp1","bp2","bp3","bp4"])if(u.searchParams.has(k))dest.searchParams.set(k,u.searchParams.get(k));
  dest.searchParams.set("shock",st.shock);
  dest.searchParams.set("severity",String(Math.round(st.strength*70)));
  $("conditionToEight").href=dest.href;
 }
 window.addEventListener("boluo:wind-run",e=>paint(e.detail));
 paint();
})();
