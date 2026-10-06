'use strict';
// Capturas do suporte a controle (usa gamepad simulado). Saída padrão: docs/img/09_controle.png
//   node dev/shots_gamepad.js [SAIDA.png]
const fs = require('fs');
const path = require('path');
const { launch, INDEX_URL, ROOT, devfile, run, waitPlay, makeSheet } = require('./lib');
const { MOCK } = require('./gamepad_mock');

const OUT = process.argv[2] || path.join(ROOT, 'docs', 'img', '09_controle.png');

run(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(MOCK);
  const pg = await ctx.newPage(); const ev = (...args) => pg.evaluate(...args); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 300)));
  const shots = [];
  const snap = async (name) => {
    const png = await pg.screenshot(); fs.writeFileSync(devfile(`pad_${shots.length}_${name}.png`), png);   // quadro inteiro (temporário, ignorado pelo git)
    shots.push({ png, size: [640, 360], label: name, barH: 14 });
  };
  const tap = async (i, ms = 150) => {
    await ev(`__setPad({${i}: true})`); await pg.waitForTimeout(ms); await ev(`__setPad({${i}: false})`); await pg.waitForTimeout(ms);
  };
  await pg.goto(INDEX_URL); await pg.waitForTimeout(900);
  await tap(0); await tap(13); await pg.waitForTimeout(200); await snap('titulo com foco do controle');
  await tap(12); await pg.fill('#seed', '31337'); await tap(0);
  await waitPlay(pg); await pg.waitForTimeout(1000);
  await ev((() => { const P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.time = .3; document.getElementById('toasts').innerHTML = '';
          P.inv[0] = { id: 's113', n: 1 }; P.sel = 0; recalcStats(); G.invChanged = true;
          const mk = (k, dx) => spawnEnemy(k, P.x + dx, P.y + P.h - ED[k].h); mk('zombie', 150); mk('slime_blue', 105); mk('skeleton', 230); mk('zombie', -120); }));
  await ev('__setPad({7: true}, [0, 0, .85, -.5])'); await pg.waitForTimeout(330);
  await ev('__setPad({}, [0, 0, .85, -.5])'); await snap('mira analogica + golpe');
  await ev('__setPad({7: false}, [0, 0, .85, -.15])'); await pg.waitForTimeout(250); await snap('reticle (analogico dir.)');
  await ev('__setPad({7: false}, [0, 0, 0, 0])');
  await ev("(() => { invAdd('wood', 30); invAdd('gel', 10); invAdd('stone', 40); invAdd('torch', 5); G.ui.craftDirty = true; })()");
  await tap(3); await pg.waitForTimeout(300);
  const r = await ev("(() => { const r = document.querySelector('#craft-list .rec'); const b = r.getBoundingClientRect(); return { x: b.x + 40, y: b.y + b.height / 2 }; })()");
  await ev(`__PAD.cur.x = ${r.x}; __PAD.cur.y = ${r.y}`); await pg.waitForTimeout(300); await snap('inventario: cursor virtual + tooltip');
  await tap(1); await tap(9); await pg.waitForTimeout(200);
  await tap(13); await tap(0); await pg.waitForTimeout(300);
  await pg.evaluate("document.getElementById('help-box').scrollTop = 99999"); await pg.waitForTimeout(200); await snap('guia: controle (gamepad)');
  fs.writeFileSync(OUT, await makeSheet(b, shots.slice(0, 4), { cols: 2, cellW: 640, cellH: 360 }));
  console.log('salvo em', OUT, '| erros:', errs);
  await b.close();
});
