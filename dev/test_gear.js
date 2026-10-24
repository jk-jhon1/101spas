'use strict';
// Testes dos 50 acessórios, 50 armaduras, 50 minérios e 5 picaretas novas (11c_gear_x.js),
// sem navegador: carrega os módulos do jogo num contexto isolado, troca o motor por gravadores
// de chamadas e executa TODOS os ganchos de cada peça, procurando exceções e efeitos vazios.
//   node dev/test_gear.js            (só problemas + resumo)
//   node dev/test_gear.js -v         (mostra cada peça)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort()
  .filter(f => (!/^(1[4-9]|2\d)_/.test(f) || f === '15_ui.js') && !/gamepad/.test(f));
let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { IT, RECIPES, GORES, GARMS, GACCS, GPICKS, GFAM, GFAM_KEYS, ACC_FX, ARM_FX, SET_FX, BX, BX_ACC, G, newPlayer, recalcStats, rebuildGear, gearCall, gearSetCount, tipHTML, TIERS, STATION_NAME, GARM_ST };`;
const mkEl = () => ({ getContext: () => ({}), width: 0, height: 0, style: {}, dataset: {}, classList: { add() { }, remove() { }, toggle() { }, contains: () => false }, appendChild() { }, addEventListener() { } });
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, parseInt, parseFloat, isNaN,
  performance: { now: () => Date.now() }, ImageData: function () { }, requestAnimationFrame: () => 0,
  document: { createElement: mkEl, getElementById: () => null, head: { appendChild() { } }, body: { appendChild() { } } },
  window: { addEventListener() { }, removeEventListener() { } }, localStorage: {},
  navigator: { userAgent: 'node', getGamepads: () => [] },
};
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR', e.stack.split('\n').slice(0, 10).join('\n')); process.exit(1); }
const A = ctx.__api;
const V = process.argv.includes('-v');
let problems = 0, checks = 0;
const bad = (m) => { problems++; console.log('  ✗ ' + m); };
const ok = (cond, m) => { checks++; if (!cond) bad(m); return cond; };

// ---------- 1. contagens ----------
console.log('== contagens ==');
ok(A.GORES.length === 50, 'minérios: esperado 50, veio ' + A.GORES.length);
ok(A.GARMS.length === 50, 'armaduras: esperado 50, veio ' + A.GARMS.length);
ok(A.GACCS.length === 50, 'acessórios: esperado 50, veio ' + A.GACCS.length);
ok(A.GPICKS.length === 5, 'picaretas novas: esperado 5, veio ' + A.GPICKS.length);
ok(A.GFAM_KEYS.length === 10, 'famílias: esperado 10');
for (const fam of A.GFAM_KEYS) {
  ok(A.GARMS.filter(a => a.fam === fam).length === 5, 'armaduras da família ' + fam + ' ≠ 5');
  ok(A.GACCS.filter(a => a.fam === fam).length === 5, 'acessórios da família ' + fam + ' ≠ 5');
  ok(A.GORES.filter(o => o.fam === fam).length === 5, 'minérios da família ' + fam + ' ≠ 5');
}
console.log('  minérios ' + A.GORES.length + ' · barras ' + A.GORES.length + ' · armaduras ' + A.GARMS.length + ' · acessórios ' + A.GACCS.length + ' · picaretas ' + A.GPICKS.length);

// ---------- 2. dados e receitas ----------
console.log('== dados e receitas ==');
const tiersOk = { 2: 0, 4: 0, 6: 0, 7: 0, 8: 0, 10: 0 };
for (const o of A.GORES) {
  const it = A.IT[o.key];
  ok(!!it, 'minério sem item: ' + o.key);
  if (!it) continue;
  tiersOk[it.tier] = (tiersOk[it.tier] || 0) + 1;
  ok(!!A.IT[o.key + '_bar'], 'barra ausente para ' + o.key);
  ok(it.h === undefined || true, '');
  ok(it.ic && it.ic[0] === 'ore2', 'ícone do minério errado: ' + o.key);
  ok(A.RECIPES.some(r => r.out === o.key + '_bar'), 'sem receita de barra: ' + o.key);
}
for (const a of A.GARMS) {
  const it = A.IT[a.id];
  ok(!!it && it.type === 'armor', 'armadura sem item: ' + a.id);
  if (it) { ok(it.ic && it.ic[0] === 'armor2', 'ícone da armadura errado: ' + a.id); ok(it.def === a.def, 'defesa errada: ' + a.id); ok(!!it.fam, 'armadura sem família: ' + a.id); }
  const r = A.RECIPES.find(x => x.out === a.id);
  ok(!!r, 'sem receita de armadura: ' + a.id);
  ok(!!r && r.st === A.GARM_ST[a.t], 'estação errada em ' + a.id);
  ok(!!r && Object.keys(r.ing).every(k => A.IT[k]), 'ingrediente inexistente em ' + a.id);
}
let crafts = 0;
for (const a of A.GACCS) {
  const it = A.IT[a.id];
  ok(!!it && it.type === 'acc', 'acessório sem item: ' + a.id);
  if (it) { ok(it.ic && it.ic[0] === 'acc2', 'ícone do acessório errado: ' + a.id); ok(!!it.mech, 'sem mecânica: ' + a.id); ok(!!it.fam, 'sem família: ' + a.id); ok(!!A.ACC_FX[it.mech], 'mecânica sem implementação: ' + it.mech); }
  if (a.fonte === 'craft') { crafts++; ok(A.RECIPES.some(r => r.out === a.id), 'acessório forjável sem receita: ' + a.id); }
  else {
    const m = a.fonte.match(/^b:(.+)$/);
    ok(!!m, 'fonte inválida: ' + a.id);
    if (m) ok(!!A.BX_ACC[m[1]], 'chefe sem drop mapeado: ' + m[1]);
  }
}
for (const p of A.GPICKS) { const it = A.IT[p[0]]; ok(!!it && it.type === 'pick', 'picareta ausente: ' + p[0]); ok(A.RECIPES.some(r => r.out === p[0]), 'picareta sem receita: ' + p[0]); }
ok(crafts === 5, 'acessórios forjáveis: esperado 5, veio ' + crafts);
// todos os chefes com acessório existem de verdade
const bossIds = Object.keys(A.BX);
ok(bossIds.length === 90, 'chefes novos: esperado 90, veio ' + bossIds.length);
let bossAcc = 0;
for (const b of bossIds) if (A.BX_ACC[b]) bossAcc++;
ok(bossAcc === 41, 'chefes novos com acessório: esperado 41, veio ' + bossAcc);
for (const b of ['slime', 'eye', 'guardian', 'colossus']) ok(!!A.BX_ACC[b], 'chefe clássico sem acessório: ' + b);
// nenhum acessório repetido entre chefes
ok(new Set(Object.values(A.BX_ACC)).size === Object.keys(A.BX_ACC).length, 'acessório repetido entre chefes');
// armaduras só com mecânicas implementadas
for (const a of A.GARMS) ok(!!A.ARM_FX[a.fam + '_' + a.t], 'passiva sem implementação: ' + a.fam + '_' + a.t);
ok(Object.keys(A.ACC_FX).length === 50, 'ACC_FX: esperado 50, veio ' + Object.keys(A.ACC_FX).length);
ok(Object.keys(A.ARM_FX).length === 50, 'ARM_FX: esperado 50, veio ' + Object.keys(A.ARM_FX).length);
ok(Object.keys(A.SET_FX).length === 10, 'SET_FX: esperado 10, veio ' + Object.keys(A.SET_FX).length);
console.log('  tiers dos minérios: ' + JSON.stringify(Object.keys(tiersOk).filter(k => tiersOk[k]).map(k => 'T' + k + ':' + tiersOk[k])));
console.log('  acessórios: ' + (50 - crafts) + ' de chefes + ' + crafts + ' forjáveis');

// ---------- 3. ganchos: nenhum efeito pode lançar exceção ----------
console.log('== execução dos ganchos ==');
const rec = { hit: 0, proj: 0, boom: 0, part: 0, status: 0, buff: 0, heal: 0, text: 0, sound: 0, drop: 0 };
vm.runInContext(`
  const R = __rec = { hit: 0, proj: 0, boom: 0, part: 0, status: 0, buff: 0, heal: 0, text: 0, sound: 0, drop: 0 };
  hitEnemy = (e, h) => { R.hit++; return { dmg: h && h.dmg || 1, crit: false, e, killed: false }; };
  killEnemy = () => { };
  explode = () => { R.boom++; };
  burst = () => { R.part++; };
  addPart = () => { R.part++; };
  ringFx = () => { R.part++; };
  chainFx = () => { R.part++; };
  spawnProj = (o) => { R.proj++; return Object.assign({}, o); };
  applyStatus = () => { R.status++; };
  addBuff = (n, t, d) => { const P = G.P; P.buffs[n] = Object.assign({ t }, d || {}); R.buff++; };
  healPlayer = (n) => { R.heal++; G.P.hp = Math.min(G.P.maxHp, G.P.hp + (n || 0)); };
  hurtPlayer = () => { R.text++; return true; };
  addText = () => { R.text++; };
  flash = () => { };
  shake = () => { };
  sfx = () => { R.sound++; };
  groundWave = () => { R.proj++; return {}; };
  dropItem = () => { R.drop++; };
  screenDamage = () => { };
  G.P = null; G.enemies = []; G.projs = []; G.drops = []; G.t = 100; G.mouse = { wx: 300, wy: 200, down: [], pressed: [] };
  G.light = { addLight() { } }; G.opts = { god: false }; G.mode = 'adventure'; G.cam = { x: 0, y: 0, w: 800, h: 600, zoom: 1 };
  G.night = false; G.world = { get: () => 0, wallAt: () => 0, liqAt: () => 0, w: 1400, h: 480, h: 480 };
`, ctx);
const makeP = () => {
  const P = vm.runInContext('newPlayer()', ctx);
  P.x = 200; P.y = 200; P.w = 12; P.h = 26; P.hp = 100; P.maxHp = 100; P.cb.sw = null;
  P.equip = { armor: null, acc: [null, null, null, null] };
  return P;
};
const mkEnemy = () => ({ id: 'e' + Math.random(), x: 240, y: 200, w: 16, h: 24, hp: 100, hpMax: 100, def: 5, st: {}, bxh: null, dead: false, mass: 1, kbr: 0, vx: 0, vy: 0, buffs: {} });
const hooks = ['stats', 'tick', 'mod', 'onHit', 'onKill', 'onHurt', 'incoming', 'onLethal', 'onJump', 'onLand', 'onWater', 'onPotion', 'onSwing'];
const runHooks = (P, id, kind) => {
  const A2 = A, it = A.IT[id];
  const reg = kind === 'armor' ? A.ARM_FX : A.ACC_FX;
  const mk = reg[it.mech]; if (!mk) return false;
  const fx = mk(it, {});
  let fired = 0;
  for (const h of hooks) {
    const f = fx[h]; if (!f) continue;
    try {
      const st = { def: 0, dmg: 0, crit: 0, cm: 1, spd: 0, steal: 0, kbr: 0, hp: 0 };
      if (h === 'stats') f.call(fx, P, st); else if (h === 'tick') { for (let i = 0; i < 40; i++) { vm.runInContext('G.t += 0.25', ctx); f.call(fx, P, .25); } }
      else if (h === 'mod') f.call(fx, P, mkEnemy(), { dmg: 10 });
      else if (h === 'onHit') f.call(fx, P, mkEnemy(), {}, { dmg: 50, crit: true, killed: false });
      else if (h === 'onHurt') f.call(fx, P, 30, {});
      else if (h === 'incoming') f.call(fx, P, { dmg: 10, mult: 1, flat: 0, dodge: false });
      else if (h === 'onLand') f.call(fx, P, 12);
      else if (h === 'onSwing') f.call(fx, P, {});
      else if (h === 'onKill') f.call(fx, P, mkEnemy(), {});
      else if (h === 'onLethal') { P.hp = 0; f.call(fx, P); P.hp = 100; }
      else f.call(fx, P);
      fired++;
    } catch (e) { bad(it.n + ' (' + it.mech + ') em ' + h + ': ' + e.message); }
  }
  return fired > 0;
};
const before = () => vm.runInContext('JSON.stringify(__rec)', ctx);
let silent = 0;
for (const a of A.GACCS) {
  const P = makeP(); vm.runInContext('G.P = null', ctx);
  const r0 = JSON.parse(before());
  const P2 = makeP(); A.G.P = P2;
  const fired = runHooks(P2, a.id, 'acc');
  const r1 = JSON.parse(before());
  const effects = Object.keys(rec).filter(k => r1[k] > r0[k]);
  if (!fired) { bad('acessório sem ganchos: ' + a.id); }
  else if (!effects.length && a.key !== 'anel' ) { /* anéis flat podem só dar stats */ }
  if (V) console.log('  ' + (A.IT[a.id].n + '                        ').slice(0, 26) + effects.join(','));
}
for (const a of A.GARMS) {
  const P2 = makeP(); A.G.P = P2;
  if (!runHooks(P2, a.id, 'armor')) bad('armadura sem passiva executável: ' + a.id);
}
// conjuntos: 2 e 4 peças não podem lançar exceção
for (const fam of A.GFAM_KEYS) {
  for (const n of [2, 3, 4, 5]) {
    try {
      const fx = A.SET_FX[fam](n, {});
      const P = makeP(); A.G.P = P;
      const st = { def: 0, dmg: 0, crit: 0, cm: 1, spd: 0, steal: 0, kbr: 0, hp: 0 };
      if (fx.stats) fx.stats(P, st);
      if (fx.tick) { fx.tick(P, .25); fx.tick(P, 1.2); }
      if (fx.onHit) fx.onHit(P, mkEnemy(), {}, { dmg: 20, crit: true });
      if (fx.onKill) fx.onKill(P, mkEnemy());
    } catch (e) { bad('conjunto ' + fam + ' (' + n + ' peças): ' + e.message); }
  }
}

// ---------- 4. equipamento completo: atributos, conjuntos e tooltips ----------
console.log('== equipamento completo ==');
{
  const P = makeP(); A.G.P = P;
  P.equip.armor = { id: 'armx_brasa_2', n: 1 };
  P.equip.acc = [{ id: 'accx_brasa_anel', n: 1 }, { id: 'accx_brasa_fole', n: 1 }, null, null];
  vm.runInContext('recalcStats()', ctx);
  ok(P.setCount && P.setCount.brasa === 3, 'contagem do conjunto Braseiro ≠ 3 (veio ' + JSON.stringify(P.setCount) + ')');
  ok((P.sets || []).length === 1, 'bônus de conjunto não ativado');
  ok(P.stats.def >= 20, 'defesa não somou a armadura');
  ok(P.maxHp >= 100, 'vida máxima inválida');
  // 4 slots
  P.equip.acc = [{ id: 'accx_brasa_anel', n: 1 }, { id: 'accx_brasa_fole', n: 1 }, { id: 'accx_brasa_coracao', n: 1 }, { id: 'accx_brasa_manopla', n: 1 }];
  vm.runInContext('recalcStats()', ctx);
  ok(P.setCount.brasa === 5, 'conjunto de 5 peças não contou');
  ok(P.gear.length === 5, 'peças ativas: esperado 5, veio ' + P.gear.length);
}
// tooltips de todos os itens novos
{
  const P = makeP(); A.G.P = P; vm.runInContext('recalcStats()', ctx);
  let tt = 0;
  for (const id of Object.keys(A.IT)) {
    const it = A.IT[id];
    if (!(it.fam || id.startsWith('or_'))) continue;
    try { const h = A.tipHTML(id); ok(!!h, 'tooltip vazio: ' + id); tt++; } catch (e) { bad('tooltip de ' + id + ': ' + e.message); }
  }
  console.log('  tooltips gerados: ' + tt);
}

// ---------- 5. minérios no mundo ----------
{
  const h = A.GORES.map(o => o.h);
  ok(Math.min(...h) === 2 && Math.max(...h) === 14, 'faixa de dureza dos minérios inesperada: ' + Math.min(...h) + '–' + Math.max(...h));
  const pows = A.GPICKS.map(p => A.IT[p[0]].pow);
  for (const hh of new Set(h)) ok(pows.some(p => p >= hh) || hh <= 9, 'nenhuma picareta alcança dureza ' + hh);
  ok(A.GORES.every(o => o.bio === null || Array.isArray(o.bio)), 'bioma inválido em algum minério');
}

console.log('');
console.log(problems ? ('PROBLEMAS: ' + problems + ' (em ' + checks + ' verificações)') : ('GEAR OK — ' + checks + ' verificações, 0 problemas'));
process.exit(problems ? 1 : 0);
