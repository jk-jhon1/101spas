import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
BUILD = r'''
() => {
  const wd = G.world, P = G.P; const x0 = 590, w = 10, h = 5;
  let fy = wd.surf[x0] + 1; // linha do piso (primeira linha sólida abaixo do ar)
  for (let y = fy - 12; y <= fy; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) { if (y < fy) { wd.set(x, y, 0, true); } }
  for (let x = x0 - 2; x <= x0 + w + 1; x++) for (let y = fy; y <= fy + 1; y++) wd.set(x, y, T.dirt, true);
  for (let y = fy - h - 1; y <= fy; y++) for (let x = x0 - 1; x <= x0 + w; x++) {
    const border = x === x0 - 1 || x === x0 + w || y === fy || y === fy - h - 1;
    wd.set(x, y, border ? T.plank : 0, true); wd.setWall(x, y, WALL.plank);
  }
  for (let k = 1; k <= 3; k++) wd.set(x0 - 1, fy - k, T.doorC, true);
  wd.set(x0 + 2, fy - h, T.torch, true); wd.set(x0 + 5, fy - 1, T.table, true); wd.set(x0 + 7, fy - 1, T.chair, true);
  P.x = (x0 + 4) * TS; P.y = (fy - 2) * TS; P.vx = P.vy = 0; G.cam.init = false;
  return { fy, x0 };
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','555'); await pg.click('#btn-adv')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        info = await pg.evaluate(BUILD); print('casa em', info)
        r = await pg.evaluate("""() => { G.opts.noSpawn = true; G.opts.god = true; for (let i=0;i<60;i++) __step(1/60); const rooms = scanRooms(); const r0 = floodRoom(590+7, G.world.surf[590]+1-1); return {rooms: rooms.length, r0: r0 && {valid:r0.valid,size:r0.size,light:r0.light,table:r0.table,chair:r0.chair,door:r0.door}}; }""")
        print('salas:', r)
        await pg.evaluate("G.npcSpawnT = 0; for (let i=0;i<30;i++) __step(1/60);")
        print('npcs:', await pg.evaluate("JSON.stringify(G.npcs.map(n=>({t:n.type,x:Math.round(n.x),y:Math.round(n.y)})))"))
        await pg.evaluate("for (let i=0;i<180;i++) __step(1/60); G.paused=false")
        await pg.wait_for_timeout(300)
        await pg.evaluate("invAdd('coin', 300); invAdd('gel', 20); invAdd('iron_ore', 12); const n = G.npcs[0]; if (n) openNpc(n); G.paused=false")
        await pg.wait_for_timeout(300); await pg.screenshot(path=devfile('shot_npc.png'))
        await pg.evaluate("closePanels(); G.npcSpawnT=0; G.flags.slime=true; G.day=3; G.npcScanT=0; for (let i=0;i<60;i++) __step(1/60)")
        # segunda sala necessária para mais NPCs -> só confirma que não quebra
        print('npcs após:', await pg.evaluate("G.npcs.length"))
        # save/load roundtrip
        await pg.evaluate("G.P.inv[5] = {id:'s120', n:1}; G.stage = 2; G.world.set(580, 100, T.gold); invAdd('mythic_core', 3)")
        ok = await pg.evaluate("saveGame(true)"); print('salvou:', ok)
        size = await pg.evaluate("(localStorage.getItem('espadas120_save_v1')||'').length"); print('tamanho do save (chars):', size)
        await pg.evaluate("G.world.set(580, 100, 0); G.stage = 0; G.P.inv[5] = null")
        ok2 = await pg.evaluate("loadGame()"); await pg.wait_for_timeout(500)
        print('carregou:', ok2, await pg.evaluate("JSON.stringify({stage:G.stage, slot5:G.P.inv[5]&&G.P.inv[5].id, tile:TD[G.world.get(580,100)].k, npcs:G.npcs.length, core:invCount('mythic_core'), state:G.state})"))
        await pg.screenshot(path=devfile('shot_afterload.png'))
        print('erros:', errs[:5], await pg.evaluate('window.__lastErr'))
        await b.close()
asyncio.run(main())
