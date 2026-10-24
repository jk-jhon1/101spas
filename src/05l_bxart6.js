/* ============================================================
   05l_bxart6: sprites dos 20 chefes do Ato VI (Tier 10) — usa as peças de 05k_bxart5.js
   Cada chefe tem silhueta própria; o último (Apoteose) tem 4 variantes, uma por estágio.
   Nada aqui toca o DOM ao carregar.
   ============================================================ */
// 1. Primeira Luz: núcleo recém-nascido dentro de um manto escuro, raios curtos
bxArt('luz_primeira', 220, 210, 110, 108, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU, pul = .85 + Math.sin(sp) * .15;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + sp * .2; h.A(h.P([[Math.cos(a) * 20, Math.sin(a) * 20], [Math.cos(a + .07) * 92 * pul, Math.sin(a + .07) * 92 * pul], [Math.cos(a - .07) * 92 * pul, Math.sin(a - .07) * 92 * pul]]), [255, 245, 200], 60); }
  h.F(h.P([[-52, 40], [-40, -30], [-18, -60], [18, -60], [40, -30], [52, 40], [30, 64], [-30, 64]]), R.shade, 1.1, { hi: .8, lo: .8, ol: 0, noise: .3 });
  h.F(h.P([[-34, 30], [-24, -26], [0, -44], [24, -26], [34, 30], [0, 52]]), R.ink, 1, { hi: .7, lo: .7, ol: 0 });
  bxOrbCore(h, 0, -6, 17 * pul, { hr: 5, ha: 180 });
  h.G(h.E(0, -6, 9 * pul, 9 * pul), { hr: 3, ha: 170, top: 5.8 });
  for (const s of [-1, 1]) h.F(h.C([[s * 30, 26], [s * 46, 40], [s * 40, 56]], 4, 3, 4), R.shade, 1.2, { ol: 0 });
  h.star(20, 31, -80, -80, 80, 70);
}, { acc: '#fff7c2', acc2: '#1a1708', fps: 6 });

// 2. Fim de Tudo: silhueta com pedaços faltando (buraco no próprio corpo)
bxArt('fim', 220, 220, 110, 112, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  const body = h.P([[-46, 60], [-56, -10], [-40, -58], [-12, -78], [16, -74], [44, -50], [56, -6], [46, 60], [18, 76], [-18, 76]]);
  h.F(body, R.shade, 1, { hi: .7, lo: .7, ol: 0, noise: .2 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + sp * .3, x = Math.cos(a) * 34, y = Math.sin(a) * 30; h.N(body, h.E(x, y, 9 + (i % 3) * 4, 8 + (i % 2) * 5)); }
  h.F(h.N(body, h.E(-14, 44, 13, 11)), R.ink, 1, { ol: 0 });
  h.G(h.E(-16, -36, 6, 7), { hr: 3, ha: 150 }); h.G(h.E(16, -36, 6, 7), { hr: 3, ha: 150 });
  h.F(h.P([[-22, -20], [0, -8], [22, -20]]), R.ink, 1, { ol: 0 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + sp; h.A(h.P([[Math.cos(a) * 60, 10 + Math.sin(a) * 60], [Math.cos(a) * 78, 10 + Math.sin(a) * 78], [Math.cos(a + .12) * 70, 10 + Math.sin(a + .12) * 70]]), [200, 220, 255], 70); }
  h.star(12, 33, -90, -90, 90, 80);
}, { acc: '#e0e7ff', acc2: '#0a0a14', fps: 4 });

// 3. Buraco Branco: disco branco ofuscante com jatos polares e anel de detritos
bxArt('buraco_branco', 230, 210, 115, 106, 5, (h, fr) => {
  const sp = fr / 5 * TAU;
  h.A(h.E(0, 0, 96, 22), [220, 235, 255], 70);
  for (const s of [-1, 1]) { h.A(h.P([[-8, s * 12], [10, s * 12], [26, s * 86], [-26, s * 86]]), [255, 255, 255], 60); h.G(h.P([[-4, s * 14], [5, s * 14], [12, s * 80], [-12, s * 80]]), { hr: 3, ha: 150 }); }
  h.F(h.E(0, 0, 52, 52), h.R.ice, 1.4, { hi: 1.4, lo: 1.4, ol: 0, noise: .1 });
  h.G(h.E(0, 0, 40, 40), { hr: 5, ha: 175, top: 6 });
  h.G(h.E(0, 0, 18, 18), { hr: 4, ha: 200, top: 6.4 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + sp * .5, r = 66 + (i % 4) * 10; h.F(h.E(Math.cos(a) * r, Math.sin(a) * r * .55, 3 + i % 3, 2 + i % 2), h.R.ice, 2.2, { ol: 0 }); }
  h.star(22, 35, -100, -80, 100, 80);
}, { acc: '#ffffff', acc2: '#dfe9ff', fps: 8 });

// 4. Cosmos Vivo: galáxia espiral com um olho no núcleo
bxArt('cosmos', 240, 220, 120, 110, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 26; i++) { const t = i / 26, a = arm * PI + t * 3.4 + sp * .5, r = 14 + t * 92; h.F(h.E(Math.cos(a) * r, 16 + Math.sin(a) * r * .62, 4.2 - t * 2, 3.4 - t * 1.6), i % 5 ? R.violet : R.ice, 1.8 + (1 - t) * 1.2, { ol: 0 }); }
  h.F(h.E(0, 16, 30, 26), R.night, 1, { ol: 0 });
  h.eye(0, 12, 15, 12, { px: 0 });
  h.G(h.E(0, 12, 7, 6), { hr: 4, ha: 180, top: 5.8 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + sp; h.F(h.E(Math.cos(a) * 108, 16 + Math.sin(a) * 66, 3, 3), R.pink, 2.4, { ol: 0 }); }
  h.star(18, 37, -100, -70, 100, 80);
}, { acc: '#c084fc', acc2: '#150a24', fps: 7 });

// 5. Teorema Final: poliedro flutuante com faixas de símbolos
bxArt('teorema', 200, 200, 100, 100, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  const hex = h.P([[0, -62], [46, -32], [52, 22], [18, 58], [-18, 58], [-52, 22], [-46, -32]]);
  const cut = h.P([[-30, -34], [30, -34], [40, 0], [0, 24], [-40, 0]]);
  h.F(hex, R.slate, 1.2, { hi: 1.15, lo: 1.15, ol: 0, noise: .18 });
  h.F(cut, R.ink, 1, { ol: 0 });
  h.G(h.I(hex, h.N(cut, h.P([[-24, -28], [24, -28], [30, -2], [0, 16], [-30, -2]]))), { hr: 2, ha: 110, top: 5 });
  for (let i = 0; i < 3; i++) { const a = sp + i / 3 * TAU; h.G(h.S(Math.cos(a) * 34, 6 + Math.sin(a) * 34, Math.cos(a) * 44, 6 + Math.sin(a) * 44, 2), { hr: 2, ha: 120 }); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU - sp * .6; h.F(h.E(Math.cos(a) * 66, 6 + Math.sin(a) * 56, 3.4, 3.4), R.ice, 2, { ol: 0 }); }
  h.eye(0, 2, 9, 7);
  for (let i = -3; i <= 3; i++) h.L(-42, -46 + i * 5, 42, -48 + i * 5, R.ice, .35);
  h.star(10, 39, -70, -80, 70, 70);
}, { acc: '#67e8f9', acc2: '#0e1a1e', fps: 5 });

// 6. O Último Nome: escriba encapuzado com livro gigante e pena
bxArt('ultimo_nome', 210, 210, 105, 108, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 3;
  bxRobeShape(h, { w: 36, y0: -20, y1: 66, ramp: R.ink, t: 1.1 });
  h.F(h.P([[-18, -26], [-22, -58], [0, -72], [22, -58], [18, -26], [0, -18]]), R.shade, 1.1, { hi: .8, lo: .8, ol: 0, noise: .3 });
  h.eye(-6, -46, 2.4, 2.8); h.eye(6, -46, 2.4, 2.8);
  h.F(h.P([[-44, -4], [44, -4], [40, 40], [-40, 40]]), R.bone, 1.2, { hi: 1.2, lo: 1.2, ol: 0, noise: .12 });
  h.F(h.S(0, -4, 0, 40, 2), R.ink, 1, {});
  for (let i = 0; i < 5; i++) { h.L(-34, 4 + i * 7, -6, 4 + i * 7, R.ink, .4); h.L(8, 4 + i * 7, 34, 4 + i * 7, R.ink, .4); }
  h.F(h.C([[52, 30], [70, -10 + sw], [64, -48]], 3.4, 1.6, 4), R.bone, 1.5, { ol: 0 });
  h.F(h.P([[60, -54], [62, -66], [68, -56]]), h.R.ac ? R.bone : R.bone, 2.4, { ol: 0 });
  h.G(h.P([[58, -62], [66, -58], [62, -50]]), { hr: 2, ha: 110 });
  for (const [x, y, t] of [[-64, -40, 'A'], [-58, -20, 'N'], [-66, 0, 'O'], [-56, 18, 'M'], [-64, 36, 'E']]) { h.G(h.E(x, y, 5, 6), { hr: 1, ha: 60 }); }
  h.star(8, 41, -70, -70, 70, 50);
}, { acc: '#fde68a', acc2: '#14121c', fps: 4 });

// 7. Origem do Vazio: anel oco com núcleo escuro e tentáculos
bxArt('origem', 230, 220, 115, 110, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + sp * .3; h.F(h.C([[Math.cos(a) * 40, 10 + Math.sin(a) * 40], [Math.cos(a) * 78, 10 + Math.sin(a) * 78], [Math.cos(a + .3) * 96, 10 + Math.sin(a + .3) * 96]], 6, 2, 4), R.night, 1.1, { hi: .8, lo: .8, ol: 0 }); }
  const ring = h.E(0, 10, 62, 58), hole = h.E(0, 10, 40, 37);
  h.F(h.N(ring, hole), R.violet, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .3 });
  h.F(hole, R.shade, .6, { hi: .4, lo: .4, ol: 0 });
  h.G(h.N(ring, h.E(0, 10, 52, 48)), { hr: 2, ha: 120, top: 5 });
  h.G(h.E(0, 10, 6, 6), { hr: 4, ha: 180 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; h.F(h.E(Math.cos(a) * 70, 10 + Math.sin(a) * 66, 2.4, 2.4), R.pink, 2, { ol: 0 }); }
  h.star(12, 43, -90, -80, 90, 90);
}, { acc: '#a855f7', acc2: '#0d0714', fps: 5 });

// 8. Relógio do Universo: mostrador astronômico com saia de engrenagens
bxArt('relogio', 220, 220, 110, 108, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + sp * .2; h.F(h.P([[Math.cos(a) * 46, 40 + Math.sin(a) * 40], [Math.cos(a + .3) * 62, 40 + Math.sin(a + .3) * 62], [Math.cos(a + .45) * 46, 40 + Math.sin(a + .45) * 40]]), R.brass, 1.6, { ol: 0 }); }
  h.F(h.E(0, -18, 58, 58), R.gold, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .15 });
  h.F(h.E(0, -18, 47, 47), R.night, 1, { ol: 0 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; h.F(h.S(Math.cos(a) * 44, -18 + Math.sin(a) * 44, Math.cos(a) * 36, -18 + Math.sin(a) * 36, i % 3 ? 1 : 2), i % 3 ? R.brass : R.ice, 2, {}); }
  h.F(h.S(0, -18, 0, -58, 3), R.ice, 1.6, {}); h.F(h.S(0, -18, 26, -2, 2), R.ice, 1.4, {});
  h.G(h.E(0, -18, 5, 5), { hr: 3, ha: 150 });
  for (let i = 0; i < 4; i++) { const a = sp + i / 4 * TAU; h.F(h.E(Math.cos(a) * 18, -18 + Math.sin(a) * 18, 4, 4), R.ice, 1.8, { ol: 0 }); }
  h.star(12, 45, -80, -70, 80, 80);
}, { acc: '#67e8f9', acc2: '#16120a', fps: 8 });

// 9. Semente Cósmica: vagem segmentada com raízes e broto
bxArt('semente', 210, 220, 105, 112, 4, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 4 * TAU) * 4;
  for (let i = -2; i <= 2; i++) h.F(h.C([[i * 14, 30], [i * 24, 62], [i * 34, 78 + Math.abs(i) * 4]], 5, 2.4, 4), R.bark, 1.1, { hi: .9, lo: .9, ol: 0 });
  const pod = h.P([[0, -66], [34, -40], [44, 4], [24, 44], [-24, 44], [-44, 4], [-34, -40]]);
  h.F(pod, R.jade, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .3 });
  for (let i = 0; i < 5; i++) h.F(h.I(pod, h.P([[-46, -50 + i * 22], [46, -58 + i * 22], [46, -46 + i * 22], [-46, -38 + i * 22]])), R.moss, .7, { ol: 0 });
  h.G(h.I(pod, h.P([[-6, -60], [6, -60], [8, 44], [-8, 44]])), { hr: 2, ha: 100 });
  h.F(h.E(0, -2, 13, 15), R.ice, 2, { ol: 0 }); h.G(h.E(0, -2, 9, 10), { hr: 3, ha: 150 });
  h.F(h.C([[0, -66], [-6, -86], [8, -96 + sw]], 3, 1.6, 4), R.leaf, 1.4, { ol: 0 });
  for (const s of [-1, 1]) h.F(h.E(s * 16 + sw * .4, -88, 11, 6), R.leaf, 1.5, { ol: 0 });
  h.star(10, 47, -70, -90, 70, 40);
}, { acc: '#a3e635', acc2: '#0c1a08', fps: 5 });

// 10. Axioma: monólito flutuante com inscrições e correntes
bxArt('axioma', 210, 220, 105, 112, 3, (h, fr) => {
  const R = h.R, gi = Math.sin(fr / 3 * TAU) * 2;
  h.F(h.P([[-40, 78], [-46, -34], [-30, -66], [30, -66], [46, -34], [40, 78]]), R.stone, 1.25, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  h.F(h.P([[-30, 66], [-34, -30], [-22, -54], [22, -54], [34, -30], [30, 66]]), R.slate, 1, { ol: 0, noise: .15 });
  for (let i = 0; i < 6; i++) { h.L(-22, -44 + i * 20, 22, -46 + i * 20, R.stone, .7); }
  h.G(h.P([[-14, -18], [0, -8], [14, -18], [0, 8]]), { hr: 2, ha: 120, top: 5 });
  h.eye(0, -4, 6, 5);
  for (const s of [-1, 1]) { h.F(h.C([[s * 40, -40], [s * 66, -20 + gi], [s * 58, 26]], 2.4, 1.8, 4), R.steel, 1.6, { ol: 0 }); for (let i = 0; i < 3; i++) h.F(h.E(s * (62 - i * 2), -14 + i * 16, 3, 4), R.steel, 1.4, { ol: 0 }); }
  h.star(8, 49, -60, -70, 60, 50);
}, { acc: '#a5b4fc', acc2: '#12141c', fps: 3 });

// 11. Convergência Final: vórtice de lâminas apontando para o centro
bxArt('convergencia', 240, 220, 120, 108, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + sp * .4, r = 58 + (i % 3) * 22; h.F(h.P([[Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a + .1) * (r + 26), Math.sin(a + .1) * (r + 26)], [Math.cos(a + .16) * r, Math.sin(a + .16) * r]]), i % 2 ? R.steel : R.ice, 1.8, { ol: 0 }); }
  for (let i = 0; i < 4; i++) { const a = sp * .8 + i / 4 * TAU; h.F(h.C([[Math.cos(a) * 96, Math.sin(a) * 96], [Math.cos(a) * 60, Math.sin(a) * 60], [Math.cos(a) * 28, Math.sin(a) * 28]], 4, 1.6, 4), R.steel, 1.4, { ol: 0 }); }
  bxOrbCore(h, 0, 0, 18, { hr: 4, ha: 170 });
  h.G(h.E(0, 0, 9, 9), { hr: 3, ha: 190, top: 6 });
  h.star(14, 51, -100, -90, 100, 90);
}, { acc: '#fde68a', acc2: '#1a1a22', fps: 9 });

// 12. Espada do Autor: mão gigante com pena; metade do corpo só esboçada
bxArt('autor', 230, 220, 115, 112, 3, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 3 * TAU) * 3;
  for (let i = 0; i < 9; i++) { const y = -80 + i * 18; h.L(-64, y, -8 - (i % 3) * 6, y + 3, R.ice, .55); }
  h.F(h.P([[0, -70], [46, -60], [62, 6], [34, 60], [-6, 66], [-26, 10], [-20, -50]]), R.bone, 1.15, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  h.F(h.I(h.P([[-20, -60], [64, -56], [64, 60], [-16, 64]]), h.P([[-20, -60], [10, -56], [12, 64], [-16, 64]])), R.bone, .55, { ol: 0, noise: .1 });
  h.F(h.C([[62, -10], [88, -46 + sw], [104, -60 + sw]], 12, 7, 4), R.bone, 1.3, { ol: 0 });
  for (let i = 0; i < 4; i++) h.F(h.C([[70 + i * 4, -22 - i * 4], [86 + i * 3, -48 - i * 5], [96 + i * 3, -56 - i * 5]], 3.4, 2, 4), R.bone, 1.2, { ol: 0 });
  h.F(h.P([[100, -52 + sw], [110, -74 + sw], [116, -52 + sw], [108, -40 + sw]]), R.bone, 2.4, { ol: 0 });
  h.G(h.P([[104, -66 + sw], [110, -70 + sw], [112, -56 + sw]]), { hr: 2, ha: 130 });
  h.eye(22, -46, 5, 4);
  h.star(10, 53, -70, -90, 90, 30);
}, { acc: '#fbbf24', acc2: '#141210', fps: 4 });

// 13. Nada Eterno: corpo-vazio com ruído branco nas bordas
bxArt('nada', 220, 220, 110, 110, 4, (h, fr) => {
  const R = h.R, sp = fr / 4 * TAU;
  const body = h.P([[-38, 66], [-52, 0], [-34, -54], [0, -70], [34, -54], [52, 0], [38, 66], [0, 78]]);
  h.F(body, R.shade, .5, { hi: .3, lo: .3, ol: 0 });
  h.D(body, R.bone, 3, .28, 5 + (fr & 3));
  h.F(h.I(body, h.E(0, 0, 40, 40)), R.ink, .4, { ol: 0 });
  h.G(h.P([[-16, -34], [-4, -26], [-16, -18]]), { hr: 2, ha: 120 }); h.G(h.P([[16, -34], [4, -26], [16, -18]]), { hr: 2, ha: 120 });
  h.F(h.S(-2, 30, 2, 50, 1.6), R.bone, 1.4, {});
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + sp * .5; h.F(h.E(Math.cos(a) * 74, 6 + Math.sin(a) * 74, 2, 2), R.bone, 2, { ol: 0 }); }
  h.star(6, 55, -90, -80, 90, 80);
}, { acc: '#e2e8f0', acc2: '#0a0a10', fps: 7 });

// 14. Tudo de Uma Vez: coluna de máscaras sobrepostas
bxArt('tudo', 200, 230, 100, 118, 4, (h, fr) => {
  const R = h.R, sw = Math.sin(fr / 4 * TAU) * 2;
  const cols = [[R.bone, -4], [R.stone, 0], [R.gold, 0], [R.ink, 0]];
  for (let i = 0; i < 4; i++) {
    const y = -66 + i * 40 + sw * (i % 2 ? 1 : -1), c = cols[i][0];
    h.F(h.P([[-26, y - 16], [26, y - 16], [30, y + 6], [0, y + 22], [-30, y + 6]]), c, 1.3 + i * .1, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
    h.F(h.E(-10, y - 2, 4, 4), R.ink, .8, { ol: 0 }); h.F(h.E(10, y - 2, 4, 4), R.ink, .8, { ol: 0 });
    h.F(h.P([[-8, y + 8], [8, y + 8], [0, y + 14]]), R.ink, .7, { ol: 0 });
  }
  for (const s of [-1, 1]) h.F(h.C([[s * 30, -40], [s * 54, -20 + sw], [s * 48, 24]], 4, 2.4, 4), R.cloth, 1.1, { ol: 0 });
  h.G(h.E(0, 78, 8, 8), { hr: 3, ha: 130 });
  h.star(10, 57, -70, -90, 70, 90);
}, { acc: '#fde68a', acc2: '#121018', fps: 6 });

// 15. Ponto Zero: um ponto com anéis e raios finíssimos
bxArt('ponto', 220, 200, 110, 96, 5, (h, fr) => {
  const sp = fr / 5 * TAU;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + sp * .2; h.A(h.P([[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a + .02) * 98, Math.sin(a + .02) * 98], [Math.cos(a - .02) * 98, Math.sin(a - .02) * 98]]), [255, 250, 230], 70); }
  for (let r = 24; r <= 72; r += 16) { h.G(h.N(h.E(0, 0, r, r), h.E(0, 0, r - 2.4, r - 2.4)), { hr: 2, ha: 120, top: 5 }); }
  h.F(h.E(0, 0, 9, 9), h.R.gold, 2.4, { ol: 0 });
  h.G(h.E(0, 0, 5, 5), { hr: 4, ha: 200 });
  h.star(10, 59, -90, -70, 90, 70);
}, { acc: '#fde047', acc2: '#1c1808', fps: 10 });

// 16. Coração do Multiverso: coração com janelas para outros mundos
bxArt('coracao', 220, 210, 110, 106, 5, (h, fr) => {
  const R = h.R, beat = 1 + Math.sin(fr / 5 * TAU) * .07;
  const hs = h.P([[0, 30 * beat], [-22, 4], [-34 * beat, -22], [-18, -40], [0, -26], [18, -40], [34 * beat, -22], [22, 4]]);
  h.F(hs, R.blood, 1.5, { hi: 1.3, lo: 1.2, ol: 0, noise: .25 });
  const wins = [[-12, -14], [8, -16], [-2, 4], [16, 6], [-20, -2]];
  for (let i = 0; i < wins.length; i++) {
    const [x, y] = wins[i], m = h.P([[x - 7, y - 6], [x + 7, y - 6], [x + 7, y + 6], [x - 7, y + 6]]);
    h.F(m, i % 2 ? R.night : R.ink, 1, { ol: 0 }); h.star(3, 61 + i, x - 6, y - 5, x + 6, y + 5);
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; h.G(h.S(Math.cos(a) * 40, 14 + Math.sin(a) * 40, Math.cos(a) * 60, 14 + Math.sin(a) * 60, 2.2), { hr: 2, ha: 90 }); }
  h.star(14, 63, -90, -70, 90, 80);
}, { acc: '#f43f5e', acc2: '#1a0508', fps: 9 });

// 17. Lâmina Absoluta: espada colossal com olho na guarda
bxArt('lamina', 220, 240, 110, 124, 4, (h, fr) => {
  const R = h.R, gl = Math.sin(fr / 4 * TAU) * 2;
  h.F(h.P([[-14, -108], [14, -108], [10, 6], [0, 26], [-10, 6]]), R.ice, 1.6, { hi: 1.35, lo: 1.3, ol: 0, noise: .12 });
  h.G(h.S(0, -102, 0, 2, 3), { hr: 2, ha: 120, top: 5.6 });
  h.F(h.P([[-64, 8], [64, 8], [58, 26], [-58, 26]]), R.steel, 1.4, { hi: 1.2, lo: 1.2, ol: 0 });
  for (const s of [-1, 1]) h.F(h.P([[s * 60, 12], [s * 74, 2 + gl], [s * 72, 26]]), R.steel, 1.6, { ol: 0 });
  h.eye(0, 17, 12, 7);
  h.F(h.P([[-9, 26], [9, 26], [7, 66], [-7, 66]]), R.cloth, 1.2, { ol: 0, noise: .3 });
  for (let i = 0; i < 3; i++) h.F(h.P([[-10, 34 + i * 10], [10, 34 + i * 10], [10, 40 + i * 10], [-10, 40 + i * 10]]), R.gold, 1.6, { ol: 0 });
  h.F(h.E(0, 76, 12, 12), R.gold, 1.8, { ol: 0 }); h.G(h.E(0, 76, 7, 7), { hr: 3, ha: 140 });
  h.star(12, 65, -60, -110, 60, 60);
}, { acc: '#a5f3fc', acc2: '#0f1a1e', fps: 5 });

// 18. Maré Cósmica: onda gigante com tridente
bxArt('mare', 240, 210, 120, 112, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  h.F(h.P([[-110, 74], [-110, 20], [-70, -20], [-20, -44], [30, -40], [70, -8], [96, 30], [110, 74]]), R.teal, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .3 });
  for (let i = 0; i < 5; i++) { const x = -70 + i * 34; h.F(h.E(x, -34 - (i % 2) * 10 + Math.sin(sp + i) * 3, 16, 12), R.ice, 1.3, { ol: 0 }); }
  for (let i = 0; i < 7; i++) { const a = i / 7; h.L(-100 + a * 200, 60, -94 + a * 200, 40, R.ice, .6); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + sp; h.F(h.E(Math.cos(a) * 76, -10 + Math.sin(a) * 50, 2.4, 2.4), R.ice, 2, { ol: 0 }); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + sp * .5; h.G(h.E(Math.cos(a) * 66, -22 + Math.sin(a) * 40, 5, 5), { hr: 3, ha: 130 }); }
  h.G(h.E(96, -66, 9, 9), { hr: 4, ha: 170 });
  h.F(h.S(88, -84, 88, 66, 3), R.gold, 1.8, {}); h.F(h.P([[70, -92], [106, -92], [106, -76], [70, -76]]), R.gold, 1.8, { ol: 0 });
  for (const x of [76, 88, 100]) h.F(h.P([[x - 4, -92], [x + 4, -92], [x, -112]]), R.gold, 2.4, { ol: 0 });
  h.star(12, 67, -100, -80, 100, 60);
}, { acc: '#2dd4bf', acc2: '#06201e', fps: 7 });

// 19. Brado do Infinito: trompa/boca colossal com anéis de som
bxArt('brado', 230, 210, 115, 108, 5, (h, fr) => {
  const R = h.R, sp = fr / 5 * TAU;
  for (let i = 0; i < 4; i++) { const r = 60 + i * 22 + (sp * 20) % 22; h.G(h.N(h.E(-10, 0, r, r * .82), h.E(-10, 0, r - 3, r * .82 - 3)), { hr: 2, ha: 100, top: 5 }); }
  h.F(h.P([[60, -34], [96, -44], [112, 0], [96, 44], [60, 34], [44, 0]]), R.brass, 1.5, { hi: 1.2, lo: 1.2, ol: 0, noise: .2 });
  h.F(h.P([[66, -22], [96, -28], [102, 0], [96, 28], [66, 22]]), R.ink, 1, {});
  h.F(h.E(80, 0, 16, 22), R.ink, .6, { hi: .4, lo: .4, ol: 0 });
  for (let i = -2; i <= 2; i++) h.F(h.P([[76 + Math.abs(i) * 3, i * 7], [92, i * 9], [88, i * 9 + 4], [74 + Math.abs(i) * 3, i * 7 + 4]]), R.bone, 1.6, { ol: 0 });
  for (const y of [-30, 0, 30]) h.F(h.C([[58, y], [30, y * 1.4], [-6, y * 1.5]], 6, 3, 4), R.brass, 1.3, { ol: 0 });
  h.G(h.E(84, -6, 5, 5), { hr: 3, ha: 150 });
  h.star(10, 69, -60, -80, 110, 80);
}, { acc: '#fbbf24', acc2: '#1e1608', fps: 9 });

// 20. APOTEOSE — 4 variantes, uma por estágio (0-1 terrestre, 2-3 voador)
bxArt('apoteose', 260, 250, 130, 136, 5, (h, fr, v) => {
  const R = h.R, sp = fr / 5 * TAU, fly = v >= 2;
  const body = R.bone, trim = v >= 2 ? R.gold : R.brass;
  if (v >= 2) {   // asas nas fases aéreas
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const L = 92 - k * 16, yy = -24 + k * 12, ph = Math.sin(sp + k) * 6;
        h.A(h.P([[s * 14, yy], [s * L * .5, yy - 54 + ph], [s * L, yy - 20 + ph * 1.4], [s * L * .8, yy - 2 + ph], [s * 16, yy + 12]]), v === 3 ? [255, 246, 206] : [230, 216, 168], v === 3 ? 120 : 96);
      }
    }
  }
  // manto / corpo
  h.F(h.P([[-30, -40], [-24, 10], [-42, 96], [0, 110], [42, 96], [24, 10], [30, -40]]), v >= 3 ? R.bone : R.cloth, 1.2, { hi: 1.15, lo: 1.15, ol: 0, noise: .25 });
  h.F(h.P([[-20, -48], [-16, 4], [-24, 92], [0, 100], [24, 92], [16, 4], [20, -48]]), body, 1.3, { hi: 1.2, lo: 1.2, ol: 0, noise: .18 });
  for (const y of [-24, 0, 24, 48]) h.F(h.P([[-18, y], [18, y], [16, y + 7], [-16, y + 7]]), trim, 1.5, { ol: 0 });
  // cabeça e coroa
  h.F(h.E(0, -66, 18, 19), body, 1.4, { ol: 0, noise: .12 });
  h.G(h.S(-11, -68, 11, -68, 2.4), { hr: 2, ha: 130, top: 5.4 });
  if (v >= 1) for (let i = -2; i <= 2; i++) h.F(h.P([[i * 9 - 4, -80], [i * 9 + 4, -80], [i * 9, -100 - (i % 2 ? 6 : 0)]]), trim, 2.4, { ol: 0 });
  if (v >= 2) { h.G(h.E(0, -96, 14, 14), { hr: 4, ha: 160 }); h.G(h.N(h.E(0, -96, 26, 26), h.E(0, -96, 22, 22)), { hr: 2, ha: 140 }); }
  // braços: 2 na fase 1, 4 na fase 2+
  for (const s of [-1, 1]) {
    h.F(h.C([[s * 26, -34], [s * 48, -6], [s * 44, 34]], 7, 4.4, 4), body, 1.3, { ol: 0 });
    h.F(h.E(s * 44, 38, 6, 7), body, 1.5, { ol: 0 });
    if (v >= 1) { h.F(h.C([[s * 20, -18], [s * 44, -44], [s * 62, -34]], 6, 3.4, 4), body, 1.2, { ol: 0 }); h.F(h.E(s * 64, -32, 5, 5), trim, 1.8, { ol: 0 }); }
  }
  // lâmina na mão direita (todas as fases)
  h.F(h.P([[-2, -110], [10, -110], [8, -18], [0, -6], [-6, -18]]), R.ice, 1.5, { hi: 1.3, lo: 1.3, ol: 0 });
  h.G(h.S(3, -104, 3, -24, 2.4), { hr: 2, ha: 130, top: 5.6 });
  // detalhes por estágio
  if (v === 1) { h.D(h.P([[-24, -30], [24, -30], [22, 90], [-22, 90]]), R.ember, 2.2, .08, 71); h.G(h.E(0, 30, 10, 10), { hr: 3, ha: 150 }); }
  if (v === 3) {
    for (let i = 0; i < 8; i++) {   // raios da auréola
      const a = i / 8 * TAU + sp * .25, c = Math.cos(a), s2 = Math.sin(a);
      h.F(h.P([[c * 30 - s2 * 3, -96 + s2 * 30 + c * 3], [c * 30 + s2 * 3, -96 + s2 * 30 - c * 3], [c * 56, -96 + s2 * 56]]), R.gold, 1.6, { ol: 0 });
    }
    for (let i = 0; i < 4; i++) {   // quatro lâminas em órbita
      const a = i / 4 * TAU + sp * .5, c = Math.cos(a), s2 = Math.sin(a), x = c * 88, y = -6 + s2 * 74;
      h.F(h.P([[x - c * 10, y - s2 * 10], [x + c * 26, y + s2 * 26], [x + c * 26 + s2 * 4, y + s2 * 26 - c * 4], [x - c * 10 + s2 * 4, y - s2 * 10 - c * 4]]), R.ice, 1.8, { hi: 1.3, lo: 1.3, ol: 0 });
      h.G(h.E(x, y, 5, 5), { hr: 3, ha: 150 });
    }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - sp * .4; h.star(2, 73 + i, -40 + Math.cos(a) * 40, -40 + Math.sin(a) * 40, 6, 6); }
    h.G(h.E(0, 30, 16, 16), { hr: 4, ha: 170 });
  }
  if (!fly) { for (const s of [-1, 1]) h.F(h.P([[s * 24, 96], [s * 40, 118], [s * 22, 124], [s * 10, 110]]), trim, 1.4, { ol: 0 }); }
  else { h.A(h.P([[-34, 84], [0, 96], [34, 84], [24, 120], [0, 132], [-24, 120]]), [255, 240, 190], 60); }
  h.star(v >= 2 ? 18 : 10, 75 + v, -100, -120, 100, 100);
}, { acc: '#fde68a', acc2: '#2a2410', fps: 6, vars: 4 });
