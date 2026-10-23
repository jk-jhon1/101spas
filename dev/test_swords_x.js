'use strict';
// Testes de integração das 80 espadas novas (Tiers 7–10), sem navegador:
// carrega os módulos do jogo num contexto isolado, substitui o "motor" (dano, projéteis, explosões...)
// por gravadores de chamadas e executa TODOS os hooks de efeito de cada espada, procurando exceções
// e ganchos que não fazem nada.
//   node dev/test_swords_x.js            (só problemas)
//   node dev/test_swords_x.js -v         (todas)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort()
  .filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));
let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { SWORDS, IT, RECIPES, TIERS, FX2, FX, TIERS2: TIERS };\n;globalThis.__G = G;`;
const mkEl = () => ({ getContext: () => ({}), width: 0, height: 0, style: {}, classList: { add() { }, remove() { }, toggle() { } }, appendChild() { }, addEventListener() { } });
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON,
  performance: { now: () => Date.now() }, ImageData: function () { },
  document: { createElement: mkEl, getElementById: () => null, head: { appendChild() { } }, body: { appendChild() { } } },
  window: { addEventListener() { } }, localStorage: {},
};
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(1); }
const A = ctx.__api;

// ---------- gravar chamadas do motor ----------
const rec = { hit: 0, proj: 0, explode: 0, beam: 0, screen: 0, meteor: 0, homing: 0, portal: 0, swing: 0, status: 0, heal: 0, buff: 0, text: 0, fx: 0, startSwing: 0, shoot: 0 };
const noop = () => { };
vm.runInContext(`
  const R = ${JSON.stringify(rec)};
  globalThis.__R = R;
  globalThis.__G2 = G;
  hitEnemy = (e, h) => { R.hit++; return { dmg: 10, crit: false, killed: false }; };
  spawnProj = (o) => { R.proj++; return Object.assign({ id: 'p' + R.proj, age: 0, life: 1, maxLife: 1, x: o.x || 0, y: o.y || 0, vx: o.vx || 0, vy: o.vy || 0, r: o.r || 5, dmg: o.dmg || 1, hm: new Map(), back: false }, o); };
  explode = (x, y, r, d, o) => { R.explode++; };
  fireBeam = (o) => { R.beam++; return { id: 'b', x: o.x, y: o.y, ang: o.ang, len: o.len, life: 1, maxLife: 1, bw: o.width || 8, onUpdate: null }; };
  screenDamage = () => { R.screen++; return 3; };
  meteorFall = () => { R.meteor++; };
  homingBlade = () => { R.homing++; };
  portalAt = () => { R.portal++; };
  startSwing = () => { R.startSwing++; return {}; };
  applyStatus = (e, n, d, p) => { R.status++; if (e && e.st) e.st[n] = { t: d }; };
  healPlayer = () => { R.heal++; };
  addBuff = () => { R.buff++; };
  addText = () => { R.text++; };
  burst = () => { R.fx++; };
  ringFx = () => { R.fx++; };
  addPart = () => { R.fx++; };
  flash = () => { R.fx++; };
  shake = () => { R.fx++; };
  sfx = () => { };
  drawGlow = () => { };
`, ctx);
const R = ctx.__R;

// ---------- mundo / jogador / alvos falsos ----------
const P = {
  x: 400, y: 200, w: 12, h: 26, face: 1, hp: 100, maxHp: 100, vx: 0, vy: 0, onGround: true, buffs: {}, st: {}, inv: [], sel: 0,
  cb: { sw: null, inst: [], cd: 0, side: 1, count: 0, hits: 0, swingT: 0, main: null, blockT: 0, blockPct: 0 },
  stats: { dmg: 0, crit: 0, cm: 1, def: 0, spd: 0 },
};
const G = ctx.__G;
G.P = P; G.t = 10; G.enemies = []; G.projs = []; G.parts = []; G.texts = []; G.drops = []; G.srcId = 1; G.swingId = 1;
G.cam = { x: 300, y: 120, zoom: 2, w: 1200, h: 640, shake: 0 };
G.mouse = { wx: 520, wy: 210, sx: 100, sy: 100, down: [false, false, false], pressed: [false, false, false] };
G.opts = { god: true, showDps: false, noSpawn: true };
G.mode = 'creative'; G.freeze = 0; G.dark = 0; G.hitStop = 0; G.flash = null; G.dpsLog = []; G.stage = 3; G.time = .25;
G.light = { addLight() { }, }; G.world = { get: () => 1, set() { }, h: 800, layerAt: () => 'surface', biomeName: () => 'forest', spawn: { x: 400, y: 200 } };
const mkEnemy = (dx) => ({
  x: P.x + dx, y: P.y, w: 18, h: 22, hp: 60, hpMax: 60, def: 0, mass: 1, kbr: 0, kbT: 0, vx: 0, vy: 0, st: {}, imm: new Map(), ghostly: 0, harmless: 0, invulnerable: 0,
  face: 1, blood: ['#c0392b'], dead: false, boss: 0, fly: 0, elem: '', isDummy: 0,
});
const pcx = P => P.x + P.w / 2, pcy = P => P.y + P.h / 2;
const instOf = (sw, aim) => ({
  id: G.swingId++, sw, ghost: false, sub: false, ox: 0, oy: 0, aim: aim === undefined ? .2 : aim, side: 1, t: .1, dur: .2, arc: sw.look.arc || 2.5,
  reach: sw.look.len - 3 + 7, thrust: sw.attackType === 'Thrust' || sw.attackType === 'Beam', hit: new Set(), apex: true, dmgMult: 1, kbMult: 1, trail: [], alpha: 1, cycle: 1, hitCount: 0, a: 0, pa: null, dead: false, fade: 0,
  tip: { x: pcx(P) + Math.cos(aim || .2) * (sw.look.len + 4), y: pcy(P) + Math.sin(aim || .2) * (sw.look.len + 4) }, ox0: pcx(P), oy0: pcy(P),
});

const news = A.SWORDS.filter(s => s.num > 120);
const rows = [], probs = [];
const VERB = process.argv.includes('-v');
for (const sw of news) {
  const row = { num: sw.num, name: sw.swordName, tier: sw.tierLevel, err: null, calls: {} };
  const before = Object.assign({}, R);
  P.cb.sw = sw; P.inv = [{ id: sw.id, n: 1 }]; P.sel = 0;
  try {
    G.enemies = [mkEnemy(26), mkEnemy(70), mkEnemy(-40)];
    for (const hook of ['init', 'swing', 'onSwing', 'onApex', 'onHit', 'onProjHit', 'onKill', 'mod', 'stats', 'atkMult']) {
      const inst = instOf(sw);
      const e = G.enemies[0], h = { src: 'melee', id: 'm' + inst.id, dmg: sw.baseDamage, kb: sw.knockbackForce, sword: sw, inst, dir: { x: 1, y: -.1 }, fromX: pcx(P), fromY: pcy(P), fs: 1, kbMult: 1 };
      const res = { dmg: 40, crit: true, killed: false };
      for (const f of sw.passiveEffects) {
        const fn = f[hook]; if (!fn) continue;
        try {
          if (hook === 'init') fn.call(f, sw);
          else if (hook === 'tick' || hook === 'atkMult' || hook === 'stats') fn.call(f, P, P.stats || {});
          else if (hook === 'onKill') fn.call(f, P, e, h, res);
          else if (hook === 'onProjHit') fn.call(f, P, Object.assign({ x: pcx(P), y: pcy(P), vx: 300, vy: 0, dmg: 50, col: '#fff', sword: sw, angle: 0 }, {}), e, res);
          else if (hook === 'mod') { const h2 = Object.assign({}, h); fn.call(f, P, e, h2); }
          else if (hook === 'stats') fn.call(f, P.stats);
          else if (hook === 'swing' || hook === 'onSwing') fn.call(f, P, inst, P.cb);
          else if (hook === 'onApex') fn.call(f, P, inst);
          else if (hook === 'onHit') fn.call(f, P, e, h, res);
          else fn.call(f, P, inst, P.cb);
        } catch (ex) { throw new Error(hook + ': ' + (ex && ex.message)); }
      }
    }
    // 90 quadros de tick (timers: marcas, convergência, escudo, domínios) + 6 onHit seguidos
    for (let f = 0; f < 90; f++) {
      G.t += 1 / 60;
      for (const fx of sw.passiveEffects) if (fx.tick) fx.tick(P, 1 / 60);
      if (f % 15 === 0) for (const fx of sw.passiveEffects) if (fx.onHit) fx.onHit(P, G.enemies[0], { src: 'melee', id: 'x' + f, sword: sw, inst: instOf(sw) }, { dmg: 50, crit: false });
    }
    // contagem por tipo de chamada do motor
    for (const k in R) if (R[k] - (before[k] || 0) > 0) row.calls[k] = R[k] - (before[k] || 0);
    const active = Object.values(row.calls).reduce((a, b) => a + b, 0);
    if (!active) probs.push(row.num + ' ' + row.name + ': nenhum efeito chamou o motor');
  } catch (e) { row.err = String(e.message || e); probs.push(row.num + ' ' + row.name + ': ' + row.err); }
  rows.push(row);
}
// relatório
const by = {};
for (const r of rows) { by[r.tier] = (by[r.tier] || 0) + 1; }
console.log('espadas novas testadas:', rows.length, '| por tier:', JSON.stringify(by));
if (VERB) for (const r of rows) console.log(String(r.num).padStart(3, '0'), r.name.padEnd(26), JSON.stringify(r.calls), r.err || 'ok');
console.log('problemas:', probs.length);
for (const p of probs.slice(0, 40)) console.log('  ✗', p);
// cobertura dos ganchos FX2 (quais efeitos novos cada tier usa)
const used = new Set();
for (const sw of news) for (const f of sw.passiveEffects) for (const k in f) used.add(k);
console.log('ganchos usados pelas novas:', [...used].sort().join(', '));
const fxNames = new Set(); for (const sw of news) for (const f of sw.passiveEffects) { for (const k of Object.keys(A.FX2)) if (f === A.FX2[k] || (f.__fx2 === k)) fxNames.add(k); }
console.log('efeitos FX2 disponíveis:', Object.keys(A.FX2).length, '| usados diretamente:', [...fxNames].sort().join(', ') || '(encerrados em closures)');
process.exitCode = probs.length ? 1 : 0;
