'use strict';
// Capturas do menu com mundos salvos: cria alguns mundos de verdade pelos botões (sementes sorteadas pelo jogo) e fotografa
// o menu do título (com "Continuar") e a tela "Meus Mundos".
//   node dev/shots_menu_mundos.js [PASTA]        (padrão: docs/img -> 01_menu.png e 10_meus_mundos.png)
const fs = require('fs');
const path = require('path');
const { launch, INDEX_URL, ROOT, run, waitPlay } = require('./lib');

const OUT = process.argv[2] || path.join(ROOT, 'docs', 'img');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await pg.goto(INDEX_URL); await pg.waitForTimeout(900);
  // quatro mundos: modos alternados e um pouco de progresso (o que o Arsenal / o jogo normal produzem)
  const prog = [{ day: 6, stage: 1, eye: true }, { day: 1, stage: 0 }, { day: 14, stage: 2, eye: true, guardian: true }, { day: 3, stage: 0 }];
  for (let i = 0; i < prog.length; i++) {
    await pg.click(i % 2 === 0 ? '#btn-adv' : '#btn-cre'); await waitPlay(pg); await pg.waitForTimeout(500);
    await pg.evaluate((p) => { G.opts.noSpawn = true; G.day = p.day; G.stage = p.stage; if (p.eye) G.flags.eye = true; if (p.guardian) G.flags.guardian = true; G.t = p.day * 420 * 0.8; }, prog[i]);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
    await pg.click('#p-menu'); await pg.waitForFunction('G.state === "title"', null, { timeout: 15000 }); await pg.waitForTimeout(300);
  }
  await pg.mouse.move(5, 5); await pg.waitForTimeout(400);
  fs.writeFileSync(path.join(OUT, '01_menu.png'), await pg.screenshot());
  await pg.click('#btn-worlds'); await pg.waitForTimeout(500); await pg.mouse.move(5, 5);
  fs.writeFileSync(path.join(OUT, '10_meus_mundos.png'), await pg.screenshot());
  console.log('salvo em', OUT, '| erros:', errs);
  await b.close();
});
