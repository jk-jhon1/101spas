import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','2025'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000); await pg.wait_for_timeout(500)
        await pg.evaluate("""() => { const P=G.P; G.opts.noSpawn=true; G.time=.28; P.inv[1]={id:'s113',n:1}; P.sel=1; recalcStats(); document.getElementById('toasts').innerHTML='';
          const mk=(k,dx,o)=>{const d=ED[k]; return spawnEnemy(k,P.x+dx,P.y+P.h-d.h,o)}; mk('zombie',150); mk('slime_blue',210); mk('skeleton',260); mk('eye',190); mk('slime_green',110); G.stage=0;
          window.__aim=()=>{ const c=G.cam; G.mouse.sx=(P.x+170-c.x)*c.zoom/DPR; G.mouse.sy=(P.y-4-c.y)*c.zoom/DPR; }; G.mouse.down[0]=true; for (let i=0;i<48;i++){ __aim(); __step(1/60);} G.paused=true; __render(); }""")
        await pg.wait_for_timeout(120)
        await pg.screenshot(path=devfile('shot_final.png')); print(errs)
        await b.close()
asyncio.run(main())
