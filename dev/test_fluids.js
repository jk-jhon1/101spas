'use strict';
// Líquidos (água + lava = obsidiana), areia que cai e plantas sem apoio, numa arena isolada no céu.
const { launch, INDEX_URL, run, waitPlay, collectErrors } = require('./lib');

const JS = () => {
  const wd = G.world, W = wd.w, out = {};
  // arena isolada em área alta do céu (y 8..24, x 40..80) — limpar tudo
  const X0 = 600, Y0 = 20;
  for (let y = Y0 - 2; y <= Y0 + 16; y++) for (let x = X0 - 2; x <= X0 + 32; x++) { wd.t[x + y * W] = 0; wd.lq[x + y * W] = 0; wd.lt[x + y * W] = 0; wd.wl[x + y * W] = 0; }
  for (let x = X0 - 1; x <= X0 + 31; x++) { wd.t[x + (Y0 + 15) * W] = T.stone; }              // piso
  for (let y = Y0; y <= Y0 + 15; y++) { wd.t[(X0 - 1) + y * W] = T.stone; wd.t[(X0 + 31) + y * W] = T.stone; } // paredes
  for (let y = Y0 + 8; y <= Y0 + 14; y++) wd.t[(X0 + 15) + y * W] = T.stone;                   // divisória
  // água à esquerda (10 colunas x 6 linhas), lava à direita
  for (let y = Y0 + 9; y <= Y0 + 14; y++) for (let x = X0; x < X0 + 15; x++) { wd.lq[x + y * W] = 255; wd.lt[x + y * W] = LIQ_WATER; }
  for (let y = Y0 + 9; y <= Y0 + 14; y++) for (let x = X0 + 16; x < X0 + 31; x++) { wd.lq[x + y * W] = 255; wd.lt[x + y * W] = LIQ_LAVA; }
  const count = (type) => { let n = 0; for (let y = Y0; y <= Y0 + 15; y++) for (let x = X0; x < X0 + 31; x++) if (wd.lq[x + y * W] && wd.lt[x + y * W] === type) n += wd.lq[x + y * W]; return Math.round(n / 255 * 10) / 10; };
  out.before = { water: count(1), lava: count(2) };
  // abre a divisória por cima: remove topo da divisória (y Y0+8 .. Y0+10)  => líquidos se encontram
  for (let y = Y0 + 8; y <= Y0 + 10; y++) wd.set(X0 + 15, y, 0);
  // acorda tudo
  for (let y = Y0 + 8; y <= Y0 + 14; y++) for (let x = X0; x < X0 + 31; x++) if (wd.lq[x + y * W]) wd.liqAct.add(x + y * W);
  // coluna extra de água caindo de cima
  for (let k = 0; k < 6; k++) { wd.lq[(X0 + 5) + (Y0 + k) * W] = 255; wd.lt[(X0 + 5) + (Y0 + k) * W] = LIQ_WATER; wd.liqAct.add((X0 + 5) + (Y0 + k) * W); }
  let obs0 = 0; for (let steps = 0; steps < 900; steps++) { wd.stepLiquids(3000); }
  let obs = 0; for (let y = Y0; y <= Y0 + 15; y++) for (let x = X0; x < X0 + 31; x++) if (wd.t[x + y * W] === T.obsidian) obs++;
  out.after = { water: count(1), lava: count(2), obsidian: obs, active: wd.liqAct.size };
  // areia: coloca 3 blocos de areia no ar (sem apoio)
  for (let k = 0; k < 3; k++) wd.set(X0 + 25, Y0 + 2 + k, T.sand);
  for (let i = 0; i < 400; i++) wd.stepFalling(100);
  let sandY = []; for (let y = Y0; y <= Y0 + 15; y++) if (wd.t[(X0 + 25) + y * W] === T.sand) sandY.push(y);
  out.sandRows = sandY;
  // planta sem apoio: grama alta sobre terra, remover terra
  wd.set(X0 + 3, Y0 + 14, T.dirt); wd.set(X0 + 3, Y0 + 13, T.tallgrass); wd.set(X0 + 3, Y0 + 14, 0);
  out.plantAfter = TD[wd.get(X0 + 3, Y0 + 13)].k;
  // tocha no ar permanece
  wd.set(X0 + 20, Y0 + 3, T.torch); out.torch = TD[wd.get(X0 + 20, Y0 + 3)].k;
  return out;
};

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '5'); await pg.click('#btn-cre');
  await waitPlay(pg);
  console.log(JSON.stringify(await pg.evaluate(JS))); console.log('erros', errs.slice(0, 3));
  await b.close();
});
