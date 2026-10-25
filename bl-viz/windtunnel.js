/* ============================================================
 * bl-viz/windtunnel.js —— 博罗风洞：现实压力测试
 * 受控场景（BL_SCENES）用同一粒种子真实重跑，不与下面的参数
 * 敏感性滑块混为一谈；分布用 model.js 返回的 results 现算。
 * ============================================================ */
(function(){
  if (typeof BL_SCENES === 'undefined' || typeof HT === 'undefined') return;

  const META = {
    base:       {cls:'base', hitColor:'#22c55e'},
    upside:     {cls:'good', hitColor:'#22c55e'},
    property:   {cls:'warm', hitColor:'#eab308'},
    investment: {cls:'bad',  hitColor:'#ef6b6b'},
    combined:   {cls:'bad',  hitColor:'#ef6b6b'},
    trend:      {cls:'bad',  hitColor:'#ef6b6b'}
  };
  const ORDER=['base','investment','property','combined','trend','upside'];
  let key = blInitialScene();

  const grid=document.getElementById('pressGrid');
  if(!grid) return;

  grid.innerHTML=ORDER.map(k=>{
    const d=blStateLabels(k), m=META[k];
    return `<button class="ptile ${m.cls}" data-key="${k}">
      <div class="pn">${BL_SCENES[k].name}</div>
      <div class="pd">${BL_SCENES[k].desc}</div>
      <div class="ph">${d.hit}</div>
      <div class="ps">达标率 · 中位 ${d.p50}亿</div>
    </button>`;
  }).join('');

  /* 用 results 数组算分箱密度 */
  function histogram(results, min, max, bins){
    const step=(max-min)/bins, arr=new Array(bins).fill(0);
    for(const v of results){
      let i=Math.floor((v-min)/step);
      if(i>=0&&i<bins) arr[i]++;
    }
    const peak=Math.max(...arr,1);
    return arr.map(n=>n/peak);
  }

  function drawDist(canvas, base, scene, sceneColor){
    const dpr=window.devicePixelRatio||1;
    const w=canvas.clientWidth||360, h=canvas.clientHeight||250;
    canvas.width=w*dpr; canvas.height=h*dpr;
    const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,w,h);
    const min=1150,max=1900,bins=46, padL=8,padR=8,padT=14,padB=22;
    const pw=w-padL-padR, ph=h-padT-padB;
    const x=v=>padL+(v-min)/(max-min)*pw;
    const step=(max-min)/bins;
    function area(results,color,fill){
      const dens=histogram(results,min,max,bins);
      ctx.beginPath();
      dens.forEach((d,i)=>{
        const cx=padL+(i+0.5)*pw/bins, cy=padT+ph*(1-d*0.92);
        i?ctx.lineTo(cx,cy):ctx.moveTo(cx,cy);
      });
      ctx.lineTo(padL+pw,padT+ph); ctx.lineTo(padL,padT+ph); ctx.closePath();
      ctx.fillStyle=fill; ctx.fill();
      ctx.beginPath();
      dens.forEach((d,i)=>{
        const cx=padL+(i+0.5)*pw/bins, cy=padT+ph*(1-d*0.92);
        i?ctx.lineTo(cx,cy):ctx.moveTo(cx,cy);
      });
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
    }
    // 基准灰
    area(base.results,'#64748b','rgba(100,116,139,.14)');
    // 情景彩色
    area(scene.results,sceneColor,sceneColor+'2e');
    // 目标线 1600
    const tx=x(HT.TARGET);
    ctx.setLineDash([5,4]); ctx.strokeStyle='#fbbf24'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(tx,padT); ctx.lineTo(tx,padT+ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#fbbf24'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('1600亿目标',tx,padT-3);
    // 中位标记
    function medianLine(results,color){
      const m=results[Math.floor(results.length/2)];
      const mx=x(m);
      ctx.setLineDash([2,3]); ctx.strokeStyle=color; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(mx,padT+ph); ctx.lineTo(mx,padT+ph*0.25); ctx.stroke(); ctx.setLineDash([]);
    }
    medianLine(base.results,'#94a3b8');
    medianLine(scene.results,sceneColor);
    // 轴标
    ctx.fillStyle='#6b7d96'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText(min+'亿',padL,h-6); ctx.textAlign='right'; ctx.fillText(max+'亿',padL+pw,h-6);
  }

  function render(){
    const scene=blRunScene(key), base=blRunScene('base');
    const d=blStateLabels(key), m=META[key];
    grid.querySelectorAll('.ptile').forEach(t=>t.classList.toggle('sel',t.dataset.key===key));
    document.getElementById('pressName').textContent=BL_SCENES[key].name;
    document.getElementById('pressDesc').textContent=BL_SCENES[key].desc;
    // 达标率条
    const hitFill=document.getElementById('hitFill');
    hitFill.style.width=Math.max(2,scene.hit)+'%';
    hitFill.style.background=m.hitColor;
    document.getElementById('hitNum').textContent=scene.hit.toFixed(1)+'%';
    document.getElementById('hitNum').style.color=m.hitColor;
    // 中位条（1150-1900 映射到0-100）
    const pct=(scene.p50-1150)/(1900-1150)*100;
    const p50Fill=document.getElementById('p50Fill');
    p50Fill.style.width=Math.max(2,Math.min(100,pct))+'%';
    p50Fill.style.background='#3b82f6';
    document.getElementById('p50Num').textContent=blFmt(scene.p50)+'亿';
    // 对比
    const dh=scene.hit-base.hit, dp=scene.p50-base.p50;
    const cmp=document.getElementById('pressCompare');
    if(key==='base'){
      cmp.innerHTML=`基准情景（规划兑现）：<b style="color:#22c55e">达标率约 ${scene.hit.toFixed(1)}%</b>，2030 中位约 <b style="color:#60a5fa">${blFmt(scene.p50)}亿</b>，区间 P10–P90 为 ${blFmt(scene.p10)}–${blFmt(scene.p90)}亿。<br>目标跳一跳够得到，但下面的压力情景会告诉你：哪一环掉链子，1600亿就会滑走。`;
    } else {
      const sign=v=>v>0?'+':'';
      cmp.innerHTML=`相比基准：达标率 <b style="color:${dh<0?'#ef6b6b':'#22c55e'}">${sign(dh)}${dh.toFixed(1)} 个百分点</b>，中位 GDP <b style="color:${dp<0?'#ef6b6b':'#22c55e'}">${sign(dp)}${blFmt(dp)}亿</b>；P10–P90 为 ${blFmt(scene.p10)}–${blFmt(scene.p90)}亿。`;
    }
    // 现实苗头
    const sb=document.getElementById('sproutBox');
    if(BL_SCENES[key].sprout){
      sb.style.display='block';
      document.getElementById('sproutText').textContent=BL_SCENES[key].sprout;
    } else {
      sb.style.display='none';
    }
    // 分布图
    drawDist(document.getElementById('pressCanvas'), base, scene, m.hitColor);
    blSaveScene(key);
  }

  grid.querySelectorAll('.ptile').forEach(t=>{
    t.addEventListener('click',()=>{ key=t.dataset.key; render(); });
  });
  render();
  window.addEventListener('resize',()=>render());
})();
