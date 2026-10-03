import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
HOST = '<!doctype html><body style="margin:0"><iframe id="f" sandbox="allow-scripts" src="' + INDEX_URL + '" style="width:1280px;height:720px;border:0"></iframe></body>'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:200])); pg.on('pageerror', lambda e: logs.append('PAGEERROR '+str(e)[:300]))
        await pg.goto((DEV / 'host.html').as_uri()); await pg.wait_for_timeout(2500)
        fr = pg.frames[1]
        print('frames:', [f.url for f in pg.frames]); print('frame url:', fr.url, '| estado:', await fr.evaluate('window.__G && window.__G.state'))
        print('hasSave em sandbox:', await fr.evaluate('hasSave()'))
        await fr.click('#btn-adv'); await fr.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.wait_for_timeout(800)
        # entra no jogo, ataca, salva (deve falhar com toast, sem exceção), abre inventário
        print('saveGame ->', await fr.evaluate('saveGame(false)'))
        await pg.keyboard.press('KeyE'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=devfile('shot_sandbox.png'))
        print('toasts:', await fr.evaluate("[...document.querySelectorAll('.toast')].map(t=>t.textContent.slice(0,90))"))
        print('logs:', [l for l in logs if 'error' in l.lower() or 'PAGEERROR' in l][:6])
        await b.close()
asyncio.run(main())
