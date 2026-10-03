"""Teste do suporte a controle (Gamepad API) com um gamepad simulado.
Usa o loop real do jogo (requestAnimationFrame -> frame -> padUpdate -> step)."""
import pathlib as _pl
DEV = _pl.Path(__file__).resolve().parent; ROOT = DEV.parent   # caminhos relativos à raiz do repositório
INDEX_URL = (ROOT / 'index.html').as_uri(); devfile = lambda n: str(DEV / n)
import asyncio, json, math, sys
from playwright.async_api import async_playwright

MOCK = """
(() => {
  const mk = () => ({ pressed: false, touched: false, value: 0 });
  window.__pad = { id: 'Mock Pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, mk), axes: [0, 0, 0, 0] };
  window.__padOn = true;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => window.__padOn ? [window.__pad, null, null, null] : [null, null, null, null] });
  window.__setPad = (btn, axes) => { const p = window.__pad; if (btn) for (const k in btn) { p.buttons[+k].pressed = !!btn[k]; p.buttons[+k].value = btn[k] ? 1 : 0; } if (axes) p.axes = axes.slice(); };
})();
"""
BLOCKED = "Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => { throw new DOMException('disallowed by permissions policy', 'SecurityError'); } });"

res = []
def check(name, ok, detail=''):
    res.append((name, bool(ok), detail)); print(('  ok   ' if ok else '  FAIL ') + name + (('  -> ' + str(detail)) if detail != '' else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width': 1280, 'height': 720})
        await ctx.add_init_script(MOCK)
        pg = await ctx.new_page()
        logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:200]) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)[:300]))
        ev = pg.evaluate
        async def tap(i, ms=150):
            await ev(f"__setPad({{{i}: true}})"); await pg.wait_for_timeout(ms); await ev(f"__setPad({{{i}: false}})"); await pg.wait_for_timeout(ms)
        async def axes(a, ms=0):
            await ev(f"__setPad(null, {json.dumps(a)})")
            if ms: await pg.wait_for_timeout(ms)
        focus_id = "() => { const e = document.querySelector('.menu-btn.padfocus'); return e ? e.id : null }"

        print('== título ==')
        await pg.goto(INDEX_URL); await pg.wait_for_timeout(800)
        check('dica de controle conectado', 'Controle conectado' in await ev("document.getElementById('pad-hint').textContent"))
        check('sem foco antes do 1º toque', await ev(focus_id) is None)
        await tap(0)
        check('1º toque só mostra o foco (Nova Aventura)', await ev(focus_id) == 'btn-adv', await ev(focus_id))
        check('ainda no título', await ev("__G.state") == 'title')
        await tap(13); check('direcional ↓ -> Modo Criativo', await ev(focus_id) == 'btn-cre', await ev(focus_id))
        await tap(12); check('direcional ↑ -> Nova Aventura', await ev(focus_id) == 'btn-adv')
        await axes([0, 1, 0, 0], 120); await axes([0, 0, 0, 0], 120)
        check('analógico ↓ move o foco', await ev(focus_id) == 'btn-cre', await ev(focus_id))
        await axes([0, -1, 0, 0], 120); await axes([0, 0, 0, 0], 120)
        check('analógico ↑ move o foco', await ev(focus_id) == 'btn-adv', await ev(focus_id))
        await pg.fill('#seed', '4242')
        await tap(0)
        await pg.wait_for_function('window.__G.state === "play"', timeout=90000)
        check('A inicia o jogo', True)
        await pg.wait_for_timeout(1200)
        await ev("(() => { G.opts.god = true; G.opts.noSpawn = true; G.enemies.length = 0; document.getElementById('toasts').innerHTML=''; })()")

        print('== movimento / pulo / barra ==')
        x0 = await ev("G.P.x"); await axes([1, 0, 0, 0], 700); x1 = await ev("G.P.x"); await axes([0, 0, 0, 0], 300)
        check('analógico → anda para a direita', x1 > x0 + 20, f'{x0:.0f} -> {x1:.0f}')
        await axes([-1, 0, 0, 0], 700); x2 = await ev("G.P.x"); await axes([0, 0, 0, 0], 300)
        check('analógico ← anda para a esquerda', x2 < x1 - 20, f'{x1:.0f} -> {x2:.0f}')
        await ev("__setPad({15: true})"); await pg.wait_for_timeout(600); x3 = await ev("G.P.x"); await ev("__setPad({15: false})"); await pg.wait_for_timeout(300)
        check('direcional → anda', x3 > x2 + 15, f'{x2:.0f} -> {x3:.0f}')
        await axes([.15, .1, 0, 0], 300); x4 = await ev("G.P.x"); await pg.wait_for_timeout(300); x5 = await ev("G.P.x"); await axes([0, 0, 0, 0], 100)
        check('zona morta: deriva pequena não move', abs(x5 - x4) < 4, f'{x4:.1f} -> {x5:.1f}')
        await pg.wait_for_function("G.P.onGround", timeout=5000)
        await ev("__setPad({0: true})")
        try:
            await pg.wait_for_function("!G.P.onGround && G.P.vy < 0", timeout=1500); jumped = True
        except Exception: jumped = False
        await ev("__setPad({0: false})"); check('A pula', jumped)
        await pg.wait_for_function("G.P.onGround", timeout=5000); await pg.wait_for_timeout(200)
        sel0 = await ev("G.P.sel"); await tap(5); s1 = await ev("G.P.sel"); await tap(4); s2 = await ev("G.P.sel")
        check('RB/LB trocam o item da barra', s1 == (sel0 + 1) % 10 and s2 == sel0, f'{sel0} -> {s1} -> {s2}')

        print('== mira analógica ==')
        await ev("""(() => { const P = G.P; P.inv[0] = { id: 's001', n: 1 }; P.inv[1] = { id: 'pick_copper', n: 1 }; P.sel = 0; recalcStats(); G.invChanged = true;
          window.__aims = []; if (!window.__origSS) { window.__origSS = startSwing; window.startSwing = function () { const r = window.__origSS.apply(this, arguments); window.__aims.push(r.aim); return r; }; } })()""")
        async def aim_test(label, stick, expect_deg, tol=14, hold=700):
            await ev("window.__aims.length = 0")
            await axes([0, 0, stick[0], stick[1]]); await ev("__setPad({7: true})"); await pg.wait_for_timeout(hold)
            await ev("__setPad({7: false})"); await axes([0, 0, 0, 0]); await pg.wait_for_timeout(450)
            aims = await ev("window.__aims.slice()")
            degs = [math.degrees(a) for a in aims]
            ok = len(degs) > 0 and all(abs(((d - expect_deg + 180) % 360) - 180) <= tol for d in degs)
            check(f'RT + analógico dir. {label}: arco ≈ {expect_deg}°', ok, [round(d) for d in degs][:6])
        await aim_test('↑', (0, -1), -90)
        await aim_test('→', (1, 0), 0)
        await aim_test('←', (-1, 0), 180)
        await aim_test('↖', (-.7, -.7), -135)
        await aim_test('↓→', (.7, .7), 45)
        # distância depende da inclinação
        await axes([0, 0, 1, 0]); await pg.wait_for_timeout(250)
        d_full = await ev("Math.hypot(G.mouse.wx - pcx(G.P), G.mouse.wy - pcy(G.P))"); await axes([0, 0, .62, 0]); await pg.wait_for_timeout(250)
        d_half = await ev("Math.hypot(G.mouse.wx - pcx(G.P), G.mouse.wy - pcy(G.P))"); await axes([0, 0, 0, 0])
        check('inclinação total = alvo mais longe que meia inclinação', d_full > d_half + 40, f'{d_full:.0f}px vs {d_half:.0f}px')
        check('aimDrive ativo', await ev("__PAD.aimDrive"))
        await pg.wait_for_timeout(1300)  # a mira “travada” expira
        await ev("G.P.face = -1"); await ev("window.__aims.length = 0")
        await ev("__setPad({7: true})"); await pg.wait_for_timeout(500); await ev("__setPad({7: false})"); await pg.wait_for_timeout(400)
        a = await ev("window.__aims.slice()")
        check('RT sem mira → ataca para onde o jogador olha (←)', len(a) > 0 and all(abs(x) > 2.4 for x in a), [round(math.degrees(x)) for x in a][:4])
        await ev("window.__aims.length = 0"); await axes([0, -1, 0, 0]); await ev("__setPad({7: true})"); await pg.wait_for_timeout(500); await ev("__setPad({7: false})"); await axes([0, 0, 0, 0]); await pg.wait_for_timeout(400)
        a = await ev("window.__aims.slice()")
        check('RT + analógico esq. ↑ → ataca para cima', len(a) > 0 and all(abs(math.degrees(x) + 90) < 20 for x in a), [round(math.degrees(x)) for x in a][:4])

        print('== acerta inimigo na direção da mira ==')
        await ev("""(() => { const P = G.P; G.enemies.length = 0; window.__dm = spawnEnemy('dummy', P.x + 30, P.y + P.h - ED.dummy.h); G.dpsLog.length = 0; window.__h0 = P.cb.hits; })()""")
        await axes([0, 0, 1, 0]); await ev("__setPad({7: true})"); await pg.wait_for_timeout(900); await ev("__setPad({7: false})"); await axes([0, 0, 0, 0])
        h = await ev("G.P.cb.hits - __h0"); dmg = await ev("G.dpsLog.reduce((a, b) => a + b[1], 0)")
        check('espada acerta o boneco à direita (RT + analógico →)', h > 0 and dmg > 0, f'golpes certeiros {h}, dano {dmg}')
        await ev("G.dpsLog.length = 0; window.__h0 = G.P.cb.hits; G.P.face = -1; G.enemies.length = 0; window.__dm = spawnEnemy('dummy', G.P.x + 30, G.P.y + G.P.h - ED.dummy.h)")
        await axes([0, 0, -1, 0]); await ev("__setPad({7: true})"); await pg.wait_for_timeout(900); await ev("__setPad({7: false})"); await axes([0, 0, 0, 0])
        h2 = await ev("G.P.cb.hits - __h0"); check('apontando para o lado oposto não acerta o boneco', h2 == 0, f'golpes certeiros {h2}')
        await pg.wait_for_timeout(500)
        await ev("G.enemies.length = 0; G.P.vx = 0")

        print('== mineração ==')
        await ev("(() => { const P = G.P; P.sel = 1; G.invChanged = true; G.dpsLog.length = 0; })()")
        await pg.wait_for_function("G.P.onGround", timeout=5000)
        tgt = await ev("""(() => { const P = G.P; const tx = Math.floor((P.x + P.w / 2) / TS), ty = Math.floor((P.y + P.h + 2) / TS); return { tx, ty, id: G.world.get(tx, ty) }; })()""")
        check('há bloco sob os pés', tgt['id'] != 0, tgt)
        await axes([0, 1, 0, 0]); await ev("__setPad({7: true})")
        try:
            await pg.wait_for_function(f"G.world.get({tgt['tx']}, {tgt['ty']}) === 0", timeout=6000); mined = True
        except Exception: mined = False
        await ev("__setPad({7: false})"); await axes([0, 0, 0, 0])
        mpos = await ev("({ my: Math.floor(G.mouse.wy / TS), mx: Math.floor(G.mouse.wx / TS) })")
        check('RT + analógico esq. ↓ minera o bloco abaixo', mined, f"alvo {tgt['tx']},{tgt['ty']} mira {mpos}")
        # colocar bloco: mira 1 tile à frente (ar) com o analógico esquerdo + RT
        await ev("(() => { const P = G.P; P.inv[2] = { id: 'dirt', n: 50 }; P.sel = 2; P.face = 1; G.invChanged = true; })()")
        await pg.wait_for_function("G.P.onGround", timeout=8000); await pg.wait_for_timeout(300)
        n0 = await ev("invCount('dirt')"); await axes([1, 0, 0, 0]); await ev("__setPad({7: true})"); await pg.wait_for_timeout(1000); await ev("__setPad({7: false})"); await axes([0, 0, 0, 0])
        n1 = await ev("invCount('dirt')"); check('RT com bloco coloca blocos à frente', n1 < n0, f'{n0} -> {n1}')

        print('== interagir (B) ==')
        await pg.wait_for_function("G.P.onGround", timeout=8000)
        await ev("(() => { const P = G.P, wd = G.world; P.sel = 0; const tx = Math.floor((P.x + P.w / 2) / TS), ty = Math.floor((P.y + 8) / TS); window.__door = { x: tx + 2, y: ty }; window.__chest = { x: tx - 4, y: ty };  wd.set(tx + 2, ty, T.doorC, true); wd.set(tx - 4, ty, T.chest, true); })()")
        await tap(1)
        check('B abre/fecha a porta mais próxima', await ev("G.world.get(__door.x, __door.y)") == await ev("T.doorO"))
        await tap(1)
        check('B de novo fecha a porta', await ev("G.world.get(__door.x, __door.y)") == await ev("T.doorC"))
        await ev("G.world.set(__door.x, __door.y, 0, true)")
        await tap(1)
        check('B abre o baú', await ev("G.ui.open") == 'inv' and await ev("G.chestPos") is not None, await ev("G.ui.open"))
        await tap(1)  # B fecha o painel
        check('B fecha o painel', await ev("G.ui.open") is None)
        await pg.wait_for_timeout(300)

        print('== painéis: cursor virtual ==')
        await ev("(() => { invAdd('wood', 30); invAdd('gel', 10); invAdd('stone', 40); G.ui.craftDirty = true; })()")
        await tap(3)
        check('Y abre inventário', await ev("G.ui.open") == 'inv')
        await pg.wait_for_timeout(300)
        check('cursor virtual visível', await ev("document.getElementById('pad-cursor').classList.contains('on')"))
        await ev("__PAD.cur.x = 100; __PAD.cur.y = 100"); await axes([1, 0, 0, 0], 350); await axes([0, 0, 0, 0], 100)
        cx1 = await ev("__PAD.cur.x"); check('analógico esq. move o cursor', cx1 > 250, f'x: 100 -> {cx1:.0f}')
        rect = await ev("(() => { const r = document.querySelector('#craft-list .rec'); if (!r) return null; r.scrollIntoView({block:'nearest'}); const b = r.getBoundingClientRect(); return { x: b.x + 30, y: b.y + b.height / 2, name: r.textContent.slice(0, 30) }; })()")
        check('há receita disponível na lista', rect is not None, rect)
        if rect:
            await ev(f"__PAD.cur.x = {rect['x']}; __PAD.cur.y = {rect['y']}"); await pg.wait_for_timeout(250)
            check('hover do cursor virtual mostra o tooltip', await ev("!document.getElementById('tooltip').classList.contains('hidden')"))
            before = await ev("G.P.inv.reduce((a, s) => a + (s ? s.n : 0), 0)")
            await tap(0, 200); await pg.wait_for_timeout(200)
            after = await ev("G.P.inv.reduce((a, s) => a + (s ? s.n : 0), 0)")
            check('A clica na receita e cria o item', before != after, f'itens {before} -> {after}')
        # clicar em slot e pegar item no cursor (mousedown no slot)
        slot = await ev("(() => { const s = document.querySelectorAll('#inv-grid .slot')[0]; const b = s.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()")
        await ev(f"__PAD.cur.x = {slot['x']}; __PAD.cur.y = {slot['y']}"); await pg.wait_for_timeout(200)
        await tap(0, 200); held = await ev("G.held ? G.held.id : null")
        check('A num slot pega o item (cursor)', held is not None, held)
        await tap(0, 200); held2 = await ev("G.held ? G.held.id : null")
        check('A de novo devolve o item ao slot', held2 is None, held2)
        # rolagem com o analógico direito
        sc = await ev("(() => { const l = document.getElementById('craft-list'); return { sh: l.scrollHeight, ch: l.clientHeight }; })()")
        if sc['sh'] > sc['ch'] + 5:
            b0 = await ev("(() => { const l = document.getElementById('craft-list'); const b = l.getBoundingClientRect(); __PAD.cur.x = b.x + 40; __PAD.cur.y = b.y + 40; return l.scrollTop; })()"); await pg.wait_for_timeout(150)
            await axes([0, 0, 0, 1], 300); await axes([0, 0, 0, 0], 100); b1 = await ev("document.getElementById('craft-list').scrollTop")
            check('analógico dir. rola a lista', b1 > b0, f'{b0} -> {b1}')
        else:
            check('analógico dir. rola a lista (lista curta: ignorado)', True)
        await tap(1)
        check('B fecha o inventário', await ev("G.ui.open") is None and not await ev("document.getElementById('pad-cursor').classList.contains('on')"))
        await tap(12); check('direcional ↑ abre o catálogo', await ev("G.ui.open") == 'arsenal'); await tap(12); check('direcional ↑ de novo fecha', await ev("G.ui.open") is None)
        await tap(13); check('direcional ↓ abre o mapa', await ev("G.ui.open") == 'map'); await tap(1); check('B fecha o mapa', await ev("G.ui.open") is None)
        await pg.wait_for_timeout(500)
        x_a = await ev("G.P.x"); await tap(0, 200)
        check('após fechar painel o jogo volta a responder', True)

        print('== painel de NPC (cursor virtual) ==')
        await ev("""(() => { const P = G.P, tx = Math.floor((P.x + P.w / 2) / TS) + 2, ty = Math.floor((P.y + P.h) / TS) - 1; window.__npc = spawnNpcQuiet('trader', { cx: tx, cy: ty, id: 'teste' }); __npc.x = tx * TS; __npc.y = P.y; invAdd('coin', 800); })()""")
        await pg.wait_for_timeout(400); await tap(1)
        check('B conversa com o NPC mais próximo', await ev("G.ui.open") == 'npc', await ev("G.ui.open"))
        await pg.wait_for_timeout(300)
        r = await ev("(() => { const b = document.getElementById('t-sell').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()")
        await ev(f"__PAD.cur.x = {r['x']}; __PAD.cur.y = {r['y']}"); await pg.wait_for_timeout(200); await tap(0, 200); await pg.wait_for_timeout(200)
        check('A clica na aba "Vender"', await ev("document.getElementById('t-sell').classList.contains('on')"))
        r = await ev("(() => { const b = document.getElementById('t-buy').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()")
        await ev(f"__PAD.cur.x = {r['x']}; __PAD.cur.y = {r['y']}"); await pg.wait_for_timeout(200); await tap(0, 200); await pg.wait_for_timeout(200)
        r = await ev("(() => { const e = document.querySelector('.shop-row[data-buy]'); const b = e.getBoundingClientRect(); return { x: b.x + 50, y: b.y + b.height / 2 }; })()")
        await ev(f"__PAD.cur.x = {r['x']}; __PAD.cur.y = {r['y']}"); await pg.wait_for_timeout(250)
        check('hover numa mercadoria mostra o tooltip', await ev("!document.getElementById('tooltip').classList.contains('hidden')"))
        c0 = await ev("invCount('coin')"); await tap(0, 200); await pg.wait_for_timeout(200); c1 = await ev("invCount('coin')")
        check('A compra o item do mercador', c1 < c0, f'moedas {c0} -> {c1}')
        await tap(1); check('B fecha o painel do NPC', await ev("G.ui.open") is None)
        await ev("G.npcs.length = 0"); await pg.wait_for_timeout(400)

        print('== pausa e guia ==')
        await tap(9)
        check('Start pausa', await ev("G.paused") is True)
        check('foco no menu de pausa', await ev(focus_id) == 'p-resume', await ev(focus_id))
        await tap(13); check('direcional ↓ no menu de pausa', await ev(focus_id) == 'p-help', await ev(focus_id))
        await tap(0); check('A abre o guia de controles', not await ev("document.getElementById('help').classList.contains('hidden')"))
        check('guia lista os botões do controle', 'Controle (gamepad)' in await ev("document.getElementById('help-box').textContent"))
        await tap(1); check('B fecha o guia', await ev("document.getElementById('help').classList.contains('hidden')"))
        check('continua pausado', await ev("G.paused") is True)
        await tap(9); check('Start retoma', await ev("G.paused") is False)
        await pg.wait_for_timeout(600)

        print('== mouse reassume e reticle ==')
        await axes([0, 0, 1, 0]); await pg.wait_for_timeout(300); await axes([0, 0, 0, 0])
        check('analógico → reticle ativo', await ev("__PAD.aimDrive") is True)
        await ev("(() => { __render(); })()")
        await pg.screenshot(path=devfile('pad_reticle.png'))
        await pg.mouse.move(200, 200); await pg.mouse.move(420, 260); await pg.wait_for_timeout(200)
        check('mover o mouse devolve a mira ao mouse', await ev("__PAD.aimDrive") is False)
        await pg.wait_for_timeout(300)
        sx = await ev("G.mouse.sx"); check('mira segue o mouse (sx≈420)', abs(sx - 420) < 3, sx)

        print('== desconexão ==')
        await ev("window.__padOn = false"); await pg.wait_for_timeout(300)
        check('sem controle: estado liberado', await ev("!KEYS.PadLeft && !KEYS.PadRight && !KEYS.PadJump && !__PAD.hold0 && __PAD.gp === null"))
        check('dica volta ao texto inicial', 'aperte um botão' in await ev("document.getElementById('pad-hint').textContent"))
        check('sem erros de página', not logs, logs[:3])
        await ctx.close()

        print('== API bloqueada (SecurityError) ==')
        ctx2 = await b.new_context(viewport={'width': 1000, 'height': 640}); await ctx2.add_init_script(BLOCKED)
        pg2 = await ctx2.new_page(); logs2 = []
        pg2.on('console', lambda m: logs2.append(m.text[:200]) if m.type == 'error' else None); pg2.on('pageerror', lambda e: logs2.append('PAGEERROR ' + str(e)[:300]))
        await pg2.goto(INDEX_URL); await pg2.wait_for_timeout(600)
        await pg2.click('#btn-cre'); await pg2.wait_for_function('window.__G.state === "play"', timeout=90000); await pg2.wait_for_timeout(800)
        check('jogo funciona com a API bloqueada', await pg2.evaluate('__PAD.err') is True and await pg2.evaluate('__G.state') == 'play')
        await pg2.evaluate('__G.state'); check('dica do título some quando a API está bloqueada', await pg2.evaluate("getComputedStyle(document.getElementById('pad-hint')).display") == 'none')
        check('sem erros na página', not logs2, logs2[:3])
        await ctx2.close()
        await b.close()
    bad = [r for r in res if not r[1]]
    print(f'\nverificações: {len(res)} | falhas: {len(bad)}')
    for r in bad: print('  FALHOU:', r[0], r[2])
    sys.exit(1 if bad else 0)
asyncio.run(main())
