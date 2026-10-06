'use strict';
// Biomas e camadas do mundo (floresta, deserto, selva, neve, oceano, ilha, cavernas, inferno…): node dev/shots_world.js SAIDA.png
const fs = require('fs');
const { launch, INDEX_URL, run, waitPlay, makeSheet } = require('./lib');

const OUT = process.argv[2];
if (!OUT) { console.error('uso: node dev/shots_world.js SAIDA.png'); process.exit(2); }
const FIND = () => {
  const wd = G.world, out = {};
  const floorAt = (x, y0, y1) => { for (let y = y0; y < y1; y++) if (!wd.solid(x, y) && wd.solid(x, y + 1) && !wd.solid(x, y - 1) && !wd.solid(x, y - 2) && !wd.solid(x, y-3) && wd.liqAt(x, y) < 30) return y; return -1; };
  out.forest = [575, wd.surf[575] - 3]; out.desert = [250, wd.surf[250] - 3]; out.jungle = [900, wd.surf[900] - 3]; out.snow = [1150, wd.surf[1150] - 3];
  out.ocean = [60, 124];
  for (let y = 28; y < 70; y++) for (let x = 100; x < 1300; x++) if (wd.t[x + y * wd.w] === T.grass && y < 75) { out.island = [x, y - 4]; y = 999; break; }
  for (const [k, y0, y1, x0] of [['cave', 190, 280, 600], ['deep', 320, 395, 700], ['hell', 425, 470, 800], ['cave2', 190, 280, 300]]) { for (let dx = 0; dx < 400; dx++) { const x = x0 + dx, y = floorAt(x, y0, y1); if (y > 0) { out[k] = [x, y]; break; } } }
  return out;
};
const GO = ([tx, ty, time, torches]) => {
  const P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.time = time; G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0;
  P.x = tx * TS; P.y = ty * TS - 4; P.vx = P.vy = 0; P.fallStart = 0; G.cam.init = false; P.inv[1] = null; P.sel = 0;
  if (torches) { const wd = G.world, y = Math.floor(P.y / TS) + 1; for (const dx of [-3, 4, 9, -8]) { for (let yy = y; yy > y - 3; yy--) if (!wd.solid(tx + dx, yy)) { wd.set(tx + dx, yy, T.torch); break; } } }
  for (let i = 0; i < 25; i++) { __step(1 / 60); } G.paused = true; __render(); return [P.x, P.y];
};

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '777'); await pg.click('#btn-cre');
  await waitPlay(pg);
  await pg.evaluate("document.getElementById('toasts').style.display='none'");
  const loc = await pg.evaluate(FIND); console.log(loc);
  const plan = [['forest', 'Floresta', .3, false], ['desert', 'Deserto', .3, false], ['jungle', 'Selva', .3, false], ['snow', 'Neve', .3, false], ['ocean', 'Oceano', .3, false], ['island', 'Ilha do céu', .3, false],
    ['cave', 'Cavernas + tochas', .3, true], ['deep', 'Cav. profundas', .3, true], ['hell', 'Inferno', .3, false], ['forest', 'Floresta (noite)', .82, false], ['forest', 'Entardecer', .58, false], ['cave2', 'Caverna 2', .3, true]];
  const tiles = [];
  for (const [k, name, t, tor] of plan) {
    if (!(k in loc)) continue;
    await pg.evaluate('G.paused=false');
    await pg.evaluate(GO, [loc[k][0], loc[k][1], t, tor]); await pg.waitForTimeout(50);
    tiles.push({ png: await pg.screenshot(), size: [480, 270], label: name, barH: 15 });
  }
  const cols = 3, rows = Math.ceil(tiles.length / cols);
  fs.writeFileSync(OUT, await makeSheet(b, tiles, { cols, cellW: 480, cellH: 270 }));
  console.log('saved', [480 * cols, 270 * rows], errs.slice(0, 5));
  await b.close();
});
