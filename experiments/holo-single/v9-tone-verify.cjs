const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome' });
  const base = 'http://localhost:8899/holo-home-v9.html';
  const checks = [
    ['博罗 · 变化全景', '#hudTl'],
    ['关停退出', null],            // CHANGE_CFG exit 标签（图例/详情徽章动态渲染）
    ['基本盘体检', '.module-kicker'],
    ['变化账本', '.module-kicker'],
  ];
  for (const [url, name] of [['#range=month', 'month'], ['#range=month&change=C008', 'C008']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(base + url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    // 检查话术
    const body = await page.evaluate(() => document.body.innerText);
    const find = async (txt) => await page.evaluate((t) => document.body.innerText.includes(t), txt);
    const result = {};
    for (const [txt] of checks) result[txt] = await find(txt);
    // 统计标签"联系"出现在侧栏（避免与"关系"混）
    result['统计标签-联系'] = await page.evaluate(() => !!document.querySelector('.stat-lbl') && [...document.querySelectorAll('.stat-lbl')].some(x => x.textContent === '联系'));
    await page.screenshot({ path: `/tmp/v9-desc-${name}.png`, fullPage: false });
    console.log(`\n=== ${name} (${url}) ===`);
    console.log('话术检查:', JSON.stringify(result));
    console.log('JS 错误:', errors.length ? errors.slice(0,5) : '无');
    await page.close();
  }
  // 移动端
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const merr = [];
  mp.on('console', m => { if (m.type() === 'error') merr.push(m.text()); });
  mp.on('pageerror', e => merr.push(String(e)));
  await mp.goto(base + '#range=month', { waitUntil: 'networkidle', timeout: 30000 });
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: '/tmp/v9-mobile.png', fullPage: false });
  console.log('\n=== mobile 390 ===');
  console.log('JS 错误:', merr.length ? merr.slice(0,5) : '无');
  await mp.close();
  await browser.close();
  console.log('\nDONE');
})();
