// Install-button test at Pixel size with a mobile Chrome UA. Simulates beforeinstallprompt.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/workspace/tools/package.json')('playwright-core');
const APP = process.argv[2]; const PFX = process.argv[3] || 'timesnap-v5';
const UA = 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const out = {};
async function newPage(extra = {}) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, userAgent: UA, ...extra });
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && p.errors.push(m.text()));
  return p;
}
// 1) prompt available
let p = await newPage();
await p.addInitScript(() => {
  window.__promptCalls = 0;
  window.addEventListener('load', () => setTimeout(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = async () => { window.__promptCalls++; };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  }, 100));
});
await p.goto(APP + '#/', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
out.bannerVisible = await p.getByTestId('install-btn').isVisible();
out.chipVisible = await p.locator('header [data-testid=install-chip]').isVisible();
out.readyState = await p.getByTestId('install-btn').getAttribute('data-ready');
await p.screenshot({ path: `/workspace/out/${PFX}-install.png` });
await p.getByTestId('install-btn').click(); await p.waitForTimeout(400);
out.promptCalls = await p.evaluate(() => window.__promptCalls);
out.hiddenAfterAccept = !(await p.getByTestId('install-btn').count()) && !(await p.getByTestId('install-chip').count());
out.errors1 = p.errors;
// 2) no prompt -> hint sheet (Android)
p = await newPage();
await p.goto(APP + '#/', { waitUntil: 'networkidle' });
out.noPromptReady = await p.getByTestId('install-btn').getAttribute('data-ready');
await p.locator('header [data-testid=install-chip]').click(); await p.waitForTimeout(500);
out.hintAndroid = (await p.getByTestId('install-hint').innerText()).replace(/\s+/g, ' ');
await p.screenshot({ path: `/workspace/out/${PFX}-install-hint.png` });
// More sheet item
await p.getByLabel('Close install help').click();
await p.getByRole('button', { name: 'More' }).click();
out.moreItem = await p.getByRole('dialog', { name: 'More pages' }).getByRole('button', { name: 'Install app' }).isVisible();
out.errors2 = p.errors;
// 3) iOS + in-app hints
for (const [k, ua] of [['ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'],
  ['inapp', 'Mozilla/5.0 (Linux; Android 16; Pixel 10; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/en_US;FBAV/400.0]']]) {
  p = await newPage({ userAgent: ua });
  await p.goto(APP + '#/', { waitUntil: 'networkidle' });
  await p.getByTestId('install-btn').click(); await p.waitForTimeout(300);
  out['hint_' + k] = (await p.getByTestId('install-hint').innerText()).replace(/\s+/g, ' ').slice(0, 160);
}
// 4) standalone emulation -> hidden
p = await newPage();
await p.addInitScript(() => { const o = window.matchMedia.bind(window); window.matchMedia = (q) => q.includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : o(q); });
await p.goto(APP + '#/', { waitUntil: 'networkidle' });
out.standaloneHidden = !(await p.getByTestId('install-btn').count()) && !(await p.getByTestId('install-chip').count());
console.log(JSON.stringify(out, null, 2));
await b.close();
