'use strict';
const { launch, INDEX_URL, devfile, run, waitPlay, startWorld } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(INDEX_URL);
  await startWorld(pg, 777, 'btn-cre');
  const r = await pg.evaluate(() => {
          const wd = G.world, out = {}; const jx = wd.biomeSpots().jungle.x;
          out.col = []; for (const x of [-50, -20, 0, 20, 50, 100, 150].map(d => jx + d)) { const s = wd.surf[x]; out.col.push([x, s, TD[wd.t[x + s*wd.w]].k, TD[wd.t[x + (s+1)*wd.w]].k, TD[wd.t[x + (s+6)*wd.w]].k, wd.wl[x+(s+3)*wd.w], wd.skyTop[x], wd.biomeName(x)]); }
          return out; });
  console.log(JSON.stringify(r));
  await pg.evaluate("document.getElementById('toasts').style.display='none'");
  await pg.evaluate(() => { const P=G.P; G.opts.god=true; G.opts.noSpawn=true; G.time=.3; const jx=G.world.biomeSpots().jungle.x; P.x=jx*16; P.y=(G.world.surf[jx]-3)*16; P.vx=P.vy=0; G.cam.init=false; for (let i=0;i<30;i++) __step(1/60); G.paused=true; __render(); });
  await pg.waitForTimeout(80);
  await pg.screenshot({ path: devfile('shot_jungle.png') });
  await b.close();
});
