/* ============================================================
   15f_transfer: este aparelho, proteção do armazenamento e mapa em arquivo (exportar / importar)
   - APARELHO: um código aleatório (ex.: K7QF-3M9D) guardado no próprio aparelho. NÃO usa o IP: um site não consegue ler o IP local
     (os navegadores escondem), o IP público muda ao trocar de rede e é igual para todos na mesma casa/operadora. O código só serve
     para dizer de onde um mapa veio.
   - PROTEÇÃO: pede ao navegador armazenamento "persistente" (navigator.storage.persist) para ele não apagar os mapas sozinho.
   - ARQUIVO: cada mundo vira um .json autocontido, com verificação de integridade (CRC-32), que serve de backup no aparelho ou para
     levar o mapa do PC ao celular. Ao importar, NADA do arquivo é confiado: tudo é validado e o mundo é reconstruído só com campos
     permitidos (itens existentes, camadas do tamanho certo, valores dentro da faixa…), então um arquivo ruim nunca quebra o jogo.
   - Só define funções e objetos: nada toca o DOM nem o navegador na carga do script.
   ============================================================ */
const WORLD_FILE_FORMAT = 'espadas-do-destino/mundo', WORLD_FILE_VERSION = 1, WORLD_FILE_MAX = 24 * 1024 * 1024;
const DEVICE_KEY = 'espadas120_device', PROT_KEY = 'espadas120_prot_asked';
const DEV_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', DEV_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;   // sem I, O, 0 e 1 (confundem)

// ---------- este aparelho ----------
function newDeviceCode() {
  const a = new Uint8Array(8);
  try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < 8; i++) a[i] = Math.random() * 256; }
  let s = ''; for (let i = 0; i < 8; i++) s += DEV_ALPHA[a[i] & 31];
  return s.slice(0, 4) + '-' + s.slice(4);
}
function deviceLabel() {   // "PC · Chrome (Windows)", "Celular · Safari (iOS)"…  só informativo
  const nav = typeof navigator !== 'undefined' ? navigator : null; if (!nav) return 'Aparelho';
  const ua = String(nav.userAgent || ''), touch = (nav.maxTouchPoints || 0) > 1, uad = nav.userAgentData;
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch);   // o iPadOS se apresenta como Mac
  const phone = /iPhone|iPod/.test(ua) || (/Android/.test(ua) && /Mobile/.test(ua)) || !!(uad && uad.mobile && !ipad);
  const tablet = ipad || (/Android/.test(ua) && !/Mobile/.test(ua));
  const kind = phone ? 'Celular' : tablet ? 'Tablet' : 'PC';
  const br = /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS|Chromium/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'navegador';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : (/iPhone|iPad|iPod/.test(ua) || ipad) ? 'iOS' : /CrOS/.test(ua) ? 'ChromeOS'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux|X11/.test(ua) ? 'Linux' : '';
  return kind + ' · ' + br + (os ? ' (' + os + ')' : '');
}
const Device = {
  id: '', born: 0, label: '', persistent: false,   // persistent=false: o navegador não deixa guardar nada (o código vale só nesta sessão)
  init() {
    if (this.id) return this;
    this.label = deviceLabel();
    let raw = null, rec = null, can = true;
    try { raw = localStorage.getItem(DEVICE_KEY); } catch (e) { can = false; }   // iframe com sandbox, modo privado…: não dá para guardar nada
    if (raw) { try { rec = JSON.parse(raw); } catch (e) { rec = null; } }          // registro corrompido: o armazenamento funciona, só se gera um código novo
    if (!rec || typeof rec.id !== 'string' || !DEV_RE.test(rec.id)) {
      rec = { id: newDeviceCode(), born: Date.now() };
      if (can) { try { localStorage.setItem(DEVICE_KEY, JSON.stringify(rec)); } catch (e) { can = false; } }
    }
    this.id = rec.id; this.born = +rec.born || 0; this.persistent = can; return this;
  },
};

// ---------- proteção do armazenamento ("persistente": o navegador não apaga os mapas sozinho quando falta espaço) ----------
const Protect = {
  can() { return typeof navigator !== 'undefined' && !!navigator.storage && typeof navigator.storage.persist === 'function'; },
  async status() {   // 'on' protegido · 'off' não garantido · 'na' o navegador não oferece
    try { if (!this.can() || typeof navigator.storage.persisted !== 'function') return 'na'; return (await navigator.storage.persisted()) ? 'on' : 'off'; } catch (e) { return 'na'; }
  },
  async request() {
    try {
      if (!this.can()) return false;
      if (typeof navigator.storage.persisted === 'function' && (await navigator.storage.persisted())) return true;
      return !!(await navigator.storage.persist());
    } catch (e) { return false; }
  },
  // Pede uma única vez por aparelho, depois do primeiro salvamento. O Chrome decide em silêncio; o Firefox abre um aviso próprio,
  // então lá o pedido só acontece pelo botão "Proteger agora" (com o contexto na tela).
  async autoAsk() {
    try { if (localStorage.getItem(PROT_KEY)) return; localStorage.setItem(PROT_KEY, '1'); } catch (e) { return; }
    if (typeof navigator !== 'undefined' && /Firefox\//.test(navigator.userAgent || '')) return;
    await this.request();
  },
};

// ---------- utilitários do arquivo ----------
const _crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(str) {   // CRC-32 (o mesmo do zip/png) sobre os bytes UTF-8 do texto; devolve 8 dígitos hexadecimais
  const u = new TextEncoder().encode(str); let c = 0xFFFFFFFF;
  for (let i = 0; i < u.length; i++) c = _crcT[(c ^ u[i]) & 255] ^ (c >>> 8);
  return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}
// Percorre um fluxo RLE SEM alocar: devolve o tamanho total decodificado e o maior valor (len = -1 se o fluxo estiver malformado).
function rleScan(u) {
  let p = 0, len = 0, max = 0;
  while (p < u.length) {
    const v = u[p++]; if (v > max) max = v;
    let run = 0, mul = 1, b, k = 0;
    do { if (p >= u.length || ++k > 4) return { len: -1, max }; b = u[p++]; run += (b & 127) * mul; mul *= 128; } while (b & 128);
    len += run; if (len > 4e7) return { len: -1, max };
  }
  return { len, max };
}
function safeUnb64(s) {   // base64 estrito (e de tamanho razoável) -> Uint8Array, ou null
  if (typeof s !== 'string' || s.length > 12e6 || s.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  try { return unb64(s); } catch (e) { return null; }
}
const cleanText = (s, max) => typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// Um espaço de inventário: null, ou { id, n, m } com item que EXISTE. undefined = inválido. want: 'armor' | 'acc' (tipo exigido).
function cleanSlot(s, want) {
  if (s === null || s === undefined) return null;
  if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !hasOwn(IT, s.id) || !Number.isInteger(s.n) || s.n < 1 || s.n > 1e6) return undefined;
  if (want && IT[s.id].type !== want) return undefined;
  const out = { id: s.id, n: s.n };   // só leva "m" se o item tinha (ida e volta exata)
  if (s.m !== undefined) {
    if (s.m === null) out.m = null;
    else {
      if (typeof s.m !== 'object' || Array.isArray(s.m)) return undefined;
      try { const j = JSON.stringify(s.m); if (j.length > 400) return undefined; out.m = JSON.parse(j); } catch (e) { return undefined; }
    }
  }
  return out;
}

// Valida um save (formato 2) e o RECONSTRÓI só com campos permitidos. -> { sv, bytes } ou { error }.
function sanitizeSave(raw) {
  const bad = m => ({ error: m });
  const isO = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const pt = (o, mx, my, miny) => isO(o) && num(o.x, 0, mx) && num(o.y, miny, my);
  if (!isO(raw) || raw.v !== 2) return bad('formato do mundo desconhecido');
  if (!int(raw.seed, 0, 4294967295)) return bad('semente inválida');
  if (raw.mode !== 'adventure' && raw.mode !== 'creative') return bad('modo de jogo inválido');
  const kills = raw.kills === undefined ? 0 : raw.kills;
  if (!num(raw.time, 0, 1) || !int(raw.day, 1, 1e7) || !num(raw.t, 0, 1e9) || !int(raw.stage, 0, 20) || !int(kills, 0, 1e9)) return bad('progresso inválido');
  // --- o mundo em si ---
  const W = raw.w; if (!isO(W)) return bad('blocos ausentes');
  const N = WW * WH, w = {}; let bytes = 0;
  const layers = [['t', TD.length - 1], ['wl', Math.max(...Object.values(WALL))], ['lq', 255], ['lt', 2], ['rev', 1]];
  for (const [k, max] of layers) {
    const u = safeUnb64(W[k]); if (!u) return bad('camada "' + k + '" ilegível');
    const sc = rleScan(u);
    if (sc.len !== N) return bad('camada "' + k + '" com tamanho errado');
    if (sc.max > max) return bad('camada "' + k + '" com valores inválidos');
    w[k] = u; bytes += u.length;
  }
  const su = safeUnb64(W.surf); if (!su || su.length !== WW * 2) return bad('relevo inválido');
  const surf = new Int16Array(su.buffer, 0, WW);
  for (let x = 0; x < WW; x++) if (surf[x] < -16 || surf[x] > WH + 16) return bad('relevo fora do mundo');
  const bio = safeUnb64(W.bio); if (!bio || bio.length !== WW) return bad('biomas inválidos');
  for (let x = 0; x < WW; x++) if (bio[x] >= BIO_NAMES.length) return bad('bioma desconhecido');
  w.surf = surf; w.bio = bio; bytes += surf.byteLength + bio.length;
  if (!pt(raw.spawn, WW * TS, WH * TS + 400, -400)) return bad('ponto de partida inválido');
  let mush = null;
  if (raw.mush !== null && raw.mush !== undefined) { if (!pt(raw.mush, WW, WH, 0)) return bad('área dos cogumelos inválida'); mush = { x: raw.mush.x, y: raw.mush.y }; }
  const cs = raw.chests === undefined ? [] : raw.chests, chests = [];
  if (!Array.isArray(cs) || cs.length > 4000) return bad('baús inválidos');
  for (const e of cs) {
    if (!Array.isArray(e) || e.length !== 2 || !int(e[0], 0, N - 1) || !Array.isArray(e[1]) || e[1].length > 60) return bad('baú inválido');
    const slots = []; for (const s of e[1]) { const c = cleanSlot(s); if (c === undefined) return bad('item inválido em um baú'); slots.push(c); }
    chests.push([e[0], slots]);
  }
  // --- o jogador ---
  const Pp = raw.P;
  if (!pt(Pp, WW * TS, WH * TS + 400, -400) || !num(Pp.hp, 0, 1e6) || !int(Pp.crystals, 0, 1e4) || !int(Pp.sel === undefined ? 0 : Pp.sel, 0, 9)) return bad('jogador inválido');
  if (!Array.isArray(Pp.inv) || Pp.inv.length !== INV_N) return bad('inventário inválido');
  const inv = []; for (const s of Pp.inv) { const c = cleanSlot(s); if (c === undefined) return bad('item inválido no inventário'); inv.push(c); }
  const eq = isO(Pp.equip) ? Pp.equip : {}, armor = cleanSlot(eq.armor, 'armor'); if (armor === undefined) return bad('armadura inválida');
  const accIn = Array.isArray(eq.acc) ? eq.acc : []; if (accIn.length !== 3 && accIn.length !== 4) return bad('acessórios inválidos');
  const acc = accIn.map(s => cleanSlot(s, 'acc')); if (acc.includes(undefined)) return bad('acessório inválido');
  while (acc.length < 4) acc.push(null);   /* saves antigos tinham 3 slots */
  const ns = raw.npcs === undefined ? [] : raw.npcs, npcs = [];
  if (!Array.isArray(ns) || ns.length > 100) return bad('NPCs inválidos');
  for (const n of ns) {
    if (!isO(n) || !hasOwn(NPC_DEF, n.type) || typeof n.home !== 'string' || !/^\d{1,5},\d{1,5}$/.test(n.home) || !num(n.x, 0, WW * TS) || !num(n.y, -400, WH * TS + 400)) return bad('NPC inválido');
    npcs.push({ type: n.type, home: n.home, x: n.x, y: n.y });
  }
  const flags = {}; for (const k of ['slime', 'eye', 'guardian', 'colossus']) flags[k] = !!(isO(raw.flags) && raw.flags[k]);
  if (typeof BXLIST !== 'undefined' && isO(raw.flags)) for (const d of BXLIST) if (raw.flags[d.id] === true) flags[d.id] = true;   /* chefes novos: só entram os já derrotados (o resto fica ausente, como no jogo) */
  const opts = {}; for (const k of ['god', 'noSpawn', 'showDps', 'freeCraft']) opts[k] = !!(isO(raw.opts) && raw.opts[k]);
  return {
    sv: { v: 2, seed: raw.seed, mode: raw.mode, time: raw.time, day: raw.day, t: raw.t, stage: raw.stage, flags, kills, hard: !!raw.hard, spawn: { x: raw.spawn.x, y: raw.spawn.y }, mush, w, chests,
      P: { x: Pp.x, y: Pp.y, hp: Pp.hp, crystals: Pp.crystals, inv, equip: { armor, acc }, sel: Pp.sel || 0 }, npcs, opts },
    bytes,
  };
}

// ---------- o arquivo ----------
function svToPlain(sv) {   // typed arrays -> base64 (aceita também o save antigo, que já guardava base64)
  const enc = a => typeof a === 'string' ? a : b64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength)), w = sv.w;
  return Object.assign({}, sv, { v: 2, w: { t: enc(w.t), wl: enc(w.wl), lq: enc(w.lq), lt: enc(w.lt), rev: enc(w.rev), surf: enc(w.surf), bio: enc(w.bio) } });
}
function worldFileName(meta) {
  const slug = String(meta.name || 'mundo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 32) || 'mundo';
  const d = new Date(meta.updated || Date.now()), p = n => String(n).padStart(2, '0');
  return 'espadas-' + slug + '-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
}
// Monta o texto do arquivo. "payload" é um texto dentro do JSON: o CRC-32 vale para os bytes exatos dele (sem ambiguidade de formatação).
function buildWorldFile(meta, sv, dev) {
  const payload = JSON.stringify({ meta: { name: meta.name, created: meta.created, updated: meta.updated, thumb: meta.thumb || null, dev: meta.dev || '', devLabel: meta.devLabel || '', size: [WW, WH] }, sv: svToPlain(sv) });
  return JSON.stringify({
    format: WORLD_FILE_FORMAT, version: WORLD_FILE_VERSION, game: 'Espadas Do Destino', exportedAt: Date.now(), device: { id: dev.id, label: dev.label },
    info: { name: meta.name, seed: meta.seed, mode: meta.mode, playSec: meta.playSec, savedAt: new Date(meta.updated).toISOString() }, check: crc32(payload), payload,
  }, null, 1);
}
// Lê e valida o texto de um arquivo. -> { error } ou { sv, bytes, name, created, updated, thumb, dev, devLabel, from }
function parseWorldFile(text) {
  if (typeof text !== 'string' || !text.trim()) return { error: 'o arquivo está vazio' };
  if (text.length > WORLD_FILE_MAX) return { error: 'arquivo grande demais' };
  let f; try { f = JSON.parse(text); } catch (e) { return { error: 'não é um arquivo de mundo do jogo (não é um JSON válido)' }; }
  if (!f || typeof f !== 'object' || f.format !== WORLD_FILE_FORMAT) return { error: 'não é um arquivo de mundo do Espadas Do Destino' };
  if (!Number.isInteger(f.version) || f.version < 1) return { error: 'versão do arquivo desconhecida' };
  if (f.version > WORLD_FILE_VERSION) return { error: 'o arquivo é de uma versão mais nova do jogo: atualize a página e tente de novo' };
  if (typeof f.payload !== 'string' || typeof f.check !== 'string') return { error: 'arquivo incompleto' };
  if (crc32(f.payload) !== f.check.toLowerCase()) return { error: 'arquivo corrompido (a verificação de integridade falhou)' };
  let pl; try { pl = JSON.parse(f.payload); } catch (e) { return { error: 'arquivo corrompido (dados ilegíveis)' }; }
  if (!pl || typeof pl !== 'object') return { error: 'arquivo corrompido (dados ilegíveis)' };
  const sz = pl.meta && pl.meta.size;   // um arquivo de outra versão, com mundo de outro tamanho, recebe uma explicação clara em vez de "camada com tamanho errado"
  if (Array.isArray(sz) && (sz[0] !== WW || sz[1] !== WH)) return { error: 'o mapa tem outro tamanho (' + Number(sz[0]) + '×' + Number(sz[1]) + ') do que esta versão do jogo abre (' + WW + '×' + WH + ')' };
  const r = sanitizeSave(pl.sv); if (r.error) return { error: 'dados do mundo inválidos: ' + r.error };
  const m = pl.meta && typeof pl.meta === 'object' ? pl.meta : {}, now = Date.now();
  const ts = (v, d) => typeof v === 'number' && isFinite(v) && v >= 0 && v <= now + 864e5 ? Math.round(v) : d;
  const created = ts(m.created, now), updated = ts(m.updated, created);
  const thumb = typeof m.thumb === 'string' && m.thumb.length <= 160000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(m.thumb) ? m.thumb : null;   // vai para um <img src>: só PNG em base64
  const fd = f.device && typeof f.device === 'object' ? f.device : {};
  return {
    sv: r.sv, bytes: r.bytes, name: cleanText(m.name, 28) || worldNameFromSeed(r.sv.seed), created, updated, thumb,
    dev: typeof m.dev === 'string' && DEV_RE.test(m.dev) ? m.dev : '', devLabel: cleanText(m.devLabel, 60),
    from: { id: typeof fd.id === 'string' && DEV_RE.test(fd.id) ? fd.id : '', label: cleanText(fd.label, 60) },
  };
}

// ---------- ligação com a biblioteca de mundos ----------
Object.assign(Worlds, {
  // Gera o arquivo de um mundo salvo (se ele estiver aberto, salva antes: o que está na tela entra no arquivo). -> { name, text }
  async exportFile(id) {
    await this.init();
    if (typeof G !== 'undefined' && G.state === 'play' && G.worldId === id) await this.save({ silent: true, thumb: true });
    const meta = this.list.find(w => w.id === id); if (!meta) throw new Error('mundo não encontrado');
    const rec = await this._data(id); if (!rec || !rec.sv) throw new Error('os dados deste mundo não foram encontrados');
    return { name: worldFileName(meta), text: buildWorldFile(meta, rec.sv, Device.init()) };
  },
  // Importa o texto de um arquivo. Nunca sobrescreve progresso maior:
  //   mundo novo           -> entra na biblioteca (nome único; a semente fica registrada, então nunca é sorteada de novo)
  //   mesmo mundo (semente + data de criação), arquivo mais novo E com mais tempo de jogo -> atualiza
  //   mesmo mundo, arquivo igual/mais velho -> ignora · os dois evoluíram separados (arquivo mais novo, mas com menos jogo) -> ignora e explica
  // -> { ok, action: 'added'|'updated'|'skipped'|'error', reason?, name?, from?, fileSec?, localSec? }
  async importText(text) {
    await this.init();
    const p = parseWorldFile(text); if (p.error) return { ok: false, action: 'error', reason: p.error };
    const sv = p.sv, seed = sv.seed >>> 0, same = this.list.find(w => w.seed === seed), fileSec = Math.round(sv.t), now = Date.now();
    const meta = {
      id: same ? same.id : this.newId(), name: same ? same.name : this.uniqueName(p.name), seed, mode: sv.mode, created: p.created, updated: p.updated, playSec: fileSec, day: sv.day, stage: sv.stage,
      bosses: Object.values(sv.flags).filter(Boolean).length, layoutKey: biomeKeyOf(sv.w.bio), runs: biomeRunsOf(sv.w.bio), thumb: p.thumb, bytes: p.bytes, legacy: false,
      dev: p.dev || (p.from && p.from.id) || '', devLabel: p.devLabel || (p.from && p.from.label) || '', imported: true, importedAt: now, importedFrom: p.from,
    };
    const fromTxt = (p.from.label || 'outro aparelho') + (p.from.id ? ', código ' + p.from.id : '');
    if (same) {
      if (same.created !== p.created) return { ok: false, action: 'error', reason: 'já existe outro mundo com o mesmo terreno (semente repetida) neste aparelho: "' + same.name + '"' };
      if (!(p.updated > same.updated)) return { ok: false, action: 'skipped', reason: 'same', name: same.name };
      if (fileSec < (same.playSec || 0)) return { ok: false, action: 'skipped', reason: 'diverged', name: same.name, fileSec, localSec: same.playSec || 0 };
      // atualização: continua sendo o MESMO mundo daqui (nome, origem e id mantidos); só o progresso vem do arquivo
      Object.assign(meta, { name: same.name, dev: same.dev, devLabel: same.devLabel, thumb: p.thumb || same.thumb, imported: same.imported, importedAt: same.importedAt, importedFrom: same.importedFrom });
      if (!same.imported) { delete meta.imported; delete meta.importedAt; delete meta.importedFrom; }
      await this._put(meta, sv);
      return { ok: true, action: 'updated', name: meta.name, from: fromTxt, fileSec, localSec: same.playSec || 0 };
    }
    await this._put(meta, sv);
    return { ok: true, action: 'added', name: meta.name, from: fromTxt, fileSec };
  },
});
