/**
 * M3 可复现实机路径（双端）：本地 HTTP server 后运行
 *   node experiments/holo-single/shot-m3.mjs
 * 覆盖：真实人次区间绑定、预设/滑块驱动真实重算、双世界差异、证据面板、
 * 敏感性稳健发现、保存/恢复、手机浮动入口、退出后 M2 仍在。
 */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.js'));}
const out=new URL('./shots/',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
const URL_PAGE=process.env.HOLO_BASE||'http://localhost:8765/experiments/holo-single/index.html';
const errors=[];const netErr=[];
async function waitFlow(page){
 await page.waitForFunction(()=>{const e=document.getElementById('m3-persons-a');return e&&/4,500/.test(e.textContent);},{timeout:30000});
}

async function run(viewport,label,{mobile}){
 const opts={headless:true,ignoreHTTPSErrors:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors']};
 if(fs.existsSync('/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell'))opts.executablePath='/opt/vm/preinstall/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell';
 const browser=await chromium.launch(opts);
 try{
  const page=await browser.newPage({viewport,deviceScaleFactor:mobile?2:1});
  page.on('pageerror',e=>errors.push('['+label+'] '+e.message));
  page.on('console',m=>{if(m.type()==='error'){const t=m.text();if(/Failed to load resource|503 \(|net::ERR|ERR_FAILED|ERR_INTERNET/.test(t))netErr.push('['+label+'] '+t);else errors.push('['+label+'] '+t);}});
  // 加载并等待 M3 模块 + M2 内联节点就绪；边缘代理连续 503 时整页重载，最多 3 轮
  let ready=false;
  for(let r=0;r<3&&!ready;r++){
   await page.goto(URL_PAGE,{waitUntil:'domcontentloaded',timeout:60000});
   ready=await page.waitForFunction(()=>window.BOLUO_M3_APP&&window.BOLUO_DATA&&(window.BOLUO_DATA.nodes||[]).length,{timeout:20000}).then(()=>true).catch(()=>false);
   if(!ready)await page.reload({waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
  }
  assert.ok(ready,label+' M3 模块多轮重载后仍未就绪（边缘代理持续异常）');

  // 入口可见性：桌面用顶栏按钮；手机用浮动按钮（顶栏容器在≤720隐藏）
  const launcher=mobile?'#m3-launch-mobile':'#m3-launch';
  const other=mobile?'#m3-launch':'#m3-launch-mobile';
  const lv=await page.locator(launcher).first().boundingBox();
  assert.ok(lv&&lv.width>0&&lv.height>0,label+' 入口按钮应可见且可点');
  await page.locator(launcher).first().click();
  await page.waitForSelector('#m3-shell:not([hidden])');
  await waitFlow(page);
  // 真实人次区间已绑定
  const capA=await page.locator('#m3-cap-a').innerText(),capB=await page.locator('#m3-cap-b').innerText();
  assert.ok(/4,500/.test(capA),label+' 世界A默认低情景应≈4500，实际：'+capA);
  assert.ok(/17,000/.test(capB),label+' 世界B默认高情景应≈17000，实际：'+capB);
  // 低 vs 高：可达数不同，双世界结果真正不同
  const reachA=await page.locator('#m3-reach-a').innerText(),reachB=await page.locator('#m3-reach-b').innerText();
  const n=(s)=>parseInt(s,10);
  assert.ok(n(reachB)>n(reachA),label+' 高情景可达应多于低情景：'+reachA+' vs '+reachB);
  const one=await page.evaluate(()=>window.BOLUO_M3_APP.compute(.2,.85));
  assert.ok(one.onlyB.length>0&&one.changedCount===4,'双世界应只有B多节点且4条边变化');
  await page.screenshot({path:out+label+'-m3-two-worlds.png'});

  // 证据面板
  await page.locator('#m3-evidence summary').click();
  await page.waitForFunction(()=>/手机信令/.test(document.getElementById('m3-evidence-body').innerText));
  await page.screenshot({path:out+label+'-m3-evidence.png'});

  // 把世界A调到高，可达应收敛到与B一致（真实重算）
  await page.locator('.m3-preset[data-side="a"][data-key="high"]').click();
  await page.waitForFunction(()=>document.getElementById('m3-val-a').textContent==='0.85');
  assert.equal(await page.locator('#m3-reach-a').innerText(),await page.locator('#m3-reach-b').innerText(),'同为高情景可达应一致');
  await page.screenshot({path:out+label+'-m3-converged.png'});

  // 敏感性面板：稳健与条件性结论存在
  const robust=await page.locator('#m3-robust').innerText(),cond=await page.locator('#m3-conditional').innerText();
  assert.ok(/始终与东莞网络连通/.test(robust),label+' 稳健结论缺失');
  assert.ok(/取决于跨界强度假设/.test(cond),label+' 关键未知缺失');
  assert.ok(/阈值/.test(cond),label+' 条件性阈值缺失');
  const dependent=await page.locator('#m3-dependent').innerText();
  assert.ok(parseInt(dependent,10)>=0);

  // 保存 → 改世界A → 恢复（应回到两高）
  await page.locator('#m3-save').click();
  await page.evaluate(()=>{const s=document.getElementById('m3-range-a');s.value='30';s.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>document.getElementById('m3-val-a').textContent==='0.30');
  await page.locator('#m3-load').click();
  assert.equal(await page.locator('#m3-val-a').textContent(),'0.85','恢复后应回到保存的0.85');
  await page.screenshot({path:out+label+'-m3-restored.png'});

  // 退出，M2 仍在
  await page.locator('#m3-exit').click();
  assert.equal(await page.locator('#m3-shell').getAttribute('hidden'),'');
  assert.ok(await page.locator('#universeCanvas').count(),'关闭后M2世界仍在');
  if(mobile){const b=await page.locator('#m3-launch').first().boundingBox();assert.ok(!b||b.width===0,'手机端顶栏入口应隐藏');}
  console.log(label,'done reach(low->high)='+reachA+'/'+reachB,' changed='+one.changedCount,' onlyB='+one.onlyB.length);
 }finally{await browser.close();}
}
await run({width:1440,height:900},'m3-desktop',{mobile:false});
await run({width:390,height:844},'m3-mobile',{mobile:true});
console.log('M3 Playwright UI tests finished; fatal errors=',errors.length,'; 已由重试恢复的瞬时网络503=',netErr.length);
if(netErr.length)netErr.forEach(e=>console.log('  [网络重试已恢复]',e));
if(errors.length){for(const e of errors)console.error(e);process.exitCode=1;}
