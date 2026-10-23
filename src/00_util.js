'use strict';
/* ============================================================
   120 ESPADAS — Sandbox 2D  |  00_util: matemática, RNG, ruído
   ============================================================ */
const TAU = Math.PI * 2, PI = Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[(Math.random() * a.length) | 0];
const chance = p => Math.random() < p;
const sgn = v => v < 0 ? -1 : 1;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const smooth = t => t * t * (3 - 2 * t);
const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - (1 - t) * (1 - t);
const approach = (v, target, d) => v < target ? Math.min(v + d, target) : Math.max(v - d, target);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
const deg = d => d * PI / 180;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// hash inteiro 2D -> [0,1)
function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1013, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function strSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const _fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const _gx = [1, -1, 1, -1, 1, -1, 0, 0], _gy = [1, 1, -1, -1, 0, 0, 1, -1];
class Perlin {
  constructor(seed) {
    const r = mulberry32(seed), perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    this.p = new Uint8Array(512); for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  n2(x, y) { // ~[-1,1]
    const fx = Math.floor(x), fy = Math.floor(y), X = fx & 255, Y = fy & 255; x -= fx; y -= fy;
    const u = _fade(x), v = _fade(y), p = this.p;
    const aa = p[p[X] + Y] & 7, ab = p[p[X] + Y + 1] & 7, ba = p[p[X + 1] + Y] & 7, bb = p[p[X + 1] + Y + 1] & 7;
    const g1 = _gx[aa] * x + _gy[aa] * y, g2 = _gx[ba] * (x - 1) + _gy[ba] * y;
    const g3 = _gx[ab] * x + _gy[ab] * (y - 1), g4 = _gx[bb] * (x - 1) + _gy[bb] * (y - 1);
    const top = g1 + (g2 - g1) * u, bot = g3 + (g4 - g3) * u;
    return (top + (bot - top) * v) * 1.2;
  }
  fbm(x, y, oct = 4, lac = 2, gain = .5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) { s += a * this.n2(x * f, y * f); n += a; a *= gain; f *= lac; }
    return s / n;
  }
}

// ---- cores ----
function hex2rgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbs = (r, g, b, a) => a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
function mix(c1, c2, t) {
  const a = typeof c1 === 'string' ? hex2rgb(c1) : c1, b = typeof c2 === 'string' ? hex2rgb(c2) : c2;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function shade(c, f) { // f<0 escurece, f>0 clareia
  const a = typeof c === 'string' ? hex2rgb(c) : c;
  const t = f < 0 ? 0 : 255, k = Math.abs(f);
  return rgbs(a[0] + (t - a[0]) * k, a[1] + (t - a[1]) * k, a[2] + (t - a[2]) * k);
}
function tint(c, f, a) { const m = typeof c === 'string' ? hex2rgb(c) : c; return rgbs(m[0] * f, m[1] * f, m[2] * f, a); }
function escHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n));
