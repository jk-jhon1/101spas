'use strict';
// Folha com os 50 chefes novos (sprites no tamanho do jogo, em ordem de ato, com o nome): node dev/shots_bx_sheet.js SAIDA.png [escala]
const fs = require('fs');
const { launch, INDEX_URL, run } = require('./lib');
const [OUT, SC = '1'] = process.argv.slice(2);
if (!OUT) { console.error('uso: node dev/shots_bx_sheet.js SAIDA.png [escala]'); process.exit(2); }
run(async () => {
  const b = await launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 800 } }); const errs = [];
  pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(INDEX_URL); await pg.waitForTimeout(400);
  const url = await pg.evaluate((sc) => {
    const cells = BXLIST.map(d => { const A = BXART[d.id], s = bxSpr(d.id, 0, 0), im = s.c.getContext('2d').getImageData(0, 0, s.w, s.h).data; let x0 = s.w, y0 = s.h, x1 = 0, y1 = 0; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (im[(y * s.w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { d, s, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; });
    const pad = 14, lab = 16, W = 2000, cw = 168, ch = 200; let x = pad, y = 30; const pos = [], hd = [];   // células de tamanho fixo (sprites grandes são reduzidos)
    let act = 0; const rows = [];
    for (const c of cells) { if (c.d.act !== act) { act = c.d.act; if (x > pad) { x = pad; y += ch + pad; } hd.push([y - 6, BX_ACTS[act].n]); y += 20; } if (x + cw + pad > W) { x = pad; y += ch + pad; } pos.push([x, y]); x += cw + pad; }
    const H = y + ch + pad, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#1b1e2b'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = false;
    g.font = 'bold 15px sans-serif'; g.fillStyle = '#fbbf24'; for (const [yy, t] of hd) g.fillText(t, pad, yy + 14);
    g.font = '12px sans-serif';
    cells.forEach((c, i) => { const [px, py] = pos[i], k = Math.min(1, (cw - 8) / c.w, (ch - lab - 8) / c.h) * Number(sc), w = c.w * k, h = c.h * k; g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(px, py, cw, ch); g.drawImage(c.s.c, c.x0, c.y0, c.w, c.h, px + (cw - w) / 2, py + lab + (ch - lab - h) / 2, w, h); g.fillStyle = '#e5e7eb'; g.textAlign = 'center'; g.fillText(c.d.n, px + cw / 2, py + 12); g.textAlign = 'left'; });
    return cv.toDataURL('image/png');
  }, Number(SC));
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64')); console.log('ok', OUT, errs.slice(0, 3)); await b.close();
});
