// Verify each Snap button opens the intended file input (camera vs gallery).
import { createRequire } from 'node:module';
const req = createRequire('/workspace/tools/package.json');
const { chromium } = req('playwright-core');
const APP = process.argv[2], SHOT = process.argv[3];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(APP + '#/', { waitUntil: 'networkidle' });
if (SHOT) await page.screenshot({ path: SHOT });
const out = {};
for (const [k, sel] of [['gallery', '[data-testid=choose-gallery]'], ['camera', '[data-testid=take-photo]'], ['dropzone', 'text=Click or tap here']]) {
  const choosers = []; const h = (fc) => choosers.push(fc); page.on('filechooser', h);
  await page.click(sel); await page.waitForTimeout(700); page.off('filechooser', h);
  out[k] = await Promise.all(choosers.map((fc) => fc.element().evaluate((el) => el.getAttribute('capture'))));
}

console.log(JSON.stringify({ choosersCaptureAttr: out, errors }));
await browser.close();
