/* ============================================================
   02_world: matriz de blocos, chunks, fluidos, gravidade
   ============================================================ */
const WW = 1400, WH = 480, CHUNK = 32, SEA = 126;
const Y_SKY = 92, Y_DEEP = 300, Y_HELL = 405;
const SKY_SCAN_Y = 78;   // exposição ao céu é medida só abaixo da faixa das ilhas flutuantes

const SOLID = new Uint8Array(256), FALLS = new Uint8Array(256), OPAC = new Float32Array(256);
for (const d of TD) { SOLID[d.id] = d.s ? 1 : 0; FALLS[d.id] = d.fall ? 1 : 0; OPAC[d.id] = d.o; }
const LIQ_WATER = 1, LIQ_LAVA = 2;

class World {
  constructor(w = WW, h = WH, seed = 1) {
    this.w = w; this.h = h; this.seed = seed;
    const n = w * h;
    this.t = new Uint8Array(n);        // tiles (frente)
    this.wl = new Uint8Array(n);       // paredes (fundo)
    this.lq = new Uint8Array(n);       // quantidade de líquido (0..255)
    this.lt = new Uint8Array(n);       // tipo de líquido
    this.skyTop = new Int16Array(w);   // primeiro y com bloco/parede (exposição ao céu)
    this.surf = new Int16Array(w);     // superfície gerada
    this.bio = new Uint8Array(w);      // bioma por coluna
    this.rev = new Uint8Array(n);      // revelado no mapa
    this.chests = new Map();           // idx -> slots
    this.liqAct = new Set(); this.sandAct = new Set();
    this.spawn = { x: 0, y: 0 };
    this.hardmode = false;
    this.onBreak = null;               // callback(x,y,tileId) para drops de objetos soltos
    this.onTile = null;                // callback(x,y) quando um tile muda (mapa)
    this.chunkAct = new Uint8Array(Math.ceil(w / CHUNK) * Math.ceil(h / CHUNK));
  }
  idx(x, y) { return x + y * this.w; }
  inb(x, y) { return x >= 0 && x < this.w && y >= 0 && y < this.h; }
  get(x, y) { if (x < 0 || x >= this.w || y >= this.h) return T.bedrock; if (y < 0) return 0; return this.t[x + y * this.w]; }
  solid(x, y) { return SOLID[this.get(x, y)] === 1; }
  wallAt(x, y) { return (x < 0 || x >= this.w || y < 0 || y >= this.h) ? 0 : this.wl[x + y * this.w]; }
  liqAt(x, y) { return (x < 0 || x >= this.w || y < 0 || y >= this.h) ? 0 : this.lq[x + y * this.w]; }
  liqType(x, y) { return (x < 0 || x >= this.w || y < 0 || y >= this.h) ? 0 : this.lt[x + y * this.w]; }
  biomeName(x) { return ['ocean', 'desert', 'forest', 'jungle', 'snow'][this.bio[clamp(x | 0, 0, this.w - 1)]]; }
  layerAt(x, y) {
    if (y < Y_SKY) return 'sky';
    if (y >= Y_HELL) return 'hell';
    if (y >= Y_DEEP) return 'deep';
    const s = this.surf[clamp(x | 0, 0, this.w - 1)];
    if (y < s + 14) return 'surface';
    return 'cave';
  }

  _recalcSky(x, y0) {
    const w = this.w, h = this.h; let y = Math.max(y0, SKY_SCAN_Y);
    while (y < h && !(SOLID[this.t[x + y * w]] || this.wl[x + y * w])) y++;
    this.skyTop[x] = y;
  }
  set(x, y, id, quiet) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const w = this.w, i = x + y * w, old = this.t[i];
    if (old === id) return;
    this.t[i] = id;
    if (SOLID[id] && this.lq[i]) { this.lq[i] = 0; this.lt[i] = 0; }
    if (y >= SKY_SCAN_Y) { if (SOLID[id] || this.wl[i]) { if (y < this.skyTop[x]) this.skyTop[x] = y; } else if (y === this.skyTop[x]) this._recalcSky(x, y + 1); }
    if (this.onTile) this.onTile(x, y);
    if (quiet) return;
    this.wakeLiq(x, y);
    if (FALLS[id]) this.sandAct.add(i);
    if (y > 0 && FALLS[this.t[i - w]]) this.sandAct.add(i - w);
    this.checkSupport(x, y - 1);
    if (!SOLID[id]) this.checkSupport(x, y);
  }
  setWall(x, y, id) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = x + y * this.w; if (this.wl[i] === id) return;
    this.wl[i] = id;
    if (y >= SKY_SCAN_Y) { if (id) { if (y < this.skyTop[x]) this.skyTop[x] = y; } else if (y === this.skyTop[x] && !SOLID[this.t[i]]) this._recalcSky(x, y + 1); }
    if (this.onTile) this.onTile(x, y);
  }
  wakeLiq(x, y) {
    const w = this.w;
    for (let k = 0; k < 5; k++) {
      const nx = x + (k === 1 ? -1 : k === 2 ? 1 : 0), ny = y + (k === 3 ? -1 : k === 4 ? 1 : 0);
      if (nx < 0 || ny < 0 || nx >= w || ny >= this.h) continue;
      if (this.lq[nx + ny * w]) this.liqAct.add(nx + ny * w);
    }
  }
  // apoio: plantas e objetos exigem chão sólido abaixo
  checkSupport(x, y) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const id = this.t[x + y * this.w], d = TD[id];
    if (id === 0) return;
    const below = this.get(x, y + 1);
    let broken = false;
    if (d.plant) {
      if (id === T.cactus) broken = !(below === T.sand || below === T.cactus || below === T.sandstone);
      else broken = !SOLID[below];
    } else if (d.obj) broken = !SOLID[below];
    else if (d.door) broken = !(SOLID[below] || TD[below].door);
    else if (id === T.trunk) broken = !(SOLID[below] || below === T.trunk);
    if (broken) { if (this.onBreak) this.onBreak(x, y, id); if (id === T.trunk) this.fellTree(x, y, true); else this.set(x, y, 0); }
  }
  // derruba a árvore a partir de um tronco (retorna madeira)
  fellTree(x, y, silent) {
    let wood = 0;
    let top = y; while (this.get(x, top - 1) === T.trunk) top--;
    for (let yy = y; yy >= top; yy--) { if (this.get(x, yy) === T.trunk) { this.set(x, yy, 0, true); wood += rndi(1, 3); } }
    const seen = new Set(), q = [];
    const isLeaf = id => TD[id].tree && id !== T.trunk;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -2; dy <= 1; dy++) { const nx = x + dx, ny = top + dy; if (isLeaf(this.get(nx, ny))) { q.push([nx, ny]); seen.add(nx + ny * this.w); } }
    while (q.length && seen.size < 260) {
      const [cx, cy] = q.pop(); this.set(cx, cy, 0, true);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ny * this.w;
        if (!seen.has(k) && Math.abs(nx - x) <= 6 && ny <= top + 2 && ny >= top - 9 && isLeaf(this.get(nx, ny))) { seen.add(k); q.push([nx, ny]); }
      }
    }
    this.checkSupport(x, y + 1);
    if (!silent && this.onBreak) { /* drops tratados pelo chamador */ }
    return wood;
  }
  // porta: coluna de 3 tiles
  doorColumn(x, y) {
    let top = y; while (TD[this.get(x, top - 1)].door) top--;
    let bot = y; while (TD[this.get(x, bot + 1)].door) bot++;
    return [top, bot];
  }
  toggleDoor(x, y) {
    const [a, b] = this.doorColumn(x, y), open = this.get(x, y) === T.doorC;
    for (let yy = a; yy <= b; yy++) this.set(x, yy, open ? T.doorO : T.doorC, true);
  }

  // ---------- simulação de fluidos (autômato celular) ----------
  stepLiquids(budget = 4000) {
    const w = this.w, h = this.h, lq = this.lq, lt = this.lt, t = this.t;
    if (!this.liqAct.size) return 0;
    const cur = Array.from(this.liqAct).slice(0, budget);
    for (const i of cur) this.liqAct.delete(i);
    let changed = 0;
    for (const i of cur) {
      let amt = lq[i]; if (!amt) continue;
      const x = i % w, y = (i / w) | 0, ty = lt[i];
      if (y >= h - 1) continue;
      // cair
      const bi = i + w;
      if (!SOLID[t[bi]]) {
        const bt = lt[bi], bamt = lq[bi];
        if (bamt === 0 || bt === ty) {
          const mv = Math.min(amt, 255 - bamt);
          if (mv > 0) { lq[bi] = bamt + mv; lt[bi] = ty; amt -= mv; lq[i] = amt; if (!amt) lt[i] = 0; this.liqAct.add(bi); changed++; this._wakeAround(x, y); }
        } else if (bamt > 0 && bt !== ty) { this._react(i, bi, ty); continue; }
      }
      if (amt <= 0) continue;
      // espalhar
      const dirs = Math.random() < .5 ? [-1, 1] : [1, -1];
      for (const dx of dirs) {
        const nx = x + dx; if (nx < 0 || nx >= w) continue;
        const ni = i + dx;
        if (SOLID[t[ni]]) continue;
        const namt = lq[ni], nt = lt[ni];
        if (namt > 0 && nt !== ty) { this._react(i, ni, ty); amt = lq[i]; if (!amt) break; continue; }
        // só espalha se estiver apoiado (abaixo sólido ou líquido) ou cheio
        const diff = amt - namt;
        if (diff > 2) {
          const mv = (diff + 1) >> 1;
          lq[ni] = namt + mv; lt[ni] = ty; amt -= mv; lq[i] = amt; if (!amt) lt[i] = 0;
          this.liqAct.add(ni); this.liqAct.add(i); changed++;
          if (amt <= 0) break;
        }
      }
    }
    return changed;
  }
  _wakeAround(x, y) { const w = this.w; if (y > 0 && this.lq[x + (y - 1) * w]) this.liqAct.add(x + (y - 1) * w); if (x > 0 && this.lq[x - 1 + y * w]) this.liqAct.add(x - 1 + y * w); if (x < w - 1 && this.lq[x + 1 + y * w]) this.liqAct.add(x + 1 + y * w); }
  _react(i, j, ty) { // água + lava = obsidiana (no tile da lava)
    const lavaI = ty === LIQ_LAVA ? i : j, waterI = ty === LIQ_LAVA ? j : i;
    const lx = lavaI % this.w, ly = (lavaI / this.w) | 0;
    this.lq[lavaI] = 0; this.lt[lavaI] = 0;
    this.lq[waterI] = Math.max(0, this.lq[waterI] - 90); if (!this.lq[waterI]) this.lt[waterI] = 0;
    this.set(lx, ly, T.obsidian);
    if (this.onReact) this.onReact(lx, ly);
  }
  // ---------- gravidade de blocos (areia) ----------
  stepFalling(budget = 300) {
    if (!this.sandAct.size) return;
    const cur = Array.from(this.sandAct).slice(0, budget), w = this.w;
    for (const i of cur) this.sandAct.delete(i);
    for (const i of cur) {
      const id = this.t[i]; if (!FALLS[id]) continue;
      const x = i % w, y = (i / w) | 0;
      if (y >= this.h - 2) continue;
      const below = this.t[i + w];
      if (!SOLID[below]) {
        this.set(x, y, 0); this.set(x, y + 1, id, true);
        this.sandAct.add(i + w); if (y > 0) this.sandAct.add(i - w);
        this.wakeLiq(x, y + 1);
      }
    }
  }
}

// utilidades de gravação de blocos usadas na geração e em efeitos (meteoros etc.)
function carveCircle(wd, cx, cy, r, tile = 0) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2 && x > 0 && x < wd.w - 1 && y > 0 && y < wd.h - 3) { wd.t[x + y * wd.w] = tile; wd.lq[x + y * wd.w] = 0; wd.lt[x + y * wd.w] = 0; }
  }
}
