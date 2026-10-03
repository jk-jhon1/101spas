/* ============================================================
   10_fx: biblioteca de efeitos de espadas (passiveEffects)
   Hooks: swing, onSwing, onApex, mod, onHit, onProjHit, onKill,
          tick, atkMult, stats, init
   ============================================================ */
const pcx = P => P.x + P.w / 2, pcy = P => P.y + P.h / 2;
const screenRect = () => { const c = G.cam; return { x: c.x, y: c.y, w: c.w / c.zoom, h: c.h / c.zoom }; };
function flash(col, a = .6, t = .25) { G.flash = { col, a, t, max: t }; }

// projétil a partir do ápice (herda 100% da direção do arco)
function shoot(P, inst, o) {
  const a = inst.aim + (o.ang || 0), sp = o.speed === undefined ? 420 : o.speed, tip = inst.tip || { x: pcx(P), y: pcy(P) };
  const p = { x: tip.x, y: tip.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: inst.sw.baseDamage * (o.dm === undefined ? 1 : o.dm) * inst.dmgMult, kb: inst.sw.knockbackForce * (o.kbm === undefined ? .5 : o.kbm), sword: inst.sw, critChance: inst.sw.critChance, angle: a };
  Object.assign(p, o); delete p.ang; delete p.speed; delete p.dm; delete p.kbm;
  if (o.heal) { const heal = o.heal, oh = o.onHit; p.onHit = (pp, e, r) => { healPlayer(heal, true); if (oh) oh(pp, e, r); }; }
  if (p.life) p.maxLife = p.life;
  return spawnProj(p);
}
const dmgOf = (inst, m) => inst.sw.baseDamage * m * inst.dmgMult;
function mkProj(P, inst, o) { // projétil estático/custom com dano relativo
  const p = Object.assign({ dmg: dmgOf(inst, o.dm === undefined ? 1 : o.dm), kb: inst.sw.knockbackForce * (o.kbm === undefined ? .3 : o.kbm), sword: inst.sw, critChance: inst.sw.critChance }, o); delete p.dm; delete p.kbm;
  if (p.life) p.maxLife = p.life; return spawnProj(p);
}
// onda de choque que segue o relevo (Ballistic/Static ground)
function groundWave(P, inst, x, y, dir, o) {
  const p = mkProj(P, inst, Object.assign({ kind: 'custom', shape: 'wave', x, y: y - (o.hh || 12), vx: dir * (o.speed || 300), vy: 0, r: 12, hw: o.hw || 10, hh: o.hh || 12, life: o.life || .7, dm: 1, kbm: .4, pierce: 0, tiles: false, col: '#b4783a', col2: '#fde68a', fs: .4, glow: null }, o));
  p.dust = 0; if (o.delay) p.delay = o.delay;
  p.onUpdate = (q, dt) => {
    q.x += q.vx * dt; const base = q.y + q.hh, gy = groundY(q.x, base - 2, 5);
    if (gy < 0 || Math.abs(gy - base) > TS * 3.2) { killProj(q, 'wall'); return; }
    q.y = gy - q.hh; q.dust -= dt; if (q.dust <= 0) { q.dust = .035; burst(q.x, gy - 2, 2, { col: ['#b4783a', '#8a6a3a', o.col || '#fff'], spd: 50, g: 300, life: .35, ang: -PI / 2, spread: 1.4, size: 2.6 }); }
    if (o.fire) { q.fireT = (q.fireT || 0) - dt; if (q.fireT <= 0) { q.fireT = .09; flameZone(P, inst, q.x, gy - 8, { dm: .18, life: 3 }); } }
    G.light.addLight(q.x / TS, (q.y) / TS, .7, .45, .2);
  };
  return p;
}
function flameZone(P, inst, x, y, o) {
  const p = mkProj(P, inst, { kind: 'static', shape: 'fire', x, y, r: o.r || 9, life: o.life || 3, dm: o.dm || .2, kb: 0, pierce: 0, hitCd: .45, status: [['burn', 3, { dps: Math.max(3, inst.sw.baseDamage * .05) }]], tiles: false, glow: '#ff7a1a', glowR: 30, light: [1, .55, .2], elem: 'fire', noKb: true, fs: .2, pulse: true });
  p.onUpdate = (q, dt) => { q.y -= 4 * dt; if (Math.random() < dt * 6) addPart({ x: q.x + rnd(-5, 5), y: q.y, vy: -40, life: .4, size: 2.4, col: pick(['#ff9a2a', '#ffd23a']), glow: true }); }; return p;
}
function spike(P, inst, x, gy, o) {
  const hh = o.hh || 22, p = mkProj(P, inst, Object.assign({ kind: 'static', shape: 'spike', x, y: o.ceil ? gy + hh : gy - hh, hw: o.hw || 7, hh, r: 7, life: o.life || .9, dm: 1, kb: 0, pierce: 0, hitCd: 1e9, col: '#9a8f80', col2: '#d9d0c0', tiles: false, fs: .4, inv: !!o.ceil, rise: 0 }, o));
  p.onStart = q => { burst(q.x, o.ceil ? gy + 2 : gy - 2, 6, { col: [q.col, q.col2, '#8a6a3a'], spd: 90, g: 400, life: .4, ang: o.ceil ? PI / 2 : -PI / 2, spread: 1.6 }); sfx('break', .5); };
  p.onUpdate = q => { q.rise = Math.min(1, q.age / .1); };
  if (o.delay) p.delay = o.delay; return p;
}
function aura(P, inst, o) { // aura gravitacional que segue o jogador (ou ponto fixo)
  const p = mkProj(P, inst, { kind: 'custom', shape: 'aura', noHit: true, x: o.x === undefined ? pcx(P) : o.x, y: o.y === undefined ? pcy(P) : o.y, r: o.r, life: o.life, dm: 0, pierce: 0, col: o.col || '#a78bfa', glow: o.col || '#a78bfa', glowR: o.r * 1.1, glowA: .35, tiles: false });
  p.rot = 0; p.spin = o.push ? -3 : 3;
  p.onUpdate = (q, dt) => {
    if (!o.fixed) { q.x = pcx(P) + (o.ox || 0); q.y = pcy(P) + (o.oy || 0); }
    for (const e of enemiesNear(q.x, q.y, q.r)) {
      const dx = q.x - ecx(e), dy = q.y - ecy(e), d = Math.hypot(dx, dy) || 1, k = o.pull || 0;
      if (k && !e.boss) { e.vx += dx / d * k * dt * (o.push ? 1 : 1); e.vy += dy / d * k * dt * .6; e.vx *= .985; e.kbT = Math.max(e.kbT || 0, .05); }
      if (o.slow) applyStatus(e, 'slow', .4, { amt: o.slow });
      if (o.mark) applyStatus(e, 'mark', .5);
      if (o.dmg) hitEnemy(e, { src: 'area', id: q.id + ':' + Math.floor(G.t / (o.tick || .4)), imm: o.tick || .4, dmg: dmgOf(inst, o.dmg), kb: 0, sword: inst.sw, fs: .2, noKb: true, critChance: .0 });
    }
    if (o.killProj) for (const pr of G.projs) { if (!pr.friendly && !pr.dead && Math.hypot(pr.x - q.x, pr.y - q.y) < q.r) { pr.dead = true; burst(pr.x, pr.y, 5, { col: o.col, glow: true, life: .3 }); } }
    if (Math.random() < dt * 40) { const a = rnd(TAU), rr = q.r * rnd(.4, 1); addPart({ x: q.x + Math.cos(a) * rr, y: q.y + Math.sin(a) * rr, vx: -Math.sin(a) * 60 * (o.push ? -1 : 1) + (o.push ? Math.cos(a) * 60 : -Math.cos(a) * 60), vy: Math.cos(a) * 60 * (o.push ? -1 : 1) + (o.push ? Math.sin(a) * 60 : -Math.sin(a) * 60), life: .5, size: 2.4, col: o.col || '#a78bfa', glow: true }); }
  };
  return p;
}
function portalAt(P, inst, x, y, o) { // portal de ataque
  const p = mkProj(P, inst, { kind: 'custom', shape: 'portal', noHit: true, x, y, r: o.r || 22, life: o.life || 2.5, dm: 0, pierce: 0, col: o.col || '#c084fc', col2: o.col2 || '#f0abfc', glow: o.col || '#c084fc', glowR: 44, glowA: .6, tiles: false, angle: o.angle || 0, spin: 2 });
  p.fireT = o.first === undefined ? .15 : o.first;
  p.onStart = () => { sfx('portal', .6); burst(x, y, 12, { col: [p.col, '#fff'], spd: 100, glow: true, life: .5 }); };
  p.onUpdate = (q, dt) => { q.fireT -= dt; if (q.fireT <= 0 && o.every) { q.fireT = o.every; o.fire(q); } };
  p.onDie = q => burst(q.x, q.y, 14, { col: [q.col, '#fff'], spd: 120, glow: true, life: .5 });
  return p;
}
function homingBlade(P, inst, x, y, ang, o) {
  return mkProj(P, inst, Object.assign({ kind: 'homing', shape: 'blade', x, y, vx: Math.cos(ang) * (o.speed || 400), vy: Math.sin(ang) * (o.speed || 400), r: 7, life: 2.5, dm: .35, kb: 0, steer: 5, speed: o.speed || 400, range: 700, col: '#c4b5fd', col2: '#ffffff', glow: '#a78bfa', tiles: false, trail: '#c4b5fd', pierce: 1, fs: .5, angle: ang }, o));
}
function meteorFall(P, inst, tx, ty, o) { // meteoro vindo do céu até (tx,ty)
  const ang = o.ang !== undefined ? o.ang : PI / 2 + rnd(-.25, .25), sp = o.speed || 620, dist = o.height || 420;
  const sx = tx - Math.cos(ang) * dist, sy = ty - Math.sin(ang) * dist;
  const p = mkProj(P, inst, { kind: 'linear', shape: 'meteor', x: sx, y: sy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: o.r || 16, life: 3, dm: o.dm || 1, kb: 0, pierce: 0, noHit: true, tiles: true, col: o.col || '#ff7a1a', col2: o.col2 || '#ffe08a', glow: o.col || '#ff7a1a', glowR: (o.r || 16) * 3, spin: 3, trail: '#ff9a3a', trailRate: 90, light: [1, .6, .2], noAim: true, delay: o.delay || 0 });
  const boom = q => { if (q.boomed) return; q.boomed = true; explode(q.x, q.y, o.boomR || 60, dmgOf(inst, o.dm || 1), { sword: inst.sw, col: o.col || '#ff9a3a', tiles: o.tiles, kb: 5, falloff: true, elem: 'fire', status: o.status }); q.dead = true; };
  p.onTile = boom; p.onUpdate = (q, dt) => { if (q.y >= ty && !q.boomed) boom(q); };
  return p;
}
function slowArea(x, y, r, amt, dur) { for (const e of enemiesNear(x, y, r)) applyStatus(e, 'slow', dur, { amt }); }
function chainFx(x0, y0, x1, y1, col) { const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 7)); for (let i = 0; i <= n; i++) { const k = i / n; addPart({ x: lerp(x0, x1, k) + rnd(-3, 3), y: lerp(y0, y1, k) + rnd(-3, 3), life: .22, size: 2.4, col: col || '#fde047', glow: true, shrink: false }); } sfx('thunder', .3); }
function screenDamage(P, inst, mult, o) {
  o = o || {}; const id = 'sd' + (G.srcId++), list = enemiesOnScreen(40);
  for (const e of list) {
    hitEnemy(e, { src: 'area', id, dmg: dmgOf(inst, mult), kb: o.kb || 0, noKb: !o.kb, sword: inst.sw, fs: .3, elem: o.elem, status: o.status, fromX: pcx(P), fromY: pcy(P), critChance: inst.sw.critChance });
    if (!o.noFx) { burst(ecx(e), ecy(e), 6, { col: [o.col || '#fff', '#fff'], spd: 100, glow: true, life: .35 }); addPart({ x: ecx(e), y: ecy(e), ring: true, r0: 3, r1: 26, life: .3, col: o.col || '#fff', size: 3, glow: true }); }
  }
  return list.length;
}
function sword(P) { return P.cb.sw; }

const FX = {
  // ============ TIER 1 ============
  kbLight: m => ({ mod(P, e, h) { if (!e.fly && !e.heavy && !e.swim && !e.boss) h.kbMult = (h.kbMult || 1) * m; } }),
  sparks: () => ({ onApex(P, inst) { const t = inst.tip; for (const e of enemiesNear(t.x, t.y, TS)) hitEnemy(e, { src: 'area', id: 'sp' + inst.id, dmg: dmgOf(inst, .6), kb: 0, noKb: true, sword: inst.sw, elem: 'lightning', fs: .5, critChance: 0 });
    burst(t.x, t.y, 9, { col: ['#fde047', '#fff', '#60a5fa'], spd: 130, glow: true, life: .25, size: 2 }); for (let i = 0; i < 3; i++) chainFx(t.x, t.y, t.x + rnd(-14, 14), t.y + rnd(-14, 14)); } }),
  frontBlock: p => ({ swing(P, inst, cb) { cb.blockT = inst.dur + .08; cb.blockPct = p; } }),
  groundShards: (n, m) => ({ onHit(P, e, h, res) { if (h.src !== 'melee') return; const gy = groundY(ecx(e), ecy(e), 14); if (gy < 0) return; const inst = h.inst;
    for (let i = 0; i < n; i++) { const x = ecx(e) + (i - (n - 1) / 2) * 16 + rnd(-3, 3); const gy2 = groundY(x, gy - 4, 6); if (gy2 < 0) continue;
      const p = mkProj(P, inst, { kind: 'static', shape: 'rock', x, y: gy2 - 6, r: 7, life: 2.5, dm: m, kb: 0, pierce: 0, hitCd: .5, col: '#8b8f98', col2: '#c4c8d0', tiles: false, noKb: true, fs: .2 }); p.spin = 0; p.rot = rnd(TAU);
      burst(x, gy2 - 2, 4, { col: ['#8b8f98', '#c4c8d0'], spd: 70, g: 300, life: .35, ang: -PI / 2, spread: 1.4 }); } } }),
  bleed: (dps, dur) => ({ onHit(P, e) { applyStatus(e, 'bleed', dur, { dps }); } }),
  breakChance: p => ({ onHit(P, e, h) { if (h.src !== 'melee' || h.inst.ghost || G.mode === 'creative') return; if (Math.random() < p) breakHeldSword(); } }),
  fanSpines: (n, spreadDeg, rangePx) => ({ onApex(P, inst) { for (let i = 0; i < n; i++) { const off = n > 1 ? (i - (n - 1) / 2) * deg(spreadDeg / (n - 1)) : 0; shoot(P, inst, { ang: off, speed: 340, dm: .55, shape: 'needle', r: 4, life: rangePx / 340, col: '#a7e07a', col2: '#ecffc8', pierce: 1, kbm: .3 }); } sfx('shot', .5); } }),
  runeLight: () => ({ tick(P, dt) { G.light.addLight(pcx(P) / TS, pcy(P) / TS, .55, .5, .3); },
    onApex(P, inst) { const t = inst.tip; const p = mkProj(P, inst, { kind: 'custom', shape: 'sparkle', noHit: true, x: t.x, y: t.y, r: 5, life: 1.6, dm: 0, pierce: 0, col: '#fde68a', glow: '#fde68a', glowR: 40, glowA: .5, tiles: false, light: [1, .9, .55] }); p.onUpdate = q => { q.y -= .2; }; ringFx(t.x, t.y, 36, '#fde68a', .5, 2); } }),
  poisonSlow: (slowAmt, dur) => ({ onHit(P, e) { applyStatus(e, 'poison', dur, { dps: 2, slowAmt }); } }),
  comboSpeed: (per, max) => { let c = 0, last = 0; return { onHit(P, e, h) { if (h.src !== 'melee') return; c = Math.min(max, c + per); last = G.t; }, atkMult() { return 1 + c; }, tick() { if (G.t - last > 2.4) c = 0; }, get combo() { return c; } }; },
  goldBonus: p => ({ onKill(P, e) { e.coinBonus = (e.coinBonus || 0) + p; } }),
  vsUndead: p => ({ mod(P, e, h) { if (e.undead) { h.mult = (h.mult || 1) * (1 + p); } } }),
  submerged: m => ({ swing(P, inst) { if (P.inLiquid) inst.reach *= 1 + m; } }),
  slowHit: (amt, dur) => ({ onHit(P, e) { applyStatus(e, 'slow', dur, { amt }); burst(ecx(e), ecy(e), 4, { col: '#7be08b', spd: 60, g: 100, life: .5 }); } }),
  burnHit: (dps, dur) => ({ onHit(P, e) { applyStatus(e, 'burn', dur, { dps }); } }),
  shieldHit: (per, max, dur) => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const s = P.buffs.shield; addBuff('shield', dur, { hp: Math.min(max, (s ? s.hp : 0) + per) }); } }),
  boneLob: () => ({ onApex(P, inst) { const a = inst.aim; shoot(P, inst, { kind: 'ballistic', shape: 'bone', r: 6, speed: 300, ang: -.28 * Math.cos(a) * 0 + (Math.cos(a) >= 0 ? -.35 : .35), dm: .7, kbm: .5, life: 1.6, grav: 700, spin: 14, col: '#efe7cf' }); } }),
  armorPassive: n => ({ stats(P, st) { st.def += n; } }),
  staticSpores: n => ({ onApex(P, inst) { const t = inst.tip; for (let i = 0; i < n; i++) { const p = mkProj(P, inst, { kind: 'static', shape: 'orb', x: t.x + rnd(-16, 16), y: t.y + rnd(-14, 14), r: 6, life: 4.5, dm: .4, kb: 0, pierce: 0, hitCd: .6, col: '#7dd3fc', col2: '#e0f7ff', glow: '#38bdf8', glowR: 22, glowA: .8, tiles: false, light: [.3, .6, 1], noKb: true, fs: .2, pulse: true }); p.ph = rnd(TAU); p.x0 = p.x; p.y0 = p.y; p.onUpdate = q => { q.x = q.x0 + Math.sin(q.age * 1.6 + q.ph) * 5; q.y = q.y0 - q.age * 5 + Math.cos(q.age * 2 + q.ph) * 3; }; } } }),
  featherFall: f => ({ tick(P) { if (P.cb.swingT > 0 && !P.onGround) P.slowfall = f; } }),

  // ============ TIER 2 (criadas) ============
  shoot: o => ({ onApex(P, inst) { const base = Object.assign({}, o); const n = o.n || 1; delete base.n; delete base.spreadDeg;
    for (let i = 0; i < n; i++) { const off = n > 1 ? ((i - (n - 1) / 2) * deg(o.spreadDeg || 14)) : 0; shoot(P, inst, Object.assign({}, base, { ang: (base.ang || 0) + off })); }
    sfx(o.sfx || 'shot', .6); } }),
  lifesteal: p => ({ onHit(P, e, h, res) { if (h.src === 'dot') return; healPlayer(Math.max(1, Math.round(res.dmg * p)), true); } }),
  statusHit: (name, dur, p, only) => ({ onHit(P, e, h) { if (only && h.src !== only) return; applyStatus(e, name, dur, p); } }),
  massiveKB: (m, stun) => ({ mod(P, e, h) { if (h.src === 'melee') h.kbMult = (h.kbMult || 1) * m; }, onHit(P, e, h) { if (h.src === 'melee' && stun) applyStatus(e, 'stun', stun); } }),
  frostNova: (r, amt) => ({ onHit(P, e, h) { if (h.src !== 'melee') return; ringFx(ecx(e), ecy(e), r, '#7dd3fc', .45, 3); burst(ecx(e), ecy(e), 14, { col: ['#bae6fd', '#fff', '#38bdf8'], spd: r * 2, glow: true, life: .45 }); slowArea(ecx(e), ecy(e), r, amt, 2.2); sfx('ice'); } }),
  wallSlam: pct => ({ onHit(P, e, h, res) { if (h.src === 'melee' && !e.boss) e.slam = { t: .55, dmg: Math.max(1, Math.round(res.dmg * pct)), col: '#d4d4d8' }; } }),
  alternate: (a, b) => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const f = (h.inst.id % 2) ? a : b; applyStatus(e, f[0], f[1], f[2]); burst(ecx(e), ecy(e), 6, { col: f[3], spd: 80, glow: true, life: .35 }); } }),
  starFall: () => ({ onApex(P, inst) { const m = G.mouse, c = G.cam, tx = clamp(m.wx, pcx(P) - 380, pcx(P) + 380), ty = clamp(m.wy, pcy(P) - 260, pcy(P) + 200);
    meteorFall(P, inst, tx, ty, { r: 9, dm: 1.1, boomR: 34, col: '#facc15', col2: '#fff7c2', height: 360, speed: 560, ang: PI / 2 + rnd(-.15, .15) }); sfx('magic'); } }),
  nightBonus: p => ({ mod(P, e, h) { if (isNightFrac(G.time)) h.mult = (h.mult || 1) * (1 + p); } }),


  embers: () => ({ onApex(P, inst) { const t = inst.tip; burst(t.x, t.y, 16, { col: ['#ff7a1a', '#ffd23a', '#ff4a1a'], spd: 120, g: -40, life: .7, size: 3, glow: true }); sfx('fire', .4); } }),
  magmaDrop: () => ({ onApex(P, inst) { const p = shoot(P, inst, { kind: 'linear', shape: 'fire', r: 9, speed: 480, dm: .8, life: .9, glow: '#ff7a1a', glowR: 30, trail: '#ff9a2a', light: [1, .5, .15], grav: 260, elem: 'fire', pierce: 1 }); sfx('fire');
    p.onDie = q => { explode(q.x, q.y, 42, dmgOf(inst, .7), { sword: inst.sw, col: '#ff7a1a', kb: 3, noHooks: true, elem: 'fire', status: [['burn', 3, { dps: 4 }]] }); }; } }),

  // ============ TIER 3 ============
  regenAura: (hps, dur) => ({ onHit(P, e, h) { if (h.src === 'melee') { addBuff('regen', dur, { hps }); } } }),
  burst: (n) => ({ swing(P, inst, cb) { inst.dur = inst.cycle / n * .78; }, onSwing(P, inst, cb) { const gap = inst.cycle / n * .86; for (let i = 1; i < n; i++) startSwing(P, inst.sw, { sub: true, delay: gap * i, side: -inst.side * (i % 2 ? 1 : -1), aim: inst.aim, dur: inst.dur, keepFace: true }); } }),
  petals: n => ({ onApex(P, inst) { const tgt = nearestEnemy(G.mouse.wx, G.mouse.wy, 420) || null, tx = tgt ? ecx(tgt) : G.mouse.wx, ty = tgt ? ecy(tgt) : G.mouse.wy, r = screenRect();
    for (let i = 0; i < n; i++) { const side = Math.random() < .5, sx = side ? (Math.random() < .5 ? r.x - 10 : r.x + r.w + 10) : r.x + Math.random() * r.w, sy = side ? r.y + Math.random() * r.h : (Math.random() < .5 ? r.y - 10 : r.y + r.h + 10);
      const a = Math.atan2(ty - sy, tx - sx); mkProj(P, inst, { kind: 'homing', shape: 'petal', x: sx, y: sy, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, r: 6, life: 1.8, dm: .5, kb: 0, steer: 4, speed: 420, range: 500, col: '#fb7185', col2: '#fecdd3', glow: '#fb7185', tiles: false, pierce: 1, angle: a, spin: 8, delay: i * .05, trail: '#fda4af' }); } sfx('magic'); } }),
  shadowEcho: delay => ({ onSwing(P, inst) { const f = Math.cos(inst.aim) >= 0 ? 1 : -1; startSwing(P, inst.sw, { ghost: true, delay, ox: -f * 26, oy: 2, alpha: .55, aim: inst.aim, side: inst.side, dmgMult: .75, dur: inst.dur }); } }),
  icicle: () => ({ onApex(P, inst) { const p = shoot(P, inst, { kind: 'linear', shape: 'shard', r: 7, speed: 460, dm: .9, life: 1, col: '#a5f3fc', col2: '#ffffff', glow: '#7dd3fc', grav: 120, trail: '#bae6fd', elem: 'ice', pierce: 1 }); sfx('ice');
    p.onDie = (q, why) => { if (why === 'life') return; const base = Math.atan2(q.vy, q.vx) + PI; for (let i = -1; i <= 1; i++) { const a = base + i * .75 + rnd(-.15, .15); mkProj(P, inst, { kind: 'linear', shape: 'shard', x: q.x, y: q.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 4.5, life: .55, dm: .45, kb: 1, col: '#a5f3fc', col2: '#fff', glow: '#7dd3fc', pierce: 1, angle: a, elem: 'ice' }); } burst(q.x, q.y, 10, { col: ['#bae6fd', '#fff'], spd: 140, glow: true, life: .4 }); }; } }),
  chainShock: () => { const list = []; return { onHit(P, e, h, res) { const now = G.t; for (let i = list.length - 1; i >= 0; i--) if (now - list[i].t > 4 || list[i].e.dead) list.splice(i, 1);
      let me = list.find(x => x.e === e); if (me) me.t = now; else list.push({ e, t: now });
      if (h.noChain) return; for (const o of list) { if (o.e === e || o.e.dead) continue; chainFx(ecx(e), ecy(e), ecx(o.e), ecy(o.e)); hitEnemy(o.e, { src: 'area', id: 'ch' + (G.srcId++), dmg: res.dmg * .5, kb: 0, noKb: true, noCrit: true, ignoreDef: true, sword: h.sword, elem: 'lightning', fs: 0, noHooks: true }); } } }; },
  spinBlade: life => ({ onApex(P, inst) { const t = inst.tip; const p = mkProj(P, inst, { kind: 'custom', shape: 'scythe', x: t.x, y: t.y, r: 18, life, dm: .55, kb: 0, pierce: 0, hitCd: .32, spin: 13, col: '#7c3aed', col2: '#e9d5ff', glow: '#a855f7', glowR: 46, glowA: .65, tiles: false, fs: .3, noKb: false, light: [.55, .25, 1], trail: '#a855f7', trailRate: 50 }); sfx('magic'); } }),
  vinesBelow: () => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const gy = groundY(ecx(e), ecy(e), 16); if (gy < 0) return;
    spike(P, h.inst, ecx(e), gy, { dm: .9, hh: 26, hw: 7, life: .7, delay: .08, shape: 'vine', col: '#2f9a3a', col2: '#7bd05a', kb: 0, status: [['slow', 1, { amt: .3 }]] }); } }),
  corrodeHit: () => ({ onHit(P, e) { applyStatus(e, 'corrode', 8); burst(ecx(e), ecy(e), 6, { col: ['#a3e635', '#65a30d'], spd: 70, g: 250, life: .5 }); } }),
  laser: lenPx => ({ onApex(P, inst) { const o = instOrigin(P, inst); fireBeam({ x: o.x + Math.cos(inst.aim) * ARM, y: o.y + Math.sin(inst.aim) * ARM, ang: inst.aim, len: lenPx + inst.reach, width: 5, hitW: 8, life: .22, col: '#fb7185', col2: '#ffffff', glow: '#f43f5e', dmg: dmgOf(inst, 1.0), kb: inst.sw.knockbackForce * .4, sword: inst.sw }); sfx('laser', .6); } }),
  holyOrb: () => ({ onApex(P, inst) { shoot(P, inst, { kind: 'homing', shape: 'orb', r: 8, speed: 190, steer: 1.7, dm: 1.1, life: 4.2, range: 480, col: '#fef9c3', col2: '#ffffff', glow: '#fde68a', glowR: 30, light: [1, .95, .6], tiles: false, trail: '#fde68a', pierce: 1, pulse: true }); sfx('magic'); } }),
  tentacle: () => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const gy = groundY(ecx(e), ecy(e), 16); if (gy < 0) return; const inst = h.inst;
    const p = mkProj(P, inst, { kind: 'static', shape: 'tentacle', x: ecx(e), y: gy - 24, hw: 12, hh: 24, r: 12, life: .52, dm: .75, kb: 0, pierce: 0, hitCd: .26, col: '#6d28d9', col2: '#c4b5fd', tiles: false, fs: .3, noKb: true }); sfx('splash'); burst(ecx(e), gy, 8, { col: ['#6d28d9', '#a78bfa'], spd: 90, g: 300, life: .4, ang: -PI / 2, spread: 1.5 }); } }),
  groundWaveApex: o => ({ onApex(P, inst) { const f = Math.cos(inst.aim) >= 0 ? 1 : -1, fy = P.y + P.h, dirs = o.both ? [-1, 1] : [f]; const waves = o.waves || 1;
    for (let w = 0; w < waves; w++) for (const d of dirs) groundWave(P, inst, pcx(P) + d * 12, fy, d, Object.assign({}, o, { delay: w * (o.gap || .15), life: (o.life || .64) + w * .12 })); sfx('boom', .6); shake(4); } }),
  noCooldown: () => ({ swing(P, inst) { inst.noCd = true; } }),
  sacrifice: (hp, pct) => ({ swing(P, inst) { if (P.hp > hp + 1) { P.hp -= hp; addText(pcx(P), P.y - 6, '-' + hp, '#ef4444', 13); inst.dmgMult *= 1 + pct; inst.sac = true; burst(pcx(P), pcy(P), 8, { col: ['#ef4444', '#7f1d1d'], spd: 90, glow: true, life: .4 }); } } }),
  speedOnHit: (dur, mult) => ({ onHit(P, e, h) { if (h.src === 'melee') addBuff('speed', dur, { mult }); } }),
  eruption: () => { let last = 0; return { onHit(P, e, h) { if (h.src !== 'melee' || last === h.inst.id) return; last = h.inst.id; const inst = h.inst, x = ecx(e), gy = groundY(x, ecy(e), 14), y = gy < 0 ? ecy(e) : gy;
    burst(x, y, 24, { col: ['#ff5a1a', '#ffb02a', '#fff2a0'], spd: 200, g: 500, life: .8, ang: -PI / 2, spread: 1.2, size: 3.4, glow: true }); sfx('boom', .7); shake(5); ringFx(x, y, 40, '#ff7a1a', .4, 4);
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + rnd(-.7, .7), sp = rnd(260, 420); mkProj(P, inst, { kind: 'ballistic', shape: 'rock', x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7, life: 1.8, dm: .5, kb: 1, grav: 800, pierce: 1, col: '#3a2a24', col2: '#ff7a1a', glow: '#ff7a1a', glowR: 24, trail: '#ff9a2a', spin: rnd(-8, 8), elem: 'fire', status: [['burn', 3, { dps: 5 }]], light: [1, .5, .15] }); } } }; },
  blink: tiles => ({ swing(P, inst) { const a = inst.aim, step = 4, max = tiles * TS; let d = 0; const ox = P.x, oy = P.y;
    while (d < max) { const nx = P.x + Math.cos(a) * step, ny = P.y + Math.sin(a) * step * (Math.abs(Math.sin(a)) > .5 ? 1 : 0); if (overlapSolid(nx, ny, P.w, P.h)) break; P.x = nx; P.y = ny; d += step; }
    if (d > 4) { for (let i = 0; i < 12; i++) { const k = i / 12; addPart({ x: lerp(ox, P.x, k) + P.w / 2, y: lerp(oy, P.y, k) + P.h / 2, life: .35, size: 6, col: '#fde68a', glow: true, vx: 0, vy: 0 }); } sfx('portal', .5); P.vy = Math.min(P.vy, 0); } } }),
  curseHit: dur => ({ onHit(P, e) { applyStatus(e, 'curse', dur, { dps: 3 }); e.noRegen = dur; burst(ecx(e), ecy(e), 6, { col: ['#7e22ce', '#c084fc'], spd: 60, glow: true, life: .5 }); } }),

  // ============ TIER 4 (criadas) ============
  fissure: () => ({ onApex(P, inst) { const f = Math.cos(inst.aim) >= 0 ? 1 : -1, x = pcx(P) + f * 54, gy = groundY(x, P.y + P.h - 4, 8); if (gy < 0) return;
    const p = mkProj(P, inst, { kind: 'static', shape: 'fissure', x, y: gy - 4, hw: 48, hh: 7, r: 20, life: 3.2, dm: .38, kb: 0, pierce: 0, hitCd: .4, col: '#ff7a1a', tiles: false, fs: .2, noKb: true, glow: '#7c2d12', glowR: 54, glowA: .5 });
    p.onUpdate = q => { if (Math.random() < .5) addPart({ x: q.x + rnd(-q.hw, q.hw), y: q.y + 4, vy: -40, life: .5, size: 2.4, col: pick(['#ff7a1a', '#ffb02a']), glow: true }); }; burst(x, gy, 14, { col: ['#8a6a3a', '#3a2a24'], spd: 120, g: 400, life: .5, ang: -PI / 2, spread: 2 }); sfx('boom', .8); shake(5); } }),
  stunGround: (r, dur) => ({ onApex(P, inst) { for (const e of enemiesNear(pcx(P), P.y + P.h, r, q => q.onGround)) applyStatus(e, 'stun', dur); ringFx(pcx(P), P.y + P.h - 4, r, '#d97706', .4, 4); } }),
  spikesAhead: (n, dm, hh) => ({ onApex(P, inst) { const f = Math.cos(inst.aim) >= 0 ? 1 : -1; for (let i = 0; i < n; i++) { const x = pcx(P) + f * (26 + i * 30), gy = groundY(x, P.y + P.h - 4, 8); if (gy >= 0) spike(P, inst, x, gy, { dm, hh: hh || 24, delay: i * .08, col: '#c0b8a8', col2: '#f0e8d8' }); } } }),
  crystalLine: n => ({ onApex(P, inst) { const f = Math.cos(inst.aim) >= 0 ? 1 : -1; for (let i = 0; i < n; i++) { const x = pcx(P) + f * (20 + i * 25), gy = groundY(x, P.y + P.h - 4, 8); if (gy >= 0) spike(P, inst, x, gy, { dm: .8, hh: 20 + i * 2, delay: i * .06, col: '#c084fc', col2: '#f5d0fe', life: 1 }); } sfx('ice', .6); } }),
  giantSpike: () => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const gy = groundY(ecx(e), ecy(e), 16); if (gy < 0) return; spike(P, h.inst, ecx(e), gy, { dm: 2.0, hh: 48, hw: 11, delay: .1, life: 1, col: '#b8b0a0', col2: '#efe8d8', kb: 0 }); } }),
  spikeRing: n => ({ onHit(P, e, h) { if (h.src !== 'melee' || e.ringed > G.t) return; e.ringed = G.t + 1.2; const gy = groundY(ecx(e), ecy(e), 16); if (gy < 0) return; for (let i = 0; i < n; i++) { const x = ecx(e) + Math.cos(i / n * TAU) * 34; const g2 = groundY(x, gy - 6, 8); if (g2 >= 0) spike(P, h.inst, x, g2, { dm: .7, hh: 24, delay: .05 + i * .03, col: '#a8a29e', col2: '#e7e5e4' }); } applyStatus(e, 'slow', 1.5, { amt: .6 }); } }),
  ceilingSpikes: () => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const gy = groundY(ecx(e), ecy(e), 16), cy = ceilY(ecx(e), ecy(e), 16); if (gy >= 0) spike(P, h.inst, ecx(e), gy, { dm: .8, hh: 26, delay: .06 }); if (cy >= 0) spike(P, h.inst, ecx(e), cy, { dm: .8, hh: 26, delay: .12, ceil: true }); } }),
  orbitSpores: n => ({ onApex(P, inst) { for (let i = 0; i < n; i++) { const p = mkProj(P, inst, { kind: 'custom', shape: 'orb', x: pcx(P), y: pcy(P), r: 7, life: 6, dm: 1.0, kb: 1, pierce: 1, col: '#c4b5fd', col2: '#fff', glow: '#a78bfa', glowR: 26, light: [.5, .4, 1], tiles: false, pulse: true, trail: '#c4b5fd', trailRate: 20 }); p.ph = i / n * TAU;
      p.onUpdate = (q, dt) => { q.ph += 3 * dt; const rr = 34 + Math.sin(q.age * 2 + i) * 6; q.x = pcx(P) + Math.cos(q.ph) * rr; q.y = pcy(P) + Math.sin(q.ph) * rr * .7; }; p.onDie = (q, why) => { if (why === 'hit') explode(q.x, q.y, 34, dmgOf(inst, .9), { sword: inst.sw, col: '#a78bfa', kb: 2, silent: false, noHooks: true }); }; } sfx('magic'); } }),
  toxicCloud: () => ({ onHit(P, e, h) { if (h.src !== 'melee') return; const p = mkProj(P, h.inst, { kind: 'static', shape: 'orb', x: ecx(e), y: ecy(e), r: 28, life: 4, dm: .22, kb: 0, pierce: 0, hitCd: .5, col: 'rgba(120,200,80,.35)', col2: 'rgba(190,240,120,.35)', glow: '#84cc16', glowR: 54, glowA: .45, tiles: false, noKb: true, fs: .1, status: [['poison', 3, { dps: 6 }]], elem: 'poison', pulse: true }); p.onUpdate = (q, dt) => { q.y -= 6 * dt; if (Math.random() < dt * 20) addPart({ x: q.x + rnd(-20, 20), y: q.y + rnd(-14, 14), vy: -12, life: .8, size: 3, col: pick(['#84cc16', '#bef264']), glow: true }); }; sfx('splash', .5); } }),
  driftSpores: (n, heal, slow) => ({ onApex(P, inst) { for (let i = 0; i < n; i++) { const a = inst.aim + (i - (n - 1) / 2) * .5; const p = shoot(P, inst, { kind: slow ? 'homing' : 'linear', shape: 'orb', ang: (i - (n - 1) / 2) * .5, speed: 80, steer: .8, r: 9, dm: .8, life: 4.5, kbm: .2, col: slow ? '#c084fc' : '#86efac', col2: '#fff', glow: slow ? '#a855f7' : '#4ade80', glowR: 30, light: slow ? [.6, .3, 1] : [.3, 1, .5], tiles: false, pierce: 1, range: 320, pulse: true, trail: slow ? '#c084fc' : '#86efac', heal, status: slow ? [['slow', 2.5, { amt: .45 }]] : undefined }); p.x0 = p.x; p.y0 = p.y; if (!slow) p.onUpdate = (q, dt) => { q.vy += Math.sin(q.age * 3 + i) * 40 * dt; }; } sfx('magic'); } }),
  gravAura: o => ({ onApex(P, inst) { aura(P, inst, o); sfx('portal', .7); ringFx(pcx(P), pcy(P), o.r, o.col || '#a78bfa', .6, 4); } }),
  antiGravHit: (r, dur) => ({ onHit(P, e, h) { if (h.src !== 'melee') return; ringFx(ecx(e), ecy(e), r, '#67e8f9', .5, 3); for (const t of enemiesNear(ecx(e), ecy(e), r)) applyStatus(t, 'float', dur); sfx('magic', .6); } }),
  gravShock: () => ({ onApex(P, inst) { const t = inst.tip; for (const e of enemiesNear(t.x, t.y, 150)) { if (e.boss) continue; const dx = t.x - ecx(e), dy = t.y - ecy(e), d = Math.hypot(dx, dy) || 1; e.vx += dx / d * 260; e.vy += dy / d * 200; e.kbT = .3; }
    ringFx(t.x, t.y, 150, '#a78bfa', .5, 4); const f = Math.cos(inst.aim) >= 0 ? 1 : -1; for (const d of [-1, 1]) groundWave(P, inst, pcx(P) + d * 12, P.y + P.h, d, { hw: 12, hh: 14, speed: 280, life: .6, col: '#6d28d9', col2: '#ddd6fe', delay: .25 }); sfx('boom', .7); } }),
  // ============ TIER 5 ============
  solarMeteor: () => ({ onApex(P, inst) { const m = G.mouse, tx = clamp(m.wx, pcx(P) - 420, pcx(P) + 420), ty = clamp(m.wy, pcy(P) - 300, pcy(P) + 260); meteorFall(P, inst, tx, ty, { r: 26, dm: 2.4, boomR: 96, col: '#ff7a1a', col2: '#fff2a0', tiles: 52, height: 520, speed: 680, ang: PI / 2 + (Math.random() < .5 ? -.45 : .45) }); sfx('fire'); } }),
  phaseBlade: () => ({ onApex(P, inst) { shoot(P, inst, { kind: 'linear', shape: 'blade', r: 12, speed: 700, dm: 1.0, life: 1.3, pierce: 999, tiles: false, col: '#a78bfa', col2: '#ffffff', glow: '#7c3aed', glowR: 36, trail: '#c4b5fd', light: [.6, .4, 1], kbm: .6 }); sfx('portal', .5); } }),
  darkMatter: () => { let last = 0; return { onHit(P, e, h) { if (h.src !== 'melee' || last === h.inst.id) return; last = h.inst.id; const inst = h.inst, x = ecx(e), y = ecy(e);
    const p = mkProj(P, inst, { kind: 'custom', shape: 'blackhole', noHit: true, x, y, r: 34, life: 2.6, dm: 0, pierce: 0, col: '#a78bfa', glow: '#4c1d95', glowR: 90, glowA: .6, tiles: false, spin: 6, grow: true, light: [.35, .2, .6] }); sfx('portal');
    p.onUpdate = (q, dt) => { for (const t of enemiesNear(q.x, q.y, 140)) { const dx = q.x - ecx(t), dy = q.y - ecy(t), d = Math.hypot(dx, dy) || 1; if (!t.boss) { t.vx += dx / d * 520 * dt; t.vy += dy / d * 380 * dt; t.vx *= .97; t.kbT = Math.max(t.kbT || 0, .06); }
        hitEnemy(t, { src: 'area', id: q.id + ':' + Math.floor(G.t / .3), imm: .3, dmg: dmgOf(inst, .3), kb: 0, noKb: true, sword: inst.sw, fs: .2, critChance: 0 }); }
      if (Math.random() < dt * 50) { const a = rnd(TAU); addPart({ x: q.x + Math.cos(a) * 60, y: q.y + Math.sin(a) * 60, vx: -Math.cos(a) * 130, vy: -Math.sin(a) * 130, life: .45, size: 2.4, col: '#c4b5fd', glow: true }); } };
    p.onDie = q => { explode(q.x, q.y, 50, dmgOf(inst, .8), { sword: inst.sw, col: '#a78bfa', kb: 3, noHooks: true }); }; } }; },
  voidStep: () => ({ onKill(P, e, h) { addBuff('invuln', 2); addBuff('invis', 2); burst(pcx(P), pcy(P), 14, { col: ['#6366f1', '#a5b4fc', '#fff'], spd: 120, glow: true, life: .5 }); sfx('portal', .6); addText(pcx(P), P.y - 12, 'Vazio', '#a5b4fc', 13); } }),
  galaxy: () => ({ onApex(P, inst) { const n = 4; for (let i = 0; i < n; i++) { const dirOff = (i - 1.5) * .26, a = inst.aim + dirOff, sp = 300;
      const p = mkProj(P, inst, { kind: 'custom', shape: 'ball', x: inst.tip.x, y: inst.tip.y, r: 10, life: 1.7, dm: .85, kb: 1, pierce: 0, hitCd: .5, col: ['#60a5fa', '#f472b6', '#fbbf24', '#34d399'][i], col2: '#fff', glow: ['#3b82f6', '#ec4899', '#f59e0b', '#10b981'][i], glowR: 30, tiles: false, spin: 5, light: [.5, .5, 1], trail: ['#60a5fa', '#f472b6', '#fbbf24', '#34d399'][i], fs: .3 });
      p.cx = p.x; p.cy = p.y; p.ph = i * 1.57; p.ad = a;
      p.onUpdate = (q, dt) => { const spd = sp * (.7 + .3 * Math.min(1, q.age * 2)); q.cx += Math.cos(q.ad) * spd * dt; q.cy += Math.sin(q.ad) * spd * dt; q.ad += dirOff * .25 * dt * 2; const orb = 16 + 26 * Math.min(1, q.age / .8); q.ph += 7 * dt; q.x = q.cx + Math.cos(q.ph) * orb * .6; q.y = q.cy + Math.sin(q.ph) * orb; if (solidPx(q.cx, q.cy)) killProj(q, 'tile'); }; } sfx('magic'); } }),
  timeStopCrit: dur => ({ onHit(P, e, h, res) { if (!res.crit || G.freeze > 0) return; G.freeze = dur; flash('#fde68a', .35, .5); for (const t of enemiesOnScreen(120)) applyStatus(t, 'timestop', dur); sfx('portal'); addText(pcx(P), P.y - 20, 'TEMPO PARADO', '#fbbf24', 15, 1.2); ringFx(pcx(P), pcy(P), 160, '#fbbf24', .8, 4); } }),
  plasmaSeekers: n => ({ onApex(P, inst) { for (let i = 0; i < n; i++) shoot(P, inst, { kind: 'homing', shape: 'orb', ang: (i - (n - 1) / 2) * .7, r: 7, speed: 360, steer: 5.5, dm: .62, life: 3.5, range: 560, col: '#f0abfc', col2: '#fff', glow: '#d946ef', glowR: 28, light: [.9, .3, 1], tiles: false, trail: '#e879f9', pierce: 1, pulse: true }); sfx('magic'); } }),
  compressHit: dur => ({ onHit(P, e) { applyStatus(e, 'compress', dur); burst(ecx(e), ecy(e), 8, { col: ['#94a3b8', '#e2e8f0'], spd: 60, glow: true, life: .35 }); } }),
  cosmicRot: () => ({ onHit(P, e) { applyStatus(e, 'rot', 4, { dps: 100 }); } }),
  hyperReach: p => { let st = 0, land = 0; return { swing(P, inst) { if (!P.onGround) { st = Math.min(6, st + 1); } inst.reach *= 1 + p * st; if (st) addText(pcx(P), P.y - 14, 'Alcance +' + Math.round(p * st * 100) + '%', '#fca5a5', 11); }, tick(P, dt) { if (P.onGround) { land += dt; if (land > .25) st = 0; } else land = 0; } }; },
  pctMaxHp: p => ({ mod(P, e, h) { h.pctMax = (h.pctMax || 0) + p; } }),
  flashBlind: dur => ({ onApex(P, inst) { flash('#ffffff', .85, .45); for (const e of enemiesOnScreen(100)) applyStatus(e, 'blind', dur); sfx('magic'); addText(pcx(P), P.y - 14, 'Cegos!', '#fef08a', 14); } }),
  solarFlames: n => ({ onApex(P, inst) { const t = inst.tip; for (let i = 0; i < n; i++) flameZone(P, inst, t.x + (i - (n - 1) / 2) * 24 + rnd(-6, 6), t.y + rnd(-10, 10), { dm: .3, life: 6, r: 12 }); sfx('fire'); } }),
  chaosElem: () => ({ onHit(P, e, h, res) { if (h.src !== 'melee') return; const k = (Math.random() * 4) | 0; const x = ecx(e), y = ecy(e);
    if (k === 0) { applyStatus(e, 'burn', 4, { dps: 14 }); burst(x, y, 10, { col: ['#ff7a1a', '#ffd23a'], spd: 110, glow: true, life: .4 }); addText(x, e.y - 18, 'Fogo', '#fb923c', 11); }
    else if (k === 1) { applyStatus(e, 'freeze', 2, { amt: .6 }); burst(x, y, 10, { col: ['#bae6fd', '#fff'], spd: 110, glow: true, life: .4 }); addText(x, e.y - 18, 'Gelo', '#7dd3fc', 11); sfx('ice', .6); }
    else if (k === 2) { applyStatus(e, 'shock', 1); for (const t of enemiesNear(x, y, 90)) if (t !== e) { chainFx(x, y, ecx(t), ecy(t)); hitEnemy(t, { src: 'area', id: 'cz' + (G.srcId++), dmg: res.dmg * .45, noKb: true, noCrit: true, sword: h.sword, noHooks: true, fs: 0, elem: 'lightning' }); } addText(x, e.y - 18, 'Raio', '#fde047', 11); }
    else { applyStatus(e, 'poison', 5, { dps: 12 }); burst(x, y, 10, { col: ['#84cc16', '#bef264'], spd: 90, glow: true, life: .4 }); addText(x, e.y - 18, 'Veneno', '#a3e635', 11); } } }),
  lowHpFrenzy: (thr, bonus) => ({ atkMult(P) { return P.hp / P.maxHp < thr ? 1 + bonus : 1; } }),
  backstab: m => ({ mod(P, e, h) { if (h.src === 'dot') return; if (e.face !== undefined && (pcx(P) - ecx(e)) * e.face < 0) { h.mult = (h.mult || 1) * m; e.backHit = true; addText(ecx(e), e.y - 22, 'Pelas costas! x' + m, '#c084fc', 12, 1); burst(ecx(e), ecy(e), 8, { col: ['#a855f7', '#fff'], spd: 120, glow: true, life: .35 }); } } }),
  swordRain: n => ({ onApex(P, inst) { const m = G.mouse, tx = clamp(m.wx, pcx(P) - 380, pcx(P) + 380), ty = clamp(m.wy, pcy(P) - 220, pcy(P) + 200);
    for (let i = 0; i < n; i++) { const x = tx + (i - (n - 1) / 2) * 24 + rnd(-8, 8); const p = mkProj(P, inst, { kind: 'linear', shape: 'sword', x, y: ty - 340 - rnd(0, 80), vx: 0, vy: 720, r: 9, life: 1.2, dm: .6, kb: 1, pierce: 1, col: '#fde68a', col2: '#fff', glow: '#fbbf24', glowR: 30, trail: '#fde68a', delay: i * .045, angle: PI / 2, light: [1, .9, .5], noAim: true, hitCd: 1e9 }); p.onDie = q => burst(q.x, q.y, 6, { col: ['#fde68a', '#fff'], spd: 90, glow: true, life: .3 }); } sfx('magic'); } }),
  antiProj: () => ({ init(sw) { sw.antiProj = true; } }),
  panicAura: (r, dur) => ({ onApex(P, inst) { ringFx(pcx(P), pcy(P), r, '#e879f9', .6, 5); ringFx(pcx(P), pcy(P), r * .6, '#7e22ce', .5, 3); for (const e of enemiesNear(pcx(P), pcy(P), r)) { applyStatus(e, 'panic', dur); addText(ecx(e), e.y - 14, '!', '#f472b6', 16); } sfx('boom', .4); } }),
  judgmentBeam: () => ({ onApex(P, inst) { const o = instOrigin(P, inst); const p = fireBeam({ x: o.x + Math.cos(inst.aim) * ARM, y: o.y + Math.sin(inst.aim) * ARM, ang: inst.aim, len: 2400, width: 24, hitW: 26, life: .7, tick: .1, pierceTiles: true, col: '#fff7c2', col2: '#ffffff', glow: '#fbbf24', dmg: dmgOf(inst, .55), kb: 1, sword: inst.sw }); p.light = [1, .9, .5]; sfx('laser'); shake(5); flash('#fff7c2', .2, .3); } }),

  // ============ TIER 6 (criadas) ============
  homingVolley: (n, o) => ({ onApex(P, inst) { o = o || {}; for (let i = 0; i < n; i++) shoot(P, inst, { kind: 'homing', shape: o.shape || 'star', ang: (i - (n - 1) / 2) * (o.spread || .32), r: o.r || 7, speed: o.speed || 400, steer: o.steer || 6, dm: o.dm || .4, life: 3.2, range: 700, col: o.col || '#fde68a', col2: '#fff', glow: o.glow || '#fbbf24', glowR: 26, light: [1, .85, .4], tiles: false, trail: o.col || '#fde68a', pierce: 1, spin: 8, pulse: true }); sfx('magic'); } }),
  starCollapse: (every) => { let last = 0; return { onHit(P, e, h, res) { if (h.src !== 'melee' || last === h.inst.id) return; if (every === 'crit' && !res.crit) return; last = h.inst.id; const inst = h.inst, x = ecx(e), y = ecy(e);
    const p = mkProj(P, inst, { kind: 'custom', shape: 'blackhole', noHit: true, x, y, r: 40, life: .85, dm: 0, pierce: 0, col: '#fde68a', glow: '#f59e0b', glowR: 100, glowA: .7, tiles: false, spin: 9, grow: true, light: [1, .8, .3] }); sfx('portal');
    p.onUpdate = (q, dt) => { for (const t of enemiesNear(q.x, q.y, 170)) { if (t.boss) continue; const dx = q.x - ecx(t), dy = q.y - ecy(t), d = Math.hypot(dx, dy) || 1; t.vx += dx / d * 800 * dt; t.vy += dy / d * 600 * dt; t.vx *= .96; t.kbT = Math.max(t.kbT || 0, .06); } if (Math.random() < dt * 60) { const a = rnd(TAU); addPart({ x: q.x + Math.cos(a) * 90, y: q.y + Math.sin(a) * 90, vx: -Math.cos(a) * 200, vy: -Math.sin(a) * 200, life: .4, size: 3, col: '#fde68a', glow: true }); } };
    p.onDie = q => { explode(q.x, q.y, 120, dmgOf(inst, 2.4), { sword: inst.sw, col: '#fde68a', cols: ['#fde68a', '#fff', '#f59e0b'], kb: 6, tiles: 0, noHooks: true }); flash('#fde68a', .4, .3); }; } }; },
  portalBlades: () => ({ onApex(P, inst) { const f = inst.aim, t = inst.tip, nx = -Math.sin(f), ny = Math.cos(f);
    for (const s of [-1, 1]) portalAt(P, inst, t.x + nx * 36 * s, t.y + ny * 36 * s, { life: 3, every: .3, angle: f + PI / 2, fire(q) { const tg = nearestEnemy(q.x, q.y, 640); const a = tg ? Math.atan2(ecy(tg) - q.y, ecx(tg) - q.x) : f; homingBlade(P, inst, q.x, q.y, a, { dm: .38, speed: 440 }); sfx('shot', .3); } }); } }),
  fullScreen: (every, mult, o) => { let n = 0; return { onApex(P, inst) { n++; if (every && n % every) return; const c = screenDamage(P, inst, mult, o); flash((o && o.col) || '#ffffff', .5, .35); sfx('thunder'); shake(8); if (c) addText(pcx(P), P.y - 20, (o && o.label) || 'JULGAMENTO!', (o && o.col) || '#fde047', 16, 1.2); } }; },
  boomerang: () => ({ onApex(P, inst) { const tg = nearestEnemy(inst.tip.x + Math.cos(inst.aim) * 120, inst.tip.y + Math.sin(inst.aim) * 120, 420), a = tg ? Math.atan2(ecy(tg) - inst.tip.y, ecx(tg) - inst.tip.x) : inst.aim;
    const p = mkProj(P, inst, { kind: 'custom', shape: 'blade', x: inst.tip.x, y: inst.tip.y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 12, life: 3, dm: 1, kb: 2, pierce: 0, hitCd: .15, col: '#a5f3fc', col2: '#fff', glow: '#22d3ee', glowR: 34, trail: '#67e8f9', tiles: false, spin: 0, light: [.4, .9, 1], fs: .4, back: false });
    p.onUpdate = (q, dt) => { if (!q.back && q.age > .5) { q.back = true; q.hm.clear(); } if (q.back) { const dx = pcx(P) - q.x, dy = pcy(P) - q.y, d = Math.hypot(dx, dy) || 1; q.vx += (dx / d * 720 - q.vx) * Math.min(1, 7 * dt); q.vy += (dy / d * 720 - q.vy) * Math.min(1, 7 * dt); if (d < 18) killProj(q, 'caught'); } else { q.vx *= .985; q.vy *= .985; } q.x += q.vx * dt; q.y += q.vy * dt; q.angle = Math.atan2(q.vy, q.vx) + q.age * 18; }; sfx('magic'); } }),
  oracleMarks: () => { let t = 0; return { onHit(P, e, h) { applyStatus(e, 'mark', 6); }, tick(P, dt) { t -= dt; if (t > 0) return; t = .45; const inst = { sw: sword(P), dmgMult: 1 }; for (const e of G.enemies) if (!e.dead && hasStatus(e, 'mark') && Math.hypot(ecx(e) - pcx(P), ecy(e) - pcy(P)) < 520) { const a = Math.atan2(ecy(e) - pcy(P), ecx(e) - pcx(P)) + rnd(-.5, .5); homingBlade(P, inst, pcx(P), pcy(P) - 6, a, { dm: .32, speed: 430, col: '#f0abfc', glow: '#d946ef', trail: '#f0abfc', target: e, steer: 7 }); } } }; },
  portalBeam: () => ({ onApex(P, inst) { const t = inst.tip; portalAt(P, inst, t.x + Math.cos(inst.aim) * 26, t.y + Math.sin(inst.aim) * 26, { life: .9, every: 5, first: .12, angle: inst.aim + PI / 2, r: 26, col: '#22d3ee', col2: '#cffafe', fire(q) { shoot(P, inst, { x: q.x, y: q.y, kind: 'linear', shape: 'sword', r: 17, speed: 820, dm: 3.0, life: .75, pierce: 999, tiles: false, col: '#67e8f9', col2: '#fff', glow: '#06b6d4', glowR: 54, trail: '#67e8f9', light: [.4, .9, 1], kbm: 1 }); sfx('laser'); shake(4); } }); } }),
  starSeeds: () => { const stars = []; return { onHit(P, e, h) { if (h.src !== 'melee') return; const inst = h.inst, p = mkProj(P, inst, { kind: 'custom', shape: 'star', noHit: true, x: ecx(e), y: ecy(e) - 8, r: 8, life: 8, dm: 0, pierce: 0, col: '#fde68a', col2: '#fff', glow: '#fbbf24', glowR: 34, tiles: false, spin: 2, light: [1, .9, .5], pulse: true });
      p.fire = .6; p.onUpdate = (q, dt) => { q.fire -= dt; if (q.fire <= 0) { q.fire = .8; const tg = nearestEnemy(q.x, q.y, 380); if (tg) homingBlade(P, inst, q.x, q.y, Math.atan2(ecy(tg) - q.y, ecx(tg) - q.x), { dm: .3, speed: 480, shape: 'star', col: '#fde68a', glow: '#fbbf24', trail: '#fde68a', r: 5 }); } };
      stars.push(p); while (stars.length > 8) { const o = stars.shift(); o.dead = true; } stars.forEach((s, i) => { if (s.dead) stars.splice(i, 1); }); } }; },
  auroraSweep: () => ({ onApex(P, inst) { const o = instOrigin(P, inst), a0 = inst.aim - .85, a1 = inst.aim + .85, side = inst.side;
    const p = fireBeam({ x: o.x, y: o.y, ang: side > 0 ? a0 : a1, len: 2300, width: 26, hitW: 28, life: .95, tick: .07, pierceTiles: true, col: '#5eead4', col2: '#e9d5ff', glow: '#a78bfa', dmg: dmgOf(inst, .3), kb: .5, sword: inst.sw, follow: null });
    const t0 = G.t; p.onUpdate0 = p.onUpdate; p.onUpdate = (q, dt) => { const k = clamp((G.t - t0) / .85, 0, 1); q.ang = side > 0 ? lerp(a0, a1, k) : lerp(a1, a0, k); const s = instOrigin(P, inst); q.x = s.x; q.y = s.y; p.onUpdate0(q, dt); }; sfx('laser'); shake(4); } }),
  eclipse: () => ({ onApex(P, inst) { G.dark = 1.6; flash('#000000', .6, .5); const c = screenDamage(P, inst, .55, { col: '#c4b5fd' }); for (const e of enemiesOnScreen(100)) applyStatus(e, 'blind', 3.5); sfx('boom', .8); shake(6); addText(pcx(P), P.y - 20, 'ECLIPSE', '#c4b5fd', 17, 1.2); } }),
  supernova: () => ({ onApex(P, inst) { const m = G.mouse, tx = clamp(m.wx, pcx(P) - 520, pcx(P) + 520), ty = clamp(m.wy, pcy(P) - 360, pcy(P) + 300);
    const p = mkProj(P, inst, { kind: 'custom', shape: 'star', noHit: true, x: tx, y: ty, r: 12, life: .55, dm: 0, pierce: 0, col: '#fff7c2', col2: '#fff', glow: '#fbbf24', glowR: 60, tiles: false, spin: 12, light: [1, .9, .6] }); sfx('portal');
    p.onUpdate = q => { q.r = 12 + q.age * 60; q.glowR = 60 + q.age * 220; }; p.onDie = q => { explode(tx, ty, 230, dmgOf(inst, 3.2), { sword: inst.sw, col: '#fde68a', cols: ['#fff7c2', '#fbbf24', '#fff'], kb: 8, falloff: true, noHooks: true, tiles: 0 }); ringFx(tx, ty, 300, '#fff', .7, 6); flash('#fff7c2', .7, .5); shake(14); sfx('thunder'); }; } }),
  soulScythes: n => ({ onKill(P, e, h) { const inst = { sw: h.sword, dmgMult: 1 }; for (let i = 0; i < n; i++) homingBlade(P, inst, ecx(e), ecy(e), -PI / 2 + (i - (n - 1) / 2) * .9, { dm: .55, speed: 380, shape: 'scythe', r: 8, col: '#a5b4fc', col2: '#fff', glow: '#6366f1', spin: 12, steer: 5, trail: '#818cf8', pierce: 2 }); burst(ecx(e), ecy(e), 10, { col: ['#a5b4fc', '#fff'], spd: 100, glow: true, life: .5, g: -80 }); sfx('magic', .6); } }),
  orbitBlades: n => ({ onApex(P, inst) { for (let i = 0; i < n; i++) { const p = mkProj(P, inst, { kind: 'custom', shape: 'sword', x: pcx(P), y: pcy(P), r: 12, life: 5.2, dm: .5, kb: 1, pierce: 0, hitCd: .32, col: '#fcd34d', col2: '#fff', glow: '#fbbf24', glowR: 30, light: [1, .85, .4], tiles: false, trail: '#fde68a', fs: .3 }); p.ph = i / n * TAU; p.rad = 44;
      p.onUpdate = (q, dt) => { q.ph += 4.2 * dt; const tg = nearestEnemy(pcx(P), pcy(P), 190); let tx = pcx(P) + Math.cos(q.ph) * q.rad, ty = pcy(P) + Math.sin(q.ph) * q.rad * .8;
        if (tg) { const k = .55 + .15 * Math.sin(q.age * 9 + i * 2); tx = lerp(tx, ecx(tg) + Math.cos(q.ph * 2) * 14, k); ty = lerp(ty, ecy(tg) + Math.sin(q.ph * 2) * 14, k); }
        q.angle = Math.atan2(ty - q.y, tx - q.x); q.x = lerp(q.x, tx, Math.min(1, 14 * dt)); q.y = lerp(q.y, ty, Math.min(1, 14 * dt)); }; } sfx('magic'); } }),
  spiralScythes: n => ({ onApex(P, inst) { for (let i = 0; i < n; i++) { const a = inst.aim + i / n * TAU * .6 - .6; homingBlade(P, inst, inst.tip.x, inst.tip.y, a, { dm: .42, speed: 360, shape: 'scythe', r: 9, col: '#818cf8', col2: '#e0e7ff', glow: '#6366f1', spin: 14, steer: 3.5, trail: '#a5b4fc', delay: i * .06, pierce: 2 }); } sfx('magic'); } }),
  apocalypse: n => ({ onApex(P, inst) { const m = G.mouse, tx = clamp(m.wx, pcx(P) - 420, pcx(P) + 420), ty = clamp(m.wy, pcy(P) - 200, pcy(P) + 260);
    for (let i = 0; i < n; i++) { const x = tx + (i - (n - 1) / 2) * 56 + rnd(-24, 24), ey = ty + rnd(-40, 60); meteorFall(P, inst, x, ey, { r: 18, dm: .85, boomR: 62, col: '#ef4444', col2: '#fde047', delay: i * .1, height: 460 + rnd(0, 80), ang: PI / 2 + rnd(-.3, .3), speed: 700 }); } sfx('fire'); shake(5); flash('#7f1d1d', .25, .6); } }),
  homingHole: () => ({ onApex(P, inst) { const p = shoot(P, inst, { kind: 'homing', shape: 'blackhole', r: 30, speed: 110, steer: 1.6, dm: 0, noHit: true, life: 6, range: 700, col: '#c4b5fd', glow: '#4c1d95', glowR: 80, glowA: .65, tiles: false, spin: 7, grow: true, light: [.4, .2, .7] });
    sfx('portal'); p.onUpdate = (q, dt) => { for (const t of enemiesNear(q.x, q.y, 120)) { const dx = q.x - ecx(t), dy = q.y - ecy(t), d = Math.hypot(dx, dy) || 1; if (!t.boss) { t.vx += dx / d * 520 * dt; t.vy += dy / d * 400 * dt; t.vx *= .97; t.kbT = Math.max(t.kbT || 0, .06); } hitEnemy(t, { src: 'area', id: q.id + ':' + Math.floor(G.t / .3), imm: .3, dmg: dmgOf(inst, .42), kb: 0, noKb: true, sword: inst.sw, fs: .2, critChance: 0 }); } }; p.onDie = q => explode(q.x, q.y, 70, dmgOf(inst, 1.2), { sword: inst.sw, col: '#a78bfa', noHooks: true }); } }),
  portalBurst: n => ({ onApex(P, inst) { const m = G.mouse, tx = clamp(m.wx, pcx(P) - 380, pcx(P) + 380), ty = clamp(m.wy, pcy(P) - 280, pcy(P) + 220);
    portalAt(P, inst, tx, ty, { life: 1.9, every: .9, first: .25, r: 28, col: '#d946ef', col2: '#fae8ff', fire(q) { for (let i = 0; i < n; i++) homingBlade(P, inst, q.x, q.y, i / n * TAU, { dm: .4, speed: 420, col: '#f0abfc', glow: '#d946ef', trail: '#f0abfc' }); sfx('portal', .5); } }); } }),
  cosmosOrigin: () => ({ onApex(P, inst) { for (let i = 0; i < 8; i++) shoot(P, inst, { kind: 'homing', shape: 'star', ang: (i - 3.5) * .22, r: 6, speed: 400, steer: 6, dm: .3, life: 3, range: 700, col: '#fde68a', col2: '#fff', glow: '#fbbf24', glowR: 24, light: [1, .85, .4], tiles: false, trail: '#fde68a', pierce: 1, spin: 8, pulse: true });
    const t = inst.tip; portalAt(P, inst, t.x + Math.cos(inst.aim) * 30, t.y + Math.sin(inst.aim) * 30, { life: .8, every: 5, first: .1, r: 24, col: '#fbbf24', col2: '#fff7c2', angle: inst.aim + PI / 2, fire(q) { shoot(P, inst, { x: q.x, y: q.y, kind: 'linear', shape: 'sword', r: 14, speed: 780, dm: 1.6, life: .7, pierce: 999, tiles: false, col: '#fde68a', col2: '#fff', glow: '#fbbf24', glowR: 44, trail: '#fde68a', kbm: .8 }); sfx('laser', .6); } }); sfx('magic'); } }),
};

// efeitos utilitários internos
function breakHeldSword() { // 005: 5% de chance de quebrar (reembolsa metade dos materiais)
  const P = G.P, it = P.inv[P.sel]; if (!it || IT[it.id].type !== 'sword') return;
  P.inv[P.sel] = null; invDirty();
  const r = RECIPES.find(r => r.out === it.id);
  if (r) for (const k in r.ing) { const n = Math.floor(r.ing[k] / 2); if (n > 0) dropItem(k, n, pcx(P), P.y); }
  burst(pcx(P), P.y, 22, { col: ['#2a1f3d', '#a78bfa', '#fff'], spd: 200, g: 500, life: .6, glow: true }); sfx('break'); toast('Vidro Vulcânico quebrou! (metade dos materiais devolvida)', '#f87171');
  P.cb.sw = null;
}
