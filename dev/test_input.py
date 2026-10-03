import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','2024'); await pg.click('#btn-adv')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.wait_for_timeout(1200)
        st = lambda: pg.evaluate("JSON.stringify({x:Math.round(__G.P.x),y:Math.round(__G.P.y),vy:Math.round(__G.P.vy),g:__G.P.onGround,hp:__G.P.hp,sel:__G.P.sel})")
        print('start', await st())
        # andar
        await pg.keyboard.down('KeyD'); await pg.wait_for_timeout(900); await pg.keyboard.up('KeyD')
        print('andou D', await st())
        await pg.keyboard.down('Space'); await pg.wait_for_timeout(120); print('pulando', await st()); await pg.keyboard.up('Space'); await pg.wait_for_timeout(900)
        # minerar: escolhe picareta (slot 2) e mira num tile de terra à direita-abaixo
        await pg.keyboard.press('Digit2')
        info = await pg.evaluate("""() => { const P=__G.P, wd=__G.world; const px=Math.floor((P.x+6)/16), py=Math.floor((P.y+26)/16); const tx=px+2, ty=py; const c=__G.cam; return {tx,ty,sx:(tx*16+8-c.x)*c.zoom/DPR, sy:(ty*16+8-c.y)*c.zoom/DPR, id:TD[wd.get(tx,ty)].k, sel:P.sel, held:P.inv[P.sel]&&P.inv[P.sel].id}; }""")
        print('alvo', info)
        await pg.mouse.move(info['sx'], info['sy']); await pg.mouse.down()
        await pg.wait_for_timeout(1500); await pg.mouse.up()
        r = await pg.evaluate("""(t) => { const wd=__G.world; return {after: TD[wd.get(t.tx,t.ty)].k, dirt: __G.P.inv.filter(s=>s&&s.id==='dirt').map(s=>s.n)}; }""", info)
        print('minerou ->', r)
        # colocar bloco de volta: seleciona terra
        slot = await pg.evaluate("__G.P.inv.findIndex(s=>s&&s.id==='dirt')")
        if slot >= 0:
            await pg.keyboard.press('Digit'+str((slot+1)%10 if slot<9 else 0)) if slot < 10 else None
            await pg.evaluate("(i)=>{ __G.P.sel=i }", slot)
            await pg.mouse.move(info['sx'], info['sy']); await pg.mouse.down(); await pg.wait_for_timeout(300); await pg.mouse.up()
            r2 = await pg.evaluate("""(t) => ({tile: TD[__G.world.get(t.tx,t.ty)].k})""", info); print('colocou ->', r2)
        # inventário e crafting
        await pg.evaluate("invAdd('wood', 60); invAdd('gel', 10); invAdd('stone', 40); invAdd('iron_ore',9); G.invChanged=true")
        await pg.keyboard.press('KeyE'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=devfile('shot_inv.png'))
        recs = await pg.evaluate("[...document.querySelectorAll('#craft-list .rec .nm')].map(e=>e.textContent).slice(0,8)")
        print('receitas disponíveis:', recs)
        await pg.click('#craft-list .rec >> nth=0'); await pg.wait_for_timeout(200)
        print('após craft:', await pg.evaluate("JSON.stringify(__G.P.inv.filter(s=>s).map(s=>s.id+'x'+s.n))"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        await pg.keyboard.press('KeyB'); await pg.wait_for_timeout(500); await pg.screenshot(path=devfile('shot_catalog.png'))
        await pg.keyboard.press('KeyB'); await pg.keyboard.press('KeyM'); await pg.wait_for_timeout(400); await pg.screenshot(path=devfile('shot_map.png')); await pg.keyboard.press('KeyM')
        print('erros:', errs[:5], await pg.evaluate('window.__lastErr'))
        await b.close()
asyncio.run(main())
