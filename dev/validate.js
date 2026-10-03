// Carrega os módulos no Node (com stubs de DOM) e valida o catálogo de espadas.
const fs = require('fs'), vm = require('vm');
const order = fs.readdirSync(__dirname + '/../src').filter(f => /^\d+.*\.js$/.test(f)).sort();
const use = order.filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));  // UI/main/controle (precisam de DOM) ficam de fora
let code = use.map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { SWORDS, IT, RECIPES, TD, T, TIERS, FX, G, STATION_NAME };`;
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, performance: { now: () => Date.now() },
  document: { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) }, window: {}, ImageData: function () {} };
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }
const { SWORDS, IT, RECIPES, TIERS, STATION_NAME } = ctx.__api;
let errs = 0; const err = m => { console.log('  ✗', m); errs++; };
console.log('files:', use.join(' '));
console.log('swords:', SWORDS.length);
if (SWORDS.length !== 120) err('esperado 120 espadas');
const nums = new Set(SWORDS.map(s => s.num)); for (let i = 1; i <= 120; i++) if (!nums.has(i)) err('falta espada ' + i);
const names = new Set(); SWORDS.forEach(s => { if (names.has(s.swordName)) err('nome duplicado ' + s.swordName); names.add(s.swordName); });
const rng = { 1: [8, 22], 2: [26, 40], 3: [42, 68], 4: [72, 104], 5: [110, 150], 6: [165, 280] };
for (let t = 1; t <= 6; t++) {
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
// CSV
let csv = '#;Nome;Tier;Dano;Vel;KB;Crit;Tipo de ataque;Mecânica única;Origem;Estação;Receita\n';
for (const s of SWORDS) { const r = RECIPES.find(r => r.out === s.id); csv += [String(s.num).padStart(3, '0'), s.swordName, s.tierLevel, s.baseDamage, s.attackSpeed, s.knockbackForce, Math.round(s.critChance * 100) + '%', s.attackType, '"' + s.txt.replace(/"/g, '""') + '"', s.src === 'pdf' ? 'PDF (GDD)' : 'CRIADA (PDF truncado)', STATION_NAME[s.station], Object.entries(r.ing).map(([k, v]) => v + 'x ' + IT[k].n).join(' + ')].join(';') + '\n'; }
fs.writeFileSync(__dirname + '/../docs/catalogo_120_espadas.csv', '\ufeff' + csv);
// Markdown por tier
let md = '# Catálogo mestre — 120 espadas\n\n> Gerado automaticamente a partir dos dados do jogo (`src/11_swords.js`).\n> **Origem:** `PDF` = linha original do GDD · `★ CRIADA` = o PDF veio **truncado** (só existiam os Tiers 1, 3 e 5); as 40 espadas dos Tiers 2, 4 e 6 foram criadas seguindo as regras de cada tier.\n\n';
const TN = { 1: 'TIER 1 — Início de jogo & Básico (001–020)', 2: 'TIER 2 — Pré-Bosses Intermediários (021–040)', 3: 'TIER 3 — Transição & Mid-Game (041–060)', 4: 'TIER 4 — Hardmode Inicial (061–080)', 5: 'TIER 5 — Hardmode Avançado (081–100)', 6: 'TIER 6 — End-Game / Mítico (101–120)' };
const COLS = { 1: '#10b981', 2: '#0284c7', 3: '#7c3aed', 4: '#d97706', 5: '#dc2626', 6: '#4f46e5' };
for (let t = 1; t <= 6; t++) {
  const L = SWORDS.filter(x => x.tierLevel === t), T_ = TIERS[t];
  md += `## ${TN[t]}\n\n- Cor de raridade: \`${COLS[t]}\` · multiplicador de dano do GDD: **${T_.mult[0]}x–${T_.mult[1]}x** · estação de criação: **${[...new Set(L.map(x => STATION_NAME[x.station]))].join(' / ')}**\n- Regra do tier: ${T_.mech}\n- Origem: ${L[0].src === 'pdf' ? '**PDF (GDD)** — textos originais' : '**★ CRIADAS** (PDF truncado)'}\n\n| # | Espada | Dano | Vel | KB | Crít | Mecânica única | Receita |\n|---|---|---|---|---|---|---|---|\n`;
  for (const s of L) { const r = RECIPES.find(r => r.out === s.id); md += `| ${String(s.num).padStart(3, '0')}${s.src === 'novo' ? ' ★' : ''} | **${s.swordName}** | ${s.baseDamage} | ${s.attackSpeed} | ${s.knockbackForce} | ${Math.round(s.critChance * 100)}% | ${s.txt} | ${Object.entries(r.ing).map(([k, v]) => v + '× ' + IT[k].n).join(', ')} _(${STATION_NAME[s.station]}${s.station === 'bench' ? '' : ''})_ |\n`; }
  md += '\n';
}
fs.writeFileSync(__dirname + '/../docs/catalogo_120_espadas.md', md);
console.log(errs ? ('ERROS: ' + errs) : 'CATÁLOGO OK');
