/* ============================================================
   10b_gear_fx: mecânicas dos 50 acessórios, 50 armaduras e 10 conjuntos
   - ACC_FX: 50 efeitos únicos (um por acessório)
   - ARM_FX: 50 passivas (uma por armadura, 5 por família)
   - SET_FX: bônus de conjunto (armadura + acessórios da mesma família)
   Ganchos chamados pelo motor: stats, tick, mod, onHit, onKill, onHurt,
   incoming, onLethal, onJump, onLand, onWater, onPotion, onSwing, atkMult
   ============================================================ */

// ---------- estado / despacho ----------
function gearList(P) { return (P && P.gear) || []; }
function rebuildGear(P) {
  const g = [], st = P.gearState || (P.gearState = {});
  const add = (id, kind) => {
    if (!id) return; const it = IT[id]; if (!it) return;
    const reg = kind === 'armor' ? ARM_FX : ACC_FX;
    const mk = reg[it.mech];
    const s = st[id] || (st[id] = {});
    s.off = 0;   // zera efeitos de "por golpe" ao reequipar (contadores não vazam)
    let fx = null; if (mk) { try { fx = mk(it, s); } catch (e) { fx = null; } }
    g.push({ id, it, kind, fx: fx || {}, s });
  };
  const eq = P.equip || {};
  if (eq.armor) add(eq.armor.id, 'armor');
  for (const a of (eq.acc || [])) if (a) add(a.id, 'acc');
  // conjuntos: conta peças da mesma família (armadura + acessórios)
  const cnt = {};
  for (const e of g) { const f = e.it.fam; if (f) cnt[f] = (cnt[f] || 0) + 1; }
  const sets = [], sst = P.setState || (P.setState = {});
  for (const fam in cnt) {
    const n = cnt[fam]; if (n < 2 || !SET_FX[fam]) continue;
    const s = sst[fam] || (sst[fam] = {}); s.n = n;
    let fx = null; try { fx = SET_FX[fam](n, s); } catch (e) { fx = null; }
    if (fx) sets.push({ fam, n, fx, s });
  }
  P.gear = g; P.sets = sets; P.setCount = cnt;
}
function gearCall(hook, ...a) {
  const P = G.P; if (!P) return;
  for (const e of gearList(P)) { const f = e.fx && e.fx[hook]; if (f) f.call(e.fx, ...a); }
  for (const s of (P.sets || [])) { const f = s.fx[hook]; if (f) f.call(s.fx, ...a); }
}
function gearAtkMult(P) {
  let m = 1; const sw = P.cb && P.cb.sw;
  for (const e of gearList(P)) { const f = e.fx && e.fx.atkMult; if (f) m *= f.call(e.fx, P); }
  return m;
}
function gearSetCount(P, fam) { return ((P && P.setCount) || {})[fam] || 0; }

// ---------- utilidades dos efeitos ----------
const gSwDmg = P => { const sw = P.cb && P.cb.sw; return sw ? sw.baseDamage : 20; };
const gDmg = (P, m) => gSwDmg(P) * m;
function gHit(e, dmg, o) {
  if (!e || e.dead) return null;
  return hitEnemy(e, Object.assign({ src: 'gear', gear: 1, dmg, kb: 1.1, fs: 0, fromX: pcx(G.P), fromY: pcy(G.P) }, o || {}));
}
function gBoom(P, r, dmg, o) {
  o = o || {}; explode(pcx(P), pcy(P), r, dmg, Object.assign({ col: '#fbbf24', kb: 2 }, o));
}
function gProj(P, o) {
  return spawnProj(Object.assign({ x: pcx(P), y: pcy(P), r: 6, life: .55, pierce: 1, kb: 1.4, shape: 'orb', col: '#fff', col2: '#fff', friendly: true }, o));
}
function gAim(P) { const m = G.mouse; return Math.atan2(m.wy - pcy(P), m.wx - pcx(P)); }
function gNear(P, r) { return enemiesNear(pcx(P), pcy(P), r); }
function gTarget(P, r) { return nearestEnemy(pcx(P), pcy(P), r); }
function gStatus(e, n, d, p) { if (e && !e.dead) applyStatus(e, n, d, p); }
function gHeal(n) { healPlayer(n, true); }

// ============================================================
//   ACESSÓRIOS — 50 mecânicas
// ============================================================
const ACC_FX = {
  // ---------------- BRASEIRO (fogo) ----------------
  brasa_anel: (it, s) => ({
    onHit(P, e) { gStatus(e, 'burn', 3, { dps: 2 + it.tier }); burst(ecx(e), ecy(e), 3, { col: ['#ff8a2a', '#ffd23a'], spd: 60, g: -40, life: .35, glow: true }); }
  }),
  brasa_fole: (it, s) => ({
    onHit(P, e) {
      s.n = (s.n || 0) + 1; if (s.n % 6) return;
      const a0 = gAim(P), d = gDmg(P, .55);
      for (let i = -1; i <= 1; i++) gProj(P, { vx: Math.cos(a0 + i * .22) * 420, vy: Math.sin(a0 + i * .22) * 420, shape: 'fire', r: 8, col: '#ff8a2a', col2: '#ffd23a', pierce: 2, life: .5, dmg: d, status: [['burn', 2, { dps: 3 }]] });
      sfx('fire', .5);
    }
  }),
  brasa_botas: (it, s) => ({
    tick(P, dt) {
      if (!P.onGround || Math.abs(P.vx) < 40) { s.t = 0; return; }
      s.t = (s.t || 0) - dt; if (s.t > 0) return; s.t = .16;
      gProj(P, { x: P.x + P.w / 2 - Math.sign(P.vx) * 6, y: P.y + P.h - 2, vx: 0, vy: 0, kind: 'static', shape: 'fire', r: 7, life: .9, dmg: gDmg(P, .12), kb: 0, hitCd: .5, col: '#ff7a1a', col2: '#ffd23a', status: [['burn', 1.5, { dps: 2 }]] });
    }
  }),
  brasa_manopla: (it, s) => ({
    onKill(P, e) { if (!e || !e.st || !e.st.burn) return; explode(ecx(e), ecy(e), 44, gDmg(P, .5), { col: '#ff7a1a', cols: ['#ff7a1a', '#ffd23a', '#fff'], kb: 3, status: [['burn', 2, { dps: 3 }]] }); }
  }),
  brasa_coracao: (it, s) => ({
    onHurt(P, d) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 5;
      explode(pcx(P), pcy(P), 78, gDmg(P, .7) + d, { col: '#ff5a1f', cols: ['#ff5a1f', '#ffb347', '#fff'], kb: 5, status: [['burn', 3, { dps: 4 }]] });
    }
  }),
  // ---------------- GEADA ----------------
  geada_anel: (it, s) => ({
    onHit(P, e) { gStatus(e, 'slow', 2, { amt: .22 + it.tier * .01 }); burst(ecx(e), ecy(e), 3, { col: ['#7dd3fc', '#e0f2fe'], spd: 50, life: .35, glow: true }); }
  }),
  geada_pingente: (it, s) => ({
    onHit(P, e) {
      s.n = (s.n || 0) + 1; if (s.n % 3) return;
      gStatus(e, 'stun', .8, {}); ringFx(ecx(e), ecy(e), 26, '#bfeaff', .3, 2); sfx('ice', .5);
    }
  }),
  geada_botas: (it, s) => ({
    onHit(P, e) { if (e.st && (e.st.slow || e.st.stun)) addBuff('speed', 2, { mult: 1.3 }); }
  }),
  geada_manopla: (it, s) => ({
    mod(P, e, h) { if (e.st && e.st.stun) h.mult = (h.mult || 1) * 1.35; },
    onHit(P, e, h, r) {
      if (!(e.st && e.st.stun) || !r) return;
      burst(ecx(e), ecy(e), 10, { col: ['#bfeaff', '#fff'], spd: 130, life: .4, glow: true });
      for (const o of gNear(P, 50)) if (o !== e) gHit(o, r.dmg * .25, { noKb: true });
    }
  }),
  geada_manto: (it, s) => ({
    tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 15; addBuff('shield', 12, { hp: 18 + it.tier * 4 }); ringFx(pcx(P), pcy(P), 30, '#bfeaff', .4, 2); }
  }),
  // ---------------- CORISCO ----------------
  corisco_anel: (it, s) => ({
    onHit(P, e) {
      s.n = (s.n || 0) + 1; if (s.n % 4) return;
      let from = e, list = [e];
      for (let i = 0; i < 2; i++) {
        const nx = nearestEnemy(ecx(from), ecy(from), 170, from); if (!nx) break;
        chainFx(ecx(from), ecy(from), ecx(nx), ecy(nx), '#fde047'); list.push(nx); from = nx;
      }
      for (let i = 1; i < list.length; i++) gHit(list[i], gDmg(P, .35), { elem: 'lightning' });
      sfx('thunder', .6);
    }
  }),
  corisco_pingente: (it, s) => ({
    tick(P, dt) { if (Math.abs(P.vx) > 60) s.ch = Math.min(60, (s.ch || 0) + dt * 26); },
    mod(P, e, h) { if ((s.ch || 0) > 25) { h.mult = (h.mult || 1) * (1 + s.ch / 60); } },
    onHit(P) { if ((s.ch || 0) > 25) { s.ch = 0; ringFx(pcx(P), pcy(P), 40, '#fde047', .3, 3); sfx('thunder', .7); } }
  }),
  corisco_botas: (it, s) => ({
    stats(P, st) { st.dash = Math.max(st.dash || 0, 2); st.dashAir = 1; },
    onDash(P) { ringFx(pcx(P), pcy(P), 34, '#fde047', .28, 3); chainFx(pcx(P), pcy(P), P.x + P.w / 2 + P.face * 40, pcy(P), '#fde047'); }
  }),
  corisco_manopla: (it, s) => ({
    onHit(P, e, h, r) {
      if (Math.random() > .25 || !r) return;
      const o = nearestEnemy(ecx(e), ecy(e), 150, e); if (!o) return;
      chainFx(ecx(e), ecy(e), ecx(o), ecy(o), '#fef08a'); gHit(o, r.dmg * .5, { noKb: true, elem: 'lightning' });
    }
  }),
  corisco_coroa: (it, s) => ({
    tick(P) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 4;
      const e = gTarget(P, 210); if (!e) return;
      chainFx(pcx(P), P.y - 10, ecx(e), ecy(e), '#fde047'); gHit(e, gDmg(P, .8), { elem: 'lightning', kb: 2 });
      sfx('thunder', .8); G.light.addLight(ecx(e) / TS, ecy(e) / TS, .9, .8, .3);
    }
  }),
  // ---------------- MARÉ ----------------
  mare_anel: (it, s) => ({
    onHit(P) { s.n = (s.n || 0) + 1; s.t = G.t; if (s.n > 8) s.n = 8; },
    stats(P, st) { if (s.n && G.t - (s.t || 0) < 3) st.atkspd = (st.atkspd || 0) + Math.min(.3, s.n * .035); },
    atkMult(P) { return 1 + (P.stats.atkspd || 0); }
  }),
  mare_pingente: (it, s) => ({
    tick(P, dt) {
      if (!P.inWater) return; s.t = (s.t || 0) + dt; if (s.t < 1) return; s.t = 0;
      gHeal(Math.max(1, Math.round(P.maxHp * .02))); burst(pcx(P), pcy(P), 4, { col: ['#38bdf8', '#bae6fd'], spd: 40, g: -60, life: .5 });
    },
    onWater(P) { gHeal(Math.round(P.maxHp * .04)); }
  }),
  mare_nadadeira: (it, s) => ({
    stats(P, st) { st.swim = .6; if (P.inWater) st.dmg += 6 + it.tier; }
  }),
  mare_manopla: (it, s) => ({
    onHit(P, e) {
      for (const o of gNear(P, 74)) { if (o === e) continue; const dx = ecx(o) - pcx(P), dy = ecy(o) - pcy(P), l = Math.hypot(dx, dy) || 1; o.vx += dx / l * 150; o.vy += dy / l * 90 - 40; o.kbT = .2; }
      ringFx(pcx(P), pcy(P), 62, '#7dd3fc', .3, 2);
    }
  }),
  mare_bolha: (it, s) => ({
    tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 12; addBuff('shield', 14, { hp: 22 + it.tier * 6 }); ringFx(pcx(P), pcy(P), 26, '#bae6fd', .35, 2); }
  }),
  // ---------------- RAIZ ----------------
  raiz_anel: (it, s) => ({
    stats(P, st) { const lost = 1 - P.hp / Math.max(1, P.maxHp); st.def += Math.floor(lost * (5 + it.tier)); }
  }),
  raiz_pingente: (it, s) => ({
    onLand(P, tiles) {
      if (tiles < 3) return;
      for (const e of gNear(P, 70)) gHit(e, gDmg(P, .35), { kb: 3, noKb: false });
      ringFx(pcx(P), P.y + P.h, 70, '#a3e635', .3, 3); sfx('boom', .3);
    }
  }),
  raiz_botas: (it, s) => ({
    stats(P, st) { st.fallSafe = 1; },
    onLand(P, tiles) { if (tiles >= 8) { gBoom(P, 80, gDmg(P, .6), { col: '#b4783a', cols: ['#b4783a', '#d9c7a0', '#fff'], kb: 4 }); } }
  }),
  raiz_manopla: (it, s) => ({
    onHit(P, e) {
      s.n = (s.n || 0) + 1; if (s.n % 3) return;
      const gy = groundY(pcx(P), pcy(P), 40);
      groundWave(P, { sw: P.cb.sw || { baseDamage: gSwDmg(P), knockbackForce: 2, critChance: .05 }, dmgMult: .45, aim: 0, tip: { x: pcx(P), y: pcy(P) } }, pcx(P), gy > 0 ? gy : pcy(P) + 20, P.face, { speed: 320, life: .55, hh: 12, hw: 10, col: '#a3e635' });
      sfx('boom', .35);
    }
  }),
  raiz_couraca: (it, s) => ({
    stats(P, st) { st.thorns = (st.thorns || 0) + .25; }
  }),
  // ---------------- VÉU ----------------
  veu_anel: (it, s) => ({
    mod(P, e, h) { s.seen = s.seen || {}; const k = e.id; if (!s.seen[k]) { s.seen[k] = 1; h.crit = true; } }
  }),
  veu_pingente: (it, s) => ({
    onHit(P, e, h, r) { if (r && r.crit) gHeal(Math.max(1, Math.round(r.dmg * .03))); }
  }),
  veu_botas: (it, s) => ({
    tick(P, dt) { s.still = Math.abs(P.vx) < 12 && P.onGround ? (s.still || 0) + dt : 0; },
    stats(P, st) { if ((s.still || 0) > 1) { st.dodge = (st.dodge || 0) + .5; st.ambush = 1; } },
    mod(P, e, h) { if ((s.still || 0) > 1) h.mult = (h.mult || 1) * 1.25; }
  }),
  veu_manopla: (it, s) => ({
    mod(P, e, h) { if (e.hpMax && e.hp / e.hpMax < .3) h.mult = (h.mult || 1) * 1.4; }
  }),
  veu_manto: (it, s) => ({
    onKill(P) { addBuff('evade', 1.5, { amt: .6 }); burst(pcx(P), pcy(P), 12, { col: ['#a855f7', '#e9d5ff'], spd: 90, life: .5, glow: true }); }
  }),
  // ---------------- ALVORADA ----------------
  aurora_anel: (it, s) => ({
    tick(P, dt) {
      if (G.t - (P.lastHurtT || -99) < 5) return;
      s.t = (s.t || 0) + dt; if (s.t < 1) return; s.t = 0; gHeal(1 + Math.floor(it.tier / 3));
    }
  }),
  aurora_pingente: (it, s) => ({
    onPotion(P) { gHeal(Math.round(P.maxHp * .12)); for (const n of ['bleed', 'poison', 'slow', 'curse', 'confuse']) delete P.buffs[n]; burst(pcx(P), pcy(P), 12, { col: ['#fbbf24', '#fef08a'], spd: 80, g: -80, life: .6, glow: true }); }
  }),
  aurora_botas: (it, s) => ({
    stats(P, st) { st.glide = 1; st.spd += .08; }
  }),
  aurora_manopla: (it, s) => ({
    mod(P, e, h) { if (e.undead) h.mult = (h.mult || 1) * 1.5; },
    onHit(P, e) { if (e.undead) gStatus(e, 'burn', 3, { dps: 4 }); }
  }),
  aurora_coroa: (it, s) => ({
    tick(P) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 1;
      for (const e of gNear(P, 78)) gHit(e, gDmg(P, .22), { noKb: true, elem: 'light' });
      G.light.addLight(pcx(P) / TS, pcy(P) / TS, 1.4, 1.2, .4);
      if (Math.random() < .4) burst(pcx(P), pcy(P) + rnd(-10, 10), 2, { col: ['#fbbf24', '#fff7c2'], spd: 20, g: -40, life: .5, glow: true });
    }
  }),
  // ---------------- RELOJOARIA ----------------
  relogio_anel: (it, s) => ({
    onHit(P, e, h, r) {
      if (!r || Math.random() > .12) return;
      gHit(e, r.dmg * .5, { noKb: true, gear: 1, crit: r.crit });
      burst(ecx(e), ecy(e), 5, { col: ['#f472b6', '#fbcfe8'], spd: 70, life: .3, glow: true });
    }
  }),
  relogio_pingente: (it, s) => ({
    stats(P, st) { st.cdr = (st.cdr || 0) + .25; }
  }),
  relogio_botas: (it, s) => ({
    stats(P, st) { st.dash = Math.max(st.dash || 0, 1); },
    onDash(P) { for (let i = 0; i < 3; i++) addPart({ x: pcx(P) - P.face * (10 + i * 8), y: pcy(P) + rnd(-8, 8), vx: -P.face * 40, vy: 0, life: .3, size: 3, col: '#fbcfe8', glow: true }); }
  }),
  relogio_manopla: (it, s) => ({
    onHit(P) { P.dashCd = Math.max(0, (P.dashCd || 0) - .35); P.potionCd = Math.max(0, P.potionCd - .25); }
  }),
  relogio_ampulheta: (it, s) => ({
    tick(P) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 20;
      const list = gNear(P, 170); if (!list.length) return;
      for (const e of list) { gStatus(e, 'stun', 1.2, {}); ringFx(ecx(e), ecy(e), 22, '#fbcfe8', .3, 2); }
      flash('#f472b6', .18, .3); sfx('portal', .7);
    }
  }),
  // ---------------- VAZIO ----------------
  vazio_anel: (it, s) => ({
    tick(P, dt) {
      const arr = G.drops || [];
      for (const d of arr) {
        const dx = pcx(P) - d.x, dy = pcy(P) - d.y, l = Math.hypot(dx, dy);
        if (l < 130 && l > 6) { d.vx += dx / l * 340 * dt * (1 - l / 140); d.vy += dy / l * 300 * dt * (1 - l / 140); }
      }
      if ((s.cd || 0) > G.t) return; s.cd = G.t + .6;
      for (const e of gNear(P, 110)) { const dx = pcx(P) - ecx(e), dy = pcy(P) - ecy(e), l = Math.hypot(dx, dy) || 1; e.vx += dx / l * 26; if (e.fly) e.vy += dy / l * 22; }
    }
  }),
  vazio_pingente: (it, s) => ({ stats(P, st) { st.pierce = (st.pierce || 0) + .3; } }),
  vazio_botas: (it, s) => ({ stats(P, st) { st.glide = 1; st.lavaRes = (st.lavaRes || 0) + .5; } }),
  vazio_manopla: (it, s) => ({
    stats(P, st) { st.steal += .06; },
    onHit(P, e) { gStatus(e, 'bleed', 4, { dps: 3 + it.tier }); }
  }),
  vazio_singularidade: (it, s) => ({
    onHit(P) {
      s.n = (s.n || 0) + 1; if (s.n % 12) return;
      const x = pcx(P) + P.face * 60, y = pcy(P);
      const p = { x, y, r: 26, life: 1.2, col: '#818cf8', glow: '#c7d2fe', pull: 1 };
      for (let i = 0; i < 3; i++) burst(x, y, 8, { col: ['#818cf8', '#c7d2fe'], spd: 140, life: .8, glow: true });
      G.sing = { x, y, t: 1.2, dmg: gDmg(P, 1.4) };
      sfx('portal', .7);
    },
    tick(P, dt) {
      const q = G.sing; if (!q) return;
      q.t -= dt;
      for (const e of enemiesNear(q.x, q.y, 150)) { const dx = q.x - ecx(e), dy = q.y - ecy(e), l = Math.hypot(dx, dy) || 1; e.vx += dx / l * 210 * dt * 6; e.vy += dy / l * 200 * dt * 6; }
      burst(q.x + rnd(-20, 20), q.y + rnd(-20, 20), 1, { col: '#c7d2fe', spd: 10, life: .4, glow: true, size: 2.5 });
      if (q.t <= 0) { explode(q.x, q.y, 96, q.dmg, { col: '#818cf8', cols: ['#818cf8', '#e0e7ff', '#fff'], kb: 6 }); G.sing = null; }
    }
  }),
  // ---------------- ORIGEM ----------------
  origem_anel: (it, s) => ({
    onHit(P) { s.n = (s.n || 0) + 1; if (s.n >= 10) { s.n = 0; s.ready = 1; addText(pcx(P), P.y - 12, 'Golpe primordial pronto', '#f8fafc', 11, 1); } },
    mod(P, e, h) { if (s.ready) { h.crit = true; s.ready = 0; } }
  }),
  origem_pingente: (it, s) => ({
    onHit(P, e, h, r) {
      if (e.boss || !e.hpMax || e.hp / e.hpMax > .12 || e.dead) return;
      addText(ecx(e), e.y - 8, 'Executado', '#f8fafc', 13, 1);
      burst(ecx(e), ecy(e), 14, { col: ['#f8fafc', '#c7d2fe'], spd: 160, life: .5, glow: true });
      e.hp = 0; killEnemy(e, { gear: 1 });
    }
  }),
  origem_botas: (it, s) => ({ stats(P, st) { st.spd += .12; st.jump = (st.jump || 0) + .1; } }),
  origem_manopla: (it, s) => ({
    mod(P, e, h) { s.seen = s.seen || {}; if (!s.seen[e.id]) { s.seen[e.id] = 1; h.mult = (h.mult || 1) * 2; } }
  }),
  origem_coroa: (it, s) => ({
    onLethal(P) {
      if ((s.cd || 0) > G.t) return;
      s.cd = G.t + 120; P.hp = Math.round(P.maxHp * .5); addBuff('invuln', 2);
      flash('#f8fafc', .5, .6); gBoom(P, 120, gDmg(P, 2), { col: '#f8fafc', kb: 8 });
      addText(pcx(P), P.y - 16, 'Renascido!', '#f8fafc', 16, 1.4); sfx('boss', 1);
    }
  }),
};

// ============================================================
//   ARMADURAS — 50 passivas (5 por família)
// ============================================================
const ARM_FX = {
  // brasa
  brasa_0: () => ({ onHit(P, e) { gStatus(e, 'burn', 2.5, { dps: 2 }); } }),
  brasa_1: () => ({
    mod(P, e, h) { if (e.st && e.st.burn) h.mult = (h.mult || 1) * 1.25; },
    onHit(P, e) { if (Math.random() < .25) gStatus(e, 'burn', 3, { dps: 3 }); }
  }),
  brasa_2: (it, s) => ({
    onHurt(P, d) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 6; explode(pcx(P), pcy(P), 62, gDmg(P, .4) + d * .3, { col: '#ff7a1a', kb: 3, status: [['burn', 2, { dps: 2 }]] }); }
  }),
  brasa_3: (it, s) => ({
    tick(P, dt) {
      if (!P.onGround || Math.abs(P.vx) < 40) return;
      s.t = (s.t || 0) - dt; if (s.t > 0) return; s.t = .3;
      gProj(P, { x: pcx(P), y: P.y + P.h - 2, vx: 0, vy: 0, kind: 'static', shape: 'fire', r: 6, life: .7, dmg: gDmg(P, .1), kb: 0, hitCd: .6, col: '#ff7a1a', col2: '#ffd23a' });
    }
  }),
  brasa_4: () => ({
    stats(P, st) { st.lavaRes = (st.lavaRes || 0) + .75; st.def += 4; },
    tick(P) { for (const e of gNear(P, 62)) { if (Math.random() < .04) gStatus(e, 'burn', 2, { dps: 3 }); } }
  }),
  // geada
  geada_0: () => ({ onHit(P, e) { gStatus(e, 'slow', 2, { amt: .18 }); } }),
  geada_1: (it, s) => ({
    tick(P, dt) { s.still = Math.abs(P.vx) < 15 && P.onGround ? (s.still || 0) + dt : 0; },
    stats(P, st) { if ((s.still || 0) > 1) st.def += 4; }
  }),
  geada_2: (it, s) => ({ tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 14; addBuff('shield', 10, { hp: 20 + it.tier * 4 }); } }),
  geada_3: (it, s) => ({
    onHurt(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 8; for (const e of gNear(P, 80)) { gStatus(e, 'stun', 1, {}); gHit(e, gDmg(P, .3), { noKb: true }); } ringFx(pcx(P), pcy(P), 80, '#bfeaff', .4, 3); }
  }),
  geada_4: () => ({ mod(P, e, h) { if (e.st && (e.st.stun || e.st.slow)) h.mult = (h.mult || 1) * 1.4; } }),
  // corisco
  corisco_0: () => ({ stats(P, st) { st.spd += .05; } }),
  corisco_1: (it, s) => ({
    tick(P) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 5;
      const e = gTarget(P, 150); if (!e) return;
      chainFx(pcx(P), pcy(P), ecx(e), ecy(e), '#fde047'); gHit(e, gDmg(P, .5), { elem: 'lightning' });
    }
  }),
  corisco_2: () => ({ stats(P, st) { if (Math.abs(G.P.vx) > 40) st.crit += .1; } }),
  corisco_3: (it, s) => ({
    onHit(P, e, h, r) {
      if (Math.random() > .15 || !r) return; const o = nearestEnemy(ecx(e), ecy(e), 130, e); if (!o) return;
      chainFx(ecx(e), ecy(e), ecx(o), ecy(o), '#fde047'); gHit(o, r.dmg * .35, { noKb: true, elem: 'lightning' });
    }
  }),
  corisco_4: (it, s) => ({
    tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 1; for (const e of gNear(P, 66)) gHit(e, gDmg(P, .18), { noKb: true, elem: 'lightning' }); }
  }),
  // mare
  mare_0: () => ({ stats(P, st) { st.hp += 15; } }),
  mare_1: (it, s) => ({ tick(P, dt) { if (!P.inWater) return; s.t = (s.t || 0) + dt; if (s.t > 1) { s.t = 0; gHeal(2); } } }),
  mare_2: (it, s) => ({ tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 16; addBuff('shield', 12, { hp: 18 + it.tier * 5 }); } }),
  mare_3: () => ({ stats(P, st) { if (G.P.inWater) st.dmg += 10; } }),
  mare_4: (it, s) => ({ tick(P, dt) { s.t = (s.t || 0) + dt; if (s.t > 1) { s.t = 0; gHeal(1); } } }),
  // raiz
  raiz_0: () => ({ stats(P, st) { st.def += 2; st.hp += 8; } }),
  raiz_1: () => ({ stats(P, st) { st.thorns = (st.thorns || 0) + .15; } }),
  raiz_2: (it, s) => ({ tick(P, dt) { s.still = Math.abs(P.vx) < 15 && P.onGround ? (s.still || 0) + dt : 0; }, stats(P, st) { if ((s.still || 0) > .8) st.def += 4; } }),
  raiz_3: (it, s) => ({
    onLand(P, tiles) { if (tiles < 6) return; gBoom(P, 76, gDmg(P, .45), { col: '#b4783a', cols: ['#b4783a', '#d9c7a0'], kb: 4 }); }
  }),
  raiz_4: () => ({
    stats(P, st) { const lost = 1 - P.hp / Math.max(1, P.maxHp); st.hp += 35; st.def += Math.floor(lost * 9); }
  }),
  // veu
  veu_0: () => ({ stats(P, st) { st.crit += .05; } }),
  veu_1: () => ({ stats(P, st) { st.steal += .02; } }),
  veu_2: () => ({ stats(P, st) { if (G.night) st.dmg += 9; } }),
  veu_3: (it, s) => ({ onKill(P) { addBuff('evade', 1.2, { amt: .5 }); } }),
  veu_4: () => ({ mod(P, e, h) { if (e.hpMax && e.hp / e.hpMax < .35) h.mult = (h.mult || 1) * 1.25; } }),
  // aurora
  aurora_0: (it, s) => ({ tick(P, dt) { s.t = (s.t || 0) + dt; if (s.t > 1) { s.t = 0; gHeal(1); } } }),
  aurora_1: () => ({ stats(P, st) { st.hp += 22; st.def += 1; } }),
  aurora_2: () => ({ tick(P) { G.light.addLight(pcx(P) / TS, pcy(P) / TS, .9, .8, .35); } }),
  aurora_3: () => ({ mod(P, e, h) { if (e.undead) h.mult = (h.mult || 1) * 1.3; } }),
  aurora_4: (it, s) => ({
    tick(P, dt) {
      s.t = (s.t || 0) + dt; if (s.t > 1) { s.t = 0; gHeal(2); }
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 1.5;
      for (const e of gNear(P, 80)) gHit(e, gDmg(P, .15), { noKb: true, elem: 'light' });
    }
  }),
  // relogio
  relogio_0: () => ({ stats(P, st) { st.cdr = (st.cdr || 0) + .1; } }),
  relogio_1: () => ({ stats(P, st) { st.spd += .06; } }),
  relogio_2: (it, s) => ({ onHit(P, e, h, r) { if (r && Math.random() < .1) gHit(e, r.dmg * .4, { noKb: true }); } }),
  relogio_3: () => ({ stats(P, st) { st.dash = Math.max(st.dash || 0, 1); st.dashCd = .8; } }),
  relogio_4: (it, s) => ({
    tick(P) { if ((s.cd || 0) > G.t) return; s.cd = G.t + 25; for (const e of gNear(P, 140)) gStatus(e, 'stun', 1, {}); flash('#f472b6', .12, .3); }
  }),
  // vazio
  vazio_0: () => ({ stats(P, st) { st.dmg += 4; } }),
  vazio_1: () => ({ stats(P, st) { st.pierce = (st.pierce || 0) + .15; } }),
  vazio_2: () => ({ stats(P, st) { st.glide = 1; } }),
  vazio_3: (it, s) => ({
    tick(P, dt) {
      const arr = G.drops || [];
      for (const d of arr) { const dx = pcx(P) - d.x, dy = pcy(P) - d.y, l = Math.hypot(dx, dy); if (l < 90 && l > 6) { d.vx += dx / l * 200 * dt; d.vy += dy / l * 180 * dt; } }
    }
  }),
  vazio_4: () => ({ stats(P, st) { st.dmg += 14; st.pierce = (st.pierce || 0) + .1; } }),
  // origem
  origem_0: () => ({ stats(P, st) { st.dmg += 6; st.hp += 12; } }),
  origem_1: () => ({ stats(P, st) { st.crit += .08; st.cm += .2; } }),
  origem_2: () => ({ stats(P, st) { st.dmg += 12; } }),
  origem_3: () => ({ stats(P, st) { st.exec = Math.max(st.exec || 0, .15); } }),
  origem_4: (it, s) => ({
    onLethal(P) {
      if ((s.cd || 0) > G.t) return; s.cd = G.t + 150;
      P.hp = Math.round(P.maxHp * .35); addBuff('invuln', 1.5); flash('#f8fafc', .4, .5); addText(pcx(P), P.y - 14, 'A Origem te devolve', '#f8fafc', 15, 1.2);
    }
  }),
};

// ============================================================
//   CONJUNTOS — armadura + acessórios da mesma família
// ============================================================
const SET_FX = {
  brasa: n => n >= 4
    ? { stats(P, st) { st.dmg += 12; }, onHit(P, e) { gStatus(e, 'burn', 3, { dps: 3 }); }, onKill(P, e) { explode(ecx(e), ecy(e), 40, gDmg(P, .4), { col: '#ff7a1a', kb: 3 }); } }
    : { stats(P, st) { st.dmg += 5; } },
  geada: n => n >= 4
    ? { stats(P, st) { st.def += 6; }, tick(P) { for (const e of gNear(P, 66)) if (Math.random() < .06) gStatus(e, 'slow', 1.5, { amt: .3 }); } }
    : { stats(P, st) { st.def += 2; } },
  corisco: n => n >= 4
    ? { stats(P, st) { st.spd += .06; st.crit += .05; }, onHit(P) { const e = gTarget(P, 120); if (e) gHit(e, gDmg(P, .2), { noKb: true, elem: 'lightning' }); } }
    : { stats(P, st) { st.spd += .04; } },
  mare: n => n >= 4
    ? { stats(P, st) { st.hp += 30; }, tick(P, dt) { P._setHeal = (P._setHeal || 0) + dt; if (P._setHeal > 1) { P._setHeal = 0; gHeal(Math.max(1, Math.round(P.maxHp * .01))); } } }
    : { stats(P, st) { st.hp += 12; } },
  raiz: n => n >= 4
    ? { stats(P, st) { st.def += 5; st.thorns = (st.thorns || 0) + .3; } }
    : { stats(P, st) { st.def += 2; } },
  veu: n => n >= 4
    ? { stats(P, st) { st.crit += .06; }, onHit(P, e, h, r) { if (r && r.crit) gHit(e, r.dmg * .2, { noKb: true }); } }
    : { stats(P, st) { st.crit += .04; } },
  aurora: n => n >= 4
    ? { stats(P, st) { st.dmg += 6; }, tick(P, dt) { P._setReg = (P._setReg || 0) + dt; if (P._setReg > 1) { P._setReg = 0; gHeal(2); } } }
    : { stats(P, st) { st.hp += 14; } },
  relogio: n => n >= 4
    ? { stats(P, st) { st.cdr = (st.cdr || 0) + .2; st.spd += .06; }, onHit(P, e, h, r) { if (r && Math.random() < .15) gHit(e, r.dmg * .3, { noKb: true }); } }
    : { stats(P, st) { st.cdr = (st.cdr || 0) + .1; } },
  vazio: n => n >= 4
    ? { stats(P, st) { st.dmg += 10; st.pierce = (st.pierce || 0) + .2; } }
    : { stats(P, st) { st.dmg += 5; } },
  origem: n => n >= 4
    ? { stats(P, st) { st.dmg += 14; st.hp += 30; st.crit += .05; st.cm += .3; } }
    : { stats(P, st) { st.dmg += 6; } },
};
