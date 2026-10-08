'use strict';
// As 120 espadas em combate: cada uma ataca bonecos/inimigos por ~4,5 s. Sem exceções, todas causam dano.
//   node dev/test_swords.js        (só as que têm problema)      node dev/test_swords.js -v      (todas)
const { launch, INDEX_URL, devfile, run, waitPlay, startWorld } = require('./lib');

const JS = () => {
  const res = [], P = G.P; G.opts.god = true; G.opts.showDps = true; G.opts.noSpawn = true;
  const aim = (wx, wy) => { const c = G.cam; G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; };
  const errs = [];
  const origErr = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 300)); };
  for (const sw of SWORDS) {
    const entry = { num: sw.num, name: sw.swordName, err: null, dmg: 0, projs: 0 };
    try {
      G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.texts.length = 0; G.drops.length = 0; G.freeze = 0; G.dark = 0;
      P.x = G.world.spawn.x; P.y = G.world.spawn.y; P.vx = P.vy = 0; P.hp = P.maxHp; P.dead = false; P.inv_ = 0; P.buffs = {}; P.cb.inst.length = 0; P.cb.cd = 0;
      P.inv[1] = { id: sw.id, n: 1 }; P.sel = 1; recalcStats();
      const mk = (k, dx) => { const d = ED[k]; return spawnEnemy(k, P.x + dx, P.y + P.h - d.h); };
      const t1 = mk('dummy', 26), t2 = mk('dummy', 92), t3 = mk('slime_blue', 190), t4 = mk('zombie', 250), t5 = mk('eye', 160); const seenSt = new Set(), seenBuff = new Set(); const hits0 = P.cb.hits, sw0 = P.cb.count;
      G.dpsLog.length = 0; G.mouse.down[0] = true; let maxProj = 0;
      for (let f = 0; f < 180; f++) { aim(P.x + 120, P.y + 6); __step(1 / 60); G.mouse.pressed = [false, false, false]; maxProj = Math.max(maxProj, G.projs.length); if (f % 12 === 0) __render(); P.hp = P.maxHp; for (const e of [t1, t2]) { e.x = P.x + (e === t1 ? 26 : 92); e.vx = 0; } for (const e of G.enemies) for (const k in e.st) seenSt.add(k); for (const k in P.buffs) seenBuff.add(k); }
      G.mouse.down[0] = false;
      for (let f = 0; f < 90; f++) { __step(1 / 60); if (f % 15 === 0) __render(); }
      entry.dmg = G.dpsLog.reduce((a, b) => a + b[1], 0); entry.projs = maxProj; entry.swings = P.cb.count - sw0; entry.hits = P.cb.hits - hits0; entry.st = [...seenSt].join(','); entry.buff = [...seenBuff].join(',');
    } catch (e) { entry.err = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); }
    res.push(entry);
  }
  console.error = origErr;
  return { res, errs: errs.slice(0, 20) };
};
const nz = (v) => (v === undefined || v === null ? 'None' : v);

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  pg.on('console', (m) => logs.push(m.type() + ': ' + m.text().slice(0, 200)));
  pg.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await pg.goto(INDEX_URL);
  await startWorld(pg, 777, 'btn-cre');
  await pg.waitForTimeout(500);
  const t0 = Date.now();
  const out = await pg.evaluate(JS);
  console.log(`tempo: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const bad = out.res.filter((e) => e.err || e.dmg <= 0);
  for (const e of out.res) {
    const flag = e.err ? 'ERR' : (e.dmg <= 0 ? 'SEM DANO' : 'ok');
    if (flag !== 'ok' || process.argv.includes('-v')) {
      console.log(`${String(e.num).padStart(3, '0')} ${String(e.name).padEnd(24)} dmg=${String(e.dmg).padEnd(6)} sw=${nz(e.swings)} hit=${nz(e.hits)} proj=${String(e.projs).padEnd(4)} st=[${nz(e.st)}] buff=[${nz(e.buff)}] ${flag} ${e.err || ''}`);
    }
  }
  console.log('espadas testadas:', out.res.length, '| problemas:', bad.length);
  console.log('console.error capturados:', out.errs);
  await pg.waitForTimeout(300);   // a página fica ocupada num laço longo: deixa chegar eventos de erro ainda na fila antes do veredito
  console.log('page logs:', logs.filter((l) => l.toLowerCase().includes('error')).slice(0, 10));
  await pg.screenshot({ path: devfile('shot_swords_end.png') });
  await b.close();
  process.exitCode = bad.length ? 1 : 0;
});
