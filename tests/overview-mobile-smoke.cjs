/* Browser smoke checks for the five-stage Boluo core journey, especially mobile overview. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const BASE = process.env.BOLUO_BASE_URL || 'http://127.0.0.1:8765/';
const widths = [360, 390, 430, 768, 1440];
const pages = ['holo-home-v11.html','who-v2.html','windtunnel-v2.html','report.html','ending.html'];
(async () => {
 const browser = await chromium.launch({headless:true});
 fs.mkdirSync('artifacts/boluo-qa',{recursive:true});
 const failures = [];
 for(const width of widths){
  const page = await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1,isMobile:width<=430,hasTouch:width<=430});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(BASE+'holo-home-v11.html',{waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('#bl-unav').waitFor({timeout:18000});
    await page.locator('#network').waitFor({timeout:18000});
    await page.locator('#changeCards .change-card').first().waitFor({timeout:22000});
    assert.equal(await page.locator('#bl-unav').count(),1,'One shared navigation only');
    assert.equal(await page.locator('.unified-nav').count(),0,'No duplicate legacy navigation');
    const metrics=await page.evaluate(()=>({
      viewport:window.innerWidth,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      canvasRect:document.querySelector('.canvas').getBoundingClientRect().toJSON(),
      bodyClass:document.body.className,
      navVisible:getComputedStyle(document.querySelector('#bl-unav')).display!=='none',
      mobileButtonVisible:getComputedStyle(document.querySelector('.bl-mobile-detail-jump')).display!=='none'
    }));
    assert.ok(metrics.navVisible,'Shared navigation should be visible');
    assert.ok(metrics.overflow<=3,'No horizontal scrolling at '+width+'px; overflow='+metrics.overflow);
    if(width<=430){
      assert.ok(metrics.mobileButtonVisible,'Mobile detail jump should be visible');
      await page.locator('.bl-mobile-detail-jump').click();
      await page.waitForTimeout(400);
      const target=await page.locator('#changes-panel').boundingBox();
      assert.ok(target && target.y<850,'Detail panel should be reached after tap');
      const tabs=page.locator('#bl-unav .bl-unav-step');
      assert.equal(await tabs.count(),5,'Five navigation stages');
      await tabs.nth(1).click();
      assert.ok(await page.locator('#bl-unav a[href$="who-v2.html"]').count()>0,'Basic view reachable');
    }
    await page.screenshot({path:'artifacts/boluo-qa/overview-'+width+'.png',fullPage:true,animations:'disabled'});
    if(errors.length)throw Error('Page JS errors: '+errors.join('; '));
    console.log('PASS overview '+width+'px');
  }catch(e){failures.push('overview '+width+': '+e.message);console.error('FAIL',failures[failures.length-1])}
  await page.close();
 }
 for(const p of pages.slice(1)){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
    await page.goto(BASE+p,{waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('#bl-unav').waitFor({timeout:10000});
    assert.equal(await page.locator('#bl-unav').count(),1,'nav count for '+p);
    const targets=await page.locator('#bl-unav .bl-unav-next').getAttribute('href');
    assert.ok(targets?.includes('.html'),'Next-stage link missing: '+p);
    const next=new URL(targets,BASE);
    const response=await page.request.get(next.toString());
    assert.equal(response.status(),200,'Broken next-stage route '+p);
    if(errors.length)console.warn('Nonfatal page JS errors on '+p+': '+errors.slice(0,3).join('; '));
    console.log('PASS nav '+p);
  }catch(e){failures.push(p+': '+e.message);console.error('FAIL',failures[failures.length-1])}
  finally{await page.close()}
 }
 await browser.close();
 if(failures.length){console.error(failures.join('\n'));process.exit(1)}
 console.log('PASS all mobile-nav smoke tests');
})().catch(e=>{console.error(e);process.exit(1)});
