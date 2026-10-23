#!/usr/bin/env node
'use strict';
// Folha de contato das espadas novas (Tiers 7–10) — renderiza os sprites reais do jogo em Node.
//   node dev/art_sheet.js                 -> espadas_t7_10.png (na pasta atual)
//   node dev/art_sheet.js out.png 3       -> saída e escala
// Usa @napi-rs/canvas só para o preview (o jogo em si não tem dependências).
const fs = require('fs'), path = require('path'), vm = require('vm');
let Canvas;
for (const p of ['@napi-rs/canvas', '/tmp/canvas/node_modules/@napi-rs/canvas']) { try { Canvas = require(p); break; } catch (e) { } }
if (!Canvas) { console.error('npm i @napi-rs/canvas (só para gerar a folha de contato)'); process.exit(1); }
const { createCanvas, registerFont } = Canvas;
const ROOT = path.join(__dirname, '..');

function loadGame() {
  const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort()
    .filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));
  let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
  code += `\n;globalThis.__api = { SWORDS, IT, RECIPES, TIERS, ED, FX, FX2, TIERS2: TIERS, getSwordSprite, ART2, SWORD_ART2: ART2, hex2rgb };`;
  const mkEl = () => createCanvas(1, 1);
  const ctx = {
    console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON,
    performance: { now: () => Date.now() }, ImageData: function () { },
    document: { createElement: (t) => t === 'canvas' ? mkEl() : { getContext: () => ({}), width: 0, height: 0, style: {} }, getElementById: () => null, head: { appendChild() { } }, createTextNode: () => ({}) },
    window: { addEventListener() { } }, localStorage: {},
  };
  ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.__api;
}

const A = loadGame();
const OUT = process.argv[2] || 'espadas_t7_10.png';
const SC = +(process.argv[3] || 3);
const NEW = A.SWORDS.filter(s => s.num > 120);
const TIERS_NEW = [7, 8, 9, 10];
const COLS = 10;
const CW = 250, CH = 146, PAD = 26, HEAD = 64, TITLE = 92;

const rows = Math.ceil(NEW.length / COLS);
const W = PAD * 2 + COLS * CW, H = TITLE + TIERS_NEW.length * HEAD + rows * CH + PAD;
const cv = createCanvas(W, H), g = cv.getContext('2d');
// fundo slate com textura de pixels
g.fillStyle = '#59637d'; g.fillRect(0, 0, W, H);
for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
  if (h % 11 === 0) { g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(x, y, 4, 4); }
  if (h % 17 === 0) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(x, y, 4, 4); }
}
g.fillStyle = '#f3f6ff'; g.font = 'bold 34px sans-serif'; g.textBaseline = 'middle';
g.fillText('80 ESPADAS NOVAS — TIERS 7 a 10', PAD, 44);
g.fillStyle = '#c9d4ee'; g.font = '16px sans-serif';
g.fillText('arte pintada pixel a pixel (1 px do sprite = 1 px do mundo) · cada espada tem silhueta, guarda, cabo e efeitos exclusivos', PAD, 74);

let y0 = TITLE;
for (const t of TIERS_NEW) {
  const list = NEW.filter(s => s.tierLevel === t), T = A.TIERS[t];
  g.fillStyle = 'rgba(10,14,26,.35)'; g.fillRect(PAD, y0, W - PAD * 2, 30);
  g.fillStyle = T.col; g.fillRect(PAD, y0, 6, 30);
  g.fillStyle = T.col; g.font = 'bold 19px sans-serif'; g.fillText('TIER ' + t + ' · ' + T.n.replace(/^Tier \d+: /, ''), PAD + 16, y0 + 16);
  g.fillStyle = '#dfe6ff'; g.font = '14px sans-serif'; g.fillText(T.mech, PAD + 360, y0 + 16);
  y0 += HEAD - 14;
  for (let i = 0; i < list.length; i++) {
    const sw = list[i], cx = PAD + (i % COLS) * CW, cy = y0 + Math.floor(i / COLS) * CH;
    const spr = A.getSwordSprite(sw);
    // moldura
    g.fillStyle = 'rgba(12,18,34,.45)'; g.fillRect(cx + 6, cy + 4, CW - 12, CH - 12);
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.strokeRect(cx + 6.5, cy + 4.5, CW - 13, CH - 13);
    const sw2 = spr.w * SC, sh2 = spr.h * SC;
    const px = cx + (CW - sw2) / 2, py = cy + (CH - sh2) / 2 - 14;
    g.imageSmoothingEnabled = false;
    g.drawImage(spr.c, px, py, sw2, sh2);
    g.fillStyle = 'rgba(8,12,22,.55)'; g.fillRect(cx + 6, cy + CH - 34, CW - 12, 22);
    g.fillStyle = '#eef3ff'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
    g.fillText(String(sw.num).padStart(3, '0') + ' · ' + sw.swordName, cx + CW / 2, cy + CH - 22);
    g.textAlign = 'left';
  }
  y0 += Math.ceil(list.length / COLS) * CH;
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, cv.toBuffer('image/png'));
console.log('OK', OUT, W + 'x' + H, '| espadas:', NEW.length);
