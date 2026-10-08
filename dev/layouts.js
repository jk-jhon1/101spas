'use strict';
// Variedade dos mundos: layout de biomas (ordem, largura, oceanos), estilo do relevo, sorteio de semente inédita e mundos completos.
//   node dev/layouts.js      (partes: 1 layout em 20.000 sementes · 2 política de sorteio · 3 mundos completos comparados)
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const files = ['00_util', '01_data', '02_world', '03_worldgen', '04_light'];
let code = files.map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f + '.js'), 'utf8')).join('\n;\n');
code += '\n;globalThis.__api = { World, genWorld, makeLayout, layoutRuns, runsSimilarity, chooseSeed, biomeKeyOf, T, WW, WH, SOLID, TS };';
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Set, Map, Array, Object, String, Number, JSON };
ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const { World, genWorld, makeLayout, layoutRuns, runsSimilarity, chooseSeed, biomeKeyOf, T, WW, WH, SOLID, TS } = ctx.__api;

let fails = 0;
const check = (name, ok, detail = '') => { if (!ok) fails++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + detail : '')); };
const sha = (arr) => crypto.createHash('sha1').update(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)).digest('hex').slice(0, 12);
const xorshift = (seed) => { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x; }; };
const maxPair = (list, f) => { let m = 0, pair = ''; for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) { const s = f(list[a], list[b]); if (s > m) { m = s; pair = a + ' x ' + b; } } return { m, pair }; };

// ---------------- 1: makeLayout (função pura) ----------------
console.log('== 1. makeLayout em 20.000 sementes ==');
const next = xorshift(123456789), N = 20000;
const orders = {}, bad = []; let spLo = 1e9, spHi = 0, oLo = 1e9, oHi = 0;
for (let i = 0; i < N; i++) {
  const seed = next(), L = makeLayout(seed), S = L.style;
  const widths = L.hi.slice(1, 5).map((h, k) => h - L.lo[k + 1]);
  const contiguous = L.hi[0] === L.land0 && L.lo[1] === L.land0 && [1, 2, 3].every((k) => L.hi[k] === L.lo[k + 1]) && L.hi[4] === L.land1 && L.lo[5] === L.land1;
  const fi = L.kind.indexOf(2), fLo = L.lo[fi], fHi = L.hi[fi], oL = L.land0, oR = WW - L.land1;
  const ok = contiguous && widths.reduce((a, b) => a + b, 0) === L.land1 - L.land0 && L.kind.length === 6 && L.kind[0] === 0 && L.kind[5] === 0
    && new Set(L.order).size === 4 && widths.every((w, k) => w >= (L.kind[k + 1] === 2 ? 255 : 150))
    && oL >= 90 && oL <= 220 && oR >= 90 && oR <= 220
    && L.spawnX >= fLo + 105 && L.spawnX <= fHi - 105
    && [S.hillF, S.hillJ, S.hillS].every((h) => h >= .65 && h <= 1.5) && S.dune >= .6 && S.dune <= 2.4 && S.cave >= .85 && S.cave <= 1.25
    && S.lakes >= 9 && S.lakes <= 18 && S.islands >= 8 && S.islands <= 13;
  if (!ok && bad.length < 2) bad.push({ seed, L });
  orders[L.key] = (orders[L.key] || 0) + 1; spLo = Math.min(spLo, L.spawnX); spHi = Math.max(spHi, L.spawnX); oLo = Math.min(oLo, oL, oR); oHi = Math.max(oHi, oL, oR);
}
check('invariantes (faixas contíguas, larguras mínimas, oceanos 90-220, spawn dentro da floresta, estilo no intervalo)', bad.length === 0, bad.length ? JSON.stringify(bad[0]) : '');
const fr = Object.values(orders).map((v) => v / N);
check('as 24 ordens de bioma aparecem, equilibradas (3,0% a 5,5% cada)', fr.length === 24 && fr.every((f) => f > .03 && f < .055), `${fr.length} ordens, ${(Math.min(...fr) * 100).toFixed(2)}% a ${(Math.max(...fr) * 100).toFixed(2)}%`);
check('spawn varia muito pelo mapa e os oceanos variam de tamanho', spLo < 380 && spHi > 900 && oLo < 100 && oHi > 210, `spawn x ${spLo}..${spHi}, oceano ${oLo}..${oHi}`);
check('determinístico (mesma semente = mesmo layout) e sementes diferentes dão layouts diferentes', JSON.stringify(makeLayout(777)) === JSON.stringify(makeLayout(777)) && JSON.stringify(makeLayout(777)) !== JSON.stringify(makeLayout(778)));

// ---------------- 2: política de sorteio de semente ----------------
console.log('\n== 2. chooseSeed: sementes inéditas e mapas de biomas bem diferentes ==');
const streams = [2463534242, 99991, 31337].map((s) => {
  const r32 = xorshift(s), used = new Set(), ex = [], seeds = [];
  for (let n = 0; n < 60; n++) { const r = chooseSeed(r32, used, ex); used.add(r.seed); seeds.push(r.seed); ex.push({ key: r.key, runs: layoutRuns(makeLayout(r.seed)) }); }
  return { seeds, ex };
});
check('nenhuma semente repetida (3 sequências de 60 mundos)', streams.every((s) => new Set(s.seeds).size === 60));
check('os 24 primeiros mundos de cada sequência têm 24 ordens de bioma diferentes', streams.every((s) => new Set(s.ex.slice(0, 24).map((e) => e.key)).size === 24));
const w24 = streams.map((s) => maxPair(s.ex.slice(0, 24), (a, b) => runsSimilarity(a.runs, b.runs)).m), w60 = streams.map((s) => maxPair(s.ex, (a, b) => runsSimilarity(a.runs, b.runs)).m);
check('entre os 24 primeiros, quaisquer dois mapas de biomas diferem em mais de 35% das colunas', w24.every((m) => m < .65), 'pior parecença ' + w24.map((m) => m.toFixed(2)).join(' / '));
check('entre 60 mundos, o pior par ainda difere em mais de 15% das colunas', w60.every((m) => m < .85), 'pior parecença ' + w60.map((m) => m.toFixed(2)).join(' / '));
// semente excluída nunca volta: o gerador "sorteia" duas vezes uma semente já usada antes de dar uma nova
{
  const used = new Set([111, 222]), seq = [111, 222, 111, 333, 444, 555, 666, 777]; let i = 0;
  const stub = () => (i < seq.length ? seq[i++] : (i++ * 7919 + 12345));
  const r = chooseSeed(stub, used, []);
  check('semente já usada (mesmo de mundo excluído) é recusada no sorteio', ![111, 222].includes(r.seed) && r.seed > 0, 'escolhida ' + r.seed);
}
{
  const r = chooseSeed(() => 0, new Set(), []).seed; // rand sempre 0: cai no ramo de segurança sem travar
}

// ---------------- 3: mundos completos ----------------
console.log('\n== 3. 14 mundos completos sorteados pela política ==');
const pr32 = xorshift(424242), usedW = new Set(), exW = [], picked = [];
for (let n = 0; n < 14; n++) { const r = chooseSeed(pr32, usedW, exW); usedW.add(r.seed); picked.push(r.seed); exW.push({ key: r.key, runs: layoutRuns(makeLayout(r.seed)) }); }
const feat = ['obsidian', 'hellstone', 'meteorite', 'platinum', 'gold', 'silver', 'amber', 'frostcrystal', 'ruby', 'lifecrystal', 'chest', 'mushroom', 'thornbush', 'cactus', 'trunk', 'cloud'];
const worlds = [];
for (const seed of picked) {
  const t0 = Date.now(), wd = new World(WW, WH, seed); for (const _ of genWorld(wd, seed)) { }
  const cnt = {}; for (let i = 0; i < wd.t.length; i++) cnt[wd.t[i]] = (cnt[wd.t[i]] || 0) + 1;
  const L = wd.layout, runs = wd.biomeRuns().filter((r) => r.b !== 0), sx = L.spawnX, widths = runs.map((r) => r.x1 - r.x0 + 1);
  console.log(`seed ${String(seed).padStart(10)} ${L.key.padEnd(26)} oceanos ${String(L.land0).padStart(3)}/${String(WW - L.land1).padStart(3)} spawn x=${String(sx).padStart(4)} larguras ${widths.join('/')} (${Date.now() - t0}ms)`);
  const above = [1, 2, 3].every((k) => !SOLID[wd.t[sx + (wd.surf[sx] - k) * WW]]);
  const miss = feat.filter((k) => !(cnt[T[k]] > 0));
  const ok = biomeKeyOf(wd.bio) === L.key && wd.layoutKey() === L.key && widths.length === 4 && widths.every((w) => w >= 125)
    && wd.bio[sx] === 2 && wd.t[sx + wd.surf[sx] * WW] === T.grass && above && wd.surf[sx] >= 105 && wd.surf[sx] <= 128
    && wd.spawn.x === sx * TS + 2 && miss.length === 0 && cnt[T.lifecrystal] === 18 && wd.chests.size >= 15;
  if (!ok) check('mundo ' + seed, false, JSON.stringify({ key: biomeKeyOf(wd.bio), want: L.key, widths, spawnBio: wd.bio[sx], surf: wd.surf[sx], tile: wd.t[sx + wd.surf[sx] * WW], above, miss, life: cnt[T.lifecrystal], chests: wd.chests.size }));
  worlds.push({ seed, wd, L, ok, hash: sha(wd.surf) + sha(wd.t) });
}
check('cada mundo: biomas na ordem sorteada, largos, spawn na grama da floresta, itens-chave presentes', worlds.every((w) => w.ok));
check('os 14 mundos têm 14 ordens de bioma diferentes', new Set(worlds.map((w) => w.L.key)).size === 14);
check('os 14 mundos são todos diferentes (hash do terreno)', new Set(worlds.map((w) => w.hash)).size === worlds.length);
const bio = maxPair(worlds, (a, b) => { let s = 0; for (let c = 0; c < WW; c++) if (a.wd.bio[c] === b.wd.bio[c]) s++; return s / WW; });
check('mapa de biomas de qualquer par coincide em menos de 65% das colunas', bio.m < .65, `pior par ${bio.pair}: ${(bio.m * 100).toFixed(1)}%`);
const col = maxPair(worlds, (a, b) => { let s = 0; for (let c = 0; c < WW; c++) if (a.wd.bio[c] === b.wd.bio[c] && Math.abs(a.wd.surf[c] - b.wd.surf[c]) <= 3) s++; return s / WW; });
check('colunas com o MESMO bioma e a MESMA altura: menos de 40% em qualquer par', col.m < .4, `pior par ${col.pair}: ${(col.m * 100).toFixed(1)}%`);
const a1 = new World(WW, WH, picked[0]); for (const _ of genWorld(a1, picked[0])) { }
check('mesma semente = mesmo mundo, bloco a bloco', sha(a1.surf) + sha(a1.t) === worlds[0].hash);

console.log(`\nverificações concluídas | falhas: ${fails}`);
process.exitCode = fails ? 1 : 0;
