import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json, io
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        r = await pg.evaluate('''() => {
          const wd = G.world, out = {}; 
          out.col = []; for (const x of [850, 880, 900, 920, 950, 1000, 1050, 1100]) { const s = wd.surf[x]; out.col.push([x, s, TD[wd.t[x + s*wd.w]].k, TD[wd.t[x + (s+1)*wd.w]].k, TD[wd.t[x + (s+6)*wd.w]].k, wd.wl[x+(s+3)*wd.w], wd.skyTop[x], wd.biomeName(x)]); }
          return out; }''')
        print(json.dumps(r))
        await pg.evaluate("document.getElementById('toasts').style.display='none'")
        await pg.evaluate("""() => { const P=G.P; G.opts.god=true; G.opts.noSpawn=true; G.time=.3; P.x=900*16; P.y=(G.world.surf[900]-3)*16; P.vx=P.vy=0; G.cam.init=false; for (let i=0;i<30;i++) __step(1/60); G.paused=true; __render(); }""")
        await pg.wait_for_timeout(80)
        await pg.screenshot(path=devfile('shot_jungle.png'))
        await b.close()
asyncio.run(main())
