'use strict';
// Controles de toque: liga/desliga, direcional, botão de ação com mira por arrasto, pulo,
// painéis, fechar, zoom, cura rápida e "Interagir". Uso: node dev/test_touch.js
const { launch, INDEX_URL, run, startWorld, collectErrors } = require('./lib');
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FALHOU:', m); } };

run(async () => {
  const b = await launch();
  // ---------- 1) desktop com mouse: toque desligado, mas dá para forçar pelo menu de pausa ----------
  {
    const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = collectErrors(pg);
    await pg.goto(INDEX_URL); await pg.waitForTimeout(500);
    ok(await pg.evaluate(() => document.getElementById('touch').classList.contains('hidden')), 'título: #touch escondido');
    await startWorld(pg, 21, 'btn-adv'); await pg.waitForTimeout(500);
    ok(await pg.evaluate(() => document.getElementById('touch').classList.contains('hidden')), 'desktop: #touch escondido por padrão');
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
    ok(/automático/.test(await pg.textContent('#p-touch')), 'rótulo inicial: automático');
    const vis = () => pg.evaluate(() => !document.getElementById('touch').classList.contains('hidden') && document.body.classList.contains('touch-on'));
    const store = () => pg.evaluate(() => localStorage.getItem('espadas120_touch'));
    await pg.click('#p-touch'); await pg.waitForTimeout(150);
    ok(/ligado/.test(await pg.textContent('#p-touch')) && await vis() && await store() === 'on', 'pausa -> ligado: controles aparecem e o modo é salvo');
    await pg.click('#p-touch'); await pg.waitForTimeout(150);
    ok(/desligado/.test(await pg.textContent('#p-touch')) && !(await vis()) && await store() === 'off', 'pausa -> desligado: controles somem');
    await pg.click('#p-touch'); await pg.waitForTimeout(150);
    ok(/automático/.test(await pg.textContent('#p-touch')) && !(await vis()) && await store() === 'auto', 'pausa -> automático: some no desktop');
    await pg.click('#p-resume');
    ok(!errs.length, 'desktop sem erros: ' + errs.slice(0, 2));
    await pg.close();
  }
  // ---------- 2) celular: toque liga sozinho ----------
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errs = collectErrors(pg);
  const cdp = await ctx.newCDPSession(pg);
  const T_ = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: (pts || []).map(p => ({ x: p.x, y: p.y, id: p.id || 1 })) });
  const rect = (sel) => pg.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }, sel);
  const tap = async (sel) => { const r = await rect(sel); await T_('touchStart', [{ x: r.x, y: r.y }]); await T_('touchEnd'); await pg.waitForTimeout(160); };
  await pg.goto(INDEX_URL); await pg.waitForTimeout(700);
  ok(await pg.evaluate(() => document.getElementById('touch').classList.contains('hidden')), 'celular: título sem controles');
  await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(() => !document.getElementById('touch').classList.contains('hidden') && document.body.classList.contains('touch-on')), 'celular: controles ligam sozinhos ao jogar');
  const info = await pg.evaluate(() => ({ DPR, PIXZ, zoom: G.cam.zoom, LW, LH }));
  ok(info.DPR === 2 && info.PIXZ === 2 && info.zoom === 2 && info.LW === 844 && info.LH === 390, 'pixels inteiros no celular: ' + JSON.stringify(info));

  // direcional: direita / esquerda / cima (pulo)
  const jb = await rect('#tj-base');
  for (const [name, dx, dy, key] of [['direita', .42, 0, 'KeyD'], ['esquerda', -.42, 0, 'KeyA']]) {
    const x0 = await pg.evaluate(() => G.P.x);
    await T_('touchStart', [{ x: jb.x, y: jb.y }]); await T_('touchMove', [{ x: jb.x + jb.w * dx, y: jb.y + jb.h * dy }]);
    await pg.waitForTimeout(600);
    const s = await pg.evaluate((k) => ({ x: G.P.x, on: KEYS[k], other: KEYS.KeyA && KEYS.KeyD }), key);
    ok(s.on && !s.other, 'direcional ' + name + ': tecla ' + key);
    ok(name === 'direita' ? s.x > x0 + 15 : s.x < x0 - 15, 'direcional ' + name + ': jogador andou (' + Math.round(s.x - x0) + 'px)');
    await T_('touchEnd'); await pg.waitForTimeout(200);
    ok(await pg.evaluate(() => !KEYS.KeyA && !KEYS.KeyD && !KEYS.KeyW), 'direcional solto: teclas liberadas');
  }
  {
    const y0 = await pg.evaluate(() => G.P.y);
    await T_('touchStart', [{ x: jb.x, y: jb.y }]); await T_('touchMove', [{ x: jb.x, y: jb.y - jb.h * .45 }]);
    await pg.waitForTimeout(250);
    const hi = await pg.evaluate(() => ({ w: KEYS.KeyW, y: G.P.y }));
    ok(hi.w && hi.y < y0 - 6, 'direcional para cima = pulo (' + Math.round(y0 - hi.y) + 'px)');
    await T_('touchEnd'); await pg.waitForTimeout(900);
  }
  // botão de pulo
  {
    const jr = await rect('#tb-jump'); const y0 = await pg.evaluate(() => G.P.y);
    await T_('touchStart', [{ x: jr.x, y: jr.y, id: 3 }]); await pg.waitForTimeout(220);
    const s = await pg.evaluate(() => ({ sp: KEYS.Space, y: G.P.y }));
    ok(s.sp && s.y < y0 - 6, 'botão de pulo: Space e subida (' + Math.round(y0 - s.y) + 'px)');
    await T_('touchEnd'); await pg.waitForTimeout(100);
    ok(await pg.evaluate(() => !KEYS.Space), 'botão de pulo solto');
    await pg.waitForTimeout(800);
  }
  // botão de ação: segurar usa o item; arrastar mira (ângulo e distância)
  {
    const ar = await rect('#tb-atk');
    const aim = () => pg.evaluate(() => { const P = G.P, c = G.cam; return { dx: G.mouse.sx * DPR / c.zoom + c.x - pcx(P), dy: G.mouse.sy * DPR / c.zoom + c.y - (pcy(P) - 2), down: G.mouse.down[0] }; });
    await T_('touchStart', [{ x: ar.x, y: ar.y, id: 4 }]); await pg.waitForTimeout(120);
    let a = await aim(); ok(a.down, 'botão de ação segurado: botão esquerdo virtual ativo');
    ok(Math.abs(a.dy) < 6 && Math.abs(a.dx) > 40, 'sem arrastar: mira à frente (dx=' + Math.round(a.dx) + ')');
    await T_('touchMove', [{ x: ar.x + 70, y: ar.y - 70, id: 4 }]); await pg.waitForTimeout(150);
    a = await aim(); ok(a.dx > 30 && a.dy < -30, 'arrastar para cima-direita mira para cima-direita (' + Math.round(a.dx) + ',' + Math.round(a.dy) + ')');
    await T_('touchMove', [{ x: ar.x - 70, y: ar.y + 70, id: 4 }]); await pg.waitForTimeout(150);
    a = await aim(); ok(a.dx < -30 && a.dy > 30, 'arrastar para baixo-esquerda mira para lá (' + Math.round(a.dx) + ',' + Math.round(a.dy) + ')');
    const sw = await pg.evaluate(() => G.P.cb.swingT > 0 || G.P.armT > 0 || G.P.cb.inst.length > 0);
    ok(sw, 'o golpe começou ao segurar o botão');
    await T_('touchEnd'); await pg.waitForTimeout(100);
    ok(!(await aim()).down, 'soltar o botão de ação solta o botão virtual');
  }
  // dois dedos ao mesmo tempo: andar + atacar
  {
    const x0 = await pg.evaluate(() => G.P.x), ar = await rect('#tb-atk');
    await T_('touchStart', [{ x: jb.x, y: jb.y, id: 5 }]); await T_('touchMove', [{ x: jb.x + jb.w * .42, y: jb.y, id: 5 }]);
    await T_('touchStart', [{ x: jb.x + jb.w * .42, y: jb.y, id: 5 }, { x: ar.x, y: ar.y, id: 6 }]); await pg.waitForTimeout(500);
    const s = await pg.evaluate(() => ({ x: G.P.x, d: KEYS.KeyD, a: G.mouse.down[0] }));
    ok(s.d && s.a && s.x > x0 + 10, 'multitoque: andar e atacar juntos');
    await T_('touchEnd'); await pg.waitForTimeout(200);
    ok(await pg.evaluate(() => !KEYS.KeyD && !G.mouse.down[0]), 'multitoque solto');
  }
  // painéis e fechar
  {
    await tap('#tb-inv'); ok(await pg.evaluate(() => G.ui.open === 'inv'), 'botão inventário abre');
    ok(await pg.evaluate(() => document.getElementById('touch').classList.contains('ui-open')), 'painel aberto: modo ui-open');
    ok(await pg.evaluate(() => getComputedStyle(document.getElementById('tb-atk')).display === 'none' && getComputedStyle(document.getElementById('tb-close')).display !== 'none'), 'painel aberto: ação some e fechar aparece');
    await tap('#tb-close'); ok(await pg.evaluate(() => G.ui.open === null), 'botão fechar fecha o inventário');
    await tap('#tb-ars'); ok(await pg.evaluate(() => G.ui.open === 'arsenal'), 'botão arsenal abre'); await tap('#tb-close');
    await tap('#tb-map'); ok(await pg.evaluate(() => G.ui.open === 'map'), 'botão mapa abre'); await tap('#tb-close');
    ok(await pg.evaluate(() => G.ui.open === null && !document.getElementById('touch').classList.contains('ui-open')), 'tudo fechado: controles voltam');
    // toque na barra de itens troca o item
    const r = await pg.evaluate(() => { const e = document.querySelectorAll('#hotbar .slot')[4].getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; });
    await T_('touchStart', [{ x: r.x, y: r.y }]); await T_('touchEnd'); await pg.waitForTimeout(200);
    ok(await pg.evaluate(() => G.P.sel === 4), 'tocar num espaço da barra seleciona o item (sel=' + await pg.evaluate(() => G.P.sel) + ')');
  }
  // zoom
  {
    const z0 = await pg.evaluate(() => PIXZ); await tap('#tb-zi');
    const z1 = await pg.evaluate(() => ({ p: PIXZ, z: G.cam.zoom, lw: LW })); ok(z1.p === z0 + 1 && z1.z === z1.p, 'zoom +: PIXZ ' + z0 + ' -> ' + z1.p);
    await tap('#tb-zo'); await tap('#tb-zo'); const z2 = await pg.evaluate(() => PIXZ); ok(z2 === z0 - 1, 'zoom -: PIXZ ' + z2);
    await tap('#tb-zi'); ok(await pg.evaluate(() => PIXZ) === z0, 'zoom volta ao normal');
  }
  // cura rápida
  {
    const h = await pg.evaluate(() => { const it = Object.values(IT).find(i => i.use === 'heal'); invAdd(it.id, 3); G.P.hp = 20; G.P.potionCd = 0; return G.P.hp; });
    await tap('#tb-heal'); await pg.waitForTimeout(200);
    ok(await pg.evaluate((h) => G.P.hp > h, h), 'cura rápida usa uma poção');
  }
  // interagir
  {
    await tap('#tb-use'); await pg.waitForTimeout(150);
    ok(await pg.evaluate(() => G.ui.open === null), 'interagir sem nada por perto não abre nada');
    await pg.evaluate(() => { const P = G.P, tx = Math.floor(pcx(P) / TS) + 2, ty = Math.floor((P.y + P.h - 2) / TS); G.world.set(tx, ty, T.chest); });
    await tap('#tb-use'); await pg.waitForTimeout(200);
    ok(await pg.evaluate(() => G.ui.open === 'inv' && !!G.chestSlots), 'interagir abre o baú mais perto');
    await tap('#tb-close');
  }
  // pausa
  await tap('#tb-pause'); ok(await pg.evaluate(() => G.paused && !document.getElementById('pause').classList.contains('hidden')), 'botão pausa abre o menu');
  await pg.click('#p-resume'); await pg.waitForTimeout(150);
  ok(!errs.length, 'celular sem erros: ' + errs.slice(0, 3));
  await ctx.close(); await b.close();
  console.log(`test_touch: ${total - fails}/${total} verificações ok`);
  process.exit(fails ? 1 : 0);
});
