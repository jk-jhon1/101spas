'use strict';
// Arte do guia: capa pixel-art, ícones 4× (sem suavização), retratos dos chefes e folhas de contato.
// Tudo com @napi-rs/canvas; o PDF recebe PNGs já ampliados (pixels quadrados em qualquer leitor).
const fs = require('fs'), path = require('path');
const { X, createCanvas, ROOT } = require('./game.js');
const { GlobalFonts } = require(path.join(ROOT, 'dev/pdf/node_modules/@napi-rs/canvas'));

const FONT_DIR = '/usr/share/fonts/truetype/dejavu';
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'DejaVuSans.ttf'), 'DejaVu');
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'), 'DejaVuBold');
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'DejaVuSansMono.ttf'), 'DejaVuMono');

const IMG = path.join(ROOT, 'docs', 'img');
const _imgCache = {};

// ---------- fontes de pixel 5x7 (título e etiquetas) ----------
const F57 = {
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110',
  C: '01110,10001,10000,10000,10000,10001,01110', D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01110', H: '10001,10001,10001,11111,10001,10001,10001',
  I: '01110,00100,00100,00100,00100,00100,01110', J: '00111,00010,00010,00010,00010,10010,01100',
  K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,11001,10101,10011,10001,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110', P: '11110,10001,10001,11110,10000,10000,10000',
  Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100',
  U: '10001,10001,10001,10001,10001,10001,01110', V: '10001,10001,10001,10001,10001,01010,00100',
  W: '10001,10001,10001,10101,10101,11011,10001', X: '10001,10001,01010,00100,01010,10001,10001',
  Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
  0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110',
  2: '01110,10001,00001,00110,01000,10000,11111', 3: '11110,00001,00001,01110,00001,00001,11110',
  4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000',
  8: '01110,10001,10001,01110,10001,10001,01110', 9: '01110,10001,10001,01111,00001,00010,01100',
  ' ': '00000,00000,00000,00000,00000,00000,00000', '·': '00000,00000,00000,00100,00000,00000,00000',
  '-': '00000,00000,00000,11111,00000,00000,00000', '×': '00000,10001,01010,00100,01010,10001,00000',
  ':': '00000,00100,00000,00000,00000,00100,00000', '.': '00000,00000,00000,00000,00000,00100,00100',
  '*': '00000,01010,00100,11111,00100,01010,00000', '/': '00001,00010,00010,00100,01000,01000,10000',
};

function pixelText(g, text, x, y, px, color, o = {}) {
  const glyphs = [...String(text).toUpperCase()];
  const gap = o.gap === undefined ? 1 : o.gap;
  let cx = x;
  for (const ch of glyphs) {
    const rows = (F57[ch] || F57[' ']).split(',');
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (rows[r][c] !== '1') continue;
      if (o.shadow) { g.fillStyle = o.shadow; g.fillRect(Math.round(cx + c * px + px * .62), Math.round(y + r * px + px * .62), px, px); }
      if (o.outline) { g.fillStyle = o.outline; g.fillRect(Math.round(cx + c * px - px * .5), Math.round(y + r * px), px, px); g.fillRect(Math.round(cx + c * px + px * .5), Math.round(y + r * px), px, px); g.fillRect(Math.round(cx + c * px), Math.round(y + r * px - px * .5), px, px); g.fillRect(Math.round(cx + c * px), Math.round(y + r * px + px * .5), px, px); }
      g.fillStyle = color; g.fillRect(Math.round(cx + c * px), Math.round(y + r * px), px, px);
    }
    cx += (5 + gap) * px;
  }
  return cx;
}
const pixelWidth = (text, px, gap = 1) => ([...String(text).toUpperCase()].length * (5 + gap) - gap) * px;

// ---------- imagens do jogo ----------
// O canvas decodifica imagens de forma assíncrona: as capturas usadas no guia são carregadas
// antes de montar as páginas (await preload([...])) e ficam no cache.
async function preload(names) {
  const lib = require(path.join(ROOT, 'dev/pdf/node_modules/@napi-rs/canvas'));
  for (const name of names) {
    if (_imgCache[name] !== undefined) continue;
    const p = path.join(IMG, name);
    if (!fs.existsSync(p)) { _imgCache[name] = null; continue; }
    try { _imgCache[name] = await lib.loadImage(p); } catch (e) { _imgCache[name] = null; }
  }
}
function loadImg(name) { return _imgCache[name] === undefined ? null : _imgCache[name]; }
// buffer do arquivo (para o PDFKit, que só aceita caminho, Buffer ou objeto de imagem dele)
function shot(name) {
  const p = path.join(IMG, name);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}
const _pngCache = {};
function upscale(canvas, s) {
  const c = createCanvas(Math.round(canvas.width * s), Math.round(canvas.height * s)), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(canvas, 0, 0, c.width, c.height);
  return c;
}
function pngOf(canvas, s = 1) {
  const c = s === 1 ? canvas : upscale(canvas, s);
  return c.toBuffer('image/png');
}
const iconPNG = (id, scale = 4) => icon(id, scale);
// (mantido simples: ícone 32px ampliado `scale` vezes)
function icon(id, scale = 4) {
  const key = 'ic' + id + '@' + scale;
  if (_pngCache[key]) return _pngCache[key];
  let c; try { c = X.iconCanvas(id); } catch (e) { c = createCanvas(32, 32); }
  const out = createCanvas(32 * scale, 32 * scale), g = out.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, out.width, out.height);
  return (_pngCache[key] = out.toBuffer('image/png'));
}
function bxSpritePNG(id, scale = 2, frame = 0, variant = 0) {
  const key = 'bx' + id + '@' + scale + '|' + frame + '|' + variant;
  if (_pngCache[key]) return _pngCache[key];
  const s = X.bxSpr(id, frame, variant);
  const out = createCanvas(Math.round(s.w * scale), Math.round(s.h * scale)), g = out.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(s.c, 0, 0, out.width, out.height);
  return (_pngCache[key] = { png: out.toBuffer('image/png'), w: out.width, h: out.height });
}
function classicSpritePNG(key, scale = 2) {
  const k = 'cl' + key + '@' + scale;
  if (_pngCache[k]) return _pngCache[k];
  const s = X.bossSpr(key, 0, 0);
  const out = createCanvas(Math.round(s.w * scale), Math.round(s.h * scale)), g = out.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(s.c, 0, 0, out.width, out.height);
  return (_pngCache[k] = { png: out.toBuffer('image/png'), w: out.width, h: out.height });
}

// céu pixelado atrás do retrato do chefe (como no jogo)
function skyBox(w, h, seed = 1) {
  const c = createCanvas(w, h), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#4a86e8'); grd.addColorStop(.55, '#79b0f5'); grd.addColorStop(1, '#bfe0ff');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  const rnd = (i) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 7; i++) {
    const bx = Math.round(rnd(i) * w), by = Math.round(rnd(i + 20) * h * .6 + h * .08), bw = Math.round(w * (.16 + rnd(i + 5) * .18)), bh = Math.round(bw * .42);
    g.fillStyle = 'rgba(255,255,255,.92)';
    for (let y = 0; y < bh; y++) {
      const ww = Math.round(bw * Math.sin(Math.PI * (y + 1) / (bh + 1)) * .9 + bw * .25);
      g.fillRect(Math.round(bx - ww / 2), by + y, ww, 1);
    }
  }
  // colina de grama no rodapé
  g.fillStyle = '#3f9a4a'; g.fillRect(0, h - 8, w, 8);
  g.fillStyle = '#57b85c';
  for (let x = 0; x < w; x += 6) g.fillRect(x, h - 10 - ((x * 7) % 3), 6, 4);
  g.fillStyle = '#6b4a2a'; g.fillRect(0, h - 4, w, 4);
  return c;
}

function bossPortrait(kind, id, w, h, o = {}) {
  const key = 'p' + kind + id + w + h;
  if (_pngCache[key]) return _pngCache[key];
  const c = skyBox(w, h, id.length * 7 + 3), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const pad = o.pad === undefined ? 8 : o.pad;
  let spr, sw, sh;
  if (kind === 'classic') { spr = X.bossSpr(id, 0, 0); sw = spr.w; sh = spr.h; }
  else { spr = X.bxSpr(id, 0, 0); sw = spr.w; sh = spr.h; }
  const sc = Math.min((w - pad * 2) / sw, (h - pad * 2 - 6) / sh);
  const dw = Math.round(sw * sc), dh = Math.round(sh * sc);
  // sombra no chão
  g.fillStyle = 'rgba(8,12,34,.32)'; g.fillRect(Math.round(w / 2 - dw * .3), h - 9, Math.round(dw * .6), 2);
  g.drawImage(spr.c, Math.round((w - dw) / 2), Math.round(h - 8 - dh), dw, dh);
  return (_pngCache[key] = { png: c.toBuffer('image/png'), w, h });
}

// mapa do mundo inteiro, 2 blocos por pixel (usado na seção 1.5)
function worldMap(seed = 24680, half = 2) {
  const wd = new X.World(1400, 480, seed);
  const g0 = X.genWorld(wd, seed); let r = g0.next(); while (!r.done) r = g0.next();
  const w = Math.round(wd.w / half), h = Math.round(wd.h / half);
  const c = createCanvas(w, h), g = c.getContext('2d');
  const skyTop = [124, 192, 247], skyBot = [196, 224, 246];
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = px * half, y = py * half, i = wd.idx(x, y);
      const id = wd.t[i], lq = wd.lq[i], lt = wd.lt[i];
      let col;
      if (lt === 1 && lq > 0) col = y > 300 ? '#1e40af' : '#2563eb';
      else if (lt === 2 && lq > 0) col = '#f97316';
      else if (id !== 0) col = (X.TD[id] && X.TD[id].c && X.TD[id].c[0]) || '#555';
      else if (y < wd.surf[x]) {
        const t = Math.max(0, Math.min(1, y / Math.max(1, wd.surf[x])));
        col = 'rgb(' + Math.round(skyTop[0] + (skyBot[0] - skyTop[0]) * t) + ',' + Math.round(skyTop[1] + (skyBot[1] - skyTop[1]) * t) + ',' + Math.round(skyTop[2] + (skyBot[2] - skyTop[2]) * t) + ')';
      } else col = wd.wl[i] ? '#241b12' : '#0a0c14';
      g.fillStyle = col; g.fillRect(px, py, 1, 1);
    }
  }
  // escurece com a profundidade (como no mapa do jogo)
  const grd = g.createLinearGradient(0, 90, 0, h);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(.45, 'rgba(0,0,0,.10)'); grd.addColorStop(1, 'rgba(0,0,0,.34)');
  g.fillStyle = grd; g.fillRect(0, 90, w, h - 90);
  return c.toBuffer('image/png');
}

// captura do jogo com os elementos da interface numerados (seção 1.4)
function hudShot(name = '02_combate.png') {
  const img = loadImg(name); if (!img) return null;
  const w = img.width, h = img.height;
  const c = createCanvas(w, h), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, w, h);
  const marks = [
    [1, 950, 14], [2, 812, 76], [3, 1104, 70], [4, 940, 136],
    [5, 522, 646], [6, 390, 686], [7, 1135, 690],
  ];
  for (const [n, x, y] of marks) {
    g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2);
    g.fillStyle = 'rgba(251,191,36,.96)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = '#1e3a8a'; g.stroke();
    g.fillStyle = '#1e3a8a'; g.font = 'bold 18px DejaVuBold'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(n), x, y + 1);
  }
  return c.toBuffer('image/png');
}

// grade das espadas (visão geral), com o número embaixo — como na página 21 do guia antigo
function swordGrid(swords, cols = 20, cell = 46, numH = 12) {
  const rows = Math.ceil(swords.length / cols);
  const c = createCanvas(cols * cell, rows * (cell + numH) + 6), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  swords.forEach((s, i) => {
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + numH);
    const ic = X.iconCanvas(s.id);
    g.drawImage(ic, x + 2, y + 2, cell - 4, cell - 4);
    g.font = '9px DejaVuMono'; g.fillStyle = X.TIERS[s.tierLevel].col; g.textAlign = 'center';
    g.fillText(String(s.num).padStart(3, '0'), x + cell / 2, y + cell + 9);
  });
  return c;
}

// ---------- capa ----------
function cover(o) {
  const W = 1240, H = 1754;                     // A4 a 150 dpi
  const c = createCanvas(W, H), g = c.getContext('2d');
  // céu noturno com nebulosa
  const bg = g.createLinearGradient(0, 0, W * .3, H);
  bg.addColorStop(0, '#101a4a'); bg.addColorStop(.45, '#1b2a63'); bg.addColorStop(.72, '#2a3a78'); bg.addColorStop(1, '#3d3f86');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const neb = g.createRadialGradient(W * .52, H * .3, 20, W * .52, H * .3, W * .62);
  neb.addColorStop(0, 'rgba(120,150,255,.36)'); neb.addColorStop(.45, 'rgba(90,110,220,.16)'); neb.addColorStop(1, 'rgba(20,20,60,0)');
  g.fillStyle = neb; g.fillRect(0, 0, W, H);
  const rnd = (i) => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 260; i++) {
    const x = rnd(i) * W, y = rnd(i + 500) * H * .82, s = rnd(i + 900) < .12 ? 3 : rnd(i + 300) < .4 ? 2 : 1;
    g.fillStyle = 'rgba(210,225,255,' + (.25 + rnd(i + 77) * .65).toFixed(2) + ')'; g.fillRect(Math.round(x), Math.round(y), s, s);
  }

  // título em pixel-art (como na capa original)
  g.textAlign = 'left';
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(120,160,255,' + (.05 - i * .008) + ')'; g.fillRect(0, 96 + i, W, 1); }
  pixelText(g, 'GUIA COMPLETO DO JOGO', Math.round((W - pixelWidth('GUIA COMPLETO DO JOGO', 5, 2)) / 2), 150, 5, '#ffd447', {});
  const t1 = 'ESPADAS', t2 = 'DO DESTINO';
  const fitPx = (text, maxW) => Math.max(4, Math.floor(maxW / ((5 + 1) * [...text].length - 1)));
  const glow = (text, y, maxW) => {
    const px = fitPx(text, maxW);
    const x0 = Math.round((W - pixelWidth(text, px, 1)) / 2);
    for (const [dx, dy, col] of [[-4, 0, 'rgba(255,170,20,.16)'], [4, 0, 'rgba(255,170,20,.16)'], [0, -4, 'rgba(255,170,20,.16)'], [0, 4, 'rgba(255,170,20,.16)'], [-8, -8, 'rgba(255,140,0,.10)'], [8, 8, 'rgba(255,140,0,.10)']]) {
      pixelText(g, text, x0 + dx, y + dy, px, col, {});
    }
    pixelText(g, text, x0, y, px, '#ffc21a', { shadow: '#8a4600', outline: '#5c2a00' });
    return 7 * px;
  };
  const h1 = glow(t1, 226, W - 260);
  const h2 = glow(t2, 226 + h1 + 26, W - 200);
  pixelText(g, 'SANDBOX 2D PLATFORMER', Math.round((W - pixelWidth('SANDBOX 2D PLATFORMER', 5, 3)) / 2), 226 + h1 + h2 + 82, 5, '#9db9f2', {});

  // barras dos 10 tiers
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => o.tiers[k].col);
  const bw = Math.round(W * .52 / cols.length) - 12;
  let bx = Math.round((W - (bw + 12) * cols.length) / 2);
  const barY = 226 + h1 + h2 + 118;
  cols.forEach(col => { g.fillStyle = col; g.fillRect(bx, barY, bw, 14); bx += bw + 12; });

  // fileira de espadas (amostra dos 10 tiers)
  const row = o.swordRow;
  const cell = 104, y0 = barY + 40;
  let x0 = Math.round((W - cell * row.length) / 2);
  row.forEach(s => { const ic = X.iconCanvas(s.id); g.drawImage(ic, x0, y0, cell, cell); x0 += cell; });

  // moldura da capa: dentro dela vai a arte oficial da logo (antes era o print do jogo)
  const fx = 92, fy = y0 + cell + 34, fw = W - 184, fh = Math.round(fw * .56);
  g.fillStyle = '#f5c445'; g.fillRect(fx - 8, fy - 8, fw + 16, fh + 16);
  g.fillStyle = '#c9971d'; g.fillRect(fx - 8, fy + fh + 6, fw + 16, 4);
  const logoImg = loadImg(o.logo || 'logo.jpg');
  if (logoImg) {
    g.save();
    g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // a arte preenche a moldura inteira (corte centralizado, sem faixas sobrando)
    const sc = Math.max(fw / logoImg.width, fh / logoImg.height);
    const dw = logoImg.width * sc, dh = logoImg.height * sc;
    g.drawImage(logoImg, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
    // vinheta leve nas bordas para assentar a arte na capa
    const vg = g.createLinearGradient(0, fy, 0, fy + fh);
    vg.addColorStop(0, 'rgba(6,4,9,.35)'); vg.addColorStop(.22, 'rgba(6,4,9,0)');
    vg.addColorStop(.78, 'rgba(6,4,9,0)'); vg.addColorStop(1, 'rgba(6,4,9,.30)');
    g.fillStyle = vg; g.fillRect(fx, fy, fw, fh);
    const hg = g.createLinearGradient(fx, 0, fx + fw, 0);
    hg.addColorStop(0, 'rgba(6,4,9,.34)'); hg.addColorStop(.14, 'rgba(6,4,9,0)');
    hg.addColorStop(.86, 'rgba(6,4,9,0)'); hg.addColorStop(1, 'rgba(6,4,9,.34)');
    g.fillStyle = hg; g.fillRect(fx, fy, fw, fh);
    g.strokeStyle = 'rgba(255,235,170,.35)'; g.lineWidth = 2; g.strokeRect(fx + 1, fy + 1, fw - 2, fh - 2);
    g.restore();
  } else { g.fillStyle = '#0b1020'; g.fillRect(fx, fy, fw, fh); }

  // caixas de números
  const stats = o.stats, n = stats.length, gap = 22, sw = Math.round((W - 184 - gap * (n - 1)) / n), sy = fy + fh + 40;
  stats.forEach(([num, label], i) => {
    const sx = 92 + i * (sw + gap);
    g.fillStyle = '#1b2c6b'; g.fillRect(sx, sy, sw, 118);
    g.fillStyle = '#2f4590'; g.fillRect(sx, sy, sw, 3); g.fillRect(sx, sy + 115, sw, 3);
    g.fillStyle = '#ffc21a'; g.font = 'bold 46px DejaVuBold'; g.textAlign = 'center'; g.fillText(String(num), sx + sw / 2, sy + 60);
    g.fillStyle = '#c9d6ff'; g.font = '19px DejaVu'; g.fillText(label, sx + sw / 2, sy + 94);
    g.textAlign = 'left';
  });

  // crédito do criador
  g.textAlign = 'center';
  if (o.credit) {
    const spaced = (t, px) => [...t.toUpperCase()].join(' ');
    g.font = '14px DejaVuMono'; g.fillStyle = '#9fb0e6';
    g.fillText(spaced('criado e desenvolvido por', 0), W / 2, H - 112);
    g.font = 'bold 25px DejaVuBold'; g.fillStyle = '#ffd447';
    g.fillText(String(o.credit).toUpperCase(), W / 2, H - 86);
  }
  // rodapé
  g.fillStyle = '#ffc21a'; g.fillRect(0, H - 8, W, 8);
  g.font = '15px DejaVu'; g.fillStyle = '#a9b8e6'; g.textAlign = 'center';
  g.fillText(o.tagline, W / 2, H - 56);
  g.font = '14px DejaVuMono'; g.fillStyle = '#7f8fbf';
  g.fillText(o.gen, W / 2, H - 30);
  g.textAlign = 'left';
  return c.toBuffer('image/png');
}

module.exports = { pixelText, pixelWidth, icon, iconPNG, bxSpritePNG, classicSpritePNG, bossPortrait, swordGrid, cover, loadImg, shot, preload, skyBox, pixelFont: F57, worldMap, hudShot };
