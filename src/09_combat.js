/* ============================================================
   09_combat: pipeline de dano, i-frames por fonte, knockback,
   status, projéteis (Ballistic/Linear/Homing/Static), explosões
   ============================================================ */
// ---- brilhos (sprites radiais em cache) ----
const _glowC = {};
function glowSprite(col) {
  if (_glowC[col]) return _glowC[col];
  const c = mk(64, 64), g = c.getContext('2d'), rgb = hex2rgb(col), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgbs(rgb[0], rgb[1], rgb[2], .95)); gr.addColorStop(.3, rgbs(rgb[0], rgb[1], rgb[2], .38)); gr.addColorStop(1, rgbs(rgb[0], rgb[1], rgb[2], 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return _glowC[col] = c;
}
function drawGlow(g, x, y, r, col, a = 1) { g.globalAlpha = a; g.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }

// ---- helpers de consulta ----
const ecx = e => e.x + e.w / 2, ecy = e => e.y + e.h / 2;
function enemiesNear(x, y, r, pred) {
  const out = [];
  for (const e of G.enemies) { if (e.dead || e.ghostly) continue; const dx = Math.max(Math.abs(x - ecx(e)) - e.w / 2, 0), dy = Math.max(Math.abs(y - ecy(e)) - e.h / 2, 0); if (dx * dx + dy * dy <= r * r && (!pred || pred(e))) out.push(e); }
  return out;
}
function nearestEnemy(x, y, r, ex, pred) {
  let best = null, bd = r * r;
  for (const e of G.enemies) { if (e.dead || e.ghostly || e === ex || e.harmless) continue; if (pred && !pred(e)) continue; const dx = ecx(e) - x, dy = ecy(e) - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e; } }
  return best;
}
function enemiesOnScreen(margin = 60) {
  const c = G.cam, vw = c.w / c.zoom, vh = c.h / c.zoom;
  return G.enemies.filter(e => !e.dead && !e.harmless && ecx(e) > c.x - margin && ecx(e) < c.x + vw + margin && ecy(e) > c.y - margin && ecy(e) < c.y + vh + margin);
}
const shoulderOf = P => ({ x: P.x + P.w / 2, y: P.y + 9 });

// ---- status (efeitos) ----
const STATUS = {
  bleed: { col: '#dc2626', dot: 1, n: 'Sangrando' }, burn: { col: '#fb923c', dot: 1, n: 'Queimando' }, poison: { col: '#84cc16', dot: 1, n: 'Envenenado' },
  rot: { col: '#c026d3', dot: 1, n: 'Podridão Cósmica' }, slow: { col: '#7dd3fc', n: 'Lento' }, freeze: { col: '#bae6fd', n: 'Congelado' }, stun: { col: '#fde047', n: 'Atordoado' },
  corrode: { col: '#a3e635', n: 'Corroído' }, curse: { col: '#7e22ce', n: 'Maldito' }, compress: { col: '#94a3b8', n: 'Comprimido' }, blind: { col: '#fef08a', n: 'Cego' },
  panic: { col: '#f472b6', n: 'Pânico' }, timestop: { col: '#fbbf24', n: 'Tempo Parado' }, shock: { col: '#fde047', n: 'Eletrizado' }, mark: { col: '#e879f9', n: 'Marcado' }, float: { col: '#67e8f9', n: 'Flutuando' },
};
function applyStatus(e, name, dur, p) {
  if (e.dead || e.immuneStatus) return;
  if (e.boss && (name === 'stun' || name === 'timestop' || name === 'panic' || name === 'freeze')) { dur *= .35; if (name === 'timestop' || name === 'panic') return; }
  p = p || {}; const s = e.st[name];
  if (s) {
    s.t = Math.max(s.t, dur);
    if (p.dps) s.dps = Math.max(s.dps || 0, p.dps);
    if (p.amt) s.amt = Math.max(s.amt || 0, p.amt);
    if (p.stack) s.stacks = Math.min(p.stack, (s.stacks || 1) + 1);
  } else e.st[name] = Object.assign({ t: dur, acc: 0, stacks: 1 }, p);
  if (name === 'compress' && !e._cmp) { e._cmp = true; e.scale = (e.scale || 1) * .72; }
}
function hasStatus(e, n) { return e.st[n] && e.st[n].t > 0; }
function spdMult(e) {
  let m = 1; const s = e.st;
  if (s.stun || s.timestop || s.freeze && s.freeze.amt >= 1) return 0;
  if (s.slow) m *= 1 - Math.min(.9, s.slow.amt || .4);
  if (s.freeze) m *= 1 - Math.min(.9, s.freeze.amt || .5);
  if (s.poison && s.poison.slowAmt) m *= 1 - s.poison.slowAmt;
  if (s.curse) m *= .85;
  return m;
}
function updateStatuses(e, dt) {
  const S = e.st; let flush = false;
  e.dotT = (e.dotT || 0) + dt; if (e.dotT >= .5) { e.dotT = 0; flush = true; }
  for (const k in S) {
    const s = S[k]; s.t -= dt;
    if (s.t <= 0) { if (k === 'compress' && e._cmp) { e._cmp = false; e.scale = (e.scale || 1) / .72; } delete S[k]; continue; }
    if (STATUS[k] && STATUS[k].dot && s.dps) {
      const d = s.dps * (s.stacks || 1) * dt * (e.dotMult || 1); e.dotAcc = (e.dotAcc || 0) + d; e.dotCol = STATUS[k].col;
      if (Math.random() < dt * 14) addPart({ x: ecx(e) + rnd(-e.w / 2, e.w / 2), y: ecy(e) + rnd(-e.h / 2, e.h / 2), vx: rnd(-10, 10), vy: k === 'burn' ? rnd(-50, -20) : rnd(-10, 20), g: k === 'burn' ? -60 : 40, life: .4, size: 2.4, col: k === 'burn' ? pick(['#ff9a2a', '#ffd23a', '#ff5a1a']) : STATUS[k].col, glow: k === 'burn' });
    }
  }
  if (flush && e.dotAcc >= 1) { const v = Math.floor(e.dotAcc); e.dotAcc -= v; dealRaw(e, v, e.dotCol || '#fff', true); }
}
// dano bruto (DoT etc.) sem defesa nem i-frame
function dealRaw(e, v, col, small) {
  if (e.dead || e.invulnerable) return;
  e.hp -= v; e.hurtT = .08; if (G.opts.showDps || e.isDummy) dpsPush(v, e);
  addText(ecx(e), e.y - 2, String(v), col, small ? 10 : 13, .7);
  if (e.hp <= 0) killEnemy(e, { src: 'dot', fx: false });
}
function dpsPush(v, e) { G.dpsLog.push([G.t, v]); }

// ---- pipeline de dano no inimigo ----
function hitEnemy(e, h) {
  if (e.dead || e.ghostly || e.invulnerable) return null;
  const P = G.P;
  if (h.id !== undefined) { if (e.imm.has(h.id)) return null; e.imm.set(h.id, h.imm === undefined ? 1e9 : h.imm); }
  const sw = h.sword || null;
  if (sw && !h.noHooks) fxCall(sw, 'mod', P, e, h);
  let base = h.dmg * (h.mult === undefined ? 1 : h.mult);
  const st = P.stats;
  if (h.src !== 'dot' && h.src !== 'raw') base += st.dmg * (h.fs === undefined ? (h.src === 'melee' ? 1 : .6) : h.fs);
  // crítico (GDD: (1+CritMult))
  const cc = clamp((h.critChance === undefined ? (sw ? sw.critChance : .04) : h.critChance) + st.crit, 0, 1);
  const crit = h.noCrit ? false : (h.crit !== undefined ? h.crit : Math.random() < cc);
  const cm = 1 + st.cm;           // multiplicador crítico base 1.0 (= x2) + acessórios
  // resistência (defesa do alvo)
  const def = (e.def || 0) * (e.st.compress ? .5 : 1);
  const res = h.ignoreDef ? 1 : 60 / (60 + def);
  let tm = 1; if (e.st.corrode) tm *= 1.25; if (e.st.curse) tm *= 1.2; if (e.st.compress) tm *= 1.2; if (e.st.mark) tm *= 1.15; if (e.dmgTakenMult) tm *= e.dmgTakenMult;
  let dmg = base * (crit ? 1 + cm : 1) * res * tm * rnd(.95, 1.05);
  if (h.pctMax) dmg += (e.isDummy ? 3000 : e.hpMax) * h.pctMax * (e.boss ? .25 : 1);
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.hurtT = .12; e.flash = .1; e.lastHit = G.t;
  if (e.isDummy) { e.hp = e.hpMax; } if (G.opts.showDps || e.isDummy) dpsPush(dmg, e);
  // números
  const ecol = h.elem ? ({ fire: '#fb923c', ice: '#7dd3fc', lightning: '#fde047', poison: '#a3e635', shadow: '#c084fc', light: '#fef08a', blood: '#f87171' }[h.elem] || '#fff') : '#fff';
  addText(ecx(e), e.y - 4, (crit ? dmg + '!' : String(dmg)), crit ? '#fde047' : ecol, crit ? 17 : 13, crit ? 1.1 : .85);
  // knockback vetorial: F = normalize(Target - Player) * KB, amortecido pela massa
  if (!h.noKb && h.kb > 0 && !e.boss && !e.noKb) {
    let dx = h.dir ? h.dir.x : ecx(e) - (h.fromX !== undefined ? h.fromX : P.x + P.w / 2), dy = h.dir ? h.dir.y : ecy(e) - (h.fromY !== undefined ? h.fromY : P.y + P.h / 2);
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const mass = e.mass || 1, F = h.kb * 58 / (.5 + .5 * mass) * (1 - (e.kbr || 0)) * (h.kbMult || 1);
    e.vx = dx * F; e.vy = Math.min(e.vy, dy * F * .55 - (e.fly ? 0 : 90 * Math.min(1.5, h.kb / 4)));
    e.kbT = Math.min(.45, .12 + h.kb * .03); e.kbFrom = { x: dx, y: dy, F };
    if (e.fly) e.vy = dy * F * .6;
  }
  // sangue/faíscas
  burst(ecx(e), ecy(e), crit ? 12 : 6, { col: e.blood || ['#c0392b', '#e74c3c'], spd: 110 + h.kb * 12, g: 450, life: .45, size: 2.4 });
  if (crit) { ringFx(ecx(e), ecy(e), 20, '#fde047', .25, 2); G.hitStop = Math.max(G.hitStop, .03); }
  sfx(crit ? 'crit' : 'hit');
  if (h.status) for (const s of h.status) applyStatus(e, s[0], s[1], s[2]);
  // roubo de vida (acessórios)
  if (st.steal > 0 && h.src !== 'dot') healPlayer(Math.max(1, Math.round(dmg * st.steal)), true);
  const res_ = { dmg, crit, e, killed: e.hp <= 0 };
  if (sw && !h.noHooks) fxCall(sw, 'onHit', P, e, h, res_);
  if (e.hp <= 0) killEnemy(e, h);
  return res_;
}
function killEnemy(e, h) {
  if (e.dead) return; e.dead = true; e.hp = 0;
  const P = G.P;
  burst(ecx(e), ecy(e), 14, { col: e.blood || '#c0392b', spd: 150, g: 500, life: .6, size: 3 }); sfx('kill');
  if (!e.harmless) {
    if (h && h.sword && !h.noHooks) fxCall(h.sword, 'onKill', P, e, h);
    rollDrops(e, h);
    G.kills = (G.kills || 0) + 1;
  }
  if (e.boss) bossDefeated(e);
}
// dano em jogador
function hurtPlayer(dmg, fromX, kb, o) {
  const P = G.P; o = o || {};
  if (!P || P.dead || P.inv_ > 0 || G.opts.god || P.buffs.invuln) return false;
  const front = fromX !== undefined && Math.sign(fromX - (P.x + P.w / 2)) === P.face;
  let m = 1; if (front && P.cb.blockT > 0) m *= 1 - P.cb.blockPct;
  let d = Math.max(1, Math.round((dmg - (o.pierce ? 0 : P.stats.def * .5)) * m));
  const sh = P.buffs.shield; if (sh && sh.hp > 0) { const ab = Math.min(sh.hp, d); sh.hp -= ab; d -= ab; addText(P.x + P.w / 2, P.y - 6, '-' + ab, '#fbbf24', 12); if (sh.hp <= 0) delete P.buffs.shield; }
  if (d > 0) { P.hp -= d; addText(P.x + P.w / 2, P.y - 6, '-' + d, '#f87171', 15, 1); }
  P.inv_ = o.inv || clamp(.55 + d / 220, .55, 1.1); P.flash = .2; sfx('hurt'); shake(5 + Math.min(8, d / 8));
  burst(P.x + P.w / 2, P.y + P.h / 2, 10, { col: ['#c0392b', '#e74c3c'], spd: 140, g: 450, life: .5 });
  if (kb && fromX !== undefined) { const s = Math.sign(P.x + P.w / 2 - fromX) || 1; P.vx = s * kb * (1 - P.stats.kbr); P.vy = -190 * (1 - P.stats.kbr * .5); P.kbT = .18; }
  if (P.hp <= 0) killPlayer();
  return true;
}
function healPlayer(n, silent) {
  const P = G.P; if (!P || P.dead || n <= 0) return; const before = P.hp; P.hp = Math.min(P.maxHp, P.hp + n);
  if (!silent && P.hp > before) { addText(P.x + P.w / 2, P.y - 6, '+' + Math.round(P.hp - before), '#4ade80', 13); }
}
function addBuff(name, dur, data) { const P = G.P, b = P.buffs[name]; if (b) { b.t = Math.max(b.t, dur); Object.assign(b, data || {}); } else P.buffs[name] = Object.assign({ t: dur }, data || {}); }
function hasBuff(n) { return !!G.P.buffs[n]; }

// ---- projéteis ----
function spawnProj(o) {
  const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, kind: 'linear', r: 5, dmg: 10, kb: 2, life: 1, pierce: 1, grav: 0, steer: 0, col: '#ffffff', col2: '#cccccc', shape: 'orb', tiles: true, friendly: true, hits: 0, age: 0, angle: 0, spin: 0, hitCd: 1e9, glow: null, rot: 0, fs: .6 }, o);
  p.id = 'p' + (G.srcId++); p.hm = new Map(); p.sp0 = Math.hypot(p.vx, p.vy);
  if (!o.angle && (p.vx || p.vy)) p.angle = Math.atan2(p.vy, p.vx);
  if (G.projs.length > 700) G.projs.splice(0, 50);
  G.projs.push(p); return p;
}
function projHitsBox(p, x, y, w, h) {
  if (p.hw !== undefined) return Math.abs(p.x - (x + w / 2)) < p.hw + w / 2 && Math.abs(p.y - (y + h / 2)) < p.hh + h / 2;
  const dx = Math.max(x - p.x, 0, p.x - (x + w)), dy = Math.max(y - p.y, 0, p.y - (y + h)); return dx * dx + dy * dy <= p.r * p.r;
}
function killProj(p, why) { if (p.dead) return; p.dead = true; if (p.onDie) p.onDie(p, why); }
function updateProjs(dt) {
  const a = G.projs, P = G.P;
  for (let i = a.length - 1; i >= 0; i--) {
    const p = a[i]; if (p.dead) { a.splice(i, 1); continue; }
    if (p.delay > 0) { p.delay -= dt; if (p.delay > 0) continue; if (p.onStart) p.onStart(p); }
    p.age += dt; p.life -= dt; p.rot += p.spin * dt;
    // tempo parado afeta projéteis hostis
    if (!p.friendly && G.freeze > 0) { continue; }
    if (p.kind === 'homing') {
      let t = p.target; if (p.targetP) t = { x: P.x, y: P.y, w: P.w, h: P.h, dead: P.dead }; else if (!t || t.dead) { t = p.target = nearestEnemy(p.x, p.y, p.range || 520, null, p.pred); }
      if (t && !t.dead) { const dx = ecx(t) - p.x, dy = ecy(t) - p.y, l = Math.hypot(dx, dy) || 1, sp = p.speed || p.sp0 || 300; p.vx += (dx / l * sp - p.vx) * Math.min(1, p.steer * dt); p.vy += (dy / l * sp - p.vy) * Math.min(1, p.steer * dt); }
      p.angle = Math.atan2(p.vy, p.vx);
    }
    if (p.kind === 'ballistic') { p.vy += (p.grav || 700) * dt; p.angle = Math.atan2(p.vy, p.vx); }
    else if (p.grav) p.vy += p.grav * dt;
    if (p.onUpdate) p.onUpdate(p, dt);
    if (p.kind !== 'static' && p.kind !== 'custom') {
      const sp = Math.hypot(p.vx, p.vy) * dt, n = Math.max(1, Math.ceil(sp / 6));
      for (let k = 0; k < n; k++) {
        p.x += p.vx * dt / n; p.y += p.vy * dt / n;
        if (p.tiles && solidPx(p.x, p.y)) { if (p.onTile) p.onTile(p); if (p.bounce) { p.x -= p.vx * dt / n; p.y -= p.vy * dt / n; p.vy *= -p.bounce; p.vx *= .8; if (Math.abs(p.vy) < 40) p.vy = 0; } else { killProj(p, 'tile'); } break; }
      }
      if (p.kind === 'linear' && p.spin === 0 && p.sp0 > 0 && !p.noAim) p.angle = Math.atan2(p.vy, p.vx);
    }
    if (p.trail && Math.random() < dt * (p.trailRate || 40)) addPart({ x: p.x, y: p.y, vx: rnd(-14, 14), vy: rnd(-14, 14), life: .3, size: p.r * .7, col: p.trail, glow: true });
    if (p.light) G.light.addLight(p.x / TS, p.y / TS, p.light[0], p.light[1], p.light[2]);
    if (p.dead) continue;
    if (p.friendly) {
      if (!p.noHit) for (const e of G.enemies) {
        if (e.dead || e.ghostly || e.harmless || e.invulnerable) continue;
        if (!projHitsBox(p, e.x, e.y, e.w, e.h)) continue;
        const cd = p.hm.get(e); if (cd !== undefined && G.t < cd) continue;
        p.hm.set(e, G.t + p.hitCd);
        const l = Math.hypot(p.vx, p.vy) || 1;
        const dir = p.kbDir || (p.vx || p.vy ? { x: p.vx / l, y: p.vy / l } : null);
        const res = hitEnemy(e, { src: 'proj', id: p.id + ':' + (p.hitCd < 1e8 ? Math.floor(G.t / p.hitCd) : 0), imm: p.hitCd < 1e8 ? p.hitCd : 1e9, dmg: p.dmg, kb: p.kb, dir, sword: p.sword, critChance: p.critChance, status: p.status, elem: p.elem, pctMax: p.pctMax, fromX: p.x, fromY: p.y, noKb: p.noKb, fs: p.fs, mult: p.mult, ignoreDef: p.ignoreDef, noHooks: p.noHooks, proj: p });
        if (res) { p.hits++; if (p.onHit) p.onHit(p, e, res); if (p.sword && !p.noHooks) fxCall(p.sword, 'onProjHit', P, p, e, res); if (p.pierce > 0 && p.hits >= p.pierce) { killProj(p, 'hit'); break; } }
      }
    } else if (P && !P.dead && projHitsBox(p, P.x, P.y, P.w, P.h)) {
      if (hurtPlayer(p.dmg, p.x - p.vx * .1, p.kb || 120)) { if (p.onHit) p.onHit(p); if (p.pierce > 0 && ++p.hits >= p.pierce) killProj(p, 'hit'); }
    }
    if (p.life <= 0 || p.y > G.world.h * TS + 100) killProj(p, 'life');
  }
}
// ---- desenho de projéteis ----
function drawProj(g, p, glowPass) {
  if (p.delay > 0) return;
  const k = clamp(p.life / (p.maxLife || p.life + p.age), 0, 1);
  if (glowPass) { if (p.glow) { const gl = p.glowR || p.r * 3.2; drawGlow(g, p.x, p.y, gl * (p.pulse ? .85 + .15 * Math.sin(G.t * 14) : 1), p.glow, p.glowA === undefined ? .8 : p.glowA); } if (p.shape === 'beam') drawBeam(g, p, true); return; }
  g.save(); g.translate(p.x, p.y); const r = p.r;
  switch (p.shape) {
    case 'orb': g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.arc(-r * .2, -r * .2, r * .55, 0, TAU); g.fill(); break;
    case 'fire': { const f = 1 + Math.sin(G.t * 30 + p.x) * .12; g.fillStyle = '#ff5a1a'; g.beginPath(); g.arc(0, 0, r * f, 0, TAU); g.fill(); g.fillStyle = '#ffb02a'; g.beginPath(); g.arc(0, 0, r * .66 * f, 0, TAU); g.fill(); g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(0, 0, r * .3, 0, TAU); g.fill(); break; }
    case 'bolt': g.rotate(p.angle); { const gr = g.createLinearGradient(-r * 3, 0, r, 0); gr.addColorStop(0, rgbs(...hex2rgb(p.col), 0)); gr.addColorStop(1, p.col); g.fillStyle = gr; g.fillRect(-r * 3, -r * .55, r * 4, r * 1.1); g.fillStyle = p.col2; g.fillRect(-r * .5, -r * .3, r * 1.6, r * .6); } break;
    case 'blade': g.rotate(p.angle); g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, r * 1.5, -1.1, 1.1); g.arc(-r * .5, 0, r * 1.45, 1.05, -1.05, true); g.closePath(); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.arc(r * .2, 0, r * 1.25, -.9, .9); g.arc(-r * .2, 0, r * 1.2, .85, -.85, true); g.closePath(); g.fill(); break;
    case 'shard': g.rotate(p.angle); g.fillStyle = p.col; g.beginPath(); g.moveTo(r * 1.8, 0); g.lineTo(0, -r * .8); g.lineTo(-r * 1.2, 0); g.lineTo(0, r * .8); g.closePath(); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.moveTo(r * 1.8, 0); g.lineTo(0, -r * .8); g.lineTo(-r * .3, 0); g.closePath(); g.fill(); break;
    case 'spike': { const h = p.hh ? p.hh * 2 * (p.rise !== undefined ? p.rise : 1) : r * 2, w = p.hw ? p.hw : r; g.fillStyle = p.col; g.beginPath(); g.moveTo(-w, p.hh || 0); g.lineTo(0, (p.hh || 0) - h); g.lineTo(w, p.hh || 0); g.closePath(); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.moveTo(0, (p.hh || 0) - h); g.lineTo(w, p.hh || 0); g.lineTo(w * .2, p.hh || 0); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, p.hh || 0); g.lineTo(0, (p.hh || 0) - h); g.lineTo(w, p.hh || 0); g.stroke(); break; }
    case 'star': { g.rotate(p.rot); g.fillStyle = p.col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rr = i % 2 ? r * .45 : r * 1.3; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.arc(0, 0, r * .4, 0, TAU); g.fill(); break; }
    case 'ring': g.strokeStyle = p.col; g.lineWidth = Math.max(1.5, r * .22); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); break;
    case 'scythe': g.rotate(p.rot); g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, r * 1.4, -.3, 2.6); g.arc(r * .3, r * .15, r * 1.25, 2.55, -.25, true); g.closePath(); g.fill(); g.strokeStyle = p.col2; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, r * 1.38, -.1, 2.4); g.stroke(); break;
    case 'sword': g.rotate(p.angle); g.fillStyle = p.col; g.beginPath(); g.moveTo(r * 2.2, 0); g.lineTo(0, -r * .38); g.lineTo(-r * 1.2, -r * .25); g.lineTo(-r * 1.2, r * .25); g.lineTo(0, r * .38); g.closePath(); g.fill(); g.fillStyle = p.col2; g.fillRect(-r * 1.1, -r * .85, r * .4, r * 1.7); g.fillStyle = p.col2; g.fillRect(-r * 1.9, -r * .16, r * .85, r * .32); break;
    case 'rock': g.rotate(p.rot); g.fillStyle = p.col; g.beginPath(); g.moveTo(r, 0); g.lineTo(r * .3, -r * .9); g.lineTo(-r * .8, -r * .5); g.lineTo(-r, r * .3); g.lineTo(r * .1, r * .9); g.closePath(); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.moveTo(r, 0); g.lineTo(r * .3, -r * .9); g.lineTo(-r * .2, -r * .1); g.closePath(); g.fill(); break;
    case 'bone': g.rotate(p.rot); g.fillStyle = '#efe7cf'; g.fillRect(-r, -r * .22, r * 2, r * .44); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.beginPath(); g.arc(sx * r, sy * r * .3, r * .3, 0, TAU); g.fill(); } break;
    case 'ball': g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.arc(-r * .3, -r * .3, r * .5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, r * 1.5, r * .45, p.rot * .5, 0, TAU); g.stroke(); break;
    case 'petal': g.rotate(p.angle + p.rot * .3); g.fillStyle = p.col; g.beginPath(); g.ellipse(0, 0, r * 1.6, r * .7, 0, 0, TAU); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.ellipse(r * .3, 0, r * .8, r * .3, 0, 0, TAU); g.fill(); break;
    case 'needle': g.rotate(p.angle); g.fillStyle = p.col; g.fillRect(-r * 1.4, -1, r * 2.8, 2); g.fillStyle = p.col2; g.fillRect(r * .6, -1, r * .8, 2); break;
    case 'meteor': { g.rotate(p.rot); g.fillStyle = '#3a2a24'; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (.8 + .25 * Math.sin(i * 2.7)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = p.col; g.beginPath(); g.arc(-r * .2, -r * .1, r * .55, 0, TAU); g.fill(); g.fillStyle = p.col2; g.beginPath(); g.arc(-r * .3, -r * .2, r * .25, 0, TAU); g.fill(); break; }
    case 'tentacle': { const h = p.hh * 2 * Math.min(1, p.age / .12), w = p.hw * (1 - .3 * Math.min(1, p.age / .3)); g.fillStyle = p.col; g.beginPath(); const sway = Math.sin(p.age * 10) * 4; g.moveTo(-w, p.hh); g.quadraticCurveTo(-w * .6 + sway, p.hh - h * .5, sway * 1.5, p.hh - h); g.quadraticCurveTo(w * .6 + sway, p.hh - h * .5, w, p.hh); g.closePath(); g.fill(); g.fillStyle = p.col2; for (let i = 1; i < 5; i++) { const yy = p.hh - h * i / 5; g.beginPath(); g.arc(Math.sin(p.age * 10) * 4 * (i / 5) * 1.5, yy, 2, 0, TAU); g.fill(); } break; }
    case 'vine': { const h = p.hh * 2 * Math.min(1, p.age / .15); g.strokeStyle = p.col; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, p.hh); g.bezierCurveTo(-6, p.hh - h * .3, 6, p.hh - h * .6, 0, p.hh - h); g.stroke(); g.strokeStyle = p.col2; g.lineWidth = 1.4; g.stroke(); g.fillStyle = '#7bd05a'; g.beginPath(); g.arc(0, p.hh - h, 3, 0, TAU); g.fill(); break; }
    case 'blackhole': { const rr = r * (p.grow ? Math.min(1, p.age / .25) : 1); g.rotate(p.rot); g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, rr * .55, 0, TAU); g.fill(); g.strokeStyle = p.col; g.lineWidth = 2.4; for (let i = 0; i < 3; i++) { g.globalAlpha = .8 - i * .2; g.beginPath(); g.ellipse(0, 0, rr * (.75 + i * .2), rr * (.3 + i * .08), i * .7, .3, 5.3); g.stroke(); } g.globalAlpha = 1; break; }
    case 'portal': { g.rotate(p.angle || 0); const s = Math.min(1, p.age / .2) * Math.min(1, p.life / .2 + .01); g.scale(s, s); g.fillStyle = '#12002a'; g.beginPath(); g.ellipse(0, 0, r * .55, r, 0, 0, TAU); g.fill(); g.strokeStyle = p.col; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, r * .55, r, 0, 0, TAU); g.stroke(); g.strokeStyle = p.col2; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, r * .35, r * .72, p.rot, 0, TAU * .75); g.stroke(); break; }
    case 'fissure': { g.fillStyle = '#120a08'; g.beginPath(); g.moveTo(-p.hw, 0); g.lineTo(-p.hw * .5, -3); g.lineTo(p.hw * .3, -2); g.lineTo(p.hw, 0); g.lineTo(p.hw * .4, 3); g.lineTo(-p.hw * .4, 2); g.closePath(); g.fill(); g.strokeStyle = p.col; g.lineWidth = 1.5; g.stroke(); break; }
    case 'beam': drawBeam(g, p, false); break;
    case 'sparkle': g.fillStyle = p.col; g.fillRect(-1, -r, 2, r * 2); g.fillRect(-r, -1, r * 2, 2); break;
    case 'wave': { g.fillStyle = p.col; const h = p.hh * 2; g.beginPath(); g.moveTo(-r * .6, p.hh); g.lineTo(0, p.hh - h); g.lineTo(r * .6, p.hh); g.closePath(); g.fill(); g.fillStyle = p.col2; g.fillRect(-r * .6, p.hh - 2, r * 1.2, 2); break; }
  }
  g.restore();
}
function drawBeam(g, p, glow) {
  const a = p.ang, x1 = p.x + Math.cos(a) * p.len, y1 = p.y + Math.sin(a) * p.len, k = clamp(p.life / p.maxLife, 0, 1), w = p.bw * (.35 + .65 * Math.sin(Math.min(1, k * 1.4) * PI * .5));
  g.save(); g.lineCap = 'round';
  if (glow) { g.globalAlpha = .55 * k; g.strokeStyle = p.glow || p.col; g.lineWidth = w * 3; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(x1, y1); g.stroke(); g.globalAlpha = 1; }
  else { g.strokeStyle = p.col; g.lineWidth = w; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = p.col2; g.lineWidth = w * .45; g.stroke(); }
  g.restore();
}
function segAABB(x0, y0, x1, y1, bx, by, bw, bh) { // Liang–Barsky
  let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
  const p = [-dx, dx, -dy, dy], q = [x0 - bx, bx + bw - x0, y0 - by, by + bh - y0];
  for (let i = 0; i < 4; i++) { if (p[i] === 0) { if (q[i] < 0) return false; } else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
  return true;
}
// feixe instantâneo/contínuo (raio) com dano em linha
function fireBeam(o) {
  const a = o.ang; let len = o.len;
  if (!o.pierceTiles) { const r = rayTiles(o.x, o.y, o.x + Math.cos(a) * len, o.y + Math.sin(a) * len, 6); if (r.hit) len = Math.hypot(r.x - o.x, r.y - o.y); }
  const p = spawnProj(Object.assign({ kind: 'custom', shape: 'beam', noHit: true, tiles: false, life: o.life || .3, bw: o.width || 8, col: '#fff', col2: '#fff', pierce: 0 }, o, { len }));
  p.maxLife = p.life; p.tickT = 0;
  const tick = o.tick || 0, dmgT = (first) => {
    const x1 = p.x + Math.cos(a) * p.len, y1 = p.y + Math.sin(a) * p.len, hw = (o.hitW || p.bw) / 2;
    for (const e of G.enemies) {
      if (e.dead || e.ghostly || e.harmless || e.invulnerable) continue;
      if (!segAABB(p.x, p.y, x1, y1, e.x - hw, e.y - hw, e.w + hw * 2, e.h + hw * 2)) continue;
      hitEnemy(e, { src: 'proj', id: p.id + ':' + (tick ? Math.floor(p.age / tick) : 0), imm: tick || 1e9, dmg: o.dmg, kb: o.kb || 0, dir: { x: Math.cos(a), y: Math.sin(a) }, sword: o.sword, status: o.status, elem: o.elem, noKb: o.noKb, fs: .5, fromX: p.x, fromY: p.y });
    }
  };
  p.onUpdate = (q, dt) => { if (tick) { q.tickT += dt; if (q.tickT >= tick) { q.tickT = 0; dmgT(); } } if (o.follow) { const s = o.follow(); q.x = s.x; q.y = s.y; if (s.ang !== undefined) q.ang = s.ang; } };
  dmgT(true);
  if (!tick) p.life = o.life || .22;
  p.maxLife = p.life; p.light = [1, 1, 1];
  return p;
}
// explosão em área
function explode(x, y, r, dmg, o) {
  o = o || {}; const id = 'x' + (G.srcId++);
  for (const e of enemiesNear(x, y, r)) {
    const dx = ecx(e) - x, dy = ecy(e) - y, l = Math.hypot(dx, dy) || 1;
    hitEnemy(e, { src: 'area', id, dmg: o.falloff ? dmg * (1 - clamp(l / (r * 1.4), 0, .6)) : dmg, kb: o.kb === undefined ? 4 : o.kb, dir: { x: dx / l, y: dy / l - .2 }, sword: o.sword, status: o.status, elem: o.elem, fs: o.fs === undefined ? .4 : o.fs, fromX: x, fromY: y, critChance: o.critChance, noHooks: o.noHooks, pctMax: o.pctMax });
  }
  if (!o.silent) {
    const c = o.col || '#ffb347'; ringFx(x, y, r, c, .35, 4); burst(x, y, Math.min(30, 8 + r * .25), { col: o.cols || [c, '#fff2a0', '#ff6a2a'], spd: r * 3, g: 200, life: .5, size: 3.4, glow: true });
    sfx(o.sfx || 'boom', Math.min(1, r / 60)); shake(Math.min(10, r / 8));
    G.light.addLight(x / TS, y / TS, 1, .8, .5);
  }
  if (o.tiles) breakTilesRadius(x, y, o.tiles, o.tileDrop);
}
function breakTilesRadius(x, y, r, drops) {
  const wd = G.world, tx = Math.floor(x / TS), ty = Math.floor(y / TS), rt = Math.ceil(r / TS);
  for (let yy = ty - rt; yy <= ty + rt; yy++) for (let xx = tx - rt; xx <= tx + rt; xx++) {
    if ((xx - tx) ** 2 + (yy - ty) ** 2 > rt * rt) continue; const id = wd.get(xx, yy); if (!id || TD[id].unb || id === T.chest) continue;
    if (TD[id].s && yy < wd.h - 6) { if (drops && Math.random() < .2 && TD[id].d) dropItem(TD[id].d, 1, xx * TS + 4, yy * TS + 4); wd.set(xx, yy, 0); if (Math.random() < .3) tileBits(xx, yy, id); }
  }
}
function fxCall(sw, hook, ...a) { const l = sw.passiveEffects; for (let i = 0; i < l.length; i++) { const f = l[i][hook]; if (f) f.call(l[i], ...a); } }
function fxAll(sw, hook, ...a) { let r; const l = sw.passiveEffects; for (let i = 0; i < l.length; i++) { const f = l[i][hook]; if (f) { const v = f.call(l[i], ...a); if (v !== undefined) r = v; } } return r; }
