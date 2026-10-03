/* ============================================================
   09b_swing: arco de ataque (ArcSwing/Thrust/Beam), ápice,
   detecção de colisão da lâmina, instâncias de golpe (clones)
   GDD: θ0 -> θfinal em torno do ombro, direção (Cursor - Jogador);
   projéteis herdam 100% da direção do arco no ápice.
   ============================================================ */
const ARM = 7;
function atkSpeedMult(P) {
  let m = 1 + (P.buffs.haste ? P.buffs.haste.amt : 0);
  const sw = P.cb.sw; if (sw) { const v = fxAll(sw, 'atkMult', P); if (v) m *= v; }
  return m;
}
function startSwing(P, sw, o) {
  o = o || {}; const cb = P.cb, sh = shoulderOf(P);
  const aim = o.aim !== undefined ? o.aim : Math.atan2(G.mouse.wy - sh.y, G.mouse.wx - sh.x);
  if (!o.ghost && !o.keepFace) P.face = Math.cos(aim) >= 0 ? 1 : -1;
  const cycle = 1 / (sw.attackSpeed * atkSpeedMult(P));
  const inst = {
    id: G.swingId++, sw, ghost: !!o.ghost, sub: !!o.sub, ox: o.ox || 0, oy: o.oy || 0, aim, side: o.side !== undefined ? o.side : cb.side, t: -(o.delay || 0), dur: 0,
    arc: sw.look.arc || 2.5, reach: sw.look.len - 3 + ARM, thrust: sw.attackType === 'Thrust' || sw.attackType === 'Beam', hit: new Set(), apex: false,
    dmgMult: o.dmgMult || 1, kbMult: 1, trail: [], alpha: o.alpha === undefined ? 1 : o.alpha, noCd: false, cycle, hitCount: 0, a: aim, pa: null, dead: false, fade: 0,
  };
  inst.dur = o.dur || Math.min(cycle * .62, .30 + .1 * cycle);
  if (!o.ghost && !o.sub) {
    fxCall(sw, 'swing', P, inst, cb);
    if (inst.noCd) inst.dur = inst.cycle;
    cb.cd = inst.cycle; cb.side = -cb.side; cb.count++; cb.swingT = Math.max(inst.dur, .15) + .1; cb.main = inst;
    sfx(sw.tierLevel >= 4 ? 'swing2' : 'swing');
    fxCall(sw, 'onSwing', P, inst, cb);
  }
  cb.inst.push(inst); return inst;
}
function instOrigin(P, inst) { const s = shoulderOf(P); return { x: s.x + inst.ox, y: s.y + inst.oy }; }
function instAngle(inst, p) {
  if (inst.thrust) return inst.aim;
  const pe = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease in-out
  const facing = Math.cos(inst.aim) >= 0 ? 1 : -1, rot = inst.side * facing;
  return inst.aim - rot * inst.arc / 2 + rot * inst.arc * (.06 + .94 * pe) - rot * inst.arc * .06 * 0;
}
function instTipDist(inst, p) { return inst.thrust ? ARM + (inst.reach - ARM) * (.3 + .7 * Math.sin(clamp(p, 0, 1) * PI)) : inst.reach; }
function updateSwings(P, dt) {
  const cb = P.cb; if (cb.cd > 0) cb.cd -= dt; if (cb.swingT > 0) cb.swingT -= dt; if (cb.blockT > 0) cb.blockT -= dt;
  for (let i = cb.inst.length - 1; i >= 0; i--) {
    const inst = cb.inst[i]; inst.t += dt;
    if (inst.t < 0) continue;
    if (inst.t >= inst.dur) { if (inst.fade === 0) { inst.fade = .14; if (cb.main === inst) cb.main = null; } inst.fade -= dt; if (inst.fade <= 0) cb.inst.splice(i, 1); continue; }
    const p = clamp(inst.t / inst.dur, 0, 1), a = instAngle(inst, p), o = instOrigin(P, inst), td = instTipDist(inst, p);
    const prevA = inst.pa === null ? a : inst.pa; inst.pa = a; inst.a = a;
    inst.tipX = o.x + Math.cos(a) * td; inst.tipY = o.y + Math.sin(a) * td;
    inst.trail.push([inst.tipX, inst.tipY, G.t]); if (inst.trail.length > 12) inst.trail.shift();
    if (p >= .5 && !inst.apex) { inst.apex = true; inst.tip = { x: o.x + Math.cos(inst.aim) * inst.reach, y: o.y + Math.sin(inst.aim) * inst.reach }; inst.ox0 = o.x; inst.oy0 = o.y; fxCall(inst.sw, 'onApex', P, inst); }
    if (p > .07 && p < .97) swingHit(P, inst, o, prevA, a, td);
  }
}
function swingHit(P, inst, o, a0, a1, td) {
  const sw = inst.sw, reachNow = td;
  const steps = inst.thrust ? 1 : Math.max(1, Math.ceil(Math.abs(angDiff(a0, a1)) / .12));
  for (const e of G.enemies) {
    if (e.dead || e.ghostly || e.harmless || e.invulnerable || inst.hit.has(e)) continue;
    let touched = false;
    for (let s = 0; s <= steps && !touched; s++) {
      const a = a0 + angDiff(a0, a1) * (steps ? s / steps : 1), dx = Math.cos(a), dy = Math.sin(a);
      const x0 = o.x + dx * ARM * .6, y0 = o.y + dy * ARM * .6, x1 = o.x + dx * reachNow, y1 = o.y + dy * reachNow;
      if (segAABB(x0, y0, x1, y1, e.x - 2, e.y - 2, e.w + 4, e.h + 4)) touched = true;
    }
    if (!touched) continue;
    inst.hit.add(e);
    const px = P.x + P.w / 2, py = P.y + P.h / 2, ex = ecx(e) - px, ey = ecy(e) - py, l = Math.hypot(ex, ey) || 1;
    const h = { src: 'melee', id: 'm' + inst.id, imm: 1e9, dmg: sw.baseDamage * inst.dmgMult, kb: sw.knockbackForce, kbMult: inst.kbMult, dir: { x: ex / l, y: ey / l - .12 }, sword: sw, inst, critChance: sw.critChance, fromX: px, fromY: py, fs: 1 };
    const res = hitEnemy(e, h);
    if (res) { inst.hitCount++; P.cb.hits++; P.cb.lastHitT = G.t; if (!inst.ghost) { G.hitStop = Math.max(G.hitStop, res.crit ? .045 : .02); shake(res.crit ? 3 : 1.5); } }
  }
  // lâmina destrói projéteis inimigos (Gládio Antimatéria)
  if (sw.antiProj) for (const p of G.projs) {
    if (p.friendly || p.dead) continue;
    const dx = Math.cos(a1), dy = Math.sin(a1);
    if (segAABB(o.x, o.y, o.x + dx * (reachNow + 8), o.y + dy * (reachNow + 8), p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)) { p.dead = true; burst(p.x, p.y, 8, { col: ['#fff', '#a5f3fc'], spd: 120, glow: true, life: .3 }); sfx('magic'); }
  }
}
function drawSwingTrail(g, P) {
  for (const inst of P.cb.inst) {
    if (inst.t < 0 || inst.trail.length < 2) continue;
    const sw = inst.sw, col = sw.look.glow || TIERS[sw.tierLevel].col, fade = inst.t >= inst.dur ? clamp(inst.fade / .14, 0, 1) : 1;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const tr = inst.trail, n = tr.length;
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < n; i++) {
      const age = G.t - tr[i][2], k = clamp(1 - age / .16, 0, 1) * fade; if (k <= 0) continue;
      g.strokeStyle = pass ? '#ffffff' : col; g.globalAlpha = k * (pass ? .55 : .7) * inst.alpha; g.lineWidth = (pass ? 2 : 7) * (.4 + .6 * i / n);
      g.beginPath(); g.moveTo(tr[i - 1][0], tr[i - 1][1]); g.lineTo(tr[i][0], tr[i][1]); g.stroke();
    }
    g.restore();
  }
}
