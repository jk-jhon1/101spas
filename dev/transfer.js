'use strict';
// Mapa em arquivo + aparelho + proteção, SEM navegador (rápido): formato do arquivo, CRC-32, ida e volta exata, validação de arquivos
// adulterados (com o CRC refeito, para passar pela verificação de integridade), fuzz, lógica de importação (novo / atualiza / ignora),
// código do aparelho, rótulo por user-agent e proteção do armazenamento.        node dev/transfer.js
const fs = require('fs'), vm = require('vm'), path = require('path'), zlib = require('zlib');
const SRC = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(SRC).filter((f) => /^\d+.*\.js$/.test(f)).sort();
const use = files.filter((f) => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));   // mesmos módulos do validate.js (sem a UI 15_ui, o controle e o main): inclui 15b/15c/15e/15f, que não tocam o DOM na carga
let code = use.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { WW, WH, TS, T, TD, IT, WALL, BIO_NAMES, NPC_DEF, INV_N, World, G, newPlayer, rleEnc, b64, unb64, snapshotGame, crc32, rleScan, sanitizeSave, svToPlain,
  buildWorldFile, parseWorldFile, worldFileName, deviceLabel, newDeviceCode, DEV_RE, Device, Protect, Worlds, WORLD_FILE_MAX, cleanText };`;
const ctx = {
  console, setTimeout, clearTimeout, TextEncoder, atob, btoa, crypto: require('crypto').webcrypto, performance: { now: () => Date.now() },
  document: { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) }, window: {}, ImageData: function () {},
};
ctx.globalThis = ctx; vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('ERRO AO CARREGAR OS MÓDULOS:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }
const A = ctx.__api;
const { WW, WH, T, G } = A;

const res = [];
const check = (name, ok, detail = '') => { res.push({ name, ok: !!ok }); console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };

// ---------- um mundo pequeno e válido ----------
function makeSave(seed, tweak) {
  const wd = new A.World(WW, WH, seed);
  for (let x = 0; x < WW; x++) { wd.surf[x] = 100; wd.bio[x] = 2; for (let y = 100; y < WH; y++) wd.t[x + y * WW] = y >= WH - 3 ? T.bedrock : T.stone; }
  wd.spawn = { x: 5000, y: 1500 }; wd.chests.set(5000, [{ id: 's120', n: 1 }, null, { id: 'coin', n: 33 }]);
  const P = A.newPlayer(); P.x = 5000; P.y = 1560; P.crystals = 2; P.inv[0] = { id: 's001', n: 1, m: null }; P.inv[1] = { id: 'pick_copper', n: 1, m: null }; P.inv[2] = { id: 'coin', n: 25, m: null }; P.sel = 1;
  Object.assign(G, { world: wd, P, seed, mode: 'adventure', time: .4, day: 7, t: 3725, stage: 1, flags: { slime: true, eye: false, guardian: false, colossus: false }, kills: 12, npcs: [], opts: { god: false, noSpawn: false, showDps: false, freeCraft: false } });
  if (tweak) tweak(wd, P);
  return A.snapshotGame().sv;
}
const meta = (sv, o) => Object.assign({ id: 'wx', name: 'Aurora do Aço', seed: sv.seed, mode: sv.mode, created: 1700000000000, updated: 1700003600000, playSec: Math.round(sv.t), thumb: null, dev: 'K7QF-3M9D', devLabel: 'PC · Chrome (Windows)' }, o || {});
const DEVA = { id: 'K7QF-3M9D', label: 'PC · Chrome (Windows)' };
const same = (a, b) => a.length === b.length && Buffer.compare(Buffer.from(a.buffer, a.byteOffset, a.byteLength), Buffer.from(b.buffer, b.byteOffset, b.byteLength)) === 0;
const errOf = (txt) => { try { const r = A.parseWorldFile(txt); return r.error || null; } catch (e) { return 'EXCEÇÃO: ' + e.message; } };
// altera o conteúdo do arquivo E refaz o CRC (simula um arquivo adulterado de propósito: tem de ser barrado pela validação, não pelo CRC)
const tamper = (text, fn) => { const f = JSON.parse(text), pl = JSON.parse(f.payload); fn(pl, f); f.payload = JSON.stringify(pl); f.check = A.crc32(f.payload); return JSON.stringify(f); };

(async () => {
  console.log('== CRC-32 ==');
  check('vetor-padrão "123456789" = cbf43926', A.crc32('123456789') === 'cbf43926');
  check('texto vazio = 00000000', A.crc32('') === '00000000');
  if (typeof zlib.crc32 === 'function') {
    const samples = ['a', 'ação', 'Espadas Do Destino — 120 ⚔', 'x'.repeat(70000), JSON.stringify({ a: [1, 2, { b: 'é' }] })];
    check('igual ao zlib.crc32 do Node em ' + samples.length + ' textos (inclusive UTF-8)', samples.every((s) => A.crc32(s) === zlib.crc32(Buffer.from(s, 'utf8')).toString(16).padStart(8, '0')));
  }

  console.log('\n== ida e volta do arquivo ==');
  const sv = makeSave(4242), file = A.buildWorldFile(meta(sv), sv, DEVA), p = A.parseWorldFile(file);
  check('o arquivo é JSON legível, com o formato e a versão', (() => { const f = JSON.parse(file); return f.format === 'espadas-do-destino/mundo' && f.version === 1 && f.info.name === 'Aurora do Aço' && f.info.seed === 4242 && /^[0-9a-f]{8}$/.test(f.check); })());
  check('lê o arquivo sem erro', !p.error, p.error);
  const w0 = sv.w, w1 = p.sv.w;
  check('camadas t, wl, lq, lt, rev, surf e bio idênticas byte a byte', ['t', 'wl', 'lq', 'lt', 'rev', 'surf', 'bio'].every((k) => same(w0[k], w1[k])));
  check('jogador, inventário, equipamento, baús, chefes, progresso e spawn idênticos',
    JSON.stringify([p.sv.P.inv.map((s) => s && { id: s.id, n: s.n }), p.sv.P.crystals, p.sv.P.sel, p.sv.chests, p.sv.flags, p.sv.stage, p.sv.day, p.sv.kills, p.sv.t, p.sv.time, p.sv.spawn, p.sv.seed, p.sv.mode])
    === JSON.stringify([sv.P.inv.map((s) => s && { id: s.id, n: s.n }), sv.P.crystals, sv.P.sel, sv.chests, sv.flags, sv.stage, sv.day, sv.kills, sv.t, sv.time, sv.spawn, sv.seed, sv.mode]));
  check('nome, datas, aparelho de origem e tamanho vêm certos', p.name === 'Aurora do Aço' && p.created === 1700000000000 && p.updated === 1700003600000 && p.dev === 'K7QF-3M9D' && p.from.id === 'K7QF-3M9D' && p.from.label === 'PC · Chrome (Windows)' && p.bytes > 1000, p.bytes);
  const file2 = A.buildWorldFile(meta(p.sv), p.sv, DEVA);
  check('exportar o que acabou de ser importado dá o MESMO conteúdo (payload e CRC)', JSON.parse(file2).payload === JSON.parse(file).payload && JSON.parse(file2).check === JSON.parse(file).check);
  check('o arquivo cabe na ordem de grandeza esperada (<1 MB para um mundo simples)', file.length < 1e6, Math.round(file.length / 1024) + ' KB');
  const legacy = JSON.parse(JSON.stringify({ ...A.svToPlain(sv), v: 1 }));   // save antigo: já em base64 e v:1
  check('um registro no formato ANTIGO (v1, base64) também exporta como v2 válido', !A.parseWorldFile(A.buildWorldFile(meta(sv), legacy, DEVA)).error);

  console.log('\n== arquivos quebrados ou adulterados são recusados (nunca lançam exceção) ==');
  const flip = (s, i) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1);
  const cases = [
    ['vazio', ''], ['só espaços', '   \n '], ['não é JSON', 'isto não é json'], ['JSON de outra coisa', '{"a":1}'], ['array', '[1,2,3]'], ['null', 'null'],
    ['formato errado', JSON.stringify({ ...JSON.parse(file), format: 'outro' })], ['versão 0', JSON.stringify({ ...JSON.parse(file), version: 0 })],
    ['versão futura (2)', JSON.stringify({ ...JSON.parse(file), version: 2 })], ['sem payload', JSON.stringify({ ...JSON.parse(file), payload: undefined })],
    ['sem check', JSON.stringify({ ...JSON.parse(file), check: undefined })], ['CRC errado', JSON.stringify({ ...JSON.parse(file), check: '00000000' })],
    ['1 caractere trocado dentro dos dados', (() => { const f = JSON.parse(file); const i = f.payload.indexOf('"seed"') + 40; f.payload = flip(f.payload, i); return JSON.stringify(f); })()],
    ['arquivo cortado ao meio', file.slice(0, Math.floor(file.length / 2))], ['payload que não é JSON', (() => { const f = JSON.parse(file); f.payload = 'xx'; f.check = A.crc32('xx'); return JSON.stringify(f); })()],
    ['payload sem sv', (() => { const f = JSON.parse(file); f.payload = '{"meta":{}}'; f.check = A.crc32(f.payload); return JSON.stringify(f); })()],
  ];
  for (const [name, txt] of cases) { const e = errOf(txt); check('recusa: ' + name, e && !e.startsWith('EXCEÇÃO'), e); }
  check('recusa: texto gigante (> limite)', !!errOf('x'.repeat(A.WORLD_FILE_MAX + 1)));

  console.log('\n== adulterações com o CRC refeito: a validação do conteúdo barra ==');
  const N = WW * WH, rle = (fn) => { const a = new Uint8Array(N); fn(a); return A.b64(A.rleEnc(a)); };
  const T2 = [
    ['semente negativa', (pl) => { pl.sv.seed = -1; }], ['semente fracionária', (pl) => { pl.sv.seed = 1.5; }], ['semente > 32 bits', (pl) => { pl.sv.seed = 4294967296; }],
    ['modo desconhecido', (pl) => { pl.sv.mode = 'hacker'; }], ['hora fora de 0..1', (pl) => { pl.sv.time = 2; }], ['dia 0', (pl) => { pl.sv.day = 0; }], ['estágio 99', (pl) => { pl.sv.stage = 99; }],
    ['tempo de jogo NaN (null)', (pl) => { pl.sv.t = null; }], ['mortes negativas', (pl) => { pl.sv.kills = -5; }],
    ['bloco com id inexistente (200)', (pl) => { pl.sv.w.t = rle((a) => { a[5] = 200; }); }], ['parede inexistente (99)', (pl) => { pl.sv.w.wl = rle((a) => { a[5] = 99; }); }],
    ['líquido de tipo 7', (pl) => { pl.sv.w.lt = rle((a) => { a[5] = 7; }); }], ['mapa revelado com valor 2', (pl) => { pl.sv.w.rev = rle((a) => { a[5] = 2; }); }],
    ['camada com tamanho errado', (pl) => { pl.sv.w.t = A.b64(A.rleEnc(new Uint8Array(1000))); }], ['camada em base64 inválido', (pl) => { pl.sv.w.t = '@@@@'; }],
    ['camada que não é texto', (pl) => { pl.sv.w.t = 123; }], ['camada ausente', (pl) => { delete pl.sv.w.lq; }], ['fluxo RLE truncado', (pl) => { const q = pl.sv.w.t; pl.sv.w.t = q.slice(0, (q.length >> 3) << 2); }], ['fluxo RLE com número de comprimento sem fim', (pl) => { pl.sv.w.t = A.b64(new Uint8Array([0, 255, 255, 255])); }],
    ['relevo com tamanho errado', (pl) => { pl.sv.w.surf = A.b64(new Uint8Array(10)); }],
    ['relevo fora do mundo', (pl) => { const s = new Int16Array(WW).fill(100); s[3] = 9000; pl.sv.w.surf = A.b64(new Uint8Array(s.buffer)); }],
    ['bioma inexistente', (pl) => { const b = new Uint8Array(WW).fill(2); b[9] = 9; pl.sv.w.bio = A.b64(b); }], ['biomas com tamanho errado', (pl) => { pl.sv.w.bio = A.b64(new Uint8Array(5)); }],
    ['mapa de outro tamanho (aviso claro)', (pl) => { pl.meta.size = [2000, 600]; }],
    ['spawn fora do mundo', (pl) => { pl.sv.spawn = { x: 1e9, y: 0 }; }], ['spawn sem y', (pl) => { pl.sv.spawn = { x: 5 }; }],
    ['jogador fora do mundo', (pl) => { pl.sv.P.x = -50; }], ['vida NaN (null)', (pl) => { pl.sv.P.hp = null; }], ['cristais negativos', (pl) => { pl.sv.P.crystals = -1; }], ['slot da barra 40', (pl) => { pl.sv.P.sel = 40; }],
    ['inventário com 39 espaços', (pl) => { pl.sv.P.inv.pop(); }], ['inventário que não é lista', (pl) => { pl.sv.P.inv = {}; }],
    ['item inexistente no inventário', (pl) => { pl.sv.P.inv[3] = { id: 'item_que_nao_existe', n: 1 }; }], ['item "__proto__"', (pl) => { pl.sv.P.inv[3] = { id: '__proto__', n: 1 }; }],
    ['item "constructor"', (pl) => { pl.sv.P.inv[3] = { id: 'constructor', n: 1 }; }], ['quantidade 0', (pl) => { pl.sv.P.inv[3] = { id: 'coin', n: 0 }; }],
    ['quantidade fracionária', (pl) => { pl.sv.P.inv[3] = { id: 'coin', n: 1.5 }; }], ['quantidade gigante', (pl) => { pl.sv.P.inv[3] = { id: 'coin', n: 1e12 }; }],
    ['metadado de item enorme', (pl) => { pl.sv.P.inv[3] = { id: 'coin', n: 1, m: { x: 'y'.repeat(1000) } }; }], ['espaço que não é objeto', (pl) => { pl.sv.P.inv[3] = 'coin'; }],
    ['armadura que é uma espada', (pl) => { pl.sv.P.equip = { armor: { id: 's001', n: 1 }, acc: [null, null, null] }; }],
    ['acessório que é uma espada', (pl) => { pl.sv.P.equip = { armor: null, acc: [{ id: 's001', n: 1 }, null, null, null] }; }], ['acessórios: 2 em vez de 3 ou 4', (pl) => { pl.sv.P.equip = { armor: null, acc: [null, null] }; }], ['acessórios: 5 slots', (pl) => { pl.sv.P.equip = { armor: null, acc: [null, null, null, null, null] }; }], ['acessório com mecânica inexistente', (pl) => { pl.sv.P.equip = { armor: null, acc: [{ id: 'accx_brasa_anel', n: 1, m: 1 }, null, null, null] }; }],
    ['baú com posição inválida', (pl) => { pl.sv.chests = [[-1, []]]; }], ['baú com item inexistente', (pl) => { pl.sv.chests = [[5000, [{ id: 'zzz', n: 1 }]]]; }], ['baús que não é lista', (pl) => { pl.sv.chests = 'x'; }],
    ['NPC de tipo desconhecido', (pl) => { pl.sv.npcs = [{ type: 'dragao', home: '5,5', x: 1, y: 1 }]; }], ['NPC com casa inválida', (pl) => { pl.sv.npcs = [{ type: 'guide', home: 'abc', x: 1, y: 1 }]; }],
    ['NPC "toString"', (pl) => { pl.sv.npcs = [{ type: 'toString', home: '5,5', x: 1, y: 1 }]; }],
    ['cogumelos fora do mundo', (pl) => { pl.sv.mush = { x: 99999, y: 5 }; }], ['sv não é objeto', (pl) => { pl.sv = 5; }], ['sv com v=1', (pl) => { pl.sv.v = 1; }],
  ];
  let slipped = [];
  for (const [name, fn] of T2) { const e = errOf(tamper(file, fn)); if (!e || e.startsWith('EXCEÇÃO')) slipped.push(name + (e ? ' [' + e + ']' : ' [ACEITOU]')); }
  // save NOVO (4 acessórios das famílias) continua aceito
  { const ok4 = errOf(tamper(file, (pl) => { pl.sv.P.equip = { armor: { id: 'armx_brasa_0', n: 1 }, acc: [{ id: 'accx_brasa_anel', n: 1 }, { id: 'accx_geada_anel', n: 1 }, null, null] }; })); check('save com armadura e 4 slots de acessório é aceito', !ok4, ok4 || ''); }
  check(T2.length + ' adulterações diferentes: todas recusadas, nenhuma lança exceção', slipped.length === 0, slipped.join(' | '));
  check('o arquivo registra o tamanho do mundo e a recusa por tamanho explica os dois', JSON.parse(JSON.parse(file).payload).meta.size.join('x') === WW + 'x' + WH && /outro tamanho \(2000×600\).*\(1400×480\)/.test(errOf(tamper(file, (pl) => { pl.meta.size = [2000, 600]; }))));
  const ex = errOf(tamper(file, (pl) => { pl.sv.P.inv[3] = { id: 'zzz', n: 1 }; }));
  check('a mensagem de erro diz o que está errado', /item inválido no inventário/.test(ex), ex);

  console.log('\n== campos que são limpos, não recusados ==');
  const pt = A.parseWorldFile(tamper(file, (pl) => { pl.meta.thumb = 'x" onerror="window.__xss=1'; pl.meta.name = '  <b>Meu</b>\u0000\n  mundo\t'.repeat(5); pl.meta.dev = '<script>'; pl.meta.devLabel = 'ok\u0007' + 'z'.repeat(200); pl.meta.created = 'ontem'; pl.meta.updated = 1e20; }));
  check('miniatura que não é PNG em base64 é descartada (vira um <img src> na tela)', !pt.error && pt.thumb === null);
  check('nome: sem caracteres de controle, espaços reduzidos, no máximo 28 letras', !pt.error && pt.name.length <= 28 && !/[\u0000-\u001f]/.test(pt.name) && !/\s{2,}/.test(pt.name), pt.name);
  check('código de aparelho inválido vira vazio e o rótulo é limitado a 60', !pt.error && pt.dev === '' && pt.devLabel.length <= 60 && !/[\u0007]/.test(pt.devLabel));
  check('datas absurdas (texto, futuro distante) viram "agora"', !pt.error && pt.created <= Date.now() && pt.updated <= Date.now() + 864e5 + 5);
  const okThumb = 'data:image/png;base64,iVBORw0KGgo=';
  check('miniatura PNG válida é mantida', A.parseWorldFile(tamper(file, (pl) => { pl.meta.thumb = okThumb; })).thumb === okThumb);
  const extra = A.parseWorldFile(tamper(file, (pl) => { pl.sv.evil = { x: 1 }; pl.sv.opts = { god: true, hack: true }; pl.sv.flags = { slime: true, hack: true }; pl.sv.P.evil = 1; }));
  check('campos desconhecidos são descartados; só as opções e chefes conhecidos passam', !extra.error && !('evil' in extra.sv) && !('evil' in extra.sv.P) && !('hack' in extra.sv.opts) && extra.sv.opts.god === true && !('hack' in extra.sv.flags));

  console.log('\n== fuzz: 400 arquivos com 1 a 3 caracteres trocados em posições aleatórias ==');
  let s = 99; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; let thrown = 0, accepted = 0, crcCaught = 0;
  for (let k = 0; k < 400; k++) {
    let t = file; const n = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) { const i = Math.floor(rnd() * t.length); t = t.slice(0, i) + String.fromCharCode(33 + Math.floor(rnd() * 90)) + t.slice(i + 1); }
    try { const r = A.parseWorldFile(t); if (r.error) { if (/integridade/.test(r.error)) crcCaught++; } else accepted++; } catch (e) { thrown++; }
  }
  check('nenhuma exceção em 400 arquivos corrompidos', thrown === 0, thrown);
  check('quase todos barrados pela verificação de integridade (os aceitos só mudaram campos informativos fora dos dados)', crcCaught >= 300, `${crcCaught} barrados pelo CRC, ${accepted} aceitos`);

  console.log('\n== importar para a biblioteca (memória) ==');
  const W = A.Worlds; await W.init();
  check('sem IndexedDB o teste roda no modo memória', W.mode === 'memory', W.mode);
  const mk = (seed, o) => { const v = makeSave(seed, o && o.tweak); return A.buildWorldFile(meta(v, o && o.meta), v, (o && o.dev) || DEVA); };
  let r = await W.importText(mk(111));
  check('mundo novo é adicionado, com nome, de onde veio e a semente registrada', r.ok && r.action === 'added' && W.list.length === 1 && W.used.has(111) && /PC · Chrome/.test(r.from) && /K7QF-3M9D/.test(r.from), JSON.stringify(r));
  const m1 = W.list[0];
  check('o mundo da biblioteca ficou marcado como importado, com a origem e dados completos', m1.imported === true && m1.importedFrom.id === 'K7QF-3M9D' && m1.layoutKey && m1.runs && m1.bytes > 1000 && m1.seed === 111 && Object.prototype.toString.call((await W._data(m1.id)).sv.w.t) === '[object Uint8Array]', JSON.stringify({ imp: m1.imported, from: m1.importedFrom, key: m1.layoutKey, runs: !!m1.runs, bytes: m1.bytes }));
  r = await W.importText(mk(111));
  check('importar o MESMO arquivo de novo: ignorado, nada muda', r.action === 'skipped' && r.reason === 'same' && W.list.length === 1);
  r = await W.importText(mk(111, { meta: { updated: 1700000000001 - 5e6 } }));
  check('arquivo mais VELHO do mesmo mundo: ignorado', r.action === 'skipped' && r.reason === 'same');
  const newer = (o) => mk(111, { meta: { updated: 1700003600000 + 5000 }, tweak: (wd, P) => { G.t = o.sec; P.inv[5] = { id: 'iron_bar', n: 9, m: null }; } });
  r = await W.importText(newer({ sec: 9000 }));
  const idBefore = m1.id;
  check('arquivo mais NOVO e com mais jogo: atualiza o mesmo mundo (mesmo id e nome), sem duplicar',
    r.ok && r.action === 'updated' && W.list.length === 1 && W.list[0].id === idBefore && W.list[0].playSec === 9000 && (await W._data(idBefore)).sv.P.inv[5].id === 'iron_bar', JSON.stringify(r));
  r = await W.importText(mk(111, { meta: { updated: 1700003600000 + 99999 }, tweak: () => { G.t = 100; } }));
  check('arquivo mais novo, porém com MENOS tempo de jogo (os dois evoluíram separados): ignorado com explicação, o progresso daqui é preservado',
    r.action === 'skipped' && r.reason === 'diverged' && r.localSec === 9000 && r.fileSec === 100 && W.list[0].playSec === 9000, JSON.stringify(r));
  r = await W.importText(mk(111, { meta: { created: 1600000000000, updated: 1700003600000 + 99999999 } }));
  check('mesma semente mas outro mundo (data de criação diferente): recusado, nunca vira dois mundos iguais', r.action === 'error' && /mesmo terreno/.test(r.reason) && W.list.length === 1, r.reason);
  r = await W.importText(mk(222, { meta: { name: W.list[0].name } }));
  check('nome repetido ganha numeral romano (nunca dois mundos com o mesmo nome)', r.action === 'added' && W.list.length === 2 && new Set(W.list.map((w) => w.name.toLowerCase())).size === 2 && /\sII$/.test(W.list.find((w) => w.seed === 222).name), W.list.map((w) => w.name).join(' / '));
  r = await W.importText('lixo');
  check('arquivo ruim: devolve erro claro e a biblioteca não muda', r.action === 'error' && /JSON/.test(r.reason) && W.list.length === 2);
  await W.remove(W.list.find((w) => w.seed === 222).id);   // exclui o mundo 222: a semente continua em "used"
  r = await W.importText(mk(222));
  check('importar um mundo cuja semente já foi de um mundo excluído funciona (a semente continua registrada)', r.action === 'added' && W.used.has(222));
  const fl = await W.exportFile(W.list[0].id);
  check('exportFile gera nome seguro (sem acento/espaço) e um arquivo que o próprio jogo lê de volta', /^espadas-[a-z0-9-]+-\d{8}-\d{4}\.json$/.test(fl.name) && !A.parseWorldFile(fl.text).error, fl.name);
  const acc = A.worldFileName({ name: 'Éter dos Ventos çã!', updated: Date.UTC(2026, 9, 8, 15, 30) });
  check('nome do arquivo: sem acentos, minúsculas, com data e hora', /^espadas-eter-dos-ventos-ca-20261008-\d{4}\.json$/.test(acc), acc);
  let thrownExp = null; try { await W.exportFile('nao-existe'); } catch (e) { thrownExp = e.message; }
  check('exportar um mundo que não existe dá erro claro', /não encontrado/.test(thrownExp || ''), thrownExp);

  console.log('\n== código do aparelho ==');
  const codes = new Set(); let badCode = 0; for (let i = 0; i < 2000; i++) { const c = A.newDeviceCode(); codes.add(c); if (!A.DEV_RE.test(c)) badCode++; }
  check('2000 códigos: todos no formato XXXX-XXXX (sem I, O, 0, 1) e sem repetição', badCode === 0 && codes.size === 2000, `${codes.size} únicos, ${badCode} fora do formato`);
  const mkLS = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };
  const newDev = () => vm.runInContext('(() => { const d = Object.assign({}, Device); d.id = ""; return d; })()', ctx);   // cópia limpa (o objeto real guarda o estado)
  const initFresh = () => { const real = A.Device; const keep = { id: real.id, born: real.born, label: real.label, persistent: real.persistent }; real.id = ''; const out = real.init(); const snap = { id: out.id, label: out.label, persistent: out.persistent }; Object.assign(real, keep); return snap; };
  ctx.localStorage = mkLS(); const d1 = initFresh(), d2 = initFresh();
  check('o código é gravado no aparelho e é o mesmo na próxima abertura', d1.id === d2.id && d1.persistent === true && JSON.parse(ctx.localStorage.getItem('espadas120_device')).id === d1.id, d1.id);
  ctx.localStorage = mkLS(); ctx.localStorage.setItem('espadas120_device', '{lixo'); const d3 = initFresh();
  check('registro corrompido no aparelho: gera um código novo e válido', A.DEV_RE.test(d3.id) && d3.persistent === true);
  ctx.localStorage = mkLS(); ctx.localStorage.setItem('espadas120_device', JSON.stringify({ id: '<script>', born: 1 })); const d4 = initFresh();
  check('código gravado com formato inválido é substituído', A.DEV_RE.test(d4.id) && d4.id !== '<script>');
  ctx.localStorage = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } }; const d5 = initFresh();
  check('sem armazenamento (iframe com sandbox): gera um código mesmo assim, marcado como temporário', A.DEV_RE.test(d5.id) && d5.persistent === false);
  ctx.localStorage = mkLS(); const d6 = initFresh(), d7 = initFresh(); delete ctx.localStorage;
  check('o código NÃO depende de IP nem de rede (só de sorteio local)', d6.id === d7.id && !/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(d6.id));

  console.log('\n== rótulo do aparelho (user-agent) ==');
  const UA = [
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 0, 'PC · Chrome (Windows)'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0', 0, 'PC · Edge (Windows)'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 0, 'PC · Firefox (Linux)'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', 0, 'PC · Safari (macOS)'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 5, 'Celular · Safari (iOS)'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', 5, 'Tablet · Safari (iOS)'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', 5, 'Celular · Chrome (Android)'],
    ['Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 5, 'Tablet · Chrome (Android)'],
    ['Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36', 5, 'Celular · Samsung Internet (Android)'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1', 5, 'Celular · Chrome (iOS)'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0', 0, 'PC · Opera (Windows)'],
    ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 0, 'PC · Chrome (ChromeOS)'],
  ];
  const bad = [];
  for (const [ua, tp, want] of UA) { ctx.navigator = { userAgent: ua, maxTouchPoints: tp }; const got = A.deviceLabel(); if (got !== want) bad.push(`${want} ≠ ${got}`); }
  check(UA.length + ' navegadores/aparelhos reconhecidos (PC, celular, tablet, iPadOS que se diz Mac)', bad.length === 0, bad.join(' | '));
  delete ctx.navigator; check('sem navigator (Node): rótulo genérico, sem erro', A.deviceLabel() === 'Aparelho');

  console.log('\n== proteção do armazenamento ==');
  const stor = (o) => { const st = { calls: 0 }; ctx.navigator = { userAgent: o.ua || 'Chrome/130', storage: {} }; if (o.persisted !== undefined) ctx.navigator.storage.persisted = async () => { if (o.throwP) throw new Error('x'); return st.p !== undefined ? st.p : o.persisted; }; if (o.persist) ctx.navigator.storage.persist = async () => { st.calls++; if (o.throwR) throw new Error('x'); st.p = o.grant; return o.grant; }; return st; };
  let st = stor({ persisted: true, persist: true, grant: true }); check('status "on" quando já está protegido', (await A.Protect.status()) === 'on');
  check('já protegido: o pedido devolve true SEM pedir de novo', (await A.Protect.request()) === true && st.calls === 0);
  st = stor({ persisted: false, persist: true, grant: true }); check('status "off" quando não está protegido', (await A.Protect.status()) === 'off');
  check('pedido concedido: true, e o status passa a "on"', (await A.Protect.request()) === true && st.calls === 1 && (await A.Protect.status()) === 'on');
  st = stor({ persisted: false, persist: true, grant: false }); check('pedido negado pelo navegador: false (e continua "off")', (await A.Protect.request()) === false && (await A.Protect.status()) === 'off');
  stor({ persisted: false, persist: true, throwR: true }); check('o navegador lança erro no pedido: false, sem exceção', (await A.Protect.request()) === false);
  stor({ persisted: true, throwP: true, persist: true }); check('o navegador lança erro ao consultar: status "na", sem exceção', (await A.Protect.status()) === 'na');
  ctx.navigator = { userAgent: 'x', storage: {} }; check('navegador sem a API: status "na" e pedido false', (await A.Protect.status()) === 'na' && (await A.Protect.request()) === false);
  delete ctx.navigator; check('sem navigator (Node): "na", sem erro', (await A.Protect.status()) === 'na' && A.Protect.can() === false);
  ctx.localStorage = mkLS(); st = stor({ persisted: false, persist: true, grant: true }); await A.Protect.autoAsk(); await A.Protect.autoAsk(); await A.Protect.autoAsk();
  check('pedido automático: UMA vez por aparelho (3 chamadas, 1 pedido)', st.calls === 1, st.calls);
  ctx.localStorage = mkLS(); st = stor({ persisted: false, persist: true, grant: true, ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0' }); await A.Protect.autoAsk();
  check('no Firefox o pedido automático não acontece (ele abriria um aviso sem contexto): só pelo botão', st.calls === 0);
  ctx.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } }; st = stor({ persisted: false, persist: true, grant: true }); await A.Protect.autoAsk();
  check('sem como lembrar que já pediu (localStorage bloqueado): não pede', st.calls === 0);

  const bad2 = res.filter((x) => !x.ok);
  console.log(`\nverificações: ${res.length} | falhas: ${bad2.length}`);
  for (const x of bad2) console.log('  FALHOU:', x.name);
  process.exitCode = bad2.length ? 1 : 0;
})().catch((e) => { console.error('ERRO NO TESTE:', e.stack); process.exitCode = 2; });
