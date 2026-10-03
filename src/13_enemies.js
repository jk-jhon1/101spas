/* ============================================================
   13_enemies: definições, IA, spawn por bioma/camada, drops
   ============================================================ */
const ED = {};
function enemy(k, o) { ED[k] = Object.assign({ k, kind: 'walker', w: 12, h: 26, hp: 20, dmg: 10, def: 0, spd: 60, mass: 1, kbr: 0, coins: [0, 1], drops: [], col: '#888', col2: '#555', blood: '#c0392b' }, o); }
const gelDrop = (a, b, p = 1) => ['gel', a, b, p];
// slimes
enemy('slime_green', { n: 'Slime Verde', kind: 'slime', w: 20, h: 14, hp: 14, dmg: 8, spd: 85, col: '#4ade80', col2: '#bbf7d0', blood: '#4ade80', drops: [gelDrop(1, 2)], coins: [0, 1], light: 1 });
enemy('slime_blue', { n: 'Slime Azul', kind: 'slime', w: 22, h: 16, hp: 24, dmg: 12, spd: 90, col: '#60a5fa', col2: '#dbeafe', blood: '#60a5fa', drops: [gelDrop(1, 3)], coins: [0, 2], light: 1 });
enemy('slime_red', { n: 'Slime Vermelho', kind: 'slime', w: 22, h: 16, hp: 42, dmg: 17, spd: 100, col: '#f87171', col2: '#fecaca', blood: '#f87171', drops: [gelDrop(2, 3), ['lens', 1, 1, .04]], coins: [1, 3], light: 1 });
enemy('slime_sand', { n: 'Slime de Areia', kind: 'slime', w: 22, h: 16, hp: 34, dmg: 13, spd: 90, col: '#e9c46a', col2: '#fff3c4', blood: '#e9c46a', drops: [gelDrop(1, 2)], coins: [1, 2], light: 1 });
enemy('slime_ice', { n: 'Slime de Gelo', kind: 'slime', w: 22, h: 16, hp: 36, dmg: 14, spd: 90, col: '#a5f3fc', col2: '#ecfeff', blood: '#a5f3fc', drops: [gelDrop(1, 2), ['frost_shard', 1, 1, .12]], coins: [1, 2], light: 1 });
enemy('slime_jungle', { n: 'Slime da Selva', kind: 'slime', w: 22, h: 16, hp: 40, dmg: 15, spd: 95, col: '#84cc16', col2: '#d9f99d', blood: '#84cc16', drops: [gelDrop(1, 3), ['stinger', 1, 1, .08]], coins: [1, 3], light: 1 });
enemy('slime_purple', { n: 'Slime Roxo', kind: 'slime', w: 24, h: 18, hp: 56, dmg: 19, spd: 100, col: '#c084fc', col2: '#f3e8ff', blood: '#c084fc', drops: [gelDrop(2, 4)], coins: [2, 4], light: 1 });
enemy('slime_lava', { n: 'Slime de Lava', kind: 'slime', w: 26, h: 20, hp: 100, dmg: 32, spd: 105, col: '#fb923c', col2: '#fde68a', blood: '#fb923c', drops: [gelDrop(2, 4), ['coal', 1, 3, .35]], coins: [3, 6], glowc: '#fb923c', fire: 1 });
// mortos-vivos e terrestres
enemy('zombie', { n: 'Zumbi', kind: 'walker', draw: 'humanoid', hp: 48, dmg: 17, def: 1, spd: 52, undead: 1, col: '#6b9a6b', col2: '#3a5a3a', drops: [['bone', 1, 1, .2]], coins: [1, 3] });
enemy('zombie_desert', { n: 'Múmia', kind: 'walker', draw: 'humanoid', hp: 74, dmg: 21, def: 3, spd: 48, undead: 1, col: '#d6c8a0', col2: '#a89868', drops: [['bone', 1, 2, .3]], coins: [2, 4] });
enemy('zombie_ice', { n: 'Zumbi Congelado', kind: 'walker', draw: 'humanoid', hp: 86, dmg: 23, def: 3, spd: 50, undead: 1, col: '#9bd0e8', col2: '#5a8aa8', drops: [['bone', 1, 1, .25], ['frost_shard', 1, 1, .1]], coins: [2, 4], light: 0 });
enemy('skeleton', { n: 'Esqueleto', kind: 'walker', draw: 'skeleton', hp: 64, dmg: 21, def: 2, spd: 62, undead: 1, col: '#e8e4d0', col2: '#a8a490', drops: [['bone', 1, 2, .6]], coins: [2, 4], blood: '#e8e4d0' });
enemy('skeleton_archer', { n: 'Esqueleto Arqueiro', kind: 'archer', draw: 'skeleton', hp: 56, dmg: 20, def: 2, spd: 54, undead: 1, col: '#d8d4c0', col2: '#8a8670', drops: [['bone', 1, 2, .5]], coins: [2, 5], blood: '#e8e4d0', bow: 1 });
enemy('mushroom_walker', { n: 'Cogumelo Ambulante', kind: 'walker', draw: 'mush', w: 14, h: 22, hp: 58, dmg: 17, spd: 46, col: '#38bdf8', col2: '#bae6fd', drops: [['glow_mushroom', 1, 2, .6], ['spore', 1, 3, .55]], coins: [1, 3], glowc: '#38bdf8', blood: '#7dd3fc' });
enemy('wolf', { n: 'Lobo', kind: 'walker', draw: 'wolf', w: 26, h: 16, hp: 66, dmg: 21, spd: 125, col: '#9ca3af', col2: '#4b5563', drops: [['bone', 1, 1, .15]], coins: [1, 3], sight: 620 });
enemy('beetle', { n: 'Besouro Blindado', kind: 'walker', draw: 'beetle', w: 24, h: 16, hp: 95, dmg: 19, def: 6, spd: 42, heavy: 1, mass: 2, col: '#5a7a3a', col2: '#2f4a22', drops: [['beetle_claw', 1, 1, .35]], coins: [2, 4], blood: '#a3e635' });
enemy('golem', { n: 'Golem de Pedra', kind: 'walker', draw: 'golem', w: 22, h: 30, hp: 230, dmg: 31, def: 8, spd: 38, heavy: 1, mass: 6, kbr: .5, col: '#8b8f98', col2: '#4a4e56', drops: [['stone', 3, 8, 1]], coins: [5, 10], blood: '#9ca3af', regen: 3 });
// voadores
enemy('eye', { n: 'Olho Demoníaco', kind: 'eye', draw: 'eye', fly: 1, w: 18, h: 18, hp: 38, dmg: 15, spd: 100, col: '#f4f1ea', col2: '#d62839', drops: [['lens', 1, 1, .35]], coins: [1, 3], blood: '#dc2626', sight: 700 });
enemy('bat', { n: 'Morcego', kind: 'bat', draw: 'bat', fly: 1, w: 16, h: 10, hp: 22, dmg: 12, spd: 125, col: '#6b4a6a', col2: '#3a2a3a', drops: [['vamp_tooth', 1, 1, .15]], coins: [0, 2] });
enemy('hellbat', { n: 'Morcego Infernal', kind: 'bat', draw: 'bat', fly: 1, w: 18, h: 12, hp: 54, dmg: 24, spd: 150, col: '#ef4444', col2: '#7f1d1d', drops: [['coal', 1, 2, .25]], coins: [2, 5], glowc: '#fb923c', fire: 1 });
enemy('wasp', { n: 'Vespa', kind: 'wasp', draw: 'wasp', fly: 1, w: 18, h: 14, hp: 50, dmg: 19, spd: 110, col: '#e9b824', col2: '#3a2a10', drops: [['stinger', 1, 2, .4]], coins: [1, 3], blood: '#facc15' });
enemy('harpy', { n: 'Harpia', kind: 'harpy', draw: 'harpy', fly: 1, w: 20, h: 22, hp: 54, dmg: 18, spd: 95, col: '#f0e0c0', col2: '#a07040', drops: [['feather', 1, 3, .7]], coins: [2, 5], sight: 760 });
enemy('imp', { n: 'Diabrete', kind: 'imp', draw: 'imp', fly: 1, w: 18, h: 22, hp: 84, dmg: 26, spd: 85, col: '#dc2626', col2: '#7f1d1d', drops: [['coal', 1, 2, .3]], coins: [3, 7], glowc: '#fb923c', fire: 1, sight: 700 });
enemy('ghost', { n: 'Espectro', kind: 'ghost', draw: 'ghost', fly: 1, noclip: 1, ghostBody: 1, w: 18, h: 24, hp: 105, dmg: 25, spd: 58, col: '#e0f2fe', col2: '#7dd3fc', drops: [], coins: [3, 6], undead: 1, glowc: '#7dd3fc', blood: '#bae6fd', sight: 800 });
// aquáticos
enemy('shark', { n: 'Tubarão', kind: 'swim', draw: 'shark', swim: 1, w: 38, h: 16, hp: 115, dmg: 31, spd: 115, col: '#8aa0b4', col2: '#e8f0f6', drops: [['shark_tooth', 1, 2, .5]], coins: [3, 6], blood: '#dc2626', sight: 520 });
enemy('piranha', { n: 'Piranha', kind: 'swim', draw: 'piranha', swim: 1, w: 16, h: 9, hp: 32, dmg: 14, spd: 105, col: '#f59e0b', col2: '#3f6212', drops: [], coins: [0, 2], blood: '#dc2626', sight: 380 });
// críticas (inofensivas)
enemy('bunny', { n: 'Coelho', kind: 'critter', draw: 'bunny', w: 10, h: 8, hp: 5, dmg: 0, spd: 70, col: '#e8dccb', col2: '#fff', harmless: 1, drops: [], coins: [0, 0] });
enemy('bird', { n: 'Pássaro', kind: 'birdc', draw: 'bird', fly: 1, w: 9, h: 7, hp: 4, dmg: 0, spd: 70, col: '#60a5fa', col2: '#fff', harmless: 1, drops: [['feather', 1, 1, .15]], coins: [0, 0] });
enemy('dummy', { n: 'Boneco de Treino', kind: 'dummy', draw: 'dummy', w: 16, h: 32, hp: 1e9, dmg: 0, def: 0, kbr: .4, drops: [], coins: [0, 0], col: '#c8a46a', col2: '#6a4a2a', isDummy: 1, blood: '#c8a46a', immuneStatus: 0, mass: 1.5 });
// chefes
enemy('boss_slime', { n: 'Rei Slime', kind: 'bslime', draw: 'kslime', boss: 1, w: 70, h: 52, hp: 950, dmg: 24, def: 2, spd: 150, kbr: 1, mass: 8, col: '#60a5fa', col2: '#dbeafe', blood: '#60a5fa', drops: [], coins: [60, 90] });
enemy('boss_eye', { n: 'Olho Colossal', kind: 'beye', draw: 'beye', boss: 1, fly: 1, noclip: 1, w: 56, h: 56, hp: 3000, dmg: 32, def: 4, spd: 170, kbr: 1, mass: 8, col: '#f4f1ea', col2: '#d62839', blood: '#dc2626', drops: [], coins: [90, 140] });
enemy('boss_guardian', { n: 'Guardião do Abismo', kind: 'bguard', draw: 'bguard', boss: 1, fly: 1, noclip: 1, w: 58, h: 70, hp: 9500, dmg: 48, def: 8, spd: 150, kbr: 1, mass: 10, col: '#7f1d1d', col2: '#fb923c', blood: '#fb923c', drops: [], coins: [200, 300], glowc: '#fb923c', fire: 1 });
enemy('boss_colossus', { n: 'Colosso Estelar', kind: 'bcolossus', draw: 'bcolossus', boss: 1, fly: 1, noclip: 1, w: 90, h: 90, hp: 26000, dmg: 85, def: 12, spd: 140, kbr: 1, mass: 14, col: '#312e81', col2: '#fbbf24', blood: '#fde68a', drops: [], coins: [600, 900], glowc: '#fbbf24' });

// ---- elementos do Hardmode (dropam essências) ----
const ELEMS = {
  fire: { n: 'Flamejante', col: '#f97316', ess: 'e_fire' }, ice: { n: 'Gélido', col: '#7dd3fc', ess: 'e_ice' }, lightning: { n: 'Voltaico', col: '#fde047', ess: 'e_lightning' },
  shadow: { n: 'Sombrio', col: '#8b5cf6', ess: 'e_shadow' }, poison: { n: 'Tóxico', col: '#84cc16', ess: 'e_poison' }, light: { n: 'Radiante', col: '#fef08a', ess: 'e_light' },
  earth: { n: 'Rochoso', col: '#b4783a', ess: 'e_earth' }, water: { n: 'Abissal', col: '#38bdf8', ess: 'e_water' }, blood: { n: 'Sanguinário', col: '#ef4444', ess: 'e_blood' }, time: { n: 'Temporal', col: '#fbbf24', ess: 'e_time' },
};
const ELEM_BY = {
  forest: [['poison', 3], ['earth', 3], ['light', 3], ['blood', 1]], desert: [['fire', 3], ['earth', 3], ['lightning', 3]], snow: [['ice', 4], ['water', 2], ['shadow', 2]], jungle: [['poison', 4], ['earth', 2], ['blood', 2]], ocean: [['water', 5], ['lightning', 1]],
  sky: [['light', 3], ['lightning', 3], ['time', 2]], cave: [['earth', 3], ['shadow', 3], ['blood', 2], ['lightning', 2], ['time', .9]], deep: [['shadow', 3], ['time', 2.2], ['blood', 3], ['water', 2], ['earth', 2]], hell: [['fire', 5], ['blood', 3], ['time', 1.2]],
};
const STAGE_HP = [1, 1.5, 6, 6], STAGE_DMG = [1, 1.25, 3, 3], STAGE_DEF = [1, 1, 2, 2], STAGE_COIN = [1, 1.5, 4, 4];

function spawnEnemy(key, x, y, o) {
  o = o || {}; const d = ED[key], st = G.stage, e = {
    k: key, d, name: d.n, x, y, w: d.w, h: d.h, vx: 0, vy: 0, onGround: false, face: Math.random() < .5 ? 1 : -1, st: {}, imm: new Map(), hurtT: 0, flash: 0, kbT: 0, ai: { t: rnd(.2, 1), wander: 0 },
    hitX: 0, hitY: 0, scale: 1, dead: false, age: 0, kind: d.kind, bow: d.bow, sight: d.sight,
  };
  const boss = !!d.boss, sm = boss ? 1 : STAGE_HP[st], dm = boss ? 1 : STAGE_DMG[st];
  e.hpMax = Math.round(d.hp * sm); e.dmg = Math.round(d.dmg * dm); e.def = Math.round(d.def * (boss ? 1 : STAGE_DEF[st])); e.spd = d.spd; e.mass = d.mass; e.kbr = d.kbr; e.hp = e.hpMax;
  ['undead', 'fly', 'swim', 'noclip', 'heavy', 'light', 'harmless', 'boss', 'blood', 'col', 'col2', 'isDummy', 'regen', 'ghostBody', 'glowc', 'fire'].forEach(k => { if (d[k] !== undefined) e[k] = d[k]; });
  if (d.isDummy) { e.hp = e.hpMax = 1e9; }
  if (o.elem && !boss) { const el = ELEMS[o.elem]; e.elem = o.elem; e.name = el.n + ' ' + d.n; e.hpMax = Math.round(e.hpMax * 1.15); e.hp = e.hpMax; e.ess = el.ess; e.elemCol = el.col; e.glowc = el.col; }
  if (o.elite) { e.elite = true; e.hpMax = Math.round(e.hpMax * 3); e.hp = e.hpMax; e.dmg = Math.round(e.dmg * 1.35); e.scale = 1.25; e.w = Math.round(e.w * 1.2); e.h = Math.round(e.h * 1.2); e.name = 'Elite ' + e.name; e.coinBonus = 2; e.kbr = Math.max(e.kbr || 0, .3); }
  if (o.name) e.name = o.name;
  G.enemies.push(e); return e;
}
const pickW = list => { let t = 0; for (const x of list) t += x[1]; let r = Math.random() * t; for (const x of list) { r -= x[1]; if (r <= 0) return x[0]; } return list[0][0]; };

// ---------- drops ----------
function rollDrops(e, h) {
  const d = e.d, st = G.stage, x = ecx(e), y = ecy(e);
  if (e.boss) return bossLoot(e);
  const cm = STAGE_COIN[st] * (1 + (e.coinBonus || 0)); let coins = Math.round(rndi(d.coins[0], d.coins[1]) * cm * (e.elite ? 2 : 1));
  if (coins > 0) dropItem('coin', coins, x, y - 4);
  for (const [id, a, b, p] of d.drops) if (Math.random() < Math.min(1, p * (e.elite ? 1.6 : 1))) dropItem(id, rndi(a, b) * (st >= 2 && id === 'gel' ? 2 : 1), x, y - 4);
  if (e.ess && Math.random() < (e.elite ? .45 : .2)) dropItem(e.ess, rndi(1, e.elite ? 3 : 2), x, y - 4);
  if (st >= 2 && !e.harmless && !e.boss) { const fragP = (e.elite ? .22 : .012) + (e.y > Y_DEEP * TS ? .01 : 0); if (Math.random() < fragP) dropItem('celestial_frag', rndi(1, 2), x, y - 4); }
  if (Math.random() < (st >= 2 ? .05 : .025) && !e.harmless) dropItem(st >= 2 ? 'potion2' : 'potion1', 1, x, y - 4);
  if (!e.harmless && Math.random() < .35) dropItem('torch', rndi(1, 3), x, y - 4);
}
function bossLoot(e) {
  const x = ecx(e), y = ecy(e), k = e.k;
  const rain = (id, n) => { for (let i = 0; i < n; i += Math.max(1, Math.ceil(n / 8))) dropItem(id, Math.min(Math.ceil(n / 8) || 1, n - i), x + rnd(-30, 30), y + rnd(-20, 10), rnd(-120, 120), rnd(-300, -150)); };
  if (k === 'boss_slime') { rain('coin', rndi(70, 110)); rain('gel', rndi(40, 60)); dropItem('life_crystal', 1, x, y); dropItem(pick(['s003', 's009', 's011', 's015', 's017', 's010']), 1, x, y); dropItem('acc_boots', 1, x + 10, y); dropItem('potion1', 4, x - 10, y); }
  else if (k === 'boss_eye') { rain('coin', rndi(120, 180)); rain('platinum_bar', rndi(16, 24)); dropItem('life_crystal', 2, x, y); dropItem(pick(['s021', 's024', 's027', 's029', 's033', 's037']), 1, x, y); dropItem('acc_ring', 1, x + 12, y); dropItem('potion1', 6, x - 10, y); }
  else if (k === 'boss_guardian') { rain('coin', rndi(250, 360)); rain('hell_bar', rndi(10, 16)); rain('celestial_frag', rndi(14, 20)); dropItem('life_crystal', 3, x, y); dropItem('potion2', 5, x - 10, y); dropItem('acc_gauntlet', 1, x + 12, y); }
  else if (k === 'boss_colossus') { rain('coin', rndi(700, 1000)); dropItem('mythic_core', 3, x, y, 0, -200); rain('celestial_frag', rndi(26, 36)); dropItem('life_crystal', 3, x, y); dropItem('potion3', 6, x - 10, y); dropItem('acc_star', 1, x + 12, y); }
}
function bossDefeated(e) {
  const k = e.k; G.boss = null; flash('#ffffff', .6, .8); shake(14); sfx('boom', 1);
  burst(ecx(e), ecy(e), 60, { col: [e.d.col2, '#fff', e.d.col], spd: 340, g: 120, life: 1.1, size: 4, glow: true });
  if (k === 'boss_slime') { G.flags.slime = true; toast('O Rei Slime foi derrotado!', '#4ade80'); }
  else if (k === 'boss_eye') { G.flags.eye = true; G.stage = Math.max(G.stage, 1); toast('O Olho Colossal foi derrotado! As cavernas ficaram mais perigosas...', '#f87171'); }
  else if (k === 'boss_guardian') {
    G.flags.guardian = true; G.stage = Math.max(G.stage, 2);
    spawnHardmodeOres(G.world); toast('O Guardião do Abismo caiu... O HARDMODE começou! Novos minérios surgiram nas profundezas e os inimigos ficaram muito mais fortes.', '#fb923c', 9); sfx('thunder');
  }
  else if (k === 'boss_colossus') { G.flags.colossus = true; G.stage = Math.max(G.stage, 3); toast('VITÓRIA! O Colosso Estelar foi derrotado e você obteve o Núcleo Mítico! As espadas do Tier 6 agora podem ser forjadas.', '#fbbf24', 10); }
}

// ---------- IA ----------
function playerBox() { const P = G.P; return { x: pcx(P), y: pcy(P) }; }
function aiSlime(e, dt, sm) {
  const a = e.ai, P = G.P; a.t -= dt;
  if (e.onGround) {
    e.vx *= Math.pow(.0005, dt);
    if (a.t <= 0) {
      const dx = pcx(P) - ecx(e), aggro = !P.dead && Math.abs(dx) < (e.sight || 460) && Math.abs(pcy(P) - ecy(e)) < 260;
      let dir = dx > 0 ? 1 : -1; if (e.st.panic) dir = -dir; if (e.st.blind || !aggro) { if (!a.wander || Math.random() < .3) a.wander = Math.random() < .5 ? 1 : -1; dir = a.wander; }
      e.vy = -(250 + rnd(0, 110) + (aggro && pcy(P) < ecy(e) - 40 ? 90 : 0)); e.vx = dir * e.spd * rnd(.8, 1.25) * sm; e.face = dir; a.t = rnd(.6, 1.4) / Math.max(.3, sm); a.squash = -.25;
    }
  }
  a.squash = (a.squash || 0) * Math.pow(.02, dt);
  e.vy += GRAV * dt; e.vy = Math.min(e.vy, MAXFALL);
}
function aiWalker(e, dt, sm) {
  const a = e.ai, P = G.P, dx = pcx(P) - ecx(e), dy = pcy(P) - ecy(e);
  const sight = e.d.sight || 540, aggro = !P.dead && Math.abs(dx) < sight && Math.abs(dy) < 340;
  let dir = 0; a.t -= dt;
  if (aggro && !e.st.blind) { dir = dx > 0 ? 1 : -1; if (Math.abs(dx) < 8) dir = 0; } else { if (a.t <= 0) { a.wander = pick([-1, 0, 1, 1, -1]); a.t = rnd(1.5, 4); } dir = a.wander || 0; }
  if (e.st.panic) dir = -(dx > 0 ? 1 : -1); if (e.st.blind) { if (a.t <= 0) { a.wander = pick([-1, 1]); a.t = rnd(.4, 1) } dir = a.wander; }
  if (dir) { if (dir !== a.fdir) { a.fdir = dir; a.turnT = .38; } }
  a.turnT = (a.turnT || 0) - dt; if (a.turnT <= 0 && a.fdir) e.face = a.fdir;
  const panicMul = e.st.panic ? 1.35 : 1;
  e.vx = approach(e.vx, dir * e.spd * sm * panicMul, 900 * dt);
  e.vy += GRAV * dt; e.vy = Math.min(e.vy, MAXFALL);
  if (e.onGround && dir && sm > 0) {
    const wd = G.world, fx = Math.floor((e.x + e.w / 2 + dir * (e.w / 2 + 3)) / TS), fy = Math.floor((e.y + e.h - 2) / TS);
    let wallH = 0; while (wallH < 5 && SOLID[wd.get(fx, fy - wallH)]) wallH++;
    if (wallH >= 1 && wallH <= 3 && !SOLID[wd.get(fx, fy - wallH - 1)] && !SOLID[wd.get(fx, fy - wallH - 2)]) e.vy = -Math.sqrt(2 * GRAV * (wallH * TS + 5));
    else if (wallH >= 4) { a.wander = -dir; a.t = 1.2; }
    else if (aggro && dy < -34 && Math.abs(dx) < 70 && Math.random() < dt * 3) e.vy = -440;
  }
  if (aggro && e.onGround) { a.stuckT = (a.stuckT || 0) + dt; if (Math.abs(e.x - (a.lx || 0)) > 3) { a.lx = e.x; a.stuckT = 0; } else if (a.stuckT > 1.6 && dir) { e.vy = -430; a.stuckT = 0; } }
}
function shootAtPlayer(e, o) {
  const P = G.P, x = ecx(e), y = ecy(e), a = Math.atan2(pcy(P) - y + (o.lead ? 0 : 0), pcx(P) - x), sp = o.speed || 260;
  const p = spawnProj({ friendly: false, x, y, vx: Math.cos(a + (o.spread || 0)) * sp, vy: Math.sin(a + (o.spread || 0)) * sp, r: o.r || 5, dmg: o.dmg || e.dmg, kb: 120, life: o.life || 2.5, shape: o.shape || 'orb', col: o.col || '#fb923c', col2: o.col2 || '#fde68a', glow: o.glow || o.col || '#fb923c', glowR: (o.r || 5) * 3, grav: o.grav || 0, kind: o.kind || 'linear', pierce: 1, tiles: true, light: o.light || [.8, .4, .1], angle: a, steer: o.steer || 0, targetP: !!o.targetP, speed: sp, trail: o.trail });
  return p;
}
function aiArcher(e, dt, sm) {
  const a = e.ai, P = G.P, dx = pcx(P) - ecx(e), dist = Math.abs(dx), aggro = !P.dead && dist < 640 && Math.abs(pcy(P) - ecy(e)) < 260;
  let dir = 0; a.cd = (a.cd || 1.2) - dt;
  if (aggro && !e.st.blind) { dir = dx > 0 ? 1 : -1; if (dist < 140) dir = -dir; else if (dist < 260) dir = 0; if (dir) { if (dir !== a.fdir) { a.fdir = dir; a.turnT = .3; } } e.face = dx > 0 ? 1 : -1; }
  else { a.t = (a.t || 0) - dt; if (a.t <= 0) { a.wander = pick([-1, 0, 1]); a.t = rnd(1.5, 3.5); } dir = a.wander; if (dir) e.face = dir; }
  if (e.st.panic) dir = -(dx > 0 ? 1 : -1);
  e.vx = approach(e.vx, dir * e.spd * sm, 800 * dt); e.vy += GRAV * dt; e.vy = Math.min(e.vy, MAXFALL);
  if (e.onGround && dir) { const wd = G.world, fx = Math.floor((e.x + e.w / 2 + dir * 12) / TS), fy = Math.floor((e.y + e.h - 2) / TS); if (SOLID[wd.get(fx, fy)] && !SOLID[wd.get(fx, fy - 1)] && !SOLID[wd.get(fx, fy - 2)]) e.vy = -330; }
  if (a.cd <= 0 && aggro && sm > 0 && !e.st.blind && los(ecx(e), ecy(e), pcx(P), pcy(P))) {
    a.cd = rnd(1.8, 2.8) / Math.max(.4, sm); const ang = Math.atan2(pcy(P) - ecy(e) - 10, dx), dd = dist;
    spawnProj({ friendly: false, x: ecx(e), y: ecy(e) - 4, vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340 - dd * .22, r: 3.5, dmg: e.dmg, kb: 100, life: 2.4, shape: 'needle', col: '#d6c9a0', col2: '#fff', grav: 380, kind: 'ballistic', pierce: 1, angle: ang, noAim: false });
    sfx('shot', .4);
  }
}
function steerFly(e, tx, ty, speed, accel, dt) {
  const dx = tx - ecx(e), dy = ty - ecy(e), l = Math.hypot(dx, dy) || 1;
  e.vx += (dx / l * speed - e.vx) * Math.min(1, accel * dt); e.vy += (dy / l * speed - e.vy) * Math.min(1, accel * dt);
}
function aiFlyer(e, dt, sm) { // eye / wasp / bat
  const a = e.ai, P = G.P, px = pcx(P), py = pcy(P), dist = Math.hypot(px - ecx(e), py - ecy(e)), aggro = !P.dead && dist < (e.d.sight || 560);
  a.t -= dt; a.ph = (a.ph || rnd(TAU)) + dt * 3;
  if (e.st.blind || !aggro) { if (a.t <= 0) { a.t = rnd(.8, 2); a.ang = rnd(TAU); } steerFly(e, ecx(e) + Math.cos(a.ang || 0) * 80, ecy(e) + Math.sin(a.ang || 0) * 60, e.spd * .5 * sm, 2, dt); }
  else if (e.st.panic) steerFly(e, ecx(e) - (px - ecx(e)) * 4, ecy(e) - (py - ecy(e)) * 4, e.spd * 1.3 * sm, 3, dt);
  else if (e.kind === 'eye') {
    if (a.dash > 0) { a.dash -= dt; } else {
      steerFly(e, px + Math.cos(a.ph * .6) * 90, py - 70 + Math.sin(a.ph) * 40, e.spd * sm, 2.4, dt);
      if (a.t <= 0) { a.t = rnd(2.4, 4); a.dash = .5; const l = dist || 1; e.vx = (px - ecx(e)) / l * 330 * sm; e.vy = (py - ecy(e)) / l * 330 * sm; }
    }
  } else if (e.kind === 'bat') {
    if (a.t <= 0) { a.t = rnd(.15, .45); a.jx = rnd(-70, 70); a.jy = rnd(-60, 60); }
    steerFly(e, px + (a.jx || 0), py + (a.jy || 0), e.spd * sm, 5, dt);
  } else { steerFly(e, px, py + Math.sin(a.ph) * 14, e.spd * sm, 3, dt); }
  if (e.vx) e.face = e.vx > 0 ? 1 : -1;
}
function aiHover(e, dt, sm) { // harpy / imp: mantêm distância e atiram
  const a = e.ai, P = G.P, px = pcx(P), py = pcy(P), dx = px - ecx(e), dist = Math.hypot(dx, py - ecy(e)), aggro = !P.dead && dist < (e.d.sight || 640);
  a.t -= dt; a.ph = (a.ph || rnd(TAU)) + dt * 2; a.cd = (a.cd == null ? rnd(1, 2) : a.cd) - dt;
  if (e.st.blind || !aggro) { if (a.t <= 0) { a.t = rnd(1, 2.4); a.ang = rnd(TAU); } steerFly(e, ecx(e) + Math.cos(a.ang || 0) * 70, ecy(e) + Math.sin(a.ang || 0) * 50, e.spd * .5 * sm, 2, dt); }
  else if (e.st.panic) steerFly(e, ecx(e) - dx * 4, ecy(e) - (py - ecy(e)) * 4, e.spd * 1.3 * sm, 3, dt);
  else {
    const side = (dx > 0 ? -1 : 1) * (dist < 150 ? -1 : 1), tx = px + side * 150 + Math.cos(a.ph) * 30, ty = py - 90 + Math.sin(a.ph * 1.3) * 30;
    steerFly(e, tx, ty, e.spd * sm, 2.2, dt);
    if (a.cd <= 0 && sm > 0 && dist < 520 && los(ecx(e), ecy(e), px, py)) {
      a.cd = rnd(2, 3.2) / Math.max(.4, sm);
      if (e.kind === 'imp') shootAtPlayer(e, { dmg: Math.round(e.dmg * .9), speed: 230, r: 6, shape: 'fire', col: '#ff5a1a', col2: '#ffd23a', glow: '#ff7a1a' });
      else shootAtPlayer(e, { dmg: Math.round(e.dmg * .8), speed: 280, r: 4, shape: 'needle', col: '#f0e0c0', col2: '#fff', glow: '#fef3c7', life: 1.8 });
      sfx('shot', .4);
    }
  }
  e.face = dx > 0 ? 1 : -1;
}
function aiGhost(e, dt, sm) { const a = e.ai, P = G.P; a.ph = (a.ph || 0) + dt * 2; if (!P.dead) steerFly(e, pcx(P), pcy(P) + Math.sin(a.ph) * 20, e.spd * sm * (e.st.panic ? -1 : 1), 1.4, dt); e.face = pcx(P) > ecx(e) ? 1 : -1; }
function aiSwim(e, dt, sm) {
  const a = e.ai, P = G.P, wd = G.world; a.t -= dt; a.ph = (a.ph || 0) + dt * 3;
  const inW = (x, y) => wd.liqAt(Math.floor(x / TS), Math.floor(y / TS)) > 40 && wd.liqType(Math.floor(x / TS), Math.floor(y / TS)) === LIQ_WATER;
  const cx = ecx(e), cy = ecy(e), here = inW(cx, cy);
  if (!here) { e.vy += GRAV * .8 * dt; e.vx *= .98; e.flop = true; return; } e.flop = false;
  const px = pcx(P), py = pcy(P), pw = inW(px, py), dist = Math.hypot(px - cx, py - cy);
  let tx, ty;
  if (pw && dist < (e.d.sight || 480) && !e.st.blind && !P.dead) { tx = px; ty = py; if (e.st.panic) { tx = cx - (px - cx); ty = cy - (py - cy); } }
  else { if (a.t <= 0) { a.t = rnd(2, 4); a.dir = pick([-1, 1]); a.dy = rnd(-20, 20); } tx = cx + (a.dir || 1) * 100; ty = cy + (a.dy || 0); }
  steerFly(e, tx, ty, e.spd * sm, 2.2, dt); e.vy += Math.sin(a.ph) * 8 * dt;
  // não deixa sair da água
  const nx = cx + e.vx * dt * 3, ny = cy + e.vy * dt * 3; if (!inW(nx, cy)) { e.vx *= -.6; a.dir = -(a.dir || 1); } if (!inW(cx, ny)) { e.vy *= -.4; }
  if (e.vx) e.face = e.vx > 0 ? 1 : -1;
}
function aiCritter(e, dt, sm) {
  const a = e.ai, P = G.P; a.t -= dt;
  if (e.kind === 'birdc') { if (a.t <= 0) { a.t = rnd(1, 3); a.ang = rnd(TAU); } steerFly(e, ecx(e) + Math.cos(a.ang || 0) * 90, ecy(e) + Math.sin(a.ang || 0) * 50 - 10, e.spd, 2, dt); const near = Math.hypot(pcx(P) - ecx(e), pcy(P) - ecy(e)) < 90; if (near) { e.vy = -90; e.vx += (ecx(e) - pcx(P)) * 2 * dt; } if (e.vx) e.face = e.vx > 0 ? 1 : -1; return; }
  if (e.onGround) { e.vx *= .8; if (a.t <= 0) { const near = Math.hypot(pcx(P) - ecx(e), pcy(P) - ecy(e)) < 120; let dir = near ? (ecx(e) > pcx(P) ? 1 : -1) : pick([-1, 1]); e.vy = -(160 + rnd(0, 80)); e.vx = dir * e.spd; e.face = dir; a.t = near ? .35 : rnd(.8, 2.6); } }
  e.vy += GRAV * dt;
}
function updateEnemy(e, dt) {
  const P = G.P, wd = G.world; e.age += dt;
  updateStatuses(e, dt);
  for (const [k, t] of e.imm) { if (t < 1e8) { const nt = t - dt; if (nt <= 0) e.imm.delete(k); else e.imm.set(k, nt); } }
  if (e.imm.size > 160) e.imm.clear();
  e.hurtT -= dt; e.flash -= dt; e.kbT -= dt;
  if (e.regen && !e.st.curse && !(e.noRegen > 0) && e.hp < e.hpMax) e.hp = Math.min(e.hpMax, e.hp + e.regen * dt);
  if (e.noRegen > 0) e.noRegen -= dt;
  const frozen = G.freeze > 0 && !e.boss || e.st.timestop;
  const stunned = e.st.stun || frozen || e.st.freeze && e.st.freeze.amt >= 1;
  const sm = spdMult(e);
  if (e.isDummy) { e.vx *= .9; e.vy += GRAV * dt; bodyMove(e, dt, {}); return; }
  if (!stunned && e.kbT <= 0) {
    switch (e.kind) {
      case 'slime': aiSlime(e, dt, sm); break; case 'walker': aiWalker(e, dt, sm); break; case 'archer': aiArcher(e, dt, sm); break;
      case 'eye': case 'bat': case 'wasp': aiFlyer(e, dt, sm); break; case 'harpy': case 'imp': aiHover(e, dt, sm); break;
      case 'ghost': aiGhost(e, dt, sm); break; case 'swim': aiSwim(e, dt, sm); break; case 'critter': case 'birdc': aiCritter(e, dt, sm); break;
      default: if (e.kind.startsWith('b')) bossAI(e, dt, sm);
    }
  } else if (!e.fly && !e.swim) { e.vy += GRAV * dt; e.vy = Math.min(e.vy, MAXFALL); e.vx *= Math.pow(.2, dt); }
  else if (!frozen) { e.vx *= Math.pow(.25, dt); e.vy *= Math.pow(.25, dt); }
  else { e.vx = e.vy = 0; }
  if (e.st.float) { e.vy = approach(e.vy, -60, 900 * dt); }
  if (frozen && !e.boss) { e.vx = 0; e.vy = 0; }
  // movimento
  const was = e.hitX;
  if (e.swim || e.noclip) { e.x += e.vx * dt; e.y += e.vy * dt; e.onGround = false; e.hitX = 0; }
  else { bodyMove(e, dt, { stepUp: e.kind === 'walker' || e.kind === 'archer', bounce: e.fly ? .35 : 0 }); }
  if (e.slam && (e.hitX || e.hitY && Math.abs(e.vy) > 5) && e.slam.t > 0) { dealRaw(e, e.slam.dmg, e.slam.col, false); burst(ecx(e), ecy(e), 8, { col: ['#d4d4d8', '#fff'], spd: 100, life: .3 }); e.slam = null; sfx('hit'); }
  if (e.slam) { e.slam.t -= dt; if (e.slam.t <= 0) e.slam = null; }
  if (e.y > wd.h * TS) { e.dead = true; return; }
  // preso na parede (spawn ruim)
  if (!e.noclip && !e.swim && overlapSolid(e.x + 1, e.y + 1, e.w - 2, e.h - 2)) { e.stuck = (e.stuck || 0) + dt; if (e.stuck > 1.2 && !e.boss) e.dead = true; } else e.stuck = 0;
  // contato com o jogador
  if (!e.harmless && e.dmg > 0 && !P.dead && !stunned && e.x < P.x + P.w && e.x + e.w > P.x && e.y < P.y + P.h && e.y + e.h > P.y) {
    const fromX = ecx(e); if (hurtPlayer(e.dmg, fromX, 190)) { if (e.fire) { /* chama */ } }
  }
}
function updateEnemies(dt) {
  const P = G.P, a = G.enemies;
  for (let i = a.length - 1; i >= 0; i--) {
    const e = a[i]; if (e.dead) { a.splice(i, 1); continue; }
    if (!e.boss) { const dx = Math.abs(ecx(e) - pcx(P)), dy = Math.abs(ecy(e) - pcy(P)); if (dx > 1500 || dy > 1100) { a.splice(i, 1); continue; } if (e.isDummy) { /* fica */ } }
    updateEnemy(e, dt);
    if (e.glowc && !e.dead) G.light.addLight(ecx(e) / TS, ecy(e) / TS, ...hex2rgb(e.glowc).map(v => v / 255 * .7));
  }
}

// ---------- spawn por bioma / camada ----------
const _spawn = { t: 2 };
function spawnTick(dt) {
  if (G.opts.noSpawn || G.state !== 'play') return;
  _spawn.t -= dt; if (_spawn.t > 0) return; _spawn.t = rnd(.9, 2.0);
  const P = G.P; if (P.dead) return; const wd = G.world, txp = Math.floor(pcx(P) / TS), typ = Math.floor(pcy(P) / TS);
  const layer = wd.layerAt(txp, typ), bio = wd.biomeName(txp), night = isNightFrac(G.time), st = G.stage;
  const hostile = G.enemies.filter(e => !e.harmless && !e.boss && !e.isDummy), critters = G.enemies.filter(e => e.harmless).length;
  const cap = layer === 'surface' || layer === 'sky' ? (night ? 9 : 6) : 10; if (G.boss) { if (hostile.length >= 4) return; } else if (hostile.length >= cap && Math.random() > .15) return;
  // tabela por contexto
  let mode, key;
  const inMush = wd.mushCenter && Math.abs(txp - wd.mushCenter.x) < 40 && Math.abs(typ - wd.mushCenter.y) < 20;
  const list = [];
  const add = (k, w, m) => list.push([[k, m || 'ground'], w]);
  if (layer === 'sky') { add('harpy', 10, 'air'); }
  else if (layer === 'surface') {
    if (bio === 'ocean') { add('shark', 7, 'water'); if (night) add('eye', 6, 'air'); add('bird', critters < 3 ? 3 : 0, 'air'); }
    else if (night) {
      if (bio === 'desert') { add('zombie_desert', 10); add('slime_sand', 2); } else if (bio === 'snow') { add('zombie_ice', 8); add('wolf', 5); add('slime_ice', 2); } else if (bio === 'jungle') { add('zombie', 6); add('slime_jungle', 3); add('wasp', 4, 'air'); } else { add('zombie', 12); add('slime_green', 3); add('slime_blue', 2); }
      add('eye', 7, 'air');
    } else {
      if (bio === 'desert') { add('slime_sand', 9); add('bunny', critters < 3 ? 2 : 0); } else if (bio === 'snow') { add('slime_ice', 9); add('wolf', 2); add('bunny', critters < 3 ? 2 : 0); } else if (bio === 'jungle') { add('slime_jungle', 9); add('wasp', 4, 'air'); } else { add('slime_green', 10); add('slime_blue', 6); if (st >= 1) add('slime_red', 3); add('bunny', critters < 4 ? 4 : 0); add('bird', critters < 4 ? 4 : 0, 'air'); }
    }
  } else if (layer === 'cave') {
    add('slime_purple', 7); add('skeleton', 6); add('bat', 8, 'air'); add('skeleton_archer', st >= 1 ? 5 : 2); add('beetle', bio === 'desert' ? 7 : 2);
    if (bio === 'snow') { add('zombie_ice', 5); add('wolf', 3); } if (bio === 'jungle') { add('wasp', 6, 'air'); add('piranha', 0, 'water'); } if (inMush) add('mushroom_walker', 12); if (st >= 1) add('golem', 3);
    if (wd.liqAt(txp, typ) > 40 && wd.liqType(txp, typ) === LIQ_WATER) add('piranha', 8, 'water');
  } else if (layer === 'deep') {
    add('skeleton_archer', 6); add('skeleton', 4); add('bat', 6, 'air'); add('slime_purple', 5); add('beetle', 3); if (st >= 1) { add('ghost', 5, 'air'); add('golem', 5); } if (inMush) add('mushroom_walker', 10);
  } else { add('imp', 10, 'air'); add('hellbat', 8, 'air'); add('slime_lava', 8); }
  const tot = list.filter(x => x[1] > 0); if (!tot.length) return;
  [key, mode] = pickW(tot);
  const pos = findSpawnPos(key, mode); if (!pos) return;
  const o = {}; const el = (layer === 'sky' ? 'sky' : layer === 'surface' ? bio : layer);
  if (st >= 2 && !ED[key].harmless && Math.random() < .68) o.elem = pickW(ELEM_BY[el] || ELEM_BY.cave);
  if (st >= 1 && !ED[key].harmless && Math.random() < .045) o.elite = true;
  spawnEnemy(key, pos.x, pos.y, o);
}
function findSpawnPos(key, mode) {
  const P = G.P, wd = G.world, d = ED[key], c = G.cam, vw = c.w / c.zoom, vh = c.h / c.zoom, pxc = pcx(P), pyc = pcy(P);
  const offscreen = (x, y) => Math.abs(x - pxc) > vw / 2 + 28 || Math.abs(y - pyc) > vh / 2 + 28;
  const wT = Math.ceil(d.w / TS) + 1, hT = Math.ceil(d.h / TS) + 1;
  for (let tries = 0; tries < 24; tries++) {
    const side = Math.random() < .5 ? -1 : 1, tx = Math.floor(pxc / TS) + side * rndi(Math.ceil(vw / 2 / TS) + 3, Math.ceil(vw / 2 / TS) + 24);
    if (tx < 3 || tx >= wd.w - 3) continue;
    if (mode === 'ground') {
      let ty0 = Math.floor(pyc / TS) + rndi(-26, 22);
      for (let ty = ty0 - 12; ty < ty0 + 22; ty++) {
        if (ty < 2 || ty >= wd.h - 6) continue;
        if (!SOLID[wd.get(tx, ty + 1)] || wd.liqAt(tx, ty) > 20) continue; let ok = true;
        for (let k = 0; k < hT && ok; k++) for (let j = 0; j < wT && ok; j++) if (SOLID[wd.get(tx + j, ty - k)] || wd.liqAt(tx + j, ty - k) > 20) ok = false;
        if (!ok) continue;
        const x = tx * TS, y = (ty + 1) * TS - d.h; if (offscreen(x, y)) return { x, y };
      }
    } else if (mode === 'air') {
      const ty = Math.floor(pyc / TS) + rndi(-18, 14); if (ty < 4 || ty >= wd.h - 8) continue; let ok = true;
      for (let k = 0; k < hT && ok; k++) for (let j = 0; j < wT && ok; j++) if (SOLID[wd.get(tx + j, ty + k)] || wd.liqAt(tx + j, ty + k) > 20) ok = false;
      if (ok && offscreen(tx * TS, ty * TS)) return { x: tx * TS, y: ty * TS };
    } else if (mode === 'water') {
      const ty = Math.floor(pyc / TS) + rndi(-12, 14); if (ty < 4 || ty >= wd.h - 8) continue;
      if (wd.liqAt(tx, ty) > 150 && wd.liqType(tx, ty) === LIQ_WATER && wd.liqAt(tx + 1, ty) > 150 && wd.liqAt(tx - 1, ty) > 150 && wd.liqAt(tx, ty - 1) > 150 && wd.liqAt(tx, ty + 1) > 150 && offscreen(tx * TS, ty * TS)) return { x: tx * TS - d.w / 2, y: ty * TS };
    }
  }
  return null;
}
