(() => {
 'use strict';
 const D=window.BoluoDiscoveryData,C=window.BoluoDiscovery,M=window.RiskMotion;
 const $=id=>document.getElementById(id),names=Object.keys(D.topics),narrow=matchMedia('(max-width:600px)');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=name=>'<svg aria-hidden="true"><use href="#icon-'+name+'"/></svg>';
 const number=(value,digits=1)=>Math.abs(value).toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits});
 const text=(id,value)=>{$(id).textContent=value;};
 const params=new URLSearchParams(location.search),incoming=C.context(params),shared=params.get('share')==='1';
 const state={...incoming,inquiry:shared?'':incoming.inquiry,feedTopic:incoming.town?incoming.topic:'all',expanded:!!incoming.town,related:incoming.event||'',invitation:shared?incoming:null};
 let saved=[];try{saved=C.parseSaved(localStorage.getItem(C.savedKey));}catch{}
 let playFrame=0,playStarted=0,playElapsed=0,playing=false,playFinished=true,phase=-1,toastTimer=0,restoreFocus=null,dialogContext=null,firstRender=true;
 const snapshot=()=>C.context(new URLSearchParams({topic:state.topic,inquiry:state.inquiry,town:state.town,event:state.related||''}));
 const topic=()=>D.topics[state.topic];
 function metricMarkup(metric){
  const value=metric.text?escape(metric.text):(metric.value<0?'−':metric.prefix||'')+number(metric.value,metric.digits||0)+'<span>'+escape(metric.unit)+'</span>';
  return '<button class="hero-metric" type="button" data-source="'+topic().source+'" aria-label="查看'+escape(metric.label)+'的资料口径"><span>'+escape(metric.label)+'</span><strong class="'+metric.color+(metric.text?' metric-word':'')+'">'+value+'</strong></button>';
 }
 function growRect(x,y,width,height,color,zero,negative=false){
  return '<rect class="animated-bar" data-full-width="'+width+'" data-zero="'+zero+'" data-negative="'+negative+'" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="3" fill="'+color+'"/>';
 }
 function compareChart(food=false){
  const w=narrow.matches?470:660,h=180,left=narrow.matches?121:157,right=w-24,min=food?0:-50,max=food?12:20,x=v=>left+(v-min)/(max-min)*(right-left),zero=x(0);
  const rows=food?[['限上餐饮',9.8,'#1369eb'],['限上住宿',1.6,'#23a3a7']]:[['工业增加值',8.9,'#1369eb'],['工业投资',-44.7,'#ed665e']];
  let svg='<svg class="data-svg" viewBox="0 0 '+w+' '+h+'" role="group" aria-label="'+(food?'限上餐饮和住宿营业额同比比较':'工业增加值和工业投资同比对比')+'">';
  const ticks=food?[0,3,6,9,12]:[-50,-40,-30,-20,-10,0,10,20];
  ticks.forEach(v=>{svg+='<line x1="'+x(v)+'" x2="'+x(v)+'" y1="125" y2="131" class="plot-grid"/><text x="'+x(v)+'" y="151" text-anchor="middle" class="plot-tick">'+(v>0?'+':'')+v+'%</text>';});
  svg+='<line x1="'+left+'" x2="'+right+'" y1="125" y2="125" class="plot-grid"/><line x1="'+zero+'" x2="'+zero+'" y1="12" y2="125" class="plot-zero"/>';
  rows.forEach((row,i)=>{
   const y=31+i*53,width=Math.abs(x(row[1])-zero),start=row[1]<0?zero-width:zero,label=row[1]<0?start+8:x(row[1])+8;
   svg+='<g class="chart-hit" data-source="'+topic().source+'" role="button" tabindex="0" aria-label="查看'+row[0]+'同比'+row[1]+'%的资料"><rect class="hit-back" x="1" y="'+(y-10)+'" width="'+(w-2)+'" height="43" rx="5" fill="transparent"/><text x="'+(left-12)+'" y="'+(y+16)+'" text-anchor="end" class="plot-label">'+row[0]+'</text>'+growRect(start,y,width,24,row[2],zero,row[1]<0)+'<text class="plot-value '+(row[1]<0?'coral':i?'teal':'')+' chart-end-label" data-bar-index="'+i+'" x="'+label+'" y="'+(y+17)+'" style="'+(row[1]<0?'fill:white':'')+'">'+(row[1]>0?'+':'−')+number(row[1],1)+'%</text></g>';
  });
  return svg+'</svg>';
 }
 function stageChart(){
  const w=narrow.matches?470:660,xs=[37,w*.35,w*.65,w-36],labels=['8月签约','施工有报道','投产待核验','达产待核验'];
  let svg='<svg class="data-svg" viewBox="0 0 '+w+' 180" role="group" aria-label="项目报道阶段，不是实际投资完成率"><line x1="'+xs[0]+'" x2="'+xs[1]+'" y1="53" y2="53" stroke="#1369eb" stroke-width="2"/><line x1="'+xs[1]+'" x2="'+xs[3]+'" y1="53" y2="53" stroke="#b8c8da" stroke-width="2" stroke-dasharray="5 6"/>';
  xs.forEach((x,i)=>{svg+='<g class="chart-hit stage-hit" role="button" tabindex="0" data-stage="'+i+'" aria-label="查看'+labels[i]+'的核验范围"><rect class="hit-back" x="'+Math.max(0,x-48)+'" y="20" width="96" height="108" rx="7" fill="transparent"/><circle data-stage-index="'+i+'" cx="'+x+'" cy="53" r="9" fill="'+(i<2?'#1369eb':'#fff')+'" stroke="'+(i<2?'#1369eb':'#a9b9cc')+'" stroke-width="2"/><text x="'+x+'" y="91" text-anchor="middle" class="plot-label" style="font-size:'+(narrow.matches?'13':'14')+'px">'+labels[i]+'</text><text x="'+x+'" y="116" text-anchor="middle" class="plot-tick">'+['2026年8月','2026年9月报道','后续进展待查','实际产销待查'][i]+'</text></g>';});
  return svg+'</svg>';
 }
 function agricultureChart(){
  const w=narrow.matches?470:660,left=narrow.matches?139:160,right=w-38,scale=(right-left)/34;
  let svg='<svg class="data-svg" viewBox="0 0 '+w+' 180" role="group" aria-label="农林牧渔分行业产值同比">';
  topic().sectors.forEach((row,i)=>{const y=11+i*31,width=row[1]*scale;svg+='<g role="button" tabindex="0" class="chart-hit" data-source="quarter" aria-label="查看'+row[0]+'产值同比'+row[1]+'%的资料"><rect class="hit-back" x="0" y="'+(y-5)+'" width="'+w+'" height="29" rx="4" fill="transparent"/><text x="'+(left-13)+'" y="'+(y+14)+'" text-anchor="end" class="plot-label" style="font-size:13px">'+row[0]+'</text>'+growRect(left,y,width,19,i===4?'#23a3a7':'#3284e9',left)+'<text class="plot-value chart-end-label" data-bar-index="'+i+'" x="'+(left+width+7)+'" y="'+(y+14)+'" style="font-size:13px">+'+number(row[1],1)+'%</text></g>';});
  return svg+'</svg>';
 }
 function mini(type){
  let s='<svg viewBox="0 0 360 66" role="img" aria-label="已披露信息的简图">';
  if(type==='orders'){
   [['上年同期',72,'1'],['受访所述',216,'约3']].forEach((r,i)=>{const y=7+i*29;s+='<text x="0" y="'+(y+13)+'">'+r[0]+'</text><rect x="82" y="'+y+'" width="'+r[1]+'" height="18" rx="3" fill="'+(i?'#3688ee':'#bedbff')+'"/><text x="'+(89+r[1])+'" y="'+(y+13)+'" class="mini-value">'+r[2]+'</text>';});
  }else if(type==='food'){
   [['限上餐饮',9.8,'#247be6'],['限上住宿',1.6,'#24b2b1']].forEach((r,i)=>{const y=7+i*29,width=r[1]*21;s+='<text x="0" y="'+(y+13)+'">'+r[0]+'</text><rect x="88" y="'+y+'" width="'+width+'" height="19" rx="3" fill="'+r[2]+'"/><text x="'+(96+width)+'" y="'+(y+14)+'" class="mini-value">+'+r[1]+'%</text>';});
  }else if(type==='stages'||type==='closure'||type==='tea'||type==='copper'){
   const labels=type==='stages'?['已报道签约','施工有报道','投产待核验']:type==='closure'?['产线关停','设备拆除','其他业务待查']:type==='tea'?['产量有记录','成本待补','回款待补']:['点火有报道','产销待跟踪','达产待核验'];
   const known=type==='stages'||type==='closure'?2:1,color=type==='closure'?'#ca7c74':'#287fe8';
   s+='<line x1="27" x2="328" y1="18" y2="18" stroke="#cdd8e6" stroke-width="1.5" stroke-dasharray="4 4"/>';
   if(known>1)s+='<line x1="27" x2="177" y1="18" y2="18" stroke="'+color+'" stroke-width="2"/>';
   labels.forEach((label,i)=>{const x=27+i*150;s+='<circle cx="'+x+'" cy="18" r="7" fill="'+(i<known?color:'#fff')+'" stroke="'+(i<known?color:'#a3b4c9')+'" stroke-width="1.6"/><text class="mini-stage" x="'+(i===0?0:i===2?360:x)+'" y="48" text-anchor="'+(i===0?'start':i===2?'end':'middle')+'">'+label+'</text>';});
  }else if(type==='procurement'){
   s+='<text x="0" y="19">早期不足10%</text><rect x="100" y="5" width="24" height="18" rx="2" fill="#edf3f9" stroke="#b4c3d5" stroke-dasharray="3 3"/><text x="0" y="49">受访约40%</text><rect x="100" y="35" width="96" height="18" rx="3" fill="#3988e9"/><text x="209" y="49" class="mini-value">约40%</text><text x="274" y="49" class="mini-label">范围与约数</text>';
  }else if(type==='agriculture'){
   const sectors=D.topics.agriculture.sectors;
   sectors.forEach((r,i)=>{const x=20+i*70,h=r[1]/32*41;s+='<rect x="'+x+'" y="'+(45-h)+'" width="34" height="'+h+'" rx="3" fill="'+(i===4?'#24a8aa':'#6aaaf0')+'"/><text x="'+(x+17)+'" y="64" text-anchor="middle">'+['农','林','牧','渔','辅'][i]+'</text><text class="mini-label" x="'+(x+17)+'" y="'+Math.max(9,41-h)+'" text-anchor="middle">'+r[1]+'%</text>';});
  }
  return s+'</svg>';
 }
 function eventValue(item){
  const special=item.id==='food';
  return '<div class="event-value-row"><strong class="event-number'+(item.id==='copper'?' text-big':'')+'">'+escape(item.big)+'<span>'+escape(item.unit)+'</span></strong><div class="event-measure">'+escape(item.subtitle)+'<span class="event-tag">'+escape(item.tag)+'</span></div></div><div class="event-mini">'+mini(item.visual)+'</div>';
 }
 function eventCard(item){
  return '<article class="event-card'+(state.related===item.id?' is-related':'')+'" data-event-id="'+item.id+'"><button class="event-card-open" type="button" data-open-event="'+item.id+'" aria-label="查看'+escape(item.title)+'的详情"><div class="event-card-top"><h3>'+icon(D.topics[item.topic].icon)+escape(item.title)+'</h3><span class="card-arrow" aria-hidden="true">›</span></div><div class="card-date"><time datetime="'+item.date+'">'+item.date+'</time><span>'+item.dateLabel+'</span></div><div class="event-card-content">'+eventValue(item)+'</div><div class="event-question"><span>'+escape(item.question)+'</span>'+icon('arrow')+'</div></button></article>';
 }
 function renderEvents(){
  const items=C.filter({topic:state.feedTopic,town:state.town}),shown=state.expanded?items:items.slice(0,3);
  M.html('eventGrid',shown.map(eventCard).join(''),false);
  $('emptyState').hidden=items.length>0;
  if(!items.length){
   const local=state.town?C.filter({town:state.town}):[];
   text('emptyTitle',state.town?'当前收录里，还没有这组现场':'这类现场正在补充');
   text('emptyDetail',state.town?(local.length?'本页有'+state.town+'的其他主题线索，可切换“全部”查看。':'本页暂未收录'+state.town+'的可核验现场。这不代表当地没有变化。'):'换一个主题，或看看全县已收录的资料。');
  }
  const remaining=items.length-shown.length;
  $('moreEvents').hidden=items.length<=3;
  $('moreEvents').innerHTML=state.expanded?'收起其他变化 <span aria-hidden="true">−</span>':'再看 '+remaining+' 条今年的变化 <span aria-hidden="true">＋</span>';
  document.querySelectorAll('[data-event-topic]').forEach(button=>{const on=button.dataset.eventTopic===state.feedTopic;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  $('clearTownFilter').hidden=!state.town;text('clearTownFilter',state.town+' ×');
  text('eventCount','本次筛选 '+items.length+' 条 / 本页 '+D.events.length+' 条');
  document.querySelectorAll('[data-town]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.town===state.town)));
  text('townCoverage',state.town?'正在看'+state.town+'；筛选范围限于本页收录，不是完整镇级画像。':'本页收录的线索，不是全县完整清单。');
  $('eventGrid').querySelectorAll('[data-open-event]').forEach(button=>button.onclick=()=>openEvent(button.dataset.openEvent));
 }
 function renderInquiry(){
  const info=topic(),selected=info.inquiries.find(q=>q.id===state.inquiry);
  M.html('inquiryButtons',info.inquiries.map(q=>'<button type="button" data-inquiry="'+q.id+'" aria-pressed="'+(state.inquiry===q.id)+'">'+escape(q.label)+'</button>').join(''),false);
  $('inquiryButtons').querySelectorAll('[data-inquiry]').forEach(button=>button.onclick=()=>chooseInquiry(button.dataset.inquiry));
  M.html('inquirySelect','<option value="">先选一条追问</option>'+info.inquiries.map(q=>'<option value="'+q.id+'">'+escape(q.label)+'</option>').join(''),false);
  $('inquirySelect').value=state.inquiry;
  $('inquiryResponse').hidden=!selected;
  if(selected){text('inquiryClue',selected.clue);text('inquiryGap',selected.gap);$('openClue').onclick=()=>openEvent(selected.event);}
  text('carryQuestion',C.question(snapshot()));
  text('continueClues',selected?'打开相关现场 →':'继续找线索 →');
 }
 function updateLinks(){
  const value=snapshot();
  document.querySelectorAll('[data-next-reality]').forEach(a=>a.href=C.link('reality.html',value));
  document.querySelectorAll('[data-next-industry]').forEach(a=>a.href=C.link('industry-base.html',value));
 }
 function syncLocation(){
  // Share links contain only public scene/choice IDs. No personal data or stored history.
  history.replaceState(null,'',C.link('index.html',snapshot()));
 }
 function renderHero(enter=false){
  const info=topic();
  $('topicTitle').innerHTML=info.title.map((line,i)=>'<'+(i?'strong':'span')+'>'+escape(line)+'</'+(i?'strong':'span')+'>').join('');
  text('topicPeriod',info.period);text('chartNote',info.chartNote);
  $('heroVisual').dataset.currentTopic=state.topic;$('heroVisual').setAttribute('aria-labelledby','topic-'+state.topic);
  M.html('heroMetrics',info.metrics.map(metricMarkup).join(''),false);
  M.html('mainChart',info.chart==='diverge'?compareChart():info.chart==='food'?compareChart(true):info.chart==='agriculture'?agricultureChart():stageChart(),false);
  document.querySelectorAll('.topic-tabs [data-topic]').forEach(button=>{const on=button.dataset.topic===state.topic;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;});
  if(enter&&!M.reduced.matches){const hero=document.querySelector('.discovery-hero');hero.dataset.enter='false';requestAnimationFrame(()=>{hero.dataset.enter='true';});}
  $('mainChart').querySelectorAll('[data-source],[data-stage]').forEach(node=>{
   const open=()=>node.hasAttribute('data-stage')?openStage(+node.dataset.stage):openSource(node.dataset.source);
   node.onclick=open;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
  });
  $('heroMetrics').querySelectorAll('[data-source]').forEach(button=>button.onclick=()=>openSource(button.dataset.source));
 }
 function render(enter=false){renderHero(enter);renderInquiry();renderEvents();updateLinks();updateCount();if(!firstRender)syncLocation();firstRender=false;}
 function chooseTopic(id){
  if(!D.topics[id])return;
  stopPlay(true);state.topic=id;state.inquiry='';state.related='';state.feedTopic=id;state.expanded=false;
  text('playCaption','点图形看口径，点现场看进展。');render(true);
 }
 function chooseInquiry(id){
  const inquiry=topic().inquiries.find(q=>q.id===id);state.inquiry=inquiry?.id||'';state.related=inquiry?.event||'';
  const related=C.eventById(state.related);
  if(state.town&&related?.town!==state.town){state.town='';toast('这条线索属于'+(related?.town||'全县口径')+'，已切回全县已收录资料。');}
  renderInquiry();renderEvents();updateLinks();syncLocation();
  if(state.invitation?.inquiry){
   const invited=D.topics[state.invitation.topic].inquiries.find(q=>q.id===state.invitation.inquiry);
   const same=state.invitation.topic===state.topic&&state.invitation.inquiry===state.inquiry;
   text('inviteNote',same?'你们关注同一条追问，可以继续核对相关现场。':'链接里关注的是“'+(invited?.label||D.topics[state.invitation.topic].label)+'”，你这次选择了“'+(inquiry?.label||'暂不选择')+'”。两条追问都可以继续查。');
  }
 }
 function playLabel(){
  $('playCompare').innerHTML=playing?'<span aria-hidden="true">Ⅱ</span> 暂停对比':M.reduced.matches?'逐项查看':'<span aria-hidden="true">▶</span> 播放对比';
  $('playCompare').setAttribute('aria-pressed',String(playing));
 }
 function drawProgress(progress){
  const bars=[...$('mainChart').querySelectorAll('.animated-bar')];
  bars.forEach((node,i)=>{
   const segment=Math.min(1,Math.max(0,(progress*(bars.length+.3)-i)/1.2)),ease=1-Math.pow(1-segment,3),width=+node.dataset.fullWidth*ease,zero=+node.dataset.zero;
   node.setAttribute('width',width);node.setAttribute('x',node.dataset.negative==='true'?zero-width:zero);
   const label=$('mainChart').querySelector('[data-bar-index="'+i+'"]');if(label)label.style.opacity=String(Math.min(1,segment*3));
  });
  const stages=[...$('mainChart').querySelectorAll('[data-stage-index]')];
  stages.forEach((node,i)=>node.setAttribute('r',i===Math.min(3,Math.floor(progress*4))&&progress<1?'13':'9'));
  const current=Math.min(2,Math.floor(progress*3));
  if(current!==phase){phase=current;const messages=topic().chart==='stages'?['签约有报道，计划金额与实投金额分开看。','施工已有报道，后续投产仍需核验。','投产、达产还要继续跟踪。']:['先看第一项已披露数据。','再看另一项：同一时期，各有口径。','一起看差异，再到现场找线索。'];text('playCaption',messages[current]);}
 }
 function stopPlay(reset=false){
  cancelAnimationFrame(playFrame);playFrame=0;
  if(playing)playElapsed=Math.min(3600,performance.now()-playStarted);
  playing=false;if(reset){playElapsed=0;playFinished=true;}playLabel();
 }
 function play(){
  if(M.reduced.matches){
   const nodes=[...$('mainChart').querySelectorAll('[role="button"]')];
   phase=(phase+1)%nodes.length;nodes[phase]?.focus();text('playCaption','逐项查看：按回车或轻点可打开这一项资料。');return;
  }
  if(playing){stopPlay();text('playCaption','已暂停，点“播放对比”继续。');return;}
  if(playFinished){playElapsed=0;phase=-1;playFinished=false;drawProgress(0);}
  playing=true;playStarted=performance.now()-playElapsed;playLabel();
  const tick=now=>{
   if(!playing)return;
   const elapsed=now-playStarted,p=Math.min(1,elapsed/3600);drawProgress(p);
   if(p===1){playing=false;playFinished=true;playElapsed=0;playLabel();text('playCaption','对比完成 · 点击一条真实现场，继续核对。');return;}
   playFrame=requestAnimationFrame(tick);
  };
  playFrame=requestAnimationFrame(tick);
 }
 function toast(message){text('discoveryToast',message);$('discoveryToast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('discoveryToast').classList.remove('visible'),2400);}
 function persist(){try{localStorage.setItem(C.savedKey,JSON.stringify(saved));}catch{toast('浏览器未允许保存；这次选择仍可带到下一页。');}}
 function updateCount(){text('savedCount',saved.length);$('questionCount').setAttribute('aria-label','查看本机保存的'+saved.length+'条追问');}
 function save(value){
  const clean=C.context(new URLSearchParams(value));
  if(!clean.inquiry){toast('先选一条你想核对的问题。');return;}
  if(!saved.some(item=>C.key(item)===C.key(clean))){saved.push(clean);saved=saved.slice(-50);persist();updateCount();toast('已收下这条追问，可带到下一页。');}
  else toast('这条追问已在你的清单里。');
 }
 function sourceMarkup(id){
  const s=D.sources[id];
  return '<details class="source-details"><summary>资料与口径 · '+escape(s.kind)+'</summary><p>'+escape(s.publisher)+' · '+s.published+' · '+s.level+'级</p><p>'+escape(s.note)+'</p><a href="'+escape(s.url)+'" target="_blank" rel="noopener noreferrer">打开资料原页 ↗</a>'+(s.mirror?'<a href="'+escape(s.mirror)+'" target="_blank" rel="noopener noreferrer">查看可读转载 ↗</a>':'')+'</details>';
 }
 function openDialog(title,kicker,body,context=null){
  stopPlay();if(!$('detailDialog').open)restoreFocus=document.activeElement;dialogContext=context;
  text('dialogKicker',kicker);$('dialogBody').innerHTML='<h2 id="dialogTitle">'+escape(title)+'</h2>'+body;
  if(!$('detailDialog').open)$('detailDialog').showModal();$('closeDialog').focus();
  $('dialogBody').querySelectorAll('[data-dialog-save]').forEach(b=>b.onclick=()=>save(context));
 }
 function closeDialog(){$('detailDialog').close();}
 function openSource(id){
  const source=D.sources[id];
  openDialog('这组数字，怎么读？',source.publisher,'<p class="dialog-lead">'+escape(topic().period)+'</p><div class="dialog-fact"><strong>统计范围</strong><p>'+escape(topic().chartNote)+'</p></div>'+sourceMarkup(id));
  $('dialogBody').querySelector('details').open=true;
 }
 function openStage(index){
  const descriptions=[['8月签约已有报道','15亿元为计划投资，不是已经完成的投资额。'],['施工现场已有报道','9月22日报道写到三期项目工地施工。尚不据此认定正式投产。'],['后续投产仍待核验','需要新的试产、验收或正式投产记录，不能沿着时间轴自动推定。'],['达产与产销仍待核验','需要实际产量、销售和持续生产记录；不把目标产值当成现实。']];
  openDialog(descriptions[index][0],'汉德精密三期 · 项目阶段','<p class="dialog-lead">'+escape(descriptions[index][1])+'</p>'+sourceMarkup('yuanzhou'),{topic:'projects',inquiry:'progress',event:'hande',town:state.town});
 }
 function openEvent(id){
  const item=C.eventById(id);if(!item)return;
  const context={topic:item.topic,inquiry:item.inquiry,event:item.id,town:item.town||''};
  openDialog(item.title,item.date+' · '+item.dateLabel,
   '<div class="dialog-visual">'+eventValue(item)+'</div><div class="dialog-fact"><strong>已经看到的</strong><p>'+escape(item.detail)+'</p></div><div class="dialog-fact"><strong>还不能据此认定的</strong><p>'+escape(item.boundary)+'</p></div><div class="dialog-fact"><strong>下一条值得核对</strong><p>'+escape(item.next)+'</p></div>'+sourceMarkup(item.source)+'<div class="dialog-actions"><button class="button" type="button" data-dialog-save>收下这条追问 ＋</button><a class="button primary" href="'+escape(C.link('reality.html',context))+'">带着它继续 →</a></div>',context);
 }
 function showSaved(){
  const body=saved.length?saved.map((item,index)=>'<article class="dialog-question-item"><small>'+escape(D.topics[item.topic].label)+(item.town?' · '+escape(item.town):'')+'</small><p>'+escape(C.question(item))+'</p><div><a class="button" href="'+escape(C.link('reality.html',item))+'">带着它继续 →</a><button type="button" data-remove-question="'+index+'">移除</button></div></article>').join(''):'<p class="dialog-lead">还没有收下追问。先选一个关注点，再点“收下这条追问”。</p>';
  openDialog('我的追问','仅保存在当前浏览器',body);
  $('dialogBody').querySelectorAll('[data-remove-question]').forEach(button=>button.onclick=()=>{saved.splice(+button.dataset.removeQuestion,1);persist();updateCount();showSaved();});
 }
 async function share(){
  const context=snapshot(),url=new URL(C.link('index.html',context,true),location.href).href;
  const content='博罗哪里正在变？\n'+C.question(context)+'\n'+url;
  try{await navigator.clipboard.writeText(content);toast('发现链接已复制。对方可独立选择关注点。');}
  catch{
   openDialog('分享这个发现','只包含公开场景与选择','<p class="dialog-lead">复制下面的链接，对方可独立选择关注点。</p><p class="dialog-lead" style="overflow-wrap:anywhere;user-select:all">'+escape(url)+'</p>');
  }
 }
 function setTown(name){state.town=state.town===name?'':name;state.expanded=true;if(state.town&&C.eventById(state.related)?.town!==state.town){state.related='';state.inquiry='';renderInquiry();}renderEvents();updateLinks();syncLocation();text('townCoverage',state.town?'已筛选'+state.town+'。向上查看本页收录的相关现场。':'本页收录的线索，不是全县完整清单。');}
 function motionPreference(){
  stopPlay(true);renderHero(false);$('discoveryReduce').setAttribute('aria-pressed',String(M.reduced.matches));$('discoveryReduce').disabled=M.systemMotion.matches;
  text('discoveryReduce',M.systemMotion.matches?'系统已减少动态':M.reduced.matches?'恢复动态':'减少动态');playLabel();
 }
 $('townButtons').innerHTML=D.towns.map(name=>'<button type="button" data-town="'+name+'" class="'+(C.filter({town:name}).length?'has-record':'')+'" aria-pressed="false" aria-label="筛选'+name+'的已收录线索">'+name.replace('街道','').replace(/镇$/,'')+'</button>').join('');
 document.querySelectorAll('[data-town]').forEach(button=>button.onclick=()=>setTown(button.dataset.town));
 document.querySelectorAll('.topic-tabs [data-topic]').forEach(button=>{
  button.onclick=()=>chooseTopic(button.dataset.topic);
  button.onkeydown=event=>{
   const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
   if(!offset&&event.key!=='Home'&&event.key!=='End')return;
   event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?3:(names.indexOf(state.topic)+offset+4)%4;chooseTopic(names[index]);$('topic-'+names[index]).focus();
  };
 });
 document.querySelectorAll('[data-event-topic]').forEach(button=>button.onclick=()=>{state.feedTopic=button.dataset.eventTopic;state.expanded=false;renderEvents();});
 $('moreEvents').onclick=()=>{state.expanded=!state.expanded;renderEvents();};
 $('clearTownFilter').onclick=()=>{state.town='';renderEvents();updateLinks();syncLocation();};
 $('resetFilters').onclick=()=>{state.town='';state.feedTopic='all';state.expanded=false;renderEvents();updateLinks();syncLocation();};
 $('inquirySelect').onchange=event=>chooseInquiry(event.target.value);
 $('saveInquiry').onclick=()=>save(snapshot());
 $('continueClues').onclick=()=>{
  const selected=topic().inquiries.find(q=>q.id===state.inquiry);
  if(selected)openEvent(selected.event);else{state.feedTopic=state.topic;state.expanded=true;renderEvents();$('eventsSection').scrollIntoView({block:'start',behavior:M.reduced.matches?'auto':'smooth'});}
 };
 $('questionCount').onclick=showSaved;$('reviewQuestions').onclick=showSaved;$('shareDiscovery').onclick=share;
 $('sourceButton').onclick=()=>openSource(topic().source);
 $('playCompare').onclick=play;$('nextTopic').onclick=()=>chooseTopic(names[(names.indexOf(state.topic)+1)%4]);
 $('closeDialog').onclick=closeDialog;
 $('detailDialog').addEventListener('click',event=>{if(event.target===$('detailDialog')){const box=$('detailDialog').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closeDialog();}});
 $('detailDialog').addEventListener('close',()=>{restoreFocus?.focus();dialogContext=null;});
 $('discoveryReduce').onclick=()=>M.setReduced(!M.reduced.matches);M.reduced.addEventListener('change',motionPreference);
 narrow.addEventListener('change',()=>{stopPlay(true);renderHero(false);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();});
 if(state.invitation){$('inviteNote').hidden=false;text('inviteNote','这个发现关注：'+C.question(state.invitation)+' 你也可以先独立选择自己的关注点。');}
 text('eventCoverage','资料核对至 '+D.checkedAt.replaceAll('-','.'));
 render(true);motionPreference();
})();
