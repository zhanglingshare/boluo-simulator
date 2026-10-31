(function plainSupport(){
'use strict';
const GUIDE={
'index.html':['今天博罗有什么事？','先看最新消息，再看事情可能影响谁。','消息发生不等于影响已经出现。'],
'holo-home-v10.html':['看谁和谁的联系变了','点一个事件，再看它牵动哪些企业、道路和人。','图上的线是关系线索，不一定是真实订单。'],
'town.html':['各个镇有什么好吃好玩？','点一个镇，再看当季吃的和想去的地方。','人气是参考，不是真实人数。'],
'network.html':['博罗的工厂和生意怎样连起来？','先挑你关心的主体，再看它和谁相连。','有线不等于一定有生意。'],
'who.html':['博罗现在有多少家底？','先看三个最大的数字，再比较工业和投资。','不同统计数字不能直接相加。'],
'choices.html':['博罗下一步靠哪几条路？','把五条路线打开或关闭，看看少一条会怎样。','这是模型试验，不是在现实中关厂。'],
'future.html':['博罗到2030年可能是什么样？','看中间结果，也看偏低和偏高的结果。','模型里出现多少次，不等于现实成功概率。'],
'windtunnel.html':['如果计划没按时完成呢？','动一动参数，看看结果和原来差多少。','改变的是假设，不是现实。'],
'blindspot.html':['哪些重要的事容易漏看？','点开每张发现，看看另一种可能。','看到相关，不等于证明原因。'],
'report.html':['完整报告怎样读？','先看结论，再看图、数字、依据和不确定的地方。','详细分析都保留，不能把目标当成绩。'],
'ending.html':['为什么要做这个风洞？','读完回到自己关心的问题，再试一次。','系统提供选择，不替你做决定。'],
'role.html':['换个身份体验博罗','选一个身份，看看你更在意哪些变化。','不同人的感受，不代表数据结论不同。'],
'lab.html':['深入做一次实验','自己动手试条件，再比较运行结果。','演示不能取代真实调查。'],
'step2.html':['继续体验变化','跟着原来的操作步骤玩，遇到难词点解释。','原有内容与互动完整保留。']
};
const TERMS=[
['P10/P50/P90','偏低／中间／偏高的结果（P10/P50/P90）'],
['规上工业增加值','规模较大的工厂新创造的价值（规上工业增加值）'],
['规模以上工业增加值','规模较大的工厂新创造的价值（规模以上工业增加值）'],
['固定资产投资','建工厂、修道路等长期投资（固定资产投资）'],
['房地产开发投资','建房等项目投入的钱（房地产开发投资）'],
['三次产业结构','农业、工业和服务业分别占多少（三次产业结构）'],
['产业网络','企业、道路和产业之间的联系（产业网络）'],
['产业链','生产与配套的上下游（产业链）'],
['链主企业','能带动很多上下游的大企业（链主企业）'],
['敏感性排序','哪个条件更能改变结果（敏感性排序）'],
['参数敏感性','条件一变化，结果跟着变多少（参数敏感性）'],
['蒙特卡洛','让电脑反复试很多种情况（蒙特卡洛）'],
['命中率','模型里达到参考线的比例（命中率）'],
['达标率','模型里达到参考线的比例（达标率）'],
['中位数','排在中间的结果（中位数）'],
['分位数','按高低排队后的位置（分位数）'],
['P10','偏低位置（P10）'],['P50','中间位置（P50）'],['P90','偏高位置（P90）'],
['反事实','假如没有发生这件事（反事实）'],
['情景推演','按不同假如试未来（情景推演）'],
['压力测试','假如遇到难关会怎样（压力测试）'],
['决策推演','先试不同可能，再做判断（决策推演）'],
['模型口径','这套计算怎么算、算的是什么（模型口径）'],
['基准情景','原来设定的情况（基准情景）'],
['结构变化','谁和谁的联系发生了变化（结构变化）'],
['结构传导','一件事还可能影响哪些人和地方（结构传导）'],
['关系强度','两边联系有多紧（关系强度）'],
['投资强度','投了多少、投入有多大（投资强度）'],
['相关系数','两件事常不常一起变化（相关系数）'],
['三产','服务业等第三产业（三产）'],
['一产','农业等第一产业（一产）'],
['二产','工业和建筑业等第二产业（二产）']
];
const filename=window.__PLAIN_ORIGINAL__||location.pathname.split('/').pop()||'index.html';
const info=GUIDE[filename]||GUIDE['index.html'];
const originals=new WeakMap();
let simple=true,scheduled=false,observer=null;
function skipped(n){const p=n.parentElement;return !p||p.closest('script,style,noscript,textarea,pre,code,svg,canvas,option,select,.plain-layer,[contenteditable="true"]');}
function simplified(str){let out='',p=0;while(p<str.length){let found=null;for(const x of TERMS){if(str.startsWith(x[0],p)){found=x;break;}}if(found){out+=found[1];p+=found[0].length;}else{out+=str.charAt(p);p++;}}return out;}
function simplified(str){return str.replace(termRegex,t=>lookup.get(t)||t);}
function setText(n){if(skipped(n))return;let raw=originals.get(n);
if(raw===undefined){raw=n.nodeValue;originals.set(n,raw);}
else if(n.nodeValue!==raw && n.nodeValue!==simplified(raw)){raw=n.nodeValue;originals.set(n,raw);}
const v=simple?simplified(raw):raw;if(n.nodeValue!==v)n.nodeValue=v;
}
function rewrite(root){if(!root)return;if(root.nodeType===3){setText(root);return;}if(root.nodeType!==1&&root.nodeType!==9)return;
if(root.nodeType===1&&root.closest('.plain-layer,script,style,svg,canvas,pre,code,textarea,select'))return;
const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,count=0;
while((n=walk.nextNode())){setText(n);if(++count>20000)break;}
}
function fixLinks(root){
const links=(root.matches?.('a[href]')?[root]:[]).concat([...root.querySelectorAll?.('a[href]')||[]]);
for(const a of links){
const href=a.getAttribute('href')||'';
if(href.startsWith('#')&&href.length>1&&!a.closest('.plain-layer')){a.setAttribute('href',location.pathname+location.search+href);continue;}
const found=href.match(/^(\.\/)?([a-z0-9-]+\.html)([?#].*)?$/i);
if(found&&GUIDE[found[2]]&&a.dataset.plainLink!=='yes'){
a.setAttribute('href','easy/full/'+found[2]+(found[3]||''));a.dataset.plainLink='yes';
}
}
}
function refresh(){
scheduled=false;observer?.disconnect();
fixLinks(document.body);
rewrite(document.body);
observer?.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
function shell(){
const bar=document.createElement('section');bar.className='plain-layer';bar.setAttribute('aria-label','通俗解释与完整版导航');
const title=document.createElement('div');title.className='plain-main';
const h=document.createElement('div');h.className='plain-lead';h.textContent='这一页讲什么？ '+info[0];
const sub=document.createElement('div');sub.className='plain-sub';sub.textContent=info[1];
title.append(h,sub);
const actions=document.createElement('div');actions.className='plain-actions';
const lang=document.createElement('button');lang.type='button';lang.className='plain-btn plain-switch';lang.textContent='看原话';lang.setAttribute('aria-pressed','true');
lang.onclick=()=>{simple=!simple;lang.textContent=simple?'看原话':'换成通俗话';lang.setAttribute('aria-pressed',String(simple));schedule();};
const list=document.createElement('a');list.className='plain-btn';list.href='easy/index.html';list.textContent='全部页面';
const original=document.createElement('a');original.className='plain-btn plain-original';original.href=filename;original.textContent='打开原版';
const glossary=document.createElement('button');glossary.className='plain-btn';glossary.type='button';glossary.textContent='难词解释';glossary.setAttribute('aria-expanded','false');
actions.append(lang,glossary,list,original);
bar.append(title,actions);
const helper=document.createElement('div');helper.className='plain-glossary';helper.hidden=true;
const head=document.createElement('p');head.textContent='遇到这些词，可以这样理解：';
helper.append(head);
for(const [a,b] of TERMS.slice(0,17)){const d=document.createElement('div');d.className='plain-term';const t=document.createElement('b');t.textContent=a;const p=document.createElement('span');p.textContent=b;d.append(t,p);helper.append(d);}
const note=document.createElement('p');note.className='plain-disclaimer';note.textContent=info[2];bar.append(note);
bar.append(helper);
glossary.onclick=()=>{helper.hidden=!helper.hidden;glossary.setAttribute('aria-expanded',String(!helper.hidden));};
document.body.insertBefore(bar,document.body.firstChild);
return bar;
}
function init(){
if(document.body.dataset.plainLoaded)return;document.body.dataset.plainLoaded='1';shell();fixLinks(document.body);rewrite(document.body);
observer=new MutationObserver(muts=>{
let changed=false;
for(const m of muts){if(m.target?.parentElement?.closest?.('.plain-layer'))continue;changed=true;break;}
if(changed)schedule();
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();