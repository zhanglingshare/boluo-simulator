/* 柏塘2030蒙特卡洛多视图：所有视觉数据都来自真实计算样本，而非静态图形 */
(function(root){
'use strict';
const V=root.BaitangMechanism;if(!V)throw Error('Model required');
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&quot;':'&quot;'}[c]));
const R=n=>Math.round(n*10)/10;
const near=(a,p)=>{const i=Math.min(a.length-1,Math.max(0,Math.round((a.length-1)*p)));return a[i]};
const X=x=>String(R(x));
const bounds=(data,base,field)=>{let a=data.terminal[field],b=base?base.terminal[field]:[];let lo=Math.min(...a,...b),hi=Math.max(...a,...b);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.065;return [lo-pad,hi+pad]};
function hist(vals,lo,hi,bins=30){let d=Array(bins).fill(0),span=(hi-lo)/bins;for(const x of vals){let i=Math.min(bins-1,Math.max(0,Math.floor((x-lo)/span)));d[i]++}return d}
function axes(lo,hi,maxY,isPercent=false){
 const x0=56,x1=960,top=37,bottom=352;
 let str='<g class="mc-grid">';
 for(let i=0;i<=4;i++){const y=bottom-(bottom-top)*i/4;str+='<line x1="'+x0+'" x2="'+x1+'" y1="'+y+'" y2="'+y+'"/><text x="45" y="'+(y+4)+'" text-anchor="end">'+R(maxY*i/4)+(isPercent?'%':'')+'</text>'}
 for(let i=0;i<=5;i++){const x=x0+(x1-x0)*i/5;str+='<text x="'+x+'" y="378" text-anchor="middle">'+R(lo+(hi-lo)*i/5)+'</text>'}
 return str+'</g>';
}
const svg=(body,title)=>'<svg class="mc-svg" viewBox="0 0 1000 415" role="img" aria-label="'+esc(title)+'"><defs><linearGradient id="mcbar" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#f9ce8d"/><stop offset="1" stop-color="#9a805d"/></linearGradient><linearGradient id="mcfill" x1="0" x2="1"><stop stop-color="#6eddbd" stop-opacity=".06"/><stop offset="1" stop-color="#99dec1" stop-opacity=".35"/></linearGradient></defs>'+body+'</svg>';
function histogram(run,base,field='valueIndex'){
 const all=run.terminal[field],[lo,hi]=bounds(run,base,field),nums=hist(all,lo,hi),n=nums.length,max=Math.max(...nums)*1.16;
 const bar=nums.map((v,i)=>{const w=902/n-2,x=57+i*902/n,h=v/max*315,y=352-h;return '<g class="mc-bar"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2"/><title>'+R(lo+(hi-lo)*(i+.5)/n)+'：'+v+'次，占样本'+R(v/all.length*100)+'%</title></g>'}).join('');
 // density smooth is derived exclusively from adjacent sampled bins
 const smooth=nums.map((_,i)=>nums.slice(Math.max(0,i-2),Math.min(n,i+3)).reduce((a,b)=>a+b,0)/(Math.min(n,i+3)-Math.max(0,i-2)));
 const line=smooth.map((v,i)=>(i?'L':'M')+(57+(i+.5)*902/n)+' '+(352-v/max*315)).join(' ');
 const stats=run.ending[field];let pMarks=[['P10',stats.p10,'#8fcac2'],['P50',stats.p50,'#ffcc83'],['P90',stats.p90,'#8fcac2']].map(([lab,value,color])=>{const x=56+(value-lo)/(hi-lo)*904;return '<g><line x1="'+x+'" y1="44" x2="'+x+'" y2="352" stroke="'+color+'" stroke-width="1.8" stroke-dasharray="4 7"/><text x="'+x+'" y="30" fill="'+color+'" text-anchor="middle">'+lab+': '+value+'</text></g>'}).join('');
 return svg(axes(lo,hi,max,false)+bar+'<path d="'+line+'" class="mc-density"/>'+pMarks,'2030年'+V.FIELD_INFO[field].name+'的真实样本直方图和P10 P50 P90')+'<div class="mc-legend">▰ 柱高=此区间的模拟样本数　⟡ 曲线=样本频数平滑　┄ P10/P50/P90</div>';
}
function cdf(run,base,field='valueIndex'){
 const values=run.terminal[field].slice().sort((a,b)=>a-b),[lo,hi]=bounds(run,base,field);
 const x=v=>56+(v-lo)/(hi-lo)*904,y=p=>352-p*315;
 const points=Array.from({length:121},(_,i)=>{const p=i/120;return [x(near(values,p)),y(p)]});
 const d=points.map((v,i)=>(i?'L':'M')+v.map(X).join(' ')).join(' ');
 const marks=[.1,.5,.9].map(p=>{const q=near(values,p);return '<g><circle cx="'+x(q)+'" cy="'+y(p)+'" r="5" class="mc-cdfmark"/><text x="'+(x(q)+9)+'" y="'+(y(p)-8)+'" class="mc-marker">'+Math.round(100*p)+'% ≤ '+R(q)+'</text></g>'}).join('');
 return svg(axes(lo,hi,100,true)+'<path class="mc-cdfarea" d="'+d+' L'+x(values[values.length-1])+' 352 L'+x(values[0])+' 352Z"/><path class="mc-cdfline" d="'+d+'"/>'+marks,'2030年累计样本比例：低于某水平的样本占多少')+'<div class="mc-legend">横轴=结果水平，纵轴=不超过该水平的样本占比。不是现实概率保证。</div>';
}
function comparison(run,base,field='valueIndex'){
 if(!base)return histogram(run,null,field);
 const [lo,hi]=bounds(run,base,field),cur=hist(run.terminal[field],lo,hi,30),ref=hist(base.terminal[field],lo,hi,30);
 const max=Math.max(...cur,...ref)*1.15,n=cur.length;
 const bars=cur.map((v,i)=>{let x=56+i*904/n,b=ref[i];return '<g><rect class="mc-basebar" x="'+(x+1)+'" y="'+(352-b/max*315)+'" width="'+(904/n/2-2)+'" height="'+b/max*315+'"/><rect class="mc-currentbar" x="'+(x+904/n/2)+'" y="'+(352-v/max*315)+'" width="'+(904/n/2-2)+'" height="'+v/max*315+'"><title>当前'+v+'次；均衡基准'+b+'次</title></rect></g>'}).join('');
 return svg(axes(lo,hi,max)+bars,'当前方案与均衡方案相同区间的样本频数对照')+'<div class="mc-legend"><span style="color:#83baba">▰ 均衡基准</span>　<span style="color:#f4bf76">▰ 当前选择</span>　　同一随机种子和区间刻度</div>';
}
function traces(run,base,field='valueIndex'){
 const parts=run.trajectories.slice(0,75),all=run.bands;
 const vals=all.flatMap(x=>[x[field].p10,x[field].p90]);const lo=Math.min(...vals)*.95,hi=Math.max(...vals)*1.06,x=i=>56+i*181,y=n=>352-(n-lo)/(hi-lo)*315;
 const cloud=parts.map(path=>'<polyline class="mc-trajectory" points="'+path.map((p,i)=>x(i)+','+y(p[field])).join(' ')+'"/>').join('');
 const band=all.map((v,i)=>x(i)+','+y(v[field].p90)).concat(all.slice().reverse().map((v,i)=>x(5-i)+','+y(v[field].p10))).join(' ');
 const median='<polyline class="mc-midline" points="'+all.map((v,i)=>x(i)+','+y(v[field].p50)).join(' ')+'"/>';
 const grid=[0,.25,.5,.75,1].map(p=>{const v=lo+(hi-lo)*p,Y=y(v);return '<line x1="56" x2="960" y1="'+Y+'" y2="'+Y+'" class="mc-trackgrid"/><text x="49" y="'+(Y+4)+'" text-anchor="end">'+R(v)+'</text>'}).join('');
 const years=all.map((v,i)=>'<text x="'+x(i)+'" y="380" text-anchor="middle">'+v.year+'</text>').join('');
 return svg('<g class="mc-grid">'+grid+years+'</g>'+cloud+'<polygon points="'+band+'" class="mc-tra-band"/>'+median,'前75条实际蒙特卡洛样本路径与逐年分位区间')+'<div class="mc-legend">细线=实际计算路径（最多75条）　▰ P10—P90范围　━ P50中位数</div>';
}
function bands(run,base,field='valueIndex'){return traces({...run,trajectories:[]},base,field)}
function draw(run,base,view='hist',field='valueIndex'){
 if(!run||!run.terminal||!run.terminal[field])return '<div class="mc-empty">还没有可用的模型抽样结果</div>';
 const types={hist:histogram,cdf,compare:comparison,traces,bands};return (types[view]||histogram)(run,base,field);
}
root.BaitangCharts=Object.freeze({draw,hist,cdf,comparison,traces,bands});
})(typeof window!=='undefined'?window:globalThis);
