import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
NUMS = [int(x) for x in sys.argv[2].split(',')]
OUT = sys.argv[1]
SETUP = r'''
(num) => {
  const sw = SWORD_BY_NUM[num], P = G.P; G.opts.god = true; G.opts.noSpawn = true; G.opts.showDps = false;
  window.__aim = (wx, wy) => { const c = G.cam; G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; };
  G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.texts.length = 0; G.drops.length = 0; G.freeze = 0; G.dark = 0; G.flash = null; G.time = .3;
  P.x = G.world.spawn.x; P.y = G.world.spawn.y; P.vx = P.vy = 0; P.hp = P.maxHp; P.dead = false; P.inv_ = 0; P.buffs = {}; P.cb.inst.length = 0; P.cb.cd = 0; P.face = 1;
  P.inv[1] = { id: sw.id, n: 1 }; P.sel = 1; recalcStats();
  const mk = (k, dx, o) => { const d = ED[k]; return spawnEnemy(k, P.x + dx, P.y + P.h - d.h, o); };
  mk('dummy', 40); mk('dummy', 95); mk('zombie', 150); mk('slime_blue', 190); mk('skeleton', 240); mk('eye', 170); mk('dummy', 300);
  G.cam.init = false; G.mouse.down[0] = true; window.__f = 0; return sw.swordName;
}
'''
STEP = r'''
(n) => { for (let i = 0; i < n; i++) { __aim(G.P.x + 140, G.P.y + 4); __step(1/60); G.mouse.pressed=[false,false,false]; G.P.hp = G.P.maxHp; } G.paused = true; __render(); return G.projs.length; }
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':960,'height':540})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: errs.append(m.text[:200]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.evaluate("document.getElementById('toasts').style.display='none'; document.getElementById('hud').style.display='none'")
        tiles=[]
        for n in NUMS:
            name = await pg.evaluate(SETUP, n)
            # alguns efeitos têm pico depois: captura em 2 momentos
            await pg.evaluate("G.paused=false")
            await pg.evaluate(STEP, 26)
            await pg.wait_for_timeout(60)
            png = await pg.screenshot()
            im = Image.open(io.BytesIO(png)).convert('RGB')
            # recorte centrado no jogador
            W,H = im.size; crop = im.crop((W//2-300, H//2-190, W//2+300, H//2+110)).resize((480,240), Image.LANCZOS)
            d = ImageDraw.Draw(crop); d.rectangle((0,0,480,16), fill=(0,0,0)); d.text((4,2), f"{n:03d} {name}", fill=(255,255,255))
            tiles.append(crop)
            await pg.evaluate("G.paused=false; G.mouse.down[0]=false")
        cols=3; rows=(len(tiles)+cols-1)//cols
        sheet = Image.new('RGB',(480*cols, 240*rows),(0,0,0))
        for i,t in enumerate(tiles): sheet.paste(t, ((i%cols)*480, (i//cols)*240))
        sheet.save(OUT); print('saved', OUT, sheet.size, 'errors:', errs[:5])
        await b.close()
asyncio.run(main())
