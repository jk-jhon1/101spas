'use strict';
// Folha com todos os tiles/itens do jogo: node dev/tilesheet.js SAIDA.png
const { launch, INDEX_URL, run } = require('./lib');

const OUT = process.argv[2];
if (!OUT) { console.error('uso: node dev/tilesheet.js SAIDA.png'); process.exit(2); }

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await pg.goto(INDEX_URL);
  await pg.waitForTimeout(400);
  const dim = await pg.evaluate(() => {
  const ids = []; for (let i = 1; i < TD.length; i++) ids.push(i);
  const cols = 14, S = 4, cell = 16 * S + 6, rows = Math.ceil(ids.length / cols) * 2;
  const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell + 4; const g = c.getContext('2d');
  g.fillStyle = '#6aa8ec'; g.fillRect(0, 0, c.width, c.height / 2); g.fillStyle = '#35303a'; g.fillRect(0, c.height / 2, c.width, c.height / 2);
  g.imageSmoothingEnabled = false;
  ids.forEach((id, k) => {
    const cx = (k % cols) * cell, cy = Math.floor(k / cols) * cell * 2;
    for (let row = 0; row < 2; row++) { const mask = row === 0 ? 0 : 15; const s = getTileSprite(id, mask, 0); g.drawImage(s.c, s.x, s.y, 16, 16, cx + 3, cy + row * cell + 3, 16 * S, 16 * S); }
    g.fillStyle = '#fff'; g.font = '9px sans-serif'; g.fillText(TD[id].k, cx + 2, cy + 2 * cell - 2);
  });
  document.body.innerHTML = ''; document.body.style.background = '#000'; document.body.appendChild(c); c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  return [c.width, c.height];
});
  await pg.setViewportSize({ width: dim[0], height: dim[1] });
  await pg.screenshot({ path: OUT, fullPage: false });
  console.log(dim);
  await b.close();
});
