/* ============================================================
   03_worldgen: geração procedural (assíncrona, em fatias/chunks)
   Cada "yield" devolve [progresso 0..1, mensagem] para o loader.
   ============================================================ */
const SPAWN_X = 575;
const BIO_LO = [-9999, 125, 370, 790, 1020, 1280], BIO_HI = [125, 370, 790, 1020, 1280, 9999];
const BIO_OF_RANGE = [0, 1, 2, 3, 4, 0]; // oceano, deserto, floresta, selva, neve, oceano
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function lootForDepth(y, rr) {
  const out = [];
  const tierD = y < 190 ? 0 : y < 270 ? 1 : y < 340 ? 2 : 3;
  out.push(['coin', rri(rr, 4 + tierD * 4, 10 + tierD * 9)]);
  out.push(['torch', rri(rr, 6, 16)]);
  if (rr() < .65) out.push(['potion1', rri(rr, 1, 3)]);
  const bars = [['copper_bar', 'iron_bar'], ['iron_bar', 'silver_bar'], ['silver_bar', 'gold_bar'], ['gold_bar', 'platinum_bar']][tierD];
  out.push([bars[rri(rr, 0, 1)], rri(rr, 4, 9)]);
  if (rr() < .5) out.push([['ruby', 'emerald', 'topaz', 'sapphire', 'amethyst'][rri(rr, 0, 4)], rri(rr, 2, 6)]);
  if (rr() < .35) out.push([['acc_glove', 'acc_boots', 'acc_ring', 'acc_fang', 'acc_shield'][rri(rr, 0, 4)], 1]);
  if (rr() < .30 && typeof SWORDS !== 'undefined') {
    const tier = tierD <= 1 ? 1 : 2; const pool = SWORDS.filter(s => s.tierLevel === tier);
    if (pool.length) out.push(['s' + String(pool[rri(rr, 0, pool.length - 1)].num).padStart(3, '0'), 1]);
  }
  if (rr() < .4) out.push(['life_crystal', 1]);
  return out;
}
const rri = (rr, a, b) => Math.floor(a + rr() * (b - a + 1));

function* genWorld(wd, seedNum) {
  const W = wd.w, H = wd.h, t = wd.t, wl = wd.wl;
  const R = mulberry32(seedNum), rr = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(a + R() * (b - a + 1));
  const pH = new Perlin(seedNum ^ 0x1111), pA = new Perlin(seedNum ^ 0x2222), pB = new Perlin(seedNum ^ 0x3333),
    pC = new Perlin(seedNum ^ 0x4444), pD = new Perlin(seedNum ^ 0x5555), pE = new Perlin(seedNum ^ 0x6666);
  const surf = wd.surf, bio = wd.bio;
  const I = (x, y) => x + y * W;
  const inb = (x, y) => x > 1 && x < W - 2 && y > 1 && y < H - 3;

  // ---------- 1. biomas e relevo ----------
  yield [0.01, 'Moldando biomas e relevo...'];
  const lakeWater = new Int16Array(W).fill(-1);
  const jit = x => pE.n2(x * 0.02, 3.1) * 14;
  const rawH = [
    u => lerp(124, 172, sstep(125, 45, u)),
    u => 121 + pH.n2(u * .016, 5.2) * 5 + pH.n2(u * .05, 9.1) * 2,
    u => 117 + pH.fbm(u * .0075, .3, 3) * 36 + pH.n2(u * .045, 1.1) * 3.5,
    u => 116 + pH.fbm(u * .01, 8.8, 3) * 38 + pH.n2(u * .06, 2.2) * 4,
    u => 112 + pH.fbm(u * .008, 4.4, 3) * 42 + pH.n2(u * .05, 6.6) * 3,
    u => lerp(124, 172, sstep(1280, 1360, u)),
  ];
  for (let x = 0; x < W; x++) {
    const u = x + jit(x);
    let ws = 0, hs = 0;
    for (let i = 0; i < 6; i++) {
      const lo = BIO_LO[i], hi = BIO_HI[i];
      const w1 = (i === 0 ? 1 : sstep(lo - 28, lo + 28, u)) * (i === 5 ? 1 : 1 - sstep(hi - 28, hi + 28, u));
      if (w1 > 0.001) { ws += w1; hs += w1 * rawH[i](u); }
    }
    let h = hs / ws;
    const f = 1 - sstep(0, 40, Math.abs(x - SPAWN_X));
    h = lerp(h, 117 + pH.n2(x * .1, 0) * 1.2, f);
    surf[x] = clamp(Math.round(h), 78, 176);
    let b = 0; for (let i = 0; i < 6; i++) if (u >= BIO_LO[i] && u < BIO_HI[i]) b = BIO_OF_RANGE[i];
    bio[x] = b;
  }
  // lagos
  const lakes = [];
  for (let n = 0, tries = 0; n < 16 && tries < 200; tries++) {
    const cx = ri(150, W - 150); const b = bio[cx];
    if (b === 0 || Math.abs(cx - SPAWN_X) < 45 || lakes.some(l => Math.abs(l.cx - cx) < 60)) continue;
    const r = ri(12, 26), D = ri(5, 10);
    const yw = Math.max(surf[cx - r - 2], surf[cx + r + 2]) + 1;
    if (yw > SEA + 14) continue;
    lakes.push({ cx, r, D, yw }); n++;
    for (let x = cx - r; x <= cx + r; x++) {
      const k = (x - cx) / r, bowl = Math.pow(1 - k * k, .8), ns = Math.round(yw + D * bowl);
      if (ns > surf[x] || (Math.abs(k) < .92)) surf[x] = Math.max(ns, yw);
      lakeWater[x] = yw;
    }
  }

  // ---------- 2. preenchimento do terreno ----------
  const bioU = (x, y) => {
    const u = x + pE.n2(x * .02, y * .015 + 3.1) * 16; let b = 0;
    for (let i = 0; i < 6; i++) if (u >= BIO_LO[i] && u < BIO_HI[i]) b = BIO_OF_RANGE[i];
    return b;
  };
  for (let x = 0; x < W; x++) {
    const s = surf[x], dd = 8 + pD.n2(x * .07, 3.3) * 4;
    for (let y = s; y < H; y++) {
      const d = y - s; let tl, wall = 0;
      const b = d > 14 ? bioU(x, y) : bio[x];
      if (b === 2) {
        tl = d === 0 ? T.grass : d < dd ? T.dirt : T.stone;
        if (d >= dd && d < 80 && pD.fbm(x * .05, y * .05, 2) > .3) tl = T.dirt;
        if (d < dd && d > 3 && pD.fbm(x * .09 + 50, y * .09, 2) > .42) tl = T.stone;
        wall = d >= 2 ? (d < dd + 12 || tl === T.dirt ? WALL.dirt : WALL.stone) : 0;
      } else if (b === 1) {
        const sd = 12 + pD.n2(x * .05, 8.1) * 6;
        tl = d < sd ? T.sand : d < 86 + pD.n2(x * .03, 1) * 12 ? T.sandstone : T.stone;
        if (d >= sd && d < 86 && pD.fbm(x * .06 + 9, y * .06, 2) > .4) tl = T.sand;
        wall = d >= 2 ? (tl === T.stone ? WALL.stone : WALL.sandstone) : 0;
      } else if (b === 4) {
        tl = d < 4 + pD.n2(x * .1, 0) * 2 ? T.snow : d < 60 ? (pD.fbm(x * .06, y * .06 + 30, 2) > .02 ? T.ice : T.snow) : T.stone;
        if (tl === T.stone && d < 130 && pD.fbm(x * .05, y * .05 + 70, 2) > .3) tl = T.ice;
        wall = d >= 2 ? (tl === T.stone ? WALL.stone : WALL.ice) : 0;
      } else if (b === 3) {
        tl = d === 0 ? T.jgrass : d < 40 + pD.n2(x * .04, 2) * 8 ? T.mud : T.stone;
        if (tl === T.stone && d < 110 && pD.fbm(x * .06, y * .06 + 90, 2) > .2) tl = T.mud;
        wall = d >= 2 ? (tl === T.stone ? WALL.stone : WALL.mud) : 0;
      } else {
        tl = d < 10 + pD.n2(x * .06, 4) * 3 ? T.sand : T.stone;
        wall = d >= 2 ? WALL.stone : 0;
      }
      if (y >= Y_HELL - 6 && wall) wall = WALL.hell;
      if (y >= H - 3) tl = T.bedrock;
      t[I(x, y)] = tl; wl[I(x, y)] = wall;
    }
    if (x % 70 === 0) yield [0.02 + 0.2 * x / W, 'Preenchendo o terreno...'];
  }

  // ---------- 3. cavernas ----------
  const deepWater = (x, y) => { for (const l of lakes) if (x >= l.cx - l.r - 2 && x <= l.cx + l.r + 2 && y < l.yw + l.D + 7) return true; return false; };
  for (let x = 3; x < W - 3; x++) {
    const s = surf[x], b0 = bio[x], top = s + (b0 === 0 ? 16 : 8);
    const inLake = lakeWater[x] >= 0;
    for (let y = top; y < Y_HELL - 4; y++) {
      if (inLake && deepWater(x, y)) continue;
      const df = clamp((y - s) / (Y_HELL - s), 0, 1);
      const a = pA.n2(x * .014, y * .032), b = pB.n2(x * .014 + 31.7, y * .032 + 11.3);
      const w1 = .026 + .018 * df;
      let carve = Math.abs(a) < w1 || Math.abs(b) < w1 * .85;
      if (!carve) { const c = pC.fbm(x * .0065, y * .0105, 3); carve = c > .38 - .08 * df; }
      if (carve) t[I(x, y)] = 0;
    }
    if (x % 70 === 0) yield [0.22 + 0.2 * x / W, 'Escavando cavernas...'];
  }
  // poços de entrada a partir da superfície
  for (let n = 0; n < 34; n++) {
    let x = ri(170, W - 170), y = surf[x] + 2; if (Math.abs(x - SPAWN_X) < 18) { n--; continue; }
    const len = ri(24, 70); let dx = rr(-.5, .5);
    for (let k = 0; k < len; k++) { carveCircle(wd, x, y, rr(1.4, 2.6)); x += dx + rr(-.5, .5); y += 1; if (R() < .1) dx = rr(-.7, .7); if (y > Y_HELL - 10) break; }
  }
  yield [0.43, 'Abrindo poços e túneis...'];

  // ---------- 4. Inferno ----------
  for (let x = 1; x < W - 1; x++) {
    const fl = Math.round(463 + pE.fbm(x * .02, 7.7, 3) * 14), ce = Math.round(419 + pE.fbm(x * .015, 3.3, 3) * 9);
    for (let y = Y_HELL; y < H; y++) {
      let tl;
      if (y >= H - 3) tl = T.bedrock;
      else if (y >= fl) tl = T.ash;
      else if (y <= ce) tl = (pD.n2(x * .1, y * .1) > .15) ? T.stone : T.ash;
      else tl = 0;
      t[I(x, y)] = tl; wl[I(x, y)] = WALL.hell;
    }
    if (R() < .12) { const l = ri(3, 14); for (let k = 0; k < l; k++) if (t[I(x, ce + 1 + k)] === 0) t[I(x, ce + 1 + k)] = T.ash; }
    if (R() < .10) { const l = ri(3, 12); for (let k = 0; k < l; k++) if (t[I(x, fl - 1 - k)] === 0) t[I(x, fl - 1 - k)] = T.ash; }
  }
  const LAVA_Y = 452;
  for (let x = 1; x < W - 1; x++) for (let y = LAVA_Y; y < H - 3; y++) if (t[I(x, y)] === 0) { wd.lq[I(x, y)] = 255; wd.lt[I(x, y)] = LIQ_LAVA; }
  yield [0.48, 'Forjando o Inferno...'];

  // ---------- 5. bioma de cogumelos ----------
  {
    const cx = ri(430, 700), cy = ri(255, 285), rx = 38, ry = 17;
    for (let y = cy - ry - 3; y <= cy + ry + 3; y++) for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
      const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (!inb(x, y)) continue;
      if (e < 1.1) { const i = I(x, y); if (t[i] === T.stone || t[i] === T.dirt || t[i] === T.sand) t[i] = T.mud; wl[i] = WALL.mud; }
      if (e < .55 + pD.n2(x * .2, y * .2) * .1) t[I(x, y)] = 0;
    }
    for (let x = cx - rx; x <= cx + rx; x++) for (let y = cy - ry; y <= cy + ry; y++) {
      if (inb(x, y) && t[I(x, y)] === 0 && t[I(x, y + 1)] === T.mud && R() < .55) t[I(x, y)] = T.mushroom;
    }
    wd.mushCenter = { x: cx, y: cy };
  }

  // ---------- 6. minérios ----------
  const vein = (tile, x, y, size, hosts) => {
    let cx = x, cy = y;
    for (let i = 0; i < size; i++) {
      for (let k = 0; k < 2; k++) {
        const px = Math.round(cx + rr(-1, 1)), py = Math.round(cy + rr(-1, 1));
        if (inb(px, py) && hosts.includes(t[I(px, py)])) t[I(px, py)] = tile;
      }
      cx += ri(-1, 1); cy += ri(-1, 1);
    }
  };
  const ores = (tile, count, y0f, y1, smin, smax, hosts, bioF) => {
    for (let n = 0; n < count; n++) {
      const x = ri(4, W - 5); if (bioF && !bioF.includes(bio[x])) continue;
      const y0 = typeof y0f === 'function' ? y0f(x) : y0f; const y = ri(y0, y1);
      vein(tile, x, y, ri(smin, smax), hosts);
    }
  };
  const S = x => surf[x], ST = [T.stone], ST_D = [T.stone, T.dirt];
  ores(T.copper, 520, x => S(x) + 4, 300, 8, 16, ST_D);
  ores(T.iron, 430, x => S(x) + 14, 330, 7, 14, ST_D);
  ores(T.coal, 210, x => S(x) + 10, 360, 9, 18, ST_D);
  ores(T.quartz, 120, x => S(x) + 40, 380, 5, 10, ST);
  ores(T.silver, 300, x => S(x) + 40, 380, 7, 13, ST);
  ores(T.gold, 240, 200, 395, 6, 12, ST);
  ores(T.bronzite, 140, 190, 395, 5, 9, ST);
  ores(T.platinum, 190, 260, 400, 6, 11, ST);
  ores(T.amber, 120, x => S(x) + 12, 280, 5, 11, [T.sandstone, T.sand], [1]);
  ores(T.frostcrystal, 140, x => S(x) + 10, 340, 4, 9, [T.ice, T.snow, T.stone], [4]);
  [[T.ruby, 70], [T.emerald, 70], [T.topaz, 70], [T.sapphire, 70], [T.amethyst, 70]].forEach(([g, c], i) => ores(g, c, x => S(x) + (i === 4 ? 25 : 35), 390, 3, 6, ST));
  ores(T.hellstone, 700, Y_HELL + 20, H - 5, 8, 16, [T.ash]);
  ores(T.obsidian, 220, Y_HELL + 2, Y_HELL + 20, 7, 14, [T.ash, T.stone]); ores(T.obsidian, 220, 458, 474, 7, 14, [T.ash]);
  yield [0.6, 'Semeando minérios...'];

  // ---------- 7. água, lagos e lava ----------
  const isAirT = (x, y) => t[I(x, y)] === 0;
  for (let x = 1; x < W - 1; x++) {
    if ((x < 150 || x > 1255)) for (let y = SEA; y < surf[x]; y++) { wd.lq[I(x, y)] = 255; wd.lt[I(x, y)] = LIQ_WATER; }
    if (lakeWater[x] >= 0) for (let y = lakeWater[x]; y < surf[x]; y++) if (t[I(x, y)] === 0) { wd.lq[I(x, y)] = 255; wd.lt[I(x, y)] = LIQ_WATER; }
  }
  const fillPool = (sx, sy, maxRows, type) => {
    let cy = sy, rows = 0;
    while (rows < maxRows) {
      let l = sx; while (inb(l - 1, cy) && isAirT(l - 1, cy) && (SOLID[t[I(l - 1, cy + 1)]] || wd.lq[I(l - 1, cy + 1)] === 255)) l--;
      let r = sx; while (inb(r + 1, cy) && isAirT(r + 1, cy) && (SOLID[t[I(r + 1, cy + 1)]] || wd.lq[I(r + 1, cy + 1)] === 255)) r++;
      if (!(SOLID[t[I(l - 1, cy)]] && SOLID[t[I(r + 1, cy)]])) break;
      if (r - l > 60) break;
      for (let x = l; x <= r; x++) { wd.lq[I(x, cy)] = 255; wd.lt[I(x, cy)] = type; }
      rows++; cy--; if (!isAirT(sx, cy)) break;
    }
    return rows;
  };
  const findFloor = (x, y0, y1) => { for (let y = y0; y < y1; y++) if (isAirT(x, y) && SOLID[t[I(x, y + 1)]] && !wd.lq[I(x, y)]) return y; return -1; };
  for (let n = 0; n < 110; n++) { const x = ri(10, W - 10), y = findFloor(x, ri(surf[x] + 25, 330), 360); if (y > 0) fillPool(x, y, ri(2, 7), LIQ_WATER); }
  for (let n = 0; n < 60; n++) { const x = ri(10, W - 10), y = findFloor(x, ri(335, 395), 402); if (y > 0) fillPool(x, y, ri(2, 6), LIQ_LAVA); }
  yield [0.68, 'Enchendo lagos, oceanos e lava...'];

  // ---------- 8. casas abandonadas e cristais de vida ----------
  const house = (x, fy, w, h, loot) => {
    for (let yy = fy - h - 1; yy <= fy; yy++) for (let xx = x - 1; xx <= x + w; xx++) {
      if (!inb(xx, yy)) continue;
      const border = xx === x - 1 || xx === x + w || yy === fy || yy === fy - h - 1;
      t[I(xx, yy)] = border ? T.plank : 0; wl[I(xx, yy)] = WALL.plank; wd.lq[I(xx, yy)] = 0; wd.lt[I(xx, yy)] = 0;
    }
    const side = R() < .5 ? x - 1 : x + w;
    t[I(side, fy - 1)] = 0; t[I(side, fy - 2)] = 0;
    t[I(x + 1, fy - h)] = T.torch; t[I(x + w - 2, fy - h)] = T.torch;
    t[I(x + 2, fy - 1)] = T.table; t[I(x + 4, fy - 1)] = T.chair;
    if (loot) { const cxp = x + w - 3; t[I(cxp, fy - 1)] = T.chest; wd.chests.set(I(cxp, fy - 1), loot); }
  };
  for (let n = 0; n < 30; n++) {
    const x = ri(30, W - 45), fy = ri(surf[x] + 50, 385), w = ri(8, 13), h = ri(5, 6);
    if (bio[x] === 0 || lakeWater[x] >= 0) continue;
    const slots = new Array(20).fill(null); const L = lootForDepth(fy, R);
    L.forEach((it, i) => slots[i] = { id: it[0], n: it[1] });
    house(x, fy, w, h, slots);
  }
  for (let n = 0, placed = 0; n < 400 && placed < 18; n++) {
    const x = ri(8, W - 8), y = findFloor(x, ri(surf[x] + 50, 390), 400);
    if (y > 0 && !wd.lq[I(x, y)]) { t[I(x, y)] = T.lifecrystal; placed++; }
  }
  yield [0.76, 'Construindo ruínas e tesouros...'];

  // ---------- 9. ilhas do céu ----------
  const NI = 11;
  for (let n = 0; n < NI; n++) {
    const cx = Math.round(90 + n * (W - 180) / (NI - 1) + ri(-30, 30)), cy = ri(30, 68), rx = ri(13, 25), ry = ri(5, 9);
    const hasHouse = rx > 17, meteor = R() < .62;
    for (let dx = -rx; dx <= rx; dx++) {
      const k = dx / rx, depth = Math.round(ry * Math.sqrt(Math.max(0, 1 - k * k)));
      for (let dy = 0; dy <= depth; dy++) {
        const x = cx + dx, y = cy + dy; if (!inb(x, y)) continue;
        t[I(x, y)] = dy === 0 ? T.grass : dy >= depth - 1 && depth > 3 ? T.cloud : T.dirt;
        if (dy > 0) wl[I(x, y)] = WALL.dirt;
      }
      if (meteor && Math.abs(dx) < 4) for (let dy = 2; dy < depth - 1; dy++) if (R() < .8) t[I(cx + dx, cy + dy)] = T.meteorite;
    }
    if (hasHouse) {
      const slots = new Array(20).fill(null);
      [['feather', ri(10, 20)], ['coin', ri(10, 25)], ['potion1', 2], ['acc_boots', 1], ['torch', 12], ['life_crystal', 1], ['cloud', 30]].forEach((it, i) => slots[i] = { id: it[0], n: it[1] });
      house(cx - 4, cy - 1, 9, 5, slots);
    }
    for (let dx = -rx + 1; dx < rx; dx++) { const x = cx + dx; if (t[I(x, cy - 1)] === 0 && t[I(x, cy)] === T.grass && R() < .5) t[I(x, cy - 1)] = R() < .2 ? T.flower : T.tallgrass; }
  }
  // crateras de meteorito na superfície
  for (let n = 0, tries = 0; n < 6 && tries < 80; tries++) {
    const x = ri(170, W - 170); if (bio[x] === 0 || Math.abs(x - SPAWN_X) < 35 || lakeWater[x] >= 0 || surf[x] > SEA - 2) continue; n++;
    const y = surf[x]; carveCircle(wd, x, y + 1, 4.6);
    for (let yy = y + 2; yy <= y + 8; yy++) for (let xx = x - 4; xx <= x + 4; xx++) if ((xx - x) ** 2 + (yy - y - 5) ** 2 <= 9.5 && SOLID[t[I(xx, yy)]] && R() < .88) t[I(xx, yy)] = T.meteorite;
    wd.craters = (wd.craters || []).concat([[x, y]]);
  }
  yield [0.82, 'Erguendo ilhas flutuantes...'];

  // ---------- 10. árvores, cactos e decoração ----------
  let nextTree = 6;
  const setIfAir = (x, y, id) => { if (inb(x, y) && t[I(x, y)] === 0) t[I(x, y)] = id; };
  for (let x = 4; x < W - 4; x++) {
    const s = surf[x], top = t[I(x, s)], b = bio[x];
    if (t[I(x, s - 1)] !== 0 || wd.lq[I(x, s - 1)]) continue;
    // decoração rasteira
    if (top === T.grass && R() < .5) t[I(x, s - 1)] = R() < .14 ? T.flower : T.tallgrass;
    if (top === T.jgrass && R() < .09) { t[I(x, s - 1)] = T.thornbush; }
    else if (top === T.jgrass && R() < .3) t[I(x, s - 1)] = T.tallgrass;
    if (x < nextTree || Math.abs(x - SPAWN_X) < 4) continue;
    if (top === T.grass && b === 2) {
      nextTree = x + ri(3, 8);
      if (R() < .85) {
        const h = ri(6, 13); for (let k = 1; k <= h; k++) t[I(x, s - k)] = T.trunk;
        const ty = s - h - 1, r = rr(2.4, 3.4);
        for (let yy = -Math.ceil(r); yy <= Math.ceil(r); yy++) for (let xx = -Math.ceil(r + 1); xx <= Math.ceil(r + 1); xx++)
          if ((xx / (r + .6)) ** 2 + (yy / r) ** 2 <= 1 && R() < .93) setIfAir(x + xx, ty + yy, T.leaf);
        t[I(x, ty + 1)] = T.trunk;
      }
    } else if (top === T.snow && b === 4 && R() < .8) {
      nextTree = x + ri(3, 7); const h = ri(8, 16);
      for (let k = 1; k <= h; k++) t[I(x, s - k)] = T.trunk;
      for (let k = 0; k < h - 2; k++) { const wdt = Math.min(1 + (k >> 1), 4); for (let xx = -wdt; xx <= wdt; xx++) if (xx !== 0 || k === 0) setIfAir(x + xx, s - h - 1 + k, T.leafsnow); }
      setIfAir(x, s - h - 2, T.leafsnow);
    } else if (top === T.jgrass && b === 3 && R() < .7) {
      nextTree = x + ri(3, 7); const h = ri(10, 22);
      for (let k = 1; k <= h; k++) t[I(x, s - k)] = T.trunk;
      const ty = s - h - 1, r = rr(3.6, 5);
      for (let yy = -Math.ceil(r * .7); yy <= Math.ceil(r * .7); yy++) for (let xx = -Math.ceil(r + 1); xx <= Math.ceil(r + 1); xx++)
        if ((xx / (r + .8)) ** 2 + (yy / (r * .7)) ** 2 <= 1 && R() < .95) setIfAir(x + xx, ty + yy, T.leafjungle);
      t[I(x, ty + 1)] = T.trunk;
    } else if (top === T.sand) {
      if (b === 1 && R() < .22) { nextTree = x + ri(5, 12); const h = ri(2, 5); for (let k = 1; k <= h; k++) t[I(x, s - k)] = T.cactus; }
      else if ((b === 0 || x < 170 || x > 1230) && R() < .3 && wd.lq[I(x, s - 1)] === 0 && s <= SEA) {
        nextTree = x + ri(4, 9); const h = ri(6, 11); for (let k = 1; k <= h; k++) t[I(x, s - k)] = T.trunk;
        const ty = s - h - 1; for (let xx = -3; xx <= 3; xx++) { if (xx) setIfAir(x + xx, ty + (Math.abs(xx) > 1 ? 1 : 0), T.leafpalm); } setIfAir(x, ty, T.leafpalm); setIfAir(x, ty - 1, T.leafpalm);
        setIfAir(x - 2, ty - 1, T.leafpalm); setIfAir(x + 2, ty - 1, T.leafpalm);
      }
    }
    if (x % 80 === 0) yield [0.82 + 0.1 * x / W, 'Plantando florestas...'];
  }
  // espinheiros e cogumelos em cavernas
  for (let n = 0; n < 500; n++) {
    const x = ri(5, W - 5), y = findFloor(x, ri(surf[x] + 20, 395), 400); if (y < 0) continue;
    const below = t[I(x, y + 1)];
    if ((below === T.mud || below === T.jgrass) && bio[x] === 3 && R() < .5) t[I(x, y)] = T.thornbush;
    else if (below === T.mud && R() < .6) t[I(x, y)] = T.mushroom;
    else if (y > 300 && below === T.stone && R() < .08) t[I(x, y)] = T.mushroom;
  }

  // ---------- 11. finalização ----------
  for (let x = 0; x < W; x++) wd._recalcSky(x, 0);
  for (let x = 0; x < W; x++) for (let y = 0; y < H - 1; y++) { // rede de segurança: líquido sem apoio acorda
    const i = I(x, y); if (wd.lq[i] && !SOLID[t[i + W]] && wd.lq[i + W] < 255) wd.liqAct.add(i);
  }
  wd.spawn.x = SPAWN_X * TS + 2; wd.spawn.y = (surf[SPAWN_X] - 3) * TS;
  yield [1, 'Mundo pronto!'];
}

// minérios do Hardmode (T3/T4) — espalhados quando o Guardião do Abismo cai
function spawnHardmodeOres(wd) {
  const R = Math.random, ri = (a, b) => Math.floor(a + R() * (b - a + 1)), W = wd.w;
  const place = (tile, count, y0, y1, smin, smax) => {
    for (let n = 0; n < count; n++) {
      const x = ri(6, W - 7), y = ri(Math.max(y0, wd.surf[x] + 30), y1); let cx = x, cy = y; const size = ri(smin, smax);
      for (let i = 0; i < size; i++) {
        for (let k = 0; k < 2; k++) {
          const px = Math.round(cx + (R() * 2 - 1)), py = Math.round(cy + (R() * 2 - 1));
          if (px > 2 && px < W - 3 && py > 2 && py < Y_HELL - 4 && wd.t[px + py * W] === T.stone) wd.set(px, py, tile, true);
        }
        cx += ri(-1, 1); cy += ri(-1, 1);
      }
    }
  };
  place(T.cobalt, 170, 190, 400, 7, 13); place(T.palladium, 170, 190, 400, 7, 13);
  place(T.mithril, 140, 260, 402, 6, 11); place(T.orichalcum, 140, 260, 402, 6, 11);
  place(T.titanium, 120, 320, 402, 6, 10); place(T.adamantite, 120, 320, 402, 6, 10);
  wd.hardmode = true;
}
