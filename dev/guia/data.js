'use strict';
// Camada de leitura dos dados do jogo: transforma as tabelas do código em frases
// prontas para o guia (receitas, sigilos, condições, drops).
const { X } = require('./game');

const nf = (n) => String(n).replace('.', ',');
// inteiro com separador de milhar (26.000)
const ni = (n) => { const v = Math.round(Number(n)); const a = String(Math.abs(v)), g = a.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (v < 0 ? '-' : '') + g; };
const nameOf = (id) => (X.IT[id] ? X.IT[id].n : id);
const tierOf = (t) => X.TIERS[t] || { n: 'Tier ' + t, col: '#334155' };
const stationOf = (st) => (st ? (X.STATION_NAME[st] || st) : 'à mão');

// ---------- receitas ----------
const recByOut = {};
for (const r of X.RECIPES) if (!recByOut[r.out]) recByOut[r.out] = r;
const ingText = (ing) => Object.entries(ing).map(([k, v]) => `${v}× ${nameOf(k)}`).join(', ');
const recOf = (out) => recByOut[out] || null;
const recText = (out) => {
  const r = recOf(out);
  if (!r) return null;
  return ingText(r.ing) + ' (' + stationOf(r.st) + ')';
};

// ---------- espadas ----------
const fmt = (v, d = 0) => nf(Number(v).toFixed(d));
function swordStats(sw) {
  return `Dano ${fmt(sw.baseDamage)} · Vel. ${nf(sw.attackSpeed)}/s · KB ${fmt(sw.knockbackForce)} · Crít. ${Math.round(sw.critChance * 100)}% · DPS ${fmt(sw.dps)} · Ataque ${atkName(sw.attackType)}`;
}
const ATK = { ArcSwing: 'Arco', Thrust: 'Estocada', Beam: 'Feixe', Orbital: 'Orbital' };
function atkName(t) { return ATK[t] || t; }
function swordHow(sw) {
  const out = [];
  if (sw.dropOnly && sw.dropFromName) out.push(['DROP · CHEFE', sw.dropFromName]);
  else {
    const r = recOf(sw.id);
    if (r) out.push(['FORJAR · ' + stationOf(r.st).toUpperCase(), ingText(r.ing)]);
  }
  const tier = sw.tierLevel;
  if (tier <= 3) out.push(['BAÚ', 'casas abandonadas (30% de chance)']);
  else if (tier <= 6) out.push(['BAÚ', 'casas fundas e ilhas do céu']);
  else if (!sw.dropOnly) out.push(['BAÚ', 'só nos baús mais fundos (raro)']);
  return out;
}
const swordsOfTier = (t) => X.SWORDS.filter(s => s.tierLevel === t).sort((a, b) => a.num - b.num);
const swordsByDrop = {};
for (const b of X.BXLIST) if (b.sword) swordsByDrop[b.sword] = b;

// ---------- chefes ----------
const CLASSIC = [
  {
    key: 'boss_slime', num: 0, n: 'Rei Slime', hp: X.ED.boss_slime.hp, dmg: X.ED.boss_slime.dmg, def: X.ED.boss_slime.def,
    coin: X.ED.boss_slime.coins, sum: 'Use a Coroa de Gosma (30× Gosma, na Bancada), de dia ou à noite, na superfície.',
    where: 'Na superfície, onde você quiser — menos no Inferno.',
    mech: 'Salta em arcos cada vez mais altos e, abaixo de metade da vida, se divide em slimes menores que precisam ser limpos.',
    drop: 'Cristal de Vida, uma espada do Tier 1, Botas Velozes e 40–60 de Gosma.',
  },
  {
    key: 'boss_eye', num: 0, n: 'Olho Colossal', hp: X.ED.boss_eye.hp, dmg: X.ED.boss_eye.dmg, def: X.ED.boss_eye.def,
    coin: X.ED.boss_eye.coins, sum: 'Use a Lente Suspeita (6× Lente Demoníaca, na Bigorna) à noite.',
    where: 'À noite, na superfície.',
    mech: 'Fica pairando e dispara olhares em leque; abaixo de metade da vida, investe em linha reta e deixa um rastro de lágrimas que fere.',
    drop: 'Barras de Platina, uma espada do Tier 2 e o Anel do Crítico. O mundo vai para o estágio 1.',
  },
  {
    key: 'boss_guardian', num: 0, n: 'Guardião do Abismo', hp: X.ED.boss_guardian.hp, dmg: X.ED.boss_guardian.dmg, def: X.ED.boss_guardian.def,
    coin: X.ED.boss_guardian.coins, sum: 'Use o Boneco Infernal (4× Barra de Infernal, 8× Obsidiana, 10× Osso, na Bigorna) no Inferno.',
    where: 'No Inferno.',
    mech: 'Abre portais que cospem brasas e, quando fica abaixo de metade da vida, acende o chão em ondas; encostar nele queima.',
    drop: 'Barras de Infernal, 14–20 Fragmentos Celestes e uma espada do Tier 3. Começa o Hardmode (estágio 2).',
  },
  {
    key: 'boss_colossus', num: 0, n: 'Colosso Estelar', hp: X.ED.boss_colossus.hp, dmg: X.ED.boss_colossus.dmg, def: X.ED.boss_colossus.def,
    coin: X.ED.boss_colossus.coins, sum: 'Use o Coração Estelar (6× Barra de Celeste, 6× Essência do Tempo, 6× Essência de Luz, 6× Essência de Sombra, na Forja Celeste).',
    where: 'No céu, acima da superfície.',
    mech: 'Voa em órbitas e chama meteoros; a cada terço de vida fecha a guarda e solta um anel de estrelas que precisa ser pulado.',
    drop: '3 Núcleos Míticos por vitória, 26–36 Fragmentos Celestes e uma espada do Tier 4. Estágio 3.',
  },
];
const ATOS = {};
for (const b of X.BXLIST) (ATOS[b.act] = ATOS[b.act] || []).push(b);
const ACT_NAMES = { 1: 'Ato I · Despertar', 2: 'Ato II · Pós-Olho', 3: 'Ato III · Hardmode', 4: 'Ato IV · Além do Colosso', 5: 'Ato V · Além do Firmamento', 6: 'Ato VI · Fim de Tudo' };
const ACT_ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
const BX_BIO = { jungle: 'Selva', forest: 'Floresta', ocean: 'Oceano', desert: 'Deserto', snow: 'Neve' };
const LAYER_PT = { cave: 'Cavernas', deep: 'Cavernas profundas', hell: 'Inferno', surface: 'Superfície' };
function condText(c) {
  if (!c) return 'Sem condição de lugar ou hora.';
  const out = [];
  if (c.biome) out.push('No bioma ' + (BX_BIO[c.biome] || c.biome));
  if (c.layer) out.push(LAYER_PT[c.layer] || c.layer);
  if (c.night) out.push('à noite');
  if (!out.length) return 'Sem condição de lugar ou hora.';
  let s = out.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}
function sigilText(b) {
  return `Sigilo: ${b.n} = ${ingTextFromList(b.rec)} (${stationOf(b.st || X.BX_ACTS[b.act].st)})`;
}
function ingTextFromList(rec) {
  return String(rec).split(',').filter(Boolean).map(p => {
    const [k, v] = p.split(':');
    return `${v}× ${nameOf(k.trim())}`;
  }).join(', ');
}
const actInfo = (a) => X.BX_ACTS[a] || {};
// primeira letra maiúscula (os textos de mecânica vêm do código em minúscula)
const cap = (s) => { const t = String(s).trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; };
function actDrops(a) {
  const A = actInfo(a);
  const mats = (A.mat || []).map(([k, lo, hi]) => `${lo}–${hi}× ${nameOf(k)}`).join(', ');
  const pot = A.pot ? nameOf(A.pot) : 'Poção de Cura';
  return [mats, `4 ${pot}`, 'moedas'].filter(Boolean).join(', ');
}
function bossSword(b) {
  const s = X.SWORDS.find(x => x.id === b.sword);
  return s ? { num: s.num, n: s.swordName, t: s.tierLevel } : null;
}
const totalBosses = CLASSIC.length + X.BXLIST.length;

// ---------- conquistas ----------
const ACH_CAT_BY_KEY = {};
for (const c of X.ACH_CATS) ACH_CAT_BY_KEY[c.k] = c;
const achByCat = {};
for (const a of X.ACH_LIST) (achByCat[a.cat] = achByCat[a.cat] || []).push(a);

// ---------- módulos ----------
function modules() {
  const fs = require('fs'), path = require('path');
  const root = path.join(__dirname, '..', '..', 'src');
  return fs.readdirSync(root).filter(f => /^\d+.*\.js$/.test(f)).sort().map(f => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    const cand = src.split('\n').slice(0, 14).map(l => l.replace(/^\s*(\/\/|\*|\/\*)\s?/, '').replace(/\s*\*\/\s*$/, '').trim()).filter(l => !/^=+$/.test(l));
    const tagged = cand.map(l => /^[\w.]+:\s*(.+)$/.exec(l)).find(m => m && m[1].length > 8);
    const first = cand.find(l => l.length > 10 && !/^=+$/.test(l) && !/^'use strict'/.test(l)) || '';
    let desc = (tagged ? tagged[1] : first).replace(/\s+/g, ' ').replace(/^[-–—:]\s*/, '');
    if (desc.includes(' | ')) desc = desc.split(' | ').pop().trim();
    const tag = f.replace(/\.js$/, '').toLowerCase() + ':';
    if (desc.toLowerCase().startsWith(tag)) desc = desc.slice(tag.length).trim();
    if (!tagged) desc = f.replace(/\.js$/, '') + ': ' + desc.charAt(0).toLowerCase() + desc.slice(1);
    const lines = src.split('\n').length;
    return { file: f, desc, lines };
  });
}

module.exports = {
  X, nf, ni, cap, nameOf, tierOf, stationOf, recOf, recText, ingText, ingTextFromList,
  swordStats, swordHow, atkName, swordsOfTier, swordsByDrop,
  CLASSIC, ATOS, ACT_NAMES, ACT_ROMAN, BX_BIO, condText, sigilText, actInfo, actDrops, bossSword,
  totalBosses, ACH_CAT_BY_KEY, achByCat, modules, fmt,
};
