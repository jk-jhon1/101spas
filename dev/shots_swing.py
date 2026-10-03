import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
NUM = int(sys.argv[2]); AIMDIR = sys.argv[3] if len(sys.argv)>3 else 'right'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':960,'height':540})
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.evaluate("document.getElementById('toasts').style.display='none'; document.getElementById('hud').style.display='none'")
        await pg.evaluate("""([num, dir]) => { const sw = SWORD_BY_NUM[num], P = G.P; G.opts.god=true; G.opts.noSpawn=true; G.enemies.length=0; G.time=.3; P.x=G.world.spawn.x; P.y=G.world.spawn.y; P.vx=P.vy=0; P.cb.cd=0; P.inv[1]={id:sw.id,n:1}; P.sel=1; recalcStats(); G.cam.init=false;
          for (let i=0;i<20;i++) __step(1/60); window.__dir = dir; window.__aim = () => { const c=G.cam, P=G.P; const tx = P.x + (window.__dir==='left'?-140:140), ty = P.y + (window.__dir==='up'?-130:window.__dir==='down'?100:0) + (window.__dir==='up'?0:0); G.mouse.sx=(tx-c.x)*c.zoom/DPR; G.mouse.sy=(ty-c.y)*c.zoom/DPR; }; __aim(); G.mouse.down[0]=true; G.paused=false; }""", [NUM, AIMDIR])
        frames=[]
        for i in range(10):
            await pg.evaluate("() => { for (let k=0;k<3;k++){ __aim(); __step(1/60); G.mouse.pressed=[false,false,false]; } G.paused=true; __render(); }")
            await pg.wait_for_timeout(40)
            png = await pg.screenshot(); im = Image.open(io.BytesIO(png)).convert('RGB'); W,H = im.size
            frames.append(im.crop((W//2-120, H//2-130, W//2+150, H//2+70)))
            await pg.evaluate("G.paused=false")
        cols=5; rows=2; sw_,sh_ = frames[0].size; sheet = Image.new('RGB',(sw_*cols, sh_*rows))
        for i,f in enumerate(frames): sheet.paste(f, ((i%cols)*sw_, (i//cols)*sh_))
        sheet.save(sys.argv[1]); print(sheet.size)
        await b.close()
asyncio.run(main())
