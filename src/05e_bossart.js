/* ============================================================
   05e_bossart: sprites dos 4 chefes, pintados em pixel-art (ferramentas em 05d_bosspaint.js)
   Visual: corpo escuro, um brilho de cor forte por chefe (núcleo claro, borda escura, halo semitransparente),
   formas separadas por tons escuros, luz de cima-esquerda, poucos tons por material.
   Cada sprite é gerado uma vez por "quadro" de animação e guardado em cache (BOSSART.cache); as partes que
   se mexem (lanterna, íris, anéis, órbitas) são desenhadas por cima em 14_draw_enemies.js.
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const BR = {
  cloak: [[9, 6, 9], [20, 13, 17], [32, 21, 26], [46, 31, 36], [62, 43, 48], [84, 60, 62]],
  strap: [[36, 22, 20], [60, 38, 32], [88, 58, 44], [118, 82, 60]],
  ember: [[48, 12, 8], [100, 30, 10], [172, 62, 16], [238, 116, 30], [255, 172, 68], [255, 224, 146], [255, 248, 214]],
  ash: [[22, 18, 18], [44, 38, 36], [72, 64, 58], [110, 100, 90]],
  iron: [[8, 6, 8], [22, 16, 19], [42, 32, 35], [68, 54, 52]],
  gel: [[6, 14, 38], [12, 30, 80], [20, 56, 136], [36, 92, 188], [70, 146, 226], [146, 206, 250], [226, 246, 255]],
  cyan: [[8, 40, 60], [14, 90, 120], [30, 160, 190], [90, 220, 235], [170, 246, 250], [236, 255, 255]],
  gold: [[44, 26, 6], [104, 66, 10], [176, 124, 22], [236, 184, 52], [255, 222, 112], [255, 244, 190]],
  flesh: [[18, 8, 24], [38, 20, 48], [64, 38, 72], [98, 64, 100], [140, 102, 138], [184, 150, 178], [222, 196, 216]],
  vein: [[56, 6, 18], [112, 14, 34], [180, 28, 56], [230, 60, 84]],
  crim: [[34, 4, 14], [96, 8, 28], [172, 20, 46], [232, 56, 78], [255, 124, 138], [255, 214, 214]],
  maw: [[40, 8, 16], [86, 14, 28], [140, 26, 40], [190, 50, 50], [236, 96, 60], [255, 170, 90]],
  stone: [[8, 7, 22], [18, 15, 46], [32, 27, 74], [50, 43, 108], [74, 66, 144], [108, 98, 184], [150, 140, 220]],
  nebula: [[16, 10, 44], [30, 18, 78], [52, 30, 120], [84, 52, 168], [128, 90, 210]],
};
const BOSSART = { cache: new Map() };
function bossCache(key, make) { let s = BOSSART.cache.get(key); if (!s) { s = make(); BOSSART.cache.set(key, s); } return s; }
const _bossStar = (b, n, sd, x0, y0, x1, y1, col) => { for (let i = 0; i < n; i++) { const x = Math.floor(x0 + hash2(i, 1, sd) * (x1 - x0)), y = Math.floor(y0 + hash2(i, 2, sd) * (y1 - y0)); bpPut(b, x, y, col || [255, 244, 200], 200 + hash2(i, 3, sd) * 55); } };

// ---------- Guardião do Abismo: carcereiro encapuzado de brasas, com foice e lanterna ----------
// coordenadas de projeto em relação ao centro da caixa de colisão; GD.K escala tudo para o corpo caber na caixa (58x70).
// Desenhado de frente: as peças espelham com e.face. HX,HY = mão que segura a corrente da lanterna.
const GD = { W: 124, H: 128, CX: 64, CY: 70, HX: 30, HY: 7, K: .86 };
const GD_LANTERN = [
  '.....IIII.....', '....I....I....', '....I....I....', '...IIIIIIII...', '..IIAAAAAAII..', '..IAAHHHHAAI..', '.IIAHHWWHHAII.', '.IAAHWWWWHAAI.', '.IIAHWWWWHAII.', '.IAAHHWWHHAAI.', '.IIAAHHHHAAII.', '..IIAAAAAAII..', '...IIIIIIII...', '....IIIIII....', '.....I..I.....',
];
function guardSprite(fr, ph2) {
  const K = GD.K, b = bpNew(GD.W, GD.H), W = b.w, H = b.h, X = GD.CX, Y = GD.CY;
  const P = (pts) => bpPoly(W, H, pts.map(p => [X + p[0] * K, Y + p[1] * K]));
  const SG = (x0, y0, x1, y1, wd) => bpSeg(W, H, X + x0 * K, Y + y0 * K, X + x1 * K, Y + y1 * K, wd * K);
  const EL = (cx, cy, rx, ry) => bpEll(W, H, X + cx * K, Y + cy * K, rx * K, ry * K);
  const LN = (x0, y0, x1, y1, ramp, t) => bpLine(b, X + x0 * K, Y + y0 * K, X + x1 * K, Y + y1 * K, ramp, t);
  const C = BR.cloak, S = BR.strap, E = BR.ember, A = BR.ash, sw = Math.sin(fr * Math.PI / 2);
  // --- foice (atrás): haste, anéis de brasa e lâmina curva no alto ---
  bpFill(b, SG(-34, -56, -34, 56, 2.6), A, 1.4, { hi: .8, lo: .6 });
  for (const yy of [-26, 12, 36]) bpFill(b, SG(-34, yy, -34, yy + 3, 3.8), E, 2, { hi: .6, lo: .3 });
  bpFill(b, P([[-35.5, 56], [-32.5, 56], [-34, 62]]), A, 2, {});
  const blade = P([[-34, -60], [-42, -66], [-52, -64], [-60, -56], [-64, -45], [-61, -37], [-58, -45], [-55, -51], [-49, -55], [-42, -56], [-34, -52]]);
  bpGlow(b, blade, E, { edge: 1, top: 5.4, p: .8, halo: [255, 140, 40], hr: ph2 ? 3 : 2, ha: ph2 ? 130 : 100 }); bpEdge(b, blade, E, 0, 'dr');
  // --- capa: sino estreito e comprido com barra rasgada ---
  const hy = (k) => Math.round(sw * (k % 2 ? 1.5 : -1.5));
  const cloak = P([[-19, -4], [19, -4], [24, 8], [27, 22], [25, 36], [21, 31], [18, 40 + hy(0)], [12, 33], [7, 46 + hy(1)], [2, 33], [-3, 43 + hy(2)], [-8, 33], [-14, 47 + hy(3)], [-18, 35], [-24, 40 + hy(4)], [-26, 28], [-24, 16]]);
  bpFill(b, cloak, C, 2.4, { hi: 1.1, lo: 1.1, g0: .6, g1: -1, noise: .35, sd: 11, r2: true });
  for (const fx of [-18, -12, -7, 7, 12, 18]) LN(fx * .75, 8, fx * 1.15, 33 + Math.abs(fx) * .2, C, 1);
  bpFill(b, P([[-7, -2], [7, -2], [6, 16], [4, 38], [-4, 38], [-6, 16]]), C, 1.1, { hi: .3, lo: 0, g0: .3, g1: -.5, noise: .3, sd: 4 });
  for (const s of [-1, 1]) bpFill(b, P([[s * 23, 8], [s * 9, 14], [s * 12, 33], [s * 15, 29], [s * 20, 34], [s * 22, 28]]), S, 1.2, { hi: .9, lo: .9, noise: .3, sd: 6 + s, r2: true });
  for (const s of [-1, 1]) { const st = SG(s * 16, -11, -s * 13, 20, 3.8); bpFill(b, st, S, 1.6, { hi: 1, lo: 1 }); bpEdge(b, st, S, 0, 'dr'); }
  bpStamp(b, Math.round(X - 2.5), Math.round(Y + 2), ['..F..', '.FHF.', 'FHWHF', '.FHF.', '..F..'], { F: E[3], H: E[5], W: E[6] });
  // --- ombreira (manto) com pontas ---
  const mantle = P([[-24, -4], [-31, -14], [-21, -14], [-18, -21], [-9, -24], [9, -24], [18, -21], [21, -14], [31, -14], [24, -4], [18, 0], [-18, 0]]);
  bpFill(b, mantle, C, 2.6, { hi: 1.2, lo: 1.1, g0: .4, g1: -.7, noise: .3, sd: 8, r2: true }); bpEdge(b, mantle, C, .5, 'dr');
  // --- braços: manga + mão luminosa ---
  const armR = bpUnion(SG(19, -12, 27, -3, 8.4), SG(27, -3, 33, 4, 6.4)); bpFill(b, armR, C, 2.3, { hi: 1, lo: 1, noise: .3, sd: 12, r2: true });
  const armL = bpUnion(SG(-19, -12, -27, -6, 8.4), SG(-27, -6, -31, -2, 6.4)); bpFill(b, armL, C, 2.3, { hi: 1, lo: 1, noise: .3, sd: 13, r2: true });
  for (const [hx, hy2, rx, ry] of [[GD.HX, GD.HY - 2, 5.2, 4.4], [-34, -1, 4.6, 4.6]]) bpGlow(b, EL(hx, hy2, rx, ry), E, { edge: 1, top: 5.4, halo: [255, 150, 50], hr: 2, ha: 120 });
  // --- capuz pontudo com máscara de brasa ---
  const hood = P([[-12, -17], [-15, -29], [-12, -40], [-6, -49], [-1, -57], [6, -49], [13, -40], [16, -29], [14, -17], [10, -12], [-8, -12]]);
  bpFill(b, hood, C, 1.6, { hi: 1, lo: 1, g0: .5, g1: -.4, noise: .3, sd: 14, r2: true });
  bpFill(b, EL(0, -29, 9.6, 12.4), C, .2, { hi: 0, lo: 0 });
  const mask = P([[-7, -38], [7, -38], [9.5, -30], [6.5, -22], [0, -15.5], [-6.5, -22], [-9.5, -30]]);
  bpGlow(b, mask, E, { edge: 1, top: ph2 ? 6 : 5.4, p: .7, halo: [255, 160, 60], hr: ph2 ? 3 : 2, ha: ph2 ? 150 : 110 });
  const eyeCol = ph2 ? E[6] : E[0];
  for (const s of [-1, 1]) { LN(s * 7.5, -33, s * 2, -29, [eyeCol], 0); LN(s * 7, -32, s * 2, -28, [eyeCol], 0); }
  for (let k = -4; k <= 4; k++) bpSet(b, Math.round(X + k * K), Math.round(Y + (-21 + (Math.abs(k) % 2)) * K), [E[0]], 0);
  // chifres de cinza, finos e longos
  for (const [s, ln] of [[-1, 1], [1, .85]]) {
    const pts = bpCurve([[s * 13, -40], [s * 20 * ln, -45], [s * 25 * ln, -53], [s * 26 * ln, -62]].map(p => [X + p[0] * K, Y + p[1] * K]), 5);
    const hm = bpStroke(W, H, pts, (t) => (3.4 - 2.6 * t) * K); bpFill(b, hm, A, 1.6, { hi: .8, lo: .8 }); bpEdge(b, hm, A, 0, 'dr');
  }
  // chamas curvas no alto do capuz (mudam por quadro) e brasas soltas sob a barra
  const fl = (cx, base, hgt, wd, ph) => {
    const j = Math.sin(fr * 1.6 + ph) * 2, pts = [[cx - wd, base], [cx - wd * .75, base - hgt * .4], [cx - wd * .3, base - hgt * .72 + j * .3], [cx + j * .6, base - hgt], [cx + wd * .35, base - hgt * .6], [cx + wd * .8, base - hgt * .35], [cx + wd, base]];
    bpGlow(b, P(pts), E, { edge: 1.2, top: 5.4, p: 1.2, halo: [255, 130, 40], hr: 2, ha: 100 });
  };
  fl(-3, -52, ph2 ? 16 : 11, 4.4, 0); fl(4, -51, ph2 ? 20 : 14, 4, 2); if (ph2) { fl(-10, -47, 12, 3.6, 4); fl(11, -46, 13, 3.6, 5); }
  for (let k = 0; k < (ph2 ? 7 : 5); k++) {
    const ex = -24 + k * (ph2 ? 8 : 11) + Math.sin(fr * 1.7 + k * 1.9) * 2.5, ey = 51 + (k % 2) * 5 + Math.cos(fr * 1.3 + k) * 2.5, r = 2.6 - (k % 2) * .5;
    bpGlow(b, EL(ex, ey, r, r * 1.2), E, { edge: 1.4, top: 5.2, halo: [255, 120, 30], hr: 2, ha: 90 });
  }
  return b;
}
function guardLantern() {
  const b = bpNew(14, 15), pal = { I: BR.iron[1], A: BR.ember[1], H: BR.ember[4], W: BR.ember[6] };
  bpStamp(b, 0, 0, GD_LANTERN, pal);
  for (let y = 4; y < 12; y++) { bpSet(b, 4, y, BR.iron, 1); bpSet(b, 9, y, BR.iron, 1); }   // barras da lanterna
  for (let y = 5; y < 12; y++) for (let x = 5; x < 9; x++) b.em[y * 14 + x] = 1;
  return b;
}

// ---------- Rei Slime: gelatina escura com coração luminoso e coroa ----------
const SL = { W: 112, H: 106, CX: 56, CY: 90 };   // CX,CY: centro da base do domo (a "aba" de 3 px fica abaixo)
function slimeSprite(sq) {
  const b = bpNew(SL.W, SL.H), W = b.w, H = b.h, X = SL.CX, Y = SL.CY, G = BR.gel;
  const w = 70 * (1 - sq * .5), hd = 47 * (1 + sq), hw = w / 2, p = 2.3, coreY = Y - hd * .3;
  // domo achatado (superelipse) + beiral na base, com normais para a luz
  const m = new Uint8Array(W * H), z = new Float32Array(W * H), nxA = new Float32Array(W * H), nyA = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + .5 - X) / hw, v = (Y - (y + .5)) / hd, i = y * W + x;
    if (v < 0 || v > 1.02) { if (v < 0 && v > -.06 && Math.abs(u) <= 1.04) { m[i] = 1; z[i] = 0; nxA[i] = u * .3; nyA[i] = -.2; } continue; }
    const s = Math.pow(Math.pow(Math.abs(u), p) + Math.pow(v, p), 1 / p);
    if (s <= 1) { m[i] = 1; z[i] = Math.pow(Math.max(0, 1 - Math.pow(s, p)), 1 / p); nxA[i] = u * .9; nyA[i] = v * 1.1; }
  }
  const L = [-.52, .66, .54], ln = Math.hypot(L[0], L[1], L[2]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!m[i]) continue;
    const u = (x + .5 - X) / hw, v = (Y - (y + .5)) / hd, nz = Math.max(.15, z[i]), nx = nxA[i], ny = nyA[i], nl = Math.hypot(nx, ny, nz);
    const I = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / (nl * ln)), dx = x + .5 - X, dy = y + .5 - coreY;
    let t = .5 + I * 3 - v * .45 + (1 - nz) * (u > 0 && v < .55 ? 1.5 : -.1) + 1.7 * Math.exp(-(dx * dx + dy * dy) / 330);   // luz do coração vaza para a gelatina
    t += (hash2(x, y, 31) - .5) * .5;
    bpSet(b, x, y, G, t);
  }
  bpEdge(b, m, G, 0, 'all');
  // coração luminoso (cresce com a gelatina esticada) e bolhas
  bpGlow(b, bpEll(W, H, X, coreY, 6.5, 5.5 * (1 + sq * .4)), BR.cyan, { edge: 1, top: 4.8, p: .8, halo: [90, 220, 240], hr: 4, ha: 150 });
  for (const [bx, by, r] of [[-.5, .25, 2.4], [.46, .5, 3], [.2, .16, 1.8], [-.2, .62, 1.6], [.62, .22, 1.6]]) {
    const cx = X + bx * hw * .85, cy = Y - by * hd, bm = bpEll(W, H, cx, cy, r, r);
    bpEdge(b, bm, G, 5, 'all'); bpPut(b, Math.round(cx - r * .4), Math.round(cy - r * .4), [236, 250, 255], 255);
  }
  // reflexos: faixa curva na borda de cima-esquerda e brilho
  for (let a = 2.35; a < 3.0; a += .05) { const px = Math.round(X + Math.cos(a) * hw * .86), py = Math.round(Y - Math.sin(a) * hd * .86); bpSet(b, px, py, G, 5.6); bpSet(b, px + 1, py, G, 5); }
  bpPut(b, Math.round(X - hw * .5), Math.round(Y - hd * .78), [236, 250, 255], 255); bpPut(b, Math.round(X - hw * .5) + 1, Math.round(Y - hd * .78) + 1, [236, 250, 255], 255);
  // rosto: sobrancelhas inclinadas, olhos brilhantes e sorriso de dentes
  const ey = Y - hd * .52;
  for (const s of [-1, 1]) {
    const ex = X + s * hw * .27;
    bpGlow(b, bpEll(W, H, ex, ey, 4.2, 2.8), BR.cyan, { edge: 0, top: 5.4, p: .6, halo: [100, 230, 245], hr: 2, ha: 140 });
    for (let k = -5; k <= 5; k++) bpSet(b, Math.round(ex + k), Math.round(ey - 5 - (s * k) * .35), G, 0);   // sobrancelha
    bpSet(b, Math.round(ex + s), Math.round(ey), G, 0); bpSet(b, Math.round(ex + s), Math.round(ey + 1), G, 0);   // pupila
  }
  for (let k = -9; k <= 9; k++) bpSet(b, Math.round(X + k), Math.round(coreY + 6 + Math.abs(k) * .12 - 1.5), G, 0);
  for (const k of [-6, -2, 2, 6]) bpPut(b, X + k, Math.round(coreY + 6.5 + Math.abs(k) * .12), [214, 240, 250], 255);
  // coroa de ouro escuro, com joias
  const CROWN = ['..K........K........K..', '.KDK......KDK......KDK.', '.KGDK....KGGDK....KGGK.', '.KGGDK..KGGGGDK..KGGGK.', '.KGGGDKKGGGGGGDKKGGGGK.', '.KGHGGGGGGGGGGGGGGGHGK.', '.KGGGGGGGJGGGGGGGGGGGK.', '.KGGGDGGGGGGGGGGGDGGGK.', '.KKKKKKKKKKKKKKKKKKKKK.'];
  const cx0 = Math.round(X - 11 - sq * 2), cy0 = Math.round(Y - hd - 6);
  bpStamp(b, cx0, cy0, CROWN, { K: BR.gold[0], D: BR.gold[1], G: BR.gold[2], H: BR.gold[4], J: BR.cyan[4] });
  bpGlow(b, bpEll(W, H, cx0 + 11, cy0 + 6, 1.4, 1.4), BR.cyan, { edge: 3, top: 5.4, halo: [100, 230, 245], hr: 2, ha: 130 });
  return b;
}

// ---------- Olho Colossal: globo ocular escuro com veias, íris de brasa e nervos pendurados ----------
const EY = { W: 132, H: 148, CX: 66, CY: 60 };
function eyeSprite(ph2, fr) {
  const b = bpNew(EY.W, EY.H), W = b.w, H = b.h, X = EY.CX, Y = EY.CY, F = BR.flesh, V = BR.vein, M = BR.maw;
  const er = ph2 ? 20 : 28, ey = ph2 ? Y - 9 : Y;
  // nervos ópticos (atrás): fitas que balançam e terminam em brilho
  const nn = ph2 ? 6 : 5;
  for (let k = 0; k < nn; k++) {
    const bx = X + (k - (nn - 1) / 2) * (ph2 ? 8 : 9), len = (ph2 ? 36 : 30) + (k % 3) * 9, pts = [];
    for (let s = 0; s <= 5; s++) { const t = s / 5; pts.push([bx + Math.sin(fr * 1.57 + k * 1.3 + t * 3.2) * (2 + t * 4.5) + (k - (nn - 1) / 2) * t * 3, Y + (ph2 ? 30 : 22) + t * len]); }
    const m = bpStroke(W, H, bpCurve(pts, 4), (t) => 5 - 3.8 * t);
    bpFill(b, m, V, 1.4, { hi: .9, lo: .8, noise: .25, sd: 20 + k }); bpEdge(b, m, V, 0, 'dr');
    bpGlow(b, bpEll(W, H, Math.round(pts[5][0]), Math.round(pts[5][1]), 2.2, 2.2), BR.crim, { edge: 2, top: 4.6, halo: [255, 80, 100], hr: 2, ha: 130 });
  }
  if (ph2) {   // fase 2: bocarra com dentes sob o olho
    const head = bpEll(W, H, X, Y + 10, 31, 27); bpFill(b, head, M, 1.6, { hi: 1, lo: 1.2, g0: .5, g1: -.8, noise: .35, sd: 41, r2: true }); bpEdge(b, head, M, 0, 'all');
    bpFill(b, bpEll(W, H, X, Y + 21, 23, 13), M, 0, { hi: .3, lo: 0 });
    bpGlow(b, bpEll(W, H, X, Y + 25, 14, 5), M, { edge: 1.5, top: 5, p: .8, halo: [255, 120, 60], hr: 3, ha: 120 });
    for (let k = 0; k < 8; k++) {
      const tx = X - 19 + k * 5.4, th = 6 + (k % 2) * 3; bpFill(b, bpPoly(W, H, [[tx - 2.2, Y + 9.5], [tx + 2.2, Y + 9.5], [tx, Y + 9.5 + th]]), F, 5, { hi: .5, lo: .8 });
      bpFill(b, bpPoly(W, H, [[tx - 2, Y + 33], [tx + 2, Y + 33], [tx + .5, Y + 33 - th * .8]]), F, 5, { hi: .5, lo: .8 });
    }
  }
  // globo ocular: esfera escura iluminada de cima-esquerda, borda mais escura, veias
  const m = bpEll(W, H, X, ey, er, er), L = [-.5, .66, .56], ln = Math.hypot(L[0], L[1], L[2]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m[y * W + x]) continue;
    const u = (x + .5 - X) / er, v = (ey - (y + .5)) / er, nz = Math.sqrt(Math.max(0, 1 - u * u - v * v)), I = Math.max(0, (u * L[0] + v * L[1] + nz * L[2]) / ln);
    bpSet(b, x, y, F, .75 + I * 4 - Math.pow(1 - nz, 1.6) * 1.5 + (hash2(x, y, 51) - .5) * .5);
  }
  bpEdge(b, m, F, 0, 'all');
  for (let k = 0; k < 11; k++) {
    const a = k / 11 * TAU + hash2(k, 7, 52) * .5, r0 = er * .96, pts = [];
    for (let s = 0; s <= 4; s++) { const t = s / 4; pts.push([X + Math.cos(a + Math.sin(t * 5 + k) * .16) * (r0 - t * er * .62), ey + Math.sin(a + Math.sin(t * 5 + k) * .16) * (r0 - t * er * .62)]); }
    const cp = bpCurve(pts, 4); for (let s = 0; s < cp.length; s++) { const t = s / cp.length; bpSet(b, Math.round(cp[s][0]), Math.round(cp[s][1]), V, 2.6 - t * 1.8); }
  }
  bpPut(b, Math.round(X - er * .52), Math.round(ey - er * .62), [236, 226, 240], 255); bpPut(b, Math.round(X - er * .52) + 1, Math.round(ey - er * .62), [236, 226, 240], 255);
  return { b, ex: X, ey, er };
}
function eyeIris(r) {   // íris de brasa com pupila em fenda e brilho (desenhada por cima, seguindo o jogador)
  const S = Math.ceil(r * 2 + 4), b = bpNew(S, S), c = S / 2, Cr = BR.crim, m = bpEll(S, S, c, c, r, r), d = bpDist(m, S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!m[y * S + x]) continue;
    const u = x + .5 - c, v = y + .5 - c, rr = Math.hypot(u, v) / r, a = Math.atan2(v, u), streak = Math.sin(a * 11 + hash2(Math.floor(a * 5), 3, 61) * 6) * .5 + .5;
    bpSet(b, x, y, Cr, 1 + (1 - rr) * 3.4 + streak * .8 - (d[y * S + x] === 1 ? 1.5 : 0)); b.em[y * S + x] = 1;
  }
  bpFill(b, bpEll(S, S, c, c, Math.max(1.4, r * .17), r * .56), [[4, 0, 6]], 0, { hi: 0, lo: 0 });
  bpPut(b, Math.round(c - r * .42), Math.round(c - r * .45), [255, 240, 240], 255); bpPut(b, Math.round(c - r * .42) + 1, Math.round(c - r * .45) + 1, [255, 200, 210], 255);
  return b;
}

// ---------- Colosso Estelar: máscara de pedra índigo com olho de ouro e cauda de nebulosa ----------
const CO = { W: 184, H: 192, CX: 92, CY: 88 };
function colossusSprite(ph, fr) {
  const b = bpNew(CO.W, CO.H), W = b.w, H = b.h, X = CO.CX, Y = CO.CY, St = BR.stone, Go = BR.gold, Nb = BR.nebula;
  const P = (pts) => bpPoly(W, H, pts.map(p => [X + p[0], Y + p[1]]));
  const EL = (cx, cy, rx, ry) => bpEll(W, H, X + cx, Y + cy, rx, ry);
  const LN = (x0, y0, x1, y1, ramp, t) => bpLine(b, X + x0, Y + y0, X + x1, Y + y1, ramp, t);
  // cauda de nebulosa que se desfaz em pontos
  const sway = Math.round(Math.sin(fr * 1.57) * 2);
  const tail = P([[-36, 20], [36, 20], [41, 33], [35, 46], [38, 58], [28, 69], [23, 82], [13, 92 + sway], [4, 108 + sway], [-4, 95], [-13, 85], [-25, 75], [-29, 62], [-39, 52], [-35, 37]]);
  bpFill(b, tail, Nb, 3.1, { hi: .8, lo: .5, g0: .9, g1: -2.4, noise: 1.3, sd: 71, r2: true });
  const dd = bpDist(tail, W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!tail[i]) continue; const k = dd[i]; if (k <= 6 && (BP_BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 > k / 7) { b.d[i * 4 + 3] = 0; b.rp[i] = null; } }
  for (let k = 0; k < 5; k++) { const wp = bpCurve([[X - 22 + k * 11, Y + 24], [X - 18 + k * 9 + Math.sin(fr * 1.57 + k) * 4, Y + 46], [X - 8 + k * 5, Y + 70 + k % 2 * 6]], 8); for (let s = 0; s < wp.length; s++) if ((s + k) % 2 === 0) bpPut(b, Math.round(wp[s][0]), Math.round(wp[s][1]), Nb[4], 210); }
  _bossStar(b, 34, 72, X - 34, Y + 22, X + 34, Y + 98, [255, 240, 190]);
  // busto: placa do peito com ombreiras pontudas e frisos de ouro
  for (const s of [-1, 1]) for (const [x0, y0, x1, y1, x2, y2] of [[34, 15, 47, -4, 45, 22], [26, 13, 33, -12, 38, 16]]) {
    const sh = P([[s * x0, y0], [s * x1, y1], [s * x2, y2]]); bpFill(b, sh, St, 2.2, { hi: 1.1, lo: 1, r2: true }); bpEdge(b, sh, Go, 3, 'ul');
  }
  const chest = P([[-40, 14], [40, 14], [48, 26], [44, 36], [26, 50], [-26, 50], [-44, 36], [-48, 26]]);
  bpFill(b, chest, St, 2, { hi: 1.1, lo: 1.1, g0: .6, g1: -.8, noise: .45, sd: 73, r2: true }); bpEdge(b, chest, St, 0, 'dr');
  for (const s of [-1, 1]) { LN(s * 12, 18, s * 21, 46, Go, 2); LN(s * 13, 18, s * 22, 46, Go, 1); LN(s * 30, 18, s * 36, 34, Go, 1); }
  bpGlow(b, EL(0, 31, 4.4, 4.4), Go, { edge: 1, top: 5, halo: [255, 200, 80], hr: 3, ha: 150 });
  // espinhos da coroa (cacos de pedra inclinados, com fio dourado)
  for (const [sx, h2, w2, lean] of [[-30, 22, 5.5, -3], [-17, 33, 5.5, -2], [0, 42, 6.4, 0], [17, 33, 5.5, 2], [30, 22, 5.5, 3]]) {
    const sh = P([[sx - w2, -42], [sx + w2, -42], [sx + lean + w2 * .15, -42 - h2]]); bpFill(b, sh, St, 3, { hi: 1.3, lo: 1, r2: true }); bpEdge(b, sh, Go, 3, 'ul');
  }
  // cabeça: máscara severa
  const head = P([[-24, -44], [-12, -50], [12, -50], [24, -44], [32, -26], [30, -6], [22, 12], [10, 22], [0, 27], [-10, 22], [-22, 12], [-30, -6], [-32, -26]]);
  bpFill(b, head, St, 2.6, { hi: 1.3, lo: 1.2, g0: .8, g1: -1.1, noise: .5, sd: 75, r2: true }); bpEdge(b, head, St, 0, 'dr');
  bpFill(b, P([[-29, -26], [29, -26], [27, -17], [-27, -17]]), St, 1, { hi: 0, lo: .5, noise: .3, sd: 76 });   // sobrancelha pesada
  LN(-29, -27, 29, -27, Go, 2.2);
  for (const s of [-1, 1]) bpFill(b, P([[s * 31, -8], [s * 22, -2], [s * 17, 12], [s * 24, 11]]), St, 1.2, { hi: .3, lo: .6, noise: .3, sd: 78 + s });   // placas das bochechas
  bpFill(b, P([[-3, -1], [3, -1], [5, 12], [-5, 12]]), St, 1, { hi: 0, lo: .5 });   // ponte do nariz
  const sock = EL(0, -6, 18, 14); bpFill(b, sock, St, 0, { hi: 0, lo: 0 }); bpEdge(b, sock, Go, 2.4, 'all');   // órbita escura com aro dourado
  bpGlow(b, EL(0, -6, 14, 10), Go, { edge: 1.2, top: 5.2, p: .55, halo: [255, 210, 90], hr: 3, ha: 150 });   // globo do olho
  bpFill(b, P([[-13, 11], [13, 11], [10, 22], [-10, 22]]), St, 0, { hi: 0, lo: 0 });   // boca em grade
  for (let k = -8; k <= 8; k += 4) LN(k, 12, k * .8, 21, Go, 1.6);
  // runas e constelação na testa
  const rune = [[0, -39], [-7, -34], [7, -34], [0, -29]];
  for (let i = 0; i < 3; i++) LN(rune[i][0], rune[i][1], rune[i + 1][0], rune[i + 1][1], Go, 3.6);
  for (const [rx, ry] of rune) bpGlow(b, EL(rx, ry, 1.4, 1.4), Go, { edge: 2, top: 5.4, halo: [255, 210, 90], hr: 2, ha: 140 });
  // rachaduras de ouro (crescem com as fases)
  const cracks = [[[-6, 6], [-14, 12], [-12, 19], [-20, 24]], [[8, 4], [16, 10], [14, 17], [22, 20]], [[-4, -18], [-8, -25], [-5, -33]], [[18, -18], [24, -26], [22, -34]], [[-20, -17], [-27, -22], [-25, -29]], [[0, 14], [-4, 20], [1, 25]]];
  const nC = ph === 1 ? 0 : ph === 2 ? 2 : 6;
  for (let k = 0; k < nC; k++) {
    const cp = cracks[k].map(p => [X + p[0], Y + p[1]]);
    for (let i = 0; i + 1 < cp.length; i++) { bpLine(b, cp[i][0] + 1, cp[i][1], cp[i + 1][0] + 1, cp[i + 1][1], Go, 2.2); bpLine(b, cp[i][0], cp[i][1], cp[i + 1][0], cp[i + 1][1], Go, 4.6); }
    for (let i = 0; i < b.em.length; i++) if (b.rp[i] === Go && b.t[i] > 4) b.em[i] = 1;
    const e = cp[cp.length - 1]; bpGlow(b, bpEll(W, H, e[0], e[1], 1.6, 1.6), Go, { edge: 2, top: 5.4, halo: [255, 210, 90], hr: 2, ha: 120 });
  }
  _bossStar(b, 30, 78, 6, 6, W - 6, H - 60, [255, 236, 170]);
  return b;
}
function colossusIris() {   // íris índigo com pupila e brilho (segue o jogador dentro da órbita)
  const b = bpNew(14, 14), c = 7, m = bpEll(14, 14, c, c, 6, 6), d = bpDist(m, 14, 14);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { if (!m[y * 14 + x]) continue; const rr = Math.hypot(x + .5 - c, y + .5 - c) / 6; bpSet(b, x, y, BR.stone, 2.4 + (1 - rr) * 2.6 - (d[y * 14 + x] === 1 ? 2 : 0)); }
  bpFill(b, bpEll(14, 14, c, c, 2.4, 2.8), [[3, 2, 10]], 0, { hi: 0, lo: 0 }); bpPut(b, 4, 4, [236, 236, 255], 255); bpPut(b, 5, 4, [200, 200, 255], 255);
  return b;
}
function bossOrb(r) {   // orbe dourado das órbitas do Colosso
  const S = Math.ceil(r * 2 + 8), b = bpNew(S, S);
  bpGlow(b, bpEll(S, S, S / 2, S / 2, r, r), BR.gold, { edge: 1.4, top: 5.4, p: .8, halo: [255, 210, 90], hr: 3, ha: 150 });
  return b;
}

// ---------- cache de quadros ----------
// kind: 'gd' (fr, ph2) | 'sl' (nível de achatamento -7..7) | 'ey' (ph2, fr) | 'co' (fase 1-3, fr)
function bossSpr(kind, a, c) {
  const key = kind + a + '_' + c; let s = BOSSART.cache.get(key); if (s) return s;
  if (kind === 'gd') s = bpPack(guardSprite(a, c));
  else if (kind === 'sl') s = bpPack(slimeSprite(a / 20));
  else if (kind === 'ey') { const r = eyeSprite(a, c); s = bpPack(r.b); s.ex = r.ex; s.ey = r.ey; s.er = r.er; }
  else s = bpPack(colossusSprite(a, c));
  BOSSART.cache.set(key, s); return s;
}
function bossPart(key, make) { return bossCache(key, () => bpPack(make())); }
const BOSSFRAMES = {
  gd: () => { const l = []; for (let p = 0; p < 2; p++) for (let f = 0; f < 4; f++) l.push([f, p]); return l; },
  sl: () => { const l = [0]; for (let q = 1; q <= 7; q++) l.push(q, -q); return l.map(q => [q, 0]); },
  ey: () => { const l = []; for (let p = 0; p < 2; p++) for (let f = 0; f < 4; f++) l.push([p, f]); return l; },
  co: () => { const l = []; for (let p = 1; p <= 3; p++) for (let f = 0; f < 4; f++) l.push([p, f]); return l; },
};
const BOSSKIND = { kslime: 'sl', beye: 'ey', bguard: 'gd', bcolossus: 'co' };   /* ED[...].draw -> tipo de cache */
function bossWarmAll(kind) {   // gera todos os quadros de uma vez: chamado ao invocar o chefe, escondido pelo clarão preto
  for (const [a, c] of BOSSFRAMES[kind]()) bossSpr(kind, a, c);
  if (kind === 'ey') { bossPart('iris13', () => eyeIris(13)); bossPart('iris9', () => eyeIris(9)); }
  else if (kind === 'gd') bossPart('lantern', guardLantern);
  else if (kind === 'co') { bossPart('coiris', colossusIris); bossPart('orb4', () => bossOrb(4)); }
}
function bossWarm(kind) {   // gera UM quadro que ainda falta por chamada (evita engasgo ao surgir um quadro novo)
  const q = BOSSART.wq || (BOSSART.wq = {}), l = q[kind] || (q[kind] = BOSSFRAMES[kind]());
  while (l.length) { const [a, c] = l.shift(); if (!BOSSART.cache.has(kind + a + '_' + c)) { bossSpr(kind, a, c); return; } }
}
