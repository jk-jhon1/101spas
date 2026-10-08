/* ============================================================
   15e_worlds: interface dos mundos salvos — menu do título, tela "Meus Mundos", criar / abrir / sair
   (sem campo de semente: cada mundo novo recebe uma semente sorteada, inédita; ver Worlds.allocate e chooseSeed)
   Só define funções: nada toca o DOM na carga do script.
   ============================================================ */
const BIO_PT = { desert: 'Deserto', forest: 'Floresta', jungle: 'Selva', snow: 'Neve', ocean: 'Oceano' };
const layoutLabel = key => key ? key.split('-').map(k => BIO_PT[k] || k).join(' › ') : '';
const modeLabel = m => m === 'creative' ? 'Criativo' : 'Aventura';
function fmtAgo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 90) return 'agora há pouco'; if (s < 3600) return 'há ' + Math.round(s / 60) + ' min'; if (s < 86400) return 'há ' + Math.round(s / 3600) + ' h';
  const d = Math.round(s / 86400); return d === 1 ? 'ontem' : 'há ' + d + ' dias';
}
function fmtPlay(sec) { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? h + ' h ' + String(m).padStart(2, '0') + ' min' : Math.max(1, m) + ' min'; }
function fmtMB(b) { return b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB'; }

// ---------- menu do título ----------
function updateTitleMenu() {
  const L = Worlds.list, has = L.length > 0, last = L[0];
  $('btn-load').classList.toggle('hidden', !has);
  if (has) $('btn-load-sub').textContent = last.name + ' · ' + modeLabel(last.mode) + ' · ' + fmtAgo(last.updated);
  $('btn-worlds-sub').textContent = Worlds.mode === 'memory' ? (has ? L.length + ' na memória: somem ao fechar a página' : 'Salvamento permanente indisponível aqui')
    : has ? L.length + (L.length === 1 ? ' mundo salvo' : ' mundos salvos') : 'Nenhum mundo salvo ainda';
  if ($('worlds') && !$('worlds').classList.contains('hidden')) renderWorlds();
}

// ---------- tela "Meus Mundos" ----------
function worldCard(w) {
  const el = document.createElement('div'); el.className = 'wcard'; el.dataset.id = w.id;
  const prog = w.mode === 'creative' ? '' : ' · estágio ' + (w.stage || 0) + (w.bosses ? ' · ' + w.bosses + '/4 chefes' : '');
  el.innerHTML = '<div class="wthumb">' + (w.thumb ? '<img alt="" src="' + w.thumb + '">' : '<span>sem miniatura</span>') + '</div>' +
    '<div class="winfo"><b class="wname" title="' + escHtml(w.name) + '">' + escHtml(w.name) + '</b>' +
    '<span>' + modeLabel(w.mode) + ' · dia ' + (w.day || 1) + prog + '</span>' +
    '<span class="wbio">' + escHtml(layoutLabel(w.layoutKey)) + '</span>' +
    '<span class="wdate">' + fmtAgo(w.updated) + ' · ' + fmtPlay(w.playSec) + ' jogados · ' + fmtMB(w.bytes || 0) + (w.legacy ? ' · importado do save antigo' : '') + '</span></div>' +
    '<div class="wact"><button class="menu-btn wplay" data-act="play">Jogar</button>' +
    '<div class="wmini"><button class="btn" data-act="ren">Renomear</button><button class="btn wdel" data-act="del">Excluir</button></div></div>';
  return el;
}
function renderWorlds() {
  const box = $('worlds-list'), L = Worlds.list; box.innerHTML = '';
  if (!L.length) { const e = document.createElement('div'); e.id = 'worlds-empty'; e.textContent = 'Nenhum mundo ainda. Escolha Nova Aventura ou Modo Criativo: cada mundo é gerado do zero, único, e salvo automaticamente.'; box.appendChild(e); }
  for (const w of L) box.appendChild(worldCard(w));
  $('worlds-count').textContent = L.length ? '(' + L.length + ')' : '';
  Worlds.usage().then(u => { $('worlds-info').textContent = (Worlds.mode === 'memory' ? 'Salvamento permanente indisponível neste ambiente — só durante a sessão.' : 'Salvos neste navegador.') + (u && u.quota ? ' Espaço usado: ' + fmtMB(u.used) + ' de ' + fmtMB(u.quota) + '.' : ''); });
}
function openWorlds(show) {
  const el = $('worlds'); if (!el) return;
  if (show) { renderWorlds(); el.classList.remove('hidden'); } else el.classList.add('hidden');
}
function startRename(card) {
  const id = card.dataset.id, w = Worlds.list.find(x => x.id === id), nm = card.querySelector('.wname'); if (!w || !nm) return;
  const inp = document.createElement('input'); inp.className = 'wedit'; inp.maxLength = 28; inp.value = w.name; nm.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  const commit = async ok => { if (done) return; done = true; if (ok && inp.value.trim() && inp.value.trim() !== w.name) await Worlds.rename(id, Worlds.uniqueName(inp.value.trim().replace(/\s+/g, ' ').slice(0, 28), id)); updateTitleMenu(); renderWorlds(); };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') commit(true); else if (e.key === 'Escape') commit(false); });
  inp.addEventListener('blur', () => commit(true));
}
async function worldsClick(ev) {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const card = b.closest('.wcard'), id = card.dataset.id, act = b.dataset.act;
  if (act === 'play') openWorld(id);
  else if (act === 'ren') startRename(card);
  else if (act === 'del') {   // duas etapas: o 1º clique arma, o 2º (em até 4 s) exclui
    if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Confirmar exclusão?'; setTimeout(() => { if (b.isConnected) { b.classList.remove('armed'); b.textContent = 'Excluir'; } }, 4000); return; }
    await Worlds.remove(id); updateTitleMenu(); renderWorlds();
  }
}

// ---------- criar / abrir / sair ----------
async function newWorld(mode) {
  const bs = [$('btn-adv'), $('btn-cre'), $('btn-load')]; bs.forEach(b => b.disabled = true);   // evita clique duplo durante o sorteio
  try {
    await Worlds.init();
    const w = await Worlds.allocate(mode);
    startGame({ mode, seed: w.seed, id: w.id, name: w.name });
  } finally { bs.forEach(b => b.disabled = false); }
}
async function openWorld(id) {
  openWorlds(false); $('menu').classList.add('hidden'); $('loading').classList.remove('hidden'); G.state = 'loading';
  $('load-title').textContent = 'Abrindo o mundo...'; $('load-fill').style.width = '45%'; $('load-msg').textContent = ''; $('load-tip').textContent = pick(TIPS);
  await new Promise(r => requestAnimationFrame(() => r()));   // deixa a tela de carregamento aparecer antes do trabalho pesado
  const ok = await Worlds.load(id);
  if (!ok) { G.state = 'title'; $('loading').classList.add('hidden'); $('menu').classList.remove('hidden'); updateTitleMenu(); }
  return ok;
}
let _quitArm = -1e9;
async function quitToMenu() {
  const btn = $('p-menu'); btn.disabled = true;
  const ok = await Worlds.save({ silent: true, thumb: true });
  btn.disabled = false;
  if (!ok && Worlds.mode === 'idb' && G.worldId) {   // não perde o mundo sem avisar: o 2º clique (em até 5 s) sai mesmo assim
    if (performance.now() - _quitArm > 5000) { _quitArm = performance.now(); toast('Não foi possível salvar o mundo. Clique de novo para sair mesmo assim.', '#fca5a5', 5); return; }
  }
  _quitArm = -1e9;
  setPause(false); closePanels(true); G.state = 'title'; $('hud').classList.add('hidden'); $('menu').classList.remove('hidden');
  G.world = null; G.P = null; G.worldId = null; G.worldName = ''; updateTitleMenu();
}
function showSaveBadge() {
  const b = $('savebadge'); if (!b) return; b.classList.remove('hidden'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
  clearTimeout(showSaveBadge._t); showSaveBadge._t = setTimeout(() => b.classList.add('hidden'), 1800);
}

// ---------- ligação com a página (chamada uma vez por initGame) ----------
function initWorldsUI() {
  $('btn-adv').onclick = () => newWorld('adventure'); $('btn-cre').onclick = () => newWorld('creative');
  $('btn-load').onclick = () => { if (Worlds.list[0]) openWorld(Worlds.list[0].id); };
  $('btn-worlds').onclick = () => openWorlds(true); $('worlds-back').onclick = () => openWorlds(false);
  $('worlds-list').addEventListener('click', worldsClick);
  $('worlds').addEventListener('mousedown', e => { if (e.target.id === 'worlds') openWorlds(false); });
  $('p-save').onclick = () => { saveGame(false); };
  $('p-menu').onclick = () => { quitToMenu(); };
  // salva ao esconder a aba / fechar a página (melhor esforço: a gravação no IndexedDB continua em segundo plano)
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') Worlds.save({ silent: true }); });
  window.addEventListener('pagehide', () => { if (G.state === 'play') Worlds.save({ silent: true }); });
  Worlds.init().then(updateTitleMenu);
  updateTitleMenu();
}
