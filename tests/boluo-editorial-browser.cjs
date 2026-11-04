const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BASE='http://127.0.0.1:8765/';
const dir=path.resolve(__dirname,'..','artifacts','boluo-editorial');
fs.mkdirSync(dir,{recursive:true});
const pages=[
 {file:'index-legacy-2026-11-03.html',code:'01',selector:'#topicList .tcard',min:12},
 {file:'town.html',code:'02',selector:'.town',min:16},
 {file:'holo-home-v9.html',code:'03',selector:'#changeList .change-card',min:1},
 {file:'who.html',code:'04',selector:'.be-town',min:4},
 {file:'relation-compare.html?change=C004',code:'05',selector:'.bc-event',min:12}
];
async function run(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 const notes=[];
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   for(const entry of pages){
    const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:viewport.width<500,hasTouch:viewport.width<500});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+entry.file,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.bl-header').waitFor();
  if(await page.locator('.bp-full-disclosure').count())await page.locator('.bp-full-disclosure > summary').click();
    await page.locator(entry.selector).first().waitFor({timeout:16000});
    const count=await page.locator(entry.selector).count();
    assert.ok(count>=entry.min,entry.code+': too few entries: '+count);
    const bg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
    const w=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(w<=5,entry.code+': horizontal overflow '+w+'px at '+viewport.width);
    assert.equal(bg,'rgb(14, 20, 32)',entry.code+': shared observatory background');
    assert.equal(await page.locator('#bl-journey-bar').count(),1,entry.code+' missing shared nav');
    if(entry.code==='01'){
     assert.equal(await page.locator('#baseHit').count(),0);
     assert.ok(await page.locator('#bl-live-brief .bl-evidence-row').count()>=3);
    }
    if(entry.code==='03'){
     assert.ok(await page.locator('#stage').isVisible(),'03 canvas missing');
     await page.waitForTimeout(250);
     assert.equal(await page.locator('#statNodes').innerText(),'36');
    }
    if(entry.code==='04'){
     assert.equal(await page.locator('#c4 .be-town').count(),4);
     const actual=await page.evaluate(()=>{
      const opt=echarts.getInstanceByDom(document.getElementById('c1'))?.getOption();
      return opt?.series?.[0]?.data;
     });
     assert.deepEqual(actual,[970.87,1005.45]);
    }
    if(entry.code==='05'){
     assert.equal(await page.locator('#bc-event-id').innerText(),'C004');
     assert.equal(await page.locator('#bc-after [data-edge="E019"]').count(),1);
    }
    const file=path.join(dir,entry.code+'-'+viewport.width+'.png');
    await page.screenshot({path:file,fullPage:true});
    notes.push({code:entry.code,viewport:viewport.width,items:count,body:bg,overflow:w,errors});
    // 仅明确页面脚本错误导致失败；WebGL缺失应有降级界面，不应阻断所有页面
    if(errors.length){const bad=errors.filter(e=>!/WebGL context|GL_INVALID|THREE\.WebGLRenderer/.test(e));assert.deepEqual(bad,[],entry.code+': runtime errors');}
    await page.close();
   }
  }
  console.log('✓ Five pages 01–05 checked on desktop 1440 and mobile 390: '+JSON.stringify(notes));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
