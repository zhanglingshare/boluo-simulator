const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base='http://127.0.0.1:8765/';
const dir=path.resolve(__dirname,'../artifacts/boluo-six-native');
fs.mkdirSync(dir,{recursive:true});
const pages=[
 ['01','index-legacy-2026-11-03.html'],
 ['02','town.html'],
 ['03','industry-changes.html'],
 ['04','who.html'],
 ['05','relation-compare.html'],
 ['06','plan-with-me.html']
];
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const exceptions=[];
 try{
  for(const [step,file] of pages){
   const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
   page.on('pageerror',e=>exceptions.push(step+' desktop '+e.message));
   await page.goto(base+file,{waitUntil:'domcontentloaded'});
  await page.locator('.bl-header').waitFor();
  if(await page.locator('.bp-full-disclosure').count())await page.locator('.bp-full-disclosure > summary').click();
   await page.locator('.sn-search-open').waitFor({timeout:14000});
   await page.locator('.bl-header').waitFor();
   assert.equal(await page.locator('.sn-search-open').count(),1,'shared native search, page '+step);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(14, 20, 32)');
   assert.ok(await page.locator('link[href="assets/boluo-ui.css"]').count()===1,'native stylesheet page '+step);
   if(step==='03'){
    await page.locator('#ec-graph .ec-graph-node').first().waitFor({timeout:15000,state:'attached'});
    const col=await page.locator('.ec-graph-wrap').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.equal(col,'rgb(11, 18, 30)','03 must have real matte dark evidence canvas');
    const label=await page.locator('#ec-graph .ec-graph-label').first().evaluate(el=>getComputedStyle(el).fill);
    assert.ok(['rgb(238, 242, 251)'].includes(label),'03 labels must be bright on dark: '+label);
    const focus=page.locator('.sn-stage-tool');
    await focus.click();
    assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('sn-graph-focus')),true);
    assert.equal(await page.locator('.ec-detail').evaluate(el=>getComputedStyle(el).display),'none');
    await focus.click();
    assert.notEqual(await page.locator('.ec-detail').evaluate(el=>getComputedStyle(el).display),'none');
    await page.screenshot({path:path.join(dir,'03-matte-network-1440.png'),fullPage:true,animations:'disabled'});
   }
   if(step==='05'){
    await page.locator('#bc-after .bc-node').first().waitFor({timeout:15000,state:'attached'});
    const fg=await page.locator('.bc-panel--after').evaluate(el=>getComputedStyle(el).backgroundColor);
    const bg=await page.locator('.bc-panel--before').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.equal(fg,'rgb(11, 18, 30)','05 current panel matte dark');
    assert.equal(bg,'rgb(11, 18, 30)','05 previous panel uses the shared graph canvas');
    assert.equal(await page.locator('#bc-after').evaluate(el=>getComputedStyle(el.parentElement).backgroundColor),'rgb(11, 18, 30)');
    await page.screenshot({path:path.join(dir,'05-dual-material-1440.png'),fullPage:true,animations:'disabled'});
   }
   if(step==='06'){
    await page.locator('#pl-role-title').waitFor();
    await page.waitForFunction(()=>document.querySelector('.pl-role .sn-role-glyph'),{timeout:15000});
    assert.equal(await page.locator('.pl-role .sn-role-glyph').count(),6,'six roles have tactile identity badges');
    assert.ok(await page.locator('#pl-network .pl-svg-text tspan').count()>=3,'planning node labels use bounded line wrapping');
    await page.locator('.pl-role[data-role="worker"]').click();
    assert.equal(await page.locator('.pl-role .sn-role-glyph').count(),6,'role badges survive render');
    assert.equal(await page.locator('.pl-role[data-role="worker"]').getAttribute('aria-pressed'),'true');
    await page.screenshot({path:path.join(dir,'06-role-workspace-1440.png'),fullPage:true,animations:'disabled'});
   }
   if(step==='01'){
    await page.locator('.sn-search-open').click();
    await page.locator('.sn-command-item').first().waitFor({timeout:15000});
    assert.ok(await page.locator('.sn-command-item').count()>=6);
    await page.locator('.sn-command-header input').fill('C004');
    await page.waitForFunction(()=>[...document.querySelectorAll('.sn-command-item')].some(x=>x.textContent.includes('C004')),{timeout:15000});
    const event=page.locator('.sn-command-item[href*="change=C004"]');
    assert.equal(await event.count(),1,'search hits real recorded event');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.sn-command-backdrop').isVisible(),false,'Esc closes search');
    await page.keyboard.press('Control+k');
    assert.equal(await page.locator('.sn-command-backdrop').isVisible(),true,'Control+K opens search');
    await page.locator('.sn-command-header input').fill('规划');
    await page.waitForFunction(()=>[...document.querySelectorAll('.sn-command-item')].some(x=>x.getAttribute('href')==='plan-with-me.html'));
    const link=await page.locator('.sn-command-item[href="plan-with-me.html"]').count();
    assert.equal(link,1,'planning page searchable');
    await page.keyboard.press('Escape');
   }
   await page.close();
  }
  for(const [step,file] of pages){
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   page.on('pageerror',e=>exceptions.push(step+' mobile '+e.message));
   await page.goto(base+file,{waitUntil:'domcontentloaded'});
  await page.locator('.bl-header').waitFor();
  if(await page.locator('.bp-full-disclosure').count())await page.locator('.bp-full-disclosure > summary').click();
   await page.locator('.sn-search-open').waitFor({timeout:12000});
   const ov=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(ov<=4,step+' horizontal overflow: '+ov);
   if(step==='03'){
    await page.locator('.sn-stage-tool').click();
    const visible=await page.locator('.ec-graph-panel').isVisible();
    assert.equal(visible,true);
    await page.locator('.sn-stage-tool').click();
   }
   await page.locator('.sn-search-open').click();
   assert.equal(await page.locator('.sn-command-backdrop').isVisible(),true,step+' mobile command menu');
   await page.locator('.sn-command-close').click();
   assert.equal(await page.locator('.sn-command-backdrop').isVisible(),false,step+' mobile close menu');
   if(step==='06')await page.locator('.pl-role .sn-role-glyph').first().waitFor({timeout:15000});
   await page.screenshot({path:path.join(dir,step+'-native-390.png'),animations:'disabled'});
   await page.close();
  }
  assert.deepEqual(exceptions,[],'no runtime page errors on all 6 pages');
  console.log('✓ Mac/iOS/Harmony 01–06: real searchable event corpus, 03 matte stage + focus, 05 two-material graphs, 06 role cards, 390px');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
