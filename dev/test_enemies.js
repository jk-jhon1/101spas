'use strict';
// Todos os inimigos, variantes elementais e os 4 chefes lutando contra o jogador, sem exceções.
const { launch, INDEX_URL, devfile, run, waitPlay, startWorld, collectErrors } = require('./lib');

const JS = () => {
  const res = [], P = G.P; G.opts.god = true; G.opts.noSpawn = true;
  const aim = (wx, wy) => { const c = G.cam; G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; };
  const water = [60, 130]; // oceano
  const run = (key, stage, elem, where) => {
    const entry = { key, stage, elem: elem || '', err: null, alive: true, dmgTaken: 0 };
    try {
      G.stage = stage; G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.drops.length = 0; G.boss = null; G.freeze = 0;
      const wd = G.world;
      if (where === 'water') { P.x = 62 * TS; P.y = 128 * TS; } else if (where === 'hell') { P.x = 800 * TS; P.y = 440 * TS; } else { P.x = wd.spawn.x; P.y = wd.spawn.y; }
      P.vx = P.vy = 0; P.hp = P.maxHp = 400; P.dead = false; P.inv_ = 0; P.buffs = {}; P.cb.inst.length = 0; P.cb.cd = 0; G.cam.init = false;
      P.inv[1] = { id: 's062', n: 1 }; P.sel = 1; recalcStats();
      const d = ED[key]; let e;
      if (d.boss) { G.boss = null; const kind = { boss_slime: 'slime', boss_eye: 'eye', boss_guardian: 'guardian', boss_colossus: 'colossus' }[key]; summonBoss(kind); e = G.boss; }
      else { const sp = where === 'water' ? { x: P.x + 80, y: P.y } : freeSpot(d.w, d.h, P.x + 90, P.y - 10); e = spawnEnemy(key, sp.x, sp.y, { elem }); }
      const hp0 = P.hp; G.mouse.down[0] = true; let frames = d.boss ? 900 : 360;
      for (let f = 0; f < frames; f++) {
        const ex = ecx(e), ey = ecy(e); aim(ex, ey); __step(1 / 60); G.mouse.pressed = [false, false, false];
        if (P.hp < P.maxHp * .5) P.hp = P.maxHp; if (f % 20 === 0) { __render(); }
        if (e.dead && !d.boss) break;
        if (d.boss && e.hp > 0 && f % 2 === 0) { e.hp = Math.max(1, e.hp); }
      }
      G.mouse.down[0] = false; entry.alive = !e.dead; entry.hp = Math.round(e.hp) + '/' + e.hpMax; entry.drops = G.drops.length; entry.projs = G.projs.length;
    } catch (er) { entry.err = String(er && er.stack || er).split('\n').slice(0, 3).join(' | '); }
    res.push(entry);
  };
  for (const key of Object.keys(ED)) { if (key === 'dummy') continue; run(key, 0, null, (key === 'shark' || key === 'piranha') ? 'water' : (key === 'imp' || key === 'hellbat' || key === 'slime_lava') ? 'hell' : 'surface'); }
  for (const el of Object.keys(ELEMS)) run('zombie', 2, el); for (const el of ['fire', 'ice', 'time']) run('slime_blue', 2, el); run('eye', 2, 'lightning'); run('skeleton', 3, 'blood');
  G.stage = 0;
  return res;
};

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await startWorld(pg, 31337, 'btn-cre');
  const t0 = Date.now(); const out = await pg.evaluate(JS); console.log(`tempo ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  let bad = 0;
  for (const e of out) {
    const flag = e.err ? 'ERR' : 'ok';
    if (e.err) bad += 1;
    console.log(`${String(e.key).padEnd(18)} st=${e.stage} ${String(e.elem).padEnd(9)} ${flag.padEnd(3)} alive=${e.alive} hp=${e.hp} drops=${e.drops} proj=${e.projs} ${e.err || ''}`);
  }
  await pg.waitForTimeout(300);   // a página fica ocupada num laço longo: deixa chegar eventos de erro ainda na fila antes do veredito
  console.log('problemas:', bad, '| erros de página:', errs.slice(0, 5));
  await pg.screenshot({ path: devfile('shot_enemies_end.png') });
  await b.close();
  process.exitCode = (bad || errs.length) ? 1 : 0;
});
