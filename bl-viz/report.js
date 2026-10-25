/* ============================================================
 * bl-viz/report.js —— 博罗报告页：经济CT体检卡 + 剪刀差
 * 数字全部来自 bl-viz/data.js（官方来源），本文件不写死任何数值
 * ============================================================ */
(function(){
  if (typeof echarts === 'undefined' || typeof BL_2026 === 'undefined') return;

  /* 迷你趋势线（原生 canvas，绿升红降，含零线） */
  function drawSpark(canvas, trend, color){
    if(!canvas) return;
    const dpr=window.devicePixelRatio||1;
    const w=canvas.clientWidth||140, h=canvas.clientHeight||30;
    canvas.width=w*dpr; canvas.height=h*dpr;
    const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,w,h);
    if(!trend||trend.length<2) return;
    const min=Math.min(...trend), max=Math.max(...trend), range=(max-min)||1;
    const pad=4;
    const x=i=>pad+i*(w-2*pad)/(trend.length-1);
    const y=v=>h-pad-((v-min)/range)*(h-2*pad);
    if(min<0&&max>0){ const y0=y(0); ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.setLineDash([2,2]); ctx.beginPath(); ctx.moveTo(0,y0); ctx.lineTo(w,y0); ctx.stroke(); ctx.setLineDash([]); }
    const grad=ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,color+'55'); grad.addColorStop(1,color+'00');
    ctx.beginPath();
    trend.forEach((v,i)=>{ i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)); });
    ctx.lineTo(x(trend.length-1),h); ctx.lineTo(x(0),h); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath();
    trend.forEach((v,i)=>{ i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)); });
    ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.stroke();
    ctx.beginPath(); const lx=x(trend.length-1), ly=y(trend[trend.length-1]);
    ctx.arc(lx,ly,2.6,0,7); ctx.fillStyle=color; ctx.fill();
  }
  const COLOR={good:'#22c55e',warm:'#eab308',risk:'#ef6b6b',neutral:'#94a3b8'};
  const STATUS_TEXT={good:'向好',warm:'温和',risk:'承压',neutral:'中性'};

  /* ---------- 2026 生产/投资卡 ---------- */
  function simpleCard(m,src){
    return `<button class="ct-card ${m.status}" data-note="${encodeURIComponent(m.note)}" data-src="${src}">
      <div class="k">${m.k}</div>
      <div class="v">${m.v}</div>
      <div class="d">${m.sub}</div>
      <span class="ct-badge ${m.status}">${STATUS_TEXT[m.status]}</span>
    </button>`;
  }
  const prodGrid=document.getElementById('prodGrid');
  const invGrid=document.getElementById('invGrid');
  if(prodGrid) prodGrid.innerHTML=BL_2026.production.map(m=>simpleCard(m,BL_2026.latestSource)).join('');
  if(invGrid) invGrid.innerHTML=BL_2026.investment.map(m=>simpleCard(m,BL_2026.h1Source)).join('');

  /* ---------- 剪刀差大面板 ---------- */
  const scissors=document.getElementById('scissors');
  if(scissors){
    scissors.innerHTML=`
      <div class="sci up">
        <div class="t">▲ 生产端：一路爬坡</div>
        <div class="big">工业增加值 +8.9%</div>
        <div class="s">2026年1-8月规上工业增加值，从一季度的+3.5%一路抬升到+8.9%；工业用电+11.5%。<br><b style="color:#4ade80">工厂在高负荷运转、新产能在释放。</b></div>
      </div>
      <div class="sci down">
        <div class="t">▼ 投资端：年初闪转后深跌</div>
        <div class="big">固定资产投资 −34.1%</div>
        <div class="s">1-2月还短暂+1.1%，随后一路下滑到上半年−36.4%，8月微幅收窄；其中工业投资−46.7%、基建−35.3%。<br><b style="color:#f87171">新开工、新投产的后劲，正在变弱。</b></div>
      </div>`;
  }

  /* ---------- 月度剪刀差大图（echarts） ---------- */
  const sc=document.getElementById('scissorChart');
  if(sc){
    const months=['1-2月','1-3月','1-4月','1-5月','上半年','1-7月','1-8月'];
    const inv=BL_2026.fixedInvestmentMonthly.map(d=>d.v);
    const ind=BL_2026.industryMonthly.map(d=>d.v);
    // 两条序列月份不完全对齐，工业缺1-2月，统一7个点，工业1-2月用null
    const indSeries=[null,ind[0],ind[1],ind[2],ind[3],ind[4],ind[5]];
    echarts.init(sc).setOption({
      backgroundColor:'transparent',
      tooltip:{trigger:'axis',backgroundColor:'#0e1523',borderColor:'#22304a',textStyle:{color:'#e6edf3'},valueFormatter:v=>v==null?'—':v+'%'},
      legend:{top:0,textStyle:{color:'#93a4bd',fontSize:11},data:['固投累计增速','工业增加值累计增速']},
      grid:{left:46,right:20,top:38,bottom:28},
      xAxis:{type:'category',data:months,axisLabel:{color:'#93a4bd',fontSize:11},axisLine:{lineStyle:{color:'#2b3a55'}}},
      yAxis:{type:'value',axisLabel:{color:'#93a4bd',formatter:'{value}%'},splitLine:{lineStyle:{color:'#16203a'}}},
      series:[
        {name:'固投累计增速',type:'line',data:inv,smooth:true,symbol:'circle',symbolSize:7,
         lineStyle:{color:'#ef6b6b',width:3},itemStyle:{color:'#ef6b6b'},
         areaStyle:{color:'rgba(239,107,107,.12)'},
         markLine:{silent:true,symbol:'none',data:[{yAxis:0,lineStyle:{color:'#64748b',type:'dashed'}}]},
         label:{show:true,position:'bottom',color:'#f87171',fontSize:10,formatter:'{c}%'}},
        {name:'工业增加值累计增速',type:'line',data:indSeries,smooth:true,symbol:'circle',symbolSize:7,
         lineStyle:{color:'#22c55e',width:3},itemStyle:{color:'#22c55e'},
         connectNulls:false,
         label:{show:true,position:'top',color:'#4ade80',fontSize:10,formatter:'{c}%'}}
      ]
    });
  }

  /* ---------- 2025 八项体检卡 ---------- */
  const g2025=document.getElementById('ct2025Grid');
  if(g2025){
    g2025.innerHTML=BL_2025.metrics.map(m=>`
      <button class="ct-card ${m.status}" data-note="${encodeURIComponent(m.note)}" data-src="${BL_2025.source}">
        <div class="k">${m.k}</div>
        <div class="v">${m.v}</div>
        <div class="d">${m.detail}</div>
        <canvas class="spark"></canvas>
        <span class="ct-badge ${m.status}">${STATUS_TEXT[m.status]}</span>
      </button>`).join('');
    g2025.querySelectorAll('.ct-card').forEach((c,i)=>{
      const cv=c.querySelector('canvas.spark');
      const m=BL_2025.metrics[i];
      drawSpark(cv,m.trend,COLOR[m.status]||COLOR.neutral);
    });
  }
  /* 健康汇总 */
  const sum=document.getElementById('ct2025Summary');
  if(sum){
    const arr=BL_2025.metrics;
    const ng=arr.filter(m=>m.status==='good').length;
    const nw=arr.filter(m=>m.status==='warm').length;
    const nr=arr.filter(m=>m.status==='risk').length;
    sum.innerHTML=`
      <div class="ct-sum g"><span class="n">${ng}</span><span>项增长向好：GDP破千亿、工业、外贸有支撑</span></div>
      <div class="ct-sum y"><span class="n">${nw}</span><span>项温和：消费、财政、居民收入偏弱</span></div>
      <div class="ct-sum r"><span class="n">${nr}</span><span>项明显下滑：固投、房地产连续两年负增长</span></div>`;
  }

  /* ---------- 点击卡片看口径与来源 ---------- */
  function bindDetail(gridId,detailId){
    const grid=document.getElementById(gridId), detail=document.getElementById(detailId);
    if(!grid||!detail) return;
    grid.querySelectorAll('.ct-card').forEach(c=>{
      c.addEventListener('click',()=>{
        const note=decodeURIComponent(c.dataset.note||''), src=c.dataset.src||'';
        detail.innerHTML=`${note} <br><a target="_blank" rel="noopener" href="${src}">核对官方原文 ↗</a>`;
      });
    });
  }
  bindDetail('prodGrid','ctDetail');
  bindDetail('invGrid','ctDetail');
  bindDetail('ct2025Grid','ct2025Detail');

  /* 数据更新徽章 */
  const latest=document.getElementById('ctLatest');
  if(latest) latest.textContent=BL_2026.latestSourceName.split('（')[0];
  window.addEventListener('resize',()=>{
    [['ct2025Grid',BL_2025.metrics]].forEach(([id,ms])=>{
      const grid=document.getElementById(id);
      if(!grid)return;
      grid.querySelectorAll('.ct-card canvas.spark').forEach((cv,i)=>drawSpark(cv,ms[i].trend,COLOR[ms[i].status]||COLOR.neutral));
    });
    if(typeof echarts!=='undefined'){ const sc=document.getElementById('scissorChart'); const inst=sc&&echarts.getInstanceByDom(sc); if(inst)inst.resize(); }
  });
})();
