/* BOLUO one navigation system / 2026-11-04
   Navigation only: no model, data, chart or page content updates. */
(function(){
"use strict";
var script=document.currentScript;
if(!script||!script.src||!document.body)return;
var base=new URL("../",script.src);
var entries=[
 {id:"find",num:"01",name:"发现",desc:"从今天和镇街的真实线索开始",pages:[["今日博罗","index-legacy-2026-11-03.html"],["各镇好玩好吃","town.html"]]},
 {id:"change",num:"02",name:"变化",desc:"近期有什么改变，又牵动了谁",pages:[["产业变化","industry-changes.html"],["变化现场·图谱","holo-home-v9.html"]]},
 {id:"structure",num:"03",name:"看结构",desc:"基本面、结构生长、五个世界，是三种观察角度",pages:[["博罗基本面","who.html"],["博罗怎么长起来","network.html"],["五个世界·关系世界","experiments/holo-single/index.html"]]},
 {id:"compare",num:"04",name:"对照",desc:"带着同一条线索，看关系发生了什么",pages:[["变化前后对比","relation-compare.html"]]},
 {id:"simulate",num:"05",name:"推演",desc:"可选路径、未来情景与压力测试",pages:[["规划与你","plan-with-me.html"],["五条发展路","choices.html"],["2030未来","future.html"],["风洞测试","windtunnel.html"]]},
 {id:"reflect",num:"06",name:"复盘",desc:"可能忽略的、证据解释和最终思考",pages:[["可能忽略","blindspot.html"],["图文报告","report.html"],["结语","ending.html"]]}
];
var all={};entries.forEach(function(g){g.pages.forEach(function(p){all[p[1]]=g.id;});});
all["future-lab.html"]="lab";
var rootPath=base.pathname;
var page=decodeURI(location.pathname).replace(rootPath,"")||"index-legacy-2026-11-03.html";
if(page==="index.html")page="index-legacy-2026-11-03.html";
var initial=all[page]||"find";
var selected=initial==="lab"?"structure":initial;
var change=null;
var targetByPage={
 "index-legacy-2026-11-03.html":["town.html","去各镇观察"],
 "town.html":["industry-changes.html","追踪产业变化"],
 "industry-changes.html":["who.html","放到县域基本面中看"],
 "holo-home-v9.html":["who.html","放到基本面中看"],
 "who.html":["network.html","看结构怎样长出来"],
 "network.html":["experiments/holo-single/index.html","进入五个世界"],
 "experiments/holo-single/index.html":["relation-compare.html","观察变化前后"],
 "relation-compare.html":["plan-with-me.html","看规划与你"],
 "plan-with-me.html":["choices.html","探索五条路径"],
 "choices.html":["future.html","看看2030的可能"],
 "future.html":["windtunnel.html","去风洞压测"],
 "windtunnel.html":["blindspot.html","看看忽略了什么"],
 "blindspot.html":["report.html","查看图文报告"],
 "report.html":["ending.html","进入结语"],
 "ending.html":["index-legacy-2026-11-03.html","从现实重新观察"],
 "future-lab.html":["index-legacy-2026-11-03.html","返回真实博罗"]
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
 if(c&&["who.html","relation-compare.html","plan-with-me.html"].indexOf(file)!==-1){
  target.searchParams.set("change",c);
 }
 if(file==="industry-changes.html"&&["index-legacy-2026-11-03.html","town.html"].indexOf(from)!==-1){
  target.searchParams.set("from",from==="town.html"?"town":"today");
 }
 if(file==="who.html"&&["industry-changes.html","holo-home-v9.html"].indexOf(from)!==-1)target.searchParams.set("from","changes");
 if(file==="relation-compare.html"&&from==="who.html")target.searchParams.set("from","basic");
 if(file==="plan-with-me.html"&&from==="relation-compare.html")target.searchParams.set("from","comparison");
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
var logo=el("a","bl-unav-brand");logo.href=href("index-legacy-2026-11-03.html");
logo.append(el("strong",null,"博罗 · 决策风洞"),el("small",null,"从现实线索到结构，再到推演"));
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
var lab=el("a","bl-unav-lab","三维实验室");lab.href=href("future-lab.html");first.append(lab);
shell.append(first);
var second=el("div","bl-unav-sub");
var stageDesc=el("div","bl-unav-desc");
var opts=el("nav","bl-unav-choices");opts.setAttribute("aria-label","当前阶段的观察视角");
var next=el("a","bl-unav-next");
second.append(stageDesc,opts,next);shell.append(second);
document.body.insertBefore(shell,document.body.firstChild);
document.body.classList.add("bl-unav-ready");
document.body.setAttribute("data-bl-unav-page",page==="experiments/holo-single/index.html"?"holo":page==="holo-home-v9.html"?"atlas":page==="future-lab.html"?"lab":"standard");
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
  if(entry[1]===page){a.classList.add("current");a.setAttribute("aria-current","page");}
  opts.append(a);
 });
 if(group.id==="structure"){
  var note=el("span","bl-unav-qualifier","结构生长≠完整历史复原");opts.append(note);
 }
 var cont=targetByPage[page]||["index-legacy-2026-11-03.html","回到今日博罗"];
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
