'use strict';
// Utilitários compartilhados pelos scripts de teste e de captura (Playwright para Node).
//   npm install && npx playwright install chromium     (uma vez)
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const DEV = __dirname;
const ROOT = path.resolve(DEV, '..');
const INDEX_URL = pathToFileURL(path.join(ROOT, 'index.html')).href;     // file:///…/index.html
const devfile = (name) => path.join(DEV, name);                           // caminho dentro de dev/ (capturas temporárias)
const devUrl = (name) => pathToFileURL(devfile(name)).href;               // URL file:// de um arquivo de dev/
const LAUNCH_ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'];   // WebGL por software (headless sem GPU)

const opened = [];
async function launch() {
  const b = await chromium.launch({ args: LAUNCH_ARGS });
  opened.push(b);
  return b;
}

// Módulo matemático (resto sempre não negativo): em JS, (-170) % 360 dá -170, e aqui dá 190.
const mod = (a, n) => ((a % n) + n) % n;

// Executa main(); se der exceção, mostra a pilha, fecha os navegadores abertos e sai com código 1.
function run(main) {
  main().catch(async (e) => {
    console.error(e);
    await Promise.allSettled(opened.map((b) => b.close()));
    process.exit(1);
  });
}

// Espera o jogo entrar no estado "play".
const waitPlay = (pg, timeout = 90000) => pg.waitForFunction('window.__G.state === "play"', null, { timeout });

// Cria um mundo pelo botão do título (btn-adv = Aventura, btn-cre = Criativo) e espera o jogo entrar em "play".
// Não existe campo de semente: o gancho window.__nextSeed força a semente do PRÓXIMO mundo (testes reproduzíveis).
// seed = null sorteia como no jogo de verdade.
async function startWorld(pg, seed, btn = 'btn-adv', timeout = 90000) {
  if (seed !== null && seed !== undefined) await pg.evaluate((s) => { window.__nextSeed = s; }, seed);
  await pg.click('#' + btn);
  await waitPlay(pg, timeout);
}

// Erros de página (exceções) e mensagens console.error, cortados em `max` caracteres.
function collectErrors(pg, max = 300) {
  const errs = [];
  pg.on('pageerror', (e) => errs.push(String((e && e.message) || e).slice(0, max)));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, max)); });
  return errs;
}

// Formata o "detalhe" de uma verificação: texto como está, o resto como JSON.
const fmtDetail = (d) => (typeof d === 'string' ? d : JSON.stringify(d));

// Folha de contato (PNG) montada no próprio navegador (canvas) a partir de capturas de tela.
//   tiles: [{ png: Buffer, crop?: [x, y, w, h], size?: [w, h], label?: string, barH?: number }]
//   opts:  { cols, cellW, cellH }       -> devolve um Buffer PNG
async function makeSheet(browser, tiles, { cols, cellW, cellH }) {
  const page = await browser.newPage();
  try {
    const rows = Math.ceil(tiles.length / cols);
    const data = tiles.map((t) => ({ b64: t.png.toString('base64'), crop: t.crop || null, size: t.size || null, label: t.label || null, barH: t.barH || 14 }));
    const dataUrl = await page.evaluate(async ({ data, cols, rows, cellW, cellH }) => {
      const cv = document.createElement('canvas');
      cv.width = cellW * cols; cv.height = cellH * rows;
      const g = cv.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      for (let i = 0; i < data.length; i++) {
        const t = data[i];
        const img = new Image(); img.src = 'data:image/png;base64,' + t.b64; await img.decode();
        const [sx, sy, sw, sh] = t.crop || [0, 0, img.width, img.height];
        const [dw, dh] = t.size || [sw, sh];
        const ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH;
        g.drawImage(img, sx, sy, sw, sh, ox, oy, dw, dh);
        if (t.label) {
          g.fillStyle = '#000'; g.fillRect(ox, oy, dw, t.barH);
          g.fillStyle = '#fff'; g.font = '11px monospace'; g.textBaseline = 'top'; g.fillText(t.label, ox + 4, oy + 2);
        }
      }
      return cv.toDataURL('image/png');
    }, { data, cols, rows, cellW, cellH });
    return Buffer.from(dataUrl.split(',')[1], 'base64');
  } finally {
    await page.close();
  }
}

module.exports = { DEV, ROOT, INDEX_URL, devfile, devUrl, LAUNCH_ARGS, chromium, launch, mod, run, waitPlay, startWorld, collectErrors, fmtDetail, makeSheet };
