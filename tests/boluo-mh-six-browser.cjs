const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root='http://127.0.0.1:8765/';
const art=path.resolve(__dirname,'../artifacts/boluo-mh-six');
fs.mkdirSync(art,{recursive:true});
const pages=[
 ['01-today','index-legacy-2026-11-03.html','.bl-home-hero'],
 ['02-towns','town.html','.v3-town-arena'],
 ['03-changes','industry-changes.html','.ec-graph-panel'],
 ['04-baseline','who.html','.v3-tension-lab'],
 ['05-compare','relation-compare.html','.bc-panel--after'],
 ['06-plan','plan-with-me.html','.pl-hero']
];
async function suite(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errs=[];
 try{
  for(const [name,file,element] of pages){
   const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
   page.on('pageerror',e=>errs.push(name+': '+e.message));
   await page.goto(root+file,{waitUntil:'domcontentloaded'});
   await page.locator(element).waitFor({timeout:20000});
   if(name==='06-plan')await page.locator('.pl-stat').first().waitFor({timeout:20000});
   else await page.locator('#bl-journey-bar').waitFor({timeout:10000});
   await page.waitForTimeout(350);
   const state=await page.evaluate(selector=>{
    const body=document.body,item=document.querySelector(selector),bar=document.querySelector('#bl-journey-bar');
    const css=getComputedStyle(item);
    const svg=document.querySelector(selector+' svg');
    return {theme:body.classList.contains('mh-six'),bodyBackground:getComputedStyle(body).backgroundColor,
      heroBackground:css.backgroundColor,heroGradient:css.backgroundImage,
      boxShadow:css.boxShadow,navigation:!!bar,
      planLink:!!document.querySelector('a[href*="plan-with-me.html"]'),
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      font:getComputedStyle(body).fontFamily};
   },element);
   assert.equal(state.theme,true,name+' theme class');
   assert.equal(state.bodyBackground,'rgb(245, 245, 247)',name+' background');
   assert.equal(state.heroGradient,'none',name+' no hero gradient');
   assert.ok(state.planLink,name+' missing 06 link');
   assert.ok(state.overflow<=4,name+' horizontal overflow '+state.overflow);
   assert.ok(state.font.includes('PingFang')||state.font.includes('SF Pro'),name+' font stack');
   if(name==='05-compare')assert.equal(state.heroBackground,'rgb(25, 38, 51)',name+' after network uses matte dark material');
   await page.screenshot({path:path.join(art,name+'-1440.png'),animations:'disabled'});
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>errs.push('06-interaction: '+e.message));
  await page.goto(root+'plan-with-me.html?change=C004',{waitUntil:'domcontentloaded'});
  await page.locator('#pl-role-title').waitFor();
  await page.waitForFunction(()=>document.querySelector('#pl-metrics .pl-stat')?.textContent?.includes('1,600'),{timeout:15000});
  assert.equal(await page.locator('.pl-stat').count(),4,'Four sourced planning headline indicators');
  assert.equal(await page.locator('[data-role="worker"]').getAttribute('aria-pressed'),'true','C004 selects relevant worker role');
  assert.equal(await page.locator('[data-theme="industry"]').getAttribute('aria-pressed'),'true','C004 keeps actual industry event');
  assert.match(await page.locator('#pl-event-link').getAttribute('href'),/C004/);
  assert.equal(await page.locator('#pl-network .pl-map-node').count(),3);
  assert.equal(await page.locator('.pl-step').count(),4);
  const orig=await page.locator('#pl-result-title').innerText();
  await page.locator('#pl-shock').check({force:true});
  assert.notEqual(await page.locator('#pl-result-title').innerText(),orig);
  assert.equal(await page.locator('.pl-step.is-blocked').count(),3,'counterfactual visibly blocks evidence gates');
  assert.equal(new URL(page.url()).searchParams.get('pressure'),'1','research-state share URL');
  await page.locator('#pl-shock').uncheck({force:true});
  assert.equal(await page.locator('.pl-step.is-blocked').count(),0,'returns to baseline without model mutation');
  await page.locator('[data-role="shop"]').click();
  await page.locator('[data-theme="tour"]').click();
  assert.match(await page.locator('#pl-role-title').innerText(),/做生意/);
  assert.match(await page.locator('#pl-shock-label').innerText(),/游客只经过/);
  assert.ok(await page.locator('#pl-sources a[href^="http"]').count()>=2,'primary published source links');
  await page.screenshot({path:path.join(art,'06-plan-interactive-1440.png'),fullPage:true,animations:'disabled'});
  await page.close();
  const comparison=await browser.newPage({viewport:{width:1440,height:900}});
  await comparison.goto(root+'relation-compare.html?change=C006',{waitUntil:'domcontentloaded'});
  await comparison.locator('#bl-journey-next').waitFor();
  assert.match(await comparison.locator('#bl-journey-next').getAttribute('href'),/plan-with-me\.html\?from=comparison.*C006/);
  await comparison.close();
  for(const [name,file,selector] of pages){
   const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   mobile.on('pageerror',e=>errs.push(name+' mobile: '+e.message));
   await mobile.goto(root+file,{waitUntil:'domcontentloaded'});
   await mobile.locator(selector).waitFor({timeout:20000});
   if(name==='06-plan')await mobile.locator('.pl-stat').first().waitFor({timeout:20000});
   else await mobile.locator('#bl-journey-bar').waitFor({timeout:10000});
   await mobile.waitForTimeout(300);
   const ov=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(ov<=4,name+' 390px horizontal overflow '+ov);
   if(name==='06-plan'){
    await mobile.locator('[data-role="commuter"]').click();
    await mobile.locator('#pl-shock').check({force:true});
    assert.equal(await mobile.locator('#pl-path-status').getAttribute('class'),'is-pressured');
   }
   await mobile.screenshot({path:path.join(art,name+'-390.png'),animations:'disabled'});
   await mobile.close();
  }
  assert.deepEqual(errs,[],'JavaScript errors');
  console.log('✓ 01–06 desktop+390 mobile, no glow, step continuity, planning live interactions, real sources, event handoff');
 }finally{await browser.close();}
}
suite().catch(e=>{console.error(e);process.exitCode=1;});