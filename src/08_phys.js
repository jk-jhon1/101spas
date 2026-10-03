/* ============================================================
   08_phys: estado global, colisão AABB x tiles, líquidos,
   partículas, textos flutuantes, drops
   ============================================================ */
const G = {
  state: 'title', mode: 'adventure', world: null, light: new Lighting(), P: null,
  enemies: [], projs: [], drops: [], parts: [], texts: [], npcs: [], boss: null, ghosts: [],
  time: .12, day: 1, t: 0, flags: { slime: false, eye: false, guardian: false, colossus: false }, stage: 0,
  cam: { x: 0, y: 0, w: 1280, h: 720, zoom: 2, shake: 0 },
  swingId: 1, srcId: 1, seed: 1, timeScale: 1, freeze: 0, dark: 0, slowmo: 0,
  opts: { god: false, noSpawn: false, showDps: false },
  toastQ: [], hitStop: 0, dpsLog: [],
};
const GRAV = 1500, MAXFALL = 900;
function shake(a) { G.cam.shake = Math.max(G.cam.shake, a); }
const T_ = (x, y) => G.world.get(x, y);

// ---------- colisão ----------
function overlapSolid(x, y, w, h) {
  const wd = G.world, x0 = Math.floor(x / TS), x1 = Math.floor((x + w - .001) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - .001) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (SOLID[wd.get(tx, ty)]) return true;
  return false;
}
function solidPx(px, py) { return SOLID[G.world.get(Math.floor(px / TS), Math.floor(py / TS))] === 1; }
function bodyMove(b, dt, o) {
  o = o || {};
  let dx = b.vx * dt, dy = b.vy * dt;
  b.hitX = 0; b.hitY = 0;
  if (o.noclip) { b.x += dx; b.y += dy; b.onGround = false; return; }
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 5));
  dx /= n; dy /= n;
  for (let i = 0; i < n; i++) {
    if (dx) {
      b.x += dx;
      if (overlapSolid(b.x, b.y, b.w, b.h)) {
        let stepped = false;
        if (o.stepUp && b.onGround) {
          for (let s = 1; s <= TS + 1; s++) if (!overlapSolid(b.x, b.y - s, b.w, b.h)) { b.y -= s; stepped = true; break; }
        }
        if (!stepped) {
          const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - .001) / TS);
          if (dx > 0) b.x = x1 * TS - b.w - .001; else b.x = (x0 + 1) * TS + .001;
          b.hitX = dx > 0 ? 1 : -1; b.vx = o.bounce ? -b.vx * o.bounce : 0; dx = 0;
          if (overlapSolid(b.x, b.y, b.w, b.h)) b.x -= Math.sign(b.hitX) * 1; // evita enterrar
        }
      }
    }
    if (dy) {
      b.y += dy;
      if (overlapSolid(b.x, b.y, b.w, b.h)) {
        const y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - .001) / TS);
        if (dy > 0) { b.y = y1 * TS - b.h - .001; b.hitY = 1; } else { b.y = (y0 + 1) * TS + .001; b.hitY = -1; }
        b.vy = o.bounce && Math.abs(b.vy) > 80 ? -b.vy * o.bounce : 0; dy = 0;
      }
    }
  }
  b.onGround = overlapSolid(b.x, b.y + 1.2, b.w, b.h);
}
// fração submersa e tipo
function liqOf(b) {
  const wd = G.world, cx = Math.floor((b.x + b.w / 2) / TS);
  let water = 0, lava = 0; const y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 1) / TS), tot = y1 - y0 + 1;
  for (let ty = y0; ty <= y1; ty++) { const q = wd.liqAt(cx, ty); if (q > 50) { if (wd.liqType(cx, ty) === LIQ_LAVA) lava++; else water++; } }
  return { water: water / tot, lava: lava / tot };
}
function groundY(px, py, maxT = 40) { // y (px) do topo do chão partindo de py para baixo (ou para cima se já dentro)
  const wd = G.world, tx = Math.floor(px / TS); let ty = Math.floor(py / TS);
  if (SOLID[wd.get(tx, ty)]) { for (let k = 0; k < 6; k++) { if (!SOLID[wd.get(tx, ty - 1)]) break; ty--; } return ty * TS; }
  for (let k = 0; k < maxT; k++) { if (SOLID[wd.get(tx, ty + 1)]) return (ty + 1) * TS; ty++; }
  return -1;
}
function ceilY(px, py, maxT = 40) {
  const wd = G.world, tx = Math.floor(px / TS); let ty = Math.floor(py / TS);
  for (let k = 0; k < maxT; k++) { if (SOLID[wd.get(tx, ty - 1)]) return ty * TS; ty--; }
  return -1;
}
function rayTiles(x0, y0, x1, y1, step = 5) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(d / step));
  for (let i = 1; i <= n; i++) { const x = x0 + dx * i / n, y = y0 + dy * i / n; if (solidPx(x, y)) return { hit: true, x: x0 + dx * (i - 1) / n, y: y0 + dy * (i - 1) / n, i }; }
  return { hit: false, x: x1, y: y1 };
}
const los = (ax, ay, bx, by) => !rayTiles(ax, ay, bx, by, 8).hit;

// ---------- partículas ----------
const MAXPARTS = 1800;
function addPart(o) {
  if (G.parts.length > MAXPARTS) return;
  o.max = o.life; o.size = o.size || 2; o.col = o.col || '#fff'; o.vx = o.vx || 0; o.vy = o.vy || 0; o.g = o.g || 0; o.drag = o.drag === undefined ? 1 : o.drag;
  G.parts.push(o); return o;
}
function burst(x, y, n, o = {}) {
  const sp = o.spd || 120, life = o.life || .6, ang = o.ang, spread = o.spread === undefined ? TAU : o.spread;
  for (let i = 0; i < n; i++) {
    const a = (ang === undefined ? rnd(TAU) : ang + rnd(-spread / 2, spread / 2)), s = sp * rnd(.35, 1);
    addPart({ x: x + rnd(-(o.r || 0), o.r || 0), y: y + rnd(-(o.r || 0), o.r || 0), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rnd(.6, 1.2), size: (o.size || 2.4) * rnd(.6, 1.2), col: Array.isArray(o.col) ? pick(o.col) : (o.col || '#fff'), g: o.g || 0, drag: o.drag === undefined ? .94 : o.drag, glow: o.glow, shrink: o.shrink === undefined ? true : o.shrink });
  }
}
function ringFx(x, y, r, col, life = .4, w = 3) { addPart({ x, y, ring: true, r0: 2, r1: r, life, col, size: w, glow: true }); }
function tileBits(x, y, id) { const d = TD[id]; const c = d.x === 'ore' ? d.ore : d.c[0]; burst(x * TS + 8, y * TS + 8, 7, { col: [c, d.c[1]], spd: 90, g: 500, life: .5, size: 2.5 }); }
function updateParts(dt) {
  const a = G.parts;
  for (let i = a.length - 1; i >= 0; i--) {
    const p = a[i]; p.life -= dt; if (p.life <= 0) { a[i] = a[a.length - 1]; a.pop(); continue; }
    if (p.ring) continue;
    p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= (p.g ? 1 : Math.pow(p.drag, dt * 60)); p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
function drawParts(g, glowPass) {
  for (const p of G.parts) {
    if (!!p.glow !== glowPass) continue;
    const k = p.life / p.max;
    if (p.ring) { const r = lerp(p.r1, p.r0, k * k); g.strokeStyle = p.col; g.globalAlpha = Math.min(1, k * 1.6); g.lineWidth = p.size * (.4 + k); g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.stroke(); g.globalAlpha = 1; continue; }
    const s = p.shrink ? p.size * (.3 + .7 * k) : p.size; g.globalAlpha = Math.min(1, k * 1.8); g.fillStyle = p.col; g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  g.globalAlpha = 1;
}
// ---------- textos flutuantes ----------
function addText(x, y, txt, col, size = 13, life = .9) { if (G.texts.length > 80) G.texts.shift(); G.texts.push({ x: x + rnd(-6, 6), y, vy: -46, txt, col: col || '#fff', life, max: life, size }); }
function updateTexts(dt) { const a = G.texts; for (let i = a.length - 1; i >= 0; i--) { const t = a[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= .96; if (t.life <= 0) a.splice(i, 1); } }

// ---------- drops ----------
function dropItem(id, n, x, y, vx, vy, delay) {
  if (!IT[id] || n <= 0) return;
  if (G.drops.length > 400) G.drops.shift();
  G.drops.push({ id, n, x, y, vx: vx === undefined ? rnd(-60, 60) : vx, vy: vy === undefined ? rnd(-170, -90) : vy, w: 10, h: 10, life: 300, delay: delay || .35, t: 0, meta: null });
}
function updateDrops(dt) {
  const P = G.P, a = G.drops;
  for (let i = a.length - 1; i >= 0; i--) {
    const d = a[i]; d.t += dt; d.life -= dt; if (d.life <= 0) { a.splice(i, 1); continue; }
    const cx = d.x + 5, cy = d.y + 5, dd = P && !P.dead ? Math.hypot(P.x + P.w / 2 - cx, P.y + P.h / 2 - cy) : 9999;
    if (d.t > d.delay && dd < 64 && invCanAdd(d.id, d.n)) { const k = 1 - dd / 64; d.vx += (P.x + P.w / 2 - cx) * 9 * dt * (1 + k * 2); d.vy += (P.y + P.h / 2 - cy) * 9 * dt * (1 + k * 2); d.vx *= .9; d.vy *= .9; d.mag = true; } else d.mag = false;
    if (!d.mag) d.vy = Math.min(d.vy + GRAV * .6 * dt, 500);
    bodyMove(d, dt, { bounce: .3 }); if (d.onGround) d.vx *= .85;
    if (d.t > d.delay && dd < 20) { const left = invAdd(d.id, d.n, d.meta); if (left < d.n) { sfx('pickup'); if (IT[d.id].type !== 'mat' || true) addText(cx, d.y - 4, '+' + (d.n - left) + ' ' + IT[d.id].n, TIERS[IT[d.id].tier || 0].col, 11, 1); } if (left <= 0) a.splice(i, 1); else d.n = left; }
  }
}
function drawDrops(g) {
  for (const d of G.drops) {
    const bob = Math.sin(G.t * 4 + d.x) * 1.2 * (d.onGround ? 1 : 0);
    const c = iconCanvas(d.id); g.imageSmoothingEnabled = false;
    g.globalAlpha = d.life < 5 ? (Math.sin(G.t * 20) > 0 ? 1 : .4) : 1;
    g.drawImage(c, d.x - 3, d.y - 6 + bob, 16, 16); g.globalAlpha = 1;
  }
}
