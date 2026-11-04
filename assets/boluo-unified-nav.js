/* BOLUO one navigation system / 2026-11-04
   Navigation only: no model, data, chart or page content updates. */
(function(){
"use strict";
var script=document.currentScript;
if(!script||!script.src||!document.body)return;
var base=new URL("../",script.src);
var entries=[
 {id:"overview",num:"01",name:"总览",desc:"今天有什么变化、它牵动了谁",pages:[["总览·变化现场","holo-home-v11.html"],["今日博罗","index-legacy-2026-11-03.html"],["各镇好玩好吃","town.html"],["产业变化","industry-changes.html"]]},
 {id:"foundation",num:"02",name:"基本盘",desc:"看清家底，再看哪些联系真正成立",pages:[["博罗基本盘","who-v2.html"],["结构怎么长起来","network.html"],["五个世界","experiments/holo-single/index-v2.html"],["关系前后","relation-compare-v2.html"],["柏塘镇样板","tea/index.html"]]},
 {id:"future",num:"03",name:"未来",desc:"推演不同条件下的可能结果",pages:[["风洞测试","windtunnel-v2.html"],["2030未来","future.html"],["规划与你","plan-with-me.html"],["五条发展路","choices.html"]]},
 {id:"report",num:"04",name:"报告",desc:"把发现、盲点与依据放到一起",pages:[["可能忽略","blindspot.html"],["图文报告","report.html"]]},
 {id:"ending",num:"05",name:"结语",desc:"给桥，怎么走由你决定",pages:[["结语","ending.html"]]}
];
var all={};entries.forEach(function(g){g.pages.forEach(function(p){all[p[1]]=g.id;});});
all["windtunnel-nba-preview.html"]="future";
all["future-lab.html"]="lab";
var aliases={
 "index.html":"overview","holo-home-v9.html":"overview",
 "who.html":"foundation","experiments/holo-single/index.html":"foundation",
 "relation-compare.html":"foundation","windtunnel.html":"future"
};
Object.keys(aliases).forEach(function(k){all[k]=aliases[k];});
var rootPath=base.pathname;
var page=decodeURI(location.pathname).replace(rootPath,"")||"index-legacy-2026-11-03.html";
if(page==="index.html")page="holo-home-v11.html";
var initial=all[page]||"find";
var selected=initial==="lab"?"future":initial;
var change=null;
var targetByPage={
 "holo-home-v11.html":["who-v2.html","先看基本盘"],
 "index-legacy-2026-11-03.html":["who-v2.html","先看基本盘"],
 "town.html":["holo-home-v11.html","回到总览"],
 "industry-changes.html":["who-v2.html","放到基本盘中看"],
 "who-v2.html":["windtunnel-v2.html","进入未来推演"],
 "network.html":["experiments/holo-single/index-v2.html","看看五个世界"],
 "experiments/holo-single/index-v2.html":["relation-compare-v2.html","查看关系前后"],
 "relation-compare-v2.html":["windtunnel-v2.html","把变化放进风洞"],
 "windtunnel-v2.html":["report.html","看推演报告"],
 "windtunnel-nba-preview.html":["report.html","看推演报告"],
 "future.html":["report.html","查看图文报告"],
 "plan-with-me.html":["windtunnel-v2.html","进入风洞"],
 "choices.html":["windtunnel-v2.html","试试压力变化"],
 "blindspot.html":["report.html","继续看报告"],
 "report.html":["ending.html","查看结语"],
 "ending.html":["holo-home-v11.html","再从现实出发"],
 "future-lab.html":["holo-home-v11.html","返回博罗总览"]
};
function getChange(){
 var q=new URLSearchParams(location.search).get("change");
 var h=(location.hash||"").match(/(?:^#|[&?])change=(C[0-9]{3})(?:$|[&])/);
 var val=change||q||(h&&h[1])||"";
 return /^C[0-9]{3}$/.test(val)?val:"";
}
function href(file,from){
 var target=new URL(file,base);
 var c=getChange();
 if(c&&["who-v2.html","relation-compare-v2.html","plan-with-me.html"].indexOf(file)!==-1){
  target.searchParams.set("change",c);
 }
 if(file==="industry-changes.html"&&["index-legacy-2026-11-03.html","town.html"].indexOf(from)!==-1){
  target.searchParams.set("from",from==="town.html"?"town":"today");
 }
 if(file==="who-v2.html"&&["industry-changes.html","holo-home-v11.html"].indexOf(from)!==-1)target.searchParams.set("from","changes");
 if(file==="relation-compare-v2.html"&&from==="who-v2.html")target.searchParams.set("from","basic");
 if(file==="plan-with-me.html"&&from==="relation-compare-v2.html")target.searchParams.set("from","comparison");
 return target.href;
}
function el(tag,cls,content){
 var n=document.createElement(tag);
 if(cls)n.className=cls;
 if(content!=null)n.textContent=content;
 return n;
}
var shell=el("header","bl-unav");shell.id="bl-unav";shell.setAttribute("aria-label","博罗统一导航");
var first=el("div","bl-unav-main");
var logo=el("a","bl-unav-brand");logo.href=href("holo-home-v11.html");
logo.append(el("strong",null,"博罗 · 决策风洞"),el("small",null,"总览 → 基本盘 → 未来 → 报告 → 结语"));
first.append(logo);
var stages=el("nav","bl-unav-stages");stages.setAttribute("aria-label","六个认知阶段");
var buttons={};
entries.forEach(function(group){
 var btn=el("button","bl-unav-step");
 btn.type="button";btn.dataset.phase=group.id;
 btn.append(el("span","bl-unav-n",group.num),el("span","bl-unav-stage-name",group.name));
 btn.addEventListener("click",function(){selected=group.id;render();});
 stages.append(btn);buttons[group.id]=btn;
});
stages.addEventListener("keydown",function(ev){
 if(ev.key!=="ArrowRight"&&ev.key!=="ArrowLeft")return;
 var active=document.activeElement;var idx=entries.findIndex(function(g){return g.id===active.dataset.phase;});
 if(idx<0)return;
 ev.preventDefault();
 var next=entries[(idx+entries.length+(ev.key==="ArrowRight"?1:-1))%entries.length];
 buttons[next.id].focus();selected=next.id;render();
});
first.append(stages);
var lab=el("a","bl-unav-lab","探索实验");lab.href=href("future-lab.html");first.append(lab);
shell.append(first);
var second=el("div","bl-unav-sub");
var stageDesc=el("div","bl-unav-desc");
var opts=el("nav","bl-unav-choices");opts.setAttribute("aria-label","当前阶段的观察视角");
var next=el("a","bl-unav-next");
second.append(stageDesc,opts,next);shell.append(second);
document.body.insertBefore(shell,document.body.firstChild);
document.body.classList.add("bl-unav-ready");
document.body.setAttribute("data-bl-unav-page",["experiments/holo-single/index.html","experiments/holo-single/index-v2.html"].includes(page)?"holo":["holo-home-v9.html","holo-home-v11.html"].includes(page)?"atlas":page==="future-lab.html"?"lab":"standard");
function render(){
 var group=entries.find(function(g){return g.id===selected;})||entries[0];
 Object.keys(buttons).forEach(function(id){
  var active=id===selected,own=id===initial;
  buttons[id].classList.toggle("active",active);
  buttons[id].classList.toggle("here",own);
  buttons[id].setAttribute("aria-expanded",String(active));
  if(own)buttons[id].setAttribute("aria-current","step");else buttons[id].removeAttribute("aria-current");
 });
 stageDesc.replaceChildren(el("b",null,group.num+" · "+group.name),el("span",null,group.desc));
 opts.replaceChildren();
 group.pages.forEach(function(entry){
  var a=el("a","bl-unav-view",entry[0]);a.href=href(entry[1],page);
  if(entry[1]===page || (page==="windtunnel-nba-preview.html" && entry[1]==="windtunnel-v2.html")){a.classList.add("current");a.setAttribute("aria-current","page");}
  opts.append(a);
 });
 if(group.id==="foundation"){
  var note=el("span","bl-unav-qualifier","结构生长≠完整历史复原");opts.append(note);
 }
 var cont=targetByPage[page]||["holo-home-v11.html","回到博罗总览"];
 next.href=href(cont[0],page);
 next.textContent="继续 · "+cont[1]+" →";
}
render();
document.addEventListener("bl:change-selected",function(ev){
 var id=ev.detail&&(ev.detail.changeId||ev.detail.change_id);
 if(typeof id==="string"&&/^C[0-9]{3}$/.test(id)){change=id;render();}
});
document.addEventListener("bl:compare-selected",function(ev){
 var id=ev.detail&&(ev.detail.changeId||ev.detail.change_id);
 if(typeof id==="string"&&/^C[0-9]{3}$/.test(id)){change=id;render();}
});
window.addEventListener("hashchange",render);
var height=function(){document.documentElement.style.setProperty("--bl-unav-h",shell.offsetHeight+"px");};
height();
if("ResizeObserver" in window)new ResizeObserver(height).observe(shell);
else window.addEventListener("resize",height);
})();
