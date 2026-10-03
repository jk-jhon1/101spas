import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto(INDEX_URL); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=devfile('shot_menu.png'))
        await b.close()
asyncio.run(main())
