'use strict';
// Os 4 chefes lado a lado, no zoom do jogo (cada recorte centrado no chefe): node dev/shots_bosses.js SAIDA.png
const { launch, INDEX_URL, run, startWorld } = require('./lib');
const [OUT] = process.argv.slice(2);
if (!OUT) { console.error('uso: node dev/shots_bosses.js SAIDA.png'); process.exit(2); }
run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(INDEX_URL); await pg.waitForTimeout(500); await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(500);
  await pg.evaluate(() => {   // chão plano e céu limpo ao redor do jogador
    G.opts.noSpawn = true; G.opts.god = true; G.enemies.length = 0; G.time = .3;
    document.getElementById('hud').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
    const wd = G.world, P = G.P, x0 = Math.floor(pcx(P) / TS), gy = wd.surf[x0];
    for (let x = x0 - 30; x < x0 + 40; x++) { for (let y = gy - 40; y < gy; y++) { wd.set(x, y, 0, true); wd.setWall(x, y, 0); } wd.set(x, gy, T.grass, true); for (let y = gy + 1; y < gy + 6; y++) wd.set(x, y, T.dirt, true); }
    window.__gy = gy; window.__x0 = x0;
  });
  const shots = [];
  for (const [k, fn] of [['boss_slime', e => { }], ['boss_eye', e => { e.rot = .5; }], ['boss_guardian', e => { e.hp = e.hpMax * .4; }], ['boss_colossus', e => { e.hp = e.hpMax * .2; e.rot = 2; }]]) {
    const info = await pg.evaluate(({ k, fn }) => {
      G.paused = false; G.enemies.length = 0; const P = G.P, gy = window.__gy, x0 = window.__x0; G.zoomAdj = 0; applyZoom();
      P.x = (x0 + 24) * TS; P.y = (gy - 2) * TS; P.vx = P.vy = 0; P.face = -1;
      const d = ED[k], e = spawnEnemy(k, (x0 + 2) * TS, gy * TS - d.h - (k === 'boss_slime' ? 0 : 3 * TS)); e.vx = e.vy = 0; e.ai.state = 'hover'; e.ai.t = 99;
      new Function('e', 'return (' + fn + ')(e)')(e);
      for (let i = 0; i < 2; i++) { G.cam.init = false; __step(1 / 240); }
      e.vx = e.vy = 0; e.ai.squash = 0; G.cam.x = e.x + e.w / 2 - 640 / G.cam.zoom * DPR; G.paused = true; __render();
      const c = G.cam; return { x: (e.x + e.w / 2 - c.x) * c.zoom / DPR, y: (e.y + e.h / 2 - c.y) * c.zoom / DPR };
    }, { k, fn: fn.toString() });
    await pg.waitForTimeout(150);
    shots.push((await pg.screenshot({ clip: { x: Math.max(0, Math.round(info.x - 170)), y: Math.max(0, Math.round(info.y - 190)), width: 340, height: 380 } })).toString('base64'));
  }
  const p2 = await b.newPage({ viewport: { width: 340 * 4 + 12, height: 380 } });
  await p2.setContent('<body style="margin:0;background:#1b1e2b;display:flex;gap:4px">' + shots.map(s => '<img src="data:image/png;base64,' + s + '">').join('') + '</body>');
  await p2.screenshot({ path: OUT }); console.log('ok', OUT); await b.close();
});
