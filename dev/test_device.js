'use strict';
// Este aparelho (código aleatório, não o IP), proteção do armazenamento e mapa em arquivo (exportar / importar), no navegador de verdade.
// Vários "aparelhos" = contextos separados (cada um com o seu próprio armazenamento): exporta num, importa no outro, atualiza por arquivo,
// protege contra arquivos ruins e maliciosos, celular, Firefox, sem IndexedDB.        node dev/test_device.js
const fs = require('fs'), os = require('os'), path = require('path');
const { launch, INDEX_URL, run, waitPlay, startWorld, collectErrors, fmtDetail } = require('./lib');

const res = [];
function check(name, ok, detail = '') {
  res.push({ name, ok: !!ok, detail });
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + fmtDetail(detail) : ''));
}
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'espadas-dev-'));
let nTmp = 0;
const writeTmp = (name, text) => { const p = path.join(TMP, name); fs.writeFileSync(p, text); return p; };

// ---------- código que roda dentro da página ----------
const MARK = () => {   // marca única do mundo: bloco de ouro e moedas
  const wd = G.world, sx = Math.round(wd.spawn.x / TS), mx = sx + 3, my = wd.surf[mx] - 2; G.opts.noSpawn = true;
  wd.set(mx, my, T.gold, true); invAdd('coin', 7);
  return { seed: G.seed, name: G.worldName, id: G.worldId, mode: G.mode, mx, my, spawn: wd.spawn, key: wd.layoutKey() };
};
const ADVANCE = ([mx, my, sec]) => { G.t += sec; G.world.set(mx + 2, my, T.gold, true); invAdd('coin', 3); G.opts.noSpawn = true; };   // "joga mais": tempo, um bloco novo e moedas
const RECSIG = async (id) => {   // assinatura do mundo como está GUARDADO (todas as camadas e tudo mais)
  const rec = await Worlds._data(id), sv = rec.sv, w = sv.w, fnv = (a) => { let h = 2166136261; for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a[i], 16777619); return h >>> 0; };
  const rest = Object.assign({}, sv, { w: undefined });
  return [fnv(w.t), fnv(w.wl), fnv(w.lq), fnv(w.lt), fnv(w.rev), fnv(new Uint8Array(w.surf.buffer, w.surf.byteOffset, w.surf.byteLength)), fnv(w.bio), JSON.stringify(rest)].join('/');
};
const STUB = (cfg) => {   // simula a API de proteção do navegador (persist / persisted) e conta os pedidos
  const real = navigator.storage, st = (window.__prot = { persisted: !!cfg.persisted, grant: cfg.grant !== false, calls: 0 });
  const fake = { estimate: () => real.estimate() };
  if (cfg.api !== false) { fake.persisted = async () => st.persisted; fake.persist = async () => { st.calls++; if (st.grant) st.persisted = true; return st.grant; }; }
  Object.defineProperty(navigator, 'storage', { value: fake, configurable: true });
};
const NOIDB = () => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); };

run(async () => {
  const b = await launch(), allErrs = [];
  const newDev = async (opts = {}, init, arg) => {   // um "aparelho": contexto novo = armazenamento novo
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true, ...opts });
    if (init) await ctx.addInitScript(init, arg);
    const pg = await ctx.newPage(); allErrs.push(collectErrors(pg)); await pg.goto(INDEX_URL); await pg.waitForTimeout(900);
    return { ctx, pg };
  };
  const toTitle = async (pg) => { await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); await pg.click('#p-menu'); await pg.waitForFunction('G.state === "title"', null, { timeout: 15000 }); await pg.waitForTimeout(250); };
  const openWorlds = async (pg) => { if (await pg.evaluate("document.getElementById('worlds').classList.contains('hidden')")) { await pg.click('#btn-worlds'); await pg.waitForTimeout(300); } };
  const msgNow = (pg) => pg.evaluate("({ kind: document.getElementById('worlds-msg').className, lines: [...document.querySelectorAll('#worlds-msg div')].map(d => d.textContent) })");
  const hideMsg = (pg) => pg.evaluate("document.getElementById('worlds-msg').className = 'hidden'");
  const waitMsg = (pg) => pg.waitForFunction("!document.getElementById('worlds-msg').classList.contains('hidden')", null, { timeout: 20000 });
  const importFiles = async (pg, paths) => { await openWorlds(pg); await hideMsg(pg); await pg.setInputFiles('#world-import', paths); await waitMsg(pg); await pg.waitForTimeout(150); return msgNow(pg); };
  const exportCard = async (pg, id) => {   // clica em "Exportar" do cartão do mundo `id`; devolve o arquivo baixado e a mensagem
    await openWorlds(pg); await hideMsg(pg);
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click(`.wcard[data-id="${id}"] [data-act="exp"]`)]);
    const p = path.join(TMP, 'dl_' + (++nTmp) + '.json'); await dl.saveAs(p); await waitMsg(pg);
    return { name: dl.suggestedFilename(), text: fs.readFileSync(p, 'utf8'), path: p, msg: await msgNow(pg) };
  };
  const playWorld = async (pg, id) => { await openWorlds(pg); await pg.click(`.wcard[data-id="${id}"] [data-act="play"]`); await waitPlay(pg); await pg.waitForTimeout(500); };
  const retamper = async (pg, text, fn) => {   // altera o conteúdo do arquivo e refaz o CRC (arquivo adulterado de propósito)
    const f = JSON.parse(text), pl = JSON.parse(f.payload); fn(pl, f); f.payload = JSON.stringify(pl);
    f.check = await pg.evaluate((s) => crc32(s), f.payload); return JSON.stringify(f);
  };

  // ============ A: o aparelho principal (PC), com proteção simulada que concede ============
  console.log('== aparelho A (PC): código, proteção automática e título ==');
  const A = await newDev({}, STUB, { persisted: false, grant: true }), pa = A.pg;
  const codeA = await pa.evaluate('Device.init().id'), labelA = await pa.evaluate('Device.label');
  check('o aparelho ganha um código aleatório XXXX-XXXX (nada de IP) e um rótulo legível', /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(codeA) && /^PC · Chrome/.test(labelA), codeA + ' / ' + labelA);
  check('o código fica gravado no aparelho (localStorage)', JSON.parse(await pa.evaluate("localStorage.getItem('espadas120_device')")).id === codeA);
  check('antes de salvar nada, o pedido de proteção ainda não foi feito', (await pa.evaluate('window.__prot.calls')) === 0);
  await startWorld(pa, 7001, 'btn-adv'); await pa.waitForTimeout(500);
  const m1 = await pa.evaluate(MARK);
  await pa.waitForFunction('window.__prot.calls >= 1', null, { timeout: 8000 });
  check('depois do 1º salvamento, o jogo pede UMA vez ao navegador para proteger os mapas', (await pa.evaluate('window.__prot.calls')) === 1 && (await pa.evaluate("localStorage.getItem('espadas120_prot_asked')")) === '1');
  await toTitle(pa);
  await startWorld(pa, 7002, 'btn-cre'); await pa.waitForTimeout(500);
  const m2 = await pa.evaluate(MARK); await toTitle(pa);
  check('com o 2º mundo salvo, não pede de novo (continua 1 pedido)', (await pa.evaluate('window.__prot.calls')) === 1);
  check('o título diz que os mundos estão salvos NESTE APARELHO', (await pa.evaluate("document.getElementById('btn-worlds-sub').textContent")) === '2 mundos salvos neste aparelho', await pa.evaluate("document.getElementById('btn-worlds-sub').textContent"));
  const mA1 = await pa.evaluate((id) => Worlds.list.find((w) => w.id === id), m1.id);
  check('cada mundo guarda de que aparelho veio (o código, não o IP)', mA1.dev === codeA && mA1.devLabel === labelA && !mA1.imported, JSON.stringify({ dev: mA1.dev, imp: mA1.imported }));

  console.log('\n== tela Meus Mundos: este aparelho e proteção ==');
  await pa.click('#btn-worlds'); await pa.waitForTimeout(400);
  const ui = await pa.evaluate(() => ({ code: document.getElementById('dev-code').textContent, label: document.getElementById('dev-label').textContent, prot: document.getElementById('dev-prot').textContent, cls: document.getElementById('dev-prot').className,
    btnProtectHidden: document.getElementById('btn-protect').classList.contains('hidden'), info: document.getElementById('worlds-info').textContent, inp: { multiple: document.getElementById('world-import').multiple, accept: document.getElementById('world-import').accept },
    exp: document.querySelectorAll('.wcard [data-act="exp"]').length }));
  check('a tela mostra o rótulo e o código deste aparelho', ui.code === codeA && ui.label === labelA, ui.code + ' / ' + ui.label);
  check('proteção concedida: "ativa" em verde e sem o botão "Proteger agora"', /Proteção permanente ativa/.test(ui.prot) && ui.cls === 'ok' && ui.btnProtectHidden, ui.prot);
  check('o rodapé diz "Salvos neste aparelho"', /^Salvos neste aparelho/.test(ui.info), ui.info);
  check('cada cartão tem o botão Exportar e o seletor aceita vários arquivos .json', ui.exp === 2 && ui.inp.multiple === true && /\.json/.test(ui.inp.accept), JSON.stringify(ui));

  console.log('\n== exportar ==');
  const before = await pa.evaluate(() => Worlds.list.map((w) => [w.id, w.updated]));
  const ex1 = await exportCard(pa, m1.id);
  check('baixa um arquivo com nome seguro: espadas-<nome>-<data>-<hora>.json', /^espadas-[a-z0-9-]+-\d{8}-\d{4}\.json$/.test(ex1.name), ex1.name);
  const f1 = JSON.parse(ex1.text);
  check('o arquivo é JSON legível: formato, versão, semente, modo e o aparelho de origem', f1.format === 'espadas-do-destino/mundo' && f1.version === 1 && f1.info.seed === 7001 && f1.info.mode === 'adventure' && f1.device.id === codeA && f1.device.label === labelA && /^[0-9a-f]{8}$/.test(f1.check), JSON.stringify(f1.info));
  const pr = await pa.evaluate((t) => { const r = parseWorldFile(t); return r.error ? { error: r.error } : { name: r.name, seed: r.sv.seed, bytes: r.bytes }; }, ex1.text);
  check('o próprio jogo lê o arquivo de volta sem erro', !pr.error && pr.seed === 7001 && pr.name === m1.name, JSON.stringify(pr));
  check('mensagem na tela: nome do arquivo e tamanho, em verde', ex1.msg.kind === 'ok' && ex1.msg.lines[0].includes(ex1.name) && /gerado/.test(ex1.msg.lines[0]), ex1.msg.lines[0]);
  check('exportar não altera a biblioteca (mesmos mundos, mesmas datas)', JSON.stringify(await pa.evaluate(() => Worlds.list.map((w) => [w.id, w.updated]))) === JSON.stringify(before));
  const ex1b = await exportCard(pa, m1.id);
  check('exportar duas vezes a mesma versão dá o mesmo conteúdo (mesmo CRC)', JSON.parse(ex1b.text).check === f1.check);
  const ex2 = await exportCard(pa, m2.id), f2 = JSON.parse(ex2.text);
  check('o mundo criativo também exporta, com a sua semente', f2.info.seed === 7002 && f2.info.mode === 'creative');
  console.log('   tamanho do arquivo: ' + Math.round(ex1.text.length / 1024) + ' KB (aventura), ' + Math.round(ex2.text.length / 1024) + ' KB (criativo)');
  check('arquivo de tamanho razoável (menos de 1 MB)', ex1.text.length < 1e6 && ex2.text.length < 1e6);
  const sigA = await pa.evaluate(RECSIG, m1.id);

  console.log('\n== reabrir a página: o código é o mesmo e o pedido não se repete ==');
  await pa.reload(); await pa.waitForTimeout(900);
  check('mesmo código depois de recarregar', (await pa.evaluate('Device.init().id')) === codeA);
  check('o aviso "já pedi a proteção" foi lembrado', (await pa.evaluate("localStorage.getItem('espadas120_prot_asked')")) === '1');

  // ============ B: outro aparelho (armazenamento vazio): importa o arquivo do A ============
  console.log('\n== aparelho B (outro PC, vazio): importar o arquivo do A ==');
  const B = await newDev({}, STUB, { persisted: false, grant: true }), pb = B.pg;
  const codeB = await pb.evaluate('Device.init().id');
  check('o aparelho B tem um código DIFERENTE do A', /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(codeB) && codeB !== codeA, codeA + ' ≠ ' + codeB);
  check('B começa sem mundos e sem "Continuar"', (await pb.evaluate('Worlds.list.length')) === 0 && (await pb.evaluate("document.getElementById('btn-load').classList.contains('hidden')")));
  const imp1 = await importFiles(pb, ex1.path);
  check('importa: mensagem em verde com o nome do mundo e de onde veio (rótulo + código do A)', imp1.kind === 'ok' && imp1.lines.length === 1 && imp1.lines[0].startsWith('Importado: "' + m1.name + '"') && imp1.lines[0].includes(labelA) && imp1.lines[0].includes(codeA), imp1.lines.join(' | '));
  const mB = await pb.evaluate(() => Worlds.list.map((w) => ({ id: w.id, name: w.name, seed: w.seed, imported: w.imported, from: w.importedFrom, dev: w.dev, thumb: !!w.thumb })));
  check('o mundo entrou na biblioteca do B: mesmo nome e semente, marcado como importado do A', mB.length === 1 && mB[0].name === m1.name && mB[0].seed === 7001 && mB[0].imported === true && mB[0].from.id === codeA && mB[0].dev === codeA, JSON.stringify(mB[0]));
  check('...com um id NOVO, gerado no B (não reaproveita o id do A)', mB[0].id !== m1.id && /^w[0-9a-z]+$/.test(mB[0].id), mB[0].id + ' ≠ ' + m1.id);
  const card = await pb.evaluate(() => ({ n: document.querySelectorAll('.wcard').length, date: document.querySelector('.wdate').textContent, sub: document.getElementById('btn-worlds-sub').textContent, loadHidden: document.getElementById('btn-load').classList.contains('hidden') }));
  check('o cartão diz "importado de PC · Chrome… (código do A)"', card.n === 1 && card.date.includes('importado de ' + labelA + ' (' + codeA + ')'), card.date);
  check('o título mostra "1 mundo salvo neste aparelho" e o botão Continuar', card.sub === '1 mundo salvo neste aparelho' && !card.loadHidden, card.sub);
  const sigB = await pb.evaluate(RECSIG, mB[0].id);
  check('o que foi guardado no B é IDÊNTICO ao do A (todas as camadas, inventário, baús, progresso)', sigA === sigB, sigA === sigB ? '' : 'assinaturas diferentes');
  const seedReg = await pb.evaluate(async () => { const db = await new Promise((r, j) => { const q = indexedDB.open('espadas120'); q.onsuccess = () => r(q.result); q.onerror = j; }); const v = await new Promise((r, j) => { const q = db.transaction(['seeds']).objectStore('seeds').get(7001); q.onsuccess = () => r(q.result); q.onerror = j; }); db.close(); return !!v; });
  check('a semente do mundo importado foi registrada no banco (nunca será sorteada de novo)', seedReg === true && (await pb.evaluate('Worlds.used.has(7001)')));
  const draws = await pb.evaluate(async () => { let hit = 0; for (let i = 0; i < 120; i++) { const a = await Worlds.allocate('adventure'); if (a.seed === 7001) hit++; } return hit; });
  check('120 sorteios de mundos novos no B: nenhum repete a semente do mundo importado', draws === 0, draws);
  await playWorld(pb, mB[0].id);
  const back = await pb.evaluate(([mx, my]) => ({ seed: G.seed, name: G.worldName, mode: G.mode, gold: TD[G.world.get(mx, my)].k, coins: invCount('coin'), spawn: G.world.spawn, key: G.world.layoutKey() }), [m1.mx, m1.my]);
  check('jogar o mundo importado: semente, nome, modo, bloco de ouro, moedas, ponto de partida e biomas iguais aos do A',
    back.seed === 7001 && back.name === m1.name && back.mode === 'adventure' && back.gold === 'gold' && back.coins >= 7 && back.spawn.x === m1.spawn.x && back.spawn.y === m1.spawn.y && back.key === m1.key, JSON.stringify(back));

  console.log('\n== levar o progresso de volta: B joga mais e exporta; A atualiza ==');
  await pb.evaluate(ADVANCE, [m1.mx, m1.my, 600]); await toTitle(pb);   // sair do jogo salva
  const mBflag = await pb.evaluate(() => { const w = Worlds.list[0]; return { imported: w.imported, from: w.importedFrom && w.importedFrom.id, play: w.playSec }; });
  check('salvar de novo no B mantém a marca de importado e a origem', mBflag.imported === true && mBflag.from === codeA && mBflag.play >= 600, JSON.stringify(mBflag));
  const exB1 = await exportCard(pb, mB[0].id), fB1 = JSON.parse(exB1.text);
  check('o arquivo exportado do B diz que veio do B', fB1.device.id === codeB && fB1.info.seed === 7001);
  const impA = await importFiles(pa, exB1.path);
  const aAfter = await pa.evaluate(([id, mx, my]) => { const w = Worlds.list.find((x) => x.id === id); return { n: Worlds.list.length, play: w && w.playSec, imported: !!(w && w.imported), name: w && w.name }; }, [m1.id, m1.mx, m1.my]);
  check('no A: "Atualizado" (o arquivo era mais novo e tinha mais jogo), sem duplicar o mundo', impA.kind === 'ok' && /^Atualizado: "/.test(impA.lines[0]) && aAfter.n === 2 && aAfter.play >= 600, impA.lines.join(' | '));
  check('o mundo do A continua sendo do A (não vira "importado") e mantém o nome', aAfter.imported === false && aAfter.name === m1.name);
  await playWorld(pa, m1.id);
  const upd = await pa.evaluate(([mx, my]) => ({ gold: TD[G.world.get(mx, my)].k, gold2: TD[G.world.get(mx + 2, my)].k, coins: invCount('coin') }), [m1.mx, m1.my]);
  check('abrindo no A: o bloco novo e as moedas que o B ganhou estão lá', upd.gold === 'gold' && upd.gold2 === 'gold' && upd.coins >= 10, JSON.stringify(upd));
  await toTitle(pa);
  const impOld = await importFiles(pa, ex1.path);
  check('importar o arquivo ANTIGO no A: ignorado ("já está neste aparelho em versão igual ou mais nova")', /já está neste aparelho em versão igual ou mais nova/.test(impOld.lines[0]) && (await pa.evaluate('Worlds.list.length')) === 2, impOld.lines.join(' | '));

  console.log('\n== os dois aparelhos evoluíram separados: nunca perder o progresso maior ==');
  await playWorld(pa, m1.id); await pa.evaluate(ADVANCE, [m1.mx, m1.my, 1000]); await toTitle(pa);   // A: +1000 s
  const playA = await pa.evaluate((id) => Worlds.list.find((w) => w.id === id).playSec, m1.id);
  await pb.waitForTimeout(50); await playWorld(pb, mB[0].id); await pb.evaluate(ADVANCE, [m1.mx, m1.my, 100]); await toTitle(pb);   // B: +100 s, DEPOIS (data mais nova)
  const exB2 = await exportCard(pb, mB[0].id), fB2 = JSON.parse(exB2.text);
  const sigBefore = await pa.evaluate(RECSIG, m1.id);
  const impDiv = await importFiles(pa, exB2.path);
  check('arquivo mais novo, porém com MENOS jogo que o mundo daqui: NÃO troca, e explica os dois tempos', impDiv.kind === 'warn' && /não foi trocado: o mundo daqui tem mais tempo de jogo/.test(impDiv.lines[0]), impDiv.lines.join(' | '));
  check('...o mundo do A ficou exatamente como estava', (await pa.evaluate(RECSIG, m1.id)) === sigBefore && (await pa.evaluate((id) => Worlds.list.find((w) => w.id === id).playSec, m1.id)) === playA);
  check('...e a mensagem sugere excluir o mundo daqui para usar o arquivo mesmo assim', /exclua o mundo daqui antes/.test(impDiv.lines[0]));

  // ============ G: arquivos ruins e maliciosos ============
  console.log('\n== arquivos ruins e maliciosos (aparelho G, vazio) ==');
  const G_ = await newDev(), pg = G_.pg;
  const bad = {
    lixo: writeTmp('lixo.json', 'isto não é um mundo'),
    corrompido: writeTmp('corrompido.json', (() => { const f = JSON.parse(ex1.text); const i = f.payload.indexOf('"seed"') + 40; f.payload = f.payload.slice(0, i) + (f.payload[i] === 'A' ? 'B' : 'A') + f.payload.slice(i + 1); return JSON.stringify(f); })()),
    item: writeTmp('item-invalido.json', await retamper(pg, ex1.text, (pl) => { pl.sv.P.inv[3] = { id: 'item_que_nao_existe', n: 1 }; })),
    bloco: writeTmp('bloco-invalido.json', await retamper(pg, ex1.text, (pl) => { pl.sv.seed = -5; })),
    xss: writeTmp('xss.json', await retamper(pg, ex2.text, (pl, f) => { pl.meta.name = '<img src=x onerror=window.__xss=1>'; pl.meta.thumb = 'x" onerror="window.__xss=2'; pl.meta.devLabel = '<svg onload=window.__xss=3>'; f.device = { id: 'ABCD-EFGH', label: '<b onclick=window.__xss=4>PC</b>' }; })),
  };
  let r = await importFiles(pg, bad.lixo);
  check('texto qualquer: "Não importei … não é um arquivo de mundo (JSON)" em vermelho', r.kind === 'err' && /^Não importei "lixo\.json": .*JSON/.test(r.lines[0]), r.lines.join(' | '));
  r = await importFiles(pg, bad.corrompido);
  check('arquivo com 1 letra trocada: recusado pela verificação de integridade', r.kind === 'err' && /corrompido \(a verificação de integridade falhou\)/.test(r.lines[0]), r.lines.join(' | '));
  r = await importFiles(pg, bad.item);
  check('item que não existe (com CRC refeito): recusado, e diz qual é o problema', r.kind === 'err' && /item inválido no inventário/.test(r.lines[0]), r.lines.join(' | '));
  r = await importFiles(pg, bad.bloco);
  check('semente inválida (com CRC refeito): recusada', r.kind === 'err' && /semente inválida/.test(r.lines[0]), r.lines.join(' | '));
  check('nenhum dos 4 arquivos ruins entrou na biblioteca', (await pg.evaluate('Worlds.list.length')) === 0);
  const big = path.join(TMP, 'enorme.json'); fs.writeFileSync(big, Buffer.alloc(25 * 1024 * 1024 + 16, 97));
  r = await importFiles(pg, big);
  check('arquivo gigante (mais de 24 MB): recusado sem tentar ler', r.kind === 'err' && /grande demais/.test(r.lines[0]), r.lines.join(' | '));
  fs.rmSync(big, { force: true });
  r = await importFiles(pg, bad.xss);
  check('arquivo com tentativa de injeção de código (nome, miniatura e rótulos): é importado, mas só como TEXTO', r.kind === 'ok' && /^Importado: /.test(r.lines[0]), r.lines.join(' | '));
  await pg.waitForTimeout(600);
  const x = await pg.evaluate(() => ({ xss: typeof window.__xss, name: document.querySelector('.wcard .wname').textContent, listName: Worlds.list[0].name, thumb: Worlds.list[0].thumb, imgs: document.querySelectorAll('.wcard img').length, injected: document.querySelectorAll('.wcard svg, .wcard [onclick], .wcard [onerror], .wcard [onload]').length, date: document.querySelector('.wdate').textContent, cardHtmlHasTag: /<svg|<img[^>]+onerror/i.test(document.querySelector('.wcard').innerHTML) }));
  check('nenhum código foi executado (window.__xss continua indefinido)', x.xss === 'undefined', x.xss);
  check('o nome aparece como texto puro e foi limitado a 28 letras', x.name === x.listName && x.listName.length <= 28 && x.name.startsWith('<img'), x.name);
  check('a miniatura maliciosa foi descartada e não há tags/atributos injetados no cartão', x.thumb === null && x.imgs === 0 && x.injected === 0 && !x.cardHtmlHasTag, JSON.stringify({ imgs: x.imgs, injected: x.injected }));
  check('o rótulo de origem também aparece só como texto', x.date.includes('importado de <b onclick=window.__xss=4>PC</b> (ABCD-EFGH)'), x.date);
  r = await importFiles(pg, [ex1.path, bad.lixo, ex1.path]);
  check('3 arquivos de uma vez (1 bom, 1 ruim, 1 repetido): uma linha para cada, na ordem', r.lines.length === 3 && /^Importado: /.test(r.lines[0]) && /^Não importei "lixo\.json"/.test(r.lines[1]) && /já está neste aparelho/.test(r.lines[2]), r.lines.join(' | '));
  check('...e a mensagem fica vermelha (houve erro), mas o arquivo bom foi importado: 2 mundos na biblioteca', r.kind === 'err' && (await pg.evaluate('Worlds.list.length')) === 2);
  await pg.reload(); await pg.waitForTimeout(900);
  check('depois de recarregar, os 2 mundos importados continuam salvos', (await pg.evaluate('Worlds.list.length')) === 2 && (await pg.evaluate('Worlds.mode')) === 'idb');
  const xr = await pg.evaluate(async () => { const id = Worlds.list.find((w) => w.seed === 7001).id; const ok = await loadGame(id); return { ok, st: G.state, seed: G.seed }; });
  check('e o mundo importado abre e roda (sem erro de carregamento)', xr.ok === true && xr.st === 'play' && xr.seed === 7001, JSON.stringify(xr));

  // ============ D: Firefox (o pedido automático não acontece), F: sem a API, E: celular ============
  console.log('\n== proteção em outros navegadores ==');
  const FFUA = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';
  const D = await newDev({ userAgent: FFUA }, STUB, { persisted: false, grant: false }), pd = D.pg;
  check('Firefox: o rótulo diz Firefox', /^PC · Firefox/.test(await pd.evaluate('Device.init().label')), await pd.evaluate('Device.label'));
  await startWorld(pd, 7101); await pd.waitForTimeout(900); await toTitle(pd);
  check('Firefox: o jogo NÃO pede a proteção sozinho (o navegador abriria um aviso sem contexto)', (await pd.evaluate('window.__prot.calls')) === 0);
  await pd.click('#btn-worlds'); await pd.waitForTimeout(400);
  const d1 = await pd.evaluate(() => ({ prot: document.getElementById('dev-prot').textContent, cls: document.getElementById('dev-prot').className, btn: !document.getElementById('btn-protect').classList.contains('hidden') }));
  check('...a tela avisa "não garantida" e mostra o botão "Proteger agora"', /Proteção permanente não garantida/.test(d1.prot) && d1.cls === 'warn' && d1.btn, d1.prot.slice(0, 60));
  await hideMsg(pd); await pd.click('#btn-protect'); await waitMsg(pd);
  const d2 = await pd.evaluate(() => ({ calls: window.__prot.calls, msg: { kind: document.getElementById('worlds-msg').className, text: document.getElementById('worlds-msg').textContent }, btn: !document.getElementById('btn-protect').classList.contains('hidden') }));
  check('o botão faz o pedido; o navegador NEGA: mensagem amarela explicando, botão continua', d2.calls === 1 && d2.msg.kind === 'warn' && /não concedeu a proteção/.test(d2.msg.text) && d2.btn, JSON.stringify(d2.msg));
  await pd.evaluate('window.__prot.grant = true'); await hideMsg(pd); await pd.click('#btn-protect'); await waitMsg(pd); await pd.waitForTimeout(200);
  const d3 = await pd.evaluate(() => ({ calls: window.__prot.calls, msg: document.getElementById('worlds-msg').textContent, kind: document.getElementById('worlds-msg').className, prot: document.getElementById('dev-prot').textContent, btn: !document.getElementById('btn-protect').classList.contains('hidden') }));
  check('tentando de novo e o navegador concedendo: "ativada", chip verde e o botão some', d3.calls === 2 && d3.kind === 'ok' && /ativada/.test(d3.msg) && /Proteção permanente ativa/.test(d3.prot) && !d3.btn, JSON.stringify(d3));

  const F = await newDev({}, STUB, { api: false }), pf = F.pg;
  await startWorld(pf, 7201); await pf.waitForTimeout(700); await toTitle(pf); await pf.click('#btn-worlds'); await pf.waitForTimeout(400);
  const f3 = await pf.evaluate(() => ({ prot: document.getElementById('dev-prot').textContent, btn: !document.getElementById('btn-protect').classList.contains('hidden') }));
  check('navegador sem a API: avisa que não oferece proteção, sugere Exportar e não mostra o botão', /não oferece proteção permanente/.test(f3.prot) && /Exportar/.test(f3.prot) && !f3.btn, f3.prot);

  console.log('\n== celular (iPhone) ==');
  const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const E = await newDev({ userAgent: IPH, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }), pe = E.pg;
  check('o rótulo diz "Celular · Safari (iOS)"', (await pe.evaluate('Device.init().label')) === 'Celular · Safari (iOS)', await pe.evaluate('Device.label'));
  await startWorld(pe, 7301); await pe.waitForTimeout(700); await toTitle(pe); await pe.click('#btn-worlds'); await pe.waitForTimeout(500);
  const lay = await pe.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), W = window.innerWidth; return { sw: document.documentElement.scrollWidth, W, imp: r('btn-import').right, box: r('worlds-box').right, boxL: r('worlds-box').left, exp: [...document.querySelectorAll('.wcard [data-act="exp"]')].every((b) => b.getBoundingClientRect().right <= W && b.getBoundingClientRect().width > 30), code: document.getElementById('dev-code').textContent, label: document.getElementById('dev-label').textContent }; });
  check('no celular: sem rolagem horizontal, a caixa e os botões cabem na tela', lay.sw <= lay.W + 1 && lay.imp <= lay.W && lay.box <= lay.W && lay.boxL >= 0 && lay.exp, JSON.stringify(lay));
  check('...e mostra o rótulo do celular e o código', lay.label === 'Celular · Safari (iOS)' && /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(lay.code));

  // ============ C: sem IndexedDB ============
  console.log('\n== sem IndexedDB (iframe com sandbox, modo privado…) ==');
  const C = await newDev({}, NOIDB), pcx = C.pg;
  await startWorld(pcx, 7401); await pcx.waitForTimeout(600); await pcx.evaluate(MARK); await toTitle(pcx); await pcx.click('#btn-worlds'); await pcx.waitForTimeout(400);
  const c1 = await pcx.evaluate(() => ({ mode: Worlds.mode, prot: document.getElementById('dev-prot').textContent, cls: document.getElementById('dev-prot').className, code: document.getElementById('dev-code').textContent, btn: !document.getElementById('btn-protect').classList.contains('hidden') }));
  check('modo "só durante a sessão": aviso claro, código marcado como temporário e sem botão de proteção', c1.mode === 'memory' && /Aqui o navegador não deixa salvar mapas/.test(c1.prot) && c1.cls === 'warn' && /\(temporário\)$/.test(c1.code) && !c1.btn, JSON.stringify(c1));
  const wid = await pcx.evaluate('Worlds.list[0].id'), exC = await exportCard(pcx, wid);
  check('exportar funciona mesmo sem IndexedDB (é o jeito de guardar o mapa nesse ambiente)', !JSON.parse(exC.text).error && JSON.parse(exC.text).info.seed === 7401 && exC.msg.kind === 'ok', exC.name);
  const impC = await importFiles(pcx, ex2.path);
  check('importar também funciona na memória: o mundo aparece na lista da sessão', impC.kind === 'ok' && (await pcx.evaluate('Worlds.list.length')) === 2 && (await pcx.evaluate("document.querySelectorAll('.wcard').length")) === 2, impC.lines.join(' | '));

  console.log('\n== erros de página em todos os aparelhos ==');
  const flat = allErrs.flat();
  check('nenhuma exceção nem console.error', flat.length === 0, flat.slice(0, 3));

  await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
  const badr = res.filter((x) => !x.ok);
  console.log(`\nverificações: ${res.length} | falhas: ${badr.length}`);
  for (const x of badr) console.log('  FALHOU:', x.name, fmtDetail(x.detail));
  process.exitCode = badr.length ? 1 : 0;
});
