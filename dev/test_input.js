'use strict';
// Entrada real de teclado e mouse: andar, pular, minerar, colocar bloco, inventário/crafting, catálogo e mapa.
const { launch, INDEX_URL, devfile, run, waitPlay, startWorld, collectErrors } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = collectErrors(pg);
  await pg.goto(INDEX_URL);
  await startWorld(pg, 2024, 'btn-adv');
  await pg.waitForTimeout(1200);
  const st = () => pg.evaluate("JSON.stringify({x:Math.round(__G.P.x),y:Math.round(__G.P.y),vy:Math.round(__G.P.vy),g:__G.P.onGround,hp:__G.P.hp,sel:__G.P.sel})");
  console.log('start', await st());
  // andar
  await pg.keyboard.down('KeyD'); await pg.waitForTimeout(900); await pg.keyboard.up('KeyD');
  console.log('andou D', await st());
  await pg.keyboard.down('Space'); await pg.waitForTimeout(120); console.log('pulando', await st()); await pg.keyboard.up('Space'); await pg.waitForTimeout(900);
  // minerar: escolhe picareta (slot 2) e mira num tile de terra à direita-abaixo
  await pg.keyboard.press('Digit2');
  const info = await pg.evaluate(() => { const P=__G.P, wd=__G.world; const px=Math.floor((P.x+6)/16), py=Math.floor((P.y+26)/16); const tx=px+2, ty=py; const c=__G.cam; return {tx,ty,sx:(tx*16+8-c.x)*c.zoom/DPR, sy:(ty*16+8-c.y)*c.zoom/DPR, id:TD[wd.get(tx,ty)].k, sel:P.sel, held:P.inv[P.sel]&&P.inv[P.sel].id}; });
  console.log('alvo', info);
  await pg.mouse.move(info.sx, info.sy); await pg.mouse.down();
  await pg.waitForTimeout(1500); await pg.mouse.up();
  const r = await pg.evaluate((t) => { const wd=__G.world; return {after: TD[wd.get(t.tx,t.ty)].k, dirt: __G.P.inv.filter(s=>s&&s.id==='dirt').map(s=>s.n)}; }, info);
  console.log('minerou ->', r);
  // colocar bloco de volta: seleciona terra
  const slot = await pg.evaluate("__G.P.inv.findIndex(s=>s&&s.id==='dirt')");
  if (slot >= 0) {
    if (slot < 10) await pg.keyboard.press('Digit' + String(slot < 9 ? (slot + 1) % 10 : 0));
    await pg.evaluate((i) => { __G.P.sel = i; }, slot);
    await pg.mouse.move(info.sx, info.sy); await pg.mouse.down(); await pg.waitForTimeout(300); await pg.mouse.up();
    const r2 = await pg.evaluate((t) => ({tile: TD[__G.world.get(t.tx,t.ty)].k}), info); console.log('colocou ->', r2);
  }
  // inventário e crafting
  await pg.evaluate("invAdd('wood', 60); invAdd('gel', 10); invAdd('stone', 40); invAdd('iron_ore',9); G.invChanged=true");
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: devfile('shot_inv.png') });
  const recs = await pg.evaluate("[...document.querySelectorAll('#craft-list .rec .nm')].map(e=>e.textContent).slice(0,8)");
  console.log('receitas disponíveis:', recs);
  await pg.click('#craft-list .rec >> nth=0'); await pg.waitForTimeout(200);
  console.log('após craft:', await pg.evaluate("JSON.stringify(__G.P.inv.filter(s=>s).map(s=>s.id+'x'+s.n))"));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(500); await pg.screenshot({ path: devfile('shot_catalog.png') });
  await pg.keyboard.press('KeyB'); await pg.keyboard.press('KeyM'); await pg.waitForTimeout(400); await pg.screenshot({ path: devfile('shot_map.png') }); await pg.keyboard.press('KeyM');
  console.log('erros:', errs.slice(0, 5), await pg.evaluate('window.__lastErr'));
  await b.close();
});
