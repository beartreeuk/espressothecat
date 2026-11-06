// Open every page at two viewports over the DevTools protocol; record console errors, failed requests, overflow; save shots.
// usage: node shoot2.mjs <base url> <outdir>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [base, outdir] = process.argv.slice(2);
const pages = ['index.html', 'work/back-office.html', 'work/talent-radar.html', 'work/harness.html', 'work/needle-drop.html', 'work/metalol.html', 'work/ollama-mcp.html', 'work/fractal-mcp.html', 'work/this-site.html', 'work/demo/talent-radar.html'];
const sizes = [[1440, 900], [390, 844]];
mkdirSync(outdir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 100);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${port}`, '--window-size=1440,900',
  '--user-data-dir=' + join(outdir, 'profile-' + port), 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
let errors = [], bad = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errors.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && (m.params.entry.level === 'error' || m.params.entry.level === 'warning')) errors.push('log ' + m.params.entry.level + ': ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) bad.push(m.params.response.status + ' ' + m.params.response.url);
  if (m.method === 'Network.loadingFailed' && !m.params.canceled) bad.push('failed ' + m.params.errorText + ' ' + m.params.requestId);
  if (m.method === 'Network.requestWillBeSent' && !m.params.request.url.startsWith(base) && !m.params.request.url.startsWith('data:')) bad.push('external ' + m.params.request.url);
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
const report = [];
for (const p of pages) {
  for (const [W, H] of sizes) {
    errors = []; bad = [];
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 });
    await send('Page.navigate', { url: base + p });
    await sleep(3500);
    const total = await evaluate('document.documentElement.scrollHeight');
    const label = p.replace(/\.html$/, '').replaceAll('/', '-') + '-' + W;
    let y = 0, n = 0;
    while (y < total && n < 12) {
      await evaluate(`window.scrollTo(0, ${y}); true`);
      await sleep(n === 0 ? 1200 : 500);
      if (true) {
        const { result } = await send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(outdir, `${label}-${String(n).padStart(2, '0')}.png`), Buffer.from(result.data, 'base64'));
      }
      y += Math.floor(H * 0.9); n++;
    }
    await sleep(400);
    const overflow = await evaluate(`(() => {
      const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const wide = [...document.querySelectorAll('body *')].filter(e => !e.closest('.rail') && e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 6).map(e => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '') + ' ' + Math.round(e.getBoundingClientRect().right));
      return { sw, wide };
    })()`);
    const fonts = await evaluate(`document.fonts.check('16px "Young Serif"') && document.fonts.check('16px "Instrument Sans"')`);
    const navH = await evaluate(`document.querySelector('.nav').getBoundingClientRect().height`);
    report.push({ page: p, width: W, total, errors, bad, overflow, fonts, navH });
  }
}
console.log(JSON.stringify(report, null, 1));
ws.close(); chrome.kill();
