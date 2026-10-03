/* ============================================================
   15b_npc: moradia (salas válidas) e NPCs: Guia, Mercador,
   Enfermeira e Armeiro (loja, venda de itens, cura)
   GDD: "gerenciamento de abrigo/NPCs"
   Sala válida: fechada (blocos/portas), fundo com paredes em toda
   a área, 28–520 tiles, com luz (tocha/fornalha), mesa/bancada,
   cadeira e ao menos uma porta.
   ============================================================ */
const NPC_DEF = {
  guide: { n: 'Guia', shirt: '#2f9a3a', hair: '#7a4a22', pants: '#4a3a2a', cond: () => true, desc: 'Conhece todas as receitas e dá dicas conforme seu progresso.' },
  trader: { n: 'Mercador', shirt: '#7c3aed', hair: '#2a2a2a', pants: '#2a2a44', hat: '#a78bfa', cond: () => invCount('coin') >= 20 || G.day >= 2, desc: 'Compra seus materiais e vende itens úteis.' },
  nurse: { n: 'Enfermeira', shirt: '#f8fafc', hair: '#f5c16c', pants: '#e2e8f0', cross: true, cond: () => G.flags.slime || (G.P && G.P.crystals > 0) || G.day >= 3, desc: 'Cura seus ferimentos em troca de moedas.' },
  smith: { n: 'Armeiro', shirt: '#8a5c2c', hair: '#555', pants: '#3a2a1a', apron: true, cond: () => G.flags.eye, desc: 'Vende fornalhas, bigornas, picaretas e equipamentos.' },
};
const NPC_ORDER = ['guide', 'trader', 'nurse', 'smith'];
G.rooms = []; G.npcs = []; G.npcScanT = 3; G.npcSpawnT = 8;
function itemValue(id) {
  const it = IT[id]; if (!it) return 1; if (it.val) return it.val; const t = it.tier || 0;
  if (id === 'coin') return 1; if (it.type === 'sword') return [0, 60, 160, 420, 1000, 2600, 7500][t];
  if (it.type === 'pick') return Math.round(30 * Math.pow(it.pow, 1.7)); if (it.type === 'armor') return it.def * 40; if (it.type === 'acc') return 90 * t * t + 60;
  if (id.endsWith('_ore')) return 3 + 4 * t; if (id.endsWith('_bar')) return 10 + 16 * t; if (id.startsWith('e_')) return 70; if (id === 'celestial_frag') return 120; if (id === 'mythic_core') return 6000;
  if (['ruby', 'emerald', 'topaz', 'sapphire', 'amethyst'].includes(id)) return 28; if (id === 'life_crystal') return 450; if (it.use === 'heal') return [0, 28, 0, 70, 0, 160][t] || 40;
  if (['furnace'].includes(id)) return 110; if (id === 'anvil') return 170; if (id === 'advanvil') return 900; if (id === 'forge') return 3000; if (it.use) return 150;
  const m = { gel: 2, bone: 3, feather: 4, lens: 9, shark_tooth: 10, beetle_claw: 9, stinger: 10, vamp_tooth: 12, spore: 16, thorn: 3, cactus: 2, glow_mushroom: 5, coal: 3, quartz: 7, amber: 9, frost_shard: 11, wood: 1, torch: 2, plank: 1, glass: 4, chest: 40, door: 8, table: 14, chair: 8, bench: 20 };
  return m[id] || (it.type === 'block' ? 1 : 3);
}
const sellPrice = id => Math.max(1, Math.round(itemValue(id) / 3));
const SHOPS = {
  trader: () => ['torch', 'potion1', 'plank', 'glass', 'door', 'table', 'chair', 'chest', 'bench', 'stonebrick', 'wall_plank', 'wall_stone', 'sand'].concat(G.stage >= 2 ? ['potion2'] : []),
  smith: () => ['furnace', 'anvil', 'pick_iron', 'arm_copper', 'arm_iron', 'acc_boots', 'acc_glove', 'acc_shield'].concat(G.stage >= 2 ? ['pick_cobalt'] : []),
};
// ---------- detecção de salas ----------
function floodRoom(x, y) {
  const wd = G.world, W = wd.w, seen = new Set(), q = [[x, y]]; seen.add(x + y * W);
  let light = false, table = false, chair = false, door = false, minx = x, maxx = x, miny = y, maxy = y;
  while (q.length) {
    const [cx, cy] = q.pop(); if (seen.size > 520) return null;
    const id = wd.get(cx, cy);
    if (id === T.torch || id === T.furnace || id === T.forge) light = true; else if (id === T.table || id === T.bench) table = true; else if (id === T.chair) chair = true;
    if (!wd.wallAt(cx, cy)) return null;
    minx = Math.min(minx, cx); maxx = Math.max(maxx, cx); miny = Math.min(miny, cy); maxy = Math.max(maxy, cy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= wd.h - 2) return null;
      const k = nx + ny * W; if (seen.has(k)) continue; const nid = wd.get(nx, ny);
      if (nid === T.doorC || nid === T.doorO) { door = true; continue; }
      if (SOLID[nid]) continue; seen.add(k); q.push([nx, ny]);
    }
  }
  if (seen.size < 28 || !light || !table || !chair || !door) return { valid: false, size: seen.size, light, table, chair, door };
  return { valid: true, size: seen.size, minx, maxx, miny, maxy, cells: seen };
}
function scanRooms() {
  const wd = G.world, P = G.P, cx = Math.floor(pcx(P) / TS), cy = Math.floor(pcy(P) / TS), rooms = [], taken = new Set();
  for (let y = Math.max(2, cy - 40); y < Math.min(wd.h - 4, cy + 40); y++) for (let x = Math.max(2, cx - 90); x < Math.min(wd.w - 2, cx + 90); x++) {
    if (wd.t[x + y * wd.w] !== T.chair || taken.has(x + y * wd.w)) continue;
    const r = floodRoom(x, y); if (!r) continue;
    if (r.valid) { r.id = x + ',' + y; r.cx = x; r.cy = y; for (const k of r.cells) if (wd.t[k] === T.chair) taken.add(k); rooms.push(r); }
  }
  G.rooms = rooms; return rooms;
}
function npcCount(type) { return G.npcs.filter(n => n.type === type).length; }
function spawnNpcQuiet(type, room) {
  const d = NPC_DEF[type]; const n = { type, d, x: room.cx * TS, y: room.cy * TS - 20, w: 12, h: 26, vx: 0, vy: 0, onGround: false, face: 1, home: room.id, room, t: 1, target: room.cx * TS, age: 0, hitX: 0, hitY: 0, away: 0 }; G.npcs.push(n); return n;
}
function spawnNpc(type, room) {
  const d = NPC_DEF[type], wd = G.world;
  let x = room.cx * TS + 2, y = (room.cy + 1) * TS - 26; for (let k = 0; k < 6 && overlapSolid(x, y, 12, 26); k++) y -= TS;
  const n = { type, d, x, y, w: 12, h: 26, vx: 0, vy: 0, onGround: false, face: 1, home: room.id, room: room, t: rnd(1, 3), target: x, age: 0, hitX: 0, hitY: 0, away: 0 };
  G.npcs.push(n); toast(d.n + ' mudou-se para a sua casa! (clique direito para conversar)', '#86efac', 5); sfx('heal'); burst(x + 6, y + 13, 14, { col: ['#86efac', '#fff'], spd: 90, glow: true, life: .6, g: -50 });
  return n;
}
function updateNpcs(dt) {
  const P = G.P; G.npcScanT -= dt; G.npcSpawnT -= dt;
  if (G.npcScanT <= 0) {
    G.npcScanT = 4; const rooms = scanRooms();
    for (const n of G.npcs) { const r = rooms.find(r => r.id === n.home); if (r) { n.room = r; n.away = 0; } else { n.away += 4; if (n.away >= 12) { n.leave = true; } } }
    G.npcs = G.npcs.filter(n => { if (n.leave) { toast(n.d.n + ' foi embora porque a casa deixou de ser válida.', '#fca5a5', 4); return false; } return true; });
  }
  if (G.npcSpawnT <= 0) {
    G.npcSpawnT = 6; const free = G.rooms.filter(r => !G.npcs.some(n => n.home === r.id));
    if (free.length) { const t = NPC_ORDER.find(k => !npcCount(k) && NPC_DEF[k].cond()); if (t) spawnNpc(t, free[0]); }
  }
  for (const n of G.npcs) {
    n.age += dt; n.t -= dt; const near = !P.dead && Math.abs(pcx(P) - (n.x + 6)) < 70 && Math.abs(pcy(P) - (n.y + 13)) < 50;
    if (near) { n.vx = approach(n.vx, 0, 600 * dt); n.face = pcx(P) > n.x + 6 ? 1 : -1; }
    else {
      if (n.t <= 0) { n.t = rnd(2, 5); const r = n.room; n.target = r && Math.random() < .7 ? rnd(r.minx + 1, r.maxx) * TS : n.x; }
      const dx = n.target - n.x; if (Math.abs(dx) > 6) { n.vx = approach(n.vx, Math.sign(dx) * 38, 500 * dt); n.face = Math.sign(dx); } else n.vx = approach(n.vx, 0, 600 * dt);
    }
    n.vy = Math.min(n.vy + GRAV * dt, MAXFALL); bodyMove(n, dt, { stepUp: true });
    if (n.hitX && n.onGround) n.vy = -300;
    if (n.y > G.world.h * TS) n.y = G.world.spawn.y;
    // inimigos podem atacar NPC? (não: eles são protegidos). Se estiver fora do quarto por muito tempo volta
  }
}
function nearestNpcAt(wx, wy) { for (const n of G.npcs) if (wx > n.x - 8 && wx < n.x + n.w + 8 && wy > n.y - 8 && wy < n.y + n.h + 6) return n; return null; }
function drawNpcs(g) {
  for (const n of G.npcs) {
    const d = n.d, f = n.face, bx = Math.round(n.x + 6), by = Math.round(n.y + 26), walking = Math.abs(n.vx) > 8, sw = walking ? Math.sin(n.age * 9) : 0;
    g.save(); g.translate(bx, by); const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const leg = (a, c) => { g.save(); g.translate(0, -9); g.rotate(a); rect(-1.5, 0, 3, 9, c); rect(-1.5, 7, 3, 2, '#3a2a20'); g.restore(); }; leg(-sw * .7, shade(d.pants, -.2)); leg(sw * .7, d.pants);
    rect(-4, -18, 8, 9, d.shirt); rect(-4, -11, 8, 2, shade(d.pants, .1)); if (d.apron) rect(-3, -16, 6, 8, '#2a2118'); if (d.cross) { rect(-1, -16, 2, 6, '#ef4444'); rect(-3, -14, 6, 2, '#ef4444'); }
    rect(-4, -26, 8, 8, SKIN); rect(-4, -27, 8, 3, d.hair); rect(f > 0 ? -5 : 3, -27, 2, 6, d.hair); rect(f > 0 ? 1 : -3, -23, 2, 2, '#fff'); rect(f > 0 ? 2 : -3, -23, 1, 2, '#1a1a2e');
    if (d.hat) { rect(-6, -28, 12, 2, d.hat); rect(-3, -33, 6, 5, d.hat); }
    g.save(); g.translate(0, -17); g.rotate((f > 0 ? 1.4 : PI - 1.4) + sw * .5 * f); rect(0, -1.3, 7, 2.6, SKIN); rect(0, -1.3, 3, 2.6, d.shirt); g.restore(); g.restore();
    const P = G.P; if (!P.dead && Math.hypot(pcx(P) - bx, pcy(P) - (by - 13)) < 110) { g.font = '700 10px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(d.n, bx, by - 38); g.fillStyle = '#86efac'; g.fillText(d.n, bx, by - 38); }
  }
}
// ---------- diálogo / loja ----------
const GUIDE_HINTS = [
  [() => invCount('wood') < 10 && !nearStations().has('bench') && G.day < 3, 'Comece cortando árvores com a picareta (botão esquerdo no tronco). Com 10 madeiras, pressione E e crie uma Bancada de Trabalho.'],
  [() => !nearStations().has('furnace') && invCount('copper_ore') + invCount('iron_ore') > 0, 'Funda minérios numa Fornalha: 20 pedras + 4 madeiras + 3 tochas (na Bancada). Três minérios = 1 barra.'],
  [() => !G.flags.slime, 'O Rei Slime pode ser invocado com a Coroa de Gosma (30 gosmas). Ele solta moedas, um Cristal de Vida e uma espada do Tier 1.'],
  [() => !G.flags.eye, 'Junte 6 Lentes Demoníacas (dropadas por Olhos Demoníacos à noite) e crie a Lente Suspeita para chamar o Olho Colossal. Ele solta barras de platina.'],
  [() => !G.flags.guardian, 'Para o Hardmode: vá ao Inferno (bem fundo), junte Brasita e obsidiana e crie o Boneco Infernal. Derrote o Guardião do Abismo e o mundo muda!'],
  [() => G.stage >= 2 && !G.P.inv.some(s => s && /^(cobalt|palladium)_bar$/.test(s.id)), 'No Hardmode surgem Cobalto e Paládio (picareta Infernal) e depois Mithril/Orichalcum (picareta de Cobalto). A Bigorna Avançada exige Mithril ou Orichalcum.'],
  [() => G.stage >= 2, 'Inimigos elementais dropam Essências. Cada espada do Tier 3 e 4 usa uma essência diferente. Fragmentos Celestes caem de elites e dos chefes do Hardmode.'],
  [() => G.stage >= 2 && !G.flags.colossus, 'A Forja Celeste (titânio + adamantita) forja o Tier 5. Com a Forja, crie o Coração Estelar e enfrente o Colosso Estelar: ele solta o Núcleo Mítico!'],
  [() => true, 'Água + lava = obsidiana. Areia cai com a gravidade. Tochas iluminam cavernas; cristais de vida estão nas profundezas.'],
  [() => true, 'Cada espada tem um arco de ataque na direção do cursor. Segure o botão para atacar sem parar. Projéteis saem do ápice do golpe.'],
  [() => true, 'Cuidado com a lava no Inferno e com quedas altas. Poções de cura têm recarga de 30 segundos.'],
];
function openNpc(n) {
  const box = $('npc-panel'), d = n.d; openPanel('npc'); G.ui.npc = n;
  const head = `<h3><span>${d.n}</span><span><button class="btn" id="npc-close">Fechar</button></span></h3><div style="font-size:12px;color:var(--mut);margin-bottom:10px">${d.desc}</div>`;
  const body = document.createElement('div');
  const setHTML = h => { box.innerHTML = head; box.appendChild(body); body.innerHTML = h; box.querySelector('#npc-close').onclick = () => closePanels(); };
  if (n.type === 'guide') {
    let idx = 0; const applicable = () => GUIDE_HINTS.filter(h => h[0]()); const show = () => { const a = applicable(); const msg = a[idx % a.length][1]; setHTML(`<div style="font-size:14px;line-height:1.5;padding:8px 10px;background:rgba(255,255,255,.06);border-radius:8px;min-height:90px">${escHtml(msg)}</div><div style="margin-top:10px;display:flex;gap:8px"><button class="btn pri" id="g-next">Outra dica</button><button class="btn" id="g-cat">Abrir catálogo de espadas (B)</button></div>`); $('g-next').onclick = () => { idx++; show(); sfx('tick'); }; $('g-cat').onclick = () => { closePanels(); openPanel('arsenal'); }; };
    show();
  } else if (n.type === 'nurse') {
    const render = () => { const P = G.P, miss = Math.ceil(P.maxHp - P.hp), cost = miss <= 0 ? 0 : Math.max(1, Math.ceil(miss * (1 + G.stage * .6) * .4)); setHTML(`<div style="font-size:14px;margin-bottom:10px">${miss <= 0 ? 'Você está em perfeita saúde!' : 'Você está ferido. Posso cuidar disso por <b style="color:#fbbf24">' + cost + ' moedas</b>.'}</div><button class="btn pri" id="n-heal" ${miss <= 0 ? 'disabled style="opacity:.5"' : ''}>Curar (${cost} moedas)</button> <span style="margin-left:8px;color:var(--mut);font-size:12px">Você tem ${invCount('coin')} moedas.</span>`); const b = $('n-heal'); if (b) b.onclick = () => { if (miss <= 0) return; if (invCount('coin') < cost) { toast('Moedas insuficientes.', '#fbbf24'); return; } invRemove('coin', cost); P.hp = P.maxHp; sfx('heal'); burst(pcx(P), pcy(P), 16, { col: ['#4ade80', '#fff'], spd: 100, glow: true, life: .6, g: -50 }); toast('Totalmente curado!', '#86efac'); render(); G.invChanged = true; }; };
    render();
  } else {
    let tab = 'buy'; const render = () => {
      const coins = invCount('coin'); let rows = '';
      if (tab === 'buy') { for (const id of SHOPS[n.type]()) { const it = IT[id], price = itemValue(id); rows += `<div class="shop-row" data-buy="${id}"><i class="ic ${iconClass(id)}"></i><div style="flex:1"><div style="font-weight:700;color:${tierCol(id)}">${escHtml(it.n)}</div></div><div style="color:${coins >= price ? '#fbbf24' : '#f87171'};font-weight:700">${price} ●</div></div>`; } }
      else { const seen = new Map(); G.P.inv.forEach((s, i) => { if (s && s.id !== 'coin') seen.set(s.id, (seen.get(s.id) || 0) + s.n); }); for (const [id, cnt] of seen) { const it = IT[id]; rows += `<div class="shop-row" data-sell="${id}"><i class="ic ${iconClass(id)}"></i><div style="flex:1"><div style="font-weight:700;color:${tierCol(id)}">${escHtml(it.n)} <span style="color:var(--mut);font-weight:400">×${cnt}</span></div></div><div style="color:#86efac;font-weight:700">+${sellPrice(id)} ●</div></div>`; } if (!rows) rows = '<div style="color:var(--mut);padding:10px">Você não tem itens para vender.</div>'; }
      setHTML(`<div class="tabs"><div class="tab ${tab === 'buy' ? 'on' : ''}" id="t-buy">Comprar</div><div class="tab ${tab === 'sell' ? 'on' : ''}" id="t-sell">Vender (1/3 do valor)</div><span style="margin-left:auto;color:#fbbf24;font-weight:700;font-size:13px">● ${coins}</span></div><div style="max-height:46vh;overflow-y:auto">${rows}</div><div style="font-size:11px;color:var(--mut);margin-top:6px">Shift+clique: ${tab === 'buy' ? 'comprar 10' : 'vender tudo'}</div>`);
      $('t-buy').onclick = () => { tab = 'buy'; render(); }; $('t-sell').onclick = () => { tab = 'sell'; render(); };
      box.querySelectorAll('[data-buy]').forEach(el => { const id = el.dataset.buy; el.onmouseenter = ev => showTip(tipHTML(id), ev); el.onmousemove = moveTip; el.onmouseleave = hideTip; el.onclick = ev => { const n_ = ev.shiftKey && stackMax(id) > 1 ? 10 : 1, price = itemValue(id) * n_; if (invCount('coin') < price) { toast('Moedas insuficientes.', '#fbbf24'); return; } if (!invCanAdd(id, n_)) { toast('Inventário cheio.', '#fbbf24'); return; } invRemove('coin', price); invAdd(id, n_); sfx('coin'); render(); }; });
      box.querySelectorAll('[data-sell]').forEach(el => { const id = el.dataset.sell; el.onclick = ev => { const have = invCount(id), n_ = ev.shiftKey ? have : 1; invRemove(id, n_); invAdd('coin', sellPrice(id) * n_); sfx('coin'); render(); }; });
    };
    render();
  }
}
