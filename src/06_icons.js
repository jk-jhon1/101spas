/* ============================================================
   06_icons: ícones de itens + sprites procedurais das espadas
   ============================================================ */
const _icoCache = {}, _urlCache = {};
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function poly(g, pts, fill, stroke, lw) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke !== false) { g.strokeStyle = stroke || 'rgba(0,0,0,.7)'; g.lineWidth = lw || 1.3; g.lineJoin = 'round'; g.stroke(); }
}
function circ(g, x, y, r, fill, stroke, lw) {
  g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke !== false) { g.strokeStyle = stroke || 'rgba(0,0,0,.7)'; g.lineWidth = lw || 1.3; g.stroke(); }
}
function rrect(g, x, y, w, h, r, fill, stroke) {
  g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h);
  if (fill) { g.fillStyle = fill; g.fill(); } if (stroke !== false) { g.strokeStyle = stroke || 'rgba(0,0,0,.7)'; g.lineWidth = 1.3; g.stroke(); }
}
function glowDot(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, tint(hex2rgb(col), 1, a)); gr.addColorStop(1, tint(hex2rgb(col), 1, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }

// ---------------- ÍCONES NÃO-ESPADA (espaço 32x32 -> canvas 48x48) ----------------
function drawIconSpec(g, spec, it) {
  const k = spec[0], col = spec[1] && typeof spec[1] === 'string' ? spec[1] : '#aaa';
  const dk = shade(col, -.4), lt = shade(col, .45), md = col;
  switch (k) {
    case 'tile': { g.imageSmoothingEnabled = false; const s = getTileSprite(spec[1], 0, 0); g.drawImage(s.c, s.x, s.y, 16, 16, 2, 2, 28, 28); break; }
    case 'wall': { g.imageSmoothingEnabled = false; const s = getWallSprite(spec[1], 0); g.drawImage(s.c, s.x, s.y, 16, 16, 4, 4, 24, 24); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.4; g.strokeRect(4, 4, 24, 24); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(5, 5, 22, 3); break; }
    case 'bar': {
      poly(g, [[5, 14], [22, 14], [22, 23], [5, 23]], md); poly(g, [[5, 14], [22, 14], [27, 9], [10, 9]], lt); poly(g, [[22, 14], [27, 9], [27, 18], [22, 23]], dk);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(7, 15, 12, 1.5); g.fillRect(12, 10.3, 11, 1); break;
    }
    case 'chunk': {
      poly(g, [[5, 18], [8, 9], [15, 5], [23, 7], [28, 14], [26, 23], [17, 27], [8, 25]], md);
      poly(g, [[9, 10], [15, 6], [22, 8], [16, 13]], lt, false); poly(g, [[22, 8], [28, 14], [26, 23], [20, 16]], dk, false);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(11, 9, 2, 2); g.fillRect(19, 17, 2, 2); poly(g, [[5, 18], [8, 9], [15, 5], [23, 7], [28, 14], [26, 23], [17, 27], [8, 25]], null); break;
    }
    case 'gem': {
      poly(g, [[16, 3], [26, 10], [22, 27], [10, 27], [6, 10]], md); poly(g, [[16, 3], [26, 10], [16, 14], [6, 10]], lt, false); poly(g, [[16, 14], [26, 10], [22, 27]], dk, false);
      poly(g, [[16, 3], [26, 10], [22, 27], [10, 27], [6, 10]], null); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(6, 10); g.lineTo(16, 14); g.lineTo(26, 10); g.moveTo(16, 14); g.lineTo(10, 27); g.stroke(); glowDot(g, 12, 9, 7, '#ffffff', .5); break;
    }
    case 'blob': {
      g.beginPath(); g.moveTo(16, 4); g.bezierCurveTo(24, 12, 28, 18, 26, 23); g.bezierCurveTo(24, 28, 8, 28, 6, 23); g.bezierCurveTo(4, 18, 8, 12, 16, 4); g.closePath();
      g.fillStyle = 'rgba(' + hex2rgb(col).join(',') + ',.85)'; g.fill(); g.strokeStyle = dk; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(12, 15, 2.5, 4, .5, 0, TAU); g.fill(); circ(g, 20, 22, 1.3, 'rgba(255,255,255,.4)', false); break;
    }
    case 'bone': {
      g.save(); g.translate(16, 16); g.rotate(-.7); rrect(g, -11, -2.5, 22, 5, 2, '#f1ead2'); for (const sx of [-1, 1]) for (const sy of [-1, 1]) circ(g, sx * 11, sy * 2.6, 3.2, '#f1ead2');
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(-9, 0, 18, 1.5); g.restore(); break;
    }
    case 'feather': {
      g.beginPath(); g.moveTo(5, 27); g.bezierCurveTo(8, 12, 18, 4, 27, 4); g.bezierCurveTo(26, 14, 18, 24, 6, 28); g.closePath(); g.fillStyle = '#f5f5f4'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.3; g.stroke();
      g.strokeStyle = '#c9c7c0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(5, 28); g.quadraticCurveTo(14, 18, 26, 5); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10 + i * 3, 21 - i * 3.6); g.lineTo(14 + i * 3.4, 25 - i * 3.6 - 3); g.stroke(); } break;
    }
    case 'tooth': { poly(g, [[8, 6], [24, 6], [22, 16], [17, 28], [14, 28], [9, 16]], '#f2f6fa'); poly(g, [[8, 6], [24, 6], [23, 9], [9, 9]], '#dbe4ec', false); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(16, 10, 2, 16); break; }
    case 'claw': { g.beginPath(); g.moveTo(8, 6); g.bezierCurveTo(26, 6, 28, 20, 14, 28); g.bezierCurveTo(22, 20, 20, 12, 8, 11); g.closePath(); g.fillStyle = md; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(10, 7, 9, 1.5); break; }
    case 'lens': { circ(g, 16, 16, 11, '#f4f1ea'); g.strokeStyle = 'rgba(200,60,60,.5)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11); g.lineTo(16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7); g.stroke(); } circ(g, 16, 16, 6, '#d62839'); circ(g, 16, 16, 3, '#1a0508', false); g.fillStyle = '#fff'; g.fillRect(14, 13, 2, 2); break; }
    case 'stinger': { poly(g, [[16, 28], [10, 11], [13, 6], [19, 6], [22, 11]], '#e9b824'); poly(g, [[13, 6], [19, 6], [16, 2]], '#6b4a12'); g.fillStyle = '#6b4a12'; g.fillRect(12, 14, 8, 2); g.fillRect(13, 19, 6, 2); break; }
    case 'fang': { g.beginPath(); g.moveTo(8, 5); g.bezierCurveTo(26, 5, 26, 18, 18, 28); g.bezierCurveTo(18, 16, 14, 10, 8, 9); g.closePath(); g.fillStyle = '#f3ecec'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(190,20,40,.65)'; g.fillRect(18, 22, 3, 4); g.fillRect(19, 18, 2, 3); break; }
    case 'spore': { glowDot(g, 16, 16, 15, col, .7); circ(g, 16, 16, 6, md, 'rgba(0,0,0,.4)'); circ(g, 14, 14, 2, '#fff', false); circ(g, 8, 9, 2, lt, false); circ(g, 24, 22, 1.6, lt, false); circ(g, 23, 8, 1.2, lt, false); break; }
    case 'thorn': { for (const [x, h, a] of [[10, 22, -.3], [16, 26, 0], [22, 21, .3]]) { g.save(); g.translate(x, 29); g.rotate(a); poly(g, [[-3, 0], [3, 0], [0, -h]], '#6a3f86'); poly(g, [[0, 0], [3, 0], [0, -h]], '#4a2a62', false); g.restore(); } break; }
    case 'cactus': { rrect(g, 11, 4, 10, 25, 4, '#3f9d4a'); rrect(g, 3, 11, 8, 5, 2, '#3f9d4a'); rrect(g, 3, 7, 5, 9, 2, '#3f9d4a'); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(13, 6, 2, 21); g.fillStyle = '#e6f0c8'; for (const [x, y] of [[12, 9], [19, 13], [12, 20], [19, 24], [5, 10]]) g.fillRect(x, y, 1.5, 1.5); break; }
    case 'mush': { rrect(g, 13, 16, 6, 12, 2, '#e2d6be'); g.beginPath(); g.moveTo(3, 18); g.bezierCurveTo(3, 5, 29, 5, 29, 18); g.closePath(); g.fillStyle = '#2a7de0'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 1.4; g.stroke(); circ(g, 10, 12, 2, '#bfeaff', false); circ(g, 19, 10, 2.5, '#bfeaff', false); circ(g, 23, 15, 1.5, '#bfeaff', false); glowDot(g, 16, 12, 14, '#4fb4ff', .35); break; }
    case 'coal': { poly(g, [[6, 17], [9, 8], [17, 5], [25, 9], [27, 19], [20, 26], [10, 25]], '#26262c'); poly(g, [[9, 8], [17, 5], [22, 8], [14, 12]], '#4a4a54', false); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(12, 8, 3, 2); break; }
    case 'shard': { poly(g, [[16, 2], [23, 12], [19, 29], [13, 29], [9, 12]], md); poly(g, [[16, 2], [23, 12], [16, 15], [9, 12]], lt, false); poly(g, [[16, 15], [23, 12], [19, 29]], dk, false); poly(g, [[16, 2], [23, 12], [19, 29], [13, 29], [9, 12]], null); glowDot(g, 13, 10, 7, '#ffffff', .6); break; }
    case 'orb': { glowDot(g, 16, 16, 16, col, .6); const gr = g.createRadialGradient(13, 13, 1, 16, 16, 10); gr.addColorStop(0, lt); gr.addColorStop(.6, md); gr.addColorStop(1, dk); circ(g, 16, 16, 10, gr, 'rgba(0,0,0,.6)'); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.3; g.beginPath(); g.arc(16, 16, 6, .2, 2.4); g.stroke(); circ(g, 12, 11, 2, 'rgba(255,255,255,.85)', false); break; }
    case 'frag': { glowDot(g, 16, 16, 15, col, .55); poly(g, [[16, 2], [22, 10], [28, 14], [22, 20], [19, 29], [13, 24], [5, 18], [9, 10]], md); poly(g, [[16, 2], [22, 10], [16, 14], [9, 10]], lt, false); poly(g, [[16, 14], [22, 10], [28, 14], [22, 20]], dk, false); poly(g, [[16, 2], [22, 10], [28, 14], [22, 20], [19, 29], [13, 24], [5, 18], [9, 10]], null); break; }
    case 'core': { glowDot(g, 16, 16, 16, '#fbbf24', .8); g.strokeStyle = '#fde68a'; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9); g.lineTo(16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15); g.stroke(); } const gr = g.createRadialGradient(13, 13, 1, 16, 16, 9); gr.addColorStop(0, '#fff7c2'); gr.addColorStop(.5, '#fbbf24'); gr.addColorStop(1, '#b45309'); circ(g, 16, 16, 9, gr, '#78350f'); circ(g, 16, 16, 4, '#4f46e5', '#1e1b4b'); break; }
    case 'coin': { circ(g, 16, 16, 11, '#f4c430', '#7a5a08', 1.6); circ(g, 16, 16, 8, '#ffd95a', 'rgba(122,90,8,.6)', 1); g.fillStyle = '#b8860b'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('G', 16, 17); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(9, 9, 5, 2); break; }
    case 'crystal': { glowDot(g, 16, 16, 16, '#ff4f8a', .55); poly(g, [[16, 2], [24, 12], [21, 28], [11, 28], [8, 12]], '#ff4f8a'); poly(g, [[16, 2], [24, 12], [16, 15], [8, 12]], '#ffc0d8', false); poly(g, [[16, 15], [24, 12], [21, 28]], '#b01a50', false); poly(g, [[16, 2], [24, 12], [21, 28], [11, 28], [8, 12]], null); g.fillStyle = '#fff'; g.fillRect(12, 8, 2, 5); break; }
    case 'potion': { rrect(g, 12, 3, 8, 6, 1, '#b08850'); g.beginPath(); g.moveTo(13, 9); g.lineTo(13, 13); g.bezierCurveTo(5, 16, 5, 27, 10, 28); g.lineTo(22, 28); g.bezierCurveTo(27, 27, 27, 16, 19, 13); g.lineTo(19, 9); g.closePath(); g.fillStyle = 'rgba(220,235,245,.55)'; g.fill(); g.save(); g.clip(); g.fillStyle = col; g.fillRect(0, 17, 32, 14); g.fillStyle = lt; g.fillRect(0, 17, 32, 2); g.restore(); g.beginPath(); g.moveTo(13, 9); g.lineTo(13, 13); g.bezierCurveTo(5, 16, 5, 27, 10, 28); g.lineTo(22, 28); g.bezierCurveTo(27, 27, 27, 16, 19, 13); g.lineTo(19, 9); g.closePath(); g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(9, 19, 2, 5); break; }
    case 'summon': {
      const sk = spec[1], cc = spec[2]; glowDot(g, 16, 16, 16, cc, .45);
      if (sk === 'slime') { poly(g, [[5, 24], [5, 12], [10, 17], [16, 7], [22, 17], [27, 12], [27, 24]], '#f4c430'); circ(g, 16, 7, 2, '#ef4444'); circ(g, 5, 12, 1.8, '#4ade80'); circ(g, 27, 12, 1.8, '#4ade80'); g.fillStyle = 'rgba(74,222,128,.8)'; g.fillRect(6, 22, 20, 4); }
      else if (sk === 'eye') { circ(g, 16, 16, 11, '#f4f1ea'); circ(g, 16, 16, 6, '#d62839'); circ(g, 16, 16, 3, '#000', false); g.strokeStyle = '#7f1d1d'; g.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11); g.lineTo(16 + Math.cos(a) * 14, 16 + Math.sin(a) * 14); g.stroke(); } }
      else if (sk === 'imp') { circ(g, 16, 17, 9, '#fb923c'); poly(g, [[8, 12], [5, 3], [12, 9]], '#c2410c'); poly(g, [[24, 12], [27, 3], [20, 9]], '#c2410c'); g.fillStyle = '#fef08a'; g.fillRect(11, 14, 3, 3); g.fillRect(18, 14, 3, 3); g.fillStyle = '#7c2d12'; g.fillRect(12, 21, 8, 2); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(22, 20); g.lineTo(28, 27); g.moveTo(28, 20); g.lineTo(22, 27); g.stroke(); }
      else { const pts = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i / 10 * TAU, r = i % 2 ? 5 : 13; pts.push([16 + Math.cos(a) * r, 16 + Math.sin(a) * r]); } poly(g, pts, '#fbbf24'); circ(g, 16, 16, 3, '#4f46e5', '#1e1b4b'); }
      break;
    }
    case 'pick': {
      g.save(); g.translate(16, 16); g.rotate(.78); g.fillStyle = '#7a4e2a'; g.fillRect(-1.6, -9, 3.2, 21); g.fillStyle = '#9a6a3a'; g.fillRect(-1.6, -9, 1.2, 21); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.strokeRect(-1.6, -9, 3.2, 21);
      g.beginPath(); g.moveTo(-13, -4); g.bezierCurveTo(-7, -13, 7, -13, 13, -4); g.lineTo(11, -2); g.bezierCurveTo(6, -8, -6, -8, -11, -2); g.closePath(); g.fillStyle = md; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-6, -10, 8, 1.5); g.restore(); break;
    }
    case 'armor': {
      poly(g, [[4, 8], [11, 4], [16, 7], [21, 4], [28, 8], [26, 15], [22, 14], [23, 28], [9, 28], [10, 14], [6, 15]], md); poly(g, [[11, 4], [16, 7], [21, 4], [16, 11]], lt, false); poly(g, [[9, 28], [10, 14], [16, 16], [16, 28]], dk, false);
      poly(g, [[4, 8], [11, 4], [16, 7], [21, 4], [28, 8], [26, 15], [22, 14], [23, 28], [9, 28], [10, 14], [6, 15]], null); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(14, 12, 4, 10); g.fillStyle = dk; g.fillRect(9, 22, 14, 2); break;
    }
    case 'acc': {
      const id = spec[1], cc = spec[2];
      if (id === 'acc_glove') { poly(g, [[8, 28], [8, 15], [6, 10], [9, 9], [11, 13], [11, 6], [14, 6], [14, 12], [15, 5], [18, 5], [18, 12], [20, 7], [23, 8], [21, 14], [25, 14], [23, 22], [21, 28]], cc); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(9, 17, 12, 2); g.fillStyle = shade(cc, -.4); g.fillRect(8, 24, 14, 4); }
      else if (id === 'acc_boots') { poly(g, [[9, 4], [19, 4], [19, 17], [28, 21], [28, 28], [7, 28], [7, 18]], cc); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(10, 5, 8, 3); g.fillStyle = shade(cc, -.5); g.fillRect(7, 26, 21, 2); poly(g, [[5, 12], [9, 10], [9, 16]], '#fff', 'rgba(0,0,0,.4)', 1); }
      else if (id === 'acc_ring') { circ(g, 16, 19, 8, null, '#f4c430', 4); circ(g, 16, 19, 8, null, '#7a5a08', 1); poly(g, [[16, 3], [22, 8], [16, 13], [10, 8]], cc); poly(g, [[16, 3], [22, 8], [16, 8]], '#ffc0c8', false); }
      else if (id === 'acc_fang') { g.strokeStyle = '#a8a29e'; g.lineWidth = 1.5; g.beginPath(); g.arc(16, 8, 10, .2, PI - .2); g.stroke(); g.beginPath(); g.moveTo(9, 15); g.bezierCurveTo(8, 22, 14, 24, 16, 29); g.bezierCurveTo(18, 24, 24, 22, 23, 15); g.closePath(); g.fillStyle = '#f3ecec'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.stroke(); circ(g, 16, 17, 3, cc, 'rgba(0,0,0,.6)'); }
      else if (id === 'acc_shield') { poly(g, [[5, 5], [27, 5], [27, 17], [16, 29], [5, 17]], cc); poly(g, [[16, 5], [27, 5], [27, 17], [16, 29]], shade(cc, -.3), false); poly(g, [[5, 5], [27, 5], [27, 17], [16, 29], [5, 17]], null); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(7, 7, 18, 2); g.fillStyle = '#fbbf24'; g.fillRect(14, 10, 4, 12); g.fillRect(10, 13, 12, 4); }
      else if (id === 'acc_gauntlet') { poly(g, [[7, 28], [6, 14], [9, 8], [12, 6], [12, 12], [15, 5], [18, 5], [18, 12], [21, 6], [24, 7], [22, 14], [26, 16], [24, 28]], cc); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(8, 15, 14, 2); g.fillStyle = shade(cc, -.45); g.fillRect(6, 22, 19, 6); circ(g, 16, 25, 2, '#fbbf24', false); }
      else if (id === 'acc_heart') { g.beginPath(); g.moveTo(16, 28); g.bezierCurveTo(1, 17, 5, 3, 16, 10); g.bezierCurveTo(27, 3, 31, 17, 16, 28); g.closePath(); g.fillStyle = cc; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.5; g.stroke(); circ(g, 10, 11, 2.5, 'rgba(255,255,255,.7)', false); glowDot(g, 16, 16, 14, cc, .4); }
      else if (id === 'acc_eye') { g.beginPath(); g.moveTo(2, 16); g.quadraticCurveTo(16, 2, 30, 16); g.quadraticCurveTo(16, 30, 2, 16); g.closePath(); g.fillStyle = '#f8f4e8'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.5; g.stroke(); circ(g, 16, 16, 6, cc); circ(g, 16, 16, 3, '#000', false); g.fillStyle = '#fff'; g.fillRect(14, 13, 2, 2); }
      else if (id === 'acc_star') { const pts = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i / 10 * TAU, r = i % 2 ? 6 : 14; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); } glowDot(g, 16, 17, 16, cc, .5); poly(g, pts, cc); circ(g, 16, 17, 3, '#fef3c7', false); }
      else { poly(g, [[3, 24], [3, 9], [10, 16], [16, 5], [22, 16], [29, 9], [29, 24]], '#fbbf24'); g.fillStyle = '#b45309'; g.fillRect(3, 22, 26, 4); circ(g, 16, 6, 2.2, '#4f46e5', '#1e1b4b'); circ(g, 3, 9, 2, '#4f46e5', false); circ(g, 29, 9, 2, '#4f46e5', false); circ(g, 16, 19, 2.2, '#ef4444', false); glowDot(g, 16, 16, 16, '#fbbf24', .35); }
      break;
    }
    case 'wood': { g.save(); g.translate(16, 16); g.rotate(-.5); rrect(g, -13, -6, 24, 12, 3, '#8a5c2c'); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-12, -2, 22, 1.4); g.fillRect(-12, 2, 22, 1.4); ellipseFill(g, 11, 0, 4, 6, '#d0a060', '#7a4e2a'); g.strokeStyle = '#8a5c2c'; g.lineWidth = 1; g.beginPath(); g.ellipse(11, 0, 2, 3.5, 0, 0, TAU); g.stroke(); g.restore(); break; }
    default: circ(g, 16, 16, 9, md);
  }
}
function ellipseFill(g, x, y, rx, ry, fill, stroke) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1.2; g.stroke(); }

// ---------------- SPRITES DAS ESPADAS ----------------
const SWORD_SPR = {};
function bladeProf(sh, t, x) { // -> [meia-largura, curvatura(y)]
  const taper = (t, from, hw) => t < from ? hw : Math.max(.3, hw * (1 - t) / (1 - from) + .25);
  switch (sh) {
    case 'sword': return [taper(t, .82, 2.3), 0];
    case 'broad': return [taper(t, .78, 3.4), 0];
    case 'great': return [taper(t, .84, 4.3), 0];
    case 'gladius': return [Math.max(.4, .6 + 3.2 * Math.sin(PI * Math.pow(t, .75))), 0];
    case 'katana': return [taper(t, .9, 1.6), -2.6 * t * t];
    case 'rapier': return [taper(t, .9, 1.05), 0];
    case 'saber': return [taper(t, .72, 2.1), -3.2 * t * t];
    case 'jagged': return [taper(t, .85, 2.4) + ((x % 4 < 2) ? .9 : -.3), 0];
    case 'crystal': return [t < .3 ? 1 + t / .3 * 2.5 : t < .62 ? 3.5 : Math.max(.3, 3.5 * (1 - t) / .38 + .2), 0];
    case 'flame': return [Math.max(.4, (t < .85 ? 2.7 : 2.7 * (1 - t) / .15) + Math.sin(t * 16) * .9), 0];
    case 'needle': return [t < .94 ? .85 : .35, 0];
    case 'cleaver': return [t < .86 ? 3.9 : 3.9 * (1 - t) / .14 + 1, 0];
    case 'lance': return [t < .62 ? .9 : t < .8 ? .9 + (t - .62) / .18 * 2 : Math.max(.3, 2.9 * (1 - t) / .2 + .2), 0];
    case 'fang': return [Math.max(.4, 3.9 * Math.pow(1 - t, .9) + .2), -4.5 * t * t];
    case 'gel': return [Math.max(.5, 2.6 + Math.sin(t * 10) * 1 - t * 1.6), Math.sin(t * 6) * 1.2];
    case 'club': { const hw = t < .6 ? 1.2 + t * 1.4 : 2 + (t - .6) * 5; return [t > .93 ? hw * .6 : hw, 0]; }
  }
  return [2.2, 0];
}
function getSwordSprite(sw) {
  if (SWORD_SPR[sw.id]) return SWORD_SPR[sw.id];
  const o = sw.look, len = o.len, sh = o.sh, tier = sw.tierLevel;
  const base = hex2rgb(o.col), dark = drk(base, .45), light = lit(base, .38), edge = lit(base, .72);
  const gcol = o.glow ? hex2rgb(o.glow) : null;
  let c, g, ph;
  if (sh === 'scythe') {
    ph = 15; c = mk(len + 6, 32); g = c.getContext('2d');
    g.fillStyle = rgbs(...drk(base, .55)); g.fillRect(0, ph - 1, len - 8, 2.4); g.fillStyle = rgbs(...lit(drk(base, .55), .25)); g.fillRect(0, ph - 1, len - 8, 1);
    g.fillStyle = '#d4b24c'; g.fillRect(8, ph - 1.5, 2, 3.4);
    g.beginPath(); g.moveTo(len - 12, ph + 1); g.bezierCurveTo(len - 12, 6, len - 4, 0, len + 3, 5); g.bezierCurveTo(len - 5, 5, len - 9, 10, len - 7, ph + 1); g.closePath();
    g.fillStyle = rgbs(...base); g.fill(); g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = rgbs(...edge); g.lineWidth = 1; g.beginPath(); g.moveTo(len - 11, 10); g.bezierCurveTo(len - 10, 5, len - 4, 2, len + 2, 5); g.stroke();
    if (gcol) { g.fillStyle = rgbs(...gcol, .6); g.fillRect(len - 6, 5, 2, 2); }
  } else {
    const HH = 24; ph = 12; c = mk(len + 4, HH); g = c.getContext('2d');
    const px = (x, y, col, a) => { g.fillStyle = a === undefined ? rgbs(col[0], col[1], col[2]) : rgbs(col[0], col[1], col[2], a); g.fillRect(x, y, 1, 1); };
    const grip = o.grip ? hex2rgb(o.grip) : (tier >= 4 ? [40, 34, 56] : [92, 60, 36]);
    const metal = tier >= 4 ? [230, 180, 34] : tier >= 3 ? [196, 200, 214] : tier >= 2 ? [160, 168, 184] : drk(base, .2);
    const gw = o.gw || (sh === 'great' ? 5 : sh === 'broad' || sh === 'cleaver' ? 4 : sh === 'katana' ? 2 : sh === 'rapier' ? 4 : sh === 'club' ? 0 : sh === 'needle' ? 2 : 3);
    let bs = 7;
    if (sh === 'club') bs = 6; if (sh === 'lance') bs = 5;
    // cabo
    for (let x = 1; x < bs - 2; x++) for (let y = -1; y <= 1; y++) px(x, ph + y, (x % 2) ? grip : lit(grip, .2));
    px(0, ph, metal); px(0, ph - 1, drk(metal, .2)); px(0, ph + 1, drk(metal, .3)); px(1, ph - 2, metal); px(1, ph + 2, drk(metal, .3));
    // guarda
    if (gw > 0) {
      for (let y = -gw; y <= gw; y++) { const cc = Math.abs(y) > gw - 1 ? drk(metal, .25) : metal; px(bs - 2, ph + y, cc); px(bs - 1, ph + y, y < 0 ? lit(metal, .25) : drk(metal, .15)); }
      if (sh === 'rapier') for (let k = 1; k <= 3; k++) { px(bs - 3 - k + 1, ph - gw - 0, metal); px(bs - 3 - k + 1, ph + gw, metal); }
      if (o.gem) { const gc = hex2rgb(o.gem); px(bs - 2, ph, gc); px(bs - 1, ph, lit(gc, .5)); px(bs - 2, ph - 1, drk(gc, .2)); px(bs - 1, ph + 1, drk(gc, .2)); }
    }
    const bl = len - bs;
    for (let i = 0; i < bl; i++) {
      const x = bs + i, t = i / (bl - 1), [hw, bend] = bladeProf(sh, t, i);
      const ext = Math.ceil(hw + Math.abs(bend)) + 1;
      for (let dy = -ext; dy <= ext; dy++) {
        const rel = dy - bend; if (Math.abs(rel) > hw) continue;
        let col;
        const wood = sh === 'lance' && t < .62;
        if (wood) col = (rel < 0) ? lit(grip, .15) : grip;
        else if (rel < -hw + 1.15) col = (sh === 'katana' && rel > 0) ? mid(base, dark) : light;
        else if (rel > hw - 1.15) col = (sh === 'katana') ? lit(dark, .1) : dark;
        else col = base;
        if (!wood && Math.abs(rel) < .6 && hw > 1.8) col = drk(base, .22);
        if (!wood && i === bl - 1) col = edge;
        if (!wood && (sh === 'club') && ((i + dy) % 5 === 0) && hw > 2.5) col = dark;
        px(x, ph + Math.round(dy), col);
      }
      // brilho central / runas
      if (gcol && !(sh === 'lance' && t < .62) && hw > 1.4 && ((i % 5 === 2) || (tier >= 4 && i % 3 === 0))) px(x, ph + Math.round(bend), gcol);
    }
    if (gcol && tier >= 3) { const tx = len - 2; px(tx, ph + Math.round(bladeProf(sh, 1, bl)[1]), lit(gcol, .6)); }
    if (sh === 'jagged' && o.serr) { /* serrilha já no perfil */ }
    if (sh === 'cleaver') { for (let dy = -1; dy <= 0; dy++) for (let dx = 0; dx < 2; dx++) { g.clearRect(bs + 8 + dx, ph + dy - 1, 1, 1); } }
    if (o.deco === 'spines') for (let i = 4; i < bl - 2; i += 4) { px(bs + i, ph - 2, light); px(bs + i + 1, ph + 2, light); }
    if (o.deco === 'drip') for (let i = 6; i < bl - 3; i += 7) { px(bs + i, ph + 3, base, .7); }
  }
  // contorno escuro
  const oc = mk(c.width, c.height), og = oc.getContext('2d'); og.drawImage(c, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = 'rgba(8,6,14,.95)'; og.fillRect(0, 0, oc.width, oc.height);
  const fin = mk(c.width + 2, c.height + 2), fg = fin.getContext('2d');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) fg.drawImage(oc, dx, dy);
  fg.drawImage(c, 1, 1);
  const res = { c: fin, w: fin.width, h: fin.height, ox: 1 + 3, oy: 1 + ph, len, glow: o.glow || null };
  SWORD_SPR[sw.id] = res; return res;
}
function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; }

// ---------------- ÍCONES (canvas 48x48 -> data URL) ----------------
function iconCanvas(id) {
  if (_icoCache[id]) return _icoCache[id];
  const it = IT[id]; const c = mk(48, 48), g = c.getContext('2d');
  if (!it) { _icoCache[id] = c; return c; }
  if (it.type === 'sword') {
    const sw = it.sw, spr = getSwordSprite(sw), tcol = TIERS[sw.tierLevel].col;
    glowDot(g, 24, 24, 24, tcol, .28);
    if (sw.look.glow) glowDot(g, 24, 24, 20, sw.look.glow, .35);
    g.save(); g.translate(24, 24); g.rotate(-PI / 4);
    const sc = clamp(40 / (.707 * spr.w + 7), .7, 1.9); g.scale(sc, sc);
    g.imageSmoothingEnabled = false; g.drawImage(spr.c, -spr.w / 2, -spr.h / 2); g.restore();
  } else {
    g.scale(1.5, 1.5); drawIconSpec(g, it.ic || ['x'], it);
  }
  _icoCache[id] = c; return c;
}
function iconURL(id) { return _urlCache[id] || (_urlCache[id] = iconCanvas(id).toDataURL()); }
