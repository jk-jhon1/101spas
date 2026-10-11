/* ============================================================
   05g_bxart1: sprites dos chefes novos do Ato I (ver 05f_bxart.js para as ajudas de pintura)
   Coordenadas relativas ao centro da caixa de colisão; o corpo fica em tons escuros e o brilho (h.G / h.eye) usa a cor do chefe.
   ============================================================ */
// ---- 1. Rainha Vespa: inseto-rainha de abdômen listrado que brilha em âmbar ----
bxArt('vespa', 140, 112, 70, 56, 4, (h, fr) => {
  const R = h.R, fl = Math.sin(fr / 4 * TAU), wy = Math.round(fl * 5);
  for (const [x0, w, k] of [[-6, 1, 1], [2, .75, .72]]) {   // asas translúcidas
    const wing = h.P([[x0, -8], [x0 - 22 * w, -26 * k + wy], [x0 - 10 * w, -46 * k + wy * 1.4], [x0 + 10 * w, -42 * k + wy * 1.4], [x0 + 18 * w, -24 * k + wy], [x0 + 6, -8]]);
    h.A(wing, [200, 226, 236], 100); h.A(h.E(x0 + 2, -28 * k + wy, 5, 11 * k), [255, 255, 255], 46);
    h.L(x0, -9, x0 - 9 * w, -36 * k + wy, R.bone, 3); h.L(x0 + 2, -9, x0 + 7 * w, -34 * k + wy, R.bone, 3);
  }
  for (const [x, dx] of [[0, -6], [5, -1], [10, 5]]) h.F(h.S(x, 6, x + dx, 22, 2), R.iron, 1.5, { hi: .5, lo: .5 });
  const abd = h.P([[-3, -1], [-14, -5], [-28, 0], [-38, 11], [-36, 22], [-24, 28], [-11, 22], [-3, 10]]);
  h.F(abd, R.ink, 1.9, { hi: 1.3, lo: 1.2, ol: 0, noise: .2 });
  for (const sx of [-13, -21, -29]) h.G(h.I(abd, h.P([[sx, -12], [sx + 5, -12], [sx + 3, 36], [sx - 2, 36]])), { hr: 1, ha: 60, top: 4.6 });
  h.G(h.P([[-36, 19], [-52, 33], [-34, 27]]), { hr: 2, ha: 110 });
  h.F(h.E(4, -2, 11, 10), R.ember, 1.5, { hi: 1.3, lo: 1.1, ol: 0, noise: .5 });
  h.F(h.P([[-3, -9], [4, -11], [2, 8], [-5, 6]]), R.ink, 1.4, { noise: .3 });
  h.F(h.E(18, -3, 9, 8.5), R.ember, 2, { hi: 1.2, lo: 1.2, ol: 0 });
  h.eye(22, -5, 4.2, 5.2, { px: 1 });
  h.F(h.P([[13, 4], [24, 4], [22, 10], [15, 9]]), R.ink, 1.6, { ol: 0 }); h.F(h.P([[17, 5], [19, 11], [21, 5]]), R.bone, 3, {});
  for (const k of [-1, 1]) h.F(h.C([[16 + k * 3, -10], [20 + k * 4, -20], [30, -25 + k * 5]], 1.6, 1.1), R.iron, 2, { hi: .6, lo: .4 });
  h.F(h.P([[11, -9], [13, -17], [16, -11], [19, -19], [22, -11], [25, -17], [26, -9]]), R.gold, 3, { hi: 1, lo: .6, ol: 0 });
  h.G(h.E(19, -13, 1.6, 1.6), { hr: 1, ha: 90 });
}, { acc: '#fbbf24', acc2: '#3b2a10', fps: 8 });

// ---- 2. Velho Carvalho: árvore ancestral que anda, copa pesada e olhos verdes ----
bxArt('carvalho', 190, 180, 95, 108, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU);
  for (const s of [-1, 1]) h.F(h.P([[s * 22, 28], [s * 8, 28], [s * 4, 42], [s * 14, 50], [s * 32, 49], [s * 36, 40]]), R.bark, 1.4, { ol: 0, noise: .45 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 20, -10], [s * 38, -20 + sw * 3 * s], [s * 52, -38]], 8, 3.5, 5), R.bark, 1.4, { ol: 0, noise: .4 }); h.F(h.E(s * 55, -42 + sw * 2, 11, 9), R.leaf, 1.4, { ol: 0, noise: .55, r2: true }); h.G(h.E(s * 58, -45 + sw * 2, 1.6, 1.6), { hr: 1, ha: 80 }); }
  const tr = h.P([[-22, 34], [-27, 10], [-25, -14], [-19, -34], [-10, -44], [10, -44], [19, -34], [25, -14], [27, 10], [22, 34]]);
  h.F(tr, R.bark, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .5, r2: true });
  for (const x of [-17, -9, 2, 12, 20]) h.L(x, -32 + (x & 3), x + 2, 22 + (x & 5), R.bark, .4);
  h.D(h.I(tr, h.P([[-30, -22], [30, -22], [30, -2], [-30, -2]])), R.moss, 1.6, .22, 12);
  h.F(h.E(-16, 14, 5, 7), R.shade, 1, { ol: 0 });   // buraco no tronco
  for (const [x, y, rx, ry, t] of [[-28, -62, 22, 15, 1.1], [0, -76, 27, 19, 1.4], [28, -62, 22, 15, 1.1], [-10, -56, 20, 13, 1.6], [16, -54, 19, 12, 1.5], [-2, -64, 14, 9, 1.9]]) h.F(h.E(x, y + sw * 1.5, rx, ry), R.leaf, t, { hi: 1.1, lo: 1.2, ol: 0, noise: .6, r2: true });
  for (const [x, y] of [[-30, -68], [-6, -84], [22, -74], [34, -60], [-16, -50], [10, -58]]) h.G(h.E(x, y + sw * 1.5, 1.5, 1.5), { hr: 1, ha: 70 });
  h.eye(-9, -20, 4.4, 3.4, { pupil: false }); h.eye(9, -20, 4.4, 3.4, { pupil: false });
  h.F(h.P([[-9, -12], [9, -12], [8, -3], [0, 0], [-8, -3]]), R.shade, 1, { ol: 0 }); h.G(h.S(-5, -6, 5, -6, 1.2), { hr: 1, ha: 50, top: 4 });
  h.F(h.P([[-14, -29], [-6, -25], [-2, -31]]), R.bark, .6, {}); h.F(h.P([[14, -29], [6, -25], [2, -31]]), R.bark, .6, {});   // sobrancelhas de casca
}, { acc: '#a3e635', acc2: '#1a2e05', fps: 4 });

// ---- 3. Caranguejo-Rei: casco que fecha (variante 1) e abre as garras (variante 0) ----
bxArt('caranguejo', 170, 118, 85, 66, 3, (h, fr, v) => {
  const R = h.R, sw = Math.round(Math.sin(fr / 3 * TAU) * 1.5), closed = v === 1, C = R.wine;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x0 = s * (14 + i * 7), kx = s * (26 + i * 8), ky = 6 + i * 2 + (i === 1 ? sw : -sw); h.F(h.C([[x0, 6], [kx, ky - 3], [s * (30 + i * 9), 24]], 3.2, 1.8, 4), C, 1.2, { hi: .8, lo: .8, ol: 0 }); }
  for (const s of [-1, 1]) {
    if (!closed) {
      h.F(h.C([[s * 24, -2], [s * 40, -16], [s * 50, -34]], 6, 8, 4), C, 1.5, { ol: 0 });
      h.F(h.P([[s * 44, -34], [s * 60, -48 + sw], [s * 64, -36], [s * 52, -26]]), C, 1.9, { ol: 0 });
      h.F(h.P([[s * 46, -30], [s * 66, -28 + sw], [s * 60, -18], [s * 50, -22]]), C, 1.4, { ol: 0 });
      h.G(h.P([[s * 58, -46 + sw], [s * 62, -44 + sw], [s * 63, -37]]), { hr: 1, ha: 80 });
    } else { h.F(h.E(s * 22, -10, 13, 10), C, 1.7, { ol: 0, r2: true }); h.F(h.P([[s * 16, -14], [s * 32, -12], [s * 30, -3], [s * 14, -5]]), C, 1.1, { ol: 0 }); }
  }
  const shell = h.P([[-30, 6], [-32, -4], [-26, -16], [-14, -24], [0, -26], [14, -24], [26, -16], [32, -4], [30, 6], [20, 14], [0, 18], [-20, 14]]);
  h.F(shell, C, closed ? 1.1 : 1.7, { hi: 1.2, lo: 1.3, ol: 0, noise: .22, r2: true });
  for (const x of [-16, -6, 6, 16]) h.F(h.C([[x * .8, -22], [x, -8], [x * 1.1, 8]], 1.4, 1, 4), C, .5, {});
  h.D(shell, C, 2.6, .05, 31);
  if (!closed) for (const s of [-1, 1]) { h.F(h.S(s * 8, -22, s * 10, -32, 2.4), C, 1, { hi: .5, lo: .3 }); h.eye(s * 10, -34, 3.4, 3.4, { pupil: false, hr: 2, ha: 100 }); }
  h.G(h.P([[-4, -18], [-1, -12], [-3, -6], [0, 0], [-2, 4], [2, -2], [0, -7], [3, -13], [1, -18]]), { hr: 1, ha: 70, top: 4.6 });
  if (closed) h.G(h.S(-16, 3, 16, 3, 1.4), { hr: 1, ha: 60, top: 4.4 });
}, { acc: '#fb7185', acc2: '#3a0d14', vars: 2, fps: 5 });

// ---- 4. Tecelã de Teias: aranha de ampulheta violeta e oito olhos ----
bxArt('teceda', 180, 130, 90, 64, 4, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 4 * TAU);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const j = (i % 2 ? 1 : -1) * sw * 2.5, kx = s * (26 + i * 5), ky = -26 + i * 9 + j, fx = s * (52 + i * 6), fy = 18 + i * 3 - j;
    h.F(h.C([[s * 8, -4 + i * 3], [kx, ky], [fx, fy]], 3.4, 1.6, 4), R.cloth, 1.3, { hi: .9, lo: .6, ol: 0 }); h.G(h.E(kx, ky, 1.3, 1.3), { hr: 1, ha: 60 });
  }
  const ab = h.E(0, 6, 19, 22); h.F(ab, R.cloth, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .4, r2: true }); h.D(ab, R.violet, 2.2, .1, 5);
  h.G(h.P([[-8, -4], [8, -4], [2, 6], [8, 18], [-8, 18], [-2, 6]]), { hr: 1, ha: 100, top: 4.8 });   // ampulheta
  h.F(h.E(0, -16, 12, 10), R.cloth, 1.6, { hi: 1.3, lo: 1.2, ol: 0, noise: .3 });
  for (const [x, y, r] of [[-6, -20, 2.1], [6, -20, 2.1], [-3, -15, 1.5], [3, -15, 1.5], [-10, -16, 1.3], [10, -16, 1.3]]) h.eye(x, y, r, r, { pupil: false, hr: 1, ha: 70 });
  for (const s of [-1, 1]) h.F(h.C([[s * 4, -9], [s * 7, -3], [s * 4, 3]], 2.4, 1, 3), R.bone, 2.4, { ol: 0 });
  h.F(h.S(0, -34, 0, -52, 1), R.bone, 1, {});   // fio de seda
}, { acc: '#c084fc', acc2: '#1e0b3a', fps: 5 });

// ---- 5. Escorpião das Dunas: cauda arqueada com ferrão que brilha em âmbar ----
bxArt('escorpiao', 200, 140, 100, 84, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2, C = R.rust;
  for (let i = 0; i < 4; i++) h.F(h.C([[-18 + i * 12, 8], [-24 + i * 13, 20 + (i & 1)], [-28 + i * 14, 30]], 3, 1.6, 3), C, 1.1, { hi: .8, lo: .6, ol: 0 });
  const tail = [[-30, 2], [-42, -10], [-44, -28 + sw], [-34, -44 + sw], [-18, -50 + sw], [-6, -44 + sw]];
  const tp = h.C(tail, 7, 5, 6); h.F(tp, C, 1.3, { hi: 1, lo: 1.2, ol: 0, noise: .25, r2: true });
  for (const [x, y] of [[-42, -10], [-44, -28 + sw], [-34, -44 + sw], [-18, -50 + sw]]) h.F(h.E(x, y, 5.5, 5), C, 1.5, { hi: 1.2, lo: 1.1, ol: 0 });
  h.G(h.P([[-8, -44 + sw], [-1, -40 + sw], [6, -34 + sw], [-3, -39 + sw], [-8, -37 + sw]]), { hr: 2, ha: 110, top: 5 });   // ferrão
  const body = h.P([[-30, 6], [-30, -6], [-18, -14], [0, -16], [18, -12], [30, -4], [28, 8], [10, 14], [-12, 14]]);
  h.F(body, C, 1.5, { hi: 1.2, lo: 1.3, ol: 0, noise: .3, r2: true });
  for (const x of [-18, -8, 2, 12]) h.L(x, -14, x + 2, 12, C, .5);
  h.D(body, R.ochre, 2.2, .08, 9);
  for (const k of [0, 1]) { const y0 = k ? 7 : -5, t = k * .4; h.F(h.C([[24, y0 * .4], [38, y0 - 4], [50, y0 - 2]], 5, 6, 4), C, 1.1 + t, { ol: 0 }); h.F(h.E(52, y0 - 2, 8, 6.5), C, 1.4 + t, { hi: 1.2, ol: 0, noise: .25 }); h.F(h.P([[56, y0 - 8], [76, y0 - 7], [66, y0 - 1], [58, y0 - 2]]), C, 1.7 + t, { ol: 0 }); h.F(h.P([[58, y0 + 1], [74, y0 + 6], [64, y0 + 7], [56, y0 + 3]]), C, 1.2 + t, { ol: 0 }); }
  h.F(h.E(22, -6, 8, 7), C, 1.8, { hi: 1.2, ol: 0 }); h.eye(26, -9, 2.6, 2.6, { pupil: false, hr: 1, ha: 80 }); h.eye(20, -10, 2.2, 2.2, { pupil: false, hr: 1, ha: 80 });
}, { acc: '#eab308', acc2: '#3b2410', fps: 5 });

// ---- 6. Rei Cogumelo: chapéu com pintas luminosas e rosto no pé ----
bxArt('cogumelo', 180, 160, 90, 92, 3, (h, fr) => {
  const R = h.R, bo = Math.round(Math.sin(fr / 3 * TAU) * 1.5);
  h.F(h.P([[-14, 34], [-18, 8], [-14, -12], [14, -12], [18, 8], [14, 34], [4, 38], [-4, 38]]), R.sand, 1.7, { hi: 1.1, lo: 1.1, ol: 0, noise: .4, r2: true });
  for (const s of [-1, 1]) { h.F(h.C([[s * 16, 4], [s * 28, 12], [s * 30, 24]], 5, 3.5, 3), R.sand, 1.3, { ol: 0 }); h.F(h.E(s * 30, 26, 4.5, 4), R.sand, 1.5, { ol: 0 }); }
  h.F(h.E(-9, 36, 9, 5), R.sand, 1, { ol: 0 }); h.F(h.E(9, 36, 9, 5), R.sand, 1, { ol: 0 });
  const cap = h.P([[-52, -14 + bo], [-50, -32 + bo], [-36, -50 + bo], [-14, -60 + bo], [14, -60 + bo], [36, -50 + bo], [50, -32 + bo], [52, -14 + bo], [38, -10 + bo], [0, -8 + bo], [-38, -10 + bo]]);
  h.F(cap, R.violet, 1.3, { hi: 1.3, lo: 1.3, ol: 0, noise: .35, r2: true });
  h.F(h.P([[-38, -10 + bo], [38, -10 + bo], [30, -4 + bo], [0, -2 + bo], [-30, -4 + bo]]), R.plum, .8, { ol: 0, noise: .3 });   // lâminas
  for (let x = -30; x <= 30; x += 6) h.L(x, -9 + bo, x * .8, -4 + bo, R.plum, .3);
  for (const [x, y, r] of [[-30, -32, 6], [-8, -46, 7], [18, -38, 6], [34, -24, 5], [-2, -26, 4.5], [-40, -20, 4]]) h.G(h.E(x, y + bo, r, r * .8), { hr: 2, ha: 90 });
  h.eye(-7, 6, 3.6, 3.2, { pupil: false }); h.eye(7, 6, 3.6, 3.2, { pupil: false });
  h.F(h.P([[-7, 15], [7, 15], [5, 22], [0, 24], [-5, 22]]), R.shade, 1, { ol: 0 }); h.G(h.S(-4, 18, 4, 18, 1), { hr: 1, ha: 40, top: 4 });
  h.F(h.E(-34, -58 + bo, 5, 4), R.violet, 1.4, { ol: 0 }); h.F(h.E(26, -60 + bo, 4, 3.4), R.violet, 1.4, { ol: 0 });   // cogumelinhos no chapéu
  h.star(10, 3, -60, -70, 60, 10, [150, 255, 235]);
}, { acc: '#5eead4', acc2: '#26104a', fps: 4 });

// ---- 7. Água-Viva Real: sino translúcido, braços de franja e tentáculos com nós elétricos ----
bxArt('aguaviva', 160, 180, 80, 72, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  for (let i = 0; i < 6; i++) { const x = -22 + i * 8.8, s1 = Math.sin(ph + i) * 3, pts = [[x, 14], [x + s1, 34], [x - s1, 56], [x + s1 * 1.3, 78 + (i % 3) * 8]]; h.A(h.C(pts, 2.6, 1.2, 4), [236, 170, 240], 190); h.G(h.E(pts[3][0], pts[3][1], 1.6, 1.6), { hr: 1, ha: 80 }); }
  for (const s of [-1, 1]) { const q = Math.sin(ph + s) * 4; h.A(h.C([[s * 8, 14], [s * 14 + q, 30], [s * 6 - q, 46]], 4, 2, 4), [255, 210, 250], 150); }
  const dome = h.P([[-30, 14], [-31, 0], [-26, -16], [-14, -30], [0, -34], [14, -30], [26, -16], [31, 0], [30, 14], [20, 10], [10, 16], [0, 10], [-10, 16], [-20, 10]]);
  h.A(dome, [150, 60, 160], 210); h.A(h.E(-12, -14, 9, 11), [255, 220, 255], 70);
  h.F(h.P([[-30, 14], [30, 14], [24, 18], [0, 12], [-24, 18]]), R.plum, 1.8, { ol: 0, noise: .2 });
  h.G(h.E(0, -6, 11, 9), { hr: 3, ha: 120, top: 4.8 });
  for (const [x, y] of [[-6, -12], [6, -14], [0, -2]]) h.put(x, y, [255, 255, 255], 255);
  for (let i = 0; i < 7; i++) h.L(-26 + i * 8.6, 12, -22 + i * 7.4, -22 + (i & 1) * 4, R.plum, 1);
}, { acc: '#f0abfc', acc2: '#3b0a45', fps: 6 });

// ---- 8. Corvo da Tempestade: corvo de asas largas com faíscas elétricas ----
bxArt('corvo', 180, 120, 90, 60, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, up = Math.sin(ph) * 16;
  for (const s of [-1, 1]) {   // asas (a de trás menor)
    const k = s === 1 ? 1 : .8, tipY = -26 - up * k, w = [[s * 4, -8], [s * 24, -22 - up * .5 * k], [s * 46, tipY], [s * 66 * k, tipY + 10 * k], [s * 54 * k, tipY + 18 * k], [s * 60 * k, tipY + 28 * k], [s * 44 * k, tipY + 30 * k], [s * 30 * k, tipY + 36 * k - up * .2], [s * 10, 4]];
    h.F(h.P(w), R.night, 1.4, { hi: 1.3, lo: 1.1, ol: 0, noise: .3, r2: true });
    for (let i = 0; i < 5; i++) h.L(s * (10 + i * 10), -6 - i * 2, s * (22 + i * 11 * k), tipY + 24 + (i & 1) * 4 - i * 2, R.night, .5);
    h.G(h.P([[s * 58 * k, tipY + 12 * k], [s * 66 * k, tipY + 10 * k], [s * 62 * k, tipY + 16 * k]]), { hr: 1, ha: 90 });
  }
  h.F(h.P([[-8, 10], [-14, 28], [-8, 32], [-2, 30], [0, 14]]), R.night, 1, { ol: 0 }); h.F(h.P([[0, 12], [2, 32], [8, 30], [8, 12]]), R.night, 1, { ol: 0 });   // cauda
  const body = h.E(0, 2, 13, 11); h.F(body, R.night, 1.5, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true });
  const hd = h.E(14, -6, 8, 7.4); h.F(hd, R.night, 1.7, { hi: 1.2, ol: 0 });
  h.F(h.P([[20, -8], [32, -4], [20, -2]]), R.bone, 2.4, { ol: 0 }); h.F(h.P([[20, -4], [30, -2], [20, 0]]), R.bone, 1.4, { ol: 0 });
  h.eye(17, -9, 2.3, 2.3, { pupil: false, hr: 1, ha: 90 });
  for (const [x, y] of [[-30, -30 - up], [32, -34 - up], [-8, -6]]) h.G(h.S(x, y, x + 6, y + 8, 1), { hr: 1, ha: 50, top: 4.8, edge: 2 });
}, { acc: '#818cf8', acc2: '#0c0a24', fps: 9 });
