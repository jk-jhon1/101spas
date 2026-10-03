const fs = require('fs'), vm = require('vm');
const files = ['00_util','01_data','02_world','03_worldgen','04_light'];
let code = files.map(f => fs.readFileSync(__dirname + '/../src/' + f + '.js', 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { World, genWorld, TD, T, WW, WH, SOLID };`;
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Set, Map, Array, Object, String, Number, JSON };
ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const { World, genWorld, TD, T, WW, WH } = ctx.__api;
const keys = ['obsidian','hellstone','meteorite','platinum','gold','silver','amber','frostcrystal','ruby','lifecrystal','chest','mushroom','thornbush','cactus','trunk','cloud'];
for (const seed of [1, 2, 3, 99, 2024, 31337, 777, 12345]) {
  const t0 = Date.now(), wd = new World(WW, WH, seed); for (const _ of genWorld(wd, seed)) { }
  const cnt = {}; for (let i = 0; i < wd.t.length; i++) cnt[wd.t[i]] = (cnt[wd.t[i]] || 0) + 1;
  let water = 0, lava = 0; for (let i = 0; i < wd.lq.length; i++) if (wd.lq[i]) (wd.lt[i] === 1 ? water++ : lava++);
  console.log('seed', String(seed).padEnd(6), (Date.now() - t0) + 'ms', keys.map(k => k.slice(0, 5) + ':' + (cnt[T[k]] || 0)).join(' '), 'água', water, 'lava', lava, 'baús', wd.chests.size);
}
