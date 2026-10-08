'use strict';
const { launch, INDEX_URL, run, waitPlay, startWorld } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  await pg.goto(INDEX_URL);
  await startWorld(pg, 777, 'btn-cre');
  const r = await pg.evaluate(() => { const sw = SWORD_BY_NUM[3], P = G.P; G.opts.god=true; G.opts.noSpawn=true; G.enemies.length=0; G.time=.3; P.x=G.world.spawn.x; P.y=G.world.spawn.y; P.vx=P.vy=0; P.cb.cd=0; P.inv[1]={id:sw.id,n:1}; P.sel=1; recalcStats(); G.cam.init=false;
          for (let i=0;i<30;i++) __step(1/60);
          const aim = () => { const c=G.cam; const tx = P.x + 140, ty = P.y; G.mouse.sx=(tx-c.x)*c.zoom/DPR; G.mouse.sy=(ty-c.y)*c.zoom/DPR; }; const out=[];
          aim(); G.mouse.down[0]=true;
          for (let f=0; f<24; f++) { aim(); __step(1/60); const m = P.cb.main; const sh = shoulderOf(P); out.push({f, wx: Math.round(G.mouse.wx - sh.x), wy: Math.round(G.mouse.wy - sh.y), aimDeg: m? Math.round(m.aim*180/Math.PI): null, a: m? Math.round(m.a*180/Math.PI): null, t: m? +m.t.toFixed(3):null, dur: m? +m.dur.toFixed(3):null, side: m?m.side:null, arc: m? +m.arc.toFixed(2):null, face: P.face}); }
          return out; });
  for (const x of r) console.log(x);
  await b.close();
});
