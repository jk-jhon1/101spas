/* ============================================================
   05c_canopy: copas das árvores desenhadas por vizinhança (estilo Terraria)
   O mundo continua com as MESMAS folhas (tiles, colisão e geração não mudam); só o DESENHO muda:
   o contorno da copa é arredondado (cantos redondos, buracos viram recortes suaves), com
   contorno escuro e folhas pontiagudas sobrepostas, luz de cima-esquerda e sombra embaixo.
   Cada bloco recebe o pedaço da copa que cai nele, calculado a partir dos 5x5 blocos ao redor,
   então os pedaços se emendam sem costura e a copa se atualiza sozinha quando uma folha some.
   A textura das folhas é uma imagem que se repete a cada 256 px (gerada uma vez por tipo de copa).
   ============================================================ */
const CANOPY_KIND = new Uint8Array(256);
CANOPY_KIND[T.leaf] = 1; CANOPY_KIND[T.leafjungle] = 2; CANOPY_KIND[T.leafsnow] = 3;
// 5 tons (fresta escura → brilho) + contorno, por tipo de copa: 1 floresta, 2 selva, 3 pinheiro nevado
const CANOPY_PAL = [null,
  { c: [[6, 73, 24], [10, 107, 40], [23, 134, 58], [39, 168, 85], [72, 210, 114]], o: [4, 38, 14] },
  { c: [[8, 58, 18], [15, 90, 30], [28, 138, 52], [60, 176, 74], [120, 220, 90]], o: [3, 33, 10] },
  { c: [[12, 52, 42], [24, 84, 62], [40, 122, 88], [86, 146, 120], [226, 240, 240]], o: [6, 34, 28] }];
const CANOPY = { map: new Map(), page: null, img: null, n: 0, tex: [null, null, null, null] };
const _CN = 48, _CF = new Float32Array(_CN * _CN), _CT = new Float32Array(_CN * _CN), _CP = new Float32Array(_CN + 1), _CIN = new Uint8Array(_CN * _CN), _CD = new Uint8Array(_CN * _CN), _CFIL = new Uint8Array(9);

// o bloco (x,y) conta como "folha" para o formato da copa? (folha do tipo, ou tronco coberto por folhas)
function canopyOccAt(wd, x, y, kind) {
  if (x < 0 || y < 0 || x >= wd.w || y >= wd.h) return 0;
  const t = wd.t, W = wd.w, id = t[x + y * W];
  if (CANOPY_KIND[id] === kind) return 1;
  if (id === T.trunk) {
    if (y > 0 && CANOPY_KIND[t[x + (y - 1) * W]] === kind) return 1;
    if (x > 0 && x < W - 1 && CANOPY_KIND[t[x - 1 + y * W]] === kind && CANOPY_KIND[t[x + 1 + y * W]] === kind) return 1;
  }
  return 0;
}
// bloco VAZIO perto de uma copa? devolve o tipo (para preencher cantos e buracos), ou 0
function canopyKindAround(wd, tx, ty) {
  const t = wd.t, W = wd.w, H = wd.h;
  for (let j = -1; j <= 1; j++) {
    const y = ty + j; if (y < 0 || y >= H) continue;
    for (let i = -1; i <= 1; i++) { const x = tx + i; if (x < 0 || x >= W) continue; const k = CANOPY_KIND[t[x + y * W]]; if (k) return k; }
  }
  return 0;
}
// tronco dentro da copa (folha em cima, ou folha dos dois lados) é coberto pelas folhas, como no Terraria
function canopyTrunkKind(wd, tx, ty) {
  const t = wd.t, W = wd.w;
  if (ty > 0) { const k = CANOPY_KIND[t[tx + (ty - 1) * W]]; if (k) return k; }
  if (tx > 0 && tx < W - 1) { const a = CANOPY_KIND[t[tx - 1 + ty * W]]; if (a && a === CANOPY_KIND[t[tx + 1 + ty * W]]) return a; }
  return 0;
}
// desenha as copas de um trecho (q = tx, ty, tipo ...): primeiro gera, de uma vez, as que faltam e depois desenha todas;
// intercalar "gerar" e "desenhar" a cada bloco faria o navegador copiar o atlas inteiro (4 MB) toda vez.
function drawCanopyBatch(g, wd, q) {
  const n = q.length / 3, ks = new Array(n);
  for (let m = 0; m < n; m++) {
    const tx = q[m * 3], ty = q[m * 3 + 1], kind = q[m * 3 + 2]; let occ = 0;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (canopyOccAt(wd, tx + i - 2, ty + j - 2, kind)) occ |= 1 << (j * 5 + i);
    if (!occ) { ks[m] = -1; continue; }
    let dp = 0; while (dp < 7 && canopyOccAt(wd, tx, ty - 1 - dp, kind)) dp++;   // quantos blocos de copa há acima (topo claro, base escura)
    const key = (((((ty & 15) << 4) | (tx & 15)) * 4 + kind) * 8 + dp) * 33554432 + occ;   // a textura repete a cada 16 blocos
    ks[m] = key;   // dp e occ estão dentro da chave
    if (!CANOPY.map.has(key)) CANOPY.map.set(key, genCanopySprite(kind, tx, ty, occ, dp));
  }
  for (let m = 0; m < n; m++) {
    if (ks[m] < 0) continue;
    const key = ks[m]; let s = CANOPY.map.get(key);
    if (s === undefined) {   // o atlas deu a volta no meio do lote: gera este de novo
      const tx = q[m * 3], ty = q[m * 3 + 1], kind = q[m * 3 + 2], occ = key % 33554432, dp = Math.floor(key / 33554432) % 8;
      s = genCanopySprite(kind, tx, ty, occ, dp); CANOPY.map.set(key, s);
    }
    if (s) g.drawImage(s.c, s.x, s.y, 16, 16, q[m * 3] * 16, q[m * 3 + 1] * 16, 16, 16);
  }
}
// atlas circular: quando enche, limpa e recomeça (as copas visíveis são regeradas)
function canopyAlloc() {
  if (!CANOPY.page) { CANOPY.page = document.createElement('canvas'); CANOPY.page.width = CANOPY.page.height = 1024; CANOPY.img = new ImageData(16, 16); }
  if (CANOPY.n >= 4096) { CANOPY.page.getContext('2d').clearRect(0, 0, 1024, 1024); CANOPY.map.clear(); CANOPY.n = 0; }
  const n = CANOPY.n++; return { c: CANOPY.page, x: (n & 63) * 16, y: (n >> 6) * 16 };
}
// desfoque de caixa (2 passadas por eixo, raio r): alcance 2r px — com r=7 cabe nos 3x3 blocos
function canopyBlur(a, tmp, r) {
  const N = _CN;
  const pass = (src, dst, horiz) => {
    for (let l = 0; l < N; l++) {
      _CP[0] = 0;
      for (let k = 0; k < N; k++) _CP[k + 1] = _CP[k] + src[horiz ? l * N + k : k * N + l];
      for (let k = 0; k < N; k++) { const lo = k - r < 0 ? 0 : k - r, hi = k + r > N - 1 ? N - 1 : k + r; dst[horiz ? l * N + k : k * N + l] = (_CP[hi + 1] - _CP[lo]) / (hi - lo + 1); }
    }
  };
  pass(a, tmp, true); pass(tmp, a, true); pass(a, tmp, false); pass(tmp, a, false);
}
// textura de folhas pontiagudas (lentes de ~7x3 px), 256x256 que se repete: centros numa grade de 4 px com sorteio,
// 2 folhas por célula, as de baixo cobrem as de cima. tom (0 escuro … 4 brilho) pela face voltada para a luz
// (cima-esquerda), veio central claro e brilho próprio de cada folha, mais manchas claras e escuras suaves.
function canopyTex(kind) {
  let tx = CANOPY.tex[kind]; if (tx) return tx;
  const Z = 256, S = 4, NC = Z / S, ks = kind === 2 ? 1.3 : kind === 3 ? .9 : 1, sd = kind * 1013, tone = new Float32Array(Z * Z), cov = new Uint8Array(Z * Z), leaves = [];
  for (let cy = 0; cy < NC; cy++) for (let cx = 0; cx < NC; cx++) for (let k = 0; k < 2; k++) {
    const h = sd + k * 7, L = (6 + 2.2 * hash2(cx, cy, h + 4)) * ks, a = hash2(cx, cy, h + 3) * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
    leaves.push({ x: (cx + hash2(cx, cy, h + 1)) * S, y: (cy + hash2(cx, cy, h + 2)) * S, ca, sa, f: sa * .6 - ca * .8, L, R: L / 2 + 1.6, w: (1.45 + .35 * hash2(cx, cy, h + 5)) * ks, b: hash2(cx, cy, h + 6) - .5 });   // f: quanto o lado +w olha para a luz
  }
  leaves.sort((p, q) => p.y - q.y);
  for (const lf of leaves) {
    const x0 = Math.floor(lf.x - lf.R), x1 = Math.ceil(lf.x + lf.R), y0 = Math.floor(lf.y - lf.R), y1 = Math.ceil(lf.y + lf.R);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + .5 - lf.x, dy = y + .5 - lf.y, u = dx * lf.ca + dy * lf.sa, w = -dx * lf.sa + dy * lf.ca, au = Math.abs(2 * u / lf.L);
      if (au > 1) continue;
      const hw = lf.w * (1 - au * au); if (Math.abs(w) > hw) continue;
      const n = w / hw, o = ((y & 255) << 8) | (x & 255);
      tone[o] = 2.8 + 2 * n * lf.f + lf.b + (Math.abs(n) < .3 ? .45 : 0) - (au > .82 ? .4 : 0); cov[o] = 1;
    }
  }
  const B = 8, BN = Z / B, bl = new Float32Array(BN * BN);
  for (let j = 0; j < BN; j++) for (let i = 0; i < BN; i++) bl[j * BN + i] = hash2(i, j, sd + 21) - .5;
  for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) {
    const cx = (x / B) | 0, cy = (y / B) | 0, fx = x / B - cx, fy = y / B - cy, c1 = (cx + 1) % BN, r1 = (cy + 1) % BN;
    const a = bl[cy * BN + cx], b = bl[cy * BN + c1], c = bl[r1 * BN + cx], d = bl[r1 * BN + c1], o = (y << 8) | x;
    tone[o] = (cov[o] ? tone[o] : -.3) + ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy) * .7;
  }
  return CANOPY.tex[kind] = { tone, cov };
}
function genCanopySprite(kind, tx, ty, occ, dp) {
  const N = _CN, bit = (i, j) => (occ >> (j * 5 + i)) & 1, pal = CANOPY_PAL[kind], fil = _CFIL, D = _CD, tex = canopyTex(kind);
  // 3x3 blocos ao redor (folha que o jogador quebra aparece como buraco/recorte na hora: nada é preenchido)
  let any = 0;
  for (let j = 1; j <= 3; j++) for (let i = 1; i <= 3; i++) { const o = bit(i, j); fil[(j - 1) * 3 + i - 1] = o; any |= o; }
  if (!any) return false;
  const gx0 = tx * 16 - 16, gy0 = ty * 16 - 16, sd = kind * 1013;
  if (fil[0] & fil[1] & fil[2] & fil[3] & fil[4] & fil[5] & fil[6] & fil[7] & fil[8]) { _CF.fill(1); _CIN.fill(1); D.fill(250); }   // bloco totalmente dentro da copa: sem borda a calcular
  else {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) _CF[y * N + x] = fil[(y >> 4) * 3 + (x >> 4)];
    canopyBlur(_CF, _CT, kind === 3 ? 3 : 7);   // pinheiros nevados: cantos menos arredondados (camadas em degraus)
    // contorno = campo desfocado > 0,5, com serrilhado de pontas de folha (ruído periódico, só perto da borda)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const f = _CF[y * N + x];
      if (f > .75) _CIN[y * N + x] = 1; else if (f < .25) _CIN[y * N + x] = 0;
      else { const gx = gx0 + x, gy = gy0 + y, j = (hash2((gx >> 1) & 127, (gy >> 1) & 127, sd + 11) - .5) * .2 + (hash2(gx & 255, gy & 255, sd + 12) - .5) * .07; _CIN[y * N + x] = f + j > .5 ? 1 : 0; }
    }
    // pontas de folha: pixel coberto por folha perto da borda da copa (campo > 0,32), até 4 px além do bloco, entra na silhueta
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      const i = (y + 12) * N + x + 12;
      if (!_CIN[i] && _CF[i] > .32 && tex.cov[(((gy0 + 12 + y) & 255) << 8) | ((gx0 + 12 + x) & 255)]) _CIN[i] = 1;
    }
    // distância (em passos) até o vazio mais próximo: 1 = contorno, 2-4 = borda iluminada/sombreada
    for (let i = 0; i < N * N; i++) D[i] = _CIN[i] ? 250 : 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (D[i]) { let d = D[i]; if (x > 0 && D[i - 1] + 1 < d) d = D[i - 1] + 1; if (y > 0 && D[i - N] + 1 < d) d = D[i - N] + 1; D[i] = d; } }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (D[i]) { let d = D[i]; if (x < N - 1 && D[i + 1] + 1 < d) d = D[i + 1] + 1; if (y < N - 1 && D[i + N] + 1 < d) d = D[i + N] + 1; D[i] = d; } }
  }
  const a = canopyAlloc(), img = CANOPY.img, d8 = img.data; d8.fill(0);
  let drawn = 0;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y + 16) * N + x + 16; if (!_CIN[i]) continue;
    const d = D[i]; let col;
    if (d === 1) col = pal.o;
    else {
      let tone = tex.tone[(((gy0 + y + 16) & 255) << 8) | ((gx0 + x + 16) & 255)] - Math.min(1, (dp * 16 + y) / 120) * .8;   // topo claro / base escura
      if (d <= 4) {
        const nx = _CF[i - 1] - _CF[i + 1], ny = _CF[i - N] - _CF[i + N], m = Math.hypot(nx, ny);
        if (m > 1e-4) { const L = (nx * -.62 + ny * -.78) / m; tone += L * (d === 2 ? 1.5 : d === 3 ? .9 : .4); if (kind === 3 && L > .3 && d <= 3) tone = 4; }
      }
      col = pal.c[tone < 0 ? 0 : tone > 4 ? 4 : Math.round(tone)];
    }
    const q = (y * 16 + x) * 4; d8[q] = col[0]; d8[q + 1] = col[1]; d8[q + 2] = col[2]; d8[q + 3] = 255; drawn++;
  }
  if (!drawn) { CANOPY.n--; return false; }   // devolve o espaço do atlas
  a.c.getContext('2d').putImageData(img, a.x, a.y);
  return a;
}
