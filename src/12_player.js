/* ============================================================
   12_player: jogador, inventário, crafting, mineração, blocos
   ============================================================ */
const INV_N = 40, KEYS = {}, PLAYER_W = 12, PLAYER_H = 26;
function newPlayer() {
  return {
    x: 0, y: 0, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, onGround: false, face: 1, hp: 100, maxHp: 100, crystals: 0, inv_: 0, inv: new Array(INV_N).fill(null), sel: 0,
    equip: { armor: null, acc: [null, null, null] }, stats: { def: 0, dmg: 0, crit: 0, cm: 1, spd: 0, steal: 0, kbr: 0, hp: 0 },
    cb: { cd: 0, side: 1, count: 0, inst: [], sw: null, hits: 0, swingT: 0, blockT: 0, blockPct: 0, main: null, lastHitT: 0 },
    buffs: {}, mine: { x: -1, y: -1, p: 0, t: 0 }, anim: { walk: 0, arm: 0 }, coyote: 0, jbuf: 0, kbT: 0, flash: 0, dead: false, respawnT: 0,
    potionCd: 0, fallStart: 0, inWater: false, inLava: false, slowfall: 0, placeT: 0, dmgInv: 0, lavaT: 0, lastCrystalMsg: 0, atkAim: 0, jumpHeld: false,
  };
}
// P.inv = slots do inventário | P.inv_ = timer de invulnerabilidade (i-frames do jogador)

// ---------- inventário ----------
function invDirty() { G.invChanged = true; }
function stackMax(id) { return IT[id].stack || STACK_MAX; }
function invCanAdd(id, n) {
  const P = G.P, sm = stackMax(id);
  for (const s of P.inv) { if (!s) return true; if (s.id === id && s.n < sm) return true; }
  return false;
}
function invAdd(id, n, meta) {
  const P = G.P, sm = stackMax(id);
  if (sm > 1) for (const s of P.inv) { if (s && s.id === id && s.n < sm) { const k = Math.min(n, sm - s.n); s.n += k; n -= k; if (n <= 0) break; } }
  while (n > 0) {
    const i = P.inv.indexOf(null); if (i < 0) break;
    const k = Math.min(n, sm); P.inv[i] = { id, n: k, m: meta || null }; n -= k;
  }
  invDirty(); if (IT[id].type === 'sword' || IT[id].type === 'pick') recalcStats();
  return n;
}
function invCount(id) { let c = 0; for (const s of G.P.inv) if (s && s.id === id) c += s.n; return c; }
function invRemove(id, n) {
  const P = G.P; if (invCount(id) < n) return false;
  for (let i = INV_N - 1; i >= 0 && n > 0; i--) { const s = P.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) P.inv[i] = null; } }
  invDirty(); return true;
}
function heldItem() { return G.P.inv[G.P.sel]; }
function heldSword() { const s = heldItem(); return s && IT[s.id].type === 'sword' ? IT[s.id].sw : null; }

// ---------- estações e crafting ----------
let _stCache = { t: -1, set: null };
function nearStations() {
  if (_stCache.t === Math.floor(G.t * 4)) return _stCache.set;
  const P = G.P, wd = G.world, cx = Math.floor((P.x + P.w / 2) / TS), cy = Math.floor((P.y + P.h / 2) / TS), set = new Set();
  for (let y = cy - 4; y <= cy + 3; y++) for (let x = cx - 6; x <= cx + 6; x++) { const d = TD[wd.get(x, y)]; if (d.st) STATION_SAT[d.st].forEach(k => set.add(k)); }
  _stCache = { t: Math.floor(G.t * 4), set }; return set;
}
function canCraft(r) {
  if (G.mode === 'creative' && G.opts.freeCraft) return true;
  if (r.st && !nearStations().has(r.st)) return false;
  for (const k in r.ing) if (invCount(k) < r.ing[k]) return false;
  return true;
}
function missingStation(r) { return r.st && !nearStations().has(r.st); }
function doCraft(r) {
  if (!canCraft(r)) return false;
  const free = G.mode === 'creative' && G.opts.freeCraft;
  if (!free) for (const k in r.ing) invRemove(k, r.ing[k]);
  const left = invAdd(r.out, r.n);
  if (left > 0) dropItem(r.out, left, G.P.x, G.P.y);
  sfx('craft'); return true;
}

// ---------- equipamentos / estatísticas ----------
function recalcStats() {
  const P = G.P, st = { def: 0, dmg: 0, crit: 0, cm: 1, spd: 0, steal: 0, kbr: 0, hp: 0 };
  const ar = P.equip.armor; if (ar) st.def += IT[ar.id].def;
  for (const a of P.equip.acc) if (a) { const s = IT[a.id].acc; st.dmg += s.dmg || 0; st.crit += s.crit || 0; st.cm += s.cm || 0; st.spd += s.spd || 0; st.steal += s.steal || 0; st.def += s.def || 0; st.kbr += s.kbr || 0; st.hp += s.hp || 0; }
  const sw = heldSword(); P.cb.sw = sw;
  if (sw) fxCall(sw, 'stats', P, st);
  P.stats = st;
  const mh = Math.min(400, 100 + P.crystals * 20) + st.hp; P.maxHp = mh; if (P.hp > mh) P.hp = mh;
}
function equipFromInv(slot) {
  const P = G.P, s = P.inv[slot]; if (!s) return false; const it = IT[s.id];
  if (it.type === 'armor') { const old = P.equip.armor; P.equip.armor = { id: s.id, n: 1 }; P.inv[slot] = old; }
  else if (it.type === 'acc') {
    let i = P.equip.acc.indexOf(null); if (i < 0) i = 0; const old = P.equip.acc[i]; P.equip.acc[i] = { id: s.id, n: 1 }; P.inv[slot] = old;
  } else return false;
  invDirty(); recalcStats(); sfx('place'); return true;
}

// ---------- tiles: quebrar / colocar ----------
function tileDropFor(id, x, y) {
  const d = TD[id];
  if (id === T.trunk) return ['wood', rndi(1, 3)];
  if (d.d) return [d.d, id === T.coal ? rndi(1, 2) : 1];
  return null;
}
function breakTile(x, y, byPlayer) {
  const wd = G.world, id = wd.get(x, y); if (!id) return false; const d = TD[id];
  if (d.unb) return false;
  if (id === T.chest) { const ch = wd.chests.get(wd.idx(x, y)); if (ch && ch.some(s => s)) { toast('Esvazie o baú primeiro.', '#fbbf24'); return false; } wd.chests.delete(wd.idx(x, y)); }
  let drop = null, wood = 0;
  if (id === T.trunk) { wood = wd.fellTree(x, y); dropItem('wood', wood, x * TS + 4, y * TS); sfx('break'); tileBits(x, y, id); return true; }
  if (d.door) { const [a, b] = wd.doorColumn(x, y); for (let yy = a; yy <= b; yy++) wd.set(x, yy, 0, true); dropItem('door', 1, x * TS + 4, y * TS + 4); wd.checkSupport(x, a - 1); sfx('break'); tileBits(x, y, id); return true; }
  drop = tileDropFor(id, x, y);
  wd.set(x, y, 0); tileBits(x, y, id); sfx(d.s ? 'break' : 'tick');
  if (drop) { if (byPlayer && invCanAdd(drop[0], drop[1])) { const left = invAdd(drop[0], drop[1]); if (left) dropItem(drop[0], left, x * TS + 4, y * TS + 4); sfx('pickup'); } else dropItem(drop[0], drop[1], x * TS + 4, y * TS + 4); }
  if (G.world.onTileBroken) G.world.onTileBroken(x, y, id);
  return true;
}
G.dropForBreak = null;
function onWorldBreak(x, y, id) { // plantas/objetos soltos por falta de apoio
  const d = TD[id]; let drop = tileDropFor(id, x, y);
  if (d.door && TD[G.world.get(x, y - 1)].door) drop = null;
  if (drop) dropItem(drop[0], drop[1], x * TS + 4, y * TS + 4);
  tileBits(x, y, id);
}
function boxHitsAny(x, y, w, h) {
  const P = G.P;
  if (P && !P.dead && x < P.x + P.w && x + w > P.x && y < P.y + P.h && y + h > P.y) return true;
  for (const e of G.enemies) if (!e.dead && !e.noclipBody && x < e.x + e.w && x + w > e.x && y < e.y + e.h && y + h > e.y) return true;
  return false;
}
function canPlaceTile(tx, ty, tile) {
  const wd = G.world, cur = wd.get(tx, ty), d = TD[tile];
  if (tx < 1 || tx >= wd.w - 1 || ty < 1 || ty >= wd.h - 4) return false;
  if (cur !== 0 && !(TD[cur].plant && !TD[cur].hurt) && !(TD[cur].tree && false)) return false;
  if (tile === T.doorC) { for (let k = 0; k < 3; k++) { if (wd.get(tx, ty - k) !== 0) return false; } if (!SOLID[wd.get(tx, ty + 1)]) return false; return !boxHitsAny(tx * TS, (ty - 2) * TS, TS, TS * 3); }
  if (d.s && boxHitsAny(tx * TS, ty * TS, TS, TS)) return false;
  if (d.obj) return SOLID[wd.get(tx, ty + 1)] === 1;
  if (tile === T.torch) return true;
  const adj = SOLID[wd.get(tx - 1, ty)] || SOLID[wd.get(tx + 1, ty)] || SOLID[wd.get(tx, ty - 1)] || SOLID[wd.get(tx, ty + 1)] || wd.wallAt(tx, ty) || TD[wd.get(tx, ty + 1)].tree;
  return !!adj;
}
function placeTile(tx, ty, itemId) {
  const it = IT[itemId], wd = G.world;
  if (it.type === 'block') {
    if (!canPlaceTile(tx, ty, it.tile)) return false;
    if (it.tile === T.doorC) { for (let k = 0; k < 3; k++) wd.set(tx, ty - k, T.doorC, true); wd.checkSupport(tx, ty); }
    else { const cur = wd.get(tx, ty); if (cur) { onWorldBreak(tx, ty, cur); } wd.set(tx, ty, it.tile); }
    sfx('place'); return true;
  }
  if (it.type === 'wall') {
    if (wd.wallAt(tx, ty) === it.wall) return false; if (wd.get(tx, ty) && SOLID[wd.get(tx, ty)]) return false;
    const adj = wd.wallAt(tx - 1, ty) || wd.wallAt(tx + 1, ty) || wd.wallAt(tx, ty - 1) || wd.wallAt(tx, ty + 1) || SOLID[wd.get(tx - 1, ty)] || SOLID[wd.get(tx + 1, ty)] || SOLID[wd.get(tx, ty - 1)] || SOLID[wd.get(tx, ty + 1)];
    if (!adj) return false; wd.setWall(tx, ty, it.wall); sfx('place'); return true;
  }
  return false;
}
function inReach(P, tx, ty, r) { const dx = tx * TS + 8 - (P.x + P.w / 2), dy = ty * TS + 8 - (P.y + 8); return dx * dx + dy * dy <= r * r; }

// ---------- uso do item selecionado ----------
function useHeldItem(P, dt, pressed) {
  const s = heldItem(); if (!s) { P.mine.p = 0; return; }
  const it = IT[s.id], m = G.mouse, tx = Math.floor(m.wx / TS), ty = Math.floor(m.wy / TS);
  const aimAng = Math.atan2(m.wy - (P.y + 9), m.wx - (P.x + P.w / 2));
  switch (it.type) {
    case 'sword': { const sw = it.sw; P.cb.sw = sw; if (P.cb.cd <= 0) startSwing(P, sw); P.mine.p = 0; break; }
    case 'pick': {
      P.face = Math.cos(aimAng) >= 0 ? 1 : -1; P.atkAim = aimAng; P.armT = .2;
      const reach = (6.2) * TS; if (!inReach(P, tx, ty, reach)) { P.mine.p = 0; break; }
      const id = G.world.get(tx, ty), wallOnly = !id && G.world.wallAt(tx, ty) && G.world.liqAt(tx, ty) < 20;
      if (!id && !wallOnly) { P.mine.p = 0; break; }
      const d = TD[id];
      if (id && !wallOnly) {
        if (d.unb) { P.mine.p = 0; break; }
        if (d.h > it.pow) { if (pressed || G.t - (P.lastPowMsg || 0) > 2) { toast('Picareta fraca demais para ' + d.n + '. (exige poder ' + d.h + ')', '#fbbf24'); P.lastPowMsg = G.t; } P.mine.p = 0; break; }
      }
      if (P.mine.x !== tx || P.mine.y !== ty) { P.mine.x = tx; P.mine.y = ty; P.mine.p = 0; }
      const tt = wallOnly ? .35 : Math.max(.05, d.t), spd = it.spd * (G.mode === 'creative' ? 8 : 1);
      P.mine.p += dt * spd / tt; P.mine.t -= dt;
      if (P.mine.t <= 0) { P.mine.t = .17; sfx('mine'); burst(tx * TS + 8, ty * TS + 8, 2, { col: id ? (d.x === 'ore' ? d.ore : d.c[0]) : '#777', spd: 60, g: 400, life: .3, size: 2 }); }
      if (P.mine.p >= 1) {
        if (wallOnly) { const w = G.world.wallAt(tx, ty), wdf = WD[w]; G.world.setWall(tx, ty, 0); if (wdf && wdf.d) { if (invCanAdd(wdf.d, 1)) invAdd(wdf.d, 1); else dropItem(wdf.d, 1, tx * TS + 4, ty * TS + 4); } sfx('break'); }
        else breakTile(tx, ty, true);
        P.mine.p = 0;
      }
      break;
    }
    case 'block': case 'wall': {
      P.armT = .15; P.atkAim = aimAng; P.mine.p = 0; P.placeT -= dt; if (P.placeT > 0 && !pressed) break;
      if (inReach(P, tx, ty, 6.4 * TS) && placeTile(tx, ty, s.id)) { P.placeT = .1; if (G.mode !== 'creative') { s.n--; if (s.n <= 0) P.inv[P.sel] = null; invDirty(); } }
      break;
    }
    case 'use': if (pressed) useConsumable(P, s, it); break;
    case 'armor': case 'acc': if (pressed) equipFromInv(P.sel); break;
  }
}
function useConsumable(P, s, it) {
  const creative = G.mode === 'creative';
  const consume = () => { if (creative) return; s.n--; if (s.n <= 0) P.inv[P.sel] = null; invDirty(); };
  if (it.use === 'heal') { if (P.potionCd > 0) { toast('Poção em recarga (' + Math.ceil(P.potionCd) + 's)', '#fbbf24'); return; } if (P.hp >= P.maxHp) return; healPlayer(it.heal); P.potionCd = creative ? 2 : 30; sfx('heal'); burst(P.x + P.w / 2, P.y + P.h / 2, 14, { col: ['#4ade80', '#bbf7d0'], spd: 90, g: -60, glow: true, life: .6 }); consume(); }
  else if (it.use === 'life') { if (P.crystals >= 15) { toast('Vida máxima já no limite.', '#fbbf24'); return; } P.crystals++; recalcStats(); P.hp = P.maxHp; sfx('heal'); toast('Vida máxima aumentada! (' + P.maxHp + ')', '#f472b6'); consume(); }
  else if (it.use.startsWith('boss_')) { if (summonBoss(it.use.slice(5))) consume(); }
}

// ---------- atualização do jogador ----------
function updatePlayer(dt) {
  const P = G.P, wd = G.world;
  if (P.dead) { P.respawnT -= dt; if (P.respawnT <= 0) respawnPlayer(); return; }
  const k = KEYS, mouse = G.mouse, ui = G.ui && G.ui.blocking;
  // timers
  P.inv_ = Math.max(0, P.inv_ - dt); P.flash = Math.max(0, P.flash - dt); P.kbT = Math.max(0, P.kbT - dt); P.potionCd = Math.max(0, P.potionCd - dt); P.armT = Math.max(0, (P.armT || 0) - dt);
  for (const n in P.buffs) { const b = P.buffs[n]; b.t -= dt; if (b.t <= 0) { delete P.buffs[n]; continue; } if (n === 'regen') { b.acc = (b.acc || 0) + (b.hps || 1) * dt; if (b.acc >= 1) { healPlayer(1, true); b.acc -= 1; } } }
  // ambiente
  const liq = liqOf(P); P.inWater = liq.water > .3 || liq.lava > .3; P.inLava = liq.lava > .25;
  const wasWater = P._wasWater; if (P.inWater && !wasWater) { sfx('splash'); burst(P.x + P.w / 2, P.y + P.h, 12, { col: ['#60a5fa', '#bfdbfe'], spd: 120, g: 400, life: .5, ang: -PI / 2, spread: 2 }); } P._wasWater = P.inWater;
  if (P.inLava) { P.lavaT -= dt; if (P.lavaT <= 0) { P.lavaT = .5; hurtPlayer(22 + Math.round(G.stage * 6), undefined, 0, { pierce: true, inv: .3 }); } }
  // entrada horizontal
  const dir = (k.KeyD || k.ArrowRight || k.PadRight ? 1 : 0) - (k.KeyA || k.ArrowLeft || k.PadLeft ? 1 : 0);
  const sb = P.buffs.speed ? P.buffs.speed.mult : 1;
  let maxV = 150 * (1 + P.stats.spd) * sb * (P.inWater ? (P.inLava ? .45 : .7) : 1);
  if (ui) { /* UI aberta: sem movimento por mouse, teclado continua */ }
  if (P.kbT <= 0) {
    const acc = (P.onGround ? 1300 : 800) * (P.inWater ? .6 : 1) * (sb > 1 ? 1.6 : 1);
    if (dir) { P.vx = approach(P.vx, dir * maxV, acc * dt * (Math.sign(P.vx) !== dir && P.vx !== 0 ? 1.8 : 1)); if (P.cb.swingT <= 0 && P.armT <= 0) P.face = dir; }
    else P.vx = approach(P.vx, 0, (P.onGround ? 1500 : 280) * dt);
  }
  // pulo / natação
  P.coyote = P.onGround ? .09 : P.coyote - dt; const jumpKey = k.Space || k.KeyW || k.ArrowUp || k.PadJump;
  if (jumpKey && !P.jumpHeld) P.jbuf = .1; P.jbuf -= dt; P.jumpHeld = !!jumpKey;
  if (P.inWater) {
    if (jumpKey) P.vy = approach(P.vy, -170, 1200 * dt); else P.vy = approach(P.vy, 70, 400 * dt);
    if (P.inLava) P.vy = Math.min(P.vy, 60);
  } else {
    if (P.jbuf > 0 && P.coyote > 0) { P.vy = -470; P.jbuf = 0; P.coyote = 0; sfx('jump'); }
    if (!jumpKey && P.vy < -180) P.vy *= Math.pow(.0008, dt);
    let g = P.vy < 0 ? GRAV : GRAV * 1.12, maxFall = MAXFALL;
    if (P.slowfall) { g *= 1 - P.slowfall * .8; maxFall *= 1 - P.slowfall; }
    P.vy = Math.min(P.vy + g * dt, maxFall);
  }
  P.slowfall = 0;
  // queda
  const wasG = P.onGround, oldVy = P.vy;
  if (!P.onGround && P.vy > 0 && P.fallStart === 0) P.fallStart = P.y;
  bodyMove(P, dt, { stepUp: true });
  if (P.onGround && !wasG) {
    const tiles = (P.y - P.fallStart) / TS;
    if (P.fallStart > 0 && tiles > 24 && !P.inWater && G.mode !== 'creative') { const dmg = Math.round((tiles - 24) * 5); hurtPlayer(dmg, undefined, 0, { pierce: true, inv: .3 }); addText(P.x + 6, P.y - 12, 'Queda!', '#fca5a5', 11); }
    if (oldVy > 300) burst(P.x + P.w / 2, P.y + P.h, 4, { col: ['#a89070', '#c8b090'], spd: 50, g: 200, life: .3, ang: -PI / 2, spread: 2 });
    P.fallStart = 0;
  }
  if (P.onGround || P.inWater) P.fallStart = 0;
  if (P.y > wd.h * TS) P.y = 100;
  // animação
  P.anim.walk += Math.abs(P.vx) * dt * .085;
  // luz do jogador (leve) + espada
  G.light.addLight((P.x + P.w / 2) / TS, (P.y + 8) / TS, .22, .21, .2);
  // sword hooks (tick) e estatísticas
  const sw = heldSword(); if (sw !== P.cb.sw || P._statSel !== P.sel) { P._statSel = P.sel; recalcStats(); }
  if (P.cb.sw) fxCall(P.cb.sw, 'tick', P, dt);
  // usar item
  const lmb = mouse.down[0] && !ui;
  if (lmb) useHeldItem(P, dt, mouse.pressed[0]); else { P.mine.p = Math.max(0, P.mine.p - dt * 2); }
  if (mouse.pressed[2] && !ui) interact(P);
  updateSwings(P, dt);
  // revelar mapa
  revealMap(P);
}
const _revT = { t: 0 };
function revealMap(P) {
  _revT.t -= .016; if (_revT.t > 0) return; _revT.t = .25;
  const wd = G.world, cx = Math.floor((P.x + P.w / 2) / TS), cy = Math.floor((P.y + P.h / 2) / TS), r = 28, W = wd.w;
  for (let y = Math.max(0, cy - 18); y <= Math.min(wd.h - 1, cy + 18); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
    const i = x + y * W; if (wd.rev[i]) continue; if ((x - cx) * (x - cx) / (r * r) + (y - cy) * (y - cy) / 324 > 1) continue; wd.rev[i] = 1; G.mapDirty = true; if (G.mapPix) paintMapPixel(x, y);
  }
}
function interact(P) {
  const m = G.mouse, tx = Math.floor(m.wx / TS), ty = Math.floor(m.wy / TS), wd = G.world, id = wd.get(tx, ty);
  if (!inReach(P, tx, ty, 6.6 * TS)) {
    const n = nearestNpcAt(m.wx, m.wy); if (n && Math.hypot(n.x - P.x, n.y - P.y) < 100) { openNpc(n); }
    return;
  }
  if (id === T.chest) { openChest(tx, ty); return; }
  if (id === T.doorC || id === T.doorO) { wd.toggleDoor(tx, ty); sfx('door'); return; }
  const n = nearestNpcAt(m.wx, m.wy); if (n) openNpc(n);
}
function killPlayer() {
  const P = G.P; if (P.dead) return; P.dead = true; P.hp = 0; P.respawnT = G.mode === 'creative' ? .6 : 4;
  burst(P.x + P.w / 2, P.y + P.h / 2, 30, { col: ['#c0392b', '#e74c3c', '#f2c28b'], spd: 220, g: 500, life: .9, size: 3.4 });
  sfx('boom', .6); shake(10);
  for (const inst of P.cb.inst) inst.dead = true; P.cb.inst.length = 0;
  if (G.mode !== 'creative') { const lose = Math.floor(invCount('coin') * .15); if (lose > 0) { invRemove('coin', lose); dropItem('coin', lose, P.x, P.y); toast('Você morreu e perdeu ' + lose + ' moedas.', '#f87171'); } else toast('Você morreu.', '#f87171'); }
  if (G.boss) { /* chefe permanece, mas pode "vencer": despawn depois */ G.boss.winT = 6; }
}
function respawnPlayer() {
  const P = G.P, sp = G.world.spawn; P.dead = false; P.x = sp.x; P.y = sp.y; P.vx = P.vy = 0; recalcStats(); P.hp = P.maxHp; P.inv_ = 2.2; P.buffs = {}; P.fallStart = 0;
  G.cam.x = P.x - G.cam.w / G.cam.zoom / 2; G.cam.y = P.y - G.cam.h / G.cam.zoom / 2; toast('Você renasceu.', '#86efac');
}

// ---------- desenho do jogador ----------
const SKIN = '#f2c28b', HAIR = '#5b3a24';
function drawPlayer(g, P, ghostAlpha) {
  const alpha = (ghostAlpha !== undefined ? ghostAlpha : 1) * (P.buffs.invis ? .28 : 1) * ((P.inv_ > 0 && ((P.inv_ * 18) | 0) % 2) ? .5 : 1);
  if (alpha <= 0.02) return;
  const f = P.face, bx = Math.round(P.x + P.w / 2), by = Math.round(P.y + P.h);
  const arm = P.equip.armor ? IT[P.equip.armor.id].color : null;
  const shirt = arm ? shade(arm, -.1) : '#3b82f6', pants = arm ? shade(arm, -.35) : '#334155', boots = arm ? shade(arm, -.55) : '#4a3426', trim = arm ? shade(arm, .35) : '#60a5fa';
  g.save(); g.translate(bx, by); g.globalAlpha = alpha; if (ghostAlpha !== undefined) { g.filter = 'none'; }
  const walking = Math.abs(P.vx) > 12 && P.onGround, ph = P.anim.walk, sw = walking ? Math.sin(ph) : 0, air = !P.onGround && !P.inWater;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 1.2 : 0;
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // perna de trás / frente
  const legs = (a, back) => { g.save(); g.translate(back ? -1.5 : 1.5, -9 + bob); g.rotate(air ? (back ? -.5 : .35) : a); rect(-1.5, 0, 3, 9, back ? shade(pants, -.2) : pants); rect(-1.5, 7, 3, 2, back ? shade(boots, -.2) : boots); g.restore(); };
  legs(-sw * .8 * f, true); legs(sw * .8 * f, false);
  // braço de trás
  const sh = { x: 0, y: -17 + bob };
  const armBack = () => { g.save(); g.translate(sh.x, sh.y); g.rotate((air ? -.6 : -sw * .7) * f + (f > 0 ? 1.45 : PI - 1.45) - (f > 0 ? 0 : 0)); rect(0, -1.3, 7, 2.6, shade(SKIN, -.15)); rect(0, -1.3, 3, 2.6, shade(shirt, -.25)); g.restore(); };
  armBack();
  // tronco
  rect(-4, -18 + bob, 8, 9, shirt); rect(-4, -18 + bob, 8, 2, trim); rect(-4, -11 + bob, 8, 2, shade(pants, .1)); rect(-1, -16 + bob, 2, 5, shade(shirt, -.15));
  // cabeça
  rect(-4, -26 + bob, 8, 8, SKIN); rect(-4, -27 + bob, 8, 3, HAIR); rect(f > 0 ? -5 : 3, -27 + bob, 2, 7, HAIR); rect(f > 0 ? 1 : -3, -23 + bob, 2, 2, '#fff'); rect(f > 0 ? 2 : -3, -23 + bob, 1, 2, '#1a1a2e');
  if (arm) { rect(-4, -27 + bob, 8, 2, shade(arm, .1)); rect(-4, -28 + bob, 8, 1, shade(arm, .4)); }
  // braço da frente + item
  const cb = P.cb, main = cb.main && cb.main.t >= 0 && cb.main.t < cb.main.dur + .02 ? cb.main : null, it = heldItem();
  let armAng, itemAng = null, hand;
  if (main) { const p = clamp(main.t / main.dur, 0, 1); armAng = main.thrust ? main.aim : instAngle(main, p); itemAng = armAng; const td = main.thrust ? (ARM + (main.reach - ARM) * (.3 + .7 * Math.sin(p * PI)) - ARM) * .35 : 0; hand = { x: sh.x + Math.cos(armAng) * (ARM + td), y: sh.y + Math.sin(armAng) * (ARM + td) }; }
  else if (P.armT > 0 && it && (IT[it.id].type === 'pick' || IT[it.id].type === 'block' || IT[it.id].type === 'wall')) {
    const wob = IT[it.id].type === 'pick' ? Math.sin(G.t * 16) * .8 : 0; armAng = P.atkAim - .5 + wob + (IT[it.id].type === 'pick' ? .5 : .5); itemAng = armAng; hand = { x: sh.x + Math.cos(armAng) * ARM, y: sh.y + Math.sin(armAng) * ARM };
  } else { armAng = (f > 0 ? 1.15 : PI - 1.15) + (air ? (f > 0 ? -.7 : .7) : sw * .6 * f); hand = { x: sh.x + Math.cos(armAng) * ARM, y: sh.y + Math.sin(armAng) * ARM }; itemAng = (f > 0 ? -.95 : PI + .95); if (air) itemAng = (f > 0 ? -1.2 : PI + 1.2); }
  g.save(); g.translate(sh.x, sh.y); g.rotate(armAng); rect(0, -1.3, ARM, 2.6, SKIN); rect(0, -1.3, 3, 2.6, shirt); g.restore();
  if (it) {
    const t = IT[it.id];
    if (t.type === 'sword') { const spr = getSwordSprite(t.sw); g.save(); g.translate(hand.x, hand.y); g.rotate(itemAng); if (Math.cos(itemAng) < 0) g.scale(1, -1); g.imageSmoothingEnabled = false; g.drawImage(spr.c, -spr.ox, -spr.oy); g.restore(); }
    else if (t.type === 'pick' || ((t.type === 'block' || t.type === 'wall') && P.armT > 0)) { const c = iconCanvas(it.id); g.save(); g.translate(hand.x, hand.y); g.rotate(itemAng + (t.type === 'pick' ? .8 : 0)); g.imageSmoothingEnabled = true; const sz = t.type === 'pick' ? 20 : 11; g.drawImage(c, -sz / 2, -sz * .85, sz, sz); g.restore(); }
  }
  g.restore();
}
function drawGhostSwing(g, P, inst) { // clone sombrio (Aço Noturno)
  if (inst.t < 0 || inst.t > inst.dur + .05) return;
  const ox = inst.ox, bx = Math.round(P.x + P.w / 2 + ox), by = Math.round(P.y + P.h + inst.oy);
  g.save(); g.globalAlpha = inst.alpha * .65; g.translate(bx, by); g.fillStyle = '#1e1b4b'; g.fillRect(-4, -26, 8, 8); g.fillRect(-4, -18, 8, 9); g.fillRect(-4, -9, 3, 9); g.fillRect(1, -9, 3, 9);
  g.fillStyle = '#a5b4fc'; g.fillRect(inst.aim > -PI / 2 && inst.aim < PI / 2 ? 1 : -3, -23, 2, 2);
  const p = clamp(inst.t / inst.dur, 0, 1), a = instAngle(inst, p), sh = { x: 0, y: -17 }, spr = getSwordSprite(inst.sw);
  g.save(); g.translate(sh.x, sh.y); g.rotate(a); g.fillStyle = '#312e81'; g.fillRect(0, -1.3, ARM, 2.6); g.restore();
  g.translate(sh.x + Math.cos(a) * ARM, sh.y + Math.sin(a) * ARM); g.rotate(a); if (Math.cos(a) < 0) g.scale(1, -1); g.globalAlpha = inst.alpha * .8; g.drawImage(spr.c, -spr.ox, -spr.oy);
  g.restore();
}
