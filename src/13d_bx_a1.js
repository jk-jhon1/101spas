/* ============================================================
   13d_bx_a1: chefes novos do Ato I · Despertar (8). Motor e ajudas em 13c_bossx.js; arte em 05g_bxart1.js.
   Cada chefe tem uma mecânica única (campo `mech`) e um repertório de golpes (geradores).
   ============================================================ */
const bxPuddle = (c, x, y, o) => { const gy = groundY(x, y, 30), yy = (gy > 0 ? gy : y) - 5; return bxZone(c, Object.assign({ x, y: yy, r: 32, kind: 'slow', t: 7, mult: .5, col: '#fbbf24', rim: '#fde68a', alpha: .3 }, o)); };

bx('vespa', {
  n: 'Rainha Vespa', act: 1, w: 46, h: 38, hp: 900, dmg: 16, def: 1, spd: 150, coin: [40, 70], fly: 1, sword: 's023', rec: 'stinger:8,gel:12', cond: { biome: 'jungle' },
  mech: 'cospe favos de mel que viram poças pegajosas (lentidão); com você presa no mel, a Rainha acelera.',
  shot: 'needle', loco: ['orbit', { r: 190, h: -110 }], kit: [['sting', 'honey'], ['sting', 'honey', 'swarm'], ['sting', 'swarm', 'honey', 'dive']], cds: [1.5, 1.2, .9], bob: 6,
  passive(c, e) { const S = bxS(); for (const z of S.zones) if (z.owner === e && z.kind === 'slow' && z.age >= z.tel && bxZoneHit(z, G.P)) { c.sm *= 1.4; break; } },
  moves: {
    *sting(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .2, { speed: 300, r: 4, shape: 'needle', dm: .55 }); sfx('fire', .35); yield .5; } },
    *honey(c) { c.free = true; for (let k = 0; k < 4; k++) { const p = bxShot(c, { speed: 250 + rnd(-30, 40), spread: rnd(-.4, .4) - .25, r: 7, shape: 'ball', col2: '#fde68a', kind: 'ballistic', grav: 620, life: 3.5, dm: .3 }); p.onDie = (q, why) => { if (why !== 'life') bxPuddle(c, q.x, q.y); }; sfx('fire', .3); yield .38; } },
    *swarm(c, e) { c.free = true; for (let k = 0; k < 2; k++) { if (G.enemies.filter(x => x.k === 'wasp' && x.owner === e && !x.dead).length < 3) bxSpawn(c, 'wasp', c.cx + rnd(-30, 30), c.cy + 10, { hp: 24, dm: .4 }); yield .5; } yield .3; },
    *dive(c) { burst(c.cx, c.cy, 10, { col: ['#fbbf24', '#fff'], spd: 80, glow: true, life: .4 }); yield .45; yield* bxDash(c, 540, .55); },
  },
});

bx('carvalho', {
  n: 'Velho Carvalho', act: 1, w: 56, h: 86, hp: 1500, dmg: 18, def: 3, spd: 60, coin: [50, 80], sword: 's007', rec: 'wood:80,thorn:8', cond: { biome: 'forest' },
  mech: 'raízes brotam sob seus pés em cadeia, cada uma mirando onde você acabou de estar.',
  shot: 'ball', loco: ['walk', { spd: 50, jump: 400 }], kit: [['roots', 'acorns'], ['roots', 'acorns', 'stomp'], ['roots', 'stomp', 'acorns', 'roots']], cds: [1.5, 1.2, .9],
  moves: {
    *roots(c) { const n = c.ph > 2 ? 6 : 4; for (let k = 0; k < n; k++) { const x = c.px + (k ? rnd(-26, 26) : 0), gy = groundY(x, c.py, 30); if (gy > 0) { bxTele(c, { x: x - 12, y: gy - 8, w: 24, h: 8, tel: .55, col: '#84cc16' }); spawnProj({ friendly: false, kind: 'static', shape: 'vine', x, y: gy - 34, hw: 9, hh: 34, delay: .55, life: .6, dmg: Math.round(c.e.dmg * .8), kb: 140, col: '#4d7c0f', col2: '#a3e635', tiles: false, pierce: 1, glow: '#84cc16', glowR: 22 }); } yield .34; } yield .5; },
    *acorns(c) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { y: c.cy - 30, speed: 300, spread: rnd(-.3, .3) - .35, r: 6, shape: 'ball', col: '#a16207', col2: '#fde68a', kind: 'ballistic', grav: 700, life: 3, dm: .5 }); p.onDie = (q, why) => { if (why !== 'life') bxBoom(c, q.x, q.y, 28, { tel: .12, dm: .45, col: '#a16207' }); }; yield .5; } },
    *stomp(c, e) { yield .4; if (e.onGround) e.vy = -430; yield .7; bxWave(c, 1, { col: '#65a30d' }); bxWave(c, -1, { col: '#65a30d' }); shake(5); sfx('boom', .4); yield .6; },
  },
});

bx('caranguejo', {
  n: 'Caranguejo-Rei', act: 1, w: 64, h: 44, hp: 1700, dmg: 20, def: 3, spd: 70, coin: [55, 85], sword: 's035', rec: 'shark_tooth:4,gel:20', cond: { biome: 'ocean' },
  mech: 'o casco fecha e quase não leva dano; só ao abrir as garras para atacar ele fica vulnerável.',
  loco: ['walk', { spd: 64, jump: 380 }], kit: [['turtle', 'claw'], ['turtle', 'claw', 'leap'], ['turtle', 'leap', 'claw']], cds: [1.0, .8, .6],
  init(c) { c.S.shell = false; c.S.open = 0; },
  passive(c) { c.S.open = Math.max(0, c.S.open - c.dt); if (c.S.shell) c.sm *= .55; },
  hurt(c, e, dmg) { return c ? dmg * (c.S.shell ? .18 : c.S.open > 0 ? 1.4 : 1) : dmg; },
  variant: (e, c) => c && c.S.shell ? 1 : 0,
  moves: {
    *turtle(c) { c.S.shell = true; c.free = true; for (let k = 0; k < 3; k++) { bxShot(c, { speed: 160, r: 6, shape: 'ball', col: '#7dd3fc', col2: '#e0f2fe', homing: true, steer: 1.3, life: 4, dm: .45 }); yield .8; } yield .5; c.S.shell = false; },
    *claw(c, e) { c.S.shell = false; c.S.open = 2.6; yield .5; const dir = Math.sign(c.dx) || 1; yield* bxHold(c, .35, () => { e.vx = dir * 320; }); bxWave(c, 1); bxWave(c, -1); shake(4); sfx('boom', .3); yield 1.1; },
    *leap(c, e) { c.S.shell = false; c.S.open = 2.2; yield .35; if (e.onGround) { e.vy = -600; e.vx = Math.sign(c.dx) * Math.min(260, Math.abs(c.dx) * 1.2); } yield .5; let t = 0; while (!e.onGround && t < 2) { t += c.dt; yield; } bxBoom(c, c.cx, c.cy + 14, 56, { tel: .1 }); shake(5); yield .6; },
  },
});

bx('teceda', {
  n: 'Tecelã de Teias', act: 1, w: 54, h: 40, hp: 1300, dmg: 17, def: 2, spd: 160, coin: [45, 75], fly: 1, sword: 's028', rec: 'bone:16,gel:20,glow_mushroom:3', cond: { layer: 'cave' },
  mech: 'suas teias viram poças que travam seus passos; presa nelas, a Tecelã ataca mais rápido.',
  shot: 'needle', loco: ['hover', { h: -150, sx: 90, spd: 150 }], kit: [['web', 'fang'], ['web', 'drop', 'fang'], ['web', 'drop', 'web', 'fang']], cds: [1.4, 1.1, .8],
  passive(c, e) { const S = bxS(); c.S.stuck = false; for (const z of S.zones) if (z.owner === e && z.kind === 'slow' && z.age >= z.tel && bxZoneHit(z, G.P)) { c.S.stuck = true; break; } if (c.S.stuck && !c.g && c.cd > .5) c.cd = .5; },
  moves: {
    *web(c) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { speed: 270, spread: (k - 1) * .28 - .1, r: 5, shape: 'needle', col: '#e9d5ff', col2: '#c084fc', kind: 'ballistic', grav: 260, life: 3, dm: .35 }); p.onDie = (q, why) => { if (why !== 'life') bxPuddle(c, q.x, q.y, { r: 30, t: 9, mult: .35, col: '#c084fc', rim: '#f3e8ff', alpha: .2 }); }; yield .42; } },
    *fang(c) { c.free = true; for (let k = 0; k < 2; k++) { bxFan(c, 5, .16, { speed: 310, r: 4, shape: 'needle', col: '#a3e635', col2: '#ecfccb', dm: .5 }); yield .55; } },
    *drop(c) { yield* bxHold(c, .6, () => bxSteer(c, c.px, c.py - 70, 260)); burst(c.cx, c.cy, 8, { col: ['#c084fc', '#fff'], spd: 60, life: .3 }); yield* bxDash(c, 520, .38); yield* bxHold(c, .7, () => bxSteer(c, c.px, c.py - 150, 230)); },
  },
});

bx('escorpiao', {
  n: 'Escorpião das Dunas', act: 1, w: 70, h: 40, hp: 1600, dmg: 22, def: 3, spd: 90, coin: [55, 90], sword: 's006', rec: 'cactus:12,amber:4', cond: { biome: 'desert' },
  mech: 'afunda na areia e ressurge bem debaixo de você; depois do bote fica vulnerável por um instante.',
  loco: ['walk', { spd: 84, jump: 380 }], kit: [['tail', 'burrow'], ['tail', 'burrow', 'tail'], ['burrow', 'tail', 'burrow']], cds: [1.2, 1.0, .8],
  drawHidden(g, e) { const cx = Math.round(ecx(e)), gy = groundY(cx, ecy(e) - 20, 30); if (gy < 0) return; g.fillStyle = '#9a7a40'; g.fillRect(cx - 14, gy - 2, 28, 2); g.fillStyle = '#c9a85a'; g.fillRect(cx - 10, gy - 4, 20, 2); g.fillStyle = '#e8d08a'; g.fillRect(cx - 5, gy - 5, 10, 1); },
  moves: {
    *tail(c, e) { c.free = true; const f = c.dx >= 0 ? 1 : -1; for (let k = 0; k < 3; k++) { const p = bxShot(c, { x: c.cx - f * 30, y: c.cy - 34, speed: 280, r: 6, shape: 'orb', col: '#a3e635', col2: '#ecfccb', kind: 'ballistic', grav: 520, spread: -.3 + rnd(-.1, .1), life: 3, dm: .5 }); p.onDie = (q, why) => { if (why !== 'life') bxZone(c, { x: q.x, y: q.y, r: 22, kind: 'poison', t: 3, dmg: Math.round(e.dmg * .12), tick: .5, col: '#84cc16', alpha: .25 }); }; yield .5; } },
    *burrow(c, e) {
      c.nograv = true; e.noclip = true; e.hidden = true; e.invulnerable = true; e.harmless = true; e.vx = e.vy = 0; burst(c.cx, c.cy + 10, 14, { col: ['#e0c080', '#a88340'], spd: 120, g: 300, life: .5 }); sfx('boom', .3);
      yield* bxHold(c, 1.6, () => { const gy = groundY(c.px, c.py, 40), ty = (gy > 0 ? gy : c.py) + 6; steerFly(e, c.px, ty, 260 * c.sm, 4, c.dt); if (Math.random() < .5) burst(c.cx, ecy(e) - 10, 1, { col: ['#e0c080'], spd: 40, g: 200, life: .35 }); });
      const gx = c.px, gy = groundY(gx, c.py, 40); bxBoom(c, gx, (gy > 0 ? gy : c.py) - 8, 40, { tel: .8, dm: 1, col: '#fbbf24' }); e.vx = e.vy = 0; e.x = gx - e.w / 2; e.y = (gy > 0 ? gy : c.py) + 2;
      yield* bxHold(c, .8, () => { e.vx = e.vy = 0; });
      e.noclip = false; e.hidden = false; e.invulnerable = false; e.harmless = false; c.nograv = false; e.y = (gy > 0 ? gy : c.py) - e.h - 2; e.vy = -520; e.vx = 0;
      bxFan(c, 7, .3, { ang: -PI / 2, speed: 300, r: 6, shape: 'rock', col: '#a88340', col2: '#e0c080', dm: .4, life: 1.8, kind: 'ballistic', grav: 600 }); shake(6); sfx('boom', .5);
      c.S.open = 2; yield 1.6;
    },
  },
});

bx('cogumelo', {
  n: 'Rei Cogumelo', act: 1, w: 60, h: 60, hp: 1800, dmg: 18, def: 2, spd: 130, coin: [55, 85], sword: 's018', rec: 'spore:5,glow_mushroom:6', cond: { layer: 'cave' },
  mech: 'solta nuvens de esporos venenosas que crescem; dentro da própria nuvem ele se cura.',
  loco: ['hop', { jump: 520, spd: 130, gap: 1.2, onLand(c) { if (c.ph > 1) bxRing(c, 8, { speed: 120, r: 5, col: '#5eead4', col2: '#ccfbf1', dm: .35, life: 2.4 }); } }],
  kit: [['puff', 'spores'], ['puff', 'spores', 'shrooms'], ['puff', 'shrooms', 'spores', 'puff']], cds: [1.3, 1.0, .8],
  moves: {
    *puff(c, e) { c.free = true; for (let k = 0; k < 3; k++) { const x = c.px + rnd(-130, 130), gy = groundY(x, c.py, 30), z = bxZone(c, { x, y: (gy > 0 ? gy : c.py) - 18, r: 12, r0: 12, r1: 46, grow: 3, kind: 'poison', t: 9, dmg: Math.round(e.dmg * .16), tick: .5, col: '#2dd4bf', rim: '#99f6e4', alpha: .22 }); z.fn = (zz, dt) => { if (Math.hypot(ecx(e) - zz.x, ecy(e) - zz.y) < zz.r) bxHeal(e, .01 * dt); }; yield .45; } },
    *spores(c) { c.free = true; bxRing(c, 10, { speed: 125, r: 5, shape: 'orb', col: '#5eead4', col2: '#ccfbf1', dm: .4, life: 3 }); yield .9; bxRing(c, 10, { speed: 105, r: 5, off: .3, shape: 'orb', col: '#5eead4', col2: '#ccfbf1', dm: .4, life: 3 }); yield .4; },
    *shrooms(c, e) { c.free = true; for (let k = 0; k < 2; k++) { if (G.enemies.filter(x => x.owner === e && !x.dead).length < 3) bxSpawn(c, 'mushroom_walker', c.cx + rnd(-30, 30), c.cy, { hp: 40, dm: .4 }); yield .5; } yield .4; },
  },
});

bx('aguaviva', {
  n: 'Água-Viva Real', act: 1, w: 52, h: 60, hp: 1200, dmg: 18, def: 1, spd: 120, coin: [40, 65], fly: 1, sword: 's029', rec: 'frost_shard:4,quartz:6,gel:12',
  mech: 'três braços elétricos giram ao redor dela como uma ciranda; é preciso pular ou se afastar.',
  shot: 'orb', loco: ['float', { r: 130, h: -100, spd: 130 }], kit: [['sparks', 'spin'], ['sparks', 'spin', 'drift'], ['spin', 'sparks', 'drift', 'spin']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *sparks(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .22, { speed: 230, r: 6, col: '#f0abfc', col2: '#fff', dm: .55, life: 3.4 }); sfx('magic', .3); yield .6; } },
    *spin(c, e) { c.free = true; const sp = 1.5 * (c.ph > 1 ? 1.25 : 1); for (let k = 0; k < 3; k++) bxBeam(c, { follow: true, ang: k * TAU / 3, spin: sp, len: 150, w: 6, tel: .7, t: 4.2, dmg: Math.round(e.dmg * .6), col: '#f0abfc', col2: '#ffffff', rate: .15 }); yield 4.4; },
    *drift(c, e) { yield .3; const dir = c.dx > 0 ? 1 : -1; yield* bxHold(c, .9, () => { e.vx = dir * 330; e.vy *= .9; }); },
  },
});

bx('corvo', {
  n: 'Corvo da Tempestade', act: 1, w: 48, h: 36, hp: 1100, dmg: 18, def: 1, spd: 210, coin: [45, 70], fly: 1, sword: 's020', rec: 'feather:12,lens:4', cond: { night: 1 },
  mech: 'rouba suas moedas ao tocar em você e foge com elas; só devolve se for derrotado.',
  shot: 'petal', loco: ['orbit', { r: 230, h: -140, spd: 200, w: 1.1 }], kit: [['feathers', 'dive'], ['feathers', 'dive', 'caw'], ['feathers', 'caw', 'dive', 'feathers']], cds: [1.2, .95, .75],
  init(c) { c.S.loot = 0; c.S.fleeT = 0; c.S.cool = 0; },
  passive(c, e) {
    const P = G.P; c.S.cool -= c.dt; c.S.fleeT -= c.dt;
    if (c.S.fleeT > 0) { c.skipLoco = true; steerFly(e, c.cx + (c.cx > c.px ? 1 : -1) * 300, c.cy - 200, 320, 3, c.dt); }
    if (c.S.cool <= 0 && !P.dead && e.x < P.x + P.w && e.x + e.w > P.x && e.y < P.y + P.h && e.y + e.h > P.y) {
      const have = invCount('coin'), n = Math.min(have, Math.max(5, Math.round(have * .15)));
      if (n > 0 && !G.opts.god) { invRemove('coin', n); c.S.loot += n; addText(P.x + 6, P.y - 14, 'Roubou ' + n + ' moedas!', '#fbbf24', 12, 1.2); }
      c.S.cool = 4; c.S.fleeT = 2.2;
    }
  },
  death(e) { const c = e.ai.x; if (c && c.S.loot > 0) { for (let i = 0; i < 6; i++) dropItem('coin', Math.ceil(c.S.loot / 6), ecx(e) + rnd(-20, 20), ecy(e), rnd(-100, 100), rnd(-260, -120)); toast('O corvo devolveu as moedas roubadas!', '#fbbf24'); } },
  moves: {
    *feathers(c, e) { c.free = true; for (let k = 0; k < 2; k++) { const L = bxFan(c, 5, .2, { speed: 330, r: 5, shape: 'petal', col: '#6366f1', col2: '#e0e7ff', dm: .5, life: 3 }); for (const p of L) { p.tiles = false; p.onUpdate = (q, dt) => { if (q.age > .7) { const a = Math.atan2(ecy(e) - q.y, ecx(e) - q.x); q.vx += (Math.cos(a) * 330 - q.vx) * Math.min(1, 4 * dt); q.vy += (Math.sin(a) * 330 - q.vy) * Math.min(1, 4 * dt); if (Math.hypot(ecx(e) - q.x, ecy(e) - q.y) < 16) killProj(q, 'back'); } }; } yield .9; } },
    *dive(c) { yield .45; burst(c.cx, c.cy, 8, { col: ['#818cf8', '#fff'], spd: 90, glow: true, life: .4 }); yield* bxDash(c, 520, .55); },
    *caw(c) { c.free = true; sfx('boss', .3); bxRing(c, 8, { speed: 190, r: 5, shape: 'bolt', col: '#a5b4fc', col2: '#fff', dm: .5, life: 2.4 }); yield .9; },
  },
});
