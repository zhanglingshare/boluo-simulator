const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8899/holo-home-v9.html#range=month', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const el = document.getElementById('hudTl');
    const st = el ? getComputedStyle(el) : null;
    return { exists: !!el, text: el ? el.textContent : null, display: st ? st.display : null, visibility: st ? st.visibility : null, html: document.querySelector('.stage-hud') ? document.querySelector('.stage-hud').innerHTML : null };
  });
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})();
