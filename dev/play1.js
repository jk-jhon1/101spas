'use strict';
// Partida real de ponta a ponta: node dev/play1.js [btn-cre | btn-adv]
const { launch, INDEX_URL, devfile, run, waitPlay } = require('./lib');

const MODE = process.argv[2] || 'btn-cre';

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  pg.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  pg.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  await pg.goto(INDEX_URL);
  await pg.evaluate(() => { window.__nextSeed = 12345; });
  const t0 = Date.now();
  await pg.click('#' + MODE);
  await waitPlay(pg);
  console.log(`world ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: devfile('shot_play1.png') });
  console.log(logs.slice(0, 40).join('\n') || 'no console output');
  console.log('lastErr', await pg.evaluate('window.__lastErr'));
  console.log(await pg.evaluate('JSON.stringify({x:__G.P.x,y:__G.P.y,hp:__G.P.hp,inv:__G.P.inv.slice(0,10).map(s=>s&&s.id)})'));
  await b.close();
});
