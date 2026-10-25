'use strict';
// Gera docs/guia_do_jogo.pdf — o guia completo do jogo no modelo do guia anterior:
// capa, sumário, Parte 1 (como funciona), Parte 2 (criação), Parte 3 (200 espadas),
// Parte 4 (94 chefes), Parte 5 (429 conquistas), Parte 6 (estrutura) e apêndice.
// Uso:  node dev/guia/build.js
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { Doc } = require('./engine');
const A = require('./art');
const { X } = require('./game');
const D = require('./data');
const { part1, part2 } = require('./content_p1p2');
const { part3 } = require('./content_p3');
const { part4 } = require('./content_p4');
const { part5 } = require('./content_p5');
const { part6 } = require('./content_p6');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'guia_do_jogo.pdf');

function gitVer() {
  try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'local'; }
}
function dataPt() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// sumário: partes e seções (os números de página saem dos marcadores)
const TOC = [
  { group: 'Parte 1 — Como o jogo funciona' },
  ['1.1', 'O que é o jogo', 's11'], ['1.2', 'Primeiros passos', 's12'], ['1.3', 'Controles', 's13'],
  ['1.4', 'A tela do jogo', 's14'], ['1.5', 'O mundo', 's15'], ['1.6', 'Vida, defesa e morte', 's16'],
  ['1.7', 'Combate', 's17'], ['1.8', 'Minerar e construir', 's18'], ['1.9', 'Inimigos', 's19'],
  ['1.10', 'Chefes', 's110'], ['1.11', 'NPCs e moradia', 's111'], ['1.12', 'Estágios do mundo', 's112'],
  ['1.13', 'Modo Criativo, Arsenal e conquistas', 's113'], ['1.14', 'Mundos salvos', 's114'],
  { group: 'Parte 2 — O sistema de criação' },
  ['2.1', 'Como criar um item', 's21'], ['2.2', 'As estações de criação', 's22'], ['2.3', 'Os 50 minérios de família', 's23'],
  ['2.4', 'Roteiro da progressão', 's24'], ['2.5', 'Ferramentas: as 14 picaretas', 's25'], ['2.6', 'Armaduras: 50 peças', 's26'],
  ['2.7', 'Acessórios: 50 peças', 's27'], ['2.8', 'Poções, Cristais e invocações', 's28'], ['2.9', 'Blocos, móveis e paredes', 's29'],
  ['2.10', 'Guia de materiais', 's210'],
  { group: 'Parte 3 — As 200 espadas' },
  ['3.1', 'Como ler o catálogo', 's31'], ['3.2', 'Visão geral: as 200 em uma olhada', 's32'],
  ['3.3–3.12', 'As fichas, tier por tier', 's33'], ['3.13', 'As 40 espadas que só caem de chefe', 's313'],
  { group: 'Parte 4 — Os 94 chefes', page: 1 },
  ['4.1', 'Como funcionam os chefes', 's41'], ['4.2', 'Os 4 chefes da progressão', 's42'],
  ['4.3–4.8', 'Os 90 chefes novos, atos I a VI', 's43'], ['4.9', 'Tabela-resumo dos 94 chefes', 's49'],
  { group: 'Parte 5 — Conquistas' },
  ['5.1', 'Como funcionam', 's51'], ['5.2', 'Espadas (200)', 's52'], ['5.3', 'Chefes (94)', 's53'],
  ['5.4', 'As outras 135 conquistas', 's54'],
  { group: 'Parte 6 — Estrutura do código' },
  ['6.1', 'Como o jogo é montado', 's61'], ['6.2', 'As ideias por trás do código', 's62'],
  ['6.3', 'A pasta dev/: testes', 's63'], ['6.4', 'docs/, a raiz e as pastas de apoio', 's64'],
  { group: 'Apêndice' },
  ['A.1', 'Glossário', 'sa1'], ['A.2', 'Sobre o jogo e o criador', 'sa2'],
];

function tocEntries(d) {
  return TOC.map(e => {
    if (e.group) return { group: e.group };
    const [num, title, mark] = e;
    return { num, title, mark, page: d.marks[mark] || null, sub: true };
  });
}

(async () => {
  const ver = gitVer(), dt = dataPt();
  const indexBytes = fs.existsSync(path.join(ROOT, 'index.html')) ? fs.statSync(path.join(ROOT, 'index.html')).size : 0;
  await A.preload(['logo.jpg', '01_menu.png', '02_combate.png', '03_biomas_e_camadas.png', '04_arco_de_ataque.png',
    '05_efeitos_tier4.png', '06_efeitos_tier5_6.png', '07_interface.png', '10_meus_mundos.png',
    '12_chefes.png', '13_chefes_novos.png']);

  const d = new Doc({ Title: 'Espadas do Destino — Guia completo do jogo', Author: 'Jhon Maklayn Mozer dos Santo', Creator: 'Jhon Maklayn Mozer dos Santo', Subject: 'Guia do jogo: 200 espadas, 94 chefes, 429 conquistas', Keywords: 'espadas, terraria, guia, pixel-art' });
  d.tiers = X.TIERS;

  // ---------- capa ----------
  const swordRow = [1, 21, 41, 61, 81, 101, 121, 141, 161, 181].map(n => X.SWORDS.find(s => s.num === n));
  const coverPng = A.cover({
    tiers: X.TIERS,
    swordRow,
    shot: '02_combate.png',
    logo: 'logo.jpg',
    stats: [['200', 'espadas'], ['94', 'chefes'], ['429', 'conquistas'], ['628', 'itens']],
    tagline: 'Guia completo · 10 tiers · 6 atos · do primeiro tronco à Apoteose',
    credit: 'Jhon Maklayn Mozer dos Santo',
    gen: `Gerado em ${dt} · versão ${ver}`,
  });
  d.coverPage(coverPng);

  // ---------- páginas do sumário (reservadas; desenhadas no fim) ----------
  d.newPage(); d.setPart('Sumário');
  d.newPage();

  // ---------- conteúdo ----------
  part1(d, A);
  part2(d, A);
  part3(d, A);
  part4(d, A);
  part5(d);
  part6(d, { version: ver, indexBytes });

  // ---------- sumário com os números reais ----------
  d.tocDraw(1, tocEntries(d), 'Sumário', 2, {
    title: 'Como usar este guia',
    text: 'A **Parte 1** explica o jogo inteiro (controles, mundo, combate, inimigos, chefes e progressão). A **Parte 2** é o manual de criação: estações, os 50 minérios, as picaretas, as 50 armaduras e os 50 acessórios. A **Parte 3** é o catálogo das 200 espadas, com uma ficha por espada; a **Parte 4** faz o mesmo com os 94 chefes. As **Partes 5 e 6** fecham com as 429 conquistas e a estrutura do código. Todos os números saem do próprio jogo — a versão está no rodapé de cada página.',
  });

  const buf = await d.finish({ footer: `Gerado em ${dt} · versão ${ver}` });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  const pages = d.pageNo;
  console.log(`ok: ${path.relative(ROOT, OUT)} — ${pages} páginas, ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
})().catch(e => { console.error(e); process.exit(1); });
