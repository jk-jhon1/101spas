import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json, sys, time
from playwright.async_api import async_playwright
JS = r'''
() => {
  const res = [], P = G.P; G.opts.god = true; G.opts.showDps = true; G.opts.noSpawn = true;
  const aim = (wx, wy) => { const c = G.cam; G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR; };
  const errs = [];
  const origErr = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 300)); };
  for (const sw of SWORDS) {
    const entry = { num: sw.num, name: sw.swordName, err: null, dmg: 0, projs: 0 };
    try {
      G.enemies.length = 0; G.projs.length = 0; G.parts.length = 0; G.texts.length = 0; G.drops.length = 0; G.freeze = 0; G.dark = 0;
      P.x = G.world.spawn.x; P.y = G.world.spawn.y; P.vx = P.vy = 0; P.hp = P.maxHp; P.dead = false; P.inv_ = 0; P.buffs = {}; P.cb.inst.length = 0; P.cb.cd = 0;
      P.inv[1] = { id: sw.id, n: 1 }; P.sel = 1; recalcStats();
      const mk = (k, dx) => { const d = ED[k]; return spawnEnemy(k, P.x + dx, P.y + P.h - d.h); };
      const t1 = mk('dummy', 26), t2 = mk('dummy', 92), t3 = mk('slime_blue', 190), t4 = mk('zombie', 250), t5 = mk('eye', 160); const seenSt = new Set(), seenBuff = new Set(); const hits0 = P.cb.hits, sw0 = P.cb.count;
      G.dpsLog.length = 0; G.mouse.down[0] = true; let maxProj = 0;
      for (let f = 0; f < 180; f++) { aim(P.x + 120, P.y + 6); __step(1 / 60); G.mouse.pressed = [false, false, false]; maxProj = Math.max(maxProj, G.projs.length); if (f % 12 === 0) __render(); P.hp = P.maxHp; for (const e of [t1, t2]) { e.x = P.x + (e === t1 ? 26 : 92); e.vx = 0; } for (const e of G.enemies) for (const k in e.st) seenSt.add(k); for (const k in P.buffs) seenBuff.add(k); }
      G.mouse.down[0] = false;
      for (let f = 0; f < 90; f++) { __step(1 / 60); if (f % 15 === 0) __render(); }
      entry.dmg = G.dpsLog.reduce((a, b) => a + b[1], 0); entry.projs = maxProj; entry.swings = P.cb.count - sw0; entry.hits = P.cb.hits - hits0; entry.st = [...seenSt].join(','); entry.buff = [...seenBuff].join(',');
    } catch (e) { entry.err = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); }
    res.push(entry);
  }
  console.error = origErr;
  return { res, errs: errs.slice(0, 20) };
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:200])); pg.on('pageerror', lambda e: logs.append('PAGEERROR '+str(e)[:300]))
        await pg.goto(INDEX_URL)
        await pg.fill('#seed','777'); await pg.click('#btn-cre')
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        await pg.wait_for_timeout(500)
        t0=time.time()
        out = await pg.evaluate(JS)
        print('tempo: %.1fs'%(time.time()-t0))
        bad = [e for e in out['res'] if e['err'] or e['dmg']<=0]
        for e in out['res']:
            flag = 'ERR' if e['err'] else ('SEM DANO' if e['dmg']<=0 else 'ok')
            if flag!='ok' or '-v' in sys.argv: print(f"{e['num']:03d} {e['name']:<24} dmg={e['dmg']:<6} sw={e.get('swings')} hit={e.get('hits')} proj={e['projs']:<4} st=[{e.get('st')}] buff=[{e.get('buff')}] {flag} {e['err'] or ''}")
        print('espadas testadas:', len(out['res']), '| problemas:', len(bad))
        print('console.error capturados:', out['errs'])
        print('page logs:', [l for l in logs if 'error' in l.lower()][:10])
        await pg.screenshot(path=devfile('shot_swords_end.png'))
        await b.close()
asyncio.run(main())
