"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const out=path.resolve(__dirname,"../artifacts/v11-front-six");
fs.mkdirSync(out,{recursive:true});
const ids=[
 {page:"index",ready:"#inquiryButtons",click:"#inquiryButtons button",check:null},
 {page:"reality",ready:"#evidenceHeatmap",click:'[data-open="methods"]',check:"#drawer"},
 {page:"industry-base",ready:"#riskVisuals",click:"#methodBtn",check:"#detailOverlay"},
 {page:"relations",ready:"#relationshipStage",click:'[data-kind="inferred"]',check:'[data-kind="inferred"]'},
 {page:"impact",ready:".impact-workspace",click:'[data-case="orders"]',check:'[data-case="orders"]'},
 {page:"plan",ready:"#network",click:'[data-region="urban"]',check:'[data-region="urban"]'}
];
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{for(const width of [1440,390]){
 const mobile=width===390;const context=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 for(const item of ids){
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/v11/"+item.page+".html",{waitUntil:"domcontentloaded",timeout:20000});
  await page.locator(item.ready).waitFor({state:"attached",timeout:12000});
  await page.waitForTimeout(220);
  const heading=await page.locator("h1").first().innerText();
  assert.ok(heading.trim().length>4,item.page+" heading");
  const click=page.locator(item.click).first();
  if(await click.count()&&await click.isVisible()){
   await click.click({timeout:8000});
   await page.waitForTimeout(150);
  }
  const text=await page.locator("body").innerText();
  assert.doesNotMatch(text,/SmartPLS|PLS-SEM|\bSEM\b|\bSNA\b|蒙特卡洛|情报初筛|研究性归纳|方法论教学/i,item.page+" public copy");
  if(item.page==="reality")assert.match(text,/这些数字能放在一起比较吗/);
  if(item.page==="industry-base")assert.match(text,/这些数字，能说明什么/);
  if(item.page==="impact")assert.match(text,/公开变化/);
  const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
  assert.ok(overflow<45,item.page+" "+width+" excessive viewport overflow "+overflow);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await page.screenshot({path:path.join(out,item.page+"-"+width+".png"),fullPage:true});
  assert.deepEqual(errors,[],"page script errors "+item.page+": "+errors.join(" | "));
  console.log("PASS "+item.page+" "+width+" viewport overflow="+overflow);
  await page.close();
 }
 await context.close();
}}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
