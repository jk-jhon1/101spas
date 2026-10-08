'use strict';
// Verificação ponta a ponta de uma URL do jogo (local ou publicada): carrega, salva, recarrega e continua.
//   node dev/http_check.js [url]       (padrão: http://127.0.0.1:8080/ — suba antes com: node serve.js)
const { launch, run, waitPlay, startWorld, fmtDetail } = require('./lib');

const GAME_URL = process.argv[2] || 'http://127.0.0.1:8080/';
const res = [];
function check(name, ok, detail = '') {
  res.push(!!ok);
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail !== '' ? '  -> ' + fmtDetail(detail) : ''));
}

run(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  const pg = await ctx.newPage();
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 300)));
  const resp = await pg.goto(GAME_URL);
  await pg.waitForTimeout(900);
  check('página carrega (HTTP 200)', resp.status() === 200, resp.status());
  check('título do jogo', (await pg.title()).includes('Sandbox 2D'), await pg.title());
  check('origem segura (Gamepad API e IndexedDB disponíveis)', await pg.evaluate("window.isSecureContext && typeof navigator.getGamepads === 'function' && !!window.indexedDB"));
  check('não há campo de semente', await pg.evaluate("!document.getElementById('seed')"));
  check('sem mundos salvos: botão "Continuar" oculto', await pg.evaluate("document.getElementById('btn-load').classList.contains('hidden')"));
  await startWorld(pg, 777, 'btn-adv'); await pg.waitForTimeout(800);
  await pg.evaluate("(() => { invAdd('s120', 1); G.P.sel = 5; G.P.inv[5] = { id: 's120', n: 1 }; G.invChanged = true; G.opts.noSpawn = true; })()");
  const x = await pg.evaluate('Math.round(G.P.x)');
  const saved = await pg.evaluate('saveGame()');
  check('salvar o mundo (IndexedDB)', saved === true && (await pg.evaluate('hasSave()')), `retorno=${saved}`);
  // recarregar a página -> continuar
  await pg.reload(); await pg.waitForTimeout(900);
  check('após recarregar: "Continuar" visível, com o nome do mundo', !(await pg.evaluate("document.getElementById('btn-load').classList.contains('hidden')")) && (await pg.evaluate("document.getElementById('btn-load-sub').textContent")).includes(await pg.evaluate('Worlds.list[0].name')));
  await pg.click('#btn-load');
  await waitPlay(pg); await pg.waitForTimeout(600);
  const st = await pg.evaluate('({ seed: G.seed, slot5: G.P.inv[5] && G.P.inv[5].id, x: Math.round(G.P.x), mode: G.mode })');
  check('mundo e inventário restaurados', st.seed === 777 && st.slot5 === 's120' && Math.abs(st.x - x) < 40, `${JSON.stringify(st)} (x salvo=${x})`);
  // um pouco de jogo real: andar e atacar
  await pg.keyboard.down('KeyD'); await pg.waitForTimeout(500); await pg.keyboard.up('KeyD');
  await pg.mouse.move(900, 300); await pg.mouse.down(); await pg.waitForTimeout(300); await pg.mouse.up();
  check('sem erros no console', errs.length === 0, errs.slice(0, 3));
  await b.close();
  const fails = res.filter((ok) => !ok).length;
  console.log(`\nverificações: ${res.length} | falhas: ${fails}`);
  process.exitCode = fails ? 1 : 0;
});
