// Currency feature test: default AUD, picker search, EUR/JPY formatting, persistence. Uses MOCK worker for the snap.
import { createRequire } from 'node:module';
const req = createRequire('/workspace/tools/package.json');
const { chromium } = req('playwright-core');
const APP = process.argv[2];
async function shot(page, path) {
  await page.waitForTimeout(600);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 412, height: Math.max(915, h) }); await page.waitForTimeout(200);
  await page.screenshot({ path }); await page.setViewportSize({ width: 412, height: 915 });
}
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const cross = []; page.on('request', (r) => { if (/er-api|currency-api/.test(r.url())) cross.push(r.url()); });
await page.goto(APP + '?api=http://localhost:8787#/', { waitUntil: 'networkidle' });
const out = { defaultChip: await page.locator('header button[aria-label^="Currency"]').innerText() };
await page.locator('input[type=file]').nth(1).setInputFiles('/tmp/test-photo.jpg');
await page.getByText('Save to Vault').waitFor();
const val = () => page.locator('[data-testid=result-card] .font-display').first().innerText();
out.aud = await val();
out.ratesNote = await page.getByText(/rates as of/).first().innerText();
for (const [q, code] of [['euro', 'EUR'], ['yen', 'JPY']]) {
  await page.locator('header button[aria-label^="Currency"]').click();
  if (code === 'EUR') { await page.waitForTimeout(500); await page.screenshot({ path: '/workspace/out/timesnap-v4-picker.png' }); }
  await page.getByLabel('Search currencies').fill(q);
  await page.locator(`[data-code=${code}]`).click();
  out[code] = await val();
}
out.listCount = await (async () => { await page.locator('header button[aria-label^="Currency"]').click(); await page.waitForTimeout(300); const n = await page.locator('[data-testid=currency-list] li').count(); await page.getByLabel('Close currency picker').click(); return n; })();
// back to AUD via More sheet
await page.getByRole('button', { name: 'More' }).click(); await page.getByRole('button', { name: /^Currency [A-Z]{3}$/ }).click();
await page.getByLabel('Search currencies').fill('AUD'); await page.locator('[data-code=AUD]').click();
out.backToAud = await val();
await shot(page, '/workspace/out/timesnap-v4-result-aud-mock.png');
await page.getByText('Save to Vault').click(); await page.waitForURL(/vault/);
await page.reload({ waitUntil: 'networkidle' });
await shot(page, '/workspace/out/timesnap-v4-vault-aud-mock.png');
out.vaultTotal = await page.getByText('Total Value Captured').locator('xpath=..').innerText();
out.stored = await page.evaluate(() => ({ currency: localStorage.getItem('timesnap.currency'), usdValue: JSON.parse(localStorage.getItem('snaps-storage')).state.snaps[0].usdValue, ratesCached: !!localStorage.getItem('timesnap.fxRates') }));
// edit in AUD -> stored in USD
await page.getByLabel('Edit').first().click();
out.editLabel = await page.getByText(/AUD Value/).innerText();
out.editPrefill = await page.locator('input[type=number]').inputValue();
await page.locator('input[type=number]').fill('300'); await page.getByRole('button', { name: /Save/ }).last().click();
out.usdAfterEdit300Aud = await page.evaluate(() => JSON.parse(localStorage.getItem('snaps-storage')).state.snaps[0].usdValue);
await page.goto(APP + '#/subscriptions', { waitUntil: 'networkidle' });
out.subsNote = await page.getByText(/approx., billed in USD/).first().innerText();
// SW must not cache rate calls
out.swCaches = await page.evaluate(async () => { const o = []; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) o.push(r.url); return o.filter((u) => /er-api|currency-api/.test(u)); });
out.rateRequests = [...new Set(cross)]; out.errors = errors;
console.log(JSON.stringify(out, null, 2));
await browser.close();
