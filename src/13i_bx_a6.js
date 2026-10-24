/* ============================================================
   13i_bx_a6: chefes novos do Ato VI · Fim de Tudo (20) — Tier 10
   Cada um guarda UMA das espadas 181–200: essas espadas não são forjadas, caem do chefe.
   O último é a APOTEOSE: 4 estágios (terra → terra → céu → céu), um golpe/mecânica por estágio.
   Motor em 13c_bossx.js; arte em 05l_bxart6.js.
   ============================================================ */
function bxPlanet(c, k) {   // planeta em órbita do Cosmos Vivo
  const s = bxMin(c, { x: c.cx + Math.cos(k / 4 * TAU) * 90, y: c.cy + Math.sin(k / 4 * TAU) * 70, look: 'orb', w: 26, h: 26, hp: 5200, fly: 1, tag: 'planet', name: 'Planeta', col: '#c084fc', dm: .25,
    mf: (q) => { const t = G.t * .9 + q.ph0; q.vx = Math.cos(t) * 130; q.vy = Math.sin(t) * 90; } });
  s.ph0 = k * 1.7; return s;
}
function bxRoot(c, k, n) {   // raiz da Semente Cósmica
  const x = c.cx + (k - (n - 1) / 2) * 90 + rnd(-16, 16), gy = groundY(x, c.cy, 60);
  return bxMin(c, { x, y: (gy > 0 ? gy : c.cy) - 22, look: 'pylon', w: 18, h: 34, hp: 2400, fly: 0, tag: 'root', name: 'Raiz', col: '#a3e635', dm: .22,
    mf: (q, dt) => { q.vx = 0; q.sh = (q.sh === undefined ? 2 : q.sh) - dt; if (q.sh <= 0) { q.sh = 2.6; bxShot({ e: q.owner, d: q.owner.d.bx, cx: ecx(q), cy: ecy(q) - 12, px: pcx(G.P), py: pcy(G.P) }, { speed: 210, r: 6, shape: 'orb', col: '#a3e635', dm: .4, life: 3 }); } } });
}

// ---- 181. Primeira Luz: apagado é intocável; cada golpe dele acende a janela ----
bx('luz_primeira', {
  n: 'Primeira Luz', act: 6, w: 80, h: 84, hp: 78000, dmg: 168, def: 34, spd: 160, coin: [1500, 2200], fly: 1, sword: 's181', rec: 'mythic_core:1,celestial_bar:12,e_light:14',
  mech: 'enquanto apagado ele é quase intocável; cada golpe dele acende a arena por 4 s — e na luz o seu dano sobe 15%.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 130, spd: 160 }], kit: [['flare', 'swarm'], ['flare', 'swarm', 'dawn'], ['dawn', 'swarm', 'flare', 'dawn']], cds: [1.25, 1, .78], bob: 3,
  init(c) { c.S.lit = 0; },
  passive(c) { if (c.S.lit > 0) c.S.lit -= c.dt; },
  hurt(c, e, dmg) { return c && c.S.lit <= 0 ? dmg * .04 : dmg * 1.15; },
  moves: {
    *flare(c) { c.free = true; c.S.lit = 4; addText(c.cx, c.cy - 30, 'A LUZ ACENDE', '#fff7c2', 13, 1.2); for (let k = 0; k < 3; k++) { bxRing(c, 12, { speed: 230, r: 7, shape: 'orb', col: '#fff7c2', col2: '#ffffff', glow: '#fde68a', dm: .45, life: 3, off: k * .2 }); yield .55; } },
    *swarm(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 3, .22, { speed: 330, r: 6, shape: 'star', col: '#fef08a', col2: '#fff', dm: .45, life: 2.6 }); yield .4; } },
    *dawn(c) { c.free = true; c.S.lit = 4; for (let k = 0; k < 6; k++) { bxCol(c, c.px + rnd(-190, 190), { w: 30, h: 380, tel: .55, dm: .7, col: '#fde68a' }); yield .2; } yield .9; },
  },
});

// ---- 182. Fim de Tudo: cada marca vira uma cicatriz de vazio ----
bx('fim', {
  n: 'Fim de Tudo', act: 6, w: 88, h: 96, hp: 82000, dmg: 172, def: 36, spd: 130, coin: [1550, 2250], fly: 1, sword: 's182', rec: 'mythic_core:1,celestial_bar:12,e_shadow:14',
  mech: 'apaga pedaços do chão: cada marca vira uma cicatriz de vazio que queima por 30 s — a arena vai ficando sem lugar seguro.',
  shot: 'orb', loco: ['float', { r: 190, h: -150, spd: 130 }], kit: [['erase', 'gaps'], ['erase', 'gaps', 'unmake'], ['unmake', 'gaps', 'erase', 'erase']], cds: [1.3, 1.05, .8], bob: 3,
  moves: {
    *erase(c) {
      c.free = true;
      for (let k = 0; k < 3; k++) {
        const x = c.px + rnd(-200, 200), y = c.py + rnd(-30, 40);
        bxZone(c, { x, y, r: 42, tel: .9, t: 30, kind: 'fire', dmg: Math.round(c.e.dmg * .16), tick: .55, col: '#0f172a', rim: '#94a3b8', alpha: .5 });
        yield .35;
      }
      yield .8;
    },
    *gaps(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-220, 220), { w: 22, h: 380, tel: .6, dm: .6, col: '#94a3b8' }); yield .18; } yield .9; },
    *unmake(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 16, { speed: 200, r: 8, shape: 'orb', col: '#cbd5e1', col2: '#0f172a', dm: .5, life: 3.4, off: k * .3 }); yield .7; } },
  },
});

// ---- 183. Buraco Branco: empurra tudo para longe ----
bx('buraco_branco', {
  n: 'Buraco Branco', act: 6, w: 92, h: 86, hp: 84000, dmg: 170, def: 35, spd: 120, coin: [1550, 2300], fly: 1, sword: 's183', rec: 'mythic_core:1,celestial_bar:12,e_light:12',
  mech: 'um buraco branco: tudo é empurrado para longe dele, inclusive você e os seus projéteis — é preciso lutar contra a correnteza.',
  shot: 'orb', loco: ['hover', { h: -140, sx: 60, spd: 110 }], kit: [['jets', 'pulse'], ['jets', 'pulse', 'flare'], ['flare', 'pulse', 'jets', 'pulse']], cds: [1.35, 1.1, .85], bob: 2,
  passive(c, e) {
    const P = G.P, dx = pcx(P) - c.cx, dy = pcy(P) - c.cy, d = Math.hypot(dx, dy) || 1;
    if (d < 430) { P.vx += dx / d * 760 * c.dt; P.vy += dy / d * 520 * c.dt; }
  },
  moves: {
    *jets(c) { c.free = true; for (let k = -1; k <= 1; k++) bxBeam(c, { follow: true, ang: k * .5 - PI / 2, len: 520, w: 9, tel: .7, t: 2.4, dmg: Math.round(c.e.dmg * .55), col: '#e0f2fe', col2: '#ffffff' }); yield 2.8; },
    *pulse(c) { c.free = true; for (let k = 0; k < 3; k++) { bxRing(c, 14, { speed: 260, r: 7, shape: 'orb', col: '#bae6fd', col2: '#ffffff', dm: .45, life: 3 }); yield .6; } },
    *flare(c) { c.free = true; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + c.t; bxShot(c, { ang: a, speed: 340, r: 10, shape: 'star', col: '#ffffff', col2: '#e0f2fe', dm: .55, life: 3, spin: 8 }); yield .22; } yield .8; },
  },
});

// ---- 184. Cosmos Vivo: quatro planetas absorvem o dano ----
bx('cosmos', {
  n: 'Cosmos Vivo', act: 6, w: 96, h: 90, hp: 86000, dmg: 168, def: 34, spd: 140, coin: [1600, 2350], fly: 1, sword: 's184', rec: 'mythic_core:1,celestial_bar:12,e_shadow:10,e_light:8',
  mech: 'quatro planetas giram em volta e absorvem os golpes: cada planeta vivo corta o seu dano pela metade de novo — destruí-los enfraquece o núcleo, mas eles renascem.',
  shot: 'orb', loco: ['orbit', { r: 240, h: -150, spd: 140, w: .5 }], kit: [['meteors', 'spiral'], ['meteors', 'spiral', 'eclipse'], ['eclipse', 'spiral', 'meteors', 'spiral']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { for (let k = 0; k < 4; k++) bxPlanet(c, k); c.S.t = 14; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0 && bxMinCount(c, 'planet') < 4) { c.S.t = c.ph > 2 ? 9 : 14; bxPlanet(c, bxMinCount(c, 'planet')); addText(c.cx, e.y - 20, 'Um planeta nasce', '#c084fc', 12, 1); }
  },
  hurt(c, e, dmg) { const n = c ? bxMinCount(c, 'planet') : 0; return n > 0 ? dmg / (1 + .75 * n) : dmg; },
  moves: {
    *meteors(c) { c.free = true; for (let k = 0; k < 4; k++) { bxRain(c, 2, { speed: 330, r: 10, shape: 'meteor', col: '#c084fc', col2: '#f5f3ff', dm: .5, life: 3.4, spread: 230, spin: 5 }); yield .45; } },
    *spiral(c) { c.free = true; for (let k = 0; k < 14; k++) { bxShot(c, { ang: k * .48, speed: 250, r: 7, shape: 'orb', col: '#a855f7', col2: '#f5f3ff', dm: .4, life: 3.6 }); yield .08; } yield .8; },
    *eclipse(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 20, { speed: 220, r: 7, shape: 'orb', col: '#7c3aed', col2: '#f5f3ff', dm: .45, life: 3.2, off: k * .18 }); yield .8; } },
  },
});

// ---- 185. Teorema Final: quatro quadrantes, um seguro ----
bx('teorema', {
  n: 'Teorema Final', act: 6, w: 82, h: 82, hp: 80000, dmg: 170, def: 34, spd: 150, coin: [1550, 2250], fly: 1, sword: 's185', rec: 'mythic_core:1,celestial_bar:12,e_time:8,e_light:8',
  mech: 'enuncia um teorema: quatro quadrantes acendem e só o que corresponde à resposta é seguro — os outros três explodem.',
  shot: 'orb', loco: ['hover', { h: -160, sx: 120, spd: 150 }], kit: [['proof', 'grid'], ['proof', 'grid', 'lemma'], ['lemma', 'grid', 'proof', 'proof']], cds: [1.35, 1.1, .85], bob: 3,
  init(c) { c.S.n = 0; },
  moves: {
    *proof(c) {
      c.free = true; const P = G.P, safe = rndi(0, 3), qs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      c.S.n++;
      for (let i = 0; i < 4; i++) {
        const [sx, sy] = qs[i], x = P.x + sx * 170 - 95, y = P.y + sy * 120 - 75;
        if (i === safe) bxZone(c, { x, y, w: 190, h: 150, tel: .01, t: 2.4, kind: 'buff', buff: 'shield', bt: .3, col: '#22d3ee', alpha: .22 });
        else bxZone(c, { x, y, w: 190, h: 150, tel: 1.9, kind: 'dmg', dmg: Math.round(c.e.dmg * .95), col: '#f43f5e', flash: .35 });
      }
      addText(P.x + 60, P.y - 90, 'RESPOSTA: ' + (safe + 1) + 'º QUADRANTE', '#22d3ee', 13, 1.6);
      yield 2.2;
    },
    *grid(c) { c.free = true; for (let k = 0; k < 6; k++) { bxCol(c, c.px + (k - 2.5) * 46, { w: 22, h: 380, tel: .7, dm: .6, col: '#a5b4fc' }); } yield 1.3; },
    *lemma(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .16, { speed: 330, r: 7, shape: 'blade', col: '#a5b4fc', col2: '#eef2ff', dm: .5, life: 2.8 }); yield .5; } },
  },
});

// ---- 186. O Último Nome: enquanto o nome está escrito, tudo persegue você ----
bx('ultimo_nome', {
  n: 'O Último Nome', act: 6, w: 84, h: 92, hp: 88000, dmg: 172, def: 36, spd: 140, coin: [1600, 2350], fly: 1, sword: 's186', rec: 'mythic_core:1,celestial_bar:12,e_shadow:10,e_blood:6',
  mech: 'escreve o seu nome no livro: enquanto estiver escrito, todos os tiros te perseguem — três golpes apagam o nome.',
  shot: 'orb', loco: ['float', { r: 200, h: -150, spd: 140 }], kit: [['ink', 'quill'], ['ink', 'quill', 'page'], ['page', 'quill', 'ink', 'quill']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.name = 0; c.S.hits = 0; c.S.t = 9; },
  passive(c, e) {
    if (c.S.name > 0) { c.S.name -= c.dt; if (c.S.name <= 0) addText(c.cx, e.y - 22, 'O nome se apaga', '#fde68a', 12, 1); return; }
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.t = 14; c.S.name = 7; c.S.hits = 0; addText(pcx(G.P), G.P.y - 34, 'SEU NOME ESTÁ ESCRITO', '#fde68a', 15, 1.5); ringFx(pcx(G.P), pcy(G.P), 70, '#fde68a', .5, 3); sfx('portal', .6); }
  },
  after(c) { if (c && c.S.name > 0) { c.S.hits++; if (c.S.hits >= 3) { c.S.name = 0; addText(c.cx, c.e.y - 20, 'Nome apagado', '#86efac', 13, 1.2); } } },
  moves: {
    *ink(c) { c.free = true; const hm = c.S.name > 0; for (let k = 0; k < 4; k++) { bxFan(c, 3, .2, { speed: 300, r: 7, shape: 'orb', col: '#1e1b2e', col2: '#fde68a', glow: '#fde68a', dm: .5, life: 3, homing: hm, steer: 1.4 }); yield .45; } },
    *quill(c) { c.free = true; yield .3; for (let k = 0; k < 5; k++) { bxCol(c, c.px + (k - 2) * 52, { w: 24, h: 360, tel: .6, dm: .6, col: '#fde68a' }); } yield 1.2; },
    *page(c) { c.free = true; for (let k = 0; k < 3; k++) { bxRing(c, 12, { speed: 210, r: 8, shape: 'blade', col: '#e2e8f0', col2: '#fde68a', dm: .5, life: 3, spin: 7, off: k * .25 }); yield .6; } },
  },
});

// ---- 187. Origem do Vazio: o horizonte puxa; só a borda fere ----
bx('origem', {
  n: 'Origem do Vazio', act: 6, w: 92, h: 92, hp: 90000, dmg: 176, def: 38, spd: 120, coin: [1650, 2400], fly: 1, sword: 's187', rec: 'mythic_core:1,celestial_bar:12,e_shadow:14',
  mech: 'o horizonte do vazio puxa você para o centro: dentro dele o chefe é intocável e longe demais ele quase não sente — o lugar certo é a borda.',
  shot: 'orb', loco: ['still', {}], kit: [['tendrils', 'collapse'], ['tendrils', 'collapse', 'voids'], ['voids', 'collapse', 'tendrils', 'collapse']], cds: [1.3, 1.05, .8], bob: 2,
  passive(c) {
    const P = G.P, dx = c.cx - pcx(P), dy = c.cy - pcy(P), d = Math.hypot(dx, dy) || 1;
    if (d < 460) { P.vx += dx / d * 470 * c.dt; P.vy += dy / d * 330 * c.dt; }
  },
  hurt(c, e, dmg) { const d = c ? Math.hypot(c.dx, c.dy) : 0; return d < 130 ? dmg * .06 : d > 380 ? dmg * .3 : dmg * 1.1; },
  moves: {
    *tendrils(c) { c.free = true; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + c.t; bxShot(c, { ang: a, speed: 190, r: 8, shape: 'orb', col: '#a855f7', col2: '#f5f3ff', dm: .45, life: 3.6 }); yield .14; } yield .9; },
    *collapse(c) { c.free = true; for (let k = 0; k < 5; k++) { bxRing(c, 14, { speed: 240, r: 7, shape: 'orb', col: '#7c3aed', col2: '#ede9fe', dm: .4, life: 3, off: k * .16 }); yield .3; } yield .8; },
    *voids(c) { c.free = true; for (let k = 0; k < 3; k++) { bxZone(c, { x: c.px + rnd(-180, 180), y: c.py + rnd(-90, 60), r: 46, tel: .8, t: 1.4, kind: 'pull', k: 640, core: 30, dmg: Math.round(c.e.dmg * .4), col: '#7c3aed' }); yield .3; } yield 1.4; },
  },
});

// ---- 188. Relógio do Universo: compara o seu dano a cada 10 s ----
bx('relogio', {
  n: 'Relógio do Universo', act: 6, w: 86, h: 96, hp: 92000, dmg: 174, def: 36, spd: 150, coin: [1650, 2400], fly: 1, sword: 's188', rec: 'mythic_core:1,celestial_bar:12,e_time:14',
  mech: 'cada 10 s ele compara o seu dano com o dele: se você bateu pouco, ele se cura e dispara mais rápido; se bateu muito, ele cambaleia.',
  shot: 'orb', loco: ['orbit', { r: 230, h: -150, spd: 150, w: .7 }], kit: [['hands', 'tick'], ['hands', 'tick', 'gears'], ['gears', 'tick', 'hands', 'tick']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.dmg = 0; c.S.t = 10; c.S.rag = 0; },
  after(c, e, dmg) { if (c) c.S.dmg += dmg; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t > 0) return;
    c.S.t = 10;
    const need = e.hpMax * .05;
    if (c.S.dmg < need) {
      bxHeal(e, .05); c.S.rag++; addText(c.cx, e.y - 24, 'Pouco dano: ele acelera', '#fbbf24', 13, 1.3);
      ringFx(c.cx, c.cy, 90, '#fbbf24', .4, 2); bxRing(c, 14, { speed: 240, r: 7, shape: 'orb', col: '#fbbf24', col2: '#fffbeb', dm: .4, life: 3 });
    } else {
      e.st.stun = 2.2; addText(c.cx, e.y - 24, 'Bom ritmo: ele cambaleia', '#86efac', 14, 1.3); ringFx(c.cx, c.cy, 110, '#86efac', .5, 3);
    }
    c.S.dmg = 0;
  },
  moves: {
    *hands(c) { c.free = true; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + c.t * .6; bxShot(c, { ang: a, speed: 210, r: 8, shape: 'blade', col: '#67e8f9', col2: '#ecfeff', dm: .45, life: 3.2, spin: 8 }); yield .1; } yield .8; },
    *tick(c) { c.free = true; for (let k = 0; k < 4; k++) { bxRing(c, 12, { speed: 230, r: 7, shape: 'orb', col: '#22d3ee', col2: '#ecfeff', dm: .4, life: 3, off: k * .12 }); yield .22; } yield .8; },
    *gears(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 26, h: 380, tel: .55, dm: .6, col: '#67e8f9' }); yield .18; } yield .9; },
  },
});

// ---- 189. Semente Cósmica: cinco raízes e ela floresce ----
bx('semente', {
  n: 'Semente Cósmica', act: 6, w: 88, h: 100, hp: 85000, dmg: 168, def: 34, spd: 110, coin: [1600, 2300], fly: 0, sword: 's189', rec: 'mythic_core:1,celestial_bar:12,e_earth:10,e_poison:8',
  mech: 'lança raízes pelo chão: se cinco raízes sobreviverem, ela floresce, se cura e chama a floresta — corte as raízes.',
  shot: 'orb', loco: ['walk', { spd: 74, jump: 460 }], kit: [['spores', 'roots'], ['spores', 'roots', 'bloom'], ['bloom', 'roots', 'spores', 'roots']], cds: [1.4, 1.1, .85],
  init(c) { c.S.t = 5; c.S.bloomed = 0; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.t = c.ph > 2 ? 4 : 6; if (bxMinCount(c, 'root') < 6) { bxRoot(c, bxMinCount(c, 'root'), 6); addText(c.cx, e.y - 18, 'Uma raiz brota', '#a3e635', 11, 1); } }
    if (!c.S.bloomed && bxMinCount(c, 'root') >= 5) {
      c.S.bloomed = 1; bxHeal(e, .07); ringFx(c.cx, c.cy, 140, '#a3e635', .6, 4);
      addText(c.cx, e.y - 26, 'FLORESCER!', '#a3e635', 14, 1.4); shake(6);
      for (let k = 0; k < 3; k++) bxRoot(c, k, 3);
    }
  },
  moves: {
    *spores(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .18, { speed: 250, r: 8, shape: 'orb', col: '#a3e635', col2: '#f7fee7', dm: .45, life: 3.2, status: [['poison', 3, { dps: 18 }]] }); yield .55; } },
    *roots(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px + rnd(-170, 170), { w: 28, h: 340, tel: .8, dm: .6, col: '#a3e635', buff: 'slow', bt: 1.4, bd: { mult: .5 } }); yield .28; } yield .9; },
    *bloom(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 16, { speed: 210, r: 8, shape: 'orb', col: '#65a30d', col2: '#ecfccb', dm: .45, life: 3.2, off: k * .2 }); yield .7; } },
  },
});

// ---- 190. Axioma: durante a regra, quem ataca leva o próprio dano de volta ----
bx('axioma', {
  n: 'Axioma', act: 6, w: 86, h: 100, hp: 90000, dmg: 176, def: 38, spd: 110, coin: [1650, 2400], fly: 0, sword: 's190', rec: 'mythic_core:1,celestial_bar:12,e_light:8,e_earth:8',
  mech: 'declara um axioma: por 4 s, quem atacar recebe metade do próprio dano de volta — é preciso parar de bater quando a pedra acender.',
  shot: 'orb', loco: ['walk', { spd: 66, jump: 380 }], kit: [['law', 'weight'], ['law', 'weight', 'chains'], ['chains', 'weight', 'law', 'weight']], cds: [1.4, 1.1, .85],
  init(c) { c.S.rule = 0; c.S.t = 8; },
  passive(c, e) {
    if (c.S.rule > 0) c.S.rule -= c.dt;
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.t = c.ph > 2 ? 9 : 12; c.S.rule = 4; addText(c.cx, e.y - 28, 'AXIOMA: NÃO ATAQUE', '#a5b4fc', 15, 1.5); ringFx(c.cx, c.cy, 120, '#a5b4fc', .5, 3); sfx('portal', .6); }
  },
  after(c, e, dmg) { if (c && c.S.rule > 0) { hurtPlayer(Math.max(1, Math.round(dmg * .5)), c.cx, 90, { pierce: true, inv: .2 }); addText(c.cx, e.y - 14, 'Axioma!', '#a5b4fc', 12, .9); } },
  moves: {
    *law(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + (k - 1.5) * 64, { w: 26, h: 360, tel: .7, dm: .65, col: '#a5b4fc' }); } yield 1.3; },
    *weight(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 16, { speed: 200, r: 8, shape: 'orb', col: '#818cf8', col2: '#eef2ff', dm: .45, life: 3.2, off: k * .25 }); yield .7; } },
    *chains(c) { c.free = true; for (let k = 0; k < 6; k++) { bxShot(c, { ang: k / 6 * TAU + c.t, speed: 240, r: 9, shape: 'orb', col: '#a5b4fc', col2: '#eef2ff', dm: .5, life: 3.4, homing: true, steer: .9 }); yield .12; } yield .8; },
  },
});

// ---- 191. Convergência Final: portais nas bordas fecham em você ----
bx('convergencia', {
  n: 'Convergência Final', act: 6, w: 92, h: 88, hp: 95000, dmg: 178, def: 38, spd: 160, coin: [1700, 2450], fly: 1, sword: 's191', rec: 'mythic_core:2,celestial_bar:12,e_lightning:8,e_time:6',
  mech: 'abre portais nas bordas da tela e traz tudo para o centro: os projéteis convergem em você, de todas as direções ao mesmo tempo.',
  shot: 'orb', loco: ['hover', { h: -155, sx: 90, spd: 150 }], kit: [['gates', 'spiral'], ['gates', 'spiral', 'focus'], ['focus', 'gates', 'spiral', 'gates']], cds: [1.3, 1.05, .8], bob: 3,
  moves: {
    *gates(c) {
      c.free = true; const P = G.P;
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * TAU + c.t * .3, x = pcx(P) + Math.cos(a) * 430, y = pcy(P) + Math.sin(a) * 300;
        const p = bxShot(c, { x, y, speed: 210, r: 7, shape: 'orb', col: '#fde68a', col2: '#fffbeb', dm: .45, life: 4, homing: true, steer: 1.1 });
        p.x = x; p.y = y; yield .1;
      }
      yield .9;
    },
    *spiral(c) { c.free = true; for (let k = 0; k < 16; k++) { bxShot(c, { ang: k * .42 + c.t, speed: 240, r: 6, shape: 'blade', col: '#fbbf24', col2: '#fffbeb', dm: .4, life: 3.2, spin: 10 }); yield .07; } yield .8; },
    *focus(c) { c.free = true; for (let k = 0; k < 3; k++) { bxCol(c, c.px, { w: 54, h: 400, tel: .7 + k * .18, dm: .85, col: '#fde68a' }); } yield 1.4; },
  },
});

// ---- 192. Espada do Autor: escreve a sentença letra por letra ----
bx('autor', {
  n: 'Espada do Autor', act: 6, w: 90, h: 96, hp: 98000, dmg: 180, def: 40, spd: 140, coin: [1700, 2500], fly: 1, sword: 's192', rec: 'mythic_core:2,celestial_bar:14,e_light:10,e_time:8',
  mech: 'escreve uma palavra no chão: cada letra é uma coluna que cai em sequência, e a última letra é a mais forte de todas.',
  shot: 'orb', loco: ['float', { r: 210, h: -160, spd: 140 }], kit: [['write', 'sketch'], ['write', 'sketch', 'erase'], ['erase', 'sketch', 'write', 'write']], cds: [1.35, 1.1, .85], bob: 3,
  moves: {
    *write(c) {
      c.free = true; const P = G.P, n = 6, x0 = P.x - 150;
      for (let i = 0; i < n; i++) {
        bxCol(c, x0 + i * 60, { w: 24, h: 360, tel: .35 + i * .12, dm: .45, col: '#fbbf24' });
        addText(x0 + i * 60, P.y - 70, 'APOTEOSE'[i] || '•', '#fde68a', 14, .8);
        yield .12;
      }
      bxCol(c, P.x, { w: 70, h: 420, tel: .5, dm: 1.15, col: '#f59e0b' });
      shake(6); yield 1.3;
    },
    *sketch(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 4, .2, { speed: 320, r: 7, shape: 'blade', col: '#fde68a', col2: '#fffbeb', dm: .5, life: 2.8 }); yield .42; } },
    *erase(c) { c.free = true; for (let k = 0; k < 5; k++) { bxShot(c, { ang: k / 5 * TAU + c.t, speed: 190, r: 10, shape: 'orb', col: '#e2e8f0', col2: '#ffffff', dm: .5, life: 4, homing: true, steer: .8 }); yield .15; } yield .8; },
  },
});

// ---- 193. Nada Eterno: por 4 s, nenhum golpe passa de 40 ----
bx('nada', {
  n: 'Nada Eterno', act: 6, w: 90, h: 94, hp: 96000, dmg: 176, def: 38, spd: 150, coin: [1700, 2450], fly: 1, sword: 's193', rec: 'mythic_core:2,celestial_bar:12,e_shadow:14',
  mech: 'apaga o excesso: por 4 s nenhum golpe seu passa de 40 de dano — o dano vem do tempo certo, não da força.',
  shot: 'orb', loco: ['chase', { h: -130, spd: 120 }], kit: [['void', 'snuff'], ['void', 'snuff', 'hollow'], ['hollow', 'snuff', 'void', 'void']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.null = 0; c.S.t = 9; },
  passive(c, e) {
    if (c.S.null > 0) { c.S.null -= c.dt; return; }
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.t = c.ph > 2 ? 7 : 10; c.S.null = 4; addText(c.cx, e.y - 28, 'NADA', '#e2e8f0', 16, 1.5); flash('#0a0a10', .3, .4); ringFx(c.cx, c.cy, 130, '#94a3b8', .5, 3); }
  },
  hurt(c, e, dmg) { return c && c.S.null > 0 ? Math.min(dmg, 40) : dmg; },
  moves: {
    *void(c) { c.free = true; for (let k = 0; k < 4; k++) { bxRing(c, 14, { speed: 210, r: 8, shape: 'orb', col: '#64748b', col2: '#e2e8f0', dm: .45, life: 3.2, off: k * .2 }); yield .5; } },
    *snuff(c) { c.free = true; for (let k = 0; k < 6; k++) { bxShot(c, { ang: k / 6 * TAU + c.t, speed: 220, r: 9, shape: 'orb', col: '#94a3b8', col2: '#f1f5f9', dm: .5, life: 3.4, homing: true, steer: 1 }); yield .12; } yield .8; },
    *hollow(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 28, h: 380, tel: .6, dm: .7, col: '#64748b' }); yield .2; } yield .9; },
  },
});

// ---- 194. Tudo de Uma Vez: cada golpe é uma mecânica de outro ato ----
bx('tudo', {
  n: 'Tudo de Uma Vez', act: 6, w: 88, h: 100, hp: 100000, dmg: 178, def: 38, spd: 150, coin: [1750, 2500], fly: 1, sword: 's194', rec: 'mythic_core:2,celestial_bar:14,e_light:8,e_shadow:8',
  mech: 'tudo de uma vez: cada golpe dele é uma mecânica de outro ato — gravidade invertida, muralha, confusão e enxame.',
  shot: 'orb', loco: ['float', { r: 190, h: -150, spd: 145 }], kit: [['grav', 'wall'], ['wall', 'confuse'], ['confuse', 'swarm'], ['swarm', 'grav', 'confuse', 'wall']], cds: [1.25, 1, .75], bob: 3,
  pick(c) { const L = ['grav', 'wall', 'confuse', 'swarm']; return L[c.i++ % 4]; },
  moves: {
    *grav(c) { c.free = true; addText(pcx(G.P), G.P.y - 32, 'GRAVIDADE!', '#a78bfa', 14, 1.2); bxBuff('gravflip', 2.6); bxRing(c, 14, { speed: 220, r: 7, shape: 'orb', col: '#a78bfa', col2: '#ede9fe', dm: .45, life: 3 }); yield 1.2; },
    *wall(c) { c.free = true; const P = G.P; for (let k = 0; k < 6; k++) { bxZone(c, { x: P.x - 400 + k * 140, y: P.y - 200, w: 30, h: 300, tel: .7, t: 2.4, kind: 'dmg', dmg: Math.round(c.e.dmg * .6), col: '#f472b6', flash: .3 }); } yield 1.6; },
    *confuse(c) { c.free = true; addText(pcx(G.P), G.P.y - 32, 'CONFUSÃO!', '#f472b6', 14, 1.2); bxBuff('confuse', 3); for (let k = 0; k < 3; k++) { bxFan(c, 4, .25, { speed: 300, r: 7, shape: 'orb', col: '#f472b6', col2: '#fdf2f8', dm: .45, life: 3 }); yield .4; } },
    *swarm(c) { c.free = true; for (let k = 0; k < 10; k++) { bxShot(c, { ang: k / 10 * TAU, speed: 220, r: 6, shape: 'orb', col: '#f9a8d4', col2: '#fdf2f8', dm: .35, life: 3.6, homing: true, steer: .8 }); yield .08; } yield .9; },
  },
});

// ---- 195. Ponto Zero: puxa tudo para um ponto e prende quem chega perto ----
bx('ponto', {
  n: 'Ponto Zero', act: 6, w: 84, h: 80, hp: 92000, dmg: 180, def: 38, spd: 130, coin: [1700, 2450], fly: 1, sword: 's195', rec: 'mythic_core:2,celestial_bar:12,e_time:10,e_lightning:8',
  mech: 'colapsa num ponto: puxa tudo para o centro; perto dele você flutua sem conseguir pular e leva dano contínuo.',
  shot: 'orb', loco: ['still', {}], kit: [['rings', 'gravity'], ['rings', 'gravity', 'needle'], ['needle', 'gravity', 'rings', 'gravity']], cds: [1.25, 1, .75], bob: 6,
  passive(c, e) {
    const P = G.P, dx = c.cx - pcx(P), dy = c.cy - pcy(P), d = Math.hypot(dx, dy) || 1;
    if (d < 460) { P.vx += dx / d * 520 * c.dt; P.vy += dy / d * 380 * c.dt; }
    if (d < 170) { bxBuff('floaty', .3); c.S.hit = (c.S.hit || 0) + c.dt; if (c.S.hit > .5) { c.S.hit = 0; hurtPlayer(Math.round(e.dmg * .18), c.cx, 0, { pierce: true, inv: .3 }); } }
  },
  moves: {
    *rings(c) { c.free = true; for (let k = 0; k < 4; k++) { bxRing(c, 16, { speed: 240, r: 7, shape: 'orb', col: '#fde047', col2: '#fefce8', dm: .4, life: 3.2, off: k * .18 }); yield .35; } yield .7; },
    *gravity(c) { c.free = true; for (let k = 0; k < 3; k++) { bxZone(c, { x: c.px + rnd(-200, 200), y: c.py + rnd(-100, 60), r: 54, tel: .7, t: 1.6, kind: 'pull', k: 720, core: 34, dmg: Math.round(c.e.dmg * .45), col: '#fbbf24' }); yield .3; } yield 1.3; },
    *needle(c) { c.free = true; yield .3; for (let k = 0; k < 8; k++) { bxShot(c, { ang: k / 8 * TAU + c.t, speed: 320, r: 5, shape: 'blade', col: '#fde047', col2: '#fefce8', dm: .5, life: 2.6, trail: '#fbbf24' }); } yield 1.1; },
  },
});

// ---- 196. Coração do Multiverso: cada batida inverte a gravidade ----
bx('coracao', {
  n: 'Coração do Multiverso', act: 6, w: 92, h: 88, hp: 97000, dmg: 178, def: 38, spd: 150, coin: [1720, 2480], fly: 1, sword: 's196', rec: 'mythic_core:2,celestial_bar:12,e_blood:10,e_light:6',
  mech: 'a cada batida o mundo troca: a gravidade inverte e os tiros mudam de cor e de padrão — é preciso reaprender a andar no ar.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 110, spd: 150 }], kit: [['beat', 'pulse'], ['beat', 'pulse', 'worlds'], ['worlds', 'pulse', 'beat', 'beat']], cds: [1.3, 1.05, .8], bob: 4,
  init(c) { c.S.b = 3.4; c.S.beats = 0; },
  passive(c, e) {
    c.S.b -= c.dt;
    if (c.S.b > 0) return;
    c.S.b = 3.4; c.S.beats++;
    const flip = c.S.beats % 2 === 0;
    addText(c.cx, e.y - 26, flip ? 'BATIDA · GRAVIDADE' : 'BATIDA', flip ? '#f43f5e' : '#fb7185', 13, 1.1);
    if (flip) bxBuff('gravflip', 2.2);
    ringFx(c.cx, c.cy, 90, '#f43f5e', .4, 3);
  },
  moves: {
    *beat(c) { c.free = true; for (let k = 0; k < 3; k++) { bxRing(c, 14, { speed: 230, r: 8, shape: 'orb', col: '#f43f5e', col2: '#ffe4e6', dm: .45, life: 3, off: k * .22 }); yield .45; } },
    *pulse(c) { c.free = true; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-190, 190), { w: 30, h: 380, tel: .6, dm: .65, col: '#fb7185' }); yield .22; } yield .8; },
    *worlds(c) { c.free = true; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + c.t; bxShot(c, { ang: a, speed: 210, r: 8, shape: 'orb', col: k % 2 ? '#22d3ee' : '#f43f5e', col2: '#ffffff', dm: .45, life: 3.4, homing: true, steer: .7 }); yield .1; } yield .8; },
  },
});

// ---- 197. Lâmina Absoluta: só fere durante o próprio corte ----
bx('lamina', {
  n: 'Lâmina Absoluta', act: 6, w: 88, h: 104, hp: 100000, dmg: 182, def: 40, spd: 170, coin: [1750, 2550], fly: 1, sword: 's197', rec: 'mythic_core:2,celestial_bar:14,e_light:10,e_lightning:8',
  mech: 'a lâmina absoluta corta tudo: ele só pode ser ferido no instante em que a própria lâmina dele está cortando — o resto do tempo, quica.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 150, spd: 170 }], kit: [['cut', 'feint'], ['cut', 'feint', 'rain'], ['rain', 'feint', 'cut', 'cut']], cds: [1.2, .95, .72], bob: 3,
  init(c) { c.S.slash = 0; },
  passive(c) { if (c.S.slash > 0) c.S.slash -= c.dt; },
  hurt(c, e, dmg) { return c && c.S.slash <= 0 ? dmg * .05 : dmg * 1.2; },
  moves: {
    *cut(c) {
      c.free = true; yield .35;
      c.S.slash = .6;
      bxBeam(c, { follow: true, aim: true, ang: 0, len: 470, w: 12, tel: .12, t: .3, dmg: Math.round(c.e.dmg * .8), col: '#a5f3fc', col2: '#ffffff' });
      bxCol(c, c.px, { w: 46, h: 400, tel: .1, dm: .6, col: '#a5f3fc' });
      yield .9; c.S.slash = 0;
    },
    *feint(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 3, .2, { speed: 360, r: 6, shape: 'blade', col: '#67e8f9', col2: '#ffffff', dm: .45, life: 2.4 }); yield .35; } },
    *rain(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 20, h: 380, tel: .5, dm: .6, col: '#a5f3fc' }); yield .16; } yield .9; },
  },
});

// ---- 198. Maré Cósmica: a maré sobe (flutua) e desce (queima o chão) ----
bx('mare', {
  n: 'Maré Cósmica', act: 6, w: 100, h: 88, hp: 99000, dmg: 180, def: 38, spd: 140, coin: [1740, 2500], fly: 1, sword: 's198', rec: 'mythic_core:2,celestial_bar:13,e_water:12,e_ice:6',
  mech: 'a maré sobe e desce: quando sobe você flutua e ondas varrem o chão; quando desce, o chão queima por onde ela passou.',
  shot: 'orb', loco: ['hover', { h: -140, sx: 120, spd: 140 }], kit: [['surge', 'spray'], ['surge', 'spray', 'lowtide'], ['lowtide', 'spray', 'surge', 'surge']], cds: [1.3, 1.05, .8], bob: 3,
  init(c) { c.S.tide = 0; c.S.t = 6; },
  passive(c, e) {
    c.S.t -= c.dt;
    if (c.S.t <= 0) { c.S.t = 7; c.S.tide = c.S.tide ? 0 : 1; addText(c.cx, e.y - 26, c.S.tide ? 'A MARÉ SOBE' : 'A MARÉ DESCE', '#2dd4bf', 13, 1.2); }
    if (c.S.tide) bxBuff('floaty', .3);
  },
  moves: {
    *surge(c) { c.free = true; for (let k = 0; k < 4; k++) { bxWave(c, 1, { col: '#2dd4bf', hh: 14 }); bxWave(c, -1, { col: '#2dd4bf', hh: 14 }); yield .45; } },
    *spray(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 5, .18, { speed: 300, r: 8, shape: 'orb', col: '#2dd4bf', col2: '#ccfbf1', dm: .45, life: 3 }); yield .45; } },
    *lowtide(c) { c.free = true; for (let k = 0; k < 4; k++) { bxZone(c, { x: c.px + rnd(-220, 220), y: c.py + rnd(-20, 50), r: 44, tel: .6, t: 8, kind: 'fire', dmg: Math.round(c.e.dmg * .14), tick: .5, col: '#0f766e', rim: '#5eead4', alpha: .35 }); yield .3; } yield 1; },
  },
});

// ---- 199. Brado do Infinito: o grito volta 1,5 s depois pelo lado oposto ----
bx('brado', {
  n: 'Brado do Infinito', act: 6, w: 94, h: 90, hp: 102000, dmg: 184, def: 40, spd: 150, coin: [1780, 2550], fly: 1, sword: 's199', rec: 'mythic_core:2,celestial_bar:14,e_light:10,e_lightning:8',
  mech: 'grita: o grito vai e volta 1,5 s depois pelo lado oposto — é preciso trocar de lado antes do eco.',
  shot: 'orb', loco: ['hover', { h: -150, sx: 100, spd: 150 }], kit: [['shout', 'echo'], ['shout', 'echo', 'silence'], ['silence', 'echo', 'shout', 'shout']], cds: [1.25, 1, .75], bob: 3,
  moves: {
    *shout(c) { c.free = true; bxFan(c, 7, .13, { speed: 340, r: 8, shape: 'orb', col: '#fbbf24', col2: '#fef3c7', dm: .45, life: 2.6 }); ringFx(c.cx, c.cy, 60, '#fbbf24', .35, 2); yield .8; },
    *echo(c) {
      c.free = true; const P = G.P, mx = 2 * pcx(P) - c.cx, my = 2 * pcy(P) - c.cy;
      for (let k = 0; k < 3; k++) {
        bxShot(c, { x: mx, y: my, speed: 320, r: 9, shape: 'orb', col: '#f59e0b', col2: '#fef3c7', dm: .5, life: 3, trail: '#fbbf24' });
        bxRing({ e: c.e, d: c.d, cx: mx, cy: my, px: pcx(P), py: pcy(P) }, 8, { speed: 280, r: 7, shape: 'orb', col: '#fbbf24', col2: '#fef3c7', dm: .4, life: 2.6, off: k });
        yield .5;
      }
    },
    *silence(c) { c.free = true; for (let k = 0; k < 5; k++) { bxCol(c, c.px + rnd(-210, 210), { w: 28, h: 380, tel: .55, dm: .65, col: '#fbbf24' }); yield .18; } yield .9; },
  },
});

// ============================================================
// 200. APOTEOSE — o chefe final: 4 estágios, terra → terra → céu → céu
// ============================================================
bx('apoteose', {
  n: 'Apoteose', act: 6, w: 108, h: 124, hp: 260000, dmg: 232, def: 46, spd: 150, coin: [5000, 8000], fly: 0, sword: 's200', rec: 'mythic_core:4,celestial_bar:20,e_light:20,e_time:14',
  mech: 'quatro estágios de vida: I julgamento e martelo, II selos que o blindam, III asas com raios girando e IV a apoteose final — nos dois primeiros ele anda no chão, nos dois últimos voa.',
  shot: 'orb', cds: [1.2, 1.05, .9, .7], bob: 2, keepFace: false,
  phase: c => Math.max(1, Math.min(4, 1 + Math.floor((1 - c.hp) * 4 + 1e-9))),
  loco(c, e) {
    if (e.noclip) {
      steerFly(e, c.px + Math.cos(c.t * .7) * 200, c.py - 170 + Math.sin(c.t * 1.1) * 36, e.spd * c.sm, 2.1, c.dt);
      return;
    }
    c.jt -= c.dt;
    const dir = Math.sign(c.dx) || 1, sp = 86 * c.sm * (1 + (c.ph - 1) * .15);
    if (Math.abs(c.dx) > 46) e.vx = approach(e.vx, dir * sp, 900 * c.dt); else e.vx *= Math.pow(.01, c.dt);
    if (e.onGround && c.jt <= 0 && (e.hitX || c.dy < -80)) { e.vy = -480; c.jt = .7; }
  },
  init(c) { c.S.seals = 0; c.S.aura = 0; },
  onPhase(c, e, ph) {
    const nm = ['', 'ESTÁGIO I · JULGAMENTO', 'ESTÁGIO II · SELO', 'ESTÁGIO III · ASAS', 'ESTÁGIO IV · APOTEOSE'][ph];
    addText(c.cx, e.y - 40, nm, '#fde68a', 16, 1.8); shake(9); sfx('boss', .9); flash('#fde68a', .25, .4);
    if (ph === 2) { for (let k = 0; k < 4; k++) bxSeal(c, k); c.S.seals = 4; }
    if (ph === 3) {
      e.fly = 1; e.noclip = 1; c.nograv = true; e.vy = -260; e.vx = 0;
      addText(c.cx, e.y - 64, 'ASAS', '#fff7c2', 14, 1.4); ringFx(c.cx, c.cy, 170, '#fde68a', .6, 5);
    }
    if (ph === 4) { c.S.aura = 1; for (let k = 0; k < 4; k++) bxBeam(c, { x: c.cx, y: c.cy, ang: k * PI / 2 + .4, spin: .5, len: 640, w: 8, tel: 1, t: 6, dmg: Math.round(e.dmg * .5), col: '#fff7c2', col2: '#ffffff' }); }
  },
  hurt(c, e, dmg) { return c && c.ph === 2 && bxMinCount(c, 'seal') > 0 ? dmg * .22 : dmg; },
  variant: (e, c) => c ? Math.max(0, Math.min(3, c.ph - 1)) : 0,
  moves: {
    // Estágio I — terra
    *judge(c, e) {
      const z = bxTele(c, { follow: G.P, x: 0, y: 0, r: 34, grow: 1, r1: 66, tel: 1.2, col: '#fde68a' });
      yield 1.25; const x = z.x, y = z.y;
      bxBoom(c, x, y, 80, { tel: .04, dm: 1, col: '#fde68a' }); bxWave(c, 1, { col: '#fde68a', hh: 13 }); bxWave(c, -1, { col: '#fde68a', hh: 13 }); shake(8); yield 1;
    },
    *quake(c) { c.free = true; if (c.e.onGround) c.e.vy = -420; yield .5; bxWave(c, 1, { col: '#fbbf24', hh: 14 }); bxWave(c, -1, { col: '#fbbf24', hh: 14 }); bxRain(c, 4, { speed: 340, r: 10, shape: 'rock', col: '#a8a29e', col2: '#fbbf24', dm: .55, life: 3 }); yield 1; },
    // Estágio II — terra (selos)
    *seals(c) { c.free = true; if (bxMinCount(c, 'seal') === 0) { for (let k = 0; k < 4; k++) bxSeal(c, k); } yield .8; for (let k = 0; k < 4; k++) { bxCol(c, c.px + rnd(-200, 200), { w: 30, h: 380, tel: .6, dm: .6, col: '#fde68a' }); yield .2; } yield .9; },
    *slam(c, e) { c.free = true; yield .6; bxBoom(c, c.cx, c.cy + 30, 90, { tel: .08, dm: .8 }); bxWave(c, 1, { col: '#fde68a', hh: 15 }); bxWave(c, -1, { col: '#fde68a', hh: 15 }); if (e.onGround) e.vy = -380; shake(9); yield 1.1; },
    // Estágio III — céu (asas)
    *wings(c) { c.free = true; bxBeam(c, { x: c.cx, y: c.cy, ang: .2, spin: .95, len: 620, w: 9, tel: .7, t: 4.6, dmg: Math.round(c.e.dmg * .6), col: '#fff7c2', col2: '#ffffff' }); bxBeam(c, { x: c.cx, y: c.cy, ang: PI + .2, spin: -.95, len: 620, w: 9, tel: .7, t: 4.6, dmg: Math.round(c.e.dmg * .6), col: '#fde68a', col2: '#ffffff' }); yield 4.8; },
    *plume(c) { c.free = true; for (let k = 0; k < 4; k++) { bxFan(c, 6, .15, { speed: 320, r: 7, shape: 'feather', col: '#fde68a', col2: '#fff7c2', dm: .45, life: 2.8, spin: 6 }); yield .45; } },
    *dive(c) { c.free = true; yield .3; yield* bxDash(c, 700, .8); bxBoom(c, c.cx, c.cy, 80, { tel: .08, dm: .8 }); shake(7); yield 1; },
    // Estágio IV — céu (apoteose)
    *nova(c) { c.free = true; for (let k = 0; k < 3; k++) { bxRing(c, 22, { speed: 260, r: 8, shape: 'star', col: '#fff7c2', col2: '#ffffff', glow: '#fde68a', dm: .5, life: 3, off: k * .18 }); yield .5; } },
    *collapse(c) { c.free = true; for (let k = 0; k < 6; k++) { bxZone(c, { x: c.px + rnd(-220, 220), y: c.py + rnd(-120, 60), r: 50, tel: .6, t: 1.5, kind: 'pull', k: 700, core: 34, dmg: Math.round(c.e.dmg * .45), col: '#fde68a' }); yield .18; } yield 1.2; },
    *final(c, e) { c.free = true; addText(c.cx, e.y - 50, 'APOTEOSE', '#ffffff', 18, 1.6); for (let k = 0; k < 8; k++) { bxCol(c, c.px + (k - 3.5) * 56, { w: 26, h: 420, tel: .5 + (k % 3) * .12, dm: .8, col: '#fde68a' }); } yield 1.6; bxRing(c, 24, { speed: 300, r: 8, shape: 'star', col: '#ffffff', col2: '#fff7c2', dm: .6, life: 3 }); shake(10); yield 1; },
  },
  pick(c) { const L = [['judge', 'quake'], ['seals', 'slam', 'quake'], ['wings', 'plume', 'dive'], ['nova', 'collapse', 'final', 'nova']][Math.max(0, Math.min(3, c.ph - 1))]; return L[c.i++ % L.length]; },
});
function bxSeal(c, k) {
  const a = k / 4 * TAU;
  return bxMin(c, { x: c.cx + Math.cos(a) * 96, y: c.cy + Math.sin(a) * 70, look: 'mirror', w: 20, h: 26, hp: 6000, fly: 1, tag: 'seal', name: 'Selo', col: '#fde68a', dm: .2,
    mf: (q) => { const t = G.t * .8 + k * 1.6; q.vx = Math.cos(t) * 110; q.vy = Math.sin(t) * 70; } });
}
