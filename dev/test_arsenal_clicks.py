import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','4'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000); await pg.wait_for_timeout(400)
        n = 0
        for tab in (9, 8, 7, 6, 0, 2, 5):
            for rep in range(1):
                await pg.keyboard.press('KeyB'); await pg.wait_for_timeout(120)
                await pg.click('#ars-tabs .tab >> nth=%d' % tab); await pg.wait_for_timeout(120)
                sel = '#ars-body .btn, #ars-body .enemy-btn' if tab in (8, 9) else '#ars-body .slot'
                cnt = await pg.locator(sel).count()
                limit = cnt if tab in (8, 9) else min(cnt, 25)
                for i in range(limit):
                    if not await pg.evaluate("document.getElementById('panel-arsenal').classList.contains('hidden') === false"):
                        await pg.keyboard.press('KeyB'); await pg.wait_for_timeout(80); await pg.click('#ars-tabs .tab >> nth=%d' % tab); await pg.wait_for_timeout(80)
                    try:
                        await pg.locator(sel).nth(i).click(timeout=1500); n += 1
                    except Exception as e:
                        pass
                    await pg.evaluate("G.paused=false; for (let k=0;k<20;k++) __step(1/60)")
                if await pg.evaluate("document.getElementById('panel-arsenal').classList.contains('hidden') === false"): await pg.keyboard.press('KeyB')
        # simula alguns frames reais depois das ações
        await pg.wait_for_timeout(800)
        print('cliques:', n, '| estágio:', await pg.evaluate('G.stage'), '| chefe:', await pg.evaluate('G.boss && G.boss.name'), '| inimigos:', await pg.evaluate('G.enemies.length'))
        print('erros:', errs[:5], await pg.evaluate('window.__lastErr'))
        await b.close()
asyncio.run(main())
