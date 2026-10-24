'use strict';
// Teste da aparência das peças novas: desenha cada ícone (32x32, como no jogo) e confere que
// NENHUMA peça repete a silhueta nem as cores de outra. Também gera folhas de contato para olhar.
//   node dev/test_gear_art.js                 (só o resultado)
//   node dev/test_gear_art.js --sheet /tmp/x  (grava as folhas de contato em /tmp/x)
// Precisa de @napi-rs/canvas (já instalado por dev/pdf): npm --prefix dev/pdf install
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');

let createCanvas;
try { ({ createCanvas } = require(path.join(__dirname, 'pdf/node_modules/@napi-rs/canvas'))); }
catch (e) { console.error('falta @napi-rs/canvas: rode  npm --prefix dev/pdf install'); process.exit(2); }

// ---------- carrega o jogo (sem a inicialização que precisa de DOM real) ----------
const order = fs.readdirSync(path.join(ROOT, 'src')).filter(f => /^\d+.*\.js$/.test(f)).sort().filter(f => !/^(1[4-9]|2\d)_/.test(f));
let code = order.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('\n;\n');
code += '\n;globalThis.__x = { iconCanvas, IT, GORES, GARMS, GACCS, GPICKS, GFAM };';
const mkCanvas = (w, h) => { const c = createCanvas(48, 48); if (w) c.width = w; if (h) c.height = h; return c; };
const stubEl = () => ({
  addEventListener() { }, appendChild() { }, style: {}, dataset: {}, classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
  getContext: () => mkCanvas(48, 48).getContext('2d'), width: 0, height: 0, innerHTML: '', textContent: '',
});
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, parseInt, parseFloat, isNaN,
  performance: { now: () => Date.now() }, requestAnimationFrame: () => 0,
  addEventListener() { }, innerWidth: 1280, innerHeight: 720, location: { href: 'http://x/' },
  navigator: { userAgent: 'node' }, localStorage: { getItem: () => null, setItem() { }, removeItem() { } },
  ImageData: function (w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); },
};
ctx.globalThis = ctx; ctx.window = ctx;
ctx.document = { createElement: (t) => t === 'canvas' ? mkCanvas(48, 48) : stubEl(), getElementById: () => stubEl(), addEventListener() { }, body: stubEl(), documentElement: stubEl(), head: { appendChild() { } } };
vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('LOAD ERROR', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(1); }
const X = ctx.__x;

// ---------- impressão digital de cada ícone ----------
function fingerprint(id) {
  const c = X.iconCanvas(id), g = c.getContext('2d');
  const im = g.getImageData(0, 0, c.width, c.height).data;
  const rgba = crypto.createHash('sha1').update(Buffer.from(im)).digest('hex');
  const alpha = Buffer.alloc(c.width * c.height);
  let ink = 0;
  for (let i = 0, j = 3; i < alpha.length; i++, j += 4) { alpha[i] = im[j] > 127 ? 255 : 0; if (alpha[i]) ink++; }
  return { rgba, shape: crypto.createHash('sha1').update(alpha).digest('hex'), ink };
}
function group(name, items) {
  const rows = items.map(it => ({ id: it.id, nome: it.nome, tier: it.tier, fp: fingerprint(it.id) }));
  const byRgba = new Map(), byShape = new Map();
  for (const r of rows) {
    if (!byRgba.has(r.fp.rgba)) byRgba.set(r.fp.rgba, []); byRgba.get(r.fp.rgba).push(r);
    if (!byShape.has(r.fp.shape)) byShape.set(r.fp.shape, []); byShape.get(r.fp.shape).push(r);
  }
  const dupRgba = [...byRgba.values()].filter(l => l.length > 1);
  const dupShape = [...byShape.values()].filter(l => l.length > 1);
  const blank = rows.filter(r => r.fp.ink < 40);
  const tiny = rows.filter(r => r.fp.ink > 0 && r.fp.ink < 90);
  console.log(`\n${name}: ${rows.length} peças`);
  console.log(`  desenhos idênticos (cor + forma): ${dupRgba.length ? dupRgba.map(l => l.map(x => x.nome).join(' = ')).join(' | ') : 'nenhum'}`);
  console.log(`  silhuetas idênticas: ${dupShape.length ? dupShape.map(l => l.map(x => x.nome).join(' = ')).join(' | ') : 'nenhuma'}`);
  if (blank.length) console.log('  ✗ sem desenho: ' + blank.map(r => r.nome).join(', '));
  if (tiny.length) console.log('  ! desenho pequeno demais: ' + tiny.map(r => r.nome + ' (' + r.fp.ink + 'px)').join(', '));
  const inks = rows.map(r => r.fp.ink);
  console.log(`  pixels pintados: ${Math.min(...inks)}–${Math.max(...inks)} (mediana ${inks.slice().sort((a, b) => a - b)[Math.floor(inks.length / 2)]})`);
  return dupRgba.length + dupShape.length + blank.length;
}

// ---------- variante própria: dentro do mesmo tipo, nenhuma peça repete o desenho ----------
function variants() {
  const byShape = new Map();
  for (const a of X.GACCS) {
    const sp = X.IT[a.id].ic, sh = sp[2], v = sp[5];
    if (!byShape.has(sh)) byShape.set(sh, new Map());
    const m = byShape.get(sh);
    if (!m.has(v)) m.set(v, []);
    m.get(v).push(X.IT[a.id].n);
  }
  let bad2 = 0;
  console.log('\nDesenho por tipo de acessório:');
  for (const [sh, m] of byShape) {
    const dup = [...m.values()].filter(l => l.length > 1);
    const n = [...m.keys()].length;
    console.log(`  ${sh.padEnd(9)} ${String(n).padStart(2)} desenho(s)${dup.length ? '  ✗ repetido: ' + dup.map(l => l.join(' = ')).join(' | ') : ''}`);
    bad2 += dup.length;
  }
  return bad2;
}

let bad = 0;
bad += variants();
bad += group('Minérios', X.GORES.map(o => ({ id: o.key, nome: o.nome, tier: o.tier })));
bad += group('Barras', X.GORES.map(o => ({ id: o.key + '_bar', nome: o.nome, tier: o.tier })));
bad += group('Armaduras', X.GARMS.map(a => ({ id: a.id, nome: X.IT[a.id].n, tier: X.IT[a.id].tier })));
bad += group('Acessórios', X.GACCS.map(a => ({ id: a.id, nome: X.IT[a.id].n, tier: a.tier })));
bad += group('Picaretas', X.GPICKS.map(p => ({ id: p[0], nome: p[1], tier: X.IT[p[0]].tier })));

// ---------- folhas de contato (opcional) ----------
const si = process.argv.indexOf('--sheet');
if (si > 0) {
  const dir = process.argv[si + 1] || '/tmp';
  fs.mkdirSync(dir, { recursive: true });
  const sheet = (items, file, cols = 10, size = 64, title = '') => {
    const rows = Math.ceil(items.length / cols), pad = 16;
    const c = createCanvas(cols * size, rows * (size + pad) + 26), g = c.getContext('2d');
    g.fillStyle = '#0f1117'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#e5e7eb'; g.font = 'bold 13px sans-serif'; g.textAlign = 'left'; g.fillText(title, 8, 17);
    g.imageSmoothingEnabled = false;
    items.forEach((it, i) => {
      const x = (i % cols) * size, y = 26 + Math.floor(i / cols) * (size + pad);
      try { g.drawImage(X.iconCanvas(it.id), x + 6, y, size - 12, size - 12); } catch (e) { g.fillStyle = '#f00'; g.fillRect(x + 6, y, size - 12, size - 12); }
      g.fillStyle = '#8b95a5'; g.font = '8px sans-serif'; g.textAlign = 'center';
      const nm = X.IT[it.id].n.replace(/^(Armadura|Couraça|Peitoral|Manto|Placas|Égide) /, '');
      g.fillText(nm.slice(0, Math.floor(size / 4.6)), x + size / 2, y + size - 2);
    });
    fs.writeFileSync(path.join(dir, file), c.toBuffer('image/png'));
    console.log('  folha:', path.join(dir, file));
  };
  console.log('\nfolhas de contato:');
  sheet(X.GORES.map(o => ({ id: o.key })), 'minerios.png', 10, 64, '50 minérios — cada um com geometria própria');
  sheet(X.GORES.map(o => ({ id: o.key + '_bar' })), 'barras.png', 10, 64, '50 barras — selo da família e marcas de tier');
  sheet(X.GARMS.map(a => ({ id: a.id })), 'armaduras.png', 10, 64, '50 armaduras — 5 cortes × 5 motivos, brasão da família por cima');
  sheet(X.GACCS.map(a => ({ id: a.id })), 'acessorios.png', 10, 64, '50 acessórios — treze formas, variantes e cravos próprios por peça');
  sheet(X.GPICKS.map(p => ({ id: p[0] })), 'picaretas.png', 5, 80, '5 picaretas — cabeças diferentes');
}

console.log(bad ? `\nPROBLEMAS: ${bad}` : '\nARTE OK — nenhuma peça repete outra');
process.exit(bad ? 1 : 0);
