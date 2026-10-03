/* ============================================================
   13b_bosses: invocação e IA dos 4 chefes
   ============================================================ */
function freeSpot(w, h, cx, cy) {
  for (let r = 0; r < 14; r++) for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU, x = cx + Math.cos(a) * r * 18 - w / 2, y = cy + Math.sin(a) * r * 18 - h / 2;
    if (!overlapSolid(x, y, w, h)) return { x, y };
  }
  return { x: cx - w / 2, y: cy - h / 2 };
}
function summonBoss(kind) {
  const P = G.P, creative = G.mode === 'creative', wd = G.world;
  if (G.boss && !G.boss.dead) { toast('Já existe um chefe ativo.', '#fbbf24'); return false; }
  const side = P.face || 1, layer = wd.layerAt(Math.floor(pcx(P) / TS), Math.floor(pcy(P) / TS));
  let key, msg, col;
  if (kind === 'slime') { key = 'boss_slime'; msg = 'O Rei Slime despertou!'; col = '#60a5fa'; }
  else if (kind === 'eye') { if (!creative && !isNightFrac(G.time)) { toast('A Lente Suspeita só funciona à noite.', '#fbbf24'); return false; } key = 'boss_eye'; msg = 'O Olho Colossal está te observando...'; col = '#f87171'; }
  else if (kind === 'guardian') { if (!creative && layer !== 'hell') { toast('O Boneco Infernal só funciona no Inferno (camada mais profunda).', '#fbbf24'); return false; } key = 'boss_guardian'; msg = 'O Guardião do Abismo emerge das chamas!'; col = '#fb923c'; }
  else { if (!creative && !G.flags.guardian) { toast('O mundo ainda não está pronto. Derrote o Guardião do Abismo (Hardmode) primeiro.', '#fbbf24'); return false; } key = 'boss_colossus'; msg = 'O Colosso Estelar desce dos céus!'; col = '#fbbf24'; }
  const d = ED[key]; let x, y;
  if (key === 'boss_slime') { const p = freeSpot(d.w, d.h, pcx(P) + side * 150, pcy(P) - 120); x = p.x; y = p.y; } else { x = pcx(P) + side * 280 - d.w / 2; y = pcy(P) - 220 - d.h / 2; }
  const e = spawnEnemy(key, x, y); G.boss = e; e.bossT = 0; sfx('boss'); shake(8); toast(msg, col, 5); flash('#000000', .35, .8);
  return true;
}
function bossProj(e, o) { return shootAtPlayer(e, Object.assign({ dmg: Math.round(e.dmg * .7) }, o)); }
function radialShots(e, n, speed, off, o) { for (let i = 0; i < n; i++) { const a = off + i / n * TAU; spawnProj(Object.assign({ friendly: false, x: ecx(e), y: ecy(e), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6, dmg: Math.round(e.dmg * .65), kb: 120, life: 4, shape: 'fire', col: '#ff5a1a', col2: '#ffd23a', glow: '#ff7a1a', glowR: 20, pierce: 1, tiles: false, angle: a, light: [.9, .4, .1] }, o || {})); } }
function bossAI(e, dt, sm) {
  const P = G.P, a = e.ai, px = pcx(P), py = pcy(P), hp = e.hp / e.hpMax, cx = ecx(e), cy = ecy(e);
  if (P.dead) { e.fleeT = (e.fleeT || 0) + dt; e.vy -= 200 * dt; if (e.fleeT > 3) { e.dead = true; G.boss = null; } if (e.kind === 'bslime') { e.vy += GRAV * dt; } return; }
  e.fleeT = 0;
  if (e.kind === 'bslime') {
    a.t -= dt; a.jumps = a.jumps || 0;
    if (e.onGround) {
      if (!a.landed) { a.landed = true; shake(a.big ? 8 : 4); burst(cx, e.y + e.h, 14, { col: ['#bfdbfe', '#60a5fa'], spd: 160, g: 300, life: .5, ang: -PI / 2, spread: 2.6 }); sfx('boom', a.big ? .6 : .3); a.squash = -.35;
        if (a.big && P.onGround && Math.abs(px - cx) < 200) hurtPlayer(Math.round(e.dmg * .55), cx, 260); }
      e.vx *= Math.pow(.0003, dt);
      if (a.t <= 0) { const dir = px > cx ? 1 : -1; a.big = a.jumps % 3 === 2; e.vy = a.big ? -640 : -440; e.vx = dir * (a.big ? clamp(Math.abs(px - cx) * .85 + 50, 120, 330) : 150) * sm; a.t = hp < .5 ? .85 : 1.35; a.jumps++; a.landed = false; e.face = dir; sfx('jump'); }
    }
    a.squash = (a.squash || 0) * Math.pow(.03, dt); e.vy += GRAV * dt; e.vy = Math.min(e.vy, MAXFALL + 100);
    if (hp < .66 && !a.m1) { a.m1 = true; for (let i = 0; i < 4; i++) { const s = spawnEnemy('slime_blue', cx + rnd(-40, 40), cy - 30); s.vy = -300; s.vx = rnd(-150, 150); } toast('O Rei Slime convoca seus súditos!', '#60a5fa'); }
    if (hp < .33 && !a.m2) { a.m2 = true; for (let i = 0; i < 5; i++) { const s = spawnEnemy('slime_red', cx + rnd(-40, 40), cy - 30); s.vy = -320; s.vx = rnd(-170, 170); } }
  } else if (e.kind === 'beye') {
    const ph2 = hp < .5; a.state = a.state || 'hover'; a.t = (a.t === undefined ? 1.5 : a.t) - dt; a.ang = (a.ang || 0) + dt * (ph2 ? 1.5 : .9); a.sv = (a.sv === undefined ? 4 : a.sv) - dt; e.rot = Math.atan2(py - cy, px - cx);
    if (a.state === 'hover') {
      steerFly(e, px + Math.cos(a.ang) * 220, py - 130 + Math.sin(a.ang * 1.3) * 40, e.spd * (ph2 ? 1.25 : 1) * sm, 2.4, dt);
      if (a.t <= 0) { a.state = 'wind'; a.t = ph2 ? .35 : .5; a.dashes = ph2 ? 3 : 1; }
      if (!ph2 && a.sv <= 0 && G.enemies.filter(x => x.k === 'eye' && x.servant).length < 3) { a.sv = 5.5; const s = spawnEnemy('eye', cx, cy); s.servant = true; s.hpMax = s.hp = 16; s.dmg = Math.round(e.dmg * .4); s.w = s.h = 12; s.scale = .7; s.coinBonus = -1; s.d = Object.assign({}, s.d, { drops: [], coins: [0, 0] }); }
    } else if (a.state === 'wind') { e.vx *= Math.pow(.01, dt); e.vy *= Math.pow(.01, dt); if (a.t <= 0) { a.state = 'dash'; a.t = ph2 ? .5 : .6; const l = Math.hypot(px - cx, py - cy) || 1, sp = (ph2 ? 560 : 450) * sm; e.vx = (px - cx) / l * sp; e.vy = (py - cy) / l * sp; sfx('boom', .3); } }
    else if (a.state === 'dash') { if (a.t <= 0) { a.dashes--; if (a.dashes > 0) { a.state = 'wind'; a.t = .22; } else { a.state = 'hover'; a.t = rnd(2.2, 3.4); } } }
    e.face = px > cx ? 1 : -1;
  } else if (e.kind === 'bguard') {
    const ph2 = hp < .5; a.state = a.state || 'hover'; a.t = (a.t === undefined ? 1.2 : a.t) - dt; a.ang = (a.ang || 0) + dt * (ph2 ? 1.1 : .8); a.pat = a.pat || 0; e.face = px > cx ? 1 : -1;
    if (a.state === 'hover') {
      steerFly(e, px + Math.cos(a.ang) * 190, py - 110 + Math.sin(a.ang * 1.7) * 50, e.spd * sm, 2.2, dt);
      if (a.t <= 0) { a.pat = (a.pat + 1) % (ph2 ? 4 : 3); a.state = ['burst', 'aimed', 'charge', 'rain'][a.pat]; a.t = a.state === 'charge' ? .6 : a.state === 'rain' ? 2.2 : 1.9; a.n = 0; a.sub = 0; sfx('fire', .7); }
    } else if (a.state === 'burst') { e.vx *= .9; e.vy *= .9; a.sub -= dt; if (a.sub <= 0 && a.n < (ph2 ? 3 : 2)) { radialShots(e, ph2 ? 20 : 14, 175, a.n * .22); a.n++; a.sub = .8; sfx('fire', .5); } if (a.t <= 0) { a.state = 'hover'; a.t = ph2 ? 1.0 : 1.7; } }
    else if (a.state === 'aimed') { e.vx *= .92; e.vy *= .92; a.sub -= dt; if (a.sub <= 0 && a.n < 3) { for (let s = -1; s <= 1; s++) bossProj(e, { speed: 280, spread: s * .22, r: 7, shape: 'fire', col: '#ff5a1a', col2: '#ffd23a', glow: '#ff7a1a' }); a.n++; a.sub = .45; sfx('fire', .5); } if (a.t <= 0) { a.state = 'hover'; a.t = ph2 ? 1.0 : 1.7; } }
    else if (a.state === 'charge') { e.vx *= Math.pow(.02, dt); e.vy *= Math.pow(.02, dt); if (a.t <= 0 && !a.dashing) { a.dashing = true; a.t = .7; const l = Math.hypot(px - cx, py - cy) || 1; e.vx = (px - cx) / l * 580 * sm; e.vy = (py - cy) / l * 580 * sm; sfx('boom', .4); } else if (a.dashing && a.t <= 0) { a.dashing = false; a.state = 'hover'; a.t = 1.2; } }
    else if (a.state === 'rain') { steerFly(e, px, py - 170, e.spd * .8, 2, dt); a.sub -= dt; if (a.sub <= 0) { a.sub = .17; const x = px + rnd(-220, 220); spawnProj({ friendly: false, x, y: py - 400, vx: rnd(-20, 20), vy: 340, r: 8, dmg: Math.round(e.dmg * .6), kb: 100, life: 2.2, shape: 'fire', col: '#ff5a1a', col2: '#ffd23a', glow: '#ff7a1a', glowR: 24, pierce: 1, tiles: true, angle: PI / 2, light: [.9, .4, .1] }); } if (a.t <= 0) { a.state = 'hover'; a.t = 1.2; } }
  } else if (e.kind === 'bcolossus') {
    const ph = hp < .33 ? 3 : hp < .66 ? 2 : 1; a.state = a.state || 'hover'; a.t = (a.t === undefined ? 1.5 : a.t) - dt; a.ang = (a.ang || 0) + dt * .5 * ph; a.pat = a.pat || 0; e.rot = (e.rot || 0) + dt * .8;
    if (a.state === 'hover') {
      steerFly(e, px + Math.sin(a.ang) * 260, py - 210, e.spd * sm, 2, dt);
      if (a.t <= 0) { a.pat = (a.pat + 1) % 4; a.state = ['orbs', 'laser', 'meteors', 'homing'][a.pat]; a.t = a.state === 'laser' ? 2.5 : 2.2; a.sub = 0; a.n = 0; sfx('portal'); if (a.state === 'laser') { a.laser = { ang: Math.atan2(py - cy, px - cx), t: 0, tel: 1.0, sweep: (Math.random() < .5 ? -1 : 1) * .8 }; } }
    } else if (a.state === 'orbs') { e.vx *= .9; e.vy *= .9; a.sub -= dt; if (a.sub <= 0 && a.n < 2 + ph) { const off = a.n * .2; for (let i = 0; i < 16; i++) { const an = off + i / 16 * TAU; spawnProj({ friendly: false, x: cx, y: cy, vx: Math.cos(an) * 160, vy: Math.sin(an) * 160, r: 7, dmg: Math.round(e.dmg * .55), kb: 120, life: 5, shape: 'star', col: '#fde68a', col2: '#fff', glow: '#fbbf24', glowR: 22, pierce: 1, tiles: false, spin: 6, light: [1, .8, .3] }); } a.n++; a.sub = .65; sfx('magic', .7); } if (a.t <= 0) { a.state = 'hover'; a.t = 1.6 / ph; } }
    else if (a.state === 'laser') {
      e.vx *= .9; e.vy *= .9; const L = a.laser; L.t += dt;
      if (L.t > L.tel) { const k = clamp((L.t - L.tel) / 1.3, 0, 1), ang = L.ang + L.sweep * (k - .5) * 1.6; L.cur = ang; const x1 = cx + Math.cos(ang) * 1500, y1 = cy + Math.sin(ang) * 1500;
        if (segAABB(cx, cy, x1, y1, P.x - 4, P.y - 4, P.w + 8, P.h + 8)) hurtPlayer(Math.round(e.dmg * .75), cx, 160); if (Math.random() < .6) { const dd = rnd(40, 600); addPart({ x: cx + Math.cos(ang) * dd, y: cy + Math.sin(ang) * dd, life: .3, size: 4, col: '#fde68a', glow: true }); } G.light.addLight((cx + Math.cos(ang) * 120) / TS, (cy + Math.sin(ang) * 120) / TS, 1, .9, .5); if (L.t > L.tel + 1.3) { a.state = 'hover'; a.t = 1.4 / ph; a.laser = null; } }
    }
    else if (a.state === 'meteors') { steerFly(e, px, py - 230, e.spd * .5, 2, dt); a.sub -= dt; if (a.sub <= 0 && a.n < 6 + ph * 2) { a.sub = .22; a.n++; const x = px + rnd(-260, 260); const p = spawnProj({ friendly: false, x, y: py - 420, vx: rnd(-40, 40), vy: 440, r: 14, dmg: Math.round(e.dmg * .7), kb: 160, life: 3, shape: 'meteor', col: '#fb923c', col2: '#fde68a', glow: '#fb923c', glowR: 40, pierce: 1, tiles: true, spin: 4, noAim: true, light: [1, .6, .2], trail: '#ff9a3a', trailRate: 80 }); p.onTile = q => { burst(q.x, q.y, 14, { col: ['#fb923c', '#fde68a'], spd: 160, glow: true, life: .5 }); sfx('boom', .4); if (Math.hypot(q.x - pcx(P), q.y - pcy(P)) < 46) hurtPlayer(Math.round(e.dmg * .6), q.x, 200); }; } if (a.t <= 0) { a.state = 'hover'; a.t = 1.5 / ph; } }
    else if (a.state === 'homing') { e.vx *= .9; e.vy *= .9; a.sub -= dt; if (a.sub <= 0 && a.n < 3 + ph) { a.sub = .5; a.n++; bossProj(e, { kind: 'homing', targetP: true, steer: 1.6, speed: 210, r: 8, shape: 'orb', col: '#f0abfc', col2: '#fff', glow: '#d946ef', life: 5, spread: rnd(-.6, .6), dmg: Math.round(e.dmg * .55) }); sfx('magic', .6); } if (a.t <= 0) { a.state = 'hover'; a.t = 1.5 / ph; } }
    e.face = px > cx ? 1 : -1;
  }
}
