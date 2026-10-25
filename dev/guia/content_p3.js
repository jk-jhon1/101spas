'use strict';
// Parte 3: as 200 espadas (tabela de tiers, visão geral em grade e fichas).
const D = require('./data');
const { X } = D;

const png = (canvas) => canvas.toBuffer('image/png');
const pad3 = (n) => String(n).padStart(3, '0');

function tierTable(d) {
  const rows = [];
  for (let t = 1; t <= 10; t++) {
    const ss = D.swordsOfTier(t);
    const dmg = [Math.min(...ss.map(s => s.baseDamage)), Math.max(...ss.map(s => s.baseDamage))];
    const dps = ss.reduce((a, s) => a + s.dps, 0) / ss.length;
    rows.push([
      `T${t} · ${D.tierOf(t).n.replace(/^Tier \d+: /, '')}`,
      `${D.fmt(dmg[0])}–${D.fmt(dmg[1])}`,
      D.fmt(dps),
      D.tierOf(t).mech,
      D.stationOf(ss[0].station),
    ]);
  }
  d.table(['Tier', 'Dano', 'DPS médio', 'Mecânica da faixa', 'Estação'], rows, [.19, .14, .1, .42, .15], { size: 7.6 });
}

function part3(d, A) {
  d.partBand(3, 'As 200 espadas', 'O catálogo completo: os 10 tiers, a grade com todas as espadas e uma ficha por espada, com atributos, mecânica e como conseguir.');

  d.h2('3.1', 'Como ler o catálogo', { mark: 's31', parent: 'p3' });
  d.para('As 200 espadas estão divididas em **10 tiers de 20**. Cada tier tem uma cor, uma estação de criação e uma faixa de mecânicas. O número da espada (001 a 200) é a ordem do catálogo — e é o mesmo número da conquista correspondente. As **40 últimas** (Tiers 9 e 10) não têm receita: caem de chefes dos Atos V e VI.');
  tierTable(d);
  d.para('A **média de DPS** cresce de 17 no Tier 1 a 1.328 no Tier 10. O dano final ainda depende dos acessórios, do crítico e da defesa do alvo (seção 1.7).');
  d.callout('info', 'A ficha de cada espada', 'À esquerda, o ícone e o número; no meio, o nome (na cor do tier), a linha de atributos e a mecânica única; à direita, como conseguir — a receita com a estação ou o chefe que a solta. A estrela ★ marca as 40 espadas que só caem de chefe.');

  d.h2('3.2', 'Visão geral: as 200 em uma olhada', { mark: 's32', parent: 'p3' });
  d.para('Cada linha é um tier; o número embaixo de cada espada é o número dela no catálogo. A cor do número é a cor do tier.');
  for (let t = 1; t <= 10; t++) {
    const ss = D.swordsOfTier(t);
    const gc = A.swordGrid(ss, 20, 44), gw = 470, gh = Math.round(gw * gc.height / gc.width), gb = png(gc);
    d.ensure(gh + 30);
    d.h3(`Tier ${t} · ${D.tierOf(t).n.replace(/^Tier \d+: /, '')} (${pad3(ss[0].num)}–${pad3(ss[19].num)})`, { size: 8.6, top: 2, keep: gh + 20 });
    d.imageBlock(gb, gw, gh);
  }

  // fichas por tier
  for (let t = 1; t <= 10; t++) {
    const ss = D.swordsOfTier(t);
    const tier = D.tierOf(t);
    if (t > 1) d.newPage();
    d.h2(`3.${t + 2}`, `Tier ${t} · ${tier.n.replace(/^Tier \d+: /, '')}`, { mark: 's3' + (t + 2), parent: 'p3' });
    d.para(`**${ss.length} espadas**, do número ${pad3(ss[0].num)} ao ${pad3(ss[19].num)} · estação: **${D.stationOf(ss[0].station)}** · ${tier.mech}`, { size: 8.6, gap: 5 });
    for (const sw of ss) {
      d.swordCard(sw, {
        icon: A.icon(sw.id, 4),
        stats: D.swordStats(sw),
        mech: sw.txt,
        rightLines: D.swordHow(sw),
      });
    }
  }

  // 3.13 as 40 de chefe
  d.newPage();
  d.h2('3.13', 'As 40 espadas que só caem de chefe', { mark: 's313', parent: 'p3' });
  d.para('Nenhuma das espadas dos Tiers 9 e 10 tem receita. Cada uma cai de um chefe específico dos Atos V e VI, **na primeira vitória** (depois disso o chefe passa a soltar materiais). São os troféus do fim do jogo: leve o Ato V inteiro para fechar o Tier 9 e o Ato VI inteiro para fechar o Tier 10 — e a última, a 200 Apoteose, é da Apoteose — o chefe final do jogo.');
  const rows = [];
  for (const sw of X.SWORDS.filter(s => s.dropOnly)) {
    const b = X.BXLIST.find(x => x.id === sw.dropFrom);
    rows.push([pad3(sw.num), sw.swordName, 'T' + sw.tierLevel, b ? b.n : (sw.dropFromName || '—'), b ? 'Ato ' + D.ACT_ROMAN[b.act] : '—']);
  }
  d.table(['Nº', 'Espada', 'Tier', 'Chefe', 'Ato'], rows, [.08, .38, .1, .3, .14], { size: 7.8 });
}

module.exports = { part3 };
