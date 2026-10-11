/* ============================================================
   05i_bxart3: sprites dos chefes novos do Ato III · Hardmode (ver 05f_bxart.js)
   ============================================================ */
// ---- 23. Ceifador Espectral: manto roto, caveira no capuz, foice de lâmina azul-fantasma ----
bxArt('ceifador', 180, 210, 90, 118, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 2.5;
  h.F(h.S(36, 66, 28, -62, 2.8), R.wood, 1.2, {});
  h.G(h.P([[28, -64], [42, -82], [64, -78], [78, -58], [70, -52], [60, -66], [46, -68], [32, -54]]), { hr: 3, ha: 110, top: 5.2 });
  const rb = h.P([[-14, -22], [14, -22], [24, 0], [32, 30], [30, 54 + sw], [20, 48], [14, 62 - sw], [6, 50], [0, 66 + sw], [-8, 50], [-16, 60 - sw], [-22, 46], [-32, 52 + sw], [-30, 28], [-24, 4]]);
  h.F(rb, R.shade, 1.2, { hi: 1.3, lo: 1.2, ol: 0, noise: .35, r2: true }); h.D(h.E(0, 20, 22, 36), R.cloth, 1.8, .07, 8);
  for (const x of [-18, -9, 0, 10, 19]) h.L(x * .6, -10, x * 1.4, 46 + (x & 7), R.shade, 0);
  h.F(h.P([[-14, -22], [-17, -40], [-8, -53], [0, -58], [8, -53], [17, -40], [14, -22], [0, -18]]), R.shade, 1.4, { hi: 1.2, ol: 0 });
  h.F(h.E(0, -34, 8.4, 10), R.shade, 0, {}); h.F(h.E(0, -30, 5, 6), R.bone, 1.4, { ol: 0 });
  h.eye(-3.5, -37, 2.2, 2.2, { pupil: false, hr: 2, ha: 120 }); h.eye(3.5, -37, 2.2, 2.2, { pupil: false, hr: 2, ha: 120 });
  for (const s of [-1, 1]) { h.F(h.S(s * 18, -16, s * 26, 2, 5), R.shade, 1.2, { ol: 0 }); }
  h.F(h.E(34, 6, 4, 4), R.bone, 2, { ol: 0 }); h.F(h.E(30, 12, 3.4, 3.4), R.bone, 2, { ol: 0 });
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, x = Math.cos(a) * 22, y = 14 + Math.sin(a) * 5; h.put(x, y, [140, 190, 255], 230); }
  for (let i = 0; i < 6; i++) h.put(-30 + hash2(i, 3, fr) * 60, -50 + hash2(i, 5, fr) * 110, [150, 200, 255], 150);
}, { acc: '#60a5fa', acc2: '#0b0a1a', fps: 5 });

// ---- 24. Conde Vampiro: capa aberta de gola alta, olhos rubros e presas ----
bxArt('vampiro', 190, 170, 95, 94, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2;
  h.F(h.P([[-10, -26], [-40, -10 + sw], [-52, 30], [-40, 44 + sw], [-24, 38], [-8, 46], [0, 12]]), R.wine, 1, { ol: 0, noise: .4 });   // capa esquerda
  h.F(h.P([[10, -26], [40, -10 - sw], [52, 30], [40, 44 - sw], [24, 38], [8, 46], [0, 12]]), R.wine, 1.2, { ol: 0, noise: .4 });
  h.F(h.P([[-10, -24], [-36, -10 + sw], [-44, 24], [-30, 34], [-10, 30]]), R.blood, 1.4, { noise: .3 }); h.F(h.P([[10, -24], [36, -10 - sw], [44, 24], [30, 34], [10, 30]]), R.blood, 1.6, { noise: .3 });   // forro
  for (const s of [-1, 1]) h.F(h.P([[s * 6, 14], [s * 16, 14], [s * 18, 40], [s * 6, 40]]), R.ink, 1.2, { ol: 0 });
  h.F(h.P([[-16, -16], [16, -16], [14, 16], [-14, 16]]), R.ink, 1.3, { hi: 1.2, ol: 0, noise: .3 });
  h.F(h.P([[-4, -14], [4, -14], [3, 14], [-3, 14]]), R.bone, 3, {}); for (const y of [-8, 0, 8]) h.G(h.E(0, y, 1.2, 1.2), { hr: 1, ha: 60 });
  h.F(h.P([[-18, -20], [-24, -42], [-10, -30], [-6, -20]]), R.ink, 1.5, { ol: 0 }); h.F(h.P([[18, -20], [24, -42], [10, -30], [6, -20]]), R.ink, 1.5, { ol: 0 });   // gola
  h.F(h.E(0, -32, 9, 11), R.bone, 3.2, { hi: 1.2, ol: 0, noise: .15 }); h.F(h.P([[-9, -36], [-6, -44], [0, -41], [6, -44], [9, -36], [6, -40], [0, -37], [-6, -40]]), R.shade, 0.8, { ol: 0 });
  h.eye(-3.6, -32, 2.4, 1.8, { pupil: false, hr: 2, ha: 110 }); h.eye(3.6, -32, 2.4, 1.8, { pupil: false, hr: 2, ha: 110 });
  h.F(h.S(-2, -25, 2, -25, 1.6), R.shade, 0, {}); h.F(h.P([[-3, -25], [-2, -20], [-1, -25]]), R.bone, 5, {}); h.F(h.P([[1, -25], [2, -20], [3, -25]]), R.bone, 5, {});
  for (const s of [-1, 1]) { h.F(h.S(s * 14, -10, s * 24, 6, 4), R.ink, 1.2, { ol: 0 }); h.F(h.E(s * 25, 8, 3.4, 3.4), R.bone, 3, {}); }
  h.G(h.E(30, 10, 2.4, 2.4), { hr: 2, ha: 90 });   // taça
  h.F(h.P([[28, 6], [34, 6], [32, 12], [30, 12]]), R.steel, 2, {});
}, { acc: '#e11d48', acc2: '#1a0508', fps: 4 });

// ---- 25. Medusa de Pedra: busto de górgona com cabelo de serpentes e cauda enrolada ----
bxArt('medusa', 200, 190, 100, 100, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, J = R.jade;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; h.F(h.C([[Math.cos(a) * 6, 14 + i * 3], [Math.cos(a + 1.6) * 24, 26 + i * 6 + Math.sin(ph + i) * 2], [Math.cos(a + .4) * 14, 42 + i * 3]], 9 - i, 5 - i, 5), J, 1.1, { hi: 1, lo: 1.1, ol: 0, noise: .3 }); }
  const tor = h.P([[-14, -14], [14, -14], [18, 8], [10, 16], [-10, 16], [-18, 8]]); h.F(tor, J, 1.6, { hi: 1.2, lo: 1.2, ol: 0, noise: .3, r2: true });
  h.F(h.P([[-12, -12], [12, -12], [10, 0], [-10, 0]]), R.moss, .8, { ol: 0 }); h.G(h.E(0, -6, 2, 2), { hr: 2, ha: 90 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 14, -10], [s * 28, 0 + Math.sin(ph + s) * 3], [s * 34, 14]], 5, 3.4, 4), J, 1.5, { ol: 0 }); h.F(h.E(s * 34, 16, 3.6, 3.6), J, 1.8, { ol: 0 }); }
  for (let i = 0; i < 9; i++) { const a = -PI * .95 + i / 8 * PI * .95 * 2 * .5 - 0.1, bx0 = Math.cos(a) * 8, by0 = -28 + Math.sin(a) * 6, wob = Math.sin(ph + i * 1.3) * 4, ex = Math.cos(a) * 30 + wob, ey = -32 + Math.sin(a) * 22 - 10; h.F(h.C([[bx0, by0], [(bx0 + ex) / 2 + wob, (by0 + ey) / 2 - 8], [ex, ey]], 4, 2, 4), J, .9 + (i & 1) * .5, { ol: 0, hi: .8 }); h.G(h.E(ex, ey, 1.4, 1.4), { hr: 1, ha: 80 }); }
  h.F(h.E(0, -28, 10, 12), J, 2.6, { hi: 1.2, lo: 1.1, ol: 0, noise: .15 }); h.F(h.P([[-8, -20], [8, -20], [4, -14], [-4, -14]]), J, 1.4, { ol: 0 });
  h.eye(-4, -30, 3, 2.4, { pupil: true, hr: 2, ha: 130 }); h.eye(4, -30, 3, 2.4, { pupil: true, hr: 2, ha: 130 });
  h.F(h.S(-3, -20, 3, -20, 1.2), R.shade, 0, {}); h.F(h.P([[-8, -34], [-4, -38], [-6, -33]]), R.shade, 0, {});
}, { acc: '#bef264', acc2: '#082017', fps: 5 });

// ---- 26. Sereia Abissal: busto azul de cabelos ondulantes e cauda de peixe ----
bxArt('sereia', 190, 190, 95, 96, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 4, B = R.sky;
  h.F(h.C([[0, 12], [-8, 28 + sw * .5], [6, 44], [-2, 58 - sw]], 20, 8, 6), R.teal, 1.2, { hi: 1.2, lo: 1.1, ol: 0, noise: .3, r2: true });
  h.F(h.P([[-2, 56 - sw], [-26, 64 - sw * 1.5], [-30, 78 - sw], [-10, 66 - sw], [2, 74 - sw], [10, 62 - sw]]), R.teal, 1.6, { ol: 0, noise: .3 });   // nadadeira da cauda
  for (const x of [-4, 2, 8]) h.G(h.E(x, 22 + x, 1.4, 1.4), { hr: 1, ha: 60 });
  h.F(h.P([[-6, 12], [-14, 22], [-12, 30], [-4, 22]]), R.teal, 1.8, { ol: 0 });   // barbatana lateral
  h.A(h.C([[-8, -34], [-30, -26 + sw], [-34, -2], [-26, 20 - sw], [-30, 40]], 12, 4, 5), [30, 60, 140], 200); h.A(h.C([[8, -34], [28, -24 - sw], [34, 0], [28, 22 + sw], [32, 42]], 12, 4, 5), [30, 60, 140], 200);   // cabelo
  h.F(h.P([[-12, -14], [12, -14], [14, 8], [-14, 8]]), B, 2.2, { hi: 1.1, lo: 1.1, ol: 0, noise: .2 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 12, -10], [s * 24, -4 + Math.sin(ph + s) * 3], [s * 30, -18]], 4, 2.6, 4), B, 2.2, { ol: 0 }); }
  h.F(h.P([[-12, -2], [12, -2], [10, 6], [0, 8], [-10, 6]]), R.teal, 1.4, { ol: 0 });   // concha
  h.G(h.E(-6, 0, 3, 2.4), { hr: 1, ha: 70 }); h.G(h.E(6, 0, 3, 2.4), { hr: 1, ha: 70 });
  h.F(h.E(0, -26, 9, 10.5), B, 3, { hi: 1.1, ol: 0, noise: .15 }); h.F(h.P([[-9, -30], [-6, -37], [0, -35], [6, -37], [9, -30], [4, -32], [-4, -32]]), R.sky, .8, { ol: 0 });
  h.eye(-3.6, -26, 2.4, 2.2, { pupil: false, hr: 2, ha: 110 }); h.eye(3.6, -26, 2.4, 2.2, { pupil: false, hr: 2, ha: 110 });
  h.F(h.S(-2, -19, 2, -19, 1.2), R.shade, 1, {});
  h.F(h.P([[-8, -39], [-5, -47], [-2, -41], [0, -49], [2, -41], [5, -47], [8, -39]]), R.gold, 2.6, { ol: 0 });   // coroa
  for (let i = 0; i < 7; i++) h.put(-24 + hash2(i, 3, fr) * 48, -30 + hash2(i, 4, fr) * 90, [200, 240, 255], 150);
}, { acc: '#38bdf8', acc2: '#06223a', fps: 5 });

// ---- 27. Armadura Viva: cavaleiro vazio, elmo de brasa roxa e espadão ----
bxArt('armadura', 190, 190, 95, 104, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 1.5, S = R.steel;
  for (const s of [-1, 1]) { h.F(h.P([[s * 6, 24], [s * 18, 24], [s * 20, 46], [s * 4, 46]]), S, 1.3, { hi: 1.1, lo: 1.2, ol: 0, noise: .2, r2: true }); h.F(h.P([[s * 2, 44], [s * 22, 44], [s * 24, 50], [s * 2, 50]]), S, 1.6, { ol: 0 }); }
  h.F(h.P([[-18, -20], [18, -20], [22, 4], [16, 26], [-16, 26], [-22, 4]]), S, 1.4, { hi: 1.3, lo: 1.3, ol: 0, noise: .2, r2: true });
  h.F(h.P([[-6, -18], [6, -18], [8, 22], [-8, 22]]), R.iron, 1.2, { ol: 0 }); h.G(h.S(0, -12, 0, 14, 1.4), { hr: 2, ha: 70, top: 4.4 });
  h.F(h.P([[-16, 20], [16, 20], [20, 40], [0, 44], [-20, 40]]), R.violet, .9, { ol: 0, noise: .4 });   // saiote rasgado
  for (const s of [-1, 1]) { h.F(h.P([[s * 14, -24], [s * 30, -22], [s * 34, -8], [s * 18, -10]]), S, 1.7, { hi: 1.3, ol: 0, noise: .2 }); h.F(h.S(s * 28, -8, s * 32, 14, 8), S, 1.3, { ol: 0 }); h.F(h.E(s * 32, 18, 6, 5.4), S, 1.8, { ol: 0 }); }
  h.F(h.S(-32, 14, -30, -66, 3), R.wood, 1.2, {}); h.F(h.P([[-34, -66], [-30, -92], [-26, -66]]), R.steel, 2.2, { ol: 0, hi: 1.4 }); h.F(h.P([[-40, -62], [-20, -62], [-20, -58], [-40, -58]]), R.gold, 2, {}); h.G(h.S(-30, -86, -30, -68, 1), { hr: 1, ha: 60, top: 4.6 });   // espadão
  const hm = h.P([[-11, -24], [-12, -42], [-6, -52], [6, -52], [12, -42], [11, -24], [4, -20], [-4, -20]]); h.F(hm, S, 1.8, { hi: 1.4, lo: 1.2, ol: 0, noise: .15 });
  h.F(h.P([[-7, -38], [7, -38], [7, -34], [-7, -34]]), R.shade, 0, {}); h.eye(-3, -36, 2.2, 1.4, { pupil: false, hr: 1, ha: 110 }); h.eye(3, -36, 2.2, 1.4, { pupil: false, hr: 1, ha: 110 });
  h.F(h.P([[-2, -52], [0, -64 + sw], [2, -52]]), R.violet, 2.4, {}); h.F(h.P([[-2, -52], [-8, -62 + sw], [0, -53]]), R.violet, 1.6, {});   // penacho
  for (let i = 0; i < 6; i++) h.put(-24 + hash2(i, 3, fr) * 48, -40 + hash2(i, 4, fr) * 90, [210, 190, 255], 150);
}, { acc: '#a78bfa', acc2: '#120a24', fps: 4 });

// ---- 28. Dragão Adormecido: serpente alada de brasas, vista de lado ----
bxArt('dragao', 260, 190, 130, 96, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, up = Math.sin(ph) * 10, D = R.ember;
  for (const s of [0, 1]) { const k = s ? .8 : 1, tipY = -50 - up * k; const w = [[-4, -10], [-26 * k, -34 - up * .4], [-58 * k, tipY], [-92 * k, tipY + 14], [-76 * k, tipY + 24], [-84 * k, tipY + 40], [-60 * k, tipY + 42], [-40 * k, tipY + 52], [-14, 4]]; h.F(h.P(w), s ? R.shade : R.ink, 1.3, { hi: 1.2, lo: 1.1, ol: 0, noise: .3, r2: true }); for (let i = 0; i < 4; i++) h.G(h.S(-8 - i * 14 * k, -6 - i * 4, -22 - i * 20 * k, tipY + 12 + i * 8, 1.2), { hr: 1, ha: 50, top: 4.4, edge: 2 }); }
  h.F(h.C([[-10, 8], [-40, 22], [-70, 14], [-96, 30]], 16, 3, 7), R.ink, 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .3, r2: true });
  for (const x of [-30, -52, -76]) h.F(h.P([[x - 4, 10 - (x < -50 ? 4 : 0)], [x, -4 - (x < -50 ? 4 : 0)], [x + 4, 10]]), D, 1.4, { ol: 0 });
  h.F(h.P([[-24, -8], [-4, -16], [24, -10], [34, 4], [24, 22], [-6, 28], [-26, 20]]), R.ink, 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .3, r2: true });
  h.F(h.P([[-18, 16], [20, 14], [16, 24], [-10, 26]]), D, 1.2, { ol: 0, noise: .4 }); h.G(h.S(-14, 20, 14, 18, 1.6), { hr: 1, ha: 60, top: 4.4 });
  h.F(h.C([[20, -6], [36, -20], [46, -26]], 11, 9, 4), R.ink, 1.4, { ol: 0, noise: .3 });
  h.F(h.P([[40, -34], [62, -36], [70, -28], [66, -20], [44, -18]]), R.ink, 1.6, { hi: 1.3, ol: 0, noise: .25 });
  h.F(h.P([[60, -22], [74, -20], [70, -14], [58, -16]]), R.ink, 1.1, { ol: 0 }); h.G(h.S(60, -18, 70, -16, 1), { hr: 1, ha: 60, top: 4.4 });
  h.F(h.P([[42, -34], [36, -48], [46, -38]]), R.bone, 1.8, { ol: 0 }); h.F(h.P([[50, -36], [48, -52], [56, -38]]), R.bone, 1.4, { ol: 0 });
  h.eye(56, -29, 2.4, 1.8, { pupil: false, hr: 1, ha: 100 });
  for (const [x, y] of [[8, -12], [20, -4]]) h.F(h.P([[x - 3, y], [x, y - 8], [x + 3, y]]), D, 1.3, { ol: 0 });
}, { acc: '#ff9f1c', acc2: '#241008', fps: 6 });

// ---- 29. Gêmeos Eclipse: sol (variante 0) e lua (variante 1) com rosto ----
bxArt('gemeos', 170, 170, 85, 85, 3, (h, fr, v) => {
  const R = h.R, ph = fr / 3 * TAU, moon = v === 1, B = moon ? R.sky : R.gold;
  if (!moon) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + ph * .1, r0 = 24, r1 = 34 + (i & 1) * 8; h.F(h.P([[Math.cos(a - .12) * r0, Math.sin(a - .12) * r0], [Math.cos(a) * r1, Math.sin(a) * r1], [Math.cos(a + .12) * r0, Math.sin(a + .12) * r0]]), R.gold, 3.4, { ol: 0 }); }
  h.F(h.E(0, 0, 25, 25), B, moon ? 1.8 : 2.6, { hi: 1.4, lo: 1.4, ol: 0, noise: .2, r2: true });
  if (moon) { for (const [x, y, r] of [[-10, -8, 5], [8, 6, 6], [-4, 12, 3.4], [12, -12, 3]]) h.F(h.E(x, y, r, r), R.sky, 1, { ol: 0, hi: .4, lo: .8 }); h.F(h.P([[10, -24], [22, -8], [24, 10], [16, 22], [22, 8], [20, -10]]), R.ink, 1, { noise: .2 }); }
  else h.D(h.E(0, 0, 25, 25), R.amberr, 3.4, .12, 5);
  h.eye(-8, -4, 4, 3.2, { pupil: true, hr: 2, ha: 130 }); h.eye(8, -4, 4, 3.2, { pupil: true, hr: 2, ha: 130 });
  h.F(h.P([[-9, 8], [9, 8], [6, 14], [0, 16], [-6, 14]]), R.shade, 0, { ol: 0 }); h.G(h.S(-5, 11, 5, 11, 1), { hr: 1, ha: 50, top: 4 });
}, { acc: '#fde047', acc2: '#3a2a06', vars: 2, fps: 4 });

// ---- 30. Prisma Vivo: cristal octaédrico de núcleo que troca de elemento (4 variantes) ----
bxArt('prisma', 170, 170, 85, 85, 3, (h, fr, v) => {
  const R = h.R, ph = fr / 3 * TAU, cols = [[251, 146, 60], [125, 211, 252], [253, 224, 71], [163, 230, 53]], rp = bxGlowRamp(cols[v]);
  const GL = (m, o) => { bpGlow(h.b, m, rp, Object.assign({ edge: 1, top: 5.4, p: .8, hr: 3, ha: 120, halo: cols[v] }, o)); return m; };
  const top = h.P([[0, -34], [20, -8], [0, 0], [-20, -8]]), bot = h.P([[0, 34], [20, 8], [0, 0], [-20, 8]]), lf = h.P([[-30, 0], [-20, -8], [0, 0], [-20, 8]]), rt = h.P([[30, 0], [20, -8], [0, 0], [20, 8]]);
  h.F(lf, R.stone, 1.1, { hi: .8, lo: 1.1, ol: 0, noise: .15 }); h.F(rt, R.stone, 1.9, { hi: .8, lo: 1, ol: 0, noise: .15 }); h.F(top, R.stone, 2.6, { hi: 1, lo: 1, ol: 0, noise: .15 }); h.F(bot, R.stone, 1, { hi: .6, lo: 1, ol: 0, noise: .15 });
  GL(h.E(0, 0, 11, 11), { hr: 4, ha: 130 }); h.put(-3, -3, [255, 255, 255], 255);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + ph * .6, x = Math.cos(a) * 40, y = Math.sin(a) * 30; GL(h.P([[x, y - 5], [x + 3.4, y], [x, y + 5], [x - 3.4, y]]), { hr: 2, ha: 90 }); }
  for (const [x, y] of [[-14, -22], [16, 18], [-20, 14], [22, -16]]) h.put(x, y, [255, 255, 255], 220);
}, { acc: '#fff1c2', acc2: '#0f1020', vars: 4, fps: 4 });

// ---- 31. Magnetar Ferroso: ímã em ferradura de polos vermelho e azul com olho central ----
bxArt('magnetar', 180, 170, 90, 86, 3, (h, fr) => {
  const R = h.R, ph = fr / 3 * TAU;
  const ring = h.U(h.E(0, 2, 28, 28)), hole = h.E(0, 10, 15, 18), cut = h.P([[-12, 12], [12, 12], [12, 40], [-12, 40]]);
  const ar = h.N(h.N(ring, hole), cut); const L = h.I(ar, h.P([[-40, -40], [0, -40], [0, 40], [-40, 40]])), Rt = h.I(ar, h.P([[0, -40], [40, -40], [40, 40], [0, 40]]));
  h.F(L, R.blood, 1.5, { hi: 1.3, lo: 1.4, ol: 0, noise: .2, r2: true }); h.F(Rt, R.sky, 1.4, { hi: 1.3, lo: 1.4, ol: 0, noise: .2, r2: true });
  h.F(h.P([[-28, 24], [-12, 24], [-12, 38], [-28, 38]]), R.steel, 2.4, { ol: 0, hi: 1.2 }); h.F(h.P([[12, 24], [28, 24], [28, 38], [12, 38]]), R.steel, 2.4, { ol: 0, hi: 1.2 });
  h.F(h.P([[-28, 30], [-12, 30], [-12, 32], [-28, 32]]), R.shade, 0, {}); h.F(h.P([[12, 30], [28, 30], [28, 32], [12, 32]]), R.shade, 0, {});
  h.G(h.E(0, 0, 9, 7), { hr: 3, ha: 120 }); h.F(h.E(0, 0, 3.2, 3.2), R.shade, 0, {});
  for (let i = 0; i < 3; i++) { const k = 1 + i * .32; h.G(h.C([[-20 * k, 38], [-30 * k, 60 + i * 4], [0, 66 + i * 6 + Math.sin(ph + i) * 2], [30 * k, 60 + i * 4], [20 * k, 38]], 1.2, 1.2, 6), { hr: 1, ha: 40, top: 3.6, edge: 2 }); }
  for (let i = 0; i < 6; i++) h.put(-30 + hash2(i, 3, fr) * 60, -30 + hash2(i, 5, fr) * 80, [200, 220, 255], 180);
}, { acc: '#f87171', acc2: '#1a0a0a', fps: 5 });

// ---- 32. Titã de Lava: gigante de rocha com veios de magma e punhos derretidos ----
bxArt('titalava', 240, 230, 120, 126, 3, (h, fr) => {
  const R = h.R, sw = Math.round(Math.sin(fr / 3 * TAU) * 1.5), S = R.shade, M = R.ember;
  for (const s of [-1, 1]) { h.F(h.P([[s * 8, 22], [s * 28, 22], [s * 30, 56], [s * 4, 56]]), S, 1.5, { hi: 1.1, lo: 1.2, ol: 0, noise: .45, r2: true }); h.F(h.P([[s * 2, 52], [s * 34, 52], [s * 36, 64], [s * 2, 64]]), S, 1.8, { ol: 0, noise: .4 }); h.G(h.S(s * 10, 30, s * 20, 44, 1.6), { hr: 1, ha: 60, top: 4.2 }); }
  const tor = h.P([[-36, -26 + sw], [-26, -42 + sw], [26, -42 + sw], [36, -26 + sw], [32, 24], [-32, 24]]);
  h.F(tor, S, 1.6, { hi: 1.3, lo: 1.3, ol: 0, noise: .5, r2: true });
  h.G(h.P([[-4, -36], [2, -22], [-6, -10], [4, 4], [-2, 18], [8, 4], [0, -10], [8, -22], [4, -36]]), { hr: 2, ha: 100, top: 4.8 });
  for (const [x0, y0, x1, y1] of [[-24, -30, -18, -10], [22, -32, 16, -6], [-20, 6, -26, 20], [20, 8, 28, 18]]) h.G(h.S(x0, y0, x1, y1, 1.8), { hr: 1, ha: 70, top: 4.4 });
  for (const s of [-1, 1]) { h.F(h.P([[s * 30, -42 + sw], [s * 52, -40 + sw], [s * 56, -22 + sw], [s * 34, -20 + sw]]), S, 1.9, { hi: 1.3, ol: 0, noise: .4 }); h.F(h.S(s * 46, -22, s * 52, 14 + sw * s, 14), S, 1.5, { ol: 0, noise: .45 }); h.F(h.E(s * 52, 28 + sw, 16, 14), S, 1.8, { hi: 1.2, ol: 0, noise: .45 }); h.G(h.E(s * 52, 30 + sw, 9, 7), { hr: 2, ha: 90, top: 4.6 }); h.G(h.S(s * 50, 42 + sw, s * 50, 52 + sw, 2), { hr: 1, ha: 70 }); }
  h.F(h.P([[-12, -42 + sw], [-14, -62 + sw], [-6, -72 + sw], [6, -72 + sw], [14, -62 + sw], [12, -42 + sw]]), S, 1.8, { hi: 1.3, ol: 0, noise: .4 });
  for (const s of [-1, 1]) h.F(h.C([[s * 10, -68], [s * 22, -78], [s * 20, -94]], 5, 1.6, 4), R.rust, 1.6, { ol: 0 });
  h.eye(-5, -56 + sw, 3, 2, { pupil: false, hr: 2, ha: 120 }); h.eye(5, -56 + sw, 3, 2, { pupil: false, hr: 2, ha: 120 }); h.G(h.S(-5, -48 + sw, 5, -48 + sw, 1.4), { hr: 1, ha: 70, top: 4.4 });
  h.D(tor, R.stone, 1.4, .06, 11);
}, { acc: '#ff5a1f', acc2: '#1a0a04', fps: 4 });

// ---- 33. Rainha das Tempestades: nuvem de saia escura, coroa de raios e olhos violeta ----
bxArt('tempestade', 190, 170, 95, 88, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  for (let i = 0; i < 7; i++) { const x = -36 + i * 12, y = 20 + Math.sin(ph + i) * 3 + (i & 1) * 6; h.F(h.E(x, y, 15, 12), R.night, 1 + (i & 1) * .4, { hi: 1.1, lo: 1.2, ol: 0, noise: .5, r2: true }); }
  h.F(h.E(0, 10, 34, 18), R.night, 1.2, { hi: 1.2, lo: 1.2, ol: 0, noise: .5, r2: true });
  for (const [x, y] of [[-26, 24], [-8, 30], [14, 28], [30, 22]]) h.G(h.P([[x, y - 8], [x - 3, y], [x + 1, y + 2], [x - 2, y + 10]]), { hr: 1, ha: 70, top: 4.6, edge: 2 });
  h.F(h.P([[-14, -14], [14, -14], [18, 10], [-18, 10]]), R.cloth, 1.3, { hi: 1.2, ol: 0, noise: .35 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 14, -10], [s * 30, -16 + Math.sin(ph + s) * 4], [s * 42, -28]], 6, 4, 4), R.cloth, 1.4, { ol: 0 }); h.G(h.E(s * 44, -30, 4, 4), { hr: 3, ha: 120 }); }
  h.F(h.E(0, -26, 11, 13), R.bone, 2, { hi: 1.2, ol: 0, noise: .2 }); h.F(h.P([[-12, -30], [-16, -20], [-8, -16], [-8, -30]]), R.night, 1.2, { ol: 0 }); h.F(h.P([[12, -30], [16, -20], [8, -16], [8, -30]]), R.night, 1.2, { ol: 0 });
  h.eye(-4, -27, 2.6, 2, { pupil: false, hr: 2, ha: 120 }); h.eye(4, -27, 2.6, 2, { pupil: false, hr: 2, ha: 120 });
  for (const [x, k] of [[-10, 1], [-4, 1.5], [3, 1.2], [10, 1], [0, 2]]) h.G(h.P([[x - 2, -36], [x + 1, -36 - 14 * k], [x - 1, -36 - 6 * k], [x + 3, -36 - 22 * k], [x + 2, -36]]), { hr: 1, ha: 90, top: 5, edge: 2 });   // coroa de raios
  for (let i = 0; i < 6; i++) h.put(-40 + hash2(i, 3, fr) * 80, -20 + hash2(i, 4, fr) * 50, [220, 210, 255], 150);
}, { acc: '#b794f4', acc2: '#0d0a24', fps: 5 });

// ---- 34. Devorador de Luz: esfera negra de aro branco, boca de presas e disco de acreção ----
bxArt('devorador', 190, 170, 95, 84, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  h.F(h.P([[-70, 6], [-40, -4], [40, -4], [70, 6], [40, 12], [-40, 12]]), R.violet, .9, { ol: 0, noise: .4 }); h.A(h.P([[-72, 6], [-40, -2], [40, -2], [72, 6], [40, 8], [-40, 8]]), [200, 180, 255], 90);
  const orb = h.E(0, 0, 30, 30); h.F(orb, R.shade, .4, { hi: .4, lo: .4, ol: 1, noise: .1 });
  h.G(h.P([[-30, -2], [-26, -16], [-14, -26], [0, -30], [14, -26], [26, -16], [30, -2], [26, -14], [14, -24], [0, -27], [-14, -24], [-26, -14]]), { hr: 3, ha: 130, top: 5.4, edge: 2 });
  h.F(h.E(0, -2, 22, 22), R.ink, .2, { hi: 0, lo: 0 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + ph * .4; h.F(h.P([[Math.cos(a - .15) * 12, Math.sin(a - .15) * 10 + 4], [Math.cos(a) * 24, Math.sin(a) * 20 + 4], [Math.cos(a + .15) * 12, Math.sin(a + .15) * 10 + 4]]), R.bone, 3.6, { ol: 0 }); }
  h.F(h.E(0, 4, 12, 9), R.shade, 0, {}); h.eye(0, -10, 6, 7, { pupil: true, hr: 3, ha: 130 });
  h.F(h.P([[-70, 6], [-40, 14], [40, 14], [70, 6], [40, 20], [-40, 20]]), R.violet, 1.3, { ol: 0, noise: .4 }); h.A(h.P([[-72, 6], [-40, 12], [40, 12], [72, 6], [40, 18], [-40, 18]]), [200, 180, 255], 80);
  for (let i = 0; i < 12; i++) { const a = hash2(i, 1, 6) * TAU + ph * (i & 1 ? 1 : -1) * .5, r = 36 + hash2(i, 2, 6) * 30; h.put(Math.cos(a) * r, Math.sin(a) * r * .55, [235, 225, 255], 200); }
}, { acc: '#e5e7eb', acc2: '#06060e', fps: 5, noOutline: true });

// ---- 35. Arquimago Espelhado: manto prateado com um grande espelho oval às costas ----
bxArt('espelho', 170, 190, 85, 100, 3, (h, fr) => {
  const R = h.R, ph = fr / 3 * TAU, sw = Math.sin(ph) * 2;
  h.F(h.E(0, -6, 30, 38), R.steel, 1.2, { hi: 1.3, lo: 1.3, ol: 0, noise: .1 }); h.F(h.E(0, -6, 25, 33), R.ice, 3.2, { hi: .6, lo: .8, ol: 0, noise: .08 });
  h.A(h.P([[-18, -34], [-6, -34], [-22, -6], [-30, -6]]), [255, 255, 255], 110); h.A(h.P([[4, -34], [10, -34], [-6, 2], [-12, 2]]), [255, 255, 255], 70);
  h.G(h.C([[-24, 6], [-14, 26], [0, 32], [14, 26], [24, 6]], 1.4, 1.4, 6), { hr: 1, ha: 50, top: 4.6, edge: 2 });
  const robe = h.P([[-12, -14], [12, -14], [20, 8], [26, 30], [16, 46 + sw], [8, 38], [2, 50], [-4, 40], [-12, 48 - sw], [-18, 38], [-26, 34], [-20, 12]]);
  h.F(robe, R.slate, 1.2, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true }); h.F(h.P([[-4, -14], [4, -14], [6, 46], [-6, 46]]), R.steel, 2, { ol: 0, noise: .1 });
  h.F(h.P([[-14, -14], [-24, -22], [-14, -24], [-8, -26], [8, -26], [14, -24], [24, -22], [14, -14]]), R.steel, 1.8, { ol: 0, hi: 1.3 });
  h.F(h.P([[-10, -26], [-9, -40], [0, -46], [9, -40], [10, -26], [0, -22]]), R.steel, 2, { hi: 1.4, ol: 0 }); h.F(h.E(0, -32, 5.6, 7), R.ice, 3.4, { ol: 0, noise: .05 });
  h.eye(0, -34, 2.6, 1.6, { pupil: false, hr: 1, ha: 100 });
  h.F(h.S(30, 40, 32, -34, 2), R.steel, 1.8, {}); h.F(h.P([[28, -30], [32, -44], [36, -30], [32, -26]]), R.ice, 3.4, { ol: 0 }); h.G(h.E(32, -35, 2, 4), { hr: 2, ha: 100 });
  for (const [x, y] of [[-40, -30], [38, -12], [-36, 26], [42, 34]]) h.F(h.P([[x - 4, y], [x, y - 7], [x + 4, y], [x, y + 6]]), R.ice, 3.6, { ol: 0 });
}, { acc: '#cbd5e1', acc2: '#10141c', fps: 4 });

// ---- 36. Obelisco Pulsante: pilar rúnico de pedra negra com estilhaços em órbita ----
bxArt('obelisco', 180, 220, 90, 118, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  h.F(h.P([[-30, 46], [30, 46], [26, 56], [-26, 56]]), R.stone, 1, { hi: .8, lo: 1, ol: 0, noise: .3 }); h.F(h.P([[-24, 40], [24, 40], [30, 46], [-30, 46]]), R.stone, 1.4, { ol: 0, noise: .3 });
  const ob = h.P([[-18, 40], [-14, -40], [0, -62], [14, -40], [18, 40]]); h.F(ob, R.shade, 1.1, { hi: 1.4, lo: 1.3, ol: 0, noise: .3, r2: true });
  h.F(h.P([[0, -62], [14, -40], [18, 40], [8, 40], [6, -40]]), R.ink, .8, { ol: 0, noise: .3 });
  for (const [y, w] of [[-34, 8], [-14, 10], [8, 11], [28, 12]]) { h.G(h.P([[-w + 3, y], [0, y - 4], [w - 3, y], [0, y + 4]]), { hr: 1, ha: 80, top: 4.6 }); h.G(h.S(0, y + 4, 0, y + 14, 1.2), { hr: 1, ha: 50, top: 4.2 }); }
  h.G(h.P([[-4, -56], [0, -64], [4, -56], [0, -50]]), { hr: 3, ha: 130, top: 5.4 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + ph * .5, x = Math.cos(a) * 34, y = -10 + Math.sin(a) * 52; h.F(h.P([[x - 3, y + 6], [x, y - 8], [x + 3, y + 6]]), R.stone, 1.8, { ol: 0, hi: 1.2 }); h.G(h.S(x, y - 6, x, y + 4, 1), { hr: 1, ha: 60, top: 4.4 }); }
  for (const x of [-12, 12]) h.L(x, 40, x * 1.1, 56, R.shade, 0);
}, { acc: '#f472b6', acc2: '#0d0a14', fps: 5 });

// ---- 37. Coveiro Eterno: figura curva de chapéu largo, pá e lanterna de luz fantasma ----
bxArt('coveiro', 190, 190, 95, 104, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2;
  for (const s of [-1, 1]) { h.F(h.P([[s * 4, 26], [s * 14, 26], [s * 16, 46], [s * 2, 46]]), R.shade, 1.1, { ol: 0 }); h.F(h.P([[s * 0, 44], [s * 18, 44], [s * 20, 50], [s * 0, 50]]), R.iron, 1, { ol: 0 }); }
  h.F(h.P([[-18, -18], [14, -22], [24, 4], [26, 34], [-24, 34], [-24, 4]]), R.cloth, 1.2, { hi: 1.2, lo: 1.2, ol: 0, noise: .4, r2: true }); h.F(h.P([[-18, 26], [24, 26], [30, 38 + sw], [20, 34], [10, 42 - sw], [0, 34], [-10, 42 + sw], [-20, 34], [-28, 40]]), R.shade, .9, { ol: 0, noise: .4 });
  h.F(h.P([[-4, -18], [4, -18], [3, 30], [-3, 30]]), R.slate, 1.2, {});
  h.F(h.S(-34, 44, -26, -32, 3), R.wood, 1.2, {}); h.F(h.P([[-34, -32], [-18, -30], [-20, -14], [-32, -16]]), R.iron, 1.8, { ol: 0, hi: 1.2 });   // pá
  for (const s of [-1, 1]) h.F(h.S(s * 18, -12, s * 28, 10, 6), R.cloth, 1.2, { ol: 0 });
  h.F(h.E(-26, 14, 4, 4), R.bone, 2, {}); h.F(h.E(30, 12, 4, 4), R.bone, 2, {});
  h.F(h.S(32, 12, 32, 22, 1), R.iron, 1.2, {}); h.G(h.E(32, 30 + sw * .5, 6, 7), { hr: 3, ha: 120, top: 5 }); h.F(h.P([[28, 22], [36, 22], [37, 38], [27, 38]]), R.iron, 1, { ol: 0 }); h.G(h.E(32, 30 + sw * .5, 3, 4), { hr: 1, ha: 100 });   // lanterna
  h.F(h.E(0, -30, 9, 10), R.shade, 0, {}); h.eye(-3, -30, 2.2, 1.6, { pupil: false, hr: 2, ha: 110 }); h.eye(3, -30, 2.2, 1.6, { pupil: false, hr: 2, ha: 110 });
  h.F(h.P([[-26, -34], [-12, -38], [-8, -52], [8, -52], [12, -38], [26, -34], [28, -30], [-28, -30]]), R.cloth, 1.2, { hi: 1.3, ol: 0, noise: .3 }); h.F(h.P([[-8, -40], [8, -40], [8, -36], [-8, -36]]), R.shade, .6, {});
  for (let i = 0; i < 7; i++) h.put(26 + hash2(i, 3, fr) * 14, 14 + hash2(i, 4, fr) * 30, [190, 255, 220], 170);
}, { acc: '#a7f3d0', acc2: '#0a1410', fps: 4 });

// ---- 38. Quimera: leão de crina e cabeça de bode nas costas, cauda de serpente (variantes = forma ativa) ----
bxArt('quimera', 230, 170, 115, 88, 4, (h, fr, v) => {
  const R = h.R, sw = Math.sin(fr / 4 * TAU) * 2, C = R.hide;
  for (const x of [-26, -14, 18, 30]) h.F(h.P([[x - 5, 8], [x + 5, 8], [x + 4, 34], [x - 6, 34]]), C, 1.2, { ol: 0, noise: .4 });
  h.F(h.C([[-34, 2], [-56, -4 + sw * 2], [-70, 14], [-80, 6 + sw]], 8, 3, 5), R.moss, 1.2, { ol: 0, noise: .3 });   // cauda de serpente
  h.F(h.P([[-84, 0 + sw], [-96, 4 + sw], [-86, 12 + sw]]), R.moss, 1.8, { ol: 0 }); h.eye(-86, 6 + sw, 1.6, 1.6, { pupil: false, hr: 1, ha: v === 2 ? 130 : 70 });
  h.F(h.P([[-38, -2], [-34, -16], [-10, -22], [18, -20], [34, -12], [38, 6], [26, 16], [-24, 16]]), C, 1.5, { hi: 1.3, lo: 1.3, ol: 0, noise: .4, r2: true });
  h.F(h.C([[-4, -18], [-8, -34], [-2, -50]], 8, 6, 4), C, 1.4, { ol: 0, noise: .4 });   // pescoço do bode
  h.F(h.P([[-10, -50], [8, -50], [10, -40], [-8, -38]]), R.bone, 2.2, { hi: 1.2, ol: 0 }); for (const s of [-1, 1]) h.F(h.C([[s * 4 - 1, -50], [s * 14 - 1, -62], [s * 12 - 1, -74]], 4, 1.4, 4), R.bone, 1.6, { ol: 0 });
  h.eye(-2, -44, 1.8, 1.4, { pupil: false, hr: 1, ha: v === 1 ? 130 : 70 });
  h.F(h.P([[24, -14], [26, -30], [40, -36], [54, -28], [58, -12], [48, 0], [30, 0]]), C, 1.7, { hi: 1.3, ol: 0, noise: .4 });   // cabeça do leão
  for (let i = 0; i < 9; i++) { const a = -PI * .9 + i / 8 * PI * 1.3; h.F(h.P([[40 + Math.cos(a) * 12, -16 + Math.sin(a) * 12], [40 + Math.cos(a) * 24, -16 + Math.sin(a) * 22], [40 + Math.cos(a + .3) * 12, -16 + Math.sin(a + .3) * 12]]), R.rust, 1.2 + (i & 1) * .4, { ol: 0 }); }
  h.F(h.P([[44, -6], [62, -4], [60, 4], [44, 4]]), C, 1.2, { ol: 0 }); for (const x of [48, 53, 58]) h.F(h.P([[x - 1, 3], [x, 7], [x + 1, 3]]), R.bone, 3, {});
  h.eye(46, -20, 2.4, 1.8, { pupil: false, hr: 2, ha: v === 0 ? 130 : 80 }); h.eye(54, -18, 2, 1.6, { pupil: false, hr: 1, ha: v === 0 ? 120 : 70 });
  h.G(h.S(-30, 4, 28, 2, 1.2), { hr: 1, ha: 40, top: 3.6 });
}, { acc: '#f43f5e', acc2: '#241008', vars: 3, fps: 5 });
