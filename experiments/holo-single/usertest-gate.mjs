// 博罗 V2 · M3 三道门槛新用户走查（诊断工具，不提交）
// 模拟第一次进入的用户：宇宙首屏 → 找入口 → 双世界 → 亲手改变 → 点节点/边 → 找证据 → 找"发现"出口
// 输出：shots/usertest/ 分步截图 + 一份客观测量 JSON（点击数、术语密度、引导有无、因果链可达性）
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js'));}
const URL_PAGE=process.env.HOLO_BASE||'http://localhost:8765/experiments/holo-single/index.html';
const out='shots/usertest';
fs.mkdirSync(out,{recursive:true});

async function ready(page){
  await page.goto(URL_PAGE,{waitUntil:'domcontentloaded',timeout:60000});
  let ok=false;
  for(let r=0;r<3&&!ok;r++){
    ok=await page.waitForFunction(()=>window.BOLUO_M3_APP&&window.BOLUO_DATA&&(window.BOLUO_DATA.nodes||[]).length,{timeout:20000}).then(()=>true).catch(()=>false);
    if(!ok)await page.reload({waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
  }
  return ok;
}
// 在 canvas 上合成单击并读取反馈（用于扫描节点 / 验证点边是否响应）
async function tapCanvas(page,canvasSel,gx,gy){
  return page.evaluate(({sel,gx,gy})=>{
    const cv=document.querySelector(sel);const r=cv.getBoundingClientRect();
    const x=r.left+r.width*gx,y=r.top+r.height*gy;
    const ev=(type)=>{try{cv.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',button:0,buttons:type==='pointerdown'?1:0}));}catch(e){}};
    ev('pointerdown');ev('pointerup');
    return document.getElementById('m3-selected')?.textContent||'';
  },{sel:canvasSel,gx,gy});
}
async function findNode(page,canvasSel,name){
  return page.evaluate(({sel,name})=>{
    const cv=document.querySelector(sel);const r=cv.getBoundingClientRect();
    const tap=(gx,gy)=>{const x=r.left+r.width*gx,y=r.top+r.height*gy;
      const ev=(t)=>{try{cv.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse',button:0,buttons:t==='pointerdown'?1:0}));}catch(e){}};
      ev('pointerdown');ev('pointerup');
      return document.getElementById('m3-selected').textContent;};
    for(let gy=0.12;gy<0.92;gy+=0.05)for(let gx=0.08;gx<0.96;gx+=0.045){
      const t=tap(gx,gy);
      if(t.includes(name)){return {gx:+gx.toFixed(3),gy:+gy.toFixed(3),t};}
    }
    return null;
  },{sel:canvasSel,name});
}

async function run(viewport,label,{mobile},rec){
  const opts={headless:true,ignoreHTTPSErrors:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors']};
  if(fs.existsSync('/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell'))opts.executablePath='/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell';
  const browser=await chromium.launch(opts);
  const page=await browser.newPage({viewport,deviceScaleFactor:mobile?2:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await page.waitForTimeout(1200);

  // ===== S0 宇宙首屏：M3 入口在哪里、是什么、有无引导 =====
  const universe=await page.evaluate(()=>{
    const txt=document.body.innerText;
    const btn=document.querySelector('#m3-launch');
    const btnM=document.querySelector('#m3-launch-mobile');
    const vis=(el)=>!!el&&(el.offsetParent!==null||el.getBoundingClientRect().width>0);
    const topBtns=[...document.querySelectorAll('.top-actions button, .top-actions a')].map(b=>b.textContent.trim()).filter(Boolean);
    return {
      m3EntryText:btn?.textContent||null,
      m3EntryVisible:vis(btn),
      m3MobileEntryText:btnM?.textContent||null,
      m3MobileEntryVisible:vis(btnM),
      topBarEntries:topBtns,
      hasAnyOnboarding:/引导|新手|教程|第[一二三1-3]步|点这里|带你|第一次|开始探索|onboard|guide|tour|walkthrough/i.test(txt)
    };
  });
  rec[label].universe=universe;
  await page.screenshot({path:`${out}/${label}-00-universe.png`});

  // ===== 进入双世界：1 次点击 =====
  const launch=mobile?'#m3-launch-mobile':'#m3-launch';
  await page.locator(launch).first().click();
  await page.waitForSelector('#m3-shell:not([hidden])');
  await page.waitForFunction(()=>{const e=document.getElementById('m3-persons-a');return e&&/4,500/.test(e.textContent);},{timeout:30000});
  await page.waitForTimeout(1600);
  await page.screenshot({path:`${out}/${label}-10-dual-open.png`});

  // ===== 门槛1+3：双世界首屏信息密度 / 术语 / 引导 / 默认状态 =====
  const open=await page.evaluate(()=>{
    const shell=document.getElementById('m3-shell');
    const txt=shell.innerText;
    const buttons=[...shell.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean);
    const legend=document.querySelector('.m3-legend');
    const lvis=!!legend&&legend.offsetParent!==null;
    const jargon=['可达','连通','阈值','无量纲','B级','C级','证据','情景','系数','权重','敏感性','置信','流场','区间','锚点'];
    return {
      totalChars:txt.length,
      buttonCount:buttons.length,
      buttons,
      legendVisible:lvis,legendText:legend?.innerText||'',
      legendFontPx:legend?getComputedStyle(legend).fontSize:null,
      jargonCounts:jargon.map(j=>({j,n:(txt.split(j).length-1)})).filter(x=>x.n>0),
      hasOnboardingInside:/第[一二三四1-4]步|点这里|试试|拖动滑块|先做|跟着|引导|walkthrough|让我带你/i.test(txt),
      defaultReachA:document.getElementById('m3-reach-a').textContent,
      defaultReachB:document.getElementById('m3-reach-b').textContent,
      hasShareDiscovery:/分享|发现卡|我的发现|海报|记录这个发现|share/i.test(txt),
      saveTargets:[...document.querySelectorAll('.m3-act')].map(b=>b.textContent.trim())
    };
  });
  rec[label].open=open;

  // ===== 门槛3：亲手改变 —— 先把 B 设为低（两世界相同），再设为高（差异出现）=====
  await page.locator('#m3-ctrl-b .m3-preset[data-key="low"]').click();
  await page.waitForTimeout(900);
  await page.screenshot({path:`${out}/${label}-11-same.png`});
  const reachSame=await page.evaluate(()=>[document.getElementById('m3-reach-a').textContent,document.getElementById('m3-reach-b').textContent]);
  await page.locator('#m3-ctrl-b .m3-preset[data-key="high"]').click();
  await page.waitForTimeout(1100);
  await page.screenshot({path:`${out}/${label}-12-diff.png`});
  const reachDiff=await page.evaluate(()=>[document.getElementById('m3-reach-a').textContent,document.getElementById('m3-reach-b').textContent]);
  rec[label].changeCausality={whenBsetLow_reach:reachSame,whenBsetHigh_reach:reachDiff};

  // ===== 门槛2：点"仅B可达"节点 xwd（欣旺达），看反馈是否给出路径 =====
  const found=await findNode(page,'#m3-canvas-b','欣旺达');
  rec[label].nodeFound=found;
  if(found){
    await page.waitForTimeout(500);
    await page.screenshot({path:`${out}/${label}-13-node-selected.png`});
  }
  // 节点反馈文本 + 是否出现路径/边权重解释
  const nodeFb=await page.evaluate(()=>{
    const sel=document.getElementById('m3-selected').textContent;
    const shell=document.getElementById('m3-shell').innerText;
    return {
      selectedText:sel,
      mentionsPath:/路径|经过|通过.*边|e0|e12|这条链|链条|可达路径/.test(sel),
      mentionsEdgeWeight:/权重|0\.10|0\.85|weight|为什么连通|原因/.test(sel),
      shellHasNodePathHighlight:/路径/.test(shell) // 粗测，后面人工核对
    };
  });
  rec[label].nodeFeedback=nodeFb;

  // 点空白/边经过处：验证是否无任何反馈（边不可点）
  const before=await page.evaluate(()=>document.getElementById('m3-selected').textContent);
  const afterTap=await tapCanvas(page,'#m3-canvas-b',0.06,0.06); // 角落，半径内无节点
  rec[label].edgeOrBlankTap={before,after:afterTap,changed:before!==afterTap};

  // ===== 门槛2：证据面板 —— 是流场级还是节点/边级 =====
  await page.locator('#m3-evidence summary').click();
  await page.waitForTimeout(500);
  const ev=await page.evaluate(()=>{
    const labels=[...document.querySelectorAll('#m3-evidence-body .m3-ev-label')].map(x=>x.textContent.trim());
    const body=document.getElementById('m3-evidence-body').innerText;
    return {sections:labels,
      hasPerEdgeWeight:/每条边|e12|e13|e14|这条供应链|具体到.*关系/.test(body),
      mentionsSelectedNode:body.includes('欣旺达')};
  });
  rec[label].evidencePanel=ev;
  await page.screenshot({path:`${out}/${label}-14-evidence.png`});

  // ===== 右栏"发现"现状：滚动并截图 =====
  await page.evaluate(()=>document.querySelector('#m3-shell').scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.locator('#m3-conditional').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({path:`${out}/${label}-15-findings.png`});
  const findings=await page.evaluate(()=>({
    robust:document.getElementById('m3-robust').innerText.slice(0,260),
    conditional:document.getElementById('m3-conditional').innerText.slice(0,320),
    next:document.getElementById('m3-next').innerText.slice(0,260)
  }));
  rec[label].findings=findings;

  rec[label].pageErrors=errors;
  await browser.close();
}

(async()=>{
  const rec={};
  rec.desktop={};rec.mobile={};
  await run({width:1440,height:900},'desktop',{mobile:false},rec);
  await run({width:390,height:844},'mobile',{mobile:true},rec);
  fs.writeFileSync(out+'/gate-measures.json',JSON.stringify(rec,null,2));
  console.log('走查完成。截图在 '+out+'/；测量数据 gate-measures.json');
  console.log(JSON.stringify(rec,null,2));
})();
