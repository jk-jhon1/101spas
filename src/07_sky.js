/* ============================================================
   07_sky: céu em pixel-art — faixas de cor, sol/lua com halo, nuvens de pixels com
   sombreamento, estrelas e colinas em paralaxe.
   Tudo é desenhado em BAIXA RESOLUÇÃO (1px = 1px do mundo) e ampliado sem suavização
   por um fator inteiro (ver 16_main.js), como nos jogos de pixel-art.
   ============================================================ */
const SKY = { stars: null, clouds: null, hill: [90, 160, 90], hillT: [90, 160, 90], cl: {}, sun: null, moon: null };
const SKYGRAD = [[0, [6, 10, 34], [24, 34, 78]], [.04, [70, 70, 150], [255, 160, 110]], [.09, [46, 108, 226], [158, 204, 250]], [.55, [46, 108, 226], [158, 204, 250]], [.61, [70, 50, 130], [255, 140, 80]], [.67, [6, 10, 34], [24, 34, 78]], [1, [6, 10, 34], [24, 34, 78]]];
const HILLCOL = { forest: [70, 140, 80], desert: [214, 180, 110], jungle: [40, 110, 70], snow: [200, 224, 240], ocean: [90, 130, 170] };
function initSky(seed) {
  const R = mulberry32(seed ^ 0xabc);
  SKY.stars = Array.from({ length: 240 }, () => ({ x: R(), y: R() * .85, s: R() < .12 ? 2 : 1, p: R() * TAU }));
  SKY.clouds = Array.from({ length: 16 }, () => ({ x: R() * 2600, y: 10 + R() * 200, w: 70 + R() * 120, s: 3 + R() * 8, a: .82 + R() * .18, k: R(), v: (R() * 6) | 0 }));
  SKY.cl = {}; SKY.sun = SKY.moon = null;
}
function skyGradAt(frac) {
  for (let i = 1; i < SKYGRAD.length; i++) if (frac <= SKYGRAD[i][0]) {
    const [t0, a1, b1] = SKYGRAD[i - 1], [t1, a2, b2] = SKYGRAD[i], k = smooth((frac - t0) / (t1 - t0));
    return [mixc(a1, a2, k), mixc(b1, b2, k)];
  }
  return [SKYGRAD[6][1], SKYGRAD[6][2]];
}
// ---- sprites (gerados 1x, em cache) ----
function cloudSprite(v, nq) {
  const key = v * 8 + nq; if (SKY.cl[key]) return SKY.cl[key];
  const R = mulberry32(v * 7919 + 101), W = 64 + v * 18, H = Math.round(W * .44), c = mk(W, H), g = c.getContext('2d'), im = g.createImageData(W, H), d = im.data;
  const n = 4 + (W / 30 | 0), puffs = [];
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, mid = 1 - Math.abs(t - .5) * 1.5, r = H * (.2 + .2 * R()) * (.55 + .6 * mid); puffs.push([6 + t * (W - 12) + (R() - .5) * 5, H - 7 - r * .8 - R() * 3, r]); }
  const top = new Int16Array(W).fill(H), bot = new Int16Array(W).fill(-1), mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let ins = y >= H - 9 && y < H - 3 && x > 4 && x < W - 5;
    if (!ins) for (const [cx, cy, r] of puffs) { const dx = x + .5 - cx, dy = (y + .5 - cy) * 1.08; if (dx * dx + dy * dy <= r * r) { ins = true; break; } }
    if (ins) { mask[y * W + x] = 1; if (y < top[x]) top[x] = y; if (y > bot[x]) bot[x] = y; }
  }
  const night = nq / 3, pal = [[255, 255, 255], [238, 246, 255], [212, 228, 249], [184, 207, 239], [152, 178, 224]].map(p => mixc(p, [40, 50, 100], night * .78));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    const dt = y - top[x], db = bot[x] - y, edge = [1, 4, H * .4];
    let lv = dt < edge[0] ? 0 : dt < edge[1] ? 1 : dt < edge[2] ? 2 : 3;
    if (db < 2) lv = 4;
    else if ((x + y) & 1) { if (lv < 3 && Math.abs(dt - edge[lv]) < 1.2) lv++; else if (lv === 3 && db < 4) lv = 4; }
    const o = (y * W + x) * 4, col = pal[lv]; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  g.putImageData(im, 0, 0); return SKY.cl[key] = c;
}
function discSprite(S, halo, disc, isMoon) {
  const c = mk(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data, m = (S - 1) / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const r = Math.hypot(x - m, y - m), o = (y * S + x) * 4; let col = null, a = 0;
    for (const [rr, cc, aa] of halo) { const rg = rr + (((x + y) & 1) ? 1.2 : -1.2); if (r <= rg) { col = cc; a = aa; break; } }
    for (const [rr, cc] of disc) if (r <= rr) { col = cc; a = 1; break; }
    if (isMoon && r <= disc[0][0] && r > 2) { const h = hash2(x >> 1, y >> 1, 77); if (h > .86 && Math.hypot(x - m + 3, y - m - 2) < 8) { col = [196, 204, 226]; a = 1; } }
    if (col) { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.round(a * 255); }
  }
  g.putImageData(im, 0, 0); return c;
}
const sunSprite = () => SKY.sun || (SKY.sun = discSprite(77, [[38, [255, 244, 190], .09], [31, [255, 240, 170], .15], [24, [255, 236, 150], .24]], [[13, [255, 242, 176]], [11, [255, 249, 214]], [6, [255, 255, 245]]]));
const moonSprite = () => SKY.moon || (SKY.moon = discSprite(49, [[23, [170, 196, 255], .08], [18, [176, 202, 255], .15]], [[12, [226, 233, 248]], [10, [238, 242, 252]]], true));

function drawSky(g, w, h, camX, camY, zoom, frac, biome, time, rainbow) {
  // w,h: tamanho do alvo em pixels do MUNDO (baixa resolução); zoom é ignorado (mantido p/ compatibilidade)
  const [top, bot] = skyGradAt(frac), L = skyLight(frac), night = clamp(1 - (L[0] - .15) / .6, 0, 1), nq = Math.round(night * 3);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
  const B = 36; for (let i = 0; i < B; i++) { const y0 = Math.floor(i * h / B), y1 = Math.floor((i + 1) * h / B), c = mixc(top, bot, (i + .5) / B); g.fillStyle = rgbs(c[0], c[1], c[2]); g.fillRect(0, y0, w, y1 - y0 + 1); }
  // estrelas
  if (night > .04) {
    for (const s of SKY.stars) { const a = night * (.55 + .45 * Math.sin(time * 1.6 + s.p)); g.fillStyle = `rgba(255,255,240,${a})`; const sx = Math.floor((s.x * w + camX * .01) % w), sy = Math.floor(s.y * h * .8 - (camY - 1900) * .02); g.fillRect(sx, sy, s.s, s.s); if (s.s === 2 && a > .7) { g.fillRect(sx - 1, sy, 1, 1); g.fillRect(sx + 2, sy, 1, 1); g.fillRect(sx, sy - 1, 1, 1); g.fillRect(sx, sy + 2, 1, 1); } }
  }
  // sol e lua (sprites com halo pontilhado)
  const vy = -(camY - 1900) * .04, sp = (frac - .04) / .57;
  if (sp > -.08 && sp < 1.08) {
    const x = w * (.05 + .9 * sp), y = h * .8 - Math.sin(clamp(sp, 0, 1) * PI) * h * .66 + vy, S = sunSprite();
    g.globalAlpha = 1 - night * .85; g.drawImage(S, Math.round(x - S.width / 2), Math.round(y - S.height / 2)); g.globalAlpha = 1;
  }
  let mp = (frac - .61) / .43; if (frac < .04) mp = (frac + 1 - .61) / .43;
  if (mp > -.05 && mp < 1.05) {
    const x = w * (.05 + .9 * mp), y = h * .8 - Math.sin(clamp(mp, 0, 1) * PI) * h * .62 + vy, S = moonSprite();
    g.drawImage(S, Math.round(x - S.width / 2), Math.round(y - S.height / 2));
  }
  // nuvens
  const period = w + 420;
  for (const c of SKY.clouds) {
    const sp_ = cloudSprite(c.v, nq), cx = ((c.x - time * c.s - camX * .25) % period + period) % period - 210, cy = c.y - (camY - 1900) * .18;
    if (cy > h || cy < -sp_.height) continue;
    g.globalAlpha = c.a * (1 - night * .3); g.drawImage(sp_, Math.round(cx - sp_.width / 2), Math.round(cy));
  }
  g.globalAlpha = 1;
  // colinas em paralaxe (colunas de 2px)
  const tgt = HILLCOL[biome] || HILLCOL.forest; for (let i = 0; i < 3; i++) SKY.hill[i] += (tgt[i] - SKY.hill[i]) * .02;
  for (let k = 0; k < 3; k++) {
    const vk = [.55, .7, .85][k], fk = [.06, .12, .22][k], base = h * .55 + (1888 - camY) * vk + k * 34;
    if (base - 80 > h) continue;
    const col = mixc(bot, SKY.hill, [.35, .6, .85][k]), m0 = .45 + .55 * L[0], m1 = .45 + .55 * L[1], m2 = .45 + .55 * L[2];
    const fill = rgbs(col[0] * m0, col[1] * m1, col[2] * m2), hi = rgbs(Math.min(255, col[0] * m0 * 1.22 + 8), Math.min(255, col[1] * m1 * 1.22 + 8), Math.min(255, col[2] * m2 * 1.22 + 8)), off = camX * fk;
    for (let x = 0; x < w + 2; x += 2) {
      const wx = x + off, y = Math.round(base - (Math.sin(wx * .012 + k * 2) * 34 + Math.sin(wx * .031 + k) * 14 + Math.sin(wx * .0057 + k * 5) * 26));
      g.fillStyle = fill; g.fillRect(x, y, 2, h - y + 1); g.fillStyle = hi; g.fillRect(x, y, 2, k === 2 ? 2 : 1);
    }
  }
}
