/* ============================================================
   05d_bosspaint: ferramentas de pintura de pixel-art para os chefes
   Os sprites dos chefes não são vetores "pixelizados": são pintados pixel a pixel, em tamanho real
   (1 pixel do sprite = 1 pixel do mundo), com poucas cores escuras, luz de cima-esquerda, formas
   separadas por tons escuros, partes luminosas com núcleo claro, borda escura e halo de pixels
   semitransparentes (visual das artes de referência do jogador).
   Um buffer guarda RGBA + a rampa/tom usados em cada pixel (dá para clarear/escurecer depois).
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
function bpNew(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4), rp: new Array(w * h).fill(null), t: new Float32Array(w * h), em: new Uint8Array(w * h) }; }
function bpCol(ramp, t) { const i = Math.round(t); return ramp[i < 0 ? 0 : i >= ramp.length ? ramp.length - 1 : i]; }
// pixel opaco na rampa `ramp` (array de [r,g,b], escuro -> claro) no tom t
function bpSet(b, x, y, ramp, t) {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  const i = y * b.w + x, c = bpCol(ramp, t), j = i * 4;
  b.d[j] = c[0]; b.d[j + 1] = c[1]; b.d[j + 2] = c[2]; b.d[j + 3] = 255; b.rp[i] = ramp; b.t[i] = t;
}
// cor direta com alfa (0-255), composta por cima do que já existe
function bpPut(b, x, y, c, a) {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  const j = (y * b.w + x) * 4, A = a === undefined ? 255 : a, da = b.d[j + 3] / 255, sa = A / 255, oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  for (let k = 0; k < 3; k++) b.d[j + k] = (c[k] * sa + b.d[j + k] * da * (1 - sa)) / oa;
  b.d[j + 3] = oa * 255; b.rp[y * b.w + x] = null;
}
// ---------- máscaras (Uint8Array w*h) ----------
function bpPoly(w, h, pts) {   // polígono, regra par-ímpar, pelo centro do pixel
  const m = new Uint8Array(w * h), n = pts.length; let y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) { if (pts[i][1] < y0) y0 = pts[i][1]; if (pts[i][1] > y1) y1 = pts[i][1]; }
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) {
    const yc = y + .5, xs = [];
    for (let i = 0; i < n; i++) { const a = pts[i], c = pts[(i + 1) % n]; if ((a[1] <= yc && c[1] > yc) || (c[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (c[1] - a[1]) * (c[0] - a[0])); }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) { const xa = Math.max(0, Math.ceil(xs[k] - .5)), xb = Math.min(w - 1, Math.floor(xs[k + 1] - .5)); for (let x = xa; x <= xb; x++) m[y * w + x] = 1; }
  }
  return m;
}
function bpEll(w, h, cx, cy, rx, ry) {
  const m = new Uint8Array(w * h);
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(h - 1, Math.ceil(cy + ry)); y++) for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(w - 1, Math.ceil(cx + rx)); x++) {
    const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) m[y * w + x] = 1;
  }
  return m;
}
function bpSeg(w, h, x0, y0, x1, y1, wd, into) {   // traço grosso (distância até o segmento <= wd/2); `into` acumula numa máscara existente
  const m = into || new Uint8Array(w * h), r = wd / 2, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
  for (let y = Math.max(0, Math.floor(Math.min(y0, y1) - r - 1)); y <= Math.min(h - 1, Math.ceil(Math.max(y0, y1) + r + 1)); y++) for (let x = Math.max(0, Math.floor(Math.min(x0, x1) - r - 1)); x <= Math.min(w - 1, Math.ceil(Math.max(x0, x1) + r + 1)); x++) {
    const px = x + .5 - x0, py = y + .5 - y0, t = Math.max(0, Math.min(1, (px * dx + py * dy) / L2)), ex = px - t * dx, ey = py - t * dy;
    if (ex * ex + ey * ey <= r * r) m[y * w + x] = 1;
  }
  return m;
}
function bpUnion(a, c) { const m = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) m[i] = a[i] | c[i]; return m; }
// curva suave (Catmull-Rom) por pontos -> lista de pontos
function bpCurve(pts, steps) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[n - 1].slice()); return out;
}
// faixa de largura variável ao longo de uma curva: pts [[x,y]...], wd(t) em 0..1 -> máscara
function bpStroke(w, h, pts, wd) {
  const m = new Uint8Array(w * h);
  for (let i = 0; i < pts.length - 1; i++) { const t = i / (pts.length - 1); bpSeg(w, h, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], typeof wd === 'function' ? wd(t) : wd, m); }
  return m;
}
// ---------- preenchimento com luz de cima-esquerda ----------
// m: máscara; ramp: cores escuro->claro; t0: tom base. o: hi/lo (realce da borda de cima-esquerda / sombra de baixo-direita),
// r2 (2 camadas), g0/g1 (tom somado no topo/na base da forma), noise (±), sd (semente)
function bpBox(m, w, h, pad) {   // caixa que envolve a máscara (+pad), recortada ao buffer; null se vazia
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) { const r = y * w; for (let x = 0; x < w; x++) if (m[r + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return null; const p = pad || 0; return { x0: Math.max(0, x0 - p), y0: Math.max(0, y0 - p), x1: Math.min(w - 1, x1 + p), y1: Math.min(h - 1, y1 + p) };
}
function bpFill(b, m, ramp, t0, o) {
  o = o || {}; const w = b.w, h = b.h, hi = o.hi === undefined ? 1 : o.hi, lo = o.lo === undefined ? 1 : o.lo, g0 = o.g0 || 0, g1 = o.g1 || 0, nz = o.noise || 0, sd = o.sd || 3;
  const bx = bpBox(m, w, h, 0); if (!bx) return; const y0 = bx.y0, y1 = bx.y1;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : m[y * w + x];
  for (let y = y0; y <= y1; y++) for (let x = bx.x0; x <= bx.x1; x++) {
    const i = y * w + x; if (!m[i]) continue;
    let t = t0 + g0 + (g1 - g0) * (y1 > y0 ? (y - y0) / (y1 - y0) : 0);
    if (!at(x, y - 1)) t += hi; else if (o.r2 && !at(x, y - 2)) t += hi * .45;
    if (!at(x - 1, y)) t += hi * .8; else if (o.r2 && !at(x - 2, y)) t += hi * .3;
    if (!at(x, y + 1)) t -= lo; else if (o.r2 && !at(x, y + 2)) t -= lo * .4;
    if (!at(x + 1, y)) t -= lo * .8; else if (o.r2 && !at(x + 2, y)) t -= lo * .3;
    if (nz) t += (hash2(x, y, sd) - .5) * 2 * nz;
    bpSet(b, x, y, ramp, t);
  }
}
// borda de dentro da forma (pixels com vizinho de fora) num tom da rampa; sides: 'all' | 'dr' (baixo/direita) | 'ul' (cima/esquerda)
function bpEdge(b, m, ramp, t, sides) {
  const w = b.w, h = b.h, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : m[y * w + x], s = sides || 'all', bx = bpBox(m, w, h, 0); if (!bx) return;
  for (let y = bx.y0; y <= bx.y1; y++) for (let x = bx.x0; x <= bx.x1; x++) {
    if (!m[y * w + x]) continue;
    const up = !at(x, y - 1), dn = !at(x, y + 1), lf = !at(x - 1, y), rt = !at(x + 1, y);
    if (s === 'all' ? (up || dn || lf || rt) : s === 'dr' ? (dn || rt) : (up || lf)) bpSet(b, x, y, ramp, t);
  }
}
// distância (passos 4-conexos) de cada pixel da máscara até o vazio mais próximo (1 = borda)
function bpDist(m, w, h, far, bx) {   // far: fora do buffer (e da caixa bx) conta como "longe" (0 = conta como vazio)
  const d = new Uint16Array(w * h), BIG = 999, o = far ? BIG : 0, x0 = bx ? bx.x0 : 0, y0 = bx ? bx.y0 : 0, x1 = bx ? bx.x1 : w - 1, y1 = bx ? bx.y1 : h - 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; d[i] = m[i] ? BIG : 0; }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; v = Math.min(v, (x > x0 ? d[i - 1] : o) + 1, (y > y0 ? d[i - w] : o) + 1); d[i] = v; }
  for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; v = Math.min(v, (x < x1 ? d[i + 1] : o) + 1, (y < y1 ? d[i + w] : o) + 1); d[i] = v; }
  return d;
}
const BP_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// forma luminosa: núcleo claro, borda escura (tom `edge`), halo de pixels semitransparentes (cor `halo`, `hr` px, `ha` alfa máximo)
// o: edge (tom da borda), top (tom do núcleo), halo (cor [r,g,b]), hr, ha, p (expoente: >1 deixa o núcleo menor)
function bpGlow(b, m, ramp, o) {
  const w = b.w, h = b.h, hr = o.hr === undefined ? 3 : o.hr, bx = bpBox(m, w, h, 1); if (!bx) return; const d = bpDist(m, w, h, false, bx); let mx = 1; for (let y = bx.y0; y <= bx.y1; y++) for (let x = bx.x0; x <= bx.x1; x++) { const i = y * w + x; if (m[i] && d[i] > mx) mx = d[i]; }
  const e = o.edge === undefined ? 1 : o.edge, tp = o.top === undefined ? ramp.length - 1 : o.top, p = o.p || 1;
  for (let y = bx.y0; y <= bx.y1; y++) for (let x = bx.x0; x <= bx.x1; x++) {
    const i = y * w + x; if (!m[i]) continue;
    const k = mx <= 1 ? 1 : Math.pow(Math.min(1, (d[i] - 1) / Math.max(1, mx - 1)), 1 / p);
    bpSet(b, x, y, ramp, e + (tp - e) * k + (o.noise ? (hash2(x, y, 5) - .5) * o.noise : 0)); if (o.em !== 0) b.em[i] = 1;
  }
  if (!hr || !o.halo) return;
  const bh = bpBox(m, w, h, hr + 1), out = new Uint8Array(w * h);
  for (let y = bh.y0; y <= bh.y1; y++) for (let x = bh.x0; x <= bh.x1; x++) out[y * w + x] = m[y * w + x] ? 0 : 1;
  const dd = bpDist(out, w, h, true, bh);   // distância até a forma (1 = encostado)
  for (let y = bh.y0; y <= bh.y1; y++) for (let x = bh.x0; x <= bh.x1; x++) {
    const i = y * w + x; if (m[i] || dd[i] > hr) continue;
    const f = (1 - (dd[i] - 1) / hr) * (o.ha === undefined ? 150 : o.ha), th = (BP_BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16;
    if (th < f / 255 * 1.6) { bpPut(b, x, y, o.halo, Math.min(255, f)); if (o.em !== 0) b.em[i] = 1; }
  }
}
// carimbo de arte em texto: rows (strings), pal: char -> [r,g,b] (ou null); flip espelha na horizontal
function bpStamp(b, x0, y0, rows, pal, flip) {
  for (let y = 0; y < rows.length; y++) { const r = rows[y], n = r.length; for (let k = 0; k < n; k++) { const c = pal[r[flip ? n - 1 - k : k]]; if (c) bpPut(b, x0 + k, y0 + y, c, c[3] === undefined ? 255 : c[3]); } }
}
// linha de 1 px (Bresenham) na rampa/tom
function bpLine(b, x0, y0, x1, y1, ramp, t) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (;;) { bpSet(b, x0, y0, ramp, t); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
// canvas do buffer (emOnly: só os pixels que brilham)
function bpCanvas(b, emOnly) {   /* emOnly: só os pixels emissivos (para somar luz no passe aditivo) */
  const c = document.createElement('canvas'); c.width = b.w; c.height = b.h;
  const g = c.getContext('2d'), im = g.createImageData(b.w, b.h);
  if (emOnly) { for (let i = 0; i < b.em.length; i++) if (b.em[i]) { const j = i * 4; im.data[j] = b.d[j]; im.data[j + 1] = b.d[j + 1]; im.data[j + 2] = b.d[j + 2]; im.data[j + 3] = b.d[j + 3]; } } else im.data.set(b.d);
  g.putImageData(im, 0, 0); return c;
}
function bpPack(b) { return { c: bpCanvas(b), em: bpCanvas(b, true), w: b.w, h: b.h }; }
