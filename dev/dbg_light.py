import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        logs=[]; pg.on('console', lambda m: logs.append(m.text)); pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','12345'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.wait_for_timeout(800)
        r = await pg.evaluate('''() => {
          const L = G.light, wd = G.world; const out = {};
          out.region = [L.x0, L.y0, L.w, L.h]; out.cam = [G.cam.x, G.cam.y, G.cam.zoom, TILEPX];
          const px = Math.floor((G.P.x)/16), py = Math.floor(G.P.y/16); out.p=[px,py];
          out.skyTop = []; out.surf=[]; for (let x = px-40; x <= px+40; x+=10) { out.skyTop.push(wd.skyTop[x]); out.surf.push(wd.surf[x]); }
          // linha de luz acima do solo (py-3)
          const row = []; for (let x = L.x0; x < L.x0 + L.w; x += 8) { const i = (py-3-L.y0)*L.w + (x-L.x0); row.push(+L.r[i].toFixed(2)); } out.rowAbove = row;
          const row2 = []; for (let x = L.x0; x < L.x0 + L.w; x += 8) { const i = (py+1-L.y0)*L.w + (x-L.x0); row2.push(+L.r[i].toFixed(2)); } out.rowGround = row2;
          out.sky = skyLight(G.time); out.time = G.time;
          return out; }''')
        print(json.dumps(r))
        print(logs[:10])
        await b.close()
asyncio.run(main())
