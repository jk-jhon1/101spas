'use strict';
// Clica em (quase) tudo do Arsenal do modo Criativo: abas de espadas, itens, inimigos e mundo — sem exceções.
const { launch, INDEX_URL, run, waitPlay, collectErrors } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '4'); await pg.click('#btn-cre');
  await waitPlay(pg); await pg.waitForTimeout(400);
  const arsenalOpen = () => pg.evaluate("document.getElementById('panel-arsenal').classList.contains('hidden') === false");
  let n = 0;
  for (const tab of [9, 8, 7, 6, 0, 2, 5]) {
    for (let rep = 0; rep < 1; rep++) {
      await pg.keyboard.press('KeyB'); await pg.waitForTimeout(120);
      await pg.click(`#ars-tabs .tab >> nth=${tab}`); await pg.waitForTimeout(120);
      const sel = (tab === 8 || tab === 9) ? '#ars-body .btn, #ars-body .enemy-btn' : '#ars-body .slot';
      const cnt = await pg.locator(sel).count();
      const limit = (tab === 8 || tab === 9) ? cnt : Math.min(cnt, 25);
      for (let i = 0; i < limit; i++) {
        if (!(await arsenalOpen())) {
          await pg.keyboard.press('KeyB'); await pg.waitForTimeout(80); await pg.click(`#ars-tabs .tab >> nth=${tab}`); await pg.waitForTimeout(80);
        }
        try { await pg.locator(sel).nth(i).click({ timeout: 1500 }); n += 1; } catch (e) { /* o painel pode fechar sozinho (ex.: invocar chefe) */ }
        await pg.evaluate('G.paused=false; for (let k=0;k<20;k++) __step(1/60)');
      }
      if (await arsenalOpen()) await pg.keyboard.press('KeyB');
    }
  }
  // simula alguns frames reais depois das ações
  await pg.waitForTimeout(800);
  console.log('cliques:', n, '| estágio:', await pg.evaluate('G.stage'), '| chefe:', await pg.evaluate('G.boss && G.boss.name'), '| inimigos:', await pg.evaluate('G.enemies.length'));
  console.log('erros:', errs.slice(0, 5), await pg.evaluate('window.__lastErr'));
  await b.close();
  process.exitCode = errs.length ? 1 : 0;
});
