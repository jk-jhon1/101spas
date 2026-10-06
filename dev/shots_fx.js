'use strict';
// Folha de contato com o efeito de espadas escolhidas: node dev/shots_fx.js SAIDA.png 12,43,120
const fs = require('fs');
const { launch, INDEX_URL, run, waitPlay, makeSheet } = require('./lib');

const [OUT, NUMS_ARG] = process.argv.slice(2);
if (!OUT || !NUMS_ARG) { console.error('uso: node dev/shots_fx.js SAIDA.png 12,43,120'); process.exit(2); }
const NUMS = NUMS_ARG.split(',').map(Number);
const SETUP = (num) => {
  const sw = SWORD_BY_NUM[num], P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.opts.showDps = false;
  window.__aim = (wx, wy) => { const c = G.cam; G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; };
  G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.texts.length = 0; G.drops.length = 0; G.freeze = 0; G.dark = 0; G.flash = null; G.time = .3;
  P.x = G.world.spawn.x; P.y = G.world.spawn.y; P.vx = P.vy = 0; P.hp = P.maxHp; P.dead = false; P.inv_ = 0; P.buffs = {}; P.cb.inst.length = 0; P.cb.cd = 0; P.face = 1;
  P.inv[1] = { id: sw.id, n: 1 }; P.sel = 1; recalcStats();
  const mk = (k, dx, o) => { const d = ED[k]; return spawnEnemy(k, P.x + dx, P.y + P.h - d.h, o); };
  mk('dummy', 40); mk('dummy', 95); mk('zombie', 150); mk('slime_blue', 190); mk('skeleton', 240); mk('eye', 170); mk('dummy', 300);
  G.cam.init = false; G.mouse.down[0] = true; window.__f = 0; return sw.swordName;
};
const STEP = (n) => { for (let i = 0; i < n; i++) { __aim(G.P.x + 140, G.P.y + 4); __step(1/60); G.mouse.pressed=[false,false,false]; G.P.hp = G.P.maxHp; } G.paused = true; __render(); return G.projs.length; };

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '777'); await pg.click('#btn-cre');
  await waitPlay(pg);
  await pg.evaluate("document.getElementById('toasts').style.display='none'; document.getElementById('hud').style.display='none'");
  const tiles = [];
  for (const n of NUMS) {
    const name = await pg.evaluate(SETUP, n);
    // alguns efeitos têm pico depois: captura em 2 momentos
    await pg.evaluate('G.paused=false');
    await pg.evaluate(STEP, 26);
    await pg.waitForTimeout(60);
    const png = await pg.screenshot();
    // recorte 600x300 centrado no jogador, reduzido para 480x240, com faixa de número + nome
    const W = 960, H = 540;
    tiles.push({ png, crop: [W / 2 - 300, H / 2 - 190, 600, 300], size: [480, 240], label: `${String(n).padStart(3, '0')} ${name}`, barH: 17 });
    await pg.evaluate('G.paused=false; G.mouse.down[0]=false');
  }
  const cols = 3, rows = Math.ceil(tiles.length / cols);
  fs.writeFileSync(OUT, await makeSheet(b, tiles, { cols, cellW: 480, cellH: 240 }));
  console.log('saved', OUT, [480 * cols, 240 * rows], 'errors:', errs.slice(0, 5));
  await b.close();
});
