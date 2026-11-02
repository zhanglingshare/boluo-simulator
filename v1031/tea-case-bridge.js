/* V1031的真实柏塘案例：问题→可核算的目标约束→完整模型。仅博罗，原版县级计算不变。 */
(function(){
'use strict';
if(!window.V1031_PROFILE||window.V1031_PROFILE.key!=='bl'||!window.BoluoCaseBridge)return;
const bridge=window.BoluoCaseBridge;
const slot=document.createElement('section');slot.id='teaCaseSlot';slot.className='tea-case-experience';slot.setAttribute('aria-label','柏塘山茶现实实验');
const parent=document.querySelector('#discover .card');if(parent)parent.insertAdjacentElement('afterend',slot);
function focus(){return document.querySelector('#topicGrid .topic.selected')?.dataset.id||new URLSearchParams(location.search).get('focus')||'money'}
function scene(){return document.querySelector('#sceneGrid .scene.active')?.dataset.scene||new URLSearchParams(location.search).get('scene')||'base'}
function currentView(){return document.querySelector('main .view.active')?.id||'discover'}
function link(page,metric,view){return bridge.entry('v1031',{page,metric,focus:focus(),scene:scene(),returnView:view||currentView()})}
function launch(page,metric,view){location.assign(link(page,metric,view))}
function paint(){
 const show=['money','travel'].includes(focus());
 slot.hidden=!show;
 if(!show)return;
 slot.innerHTML='<div class="tea-case-label"><span class="tea-case-beacon"></span> 现实产业样本 · 柏塘山茶 · 2030</div>'+
 '<div class="tea-case-top"><div><h3>游客增长了，钱就一定留下了吗？</h3><p>用一个真实的镇试试。先看公开数据与2030目标的差距，再进入产业风洞，让几千条模型路径检验不同选择。</p></div><div class="tea-case-metric"><small>2025报道</small><strong>130万+</strong><span>全镇游客人次</span></div><div class="tea-case-metric gold"><small>2030提出的目标</small><strong>350万+</strong><span>目标不是预测</span></div></div>'+
 '<div class="tea-case-experiment"><div><label for="teaGrowth">先猜：如果游客每年增长 <b id="teaRate">12%</b></label><input id="teaGrowth" type="range" min="0" max="30" step="1" value="12"><small>拖动试试。这里仅按复利算术计算，不是蒙特卡洛概率。</small></div><div class="tea-case-result"><span>2030年对应游客</span><b id="teaPreview">—</b><small id="teaTargetGap"></small></div></div>'+
 '<div class="tea-case-actions"><button type="button" id="teaOpenLab">进入柏塘模型，看看真正的结果分布 →</button><button type="button" id="teaOpenMechanism">先看产业关系</button></div>'+
 '<div class="tea-case-foot">依据为柏塘镇2025游客约130万人次、2030目标350万人次的公开报道。消费留存缺直接台账，不能用游客数量推算茶农实际收入。</div>';
 const slider=slot.querySelector('#teaGrowth');
 function calc(){const p=Number(slider.value),visits=130*Math.pow(1+p/100,5);slot.querySelector('#teaRate').textContent=p+'%';slot.querySelector('#teaPreview').textContent=Math.round(visits)+'万人次';slot.querySelector('#teaTargetGap').textContent=visits>=350?'超过350万游客目标的算术门槛':'距350万目标还差约'+Math.max(0,Math.round(350-visits))+'万人次'}
 slider.addEventListener('input',calc);calc();
 slot.querySelector('#teaOpenLab').addEventListener('click',()=>launch('lab','visitorsWan','discover'));
 slot.querySelector('#teaOpenMechanism').addEventListener('click',()=>launch('mechanism','visitorsWan','discover'));
}
document.addEventListener('click',e=>{if(e.target.closest('#topicGrid .topic'))paint()});
paint();
const library=document.getElementById('libraryLinks');
if(library){const a=document.createElement('a');a.href=link('lab','visitorsWan','library');a.textContent='柏塘茶2030 · 真实产业深潜实验 ↗';a.className='tea-library-link';a.addEventListener('click',e=>{e.preventDefault();launch('lab','visitorsWan','library')});library.appendChild(a)}
const reveal=document.querySelector('#reveal .revealgrid');
if(reveal){const card=document.createElement('div');card.className='card tea-reveal';card.innerHTML='<div class="sectionmini">真实案例 / 柏塘山茶</div><h3>游客多，不等于茶叶卖得多。</h3><p>从柏塘现有证据出发，观察游客目标、茶旅消费、B端原料茶与加工之间还缺哪些数据。</p><button type="button" class="tea-reveal-go">进入产业结构实验 →</button>';reveal.insertAdjacentElement('afterend',card);card.querySelector('button').onclick=()=>launch('mechanism','visitorsWan','reveal')}
})();
