// Headless chart test: mock analyze (localhost:8787), real quotes/chart from the deployed worker.
import { createRequire } from 'node:module';
const req = createRequire('/workspace/tools/package.json');
const { chromium } = req('playwright-core');
const BASE = 'http://localhost:8090/timesnap-app/';
const REAL = 'https://timesnap-api.timesnapx.workers.dev';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [], apiSw = [];
page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
await page.route('http://localhost:8787/api/{quotes,chart}*', async (r) => { const res = await r.fetch({ url: r.request().url().replace('http://localhost:8787', REAL) }); await r.fulfill({ response: res }); });
page.on('response', (r) => { if (/api\/chart|coingecko/.test(r.url()) && r.fromServiceWorker()) apiSw.push(r.url()); });
await page.goto(BASE + '?api=http://localhost:8787#/', { waitUntil: 'networkidle' });
await page.locator('input[type=file]').nth(1).setInputFiles('/tmp/test-photo.jpg');
await page.getByText('MOCK ITEM (test response)').waitFor({ timeout: 15000 });
const out = {};
async function drag() {
  const box = await page.locator('[data-testid=chart-svg]').boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * 0.2, y }] });
  for (let i = 3; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * i / 10, y }] });
  await page.waitForTimeout(150);
  const label = await page.locator('[data-testid=crosshair-label]').textContent().catch(() => null);
  return { label, cdp };
}
for (const [tab, key, name] of [['crypto', 'crypto:bitcoin', 'btc'], ['stocks', 'stock:AAPL', 'aapl'], ['commodities', 'cmdty:GC=F', 'gold']]) {
  await page.click(`[data-tab=${tab}]`);
  await page.locator(`[data-key="${key}"]`).waitFor({ timeout: 20000 });
  await page.locator(`[data-key="${key}"]`).click();
  const res = {};
  for (const r of ['1d', '7d', '1m', '1y', '5y']) {
    await page.click(`[data-range="${r}"]`);
    await page.locator(`[role=dialog][data-range-shown="${r}"]:not([data-state=loading])`).waitFor({ timeout: 20000 });
    res[r] = (await page.locator('[data-testid=chart-error]').count()) ? 'UNAVAILABLE' : await page.locator('[data-testid=chart-change]').textContent();
  }
  await page.click('[data-range="1y"]'); await page.locator('[data-testid=chart-svg]').waitFor({ timeout: 8000 });
  const { label, cdp } = await drag();
  res.crosshair = label; res.price = await page.locator('[data-testid=chart-price]').textContent();
  await page.screenshot({ path: `/workspace/out/timesnap-v7-chart-${name}.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  res.worth = await page.locator('[data-testid=chart-worth]').textContent();
  res.hiLo = [await page.locator('[data-testid=chart-high]').textContent(), await page.locator('[data-testid=chart-low]').textContent()];
  out[name] = res;
  await page.getByRole('button', { name: 'Close' }).click();
}
out.swApiResponses = apiSw; out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await browser.close();
