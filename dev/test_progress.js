'use strict';
// Progressão: morte e renascimento, derrota dos 4 chefes (drops, flags, estágio, minérios do modo difícil).
const { launch, INDEX_URL, run, waitPlay, collectErrors } = require('./lib');

const JS = () => {
  const out = {}, P = G.P, wd = G.world; G.opts.noSpawn = true; G.opts.god = false;
  // morte e renascimento
  invAdd('coin', 100); const c0 = invCount('coin'); P.hp = 1; hurtPlayer(500, P.x + 100, 100, { pierce: true }); out.dead = P.dead; out.coinsLost = c0 - invCount('coin');
  for (let i = 0; i < 400; i++) __step(1 / 60); out.respawned = !P.dead; out.hpAfter = P.hp;
  // chefes: derrota via dano direto
  const kill = (kind, key) => { G.boss = null; G.enemies.length = 0; G.drops.length = 0; P.hp = P.maxHp; P.dead = false; summonBoss(kind); const b = G.boss; if (!b) return { ok: false }; hitEnemy(b, { src: 'raw', dmg: 999999, kb: 0, noCrit: true, ignoreDef: true, noKb: true }); for (let i = 0; i < 5; i++) __step(1 / 60); return { ok: true, dead: b.dead, drops: G.drops.map(d => d.id + 'x' + d.n).slice(0, 12), flags: JSON.stringify(G.flags), stage: G.stage }; };
  G.mode = 'creative';
  out.slime = kill('slime');
  out.eye = kill('eye');
  const ores0 = () => { let n = 0; for (let i = 0; i < wd.t.length; i += 7) if (wd.t[i] === T.cobalt || wd.t[i] === T.mithril || wd.t[i] === T.titanium) n++; return n; };
  out.oresBefore = ores0();
  out.guardian = kill('guardian'); out.oresAfter = ores0(); out.hardmode = wd.hardmode;
  out.colossus = kill('colossus'); out.core = out.colossus.drops.filter(x => x.startsWith('mythic_core'));
  return out;
};

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '9'); await pg.click('#btn-adv');
  await waitPlay(pg);
  const r = await pg.evaluate(JS);
  for (const [k, v] of Object.entries(r)) console.log(k, '->', JSON.stringify(v));
  console.log('erros', errs.slice(0, 3), await pg.evaluate('window.__lastErr'));
  await b.close();
});
