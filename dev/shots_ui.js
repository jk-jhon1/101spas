'use strict';
// Painéis da interface (menu, arsenal, tooltip, mapa, inventário) numa folha só: grava dev/sheet_ui.png
const fs = require('fs');
const { launch, INDEX_URL, devfile, run, waitPlay, startWorld, collectErrors, makeSheet } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(1200);
  const shots = [];
  const snap = async (name) => { shots.push({ png: await pg.screenshot(), size: [683, 384], label: name, barH: 14 }); };
  await snap('menu');
  await startWorld(pg, 888, 'btn-cre'); await pg.waitForTimeout(600);
  await pg.evaluate("document.getElementById('toasts').innerHTML=''");
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(300);
  await pg.click('#ars-tabs .tab >> nth=5'); await pg.waitForTimeout(200); await snap('arsenal T6');
  await pg.click('#ars-tabs .tab >> nth=7'); await pg.waitForTimeout(200); await snap('arsenal itens');
  await pg.click('#ars-tabs .tab >> nth=8'); await pg.waitForTimeout(200); await snap('arsenal inimigos');
  await pg.click('#ars-tabs .tab >> nth=9'); await pg.waitForTimeout(200); await snap('arsenal mundo');
  // tooltip de uma espada T6
  await pg.click('#ars-tabs .tab >> nth=5'); await pg.waitForTimeout(100);
  await pg.hover('#ars-body .ars-grid .slot >> nth=19'); await pg.waitForTimeout(200); await snap('tooltip 120');
  await pg.keyboard.press('Escape'); await pg.keyboard.press('KeyM'); await pg.waitForTimeout(300); await snap('mapa');
  await pg.keyboard.press('KeyM'); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(300);
  await pg.click('#craft-tabs .tab >> nth=1'); await pg.waitForTimeout(200); await snap('inventário+espadas');
  const cols = 3, rows = Math.ceil(shots.length / cols);
  fs.writeFileSync(devfile('sheet_ui.png'), await makeSheet(b, shots, { cols, cellW: 683, cellH: 384 }));
  console.log([683 * cols, 384 * rows], errs.slice(0, 4));
  await b.close();
});
