/* ============================================================
   14_draw_enemies: sprites procedurais de inimigos e chefes
   ============================================================ */
const _ecCache = new Map();
const STATUS_TINT = { freeze: [[140, 200, 255], .45], timestop: [[230, 210, 130], .4], burn: [[255, 120, 40], .25], poison: [[140, 220, 60], .25], curse: [[150, 60, 200], .3], rot: [[190, 60, 200], .3], shock: [[255, 240, 120], .3], panic: [[255, 130, 200], .22], corrode: [[160, 230, 60], .28], mark: [[240, 120, 240], .22] };
function ec(e, hex) {
  let c = _ecCache.get(hex); if (!c) { c = hex[0] === 'r' ? (hex.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number) : hex2rgb(hex); _ecCache.set(hex, c); }   // aceita "#rrggbb" e "rgb(r,g,b)" (shade() devolve rgb)
  if (e.flash > 0) return rgbs(c[0] + (255 - c[0]) * .85, c[1] + (255 - c[1]) * .85, c[2] + (255 - c[2]) * .85);
  for (const k in e.st) { const t = STATUS_TINT[k]; if (t) return rgbs(c[0] + (t[0][0] - c[0]) * t[1], c[1] + (t[0][1] - c[1]) * t[1], c[2] + (t[0][2] - c[2]) * t[1]); }
  if (e.elemCol) { const t = hex2rgb(e.elemCol); return rgbs(c[0] + (t[0] - c[0]) * .35, c[1] + (t[1] - c[1]) * .35, c[2] + (t[2] - c[2]) * .35); }
  return rgbs(c[0], c[1], c[2]);
}
const DRAW = {};
function drawEnemy(g, e) {
  const bd = (e.boss || e.bxm) && BOSSDRAW[e.d.draw || e.kind], fx = Math.round(e.x + e.w / 2), fy = Math.round(e.y + e.h), fn = DRAW[e.d.draw || e.kind]; if (!fn && !bd) return;
  const sc = e.scale || 1, big = e.boss || sc > 1.3;
  const hw = Math.ceil(big ? e.w * 1.3 * sc + 44 : (e.w + 34) * sc), up = Math.ceil(big ? e.h * 1.7 + 50 : (e.h + 26) * sc), dn = Math.ceil(big ? e.h * .6 + 36 : 16 * sc);
  if (bd) bd(g, e, fx, fy);   /* chefes: sprites pintados quadro a quadro (05e_bossart.js), sem passar pelo contorno automático */
  else drawPixelized(g, fx, fy, hw, up, dn, sg => {   // sprite vetorial -> pixel-art (alfa binário + contorno)
    const R = (x, y, w, h, col) => { sg.fillStyle = ec(e, col); sg.fillRect(x, y, w, h); };
    if (sc !== 1 && !e.boss) sg.scale(sc, sc);
    fn(sg, e, R);
  }, { alpha: e.ghostBody ? .72 : e.kind === 'slime' ? .94 : 1, ring: (e.kind === 'slime' || e.boss || e.w > 24 || e.h > 34) ? 2 : 1 });
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
  if (e._bl && e._bl.length) { const L = e._bl; for (let i = 0; i < L.length; i += 7) { g.globalAlpha = L[i + 6]; bossBlit(g, L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4], L[i + 5], null); } g.globalAlpha = 1; }   /* só os pixels que brilham: somam luz mesmo no escuro */
  if (e.glowc) drawGlow(g, ecx(e), ecy(e), Math.max(e.w, e.h) * (e._bl ? 1.7 : 1.4), e.glowc, (.35 + .1 * Math.sin(G.t * 6 + e.x)) * (e._bl ? .38 : 1));
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
// --- humanoides ---
DRAW.humanoid = (g, e, R) => {
  const f = e.face, ph = e.age * (Math.abs(e.vx) > 5 ? 9 : 0), sw = Math.sin(ph), isM = e.k === 'zombie_desert';
  g.scale(f, 1);
  const o = { f: 1, skin: e.col, hair: isM ? '#e8dcb0' : e.col2, shirt: isM ? '#e8dcb0' : '#5a6aa0', pants: e.col2, boots: mix(hex2rgb(e.col2), [0, 0, 0], .45), eye: '#c81e1e', white: '#e9ecc4', hairStyle: isM ? 'bald' : 'short', tint: c => ec(e, c), bob: 0, air: false };
  humanLegs(g, o, sw);
  g.save(); g.translate(0, -17); g.rotate(.1 - sw * .1); humanArm(g, o, 8, true); g.restore();
  humanUpper(g, o);
  if (isM) { R(-4, -15, 8, 1, '#b8a870'); R(-4, -12, 8, 1, '#b8a870'); R(-5, -26, 10, 1, '#b8a870'); R(-5, -23, 10, 1, '#e8dcb0'); }
  g.save(); g.translate(0, -17); g.rotate(-.15 + sw * .1); humanArm(g, o, 9, false); g.restore();
};
DRAW.skeleton = (g, e, R) => {
  const f = e.face, ph = e.age * (Math.abs(e.vx) > 5 ? 9 : 0), sw = Math.sin(ph), bone = e.col, dk = e.col2; g.scale(f, 1);
  const legs = (a, c) => { g.save(); g.translate(0, -9); g.rotate(a); R(-1, 0, 2, 9, c); R(-1.5, 8, 3, 1, c); g.restore(); };
  legs(-sw * .7, dk); legs(sw * .7, bone);
  R(-1, -18, 2, 9, bone); for (let i = 0; i < 4; i++) R(-4, -18 + i * 2.4, 8, 1.3, i % 2 ? dk : bone);
  pixArt(g, -5, -28, SKULL_HEAD, { S: ec(e, bone), T: ec(e, dk), K: '#15151d' });
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
// Cada chefe é uma pilha de sprites pintados em 05e_bossart.js (corpo em cache por quadro de animação) mais as peças que se
// mexem (lanterna, íris, anéis e orbes). Cada camada também guarda os pixels que brilham (e._bl) para o passe aditivo.
let _bossScr = null;
function bossBlit(g, img, ax, ay, cx, cy, flip, tint) {   // (cx,cy) do sprite cai em (ax,ay) do mundo; flip espelha em torno desse ponto
  const w = img.width, h = img.height; let src = img;
  if (tint) {
    if (!_bossScr) _bossScr = document.createElement('canvas');
    if (_bossScr.width < w || _bossScr.height < h) { _bossScr.width = Math.max(_bossScr.width, w); _bossScr.height = Math.max(_bossScr.height, h); }
    const k = _bossScr.getContext('2d'); k.globalCompositeOperation = 'source-over'; k.clearRect(0, 0, w, h); k.drawImage(img, 0, 0);
    k.globalCompositeOperation = 'source-atop'; k.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + tint[3] + ')'; k.fillRect(0, 0, w, h); k.globalCompositeOperation = 'source-over'; src = _bossScr;
  }
  if (flip) { g.save(); g.translate(ax, ay); g.scale(-1, 1); g.drawImage(src, 0, 0, w, h, -cx, -cy, w, h); g.restore(); }
  else g.drawImage(src, 0, 0, w, h, ax - cx, ay - cy, w, h);
}
function bossTint(e) {   // clarão branco ao apanhar, ou a cor do status ativo
  if (e.flash > 0) return [255, 255, 255, .85];
  for (const k in e.st) { const t = STATUS_TINT[k]; if (t) return [t[0][0], t[0][1], t[0][2], t[1]]; }
  return null;
}
function bossLayer(g, e, spr, ax, ay, cx, cy, flip, tint, emA) {
  bossBlit(g, spr.c, ax, ay, cx, cy, flip, tint);
  if (spr.em) e._bl.push(spr.em, ax, ay, cx, cy, flip, emA === undefined ? .55 : emA);
}
function bossBegin(e) { if (!e._bl) e._bl = []; e._bl.length = 0; return bossTint(e); }
function bossShadow(g, e, cx, hw) {   // sombra achatada no chão sob os chefes voadores: some com a altura (até 16 blocos)
  const wd = G.world, tx = Math.floor(cx / TS); let ty = Math.floor((e.y + e.h) / TS), k = 0;
  while (k < 16 && !SOLID[wd.get(tx, ty)]) { ty++; k++; }
  if (k >= 16) return;
  const gy = ty * TS, t = (gy - (e.y + e.h)) / (16 * TS), w = Math.round(hw * (1 - t * .55)); if (w < 4) return;
  g.fillStyle = 'rgba(8,12,34,' + (.4 * (1 - t * .8)).toFixed(2) + ')';
  g.fillRect(cx - Math.round(w * .72), gy, Math.round(w * 1.44), 1); g.fillRect(cx - w, gy + 1, w * 2, 1); g.fillRect(cx - Math.round(w * .72), gy + 2, Math.round(w * 1.44), 1);
}
const BOSSDRAW = {};
BOSSDRAW.kslime = (g, e, fx, fy) => {
  const a = e.ai, sq = clamp((a.squash || 0) + (e.onGround ? 0 : clamp(-e.vy / 1800, -.2, .3)), -.35, .35), lv = Math.round(sq * 20), tint = bossBegin(e);
  if (e.onGround) { const sw = Math.round(78 * (1 - lv / 20 * .5)); g.fillStyle = 'rgba(8,12,34,.34)'; g.fillRect(fx - (sw >> 1), fy - 1, sw, 2); g.fillRect(fx - ((sw - 12) >> 1), fy + 1, sw - 12, 1); }   // sombra achatada no chão
  bossLayer(g, e, bossSpr('sl', lv, 0), fx, fy - 3, SL.CX, SL.CY, false, tint);
  bossWarm('sl');
};
BOSSDRAW.beye = (g, e) => {
  const ph2 = e.hp / e.hpMax < .5 ? 1 : 0, fr = Math.floor(e.age * 5) & 3, cx = Math.round(e.x + e.w / 2), cy = Math.round(e.y + e.h / 2), tint = bossBegin(e);
  bossShadow(g, e, cx, 26);
  const es = bossSpr('ey', ph2, fr); bossLayer(g, e, es, cx, cy, EY.CX, EY.CY, false, tint);
  const ir = ph2 ? 9 : 13, iris = bossPart('iris' + ir, () => eyeIris(ir)), ang = e.rot || 0, off = es.er * .3;   // a íris acompanha o jogador
  bossLayer(g, e, iris, cx + (es.ex - EY.CX) + Math.round(Math.cos(ang) * off), cy + (es.ey - EY.CY) + Math.round(Math.sin(ang) * off), iris.w >> 1, iris.h >> 1, false, tint, .5);
  bossWarm('ey');
};
BOSSDRAW.bguard = (g, e) => {
  const ph2 = e.hp / e.hpMax < .5 ? 1 : 0, fr = Math.floor(e.age * 6) & 3, cx = Math.round(e.x + e.w / 2), cy = Math.round(e.y + e.h / 2), tint = bossBegin(e), f = e.face < 0 ? -1 : 1;
  bossShadow(g, e, cx, 24);
  bossLayer(g, e, bossSpr('gd', fr, ph2), cx, cy, GD.CX, GD.CY, f < 0, tint);
  // lanterna: pêndulo preso à mão (balança sozinha e inclina com a velocidade); a corrente é desenhada pixel a pixel
  const hx = cx + f * Math.round(GD.HX * GD.K), hy = cy + Math.round(GD.HY * GD.K) + 2, sw = Math.sin(e.age * 2.3) * .4 + clamp(-e.vx * f * .0011, -.55, .55), L = 14;
  const lx = Math.round(hx + Math.sin(sw) * L), ly = Math.round(hy + Math.cos(sw) * L), n = Math.max(Math.abs(lx - hx), Math.abs(ly - hy), 1);
  for (let i = 0; i <= n; i++) { g.fillStyle = i & 1 ? '#3a2c2e' : '#150f12'; g.fillRect(Math.round(hx + (lx - hx) * i / n), Math.round(hy + (ly - hy) * i / n), 1, 1); }
  bossLayer(g, e, bossPart('lantern', guardLantern), lx, ly, 7, 0, false, tint, .7);
  bossWarm('gd');
};
BOSSDRAW.bcolossus = (g, e) => {
  const hp = e.hp / e.hpMax, ph = hp < .33 ? 3 : hp < .66 ? 2 : 1, fr = Math.floor(e.age * 4) & 3, cx = Math.round(e.x + e.w / 2), cy = Math.round(e.y + e.h / 2), tint = bossBegin(e), rot = e.rot || 0, R = 47;
  // anéis dourados em órbita: a metade de trás vai antes do corpo, a da frente depois (pontos de 2 px, sem suavização)
  const ring = (front) => {
    g.fillStyle = front ? 'rgba(255,214,102,.95)' : 'rgba(176,128,32,.8)';
    for (let i = 0; i < 3; i++) {
      const th = i * 1.05 + rot, ct = Math.cos(th), st = Math.sin(th), rb = R * (.3 + i * .22);
      for (let j = 0; j < 150; j++) { const t = j / 150 * TAU, s = Math.sin(t); if ((s > 0) !== front) continue; const px = R * Math.cos(t), py = rb * s; g.fillRect(Math.round(cx + px * ct - py * st) - 1, Math.round(cy + px * st + py * ct) - 1, 2, 2); }
    }
  };
  bossShadow(g, e, cx, 44);
  ring(false);
  bossLayer(g, e, bossSpr('co', ph, fr), cx, cy, CO.CX, CO.CY, false, tint);
  const P = G.P, ang = Math.atan2(pcy(P) - cy, pcx(P) - cx);   // íris dourada segue o jogador dentro da órbita
  bossLayer(g, e, bossPart('coiris', colossusIris), cx + Math.round(Math.cos(ang) * 5.5), cy - 6 + Math.round(Math.sin(ang) * 3.5), 7, 7, false, tint, .35);
  ring(true);
  const orb = bossPart('orb4', () => bossOrb(4));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + e.age + rot; bossLayer(g, e, orb, cx + Math.round(Math.cos(a) * (R + 1)), cy + Math.round(Math.sin(a) * (R + 1)), orb.w >> 1, orb.h >> 1, false, tint, .6); }
  bossWarm('co');
};
