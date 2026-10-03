/* ============================================================
   14_draw_enemies: sprites procedurais de inimigos e chefes
   ============================================================ */
const _ecCache = new Map();
const STATUS_TINT = { freeze: [[140, 200, 255], .45], timestop: [[230, 210, 130], .4], burn: [[255, 120, 40], .25], poison: [[140, 220, 60], .25], curse: [[150, 60, 200], .3], rot: [[190, 60, 200], .3], shock: [[255, 240, 120], .3], panic: [[255, 130, 200], .22], corrode: [[160, 230, 60], .28], mark: [[240, 120, 240], .22] };
function ec(e, hex) {
  let c = _ecCache.get(hex); if (!c) { c = hex2rgb(hex); _ecCache.set(hex, c); }
  if (e.flash > 0) return rgbs(c[0] + (255 - c[0]) * .85, c[1] + (255 - c[1]) * .85, c[2] + (255 - c[2]) * .85);
  for (const k in e.st) { const t = STATUS_TINT[k]; if (t) return rgbs(c[0] + (t[0][0] - c[0]) * t[1], c[1] + (t[0][1] - c[1]) * t[1], c[2] + (t[0][2] - c[2]) * t[1]); }
  if (e.elemCol) { const t = hex2rgb(e.elemCol); return rgbs(c[0] + (t[0] - c[0]) * .35, c[1] + (t[1] - c[1]) * .35, c[2] + (t[2] - c[2]) * .35); }
  return rgbs(c[0], c[1], c[2]);
}
const DRAW = {};
function drawEnemy(g, e) {
  const fx = Math.round(e.x + e.w / 2), fy = Math.round(e.y + e.h), fn = DRAW[e.d.draw || e.kind]; if (!fn) return;
  g.save(); g.translate(fx, fy);
  const sc = e.scale || 1; if (sc !== 1 && !e.boss) g.scale(sc, sc);
  const R = (x, y, w, h, col) => { g.fillStyle = ec(e, col); g.fillRect(x, y, w, h); };
  if (e.st.compress && !e.boss) g.scale(1, 1);
  fn(g, e, R); g.restore();
  // indicadores de status
  const top = e.y - 6;
  if (e.st.stun) { for (let i = 0; i < 3; i++) { const a = G.t * 6 + i * 2.1; g.fillStyle = '#fde047'; g.fillRect(ecx(e) + Math.cos(a) * 9 - 1.5, top + Math.sin(a) * 2.5 - 1.5, 3, 3); } }
  if (e.st.blind) { g.fillStyle = '#fef08a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('?', ecx(e), top - 2); }
  if (e.st.panic) { g.fillStyle = '#f472b6'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('!', ecx(e) + 8, top - 2); }
  if (e.st.mark) { g.strokeStyle = '#e879f9'; g.lineWidth = 1.5; g.beginPath(); g.arc(ecx(e), ecy(e), Math.max(e.w, e.h) * .7 + Math.sin(G.t * 8) * 1.5, 0, TAU); g.stroke(); }
  if (e.st.curse) { g.fillStyle = '#c084fc'; g.fillRect(ecx(e) - 2, top - 5, 4, 4); }
  if (e.st.float) { g.strokeStyle = 'rgba(103,232,249,.7)'; g.lineWidth = 1; g.beginPath(); g.ellipse(ecx(e), e.y + e.h + 3, e.w * .6, 3, 0, 0, TAU); g.stroke(); }
  // barra de vida
  if (!e.boss && !e.isDummy && e.hp < e.hpMax && G.t - (e.lastHit || -9) < 4 && !e.harmless) {
    const w = Math.max(18, e.w), x = ecx(e) - w / 2, y = e.y - 9; g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(x - 1, y - 1, w + 2, 5); g.fillStyle = '#16a34a'; g.fillRect(x, y, w * clamp(e.hp / e.hpMax, 0, 1), 3); g.fillStyle = e.hp / e.hpMax < .35 ? '#ef4444' : '#4ade80'; g.fillRect(x, y, w * clamp(e.hp / e.hpMax, 0, 1), 1);
  }
}
function drawEnemyGlow(g, e) {
  if (e.glowc) drawGlow(g, ecx(e), ecy(e), Math.max(e.w, e.h) * 1.4, e.glowc, .35 + .1 * Math.sin(G.t * 6 + e.x));
  if (e.elemCol && !e.glowc) drawGlow(g, ecx(e), ecy(e), Math.max(e.w, e.h) * 1.2, e.elemCol, .25);
  if (e.st.burn) drawGlow(g, ecx(e), ecy(e), Math.max(e.w, e.h), '#ff7a1a', .3);
  if (e.k === 'boss_eye' && e.ai.state === 'wind') drawGlow(g, ecx(e), ecy(e), 80, '#ef4444', .5);
  if (e.k === 'boss_colossus' && e.ai.laser) { const L = e.ai.laser, cx = ecx(e), cy = ecy(e); if (L.t <= L.tel) { g.strokeStyle = 'rgba(253,230,138,' + (.25 + .35 * Math.sin(G.t * 30)) + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(L.ang) * 1500, cy + Math.sin(L.ang) * 1500); g.stroke(); } else if (L.cur !== undefined) { g.lineCap = 'round'; g.strokeStyle = 'rgba(251,191,36,.5)'; g.lineWidth = 30; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(L.cur) * 1500, cy + Math.sin(L.cur) * 1500); g.stroke(); g.strokeStyle = '#fff7c2'; g.lineWidth = 12; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); } }
}
// --- slime ---
DRAW.slime = (g, e, R) => {
  const a = e.ai, sq = clamp((a.squash || 0) + (e.onGround ? 0 : clamp(-e.vy / 1500, -.25, .3)), -.35, .35), w = e.w * (1 - sq * .6), h = e.h * (1 + sq), f = e.face;
  g.fillStyle = ec(e, e.col); g.globalAlpha = .88; g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w * .6, -h * 1.15, w * .6, -h * 1.15, w / 2, 0); g.closePath(); g.fill(); g.globalAlpha = 1;
  g.fillStyle = ec(e, shade(e.col, -.25)); g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w * .5, -h * .5, w * .5, -h * .5, w / 2, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w * .6, -h * 1.15, w * .6, -h * 1.15, w / 2, 0); g.stroke();
  g.fillStyle = ec(e, e.col2); g.beginPath(); g.ellipse(-w * .18, -h * .66, w * .13, h * .13, -.5, 0, TAU); g.fill();
  g.fillStyle = '#10212c'; g.fillRect(f * w * .08 - 3, -h * .5, 2, 3); g.fillRect(f * w * .08 + 3, -h * .5, 2, 3);
};
DRAW.kslime = (g, e, R) => {
  const a = e.ai, sq = clamp((a.squash || 0) + (e.onGround ? 0 : clamp(-e.vy / 1800, -.2, .3)), -.35, .35), w = e.w * (1 - sq * .5), h = e.h * (1 + sq);
  g.fillStyle = ec(e, '#3b82f6'); g.globalAlpha = .9; g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w * .62, -h * 1.2, w * .62, -h * 1.2, w / 2, 0); g.closePath(); g.fill(); g.globalAlpha = 1;
  const gr = g.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w * .62, -h * 1.2, w * .62, -h * 1.2, w / 2, 0); g.closePath(); g.fill();
  g.fillStyle = 'rgba(30,64,175,.55)'; g.beginPath(); g.ellipse(0, -h * .35, w * .25, h * .18, 0, 0, TAU); g.fill();
  g.fillStyle = '#f4c430'; g.beginPath(); g.moveTo(-14, -h * .98); g.lineTo(-18, -h * 1.22); g.lineTo(-8, -h * 1.05); g.lineTo(0, -h * 1.3); g.lineTo(8, -h * 1.05); g.lineTo(18, -h * 1.22); g.lineTo(14, -h * .98); g.closePath(); g.fill(); g.strokeStyle = '#7a5a08'; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = '#ef4444'; g.fillRect(-1.5, -h * 1.12, 3, 3); g.fillStyle = '#fff'; g.fillRect(-w * .22, -h * .62, 8, 10); g.fillRect(w * .1, -h * .62, 8, 10); g.fillStyle = '#10212c'; g.fillRect(-w * .22 + 3, -h * .55, 4, 6); g.fillRect(w * .1 + 3, -h * .55, 4, 6);
};
// --- humanoides ---
DRAW.humanoid = (g, e, R) => {
  const f = e.face, ph = e.age * (Math.abs(e.vx) > 5 ? 9 : 0), sw = Math.sin(ph), isM = e.k === 'zombie_desert';
  g.scale(f, 1);
  const legs = (a, c) => { g.save(); g.translate(0, -9); g.rotate(a); R(-1.5, 0, 3, 9, c); g.restore(); };
  legs(-sw * .7, shade(e.col2, -.2)); legs(sw * .7, e.col2);
  R(-4, -18, 8, 9, isM ? '#e8dcb0' : '#5a6aa0'); R(-4, -11, 8, 2, e.col2);
  if (isM) { R(-4, -15, 8, 1, '#b8a870'); R(-4, -12, 8, 1, '#b8a870'); }
  R(-4, -26, 8, 8, e.col); R(-4, -27, 8, 2, isM ? '#e8dcb0' : e.col2); R(1, -23, 2, 2, '#ef4444');
  g.save(); g.translate(0, -17); g.rotate(-.15 + sw * .1); R(0, -1.3, 9, 2.6, e.col); R(5, -1.3, 4, 2.6, e.col2); g.restore();
  g.save(); g.translate(0, -17); g.rotate(.1 - sw * .1); R(0, -1.3, 8, 2.6, shade(e.col, -.2)); g.restore();
};
DRAW.skeleton = (g, e, R) => {
  const f = e.face, ph = e.age * (Math.abs(e.vx) > 5 ? 9 : 0), sw = Math.sin(ph), bone = e.col, dk = e.col2; g.scale(f, 1);
  const legs = (a, c) => { g.save(); g.translate(0, -9); g.rotate(a); R(-1, 0, 2, 9, c); R(-1.5, 8, 3, 1, c); g.restore(); };
  legs(-sw * .7, dk); legs(sw * .7, bone);
  R(-1, -18, 2, 9, bone); for (let i = 0; i < 4; i++) R(-4, -18 + i * 2.4, 8, 1.3, i % 2 ? dk : bone);
  R(-4, -26, 8, 8, bone); R(-4, -19, 8, 1, dk); R(-3, -23, 2, 3, '#1a1a22'); R(1, -23, 2, 3, '#1a1a22'); R(-2, -20, 4, 1, '#1a1a22');
  g.save(); g.translate(0, -17); g.rotate(e.bow ? -.1 : .4 - sw * .3); R(0, -1, 8, 2, bone);
  if (e.bow) { g.strokeStyle = '#8a5c2c'; g.lineWidth = 1.5; g.beginPath(); g.arc(9, 0, 8, -1.2, 1.2); g.stroke(); g.strokeStyle = '#ddd'; g.lineWidth = .8; g.beginPath(); g.moveTo(9 + Math.cos(-1.2) * 8, Math.sin(-1.2) * 8); g.lineTo(9 + Math.cos(1.2) * 8, Math.sin(1.2) * 8); g.stroke(); }
  g.restore(); g.save(); g.translate(0, -17); g.rotate(.2 + sw * .3); R(0, -1, 7, 2, dk); g.restore();
};
DRAW.mush = (g, e, R) => {
  const f = e.face, sw = Math.sin(e.age * (Math.abs(e.vx) > 5 ? 9 : 0)); g.scale(f, 1);
  g.save(); g.translate(-2, -6); g.rotate(sw * .5); R(-1, 0, 3, 6, '#e2d6be'); g.restore(); g.save(); g.translate(3, -6); g.rotate(-sw * .5); R(-1, 0, 3, 6, '#cfc2a8'); g.restore();
  R(-4, -15, 9, 10, '#e2d6be'); R(2, -12, 2, 2, '#1a1a22'); R(-2, -12, 2, 2, '#1a1a22');
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(0, -16, 9, 7, 0, PI, TAU); g.fill(); g.fillRect(-9, -16, 18, 2);
  g.fillStyle = ec(e, '#bfeaff'); for (const [x, y, r] of [[-4, -19, 1.8], [3, -21, 2.2], [6, -17, 1.4]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
};
DRAW.wolf = (g, e, R) => {
  const f = e.face, ph = e.age * (Math.abs(e.vx) > 5 ? 14 : 0), sw = Math.sin(ph); g.scale(f, 1);
  const leg = (x, a, c) => { g.save(); g.translate(x, -6); g.rotate(a); R(-1.5, 0, 3, 6, c); g.restore(); };
  leg(-9, sw * .8, shade(e.col2, -.2)); leg(8, -sw * .8, shade(e.col2, -.2));
  R(-12, -14, 24, 9, e.col); R(-12, -14, 24, 2, shade(e.col, .25)); R(-11, -6, 22, 3, shade(e.col, -.25));
  leg(-6, -sw * .8, e.col2); leg(11, sw * .8, e.col2);
  R(9, -19, 10, 9, e.col); R(17, -16, 5, 4, shade(e.col, -.15)); R(21, -16, 2, 2, '#111'); R(11, -22, 3, 4, e.col2); R(15, -22, 3, 4, e.col2); R(13, -17, 2, 2, '#fde047');
  g.save(); g.translate(-12, -12); g.rotate(-.5 + sw * .3); R(-8, -2, 9, 4, e.col); g.restore();
};
DRAW.beetle = (g, e, R) => {
  const f = e.face, sw = Math.sin(e.age * (Math.abs(e.vx) > 5 ? 12 : 0)); g.scale(f, 1);
  for (let i = 0; i < 3; i++) { g.save(); g.translate(-7 + i * 7, -4); g.rotate(Math.sin(e.age * 12 + i * 2) * (Math.abs(e.vx) > 5 ? .5 : 0)); R(-.5, 0, 1.5, 5, '#1a2a12'); g.restore(); }
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(0, -8, 12, 9, 0, PI, TAU); g.fillRect(-12, -8, 24, 4); g.fill();
  g.fillStyle = ec(e, shade(e.col, .3)); g.beginPath(); g.ellipse(-3, -11, 6, 4, -.3, 0, TAU); g.fill(); R(-.5, -17, 1, 10, e.col2);
  R(10, -9, 5, 6, e.col2); R(14, -8, 4, 2, '#cbd5e1'); R(14, -4, 4, 2, '#cbd5e1'); R(12, -8, 2, 2, '#fde047');
};
DRAW.golem = (g, e, R) => {
  const f = e.face, sw = Math.sin(e.age * (Math.abs(e.vx) > 5 ? 6 : 0)); g.scale(f, 1);
  const leg = (x, a) => { g.save(); g.translate(x, -10); g.rotate(a); R(-3, 0, 6, 10, e.col2); R(-3, 0, 6, 2, e.col); g.restore(); }; leg(-5, sw * .4); leg(5, -sw * .4);
  R(-8, -24, 16, 15, e.col); R(-8, -24, 16, 3, shade(e.col, .25)); R(-6, -20, 4, 4, shade(e.col, -.2)); R(2, -17, 5, 3, shade(e.col, -.25)); R(-8, -11, 16, 2, e.col2);
  R(-5, -31, 10, 8, e.col); R(-5, -31, 10, 2, shade(e.col, .25)); R(-3, -28, 2, 2, '#fb923c'); R(2, -28, 2, 2, '#fb923c');
  g.save(); g.translate(-8, -22); g.rotate(sw * .3); R(-5, 0, 5, 14, e.col2); R(-5, 12, 5, 4, e.col); g.restore(); g.save(); g.translate(8, -22); g.rotate(-sw * .3 - .2); R(0, 0, 5, 14, e.col2); R(0, 12, 5, 4, e.col); g.restore();
};
// --- voadores ---
DRAW.eye = (g, e, R) => {
  const P = G.P, cy = -e.h / 2, r = e.w / 2, ang = Math.atan2(pcy(P) - ecy(e), pcx(P) - ecx(e));
  if (e.ai.dash > 0) { g.strokeStyle = ec(e, '#c0392b'); g.lineWidth = 3; g.beginPath(); g.moveTo(0, cy); g.quadraticCurveTo(-Math.cos(ang) * 14, cy - Math.sin(ang) * 14 + 6, -Math.cos(ang) * 22, cy - Math.sin(ang) * 22); g.stroke(); }
  g.fillStyle = ec(e, '#f4f1ea'); g.beginPath(); g.arc(0, cy, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(160,30,30,.55)'; g.lineWidth = .8; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; g.beginPath(); g.moveTo(Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(Math.cos(a) * r * .55, cy + Math.sin(a) * r * .55); g.stroke(); }
  const ox = Math.cos(ang) * r * .32, oy = Math.sin(ang) * r * .32; g.fillStyle = ec(e, e.col2); g.beginPath(); g.arc(ox, cy + oy, r * .5, 0, TAU); g.fill(); g.fillStyle = '#100'; g.beginPath(); g.arc(ox + Math.cos(ang) * 1.5, cy + oy + Math.sin(ang) * 1.5, r * .24, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(ox - 2, cy + oy - 3, 2, 2);
};
DRAW.bat = (g, e, R) => {
  const fl = Math.sin(e.age * 22), cy = -e.h / 2, f = e.vx >= 0 ? 1 : -1;
  g.fillStyle = ec(e, e.col2); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 2, cy); g.lineTo(s * 12, cy - 4 - fl * 6); g.lineTo(s * 10, cy + 2); g.lineTo(s * 6, cy + 1); g.lineTo(s * 4, cy + 4); g.closePath(); g.fill(); }
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(0, cy + 1, 4, 5, 0, 0, TAU); g.fill(); R(-3, cy - 5, 2, 3, e.col); R(1, cy - 5, 2, 3, e.col); R(-2, cy - 1, 1, 1, '#fde047'); R(1, cy - 1, 1, 1, '#fde047');
};
DRAW.wasp = (g, e, R) => {
  const fl = Math.sin(e.age * 40), cy = -e.h / 2, f = e.face; g.scale(f, 1);
  g.fillStyle = 'rgba(220,240,255,.6)'; g.beginPath(); g.ellipse(-2, cy - 6, 4, 8 * Math.abs(.5 + fl * .5) + 1, -.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(3, cy - 6, 4, 8 * Math.abs(.5 - fl * .5) + 1, .4, 0, TAU); g.fill();
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(-2, cy, 8, 5, 0, 0, TAU); g.fill(); R(-6, cy - 5, 2, 10, e.col2); R(-1, cy - 5, 2, 10, e.col2); g.fillStyle = ec(e, '#fbbf24'); g.beginPath(); g.arc(7, cy - 1, 4, 0, TAU); g.fill(); R(8, cy - 3, 2, 2, '#c00'); R(-12, cy - 1, 4, 2, '#222');
};
DRAW.harpy = (g, e, R) => {
  const fl = Math.sin(e.age * 9), cy = -e.h / 2, f = e.face; g.scale(f, 1);
  g.fillStyle = ec(e, e.col2); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, cy - 4); g.lineTo(s * 4 + s * 16, cy - 10 - fl * 8); g.lineTo(s * 22, cy - 2 - fl * 8); g.lineTo(s * 14, cy + 4); g.lineTo(s * 4, cy + 3); g.closePath(); g.fill(); }
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(0, cy + 2, 5, 8, 0, 0, TAU); g.fill(); R(-4, cy - 11, 8, 8, '#f2c28b'); R(-4, cy - 12, 8, 3, '#8a5a2a'); R(1, cy - 8, 2, 2, '#222'); R(-3, cy + 8, 2, 4, '#d4a050'); R(1, cy + 8, 2, 4, '#d4a050');
};
DRAW.imp = (g, e, R) => {
  const fl = Math.sin(e.age * 12), cy = -e.h / 2, f = e.face; g.scale(f, 1);
  g.fillStyle = ec(e, e.col2); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 2, cy - 2); g.lineTo(s * 16, cy - 10 - fl * 4); g.lineTo(s * 14, cy + 2); g.lineTo(s * 8, cy); g.closePath(); g.fill(); }
  g.strokeStyle = ec(e, e.col); g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3, cy + 8); g.quadraticCurveTo(-12, cy + 10, -10 + fl * 2, cy + 18); g.stroke();
  R(-4, cy - 2, 8, 12, e.col); R(-4, cy + 8, 3, 6, e.col2); R(1, cy + 8, 3, 6, e.col2);
  R(-5, cy - 11, 10, 9, e.col); R(-6, cy - 14, 2, 4, '#7f1d1d'); R(4, cy - 14, 2, 4, '#7f1d1d'); R(-3, cy - 8, 2, 2, '#fde047'); R(1, cy - 8, 2, 2, '#fde047');
};
DRAW.ghost = (g, e, R) => {
  const w = e.w, h = e.h, wob = Math.sin(e.age * 4) * 2, f = e.face; g.globalAlpha = .62 + .12 * Math.sin(e.age * 3);
  g.fillStyle = ec(e, e.col); g.beginPath(); g.moveTo(-w / 2, -2); g.lineTo(-w / 2, -h * .62); g.bezierCurveTo(-w / 2, -h * 1.05, w / 2, -h * 1.05, w / 2, -h * .62); g.lineTo(w / 2, -2);
  for (let i = 4; i >= 0; i--) g.lineTo(-w / 2 + i * w / 4 + wob * (i % 2 ? 1 : -1), -2 + (i % 2 ? 5 : 0)); g.closePath(); g.fill();
  g.fillStyle = '#0c1a2a'; g.beginPath(); g.ellipse(-3 * f + f * 1, -h * .62, 2.2, 3.4, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(4 * f + f * 1, -h * .62, 2.2, 3.4, 0, 0, TAU); g.fill(); g.fillRect(-2, -h * .4, 5, 2); g.globalAlpha = 1;
};
DRAW.shark = (g, e, R) => {
  const f = e.face, w = e.w, sw = Math.sin(e.age * 10) * 2; g.scale(f, 1); if (e.flop) g.rotate(.4);
  g.fillStyle = ec(e, e.col); g.beginPath(); g.moveTo(w / 2, -8); g.quadraticCurveTo(w * .15, -17, -w * .25, -12); g.lineTo(-w / 2, -8 + sw); g.lineTo(-w * .38, -2); g.lineTo(-w / 2 + 1, 2 + sw); g.quadraticCurveTo(-w * .1, 1, w * .2, -1); g.quadraticCurveTo(w * .45, -3, w / 2, -8); g.closePath(); g.fill();
  g.fillStyle = ec(e, e.col2); g.beginPath(); g.moveTo(w / 2 - 2, -8); g.quadraticCurveTo(w * .2, -3, -w * .2, -4); g.lineTo(-w * .2, -1); g.quadraticCurveTo(w * .2, 0, w / 2 - 2, -5); g.closePath(); g.fill();
  g.fillStyle = ec(e, shade(e.col, -.2)); g.beginPath(); g.moveTo(-2, -13); g.lineTo(-10, -22); g.lineTo(-9, -11); g.closePath(); g.fill();
  g.fillStyle = '#111'; g.fillRect(w / 2 - 9, -10, 2, 2); g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) g.fillRect(w / 2 - 6 + i * 2, -6, 1, 2);
};
DRAW.piranha = (g, e, R) => {
  const f = e.face, sw = Math.sin(e.age * 14) * 1.5; g.scale(f, 1);
  g.fillStyle = ec(e, e.col); g.beginPath(); g.ellipse(0, -5, 8, 5, 0, 0, TAU); g.fill(); g.fillStyle = ec(e, e.col2); g.beginPath(); g.moveTo(-7, -5); g.lineTo(-12, -9 + sw); g.lineTo(-12, -1 + sw); g.closePath(); g.fill(); R(-2, -11, 4, 3, e.col2);
  R(4, -7, 2, 2, '#fff'); R(5, -7, 1, 1, '#111'); R(6, -3, 2, 2, '#fff');
};
DRAW.bunny = (g, e, R) => { const f = e.face; g.scale(f, 1); const hop = e.onGround ? 0 : -1; R(-4, -6, 8, 6, e.col); R(2, -9, 4, 4, e.col); R(2, -14, 2, 5, e.col); R(4, -13, 1.5, 4, '#ffb6c1'); R(-6, -5, 3, 3, '#fff'); R(4, -8, 1, 1, '#222'); };
DRAW.bird = (g, e, R) => { const f = e.face, fl = Math.sin(e.age * 25); g.scale(f, 1); R(-3, -6, 7, 4, e.col); R(3, -7, 3, 3, e.col); R(6, -6, 2, 1, '#f59e0b'); g.fillStyle = ec(e, e.col2); g.beginPath(); g.moveTo(-1, -5); g.lineTo(-3, -11 - fl * 3); g.lineTo(2, -5); g.closePath(); g.fill(); R(-5, -5, 3, 1, '#2563eb'); R(4, -7, 1, 1, '#111'); };
DRAW.dummy = (g, e, R) => {
  R(-2, -14, 4, 14, '#6a4a2a'); R(-7, 0, 14, 2, '#5a3a1a'); R(-9, -22, 18, 4, '#8a6a3a'); R(-6, -30, 12, 18, e.col); R(-6, -30, 12, 3, shade(e.col, .25)); R(-6, -14, 12, 2, e.col2);
  g.fillStyle = '#d33'; g.beginPath(); g.arc(0, -22, 5, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -22, 3, 0, TAU); g.fill(); g.fillStyle = '#d33'; g.beginPath(); g.arc(0, -22, 1.2, 0, TAU); g.fill();
};
// --- chefes ---
DRAW.beye = (g, e, R) => {
  const P = G.P, cy = -e.h / 2, r = e.w / 2, ang = e.rot || 0, ph2 = e.hp / e.hpMax < .5;
  if (ph2) { g.fillStyle = ec(e, '#a01818'); g.beginPath(); g.ellipse(0, cy, r * 1.05, r, 0, 0, TAU); g.fill(); g.fillStyle = '#300'; g.beginPath(); g.ellipse(Math.cos(ang) * r * .2, cy + Math.sin(ang) * r * .2 + 6, r * .7, r * .35, ang, 0, TAU); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-r * .5 + i * r * .17, cy + 4); g.lineTo(-r * .5 + i * r * .17 + 4, cy + 16); g.lineTo(-r * .5 + i * r * .17 + 8, cy + 4); g.fill(); } }
  g.fillStyle = ec(e, '#f4f1ea'); g.beginPath(); g.arc(0, cy - (ph2 ? 6 : 0), r * (ph2 ? .62 : 1), 0, TAU); g.fill(); g.strokeStyle = 'rgba(170,30,30,.6)'; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .2; g.beginPath(); g.moveTo(Math.cos(a) * r * .95, cy + Math.sin(a) * r * .95); g.quadraticCurveTo(Math.cos(a + .2) * r * .7, cy + Math.sin(a + .2) * r * .7, Math.cos(a) * r * .45, cy + Math.sin(a) * r * .45); g.stroke(); }
  const rr = r * (ph2 ? .62 : 1), oy = cy - (ph2 ? 6 : 0); g.fillStyle = ec(e, '#d62839'); g.beginPath(); g.arc(Math.cos(ang) * rr * .3, oy + Math.sin(ang) * rr * .3, rr * .5, 0, TAU); g.fill(); g.fillStyle = '#100'; g.beginPath(); g.arc(Math.cos(ang) * rr * .36, oy + Math.sin(ang) * rr * .36, rr * .25, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(Math.cos(ang) * rr * .3 - 4, oy + Math.sin(ang) * rr * .3 - 6, 4, 4);
};
DRAW.bguard = (g, e, R) => {
  const f = e.face, cy = -e.h / 2, fl = Math.sin(e.age * 6); g.scale(f, 1);
  for (const s of [-1, 1]) { g.fillStyle = ec(e, '#4a0d0d'); g.beginPath(); g.moveTo(s * 6, cy - 6); g.lineTo(s * 46, cy - 30 - fl * 8); g.lineTo(s * 40, cy + 6); g.lineTo(s * 28, cy + 2); g.lineTo(s * 20, cy + 16); g.lineTo(s * 8, cy + 8); g.closePath(); g.fill(); g.strokeStyle = '#fb923c'; g.lineWidth = 1.4; g.stroke(); }
  g.fillStyle = ec(e, '#7f1d1d'); g.beginPath(); g.moveTo(-16, cy + 10); g.lineTo(-18, cy - 14); g.lineTo(0, cy - 22); g.lineTo(18, cy - 14); g.lineTo(16, cy + 10); g.lineTo(8, cy + 32); g.lineTo(-8, cy + 32); g.closePath(); g.fill();
  g.fillStyle = ec(e, '#b91c1c'); g.fillRect(-12, cy - 8, 24, 8); g.fillStyle = '#fb923c'; g.fillRect(-9, cy - 4, 18, 3);
  g.fillStyle = ec(e, '#5a0a0a'); g.beginPath(); g.moveTo(-16, cy - 20); g.lineTo(-24, cy - 40); g.lineTo(-8, cy - 24); g.closePath(); g.fill(); g.beginPath(); g.moveTo(16, cy - 20); g.lineTo(24, cy - 40); g.lineTo(8, cy - 24); g.closePath(); g.fill();
  g.fillStyle = '#fde047'; g.fillRect(-10, cy - 17, 6, 5); g.fillRect(4, cy - 17, 6, 5); g.fillStyle = '#7c1d1d'; g.fillRect(-6, cy - 7, 12, 3);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(251,146,60,' + (.6 - i * .1) + ')'; g.beginPath(); g.arc(-16 + i * 8 + Math.sin(e.age * 8 + i) * 2, cy + 32 + fl * 2 + (i % 2) * 4, 4 - i * .3, 0, TAU); g.fill(); }
};
DRAW.bcolossus = (g, e, R) => {
  const cy = -e.h / 2, r = e.w / 2, t = e.age, ph = e.hp / e.hpMax;
  g.fillStyle = ec(e, '#1e1b4b'); g.beginPath(); g.arc(0, cy, r * .7, 0, TAU); g.fill();
  g.save(); g.translate(0, cy); g.rotate(e.rot || 0); g.strokeStyle = ec(e, '#fbbf24'); g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, r, r * (.3 + i * .22), i * 1.05, 0, TAU); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t; g.fillStyle = ec(e, '#fde68a'); g.beginPath(); g.arc(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, 4.5, 0, TAU); g.fill(); } g.restore();
  g.fillStyle = ec(e, '#fde68a'); g.beginPath(); g.arc(0, cy, r * .42, 0, TAU); g.fill(); const P = G.P, ang = Math.atan2(pcy(P) - ecy(e), pcx(P) - ecx(e));
  g.fillStyle = ec(e, '#4f46e5'); g.beginPath(); g.arc(Math.cos(ang) * 8, cy + Math.sin(ang) * 8, r * .22, 0, TAU); g.fill(); g.fillStyle = '#05040f'; g.beginPath(); g.arc(Math.cos(ang) * 10, cy + Math.sin(ang) * 10, r * .1, 0, TAU); g.fill();
  if (ph < .33) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.4; for (let i = 0; i < 5; i++) { const a = i * 1.3 + t * 2; g.beginPath(); g.moveTo(Math.cos(a) * r * .5, cy + Math.sin(a) * r * .5); g.lineTo(Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9); g.stroke(); } }
};
