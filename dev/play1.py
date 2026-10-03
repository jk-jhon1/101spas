import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, sys, json, time
from playwright.async_api import async_playwright
MODE = sys.argv[1] if len(sys.argv)>1 else 'btn-cre'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','12345')
        t0=time.time()
        await pg.click('#'+MODE)
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        print('world ready in %.1fs'%(time.time()-t0))
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=devfile('shot_play1.png'))
        print('\n'.join(logs[:40]) or 'no console output')
        print('lastErr', await pg.evaluate('window.__lastErr'))
        print(await pg.evaluate('JSON.stringify({x:__G.P.x,y:__G.P.y,hp:__G.P.hp,inv:__G.P.inv.slice(0,10).map(s=>s&&s.id)})'))
        await b.close()
asyncio.run(main())
