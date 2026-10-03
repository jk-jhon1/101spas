import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
FIND = r'''
() => {
  const wd = G.world, out = {};
  const floorAt = (x, y0, y1) => { for (let y = y0; y < y1; y++) if (!wd.solid(x, y) && wd.solid(x, y + 1) && !wd.solid(x, y - 1) && !wd.solid(x, y - 2) && !wd.solid(x, y-3) && wd.liqAt(x, y) < 30) return y; return -1; };
  out.forest = [575, wd.surf[575] - 3]; out.desert = [250, wd.surf[250] - 3]; out.jungle = [900, wd.surf[900] - 3]; out.snow = [1150, wd.surf[1150] - 3];
  out.ocean = [60, 124];
  for (let y = 28; y < 70; y++) for (let x = 100; x < 1300; x++) if (wd.t[x + y * wd.w] === T.grass && y < 75) { out.island = [x, y - 4]; y = 999; break; }
  for (const [k, y0, y1, x0] of [['cave', 190, 280, 600], ['deep', 320, 395, 700], ['hell', 425, 470, 800], ['cave2', 190, 280, 300]]) { for (let dx = 0; dx < 400; dx++) { const x = x0 + dx, y = floorAt(x, y0, y1); if (y > 0) { out[k] = [x, y]; break; } } }
  return out;
}
'''
GO = r'''
([tx, ty, time, torches]) => {
  const P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.time = time; G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0;
  P.x = tx * TS; P.y = ty * TS - 4; P.vx = P.vy = 0; P.fallStart = 0; G.cam.init = false; P.inv[1] = null; P.sel = 0;
  if (torches) { const wd = G.world, y = Math.floor(P.y / TS) + 1; for (const dx of [-3, 4, 9, -8]) { for (let yy = y; yy > y - 3; yy--) if (!wd.solid(tx + dx, yy)) { wd.set(tx + dx, yy, T.torch); break; } } }
  for (let i = 0; i < 25; i++) { __step(1 / 60); } G.paused = true; __render(); return [P.x, P.y];
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':960,'height':540})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.evaluate("document.getElementById('toasts').style.display='none'")
        loc = await pg.evaluate(FIND); print(loc)
        plan = [('forest','Floresta',.3,False),('desert','Deserto',.3,False),('jungle','Selva',.3,False),('snow','Neve',.3,False),('ocean','Oceano',.3,False),('island','Ilha do céu',.3,False),
                ('cave','Cavernas + tochas',.3,True),('deep','Cav. profundas',.3,True),('hell','Inferno',.3,False),('forest','Floresta (noite)',.82,False),('forest','Entardecer',.58,False),('cave2','Caverna 2',.3,True)]
        tiles=[]
        for k,name,t,tor in plan:
            if k not in loc: continue
            await pg.evaluate("G.paused=false")
            await pg.evaluate(GO, [loc[k][0], loc[k][1], t, tor]); await pg.wait_for_timeout(50)
            png = await pg.screenshot(); im = Image.open(io.BytesIO(png)).convert('RGB').resize((480,270), Image.LANCZOS)
            d = ImageDraw.Draw(im); d.rectangle((0,0,480,14), fill=(0,0,0)); d.text((4,1), name, fill=(255,255,255)); tiles.append(im)
        cols=3; rows=(len(tiles)+cols-1)//cols; sheet = Image.new('RGB',(480*cols,270*rows))
        for i,t in enumerate(tiles): sheet.paste(t, ((i%cols)*480,(i//cols)*270))
        sheet.save(sys.argv[1]); print('saved', sheet.size, errs[:5])
        await b.close()
asyncio.run(main())
