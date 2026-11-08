"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const out=path.resolve(__dirname,"../artifacts/v11-about");
fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto("http://127.0.0.1:8765/v11/about.html",{waitUntil:"load",timeout:20000});
  assert.equal(response.status(),200);
  await page.locator("#heroTitle").waitFor();
  assert.match(await page.locator("#heroTitle").innerText(),/与你有关/);
  assert.equal(await page.locator(".journey").count(),4);
  assert.equal(await page.locator(".limits-grid > div").count(),3);
  const d=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(d<=12,"horizontal overflow "+d+" at "+width);
  await page.locator("a[href='./wind.html']").first().focus();
  await page.screenshot({path:path.join(out,"about-"+width+".png"),fullPage:true});
  assert.deepEqual(errors,[]);
  const home=await page.goto("http://127.0.0.1:8765/v11/index.html",{waitUntil:"domcontentloaded"});
  assert.equal(home.status(),200);
  assert.ok(await page.locator('footer a[href="./about.html"]').count(),"homepage link");
  console.log("PASS about "+width+", overflow="+d);
  await context.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
