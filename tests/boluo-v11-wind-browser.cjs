"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.resolve(__dirname,"../artifacts/v11-public");
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [1440,390]){
   const mobile=width===390;
   const ctx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto("http://127.0.0.1:8765/v11/wind.html?shock=delay&bs=1.00",{waitUntil:"domcontentloaded"});
   await page.locator("#conditionDelta").waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>document.getElementById("conditionDelta")?.textContent?.includes("亿元"));
   assert.equal(await page.locator("#conditionBoard [data-shock]").count(),3);
   assert.equal(await page.locator("#detailChart").count(),1);
   const initial=await page.locator("#afterMedian").innerText();
   await page.locator("#baseScale").evaluate(el=>{el.value="1.2";el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));});
   await page.waitForTimeout(350);
   const altered=await page.locator("#afterMedian").innerText();
   assert.notEqual(initial,altered,"baseline slider must recompute");
   await page.locator("#conditionBoard [data-shock='orders']").click();
   await page.waitForFunction(()=>document.getElementById("conditionQuestion")?.textContent?.includes("采购订单"));
   const dest=await page.locator("#conditionToEight").getAttribute("href");
   assert.ok(dest.includes("shock=orders"),"handoff must use chosen condition");
   assert.ok(dest.includes("bs=1.20")||dest.includes("bs=1.2"),"handoff retains adjusted baseline");
   await page.locator("[data-dist-view='cdf']").click();
   assert.equal(await page.locator("[data-dist-view='cdf']").getAttribute("aria-pressed"),"true");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<14,"site should avoid viewport overflow: "+overflow);
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(dir,mobile?"wind-mobile.png":"wind-desktop.png"),fullPage:true});
   assert.deepEqual(errors,[],"uncaught errors: "+errors.join(" | "));
   console.log("wind "+width+": changed median "+initial+" -> "+altered+", overflow="+overflow);
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
