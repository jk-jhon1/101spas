'use strict';
// Arte dos 90 chefes novos (05f..05l_bxart*.js): cada um tem sprite próprio (silhueta diferente de todos os outros), corpo escuro com brilho
// emissivo, paleta curta, caixa de colisão dentro do desenho, mecânica descrita e dados completos. Uso: node dev/test_bx_art.js
const { launch, INDEX_URL, run, startWorld, collectErrors } = require('./lib');
let total = 0, fails = 0;
const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FALHOU:', m); } };
run(async () => {
  const b = await launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = collectErrors(pg);
  await pg.goto(INDEX_URL); await pg.waitForTimeout(500); await startWorld(pg, 21, 'btn-cre'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => {
    const out = { rows: [], dup: [] }, lum = (r, g, b) => .299 * r + .587 * g + .114 * b, sigs = [];
    for (const d of BXLIST) {
      const A = BXART[d.id], row = { id: d.id, art: !!A }; out.rows.push(row); if (!A) continue;
      const ed = ED['bx_' + d.id]; row.hit = [ed.w, ed.h]; row.insideHit = A.cx - ed.w / 2 >= 0 && A.cy - ed.h / 2 >= 0 && A.cx + ed.w / 2 <= A.W && A.cy + ed.h / 2 <= A.H;
      const s = bxSpr(d.id, 0, 0), im = s.c.getContext('2d').getImageData(0, 0, s.w, s.h).data, em = s.em.getContext('2d').getImageData(0, 0, s.w, s.h).data;
      let n = 0, L = 0, nb = 0, Lb = 0, ne = 0, Le = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const uniq = new Set();
      for (let i = 0; i < im.length; i += 4) { if (im[i + 3] < 200) continue; const x = (i / 4) % s.w, y = ((i / 4) / s.w) | 0; n++; const l = lum(im[i], im[i + 1], im[i + 2]); L += l; uniq.add(im[i] << 16 | im[i + 1] << 8 | im[i + 2]); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (em[i + 3] > 0) { ne++; Le += l; } else { nb++; Lb += l; } }
      row.n = n; row.ne = ne; row.glow = ne ? Le / ne : 0; row.body = nb ? Lb / nb : 0; row.colors = uniq.size; row.bbox = [x1 - x0 + 1, y1 - y0 + 1];
      // assinatura da silhueta: recorte no retângulo ocupado e amostra 20x20 do alfa
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1, sg = []; for (let j = 0; j < 20; j++) for (let k = 0; k < 20; k++) { const x = x0 + Math.floor((k + .5) / 20 * sw), y = y0 + Math.floor((j + .5) / 20 * sh); sg.push(im[(y * s.w + x) * 4 + 3] > 128 ? 1 : 0); }
      sigs.push([d.id, sg, sw / sh]);
      row.mech = (d.mech || '').length; row.sword = !!(d.sword && IT[d.sword]); row.item = !!IT['sg_' + d.id]; row.rec = RECIPES.some(rc => rc.out === 'sg_' + d.id); row.acc = d.acc;
    }
    for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) { let df = 0; for (let k = 0; k < 400; k++) if (sigs[i][1][k] !== sigs[j][1][k]) df++; const ar = Math.abs(Math.log(sigs[i][2] / sigs[j][2])); if (df < 36 && ar < .12) out.dup.push([sigs[i][0], sigs[j][0], df]); }
    out.n = BXLIST.length; out.accents = new Set(BXLIST.map(d => d.acc)).size; out.swords = new Set(BXLIST.map(d => d.sword)).size; out.names = new Set(BXLIST.map(d => d.n)).size;
    out.mechs = new Set(BXLIST.map(d => d.mech)).size; out.acts = BX_ACTS.slice(1).map((_, i) => BXLIST.filter(d => d.act === i + 1).length); out.cache = BOSSART.cache.size;
    out.hpOrder = BXLIST.every((d, i) => i === 0 || d.act > BXLIST[i - 1].act || d.hp >= BXLIST[i - 1].hp * .6);
    return out;
  });
  ok(r.n === 90, '90 chefes novos cadastrados  -> ' + r.n);
  ok(JSON.stringify(r.acts) === '[8,14,16,12,20,20]', 'chefes por ato 8/14/16/12/20/20  -> ' + JSON.stringify(r.acts));
  ok(r.names === 90 && r.mechs === 90 && r.swords === 90, 'nomes, mecânicas e espadas todos diferentes  -> ' + [r.names, r.mechs, r.swords].join('/'));
  ok(r.accents >= 55, 'pelo menos 55 cores de brilho diferentes entre os 90  -> ' + r.accents);
  for (const w of r.rows) {
    ok(w.art, w.id + ': tem arte');
    if (!w.art) continue;
    ok(w.insideHit, w.id + ': a caixa de colisão ' + w.hit.join('×') + ' fica dentro do desenho');
    ok(w.n > 350 && w.bbox[0] >= 24 && w.bbox[1] >= 24, w.id + ': sprite com corpo (' + w.n + ' px, ' + w.bbox.join('×') + ')');
    ok(w.ne >= 8, w.id + ': tem pixels que brilham (' + w.ne + ')');
    ok(w.glow > w.body + 8, w.id + ': o brilho é mais claro que o corpo (luz ' + Math.round(w.glow) + ' contra ' + Math.round(w.body) + ')');
    ok(w.colors >= 8 && w.colors <= 260, w.id + ': paleta coerente (' + w.colors + ' cores opacas)');
    ok(w.mech > 40 && w.sword && w.item && w.rec, w.id + ': mecânica descrita, espada, sigilo e receita existem');
  }
  // ---- sigilos e condições de invocação (modo Aventura) ----
  const sg = await pg.evaluate(() => {
    const out = { rows: [], use: null }, P = G.P, wd = G.world; G.mode = 'adventure'; G.opts.god = true; G.opts.noSpawn = true;
    const bio = {}; for (const rr of wd.biomeRuns()) { const k = BIO_NAMES[rr.b]; if (k && bio[k] === undefined) bio[k] = (rr.x0 + rr.x1) >> 1; }
    const place = (d, good) => {
      const c = d.cond || {}; let tx = Math.floor(wd.spawn.x / TS); G.time = .3;
      if (c.biome) { if (good) tx = bio[c.biome]; else { const o = Object.keys(bio).find(k => k !== c.biome); tx = bio[o]; } }
      let ty = wd.surf[tx] - 4;
      if (c.layer) { const L = { sky: Y_SKY - 20, surface: wd.surf[tx] - 4, cave: wd.surf[tx] + 40, deep: Y_DEEP + 10, hell: Y_HELL + 10 }; ty = good ? L[c.layer] : (c.layer === 'surface' ? Y_DEEP + 10 : wd.surf[tx] - 4); }
      if (c.night) G.time = good ? .9 : .3; if (c.day) G.time = good ? .3 : .9;
      P.x = tx * TS; P.y = ty * TS; P.dead = false;
    };
    const clear = () => { G.boss = null; G.enemies.length = 0; G.projs.length = 0; G.bxs = null; };
    let maxMs = 0;
    for (const d of BXLIST) {
      const row = { id: d.id, lowStage: null, good: null, bad: null }; out.rows.push(row);
      if (BX_ACTS[d.act].stage > 0) { clear(); G.stage = BX_ACTS[d.act].stage - 1; place(d, true); row.lowStage = summonBoss('x:' + d.id); }
      clear(); G.stage = 4; place(d, true); const t0 = performance.now(); row.good = summonBoss('x:' + d.id); maxMs = Math.max(maxMs, performance.now() - t0); row.spawned = !!(G.boss && G.boss.k === 'bx_' + d.id);
      const c = d.cond || {}; if (c.biome || c.layer || c.night || c.day) { clear(); G.stage = 4; place(d, false); row.bad = summonBoss('x:' + d.id); }
    }
    clear(); G.stage = 4; const d = BX.vespa; place(d, true); P.inv[2] = { id: 'sg_vespa', n: 2 }; P.sel = 2; useConsumable(P, P.inv[2], IT.sg_vespa); out.use = { boss: !!(G.boss && G.boss.k === 'bx_vespa'), left: P.inv[2] ? P.inv[2].n : 0 };
    clear(); G.mode = 'creative'; G.stage = 0; out.maxMs = Math.round(maxMs);
    return out;
  });
  for (const w of sg.rows) { ok(w.good === true && w.spawned, w.id + ': com estágio e condição certos, o sigilo invoca o chefe'); ok(w.lowStage === null || w.lowStage === false, w.id + ': antes do estágio do ato, recusa'); ok(w.bad === null || w.bad === false, w.id + ': com a condição errada (local/hora), recusa'); }
  ok(sg.use && sg.use.boss && sg.use.left === 1, 'usar o item Sigilo invoca o chefe e gasta uma unidade (modo Aventura)  -> ' + JSON.stringify(sg.use));
  ok(sg.maxMs < 900, 'gerar todos os quadros na invocação leva no máximo ' + sg.maxMs + ' ms no software (limite 900 ms)');
  // ---- efeitos que os chefes aplicam no jogador (fora do modo invencível) ----
  const db = await pg.evaluate(() => {
    const out = {}, P = G.P, wd = G.world; G.mode = 'creative'; G.opts.god = false; G.opts.noSpawn = true; G.enemies.length = 0; G.projs.length = 0; G.boss = null; G.paused = false;
    const x0 = Math.floor(wd.spawn.x / TS), gy = wd.surf[x0]; for (let x = x0 - 40; x < x0 + 40; x++) { for (let y = gy - 50; y < gy; y++) { wd.set(x, y, 0, true); wd.setWall(x, y, 0); } wd.set(x, gy, T.grass, true); for (let y = gy + 1; y < gy + 8; y++) wd.set(x, y, T.dirt, true); }
    const reset = () => { P.buffs = {}; P.x = x0 * TS; P.y = (gy - 3) * TS; P.vx = P.vy = 0; P.hp = P.maxHp = 400; P.dead = false; P.inv_ = 0; P.kbT = 0; for (const k of ['KeyD', 'KeyA', 'Space']) KEYS[k] = false; G.mouse.down[0] = false; for (let i = 0; i < 40; i++) __step(1 / 60); };
    const run = (n) => { for (let i = 0; i < n; i++) __step(1 / 60); };
    reset(); KEYS.KeyD = true; run(40); out.base = P.x - x0 * TS; KEYS.KeyD = false;
    reset(); addBuff('slow', 3, { mult: .5 }); KEYS.KeyD = true; run(40); out.slow = P.x - x0 * TS; KEYS.KeyD = false;
    reset(); addBuff('confuse', 3); KEYS.KeyD = true; run(40); out.confuse = P.x - x0 * TS; KEYS.KeyD = false;
    reset(); addBuff('stun', 3); KEYS.KeyD = true; run(40); out.stun = P.x - x0 * TS; KEYS.KeyD = false;
    reset(); P.inv[0] = { id: 's001', n: 1 }; P.sel = 0; recalcStats(); const c00 = P.cb.count; G.mouse.down[0] = true; run(60); out.swingsOk = P.cb.count - c00; G.mouse.down[0] = false; reset(); P.inv[0] = { id: 's001', n: 1 }; P.sel = 0; const c01 = P.cb.count; addBuff('silence', 3); G.mouse.down[0] = true; run(60); out.swingsSilence = P.cb.count - c01; G.mouse.down[0] = false;
    reset(); P.y = (gy - 20) * TS; addBuff('gravflip', 2); run(40); out.gravflip = P.vy; reset(); P.y = (gy - 20) * TS; P.vy = 0; run(30); out.gravNormal = P.vy;
    reset(); P.y = (gy - 30) * TS; addBuff('floaty', 3); run(60); out.floaty = P.vy; reset(); P.y = (gy - 30) * TS; run(60); out.fall = P.vy;
    reset(); P.hp = 100; addBuff('curse', 3); healPlayer(50); out.curseHeal = P.hp; reset(); P.hp = 100; healPlayer(50); out.heal = P.hp;
    reset(); addBuff('bleed', 3, { dmg: 5, stacks: 3 }); run(90); out.bleed = P.maxHp - P.hp;
    reset(); out.atk0 = atkSpeedMult(P); addBuff('slowatk', 3, { amt: .5 }); out.atk1 = atkSpeedMult(P);
    reset(); addBuff('slow', .1, { mult: .5 }); run(20); out.expired = !P.buffs.slow; G.opts.god = true; return out;
  });
  ok(db.slow < db.base * .75 && db.slow > 5, 'Lentidão: anda bem menos no mesmo tempo (' + Math.round(db.slow) + ' contra ' + Math.round(db.base) + ' px)');
  ok(db.confuse < -10 && db.base > 20, 'Confusão: apertar para a direita faz andar para a esquerda (' + Math.round(db.confuse) + ' px)');
  ok(Math.abs(db.stun) < 4, 'Atordoamento: não anda (' + Math.round(db.stun) + ' px)');
  ok(db.swingsOk > 0 && db.swingsSilence === 0, 'Silêncio: com a espada em mãos ataca normalmente (' + db.swingsOk + ' golpes), em silêncio não ataca (' + db.swingsSilence + ')');
  ok(db.gravflip < -30 && db.gravNormal > -5, 'Gravidade invertida: sobe em vez de cair (vy ' + Math.round(db.gravflip) + ')');
  ok(db.floaty < db.fall - 80 || db.floaty < 500, 'Flutuar: cai mais devagar (' + Math.round(db.floaty) + ' contra ' + Math.round(db.fall) + ')');
  ok(db.curseHeal === 100 && db.heal === 150, 'Maldição: não se cura; sem ela cura normal  -> ' + db.curseHeal + ' / ' + db.heal);
  ok(db.bleed >= 20 && db.bleed <= 120, 'Sangramento: 3 acúmulos tiram vida com o tempo (' + db.bleed + ' de dano em 1,5 s)');
  ok(db.atk1 < db.atk0 - .3, 'Tempo lento: velocidade de ataque cai (' + db.atk0.toFixed(2) + ' → ' + db.atk1.toFixed(2) + ')');
  ok(db.expired, 'os efeitos acabam sozinhos');
  ok(r.dup.length === 0, 'nenhum par de chefes com silhueta quase igual  -> ' + JSON.stringify(r.dup));
  ok(errs.length === 0, 'sem erros na página  -> ' + JSON.stringify(errs.slice(0, 3)));
  console.log(`test_bx_art: ${total - fails}/${total} verificações ok`);
  await b.close(); process.exitCode = fails ? 1 : 0;
});
