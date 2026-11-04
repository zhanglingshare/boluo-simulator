const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:8765/';
const out=path.resolve(__dirname,'../artifacts/boluo03');fs.mkdirSync(out,{recursive:true});
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  for(const size of [{width:1440,height:950},{width:390,height:844}]){
   const page=await browser.newPage({viewport:size,deviceScaleFactor:1,isMobile:size.width<500,hasTouch:size.width<500});
   page.on('pageerror',e=>errors.push(size.width+': '+e.message));
   await page.goto(base+'industry-changes.html?from=today&topic='+encodeURIComponent('公开资料观察'),{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.bl-header').waitFor();
  if(await page.locator('.bp-full-disclosure').count())await page.locator('.bp-full-disclosure > summary').click();
   await page.waitForFunction(()=>document.querySelector('#ec-total')?.textContent==='12'&&document.querySelectorAll('#ec-graph [data-node]').length>=4,{timeout:18000});
   assert.equal(await page.locator('#ec-feed-list .ec-feed-item').count(),12);
   assert.match(await page.locator('#detailTitle').innerText(),/签约4宗/);
   assert.ok((await page.locator('#ec-graph [data-edge]').count())>=3,'graph edges must be real');
   await page.locator('.ec-detail .sn-fold > summary').click();
   assert.match(await page.locator('#ec-uncertainty').innerText(),/签约|待落地|未投产|待建/);
   assert.match(await page.locator('#ec-compare').getAttribute('href'),/relation-compare\.html\?change=C004/);
   assert.match(await page.locator('#ec-next').getAttribute('href'),/who\.html\?from=changes&change=C004/);
   const pending=await page.locator('#ec-graph [data-node="hpm"]').getAttribute('aria-label');
   assert.match(pending,/具身机器人|精密制造/);
   await page.locator('#ec-graph [data-node="hpm"]').click({force:true});
   assert.match(await page.locator('#ec-inspector-text').innerText(),/签约|在建|投产/);
   const filter=page.locator('#ec-filters [data-filter="exit"]');
   await filter.click();
   assert.equal(await page.locator('#ec-feed-list .ec-feed-item').count(),1);
   await page.locator('#ec-filters [data-filter="all"]').click();
   await page.locator('#ec-feed-list [data-event="C008"]').click({force:true});
   assert.match(await page.locator('#detailTitle').innerText(),/固力水泥/);
   assert.equal(new URL(page.url()).hash,'#change=C008');
   await page.locator('#ec-feed-list [data-event="C004"]').click({force:true});
   await page.screenshot({path:path.join(out,'03-'+size.width+'.png'),fullPage:true,animations:'disabled'});
   if(size.width===390){
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=3,'mobile viewport overflow '+overflow);
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('✓ editorial 03: 12 evidence events, graph clicks, changes/filters, preserved deep links; desktop/mobile screenshots');
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
