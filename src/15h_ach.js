/* ============================================================
   15h_ach: conquistas do jogo (429), painel, progresso e ganchos de save.
   Regras:
   - toda conquista tem id único, categoria, raridade (1..4) e uma função p() -> [atual, meta];
   - as 200 espadas e os 94 chefes são GERADOS a partir de SWORDS/BXLIST (nunca ficam dessincronizados);
   - o resto é escrito à mão, sempre olhando para contadores baratos (G.ach.st) e para o estado do jogo;
   - achTick() roda a cada 0,6 s dentro do laço; os ganchos só marcam que algo mudou.
   Estado salvo: G.ach = { un:{id:1}, seen:{itemId:1}, bio:{nome:1}, lay:{camada:1}, st:{contador}, max:{recorde} }.
   ============================================================ */
const ACH_CATS = [
  { k: 'sw', n: 'Espadas', col: '#fbbf24', ic: '⚔' },
  { k: 'bx', n: 'Chefes', col: '#f87171', ic: '☠' },
  { k: 'prog', n: 'Progressão', col: '#22d3ee', ic: '★' },
  { k: 'cbt', n: 'Combate', col: '#fb923c', ic: '⚡' },
  { k: 'mine', n: 'Mineração e construção', col: '#a3e635', ic: '⛏' },
  { k: 'gear', n: 'Equipamento', col: '#a78bfa', ic: '🛡' },
  { k: 'expl', n: 'Exploração', col: '#34d399', ic: '🧭' },
  { k: 'econ', n: 'Economia e NPCs', col: '#facc15', ic: '●' },
  { k: 'world', n: 'Mundos', col: '#60a5fa', ic: '🗺' },
  { k: 'sec', n: 'Segredos', col: '#e879f9', ic: '?' },
];
const ACH_RAR = [null, { n: 'Comum', col: '#cbd5e1' }, { n: 'Raro', col: '#38bdf8' }, { n: 'Épico', col: '#a78bfa' }, { n: 'Lendário', col: '#fbbf24' }];
const ACH = {}, ACH_LIST = [];
const ACH_NOW = () => Date.now();

// ---------- estado ----------
function achS() {
  const g = G;
  if (!g.ach || typeof g.ach !== 'object') g.ach = {};
  const a = g.ach;
  if (!a.un || typeof a.un !== 'object') a.un = {};
  if (!a.seen || typeof a.seen !== 'object') a.seen = {};
  if (!a.bio || typeof a.bio !== 'object') a.bio = {};
  if (!a.lay || typeof a.lay !== 'object') a.lay = {};
  if (!a.st || typeof a.st !== 'object') a.st = {};
  if (!a.max || typeof a.max !== 'object') a.max = {};
  return a;
}
const ac = k => { const s = G.ach && G.ach.st; return (s && +s[k]) || 0; };
const ax = k => { const s = G.ach && G.ach.max; return (s && +s[k]) || 0; };
const achSeen = id => !!(G.ach && G.ach.seen && G.ach.seen[id]);
function achStat(k, n) { const a = achS(); a.st[k] = (a.st[k] || 0) + (n === undefined ? 1 : n); _achDirty = true; }
function achMax(k, v) { const a = achS(); if ((a.max[k] || 0) < v) { a.max[k] = v; _achDirty = true; } }
function achSee(id) { if (!id || !IT[id]) return; const a = achS(); if (!a.seen[id]) { a.seen[id] = 1; _achDirty = true; } }
const achSeenN = list => list.reduce((n, id) => n + (achSeen(id) ? 1 : 0), 0);
const achFlag = (id) => () => [G.flags && G.flags[id] ? 1 : 0, 1];

// ---------- registro ----------
function ach(id, cat, n, d, p, r) {
  if (ACH[id]) return ACH[id];
  const o = { id, cat, n, d, r: r || 1, p };
  ACH[id] = o; ACH_LIST.push(o); return o;
}
const achDone = o => !!(G.ach && G.ach.un && G.ach.un[o.id]);
function achProg(o) { try { const r = o.p() || [0, 1]; const goal = Math.max(.0001, +r[1] || 1); return [Math.max(0, Math.min(goal, +r[0] || 0)), goal]; } catch (e) { return [0, 1]; } }
function achCount() { let n = 0; for (const o of ACH_LIST) if (achDone(o)) n++; return n; }
function achPct() { return Math.round(achCount() / ACH_LIST.length * 100); }

// ---- 200 espadas (raridade pelo tier) ----
const tierRar = t => t <= 2 ? 1 : t <= 4 ? 2 : t <= 7 ? 3 : 4;
for (const s of SWORDS) ach('sw_' + s.id, 'sw', s.swordName, `${String(s.num).padStart(3, '0')} · ${TIERS[s.tierLevel].n} — ` + (s.dropOnly ? 'não se forja: cai do chefe ' + (s.dropFromName || 'do fim do jogo') + '.' + (s.sealedAll ? ' Selada: só depois de derrotar todos os chefes do jogo.' : '') : 'forje e tenha esta espada no histórico.'), () => [achSeen(s.id) ? 1 : 0, 1], tierRar(s.tierLevel));

// ---- 94 chefes (4 clássicos + 90 novos) ----
const CLASSIC = [['slime', 'Rei Slime', 'Derrote o Rei Slime (Coroa de Gosma).', 1], ['eye', 'Olho Colossal', 'Derrote o Olho Colossal (Lente Suspeita, à noite).', 1], ['guardian', 'Guardião do Abismo', 'Derrote o Guardião do Abismo e inicie o Hardmode.', 2], ['colossus', 'Colosso Estelar', 'Derrote o Colosso Estelar (Coração Estelar).', 3]];
for (const [k, n, d, r] of CLASSIC) ach('cl_' + k, 'bx', n, d, achFlag(k), r);
for (const b of BXLIST) ach('bx_' + b.id, 'bx', b.n, `${BX_ACTS[b.act].n} · ` + (b.mech.length > 150 ? b.mech.slice(0, 150).replace(/[\s,;:.]+$/, '') + '…' : b.mech), achFlag(b.id), b.act <= 2 ? 1 : b.act <= 4 ? 2 : b.act === 5 ? 3 : 4);

// ---------- progressão ----------
const allSw = () => SWORDS.filter(s => achSeen(s.id)).length;
const tierSw = t => () => [SWORDS.filter(s => s.tierLevel === t && achSeen(s.id)).length, 20];
const actBosses = a => BXLIST.filter(b => b.act === a);
const actKilled = a => actBosses(a).filter(b => G.flags && G.flags[b.id]).length;
const sigilsSeen = () => BXLIST.filter(b => achSeen('sg_' + b.id)).length;
ach('prog_first', 'prog', 'Primeiro brilho', 'Obtenha o seu primeiro item.', () => [Math.min(1, Object.keys((G.ach && G.ach.seen) || {}).length), 1], 1);
ach('prog_sw50', 'prog', 'Colecionador', 'Tenha 50 espadas diferentes no histórico.', () => [allSw(), 50], 2);
ach('prog_sw100', 'prog', 'Arsenal respeitável', 'Tenha 100 espadas diferentes.', () => [allSw(), 100], 3);
ach('prog_sw150', 'prog', 'Quase todas', 'Tenha 150 espadas diferentes.', () => [allSw(), 150], 3);
ach('prog_sw200', 'prog', 'As 200 espadas', 'Tenha as 200 espadas do jogo.', () => [allSw(), 200], 4);
for (let t = 1; t <= 10; t++) ach('prog_t' + t, 'prog', `Tier ${t} completo`, `Obtenha as 20 espadas do ${TIERS[t].n}.`, tierSw(t), t >= 9 ? 4 : t >= 7 ? 3 : 2);
ach('prog_stage1', 'prog', 'O mundo muda', 'Chegue ao estágio 1 (depois do Olho Colossal).', () => [Math.min(G.stage, 1), 1], 1);
ach('prog_stage2', 'prog', 'Hardmode', 'Inicie o Hardmode (Guardião do Abismo).', () => [G.stage >= 2 ? 1 : 0, 1], 2);
ach('prog_stage3', 'prog', 'Além do Colosso', 'Chegue ao estágio 3 do mundo.', () => [G.stage >= 3 ? 1 : 0, 1], 3);
ach('prog_classic4', 'prog', 'A velha guarda', 'Derrote os quatro chefes clássicos.', () => [CLASSIC.filter(c => G.flags && G.flags[c[0]]).length, 4], 3);
ach('prog_craft1', 'prog', 'Mãos à obra', 'Crie o seu primeiro item.', () => [Math.min(ac('crafted'), 1), 1], 1);
ach('prog_craft100', 'prog', 'Artesão', 'Crie 100 itens.', () => [ac('crafted'), 100], 2);
ach('prog_craft1000', 'prog', 'Fábrica', 'Crie 1.000 itens.', () => [ac('crafted'), 1000], 3);
ach('prog_forge', 'prog', 'Forja Celeste', 'Crie um item na Forja Celeste.', () => [Math.min(ac('forge'), 1), 1], 2);
ach('prog_crystal1', 'prog', 'Coração maior', 'Use o seu primeiro Cristal de Vida.', () => [Math.min(G.P ? G.P.crystals : 0, 1), 1], 1);
ach('prog_crystal15', 'prog', 'Vida máxima', 'Chegue a 15 Cristais de Vida.', () => [G.P ? G.P.crystals : 0, 15], 3);
for (let a = 1; a <= 6; a++) ach('prog_act' + a, 'prog', 'Ato ' + a + ' completo', `Derrote os ${actBosses(a).length} chefes do ${BX_ACTS[a].n}.`, () => [actKilled(a), actBosses(a).length], a >= 5 ? 3 : 2);
ach('prog_sigil1', 'prog', 'Invocador', 'Crie o seu primeiro sigilo de chefe.', () => [Math.min(sigilsSeen(), 1), 1], 1);
ach('prog_sigil30', 'prog', 'Coleção de sigilos', 'Tenha 30 sigilos diferentes.', () => [sigilsSeen(), 30], 3);
ach('prog_sigil_all', 'prog', 'Todos os sigilos', 'Tenha os 90 sigilos dos chefes novos.', () => [sigilsSeen(), 90], 4);
ach('prog_t9', 'prog', 'Divino', 'Obtenha uma espada do Tier 9 (cai de chefe do Ato V).', () => [SWORDS.filter(s => s.tierLevel === 9 && achSeen(s.id)).length, 1], 3);
ach('prog_t10', 'prog', 'Origem', 'Obtenha uma espada do Tier 10 (cai de chefe do Ato VI).', () => [SWORDS.filter(s => s.tierLevel === 10 && achSeen(s.id)).length, 1], 4);
ach('prog_apoteose', 'prog', 'Fim de tudo', 'Derrote a Apoteose, o chefe mais forte do jogo.', achFlag('apoteose'), 4);

// ---------- combate ----------
const K = () => G.kills || 0;
ach('cbt_k1', 'cbt', 'Primeiro abate', 'Derrote um inimigo.', () => [Math.min(K(), 1), 1], 1);
ach('cbt_k25', 'cbt', 'Caçador', 'Derrote 25 inimigos.', () => [K(), 25], 1);
ach('cbt_k100', 'cbt', 'Matador', 'Derrote 100 inimigos.', () => [K(), 100], 2);
ach('cbt_k500', 'cbt', 'Exterminador', 'Derrote 500 inimigos.', () => [K(), 500], 2);
ach('cbt_k2000', 'cbt', 'Lenda do campo', 'Derrote 2.000 inimigos.', () => [K(), 2000], 3);
ach('cbt_k10000', 'cbt', 'Guerra sem fim', 'Derrote 10.000 inimigos.', () => [K(), 10000], 4);
ach('cbt_hit100', 'cbt', 'Golpe firme', 'Cause 100 de dano num único golpe.', () => [ax('hit'), 100], 1);
ach('cbt_hit500', 'cbt', 'Pancada', 'Cause 500 de dano num único golpe.', () => [ax('hit'), 500], 2);
ach('cbt_hit2000', 'cbt', 'Demolidor', 'Cause 2.000 de dano num único golpe.', () => [ax('hit'), 2000], 3);
ach('cbt_hit10000', 'cbt', 'Um golpe, um fim', 'Cause 10.000 de dano num único golpe.', () => [ax('hit'), 10000], 4);
ach('cbt_die1', 'cbt', 'Aprender doi', 'Morra uma vez.', () => [Math.min(ac('deaths'), 1), 1], 1);
ach('cbt_die10', 'cbt', 'Teimoso', 'Morra 10 vezes.', () => [ac('deaths'), 10], 2);
ach('cbt_die50', 'cbt', 'Persistente', 'Morra 50 vezes.', () => [ac('deaths'), 50], 3);
ach('cbt_night10', 'cbt', 'Turno da noite', 'Derrote 10 inimigos à noite.', () => [ac('killsNight'), 10], 2);
ach('cbt_day10', 'cbt', 'Sol a pino', 'Derrote 10 inimigos de dia.', () => [ac('killsDay'), 10], 1);
ach('cbt_boss10', 'cbt', 'Caçador de chefes', 'Derrote 10 chefes (contando os novos).', () => [ac('bosses'), 10], 2);
ach('cbt_boss50', 'cbt', 'Veterano', 'Derrote 50 chefes.', () => [ac('bosses'), 50], 3);
ach('cbt_boss_all', 'cbt', 'Todos eles', 'Derrote todos os chefes do jogo.', () => [ac('bosses'), 94], 4);

// ---------- mineração e construção ----------
ach('mine_10', 'mine', 'Picareta nova', 'Minere 10 blocos.', () => [ac('mined'), 10], 1);
ach('mine_100', 'mine', 'Escavador', 'Minere 100 blocos.', () => [ac('mined'), 100], 1);
ach('mine_1000', 'mine', 'Toupeira', 'Minere 1.000 blocos.', () => [ac('mined'), 1000], 2);
ach('mine_5000', 'mine', 'Máquina de cavar', 'Minere 5.000 blocos.', () => [ac('mined'), 5000], 3);
ach('mine_20000', 'mine', 'O subsolo é seu', 'Minere 20.000 blocos.', () => [ac('mined'), 20000], 4);
ach('place_10', 'mine', 'Pedreiro', 'Coloque 10 blocos.', () => [ac('placed'), 10], 1);
ach('place_100', 'mine', 'Construtor', 'Coloque 100 blocos.', () => [ac('placed'), 100], 1);
ach('place_1000', 'mine', 'Arquiteto', 'Coloque 1.000 blocos.', () => [ac('placed'), 1000], 2);
ach('place_5000', 'mine', 'Cidade inteira', 'Coloque 5.000 blocos.', () => [ac('placed'), 5000], 3);
ach('mine_ores', 'mine', 'Mineralogista', 'Tenha os 50 minérios no histórico.', () => [achSeenN(GORES.map(g => g.key)), 50], 3);
ach('mine_picks', 'mine', 'Cinco picaretas', 'Tenha as 5 picaretas novas.', () => [achSeenN(GPICKS.map(p => p[0])), GPICKS.length], 2);
ach('mine_depth200', 'mine', 'Fundo do mundo', 'Chegue a 200 blocos de profundidade.', () => [ax('depth'), 200], 2);
ach('mine_depth300', 'mine', 'Cavernas profundas', 'Chegue a 300 blocos.', () => [ax('depth'), 300], 3);
ach('mine_depth400', 'mine', 'Limiar do Inferno', 'Chegue a 400 blocos.', () => [ax('depth'), 400], 3);
ach('mine_all_tiles', 'mine', 'Tudo vira bloco', 'Minere 15 tipos diferentes de bloco.', () => [Object.keys(achS().seen).filter(k => IT[k] && IT[k].type === 'block').length, 15], 2);

// ---------- equipamento ----------
const eq = () => (G.P && G.P.equip) || { acc: [] };
const accN = () => (eq().acc || []).filter(Boolean).length;
const setCount = fam => { try { return G.P ? gearSetCount(G.P, fam) : 0; } catch (e) { return 0; } };
ach('gear_acc1', 'gear', 'Primeiro acessório', 'Equipe um acessório.', () => [Math.min(accN(), 1), 1], 1);
ach('gear_acc4', 'gear', 'Quatro slots', 'Equipe acessórios nos quatro slots.', () => [accN(), 4], 2);
ach('gear_acc10', 'gear', 'Colecionador de acessórios', 'Tenha 10 acessórios no histórico.', () => [achSeenN(GACCS.map(g => g.id)), 10], 1);
ach('gear_acc25', 'gear', 'Joalheiro', 'Tenha 25 acessórios.', () => [achSeenN(GACCS.map(g => g.id)), 25], 2);
ach('gear_acc50', 'gear', 'Todos os acessórios', 'Tenha os 50 acessórios.', () => [achSeenN(GACCS.map(g => g.id)), 50], 4);
ach('gear_arm10', 'gear', 'Armadura nova', 'Tenha 10 armaduras no histórico.', () => [achSeenN(GARMS.map(g => g.id)), 10], 1);
ach('gear_arm25', 'gear', 'Armeiro', 'Tenha 25 armaduras.', () => [achSeenN(GARMS.map(g => g.id)), 25], 2);
ach('gear_arm50', 'gear', 'Todas as armaduras', 'Tenha as 50 armaduras.', () => [achSeenN(GARMS.map(g => g.id)), 50], 4);
ach('gear_set2', 'gear', 'Conjunto', 'Equipe 2 peças do mesmo conjunto.', () => [Math.max(0, ...GFAM_KEYS.map(setCount)), 2], 2);
ach('gear_set4', 'gear', 'Conjunto completo', 'Equipe 4 peças do mesmo conjunto.', () => [Math.max(0, ...GFAM_KEYS.map(setCount)), 4], 3);
ach('gear_sets10', 'gear', 'Todos os conjuntos', 'Use peças dos 10 conjuntos.', () => [GFAM_KEYS.filter(k => setCount(k) > 0).length, GFAM_KEYS.length], 4);
ach('gear_full', 'gear', 'Pronto para a luta', 'Esteja com armadura e 4 acessórios equipados.', () => [((G.P && G.P.equip && G.P.equip.armor) ? 1 : 0) + (accN() >= 4 ? 1 : 0), 2], 2);
ach('gear_t10', 'gear', 'Poder absoluto', 'Equipe uma espada do Tier 10.', () => { const s = G.P && G.P.inv[G.P.sel]; return [s && IT[s.id] && IT[s.id].type === 'sword' && IT[s.id].sw.tierLevel === 10 ? 1 : 0, 1]; }, 4);
ach('gear_pick_cel', 'gear', 'Picareta celeste', 'Obtenha a Picareta Celeste.', () => [achSeen('pick_celestial') ? 1 : 0, 1], 3);
ach('gear_ore_all', 'gear', 'Barra a barra', 'Tenha as 50 barras no histórico.', () => [achSeenN(GORES.map(g => g.key + '_bar')), 50], 3);

// ---------- exploração ----------
const ACH_BIO_PT = { ocean: 'oceano', desert: 'deserto', forest: 'floresta', jungle: 'selva', snow: 'neve' };
for (const k of Object.keys(ACH_BIO_PT)) ach('expl_bio_' + k, 'expl', 'Bioma: ' + ACH_BIO_PT[k], `Visite o bioma ${ACH_BIO_PT[k]}.`, () => [(G.ach && G.ach.bio && G.ach.bio[k]) ? 1 : 0, 1], 1);
ach('expl_bio_all', 'expl', 'Volta ao mundo', 'Visite os 5 biomas.', () => [Object.keys(ACH_BIO_PT).filter(k => G.ach && G.ach.bio && G.ach.bio[k]).length, 5], 2);
const ACH_LAY_PT = { sky: 'as ilhas do céu', surface: 'a superfície', cave: 'as cavernas', deep: 'as cavernas profundas', hell: 'o Inferno' };
for (const k of Object.keys(ACH_LAY_PT)) ach('expl_lay_' + k, 'expl', 'Camada: ' + ACH_LAY_PT[k], `Visite ${ACH_LAY_PT[k]}.`, () => [(G.ach && G.ach.lay && G.ach.lay[k]) ? 1 : 0, 1], k === 'hell' || k === 'sky' ? 2 : 1);
ach('expl_lay_all', 'expl', 'Do céu ao Inferno', 'Visite as 5 camadas.', () => [Object.keys(ACH_LAY_PT).filter(k => G.ach && G.ach.lay && G.ach.lay[k]).length, 5], 3);
ach('expl_day10', 'expl', 'Dez dias', 'Sobreviva 10 dias no mesmo mundo.', () => [G.day, 10], 2);
ach('expl_day50', 'expl', 'Cinquenta dias', 'Sobreviva 50 dias no mesmo mundo.', () => [G.day, 50], 3);
ach('expl_dist5k', 'expl', 'Caminhante', 'Ande 5.000 pixels.', () => [ac('dist'), 5000], 2);
ach('expl_dist50k', 'expl', 'Peregrino', 'Ande 50.000 pixels.', () => [ac('dist'), 50000], 3);
ach('expl_mush', 'expl', 'Cogumelos brilhantes', 'Passe pela área dos cogumelos.', () => [ac('mush'), 1], 2);
ach('expl_map', 'expl', 'Cartógrafo', 'Abra o mapa do mundo.', () => [ac('map'), 1], 1);
ach('expl_chest100', 'expl', 'Baú atrás de baú', 'Abra 100 baús.', () => [ac('chests'), 100], 3);

// ---------- economia e NPCs ----------
ach('econ_coin100', 'econ', 'Trocado', 'Junte 100 moedas de uma vez.', () => [G.P ? invCount('coin') : 0, 100], 1);
ach('econ_coin1000', 'econ', 'Bolso cheio', 'Junte 1.000 moedas de uma vez.', () => [G.P ? invCount('coin') : 0, 1000], 2);
ach('econ_cointotal', 'econ', 'Fortuna', 'Ganhe 10.000 moedas no total.', () => [ac('coins'), 10000], 3);
ach('econ_cointotal2', 'econ', 'Magnata', 'Ganhe 100.000 moedas no total.', () => [ac('coins'), 100000], 4);
ach('econ_buy1', 'econ', 'Primeira compra', 'Compre algo de um NPC.', () => [Math.min(ac('bought'), 1), 1], 1);
ach('econ_buy50', 'econ', 'Bom cliente', 'Compre 50 itens.', () => [ac('bought'), 50], 2);
ach('econ_sell1', 'econ', 'Primeira venda', 'Venda algo para um NPC.', () => [Math.min(ac('sold'), 1), 1], 1);
ach('econ_sell100', 'econ', 'Comerciante', 'Venda 100 itens.', () => [ac('sold'), 100], 2);
ach('econ_heal', 'econ', 'Enfermaria', 'Pague pela cura da Enfermeira.', () => [ac('nurse'), 1], 1);
ach('econ_npc1', 'econ', 'Um morador', 'Tenha um NPC morando com você.', () => [G.npcs ? G.npcs.length : 0, 1], 1);
ach('econ_npc4', 'econ', 'Vila completa', 'Tenha os 4 NPCs morando.', () => [G.npcs ? new Set(G.npcs.map(n => n.type)).size : 0, 4], 3);
ach('econ_summon1', 'econ', 'Convocação', 'Invoque um NPC com o item (modo Criativo).', () => { const s = G.ach && G.ach.st && G.ach.st.npc; return [s ? Object.keys(s).length : 0, 1]; }, 1);
ach('econ_summon4', 'econ', 'Todo mundo aqui', 'Invoque os 4 NPCs com os itens.', () => { const s = G.ach && G.ach.st && G.ach.st.npc; return [s ? Object.keys(s).length : 0, 4]; }, 2);

// ---------- mundos ----------
ach('world_new2', 'world', 'Dois mundos', 'Crie 2 mundos.', () => [ac('worlds'), 2], 1);
ach('world_new5', 'world', 'Viajante', 'Crie 5 mundos.', () => [ac('worlds'), 5], 2);
ach('world_play1h', 'world', 'Uma hora', 'Jogue 1 hora no mesmo mundo.', () => [ac('play'), 3600], 2);
ach('world_play10h', 'world', 'Dez horas', 'Jogue 10 horas no mesmo mundo.', () => [ac('play'), 36000], 3);
ach('world_save', 'world', 'Guardado', 'Salve o mundo manualmente.', () => [ac('saves'), 1], 1);
ach('world_export', 'world', 'Backup', 'Exporte um mundo para arquivo.', () => [ac('exported'), 1], 2);
ach('world_import', 'world', 'Outro aparelho', 'Importe um mundo de arquivo.', () => [ac('imported'), 1], 2);
ach('world_modes', 'world', 'Os dois jeitos', 'Jogue Aventura e Criativo.', () => [((G.ach && G.ach.st && G.ach.st.modes) ? Object.keys(G.ach.st.modes).length : 0), 2], 1);

// ---------- segredos ----------
ach('sec_acts6', 'sec', 'Seis atos', 'Complete os 6 atos de chefes novos.', () => [Array.from({ length: 6 }, (_, i) => actKilled(i + 1) === actBosses(i + 1).length ? 1 : 0).reduce((a, b) => a + b, 0), 6], 4);
ach('sec_40bosses', 'sec', 'Fim do firmamento', 'Derrote os 40 chefes dos Atos V e VI.', () => [actKilled(5) + actKilled(6), 40], 4);
ach('sec_t9t10', 'sec', 'As 40 do fim', 'Obtenha as 40 espadas dos Tiers 9 e 10.', () => [SWORDS.filter(s => s.tierLevel >= 9 && achSeen(s.id)).length, 40], 4);
ach('sec_fenix', 'sec', 'Cinzas e renascimento', 'Derrote a Fênix (ela volta uma vez).', achFlag('fenix'), 3);
ach('sec_axioma', 'sec', 'Quebre o axioma', 'Derrote o Axioma — quando a pedra acender, pare de atacar (a regra devolve metade do seu dano).', achFlag('axioma'), 3);
ach('sec_trono', 'sec', 'Sem escolta', 'Derrote o Trono de Ouro.', achFlag('trono'), 3);
ach('sec_coroa', 'sec', 'Coroa quebrada', 'Derrote a Coroa da Criação.', achFlag('coroa'), 3);
ach('sec_convergencia', 'sec', 'Tudo converge', 'Derrote a Convergência Final.', achFlag('convergencia'), 3);
ach('sec_mare', 'sec', 'Maré baixa', 'Derrote a Maré Cósmica.', achFlag('mare'), 3);
ach('sec_nogod', 'sec', 'Sem atalhos', 'Derrote um chefe sem nunca ligar o modo invencível.', () => [(ac('bosses') > 0 && !ac('god')) ? 1 : 0, 1], 3);
ach('sec_npc_all', 'sec', 'Bom papo', 'Converse com os 4 tipos de NPC.', () => [(G.ach && G.ach.st && G.ach.st.talk) ? Object.keys(G.ach.st.talk).length : 0, 4], 3);
ach('sec_allseen', 'sec', 'Tudo já passou pelas suas mãos', 'Tenha 300 itens diferentes no histórico.', () => [Object.keys((G.ach && G.ach.seen) || {}).length, 300], 4);

// ---------- notificação / laço ----------
let _achPend = [], _achPendT = 0, _achTickT = 0, _achPx = 0, _achPy = 0;
function achNotify(list) {
  if (!list.length) return;
  if (list.length === 1) toast('🏆 Conquista: ' + list[0].n, '#fbbf24', 5);
  else if (list.length <= 3) toast('🏆 ' + list.length + ' conquistas: ' + list.map(o => o.n).join(' · '), '#fbbf24', 6);
  else toast('🏆 ' + list.length + ' conquistas desbloqueadas!', '#fbbf24', 5);
  if (typeof sfx === 'function') sfx('pickup');
  if (typeof achLabels === 'function') achLabels();
  if (typeof achRefresh === 'function' && typeof $ === 'function' && $('ach') && !$('ach').classList.contains('hidden')) achRefresh();
}
function achCheck() {
  const S = achS(), got = [];
  for (const o of ACH_LIST) { if (S.un[o.id]) continue; const [c, g] = achProg(o); if (g > 0 && c >= g) { S.un[o.id] = 1; got.push(o); } }
  if (got.length) { _achDirty = true; achNotify(got); achSave(); }
  return got.length;
}
function achTick(dt) {
  const P = G.P, wd = G.world; if (!P || !wd || G.state !== 'play' || P.dead) return;
  const S = achS(), px = pcx(P), py = pcy(P);
  if (_achPx || _achPy) { const d = Math.hypot(px - _achPx, py - _achPy); if (d < 420) S.st.dist = (S.st.dist || 0) + d; }
  _achPx = px; _achPy = py;
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  achMax('depth', ty);
  try { const b = wd.biomeName(tx); if (b) S.bio[b] = 1; const l = wd.layerAt(tx, ty); if (l) S.lay[l] = 1; } catch (e) { }
  S.st.play = Math.max(S.st.play || 0, G.t || 0);
  if (wd.mushCenter && Math.abs(tx - wd.mushCenter.x) < 24 && Math.abs(ty - wd.mushCenter.y) < 24) S.st.mush = 1;
  _achTickT -= dt; if (_achTickT > 0) return; _achTickT = .6;
  achCheck();
  _achSaveT -= .6; if (_achDirty && _achSaveT <= 0) { _achSaveT = 12; achSave(); }   /* grava o perfil a cada 12 s, se mudou */
}


// ---------- armazenamento (as conquistas são do jogador, não só de um mundo) ----------
const ACH_KEY = 'swords_destiny_ach_v1';
let _achDirty = false, _achSaveT = 0;
function achSave() {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(ACH_KEY, JSON.stringify(achS())); _achDirty = false; } catch (e) { }
}
function achMerge(raw, dst) {   // une dois estados: desbloqueados/flags/contadores máximos
  const out = dst || achS(), src = raw && typeof raw === 'object' ? raw : null;
  if (!src) return out;
  const isO = v => v && typeof v === 'object' && !Array.isArray(v);
  for (const k of ['un', 'seen', 'bio', 'lay', 'st', 'max']) if (!isO(out[k])) out[k] = {};
  if (isO(src.un)) for (const k in src.un) if (src.un[k]) out.un[k] = 1;
  for (const k of ['seen', 'bio', 'lay']) if (isO(src[k])) for (const j in src[k]) if (src[k][j]) out[k][j] = 1;
  if (isO(src.st)) for (const k in src.st) {
    const sv = src.st[k];
    if (isO(sv)) { if (!isO(out.st[k])) out.st[k] = {}; for (const j in sv) if (sv[j]) out.st[k][j] = 1; continue; }
    const v = +sv; if (isFinite(v) && v >= 0) out.st[k] = Math.max(+out.st[k] || 0, v);
  }
  if (isO(src.max)) for (const k in src.max) { const v = +src.max[k]; if (isFinite(v) && v >= 0) out.max[k] = Math.max(+out.max[k] || 0, v); }
  return out;
}
function achLoad() {
  try { if (typeof localStorage === 'undefined') return; const raw = localStorage.getItem(ACH_KEY); if (raw) achMerge(JSON.parse(raw), achS()); } catch (e) { }
  achLabels();
}

// ---------- painel ----------
function achLabelTxt() { return achCount() + ' / ' + ACH_LIST.length; }
function achLabels() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  const t = achLabelTxt();
  const a = document.getElementById('btn-ach-sub'); if (a) a.textContent = t + ' desbloqueadas (' + achPct() + '%)';
  const b = document.getElementById('p-ach'); if (b) b.textContent = 'Conquistas (' + t + ')';
}
function achRowHTML(o) {
  const done = achDone(o), [c, g] = achProg(o), cat = ACH_CATS.find(x => x.k === o.cat) || ACH_CATS[0], rar = ACH_RAR[o.r] || ACH_RAR[1];
  const pct = Math.round(c / g * 100);
  const prog = done ? '' : `<div class="ach-bar"><i style="width:${pct}%;background:${rar.col}"></i></div>`;
  const right = done ? '<span class="ach-pct" style="color:#86efac">✔</span>' : `<span class="ach-pct">${Math.round(c)}/${Math.round(g)}</span>`;
  return `<div class="ach-row ${done ? 'on' : 'off'}" style="border-left-color:${done ? rar.col : '#334155'}">
    <div class="ach-ic" style="background:${done ? rar.col + '33' : 'rgba(255,255,255,.06)'};color:${done ? rar.col : '#64748b'}">${done ? cat.ic : '·'}</div>
    <div style="flex:1;min-width:0"><div class="ach-nm" style="color:${done ? rar.col : '#cbd5e1'}">${escHtml(o.n)} <span style="font-weight:400;font-size:10.5px;color:${rar.col};opacity:.8">${rar.n}</span></div>
    <div class="ach-ds">${escHtml(o.d)}</div>${prog}</div>${right}</div>`;
}
function achHTML() {
  achS();
  const tab = (G.ui && G.ui.achTab) || 'all';
  const cat = ACH_CATS.find(c => c.k === tab);
  let list = ACH_LIST.filter(o => tab === 'all' || o.cat === tab);
  const order = o => (achDone(o) ? 2 : (achProg(o)[0] / achProg(o)[1]) > 0 ? 0 : 1);
  list = list.slice().sort((a, b) => order(a) - order(b) || a.n.localeCompare(b.n));
  const tabs = [['all', 'Todas', ACH_LIST.length]].concat(ACH_CATS.map(c => [c.k, c.n, ACH_LIST.filter(o => o.cat === c.k).length]));
  const done = achCount(), tot = ACH_LIST.length, pct = Math.round(done / tot * 100);
  let h = `<h2 style="display:flex;justify-content:space-between;align-items:center;gap:10px">Conquistas <span style="font-size:12px;font-weight:400;color:var(--mut)">${done} de ${tot} · ${pct}%</span><button class="btn" id="ach-close">Fechar</button></h2>`;
  h += `<div class="ach-bar" style="height:9px;margin:2px 0 10px"><i style="width:${pct}%;background:var(--acc)"></i></div>`;
  h += `<div class="ach-tabs">` + tabs.map(([k, n, c]) => `<div class="tab ${tab === k ? 'on' : ''}" data-ach-tab="${k}">${n} <span style="opacity:.7">${c}</span></div>`).join('') + `</div>`;
  if (cat) { const cd = list.filter(achDone).length; h += `<div style="font-size:12px;color:var(--mut);margin:0 0 8px">${cat.n}: ${cd} de ${list.length}</div>`; }
  h += `<div style="max-height:58vh;overflow-y:auto;padding-right:4px">` + list.map(achRowHTML).join('') + `</div>`;
  h += `<div style="margin-top:10px;font-size:11.5px;color:var(--mut)">As conquistas ficam guardadas no navegador e dentro do mundo (também vão junto no arquivo exportado). No modo Criativo tudo conta normalmente — o Arsenal acelera a coleção.</div>`;
  return h;
}
function achRefresh() {
  if (typeof $ !== 'function' || !$('ach-box')) return;
  $('ach-box').innerHTML = achHTML();
  const c = $('ach-close'); if (c) c.onclick = () => showAch(false);
  $('ach-box').querySelectorAll('[data-ach-tab]').forEach(el => el.onclick = () => { G.ui.achTab = el.dataset.achTab; achRefresh(); sfx('tick'); });
}
function showAch(show) {
  if (typeof $ !== 'function') return;
  const box = $('ach'); if (!box) return;
  if (show) { achRefresh(); box.classList.remove('hidden'); sfx('tick'); }
  else { box.classList.add('hidden'); }
}
const achOpen = () => typeof $ === 'function' && $('ach') && !$('ach').classList.contains('hidden');

// ---------- saneamento (importação de mundo) ----------
function achClean(raw) {
  const out = { un: {}, seen: {}, bio: {}, lay: {}, st: {}, max: {} };
  if (!raw || typeof raw !== 'object') return out;
  const isO = v => v && typeof v === 'object' && !Array.isArray(v);
  if (isO(raw.un)) for (const k in raw.un) if (ACH[k] && Object.keys(out.un).length < ACH_LIST.length) out.un[k] = 1;
  if (isO(raw.seen)) for (const k in raw.seen) if (IT[k] && Object.keys(out.seen).length < 2000) out.seen[k] = 1;
  if (isO(raw.bio)) for (const k in raw.bio) if (BIO_NAMES.indexOf(k) >= 0) out.bio[k] = 1;
  if (isO(raw.lay)) for (const k in raw.lay) if (['sky', 'surface', 'cave', 'deep', 'hell'].indexOf(k) >= 0) out.lay[k] = 1;
  const num = (v, max) => { const n = +v; return isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
  if (isO(raw.st)) for (const k of ['kills', 'mined', 'placed', 'crafted', 'forge', 'coins', 'bought', 'sold', 'deaths', 'bosses', 'killsNight', 'killsDay', 'chests', 'dist', 'play', 'worlds', 'saves', 'exported', 'imported', 'nurse', 'npcSummoned', 'god', 'map', 'mush']) out.st[k] = num(raw.st[k], 1e9);
  if (isO(raw.st) && isO(raw.st.npc)) { out.st.npc = {}; for (const k in raw.st.npc) if (NPC_DEF[k]) out.st.npc[k] = 1; }
  if (isO(raw.st) && isO(raw.st.modes)) { out.st.modes = {}; for (const k in raw.st.modes) if (k === 'adventure' || k === 'creative') out.st.modes[k] = 1; }
  if (isO(raw.st) && isO(raw.st.talk)) { out.st.talk = {}; for (const k in raw.st.talk) if (NPC_DEF[k]) out.st.talk[k] = 1; }
  if (isO(raw.max)) for (const k of ['depth', 'hit']) out.max[k] = num(raw.max[k], 1e9);
  return out;
}

// ---------- ganchos (chamados pelos outros módulos) ----------
function achKill(e) {   // chamado em killEnemy
  if (e && e.harmless) return;
  try { if (typeof isNightFrac === 'function' && isNightFrac(G.time)) achStat('killsNight'); else achStat('killsDay'); } catch (er) { }
}
function achBoss() { achStat('bosses'); }
function achSummon(type) { const a = achS(); if (!a.st.npc) a.st.npc = {}; a.st.npc[type] = 1; }
