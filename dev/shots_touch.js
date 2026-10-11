'use strict';
// Controles de toque num "celular" (844x390 @2x, toque emulado): jogo + inventário numa folha: node dev/shots_touch.js SAIDA.png
const fs = require('fs');
const { launch, INDEX_URL, run, startWorld, collectErrors, makeSheet } = require('./lib');
const OUT = process.argv[2];
if (!OUT) { console.error('uso: node dev/shots_touch.js SAIDA.png'); process.exit(2); }
run(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage(); const errs = collectErrors(pg);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(900);
  const shots = [];
  const snap = async (label) => shots.push({ png: await pg.screenshot(), size: [844, 390], label, barH: 14 });
  await startWorld(pg, 5, 'btn-adv'); await pg.waitForTimeout(700);
  await pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
  await snap('jogo (toque ligado sozinho)');
  await pg.evaluate(() => openPanel('inv')); await pg.waitForTimeout(400);
  await snap('inventário (botão ✕ para fechar)');
  await pg.evaluate(() => { closePanels(); G.P.inv[1] = { id: SWORD_BY_NUM[85].id, n: 1 }; G.P.sel = 1; recalcStats(); });
  await pg.waitForTimeout(300);
  fs.writeFileSync(OUT, await makeSheet(b, shots, { cols: 2, cellW: 844, cellH: 390 + 14 }));
  console.log('ok', OUT, errs.slice(0, 3));
  await b.close();
});
