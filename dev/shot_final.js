'use strict';
const { launch, INDEX_URL, devfile, run, waitPlay } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 300)));
  await pg.goto(INDEX_URL);
  await pg.fill('#seed', '2025'); await pg.click('#btn-cre');
  await waitPlay(pg); await pg.waitForTimeout(500);
  await pg.evaluate(() => { const P=G.P; G.opts.noSpawn=true; G.time=.28; P.inv[1]={id:'s113',n:1}; P.sel=1; recalcStats(); document.getElementById('toasts').innerHTML='';
          const mk=(k,dx,o)=>{const d=ED[k]; return spawnEnemy(k,P.x+dx,P.y+P.h-d.h,o)}; mk('zombie',150); mk('slime_blue',210); mk('skeleton',260); mk('eye',190); mk('slime_green',110); G.stage=0;
          window.__aim=()=>{ const c=G.cam; G.mouse.sx=(P.x+170-c.x)*c.zoom/DPR; G.mouse.sy=(P.y-4-c.y)*c.zoom/DPR; }; G.mouse.down[0]=true; for (let i=0;i<48;i++){ __aim(); __step(1/60);} G.paused=true; __render(); });
  await pg.waitForTimeout(120);
  await pg.screenshot({ path: devfile('shot_final.png') }); console.log(errs);
  await b.close();
});
