// Verifica se todo item usado em receitas é obtível: blocos, drops de inimigos/chefes, baús, lojas ou outra receita.
const fs = require('fs'), vm = require('vm');
const order = fs.readdirSync(__dirname + '/../src').filter(f => /^\d+.*\.js$/.test(f)).sort().filter(f => !/^16_/.test(f));
let code = order.map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { SWORDS, IT, RECIPES, TD, ED, ELEMS, SHOPS, STATION_NAME };`;
const stubEl = () => ({ getContext: () => ({}), width: 0, height: 0, style: {}, classList: { add() { }, remove() { }, toggle() { } }, appendChild() { }, addEventListener() { } });
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, performance: { now: () => Date.now() }, window: { addEventListener() { } }, ImageData: function () { }, document: { createElement: stubEl, getElementById: stubEl, head: stubEl() }, localStorage: {} };
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR', e.stack.split('\n').slice(0, 5).join('\n')); process.exit(1); }
const { SWORDS, IT, RECIPES, TD, ED, ELEMS, SHOPS } = ctx.__api;
const have = new Set(['coin']);
// 1) drops de blocos que existem no mundo (todos os tiles com drop)
TD.forEach(d => { if (d.d) have.add(d.d); });
// 2) drops de inimigos
Object.values(ED).forEach(d => d.drops.forEach(x => have.add(x[0])));
Object.values(ELEMS).forEach(e => have.add(e.ess)); ['celestial_frag', 'potion1', 'potion2', 'torch', 'life_crystal'].forEach(i => have.add(i));
// 3) chefes + baús
['coin', 'gel', 'life_crystal', 'acc_boots', 'potion1', 'platinum_bar', 'acc_ring', 'hell_bar', 'celestial_frag', 'potion2', 'acc_gauntlet', 'mythic_core', 'potion3', 'acc_star'].forEach(i => have.add(i));
['feather', 'cloud', 'torch', 'copper_bar', 'iron_bar', 'silver_bar', 'gold_bar', 'platinum_bar', 'ruby', 'emerald', 'topaz', 'sapphire', 'amethyst', 'acc_glove', 'acc_boots', 'acc_ring', 'acc_fang', 'acc_shield'].forEach(i => have.add(i));
// 4) lojas
for (const k in SHOPS) SHOPS[k]().forEach(i => have.add(i));
// 5) árvore de receitas (ponto fixo)
let changed = true; const madeBy = {};
while (changed) { changed = false; for (const r of RECIPES) if (!have.has(r.out) && Object.keys(r.ing).every(k => have.has(k))) { have.add(r.out); madeBy[r.out] = r; changed = true; } }
const missing = RECIPES.filter(r => !have.has(r.out));
const needed = new Set(); RECIPES.forEach(r => Object.keys(r.ing).forEach(k => needed.add(k)));
const raw = [...needed].filter(k => !RECIPES.some(r => r.out === k) && ![...have].includes(k));
console.log('itens obtíveis:', have.size, '/', Object.keys(IT).length);
console.log('receitas inalcançáveis:', missing.length, missing.map(r => r.out).join(', '));
console.log('ingredientes sem fonte:', raw.join(', ') || 'nenhum');
const notObtainable = Object.keys(IT).filter(k => !have.has(k)); console.log('itens inalcançáveis:', notObtainable.join(', ') || 'nenhum');
// custo total em minério por tier (informativo)
console.log('espadas craftáveis:', SWORDS.filter(s => have.has(s.id)).length, '/ 120');
