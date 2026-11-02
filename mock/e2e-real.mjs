// Real end-to-end Snap test (real worker + Gemini). Usage: node e2e-real.mjs <appUrl> <apiBase|""> <prefix> photo...
import { createRequire } from 'node:module';
const req = createRequire('/workspace/tools/package.json');
const { chromium } = req('playwright-core');

// Full-length mobile screenshot: grow the viewport to the page height so fixed bars sit at the bottom.
async function shot(page, path) {
  await page.waitForTimeout(600);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 412, height: Math.max(915, h) });
  await page.waitForTimeout(200);
  await page.screenshot({ path });
  await page.setViewportSize({ width: 412, height: 915 });
}
const [APP, API, PREFIX, ...photos] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console ' + m.text()));
const results = [];
for (const [i, photo] of photos.entries()) {
  await page.goto(APP + (API ? `?api=${API}` : '') + '#/', { waitUntil: 'networkidle' });
  const respP = page.waitForResponse((r) => r.url().includes('/api/analyze-image') && r.request().method() === 'POST', { timeout: 120000 });
  const t0 = Date.now();
  await page.locator('input[type=file]').nth(1).setInputFiles(photo);
  const resp = await respP; const body = await resp.json(); const ms = Date.now() - t0;
  await page.getByText('Save to Vault').waitFor({ timeout: 10000 });
  await shot(page, `/workspace/out/${PREFIX}-${i + 1}-result.png`);
  results.push({ photo, status: resp.status(), latencyMs: ms, name: body.name, usdValue: body.usdValue, tags: body.tags, reasoning: body.valuationReasoning, sources: (body.sources || []).length, error: body.error });
  await page.getByText('Save to Vault').click();
  await page.waitForURL(/#\/vault/);
}
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('snaps-storage')).state.snaps.map((s) => s.title));
await shot(page, `/workspace/out/${PREFIX}-vault.png`);
console.log(JSON.stringify({ results, persistedAfterReload: persisted, errors }, null, 2));
await browser.close();
