'use strict';
// Cena de combate em tela cheia (bonecos, inimigos, números de dano, efeito da espada): node dev/shots_combat.js SAIDA.png [NUMERO_DA_ESPADA]
const { launch, INDEX_URL, run, startWorld } = require('./lib');
const [OUT, NUM_ARG = '58'] = process.argv.slice(2);
if (!OUT) { console.error('uso: node dev/shots_combat.js SAIDA.png [NUMERO_DA_ESPADA]'); process.exit(2); }
run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(INDEX_URL); await pg.waitForTimeout(600);
  await startWorld(pg, 5, 'btn-cre'); await pg.waitForTimeout(400);
  await pg.evaluate(([num]) => {
    const sw = SWORD_BY_NUM[num], P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.enemies.length = 0; G.time = .3; P.vx = P.vy = 0; P.cb.cd = 0; P.inv[1] = { id: sw.id, n: 1 }; P.sel = 1; recalcStats(); G.cam.init = false;
    document.getElementById('toasts').innerHTML = '';
    for (let i = 0; i < 20; i++) __step(1 / 60);
    for (const [k, dx] of [['dummy', 70], ['slime_blue', 110], ['zombie', 150], ['skeleton', 200], ['slime_red', -90], ['wolf', -150], ['mushroom_walker', 250]]) { const d = ED[k], sp = freeSpot(d.w, d.h, pcx(P) + dx, pcy(P) - 20); spawnEnemy(k, sp.x, sp.y); }
    window.__aim = () => { const c = G.cam, P = G.P; G.mouse.sx = (P.x + 150 - c.x) * c.zoom / DPR; G.mouse.sy = (P.y - 6 - c.y) * c.zoom / DPR; };
    __aim(); G.mouse.down[0] = true; G.paused = false;
  }, [Number(NUM_ARG)]);
  // avança até o golpe acertar (números de dano na tela e efeito da espada ativo)
  for (let i = 0; i < 60; i++) { const ok = await pg.evaluate(() => { for (let k = 0; k < 2; k++) { __aim(); __step(1 / 60); G.mouse.pressed = [false, false, false]; } return G.texts.length >= 3 && (G.P.cb.swingT > 0 || G.P.cb.inst.length > 0); }); if (ok) break; }
  await pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; G.paused = true; __render(); });
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: OUT });
  console.log('ok', OUT);
  await b.close();
});
