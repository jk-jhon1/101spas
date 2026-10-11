'use strict';
// Interface azul única (o botão "Interface" do menu de Pausa e a aparência escura foram removidos) e copas das árvores
// (05c_canopy.js: silhueta por vizinhança, contorno, tronco coberto, lote de desenho). Uso: node dev/test_skin.js
const { launch, INDEX_URL, run, startWorld, collectErrors } = require('./lib');
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FALHOU:', m); } };

run(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const pg = await ctx.newPage(); const errs = collectErrors(pg);
  const st = () => pg.evaluate(() => ({
    btn: !!document.getElementById('p-skin'), sheets: document.querySelectorAll('style').length,
    ids: !!document.getElementById('skin-blue') || !!document.getElementById('skin-dark'),
    fns: [typeof UISKIN, typeof skinApply, typeof initSkin].join('|'),
    clock: document.getElementById('clock').textContent,
    slot: (() => { const c = getComputedStyle(document.querySelector('#hotbar .slot:nth-child(2)')); return c.backgroundImage + '|' + c.backgroundColor; })(),
    panel: getComputedStyle(document.querySelector('#pause .box')).backgroundColor,
    pauseBtns: [...document.querySelectorAll('#pause .menu-btn')].map(x => x.textContent)
  }));

  // ---------- 1) uma interface só (azul), sem botão para trocar ----------
  await pg.goto(INDEX_URL); await pg.waitForTimeout(500);
  await pg.evaluate(() => { try { localStorage.setItem('espadas120_skin', 'dark'); } catch (e) { } });   // escolha antiga de quem tinha trocado para a escura
  await pg.reload(); await pg.waitForTimeout(500);
  let s = await st();
  ok(!s.btn && !s.pauseBtns.some(t => /Interface/.test(t)), 'o menu de pausa não tem mais o botão "Interface"  -> ' + JSON.stringify(s.pauseBtns));
  ok(s.pauseBtns.length === 6, 'o menu de pausa tem os 6 botões que sobraram  -> ' + JSON.stringify(s.pauseBtns));
  ok(s.sheets === 1 && !s.ids, 'uma única folha de estilo, sem as folhas "skin-blue" e "skin-dark"  -> ' + JSON.stringify([s.sheets, s.ids]));
  ok(s.fns === 'undefined|undefined|undefined', 'o código de troca de aparência não existe mais  -> ' + s.fns);
  ok(s.panel === 'rgba(26, 36, 104, 0.96)' && s.slot === 'linear-gradient(rgb(59, 76, 166), rgb(34, 47, 134))|rgba(0, 0, 0, 0)', 'painéis e barra de itens azuis, mesmo com a escolha antiga "escura" guardada no aparelho  -> ' + JSON.stringify([s.panel, s.slot]));
  await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(500);
  await pg.evaluate(() => { G.opts.noSpawn = true; G.enemies.length = 0; });
  await pg.waitForTimeout(300);
  s = await st();
  ok(/^\d+:\d\d (AM|PM) · Dia \d+ · /.test(s.clock), 'relógio de 12 h com AM/PM  -> ' + s.clock);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => document.getElementById('p-save').getBoundingClientRect().height > 20), 'o menu de pausa abre e mostra "Salvar mundo"');
  await pg.click('#p-resume'); await pg.waitForTimeout(300);

  // ---------- 2) copas das árvores ----------
  const r = await pg.evaluate(() => {
    G.opts.noSpawn = true; G.enemies.length = 0; G.opts.god = true;
    const wd = G.world, W = wd.w, H = wd.h, out = {};
    out.kinds = [CANOPY_KIND[T.leaf], CANOPY_KIND[T.leafjungle], CANOPY_KIND[T.leafsnow], CANOPY_KIND[T.trunk], CANOPY_KIND[T.palm || 0]];
    const lf = (x, y) => CANOPY_KIND[wd.t[x + y * W]] === 1;
    let inner = null, topEdge = null, far = null;
    for (let y = 20; y < H - 20 && !(inner && topEdge); y++) for (let x = 20; x < W - 20; x++) {
      if (!lf(x, y)) continue;
      let all = true; for (let j = -1; j <= 1 && all; j++) for (let i = -1; i <= 1; i++) if (!lf(x + i, y + j)) { all = false; break; }
      if (all && !inner) inner = [x, y];
      if (!topEdge && !lf(x, y - 1) && !lf(x - 1, y - 1) && !lf(x + 1, y - 1) && !lf(x, y - 2) && lf(x - 1, y) && lf(x + 1, y) && lf(x, y + 1) && lf(x - 1, y + 1) && lf(x + 1, y + 1)) topEdge = [x, y];
      if (inner && topEdge) break;
    }
    for (let x = 30; x < 80 && !far; x++) { if (!CANOPY_KIND[wd.t[x + 10 * W]] && !canopyKindAround(wd, x, 10)) far = [x, 10]; }
    const alphaOf = (tx, ty, kind) => {
      const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.translate(-tx * 16, -ty * 16);
      drawCanopyBatch(g, wd, [tx, ty, kind]); const d = g.getImageData(0, 0, 16, 16).data; let n = 0, dark = 0, h = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] === 255) { n++; const q = i - 3; h = (h * 31 + d[q] + d[q + 1] * 3 + d[q + 2] * 7) % 1000003; if (d[q] <= 8 && d[q + 1] <= 45 && d[q + 2] <= 18) dark++; }
      return { opacos: n, contorno: dark, h };
    };
    out.inner = inner; out.topEdge = topEdge;
    if (inner) out.innerA = alphaOf(inner[0], inner[1], 1);
    if (topEdge) { out.topA = alphaOf(topEdge[0], topEdge[1], 1); out.aboveA = alphaOf(topEdge[0], topEdge[1] - 1, 1); }
    out.farKind = far ? canopyKindAround(wd, far[0], far[1]) : -1;
    if (far) out.farA = alphaOf(far[0], far[1], 1);
    // um tronco coberto (folha acima) é desenhado pela copa
    let cover = null;
    for (let y = 20; y < H - 20 && !cover; y++) for (let x = 20; x < W - 20; x++) if (wd.t[x + y * W] === T.trunk && canopyTrunkKind(wd, x, y)) { cover = [x, y, canopyTrunkKind(wd, x, y)]; break; }
    out.cover = cover; if (cover) out.coverA = alphaOf(cover[0], cover[1], cover[2]);
    // repete a mesma copa (cache) e muda a vizinhança: tirar uma folha muda o desenho dos vizinhos sem erro
    if (inner) {
      const own0 = alphaOf(inner[0], inner[1], 1), idx = inner[0] + inner[1] * W, old = wd.t[idx]; wd.t[idx] = 0;
      const hole = alphaOf(inner[0], inner[1], 1); wd.t[idx] = old;
      const own1 = alphaOf(inner[0], inner[1], 1);
      out.cut = { before: own0.h, after: hole.h, back: own1.h, hole };
    }
    // geração em lote: 200 blocos de copa de uma vez, cache frio
    CANOPY.map.clear(); CANOPY.n = 0; const q = []; const x0 = inner ? inner[0] - 12 : 40, y0 = inner ? inner[1] - 6 : 40;
    for (let y = y0; y < y0 + 14; y++) for (let x = x0; x < x0 + 24; x++) if (CANOPY_KIND[wd.t[x + y * W]]) q.push(x, y, CANOPY_KIND[wd.t[x + y * W]]);
    const c2 = document.createElement('canvas'); c2.width = 24 * 16; c2.height = 14 * 16; const g2 = c2.getContext('2d'); g2.translate(-x0 * 16, -y0 * 16);
    const t0 = performance.now(); drawCanopyBatch(g2, wd, q); out.lote = { blocos: q.length / 3, ms: Math.round(performance.now() - t0), sprites: CANOPY.map.size };
    return out;
  });
  ok(r.kinds[0] === 1 && r.kinds[1] === 2 && r.kinds[2] === 3 && r.kinds[3] === 0 && r.kinds[4] === 0, 'tipos de copa: floresta 1, selva 2, neve 3; tronco e palmeira ficam de fora  -> ' + JSON.stringify(r.kinds));
  ok(r.inner && r.innerA.opacos === 256 && r.innerA.contorno === 0, 'bloco no meio da copa: 256 pixels opacos e nenhum contorno  -> ' + JSON.stringify([r.inner, r.innerA]));
  ok(r.topEdge && r.topA.opacos >= 200, 'bloco da borda superior: quase todo coberto de folhas  -> ' + JSON.stringify([r.topEdge, r.topA]));
  ok(r.topEdge && r.aboveA.opacos > 0 && r.aboveA.opacos < 128 && r.aboveA.contorno >= 8, 'bloco vazio acima da copa recebe só a faixa do contorno e as pontas das folhas  -> ' + JSON.stringify(r.aboveA));
  ok(r.farKind === 0 && r.farA.opacos === 0, 'bloco longe de qualquer copa não desenha nada  -> ' + JSON.stringify([r.farKind, r.farA]));
  ok(r.cover && r.coverA.opacos > 200, 'tronco dentro da copa fica coberto pelas folhas  -> ' + JSON.stringify([r.cover, r.coverA]));
  ok(r.cut && r.cut.before !== r.cut.after && r.cut.before === r.cut.back, 'tirar uma folha muda o desenho do bloco e recolocar devolve o mesmo desenho (cache estável)  -> ' + JSON.stringify([r.cut && r.cut.before, r.cut && r.cut.after, r.cut && r.cut.back]));
  ok(r.cut && r.cut.hole.opacos < 256 && r.cut.hole.contorno > 0, 'a folha que sumiu vira um buraco com contorno (feedback ao quebrar)  -> ' + JSON.stringify(r.cut && r.cut.hole));
  ok(r.lote.blocos > 30 && r.lote.sprites > 0 && r.lote.ms < 1500, 'lote com cache frio: ' + r.lote.blocos + ' blocos em ' + r.lote.ms + ' ms (limite 1500 ms)');

  // ---------- 3) o retângulo "DPS · Total" não existe mais (com o Boneco de Treino na tela) ----------
  const dp = await pg.evaluate(() => {
    const out = {}; G.enemies.length = 0; G.opts.noSpawn = true; G.paused = false; closePanels(true);
    const P = G.P, d = ED.dummy, dm = spawnEnemy('dummy', P.x + 40, P.y + P.h - d.h); G.dpsLog.length = 0;
    dealRaw(dm, 40, '#fff'); refreshHUD(); __render();
    out.el = !!document.getElementById('dps'); out.texto = /DPS|Total:/.test(document.body.innerText);
    out.log1 = G.dpsLog.length; G.t += 11; dealRaw(dm, 10, '#fff'); out.log2 = G.dpsLog.length;   // o registro de dano (usado pelos testes) se poda sozinho
    out.dummyVive = !dm.dead;
    let ars = ''; openPanel('arsenal'); for (const [k] of ARS_TABS) { G.ui.arsTab = k; renderArsenal(); ars += ' ' + $('ars-body').textContent; } closePanels(true);
    out.arsDps = /DPS/i.test(ars); out.arsOpcoes = /Invencível/.test(ars) && /Criação grátis/.test(ars) && /Sem spawn/.test(ars); out.dica = /não morre e mostra o dano/.test(ars);
    return out;
  });
  ok(!dp.el && !dp.texto, 'sem o retângulo "DPS (5s) · Total" mesmo com o Boneco de Treino na tela  -> ' + JSON.stringify([dp.el, dp.texto]));
  ok(dp.log1 === 1 && dp.log2 === 1 && dp.dummyVive, 'registro de dano do teste: guarda o golpe e descarta o que passou de 10 s (sem crescer para sempre)  -> ' + JSON.stringify([dp.log1, dp.log2, dp.dummyVive]));
  ok(!dp.arsDps && dp.arsOpcoes && dp.dica, 'Arsenal: sem o botão "Mostrar DPS"; as outras opções de teste e a dica do boneco continuam  -> ' + JSON.stringify([dp.arsDps, dp.arsOpcoes, dp.dica]));

  ok(errs.length === 0, 'sem erros na página  -> ' + JSON.stringify(errs.slice(0, 3)));
  console.log(`test_skin: ${total - fails}/${total} verificações ok`);
  await b.close(); process.exitCode = fails ? 1 : 0;
});
