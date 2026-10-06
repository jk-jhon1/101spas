'use strict';
// Fumaça: abre o jogo, captura a tela de título e mostra o que saiu no console.
const { launch, INDEX_URL, devfile, run } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  pg.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  pg.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  await pg.goto(INDEX_URL);
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: devfile('shot_title.png') });
  console.log(logs.slice(0, 30).join('\n') || 'no console output');
  console.log('state', await pg.evaluate('window.__G && window.__G.state'));
  await b.close();
});
