'use strict';
// Chefes novos (13c_bossx.js, 13d..13i_bx_*.js): cada um é invocado, luta (3 fases; a Apoteose tem 4) contra um jogador invencível, executa TODOS os golpes,
// é desenhado em todas as variantes, morre, solta o loot e limpa lacaios/zonas. Uso: node dev/test_bx.js [id1,id2,...] [--shots pasta] [--secs N]
const { launch, INDEX_URL, run, startWorld, collectErrors } = require('./lib');
const args = process.argv.slice(2); const ids = args.find(a => !a.startsWith('--')) || '';
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null, SECS = args.includes('--secs') ? Number(args[args.indexOf('--secs') + 1]) : 60;
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FALHOU:', m); } };
run(async () => {
  const b = await launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = collectErrors(pg);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(500); await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(500);
  const list = await pg.evaluate((ids) => (ids ? ids.split(',') : BXLIST.map(d => d.id)), ids);
  await pg.evaluate(() => {
    G.opts.noSpawn = true; G.opts.god = true; G.enemies.length = 0; G.time = .3; window.__arena = () => {
      const wd = G.world, P = G.P, x0 = window.__ax0 || (window.__ax0 = Math.floor(pcx(P) / TS)), gy = wd.surf[x0];   /* centro fixo da arena (não deriva a cada chefe) */
      for (let x = x0 - 70; x < x0 + 70; x++) { for (let y = gy - 60; y < gy; y++) { wd.set(x, y, 0, true); wd.setWall(x, y, 0); } wd.set(x, gy, T.grass, true); for (let y = gy + 1; y < gy + 14; y++) wd.set(x, y, T.dirt, true); }
      window.__ax = x0; window.__gy = gy; P.x = (x0 + 14) * TS; P.y = (gy - 3) * TS; P.vx = P.vy = 0; P.hp = P.maxHp; P.dead = false;
    };
  });
  for (const id of list) {
    const r = await pg.evaluate(async ([id, SECS]) => {
      const out = { id, errs: [] }; const d = BX[id]; if (!d) return { id, errs: ['sem definição'] };
      window.onerror = (m) => out.errs.push(String(m)); const oerr = console.error; console.error = (...a) => { out.errs.push(a.map(String).join(' ').slice(0, 200)); };
      try {
        __arena(); G.enemies.length = 0; G.projs.length = 0; G.bxs = null; G.boss = null; G.drops.length = 0; G.paused = false; const P = G.P;
        out.start = [G.cam.x, G.cam.y, G.cam.zoom, G.mouse.sx, G.mouse.sy, P.x, P.y, P.vx, P.vy].map(v => Math.round(v * 10) / 10);
        const t0 = performance.now();
        if (!summonBoss('x:' + id)) { out.errs.push('summonBoss falhou'); return out; }
        const e = G.boss; out.summonMs = Math.round(performance.now() - t0); const c = e.ai.x; out.hpMax = e.hpMax;
        let t = 0, step = 1 / 60, minDist = 1e9, nan = 0, drawn = 0, shots = [];
        const moveNames = Object.keys(d.moves); out.moves = moveNames;
        for (let i = 0; i < SECS * 60; i++) {
          t += step; P.hp = P.maxHp; P.inv_ = 0;
          const side = Math.sin(t * .35) > 0 ? 1 : -1; P.x = (window.__ax + 14 * side + Math.sin(t * .9) * 6) * TS; P.face = side > 0 ? -1 : 1; P.vx = 0;
          if (t > SECS * .22 && e.hp > e.hpMax * .6) e.hp = e.hpMax * .6; if (t > SECS * .5 && e.hp > e.hpMax * .3) e.hp = e.hpMax * .3;
          if (e.dead) break; G.t += 0; __step(step);
          if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { nan++; break; }
          if (![P.x, P.y, P.vx, P.vy, G.cam.x, G.cam.y, G.cam.zoom].every(Number.isFinite)) { out.errs.push('NaN em jogador/câmera no passo ' + i + ' (golpe ' + c.move + '): ' + JSON.stringify([P.x, P.y, P.vx, P.vy, G.cam.x, G.cam.y, G.cam.zoom, G.mouse.sx, G.mouse.sy])); break; }
          minDist = Math.min(minDist, Math.hypot(pcx(P) - ecx(e), pcy(P) - ecy(e)));
          if (i % 18 === 0) { G.cam.init = false; __render(); drawn++; }
        }
        out.nan = nan; out.stat = Object.assign({}, c.stat); out.phase = c.ph; out.ranBoss = !e.dead; out.minDist = Math.round(minDist); out.pos = [Math.round(e.x), Math.round(e.y)];
        // todos os golpes, um a um
        out.forced = {};
        for (const m of moveNames) {
          if (e.dead) break; c.g = null; c.force = m; c.cd = 0; let n = 0, started = false; const s0 = c.stat[m] || 0;
          for (let i = 0; i < 60 * 14; i++) { P.hp = P.maxHp; P.inv_ = 0; P.x = (window.__ax + 12) * TS; __step(step); n++; if ((c.stat[m] || 0) > s0) started = true; if (started && !c.g) break; if (i % 20 === 0) { G.cam.init = false; __render(); } }
          out.forced[m] = started && !c.g ? +(n * step).toFixed(1) : -1;
        }
        // variantes e quadros desenhados
        const A = BXART[id]; out.art = !!A; if (A) { for (let v = 0; v < A.vars; v++) for (let f = 0; f < A.frames; f++) { const s = bxSpr(id, f, v); if (!s || !s.c) out.errs.push('quadro ' + f + '/' + v + ' vazio'); } }
        // vitória
        const far = () => { P.x = (ecx(e) > window.__ax * TS ? ecx(e) - 55 * TS : ecx(e) + 55 * TS); P.x = Math.max(4 * TS, Math.min((G.world.w - 6) * TS, P.x)); P.vx = 0; P.hp = P.maxHp; G.drops.length = 0; };   /* longe do chefe, para os itens não serem recolhidos antes da conferência */
        far();
        if (!e.dead) { far(); e.hp = 1; hitEnemy(e, { dmg: 1e7, src: 'raw', kb: 0, noKb: true, ignoreDef: true, noHooks: true, noCrit: true, crit: false }); for (let i = 0; i < 30; i++) __step(step); }
        out.revived = !e.dead && e.hp > 0;
        if (out.revived) { for (let k = 0; k < 6 && !e.dead; k++) { for (let i = 0; i < 60 * 6; i++) { P.hp = P.maxHp; __step(step); } far(); e.hp = 1; hitEnemy(e, { dmg: 1e7, src: 'raw', kb: 0, noKb: true, ignoreDef: true, noHooks: true, noCrit: true, crit: false }); for (let i = 0; i < 20; i++) __step(step); } }
        for (let i = 0; i < 30; i++) __step(step);
        out.dead = e.dead; out.flag = !!G.flags[id]; out.drops = G.drops.length; out.dropIds = [...new Set(G.drops.map(x => x.id))].slice(0, 8); out.sword = d.sword && G.drops.some(x => x.id === d.sword);
        out.minions = G.enemies.filter(x => x.owner === e && !x.dead).length; out.zones = (G.bxs ? G.bxs.zones.filter(z => z.owner === e).length : 0) + (G.bxs ? G.bxs.beams.filter(z => z.owner === e).length : 0);
        out.bossCleared = G.boss === null;
        out.pOk = [P.x, P.y, P.vx, P.vy, G.cam.x, G.cam.y].every(Number.isFinite);
      } catch (err) { out.errs.push('EXC ' + String(err && err.stack || err).slice(0, 400)); }
      console.error = oerr; return out;
    }, [id, SECS]);
    const stats = Object.entries(r.stat || {}).map(([k, v]) => k + ':' + v).join(' ');
    if (r.errs.length && r.start) console.log('   início', JSON.stringify(r.start));
    console.log(id.padEnd(14), 'hp', r.hpMax, '| fase', r.phase, '| golpes', stats, '| forçados', JSON.stringify(r.forced), '| dist.min', r.minDist, '| loot', r.drops, '| ' + (r.errs.length ? 'ERROS ' + JSON.stringify(r.errs.slice(0, 2)) : 'ok'));
    ok(r.errs.length === 0, id + ': sem exceções  -> ' + JSON.stringify(r.errs.slice(0, 3)));
    if (r.errs.length) continue;
    ok(r.nan === 0, id + ': posição sempre finita');
    ok(r.pOk, id + ': jogador e câmera continuam com valores finitos');
    ok(r.ranBoss, id + ': sobrevive à luta (não morre sozinho)');
    ok(r.phase >= 3, id + ': chega à fase 3  -> ' + r.phase);
    ok(r.moves.every(m => r.forced[m] > 0), id + ': todos os golpes rodam até o fim  -> ' + JSON.stringify(r.forced));
    ok(r.art, id + ': tem arte');
    ok(r.dead && r.flag && r.bossCleared, id + ': morre, marca a vitória e libera a barra do chefe  -> ' + JSON.stringify([r.dead, r.flag, r.bossCleared]));
    ok(r.drops >= 6 && r.sword, id + ': solta loot e a espada garantida  -> ' + r.drops + ' itens ' + JSON.stringify(r.dropIds));
    ok(r.minions === 0 && r.zones === 0, id + ': lacaios e zonas somem com ele  -> ' + r.minions + '/' + r.zones);
  }
  ok(errs.length === 0, 'sem erros na página  -> ' + JSON.stringify(errs.slice(0, 3)));
  console.log(`test_bx: ${total - fails}/${total} verificações ok (${list.length} chefes)`);
  await b.close(); process.exitCode = fails ? 1 : 0;
});
