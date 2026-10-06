'use strict';
const { launch, INDEX_URL, run, waitPlay } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  pg.on('console', (m) => logs.push(m.text()));
  pg.on('pageerror', (e) => logs.push('ERR ' + e.message));
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '12345'); await pg.click('#btn-cre');
  await waitPlay(pg);
  await pg.waitForTimeout(800);
  const r = await pg.evaluate(() => {
          const L = G.light, wd = G.world; const out = {};
          out.region = [L.x0, L.y0, L.w, L.h]; out.cam = [G.cam.x, G.cam.y, G.cam.zoom, TILEPX];
          const px = Math.floor((G.P.x)/16), py = Math.floor(G.P.y/16); out.p=[px,py];
          out.skyTop = []; out.surf=[]; for (let x = px-40; x <= px+40; x+=10) { out.skyTop.push(wd.skyTop[x]); out.surf.push(wd.surf[x]); }
          // linha de luz acima do solo (py-3)
          const row = []; for (let x = L.x0; x < L.x0 + L.w; x += 8) { const i = (py-3-L.y0)*L.w + (x-L.x0); row.push(+L.r[i].toFixed(2)); } out.rowAbove = row;
          const row2 = []; for (let x = L.x0; x < L.x0 + L.w; x += 8) { const i = (py+1-L.y0)*L.w + (x-L.x0); row2.push(+L.r[i].toFixed(2)); } out.rowGround = row2;
          out.sky = skyLight(G.time); out.time = G.time;
          return out; });
  console.log(JSON.stringify(r));
  console.log(logs.slice(0, 10));
  await b.close();
});
