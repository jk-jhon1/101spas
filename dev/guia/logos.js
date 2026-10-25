'use strict';
// Quatro conceitos de logo para "ESPADAS DO DESTINO", desenhados em pixel-art com a
// fonte 5×7 do guia e os sprites do próprio jogo. Gera:
//   docs/img/logos/logo_1..4.png               (1600×800, com fundo)
//   docs/img/logos/logo_1..4_transparente.png  (só a marca, fundo transparente)
//   docs/img/logos/comparacao.png              (folha 2×2 para escolher)
// Uso: node dev/guia/logos.js
const fs = require('fs'), path = require('path');
const { createCanvas } = require(path.join(__dirname, '..', 'pdf', 'node_modules', '@napi-rs', 'canvas'));
const { X } = require('./game');
const A = require('./art');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'img', 'logos');
fs.mkdirSync(OUT, { recursive: true });

const W = 1600, H = 800;
// fonte do guia + acentos (para os textos em português)
const F = Object.assign({}, A.pixelFont, {
  À: A.pixelFont.A, Á: A.pixelFont.A, Â: A.pixelFont.A, Ã: A.pixelFont.A,
  É: A.pixelFont.E, Ê: A.pixelFont.E, Í: A.pixelFont.I, Ó: A.pixelFont.O, Ô: A.pixelFont.O, Õ: A.pixelFont.O,
  Ú: A.pixelFont.U, Ç: '01110,10001,10000,10000,10000,10001,01111',
});
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const textW = (t, s, gap = 1) => ([...String(t).toUpperCase()].length * (5 + gap) - gap) * s;
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

// ---------- texto em pixel ----------
function glyphs(g, text, x, y, s, o = {}) {
  const gap = o.gap === undefined ? 1 : o.gap;
  const col = typeof o.color === 'function' ? o.color : () => o.color || '#ffffff';
  let cx = x;
  for (const ch of [...String(text).toUpperCase()]) {
    const rows = (F[ch] || F[' ']).split(',');
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (rows[r][c] !== '1') continue;
      g.fillStyle = col(r, c, ch);
      g.fillRect(Math.round(cx + c * s), Math.round(y + r * s), Math.ceil(s), Math.ceil(s));
    }
    cx += (5 + gap) * s;
  }
  return cx;
}
// mesmo desenho, mas só montando o caminho (para preencher com gradiente suave)
function glyphsPath(g, text, x, y, s, gap = 1) {
  let cx = x;
  for (const ch of [...String(text).toUpperCase()]) {
    const rows = (F[ch] || F[' ']).split(',');
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (rows[r][c] !== '1') continue;
      g.rect(Math.round(cx + c * s), Math.round(y + r * s), Math.ceil(s), Math.ceil(s));
    }
    cx += (5 + gap) * s;
  }
  return cx;
}
// título com contorno, extrusão (sólida) e, opcional, um brilho suave de fundo
function title(g, text, x, y, s, o = {}) {
  // sombra suave (dá profundidade sem engolir os vazados das letras)
  if (o.shadow !== false) {
    g.save();
    g.shadowColor = o.shadowColor || 'rgba(14,7,0,.85)';
    g.shadowBlur = o.shadowBlur === undefined ? 6 : o.shadowBlur;
    g.shadowOffsetX = o.shadowX === undefined ? Math.round(s * .30) : o.shadowX;
    g.shadowOffsetY = o.shadowY === undefined ? Math.round(s * .34) : o.shadowY;
    glyphs(g, text, x, y, s, { color: o.shadowSolid || '#2b1802', gap: o.gap });
    g.restore();
  }
  const ext = o.extrude || 0, step = (o.step === undefined ? .12 : o.step) * s;
  for (let i = ext; i >= 1; i--) glyphs(g, text, x + i * step, y + i * step, s, { color: o.extrudeColor || '#3a2708', gap: o.gap });
  if (o.glow) {
    g.save(); g.shadowColor = o.glow; g.shadowBlur = o.glowBlur || s * 1.6;
    glyphs(g, text, x, y, s, { color: o.glowSolid || 'rgba(255,190,60,.55)', gap: o.gap });
    g.restore();
  }
  if (o.outline) {
    const d = Math.max(1, Math.round(s * .14));
    for (const [dx, dy] of [[-d, 0], [d, 0], [0, -d], [0, d], [-d, -d], [d, -d], [-d, d], [d, d]]) glyphs(g, text, x + dx, y + dy, s, { color: o.outline, gap: o.gap });
  }
  if (o.bevel) glyphs(g, text, x - Math.max(1, Math.round(s * .07)), y - Math.max(1, Math.round(s * .07)), s, { color: o.bevel, gap: o.gap });
  if (Array.isArray(o.color)) {
    const lg = g.createLinearGradient(0, y, 0, y + 7 * s);
    for (const [pos, col] of o.color) lg.addColorStop(pos, col);
    g.beginPath(); glyphsPath(g, text, x, y, s, o.gap === undefined ? 1 : o.gap);
    g.fillStyle = lg; g.fill();
    return x + textW(text, s, o.gap === undefined ? 1 : o.gap);
  }
  return glyphs(g, text, x, y, s, o);
}
const grad = (stops) => (r) => {
  const t = r / 6;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0] || i === stops.length - 1) {
      const [p0, c0] = stops[i - 1], [p1, c1] = stops[i];
      const k = Math.min(1, Math.max(0, (t - p0) / (p1 - p0 || 1)));
      const a = hex(c0), b = hex(c1);
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
    }
  }
  return stops[0][1];
};
// dourado em 7 faixas (uma por linha do glifo) — sombreado de pixel-art
const GOLD_ROWS = ['#ffeb96', '#ffd447', '#ffc21a', '#f9b514', '#e89b0c', '#cf7d07', '#b06605'];
const gold = (r) => GOLD_ROWS[Math.min(6, Math.max(0, Math.round(r)))];
const goldGrad = (r) => gold(r);
const NEON_ROWS = ['#e6feff', '#b3f6ff', '#8cefff', '#5fe6fb', '#35dbf6', '#1ec8e8', '#12b0cf'];
const neon = (r) => NEON_ROWS[Math.min(6, Math.max(0, Math.round(r)))];

// ---------- fundos ----------
function nebula(g, top = '#101a4a', mid = '#1b2a63', bot = '#0a0f24') {
  const bg = g.createLinearGradient(0, 0, W * .35, H);
  bg.addColorStop(0, top); bg.addColorStop(.55, mid); bg.addColorStop(1, bot);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const neb = g.createRadialGradient(W * .5, H * .42, 20, W * .5, H * .42, W * .55);
  neb.addColorStop(0, 'rgba(120,150,255,.30)'); neb.addColorStop(.5, 'rgba(70,90,200,.12)'); neb.addColorStop(1, 'rgba(10,15,40,0)');
  g.fillStyle = neb; g.fillRect(0, 0, W, H);
}
function stars(g, n = 220, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i + seed) * W, y = rnd(i + 500 + seed) * H * .95;
    const s = rnd(i + 900 + seed) < .1 ? 4 : rnd(i + 300) < .35 ? 3 : 2;
    g.fillStyle = `rgba(210,225,255,${(.2 + rnd(i + 77 + seed) * .7).toFixed(2)})`;
    g.fillRect(Math.round(x), Math.round(y), s, s);
  }
}
function vignette(g) {
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .38, W / 2, H / 2, Math.max(W, H) * .72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function sword(g, id, cx, cy, size, rot = 0, glow = null, alpha = 1) {
  const ic = X.iconCanvas(id);
  g.save();
  g.globalAlpha = alpha;
  g.translate(cx, cy); g.rotate(rot);
  g.imageSmoothingEnabled = false;
  if (glow) { g.shadowColor = glow; g.shadowBlur = size * .16; }
  g.drawImage(ic, -size / 2, -size / 2, size, size);
  g.restore();
}
// espada desenhada em pixel-art (células), para o emblema e as marcas d'água
function pixelSword(g, cx, cy, cell, rot = 0, alpha = 1) {
  const c = cell, L = 104 * c, BW = 44 * c;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.globalAlpha = alpha;
  const x0 = -BW / 2, y0 = -L / 2;
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
  const tip = y0, guard = y0 + 66 * c, base = guard + 0, pommel = y0 + 96 * c;
  // lâmina
  const rows = 66;
  for (let i = 0; i < rows; i++) {
    const k = Math.min(1, i / 9), hw = Math.max(1, Math.round(5 * k));
    const y = tip + i * c;
    // 3 tons: esquerda clara, centro aço, direita escura
    R(-hw * c, y, hw * c, c, '#eef4ff');
    R(0, y, hw * c * .55, c, '#c3d3e8');
    R(hw * c * .55, y, hw * c * .45, c, '#8fa3bb');
    R(-hw * c - c * .18, y, c * .18, c, '#6b7f97');
    R(hw * c, y, c * .18, c, '#5b6d84');
  }
  // guarda
  R(-22 * c, guard, 44 * c, 3.2 * c, '#c98c06');
  R(-22 * c, guard, 44 * c, 1.6 * c, '#ffe066');
  R(-24 * c, guard + 3.2 * c, 48 * c, 1.4 * c, '#8a5f02');
  for (const sx of [-1, 1]) { // pontas da guarda caem um pouco
    R(sx > 0 ? 20 * c : -24 * c, guard + 1.6 * c, 4 * c, 4 * c, '#e8a90a');
    R(sx > 0 ? 20 * c : -24 * c, guard + 4 * c, 4 * c, 1.4 * c, '#8a5f02');
  }
  // cabo
  R(-3.4 * c, guard + 4.6 * c, 6.8 * c, pommel - (guard + 4.6 * c), '#2b1606');
  for (let i = 0; i < 7; i++) R(-3.4 * c, guard + 5.4 * c + i * 3.4 * c, 6.8 * c, c, i % 2 ? '#4a2a0d' : '#6b3f14');
  // pomo
  const py = pommel + 1.6 * c;
  for (let dy = -4; dy <= 4; dy++) {
    const hw = (4 - Math.abs(dy)) * c;
    R(-hw, py + dy * c, hw * 2, c, dy < 0 ? '#ffe066' : '#c98c06');
  }
  g.restore();
}
function dot(g, cx, cy, r, col) {
  g.fillStyle = col;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (Math.abs(x) + Math.abs(y) <= r) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
}
function band(g, x, y, w, h, fill = 'rgba(6,9,24,.78)') {
  g.fillStyle = fill; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  g.fillStyle = '#f5b800'; g.fillRect(Math.round(x), Math.round(y), Math.round(w), 3); g.fillRect(Math.round(x), Math.round(y + h - 3), Math.round(w), 3);
}

// =====================================================================
// 1 · CLÁSSICO — dourado, duas espadas cruzadas atrás e faixa de subtítulo
// =====================================================================
function logo1(transparent) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  if (!transparent) { nebula(g); stars(g, 280, 3); }
  // brilho dourado difuso atrás do título
  if (!transparent) {
    const hl = g.createRadialGradient(W / 2, 330, 40, W / 2, 330, 620);
    hl.addColorStop(0, 'rgba(255,180,50,.16)'); hl.addColorStop(.6, 'rgba(255,150,30,.05)'); hl.addColorStop(1, 'rgba(255,150,30,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
  }
  if (!transparent) {
    const sh = g.createLinearGradient(0, 60, 0, 620);
    sh.addColorStop(0, 'rgba(8,12,34,0)'); sh.addColorStop(.28, 'rgba(8,12,34,.72)'); sh.addColorStop(.78, 'rgba(8,12,34,.72)'); sh.addColorStop(1, 'rgba(8,12,34,.1)');
    g.fillStyle = sh; g.fillRect(0, 60, W, 560);
  }
  const s1 = 30, s2 = 21;
  const y1 = 148, y2 = y1 + 7 * s1 + 40;
  title(g, 'ESPADAS', (W - textW('ESPADAS', s1)) / 2, y1, s1, { color: gold, outline: '#1c1002', glow: 'rgba(255,150,10,.55)', glowBlur: 30, glowSolid: 'rgba(255,170,40,.22)' });
  title(g, 'DO DESTINO', (W - textW('DO DESTINO', s2)) / 2, y2, s2, { color: gold, outline: '#1c1002', glow: 'rgba(255,150,10,.5)', glowBlur: 24, glowSolid: 'rgba(255,170,40,.22)' });
  // filete + subtítulo entre duas espadinhas
  const ly = y2 + 7 * s2 + 74;
  const tw = textW('SANDBOX 2D PLATFORMER', 6.5, 2);
  glyphs(g, 'SANDBOX 2D PLATFORMER', W / 2 - tw / 2, ly, 6.5, { color: '#c3d4f7', gap: 2 });
  // filetes e losangos nas pontas
  const ly2 = ly + 22;
  for (const [x0, x1] of [[W / 2 - tw / 2 - 240, W / 2 - tw / 2 - 34], [W / 2 + tw / 2 + 34, W / 2 + tw / 2 + 240]]) {
    g.fillStyle = 'rgba(255,212,71,.85)'; g.fillRect(x0, ly2, x1 - x0, 3);
  }
  const diamond = (dx, dy, r, col) => { g.fillStyle = col; for (let i = -r; i <= r; i++) g.fillRect(Math.round(dx), Math.round(dy + i), 1, 1), g.fillRect(Math.round(dx + i), Math.round(dy), 1, 1); };
  diamond(W / 2 - tw / 2 - 26, ly2 + 1, 9, '#ffe066');
  diamond(W / 2 + tw / 2 + 26, ly2 + 1, 9, '#ffe066');
  // faíscas
  if (!transparent) for (let i = 0; i < 26; i++) {
    const a = rnd(i + 40) * Math.PI * 2, r = 300 + rnd(i + 80) * 340;
    const px = W / 2 + Math.cos(a) * r * 1.35, py = 360 + Math.sin(a) * r * .72;
    const sz = rnd(i + 11) < .3 ? 5 : 3;
    g.fillStyle = `rgba(255,236,170,${(.25 + rnd(i + 5) * .5).toFixed(2)})`;
    g.fillRect(Math.round(px), Math.round(py), sz, sz);
  }
  if (!transparent) vignette(g);
  return c;
}

// =====================================================================
// 2 · EMBLEMA — selo circular, espada ao centro, nome no anel externo
// =====================================================================
function logo2(transparent) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  if (!transparent) { nebula(g, '#12183f', '#20285e', '#0a0d1e'); stars(g, 210, 11); }
  // selo à esquerda
  const cx = 424, cy = 400, R = 262;
  if (!transparent) {
    const hl = g.createRadialGradient(cx, cy, 60, cx, cy, R + 220);
    hl.addColorStop(0, 'rgba(255,200,80,.20)'); hl.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
  }
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = '#0b1334'; g.fill();
  const inner = g.createRadialGradient(cx, cy - 80, 30, cx, cy, R);
  inner.addColorStop(0, 'rgba(90,125,225,.50)'); inner.addColorStop(1, 'rgba(10,16,40,.02)');
  g.fillStyle = inner; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.lineWidth = 18; g.strokeStyle = '#f5b800'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4; g.strokeStyle = '#fff2b8'; g.beginPath(); g.arc(cx, cy, R - 15, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2; g.strokeStyle = '#a97404'; g.beginPath(); g.arc(cx, cy, R - 36, 0, Math.PI * 2); g.stroke();
  if (!transparent) {
    g.save(); g.shadowColor = 'rgba(120,220,255,.85)'; g.shadowBlur = 40;
    pixelSword(g, cx, cy - 2, 3.9, -.62, 1); g.restore();
  } else pixelSword(g, cx, cy - 2, 3.9, -.62, 1);
  // losangos no aro
  for (const dy of [-1, 1]) {
    const px = cx, py = cy + dy * R, r = 13;
    g.fillStyle = '#fff2b8';
    for (let yy = -r; yy <= r; yy++) { const h = r - Math.abs(yy); g.fillRect(px - h, py + yy, h * 2 + 1, 1); }
  }
  // marca à direita
  const x0 = 748;
  const s1 = 19, s2 = 13;
  const y1 = 214;
  title(g, 'ESPADAS', x0, y1, s1, { color: gold, outline: '#1c1002', glow: 'rgba(255,150,10,.55)', glowBlur: 28, glowSolid: 'rgba(255,170,40,.22)' });
  title(g, 'DO DESTINO', x0, y1 + 7 * s1 + 30, s2, { color: gold, outline: '#1c1002', glow: 'rgba(255,150,10,.5)', glowBlur: 22, glowSolid: 'rgba(255,170,40,.22)' });
  // filete
  const ly = y1 + 7 * s1 + 30 + 7 * s2 + 74;
  g.fillStyle = 'rgba(245,184,0,.85)'; g.fillRect(x0, ly, 700, 3);
  g.fillStyle = '#ffe066';
  for (let yy = -7; yy <= 7; yy++) { const h = 7 - Math.abs(yy); g.fillRect(x0 + 700 - h, ly + 1 + yy, h * 2 + 1, 1); }
  glyphs(g, '200 ESPADAS · 94 CHEFES', x0, ly + 30, 5.5, { color: '#ffd447', gap: 1 });
  glyphs(g, 'SANDBOX 2D PLATFORMER', x0, ly + 82, 5.5, { color: '#bcd0f5', gap: 2 });
  if (!transparent) vignette(g);
  return c;
}

// =====================================================================
// 3 · TITÃ — título pesado em 3D sobre uma lâmina gigante
// =====================================================================
function logo3(transparent) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  if (!transparent) { nebula(g, '#0b1233', '#1a2a66', '#070a18'); stars(g, 200, 23); }
  if (!transparent) {
    const hl = g.createRadialGradient(W / 2, 300, 40, W / 2, 300, 640);
    hl.addColorStop(0, 'rgba(255,170,40,.20)'); hl.addColorStop(1, 'rgba(255,170,40,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
  }
  if (!transparent) {
    const sh = g.createLinearGradient(0, 70, 0, 640);
    sh.addColorStop(0, 'rgba(7,10,24,0)'); sh.addColorStop(.22, 'rgba(7,10,24,.80)'); sh.addColorStop(.84, 'rgba(7,10,24,.80)'); sh.addColorStop(1, 'rgba(7,10,24,.25)');
    g.fillStyle = sh; g.fillRect(0, 70, W, 570);
  }
  const s1 = 31, s2 = 21;
  const y1 = 146, y2 = y1 + 7 * s1 + 62;
  title(g, 'ESPADAS', (W - textW('ESPADAS', s1)) / 2, y1, s1, { color: gold, outline: '#120b01', glow: 'rgba(255,150,10,.55)', glowBlur: 30, glowSolid: 'rgba(255,170,40,.20)' });
  title(g, 'DO DESTINO', (W - textW('DO DESTINO', s2)) / 2, y2, s2, { color: gold, outline: '#120b01', glow: 'rgba(255,150,10,.5)', glowBlur: 24, glowSolid: 'rgba(255,170,40,.20)' });
  const txt = 'DO PRIMEIRO TRONCO À APOTEOSE', tw = textW(txt, 6, 2);
  const bw = tw + 110, bh = 60, by = y2 + 7 * s2 + 62;
  band(g, W / 2 - bw / 2, by, bw, bh);
  glyphs(g, txt, W / 2 - tw / 2, by + 18, 6, { color: '#ffe9a8', gap: 2 });
  if (!transparent) vignette(g);
  return c;
}

// =====================================================================
// 4 · NEON — vazio escuro, brilho ciano e moldura técnica
// =====================================================================
function logo4(transparent) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  if (!transparent) {
    g.fillStyle = '#05060f'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(90,150,255,.07)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const gl = g.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 700);
    gl.addColorStop(0, 'rgba(60,120,255,.20)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
  }
  const s1 = 29, s2 = 19;
  const y1 = 206, y2 = y1 + 7 * s1 + 26;
  // sombra deslocada (magenta/ciano) para dar volume
  g.save(); g.globalAlpha = .55;
  glyphs(g, 'ESPADAS', (W - textW('ESPADAS', s1)) / 2 - 7, y1 + 7, s1, { color: '#db2777' });
  glyphs(g, 'DO DESTINO', (W - textW('DO DESTINO', s2)) / 2 - 6, y2 + 6, s2, { color: '#db2777' });
  glyphs(g, 'ESPADAS', (W - textW('ESPADAS', s1)) / 2 + 7, y1 - 7, s1, { color: '#0ea5e9' });
  glyphs(g, 'DO DESTINO', (W - textW('DO DESTINO', s2)) / 2 + 6, y2 - 6, s2, { color: '#0ea5e9' });
  g.restore();
  title(g, 'ESPADAS', (W - textW('ESPADAS', s1)) / 2, y1, s1, { color: neon, outline: '#03151f', shadow: false, glow: 'rgba(103,232,249,.95)', glowBlur: 26, glowSolid: 'rgba(103,232,249,.5)' });
  title(g, 'DO DESTINO', (W - textW('DO DESTINO', s2)) / 2, y2, s2, { color: neon, outline: '#03151f', shadow: false, glow: 'rgba(103,232,249,.9)', glowBlur: 20, glowSolid: 'rgba(103,232,249,.5)' });
  // subtítulo
  const ly = y2 + 7 * s2 + 34;
  const tw4 = textW('SANDBOX 2D PLATFORMER', 7, 2);
  glyphs(g, 'SANDBOX 2D PLATFORMER', W / 2 - tw4 / 2, ly, 7, { color: '#a5f3fc', gap: 2 });
  g.fillStyle = 'rgba(103,232,249,.55)';
  g.fillRect(W / 2 - tw4 / 2 - 40, ly - 34, tw4 + 80, 2);
  // moldura técnica
  const m = 50, len = 96;
  g.strokeStyle = 'rgba(103,232,249,.7)'; g.lineWidth = 3;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    g.beginPath(); g.moveTo(x + sx * len, y); g.lineTo(x, y); g.lineTo(x, y + sy * len); g.stroke();
  }
  if (!transparent) vignette(g);
  return c;
}

// ---------- gera tudo ----------
const LOGOS = [
  { n: 1, name: 'Clássico dourado', make: logo1 },
  { n: 2, name: 'Emblema circular', make: logo2 },
  { n: 3, name: 'Titã em 3D', make: logo3 },
  { n: 4, name: 'Neon do Vazio', make: logo4 },
];
const files = [];
for (const L of LOGOS) {
  const solid = L.make(false), trans = L.make(true);
  const f1 = path.join(OUT, `logo_${L.n}.png`), f2 = path.join(OUT, `logo_${L.n}_transparente.png`);
  fs.writeFileSync(f1, solid.toBuffer('image/png'));
  fs.writeFileSync(f2, trans.toBuffer('image/png'));
  files.push({ ...L, f1, f2 });
}

// ---------- folha de comparação ----------
(async () => {
  const { loadImage } = require(path.join(__dirname, '..', 'pdf', 'node_modules', '@napi-rs', 'canvas'));
  const CW = 1000, CH = 500, GAP = 26, LAB = 52;
  const sheet = createCanvas(CW * 2 + GAP * 3, (CH + LAB) * 2 + GAP * 3);
  const sg = sheet.getContext('2d');
  sg.fillStyle = '#0b1020'; sg.fillRect(0, 0, sheet.width, sheet.height);
  for (const L of files) {
    const img = await loadImage(L.f1);
    const col = (L.n - 1) % 2, row = Math.floor((L.n - 1) / 2);
    const x = GAP + col * (CW + GAP), y = GAP + row * (CH + LAB + GAP);
    sg.drawImage(img, x, y, CW, CH);
    sg.strokeStyle = '#334155'; sg.lineWidth = 2; sg.strokeRect(x, y, CW, CH);
    sg.fillStyle = '#ffd447'; sg.font = 'bold 30px DejaVuBold';
    sg.fillText(`${L.n}`, x + 14, y + CH + 36);
    sg.fillStyle = '#cbd5e1'; sg.font = '28px DejaVu';
    sg.fillText(L.name, x + 46, y + CH + 36);
  }
  const fs2 = path.join(OUT, 'comparacao.png');
  fs.writeFileSync(fs2, sheet.toBuffer('image/png'));
  console.log('logos:', files.length, '| folha:', path.relative(ROOT, fs2));
  for (const L of files) console.log(' ', L.n, L.name, '→', path.relative(ROOT, L.f1), '+ transparente');
})();
