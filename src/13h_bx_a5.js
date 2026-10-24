/* ============================================================
   13h_bx_a5: chefes novos do Ato V · Além do Firmamento (20) — Tier 9
   Cada um guarda UMA das espadas 161–180: essas espadas não são forjadas, caem do chefe.
   Motor em 13c_bossx.js; arte em 05k_bxart5.js. Mecânica única por chefe (nada repetido dos Atos I–IV).
   ============================================================ */
// querubim do coro (Ato V · 7)
function bxCherub(c) {
  return bxMin(c, { x: c.cx + rnd(-70, 70), y: c.cy - 20, look: 'bell', w: 16, h: 18, hp: 900, fly: 1, tag: 'ch', name: 'Querubim', col: '#fda4af', dm: .3,
    mf: (s) => { const a = G.t * 1.2 + s.y * .02; s.vx = Math.cos(a) * 70; s.vy = Math.sin(a) * 44 - 16; } });
}

// ---- 161. Serafim da Balança: o veredito que só se anula atacando ----
bx('serafim', {
  n: 'Serafim da Balança', act: 5, w: 74, h: 86, hp: 46000, dmg: 126, def: 26, spd: 150, coin: [900, 1300], fly: 1, sword: 's161', rec: 'celestial_bar:8,e_light:10,e_time:2',
  mech: 'marca você com o veredito CULPADO: se você acertar o chefe antes do selo fechar, a sentença é anulada — se não, um pilar de luz desce sobre você.',
  shot: 'orb', loco: ['hover', { h: -140, sx: 130, spd: 150 }], kit: [['feathers', 'pierce'], ['feathers', 'judge'], ['judge', 'pierce', 'feathers', 'judge']], cds: [1.35, 1.05, .8], bob: 3,
  init(c) { c.S.t = 4.5; c.S.j = null; },
  passive(c, e) {
    if (c.S.j) return; c.S.t -= c.dt; if (c.S.t > 0) return;
    c.S.t = c.ph > 2 ? 5 : 7;
    const z = bxTele(c, { follow: G.P, x: 0, y: 0, r: 38, tel: 3.2, col: '#fde68a' });
    z.onEnd = () => {
      c.S.j = null;
      if (z.ok) { addText(pcx(G.P), G.P.y - 30, 'INOCENTE', '#86efac', 14, 1.2); ringFx(pcx(G.P), pcy(G.P), 54, '#86efac', .4, 3); sfx('heal', .4); }
      else { addText(pcx(G.P), G.P.y - 30, 'CULPADO', '#fbbf24', 14, 1.2); bxCol(c, pcx(G.P), { w: 56, h: 420, tel: .3, dm: 1.15, col: '#fde68a' }); shake(5); }
    };
    c.S.j = z; addText(c.cx, e.y - 24, 'JULGAMENTO', '#fde68a', 14, 1.3); sfx('boss', .4);
  },
  after(c) { if (c && c.S.j) c.S.j.ok = true; },
  moves: {
    *feathers(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .17, { speed: 300, r: 7, shape: 'blade', col: '#fde68a', col2: '#fff', dm: .5, life: 3 }); yield .55; } },
    *pierce(c) { c.free = true; yield .25; bxBeam(c, { follow: true, aim: true, ang: 0, len: 400, w: 12, tel: .85, t: .5, dmg: Math.round(c.e.dmg * .8), col: '#fde68a', col2: '#ffffff' }); yield 1.5; },
    *judge(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px + (k - 1) * 64, { w: 34, h: 380, tel: .6, dm: .7, col: '#fde68a' }); } yield 1.1; },
  },
});

// ---- 162. Aurora do Amanhecer: dois raios gêmeos girando em sentidos opostos ----
bx('aurora', {
  n: 'Aurora do Amanhecer', act: 5, w: 84, h: 74, hp: 48000, dmg: 128, def: 25, spd: 165, coin: [900, 1350], fly: 1, sword: 's162', rec: 'celestial_bar:8,e_light:12,e_fire:4',
  mech: 'abre dois raios de aurora que varrem a arena girando em sentidos opostos: o vão entre eles é o único lugar seguro.',
  shot: 'fire', loco: ['orbit', { r: 250, h: -150, spd: 165, w: .6 }], kit: [['beams'], ['beams', 'wings'], ['wings', 'beams', 'rays']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *beams(c) {
      c.free = true; const dm = Math.round(c.e.dmg * .7);
      bxBeam(c, { x: c.cx, y: c.cy - 20, ang: .4, spin: .8, len: 620, w: 10, tel: .8, t: 5.6, dmg: dm, col: '#fbbf24', col2: '#fff7c2' });
      bxBeam(c, { x: c.cx, y: c.cy - 20, ang: PI + .4, spin: -.8, len: 620, w: 10, tel: .8, t: 5.6, dmg: dm, col: '#fb923c', col2: '#ffedd5' });
      yield 6;
    },
    *wings(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 7, .13, { speed: 260, r: 7, shape: 'feather', col: '#fbbf24', col2: '#fff7c2', dm: .45, life: 3, spin: 5 }); yield .6; } },
    *rays(c) { c.free = true; for (let k = 0; k < 6; k++) { bxCol(c, c.px + rnd(-180, 180), { w: 28, h: 380, tel: .75, dm: .65, col: '#fbbf24' }); yield .3; } yield .9; },
  },
});

// ---- 163. Lei do Silêncio: dentro do círculo a espada é selada em pulsos ----
bx('silencio', {
  n: 'Lei do Silêncio', act: 5, w: 62, h: 84, hp: 44000, dmg: 124, def: 24, spd: 120, coin: [880, 1250], sword: 's163', rec: 'celestial_bar:8,e_shadow:10,e_time:3',
  mech: 'o sino do silêncio: dentro do círculo dele a sua espada é selada por 1,1 s e liberada por 1,1 s; fora do círculo ele quase não sente os golpes.',
  shot: 'orb', loco: ['walk', { spd: 74, jump: 460 }], kit: [['bell', 'wave'], ['bell', 'seal', 'wave'], ['seal', 'bell', 'wave', 'bell']], cds: [1.3, 1, .78],
  init(c) { c.S.s = 2.2; c.S.open = false; },
  passive(c, e) {
    c.S.s -= c.dt;
    if (c.S.s <= 0) { c.S.s = 2.2; c.S.open = !c.S.open; ringFx(c.cx, c.cy, 170, '#c4b5fd', .4, 1); sfx('tick', .5); }
    const d = Math.hypot(c.dx, c.dy);
    if (d < 175 && !c.S.open) bxBuff('silence', .4);
  },
  hurt(c, e, dmg) { return c && Math.hypot(c.dx, c.dy) > 175 ? dmg * .12 : dmg; },
  moves: {
    *bell(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 12, { speed: 200, r: 8, shape: 'orb', col: '#c4b5fd', col2: '#ede9fe', dm: .5, life: 3, off: k * .26 }); yield .8; } },
    *seal(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px + rnd(-140, 140), { w: 30, h: 360, tel: .9, dm: .7, col: '#c4b5fd', buff: 'stun', bt: .6 }); yield .3; } yield 1; },
    *wave(c) { c.free = true; yield .4; bxWave(c, 1, { col: '#c4b5fd', hh: 12 }); bxWave(c, -1, { col: '#c4b5fd', hh: 12 }); yield 1; },
  },
});

// ---- 164. Cetro do Sol Nascente: a gema sobe (imune) e desce (exposta) ----
bx('cetro', {
  n: 'Cetro do Sol Nascente', act: 5, w: 66, h: 96, hp: 50000, dmg: 132, def: 27, spd: 130, coin: [950, 1400], fly: 1, sword: 's164', rec: 'celestial_bar:9,e_fire:10,e_light:8',
  mech: 'a gema do cetro sobe e desce: no alto ele fica quase imune e chove fogo; quando ela desce, ele fica exposto por 3 s.',
  shot: 'fire', loco: ['float', { r: 150, h: -110, spd: 130 }], kit: [['rain', 'flare'], ['rain', 'flare', 'orbit'], ['flare', 'orbit', 'rain', 'flare']], cds: [1.3, 1, .78], bob: 2,
  init(c) { c.S.up = true; c.S.t = 4; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.up = !c.S.up; c.S.t = c.S.up ? 3.4 : 4.6; addText(c.cx, e.y - 20, c.S.up ? 'A gema sobe' : 'A gema desce', '#f59e0b', 13, 1); ringFx(c.cx, c.cy, c.S.up ? 80 : 40, '#f59e0b', .4, 2); sfx('portal', .4); }
    if (c.S.up) { c.S.r = (c.S.r || 0) - c.dt; if (c.S.r <= 0) { c.S.r = 1.1; bxRain(c, 1, { speed: 320, r: 10, shape: 'fire', col: '#fb923c', col2: '#fde68a', dm: .45, life: 4, spread: 200 }); } }
  },
  hurt(c, e, dmg) { return c && c.S.up ? dmg * .04 : dmg; },
  moves: {
    *rain(c) { c.free = true; for (let k = 0; k < 4; k++) { bxRain(c, 2, { speed: 330, r: 10, shape: 'fire', col: '#fb923c', col2: '#fde68a', dm: .5, life: 4, spread: 220 }); yield .5; } },
    *flare(c) { c.free = true; bxRing(c, 16, { speed: 230, r: 8, shape: 'orb', col: '#f59e0b', col2: '#fef3c7', glow: '#fbbf24', dm: .5, life: 3 }); yield 1; },
    *orbit(c) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { y: c.cy - 40, speed: 250, r: 9, shape: 'orb', col: '#fbbf24', col2: '#fff7c2', dm: .55, life: 3.4, spin: 8 }); bxBack(c, p, .9, 280); yield .8; } yield .8; },
  },
});

// ---- 165. Arqueiro da Constelação: estrelas acendem em sequência e viram lança ----
bx('constelacao', {
  n: 'Arqueiro da Constelação', act: 5, w: 70, h: 78, hp: 47000, dmg: 130, def: 25, spd: 170, coin: [920, 1350], fly: 1, sword: 's165', rec: 'celestial_bar:8,e_light:8,e_lightning:6',
  mech: 'acende estrelas no chão em sequência; quando a última acende, uma lança de luz atravessa todas de uma vez.',
  shot: 'orb', loco: ['hover', { h: -160, sx: 150, spd: 170 }], kit: [['stars', 'shot'], ['stars', 'shot', 'rain'], ['rain', 'stars', 'shot', 'stars']], cds: [1.35, 1.05, .8], bob: 3,
  moves: {
    *stars(c) {
      c.free = true; const n = 6, x0 = c.px - 150, y = c.py - 10;
      for (let i = 0; i < n; i++) {
        bxZone(c, { x: x0 + i * 60 - 12, y: y - 150, w: 24, h: 150, tel: .45 + i * .2, kind: 'dmg', dmg: Math.round(c.e.dmg * .45), col: '#a5b4fc', flash: .2 });
        yield .2;
      }
      yield .6;
      bxBeam(c, { x: x0 - 50, y: y - 60, ang: 0, len: 460, w: 11, tel: .2, t: .6, dmg: Math.round(c.e.dmg * .85), col: '#a5b4fc', col2: '#eef2ff' });
      shake(4); yield 1;
    },
    *shot(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 3, .18, { speed: 420, r: 6, shape: 'blade', col: '#c7d2fe', col2: '#fff', dm: .5, life: 2.4, trail: '#a5b4fc' }); yield .45; } },
    *rain(c) { c.free = true; bxRain(c, 7, { speed: 400, r: 6, shape: 'star', col: '#c7d2fe', col2: '#fff', dm: .45, life: 3.5, spread: 240 }); yield 1.2; },
  },
});

// ---- 166. Veredito Celeste: martelo que marca a sua sombra ----
bx('veredito', {
  n: 'Veredito Celeste', act: 5, w: 84, h: 96, hp: 54000, dmg: 136, def: 29, spd: 96, coin: [980, 1450], sword: 's166', rec: 'celestial_bar:10,e_light:10,e_earth:8',
  mech: 'o martelo marca a sua sombra no chão e a sombra cresce a cada golpe; quem estiver dentro dela é esmagado.',
  shot: 'rock', loco: ['walk', { spd: 88, jump: 430 }], kit: [['gavel', 'swords'], ['gavel', 'waves', 'swords'], ['waves', 'gavel', 'swords', 'gavel']], cds: [1.4, 1.1, .85],
  moves: {
    *gavel(c) {
      const z = bxTele(c, { follow: G.P, x: 0, y: 0, r: 28, r1: c.ph > 1 ? 78 : 62, grow: 1.3, tel: 1.3, col: '#fbbf24' });
      yield 1.35; const x = z.x, y = z.y;
      bxBoom(c, x, y, 74, { tel: .05, dm: 1, col: '#fbbf24' }); bxWave(c, 1, { col: '#fbbf24' }); bxWave(c, -1, { col: '#fbbf24' }); shake(7); sfx('boom', .6);
      yield 1.1;
    },
    *waves(c) { yield .3; bxWave(c, 1, { col: '#fbbf24', hh: 12 }); yield .5; bxWave(c, -1, { col: '#fbbf24', hh: 12 }); yield .8; },
    *swords(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-180, 180), { w: 26, h: 380, tel: .8, dm: .7, col: '#fde68a' }); yield .32; } yield .9; },
  },
});

// ---- 167. Coro dos Querubins: três cantores sustentam a guarda ----
bx('querubins', {
  n: 'Coro dos Querubins', act: 5, w: 76, h: 70, hp: 46000, dmg: 124, def: 24, spd: 140, coin: [900, 1300], fly: 1, sword: 's167', rec: 'celestial_bar:8,e_light:10,e_blood:4',
  mech: 'três querubins cantam em rodízio: enquanto o coro está completo ele quase não leva dano — mate um cantor para abrir a guarda.',
  shot: 'orb', loco: ['orbit', { r: 220, h: -140, spd: 140, w: .7 }], kit: [['notes', 'chord'], ['notes', 'chord', 'hymn'], ['hymn', 'chord', 'notes', 'chord']], cds: [1.3, 1, .8], bob: 4,
  init(c) { for (let k = 0; k < 3; k++) bxCherub(c); c.S.t = 9; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0 && bxMinCount(c, 'ch') < 3) { c.S.t = c.ph > 1 ? 6 : 9; bxCherub(c); addText(c.cx, e.y - 18, 'O coro se refaz', '#fda4af', 12, 1); ringFx(c.cx, c.cy, 70, '#fda4af', .4, 2); }
  },
  hurt(c, e, dmg) { return c && bxMinCount(c, 'ch') >= 3 ? dmg * .18 : dmg; },
  moves: {
    *notes(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 4, .22, { speed: 280, r: 7, shape: 'orb', col: '#fda4af', col2: '#fff1f2', dm: .5, life: 3, homing: k % 2 === 0, steer: 1 }); yield .55; } },
    *chord(c) { c.free = true; bxRing(c, 14, { speed: 210, r: 7, shape: 'orb', col: '#fb7185', col2: '#fff1f2', dm: .45, life: 3.2 }); yield 1.1; },
    *hymn(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + (k - 2) * 44, { w: 26, h: 360, tel: .5 + k * .09, dm: .6, col: '#fda4af' }); } yield 1.4; },
  },
});

// ---- 168. Domínio do Trovão: as bordas da arena se eletrificam e avançam ----
bx('trovao', {
  n: 'Domínio do Trovão', act: 5, w: 78, h: 96, hp: 52000, dmg: 134, def: 27, spd: 120, coin: [950, 1400], fly: 1, sword: 's168', rec: 'celestial_bar:9,e_lightning:14,e_ice:4',
  mech: 'carrega as bordas da arena: colunas elétricas avançam dos dois lados para o centro e só recuam quando ele leva um golpe.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 110, spd: 120 }], kit: [['bolts', 'storm'], ['bolts', 'storm', 'trident'], ['trident', 'storm', 'bolts', 'storm']], cds: [1.3, 1.05, .8], bob: 3,
  init(c, e) {
    c.S.ew = 50;
    c.S.L = bxZone(c, { x: e.x - 620, y: e.y - 300, w: 50, h: 640, tel: 0, t: 1e9, kind: 'fire', dmg: Math.round(c.e.dmg * .5), tick: .55, col: '#67e8f9', flash: .2, keep: true });
    c.S.R = bxZone(c, { x: e.x + 620, y: e.y - 300, w: 50, h: 640, tel: 0, t: 1e9, kind: 'fire', dmg: Math.round(c.e.dmg * .5), tick: .55, col: '#67e8f9', flash: .2, keep: true });
  },
  passive(c, e) {
    if (!c.S.L || !c.S.R) return;
    const k = c.ph > 2 ? 26 : c.ph > 1 ? 19 : 13;
    c.S.ew = Math.min(300, c.S.ew + k * c.dt);
    const p = pcx(G.P);
    c.S.L.w = c.S.ew; c.S.L.x = p - 620; c.S.L.y = pcy(G.P) - 320; c.S.L.h = 640;
    c.S.R.w = c.S.ew; c.S.R.x = p + 620 - c.S.ew; c.S.R.y = pcy(G.P) - 320; c.S.R.h = 640;
  },
  hurt(c, e, dmg) { if (c && c.S.ew) c.S.ew = Math.max(40, c.S.ew - 16); return dmg; },
  moves: {
    *bolts(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 24, h: 380, tel: .55, dm: .65, col: '#67e8f9' }); yield .22; } yield .9; },
    *storm(c) { c.free = true; bxRing(c, 18, { speed: 240, r: 7, shape: 'orb', col: '#67e8f9', col2: '#ecfeff', glow: '#22d3ee', dm: .45, life: 3 }); yield 1.2; },
    *trident(c) { c.free = true; yield .3; for (let k = -1; k <= 1; k++) bxBeam(c, { follow: true, ang: Math.atan2(c.dy, c.dx) + k * .26, len: 460, w: 9, tel: .7, t: .5, dmg: Math.round(c.e.dmg * .7), col: '#67e8f9', col2: '#ecfeff' }); yield 1.6; },
  },
});

// ---- 169. Dragão da Aurora: o rastro de ouro endurece atrás dele ----
bx('aurora_dourada', {
  n: 'Dragão da Aurora', act: 5, w: 96, h: 62, hp: 50000, dmg: 130, def: 26, spd: 210, coin: [940, 1400], fly: 1, sword: 's169', rec: 'celestial_bar:9,e_light:8,e_fire:8',
  mech: 'voa deixando um rastro de ouro que endurece atrás dele: o corredor aperta a cada passada.',
  shot: 'fire', loco: ['orbit', { r: 200, h: -120, spd: 210, w: 1.1 }], kit: [['breath', 'coil'], ['breath', 'coil', 'sweep'], ['sweep', 'coil', 'breath', 'coil']], cds: [1.2, .95, .75], bob: 3,
  passive(c, e) {
    c.S.d = (c.S.d || 0) - c.dt;
    if (c.S.d <= 0) { c.S.d = .26; bxZone(c, { x: c.cx - 14, y: c.cy - 14, r: 15, tel: .12, t: 6, kind: 'fire', dmg: Math.round(c.e.dmg * .28), tick: .7, col: '#f59e0b', flash: .15 }); }
  },
  moves: {
    *breath(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 6, .16, { speed: 300, r: 8, shape: 'fire', col: '#f59e0b', col2: '#fef3c7', dm: .5, life: 2.6 }); yield .5; } },
    *coil(c) { c.free = true; yield .3; yield* bxDash(c, 620, .7); bxBoom(c, c.cx, c.cy, 58, { tel: .1, dm: .6 }); yield .8; },
    *sweep(c) { c.free = true; bxBeam(c, { x: c.cx, y: c.cy, ang: -1.2, spin: 1.1, len: 520, w: 10, tel: .6, t: 3.4, dmg: Math.round(c.e.dmg * .6), col: '#f59e0b', col2: '#fef3c7' }); yield 3.8; },
  },
});

// ---- 170. Cálice da Eternidade: cada golpe enche a taça; transbordar cura ----
bx('calice', {
  n: 'Cálice da Eternidade', act: 5, w: 80, h: 96, hp: 56000, dmg: 132, def: 28, spd: 90, coin: [980, 1450], sword: 's170', rec: 'celestial_bar:10,e_water:10,e_light:8',
  mech: 'cada golpe enche a taça; quando transborda, ele se cura e despeja uma onda de luz — é preciso parar de bater antes do transbordamento.',
  shot: 'orb', loco: ['float', { r: 140, h: -80, spd: 90 }], kit: [['spill', 'pour'], ['spill', 'pour', 'drops'], ['drops', 'pour', 'spill', 'pour']], cds: [1.4, 1.1, .85], bob: 2,
  init(c) { c.S.fill = 0; },
  after(c, e, dmg) {
    if (!c) return; c.S.fill += dmg;
    if (c.S.fill > e.hpMax * .15) {
      c.S.fill = 0; bxHeal(e, .05);
      ringFx(c.cx, c.cy, 170, '#fde68a', .5, 4); bxRing(c, 16, { speed: 210, r: 8, shape: 'orb', col: '#fde68a', col2: '#fffbeb', dm: .55, life: 3 });
      addText(c.cx, e.y - 22, 'Transbordou!', '#fde68a', 14, 1.3); sfx('heal', .6);
    }
  },
  moves: {
    *spill(c) { c.free = true; for (let k = 0; k < 3; k++) { bxRing(c, 10, { speed: 190, r: 8, shape: 'orb', col: '#fde68a', col2: '#fffbeb', dm: .45, life: 3, off: k * .3 }); yield .7; } },
    *pour(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-190, 190), { w: 30, h: 380, tel: .8, dm: .7, col: '#fde68a' }); yield .3; } yield .9; },
    *drops(c) { c.free = true; bxRain(c, 8, { speed: 300, r: 7, shape: 'orb', col: '#fbbf24', col2: '#fff7c2', dm: .45, life: 3.6, spread: 230 }); yield 1.1; },
  },
});

// ---- 171. Coroa da Criação: cada 20% de vida perdida nasce uma mão ----
bx('coroa', {
  n: 'Coroa da Criação', act: 5, w: 86, h: 78, hp: 52000, dmg: 128, def: 25, spd: 160, coin: [950, 1400], fly: 1, sword: 's171', rec: 'celestial_bar:9,e_light:10,e_earth:6',
  mech: 'cria servos com o seu próprio dano: a cada 20% de vida perdida nasce uma mão de luz que persegue você.',
  shot: 'orb', loco: ['orbit', { r: 230, h: -160, spd: 160, w: .8 }], kit: [['sparks', 'grasp'], ['sparks', 'grasp', 'ring'], ['ring', 'grasp', 'sparks', 'grasp']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.n = 0; },
  passive(c, e) {
    const n = Math.floor((1 - e.hp / e.hpMax) * 5);
    if (n > c.S.n) {
      c.S.n = n;
      bxMin(c, { x: c.cx + rnd(-40, 40), y: c.cy, look: 'pylon', w: 18, h: 24, hp: 1200, fly: 1, tag: 'hand', name: 'Mão da Criação', col: '#fde68a', dm: .3,
        mf: (s) => { const a = Math.atan2(pcy(G.P) - ecy(s), pcx(G.P) - ecx(s)); s.vx = Math.cos(a) * 90; s.vy = Math.sin(a) * 90; } });
      addText(c.cx, e.y - 18, 'Uma mão nasce', '#fde68a', 12, 1); ringFx(c.cx, c.cy, 60, '#fde68a', .4, 2);
    }
  },
  moves: {
    *sparks(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .18, { speed: 300, r: 7, shape: 'star', col: '#fde68a', col2: '#fffbeb', dm: .5, life: 3 }); yield .55; } },
    *grasp(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px + (k - 1) * 60, { w: 30, h: 340, tel: .7, dm: .65, col: '#fde68a', buff: 'slow', bt: 1.4, bd: { mult: .5 } }); } yield 1.2; },
    *ring(c) { c.free = true; bxRing(c, 16, { speed: 220, r: 7, shape: 'orb', col: '#fbbf24', col2: '#fffbeb', dm: .45, life: 3 }); yield 1.2; },
  },
});

// ---- 172. Selo do Juízo Final: sete selos absorvem os golpes ----
bx('selo', {
  n: 'Selo do Juízo Final', act: 5, w: 78, h: 78, hp: 58000, dmg: 136, def: 28, spd: 130, coin: [1000, 1500], fly: 1, sword: 's172', rec: 'celestial_bar:10,e_shadow:10,e_blood:8',
  mech: 'sete selos giram em volta dele e absorvem um golpe cada; romper os sete abre uma janela de 5 s — depois os selos voltam.',
  shot: 'orb', loco: ['hover', { h: -140, sx: 120, spd: 130 }], kit: [['paper', 'seals'], ['paper', 'seals', 'stamp'], ['stamp', 'seals', 'paper', 'stamp']], cds: [1.35, 1.05, .8], bob: 3,
  init(c) { c.S.seals = 7; c.S.open = 0; },
  hurt(c, e, dmg) {
    if (!c) return dmg;
    if (c.S.seals > 0) {
      c.S.seals--; ringFx(c.cx, c.cy, 64, '#f87171', .3, 2);
      if (c.S.seals === 0) { c.S.open = 5; addText(c.cx, e.y - 24, 'SELOS ROMPIDOS!', '#fef08a', 15, 1.4); flash('#f87171', .2, .3); }
      return dmg * .1;
    }
    return dmg;
  },
  passive(c, e) {
    if (c.S.open > 0) { c.S.open -= c.dt; if (c.S.open <= 0) { c.S.seals = 7; addText(c.cx, e.y - 20, 'Os selos voltam', '#f87171', 12, 1); } }
  },
  moves: {
    *paper(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 3, .3, { speed: 320, r: 8, shape: 'blade', col: '#f87171', col2: '#fee2e2', dm: .5, life: 2.6, spin: 7 }); yield .45; } },
    *seals(c) { c.free = true; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; bxShot(c, { ang: a, speed: 200, r: 9, shape: 'orb', col: '#f87171', col2: '#fee2e2', dm: .45, life: 4, homing: true, steer: 1 }); yield .16; } yield .8; },
    *stamp(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px + rnd(-160, 160), { w: 40, h: 360, tel: .9, dm: .75, col: '#f87171' }); yield .3; } yield 1; },
  },
});

// ---- 173. Lâmina do Tempo Zero: quando o ponteiro fecha a volta, zera seus efeitos ----
bx('tempo_zero', {
  n: 'Lâmina do Tempo Zero', act: 5, w: 72, h: 96, hp: 55000, dmg: 138, def: 27, spd: 150, coin: [980, 1450], fly: 1, sword: 's173', rec: 'celestial_bar:9,e_time:12,e_lightning:4',
  mech: 'zera o relógio: quando o ponteiro fecha a volta, todos os seus bônus e escudos somem e as lâminas paradas no ar voltam de uma vez.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 150, spd: 150 }], kit: [['hands', 'frozen'], ['hands', 'frozen', 'strike'], ['strike', 'frozen', 'hands', 'frozen']], cds: [1.3, 1, .78], bob: 3,
  init(c) { c.S.t = 10; c.S.shards = []; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0) {
      c.S.t = c.ph > 2 ? 8 : 11; const P = G.P;
      P.buffs = {}; addText(pcx(P), P.y - 34, 'TEMPO ZERADO', '#67e8f9', 15, 1.4);
      ringFx(pcx(P), pcy(P), 110, '#67e8f9', .5, 4); flash('#67e8f9', .18, .3); sfx('portal', .7);
    }
  },
  moves: {
    *hands(c) { c.free = true; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + c.t; bxShot(c, { ang: a, speed: 190, r: 9, shape: 'blade', col: '#67e8f9', col2: '#ecfeff', dm: .45, life: 4, spin: 9 }); yield .12; } yield .9; },
    *frozen(c) { c.free = true; bxRain(c, 6, { speed: 0, r: 9, shape: 'shard', col: '#a5f3fc', col2: '#ecfeff', dm: .5, life: 2.2, spread: 200, grav: 0 }); yield .9; bxRain(c, 6, { speed: 300, r: 9, shape: 'shard', col: '#a5f3fc', col2: '#ecfeff', dm: .5, life: 3, spread: 200 }); yield .8; },
    *strike(c) { c.free = true; yield .3; bxBeam(c, { follow: true, aim: true, ang: 0, len: 460, w: 11, tel: .7, t: .45, dmg: Math.round(c.e.dmg * .85), col: '#67e8f9', col2: '#ecfeff' }); yield 1.5; },
  },
});

// ---- 174. Arauto da Luz: a lanterna acesa mira; apagada, atira às cegas ----
bx('arauto_luz', {
  n: 'Arauto da Luz', act: 5, w: 66, h: 92, hp: 47000, dmg: 126, def: 25, spd: 150, coin: [900, 1350], fly: 1, sword: 's174', rec: 'celestial_bar:8,e_light:12,e_fire:6',
  mech: 'a lanterna acesa mira em você; acertá-lo seis vezes apaga a chama e ele atira às cegas por 4 s (mais tiros, sem mira).',
  shot: 'fire', loco: ['hover', { h: -150, sx: 130, spd: 155 }], kit: [['beam', 'volley'], ['beam', 'volley', 'lanterns'], ['lanterns', 'volley', 'beam', 'volley']], cds: [1.3, 1, .8], bob: 2,
  init(c) { c.S.lamp = 6; c.S.blind = 0; },
  hurt(c, e, dmg) {
    if (!c) return dmg;
    c.S.lamp--;
    if (c.S.lamp <= 0) { c.S.lamp = 6; c.S.blind = 4; addText(c.cx, e.y - 24, 'A chama apagou!', '#94a3b8', 14, 1.3); ringFx(c.cx, c.cy, 90, '#94a3b8', .4, 2); sfx('break', .5); }
    return dmg;
  },
  passive(c, e) { if (c.S.blind > 0) { c.S.blind -= c.dt; if (Math.random() < c.dt * 3) burst(c.cx + rnd(-20, 20), c.cy - 20, 2, { col: ['#475569', '#e2e8f0'], spd: 40, life: .5 }); } },
  moves: {
    *beam(c) { c.free = true; yield .25; bxBeam(c, { follow: true, aim: c.S.blind <= 0, ang: Math.random() * TAU, len: 420, w: 10, tel: .8, t: .5, dmg: Math.round(c.e.dmg * .8), col: '#fde047', col2: '#fefce8' }); yield 1.5; },
    *volley(c) {
      c.free = true; const blind = c.S.blind > 0;
      for (let k = 0; k < (blind ? 5 : 3); k++) {
        if (blind) bxRing(c, 9, { speed: 220, r: 7, shape: 'orb', col: '#fde047', col2: '#fefce8', dm: .45, life: 3, off: rnd(0, 6) });
        else bxFan(c, 3, .2, { speed: 320, r: 7, shape: 'orb', col: '#fde047', col2: '#fefce8', dm: .5, life: 3 });
        yield .5;
      }
    },
    *lanterns(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-190, 190), { w: 26, h: 360, tel: .85, dm: .7, col: '#fde047' }); yield .28; } yield .9; },
  },
});

// ---- 175. Sinfonia dos Céus: a pauta varre a tela; só as frestas são seguras ----
bx('sinfonia', {
  n: 'Sinfonia dos Céus', act: 5, w: 78, h: 76, hp: 49000, dmg: 127, def: 25, spd: 150, coin: [930, 1380], fly: 1, sword: 's175', rec: 'celestial_bar:9,e_light:8,e_time:4',
  mech: 'a pauta sobe: cinco linhas de música varrem a tela de baixo para cima e só as frestas entre elas são seguras.',
  shot: 'orb', loco: ['float', { r: 200, h: -150, spd: 150 }], kit: [['staves', 'notes'], ['staves', 'notes', 'chord'], ['chord', 'notes', 'staves', 'notes']], cds: [1.4, 1.1, .85], bob: 4,
  moves: {
    *staves(c) {
      c.free = true; const P = G.P, y0 = pcy(P) + 250;
      for (let i = 0; i < 5; i++) {
        const z = bxZone(c, { x: P.x - 460, y: y0 + i * 46, w: 920, h: 13, tel: .45 + i * .1, kind: 'fire', t: 6.2, dmg: Math.round(c.e.dmg * .16), tick: .4, col: '#f0abfc' });
        z.fn = (q, dt) => { q.y -= 74 * dt; };
      }
      yield 5.4;
    },
    *notes(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 3, .26, { speed: 300, r: 7, shape: 'orb', col: '#f0abfc', col2: '#fdf4ff', dm: .5, life: 3 }); yield .45; } },
    *chord(c) { c.free = true; bxRing(c, 16, { speed: 210, r: 7, shape: 'orb', col: '#e879f9', col2: '#fdf4ff', dm: .45, life: 3.2 }); yield 1.2; },
  },
});

// ---- 176. Fênix Imortal: morre para um ovo que precisa ser quebrado em 6 s ----
bx('fenix', {
  n: 'Fênix Imortal', act: 5, w: 88, h: 80, hp: 50000, dmg: 130, def: 26, spd: 200, coin: [950, 1400], fly: 1, sword: 's176', rec: 'celestial_bar:9,e_fire:12,e_light:6',
  mech: 'ao cair vira um ovo de cinzas por 6 s: se o ovo sobreviver, ela renasce com mais vida — quebre o ovo para acabar com ela de vez.',
  shot: 'fire', loco: ['orbit', { r: 230, h: -130, spd: 200, w: .9 }], kit: [['dive', 'feathers'], ['dive', 'feathers', 'nova'], ['nova', 'feathers', 'dive', 'feathers']], cds: [1.2, .95, .75], bob: 3,
  init(c) { c.S.egg = 0; c.S.reborn = 0; c.S.eggT = 0; },
  lethal(c, e) {
    if (!c || c.S.reborn) return false;
    if (!c.S.egg) {
      c.S.egg = 1; c.S.eggT = 6; e.hp = e.hpMax * .12; e.invulnerable = false; c.g = null; c.free = false;
      ringFx(c.cx, c.cy, 100, '#fb923c', .6, 4); addText(c.cx, e.y - 26, 'O OVO DE CINZAS', '#fb923c', 14, 1.4);
      toast('A Fênix virou um ovo de cinzas! Quebre-o em 6 s.', '#fb923c'); sfx('boom', .7); return true;
    }
    c.S.egg = 2; return false;
  },
  passive(c, e) {
    if (c.S.egg === 1) {
      c.S.eggT -= c.dt; c.skipLoco = true; e.vx *= .9; c.cd = 4;
      if (c.S.eggT <= 0) {
        c.S.egg = 0; c.S.reborn = 1; e.hp = e.hpMax * .7; e.invulnerable = false; c.cd = .6;
        ringFx(c.cx, c.cy, 140, '#fb923c', .7, 5); shake(8); addText(c.cx, e.y - 30, 'RENASCEU!', '#fb923c', 15, 1.5); sfx('boss', .8);
        for (let k = 0; k < 3; k++) bxSpawn(c, 'imp', c.cx + rnd(-80, 80), c.cy - 20, { hp: 60, dm: .3, vy: -260 });
      }
    }
  },
  variant: (e, c) => c ? (c.S.egg === 1 ? 1 : 0) : 0,
  moves: {
    *dive(c) { c.free = true; yield .35; yield* bxDash(c, 640, .75); bxBoom(c, c.cx, c.cy, 64, { tel: .1, dm: .7 }); yield .9; },
    *feathers(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 6, .16, { speed: 300, r: 7, shape: 'feather', col: '#fb923c', col2: '#ffedd5', dm: .45, life: 3, spin: 6 }); yield .5; } },
    *nova(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 18, { speed: 230, r: 8, shape: 'fire', col: '#f97316', col2: '#ffedd5', dm: .5, life: 3, off: k * .22 }); yield .8; } },
  },
});

// ---- 177. Escudo do Firmamento: muralha que barra projéteis ----
bx('escudo', {
  n: 'Escudo do Firmamento', act: 5, w: 92, h: 92, hp: 60000, dmg: 134, def: 32, spd: 70, coin: [1000, 1500], sword: 's177', rec: 'celestial_bar:10,e_earth:10,e_light:8',
  mech: 'levanta a muralha: projéteis e magias não passam — só o golpe de perto, na fenda do olho, fere o corpo lá atrás.',
  shot: 'rock', loco: ['walk', { spd: 62, jump: 380 }], kit: [['bash', 'spikes'], ['bash', 'spikes', 'wall'], ['wall', 'spikes', 'bash', 'spikes']], cds: [1.5, 1.2, .95],
  hurt(c, e, dmg, h) { return c && h && h.proj ? dmg * .02 : dmg; },
  moves: {
    *bash(c) { c.free = true; yield .3; yield* bxDash(c, 520, .6); bxBoom(c, c.cx, c.cy, 60, { tel: .08, dm: .7 }); yield .9; },
    *spikes(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 26, h: 340, tel: .75, dm: .65, col: '#93c5fd' }); yield .22; } yield .9; },
    *wall(c) { c.free = true; const P = G.P; bxZone(c, { x: P.x + (P.x < c.cx ? -90 : 90), y: P.y - 200, w: 34, h: 280, tel: .5, t: 5, kind: 'dmg', dmg: Math.round(c.e.dmg * .7), col: '#93c5fd', flash: .3 }); yield 1.3; },
  },
});

// ---- 178. Chama Sagrada: o fogo pega quem fica parado ----
bx('chama', {
  n: 'Chama Sagrada', act: 5, w: 72, h: 92, hp: 45000, dmg: 122, def: 23, spd: 185, coin: [880, 1300], fly: 1, sword: 's178', rec: 'celestial_bar:8,e_fire:14,e_light:6',
  mech: 'o fogo sagrado persegue quem para: ficar parado incendeia você aos poucos; correndo, a chama se apaga.',
  shot: 'fire', loco: ['chase', { h: -110, spd: 110 }], kit: [['flame', 'wisp'], ['flame', 'wisp', 'pillar'], ['pillar', 'wisp', 'flame', 'wisp']], cds: [1.25, .95, .75], bob: 4,
  init(c) { c.S.b = 0; },
  passive(c, e) {
    const P = G.P, sp = Math.hypot(P.vx || 0, P.vy || 0);
    if (!P.dead && sp < 26) {
      c.S.b += c.dt;
      if (c.S.b > .35) { c.S.b = 0; hurtPlayer(Math.round(e.dmg * .2), c.cx, 0, { pierce: true, inv: .22 }); burst(pcx(P), pcy(P), 3, { col: ['#fbbf24', '#f97316'], spd: 70, life: .4, glow: true }); }
    } else c.S.b = 0;
  },
  moves: {
    *flame(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .17, { speed: 290, r: 8, shape: 'fire', col: '#fb923c', col2: '#fef3c7', dm: .5, life: 2.6 }); yield .5; } },
    *wisp(c) { c.free = true; bxRing(c, 12, { speed: 210, r: 7, shape: 'fire', col: '#fbbf24', col2: '#fef3c7', dm: .45, life: 3 }); yield 1.1; },
    *pillar(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-170, 170), { w: 28, h: 380, tel: .7, dm: .7, col: '#fb923c' }); yield .26; } yield .9; },
  },
});

// ---- 179. Nexo do Infinito: o dano que você dá volta em você 3 s depois ----
bx('nexo', {
  n: 'Nexo do Infinito', act: 5, w: 84, h: 84, hp: 57000, dmg: 135, def: 28, spd: 150, coin: [1000, 1500], fly: 1, sword: 's179', rec: 'celestial_bar:10,e_shadow:12,e_time:5',
  mech: 'guarda cada golpe que você dá e devolve o eco 3 s depois: acertar de novo antes disso redireciona o eco.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 140, spd: 150 }], kit: [['spiral', 'orbits'], ['spiral', 'orbits', 'collapse'], ['collapse', 'orbits', 'spiral', 'orbits']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.echo = 0; c.S.echoT = 3; },
  after(c, e, dmg) { if (!c) return; c.S.echo = (c.S.echo || 0) + dmg * .5; c.S.echoT = 3; },
  passive(c, e) {
    if ((c.S.echo || 0) > 0) {
      c.S.echoT -= c.dt;
      if (c.S.echoT <= 0) {
        const d = Math.max(1, Math.round(c.S.echo)); c.S.echo = 0;
        hurtPlayer(d, c.cx, 110, { pierce: true, inv: .15 });
        addText(pcx(G.P), G.P.y - 28, 'ECO ' + d, '#c084fc', 13, 1.1); ringFx(pcx(G.P), pcy(G.P), 46, '#c084fc', .35, 2);
      }
    }
  },
  moves: {
    *spiral(c) { c.free = true; for (let k = 0; k < 15; k++) { bxShot(c, { ang: k * .55, speed: 230, r: 7, shape: 'orb', col: '#c084fc', col2: '#f5f3ff', dm: .4, life: 4 }); yield .09; } yield .9; },
    *orbits(c) { c.free = true; for (let k = 0; k < 4; k++) { const p = bxShot(c, { ang: k / 4 * TAU, speed: 210, r: 9, shape: 'orb', col: '#a855f7', col2: '#f5f3ff', dm: .5, life: 4, homing: true, steer: 1 }); p.onUpdate = q => { q.vx += Math.cos(G.t * 3) * 20; q.vy += Math.sin(G.t * 3) * 20; }; } yield 1.2; },
    *collapse(c) { c.free = true; for (let k = 0; k < 6; k++) { bxZone(c, { x: c.px + rnd(-200, 200), y: c.py + rnd(-120, 60), r: 40, tel: .7, t: 1, kind: 'pull', k: 600, core: 26, dmg: Math.round(c.e.dmg * .4), col: '#8b5cf6' }); yield .2; } yield 1.6; },
  },
});

// ---- 180. Trono de Ouro: o trono é a armadura (quatro pilares) ----
bx('trono', {
  n: 'Trono de Ouro', act: 5, w: 92, h: 98, hp: 62000, dmg: 138, def: 30, spd: 84, coin: [1050, 1550], sword: 's180', rec: 'celestial_bar:10,e_light:10,e_earth:8',
  mech: 'o trono é a armadura: enquanto os quatro pilares estiverem de pé ele quase não leva dano — derrube os pilares para ele levantar.',
  shot: 'fire', loco: ['walk', { spd: 78, jump: 400 }], kit: [['guards', 'scepter'], ['guards', 'scepter', 'gold'], ['gold', 'scepter', 'guards', 'scepter']], cds: [1.4, 1.1, .85],
  init(c, e) {
    for (let k = 0; k < 4; k++) {
      bxMin(c, { x: c.cx + (k - 1.5) * 46, y: c.cy + 40, look: 'pylon', w: 16, h: 30, hp: 2600, fly: 0, tag: 'leg', name: 'Pilar do Trono', col: '#f59e0b', dm: .3,
        mf: (s) => { s.vx *= .9; } });
    }
  },
  hurt(c, e, dmg) { return c && bxMinCount(c, 'leg') > 0 ? dmg * .2 : dmg; },
  moves: {
    *guards(c) { c.free = true; for (let k = 0; k < 2; k++) { bxSpawn(c, 'skeleton', c.cx + rnd(-70, 70), c.cy, { hp: 120, dm: .3 }); yield .3; } yield .8; },
    *scepter(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 4, .2, { speed: 300, r: 8, shape: 'orb', col: '#f59e0b', col2: '#fff7c2', dm: .55, life: 3 }); yield .55; } },
    *gold(c) { c.free = true; bxRain(c, 8, { speed: 320, r: 9, shape: 'star', col: '#fbbf24', col2: '#fffbeb', dm: .5, life: 3.6, spread: 240 }); yield 1.2; },
  },
});
