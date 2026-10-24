// Testa, sem navegador, o que a rodada de conquistas acrescentou:
//   · as 429 conquistas registradas (ids, categorias, raridades, progresso seguro com o jogo vazio);
//   · o painel (HTML), o estado, o saneamento do arquivo importado e a união de perfis;
//   · os 4 itens de invocar NPC (só no Modo Criativo) e o save/importação de um NPC invocado;
//   · o selo da espada Axioma (s190): ela só cai quando todos os chefes do jogo já caíram.
//        node dev/test_ach.js
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(SRC).filter(f => /^\d+.*\.js$/.test(f)).sort();
const use = files.filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));   // mesmos módulos do validate.js
let code = use.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');

const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, isFinite,
  performance: { now: () => Date.now() }, TextEncoder, TextDecoder,
  btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
  crypto: require('crypto').webcrypto,
  document: { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }), getElementById: () => null },
  window: {}, ImageData: function () {}, __msg: [], __drops: [],
};
ctx.globalThis = ctx;
ctx.localStorage = { _d: {}, getItem(k) { return this._d[k] === undefined ? null : this._d[k]; }, setItem(k, v) { this._d[k] = String(v); } };
vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('ERRO AO CARREGAR OS MÓDULOS:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }
// stubs de interface (a UI não entra nesta carga)
vm.runInContext(`
  toast = (m) => __msg.push(String(m));
  sfx = () => {};
  $ = () => null;
  dropItem = (id, n) => __drops.push([id, n === undefined ? 1 : n]);
  globalThis.__api = { ACH_LIST, ACH, ACH_CATS, ACH_RAR, ACH_KEY, IT, SWORDS, BXLIST, BX, NPC_DEF, G, World, WW, WH, TS, TD,
    achS, achClean, achMerge, achHTML, achCheck, achCount, achPct, achSee, achStat, achMax, achTick, achSave, achLoad,
    summonNpcItem, useConsumable, snapshotGame, buildWorldFile, parseWorldFile, crc32, newPlayer, genWorld, bxLoot, bossesLeft,
    BX_ACTS, dropItem };
`, ctx);
const A = ctx.__api, G = A.G;

const res = [];
const check = (name, ok, detail = '') => { res.push({ name, ok: !!ok }); console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };
const section = t => console.log('\n== ' + t + ' ==');

// ---------- 1. registro ----------
section('registro das conquistas');
const L = A.ACH_LIST;
check('mínimo de 300 conquistas (o pedido): ' + L.length, L.length >= 300);
const ids = new Set(), dup = [], badCat = [], badRar = [], empty = [];
for (const o of L) {
  if (ids.has(o.id)) dup.push(o.id); ids.add(o.id);
  if (!A.ACH_CATS.some(c => c.k === o.cat)) badCat.push(o.id);
  if (![1, 2, 3, 4].includes(o.r)) badRar.push(o.id);
  if (!o.n || !o.d || typeof o.p !== 'function') empty.push(o.id);
}
check('ids únicos (' + ids.size + ')', dup.length === 0, dup.slice(0, 5).join(','));
check('toda conquista tem categoria, raridade (1–4), nome, descrição e a função de progresso', badCat.length + badRar.length + empty.length === 0, badCat.concat(badRar, empty).slice(0, 5).join(','));
const byCat = {}; for (const o of L) byCat[o.cat] = (byCat[o.cat] || 0) + 1;
check('200 de espada, uma por espada do jogo', byCat.sw === 200 && L.filter(o => o.cat === 'sw').every(o => o.id.startsWith('sw_')), JSON.stringify(byCat));
check('94 de chefe (4 clássicos + 90 novos)', byCat.bx === 94 && L.filter(o => o.cat === 'bx').length === 4 + A.BXLIST.length);
let broken = 0, done0 = 0;
for (const o of L) {
  try { const r = o.p() || [0, 1]; if (!isFinite(r[0]) || !isFinite(r[1]) || r[1] <= 0) broken++; else if (r[0] >= r[1]) done0++; }
  catch (e) { broken++; console.log('     p() quebrou em', o.id, '-', e.message); }
}
check('nenhum progresso quebra com o jogo vazio e nenhuma conquista nasce concluída', broken === 0 && done0 === 0, 'quebradas ' + broken + ' · concluídas ' + done0);
check('o painel desenha todas as linhas em HTML', (() => { G.ach = { un: {}, seen: {}, bio: {}, lay: {}, st: {}, max: {} }; const h = A.achHTML(); return h.includes('Conquistas') && h.split('class="ach-row').length - 1 === L.length; })(), 'bytes ' + A.achHTML().length);

// ---------- 2. desbloqueio, estado e saneamento ----------
section('desbloqueio, estado e arquivo importado');
G.ach = { un: {}, seen: {}, bio: {}, lay: {}, st: {}, max: {} };
A.achSee('s001'); A.achSee('s002'); A.achStat('mined', 250); A.achMax('hit', 1200); A.achStat('deaths', 1);
const got = A.achCheck();
check('achCheck desbloqueia e conta (' + got + ' novas)', got > 0 && A.achCount() === got && A.achPct() > 0);
const raw = {
  un: { prog_first: 1, prog_sw50: 1, invalido: 1 }, seen: { s001: 1, lixo: 1 }, bio: { forest: 1, marte: 1 }, lay: { hell: 1, lua: 1 },
  st: { mined: 12, crafted: -3, bosses: 5, npc: { guide: 1, hacker: 1 }, modes: { creative: 1, outro: 1 }, talk: { nurse: 1, x: 1 } },
  max: { hit: 800, depth: 1e12 },
};
const c = A.achClean(raw);
check('achClean só aceita ids/itens/biomas/camadas que existem', c.un.prog_first === 1 && !c.un.invalido && c.seen.s001 === 1 && !c.seen.lixo && c.bio.forest === 1 && !c.bio.marte && c.lay.hell === 1 && !c.lay.lua, JSON.stringify({ un: c.un, seen: c.seen, bio: c.bio, lay: c.lay }));
check('achClean prende números à faixa (negativo vira 0, contador tem teto) e valida NPCs/modos', c.st.crafted === 0 && c.st.mined === 12 && c.st.npc.guide === 1 && !c.st.npc.hacker && c.st.modes.creative === 1 && !c.st.modes.outro && c.max.hit === 800 && c.max.depth === 1e9);
const merged = A.achMerge({ un: { prog_first: 1 }, seen: { s009: 1 }, st: { mined: 99 }, max: { hit: 500 } }, { un: {}, seen: {}, bio: {}, lay: {}, st: { mined: 150 }, max: { hit: 100 } });
check('achMerge une sem regredir (contador e recorde ficam no maior)', merged.un.prog_first === 1 && merged.seen.s009 === 1 && merged.st.mined === 150 && merged.max.hit === 500);
check('o perfil é gravado no navegador (localStorage)', (() => { A.achSave(); return !!ctx.localStorage.getItem(A.ACH_KEY); })());

// ---------- 3. itens de invocação de NPC ----------
section('itens de invocar NPC (só no Criativo)');
const wd = new A.World(A.WW, A.WH, 4242);
for (const _ of A.genWorld(wd, 4242)) { }
G.world = wd; G.P = A.newPlayer(); G.P.x = 3000; G.P.y = 200; G.state = 'play'; G.mode = 'creative';
G.flags = {}; G.stage = 0; G.day = 1; G.time = .2; G.t = 0; G.npcs = []; G.kills = 0; G.ui = {};
const items = ['npc_guide', 'npc_trader', 'npc_nurse', 'npc_smith'];
check('os 4 itens existem, são usáveis e apontam para um NPC do jogo', items.every(id => A.IT[id] && A.IT[id].use.startsWith('npc:') && A.NPC_DEF[A.IT[id].use.slice(4)]) && items.every(id => A.IT[id].creativeOnly === true));
const n1 = A.summonNpcItem('guide');
check('no Criativo o item invoca o NPC ao lado do jogador, sem casa', !!n1 && n1.free === true && n1.home === 'free' && Math.abs(n1.x - 3000) < 120 && G.npcs.length === 1, n1 && Math.round(n1.x));
check('invocar o mesmo NPC de novo não duplica', A.summonNpcItem('guide') === n1 && G.npcs.length === 1);
for (const id of items.slice(1)) A.summonNpcItem(id.slice(4));
check('os 4 tipos convivem (um de cada)', G.npcs.length === 4 && new Set(G.npcs.map(n => n.type)).size === 4);
const msg0 = ctx.__msg.length;
G.mode = 'adventure';
const before = G.npcs.length;
check('no Aventura o item não faz nada e explica o motivo', A.summonNpcItem('guide') === false && G.npcs.length === before && /Modo Criativo/.test(ctx.__msg[ctx.__msg.length - 1] || ''));
const inv0 = G.P.inv.map(s => s && s.id);
G.P.sel = 0; G.P.inv[0] = { id: 'npc_nurse', n: 3 }; G.P.inv[1] = null;
A.useConsumable(G.P, G.P.inv[0], A.IT.npc_nurse);
check('useConsumable no Aventura não consome o item', G.P.inv[0] && G.P.inv[0].n === 3, G.P.inv[0] && G.P.inv[0].n);
G.mode = 'creative'; G.npcs = []; G.P.inv[0] = { id: 'npc_nurse', n: 3 };
A.useConsumable(G.P, G.P.inv[0], A.IT.npc_nurse);
check('useConsumable no Criativo invoca o NPC', G.npcs.length === 1 && G.npcs[0].type === 'nurse' && G.npcs[0].free === true);
const st = A.achS();
check('as conquistas registram a invocação e a conversa', st.st.npc && st.st.npc.nurse === 1, JSON.stringify(st.st.npc));

// ---------- 4. save / arquivo exportado ----------
section('save e arquivo exportado');
G.mode = 'creative'; G.P.inv[0] = { id: 's001', n: 1 }; G.P.inv[1] = { id: 'pick_copper', n: 1 }; G.P.sel = 0;
const snap = A.snapshotGame();
check('o save leva as conquistas e marca o NPC invocado', !!snap.sv.ach && Object.keys(snap.sv.ach.un).length > 0 && snap.sv.npcs.some(n => n.free === 1), JSON.stringify(Object.keys(snap.sv.ach)));
const meta = { name: 'Teste', created: Date.now(), updated: Date.now(), seed: snap.sv.seed, mode: 'creative', playSec: 60, thumb: null };
const file = A.buildWorldFile(meta, snap.sv, { id: 'K7QF-3M9D', label: 'teste' });
const tamper = fn => { const f = JSON.parse(file), pl = JSON.parse(f.payload); fn(pl); f.payload = JSON.stringify(pl); f.check = A.crc32(f.payload); return JSON.stringify(f); };
const pr = A.parseWorldFile(file);
check('exportar e importar devolve as conquistas e o NPC invocado', !pr.error && Object.keys(pr.sv.ach.un).length === Object.keys(snap.sv.ach.un).length && pr.sv.npcs.filter(n => n.free === 1).length === snap.sv.npcs.filter(n => n.free === 1).length, pr.error || '');
check('conquista inventada no arquivo é descartada', (() => { const r = A.parseWorldFile(tamper(pl => { pl.sv.ach = { un: { hack: 1, prog_first: 1 }, seen: {} }; })); return !r.error && !r.sv.ach.un.hack && r.sv.ach.un.prog_first === 1; })());
check('NPC invocado passa pela validação; casa inválida continua barrada', (() => {
  const ok = A.parseWorldFile(tamper(pl => { pl.sv.npcs = [{ type: 'guide', home: 'free', free: 1, x: 900, y: 300 }]; }));
  const bad = A.parseWorldFile(tamper(pl => { pl.sv.npcs = [{ type: 'guide', home: 'abc', x: 900, y: 300 }]; }));
  return !ok.error && ok.sv.npcs[0].free === 1 && !!bad.error;
})());

// ---------- 5. o selo da espada Axioma ----------
section('Axioma: a espada 190 só cai com todos os chefes derrotados');
// flags do jogo como ficam no instante do drop: o Axioma ainda NÃO está marcado (ele é quem está morrendo)
const allFlags = (axiomaToo) => { const f = { slime: true, eye: true, guardian: true, colossus: true }; for (const d of A.BXLIST) f[d.id] = axiomaToo ? true : d.id !== 'axioma'; return f; };
const fake = () => ({ x: 1000, y: 1000, w: 86, h: 100, d: { bx: A.BX.axioma } });
const lootWith = flags => { G.flags = flags; ctx.__drops.length = 0; ctx.__msg.length = 0; A.bxLoot(fake()); return ctx.__drops.map(d => d[0]); };
G.flags = allFlags(false); delete G.flags.colossus;
check('faltando 1 chefe: a espada NÃO cai e o aviso diz quantos faltam', (() => {
  const d = lootWith(G.flags);
  return !d.includes('s190') && ctx.__msg.some(m => /faltam 1 chefe/.test(m));
})(), ctx.__msg.join(' | '));
G.flags = allFlags(false); G.flags.eye = false; G.flags.slime = false;
check('faltando 2 chefes: o aviso fala em "chefes" (plural)', (() => { const d = lootWith(G.flags); return !d.includes('s190') && ctx.__msg.some(m => /faltam 2 chefes/.test(m)); })(), ctx.__msg.join(' | '));
const full = lootWith(allFlags(false));
check('com os 94 chefes derrotados: a espada cai', full.includes('s190'), full.join(','));
G.flags = allFlags(true);
check('bossesLeft() = 0 quando todos caíram e o Axioma está marcado', A.bossesLeft() === 0, A.bossesLeft());
const other = lootWith(allFlags(false));
check('os outros chefes continuam dropando normalmente sem todos os chefes mortos', (() => {
  G.flags = {}; ctx.__drops.length = 0;
  const b5 = A.BXLIST.find(d => d.act === 5);
  const e2 = { x: 500, y: 500, w: 60, h: 60, d: { bx: b5 } };
  A.bxLoot(e2); return ctx.__drops.some(d => d[0] === b5.sword);
})(), other.join(','));

const fails = res.filter(r => !r.ok);
console.log('\nverificações: ' + res.length + ' | falhas: ' + fails.length);
if (fails.length) { for (const f of fails) console.log('  ✗ ' + f.name); process.exit(1); }
console.log('CONQUISTAS OK');
