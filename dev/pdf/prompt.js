'use strict';
// Gera docs/chicotes_do_destino_prompt.pdf — o prompt completo "Chicotes do Destino":
// capa desenhada no canvas, sumário e 11 partes (identidade, as 7 mecânicas, stack,
// conteúdo, tiers, curva de dano, nomes, chefes, conquistas, interface e aceite).
// Uso:  node dev/pdf/prompt.js          (a partir da raiz do repositório)
// Dependências: as mesmas de dev/pdf (npm install dentro de dev/pdf).
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const D = '/usr/share/fonts/truetype/dejavu/';
GlobalFonts.registerFromPath(D + 'DejaVuSans.ttf', 'DejaVu');
GlobalFonts.registerFromPath(D + 'DejaVuSans-Bold.ttf', 'DejaVuBold');
GlobalFonts.registerFromPath(D + 'DejaVuSansMono.ttf', 'DejaVuMono');

const OUT = path.join(__dirname, '..', '..', 'docs', 'chicotes_do_destino_prompt.pdf');
const W = 595.28, H = 841.89, M = 56, CW = W - 2 * M;

const C = {
  navy: '#0f1b3a', navy2: '#16244a', ink: '#111827', body: '#334155', muted: '#64748b',
  gold: '#f0b429', goldL: '#ffd447', line: '#e2e8f2', soft: '#f4f7fd', white: '#ffffff',
  monoBg: '#0f172a',
};

// ---------------------------------------------------------------- capa (canvas)
const F5 = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
};

function pixelWidth(text, s) { return (text.length * 6 - 1) * s; }

function pixelText(ctx, text, cx, y, s, fill, outline, shadow) {
  const x0 = cx - pixelWidth(text, s) / 2;
  const o = Math.max(2, Math.round(s * 0.16));
  const cells = [];
  for (let i = 0; i < text.length; i++) {
    const g = F5[text[i]] || F5[' '];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      if (g[r][c] === '1') cells.push([x0 + (i * 6 + c) * s, y + r * s]);
    }
  }
  // sombra deslocada
  ctx.fillStyle = shadow;
  for (const [x, yy] of cells) ctx.fillRect(x - o - 2, yy - o + s * 0.65, s + 2 * o + 4, s + 2 * o + 4);
  // contorno
  ctx.fillStyle = outline;
  for (const [x, yy] of cells) ctx.fillRect(x - o, yy - o, s + 2 * o, s + 2 * o);
  // preenchimento com gradiente vertical
  const g = ctx.createLinearGradient(0, y, 0, y + 7 * s);
  g.addColorStop(0, '#fff6cc');
  g.addColorStop(0.42, '#ffd447');
  g.addColorStop(0.72, '#f5b418');
  g.addColorStop(1, '#d98a00');
  ctx.fillStyle = g;
  for (const [x, yy] of cells) ctx.fillRect(x, yy, s, s);
}

function spark(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const L = i % 2 ? r * 0.55 : r;
    ctx.lineWidth = i % 2 ? 3 : 5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
    ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
    ctx.stroke();
  }
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

const TIER_COVER = ['#10b981', '#0284c7', '#7c3aed', '#d97706', '#dc2626',
  '#4f46e5', '#eab308', '#db2777', '#06b6d4', '#f8fafc'];

function drawCover() {
  const cw = 1240, ch = 1754;
  const cv = createCanvas(cw, ch);
  const ctx = cv.getContext('2d');

  // fundo
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, '#0b1330');
  g.addColorStop(0.55, '#0a1026');
  g.addColorStop(1, '#05070f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);

  // brilho central
  const rg = ctx.createRadialGradient(cw / 2, 330, 40, cw / 2, 330, 760);
  rg.addColorStop(0, 'rgba(58,86,168,0.55)');
  rg.addColorStop(1, 'rgba(10,16,38,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, cw, ch);

  // estrelas
  let seed = 1337;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 280; i++) {
    const x = rnd() * cw, y = rnd() * ch * 0.92, r = rnd() * 2.2 + 0.4, a = 0.15 + rnd() * 0.75;
    ctx.fillStyle = `rgba(214,228,255,${a})`;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(r)), Math.max(1, Math.round(r)));
  }

  // kicker
  ctx.fillStyle = '#93a4cf';
  ctx.font = 'bold 30px DejaVu';
  ctx.textAlign = 'center';
  let kicker = '';
  for (const ch2 of 'PROMPT DE RECRIAÇÃO') kicker += ch2 + ' ';
  ctx.fillText(kicker.trim(), cw / 2, 150);

  // título pixel
  pixelText(ctx, 'CHICOTES', cw / 2, 196, 17, null, '#05070f', 'rgba(0,0,0,0.55)');
  pixelText(ctx, 'DO DESTINO', cw / 2, 350, 16, null, '#05070f', 'rgba(0,0,0,0.55)');

  // subtítulo
  ctx.fillStyle = '#c7d6f5';
  ctx.font = '34px DejaVu';
  ctx.fillText('O jogo de 200 espadas, reescrito', cw / 2, 512);
  ctx.fillText('para 200 chicotes em 10 tiers', cw / 2, 556);

  // régua
  ctx.fillStyle = 'rgba(240,180,41,0.85)';
  ctx.fillRect(cw / 2 - 210, 596, 420, 3);

  // chicote
  ctx.save();
  ctx.lineCap = 'round';
  const wg = ctx.createLinearGradient(110, 0, 1130, 0);
  wg.addColorStop(0, '#b46a12'); wg.addColorStop(0.35, '#f0b429');
  wg.addColorStop(0.7, '#ffd447'); wg.addColorStop(1, '#f7e2a1');

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(112, 760);
    ctx.bezierCurveTo(300, 690, 470, 800, 640, 742);
    ctx.bezierCurveTo(810, 684, 900, 620, 1000, 660);
    ctx.bezierCurveTo(1074, 690, 1092, 640, 1042, 604);
  };
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 26; path(); ctx.stroke();
  ctx.strokeStyle = wg; ctx.lineWidth = 17; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,247,214,0.75)'; ctx.lineWidth = 5;
  ctx.save(); ctx.translate(-3, -4); path(); ctx.stroke(); ctx.restore();
  // cabo
  ctx.strokeStyle = '#2b1a0a'; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.moveTo(96, 766); ctx.lineTo(150, 748); ctx.stroke();
  ctx.strokeStyle = '#8a5a22'; ctx.lineWidth = 26;
  ctx.beginPath(); ctx.moveTo(100, 764); ctx.lineTo(148, 749); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = '#f0b429'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(104 + i * 11, 770 - i * 4); ctx.lineTo(110 + i * 11, 754 - i * 3); ctx.stroke();
  }
  ctx.restore();

  // estalo
  spark(ctx, 1042, 604, 46, 'rgba(255,228,138,0.95)');
  spark(ctx, 1042, 604, 20, 'rgba(255,255,255,0.95)');

  // faixa dos 10 tiers
  const n = 10, gap = 8, cellw = 78, total = n * cellw + (n - 1) * gap;
  let x = (cw - total) / 2;
  ctx.fillStyle = '#8fa2cc'; ctx.font = 'bold 26px DejaVu';
  ctx.fillText('10 TIERS  ·  20 CHICOTES CADA', cw / 2, 900);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = TIER_COVER[i];
    ctx.fillRect(x, 930, cellw, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, 946, cellw, 4);
    ctx.fillStyle = '#93a4cf'; ctx.font = 'bold 24px DejaVu';
    ctx.fillText(String(i + 1), x + cellw / 2, 992);
    x += cellw + gap;
  }

  // selo
  const sy = 1178;
  ctx.strokeStyle = 'rgba(240,180,41,0.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cw / 2, sy, 104, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(240,180,41,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cw / 2, sy, 114, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffd447'; ctx.font = 'bold 84px DejaVu';
  ctx.fillText('200', cw / 2, sy + 6);
  ctx.fillStyle = '#c7d6f5'; ctx.font = 'bold 22px DejaVu';
  ctx.fillText('C H I C O T E S', cw / 2, sy + 44);
  ctx.fillStyle = '#8fa2cc'; ctx.font = '22px DejaVu';
  ctx.fillText('10 tiers  ·  7 mecânicas', cw / 2, sy + 140);

  // números
  const stats = [['94', 'chefes'], ['429', 'conquistas'], ['628', 'itens']];
  const bw = 250, bgap = 36, btotal = stats.length * bw + (stats.length - 1) * bgap;
  let bx = (cw - btotal) / 2;
  for (const [num, lbl] of stats) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.strokeStyle = 'rgba(147,164,207,0.30)'; ctx.lineWidth = 1.5;
    const r = 14, by = 1340, bh = 118;
    ctx.beginPath();
    ctx.moveTo(bx + r, by); ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r); ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd447'; ctx.font = 'bold 44px DejaVu';
    ctx.fillText(num, bx + bw / 2, by + 62);
    ctx.fillStyle = '#9fb0d8'; ctx.font = '24px DejaVu';
    ctx.fillText(lbl, bx + bw / 2, by + 96);
    bx += bw + bgap;
  }

  // rodapé
  ctx.fillStyle = '#f0b429';
  ctx.fillRect(cw / 2 - 120, 1540, 240, 2);
  ctx.fillStyle = '#dfe8ff'; ctx.font = 'bold 28px DejaVu';
  ctx.fillText('JHON MAKLAYN MOZER DOS SANTO', cw / 2, 1596);
  ctx.fillStyle = '#7d8db4'; ctx.font = '22px DejaVu';
  ctx.fillText('chicotes do destino  ·  documento de especificação', cw / 2, 1634);

  // moldura
  ctx.strokeStyle = 'rgba(240,180,41,0.5)'; ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, cw - 68, ch - 68);
  ctx.strokeStyle = 'rgba(240,180,41,0.18)'; ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, cw - 92, ch - 92);

  return cv.toBuffer('image/png');
}

// ---------------------------------------------------------------- helpers
let pageNo = 0, TOTAL = 0;

function header(doc, part, title, sub) {
  doc.fillColor('#7b8bb0').font('bold').fontSize(8).text('CHICOTES DO DESTINO', M, 24, { characterSpacing: 1.1 });
  doc.fillColor('#9aa8c4').font('reg').fontSize(8).text('Prompt e especificação do jogo', M, 24, { width: CW, align: 'right' });

  doc.rect(0, 46, W, 104).fill(C.navy);
  doc.rect(0, 150, W, 5).fill(C.gold);

  doc.fillColor('#93a4cf').font('bold').fontSize(8.5)
    .text(part.toUpperCase(), M, 66, { characterSpacing: 2 });
  doc.fillColor(C.white).font('bold').fontSize(23).text(title, M, 84, { width: CW });
  doc.fillColor('#b9c8ea').font('reg').fontSize(10).text(sub, M, 122, { width: CW });
}

const bodyEnds = [];
function footer(doc) {
  bodyEnds.push(Math.round(doc.y));
  pageNo++;
  doc.moveTo(M, H - 46).lineTo(W - M, H - 46).lineWidth(0.7).strokeColor('#e6ecf7').stroke();
  doc.fillColor('#94a3b8').font('reg').fontSize(7.6).text('Jhon Maklayn Mozer dos Santo', M, H - 38, { width: CW / 2 });
  doc.fillColor('#94a3b8').font('reg').fontSize(7.6).text(`Página ${pageNo} de ${TOTAL}`, M, H - 38, { width: CW, align: 'right' });
}

function h2(doc, text, y, color = C.navy) {
  doc.fillColor(color).font('bold').fontSize(11.5).text(text, M, y, { width: CW, characterSpacing: 0.2 });
  return doc.y + 4;
}

function para(doc, text, y, opts = {}) {
  doc.fillColor(opts.color || C.body).font('reg').fontSize(opts.size || 9.9)
    .text(text, M, y, { width: CW, lineGap: opts.lineGap === undefined ? 3.4 : opts.lineGap });
  return doc.y;
}

function bullets(doc, items, y, opts = {}) {
  const size = opts.size || 9.9;
  let yy = y;
  for (const it of items) {
    const bold = typeof it === 'object' ? it.b : null;
    const text = typeof it === 'object' ? it.t : it;
    doc.rect(M + 1, yy + 4.2, 3.6, 3.6).fill(C.gold);
    if (bold) {
      doc.fillColor(C.ink).font('bold').fontSize(size).text(bold + ' ', M + 12, yy, { width: CW - 12, continued: true, lineGap: 3 });
      doc.fillColor(C.body).font('reg').text(text, { width: CW - 12, lineGap: 3 });
    } else {
      doc.fillColor(C.body).font('reg').fontSize(size).text(text, M + 12, yy, { width: CW - 12, lineGap: 3 });
    }
    yy = doc.y + 5.6;
  }
  return yy;
}

function callout(doc, title, text, y, accent = C.gold) {
  const pad = 12, tw = CW - 2 * pad - 4;
  const hT = doc.font('bold').fontSize(9.8).heightOfString(title, { width: tw });
  const hB = doc.font('reg').fontSize(9.2).heightOfString(text, { width: tw, lineGap: 2.6 });
  const h = hT + hB + pad * 2 + 4;
  doc.roundedRect(M, y, CW, h, 6).fill(C.soft);
  doc.rect(M, y, 4, h).fill(accent);
  doc.fillColor(C.navy).font('bold').fontSize(9.8).text(title, M + pad + 4, y + pad, { width: tw });
  doc.fillColor(C.body).font('reg').fontSize(9.2).text(text, M + pad + 4, y + pad + hT + 4, { width: tw, lineGap: 2.6 });
  return y + h;
}

function table(doc, { x = M, y, cols, rows, head, zebra = true, size = 8.6, pad = 5, rowPad = 5.4 }) {
  const total = cols.reduce((a, c) => a + c.w, 0);
  let yy = y;
  // cabeçalho
  doc.rect(x, yy, total, 21).fill(C.navy);
  let cx = x;
  for (let i = 0; i < cols.length; i++) {
    doc.fillColor('#dbe6ff').font('bold').fontSize(7.9)
      .text(head[i], cx + pad, yy + 7, { width: cols[i].w - pad * 2, align: cols[i].align || 'left', characterSpacing: 0.5 });
    cx += cols[i].w;
  }
  yy += 21;
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r];
    let h = 0;
    for (let i = 0; i < cols.length; i++) {
      const txt = String(cells[i] == null ? '' : cells[i]);
      const need = doc.font(i === 0 ? 'bold' : 'reg').fontSize(size)
        .heightOfString(txt, { width: cols[i].w - pad * 2 - (cells._swatch && i === 1 ? 14 : 0) }) + rowPad * 2;
      h = Math.max(h, need);
    }
    h = Math.max(h, 20);
    if (zebra && r % 2 === 1) doc.rect(x, yy, total, h).fill('#f7f9fe');
    doc.moveTo(x, yy + h).lineTo(x + total, yy + h).lineWidth(0.6).strokeColor('#e6ecf7').stroke();
    cx = x;
    for (let i = 0; i < cols.length; i++) {
      const txt = String(cells[i] == null ? '' : cells[i]);
      let tx = cx + pad;
      if (cells._swatch && i === 1) {
        doc.roundedRect(cx + pad, yy + rowPad + 1.4, 7, 7, 1.5).fill(cells._swatch);
        tx += 13;
      }
      doc.fillColor(i === 0 ? C.ink : C.body).font(i === 0 ? 'bold' : 'reg').fontSize(size)
        .text(txt, tx, yy + rowPad, { width: cols[i].w - pad * 2 - (cells._swatch && i === 1 ? 13 : 0), align: cols[i].align || 'left', lineGap: 1.6 });
      cx += cols[i].w;
    }
    yy += h;
  }
  return yy;
}

function codeBlock(doc, text, y, size = 8.4) {
  const pad = 12;
  const h = doc.font('mono').fontSize(size).heightOfString(text, { width: CW - pad * 2, lineGap: 2.6 }) + pad * 2;
  doc.roundedRect(M, y, CW, h, 7).fill(C.monoBg);
  doc.rect(M, y, 4, h).fill(C.gold);
  doc.fillColor('#e6edf9').font('mono').fontSize(size).text(text, M + pad, y + pad, { width: CW - pad * 2, lineGap: 2.6 });
  return y + h;
}

// ---------------------------------------------------------------- conteúdo
const TIERS = [
  [1, 'Básico', '#10b981', '1,0 – 1,2×', 'Couro trançado; golpe físico direto, sangramento leve, iluminação.'],
  [2, 'Pré-Chefes', '#0284c7', '1,3 – 1,8×', 'Cordas com nós e lâminas na ponta; repulsão, fogo e gelo.'],
  [3, 'Mid-Game', '#7c3aed', '2,0 – 2,8×', 'Correntes; múltiplos estalos, feixes elementais, acerto contínuo.'],
  [4, 'Hardmode Inicial', '#d97706', '3,0 – 4,2×', 'Cravos de osso; onda de choque no relevo, estalagmites, aura.'],
  [5, 'Hardmode Avançado', '#dc2626', '4,5 – 6,5×', 'Primeiro par de chicotes; meteoros, lasers perfurantes, tempo.'],
  [6, 'End-Game Mítico', '#4f46e5', '7,0 – 12×', 'Fios rúnicos; projéteis rastreadores, colapso estelar, portais.'],
  [7, 'Forja Estelar', '#eab308', '14 – 22×', 'Ecos do golpe, leques de lâminas, correntes elétricas, escudos vivos.'],
  [8, 'Relicário do Vazio', '#db2777', '22 – 32×', 'Marcas que detonam, fendas devoradoras, almas perseguidoras.'],
  [9, 'Eco Primordial', '#06b6d4', '33 – 46×', 'Domínios divinos, feixes de julgamento, paradas no tempo.'],
  [10, 'Origem', '#f8fafc', '46 – 72×', 'Tela cheia, colapsos cósmicos, singularidades e big bang.'],
];

function capa(doc) {
  doc.image(drawCover(), 0, 0, { width: W, height: H });
  pageNo++;
}

function sumario(doc) {
  header(doc, 'Sumário', 'O que tem em cada parte', 'Onze partes — da identidade ao prompt curto que você cola na ferramenta.');
  let y = 186;
  y = para(doc, 'Este documento é a especificação completa de "Chicotes do Destino": o mesmo jogo de 200 espadas, com a arma central trocada por 200 chicotes. Use a tabela para ir direto à parte que interessa — ou leia na ordem, que é a ordem de implementação.', y);
  y += 16;

  const rows = [
    ['1', 'Identidade', 'O que muda, o que fica e a frase-guia de toda decisão.', 3],
    ['2', 'Regra de ouro', 'Os 7 comportamentos obrigatórios do chicote, com teste.', 4],
    ['3', 'Stack', 'Arquitetura, arquivo único, save, áudio, servidor.', 5],
    ['4', 'Conteúdo', 'Os números fechados: 200, 94, 433, 628 e 429.', 6],
    ['5', 'Os 10 tiers', 'Cor, multiplicador e mecânica de cada tier.', 7],
    ['6', 'Curva de dano', 'A fórmula, o alcance e os alvos de cada tier.', 8],
    ['7', 'Nomes', 'A nomenclatura dos 200 chicotes e o último deles.', 9],
    ['8', 'Chefes', '4 + 90 em 6 atos; drops do fim do jogo; Apoteose.', 10],
    ['9', 'Conquistas', '429 em 10 categorias; os 12 segredos com ???', 11],
    ['10', 'Interface', 'HUD, menus, controles e acessibilidade.', 12],
    ['11', 'Aceite', 'Critérios de aceite e o prompt curto para colar.', 13],
  ];
  y = table(doc, {
    y, cols: [{ w: 34, align: 'center' }, { w: 104 }, { w: 300 }, { w: 45, align: 'center' }],
    head: ['#', 'Parte', 'O que traz', 'Pág.'],
    rows, size: 8.8,
  });
  y += 18;

  y = callout(doc, 'Como usar',
    'Três caminhos: (1) cole o prompt curto da página 13 numa ferramenta de IA e depois corrija pelos critérios de aceite; (2) peça a implementação parte por parte, seguindo as seções 1 a 9; (3) use só a seção 11 como checklist de revisão de um jogo que já existe.', y);
  y += 14;
  y = callout(doc, 'A regra que resolve as dúvidas',
    'Tudo o que existe hoje continua igual. O chicote não substitui a picareta, nem a construção, nem os chefes — ele substitui a espada, e só ela.', y, C.navy);
  footer(doc);
}

function parte1(doc) {
  header(doc, 'Parte 1', 'Identidade', 'O que é o jogo, o que muda de fato e o que não pode mudar.');
  let y = 186;
  y = para(doc, 'Chicotes do Destino é o jogo "Espadas Do Destino" recriado com uma única troca estrutural: a arma. Onde havia 200 espadas, há 200 chicotes. O resto — mundo, mineração, construção, crafting, chefes, conquistas, música, interface — permanece exatamente como está.', y);
  y += 12;

  y = h2(doc, 'O que muda', y);
  y = bullets(doc, [
    { b: 'A arma:', t: '200 chicotes em 10 tiers, 20 por tier, cada um com nome, atributos, arte e receita próprios.' },
    { b: 'A física do golpe:', t: 'a corda é um corpo flexível que estala; o dano cresce do cabo até a ponta.' },
    { b: 'O alcance:', t: '2 a 3 vezes o de uma espada — o chicote é a arma mais longa do jogo.' },
    { b: 'A arte:', t: 'cabo, corda, nós, pontas e correntes — nada de lâmina. A silhueta é a assinatura do tier.' },
    { b: 'A nomenclatura:', t: 'nomes em português que descrevem a corda (Trançado, Cravado, Serrilhado, Gêmeo…), sem repetir.' },
  ], y + 8);
  y += 10;

  y = h2(doc, 'O que não muda', y);
  y = para(doc, 'Mundo de 1400×480 blocos com semente única, 94 chefes (4 clássicos + 90 novos), 429 conquistas, 628 itens, 433 receitas, 50 minérios, 50 armaduras, 50 acessórios, 5 picaretas, 10 famílias de equipamento, save em IndexedDB, exportar/importar mapa, teclado, mouse, controle e toque. Se alguma dessas coisas mudar, a recriação está errada.', y + 6);
  y += 16;

  y = callout(doc, 'Frase-guia (a régua de toda decisão)',
    '"Se funciona com espada, funciona com chicote — mas o chicote alcança mais longe, acerta mais de um inimigo e não corta: ele estala." Quando houver dúvida sobre qualquer detalhe, decida por essa frase.', y);
  y += 16;

  y = h2(doc, 'Tom e público', y);
  y = para(doc, 'Pixel-art no estilo Terraria mobile, 60 fps, texto em português do Brasil, sem ironia e sem texto de tutorial na tela: tudo o que o jogador precisa saber aparece na interface ou nos balões dos NPCs.', y + 6);
  footer(doc);
}

function parte2(doc) {
  header(doc, 'Parte 2', 'Regra de ouro: as 7 mecânicas', 'Se um chicote não cumpre as sete, ele não entra no jogo.');
  let y = 178;
  y = para(doc, 'Estes sete comportamentos são obrigatórios em todos os 200 chicotes. O que muda de tier para tier é a intensidade — nunca a existência.', y);
  y += 10;

  y = table(doc, {
    y, cols: [{ w: 22, align: 'center' }, { w: 118 }, { w: 241 }, { w: 102 }],
    head: ['#', 'Comportamento', 'Especificação', 'Como testar'],
    size: 8.2,
    rows: [
      ['1', 'Alcance 2–3×', 'Corda de 3,2 blocos (T1) a 4,2 (T10); a espada ia de 1,4 a 2,0. Hitbox em cápsula que acompanha a curva.', 'Fique na borda de um penhasco e acerte o inimigo do outro lado.'],
      ['2', 'Dano até a ponta', 'Multiplicador 0,6× no cabo → 1,6× na ponta; o último 10% (o estalo) multiplica por mais 1,6 (2,56×).', 'Bata de longe e de perto no mesmo slime; o número na tela muda.'],
      ['3', 'Vários em linha', '3 alvos no T1, 8 no T10 (3 + tier/2, arredondado para baixo); −15% de dano por alvo extra.', 'Acerte uma fila de 4 morcegos com um golpe só.'],
      ['4', 'Giro de 360°', 'Segurar 0,45 s carrega; soltar gira a corda em volta do corpo por 1,2 s, com dano radial e empurrão.', 'Cerque-se de 5 slimes e gire: todos saem voando.'],
      ['5', 'Gancho', 'A ponta agarra blocos (1 tipo por tier), puxa o jogador na direção do ponto e recolhe drops do chão.', 'Agarre um teto e atravesse um vão sem construir ponte.'],
      ['6', 'Par a partir do T5', 'Do Tier 5 em diante vem em par: o segundo chicote golpeia alternado, com 70% do dano e o mesmo alcance.', 'No T5, um clique deve produzir dois estalos visíveis.'],
      ['7', 'Corda viva', 'Cadeia de 12 a 24 segmentos com física (catenária): a corda chicoteia o cenário, e o estalo tem som, faísca e tremor curto de tela.', 'Encoste a corda na parede e veja o desenho acompanhar a curva.'],
    ],
  });
  y += 16;
  y = callout(doc, 'O que o chicote não faz',
    'Não minera (a picareta continua sendo a ferramenta de mineração), não bloqueia projéteis como um escudo e não substitui a construção. O gancho dá mobilidade, não escava.', y);
  y += 12;
  y = callout(doc, 'Ordem de implementação das mecânicas',
    'Alcance e curva de dano primeiro (são a base do combate), depois multi-alvo, corda viva e som; o giro de 360° e o gancho por último, porque dependem da corda já estar estável.', y, C.navy);
  footer(doc);
}

function parte3(doc) {
  header(doc, 'Parte 3', 'Stack e restrições técnicas', 'As mesmas do original — nada de dependências novas.');
  let y = 196;
  y = bullets(doc, [
    { b: 'Um único index.html', t: 'gerado por node build.js a partir de src/*.js (51 módulos concatenados). Sem dependências em tempo de execução.' },
    { b: 'Canvas 2D', t: 'resolução baixa com zoom inteiro (pixels quadrados), alvo de 60 fps, câmera com tremor só no estalo.' },
    { b: 'Mundo fixo', t: '1400×480 blocos de 16 px, com uma semente única por mundo — dois mundos nunca são iguais.' },
    { b: 'Save', t: 'IndexedDB com autosave e miniaturas; LocalStorage para perfil e conquistas; Exportar e Importar mapa em arquivo.' },
    { b: 'Entrada', t: 'teclado e mouse, gamepad com mira analógica e cursor virtual nos painéis, toque com direcional e mira por arrasto.' },
    { b: 'Áudio', t: 'música em MP3 na pasta docs em loop, mais efeitos sintetizados em WebAudio; botão de som no menu e na pausa.' },
    { b: 'Servidor local', t: 'serve.js com MIME de PDF e MP3 e suporte a Range (o áudio precisa da resposta 206).' },
    { b: 'Publicação', t: 'GitHub Pages servindo a raiz do repositório; o site já está em jk-jhon1.github.io/101spas.' },
  ], y);
  y += 12;
  y = h2(doc, 'Regras de código', y);
  y = bullets(doc, [
    'Nada de framework nem de CDN: o jogo tem de rodar offline, aberto como arquivo.',
    'Os dados (chicotes, chefes, equipamentos, receitas) ficam em tabelas simples, exportáveis para JSON e CSV.',
    'Cada sistema em seu módulo, com prefixo numérico indicando a ordem de concatenação.',
    'Nenhuma arte importada: todo sprite é desenhado por código, com semente, para não repetir silhueta.',
  ], y + 6);
  y += 14;
  y = callout(doc, 'Critério técnico de aceite',
    'O build tem de continuar sendo um único arquivo. Se a recriação precisar de npm install para rodar o jogo (e não só os testes), ela saiu do escopo.', y, C.navy);
  footer(doc);
}

function parte4(doc) {
  header(doc, 'Parte 4', 'Conteúdo: os números fechados', 'Estes números não são metas — são o tamanho exato do jogo.');
  let y = 190;
  y = para(doc, 'Toda a contagem abaixo já existe no jogo original e deve ser preservada. Trocar espada por chicote não altera quantidade: altera o que cada item é.', y);
  y += 14;

  y = table(doc, {
    y, cols: [{ w: 74 }, { w: 48, align: 'center' }, { w: 361 }],
    head: ['Conjunto', 'Total', 'Composição'],
    size: 8.8,
    rows: [
      ['Chicotes', '200', '10 tiers × 20 armas. T1–T6 forjáveis, T7–T8 forjáveis com minério de chefe, T9–T10 só caem de chefe.'],
      ['Chefes', '94', '4 clássicos (Rei Slime, Olho Colossal, Guardião do Abismo, Colosso Estelar) + 90 novos em 6 atos: 8, 14, 16, 12, 20 e 20.'],
      ['Receitas', '433', 'Todas as armas e equipamentos têm receita com bancada e materiais próprios; o número é o do catálogo original.'],
      ['Itens', '628', 'Catálogo completo: armas, equipamentos, blocos, poções e materiais — todo item que pode ir para o inventário.'],
      ['Conquistas', '429', '10 categorias, 4 raridades; 200 de arma, 94 de chefe e 12 segredos mascarados.'],
      ['Minérios', '50', '10 famílias × 5, mais 50 barras; os de pós-jogo só caem de chefe.'],
      ['Armaduras', '50', '1 slot, com passiva própria e bônus de conjunto (2 peças: pequeno; 4 peças: completo).'],
      ['Acessórios', '50', '4 slots; 45 vêm de chefe (um exclusivo por chefe) e 5 são forjados.'],
      ['Picaretas', '5', 'Poder 10 a 14, forjadas na Forja Celeste, destravam os minérios mais duros.'],
    ],
  });
  y += 18;
  y = h2(doc, 'A conta que precisa fechar', y);
  y = codeBlock(doc, ' 200 chicotes   =   10 tiers × 20\n  94 chefes     =    4 clássicos + 90 novos (8+14+16+12+20+20)\n 429 conquistas =  200 armas + 94 chefes + 12 segredos + 123 nas outras 7 categorias\n  40 chicotes   =   40 chefes que guardam os T9–T10 (um por arma)', y + 8);
  y += 14;
  y = callout(doc, 'Não invente número novo',
    'Se durante a implementação faltar item para fechar 628 ou 433, o erro está na recriação, não na contagem: volte às tabelas do original e encontre o que ficou de fora.', y);
  footer(doc);
}

function parte5(doc) {
  header(doc, 'Parte 5', 'Os 10 tiers', '20 chicotes por tier, do couro trançado ao big bang.');
  let y = 178;
  y = para(doc, 'Cada tier tem cor própria (usada no nome do item, na borda do ícone e no efeito do golpe), faixa de multiplicador de dano e uma família de mecânicas. O tier 1 é o começo; o 10 é o pós-jogo absoluto.', y);
  y += 12;

  const rows = TIERS.map(([n, nome, col, mult, mec]) => {
    const r = [String(n), nome, mult, mec];
    r._swatch = col;
    return r;
  });
  y = table(doc, {
    y, cols: [{ w: 22, align: 'center' }, { w: 122 }, { w: 58, align: 'center' }, { w: 281 }],
    head: ['#', 'Tier', 'Dano', 'Mecânica da família'],
    size: 8.0, rowPad: 4.6, rows,
  });
  y += 14;
  y = h2(doc, 'Como se obtém cada faixa', y);
  y = bullets(doc, [
    { b: 'Tiers 1 a 6 (120 chicotes):', t: 'forjados na bancada, com materiais que aparecem na progressão normal.' },
    { b: 'Tiers 7 e 8 (40 chicotes):', t: 'forjados com os minérios de pós-jogo, que só caem de chefe — nunca de minério no mapa.' },
    { b: 'Tiers 9 e 10 (40 chicotes):', t: 'não são forjáveis: cada um cai do chefe que o protege, um por chefe.' },
  ], y + 6);
  y += 10;
  y = callout(doc, 'A cor é regra, não enfeite',
    'A cor do tier pinta o brilho do estalo, a borda do ícone e o nome no inventário. Um chicote de Tier 6 nunca pode brilhar como um de Tier 9 — é assim que o jogador lê a raridade sem abrir a ficha.', y);
  footer(doc);
}

function parte6(doc) {
  header(doc, 'Parte 6', 'Curva de dano, alcance e alvos', 'A matemática do estalo — e por que ela precisa aparecer na tela.');
  let y = 186;
  y = para(doc, 'O chicote é a única arma do jogo cujo dano depende de onde acerta. Isso não pode ser invisível: o número que sobe na tela e a faísca maior na ponta são a leitura do jogador.', y);
  y += 12;

  y = h2(doc, 'Fórmula', y);
  y = codeBlock(doc,
    'dano(t)  = Base_tier × (0,60 + 1,00 × t)      // t = 0 no cabo, 1 na ponta\n' +
    'estalo   = se t > 0,90 → dano × 1,60          // último 10% da corda\n' +
    'alvos    = 3 + floor(tier / 2)                // T1 = 3 ... T10 = 8\n' +
    'queda    = −15% de dano por alvo extra, depois do primeiro\n' +
    'alcance  = 3,2 + 0,1 × tier  (blocos)          // T1 = 3,3 ... T10 = 4,2', y + 8);
  y += 14;

  y = h2(doc, 'Números por tier', y);
  y = table(doc, {
    y, cols: [{ w: 112 }, { w: 62, align: 'center' }, { w: 76, align: 'center' }, { w: 84, align: 'center' }, { w: 78, align: 'center' }, { w: 71, align: 'center' }],
    head: ['Tier', 'Base', 'Ponta (×1,6)', 'Estalo (×2,56)', 'Alcance', 'Alvos'],
    size: 8.2, rowPad: 3.4,
    rows: [
      ['1 · Básico', '12', '19', '31', '3,3', '3'],
      ['2 · Pré-Chefes', '20', '32', '51', '3,4', '4'],
      ['3 · Mid-Game', '32', '51', '82', '3,5', '4'],
      ['4 · Hardmode', '48', '77', '123', '3,6', '5'],
      ['5 · Hard. Avançado', '70', '112', '179', '3,7', '5'],
      ['6 · End-Game', '100', '160', '256', '3,8', '6'],
      ['7 · Forja Estelar', '145', '232', '371', '3,9', '6'],
      ['8 · Relicário', '200', '320', '512', '4,0', '7'],
      ['9 · Eco Primordial', '270', '432', '691', '4,1', '7'],
      ['10 · Origem', '360', '576', '922', '4,2', '8'],
    ],
  });
  y += 14;
  y = h2(doc, 'O que o jogador vê', y);
  y = bullets(doc, [
    { b: 'No cabo:', t: '0,6× e faísca pequena — golpear colado é desperdício.' },
    { b: 'No meio:', t: '1,0× a 1,3×, a distância segura da maioria das lutas.' },
    { b: 'Na ponta:', t: '1,6×, faísca dourada e som agudo — o acerto perfeito.' },
    { b: 'No estalo:', t: '2,56×, tremor de câmera e o número na cor do tier.' },
  ], y + 8);
  y += 10;
  y = callout(doc, 'Sem sorteio',
    'A curva é determinística: a posição da colisão decide o multiplicador, não um sorteio. Acertar a ponta é habilidade, não aposta.', y);
  footer(doc);
}

function parte6b(doc) {
  header(doc, 'Parte 7', 'Nomes: a assinatura de cada tier', 'Duas ou três palavras em português — e o 200º chicote do jogo.');
  let y = 186;
  y = para(doc, 'O nome do chicote não descreve o efeito: descreve o material e o formato da corda. O efeito aparece na ficha, com o multiplicador e os alvos.', y);
  y += 12;

  y = h2(doc, 'Regras de nomenclatura', y);
  y = bullets(doc, [
    'Português do Brasil, sem nome em inglês e sem nome repetido em tiers diferentes.',
    'Duas palavras na maioria; três quando o tier é o pós-jogo (Forja Estelar, Eco Primordial).',
    'O nome nunca promete o efeito: "Serrilhado" diz o formato, não diz que causa sangramento.',
    'Cada tier tem uma família de palavras: couro, cravo, corrente, osso, par, runa, estrela, relíquia, eco, origem.',
    'O ícone tem de ser reconhecível pelo nome: se diz "corrente", o desenho mostra elos.',
  ], y + 8);
  y += 12;

  y = h2(doc, 'Um exemplo por tier', y);
  y = table(doc, {
    y, cols: [{ w: 28, align: 'center' }, { w: 184 }, { w: 271 }],
    head: ['#', 'Exemplo de nome', 'Ideia da corda'],
    size: 8.2, rowPad: 4.6,
    rows: [
      ['1', 'Chicote Trançado', 'tiras de couro cru, cabo de madeira'],
      ['2', 'Chicote de Cravos', 'nós com pregos de ferro na ponta'],
      ['3', 'Chicote de Corrente', 'elo de metal, ponta com gancho'],
      ['4', 'Chicote Serrilhado', 'lâminas curtas costuradas na corda'],
      ['5', 'Par de Gêmeos', 'dois chicotes iguais, um em cada mão'],
      ['6', 'Chicote do Eclipse', 'fio escuro com brilho de corona'],
      ['7', 'Chicote Forja Estelar', 'corda de estrela fundida, faíscas douradas'],
      ['8', 'Chicote do Relicário', 'corrente de relíquias e olhos'],
      ['9', 'Chicote Eco Primordial', 'luz antiga que repete o golpe'],
      ['10', 'Apoteose', 'o 200º: só existe depois dos 94 chefes'],
    ],
  });
  y += 16;
  y = callout(doc, 'O último chicote',
    '"Apoteose" não aparece em receita nem em loot comum: ela só existe quando o jogador já derrotou os 94 chefes. É o troféu final, como a espada Axioma no original.', y, C.navy);
  footer(doc);
}

function parte7(doc) {
  header(doc, 'Parte 8', 'Chefes: 4 + 90, e o fim do jogo', 'Cada chefe protege alguma coisa; dois atos inteiros protegem chicotes.');
  let y = 186;
  y = para(doc, 'Os quatro chefes clássicos abrem a progressão. Os noventa novos vêm em seis atos, cada um com visual próprio e uma mecânica inédita — nenhum chefe repete o golpe de outro.', y);
  y += 12;

  y = table(doc, {
    y, cols: [{ w: 78 }, { w: 44, align: 'center' }, { w: 361 }],
    head: ['Ato', 'Chefes', 'O que entra'],
    size: 8.4,
    rows: [
      ['Clássicos', '4', 'Rei Slime, Olho Colossal, Guardião do Abismo (2 fases), Colosso Estelar (3 fases).'],
      ['I · Despertar', '8', 'Primeiros padrões; ensina a ler telegrafia e a usar o gancho para fugir.'],
      ['II · Pós-Olho', '14', 'Arenas com relevo e projéteis; introduz o par de chicotes no Tier 5.'],
      ['III · Hardmode', '16', 'Mecânicas de tempo, lasers perfurantes e invocações.'],
      ['IV · Além do Colosso', '12', 'Efeitos de tela e domínios; começa a cair minério de pós-jogo.'],
      ['V · Além do Firmamento', '20', 'Guarda os chicotes de Tier 9 (20 chefes, um por arma).'],
      ['VI · Fim de Tudo', '20', 'Guarda os chicotes de Tier 10; termina na Apoteose, com 4 fases.'],
    ],
  });
  y += 16;

  y = h2(doc, 'Regras dos chefes', y);
  y = bullets(doc, [
    { b: 'Mecânica inédita:', t: 'cada um dos 90 novos tem um golpe que nenhum outro tem. Se dois chefes usam o mesmo padrão, um deles está errado.' },
    { b: 'Acessório exclusivo:', t: 'todo chefe, inclusive os 4 clássicos, guarda um acessório que não cai em nenhum outro lugar (45 de chefe + 5 forjados = 50).' },
    { b: 'T9 e T10:', t: '40 chefes guardam 40 chicotes; o drop é garantido na primeira vitória e o chefe não pode ser contornado.' },
    { b: 'Apoteose:', t: 'o chefe final tem 4 fases, cada uma com uma cor de brilho e uma variante de arte própria.' },
    { b: 'Axioma / Apoteose:', t: 'o chicote nº 200 só é liberado quando o contador de chefes chega a 94/94.' },
  ], y + 8);
  y += 14;
  y = callout(doc, 'Chefe não é saco de pancada',
    'A luta tem de ensinar a arma: o gancho, o giro de 360° e o estalo na ponta precisam ser a resposta natural a pelo menos um chefe de cada ato. Se o jogador vence tudo sem usar o alcance, o chefe está mal desenhado.', y);
  footer(doc);
}

function parte8(doc) {
  header(doc, 'Parte 9', 'Conquistas: 429 em 10 categorias', 'Com os 12 segredos escondidos atrás de ??? até serem desbloqueados.');
  let y = 186;
  y = para(doc, 'O painel de conquistas abre por dois caminhos: botão no menu principal (mostrando x / 429 e a porcentagem) e botão na pausa. Os dois abrem o mesmo painel, com abas por categoria e barra de progresso.', y);
  y += 14;

  y = table(doc, {
    y, cols: [{ w: 128 }, { w: 56, align: 'center' }, { w: 299 }],
    head: ['Categoria', 'Total', 'Exemplos do que se conquista'],
    size: 8.4,
    rows: [
      ['Chicotes', '200', 'Uma por arma: forjar, achar ou arrancar do chefe que a guarda.'],
      ['Chefes', '94', 'Uma por chefe derrotado, incluindo os 4 clássicos e a Apoteose.'],
      ['Progressão', '—', 'Primeiro tier, primeiro par de chicotes, todos os tiers, 94/94.'],
      ['Combate', '—', 'Estalo em 3 inimigos de uma vez, giro que acerta 5, gancho salvador.'],
      ['Mineração e construção', '—', 'Profundidade, forja, primeira casa e primeira ponte sem bloco.'],
      ['Equipamento', '—', 'Conjunto de 2 e de 4 peças, 50 armaduras, 50 acessórios, 5 picaretas.'],
      ['Exploração', '—', 'Biomas visitados, mapa revelado, segredos de caverna.'],
      ['Economia e NPCs', '—', 'Vendas, compras e todos os NPCs morando na vila.'],
      ['Mundos', '—', 'Criar, salvar, exportar e importar mundos.'],
      ['Segredos', '12', 'Conquistas ocultas do fim do jogo — mascaradas até desbloquear.'],
    ],
  });
  y += 16;

  y = h2(doc, 'Os 12 segredos', y);
  y = para(doc, 'Enquanto não são desbloqueadas, as conquistas de segredo aparecem como ??? e não mostram nada: nem nome, nem descrição, nem raridade, nem contador. A linha existe, o jogador sabe que há 12, mas não sabe o que são.', y + 6);
  y += 12;
  y = callout(doc, 'Como mascarar (implementação)',
    'A flag de segredo esconde nome, descrição, raridade e contador; a conquista só entra no painel quando é desbloqueada. A ordenação coloca desbloqueadas primeiro, depois as ocultas, depois as em progresso. O total (x / 429) continua contando as 12.', y);
  y += 12;
  y = callout(doc, 'Raridades',
    'Comum, Raro, Épico e Lendário, com a cor de cada uma no nome. Os segredos não mostram a raridade antes de serem abertos — é justamente a surpresa que os torna interessantes.', y, C.navy);
  footer(doc);
}

function parte9(doc) {
  header(doc, 'Parte 10', 'Interface e controles', 'Azul do Terraria mobile, texto em português e nada de tutorial na tela.');
  let y = 186;
  y = h2(doc, 'HUD', y);
  y = bullets(doc, [
    { b: 'Barra inferior:', t: 'itens com contagem; o chicote equipado mostra o tier pela cor da borda.' },
    { b: 'Corações de pixel:', t: 'pequenos e sem brilho; dano de chefe pisca a tela em vermelho por 0,15 s.' },
    { b: 'Menus:', t: 'mesmo azul dos painéis, com abas (Arsenal, Conquistas, Mapa, Som) e botões grandes para toque.' },
    { b: 'Estalo:', t: 'faísca na ponta e tremor de câmera curto; existe opção de reduzir o tremor nas configurações.' },
  ], y);
  y += 12;

  y = h2(doc, 'Telas', y);
  y = table(doc, {
    y, cols: [{ w: 108 }, { w: 375 }],
    head: ['Tela', 'O que tem'],
    size: 8.4,
    rows: [
      ['Menu principal', 'Só texto (sem logo): Jogar, Meus Mundos, Arsenal, Conquistas, Som e Sair.'],
      ['Meus Mundos', 'Cartões com miniatura, data, biomas; criar, abrir, apagar, exportar e importar.'],
      ['Pausa', 'Retomar, Conquistas, Som, Controles, Salvar e Sair para o menu.'],
      ['Arsenal', 'Lista dos 200 chicotes com filtro por tier, ficha de atributos e receita.'],
      ['Conquistas', 'x / 429, porcentagem, abas por categoria e os 12 segredos como ???.'],
    ],
  });
  y += 16;
  y = h2(doc, 'Controles', y);
  y = bullets(doc, [
    { b: 'Teclado e mouse:', t: 'A/D ou setas para andar, espaço para pular, clique para golpear (segurar para o giro), E para interagir.' },
    { b: 'Controle:', t: 'mira analógica com o stick direito; o cursor virtual percorre os painéis; botões equivalentes aos do teclado.' },
    { b: 'Toque:', t: 'direcional virtual, botão de ação com mira por arrasto (arrastar define a direção do estalo) e botões de pulo, interação, inventário e pausa.' },
  ], y + 6);
  y += 14;
  y = callout(doc, 'Acessibilidade mínima',
    'Reduzir tremor de câmera, desligar a faísca do estalo e aumentar a fonte dos balões. Nenhuma dessas opções pode mudar a jogabilidade.', y, C.navy);
  footer(doc);
}

function parte10(doc) {
  header(doc, 'Parte 11', 'Critérios de aceite e prompt curto', 'Como saber que a recriação está pronta — e o texto para colar.');
  let y = 182;
  y = h2(doc, 'Critérios de aceite', y);
  y = table(doc, {
    y, cols: [{ w: 22, align: 'center' }, { w: 216 }, { w: 245 }],
    head: ['#', 'Critério', 'Como verificar'],
    size: 8.2, rowPad: 4.6,
    rows: [
      ['1', '200 chicotes em 10 tiers, 20 por tier', 'Contar nas tabelas e no Arsenal; nenhum nome repetido.'],
      ['2', 'As 7 mecânicas em todos', 'Testar alcance, ponta, multi-alvo, giro, gancho, par (T5+) e corda.'],
      ['3', '94 chefes, cada um com mecânica inédita', 'Lista de golpes por chefe; nenhum par idêntico.'],
      ['4', '40 chicotes de T9–T10 saindo de 40 chefes', 'Matar cada um dos 40 e conferir o drop.'],
      ['5', 'Apoteose só após 94/94', 'Contador em 93/94: o chicote não existe em lugar nenhum.'],
      ['6', '429 conquistas, 12 mascaradas', 'Painel sem ??? aberto; depois de abrir, nome e raridade aparecem.'],
      ['7', '628 itens e 433 receitas', 'Somar as tabelas do jogo e comparar com o catálogo.'],
      ['8', 'Save, exportar e importar mundos', 'Salvar, recarregar e reabrir o arquivo do mapa.'],
      ['9', 'Teclado, controle e toque', 'Jogar uma luta de chefe com cada um dos três.'],
      ['10', 'Um único index.html, 60 fps', 'Abrir o arquivo sem servidor e medir o fps em tela cheia.'],
    ],
  });
  y += 16;

  y = h2(doc, 'Prompt curto (para colar na ferramenta)', y + 2);
  y = codeBlock(doc,
    'Recrie o jogo "Espadas Do Destino" (sandbox 2D pixel-art em HTML5, um\n' +
    'único index.html, mundo 1400×480, mineração, crafting, 10 tiers, 94\n' +
    'chefes, 429 conquistas, música em MP3, teclado/gamepad/toque) trocando\n' +
    'a arma central: em vez de espadas, 200 CHICOTES em 10 tiers. O chicote\n' +
    'tem alcance 2–3× maior, dano crescente até a ponta (+60% no estalo),\n' +
    'acerta vários inimigos em linha, gira 360° ao carregar, agarra blocos\n' +
    'com gancho e, do Tier 5 em diante, vem em par. Mantenha os 94 chefes\n' +
    '(4 + 90 em 6 atos), 433 receitas, 628 itens e 429 conquistas, com\n' +
    'textos em português. Estilo pixel-art tipo Terraria mobile, interface\n' +
    'azul, tudo autocontido e sem dependências.', y + 8);
  y += 12;
  y = callout(doc, 'Como usar',
    'Este prompt é a versão curta. Para uma implementação fiel, use as partes 2 a 10 como especificação de cada sistema — em especial a fórmula de dano por distância e os sete comportamentos obrigatórios do chicote.', y);
  footer(doc);
}

// ---------------------------------------------------------------- build
const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: false, info: {
  Title: 'Chicotes do Destino — prompt e especificação do jogo',
  Author: 'Jhon Maklayn Mozer dos Santo',
  Subject: '200 chicotes em 10 tiers, 94 chefes, 429 conquistas',
  Keywords: 'chicotes, jogo, prompt, pixel-art, sandbox',
} });
doc.registerFont('reg', D + 'DejaVuSans.ttf');
doc.registerFont('bold', D + 'DejaVuSans-Bold.ttf');
doc.registerFont('mono', D + 'DejaVuSansMono.ttf');

const parts = [sumario, parte1, parte2, parte3, parte4, parte5, parte6, parte6b, parte7, parte8, parte9, parte10];
TOTAL = parts.length + 1;

doc.pipe(fs.createWriteStream(OUT));
capa(doc);
// detecta quebras de página automáticas (conteúdo passando do rodapé)
let autoBreaks = 0, explicit = false;
const addPage0 = doc.addPage.bind(doc);
doc.addPage = (...a) => {
  if (!explicit) { autoBreaks++; console.warn('!! quebra automática depois da página ' + pageNo); }
  return addPage0(...a);
};
for (const fn of parts) { explicit = true; doc.addPage(); explicit = false; fn(doc);
}
bodyEnds.forEach((v, i) => { if (v > 770) console.warn('!! página ' + (i + 2) + ' termina em y=' + v + ' (limite ~770)'); });
if (autoBreaks) console.warn('!! ' + autoBreaks + ' quebra(s) automática(s) — conteúdo estourou a página');
doc.end();
doc.on('end', () => {
  const st = fs.statSync(OUT);
  console.log(`OK ${OUT} — ${TOTAL} páginas, ${st.size} bytes`);
});
