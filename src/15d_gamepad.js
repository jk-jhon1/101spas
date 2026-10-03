/* ============================================================
   15d_gamepad: suporte a controle (Gamepad API)
   GDD §2: o arco do golpe é orientado pelo "cursor do mouse/analógico".
   · Analógico direito = mira analógica. A inclinação define a distância do
     "cursor" ao jogador (ferramentas ficam limitadas ao alcance de mineração).
   · Sem mira: usa o analógico esquerdo (ao atacar) ou o lado para onde o jogador olha.
   · Menus: direcional/analógico + A. Painéis (inventário, catálogo, NPC): cursor
     virtual que reproduz os eventos de mouse da interface (hover, clique, botão direito).
   Fica totalmente inerte enquanto não houver controle conectado (ou se a API estiver bloqueada).
   Mapeamento "standard": 0 A · 1 B · 2 X · 3 Y · 4 LB · 5 RB · 6 LT · 7 RT · 8 Select · 9 Start · 10 L3 · 11 R3 · 12-15 direcional
   ============================================================ */
const PAD = {
  gp: null, prev: [], err: false, said: false, swallow: false, restore: false, holdAim: false,
  aim: { x: 1, y: 0, m: .5, t: 0, auto: true }, aimDrive: false, hold0: false,
  mx: 0, my: 0, cur: { x: 0, y: 0, el: null, init: false }, focusEl: null, ring: false, navT: 0, cursorEl: null,
};
const PAD_DZ = .24;
const padBtn = (gp, i) => { const b = gp.buttons[i]; return !!b && (b.pressed || b.value > .5); };

// zona morta radial: devolve direção unitária + intensidade 0..1
function padStick(x, y) {
  const m = Math.hypot(x, y); if (m < PAD_DZ) return { x: 0, y: 0, m: 0 };
  return { x: x / m, y: y / m, m: Math.min(1, (m - PAD_DZ) / (1 - PAD_DZ)) };
}
function padOff() { PAD.err = true; const h = $('pad-hint'); if (h) h.style.display = 'none'; return null; }   // API ausente/bloqueada: some a dica do título
function padGet() {
  if (PAD.err) return null;
  if (typeof navigator.getGamepads !== 'function') return padOff();
  let list; try { list = navigator.getGamepads(); } catch (e) { return padOff(); }   // bloqueado por política de permissões (iframe)
  if (!list) return null;
  for (let i = 0; i < list.length; i++) { const g = list[i]; if (g && g.connected) return g; }
  return null;
}
// reaproveita o tratamento de teclado (um único lugar com a lógica dos atalhos)
function padKey(code) { for (const type of ['keydown', 'keyup']) window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true })); }
function padRelease() { KEYS.PadLeft = KEYS.PadRight = KEYS.PadJump = false; if (PAD.hold0) { G.mouse.down[0] = false; PAD.hold0 = false; } }
function padHint(on) { const h = $('pad-hint'); if (h) h.textContent = on ? 'Controle conectado: ↑ ↓ escolher · A confirmar' : 'Aceita controle (gamepad): aperte um botão para ativar'; }
function padClearRing() { PAD.ring = false; document.querySelectorAll('.padfocus').forEach(b => b.classList.remove('padfocus')); }

// o mouse real volta a mandar assim que for movido
window.addEventListener('mousemove', e => {
  if (!e.isTrusted) return;
  if (Math.hypot(e.clientX - PAD.mx, e.clientY - PAD.my) < 3) return;
  PAD.mx = e.clientX; PAD.my = e.clientY; PAD.aimDrive = false; if (PAD.ring) padClearRing();
});

// ---------- cursor virtual (painéis) ----------
function padCursor(on) {
  let el = PAD.cursorEl;
  if (!el) { if (!on) return; el = PAD.cursorEl = document.createElement('div'); el.id = 'pad-cursor'; $('app').appendChild(el); }
  el.classList.toggle('on', !!on);
  if (!on && PAD.cur.el) { padHover(null, PAD.cur.x, PAD.cur.y); hideTip(); }
}
const padChain = e => { const a = []; for (; e && e !== document; e = e.parentElement) a.push(e); return a; };
function padHover(el, x, y) {
  const prev = PAD.cur.el, init = { bubbles: true, clientX: x, clientY: y, view: window };
  if (el !== prev) {
    const cn = padChain(el), cp = padChain(prev);
    if (prev) prev.dispatchEvent(new MouseEvent('mouseout', init));
    for (const e of cp) if (!cn.includes(e)) e.dispatchEvent(new MouseEvent('mouseleave', { ...init, bubbles: false }));
    PAD.cur.el = el;
    if (el) el.dispatchEvent(new MouseEvent('mouseover', init));
    for (let i = cn.length - 1; i >= 0; i--) if (!cp.includes(cn[i])) cn[i].dispatchEvent(new MouseEvent('mouseenter', { ...init, bubbles: false }));
  }
  if (el) el.dispatchEvent(new MouseEvent('mousemove', init));
}
function padClick(el, button, shift) {
  if (!el) return; const c = PAD.cur;
  const down = { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, button, buttons: button === 2 ? 2 : 1, shiftKey: !!shift, view: window }, up = { ...down, buttons: 0 };
  el.dispatchEvent(new MouseEvent('mousedown', down));
  el.dispatchEvent(new MouseEvent('mouseup', up));
  el.dispatchEvent(new MouseEvent(button === 0 ? 'click' : 'contextmenu', up));
}
function padScroll(el, dy) {
  for (let e = el; e && e !== document.body; e = e.parentElement)
    if (e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY)) { e.scrollTop += dy; return; }
}

// ---------- menus (título e pausa) ----------
function padMenu(hit, L, dt, act, root) {
  const all = [...root.querySelectorAll('.menu-btn')], btns = all.filter(b => !b.classList.contains('hidden'));
  if (!btns.length) return;
  if (!PAD.ring) { if (act) PAD.ring = true; else return; if (!PAD.focusEl || !btns.includes(PAD.focusEl)) PAD.focusEl = btns[0]; }   // 1º toque só mostra o foco
  else {
    let i = btns.indexOf(PAD.focusEl); if (i < 0) i = 0; let mv = 0; PAD.navT -= dt;
    if (hit(12)) mv = -1; else if (hit(13)) mv = 1;
    else if (Math.abs(L.y * L.m) > .55) { if (PAD.navT <= 0) { mv = L.y > 0 ? 1 : -1; PAD.navT = .24; } } else PAD.navT = 0;
    if (mv) { i = (i + mv + btns.length) % btns.length; sfx('tick'); }
    PAD.focusEl = btns[i];
    if (hit(0)) btns[i].click();
  }
  for (const b of all) b.classList.toggle('padfocus', b === PAD.focusEl);
}

// ---------- painéis (inventário, criação, catálogo, NPC, mapa) ----------
function padPanel(hit, L, R, dt, any) {
  padRelease(); if (any) PAD.swallow = true;
  if (hit(1) || hit(9)) { padKey('Escape'); return; }
  if (hit(3)) { padKey('KeyE'); return; }
  if (hit(12)) { padKey('KeyB'); return; }
  if (hit(13) || hit(8)) { padKey('KeyM'); return; }
  const map = G.ui.open === 'map'; padCursor(!map); if (map) return;
  const c = PAD.cur; if (!c.init) { c.x = innerWidth / 2; c.y = innerHeight / 2; c.init = true; }
  const sp = Math.pow(L.m, 1.4) * 1100 * dt;
  c.x = clamp(c.x + L.x * sp, 0, innerWidth - 2); c.y = clamp(c.y + L.y * sp, 0, innerHeight - 2);
  PAD.cursorEl.style.transform = 'translate(' + (c.x - 2).toFixed(1) + 'px,' + (c.y - 2).toFixed(1) + 'px)';
  const el = document.elementFromPoint(c.x, c.y); padHover(el, c.x, c.y);
  if (R.m > 0) padScroll(el, R.y * R.m * 1000 * dt);
  if (hit(0)) padClick(el, 0, false); else if (hit(2)) padClick(el, 2, false); else if (hit(5)) padClick(el, 0, true);
}

// ---------- interação automática (B): baú / porta / NPC mais próximo ----------
function padInteract() {
  const P = G.P, wd = G.world, cx = pcx(P), cy = pcy(P), tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS); let best = null, bd = 1e9;
  for (let y = ty0 - 5; y <= ty0 + 5; y++) for (let x = tx0 - 6; x <= tx0 + 6; x++) {
    const id = wd.get(x, y); if (id !== T.chest && id !== T.doorC && id !== T.doorO) continue;
    const px = x * TS + 8, py = y * TS + 8, d = Math.hypot(px - cx, py - cy);
    if (d < bd && inReach(P, x, y, 6.6 * TS)) { bd = d; best = { x: px, y: py }; }
  }
  for (const n of G.npcs) { const px = n.x + n.w / 2, py = n.y + n.h / 2, d = Math.hypot(px - cx, py - cy); if (d < bd && d < 100) { bd = d; best = { x: px, y: py }; } }
  if (best) { const c = G.cam; G.mouse.sx = (best.x - c.x) * c.zoom / DPR; G.mouse.sy = (best.y - c.y) * c.zoom / DPR; PAD.restore = !PAD.aimDrive; }
  G.mouse.pressed[2] = true;
}

// ---------- jogo ----------
function padPlay(gp, hit, dn, L, R, now) {
  const P = G.P; if (!P) return;
  padCursor(false);
  if (PAD.restore) { PAD.restore = false; if (!PAD.aimDrive) { G.mouse.sx = PAD.mx; G.mouse.sy = PAD.my; } }
  if (PAD.swallow) { if (gp.buttons.some((b, i) => padBtn(gp, i))) { padRelease(); return; } PAD.swallow = false; }   // espera soltar os botões após fechar menu/painel
  if (P.dead) { padRelease(); return; }
  // mover / pular
  const hx = L.x * L.m, dir = dn(15) ? 1 : dn(14) ? -1 : Math.abs(hx) > .3 ? Math.sign(hx) : 0;
  KEYS.PadRight = dir > 0; KEYS.PadLeft = dir < 0; KEYS.PadJump = dn(0);
  // atalhos
  if (hit(4)) { P.sel = (P.sel + 9) % 10; G.invChanged = true; sfx('tick'); }
  if (hit(5)) { P.sel = (P.sel + 1) % 10; G.invChanged = true; sfx('tick'); }
  if (hit(3)) padKey('KeyE');
  if (hit(12)) padKey('KeyB');
  if (hit(13) || hit(8)) padKey('KeyM');
  if (hit(6)) padKey('KeyQ');
  if (hit(10)) padKey('Minus');
  if (hit(11)) padKey('Equal');
  if (hit(9)) { PAD.ring = true; PAD.focusEl = null; padKey('Escape'); return; }   // pausa já mostra o foco no 1º botão
  // mira analógica
  const held = heldItem(), it = held && IT[held.id], tool = !!it && (it.type === 'pick' || it.type === 'block' || it.type === 'wall');
  const atk = dn(7) || dn(2);
  if (R.m > 0 || atk) PAD.aimDrive = true;
  if (PAD.aimDrive) {
    const A = PAD.aim;
    if (atk && !PAD.hold0) PAD.holdAim = !A.auto && now - A.t < 400;     // o golpe começou com o analógico direito em uso?
    if (!atk) PAD.holdAim = false;
    if (R.m > 0) PAD.aim = { x: R.x, y: R.y, m: R.m, t: now, auto: false };
    else if (!A.auto && (atk ? PAD.holdAim : now - A.t < 400)) { if (atk) A.t = now; }                              // soltou o analógico: mantém a mira (segurando RT: até soltar)
    else if (atk && L.m > .5) PAD.aim = { x: L.x, y: L.y, m: tool ? 0 : .5, t: now, auto: true };                    // ataca na direção do analógico esquerdo
    else PAD.aim = { x: P.face || 1, y: 0, m: tool ? 0 : .5, t: now, auto: true };                                   // senão, para onde o jogador olha
    const a = PAD.aim, dist = (tool ? 1 + 4.8 * a.m : 1.5 + 12 * a.m) * TS, c = G.cam;
    G.mouse.sx = (pcx(P) + a.x * dist - c.x) * c.zoom / DPR; G.mouse.sy = (pcy(P) + a.y * dist - c.y) * c.zoom / DPR;
  }
  // atacar / minerar / usar
  if (atk) { if (!PAD.hold0) G.mouse.pressed[0] = true; G.mouse.down[0] = true; } else if (PAD.hold0) G.mouse.down[0] = false;
  PAD.hold0 = atk;
  if (hit(1)) padInteract();
}

function padUpdate(dt) {
  const gp = padGet();
  if (!gp) { if (PAD.gp) { PAD.gp = null; padRelease(); padCursor(false); padClearRing(); PAD.aimDrive = false; padHint(false); } return; }
  if (!PAD.gp) { PAD.prev = []; padHint(true); }
  PAD.gp = gp;
  const now = performance.now(), dn = i => padBtn(gp, i), hit = i => dn(i) && !PAD.prev[i];
  const L = padStick(gp.axes[0] || 0, gp.axes[1] || 0), R = padStick(gp.axes[2] || 0, gp.axes[3] || 0);
  let any = false; for (let i = 0; i < gp.buttons.length; i++) if (hit(i)) { any = true; break; }
  const act = any || L.m > 0 || R.m > 0;
  if (any) { try { Snd.init(); } catch (e) { } }
  if (act && G.state === 'play' && !PAD.said) { PAD.said = true; toast('Controle detectado! Start pausa e abre o guia de botões.', '#93c5fd', 5); }
  if (PAD.ring && G.state === 'play' && !G.paused && !G.ui.open && $('help').classList.contains('hidden')) padClearRing();   // anel de foco só existe nos menus
  try {
    if (!$('help').classList.contains('hidden')) { padRelease(); if (any) PAD.swallow = true; if (hit(0) || hit(1) || hit(9)) showHelp(false); }
    else if (G.state === 'title') { padRelease(); padMenu(hit, L, dt, act, $('menu')); }
    else if (G.state !== 'play') padRelease();
    else if (G.paused) { padRelease(); if (any) PAD.swallow = true; padMenu(hit, L, dt, act, $('pause')); if (hit(1) || hit(9)) setPause(false); }
    else if (G.ui.open) padPanel(hit, L, R, dt, any);
    else padPlay(gp, hit, dn, L, R, now);
  } finally { PAD.prev = Array.from(gp.buttons, (b, i) => dn(i)); }
}

// mira visível quando o analógico está no comando
function drawPadReticle(g) {
  if (!PAD.gp || !PAD.aimDrive || G.paused || G.ui.blocking) return;
  const P = G.P; if (!P || P.dead) return; const c = G.cam;
  const x = G.mouse.sx * DPR, y = G.mouse.sy * DPR, px = (pcx(P) - c.x) * c.zoom, py = (pcy(P) - c.y) * c.zoom, r = Math.max(8, TILEPX * .55) , k = Math.max(1, DPR);
  g.save(); g.lineCap = 'round';
  g.setLineDash([3 * k, 7 * k]); g.lineWidth = 1.6 * k; g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
  const ring = () => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.moveTo(x - r * 1.6, y); g.lineTo(x - r * .55, y); g.moveTo(x + r * .55, y); g.lineTo(x + r * 1.6, y); g.moveTo(x, y - r * 1.6); g.lineTo(x, y - r * .55); g.moveTo(x, y + r * .55); g.lineTo(x, y + r * 1.6); g.stroke(); };
  g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 4.2 * k; ring(); g.strokeStyle = '#fde68a'; g.lineWidth = 2 * k; ring();
  g.restore();
}
