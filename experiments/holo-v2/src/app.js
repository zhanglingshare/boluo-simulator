(()=>{'use strict';
const E=window.BOLUO_ENGINE,D=window.BOLUO_DATA;
const el=id=>document.getElementById(id), all=sel=>[...document.querySelectorAll(sel)];
const canvas=el('universeCanvas'), linkCanvas=el('linkCanvas'), ctx=linkCanvas.getContext('2d');
let gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});
const fallbackCanvas=gl?null:canvas.getContext('2d');
const prefersReduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=window.innerWidth,height=window.innerHeight,dpr=1;
const S={mode:'universe',focusCluster:null,selected:null,grade:'all',uncertainty:.5,rotate:false,yaw:-.18,pitch:-.17,distance:6.9,center:[0,0,0],aim:[0,0,0],targetDistance:6.9,drag:false,moved:false,seen:false,mobileOpen:false,frame:0};
let G=E.compute(S.uncertainty,S.grade),toastTimer=0;
const colorHex=s=>{let h=s.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)};
const colorFor=group=>E.groups.get(group)?.color||'#97d8e8';
const statusSymbol={A:'公开依据',B:'研究推断',C:'待补证据'};
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){const x=el('toast');x.textContent=s;x.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove('show'),2700)}
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);width=window.innerWidth;height=window.innerHeight;for(const c of [canvas,linkCanvas]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr)}if(gl)gl.viewport(0,0,canvas.width,canvas.height);ctx.setTransform(dpr,0,0,dpr,0,0)}
window.addEventListener('resize',resize,{passive:true});resize();
function project(p){const px=p[0]-S.center[0],py=p[1]-S.center[1],pz=p[2]-S.center[2];let ca=Math.cos(S.yaw),sa=Math.sin(S.yaw);let rx=ca*px-sa*pz,rz=sa*px+ca*pz;let cb=Math.cos(S.pitch),sb=Math.sin(S.pitch);let ry=cb*py-sb*rz;rz=sb*py+cb*rz;let depth=Math.max(1.6,S.distance-rz);const scale=Math.min(width,height)*1.35/depth;return {x:width*.51+rx*scale,y:height*.515-ry*scale,z:rz,depth,scale}}
function lerp(a,b,t){return a+(b-a)*t}
function interpolate(){const t=prefersReduced?.35:.065;S.center=S.center.map((v,i)=>lerp(v,S.aim[i],t));S.distance=lerp(S.distance,S.targetDistance,t);if(S.rotate&&!S.drag&&!prefersReduced)S.yaw+=.00125}
function focusedNode(){return S.selected?E.nodeMap.get(S.selected):null}
function displayNodes(){const visible=[];
  if(!S.focusCluster){for(const c of D.clusters)visible.push({id:'cluster:'+c.id,name:c.name,cluster:c.id,position:c.pos,major:true,color:c.color,size:68,alpha:1});
   for(const n of E.dataNodes){if(E.rand(n.id,8)>.78)visible.push({...n,position:G.positions.get(n.id),color:colorFor(n.cluster),size:4.2,alpha:.36})}
   return visible}
  for(const c of D.clusters){visible.push({id:'cluster:'+c.id,name:c.name,cluster:c.id,position:c.pos,major:true,color:c.color,size:c.id===S.focusCluster?43:25,alpha:c.id===S.focusCluster?.68:.22})}
  let valid=G.nodes.filter(n=>n.cluster===S.focusCluster);
  if(S.selected){let near=E.neighborhood(G,S.selected,S.mode==='relations'?2:1);const selectedNode=E.nodeMap.get(S.selected);valid=G.nodes.filter(n=>n.cluster===S.focusCluster||near.has(n.id)||(selectedNode&&n.id===S.selected))}
  for(const n of valid){const isSelected=n.id===S.selected;let near=!S.selected||E.neighborhood(G,S.selected,1).has(n.id);let alpha=(S.selected&&!near)?0.38:1;const score=G.scores.get(n.id)||0;
   visible.push({...n,position:G.positions.get(n.id),color:colorFor(n.cluster),size:isSelected?32:Math.min(21,12+score*1.9),alpha,selected:isSelected, score})}
  return visible}
function activeEdges(){if(!S.focusCluster)return[];
 let list=G.edges.filter(e=>E.nodeMap.get(e.source)?.cluster===S.focusCluster||E.nodeMap.get(e.target)?.cluster===S.focusCluster);
 if(S.selected){let near=E.neighborhood(G,S.selected,S.mode==='relations'?2:1);list=list.filter(e=>near.has(e.source)&&near.has(e.target))}
 return list}
function rgba(rgb,a){return `rgba(${Math.round(rgb[0]*255)},${Math.round(rgb[1]*255)},${Math.round(rgb[2]*255)},${a})`}
function curvePoint(a,b,t,arc){return {x:(1-t)*a.x+t*b.x,y:(1-t)*a.y+t*b.y-4*arc*Math.sin(t*Math.PI)}}
function drawOverlay(t,visible){ctx.clearRect(0,0,width,height);const base=ctx;
 // Spatial reference circles are non-geographic ornamental depth guides.
 base.save();base.translate(width*.51,height*.515);base.rotate(-.12);base.lineWidth=1;
 for(let r=125;r<Math.min(750,width*.48);r+=92){base.strokeStyle=`rgba(65,156,182,${.09-r/12000})`;base.beginPath();base.ellipse(0,0,r,r*.35,0,0,Math.PI*2);base.stroke()}
 base.strokeStyle='rgba(70,153,179,.10)';for(let a=0;a<Math.PI*2;a+=Math.PI/9){base.beginPath();base.moveTo(0,0);base.lineTo(Math.cos(a)*880,Math.sin(a)*350);base.stroke()}base.restore();
 const selected=S.selected;
 const edges=activeEdges();
 for(const edge of edges){const pp=G.positions.get(edge.source),qq=G.positions.get(edge.target);if(!pp||!qq)continue;let a=project(pp),b=project(qq);
  const incident=!selected||edge.source===selected||edge.target===selected;
  const alpha=(incident?.75:.18)*(edge.level==='A'?1:edge.level==='B'?.72:.4);
  const ca=edge.kind.includes('环保')?'#65ddb3':edge.kind.includes('资源')?'#ffb56c':edge.kind.includes('文旅')?'#a9e8a5':'#6bcbf3';
  const gradeScale=edge.strength;
  const bend=12+Math.min(30,Math.abs(a.x-b.x)*.12);
  const control={x:(a.x+b.x)/2,y:(a.y+b.y)/2-bend};
  const dashed=S.mode==='flows'||edge.level!=='A';
  ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(control.x,control.y,b.x,b.y);
  ctx.lineWidth=(incident?1.15+gradeScale*1.7:.8);ctx.strokeStyle=hexrgba(ca,alpha);ctx.shadowColor=ca;ctx.shadowBlur=incident?9:0;if(dashed)ctx.setLineDash([5,7]);ctx.stroke();ctx.restore();
  // A luminous moving dot illustrates active *exploration of a known link*, not measured traffic.
  if(S.mode==='relations'&&incident&&!prefersReduced){const u=(t*.00011 + E.rand(edge.id,3))%1;const x=(1-u)**2*a.x+2*(1-u)*u*control.x+u*u*b.x;const y=(1-u)**2*a.y+2*(1-u)*u*control.y+u*u*b.y;ctx.fillStyle=hexrgba(ca,.7);ctx.shadowColor=ca;ctx.shadowBlur=11;ctx.beginPath();ctx.arc(x,y,2.0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 }
 // Cluster halos: gradients are aesthetic navigation affordances, not quantitative heat maps.
 const majors=visible.filter(n=>n.major);
 for(const n of majors){const p=project(n.position),r=(n.id==='cluster:'+S.focusCluster?100:75)*Math.min(1.6,p.scale/150);if(p.x<0||p.x>width||p.y<0||p.y>height)continue;
  const c=colorHex(n.color);const grad=ctx.createRadialGradient(p.x,p.y,3,p.x,p.y,r);
  grad.addColorStop(0,rgba(c,n.alpha*.14));grad.addColorStop(.35,rgba(c,n.alpha*.085));grad.addColorStop(1,rgba(c,0));ctx.fillStyle=grad;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
  const ang=(t*.00014+E.rand(n.id)*6.28);ctx.beginPath();ctx.ellipse(p.x,p.y,r*.75,r*.27,-.18,ang,ang+Math.PI*1.42);ctx.strokeStyle=rgba(c,n.alpha*.38);ctx.lineWidth=1.3;ctx.stroke();
  for(let i=0;i<3;i++){let a=ang+i*Math.PI*.73;let x=p.x+Math.cos(a)*r*.75, y=p.y+Math.sin(a)*r*.27;ctx.fillStyle=rgba(c,n.alpha*.8);ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill()}
 }
 // selected node pulsing focus indicator.
 const sn=visible.find(n=>n.selected);if(sn){const p=project(sn.position);const r=22+(prefersReduced?0:Math.sin(t*.002)*2);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.strokeStyle='rgba(179,245,255,.7)';ctx.lineWidth=1;ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([])}
 if(S.mode==='flows'){
  ctx.font='11px sans-serif';ctx.fillStyle='rgba(242,204,142,.76)';ctx.fillText('方向 / 数量资料缺失：此处仅展示既有关系，非实测人流或物流',Math.max(12,width*.34),Math.max(180,height*.78));
 }
}
function hexrgba(hex,alpha){const r=colorHex(hex);return rgba(r,alpha)}
function makeShaders(){if(!gl)return null;
 const vs=`#version 300 es
 precision highp float;
 in vec3 aPosition;in vec3 aColor;in float aSize;in float aAlpha;
 uniform vec2 uResolution;uniform vec3 uCenter;uniform float uYaw;uniform float uPitch;uniform float uDist;uniform float uDpr;
 out vec3 vColor;out float vAlpha;
 void main(){vec3 p=aPosition-uCenter;
  float c=cos(uYaw),s=sin(uYaw);float x=c*p.x-s*p.z;float z=s*p.x+c*p.z;
  float cp=cos(uPitch),sp=sin(uPitch);float y=cp*p.y-sp*z;z=sp*p.y+cp*z;
  float den=max(1.6,uDist-z);float scale=min(uResolution.x,uResolution.y)*1.35/den;
  gl_Position=vec4(x*scale*2.0/uResolution.x+.02,y*scale*2.0/uResolution.y-.03,clamp(-z/20.0,-.9,.9),1.0);
  gl_PointSize=aSize*uDpr*clamp(scale/160.0,.55,1.7);
  vColor=aColor;vAlpha=aAlpha;
 }`;
 const fs=`#version 300 es
 precision highp float;in vec3 vColor;in float vAlpha;out vec4 outColor;
 void main(){vec2 c=gl_PointCoord-vec2(.5);float r=length(c);if(r>.5)discard;
 float core=smoothstep(.47,.03,r);float glow=pow(max(0.0,1.0-r*2.0),2.1);
 vec3 normal=normalize(vec3(c*.88,sqrt(max(.001,.25-dot(c,c)))));
 float lighting=.55+.48*max(0.0,dot(normal,normalize(vec3(-.3,.65,.9))));
 float rim=pow(max(0.0,1.0-normal.z),2.0);
 vec3 col=vColor*(.8+lighting*.8)+vec3(.18,.26,.34)*rim;
 float alpha=vAlpha*(glow*.73+core*.18);
 outColor=vec4(col,alpha);
 }`;
 const compile=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 let prog=gl.createProgram();gl.attachShader(prog,compile(gl.VERTEX_SHADER,vs));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
 const uniforms={};for(const n of ['uResolution','uCenter','uYaw','uPitch','uDist','uDpr'])uniforms[n]=gl.getUniformLocation(prog,n);
 const attr={};for(const n of ['aPosition','aColor','aSize','aAlpha'])attr[n]=gl.getAttribLocation(prog,n);
 const buf=gl.createBuffer();gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
 return {prog,uniforms,attr,buf};}
let shaders;
try{shaders=makeShaders()}catch(e){console.warn('WebGL program error',e);gl=null;shaders=null}
const stars=Array.from({length:450},(_,i)=>({id:'star'+i,position:[(E.rand('st'+i,1)-.5)*16,(E.rand('st'+i,2)-.5)*9,-3-E.rand('st'+i,3)*7],color:'#7dbcd3',size:.45+E.rand('st'+i,4)*1.8,alpha:.09+E.rand('st'+i,5)*.24}));
function drawGL(visible){if(!gl){drawFallback(visible);return}gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 const all=stars.concat(visible);let a=new Float32Array(all.length*8);for(let i=0;i<all.length;i++){const n=all[i],rgb=colorHex(n.color),o=i*8;[...n.position,...rgb,n.size,n.alpha].forEach((v,j)=>a[o+j]=v)}
 gl.useProgram(shaders.prog);gl.bindBuffer(gl.ARRAY_BUFFER,shaders.buf);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);
 const st=8*4;for(const [k,size,offset] of [['aPosition',3,0],['aColor',3,12],['aSize',1,24],['aAlpha',1,28]]){const loc=shaders.attr[k];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,st,offset)}
 gl.uniform2f(shaders.uniforms.uResolution,width,height);gl.uniform3fv(shaders.uniforms.uCenter,S.center);gl.uniform1f(shaders.uniforms.uYaw,S.yaw);gl.uniform1f(shaders.uniforms.uPitch,S.pitch);gl.uniform1f(shaders.uniforms.uDist,S.distance);gl.uniform1f(shaders.uniforms.uDpr,dpr);
 gl.drawArrays(gl.POINTS,0,all.length);
}
function drawFallback(visible){if(!fallbackCanvas)return;fallbackCanvas.clearRect(0,0,canvas.width,canvas.height);fallbackCanvas.save();fallbackCanvas.scale(dpr,dpr);for(const n of visible){const p=project(n.position),r=n.major?33:Math.max(4,n.size*.65);let gradient=fallbackCanvas.createRadialGradient(p.x,p.y,2,p.x,p.y,r);gradient.addColorStop(0,hexrgba(n.color,n.alpha));gradient.addColorStop(1,hexrgba(n.color,0));fallbackCanvas.fillStyle=gradient;fallbackCanvas.beginPath();fallbackCanvas.arc(p.x,p.y,r,0,Math.PI*2);fallbackCanvas.fill()}fallbackCanvas.restore()}
const labelCache=new Map();function paintLabels(visible){const cont=el('labels'),ids=new Set();
 for(const n of visible){if(n.size<10&& !n.major)continue;const p=project(n.position);if(p.x<15||p.x>width-15||p.y<65||p.y>height-20)continue;ids.add(n.id);let node=labelCache.get(n.id);if(!node){node=document.createElement('div');node.className='node-label';cont.appendChild(node);labelCache.set(n.id,node)}
 node.className='node-label'+(n.major?' main':'')+(n.selected?' selected':'');
 if(n.major){const c=E.groups.get(n.cluster);node.innerHTML=`${safe(c.name)}<span class="tag-en">${safe(c.en)}</span>`}else node.textContent=n.name;
 node.style.transform=`translate3d(${p.x}px,${p.y+(n.major?48:25)*Math.min(1.4,p.scale/160)}px,0) translate(-50%,0)`;
 node.style.opacity=String(n.alpha);node.style.color=n.selected?'#efffff':n.major?n.color:'#c1e6f6';node.style.display='block';
 }
 for(const [id,node] of labelCache)if(!ids.has(id))node.style.display='none';}
function tick(t){S.frame++;interpolate();const vis=displayNodes();drawGL(vis);drawOverlay(t,vis);paintLabels(vis);requestAnimationFrame(tick)}requestAnimationFrame(tick);
function navigationUI(){const counts=E.clusterCounts();const sym={industry:'◈',life:'◉',tourism:'⌁',agriculture:'✳',external:'⟷'};el('clusterOptions').innerHTML=counts.map(c=>`<button class="cluster-option ${S.focusCluster===c.id?'active':''}" data-cluster="${c.id}" style="--hue:${c.color}"><span class="cluster-symbol">${sym[c.id]}</span><span><b>${c.name}</b><small>${c.desc}</small></span><span class="cluster-count">${c.nodes.toString().padStart(2,'0')}</span></button>`).join('');
 all('.cluster-option').forEach(x=>x.addEventListener('click',()=>openCluster(x.dataset.cluster)));
 el('backButton').disabled=!S.focusCluster;
 el('dockTitle').textContent=S.selected?E.nodeMap.get(S.selected)?.name:S.focusCluster?E.groups.get(S.focusCluster)?.name:'全景宇宙';
 el('dockSubtitle').textContent=S.selected?'探索已收录联系':S.focusCluster?'选择节点继续探索':'5 组星群 · 点击进入';
 el('gradeBadge').textContent=S.grade==='all'?'全部':S.grade+'级';
 all('.mode-tab').forEach(b=>{let active=b.dataset.mode===S.mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});
 const sub=S.focusCluster?E.groups.get(S.focusCluster):null;
 el('sceneHeadline').innerHTML=S.mode==='scenario'?'未知不是空白，<br/>而是新的入口。':S.mode==='flows'?'追踪联系，<br/>不伪装流量。':S.selected?safe(E.nodeMap.get(S.selected)?.name||'')+'.':S.focusCluster?safe(sub?.name||'')+' · 深入': '五个世界，<br/>一座博罗。';
 el('sceneSub').textContent=S.mode==='scenario'?'手动改变研究假设，观察加权网络怎样变化。':S.mode==='flows'?'目前没有可核实的人流OD；仅展示关系，不渲染虚构客流。':S.selected?'点选相关节点继续追踪；切换透镜不会丢失焦点。':S.focusCluster?'点击光点查看有依据的主体与关联；拖动可旋转观察。':'轻触任意星群，沿公开资料中的联系继续探索。';
 el('inspectorMode').textContent=S.mode==='scenario'?'◆ 用户假设':S.mode==='flows'?'◇ 数据边界':'● 资料快照';
 inspector();}
function openCluster(id){S.focusCluster=id;S.selected=null;S.aim=E.groups.get(id).pos.slice();S.targetDistance=4.9;S.seen=true;navigationUI();if(width<721)closeMobile();toast('已进入 '+E.groups.get(id).name+' 星群')}
function openNode(id){const n=E.nodeMap.get(id);if(!n)return;S.selected=id;S.focusCluster=n.cluster;S.aim=G.positions.get(id).slice();S.targetDistance=4.6;navigationUI();if(width<721)openMobile();toast('选中 · '+n.name)}
function home(){S.mode='universe';S.focusCluster=null;S.selected=null;S.aim=[0,0,0];S.targetDistance=6.9;S.grade='all';G=E.compute(S.uncertainty,S.grade);navigationUI();closeMobile()}
function previous(){if(S.selected){S.selected=null;S.aim=E.groups.get(S.focusCluster).pos.slice();S.targetDistance=4.9}else if(S.focusCluster)home();navigationUI()}
function nextGrade(){const vals=['all','A','B','C'];S.grade=vals[(vals.indexOf(S.grade)+1)%vals.length];G=E.compute(S.uncertainty,S.grade);navigationUI();toast('关系证据筛选：'+(S.grade==='all'?'全部':S.grade+'级'))}
function mode(m){S.mode=m;if(m==='scenario'&&!S.focusCluster){S.focusCluster='industry';S.selected='htd';S.aim=G.positions.get('htd').slice();S.targetDistance=5.3}if(m==='relations'&&!S.focusCluster){S.focusCluster='industry';S.aim=E.groups.get('industry').pos.slice();S.targetDistance=5}navigationUI();if(width<721&&(m==='scenario'||m==='flows'))openMobile()}
function inspector(){let html='', node=focusedNode(), cluster=S.focusCluster?E.groups.get(S.focusCluster):null;
 const origSource=`<div class="inspector-footer">数据快照：${safe(D.snapshot)}<br/>来源：<a href="${D.sourceRepo}" target="_blank" rel="noreferrer"><u>原版仓库 ↗</u></a><br/>原版证据级别不代表本原型重新独立核验。</div>`;
 if(S.mode==='scenario'){
   const pair=E.intervalComparison();const total=G.totalWeight.toFixed(2),rank=G.top.filter(x=>x[1]>0).slice(0,3);
   html=`<div class="inspector-title">未知区间实验</div><p class="inspector-summary">调整 B/C 级关系的<span style="color:#f4c98e">假设权重</span>，图中的布局与加权连接值由计算函数即时重算。</p>
   <span class="status-tag status-B">探索假设 · 非观测概率</span><div class="scenario-panel"><div class="scenario-range"><span>假设强度</span><b id="scenarioValue">${Math.round(S.uncertainty*100)} / 100</b></div>
   <input class="scenario-slider" type="range" id="scenarioSlider" min="0" max="100" value="${Math.round(S.uncertainty*100)}" step="1" aria-label="B/C关系假设强度"/>
   <div class="scenario-presets"><button data-scenario=".16" class="${S.uncertainty===.16?'active':''}">低</button><button data-scenario=".50" class="${S.uncertainty===.50?'active':''}">中</button><button data-scenario=".88" class="${S.uncertainty===.88?'active':''}">高</button></div>
   <div class="scenario-compare"><div><small>当前加权联系总值</small><b id="scenarioTotal">${total}</b></div><div><small>参与计算的关系数</small><b>${G.edgeCount} 条</b></div></div>
   <p class="source-label" style="margin-top:13px">这些是研究实验中的抽象连接权重，不代表真实通勤人数、货流吨数或经济增量。</p></div>
   <div class="inspector-divider"></div><div class="panel-section-title">哪些主体更靠近网络中心？</div><div id="rankList" class="neighbor-list">${rank.map(([id,score],i)=>`<button class="neighbor-btn" data-node="${safe(id)}"><b>${i+1}. ${safe(E.nodeMap.get(id)?.name||id)}</b><small>${score.toFixed(2)}</small></button>`).join('')}</div>
   <div class="muted-note">该加权指标取决于人为设置的 A/B/C 映射，不是经经验标定的现实强度；更改假设不改变真实资料。</div>`;
 }else if(S.mode==='flows'){
   html=`<div class="inspector-title">流动观察</div><p class="inspector-summary">我们希望观察工作、游客、物流、信息等流动，但目前原版主要提供主体关联，尚不足以重建真实的镇际通勤、游客来源地与货运量。</p><span class="status-tag status-D">OD 数据尚缺失</span><div class="inspector-divider"></div><div class="panel-section-title">现阶段可以查看</div><div class="detail-rows"><div class="detail-row"><small>支持</small><b>既有产业联系、区域联系、公开活动信息</b></div><div class="detail-row"><small>未知</small><b>工作日跨界人数、货流强度与方向性规模</b></div><div class="detail-row"><small>下一步</small><b>公开道路流量、合法匿名聚合数据、代表性抽样</b></div></div><div class="muted-note">画面虚线属于关联可视化，不代表已实测的人流向。点击“未知实验”可操作一个明确标注的权重假设。</div><button class="inspection-link" id="goScenario" style="width:100%;margin-top:20px">进入未知区间实验 ↗</button>`;
 }else if(node){
   const near=G.edges.filter(e=>e.source===node.id||e.target===node.id).sort((a,b)=>a.level.localeCompare(b.level));const counts={A:near.filter(x=>x.level==='A').length,B:near.filter(x=>x.level==='B').length,C:near.filter(x=>x.level==='C').length};
   let town=D.towns.find(t=>t.name===node.town);
   html=`<div class="inspector-title">${safe(node.name)}</div><span class="status-tag status-${node.editorial?'D':'A'}">${node.editorial?'镇街专题资料 · 待核实':'原版已收录节点'}</span><p class="inspector-summary">${safe(node.desc)}</p><div class="detail-rows"><div class="detail-row"><small>相关镇域</small><b>${safe(node.town)}</b></div><div class="detail-row"><small>分类</small><b>${safe(E.groups.get(node.cluster)?.name)}</b></div><div class="detail-row"><small>直接联系</small><b>${near.length} 条（A ${counts.A} / B ${counts.B} / C ${counts.C}）</b></div></div>`;
   if(town)html+=`<div class="scenario-panel"><b style="font-size:12px">${safe(town.name)} · 生活层</b><p class="source-label" style="margin-top:7px">${safe(town.tag)} · ${safe(town.food)} · ${safe(town.play)}</p><small style="color:#e6be7b">原版 life.json 对该条目标记 pending，内容待逐条核查</small></div>`;
   html+=`<div class="inspector-divider"></div><div class="panel-section-title">继续沿关系探索 <span>${near.length} 条</span></div><div class="neighbor-list">`;
   html+=near.length?near.map(e=>{let id=e.source===node.id?e.target:e.source;return `<button class="neighbor-btn" data-node="${safe(id)}" title="${safe(e.detail)}"><b>${safe(E.nodeMap.get(id)?.name||id)}</b><small class="status-tag status-${e.level}">${e.level}级</small></button>`}).join(''):`<div class="muted-note">当前证据筛选下没有相连主体。可切换“证据筛选”查看其他等级。</div>`;
   html+=`</div><div class="inspector-divider"></div><p class="source-label">关系来自原版 network.html；A/B/C 为原版标记。某些原版“供应链”关系仅说明产业关联，不等于已核实直接采购合同。</p>`;
 }else if(cluster){const nodes=E.dataNodes.filter(n=>n.cluster===cluster.id),relations=D.edges.filter(e=>E.nodeMap.get(e.source)?.cluster===cluster.id||E.nodeMap.get(e.target)?.cluster===cluster.id);
  html=`<div class="inspector-title">${safe(cluster.name)}</div><p class="inspector-summary">${safe(cluster.desc)}。点击其中的光点，展开具体节点及原版已收录的联系。</p><div class="mini-stats"><div class="mini-stat"><b>${nodes.length}</b><small>收录节点 / 专题</small></div><div class="mini-stat"><b>${relations.length}</b><small>涉及的原版关系</small></div></div><div class="panel-section-title">星群内的对象</div><div class="neighbor-list">${nodes.map(n=>`<button class="neighbor-btn" data-node="${safe(n.id)}"><b>${safe(n.name)}</b><small>${safe(n.town)}</small></button>`).join('')}</div>`;
 }else{
  const c=E.clusterCounts();
  html=`<div class="inspector-title">博罗 · 数据星系</div><p class="inspector-summary">五组功能星群构成抽象空间。这里的远近表达观察结构，不代表地理距离。</p><div class="mini-stats"><div class="mini-stat"><b>${D.nodes.length}</b><small>原版网络主体</small></div><div class="mini-stat"><b>${D.edges.length}</b><small>原版关系记录</small></div><div class="mini-stat"><b>${D.towns.length}</b><small>镇街生活条目</small></div><div class="mini-stat"><b>${D.hot.length}</b><small>精选快照话题</small></div></div><div class="inspector-divider"></div><div class="panel-section-title">一组值得注意的反差</div><div class="metric-highlight"><strong>+${D.stats.industryGrowth2026_1_8}%</strong><small>2026年1—8月规上工业增加值同比</small></div><div class="metric-highlight negative"><strong>${D.stats.industrialInvestmentGrowth2026_1_8}%</strong><small>同期工业投资同比</small></div><div class="muted-note">两个指标口径不同，不能相减。它们作为全县统计事实，不映射为各镇热力。</div><div class="inspector-divider"></div><div class="panel-section-title">最近收录的动态</div>${D.hot.slice(0,2).map(h=>`<a class="inspection-link" href="${safe(h.url)}" target="_blank" rel="noreferrer">${safe(h.title)} ↗<br/><small style="color:#7b9faf">${safe(h.source)} · ${safe(h.status)}</small></a>`).join('')}`;
 }
 el('inspectorBody').innerHTML=html+origSource;
 all('[data-node]').forEach(b=>b.addEventListener('click',()=>openNode(b.dataset.node)));
 el('goScenario')?.addEventListener('click',()=>mode('scenario'));
 const slider=el('scenarioSlider');if(slider){slider.addEventListener('input',()=>{S.uncertainty=Number(slider.value)/100;G=E.compute(S.uncertainty,S.grade);el('scenarioValue').textContent=Math.round(S.uncertainty*100)+' / 100';el('scenarioTotal').textContent=G.totalWeight.toFixed(2);all('[data-scenario]').forEach(b=>b.classList.remove('active'));if(S.selected&&G.positions.has(S.selected))S.aim=G.positions.get(S.selected).slice();});all('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{S.uncertainty=Number(b.dataset.scenario);G=E.compute(S.uncertainty,S.grade);inspector();if(S.selected)S.aim=G.positions.get(S.selected).slice()}))}
}
function openMobile(){S.mobileOpen=true;el('inspector').classList.add('mobile-open');el('mobileInfoButton').textContent='关闭详情 ↓'}
function closeMobile(){S.mobileOpen=false;el('inspector').classList.remove('mobile-open');el('mobileInfoButton').textContent='数据详情 ↑'}
let pointer={x:0,y:0,dist:0};
function chooseAt(x,y){const candidates=displayNodes().map(n=>({...n,p:project(n.position)})).filter(n=>n.alpha>.3);
  candidates.sort((a,b)=>{const da=Math.hypot(a.p.x-x,a.p.y-y),db=Math.hypot(b.p.x-x,b.p.y-y);return da-db});
  let v=candidates[0];if(!v)return;let dist=Math.hypot(v.p.x-x,v.p.y-y);let max=v.major?68:Math.max(18,v.size*1.3);if(dist>max)return;
  if(v.id.startsWith('cluster:'))openCluster(v.cluster);else openNode(v.id);
}
canvas.addEventListener('pointerdown',e=>{S.drag=true;S.moved=false;pointer.x=e.clientX;pointer.y=e.clientY;pointer.dist=0;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!S.drag)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.dist+=Math.abs(dx)+Math.abs(dy);if(pointer.dist>6)S.moved=true;S.yaw+=dx*.004;S.pitch=E.clamp(S.pitch+dy*.003,-1.12,1.12);pointer.x=e.clientX;pointer.y=e.clientY});
canvas.addEventListener('pointerup',e=>{if(!S.moved)chooseAt(e.clientX,e.clientY);S.drag=false});canvas.addEventListener('pointercancel',()=>{S.drag=false});
canvas.addEventListener('wheel',e=>{e.preventDefault();S.targetDistance=E.clamp(S.targetDistance+Math.sign(e.deltaY)*.35,3.3,11)},{passive:false});
let touchLast=0;canvas.addEventListener('touchmove',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];const dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(touchLast)S.targetDistance=E.clamp(S.targetDistance+(touchLast-dist)*.012,3.3,11);touchLast=dist}},{passive:true});canvas.addEventListener('touchend',()=>touchLast=0);
all('.mode-tab').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.mode)));
el('homeBtn').onclick=home;el('zoomIn').onclick=()=>S.targetDistance=E.clamp(S.targetDistance-.45,3.3,11);el('zoomOut').onclick=()=>S.targetDistance=E.clamp(S.targetDistance+.45,3.3,11);el('autoRotate').onclick=()=>{S.rotate=!S.rotate;el('autoRotate').setAttribute('aria-pressed',String(S.rotate));toast(S.rotate?'自动旋转已开启':'自动旋转已关闭')};
el('backButton').onclick=previous;el('depthButton').onclick=()=>{if(!S.focusCluster){openCluster('industry');return}if(S.mode!=='relations'){mode('relations');return}if(S.selected){S.targetDistance=E.clamp(S.targetDistance-.5,3.4,11);toast('已展开两度联系')}else toast('请先选择一个节点')};el('evidenceButton').onclick=nextGrade;el('mobileInfoButton').onclick=()=>S.mobileOpen?closeMobile():openMobile();
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(S.mobileOpen)closeMobile();else previous()}if(e.key==='+'||e.key==='=')S.targetDistance=E.clamp(S.targetDistance-.35,3.3,11);if(e.key==='-')S.targetDistance=E.clamp(S.targetDistance+.35,3.3,11)});
// Safe browser-visible debug interface used by automated smoke tests. No secrets exposed.
window.__boluoDebug={get state(){return {mode:S.mode,focusCluster:S.focusCluster,selected:S.selected,grade:S.grade,uncertainty:S.uncertainty,score:G.totalWeight,webgl:!!gl}},getGraph:()=>({nodes:G.nodes.length,edges:G.edges.length,grades:G.edges.reduce((o,e)=>(o[e.level]=(o[e.level]||0)+1,o),{})}),openCluster,openNode,mode,home,setScenario:v=>{S.uncertainty=E.clamp(v,0,1);G=E.compute(S.uncertainty,S.grade);inspector();},getBounds:()=>({width,height})};
navigationUI();if(!gl){toast('设备不支持WebGL2，已启用二维节点备选渲染')}console.log('博罗 V2 全息探索原型 M1；数据快照：',D.snapshot,'节点',D.nodes.length,'关系',D.edges.length);
})();
