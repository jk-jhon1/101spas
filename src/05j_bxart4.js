/* ============================================================
   05j_bxart4: sprites dos chefes novos do Ato IV · Além do Colosso (ver 05f_bxart.js)
   ============================================================ */
// ---- 39. Arauto do Vazio: figura alta de manto rasgado, aureola partida e peito vazio cheio de estrelas ----
bxArt('arauto', 190, 220, 95, 120, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 3;
  const rb = h.P([[-16, -22], [16, -22], [26, 6], [34, 40], [30, 66 + sw], [20, 58], [12, 74 - sw], [4, 60], [-4, 78 + sw], [-12, 60], [-20, 72 - sw], [-26, 56], [-36, 62 + sw], [-34, 36], [-26, 6]]);
  h.F(rb, R.ink, 1.2, { hi: 1.3, lo: 1.2, ol: 0, noise: .35, r2: true }); h.D(h.E(0, 20, 26, 44), R.night, 1.6, .06, 7);
  h.F(h.E(0, -2, 12, 20), R.shade, 0, { ol: 1 }); h.star(14, 4, -10, -18, 10, 14, [220, 200, 255]); h.G(h.E(0, -2, 7, 12), { hr: 3, ha: 90, top: 3.6, edge: 0 });
  for (const s of [-1, 1]) { h.F(h.P([[s * 14, -24], [s * 34, -20], [s * 40, -4], [s * 22, -10]]), R.ink, 1.6, { hi: 1.3, ol: 0 }); h.F(h.C([[s * 30, -8], [s * 42, 8 + Math.sin(ph + s) * 4], [s * 38, 28]], 6, 3, 4), R.ink, 1.3, { ol: 0 }); h.G(h.E(s * 38, 30 + Math.sin(ph + s) * 3, 4, 4), { hr: 2, ha: 100 }); }
  h.F(h.P([[-12, -24], [-14, -42], [-6, -54], [6, -54], [14, -42], [12, -24], [0, -20]]), R.ink, 1.4, { hi: 1.2, ol: 0 }); h.F(h.E(0, -36, 8, 10), R.shade, 0, {});
  h.eye(-3.4, -38, 2.2, 3, { pupil: false, hr: 2, ha: 130 }); h.eye(3.4, -38, 2.2, 3, { pupil: false, hr: 2, ha: 130 });
  for (const s of [-1, 1]) h.F(h.C([[s * 9, -50], [s * 22, -64], [s * 18, -84]], 6, 1.6, 5), R.violet, 1.2, { ol: 0, hi: 1 });
  h.G(h.C([[-26, -66], [-20, -78], [-8, -84], [0, -84]], 2, 2, 6), { hr: 1, ha: 80, top: 4.8 }); h.G(h.C([[8, -84], [20, -80], [28, -68], [26, -62]], 2, 2, 6), { hr: 1, ha: 80, top: 4.8 });   // aureola partida
  for (let i = 0; i < 8; i++) h.put(-40 + hash2(i, 3, fr) * 80, -50 + hash2(i, 4, fr) * 120, [210, 190, 255], 150);
}, { acc: '#8b5cf6', acc2: '#0a0618', fps: 5 });

// ---- 40. Leviatã Celeste: baleia colossal de dorso estrelado ----
bxArt('leviata', 400, 230, 200, 116, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 6, B = R.night;
  h.F(h.P([[-110, 8], [-130, -14 - sw], [-160, -34 - sw * 1.6], [-170, -18 - sw * 1.6], [-150, 0 - sw], [-176, 12 - sw * 1.6], [-170, 30 - sw * 1.6], [-136, 26 - sw], [-112, 20]]), R.ink, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .3, r2: true });   // cauda
  const body = h.P([[-116, 4], [-90, -22], [-40, -36], [10, -38], [60, -32], [100, -16], [124, 4], [118, 22], [80, 36], [20, 42], [-40, 38], [-90, 28]]);
  h.F(body, B, 1.2, { hi: 1.3, lo: 1.3, ol: 0, noise: .3, r2: true });
  h.F(h.P([[-100, 22], [-40, 36], [20, 40], [80, 34], [118, 22], [100, 28], [20, 46], [-60, 40]]), R.sky, 1.2, { ol: 0, noise: .3 });   // barriga clara
  for (let i = 0; i < 7; i++) h.L(-60 + i * 20, 30, -56 + i * 20, 42, R.ink, 0);
  h.F(h.P([[10, 20], [-4, 44 + sw * .5], [-30, 56 + sw], [-10, 34]]), R.ink, 1.4, { hi: 1.1, ol: 0 });   // nadadeira
  h.F(h.P([[100, 6], [124, 8], [120, 16], [96, 14]]), R.shade, 0, {}); h.L(104, 12, 120, 14, R.sky, 3);
  h.eye(92, -4, 4, 3.2, { pupil: true, hr: 2, ha: 120 });
  const pts = [[-70, -18], [-44, -26], [-18, -22], [8, -30], [34, -24], [60, -20], [84, -14], [-30, -4], [20, -8], [58, -4], [-86, 4]];
  for (const [x, y] of pts) h.G(h.E(x, y, 2, 2), { hr: 2, ha: 100 });
  for (let i = 0; i < pts.length - 4; i++) h.G(h.S(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], .8), { hr: 0, ha: 0, top: 3.6, edge: 2 });
  h.D(body, R.violet, 1.6, .05, 9);
}, { acc: '#3b82f6', acc2: '#06142a', fps: 4 });

// ---- 41. Imperador Solar: armadura dourada, halo de raios e cetro com sol ----
bxArt('imperador_solar', 220, 220, 110, 118, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, G = R.gold;
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + ph * .06, r0 = 30, r1 = 46 + (i & 1) * 18; h.G(h.P([[Math.cos(a - .08) * r0, -34 + Math.sin(a - .08) * r0], [Math.cos(a) * r1, -34 + Math.sin(a) * r1], [Math.cos(a + .08) * r0, -34 + Math.sin(a + .08) * r0]]), { hr: 1, ha: 60, top: 4.8 }); }
  h.F(h.E(0, -34, 27, 27), G, 1.1, { hi: 1.1, lo: 1.3, ol: 0, noise: .1 });
  const robe = h.P([[-16, -16], [16, -16], [24, 6], [30, 36], [20, 52], [8, 46], [0, 56], [-8, 46], [-20, 52], [-30, 36], [-24, 6]]);
  h.F(robe, R.brass, 1.2, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true }); h.F(h.P([[-6, -16], [6, -16], [8, 50], [-8, 50]]), R.gold, 2.4, { ol: 0, hi: 1.2 });
  h.F(h.P([[-18, -18], [18, -18], [20, 8], [-20, 8]]), G, 2, { hi: 1.4, lo: 1.3, ol: 0, noise: .15, r2: true }); h.G(h.E(0, -6, 5, 5), { hr: 2, ha: 110 });
  for (const s of [-1, 1]) { h.F(h.P([[s * 14, -22], [s * 30, -22], [s * 34, -8], [s * 18, -8]]), G, 2.2, { hi: 1.4, ol: 0 }); h.F(h.S(s * 26, -8, s * 30, 14, 7), G, 1.8, { ol: 0 }); h.F(h.E(s * 31, 18, 5, 5), G, 2.4, { ol: 0 }); }
  h.F(h.S(-36, 56, -34, -36, 2.4), R.wood, 1.6, {}); h.G(h.E(-34, -46, 7, 7), { hr: 3, ha: 120, top: 5.4 });   // cetro
  h.F(h.P([[-9, -42], [-9, -26], [0, -22], [9, -26], [9, -42], [0, -48]]), G, 2.4, { hi: 1.4, ol: 0 }); h.F(h.P([[-6, -36], [6, -36], [5, -32], [-5, -32]]), R.shade, 0, {});
  h.eye(-2.6, -34, 1.8, 1, { pupil: false, hr: 1, ha: 130 }); h.eye(2.6, -34, 1.8, 1, { pupil: false, hr: 1, ha: 130 });
  h.F(h.P([[-9, -44], [-6, -54], [-2, -46], [0, -58], [2, -46], [6, -54], [9, -44]]), G, 3, { ol: 0 });
}, { acc: '#ffb703', acc2: '#3a2a06', fps: 5 });

// ---- 42. Lua Sangrenta: disco carmesim de crateras com um olho injetado e gotas de sangue ----
bxArt('lua_sangrenta', 200, 230, 100, 112, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  h.F(h.E(0, 0, 38, 38), R.blood, 1.4, { hi: 1.5, lo: 1.5, ol: 0, noise: .25, r2: true });
  for (const [x, y, r] of [[-24, -18, 7], [22, -22, 5], [-26, 14, 5], [26, 18, 8], [4, 30, 4], [-6, -32, 4]]) { h.F(h.E(x, y, r, r * .85), R.blood, .6, { ol: 0, hi: .3, lo: .8 }); }
  h.F(h.P([[24, -34], [38, -10], [36, 14], [22, 32], [34, 10], [30, -14]]), R.shade, .4, { noise: .2 });
  h.F(h.E(0, 0, 20, 17), R.bone, 3.6, { hi: 1, lo: 1.1, ol: 0, noise: .1 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; h.F(h.C([[Math.cos(a) * 19, Math.sin(a) * 16], [Math.cos(a) * 13, Math.sin(a) * 11], [Math.cos(a + .2) * 8, Math.sin(a + .2) * 7]], 1.4, .8, 3), R.blood, 2.4, {}); }
  h.G(h.E(0, 0, 9, 9), { hr: 3, ha: 130, top: 5 }); h.F(h.P([[-1.4, -6], [1.4, -6], [1.4, 6], [-1.4, 6]]), R.shade, 0, {});
  for (const x of [-26, -10, 6, 20]) { const L = 20 + hash2(x, 3, 9) * 22 + Math.sin(ph + x) * 3; h.F(h.C([[x, 34], [x + 1, 34 + L * .5], [x, 34 + L]], 3, 1.4, 3), R.blood, 1.4, { ol: 0 }); h.G(h.E(x, 34 + L, 2, 2.6), { hr: 1, ha: 70 }); }
  for (let i = 0; i < 8; i++) h.put(-50 + hash2(i, 3, fr) * 100, -50 + hash2(i, 4, fr) * 110, [255, 150, 150], 150);
}, { acc: '#ef4444', acc2: '#2a0508', fps: 5 });

// ---- 43. Senhor do Tempo: manto longo, ampulheta no peito e mostrador em halo ----
bxArt('tempo', 190, 220, 95, 118, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 2;
  h.F(h.E(0, -40, 30, 30), R.shade, 1, { ol: 1 }); h.G(h.C([[-30, -40], [-22, -62], [0, -70], [22, -62], [30, -40], [22, -18], [0, -10], [-22, -18], [-30, -40]], 1.4, 1.4, 5), { hr: 1, ha: 60, top: 4.4, edge: 2 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; h.put(Math.cos(a) * 27, -40 + Math.sin(a) * 27, [190, 255, 245], 255); }
  h.G(h.S(0, -40, Math.cos(ph) * 18, -40 + Math.sin(ph) * 18, 1.4), { hr: 1, ha: 70, top: 4.8 }); h.G(h.S(0, -40, Math.cos(-ph * .1 - 1) * 12, -40 + Math.sin(-ph * .1 - 1) * 12, 1.8), { hr: 1, ha: 70, top: 4.8 });
  const robe = h.P([[-14, -16], [14, -16], [22, 8], [28, 38], [18, 58 + sw], [8, 50], [0, 62 - sw], [-8, 50], [-18, 58 + sw], [-28, 38], [-22, 8]]);
  h.F(robe, R.teal, .8, { hi: 1.3, lo: 1.2, ol: 0, noise: .35, r2: true }); h.D(h.E(0, 20, 22, 40), R.shade, 1.2, .1, 7);
  h.F(h.P([[-8, -12], [8, -12], [6, -2], [0, 4], [-6, -2]]), R.steel, 3, { ol: 0, hi: 1 }); h.F(h.P([[-8, 22], [8, 22], [6, 14], [0, 8], [-6, 14]]), R.steel, 3, { ol: 0, hi: 1 }); h.F(h.P([[-8, -12], [8, -12], [8, 22], [-8, 22]]), R.shade, 0, { ol: 1 });
  h.A(h.P([[-7, -11], [7, -11], [5, -2], [0, 3], [-5, -2]]), [190, 255, 245], 120); h.A(h.P([[-5, 18], [5, 18], [3, 12], [0, 9], [-3, 12]]), [190, 255, 245], 200); h.G(h.S(0, 3, 0, 14, 1), { hr: 1, ha: 60, top: 4.8 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 14, -12], [s * 28, 0 + Math.sin(ph + s) * 3], [s * 32, 18]], 6, 4, 4), R.teal, .9, { ol: 0 }); h.F(h.E(s * 32, 20, 4, 4), R.bone, 3, {}); }
  h.F(h.E(0, -28, 8, 9.5), R.shade, 0, {}); h.eye(-3, -29, 2.2, 1.6, { pupil: false, hr: 2, ha: 130 }); h.eye(3, -29, 2.2, 1.6, { pupil: false, hr: 2, ha: 130 });
  for (let i = 0; i < 8; i++) h.put(-20 + hash2(i, 3, fr) * 40, 8 + hash2(i, 4, fr) * 56, [190, 255, 240], 200);
}, { acc: '#34e0a1', acc2: '#04161a', fps: 5 });

// ---- 44. Dragão de Cristal Estelar: serpente alada de facetas lilás ----
bxArt('dragao_cristal', 290, 210, 145, 108, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, up = Math.sin(ph) * 10, V = R.violet, I = R.ice;
  for (const s of [0, 1]) { const k = s ? .8 : 1, tipY = -56 - up * k; for (let i = 0; i < 6; i++) { const t = i / 5, x0 = -8 - t * 20 * k, y0 = -10 - t * 24, x1 = -30 - t * 78 * k, y1 = tipY + t * 18; h.F(h.P([[x0, y0], [x1, y1 - 3], [x1 + 8 * k, y1 + 22], [x0 + 8, y0 + 14]]), s ? R.plum : V, 1.4 + (i & 1) * .5, { hi: 1.2, lo: 1.1, ol: 0, noise: .1 }); h.G(h.S(x0, y0, x1, y1, .8), { hr: 1, ha: 50, top: 4.2, edge: 2 }); } }
  h.F(h.C([[-10, 10], [-44, 26], [-78, 16], [-108, 34]], 17, 3, 7), V, 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .15, r2: true });
  for (const x of [-30, -52, -78, -98]) h.F(h.P([[x - 4, 12 - (x < -50 ? 6 : 0)], [x, -6 - (x < -50 ? 6 : 0)], [x + 4, 12]]), I, 2.4, { ol: 0, hi: 1.2 });
  h.F(h.P([[-26, -8], [-4, -18], [26, -12], [36, 4], [26, 24], [-6, 30], [-28, 22]]), V, 1.4, { hi: 1.2, lo: 1.3, ol: 0, noise: .15, r2: true });
  h.F(h.P([[-18, 18], [20, 16], [16, 26], [-10, 28]]), I, 1.8, { ol: 0, noise: .1 }); h.G(h.E(0, 8, 7, 5), { hr: 3, ha: 110, top: 5 });
  h.F(h.C([[20, -8], [38, -22], [48, -28]], 11, 9, 4), V, 1.5, { ol: 0, noise: .15 });
  h.F(h.P([[42, -38], [66, -40], [74, -30], [70, -22], [46, -20]]), V, 1.7, { hi: 1.3, ol: 0, noise: .15 }); h.F(h.P([[62, -24], [78, -22], [74, -16], [60, -18]]), V, 1, { ol: 0 });
  for (const [x, y, k] of [[44, -38, 1], [52, -40, 1.5], [60, -40, 1.2]]) h.F(h.P([[x - 3, y], [x + 2, y - 14 * k], [x + 4, y]]), I, 2.6, { ol: 0, hi: 1.3 }); h.G(h.P([[52, -42], [55, -56], [56, -42]]), { hr: 1, ha: 70, top: 4.6, edge: 2 });
  h.eye(58, -31, 2.4, 1.8, { pupil: false, hr: 2, ha: 120 });
  for (const [x, y] of [[8, -12], [22, -4], [-12, -10]]) h.F(h.P([[x - 3, y], [x + 1, y - 9], [x + 4, y]]), I, 2.4, { ol: 0, hi: 1.2 });
  h.star(10, 5, -100, -60, 70, 80, [230, 220, 255]);
}, { acc: '#b8a2ff', acc2: '#120a2a', fps: 6 });

// ---- 45. Titereiro: figura magra de arlequim, máscara de sorriso costurado e fios de marionete ----
bxArt('titereiro', 190, 220, 95, 118, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 3;
  h.F(h.S(-44, -64, 44, -64, 3), R.wood, 1.4, {}); h.F(h.S(0, -76, 0, -50, 3), R.wood, 1.4, {});
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x0 = s * (44 - k * 6), x1 = s * (28 + k * 8), y1 = -22 + k * 16 + Math.sin(ph + k + s) * 3; h.G(h.S(x0, -62, x1, y1, .8), { hr: 0, ha: 0, top: 3.6, edge: 2 }); }
  for (const s of [-1, 1]) { h.F(h.P([[s * 6, 18], [s * 14, 18], [s * 16, 52], [s * 4, 52]]), R.shade, 1.2, { ol: 0 }); h.F(h.P([[s * 4, 50], [s * 20, 50], [s * 22, 56], [s * 4, 56]]), R.pink, 1, { ol: 0 }); }
  const co = h.P([[-12, -20], [12, -20], [16, 4], [20, 24], [-20, 24], [-16, 4]]); h.F(co, R.cloth, 1.2, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) & 1) h.F(h.P([[-14 + i * 7, -16 + j * 10], [-10.5 + i * 7, -21 + j * 10], [-7 + i * 7, -16 + j * 10], [-10.5 + i * 7, -11 + j * 10]]), R.pink, 1.6, { ol: 0 });
  for (const s of [-1, 1]) { h.F(h.S(s * 14, -16, s * 30, -58, 4.4), R.cloth, 1.2, { ol: 0 }); h.F(h.E(s * 32, -62, 4, 4), R.bone, 3.4, {}); h.F(h.E(s * 14, -22, 6, 5), R.pink, 1.8, { ol: 0 }); }
  h.F(h.P([[-8, -22], [8, -22], [6, -28], [-6, -28]]), R.pink, 1.6, { ol: 0 });
  h.F(h.E(0, -36, 9, 10.4), R.bone, 3.6, { hi: 1, ol: 0, noise: .08 });
  h.eye(-3.5, -37, 2.2, 1.8, { pupil: false, hr: 1, ha: 130 }); h.eye(3.5, -37, 2.2, 1.8, { pupil: false, hr: 1, ha: 130 });
  h.F(h.C([[-6, -31], [0, -28], [6, -31]], 1.4, 1.4, 4), R.shade, 0, {}); for (const x of [-4, -1.4, 1.4, 4]) h.L(x, -31, x, -28, R.shade, 0);
  for (const s of [-1, 1]) { h.F(h.C([[s * 5, -44], [s * 16, -58 + sw * s], [s * 22, -50 - sw]], 6, 3, 4), R.pink, 1.6, { ol: 0 }); h.G(h.E(s * 22, -50 - sw, 2.2, 2.2), { hr: 1, ha: 90 }); }
}, { acc: '#ff4fa3', acc2: '#1a0a16', fps: 5 });

// ---- 46. Catedral Caída: fachada gótica flutuante com rosácea luminosa e torres ----
bxArt('catedral', 300, 300, 150, 160, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  h.F(h.P([[-70, 56], [70, 56], [50, 84], [24, 108], [0, 126], [-24, 108], [-50, 84]]), R.stone, .7, { hi: 1, lo: 1.2, ol: 0, noise: .5 }); h.D(h.E(0, 80, 60, 40), R.shade, 1, .1, 4);
  const base = h.P([[-62, 56], [-62, -20], [-44, -20], [-44, -46], [-20, -46], [-20, -70], [20, -70], [20, -46], [44, -46], [44, -20], [62, -20], [62, 56]]);
  h.F(base, R.stone, 1.1, { hi: 1.3, lo: 1.3, ol: 0, noise: .35, r2: true });
  for (const [x, w, top] of [[-52, 8, -62], [52, 8, -62], [-32, 7, -84], [32, 7, -84]]) { h.F(h.P([[x - w, -20], [x - w, top + 20], [x, top - 22], [x + w, top + 20], [x + w, -20]]), R.stone, 1.4, { hi: 1.3, ol: 0, noise: .3 }); h.G(h.E(x, top + 8, 1.8, 3), { hr: 1, ha: 80 }); }
  h.F(h.P([[-14, -70], [-12, -104], [0, -130], [12, -104], [14, -70]]), R.stone, 1.5, { hi: 1.3, ol: 0, noise: .3 }); h.G(h.P([[-1, -126], [0, -134], [1, -126]]), { hr: 2, ha: 100 });
  h.F(h.E(0, -30, 26, 26), R.shade, .4, { ol: 1 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + ph * .1; h.G(h.P([[0, -30], [Math.cos(a - .24) * 23, -30 + Math.sin(a - .24) * 23], [Math.cos(a + .24) * 23, -30 + Math.sin(a + .24) * 23]]), { hr: 0, ha: 0, edge: 2, top: 3.8 + (i & 1) * 1.2 }); }
  h.G(h.E(0, -30, 6, 6), { hr: 3, ha: 120, top: 5.4 });
  for (const x of [-44, 44]) { h.F(h.P([[x - 6, 56], [x - 6, 6], [x, -4], [x + 6, 6], [x + 6, 56]]), R.shade, 0, { ol: 1 }); h.G(h.P([[x - 4, 52], [x - 4, 8], [x, 0], [x + 4, 8], [x + 4, 52]]), { hr: 1, ha: 60, top: 3.8, edge: 2 }); }
  h.F(h.P([[-12, 56], [-12, 22], [0, 10], [12, 22], [12, 56]]), R.shade, 0, { ol: 1 }); h.G(h.P([[-9, 54], [-9, 24], [0, 14], [9, 24], [9, 54]]), { hr: 1, ha: 50, top: 3.6, edge: 2 });
  for (const s of [-1, 1]) h.F(h.P([[s * 62, -4], [s * 82, 30], [s * 62, 24]]), R.stone, 1.2, { ol: 0, noise: .4 });
  for (let i = 0; i < 8; i++) h.put(-90 + hash2(i, 3, fr) * 180, -110 + hash2(i, 4, fr) * 200, [255, 235, 160], 150);
}, { acc: '#fcd34d', acc2: '#14101a', fps: 4 });

// ---- 47. Kraken do Éter: cabeça bulbosa de bico e oito tentáculos com pontos luminosos ----
bxArt('kraken', 280, 270, 140, 122, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, T = R.teal;
  for (let i = 0; i < 8; i++) { const a = -PI * .5 + (i - 3.5) * .5, x0 = Math.cos(a) * 24, y0 = 24, s1 = Math.sin(ph + i * .9) * 8, x1 = (i - 3.5) * 22 + s1, x2 = (i - 3.5) * 34 - s1, pts = [[x0, y0], [x1, y0 + 30], [x2, y0 + 62], [(i - 3.5) * 40 + s1 * 1.3, y0 + 92 + (i % 3) * 8]]; h.F(h.C(pts, 12, 3, 5), T, 1.1 + (i & 1) * .3, { hi: 1, lo: 1.2, ol: 0, noise: .3 }); for (let k = 1; k < 5; k++) { const t = k / 5, p = pts[Math.min(3, Math.floor(t * 3))]; h.G(h.E(p[0] + (k & 1 ? 2 : -2), p[1] + 6, 1.4, 1.4), { hr: 1, ha: 70 }); } }
  const hd = h.P([[-32, 20], [-36, -4], [-28, -30], [-10, -48], [10, -48], [28, -30], [36, -4], [32, 20], [14, 28], [-14, 28]]);
  h.F(hd, T, 1.2, { hi: 1.3, lo: 1.3, ol: 0, noise: .3, r2: true });
  for (const [x, y, r] of [[-18, -22, 5], [10, -34, 4], [24, -12, 5], [-26, 0, 4], [0, -14, 3.4]]) h.G(h.E(x, y, r, r * .8), { hr: 2, ha: 80, top: 4.4 });
  for (const s of [-1, 1]) { h.F(h.E(s * 14, -4, 11, 9), R.bone, 3.6, { hi: 1, ol: 0, noise: .1 }); h.G(h.E(s * 14, -4, 6, 6), { hr: 3, ha: 120, top: 5 }); h.F(h.P([[s * 14 - 1.4, -9], [s * 14 + 1.4, -9], [s * 14 + 1.4, 1], [s * 14 - 1.4, 1]]), R.shade, 0, {}); }
  h.F(h.P([[-10, 16], [10, 16], [4, 34], [0, 38], [-4, 34]]), R.bone, 1.8, { ol: 0, hi: 1.2 });
  for (let i = 0; i < 8; i++) h.put(-60 + hash2(i, 3, fr) * 120, -50 + hash2(i, 4, fr) * 150, [180, 255, 245], 140);
}, { acc: '#0fb5ae', acc2: '#041a1a', fps: 5 });

// ---- 48. Arquiteto Celestial: robe em camadas, compasso em halo e blocos geométricos flutuando ----
bxArt('arquiteto', 200, 220, 100, 120, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.sin(ph) * 2.4, G = R.brass;
  const robe = h.P([[-14, -18], [14, -18], [22, 10], [30, 40], [22, 54 + sw], [0, 60], [-22, 54 - sw], [-30, 40], [-22, 10]]);
  h.F(robe, R.cloth, 1.2, { hi: 1.3, lo: 1.2, ol: 0, noise: .3, r2: true }); h.F(h.P([[-6, -18], [6, -18], [8, 56], [-8, 56]]), G, 1.6, { ol: 0, hi: 1.2 });
  for (const y of [-6, 10, 26, 42]) h.G(h.S(-18 - (y > 20 ? 6 : 0), y, 18 + (y > 20 ? 6 : 0), y, .8), { hr: 0, ha: 0, top: 3.6, edge: 2 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 14, -14], [s * 30, 0], [s * 40, -16 + Math.sin(ph + s) * 3]], 6, 4, 4), R.cloth, 1.3, { ol: 0 }); h.F(h.E(s * 41, -20 + Math.sin(ph + s) * 3, 4, 4), R.bone, 3, {}); }
  h.F(h.S(-41, -40, -41, -2, 1.4), G, 2.2, {}); h.F(h.S(-41, -40, -52, -4, 1.4), G, 2.2, {}); h.G(h.E(-41, -42, 3, 3), { hr: 2, ha: 100 });   // compasso na mão esquerda
  h.F(h.P([[-10, -22], [-10, -38], [0, -44], [10, -38], [10, -22]]), G, 1.8, { hi: 1.3, ol: 0 }); h.F(h.E(0, -32, 6, 7), R.shade, 0, {}); h.eye(-2.6, -33, 2, 1.6, { pupil: false, hr: 1, ha: 130 }); h.eye(2.6, -33, 2, 1.6, { pupil: false, hr: 1, ha: 130 });
  h.G(h.C([[-30, -50], [-22, -66], [0, -72], [22, -66], [30, -50]], 1.4, 1.4, 6), { hr: 1, ha: 60, top: 4.8, edge: 2 }); h.G(h.S(-30, -50, 30, -50, 1), { hr: 0, ha: 0, top: 3.6, edge: 2 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + ph * .4, x = Math.cos(a) * 52, y = -10 + Math.sin(a) * 46, k = i % 3; const m = k === 0 ? h.P([[x - 5, y + 5], [x, y - 6], [x + 5, y + 5]]) : k === 1 ? h.P([[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]]) : h.P([[x - 6, y], [x, y - 6], [x + 6, y], [x, y + 6]]); h.F(m, R.gold, 2.2, { ol: 0, hi: 1.3 }); h.G(h.E(x, y, 1.4, 1.4), { hr: 1, ha: 70 }); }
}, { acc: '#e9c46a', acc2: '#1a1406', fps: 5 });

// ---- 49. Coração da Galáxia (pulsar): núcleo ofuscante com dois jatos e anéis ----
bxArt('pulsar', 200, 330, 100, 166, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU;
  for (const s of [-1, 1]) { h.G(h.P([[-6, s * 28], [0, s * 120], [6, s * 28]]), { hr: 2, ha: 70, top: 4.8, edge: 2 }); h.G(h.P([[-2, s * 28], [0, s * 100], [2, s * 28]]), { hr: 0, ha: 0, top: 5.6, edge: 4 }); }
  for (let i = 0; i < 3; i++) { const r = 34 + i * 12 + Math.sin(ph + i) * 2; h.G(h.C([[-r, 0], [-r * .7, -r * .32], [0, -r * .4], [r * .7, -r * .32], [r, 0], [r * .7, r * .32], [0, r * .4], [-r * .7, r * .32], [-r, 0]], 1.2, 1.2, 5), { hr: 0, ha: 0, top: 3.8 + i * .4, edge: 2 }); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + ph * .5; h.F(h.P([[Math.cos(a - .26) * 40, Math.sin(a - .26) * 40], [Math.cos(a) * 48, Math.sin(a) * 48], [Math.cos(a + .26) * 40, Math.sin(a + .26) * 40]]), R.shade, 1, { ol: 0 }); }
  h.F(h.E(0, 0, 24, 24), R.shade, 0, { ol: 1 }); h.G(h.E(0, 0, 22, 22), { hr: 5, ha: 150, top: 6, p: .5 });
  h.eye(0, 0, 8, 8, { pupil: true, hr: 2, ha: 130 });
  for (let i = 0; i < 10; i++) h.put(-70 + hash2(i, 3, fr) * 140, -80 + hash2(i, 4, fr) * 160, [250, 220, 255], 170);
}, { acc: '#ff9cf2', acc2: '#10061a', fps: 6, noOutline: true });

// ---- 50. Mestre Forjador: titã cósmico de bigorna no peito, fornalha na barriga e martelo fundido ----
bxArt('forjador', 260, 260, 130, 140, 4, (h, fr) => {
  const R = h.R, ph = fr / 4 * TAU, sw = Math.round(Math.sin(ph) * 2), S = R.iron;
  for (const s of [-1, 1]) { h.F(h.P([[s * 8, 26], [s * 30, 26], [s * 34, 60], [s * 4, 60]]), S, 1.4, { hi: 1.2, lo: 1.2, ol: 0, noise: .3, r2: true }); h.F(h.P([[s * 0, 56], [s * 38, 56], [s * 40, 68], [s * 0, 68]]), R.steel, 1.2, { ol: 0, noise: .25 }); }
  const tor = h.P([[-40, -30 + sw], [-30, -48 + sw], [30, -48 + sw], [40, -30 + sw], [34, 28], [-34, 28]]); h.F(tor, S, 1.5, { hi: 1.3, lo: 1.3, ol: 0, noise: .3, r2: true });
  h.F(h.P([[-20, -8], [20, -8], [26, 4], [14, 8], [10, 18], [-10, 18], [-14, 8], [-26, 4]]), R.steel, 1.8, { hi: 1.4, ol: 0, noise: .2 });   // bigorna
  h.F(h.P([[-18, 20], [18, 20], [14, 28], [-14, 28]]), R.shade, 0, { ol: 1 }); h.G(h.P([[-12, 22], [12, 22], [9, 27], [-9, 27]]), { hr: 2, ha: 100, top: 4.8 });   // boca da fornalha
  for (const x of [-12, -4, 4, 12]) h.L(x, 20, x, 28, R.iron, 0);
  for (const s of [-1, 1]) { h.F(h.P([[s * 32, -48 + sw], [s * 56, -44 + sw], [s * 60, -24 + sw], [s * 36, -22 + sw]]), R.steel, 1.4, { hi: 1.3, ol: 0, noise: .25 }); h.F(h.S(s * 50, -24, s * 56, 14 + sw * s, 14), S, 1.4, { ol: 0, noise: .3 }); }
  h.F(h.E(-56, 22 + sw, 13, 12), S, 1.6, { hi: 1.2, ol: 0, noise: .3 });
  h.F(h.S(52, 14, 66, -70, 5), R.wood, 1.3, { ol: 0 }); h.F(h.P([[50, -76], [86, -86], [92, -60], [58, -50]]), R.steel, 1.5, { hi: 1.3, ol: 0, noise: .2 }); h.G(h.P([[62, -72], [86, -80], [88, -66], [64, -58]]), { hr: 2, ha: 110, top: 4.6, edge: 2 });   // martelo fundido
  h.F(h.P([[-14, -48 + sw], [-16, -66 + sw], [-8, -76 + sw], [8, -76 + sw], [16, -66 + sw], [14, -48 + sw]]), S, 1.6, { hi: 1.3, ol: 0, noise: .25 });
  for (const s of [-1, 1]) h.F(h.C([[s * 12, -70], [s * 28, -78], [s * 26, -96]], 6, 1.6, 5), R.steel, 1.6, { ol: 0, hi: 1.2 });
  h.F(h.P([[-9, -62 + sw], [9, -62 + sw], [7, -56 + sw], [-7, -56 + sw]]), R.shade, 0, {}); h.eye(-4, -60 + sw, 2.6, 1.2, { pupil: false, hr: 2, ha: 130 }); h.eye(4, -60 + sw, 2.6, 1.2, { pupil: false, hr: 2, ha: 130 });
  for (const [x, y] of [[-30, -20], [26, -14], [-26, 14], [30, 12]]) h.G(h.S(x, y, x + 6, y + 8, 1.4), { hr: 1, ha: 60, top: 4.6, edge: 2 });
  for (let i = 0; i < 12; i++) h.put(40 + hash2(i, 3, fr) * 60, -60 + hash2(i, 4, fr) * 70, [255, 200, 120], 200);
}, { acc: '#ff8a3d', acc2: '#1a0e06', fps: 5 });
