/* ============================================================
   05k_bxart5: peças compartilhadas + sprites dos 20 chefes do Ato V (Tier 9)
   Mesmo estilo dos outros chefes (05f): corpo escuro em poucos tons, luz de cima-esquerda,
   borda escura e UM brilho por chefe. As peças abaixo são reutilizadas pelos dois atos finais.
   Nada aqui toca o DOM ao carregar.
   ============================================================ */
// ---------- peças ----------
function bxRingGlow(h, o) {   // anel fino de luz (halo, órbita)
  o = o || {}; const a = h.E(o.x || 0, o.y || -60, o.rx || 26, o.ry || 7), b = h.E(o.x || 0, o.y || -60, (o.rx || 26) - (o.w || 4), (o.ry || 7) - (o.w || 4) * .38);
  const r = h.N(a, b); h.G(r, { hr: o.hr || 2, ha: o.ha || 120, top: 5 }); return r;
}
function bxWingShape(h, s, o) {   // uma asa de penas (s = -1 esquerda / 1 direita)
  o = o || {}; const L = o.len || 46, H0 = o.h || 34, y = o.y || -6, ph = o.ph || 0;
  const m = h.P([[s * 4, y], [s * L * .5, y - H0 * .55 + ph], [s * L, y - H0 + ph * 1.4], [s * L * .96, y - H0 * .45 + ph], [s * L * .7, y - H0 * .12 + ph], [s * L * .46, y + H0 * .14], [s * 6, y + 10]]);
  h.F(m, o.ramp || h.R.bone, o.t || 1.3, { hi: 1.1, lo: 1.2, ol: 0, noise: .2 });
  if (o.edge !== false) for (let i = 1; i <= 3; i++) h.L(s * L * .26, y - H0 * .42 + ph + i * 5, s * L * (i === 1 ? .9 : .72), y - H0 * .68 + ph * 1.2 + i * 6, o.ramp || h.R.bone, .55);
  return m;
}
function bxSpikeRow(h, o) {   // coroa de espinhos/pontas
  o = o || {}; const n = o.n || 5, w = o.w || 26, y = o.y || -40, hh = o.h || 12, s = o.s || 1;
  const pts = []; for (let i = 0; i < n; i++) { const x = -w + i * (w * 2 / (n - 1)); pts.push([x, y], [x + w * .5 / (n - 1), y - hh * (i % 2 ? .72 : 1) * s]); }
  pts.push([w, y + 4], [-w, y + 4]);
  const m = h.P(pts); h.F(m, o.ramp || h.R.gold, o.t || 2.2, { hi: 1.1, lo: .8, ol: 0 }); return m;
}
function bxOrbCore(h, x, y, r, o) {   // núcleo redondo que brilha
  o = o || {}; const m = h.E(x, y, r, r * (o.ry || 1)); h.F(m, o.ramp || h.R.shade, 1.05, { hi: .6, lo: .6, ol: 0 }); h.G(m, { hr: o.hr || 3, ha: o.ha || 130, top: 5.4, p: .9 }); return m;
}
function bxRobeShape(h, o) {   // manto/corpo em sino (base larga)
  o = o || {}; const w = o.w || 26, y0 = o.y0 || -34, y1 = o.y1 || 40, m = h.P([[-w * .5, y0], [-w * .62, y0 + (y1 - y0) * .45], [-w, y1 - 6], [-w * .8, y1], [w * .8, y1], [w, y1 - 6], [w * .62, y0 + (y1 - y0) * .45], [w * .5, y0]]);
  h.F(m, o.ramp || h.R.cloth, o.t || 1.3, { hi: 1.2, lo: 1.3, ol: 0, noise: .3, r2: true }); return m;
}
function bxBeadRing(h, o) {   // colar/rosário de contas
  o = o || {}; const n = o.n || 10, rx = o.rx || 26, ry = o.ry || 9, y = o.y || 10;
  for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.off || 0); h.F(h.E(Math.cos(a) * rx, y + Math.sin(a) * ry, o.r || 2, o.r || 2), o.ramp || h.R.bone, 1.6, { ol: 0 }); }
}
function bxChainLine(h, x0, y0, x1, y1, n, r) {   // corrente de elos
  for (let i = 0; i <= n; i++) { const t = i / n; h.F(h.E(lerp(x0, x1, t), lerp(y0, y1, t), r, r * .8), h.R.steel, 1.4, { ol: 0 }); }
}
function bxFlameBody(h, o) {   // chama (lágrima) com núcleo claro
  o = o || {}; const w = o.w || 18, hh = o.h || 46, y = o.y || 0, m = h.P([[0, y - hh], [w * .5, y - hh * .45], [w * .62, y - hh * .05], [w * .34, y + hh * .2], [0, y + hh * .28], [-w * .34, y + hh * .2], [-w * .62, y - hh * .05], [-w * .5, y - hh * .45]]);
  h.F(m, o.ramp || h.R.ember, 1.6, { hi: 1.3, lo: 1.2, ol: 0, noise: .4 }); h.G(h.P([[0, y - hh * .8], [w * .28, y - hh * .25], [0, y + hh * .12], [-w * .28, y - hh * .25]]), { hr: 3, ha: 150 }); return m;
}

// ============================================================
// ATO V — 20 chefes do Tier 9
// ============================================================
// 1. Serafim da Balança: seis asas, corpo esguio, halo e a balança do juízo
bxArt('serafim', 240, 214, 120, 120, 4, (h, fr) => {
  const R = h.R, fl = Math.sin(fr / 4 * TAU) * 5;
  for (const [k, s] of [[1, -1], [1, 1], [.74, -1], [.74, 1], [.48, -1], [.48, 1]]) bxWingShape(h, s, { len: 96 * k, h: 52 * k, y: -26, ph: fl * k, t: 1.5 });
  bxRingGlow(h, { y: -78, rx: 30, ry: 9, w: 5 });
  h.F(h.P([[-13, -46], [13, -46], [18, -14], [14, 26], [6, 40], [-6, 40], [-14, 26], [-18, -14]]), R.steel, 1.45, { hi: 1.1, lo: 1.2, ol: 0, noise: .22 });
  for (const y of [-24, -6, 12]) h.L(-12, y, 12, y, R.gold, .8);
  h.F(h.E(0, -58, 12, 13), R.bone, 1.6, { ol: 0, noise: .2 }); h.F(h.P([[-11, -66], [-4, -78], [0, -70], [4, -78], [11, -66]]), R.gold, 2.4, { ol: 0 });
  h.G(h.S(-9, -58, 9, -58, 2), { hr: 2, ha: 120, top: 5 }); h.eye(-5, -61, 2, 2.4); h.eye(5, -61, 2, 2.4);
  for (const s of [-1, 1]) { h.F(h.C([[s * 16, -18], [s * 30, -4], [s * 34, 14]], 4, 2.6, 4), R.steel, 1.2, { ol: 0 }); }
  h.F(h.S(-46, 16, -46, 30, 2), R.gold, 1.8, {}); h.F(h.C([[-46, 16], [-40, 10], [-34, 16]], 1.2, 1.2, 4), R.gold, 2, { ol: 0 }); h.F(h.C([[-46, 16], [-52, 10], [-58, 16]], 1.2, 1.2, 4), R.gold, 2, { ol: 0 });
  h.F(h.E(-46, 10, 3, 3), R.gold, 2.2, { ol: 0 }); h.F(h.E(-58, 18, 4, 2.4), R.brass, 1.6, { ol: 0 }); h.F(h.E(-34, 18, 4, 2.4), R.brass, 1.6, { ol: 0 });
  h.star(14, 3, -70, -70, 70, 30);
}, { acc: '#fde68a', acc2: '#2a2416', fps: 5 });

// 2. Aurora do Amanhecer: pássaro colossal com leque de cauda e disco solar
bxArt('aurora', 250, 220, 125, 118, 4, (h, fr) => {
  const R = h.R, fl = Math.sin(fr / 4 * TAU) * 4;
  for (let i = 0; i < 7; i++) { const a = -1.9 + i * .28, m = h.P([[0, 26], [Math.cos(a) * 96, 26 + Math.sin(a) * 74 + fl], [Math.cos(a) * 104, 40 + Math.sin(a) * 78 + fl], [Math.cos(a) * 58, 46 + Math.sin(a) * 40]]); h.F(m, i % 2 ? R.ember : R.gold, 1.5 + i * .12, { hi: 1.2, lo: 1.1, ol: 0, noise: .3 }); h.G(h.I(m, h.P([[-2, 30], [2, 30], [2, 60], [-2, 60]])), { hr: 1, ha: 60 }); }
  bxWingShape(h, -1, { len: 86, h: 56, y: -18, ph: fl }); bxWingShape(h, 1, { len: 86, h: 56, y: -18, ph: -fl });
  h.F(h.P([[-22, -30], [0, -46], [22, -30], [26, 4], [14, 34], [-14, 34], [-26, 4]]), R.ember, 1.7, { hi: 1.3, lo: 1.2, ol: 0, noise: .25 });
  h.D(h.P([[-22, -10], [22, -10], [20, 30], [-20, 30]]), R.gold, 1.4, .18, 8);
  h.F(h.E(0, -50, 15, 13), R.gold, 1.9, { ol: 0 });
  for (let i = -2; i <= 2; i++) h.F(h.P([[i * 4, -60], [i * 4 + 3, -78 - Math.abs(i) * 4], [i * 4 + 6, -60]]), R.ember, 2.4, { ol: 0 });
  h.G(h.S(-7, -52, 7, -52, 2), { hr: 2, ha: 110, top: 5 }); h.eye(-5, -54, 2, 2.2); h.eye(5, -54, 2, 2.2);
  h.F(h.P([[-4, -40], [4, -38], [2, -26], [-2, -26]]), R.ochre, 2.2, { ol: 0 });
  h.star(18, 5, -80, -80, 80, 60);
}, { acc: '#fbbf24', acc2: '#3a2408', fps: 5 });

// 3. Lei do Silêncio: monge flutuante, manto em sino, máscara sem boca e o dedo no silêncio
bxArt('silencio', 190, 200, 95, 116, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2;
  bxBeadRing(h, { n: 12, rx: 34, ry: 10, y: 4 + sw, r: 2.2 });
  bxRobeShape(h, { w: 40, y0: -30, y1: 56, ramp: R.cloth, t: 1.2 });
  for (let i = -2; i <= 2; i++) h.L(i * 12, -18, i * 17, 52, R.ink, .5);
  h.F(h.E(0, -42, 16, 18), R.bone, 1.5, { ol: 0, noise: .15 });
  h.F(h.P([[-16, -46], [-12, -60], [0, -64], [12, -60], [16, -46], [10, -36], [-10, -36]]), R.ink, 1.2, { ol: 0 });
  h.G(h.P([[-16, -52], [16, -52], [15, -46], [-15, -46]]), { hr: 1.6, ha: 90, top: 4.6 });
  h.F(h.P([[-4, -30], [4, -30], [3, -18], [-3, -18]]), R.bone, 1.4, {});
  h.F(h.C([[6, -14], [14, -30], [10, -44]], 2.4, 1.6, 4), R.bone, 1.6, { ol: 0 }); h.F(h.E(10, -46, 2.6, 3.4), R.bone, 1.8, { ol: 0 });
  h.F(h.C([[-10, 8], [-26, 18], [-22, 34]], 4, 3, 4), R.cloth, 1.1, { ol: 0 });
  for (const s of [-1, 1]) h.F(h.E(s * 30, 6, 5, 4), R.cloth, 1.2, { ol: 0 });
  h.G(h.E(0, 20, 4, 4), { hr: 2, ha: 70 });
}, { acc: '#c4b5fd', acc2: '#171528', fps: 4 });

// 4. Cetro do Sol Nascente: bastão vivo, gema-sol no topo, anéis em órbita
bxArt('cetro', 190, 216, 95, 118, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  h.F(h.P([[-26, 96], [-16, 40], [16, 40], [26, 96]]), R.wine, 1.2, { hi: 1.1, lo: 1.2, ol: 0, noise: .3 });
  h.F(h.P([[-7, 44], [7, 44], [5, -34], [-5, -34]]), R.gold, 1.5, { hi: 1.2, lo: 1.6, ol: 0 });
  for (let i = -4; i <= 4; i++) h.L(-5, i * 9 + 44, 5, i * 9 + 42, R.ochre, .4);
  for (const s of [-1, 1]) { h.F(h.C([[s * 6, 10], [s * 18, 24], [s * 10, 36]], 4, 3, 4), R.gold, 1.4, { ol: 0 }); h.F(h.E(s * 18, 26, 4, 4), R.bone, 1.6, { ol: 0 }); }
  for (let i = 0; i < 8; i++) { const a = sp + i / 8 * TAU; h.F(h.P([[Math.cos(a) * 12, -52 + Math.sin(a) * 12], [Math.cos(a) * 30, -52 + Math.sin(a) * 30], [Math.cos(a + .35) * 9, -52 + Math.sin(a + .35) * 9]]), R.ochre, 2.4, { ol: 0 }); }
  bxOrbCore(h, 0, -52, 15, { hr: 4, ha: 160 });
  bxRingGlow(h, { y: -52, rx: 34, ry: 12, w: 4 }); bxRingGlow(h, { y: -52, rx: 46, ry: 17, w: 5 });
  h.F(h.P([[-14, 44], [-24, 62], [-10, 58], [0, 48], [10, 58], [24, 62], [14, 44]]), R.wine, 1.9, { ol: 0 });
  h.star(10, 2, -60, -90, 60, -20);
}, { acc: '#f59e0b', acc2: '#301a04', fps: 5 });

// 5. Lança da Constelação: arqueiro de estrelas ligadas por fios de luz
bxArt('constelacao', 230, 200, 115, 108, 4, (h, fr) => {
  const R = h.R, tw = .72 + Math.sin(fr / 4 * TAU) * .28;
  h.A(h.P([[-70, -10], [-40, -40], [-10, -50], [20, -34], [46, -6], [34, 34], [0, 46], [-34, 30]]), [120, 150, 220], 40);
  const st = [[-62, -6], [-42, -36], [-14, -48], [16, -36], [40, -10], [30, 26], [0, 40], [-28, 26], [0, -6], [0, 20]];
  for (let i = 0; i < st.length; i++) { const a = st[i], b = st[(i + 1) % st.length]; h.L(a[0], a[1], b[0], b[1], [180, 200, 255], .5); }
  for (const [x, y] of st) { h.F(h.E(x, y, 3, 3), R.ice, 2.6 * tw, { ol: 0 }); h.G(h.E(x, y, 2.2, 2.2), { hr: 2, ha: 150 }); }
  h.star(16, 7, -80, -70, 80, 60);
  h.F(h.S(-46, -18, 34, -34, 2.2), R.ice, 1.6, {}); h.L(-46, -18, 34, -34, R.sky, .7);
  h.F(h.E(-46, -18, 5, 5), R.ice, 2, { ol: 0 }); h.F(h.E(34, -34, 4, 4), R.ice, 2.4, { ol: 0 });
  h.P([[10, -30], [22, -28], [16, -18]]); h.G(h.P([[12, -28], [20, -27], [16, -21]]), { hr: 2, ha: 120 });
}, { acc: '#a5b4fc', acc2: '#101430', fps: 6 });

// 6. Veredito Celeste: titã de pedra com martelo de juiz e balanças penduradas
bxArt('veredito', 230, 210, 115, 114, 3, (h, fr) => {
  const R = h.R, sw = Math.round(Math.sin(fr / 3 * TAU) * 2);
  bxRobeShape(h, { w: 48, y0: -20, y1: 62, ramp: R.stone, t: 1.1 });
  h.F(h.P([[-26, -44], [26, -44], [30, -14], [18, 2], [-18, 2], [-30, -14]]), R.slate, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  h.F(h.P([[-24, -66], [24, -66], [30, -44], [-30, -44]]), R.stone, 1.7, { hi: 1.2, lo: 1.3, ol: 0, noise: .18 });
  h.G(h.S(-18, -56, 18, -56 + sw, 2.2), { hr: 2, ha: 110, top: 5 }); h.eye(-9, -55, 2.6, 2); h.eye(9, -55, 2.6, 2);
  for (const s of [-1, 1]) h.F(h.P([[s * 30, -40], [s * 40, -30], [s * 38, 6], [s * 28, 0]]), R.slate, 1.2, { ol: 0 });
  h.F(h.C([[36, -34], [62, -46], [74, -34]], 3, 2.4, 4), R.wood, 1.2, { ol: 0 });
  h.F(h.P([[60, -50], [88, -50], [88, -34], [60, -34]]), R.iron, 1.8, { hi: 1.4, lo: 1.3, ol: 0 });
  h.F(h.C([[-34, -18], [-54, -6], [-58, 14]], 1.2, 1, 4), R.brass, 1.6, { ol: 0 });
  h.F(h.P([[-76, 14], [-40, 14], [-50, 26], [-66, 26]]), R.brass, 1.5, { ol: 0 }); h.F(h.E(-58, 10, 9, 2), R.brass, 1.8, { ol: 0 });
  bxChainLine(h, -84, -6, -70, 10, 3, 1.6); bxChainLine(h, -32, -6, -46, 10, 3, 1.6);
  h.D(h.P([[-30, 20], [30, 20], [26, 60], [-26, 60]]), R.stone, .5, .12, 4);
}, { acc: '#fbbf24', acc2: '#241d12', fps: 3 });

// 7. Hino dos Querubins: três cabeças aladas em volta de um coração-coro
bxArt('querubins', 210, 190, 105, 100, 4, (h, fr) => {
  const R = h.R, bob = Math.sin(fr / 4 * TAU) * 3;
  for (const [dx, dy] of [[0, -34 + bob], [-46, -6 - bob], [46, -6 + bob]]) {
    bxWingShape(h, -1, { len: 30, h: 22, y: dy + 2, ph: 0, t: 1.2, ramp: R.bone });
    bxWingShape(h, 1, { len: 30, h: 22, y: dy + 2, ph: 0, t: 1.2, ramp: R.bone });
    h.F(h.E(dx, dy, 13, 13), R.bone, 1.5, { ol: 0, noise: .12 });
    h.F(h.E(dx, dy - 3, 13, 9), R.bone, 1.3, { ol: 0 });
    h.F(h.P([[dx - 12, dy - 8], [dx - 6, dy - 16], [dx, dy - 8]]), R.gold, 2.2, { ol: 0 });
    for (const s of [-1, 1]) h.eye(dx + s * 5, dy - 1, 1.8, 2.2);
    h.F(h.E(dx, dy + 3, 1.6, 1.2), R.pink, 1.6, { ol: 0 });
  }
  h.F(h.P([[0, -6], [12, -16], [24, -6], [22, 10], [0, 26], [-22, 10], [-24, -6], [-12, -16]]), R.coral, 1.7, { hi: 1.3, lo: 1.2, ol: 0, noise: .25 });
  bxOrbCore(h, 0, 6, 9, { hr: 3, ha: 140 });
  h.star(12, 9, -60, -50, 60, 40);
}, { acc: '#fda4af', acc2: '#2a1218', fps: 6 });

// 8. Domínio do Trovão: pilar de nuvem com tridente e estilhaços de raio
bxArt('trovao', 210, 210, 105, 112, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  for (let i = 0; i < 5; i++) { const x = -56 + i * 28, y = 56 + Math.sin(sp + i) * 4; h.F(h.E(x, y, 22, 12), R.slate, 1.1 + i * .05, { ol: 0, noise: .5, r2: true }); }
  h.F(h.P([[-20, 50], [-12, -20], [-18, -40], [-6, -34], [0, -52], [8, -32], [18, -40], [12, -16], [20, 50]]), R.night, 1.3, { hi: 1.1, lo: 1.1, ol: 0, noise: .35 });
  for (let i = 0; i < 4; i++) { const a = sp * .6 + i * TAU / 4; h.F(h.P([[Math.cos(a) * 40, -18 + Math.sin(a) * 40], [Math.cos(a) * 46 - 6, -18 + Math.sin(a) * 46], [Math.cos(a) * 52, -18 + Math.sin(a) * 52 + 8]]), R.ice, 2.6, { ol: 0 }); h.G(h.P([[Math.cos(a) * 44, -20 + Math.sin(a) * 44], [Math.cos(a) * 48, -18 + Math.sin(a) * 48]]), { hr: 2, ha: 120 }); }
  h.F(h.S(-2, -46, 2, 48, 3), R.steel, 1.6, {});
  for (const s of [-1, 1]) { h.F(h.P([[s * 2, -46], [s * 10, -56], [s * 12, -44]]), R.steel, 2.2, { ol: 0 }); h.F(h.P([[s * 2, -40], [s * 9, -48], [s * 10, -38]]), R.steel, 2, { ol: 0 }); }
  h.F(h.P([[-6, -52], [0, -74], [6, -52]]), R.steel, 2.4, { ol: 0 });
  h.G(h.S(-2, -50, 2, 40, 1.6), { hr: 2, ha: 120 });
  h.eye(-5, -26, 2.4, 3); h.eye(5, -26, 2.4, 3);
}, { acc: '#67e8f9', acc2: '#0d1b2a', fps: 7 });

// 9. Aurora Dourada: dragão-fita oriental que serpenteia
bxArt('aurora_dourada', 250, 200, 125, 100, 5, (h, fr) => {
  const R = h.R, t = fr / 5 * TAU;
  const spine = []; for (let i = 0; i <= 8; i++) { const k = i / 8; spine.push([-96 + k * 190, Math.sin(k * 4.4 + t) * 22 + 18 * k]); }
  for (let i = 0; i < 8; i++) { const a = spine[i], b = spine[i + 1]; h.F(h.C([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6], b], 13 - i * 1.1, 10 - i, 4), i > 5 ? R.gold : R.amberr, 1.5, { hi: 1.3, lo: 1.2, ol: 0, noise: .25 }); }
  const hd = spine[8];
  h.F(h.P([[hd[0] - 8, hd[1] - 8], [hd[0] + 6, hd[1] - 16], [hd[0] + 22, hd[1] - 10], [hd[0] + 26, hd[1] + 2], [hd[0] + 12, hd[1] + 10], [hd[0] - 6, hd[1] + 6]]), R.gold, 1.8, { hi: 1.3, lo: 1.2, ol: 0, noise: .2 });
  for (const s of [-1, 1]) { h.F(h.C([[hd[0] + 2, hd[1] - 12], [hd[0] - 6 * s, hd[1] - 30], [hd[0] + 2 * s, hd[1] - 36]], 2.4, 1.4, 4), R.gold, 2.4, { ol: 0 }); h.F(h.C([[hd[0] + 20, hd[1] - 2], [hd[0] + 40, hd[1] - 10 * s]], 1.4, .8, 4), R.amberr, 1.6, { ol: 0 }); }
  h.eye(hd[0] + 14, hd[1] - 4, 2.6, 2.6);
  h.G(h.E(hd[0] + 24, hd[1] + 2, 3, 3), { hr: 3, ha: 150 });
  for (let i = 1; i < 8; i += 2) h.F(h.P([[spine[i][0], spine[i][1] - 12], [spine[i][0] + 6, spine[i][1] - 20], [spine[i][0] + 10, spine[i][1] - 8]]), R.gold, 2.2, { ol: 0 });
  h.star(10, 4, -100, -40, 100, 60);
}, { acc: '#f59e0b', acc2: '#33230a', fps: 6 });

// 10. Cálice da Eternidade: taça colossal com licor de luz e figura encapuzada
bxArt('calice', 200, 210, 100, 116, 4, (h, fr) => {
  const R = h.R, bub = Math.sin(fr / 4 * TAU) * 3;
  h.F(h.P([[-34, 92], [-20, 74], [20, 74], [34, 92]]), R.brass, 1.3, { hi: 1.2, lo: 1.2, ol: 0 });
  h.F(h.P([[-12, 74], [-8, 26], [8, 26], [12, 74]]), R.gold, 1.4, { hi: 1.2, lo: 1.4, ol: 0 });
  h.F(h.P([[-44, 24], [-56, -20], [-40, -44], [0, -52], [40, -44], [56, -20], [44, 24], [20, 34], [0, 36], [-20, 34]]), R.brass, 1.6, { hi: 1.3, lo: 1.3, ol: 0, noise: .2 });
  for (const s of [-1, 1]) { h.F(h.C([[s * 46, 8], [s * 62, 6], [s * 56, -12]], 5, 4, 4), R.gold, 1.5, { ol: 0 }); h.F(h.E(s * 60, -4, 4, 6), R.gold, 1.2, { ol: 0 }); }
  h.G(h.P([[-38, -30], [38, -30], [34, 18], [0, 26], [-34, 18]]), { hr: 3, ha: 130, top: 5 });
  for (let i = -2; i <= 2; i++) h.F(h.E(i * 12, -10 + bub * (i % 2 ? 1 : -1), 3, 3), R.ice, 2, { ol: 0 });
  h.F(h.P([[-14, -30], [-18, -62], [0, -78], [18, -62], [14, -30], [0, -22]]), R.cloth, 1.2, { hi: 1.1, lo: 1.1, ol: 0, noise: .3 });
  h.F(h.E(0, -58, 9, 10), R.shade, 1, {}); h.eye(-3, -60, 1.8, 2); h.eye(3, -60, 1.8, 2);
  h.F(h.P([[-26, -44], [-18, -52], [-8, -44]]), R.cloth, 1.1, { ol: 0 }); h.F(h.P([[26, -44], [18, -52], [8, -44]]), R.cloth, 1.1, { ol: 0 });
  h.star(8, 6, -40, -80, 40, 10);
}, { acc: '#fde68a', acc2: '#2e2210', fps: 5 });

// 11. Coroa da Criação: coroa flutuante com mãos de luz e redemoinho de estrelas
bxArt('coroa', 220, 200, 110, 104, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  h.A(h.E(0, 6, 62, 62), [90, 70, 160], 40);
  for (let i = 0; i < 10; i++) { const a = sp + i / 10 * TAU, r = 40 + i % 3 * 8; h.F(h.E(Math.cos(a) * r, 6 + Math.sin(a) * r * .7, 2.4, 2.4), R.ice, 2.4, { ol: 0 }); h.G(h.E(Math.cos(a) * r, 6 + Math.sin(a) * r * .7, 1.8, 1.8), { hr: 1, ha: 90 }); }
  for (let i = 0; i < 5; i++) { const x = -52 + i * 26; h.F(h.P([[x - 8, -18], [x, -62 - (i % 2 ? 8 : 0)], [x + 8, -18]]), R.gold, 2.2, { hi: 1.2, lo: 1, ol: 0 }); h.F(h.E(x, -66 - (i % 2 ? 8 : 0), 3, 3), R.ice, 2.4, { ol: 0 }); h.G(h.E(x, -66 - (i % 2 ? 8 : 0), 2.6, 2.6), { hr: 2, ha: 120 }); }
  h.F(h.P([[-62, -16], [62, -16], [58, 14], [30, 22], [0, 12], [-30, 22], [-58, 14]]), R.gold, 1.8, { hi: 1.3, lo: 1.2, ol: 0, noise: .18 });
  for (const x of [-38, -14, 14, 38]) h.F(h.E(x, 0, 5, 5), R.ice, 2.2, { ol: 0 });
  for (let i = 0; i < 4; i++) { const x = -34 + i * 22, y = 40 + Math.sin(sp + i) * 4; h.F(h.C([[x, 24], [x + 2, 34], [x - 4, 44]], 3.4, 2.4, 4), R.bone, 1.4, { ol: 0 }); h.F(h.E(x - 4, 46 + Math.sin(sp + i) * 2, 4, 5), R.bone, 1.6, { ol: 0 }); }
  h.star(14, 11, -80, -70, 80, 60);
}, { acc: '#fde68a', acc2: '#2b2310', fps: 6 });

// 12. Selo do Juízo Final: disco de cera com sete selos menores em órbita
bxArt('selo', 210, 200, 105, 100, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  h.F(h.E(0, 0, 56, 56), R.wine, 1.6, { hi: 1.25, lo: 1.3, ol: 0, noise: .22, r2: true });
  const inner = h.E(0, 0, 44, 44); h.F(inner, R.blood, 1.2, { hi: 1.1, lo: 1.1, ol: 0 });
  h.F(h.E(0, 0, 34, 34), R.wine, 1.5, { ol: 0 });
  h.G(h.P([[-14, -8], [14, -8], [10, 12], [0, 20], [-10, 12]]), { hr: 2, ha: 110 });
  h.eye(-6, -2, 2.4, 2); h.eye(6, -2, 2.4, 2);
  for (let i = 0; i < 7; i++) { const a = sp + i / 7 * TAU, x = Math.cos(a) * 76, y = Math.sin(a) * 70; h.F(h.E(x, y, 7, 7), R.brass, 1.6, { ol: 0 }); h.F(h.E(x, y, 3.4, 3.4), R.wine, 1.2, { ol: 0 }); if (i % 2) h.G(h.E(x, y, 4, 4), { hr: 1, ha: 70 }); }
  h.F(h.C([[46, 12], [70, 18], [66, 36]], 5, 3, 4), R.bone, 1.3, { ol: 0 });
  for (let i = -1; i <= 1; i++) h.F(h.C([[66, 36], [70 + i * 8, 48], [68 + i * 10, 56]], 2.4, 1.4, 4), R.bone, 1.5, { ol: 0 });
  h.D(h.E(0, 0, 50, 50), R.wine, 2.4, .06, 17);
}, { acc: '#f87171', acc2: '#2a0c0c', fps: 4 });

// 13. Lâmina do Tempo Zero: relógio-pêndulo com lâminas paradas no tempo
bxArt('tempo_zero', 200, 220, 100, 112, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  h.F(h.S(0, -20, 0, 74, 3), R.steel, 1.5, {});
  for (const s of [-1, 1]) h.F(h.C([[0, 70], [s * 22, 80], [s * 30, 92]], 2.4, 1.6, 4), R.brass, 1.5, { ol: 0 });
  h.F(h.E(0, 78, 14, 5), R.brass, 1.4, { ol: 0 });
  h.F(h.E(0, -46, 40, 40), R.brass, 1.6, { hi: 1.3, lo: 1.3, ol: 0, noise: .16 });
  h.F(h.E(0, -46, 33, 33), R.ice, 1.2, { hi: 1.1, lo: 1.2, ol: 0, noise: .1 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; h.F(h.S(Math.cos(a) * 38, -46 + Math.sin(a) * 38, Math.cos(a) * 30, -46 + Math.sin(a) * 30, i % 3 ? 1 : 2), i % 3 ? R.brass : R.ice, 2, {}); }
  const a1 = -PI / 2 + .9, a2 = sp * .35;
  h.F(h.S(0, -46, Math.cos(a1) * 26, -46 + Math.sin(a1) * 26, 2.6), R.ink, 1, {});
  h.F(h.S(0, -46, Math.cos(a2) * 20, -46 + Math.sin(a2) * 20, 1.8), R.ink, 1, {});
  h.G(h.E(0, -46, 3, 3), { hr: 2, ha: 100 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, r = 62; h.F(h.P([[Math.cos(a) * r, -46 + Math.sin(a) * r], [Math.cos(a) * r + 5, -46 + Math.sin(a) * r + 10], [Math.cos(a) * r - 4, -46 + Math.sin(a) * r + 9]]), R.ice, 2.4, { ol: 0 }); }
  h.star(8, 13, -70, -100, 70, 20);
}, { acc: '#67e8f9', acc2: '#101c24', fps: 6 });

// 14. Arauto da Luz: lanterna-farol viva sobre um manto, com cone de luz
bxArt('arauto_luz', 200, 216, 100, 112, 4, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 4 * TAU) * 3;
  h.A(h.P([[-16, -30], [16, -30], [46, 96], [-46, 96]]), [255, 240, 190], 34);
  bxRobeShape(h, { w: 34, y0: -16, y1: 76, ramp: R.cloth, t: 1.1 });
  for (let i = -2; i <= 2; i++) h.L(i * 10, 0, i * 15, 72, R.gold, .4);
  h.F(h.P([[-22, -34], [22, -34], [26, -80], [16, -96], [-16, -96], [-26, -80]]), R.brass, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .18 });
  h.F(h.P([[-16, -40], [16, -40], [19, -78], [12, -90], [-12, -90], [-19, -78]]), R.ink, 1, {});
  h.G(h.E(0, -64 + sw, 11, 13), { hr: 4, ha: 160, top: 5.6 });
  h.F(h.P([[-2, -78], [2, -78], [3, -50], [-3, -50]]), R.ice, 2.2, { ol: 0 });
  for (const x of [-20, -8, 8, 20]) h.F(h.S(x, -40, x, -86, 1.2), R.brass, 1.6, {});
  for (const s of [-1, 1]) { h.F(h.P([[s * 26, -30], [s * 44, -18], [s * 42, -6], [s * 24, -12]]), R.gold, 2.2, { ol: 0 }); h.F(h.E(s * 44, -14, 3, 3), R.brass, 1.4, { ol: 0 }); }
  h.F(h.P([[-12, -108], [12, -108], [8, -96], [-8, -96]]), R.brass, 1.4, { ol: 0 });
  h.star(12, 15, -50, -90, 50, 40);
}, { acc: '#fde047', acc2: '#2a2208', fps: 5 });

// 15. Sinfonia dos Céus: corpo de pauta musical, costelas de harpa e notas nas mãos
bxArt('sinfonia', 220, 200, 110, 104, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  for (let i = 0; i < 5; i++) h.L(-84, -34 + i * 13, 84, -30 + i * 13, R.ink, .6);
  h.F(h.P([[-34, -22], [-22, -46], [0, -54], [22, -46], [34, -22], [26, 22], [8, 34], [-8, 34], [-26, 22]]), R.ink, 1.1, { hi: .9, lo: 1, ol: 0, noise: .2 });
  for (let i = 0; i < 4; i++) h.F(h.C([[-24 + i * 16, -34], [-26 + i * 16, -4], [-20 + i * 16, 22]], 2, 1.4, 4), R.bone, 1.6, { ol: 0 });
  h.F(h.C([[-30, -30], [-46, -44], [-56, -30], [-48, -12]], 3, 2.2, 4), R.bone, 1.4, { ol: 0 });
  h.F(h.C([[30, -30], [46, -44], [56, -30], [48, -12]], 3, 2.2, 4), R.bone, 1.4, { ol: 0 });
  for (let i = 0; i < 5; i++) { const a = sp + i / 5 * TAU, x = Math.cos(a) * 62, y = -4 + Math.sin(a) * 44; h.F(h.S(x, y, x, y - 12, 1.6), R.bone, 1.8, {}); h.F(h.E(x + 4, y, 4, 3), R.bone, 1.8, { ol: 0 }); h.G(h.E(x + 4, y, 3, 2.6), { hr: 1, ha: 70 }); }
  h.eye(-8, -34, 2.4, 2.6); h.eye(8, -34, 2.4, 2.6);
  h.G(h.S(-12, -16, 12, -16, 1.4), { hr: 1.4, ha: 90, top: 5 });
}, { acc: '#f0abfc', acc2: '#1d1226', fps: 6 });

// 16. Fênix Imortal: pássaro de cinzas com ovo incandescente no peito
bxArt('fenix', 230, 210, 115, 108, 5, (h, fr) => {
  const R = h.R, fl = Math.sin(fr / 5 * TAU) * 5;
  for (let i = -3; i <= 3; i++) h.F(h.P([[i * 4, 40], [i * 14 + 6, 84 + Math.abs(i) * 6 + fl], [i * 14 - 6, 86 + Math.abs(i) * 4]]), R.ember, 2 + Math.abs(i) * .1, { ol: 0 });
  bxWingShape(h, -1, { len: 92, h: 58, y: -8, ph: fl, ramp: R.rust }); bxWingShape(h, 1, { len: 92, h: 58, y: -8, ph: -fl, ramp: R.rust });
  h.F(h.P([[-26, -26], [0, -44], [26, -26], [30, 10], [14, 40], [-14, 40], [-30, 10]]), R.rust, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .35 });
  h.D(h.P([[-26, -20], [26, -20], [24, 34], [-24, 34]]), R.ink, .8, .16, 22);
  bxOrbCore(h, 0, 4, 12, { hr: 3, ha: 150, ramp: R.ember });
  h.F(h.E(0, -50, 13, 11), R.rust, 1.6, { ol: 0 });
  h.F(h.P([[-10, -58], [-6, -78], [0, -64], [6, -78], [10, -58]]), R.ember, 2.4, { ol: 0 });
  h.F(h.P([[8, -50], [26, -46], [22, -40], [6, -44]]), R.gold, 2.2, { ol: 0 });
  h.eye(-4, -52, 2, 2.4); h.eye(4, -52, 2, 2.4);
  h.star(16, 21, -90, -80, 90, 60);
}, { acc: '#fb923c', acc2: '#2a1206', fps: 6 });

// 17. Escudo do Firmamento: muralha viva com fenda de olho e espinhos
bxArt('escudo', 210, 200, 105, 100, 3, (h, fr) => {
  const R = h.R, gl = Math.sin(fr / 3 * TAU) * 2;
  h.F(h.P([[-60, -66], [60, -66], [64, -10], [46, 40], [0, 62], [-46, 40], [-64, -10]]), R.slate, 1.5, { hi: 1.25, lo: 1.3, ol: 0, noise: .2 });
  h.F(h.P([[-52, -58], [52, -58], [55, -12], [40, 32], [0, 52], [-40, 32], [-55, -12]]), R.steel, 1.2, { hi: 1.1, lo: 1.1, ol: 0, noise: .15 });
  for (let i = -2; i <= 2; i++) h.F(h.P([[i * 20 - 6, -56], [i * 20 + 6, -56], [i * 20, -38]]), R.slate, 2, { ol: 0 });
  h.F(h.P([[-38, -14], [38, -14], [30, 4], [-30, 4]]), R.ink, 1, {});
  h.G(h.E(0, -5 + gl, 26, 8), { hr: 2, ha: 120, top: 5 });
  h.eye(0, -5 + gl, 6, 4);
  for (const s of [-1, 1]) { h.F(h.P([[s * 62, -34], [s * 84, -20], [s * 80, 6], [s * 60, -2]]), R.slate, 1.4, { ol: 0 }); h.F(h.P([[s * 50, 40], [s * 66, 54], [s * 56, 66], [s * 42, 52]]), R.slate, 1.2, { ol: 0 }); }
  for (let i = 0; i < 4; i++) h.F(h.E(-26 + i * 17, 30, 4, 4), R.steel, 1.6, { ol: 0 });
  h.D(h.P([[-52, -58], [52, -58], [55, -12], [40, 32], [0, 52], [-40, 32], [-55, -12]]), R.slate, .6, .1, 5);
}, { acc: '#93c5fd', acc2: '#141b2a', fps: 3 });

// 18. Chama Sagrada: vela viva com chama em lágrima e cera derretida
bxArt('chama', 180, 210, 90, 110, 5, (h, fr) => {
  const R = h.R, fl = Math.sin(fr / 5 * TAU) * 4;
  h.F(h.P([[-30, 96], [-24, 20], [24, 20], [30, 96]]), R.bone, 1.2, { hi: 1.1, lo: 1.2, ol: 0, noise: .18 });
  for (const s of [-1, 1]) h.F(h.C([[s * 26, 30], [s * 34, 48], [s * 28, 62]], 3, 1.6, 4), R.bone, 1.1, { ol: 0 });
  h.F(h.E(0, 18, 26, 6), R.ochre, 1.2, { ol: 0 });
  h.F(h.S(0, 18, 0, 4, 2), R.ink, 1, {});
  bxFlameBody(h, { w: 30, h: 84, y: -26, ramp: R.ember });
  h.G(h.P([[0, -96], [10, -70], [0, -52], [-10, -70]]), { hr: 4, ha: 170, top: 5.8 });
  h.eye(-7, -54, 2.2, 2.6); h.eye(7, -54, 2.2, 2.6);
  h.G(h.S(-10, -40, 10, -40, 1.4), { hr: 1.4, ha: 90, top: 5 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, r = 44 + (i % 2) * 8; h.F(h.E(Math.cos(a) * r, -40 + Math.sin(a) * r, 2, 2), R.gold, 2, { ol: 0 }); }
  h.star(10, 23, -40, -110, 40, -30);
}, { acc: '#fbbf24', acc2: '#2e1c04', fps: 7 });

// 19. Nexo do Infinito: dois anéis enlaçados com um núcleo e satélites
bxArt('nexo', 210, 200, 105, 100, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  const r1 = h.E(0, 0, 62, 30), r1i = h.E(0, 0, 50, 19);
  h.F(h.N(r1, r1i), R.indigo || R.night, 1.3, { hi: 1.1, lo: 1.1, ol: 0 });
  const r2 = h.E(0, 0, 30, 62), r2i = h.E(0, 0, 19, 50);
  h.F(h.N(r2, r2i), R.violet, 1.4, { hi: 1.15, lo: 1.15, ol: 0 });
  h.F(h.E(0, 0, 20, 20), R.night, 1, {});
  bxOrbCore(h, 0, 0, 12, { hr: 4, ha: 170 });
  for (let i = 0; i < 6; i++) { const a = sp + i / 6 * TAU; h.F(h.E(Math.cos(a) * 72, Math.sin(a) * 34, 3, 3), R.violet, 2.2, { ol: 0 }); h.G(h.E(Math.cos(a) * 72, Math.sin(a) * 34, 2.4, 2.4), { hr: 1, ha: 80 }); }
  for (const s of [-1, 1]) h.F(h.C([[s * 44, -22], [s * 58, -6], [s * 46, 12]], 2.6, 1.4, 4), R.violet, 1.6, { ol: 0 });
  for (let i = 0; i < 8; i++) { const a = -sp * 1.4 + i / 8 * TAU; h.F(h.E(Math.cos(a) * 40, Math.sin(a) * 40, 1.6, 1.6), R.ice, 2.4, { ol: 0 }); }
  h.star(10, 25, -70, -60, 70, 60);
}, { acc: '#c084fc', acc2: '#180d24', fps: 8 });

// 20. Trono de Ouro: trono colossal com o soberano sentado
bxArt('trono', 220, 214, 110, 112, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 2;
  h.F(h.P([[-70, -50], [70, -50], [76, 76], [56, 84], [-56, 84], [-76, 76]]), R.gold, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  h.F(h.P([[-58, -60], [58, -60], [60, -86], [40, -96], [0, -88], [-40, -96], [-60, -86]]), R.brass, 1.6, { hi: 1.2, lo: 1.1, ol: 0 });
  h.F(h.P([[-44, -44], [44, -44], [48, 50], [30, 60], [-30, 60], [-48, 50]]), R.wine, 1.2, { hi: 1.1, lo: 1.1, ol: 0, noise: .25 });
  for (const s of [-1, 1]) h.F(h.P([[s * 46, 30], [s * 74, 30], [s * 74, 46], [s * 46, 46]]), R.brass, 1.5, { ol: 0 });
  for (let i = -2; i <= 2; i++) h.F(h.P([[i * 22 - 6, -88], [i * 22 + 6, -88], [i * 22, -108 - (i % 2 ? 6 : 0)]]), R.gold, 2.4, { ol: 0 });
  h.F(h.P([[-18, -36], [-14, -58], [0, -66], [14, -58], [18, -36], [14, 20], [0, 28], [-14, 20]]), R.bone, 1.4, { ol: 0, noise: .2 });
  h.F(h.E(0, -56, 10, 11), R.bone, 1.5, { ol: 0 });
  h.F(h.P([[-11, -64], [-6, -76], [0, -68], [6, -76], [11, -64]]), R.gold, 2.6, { ol: 0 });
  h.eye(-4, -58, 1.8, 2); h.eye(4, -58, 1.8, 2);
  h.F(h.S(24, -30 + sw, 24, 30, 2), R.gold, 2, {}); h.F(h.E(24, -34 + sw, 4, 4), R.ice, 2.4, { ol: 0 }); h.G(h.E(24, -34 + sw, 3.4, 3.4), { hr: 2, ha: 120 });
  h.D(h.P([[-44, -44], [44, -44], [48, 50], [30, 60], [-30, 60], [-48, 50]]), R.wine, 2.2, .05, 33);
}, { acc: '#f59e0b', acc2: '#2a1c06', fps: 4 });
