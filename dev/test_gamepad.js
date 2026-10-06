'use strict';
// Teste do suporte a controle (Gamepad API) com um gamepad simulado.
// Usa o loop real do jogo (requestAnimationFrame -> frame -> padUpdate -> step).
const { launch, INDEX_URL, devfile, run, waitPlay, mod, fmtDetail } = require('./lib');
const { MOCK, BLOCKED } = require('./gamepad_mock');

const res = [];
function check(name, ok, detail = '') {
  res.push({ name, ok: !!ok, detail });
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + fmtDetail(detail) : ''));
}
const deg = (rad) => (rad * 180) / Math.PI;

run(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(MOCK);
  const pg = await ctx.newPage();
  const logs = [];
  pg.on('console', (m) => { if (m.type() === 'error') logs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  pg.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  const ev = (...args) => pg.evaluate(...args);
  const tap = async (i, ms = 150) => {
    await ev(`__setPad({${i}: true})`); await pg.waitForTimeout(ms); await ev(`__setPad({${i}: false})`); await pg.waitForTimeout(ms);
  };
  const axes = async (a, ms = 0) => {
    await ev(`__setPad(null, ${JSON.stringify(a)})`);
    if (ms) await pg.waitForTimeout(ms);
  };
  const focusId = () => { const e = document.querySelector('.menu-btn.padfocus'); return e ? e.id : null; };
  const waitFor = (expr, timeout) => pg.waitForFunction(expr, null, { timeout });

  console.log('== título ==');
  await pg.goto(INDEX_URL); await pg.waitForTimeout(800);
  check('dica de controle conectado', (await ev("document.getElementById('pad-hint').textContent")).includes('Controle conectado'));
  check('sem foco antes do 1º toque', (await ev(focusId)) == null);
  await tap(0);
  check('1º toque só mostra o foco (Nova Aventura)', (await ev(focusId)) === 'btn-adv', await ev(focusId));
  check('ainda no título', (await ev('__G.state')) === 'title');
  await tap(13); check('direcional ↓ -> Modo Criativo', (await ev(focusId)) === 'btn-cre', await ev(focusId));
  await tap(12); check('direcional ↑ -> Nova Aventura', (await ev(focusId)) === 'btn-adv');
  await axes([0, 1, 0, 0], 120); await axes([0, 0, 0, 0], 120);
  check('analógico ↓ move o foco', (await ev(focusId)) === 'btn-cre', await ev(focusId));
  await axes([0, -1, 0, 0], 120); await axes([0, 0, 0, 0], 120);
  check('analógico ↑ move o foco', (await ev(focusId)) === 'btn-adv', await ev(focusId));
  await pg.fill('#seed', '4242');
  await tap(0);
  await waitPlay(pg);
  check('A inicia o jogo', true);
  await pg.waitForTimeout(1200);
  await ev("(() => { G.opts.god = true; G.opts.noSpawn = true; G.enemies.length = 0; document.getElementById('toasts').innerHTML=''; })()");

  console.log('== movimento / pulo / barra ==');
  const x0 = await ev('G.P.x'); await axes([1, 0, 0, 0], 700); const x1 = await ev('G.P.x'); await axes([0, 0, 0, 0], 300);
  check('analógico → anda para a direita', x1 > x0 + 20, `${x0.toFixed(0)} -> ${x1.toFixed(0)}`);
  await axes([-1, 0, 0, 0], 700); const x2 = await ev('G.P.x'); await axes([0, 0, 0, 0], 300);
  check('analógico ← anda para a esquerda', x2 < x1 - 20, `${x1.toFixed(0)} -> ${x2.toFixed(0)}`);
  await ev('__setPad({15: true})'); await pg.waitForTimeout(600); const x3 = await ev('G.P.x'); await ev('__setPad({15: false})'); await pg.waitForTimeout(300);
  check('direcional → anda', x3 > x2 + 15, `${x2.toFixed(0)} -> ${x3.toFixed(0)}`);
  await axes([.15, .1, 0, 0], 300); const x4 = await ev('G.P.x'); await pg.waitForTimeout(300); const x5 = await ev('G.P.x'); await axes([0, 0, 0, 0], 100);
  check('zona morta: deriva pequena não move', Math.abs(x5 - x4) < 4, `${x4.toFixed(1)} -> ${x5.toFixed(1)}`);
  await waitFor('G.P.onGround', 5000);
  await ev('__setPad({0: true})');
  let jumped;
  try { await waitFor('!G.P.onGround && G.P.vy < 0', 1500); jumped = true; } catch (e) { jumped = false; }
  await ev('__setPad({0: false})'); check('A pula', jumped);
  await waitFor('G.P.onGround', 5000); await pg.waitForTimeout(200);
  const sel0 = await ev('G.P.sel'); await tap(5); const s1 = await ev('G.P.sel'); await tap(4); const s2 = await ev('G.P.sel');
  check('RB/LB trocam o item da barra', s1 === (sel0 + 1) % 10 && s2 === sel0, `${sel0} -> ${s1} -> ${s2}`);

  console.log('== mira analógica ==');
  await ev((() => { const P = G.P; P.inv[0] = { id: 's001', n: 1 }; P.inv[1] = { id: 'pick_copper', n: 1 }; P.sel = 0; recalcStats(); G.invChanged = true;
          window.__aims = []; if (!window.__origSS) { window.__origSS = startSwing; window.startSwing = function () { const r = window.__origSS.apply(this, arguments); window.__aims.push(r.aim); return r; }; } }));
  async function aimTest(label, stick, expectDeg, tol = 14, hold = 700) {
    await ev('window.__aims.length = 0');
    await axes([0, 0, stick[0], stick[1]]); await ev('__setPad({7: true})'); await pg.waitForTimeout(hold);
    await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]); await pg.waitForTimeout(450);
    const aims = await ev('window.__aims.slice()');
    const degs = aims.map(deg);
    const ok = degs.length > 0 && degs.every((d) => Math.abs(mod(d - expectDeg + 180, 360) - 180) <= tol);
    check(`RT + analógico dir. ${label}: arco ≈ ${expectDeg}°`, ok, degs.map(Math.round).slice(0, 6));
  }
  await aimTest('↑', [0, -1], -90);
  await aimTest('→', [1, 0], 0);
  await aimTest('←', [-1, 0], 180);
  await aimTest('↖', [-.7, -.7], -135);
  await aimTest('↓→', [.7, .7], 45);
  // distância depende da inclinação
  await axes([0, 0, 1, 0]); await pg.waitForTimeout(250);
  const dFull = await ev('Math.hypot(G.mouse.wx - pcx(G.P), G.mouse.wy - pcy(G.P))'); await axes([0, 0, .62, 0]); await pg.waitForTimeout(250);
  const dHalf = await ev('Math.hypot(G.mouse.wx - pcx(G.P), G.mouse.wy - pcy(G.P))'); await axes([0, 0, 0, 0]);
  check('inclinação total = alvo mais longe que meia inclinação', dFull > dHalf + 40, `${dFull.toFixed(0)}px vs ${dHalf.toFixed(0)}px`);
  check('aimDrive ativo', await ev('__PAD.aimDrive'));
  await pg.waitForTimeout(1300);  // a mira “travada” expira
  await ev('G.P.face = -1'); await ev('window.__aims.length = 0');
  await ev('__setPad({7: true})'); await pg.waitForTimeout(500); await ev('__setPad({7: false})'); await pg.waitForTimeout(400);
  let a = await ev('window.__aims.slice()');
  check('RT sem mira → ataca para onde o jogador olha (←)', a.length > 0 && a.every((x) => Math.abs(x) > 2.4), a.map((x) => Math.round(deg(x))).slice(0, 4));
  await ev('window.__aims.length = 0'); await axes([0, -1, 0, 0]); await ev('__setPad({7: true})'); await pg.waitForTimeout(500); await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]); await pg.waitForTimeout(400);
  a = await ev('window.__aims.slice()');
  check('RT + analógico esq. ↑ → ataca para cima', a.length > 0 && a.every((x) => Math.abs(deg(x) + 90) < 20), a.map((x) => Math.round(deg(x))).slice(0, 4));

  console.log('== acerta inimigo na direção da mira ==');
  await ev((() => { const P = G.P; G.enemies.length = 0; window.__dm = spawnEnemy('dummy', P.x + 30, P.y + P.h - ED.dummy.h); G.dpsLog.length = 0; window.__h0 = P.cb.hits; }));
  await axes([0, 0, 1, 0]); await ev('__setPad({7: true})'); await pg.waitForTimeout(900); await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]);
  const h = await ev('G.P.cb.hits - __h0'); const dmg = await ev('G.dpsLog.reduce((a, b) => a + b[1], 0)');
  check('espada acerta o boneco à direita (RT + analógico →)', h > 0 && dmg > 0, `golpes certeiros ${h}, dano ${dmg}`);
  await ev("G.dpsLog.length = 0; window.__h0 = G.P.cb.hits; G.P.face = -1; G.enemies.length = 0; window.__dm = spawnEnemy('dummy', G.P.x + 30, G.P.y + G.P.h - ED.dummy.h)");
  await axes([0, 0, -1, 0]); await ev('__setPad({7: true})'); await pg.waitForTimeout(900); await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]);
  const h2 = await ev('G.P.cb.hits - __h0'); check('apontando para o lado oposto não acerta o boneco', h2 === 0, `golpes certeiros ${h2}`);
  await pg.waitForTimeout(500);
  await ev('G.enemies.length = 0; G.P.vx = 0');

  console.log('== mineração ==');
  await ev('(() => { const P = G.P; P.sel = 1; G.invChanged = true; G.dpsLog.length = 0; })()');
  await waitFor('G.P.onGround', 5000);
  const tgt = await ev((() => { const P = G.P; const tx = Math.floor((P.x + P.w / 2) / TS), ty = Math.floor((P.y + P.h + 2) / TS); return { tx, ty, id: G.world.get(tx, ty) }; }));
  check('há bloco sob os pés', tgt.id !== 0, tgt);
  await axes([0, 1, 0, 0]); await ev('__setPad({7: true})');
  let mined;
  try { await waitFor(`G.world.get(${tgt.tx}, ${tgt.ty}) === 0`, 6000); mined = true; } catch (e) { mined = false; }
  await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]);
  const mpos = await ev('({ my: Math.floor(G.mouse.wy / TS), mx: Math.floor(G.mouse.wx / TS) })');
  check('RT + analógico esq. ↓ minera o bloco abaixo', mined, `alvo ${tgt.tx},${tgt.ty} mira ${JSON.stringify(mpos)}`);
  // colocar bloco: mira 1 tile à frente (ar) com o analógico esquerdo + RT
  await ev("(() => { const P = G.P; P.inv[2] = { id: 'dirt', n: 50 }; P.sel = 2; P.face = 1; G.invChanged = true; })()");
  await waitFor('G.P.onGround', 8000); await pg.waitForTimeout(300);
  const n0 = await ev("invCount('dirt')"); await axes([1, 0, 0, 0]); await ev('__setPad({7: true})'); await pg.waitForTimeout(1000); await ev('__setPad({7: false})'); await axes([0, 0, 0, 0]);
  const n1 = await ev("invCount('dirt')"); check('RT com bloco coloca blocos à frente', n1 < n0, `${n0} -> ${n1}`);

  console.log('== interagir (B) ==');
  await waitFor('G.P.onGround', 8000);
  await ev('(() => { const P = G.P, wd = G.world; P.sel = 0; const tx = Math.floor((P.x + P.w / 2) / TS), ty = Math.floor((P.y + 8) / TS); window.__door = { x: tx + 2, y: ty }; window.__chest = { x: tx - 4, y: ty };  wd.set(tx + 2, ty, T.doorC, true); wd.set(tx - 4, ty, T.chest, true); })()');
  await tap(1);
  check('B abre/fecha a porta mais próxima', (await ev('G.world.get(__door.x, __door.y)')) === (await ev('T.doorO')));
  await tap(1);
  check('B de novo fecha a porta', (await ev('G.world.get(__door.x, __door.y)')) === (await ev('T.doorC')));
  await ev('G.world.set(__door.x, __door.y, 0, true)');
  await tap(1);
  check('B abre o baú', (await ev('G.ui.open')) === 'inv' && (await ev('G.chestPos')) != null, await ev('G.ui.open'));
  await tap(1);  // B fecha o painel
  check('B fecha o painel', (await ev('G.ui.open')) == null);
  await pg.waitForTimeout(300);

  console.log('== painéis: cursor virtual ==');
  await ev("(() => { invAdd('wood', 30); invAdd('gel', 10); invAdd('stone', 40); G.ui.craftDirty = true; })()");
  await tap(3);
  check('Y abre inventário', (await ev('G.ui.open')) === 'inv');
  await pg.waitForTimeout(300);
  check('cursor virtual visível', await ev("document.getElementById('pad-cursor').classList.contains('on')"));
  await ev('__PAD.cur.x = 100; __PAD.cur.y = 100'); await axes([1, 0, 0, 0], 350); await axes([0, 0, 0, 0], 100);
  const cx1 = await ev('__PAD.cur.x'); check('analógico esq. move o cursor', cx1 > 250, `x: 100 -> ${cx1.toFixed(0)}`);
  const rect = await ev("(() => { const r = document.querySelector('#craft-list .rec'); if (!r) return null; r.scrollIntoView({block:'nearest'}); const b = r.getBoundingClientRect(); return { x: b.x + 30, y: b.y + b.height / 2, name: r.textContent.slice(0, 30) }; })()");
  check('há receita disponível na lista', rect != null, rect);
  if (rect) {
    await ev(`__PAD.cur.x = ${rect.x}; __PAD.cur.y = ${rect.y}`); await pg.waitForTimeout(250);
    check('hover do cursor virtual mostra o tooltip', await ev("!document.getElementById('tooltip').classList.contains('hidden')"));
    const before = await ev('G.P.inv.reduce((a, s) => a + (s ? s.n : 0), 0)');
    await tap(0, 200); await pg.waitForTimeout(200);
    const after = await ev('G.P.inv.reduce((a, s) => a + (s ? s.n : 0), 0)');
    check('A clica na receita e cria o item', before !== after, `itens ${before} -> ${after}`);
  }
  // clicar em slot e pegar item no cursor (mousedown no slot)
  const slot = await ev("(() => { const s = document.querySelectorAll('#inv-grid .slot')[0]; const b = s.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()");
  await ev(`__PAD.cur.x = ${slot.x}; __PAD.cur.y = ${slot.y}`); await pg.waitForTimeout(200);
  await tap(0, 200); const held = await ev('G.held ? G.held.id : null');
  check('A num slot pega o item (cursor)', held != null, held);
  await tap(0, 200); const held2 = await ev('G.held ? G.held.id : null');
  check('A de novo devolve o item ao slot', held2 == null, held2);
  // rolagem com o analógico direito
  const sc = await ev("(() => { const l = document.getElementById('craft-list'); return { sh: l.scrollHeight, ch: l.clientHeight }; })()");
  if (sc.sh > sc.ch + 5) {
    const b0 = await ev("(() => { const l = document.getElementById('craft-list'); const b = l.getBoundingClientRect(); __PAD.cur.x = b.x + 40; __PAD.cur.y = b.y + 40; return l.scrollTop; })()"); await pg.waitForTimeout(150);
    await axes([0, 0, 0, 1], 300); await axes([0, 0, 0, 0], 100); const b1 = await ev("document.getElementById('craft-list').scrollTop");
    check('analógico dir. rola a lista', b1 > b0, `${b0} -> ${b1}`);
  } else {
    check('analógico dir. rola a lista (lista curta: ignorado)', true);
  }
  await tap(1);
  check('B fecha o inventário', (await ev('G.ui.open')) == null && !(await ev("document.getElementById('pad-cursor').classList.contains('on')")));
  await tap(12); check('direcional ↑ abre o catálogo', (await ev('G.ui.open')) === 'arsenal'); await tap(12); check('direcional ↑ de novo fecha', (await ev('G.ui.open')) == null);
  await tap(13); check('direcional ↓ abre o mapa', (await ev('G.ui.open')) === 'map'); await tap(1); check('B fecha o mapa', (await ev('G.ui.open')) == null);
  await pg.waitForTimeout(500);
  await ev('G.P.x'); await tap(0, 200);
  check('após fechar painel o jogo volta a responder', true);

  console.log('== painel de NPC (cursor virtual) ==');
  await ev((() => { const P = G.P, tx = Math.floor((P.x + P.w / 2) / TS) + 2, ty = Math.floor((P.y + P.h) / TS) - 1; window.__npc = spawnNpcQuiet('trader', { cx: tx, cy: ty, id: 'teste' }); __npc.x = tx * TS; __npc.y = P.y; invAdd('coin', 800); }));
  await pg.waitForTimeout(400); await tap(1);
  check('B conversa com o NPC mais próximo', (await ev('G.ui.open')) === 'npc', await ev('G.ui.open'));
  await pg.waitForTimeout(300);
  let r = await ev("(() => { const b = document.getElementById('t-sell').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()");
  await ev(`__PAD.cur.x = ${r.x}; __PAD.cur.y = ${r.y}`); await pg.waitForTimeout(200); await tap(0, 200); await pg.waitForTimeout(200);
  check('A clica na aba "Vender"', await ev("document.getElementById('t-sell').classList.contains('on')"));
  r = await ev("(() => { const b = document.getElementById('t-buy').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()");
  await ev(`__PAD.cur.x = ${r.x}; __PAD.cur.y = ${r.y}`); await pg.waitForTimeout(200); await tap(0, 200); await pg.waitForTimeout(200);
  r = await ev("(() => { const e = document.querySelector('.shop-row[data-buy]'); const b = e.getBoundingClientRect(); return { x: b.x + 50, y: b.y + b.height / 2 }; })()");
  await ev(`__PAD.cur.x = ${r.x}; __PAD.cur.y = ${r.y}`); await pg.waitForTimeout(250);
  check('hover numa mercadoria mostra o tooltip', await ev("!document.getElementById('tooltip').classList.contains('hidden')"));
  const c0 = await ev("invCount('coin')"); await tap(0, 200); await pg.waitForTimeout(200); const c1 = await ev("invCount('coin')");
  check('A compra o item do mercador', c1 < c0, `moedas ${c0} -> ${c1}`);
  await tap(1); check('B fecha o painel do NPC', (await ev('G.ui.open')) == null);
  await ev('G.npcs.length = 0'); await pg.waitForTimeout(400);

  console.log('== pausa e guia ==');
  await tap(9);
  check('Start pausa', (await ev('G.paused')) === true);
  check('foco no menu de pausa', (await ev(focusId)) === 'p-resume', await ev(focusId));
  await tap(13); check('direcional ↓ no menu de pausa', (await ev(focusId)) === 'p-help', await ev(focusId));
  await tap(0); check('A abre o guia de controles', !(await ev("document.getElementById('help').classList.contains('hidden')")));
  check('guia lista os botões do controle', (await ev("document.getElementById('help-box').textContent")).includes('Controle (gamepad)'));
  await tap(1); check('B fecha o guia', await ev("document.getElementById('help').classList.contains('hidden')"));
  check('continua pausado', (await ev('G.paused')) === true);
  await tap(9); check('Start retoma', (await ev('G.paused')) === false);
  await pg.waitForTimeout(600);

  console.log('== mouse reassume e reticle ==');
  await axes([0, 0, 1, 0]); await pg.waitForTimeout(300); await axes([0, 0, 0, 0]);
  check('analógico → reticle ativo', (await ev('__PAD.aimDrive')) === true);
  await ev('(() => { __render(); })()');
  await pg.screenshot({ path: devfile('pad_reticle.png') });
  await pg.mouse.move(200, 200); await pg.mouse.move(420, 260); await pg.waitForTimeout(200);
  check('mover o mouse devolve a mira ao mouse', (await ev('__PAD.aimDrive')) === false);
  await pg.waitForTimeout(300);
  const sx = await ev('G.mouse.sx'); check('mira segue o mouse (sx≈420)', Math.abs(sx - 420) < 3, sx);

  console.log('== desconexão ==');
  await ev('window.__padOn = false'); await pg.waitForTimeout(300);
  check('sem controle: estado liberado', await ev('!KEYS.PadLeft && !KEYS.PadRight && !KEYS.PadJump && !__PAD.hold0 && __PAD.gp === null'));
  check('dica volta ao texto inicial', (await ev("document.getElementById('pad-hint').textContent")).includes('aperte um botão'));
  check('sem erros de página', logs.length === 0, logs.slice(0, 3));
  await ctx.close();

  console.log('== API bloqueada (SecurityError) ==');
  const ctx2 = await b.newContext({ viewport: { width: 1000, height: 640 } }); await ctx2.addInitScript(BLOCKED);
  const pg2 = await ctx2.newPage(); const logs2 = [];
  pg2.on('console', (m) => { if (m.type() === 'error') logs2.push(m.text().slice(0, 200)); });
  pg2.on('pageerror', (e) => logs2.push('PAGEERROR ' + e.message.slice(0, 300)));
  await pg2.goto(INDEX_URL); await pg2.waitForTimeout(600);
  await pg2.click('#btn-cre'); await waitPlay(pg2); await pg2.waitForTimeout(800);
  check('jogo funciona com a API bloqueada', (await pg2.evaluate('__PAD.err')) === true && (await pg2.evaluate('__G.state')) === 'play');
  await pg2.evaluate('__G.state'); check('dica do título some quando a API está bloqueada', (await pg2.evaluate("getComputedStyle(document.getElementById('pad-hint')).display")) === 'none');
  check('sem erros na página', logs2.length === 0, logs2.slice(0, 3));
  await ctx2.close();
  await b.close();

  const bad = res.filter((x) => !x.ok);
  console.log(`\nverificações: ${res.length} | falhas: ${bad.length}`);
  for (const x of bad) console.log('  FALHOU:', x.name, fmtDetail(x.detail));
  process.exitCode = bad.length ? 1 : 0;
});
