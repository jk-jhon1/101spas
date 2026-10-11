'use strict';
// Sprites dos chefes (05d_bosspaint.js + 05e_bossart.js + BOSSDRAW em 14_draw_enemies.js):
// estilo (corpo escuro + brilho de uma cor por chefe), fases, espelhamento, íris que segue o jogador, tinta de dano/status,
// cache limitado, tempo de geração e caixas de colisão intactas. Uso: node dev/test_bosses.js
const { launch, INDEX_URL, run, startWorld, collectErrors } = require('./lib');
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FALHOU:', m); } };

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = collectErrors(pg);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(500); await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(500);

  const r = await pg.evaluate(() => {
    G.opts.noSpawn = true; G.opts.god = true; G.enemies.length = 0; G.paused = true;
    const out = {}, KINDS = ['boss_slime', 'boss_eye', 'boss_guardian', 'boss_colossus'];
    // ---- ferramentas ----
    const px = (cv) => { const g = cv.getContext('2d'); return g.getImageData(0, 0, cv.width, cv.height); };
    const lum = (r, g, b) => .299 * r + .587 * g + .114 * b;
    const stat = (cv, sel) => {   // contagem, caixa, luminância/cor médias (ponderadas pelo alfa) dos pixels que passam em sel
      const im = px(cv), d = im.data, W = cv.width; let n = 0, a = 0, L = 0, R = 0, G_ = 0, B = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sx = 0, sy = 0; const uniq = new Set();
      for (let i = 0; i < d.length; i += 4) {
        const al = d[i + 3]; if (al < 8) continue; const x = (i / 4) % W, y = ((i / 4) / W) | 0; if (sel && !sel(d[i], d[i + 1], d[i + 2], al)) continue;
        n++; a += al; L += lum(d[i], d[i + 1], d[i + 2]) * al; R += d[i] * al; G_ += d[i + 1] * al; B += d[i + 2] * al; sx += x; sy += y;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (al > 250) uniq.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2]);
      }
      return { n, w: x1 - x0 + 1, h: y1 - y0 + 1, x0, y0, L: a ? L / a : 0, r: a ? R / a : 0, g: a ? G_ / a : 0, b: a ? B / a : 0, cx: n ? sx / n : 0, cy: n ? sy / n : 0, uniq: uniq.size };
    };
    const SPR = { boss_slime: () => bossSpr('sl', 0, 0), boss_eye: () => bossSpr('ey', 0, 0), boss_guardian: () => bossSpr('gd', 0, 0), boss_colossus: () => bossSpr('co', 1, 0) };
    const SIZE = { boss_slime: [70, 52], boss_eye: [56, 56], boss_guardian: [58, 70], boss_colossus: [90, 90] };
    // ---- 1) cadastro, tamanho das caixas de colisão, desenho próprio ----
    out.reg = KINDS.map(k => ({ k, size: [ED[k].w, ED[k].h], want: SIZE[k], draw: ED[k].draw, has: typeof BOSSDRAW[ED[k].draw] }));
    out.allBoss = Object.keys(ED).filter(k => ED[k].boss && !ED[k].bx).length;
    // ---- 2) estilo: corpo escuro, brilho forte, paleta curta ----
    out.style = {};
    for (const k of KINDS) {
      const s = SPR[k](), body = stat(s.c, null), em = stat(s.em, null), dark = stat(s.c, (r, g, b, a) => a > 250);
      out.style[k] = { w: s.w, h: s.h, opacos: body.n, emN: em.n, emL: Math.round(em.L), bodyL: Math.round(body.L), emRGB: [em.r, em.g, em.b].map(Math.round), cores: dark.uniq };
    }
    // ---- 3) desenho no mundo: fases, espelho, tinta ----
    const cv = document.createElement('canvas'); cv.width = 520; cv.height = 460; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const P = G.P, wd = G.world;
    const draw = (e, cx0, cy0, glow) => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(1, 0, 0, 1, 260 - Math.round(e.x + e.w / 2), 230 - Math.round(e.y + e.h / 2)); drawEnemy(g, e); if (glow) { g.globalCompositeOperation = 'lighter'; drawEnemyGlow(g, e); g.globalCompositeOperation = 'source-over'; } g.setTransform(1, 0, 0, 1, 0, 0); return stat(cv, null); };
    const mk = (k, f) => { const d = ED[k]; const e = spawnEnemy(k, 4000, 3000); e.x = 4000; e.y = 3000; e.vx = e.vy = 0; e.age = 0; e.face = 1; e.rot = 0; e.onGround = true; e.flash = 0; e.st = {}; e.ai.state = 'hover'; e.ai.t = 99; if (f) f(e); return e; };
    P.x = 4000 + 600; P.y = 3000;   // jogador à direita
    out.draw = {};
    for (const k of KINDS) {
      let err = null, res = {};
      try {
        const e0 = mk(k); res.base = draw(e0); res.layers = e0._bl.length / 7;
        res.p2 = draw(mk(k, e => { e.hp = e.hpMax * .4; })); res.p3 = draw(mk(k, e => { e.hp = e.hpMax * .2; }));
        res.flash = draw(mk(k, e => { e.flash = .2; })); res.freeze = draw(mk(k, e => { e.st.freeze = { t: 3, v: 0 }; }));
        res.glow = draw(mk(k), 0, 0, true);
      } catch (ex) { err = String(ex && ex.stack || ex).slice(0, 300); }
      out.draw[k] = Object.assign(res, { err });
    }
    // espelho do Guardião: face -1 deve ser o reflexo exato de face 1 (corpo, foice, lanterna e corrente)
    { const a = mk('boss_guardian'); draw(a); const A = px(cv).data.slice(); const c2 = mk('boss_guardian', e => { e.face = -1; }); draw(c2); const B = px(cv).data, W = cv.width; let eq = 0, tot = 0;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < W; x++) { const xm = 2 * 260 - 1 - x; if (xm < 0 || xm >= W) continue; const aa = A[(y * W + x) * 4 + 3] > 128, bb = B[(y * W + xm) * 4 + 3] > 128; if (aa || bb) { tot++; if (aa === bb) eq++; } }
      out.mirror = { eq, tot }; }
    // achatamento do Rei Slime (-.35 .. .35): mais largo e mais baixo quando esmagado
    { const sq = (v) => { const e = mk('boss_slime'); e.ai.squash = v; e.onGround = true; return draw(e); }; out.squash = { flat: sq(-.35), tall: sq(.35) }; }
    // íris do Olho segue o jogador; íris do Colosso também
    { const at = (rot, dark) => { const e = mk('boss_eye', e => { e.rot = rot; }); draw(e); return stat(cv, (r, gg, bb) => r > 190 && gg < 90 && bb < 110); };
      out.iris = { right: at(0), left: at(Math.PI) };
      const col = (px_) => { P.x = px_; const e = mk('boss_colossus'); draw(e); return { ax: e._bl[8], ay: e._bl[9], body: e._bl[1] }; };   // 2ª camada = íris dourada→índigo dentro do olho
      out.colIris = { right: col(4000 + 600), left: col(4000 - 600) }; P.x = 4600; }
    // sombra no chão sob os chefes voadores: aparece com chão até 16 blocos abaixo e some sem chão
    { const e = mk('boss_eye'), tx = Math.floor((e.x + e.w / 2) / TS), ty0 = Math.floor((e.y + e.h) / TS);
      for (let x = tx - 4; x <= tx + 4; x++) for (let y = ty0; y <= ty0 + 22; y++) wd.set(x, y, 0, true);
      const row = (ty) => { const sy = Math.round(230 + ty * TS - (e.y + e.h / 2)), id = g.getImageData(260 - 6, sy + 1, 12, 1).data; let n = 0, dark = 0; for (let i = 0; i < id.length; i += 4) if (id[i + 3] > 40 && id[i + 3] < 140) { n++; if (id[i] < 40 && id[i + 2] < 80) dark++; } return { n, dark }; };
      wd.set(tx, ty0 + 5, T.stone, true); draw(e); out.shadow = { com: row(ty0 + 5) };
      wd.set(tx, ty0 + 5, 0, true); draw(e); out.shadow.sem = row(ty0 + 5);
      wd.set(tx, ty0 + 20, T.stone, true); draw(e); out.shadow.longe = row(ty0 + 20); wd.set(tx, ty0 + 20, 0, true); }
    // ---- 4) cache limitado depois de muita animação ----
    for (let i = 0; i < 400; i++) for (const k of KINDS) { const e = mk(k, e => { e.age = i * .07; e.hp = e.hpMax * [1, .6, .3][i % 3]; e.ai.squash = (i % 15 - 7) / 20; }); draw(e); }
    out.cache = BOSSART.cache.size;
    // ---- 5) tempo de geração por quadro (software, sem GPU: limite folgado) ----
    BOSSART.cache.clear(); const TM = (f) => { const t = performance.now(); f(); return performance.now() - t; };
    out.gen = { gd: TM(() => bossSpr('gd', 1, 1)), sl: TM(() => bossSpr('sl', 3, 0)), ey: TM(() => bossSpr('ey', 1, 2)), co: TM(() => bossSpr('co', 3, 1)) };
    return out;
  });

  if (process.env.TEST_VERBOSE) console.log(JSON.stringify({ style: r.style, cache: r.cache, gen: r.gen, mirror: r.mirror, squash: [r.squash.flat.w, r.squash.flat.h, r.squash.tall.w, r.squash.tall.h] }));
  // ---------- verificações ----------
  ok(r.allBoss === 4, 'existem exatamente 4 chefes originais cadastrados (os 50 novos têm testes próprios: test_bx e test_bx_art)  -> ' + r.allBoss);
  for (const x of r.reg) {
    ok(x.size[0] === x.want[0] && x.size[1] === x.want[1], x.k + ': caixa de colisão intacta ' + x.want.join('×') + '  -> ' + x.size.join('×'));
    ok(x.has === 'function', x.k + ': tem desenho próprio (BOSSDRAW.' + x.draw + ')');
  }
  const ACC = { boss_slime: (c) => c[2] > c[0] + 60 && c[1] > c[0] + 40, boss_eye: (c) => c[0] > c[1] + 60 && c[0] > c[2] + 40, boss_guardian: (c) => c[0] > c[1] + 30 && c[1] > c[2] + 30, boss_colossus: (c) => c[0] > c[2] + 50 && c[1] > c[2] + 30 };
  const NAME = { boss_slime: 'ciano', boss_eye: 'carmesim', boss_guardian: 'brasa laranja', boss_colossus: 'ouro' };
  for (const k of Object.keys(r.style)) {
    const s = r.style[k];
    ok(s.opacos > 1200 && s.emN > 20, k + ': sprite com corpo (' + s.opacos + ' px) e pixels emissivos (' + s.emN + ')');
    ok(s.emL > s.bodyL + 25, k + ': o brilho é bem mais claro que o corpo (luz ' + s.emL + ' contra ' + s.bodyL + ')');
    ok(ACC[k](s.emRGB), k + ': brilho na cor do chefe (' + NAME[k] + ')  -> rgb ' + s.emRGB.join(','));
    ok(s.cores > 12 && s.cores <= 170, k + ': paleta curta e coerente (' + s.cores + ' cores opacas)');
  }
  const accents = Object.values(r.style).map(s => s.emRGB.join(',')); ok(new Set(accents).size === 4, 'cada chefe tem uma cor de brilho diferente');
  for (const k of Object.keys(r.draw)) {
    const d = r.draw[k];
    ok(!d.err, k + ': desenha sem erro em todas as fases/tintas  -> ' + d.err);
    ok(d.base && d.base.n > 1000 && d.layers >= 1, k + ': aparece na tela (' + (d.base && d.base.n) + ' px, ' + d.layers + ' camadas emissivas)');
    ok(d.glow && d.glow.n >= d.base.n, k + ': o passe aditivo só acrescenta luz  -> ' + (d.glow && d.glow.n) + ' ≥ ' + d.base.n);
    ok(d.flash && d.flash.L > d.base.L + 25, k + ': clarão de dano clareia o sprite (' + Math.round(d.base.L) + ' → ' + Math.round(d.flash.L) + ')');
    ok(d.freeze && d.freeze.L > d.base.L + 6 && (k === 'boss_slime' || d.freeze.b > d.base.b + 8), k + ': status de gelo tinge o sprite (luz ' + Math.round(d.base.L) + ' → ' + Math.round(d.freeze.L) + ', azul ' + Math.round(d.base.b) + ' → ' + Math.round(d.freeze.b) + ')');
    ok(k === 'boss_slime' || d.p2.n !== d.base.n || Math.abs(d.p2.L - d.base.L) > .01, k + ': a fase 2 muda o desenho');
  }
  ok(Math.abs(r.draw.boss_colossus.p3.L - r.draw.boss_colossus.base.L) > .05, 'Colosso: as rachaduras de ouro da fase 3 mudam o desenho (luz ' + r.draw.boss_colossus.base.L.toFixed(2) + ' → ' + r.draw.boss_colossus.p3.L.toFixed(2) + ')');
  ok(r.mirror.tot > 3000 && r.mirror.eq / r.mirror.tot > .985, 'Guardião: virado para o outro lado é o reflexo exato (foice e lanterna trocam de lado)  -> ' + r.mirror.eq + '/' + r.mirror.tot);
  ok(r.squash.flat.w > r.squash.tall.w + 8 && r.squash.flat.h < r.squash.tall.h - 8, 'Rei Slime: esmagado fica mais largo e baixo que esticado  -> ' + [r.squash.flat.w, r.squash.flat.h, r.squash.tall.w, r.squash.tall.h].join(' '));
  ok(r.iris.right.n > 20 && r.iris.left.n > 20 && r.iris.right.cx > r.iris.left.cx + 6, 'Olho: a íris acompanha o jogador (centro x ' + r.iris.left.cx.toFixed(1) + ' → ' + r.iris.right.cx.toFixed(1) + ')');
  ok(r.colIris.right.ax > r.colIris.left.ax + 5 && Math.abs(r.colIris.right.ay - r.colIris.left.ay) <= 2, 'Colosso: a íris acompanha o jogador (x ' + r.colIris.left.ax + ' → ' + r.colIris.right.ax + ')');
  ok(r.shadow.com.n >= 10 && r.shadow.com.dark >= 10 && r.shadow.sem.n === 0 && r.shadow.longe.n === 0, 'Olho: sombra escura no chão quando há chão logo abaixo; sem sombra sem chão ou com chão a mais de 16 blocos  -> ' + JSON.stringify(r.shadow));
  ok(r.cache <= 80, 'cache de quadros fica limitado depois de muita animação (' + r.cache + ' entradas, máximo 80)');
  for (const k of Object.keys(r.gen)) ok(r.gen[k] < 120, 'gerar um quadro de ' + k + ' leva ' + r.gen[k].toFixed(1) + ' ms (limite 120 ms no software)');
  ok(errs.length === 0, 'sem erros na página  -> ' + JSON.stringify(errs.slice(0, 3)));
  console.log(`test_bosses: ${total - fails}/${total} verificações ok`);
  await b.close(); process.exitCode = fails ? 1 : 0;
});
