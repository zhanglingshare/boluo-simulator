(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BoluoWorldLayout=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  function arrange(nodes,root,{mobile=false,atlas=false,compact=false}={}){
    const positions=new Map();
    if(atlas){
      const order=['regional','industry','agriculture','people','mobility','tourism','environment'];
      const sorted=[...nodes].sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group)||a.id.localeCompare(b.id));
      const cols=5,rows=Math.ceil(sorted.length/cols),height=Math.max(620,rows*73+76);
      sorted.forEach((n,i)=>positions.set(n.id,{x:106+(i%cols)*200,y:65+Math.floor(i/cols)*73,w:172,h:48,small:true}));
      return{positions,width:1020,height};
    }
    const anchor=nodes.find(n=>n.id===root)||nodes[0];
    const others=nodes.filter(n=>n!==anchor).sort((a,b)=>(a.kind==='question')-(b.kind==='question'));
    if(mobile){
      const rows=Math.ceil(others.length/2),height=Math.max(480,rows*116+168);
      if(anchor)positions.set(anchor.id,{x:195,y:65,w:186,h:76});
      others.forEach((n,i)=>positions.set(n.id,{x:i%2?294:96,y:190+Math.floor(i/2)*116,w:154,h:70}));
      return{positions,width:390,height};
    }
    const width=compact?620:1040;
    if(nodes.length<=9){
      const xs=compact?[104,310,516]:[150,520,890],ys=compact?[75,239,403]:[75,264,453];
      if(anchor)positions.set(anchor.id,{x:xs[1],y:ys[1],w:compact?174:218,h:88});
      const slots=[3,5,1,0,2,6,7,8];
      others.forEach((n,i)=>{const p=slots[i];positions.set(n.id,{x:xs[p%3],y:ys[Math.floor(p/3)],w:compact?164:202,h:74});});
      return{positions,width,height:compact?482:537};
    }
    const cols=4,all=anchor?[anchor,...others]:others,rows=Math.ceil(all.length/cols),height=Math.max(560,rows*131+80);
    all.forEach((n,i)=>positions.set(n.id,{x:126+(i%cols)*260,y:76+Math.floor(i/cols)*131,w:210,h:n.id===root?86:74}));
    return{positions,width:1040,height};
  }
  function overlap(a,b,padding=0){return Math.max(0,Math.min(a.x+a.w/2+padding,b.x+b.w/2)-Math.max(a.x-a.w/2-padding,b.x-b.w/2))*Math.max(0,Math.min(a.y+a.h/2+padding,b.y+b.h/2)-Math.max(a.y-a.h/2-padding,b.y-b.h/2));}
  function connector(a,b,others,bounds,mobile=false){
    const dx=b.x-a.x,dy=b.y-a.y;
    let d,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    const between=others.some(n=>n!==a&&n!==b&&Math.abs(dy)<18&&Math.abs(n.y-a.y)<50&&n.x>Math.min(a.x,b.x)&&n.x<Math.max(a.x,b.x));
    if(between){
      const lane=Math.min(bounds.height-12,Math.max(a.y,b.y)+Math.max(a.h,b.h)/2+40);
      d=`M${a.x},${a.y+a.h/2} C${a.x},${lane} ${a.x},${lane} ${mx},${lane} S${b.x},${lane} ${b.x},${b.y+b.h/2}`;my=lane;
    }else if(Math.abs(dx)<12&&Math.abs(dy)>185&&others.some(n=>n!==a&&n!==b&&Math.abs(n.x-a.x)<65&&n.y>Math.min(a.y,b.y)&&n.y<Math.max(a.y,b.y))){
      const side=a.x>bounds.width/2?bounds.width-12:12,sign=side>a.x?1:-1;
      d=`M${a.x+sign*a.w/2},${a.y} C${side},${a.y} ${side},${a.y+45} ${side},${my} S${side},${b.y} ${b.x+sign*b.w/2},${b.y}`;mx=side+(sign>0?-30:30);
    }else if(Math.abs(dx)/Math.max(1,(a.w+b.w)/2)>Math.abs(dy)/Math.max(1,(a.h+b.h)/2)){
      const sign=Math.sign(dx)||1,x1=a.x+sign*a.w/2,x2=b.x-sign*b.w/2;
      d=`M${x1},${a.y} C${mx},${a.y} ${mx},${b.y} ${x2},${b.y}`;
    }else{
      const sign=Math.sign(dy)||1,y1=a.y+sign*a.h/2,y2=b.y-sign*b.h/2;
      d=`M${a.x},${y1} C${a.x},${my} ${b.x},${my} ${b.x},${y2}`;
    }
    return{d,mx,my};
  }
  function labelAt(link,text,nodes,labels,mobile,bounds){
    const clean=mobile?text.replace(/[？?]/g,'').slice(0,4):text;
    const w=Math.max(mobile?40:58,clean.length*(mobile?9:12)+12),h=mobile?21:25;
    const candidates=[[link.mx,link.my],[link.mx,link.my-28],[link.mx,link.my+28],[link.mx-40,link.my],[link.mx+40,link.my],[link.mx,link.my-52],[link.mx,link.my+52]];
    let best=null,score=Infinity;
    for(const [x0,y0]of candidates){const r={x:Math.max(w/2+3,Math.min(bounds.width-w/2-3,x0)),y:Math.max(h/2+2,Math.min(bounds.height-h/2-2,y0)),w,h};const s=nodes.reduce((s,n)=>s+overlap(r,n,2),0)*20+labels.reduce((s,n)=>s+overlap(r,n,2),0)*8+Math.abs(r.x-link.mx)+Math.abs(r.y-link.my);if(s<score){best=r;score=s;}}
    return{...best,text:clean};
  }
  function fit(layout,viewport={width:1000,height:600}){
    const ratio=viewport.width/viewport.height,world=layout.width/layout.height;
    if(world>ratio){const h=layout.width/ratio;return{x:0,y:(layout.height-h)/2,w:layout.width,h};}
    const w=layout.height*ratio;return{x:(layout.width-w)/2,y:0,w,h:layout.height};
  }
  return{arrange,overlap,connector,labelAt,fit};
});
