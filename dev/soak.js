'use strict';
// Estresse: ~45.000 passos de simulação com spawn natural em 14 cenários (todas as camadas e estágios).
const { launch, INDEX_URL, run, waitPlay, startWorld, collectErrors } = require('./lib');

const JS = ([name, tx, ty, time_, stage, frames, swordId]) => {
  const P = G.P, wd = G.world; G.opts.god = false; G.opts.noSpawn = false; G.stage = stage; if (stage >= 2 && !wd.hardmode) spawnHardmodeOres(wd);
  G.time = time_; G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.drops.length = 0; G.texts.length = 0;
  P.x = tx * TS; P.y = ty * TS; P.vx = P.vy = 0; P.dead = false; P.hp = P.maxHp = 400; P.buffs = {}; G.cam.init = false;
  P.inv[1] = { id: swordId, n: 1 }; P.sel = 1; recalcStats();
  const keys = ['KeyA', 'KeyD', 'Space', 'KeyW'], res = { name, steps: 0, deaths: 0, maxEn: 0, maxProj: 0, maxPart: 0, kills: G.kills || 0, err: null, ms: 0 };
  const t0 = performance.now(); let f = 0, rtimer = 0;
  try {
    for (f = 0; f < frames; f++) {
      if (f % 25 === 0) { KEYS.KeyA = Math.random() < .3; KEYS.KeyD = !KEYS.KeyA && Math.random() < .6; KEYS.Space = Math.random() < .4; }
      const c = G.cam, a = f * .13, tgt = G.enemies.length ? G.enemies.reduce((b, e) => (!b || Math.hypot(ecx(e) - pcx(P), ecy(e) - pcy(P)) < Math.hypot(ecx(b) - pcx(P), ecy(b) - pcy(P))) ? e : b, null) : null;
      const wx = tgt ? ecx(tgt) : pcx(P) + Math.cos(a) * 100, wy = tgt ? ecy(tgt) : pcy(P) + Math.sin(a) * 60;
      G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; G.mouse.down[0] = true;
      if (f % 300 === 0 && f > 0) { G.mouse.pressed[2] = true; }
      __step(1 / 60); G.mouse.pressed = [false, false, false]; res.steps++;
      if (P.dead) { res.deaths++; P.respawnT = 0; }
      if (P.hp < 150) P.hp = P.maxHp;
      res.maxEn = Math.max(res.maxEn, G.enemies.length); res.maxProj = Math.max(res.maxProj, G.projs.length); res.maxPart = Math.max(res.maxPart, G.parts.length);
      if (f % 10 === 0) { __render(); }
    }
  } catch (e) { res.err = 'frame ' + f + ': ' + String(e && e.stack || e).split('\n').slice(0, 4).join(' | '); }
  KEYS.KeyA = KEYS.KeyD = KEYS.Space = false; G.mouse.down[0] = false;
  res.ms = Math.round(performance.now() - t0); res.kills = (G.kills || 0) - res.kills; res.items = P.inv.filter(s => s).length; res.liq = wd.liqAct.size; res.enemiesEnd = G.enemies.length;
  return res;
};

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await startWorld(pg, 4242, 'btn-adv');
  const loc = await pg.evaluate(() => { const wd=G.world, o={}; const fl=(x,y0,y1)=>{for(let y=y0;y<y1;y++) if(!wd.solid(x,y)&&wd.solid(x,y+1)&&!wd.solid(x,y-1)&&!wd.solid(x,y-2)&&wd.liqAt(x,y)<30) return y; return -1;};
          for (const [k,y0,y1,x0] of [['cave',190,300,500],['deep',320,398,650],['hell',425,452,820],['cave2',200,290,1000],['cave3',200,290,250]]) { for (let dx=0;dx<500;dx++){ const x=x0+dx,y=fl(x,y0,y1); if(y>0){o[k]=[x,y];break;} } } 
          const sp=wd.biomeSpots(), at=k=>[sp[k].x, wd.surf[sp[k].x]-3], sx=Math.round(wd.spawn.x/TS); o.surf=[sx, wd.surf[sx]-3]; o.des=at('desert'); o.snow=at('snow'); o.jun=at('jungle'); o.ocean=[sp.ocean.x,124]; return o; });
  console.log(loc);
  const plan = [['superfície dia', 'surf', .3, 0, 's001', 3600], ['superfície noite', 'surf', .8, 0, 's043', 3600], ['deserto noite', 'des', .8, 1, 's021', 2400], ['neve noite', 'snow', .8, 1, 's041', 2400],
    ['selva dia', 'jun', .3, 1, 's058', 2400], ['oceano', 'ocean', .3, 0, 's012', 2400], ['cavernas', 'cave', .3, 1, 's066', 3600], ['cav profundas', 'deep', .3, 1, 's083', 3600], ['inferno', 'hell', .3, 1, 's102', 3600],
    ['HM cavernas', 'cave2', .3, 2, 's120', 3600], ['HM profundas', 'deep', .3, 2, 's111', 3600], ['HM superfície noite', 'surf', .8, 2, 's113', 3600], ['HM inferno', 'hell', .3, 2, 's118', 3600], ['HM caverna3', 'cave3', .3, 2, 's100', 3600]];
  let totalErr = 0;
  for (const [name, k, t, st, sw, fr] of plan) {
    if (!(k in loc)) { console.log('sem local', k); continue; }
    const r = await pg.evaluate(JS, [name, loc[k][0], loc[k][1], t, st, fr, sw]);
    if (r.err) totalErr += 1;
    console.log(`${name.padEnd(22)} stage=${st} ${sw} steps=${r.steps} ms=${r.ms} (${(r.ms / Math.max(1, r.steps)).toFixed(2)}ms/step) deaths=${r.deaths} kills=${r.kills} maxEn=${r.maxEn} maxProj=${r.maxProj} maxPart=${r.maxPart} liq=${r.liq} ${r.err || ''}`);
  }
  await pg.waitForTimeout(300);   // a página fica ocupada num laço longo: deixa chegar eventos de erro ainda na fila antes do veredito
  console.log('cenários com erro:', totalErr, '| erros de página:', errs.slice(0, 5));
  await b.close();
  process.exitCode = (totalErr || errs.length) ? 1 : 0;
});
