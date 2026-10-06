'use strict';
// 10 quadros do arco de uma espada: node dev/shots_swing.js SAIDA.png NUMERO [right|left|up|down]
const fs = require('fs');
const { launch, INDEX_URL, run, waitPlay, makeSheet } = require('./lib');

const [OUT, NUM_ARG, AIMDIR = 'right'] = process.argv.slice(2);
if (!OUT || !NUM_ARG) { console.error('uso: node dev/shots_swing.js SAIDA.png NUMERO [right|left|up|down]'); process.exit(2); }
const NUM = Number(NUM_ARG);

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '777'); await pg.click('#btn-cre');
  await waitPlay(pg);
  await pg.evaluate("document.getElementById('toasts').style.display='none'; document.getElementById('hud').style.display='none'");
  await pg.evaluate(([num, dir]) => { const sw = SWORD_BY_NUM[num], P = G.P; G.opts.god=true; G.opts.noSpawn=true; G.enemies.length=0; G.time=.3; P.x=G.world.spawn.x; P.y=G.world.spawn.y; P.vx=P.vy=0; P.cb.cd=0; P.inv[1]={id:sw.id,n:1}; P.sel=1; recalcStats(); G.cam.init=false;
          for (let i=0;i<20;i++) __step(1/60); window.__dir = dir; window.__aim = () => { const c=G.cam, P=G.P; const tx = P.x + (window.__dir==='left'?-140:140), ty = P.y + (window.__dir==='up'?-130:window.__dir==='down'?100:0) + (window.__dir==='up'?0:0); G.mouse.sx=(tx-c.x)*c.zoom/DPR; G.mouse.sy=(ty-c.y)*c.zoom/DPR; }; __aim(); G.mouse.down[0]=true; G.paused=false; }, [NUM, AIMDIR]);
  const frames = [];
  for (let i = 0; i < 10; i++) {
    await pg.evaluate('() => { for (let k=0;k<3;k++){ __aim(); __step(1/60); G.mouse.pressed=[false,false,false]; } G.paused=true; __render(); }');
    await pg.waitForTimeout(40);
    const png = await pg.screenshot();
    const W = 960, H = 540;
    frames.push({ png, crop: [W / 2 - 120, H / 2 - 130, 270, 200] });   // recorte 270x200 em volta do jogador
    await pg.evaluate('G.paused=false');
  }
  const cols = 5, rows = 2;
  fs.writeFileSync(OUT, await makeSheet(b, frames, { cols, cellW: 270, cellH: 200 }));
  console.log([270 * cols, 200 * rows]);
  await b.close();
});
