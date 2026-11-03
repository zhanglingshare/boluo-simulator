const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT='http://127.0.0.1:8765/';
const OUT=path.resolve(__dirname,'..','artifacts','editorial');
fs.mkdirSync(OUT,{recursive:true});
const cases=[
 {id:'01',url:'index-legacy-2026-11-03.html',role:'today'},
 {id:'02',url:'town.html',role:'town'},
 {id:'03',url:'industry-changes.html?from=today',role:'changes'},
 {id:'04',url:'who.html?from=changes&change=C004',role:'basic'},
 {id:'05',url:'relation-compare.html?change=C004&from=changes',role:'comparison'}
];
async function load(page,c){
 await page.goto(ROOT+c.url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#bl-journey-bar').waitFor({timeout:20000});
 if(c.id==='01')await page.waitForFunction(()=>document.querySelectorAll('#topicList .tcard').length>=8,{timeout:16000});
 if(c.id==='02')await page.waitForFunction(()=>document.querySelectorAll('#grid .town').length===16,{timeout:16000});
 if(c.id==='03')await page.waitForFunction(()=>document.querySelector('#ec-total')?.textContent==='12',{timeout:16000});
 if(c.id==='04')await page.waitForFunction(()=>document.querySelector('#bl-journey-baseline')&&!document.querySelector('#bl-journey-baseline').hidden,{timeout:16000});
 if(c.id==='05')await page.waitForFunction(()=>document.querySelector('#bc-event-id')?.textContent==='C004',{timeout:16000});
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  for(const mobile of [false,true]){
   const suffix=mobile?'mobile-390':'desktop-1440';
   const page=await browser.newPage(mobile?{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:980},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(suffix+': '+e.message));
   for(const c of cases){
    await load(page,c);
    assert.equal(await page.locator('body').getAttribute('data-bl-journey'),c.role,c.id);
    const nav=await page.locator('#bl-journey-bar').innerText();
    assert.match(nav,/01/);assert.match(nav,/05/);
    if(c.id==='01'){
     assert.equal(await page.locator('#forecastVote').isVisible(),false,'01 should not foreground game vote');
     await page.locator('#ed-hot-count').waitFor();
     assert.ok((await page.locator('#ed-hot-bars .ed-barrow').count())>=4);
    }
    if(c.id==='02'){
     assert.equal(await page.locator('.town').count(),16);
     await page.locator('#ed-town-tools input').fill('园洲');
     await page.waitForTimeout(60);
     const count=await page.locator('#ed-town-count').innerText();
     assert.match(count,/1 \/ 16/,'filter should resolve town');
     await page.locator('#ed-town-tools input').fill('');
    }
    if(c.id==='03'){
     assert.equal(await page.locator('#ec-total').innerText(),'12');
     assert.ok((await page.locator('#ec-graph [data-node]').count())>=4);
     assert.ok((await page.locator('#ec-graph [data-edge]').count())>=2);
     assert.match(await page.locator('#detailTitle').innerText(),/签约4宗/);
     assert.match(await page.locator('#ec-uncertainty').innerText(),/尚未投产|待落地|待建/);
     await page.locator('#ec-feed-list [data-event="C008"]').click({force:true});
     assert.equal(new URL(page.url()).hash,'#change=C008');
     assert.match(await page.locator('#detailTitle').innerText(),/固力水泥/);
     await page.locator('#ec-feed-list [data-event="C004"]').click({force:true});
    }
    if(c.id==='04'){
     assert.match(await page.locator('h1').first().innerText(),/基本盘/);
     assert.ok((await page.locator('body').innerText()).includes('970.87'));
     assert.ok((await page.locator('#bl-compare-next').getAttribute('href')).includes('change=C004'));
    }
    if(c.id==='05'){
     assert.equal(await page.locator('#bc-event-list .bc-event').count(),12);
     assert.equal(await page.locator('#bc-after [data-node="hpm"]').count(),1);
    }
    if(mobile){
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
     assert.ok(overflow<=3,c.id+' mobile overflow '+overflow);
    }
    await page.screenshot({path:path.join(OUT,c.id+'-'+suffix+'.png'),fullPage:true,animations:'disabled'});
   }
   await page.close();
  }
  assert.deepEqual(errors,[],'JS errors in inspected pages');
  console.log('PASS: editorial UI 01-05 desktop 1440 and mobile 390, navigation, data, interactions, screenshots');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
