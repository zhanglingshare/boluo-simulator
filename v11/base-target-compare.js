(function(){
'use strict';
const economic=[
 {year:2020,value:619.04},{year:2021,value:741.46},{year:2022,value:801.39},
 {year:2023,value:838.89},{year:2024,value:970.87},{year:2025,value:1005.45}
];
const sectors=[
 {id:'s1',name:'第一产业',v:107.44,share:10.7,g:7.8,col:'#d8ad72'},
 {id:'s2',name:'第二产业',v:549.01,share:54.6,g:6.9,col:'#4bbde7'},
 {id:'s3',name:'第三产业',v:349.00,share:34.7,g:2.7,col:'#50d5b1'}
];
const $=id=>document.getElementById(id);
const n=x=>Number(x).toFixed(2);
let currentYear=2025,chosen=null,chartMode='scatter',lastSelected=null;
const compYear=year=>economic.find(d=>d.year===year);
const escaped=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function yearChart(){
 const baseline=Number($('baseCompareYear').value),a=compYear(baseline),b=compYear(currentYear);
 const d=b.value-a.value,pc=(d/a.value)*100;
 const x=v=>43+v/1100*332;
 const s=['<svg role="img" aria-label="'+a.year+'年和'+b.year+'年GDP现价规模对照" viewBox="0 0 410 151">'];
 [0,500,1000].forEach(v=>s.push('<line x1="'+x(v)+'" x2="'+x(v)+'" y1="40" y2="118" stroke="#8bb9c0" stroke-opacity=".17" stroke-dasharray="3 4"/><text x="'+x(v)+'" y="133" fill="#7897a9" font-size="10" text-anchor="middle">'+v+'</text>'));
 s.push('<text x="43" y="146" fill="#7897a9" font-size="9">GDP · 亿元</text>');
 const xa=x(a.value),xb=x(b.value);
 s.push('<line x1="'+Math.min(xa,xb)+'" x2="'+Math.max(xa,xb)+'" y1="79" y2="79" stroke="#f2c77a" stroke-width="4" stroke-linecap="round"/>');
 s.push('<circle cx="'+xa+'" cy="79" r="9" fill="#112f41" stroke="#65e4c6" stroke-width="3"/><circle cx="'+xb+'" cy="79" r="10" fill="#ffc875" stroke="#fff0c4" stroke-width="2.5"/>');
 s.push('<text x="'+xa+'" y="52" fill="#a1f2dc" font-weight="800" font-size="15" text-anchor="middle">'+n(a.value)+'</text>');
 s.push('<text x="'+xb+'" y="109" fill="#f4d49b" font-weight="800" font-size="15" text-anchor="middle">'+n(b.value)+'</text>');
 s.push('<text x="'+xa+'" y="20" fill="#8eb1c1" font-size="10" text-anchor="middle">'+a.year+' 基准</text><text x="'+xb+'" y="27" fill="#b7c4c9" font-size="10" text-anchor="middle">'+b.year+' 对照</text>');
 s.push('</svg>');
 $('compareYearSvg').innerHTML=s.join('');
 $('compareYearChange').textContent=(d>=0?'+':'')+n(d)+'亿元';
 $('compareYearDelta').textContent=(pc>=0?'+':'')+pc.toFixed(1)+'% · 现价规模变化';
 $('currentCompareYear').textContent=currentYear;
}
function scatterChart(){
 const width=420,xx=v=>60+(v/600)*310,yy=v=>160-v/10*133;
 const focus=chosen&&chosen.type==='sector'?chosen.id:null;
 const s=['<svg class="cmp-scatter" role="img" aria-label="2025年三次产业增加值和实际增速的双维对照图" viewBox="0 0 420 220">'];
 [0,200,400,600].forEach(v=>s.push('<line x1="'+xx(v)+'" x2="'+xx(v)+'" y1="18" y2="160" stroke="#9bb7c5" stroke-opacity=".14" stroke-dasharray="3 5"/><text x="'+xx(v)+'" y="178" text-anchor="middle" fill="#85a7b8" font-size="10">'+v+'</text>'));
 [0,5,10].forEach(v=>s.push('<line x1="54" x2="375" y1="'+yy(v)+'" y2="'+yy(v)+'" stroke="#9bb7c5" stroke-opacity=".14" stroke-dasharray="3 5"/><text x="43" y="'+(yy(v)+4)+'" text-anchor="end" fill="#85a7b8" font-size="10">'+v+'%</text>'));
 s.push('<text x="209" y="206" text-anchor="middle" fill="#89afbf" font-size="10">2025 增加值 · 亿元 →</text><text x="10" y="15" fill="#89afbf" font-size="9">↑ 实际增速</text>');
 sectors.forEach(d=>{const focused=focus===d.id,dim=focus&&focus!==d.id;const X=xx(d.v),Y=yy(d.g);
 s.push('<g data-sector="'+d.id+'" role="button" tabindex="0" aria-label="'+d.name+'，增加值'+n(d.v)+'亿元，增速'+d.g+'%"><circle class="datapoint '+(focused?'active':'')+'" cx="'+X+'" cy="'+Y+'" r="'+(focused?13:10)+'" fill="'+d.col+'" fill-opacity="'+(dim?.42:.85)+'" stroke="'+d.col+'" stroke-width="2"/><text x="'+X+'" y="'+(Y-18)+'" text-anchor="middle" fill="#e2f6fb" font-weight="750" font-size="12">'+d.name+'</text><text x="'+X+'" y="'+(Y+29)+'" text-anchor="middle" fill="'+d.col+'" font-weight="700" font-size="11">'+n(d.v)+'亿 · '+d.g+'%</text></g>')});
 s.push('</svg>');
 $('compareSectorSvg').innerHTML=s.join('');
}
function rankChart(){
 const s=['<svg class="cmp-scatter" role="img" aria-label="三次产业体量和增速的排名变化连线图" viewBox="0 0 420 220">'];
 const bySize=[...sectors].sort((a,b)=>b.v-a.v),byGrowth=[...sectors].sort((a,b)=>b.g-a.g);
 const pos=(list,id)=>list.findIndex(x=>x.id===id),y=p=>55+p*64;
 s.push('<text x="72" y="19" text-anchor="middle" fill="#9bc5d1" font-size="12">体量排名</text><text x="345" y="19" text-anchor="middle" fill="#9bc5d1" font-size="12">增速排名</text>');
 for(let i=0;i<3;i++){s.push('<line x1="74" y1="'+y(i)+'" x2="344" y2="'+y(i)+'" stroke="#7495a2" stroke-opacity=".13" stroke-dasharray="4 6"/><text x="20" y="'+(y(i)+4)+'" fill="#7b9dae" font-size="10">第'+(i+1)+'</text>')}
 sectors.forEach(d=>{let a=y(pos(bySize,d.id)),b=y(pos(byGrowth,d.id));let dim=chosen&&chosen.type==='sector'&&chosen.id!==d.id;let strong=!dim;
 s.push('<g data-sector="'+d.id+'" role="button" tabindex="0" aria-label="'+d.name+'体量第'+(pos(bySize,d.id)+1)+'，增速第'+(pos(byGrowth,d.id)+1)+'"><path d="M85 '+a+' C165 '+a+' 250 '+b+' 334 '+b+'" fill="none" stroke="'+d.col+'" stroke-width="'+(strong?4:2)+'" stroke-opacity="'+(strong?.92:.25)+'"/><circle cx="85" cy="'+a+'" r="7" fill="'+d.col+'"/><circle cx="334" cy="'+b+'" r="7" fill="'+d.col+'"/><text x="93" y="'+(a-12)+'" fill="#d6e9ed" font-size="11">'+d.name+'</text></g>')});
 s.push('</svg>');
 $('compareSectorSvg').innerHTML=s.join('');
}
function render(current){
 if(current){currentYear=Number(current.year)||2025;chosen=current.selected||null;}
 yearChart();
 if(chartMode==='scatter')scatterChart();else rankChart();
 document.querySelectorAll('[data-compare-mode]').forEach(b=>{const active=b.dataset.compareMode===chartMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 const fold=$('inspectorFold');
 if(fold&&current&&current.selected)fold.open=true;
 if(current&&current.selected&&current.selected.type==='root'){const drawer=$('evidenceDrawer');if(drawer)drawer.open=true;}
}
window.addEventListener('boluo:base-update',e=>render(e.detail||null));
$('baseCompareYear').addEventListener('change',()=>render());
document.querySelectorAll('[data-compare-mode]').forEach(b=>b.addEventListener('click',()=>{chartMode=b.dataset.compareMode;render()}));
document.querySelectorAll('.v11-nav-group').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.v11-nav-group').forEach(o=>{if(o!==d)o.open=false})}));
render({year:Number($('historyYear')?.textContent)||2025,selected:null});
})();