/* ============================================================
   13e_bx_a2: chefes novos do Ato II · Pós-Olho (14). Motor em 13c_bossx.js; arte em 05h_bxart2.js.
   ============================================================ */
const bxStun = (c, t) => { c.S.stun = t; };   // "atordoado": leva dano extra

bx('golem_cristal', {
  n: 'Golem de Cristal', act: 2, w: 60, h: 70, hp: 4200, dmg: 30, def: 6, spd: 66, coin: [90, 140], sword: 's051', rec: 'quartz:12,sapphire:3,platinum_bar:4',
  mech: 'cristais flutuantes refratam o raio dele em três: o aviso vira uma grade de linhas que você precisa cruzar.',
  shot: 'shard', loco: ['walk', { spd: 62, jump: 440 }], kit: [['shards', 'prism'], ['shards', 'prism', 'slam'], ['prism', 'slam', 'shards', 'prism']], cds: [1.4, 1.1, .9],
  moves: {
    *shards(c) { for (let k = 0; k < 3; k++) { bxFan(c, 4, .2, { speed: 300, r: 6, col: '#22d3ee', col2: '#e0f2fe', dm: .5 }); sfx('magic', .4); yield .55; } },
    *prism(c, e) {
      const n = c.ph > 1 ? 3 : 2, pts = []; for (let k = 0; k < n; k++) { const a = rnd(TAU); pts.push([c.cx + Math.cos(a) * 80, c.cy - 24 + Math.sin(a) * 50]); }
      for (const [x, y] of pts) bxTele(c, { x, y, r: 8, tel: .9, col: '#67e8f9' }); sfx('portal', .4); yield .9;
      for (const [x, y] of pts) { bxBeam(c, { x: c.cx, y: c.cy, ang: Math.atan2(y - c.cy, x - c.cx), len: Math.hypot(x - c.cx, y - c.cy), w: 5, tel: 0, t: .4, noHit: true, col: '#a5f3fc', col2: '#fff' }); for (let k = -1; k <= 1; k++) bxBeam(c, { x, y, ang: Math.atan2(c.py - y, c.px - x) + k * .34, len: 560, w: 6, tel: .75, t: 1.1, dmg: Math.round(e.dmg * .8), col: '#22d3ee', col2: '#fff' }); }
      yield 1.7;
    },
    *slam(c, e) { yield .4; if (e.onGround) e.vy = -540; yield .5; let t = 0; while (!e.onGround && t < 2) { t += c.dt; yield; } bxWave(c, 1, { col: '#22d3ee', hh: 12 }); bxWave(c, -1, { col: '#22d3ee', hh: 12 }); shake(6); sfx('boom', .5); bxFan(c, 5, .3, { ang: -PI / 2, speed: 320, shape: 'shard', col: '#22d3ee', kind: 'ballistic', grav: 600, dm: .4, life: 2 }); yield .7; },
  },
});

bx('rei_ossos', {
  n: 'Rei Ossos', act: 2, w: 56, h: 72, hp: 5000, dmg: 34, def: 6, spd: 70, coin: [100, 150], sword: 's060', rec: 'bone:40,platinum_bar:4,amethyst:2', cond: { layer: 'cave' },
  mech: 'ao cair, vira uma pilha de ossos e ressurge uma vez, coroado de chamas e com um bando de esqueletos.',
  shot: 'bone', loco: ['walk', { spd: 66, jump: 440 }], kit: [['bones', 'slam'], ['bones', 'slam', 'summon'], ['bones', 'flame', 'slam', 'summon']], cds: [1.3, 1.0, .8],
  init(c) { c.S.revived = false; c.S.pile = 0; },
  lethal(c, e) { if (!c || c.S.revived) return false; c.S.revived = true; c.S.pile = 3.4; e.hp = 1; e.invulnerable = true; c.g = null; burst(ecx(e), ecy(e), 30, { col: ['#efe7cf', '#84cc16'], spd: 200, g: 300, life: .8, glow: true }); toast('O Rei Ossos desmorona... mas ainda não acabou!', '#84cc16'); sfx('boom', .7); return true; },
  passive(c, e) {
    if (c.S.pile > 0) { c.S.pile -= c.dt; c.cd = 5; c.skipLoco = true; e.vx *= .8; if (c.S.pile <= 0) { e.invulnerable = false; e.hp = e.hpMax * .4; c.cd = .5; ringFx(c.cx, c.cy, 90, '#84cc16', .6, 4); shake(8); sfx('boss', .6); toast('O Rei Ossos ressurgiu!', '#84cc16'); for (let k = 0; k < 4; k++) bxSpawn(c, 'skeleton', c.cx + rnd(-80, 80), c.cy - 20, { hp: 40, dm: .35, vy: -260 }); } }
  },
  variant: (e, c) => c && c.S.pile > 0 ? 1 : 0,
  moves: {
    *bones(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .22, { y: c.cy - 20, spread: -.3, speed: 300, r: 6, shape: 'bone', kind: 'ballistic', grav: 650, spin: 9, dm: .55, life: 3, col: '#efe7cf' }); yield .55; } },
    *slam(c, e) { yield .45; if (e.onGround) e.vy = -380; yield .55; bxWave(c, 1, { col: '#84cc16' }); bxWave(c, -1, { col: '#84cc16' }); shake(5); sfx('boom', .4); yield .6; },
    *summon(c, e) { c.free = true; for (let k = 0; k < 2; k++) { if (G.enemies.filter(x => x.k === 'skeleton' && x.owner === e && !x.dead).length < 4) bxSpawn(c, 'skeleton', c.cx + rnd(-50, 50), c.cy - 10, { hp: 40, dm: .35, vy: -200 }); yield .6; } yield .3; },
    *flame(c) { c.free = true; bxRain(c, 8, { speed: 260, r: 7, shape: 'orb', col: '#84cc16', col2: '#ecfccb', trail: '#a3e635', dm: .6, life: 3 }); yield .8; bxRain(c, 8, { speed: 260, r: 7, shape: 'orb', col: '#84cc16', col2: '#ecfccb', trail: '#a3e635', dm: .6, life: 3 }); yield .6; },
  },
});

bx('verme', {
  n: 'Verme das Areias', act: 2, w: 56, h: 56, hp: 5500, dmg: 36, def: 6, spd: 190, coin: [100, 160], fly: 1, noclip: 1, sword: 's054', rec: 'amber:8,cactus:10,platinum_bar:4', cond: { biome: 'desert' },
  mech: 'o corpo inteiro é perigoso: os segmentos acompanham a cabeça pela terra e queimam ao toque.',
  shot: 'rock', keepFace: false,
  loco(c, e) { c.ang += c.dt * .9; const gy = groundY(c.px, c.py, 40); steerFly(e, c.px + Math.cos(c.ang) * 230, Math.max(c.py - 20, (gy > 0 ? gy : c.py) - 10) + Math.sin(c.ang * 2.1) * 50, 200 * c.sm * (c.ph > 1 ? 1.2 : 1), 2.2, c.dt); },
  kit: [['spit', 'breach'], ['spit', 'breach', 'quake'], ['breach', 'quake', 'spit', 'breach']], cds: [1.3, 1.0, .8],
  init(c) { c.S.trail = []; c.S.last = [c.cx, c.cy]; c.S.segs = []; },
  passive(c, e) {
    const T = c.S.trail, l = c.S.last; if (Math.hypot(c.cx - l[0], c.cy - l[1]) > 5) { T.unshift([c.cx, c.cy]); c.S.last = [c.cx, c.cy]; if (T.length > 420) T.length = 420; }
    c.S.segs.length = 0; let acc = 0, prev = [c.cx, c.cy], nxt = 26; for (const p of T) { acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; if (acc >= nxt && c.S.segs.length < 12) { c.S.segs.push(p); nxt += 24; } }
    const P = G.P; if (!P.dead) for (const s of c.S.segs) if (Math.hypot(s[0] - pcx(P), s[1] - pcy(P)) < 17) { hurtPlayer(Math.round(e.dmg * .7), s[0], 170); break; }
  },
  under(g, e, H) { const c = e.ai.x; if (!c) return; const sp = bxSpr('verme_seg', 0, 0); for (let i = c.S.segs.length - 1; i >= 0; i--) { const s = c.S.segs[i]; bossLayer(g, e, sp, Math.round(s[0]), Math.round(s[1]), 30, 30, false, H.tint, .3); } },
  moves: {
    *spit(c) { c.free = true; for (let k = 0; k < 3; k++) { bxShot(c, { speed: 260, r: 7, shape: 'orb', col: '#f59e0b', col2: '#fde68a', dm: .6, life: 3, trail: '#f59e0b' }); sfx('fire', .4); yield .6; } },
    *breach(c, e) {
      const gx = c.px, gy = groundY(gx, c.py, 40) > 0 ? groundY(gx, c.py, 40) : c.py;
      yield* bxHold(c, 1.0, () => steerFly(e, gx - 50, gy + 50, 300 * c.sm, 4, c.dt)); bxTele(c, { x: gx, y: gy - 6, r: 46, tel: .9, col: '#f59e0b' }); yield* bxHold(c, .9, () => steerFly(e, gx, gy + 40, 300, 5, c.dt));
      e.vx = 0; e.vy = -760; burst(gx, gy, 20, { col: ['#e0c080', '#a88340'], spd: 180, g: 300, life: .6 }); bxFan(c, 7, .3, { x: gx, y: gy - 6, ang: -PI / 2, speed: 300, shape: 'rock', col: '#a88340', col2: '#e0c080', kind: 'ballistic', grav: 600, dm: .45, life: 2 }); shake(6); sfx('boom', .5);
      yield* bxHold(c, 1.2, () => { e.vy += GRAV * .9 * c.dt; e.vx = Math.sign(c.px - c.cx) * 120; });
    },
    *quake(c) { c.free = false; for (let k = 0; k < 5; k++) { bxCol(c, c.px + (k - 2) * 62, { w: 34, h: 90, tel: .75, col: '#d97706' }); yield .22; } yield .9; },
  },
});

bx('gargula', {
  n: 'Gárgula de Pedra', act: 2, w: 56, h: 60, hp: 4800, dmg: 34, def: 8, spd: 190, coin: [95, 150], fly: 1, sword: 's031', rec: 'stone:60,platinum_bar:5,beetle_claw:6',
  mech: 'pousa e vira estátua (quase imune) enquanto derruba pedras; depois acorda num mergulho e fica atordoada.',
  shot: 'rock', loco: ['orbit', { r: 210, h: -140, spd: 190 }], kit: [['claws', 'perch'], ['claws', 'dive', 'perch'], ['dive', 'perch', 'claws', 'dive']], cds: [1.2, .95, .75],
  passive(c) { c.S.stun = Math.max(0, (c.S.stun || 0) - c.dt); },
  hurt(c, e, dmg) { return c ? (c.S.stone ? dmg * .1 : c.S.stun > 0 ? dmg * 1.6 : dmg) : dmg; },
  variant: (e, c) => c && c.S.stone ? 1 : 0,
  moves: {
    *claws(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .26, { speed: 310, r: 6, shape: 'rock', col: '#64748b', col2: '#cbd5e1', dm: .55, life: 3 }); yield .6; } },
    *perch(c, e) {
      const x = c.px + (Math.random() < .5 ? -1 : 1) * 150, gy = groundY(x, c.py, 40);
      yield* bxHold(c, 1.1, () => steerFly(e, x, (gy > 0 ? gy : c.py) - e.h / 2 - 4, 320 * c.sm, 4, c.dt)); c.S.stone = true; e.vx = e.vy = 0; sfx('boom', .4); shake(4); burst(c.cx, c.cy, 14, { col: ['#94a3b8', '#e2e8f0'], spd: 100, g: 300, life: .5 });
      for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-130, 130), { w: 26, h: 260, tel: .8, col: '#94a3b8', fire: true }); yield .6; } yield .9; c.S.stone = false; burst(c.cx, c.cy, 12, { col: ['#2dd4bf', '#fff'], spd: 100, glow: true, life: .4 });
    },
    *dive(c, e) { yield* bxHold(c, .75, () => bxSteer(c, c.px, c.py - 230, 320)); burst(c.cx, c.cy, 10, { col: ['#2dd4bf', '#fff'], spd: 90, glow: true, life: .4 }); yield .3; yield* bxDash(c, 640, .6, { fx: () => { if (e.hitY) { e.vy = 0; } } }); bxWave(c, 1, { col: '#94a3b8' }); bxWave(c, -1, { col: '#94a3b8' }); shake(6); c.S.stun = 1.7; yield 1.4; },
  },
});

bx('banshee', {
  n: 'Banshee', act: 2, w: 44, h: 62, hp: 3600, dmg: 30, def: 3, spd: 120, coin: [85, 130], fly: 1, noclip: 1, sword: 's045', rec: 'vamp_tooth:6,platinum_bar:4,glow_mushroom:6', cond: { night: 1 },
  mech: 'seu lamento solta ondas em anel; quem for atingido fica em silêncio e não consegue atacar com a espada.',
  shot: 'orb', loco: ['float', { r: 140, h: -90, spd: 120 }], kit: [['wail', 'wisps'], ['wail', 'wisps', 'blink'], ['wail', 'blink', 'wisps', 'wail']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *wail(c, e) {
      c.free = true;
      for (let k = 0; k < (c.ph > 1 ? 3 : 2); k++) {
        sfx('boss', .4); const p = spawnProj({ friendly: false, kind: 'custom', shape: 'ring', x: c.cx, y: c.cy, r: 10, hw: .01, hh: .01, dmg: Math.round(e.dmg * .8), kb: 140, life: 2.7, col: '#99f6e4', col2: '#fff', glow: '#99f6e4', glowR: 34, tiles: false, pierce: 99 });
        p.onUpdate = (q, dt) => { q.r += 125 * dt; const P = G.P; if (!q.hit && !P.dead && Math.abs(Math.hypot(pcx(P) - q.x, pcy(P) - q.y) - q.r) < 8) { q.hit = true; if (hurtPlayer(q.dmg, q.x, 120)) bxBuff('silence', 2.4); } };
        yield .95;
      }
      yield .5;
    },
    *wisps(c) { c.free = true; for (let k = 0; k < 4; k++) { bxShot(c, { speed: 180, spread: rnd(-.6, .6), r: 6, shape: 'orb', col: '#5eead4', col2: '#fff', homing: true, steer: 1.1, life: 4, dm: .5 }); yield .45; } },
    *blink(c) { burst(c.cx, c.cy, 12, { col: ['#99f6e4', '#fff'], spd: 90, glow: true, life: .5 }); yield .35; bxTp(c, c.px + (Math.random() < .5 ? -1 : 1) * 150, c.py - 50); yield .3; bxFan(c, 5, .22, { speed: 250, r: 6, col: '#99f6e4', col2: '#fff', dm: .5 }); yield .7; },
  },
});

bx('minotauro', {
  n: 'Minotauro do Labirinto', act: 2, w: 54, h: 74, hp: 5200, dmg: 38, def: 7, spd: 80, coin: [100, 150], sword: 's026', rec: 'bone:20,iron_bar:15,platinum_bar:4,ruby:2',
  mech: 'investe em linha reta e ricocheteia nas paredes até três vezes; ao parar, fica atordoado e vulnerável.',
  shot: 'blade', loco: ['walk', { spd: 72, jump: 470 }], kit: [['charge', 'axe'], ['charge', 'axe', 'stomp'], ['charge', 'stomp', 'axe', 'charge']], cds: [1.2, .95, .75],
  passive(c) { c.S.stun = Math.max(0, (c.S.stun || 0) - c.dt); },
  hurt(c, e, dmg) { return c && c.S.stun > 0 ? dmg * 1.5 : dmg; },
  moves: {
    *charge(c, e) {
      let dir = Math.sign(c.dx) || 1; bxTele(c, { x: dir > 0 ? c.cx : c.cx - 380, y: e.y + 10, w: 380, h: e.h - 10, tel: .85, col: '#fb923c' }); yield .9;
      let bounces = 0, t = 0; while (bounces < 3 && t < 3.4) { e.vx = dir * 440 * c.sm; t += c.dt; if (e.hitX) { bounces++; dir = -dir; e.vx = dir * 260; shake(5); sfx('boom', .4); bxFan(c, 5, .35, { x: c.cx - dir * 20, ang: -PI / 2, speed: 280, shape: 'rock', col: '#a16207', col2: '#fde68a', kind: 'ballistic', grav: 650, dm: .4, life: 1.8 }); yield .3; } else yield; }
      e.vx = 0; c.S.stun = 2; yield 2;
    },
    *axe(c) { c.free = true; yield .35; const p = bxShot(c, { speed: 340, r: 9, shape: 'blade', col: '#cbd5e1', col2: '#fb923c', dm: .8, life: 3, spin: 14, noAim: true }); bxBack(c, p, .9, 340); yield 1.4; },
    *stomp(c, e) { yield .4; if (e.onGround) e.vy = -460; yield .6; bxWave(c, 1, { col: '#fb923c' }); bxWave(c, -1, { col: '#fb923c' }); shake(5); yield .7; },
  },
});

bx('lich_gelo', {
  n: 'Lich do Gelo', act: 2, w: 46, h: 64, hp: 4500, dmg: 30, def: 5, spd: 150, coin: [95, 145], fly: 1, sword: 's046', rec: 'frost_shard:10,sapphire:3,platinum_bar:4', cond: { biome: 'snow' },
  mech: 'cria ilusões idênticas a ele e se mistura entre elas; só o verdadeiro leva dano, as falsas estouram em gelo.',
  shot: 'shard', loco: ['hover', { h: -120, sx: 120, spd: 140 }], kit: [['frost', 'illusion'], ['frost', 'spikes', 'illusion'], ['illusion', 'spikes', 'blink', 'frost']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *frost(c) { c.free = true; for (let k = 0; k < 3; k++) { bxShot(c, { speed: 210, spread: (k - 1) * .35, r: 6, shape: 'shard', col: '#7dd3fc', col2: '#e0f2fe', homing: true, steer: 1.3, life: 3.5, dm: .55 }); sfx('magic', .4); yield .5; } },
    *spikes(c) { const dir = Math.sign(c.dx) || 1; for (let k = 0; k < 7; k++) { bxCol(c, c.cx + dir * (50 + k * 40), { w: 24, h: 70, tel: .55 + k * .08, col: '#7dd3fc' }); } yield 1.5; },
    *blink(c) { burst(c.cx, c.cy, 12, { col: ['#7dd3fc', '#fff'], spd: 100, glow: true, life: .5 }); yield .3; bxTp(c, c.px + (Math.random() < .5 ? -1 : 1) * 140, c.py - 70); yield .2; bxFan(c, 5, .2, { speed: 270, r: 6, shape: 'shard', col: '#7dd3fc', col2: '#fff', dm: .5 }); yield .7; },
    *illusion(c, e) {
      c.free = false; const slots = []; for (let k = 0; k < 4; k++) slots.push([c.px + (k - 1.5) * 120, c.py - 100 - (k & 1) * 30]);
      slots.sort(() => Math.random() - .5); burst(c.cx, c.cy, 16, { col: ['#7dd3fc', '#fff'], spd: 120, glow: true, life: .5 }); sfx('portal', .5); yield .3;
      bxTp(c, slots[0][0], slots[0][1]);
      for (let k = 1; k < 4; k++) { const s = bxMin(c, { key: 'bx_lich_gelo', x: slots[k][0], y: slots[k][1], hp: 1, w: e.w, h: e.h, dm: .25, decoy: true, life: 11, look: 'orb',
        onDie: (q) => { burst(ecx(q), ecy(q), 18, { col: ['#7dd3fc', '#fff', '#bae6fd'], spd: 180, g: 200, life: .6, glow: true }); ringFx(ecx(q), ecy(q), 40, '#7dd3fc', .4, 3); sfx('hit'); if (!G.P.dead && Math.hypot(ecx(q) - pcx(G.P), ecy(q) - pcy(G.P)) < 46) hurtPlayer(Math.round(e.dmg * .5), ecx(q), 140); },
        mf: (q, dt) => { q.t = (q.t || 0) + dt; q.face = pcx(G.P) > ecx(q) ? 1 : -1; q.vx *= .95; q.vy *= .95; steerFly(q, q.hx + Math.sin(q.t * 1.2 + q.hx) * 22, q.hy + Math.cos(q.t * 1.1) * 14, 90, 2, dt); q.sh = (q.sh === undefined ? 1 + Math.random() * 1.5 : q.sh) - dt; if (q.sh <= 0) { q.sh = 2.4; bxShot({ e: q.owner, d: q.owner.d.bx, cx: ecx(q), cy: ecy(q), px: pcx(G.P), py: pcy(G.P) }, { speed: 230, r: 6, shape: 'shard', col: '#7dd3fc', col2: '#e0f2fe', dm: .4, life: 3 }); } } }); s.hx = slots[k][0]; s.hy = slots[k][1]; s.invulnerable = false; }
      yield 1.2;
    },
  },
});

bx('escaravelho', {
  n: 'Escaravelho Real', act: 2, w: 58, h: 48, hp: 5000, dmg: 36, def: 8, spd: 170, coin: [95, 150], fly: 1, sword: 's017', rec: 'beetle_claw:12,emerald:3,platinum_bar:4', cond: { layer: 'cave' },
  mech: 'enrola-se numa bola que quica pela arena e solta estilhaços; ao desenrolar fica tonto e vulnerável.',
  shot: 'shard', loco: ['orbit', { r: 190, h: -100, spd: 170 }], kit: [['runes', 'roll'], ['runes', 'roll', 'charge'], ['roll', 'runes', 'charge', 'roll']], cds: [1.3, 1.0, .8],
  passive(c) { c.S.dizzy = Math.max(0, (c.S.dizzy || 0) - c.dt); },
  hurt(c, e, dmg) { return c ? (c.S.ball ? dmg * .5 : c.S.dizzy > 0 ? dmg * 1.6 : dmg) : dmg; },
  variant: (e, c) => c && c.S.ball ? 1 : 0,
  moves: {
    *runes(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 8, { speed: 190, r: 6, shape: 'orb', col: '#34d399', col2: '#d1fae5', off: k * .4, dm: .5, life: 3 }); yield .9; } },
    *charge(c) { yield .5; burst(c.cx, c.cy, 8, { col: ['#34d399', '#fff'], spd: 80, glow: true, life: .4 }); yield* bxDash(c, 560, .6); },
    *roll(c, e) {
      c.S.ball = true; e.noclip = false; e.vx = (c.dx > 0 ? 1 : -1) * 380; e.vy = -300; let t = 0; sfx('boom', .3);   /* na bola ele quica no relevo */
      while (t < 4.2) { t += c.dt; c.free = true; c.skipLoco = true; e.vy += GRAV * c.dt; if (e.hitY > 0) { e.vy = -(430 + rnd(0, 120)); bxFan(c, 3, .45, { ang: -PI / 2, speed: 230, shape: 'shard', col: '#34d399', col2: '#d1fae5', kind: 'ballistic', grav: 600, dm: .35, life: 1.6 }); sfx('hit'); } if (e.hitX) e.vx = -Math.sign(e.vx || 1) * 380; if (Math.abs(e.vx) < 220) e.vx = Math.sign(c.dx || 1) * 320; yield; }
      c.S.ball = false; e.noclip = true; c.free = false; c.S.dizzy = 2.4; e.vx = e.vy = 0; yield 2.4;
    },
  },
});

bx('cavaleiro', {
  n: 'Cavaleiro Sem Cabeça', act: 2, w: 62, h: 80, hp: 5600, dmg: 40, def: 7, spd: 90, coin: [105, 160], sword: 's056', rec: 'bone:30,topaz:3,platinum_bar:5', cond: { night: 1 },
  mech: 'arremessa a própria cabeça, que persegue você e volta; sem ela o cavaleiro anda cego e leva mais dano.',
  shot: 'ball', loco: ['walk', { spd: 78, jump: 450 }], kit: [['slash', 'head'], ['slash', 'head', 'gallop'], ['gallop', 'head', 'slash', 'lantern']], cds: [1.2, .95, .75],
  init(c) { c.S.headless = 0; c.S.lost = 0; },
  passive(c, e) {
    c.S.lost = Math.max(0, c.S.lost - c.dt); if (c.S.headless > 0) { c.S.headless -= c.dt; if (!c.g) { c.skipLoco = true; e.vx = approach(e.vx, (Math.sin(c.t * 1.3) > 0 ? 1 : -1) * 90, 500 * c.dt); } if (c.S.headless <= 0) toast('O cavaleiro recuperou a cabeça!', '#f97316'); }
  },
  hurt(c, e, dmg) { return c && c.S.headless > 0 ? dmg * 1.5 : dmg; },
  variant: (e, c) => c && c.S.headless > 0 ? 1 : 0,
  moves: {
    *slash(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .3, { y: c.cy - 20, speed: 320, r: 9, shape: 'blade', col: '#fdba74', col2: '#fff', dm: .65, life: 1.4 }); yield .5; } },
    *head(c, e) {
      if (c.S.lost > 0) { yield .3; return; } c.S.headless = 7; burst(c.cx, c.cy - 40, 10, { col: ['#f97316', '#fde68a'], spd: 100, glow: true, life: .4 }); sfx('boss', .3);
      const h = bxMin(c, { x: c.cx, y: c.cy - 50, w: 22, h: 22, hp: 70, look: 'orb', col: '#f97316', col2: '#fde68a', dm: .6, life: 12, fly: 1, name: 'Cabeça do Cavaleiro',
        onDie: (q) => { c.S.lost = 9; c.S.headless = 9; burst(ecx(q), ecy(q), 16, { col: ['#f97316', '#fde68a'], spd: 160, g: 200, life: .6, glow: true }); },
        mf: (q, dt) => { q.t = (q.t || 0) + dt; if (q.t < 2.6) steerFly(q, pcx(G.P), pcy(G.P) - 10, 190, 1.8, dt); else { steerFly(q, ecx(e), ecy(e) - 40, 260, 2.4, dt); if (Math.hypot(ecx(q) - ecx(e), ecy(q) - ecy(e) + 40) < 22) { q.dead = true; c.S.headless = 0; bxHeal(e, .02); } } } });
      yield 1.2;
    },
    *gallop(c, e) { const dir = Math.sign(c.dx) || 1; bxTele(c, { x: dir > 0 ? c.cx : c.cx - 340, y: e.y + 14, w: 340, h: e.h - 14, tel: .8, col: '#f97316' }); yield .85; yield* bxHold(c, .85, () => { e.vx = dir * 400 * c.sm; }); bxWave(c, dir, { col: '#f97316' }); shake(4); yield .7; },
    *lantern(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRain(c, 6, { speed: 280, r: 8, shape: 'ball', col: '#f97316', col2: '#fde68a', dm: .6, life: 3 }); yield .8; } },
  },
});

bx('fenix_cinzas', {
  n: 'Fênix de Cinzas', act: 2, w: 64, h: 48, hp: 6000, dmg: 38, def: 6, spd: 220, coin: [110, 165], fly: 1, sword: 's058', rec: 'meteor_bar:5,feather:10,platinum_bar:4', cond: { layer: 'hell' },
  mech: 'deixa um rastro de fogo no ar por onde passa; à beira da morte renasce numa explosão que cura parte da vida.',
  shot: 'fire', loco: ['orbit', { r: 240, h: -130, spd: 220, w: 1.1 }], kit: [['feathers', 'trail'], ['feathers', 'trail', 'dive'], ['trail', 'dive', 'feathers', 'trail']], cds: [1.2, .95, .75],
  onPhase(c, e, ph) { if (ph === 3 && !c.S.reborn) { c.S.reborn = true; bxHeal(e, .1); bxRing(c, 18, { speed: 210, r: 7, shape: 'fire', dm: .55, life: 2.6 }); ringFx(c.cx, c.cy, 110, '#f97316', .7, 5); shake(8); toast('A Fênix renasce das cinzas!', '#f97316'); sfx('boom', .7); } },
  moves: {
    *feathers(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .2, { speed: 300, r: 6, dm: .5, life: 3 }); sfx('fire', .4); yield .6; } },
    *trail(c, e) { const dir = c.dx > 0 ? 1 : -1; let acc = 0; yield* bxDash(c, 400, 1.7, { tx: c.px + dir * 380, ty: c.py - 60, fx: () => { acc += c.dt; if (acc > .11) { acc = 0; bxZone(c, { x: ecx(e), y: ecy(e), r: 15, kind: 'fire', t: 3.4, dmg: Math.round(e.dmg * .12), tick: .25, col: '#f97316', rim: '#fde68a', alpha: .3, glow: true }); } } }); yield .4; },
    *dive(c, e) { yield* bxHold(c, .7, () => bxSteer(c, c.px, c.py - 240, 330)); burst(c.cx, c.cy, 12, { col: ['#f97316', '#fde68a'], spd: 100, glow: true, life: .5 }); yield .3; let acc = 0; yield* bxDash(c, 620, .75, { fx: () => { acc += c.dt; if (acc > .09) { acc = 0; bxZone(c, { x: ecx(e), y: ecy(e), r: 13, kind: 'fire', t: 2.6, dmg: Math.round(e.dmg * .12), tick: .25, col: '#f97316', rim: '#fde68a', alpha: .3, glow: true }); } } }); yield .5; },
  },
});

bx('relojoeiro', {
  n: 'Autômato Relojoeiro', act: 2, w: 56, h: 62, hp: 6200, dmg: 38, def: 8, spd: 130, coin: [110, 165], fly: 1, sword: 's059', rec: 'gold_bar:10,iron_bar:10,platinum_bar:4,quartz:6',
  mech: 'a cada 7 segundos volta no tempo: reaparece onde estava 3 segundos antes, recuperando um pouco de vida.',
  shot: 'star', loco: ['hover', { h: -130, sx: 100, spd: 130 }], cds: [1.2, .95, .75], bob: 3,
  init(c) { c.S.hist = []; c.S.hc = 0; c.S.last = 0; },
  passive(c, e) { c.S.hc -= c.dt; if (c.S.hc <= 0) { c.S.hc = .1; c.S.hist.push([c.cx, c.cy]); if (c.S.hist.length > 32) c.S.hist.shift(); } },
  pick(c) { if (c.t - c.S.last > 7 && c.S.hist.length > 20) { c.S.last = c.t; return 'rewind'; } const L = c.ph > 1 ? ['gears', 'hands', 'laser'] : ['gears', 'laser']; return L[c.i++ % L.length]; },
  moves: {
    *gears(c) { c.free = true; for (let k = 0; k < 2; k++) { for (let i = 0; i < 4; i++) bxShot(c, { spread: (i - 1.5) * .3 - .2, speed: 250, r: 7, shape: 'star', col: '#fbbf24', col2: '#fff', kind: 'ballistic', grav: 520, bounce: .85, spin: 8, dm: .55, life: 4.2 }); sfx('fire', .4); yield .9; } },
    *hands(c, e) { c.free = true; bxBeam(c, { follow: true, ang: -PI / 2, spin: .9 * (c.ph > 2 ? 1.3 : 1), len: 190, w: 6, tel: .7, t: 3.6, dmg: Math.round(e.dmg * .65), col: '#fbbf24', col2: '#fff', rate: .15 }); bxBeam(c, { follow: true, ang: PI / 2, spin: .3 * (c.ph > 2 ? 1.3 : 1), len: 120, w: 8, tel: .7, t: 3.6, dmg: Math.round(e.dmg * .65), col: '#f59e0b', col2: '#fff', rate: .15 }); yield 3.8; },
    *laser(c, e) { yield* bxHold(c, .3, () => { }); bxBeam(c, { follow: true, aim: true, ang: 0, len: 600, w: 7, tel: .9, t: 1.5, dmg: Math.round(e.dmg * .8), col: '#fbbf24', col2: '#fff' }); yield 1.9; },
    *rewind(c, e) {
      const h = c.S.hist, t = h[Math.max(0, h.length - 30)]; bxTele(c, { x: t[0], y: t[1], r: 22, tel: .9, col: '#fbbf24' }); sfx('portal', .5); yield* bxHold(c, .9, () => { e.vx *= .9; e.vy *= .9; });
      bxTp(c, t[0], t[1]); bxHeal(e, .03); ringFx(t[0], t[1], 60, '#fbbf24', .5, 3); bxRing(c, 10, { speed: 200, r: 6, shape: 'star', col: '#fbbf24', col2: '#fff', spin: 6, dm: .45, life: 2.4 }); yield .6;
    },
  },
});

bx('vento', {
  n: 'Espírito do Vento', act: 2, w: 50, h: 50, hp: 4000, dmg: 30, def: 3, spd: 150, coin: [85, 130], fly: 1, noclip: 1, sword: 's033', rec: 'feather:15,quartz:8,platinum_bar:4', cond: { layer: 'surface' },
  mech: 'rajadas de vento empurram você para um lado e depois para o outro, a cada poucos segundos, sem parar.',
  shot: 'blade', loco: ['orbit', { r: 180, h: -100, spd: 150 }], kit: [['razor', 'tornado'], ['razor', 'tornado', 'sweep'], ['tornado', 'razor', 'sweep', 'tornado']], cds: [1.3, 1.0, .8], bob: 4,
  init(c) { c.S.dir = Math.random() < .5 ? -1 : 1; c.S.tw = 3.4; },
  passive(c, e) {
    const P = G.P; c.S.tw -= c.dt; const warn = c.S.tw < .9;
    if (c.S.tw <= 0) { c.S.dir = -c.S.dir; c.S.tw = 3.8; sfx('thunder', .2); }
    if (!P.dead && !warn) P.vx += c.S.dir * (c.ph > 2 ? 780 : 640) * c.dt;
    if (Math.random() < c.dt * 40) { const cam = G.cam, wx = c.S.dir > 0 ? cam.x - 10 : cam.x + cam.w / cam.zoom + 10; addPart({ x: wx, y: cam.y + Math.random() * cam.h / cam.zoom, vx: c.S.dir * (warn ? 160 : 520), vy: rnd(-20, 20), life: 1.4, size: 2, col: warn ? '#fde68a' : '#e0f2fe', glow: false }); }
  },
  moves: {
    *razor(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 4, .24, { speed: 330, r: 9, shape: 'blade', col: '#bae6fd', col2: '#fff', dm: .55, life: 2.4, spin: 10 }); yield .6; } },
    *tornado(c, e) { c.free = true; for (let k = 0; k < (c.ph > 1 ? 2 : 1); k++) { const gy = groundY(c.px + (k ? 120 : -120), c.py, 40), z = bxZone(c, { x: c.px + (k ? 160 : -160), y: (gy > 0 ? gy : c.py) - 30, r: 52, kind: 'pull', k: 620, core: 22, dmg: Math.round(e.dmg * .45), t: 6, tel: .6, col: '#bae6fd', rim: '#fff', alpha: .22, glow: true }); z.fn = (zz, dt) => { zz.x += Math.sign(c.px - zz.x) * 30 * dt; }; yield .5; } yield 1; },
    *sweep(c, e) { yield .3; const dir = c.dx > 0 ? 1 : -1; yield* bxHold(c, 1, () => { e.vx = dir * 340; e.vy *= .9; }); },
  },
});

bx('hidra', {
  n: 'Hidra do Pântano', act: 2, w: 80, h: 64, hp: 7000, dmg: 38, def: 6, spd: 44, coin: [120, 180], sword: 's050', rec: 'gel:30,thorn:10,emerald:3,platinum_bar:5', cond: { biome: 'jungle' },
  mech: 'três cabeças atacam por conta própria (fogo, veneno e gelo); a cada fase uma cabeça cai e as outras ficam mais rápidas.',
  loco: ['walk', { spd: 40, jump: 380 }], kit: [['stomp', 'roar'], ['stomp', 'roar', 'lunge'], ['lunge', 'stomp', 'roar']], cds: [1.8, 1.4, 1.1],
  init(c) { c.S.alive = [true, true, true]; c.S.hc = [1.5, 2.6, 3.7]; },
  onPhase(c, e, ph) { const k = c.S.alive.map((a, i) => a ? i : -1).filter(i => i >= 0); if (k.length > 1) { const i = pick(k); c.S.alive[i] = false; const p = bxHeadPos(e, i); burst(p[0], p[1], 20, { col: ['#a3e635', '#14532d'], spd: 180, g: 300, life: .7, glow: true }); sfx('boom', .5); addText(p[0], p[1] - 10, 'Cabeça cortada!', '#a3e635', 12, 1.2); } },
  passive(c, e) {
    const n = c.S.alive.filter(Boolean).length, rate = n === 3 ? 1 : n === 2 ? 1.35 : 1.8;
    for (let i = 0; i < 3; i++) if (c.S.alive[i]) { c.S.hc[i] -= c.dt * rate; if (c.S.hc[i] <= 0) { c.S.hc[i] = 2.4 + rnd(0, .8); const p = bxHeadPos(e, i), cc = { e, d: c.d, cx: p[0], cy: p[1], px: c.px, py: c.py };
      if (i === 0) { for (let k = -1; k <= 1; k++) bxShot(cc, { speed: 290, spread: k * .22, r: 7, shape: 'fire', dm: .6, life: 3, nolight: false }); }
      else if (i === 1) { const q = bxShot(cc, { speed: 270, spread: -.2, r: 8, shape: 'orb', col: '#a3e635', col2: '#ecfccb', kind: 'ballistic', grav: 560, dm: .5, life: 3.4 }); q.onDie = (r, why) => { if (why !== 'life') bxZone(c, { x: r.x, y: r.y, r: 26, kind: 'poison', t: 4, dmg: Math.round(e.dmg * .12), tick: .5, col: '#84cc16', alpha: .25 }); }; }
      else { const q = bxShot(cc, { speed: 220, r: 6, shape: 'shard', col: '#7dd3fc', col2: '#e0f2fe', homing: true, steer: 1.4, dm: .5, life: 3.6 }); q.onHit = () => bxBuff('slow', 2.2, { mult: .55 }); }
      sfx('fire', .35); } }
  },
  over(g, e, H) {
    const c = e.ai.x; if (!c) return; const hs = bxSpr('hidra_cab', Math.floor(e.age * 3) & 1, 0), cols = ['#fb923c', '#a3e635', '#7dd3fc'];
    for (let i = 0; i < 3; i++) { const p = bxHeadPos(e, i), bx0 = Math.round(ecx(e) + (i - 1) * 20), by0 = Math.round(e.y + 6), alive = c.S.alive[i], hx = Math.round(alive ? p[0] : bx0 + (i - 1) * 6), hy = Math.round(alive ? p[1] : by0 - 12);
      const n = 9; for (let k = 0; k <= n; k++) { const t = k / n, x = Math.round(bx0 + (hx - bx0) * t + Math.sin(t * 3 + i) * 3), y = Math.round(by0 + (hy - by0) * t); g.fillStyle = k & 1 ? '#3a5a2a' : '#2a421c'; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#5a8a3a'; g.fillRect(x - 4, y - 4, 3, 3); }
      if (alive) { H.put(hs, hx, hy, 45, 45, H.f < 0 && false, .4); g.fillStyle = cols[i]; g.fillRect(hx + 8, hy + 4, 3, 2); } else { g.fillStyle = '#1a2a12'; g.fillRect(hx - 5, hy - 3, 10, 5); }
    }
  },
  moves: {
    *stomp(c, e) { yield .4; if (e.onGround) e.vy = -400; yield .6; bxWave(c, 1, { col: '#84cc16' }); bxWave(c, -1, { col: '#84cc16' }); shake(5); sfx('boom', .4); yield .6; },
    *roar(c) { c.free = true; bxRing(c, 12, { speed: 150, r: 6, shape: 'orb', col: '#a3e635', col2: '#ecfccb', dm: .4, life: 3 }); yield 1.2; },
    *lunge(c, e) { const dir = Math.sign(c.dx) || 1; bxTele(c, { x: dir > 0 ? c.cx : c.cx - 260, y: e.y + 10, w: 260, h: e.h - 10, tel: .7, col: '#a3e635' }); yield .75; yield* bxHold(c, .6, () => { e.vx = dir * 360 * c.sm; }); shake(4); yield .8; },
  },
});
function bxHeadPos(e, i) { const t = e.age; return [ecx(e) + (i - 1) * 30 + Math.sin(t * 1.3 + i * 2) * 9, e.y - 34 + Math.cos(t * 1.7 + i) * 7 - (i === 1 ? 10 : 0)]; }

bx('mariposa', {
  n: 'Mariposa Lunar', act: 2, w: 62, h: 44, hp: 4400, dmg: 30, def: 3, spd: 170, coin: [90, 135], fly: 1, sword: 's052', rec: 'glow_mushroom:10,amethyst:3,platinum_bar:5,feather:6', cond: { night: 1 },
  mech: 'escurece toda a tela: só um círculo ao redor de você e dela fica visível; a poeira luminosa denuncia os tiros.',
  shot: 'orb', loco: ['orbit', { r: 200, h: -110, spd: 170 }], kit: [['dust', 'scales'], ['dust', 'scales', 'moonbeam'], ['moonbeam', 'dust', 'scales', 'swoop']], cds: [1.3, 1.0, .8],
  passive(c, e) { const S = bxS(), P = G.P; S.dark = { t: G.t, a: c.ph > 2 ? .88 : .8, holes: [[pcx(P), pcy(P), c.ph > 2 ? 72 : 88], [c.cx, c.cy, 130]] }; },
  moves: {
    *dust(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 12, { speed: 150, r: 6, shape: 'orb', col: '#c4b5fd', col2: '#fff', off: k * .26, dm: .45, life: 3.4, trail: '#c4b5fd' }); yield .95; } },
    *scales(c) { c.free = true; for (let k = 0; k < 4; k++) { bxShot(c, { speed: 190, spread: rnd(-.7, .7), r: 6, shape: 'petal', col: '#a78bfa', col2: '#ede9fe', homing: true, steer: 1.1, life: 4, dm: .5, trail: '#c4b5fd' }); yield .45; } },
    *moonbeam(c) { for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-140, 140), { w: 34, h: 360, tel: .85, col: '#c4b5fd', fire: true }); yield .35; } yield 1; },
    *swoop(c) { yield .5; burst(c.cx, c.cy, 10, { col: ['#c4b5fd', '#fff'], spd: 90, glow: true, life: .4 }); yield* bxDash(c, 560, .6); },
  },
});
