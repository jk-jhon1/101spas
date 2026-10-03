/* ============================================================
   16_main: inicialização, loop, renderização, input, câmera
   ============================================================ */
const view = $('view'), vctx = view.getContext('2d', { alpha: false });
const sceneC = document.createElement('canvas'), sctx = sceneC.getContext('2d');
const litC = document.createElement('canvas'), lctx = litC.getContext('2d');
const lightC = document.createElement('canvas'), lightCtx = lightC.getContext('2d');
let lightImg = null, DPR = 1, TILEPX = 24, frameN = 0, fpsAcc = 0, fpsN = 0, FPS = 60;
const DAY_LEN = 420;
G.mouse = { sx: 0, sy: 0, wx: 0, wy: 0, down: [false, false, false], pressed: [false, false, false] };
G.zoomAdj = 0;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2); const w = Math.max(320, Math.floor(innerWidth * DPR)), h = Math.max(240, Math.floor(innerHeight * DPR));
  view.width = w; view.height = h; sceneC.width = litC.width = w; sceneC.height = litC.height = h; applyZoom();
  const mb = $('menu-bg'); mb.width = Math.floor(innerWidth / 2); mb.height = Math.floor(innerHeight / 2);
}
function applyZoom() { TILEPX = Math.round(clamp(Math.round(view.height / 26) + G.zoomAdj, 14, 96)); G.cam.zoom = TILEPX / TS; G.cam.w = view.width; G.cam.h = view.height; }

// ---------- input ----------
const GAMEKEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) { if (e.code === 'Escape') e.target.blur(); return; }
  Snd.init();
  if (G.state === 'play' && GAMEKEYS.has(e.code)) e.preventDefault();
  if (KEYS[e.code] && e.repeat) return; KEYS[e.code] = true;
  if (G.state !== 'play') { if (e.code === 'Escape') showHelp(false); return; }
  if (e.code === 'Escape') { if (!$('help').classList.contains('hidden')) showHelp(false); else if (G.ui.open) closePanels(); else if (G.paused) setPause(false); else setPause(true); return; }
  if (G.paused) return;
  const P = G.P;
  if (e.code === 'KeyE' || e.code === 'Tab') { if (G.ui.open === 'inv') closePanels(); else if (!P.dead) openPanel('inv'); }
  else if (e.code === 'KeyB') { if (G.ui.open === 'arsenal') closePanels(); else openPanel('arsenal'); }
  else if (e.code === 'KeyM') { if (G.ui.open === 'map') closePanels(); else openPanel('map'); }
  else if (e.code === 'F3') { $('dbg').classList.toggle('hidden'); e.preventDefault(); }
  else if (e.code === 'KeyQ' && !P.dead) { for (let i = 0; i < INV_N; i++) { const s = P.inv[i]; if (s && IT[s.id].use === 'heal') { const old = P.sel; P.sel = i; useConsumable(P, s, IT[s.id]); P.sel = old; break; } } }
  else if (e.code === 'Equal' || e.code === 'NumpadAdd') { G.zoomAdj += 4; applyZoom(); }
  else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { G.zoomAdj -= 4; applyZoom(); }
  else if (/^Digit[0-9]$/.test(e.code) && !G.ui.open) { const n = +e.code.slice(5); P.sel = n === 0 ? 9 : n - 1; G.invChanged = true; }
});
window.addEventListener('keyup', e => { KEYS[e.code] = false; });
window.addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; G.mouse.down = [false, false, false]; if (G.state === 'play' && !G.paused && !G.ui.open) setPause(true); });
view.addEventListener('mousedown', e => { Snd.init(); view.focus(); e.preventDefault(); if (G.state !== 'play' || G.paused) return; G.mouse.down[e.button] = true; G.mouse.pressed[e.button] = true; });
window.addEventListener('mouseup', e => { G.mouse.down[e.button] = false; });
window.addEventListener('mousemove', e => { G.mouse.sx = e.clientX; G.mouse.sy = e.clientY; const c = $('cursor-item'); if (G.held) { c.style.left = (e.clientX - 22) + 'px'; c.style.top = (e.clientY - 22) + 'px'; } });
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('wheel', e => { if (G.state !== 'play' || G.paused || G.ui.open) return; const P = G.P; P.sel = (P.sel + (e.deltaY > 0 ? 1 : 9)) % 10; G.invChanged = true; e.preventDefault(); }, { passive: false });
window.addEventListener('resize', resize);
function setPause(p) { G.paused = p; $('pause').classList.toggle('hidden', !p); G.mouse.down = [false, false, false]; if (p) closePanels(true); setBlocking(); G.ui.blocking = G.ui.blocking || p; }

// ---------- geração assíncrona + início ----------
function resetGameState(mode) {
  G.mode = mode; G.enemies = []; G.projs = []; G.drops = []; G.parts = []; G.texts = []; G.boss = null; G.flags = { slime: false, eye: false, guardian: false, colossus: false }; G.stage = 0; G.time = .1; G.day = 1; G.t = 0;
  G.freeze = 0; G.dark = 0; G.flash = null; G.hitStop = 0; G.kills = 0; G.opts = { god: false, noSpawn: false, showDps: false, freeCraft: false }; G.dpsLog = []; G.held = null; G.chestSlots = null; G.chestPos = null; G.paused = false; G.zoomAdj = 0; G.npcs = []; G.rooms = []; G.npcScanT = 3; G.npcSpawnT = 8; G.autoSaveT = 150;
}
function startGame(opts) {
  opts = opts || {}; Snd.init();
  const seedStr = opts.seed !== undefined ? String(opts.seed) : ($('seed').value || '').trim(); const seed = seedStr ? (/^\d+$/.test(seedStr) ? +seedStr : strSeed(seedStr)) : ((Math.random() * 1e9) >>> 0);
  G.seed = seed; resetGameState(opts.mode || 'adventure');
  $('menu').classList.add('hidden'); $('loading').classList.remove('hidden'); $('hud').classList.add('hidden'); $('pause').classList.add('hidden'); G.state = 'loading';
  $('load-tip').textContent = pick(TIPS); $('load-fill').style.width = '0%';
  const wd = new World(WW, WH, seed); G.world = wd; const gen = genWorld(wd, seed);
  const finish = () => finishLoad();
  if (opts.sync) { for (const r of gen) { } finish(); return; }
  const pump = () => {
    const t0 = performance.now();
    while (performance.now() - t0 < 14) { const r = gen.next(); if (r.done) { finish(); return; } $('load-fill').style.width = (r.value[0] * 100) + '%'; $('load-msg').textContent = r.value[1]; }
    requestAnimationFrame(pump);
  };
  requestAnimationFrame(pump);
}
function finishLoad(sv) {
  const wd = G.world; wd.onBreak = onWorldBreak; wd.onReact = (x, y) => { sfx('splash', .5); burst(x * TS + 8, y * TS + 8, 8, { col: ['#aaa', '#fff'], spd: 60, g: -40, life: .7 }); };
  G.mapC = document.createElement('canvas'); G.mapC.width = wd.w; G.mapC.height = wd.h; G.mapCtx = G.mapC.getContext('2d'); G.mapPix = true; wd.onTile = (x, y) => { if (wd.rev[x + y * wd.w]) paintMapPixel(x, y); };
  const P = G.P = newPlayer(); P.x = wd.spawn.x; P.y = wd.spawn.y; initSky(G.seed);
  const give = (id, n) => invAdd(id, n || 1);
  if (sv) {
    G.time = sv.time; G.day = sv.day; G.t = sv.t || 0; G.stage = sv.stage; G.flags = sv.flags; G.kills = sv.kills || 0; Object.assign(G.opts, sv.opts || {});
    P.x = sv.P.x; P.y = sv.P.y; P.crystals = sv.P.crystals; P.inv = sv.P.inv; P.equip = sv.P.equip; P.sel = sv.P.sel || 0;
    for (const nd of sv.npcs || []) { const rm = { id: nd.home, cx: +nd.home.split(',')[0], cy: +nd.home.split(',')[1], minx: +nd.home.split(',')[0] - 3, maxx: +nd.home.split(',')[0] + 3 }; const n = spawnNpcQuiet(nd.type, rm); n.x = nd.x; n.y = nd.y; }
  } else if (G.mode === 'creative') { G.opts.god = false; give('pick_celestial'); give('s001'); give('s062'); give('s100'); give('s120'); give('s021'); give('s055'); give('torch', 99); give('potion3', 20); give('stone', 999); give('plank', 999); give('bench'); give('chest'); P.crystals = 15; }
  else { give('s001'); give('pick_copper'); give('torch', 12); give('potion1', 3); }
  G.invChanged = true; recalcStats(); P.hp = sv ? Math.min(sv.P.hp, P.maxHp) : P.maxHp; if (!sv) P.sel = 0;
  G.cam.init = false; for (let i = 0; i < 6; i++) { _revT.t = 0; revealMap(P); } wd.liqAct.clear();
  if (G.mode === 'creative' && !sv) { const d = ED.dummy; spawnEnemy('dummy', wd.spawn.x + 130, wd.spawn.y + 26 - d.h); G.opts.showDps = true; }
  G.state = 'play'; G.ui.blocking = false; applyZoom(); $('loading').classList.add('hidden'); $('hud').classList.remove('hidden'); initUIOnce();
  if (sv) toast('Jogo carregado. Bem-vindo de volta!', '#86efac', 4); else toast(G.mode === 'creative' ? 'Modo Criativo: B abre o Arsenal com todas as espadas. Há um Boneco de Treino ao lado.' : 'Bem-vindo! Corte árvores com a picareta (botão esquerdo) e pressione E para criar.', '#fde68a', 6);
  if (!sv) toast('Pressione E: inventário/criação · B: catálogo de espadas · M: mapa', '#cbd5f5', 6);
  view.focus();
}
let _uiInit = false; function initUIOnce() { if (!_uiInit) { _uiInit = true; } G.invChanged = true; refreshInvUI(); }

// ---------- atualização ----------
let _liqT = 0, _fallT = 0, _miniT = 0, _lastDusk = false;
function mouseWorld() { const c = G.cam, m = G.mouse; m.wx = c.x + m.sx * DPR / c.zoom; m.wy = c.y + m.sy * DPR / c.zoom; }
function step(dt) {
  const P = G.P, wd = G.world; mouseWorld();
  if (G.hitStop > 0) { G.hitStop -= dt; dt *= .12; }
  G.t += dt;
  G.time += dt / DAY_LEN; if (G.time >= 1) { G.time -= 1; G.day++; }
  const nowNight = isNightFrac(G.time); if (nowNight !== _lastDusk) { _lastDusk = nowNight; toast(nowNight ? 'A noite caiu... inimigos mais perigosos surgem.' : 'O sol nasceu.', nowNight ? '#a5b4fc' : '#fde68a', 3.5); }
  G.freeze = Math.max(0, G.freeze - dt); G.dark = Math.max(0, G.dark - dt); if (G.flash) { G.flash.t -= dt; if (G.flash.t <= 0) G.flash = null; }
  if (G.light.dyn.length > 4000) G.light.dyn.length = 0;
  updatePlayer(dt); updateNpcs(dt); updateEnemies(dt); updateProjs(dt); updateDrops(dt); updateParts(dt); updateTexts(dt);
  _liqT -= dt; if (_liqT <= 0) { _liqT = .05; wd.stepLiquids(2200); } _fallT -= dt; if (_fallT <= 0) { _fallT = .08; wd.stepFalling(160); }
  spawnTick(dt);
  G.autoSaveT -= dt; if (G.autoSaveT <= 0) { G.autoSaveT = 180; if (hasSave() || G.mode) saveGame(true); }
  // câmera
  const c = G.cam, vw = c.w / c.zoom, vh = c.h / c.zoom, m = G.mouse;
  const tx = pcx(P) - vw / 2 + (m.sx * DPR / c.zoom - vw / 2) * .1, ty = pcy(P) - vh / 2 - 8 + (m.sy * DPR / c.zoom - vh / 2) * .1;
  if (!c.init) { c.x = tx; c.y = ty; c.init = true; }
  const k = Math.min(1, 10 * dt); c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  c.x = clamp(c.x, 0, wd.w * TS - vw); c.y = clamp(c.y, -4 * TS, wd.h * TS - vh); c.shake *= Math.pow(.004, dt); if (c.shake < .1) c.shake = 0;
  mouseWorld();
}

// ---------- renderização ----------
function drawWorldTiles(g, tx0, ty0, tx1, ty1, torches) {
  const wd = G.world, t = wd.t, wl = wd.wl, W = wd.w, H = wd.h;
  for (let ty = ty0; ty <= ty1; ty++) {
    if (ty < 0 || ty >= H) continue;
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tx < 0 || tx >= W) continue;
      const i = tx + ty * W, id = t[i], w = wl[i], v = (tx * 7 + ty * 13) % 3;
      let mask = 15; if (id) mask = tileMask(wd, tx, ty, id);
      if (w && (!id || !SOLID[id] || mask !== 15)) { const s = getWallSprite(w, v); g.drawImage(s.c, s.x, s.y, 16, 16, tx * 16, ty * 16, 16, 16); }
      if (id) {
        const s = getTileSprite(id, mask, v); g.drawImage(s.c, s.x, s.y, 16, 16, tx * 16, ty * 16, 16, 16);
        if (id === T.torch || id === T.furnace || id === T.forge || id === T.lifecrystal) torches.push(tx, ty, id);
      }
    }
  }
}
function drawLiquids(g, tx0, ty0, tx1, ty1) {
  const wd = G.world, lq = wd.lq, lt = wd.lt, W = wd.w, H = wd.h, t = G.t;
  for (let ty = Math.max(0, ty0); ty <= Math.min(H - 1, ty1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(W - 1, tx1); tx++) {
    const i = tx + ty * W, q = lq[i]; if (!q) continue; const ty_ = lt[i], above = ty > 0 && lq[i - W] > 0 && lt[i - W] === ty_;
    const hgt = above || q > 250 ? 16 : Math.max(1, Math.round(q / 255 * 16)), y0 = ty * 16 + 16 - hgt, wave = above ? 0 : Math.sin((tx * 16 + t * 55) * .13) * .9;
    if (ty_ === LIQ_WATER) {
      g.fillStyle = 'rgba(40,104,226,.58)'; g.fillRect(tx * 16, y0 + wave, 16, hgt - wave);
      if (!above) { g.fillStyle = 'rgba(170,215,255,.75)'; g.fillRect(tx * 16, y0 + wave, 16, 1.4); }
      else if (((tx * 5 + ty * 3 + Math.floor(t * 2)) % 11) === 0) { g.fillStyle = 'rgba(190,225,255,.25)'; g.fillRect(tx * 16 + 3, ty * 16 + 5, 8, 1); }
    } else {
      g.fillStyle = 'rgba(255,92,20,.97)'; g.fillRect(tx * 16, y0 + wave * .6, 16, hgt);
      g.fillStyle = 'rgba(255,170,40,.9)'; const sh = Math.sin((tx * 16 + ty * 9) * .21 + t * 2) * .5 + .5; g.fillRect(tx * 16 + 2, y0 + 2 + sh * 5, 12, 3); g.fillStyle = 'rgba(255,225,110,.8)'; g.fillRect(tx * 16 + 5 + sh * 4, y0 + 3 + sh * 3, 3, 1.5);
      if (!above) { g.fillStyle = 'rgba(255,240,150,.95)'; g.fillRect(tx * 16, y0 + wave * .6, 16, 1.6); }
    }
  }
}
function drawMiningOverlay(g) {
  const P = G.P, m = G.mouse, tx = Math.floor(m.wx / TS), ty = Math.floor(m.wy / TS), s = heldItem(); if (!s || P.dead || G.ui.blocking) return;
  const it = IT[s.id]; if (it.type !== 'pick' && it.type !== 'block' && it.type !== 'wall') return;
  const reach = inReach(P, tx, ty, (it.type === 'pick' ? 6.2 : 6.4) * TS); const id = G.world.get(tx, ty);
  g.lineWidth = 1; g.strokeStyle = reach ? 'rgba(255,255,255,.75)' : 'rgba(255,80,80,.7)';
  if (it.type === 'pick') { if (id || G.world.wallAt(tx, ty)) g.strokeRect(tx * 16 + .5, ty * 16 + .5, 15, 15); }
  else { const ok = reach && (it.type === 'block' ? canPlaceTile(tx, ty, it.tile) : true); g.strokeStyle = ok ? 'rgba(120,255,140,.8)' : 'rgba(255,80,80,.6)'; g.fillStyle = ok ? 'rgba(120,255,140,.15)' : 'rgba(255,80,80,.12)'; g.fillRect(tx * 16, ty * 16, 16, 16); g.strokeRect(tx * 16 + .5, ty * 16 + .5, 15, 15); }
  if (P.mine.p > 0 && P.mine.x === tx && P.mine.y === ty && it.type === 'pick') { const cr = getCracks()[Math.min(3, Math.floor(P.mine.p * 4))]; g.drawImage(cr, tx * 16, ty * 16); }
}
function render() {
  frameN++;
  if (G.state === 'title') { renderMenuBg(); return; }
  if (!G.world || !G.P || G.state === 'loading') return;
  const w = view.width, h = view.height, c = G.cam, zoom = c.zoom, wd = G.world, P = G.P, T16 = TILEPX;
  const shx = c.shake ? (Math.random() - .5) * c.shake * 2 * DPR : 0, shy = c.shake ? (Math.random() - .5) * c.shake * 2 * DPR : 0;
  const ox = Math.round(c.x * zoom + shx), oy = Math.round(c.y * zoom + shy);
  const tx0 = Math.floor(ox / T16) - 1, ty0 = Math.floor(oy / T16) - 1, tx1 = Math.ceil((ox + w) / T16) + 1, ty1 = Math.ceil((oy + h) / T16) + 1;
  // 1) céu
  const px = Math.floor(pcx(P) / TS), nearSurface = c.y < (wd.surf[clamp(px, 0, wd.w - 1)] + 40) * TS;
  if (nearSurface) drawSky(vctx, w, h, c.x, c.y, zoom, G.time, wd.biomeName(px), G.t); else { vctx.fillStyle = '#05060a'; vctx.fillRect(0, 0, w, h); }
  // 2) cena
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, w, h); sctx.setTransform(zoom, 0, 0, zoom, -ox, -oy); sctx.imageSmoothingEnabled = false;
  const torches = []; drawWorldTiles(sctx, tx0, ty0, tx1, ty1, torches);
  const inView = (x, y, r) => x > ox / zoom - r && x < (ox + w) / zoom + r && y > oy / zoom - r && y < (oy + h) / zoom + r;
  drawDrops(sctx); drawNpcs(sctx);
  for (const e of G.enemies) if (!e.dead && inView(ecx(e), ecy(e), 120)) drawEnemy(sctx, e);
  for (const inst of P.cb.inst) if (inst.ghost) drawGhostSwing(sctx, P, inst);
  if (!P.dead) drawPlayer(sctx, P);
  for (const p of G.projs) if (!p.dead && inView(p.x, p.y, 80)) drawProj(sctx, p, false);
  drawParts(sctx, false); drawLiquids(sctx, tx0, ty0, tx1, ty1); drawMiningOverlay(sctx);
  // 3) iluminação (multiplicativa, preservando alpha da cena)
  const sky = skyLight(G.time), lx0 = tx0 - 11, ly0 = ty0 - 11, lw = tx1 - tx0 + 24, lh = ty1 - ty0 + 24;
  for (const e of G.enemies) { /* luz dos inimigos já adicionada na atualização */ }
  G.light.compute(wd, lx0, ly0, lw, lh, sky);
  if (lightC.width !== lw || lightC.height !== lh) { lightC.width = lw; lightC.height = lh; lightImg = lightCtx.createImageData(lw, lh); }
  G.light.toImage(lightImg, [.03, .03, .04]); lightCtx.putImageData(lightImg, 0, 0);
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'copy'; lctx.drawImage(sceneC, 0, 0);
  lctx.globalCompositeOperation = 'multiply'; lctx.imageSmoothingEnabled = true; lctx.drawImage(lightC, 0, 0, lw, lh, lx0 * T16 - ox, ly0 * T16 - oy, lw * T16, lh * T16);
  lctx.globalCompositeOperation = 'destination-in'; lctx.drawImage(sceneC, 0, 0); lctx.globalCompositeOperation = 'source-over';
  vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.drawImage(litC, 0, 0);
  // 4) brilhos aditivos
  vctx.setTransform(zoom, 0, 0, zoom, -ox, -oy); vctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < torches.length; i += 3) { const id = torches[i + 2], fl = .75 + .25 * Math.sin(G.t * 11 + torches[i] * 3.1); if (id === T.torch) drawGlow(vctx, torches[i] * 16 + 8, torches[i + 1] * 16 + 6, 26 * fl, '#ffb347', .45 * fl); else if (id === T.lifecrystal) drawGlow(vctx, torches[i] * 16 + 8, torches[i + 1] * 16 + 8, 24, '#ff4f8a', .35 + .15 * Math.sin(G.t * 3)); else drawGlow(vctx, torches[i] * 16 + 8, torches[i + 1] * 16 + 8, 22, '#ff8a2a', .28 * fl); }
  for (const e of G.enemies) if (!e.dead && inView(ecx(e), ecy(e), 120)) drawEnemyGlow(vctx, e);
  for (const p of G.projs) if (!p.dead && inView(p.x, p.y, 120)) drawProj(vctx, p, true);
  drawSwingTrail(vctx, P); drawParts(vctx, true);
  if (P.cb.sw && P.cb.sw.look.glow && (P.cb.swingT > 0 || P.cb.sw.tierLevel >= 4)) { const sw = P.cb.sw; drawGlow(vctx, pcx(P) + P.face * 10, P.y + 8, 22 + sw.tierLevel * 3, sw.look.glow, .22 + (P.cb.swingT > 0 ? .25 : 0)); }
  vctx.globalCompositeOperation = 'source-over';
  // 5) textos e sobreposições
  vctx.textAlign = 'center'; vctx.lineJoin = 'round';
  for (const t of G.texts) { const k = clamp(t.life / t.max, 0, 1); vctx.globalAlpha = Math.min(1, k * 2); vctx.font = '800 ' + t.size + 'px "Trebuchet MS",sans-serif'; vctx.lineWidth = 3; vctx.strokeStyle = 'rgba(0,0,0,.85)'; vctx.strokeText(t.txt, t.x, t.y); vctx.fillStyle = t.col; vctx.fillText(t.txt, t.x, t.y); } vctx.globalAlpha = 1;
  vctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.dark > 0) { vctx.fillStyle = 'rgba(0,0,10,' + (.55 * Math.min(1, G.dark * 2)) + ')'; vctx.fillRect(0, 0, w, h); }
  if (G.freeze > 0) { vctx.fillStyle = 'rgba(255,225,140,' + (.12 + .05 * Math.sin(G.t * 20)) + ')'; vctx.fillRect(0, 0, w, h); const gr = vctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .9); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,40,0,.55)'); vctx.fillStyle = gr; vctx.fillRect(0, 0, w, h); }
  if (G.flash) { vctx.fillStyle = G.flash.col; vctx.globalAlpha = G.flash.a * clamp(G.flash.t / G.flash.max, 0, 1); vctx.fillRect(0, 0, w, h); vctx.globalAlpha = 1; }
  if (P.inLava || (P.inv_ > .3 && !P.dead)) { const a = P.inLava ? .22 : .18 * clamp((P.inv_ - .3) * 2, 0, 1); vctx.fillStyle = P.inLava ? 'rgba(255,90,20,' + a + ')' : 'rgba(255,0,0,' + a + ')'; vctx.fillRect(0, 0, w, h); }
  else if (P.inWater) { vctx.fillStyle = 'rgba(30,80,200,.16)'; vctx.fillRect(0, 0, w, h); }
  drawPadReticle(vctx);
}
// menu animado
const _menuSwords = [];
function renderMenuBg() {
  const mb = $('menu-bg'), g = mb.getContext('2d'), w = mb.width, h = mb.height, t = performance.now() / 1000;
  if (!SKY.clouds) initSky(7); const frac = .18 + Math.sin(t * .05) * .02;
  drawSky(g, w, h, t * 30, 1850 + 40, .8, frac, 'forest', t);
  if (!_menuSwords.length) for (let i = 0; i < 26; i++) _menuSwords.push({ id: SWORDS[(i * 5 + 3) % 120].id, x: Math.random(), y: Math.random(), s: .3 + Math.random() * .7, a: Math.random() * TAU, v: (Math.random() - .5) * .6, sp: .01 + Math.random() * .02 });
  g.imageSmoothingEnabled = false;
  for (const s of _menuSwords) { s.x += s.sp * .016; if (s.x > 1.1) s.x = -.1; const c = iconCanvas(s.id); g.save(); g.globalAlpha = .35 + .35 * s.s; g.translate(s.x * w, (s.y * .8 + .1) * h + Math.sin(t * s.s + s.a) * 8); g.rotate(s.a + t * s.v); const sz = 26 + s.s * 34; g.drawImage(c, -sz / 2, -sz / 2, sz, sz); g.restore(); }
  g.fillStyle = 'rgba(8,14,10,.9)'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * .86 - Math.sin(x * .012 + 1) * 18 - Math.sin(x * .031) * 8); g.lineTo(w, h); g.closePath(); g.fill();
}

// ---------- loop ----------
let _last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (now - _last) / 1000); _last = now; fpsAcc += dt; fpsN++; if (fpsAcc >= .5) { FPS = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  try { padUpdate(dt); } catch (err) { PAD.err = true; console.error(err); }   // controle (inerte sem gamepad)
  try {
    if (G.state === 'play' && !G.paused) {
      step(dt); refreshHUD(); _miniT -= dt; if (_miniT <= 0) { _miniT = .12; drawMinimap(); }
      if (!$('dbg').classList.contains('hidden')) { const P = G.P; $('dbg').textContent = `FPS ${FPS}  tile ${Math.floor(pcx(P) / TS)},${Math.floor(pcy(P) / TS)}  inimigos ${G.enemies.length} proj ${G.projs.length} part ${G.parts.length}\nzoom ${TILEPX}px  estágio ${G.stage}  luz ${G.light.w}x${G.light.h}  liq ${G.world.liqAct.size}`; }
    }
    render();
  } catch (err) { console.error(err); window.__lastErr = String(err && err.stack || err); if (!window.__errShown) { window.__errShown = true; toast('Erro: ' + err.message, '#f87171', 8); } }
  G.mouse.pressed = [false, false, false];
}
function initGame() {
  initUI(); resize(); G.state = 'title'; initSky(11);
  $('btn-adv').onclick = () => startGame({ mode: 'adventure' }); $('btn-cre').onclick = () => startGame({ mode: 'creative' }); $('btn-help').onclick = () => showHelp(true); $('btn-load').onclick = () => loadGame(); $('btn-load').classList.toggle('hidden', !hasSave());
  $('p-resume').onclick = () => setPause(false); $('p-help').onclick = () => showHelp(true);
  $('p-sound').onclick = () => { Snd.mute(!Snd.muted); $('p-sound').textContent = 'Som: ' + (Snd.muted ? 'desligado' : 'ligado'); };
  $('p-save').onclick = () => { saveGame(); };
  $('p-menu').onclick = () => { saveGame(true); setPause(false); closePanels(true); G.state = 'title'; $('hud').classList.add('hidden'); $('menu').classList.remove('hidden'); G.world = null; G.P = null; $('btn-load').classList.toggle('hidden', !hasSave()); };
  requestAnimationFrame(frame);
}
initGame();
// ganchos para testes automatizados
window.__G = G; window.__start = startGame; window.__step = step; window.__render = render; window.__IT = IT; window.__SW = SWORDS; window.__padUpdate = padUpdate; window.__PAD = PAD;
