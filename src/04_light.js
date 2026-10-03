/* ============================================================
   04_light: iluminação dinâmica por propagação de opacidade
   (GDD: "Iluminação Dinâmica: algoritmo de propagação de
   opacidade por tile"). Luz RGB, 2 iterações de 4 varreduras.
   O decaimento usa a opacidade da célula de ORIGEM: superfícies
   expostas ficam bem iluminadas e a rocha atenua a luz.
   ============================================================ */
class Lighting {
  constructor() { this.w = 0; this.h = 0; this.x0 = 0; this.y0 = 0; this.dyn = []; }
  _alloc(w, h) {
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h; const n = w * h;
    this.r = new Float32Array(n); this.g = new Float32Array(n); this.b = new Float32Array(n); this.cost = new Float32Array(n);
  }
  addLight(tx, ty, r, g, b) { this.dyn.push(tx, ty, r, g, b); }
  // sky = [r,g,b] 0..1
  compute(wd, x0, y0, w, h, sky) {
    this._alloc(w, h); this.x0 = x0; this.y0 = y0;
    const R = this.r, G = this.g, B = this.b, C = this.cost, W = wd.w, H = wd.h, t = wd.t, wl = wd.wl, lq = wd.lq, lt = wd.lt, st = wd.skyTop;
    for (let j = 0; j < h; j++) {
      const y = y0 + j;
      for (let i = 0; i < w; i++) {
        const x = x0 + i, k = j * w + i;
        let tid, wall = 0, q = 0, qt = 0, sky_ = false;
        if (x < 0 || x >= W || y >= H) { tid = T.bedrock; }
        else if (y < 0) { tid = 0; sky_ = true; }
        else { const ii = x + y * W; tid = t[ii]; wall = wl[ii]; q = lq[ii]; qt = lt[ii]; sky_ = y < st[x] && !wall && !SOLID[tid]; }
        let c = OPAC[tid];
        if (wall && !SOLID[tid]) c = Math.max(c, .105);
        if (q) c = Math.max(c, qt === LIQ_LAVA ? .38 : .13);
        C[k] = c;
        let r = 0, g = 0, b = 0;
        if (sky_) { const f = 1 - Math.max(0, c - .075) * 2.2; r = sky[0] * f; g = sky[1] * f; b = sky[2] * f; }
        const e = TD[tid].l;
        if (e) { r = Math.max(r, e[0]); g = Math.max(g, e[1]); b = Math.max(b, e[2]); }
        if (q && qt === LIQ_LAVA) { r = Math.max(r, .95); g = Math.max(g, .42); b = Math.max(b, .1); }
        R[k] = r; G[k] = g; B[k] = b;
      }
    }
    // luzes dinâmicas (interpolação bilinear normalizada -> movimento suave)
    const d = this.dyn;
    for (let n = 0; n < d.length; n += 5) {
      const fx = d[n] - x0 - .5, fy = d[n + 1] - y0 - .5, ix = Math.floor(fx), iy = Math.floor(fy), wx = fx - ix, wy = fy - iy;
      const ws = [(1 - wx) * (1 - wy), wx * (1 - wy), (1 - wx) * wy, wx * wy], mx = Math.max(ws[0], ws[1], ws[2], ws[3]);
      for (let q = 0; q < 4; q++) {
        const cx = ix + (q & 1), cy = iy + (q >> 1);
        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
        const k = cy * w + cx, f = ws[q] / mx;
        if (f < .3) continue;
        R[k] = Math.max(R[k], d[n + 2] * f); G[k] = Math.max(G[k], d[n + 3] * f); B[k] = Math.max(B[k], d[n + 4] * f);
      }
    }
    d.length = 0;
    for (let it = 0; it < 2; it++) {
      for (let j = 0; j < h; j++) { // esquerda -> direita
        let k = j * w + 1;
        for (let i = 1; i < w; i++, k++) {
          const p = k - 1, c = C[p];
          let v = R[p] - c; if (v > R[k]) R[k] = v; v = G[p] - c; if (v > G[k]) G[k] = v; v = B[p] - c; if (v > B[k]) B[k] = v;
        }
        k = j * w + w - 2; // direita -> esquerda
        for (let i = w - 2; i >= 0; i--, k--) {
          const p = k + 1, c = C[p];
          let v = R[p] - c; if (v > R[k]) R[k] = v; v = G[p] - c; if (v > G[k]) G[k] = v; v = B[p] - c; if (v > B[k]) B[k] = v;
        }
      }
      for (let i = 0; i < w; i++) { // cima -> baixo
        let k = w + i;
        for (let j = 1; j < h; j++, k += w) {
          const p = k - w, c = C[p];
          let v = R[p] - c; if (v > R[k]) R[k] = v; v = G[p] - c; if (v > G[k]) G[k] = v; v = B[p] - c; if (v > B[k]) B[k] = v;
        }
        k = (h - 2) * w + i; // baixo -> cima
        for (let j = h - 2; j >= 0; j--, k -= w) {
          const p = k + w, c = C[p];
          let v = R[p] - c; if (v > R[k]) R[k] = v; v = G[p] - c; if (v > G[k]) G[k] = v; v = B[p] - c; if (v > B[k]) B[k] = v;
        }
      }
    }
  }
  // grava em ImageData (RGBA) com ambiente mínimo
  toImage(img, amb) {
    const n = this.w * this.h, d = img.data, R = this.r, G = this.g, B = this.b;
    for (let k = 0, o = 0; k < n; k++, o += 4) {
      d[o] = Math.min(255, (R[k] + amb[0]) * 255); d[o + 1] = Math.min(255, (G[k] + amb[1]) * 255); d[o + 2] = Math.min(255, (B[k] + amb[2]) * 255); d[o + 3] = 255;
    }
  }
  sample(x, y) { // luminosidade aproximada em tile (para spawn / logica)
    const i = x - this.x0, j = y - this.y0; if (i < 0 || j < 0 || i >= this.w || j >= this.h) return 0;
    const k = j * this.w + i; return Math.max(this.r[k], this.g[k], this.b[k]);
  }
}

// cor do céu / luz ambiente conforme hora (frac 0..1)
// 0.00 pré-amanhecer, 0.04 aurora, 0.09-0.55 dia, 0.61 entardecer, 0.67-1.0 noite
const SKY_KEYS = [[0, [.15, .19, .36]], [.04, [1, .66, .5]], [.09, [1, 1, 1]], [.55, [1, 1, 1]], [.61, [1, .66, .5]], [.67, [.15, .19, .36]], [1, [.15, .19, .36]]];
function skyLight(frac) {
  for (let i = 1; i < SKY_KEYS.length; i++) {
    if (frac <= SKY_KEYS[i][0]) {
      const [t0, a] = SKY_KEYS[i - 1], [t1, b] = SKY_KEYS[i], k = smooth((frac - t0) / (t1 - t0));
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    }
  }
  return SKY_KEYS[SKY_KEYS.length - 1][1];
}
const isNightFrac = f => f >= .64 || f < .03;
