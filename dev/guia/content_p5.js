'use strict';
// Parte 5: as 429 conquistas.
const D = require('./data');
const { X } = D;

const pad3 = (n) => String(n).padStart(3, '0');
const RAR = (r) => X.ACH_RAR[r] || { n: '—', col: '#cbd5e1' };

function part5(d) {
  d.partBand(5, 'Conquistas', 'As 429 conquistas do jogo, por categoria: como aparecem, quanto valem e a lista completa.');

  d.h2('5.1', 'Como funcionam', { mark: 's51', parent: 'p5' });
  d.para('O jogo tem **429 conquistas**, divididas em **10 categorias** e **4 raridades**. A lista abre pelo botão **Conquistas**, que está no menu inicial e no menu de pausa. Cada conquista mostra o progresso (por exemplo, 137/500 inimigos) e as concluídas ficam marcadas com a cor da raridade. O progresso é salvo junto com o mundo — e as conquistas de “criar mundos” e “jogar X horas” contam a vida inteira do jogo, não só um mundo.');
  const counts = {};
  for (const a of X.ACH_LIST) counts[a.cat] = (counts[a.cat] || 0) + 1;
  const what = {
    sw: 'Ter cada uma das 200 espadas no histórico de criação.',
    bx: 'Derrotar cada um dos 94 chefes, incluindo a Apoteose.',
    prog: 'Marcos da aventura: tiers completos, estágios do mundo, atos fechados e sigilos.',
    cbt: 'Inimigos derrotados, dano em um golpe, mortes, lutas contra chefes e horários.',
    mine: 'Blocos minerados, construções, picaretas, profundidade e o Inferno.',
    gear: 'Acessórios equipados, armaduras, conjuntos completos e picaretas.',
    expl: 'Biomas e camadas visitados, dias sobrevividos, distância andada e baús.',
    econ: 'Moedas, compras e vendas, cura na Enfermaria e NPCs morando no mundo.',
    world: 'Mundos criados, tempo de jogo, backup e transferência entre aparelhos.',
    sec: 'Os segredos: a Apoteose, o Axioma, a Fênix e os chefes sem escolta.',
  };
  const rows = X.ACH_CATS.map(c => [c.n, String(counts[c.k] || 0), what[c.k] || '—']);
  rows.push(['Total', '429', '—']);
  d.table(['Categoria', 'Qtd.', 'O que pede'], rows, [.34, .1, .56]);
  d.para('As quatro raridades são **Comum** (99), **Raro** (113), **Épico** (119) e **Lendário** (98). A raridade é só uma etiqueta de dificuldade — não dá item nem vantagem; é o troféu de ter feito. As conquistas de espada seguem o tier (Tiers 1 e 2 são Comuns, 3 e 4 Raras, 5 a 7 Épicas e 8 a 10 Lendárias).');

  // ---------------- 5.2 espadas ----------------
  d.h2('5.2', 'Espadas (200)', { mark: 's52', parent: 'p5' });
  d.para('Uma conquista por espada: **tenha a espada no histórico de criação** (forjada ou ganha de chefe). As vinte de cada tier estão na ordem do catálogo.', { size: 8.8 });
  for (let t = 1; t <= 10; t++) {
    const ss = D.swordsOfTier(t);
    d.h3(`Tier ${t} · ${D.tierOf(t).n.replace(/^Tier \d+: /, '')} — raridade ${RAR(t <= 2 ? 1 : t <= 4 ? 2 : t <= 7 ? 3 : 4).n}`, { size: 8.4, top: 2, keep: 40 });
    d.nameGrid(ss.map(s => pad3(s.num) + ' ' + s.swordName), { cols: 4, size: 7.2 });
  }

  // ---------------- 5.3 chefes ----------------
  d.h2('5.3', 'Chefes (94)', { mark: 's53', parent: 'p5', break: true });
  d.para('Uma conquista por chefe. As quatro primeiras são da progressão; depois vêm os 90 novos, na ordem dos atos. A descrição de cada uma lembra a mecânica da luta.', { size: 8.8 });
  const bx = X.ACH_LIST.filter(a => a.cat === 'bx');
  d.nameGrid(bx.map(a => a.n), { cols: 3, size: 7.4 });
  d.para('As conquistas de chefe mais difíceis são **Lendárias**: a Apoteose, o Axioma, a Fênix (que renasce) e os segredos do Ato VI. As dos quatro chefes da progressão e dos primeiros atos são Comuns ou Raras.', { size: 8.4 });

  // ---------------- 5.4 demais ----------------
  d.h2('5.4', 'As outras 135 conquistas', { mark: 's54', parent: 'p5', break: true });
  d.para('Progressão, combate, mineração e construção, equipamento, exploração, economia e NPCs, mundos e segredos — com a descrição e a raridade de cada uma.', { size: 8.8 });
  const order = ['prog', 'cbt', 'mine', 'gear', 'expl', 'econ', 'world', 'sec'];
  for (const k of order) {
    const list = X.ACH_LIST.filter(a => a.cat === k);
    if (!list.length) continue;
    const cat = D.ACH_CAT_BY_KEY[k];
    d.h3(`${cat.n} — ${list.length}`, { size: 9.4, top: 4, keep: 60 });
    d.table(['Conquista', 'Descrição', 'Raridade'], list.map(a => [a.n, a.d, RAR(a.r).n]), [.26, .58, .16], { size: 7.6 });
  }
  d.callout('ok', 'Conquistas de segredo', 'No jogo, as 12 conquistas de **Segredos** aparecem como **???**: sem nome, sem descrição, sem raridade e sem contador, até você desbloquear. Só então o texto é revelado. Esta lista é a cola: algumas dependem de coisas que ninguém faz sem querer — como deixar a Fênix renascer, quebrar o Axioma na hora certa ou voltar de uma luta com 1 de vida.');
}

module.exports = { part5 };
