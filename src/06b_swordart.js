/* ============================================================
   06b_swordart: arte PIXEL A PIXEL das 80 espadas dos Tiers 7–10
   (as 120 primeiras usam o desenho vetorial de 06_icons.js).
   Cada espada é pintada no seu próprio buffer RGBA, em tamanho real
   (1 pixel do sprite = 1 pixel do mundo), como nos sprites dos chefes:
     - silhueta única (lâmina + guarda + cabo + pomo + extras),
     - bisel de 2 tons: gume claro em cima, dorso escuro embaixo (luz de cima/esquerda),
     - contorno escuro de 1 px em volta da silhueta,
     - gemas, runas, rachaduras e núcleos com rampa própria e pixels emissivos.
   As espadas são descritas por uma receita (look.art2) interpretada por
   ART2[family], ART2_GUARD[style], ART2_GRIP[style], ART2_POMMEL[style] e
   ART2_BACK/ART2_FRONT[extra]; nenhuma receita repete a combinação de outra.
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const ART2_CACHE = new Map();
const ART2_OUT = [7, 5, 12];          // contorno (quase preto, levemente violeta)

// ---------- rampas de cor ----------
// 7 tons: 0 = sombra funda (azulada), 3 = cor base, 6 = brilho quase branco
function a2r(hex, o) {
  o = o || {};
  const c = hex2rgb(hex), dk = o.dk === undefined ? .92 : o.dk, lt = o.lt === undefined ? .58 : o.lt, hue = o.hue === undefined ? 1 : o.hue;
  const T = [-.9, -.66, -.36, 0, .28, .56, .88], out = [];
  for (const t of T) {
    let r, g, b;
    if (t < 0) { const k = 1 + t * dk; r = c[0] * k - (-t) * 6 * hue; g = c[1] * k * (1 - (-t) * .08); b = c[2] * k + (-t) * 34 * hue; }
    else { r = c[0] + (255 - c[0]) * t * lt; g = c[1] + (255 - c[1]) * t * lt * .96; b = c[2] + (255 - c[2]) * t * lt * .8; }
    out.push([clamp(Math.round(r), 0, 255), clamp(Math.round(g), 0, 255), clamp(Math.round(b), 0, 255)]);
  }
  return out;
}
// afasta a cor da guarda da cor da lâmina (para a guarda nunca "sumir" no desenho)
function a2sep(gc, bc) {
  const g = hex2rgb(gc), b = hex2rgb(bc);
  const d = Math.abs(g[0] - b[0]) + Math.abs(g[1] - b[1]) + Math.abs(g[2] - b[2]);
  if (d > 96) return gc;
  const dark = (g[0] * .3 + g[1] * .3 + g[2] * .3) < 120;
  const t = mix(g, dark ? [232, 238, 250] : [24, 26, 40], .62);
  return '#' + t.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
const a2em = (b, x, y, ramp, t) => { bpSet(b, x, y, ramp, t); const i = y * b.w + x; if (i >= 0 && i < b.em.length) b.em[i] = 1; };

// ---------- máscaras ----------
function a2sw(b, x0, x1, prof, ofs, cy) {          // varredura horizontal com perfil de meia-largura
  const m = new Uint8Array(b.w * b.h), n = Math.max(1, Math.round(x1 - x0));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = Math.round(x0 + i), hw = Math.max(.45, prof(t)), c = cy + (ofs ? ofs(t) : 0);
    const y0 = Math.round(c - hw), y1 = Math.round(c + hw);
    for (let y = y0; y <= y1; y++) if (x >= 0 && x < b.w && y >= 0 && y < b.h) m[y * b.w + x] = 1;
  }
  return m;
}
function a2diag(b, pts, wfn, ramp, t0, o) {        // faixa curva (gume de foice / gancho)
  const P = bpCurve(pts, 12), m = bpStroke(b.w, b.h, P, 1.2);
  for (let i = 0; i < P.length - 1; i++) { const t = i / (P.length - 1); bpStroke(b.w, b.h, [P[i], P[i + 1]], Math.max(1, wfn(t)), m); }
  a2paint(b, m, ramp, {}, { sd: 7 });
  return m;
}
function a2edgeMask(b, m, side) {   // pixels de uma borda da máscara (top/left/right/bottom)
  const out = new Uint8Array(b.w * b.h), at = (x, y) => (x < 0 || y < 0 || x >= b.w || y >= b.h) ? 0 : m[y * b.w + x];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!m[y * b.w + x]) continue;
    if (side === 'top' ? !at(x, y - 1) : side === 'bottom' ? !at(x, y + 1) : side === 'left' ? !at(x - 1, y) : !at(x + 1, y)) out[y * b.w + x] = 1;
  }
  return out;
}
function a2outline(b) {   // contorno escuro de 1 px fora da silhueta (ignora halo e pixels emissivos)
  const w = b.w, h = b.h, al = i => b.d[i * 4 + 3], add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (al(i) < 250 || b.em[i]) continue;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx; if (al(k) === 0) add.push(k);
    }
  }
  for (const k of add) { const j = k * 4; b.d[j] = ART2_OUT[0]; b.d[j + 1] = ART2_OUT[1]; b.d[j + 2] = ART2_OUT[2]; b.d[j + 3] = 255; b.rp[k] = null; }
  return b;
}
function a2glowDots(b, x, y, n, r, col, sd) {       // poeira luminosa (alfa parcial)
  for (let i = 0; i < n; i++) {
    const a = hash2(i, 1, sd) * TAU, d = r * (.5 + hash2(i, 2, sd) * .75);
    bpPut(b, Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * .75), col, 80 + hash2(i, 3, sd) * 120);
  }
}

// ---------- pintura de uma "run" vertical da lâmina (bisel) ----------
function a2run(bb, x, y0, n, ramp, st, S) {
  const set = (i, t, rp) => { const y = y0 + i; bpSet(bb, x, y, rp || ramp, t); if (st.hot) bb.em[y * bb.w + x] = 1; };
  if (st.rim && n >= 2) {                 // lâmina escura: gume luminoso
    set(0, 4.4, S.R.hot); if (n > 2) set(n - 1, 4, S.R.hot); else set(1, 3.4, S.R.hot);
    if (n > 4) { set(1, 2.6); set(n - 2, 2.2); for (let i = 2; i < n - 2; i++) set(i, 3.1); }
    return;
  }
  if (n <= 1) { set(0, st.single ? 4.2 : 3.6); return; }
  if (n === 2) { set(0, st.single ? 2.2 : 4.8); set(1, st.single ? 5.4 : 1.7); return; }
  if (st.single) {                      // um só gume: dorso escuro em cima, fio claro embaixo
    set(0, .85); set(1, 2.1); set(n - 1, 6); if (n > 3) set(n - 2, 4.9);
    for (let i = 2; i < n - 2; i++) set(i, 3.05 + (st.facets ? ((x / 3 | 0) % 2 ? 1 : -.6) : 0));
    if (n >= 8) set(3, 4.1);
    return;
  }
  set(0, 5.9); set(1, 4.5);              // gume de cima (luz)
  set(n - 1, .95); if (n > 2) set(n - 2, 2.1);
  for (let i = 2; i < n - 2; i++) set(i, 3.0);
  if (n >= 9) set(2, 4.5); if (n >= 13) set(3, 3.75);   // segundo bisel (luz contínua)
  if (st.facets) { const q = (x / 4 | 0) % 2; for (let i = 2; i < n - 2; i++) set(i, 3.0 + (q ? 1.15 : -.55)); if (n > 3) set(Math.floor(n / 2), 4.8); }
  if (n >= 7) { const c = Math.floor(n / 2); set(c, 1.9); if (n >= 9) set(c - 1, 4.3); }   // vinco central
  if (n >= 10) set(2, 4.8);
  if (st.bone && hash2(x, 3, S.sd) > .8) set(1 + ((hash2(x, 4, S.sd) * (n - 2)) | 0), 1.7);
  if (st.mech) { set(1, 4.9); if (x % 7 < 3) set(2, 1.7); }
}

// ponta de lâmina: hw cai suavemente a partir de t0 (0..1) até 0.4 na ponta
const a2tip = (hw, t, t0, p) => t < t0 ? hw : Math.max(.4, hw * Math.pow(1 - (t - t0) / (1 - t0), p === undefined ? 1.5 : p));

// pintura por colunas: cada "run" vertical recebe o bisel (luz em cima, sombra embaixo)
function a2paint(bb, m, ramp, st, S) {
  st = st || {};
  for (let x = 0; x < bb.w; x++) {
    let y = 0;
    while (y < bb.h) {
      if (!m[y * bb.w + x]) { y++; continue; }
      const y0 = y; while (y < bb.h && m[y * bb.w + x]) y++;
      a2run(bb, x, y0, y - y0, ramp, st, S);
    }
  }
  return m;
}

// ================= LÂMINAS =================
const ART2 = {};
ART2.straight = (b, S) => {           // reta clássica
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - (S.taper || .22) * t), t, .62, 1.7);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
};
ART2.broad = (b, S) => {              // larga, ponta arredondada
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .16 * t), t, .74, .62);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { fuller: 1 });
};
ART2.slab = (b, S) => {               // lâmina-machado, ponta truncada e lascada
  const { x0, L, w, cy } = S, prof = t => (t > .9 ? Math.max(1.2, w * Math.pow(1 - (t - .9) / .1, .8) * .55) : w * (1 - .05 * t) + (hash2(Math.round(t * 34), 3, S.sd) > .78 ? .6 : 0));
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { rough: 1, fuller: 1 });
};
ART2.katana = (b, S) => {             // curva suave, um só gume
  const { x0, L, w, cy } = S, bend = S.bend || 3.2, ofs = t => -bend * t * t, prof = t => a2tip(w * (1 - .16 * t), t, .84, 1.1);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.saber = (b, S) => {              // cimitarra: barriga larga e ponta fina
  const { x0, L, w, cy } = S, bend = S.bend || 4.2, ofs = t => -bend * t * t, prof = t => a2tip(w * (1 - .32 * t) * (1 + .3 * Math.sin(PI * t)), t, .78, 1.3);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.fang = (b, S) => {               // presa: muito curvada, afina até a ponta
  const { x0, L, w, cy } = S, bend = S.bend || 5.5, ofs = t => -bend * t * t, prof = t => Math.max(.4, w * Math.pow(1 - t, .8));
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.rapier = (b, S) => {             // agulha finíssima com gume claro
  const { x0, L, w, cy } = S, prof = t => Math.max(.4, (w * .5) * Math.pow(1 - t, .72) + .25);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { thin: 1 });
};
ART2.flamberge = (b, S) => {          // lâmina ondulada
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .12 * t) + (S.wave || 1.2) * Math.sin(t * (S.freq || 7) * PI * 2) * .7, t, .8, 1.2);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
};
ART2.serrated = (b, S) => {           // dentes de serra
  const { x0, L, w, cy } = S, teeth = t => (Math.sin(t * (S.freq || 12) * PI) > .3 ? 1.1 : 0), prof = t => a2tip(w * (1 - .14 * t) + teeth(t), t, .84, 1.1);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
};
ART2.crystal = (b, S) => {            // facetada: gomos largos e ponta de diamante
  const { x0, L, w, cy } = S, prof = t => t < .12 ? w * (.8 + t / .12 * .2) : t < .6 ? w : Math.max(.4, w * Math.pow(1 - (t - .6) / .4, 1.25));
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { facets: 1 });
};
ART2.cleaver = (b, S) => {            // cutelo: dorso reto, corte inclinado
  const { x0, L, w, cy } = S, prof = t => (t > .8 ? Math.max(1.2, w * Math.pow(1 - (t - .8) / .2, .7)) : w), ofs = t => (t > .8 ? (t - .8) / .2 * w * .8 : 0);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.glaive = (b, S) => {             // haste longa + folha
  const { x0, L, w, cy } = S, pole = L * .4, wood = a2r('#5a4028', { lt: .45 });
  bpFill(b, a2sw(b, x0, x0 + pole + 1, () => 1.5, null, cy), wood, 3, { hi: .7, lo: 1 });
  const prof = t => (t < .08 ? w * (.8 + .2 * t / .08) : t < .32 ? w : a2tip(w, t, .62, 1.5));
  S.blade(b, a2sw(b, x0 + pole, x0 + L, prof, null, cy), prof, null, {});
};
ART2.split = (b, S) => {              // bifurcada: dois dentes a partir do meio
  const { x0, L, w, cy } = S, base = L * .44, prof = t => (t < .6 ? w * (1 - .06 * t) : Math.max(.5, w * .62 * Math.pow(1 - (t - .6) / .4, 1.3)));
  S.blade(b, a2sw(b, x0, x0 + base, prof, null, cy), prof, null, {});
  const g = L * .16;
  for (const s of [-1, 1]) {
    const pr = t => Math.max(.45, w * .46 * Math.pow(1 - t, .85)), of = t => s * (w * .5 + g * Math.pow(t, 1.25));
    S.blade(b, a2sw(b, x0 + base - 2, x0 + L, pr, of, cy), pr, of, {});
  }
};
ART2.trident = (b, S) => {            // três pontas
  const { x0, L, w, cy } = S;
  bpFill(b, a2sw(b, x0, x0 + L * .58, t => w * (1 - .22 * t), null, cy), S.R.blade, 3, { hi: 1.1, lo: 1 });
  for (const s of [0, -1, 1]) {
    const off = s * w * 1.45, pr = t => Math.max(.45, w * .42 * Math.pow(1 - t, .8)), of = t => off * (1 - t * .1);
    S.blade(b, a2sw(b, x0 + L * .5, x0 + L, pr, of, cy), pr, of, {});
  }
};
ART2.scythe = (b, S) => {             // foice: haste + gume curvo perpendicular
  const { x0, L, w, cy } = S, side = S.side || -1, pole = L * .52, wood = a2r('#4a3424', { lt: .45 });
  bpFill(b, a2sw(b, x0, x0 + pole + 3, () => 1.6, null, cy), wood, 3, { hi: .7, lo: 1 });
  const bx = x0 + pole, pts = [[bx - 4, cy + side * 2], [bx + L * .18, cy + side * (w * 1.15)], [bx + L * .33, cy + side * (w * 1.95)], [bx + L * .46, cy + side * (w * 2.2)]];
  const m = a2diag(b, pts, t => Math.max(1.6, w * 1.35 * (1 - t * .8)), S.R.blade, 3);
  S.extraMasks.push(m);
};
ART2.chain = (b, S) => {              // lâmina segmentada (chicote de lâminas)
  const { x0, L, w, cy } = S, seg = S.seg || 5;
  for (let k = 0; k < seg; k++) {
    const a = x0 + L * k / seg, c = x0 + L * (k + .84) / seg, off = Math.sin(k * 1.3) * .9;
    const pr = t => Math.max(.55, w * (1 - k / seg * .5) * (1 - t * .22));
    S.blade(b, a2sw(b, a, c, pr, () => off, cy), pr, () => off, {});
    if (k < seg - 1) bpSet(b, Math.round(c + 1), Math.round(cy + off), S.R.hot, 4);
  }
};
ART2.flame = (b, S) => {              // lâmina de chama
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .2 * t) + .9 * Math.sin(t * 9 * PI) * (1 - t), t, .82, 1.2);
  const m = a2sw(b, x0, x0 + L, prof, null, cy);
  S.blade(b, m, prof, null, { hot: 1 });
  for (let k = 0; k < 3; k++) {
    const t = .2 + k * .26, x = Math.round(x0 + L * t), hh = 2 + (k % 2);
    for (let j = 1; j <= hh; j++) { a2em(b, x - j, Math.round(cy - w - j), S.R.hot, 5 - j * .6); if (j > 1) a2em(b, x + 1, Math.round(cy + w + j - 1), S.R.hot, 4 - j * .5); }
  }
};
ART2.mech = (b, S) => {               // mecânica: bloco chanfrado, respiros e rebites
  const { x0, L, w, cy } = S, prof = t => (t > .76 ? Math.max(1.4, w * Math.pow(1 - (t - .76) / .24, .8)) : w), ofs = t => (t > .76 ? -(t - .76) * 2.2 : 0);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { mech: 1 });
  for (let k = 1; k <= 3; k++) { const x = Math.round(x0 + L * (.2 + k * .16)); for (let y = -1; y <= 1; y++) bpSet(b, x, Math.round(cy + y), S.R.dark, 1); }
  for (let k = 0; k < 4; k++) a2em(b, Math.round(x0 + L * (.1 + k * .2)), Math.round(cy - w + .4), S.R.hot, 4);
};
ART2.bone = (b, S) => {               // orgânica: ossos irregulares
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .2 * t) + (hash2(Math.round(t * 22), 7, S.sd) - .5) * 1.5, t, .84, 1.2);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { bone: 1, noFuller: 1 });
};
ART2.thorn = (b, S) => {              // farpas nas duas bordas
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .12 * t) + (Math.sin(t * 15 * PI) > .5 ? 1.15 : 0), t, .86, 1);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
};
ART2.hook = (b, S) => {               // khopesh: ponta em gancho
  const { x0, L, w, cy } = S, main = L * .68, prof = t => Math.max(.5, w * (1 - .1 * t));
  S.blade(b, a2sw(b, x0, x0 + main, prof, null, cy), prof, null, {});
  const pts = [[x0 + main - 2, cy - 1], [x0 + main + L * .12, cy - w * .6], [x0 + main + L * .18, cy - w * 1.35], [x0 + main + L * .1, cy - w * 2.1]];
  const m = a2diag(b, pts, t => Math.max(1, w * .68 * (1 - t * .6)), S.R.blade, 3); S.extraMasks.push(m);
};
ART2.whip = (b, S) => {               // espada-chicote fina ondulando
  const { x0, L, w, cy } = S, ofs = t => Math.sin(t * 4.2 * PI) * 2.8, prof = t => Math.max(.45, w * .8 * Math.pow(1 - t, .6));
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { thin: 1, noFuller: 1 });
};
ART2.double = (b, S) => {             // duas lâminas opostas
  const { x0, L, w, cy } = S, back = L * .55, prof = t => Math.max(.45, w * Math.pow(1 - t, .8));
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
  const m = a2sw(b, x0 - back, x0 + 1, prof, null, cy);
  bpFill(b, m, S.R.blade, 3, { hi: 1.2, lo: 1.1, r2: true }); bpEdge(b, m, S.R.blade, 1, 'dr');
  const e = a2edgeMask(b, m, 'top'); for (let i = 0; i < e.length; i++) if (e[i]) bpSet(b, i % b.w, (i / b.w) | 0, S.R.blade, 5.4);
  S.extraMasks.push(m);
};
ART2.orb = (b, S) => {                // lâmina de energia flutuante (núcleo partido)
  const { x0, L, w, cy } = S, seg = 3;
  for (let k = 0; k < seg; k++) {
    const a = x0 + L * (k * .3 + .03), c = a + L * .26, pr = t => Math.max(.7, w * .75 * (1 - (k * .3 + t * .26) * .75));
    const m = a2sw(b, a, c, pr, null, cy);
    bpFill(b, m, S.R.hot, 4, { hi: 1.5, lo: .3, r2: true });
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const i = y * b.w + x; if (!m[i]) continue; const up = y === 0 || !m[i - b.w], dn = y === b.h - 1 || !m[i + b.w]; if (up || dn) bpSet(b, x, y, S.R.dark, 1); else b.em[i] = 1; }
    S.extraMasks.push(m);
  }
};
ART2.wing = (b, S) => {               // lâmina alada
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .2 * t) * (t < .08 ? .5 + t * 6 : 1), t, .8, 1.3);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
  for (const s of [-1, 1]) {
    const pts = [[x0 + 1, cy + s * 2], [x0 - 4, cy + s * (w + 5)], [x0 + 7, cy + s * (w + 8)], [x0 + 17, cy + s * (w + 5)]];
    const m = a2diag(b, pts, t => 2.4 * (1 - t * .45), S.R.guard, 3); S.extraMasks.push(m);
  }
};

ART2.zweihander = (b, S) => {         // montante com dois ganchos de aparar na base
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .1 * t), t, .8, .9);
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, {});
  for (const s of [-1, 1]) {           // ganchos (parry hooks)
    const bx = x0 + Math.round(L * .13), m = bpPoly(b.w, b.h, [[bx, cy + s * (w * .6)], [bx + 4, cy + s * (w + 4)], [bx + 7, cy + s * (w + 3.2)], [bx + 5, cy + s * (w * .4)]]);
    bpFill(b, m, S.R.blade, 3, { hi: 1.2, lo: 1 }); bpEdge(b, m, S.R.blade, 1, 'dr');
    const e = a2edgeMask(b, m, s < 0 ? 'top' : 'bottom'); for (let i = 0; i < e.length; i++) if (e[i]) bpSet(b, i % b.w, (i / b.w) | 0, S.R.blade, 5.2);
    S.extraMasks.push(m);
  }
};
ART2.leaf = (b, S) => {               // folha ogival (larga no meio, bico fino)
  const { x0, L, w, cy } = S, prof = t => Math.max(.5, w * Math.sin(PI * Math.pow(.16 + t * .84, 1.15)) * (t < .2 ? .85 + t : 1));
  S.blade(b, a2sw(b, x0, x0 + L, prof, null, cy), prof, null, { facets: 1 });
};
ART2.machete = (b, S) => {            // facão com ponta virada para cima
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .1 * t), t, .72, .8), ofs = t => -Math.pow(t, 2.2) * (S.bend || 3.4);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.dao = (b, S) => {                // dao: larga, levemente curva, ponta arredondada
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (1 - .15 * t), t, .82, .55), ofs = t => -Math.pow(t, 1.6) * (S.bend || 2.2);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};
ART2.shotel = (b, S) => {             // foice curva (crescente)
  const { x0, L, w, cy } = S, prof = t => a2tip(w * (.45 + .75 * Math.sin(PI * Math.pow(t, .9))), t, .9, .6), ofs = t => -Math.pow(t, 1.7) * (S.bend || 8);
  S.blade(b, a2sw(b, x0, x0 + L, prof, ofs, cy), prof, ofs, { single: 1 });
};

// ================= GUARDAS (grandes, é o que dá personalidade) =================
const ART2_GUARD = {};
const a2gl = S => Math.max(7, Math.round(S.w * 2.05 + 3));   // meia-altura da guarda
ART2_GUARD.none = () => { };
ART2_GUARD.cross = (b, S) => {   // cruz com perfil de diamante, bolas nas pontas e langet na lâmina
  const { gx, cy } = S, gl = a2gl(S) + 1, R = S.R.guard;
  for (let y = -gl; y <= gl; y++) {
    const k = 1 - Math.abs(y) / (gl + 1), hw = (y === 0 ? 2 : k > .6 ? 2 : 1);
    for (let x = -hw; x <= hw; x++) bpSet(b, gx + x, cy + y, R, 3 + (x < 0 ? 1.1 : x > 0 ? -.7 : .4));
  }
  bpEdge(b, bpSeg(b.w, b.h, gx, cy - gl, gx, cy + gl, 5), R, 1, 'dr');
  for (const s of [-1, 1]) {
    const m = bpEll(b.w, b.h, gx, cy + s * (gl + 1), 2, 2);
    a2paint(b, m, R, {}, S);
    bpSet(b, gx - 1, Math.round(cy + s * (gl + 1)) - 1, R, 6);
  }
  for (let x = 0; x < 4; x++) for (let y = -1; y <= 1; y++) bpSet(b, gx + x, cy + y, R, y < 0 ? 5 : y > 0 ? 2 : 3.6);   // langet
  if (S.S.gem) S.gemMask = bpEll(b.w, b.h, gx, cy, 2.5, 2.5);
};
ART2_GUARD.swept = (b, S) => {   // quillons curvos (sabre): abrem para frente e viram para cima
  const { gx, cy } = S, gl = a2gl(S) + 1, R = S.R.guard;
  for (const s of [-1, 1]) {
    const pts = [[gx + 1, cy + s * 2], [gx + 5, cy + s * (gl * .5)], [gx + 6, cy + s * (gl * .82)], [gx + 2, cy + s * gl], [gx - 2, cy + s * (gl + 1)]];
    const m = bpStroke(b.w, b.h, bpCurve(pts, 10), t => 3.6 - t * 1.9); a2paint(b, m, R, {}, S);
    const bx = Math.round(gx - 2), by = Math.round(cy + s * (gl + 1)), md = bpEll(b.w, b.h, bx, by, 1.6, 1.6); a2paint(b, md, R, {}, S);
  }
  for (let y = -2; y <= 2; y++) for (let x = -1; x <= 1; x++) bpSet(b, gx + x, cy + y, R, x < 0 ? 5 : x > 0 ? 2 : (y < 0 ? 4.6 : 3));
};
ART2_GUARD.ring = (b, S) => {    // anéis flutuantes em volta da base
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S);
  for (let a = 0; a < 80; a++) {
    const t = a / 80 * TAU, rx = 4.2, ry = gl + 1;
    bpSet(b, Math.round(gx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), R, 2 + (Math.sin(t) < 0 ? 2.2 : 0));
  }
  for (let a = 0; a < 48; a++) { const t = a / 48 * TAU; bpSet(b, Math.round(gx + 4 + Math.cos(t) * 3), Math.round(cy + Math.sin(t) * (gl * .62)), S.R.hot, 4); }
  bpSet(b, gx, cy, R, 5);
};
ART2_GUARD.wing = (b, S) => {    // asas metálicas abertas
  const { gx, cy, w } = S, R = S.R.guard, gl = a2gl(S);
  for (const s of [-1, 1]) {
    const m = bpUnion(
      bpPoly(b.w, b.h, [[gx - 1, cy + s * 2], [gx - 9, cy + s * (gl - 1)], [gx - 4, cy + s * (gl + 3)], [gx + 3, cy + s * (gl * .55)]]),
      bpSeg(b.w, b.h, gx - 5, cy + s * (gl * .8), gx + 1, cy + s * 2, 2.2));
    a2paint(b, m, R, {}, S);
    for (let k = 0; k < 3; k++) bpSet(b, gx - 6 + k * 2, Math.round(cy + s * (gl - 1 + k * 1.4)), R, 5);
  }
  bpSet(b, gx, cy, S.R.hot2, 4);
};
ART2_GUARD.gem = (b, S) => {     // gema central com quatro garras curvas
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S) + 1;
  for (const s of [-1, 1]) for (const d of [-1, 1]) {
    const m = bpStroke(b.w, b.h, bpCurve([[gx + d * 1.5, cy + s * 2], [gx + d * 4, cy + s * (gl * .5)], [gx + d * 2, cy + s * gl]], 6), t => 3 - t * 1.2);
    a2paint(b, m, R, {}, S);
  }
  S.gemMask = bpEll(b.w, b.h, gx, cy, 3.4, 3.4);
};
ART2_GUARD.skull = (b, S) => {   // caveira com olhos acesos
  const { gx, cy } = S, bone = a2r('#efe7d2', { lt: .4 }), gl = a2gl(S) * .62;
  const m = bpUnion(bpEll(b.w, b.h, gx, cy - .5, 4, 3.6), bpPoly(b.w, b.h, [[gx - 2, cy + 2], [gx + 2, cy + 2], [gx + 1.2, cy + 4.6], [gx - 1.2, cy + 4.6]]));
  a2paint(b, m, bone, {}, S);
  a2em(b, gx - 1, cy, S.R.hot2, 5); a2em(b, gx + 2, cy, S.R.hot2, 5); bpSet(b, gx + 1, cy + 2, bone, 1);
  for (const s of [-1, 1]) { bpSet(b, gx + s * 5, Math.round(cy + s * gl), bone, 4); bpSet(b, gx + s * 6, Math.round(cy + s * (gl + 1)), bone, 2); }
};
ART2_GUARD.cog = (b, S) => {     // engrenagem
  const { gx, cy, w } = S, R = S.R.guard, gl = a2gl(S) * .8;
  a2paint(b, bpEll(b.w, b.h, gx, cy, 4.6, gl), R, {}, S);
  for (let k = 0; k < 20; k++) { const t = k / 20 * TAU, x = Math.round(gx + Math.cos(t) * 6.2), y = Math.round(cy + Math.sin(t) * (gl + 1.6)); bpSet(b, x, y, R, 4.6); bpSet(b, x, y + 1, R, 1.6); }
  a2em(b, gx, cy, S.R.hot2, 4);
};
ART2_GUARD.thorn = (b, S) => {   // galhos com espinhos
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S) + 2;
  for (const s of [-1, 1]) {
    const pts = [[gx - 1, cy + s * 1], [gx - 8, cy + s * 4], [gx - 3, cy + s * gl], [gx + 5, cy + s * (gl - 1)]];
    const m = bpStroke(b.w, b.h, bpCurve(pts, 10), t => 2.8 - t * 1); a2paint(b, m, R, {}, S);
    for (let k = 0; k < 3; k++) { bpSet(b, gx - 6 + k * 3, Math.round(cy + s * (4 + k)), R, 6); bpSet(b, gx - 7 + k * 3, Math.round(cy + s * (5 + k)), R, 3); }
  }
};
ART2_GUARD.feather = (b, S) => { // leque de penas
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S) + 3;
  for (let k = -3; k <= 3; k++) {
    const a = k * .34, len = gl - Math.abs(k) * .8;
    const m = bpStroke(b.w, b.h, bpCurve([[gx, cy], [gx - 4, cy + Math.sin(a) * len * .65], [gx - 2 + Math.cos(a) * 2.5, cy + Math.sin(a) * len]], 8), t => 2.8 - t * 1.2);
    a2paint(b, m, k % 2 ? R : a2r('#e8dcc0', { lt: .5 }), {}, S);
  }
};
ART2_GUARD.halo = (b, S) => {    // círculo de runas flutuantes
  const { gx, cy } = S, gl = a2gl(S) + 2;
  for (let k = 0; k < 18; k++) { const t = k / 18 * TAU, x = Math.round(gx + Math.cos(t) * 7), y = Math.round(cy + Math.sin(t) * gl); bpSet(b, x, y, S.R.hot, 4.6); b.em[y * b.w + x] = 1; if (k % 3 === 0) { bpPut(b, x + 1, y, S.R.hot[6], 130); bpPut(b, x, y + 1, S.R.hot[6], 110); } }
  bpSet(b, gx, cy, S.R.guard, 5); bpSet(b, gx - 1, cy, S.R.guard, 3); bpSet(b, gx + 1, cy, S.R.guard, 3);
};
ART2_GUARD.claw = (b, S) => {    // garras
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S) + 1;
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const x0 = gx - 1 + k * 2, pts = [[x0, cy + s * 1], [x0 - 5, cy + s * (4 + k)], [x0 + 7, cy + s * gl]];
    const m = bpStroke(b.w, b.h, bpCurve(pts, 8), t => 2.8 - t * 1.6); a2paint(b, m, R, {}, S);
    bpSet(b, Math.round(x0 + 5), Math.round(cy + s * (gl - .5)), R, 6);
  }
};
ART2_GUARD.dragon = (b, S) => {  // cabeça de dragão mordendo a lâmina
  const { gx, cy, w } = S, R = S.R.guard, gl = a2gl(S);
  const m = bpUnion(bpEll(b.w, b.h, gx - 1, cy, 4.4, 3.8), bpPoly(b.w, b.h, [[gx + 1, cy - 3.4], [gx + 6, cy - 6], [gx + 3.4, cy - 1.2], [gx + 6, cy + 3.4], [gx + 1, cy + 3.4]]));
  a2paint(b, m, R, {}, S);
  a2em(b, gx - 2, Math.round(cy - .5), S.R.hot, 5); a2em(b, gx + 4, Math.round(cy - 4), S.R.hot, 4);
  for (const s of [-1, 1]) { bpSet(b, gx - 3, Math.round(cy + s * 3), R, 4); bpSet(b, gx - 4, Math.round(cy + s * (gl)), R, 3); }
};
ART2_GUARD.seal = (b, S) => {    // selo rúnico em losango
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S) + 1;
  const m = bpPoly(b.w, b.h, [[gx - 4.2, cy], [gx, cy - gl], [gx + 4.2, cy], [gx, cy + gl]]);
  a2paint(b, m, R, {}, S);
  for (let k = 0; k < 3; k++) { a2em(b, gx, Math.round(cy - gl * .45 + k * gl * .45), S.R.hot, 4); }
  bpSet(b, gx - 2, cy, R, 4); bpSet(b, gx + 2, cy, R, 4);
};
ART2_GUARD.orb = (b, S) => {     // orbe suspenso no lugar da guarda
  const { gx, cy } = S, gl = a2gl(S);
  S.gemMask = bpEll(b.w, b.h, gx, cy, 2.8, 2.8);
  for (let k = 0; k < 10; k++) { const t = k / 10 * TAU, x = Math.round(gx + Math.cos(t) * 4.8), y = Math.round(cy + Math.sin(t) * gl); bpPut(b, x, y, S.R.hot[5], 210); b.em[y * b.w + x] = 1; }
};
ART2_GUARD.chains = (b, S) => {  // elos pendurados
  const { gx, cy } = S, R = S.R.guard, gl = a2gl(S);
  bpSet(b, gx, cy, R, 5);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const y = Math.round(cy + s * (2 + k * 2.6)), x = gx + (k % 2 ? 1 : -2);
    for (let a = 0; a < 8; a++) { const t = a / 8 * TAU; bpSet(b, Math.round(x + Math.cos(t) * 1.8), Math.round(y + Math.sin(t) * 2.1), R, k % 2 ? 2 : 4); }
  }
};

// ================= CABOS / POMOS =================
const ART2_GRIP = {};
function a2gripBase(b, S, ramp, td) {
  const { gx, cy } = S, x0 = gx - 5, x1 = gx - 1;
  for (let x = x0; x <= x1; x++) for (let y = -2; y <= 2; y++) bpSet(b, x, cy + y, ramp, y === -2 ? 1.4 : y === 2 ? 1.1 : y === 0 ? (td || 3) : 2.2);
  return { x0, x1 };
}
ART2_GRIP.wrap = (b, S) => {      // couro enrolado
  const { x0, x1 } = a2gripBase(b, S, S.R.grip, 3);
  for (let x = x0; x <= x1; x++) { bpSet(b, x, S.cy - 1, S.R.grip, (x % 2) ? 4.2 : 3); bpSet(b, x, S.cy + 1, S.R.grip, (x % 2) ? 1.6 : 2.4); }
};
ART2_GRIP.leather = (b, S) => {   // couro com costura clara
  const { x0, x1 } = a2gripBase(b, S, S.R.grip, 2.6);
  for (let x = x0 + 1; x <= x1; x += 2) { bpSet(b, x, S.cy - 2, S.R.grip, 4.6); bpSet(b, x, S.cy + 2, S.R.grip, 4.2); }
};
ART2_GRIP.bone = (b, S) => {      // cabo de osso com nós
  const bone = a2r('#efe6d0', { lt: .42 }), { gx, cy } = S;
  a2gripBase(b, S, bone, 3.2);
  for (const x of [gx - 6, gx - 3]) { bpSet(b, x, cy - 3, bone, 4.4); bpSet(b, x, cy + 3, bone, 1.4); }
};
ART2_GRIP.metal = (b, S) => {     // cabo metálico com anéis
  const R = S.R.guard, { gx, cy } = S;
  a2gripBase(b, S, R, 2.8);
  for (const x of [gx - 4, gx - 2]) for (let y = -3; y <= 3; y++) bpSet(b, x, cy + y, R, 1.2);
};
ART2_GRIP.crystal = (b, S) => {   // cabo cristalino translúcido
  const { gx, cy } = S;
  for (let x = gx - 5; x <= gx - 1; x++) for (let y = -2; y <= 2; y++) bpPut(b, x, cy + y, S.R.hot[4], 215);
  for (const x of [gx - 4, gx - 2]) bpSet(b, x, cy, S.R.hot, 6);
  for (let y = -2; y <= 2; y++) bpSet(b, gx - 5, cy + y, S.R.dark, 1);
};
ART2_GRIP.void = (b, S) => {      // cabo do vazio com pontos de luz
  const { gx, cy } = S;
  a2gripBase(b, S, S.R.dark, 1.2);
  a2em(b, gx - 4, cy, S.R.hot, 5); a2em(b, gx - 2, cy - 1, S.R.hot, 4); a2em(b, gx - 3, cy + 1, S.R.hot, 3.6);
};
ART2_GRIP.chainwrap = (b, S) => { // corrente enrolada
  const R = S.R.guard, { gx, cy } = S;
  for (let x = gx - 5; x <= gx - 1; x++) for (let y = -2; y <= 2; y++) bpSet(b, x, cy + y, S.R.dark, 1);
  for (let x = gx - 5; x <= gx - 1; x += 2) for (let a = 0; a < 6; a++) { const t = a / 6 * TAU; bpSet(b, Math.round(x + Math.cos(t) * 1.3), Math.round(cy + Math.sin(t) * 2.3), R, 4); }
};
const ART2_POMMEL = {};
ART2_POMMEL.gem = (b, S) => { S.pommelMask = bpEll(b.w, b.h, S.gx - 8, S.cy, 2.7, 2.7); };
ART2_POMMEL.ring = (b, S) => {
  const R = S.R.guard, x = S.gx - 8, y = S.cy;
  for (let a = 0; a < 14; a++) { const t = a / 14 * TAU; bpSet(b, Math.round(x + Math.cos(t) * 2.2), Math.round(y + Math.sin(t) * 2.6), R, 3); }
  bpSet(b, x, y, R, 1);
};
ART2_POMMEL.spike = (b, S) => {
  const R = S.R.guard, x = S.gx - 7, y = S.cy, m = bpPoly(b.w, b.h, [[x + 2, y - 2.2], [x - 3, y], [x + 2, y + 2.2]]);
  a2paint(b, m, R, {}, S); bpSet(b, x - 1, y, S.R.hot, 5);
};
ART2_POMMEL.orb = (b, S) => { S.pommelMask = bpEll(b.w, b.h, S.gx - 8, S.cy, 3, 3); };
ART2_POMMEL.none = () => { };

// ================= EXTRAS =================
const ART2_BACK = {}, ART2_FRONT = {};
ART2_BACK.rings = (b, S) => {     // anéis concêntricos atrás da guarda
  [8, 12, 16].forEach((r, k) => {
    for (let a = 0; a < 110; a++) {
      const t = a / 110 * TAU; if (k === 1 && Math.sin(t * 3) < -.3) continue;
      bpPut(b, Math.round(S.gx + 2 + Math.cos(t) * r), Math.round(S.cy + Math.sin(t) * r), S.R.hot[4], 80 + k * 34);
    }
  });
};
ART2_BACK.aura = (b, S) => {      // halo em volta da lâmina
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!S.allMask || !S.allMask[y * b.w + x]) continue;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) bpPut(b, x + dx, y + dy, S.R.hot[5], 62);
  }
};
ART2_BACK.wings = (b, S) => {     // asas de luz
  for (const s of [-1, 1]) {
    const pts = [[S.gx + 2, S.cy + s * 4], [S.gx - 8, S.cy + s * 10], [S.gx + 5, S.cy + s * 15], [S.gx + 26, S.cy + s * 11]];
    const m = bpStroke(b.w, b.h, bpCurve(pts, 12), t => 3.4 - t * 2.4);
    for (let i = 0; i < b.w * b.h; i++) if (m[i]) bpPut(b, i % b.w, (i / b.w) | 0, S.R.hot[5], 105);
  }
};
ART2_BACK.glyphs = (b, S) => {    // glifos flutuantes
  for (let k = 0; k < 8; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.12 + hash2(k, 1, S.sd) * .85)), y = Math.round(S.cy + (hash2(k, 2, S.sd) - .5) * (S.w * 4.5 + 8));
    bpSet(b, x, y, S.R.hot, 4); b.em[y * b.w + x] = 1;
    if (k % 2) { bpPut(b, x - 1, y, S.R.hot[5], 90); bpPut(b, x, y - 1, S.R.hot[5], 90); }
  }
};
ART2_FRONT.motes = (b, S) => { a2glowDots(b, S.gx + S.L * .6, S.cy, 16, S.w * 3.4, S.R.hot[5], S.sd); };
ART2_FRONT.shards = (b, S) => {   // estilhaços flutuantes
  for (let k = 0; k < 4; k++) {
    const x = Math.round(S.gx + S.L * (.3 + k * .18) + (hash2(k, 5, S.sd) - .5) * 7), y = Math.round(S.cy + (k % 2 ? -1 : 1) * (S.w + 6 + hash2(k, 6, S.sd) * 4));
    const m = bpPoly(b.w, b.h, [[x, y - 2.4], [x + 2.2, y], [x, y + 2.4], [x - 1.2, y]]);
    bpFill(b, m, S.R.hot, 4, { hi: 1.4, lo: .4 }); for (let i = 0; i < m.length; i++) if (m[i]) b.em[i] = 1;
    bpPut(b, x - 3, y, S.R.hot[5], 70); bpPut(b, x + 3, y + 1, S.R.hot[5], 60);
  }
};
ART2_FRONT.sparks = (b, S) => {   // faíscas
  for (let k = 0; k < 12; k++) {
    const x = Math.round(S.gx + hash2(k, 7, S.sd) * S.L), y = Math.round(S.cy + (hash2(k, 8, S.sd) - .5) * (S.w * 3.4 + 10));
    bpPut(b, x, y, S.R.hot[5], 150 + hash2(k, 9, S.sd) * 100);
    if (hash2(k, 10, S.sd) > .6) { bpPut(b, x + 1, y, S.R.hot[5], 80); bpPut(b, x - 1, y, S.R.hot[5], 80); }
  }
};
ART2_FRONT.runes = (b, S) => {    // runas acesas na lâmina
  for (let k = 1; k < 6; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.14 + k * .13)), y = Math.round(S.cy + (k % 2 ? -1 : 1));
    a2em(b, x, y, S.R.hot, 5); if (k % 2) a2em(b, x + 1, y + 1, S.R.hot, 4);
  }
};
ART2_FRONT.cracks = (b, S) => {   // rachaduras incandescentes
  let y = 0;
  for (let i = 0; i < S.L * .78; i++) {
    const x = Math.round(S.gx + 4 + S.L * .1 + i);
    if (hash2(i, 11, S.sd) > .5) y += hash2(i, 12, S.sd) > .5 ? 1 : -1;
    y = clamp(y, -S.w + 1, S.w - 1);
    if (hash2(i, 13, S.sd) > .22) a2em(b, x, Math.round(S.cy + y), S.R.hot, 4);
  }
};
ART2_FRONT.petals = (b, S) => {   // pétalas soltas
  for (let k = 0; k < 6; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.18 + k * .14)), y = Math.round(S.cy + (k % 2 ? -1 : 1) * (S.w + 5 + (k % 3) * 2));
    bpSet(b, x, y, S.R.guard, 4); bpSet(b, x + 1, y, S.R.hot, 5); bpSet(b, x, y + 1, S.R.guard, 2);
  }
};
ART2_FRONT.stars = (b, S) => {    // estrelinhas
  for (let k = 0; k < 7; k++) {
    const x = Math.round(S.gx + 4 + hash2(k, 14, S.sd) * (S.L * .92)), y = Math.round(S.cy + (hash2(k, 15, S.sd) - .5) * (S.w * 4 + 8));
    a2em(b, x, y, S.R.hot, 6); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) bpPut(b, x + dx, y + dy, S.R.hot[6], 120);
  }
};
ART2_FRONT.ice = (b, S) => {      // cristais de gelo
  for (let k = 0; k < 5; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.28 + k * .14)), y = Math.round(S.cy - S.w - 3 - (k % 2) * 2);
    bpSet(b, x, y, S.R.hot, 5); bpSet(b, x - 1, y + 1, S.R.hot, 4); bpSet(b, x + 1, y + 1, S.R.hot, 4); b.em[y * b.w + x] = 1;
  }
};
ART2_FRONT.chains = (b, S) => {   // elos soltos
  for (let k = 0; k < 5; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.18 + k * .15)), y = Math.round(S.cy + S.w + 5);
    for (let a = 0; a < 6; a++) { const t = a / 6 * TAU; bpSet(b, Math.round(x + Math.cos(t) * 1.5), Math.round(y + Math.sin(t) * 1.5), S.R.guard, 3); }
  }
};
ART2_FRONT.eyes = (b, S) => {     // olhos na lâmina
  for (let k = 0; k < 2; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.22 + k * .22)), y = Math.round(S.cy - 1);
    bpSet(b, x - 1, y, S.R.dark, 0); bpSet(b, x, y, S.R.dark, 0); a2em(b, x, y, S.R.hot, 5);
  }
};
ART2_FRONT.flames = (b, S) => {   // brasas subindo
  for (let k = 0; k < 9; k++) {
    const x = Math.round(S.gx + 4 + S.L * (.13 + hash2(k, 20, S.sd) * .82)), y = Math.round(S.cy - S.w - 2 - hash2(k, 21, S.sd) * 6);
    a2em(b, x, y, S.R.hot, 4 + (k % 3)); bpPut(b, x, y - 1, S.R.hot[6], 100);
  }
};
ART2_FRONT.lightning = (b, S) => { // arcos elétricos
  for (let k = 0; k < 3; k++) {
    let x = Math.round(S.gx + 4 + S.L * (.28 + k * .2)), y = Math.round(S.cy - S.w - 1);
    for (let i = 0; i < 6; i++) { a2em(b, x, y, S.R.hot, 5); x += hash2(i, k, S.sd) > .5 ? 1 : 0; y -= 1; }
  }
};

// ================= MONTAGEM =================
function art2Paint(sw) {
  const spec = sw.look.art2, S = { S: spec, sd: strSeed(sw.id) % 9999 };
  S.L = clamp((sw.look.len | 0) - 4, 20, 62);        // comprimento da lâmina (a partir da base)
  S.w = clamp((spec.w || 3) * 1.12, 2.0, 6.2);        // meia-espessura máxima
  S.gx = 10;                                         // centro da guarda
  const gl = Math.max(7, Math.round(S.w * 2.05 + 3));
  S.h = Math.round(Math.max(34, gl * 2 + 10, S.w * 6 + 14, spec.hExtra || 0));
  S.cy = Math.round(S.h / 2);
  const W = Math.min(112, S.gx + 2 + S.L + 7 + (spec.padR || 0));
  const b = bpNew(W, S.h);
  S.R = {
    blade: a2r(spec.col, { dk: spec.dk, lt: spec.lt }),
    hot: a2r(spec.hot || spec.col, { dk: .78, lt: .78, hue: .6 }),
    hot2: a2r(spec.hot2 || spec.hot || spec.col, { lt: .9, hue: 0 }),
    guard: a2r(a2sep(spec.guardCol || '#cfd5e2', spec.col), { lt: .62 }),
    ferrule: a2r(a2sep(spec.guardCol || '#cfd5e2', spec.col), { lt: .3, dk: 1.1 }),
    grip: a2r(spec.gripCol || '#4a3524', { lt: .42 }),
    dark: a2r(spec.darkCol || '#241c30', { dk: .6, lt: .5 }),
  };
  S.x0 = S.gx + 3; S.extraMasks = [];
  // ---- pintura genérica da lâmina: por coluna, separando cada "run" vertical ----
  S.blade = (bb, m, prof, ofs, st) => {
    st = st || {}; const ramp = st.hot ? S.R.hot : S.R.blade;
    if (!st.hot) { const c = hex2rgb(spec.col), lum = (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255; if (lum < .3) st = Object.assign({}, st, { rim: 1 }); }
    a2paint(bb, m, ramp, st, S);
    if (st.hot) for (let i = 0; i < bb.w * bb.h; i++) if (m[i]) bb.em[i] = 1;
    return m;
  };
  for (const e of (spec.back || [])) if (ART2_BACK[e]) ART2_BACK[e](b, S);
  ART2[spec.fam] ? ART2[spec.fam](b, S) : ART2.straight(b, S);
  S.allMask = new Uint8Array(b.w * b.h);
  for (let i = 0; i < b.w * b.h; i++) if (b.d[i * 4 + 3] > 120) S.allMask[i] = 1;
  for (const e of (spec.aura || [])) if (ART2_BACK[e]) ART2_BACK[e](b, S);
  // guarda
  const gstyle = spec.guard || 'cross';
  if (ART2_GUARD[gstyle]) ART2_GUARD[gstyle](b, S);
  if (gstyle !== 'none' && gstyle !== 'halo' && gstyle !== 'orb') {   // ferragem (langet) cobrindo a base da lâmina
    const F = S.R.ferrule, x0 = S.gx + 2, len = gstyle === 'dragon' || gstyle === 'skull' ? 9 : 7;
    const m = bpUnion(bpSeg(b.w, b.h, x0, S.cy, x0 + len, S.cy, 5.4), bpSeg(b.w, b.h, x0 + len, S.cy, x0 + len + 1, S.cy, 3.2));
    a2paint(b, m, F, {}, S);
  }
  if (S.gemMask) {
    bpFill(b, S.gemMask, S.R.hot, 4, { hi: 1.2, lo: 1.2, r2: true }); bpEdge(b, S.gemMask, S.R.dark, 1, 'all');
    bpSet(b, S.gx - 1, S.cy - 1, S.R.hot, 6); bpSet(b, S.gx + 1, S.cy + 1, S.R.hot, 3);
    for (let i = 0; i < b.w * b.h; i++) if (S.gemMask[i]) b.em[i] = 1;
  }
  // cabo + pomo
  ART2_GRIP[spec.grip || 'wrap'](b, S);
  ART2_POMMEL[spec.pommel || 'gem'](b, S);
  if (S.pommelMask) { bpFill(b, S.pommelMask, S.R.hot, 4, { hi: 1.2, lo: 1.2 }); bpEdge(b, S.pommelMask, S.R.dark, 1, 'all'); for (let i = 0; i < b.w * b.h; i++) if (S.pommelMask[i]) b.em[i] = 1; }
  for (const e of (spec.extras || [])) if (ART2_FRONT[e]) ART2_FRONT[e](b, S);
  a2outline(b);
  const pk = bpPack(b);
  // sw/sh = caixa real da espada (sem a poeira em volta) -> usada para caber no ícone 32x32
  return { c: pk.c, w: pk.w, h: pk.h, ox: S.gx - 2, oy: S.cy, len: S.L + 4, sw: (S.gx + 2) + S.L + 5, sh: gl * 2 + 3, glow: sw.look.glow || null };
}
// sprite de uma espada nova (cache por id) — chamado por getSwordSprite (06_icons.js)
function art2Sprite(sw) {
  let s = ART2_CACHE.get(sw.id); if (s) return s;
  try { s = art2Paint(sw); } catch (e) { console.error('art2', sw.id, e); s = getSwordSpriteLegacy(sw); }
  ART2_CACHE.set(sw.id, s); return s;
}
