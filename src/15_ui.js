/* ============================================================
   15_ui: interface DOM (HUD, hotbar, inventário, crafting,
   arsenal, tooltips, mapa, menus)
   ============================================================ */
const $ = id => document.getElementById(id);
G.ui = { open: null, blocking: false, tab: 'avail', search: '', arsTab: 'T1', arsSel: null, craftDirty: true, enemyElem: '' };
G.held = null; G.chestSlots = null; G.chestPos = null;

// ---- ícones como classes CSS (data URL registrada 1x) ----
let _iconSheet = null; const _iconCls = {};
function iconClass(id) {
  if (_iconCls[id]) return _iconCls[id];
  if (!_iconSheet) { const s = document.createElement('style'); document.head.appendChild(s); _iconSheet = s.sheet; }
  const cls = 'ic-' + id; try { _iconSheet.insertRule('.' + cls + '{background-image:url("' + iconURL(id) + '")}', _iconSheet.cssRules.length); } catch (e) { }
  return _iconCls[id] = cls;
}
const tierCol = id => TIERS[IT[id].tier || 0].col;
function toast(msg, col, secs) {
  const box = $('toasts'); if (!box) return; const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; d.style.color = col || '#fff'; d.style.setProperty('--d', (secs || 3.2) + 's');
  box.appendChild(d); while (box.children.length > 5) box.removeChild(box.firstChild); setTimeout(() => d.remove(), ((secs || 3.2) + .7) * 1000);
}
// ---------- slots ----------
function mkSlot(src, i, key, hot) {
  const el = document.createElement('div'); el.className = 'slot empty'; el.dataset.src = src; el.dataset.i = i;
  el.innerHTML = '<i class="ic"></i><span class="cnt"></span>' + (key !== undefined ? '<span class="key">' + key + '</span>' : '');
  el.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); if (hot && G.ui.open !== 'inv') { G.P.sel = i; G.invChanged = true; sfx('tick'); return; } slotClick(ev, src, i); });
  el.addEventListener('mouseenter', ev => { const s = slotGet(src, i); if (s) showTip(tipHTML(s.id), ev); else hideTip(); });
  el.addEventListener('mousemove', moveTip); el.addEventListener('mouseleave', hideTip); el.addEventListener('contextmenu', ev => ev.preventDefault());
  return el;
}
function paintSlot(el, s, sel) {
  const ic = el.firstChild, cnt = el.querySelector('.cnt');
  el.className = 'slot' + (s ? ' t' + (IT[s.id].tier || 0) : ' empty') + (sel ? ' sel' : '') + (el.dataset.src === 'armor' || el.dataset.src === 'acc' ? ' eq' : '') + (el.dataset.src === 'trash' ? ' trash' : '');
  if (!s) { cnt.textContent = ''; ic.className = 'ic'; return; }
  if (el._id !== s.id) { ic.className = 'ic ' + iconClass(s.id); el._id = s.id; } cnt.textContent = s.n > 1 ? (s.n > 9999 ? fmt(s.n) : s.n) : '';
}
function slotGet(src, i) { const P = G.P; if (src === 'inv') return P.inv[i]; if (src === 'armor') return P.equip.armor; if (src === 'acc') return P.equip.acc[i]; if (src === 'chest') return G.chestSlots ? G.chestSlots[i] : null; return null; }
function slotSet(src, i, v) { const P = G.P; if (src === 'inv') P.inv[i] = v; else if (src === 'armor') P.equip.armor = v; else if (src === 'acc') P.equip.acc[i] = v; else if (src === 'chest' && G.chestSlots) G.chestSlots[i] = v; }
function slotAccepts(src, s) { if (!s) return true; const t = IT[s.id].type; if (src === 'armor') return t === 'armor'; if (src === 'acc') return t === 'acc'; return true; }
function afterInvChange() { recalcStats(); invDirty(); G.ui.craftDirty = true; refreshInvUI(); updateCursorItem(); }
function slotClick(ev, src, i) {
  Snd.init();
  if (src === 'trash') { if (G.held) { G.held = null; sfx('break', .4); afterInvChange(); } return; }
  const cur = slotGet(src, i), right = ev.button === 2;
  if (ev.shiftKey && cur && !G.held) { quickMove(src, i); return; }
  if (!G.held) {
    if (!cur) return;
    if (right && cur.n > 1 && stackMax(cur.id) > 1) { const h = Math.ceil(cur.n / 2); G.held = { id: cur.id, n: h }; cur.n -= h; }
    else { G.held = cur; slotSet(src, i, null); }
    sfx('tick');
  } else {
    const held = G.held; if (!slotAccepts(src, held)) return;
    if (!cur) { if (right && held.n > 1) { slotSet(src, i, { id: held.id, n: 1 }); held.n--; } else { slotSet(src, i, held); G.held = null; } }
    else if (cur.id === held.id && stackMax(cur.id) > 1) { const room = stackMax(cur.id) - cur.n, k = right ? Math.min(1, room) : Math.min(room, held.n); cur.n += k; held.n -= k; if (held.n <= 0) G.held = null; }
    else { if (!slotAccepts(src, held)) return; slotSet(src, i, held); G.held = cur; }
    sfx('tick');
  }
  afterInvChange();
}
function addToSlots(arr, from, to, id, n) {
  const sm = stackMax(id);
  for (let i = from; i < to && n > 0; i++) { const s = arr[i]; if (s && s.id === id && s.n < sm) { const k = Math.min(n, sm - s.n); s.n += k; n -= k; } }
  for (let i = from; i < to && n > 0; i++) { if (!arr[i]) { const k = Math.min(n, sm); arr[i] = { id, n: k }; n -= k; } }
  return n;
}
function quickMove(src, i) {
  const P = G.P, s = slotGet(src, i); if (!s) return; const t = IT[s.id].type;
  if (src === 'chest') { const left = addToSlots(P.inv, 0, INV_N, s.id, s.n); if (left < s.n) { s.n = left; if (left <= 0) slotSet(src, i, null); } }
  else if (src === 'inv' && G.chestSlots && G.ui.open === 'inv') { const left = addToSlots(G.chestSlots, 0, G.chestSlots.length, s.id, s.n); s.n = left; if (left <= 0) P.inv[i] = null; }
  else if (src === 'inv' && (t === 'armor' || t === 'acc')) equipFromInv(i);
  else if (src === 'armor' || src === 'acc') { const left = addToSlots(P.inv, 0, INV_N, s.id, 1); if (!left) slotSet(src, i, null); }
  else if (src === 'inv') { const to = i < 10 ? [10, INV_N] : [0, 10]; const left = addToSlots(P.inv, to[0], to[1], s.id, s.n); s.n = left; if (left <= 0) P.inv[i] = null; }
  sfx('tick'); afterInvChange();
}
// ---------- tooltips ----------
const TYPE_PT = { sword: 'Espada', pick: 'Picareta', block: 'Bloco', wall: 'Parede', mat: 'Material', use: 'Consumível', armor: 'Armadura', acc: 'Acessório' };
function recipeText(id) {
  const rs = RECIPES.filter(r => r.out === id); if (!rs.length) return '';
  return rs.map(r => 'Receita' + (r.n > 1 ? ' (x' + r.n + ')' : '') + ': ' + Object.entries(r.ing).map(([k, v]) => `<span style="color:${invCount(k) >= v ? '#9fe5b5' : '#f4a0a0'}">${v}× ${IT[k].n}</span>`).join(', ') + (r.st ? ' · <b style="color:#fbbf24">' + STATION_NAME[r.st] + '</b>' : '')).join('<br>');
}
function tipHTML(id, o) {
  const it = IT[id]; if (!it) return ''; const T_ = TIERS[it.tier || 0]; let h = `<div class="tn" style="color:${T_.col}">${escHtml(it.n)}</div>`;
  if (it.type === 'sword') {
    const sw = it.sw, dps = (sw.baseDamage * sw.attackSpeed).toFixed(0), cc = Math.round(sw.critChance * 100), P = G.P;
    h += `<div class="ts">${TYPE_PT.sword} · ${T_.n} · #${String(sw.num).padStart(3, '0')}</div><div class="st2"><span>Dano</span><b>${sw.baseDamage}${P && P.stats.dmg ? ' <span style="color:#86efac">(+' + P.stats.dmg + ')</span>' : ''}</b><span>Velocidade</span><b>${sw.attackSpeed} golpes/s</b><span>Repulsão</span><b>${sw.knockbackForce}</b><span>Crítico</span><b>${cc}%</b><span>DPS base</span><b>≈ ${dps}</b><span>Ataque</span><b>${{ ArcSwing: 'Arco', Thrust: 'Estocada', Beam: 'Feixe', Orbital: 'Orbital' }[sw.attackType]}</b></div><div class="mech">${escHtml(sw.txt)}</div>`;
    h += `<span class="tag ${sw.src === 'pdf' ? 'pdf' : ''}">${sw.src === 'pdf' ? 'Do GDD (PDF)' : '★ Criada para completar o GDD (PDF truncado)'}</span>`;
    if (!(o && o.noRecipe)) { const rt = recipeText(id); if (rt) h += `<div class="rcp">${rt}</div>`; }
  } else {
    h += `<div class="ts">${TYPE_PT[it.type] || ''}${it.tier ? ' · ' + T_.n : ''}</div>`;
    if (it.type === 'pick') h += `<div class="st2"><span>Poder</span><b>${it.pow}</b><span>Velocidade</span><b>${it.spd.toFixed(2)}x</b></div>`;
    if (it.type === 'armor') h += `<div class="st2"><span>Defesa</span><b>+${it.def}</b></div>`;
    if (it.desc) h += `<div class="mech">${escHtml(it.desc)}</div>`;
    if (!(o && o.noRecipe)) { const rt = recipeText(id); if (rt) h += `<div class="rcp">${rt}</div>`; }
  }
  if (o && o.extra) h += o.extra;
  return h;
}
function showTip(html, ev) { const t = $('tooltip'); t.innerHTML = html; t.classList.remove('hidden'); moveTip(ev); }
function hideTip() { $('tooltip').classList.add('hidden'); }
function moveTip(ev) { const t = $('tooltip'); if (t.classList.contains('hidden')) return; const w = t.offsetWidth, h = t.offsetHeight; let x = ev.clientX + 16, y = ev.clientY + 14; if (x + w > innerWidth - 6) x = ev.clientX - w - 14; if (y + h > innerHeight - 6) y = innerHeight - h - 6; t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px'; }
function updateCursorItem() {
  const c = $('cursor-item'); if (!G.held) { c.classList.add('hidden'); return; }
  c.classList.remove('hidden'); c.innerHTML = `<i class="ic ${iconClass(G.held.id)}"></i><span class="cnt">${G.held.n > 1 ? G.held.n : ''}</span>`;
}
// ---------- HUD / hotbar / inventário ----------
let hotEls = [], invEls = [], eqEls = [], chestEls = [];
function buildSlotsUI() {
  const hb = $('hotbar'); hb.innerHTML = ''; hotEls = [];
  for (let i = 0; i < 10; i++) { const el = mkSlot('inv', i, (i + 1) % 10, true); hb.appendChild(el); hotEls.push(el); }
  const gr = $('inv-grid'); gr.innerHTML = ''; invEls = [];
  for (let i = 0; i < INV_N; i++) { const el = mkSlot('inv', i); gr.appendChild(el); invEls.push(el); }
  const eq = $('equip-row'); eq.innerHTML = '<span class="lbl">Equipamento:</span>'; eqEls = [];
  const a = mkSlot('armor', 0); eq.appendChild(a); eqEls.push(['armor', 0, a]); for (let i = 0; i < 3; i++) { const e = mkSlot('acc', i); eq.appendChild(e); eqEls.push(['acc', i, e]); }
  const tr = mkSlot('trash', 0); eq.appendChild(tr); const tl = document.createElement('span'); tl.className = 'lbl'; tl.textContent = '← lixeira'; eq.appendChild(tl);
  tr.addEventListener('mouseenter', ev => showTip('<div class="tn">Lixeira</div><div class="mech">Solte aqui o item que está no cursor para destruí-lo.</div>', ev));
  const cg = $('chest-grid'); cg.innerHTML = ''; chestEls = []; for (let i = 0; i < 20; i++) { const el = mkSlot('chest', i); cg.appendChild(el); chestEls.push(el); }
}
function refreshInvUI() {
  const P = G.P; if (!P) return;
  for (let i = 0; i < 10; i++) paintSlot(hotEls[i], P.inv[i], i === P.sel);
  if (G.ui.open === 'inv') {
    for (let i = 0; i < INV_N; i++) paintSlot(invEls[i], P.inv[i], i === P.sel && i < 10);
    for (const [src, i, el] of eqEls) paintSlot(el, slotGet(src, i));
    const ch = G.chestSlots; $('chest-wrap').style.display = ch ? 'block' : 'none'; if (ch) for (let i = 0; i < 20; i++) paintSlot(chestEls[i], ch[i]);
    $('coins').textContent = '● ' + invCount('coin') + ' moedas';
    if (G.ui.craftDirty) { renderCrafting(); G.ui.craftDirty = false; }
  }
}
function refreshHUD() {
  const P = G.P; if (!P) return;
  if (G.invChanged) { G.invChanged = false; refreshInvUI(); }
  const hp = Math.max(0, Math.ceil(P.hp)), f = clamp(P.hp / P.maxHp, 0, 1); $('hp-fill').style.width = (f * 100) + '%'; $('hp-txt').textContent = hp + ' / ' + P.maxHp;
  const sh = P.buffs.shield; $('hp-shield').style.width = sh ? Math.min(100, sh.hp / P.maxHp * 100) + '%' : '0';
  const sw = heldSword(), st = P.stats;
  $('stat-row').innerHTML = `<span>Defesa <b>${st.def}</b></span><span>Dano+ <b>${st.dmg}</b></span><span>Crít <b>${Math.round((st.crit + (sw ? sw.critChance : 0)) * 100)}%</b></span><span>Moedas <b>${invCount('coin')}</b></span>`;
  let bf = ''; const NM = { regen: 'Regeneração', speed: 'Velocidade', shield: 'Escudo', invuln: 'Invulnerável', invis: 'Invisível', haste: 'Rapidez' };
  for (const k in P.buffs) bf += `<span class="buff">${NM[k] || k} ${Math.ceil(P.buffs[k].t)}s</span>`; if (P.potionCd > 0) bf += `<span class="buff">Poção ${Math.ceil(P.potionCd)}s</span>`;
  if (bf !== G._bf) { $('buffs').innerHTML = bf; G._bf = bf; }
  const hh = ((G.time * 24 + 6) % 24), hr = Math.floor(hh), mn = Math.floor((hh - hr) * 60);
  $('clock').textContent = 'Dia ' + G.day + ' · ' + String(hr).padStart(2, '0') + ':' + String(mn).padStart(2, '0') + ' · ' + layerName(P) + (G.mode === 'creative' ? ' · Criativo' : '') + (G.stage >= 2 ? ' · Hardmode' : '');
  const b = G.boss; $('bossbar').classList.toggle('hidden', !b || b.dead); if (b && !b.dead) { $('boss-name').textContent = b.name; $('boss-fill').style.width = (clamp(b.hp / b.hpMax, 0, 1) * 100) + '%'; }
  const itn = $('item-name'); const s = P.inv[P.sel]; const nm = s ? IT[s.id].n : ''; if (nm !== G._itn) { G._itn = nm; itn.textContent = nm; itn.style.color = s ? tierCol(s.id) : '#fff'; itn.style.opacity = nm ? 1 : 0; clearTimeout(G._itT); G._itT = setTimeout(() => itn.style.opacity = 0, 1800); }
  $('dead' + 'msg').classList.toggle('hidden', !P.dead); if (P.dead) $('dead-sub').textContent = 'Renascendo em ' + Math.max(0, Math.ceil(P.respawnT)) + 's...';
  const dps = $('dps'); const show = G.opts.showDps || G.enemies.some(e => e.isDummy); dps.classList.toggle('hidden', !show);
  if (show) { const now = G.t; G.dpsLog = G.dpsLog.filter(x => now - x[0] < 5); let tot = 0; for (const x of G.dpsLog) tot += x[1]; const win = Math.min(5, Math.max(1, G.dpsLog.length ? now - G.dpsLog[0][0] : 1)); dps.innerHTML = `DPS (5s): <b style="color:#fbbf24">${Math.round(tot / win)}</b> · Total: ${fmt(tot)}`; }
}
function layerName(P) { const l = G.world.layerAt(Math.floor(pcx(P) / TS), Math.floor(pcy(P) / TS)); const b = G.world.biomeName(Math.floor(pcx(P) / TS)); const BN = { ocean: 'Oceano', desert: 'Deserto', forest: 'Floresta', jungle: 'Selva', snow: 'Neve' }; return { sky: 'Céu', surface: BN[b], cave: 'Cavernas', deep: 'Cavernas Profundas', hell: 'Inferno' }[l] + ' · prof. ' + Math.max(0, Math.floor((pcy(P) / TS) - 120)); }
// ---------- crafting ----------
const CRAFT_TABS = [['avail', 'Disponíveis'], ['sword', 'Espadas'], ['tool', 'Ferramentas'], ['block', 'Blocos'], ['equip', 'Equip.'], ['other', 'Outros'], ['all', 'Todas']];
const recCat = r => { const t = IT[r.out].type; return t === 'sword' ? 'sword' : t === 'pick' ? 'tool' : (t === 'block' || t === 'wall') ? 'block' : (t === 'armor' || t === 'acc') ? 'equip' : 'other'; };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function renderCrafting() {
  const list = $('craft-list'), q = norm(G.ui.search.trim()), tab = G.ui.tab; const stn = nearStations();
  $('station-info').textContent = stn.size ? 'Perto: ' + [...stn].map(k => STATION_NAME[k]).join(', ') : 'Sem estação próxima';
  let rs = RECIPES.map((r, i) => ({ r, i, can: canCraft(r), cat: recCat(r) })).filter(x => (tab === 'avail' ? x.can : tab === 'all' || x.cat === tab) && (!q || norm(IT[x.r.out].n).includes(q)));
  rs.sort((a, b) => (b.can - a.can) || ((IT[a.r.out].tier || 0) - (IT[b.r.out].tier || 0)) || a.i - b.i);
  const total = rs.length; rs = rs.slice(0, 160);
  let h = '';
  if (!rs.length) h = '<div style="color:var(--mut);font-size:12px;padding:10px">' + (tab === 'avail' ? 'Nada disponível agora. Junte materiais e fique perto de uma Bancada / Fornalha / Bigorna.' : 'Nenhuma receita.') + '</div>';
  for (const { r, i, can } of rs) {
    const it = IT[r.out];
    h += `<div class="rec ${can ? '' : 'no'}" data-r="${i}"><i class="ic big ${iconClass(r.out)}"></i><div><div class="nm" style="color:${tierCol(r.out)}">${escHtml(it.n)}${r.n > 1 ? ' ×' + r.n : ''}${missingStation(r) ? ' <span class="st">' + STATION_NAME[r.st] + '</span>' : ''}</div><div class="ing">${Object.entries(r.ing).map(([k, v]) => `<span class="${invCount(k) >= v ? '' : 'miss'}"><i class="ic ${iconClass(k)}"></i>${v}</span>`).join('')}</div></div></div>`;
  }
  if (total > 160) h += `<div style="color:var(--mut);font-size:11px;padding:6px">+${total - 160} receitas... use a busca.</div>`;
  list.innerHTML = h;
}
function buildCraftTabs() {
  const box = $('craft-tabs'); box.innerHTML = ''; CRAFT_TABS.forEach(([k, n]) => { const t = document.createElement('div'); t.className = 'tab' + (G.ui.tab === k ? ' on' : ''); t.textContent = n; t.onclick = () => { G.ui.tab = k; buildCraftTabs(); G.ui.craftDirty = true; refreshInvUI(); }; box.appendChild(t); });
}
// ---------- abrir / fechar painéis ----------
function setBlocking() { G.ui.blocking = !!G.ui.open || G.state !== 'play'; }
function openPanel(name) {
  closePanels(true); G.ui.open = name; setBlocking();
  if (name === 'inv') { $('panel-inv').classList.remove('hidden'); G.ui.craftDirty = true; refreshInvUI(); }
  else if (name === 'arsenal') { $('panel-arsenal').classList.remove('hidden'); renderArsenal(); }
  else if (name === 'map') { $('panel-map').classList.remove('hidden'); drawBigMap(); }
  else if (name === 'npc') $('npc-panel').classList.remove('hidden');
  sfx('tick');
}
function closePanels(silent) {
  if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
  if (G.held) { const left = invAdd(G.held.id, G.held.n); if (left > 0 && G.P) dropItem(G.held.id, left, G.P.x, G.P.y); G.held = null; updateCursorItem(); }
  if (G.chestPos) { G.chestPos = null; G.chestSlots = null; }
  ['panel-inv', 'panel-arsenal', 'panel-map', 'npc-panel'].forEach(id => { const e = $(id); if (e) e.classList.add('hidden'); });
  G.ui.open = null; setBlocking(); hideTip(); G.invChanged = true;
}
function openChest(tx, ty) { const wd = G.world, k = wd.idx(tx, ty); let c = wd.chests.get(k); if (!c) { c = new Array(20).fill(null); wd.chests.set(k, c); } G.chestSlots = c; G.chestPos = k; openPanel('inv'); G.chestSlots = c; G.chestPos = k; refreshInvUI(); sfx('door'); }
// ---------- Arsenal / Catálogo ----------
const ARS_TABS = [['T1', 'Tier 1'], ['T2', 'Tier 2'], ['T3', 'Tier 3'], ['T4', 'Tier 4'], ['T5', 'Tier 5'], ['T6', 'Tier 6'], ['ALL', 'Todas'], ['items', 'Itens'], ['enemies', 'Inimigos & Chefes'], ['world', 'Mundo']];
function arsGive(id, n) { const left = invAdd(id, n || 1); if (left) dropItem(id, left, G.P.x, G.P.y); sfx('pickup'); G.ui.craftDirty = true; }
function renderArsenal() {
  const cre = G.mode === 'creative'; $('ars-title').textContent = cre ? 'Arsenal (Modo Criativo)' : 'Catálogo das 120 Espadas';
  const tabs = $('ars-tabs'); tabs.innerHTML = ''; const avail = cre ? ARS_TABS : ARS_TABS.slice(0, 7);
  if (!avail.some(t => t[0] === G.ui.arsTab)) G.ui.arsTab = 'T1';
  avail.forEach(([k, n]) => { const t = document.createElement('div'); t.className = 'tab' + (G.ui.arsTab === k ? ' on' : ''); t.textContent = n; if (/^T\d$/.test(k)) t.style.borderColor = TIERS[+k[1]].col; t.onclick = () => { G.ui.arsTab = k; renderArsenal(); }; tabs.appendChild(t); });
  const body = $('ars-body'), tab = G.ui.arsTab; body.innerHTML = '';
  const grid = (ids, withNum) => { const g = document.createElement('div'); g.className = 'ars-grid'; ids.forEach(id => { const it = IT[id], el = document.createElement('div'); el.className = 'slot t' + (it.tier || 0) + (it.type === 'sword' && it.sw.src === 'novo' ? ' novo' : ''); el.innerHTML = `<i class="ic ${iconClass(id)}"></i>` + (withNum && it.type === 'sword' ? `<span class="num">${String(it.sw.num).padStart(3, '0')}</span>` : ''); el.onmouseenter = ev => showTip(tipHTML(id), ev); el.onmousemove = moveTip; el.onmouseleave = hideTip; el.onmousedown = ev => { ev.preventDefault(); if (cre) arsGive(id, ev.shiftKey ? stackMax(id) > 1 ? 99 : 1 : 1); else toast(it.n + ': ' + (RECIPES.find(r => r.out === id) ? 'veja a receita no tooltip e construa no inventário (E).' : ''), tierCol(id)); }; g.appendChild(el); }); return g; };
  if (/^T\d$/.test(tab) || tab === 'ALL') {
    const swords = SWORDS.filter(s => tab === 'ALL' || s.tierLevel === +tab[1]);
    if (/^T\d$/.test(tab)) { const T_ = TIERS[+tab[1]]; const d = document.createElement('div'); d.style.cssText = 'margin-bottom:10px;padding:8px 12px;border-left:4px solid ' + T_.col + ';background:rgba(255,255,255,.05);border-radius:6px;font-size:13px'; const sws = swords; d.innerHTML = `<b style="color:${T_.col}">${T_.n}</b> · multiplicador de dano ${T_.mult[0]}x–${T_.mult[1]}x · ${sws.length} espadas · dano ${Math.min(...sws.map(s => s.baseDamage))}–${Math.max(...sws.map(s => s.baseDamage))}<br><span style="color:var(--mut)">${T_.mech}</span>` + ((+tab[1]) % 2 === 0 ? '<br><span style="color:#fbbf24">★ Este tier estava truncado no PDF — as 20 espadas foram criadas seguindo as regras acima.</span>' : ''); body.appendChild(d); }
    body.appendChild(grid(swords.map(s => s.id), true));
    const note = document.createElement('div'); note.style.cssText = 'margin-top:10px;font-size:12px;color:var(--mut)'; note.textContent = cre ? 'Clique para pegar 1 espada · ★ = criada (não consta no PDF). Passe o mouse para ver detalhes e receita.' : 'Passe o mouse sobre uma espada para ver atributos, mecânica e receita. ★ = criada para completar o GDD.'; body.appendChild(note);
  } else if (tab === 'items') {
    const groups = [['Blocos', i => i.type === 'block' || i.type === 'wall'], ['Materiais', i => i.type === 'mat'], ['Ferramentas', i => i.type === 'pick'], ['Armaduras', i => i.type === 'armor'], ['Acessórios', i => i.type === 'acc'], ['Consumíveis e Invocações', i => i.type === 'use']];
    for (const [n, f] of groups) { const s = document.createElement('div'); s.className = 'sect'; s.textContent = n; body.appendChild(s); body.appendChild(grid(Object.keys(IT).filter(id => IT[id].type !== 'sword' && f(IT[id])), false)); }
  } else if (tab === 'enemies') {
    const row = document.createElement('div'); row.className = 'bar-row'; row.innerHTML = '<span style="font-size:12px;color:var(--mut)">Variante elemental (Hardmode):</span>';
    const sel = document.createElement('select'); sel.style.cssText = 'padding:5px;background:#10162b;color:#fff;border:1px solid var(--line);border-radius:6px'; sel.innerHTML = '<option value="">Nenhuma</option>' + Object.entries(ELEMS).map(([k, v]) => `<option value="${k}" ${G.ui.enemyElem === k ? 'selected' : ''}>${v.n}</option>`).join(''); sel.onchange = () => G.ui.enemyElem = sel.value; row.appendChild(sel); body.appendChild(row);
    const mk = (keys, boss) => { const wrap = document.createElement('div'); keys.forEach(k => { const d = ED[k], b = document.createElement('div'); b.className = 'enemy-btn'; b.innerHTML = `<b>${d.n}</b> <span style="color:var(--mut)">HP ${d.hp >= 1e8 ? '∞' : d.hp}</span>`; b.onclick = () => { if (boss) { G.boss = null; const ok = summonBoss({ boss_slime: 'slime', boss_eye: 'eye', boss_guardian: 'guardian', boss_colossus: 'colossus' }[k]); if (!ok) return; } else { const P = G.P, sp = freeSpot(d.w, d.h, pcx(P) + P.face * 150, pcy(P) - 10); spawnEnemy(k, sp.x, sp.y, { elem: G.ui.enemyElem || undefined }); } sfx('tick'); }; wrap.appendChild(b); }); return wrap; };
    const s1 = document.createElement('div'); s1.className = 'sect'; s1.textContent = 'Alvos de treino'; body.appendChild(s1); body.appendChild(mk(['dummy']));
    const s2 = document.createElement('div'); s2.className = 'sect'; s2.textContent = 'Inimigos'; body.appendChild(s2); body.appendChild(mk(Object.keys(ED).filter(k => !ED[k].boss && !ED[k].isDummy)));
    const s3 = document.createElement('div'); s3.className = 'sect'; s3.textContent = 'Chefes (sem restrição no criativo)'; body.appendChild(s3); body.appendChild(mk(Object.keys(ED).filter(k => ED[k].boss), true));
  } else if (tab === 'world') {
    const P = G.P, row = (title, btns) => { const s = document.createElement('div'); s.className = 'sect'; s.textContent = title; body.appendChild(s); const r = document.createElement('div'); r.className = 'bar-row'; btns.forEach(([n, f, on]) => { const b = document.createElement('button'); b.className = 'btn' + (on ? ' on' : ''); b.textContent = n; b.onclick = () => { f(b); sfx('tick'); renderArsenal(); }; r.appendChild(b); }); body.appendChild(r); };
    row('Hora do dia', [['Amanhecer', () => G.time = .05], ['Meio-dia', () => G.time = .3], ['Entardecer', () => G.time = .58], ['Meia-noite', () => G.time = .82]]);
    row('Opções de teste', [['Invencível', () => G.opts.god = !G.opts.god, G.opts.god], ['Sem spawn de inimigos', () => G.opts.noSpawn = !G.opts.noSpawn, G.opts.noSpawn], ['Mostrar DPS', () => G.opts.showDps = !G.opts.showDps, G.opts.showDps], ['Criação grátis', () => G.opts.freeCraft = !G.opts.freeCraft, G.opts.freeCraft]]);
    row('Ações', [['Curar tudo', () => { P.hp = P.maxHp; }], ['Remover inimigos', () => { G.enemies.length = 0; G.projs = G.projs.filter(p => p.friendly); G.boss = null; }], ['+500 moedas', () => arsGive('coin', 500)], ['+4 Cristais de Vida', () => { P.crystals = Math.min(15, P.crystals + 4); recalcStats(); P.hp = P.maxHp; }]]);
    row('Progressão do mundo (estágio dos inimigos)', [['Estágio 0 · Início', () => { G.stage = 0; }, G.stage === 0], ['Estágio 1 · Pós-Olho', () => { G.stage = 1; G.flags.eye = true; }, G.stage === 1], ['Estágio 2 · Hardmode', () => { if (!G.world.hardmode) spawnHardmodeOres(G.world); G.stage = 2; G.flags.eye = G.flags.guardian = true; toast('Hardmode ativado: minérios T3/T4 gerados.', '#fb923c'); }, G.stage === 2], ['Estágio 3 · Pós-Colosso', () => { if (!G.world.hardmode) spawnHardmodeOres(G.world); G.stage = 3; G.flags.guardian = true; }, G.stage === 3]]);
    const tp = (x, y) => () => { P.x = x * TS; P.y = (y - 3) * TS; P.vx = P.vy = 0; P.fallStart = 0; closePanels(); }; const sf = x => G.world.surf[x];
    row('Teletransporte', [['Spawn', () => { P.x = G.world.spawn.x; P.y = G.world.spawn.y; P.vy = 0; closePanels(); }], ['Deserto', () => tp(240, sf(240))()], ['Selva', () => tp(900, sf(900))()], ['Neve', () => tp(1150, sf(1150))()], ['Oceano', () => tp(40, 124)()], ['Ilha do céu', () => { const x = 90 + Math.round(5 * (WW - 180) / 10); tp(x, 40)(); }], ['Cavernas', () => { const x = 600; for (let y = 200; y < 400; y++) if (!G.world.solid(x, y) && G.world.solid(x, y + 1) && !G.world.solid(x, y - 1) && !G.world.solid(x, y - 2)) { tp(x, y + 3)(); break; } }], ['Inferno', () => { const x = 700; for (let y = 425; y < 470; y++) if (!G.world.solid(x, y) && G.world.solid(x, y + 1) && G.world.liqAt(x, y) === 0) { tp(x, y + 3)(); break; } }]]);
    const info = document.createElement('div'); info.style.cssText = 'margin-top:12px;font-size:12px;color:var(--mut)'; info.textContent = 'Dica: use o Boneco de Treino (aba Inimigos) com "Mostrar DPS" ligado para comparar as espadas.'; body.appendChild(info);
  }
}
// ---------- mapa ----------
function paintMapPixel(x, y) {
  const wd = G.world, i = x + y * wd.w, g = G.mapCtx; if (!g) return; const id = wd.t[i], q = wd.lq[i];
  let c;
  if (q > 40) c = wd.lt[i] === LIQ_LAVA ? '#ff6a1a' : '#2f6fe0';
  else if (id) { const d = TD[id]; c = d.x === 'ore' ? d.ore : d.s ? (d.cap && !SOLID[wd.get(x, y - 1)] ? d.cap[0] : d.c[0]) : (d.tree ? d.c[0] : d.c[2] || d.c[0]); }
  else if (wd.wl[i]) c = '#2b2a33'; else c = y > wd.surf[x] + 10 ? '#1b1a22' : '#6aa8ec';
  g.fillStyle = c; g.fillRect(x, y, 1, 1);
}
function drawMinimap() {
  const cv = $('mini'), g = cv.getContext('2d'), P = G.P; g.fillStyle = '#05080f'; g.fillRect(0, 0, 180, 110); if (!G.mapC) return;
  const px = Math.floor(pcx(P) / TS), py = Math.floor(pcy(P) / TS), sx = clamp(px - 90, 0, G.world.w - 180), sy = clamp(py - 55, 0, G.world.h - 110);
  g.imageSmoothingEnabled = false; g.drawImage(G.mapC, sx, sy, 180, 110, 0, 0, 180, 110);
  if (Math.floor(G.t * 3) % 2 === 0) { g.fillStyle = '#fff'; g.fillRect(px - sx - 1, py - sy - 1, 3, 3); } g.fillStyle = '#ef4444';
  for (const e of G.enemies) { if (e.dead || e.harmless) continue; const ex = Math.floor(ecx(e) / TS) - sx, ey = Math.floor(ecy(e) / TS) - sy; if (ex >= 0 && ey >= 0 && ex < 180 && ey < 110 && (e.boss || G.world.rev[Math.floor(ecx(e) / TS) + Math.floor(ecy(e) / TS) * G.world.w])) g.fillRect(ex, ey, e.boss ? 4 : 2, e.boss ? 4 : 2); }
}
function drawBigMap() {
  const cv = $('map-cv'), g = cv.getContext('2d'), wd = G.world, W = Math.min(innerWidth * .92, 1300), sc = W / wd.w; cv.width = Math.floor(W); cv.height = Math.floor(wd.h * sc);
  g.fillStyle = '#05080f'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.drawImage(G.mapC, 0, 0, wd.w, wd.h, 0, 0, cv.width, cv.height);
  const P = G.P, px = pcx(P) / TS * sc, py = pcy(P) / TS * sc; g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 4, 0, TAU); g.fill(); g.strokeStyle = '#fbbf24'; g.lineWidth = 2; g.stroke();
  const sp = wd.spawn; g.fillStyle = '#4ade80'; g.fillRect(sp.x / TS * sc - 2, sp.y / TS * sc - 2, 5, 5);
}
// ---------- menus ----------
const TIPS = ['Dica: segure o botão esquerdo para atacar continuamente; a espada alterna o sentido do arco a cada golpe.', 'Dica: cavernas profundas escondem minérios melhores — mas lava e inimigos também.', 'Dica: água + lava = obsidiana. Material para espadas do Tier 1 e 2.', 'Dica: os Cristais de Vida aumentam sua vida máxima. Procure-os nas cavernas!', 'Dica: uma Bigorna Avançada exige Mithril ou Orichalcum — disponíveis só no Hardmode.', 'Dica: o Boneco Infernal invoca o Guardião do Abismo no Inferno. Derrotá-lo inicia o Hardmode.'];
function helpHTML() {
  return `<h2>Controles e Guia</h2><table>
<tr><td><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></td><td>Mover</td></tr><tr><td><kbd>Espaço</kbd> <kbd>W</kbd> <kbd>↑</kbd></td><td>Pular · nadar para cima</td></tr>
<tr><td>Botão esquerdo (segurar)</td><td>Atacar (arco em direção ao cursor) · minerar · colocar bloco · usar item</td></tr><tr><td>Botão direito</td><td>Abrir baú · abrir/fechar porta · falar com NPC</td></tr>
<tr><td><kbd>1</kbd>–<kbd>0</kbd> / roda do mouse</td><td>Selecionar item da barra</td></tr><tr><td><kbd>E</kbd> / <kbd>Tab</kbd></td><td>Inventário + criação (fique perto de Bancada, Fornalha, Bigorna...)</td></tr>
<tr><td><kbd>B</kbd></td><td>Arsenal (criativo) · Catálogo das 120 espadas (aventura)</td></tr><tr><td><kbd>M</kbd></td><td>Mapa do mundo</td></tr><tr><td><kbd>Q</kbd></td><td>Poção de cura rápida</td></tr>
<tr><td><kbd>+</kbd> <kbd>-</kbd></td><td>Zoom</td></tr><tr><td><kbd>F3</kbd></td><td>Informações de depuração</td></tr><tr><td><kbd>Esc</kbd></td><td>Fechar painéis / pausar</td></tr></table>
<h2 style="margin-top:16px">Controle (gamepad)</h2><table>
<tr><td>Analógico esq. / <kbd>◀</kbd> <kbd>▶</kbd></td><td>Mover</td></tr><tr><td><kbd>A</kbd></td><td>Pular · nadar para cima</td></tr>
<tr><td>Analógico dir.</td><td>Mira analógica: o arco da espada aponta para onde o analógico aponta; a inclinação define a distância (ferramentas ficam no alcance)</td></tr>
<tr><td><kbd>RT</kbd> / <kbd>X</kbd> (segurar)</td><td>Atacar · minerar · colocar bloco · usar item (sem mira: usa o analógico esquerdo ou o lado para onde você olha)</td></tr>
<tr><td><kbd>B</kbd></td><td>Interagir com o baú / porta / NPC mais próximo</td></tr><tr><td><kbd>LB</kbd> <kbd>RB</kbd></td><td>Item anterior / próximo da barra</td></tr><tr><td><kbd>LT</kbd></td><td>Poção de cura rápida</td></tr>
<tr><td><kbd>Y</kbd> · <kbd>▲</kbd> · <kbd>▼</kbd>/<kbd>Select</kbd></td><td>Inventário e criação · catálogo/arsenal · mapa</td></tr><tr><td><kbd>L3</kbd> <kbd>R3</kbd></td><td>Zoom − / +</td></tr><tr><td><kbd>Start</kbd></td><td>Pausar / fechar painéis</td></tr>
<tr><td>Nos painéis e menus</td><td>Analógico esq. move o cursor (ou <kbd>▲</kbd><kbd>▼</kbd> nos menus) · <kbd>A</kbd> clica · <kbd>X</kbd> botão direito · <kbd>RB</kbd> Shift+clique · analógico dir. rola a lista · <kbd>B</kbd> fecha</td></tr></table>
<h2 style="margin-top:16px">Progressão</h2><ol style="margin:0;padding-left:20px">
<li><b>Tier 1</b>: corte árvores, mine cobre/ferro e faça Bancada → Fornalha → Bigorna. Espadas básicas.</li>
<li><b>Tier 2</b>: platina, meteorito (ilhas do céu), Brasita do Inferno, gemas. Derrote o <b>Rei Slime</b> e o <b>Olho Colossal</b> (noite).</li>
<li><b>Tier 3/4 (Hardmode)</b>: vá ao Inferno, use o <b>Boneco Infernal</b> contra o Guardião do Abismo. Surgem Cobalto, Paládio, Mithril, Orichalcum, Titânio, Adamantita e inimigos elementais que dropam Essências.</li>
<li><b>Tier 5/6</b>: Fragmentos Celestes → Forja Celeste. Invoque o <b>Colosso Estelar</b> e forje as espadas míticas com o Núcleo Mítico.</li></ol>
<p style="color:var(--mut);margin-top:10px">As cores de raridade seguem o GDD: <b style="color:#10b981">T1</b> <b style="color:#0284c7">T2</b> <b style="color:#7c3aed">T3</b> <b style="color:#d97706">T4</b> <b style="color:#dc2626">T5</b> <b style="color:#818cf8">T6</b>. As espadas marcadas com ★ foram criadas para completar o catálogo (o PDF veio truncado).</p>
<div style="text-align:center;margin-top:12px"><button class="btn pri" id="help-close">Fechar</button></div>`;
}
function showHelp(show) { const h = $('help'); if (show) { $('help-box').innerHTML = helpHTML(); h.classList.remove('hidden'); $('help-close').onclick = () => showHelp(false); } else h.classList.add('hidden'); }
function initUI() {
  buildSlotsUI(); buildCraftTabs();
  const mp = document.createElement('div'); mp.id = 'panel-map'; mp.className = 'panel hidden'; mp.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%);padding:10px'; mp.innerHTML = '<h3><span>Mapa do Mundo</span><span style="text-transform:none;letter-spacing:0">(M para fechar) · branco = você · verde = spawn</span></h3><canvas id="map-cv" style="display:block;border:1px solid var(--line);border-radius:6px"></canvas>'; $('app').appendChild(mp);
  const ts = $('tiers-strip'); ts.innerHTML = ''; for (let t = 1; t <= 6; t++) { const s = document.createElement('span'); s.style.background = TIERS[t].col; s.title = TIERS[t].n; ts.appendChild(s); }
  $('craft-search').addEventListener('input', e => { G.ui.search = e.target.value; G.ui.craftDirty = true; renderCrafting(); });
  $('craft-search').addEventListener('keydown', e => e.stopPropagation());
  const cl = $('craft-list');
  cl.addEventListener('click', ev => { const r = ev.target.closest('.rec'); if (!r) return; const rec = RECIPES[+r.dataset.r]; const n = ev.shiftKey ? 5 : 1; let ok = false; for (let k = 0; k < n; k++) if (doCraft(rec)) ok = true; else break; if (ok) { toast('Criado: ' + IT[rec.out].n, tierCol(rec.out), 1.4); G.ui.craftDirty = true; afterInvChange(); } else { toast(missingStation(rec) ? 'Fique perto de: ' + STATION_NAME[rec.st] : 'Materiais insuficientes.', '#fbbf24', 1.6); } });
  cl.addEventListener('mouseover', ev => { const r = ev.target.closest('.rec'); if (r) showTip(tipHTML(RECIPES[+r.dataset.r].out, { noRecipe: false }), ev); });
  cl.addEventListener('mousemove', ev => moveTip(ev)); cl.addEventListener('mouseleave', hideTip);
  $('ars-close').onclick = () => closePanels();
  $('help').addEventListener('mousedown', e => { if (e.target.id === 'help') showHelp(false); });
}
