import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        r = await pg.evaluate("""() => { const P=G.P; G.opts.god=true; G.opts.noSpawn=true; G.time=.3; P.x=900*16; P.y=(G.world.surf[900]-3)*16; P.vx=P.vy=0; G.cam.init=false; for (let i=0;i<30;i++) __step(1/60); G.paused=true; __render();
          const out = {}; const wd = G.world, L = G.light;
          const tx = 900 - 5, ty = wd.surf[tx];
          const li = (x,y) => { const i = (y - L.y0) * L.w + (x - L.x0); return [L.r[i], L.g[i], L.b[i]].map(v => +v.toFixed(2)); };
          out.light = [0,1,2,3,4].map(d => li(tx, ty + d));
          out.tiles = [0,1,2,3].map(d => TD[wd.t[tx + (ty+d)*wd.w]].k);
          // pixel na tela: posição do tile
          const T16 = TILEPX, ox = Math.round(G.cam.x * G.cam.zoom), oy = Math.round(G.cam.y * G.cam.zoom);
          const sx = tx * T16 - ox + T16/2, sy = ty * T16 - oy + T16/2;
          const px = vctx.getImageData(Math.round(sx), Math.round(sy), 1, 1).data; out.pix0 = [px[0],px[1],px[2]];
          const py = vctx.getImageData(Math.round(sx), Math.round(sy + T16*2), 1, 1).data; out.pix2 = [py[0],py[1],py[2]];
          const s = getTileSprite(T.mud, 15, 0); const g2 = document.createElement('canvas'); g2.width=16;g2.height=16; const c2=g2.getContext('2d'); c2.drawImage(s.c, s.x, s.y, 16,16, 0,0,16,16); const d = c2.getImageData(4,4,1,1).data; out.mudSprite=[d[0],d[1],d[2],d[3]];
          out.sky = skyLight(G.time); out.zoom=[G.cam.zoom, TILEPX, DPR];
          return out; }""")
        print(json.dumps(r))
        await b.close()
asyncio.run(main())
