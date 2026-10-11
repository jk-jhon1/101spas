/* ============================================================
   15g_touch: controles de toque (celular/tablet) no estilo do Terraria mobile.
   - direcional virtual à esquerda (anda; empurrar para cima = pular)
   - botão "+" de ação à direita: segurar ataca/minera; ARRASTAR mira (distância e ângulo)
   - botão de pulo, inventário, arsenal, mapa, cura rápida, zoom e pausa
   Liga sozinho em telas de toque; no menu de pausa dá para ligar/desligar à força.
   Nenhum código toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const TOUCH = { mode: 'auto', on: false, wasJoy: false, joy: { id: null, dx: 0, dy: 0, act: false }, atk: { id: null, vx: 0, vy: 0, act: false } };
function touchWanted() {
  if (TOUCH.mode === 'on') return true; if (TOUCH.mode === 'off') return false;
  try { return !!(matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches)); } catch (e) { return false; }
}
const touchLabel = () => 'Controles de toque: ' + ({ auto: 'automático', on: 'ligado', off: 'desligado' }[TOUCH.mode] || 'automático');
function quickHeal() {
  const P = G.P; if (!P || P.dead) return;
  for (let i = 0; i < INV_N; i++) { const s = P.inv[i]; if (s && IT[s.id].use === 'heal') { const old = P.sel; P.sel = i; useConsumable(P, s, IT[s.id]); P.sel = old; break; } }
}
// "Interagir": acha o baú, a porta ou o NPC mais perto do jogador e age como o botão direito do mouse
function touchInteract() {
  const P = G.P, wd = G.world; if (!P || P.dead || !wd) return;
  const px = pcx(P), py = pcy(P), tx0 = Math.floor(px / TS), ty0 = Math.floor(py / TS); let best = null, bd = 1e9;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 5; dx++) {
    const id = wd.get(tx0 + dx, ty0 + dy);
    if (id === T.chest || id === T.doorC || id === T.doorO) { const x = (tx0 + dx + .5) * TS, y = (ty0 + dy + .5) * TS, d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = [x, y]; } }
  }
  for (const n of G.npcs) { const x = n.x + n.w / 2, y = n.y + n.h / 2, d = Math.hypot(x - px, y - py); if (d < bd && d < 110) { bd = d; best = [x, y]; } }
  if (!best) { toast('Nada para usar por perto.', '#cbd5f5', 1.1); return; }
  G.mouse.wx = best[0]; G.mouse.wy = best[1]; interact(P);
}
function initTouch() {
  try { const m = localStorage.getItem('espadas120_touch'); if (m === 'on' || m === 'off' || m === 'auto') TOUCH.mode = m; } catch (e) { }
  const root = $('touch'); if (!root) return;
  const pt = $('p-touch'); if (pt) { pt.textContent = touchLabel(); pt.onclick = () => { TOUCH.mode = { auto: 'on', on: 'off', off: 'auto' }[TOUCH.mode]; try { localStorage.setItem('espadas120_touch', TOUCH.mode); } catch (e) { } pt.textContent = touchLabel(); touchUpdate(0); }; }
  // direcional
  const base = $('tj-base'), knob = $('tj-knob');
  const joyMove = e => { const r = base.getBoundingClientRect(), rad = r.width / 2; let dx = (e.clientX - (r.left + rad)) / rad, dy = (e.clientY - (r.top + rad)) / rad; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } TOUCH.joy.dx = dx; TOUCH.joy.dy = dy; knob.style.transform = 'translate(' + (dx * rad * .6) + 'px,' + (dy * rad * .6) + 'px)'; };
  const joyEnd = e => { if (e.pointerId !== TOUCH.joy.id) return; TOUCH.joy.id = null; TOUCH.joy.act = false; TOUCH.joy.dx = TOUCH.joy.dy = 0; knob.style.transform = ''; };
  base.addEventListener('pointerdown', e => { e.preventDefault(); try { base.setPointerCapture(e.pointerId); } catch (x) { } Snd.init(); TOUCH.joy.id = e.pointerId; TOUCH.joy.act = true; joyMove(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === TOUCH.joy.id) joyMove(e); });
  base.addEventListener('pointerup', joyEnd); base.addEventListener('pointercancel', joyEnd);
  // botão de ação (segurar = usar; arrastar = mirar)
  const atk = $('tb-atk');
  const atkMove = e => { const r = atk.getBoundingClientRect(); TOUCH.atk.vx = e.clientX - (r.left + r.width / 2); TOUCH.atk.vy = e.clientY - (r.top + r.height / 2); };
  const atkEnd = e => { if (e.pointerId !== TOUCH.atk.id) return; TOUCH.atk.id = null; TOUCH.atk.act = false; TOUCH.atk.vx = TOUCH.atk.vy = 0; G.mouse.down[0] = false; atk.classList.remove('on'); };
  atk.addEventListener('pointerdown', e => { e.preventDefault(); try { atk.setPointerCapture(e.pointerId); } catch (x) { } Snd.init(); TOUCH.atk.id = e.pointerId; TOUCH.atk.act = true; atkMove(e); atk.classList.add('on'); if (G.state === 'play' && !G.paused) { G.mouse.down[0] = true; G.mouse.pressed[0] = true; } });
  atk.addEventListener('pointermove', e => { if (e.pointerId === TOUCH.atk.id) atkMove(e); });
  atk.addEventListener('pointerup', atkEnd); atk.addEventListener('pointercancel', atkEnd);
  // pulo
  const jb = $('tb-jump');
  jb.addEventListener('pointerdown', e => { e.preventDefault(); try { jb.setPointerCapture(e.pointerId); } catch (x) { } Snd.init(); KEYS.Space = true; jb.classList.add('on'); });
  const jEnd = () => { KEYS.Space = false; jb.classList.remove('on'); }; jb.addEventListener('pointerup', jEnd); jb.addEventListener('pointercancel', jEnd);
  // botões pequenos
  const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); Snd.init(); if (G.state === 'play') fn(); }); };
  tap('tb-inv', () => { if (G.paused) return; if (G.ui.open === 'inv') closePanels(); else if (!G.P.dead) openPanel('inv'); });
  tap('tb-ars', () => { if (G.paused) return; if (G.ui.open === 'arsenal') closePanels(); else openPanel('arsenal'); });
  tap('tb-map', () => { if (G.paused) return; if (G.ui.open === 'map') closePanels(); else openPanel('map'); });
  tap('tb-heal', () => { if (!G.paused && !G.ui.open) quickHeal(); });
  tap('tb-zi', () => { G.zoomAdj += 1; applyZoom(); });
  tap('tb-zo', () => { G.zoomAdj -= 1; applyZoom(); });
  tap('tb-pause', () => setPause(!G.paused));
  tap('tb-use', () => { if (!G.paused && !G.ui.open) touchInteract(); });
  const cl = $('tb-close'); if (cl) cl.addEventListener('pointerdown', e => { e.preventDefault(); if (G.ui.open) closePanels(); });
  touchUpdate(0);
}
function touchUpdate(dt) {
  const root = $('touch'); if (!root) return;
  const want = touchWanted() && G.state === 'play';
  if (want !== TOUCH.on) { TOUCH.on = want; root.classList.toggle('hidden', !want); document.body.classList.toggle('touch-on', want); }
  if (!TOUCH.on) return;
  root.classList.toggle('ui-open', !!G.ui.open);   // painel aberto: esconde direcional/ação e mostra o botão de fechar
  const j = TOUCH.joy;
  if (j.act || TOUCH.wasJoy) { KEYS.KeyA = j.dx < -.3; KEYS.KeyD = j.dx > .3; KEYS.KeyW = j.dy < -.65; TOUCH.wasJoy = j.act; }
  if (TOUCH.atk.act && G.P && !G.paused) {
    const P = G.P, a = TOUCH.atk, len = Math.hypot(a.vx, a.vy); let dx, dy, dist;
    if (len < 12) { dx = P.face; dy = 0; dist = 72; } else { dx = a.vx / len; dy = a.vy / len; dist = 30 + clamp((len - 12) / 70, 0, 1) * 78; }
    const c = G.cam, wx = pcx(P) + dx * dist, wy = pcy(P) - 2 + dy * dist;
    G.mouse.sx = (wx - c.x) * c.zoom / DPR; G.mouse.sy = (wy - c.y) * c.zoom / DPR;
  }
}
