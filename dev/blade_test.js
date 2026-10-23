// Teste visual de parâmetros de lâmina (não faz parte do jogo)
const fs = require('fs'), path = require('path'), vm = require('vm');
const { createCanvas } = require('/tmp/canvas/node_modules/@napi-rs/canvas');
const ROOT = path.join(__dirname, '..');
const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort().filter(f => !/^(1[4-9]|2\d)_/.test(f));
let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { SWORDS, IT, getSwordSprite, art2Paint, A2, TIERS };`;
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON,
  performance: { now: () => Date.now() }, ImageData: function () { },
  document: { createElement: () => createCanvas(1, 1), getElementById: () => null, head: { appendChild() { } } }, window: { addEventListener() { } }, localStorage: {},
};
ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const A = ctx.__api;

const specs = [];
for (const w of [2.2, 2.8, 3.4, 4.0]) for (const len of [42, 50]) {
  specs.push(A.A2('leaf', { col: '#bff0ff', hot: '#5eead4', glow: '#5eead4', w, len, guard: 'swept', guardCol: '#cdeffd', grip: 'wrap', pommel: 'gem', extras: [] }));
}
const SC = 8, CW = 120 * SC / 4, CH = 40 * SC / 4;
const cv = createCanvas(CW * 4 + 40, CH * 2 + 60), g = cv.getContext('2d');
g.fillStyle = '#59637d'; g.fillRect(0, 0, cv.width, cv.height);
let i = 0;
for (const sp of specs) {
  const sw = { id: 't' + i, num: 900 + i, swordName: 't', tierLevel: 7, baseDamage: 10, attackSpeed: 1, knockbackForce: 1, critChance: .1, attackType: 'ArcSwing', passiveEffects: [], look: sp };
  const s = A.art2Paint(sw);
  const x = 20 + (i % 4) * CW, y = 20 + Math.floor(i / 4) * CH;
  g.imageSmoothingEnabled = false;
  g.drawImage(s.c, x, y + 10, s.w * SC / 2, s.h * SC / 2);
  g.fillStyle = '#fff'; g.font = '14px sans-serif';
  g.fillText('w' + sp.art2.w + ' len' + sp.len, x + 4, y + CH - 6);
  i++;
}
fs.writeFileSync('/tmp/bladetest.png', cv.toBuffer('image/png'));
console.log('ok', cv.width, cv.height);
