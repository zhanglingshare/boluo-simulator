/* Context-sensitive blindspot rail for the 01–05 reality journey.
   Does not infer event identity from a news topic/town. Open on deliberate user action. */
(function(){
'use strict';
const pg=document.body?.getAttribute('data-bl-journey');
if(!['today','town','changes','basic','comparison'].includes(pg))return;
const $=x=>document.querySelector(x),$all=s=>[...document.querySelectorAll(s)];
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x;};
const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
const valid=x=>/^C\d{3}$/.test(x||'')?x:'';
let id=valid(hash.get('change')||params.get('change')),firstAutomatic=(!!(params.get('topic')||params.get('town'))&&!id),loaded=null,open=false;
const trigger=el('button','ibi-trigger','盲区观察');trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
const count=el('span','ibi-counter','?');trigger.append(count);
const panel=el('aside','ibi-panel');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','当前结构事件盲区');
const heading=el('div','ibi-heading'),title=el('strong',null,'盲区不是缺陷，是下一条线索'),close=el('button','ibi-close','×');close.type='button';close.setAttribute('aria-label','关闭盲区');
heading.append(title,close);
const status=el('div','ibi-status','只有选中已收录的结构事件，才能显示对应证据盲区。');
const host=el('div','ibi-list'),more=el('a','ibi-open-lab','进入完整情报实验台 →'),foot=el('p','ibi-foot','事实、间接推断和假设分开显示；这是证据清单，不是系统自动作出的因果判断。');
more.href='intel-lab.html';
panel.append(heading,status,host,more,foot);
document.body.append(trigger,panel);
function setOpen(on){
 open=on;panel.hidden=!on;trigger.setAttribute('aria-expanded',String(on));
 if(on)refresh();
}
trigger.addEventListener('click',()=>setOpen(!open));
close.addEventListener('click',()=>setOpen(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){setOpen(false);trigger.focus();}});
function updateLink(){const target='intel-lab.html'+(id?'?change='+encodeURIComponent(id):'');more.href=target;document.querySelectorAll('[data-bl-intel-link]').forEach(a=>a.href=target);count.textContent=id?'!':'?';}
function select(event){
 const next=valid(event?.detail?.changeId);if(!next)return;
 if(firstAutomatic){firstAutomatic=false;return;}
 if(id===next)return;
 id=next;updateLink();if(open)refresh();
}
document.addEventListener('bl:change-selected',select);
document.addEventListener('bl:compare-selected',select);
window.addEventListener('hashchange',()=>{
 const p=new URLSearchParams(location.hash.slice(1)),next=valid(p.get('change'));
 if(next&&next!==id){id=next;firstAutomatic=false;updateLink();if(open)refresh();}
});
async function data(){
 if(!loaded)loaded=Promise.all(['evidence','changes','sources'].map(name=>
  fetch('data/relationship-'+name+'-v1.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})))
 .catch(err=>{loaded=null;throw err;});
 return loaded;
}
async function refresh(){
 host.replaceChildren();
 updateLink();
 if(!id){
  status.textContent='当前尚未绑定结构事件。新闻、镇街生活观察不自动等于已验证的产业关系。';
  const hint=el('a','ibi-prompt','先进入 03 选择真实变化 →');hint.href='industry-changes.html';
  host.append(hint);return;
 }
 status.textContent='正在核对 '+id+' 对应的证据与限制…';
 if(!window.BoluoIntelEngine){status.textContent='证据引擎未加载，不能自动生成盲区。';return;}
 const selected=id;
 try{
  const [ev,ch,src]=await data();
  if(id!==selected||!open)return;
  const s=window.BoluoIntelEngine.load(ev,ch,src,id);
  const pivot=s.model.coreIds[0]||s.model.nodes[0].id;
  const r=window.BoluoIntelEngine.inspect(s,{mode:'ABC',pivot});
  status.textContent=id+' · '+s.model.event.title;
  const list=r.blindspots.slice(0,4);
  list.forEach((item,i)=>{
   const row=el('div','ibi-item'),tag=el('small',null,item.kind+' · '+(item.grade==='未知'?'证据待补':'证据'+item.grade+'级'));
   row.append(tag,el('strong',null,item.title),el('p',null,item.note));host.append(row);
  });
  if(r.blindspots.length>4)host.append(el('p','ibi-remain','另有 '+(r.blindspots.length-4)+' 个限制或待核验点，进入完整实验台继续查看。'));
 }catch(e){status.textContent='来源库读取失败：'+e.message+'。无法核验时不填充猜测。';}
}
updateLink();
})();