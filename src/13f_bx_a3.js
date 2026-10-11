/* ============================================================
   13f_bx_a3: chefes novos do Ato III · Hardmode (16). Motor em 13c_bossx.js; arte em 05i_bxart3.js.
   ============================================================ */
bx('ceifador', {
  n: 'Ceifador Espectral', act: 3, w: 50, h: 78, hp: 12000, dmg: 56, def: 12, spd: 170, coin: [220, 320], fly: 1, sword: 's091', rec: 'hell_bar:8,e_shadow:4,bone:30',
  mech: 'marca três pontos no chão e aparece em cada um, em sequência, com um golpe de foice instantâneo.',
  shot: 'scythe', loco: ['hover', { h: -110, sx: 120, spd: 160 }], kit: [['scythes', 'reap'], ['scythes', 'reap', 'chains'], ['reap', 'chains', 'scythes', 'reap']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *scythes(c) { c.free = true; for (let k = 0; k < 2; k++) { const L = bxFan(c, 3, .4, { speed: 330, r: 10, shape: 'scythe', col: '#60a5fa', col2: '#dbeafe', dm: .65, life: 3, spin: 10 }); for (const p of L) bxBack(c, p, .8, 330); sfx('fire', .4); yield .9; } },
    *reap(c, e) {
      const pts = []; for (let k = 0; k < 3; k++) { const x = c.px + (k - 1) * 95 + rnd(-20, 20), gy = groundY(x, c.py, 40); pts.push([x, (gy > 0 ? gy : c.py) - 22]); }
      pts.forEach((p, k) => bxTele(c, { x: p[0], y: p[1], r: 32, tel: .8 + k * .5, col: '#60a5fa' })); sfx('portal', .5); yield .8;
      for (let k = 0; k < 3; k++) { bxTp(c, pts[k][0], pts[k][1] - 12); bxBoom(c, pts[k][0], pts[k][1], 42, { tel: .22, dm: 1, col: '#93c5fd' }); sfx('boom', .3); yield .5; } yield .3;
    },
    *chains(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 12, { speed: 170, r: 5, shape: 'orb', col: '#93c5fd', col2: '#fff', off: k * .26, dm: .5, life: 3 }); yield .9; } },
  },
});

bx('vampiro', {
  n: 'Conde Vampiro', act: 3, w: 48, h: 70, hp: 13000, dmg: 58, def: 10, spd: 190, coin: [230, 330], fly: 1, sword: 's095', rec: 'hell_bar:8,e_blood:6,vamp_tooth:12', cond: { night: 1 },
  mech: 'cura-se ao morder você no corpo a corpo; vira um bando de morcegos e reaparece pelas suas costas.',
  shot: 'orb', loco: ['hover', { h: -90, sx: 140, spd: 180 }], kit: [['fangs', 'bats'], ['fangs', 'mist', 'bats'], ['bats', 'mist', 'fangs', 'bats']], cds: [1.2, .95, .75], bob: 3,
  init(c) { c.S.heal = 0; },
  passive(c, e) { const P = G.P; c.S.heal -= c.dt; if (!P.dead && c.S.heal <= 0 && P.inv_ > .45 && e.x < P.x + P.w && e.x + e.w > P.x && e.y < P.y + P.h && e.y + e.h > P.y) { c.S.heal = 1.3; bxHeal(e, .03); addText(c.cx, e.y - 10, 'Sede!', '#e11d48', 14, 1); burst(c.cx, c.cy, 10, { col: ['#e11d48', '#fecdd3'], spd: 90, life: .5, glow: true }); } },
  moves: {
    *fangs(c) { c.free = true; for (let k = 0; k < 2; k++) { bxFan(c, 5, .2, { speed: 290, r: 6, shape: 'orb', col: '#e11d48', col2: '#fecdd3', dm: .55, life: 3 }); sfx('fire', .4); yield .7; } },
    *mist(c, e) { c.free = true; for (let k = 0; k < 2; k++) { bxZone(c, { x: c.px + rnd(-70, 70), y: c.py, r: 64, tel: 1, t: 6, kind: 'poison', dmg: Math.round(e.dmg * .12), tick: .4, col: '#9f1239', rim: '#fb7185', alpha: .24 }); yield .5; } yield .5; },
    *bats(c, e) {
      e.hidden = true; e.invulnerable = true; e.harmless = true; burst(c.cx, c.cy, 18, { col: ['#1a0508', '#e11d48'], spd: 120, life: .5 }); sfx('boss', .4);
      const bats = []; for (let i = 0; i < 9; i++) bats.push(bxMin(c, { x: c.cx + rnd(-16, 16), y: c.cy + rnd(-20, 20), w: 16, h: 10, hp: 12, look: 'bat', col: '#e11d48', dm: .3, life: 6, mf: (q, dt) => { q.t = (q.t || 0) + dt; const a = q.t * 3.2 + (q.tag || 0) * 1.7; q.hx = pcx(G.P) + Math.cos(a) * (50 + (q.tag % 3) * 18); q.hy = pcy(G.P) + Math.sin(a * 1.3) * 42; steerFly(q, q.hx, q.hy, 230, 3, dt); }, set: s => { s.tag = bats.length; } }));
      yield* bxHold(c, 2.8, () => steerFly(e, c.px + Math.cos(c.t * 3) * 70, c.py - 20 + Math.sin(c.t * 4) * 40, 230, 3, c.dt));
      for (const b of bats) b.dead = true; e.hidden = false; e.invulnerable = false; e.harmless = false; bxTp(c, c.px - (G.P.face || 1) * 55, c.py - 28); yield .35; yield* bxDash(c, 540, .42); yield .4;
    },
  },
});

bx('medusa', {
  n: 'Medusa de Pedra', act: 3, w: 52, h: 76, hp: 11000, dmg: 54, def: 10, spd: 150, coin: [220, 320], fly: 1, sword: 's068', rec: 'hell_bar:8,e_poison:4,emerald:6', cond: { layer: 'deep' },
  mech: 'carrega o olhar por um segundo: se você estiver olhando para ela quando disparar, fica petrificado.',
  shot: 'orb', loco: ['hover', { h: -95, sx: 110, spd: 150 }], kit: [['snakes', 'gaze'], ['snakes', 'gaze', 'lunge'], ['gaze', 'lunge', 'snakes', 'gaze']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *snakes(c) { c.free = true; for (let k = 0; k < 2; k++) { bxFan(c, 4, .26, { speed: 200, r: 6, shape: 'orb', col: '#84cc16', col2: '#ecfccb', homing: true, steer: .9, dm: .5, life: 4 }); yield .8; } },
    *gaze(c, e) {
      bxBeam(c, { follow: true, aim: true, ang: 0, len: 460, w: 3, tel: 1.2, t: 1.3, noHit: true, col: '#bef264', col2: '#fff' }); addText(c.cx, e.y - 12, 'OLHAR!', '#bef264', 14, 1); sfx('portal', .5); yield 1.25;
      const P = G.P, toward = c.cx > pcx(P) ? 1 : -1;
      if (!P.dead && P.face === toward && c.dist < 480 && los(c.cx, c.cy, pcx(P), pcy(P))) { hurtPlayer(Math.round(e.dmg * .8), c.cx, 60); bxBuff('stun', 1.6); addText(P.x, P.y - 18, 'Petrificado!', '#bef264', 13, 1.2); ringFx(pcx(P), pcy(P), 36, '#bef264', .5, 3); } else addText(P.x, P.y - 18, 'Desviou!', '#bef264', 11, .8);
      yield .5;
    },
    *lunge(c) { yield .45; burst(c.cx, c.cy, 10, { col: ['#bef264', '#fff'], spd: 90, glow: true, life: .4 }); yield* bxDash(c, 520, .55); },
  },
});

bx('sereia', {
  n: 'Sereia Abissal', act: 3, w: 54, h: 70, hp: 11500, dmg: 52, def: 9, spd: 130, coin: [220, 320], fly: 1, noclip: 1, sword: 's099', rec: 'hell_bar:8,e_water:6,shark_tooth:8', cond: { biome: 'ocean' },
  mech: 'seu canto puxa você contra a vontade, enquanto bolhas se fecham ao redor dela.',
  shot: 'orb', loco: ['float', { r: 150, h: -95, spd: 130 }], kit: [['bubbles', 'song'], ['bubbles', 'song', 'tide'], ['song', 'tide', 'bubbles', 'song']], cds: [1.4, 1.1, .85], bob: 4,
  moves: {
    *bubbles(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .3, { speed: 190, r: 8, shape: 'orb', col: '#7dd3fc', col2: '#e0f2fe', homing: true, steer: 1, dm: .5, life: 4 }); yield .65; } },
    *song(c, e) {
      sfx('magic', .6); const P = G.P;
      for (let i = 0; i < 8; i++) { const p = spawnProj({ friendly: false, kind: 'custom', shape: 'orb', x: c.cx, y: c.cy, r: 6, hw: 6, hh: 6, dmg: Math.round(e.dmg * .55), kb: 120, life: 3.2, col: '#7dd3fc', col2: '#e0f2fe', glow: '#38bdf8', glowR: 18, tiles: false, pierce: 1 }); p.i = i; p.onUpdate = (q, dt) => { const k = Math.min(1, q.age / 2.4), Rr = 160 - 130 * k, a = q.i / 8 * TAU + q.age * 1.8; q.x = ecx(e) + Math.cos(a) * Rr; q.y = ecy(e) + Math.sin(a) * Rr * .8; }; }
      yield* bxHold(c, 2.4, () => { if (!P.dead) { const d = Math.sign(c.cx - pcx(P)) || 1; P.vx = approach(P.vx, d * 150, 1800 * c.dt); if (Math.random() < .3) addPart({ x: pcx(P), y: P.y, vx: d * 30, vy: -30, life: .4, size: 2, col: '#7dd3fc', glow: true }); } }); yield .5;
    },
    *tide(c) { bxWave(c, 1, { col: '#38bdf8', y: c.py + 40, x: c.px - 220, speed: 300, hh: 12 }); bxWave(c, -1, { col: '#38bdf8', y: c.py + 40, x: c.px + 220, speed: 300, hh: 12 }); yield .9; bxWave(c, 1, { col: '#38bdf8', y: c.py + 40, x: c.px - 240, speed: 300, hh: 12 }); yield 1; },
  },
});

bx('armadura', {
  n: 'Armadura Viva', act: 3, w: 56, h: 86, hp: 14000, dmg: 62, def: 14, spd: 74, coin: [230, 340], sword: 's061', rec: 'hell_bar:10,titanium_bar:6,e_shadow:3',
  mech: 'só leva dano de verdade pelas costas (x2); de frente o dano cai a 40%. Ela se vira ao girar e ao preparar o golpe.',
  shot: 'blade', keepFace: true, loco: ['walk', { spd: 70, jump: 460 }], kit: [['cleave', 'whirl'], ['cleave', 'whirl', 'sweep'], ['sweep', 'swords', 'whirl', 'cleave']], cds: [1.2, .95, .75],
  passive(c, e) { const toward = c.dx >= 0 ? 1 : -1; if (!c.g) e.face = toward; c.S.weak = e.face !== toward; },
  hurt(c, e, dmg) { return c ? dmg * (c.S.weak ? 2.2 : .4) : dmg; },
  over(g, e, H) { const c = e.ai.x; if (c && c.S.weak) { const x = H.cx - e.face * 16, y = H.cy - 14; g.globalAlpha = .55 + .35 * Math.sin(G.t * 14); g.fillStyle = '#c4b5fd'; g.fillRect(x - 3, y - 6, 6, 14); g.globalAlpha = 1; } },
  moves: {
    *cleave(c, e) { for (let k = 0; k < 3; k++) { bxFan(c, 3, .35, { y: c.cy - 16, speed: 330, r: 10, shape: 'blade', col: '#c4b5fd', col2: '#fff', dm: .7, life: 1.4, ang: c.dx > 0 ? 0 : PI }); yield .5; } },
    *whirl(c, e) { for (let k = 0; k < 6; k++) { e.face = -e.face; if (k % 2) bxRing(c, 10, { speed: 210, r: 8, shape: 'blade', col: '#c4b5fd', col2: '#fff', off: k * .3, dm: .5, life: 1.8, spin: 10 }); yield .3; } },
    *sweep(c, e) { e.face = c.dx >= 0 ? -1 : 1; addText(c.cx, e.y - 10, '!', '#c4b5fd', 16, 1.4); yield 1.5; bxWave(c, 1, { col: '#a78bfa', hh: 14 }); bxWave(c, -1, { col: '#a78bfa', hh: 14 }); shake(6); sfx('boom', .5); yield .7; },
    *swords(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRain(c, 6, { speed: 340, r: 7, shape: 'sword', col: '#c4b5fd', col2: '#fff', dm: .6, life: 3 }); yield .8; } },
  },
});

bx('dragao', {
  n: 'Dragão Adormecido', act: 3, w: 90, h: 60, hp: 18000, dmg: 68, def: 14, spd: 170, coin: [280, 400], fly: 1, sword: 's077', rec: 'hell_bar:10,e_fire:6,celestial_frag:4', cond: { layer: 'cave' },
  mech: 'começa preguiçoso e só ataca com calma; cada golpe que ele leva enche a fúria, e com fúria cheia ele ataca sem parar.',
  shot: 'fire', loco: ['orbit', { r: 260, h: -110, spd: 170, w: .6 }], cds: [1.6, 1.3, 1.1],
  init(c) { c.S.rage = 0; },
  after(c, e, dmg) { if (c) c.S.rage = Math.min(1, c.S.rage + dmg / (e.hpMax * .035)); },
  passive(c, e) { c.S.rage = Math.max(0, c.S.rage - c.dt * .22); c.sm *= 1 + c.S.rage * .45; if (!c.g) c.cd -= c.dt * (c.S.rage * 1.7 - .45); if (c.S.rage > .92 && !c.S.max) { c.S.max = true; toast('O Dragão acordou de vez!', '#f59e0b'); shake(6); sfx('boss', .6); } if (c.S.rage < .5) c.S.max = false; },
  pick(c) { const r = c.S.rage, L = r < .35 ? ['fireball', 'swoop'] : r < .7 ? ['fireball', 'breath', 'swoop'] : ['breath', 'meteors', 'fireball', 'swoop']; return L[c.i++ % L.length]; },
  moves: {
    *fireball(c, e) { c.free = true; const n = 1 + Math.floor(c.S.rage * 3); for (let k = 0; k < n; k++) { const p = bxShot(c, { speed: 250, spread: (k - (n - 1) / 2) * .3, r: 14, shape: 'fire', dm: .8, life: 3.4 }); p.onDie = (q, why) => { if (why !== 'life') bxBoom(c, q.x, q.y, 58, { tel: .1, dm: .6, col: '#f59e0b' }); }; yield .35; } yield .6; },
    *breath(c) { c.free = true; const n = 8 + Math.floor(c.S.rage * 8); for (let k = 0; k < n; k++) { bxFan(c, 3, .18, { speed: 330, r: 8, shape: 'fire', dm: .45, life: 1.6 }); sfx('fire', .3); yield .1; } yield .5; },
    *swoop(c) { yield .5; burst(c.cx, c.cy, 12, { col: ['#f59e0b', '#fff'], spd: 100, glow: true, life: .5 }); yield* bxDash(c, 520, .7); },
    *meteors(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRain(c, 7, { speed: 360, r: 11, shape: 'meteor', col: '#fb923c', col2: '#fde68a', dm: .7, life: 3, spin: 4 }); yield .7; } },
  },
});

bx('gemeos', {
  n: 'Gêmeos Eclipse', act: 3, w: 44, h: 44, hp: 16000, dmg: 56, def: 12, spd: 180, coin: [260, 380], fly: 1, sword: 's080', rec: 'celestial_frag:6,e_light:5,e_shadow:5',
  mech: 'Sol e Lua dividem a mesma vida: bater em um é bater nos dois. Um fio de energia machuca quando eles se afastam.',
  shot: 'orb', loco: ['orbit', { r: 210, h: -120, spd: 180, w: .7 }], kit: [['rays', 'flare'], ['rays', 'flare', 'rays'], ['flare', 'rays', 'flare', 'rays']], cds: [1.4, 1.1, .85], bob: 3,
  variant: (e) => e.moon ? 1 : 0,
  after(c, e) { const t = c && c.S.twin; if (t && !t.dead) t.hp = e.hp; },
  init(c, e) {
    const s = bxMin(c, { key: 'bx_gemeos', x: c.cx + 80, y: c.cy - 20, w: 44, h: 44, hp: e.hpMax, dm: .9, look: 'orb', fly: 1, name: 'Lua do Eclipse', col: '#a5b4fc',
      h2: { after(cc, t) { const m = t.owner; if (m && !m.dead) m.hp = t.hp; } },
      onDie: (t) => { const m = t.owner; if (m && !m.dead) { m.hp = 0; killEnemy(m, null); } },
      mf: (t, dt) => { const m = t.owner; t.moon = true; t.hp = m.hp; t.face = pcx(G.P) > ecx(t) ? 1 : -1; const cc = m.ai.x; if (!cc) return; const a = cc.ang + PI; steerFly(t, pcx(G.P) + Math.cos(a) * 210, pcy(G.P) - 110 + Math.sin(a * 1.4) * 40, 175 * (cc.ph > 1 ? 1.2 : 1), 2, dt);
        t.sh = (t.sh === undefined ? 1.5 : t.sh) - dt * (cc.ph > 1 ? 1.4 : 1); if (t.sh <= 0) { t.sh = 2.4; bxFan({ e: m, d: m.d.bx, cx: ecx(t), cy: ecy(t), px: pcx(G.P), py: pcy(G.P) }, 3, .3, { speed: 260, r: 9, shape: 'blade', col: '#a5b4fc', col2: '#e0e7ff', dm: .5, life: 3, spin: 8 }); } } });
    s.moon = true; s.glowc = '#a5b4fc'; c.S.twin = s;
    c.S.link = bxBeam(c, { x: c.cx, y: c.cy, ang: 0, len: 0, w: 3, tel: 0, t: 1e9, dmg: Math.round(e.dmg * .4), col: '#fde68a', col2: '#c7d2fe', rate: .35, keep: false });
  },
  passive(c, e) { const t = c.S.twin, L = c.S.link; if (t && !t.dead && L) { const dx = ecx(t) - c.cx, dy = ecy(t) - c.cy, d = Math.hypot(dx, dy); L.x = c.cx; L.y = c.cy; L.ang = Math.atan2(dy, dx); L.len = d > 190 ? d : 0; L.noHit = d <= 190; } },
  moves: {
    *rays(c, e) { c.free = true; for (let k = 0; k < 8; k++) bxBeam(c, { follow: true, ang: k * TAU / 8, spin: .7 * (c.ph > 1 ? 1.3 : 1), len: 190, w: 5, tel: .8, t: 3.4, dmg: Math.round(e.dmg * .6), col: '#fde047', col2: '#fff', rate: .15 }); yield 3.6; },
    *flare(c) { c.free = true; for (let k = 0; k < 2; k++) { const p = bxShot(c, { speed: 240, r: 13, shape: 'fire', col: '#fde047', dm: .8, life: 3.4 }); p.onDie = (q, why) => { if (why !== 'life') { bxBoom(c, q.x, q.y, 54, { tel: .1, dm: .6, col: '#fde047' }); bxRing({ e: c.e, d: c.d, cx: q.x, cy: q.y, px: c.px, py: c.py }, 8, { speed: 170, r: 5, shape: 'orb', col: '#fde047', col2: '#fff', dm: .35, life: 2 }); } }; yield .9; } },
  },
});

bx('prisma', {
  n: 'Prisma Vivo', act: 3, w: 60, h: 60, hp: 15000, dmg: 58, def: 12, spd: 160, coin: [250, 360], fly: 1, sword: 's094', rec: 'e_fire:3,e_ice:3,e_lightning:3,e_poison:3,celestial_frag:4',
  mech: 'troca de elemento a cada poucos segundos: leva o dobro do elemento oposto (fogo×gelo, raio×veneno) e quase nada do próprio.',
  shot: 'shard', loco: ['hover', { h: -120, sx: 130, spd: 160 }], kit: [['cast', 'dash'], ['cast', 'cast', 'dash'], ['cast', 'dash', 'cast', 'cast']], cds: [1.4, 1.1, .85], bob: 3,
  init(c) { c.S.el = 0; c.S.tm = 6.5; },
  passive(c, e) { c.S.tm -= c.dt; if (c.S.tm <= 0) { c.S.tm = c.ph > 2 ? 4.8 : 6.5; c.S.el = (c.S.el + 1) % 4; const nm = ['Fogo', 'Gelo', 'Raio', 'Veneno'][c.S.el]; addText(c.cx, e.y - 14, '→ ' + nm, ['#fb923c', '#7dd3fc', '#fde047', '#a3e635'][c.S.el], 14, 1.4); ringFx(c.cx, c.cy, 50, ['#fb923c', '#7dd3fc', '#fde047', '#a3e635'][c.S.el], .5, 3); sfx('portal', .4); } e.glowc = ['#fb923c', '#7dd3fc', '#fde047', '#a3e635'][c.S.el]; },
  hurt(c, e, dmg, h) { if (!c) return dmg; const el = ['fire', 'ice', 'lightning', 'poison'][c.S.el], opp = { fire: 'ice', ice: 'fire', lightning: 'poison', poison: 'lightning' }[el]; return h.elem === opp ? dmg * 2.2 : h.elem === el ? dmg * .35 : dmg; },
  variant: (e, c) => c ? c.S.el : 0,
  moves: {
    *cast(c, e) {
      c.free = true; const el = c.S.el;
      if (el === 0) { for (let k = 0; k < 2; k++) { bxRing(c, 12, { speed: 190, r: 7, shape: 'fire', dm: .55, life: 2.6, off: k * .26 }); yield .8; } }
      else if (el === 1) { for (let k = 0; k < 3; k++) { bxFan(c, 3, .3, { speed: 220, r: 6, shape: 'shard', col: '#7dd3fc', col2: '#e0f2fe', homing: true, steer: 1.3, dm: .55, life: 3.6 }); yield .6; } }
      else if (el === 2) { for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-150, 150), { w: 24, h: 380, tel: .8, col: '#fde047', fire: true }); yield .3; } yield .8; }
      else { for (let k = 0; k < 3; k++) { const p = bxShot(c, { speed: 250, spread: rnd(-.3, .3) - .2, r: 8, shape: 'orb', col: '#a3e635', col2: '#ecfccb', kind: 'ballistic', grav: 540, dm: .5, life: 3.4 }); p.onDie = (q, why) => { if (why !== 'life') bxZone(c, { x: q.x, y: q.y, r: 28, kind: 'poison', t: 4, dmg: Math.round(e.dmg * .12), tick: .5, col: '#84cc16', alpha: .25 }); }; yield .55; } }
    },
    *dash(c) { yield .45; burst(c.cx, c.cy, 10, { col: ['#fff', c.e.glowc || '#fff'], spd: 90, glow: true, life: .4 }); yield* bxDash(c, 520, .55); },
  },
});

bx('magnetar', {
  n: 'Magnetar Ferroso', act: 3, w: 62, h: 58, hp: 14500, dmg: 60, def: 14, spd: 150, coin: [250, 360], fly: 1, sword: 's073', rec: 'cobalt_bar:8,e_lightning:5,hell_bar:6',
  mech: 'alterna a polaridade: puxa você por dois segundos e depois empurra, lançando estilhaços de metal.',
  shot: 'needle', loco: ['hover', { h: -110, sx: 100, spd: 150 }], kit: [['pull', 'push'], ['pull', 'shards', 'push'], ['pull', 'push', 'shards', 'dash']], cds: [1.2, .95, .75], bob: 3,
  moves: {
    *pull(c, e) { c.free = true; ringFx(c.cx, c.cy, 90, '#f87171', .6, 3); bxZone(c, { follow: e, x: c.cx, y: c.cy, r: 280, kind: 'pull', k: 820, core: 26, dmg: Math.round(e.dmg * .5), t: 2.2, tel: .4, col: '#f87171', rim: '#fecaca', alpha: .1, glow: true }); yield .5; bxRing(c, 8, { speed: 100, r: 6, shape: 'needle', col: '#cbd5e1', col2: '#f87171', dm: .5, life: 3 }); yield 2; },
    *push(c, e) { c.free = true; ringFx(c.cx, c.cy, 90, '#38bdf8', .6, 3); bxZone(c, { follow: e, x: c.cx, y: c.cy, r: 280, kind: 'pull', k: -900, t: 2, tel: .4, col: '#38bdf8', rim: '#e0f2fe', alpha: .1, glow: true }); yield .5; bxRing(c, 14, { speed: 280, r: 6, shape: 'needle', col: '#cbd5e1', col2: '#38bdf8', dm: .6, life: 2.4 }); yield 1.8; },
    *shards(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .22, { speed: 320, r: 5, shape: 'needle', col: '#cbd5e1', col2: '#f87171', dm: .55, life: 2.6 }); yield .5; } },
    *dash(c) { yield .45; yield* bxDash(c, 560, .55); },
  },
});

bx('titalava', {
  n: 'Titã de Lava', act: 3, w: 84, h: 96, hp: 20000, dmg: 72, def: 16, spd: 66, coin: [300, 430], sword: 's063', rec: 'hell_bar:12,e_fire:6,e_earth:6', cond: { layer: 'hell' },
  mech: 'abre uma fileira de gêiseres de lava que avança até você, deixando poças de fogo no chão.',
  shot: 'rock', loco: ['walk', { spd: 62, jump: 440 }], kit: [['fissure', 'lobs'], ['fissure', 'slam', 'lobs'], ['fissure', 'slam', 'quake', 'lobs']], cds: [1.5, 1.2, .95],
  moves: {
    *fissure(c, e) {
      const dir = Math.sign(c.dx) || 1; sfx('boom', .4);
      for (let k = 0; k < 10; k++) { const x = c.cx + dir * (50 + k * 44), tel = .45 + k * .1; bxCol(c, x, { w: 32, h: 150, tel, col: '#ff5a1f', fire: true, dm: .8 }); const gy = groundY(x, c.py, 40); if (gy > 0) bxZone(c, { x, y: gy - 6, r: 24, tel, t: tel + 5, kind: 'fire', dmg: Math.round(e.dmg * .12), tick: .3, col: '#ff5a1f', rim: '#fde68a', alpha: .3, glow: true }); }
      yield 1.9;
    },
    *lobs(c, e) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { y: c.cy - 40, speed: 300, spread: rnd(-.25, .25) - .3, r: 10, shape: 'meteor', col: '#ff5a1f', col2: '#fde68a', kind: 'ballistic', grav: 640, dm: .7, life: 3.6, spin: 5 }); p.onDie = (q, why) => { if (why !== 'life') { bxBoom(c, q.x, q.y, 36, { tel: .1, dm: .5, col: '#ff5a1f' }); bxZone(c, { x: q.x, y: q.y + 4, r: 22, kind: 'fire', t: 4, dmg: Math.round(e.dmg * .12), tick: .3, col: '#ff5a1f', rim: '#fde68a', alpha: .3, glow: true }); } }; yield .6; } },
    *slam(c, e) { yield .5; if (e.onGround) e.vy = -460; yield .6; bxWave(c, 1, { col: '#ff5a1f', hh: 14, dm: .9 }); bxWave(c, -1, { col: '#ff5a1f', hh: 14, dm: .9 }); bxFan(c, 6, .3, { ang: -PI / 2, speed: 320, shape: 'rock', col: '#7a2a0a', col2: '#ff9a52', kind: 'ballistic', grav: 640, dm: .5, life: 2 }); shake(8); sfx('boom', .6); yield .8; },
    *quake(c) { for (let k = 0; k < 6; k++) { bxCol(c, c.px + rnd(-180, 180), { w: 34, h: 140, tel: .8, col: '#ff5a1f', fire: true }); yield .25; } yield 1; },
  },
});

bx('tempestade', {
  n: 'Rainha das Tempestades', act: 3, w: 70, h: 60, hp: 17000, dmg: 64, def: 12, spd: 160, coin: [270, 390], fly: 1, sword: 's092', rec: 'e_lightning:8,e_water:4,celestial_frag:5', cond: { layer: 'surface' },
  mech: 'raios caem em colunas com aviso e a nuvem dela tira o peso do chão: dentro da tempestade você flutua.',
  shot: 'bolt', loco: ['hover', { h: -140, sx: 140, spd: 160 }], kit: [['bolts', 'strike'], ['bolts', 'storm', 'strike'], ['strike', 'storm', 'bolts', 'strike']], cds: [1.3, 1.0, .8], bob: 4,
  moves: {
    *bolts(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 4, .24, { speed: 330, r: 6, shape: 'bolt', col: '#c4b5fd', col2: '#fff', dm: .55, life: 2.4 }); sfx('thunder', .3); yield .6; } },
    *strike(c) { for (let k = 0; k < 7; k++) { bxCol(c, c.px + (k - 3) * 58 + rnd(-10, 10), { w: 26, h: 400, tel: .9 + (k % 2) * .3, col: '#ddd6fe', fire: true }); } sfx('thunder', .5); yield 1.9; },
    *storm(c, e) { c.free = true; bxZone(c, { follow: e, x: c.cx, y: c.cy + 50, r: 210, kind: 'buff', buff: 'floaty', bt: .4, t: 7, tel: .5, col: '#a78bfa', rim: '#ddd6fe', alpha: .12, glow: true }); addText(c.cx, e.y - 14, 'Tempestade!', '#c4b5fd', 13, 1.2); yield 2.5; },
  },
});

bx('devorador', {
  n: 'Devorador de Luz', act: 3, w: 66, h: 66, hp: 19000, dmg: 70, def: 14, spd: 140, coin: [280, 400], fly: 1, sword: 's083', rec: 'e_shadow:8,celestial_frag:6,hell_bar:6', cond: { layer: 'deep' },
  mech: 'planta buracos negros que sugam você para o centro; o núcleo machuca a cada instante.',
  shot: 'orb', loco: ['float', { r: 170, h: -100, spd: 140 }], kit: [['holes', 'orbs'], ['holes', 'orbs', 'devour'], ['holes', 'devour', 'orbs', 'holes']], cds: [1.4, 1.1, .85], bob: 4,
  moves: {
    *holes(c, e) { c.free = true; const n = c.ph > 1 ? 3 : 2; for (let k = 0; k < n; k++) { const z = bxZone(c, { x: c.px + (k - (n - 1) / 2) * 150 + rnd(-30, 30), y: c.py - 30 + rnd(-40, 40), r: 86, tel: .7, t: 7.5, kind: 'pull', k: 560, core: 17, dmg: Math.round(e.dmg * .5), col: '#8b5cf6', rim: '#ddd6fe', alpha: .2, glow: true }); z.fn = (zz, dt) => { zz.x += Math.sign(ecx(e) < zz.x ? -1 : 0) * 0; const P = G.P; zz.x += Math.sign(pcx(P) - zz.x) * 14 * dt; zz.y += Math.sign(pcy(P) - zz.y) * 8 * dt; }; yield .5; } yield 1; },
    *orbs(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 12, { speed: 150, r: 7, shape: 'orb', col: '#6d28d9', col2: '#ddd6fe', glow: '#a78bfa', off: k * .26, dm: .5, life: 3.4 }); yield .9; } },
    *devour(c) { yield .55; burst(c.cx, c.cy, 14, { col: ['#a78bfa', '#fff'], spd: 100, glow: true, life: .5 }); yield* bxDash(c, 560, .6); },
  },
});

bx('espelho', {
  n: 'Arquimago Espelhado', act: 3, w: 50, h: 72, hp: 16000, dmg: 60, def: 12, spd: 150, coin: [270, 390], fly: 1, sword: 's098', rec: 'mithril_bar:8,e_light:5,quartz:20',
  mech: 'com o escudo de vidro ligado, devolve todo projétil que você disparar; só golpes de perto o atingem.',
  shot: 'shard', loco: ['hover', { h: -120, sx: 120, spd: 150 }], kit: [['shards', 'images'], ['shards', 'blink', 'images'], ['images', 'blink', 'shards', 'blink']], cds: [1.3, 1.0, .8], bob: 3,
  init(c) { c.S.shield = true; c.S.tm = 4; },
  passive(c) { c.S.tm -= c.dt; if (c.S.tm <= 0) { c.S.shield = !c.S.shield; c.S.tm = c.S.shield ? 4.4 : 3.6; ringFx(c.cx, c.cy, 50, '#cbd5e1', .4, 3); sfx('portal', .3); } },
  hurt(c, e, dmg, h) {
    if (!c || !c.S.shield) return dmg; if (h.proj && h.src === 'proj') { const p = h.proj; p.friendly = false; p.vx *= -1; p.vy *= -1; p.dmg = Math.round(e.dmg * .35); p.hm = new Map(); p.hits = 0; p.pierce = 1; p.life = Math.max(p.life, 1.5); burst(p.x, p.y, 6, { col: ['#e2e8f0', '#fff'], spd: 90, life: .3, glow: true }); addText(ecx(e), e.y - 6, 'Refletiu!', '#cbd5e1', 12, .7); return 0; } return dmg * .8;
  },
  over(g, e, H) { const c = e.ai.x; if (c && c.S.shield) bxDisc(g, H.cx, H.cy, 38, '#cbd5e1', .12 + .05 * Math.sin(G.t * 8), '#ffffff'); },
  moves: {
    *shards(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .22, { speed: 310, r: 6, shape: 'shard', col: '#e2e8f0', col2: '#fff', dm: .55, life: 3 }); yield .6; } },
    *blink(c) { burst(c.cx, c.cy, 12, { col: ['#e2e8f0', '#fff'], spd: 100, glow: true, life: .5 }); yield .3; bxTp(c, c.px + (Math.random() < .5 ? -1 : 1) * 150, c.py - 60); yield .3; bxFan(c, 7, .2, { speed: 280, r: 6, shape: 'shard', col: '#e2e8f0', col2: '#fff', dm: .5, life: 3 }); yield .7; },
    *images(c, e) {
      c.free = true; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + rnd(.5); bxMin(c, { x: c.cx + Math.cos(a) * 110, y: c.cy + Math.sin(a) * 70 - 10, w: 24, h: 24, hp: 90, look: 'mirror', col: '#7dd3fc', dm: .3, life: 9, mf: (q, dt) => { q.t = (q.t || 0) + dt; steerFly(q, q.owner.ai.x ? ecx(q.owner) + Math.cos(q.t * 1.1 + k * 2.1) * 110 : ecx(q), ecy(q.owner) + Math.sin(q.t * 1.1 + k * 2.1) * 70 - 10, 120, 2, dt); q.sh = (q.sh === undefined ? 1.2 + k * .4 : q.sh) - dt; if (q.sh <= 0) { q.sh = 2.6; bxBeam({ e: q.owner, d: q.owner.d.bx }, { x: ecx(q), y: ecy(q), aim: true, ang: 0, len: 520, w: 5, tel: .9, t: 1.3, dmg: Math.round(q.owner.dmg * .5), col: '#7dd3fc', col2: '#fff', owner: q }); } } }); }
      yield 1.6;
    },
  },
});

bx('obelisco', {
  n: 'Obelisco Pulsante', act: 3, w: 56, h: 100, hp: 18000, dmg: 40, def: 16, spd: 40, coin: [280, 400], sword: 's066', rec: 'obsidian:20,celestial_frag:6,e_shadow:4', cond: { layer: 'deep' },
  mech: 'quatro pilares o protegem (dano quase nulo); destrua todos para deixá-lo vulnerável por 14 segundos, até eles renascerem.',
  still: true, shot: 'orb', loco: ['still'], kit: [['pulse', 'rune'], ['pulse', 'rune', 'shards'], ['rune', 'pulse', 'shards', 'rune']], cds: [1.5, 1.2, .95],
  init(c, e) { c.S.py = []; c.S.expose = 0; c.S.spawn = true; },
  hurt(c, e, dmg) { return c ? (c.S.py.some(p => !p.dead) ? dmg * .1 : dmg) : dmg; },
  passive(c, e) {
    const alive = c.S.py.filter(p => !p.dead).length;
    if (c.S.spawn) { c.S.spawn = false; for (let k = 0; k < 4; k++) { const x = c.cx + (k - 1.5) * 150, gy = groundY(x, c.cy, 40), p = bxMin(c, { x, y: (gy > 0 ? gy : c.cy) - 24, w: 26, h: 46, hp: 800, look: 'pylon', col: '#f472b6', fly: 0, dm: .3, name: 'Pilar', onDie: () => { burst(x, c.cy, 14, { col: ['#f472b6', '#fff'], spd: 140, g: 200, life: .6, glow: true }); sfx('boom', .4); }, mf: (q, dt) => { q.vx = 0; q.sh = (q.sh === undefined ? 1 + k * .6 : q.sh) - dt; if (q.sh <= 0) { q.sh = 3.2; bxBeam({ e: q.owner, d: q.owner.d.bx }, { x: ecx(q), y: ecy(q) - 10, aim: true, ang: 0, len: 520, w: 5, tel: 1, t: 1.4, dmg: Math.round(q.owner.dmg * .8), col: '#f472b6', col2: '#fff', owner: q }); } } }); c.S.py.push(p); } }
    if (c.S.py.length && alive === 0 && c.S.expose <= 0) { c.S.expose = 14; toast('O Obelisco está exposto!', '#f472b6'); }
    if (c.S.expose > 0) { c.S.expose -= c.dt; if (c.S.expose <= 0) { c.S.py.length = 0; c.S.spawn = true; toast('Os pilares renasceram!', '#f472b6'); } }
    for (const p of c.S.py) if (!p.dead && Math.random() < c.dt * 5) addPart({ x: ecx(p) + (ecx(e) - ecx(p)) * Math.random(), y: ecy(p) + (ecy(e) - ecy(p)) * Math.random(), vx: 0, vy: -10, life: .3, size: 2, col: '#f9a8d4', glow: true });
  },
  moves: {
    *pulse(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 14, { speed: 160, r: 6, shape: 'orb', col: '#f472b6', col2: '#fff', off: k * .22, dm: .4, life: 3.4 }); yield .9; } },
    *rune(c) { for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-170, 170), { w: 26, h: 300, tel: .85, col: '#f472b6' }); yield .3; } yield .9; },
    *shards(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .2, { speed: 300, r: 6, shape: 'shard', col: '#f472b6', col2: '#fff', dm: .5, life: 3 }); yield .6; } },
  },
});

bx('coveiro', {
  n: 'Coveiro Eterno', act: 3, w: 58, h: 84, hp: 15500, dmg: 58, def: 12, spd: 76, coin: [260, 380], sword: 's069', rec: 'bone:60,e_shadow:5,e_blood:4,hell_bar:6', cond: { night: 1 },
  mech: 'seus fantasmas amaldiçoam: quem for atingido não consegue se curar por sete segundos. Lápides soltam mais fantasmas.',
  shot: 'orb', loco: ['walk', { spd: 72, jump: 440 }], kit: [['ghosts', 'shovel'], ['ghosts', 'graves', 'shovel'], ['graves', 'dig', 'ghosts', 'shovel']], cds: [1.3, 1.0, .8],
  moves: {
    *ghosts(c) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { speed: 190, spread: (k - 1) * .4, r: 7, shape: 'orb', col: '#a7f3d0', col2: '#ecfdf5', homing: true, steer: 1, dm: .5, life: 4, trail: '#a7f3d0' }); p.onHit = () => bxBuff('curse', 7); yield .6; } },
    *shovel(c) { c.free = true; yield .35; const p = bxShot(c, { y: c.cy - 20, speed: 330, r: 10, shape: 'blade', col: '#94a3b8', col2: '#e2e8f0', dm: .8, life: 3, spin: 12, noAim: true }); bxBack(c, p, .9, 330); yield 1.4; },
    *graves(c, e) {
      c.free = true; for (let k = 0; k < 3; k++) { if (bxMinCount(c, 'grave') >= 3) break; const x = c.px + (k - 1) * 120 + rnd(-30, 30), gy = groundY(x, c.py, 40); bxMin(c, { x, y: (gy > 0 ? gy : c.py) - 18, w: 22, h: 34, hp: 140, look: 'pylon', col: '#a7f3d0', fly: 0, dm: .2, name: 'Lápide', tag: 'grave', life: 14, onDie: (q) => burst(ecx(q), ecy(q), 12, { col: ['#a7f3d0', '#fff'], spd: 100, g: 200, life: .5, glow: true }), mf: (q, dt) => { q.vx = 0; q.sh = (q.sh === undefined ? 1.5 : q.sh) - dt; if (q.sh <= 0) { q.sh = 2.4; const pp = bxShot({ e: q.owner, d: q.owner.d.bx, cx: ecx(q), cy: ecy(q) - 10, px: pcx(G.P), py: pcy(G.P) }, { speed: 170, r: 7, shape: 'orb', col: '#a7f3d0', col2: '#ecfdf5', homing: true, steer: 1, dm: .45, life: 4, trail: '#a7f3d0' }); pp.onHit = () => bxBuff('curse', 7); } } }); yield .5; }
      yield .8;
    },
    *dig(c) { for (let k = 0; k < 5; k++) { bxCol(c, c.px + (k - 2) * 52, { w: 30, h: 70, tel: .7, col: '#a7f3d0' }); yield .2; } yield .9; },
  },
});

bx('quimera', {
  n: 'Quimera', act: 3, w: 80, h: 64, hp: 21000, dmg: 70, def: 15, spd: 100, coin: [300, 430], sword: 's062', rec: 'hell_bar:10,e_fire:4,e_poison:4,celestial_frag:4',
  mech: 'muda de forma a cada 9 segundos: leão (saltos), bode (investida e fogo) e serpente (chicote e veneno), cada uma com golpes próprios.',
  shot: 'fire', loco: ['walk', { spd: 92, jump: 470 }], cds: [1.1, .9, .7],
  init(c) { c.S.form = 0; c.S.tm = 9; },
  passive(c, e) { c.S.tm -= c.dt; if (c.S.tm <= 0 && !c.g) { c.S.tm = 9; c.S.form = (c.S.form + 1) % 3; addText(c.cx, e.y - 14, ['Leão', 'Bode', 'Serpente'][c.S.form], '#f43f5e', 14, 1.4); ringFx(c.cx, c.cy, 60, '#f43f5e', .5, 3); sfx('boss', .4); } if (c.S.form === 0) c.sm *= 1.25; },
  hurt(c, e, dmg) { return c && c.S.form === 1 ? dmg * .75 : dmg; },
  variant: (e, c) => c ? c.S.form : 0,
  pick(c) { const L = [['pounce', 'roar'], ['ram', 'flame'], ['whip', 'spit']][c.S.form]; return L[c.i++ % 2]; },
  moves: {
    *pounce(c, e) { bxTele(c, { x: c.px, y: c.py + 10, r: 40, tel: .7, col: '#f43f5e' }); yield .6; if (e.onGround) { e.vy = -620; e.vx = Math.sign(c.dx) * Math.min(300, Math.abs(c.dx) * 1.3); } yield .5; let t = 0; while (!e.onGround && t < 2) { t += c.dt; yield; } bxBoom(c, c.cx, c.cy + 20, 62, { tel: .08 }); bxWave(c, 1, { col: '#f43f5e' }); bxWave(c, -1, { col: '#f43f5e' }); shake(6); yield .7; },
    *roar(c) { c.free = true; sfx('boss', .5); bxRing(c, 14, { speed: 170, r: 6, shape: 'orb', col: '#f43f5e', col2: '#fecdd3', dm: .45, life: 3 }); yield 1; },
    *ram(c, e) { const dir = Math.sign(c.dx) || 1; bxTele(c, { x: dir > 0 ? c.cx : c.cx - 360, y: e.y + 12, w: 360, h: e.h - 12, tel: .8, col: '#f43f5e' }); yield .85; yield* bxHold(c, .9, () => { e.vx = dir * 430 * c.sm; }); bxWave(c, dir, { col: '#f43f5e', hh: 14 }); shake(5); yield .8; },
    *flame(c) { c.free = true; for (let k = 0; k < 2; k++) { bxFan(c, 5, .2, { speed: 300, r: 7, shape: 'fire', dm: .5, life: 2.4 }); yield .7; } },
    *whip(c, e) { c.free = true; const base = Math.atan2(c.dy, c.dx); for (let k = 0; k < 9; k++) { bxShot(c, { x: c.cx - Math.sign(c.dx) * 40, y: c.cy - 10, ang: base - .7 + k * .17, speed: 330, r: 6, shape: 'orb', col: '#84cc16', col2: '#ecfccb', dm: .5, life: 1.8 }); yield .07; } yield .6; },
    *spit(c, e) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { x: c.cx - Math.sign(c.dx) * 40, y: c.cy - 10, speed: 260, spread: rnd(-.25, .25) - .25, r: 8, shape: 'orb', col: '#a3e635', col2: '#ecfccb', kind: 'ballistic', grav: 540, dm: .5, life: 3.4 }); p.onDie = (q, why) => { if (why !== 'life') bxZone(c, { x: q.x, y: q.y, r: 26, kind: 'poison', t: 4, dmg: Math.round(e.dmg * .12), tick: .5, col: '#84cc16', alpha: .25 }); }; yield .55; } },
  },
});
