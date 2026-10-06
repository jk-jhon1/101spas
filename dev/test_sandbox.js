'use strict';
// O jogo dentro de um <iframe sandbox="allow-scripts"> (como em visualizadores de arquivo): sem localStorage,
// o salvamento deve falhar com um aviso (toast) e sem exceção. Usa dev/host.html.
const { launch, devfile, devUrl, run } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  pg.on('console', (m) => logs.push(m.type() + ': ' + m.text().slice(0, 200)));
  pg.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message.slice(0, 300)));
  await pg.goto(devUrl('host.html')); await pg.waitForTimeout(2500);
  const fr = pg.frames()[1];
  console.log('frames:', pg.frames().map((f) => f.url())); console.log('frame url:', fr.url(), '| estado:', await fr.evaluate('window.__G && window.__G.state'));
  console.log('hasSave em sandbox:', await fr.evaluate('hasSave()'));
  await fr.click('#btn-adv'); await fr.waitForFunction('window.__G.state === "play"', null, { timeout: 90000 });
  await pg.waitForTimeout(800);
  // entra no jogo, ataca, salva (deve falhar com toast, sem exceção), abre inventário
  console.log('saveGame ->', await fr.evaluate('saveGame(false)'));
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: devfile('shot_sandbox.png') });
  console.log('toasts:', await fr.evaluate("[...document.querySelectorAll('.toast')].map(t=>t.textContent.slice(0,90))"));
  console.log('logs:', logs.filter((l) => l.toLowerCase().includes('error') || l.includes('PAGEERROR')).slice(0, 6));
  await b.close();
});
