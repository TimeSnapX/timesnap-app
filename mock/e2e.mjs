// Headless e2e test against the built app + MOCK worker.
import { createRequire } from 'node:module';
const req = createRequire('/workspace/tools/package.json');
const { chromium } = req('playwright-core');
const BASE = 'http://localhost:8090/timesnap-app/';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console ' + m.text()));
const pages = [['snap', ''], ['vault', 'vault'], ['roadmap', 'roadmap'], ['token', 'token'], ['subscriptions', 'subscriptions'], ['vision', 'vision'], ['faq', 'faq']];
for (const [n, p] of pages) {
  await page.goto(BASE + '#/' + p, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `/workspace/out/timesnap-${n}.png`, fullPage: true });
}
// menu
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.locator('div.md\\:hidden button').first().click();
await page.screenshot({ path: '/workspace/out/timesnap-menu.png' });
// Snap flow with mock API
await page.goto(BASE + '?api=http://localhost:8787#/', { waitUntil: 'networkidle' });
const inputs = page.locator('input[type=file]');
const cap = await inputs.nth(0).getAttribute('capture');
let sentLen = 0, sentPrefix = '';
page.on('request', (r) => { if (r.url().includes('/api/analyze-image') && r.method() === 'POST') { const im = JSON.parse(r.postData()).image; sentLen = im.length; sentPrefix = im.slice(0, 23); } });
await inputs.nth(1).setInputFiles('/tmp/test-photo.jpg');
await page.getByText('MOCK ITEM (test response)').waitFor({ timeout: 15000 });
const dims = await page.evaluate(() => { const i = document.querySelector('img[alt=Preview]'); return [i.naturalWidth, i.naturalHeight]; });
await page.screenshot({ path: '/workspace/out/timesnap-snap-result.png', fullPage: true });
await page.getByText('Save to Vault').click();
await page.waitForURL(/#\/vault/);
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.getByText('MOCK ITEM (test response)').count();
const stored = await page.evaluate(() => Object.keys(localStorage));
await page.screenshot({ path: '/workspace/out/timesnap-vault-saved.png', fullPage: true });
// deep link
await page.goto(BASE + '#/faq', { waitUntil: 'networkidle' });
const deep = await page.locator('h1').first().textContent();
console.log(JSON.stringify({ captureAttr: cap, downscaledDims: dims, sentLen, sentPrefix, persistedAfterReload: persisted, localStorageKeys: stored, deepLinkH1: deep, errors }, null, 2));
await browser.close();
