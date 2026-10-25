'use strict';
// Parte 4: os 94 chefes (4 da progressão + 90 novos em 6 atos) e a tabela-resumo.
const D = require('./data');
const { X } = D;

const N = (v) => D.ni(v);
const pad3 = (n) => String(n).padStart(3, '0');

function card(d, A, b) {
  const sw = D.bossSword(b);
  const A5 = D.actInfo(b.act);
  const rows = [
    ['VIDA · DANO', `${N(b.hp)} de vida · ${N(b.dmg)} de dano · defesa ${N(b.def)} · ${b.coin[0]}–${b.coin[1]} moedas`],
    ['INVOCAR', D.sigilText(b)],
    ['ONDE E QUANDO', D.condText(b.cond)],
    ['A LUTA', D.cap(b.mech)],
    ['RECOMPENSA', 'Sempre: ' + D.actDrops(b.act) + (sw ? ' · Espada ' + pad3(sw.num) + ' ' + sw.n + ' (T' + sw.t + ')' : '')],
  ];
  return d.bossCard({ title: b.n, portraitFn: (h) => A.bossPortrait('x', b.id, 150, h).png, portraitW: 150, portraitH: 132, rows });
}

function part4(d, A) {
  d.partBand(4, 'Os 94 chefes', 'Os 4 chefes da progressão e os 90 chefes novos em seis atos: vida, dano, como invocar, onde e quando, a luta e a recompensa.');

  d.h2('4.1', 'Como funcionam os chefes', { mark: 's41', parent: 'p4' });
  d.para('São **94 chefes**: 4 da progressão e 90 novos, divididos em seis atos de 8, 14, 16, 12, 20 e 20. Todos têm barra de vida no alto da tela, três fases (os novos) e uma mecânica exclusiva. Nenhum deles muda de vida ou dano com o estágio do mundo: o desafio é sempre o mesmo.');
  d.table(['Ato', 'Chefes', 'Pré-requisito', 'Estação do sigilo', 'Materiais que todos soltam'], [
    ['I · Despertar', '8', 'nenhum (já está liberado)', 'Bancada', '14–26 Gosma, 4–8 Osso, 4 Poções de Cura, moedas'],
    ['II · Pós-Olho', '14', 'derrotar o Olho Colossal', 'Bigorna', '6–10 Barras de Platina, 2–4 Presas Vampíricas, 4 Poções de Cura, moedas'],
    ['III · Hardmode', '16', 'derrotar o Guardião do Abismo', 'Bigorna Avançada', '6–10 Barras de Infernal, 5–9 Fragmentos Celestes, 5 Poções de Cura Maior, moedas'],
    ['IV · Além do Colosso', '12', 'derrotar o Colosso Estelar', 'Forja Celeste', '10–18 Fragmentos Celestes, 1–2 Essências do Tempo, 5 Poções Supremas, moedas'],
    ['V · Além do Firmamento', '20', 'derrotar o Colosso Estelar', 'Forja Celeste', '4–8 Barras Celestes, 5–9 Essências de Luz, 5 Poções Supremas, moedas'],
    ['VI · Fim de Tudo', '20', 'derrotar o Colosso Estelar', 'Forja Celeste', '6–10 Barras Celestes, 1–2 Núcleos Míticos, 5 Poções Supremas, moedas'],
  ], [.17, .08, .26, .19, .3], { size: 7.6 });
  d.para('Cada chefe novo solta **uma espada garantida** — nas primeiras 50, dos Tiers 1 a 8; nos Atos V e VI, as 40 dos Tiers 9 e 10. O sigilo é gasto ao invocar; se o chefe não aparecer por causa do lugar ou da hora, o item volta. Se você morrer, o chefe desaparece depois de alguns segundos e o sigilo precisa ser feito de novo.');
  d.callout('warn', 'A regra do Axioma', 'O **Axioma** é o 90º chefe e pode ser invocado assim que o Ato VI estiver liberado. Mas a espada dele — a **190 Axioma** — **só cai se os 94 chefes já tiverem sido derrotados**. Se faltar algum, a luta acontece e o chefe dá os materiais, mas a espada não aparece: o jogo avisa. Por isso o Axioma é, na prática, o penúltimo troféu; o último é a **Apoteose**.');

  // ---------------- 4.2 ----------------
  d.h2('4.2', 'Os 4 chefes da progressão', { mark: 's42', parent: 'p4' });
  d.para('Eles não usam sigilo: cada um é invocado por um item próprio, feito numa estação. A vitória muda o mundo.');
  for (const c of D.CLASSIC) {
    const sw = X.SWORDS.find(s => (s.tierLevel === { boss_slime: 1, boss_eye: 2, boss_guardian: 3, boss_colossus: 4 }[c.key]) && s.station);
    const rows = [
      ['VIDA · DANO', `${N(c.hp)} de vida · ${N(c.dmg)} de dano · defesa ${N(c.def)} · ${c.coin[0]}–${c.coin[1]} moedas`],
      ['INVOCAR', c.sum],
      ['ONDE E QUANDO', c.where],
      ['A LUTA', c.mech],
      ['RECOMPENSA', c.drop],
    ];
    const kind = { boss_slime: 'sl', boss_eye: 'ey', boss_guardian: 'gd', boss_colossus: 'col' }[c.key];
    d.bossCard({ title: c.n, portraitFn: (h) => A.bossPortrait('classic', kind, 150, h).png, portraitW: 150, portraitH: 132, rows });
  }
  d.imageBlock(A.shot('13_chefes_novos.png'), 470, 408, { caption: 'Os 90 chefes novos em um só quadro: atos I a VI, com o número da espada que cada um solta. Cada um tem uma mecânica que muda a forma de lutar.' });

  // ---------------- atos ----------------
  const atoSub = {
    1: 'Chefes de Tier 1 e 2, feitos para a Aventura inicial. Sigilos na Bancada.',
    2: 'Depois do Olho Colossal. Sigilos na Bigorna; espadas dos Tiers 2 e 3.',
    3: 'O Hardmode dos chefes novos: 16 lutas com arenas e elementos. Sigilos na Bigorna Avançada.',
    4: 'O primeiro ato do pós-Colosso. Sigilos na Forja Celeste; espadas dos Tiers 6 e 7.',
    5: 'O ato dos deuses: 20 chefes e as 20 espadas do Tier 9. Sigilos na Forja Celeste.',
    6: 'O fim de tudo: 20 chefes, o Axioma e a Apoteose. As 20 espadas do Tier 10.',
  };
  for (let a = 1; a <= 6; a++) {
    if (a === 1) d.h2('4.3', 'Ato I · Despertar (8 chefes)', { mark: 's43', parent: 'p4' });
    else { d.ensure(300); d.h2('4.' + (a + 2), D.ACT_NAMES[a] + ` (${D.ATOS[a].length} chefes)`, { mark: 's4' + (a + 2), parent: 'p4', top: 6 }); }
    d.para(atoSub[a], { size: 8.8 });
    const A5 = D.actInfo(a);
    d.actBand(D.ACT_NAMES[a] + ` · ${D.ATOS[a].length} chefes`, [
      '**Pré-requisito:** ' + (a === 1 ? 'nenhum (já está liberado).' : a === 2 ? 'ter derrotado o Olho Colossal (estágio 1).' : a === 3 ? 'ter derrotado o Guardião do Abismo (Hardmode).' : 'ter derrotado o Colosso Estelar (estágio 3).'),
      '**Sigilos feitos na:** ' + D.stationOf(A5.st) + '. Todos soltam: ' + D.actDrops(a) + '.',
    ]);
    for (const b of D.ATOS[a]) card(d, A, b);
    if (a === 6) {
      d.callout('danger', 'Apoteose — o chefe final', '**260.000 de vida, 232 de dano e 46 de defesa.** Quatro estágios: I julgamento e martelo; II selos que o blindam; III asas com raios girando; IV a apoteose final. Nos dois primeiros ele anda no chão, nos dois últimos voa. Solta a espada **200 Apoteose**.');
    }
  }

  // ---------------- 4.9 tabela-resumo ----------------
  d.newPage();
  d.h2('4.9', 'Tabela-resumo dos 94 chefes', { mark: 's49', parent: 'p4' });
  d.para('Vida · dano · defesa e a espada de cada chefe, na ordem do jogo. Use esta tabela para conferir o que falta: são 94 linhas.', { size: 8.8 });
  const rows = [];
  for (const c of D.CLASSIC) {
    const tier = { boss_slime: 1, boss_eye: 2, boss_guardian: 3, boss_colossus: 4 }[c.key];
    const sw = X.SWORDS.find(s => s.tierLevel === tier && s.station);
    rows.push(['—', c.n, 'Progressão', N(c.hp), N(c.dmg), N(c.def), sw ? pad3(sw.num) + ' ' + sw.swordName : '—']);
  }
  let i = 0;
  for (let a = 1; a <= 6; a++) {
    for (const b of D.ATOS[a]) {
      i++;
      const sw = D.bossSword(b);
      rows.push([String(i), b.n, D.ACT_ROMAN[a], N(b.hp), N(b.dmg), N(b.def), sw ? pad3(sw.num) + ' ' + sw.n : '—']);
    }
  }
  d.table(['#', 'Chefe', 'Ato', 'Vida', 'Dano', 'Def.', 'Espada'], rows, [.06, .3, .1, .13, .1, .07, .24], { size: 7.4 });
  d.para('Total: **94 chefes** — 4 da progressão e 90 novos. As espadas 001 a 160 saem de receita; as 40 dos Tiers 9 e 10 saem destes chefes.', { size: 8.4 });
}

module.exports = { part4 };
