/* ============================================================
   13g_bx_a4: chefes novos do Ato IV · Além do Colosso (12). Motor em 13c_bossx.js; arte em 05j_bxart4.js.
   ============================================================ */
const bxBleedHit = () => { const P = G.P, b = P.buffs.bleed; bxBuff('bleed', 6, { dmg: 5, stacks: Math.min(5, ((b && b.stacks) || 0) + 1) }); };

bx('arauto', {
  n: 'Arauto do Vazio', act: 4, w: 60, h: 80, hp: 26000, dmg: 90, def: 20, spd: 170, coin: [500, 700], fly: 1, sword: 's107', rec: 'celestial_bar:6,e_shadow:8,e_time:3',
  mech: 'inverte a gravidade: depois de um aviso você flutua para o alto por mais de dois segundos, sem controle da queda.',
  shot: 'orb', loco: ['hover', { h: -120, sx: 130, spd: 170 }], kit: [['orbs', 'invert'], ['orbs', 'invert', 'rift'], ['invert', 'rift', 'orbs', 'claws']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *orbs(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRing(c, 10, { speed: 150, r: 8, shape: 'orb', col: '#8b5cf6', col2: '#ddd6fe', glow: '#a78bfa', off: k * .3, homing: false, dm: .5, life: 3.6 }); bxFan(c, 3, .3, { speed: 220, r: 7, shape: 'orb', col: '#7c3aed', col2: '#ddd6fe', homing: true, steer: 1, dm: .55, life: 4 }); yield .9; } },
    *invert(c, e) { addText(pcx(G.P), G.P.y - 24, 'GRAVIDADE!', '#a78bfa', 14, 1.2); bxTele(c, { follow: G.P, x: c.px, y: c.py, r: 40, tel: 1, col: '#8b5cf6' }); sfx('portal', .6); yield 1; bxBuff('gravflip', 2.4); ringFx(c.px, c.py, 60, '#8b5cf6', .5, 4); c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .22, { speed: 260, r: 7, shape: 'orb', col: '#8b5cf6', col2: '#fff', dm: .5, life: 3 }); yield .7; } },
    *rift(c) { for (let k = 0; k < 6; k++) { bxCol(c, c.px + rnd(-180, 180), { w: 30, h: 360, tel: .85, col: '#7c3aed' }); yield .28; } yield 1; },
    *claws(c) { yield .45; burst(c.cx, c.cy, 12, { col: ['#8b5cf6', '#fff'], spd: 100, glow: true, life: .4 }); yield* bxDash(c, 580, .55); },
  },
});

bx('leviata', {
  n: 'Leviatã Celeste', act: 4, w: 130, h: 60, hp: 30000, dmg: 96, def: 20, spd: 170, coin: [560, 780], fly: 1, noclip: 1, sword: 's085', rec: 'celestial_bar:6,e_water:8,e_light:4',
  mech: 'manda uma muralha de água atravessar a tela inteira com apenas uma brecha; é preciso alinhar a altura e passar por ela.',
  shot: 'orb', loco: ['orbit', { r: 280, h: -120, spd: 170, w: .5 }], kit: [['spray', 'wall'], ['spray', 'wall', 'dive'], ['wall', 'dive', 'spray', 'wall']], cds: [1.5, 1.2, .95], bob: 3,
  moves: {
    *spray(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .2, { speed: 270, r: 8, shape: 'orb', col: '#38bdf8', col2: '#e0f2fe', dm: .55, life: 3 }); yield .6; } },
    *wall(c, e) {
      for (let w = 0; w < (c.ph > 1 ? 2 : 1); w++) {
        const dir = (w ? -1 : 1) * (Math.random() < .5 ? 1 : -1), sx = c.px - dir * 560, base = c.py - 190, gap = Math.floor(rnd(2, 10)); addText(c.px, c.py - 70, dir > 0 ? 'Muralha →' : '← Muralha', '#38bdf8', 13, 1);
        for (let i = 0; i < 15; i++) { if (i >= gap && i < gap + 3) continue; spawnProj({ friendly: false, kind: 'linear', shape: 'orb', x: sx, y: base + i * 26, vx: dir * 215, vy: 0, r: 10, dmg: Math.round(e.dmg * .7), kb: 150, life: 6, col: '#38bdf8', col2: '#e0f2fe', glow: '#38bdf8', glowR: 26, tiles: false, pierce: 1, noAim: true }); }
        yield 1.1;
      }
      yield 1.4;
    },
    *dive(c, e) { yield* bxHold(c, .7, () => bxSteer(c, c.px - (c.dx > 0 ? 300 : -300), c.py - 80, 300)); yield .3; yield* bxDash(c, 560, 1, { tx: c.px, ty: c.py - 40, flat: false }); yield .4; },
  },
});

bx('imperador_solar', {
  n: 'Imperador Solar', act: 4, w: 70, h: 70, hp: 32000, dmg: 100, def: 22, spd: 160, coin: [600, 820], fly: 1, sword: 's111', rec: 'celestial_bar:8,e_light:10,e_fire:6',
  mech: 'tece uma grade de raios de luz cruzados; só os quadrados vazios entre as linhas são seguros.',
  shot: 'fire', loco: ['hover', { h: -130, sx: 120, spd: 160 }], kit: [['flare', 'grid'], ['flare', 'grid', 'rays'], ['grid', 'rays', 'flare', 'grid']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *flare(c) { c.free = true; for (let k = 0; k < 2; k++) { const p = bxShot(c, { speed: 250, r: 14, shape: 'fire', col: '#fde047', dm: .8, life: 3.4 }); p.onDie = (q, why) => { if (why !== 'life') bxBoom(c, q.x, q.y, 58, { tel: .1, dm: .6, col: '#fde047' }); }; yield .8; } },
    *grid(c, e) {
      const spin = c.ph > 2 ? .22 : 0;
      for (let k = 0; k < 4; k++) { const y = c.py + (k - 1.5) * 76; bxBeam(c, { x: c.px - 520, y, ang: 0, len: 1040, w: 9, tel: 1.1, t: 2, spin, dmg: Math.round(e.dmg * .8), col: '#fde047', col2: '#fff', rate: .15 }); const x = c.px + (k - 1.5) * 96; bxBeam(c, { x, y: c.py - 320, ang: PI / 2, len: 640, w: 9, tel: 1.1, t: 2, spin: -spin, dmg: Math.round(e.dmg * .8), col: '#fde047', col2: '#fff', rate: .15 }); }
      sfx('portal', .6); yield 2.4;
    },
    *rays(c, e) { c.free = true; for (let k = 0; k < 6; k++) bxBeam(c, { follow: true, ang: k * TAU / 6, spin: .8, len: 230, w: 6, tel: .8, t: 3.6, dmg: Math.round(e.dmg * .65), col: '#fde047', col2: '#fff', rate: .15 }); yield 3.8; },
  },
});

bx('lua_sangrenta', {
  n: 'Lua Sangrenta', act: 4, w: 76, h: 76, hp: 28000, dmg: 92, def: 20, spd: 150, coin: [520, 740], fly: 1, sword: 's110', rec: 'celestial_bar:8,e_blood:10,e_shadow:4', cond: { night: 1 },
  mech: 'cada acerto dela abre um sangramento que acumula até 5 vezes; o sangue corrói a vida sem parar.',
  shot: 'orb', loco: ['hover', { h: -135, sx: 140, spd: 150 }], kit: [['drops', 'eye'], ['drops', 'eye', 'tentacles'], ['eye', 'tentacles', 'drops', 'moonfall']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *drops(c) { c.free = true; for (let k = 0; k < 2; k++) { const L = bxRain(c, 9, { speed: 300, r: 6, shape: 'orb', col: '#dc2626', col2: '#fecaca', dm: .45, life: 3 }); for (const p of L) p.onHit = bxBleedHit; yield .8; } },
    *eye(c, e) { bxBeam(c, { follow: true, aim: true, ang: 0, len: 620, w: 8, tel: 1, t: 1.6, dmg: Math.round(e.dmg * .7), col: '#ef4444', col2: '#fecaca', buff: 'bleed', bt: 6, bd: { dmg: 5, stacks: 2 } }); yield 2; },
    *tentacles(c) { for (let k = 0; k < 4; k++) { const x = c.px + (k - 1.5) * 80 + rnd(-20, 20), gy = groundY(x, c.py, 40); if (gy > 0) { bxTele(c, { x: x - 14, y: gy - 6, w: 28, h: 6, tel: .8, col: '#dc2626' }); const p = spawnProj({ friendly: false, kind: 'static', shape: 'tentacle', x, y: gy - 38, hw: 11, hh: 38, delay: .8, life: .8, dmg: Math.round(c.e.dmg * .7), kb: 120, col: '#7f1d1d', col2: '#ef4444', tiles: false, pierce: 1, glow: '#dc2626', glowR: 20 }); p.onHit = bxBleedHit; } yield .25; } yield 1; },
    *moonfall(c) { c.free = true; for (let k = 0; k < 2; k++) { const L = bxRing(c, 12, { speed: 200, r: 9, shape: 'blade', col: '#dc2626', col2: '#fecaca', off: k * .26, dm: .5, life: 3, spin: 8 }); for (const p of L) p.onHit = bxBleedHit; yield .9; } },
  },
});

bx('tempo', {
  n: 'Senhor do Tempo', act: 4, w: 54, h: 84, hp: 34000, dmg: 98, def: 22, spd: 160, coin: [620, 860], fly: 1, sword: 's105', rec: 'celestial_bar:8,e_time:10,e_light:4',
  mech: 'cria bolhas de tempo: dentro delas você anda e ataca em câmera lenta, e os tiros que passam ficam mais rápidos.',
  shot: 'orb', loco: ['hover', { h: -125, sx: 130, spd: 160 }], kit: [['sand', 'bubble'], ['sand', 'bubble', 'clock'], ['bubble', 'clock', 'blink', 'sand']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *sand(c) { c.free = true; for (let k = 0; k < 14; k++) { bxShot(c, { spread: rnd(-.14, .14), speed: 300, r: 4, shape: 'orb', col: '#99f6e4', col2: '#fff', dm: .35, life: 2.6 }); yield .09; } yield .4; },
    *bubble(c, e) {
      c.free = true; for (let k = 0; k < (c.ph > 1 ? 2 : 1); k++) {
        const z = bxZone(c, { x: c.px + (k ? 150 : 0), y: c.py - 20, r: 98, tel: .7, t: 6.5, kind: 'slow', mult: .45, col: '#2dd4bf', rim: '#ccfbf1', alpha: .16, glow: true });
        z.fn = (zz, dt, inside) => { if (inside) addBuff('slowatk', .3, { amt: .5 }); for (const p of G.projs) if (!p.friendly && !p.sped && Math.hypot(p.x - zz.x, p.y - zz.y) < zz.r) { p.vx *= 1.7; p.vy *= 1.7; p.sped = 1; } zz.x += Math.sign(pcx(G.P) - zz.x) * 16 * dt; };
        yield .5;
      }
      yield 1.2;
    },
    *clock(c, e) { c.free = true; bxBeam(c, { follow: true, ang: -PI / 2, spin: 1.1, len: 230, w: 7, tel: .7, t: 3.4, dmg: Math.round(e.dmg * .65), col: '#2dd4bf', col2: '#fff', rate: .15 }); bxBeam(c, { follow: true, ang: PI / 2, spin: .35, len: 150, w: 9, tel: .7, t: 3.4, dmg: Math.round(e.dmg * .65), col: '#14b8a6', col2: '#fff', rate: .15 }); yield 3.6; },
    *blink(c) { burst(c.cx, c.cy, 12, { col: ['#2dd4bf', '#fff'], spd: 100, glow: true, life: .5 }); yield .3; bxTp(c, c.px + (Math.random() < .5 ? -1 : 1) * 160, c.py - 70); yield .3; bxFan(c, 7, .2, { speed: 290, r: 5, shape: 'orb', col: '#99f6e4', col2: '#fff', dm: .5, life: 3 }); yield .6; },
  },
});

bx('dragao_cristal', {
  n: 'Dragão de Cristal Estelar', act: 4, w: 96, h: 64, hp: 36000, dmg: 104, def: 24, spd: 175, coin: [660, 900], fly: 1, sword: 's109', rec: 'celestial_bar:8,e_ice:8,e_lightning:6',
  mech: 'dispara espirais de cristal com braços que giram; os vãos entre os braços se movem e você precisa acompanhá-los.',
  shot: 'shard', loco: ['orbit', { r: 270, h: -120, spd: 175, w: .6 }], kit: [['spiral', 'shards'], ['spiral', 'breath', 'shards'], ['spiral', 'breath', 'dive', 'spiral']], cds: [1.4, 1.1, .85],
  moves: {
    *spiral(c) { c.free = true; let a = rnd(TAU); const n = c.ph > 1 ? 4 : 3; for (let k = 0; k < 64; k++) { for (let i = 0; i < n; i++) bxShot(c, { ang: a + i / n * TAU, speed: 190, r: 6, shape: 'shard', col: '#c4b5fd', col2: '#fff', dm: .5, life: 4.2, nolight: k % 3 !== 0 }); a += .26; yield .07; } yield .5; },
    *shards(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .22, { speed: 310, r: 6, shape: 'shard', col: '#e9d5ff', col2: '#fff', dm: .55, life: 3 }); yield .55; } },
    *breath(c, e) { bxBeam(c, { follow: true, aim: true, ang: 0, len: 640, w: 10, tel: 1, t: 2.2, spin: 0, dmg: Math.round(e.dmg * .75), col: '#c4b5fd', col2: '#fff', rate: .12 }); yield 2.4; },
    *dive(c) { yield .5; burst(c.cx, c.cy, 12, { col: ['#c4b5fd', '#fff'], spd: 100, glow: true, life: .5 }); yield* bxDash(c, 600, .7); },
  },
});

bx('titereiro', {
  n: 'Titereiro', act: 4, w: 50, h: 74, hp: 30000, dmg: 94, def: 20, spd: 165, coin: [560, 780], fly: 1, sword: 's106', rec: 'celestial_bar:6,e_shadow:6,e_blood:4',
  mech: 'amarra fios em você: se os fios conectarem, seus comandos ficam invertidos por mais de três segundos.',
  shot: 'needle', loco: ['hover', { h: -120, sx: 140, spd: 165 }], kit: [['knives', 'strings'], ['knives', 'strings', 'puppets'], ['strings', 'puppets', 'knives', 'dance']], cds: [1.3, 1.0, .8], bob: 3,
  moves: {
    *knives(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .2, { speed: 330, r: 5, shape: 'needle', col: '#f472b6', col2: '#fff', dm: .55, life: 2.6 }); yield .55; } },
    *strings(c, e) {
      for (let k = -1; k <= 1; k++) bxBeam(c, { follow: true, aim: true, ang: 0, len: 480, w: 2, tel: 1.2, t: 1.3, noHit: true, col: '#f9a8d4', col2: '#fff', oy: k * 3 });
      addText(c.cx, e.y - 12, 'Fios!', '#f472b6', 14, 1); sfx('portal', .5); yield 1.25;
      const P = G.P; if (!P.dead && c.dist < 500 && los(c.cx, c.cy, pcx(P), pcy(P))) { hurtPlayer(Math.round(e.dmg * .5), c.cx, 0); bxBuff('confuse', 3.4); P.vx += (c.cx > pcx(P) ? 1 : -1) * 260; addText(P.x, P.y - 18, 'Confuso!', '#f472b6', 13, 1.2); } else addText(P.x, P.y - 18, 'Soltou!', '#f472b6', 11, .8);
      yield .5;
    },
    *puppets(c, e) {
      c.free = true; for (let k = 0; k < 3; k++) { if (bxMinCount(c, 'pup') >= 3) break; bxMin(c, { x: c.cx + (k - 1) * 70, y: c.cy + 20, w: 18, h: 22, hp: 120, look: 'skull', col: '#f472b6', dm: .3, tag: 'pup', life: 12, name: 'Marionete', mf: (q, dt) => { q.t = (q.t || 0) + dt; const P = G.P; steerFly(q, 2 * pcx(P) - ecx(q.owner) + (k - 1) * 40, pcy(P) + Math.sin(q.t * 2 + k) * 30, 130, 2, dt); q.sh = (q.sh === undefined ? 1 + k * .5 : q.sh) - dt; if (q.sh <= 0) { q.sh = 2.2; bxShot({ e: q.owner, d: q.owner.d.bx, cx: ecx(q), cy: ecy(q), px: pcx(P), py: pcy(P) }, { speed: 270, r: 5, shape: 'needle', col: '#f472b6', col2: '#fff', dm: .4, life: 3 }); } } }); yield .4; }
      yield .8;
    },
    *dance(c, e) { const dir = c.dx > 0 ? 1 : -1; for (let k = 0; k < 3; k++) { yield* bxHold(c, .35, () => { e.vx = dir * (k % 2 ? -1 : 1) * 380; e.vy = Math.sin(c.t * 14) * 180; }); bxShot(c, { speed: 300, r: 5, shape: 'needle', col: '#f472b6', col2: '#fff', dm: .5, life: 2.6 }); } },
  },
});

bx('catedral', {
  n: 'Catedral Caída', act: 4, w: 120, h: 110, hp: 38000, dmg: 110, def: 26, spd: 60, coin: [700, 960], fly: 1, noclip: 1, sword: 's097', rec: 'celestial_bar:10,e_light:8,obsidian:30',
  mech: 'ataca no ritmo de um coro: conta quatro batidas e solta a explosão na quarta, sempre com brechas para atravessar.',
  still: true, shot: 'orb', loco: ['hover', { h: -150, sx: 200, spd: 70, k: 1 }], kit: [['choir', 'windows'], ['choir', 'windows', 'gargoyles'], ['choir', 'gargoyles', 'windows', 'choir']], cds: [1.6, 1.3, 1],
  moves: {
    *choir(c, e) {
      for (let r = 0; r < (c.ph > 1 ? 2 : 1); r++) {
        for (let b = 1; b <= 4; b++) { addText(c.cx, e.y - 10, String(b), '#fcd34d', 20, .5); ringFx(c.cx, c.cy + 20, 30 + b * 8, '#fcd34d', .35, 2); sfx('tick'); if (b === 4) { bxRing(c, 28, { speed: 210, r: 7, shape: 'orb', col: '#fcd34d', col2: '#fff', off: rnd(TAU), dm: .55, life: 3.6 }); /* brechas: apaga 3 pontos do anel */ } yield .5; }
        // a quarta batida também derruba colunas de luz
        for (let k = 0; k < 4; k++) bxCol(c, c.px + (k - 1.5) * 90 + rnd(-20, 20), { w: 28, h: 380, tel: .8, col: '#fcd34d', fire: true });
        yield 1.4;
      }
    },
    *windows(c, e) { c.free = true; for (let k = 0; k < 8; k++) bxBeam(c, { follow: true, oy: -20, ang: k * TAU / 8, spin: .55, len: 260, w: 7, tel: .9, t: 4, dmg: Math.round(e.dmg * .6), col: '#f0abfc', col2: '#fff', rate: .15 }); yield 4.2; },
    *gargoyles(c, e) { c.free = true; for (let k = 0; k < 2; k++) { if (G.enemies.filter(x => x.k === 'imp' && x.owner === e && !x.dead).length < 3) bxSpawn(c, 'imp', c.cx + (k ? 70 : -70), c.cy + 10, { hp: 300, dm: .3 }); yield .5; } yield .6; },
  },
});

bx('kraken', {
  n: 'Kraken do Éter', act: 4, w: 100, h: 80, hp: 35000, dmg: 100, def: 24, spd: 90, coin: [660, 900], fly: 1, noclip: 1, sword: 's053', rec: 'celestial_bar:8,e_water:10,e_poison:6',
  mech: 'tentáculos brotam sob seus pés e agarram: quem for pego fica preso por um instante e é puxado em direção ao Kraken.',
  shot: 'orb', loco: ['hover', { h: -130, sx: 100, spd: 90 }], kit: [['ink', 'grab'], ['ink', 'grab', 'slap'], ['grab', 'slap', 'ink', 'grab']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *ink(c) { c.free = true; bxRing(c, 14, { speed: 140, r: 8, shape: 'orb', col: '#134e4a', col2: '#2dd4bf', glow: '#2dd4bf', dm: .5, life: 3.6 }); const S = bxS(); S.dark = { t: G.t + 1.6, a: .75, holes: [[pcx(G.P), pcy(G.P), 100], [c.cx, c.cy, 120]] }; yield 1.2; bxFan(c, 5, .22, { speed: 230, r: 7, shape: 'orb', col: '#134e4a', col2: '#2dd4bf', homing: true, steer: 1, dm: .55, life: 3.6 }); yield .8; },
    *grab(c, e) {
      for (let k = 0; k < 3; k++) { const x = c.px + (k - 1) * 64 + rnd(-14, 14), gy = groundY(x, c.py, 40); if (gy < 0) continue; bxTele(c, { x: x - 16, y: gy - 6, w: 32, h: 6, tel: 1, col: '#2dd4bf' }); const p = spawnProj({ friendly: false, kind: 'static', shape: 'tentacle', x, y: gy - 46, hw: 13, hh: 46, delay: 1, life: .9, dmg: Math.round(e.dmg * .7), kb: 0, col: '#0f766e', col2: '#5eead4', tiles: false, pierce: 1, glow: '#2dd4bf', glowR: 22 }); p.onHit = () => { bxBuff('stun', 1.1); const P = G.P; P.vx = (c.cx > pcx(P) ? 1 : -1) * 300; P.vy = -120; addText(P.x, P.y - 18, 'Agarrado!', '#5eead4', 13, 1); }; }
      yield 2.4;
    },
    *slap(c) { bxWave(c, 1, { x: c.px - 200, y: c.py + 40, col: '#0f766e', speed: 330, hh: 14 }); bxWave(c, -1, { x: c.px + 200, y: c.py + 40, col: '#0f766e', speed: 330, hh: 14 }); yield 1.1; },
  },
});

bx('arquiteto', {
  n: 'Arquiteto Celestial', act: 4, w: 64, h: 74, hp: 33000, dmg: 98, def: 22, spd: 160, coin: [620, 860], fly: 1, sword: 's113', rec: 'celestial_bar:10,e_earth:8,e_time:6',
  mech: 'ergue uma jaula de projéteis em volta de você, que se fecha girando com uma brecha móvel; é preciso sair pela abertura.',
  shot: 'shard', loco: ['hover', { h: -130, sx: 130, spd: 160 }], kit: [['blocks', 'cage'], ['blocks', 'cage', 'compass'], ['cage', 'compass', 'blocks', 'cage']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *blocks(c) { c.free = true; for (let k = 0; k < 2; k++) { bxRain(c, 7, { speed: 330, r: 8, shape: 'shard', col: '#fcd34d', col2: '#fff', dm: .6, life: 3 }); yield .8; } },
    *cage(c, e) {
      const cx0 = c.px, cy0 = c.py - 10, N = 30, g0 = rnd(TAU), dmg = Math.round(e.dmg * .6); bxTele(c, { x: cx0, y: cy0, r: 150, tel: 1, col: '#fcd34d' }); sfx('portal', .6);
      for (let i = 0; i < N; i++) { const p = spawnProj({ friendly: false, kind: 'custom', shape: 'orb', x: cx0, y: cy0, r: 5, hw: 5, hh: 5, dmg, kb: 120, life: 4.6, delay: 1, col: '#fcd34d', col2: '#fff', glow: '#fbbf24', glowR: 14, tiles: false, pierce: 1 }); p.i = i; p.onUpdate = (q, dt) => { const k = Math.min(1, q.age / 3.2), R = 170 - 130 * k, a = q.i / N * TAU + q.age * .6, ga = g0 + q.age * .9, d = Math.abs(((a - ga + PI) % TAU + TAU) % TAU - PI); if (d < .42) { q.x = -9999; q.y = -9999; return; } q.x = cx0 + Math.cos(a) * R; q.y = cy0 + Math.sin(a) * R; }; }
      yield 4.4;
    },
    *compass(c, e) { c.free = true; bxBeam(c, { follow: true, ang: 0, spin: .75, len: 300, w: 7, tel: .8, t: 3.8, dmg: Math.round(e.dmg * .65), col: '#fcd34d', col2: '#fff', rate: .15 }); bxBeam(c, { follow: true, ang: PI * .66, spin: .75, len: 300, w: 7, tel: .8, t: 3.8, dmg: Math.round(e.dmg * .65), col: '#fcd34d', col2: '#fff', rate: .15 }); yield 4; },
  },
});

bx('pulsar', {
  n: 'Coração da Galáxia', act: 4, w: 80, h: 80, hp: 40000, dmg: 108, def: 26, spd: 150, coin: [720, 980], fly: 1, noclip: 1, sword: 's119', rec: 'celestial_bar:12,e_light:8,e_lightning:8,e_time:6',
  mech: 'dois jatos de luz giram como num pulsar, enquanto ondas de choque no chão batem no ritmo do coração: é preciso pular.',
  shot: 'orb', loco: ['hover', { h: -125, sx: 120, spd: 150 }], kit: [['jets', 'pulse'], ['jets', 'pulse', 'novas'], ['pulse', 'collapse', 'jets', 'novas']], cds: [1.4, 1.1, .85], bob: 3,
  moves: {
    *jets(c, e) { c.free = true; const s = (Math.random() < .5 ? -1 : 1) * .8 * (c.ph > 2 ? 1.3 : 1); for (const a of [0, PI]) bxBeam(c, { follow: true, ang: a + 1.2, spin: s, len: 560, w: 9, tel: .8, t: 4.2, dmg: Math.round(e.dmg * .7), col: '#f0abfc', col2: '#fff', rate: .15 }); yield 4.4; },
    *pulse(c) { for (let k = 0; k < 3; k++) { bxWave(c, 1, { x: c.cx, y: c.py + 60, col: '#f0abfc', speed: 340, hh: 15, dm: .8 }); bxWave(c, -1, { x: c.cx, y: c.py + 60, col: '#f0abfc', speed: 340, hh: 15, dm: .8 }); ringFx(c.cx, c.cy, 60, '#f0abfc', .4, 3); sfx('boom', .3); yield .75; } yield .5; },
    *novas(c) { c.free = true; for (let k = 0; k < 4; k++) { bxShot(c, { speed: 200, spread: rnd(-.5, .5), r: 8, shape: 'orb', col: '#f0abfc', col2: '#fff', homing: true, steer: 1.2, dm: .55, life: 4.2 }); yield .45; } },
    *collapse(c, e) { c.free = true; ringFx(c.cx, c.cy, 120, '#f0abfc', .8, 4); bxZone(c, { follow: e, x: c.cx, y: c.cy, r: 300, kind: 'pull', k: 700, tel: .4, t: 2.4, core: 30, dmg: Math.round(e.dmg * .5), col: '#f0abfc', rim: '#fff', alpha: .08, glow: true }); yield 2.2; bxRing(c, 20, { speed: 280, r: 7, shape: 'orb', col: '#f0abfc', col2: '#fff', dm: .6, life: 3 }); shake(8); sfx('boom', .6); yield .8; },
  },
});

bx('forjador', {
  n: 'Mestre Forjador', act: 4, w: 80, h: 96, hp: 42000, dmg: 112, def: 28, spd: 82, coin: [800, 1100], sword: 's120', rec: 'celestial_bar:14,mythic_core:2,e_fire:10',
  mech: 'aprende a resistir à espada que você mais usa: cada golpe da mesma lâmina enfraquece o seguinte. É preciso trocar de espada.',
  shot: 'fire', loco: ['walk', { spd: 78, jump: 480 }], kit: [['sparks', 'hammer'], ['sparks', 'hammer', 'anvil'], ['anvil', 'molten', 'hammer', 'sparks']], cds: [1.2, .95, .75],
  init(c) { c.S.ad = {}; c.S.msg = 0; },
  hurt(c, e, dmg, h) { if (!c) return dmg; const id = h.sword && h.sword.id, a = (id && c.S.ad[id]) || 0, m = Math.max(.3, 1 / (1 + a / 14)); if (m < .6 && G.t - c.S.msg > 2) { c.S.msg = G.t; addText(ecx(e), e.y - 6, 'Adaptado!', '#fb923c', 12, .9); } return dmg * m; },
  after(c, e, dmg, h) { const id = h.sword && h.sword.id; if (c && id) c.S.ad[id] = (c.S.ad[id] || 0) + 1; },
  passive(c) { for (const k in c.S.ad) c.S.ad[k] = Math.max(0, c.S.ad[k] - c.dt * .8); },
  moves: {
    *sparks(c) { c.free = true; for (let k = 0; k < 3; k++) { bxFan(c, 5, .2, { y: c.cy - 20, speed: 310, r: 6, shape: 'fire', dm: .5, life: 2.6 }); yield .55; } },
    *hammer(c) { c.free = true; yield .4; const p = bxShot(c, { y: c.cy - 30, speed: 340, r: 12, shape: 'blade', col: '#94a3b8', col2: '#fb923c', dm: .9, life: 3.2, spin: 12, noAim: true }); bxBack(c, p, .9, 340); yield 1.5; },
    *anvil(c, e) { yield .5; if (e.onGround) e.vy = -520; yield .6; bxWave(c, 1, { col: '#fb923c', hh: 14, dm: .9 }); bxWave(c, -1, { col: '#fb923c', hh: 14, dm: .9 }); bxRain(c, 5, { speed: 360, r: 12, shape: 'rock', col: '#475569', col2: '#fb923c', dm: .7, life: 3 }); shake(8); sfx('boom', .6); yield .9; },
    *molten(c, e) { c.free = true; for (let k = 0; k < 3; k++) { const p = bxShot(c, { y: c.cy - 40, speed: 300, spread: rnd(-.25, .25) - .3, r: 10, shape: 'meteor', col: '#fb923c', col2: '#fde68a', kind: 'ballistic', grav: 640, dm: .7, life: 3.6, spin: 5 }); p.onDie = (q, why) => { if (why !== 'life') { bxBoom(c, q.x, q.y, 38, { tel: .1, dm: .5, col: '#fb923c' }); bxZone(c, { x: q.x, y: q.y + 4, r: 22, kind: 'fire', t: 4, dmg: Math.round(e.dmg * .12), tick: .3, col: '#fb923c', rim: '#fde68a', alpha: .3, glow: true }); } }; yield .6; } },
  },
});
