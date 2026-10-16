// Headless smoke test: loads index.html, starts a race, fast-forwards the sim and reports fleet progress.
// Usage: npm i playwright three@0.128.0 && node tests/race-sim.mjs [boat] [wind] [minutes]
// CHROME env var can point at a Chromium binary (default: Playwright's bundled one).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const threeDir = path.dirname(require.resolve('three/package.json'));
const [boat = 'sabre', wind = 'moderate', mins = '8'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.route('**/*', async r => {
  const u = r.request().url();
  if (u.startsWith('http://test.local/')) return r.fulfill({ body: html, contentType: 'text/html' });
  const m = u.match(/three@0\.128\.0\/(.*)$/); if (m) return r.fulfill({ body: fs.readFileSync(path.join(threeDir, m[1]), 'utf8'), contentType: 'application/javascript' });
  return r.abort(); // fonts, weather and leaderboard are offline in tests
});
await page.goto('http://test.local/');
await page.waitForSelector('#go', { timeout: 60000 });
await page.click(`[data-boat="${boat}"]`); await page.click(`[data-wind="${wind}"]`); await page.click('#go');
const out = await page.evaluate((mins) => {
  const T = __pp, A = T.AIS, res = [];
  T.run(31); res.push(`gun: ${A.filter(a => a.ocs).length} rivals over early`);
  for (let k = 1; k <= mins; k++) { T.run(60);
    res.push(`t=${k}min  Rye fleet legs ${A.filter(a => a.fd > 0).map(a => a.leg).join('')}  Rosebud fleet legs ${A.filter(a => a.fd < 0).map(a => a.leg).join('')}  doing turns ${A.filter(a => a.penDeg > 0).length}  aground ${A.filter(a => a.aground).length}  finished ${A.filter(a => a.finished).length}/19`); }
  return res;
}, +mins);
console.log(out.join('\n'));
console.log('page errors:', errs.length ? errs.join(' | ') : 'none');
await browser.close();
