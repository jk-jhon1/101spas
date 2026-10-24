/* ============================================================
   05f_bxart: infraestrutura da arte dos 90 chefes novos (pintores em 05g..05l_bxart*.js)
   Mesmo visual dos chefes anteriores (05d/05e): corpo escuro em poucos tons, luz de cima-esquerda, borda escura,
   e um brilho de UMA cor por chefe (núcleo claro, borda escura, halo semitransparente, pixels emissivos).
   Cada pintor desenha em coordenadas relativas ao centro da caixa de colisão (cx,cy) com as ajudas de bxH().
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const BXART = {};
const _bxL = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function bxRamp(d, m, l) { return [d, _bxL(d, m, .5), m, _bxL(m, l, .4), _bxL(m, l, .75), l]; }   // 6 tons: escuro -> claro
function bxGlowRamp(c) {   // 7 tons: borda escura, cor, núcleo quase branco
  const k = f => c.map(v => Math.round(v * f)), L = t => c.map(v => Math.round(v + (255 - v) * t));
  return [k(.14), k(.32), k(.62), c.slice(), L(.45), L(.78), L(.94)];
}
const RP = {   // rampas de corpo (escuro -> claro)
  bone: bxRamp([24, 20, 20], [140, 128, 108], [236, 228, 206]), ink: bxRamp([4, 4, 10], [28, 28, 54], [100, 100, 146]), night: bxRamp([6, 6, 18], [32, 30, 74], [92, 88, 156]),
  violet: bxRamp([14, 6, 28], [72, 42, 124], [178, 142, 232]), plum: bxRamp([18, 6, 22], [86, 38, 94], [202, 132, 202]), wine: bxRamp([20, 4, 10], [112, 22, 46], [222, 92, 112]),
  blood: bxRamp([22, 2, 4], [122, 12, 20], [232, 72, 72]), rust: bxRamp([24, 10, 6], [122, 58, 30], [222, 152, 92]), ember: bxRamp([24, 8, 4], [128, 46, 14], [232, 132, 52]),
  ochre: bxRamp([30, 20, 6], [152, 106, 32], [242, 202, 102]), sand: bxRamp([40, 30, 14], [172, 142, 82], [246, 228, 168]), wood: bxRamp([20, 12, 6], [98, 64, 32], [190, 140, 82]),
  bark: bxRamp([14, 10, 6], [72, 52, 34], [142, 114, 86]), moss: bxRamp([8, 18, 8], [58, 98, 42], [152, 202, 102]), leaf: bxRamp([6, 24, 10], [42, 122, 52], [142, 228, 112]),
  jade: bxRamp([4, 22, 18], [32, 122, 98], [132, 232, 192]), teal: bxRamp([4, 20, 26], [30, 102, 122], [132, 216, 228]), ice: bxRamp([10, 24, 44], [92, 152, 202], [222, 246, 255]),
  sky: bxRamp([10, 26, 60], [72, 132, 212], [192, 228, 255]), steel: bxRamp([10, 12, 18], [90, 100, 118], [212, 222, 238]), iron: bxRamp([8, 8, 10], [58, 58, 66], [152, 152, 162]),
  brass: bxRamp([30, 20, 4], [162, 118, 32], [250, 216, 112]), gold: bxRamp([40, 26, 4], [192, 142, 26], [255, 232, 132]), stone: bxRamp([10, 10, 14], [86, 90, 102], [192, 198, 212]),
  slate: bxRamp([8, 12, 18], [66, 82, 98], [162, 182, 202]), pink: bxRamp([34, 8, 28], [192, 72, 142], [255, 192, 232]), lime: bxRamp([12, 24, 4], [112, 172, 32], [222, 250, 122]),
  coral: bxRamp([36, 10, 10], [212, 82, 72], [255, 192, 172]), shade: bxRamp([2, 2, 4], [20, 20, 28], [62, 62, 76]), cloth: bxRamp([8, 6, 12], [40, 30, 52], [104, 90, 126]),
  hide: bxRamp([14, 8, 6], [92, 58, 40], [178, 130, 98]), shell: bxRamp([6, 18, 14], [30, 96, 74], [120, 210, 170]), amberr: bxRamp([34, 18, 2], [200, 124, 14], [255, 214, 96]),
};
function bxArt(id, W, H, cx, cy, frames, paint, o) { BXART[id] = Object.assign({ id, W, H, cx, cy, frames, paint, fps: 5, vars: 1 }, o || {}); }

function bxH(A, fr, v) {   // ajudas de pintura: coordenadas relativas ao centro da caixa (cx,cy)
  const W = A.W, H = A.H, cx = A.cx, cy = A.cy, b = bpNew(W, H);
  if (!A.ac) A.ac = bxGlowRamp(hex2rgb(A.acc));
  const ac = A.ac, ox = x => cx + x, oy = y => cy + y, pt = p => [cx + p[0], cy + p[1]], h = { b, W, H, cx, cy, R: RP, ac, fr, v };
  h.P = pts => bpPoly(W, H, pts.map(pt));
  h.E = (x, y, rx, ry) => bpEll(W, H, ox(x), oy(y), rx, ry);
  h.S = (x0, y0, x1, y1, w) => bpSeg(W, H, ox(x0), oy(y0), ox(x1), oy(y1), w);
  h.C = (pts, w0, w1, st) => bpStroke(W, H, bpCurve(pts.map(pt), st || 5), t => w0 + (w1 - w0) * t);
  h.U = (...m) => { let r = m[0]; for (let i = 1; i < m.length; i++) r = bpUnion(r, m[i]); return r; };
  h.mir = m => { const r = new Uint8Array(W * H), xm = 2 * cx - 1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { const x2 = xm - x; if (x2 >= 0 && x2 < W) r[y * W + x2] = 1; } return r; };
  h.sy = m => bpUnion(m, h.mir(m));   // forma simétrica a partir de uma metade
  h.F = (m, ramp, t, o) => { o = o || {}; bpFill(b, m, ramp, t, { hi: o.hi === undefined ? 1 : o.hi, lo: o.lo === undefined ? 1 : o.lo, g0: o.g0, g1: o.g1, noise: o.noise === undefined ? .3 : o.noise, sd: o.sd || 7, r2: o.r2 }); if (o.ol !== undefined) bpEdge(b, m, ramp, o.ol, o.sides || 'all'); return m; };
  h.G = (m, o) => { bpGlow(b, m, ac, Object.assign({ edge: 1, top: 5.4, p: .8, hr: 3, ha: 120, halo: ac[3] }, o)); return m; };
  h.eye = (x, y, rx, ry, o) => { o = o || {}; const m = h.E(x, y, rx, ry); h.G(m, Object.assign({ hr: 2, ha: 110 }, o)); if (o.pupil !== false) { const px = Math.round(ox(x) + (o.px || 0)), py = Math.round(oy(y) + (o.py || 0)); for (let j = 0; j < Math.max(1, Math.round(ry * 1.4)); j++) bpSet(b, px, py - Math.round(ry * .7) + j, RP.shade, 1); } return m; };
  h.I = (a, c) => { const r = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) r[i] = a[i] & c[i]; return r; };   // interseção de máscaras
  h.N = (a, c) => { const r = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) r[i] = a[i] & (c[i] ^ 1); return r; };   // a menos c
  h.A = (m, col, a) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) bpPut(b, x, y, col, a); return m; };   // cor translúcida (asas, vidro, névoa)
  h.L = (x0, y0, x1, y1, ramp, t) => bpLine(b, ox(x0), oy(y0), ox(x1), oy(y1), ramp, t);
  h.T = (x, y, rows, pal, flip) => bpStamp(b, Math.round(ox(x)), Math.round(oy(y)), rows, pal, flip);
  h.px = (x, y, ramp, t) => bpSet(b, Math.round(ox(x)), Math.round(oy(y)), ramp, t);
  h.put = (x, y, col, a) => bpPut(b, Math.round(ox(x)), Math.round(oy(y)), col, a);
  h.D = (m, ramp, t, p, sd) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x] && hash2(x, y, sd || 21) < p) bpSet(b, x, y, ramp, t); };   // pontilhado dentro da forma
  h.star = (n, sd, x0, y0, x1, y1, col) => { for (let i = 0; i < n; i++) bpPut(b, Math.floor(ox(x0) + hash2(i, 1, sd) * (x1 - x0)), Math.floor(oy(y0) + hash2(i, 2, sd) * (y1 - y0)), col || [255, 244, 200], 190 + hash2(i, 3, sd) * 60); };
  h.out = ramp => {   // contorno escuro de 1 px em volta da silhueta (menos nos pixels que brilham)
    const d = b.d, set = [], al = i => d[i * 4 + 3];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (al(i) < 250 || b.em[i]) continue; if ((x === 0 || al(i - 1) < 60) || (x === W - 1 || al(i + 1) < 60) || (y === 0 || al(i - W) < 60) || (y === H - 1 || al(i + W) < 60)) set.push(x, y); }
    for (let k = 0; k < set.length; k += 2) bpSet(b, set[k], set[k + 1], ramp || RP.shade, 1);
  };
  return h;
}
function bxSpr(id, fr, v) {
  const key = 'x' + id + '|' + fr + '|' + (v || 0); let s = BOSSART.cache.get(key); if (s) return s;
  const A = BXART[id], h = bxH(A, fr, v || 0); A.paint(h, fr, v || 0); if (!A.noOutline) h.out(); s = bpPack(h.b); BOSSART.cache.set(key, s); return s;
}
function bxWarmAll(id) {   // todos os quadros e variantes do chefe de uma vez (ao invocar)
  const A = BXART[id]; if (!A) return;
  for (let v = 0; v < A.vars; v++) for (let f = 0; f < A.frames; f++) bxSpr(id, f, v);
  if (A.warm) A.warm();
}
