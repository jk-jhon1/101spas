import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, io, sys
from playwright.async_api import async_playwright
JS = r'''
() => {
  const ids = []; for (let i = 1; i < TD.length; i++) ids.push(i);
  const cols = 14, S = 4, cell = 16 * S + 6, rows = Math.ceil(ids.length / cols) * 2;
  const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell + 4; const g = c.getContext('2d');
  g.fillStyle = '#6aa8ec'; g.fillRect(0, 0, c.width, c.height / 2); g.fillStyle = '#35303a'; g.fillRect(0, c.height / 2, c.width, c.height / 2);
  g.imageSmoothingEnabled = false;
  ids.forEach((id, k) => {
    const cx = (k % cols) * cell, cy = Math.floor(k / cols) * cell * 2;
    for (let row = 0; row < 2; row++) { const mask = row === 0 ? 0 : 15; const s = getTileSprite(id, mask, 0); g.drawImage(s.c, s.x, s.y, 16, 16, cx + 3, cy + row * cell + 3, 16 * S, 16 * S); }
    g.fillStyle = '#fff'; g.font = '9px sans-serif'; g.fillText(TD[id].k, cx + 2, cy + 2 * cell - 2);
  });
  document.body.innerHTML = ''; document.body.style.background = '#000'; document.body.appendChild(c); c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  return [c.width, c.height];
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1100,'height':800})
        await pg.goto(INDEX_URL)
        await pg.wait_for_timeout(400)
        dim = await pg.evaluate(JS)
        await pg.set_viewport_size({'width':dim[0],'height':dim[1]})
        await pg.screenshot(path=sys.argv[1], full_page=False); print(dim)
        await b.close()
asyncio.run(main())
