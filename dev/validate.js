// Carrega os módulos no Node (com stubs de DOM) e valida o catálogo de espadas.
const fs = require('fs'), vm = require('vm');
const order = fs.readdirSync(__dirname + '/../src').filter(f => /^\d+.*\.js$/.test(f)).sort();
const use = order.filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));  // UI/main/controle (precisam de DOM) ficam de fora
let code = use.map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { SWORDS, IT, RECIPES, TD, T, TIERS, FX, G, STATION_NAME, BXLIST, BX_ACTS, BXART, ED, BX_BIO, BX_LAY, GORES, GARMS, GACCS, GPICKS, BX_ACC, GFAM, GFAM_KEYS, ACC_FX, ARM_FX, SET_FX, GARM_ST, TD, T };`;
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, performance: { now: () => Date.now() },
  document: { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) }, window: {}, ImageData: function () {} };
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }
const { SWORDS, IT, RECIPES, TIERS, STATION_NAME, BXLIST, BX_ACTS, BXART, ED, BX_BIO, BX_LAY, GORES, GARMS, GACCS, GPICKS, BX_ACC, GFAM, GFAM_KEYS, ACC_FX, ARM_FX, SET_FX, GARM_ST, TD, T } = ctx.__api;
let errs = 0; const err = m => { console.log('  ✗', m); errs++; };
console.log('files:', use.join(' '));
console.log('swords:', SWORDS.length);
if (SWORDS.length !== 200) err('esperado 200 espadas');
const nums = new Set(SWORDS.map(s => s.num)); for (let i = 1; i <= 200; i++) if (!nums.has(i)) err('falta espada ' + i);
const names = new Set(); SWORDS.forEach(s => { if (names.has(s.swordName)) err('nome duplicado ' + s.swordName); names.add(s.swordName); });
const rng = { 1: [8, 22], 2: [26, 40], 3: [42, 68], 4: [72, 104], 5: [110, 150], 6: [165, 280], 7: [300, 430], 8: [460, 640], 9: [680, 900], 10: [950, 1400] };
for (let t = 1; t <= 10; t++) {
  const L = SWORDS.filter(s => s.tierLevel === t); if (L.length !== 20) err('tier ' + t + ' tem ' + L.length);
  const d = L.map(s => s.baseDamage), mn = Math.min(...d), mx = Math.max(...d);
  const base = 23.5; // multiplicador relativo (dano / base) — referência GDD
  console.log(`  T${t}: ${L.length} espadas | dano ${mn}-${mx} (x${(mn / 20).toFixed(1)}..x${(mx / 20).toFixed(1)} sobre base 20) | vel ${Math.min(...L.map(s => s.attackSpeed))}-${Math.max(...L.map(s => s.attackSpeed))} | KB ${Math.min(...L.map(s => s.knockbackForce))}-${Math.max(...L.map(s => s.knockbackForce))} | src=${L[0].src}`);
  L.forEach(s => { if (s.baseDamage < rng[t][0] || s.baseDamage > rng[t][1]) err('dano fora da faixa T' + t + ': ' + s.swordName); });
}
// receitas
const stations = new Set(['bench', 'furnace', 'anvil', 'advanvil', 'forge', null]);
for (const r of RECIPES) {
  if (!IT[r.out]) err('receita produz item inexistente ' + r.out);
  for (const k in r.ing) if (!IT[k]) err('ingrediente inexistente ' + k + ' em ' + r.out);
  if (!stations.has(r.st)) err('estação inválida ' + r.st);
}
console.log('recipes:', RECIPES.length, '| items:', Object.keys(IT).length);
// cada espada tem look válido e pelo menos efeitos (exceto 019)
SWORDS.forEach(s => { if (!s.look || !s.look.sh || !s.look.col) err('look inválido ' + s.id); if (!s.passiveEffects.length && s.num !== 19) err('sem efeito ' + s.id); if (!s.txt) err('sem texto ' + s.id); });
// CSV (só grava em docs/ se você pedir: CATALOGO=1 node dev/validate.js)
const WRITE_DOCS = process.env.CATALOGO === '1';
let csv = '#;Nome;Tier;Dano;Vel;KB;Crit;Tipo de ataque;Mecânica única;Origem;Estação;Receita\n';
for (const s of SWORDS) { const r = RECIPES.find(r => r.out === s.id); csv += [String(s.num).padStart(3, '0'), s.swordName, s.tierLevel, s.baseDamage, s.attackSpeed, s.knockbackForce, Math.round(s.critChance * 100) + '%', s.attackType, '"' + s.txt.replace(/"/g, '""') + '"', s.src === 'pdf' ? 'GDD' : 'Inédita', STATION_NAME[s.station] || '—', r ? Object.entries(r.ing).map(([k, v]) => v + 'x ' + IT[k].n).join(' + ') : 'cai do chefe ' + (s.dropFromName || '?')].join(';') + '\n'; }
if (WRITE_DOCS) fs.writeFileSync(__dirname + '/../docs/catalogo_200_espadas.csv', '\ufeff' + csv);
// Markdown por tier
let md = '# Catálogo mestre — 200 espadas\n\n> Gerado automaticamente a partir dos dados do jogo (`src/11_swords.js` e `src/11b_swords_x.js`).\n> **Origem:** `GDD` = texto original do documento de design · `Inédita` = criada para o jogo seguindo as regras do tier. Os **Tiers 7–10 são novos**, 20 espadas cada, com arte pintada pixel a pixel em `src/06b_swordart.js`. As dos **Tiers 9 e 10 não são forjáveis: cada uma cai do chefe do Ato V/VI que a guarda** (`src/13h_bx_a5.js` e `src/13i_bx_a6.js`).\n\n';
const TN = { 1: 'TIER 1 — Início de jogo & Básico (001–020)', 2: 'TIER 2 — Pré-Bosses Intermediários (021–040)', 3: 'TIER 3 — Transição & Mid-Game (041–060)', 4: 'TIER 4 — Hardmode Inicial (061–080)', 5: 'TIER 5 — Hardmode Avançado (081–100)', 6: 'TIER 6 — End-Game / Mítico (101–120)', 7: 'TIER 7 — Forja Estelar · Lendário (121–140)', 8: 'TIER 8 — Relicário do Vazio · Ancestral (141–160)', 9: 'TIER 9 — Eco Primordial · Divino (161–180)', 10: 'TIER 10 — Origem · Supremo (181–200)' };
const COLS = { 1: '#10b981', 2: '#0284c7', 3: '#7c3aed', 4: '#d97706', 5: '#dc2626', 6: '#4f46e5', 7: '#eab308', 8: '#db2777', 9: '#06b6d4', 10: '#f8fafc' };
for (let t = 1; t <= 10; t++) {
  const L = SWORDS.filter(x => x.tierLevel === t), T_ = TIERS[t];
  md += `## ${TN[t]}\n\n- Cor de raridade: \`${COLS[t]}\` · multiplicador de dano do GDD: **${T_.mult[0]}x–${T_.mult[1]}x** · estação de criação: **${[...new Set(L.map(x => STATION_NAME[x.station]))].join(' / ')}**\n- Regra do tier: ${T_.mech}\n- Origem: ${L[0].src === 'pdf' ? '**GDD** — textos originais' : (t <= 6 ? '**Inéditas** — criadas seguindo as regras do tier' : '**Tier novo** — 20 espadas inéditas com arte exclusiva')}\n\n| # | Espada | Dano | Vel | KB | Crít | Mecânica única | Receita |\n|---|---|---|---|---|---|---|---|\n`;
  for (const s of L) { const r = RECIPES.find(r => r.out === s.id); md += `| ${String(s.num).padStart(3, '0')} | **${s.swordName}** | ${s.baseDamage} | ${s.attackSpeed} | ${s.knockbackForce} | ${Math.round(s.critChance * 100)}% | ${s.txt} | ${r ? Object.entries(r.ing).map(([k, v]) => v + '× ' + IT[k].n).join(', ') + ' _(' + STATION_NAME[s.station] + ')_' : '**Cai do chefe ' + (s.dropFromName || '?') + '**' + (s.sealedAll ? ' — só depois de derrotar todos os chefes do jogo' : '')} |\n`; }
  md += '\n';
}
if (WRITE_DOCS) { fs.writeFileSync(__dirname + '/../docs/catalogo_200_espadas.md', md); console.log('docs/catalogo_200_espadas.{md,csv} atualizados'); }
// ---- 90 chefes novos (atos I–VI): dados completos + docs/chefes_novos.md ----
console.log('chefes novos:', BXLIST.length);
if (BXLIST.length !== 90) err('esperado 90 chefes novos, há ' + BXLIST.length);
const bsw = new Set(), bnm = new Set();
for (const d of BXLIST) {
  const ed = ED['bx_' + d.id], miss = ['n', 'act', 'w', 'h', 'hp', 'dmg', 'coin', 'sword', 'rec', 'mech', 'moves', 'acc'].filter(k => d[k] === undefined || d[k] === null);
  if (miss.length) err('chefe ' + d.id + ' sem ' + miss.join(',')); if (!ed || !ed.boss) err('chefe sem entrada em ED: ' + d.id);
  if (!BXART[d.id]) err('chefe sem arte: ' + d.id); if (!IT[d.sword]) err('espada inexistente em ' + d.id + ': ' + d.sword); if (!IT['sg_' + d.id]) err('sem sigilo de invocação: ' + d.id);
  if (!d.kit && !d.pick) err('chefe sem repertório (kit/pick): ' + d.id); for (const k of [].concat(...(d.kit || []))) if (!d.moves[k]) err('golpe inexistente ' + k + ' em ' + d.id);
  if (bsw.has(d.sword)) err('espada repetida: ' + d.sword); bsw.add(d.sword); if (bnm.has(d.n)) err('nome repetido: ' + d.n); bnm.add(d.n);
}
const dropS = SWORDS.filter(x => x.tierLevel >= 9);
for (const x of dropS) { if (RECIPES.some(r => r.out === x.id)) err('Tier 9/10 não pode ser forjável: ' + x.id); if (!x.dropFrom || !BXLIST.some(d => d.id === x.dropFrom)) err('Tier 9/10 sem chefe de origem: ' + x.id); }
console.log('espadas de Tier 9/10 (só caem de chefe):', dropS.length);
let bm = '# Chefes novos — ' + BXLIST.length + ' (Atos I a VI)\n\n> Gerado automaticamente a partir dos dados do jogo (`src/13d..13i_bx_*.js`). Cada chefe tem **visual próprio** (pintado em `src/05g..05l_bxart*.js`, mesmo estilo dos 4 chefes anteriores: corpo escuro, brilho de uma cor, halo) e **uma mecânica única**.\n> **Como invocar:** no Criativo, Arsenal → *Inimigos & Chefes*; no modo Aventura, crie o **Sigilo** do chefe (receita abaixo) e use-o (a condição, quando houver, é o local/hora). **Espada:** cada chefe larga a sua espada garantida. As dos Atos I a IV também podem ser forjadas; as dos **Atos V e VI (Tiers 9 e 10) só caem do chefe**.\n\n';
const AN = BX_ACTS;
for (let a = 1; a < AN.length; a++) {
  bm += '## ' + AN[a].n + ' (' + BXLIST.filter(d => d.act === a).length + ')\n\nEstação do Sigilo: **' + STATION_NAME[AN[a].st] + '** · estágio do mundo mínimo: ' + AN[a].stage + '\n\n| # | Chefe | Vida | Dano | Mecânica única | Sigilo (receita) | Condição | Espada |\n|---|---|---|---|---|---|---|---|\n';
  for (const d of BXLIST.filter(x => x.act === a)) {
    const rc = RECIPES.find(r => r.out === 'sg_' + d.id), ing = rc ? Object.keys(rc.ing).map(k => rc.ing[k] + '× ' + (IT[k] ? IT[k].n : k)).join(', ') : '';
    const c = d.cond || {}, ct = [c.night && 'à noite', c.day && 'de dia', c.layer && ('em ' + BX_LAY[c.layer]), c.biome && ('bioma ' + BX_BIO[c.biome])].filter(Boolean).join(', ') || '—';
    bm += '| ' + String(d.i + 1).padStart(2, '0') + ' | **' + d.n + '** | ' + d.hp + ' | ' + d.dmg + ' | ' + d.mech.replace(/\|/g, '/') + ' | ' + (BX_ACC[d.id] && IT[BX_ACC[d.id]] ? IT[BX_ACC[d.id]].n : '—') + ' | ' + ing + ' | ' + ct + ' | ' + String(d.sword).replace('s', '') + ' ' + (IT[d.sword] ? IT[d.sword].n : '') + ' |\n';
  }
  bm += '\n';
}
fs.writeFileSync(__dirname + '/../docs/chefes_novos.md', bm);
// ---- 50 minérios, 50 armaduras, 50 acessórios e 5 picaretas ----
console.log('minérios:', GORES.length, '| armaduras:', GARMS.length, '| acessórios:', GACCS.length, '| picaretas novas:', GPICKS.length);
if (GORES.length !== 50) err('esperado 50 minérios');
if (GARMS.length !== 50) err('esperado 50 armaduras');
if (GACCS.length !== 50) err('esperado 50 acessórios');
if (GPICKS.length !== 5) err('esperado 5 picaretas novas');
for (const fam of GFAM_KEYS) {
  if (GARMS.filter(a => a.fam === fam).length !== 5) err('armaduras da família ' + fam + ' ≠ 5');
  if (GACCS.filter(a => a.fam === fam).length !== 5) err('acessórios da família ' + fam + ' ≠ 5');
  if (GORES.filter(o => o.fam === fam).length !== 5) err('minérios da família ' + fam + ' ≠ 5');
  if (!SET_FX[fam]) err('conjunto sem bônus: ' + fam);
}
const accMech = new Set(), armId = new Set();
for (const a of GACCS) {
  if (!IT[a.id] || IT[a.id].type !== 'acc') err('acessório sem item: ' + a.id);
  if (!ACC_FX[IT[a.id].mech]) err('acessório sem mecânica: ' + a.id);
  if (accMech.has(IT[a.id].mech)) err('mecânica repetida: ' + IT[a.id].mech); accMech.add(IT[a.id].mech);
  if (a.fonte === 'craft') { if (!RECIPES.some(r => r.out === a.id)) err('acessório forjável sem receita: ' + a.id); }
  else { const m = a.fonte.match(/^b:(.+)$/); if (!m || !BX_ACC[m[1]]) err('fonte do acessório inválida: ' + a.id); if (m && m[1] !== 'slime' && m[1] !== 'eye' && m[1] !== 'guardian' && m[1] !== 'colossus' && !BXLIST.some(d => d.id === m[1])) err('chefe inexistente: ' + m[1]); }
}
for (const a of GARMS) {
  if (!IT[a.id] || IT[a.id].type !== 'armor') err('armadura sem item: ' + a.id);
  if (!ARM_FX[a.fam + '_' + a.t]) err('armadura sem passiva: ' + a.id);
  if (armId.has(a.id)) err('armadura duplicada: ' + a.id); armId.add(a.id);
  const r = RECIPES.find(x => x.out === a.id);
  if (!r) err('armadura sem receita: ' + a.id); else if (r.st !== GARM_ST[a.t]) err('estação errada: ' + a.id);
}
for (const o of GORES) {
  if (!IT[o.key]) err('minério sem item: ' + o.key);
  if (!IT[o.key + '_bar']) err('minério sem barra: ' + o.key);
  if (!RECIPES.some(r => r.out === o.key + '_bar')) err('barra sem receita: ' + o.key);
  if (!TD[T[o.key]] || TD[T[o.key]].h !== o.h) err('dureza errada no tile: ' + o.key);
}
const bossAcc = Object.keys(BX_ACC);
if (bossAcc.length !== 45) err('chefes com acessório: esperado 45, veio ' + bossAcc.length);
if (new Set(Object.values(BX_ACC)).size !== 45) err('acessório repetido entre chefes');
const semAcc = BXLIST.filter(d => !BX_ACC[d.id]);
if (semAcc.length !== 49) err('chefes sem acessório: esperado 49, veio ' + semAcc.length + ' (' + semAcc.map(d => d.id).join(', ') + ')');

// documento gerado (só com CATALOGO=1)
if (WRITE_DOCS) {
  let gm = '# Catálogo de equipamentos — 50 minérios, 50 armaduras e 50 acessórios\n\n';
  gm += '> Gerado automaticamente a partir de `src/11c_gear_x.js` e `src/10b_gear_fx.js`.\n';
  gm += '> Cada família tem 5 minérios, 5 armaduras (com passiva própria) e 5 acessórios; usar armadura + acessórios da mesma família ativa o **bônus de conjunto** (2 e 4 peças).\n';
  gm += '> Os acessórios vêm de **45 chefes** (um exclusivo por chefe) e **5 são forjados**.\n\n';
  gm += '## Resumo\n\n| Família | Tema | Minérios | Armaduras | Acessórios |\n|---|---|---|---|---|\n';
  for (const fam of GFAM_KEYS) gm += `| **${GFAM[fam].n}** | ${GFAM[fam].desc} | ${GORES.filter(o => o.fam === fam).length} | ${GARMS.filter(a => a.fam === fam).length} | ${GACCS.filter(a => a.fam === fam).length} |\n`;
  gm += '\n';
  for (const fam of GFAM_KEYS) {
    gm += `## ${GFAM[fam].n} \`${GFAM[fam].col}\`\n\n${GFAM[fam].desc}.\n\n`;
    gm += '### Minérios\n\n| Minério | Tier | Picareta | Barra |\n|---|---|---|---|\n';
    for (const o of GORES.filter(x => x.fam === fam)) gm += `| ${IT[o.key].n} | T${IT[o.key].tier} | poder ${o.h} | ${IT[o.key + '_bar'].n} |\n`;
    gm += '\n### Armaduras\n\n| Armadura | Tier | Defesa | Passiva | Estação |\n|---|---|---|---|---|\n';
    for (const a of GARMS.filter(x => x.fam === fam)) gm += `| **${IT[a.id].n}** | T${IT[a.id].tier} | +${a.def} | ${IT[a.id].desc.replace(/ Conjunto.*$/, '')} | ${STATION_NAME[GARM_ST[a.t]]} |\n`;
    gm += '\n### Acessórios\n\n| Acessório | Tier | Origem | Mecânica |\n|---|---|---|---|\n';
    for (const a of GACCS.filter(x => x.fam === fam)) {
      const m = a.fonte.match(/^b:(.+)$/);
      let org = 'Forjado';
      if (m) { const d = BXLIST.find(x => x.id === m[1]); org = d ? 'Chefe: ' + d.n : ({ slime: 'Rei Slime', eye: 'Olho Colossal', guardian: 'Guardião do Abismo', colossus: 'Colosso Estelar' }[m[1]] || m[1]); }
      gm += `| **${IT[a.id].n}** | T${a.tier} | ${org} | ${a.txt} |\n`;
    }
    gm += '\n';
  }
  fs.writeFileSync(__dirname + '/../docs/catalogo_equipamentos.md', gm);
  console.log('docs/catalogo_equipamentos.md atualizado');
}
console.log(errs ? ('ERROS: ' + errs) : 'CATÁLOGO OK');
