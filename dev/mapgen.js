// Gera o mundo em Node (sem DOM) e salva um PNG do mapa para inspeção.
const fs = require('fs'), vm = require('vm'), zlib = require('zlib');
const files = process.argv[2] ? process.argv[2].split(',') : ['00_util','01_data','02_world','03_worldgen','04_light'];
let code = files.map(f => fs.readFileSync(__dirname + '/../src/' + f + '.js', 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { World, genWorld, TD, T, WW, WH, SOLID, spawnHardmodeOres };`;
const ctx = { console, Math, Date, Uint8Array, Int16Array, Float32Array, Set, Map, Array, Object, String, Number, JSON };
ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
const { World, genWorld, TD, T, WW, WH } = ctx.__api;
const seed = +(process.argv[3] || 12345);
const wd = new World(WW, WH, seed);
const t0 = Date.now(); let steps = 0;
for (const [p, msg] of genWorld(wd, seed)) { steps++; }
console.log('worldgen ms:', Date.now() - t0, 'yields:', steps);
// estatísticas
const cnt = {}; for (let i = 0; i < wd.t.length; i++) cnt[wd.t[i]] = (cnt[wd.t[i]] || 0) + 1;
const names = Object.entries(cnt).map(([id, n]) => [TD[id].k, n]).sort((a, b) => b[1] - a[1]);
console.log(names.map(([k, n]) => k + ':' + n).join('  '));
let water = 0, lava = 0; for (let i = 0; i < wd.lq.length; i++) if (wd.lq[i]) (wd.lt[i] === 1 ? water++ : lava++);
console.log('water', water, 'lava', lava, 'chests', wd.chests.size, 'liqAct', wd.liqAct.size);
let air = 0, under = 0; for (let x = 0; x < WW; x++) for (let y = wd.surf[x] + 10; y < 400; y++) { under++; if (wd.t[x + y * WW] === 0) air++; }
console.log('cave fraction (surf+10..400):', (air / under).toFixed(3));
// PNG
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const W = WW, H = WH, S = +(process.argv[4] || 1);
const raw = Buffer.alloc((W * S * 4 + 1) * H * S);
const skyC = [120, 180, 240];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = x + y * W, td = TD[wd.t[i]]; let c;
  if (wd.t[i] === 0 || (!td.s && !td.x.match(/ore|block/) && wd.t[i] < 200)) {
    // ar
    if (wd.lq[i]) c = wd.lt[i] === 1 ? [40, 90, 220] : [255, 110, 20];
    else if (wd.t[i] !== 0) c = hex(td.c[2] || td.c[0]);
    else if (wd.wl[i]) c = [45, 40, 48];
    else c = skyC;
  } else {
    c = td.x === 'ore' ? hex(td.ore) : hex(td.c[0]);
    if (wd.lq[i]) c = wd.lt[i] === 1 ? [40, 90, 220] : [255, 110, 20];
  }
  for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
    const o = ((y * S + sy) * (W * S * 4 + 1)) + 1 + (x * S + sx) * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255;
  }
}
for (let y = 0; y < H * S; y++) raw[y * (W * S * 4 + 1)] = 0;
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W * S, 0); ihdr.writeUInt32BE(H * S, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync(__dirname + '/map.png', png); console.log('map.png written', png.length);
