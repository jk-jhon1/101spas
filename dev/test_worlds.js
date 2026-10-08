'use strict';
// Sistema de mundos salvos: criação sem campo de semente, sementes inéditas, mundos diferentes entre si, miniaturas, "Meus Mundos",
// renomear/excluir, persistência (recarregar a página), fidelidade do save bloco a bloco, autosave, migração do save antigo,
// ambiente sem IndexedDB, erro de cota e mundo corrompido.        node dev/test_worlds.js
const { launch, INDEX_URL, run, waitPlay, collectErrors, fmtDetail } = require('./lib');

const res = [];
function check(name, ok, detail = '') {
  res.push({ name, ok: !!ok, detail });
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + fmtDetail(detail) : ''));
}

// ---------- código que roda dentro da página ----------
// fidelidade: edita o mundo de todo jeito, salva, estraga, recarrega e compara bloco a bloco (o jogo fica pausado para nada mudar entre as fotos)
const FIDELITY = async () => {
  G.paused = true;
  let s = 12345; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const fnv = (a) => { let h = 2166136261; for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a[i], 16777619); return h >>> 0; };
  const snap = () => {
    const wd = G.world, P = G.P;
    return { t: fnv(wd.t), wl: fnv(wd.wl), lq: fnv(wd.lq), lt: fnv(wd.lt), surf: fnv(new Uint8Array(wd.surf.buffer)), bio: fnv(wd.bio), rev: Array.from(wd.rev),
      chests: JSON.stringify([...wd.chests.entries()]), inv: JSON.stringify(P.inv), flags: JSON.stringify(G.flags),
      meta: [G.stage, G.day, G.kills, G.time, G.t, wd.hardmode, P.crystals, P.sel, G.seed, G.mode, JSON.stringify(wd.spawn)].join('|') };
  };
  const wd = G.world, P = G.P;
  for (let k = 0; k < 600; k++) wd.set(Math.floor(rnd() * wd.w), 100 + Math.floor(rnd() * 300), [0, T.stone, T.dirt, T.gold, T.sand][Math.floor(rnd() * 5)], true);
  for (let k = 0; k < 200; k++) { const i = Math.floor(rnd() * wd.w * wd.h); wd.lq[i] = 1 + Math.floor(rnd() * 254); wd.lt[i] = 1 + (k & 1); }
  wd.chests.set(5000, [{ id: 's120', n: 1 }, null, { id: 'coin', n: 33 }]);
  G.flags.slime = true; G.flags.eye = true; G.stage = 2; G.day = 9; G.kills = 41; if (!wd.hardmode) spawnHardmodeOres(wd);
  P.inv[7] = { id: 'iron_bar', n: 77 }; P.crystals = 4; P.sel = 3;
  const before = snap(), t0 = performance.now(), ok1 = await saveGame(true), saveMs = Math.round(performance.now() - t0);
  for (let x = 100; x < 400; x++) for (let y = 120; y < 200; y++) wd.set(x, y, 0, true);   // estraga o mundo antes de recarregar
  G.stage = 0; G.day = 1; G.flags.slime = false; P.inv[7] = null; wd.chests.clear();
  const ok2 = await loadGame(); G.paused = true;
  const after = snap(), same = {};
  for (const k of ['t', 'wl', 'lq', 'lt', 'surf', 'bio', 'chests', 'inv', 'flags', 'meta']) same[k] = before[k] === after[k];
  let lost = 0; for (let i = 0; i < before.rev.length; i++) if (before.rev[i] && !after.rev[i]) lost++;   // o mapa revelado só pode crescer (finishLoad revela ao redor do jogador)
  return { ok1, ok2, saveMs, same, revLost: lost, differs: Object.keys(same).filter((k) => !same[k]) };
};
const TELEPORT = () => {   // Arsenal > Mundo > Teletransporte: cada botão leva ao bioma de verdade (os biomas mudam de lugar em cada mundo)
  const wd = G.world, out = {};
  const click = (name) => { openPanel('arsenal'); G.ui.arsTab = 'world'; renderArsenal(); const b = [...document.querySelectorAll('#ars-body .btn')].find((x) => x.textContent === name); if (!b) return false; b.click(); return true; };
  const here = () => wd.biomeName(Math.floor(G.P.x / TS));
  for (const [btn, bio] of [['Floresta', 'forest'], ['Deserto', 'desert'], ['Selva', 'jungle'], ['Neve', 'snow'], ['Oceano', 'ocean']]) out[btn] = click(btn) ? here() : 'sem botão';
  out.ilha = click('Ilha do céu') ? Math.floor(G.P.y / TS) : -1;
  out.spawn = click('Spawn') ? (G.P.x === wd.spawn.x && G.P.y === wd.spawn.y) : false;
  out.botoes = (openPanel('arsenal'), G.ui.arsTab = 'world', renderArsenal(), [...document.querySelectorAll('#ars-body .btn')].map((x) => x.textContent));
  closePanels(); return out;
};
const UNIQ = async () => {   // 150 sorteios seguidos: nenhuma semente repetida, nem das já usadas
  const used0 = new Set(Worlds.used), seen = new Set(); let dup = 0, reused = 0;
  for (let i = 0; i < 150; i++) { const a = await Worlds.allocate('adventure'); if (seen.has(a.seed)) dup++; seen.add(a.seed); if (used0.has(a.seed)) reused++; }
  return { n: seen.size, dup, reused };
};
const ORDERS = async () => {   // biblioteca vazia simulada: os 24 primeiros mundos pedem 24 ordens de biomas diferentes
  const saved = Worlds.list.slice(); Worlds.list = []; const keys = [], runs = [];
  try {
    for (let i = 0; i < 24; i++) { const a = await Worlds.allocate('adventure'), L = makeLayout(a.seed), r = layoutRuns(L); keys.push(L.key); runs.push(r); Worlds.list.push({ id: 'fake' + i, name: a.name, seed: a.seed, layoutKey: L.key, runs: r, updated: i }); }
    let worst = 0; for (let i = 0; i < 24; i++) for (let j = i + 1; j < 24; j++) worst = Math.max(worst, runsSimilarity(runs[i], runs[j]));
    return { distinct: new Set(keys).size, worst };
  } finally { Worlds.list = saved; }
};
const COLLIDE = async (seed) => {   // o sorteio "cai" 40 vezes numa semente já usada: tem de ser recusada
  const real = crypto.getRandomValues.bind(crypto); let n = 0;
  crypto.getRandomValues = (a) => { if (n < 40) { n++; a[0] = seed; return a; } return real(a); };
  try { const a = await Worlds.allocate('adventure'); return { got: a.seed, forced: n }; } finally { crypto.getRandomValues = real; }
};
const RLE = () => {   // ida e volta do RLE com vetores aleatórios (corridas longas, curtas, tamanhos estranhos)
  let s = 7; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; let bad = 0;
  for (let k = 0; k < 300; k++) {
    const n = 1 + Math.floor(rnd() * 5000), a = new Uint8Array(n); let i = 0;
    while (i < n) { const v = Math.floor(rnd() * (rnd() < .5 ? 3 : 256)), len = 1 + Math.floor(rnd() * (rnd() < .2 ? 900 : 12)); a.fill(v, i, i + len); i += len; }
    const b = rleDec(rleEnc(a), n); for (let j = 0; j < n; j++) if (a[j] !== b[j]) { bad++; break; }
  }
  const big = new Uint8Array(WW * WH); big.fill(5, 1000, 600000); const r = rleDec(rleEnc(big), big.length);
  return { bad, big: r.length === big.length && r[999] === 0 && r[1000] === 5 && r[599999] === 5 && r[600000] === 0 };
};
const MARK = () => {   // marca única do mundo + impressão digital do relevo
  const wd = G.world, sx = Math.round(wd.spawn.x / TS), mx = sx + 3, my = wd.surf[mx] - 2; G.opts.noSpawn = true;
  wd.set(mx, my, T.gold, true); invAdd('coin', 7);
  let h = 2166136261; for (let x = 0; x < wd.w; x++) h = Math.imul(h ^ (wd.surf[x] & 255), 16777619) ^ wd.bio[x];
  return { seed: G.seed, name: G.worldName, id: G.worldId, mode: G.mode, key: wd.layoutKey(), spawnBio: wd.biomeName(sx), fp: h >>> 0, mx, my, runs: wd.biomeRuns(), spawn: wd.spawn };
};
const MKLEGACY = () => {   // save no formato ANTIGO (um slot em localStorage, base64) — pequeno: piso de pedra em y=100
  const n = WW * WH, t = new Uint8Array(n), z = new Uint8Array(n), np = newPlayer();
  for (let x = 0; x < WW; x++) for (let y = 100; y < WH; y++) t[x + y * WW] = y >= WH - 3 ? T.bedrock : T.stone;
  const inv = np.inv.map(() => null); inv[0] = { id: 's001', n: 1 }; inv[1] = { id: 'pick_copper', n: 1 }; inv[2] = { id: 'coin', n: 25 };
  const sv = { v: 1, seed: 123456, mode: 'adventure', time: .4, day: 7, t: 3725, stage: 1, flags: { slime: true, eye: false, guardian: false, colossus: false }, kills: 12, hard: false, spawn: { x: 5000, y: 1500 }, mush: null,
    w: { t: b64(rleEnc(t)), wl: b64(rleEnc(z)), lq: b64(rleEnc(z)), lt: b64(rleEnc(z)), rev: b64(rleEnc(z)), surf: b64(new Uint8Array(new Int16Array(WW).fill(100).buffer)), bio: b64(new Uint8Array(WW).fill(2)) },
    chests: [], P: { x: 5000, y: 1560, hp: 100, crystals: 2, inv, equip: { armor: null, acc: [null, null, null] }, sel: 1 }, npcs: [], opts: {} };
  localStorage.setItem(SAVE_KEY, JSON.stringify(sv));
};

run(async () => {
  const b = await launch();
  const newCtx = async (init) => { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); if (init) await ctx.addInitScript(init); const pg = await ctx.newPage(); return { ctx, pg, errs: collectErrors(pg) }; };
  const toTitle = async (pg) => { await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); await pg.click('#p-menu'); await pg.waitForFunction('G.state === "title"', null, { timeout: 15000 }); await pg.waitForTimeout(250); };
  const allErrs = [];

  // ================= A: criação, unicidade, persistência =================
  console.log('== título e criação de mundos (sem campo de semente) ==');
  const A = await newCtx(); const pg = A.pg; allErrs.push(A.errs);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(900);
  check('o campo de semente não existe mais', await pg.evaluate("!document.getElementById('seed') && !document.getElementById('seed-row')"));
  check('o jogo grava no IndexedDB', (await pg.evaluate('Worlds.mode')) === 'idb', await pg.evaluate('Worlds.why'));
  check('sem mundos: "Continuar" oculto e "Meus Mundos" diz que está vazio', (await pg.evaluate("document.getElementById('btn-load').classList.contains('hidden')")) && (await pg.evaluate("document.getElementById('btn-worlds-sub').textContent")) === 'Nenhum mundo salvo ainda');
  check('RLE: ida e volta exata em 300 vetores aleatórios e no mundo inteiro', await (async () => { const r = await pg.evaluate(RLE); return r.bad === 0 && r.big; })());

  const made = [];
  for (let i = 0; i < 6; i++) {
    await pg.click(i % 2 ? '#btn-cre' : '#btn-adv'); await waitPlay(pg); await pg.waitForTimeout(450);
    made.push(await pg.evaluate(MARK)); await toTitle(pg);
  }
  const uniq = (f) => new Set(made.map(f)).size;
  check('6 mundos criados pelos botões têm 6 sementes diferentes', uniq((m) => m.seed) === 6, made.map((m) => m.seed));
  check('6 nomes diferentes', uniq((m) => m.name) === 6, made.map((m) => m.name));
  check('6 ordens de bioma diferentes', uniq((m) => m.key) === 6, made.map((m) => m.key));
  check('6 relevos diferentes (impressão digital da superfície)', uniq((m) => m.fp) === 6);
  check('todos começam na floresta', made.every((m) => m.spawnBio === 'forest'));
  const worst = await pg.evaluate((runs) => { let w = 0; for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) w = Math.max(w, runsSimilarity(runs[i], runs[j])); return w; }, made.map((m) => m.runs));
  check('mapas de biomas de quaisquer dois mundos coincidem em menos de 65% das colunas', worst < .65, (worst * 100).toFixed(1) + '%');
  check('os 6 mundos estão na biblioteca, 3 de cada modo', (await pg.evaluate('Worlds.list.length')) === 6 && made.filter((m) => m.mode === 'creative').length === 3);
  check('"Continuar" aponta para o último mundo jogado', (await pg.evaluate("document.getElementById('btn-load-sub').textContent")).includes(made[5].name), await pg.evaluate("document.getElementById('btn-load-sub').textContent"));
  check('"Meus Mundos" informa a quantidade', (await pg.evaluate("document.getElementById('btn-worlds-sub').textContent")) === '6 mundos salvos');

  console.log('\n== tela Meus Mundos ==');
  await pg.click('#btn-worlds'); await pg.waitForTimeout(300);
  const cards = await pg.evaluate(() => [...document.querySelectorAll('.wcard')].map((c) => ({ name: c.querySelector('.wname').textContent, bio: c.querySelector('.wbio').textContent, src: (c.querySelector('img') || {}).src || '' })));
  check('6 cartões, do mais recente ao mais antigo', cards.length === 6 && cards.every((c, i) => c.name === made[5 - i].name), cards.map((c) => c.name));
  check('cada cartão mostra a ordem dos biomas', cards.every((c, i) => c.bio.split(' › ').length === 4 && c.bio === made[5 - i].key.split('-').map((k) => ({ desert: 'Deserto', forest: 'Floresta', jungle: 'Selva', snow: 'Neve' }[k])).join(' › ')), cards[0].bio);
  check('todas as miniaturas são PNG de verdade e diferentes entre si', cards.every((c) => c.src.startsWith('data:image/png;base64,') && c.src.length > 1500) && new Set(cards.map((c) => c.src)).size === 6, cards.map((c) => c.src.length));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  check('Esc fecha a tela', await pg.evaluate("document.getElementById('worlds').classList.contains('hidden')"));

  console.log('\n== persistência: recarregar a página ==');
  await pg.reload(); await pg.waitForTimeout(900);
  check('os 6 mundos continuam salvos, com miniatura', (await pg.evaluate('Worlds.list.length')) === 6 && (await pg.evaluate('Worlds.list.every(w => w.thumb && w.thumb.length > 1500)')));
  await pg.click('#btn-worlds'); await pg.waitForTimeout(300);
  await pg.click('.wcard:nth-child(3) [data-act="play"]'); await waitPlay(pg); await pg.waitForTimeout(500);
  const m3 = made[3];   // o 3º cartão da lista (mais recente primeiro) é o 4º criado
  const back = await pg.evaluate(([mx, my]) => ({ seed: G.seed, name: G.worldName, id: G.worldId, mode: G.mode, key: G.world.layoutKey(), gold: TD[G.world.get(mx, my)].k, coins: invCount('coin'), spawn: G.world.spawn, toast: [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | ') }), [m3.mx, m3.my]);
  check('abre o mundo certo (semente, nome, id, modo, layout)', back.seed === m3.seed && back.name === m3.name && back.id === m3.id && back.mode === m3.mode && back.key === m3.key, back.seed + ' ' + back.name);
  check('a marca feita no mundo (bloco de ouro e moedas) sobreviveu', back.gold === 'gold' && back.coins >= 7, back.gold + ' / ' + back.coins);
  check('o ponto de partida do mundo é o mesmo', back.spawn.x === m3.spawn.x && back.spawn.y === m3.spawn.y);
  check('avisa que o mundo foi carregado pelo nome', back.toast.includes(m3.name));

  console.log('\n== teletransporte do Arsenal (biomas em lugares diferentes a cada mundo) ==');
  const tp = await pg.evaluate(TELEPORT);
  check('cada botão leva ao bioma do nome (floresta, deserto, selva, neve, oceano)', tp['Floresta'] === 'forest' && tp['Deserto'] === 'desert' && tp['Selva'] === 'jungle' && tp['Neve'] === 'snow' && tp['Oceano'] === 'ocean', JSON.stringify(tp));
  check('"Ilha do céu" leva a uma ilha flutuante (acima da superfície) e "Spawn" volta ao ponto de partida', tp.ilha > 0 && tp.ilha < 80 && tp.spawn === true, 'y=' + tp.ilha);
  check('a lista de teletransporte tem um botão por bioma existente', ['Spawn', 'Floresta', 'Deserto', 'Selva', 'Neve', 'Oceano', 'Ilha do céu', 'Cavernas', 'Inferno'].every((n) => tp.botoes.includes(n)), tp.botoes.join(','));

  console.log('\n== fidelidade do save (bloco a bloco) ==');
  const fid = await pg.evaluate(FIDELITY);
  check('salvar e recarregar funcionam', fid.ok1 === true && fid.ok2 === true, fid.saveMs + ' ms');
  check('blocos, paredes, líquidos, superfície, biomas: idênticos depois de salvar/recarregar', ['t', 'wl', 'lq', 'lt', 'surf', 'bio'].every((k) => fid.same[k]), fid.differs.join(','));
  check('baús, inventário, chefes derrotados, estágio, dia, hora, cristais, Hardmode, semente, modo e spawn: idênticos', ['chests', 'inv', 'flags', 'meta'].every((k) => fid.same[k]), fid.differs.join(','));
  check('o mapa revelado só cresce', fid.revLost === 0, fid.revLost);
  const snapMs = await pg.evaluate('(() => { G.paused = true; const t0 = performance.now(); snapshotGame(); return Math.round(performance.now() - t0); })()');
  check('a "foto" síncrona do jogo demora pouco (autosave sem engasgo)', snapMs < 80, snapMs + ' ms');

  console.log('\n== autosave e salvamento ao esconder a aba ==');
  await pg.evaluate('G.paused = false');
  const u0 = await pg.evaluate('Worlds.list.find(w => w.id === G.worldId).updated');
  await pg.evaluate('G.autoSaveT = .01'); await pg.waitForTimeout(900);
  const u1 = await pg.evaluate('Worlds.list.find(w => w.id === G.worldId).updated');
  check('o autosave (a cada minuto) grava sozinho', u1 > u0, u1 - u0 + ' ms depois');
  check('aparece o aviso discreto "Mundo salvo"', await pg.evaluate("!document.getElementById('savebadge').classList.contains('hidden')"));
  await pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));"); await pg.waitForTimeout(500);
  const u2 = await pg.evaluate('Worlds.list.find(w => w.id === G.worldId).updated');
  check('esconder a aba também salva', u2 > u1, u2 - u1 + ' ms depois');
  await pg.evaluate("delete document.hidden");
  const par = await pg.evaluate(async () => { const r = await Promise.all([1, 2, 3, 4, 5].map(() => Worlds.save({ silent: true }))); return { r, n: Worlds.list.length }; });
  check('5 salvamentos simultâneos entram na fila e terminam bem', par.r.every((x) => x === true) && par.n === 6, JSON.stringify(par));

  console.log('\n== sementes inéditas ==');
  const un = await pg.evaluate(UNIQ);
  check('150 sorteios seguidos: nenhuma semente repetida, nenhuma já usada antes', un.n === 150 && un.dup === 0 && un.reused === 0, JSON.stringify(un));
  const ord = await pg.evaluate(ORDERS);
  check('com a biblioteca vazia, os 24 primeiros mundos recebem 24 ordens de biomas diferentes', ord.distinct === 24, ord.distinct);
  check('...e quaisquer dois deles diferem em mais de 35% das colunas', ord.worst < .65, (ord.worst * 100).toFixed(1) + '% de parecença máxima');
  await toTitle(pg);

  console.log('\n== renomear e excluir ==');
  await pg.click('#btn-worlds'); await pg.waitForTimeout(250);
  await pg.click('.wcard:nth-child(1) [data-act="ren"]'); await pg.fill('.wedit', 'Meu Mundo Teste'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
  check('renomear pelo cartão (Enter confirma)', (await pg.evaluate("document.querySelector('.wcard .wname').textContent")) === 'Meu Mundo Teste' && (await pg.evaluate('Worlds.list.find(w => w.name === "Meu Mundo Teste") !== undefined')));
  await pg.click('.wcard:nth-child(2) [data-act="ren"]'); await pg.fill('.wedit', 'meu mundo teste'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
  check('nome repetido ganha numeral (nunca dois mundos com o mesmo nome)', (await pg.evaluate('new Set(Worlds.list.map(w => w.name.toLowerCase())).size')) === 6, await pg.evaluate("[...document.querySelectorAll('.wname')].map(n => n.textContent).slice(0, 2)"));
  await pg.click('.wcard:nth-child(3) [data-act="ren"]'); await pg.fill('.wedit', 'Nome descartado'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  check('Esc cancela a edição do nome', !(await pg.evaluate('Worlds.list.some(w => w.name === "Nome descartado")')));
  await pg.reload(); await pg.waitForTimeout(900);
  check('os nomes novos persistem depois de recarregar', await pg.evaluate('Worlds.list.some(w => w.name === "Meu Mundo Teste")'));
  await pg.click('#btn-worlds'); await pg.waitForTimeout(250);
  const delId = await pg.evaluate("document.querySelectorAll('.wcard')[5].dataset.id"), delSeed = await pg.evaluate((id) => Worlds.list.find((w) => w.id === id).seed, delId);
  await pg.click('.wcard:nth-child(6) [data-act="del"]');
  check('o 1º clique em Excluir só pede confirmação', (await pg.evaluate("document.querySelector('.wcard:nth-child(6) .wdel').textContent")) === 'Confirmar exclusão?' && (await pg.evaluate('Worlds.list.length')) === 6);
  await pg.click('.wcard:nth-child(6) [data-act="del"]'); await pg.waitForTimeout(400);
  check('o 2º clique exclui o mundo', (await pg.evaluate('Worlds.list.length')) === 5 && (await pg.evaluate("document.querySelectorAll('.wcard').length")) === 5 && (await pg.evaluate((id) => !Worlds.list.some((w) => w.id === id), delId)));
  const raw = await pg.evaluate(async ([id, seed]) => {
    const db = await new Promise((r, j) => { const q = indexedDB.open('espadas120'); q.onsuccess = () => r(q.result); q.onerror = j; });
    const get = (st, k) => new Promise((r, j) => { const q = db.transaction([st]).objectStore(st).get(k); q.onsuccess = () => r(q.result); q.onerror = j; });
    const out = { data: await get('data', id), meta: await get('worlds', id), seed: await get('seeds', seed) }; db.close(); return { hasData: !!out.data, hasMeta: !!out.meta, hasSeed: !!out.seed };
  }, [delId, delSeed]);
  check('no banco: dados e metadados somem, mas a semente continua registrada', !raw.hasData && !raw.hasMeta && raw.hasSeed, JSON.stringify(raw));
  const col = await pg.evaluate(COLLIDE, delSeed);
  check('uma semente de mundo excluído NUNCA é sorteada de novo (mesmo se o acaso insistir 40 vezes)', col.forced === 40 && col.got !== delSeed, JSON.stringify(col));

  console.log('\n== falhas: cota estourada e dados corrompidos ==');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  await pg.click('#btn-load'); await waitPlay(pg); await pg.waitForTimeout(400);
  await pg.evaluate(() => { window.__putReal = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function () { throw new DOMException('sem espaço', 'QuotaExceededError'); }; });
  const qFail = await pg.evaluate('saveGame(false)');
  const qToast = await pg.evaluate("[...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ')");
  check('cota estourada: o salvamento falha com aviso claro e o jogo continua', qFail === false && qToast.includes('Sem espaço') && (await pg.evaluate('G.state')) === 'play', qToast.slice(-90));
  await pg.evaluate(() => { IDBObjectStore.prototype.put = window.__putReal; });
  check('liberado o espaço, o salvamento volta a funcionar', (await pg.evaluate('saveGame(true)')) === true);
  const badId = await pg.evaluate('Worlds.list.find(w => w.id !== G.worldId).id');
  await toTitle(pg);
  await pg.evaluate(async (id) => { const tx = Worlds.db.transaction(['data'], 'readwrite'); tx.objectStore('data').delete(id); await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = j; }); }, badId);
  await pg.click('#btn-worlds'); await pg.waitForTimeout(250);
  await pg.click(`.wcard[data-id="${badId}"] [data-act="play"]`); await pg.waitForTimeout(800);
  check('mundo sem dados: avisa, volta ao título e não trava na tela de carregamento', (await pg.evaluate('G.state')) === 'title' && (await pg.evaluate("document.getElementById('loading').classList.contains('hidden')")) && (await pg.evaluate("[...document.querySelectorAll('.toast')].some(t => t.textContent.includes('não foram encontrados'))")));

  // ================= B: migração do save antigo =================
  console.log('\n== migração do save antigo (um slot em localStorage) ==');
  const B = await newCtx(); allErrs.push(B.errs);
  await B.pg.goto(INDEX_URL); await B.pg.waitForTimeout(700); await B.pg.evaluate(MKLEGACY); await B.pg.reload(); await B.pg.waitForTimeout(1000);
  const mig = await B.pg.evaluate(() => ({ n: Worlds.list.length, w: Worlds.list[0], ls: localStorage.getItem(SAVE_KEY), load: !document.getElementById('btn-load').classList.contains('hidden') }));
  check('o save antigo virou um mundo da biblioteca (com a semente original)', mig.n === 1 && mig.w.seed === 123456 && mig.w.legacy === true && mig.w.mode === 'adventure', JSON.stringify({ n: mig.n, seed: mig.w && mig.w.seed }));
  check('o slot antigo foi removido do localStorage e "Continuar" apareceu', mig.ls === null && mig.load);
  await B.pg.click('#btn-load'); await waitPlay(B.pg); await B.pg.waitForTimeout(400);
  const lg = await B.pg.evaluate(() => ({ day: G.day, stage: G.stage, kills: G.kills, seed: G.seed, cr: G.P.crystals, inv0: G.P.inv[0] && G.P.inv[0].id, coin: invCount('coin'), stone: TD[G.world.get(100, 150)].k, air: G.world.get(100, 50), bio: G.world.biomeName(500), name: G.worldName, flag: G.flags.slime }));
  check('o mundo antigo abre intacto (dia, estágio, chefes, inventário, blocos, biomas)', lg.day === 7 && lg.stage === 1 && lg.kills === 12 && lg.seed === 123456 && lg.cr === 2 && lg.inv0 === 's001' && lg.coin === 25 && lg.stone === 'stone' && lg.air === 0 && lg.bio === 'forest' && lg.flag === true, JSON.stringify(lg));
  const resave = await B.pg.evaluate('saveGame(false)');
  check('salvar de novo converte para o formato novo e cria a miniatura', resave === true && (await B.pg.evaluate("Worlds.list[0].thumb.startsWith('data:image/png;base64,') && Worlds.list[0].thumb.length > 300")) && (await B.pg.evaluate('Worlds.list[0].legacy')) === true);
  await B.pg.reload(); await B.pg.waitForTimeout(900); await B.pg.click('#btn-load'); await waitPlay(B.pg); await B.pg.waitForTimeout(300);
  check('...e o mundo convertido reabre igual', (await B.pg.evaluate('G.day === 7 && G.stage === 1 && G.seed === 123456 && invCount("coin") === 25')) === true);

  // ================= C: sem IndexedDB =================
  console.log('\n== ambiente sem IndexedDB (iframe com sandbox, modo privado…) ==');
  const C = await newCtx(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); }); allErrs.push(C.errs);
  await C.pg.goto(INDEX_URL); await C.pg.waitForTimeout(900);
  check('cai no modo "só durante a sessão" e avisa no título', (await C.pg.evaluate('Worlds.mode')) === 'memory' && (await C.pg.evaluate("document.getElementById('btn-worlds-sub').textContent")).includes('indisponível'), await C.pg.evaluate('Worlds.why'));
  await C.pg.click('#btn-adv'); await waitPlay(C.pg); await C.pg.waitForTimeout(500);
  const mk = await C.pg.evaluate(MARK);
  const memSave = await C.pg.evaluate('saveGame(false)'), memToast = await C.pg.evaluate("[...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ')");
  check('salvar avisa que não é permanente (e devolve false)', memSave === false && memToast.includes('Salvamento permanente indisponível'));
  await toTitle(C.pg);
  check('mesmo assim o mundo fica disponível na sessão ("Continuar")', (await C.pg.evaluate('Worlds.list.length')) === 1 && !(await C.pg.evaluate("document.getElementById('btn-load').classList.contains('hidden')")));
  await C.pg.click('#btn-load'); await waitPlay(C.pg); await C.pg.waitForTimeout(300);
  check('...e reabre com a marca feita', (await C.pg.evaluate(([x, y]) => TD[G.world.get(x, y)].k, [mk.mx, mk.my])) === 'gold');

  console.log('\n== migração do save antigo SEM IndexedDB: nada pode ser perdido ==');
  await C.pg.evaluate(MKLEGACY); await C.pg.reload(); await C.pg.waitForTimeout(1000);
  const memLeg = await C.pg.evaluate(() => ({ mode: Worlds.mode, n: Worlds.list.length, legacy: Worlds.list[0] && Worlds.list[0].legacy, ls: localStorage.getItem(SAVE_KEY) !== null }));
  check('o save antigo é importado para a sessão, mas FICA no localStorage (a gravação não é permanente)', memLeg.mode === 'memory' && memLeg.n === 1 && memLeg.legacy === true && memLeg.ls === true, JSON.stringify(memLeg));
  await C.pg.reload(); await C.pg.waitForTimeout(1000);
  check('...e na próxima abertura o mundo antigo ainda está lá', (await C.pg.evaluate('Worlds.list.length')) === 1 && (await C.pg.evaluate('Worlds.list[0].seed')) === 123456);

  // ================= erros de página =================
  console.log('\n== erros de página em todos os cenários ==');
  const flat = allErrs.flat();
  check('nenhuma exceção nem console.error', flat.length === 0, flat.slice(0, 3));

  await b.close();
  const bad = res.filter((x) => !x.ok);
  console.log(`\nverificações: ${res.length} | falhas: ${bad.length}`);
  for (const x of bad) console.log('  FALHOU:', x.name, fmtDetail(x.detail));
  process.exitCode = bad.length ? 1 : 0;
});
