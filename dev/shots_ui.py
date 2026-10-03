import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1366,'height':768})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto(INDEX_URL); await pg.wait_for_timeout(1200)
        shots=[]
        async def snap(name):
            png = await pg.screenshot(); im = Image.open(io.BytesIO(png)).convert('RGB').resize((683,384), Image.LANCZOS)
            d = ImageDraw.Draw(im); d.rectangle((0,0,683,13), fill=(0,0,0)); d.text((4,1), name, fill=(255,255,255)); shots.append(im)
        await snap('menu')
        await pg.fill('#seed','888'); await pg.click('#btn-cre'); await pg.wait_for_function('window.__G.state === "play"', timeout=90000); await pg.wait_for_timeout(600)
        await pg.evaluate("document.getElementById('toasts').innerHTML=''")
        await pg.keyboard.press('KeyB'); await pg.wait_for_timeout(300)
        await pg.click('#ars-tabs .tab >> nth=5'); await pg.wait_for_timeout(200); await snap('arsenal T6')
        await pg.click('#ars-tabs .tab >> nth=7'); await pg.wait_for_timeout(200); await snap('arsenal itens')
        await pg.click('#ars-tabs .tab >> nth=8'); await pg.wait_for_timeout(200); await snap('arsenal inimigos')
        await pg.click('#ars-tabs .tab >> nth=9'); await pg.wait_for_timeout(200); await snap('arsenal mundo')
        # tooltip de uma espada T6
        await pg.click('#ars-tabs .tab >> nth=5'); await pg.wait_for_timeout(100)
        await pg.hover('#ars-body .ars-grid .slot >> nth=19'); await pg.wait_for_timeout(200); await snap('tooltip 120')
        await pg.keyboard.press('Escape'); await pg.keyboard.press('KeyM'); await pg.wait_for_timeout(300); await snap('mapa')
        await pg.keyboard.press('KeyM'); await pg.keyboard.press('KeyE'); await pg.wait_for_timeout(300)
        await pg.click('#craft-tabs .tab >> nth=1'); await pg.wait_for_timeout(200); await snap('inventário+espadas')
        cols=3; rows=(len(shots)+cols-1)//cols; sheet = Image.new('RGB',(683*cols,384*rows))
        for i,t in enumerate(shots): sheet.paste(t, ((i%cols)*683,(i//cols)*384))
        sheet.save(devfile('sheet_ui.png')); print(sheet.size, errs[:4])
        await b.close()
asyncio.run(main())
