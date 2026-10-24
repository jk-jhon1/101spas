/* ============================================================
   13c_bossx: motor dos 90 chefes novos (dados em 13d..13i_bx_*.js, arte em 05f..05l_bxart*.js)
   Cada chefe é um objeto em BX (registro bx(id, def)): atributos, sigilo de invocação, receita, loot,
   uma "mecânica única" (hooks: init, passive, hurt, after, lethal, death, draw) e um repertório de golpes
   escritos como geradores (function*): `yield 0.5` espera meio segundo, `yield` sozinho espera um quadro.
   Peças compartilhadas: zonas de perigo (lentidão, veneno, vento, atração, explosão com aviso), raios com
   aviso, projéteis temáticos, lacaios, teletransporte e debuffs do jogador (P.buffs: slow, confuse, stun,
   silence, gravflip, floaty, curse, bleed, slowatk).
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const BX = {}, BXLIST = [];
const BX_ACTS = [null,
  { n: 'Ato I · Despertar', st: 'bench', stage: 0, mat: [['gel', 14, 26], ['bone', 4, 8]], pot: 'potion1' },
  { n: 'Ato II · Pós-Olho', st: 'anvil', stage: 1, mat: [['platinum_bar', 6, 10], ['vamp_tooth', 2, 4]], pot: 'potion1' },
  { n: 'Ato III · Hardmode', st: 'advanvil', stage: 2, mat: [['hell_bar', 6, 10], ['celestial_frag', 5, 9]], pot: 'potion2' },
  { n: 'Ato IV · Além do Colosso', st: 'forge', stage: 3, mat: [['celestial_frag', 10, 18], ['e_time', 1, 2]], pot: 'potion3' },
  { n: 'Ato V · Além do Firmamento', st: 'forge', stage: 3, mat: [['celestial_bar', 4, 8], ['e_light', 5, 9]], pot: 'potion3' },
  { n: 'Ato VI · Fim de Tudo', st: 'forge', stage: 3, mat: [['celestial_bar', 6, 10], ['mythic_core', 1, 2]], pot: 'potion3' },
];
const BX_BIO = { ocean: 'oceano', desert: 'deserto', forest: 'floresta', jungle: 'selva', snow: 'neve' };
const BX_LAY = { sky: 'as ilhas do céu', surface: 'a superfície', cave: 'as cavernas', deep: 'as cavernas profundas', hell: 'o Inferno' };

function bx(id, d) {
  d.id = id; d.i = BXLIST.length; BX[id] = d; BXLIST.push(d); if (!d.acc && BXART[id]) d.acc = BXART[id].acc; if (!d.acc2 && BXART[id]) d.acc2 = BXART[id].acc2;
  d.glow = d.glow || d.acc; d.shot = d.shot || 'orb';
  enemy('bx_' + id, { n: d.n, kind: 'bx', draw: 'bx', boss: 1, bx: d, fly: d.fly ? 1 : 0, noclip: (d.noclip === undefined ? d.fly : d.noclip) ? 1 : 0, w: d.w, h: d.h, hp: d.hp, dmg: d.dmg, def: d.def || 0, spd: d.spd || 150, kbr: 1, mass: 10, col: d.acc2 || '#222', col2: d.acc, blood: d.acc, drops: [], coins: d.coin, glowc: d.glow });
  if (d.sword && IT[d.sword] && IT[d.sword].sw) {   /* Tier 9/10: a espada não se forja, cai só do chefe */
    const sw = IT[d.sword].sw; if (sw.tierLevel >= 9) { const k = RECIPES.findIndex(r => r.out === sw.id); if (k >= 0) RECIPES.splice(k, 1); sw.dropOnly = true; }
    if (sw.dropOnly) { sw.dropFrom = id; sw.dropFromName = d.n; }
  }
  const cond = d.cond ? ' Condição: ' + bxCondText(d) + '.' : '';
  item('sg_' + id, 'Sigilo: ' + (d.sigil || d.n), { type: 'use', tier: d.act + 1, stack: 20, ic: ['sigil', d.acc, d.i], use: 'boss_x:' + id, desc: 'Invoca ' + d.n + '.' + cond + ' Mecânica: ' + d.mech });
  rec('sg_' + id, 1, d.rec, d.st || BX_ACTS[d.act].st);
}
function bxCondText(d) {
  const c = d.cond || {}, t = [];
  if (c.night) t.push('à noite'); if (c.day) t.push('de dia');
  if (c.layer) t.push('em ' + BX_LAY[c.layer]); if (c.biome) t.push('no bioma ' + BX_BIO[c.biome]);
  if (c.stage) t.push('após derrotar o chefe do ato anterior');
  return t.join(', ');
}
function bxCondMsg(d) {
  const c = d.cond; if (!c) return null; const P = G.P, wd = G.world, tx = Math.floor(pcx(P) / TS), ty = Math.floor(pcy(P) / TS);
  if (G.stage < BX_ACTS[d.act].stage) return 'O mundo ainda não está pronto para ' + d.n + '. Derrote os chefes anteriores.';
  if (c.night && !isNightFrac(G.time)) return d.n + ' só responde à noite.';
  if (c.day && isNightFrac(G.time)) return d.n + ' só responde de dia.';
  if (c.layer && wd.layerAt(tx, ty) !== c.layer) return d.n + ' só responde em ' + BX_LAY[c.layer] + '.';
  if (c.biome && wd.biomeName(tx) !== c.biome) return d.n + ' só responde no bioma ' + BX_BIO[c.biome] + '.';
  return null;
}
function bxStageMsg(d) { return G.stage < BX_ACTS[d.act].stage ? 'O mundo ainda não está pronto para ' + d.n + '. Derrote os chefes anteriores.' : null; }

function summonBossX(id) {
  const d = BX[id]; if (!d) return false;
  const P = G.P, creative = G.mode === 'creative';
  if (G.boss && !G.boss.dead) { toast('Já existe um chefe ativo.', '#fbbf24'); return false; }
  if (!creative) { const m = bxStageMsg(d) || bxCondMsg(d); if (m) { toast(m, '#fbbf24'); return false; } }
  const side = P.face || 1, ed = ED['bx_' + id]; let x, y;
  if (d.fly) { x = pcx(P) + side * 280 - ed.w / 2; y = pcy(P) - 200 - ed.h / 2; }
  else {
    const sx = pcx(P) + side * 240, gy = groundY(sx, pcy(P) - 40, 60);
    if (gy > 0 && !overlapSolid(sx - ed.w / 2, gy - ed.h - 2, ed.w, ed.h)) { x = sx - ed.w / 2; y = gy - ed.h - 1; }
    else { const p = freeSpot(ed.w, ed.h, pcx(P) + side * 200, pcy(P) - 60); x = p.x; y = p.y; }
  }
  bxTrimCache(id); bxWarmAll(id);   /* todos os quadros do chefe prontos antes da luta (escondido pelo clarão preto) */
  const e = spawnEnemy('bx_' + id, x, y); G.boss = e; e.bossT = 0;
  // os chefes novos foram calibrados para 3 acessórios; com o 4º slot eles ganham 12% de vida
  e.hpMax = Math.round(e.hpMax * (1 + .03 * Math.min(4, (P.equip.acc || []).filter(Boolean).length))); e.hp = e.hpMax;
  bxInit(e);
  sfx('boss'); shake(8); toast(d.msg || (d.n + ' despertou!'), d.acc, 5); flash('#000000', .35, .8);
  return true;
}

function bxTrimCache(keep) {   // esquece os quadros dos outros chefes novos (memória): só o chefe da luta fica no cache
  for (const k of [...BOSSART.cache.keys()]) if (k[0] === 'x' && !k.startsWith('x' + keep + '|') && !k.startsWith('x' + keep + '_')) BOSSART.cache.delete(k);
}
// ---------- estado de efeitos (zonas, raios) ----------
function bxS() { return G.bxs || (G.bxs = { zones: [], beams: [], dark: null }); }
function bxZone(c, o) {
  const S = bxS(), z = Object.assign({ x: 0, y: 0, r: 0, w: 0, h: 0, t: 3, tel: 0, age: 0, kind: 'dmg', dmg: 20, col: '#f87171', tick: .5, acc: 0, owner: c && c.e || null, kb: 160 }, o);
  if (z.grow) { z.r0 = z.r0 || 8; z.r = z.r0; }
  if (S.zones.length > 70) S.zones.shift();
  S.zones.push(z); return z;
}
function bxBeam(c, o) {
  const S = bxS(), b = Object.assign({ x: 0, y: 0, ang: 0, len: 420, w: 7, tel: .8, t: 2.2, age: 0, dmg: 30, col: '#ffffff', col2: '#ffffff', spin: 0, owner: c && c.e || null, hc: 0 }, o);
  if (S.beams.length > 40) S.beams.shift();
  S.beams.push(b); return b;
}
function bxZoneHit(z, P) {
  if (z.global) return true;
  if (z.r > 0) { const dx = Math.max(Math.abs(P.x + P.w / 2 - z.x) - P.w / 2, 0), dy = Math.max(Math.abs(P.y + P.h / 2 - z.y) - P.h / 2, 0); return dx * dx + dy * dy <= z.r * z.r; }
  return P.x < z.x + z.w && P.x + P.w > z.x && P.y < z.y + z.h && P.y + P.h > z.y;
}
function bxCleanup(boss) {
  for (const x of G.enemies) if (x.owner === boss && !x.dead) { x.dead = true; burst(ecx(x), ecy(x), 8, { col: [x.d.col2 || '#fff', '#fff'], spd: 90, life: .4, glow: true }); }
  const S = G.bxs; if (!S) return;
  S.zones = S.zones.filter(z => z.owner !== boss); S.beams = S.beams.filter(b => b.owner !== boss); S.dark = null;
}
function bxUpdate(dt) {
  const S = G.bxs; if (!S || G.freeze > 0) return; const P = G.P;   /* tempo parado congela zonas e raios */
  for (let i = S.zones.length - 1; i >= 0; i--) {
    const z = S.zones[i]; z.age += dt;
    if (z.follow) { if (z.follow.dead) z.t = 0; else { z.x = ecx(z.follow) + (z.ox || 0); z.y = ecy(z.follow) + (z.oy || 0); } }
    if (z.grow) z.r = z.r0 + (z.r1 - z.r0) * Math.min(1, z.age / z.grow);
    if (z.age >= z.t || (z.owner && z.owner.dead && !z.keep)) { if (z.onEnd) z.onEnd(z); S.zones.splice(i, 1); continue; }
    if (z.age < z.tel) continue;
    const inside = !P.dead && bxZoneHit(z, P);
    switch (z.kind) {
      case 'dmg': if (!z.fired) { z.fired = true; z.t = z.tel + (z.flash || .3); if (inside) { hurtPlayer(z.dmg, z.x + (z.w ? z.w / 2 : 0), z.kb); if (z.buff) addBuff(z.buff, z.bt || 2, z.bd); } if (z.onFire) z.onFire(z, inside); } break;
      case 'slow': if (inside) addBuff('slow', .3, { mult: z.mult || .5 }); break;
      case 'poison': case 'fire': if (inside) { z.acc += dt; if (z.acc >= z.tick) { z.acc = 0; hurtPlayer(z.dmg, undefined, 0, { pierce: true, inv: .15 }); } } break;
      case 'push': if (inside) { P.vx += (z.fx || 0) * dt; P.vy += (z.fy || 0) * dt; } break;
      case 'pull': if (inside) { const dx = z.x - pcx(P), dy = z.y - pcy(P), d = Math.hypot(dx, dy) || 1, k = (z.k || 500) * (1 - Math.min(1, d / (z.r + 1)) * .4); P.vx += dx / d * k * dt; P.vy += dy / d * k * dt * .8; if (z.core && d < z.core) { z.acc += dt; if (z.acc > .4) { z.acc = 0; hurtPlayer(z.dmg, z.x, 120); } } } break;
      case 'buff': if (inside) addBuff(z.buff, z.bt || .3, z.bd); break;
      case 'heal': { const o = z.owner; if (o && !o.dead && Math.abs(ecx(o) - z.x) < z.r && Math.abs(ecy(o) - z.y) < z.r) { o.hp = Math.min(o.hpMax, o.hp + o.hpMax * (z.hps || .01) * dt); } } break;
    }
    if (z.fn) z.fn(z, dt, inside);
  }
  for (let i = S.beams.length - 1; i >= 0; i--) {
    const b = S.beams[i]; b.age += dt;
    if (b.owner && b.owner.dead && !b.keep) { S.beams.splice(i, 1); continue; }
    if (b.follow && b.owner) { b.x = ecx(b.owner) + (b.ox || 0); b.y = ecy(b.owner) + (b.oy || 0); }
    if (b.aim && b.age < b.tel) b.ang = Math.atan2(pcy(P) - b.y, pcx(P) - b.x);
    b.ang += b.spin * dt;
    if (b.age >= b.t) { if (b.onEnd) b.onEnd(b); S.beams.splice(i, 1); continue; }
    if (b.age < b.tel || P.dead || b.noHit) continue;
    b.hc -= dt;
    const x1 = b.x + Math.cos(b.ang) * b.len, y1 = b.y + Math.sin(b.ang) * b.len;
    if (b.hc <= 0 && segAABB(b.x, b.y, x1, y1, P.x - b.w / 3, P.y - b.w / 3, P.w + b.w * .66, P.h + b.w * .66)) { b.hc = b.rate || .12; if (hurtPlayer(b.dmg, b.x, b.kb || 140) && b.buff) addBuff(b.buff, b.bt || 1.5, b.bd); }
    if (Math.random() < dt * 30) addPart({ x: b.x + Math.cos(b.ang) * rnd(10, b.len), y: b.y + Math.sin(b.ang) * rnd(10, b.len), vx: rnd(-20, 20), vy: rnd(-20, 20), life: .25, size: 3, col: b.col, glow: true });
  }
}
function bxDisc(g, x, y, r, col, a, rim) {   // disco em pixel-art (faixas de 1 px)
  x = Math.round(x); y = Math.round(y); r = Math.max(1, Math.round(r)); g.fillStyle = col; g.globalAlpha = a;
  for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(r * r - j * j)); g.fillRect(x - hw, y + j, hw * 2, 1); }
  if (rim) { g.fillStyle = rim; g.globalAlpha = Math.min(1, a * 2.4); for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(r * r - j * j)); g.fillRect(x - hw, y + j, 1, 1); g.fillRect(x + hw - 1, y + j, 1, 1); } g.fillRect(x - 2, y - r, 4, 1); g.fillRect(x - 2, y + r, 4, 1); }
  g.globalAlpha = 1;
}
function bxZoneDraw(g, z) {
  const tele = z.age < z.tel, k = tele ? z.age / z.tel : 1, pulse = .5 + .5 * Math.sin(G.t * 16);
  let a, col = z.col, rim = z.rim || '#fff';
  if (tele) a = .12 + .22 * k * (z.kind === 'dmg' || z.kind === 'tele' || z.vis === 'tele' ? 1 : .6); else if (z.kind === 'dmg') a = .5 * (1 - (z.age - z.tel) / (z.flash || .3)); else { a = (z.alpha || .26) * Math.min(1, (z.t - z.age) / .8) * (.85 + .15 * pulse); }
  if (z.kind === 'push' || z.kind === 'buff' && z.global) return;
  if (z.r > 0) { bxDisc(g, z.x, z.y, z.r, col, Math.max(0, a), tele || z.kind !== 'dmg' ? rim : null); if (z.kind === 'pull' && !tele) { g.fillStyle = '#000'; g.globalAlpha = .85; const r2 = Math.round(Math.min(z.r * .3, 12)); for (let j = -r2; j <= r2; j++) { const hw = Math.round(Math.sqrt(r2 * r2 - j * j)); g.fillRect(Math.round(z.x) - hw, Math.round(z.y) + j, hw * 2, 1); } g.globalAlpha = 1; } }
  else { g.globalAlpha = Math.max(0, a); g.fillStyle = col; g.fillRect(Math.round(z.x), Math.round(z.y), Math.round(z.w), Math.round(z.h)); g.globalAlpha = Math.min(1, a * 2); g.fillStyle = rim; g.fillRect(Math.round(z.x), Math.round(z.y), 1, Math.round(z.h)); g.fillRect(Math.round(z.x + z.w) - 1, Math.round(z.y), 1, Math.round(z.h)); g.globalAlpha = 1; }
}
function bxDraw(g) {
  const S = G.bxs; if (!S) return;
  for (const z of S.zones) if (!z.hidden) bxZoneDraw(g, z);
  for (const b of S.beams) {
    const x1 = b.x + Math.cos(b.ang) * b.len, y1 = b.y + Math.sin(b.ang) * b.len;
    if (b.age < b.tel) { const n = Math.floor(b.len / 6); g.fillStyle = b.col; g.globalAlpha = .35 + .35 * Math.sin(G.t * 28); for (let i = 0; i < n; i += 2) g.fillRect(Math.round(b.x + (x1 - b.x) * i / n), Math.round(b.y + (y1 - b.y) * i / n), 2, 2); g.globalAlpha = 1; }
    else { const k = Math.min(1, (b.t - b.age) / .25, (b.age - b.tel) / .08 + .2); g.save(); g.lineCap = 'butt'; g.strokeStyle = b.col; g.lineWidth = b.w * k; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = b.col2; g.lineWidth = Math.max(1, b.w * .4 * k); g.stroke(); g.restore(); }
  }
}
function bxGlow(g) {   // passe aditivo
  const S = G.bxs; if (!S) return;
  for (const b of S.beams) if (b.age >= b.tel) { const x1 = b.x + Math.cos(b.ang) * b.len, y1 = b.y + Math.sin(b.ang) * b.len, k = Math.min(1, (b.t - b.age) / .25); g.save(); g.globalAlpha = .4 * k; g.strokeStyle = b.col; g.lineWidth = b.w * 2.6; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(x1, y1); g.stroke(); g.restore(); G.light.addLight((b.x + (x1 - b.x) * .4) / TS, (b.y + (y1 - b.y) * .4) / TS, .6, .6, .6); }
  for (const z of S.zones) { if (z.age < z.tel || z.hidden || !(z.glow || z.kind === 'fire') || z.r <= 0) continue; drawGlow(g, z.x, z.y, z.r * 1.7, z.col, .32 * Math.min(1, (z.t - z.age) / .8)); }
}
let _bxDk = null;
function bxOverlay(g, w, h) {   // escuridão (Mariposa, Devorador): tudo escuro, exceto raios em volta do jogador e do chefe
  const S = G.bxs; if (!S || !S.dark || S.dark.t < G.t - .2) return; const D = S.dark, c = G.cam, Z = c.zoom / DPR;
  if (!_bxDk) _bxDk = document.createElement('canvas'); if (_bxDk.width !== w || _bxDk.height !== h) { _bxDk.width = w; _bxDk.height = h; }
  const k = _bxDk.getContext('2d'); k.globalCompositeOperation = 'source-over'; k.clearRect(0, 0, w, h); k.fillStyle = 'rgba(2,2,14,' + D.a + ')'; k.fillRect(0, 0, w, h);
  k.globalCompositeOperation = 'destination-out';
  for (const [wx, wy, r] of D.holes) { const sx = (wx - c.x) * c.zoom, sy = (wy - c.y) * c.zoom, rr = r * c.zoom, gr = k.createRadialGradient(sx, sy, rr * .15, sx, sy, rr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = gr; k.fillRect(sx - rr, sy - rr, rr * 2, rr * 2); }
  g.drawImage(_bxDk, 0, 0);
}

// ---------- debuffs e ajudas do jogador ----------
const bxBuff = (name, dur, data) => { const P = G.P; if (P && !P.dead && !G.opts.god) addBuff(name, dur, data); };
function bxHeal(e, pct) { e.hp = Math.min(e.hpMax, e.hp + e.hpMax * pct); }

// ---------- projéteis temáticos ----------
function bxShot(c, o) {
  o = o || {}; const e = c.e, d = c.d, sp = o.speed || 260, x = o.x !== undefined ? o.x : c.cx, y = o.y !== undefined ? o.y : c.cy;
  const a = (o.ang !== undefined ? o.ang : Math.atan2((o.ty !== undefined ? o.ty : c.py) - y, (o.tx !== undefined ? o.tx : c.px) - x)) + (o.spread || 0);
  if (!d.lc) d.lc = hex2rgb(d.acc).map(v => v / 255 * .7);
  const p = spawnProj({ friendly: false, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 6, dmg: Math.round(e.dmg * (o.dm || .65)), kb: 120, life: o.life || 3.2, shape: o.shape || d.shot, col: o.col || d.acc, col2: o.col2 || d.acc2c || '#ffffff', glow: o.glow || o.col || d.acc, glowR: (o.r || 6) * 3, grav: o.grav || 0, kind: o.kind || 'linear', pierce: 1, tiles: o.tiles !== false, light: o.nolight ? null : d.lc, angle: a, steer: o.steer || 0, targetP: !!o.homing, speed: sp, trail: o.trail, spin: o.spin || 0, bounce: o.bounce, noAim: o.noAim });
  if (o.on) Object.assign(p, o.on);
  return p;
}
const bxFan = (c, n, step, o) => { const L = []; for (let i = 0; i < n; i++) L.push(bxShot(c, Object.assign({}, o, { spread: ((o && o.spread) || 0) + (i - (n - 1) / 2) * step }))); return L; };
const bxRing = (c, n, o) => { o = o || {}; const L = []; for (let i = 0; i < n; i++) L.push(bxShot(c, Object.assign({}, o, { ang: (o.off || 0) + i / n * TAU }))); return L; };
const bxRain = (c, n, o) => { o = o || {}; const L = []; for (let i = 0; i < n; i++) L.push(bxShot(c, Object.assign({ speed: 340, noAim: true }, o, { x: c.px + rnd(-(o.spread || 220), o.spread || 220), y: c.py - (o.h || 380), ang: PI / 2 + rnd(-.08, .08) }))); return L; };
function bxCol(c, x, o) {   // coluna vertical com aviso (raio, fogo, estaca)
  o = o || {}; const y1 = (groundY(x, c.py, 40) > 0 ? groundY(x, c.py, 40) : c.py + 60), y0 = y1 - (o.h || 340), w = o.w || 22;
  return bxZone(c, { x: x - w / 2, y: y0, w, h: y1 - y0, tel: o.tel || .7, kind: 'dmg', dmg: Math.round(c.e.dmg * (o.dm || .8)), col: o.col || c.d.acc, rim: o.rim, flash: o.flash || .35, onFire: z => { burst(x, y1 - 10, 10, { col: [z.col, '#fff'], spd: 140, g: 200, life: .5, glow: true, ang: -PI / 2, spread: 2 }); if (o.fire) shake(3); }, buff: o.buff, bt: o.bt, bd: o.bd });
}
const bxTele = (c, o) => bxZone(c, Object.assign({ kind: 'tele', t: o.tel || .6, col: c.d.acc }, o));   // aviso: forma que enche até o golpe
function bxWave(c, dir, o) {   // onda de choque rente ao chão (acompanha o relevo)
  o = o || {}; const e = c.e, x0 = o.x !== undefined ? o.x : c.cx, gy = groundY(x0, o.y !== undefined ? o.y : e.y + e.h, 30); if (gy < 0) return null;
  const hh = o.hh || 9, p = spawnProj({ friendly: false, x: x0 + dir * 16, y: gy - hh, vx: dir * (o.speed || 250), vy: 0, r: 9, hw: o.hw || 8, hh, dmg: Math.round(e.dmg * (o.dm || .7)), kb: 150, life: o.life || 1.5, shape: 'wave', col: o.col || c.d.acc, col2: o.col2 || '#ffffff', glow: o.col || c.d.acc, glowR: 22, tiles: false, pierce: 1 });
  p.onUpdate = q => { const g2 = groundY(q.x, q.y + hh, 12); if (g2 > 0) q.y = g2 - hh; }; return p;
}
const bxBoom = (c, x, y, r, o) => { o = o || {}; return bxZone(c, { x, y, r, tel: o.tel === undefined ? .55 : o.tel, kind: 'dmg', dmg: Math.round(c.e.dmg * (o.dm || .75)), col: o.col || c.d.acc, flash: .3, onFire: z => { burst(x, y, 16, { col: [z.col, '#fff'], spd: 170, g: 120, life: .5, glow: true }); ringFx(x, y, r, z.col, .35, 3); sfx('boom', .3); }, buff: o.buff, bt: o.bt, bd: o.bd }); };

// ---------- movimento e golpes (geradores) ----------
function* bxHold(c, t, f) { while (t > 0) { if (f) f(); t -= c.dt; yield; } }
const bxSteer = (c, tx, ty, spd, k) => steerFly(c.e, tx, ty, (spd || c.e.spd) * c.sm, k || 2.2, c.dt);
function* bxDash(c, spd, dur, o) {   // arrancada em linha reta na direção do jogador (ou de um ponto)
  o = o || {}; const e = c.e, tx = o.tx !== undefined ? o.tx : c.px, ty = o.ty !== undefined ? o.ty : c.py, l = Math.hypot(tx - c.cx, ty - c.cy) || 1, ux = (tx - c.cx) / l, uy = (ty - c.cy) / l;
  yield* bxHold(c, dur, () => { e.vx = ux * spd * c.sm; if (!o.flat) e.vy = uy * spd * c.sm; if (o.fx) o.fx(); });
}
function bxTp(c, x, y) {   // teletransporte com fumaça
  const e = c.e; burst(ecx(e), ecy(e), 14, { col: [c.d.acc, '#ffffff'], spd: 120, life: .4, glow: true }); e.x = x - e.w / 2; e.y = y - e.h / 2; e.vx = e.vy = 0;
  if (!e.fly && !e.noclip) { const gy = groundY(x, y, 30); if (gy > 0) e.y = gy - e.h - 1; }
  burst(ecx(e), ecy(e), 14, { col: [c.d.acc, '#ffffff'], spd: 120, life: .4, glow: true }); sfx('portal', .4);
}
function bxMin(c, o) {   // lacaio genérico (aparência: 'orb' | 'crystal' | 'skull' | 'pylon' | 'mirror' | 'bat' | 'ghost' | 'bell')
  const owner = c.e, key = o.key || 'bx_min', s = spawnEnemy(key, o.x, o.y);
  s.owner = owner; s.bxm = true; s.bound = o.bound !== false; s.kind = 'bxm'; s.boss = false; s.onDie = o.onDie || null; s.decoy = !!o.decoy; s.coinBonus = -1;
  s.w = o.w || 14; s.h = o.h || 14; s.hpMax = s.hp = o.hp || 30; s.dmg = Math.round(owner.dmg * (o.dm === undefined ? .45 : o.dm)); s.def = o.def || 0; s.fly = o.fly === undefined ? 1 : o.fly ? 1 : 0; s.noclip = !!o.noclip; s.look = o.look || 'orb'; s.col = o.col || c.d.acc; s.col2 = o.col2 || '#fff';
  s.mf = o.mf || null; s.life = o.life; s.invulnerable = !!o.invuln; s.name = o.name || s.name; s.bxh = o.h2 || null; s.tag = o.tag; s.x -= s.w / 2; s.y -= s.h / 2;
  s.d = Object.assign({}, s.d, { drops: [], coins: [0, 0], col: s.col, col2: s.col2 }); if (o.set) o.set(s);
  return s;
}
function bxSpawn(c, key, x, y, o) {   // inimigo comum a serviço do chefe (sem loot; some junto com ele)
  o = o || {}; const s = spawnEnemy(key, x, y); s.owner = c.e; s.coinBonus = -1; if (o.hp) s.hpMax = s.hp = o.hp; if (o.dm !== undefined) s.dmg = Math.round(c.e.dmg * o.dm); s.d = Object.assign({}, s.d, { drops: [], coins: [0, 0] }); s.vx = o.vx || 0; s.vy = o.vy || 0; return s;
}
function bxBack(c, p, t0, sp) {   // projétil que volta para o chefe depois de t0 s (bumerangue)
  p.tiles = false; const e = c.e; p.onUpdate = (q, dt) => { if (q.age > t0) { const a = Math.atan2(ecy(e) - q.y, ecx(e) - q.x); q.vx += (Math.cos(a) * sp - q.vx) * Math.min(1, 4 * dt); q.vy += (Math.sin(a) * sp - q.vy) * Math.min(1, 4 * dt); if (Math.hypot(ecx(e) - q.x, ecy(e) - q.y) < 18 || e.dead) killProj(q, 'back'); } }; return p;
}
const bxMinCount = (c, tag) => G.enemies.reduce((n, x) => n + (x.owner === c.e && !x.dead && (!tag || x.tag === tag) ? 1 : 0), 0);
function bxMinionAI(e, dt, sm) {
  if (e.life !== undefined) { e.life -= dt; if (e.life <= 0) { e.dead = true; return; } }
  if (e.owner && e.owner.dead && e.bound) { e.dead = true; return; }
  if (!e.fly && !e.nograv) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  if (e.mf) e.mf(e, dt, sm);
}
enemy('bx_min', { n: 'Servo', kind: 'bxm', draw: 'bxm', w: 14, h: 14, hp: 30, dmg: 10, def: 0, spd: 90, kbr: 1, mass: 1, fly: 1, col: '#888', col2: '#fff', drops: [], coins: [0, 0], blood: '#fff' });

// ---------- movimentação padrão ----------
const LOCO = {
  orbit(c, e, o) { c.ang += c.dt * (o.w || .8) * (c.ph > 1 ? 1.2 : 1); steerFly(e, c.px + Math.cos(c.ang) * (o.r || 200), c.py + (o.h || -120) + Math.sin(c.ang * 1.4) * (o.v || 35), (o.spd || e.spd) * c.sm, o.k || 2.2, c.dt); },
  hover(c, e, o) { steerFly(e, c.px + (o.dx || 0) * (c.dx >= 0 ? -1 : 1) + Math.sin(c.t * .9) * (o.sx || 60), c.py + (o.h || -140) + Math.sin(c.t * 1.7) * (o.v || 18), (o.spd || e.spd) * c.sm, o.k || 2, c.dt); },
  chase(c, e, o) { steerFly(e, c.px, c.py + (o.h || 0), (o.spd || e.spd) * c.sm, o.k || 1.6, c.dt); },
  float(c, e, o) { steerFly(e, c.px + Math.cos(c.t * .5) * (o.r || 120), c.py + (o.h || -90) + Math.sin(c.t * .9) * 30, (o.spd || e.spd) * c.sm * .7, 1.2, c.dt); },
  still(c, e) { e.vx *= Math.pow(.02, c.dt); e.vy *= Math.pow(.02, c.dt); },
  walk(c, e, o) {
    const dir = Math.sign(c.dx) || 1, sp = (o.spd || 70) * c.sm * (c.ph > 1 ? 1.18 : 1); c.jt -= c.dt;
    if (Math.abs(c.dx) > (o.keep || 20)) e.vx = approach(e.vx, dir * sp, 1100 * c.dt); else e.vx *= Math.pow(.01, c.dt);
    if (e.onGround && c.jt <= 0 && (e.hitX || (c.dy < -70 && Math.abs(c.dx) < 140))) { e.vy = -(o.jump || 470) - (e.hitX && c.dy < -40 ? 60 : 0); c.jt = .55; }
  },
  hop(c, e, o) {
    c.jt -= c.dt; e.vx *= Math.pow(.02, c.dt);
    if (e.onGround && c.jt <= 0) { const dir = Math.sign(c.dx) || 1; e.vy = -(o.jump || 520); e.vx = dir * (o.spd || 150) * c.sm * (c.ph > 1 ? 1.2 : 1); c.jt = (o.gap || 1.1) * (c.ph > 1 ? .8 : 1); if (o.onHop) o.onHop(c, e); }
    if (e.onGround && !c.landed) { c.landed = true; if (o.onLand) o.onLand(c, e); } if (!e.onGround) c.landed = false;
  },
};
function bxLoco(c, e) { const L = c.d.loco; if (!L) return; if (typeof L === 'function') return L(c, e); const f = LOCO[L[0]]; if (f) f(c, e, L[1] || {}); }

// ---------- inicialização, fases e laço principal ----------
function bxInit(e) {
  const d = e.d.bx, c = { e, d, cd: d.cd0 || 1.4, g: null, wait: 0, ph: 1, i: 0, t: 0, free: false, nograv: false, S: {}, stat: {}, ang: rnd(TAU), jt: 0, far: 0, dt: .016, sm: 1, px: 0, py: 0, cx: 0, cy: 0, dx: 0, dy: 0, dist: 1, hp: 1, move: '' };
  e.ai.x = c; e.bxh = d; if (!e.fly) e.stepUp = true;
  const P = G.P; c.px = pcx(P); c.py = pcy(P); c.cx = ecx(e); c.cy = ecy(e);
  if (d.init) d.init(c, e);
  return c;
}
function bossXAI(e, dt, sm) {
  if (e.kind === 'bxm') return bxMinionAI(e, dt, sm);
  const d = e.d.bx, P = G.P, c = e.ai.x || bxInit(e), wd = G.world;
  c.dt = dt; c.sm = sm; c.t += dt; c.hp = e.hp / e.hpMax; c.px = pcx(P); c.py = pcy(P); c.cx = ecx(e); c.cy = ecy(e); c.dx = c.px - c.cx; c.dy = c.py - c.cy; c.dist = Math.hypot(c.dx, c.dy) || 1;
  if (P.dead) { e.fleeT = (e.fleeT || 0) + dt; e.vy -= 220 * dt; e.vx *= .98; e.invulnerable = false; if (e.fleeT > 3) { bxCleanup(e); e.dead = true; if (G.boss === e) G.boss = null; } return; }
  e.fleeT = 0;
  const ph = d.phase ? d.phase(c) : (c.hp < .34 ? 3 : c.hp < .67 ? 2 : 1);
  if (ph !== c.ph) { const up = ph > c.ph; c.ph = ph; if (up) { ringFx(c.cx, c.cy, 70, d.acc, .5, 3); shake(5); addText(c.cx, e.y - 14, d.n + ' enfurece!', d.acc, 13, 1.4); sfx('portal', .5); } if (d.onPhase) d.onPhase(c, e, ph); }
  if (!d.keepFace) e.face = c.dx >= 0 ? 1 : -1;
  if (!e.fly && !c.nograv) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL + 100);
  c.skipLoco = false; if (d.passive) d.passive(c, e);
  if (c.g && !c.free) { if (e.fly || e.noclip) { e.vx *= Math.pow(.03, dt); e.vy *= Math.pow(.03, dt); } else e.vx *= Math.pow(.004, dt); }
  if (c.g) {
    c.wait -= dt; let guard = 0;
    while (c.g && c.wait <= 0 && guard++ < 3) {
      let r; try { r = c.g.next(); } catch (err) { console.error(err); r = { done: true }; }
      if (r.done) { c.g = null; c.free = false; c.cd = bxCd(c); } else { c.wait = typeof r.value === 'number' ? r.value : 0; if (!c.wait) break; }
    }
  } else { c.cd -= dt; if (c.cd <= 0) bxPick(c, e); }
  if ((!c.g || c.free) && !c.skipLoco) bxLoco(c, e);
  // segurança: dentro do mundo; chefe de chão muito longe volta para perto do jogador
  e.x = clamp(e.x, 2, wd.w * TS - e.w - 2); if (e.y < -5 * TS) { e.y = -5 * TS; if (e.vy < 0) e.vy = 0; }
  if (!e.fly && !e.noclip && !d.still) { if (c.dist > 880) { c.far += dt; if (c.far > 3.5) { c.far = 0; const sx = c.px + (Math.random() < .5 ? -1 : 1) * 260, gy = groundY(sx, c.py - 40, 60); if (gy > 0) bxTp(c, sx, gy - e.h / 2 - 2); } } else c.far = 0; }
}
function bxPick(c, e) {
  const d = c.d; let name;
  if (c.force) { name = c.force; c.force = null; } else if (d.pick) name = d.pick(c); else { const kit = d.kit[Math.min(c.ph, d.kit.length) - 1]; name = kit[c.i++ % kit.length]; }
  const mv = d.moves[name]; if (!mv) { c.cd = 1; return; }
  c.move = name; c.stat[name] = (c.stat[name] || 0) + 1; c.free = false; c.wait = 0; c.g = mv(c, e);
}
const bxCd = c => { const a = c.d.cds || [1.3, 1.0, .8]; return a[Math.min(c.ph, a.length) - 1] * rnd(.85, 1.15); };

// ---------- loot, vitória, aparências de arte ----------
function bxLoot(e) {
  const d = e.d.bx, x = ecx(e), y = ecy(e), A = BX_ACTS[d.act];
  const rain = (id, n) => { for (let i = 0; i < n; i += Math.max(1, Math.ceil(n / 8))) dropItem(id, Math.min(Math.ceil(n / 8) || 1, n - i), x + rnd(-30, 30), y + rnd(-20, 10), rnd(-120, 120), rnd(-300, -150)); };
  rain('coin', rndi(d.coin[0], d.coin[1]));
  for (const [id, a, b] of A.mat) { const n = rndi(a, b); rain(id, n); }
  if (d.sword) dropItem(d.sword, 1, x, y);
  gearBossDrop(d, dropItem, x, y);   /* acessório exclusivo do chefe (11c_gear_x.js) */
  if (d.i % 3 === 0) dropItem('life_crystal', 1, x + 8, y);
  dropItem(A.pot, 2 + d.act, x - 10, y);
  if (d.loot) d.loot(e, rain);
}
function bxDefeated(e) {
  const d = e.d.bx; G.flags[d.id] = true; bxCleanup(e);
  toast(d.n + ' foi derrotado!' + (d.sword ? ' Espada: ' + (IT[d.sword] ? IT[d.sword].n : d.sword) + '.' : ''), d.acc, 6);
  if (d.death) d.death(e);
}
function bxDefeatedCount() { let n = 0; for (const d of BXLIST) if (G.flags && G.flags[d.id]) n++; return n; }
