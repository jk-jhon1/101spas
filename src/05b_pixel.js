/* ============================================================
   05b_pixel: pixel-art de verdade.
   - drawPixelized: desenha um sprite vetorial (bordas suaves) numa caixa pequena, binariza
     o alfa e acrescenta contorno escuro de 1px -> o mesmo visual "recortado" do Terraria.
   - pixelShade: luz de cima-esquerda (realce/sombra na borda interna) e poucas cores, como a pixel-art do Terraria.
   - humanLegs/humanUpper/humanArm: bonecos humanos de frente (cabeça 10x10 com 2 olhos, cabelo, tronco com gola e cinto, botas) do jogador, NPCs e zumbis.
   - heartSprites: corações da HUD (cheio/vazio) em pixels.
   Nada aqui toca o DOM ao carregar (o validador do Node também carrega este arquivo).
   ============================================================ */
const PXS = { c: null, g: null, W: 0, H: 0 };
function pxScratch(w, h) {
  if (!PXS.c) PXS.c = document.createElement('canvas');
  if (PXS.W < w || PXS.H < h) {
    PXS.W = Math.max(PXS.W, w); PXS.H = Math.max(PXS.H, h); PXS.c.width = PXS.W; PXS.c.height = PXS.H;
    PXS.g = PXS.c.getContext('2d', { willReadFrequently: true });
  }
  return PXS;
}
// sombreamento de pixel-art: luz vinda de cima-esquerda. A borda de dentro da silhueta ganha realce em cima/à esquerda e sombra
// embaixo/à direita (2 camadas), e as cores são reduzidas a poucos tons (visual "chapado", sem degradês suaves)
function pixelShade(d, W, H, o) {
  const hi = o.hi === undefined ? .24 : o.hi, lo = o.lo === undefined ? .26 : o.lo, Q = o.levels || 16, r2 = (o.ring || 2) > 1, n = W * H, a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = d[i * 4 + 3] ? 1 : 0;
  const q = v => Math.round(v / 255 * (Q - 1)) * 255 / (Q - 1), at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : a[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!a[i]) continue;
    let t = 0;
    if (!at(x, y - 1)) t += hi; else if (r2 && !at(x, y - 2)) t += hi * .35;
    if (!at(x - 1, y)) t += hi * .8; else if (r2 && !at(x - 2, y)) t += hi * .25;
    if (!at(x, y + 1)) t -= lo; else if (r2 && !at(x, y + 2)) t -= lo * .3;
    if (!at(x + 1, y)) t -= lo * .8; else if (r2 && !at(x + 2, y)) t -= lo * .25;
    const j = i * 4;
    for (let k = 0; k < 3; k++) { let c = d[j + k]; c = t > 0 ? Math.min(255, c * (1 + t * 1.1) + 255 * t * .1) : c * (1 + t); d[j + k] = q(c); }
  }
  return d;
}
// alfa binário (limiar th) + sombreamento + contorno de 1px (4-conexo) na cor do vizinho, bem escurecida
function pixelizeRGBA(d, W, H, o) {
  o = o || {}; const th = o.th || 128, n = W * H;
  for (let i = 0, j = 3; i < n; i++, j += 4) d[j] = d[j] >= th ? 255 : 0;
  if (o.shade !== false) pixelShade(d, W, H, o);
  if (o.outline === false) return d;
  const s = new Uint8ClampedArray(d), k = o.dark === undefined ? .3 : o.dark;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (s[i + 3]) continue;
      let r = 0, g = 0, b = 0, c = 0, j;
      if (x > 0 && s[(j = i - 4) + 3]) { r += s[j]; g += s[j + 1]; b += s[j + 2]; c++; }
      if (x < W - 1 && s[(j = i + 4) + 3]) { r += s[j]; g += s[j + 1]; b += s[j + 2]; c++; }
      if (y > 0 && s[(j = i - W * 4) + 3]) { r += s[j]; g += s[j + 1]; b += s[j + 2]; c++; }
      if (y < H - 1 && s[(j = i + W * 4) + 3]) { r += s[j]; g += s[j + 1]; b += s[j + 2]; c++; }
      if (c) { d[i] = r / c * k + 4; d[i + 1] = g / c * k + 3; d[i + 2] = b / c * k + 10; d[i + 3] = 255; }
    }
  }
  return d;
}
function pixelizeCanvas(c, o) {
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height);
  pixelizeRGBA(im.data, c.width, c.height, o); g.putImageData(im, 0, 0); return c;
}
// fn(g) desenha em coordenadas relativas ao ponto de ancoragem (x: -hw..hw, y: -up..dn); (ax, ay) é inteiro no destino
function drawPixelized(dst, ax, ay, hw, up, dn, fn, o) {
  const W = hw * 2, H = up + dn, S = pxScratch(W, H), g = S.g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
  g.save(); g.setTransform(1, 0, 0, 1, hw, up); fn(g); g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.getImageData(0, 0, W, H); pixelizeRGBA(im.data, W, H, o); g.putImageData(im, 0, 0);
  const a = o && o.alpha !== undefined ? o.alpha : 1; if (a !== 1) dst.globalAlpha = a;
  dst.drawImage(S.c, 0, 0, W, H, ax - hw, ay - up, W, H);
  if (a !== 1) dst.globalAlpha = 1;
}

// ---------- corações da HUD (8x7 px; desenhados em escala 2 = 16x14 na tela, ~40% menores que a versão 13x12) ----------
let _heartSpr = null;
function heartSprites() {
  if (_heartSpr) return _heartSpr;
  const W = 8, H = 7;
  // O contorno, R base, D sombra, L reflexo, H brilho
  const ART = ['.OO..OO.', 'OHLOORRO', 'OLRRRRRO', 'ORRRRRDO', '.ORRRDO.', '..ORDO..', '...OO...'];
  const make = (pal) => {
    const c = mk(W, H), g = c.getContext('2d'), im = g.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = ART[y][x]; if (ch === '.') continue;
      const col = pal[ch], o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  };
  _heartSpr = {
    W, H,
    full: make({ O: [74, 10, 20], D: [176, 20, 34], R: [232, 48, 62], L: [255, 112, 112], H: [255, 255, 255] }),
    empty: make({ O: [32, 20, 40], D: [44, 32, 54], R: [58, 42, 70], L: [76, 58, 90], H: [96, 76, 112] }),
  };
  return _heartSpr;
}

// ---------- humanos em pixel-art (jogador, NPCs, zumbis): cabeça de frente com 2 olhos, tronco com gola e cinto, pernas com botas ----------
// origem = pés (0,0), y para cima negativo; cabeça 10x10, tronco 8x9, pernas 9 de altura. Tudo desenhado de frente para +x (o chamador espelha com f)
function pixArt(g, x0, y0, rows, pal) {
  for (let y = 0; y < rows.length; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (!c) continue; g.fillStyle = c; g.fillRect(x0 + x, y0 + y, 1, 1); }
  }
}
const HUMAN_HEAD = ['..HHHHHH..', '.HLHHHHHH.', 'HLHHHHHHHH', 'HHHHHHHHHH', 'HHSSSSSSHH', 'HSSSSSSSSH', 'ESSWWSWWSE', 'ESSWPSWPSE', '.SSSSMMSS.', '..TSSSST..'];
const SKULL_HEAD = ['..SSSSSS..', '.SSSSSSSS.', 'SSSSSSSSSS', 'SSSSSSSSSS', 'SSKKSSKKSS', 'SSKKSSKKSS', 'SSSSKSSSSS', '.SSSSSSSS.', '.STSTSTST.', '..SSSSSS..'];
const HUMAN_TORSO = ['lBCSSCBB', 'lBBCCBBb', 'lBBBBBBb', 'BBBBBBBb', 'BBBBBBBb', 'BBBBBBbb', 'BBBBBBbb', 'KKKYYKKK', 'pNNNNNNp'];
const HUMAN_LEG = ['NNNp.', 'NNNp.', 'NNNp.', 'NNNp.', 'NNNp.', 'NNNp.', 'OOOOO', 'OOOOo', 'ooooo'];
function humanPal(o) {
  if (o._pal) return o._pal;
  const skin = o.skin || '#f2c28b', hair = o.hair || '#5b3a24', shirt = o.shirt || '#3b82f6', pants = o.pants || '#334155', boots = o.boots || '#4a3426';
  const P = {
    H: shade(hair, 0), L: shade(hair, .24), D: shade(hair, -.28),
    S: shade(skin, 0), T: shade(skin, -.17), E: shade(skin, -.1), M: shade(mix(skin, '#8a3b2b', .5), 0),
    W: o.white || '#ffffff', P: o.eye || '#1b2a4a', K: shade(pants, -.4), Y: '#e8c24a',
    B: shade(shirt, 0), b: shade(shirt, -.24), l: shade(shirt, .2), C: shade(o.trim || shirt, o.trim ? 0 : .32),
    N: shade(pants, 0), p: shade(pants, -.22), O: shade(boots, 0), o: shade(boots, -.4),
    NB: shade(pants, -.2), pB: shade(pants, -.38), OB: shade(boots, -.2), oB: shade(boots, -.5),
  };
  if (o.tint) for (const k in P) P[k] = o.tint(P[k]);   // flash de dano / cor de status dos inimigos
  return (o._pal = P);
}
// pernas: back = perna de trás (mais escura); a = ângulo; o.air = no ar
function humanLegs(g, o, sw) {
  const pal = humanPal(o), bob = o.bob || 0, air = !!o.air, f = o.f || 1;
  const palBack = Object.assign({}, pal, { N: pal.NB, p: pal.pB, O: pal.OB, o: pal.oB });
  g.save(); g.scale(f, 1);
  const leg = (back, a) => { g.save(); g.translate(back ? -1.5 : 1.5, -9 + bob); g.rotate(air ? (back ? -.45 : .3) : a); pixArt(g, -2, 0, HUMAN_LEG, back ? palBack : pal); g.restore(); };
  leg(true, -sw * .8); leg(false, sw * .8);
  g.restore();
}
// tronco + cabeça (+ roupas/acessórios): o.hairStyle 'short'|'long'|'bald', o.beard (cor), o.hat ('wizard'|'nurse'), o.apron, o.cross, o.helm (cor), o.skull
function humanUpper(g, o) {
  const pal = humanPal(o), bob = o.bob || 0, f = o.f || 1;
  g.save(); g.scale(f, 1); g.translate(0, bob);
  pixArt(g, -4, -18, HUMAN_TORSO, pal);
  if (o.apron) { g.fillStyle = '#2a2118'; g.fillRect(-3, -16, 6, 6); g.fillStyle = '#4a3a2a'; g.fillRect(-3, -16, 6, 1); }
  if (o.cross) { g.fillStyle = '#ef4444'; g.fillRect(-1, -16, 2, 5); g.fillRect(-2.5, -14.5, 5, 2); }
  if (o.skull) { const sk = Object.assign({}, pal, { S: shade(o.skin, 0), T: shade(o.skin, -.2), K: '#15151d' }); pixArt(g, -5, -28, SKULL_HEAD, sk); }
  else {
    pixArt(g, -5, -28, HUMAN_HEAD, pal);
    if (o.hairStyle === 'bald') { g.fillStyle = pal.S; g.fillRect(-3, -28, 6, 1); g.fillRect(-4, -27, 8, 3); g.fillStyle = pal.L; g.fillRect(-2, -27, 2, 1); }
    if (o.hairStyle === 'long') { g.fillStyle = pal.H; g.fillRect(-5, -22, 2, 8); g.fillRect(3, -22, 2, 8); g.fillStyle = pal.L; g.fillRect(-5, -22, 1, 6); }
    if (o.beard) { const bc = shade(o.beard, 0), bl = shade(o.beard, .2); g.fillStyle = bc; g.fillRect(-4, -22, 2, 3); g.fillRect(2, -22, 2, 3); g.fillRect(-3, -20, 6, 2); g.fillRect(-2, -18, 4, 1); g.fillStyle = bl; g.fillRect(-3, -20, 2, 1); g.fillStyle = pal.M; g.fillRect(0, -20, 1, 1); }
  }
  if (o.helm) { const hc = shade(o.helm, .08), hl = shade(o.helm, .42), hd = shade(o.helm, -.25); g.fillStyle = hc; g.fillRect(-5, -28, 10, 1); g.fillRect(-5, -27, 10, 2); g.fillStyle = hl; g.fillRect(-4, -28, 4, 1); g.fillStyle = hd; g.fillRect(-5, -25, 10, 1); }
  if (o.hat === 'wizard') { const hc = shade(o.hatCol || '#7c3aed', 0), hl = shade(o.hatCol || '#7c3aed', .28), hd = shade(o.hatCol || '#7c3aed', -.3); g.fillStyle = hd; g.fillRect(-7, -29, 14, 2); g.fillStyle = hc; g.fillRect(-7, -30, 14, 1); g.fillRect(-4, -33, 8, 3); g.fillRect(-3, -35, 6, 2); g.fillRect(-1, -37, 3, 2); g.fillStyle = hl; g.fillRect(-4, -33, 2, 3); g.fillRect(-3, -35, 1, 2); g.fillStyle = '#e8c24a'; g.fillRect(-4, -31, 8, 1); }
  if (o.hat === 'nurse') { g.fillStyle = '#f8fafc'; g.fillRect(-4, -31, 8, 4); g.fillRect(-5, -28, 10, 1); g.fillStyle = '#dbe4ee'; g.fillRect(-4, -28, 8, 1); g.fillStyle = '#ef4444'; g.fillRect(-1, -30, 2, 3); g.fillRect(-2, -29, 4, 1); }
  g.restore();
}
// braço: desenhado a partir do ombro (0,0) apontando para +x; o chamador faz translate/rotate
function humanArm(g, o, len, back) {
  const pal = humanPal(o); g.fillStyle = back ? pal.T : pal.S; g.fillRect(0, -1.5, len, 3);
  g.fillStyle = back ? pal.b : pal.B; g.fillRect(0, -1.5, Math.min(3.5, len), 3);
  g.fillStyle = back ? pal.b : pal.l; g.fillRect(0, -1.5, Math.min(3.5, len), 1);
  g.fillStyle = pal.T; g.fillRect(len - 1.5, 0, 1.5, 1.5);
}
