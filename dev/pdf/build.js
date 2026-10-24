'use strict';
// Monta o PDF em duas passadas: a primeira descobre em que página cada seção começa,
// a segunda escreve o sumário com esses números (o número de linhas do sumário é fixo,
// então a paginação não muda entre as passadas).
const fs = require('fs');
const path = require('path');
const { Doc } = require('./engine.js');
const A = require('./content_a.js');
const B = require('./content_b.js');
const Cc = require('./content_c.js');
const D = require('./content_d.js');

const OUT = process.argv[2] || '/home/user/101spas/docs/guia_do_codigo.pdf';

function build(pages) {
  const doc = new Doc({
    info: {
      Title: '101spas — Guia do código', Author: 'Documento gerado a partir do código-fonte',
      Subject: 'O que cada pasta e cada arquivo faz e como o jogo funciona por dentro',
      Keywords: '101spas, javascript, canvas, pixel-art, arquitetura, tiers 7-10',
      CreationDate: new Date(2026, 9, 22),
    },
  });
  A.cover(doc);
  A.toc(doc, pages);
  A.part1(doc);
  A.part2(doc);
  B.part3(doc);
  Cc.part3b(doc);
  D.part4(doc);
  D.part6(doc);
  D.artifacts(doc);
  D.appendix(doc);
  return doc;
}

(async () => {
  // passada 1: sem números (só para descobrir as páginas)
  const d1 = build(null);
  await d1.finish();
  const marks = d1.marks || {};
  // passada 2: com o sumário preenchido
  const d2 = build(marks);
  const buf = await d2.finish();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('OK', OUT, Math.round(buf.length / 1024) + ' KB', '| páginas:', d2.pageNo);
  console.log('seções:', Object.keys(marks).map(k => k + '=p' + marks[k]).join(' '));
})();
