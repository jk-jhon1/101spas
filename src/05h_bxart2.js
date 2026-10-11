/* ============================================================
   05h_bxart2: sprites dos chefes novos do Ato II (ver 05f_bxart.js)
   ============================================================ */
// ---- 9. Golem de Cristal: rocha escura com cristais ciano e núcleo no peito ----
bxArt('golem_cristal', 200, 190, 100, 110, 3, (h, fr) => {
  const R = h.R, bo = Math.round(Math.sin(fr / 3 * TAU) * 1.2), S = R.slate;
  for (const s of [-1, 1]) h.F(h.P([[s * 6, 18], [s * 22, 18], [s * 24, 36], [s * 4, 36]]), S, 1.2, { hi: 1, lo: 1.2, ol: 0, noise: .35 });
  const tor = h.P([[-26, -14 + bo], [-20, -28 + bo], [20, -28 + bo], [26, -14 + bo], [22, 20], [-22, 20]]);
  h.F(tor, S, 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .4, r2: true });
  for (const s of [-1, 1]) { h.F(h.P([[s * 20, -30 + bo], [s * 38, -26 + bo], [s * 40, -10 + bo], [s * 24, -8 + bo]]), S, 1.6, { ol: 0, noise: .4 }); h.F(h.S(s * 32, -10, s * 38, 14, 9), S, 1.2, { ol: 0, noise: .4 }); h.F(h.E(s * 39, 20 + bo, 10, 9), S, 1.5, { ol: 0, noise: .4 }); }
  h.F(h.P([[-10, -28 + bo], [-8, -42 + bo], [8, -42 + bo], [10, -28 + bo]]), S, 1.5, { ol: 0, noise: .35 });
  h.eye(-4, -35 + bo, 2.6, 1.4, { pupil: false, hr: 1, ha: 90 }); h.eye(4, -35 + bo, 2.6, 1.4, { pupil: false, hr: 1, ha: 90 });
  for (const [x, y, w, hh, a] of [[-24, -30, 6, 26, -.25], [-34, -26, 5, 18, -.5], [24, -30, 6, 28, .25], [34, -26, 5, 20, .5], [-8, -30, 5, 22, -.1], [10, -30, 5, 18, .12], [0, -32, 4, 14, 0]]) {
    const cr = h.P([[x - w, y + 2 + bo], [x + Math.sin(a) * hh, y - hh + bo], [x + w, y + 2 + bo]]); h.F(cr, R.ice, 2.2, { hi: 1.3, lo: 1.1, ol: 0, noise: .1 }); h.G(h.P([[x - w * .35, y - 1 + bo], [x + Math.sin(a) * hh * .9, y - hh * .85 + bo], [x + w * .1, y - 1 + bo]]), { hr: 1, ha: 70, top: 4.6, edge: 2 });
  }
  h.G(h.P([[0, -14 + bo], [8, -4 + bo], [0, 8 + bo], [-8, -4 + bo]]), { hr: 3, ha: 120, top: 5.2 });
  for (const x of [-18, 16]) h.G(h.P([[x, 4], [x + 4, 8], [x, 14], [x - 3, 8]]), { hr: 1, ha: 60, top: 4.4 });
}, { acc: '#22d3ee', acc2: '#0c2a33', fps: 4 });

// ---- 10. Rei Ossos: esqueleto coroado de chamas verdes (variante 1 = pilha de ossos antes de ressurgir) ----
bxArt('rei_ossos', 190, 170, 95, 94, 3, (h, fr, v) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 1.5, B = R.bone;
  if (v === 1) {   // monte de ossos
    h.F(h.E(0, 30, 34, 13), B, 1.2, { ol: 0, noise: .5 });
    for (const [x, y, a] of [[-18, 24, 1], [12, 22, -1], [-4, 18, .3], [20, 28, .5], [-26, 30, -.4]]) h.F(h.S(x, y, x + 14 * a, y - 8, 3.2), B, 2.4, { ol: 0 });
    h.F(h.E(-6, 16, 11, 10), B, 2.2, { ol: 0, hi: 1.2 }); h.F(h.E(-9, 16, 3, 3), R.shade, 0, {}); h.F(h.E(-1, 16, 3, 3), R.shade, 0, {}); h.G(h.E(-9, 16, 1.6, 1.6), { hr: 1, ha: 60 }); h.G(h.E(-1, 16, 1.6, 1.6), { hr: 1, ha: 60 });
    h.F(h.P([[10, 8], [12, -2], [16, 4], [20, -4], [24, 6], [26, 14], [10, 14]]), R.gold, 2.6, { ol: 0 });
    return;
  }
  h.F(h.P([[-18, -6], [-30, 10 + sw], [-34, 34], [-18, 30], [-10, 38], [10, 38], [24, 32], [34, 34], [30, 8 - sw], [18, -6]]), R.plum, 1.1, { ol: 0, noise: .4 });   // capa rasgada
  for (const s of [-1, 1]) { h.F(h.S(s * 6, 14, s * 8, 34, 4.4), B, 2.3, { ol: 0 }); h.F(h.S(s * 8, 34, s * 10, 44, 3.6), B, 2, { ol: 0 }); h.F(h.P([[s * 8, 42], [s * 18, 44], [s * 18, 48], [s * 6, 48]]), B, 1.6, { ol: 0 }); }
  h.F(h.P([[-12, 10], [12, 10], [10, 18], [-10, 18]]), B, 2, { ol: 0 });
  h.F(h.S(0, -12, 0, 12, 4), B, 1.8, { ol: 0 });
  for (let i = 0; i < 4; i++) { const y = -10 + i * 6, w = 18 - i * 2; for (const s of [-1, 1]) h.F(h.C([[0, y], [s * w, y - 2], [s * (w - 3), y + 4]], 2.6, 1.6, 3), B, 2.2, { hi: 1.1, ol: 0 }); }
  h.G(h.S(0, -6, 0, 6, 2), { hr: 2, ha: 60, top: 4.2 });
  for (const s of [-1, 1]) { h.F(h.E(s * 20, -14, 7, 5), B, 2, { ol: 0 }); h.F(h.S(s * 22, -12, s * 30, 6, 3.2), B, 2.2, { ol: 0 }); h.F(h.S(s * 30, 6, s * 26, 20, 3), B, 2, { ol: 0 }); h.F(h.E(s * 26, 22, 3.4, 3.4), B, 2.4, { ol: 0 }); }
  h.F(h.S(-26, 22, -26, -30, 2.4), R.iron, 1.5, {}); h.G(h.E(-26, -34 + sw, 4.4, 4.4), { hr: 3, ha: 120 });   // cetro com orbe
  const sk = h.E(0, -26, 12, 11); h.F(sk, B, 2.5, { hi: 1.4, lo: 1.2, ol: 0, noise: .25 }); h.F(h.P([[-8, -17], [8, -17], [6, -9], [-6, -9]]), B, 2, { ol: 0 });
  h.F(h.E(-5, -26, 3.6, 4), R.shade, 0, {}); h.F(h.E(5, -26, 3.6, 4), R.shade, 0, {}); h.G(h.E(-5, -26, 2.2, 2.6), { hr: 2, ha: 100 }); h.G(h.E(5, -26, 2.2, 2.6), { hr: 2, ha: 100 });
  for (const x of [-4, -1.5, 1, 3.5]) h.L(x, -17, x, -11, R.shade, 0);
  h.F(h.P([[-12, -34], [-12, -44], [-7, -38], [-3, -48], [1, -39], [5, -48], [8, -38], [12, -44], [12, -34]]), R.gold, 2.8, { ol: 0, hi: 1, lo: .8 });
  for (const [x, y, k] of [[-7, -50, 1], [0, -53, 1.4], [7, -50, 1]]) h.G(h.P([[x - 3, y + 6], [x, y - 8 * k + sw], [x + 3, y + 6]]), { hr: 2, ha: 90, top: 5 });
}, { acc: '#84cc16', acc2: '#1d2b0a', vars: 2, fps: 5 });

// ---- 11. Verme das Areias (cabeça): boca de anéis de dentes com garganta em brasa ----
bxArt('verme', 170, 150, 85, 80, 3, (h, fr) => {
  const R = h.R, mo = Math.round(Math.sin(fr / 3 * TAU) * 2), C = R.ochre;
  h.F(h.P([[-30, -6], [-28, -24], [-14, -34], [8, -36], [24, -28], [34, -10], [34, 4], [24, 8], [-6, 12], [-26, 8]]), C, 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .35, r2: true });
  for (const [x, y] of [[-22, -18], [-8, -28], [8, -30], [-14, -4], [2, -14], [18, -22]]) h.F(h.P([[x - 6, y + 5], [x - 2, y - 5], [x + 6, y - 3], [x + 8, y + 5]]), C, 1.9, { ol: 0, noise: .2 });
  const th = h.E(30, -6, 12, 18); h.F(th, R.shade, 0, { ol: 0 }); h.G(h.E(32, -6, 7, 12), { hr: 2, ha: 100, top: 4.6 });
  for (let i = 0; i < 6; i++) { const y = -22 + i * 5.4; h.F(h.P([[24, y], [40, y + 1 - (i < 3 ? 2 : -2) * 1], [24, y + 3]]), R.bone, 3, { ol: 0 }); }
  h.F(h.P([[22, -26 - mo], [40, -22 - mo], [36, -30 - mo]]), C, 1.8, { ol: 0 }); h.F(h.P([[22, 12 + mo], [40, 6 + mo], [36, 14 + mo]]), C, 1.2, { ol: 0 });
  h.eye(8, -22, 3.4, 3, { pupil: false, hr: 1, ha: 90 });
  h.G(h.S(-26, -2, 0, 4, 1.4), { hr: 1, ha: 50, top: 4.2 });
}, { acc: '#f59e0b', acc2: '#3b2410', fps: 6 });
bxArt('verme_seg', 60, 60, 30, 30, 1, (h) => {
  const R = h.R; h.F(h.E(0, 0, 18, 18), R.ochre, 1.3, { hi: 1.3, lo: 1.4, ol: 0, noise: .3, r2: true });
  for (const a of [-1, -.4, .4, 1]) h.F(h.P([[Math.sin(a) * 12 - 4, Math.cos(a) * 12 - 3], [Math.sin(a) * 19, Math.cos(a) * 19 - 1], [Math.sin(a) * 12 + 4, Math.cos(a) * 12 + 2]]), R.ochre, 2, { ol: 0 });
  h.G(h.E(0, 0, 5, 5), { hr: 2, ha: 70, top: 4.2 });
}, { acc: '#f59e0b', acc2: '#3b2410', fps: 1 });

// ---- 12. Gárgula de Pedra: demônio alado de granito (variante 1 = estátua petrificada) ----
bxArt('gargula', 190, 150, 95, 78, 3, (h, fr, v) => {
  const R = h.R, st = v === 1, fl = Math.sin(fr / 3 * TAU), S = R.slate;
  const wy = st ? 8 : Math.round(fl * 12);
  for (const s of [-1, 1]) {   // asas
    const w = st ? [[s * 8, -8], [s * 22, -22], [s * 30, -10], [s * 26, 8], [s * 12, 4]] : [[s * 8, -10], [s * 30, -34 - wy], [s * 56, -40 - wy], [s * 70, -20 - wy * .5], [s * 56, -16], [s * 60, -2 - wy * .3], [s * 40, -6], [s * 36, 8], [s * 16, 2]];
    h.F(h.P(w), S, st ? 1.1 : 1.3, { hi: 1.1, lo: 1.2, ol: 0, noise: .3, r2: true });
    if (!st) { h.F(h.C([[s * 8, -10], [s * 34, -38 - wy], [s * 66, -22 - wy * .6]], 3, 1.6, 4), S, 2.2, {}); for (const k of [0, 1, 2]) h.L(s * 12, -8, s * (38 + k * 12), -26 - wy + k * 10, S, .5); }
  }
  for (const s of [-1, 1]) { h.F(h.P([[s * 6, 14], [s * 16, 14], [s * 20, 30], [s * 8, 30]]), S, 1.2, { ol: 0, noise: .3 }); h.F(h.P([[s * 6, 28], [s * 24, 30], [s * 24, 34], [s * 4, 34]]), S, 1.6, { ol: 0 }); }
  h.F(h.P([[-8, 18], [-30, 26 + (st ? 0 : fl * 3)], [-40, 20], [-30, 32], [-8, 26]]), S, 1.2, { ol: 0 });   // cauda
  h.F(h.P([[-16, -10], [-18, 8], [-8, 20], [8, 20], [18, 8], [16, -10], [8, -16], [-8, -16]]), S, 1.4, { hi: 1.2, lo: 1.3, ol: 0, noise: .4, r2: true });
  h.F(h.E(0, -24, 12, 10), S, 1.6, { hi: 1.2, ol: 0, noise: .3 });
  for (const s of [-1, 1]) h.F(h.P([[s * 7, -30], [s * 12, -42], [s * 14, -30]]), R.bone, 1.4, { ol: 0, hi: 1 });
  if (!st) { h.eye(-5, -25, 3, 2.2, { pupil: false, hr: 1, ha: 90 }); h.eye(5, -25, 3, 2.2, { pupil: false, hr: 1, ha: 90 }); h.G(h.P([[-4, -18], [4, -18], [0, -14]]), { hr: 1, ha: 40, top: 3.6 }); }
  else { h.F(h.S(-7, -25, -3, -25, 1.6), R.shade, 0, {}); h.F(h.S(3, -25, 7, -25, 1.6), R.shade, 0, {}); h.L(-10, -10, -4, 4, R.shade, 0); h.L(8, -6, 12, 6, R.shade, 0); }
  h.D(h.E(0, 2, 16, 16), R.stone, 3.2, .06, 4);
}, { acc: '#2dd4bf', acc2: '#10202a', vars: 2, fps: 6 });

// ---- 13. Banshee: espectro de véu e cabelos, boca aberta num grito ----
bxArt('banshee', 150, 190, 75, 96, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 3;
  const robe = h.P([[-12, -16], [12, -16], [20, 4], [26, 26 + sw], [18, 44], [10, 36 + sw], [4, 52], [-2, 40], [-10, 54 - sw], [-14, 38], [-22, 44 + sw], [-24, 24], [-18, 4]]);
  h.A(robe, [170, 230, 224], 120); h.A(h.I(robe, h.E(0, 0, 14, 36)), [235, 255, 252], 70);
  for (const x of [-12, -4, 6, 14]) h.L(x * .6, -10, x * 1.4, 36 + (x & 3), R.teal, 1);
  for (const s of [-1, 1]) h.A(h.C([[s * 10, -12], [s * 26, -26 + sw], [s * 34, -42]], 4, 2, 4), [200, 245, 238], 140);   // braços erguidos
  h.A(h.C([[-8, -34], [-22, -28 + sw], [-20, -4], [-26, 14 - sw]], 7, 3, 4), [60, 90, 100], 190); h.A(h.C([[8, -34], [20, -26 - sw], [22, -2], [28, 12 + sw]], 7, 3, 4), [60, 90, 100], 190);   // cabelo
  h.F(h.E(0, -30, 10, 12), R.bone, 3.4, { hi: 1.1, lo: 1, ol: 0, noise: .15 });
  h.F(h.E(0, -23, 4, 5), R.shade, 0, {}); h.G(h.E(0, -23, 2, 3), { hr: 1, ha: 50, top: 3.5 });
  h.eye(-4.5, -32, 2.6, 3.2, { pupil: false, hr: 2, ha: 110 }); h.eye(4.5, -32, 2.6, 3.2, { pupil: false, hr: 2, ha: 110 });
  for (let k = 0; k < 6; k++) h.put(-20 + hash2(k, 2, 9) * 40, -50 + hash2(k, 5, 9) * 100, [220, 255, 250], 160);
}, { acc: '#99f6e4', acc2: '#10302c', fps: 6 });

// ---- 14. Minotauro do Labirinto: brutamontes de chifres largos e argola luminosa no focinho ----
bxArt('minotauro', 190, 180, 95, 100, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 1.5, C = R.hide;
  for (const s of [-1, 1]) { h.F(h.P([[s * 4, 20], [s * 16, 20], [s * 18, 38], [s * 4, 38]]), C, 1.2, { ol: 0, noise: .4 }); h.F(h.P([[s * 2, 36], [s * 20, 36], [s * 22, 44], [s * 2, 44]]), R.shade, 1, { ol: 0 }); }
  h.F(h.P([[-18, 14], [18, 14], [20, 24], [-20, 24]]), R.cloth, 1.6, { ol: 0 });   // tanga
  h.F(h.P([[-24, -10], [-20, -26], [-8, -34], [8, -34], [20, -26], [26, -10], [20, 16], [-20, 16]]), C, 1.4, { hi: 1.3, lo: 1.3, ol: 0, noise: .4, r2: true });
  h.F(h.P([[-8, -30], [8, -30], [6, 12], [-6, 12]]), R.rust, 1.1, { noise: .3 });
  for (const s of [-1, 1]) { h.F(h.E(s * 24, -22, 9, 8), C, 1.8, { hi: 1.2, ol: 0, noise: .3 }); h.F(h.S(s * 28, -18, s * 34, 4 + sw * s, 9), C, 1.4, { ol: 0, noise: .4 }); h.F(h.E(s * 34, 10, 7, 6), C, 1.6, { ol: 0 }); }
  h.F(h.S(34, 12, 40, -34, 3), R.wood, 1.4, {}); h.F(h.P([[40, -30], [58, -40], [62, -22], [44, -14]]), R.steel, 1.8, { ol: 0, hi: 1.2 }); h.F(h.P([[40, -30], [22, -40], [20, -22], [38, -14]]), R.steel, 1.2, { ol: 0 });   // machado duplo
  h.G(h.S(58, -38, 60, -24, 1.2), { hr: 1, ha: 50, top: 4.4 });
  h.F(h.E(0, -42, 14, 12), C, 1.6, { hi: 1.2, lo: 1.2, ol: 0, noise: .3 });
  h.F(h.P([[-10, -34], [10, -34], [8, -22], [-8, -22]]), C, 1.2, { ol: 0 });   // focinho
  for (const s of [-1, 1]) { h.F(h.C([[s * 12, -48], [s * 30, -52], [s * 38, -68]], 5, 1.4, 4), R.bone, 3, { ol: 0, hi: 1 }); }
  h.eye(-5, -44, 2.4, 2, { pupil: false, hr: 1, ha: 90 }); h.eye(5, -44, 2.4, 2, { pupil: false, hr: 1, ha: 90 });
  h.G(h.E(0, -26, 4, 4), { hr: 1, ha: 80 }); h.F(h.E(0, -26, 1.8, 1.8), R.shade, 0, {});   // argola
  h.D(h.E(0, -8, 22, 22), R.shade, 1.2, .05, 6);
}, { acc: '#fb923c', acc2: '#2a1408', fps: 4 });

// ---- 15. Lich do Gelo: mago de manto, cristais nos ombros e cajado que flutua ----
bxArt('lich_gelo', 160, 190, 80, 104, 3, (h, fr) => {
  const R = h.R, ph = fr / 3 * TAU, sw = Math.sin(ph) * 2;
  const robe = h.P([[-12, -14], [12, -14], [20, 8], [26, 30], [16, 46 + sw], [8, 38], [2, 52 - sw], [-4, 40], [-12, 50 + sw], [-18, 38], [-26, 40], [-22, 18], [-18, 2]]);
  h.F(robe, R.night, 1.2, { hi: 1.2, lo: 1.2, ol: 0, noise: .35, r2: true }); h.A(h.I(robe, h.P([[-30, 30], [30, 30], [30, 60], [-30, 60]])), [150, 200, 240], 70);
  for (const x of [-14, -6, 4, 12]) h.L(x * .7, -8, x * 1.3, 34, R.night, 0);
  h.F(h.P([[-16, -14], [-24, -22], [-14, -26], [-8, -30], [8, -30], [14, -26], [24, -22], [16, -14]]), R.slate, 1.6, { ol: 0, noise: .3 });   // ombreira
  for (const [x, y, k, a] of [[-22, -20, 1, -.4], [22, -20, 1, .4], [-14, -26, .7, -.2], [14, -26, .7, .2]]) { h.F(h.P([[x - 3, y], [x + a * 14 * k, y - 18 * k], [x + 3, y]]), R.ice, 2.2, { ol: 0, hi: 1.2 }); h.G(h.P([[x - 1, y - 2], [x + a * 12 * k, y - 15 * k], [x + 1, y - 2]]), { hr: 1, ha: 60, top: 4.6, edge: 2 }); }
  const hood = h.P([[-11, -26], [-9, -40], [0, -46], [9, -40], [11, -26], [6, -20], [-6, -20]]);
  h.F(hood, R.night, 1.3, { hi: 1.2, ol: 0 }); h.F(h.E(0, -31, 7, 8), R.shade, 0, {});
  h.eye(-3, -32, 2.2, 1.8, { pupil: false, hr: 2, ha: 110 }); h.eye(3, -32, 2.2, 1.8, { pupil: false, hr: 2, ha: 110 });
  h.F(h.S(30, 36, 34, -40, 2.2), R.wood, 1.4, {}); h.F(h.P([[30, -34], [34, -50], [38, -34], [34, -28]]), R.ice, 2.6, { ol: 0, hi: 1.2 }); h.G(h.P([[32, -36], [34, -47], [36, -36]]), { hr: 3, ha: 120, top: 5 });
  h.F(h.C([[16, -8], [26, -4], [30, 4]], 3.4, 2, 3), R.night, 1.4, { ol: 0 }); h.F(h.E(31, 6, 3, 3), R.bone, 2.4, {});
  h.star(8, 7, -26, -50, 30, 60, [180, 230, 255]);
}, { acc: '#7dd3fc', acc2: '#0b1b33', fps: 4 });

// ---- 16. Escaravelho Real: besouro de élitro esmeralda com runas (variante 1 = bola) ----
bxArt('escaravelho', 180, 150, 90, 78, 3, (h, fr, v) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 1.5, S = R.shell;
  if (v === 1) {   // enrolado em bola
    const b = h.E(0, 0, 25, 25); h.F(b, S, 1.4, { hi: 1.4, lo: 1.4, ol: 0, noise: .3, r2: true });
    for (const a of [0, .7, 1.4, 2.1, 2.8]) h.F(h.C([[Math.cos(a) * 24, Math.sin(a) * 24], [Math.cos(a + 1.6) * 8, Math.sin(a + 1.6) * 8], [Math.cos(a + 3.2) * 24, Math.sin(a + 3.2) * 24]], 1.4, 1, 5), S, .4, {});
    h.G(h.P([[-6, -8], [6, -8], [8, 4], [0, 12], [-8, 4]]), { hr: 2, ha: 100, top: 4.8 }); h.G(h.S(-18, 0, 18, 0, 1.2), { hr: 1, ha: 50, top: 4.2 });
    return;
  }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) h.F(h.C([[s * 12, 6 + i * 5], [s * (24 + i * 4), 10 + i * 7 + (i & 1 ? sw : -sw)], [s * (34 + i * 5), 26 + i * 4]], 3.2, 1.6, 3), S, .8, { ol: 0 });
  for (const s of [-1, 1]) h.A(h.P([[s * 10, -14], [s * 40, -34 + sw * 2], [s * 52, -16], [s * 30, -6]]), [200, 255, 230], 70);   // asas por baixo
  const sh = h.P([[-28, 2], [-26, -14], [-14, -26], [0, -28], [14, -26], [26, -14], [28, 2], [20, 12], [0, 16], [-20, 12]]);
  h.F(sh, S, 1.4, { hi: 1.3, lo: 1.4, ol: 0, noise: .25, r2: true });
  h.L(0, -26, 0, 14, S, 0); h.L(-1, -26, -1, 14, S, 0);
  for (const s of [-1, 1]) { h.G(h.P([[s * 6, -18], [s * 10, -10], [s * 7, -2], [s * 12, 4], [s * 18, -4], [s * 14, -12], [s * 16, -20], [s * 11, -24]]), { hr: 1, ha: 70, top: 4.4 }); h.G(h.E(s * 20, 4, 2, 2), { hr: 1, ha: 60 }); }
  h.F(h.E(0, -30, 12, 9), S, 1.6, { hi: 1.2, ol: 0 }); h.F(h.P([[-3, -36], [0, -52], [3, -36]]), R.bone, 2.2, { ol: 0 }); h.F(h.P([[-14, -34], [-22, -40], [-12, -28]]), R.bone, 1.8, { ol: 0 }); h.F(h.P([[14, -34], [22, -40], [12, -28]]), R.bone, 1.8, { ol: 0 });
  h.eye(-5, -31, 2.2, 2.2, { pupil: false, hr: 1, ha: 90 }); h.eye(5, -31, 2.2, 2.2, { pupil: false, hr: 1, ha: 90 });
}, { acc: '#34d399', acc2: '#05241a', vars: 2, fps: 5 });

// ---- 17. Cavaleiro Sem Cabeça: cavaleiro de capa sobre montaria espectral (variante 1 = sem cabeça, chama no pescoço) ----
bxArt('cavaleiro', 210, 190, 105, 104, 3, (h, fr, v) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2, hl = v === 1;
  for (const [x, ph] of [[-22, 0], [-12, 1], [14, 1], [24, 0]]) { const k = ph ? sw : -sw; h.F(h.C([[x, 12], [x + k, 30], [x + k * 1.5, 44]], 5, 3.4, 4), R.shade, 1, { ol: 0, hi: .6 }); h.F(h.P([[x - 3 + k * 1.5, 42], [x + 5 + k * 1.5, 42], [x + 5 + k * 1.5, 47], [x - 3 + k * 1.5, 47]]), R.iron, 1.2, {}); }
  h.F(h.P([[-34, -2], [-30, -12], [-6, -14], [20, -12], [32, -4], [34, 8], [22, 16], [-20, 16], [-32, 10]]), R.shade, 1, { hi: 1.1, ol: 0, noise: .3, r2: true });   // corpo do cavalo
  h.F(h.P([[24, -10], [32, -26], [44, -34], [52, -28], [48, -14], [34, -4]]), R.shade, 1.1, { ol: 0, noise: .3 });   // pescoço e cabeça
  h.F(h.P([[44, -34], [58, -30], [60, -22], [48, -22]]), R.shade, 1.2, { ol: 0 }); h.eye(52, -29, 1.8, 1.8, { pupil: false, hr: 1, ha: 90 });
  h.F(h.C([[-34, 0], [-46, 10 + sw], [-44, 26]], 4, 2, 4), R.shade, 1, { ol: 0 }); for (let i = 0; i < 4; i++) h.G(h.E(-40 - i, 6 + i * 5 + sw, 1.2, 1.2), { hr: 1, ha: 60 });   // cauda com brasas
  h.F(h.P([[-12, -14], [-18, -44], [-10, -52], [10, -52], [18, -44], [12, -14]]), R.iron, 1.6, { hi: 1.3, lo: 1.2, ol: 0, noise: .2, r2: true });   // tronco de armadura
  h.F(h.P([[-6, -52], [-30, -44], [-40, -14], [-34, 6], [-16, -10]]), R.wine, 1.1, { ol: 0, noise: .4 });   // capa
  for (const s of [-1, 1]) h.F(h.E(s * 17, -48, 7, 6), R.iron, 1.8, { ol: 0, hi: 1.2 });
  h.F(h.S(16, -42, 28, -22, 6), R.iron, 1.4, { ol: 0 }); h.F(h.S(-16, -42, -26, -24, 6), R.iron, 1.2, { ol: 0 });
  h.F(h.S(30, -30, 52, -66, 2.4), R.steel, 1.8, {}); h.G(h.S(34, -38, 50, -64, 1), { hr: 1, ha: 60, top: 4.4 });   // espada
  if (!hl) {   // cabeça-abóbora luminosa
    h.F(h.E(0, -62, 11, 10), R.rust, 2.4, { hi: 1.2, ol: 0 }); h.G(h.P([[-6, -66], [-2, -62], [-6, -60]]), { hr: 1, ha: 80 }); h.G(h.P([[6, -66], [2, -62], [6, -60]]), { hr: 1, ha: 80 }); h.G(h.P([[-6, -56], [6, -56], [3, -53], [0, -55], [-3, -53]]), { hr: 1, ha: 80 });
  } else { h.F(h.S(0, -52, 0, -56, 8), R.iron, 1.2, { ol: 0 }); h.G(h.P([[-6, -54], [-4, -66 - sw], [0, -60], [3, -72 - sw], [6, -54]]), { hr: 3, ha: 120, top: 5.2 }); h.F(h.E(-34, -34, 7, 6), R.rust, 2, { ol: 0 }); }
}, { acc: '#f97316', acc2: '#241008', vars: 2, fps: 5 });

// ---- 18. Fênix de Cinzas: ave carbonizada de penas em brasa ----
bxArt('fenix_cinzas', 210, 140, 105, 70, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, up = Math.sin(ph) * 14, E = R.ember;
  for (const k of [-1, 0, 1]) h.F(h.C([[-12, 8], [-30 + k * 4, 22 + k * 2], [-52 + k * 8, 34 + k * 10 + Math.sin(ph + k) * 3]], 7, 2, 5), R.shade, 1.3, { ol: 0 });   // cauda
  for (const k of [-1, 0, 1]) h.G(h.C([[-34 + k * 4, 24 + k * 2], [-52 + k * 8, 34 + k * 10 + Math.sin(ph + k) * 3], [-62 + k * 8, 38 + k * 12]], 2.4, 1, 4), { hr: 1, ha: 80, top: 4.6 });
  for (const s of [-1, 1]) {
    const k = s === 1 ? 1 : .85, tipY = -22 - up * k, w = [[s * 4, -6], [s * 22, -20 - up * .4], [s * 46, tipY - 6], [s * 72 * k, tipY + 4], [s * 62 * k, tipY + 10], [s * 70 * k, tipY + 20], [s * 54 * k, tipY + 22], [s * 56 * k, tipY + 32], [s * 38 * k, tipY + 30], [s * 20, 8]];
    h.F(h.P(w), R.shade, 1.4, { hi: 1.2, lo: 1.1, ol: 0, noise: .35, r2: true });
    for (let i = 0; i < 6; i++) { const t = i / 5; h.G(h.S(s * (22 + t * 40), -8 + t * 6 - up * t * .4, s * (30 + t * 40 * k), tipY + 4 + t * 24, 1.6), { hr: 1, ha: 60, top: 4.2, edge: 2 }); }
    h.G(h.P([[s * 66 * k, tipY + 4], [s * 74 * k, tipY + 2], [s * 70 * k, tipY + 14]]), { hr: 2, ha: 100 });
  }
  h.F(h.E(0, 2, 15, 10), R.shade, 1.6, { hi: 1.3, ol: 0, noise: .35, r2: true }); h.G(h.E(0, 4, 8, 5), { hr: 2, ha: 90, top: 4.6 });
  h.F(h.E(16, -6, 8, 7), R.shade, 1.7, { hi: 1.2, ol: 0 }); h.F(h.P([[22, -8], [34, -3], [22, -2]]), R.gold, 2.6, { ol: 0 });
  h.eye(18, -8, 2, 2, { pupil: false, hr: 1, ha: 100 });
  for (const [x, y, k] of [[10, -14, 1], [15, -18, 1.4], [20, -14, 1]]) h.G(h.P([[x - 2, y + 5], [x, y - 8 * k], [x + 2, y + 5]]), { hr: 1, ha: 80, top: 5 });
  for (let i = 0; i < 5; i++) h.put(-30 + hash2(i, 3, fr) * 60, -40 + hash2(i, 4, fr) * 70, [255, 190, 110], 200);
}, { acc: '#ff6b35', acc2: '#241008', fps: 8 });

// ---- 19. Autômato Relojoeiro: corpo de latão com mostrador no peito e engrenagens à mostra ----
bxArt('relojoeiro', 170, 170, 85, 90, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, B = R.brass;
  const gear = (x, y, r, t, rot) => { h.F(h.E(x, y, r, r), B, t, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 }); for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; h.F(h.P([[x + Math.cos(a - .18) * r, y + Math.sin(a - .18) * r], [x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3)], [x + Math.cos(a + .18) * r, y + Math.sin(a + .18) * r]]), B, t, { ol: 0 }); } h.F(h.E(x, y, r * .35, r * .35), R.shade, 1, {}); };
  for (const s of [-1, 1]) { h.F(h.S(s * 12, 20, s * 14, 36, 5), R.iron, 1.2, { ol: 0 }); h.F(h.P([[s * 6, 34], [s * 22, 34], [s * 22, 40], [s * 6, 40]]), B, 1.2, { ol: 0 }); }
  h.F(h.E(0, 2, 26, 26), B, 1.3, { hi: 1.4, lo: 1.3, ol: 0, noise: .2, r2: true });
  gear(-16, 14, 8, 1.5, ph); gear(14, 16, 6, 1.6, -ph * 1.3); gear(-26, -8, 6, 1.4, -ph);
  h.F(h.E(0, 0, 15, 15), R.bone, 3.4, { hi: 1, lo: 1.3, ol: 0, noise: .1 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; h.F(h.S(Math.cos(a) * 12, Math.sin(a) * 12, Math.cos(a) * 14, Math.sin(a) * 14, 1.2), R.iron, 1, {}); }
  h.G(h.S(0, 0, Math.cos(ph) * 10, Math.sin(ph) * 10, 1.4), { hr: 1, ha: 80, top: 4.6 }); h.G(h.S(0, 0, 0, -8, 1.6), { hr: 1, ha: 80, top: 4.6 }); h.F(h.E(0, 0, 2, 2), R.shade, 1, {});
  for (const s of [-1, 1]) { h.F(h.S(s * 26, -6, s * 38, 6 + Math.sin(ph + s) * 3, 5), R.iron, 1.5, { ol: 0 }); h.F(h.E(s * 40, 10 + Math.sin(ph + s) * 3, 6, 6), B, 1.6, { ol: 0 }); }
  h.F(h.P([[-12, -22], [-10, -34], [-4, -40], [4, -40], [10, -34], [12, -22]]), B, 1.5, { hi: 1.3, ol: 0, noise: .2 });
  h.eye(0, -30, 5, 5, { pupil: true, hr: 2, ha: 110 }); h.F(h.E(0, -30, 7, 7), R.iron, 1.2, { ol: 0 }); h.G(h.E(0, -30, 4, 4), { hr: 2, ha: 110 });
  h.F(h.S(0, -40, 0, -50, 2), R.iron, 1.4, {}); h.G(h.E(0, -52, 2.4, 2.4), { hr: 1, ha: 90 });
}, { acc: '#e8c15a', acc2: '#2a1c06', fps: 5 });

// ---- 20. Espírito do Vento: funil de camadas de cinza-tempestade, bordas e olhos que brilham ----
bxArt('vento', 160, 170, 80, 84, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  for (let i = 0; i < 9; i++) { const y = -34 + i * 8.5, w = 7 + i * 3.6, off = Math.sin(ph + i * .8) * 5; h.F(h.C([[-w + off, y], [off * .5, y + 7], [w + off, y]], 4.6, 3.4, 5), R.slate, .8 + (i & 1) * .5, { hi: 1, lo: 1.2, ol: 0, noise: .25 }); h.G(h.C([[-w * .8 + off, y + 2], [off * .5, y + 8], [w * .8 + off, y + 2]], 1.2, 1, 5), { hr: 1, ha: 50, top: 4.4, edge: 2 }); }
  for (const s of [-1, 1]) { const q = Math.sin(ph + s) * 4; h.F(h.C([[s * 16, -16], [s * 32, -20 + q], [s * 46, -8]], 7, 2.4, 5), R.slate, 1.1, { ol: 0, hi: .8 }); h.G(h.C([[s * 34, -19 + q], [s * 44, -12], [s * 52, -16]], 1.4, 1, 4), { hr: 1, ha: 60, top: 4.6, edge: 2 }); }
  h.F(h.E(0, -26, 16, 15), R.slate, 1.3, { hi: 1.3, lo: 1.3, ol: 0, noise: .3, r2: true });
  h.eye(-5, -26, 3, 2.4, { pupil: false, hr: 2, ha: 120 }); h.eye(5, -26, 3, 2.4, { pupil: false, hr: 2, ha: 120 });
  h.G(h.S(-6, -18, 6, -18, 1.2), { hr: 1, ha: 50, top: 4 });
  for (let k = 0; k < 8; k++) { const a = hash2(k, 1, 3) * TAU + ph * (k % 2 ? 1 : -1), r = 20 + hash2(k, 2, 3) * 30; h.put(Math.cos(a) * r, -10 + Math.sin(a) * r * .8, [230, 250, 255], 220); }
}, { acc: '#bae6fd', acc2: '#18303f', fps: 6 });

// ---- 21. Hidra do Pântano: corpo de pântano com três pescoços (as cabeças são desenhadas por cima) ----
bxArt('hidra', 220, 200, 110, 118, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 1.5, G = R.moss;
  h.F(h.C([[-26, 12], [-52, 24 + sw], [-72, 14], [-84, 24]], 12, 2, 6), G, 1.2, { ol: 0, noise: .35 });
  for (const s of [-1, 1]) for (const x of [14, 34]) h.F(h.P([[s * x - 6, 16], [s * x + 6, 16], [s * (x + 3) + 6, 36], [s * (x + 3) - 8, 36]]), G, 1, { ol: 0, noise: .35 });
  const body = h.P([[-44, 12], [-46, -4], [-32, -18], [0, -24], [30, -18], [46, -4], [44, 12], [30, 22], [0, 26], [-30, 22]]);
  h.F(body, G, 1.3, { hi: 1.3, lo: 1.3, ol: 0, noise: .4, r2: true }); h.D(body, R.leaf, 2.2, .1, 3);
  h.F(h.P([[-30, 20], [30, 20], [20, 26], [-20, 26]]), R.sand, 1.2, { ol: 0, noise: .3 });
  for (const x of [-30, -16, 0, 16, 30]) h.F(h.P([[x - 5, -20], [x, -32 - (x & 3)], [x + 5, -20]]), R.bone, 1.8, { ol: 0, hi: 1 });
  for (const k of [-1, 0, 1]) { h.F(h.C([[k * 18, -20], [k * 28, -36], [k * 34, -50]], 9, 7, 5), G, 1.2, { ol: 0, noise: .35 }); }
  h.G(h.E(0, 4, 7, 5), { hr: 2, ha: 70, top: 4.6 });
}, { acc: '#4ade80', acc2: '#13230a', fps: 4 });
bxArt('hidra_cab', 90, 90, 45, 45, 2, (h, fr) => {
  const R = h.R, G = R.moss, j = fr * 2;
  h.F(h.P([[-18, 6], [-14, -8], [0, -14], [16, -10], [26, -2], [26, 4], [14, 8 + j], [-6, 10]]), G, 1.4, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true });
  h.F(h.P([[10, 8 + j], [26, 6 + j], [22, 14 + j], [8, 14 + j]]), G, 1, { ol: 0 }); for (const x of [14, 19, 24]) h.F(h.P([[x - 1, 8 + j], [x, 11 + j], [x + 1, 8 + j]]), R.bone, 3, {});
  h.eye(8, -6, 3, 2.6, { pupil: true, hr: 2, ha: 110 }); h.F(h.P([[-6, -12], [-10, -20], [-2, -14]]), R.bone, 1.6, {});
}, { acc: '#a3e635', acc2: '#13230a', fps: 3 });

// ---- 22. Mariposa Lunar: asas largas com olhos luminosos e corpo felpudo ----
bxArt('mariposa', 200, 150, 100, 76, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, fl = Math.sin(ph) * .5 + .5;
  for (const s of [-1, 1]) {
    const up = h.P([[s * 4, -6], [s * 18, -26 - fl * 14], [s * 50, -44 - fl * 10], [s * 72, -30 - fl * 6], [s * 66, -8], [s * 34, 0]]), lo = h.P([[s * 4, 0], [s * 40, 2], [s * 60, 14 + fl * 4], [s * 48, 30 + fl * 4], [s * 22, 24], [s * 6, 10]]);
    h.F(up, R.violet, 1.3, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true }); h.F(lo, R.violet, 1.1, { hi: 1.2, lo: 1.2, ol: 0, noise: .3, r2: true });
    h.G(h.E(s * 46, -26 - fl * 8, 9, 8), { hr: 3, ha: 120, top: 5 }); h.F(h.E(s * 46, -26 - fl * 8, 3.6, 3.6), R.shade, 1, {}); h.G(h.E(s * 40, 14 + fl * 3, 5, 4), { hr: 2, ha: 90 });
    for (let i = 0; i < 4; i++) h.L(s * 6, -2, s * (34 + i * 10), -26 - i * 4 - fl * 8, R.plum, .5);
  }
  h.F(h.E(0, 4, 8, 16), R.cloth, 1.8, { hi: 1.3, ol: 0, noise: .6 }); for (const y of [-2, 6, 14]) h.F(h.S(-7, y, 7, y, 2), R.plum, 1.6, {});
  h.F(h.E(0, -16, 8, 7), R.cloth, 2, { hi: 1.2, ol: 0, noise: .5 }); h.eye(-3.5, -17, 2.4, 2.4, { pupil: false, hr: 1, ha: 100 }); h.eye(3.5, -17, 2.4, 2.4, { pupil: false, hr: 1, ha: 100 });
  for (const s of [-1, 1]) h.F(h.C([[s * 3, -21], [s * 12, -34 - fl * 3], [s * 22, -36]], 2, 1, 4), R.bone, 1.8, { ol: 0 });
  for (let i = 0; i < 8; i++) h.put(-50 + hash2(i, 3, fr) * 100, -10 + hash2(i, 5, fr) * 50, [220, 200, 255], 170);
}, { acc: '#c4b5fd', acc2: '#150a30', fps: 9 });
