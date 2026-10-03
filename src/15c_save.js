/* ============================================================
   15c_save: salvar/carregar (RLE + base64 em localStorage)
   ============================================================ */
const SAVE_KEY = 'espadas120_save_v1';
function rleEnc(u8) {
  const out = []; let i = 0; const n = u8.length;
  while (i < n) { const v = u8[i]; let j = i + 1; while (j < n && u8[j] === v) j++; let len = j - i; out.push(v); while (len >= 128) { out.push((len & 127) | 128); len >>= 7; } out.push(len); i = j; }
  return Uint8Array.from(out);
}
function rleDec(bytes, n) {
  const out = new Uint8Array(n); let p = 0, o = 0;
  while (p < bytes.length && o < n) { const v = bytes[p++]; let len = 0, shift = 0, b; do { b = bytes[p++]; len |= (b & 127) << shift; shift += 7; } while (b & 128); out.fill(v, o, o + len); o += len; }
  return out;
}
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str) { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveGame(silent) {
  if (G.state !== 'play' || !G.world) return false;
  try {
    const wd = G.world, P = G.P, enc = a => b64(rleEnc(a));
    const sv = {
      v: 1, seed: G.seed, mode: G.mode, time: G.time, day: G.day, t: G.t, stage: G.stage, flags: G.flags, kills: G.kills || 0, hard: wd.hardmode, spawn: wd.spawn, mush: wd.mushCenter || null,
      w: { t: enc(wd.t), wl: enc(wd.wl), lq: enc(wd.lq), lt: enc(wd.lt), rev: enc(wd.rev), surf: b64(new Uint8Array(wd.surf.buffer.slice(0))), bio: b64(wd.bio) },
      chests: [...wd.chests.entries()],
      P: { x: P.x, y: P.y, hp: P.hp, crystals: P.crystals, inv: P.inv, equip: P.equip, sel: P.sel },
      npcs: G.npcs.map(n => ({ type: n.type, home: n.home, x: n.x, y: n.y })), opts: G.opts,
    };
    const str = JSON.stringify(sv); localStorage.setItem(SAVE_KEY, str);
    if (!silent) toast('Jogo salvo (' + Math.round(str.length / 1024) + ' KB).', '#86efac'); return true;
  } catch (e) { if (!silent) toast('Não foi possível salvar neste ambiente (localStorage indisponível ou cheio). Abra o arquivo HTML num navegador para salvar.', '#fca5a5', 6); return false; }
}
function loadGame() {
  let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { }
  if (!raw) { toast('Nenhum jogo salvo encontrado.', '#fbbf24'); return false; }
  let sv; try { sv = JSON.parse(raw); } catch (e) { toast('Save corrompido.', '#f87171'); return false; }
  Snd.init(); resetGameState(sv.mode); G.seed = sv.seed;
  const wd = new World(WW, WH, sv.seed), n = WW * WH;
  wd.t.set(rleDec(unb64(sv.w.t), n)); wd.wl.set(rleDec(unb64(sv.w.wl), n)); wd.lq.set(rleDec(unb64(sv.w.lq), n)); wd.lt.set(rleDec(unb64(sv.w.lt), n)); wd.rev.set(rleDec(unb64(sv.w.rev), n));
  wd.surf.set(new Int16Array(unb64(sv.w.surf).buffer)); wd.bio.set(unb64(sv.w.bio)); for (let x = 0; x < wd.w; x++) wd._recalcSky(x, 0);
  wd.hardmode = !!sv.hard; wd.spawn = sv.spawn; wd.mushCenter = sv.mush || undefined; wd.chests = new Map(sv.chests);
  G.world = wd; $('menu').classList.add('hidden'); finishLoad(sv); return true;
}
