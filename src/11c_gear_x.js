/* ============================================================
   11c_gear_x: 50 minérios (+50 barras), 50 armaduras e 50 acessórios
   - 10 famílias: Braseiro, Geada, Corisco, Maré, Raiz, Véu, Alvorada,
     Relojoaria, Vazio e Origem — 5 peças de cada por família
   - armadura + acessórios da mesma família = bônus de conjunto
   - acessórios: 45 dropam de chefes (1 exclusivo por chefe) e 5 são
     forjados com os minérios novos
   Carregado depois de 01_data.js (T, tile, item, rec) e de 10b_gear_fx.js.
   ============================================================ */

const GFAM = {
  brasa: { n: 'Braseiro', col: '#f97316', desc: 'fogo, queimadura e explosões' },
  geada: { n: 'Geada', col: '#7dd3fc', desc: 'gelo, lentidão e congelamento' },
  corisco: { n: 'Corisco', col: '#fde047', desc: 'raios, carga elétrica e velocidade' },
  mare: { n: 'Maré', col: '#38bdf8', desc: 'água, cura e bolhas' },
  raiz: { n: 'Raiz', col: '#84cc16', desc: 'terra, defesa e espinhos' },
  veu: { n: 'Véu', col: '#a855f7', desc: 'sombras, crítico e roubo de vida' },
  aurora: { n: 'Alvorada', col: '#fbbf24', desc: 'luz, regeneração e caça aos mortos-vivos' },
  relogio: { n: 'Relojoaria', col: '#f472b6', desc: 'tempo, ecos e recarga' },
  vazio: { n: 'Vazio', col: '#818cf8', desc: 'gravidade, perfuração e singularidade' },
  origem: { n: 'Origem', col: '#f8fafc', desc: 'o primeiro metal, execução e renascimento' },
};
const GFAM_KEYS = Object.keys(GFAM);

// índice do tier dentro da família: T2, T4, T6, T8 e T10
const GTIER = [2, 4, 6, 8, 10];
const GORE_H = [2, 5, 10, 12, 14];        // poder de picareta exigido
const GORE_N = [130, 120, 110, 130, 150]; // veios espalhados pelo mundo
const GARM_DEF = [4, 11, 20, 34, 52];
const GARM_ST = ['anvil', 'anvil', 'advanvil', 'advanvil', 'forge'];

// ---------- 50 minérios ----------
// [família, nome, cor, forma do ícone 0-2, brilho]
const GORE_LIST = [
  // Braseiro
  ['brasa', 'Brasa Rúnica', '#d95a1e', 0, 0], ['brasa', 'Escória Viva', '#ff7a1a', 1, 0], ['brasa', 'Coral de Fogo', '#ff9a3c', 2, 1], ['brasa', 'Magma Negro', '#8a2a10', 0, 0], ['brasa', 'Coração de Forja', '#fbbf24', 1, 1],
  // Geada
  ['geada', 'Gelo Eterno', '#bfe8ff', 2, 0], ['geada', 'Cristal de Nevoeiro', '#9fd8f2', 2, 0], ['geada', 'Prata Glacial', '#d7ecf7', 0, 0], ['geada', 'Rachadura Polar', '#6fb4dc', 1, 0], ['geada', 'Lágrima de Inverno', '#e8f7ff', 2, 1],
  // Corisco
  ['corisco', 'Quartzo Tempestuoso', '#fde047', 2, 0], ['corisco', 'Ferro Magnético', '#c9c2a0', 0, 0], ['corisco', 'Estilhaço de Raio', '#fef08a', 1, 1], ['corisco', 'Núcleo de Íon', '#a8b8ff', 1, 0], ['corisco', 'Âmbar Elétrico', '#f59e0b', 2, 1],
  // Maré
  ['mare', 'Madrepérola', '#f0e6d2', 2, 0], ['mare', 'Sal Profundo', '#bae6fd', 0, 0], ['mare', 'Coral Abissal', '#f472b6', 1, 0], ['mare', 'Pérola Negra', '#3b3f52', 2, 0], ['mare', 'Alga Petrificada', '#7f9c8a', 0, 1],
  // Raiz
  ['raiz', 'Raiz de Ferro', '#8a6a3a', 1, 0], ['raiz', 'Musgo Mineral', '#84cc16', 0, 0], ['raiz', 'Seiva Fóssil', '#a16207', 2, 0], ['raiz', 'Casca de Pedra', '#9ca3af', 0, 0], ['raiz', 'Esmeralda Selvagem', '#22c55e', 2, 1],
  // Véu
  ['veu', 'Obsidiana Violeta', '#6d28d9', 1, 0], ['veu', 'Pó de Sombra', '#4c1d95', 0, 0], ['veu', 'Ametista Crepuscular', '#a855f7', 2, 1], ['veu', 'Carvão Noturno', '#1c1917', 0, 0], ['veu', 'Vidro Fumê', '#3f3f46', 1, 0],
  // Alvorada
  ['aurora', 'Ouro Solar', '#fbbf24', 2, 1], ['aurora', 'Cristal de Alvorada', '#fde68a', 2, 0], ['aurora', 'Prisma Branco', '#f8fafc', 1, 0], ['aurora', 'Quartzo Celeste', '#c7d2fe', 0, 0], ['aurora', 'Opala Radiante', '#fbcfe8', 2, 1],
  // Relojoaria
  ['relogio', 'Cobre Dourado', '#d4a017', 0, 0], ['relogio', 'Mola de Latão', '#c08a2e', 1, 0], ['relogio', 'Prata Cronométrica', '#dfe8f2', 2, 0], ['relogio', 'Cristal de Ampulheta', '#f9a8d4', 1, 1], ['relogio', 'Liga do Instante', '#eab308', 0, 1],
  // Vazio
  ['vazio', 'Fragmento de Vazio', '#818cf8', 2, 1], ['vazio', 'Ferro Estelar', '#6366f1', 0, 0], ['vazio', 'Ímã Gravitacional', '#a5b4fc', 1, 0], ['vazio', 'Quartzo do Abismo', '#4f46e5', 2, 0], ['vazio', 'Núcleo de Singularidade', '#312e81', 0, 1],
  // Origem
  ['origem', 'Adamante Primordial', '#f8fafc', 2, 1], ['origem', 'Oricalco do Começo', '#e2e8f0', 0, 0], ['origem', 'Minério do Alvorecer', '#c7d2fe', 1, 0], ['origem', 'Pedra do Gênese', '#fef3c7', 0, 1], ['origem', 'Coração do Mundo', '#fca5a5', 2, 1],
];

// onde cada tier de minério aparece (profundidade e hospedeiros)
const GORE_SITE = [
  { y0: 'surf', d0: 8, y1: 300, hosts: 'DS', bio: null },     // T2
  { y0: 170, d0: 0, y1: 380, hosts: 'S', bio: null },          // T4
  { y0: 280, d0: 0, y1: 410, hosts: 'S', bio: null },          // T6
  { y0: 400, d0: 0, y1: 455, hosts: 'AS', bio: null },         // T8
  { y0: 425, d0: 0, y1: 474, hosts: 'AS', bio: null },         // T10
];
// os minérios não ficam presos a bioma: os de tier alto precisam existir em qualquer mundo
const GORE_BIO = {};

// ---------- criação dos minérios ----------
const GORES = [];   // dados usados pelo gerador de mundo e pelos testes
GORE_LIST.forEach((row, k) => {
  const [fam, nome, cor, forma, brilho] = row;
  const t = k % 5;                      // posição dentro da família (tier)
  const key = 'or_' + fam + '_' + t;
  const tier = GTIER[t];
  const h = GORE_H[t] + ((t === 2 || t === 3) ? (k % 2) : 0);   // usa as 5 picaretas novas (10 a 14)
  // telhado de minério no mundo
  tile(key, { n: nome, h, t: .55 + t * .12, d: key, c: ['#7b8088', '#5a5e66', cor], x: 'ore', ore: cor, gem: brilho || forma === 2, l: brilho ? Lm(cor, .35) : null });
  item(key, nome, { tier, ic: ['ore2', cor, forma, brilho, 100 + k], desc: 'Minério de ' + GFAM[fam].n + '. Funde na Fornalha (3 minérios = 1 barra). Requer picareta com poder ' + h + '.' });
  item(key + '_bar', 'Barra de ' + nome, { tier, ic: ['bar2', cor, GFAM_KEYS.indexOf(fam), t, 300 + k], desc: 'Material de criação da família ' + GFAM[fam].n + '.' });
  rec(key + '_bar', 1, key + ':3', 'furnace');
  GORES.push({ key, fam, nome, cor, forma, brilho, tier, h, t, bio: GORE_BIO[fam] || null });
});
function Lm(cor, k) { const c = hex2rgb(cor); return [c[0] / 255 * k, c[1] / 255 * k, c[2] / 255 * k]; }

// ---------- 50 armaduras ----------
const GARMS = [];
const GARM_PIECE = ['Couraça', 'Peitoral', 'Manto', 'Placas', 'Égide'];
const GARM_TXT = {
  brasa: ['Acertos incendeiam o alvo (2 de dano/s por 2,5 s).', '+25% de dano em alvos em chamas; 25% de chance de incendiar.', 'Ao levar dano, explode em fogo ao redor (recarga de 6 s).', 'Deixa um rastro de brasas no chão enquanto corre.', 'Quase imune a lava e queima inimigos encostados.'],
  geada: ['Acertos deixam o alvo 18% mais lento.', '+4 de defesa depois de 1 s parado.', 'Escudo de gelo a cada 14 s (absorve dano).', 'Ao levar dano, congela e fere quem está perto (recarga de 8 s).', '+40% de dano em inimigos lentos ou congelados.'],
  corisco: ['+5% de velocidade de movimento.', 'Um raio atinge o inimigo mais próximo a cada 5 s.', '+10% de crítico enquanto se move.', '15% dos acertos saltam para outro inimigo.', 'Aura elétrica fere inimigos que encostam.'],
  mare: ['+15 de vida máxima.', 'Dentro da água, regenera 2 de vida por segundo.', 'Bolha de proteção a cada 16 s.', '+10 de dano enquanto estiver na água.', 'Regenera 1 de vida por segundo, sempre.'],
  raiz: ['+2 de defesa e +8 de vida.', 'Espinhos: devolve 15% do dano recebido.', '+4 de defesa depois de 0,8 s parado.', 'Ao cair de alto, gera uma onda de choque ao aterrissar.', '+35 de vida e defesa que cresce conforme você perde vida.'],
  veu: ['+5% de chance crítica.', 'Roubo de vida de 2% do dano causado.', '+9 de dano durante a noite.', 'Ao matar, ganha 1,2 s de evasão (+50% de esquiva).', '+25% de dano em inimigos abaixo de 35% de vida.'],
  aurora: ['Regenera 1 de vida por segundo.', '+22 de vida e +1 de defesa.', 'Aumenta muito a luz ao seu redor.', '+30% de dano contra mortos-vivos.', 'Aura sagrada: cura você e queima inimigos próximos.'],
  relogio: ['Recarga de poção 10% mais rápida.', '+6% de velocidade.', '10% de chance de repetir o golpe.', 'Libera o avanço (Shift) e reduz a recarga dele.', 'A cada 25 s, paralisa os inimigos por 1 s.'],
  vazio: ['+4 de dano.', 'Ignora 15% da defesa dos inimigos.', 'Plana ao segurar o pulo durante a queda.', 'Atrai de longe os itens dropados.', '+14 de dano e ignora mais 10% da defesa.'],
  origem: ['+6 de dano e +12 de vida.', '+8% de crítico e +20% de multiplicador crítico.', '+12 de dano.', '+50% de dano em inimigos abaixo de 15% de vida.', 'Uma vez a cada 150 s, renasce com 35% de vida.'],
};
GFAM_KEYS.forEach(fam => {
  for (let t = 0; t < 5; t++) {
    const ore = GORES[GFAM_KEYS.indexOf(fam) * 5 + t];
    const id = 'armx_' + fam + '_' + t;
    const nome = GARM_PIECE[t] + (t === 0 ? ' de ' : ' de ') + ore.nome;
    const def = GARM_DEF[t];
    item(id, nome, {
      type: 'armor', tier: GTIER[t], stack: 1, def, color: ore.cor, fam, mech: fam + '_' + t,
      ic: ['armor2', ore.cor, GFAM_KEYS.indexOf(fam), t, 500 + GFAM_KEYS.indexOf(fam) * 5 + t],
      desc: GARM_TXT[fam][t] + ' Conjunto ' + GFAM[fam].n + ' (defesa +' + def + ').',
    });
    rec(id, 1, ore.key + '_bar:' + [18, 22, 26, 30, 34][t] + (t ? ',celestial_frag:' + (t * 3) : ''), GARM_ST[t]);
    GARMS.push({ id, fam, t, def, ore });
  }
});

// ---------- 50 acessórios ----------
// [família, chave, nome, ícone, stats, texto, fonte] — fonte: 'b:<chefe>' ou 'craft'
const GACC_LIST = [
  // ---- Tier 2 (9) ----
  ['brasa', 'anel', 'Anel de Brasas', 'ring', { dmg: 2 }, 'Cada golpe incendeia o alvo (2 de dano/s por 3 s).', 'b:escorpiao'],
  ['geada', 'anel', 'Anel Gélido', 'ring', { dmg: 2, def: 1 }, 'Acertos deixam o alvo 22% mais lento por 2 s.', 'b:aguaviva'],
  ['corisco', 'anel', 'Anel do Corisco', 'ring', { dmg: 2, spd: .04 }, 'A cada 4 acertos, um raio salta para até 3 inimigos.', 'b:vespa'],
  ['mare', 'anel', 'Anel das Marés', 'ring', { dmg: 2, def: 2 }, 'Acertos seguidos aceleram seu ataque (até +30% de velocidade).', 'b:caranguejo'],
  ['raiz', 'anel', 'Anel de Pedra', 'ring', { def: 2, hp: 10 }, 'Ganha +1 de defesa a cada 20% de vida perdida (até +5).', 'b:carvalho'],
  ['veu', 'anel', 'Anel do Véu', 'ring', { crit: .05 }, 'O primeiro golpe em cada inimigo é sempre crítico.', 'b:teceda'],
  ['aurora', 'anel', 'Anel Solar', 'ring', { hp: 12 }, 'Regenera 1 de vida por segundo após 5 s sem levar dano.', 'b:cogumelo'],
  ['relogio', 'anel', 'Anel do Instante', 'ring', { spd: .06, crit: .04 }, '12% de chance de repetir o golpe na hora (eco).', 'b:corvo'],
  ['origem', 'anel', 'Anel do Primeiro', 'ring', { dmg: 5, hp: 15, def: 2, crit: .03 }, 'Atributos diretos: +5 dano, +15 vida, +2 defesa e +3% crítico.', 'b:slime'],
  // ---- Tier 4 (16) ----
  ['vazio', 'pingente', 'Pingente do Vazio', 'amulet', { dmg: 4 }, 'Ignora 30% da defesa dos inimigos.', 'b:golem_cristal'],
  ['veu', 'pingente', 'Pingente Vampírico', 'amulet', { crit: .04 }, 'Cura 3% do dano dos acertos críticos.', 'b:rei_ossos'],
  ['raiz', 'pingente', 'Pingente de Raízes', 'amulet', { def: 3 }, 'Ao aterrissar, empurra inimigos num raio de 70 e causa dano leve.', 'b:verme'],
  ['geada', 'pingente', 'Pingente de Gelo', 'amulet', { dmg: 4 }, 'A cada 3 acertos, congela o alvo por 0,8 s.', 'b:lich_gelo'],
  ['aurora', 'pingente', 'Pingente da Aurora', 'amulet', { hp: 20, def: 1 }, 'Poções curam +12% da vida máxima e removem debuffs.', 'b:banshee'],
  ['brasa', 'fole', 'Fole do Ferreiro', 'bellows', { dmg: 5 }, 'A cada 6 golpes, sopra um cone de fogo na direção da mira.', 'b:minotauro'],
  ['relogio', 'pingente', 'Pingente de Areia', 'amulet', { spd: .05 }, 'Recarga das poções 25% mais rápida.', 'b:relojoeiro'],
  ['raiz', 'manopla', 'Manopla Sísmica', 'gauntlet', { dmg: 4, def: 2 }, 'A cada 3 golpes, uma onda de choque corre pelo relevo.', 'b:escaravelho'],
  ['veu', 'manopla', 'Manopla do Executor', 'gauntlet', { dmg: 5 }, '+40% de dano em inimigos abaixo de 30% de vida.', 'b:cavaleiro'],
  ['brasa', 'coracao', 'Coração de Magma', 'heart', { hp: 25 }, 'Ao levar dano, libera uma nova de fogo que incendeia e empurra (recarga de 5 s).', 'b:fenix_cinzas'],
  ['corisco', 'botas', 'Botas do Trovão', 'boots', { spd: .05 }, 'Libera o avanço no ar (Shift) — um salto elétrico.', 'b:vento'],
  ['mare', 'pingente', 'Pingente de Coral', 'amulet', { hp: 18 }, 'Na água, regenera 2% da vida máxima por segundo e cura ao entrar.', 'b:hidra'],
  ['aurora', 'botas', 'Botas Leves', 'boots', { spd: .08 }, 'Planeia ao segurar o pulo durante a queda.', 'b:mariposa'],
  ['vazio', 'botas', 'Botas do Abismo', 'boots', { def: 3 }, 'Cai devagar e leva metade do dano de lava.', 'b:gargula'],
  ['corisco', 'pingente', 'Pingente Estático', 'amulet', { dmg: 3 }, 'Acumula carga ao correr: o próximo golpe causa até +100% de dano.', 'b:eye'],
  ['raiz', 'couraca', 'Casca Viva', 'shield', { def: 5 }, 'Espinhos: devolve 25% do dano recebido.', 'b:guardian'],
  // ---- Tier 7 (13 de chefe + 3 craftáveis) ----
  ['veu', 'manto', 'Manto de Sombras', 'cloak', { dmg: 6 }, 'Ao matar, fica 1,5 s com +60% de esquiva.', 'b:ceifador'],
  ['vazio', 'manopla', 'Manopla Devoradora', 'gauntlet', { dmg: 7 }, 'Roubo de vida de 6% e sangramento em cada golpe.', 'b:vampiro'],
  ['geada', 'manopla', 'Manopla do Inverno', 'gauntlet', { dmg: 7 }, 'Alvos congelados levam +35% e soltam estilhaços que ferem os próximos.', 'b:medusa'],
  ['mare', 'nadadeira', 'Nadadeiras Abissais', 'fin', { spd: .06 }, 'Nada 60% mais rápido e ganha dano dentro da água.', 'b:sereia'],
  ['geada', 'manto', 'Manto de Cristal', 'cloak', { def: 6 }, 'Um escudo de gelo absorve dano a cada 15 s.', 'b:armadura'],
  ['brasa', 'botas', 'Botas de Escória', 'boots', { spd: .05 }, 'Deixa um rastro de brasas que queima quem passa.', 'b:dragao'],
  ['relogio', 'manopla', 'Manopla do Pulso', 'gauntlet', { dmg: 6 }, 'Cada acerto reduz a recarga do avanço e da poção.', 'b:gemeos'],
  ['aurora', 'manopla', 'Manopla Radiante', 'gauntlet', { dmg: 6 }, '+50% de dano contra mortos-vivos e queima sombras.', 'b:prisma'],
  ['vazio', 'anel', 'Anel Gravitacional', 'ring', { dmg: 5 }, 'Atrai itens e puxa inimigos próximos para perto de você.', 'b:magnetar'],
  ['brasa', 'manopla', 'Manopla do Incendiário', 'gauntlet', { dmg: 7 }, 'Inimigos que morrem em chamas explodem.', 'b:titalava'],
  ['corisco', 'coroa', 'Coroa de Nuvens', 'crown', { dmg: 5, crit: .05 }, 'Um raio cai no inimigo mais próximo a cada 4 s.', 'b:tempestade'],
  ['vazio', 'singularidade', 'Núcleo Singular', 'void', { dmg: 8 }, 'A cada 12 acertos, abre um buraco negro que puxa e explode.', 'b:devorador'],
  ['raiz', 'botas', 'Botas de Terra', 'boots', { def: 4 }, 'Sem dano de queda; cair de alto gera uma onda de choque.', 'b:espelho'],
  ['geada', 'botas', 'Botas Nevadas', 'boots', { spd: .05 }, '+30% de velocidade por 2 s ao acertar um alvo lento.', 'craft'],
  ['mare', 'manopla', 'Manopla da Maré', 'gauntlet', { dmg: 5, def: 2 }, 'Golpes geram uma onda que empurra todos os inimigos próximos.', 'craft'],
  ['relogio', 'botas', 'Botas do Momento', 'boots', { spd: .07 }, 'Libera o avanço (Shift) no chão, com recarga de 2,4 s.', 'craft'],
  // ---- Tier 10 (6 de chefe + colosso + 2 craftáveis) ----
  ['aurora', 'coroa', 'Coroa da Alvorada', 'crown', { hp: 30, def: 4 }, 'Aura sagrada: queima inimigos num raio de 78 e ilumina tudo.', 'b:imperador_solar'],
  ['veu', 'botas', 'Botas Silenciosas', 'boots', { spd: .1 }, 'Parado por 1 s: +50% de esquiva e +25% no próximo golpe.', 'b:lua_sangrenta'],
  ['relogio', 'ampulheta', 'Ampulheta Partida', 'hourglass', { dmg: 8 }, 'A cada 20 s, congela todos os inimigos próximos por 1,2 s.', 'b:tempo'],
  ['corisco', 'manopla', 'Manopla Condutora', 'gauntlet', { dmg: 9 }, '25% dos acertos saltam para outro inimigo próximo.', 'b:pulsar'],
  ['mare', 'bolha', 'Bolha Protetora', 'bubble', { hp: 35 }, 'Uma bolha absorve dano a cada 12 s.', 'b:leviata'],
  ['origem', 'pingente', 'Pingente do Último Nome', 'amulet', { dmg: 10 }, 'Executa inimigos comuns abaixo de 12% de vida.', 'b:arauto'],
  ['origem', 'coroa', 'Coroa da Origem', 'crown', { hp: 20, def: 5 }, 'Uma vez a cada 120 s, renasce com metade da vida.', 'b:colossus'],
  ['origem', 'botas', 'Botas do Começo', 'boots', { spd: .12 }, '+12% de velocidade e pulo mais alto.', 'craft'],
  ['origem', 'manopla', 'Manopla do Gênese', 'gauntlet', { dmg: 12 }, 'O primeiro golpe em cada inimigo causa o dobro de dano.', 'craft'],
];

const GACCS = [];
const GACC_VAR = {};   // desenho próprio: índice da peça dentro do seu tipo (0, 1, 2…)
GACC_LIST.forEach(([fam, key, nome, icone, stats, txt, fonte], idx) => {
  // a lista já está ordenada por tier: 9 de T2, 16 de T4, 16 de T7 e 9 de T10
  const tier = idx < 9 ? 2 : idx < 25 ? 4 : idx < 41 ? 7 : 10;
  const id = 'accx_' + fam + '_' + key;
  item(id, nome, {
    type: 'acc', tier, stack: 1, acc: stats, fam, mech: fam + '_' + key,
    ic: ['acc2', GFAM[fam].col, icone, tier, 700 + idx, GACC_VAR[icone] = (GACC_VAR[icone] === undefined ? 0 : GACC_VAR[icone] + 1)],
    desc: txt + ' Conjunto ' + GFAM[fam].n + '.',
  });
  GACCS.push({ id, fam, key, nome, stats, txt, fonte, tier });
});

// ---------- 5 picaretas novas (poder 10 a 14) ----------
const GPICKS = [
  ['pick_obsidiana', 'Picareta de Obsidiana', 10, 8.0, '#4c1d95', 6, 'adamantite_bar:20,celestial_frag:10,obsidian:20'],
  ['pick_estelar', 'Picareta Estelar', 11, 9.5, '#a5b4fc', 7, 'or_aurora_2_bar:12,or_corisco_2_bar:12,celestial_bar:8'],
  ['pick_vazio', 'Picareta do Vazio', 12, 11.0, '#6366f1', 8, 'or_vazio_2_bar:14,or_vazio_1_bar:10,e_time:8'],
  ['pick_primordial', 'Picareta Primordial', 13, 13.0, '#22d3ee', 9, 'or_origem_1_bar:14,or_vazio_2_bar:10,e_time:10'],
  ['pick_origem', 'Picareta da Origem', 14, 15.0, '#f8fafc', 10, 'or_origem_2_bar:16,or_aurora_2_bar:12,mythic_core:2'],
];
GPICKS.forEach(([id, n, pw, spd, c, t, ing]) => {
  item(id, n, { type: 'pick', tier: t, stack: 1, pow: pw, spd, ic: ['pick2', c, t, 900 + GPICKS.findIndex(q => q[0] === id)], desc: 'Mineração: poder ' + pw + ' · velocidade ' + spd.toFixed(2) + 'x. Mina os minérios mais duros do jogo.' });
  rec(id, 1, ing, 'forge');
});

// receitas dos 5 acessórios forjáveis
const GACC_CRAFT = [
  ['accx_geada_botas', 1, 'or_geada_3_bar:8,or_geada_2_bar:6,frost_shard:20,e_ice:6', 'advanvil'],
  ['accx_mare_manopla', 1, 'or_mare_2_bar:8,or_mare_1_bar:6,orichalcum_bar:8,e_water:6', 'advanvil'],
  ['accx_relogio_botas', 1, 'or_relogio_2_bar:10,or_relogio_3_bar:8,e_time:8', 'advanvil'],
  ['accx_origem_botas', 1, 'or_origem_4_bar:10,or_origem_2_bar:8,celestial_bar:10', 'forge'],
  ['accx_origem_manopla', 1, 'or_origem_4_bar:14,or_origem_3_bar:10,mythic_core:1', 'forge'],
];
GACC_CRAFT.forEach(([id, n, ing, st]) => rec(id, n, ing, st));

// ---------- chefes → acessórios ----------
// 45 chefes (os 50 novos + os 4 clássicos) têm um acessório exclusivo.
const BX_ACC = {};
GACCS.forEach(a => { const m = a.fonte.match(/^b:(.+)$/); if (m) BX_ACC[m[1]] = a.id; });

// nomes dos chefes clássicos usados no mapa acima
const CLASSIC_ACC = { slime: BX_ACC.slime, eye: BX_ACC.eye, guardian: BX_ACC.guardian, colossus: BX_ACC.colossus };
function gearBossDrop(d, dropItem, x, y) { const id = BX_ACC[d.id]; if (id) dropItem(id, 1, x, y, 0, -120); }
function gearClassicDrop(kind, dropItem, x, y) { const id = CLASSIC_ACC[kind]; if (id) dropItem(id, 1, x, y, 0, -150); }

// ---------- colocação dos minérios no mundo ----------
function gearPlaceOres(ores, T, S, Y_HELL, bio, W) {
  for (const o of GORES) {
    const site = GORE_SITE[o.t];
    const hosts = site.hosts === 'DS' ? [T.stone, T.dirt] : site.hosts === 'S' ? [T.stone] : site.hosts === 'AS' ? [T.ash, T.stone] : [T.ash];
    const y0 = site.y0 === 'surf' ? (x => S(x) + site.d0) : site.y0;
    const y1 = o.t >= 3 ? Math.min(474, site.y1) : site.y1;
    const count = GORE_N[o.t];
    const n = Math.round(count / 5) * 2 + 4;   // veios por minério
    ores(T[o.key], n, y0, y1, 3 + o.t, 6 + o.t * 2, hosts, o.bio);
  }
}

// ---------- conjuntos: resumo para a interface ----------
function gearSetInfo(fam) {
  const F = GFAM[fam]; if (!F) return null;
  const arms = GARMS.filter(a => a.fam === fam), accs = GACCS.filter(a => a.fam === fam);
  return { fam, nome: F.n, col: F.col, desc: F.desc, armaduras: arms.length, acessorios: accs.length };
}


// texto de origem mostrado no tooltip (resolve o nome do chefe em tempo de execução)
function gearSourceText(id) {
  const a = GACCS.find(x => x.id === id);
  if (a) {
    const m = a.fonte.match(/^b:(.+)$/);
    if (m) { const d = (typeof BX !== 'undefined') && BX[m[1]]; return 'Dropa de: <b style="color:#fbbf24">' + (d ? d.n : m[1]) + '</b>'; }
    return 'Forjado: veja a receita abaixo.';
  }
  const ar = GARMS.find(x => x.id === id);
  if (ar) return 'Forjado na ' + (STATION_NAME[GARM_ST[ar.t]] || 'Bigorna') + '.';
  const or = GORES.find(x => x.key === id);
  if (or) return 'Minerado com picareta de poder ' + or.h + ' ou mais.';
  return '';
}
