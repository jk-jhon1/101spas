/* ============================================================
   11b_swords_x: TIERS 7 a 10 — 80 espadas novas (121–200)
   - 20 espadas por tier, cada uma com nome, dano, velocidade, mecânica
     e um desenho exclusivo (receitas de arte em look.art2, pintadas por 06b_swordart.js)
   - FX2: efeitos novos (ecos do golpe, domínios, marcas que detonam,
     correntes, fendas, singularidades, condenação em linha, etc.)
   Carregado depois de 11_swords.js (usa S, SWORDS, IT, RECIPES) e de 10_fx.js (FX).
   ============================================================ */

// ---------- utilidades dos efeitos novos ----------
function fx2bolt(x0, y0, x1, y1, col, n) {   // raio desenhado como corrente de partículas
  n = n || 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    addPart({ x: lerp(x0, x1, t) + rnd(-2.5, 2.5), y: lerp(y0, y1, t) + rnd(-2.5, 2.5), vx: rnd(-20, 20), vy: rnd(-20, 20), life: .24, size: 2.4, col, glow: true });
  }
  burst(x1, y1, 6, { col: [col, '#fff'], spd: 110, glow: true, life: .3 });
}
function fx2inst(sw) { return { sw: sw || sword(G.P), dmgMult: 1, id: -1, aim: 0, tip: { x: pcx(G.P), y: pcy(G.P) }, side: 1, arc: 2.5, dur: .2 }; }
const fx2fake = o => Object.assign({ sw: sword(G.P), dmgMult: 1, id: -1 }, o || {});

// ================= EFEITOS NOVOS (FX2) =================
const FX2 = {
  // eco: repete o arco do golpe com arcos fantasmas atrasados, alternando a inclinação
  echo: (n, dm, o) => ({ onApex(P, inst) {
    if (inst.ghost || inst.sub) return;   // um eco nunca gera outros ecos (senão vira exponencial e trava o jogo)
    o = o || {};
    for (let i = 1; i <= n; i++) startSwing(P, inst.sw, { ghost: true, delay: i * (o.gap || .09), aim: inst.aim + (i % 2 ? -1 : 1) * (o.spread === undefined ? .24 : o.spread), dmgMult: dm, dur: o.dur || .2, alpha: Math.max(.35, .85 - i * .18) });
    ringFx(inst.tip.x, inst.tip.y, 30 + n * 6, o.col || '#fde68a', .35, 2); sfx('swing2', .5);
  } }),

  // leque de lâminas retas
  fan: (n, spread, dm, o) => ({ onApex(P, inst) {
    o = o || {};
    for (let i = 0; i < n; i++) shoot(P, inst, { kind: 'linear', shape: o.shape || 'blade', ang: (i - (n - 1) / 2) * spread, r: o.r || 8, speed: o.speed || 640, dm: dm, life: o.life || .62, pierce: o.pierce === undefined ? 1 : o.pierce, tiles: false, col: o.col, col2: o.col2 || '#ffffff', glow: o.glow || o.col, glowR: o.glowR || 30, trail: o.trail || o.col, kbm: .35, light: o.light, elem: o.elem });
    sfx('shot', .6);
  } }),

  // nova: explosão em anel ao redor do jogador
  nova: (r, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const x = pcx(P), y = pcy(P);
    explode(x, y, r || 92, dmgOf(inst, dm || .8), { sword: inst.sw, col: o.col || '#fbbf24', cols: o.cols, kb: o.kb === undefined ? 5 : o.kb, status: o.status, elem: o.elem, falloff: true, noHooks: true });
    ringFx(x, y, (r || 92) * 1.25, o.col2 || '#ffffff', .45, 3);
  } }),

  // cometa: meteoro no cursor
  comet: (dm, o) => ({ onApex(P, inst) {
    o = o || {}; const m = G.mouse;
    const tx = clamp(m.wx, pcx(P) - 420, pcx(P) + 420), ty = clamp(m.wy, pcy(P) - 300, pcy(P) + 250);
    meteorFall(P, inst, tx, ty, { r: o.r || 20, dm: dm || 1.6, boomR: o.boomR || 84, col: o.col || '#fbbf24', col2: o.col2 || '#fff7c2', height: 470, speed: 720, ang: PI / 2 + rnd(-.24, .24), status: o.status, tiles: 0 });
    sfx('fire');
  } }),

  // varredura: feixe que gira cobrindo a direção da mira
  sweep: (dm, o) => ({ onApex(P, inst) {
    o = o || {}; const arc = o.arc || .78, side = inst.side || 1, a0 = inst.aim - arc, a1 = inst.aim + arc, life = o.life || .75;
    const s0 = instOrigin(P, inst);
    const p = fireBeam({ x: s0.x, y: s0.y, ang: side > 0 ? a0 : a1, len: o.len || 2100, width: o.w || 20, hitW: (o.w || 20) + 2, life, tick: .08, pierceTiles: true, col: o.col, col2: o.col2 || '#ffffff', glow: o.glow || o.col, dmg: dmgOf(inst, dm || .3), kb: .6, sword: inst.sw, status: o.status, elem: o.elem });
    const f0 = p.onUpdate, t0 = G.t;
    p.onUpdate = (q, dt) => { const k = clamp((G.t - t0) / (life * .92), 0, 1); q.ang = side > 0 ? lerp(a0, a1, k) : lerp(a1, a0, k); const s = instOrigin(G.P, inst); q.x = s.x; q.y = s.y; if (f0) f0(q, dt); };
    sfx('laser'); shake(4); if (o.flash) flash(o.flash, .25, .3);
  } }),

  // corrente elétrica que salta entre inimigos
  chain: (n, jump, dm, o) => ({ onHit(P, e, h) {
    if (h.src !== 'melee' && h.src !== 'proj') return;
    o = o || {}; let src = e; const seen = new Set([e]);
    for (let i = 0; i < n; i++) {
      const nx = nearestEnemy(ecx(src), ecy(src), jump || 150, src, t => !seen.has(t));
      if (!nx) break; seen.add(nx);
      fx2bolt(ecx(src), ecy(src), ecx(nx), ecy(nx), o.col || '#fde047');
      hitEnemy(nx, { src: 'area', id: 'cz' + h.inst.id + ':' + i, imm: .25, dmg: dmgOf(h.inst, dm || .38), kb: .4, sword: h.sword, elem: o.elem || 'lightning', fs: .3, critChance: 0, noHooks: true });
      src = nx;
    }
    sfx('thunder', .4);
  } }),

  // marca: o alvo marcado detona depois de alguns instantes
  mark: (dur, dm, o) => {
    const pend = new Map();
    return {
      onHit(P, e, h) {
        if (h.src !== 'melee' && h.src !== 'proj') return;
        applyStatus(e, 'mark', dur || 1.5);
        pend.set(e, { t: dur || 1.5, inst: h.inst, sw: h.sword, x: ecx(e), y: ecy(e) });
        if (pend.size > 24) pend.delete(pend.keys().next().value);
      },
      tick(P, dt) {
        for (const [e, s] of pend) {
          if (e.dead) { pend.delete(e); continue; }
          s.t -= dt;
          if (s.t > 0) { if (Math.random() < dt * 8) burst(ecx(e), ecy(e) - 6, 1, { col: [(o && o.col) || '#e879f9', '#fff'], spd: 20, life: .3, glow: true, size: 2 }); continue; }
          pend.delete(e);
          explode(ecx(e), ecy(e), (o && o.r) || 58, dmgOf(s.inst, dm || .75), { sword: s.sw, col: (o && o.col) || '#e879f9', kb: 3, noHooks: true });
        }
      },
    };
  },

  // domínio: aura que acompanha o jogador e fere quem entra
  domain: (r, life, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const R = r || 110, L = life || 4;
    const p = mkProj(P, inst, { kind: 'custom', shape: 'ring', noHit: true, x: pcx(P), y: pcy(P), r: R, life: L, dm: 0, pierce: 0, col: o.col || '#fde68a', glow: o.glow || o.col || '#fde68a', glowR: R * 1.15, glowA: .32, tiles: false });
    p.acc = 0; p.ph = 0;
    p.onUpdate = (q, dt) => {
      q.x = pcx(G.P); q.y = pcy(G.P); q.ph += dt * 2.4; q.acc += dt;
      if (q.acc >= .4) {
        q.acc = 0;
        for (const e of enemiesNear(q.x, q.y, R)) hitEnemy(e, { src: 'area', id: q.id + ':' + Math.floor(G.t / .4), imm: .4, dmg: dmgOf(inst, dm || .3), kb: 0, noKb: true, sword: inst.sw, status: o.status, elem: o.elem, fs: .2, critChance: 0 });
      }
      if (Math.random() < dt * 10) { const a = rnd(TAU); addPart({ x: q.x + Math.cos(a) * R * .9, y: q.y + Math.sin(a) * R * .6, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, life: .6, size: 2, col: o.col2 || '#fff7c2', glow: true }); }
    };
    sfx('portal', .7); ringFx(pcx(P), pcy(P), R, o.col2 || '#fff', .6, 4);
  } }),

  // pulso gravitacional no ponto do golpe
  gravity: (r, pull, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const x = inst.tip.x, y = inst.tip.y, R = r || 130;
    ringFx(x, y, R, o.col || '#c084fc', .5, 4);
    for (const e of enemiesNear(x, y, R)) {
      if (!e.boss) { const dx = x - ecx(e), dy = y - ecy(e), d = Math.hypot(dx, dy) || 1; e.vx += dx / d * (pull || 420); e.vy += dy / d * (pull || 420) * .7; e.kbT = Math.max(e.kbT || 0, .22); }
      hitEnemy(e, { src: 'area', id: 'gr' + inst.id, dmg: dmgOf(inst, dm || .45), kb: 0, noKb: true, sword: inst.sw, fs: .3, critChance: 0, status: o.status, elem: o.elem });
    }
    sfx('portal', .7);
  } }),

  // escudo ao golpear
  shield: (hp, dur, max) => {
    let cd = 0;
    return {
      onSwing(P) { if (cd > G.t) return; cd = G.t + .35; const s = P.buffs.shield; addBuff('shield', dur || 3.5, { hp: Math.min(max || hp * 3, (s ? s.hp : 0) + hp) }); },
    };
  },

  // salto: teleporta na direção da mira e corta o caminho
  warp: (dist, dm, o) => ({ onSwing(P, inst) {
    o = o || {}; if (inst.ghost || inst.sub) return;
    const d = dist || 42, a = inst.aim, steps = 14;
    let x0 = pcx(P), y0 = pcy(P), x = x0, y = y0;
    for (let i = 1; i <= steps; i++) {
      const nx = x0 + Math.cos(a) * d * i / steps, ny = y0 + Math.sin(a) * d * i / steps;
      if (overlapSolid(nx - P.w / 2, ny - P.h / 2, P.w, P.h)) break;
      x = nx; y = ny;
    }
    const moved = Math.hypot(x - x0, y - y0); if (moved < 6) return;
    burst(x0, y0, 10, { col: [o.col || '#a5f3fc', '#fff'], spd: 120, glow: true, life: .4 });
    P.x = x - P.w / 2; P.y = y - P.h / 2; P.vy = Math.min(P.vy, 0);
    burst(x, y, 12, { col: [o.col || '#a5f3fc', '#fff'], spd: 130, glow: true, life: .4 });
    const inst2 = fx2fake({ inst, sw: inst.sw, dmgMult: inst.dmgMult, id: inst.id + 900 });
    for (const e of enemiesNear((x0 + x) / 2, (y0 + y) / 2, moved / 2 + 22)) hitEnemy(e, { src: 'area', id: 'wp' + inst.id, dmg: dmgOf(inst2, dm || .8), kb: 3, sword: inst.sw, fs: .3, noKb: false, critChance: 0, dir: { x: Math.cos(a), y: Math.sin(a) } });
    sfx('portal', .6);
  } }),

  // prismas: o projétil se divide ao acertar
  split: (n, dm, o) => ({ onProjHit(P, p, e, res) {
    o = o || {}; const a0 = Math.atan2(p.vy, p.vx);
    for (let i = 0; i < n; i++) spawnProj({ kind: 'linear', shape: o.shape || 'shard', x: p.x, y: p.y, vx: Math.cos(a0 + (i - (n - 1) / 2) * .5) * (o.speed || 540), vy: Math.sin(a0 + (i - (n - 1) / 2) * .5) * (o.speed || 540), dmg: Math.max(1, p.dmg * (dm || .45)), kb: 1, sword: p.sword, r: 6, life: o.life || .5, col: o.col || p.col, col2: o.col2 || '#ffffff', glow: o.col || p.col, glowR: 24, trail: o.col || p.col, pierce: 1, tiles: false, fs: .3, elem: o.elem });
    sfx('magic', .4);
  } }),

  // almas: cada abate solta espíritos perseguidores
  souls: (n, dm, o) => ({ onKill(P, e, h) {
    o = o || {}; const inst = h.inst || fx2fake({ sw: h.sword || sword(P) });
    for (let i = 0; i < n; i++) homingBlade(P, inst, ecx(e), ecy(e), -PI / 2 + (i - (n - 1) / 2) * .55, { dm: dm || .5, speed: o.speed || 420, shape: o.shape || 'orb', r: o.r || 7, col: o.col || '#c4b5fd', col2: o.col2 || '#ffffff', glow: o.glow || o.col || '#a78bfa', trail: o.col || '#c4b5fd', steer: o.steer || 6, pierce: 2 });
    burst(ecx(e), ecy(e), 10, { col: [o.col || '#c4b5fd', '#fff'], spd: 100, life: .5, glow: true, g: -70 }); sfx('magic', .6);
  } }),

  // execução: dano extra em alvos com pouca vida
  execute: (thr, mult, o) => ({ mod(P, e, h) {
    if (h.src === 'dot') return;
    const max = e.hpMax || e.maxHp || e.hp || 1;
    if (e.hp / max < (thr || .3)) {
      h.mult = (h.mult || 1) * (mult || 2);
      if (!e.execFx || G.t - e.execFx > .6) { e.execFx = G.t; ringFx(ecx(e), ecy(e), 26, (o && o.col) || '#f87171', .3, 2); addText(ecx(e), e.y - 18, 'EXECUÇÃO', (o && o.col) || '#f87171', 12, .7); }
    }
  } }),

  // nova sangrenta: cura por acerto e explode de tempos em tempos
  bloodNova: (heal, every, dm, o) => {
    let last = -9;
    return {
      onHit(P, e, h) {
        if (h.src !== 'melee') return;
        healPlayer(heal || 8, true);
        if (G.t - last < (every || 1.2)) return; last = G.t;
        explode(ecx(e), ecy(e), 74, dmgOf(h.inst, dm || .5), { sword: h.sword, col: (o && o.col) || '#dc2626', cols: ['#dc2626', '#f87171', '#450a0a'], kb: 2.4, noHooks: true });
      },
    };
  },

  // convergência: cargas no golpe que descarregam num golpe ampliado
  converge: (n, dm, o) => {
    let c = 0, last = -9;
    return {
      onHit(P, e, h) {
        if (h.src !== 'melee') return;
        c = Math.min(n || 5, c + 1); last = G.t;
        if (c < (n || 5)) return;
        c = 0;
        explode(ecx(e), ecy(e), (o && o.r) || 96, dmgOf(h.inst, dm || 1.4), { sword: h.sword, col: (o && o.col) || '#fde68a', cols: ['#fff7c2', '#fde68a', '#f59e0b'], kb: 5, noHooks: true });
        flash((o && o.col) || '#fde68a', .3, .3); sfx('thunder', .8);
        addText(pcx(P), P.y - 20, (o && o.label) || 'CONVERGÊNCIA', (o && o.col) || '#fde68a', 15, 1);
      },
      tick() { if (G.t - last > 3.2) c = 0; },
    };
  },

  // ciclo elemental: alterna o efeito a cada acerto
  cycle: (list, dur) => {
    let i = 0;
    return {
      onHit(P, e, h) {
        if (h.src !== 'melee') return;
        const k = list[i++ % list.length];
        applyStatus(e, k[0], dur || 3, k[1] || {});
        burst(ecx(e), ecy(e), 8, { col: [k[2] || '#fff', '#fff'], spd: 90, glow: true, life: .4 });
      },
    };
  },

  // fenda: zona estática que fere e retém
  rift: (r, life, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const t = inst.tip, R = r || 62, L = life || 2.4;
    const p = mkProj(P, inst, { kind: 'custom', shape: 'blackhole', noHit: true, x: t.x, y: t.y, r: R * .5, life: L, dm: 0, pierce: 0, col: o.col || '#c084fc', glow: o.glow || o.col || '#a855f7', glowR: R * 1.6, glowA: .55, tiles: false, spin: 3, grow: true, light: o.light });
    p.acc = 0;
    p.onUpdate = (q, dt) => {
      q.acc += dt; q.r = R * .5;
      for (const e of enemiesNear(q.x, q.y, R)) { if (!e.boss) { const dx = q.x - ecx(e), dy = q.y - ecy(e), d = Math.hypot(dx, dy) || 1; e.vx += dx / d * 160 * dt; e.vy += dy / d * 120 * dt; } }
      if (q.acc >= .35) { q.acc = 0; for (const e of enemiesNear(q.x, q.y, R)) hitEnemy(e, { src: 'area', id: q.id + ':' + Math.floor(G.t / .35), imm: .35, dmg: dmgOf(inst, dm || .35), kb: 0, noKb: true, sword: inst.sw, status: o.status, elem: o.elem, fs: .25, critChance: 0 }); }
    };
    sfx('portal', .7);
  } }),

  // espelho: um segundo arco invertido acompanha o golpe
  mirror: (dm, o) => ({ onApex(P, inst) {
    if (inst.ghost || inst.sub) return;   // o arco espelhado não se espelha de novo
    o = o || {};
    startSwing(P, inst.sw, { ghost: true, aim: PI - inst.aim, side: -(inst.side || 1), dmgMult: dm || .7, delay: .06, dur: .22, alpha: .75 });
    ringFx(inst.tip.x, inst.tip.y, 26, o.col || '#ffffff', .3, 2); sfx('magic', .4);
  } }),

  // tempestade: lanças caem no cursor
  storm: (n, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const m = G.mouse;
    const cx = clamp(m.wx, pcx(P) - 380, pcx(P) + 380), cy2 = clamp(m.wy, pcy(P) - 240, pcy(P) + 220);
    for (let i = 0; i < n; i++) {
      const x = cx + rnd(-64, 64), y = cy2 + rnd(-46, 46);
      meteorFall(P, inst, x, y, { r: o.r || 11, dm: dm || .55, boomR: o.boomR || 46, col: o.col || '#fde047', col2: o.col2 || '#ffffff', height: 440 + rnd(0, 80), speed: 900, ang: PI / 2 + rnd(-.08, .08), delay: i * (o.gap || .07), tiles: 0, status: o.status });
      if (o.bolt !== false) fx2bolt(x, y - 210, x, y - 20, o.col2 || '#fff7c2', 5);
    }
    sfx('thunder'); shake(4);
  } }),

  // lapso: inimigos ao redor ficam lentos e o jogador ganha ímpeto
  timeSlip: (dur, amt, buff) => ({ onHit(P, e, h) {
    if (h.src !== 'melee') return;
    for (const t of enemiesNear(ecx(e), ecy(e), 84)) applyStatus(t, 'slow', dur || 1.6, { amt: amt || .72 });
    addBuff('haste', 2.2, { amt: buff || .35 });
    ringFx(pcx(P), pcy(P), 64, '#a5f3fc', .35, 3); sfx('magic', .5);
  } }),

  // linha perfurante instantânea (atravessa tudo)
  line: (dm, o) => ({ onApex(P, inst) {
    o = o || {}; const s = instOrigin(P, inst);
    const p = fireBeam({ x: s.x + Math.cos(inst.aim) * ARM, y: s.y + Math.sin(inst.aim) * ARM, ang: inst.aim, len: o.len || 1600, width: o.w || 14, hitW: (o.w || 14) + 2, life: o.life || .45, pierceTiles: true, col: o.col, col2: o.col2 || '#ffffff', glow: o.glow || o.col, dmg: dmgOf(inst, dm || .7), kb: o.kb === undefined ? 1.2 : o.kb, sword: inst.sw, status: o.status, elem: o.elem });
    p.light = o.light || [1, 1, 1]; sfx('laser', .7); shake(2);
  } }),

  // orbes que orbitam e golpeiam
  orbs: (n, dm, o) => ({ onApex(P, inst) {
    o = o || {}; const N = n || 3;
    for (let i = 0; i < N; i++) {
      const p = mkProj(P, inst, { kind: 'custom', shape: o.shape || 'sword', x: pcx(P), y: pcy(P), r: o.r || 11, life: o.life || 5, dm: dm || .4, kb: 1, pierce: 0, hitCd: .3, col: o.col || '#fcd34d', col2: o.col2 || '#ffffff', glow: o.glow || o.col || '#fbbf24', glowR: 30, light: o.light, tiles: false, trail: o.col || '#fde68a', fs: .3 });
      p.ph = i / N * TAU; p.rad = o.rad || 46;
      p.onUpdate = (q, dt) => {
        q.ph += (o.spin || 4.4) * dt;
        const tg = nearestEnemy(pcx(P), pcy(P), o.seek || 190);
        let tx = pcx(P) + Math.cos(q.ph) * q.rad, ty = pcy(P) + Math.sin(q.ph) * q.rad * .8;
        if (tg) { const k = .55 + .15 * Math.sin(q.age * 9 + i * 2); tx = lerp(tx, ecx(tg) + Math.cos(q.ph * 2) * 14, k); ty = lerp(ty, ecy(tg) + Math.sin(q.ph * 2) * 14, k); }
        q.angle = Math.atan2(ty - q.y, tx - q.x); q.x = lerp(q.x, tx, Math.min(1, 14 * dt)); q.y = lerp(q.y, ty, Math.min(1, 14 * dt));
      };
    }
    sfx('magic');
  } }),

  // singularidade: buraco negro perseguidor
  singularity: (dm, o) => ({ onApex(P, inst) {
    o = o || {};
    const p = shoot(P, inst, { kind: 'homing', shape: 'blackhole', r: o.r || 26, speed: o.speed || 120, steer: 1.8, dm: 0, noHit: true, life: o.life || 5.5, range: 700, col: o.col || '#c4b5fd', glow: o.glow || '#4c1d95', glowR: 90, glowA: .6, tiles: false, spin: 7, grow: true, light: [.4, .2, .7] });
    sfx('portal');
    p.onUpdate = (q, dt) => {
      for (const t of enemiesNear(q.x, q.y, o.pullR || 116)) {
        const dx = q.x - ecx(t), dy = q.y - ecy(t), d = Math.hypot(dx, dy) || 1;
        if (!t.boss) { t.vx += dx / d * (o.pull || 520) * dt; t.vy += dy / d * (o.pull || 520) * .8 * dt; t.vx *= .97; t.kbT = Math.max(t.kbT || 0, .06); }
        hitEnemy(t, { src: 'area', id: q.id + ':' + Math.floor(G.t / .3), imm: .3, dmg: dmgOf(inst, dm || .34), kb: 0, noKb: true, sword: inst.sw, fs: .2, critChance: 0 });
      }
    };
    p.onDie = q => explode(q.x, q.y, o.boomR || 86, dmgOf(inst, (o.boomDm || 1.1)), { sword: inst.sw, col: o.col || '#a78bfa', noHooks: true });
  } }),

  // big bang: dano em tela cheia + colapso no cursor
  bigBang: (dm, o) => ({ onApex(P, inst) {
    o = o || {}; const m = G.mouse;
    const tx = clamp(m.wx, pcx(P) - 500, pcx(P) + 500), ty = clamp(m.wy, pcy(P) - 320, pcy(P) + 300);
    screenDamage(P, inst, dm || .5, { col: o.col || '#ffffff', elem: o.elem });
    const p = mkProj(P, inst, { kind: 'custom', shape: 'star', noHit: true, x: tx, y: ty, r: 10, life: .5, dm: 0, pierce: 0, col: o.col2 || '#fff7c2', col2: '#ffffff', glow: o.glow || '#fbbf24', glowR: 60, tiles: false, spin: 12, light: [1, .95, .7] });
    p.onUpdate = q => { q.r = 10 + q.age * 64; q.glowR = 60 + q.age * 240; };
    p.onDie = q => { explode(tx, ty, o.r || 210, dmgOf(inst, o.boomDm || 2.2), { sword: inst.sw, col: o.col || '#fde68a', cols: ['#fff7c2', '#fde68a', '#f59e0b'], kb: 7, falloff: true, noHooks: true, tiles: 0 }); ringFx(tx, ty, (o.r || 210) * 1.2, '#ffffff', .6, 5); };
    flash(o.flash || '#ffffff', .6, .45); shake(12); sfx('thunder');
    addText(pcx(P), P.y - 22, o.label || 'BIG BANG', o.col2 || '#fff7c2', 17, 1.2);
  } }),
};

// ---------- atalho para descrever a arte das espadas novas ----------
// A2(família, opções) -> look: { sh, col, len, glow, gem, arc, art2 }
const A2 = (fam, o) => {
  o = o || {};
  const art = Object.assign({ fam }, o);
  return { sh: fam, col: o.col, len: o.len || 46, glow: o.glow || o.hot || o.col, gem: o.gem || null, arc: o.arc, art2: art };
};
// registra uma espada nova (num 121..200) e corrige o que o catálogo base calcula pelos 6 tiers originais
const TIER7_ST = { 7: 'advanvil', 8: 'advanvil', 9: 'forge', 10: 'forge' };
function S2(num, name, d, v, k, look, fx, txt, rec, o) {
  o = Object.assign({}, o || {}); o.st = o.st || TIER7_ST[Math.ceil(num / 20)];
  const sw = S(num, name, d, v, k, look, fx, txt, rec, o);
  sw.src = 'novo'; sw.kind = 'ext'; sw.station = o.st;
  const r = RECIPES[RECIPES.length - 1]; r.st = o.st;
  return sw;
}

// ================================================================
// TIER 7 — FORJA ESTELAR · LENDÁRIO (121–140)  [criadas]
// ================================================================
S2(121, 'Aurora Boreal', 300, 1.35, 4, A2('leaf', { col: '#bff0ff', hot: '#5eead4', glow: '#5eead4', w: 2.5, len: 46, guard: 'swept', guardCol: '#cdeffd', grip: 'crystal', pommel: 'gem', back: ['rings'], extras: ['ice', 'motes'], padR: 6 }), [FX2.echo(2, .42, { col: '#a5f3fc' }), FX.frostNova(74, .55)], 'Cada golpe projeta dois ecos de gelo atrasados que congelam quem estiver na frente.', 'celestial_bar:6,e_ice:10,frost_shard:14');
S2(122, 'Tempestade de Aço', 312, 1.4, 4, A2('serrated', { col: '#c3ccda', hot: '#e2e8f0', glow: '#94a3b8', w: 2.7, len: 44, guard: 'cross', guardCol: '#9aa4b4', grip: 'leather', gripCol: '#3a2b1e', pommel: 'spike', extras: ['sparks', 'runes'], padR: 5 }), [FX2.fan(5, .19, .3, { col: '#cbd5e1', glow: '#94a3b8' }), FX2.echo(1, .28)], 'Abre um leque de cinco lâminas de aço e repete o arco uma vez.', 'celestial_bar:6,e_lightning:6,silver_bar:12');
S2(123, 'Coração da Forja', 328, 1.1, 6, A2('leaf', { col: '#f0a15a', hot: '#ffd166', glow: '#fb923c', w: 3.6, len: 44, guard: 'gem', guardCol: '#8a4a1e', gem: '#ff7a1a', grip: 'leather', gripCol: '#4a2a16', back: ['aura'], extras: ['cracks', 'flames'], padR: 6 }), [FX2.nova(108, .8, { col: '#fb923c', status: [['burn', 4, { dps: 30 }]], elem: 'fire', kb: 6 }), FX.embers()], 'Ao golpear, libera uma onda de calor que incendeia todos os inimigos ao redor.', 'celestial_bar:6,e_fire:12,hell_bar:8');
S2(124, 'Lâmina do Cometa', 336, 1.25, 5, A2('katana', { col: '#8fe9ff', hot: '#67e8f9', glow: '#22d3ee', w: 2.1, len: 48, bend: 2.6, guard: 'ring', guardCol: '#c8f2ff', grip: 'crystal', pommel: 'orb', extras: ['motes', 'stars'], padR: 8 }), [FX2.comet(.85, { col: '#67e8f9', col2: '#ffffff' }), FX2.line(.28, { col: '#a5f3fc', w: 12 })], 'Puxa um cometa de gelo sobre o cursor e corta a linha do impacto com um feixe.', 'celestial_bar:7,e_ice:8,e_light:6');
S2(125, 'Cristal do Amanhecer', 320, 1.15, 5, A2('crystal', { col: '#fff4cf', hot: '#ffe066', glow: '#fde68a', w: 3.1, len: 45, guard: 'gem', guardCol: '#e8d8a8', gem: '#fff7c2', grip: 'metal', back: ['glyphs'], extras: ['shards', 'runes'], padR: 6 }), [FX.crystalLine(6)], 'Estalagmites de cristal irrompem do solo em cascata na direção do alvo.', 'celestial_bar:6,e_light:10,quartz:20');
S2(126, 'Vingança Prateada', 305, 1.55, 3, A2('rapier', { col: '#eef3fa', hot: '#ffffff', glow: '#dbeafe', w: 1.9, len: 50, guard: 'swept', guardCol: '#b8c4d6', grip: 'leather', gripCol: '#2f3b4d', pommel: 'gem', extras: ['sparks'], padR: 4 }), [FX2.shield(55, 4, 190), FX.armorPassive(9)], 'Acertos acumulam um escudo de 55 pontos e concedem +9 de armadura enquanto empunhada.', 'celestial_bar:6,e_light:6,silver_bar:16');
S2(127, 'Corrente Celeste', 315, 1.3, 5, A2('flamberge', { col: '#ffe08a', hot: '#fde047', glow: '#facc15', w: 2.5, len: 46, wave: 1.2, freq: 6, guard: 'chains', guardCol: '#e8c46a', grip: 'chainwrap', extras: ['lightning', 'runes'], padR: 6 }), [FX2.chain(3, 170, .34, { col: '#fde047' })], 'O impacto salta como corrente elétrica entre até três inimigos próximos.', 'celestial_bar:6,e_lightning:10,gold_bar:12');
S2(128, 'Gume do Horizonte', 340, 1.0, 7, A2('shotel', { col: '#9ff5e2', hot: '#5eead4', glow: '#2dd4bf', w: 3.0, len: 50, guard: 'none', grip: 'leather', gripCol: '#274a44', pommel: 'none', extras: ['motes', 'runes'], padR: 6 }), [FX2.sweep(.32, { col: '#5eead4', col2: '#ffffff', arc: .92, w: 22, life: .8, flash: '#5eead4' })], 'Desenha um arco de energia que varre toda a frente do jogador.', 'celestial_bar:7,e_water:10,e_light:6');
S2(129, 'Sentinela de Marfim', 318, 1.1, 6, A2('dao', { col: '#f6efdb', hot: '#ffe9a8', glow: '#fde68a', w: 3.2, len: 44, guard: 'skull', guardCol: '#e6dcbf', grip: 'bone', pommel: 'ring', extras: ['runes', 'motes'], padR: 6 }), [FX2.orbs(3, .32, { col: '#fef3c7', glow: '#fbbf24', life: 4.8, rad: 44 })], 'Invoca três sentinelas de marfim que orbitam e golpeiam quem se aproximar.', 'celestial_bar:7,e_light:8,bone:30');
S2(130, 'Eco do Trovão', 330, 1.2, 5, A2('mech', { col: '#8b9bb4', hot: '#fde047', glow: '#facc15', w: 3.0, len: 46, guard: 'cog', guardCol: '#7d8798', grip: 'metal', extras: ['lightning', 'sparks'], padR: 6 }), [FX2.echo(3, .36, { gap: .075, col: '#fde047' }), FX.sparks()], 'Cada golpe troveja três ecos elétricos em sequência.', 'celestial_bar:6,e_lightning:12,palladium_bar:10');
S2(131, 'Rosa dos Ventos', 322, 1.3, 4, A2('saber', { col: '#ffc2cf', hot: '#ff8fa8', glow: '#fb7185', w: 2.6, len: 46, bend: 3.6, guard: 'feather', guardCol: '#f6c9d4', grip: 'leather', gripCol: '#5a2a38', pommel: 'gem', extras: ['petals', 'motes'], padR: 6 }), [FX2.fan(8, .36, .22, { col: '#fda4af', glow: '#fb7185', shape: 'petal' })], 'Abre um leque circular de oito pétalas cortantes em todas as direções frontais.', 'celestial_bar:6,e_blood:8,e_light:4,feather:20');
S2(132, 'Fúria do Titã', 360, .85, 9, A2('zweihander', { col: '#b07a44', hot: '#ffd166', glow: '#f59e0b', w: 4.4, len: 46, guard: 'seal', guardCol: '#8a6a44', grip: 'leather', gripCol: '#3a2717', extras: ['cracks'], padR: 6 }), [FX.groundWaveApex({ both: true, hw: 13, hh: 16, speed: 300, life: .62, col: '#b4783a', col2: '#fde68a' }), FX2.gravity(110, 260, .35, { col: '#fbbf24' })], 'O impacto corre pelo relevo nos dois sentidos e puxa os inimigos para o chão.', 'celestial_bar:7,e_earth:12,e_fire:6');
S2(133, 'Selo do Inverno', 326, 1.2, 5, A2('crystal', { col: '#c7ecff', hot: '#8bd3ff', glow: '#7dd3fc', w: 3.0, len: 45, guard: 'seal', guardCol: '#9fc6dd', grip: 'crystal', back: ['rings'], extras: ['ice'], padR: 6 }), [FX2.mark(1.5, .95, { col: '#7dd3fc', r: 66 }), FX.statusHit('freeze', 2, { amt: .6 }, 'melee')], 'Marca o inimigo com gelo: um instante depois o selo estoura e congela a área.', 'celestial_bar:6,e_ice:12,frost_shard:20');
S2(134, 'Prelúdio das Chamas', 334, 1.15, 5, A2('fang', { col: '#ff9a5a', hot: '#ffd166', glow: '#fb923c', w: 3.0, len: 45, bend: 5, guard: 'dragon', guardCol: '#a2532a', grip: 'bone', extras: ['flames', 'cracks'], padR: 6 }), [FX2.comet(.8, { col: '#ff7a1a', col2: '#ffe08a', status: [['burn', 4, { dps: 26 }]] }), FX.burnHit(18, 4)], 'Invoca uma chuva de brasas no cursor e queima tudo o que tocar.', 'celestial_bar:6,e_fire:14,meteor_bar:10');
S2(135, 'Lâmina do Eclipse', 344, 1.3, 4, A2('katana', { col: '#4b4468', hot: '#c4b5fd', glow: '#a78bfa', w: 2.2, len: 48, bend: 2.2, guard: 'ring', guardCol: '#6d5f96', grip: 'void', extras: ['motes', 'eyes'], back: ['aura'], padR: 6 }), [FX.flashBlind(2.2), FX2.echo(1, .5, { col: '#c4b5fd' })], 'Cega os inimigos próximos e projeta um eco sombrio do golpe.', 'celestial_bar:6,e_shadow:10,e_time:6');
S2(136, 'Bênção do Oásis', 300, 1.25, 4, A2('glaive', { col: '#a8e6a0', hot: '#86efac', glow: '#4ade80', w: 2.9, len: 48, guard: 'thorn', guardCol: '#6aa86a', grip: 'leather', gripCol: '#2c4a2c', extras: ['petals', 'motes'], padR: 6 }), [FX2.domain(96, 4.2, .24, { col: '#86efac', col2: '#bbf7d0' }), FX.lifesteal(.03)], 'Cria um oásis que fere lentamente os inimigos e cura 3% do dano causado.', 'celestial_bar:6,e_water:10,spore:25');
S2(137, 'Fio da Balança', 315, 1.2, 5, A2('double', { col: '#dbe3ee', hot: '#fde68a', glow: '#e2e8f0', w: 2.4, len: 44, guard: 'cross', guardCol: '#b9c2d0', grip: 'metal', pommel: 'ring', extras: ['runes'], padR: 6 }), [FX2.execute(.35, 2.2, { col: '#e2e8f0' }), FX2.converge(4, .9, { col: '#fde68a', label: 'EQUILÍBRIO' })], 'Executa alvos com pouca vida e descarrega uma carga extra a cada quatro acertos.', 'celestial_bar:6,e_light:8,e_time:4,quartz:25');
S2(138, 'Relâmpago Engarrafado', 332, 1.25, 4, A2('mech', { col: '#cfd6e6', hot: '#fde047', glow: '#facc15', w: 2.8, len: 46, guard: 'cog', guardCol: '#8f9ab0', grip: 'chainwrap', extras: ['lightning', 'stars'], padR: 6 }), [FX2.storm(4, .5, { col: '#fde047', col2: '#fff7c2' }), FX2.chain(2, 150, .3)], 'Tempestade de raios cai no cursor e salta entre os inimigos atingidos.', 'celestial_bar:6,e_lightning:12,cobalt_bar:12');
S2(139, 'Muralha de Aço', 350, .95, 8, A2('slab', { col: '#aeb9c9', hot: '#bfe3ff', glow: '#93c5fd', w: 5.0, len: 43, guard: 'wing', guardCol: '#8d99ab', grip: 'metal', pommel: 'spike', extras: ['sparks'], padR: 6 }), [FX2.shield(95, 4.5, 320), FX2.nova(84, .5, { col: '#93c5fd', kb: 6 })], 'Cria uma muralha de aço: escudo de 95 pontos e uma onda que empurra quem encosta.', 'celestial_bar:7,e_earth:8,titanium_bar:14');
S2(140, 'Coroa de Estrelas', 355, 1.05, 6, A2('scythe', { col: '#ffe08a', hot: '#fff7c2', glow: '#fbbf24', w: 3.2, len: 48, guard: 'halo', guardCol: '#e0c070', grip: 'bone', extras: ['stars', 'motes'], padR: 8 }), [FX.homingVolley(4, { col: '#fde68a', glow: '#fbbf24' })], 'Dispara uma coroa de estrelas teleguiadas que perseguem os inimigos.', 'celestial_bar:8,e_light:10,e_time:4');

// ================================================================
// TIER 8 — RELICÁRIO DO VAZIO · ANCESTRAL (141–160)  [criadas]
// ================================================================
S2(141, 'Sussurro do Abismo', 470, 1.35, 4, A2('rapier', { col: '#6f5a8f', hot: '#c084fc', glow: '#a855f7', w: 1.8, len: 50, guard: 'ring', guardCol: '#7a5f9e', grip: 'void', extras: ['glyphs'], back: ['aura'], padR: 6 }), [FX2.mark(1.4, 1.15, { col: '#a855f7', r: 72 }), FX2.shield(60, 3.5, 200)], 'Cada acerto sussurra uma marca que detona em área logo depois.', 'mythic_core:1,celestial_bar:8,e_shadow:12');
S2(142, 'Âncora do Vazio', 560, .9, 9, A2('slab', { col: '#3f3a5e', hot: '#818cf8', glow: '#6366f1', w: 4.8, len: 45, guard: 'seal', guardCol: '#5a5480', grip: 'chainwrap', extras: ['shards', 'glyphs'], back: ['rings'], padR: 6 }), [FX2.gravity(155, 560, .6, { col: '#818cf8' }), FX2.rift(58, 2, .3, { col: '#6366f1' })], 'Ancora os inimigos no lugar, abre uma fenda e os puxa para dentro.', 'mythic_core:1,celestial_bar:9,e_time:10');
S2(143, 'Espelho Partido', 500, 1.25, 5, A2('crystal', { col: '#dfe7f5', hot: '#c4b5fd', glow: '#a5b4fc', w: 3.2, len: 46, guard: 'gem', guardCol: '#cfd6e6', gem: '#a5b4fc', grip: 'crystal', back: ['glyphs'], extras: ['shards'], padR: 7 }), [FX2.mirror(.75, { col: '#e2e8f0' }), FX2.split(3, .4, { col: '#c4b5fd' })], 'Um espelho do golpe corta o outro lado e os projéteis se partem em três.', 'mythic_core:1,celestial_bar:8,e_light:10');
S2(144, 'Corrente de Almas', 520, 1.2, 5, A2('chain', { col: '#b9a6d6', hot: '#c4b5fd', glow: '#8b5cf6', w: 2.8, len: 46, seg: 5, guard: 'chains', guardCol: '#9d8cba', grip: 'bone', pommel: 'ring', extras: ['motes', 'chains'], padR: 6 }), [FX2.souls(2, .5, { col: '#c4b5fd' }), FX2.chain(3, 160, .3)], 'Cada abate solta duas almas perseguidoras que saltam entre inimigos.', 'mythic_core:1,celestial_bar:8,e_blood:8,e_shadow:6');
S2(145, 'Relicário de Osso', 540, 1.05, 7, A2('bone', { col: '#efe6cf', hot: '#ffe9a8', glow: '#fde68a', w: 3.4, len: 45, guard: 'skull', guardCol: '#d9cdb0', grip: 'bone', pommel: 'ring', extras: ['runes'], padR: 6 }), [FX2.souls(3, .42, { col: '#f5f0dc' }), FX2.shield(75, 4, 240)], 'Os ossos dos caídos viram três espíritos e um escudo vivo.', 'mythic_core:1,celestial_bar:8,e_light:6,bone:40');
S2(146, 'Coro dos Ancestrais', 510, 1.3, 4, A2('split', { col: '#9d7bd6', hot: '#d8b4fe', glow: '#a855f7', w: 3.0, len: 46, guard: 'halo', guardCol: '#8e6fc4', grip: 'leather', gripCol: '#3b2552', extras: ['glyphs', 'petals'], padR: 6 }), [FX2.echo(2, .5, { col: '#d8b4fe' }), FX2.orbs(2, .3, { col: '#d8b4fe', glow: '#a855f7' })], 'Dois ecos do golpe e dois orbes ancestrais lutam ao seu lado.', 'mythic_core:1,celestial_bar:8,e_shadow:8,e_blood:4');
S2(147, 'Marca do Silêncio', 530, 1.4, 4, A2('katana', { col: '#2f2b40', hot: '#e879f9', glow: '#d946ef', w: 2.2, len: 49, bend: 2.4, guard: 'seal', guardCol: '#4a4160', grip: 'void', extras: ['eyes', 'motes'], padR: 6 }), [FX2.mark(1.2, 1.35, { col: '#e879f9', r: 82 }), FX2.timeSlip(1.8, .8, .3)], 'Silencia o inimigo: ele fica lento, marcado e detona um instante depois.', 'mythic_core:1,celestial_bar:8,e_shadow:10,e_time:6');
S2(148, 'Devorador de Luz', 545, 1.15, 5, A2('fang', { col: '#38304f', hot: '#a78bfa', glow: '#7c3aed', w: 3.2, len: 46, bend: 5.5, guard: 'dragon', guardCol: '#544a78', grip: 'void', back: ['aura'], extras: ['shards'], padR: 6 }), [FX2.singularity(.36, { col: '#c4b5fd', pull: 420 }), FX.darkMatter()], 'Abre um buraco negro que devora luz, puxa inimigos e explode ao fechar.', 'mythic_core:1,celestial_bar:9,e_shadow:12,e_time:4');
S2(149, 'Raiz do Mundo', 525, 1.1, 6, A2('thorn', { col: '#6fae5a', hot: '#a3e635', glow: '#65a30d', w: 3.0, len: 46, guard: 'thorn', guardCol: '#4f7a42', grip: 'bone', extras: ['petals'], padR: 6 }), [FX.vinesBelow(), FX2.domain(92, 4, .26, { col: '#4ade80', status: [['poison', 3, { dps: 16 }]], elem: 'poison' })], 'Raízes venenosas brotam do solo e um domínio verde envenena quem fica perto.', 'mythic_core:1,celestial_bar:8,e_poison:10,e_earth:6');
S2(150, 'Portal Móvel', 480, 1.35, 4, A2('orb', { col: '#b6a4f0', hot: '#c084fc', glow: '#8b5cf6', w: 2.6, len: 46, guard: 'orb', guardCol: '#8f7ac4', grip: 'crystal', back: ['rings', 'glyphs'], extras: ['motes'], padR: 8 }), [FX.portalBlades(), FX2.fan(3, .42, .32, { col: '#c084fc', shape: 'blade' })], 'Dois portais se abrem e cospem lâminas enquanto o jogador avança.', 'mythic_core:1,celestial_bar:8,e_shadow:8,e_light:4');
S2(151, 'Máscara do Vazio', 555, 1.0, 6, A2('mech', { col: '#6b6383', hot: '#a78bfa', glow: '#8b5cf6', w: 3.2, len: 46, guard: 'skull', guardCol: '#6f6788', grip: 'metal', extras: ['eyes', 'glyphs'], padR: 6 }), [FX2.mirror(.8, { col: '#a78bfa' }), FX2.shield(80, 4, 250)], 'A máscara reflete metade de cada golpe e devolve escudo ao jogador.', 'mythic_core:1,celestial_bar:9,e_shadow:10,e_light:4');
S2(152, 'Selo de Sangue', 600, .95, 8, A2('machete', { col: '#a8323a', hot: '#fb7185', glow: '#dc2626', w: 4.2, len: 44, guard: 'seal', guardCol: '#7d2a30', grip: 'leather', gripCol: '#3a1418', pommel: 'spike', extras: ['cracks'], padR: 6 }), [FX2.bloodNova(10, 1, 1.2, { col: '#dc2626' }), FX2.execute(.4, 2.4, { col: '#f87171' })], 'Cada acerto se alimenta de sangue — cura o jogador e explode em vermelho.', 'mythic_core:1,celestial_bar:9,e_blood:14');
S2(153, 'Manto de Névoa', 490, 1.3, 4, A2('shotel', { col: '#b8aecb', hot: '#ddd6fe', glow: '#a78bfa', w: 2.6, len: 47, bend: 3.4, guard: 'claw', guardCol: '#8d84a4', grip: 'leather', gripCol: '#3f3550', extras: ['motes'], back: ['aura'], padR: 6 }), [FX2.domain(102, 4.5, .2, { col: '#c4b5fd', col2: '#ede9fe' }), FX2.echo(1, .4, { col: '#c4b5fd' })], 'A névoa que segue o jogador corrói a vida dos inimigos em silêncio.', 'mythic_core:1,celestial_bar:8,e_shadow:8,e_water:6');
S2(154, 'Cálice de Estrelas', 515, 1.2, 5, A2('crystal', { col: '#ffe6a3', hot: '#fde68a', glow: '#fbbf24', w: 3.0, len: 46, guard: 'gem', guardCol: '#d9c07a', gem: '#fff7c2', grip: 'metal', back: ['rings'], extras: ['stars'], padR: 7 }), [FX2.storm(4, .6, { col: '#fde68a', col2: '#fff7c2' }), FX2.orbs(2, .3, { col: '#fde68a', shape: 'star' })], 'Derrama estrelas do céu e dois sóis orbitam o jogador.', 'mythic_core:1,celestial_bar:9,e_light:12');
S2(155, 'Fenda de Prata', 535, 1.25, 5, A2('straight', { col: '#e8eef8', hot: '#c7d2fe', glow: '#93c5fd', w: 2.3, len: 48, guard: 'cross', guardCol: '#aeb9cc', grip: 'metal', extras: ['shards', 'sparks'], padR: 6 }), [FX2.line(.8, { col: '#e2e8f0', col2: '#ffffff', w: 16 }), FX2.split(2, .35, { col: '#cbd5e1' })], 'Abre uma fenda prateada instantânea que parte os projéteis em dois.', 'mythic_core:1,celestial_bar:8,e_light:8,platinum_bar:12');
S2(156, 'Lamento Fúnebre', 565, 1.05, 6, A2('scythe', { col: '#7b86b8', hot: '#a5b4fc', glow: '#6366f1', w: 3.4, len: 50, guard: 'halo', guardCol: '#6b7495', grip: 'bone', extras: ['motes', 'eyes'], back: ['aura'], padR: 8 }), [FX.soulScythes(2), FX2.mark(1.5, .9, { col: '#a5b4fc' })], 'Cada abate libera foices espectrais e marca quem estiver por perto.', 'mythic_core:1,celestial_bar:9,e_blood:10,e_shadow:8');
S2(157, 'Grilhões Etéreos', 505, 1.25, 5, A2('chain', { col: '#8e7bbf', hot: '#c084fc', glow: '#a855f7', w: 2.6, len: 46, seg: 4, guard: 'chains', guardCol: '#7a68a8', grip: 'chainwrap', extras: ['glyphs'], padR: 6 }), [FX2.gravity(122, 340, .4, { col: '#c084fc' }), FX2.chain(2, 180, .35, { col: '#c084fc' })], 'Grilhões puxam os inimigos e os acorrentam com raios entre eles.', 'mythic_core:1,celestial_bar:8,e_shadow:10,e_time:4');
S2(158, 'Véu da Meia-Noite', 520, 1.3, 4, A2('double', { col: '#3b3652', hot: '#e2e8f0', glow: '#a78bfa', w: 2.4, len: 45, guard: 'ring', guardCol: '#555070', grip: 'void', extras: ['motes', 'stars'], back: ['aura'], padR: 6 }), [FX.flashBlind(2.6), FX2.mirror(.7, { col: '#c4b5fd' })], 'Apaga a luz da tela, cega os inimigos e corta dos dois lados.', 'mythic_core:1,celestial_bar:8,e_shadow:12');
S2(159, 'Ressonância Púrpura', 548, 1.2, 5, A2('flamberge', { col: '#b58ae0', hot: '#e9d5ff', glow: '#a855f7', w: 2.8, len: 46, wave: 1.35, freq: 7, guard: 'gem', guardCol: '#8f6bb8', gem: '#e9d5ff', grip: 'crystal', back: ['glyphs'], extras: ['runes'], padR: 6 }), [FX2.converge(5, 1.6, { col: '#c084fc', label: 'RESSONÂNCIA' }), FX2.echo(1, .4, { col: '#e9d5ff' })], 'Acumula ressonância a cada golpe e libera tudo no quinto acerto.', 'mythic_core:1,celestial_bar:9,e_light:8,e_time:6');
S2(160, 'Coroa do Abismo', 620, 1.0, 7, A2('trident', { col: '#8b7ad6', hot: '#c4b5fd', glow: '#8b5cf6', w: 3.4, len: 50, guard: 'dragon', guardCol: '#6c5aa8', grip: 'bone', pommel: 'orb', extras: ['shards', 'glyphs'], back: ['rings', 'aura'], padR: 8 }), [FX2.rift(72, 2.6, .42, { col: '#a855f7' }), FX2.gravity(142, 440, .5, { col: '#c084fc' })], 'A coroa abre uma fenda devoradora e puxa tudo para o seu centro.', 'mythic_core:1,celestial_bar:10,e_shadow:12,e_time:8');

// ================================================================
// TIER 9 — ECO PRIMORDIAL · DIVINO (161–180)  [criadas]
// ================================================================
S2(161, 'Julgamento Seráfico', 700, 1.15, 6, A2('zweihander', { col: '#fff2cf', hot: '#fff7c2', glow: '#fbbf24', w: 3.8, len: 48, guard: 'wing', guardCol: '#f0dfae', gem: '#fff7c2', grip: 'metal', back: ['wings'], extras: ['runes', 'stars'], padR: 8 }), [FX2.storm(5, .85, { col: '#fff7c2', col2: '#ffffff' }), FX2.domain(104, 3.4, .2, { col: '#fde68a', col2: '#fff7c2' })], 'Chuva de lâminas sagradas no cursor e um domínio de luz ao redor do jogador.', 'mythic_core:1,celestial_bar:10,e_light:14,e_time:6');
S2(162, 'Asas do Amanhecer', 720, 1.2, 5, A2('wing', { col: '#ffe4a8', hot: '#fde68a', glow: '#fbbf24', w: 3.2, len: 48, guard: 'feather', guardCol: '#f6d9a0', grip: 'crystal', back: ['wings'], extras: ['stars', 'motes'], padR: 8 }), [FX2.orbs(4, .34, { col: '#fde68a', rad: 54, life: 5.4 }), FX2.nova(92, .55, { col: '#fde68a', kb: 5 })], 'Quatro asas de luz orbitam e golpeiam; o golpe abre uma nova dourada.', 'mythic_core:1,celestial_bar:10,e_light:12,e_water:6');
S2(163, 'Lei do Silêncio', 690, 1.35, 4, A2('katana', { col: '#242233', hot: '#e2e8f0', glow: '#94a3b8', w: 2.1, len: 50, bend: 2.0, guard: 'seal', guardCol: '#4c4a5e', grip: 'void', extras: ['glyphs'], back: ['aura'], padR: 6 }), [FX2.timeSlip(2.4, .85, .4), FX2.mark(1.2, 1.25, { col: '#94a3b8', r: 76 })], 'Impõe a lei: inimigos ficam lentos, marcados e detonam em silêncio.', 'mythic_core:1,celestial_bar:10,e_time:14,e_shadow:8');
S2(164, 'Cetro do Sol Nascente', 740, 1.05, 7, A2('glaive', { col: '#ffd27a', hot: '#fbbf24', glow: '#f59e0b', w: 3.4, len: 52, guard: 'halo', guardCol: '#e0b465', grip: 'leather', gripCol: '#4a3418', extras: ['flames', 'runes'], back: ['rings'], padR: 8 }), [FX2.sweep(.35, { col: '#fbbf24', col2: '#fff7c2', arc: .95, w: 24, life: .9, flash: '#fbbf24' }), FX2.comet(1.25, { col: '#f59e0b', col2: '#ffe08a' })], 'Varre o horizonte com um arco solar e chama um cometa de fogo no cursor.', 'mythic_core:1,celestial_bar:11,e_light:12,e_fire:10');
S2(165, 'Lança da Constelação', 700, 1.4, 3, A2('rapier', { col: '#c7d2fe', hot: '#a5b4fc', glow: '#818cf8', w: 1.8, len: 54, guard: 'gem', guardCol: '#aeb8dc', gem: '#c7d2fe', grip: 'crystal', pommel: 'spike', extras: ['stars'], padR: 6 }), [FX2.fan(3, .14, .55, { col: '#a5b4fc', shape: 'star', r: 9, speed: 860, glow: '#818cf8' }), FX2.split(3, .4, { col: '#c7d2fe' })], 'Três lanças-estrela voam em linha reta e se partem em três ao acertar.', 'mythic_core:1,celestial_bar:10,e_light:10,e_time:8');
S2(166, 'Veredito Celeste', 830, .95, 8, A2('great', { col: '#fffaf0', hot: '#fde68a', glow: '#fbbf24', w: 4.4, len: 50, guard: 'cross', guardCol: '#e6d9b0', gem: '#fff7c2', grip: 'metal', pommel: 'spike', back: ['rings'], extras: ['runes', 'sparks'], padR: 8 }), [FX2.bigBang(.45, { r: 152, boomDm: 1.6, label: 'VEREDITO', col: '#fde68a', col2: '#fff7c2' })], 'Profere o veredito: dano em tela cheia e um colapso no ponto do golpe.', 'mythic_core:1,celestial_bar:12,e_light:15,e_time:8');
S2(167, 'Hino dos Querubins', 705, 1.3, 4, A2('wing', { col: '#ffe0e6', hot: '#fecdd3', glow: '#fda4af', w: 3.0, len: 48, guard: 'feather', guardCol: '#f2d3da', grip: 'crystal', back: ['wings'], extras: ['petals', 'stars'], padR: 8 }), [FX2.domain(112, 4.5, .22, { col: '#fda4af', col2: '#ffe4e6' }), FX2.shield(95, 4, 320)], 'Um hino cura o jogador, dá escudo e fere lentamente tudo ao redor.', 'mythic_core:1,celestial_bar:10,e_light:10,e_blood:6');
S2(168, 'Domínio do Trovão', 760, 1.15, 5, A2('mech', { col: '#9fd8ea', hot: '#fde047', glow: '#22d3ee', w: 3.2, len: 48, guard: 'cog', guardCol: '#7fa8bb', grip: 'metal', pommel: 'ring', extras: ['lightning', 'sparks'], padR: 6 }), [FX2.chain(4, 195, .4, { col: '#fde047' }), FX2.storm(3, .7, { col: '#fde047' })], 'O domínio do trovão salta por quatro inimigos e chama três raios no cursor.', 'mythic_core:1,celestial_bar:10,e_lightning:16');
S2(169, 'Aurora Dourada', 735, 1.25, 5, A2('saber', { col: '#ffe3a0', hot: '#fbbf24', glow: '#f59e0b', w: 2.8, len: 49, bend: 3.8, guard: 'swept', guardCol: '#e5c377', grip: 'leather', gripCol: '#4a3418', extras: ['motes', 'stars'], back: ['aura'], padR: 6 }), [FX2.sweep(.3, { col: '#fbbf24', col2: '#fff7c2' }), FX2.echo(2, .45, { col: '#fde68a' })], 'Um arco dourado varre a frente e deixa dois ecos de aurora.', 'mythic_core:1,celestial_bar:10,e_light:12,e_fire:4');
S2(170, 'Cálice da Eternidade', 715, 1.2, 5, A2('crystal', { col: '#a7f3e6', hot: '#5eead4', glow: '#2dd4bf', w: 3.0, len: 47, guard: 'gem', guardCol: '#8fd6c8', gem: '#a7f3e6', grip: 'crystal', back: ['rings'], extras: ['motes'], padR: 7 }), [FX2.converge(4, 1.8, { col: '#5eead4', label: 'ETERNO' }), FX2.orbs(2, .3, { col: '#5eead4', glow: '#2dd4bf' })], 'Quatro acertos enchem o cálice e liberam uma onda eterna.', 'mythic_core:1,celestial_bar:10,e_time:10,e_water:8');
S2(171, 'Coroa da Criação', 745, 1.25, 5, A2('double', { col: '#ffe9b0', hot: '#fde68a', glow: '#fbbf24', w: 2.6, len: 46, guard: 'halo', guardCol: '#e2c67e', grip: 'metal', back: ['rings', 'glyphs'], extras: ['runes', 'stars'], padR: 8 }), [FX2.mirror(.85, { col: '#fde68a' }), FX2.orbs(3, .4, { col: '#fde68a', rad: 48 })], 'Cria um reflexo de cada golpe e três coroas orbitais que cortam sozinhas.', 'mythic_core:1,celestial_bar:11,e_light:12,e_time:6');
S2(172, 'Selo do Juízo Final', 880, .9, 9, A2('great', { col: '#f4ead8', hot: '#fff7c2', glow: '#fbbf24', w: 5.2, len: 47, guard: 'seal', guardCol: '#d8c9a6', grip: 'metal', pommel: 'spike', extras: ['runes', 'sparks'], padR: 8 }), [FX2.line(.9, { col: '#fff7c2', col2: '#ffffff', w: 34, life: .7, light: [1, .95, .6] }), FX2.nova(122, .6, { col: '#fde68a', kb: 7 })], 'O selo risca a tela com um feixe de julgamento e explode em luz.', 'mythic_core:1,celestial_bar:12,e_light:14,e_earth:8');
S2(173, 'Lâmina do Tempo Zero', 690, 1.45, 4, A2('katana', { col: '#a5f3fc', hot: '#67e8f9', glow: '#22d3ee', w: 2.0, len: 50, bend: 2.8, guard: 'ring', guardCol: '#a9dbe8', grip: 'crystal', extras: ['glyphs', 'motes'], back: ['aura'], padR: 6 }), [FX.timeStopCrit(1.2), FX2.echo(2, .4, { gap: .07, col: '#a5f3fc' })], 'Críticos param o tempo por 1,2s; cada golpe deixa dois ecos.', 'mythic_core:1,celestial_bar:10,e_time:14,e_ice:6');
S2(174, 'Arauto da Luz', 775, 1.2, 5, A2('machete', { col: '#ffffff', hot: '#fff7c2', glow: '#fde047', w: 2.6, len: 50, guard: 'wing', guardCol: '#f2e6b8', gem: '#fff7c2', grip: 'metal', back: ['wings'], extras: ['stars', 'runes'], padR: 8 }), [FX2.line(.6, { col: '#ffffff', col2: '#fff7c2', w: 26 }), FX2.domain(96, 4, .2, { col: '#fff7c2', col2: '#ffffff' })], 'Anuncia a luz: um feixe puro e um domínio que queima os ímpios.', 'mythic_core:1,celestial_bar:11,e_light:16');
S2(175, 'Sinfonia dos Céus', 730, 1.3, 5, A2('split', { col: '#ffd9e2', hot: '#fbcfe8', glow: '#f0abfc', w: 3.0, len: 47, guard: 'feather', guardCol: '#e8c2ce', grip: 'crystal', extras: ['petals', 'stars'], back: ['glyphs'], padR: 7 }), [FX2.echo(3, .4, { gap: .07, col: '#fbcfe8' }), FX2.storm(2, .5, { col: '#f0abfc' })], 'Três ecos afinados e duas notas celestes caem do céu.', 'mythic_core:1,celestial_bar:10,e_light:10,e_blood:8');
S2(176, 'Fênix Imortal', 800, 1.1, 5, A2('fang', { col: '#ffb27a', hot: '#ffd166', glow: '#fb923c', w: 3.4, len: 48, bend: 5.2, guard: 'feather', guardCol: '#d98c52', grip: 'bone', back: ['wings'], extras: ['flames', 'cracks'], padR: 8 }), [FX2.bloodNova(14, 1, 1.4, { col: '#fb923c' }), FX2.comet(1.2, { col: '#fb923c', col2: '#ffe08a' }), FX.solarFlames(2)], 'Renasce a cada golpe: cura, incendeia a área e chama brasas do céu.', 'mythic_core:1,celestial_bar:11,e_fire:16,e_blood:8');
S2(177, 'Escudo do Firmamento', 850, .95, 8, A2('zweihander', { col: '#bfe9ff', hot: '#93c5fd', glow: '#60a5fa', w: 4.6, len: 48, guard: 'wing', guardCol: '#9cc3da', gem: '#bfe9ff', grip: 'metal', pommel: 'spike', extras: ['ice', 'sparks'], padR: 8 }), [FX2.shield(150, 5, 600), FX2.nova(112, .5, { col: '#93c5fd', kb: 8 })], 'O firmamento protege: 150 de escudo e uma onda que afasta tudo.', 'mythic_core:1,celestial_bar:12,e_ice:14,e_earth:10');
S2(178, 'Chama Sagrada', 765, 1.2, 5, A2('flame', { col: '#ffcf6a', hot: '#fbbf24', glow: '#f97316', w: 3.2, len: 48, guard: 'halo', guardCol: '#e0b064', grip: 'bone', extras: ['flames', 'runes'], back: ['rings'], padR: 8 }), [FX2.domain(102, 4, .3, { col: '#fbbf24', status: [['burn', 4, { dps: 42 }]], elem: 'fire' }), FX2.nova(84, .45, { col: '#f97316', status: [['burn', 3, { dps: 30 }]] })], 'Uma chama sagrada queima sem parar tudo o que se aproxima.', 'mythic_core:1,celestial_bar:11,e_fire:14,e_light:8');
S2(179, 'Nexo do Infinito', 720, 1.3, 4, A2('orb', { col: '#c9b6ff', hot: '#c084fc', glow: '#a855f7', w: 2.8, len: 48, guard: 'orb', guardCol: '#9d8ad0', grip: 'crystal', back: ['rings', 'glyphs'], extras: ['motes', 'stars'], padR: 8 }), [FX2.singularity(.4, { col: '#c084fc', pull: 560 }), FX2.fan(3, .35, .4, { col: '#c084fc' })], 'O nexo dobra o espaço: um buraco negro perseguidor e três lâminas do vazio.', 'mythic_core:1,celestial_bar:11,e_time:12,e_shadow:10');
S2(180, 'Trono de Ouro', 840, 1.0, 7, A2('trident', { col: '#ffd970', hot: '#fbbf24', glow: '#f59e0b', w: 3.6, len: 52, guard: 'seal', guardCol: '#c9a24e', gem: '#fff7c2', grip: 'metal', back: ['rings'], extras: ['runes', 'stars'], padR: 8 }), [FX2.storm(4, .8, { col: '#fbbf24', col2: '#fff7c2' }), FX2.gravity(132, 400, .4, { col: '#fbbf24' })], 'O trono chama raios dourados e dobra o espaço ao redor do impacto.', 'mythic_core:1,celestial_bar:12,e_light:14,e_earth:8');

// ================================================================
// TIER 10 — ORIGEM · SUPREMO (181–200)  [criadas]
// ================================================================
S2(181, 'Primeira Luz', 980, 1.25, 6, A2('straight', { col: '#fffdf2', hot: '#fff7c2', glow: '#fde047', w: 2.8, len: 52, guard: 'wing', guardCol: '#f4e8c0', gem: '#ffffff', grip: 'crystal', back: ['wings', 'rings'], extras: ['runes', 'stars', 'motes'], padR: 9 }), [FX2.bigBang(.4, { label: 'PRIMEIRA LUZ', col: '#fde68a', col2: '#ffffff' }), FX2.domain(124, 4, .25, { col: '#fff7c2', col2: '#ffffff' })], 'A primeira luz do universo: dano em tela cheia, colapso e um domínio branco.', 'mythic_core:2,celestial_bar:14,e_light:18,e_time:10');
S2(182, 'Fim de Tudo', 1150, 1.0, 8, A2('scythe', { col: '#4a3f7a', hot: '#a78bfa', glow: '#7c3aed', w: 3.8, len: 52, guard: 'skull', guardCol: '#5c4f8c', grip: 'void', back: ['aura'], extras: ['eyes', 'shards'], padR: 9 }), [FX2.singularity(.5, { r: 34, pull: 720, boomR: 124, boomDm: 1.9, col: '#7c3aed' }), FX2.rift(84, 3, .55, { col: '#7c3aed' })], 'O fim: um buraco negro que cresce, uma fenda eterna e nada sobrevive.', 'mythic_core:2,celestial_bar:15,e_shadow:18,e_time:12');
S2(183, 'Buraco Branco', 1050, 1.2, 6, A2('orb', { col: '#ffffff', hot: '#e0e7ff', glow: '#c7d2fe', w: 3.0, len: 50, guard: 'orb', guardCol: '#d7def5', grip: 'crystal', back: ['rings', 'glyphs'], extras: ['shards', 'stars'], padR: 9 }), [FX2.nova(165, 1.2, { col: '#ffffff', col2: '#c7d2fe', kb: 10 }), FX2.orbs(4, .4, { col: '#ffffff', glow: '#c7d2fe', rad: 60 })], 'Cospe matéria: uma nova branca gigante e quatro órbitas de luz pura.', 'mythic_core:2,celestial_bar:15,e_light:20,e_time:12');
S2(184, 'Cosmos Vivo', 1080, 1.15, 6, A2('crystal', { col: '#d8c7ff', hot: '#c4b5fd', glow: '#8b5cf6', w: 3.2, len: 50, guard: 'gem', guardCol: '#b7a6e0', gem: '#e9d5ff', grip: 'crystal', back: ['rings'], extras: ['stars', 'glyphs'], padR: 8 }), [FX2.storm(5, 1, { col: '#c4b5fd', col2: '#ffffff' }), FX2.split(4, .5, { col: '#a5b4fc' })], 'Um cosmos inteiro desaba: cinco estrelas caem e cada estilhaço se divide.', 'mythic_core:2,celestial_bar:15,e_light:14,e_time:12,e_shadow:8');
S2(185, 'Teorema Final', 1120, 1.1, 7, A2('mech', { col: '#9fe8f5', hot: '#67e8f9', glow: '#22d3ee', w: 3.6, len: 50, guard: 'cog', guardCol: '#7fc7d6', gem: '#fde047', grip: 'metal', extras: ['glyphs', 'lightning'], padR: 7 }), [FX2.line(1.1, { col: '#67e8f9', col2: '#ffffff', w: 30 }), FX2.mirror(1.0, { col: '#a5f3fc' })], 'Prova o teorema: um feixe que atravessa tudo e o reflexo exato do golpe.', 'mythic_core:2,celestial_bar:14,e_lightning:16,e_time:10');
S2(186, 'O Último Nome', 1200, 1.3, 5, A2('katana', { col: '#2a2836', hot: '#f8fafc', glow: '#e2e8f0', w: 2.2, len: 54, bend: 1.8, guard: 'seal', guardCol: '#4b4958', gem: '#ffffff', grip: 'void', back: ['aura'], extras: ['runes', 'motes'], padR: 7 }), [FX2.execute(.5, 3.2, { col: '#f8fafc' }), FX2.mark(1.0, 1.8, { col: '#e2e8f0', r: 96 })], 'Diz o último nome do inimigo: executa os feridos e sela os vivos.', 'mythic_core:2,celestial_bar:15,e_shadow:16,e_time:12');
S2(187, 'Origem do Vazio', 1300, .9, 10, A2('slab', { col: '#33304a', hot: '#818cf8', glow: '#4f46e5', w: 5.4, len: 50, guard: 'seal', guardCol: '#4a4568', gem: '#818cf8', grip: 'void', back: ['rings', 'aura'], extras: ['shards', 'glyphs'], padR: 9 }), [FX2.gravity(185, 720, .8, { col: '#818cf8' }), FX2.bigBang(.3, { r: 185, boomDm: 2, label: 'VAZIO', col: '#4c1d95', col2: '#c7d2fe' })], 'Do nada, tudo: puxa o mundo para si e colapsa a tela em seguida.', 'mythic_core:2,celestial_bar:16,e_shadow:18,e_earth:12');
S2(188, 'Relógio do Universo', 1010, 1.35, 5, A2('double', { col: '#ffe6a8', hot: '#67e8f9', glow: '#22d3ee', w: 2.6, len: 48, guard: 'cog', guardCol: '#c9a45e', gem: '#a5f3fc', grip: 'metal', back: ['rings'], extras: ['runes', 'stars'], padR: 8 }), [FX2.timeSlip(3, .9, .5), FX2.echo(2, .5, { col: '#a5f3fc' })], 'Atrasa o tempo dos inimigos, acelera o seu e repete o golpe duas vezes.', 'mythic_core:2,celestial_bar:14,e_time:18,e_light:8');
S2(189, 'Semente Cósmica', 1040, 1.2, 6, A2('thorn', { col: '#9fe08a', hot: '#a3e635', glow: '#65a30d', w: 3.2, len: 50, guard: 'thorn', guardCol: '#6fae5a', gem: '#fde047', grip: 'bone', back: ['glyphs'], extras: ['petals', 'motes'], padR: 8 }), [FX2.domain(124, 5, .3, { col: '#4ade80', col2: '#bbf7d0' }), FX2.souls(3, .6, { col: '#86efac' })], 'Planta um mundo: um domínio vivo cura e três sementes caçam os inimigos.', 'mythic_core:2,celestial_bar:14,e_poison:14,e_earth:12');
S2(190, 'Axioma', 1060, 1.45, 4, A2('rapier', { col: '#f8fafc', hot: '#ffffff', glow: '#e2e8f0', w: 1.8, len: 56, guard: 'gem', guardCol: '#cfd6e4', gem: '#ffffff', grip: 'crystal', pommel: 'spike', extras: ['runes', 'sparks'], padR: 6 }), [FX2.fan(5, .1, .5, { col: '#ffffff', shape: 'needle', speed: 920, r: 7, glow: '#e2e8f0' }), FX2.split(3, .5, { col: '#f8fafc' })], 'Verdade absoluta: cinco agulhas perfeitas e cada uma se parte em três.', 'mythic_core:2,celestial_bar:14,e_light:16,e_time:10');
S2(191, 'Convergência Final', 1090, 1.15, 6, A2('trident', { col: '#f6e6b0', hot: '#fde68a', glow: '#fbbf24', w: 3.6, len: 52, guard: 'halo', guardCol: '#d8c48a', gem: '#ffffff', grip: 'metal', back: ['rings', 'glyphs'], extras: ['runes', 'stars'], padR: 9 }), [FX2.converge(3, 3.2, { col: '#fde68a', r: 132, label: 'FIM' }), FX2.storm(3, .8, { col: '#fde68a' })], 'Três acertos bastam para convergir tudo num único golpe devastador.', 'mythic_core:2,celestial_bar:15,e_light:16,e_time:12');
S2(192, 'Espada do Autor', 1250, .95, 9, A2('great', { col: '#fff6dd', hot: '#fbbf24', glow: '#f59e0b', w: 4.8, len: 52, guard: 'wing', guardCol: '#e8d8ac', gem: '#ffffff', grip: 'metal', pommel: 'spike', back: ['wings'], extras: ['runes', 'stars', 'sparks'], padR: 9 }), [FX2.bigBang(.5, { r: 225, boomDm: 2.4, label: 'AUTOR', col: '#fde68a', col2: '#fff7c2' }), FX2.shield(200, 5, 800)], 'Reescreve a cena: dano na tela inteira, colapso e 200 de escudo divino.', 'mythic_core:3,celestial_bar:18,e_light:20,e_time:14');
S2(193, 'Nada Eterno', 1180, 1.25, 5, A2('rapier', { col: '#2b2838', hot: '#a78bfa', glow: '#7c3aed', w: 1.9, len: 56, guard: 'ring', guardCol: '#4a4660', gem: '#c4b5fd', grip: 'void', back: ['aura'], extras: ['shards', 'glyphs'], padR: 7 }), [FX2.singularity(.55, { col: '#a78bfa', pull: 820, boomR: 110 }), FX2.timeSlip(2.5, .9, .45)], 'O vazio eterno: suga, retarda e apaga o que sobrar.', 'mythic_core:2,celestial_bar:15,e_shadow:18,e_time:14');
S2(194, 'Tudo de Uma Vez', 1210, 1.2, 6, A2('split', { col: '#ffe9b8', hot: '#fde68a', glow: '#fbbf24', w: 3.2, len: 50, guard: 'gem', guardCol: '#dcc68e', gem: '#ffffff', grip: 'crystal', back: ['rings', 'wings'], extras: ['stars', 'runes'], padR: 9 }), [FX2.echo(2, .6, { gap: .06, col: '#fde68a' }), FX2.orbs(4, .45, { col: '#fde68a', rad: 56 }), FX2.nova(122, .6, { col: '#fde68a' })], 'Faz tudo simultaneamente: ecos, órbitas e uma nova a cada golpe.', 'mythic_core:2,celestial_bar:16,e_light:16,e_time:12,e_fire:8');
S2(195, 'Ponto Zero', 1100, 1.3, 5, A2('crystal', { col: '#a5f3fc', hot: '#67e8f9', glow: '#06b6d4', w: 3.0, len: 50, guard: 'seal', guardCol: '#8fd0dd', gem: '#ffffff', grip: 'crystal', back: ['glyphs'], extras: ['glyphs', 'motes'], padR: 7 }), [FX2.mark(1.0, 2.2, { col: '#67e8f9', r: 110 }), FX2.sweep(.4, { col: '#67e8f9', col2: '#ffffff', w: 26 })], 'Marca o ponto zero do alvo: ele detona em 1s enquanto o feixe varre a tela.', 'mythic_core:2,celestial_bar:15,e_time:16,e_ice:12');
S2(196, 'Coração do Multiverso', 1130, 1.2, 6, A2('orb', { col: '#ffc2d4', hot: '#fb7185', glow: '#f43f5e', w: 3.0, len: 50, guard: 'gem', guardCol: '#e0a2b4', gem: '#fde047', grip: 'crystal', back: ['rings', 'aura'], extras: ['stars', 'petals'], padR: 9 }), [FX2.bloodNova(18, 1, 1.2, { col: '#fb7185' }), FX2.bigBang(.35, { label: 'MULTIVERSO', col: '#f0abfc', col2: '#ffe4e6' })], 'O coração pulsa em vários mundos: cura, explode em rosa e colapsa a tela.', 'mythic_core:2,celestial_bar:16,e_blood:18,e_light:12');
S2(197, 'Lâmina Absoluta', 1280, 1.0, 8, A2('dao', { col: '#ffffff', hot: '#f8fafc', glow: '#e2e8f0', w: 4.6, len: 50, guard: 'cross', guardCol: '#dfe4ee', gem: '#ffffff', grip: 'metal', pommel: 'spike', back: ['rings'], extras: ['runes', 'sparks'], padR: 8 }), [FX2.line(1.3, { col: '#ffffff', col2: '#f8fafc', w: 40, light: [1, 1, 1] }), FX2.execute(.45, 3, { col: '#ffffff' })], 'Um corte absoluto: feixe branco que atravessa tudo e executa os feridos.', 'mythic_core:3,celestial_bar:16,e_light:20,e_time:10');
S2(198, 'Maré Cósmica', 1160, 1.15, 6, A2('scythe', { col: '#8ff0e0', hot: '#5eead4', glow: '#2dd4bf', w: 3.6, len: 54, guard: 'halo', guardCol: '#7ecfc4', gem: '#c4b5fd', grip: 'crystal', back: ['rings', 'aura'], extras: ['motes', 'stars'], padR: 9 }), [FX2.domain(152, 4.5, .35, { col: '#5eead4', col2: '#ccfbf1' }), FX2.chain(4, 200, .5, { col: '#a5f3fc' })], 'A maré cósmica cobre a arena e conduz raios entre os inimigos.', 'mythic_core:2,celestial_bar:16,e_water:16,e_lightning:12');
S2(199, 'Brado do Infinito', 1220, 1.1, 7, A2('glaive', { col: '#ffd27a', hot: '#fbbf24', glow: '#f59e0b', w: 3.6, len: 54, guard: 'seal', guardCol: '#d6b364', gem: '#fff7c2', grip: 'leather', gripCol: '#4a3418', back: ['rings'], extras: ['runes', 'sparks'], padR: 9 }), [FX2.storm(6, 1.1, { col: '#fbbf24', col2: '#fff7c2' }), FX2.sweep(.45, { col: '#fbbf24', col2: '#fff7c2', w: 28, life: .95 })], 'Um brado que chama seis lanças do céu e varre o horizonte em ouro.', 'mythic_core:2,celestial_bar:16,e_light:14,e_fire:14');
S2(200, 'Apoteose', 1400, 1.05, 10, A2('great', { col: '#fff8e6', hot: '#ffffff', glow: '#fbbf24', w: 5.0, len: 54, guard: 'wing', guardCol: '#f2e0b0', gem: '#ffffff', grip: 'crystal', back: ['wings', 'rings', 'aura'], extras: ['runes', 'stars', 'motes'], padR: 9, arc: 3.0 }), [FX2.bigBang(.6, { r: 250, boomDm: 3.0, label: 'APOTEOSE', col: '#fde68a', col2: '#ffffff' }), FX2.orbs(5, .5, { col: '#fde68a', rad: 64 }), FX2.domain(160, 5, .35, { col: '#fff7c2', col2: '#ffffff' })], 'A espada final: dano em tela cheia, colapso, cinco órbitas e um domínio de luz eterna.', 'mythic_core:4,celestial_bar:20,e_light:20,e_time:16,e_shadow:12', { crit: .26 });
