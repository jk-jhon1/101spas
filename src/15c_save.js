/* ============================================================
   15c_save: biblioteca de mundos (vários mundos salvos), salvamento automático e migração do save antigo
   - Armazenamento: IndexedDB, banco "espadas120" com 3 lojas:
       worlds  metadados leves de cada mundo (nome, semente, modo, progresso, miniatura…) — é o que a tela "Meus Mundos" lista
       data    o mundo em si (blocos comprimidos em RLE + jogador, inventário, baús, NPCs…)
       seeds   TODAS as sementes já sorteadas: uma semente nunca é reutilizada, nem depois de o mundo ser excluído
   - Sem IndexedDB (iframe com sandbox, alguns modos privados) os mundos ficam só em memória, durante a sessão, com aviso na tela.
   - Nada aqui toca o DOM/IndexedDB na carga do script (o validate.js carrega este módulo no Node): tudo é feito sob demanda.
   ============================================================ */
const SAVE_KEY = 'espadas120_save_v1';      // save ANTIGO (um único slot em localStorage): é importado como um mundo na 1ª abertura
const DB_NAME = 'espadas120', DB_VER = 1;

// ---------- compressão RLE (mesmo formato do save antigo, então saves antigos continuam legíveis) ----------
function rleEnc(u8) {
  const n = u8.length; let out = new Uint8Array(1 << 16), o = 0, i = 0;
  while (i < n) {
    const v = u8[i]; let j = i + 1; while (j < n && u8[j] === v) j++;
    let len = j - i;
    if (o + 12 > out.length) { const nb = new Uint8Array(out.length * 2); nb.set(out); out = nb; }
    out[o++] = v; while (len >= 128) { out[o++] = (len & 127) | 128; len >>>= 7; } out[o++] = len; i = j;
  }
  return out.slice(0, o);
}
function rleDec(bytes, n) {
  const out = new Uint8Array(n); let p = 0, o = 0;
  while (p < bytes.length && o < n) { const v = bytes[p++]; let len = 0, shift = 0, b; do { b = bytes[p++]; len |= (b & 127) << shift; shift += 7; } while (b & 128); out.fill(v, o, o + len); o += len; }
  return out;
}
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str) { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

// ---------- sementes e nomes ----------
function rand32() { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; } catch (e) { return (Math.random() * 4294967296) >>> 0; } }
const WN_A = ['Aurora', 'Brasa', 'Cinzas', 'Dunas', 'Éter', 'Fenda', 'Geada', 'Horizonte', 'Ilha', 'Jade', 'Lume', 'Névoa', 'Ocaso', 'Pérola', 'Quimera', 'Relâmpago', 'Solstício', 'Tormenta', 'Umbral', 'Vento',
  'Zênite', 'Âmbar', 'Cobalto', 'Eclipse', 'Fênix', 'Granito', 'Hélice', 'Índigo', 'Jasmim', 'Lótus', 'Magma', 'Nimbo', 'Oásis', 'Prisma', 'Quasar', 'Rubi', 'Safira', 'Titã', 'Vórtice', 'Zéfiro'];
const WN_B = ['do Aço', 'das Lâminas', 'dos Ventos', 'das Brumas', 'do Trovão', 'das Estrelas', 'do Abismo', 'das Marés', 'da Aurora', 'das Cinzas', 'do Eco', 'dos Gigantes', 'das Runas', 'da Tempestade', 'do Crepúsculo', 'das Sombras'];
function worldNameFromSeed(seed) { const r = mulberry32((seed ^ 0x5bd1e995) >>> 0); return WN_A[Math.floor(r() * WN_A.length)] + ' ' + WN_B[Math.floor(r() * WN_B.length)]; }

// ---------- IndexedDB (promessas) ----------
const idbReq = rq => new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error || new Error('erro no IndexedDB')); });
const idbDone = tx => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error || new Error('erro na transação')); tx.onabort = () => rej(tx.error || new Error('transação cancelada')); });

// ---------- miniatura do mundo (cartaz de 200x68 px, guardado como PNG em texto) ----------
const _rgbMemo = new Map();
function thumbRGB(wd, x, y) {
  const i = x + y * wd.w;
  if (!wd.t[i] && !wd.lq[i] && !wd.wl[i] && y <= wd.surf[x] + 10) { const k = clamp(y / 130, 0, 1); return [40 + 129 * k, 98 + 114 * k, 201 + 54 * k]; }   // céu: degradê
  const col = mapColor(wd, x, y); let rgb = _rgbMemo.get(col);
  if (!rgb) { rgb = hex2rgb(col); _rgbMemo.set(col, rgb); }
  const d = y - wd.surf[x]; if (d > 14) { const f = 1 - clamp((d - 14) / 260, 0, .5); return [rgb[0] * f, rgb[1] * f, rgb[2] * f]; }   // mais fundo = mais escuro
  return rgb;
}
function renderThumb(wd) {
  const TW = 200, TH = 68, SX = wd.w / TW, SY = wd.h / TH;
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const g = cv.getContext('2d'), img = g.createImageData(TW, TH), px = img.data;
  for (let py = 0; py < TH; py++) for (let pxl = 0; pxl < TW; pxl++) {
    let r = 0, gg = 0, b = 0;
    for (const sy of [.25, .75]) for (const sx of [.25, .75]) { const c = thumbRGB(wd, Math.floor((pxl + sx) * SX), Math.floor((py + sy) * SY)); r += c[0]; gg += c[1]; b += c[2]; }
    const o = (py * TW + pxl) * 4; px[o] = r / 4; px[o + 1] = gg / 4; px[o + 2] = b / 4; px[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

// ---------- (de)serialização do jogo ----------
// Foto do jogo neste instante: tudo é copiado/comprimido AGORA (síncrono, ~20 ms), então a gravação pode ser assíncrona
// sem que o jogo, que continua rodando, altere o que está sendo salvo.
function snapshotGame() {
  const wd = G.world, P = G.P, plain = v => JSON.parse(JSON.stringify(v));
  const w = { t: rleEnc(wd.t), wl: rleEnc(wd.wl), lq: rleEnc(wd.lq), lt: rleEnc(wd.lt), rev: rleEnc(wd.rev), surf: new Int16Array(wd.surf), bio: new Uint8Array(wd.bio) };
  const sv = {
    v: 2, seed: G.seed, mode: G.mode, time: G.time, day: G.day, t: G.t, stage: G.stage, flags: plain(G.flags), kills: G.kills || 0, hard: wd.hardmode,
    spawn: plain(wd.spawn), mush: wd.mushCenter ? plain(wd.mushCenter) : null, w,
    chests: plain([...wd.chests.entries()]),
    P: plain({ x: P.x, y: P.y, hp: P.hp, crystals: P.crystals, inv: P.inv, equip: P.equip, sel: P.sel }),
    npcs: G.npcs.map(n => ({ type: n.type, home: n.home, x: n.x, y: n.y })), opts: plain(G.opts),
  };
  return { sv, bytes: w.t.length + w.wl.length + w.lq.length + w.lt.length + w.rev.length + w.surf.byteLength + w.bio.length };
}
// Reconstrói o mundo a partir de um save (formato 2: arrays tipados; formato 1 antigo: base64) e entra no jogo.
function applyGame(sv, meta) {
  Snd.init(); resetGameState(sv.mode); G.seed = sv.seed;
  G.worldId = meta.id; G.worldName = meta.name; G.worldCreated = meta.created;
  const wd = new World(WW, WH, sv.seed), n = WW * WH, dec = a => typeof a === 'string' ? unb64(a) : a;
  wd.t.set(rleDec(dec(sv.w.t), n)); wd.wl.set(rleDec(dec(sv.w.wl), n)); wd.lq.set(rleDec(dec(sv.w.lq), n)); wd.lt.set(rleDec(dec(sv.w.lt), n)); wd.rev.set(rleDec(dec(sv.w.rev), n));
  wd.surf.set(sv.w.surf instanceof Int16Array ? sv.w.surf : new Int16Array(unb64(sv.w.surf).buffer)); wd.bio.set(dec(sv.w.bio));
  for (let x = 0; x < wd.w; x++) wd._recalcSky(x, 0);
  wd.hardmode = !!sv.hard; wd.spawn = sv.spawn; wd.mushCenter = sv.mush || undefined; wd.chests = new Map(sv.chests);
  G.world = wd; $('toasts').innerHTML = ''; $('menu').classList.add('hidden'); finishLoad(sv);
}

// ---------- a biblioteca ----------
const Worlds = {
  mode: 'init',                    // 'idb' = grava no navegador · 'memory' = só durante esta sessão
  why: '',                         // motivo de estar no modo memória
  db: null, mem: { worlds: new Map(), data: new Map(), seeds: new Set() },
  list: [],                        // metadados dos mundos, o mais recente primeiro
  used: new Set(),                 // sementes já sorteadas (inclusive de mundos excluídos)
  ready: null, q: Promise.resolve(), _n: 0, _warned: false,

  init() { return this.ready || (this.ready = this._init()); },
  async _init() {
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('IndexedDB indisponível');
      this.db = await Promise.race([this._open(), new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado ao abrir o banco')), 4000))]);
      const tx = this.db.transaction(['worlds', 'seeds'], 'readonly');
      const [ws, ss] = await Promise.all([idbReq(tx.objectStore('worlds').getAll()), idbReq(tx.objectStore('seeds').getAllKeys())]);
      this.list = ws; ss.forEach(s => this.used.add(s)); ws.forEach(w => this.used.add(w.seed));
      this.mode = 'idb';
    } catch (e) { this.mode = 'memory'; this.why = String((e && e.message) || e); this.db = null; }
    await this._migrateLegacy();
    this._sort(); return this.mode;
  },
  _open() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open(DB_NAME, DB_VER);
      rq.onupgradeneeded = () => { const db = rq.result; db.createObjectStore('worlds', { keyPath: 'id' }); db.createObjectStore('data', { keyPath: 'id' }); db.createObjectStore('seeds', { keyPath: 'seed' }); };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error || new Error('falha ao abrir o banco')); rq.onblocked = () => rej(new Error('banco bloqueado por outra aba'));
    });
  },
  _sort() { this.list.sort((a, b) => b.updated - a.updated); },
  newId() { return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  uniqueName(base, exceptId) {
    const taken = new Set(this.list.filter(w => w.id !== exceptId).map(w => w.name.toLowerCase()));
    if (!taken.has(base.toLowerCase())) return base;
    for (const r of ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']) if (!taken.has((base + ' ' + r).toLowerCase())) return base + ' ' + r;
    for (let n = 21; ; n++) if (!taken.has((base + ' ' + n).toLowerCase())) return base + ' ' + n;
  },

  // Sorteia a semente (e o nome) de um mundo NOVO: inédita e com mapa de biomas bem diferente dos mundos existentes (ver chooseSeed).
  async allocate(mode) {
    await this.init();
    let seed;
    if (typeof window !== 'undefined' && window.__nextSeed !== undefined) { seed = window.__nextSeed >>> 0; delete window.__nextSeed; }   // gancho de teste: força a próxima semente
    else seed = chooseSeed(rand32, this.used, this.list.map(w => ({ key: w.layoutKey, runs: w.runs }))).seed;
    this.used.add(seed); await this._putSeed(seed).catch(() => { });
    return { id: this.newId(), seed, name: this.uniqueName(worldNameFromSeed(seed)), mode };
  },
  async _putSeed(seed) {
    if (this.mode !== 'idb') { this.mem.seeds.add(seed); return; }
    const tx = this.db.transaction(['seeds'], 'readwrite'); tx.objectStore('seeds').put({ seed }); await idbDone(tx);
  },
  async _put(meta, sv) {
    if (this.mode === 'idb') {
      const tx = this.db.transaction(['worlds', 'data', 'seeds'], 'readwrite');
      tx.objectStore('worlds').put(meta); tx.objectStore('data').put({ id: meta.id, sv }); tx.objectStore('seeds').put({ seed: meta.seed });
      await idbDone(tx);
    } else { this.mem.worlds.set(meta.id, meta); this.mem.data.set(meta.id, { id: meta.id, sv }); }
    this.used.add(meta.seed);
    const i = this.list.findIndex(w => w.id === meta.id); if (i >= 0) this.list[i] = meta; else this.list.push(meta);
    this._sort();
  },
  async _putMeta(meta) {
    if (this.mode === 'idb') { const tx = this.db.transaction(['worlds'], 'readwrite'); tx.objectStore('worlds').put(meta); await idbDone(tx); } else this.mem.worlds.set(meta.id, meta);
    const i = this.list.findIndex(w => w.id === meta.id); if (i >= 0) this.list[i] = meta; this._sort();
  },
  async _data(id) {
    if (this.mode === 'idb') { const tx = this.db.transaction(['data'], 'readonly'); return idbReq(tx.objectStore('data').get(id)); }
    return this.mem.data.get(id);
  },

  // Salva o mundo aberto. Serializa na hora e grava em segundo plano; os salvamentos entram numa fila (nunca dois ao mesmo tempo).
  //   opts.silent: sem aviso na tela (autosave) · opts.thumb: refaz a miniatura (salvamento manual / ao sair)
  save(opts) {
    opts = opts || {};
    if (G.state !== 'play' || !G.world || !G.worldId) return Promise.resolve(false);
    let snap; try { snap = snapshotGame(); } catch (e) { console.error(e); if (!opts.silent) toast('Erro ao preparar o salvamento: ' + e.message, '#fca5a5', 6); return Promise.resolve(false); }
    const old = this.list.find(w => w.id === G.worldId), wd = G.world;
    const meta = {
      id: G.worldId, name: G.worldName, seed: G.seed >>> 0, mode: G.mode, created: G.worldCreated || Date.now(), updated: Date.now(),
      playSec: Math.round(G.t || 0), day: G.day, stage: G.stage, bosses: Object.values(G.flags).filter(Boolean).length,
      layoutKey: wd.layoutKey(), runs: old && old.runs ? old.runs : wd.biomeRuns(), thumb: old ? old.thumb : null, bytes: snap.bytes, legacy: old ? !!old.legacy : false,
    };
    if (opts.thumb || !meta.thumb || (++this._n % 10) === 0) { try { meta.thumb = renderThumb(wd); } catch (e) { console.warn('miniatura falhou', e); } }
    const job = this.q.then(async () => {
      await this.init();
      await this._put(meta, snap.sv);
      if (this.mode !== 'idb') {
        if (!opts.silent) toast('Salvamento permanente indisponível neste ambiente: o mundo fica guardado só enquanto esta página estiver aberta. Abra o jogo direto no navegador (ou por http) para salvar de verdade.', '#fca5a5', 7);
        return false;
      }
      this._warned = false;
      if (!opts.silent) toast('Mundo salvo (' + Math.round(meta.bytes / 1024) + ' KB).', '#86efac'); else if (typeof showSaveBadge === 'function') showSaveBadge();
      return true;
    }).catch(e => {
      console.warn('salvamento falhou', e);
      const quota = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)));
      const msg = quota ? 'Sem espaço para salvar. Exclua mundos antigos em "Meus Mundos".' : 'Não foi possível salvar o mundo: ' + ((e && e.message) || e);
      if (!opts.silent || !this._warned) { this._warned = true; toast(msg, '#fca5a5', 7); }
      return false;
    });
    this.q = job; return job;
  },
  async load(id) {
    await this.init();
    const meta = this.list.find(w => w.id === id);
    if (!meta) { toast('Mundo não encontrado.', '#fbbf24'); return false; }
    let rec = null; try { rec = await this._data(id); } catch (e) { console.warn(e); }
    if (!rec || !rec.sv) { toast('Os dados deste mundo não foram encontrados (arquivo corrompido?).', '#f87171', 6); return false; }
    try { applyGame(rec.sv, meta); } catch (e) { console.error(e); toast('Não foi possível abrir este mundo: ' + e.message, '#f87171', 6); G.state = 'title'; return false; }
    return true;
  },
  async rename(id, name) {
    name = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 28); if (!name) return false;
    const meta = this.list.find(w => w.id === id); if (!meta) return false;
    await this._putMeta(Object.assign({}, meta, { name })); if (G.worldId === id) G.worldName = name; return true;
  },
  async remove(id) {   // a semente continua registrada em "seeds": nunca mais é sorteada
    if (this.mode === 'idb') { const tx = this.db.transaction(['worlds', 'data'], 'readwrite'); tx.objectStore('worlds').delete(id); tx.objectStore('data').delete(id); await idbDone(tx); }
    else { this.mem.worlds.delete(id); this.mem.data.delete(id); }
    this.list = this.list.filter(w => w.id !== id); return true;
  },
  async usage() { try { const e = await navigator.storage.estimate(); return { used: e.usage || 0, quota: e.quota || 0 }; } catch (e) { return null; } },

  // Importa o save antigo (um único slot em localStorage) como um mundo da biblioteca, uma vez só.
  async _migrateLegacy() {
    let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
    if (!raw) return;
    try {
      const sv = JSON.parse(raw); if (!sv || !sv.w || sv.seed === undefined) throw new Error('save antigo inválido');
      const bio = unb64(sv.w.bio), seed = sv.seed >>> 0, now = Date.now();
      const meta = {
        id: this.newId(), name: this.uniqueName(worldNameFromSeed(seed)), seed, mode: sv.mode || 'adventure', created: now, updated: now, playSec: Math.round(sv.t || 0), day: sv.day || 1,
        stage: sv.stage || 0, bosses: Object.values(sv.flags || {}).filter(Boolean).length, layoutKey: biomeKeyOf(bio), runs: biomeRunsOf(bio), thumb: null, bytes: raw.length, legacy: true,
      };
      await this._put(meta, sv);
      if (this.mode === 'idb') { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }   // sem IndexedDB o mundo só existe na memória: o save antigo fica, para não perder nada
    } catch (e) { console.warn('migração do save antigo falhou', e); }
  },
};

// ---------- API usada pelo resto do jogo e pelos testes ----------
function hasSave() { return Worlds.list.length > 0; }
function saveGame(silent) { return Worlds.save({ silent: !!silent, thumb: !silent }); }                     // Promise<boolean>
function loadGame(id) { return Worlds.load(id || G.worldId || (Worlds.list[0] && Worlds.list[0].id)); }    // Promise<boolean>
