'use strict';
// Carrega os módulos do jogo no Node (com canvas de verdade) e expõe o que o guia precisa:
// ícones (iconCanvas), sprites dos chefes (bxSpr / bossSpr), dados (IT, SWORDS, BXLIST, ACH_LIST…).
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
let createCanvas;
try { ({ createCanvas } = require(path.join(ROOT, 'dev/pdf/node_modules/@napi-rs/canvas'))); }
catch (e) { console.error('falta @napi-rs/canvas: rode  npm --prefix dev/pdf install'); process.exit(2); }

const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort().filter(f => !/^(1[4-9]|2\d)_/.test(f));
let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__x = { IT, RECIPES, SWORDS, BXLIST, BX, BX_ACTS, ACH_LIST, ACH_CATS, ACH_RAR, ED,
  GORES, GARMS, GACCS, GPICKS, GFAM, GFAM_KEYS, TD, T, TIERS, STATION_NAME, iconCanvas, bxSpr, bossSpr, bossPart,
  G, SHOPS, NPC_DEF, GARM_ST, GARM_TXT, BOSSART, bossWarm, World, genWorld, TD, BIO_NAMES, Y_SKY, Y_DEEP, Y_HELL };`;
const mkCanvas = (w, h) => { const c = createCanvas(48, 48); if (w) c.width = w; if (h) c.height = h; return c; };
const stubEl = () => ({
  addEventListener() { }, appendChild() { }, style: {}, dataset: {}, classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
  getContext: () => mkCanvas(48, 48).getContext('2d'), width: 0, height: 0, innerHTML: '', textContent: '',
});
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, parseInt, parseFloat, isNaN,
  performance: { now: () => Date.now() }, requestAnimationFrame: () => 0, setTimeout, clearTimeout,
  addEventListener() { }, innerWidth: 1280, innerHeight: 720, location: { href: 'http://x/' },
  navigator: { userAgent: 'node' }, localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
  ImageData: function (w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); },
  document: { createElement: (t) => t === 'canvas' ? mkCanvas(48, 48) : stubEl(), getElementById: () => stubEl(), addEventListener() { }, body: stubEl(), documentElement: stubEl(), head: { appendChild() { } } },
  createCanvas,
};
ctx.globalThis = ctx; ctx.window = ctx;
vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(1); }
module.exports = { X: ctx.__x, ctx, createCanvas, ROOT };
