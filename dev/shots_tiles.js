'use strict';
// Atlas de tiles em pixel-art (isolado em cima, enterrado embaixo), ampliado 4x: node dev/shots_tiles.js SAIDA.png
const fs = require('fs');
const { launch, INDEX_URL, run } = require('./lib');
const OUT = process.argv[2];
if (!OUT) { console.error('uso: node dev/shots_tiles.js SAIDA.png'); process.exit(2); }
run(async () => {
  const b = await launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(INDEX_URL); await pg.waitForTimeout(600);
  const dataUrl = await pg.evaluate(() => {
    const names = Object.keys(T).filter(k => k !== 'air'), S = 4, COLS = 14, cw = 16 * S + 4, ch = 2 * 16 * S + 22, rows = Math.ceil(names.length / COLS);
    const c = document.createElement('canvas'); c.width = COLS * cw; c.height = rows * ch; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#2a2631'; g.fillRect(0, 0, c.width, c.height);
    names.forEach((n, i) => {
      const x = (i % COLS) * cw, y = Math.floor(i / COLS) * ch, id = T[n];
      g.fillStyle = '#4a90e2'; g.fillRect(x, y, cw, 16 * S + 2);
      const a = getTileSprite(id, 0, 0), d = getTileSprite(id, 15, 0);
      g.drawImage(a.c, a.x, a.y, 16, 16, x + 2, y + 1, 16 * S, 16 * S);
      g.drawImage(d.c, d.x, d.y, 16, 16, x + 2, y + 16 * S + 3, 16 * S, 16 * S);
      g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.fillText(n, x + 3, y + 2 * 16 * S + 16);
    });
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(OUT, Buffer.from(dataUrl.split(',')[1], 'base64')); console.log('ok', OUT);
  await b.close();
});
