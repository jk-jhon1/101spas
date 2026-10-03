import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json
from playwright.async_api import async_playwright
JS = r'''
() => {
  const out = {}, P = G.P, wd = G.world; G.opts.noSpawn = true; G.opts.god = false;
  // morte e renascimento
  invAdd('coin', 100); const c0 = invCount('coin'); P.hp = 1; hurtPlayer(500, P.x + 100, 100, { pierce: true }); out.dead = P.dead; out.coinsLost = c0 - invCount('coin');
  for (let i = 0; i < 400; i++) __step(1 / 60); out.respawned = !P.dead; out.hpAfter = P.hp;
  // chefes: derrota via dano direto
  const kill = (kind, key) => { G.boss = null; G.enemies.length = 0; G.drops.length = 0; P.hp = P.maxHp; P.dead = false; summonBoss(kind); const b = G.boss; if (!b) return { ok: false }; hitEnemy(b, { src: 'raw', dmg: 999999, kb: 0, noCrit: true, ignoreDef: true, noKb: true }); for (let i = 0; i < 5; i++) __step(1 / 60); return { ok: true, dead: b.dead, drops: G.drops.map(d => d.id + 'x' + d.n).slice(0, 12), flags: JSON.stringify(G.flags), stage: G.stage }; };
  G.mode = 'creative';
  out.slime = kill('slime');
  out.eye = kill('eye');
  const ores0 = () => { let n = 0; for (let i = 0; i < wd.t.length; i += 7) if (wd.t[i] === T.cobalt || wd.t[i] === T.mithril || wd.t[i] === T.titanium) n++; return n; };
  out.oresBefore = ores0();
  out.guardian = kill('guardian'); out.oresAfter = ores0(); out.hardmode = wd.hardmode;
  out.colossus = kill('colossus'); out.core = out.colossus.drops.filter(x => x.startsWith('mythic_core'));
  return out;
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':960,'height':540})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','9'); await pg.click('#btn-adv')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        r = await pg.evaluate(JS)
        for k,v in r.items(): print(k, '->', json.dumps(v, ensure_ascii=False))
        print('erros', errs[:3], await pg.evaluate('window.__lastErr'))
        await b.close()
asyncio.run(main())
