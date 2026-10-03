"""Capturas do suporte a controle (usa gamepad simulado). Saída: docs/img/09_controle.png"""
import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, io, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
exec(open(devfile('test_gamepad.py')).read().split('res = []')[0].split('from playwright.async_api import async_playwright')[1])  # MOCK, BLOCKED

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width': 1280, 'height': 720}); await ctx.add_init_script(MOCK)
        pg = await ctx.new_page(); ev = pg.evaluate; errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        shots = []
        async def snap(name):
            png = await pg.screenshot(); im = Image.open(io.BytesIO(png)).convert('RGB'); im.save(devfile(f'pad_{len(shots)}_{name}.png'))
            t = im.resize((640, 360), Image.LANCZOS); d = ImageDraw.Draw(t); d.rectangle((0, 0, 640, 13), fill=(0, 0, 0)); d.text((4, 1), name, fill=(255, 255, 255)); shots.append(t)
        async def tap(i, ms=150):
            await ev(f"__setPad({{{i}: true}})"); await pg.wait_for_timeout(ms); await ev(f"__setPad({{{i}: false}})"); await pg.wait_for_timeout(ms)
        await pg.goto(INDEX_URL); await pg.wait_for_timeout(900)
        await tap(0); await tap(13); await pg.wait_for_timeout(200); await snap('titulo com foco do controle')
        await tap(12); await pg.fill('#seed', '31337'); await tap(0)
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000); await pg.wait_for_timeout(1000)
        await ev("""(() => { const P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.time = .3; document.getElementById('toasts').innerHTML = '';
          P.inv[0] = { id: 's113', n: 1 }; P.sel = 0; recalcStats(); G.invChanged = true;
          const mk = (k, dx) => spawnEnemy(k, P.x + dx, P.y + P.h - ED[k].h); mk('zombie', 150); mk('slime_blue', 105); mk('skeleton', 230); mk('zombie', -120); })()""")
        await ev("__setPad({7: true}, [0, 0, .85, -.5])"); await pg.wait_for_timeout(330)
        await ev("__setPad({}, [0, 0, .85, -.5])"); await snap('mira analogica + golpe')
        await ev("__setPad({7: false}, [0, 0, .85, -.15])"); await pg.wait_for_timeout(250); await snap('reticle (analogico dir.)')
        await ev("__setPad({7: false}, [0, 0, 0, 0])")
        await ev("(() => { invAdd('wood', 30); invAdd('gel', 10); invAdd('stone', 40); invAdd('torch', 5); G.ui.craftDirty = true; })()")
        await tap(3); await pg.wait_for_timeout(300)
        r = await ev("(() => { const r = document.querySelector('#craft-list .rec'); const b = r.getBoundingClientRect(); return { x: b.x + 40, y: b.y + b.height / 2 }; })()")
        await ev(f"__PAD.cur.x = {r['x']}; __PAD.cur.y = {r['y']}"); await pg.wait_for_timeout(300); await snap('inventario: cursor virtual + tooltip')
        await tap(1); await tap(9); await pg.wait_for_timeout(200)
        await tap(13); await tap(0); await pg.wait_for_timeout(300)
        await pg.evaluate("document.getElementById('help-box').scrollTop = 99999"); await pg.wait_for_timeout(200); await snap('guia: controle (gamepad)')
        sheet = Image.new('RGB', (1280, 720))
        for i, t in enumerate(shots[:4]): sheet.paste(t, ((i % 2) * 640, (i // 2) * 360))
        sheet.save(str(ROOT / 'docs' / 'img' / '09_controle.png')); print('erros:', errs)
        await b.close()
asyncio.run(main())
