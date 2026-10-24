/* ============================================================
   06c_gearart: arte própria de cada peça nova (nada repete)
   - 50 minérios: lascas, agulhas e geodos com geometria e facetas
     únicas (semente por item)
   - 50 armaduras: 5 silhuetas de couraça × 10 brasões de família,
     com enfeites que mudam por tier
   - 50 acessórios: 13 famílias de forma (anel, pingente, manopla, botas,
     manto, coroa, fole, nadadeira, bolha, ampulheta, coração, escudo, vazio).
     Dentro das quatro grandes, CADA peça tem um desenho nomeado próprio:
     10 anéis (solitário, sinete, aro duplo, trançado, alado, garra, serpente,
     face, aro aberto, pedras em órbita), 9 pingentes (gota, medalhão, placa,
     aro aberto, torque, duplo, olho, frasco, chave), 10 manoplas (luva,
     pesada, garra, braceleto, espinhos, mão aberta, avambraço, munhequeira,
     placas, esfera) e 10 botas (botina, cano alto, alada, greva, bico longo,
     gola de pelo, joelheira, sandália, salto, cravos). O índice vem do
     catálogo (GACC_VAR), então nenhuma peça herda o desenho da vizinha.
   - 5 picaretas com cabeças diferentes e 50 barras com o selo da família
   Usado por 06_icons.js (drawIconSpec: 'ore2', 'armor2', 'acc2', 'pick2', 'bar2').
   ============================================================ */

// PRNG determinístico por item: mesma peça = mesmo desenho, sempre
function gaRnd(seed) { const r = mulberry32((seed | 0) * 2654435761 ^ 0x9e3779b9); return r; }
function gaPick(r, list) { return list[Math.floor(r() * list.length) % list.length]; }
const GA_OUT = 'rgba(10,8,16,.9)';

function gaGem(g, x, y, r, n, rot, fill, light) {   // gema de n lados, com faceta clara
  const pts = []; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  poly(g, pts, fill, GA_OUT, 1);
  poly(g, [pts[0], pts[1], [x, y]], light, false);
}
function gaSpark(g, x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1.6, 1.6); }
function gaDots(g, n, seed, col, r) {   // pontos de cravação espalhados (assinatura do item)
  const rr = gaRnd(seed * 31 + 7);
  for (let i = 0; i < n; i++) { const a = rr() * TAU, d = r * (.55 + rr() * .6); circ(g, 16 + Math.cos(a) * d, 16 + Math.sin(a) * d, 1.05, col, false); }
}

// ---------------- MINÉRIOS ----------------
function drawOreArt(g, col, forma, brilho, seed) {
  const r = gaRnd(seed * 3 + 11);
  col = gaLift(col, .34);   // no minério basta sair do preto: carvão tem de continuar parecendo carvão
  const md = col, lt = shade(col, .35), dk = shade(col, -.42), edge = shade(col, .62);
  const rock = shade(mix(col, '#6b7078', .62), .04), rockD = shade(rock, -.3);   // ganga tingida pelo minério
  if (forma === 1) {
    // agulhas: 3 a 5 cristais com alturas e inclinações próprias
    const n = 3 + (seed % 3);
    const base = 28;
    poly(g, [[6, base], [9, base - 4], [24, base - 4], [27, base]], rockD, GA_OUT, 1);
    for (let i = 0; i < n; i++) {
      const x = 7 + (i + .5) * (18 / n) + (r() - .5) * 3;
      const h = 9 + r() * 13, w = 1.6 + r() * 1.7, lean = (r() - .5) * 4;
      poly(g, [[x - w, base - 3], [x + w, base - 3], [x + lean, base - 3 - h]], md, GA_OUT, 1);
      poly(g, [[x - w, base - 3], [x + lean, base - 3 - h], [x + .4, base - 3 - h * .9]], lt, false);
      poly(g, [[x + w, base - 3], [x + lean, base - 3 - h], [x + lean + .6, base - 3 - h * .55]], dk, false);
      gaSpark(g, x + lean, base - 4 - h, edge);
    }
    if (brilho) gaSpark(g, 12 + r() * 8, 12 + r() * 6, '#fff');
  } else if (forma === 2) {
    // geodo: casca irregular com cavidade e estilhaços
    const n = 6 + (seed % 3), pts = [], rot = r() * TAU;
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * TAU, rad = 8.5 + r() * 4.5;
      pts.push([16 + Math.cos(a) * rad, 16 + Math.sin(a) * rad * .92]);
    }
    poly(g, pts, rock, GA_OUT, 1.2);
    const inner = pts.map(p => [16 + (p[0] - 16) * .62, 16 + (p[1] - 16) * .62]);
    poly(g, inner, dk, false);
    const shards = 3 + (seed % 3);
    for (let i = 0; i < shards; i++) {
      const a = r() * TAU, d = 1.5 + r() * 3.4, x = 16 + Math.cos(a) * d, y = 16 + Math.sin(a) * d;
      gaGem(g, x, y, 1.6 + r() * 2.2, 4 + (i % 2), r() * TAU, md, lt);
    }
    g.fillStyle = edge; for (let i = 0; i < 3; i++) { const p = pts[(i * 2 + 1) % n]; g.fillRect(p[0] - 1, p[1] - 1, 2, 1); }   // luz na casca
    if (brilho) gaSpark(g, 13 + r() * 6, 12 + r() * 6, '#fff');
  } else {
    // lasca maciça: pedra em três planos (claro em cima, escuro embaixo) + veio
    const n = 7 + (seed % 3), pts = [], rot = r() * .9;
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * TAU, rad = 8 + r() * 5;
      pts.push([16 + Math.cos(a) * rad, 16 + Math.sin(a) * rad]);
    }
    poly(g, pts, md, GA_OUT, 1.2);
    // plano superior: faixa clara rente à borda de cima (dá volume à pedra)
    const top = pts.map(p => [p[0], p[1]]).filter(p => p[1] <= 16.5);
    if (top.length >= 2) {
      const cut = top.map(p => [16 + (p[0] - 16) * .55, p[1] + 3.4]);
      poly(g, top.concat(cut.reverse()), lt, false);
    }
    // plano inferior: sombra no lado oposto à luz
    const bot = pts.map(p => [p[0], p[1]]).filter(p => p[1] > 17);
    if (bot.length >= 2) {
      const cut2 = bot.map(p => [16 + (p[0] - 16) * .5 + 1.4, p[1] - 3.2]);
      poly(g, bot.concat(cut2.reverse()), dk, false);
    }
    // veio fino, com sombra embaixo para não virar "rabisco"
    const vx = 7 + r() * 3, vy = 19 + r() * 3;
    g.strokeStyle = shade(col, -.55); g.lineWidth = 1.6; g.beginPath();
    g.moveTo(vx, vy + .9); g.lineTo(14 + r() * 3, 15.6 + r() * 2 + .9); g.lineTo(21 + r() * 3, 18 + r() * 2 + .9); g.stroke();
    g.strokeStyle = edge; g.lineWidth = 1; g.beginPath();
    g.moveTo(vx, vy); g.lineTo(14 + r() * 2, 15.6 + r() * 2); g.lineTo(21 + r() * 2, 18 + r() * 2); g.stroke();
    gaSpark(g, 11 + r() * 4, 10 + r() * 3, edge);
    if (brilho) { gaSpark(g, 20 + r() * 4, 12 + r() * 4, '#fff'); gaSpark(g, 12 + r() * 5, 19 + r() * 3, '#fff'); }
  }
}

// ---------------- BARRAS ----------------
// Cada barra tem massa, inclinação, entalhes e lasca próprios (silhueta única) + selo da família.
function drawBarArt(g, col, famIdx, t, seed) {
  const r = gaRnd(seed * 17 + 5);
  col = gaLift(col);
  const md = col, lt = shade(col, .45), dk = shade(col, -.4);
  const x0 = 4 + (seed % 3), x1 = 20 + ((seed >> 2) % 3);      // largura 17..20
  const top = 13 + ((seed >> 1) % 3), bot = 22 + ((seed >> 3) % 3);
  const sl = 4 + (seed % 4);                                    // inclinação do topo
  // corpo
  poly(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], md, GA_OUT, 1.2);
  poly(g, [[x0, top], [x1, top], [x1 + sl, 9], [x0 + sl, 9]], lt, GA_OUT, 1.2);
  poly(g, [[x1, top], [x1 + sl, 9], [x1 + sl, bot - 4], [x1, bot]], dk, GA_OUT, 1.2);
  // entalhes do tier no topo (1 a 5) — mudam a silhueta
  for (let i = 0; i < t + 1; i++) {
    const nx = x0 + 2 + i * ((x1 - x0 - 3) / (t + 1));
    g.clearRect(Math.round(nx), 9 + ((seed >> 2) % 2), 1.4, 2 + (i % 2));
  }
  // lasca: um canto arrancado, posição pela semente
  const corner = seed % 4;
  if (corner === 0) g.clearRect(x0 - 1, bot - 2, 3, 3);
  else if (corner === 1) g.clearRect(x1 - 1, bot - 2, 3, 3);
  else if (corner === 2) g.clearRect(x0 + sl - 2, 8, 3, 3);
  else g.clearRect(x1 + sl - 2, 9, 3, 3);
  // selo da família no topo
  const sx = 15, sy = 11;
  g.fillStyle = 'rgba(0,0,0,.35)';
  if (famIdx % 5 === 0) poly(g, [[sx, sy - 2.4], [sx + 2.4, sy], [sx, sy + 2.4], [sx - 2.4, sy]], 'rgba(0,0,0,.3)', false);
  else if (famIdx % 5 === 1) circ(g, sx, sy, 2, 'rgba(0,0,0,.3)', false);
  else if (famIdx % 5 === 2) { g.fillRect(sx - 2.6, sy - .8, 5.2, 1.6); g.fillRect(sx - .8, sy - 2.6, 1.6, 5.2); }
  else if (famIdx % 5 === 3) poly(g, [[sx - 2.6, sy + 1.6], [sx - .8, sy - 2.4], [sx + .8, sy + 1.6], [sx + 2.6, sy - 1.6]], 'rgba(0,0,0,.3)', false);
  else { g.fillRect(sx - 2.6, sy - 1.6, 5.2, 1.2); g.fillRect(sx - 2.6, sy + .8, 5.2, 1.2); }
  // brilho e marcas de tier no corpo
  g.fillStyle = 'rgba(255,255,255,.7)';
  for (let i = 0; i < t + 1; i++) g.fillRect(x0 + 2, 15.5 + i * 1.5, x1 - x0 - 5, .9);
  if (t >= 3) gaSpark(g, x1 + sl - 2, 12, '#fff');
  if (t >= 4) gaSpark(g, x0 + 2, bot - 2, '#fff');
}

// ---------------- ARMADURAS ----------------
// brasões das 10 famílias (desenhados no peito)
function drawFamilyCrest(g, fam, x, y, c1, c2) {
  const o = 'rgba(0,0,0,.8)';
  switch (fam) {
    case 0: poly(g, [[x, y - 4], [x + 3, y + 1], [x + 1.4, y + 4], [x, y + 2.4], [x - 1.4, y + 4], [x - 3, y + 1]], c1, o, .8); poly(g, [[x, y - 1], [x + 1.2, y + 2], [x, y + 3.4], [x - 1.2, y + 2]], c2, false); break;
    case 1: g.strokeStyle = c1; g.lineWidth = 1.1; for (let i = 0; i < 3; i++) { const a = i / 3 * PI; g.beginPath(); g.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4); g.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); g.stroke(); } circ(g, x, y, 1.2, c2, false); break;
    case 2: poly(g, [[x + 1.5, y - 4], [x - 2.5, y + .5], [x - .4, y + .5], [x - 1.5, y + 4], [x + 2.6, y - .6], [x + .4, y - .6]], c1, o, .8); break;
    case 3: g.strokeStyle = c1; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y + 1, 3.4, PI, TAU); g.stroke(); g.beginPath(); g.arc(x - 2, y + 1, 1.8, PI, TAU); g.stroke(); gaSpark(g, x + 3, y - 2, c2); break;
    case 4: poly(g, [[x, y - 4], [x + 3, y + .5], [x, y + 4], [x - 3, y + .5]], c1, o, .8); g.strokeStyle = c2; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 3.4); g.lineTo(x, y + 3.4); g.stroke(); break;
    case 5: poly(g, [[x - 4, y], [x, y - 2.6], [x + 4, y], [x, y + 2.6]], c1, o, .8); circ(g, x, y, 1.5, c2, false); gaSpark(g, x, y, '#fff'); break;
    case 6: circ(g, x, y, 2.6, c1, o, .8); g.fillStyle = c2; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; g.fillRect(x + Math.cos(a) * 4 - .6, y + Math.sin(a) * 4 - .6, 1.4, 1.4); } break;
    case 7: circ(g, x, y, 2.8, c1, o, .8); circ(g, x, y, 1.1, 'rgba(0,0,0,.55)', false); g.fillStyle = c2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillRect(x + Math.cos(a) * 3.8 - .6, y + Math.sin(a) * 3.8 - .6, 1.3, 1.3); } break;
    case 8: circ(g, x, y, 3.2, null, c1, 1.4); circ(g, x, y, 1.2, c2, false); gaSpark(g, x + 3, y - 3, c2); break;
    default: { const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? 1.6 : 4; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(g, p, c1, o, .8); circ(g, x, y, 1.1, '#fff', false); }
  }
}
// seis motivos de peito (tabardo, gemas, corrente, gola de pelo, ombro assimétrico, faixa rúnica)
function drawArmorMotif(g, m, seed, md, lt, dk, metal, dark) {
  if (m === 0) {                                  // tabardo: faixa de pano até a barra
    poly(g, [[13, 11], [19, 11], [20, 28], [12, 28]], lt, GA_OUT, .9);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(15.6, 12, 1.2, 15);
  } else if (m === 1) {                           // gemas cravadas no peito
    const n = 2 + (seed % 3);
    for (let i = 0; i < n; i++) gaGem(g, 12 + i * (8 / Math.max(1, n - 1)), 21 + (i % 2) * 2.4, 1.6, 4 + (i % 3), .4, metal, '#fff');
  } else if (m === 2) {                           // corrente com argola pendurada
    g.strokeStyle = metal; g.lineWidth = 1;
    g.beginPath(); g.moveTo(9, 12); g.quadraticCurveTo(16, 17, 23, 12); g.stroke();
    for (let i = 0; i < 4; i++) { const x = 10.5 + i * 3.6, y = 13.4 + Math.sin(i / 3 * PI) * 2.2; circ(g, x, y, 1.1, metal, GA_OUT, .5); }
    circ(g, 16, 18.6, 2.2, null, metal, 1);
  } else if (m === 3) {                           // gola de pelo (topo irregular)
    g.fillStyle = shade(lt, -.1);
    for (let i = 0; i < 7; i++) circ(g, 9 + i * 2.4, 9.4 - (i % 2) * .9, 1.8, shade(lt, -.08), GA_OUT, .6);
  } else if (m === 4) {                           // ombro esquerdo maior: silhueta assimétrica
    poly(g, [[6, 10], [1, 6], [3, 14], [-1, 13], [6, 17]], md, GA_OUT, 1);
    circ(g, 4.4, 11, 2.2, metal, GA_OUT, .7);
  } else {                                        // faixa rúnica na cintura
    g.fillStyle = dark; g.fillRect(8, 21.4, 16, 2.6);
    g.fillStyle = lt; for (let i = 0; i < 4; i++) g.fillRect(9.4 + i * 3.8, 22, 1.6, 1.4);
    for (const s of [-1, 1]) poly(g, [[16 + s * 8, 22.8], [16 + s * 11, 20], [16 + s * 10, 25]], metal, GA_OUT, .6);
  }
}
// minérios T8/T10 têm cores quase pretas (Carvão Noturno, Pérola Negra): clareia só o desenho,
// mantendo o matiz, para a peça aparecer no fundo escuro do inventário.
function gaLift(c, maxK) {
  maxK = maxK === undefined ? .62 : maxK;
  const n = parseInt(String(c).replace('#', ''), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
  return lum >= .30 ? c : shade(c, Math.min(maxK, Math.max(Math.min(.30, maxK), (.36 - lum) * 1.8)));
}
function drawArmorArt(g, col, famIdx, t, seed) {
  const r = gaRnd(seed * 7 + 3);
  col = gaLift(col);
  const md = col, lt = shade(col, .4), dk = shade(col, -.42), metal = shade(col, .62), dark = shade(col, -.6);
  const trim = famIdx % 2 ? metal : lt;
  const v = (famIdx * 2 + t * 3) % 5;             // 5 cortes de couraça
  const crest1 = ['#fff7e6', '#e0f7ff', '#fff9c4', '#e6f7ff', '#eaffd0', '#f3e8ff', '#fff4d6', '#ffe4f2', '#e8eaff', '#ffffff'][famIdx];
  const crest2 = ['#ff7a1a', '#7dd3fc', '#fde047', '#38bdf8', '#84cc16', '#a855f7', '#fbbf24', '#f472b6', '#818cf8', '#f8fafc'][famIdx];
  // corte próprio: largura/altura em 5 degraus (a peça nunca tem o mesmo corpo da vizinha)
  const sx = .90 + (seed % 5) * .045, sy = .94 + (((seed >> 4) % 5)) * .035;
  const oy = -((seed >> 2) % 2) * .8;
  g.save(); g.translate(16, 16 + oy); g.scale(sx, sy); g.translate(-16, -16);
  const spikes = 2 + (seed % 3);                    // 2 a 4 espinhos por ombro
  if (v === 0) {
    poly(g, [[8, 10], [12, 7], [16, 10], [20, 7], [24, 10], [25, 15], [22, 16], [23, 28], [9, 28], [10, 16], [7, 15]], md, GA_OUT, 1.2);
    circ(g, 7.5, 11.5, 4.1, md, GA_OUT, 1.2); circ(g, 24.5, 11.5, 4.1, md, GA_OUT, 1.2);
    circ(g, 6.4, 10.4, 1.5, trim, false); circ(g, 23.6, 10.4, 1.5, trim, false);
    poly(g, [[12, 7], [16, 11], [20, 7], [16, 13]], dark, false);
    for (let i = 0; i < spikes; i++) poly(g, [[11 + i * 2.6, 27.4], [12.3 + i * 2.6, 27.4], [11.6 + i * 2.6, 29.4]], dark, GA_OUT, .7);
  } else if (v === 1) {
    poly(g, [[8, 11], [12, 8], [20, 8], [24, 11], [23, 28], [9, 28]], md, GA_OUT, 1.2);
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 8 : 24;
      poly(g, [[x0, 9], [x0 + s * 5, 7], [x0 + s * 5.5, 12], [x0 + s * 2, 14]], md, GA_OUT, 1.2);
      for (let i = 0; i < spikes; i++) poly(g, [[x0 + s * (2 + i * 1.1), 8.4 - i * .4], [x0 + s * (4.6 + i * .7), 3.4 - i * 1.4], [x0 + s * (5 + i * .5), 8.6 - i * .4]], trim, GA_OUT, .8);
    }
    poly(g, [[12, 8], [16, 5], [20, 8], [19, 10], [16, 8.5], [13, 10]], lt, GA_OUT, 1);
    for (let i = 0; i < 3; i++) gaSpark(g, 11 + i * 4.6, 25, trim);
  } else if (v === 2) {
    poly(g, [[9, 9], [23, 9], [25, 14], [7, 14]], md, GA_OUT, 1.2);
    rrect(g, 9, 15, 14, 4.4, 1, shade(col, -.1), GA_OUT, 1);
    rrect(g, 9, 20, 14, 4.4, 1, shade(col, -.2), GA_OUT, 1);
    rrect(g, 10, 25, 12, 3, 1, shade(col, -.3), GA_OUT, 1);
    for (let i = 0; i < 4; i++) { gaSpark(g, 10.5 + i * 3.6, 16.2, trim); gaSpark(g, 10.5 + i * 3.6, 21.2, trim); }
    circ(g, 8, 12, 2.4, lt, GA_OUT, 1); circ(g, 24, 12, 2.4, lt, GA_OUT, 1);
    for (let i = 0; i < spikes; i++) poly(g, [[9 + i * 2.2, 27.8], [10.6 + i * 2.2, 27.8], [9.8 + i * 2.2, 29.6]], shade(col, -.35), GA_OUT, .7);
  } else if (v === 3) {
    poly(g, [[9, 10], [23, 10], [22, 17], [24, 28], [8, 28], [10, 17]], md, GA_OUT, 1.2);
    poly(g, [[9, 11], [2, 7], [5, 14], [1, 13], [7, 17]], lt, GA_OUT, 1);
    poly(g, [[23, 11], [30, 7], [27, 14], [31, 13], [25, 17]], lt, GA_OUT, 1);
    poly(g, [[10, 10], [16, 6], [22, 10], [16, 13]], shade(col, -.25), GA_OUT, 1);
    for (let i = 0; i < 3 + (seed % 2); i++) poly(g, [[8.6 + i * 3.4, 20], [10.8 + i * 3.4, 20], [9.7 + i * 3.4, 26 + (i % 2)]], dark, GA_OUT, .8);
  } else {
    poly(g, [[6, 12], [10, 8], [16, 10], [22, 8], [26, 12], [25, 22], [22, 28], [10, 28], [7, 22]], md, GA_OUT, 1.2);
    circ(g, 7.5, 13, 4.6, shade(col, -.12), GA_OUT, 1.2); circ(g, 24.5, 13, 4.6, shade(col, -.12), GA_OUT, 1.2);
    poly(g, [[13, 8], [16, 4], [19, 8], [16, 12]], lt, GA_OUT, 1);
    poly(g, [[13, 7], [11, 2], [15, 5]], trim, GA_OUT, 1); poly(g, [[19, 7], [21, 2], [17, 5]], trim, GA_OUT, 1);
    for (let i = 0; i < spikes; i++) gaSpark(g, 9.5 + i * 2.4, 15, metal);
    for (let i = 0; i < 3; i++) poly(g, [[11 + i * 5, 20], [13 + i * 5, 20], [12 + i * 5, 26]], dark, GA_OUT, .8);
  }
  g.restore();
  // enfeites por tier (fora do corpo: mudam a silhueta)
  if (t >= 1) { circ(g, 16, 24, 1.5, trim, false); }
  if (t >= 2) { for (const s of [-1, 1]) circ(g, 16 + s * 11.5, 16, 1.2, metal, GA_OUT, .7); }
  if (t >= 3) { for (const s of [-1, 1]) gaSpark(g, 16 + s * 8.5, 19, metal); }
  if (t >= 4) { g.strokeStyle = trim; g.lineWidth = 1.1; g.beginPath(); g.arc(16, 15, 10.2, PI * 1.12, PI * 1.88); g.stroke(); gaSpark(g, 16, 4.6, '#fff'); }
  drawArmorMotif(g, (famIdx * 5 + t) % 6, seed, md, lt, dk, metal, dark);
  // brasão da família
  drawFamilyCrest(g, famIdx, 16, 17.5, crest1, crest2);
  // cravos do ombro: a assinatura de cada peça (quantidade e altura variam)
  const stud = 1 + (seed % 3);
  for (let i = 0; i < stud; i++) { const yy = 9 + i * 2.6; circ(g, 5.4 + (seed % 2) * .6, yy, 1.05, metal, GA_OUT, .6); circ(g, 26.6 - (seed % 2) * .6, yy, 1.05, metal, GA_OUT, .6); }
}

// cravos na borda: cada peça recebe 2 a 4 rebites em posições próprias (silhueta única)
function gaEdgeMarks(g, seed, col) {
  const r = gaRnd(seed * 97 + 13);
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, rr = 10.2 + r() * 3.6;
    const x = 16 + Math.cos(a) * rr, y = 16 + Math.sin(a) * rr * .92;
    const sz = 1 + r() * .8;
    g.fillStyle = col; g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - sz / 2, y - sz / 2, .7, .7);
  }
}
// ---------------- ACESSÓRIOS ----------------
function drawAccArt(g, col, shape, tier, seed, variant) {
  const r = gaRnd(seed * 13 + 5);
  const md = col, lt = shade(col, .45), dk = shade(col, -.42), metal = '#d8dee9', metalD = '#6b7280', gold = '#f4c430', goldD = '#8a6a10';
  const band = seed % 3 === 0 ? gold : seed % 3 === 1 ? metal : shade(col, .3);
  const bandD = seed % 3 === 0 ? goldD : seed % 3 === 1 ? metalD : dk;
  const gemN = 3 + (seed % 4);                 // gema de 3 a 6 lados
  const v = variant === undefined ? (seed % 10) : (variant | 0);   // desenho próprio de cada peça
  const orn = seed % 4;
  // argola com contorno: sempre legível no fundo escuro do inventário
  const ringBand = (cy, rr, lw, colr) => {
    g.strokeStyle = GA_OUT; g.lineWidth = lw + 2.2; g.beginPath(); g.arc(16, cy, rr, 0, TAU); g.stroke();
    g.strokeStyle = colr || band; g.lineWidth = lw; g.beginPath(); g.arc(16, cy, rr, 0, TAU); g.stroke();
    g.strokeStyle = shade(colr || band, .35); g.lineWidth = .9; g.beginPath(); g.arc(16, cy, rr - lw / 2 + .3, .5, 2.3); g.stroke();
  };
  // corrente em V (com contas), usada pelos pingentes
  const vChain = (topY, midY, half) => {
    for (const pass of [[GA_OUT, 2.8], [band, 1.2]]) {
      g.strokeStyle = pass[0]; g.lineWidth = pass[1];
      g.beginPath(); g.moveTo(16 - half, topY); g.lineTo(16, midY); g.lineTo(16 + half, topY); g.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const t = .2 + i * .2;
      circ(g, 16 - half + half * t, topY + (midY - topY) * t, .85, bandD, false);
      circ(g, 16 + half - half * t, topY + (midY - topY) * t, .85, bandD, false);
    }
    circ(g, 16, midY + 1.4, 1.7, null, band, .9);
  };
  switch (shape) {
    // ---------------- 10 anéis, 10 desenhos ----------------
    case 'ring': {
      if (v === 0) {                                  // solitário: aro fino e gema alta
        ringBand(19.8, 6.6, 2.6);
        gaGem(g, 16, 10.2, 3.9, gemN, -.5, md, lt);
        poly(g, [[12.4, 12.8], [14.6, 15.8], [16.2, 12.2]], shade(band, .3), GA_OUT, .6);
        poly(g, [[19.6, 12.8], [17.4, 15.8], [15.8, 12.2]], shade(band, .3), GA_OUT, .6);
      } else if (v === 1) {                           // sinete: aro grosso e face gravada
        ringBand(20.6, 6.2, 4.4);
        ellipseFill(g, 16, 11.2, 5.8, 4.3, md, GA_OUT);
        g.strokeStyle = bandD; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(12.6, 12.4); g.lineTo(16, 9.2); g.lineTo(19.4, 12.4); g.stroke();
        gaSpark(g, 16, 13.6, shade(md, .5));
      } else if (v === 2) {                           // aro duplo com gema no meio
        ringBand(17.4, 6.4, 1.9); ringBand(21.8, 6.4, 1.9, shade(band, -.15));
        g.fillStyle = band; g.fillRect(14.6, 6.6, 2.8, 5);
        gaGem(g, 16, 8, 3.2, gemN, .2, md, lt);
      } else if (v === 3) {                           // aro trançado
        g.strokeStyle = GA_OUT; g.lineWidth = 5.6; g.beginPath(); g.arc(16, 19.6, 6.8, 0, TAU); g.stroke();
        g.strokeStyle = band; g.lineWidth = 3.4; g.beginPath(); g.arc(16, 19.6, 6.8, 0, TAU); g.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU, x = 16 + Math.cos(a) * 6.8, y = 19.6 + Math.sin(a) * 6.8;
          g.strokeStyle = bandD; g.lineWidth = 1.1;
          g.beginPath(); g.moveTo(x - 1.2, y - 1.2); g.lineTo(x + 1.2, y + 1.2); g.stroke();
        }
        gaGem(g, 16, 10.4, 2.8, 4, -.3, lt, '#fff');
      } else if (v === 4) {                           // aro alado
        ringBand(20.4, 6.2, 2.4);
        for (const s2 of [-1, 1]) poly(g, [[16 + s2 * 6.4, 16.6], [16 + s2 * 13.6, 11.4], [16 + s2 * 12.4, 16.4], [16 + s2 * 6.8, 19.4]], lt, GA_OUT, .9);
        gaGem(g, 16, 10, 3.1, gemN, -.4, md, lt);
      } else if (v === 5) {                           // garra: quatro unhas cravadas na gema
        ringBand(22.6, 5.8, 2.4);
        for (const s2 of [-1, 1]) for (let i = 0; i < 2; i++) {
          poly(g, [[16 + s2 * (2.4 + i * 2), 18], [16 + s2 * (4.2 + i * 2.2), 8 + i * 2.6], [16 + s2 * (5.4 + i * 2.2), 17]], shade(band, .15), GA_OUT, .7);
        }
        gaGem(g, 16, 12, 3.5, gemN, .1, md, lt);
      } else if (v === 6) {                           // serpente enrolada
        g.strokeStyle = GA_OUT; g.lineWidth = 5.4; g.beginPath(); g.arc(16, 20, 6.6, 0, TAU); g.stroke();
        g.strokeStyle = band; g.lineWidth = 3.2; g.beginPath(); g.arc(16, 20, 6.6, 0, TAU); g.stroke();
        g.strokeStyle = band; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(9.6, 21.6); g.quadraticCurveTo(6.4, 14, 13.4, 12.2); g.quadraticCurveTo(19, 10.8, 22.2, 7.6); g.stroke();
        circ(g, 23.4, 6.6, 2.4, md, GA_OUT, .9);
        g.fillStyle = '#101018'; g.fillRect(24, 6.2, 1, 1);
        gaSpark(g, 22, 5, lt);
      } else if (v === 7) {                           // face hexagonal
        ringBand(21.4, 6.2, 2.6);
        const hp = []; for (let i = 0; i < 6; i++) { const a = -PI / 2 + i / 6 * TAU; hp.push([16 + Math.cos(a) * 5.2, 11 + Math.sin(a) * 5.2]); }
        poly(g, hp, md, GA_OUT, 1.3);
        gaGem(g, 16, 11, 2.2, 4, .4, lt, '#fff');
      } else if (v === 8) {                           // aro aberto com gema solta
        g.strokeStyle = GA_OUT; g.lineWidth = 5.2; g.beginPath(); g.arc(16, 19, 6.8, .62, TAU - .62); g.stroke();
        g.strokeStyle = band; g.lineWidth = 3.1; g.beginPath(); g.arc(16, 19, 6.8, .62, TAU - .62); g.stroke();
        for (const s2 of [-1, 1]) circ(g, 16 + s2 * 3.9, 12.7, 1.5, shade(band, .2), GA_OUT, .6);
        gaGem(g, 16, 8.4, 3.3, gemN, .3, md, lt);
      } else {                                        // aro com pedras em órbita
        ringBand(20, 6.2, 2.2);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .9;
        g.beginPath(); g.ellipse(16, 16, 12.6, 4.4, -.42, 0, TAU); g.stroke();
        for (const a of [.2, 2.1, 4.4]) circ(g, 16 + Math.cos(a) * 12.4, 16 + Math.sin(a) * 4.3 - 1.4, 1.3, md, GA_OUT, .5);
        gaGem(g, 16, 10.4, 2.6, 4, .2, lt, '#fff');
      }
      break;
    }
    // ---------------- 9 pingentes, 9 desenhos ----------------
    case 'amulet': {
      if (v === 4) {                                  // torque: aro grosso no pescoço, sem corrente
        g.strokeStyle = GA_OUT; g.lineWidth = 5.4; g.beginPath(); g.arc(16, 21, 10.4, PI * 1.06, PI * 1.94); g.stroke();
        g.strokeStyle = band; g.lineWidth = 3.4; g.beginPath(); g.arc(16, 21, 10.4, PI * 1.06, PI * 1.94); g.stroke();
        for (const s2 of [-1, 1]) circ(g, 16 + s2 * 10.2, 21.4, 2.2, md, GA_OUT, .8);
        poly(g, [[16, 17], [19.4, 21], [16, 25.4], [12.6, 21]], lt, GA_OUT, 1);
        gaGem(g, 16, 21, 1.7, 4, .2, md, '#fff');
      } else if (v === 0) {                           // pingente gota
        vChain(3.4, 12, 8.6);
        gaGem(g, 16, 20.4, 6.4, 3 + (seed % 3), .4, md, lt);
        poly(g, [[16, 12.6], [14.2, 16], [17.8, 16]], shade(band, .3), GA_OUT, .6);
      } else if (v === 1) {                           // medalhão com aro e gema interna
        vChain(3, 11.4, 8.8);
        circ(g, 16, 20, 6.6, md, GA_OUT, 1.4);
        g.strokeStyle = band; g.lineWidth = 1.6; g.beginPath(); g.arc(16, 20, 4.8, 0, TAU); g.stroke();
        gaGem(g, 16, 20, 3, 3 + (seed % 3), .2, lt, '#fff');
      } else if (v === 2) {                           // placa pentagonal
        vChain(3.4, 11.6, 8.4);
        const pp = []; for (let i = 0; i < 5; i++) { const a = -PI / 2 + i / 5 * TAU; pp.push([16 + Math.cos(a) * 6.6, 20.6 + Math.sin(a) * 6.8]); }
        poly(g, pp, md, GA_OUT, 1.3);
        g.strokeStyle = shade(md, -.4); g.lineWidth = 1; poly(g, pp.map(q => [16 + (q[0] - 16) * .62, 20.6 + (q[1] - 20.6) * .62]), null, false);
        gaSpark(g, 16, 20.6, shade(md, .6));
      } else if (v === 3) {                           // aro aberto com gema dentro
        vChain(3.2, 11, 8.4);
        g.strokeStyle = GA_OUT; g.lineWidth = 4.4; g.beginPath(); g.arc(16, 20.6, 6.2, .55, TAU - .55); g.stroke();
        g.strokeStyle = band; g.lineWidth = 2.4; g.beginPath(); g.arc(16, 20.6, 6.2, .55, TAU - .55); g.stroke();
        gaGem(g, 16, 20.6, 3.4, gemN, .3, md, lt);
      } else if (v === 5) {                           // duas correntes, dois pingentes
        vChain(2.6, 10.4, 5.4); vChain(2.6, 10.4, 10.6);
        for (const [x, yy, sz] of [[11.6, 19.4, 3.6], [20.4, 19.4, 3.6]]) { circ(g, x, yy, sz, md, GA_OUT, 1.1); gaGem(g, x, yy, sz - 1.6, 4, .2, lt, '#fff'); }
        g.strokeStyle = band; g.lineWidth = 1; g.beginPath(); g.moveTo(11.6, 14.4); g.lineTo(11.6, 15.8); g.moveTo(20.4, 14.4); g.lineTo(20.4, 15.8); g.stroke();
      } else if (v === 6) {                           // olho: amêndoa com pupila
        vChain(3.2, 11.2, 8.6);
        g.beginPath(); g.moveTo(9.6, 20); g.quadraticCurveTo(16, 12.4, 22.4, 20); g.quadraticCurveTo(16, 27, 9.6, 20); g.closePath();
        g.fillStyle = md; g.fill(); g.strokeStyle = GA_OUT; g.lineWidth = 1.3; g.stroke();
        circ(g, 16, 19.8, 3.2, lt, false);
        circ(g, 16, 19.8, 1.7, '#1b1a22', false);
        gaSpark(g, 15.2, 18.8, '#fff');
      } else if (v === 7) {                           // frasco de poção
        vChain(3, 10.6, 8.4);
        rrect(g, 13, 14.4, 6, 2.6, .4, metal, GA_OUT, .8);
        poly(g, [[12.4, 18], [19.6, 18], [21.4, 26.4], [10.6, 26.4]], md, GA_OUT, 1.1);
        g.fillStyle = lt; g.fillRect(12.2, 21.6, 7.6, 3.6);
        gaSpark(g, 14, 19.4, '#fff');
      } else {                                        // chave pendurada
        vChain(3, 10.8, 8.4);
        circ(g, 16, 16.4, 3.4, null, band, 1.9);
        g.fillStyle = band; g.fillRect(14.8, 19.4, 2.4, 7.4);
        g.fillRect(17.2, 23, 3.4, 1.8); g.fillRect(17.2, 26, 2.6, 1.6);
        gaSpark(g, 16, 16.4, shade(band, .5));
      }
      if (tier >= 4 && v !== 4) poly(g, [[16, 7], [13.6, 4.4], [16, 5.2], [18.4, 4.4]], lt, GA_OUT, .7);
      break;
    }
    // ---------------- 10 manoplas, 10 desenhos ----------------
    case 'gauntlet': {
      // peças separadas (punho, palma, dedos, polegar) — é o que faz a luva parecer luva
      const glove = (o) => {
        const gx = o.gx || 16, palmW = o.palmW, palmTop = o.palmTop, palmBot = o.palmBot;
        const cuffW = o.cuffW, cuffTop = o.cuffTop, cuffBot = o.cuffBot;
        // punho
        rrect(g, gx - cuffW / 2, cuffTop, cuffW, cuffBot - cuffTop, 1.6, shade(md, -.34), GA_OUT, 1);
        g.fillStyle = lt; g.fillRect(gx - cuffW / 2 + .8, cuffTop + 1, cuffW - 1.6, 1.4);
        if (o.strap) { g.fillStyle = shade(md, -.56); g.fillRect(gx - cuffW / 2 + .6, cuffBot - 2.4, cuffW - 1.2, 1.2); }
        // palma, levemente afunilada para o punho
        poly(g, [[gx - palmW / 2, palmTop], [gx + palmW / 2, palmTop], [gx + palmW / 2 - 1, palmBot], [gx - palmW / 2 + 1, palmBot]], md, GA_OUT, 1.15);
        g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(gx + palmW / 2 - 2.6, palmTop + .8, 2, palmBot - palmTop - 1.6);
        g.fillStyle = lt; g.fillRect(gx - palmW / 2 + 1.4, palmTop + 1.6, palmW * .38, 1.6);
        // dedos (cápsulas com contorno próprio e unha clara)
        const n = o.fingers, fw = o.fw, gap = o.gap || .8;
        const totalW = n * fw + (n - 1) * gap;
        for (let k = 0; k < n; k++) {
          const fx = gx - totalW / 2 + k * (fw + gap);
          const len = o.len[k % o.len.length], ty = palmTop - len;
          rrect(g, fx, ty, fw, len + 2.6, fw * .46, md, GA_OUT, .95);
          g.fillStyle = lt; g.fillRect(fx + .5, ty + .8, Math.max(.9, fw - 1.4), 1.1);
          if (o.nail) { g.fillStyle = shade(md, .55); g.fillRect(fx + fw / 2 - .7, ty + .6, 1.4, 1.1); }
        }
        // polegar
        if (o.thumb === -1) {
          poly(g, [[gx - palmW / 2 + .6, palmTop + 3], [gx - palmW / 2 - 5, palmTop + 1], [gx - palmW / 2 - 4.4, palmTop + 7], [gx - palmW / 2 + .8, palmTop + 7.4]], md, GA_OUT, 1);
          g.fillStyle = lt; g.fillRect(gx - palmW / 2 - 3.4, palmTop + 2.2, 2.4, 1.1);
        } else if (o.thumb === 1) {
          poly(g, [[gx + palmW / 2 - .6, palmTop + 3], [gx + palmW / 2 + 5, palmTop + 1], [gx + palmW / 2 + 4.4, palmTop + 7], [gx + palmW / 2 - .8, palmTop + 7.4]], md, GA_OUT, 1);
          g.fillStyle = lt; g.fillRect(gx + palmW / 2 + 1, palmTop + 2.2, 2.4, 1.1);
        }
        return { cy: (palmTop + palmBot) / 2 };
      };
      if (v === 0) {                    // luva de quatro dedos, punho curto
        const q = glove({ palmW: 11, palmTop: 13, palmBot: 22.4, cuffW: 13, cuffTop: 22.4, cuffBot: 29.4, fingers: 4, fw: 2.5, len: [5, 7, 6.4, 4.6], thumb: -1, strap: 1 });
        gaSpark(g, 13.6, q.cy, band);
      } else if (v === 1) {             // manopla pesada: dedos curtos e grossos, punho alto
        const q = glove({ palmW: 13, palmTop: 14.4, palmBot: 22, cuffW: 15, cuffTop: 22, cuffBot: 30, fingers: 3, fw: 3.8, gap: 1, len: [2.6, 3.6, 2.6], thumb: -1, strap: 1 });
        // nós dos dedos e rebites: a manopla pesada tem de mostrar a mão por baixo
        for (let k = 0; k < 3; k++) { circ(g, 11.4 + k * 4.8, 15.6, 1.5, metal, GA_OUT, .6); }
        g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(10, 19.4, 12, 1.4);
        gaSpark(g, 16, q.cy + 3, band);
      } else if (v === 2) {             // garra: três dedos muito longos
        const q = glove({ palmW: 10, palmTop: 15, palmBot: 23.4, cuffW: 11.6, cuffTop: 23.4, cuffBot: 29.6, fingers: 3, fw: 2.6, gap: 1.4, len: [10, 12, 9], thumb: 1 });
        for (let k = 0; k < 3; k++) { const x = 11.4 + k * 4.4; poly(g, [[x, 5.4], [x + 1.1, 0.6], [x + 2, 5.6]], lt, GA_OUT, .6); }
        gaSpark(g, 16, q.cy, band);
      } else if (v === 3) {             // braceleto aberto, placa no dorso e tiras
        poly(g, [[8.6, 10.4], [20.4, 8.4], [23.4, 13], [22.6, 26], [10.6, 27.6], [7.8, 20]], md, GA_OUT, 1.2);
        poly(g, [[20.4, 8.4], [23.4, 13], [22.6, 26], [18.6, 26.6]], shade(md, -.26), false);
        rrect(g, 10.2, 12, 10.4, 6, 1.4, shade(md, -.2), GA_OUT, .9);
        gaGem(g, 15.4, 15, 2.5, gemN, .2, lt, '#fff');
        g.fillStyle = shade(md, -.48); g.fillRect(8.6, 20.6, 14.2, 1.5);
        g.fillStyle = shade(md, -.48); g.fillRect(9, 23.4, 13.6, 1.4);
        for (const s2 of [-1, 1]) poly(g, [[16 + s2 * 7.4, 12.4], [16 + s2 * 11, 8], [16 + s2 * 10.2, 15]], lt, GA_OUT, .8);
      } else if (v === 4) {             // punho com espinhos laterais
        const q = glove({ palmW: 11, palmTop: 13.2, palmBot: 22.6, cuffW: 13, cuffTop: 22.6, cuffBot: 29.6, fingers: 4, fw: 2.5, len: [4.6, 6.6, 6, 4.2], thumb: 1, strap: 1 });
        for (const s2 of [-1, 1]) {
          poly(g, [[16 + s2 * 7, q.cy - .6], [16 + s2 * 12.4, q.cy - 5.8], [16 + s2 * 11.8, q.cy + 1.8]], lt, GA_OUT, .8);
          poly(g, [[16 + s2 * 7.4, q.cy + 3.8], [16 + s2 * 13, q.cy + 1.8], [16 + s2 * 12, q.cy + 6.2]], shade(md, .12), GA_OUT, .7);
        }
        poly(g, [[13.6, 22.6], [16, 15.4], [18.4, 22.6]], shade(md, .2), GA_OUT, .9);
        gaGem(g, 16, 20.4, 1.8, 4, .2, lt, '#fff');
      } else if (v === 5) {             // mão aberta: cinco dedos com unha
        const q = glove({ palmW: 12, palmTop: 13.6, palmBot: 22.8, cuffW: 12.4, cuffTop: 22.8, cuffBot: 29.4, fingers: 5, fw: 2.2, gap: .55, len: [4.4, 6.4, 7.6, 6, 3.8], thumb: -1, nail: 1 });
        g.strokeStyle = shade(md, -.32); g.lineWidth = .9;
        g.beginPath(); g.moveTo(12.6, q.cy + 1.4); g.lineTo(19.4, q.cy + 1.4); g.stroke();
      } else if (v === 6) {             // avambraço com barbatanas e punho cerrado
        // punho cerrado em cima (com os quatro nós dos dedos)
        rrect(g, 9.6, 3.6, 12.8, 8.6, 3, md, GA_OUT, 1.15);
        g.fillStyle = lt; g.fillRect(10.8, 4.8, 10.4, 1.6);
        for (let k = 0; k < 4; k++) {
          const x = 10.4 + k * 3.1;
          rrect(g, x, 6.6, 2.7, 3.6, 1.1, shade(md, -.12), GA_OUT, .7);
          g.fillStyle = shade(md, .45); g.fillRect(x + .7, 7.1, 1.3, 1);
        }
        // avambraço afunilado
        poly(g, [[11.4, 29.8], [10.4, 11.4], [21.6, 11.4], [20.6, 29.8]], md, GA_OUT, 1.1);
        poly(g, [[17.4, 11.4], [21.6, 11.4], [20.6, 29.8], [16.4, 29.8]], shade(md, -.22), false);
        // barbatanas laterais
        for (const s2 of [-1, 1]) poly(g, [[16 + s2 * 5.2, 15.6], [16 + s2 * 12.4, 9.4], [16 + s2 * 11, 17.4]], lt, GA_OUT, .9);
        // tiras do avambraço
        for (let k = 0; k < 2; k++) { g.fillStyle = shade(md, -.34); g.fillRect(11.4, 19 + k * 5, 9.2, 2.2); }
        g.fillStyle = shade(md, -.5); g.fillRect(10.6, 27.6, 10.8, 2.2);
        gaSpark(g, 16, 13.2, band);
      } else if (v === 7) {             // munhequeira: tiras e cravos, sem luva
        // dois aros paralelos ligados por uma placa (munhequeira articulada)
        for (const [yy, hh] of [[11.4, 4.6], [21.4, 4.6]]) {
          rrect(g, 7.6, yy, 16.8, hh, 2.2, md, GA_OUT, 1.1);
          g.fillStyle = lt; g.fillRect(8.8, yy + .9, 14.4, 1.3);
          g.fillStyle = shade(md, -.42); g.fillRect(8.6, yy + hh - 1.4, 14.8, 1.1);
        }
        rrect(g, 13, 15.2, 6, 6.8, 1.4, shade(md, -.18), GA_OUT, .9);
        gaGem(g, 16, 18.6, 2, 4, .2, lt, '#fff');
        for (let k = 0; k < 4; k++) poly(g, [[8.8 + k * 4.6, 11], [10 + k * 4.6, 6.6], [11.2 + k * 4.6, 11]], shade(md, .16), GA_OUT, .6);
      } else if (v === 8) {             // manopla com placas de nó
        const q = glove({ palmW: 12.4, palmTop: 13.8, palmBot: 22.4, cuffW: 14, cuffTop: 22.4, cuffBot: 30, fingers: 4, fw: 2.9, gap: .7, len: [2.4, 3.4, 3.2, 2.2], thumb: 1, strap: 1 });
        for (let k = 0; k < 3; k++) rrect(g, 10.8 + k * 3.8, 14.8, 3.2, 2.8, .8, shade(md, -.22), GA_OUT, .7);
        gaGem(g, 16, q.cy + 2, 2.1, gemN, .2, lt, '#fff');
      } else {                          // palma com esfera de energia
        const q = glove({ palmW: 11.6, palmTop: 14.4, palmBot: 23, cuffW: 12.6, cuffTop: 23, cuffBot: 29.6, fingers: 4, fw: 2.5, len: [1.8, 2.6, 2.4, 1.6], thumb: -1, strap: 1 });
        circ(g, 16, 7, 4.2, lt, GA_OUT, 1);
        circ(g, 16, 7, 2.1, '#fff', false);
        for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .6; gaSpark(g, 16 + Math.cos(a) * 6.4, 7 + Math.sin(a) * 4.4, band); }
      }
      break;
    }
    // ---------------- 10 botas, 10 desenhos ----------------
    case 'boots': {
      // bota de perfil: cano, tornozelo, peito do pé, bico arredondado, sola e calcanhar.
      // Cada peça muda altura do cano, comprimento/altura do bico, salto e adorno.
      const boot = (o) => {
        const cx0 = o.cx0, cx1 = o.cx1;             // largura do cano
        const top = o.top, ankle = o.ankle;          // topo do cano e linha do tornozelo
        const toe = o.toe, sole = o.sole, soleH = o.soleH;
        const heelW = o.heelW === undefined ? 3.4 : o.heelW, heelH = o.heelH || 0;
        const tip = o.tip === undefined ? 2.2 : o.tip;   // quanto o bico sobe
        g.beginPath();
        g.moveTo(cx0, top);
        g.lineTo(cx1, top);
        g.lineTo(cx1 + 1.4, ankle);                  // cano desce e abre no tornozelo
        g.quadraticCurveTo(toe - 1, ankle + .4, toe, sole - tip);   // peito do pé
        g.quadraticCurveTo(toe + .6, sole, toe - 2.4, sole);        // bico arredondado
        g.lineTo(cx0 - 1.2, sole);                   // sola até o calcanhar
        g.lineTo(cx0 - 1.2, top + 2.6);              // calcanhar sobe
        g.closePath();
        g.fillStyle = md; g.fill();
        g.strokeStyle = GA_OUT; g.lineWidth = 1.2; g.stroke();
        // luz no cano e sombra no peito do pé
        g.fillStyle = lt; g.fillRect(cx0 + .6, top + 1.2, cx1 - cx0 - 1.2, 1.8);
        g.fillStyle = 'rgba(0,0,0,.20)';
        g.beginPath(); g.moveTo(cx1, ankle - 1); g.lineTo(toe - 2.4, sole - tip - .6); g.lineTo(toe - 2.4, sole - .6); g.lineTo(cx1, ankle + 2.4); g.closePath(); g.fill();
        // sola
        rrect(g, cx0 - 2, sole, toe - cx0 + 3, soleH, 1, shade(md, -.52), GA_OUT, .9);
        if (heelH) {                                 // salto em cunha, afinando para baixo
          g.fillStyle = shade(md, -.6);
          g.beginPath(); g.moveTo(cx0 - 1.2, sole + soleH); g.lineTo(cx0 - 1.2 + heelW + 1.6, sole + soleH);
          g.lineTo(cx0 - .2 + heelW * .55, sole + soleH + heelH); g.lineTo(cx0 - 1.4, sole + soleH + heelH);
          g.closePath(); g.fill(); g.strokeStyle = GA_OUT; g.lineWidth = .8; g.stroke();
        }
        return { sole: sole + soleH };
      };
      if (v === 0) {                    // botina curta
        boot({ cx0: 9, cx1: 19, top: 11, ankle: 18, toe: 26, sole: 25, soleH: 2.4 });
        for (let i = 0; i < 2; i++) gaSpark(g, 11.6, 14.6 + i * 3.6, band);
      } else if (v === 1) {             // cano alto com dobra larga
        boot({ cx0: 8, cx1: 18, top: 3, ankle: 19, toe: 27, sole: 26, soleH: 2.4 });
        poly(g, [[8, 3], [18, 3], [19.6, 8.2], [6.8, 8.2]], lt, GA_OUT, 1);
        for (let i = 0; i < 3; i++) circ(g, 13, 11 + i * 3.4, 1.1, band, GA_OUT, .5);
      } else if (v === 2) {             // bota alada
        boot({ cx0: 9, cx1: 19, top: 10, ankle: 18, toe: 25, sole: 24.4, soleH: 2.6 });
        poly(g, [[9, 11.6], [-.6, 3.4], [4.4, 12.6], [3, 17.4], [9, 17]], lt, GA_OUT, 1);
        g.strokeStyle = shade(lt, -.25); g.lineWidth = .8;
        g.beginPath(); g.moveTo(8.4, 12); g.lineTo(3, 8); g.moveTo(8.4, 14.4); g.lineTo(4, 14.6); g.stroke();
      } else if (v === 3) {             // greva de placas
        boot({ cx0: 8.4, cx1: 18.4, top: 5, ankle: 19, toe: 25, sole: 25.4, soleH: 2.4, heelH: 1.6 });
        for (let i = 0; i < 3; i++) { rrect(g, 8.8, 7 + i * 4.4, 10.4, 2.8, .8, shade(md, -.16 * i), GA_OUT, .8); gaSpark(g, 14, 8.4 + i * 4.4, band); }
      } else if (v === 4) {             // bico longo com espora
        boot({ cx0: 9, cx1: 18, top: 9, ankle: 17, toe: 30, sole: 25, soleH: 2.2, tip: 3.2 });
        poly(g, [[18.4, 12.4], [25, 8.6], [23.6, 15.4]], lt, GA_OUT, .9);
        poly(g, [[30.4, 24], [32.4, 20.4], [32.4, 26.4]], band, GA_OUT, .8);
      } else if (v === 5) {             // gola de pelo
        boot({ cx0: 9, cx1: 19, top: 9, ankle: 18, toe: 25, sole: 25, soleH: 2.6 });
        g.fillStyle = shade(md, -.5); g.fillRect(8.4, 8, 11.2, 2);
        for (let i = 0; i < 6; i++) circ(g, 8.2 + i * 2.2, 6.6 - (i % 2) * 1.4, 2.1, lt, GA_OUT, .7);
      } else if (v === 6) {             // cano com joelheira
        boot({ cx0: 9, cx1: 19, top: 7, ankle: 19, toe: 25, sole: 25.4, soleH: 2.6 });
        poly(g, [[7.6, 6.4], [16, 1.6], [24.4, 6.4], [22.6, 10], [16, 12], [9.4, 10]], shade(md, -.18), GA_OUT, 1.1);
        gaGem(g, 16, 6.6, 2, 4, .2, lt, '#fff');
      } else if (v === 7) {             // sandália de tiras
        boot({ cx0: 9, cx1: 19, top: 13, ankle: 19.4, toe: 25, sole: 24, soleH: 2.8 });
        g.strokeStyle = lt; g.lineWidth = 1.7;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(8.6, 14.6 + i * 2.8); g.lineTo(19.4, 12.8 + i * 2.8); g.stroke(); }
        g.fillStyle = band; g.fillRect(13.2, 20.6, 3.2, 1.6);
      } else if (v === 8) {             // bota de salto: cano fino, bico curto e salto alto
        boot({ cx0: 10.4, cx1: 17.6, top: 7.4, ankle: 16.6, toe: 23.4, sole: 24.2, soleH: 1.8, heelH: 2.8, heelW: 3, tip: 3 });
        // salto em cunha, encostado no calcanhar (não pode virar um graveto solto)
        poly(g, [[8.2, 25.4], [13.4, 25.4], [12.4, 29], [8.8, 29]], shade(md, -.5), GA_OUT, .8);
        g.fillStyle = shade(md, -.68); g.fillRect(8.4, 28.2, 4.2, 1.6);
        gaGem(g, 13.4, 20.6, 2.1, 4, .2, lt, '#fff');
        g.fillStyle = 'rgba(255,255,255,.32)'; g.fillRect(10.8, 8.8, 6.2, 2);
        g.fillStyle = shade(md, -.4); g.fillRect(10, 14.6, 7.4, 1.2);
      } else {                          // bota com cravos na sola
        boot({ cx0: 8.6, cx1: 19, top: 10, ankle: 18, toe: 26, sole: 24.6, soleH: 2.2 });
        for (let i = 0; i < 5; i++) poly(g, [[8.4 + i * 3.8, 27.4], [10 + i * 3.8, 27.4], [9.2 + i * 3.8, 30]], metal, GA_OUT, .6);
        g.fillStyle = shade(md, -.3); g.fillRect(9, 15.6, 9, 1.4);
      }
      break;
    }
    case 'cloak': {
      const hem = seed % 5, collar = seed % 3;
      poly(g, [[16, 3], [25, 9], [29, 29], [3, 29], [7, 9]], md, GA_OUT, 1.2);
      if (collar === 0) poly(g, [[16, 3], [21, 8], [16, 12], [11, 8]], shade(md, -.4), false);
      else if (collar === 1) { poly(g, [[12, 6], [16, 0], [20, 6], [16, 10]], shade(md, -.3), GA_OUT, .9); }
      else { for (const s of [-1, 1]) poly(g, [[16 + s * 3, 7], [16 + s * 6, 1], [16 + s * 7, 8]], lt, GA_OUT, .8); }
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(16, 12, 1.5, 16);
      if (hem === 0) { g.fillStyle = lt; for (let i = 0; i < 5; i++) g.fillRect(5 + i * 5.2, 26, 2.6, 2.6); }
      else if (hem === 1) { poly(g, [[4, 29], [7, 25], [10, 29], [13, 25], [16, 29], [19, 25], [22, 29], [25, 25], [28, 29]], lt, false); }
      else if (hem === 2) { g.strokeStyle = lt; g.lineWidth = 1; g.beginPath(); g.arc(16, 29, 8, PI, TAU); g.stroke(); }
      else if (hem === 3) { for (let i = 0; i < 4; i++) poly(g, [[5 + i * 6, 29], [8 + i * 6, 24], [11 + i * 6, 29]], lt, false); }
      else { g.fillStyle = lt; for (let i = 0; i < 4; i++) circ(g, 6.5 + i * 6.4, 27, 1.3, lt, false); }
      circ(g, 16, 9, 2, band, GA_OUT, .8);
      if (tier >= 4) { g.strokeStyle = shade(md, .4); g.lineWidth = 1.1; g.beginPath(); g.moveTo(9, 14); g.lineTo(9, 24); g.moveTo(23, 14); g.lineTo(23, 24); g.stroke(); }
      break;
    }
    case 'crown': {
      // três coroas bem distintas: tiara de três pontas, coroa de cinco pontas e coroa de torre central
      if (v === 0) {   // tiara em meia-lua maciça, com a gema no vão
        // meia-lua: arco externo cheio menos o interno
        g.beginPath();
        g.arc(16, 21, 12.4, PI * 1.06, PI * 1.94);
        g.arc(16, 24.6, 9.6, PI * 1.94, PI * 1.06, true);
        g.closePath();
        g.fillStyle = gold; g.fill();
        g.strokeStyle = GA_OUT; g.lineWidth = 1.2; g.stroke();
        // brilho na borda de cima
        g.strokeStyle = lt; g.lineWidth = 1.2;
        g.beginPath(); g.arc(16, 21, 11.6, PI * 1.14, PI * 1.86); g.stroke();
        // pontas da meia-lua
        for (const s2 of [-1, 1]) circ(g, 16 + s2 * 11.8, 21.4, 1.7, gold, GA_OUT, .6);
        // pingente em V preso nas duas pontas do arco
        g.strokeStyle = GA_OUT; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(7.6, 17.4); g.lineTo(16, 22.6); g.lineTo(24.4, 17.4); g.stroke();
        g.strokeStyle = gold; g.lineWidth = 1;
        g.beginPath(); g.moveTo(7.6, 17.4); g.lineTo(16, 22.6); g.lineTo(24.4, 17.4); g.stroke();
        for (let i = 0; i < 3; i++) { const t = .22 + i * .28; circ(g, 7.6 + 8.4 * t, 17.4 + 5.2 * t, .8, goldD, false); circ(g, 24.4 - 8.4 * t, 17.4 + 5.2 * t, .8, goldD, false); }
        circ(g, 16, 27, 4.4, gold, GA_OUT, 1.1);
        circ(g, 16, 27, 3.2, goldD, false);
        gaGem(g, 16, 27, 2.5, gemN, .2, md, '#fff');
        gaSpark(g, 16, 9.4, '#fff');
      } else if (v === 1) {   // cinco pontas
        poly(g, [[2, 24], [4.6, 12], [8.2, 17], [11.6, 6], [16, 16], [20.4, 6], [23.8, 17], [27.4, 12], [30, 24]], gold, GA_OUT, 1.3);
        g.fillStyle = goldD; g.fillRect(2, 21.6, 28, 2.6);
        for (const [x, y] of [[4.6, 12], [11.6, 6], [20.4, 6], [27.4, 12]]) gaGem(g, x, y, 1.3, 4, .2, lt, '#fff');
        for (let i = 0; i < 4; i++) circ(g, 6.4 + i * 6.4, 23, 1.3, md, GA_OUT, .5);
        g.strokeStyle = lt; g.lineWidth = 1; g.beginPath(); g.arc(16, 15, 10, PI * 1.15, PI * 1.85); g.stroke();
      } else {                // coroa de muralha: ameias no topo e torre central
        // corpo
        poly(g, [[3.4, 25], [3.4, 14], [28.6, 14], [28.6, 25]], gold, GA_OUT, 1.3);
        // ameias (merlons)
        for (const x of [3.4, 8.2, 21.6, 26.4]) poly(g, [[x, 14], [x, 8.6], [x + 3.4, 8.6], [x + 3.4, 14]], gold, GA_OUT, 1.1);
        // torre central mais alta
        poly(g, [[12, 14], [12, 4], [20, 4], [20, 14]], gold, GA_OUT, 1.2);
        poly(g, [[11.2, 4], [16, 0.4], [20.8, 4]], gold, GA_OUT, 1.1);
        gaGem(g, 16, 8, 2.1, gemN, .2, md, '#fff');
        // porta e faixa
        g.fillStyle = shade(gold, -.45); g.fillRect(13.4, 18.6, 5.2, 6.4);
        g.beginPath(); g.arc(16, 18.6, 2.6, PI, TAU); g.fill();
        g.fillStyle = goldD; g.fillRect(3.4, 22.6, 25.2, 2.4);
        for (const x of [8.4, 23.6]) circ(g, x, 20, 1.4, lt, GA_OUT, .5);
      }
      break;
    }
    case 'bellows': {
      poly(g, [[4, 12], [20, 8], [22, 22], [6, 26]], '#8a5c2c', GA_OUT, 1.2);
      g.fillStyle = '#6b4420'; for (let i = 0; i < 3; i++) g.fillRect(6 + i, 11 + i, 14, 1.6);
      g.fillStyle = metal; g.fillRect(21, 13, 6, 4);
      poly(g, [[25, 13], [31, 10], [31, 20], [25, 18]], md, GA_OUT, 1);
      poly(g, [[27, 14], [31, 12], [31, 18], [27, 17]], lt, false);
      gaSpark(g, 28, 13, '#fff');
      break;
    }
    case 'fin': {
      poly(g, [[16, 3], [26, 16], [16, 24], [7, 16]], md, GA_OUT, 1.2);
      poly(g, [[16, 3], [26, 16], [16, 24]], shade(md, -.35), false);
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.1;
      const rays = 3 + (seed % 3);
      for (let i = 1; i < rays; i++) { g.beginPath(); g.moveTo(16, 4 + i * (20 / rays)); g.lineTo(16 + i * 2.2, 12 + i * 3.6); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(14, 7, 1.6, 5);
      break;
    }
    case 'bubble': {
      g.beginPath(); g.arc(16, 16, 11, 0, TAU); g.fillStyle = 'rgba(160,225,255,.42)'; g.fill();
      g.strokeStyle = md; g.lineWidth = 2; g.beginPath(); g.arc(16, 16, 11, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.6; g.beginPath(); g.arc(12.5, 11.5, 4, 2.4, 4.4); g.stroke();
      const inner = 2 + (seed % 3);
      for (let i = 0; i < inner; i++) { const a = i / inner * TAU + .5; circ(g, 16 + Math.cos(a) * 5, 17 + Math.sin(a) * 5, 1.6, 'rgba(255,255,255,.7)', false); }
      break;
    }
    case 'hourglass': {
      g.fillStyle = '#b07a40'; g.fillRect(8, 3, 16, 3); g.fillRect(8, 26, 16, 3);
      g.fillStyle = '#8a5a2a'; g.fillRect(9, 6, 2, 20); g.fillRect(21, 6, 2, 20);
      poly(g, [[11, 6], [21, 6], [16, 15]], md, GA_OUT, .9); poly(g, [[11, 26], [21, 26], [16, 17]], md, GA_OUT, .9);
      g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(15, 14, 1.8, 4);
      gaSpark(g, 16, 20, lt);
      break;
    }
    case 'heart': {
      g.beginPath(); g.moveTo(16, 28); g.bezierCurveTo(1, 17, 5, 3, 16, 10); g.bezierCurveTo(27, 3, 31, 17, 16, 28); g.closePath();
      g.fillStyle = md; g.fill(); g.strokeStyle = GA_OUT; g.lineWidth = 1.4; g.stroke();
      g.strokeStyle = shade(md, -.45); g.lineWidth = 1.1; g.beginPath(); g.moveTo(16, 12); g.lineTo(13, 18); g.moveTo(16, 12); g.lineTo(20, 17); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(12, 13.5, 2.4, 3.4, -.5, 0, TAU); g.fill();
      break;
    }
    case 'shield': {
      poly(g, [[5, 5], [27, 5], [27, 17], [16, 29], [5, 17]], md, GA_OUT, 1.2);
      poly(g, [[16, 5], [27, 5], [27, 17], [16, 29]], shade(md, -.3), false);
      g.strokeStyle = shade(md, .4); g.lineWidth = 1.2; poly(g, [[7, 7], [25, 7], [25, 16.5], [16, 26], [7, 16.5]], null, false);
      const kn = 2 + (seed % 3); for (let i = 0; i < kn; i++) gaSpark(g, 9 + i * 6, 9, band);
      poly(g, [[16, 11], [20, 16], [16, 22], [12, 16]], lt, GA_OUT, .9);
      break;
    }
    default: {   // 'void' — orbe do vazio
      circ(g, 16, 16, 10, '#14121c', GA_OUT, 1.6);
      g.strokeStyle = md; g.lineWidth = 1.6; g.beginPath(); g.ellipse(16, 16, 13.5, 5.2, .5, 0, TAU); g.stroke();
      g.beginPath(); g.ellipse(16, 16, 13.5, 5.2, -.9, 0, TAU); g.stroke();
      gaGem(g, 16, 16, 3.2, gemN, .3, md, lt);
      for (let i = 0; i < 3 + (seed % 2); i++) { const a = i / 4 * TAU; gaSpark(g, 16 + Math.cos(a) * 9.5, 16 + Math.sin(a) * 6.5, lt); }
      break;
    }
  }
  gaEdgeMarks(g, seed, shade(col, .55));
}

// ---------------- PICARETAS ----------------
function drawPickArt(g, col, tier, seed) {
  col = gaLift(col);
  const md = col, lt = shade(col, .45), dk = shade(col, -.4);
  g.save(); g.translate(16, 16); g.rotate(.78);
  g.fillStyle = '#7a4e2a'; g.fillRect(-1.7, -8.5, 3.4, 20);   // cabo
  g.fillStyle = '#9a6a3a'; g.fillRect(-1.7, -8.5, 1.3, 20);
  // cabeça: forma muda com o tier (cada picareta tem a sua)
  const head = (tier - 6) % 5;
  g.beginPath();
  if (head === 0) { g.moveTo(-13, -4); g.bezierCurveTo(-7, -13, 7, -13, 13, -4); g.lineTo(11, -2); g.bezierCurveTo(6, -8, -6, -8, -11, -2); }
  else if (head === 1) { g.moveTo(-14, -2); g.lineTo(-9, -11); g.lineTo(-3, -5); g.lineTo(0, -13); g.lineTo(3, -5); g.lineTo(9, -11); g.lineTo(14, -2); g.lineTo(11, 0); g.lineTo(-11, 0); }
  else if (head === 2) { g.moveTo(-13, -1); g.lineTo(-10, -9); g.lineTo(-4, -4); g.lineTo(4, -4); g.lineTo(10, -9); g.lineTo(13, -1); g.lineTo(0, 2); }
  else if (head === 3) { g.moveTo(-15, -3); g.lineTo(-8, -12); g.lineTo(-2, -3); g.lineTo(0, -14); g.lineTo(2, -3); g.lineTo(8, -12); g.lineTo(15, -3); g.lineTo(0, 3); }
  else { g.moveTo(-12, -3); g.lineTo(-6, -12); g.lineTo(0, -6); g.lineTo(6, -12); g.lineTo(12, -3); g.lineTo(0, 4); }
  g.closePath(); g.fillStyle = md; g.fill(); g.strokeStyle = GA_OUT; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = lt; g.fillRect(-6, -9, 5, 2);
  if (tier >= 8) { g.fillStyle = '#fff'; g.fillRect(-1, -6, 2, 2); }
  g.restore();
  // gema do cabo (assinatura da picareta)
  gaGem(g, 24, 25, 2.6, 3 + (seed % 4), .4, md, lt);
  if (tier >= 9) {   // aura: dois riscos paralelos à cabeça, como se a lâmina cortasse o ar
    g.strokeStyle = lt; g.lineWidth = 1;
    for (const dy of [0, 3.2]) {
      g.beginPath(); g.arc(16, 16, 12.4 + dy * .8, -.95, -.35); g.stroke();
      g.beginPath(); g.arc(16, 16, 12.4 + dy * .8, -.05, .55); g.stroke();
    }
    gaSpark(g, 27.6, 7.6, '#fff');
  }
}
