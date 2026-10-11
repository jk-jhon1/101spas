/* ============================================================
   14b_draw_bx: desenho dos chefes novos (BOSSDRAW.bx) e dos seus lacaios (BOSSDRAW.bxm)
   O sprite vem de bxSpr() (05f_bxart.js); cada chefe pode somar camadas móveis com d.under / d.over / d.drawHidden.
   ============================================================ */
function bxGroundShadow(g, e, hw) {
  const fx = Math.round(e.x + e.w / 2), fy = Math.round(e.y + e.h); g.fillStyle = 'rgba(8,12,34,.34)';
  g.fillRect(fx - hw, fy - 1, hw * 2, 2); g.fillRect(fx - hw + 6, fy + 1, hw * 2 - 12, 1);
}
if (typeof BOSSDRAW !== 'undefined') BOSSDRAW.bx = (g, e) => {   /* (o validador do Node não carrega 14_draw_enemies.js) */
  const d = e.d.bx, A = BXART[d.id]; if (!A) return;
  const c = e.ai.x, cx = Math.round(e.x + e.w / 2), cy0 = Math.round(e.y + e.h / 2), tint = bossBegin(e), f = d.noFlip ? 1 : (e.face < 0 ? -1 : 1);
  const v = d.variant ? d.variant(e, c) : 0, fr = Math.floor(e.age * A.fps) % A.frames, cy = cy0 + (d.bob ? Math.round(Math.sin(e.age * d.bob) * 2) : 0);
  if (e.hidden) { if (d.drawHidden) d.drawHidden(g, e, c); return; }
  if (e.decoy) g.globalAlpha = .82;
  if (e.fly) bossShadow(g, e, cx, A.sh || (e.w >> 1)); else bxGroundShadow(g, e, A.sh || (e.w >> 1));
  const H = { cx, cy, f, tint, e, c, g, put: (part, x, y, ax, ay, flip, em) => bossLayer(g, e, part, x, y, ax, ay, !!flip, tint, em), part: bossPart };
  if (d.under) d.under(g, e, H);
  bossLayer(g, e, bxSpr(d.id, fr, v), cx, cy, A.cx, A.cy, f < 0, tint);
  if (d.over) d.over(g, e, H);
  g.globalAlpha = 1;
};
// lacaios: formas simples em pixel-art (o brilho vem do glowc)
if (typeof BOSSDRAW !== 'undefined') BOSSDRAW.bxm = (g, e) => {
  const cx = Math.round(e.x + e.w / 2), cy = Math.round(e.y + e.h / 2), w = e.w >> 1, h = e.h >> 1, t = G.t, col = e.flash > 0 ? '#ffffff' : e.col, c2 = e.col2 || '#ffffff', R = (x, y, ww, hh, cc) => { g.fillStyle = cc; g.fillRect(cx + x, cy + y, ww, hh); };
  if (e.glowc === undefined) e.glowc = e.col;
  const look = e.look || 'orb';
  if (look === 'orb') { bxDisc(g, cx, cy, w, '#10101a', 1, null); bxDisc(g, cx, cy, Math.max(2, w - 1), col, 1, null); bxDisc(g, cx - 1, cy - 1, Math.max(1, w * .45), c2, 1, null); }
  else if (look === 'crystal') { g.fillStyle = '#0b0b14'; g.beginPath(); g.moveTo(cx, cy - h - 1); g.lineTo(cx + w + 1, cy); g.lineTo(cx, cy + h + 1); g.lineTo(cx - w - 1, cy); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx + w, cy); g.lineTo(cx, cy + h); g.lineTo(cx - w, cy); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx + w * .4, cy - h * .2); g.lineTo(cx - w * .1, cy + h * .1); g.fill(); }
  else if (look === 'pylon') { R(-w, h - 4, w * 2, 4, '#15131c'); R(-w + 2, h - 6, w * 2 - 4, 2, '#2a2638'); g.fillStyle = '#0b0b14'; g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx + w - 2, cy - h * .2); g.lineTo(cx + w - 4, cy + h - 6); g.lineTo(cx - w + 4, cy + h - 6); g.lineTo(cx - w + 2, cy - h * .2); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - h + 2); g.lineTo(cx + w - 4, cy - h * .2); g.lineTo(cx + w - 6, cy + h - 8); g.lineTo(cx - w + 6, cy + h - 8); g.lineTo(cx - w + 4, cy - h * .2); g.fill(); R(-1, -h * .5, 2, h * .8, c2); }
  else if (look === 'skull') { bxDisc(g, cx, cy - 1, w, '#10101a', 1, null); bxDisc(g, cx, cy - 1, w - 1, '#e8e0c8', 1, null); R(-w + 3, cy - cy + 0, 3, 3, '#10101a'); R(w - 6, 0, 3, 3, '#10101a'); R(-w + 3, 0, 3, 3, col); R(w - 6, 0, 3, 3, col); R(-w + 4, h - 3, w * 2 - 8, 3, '#d8d0b8'); }
  else if (look === 'mirror') { bxDisc(g, cx, cy, w, '#2b3140', 1, null); bxDisc(g, cx, cy, w - 2, '#cbd5e1', 1, null); g.fillStyle = '#fff'; g.fillRect(cx - w + 4, cy - w + 4, 2, w); g.fillStyle = col; g.globalAlpha = .45; g.fillRect(cx - w + 3, cy + 1, w * 2 - 6, 2); g.globalAlpha = 1; }
  else if (look === 'bat') { const fl = Math.sin(t * 22 + e.x) * 2; g.fillStyle = '#16121e'; g.beginPath(); g.moveTo(cx, cy - 2); g.lineTo(cx - w - 4, cy - 4 + fl); g.lineTo(cx - w, cy + 3); g.lineTo(cx - 2, cy + 2); g.moveTo(cx, cy - 2); g.lineTo(cx + w + 4, cy - 4 + fl); g.lineTo(cx + w, cy + 3); g.lineTo(cx + 2, cy + 2); g.fill(); R(-2, -3, 4, 5, '#241d30'); R(-2, -2, 1, 1, col); R(1, -2, 1, 1, col); }
  else if (look === 'ghost') { g.globalAlpha = .85; g.fillStyle = col; g.beginPath(); g.arc(cx, cy - 1, w, PI, 0); g.lineTo(cx + w, cy + h); for (let i = 3; i >= -3; i--) g.lineTo(cx + i * w / 3, cy + h - (i & 1 ? 3 : 0)); g.fill(); g.globalAlpha = 1; R(-w + 3, -2, 2, 3, '#10101a'); R(w - 5, -2, 2, 3, '#10101a'); }
  else if (look === 'bell') { g.fillStyle = '#0b0b14'; g.beginPath(); g.moveTo(cx - 2, cy - h); g.lineTo(cx + 2, cy - h); g.lineTo(cx + w, cy + h - 2); g.lineTo(cx - w, cy + h - 2); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(cx - 1, cy - h + 1); g.lineTo(cx + 1, cy - h + 1); g.lineTo(cx + w - 1, cy + h - 3); g.lineTo(cx - w + 1, cy + h - 3); g.fill(); R(-1, h - 2, 2, 2, c2); }
  else { bxDisc(g, cx, cy, w, col, 1, null); }
};
