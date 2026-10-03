/* ============================================================
   05_gfx: sprites 16x16 gerados proceduralmente (pixel-art)
   Atlas de texturas + buffer RGBA por sprite.
   ============================================================ */
const _B = new Uint8ClampedArray(16 * 16 * 4);
const _IMG = (typeof ImageData !== 'undefined') ? new ImageData(_B, 16, 16) : null;
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];
function bClear() { _B.fill(0); }
function bSet(x, y, c, a = 255) { if (x < 0 || y < 0 || x > 15 || y > 15) return; const o = (y * 16 + x) * 4; _B[o] = c[0]; _B[o + 1] = c[1]; _B[o + 2] = c[2]; _B[o + 3] = a; }
function bOver(x, y, c, a) {
  if (x < 0 || y < 0 || x > 15 || y > 15) return; const o = (y * 16 + x) * 4, da = _B[o + 3] / 255, oa = a + da * (1 - a); if (oa <= 0) return;
  _B[o] = (c[0] * a + _B[o] * da * (1 - a)) / oa; _B[o + 1] = (c[1] * a + _B[o + 1] * da * (1 - a)) / oa; _B[o + 2] = (c[2] * a + _B[o + 2] * da * (1 - a)) / oa; _B[o + 3] = oa * 255;
}
function bRect(x, y, w, h, c, a = 255) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bSet(x + i, y + j, c, a); }
function bAlpha(x, y) { if (x < 0 || y < 0 || x > 15 || y > 15) return 0; return _B[(y * 16 + x) * 4 + 3]; }
function bClr(x, y) { if (x < 0 || y < 0 || x > 15 || y > 15) return; _B[(y * 16 + x) * 4 + 3] = 0; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lit = (c, t) => mixc(c, WHITE, t), drk = (c, t) => mixc(c, BLACK, t);

// ---- atlas ----
const ATL = { pages: [], cx: 64, cy: 64 };
function atlasAlloc() {
  if (ATL.cx >= 64) { ATL.cx = 0; ATL.cy++; }
  if (ATL.cy >= 64 || !ATL.pages.length) { const c = document.createElement('canvas'); c.width = c.height = 1024; ATL.pages.push(c); ATL.cx = 0; ATL.cy = 0; }
  const pg = ATL.pages[ATL.pages.length - 1], r = { c: pg, x: ATL.cx * 16, y: ATL.cy * 16 };
  ATL.cx++; return r;
}
function putSprite(fn) {
  const a = atlasAlloc(), g = a.c.getContext('2d');
  bClear(); fn(); g.putImageData(_IMG, a.x, a.y); return a;
}
const TILE_SPR = new Array(256 * 16 * 3), WALL_SPR = new Array(32 * 3);

const BLOCK_STYLES = new Set(['dirt', 'stone', 'sand', 'sandstone', 'snow', 'ice', 'mud', 'ash', 'obsidian', 'cloud', 'ore', 'plank', 'brick', 'bedrock']);
function getTileSprite(id, mask, v) {
  const key = (id * 16 + mask) * 3 + v;
  return TILE_SPR[key] || (TILE_SPR[key] = putSprite(() => genTile(id, mask, v)));
}
function getWallSprite(id, v) {
  const key = id * 3 + v;
  return WALL_SPR[key] || (WALL_SPR[key] = putSprite(() => genWall(id, v)));
}

function grassCap(d, top, left, right, H) {
  if (!d.cap) return; const cap = d.cap.map(hex2rgb);
  if (top) {
    for (let x = 0; x < 16; x++) {
      const bh = 3 + (H(x, 0, 21) * 2.5 | 0);
      for (let y = 0; y < bh; y++) bSet(x, y, y === bh - 1 ? cap[1] : (H(x, y, 22) > .8 ? cap[2] : cap[0]));
      if (H(x, 1, 23) > .6) bSet(x, bh, cap[1]);
    }
    if (left) for (let y = 0; y < 6; y++) { bSet(0, y, cap[0]); if (y < 4) bSet(1, y, cap[0]); }
    if (right) for (let y = 0; y < 6; y++) { bSet(15, y, cap[0]); if (y < 4) bSet(14, y, cap[0]); }
  } else if (left) for (let y = 0; y < 2; y++) bSet(0, y, cap[0]);
}
function genTile(id, mask, v) {
  const d = TD[id], K = d.kc || (d.kc = d.c.map(hex2rgb)), c0 = K[0], c1 = K[1], c2 = K[2];
  const sd = id * 131 + v * 977, H = (x, y, k = 0) => hash2(x, y, sd + k);
  const top = !(mask & 1), right = !(mask & 2), bot = !(mask & 4), left = !(mask & 8);
  const fill = fn => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bSet(x, y, fn(x, y)); };
  const stoneFill = (a, b, c) => fill((x, y) => { const lf = H(x >> 2, y >> 2, 5), r = H(x, y); let col = lf < .3 ? mixc(a, b, .35) : lf > .72 ? mixc(a, c, .28) : a; return r < .1 ? b : r > .94 ? c : col; });
  switch (d.x) {
    case 'dirt': {
      fill((x, y) => { const r = H(x, y), lf = H(x >> 1, y >> 1, 4); const col = lf < .25 ? mixc(c0, c1, .4) : c0; return r < .12 ? c1 : r > .94 ? c2 : col; });
      for (let k = 0; k < 3; k++) { const px = 1 + (H(k, 1, 9) * 12 | 0), py = 3 + (H(k, 2, 9) * 11 | 0); bSet(px, py, [110, 96, 80]); bSet(px + 1, py, [124, 110, 92]); bSet(px, py + 1, [96, 82, 68]); }
      grassCap(d, top, left, right, H);
      break;
    }
    case 'stone': stoneFill(c0, c1, c2); if (H(1, 1, 33) > .6) { let x = 2 + (H(2, 2, 33) * 8 | 0), y = 2 + (H(3, 3, 33) * 6 | 0); for (let k = 0; k < 5; k++) { bSet(x + k, y + (k >> 1), c1); } } break;
    case 'sand': fill((x, y) => { const r = H(x, y), band = ((y + (H(0, y, 3) * 3 | 0)) % 5 === 0) ? .3 : 0; return r < .16 ? c1 : r > .9 ? c2 : mixc(c0, c1, band); }); break;
    case 'sandstone': fill((x, y) => { const r = H(x, y); return (y % 4 === 3) ? c1 : (r < .1 ? c1 : r > .93 ? c2 : mixc(c0, c2, (y % 4 === 0) ? .2 : 0)); }); break;
    case 'snow': fill((x, y) => { const r = H(x, y); return r < .1 ? c1 : r > .78 ? c2 : c0; }); break;
    case 'ice': fill((x, y) => { const r = H(x, y); const streak = ((x + y + v * 3) % 8 === 0) ? .55 : 0; return mixc(r < .1 ? c1 : c0, c2, streak); }); for (let k = 0; k < 4; k++) bSet(2 + (H(k, 5, 8) * 12 | 0), 2 + (H(k, 6, 8) * 12 | 0), WHITE); break;
    case 'mud': fill((x, y) => { const r = H(x, y); return r < .2 ? c1 : r > .9 ? c2 : c0; }); grassCap(d, top, left, right, H); break;
    case 'ash': fill((x, y) => { const r = H(x, y); const col = r < .22 ? c1 : r > .9 ? c2 : c0; return r > .985 ? [255, 120, 50] : col; }); break;
    case 'obsidian': fill((x, y) => { const r = H(x, y); const st = ((x - y + 16 + v * 2) % 9 === 0) ? .6 : 0; return mixc(r < .15 ? c1 : c0, c2, st); }); for (let k = 0; k < 3; k++) bSet(1 + (H(k, 5, 8) * 13 | 0), 1 + (H(k, 6, 8) * 13 | 0), [200, 170, 255]); break;
    case 'cloud': fill((x, y) => { const r = H(x, y); return mixc(c0, c1, clamp((y - 8) / 12, 0, 1) * .8 + (r < .1 ? .2 : 0)); }); break;
    case 'bedrock': fill((x, y) => { const r = H(x, y); return r < .2 ? c1 : r > .92 ? c2 : c0; }); break;
    case 'plank': {
      fill((x, y) => { const r = H(x, y); return r < .1 ? c1 : r > .92 ? c2 : mixc(c0, c1, (y % 5 === 4) ? .8 : 0); });
      for (let r = 0; r < 3; r++) { bSet(1, r * 5 + 2, c1); bSet(14, r * 5 + 2, c1); bRect(0, r * 5, 16, 1, mixc(c0, c2, .4)); }
      break;
    }
    case 'brick': {
      fill((x, y) => { const r = H(x, y); return r < .12 ? c1 : r > .92 ? c2 : c0; });
      for (let r = 0; r < 4; r++) { bRect(0, r * 4 + 3, 16, 1, c1); const off = r % 2 ? 4 : 12; bRect(off % 16, r * 4, 1, 3, c1); if (r % 2) bRect(12, r * 4, 1, 3, c1); }
      break;
    }
    case 'ore': {
      stoneFill(c0, c1, [154, 160, 168]);
      const oc = hex2rgb(d.ore), gem = ['ruby', 'emerald', 'topaz', 'sapphire', 'amethyst', 'quartz', 'amber', 'frostcrystal'].includes(d.k);
      const coal = d.k === 'coal', hell = d.k === 'hellstone';
      for (let k = 0; k < 4; k++) {
        const bx = 2 + (H(k, 1, 11) * 11 | 0), by = 2 + (H(k, 2, 11) * 11 | 0);
        if (gem) {
          bSet(bx, by - 2, oc); bRect(bx - 1, by - 1, 3, 2, oc); bSet(bx, by + 1, drk(oc, .25)); bSet(bx - 1, by - 1, lit(oc, .65)); bSet(bx + 1, by, drk(oc, .35));
        } else {
          bSet(bx, by, oc); bSet(bx + 1, by, oc); bSet(bx - 1, by, drk(oc, .1)); bSet(bx, by + 1, drk(oc, .2)); bSet(bx, by - 1, oc);
          if (H(k, 3, 12) > .4) bSet(bx + 1, by + 1, drk(oc, .35)); if (H(k, 4, 12) > .5) bSet(bx - 1, by - 1, oc);
          bSet(bx, by - 1, lit(oc, coal ? .25 : .5)); if (!coal && !hell && H(k, 7, 12) > .55) bSet(bx + 1, by - 1, WHITE);
        }
        if (hell) { bSet(bx, by, [255, 220, 90]); bSet(bx + 1, by + 1, [200, 40, 10]); }
      }
      break;
    }
    case 'glass': fill(() => [200, 235, 248]); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const o = (j * 16 + i) * 4; _B[o + 3] = 50; } for (let i = 0; i < 16; i++) { bOver(i, 0, WHITE, .55); bOver(i, 15, WHITE, .3); bOver(0, i, WHITE, .45); bOver(15, i, WHITE, .3); } for (let k = 0; k < 6; k++) { bOver(3 + k, 10 - k, WHITE, .8); } bOver(10, 6, WHITE, .6); break;
    case 'trunk': {
      const x0 = 3, x1 = 12;
      for (let y = 0; y < 16; y++) for (let x = x0; x <= x1; x++) { const r = H(x, y); let c = (x === x0 || x === x1) ? c1 : (x <= x0 + 2 ? c2 : c0); if (x > x0 + 2 && (x % 3 === 0) && r > .3) c = mixc(c0, c1, .5); if (r > .94) c = c1; bSet(x, y, c); }
      if (H(1, 1, 5) > .5) { bRect(6, 5 + (v * 3), 2, 2, drk(c0, .45)); }
      if (!(mask & 4)) { bRect(1, 13, 2, 3, c1); bRect(13, 13, 2, 3, c1); bRect(2, 12, 1, 1, c0); bRect(13, 12, 1, 1, c0); for (let x = 2; x < 14; x++) { bSet(x, 14, x < 4 || x > 11 ? c1 : c0); bSet(x, 15, c1); } }
      break;
    }
    case 'leaf': {
      const snow = id === T.leafsnow, palm = id === T.leafpalm;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const r = H(x, y), lf = H(x >> 2, y >> 2, 6);
        let col = r < .16 ? c1 : r > .8 ? c2 : c0; if (lf < .3) col = mixc(col, c1, .45); if (snow && r > .83 && y < 8) col = c2;
        if (palm) { if ((x + y * 2 + v) % 5 === 0) col = c1; }
        bSet(x, y, col);
      }
      const cut = (x, y, p) => { if (H(x, y, 7) < p) bClr(x, y); };
      for (let i = 0; i < 16; i++) {
        if (!(mask & 1)) { cut(i, 0, .55); cut(i, 1, .22); }
        if (!(mask & 4)) { cut(i, 15, .55); cut(i, 14, .22); }
        if (!(mask & 8)) { cut(0, i, .55); cut(1, i, .22); }
        if (!(mask & 2)) { cut(15, i, .55); cut(14, i, .22); }
      }
      if (!(mask & 1) && !(mask & 8)) { bClr(0, 0); bClr(1, 0); bClr(0, 1); bClr(2, 0); bClr(0, 2); }
      if (!(mask & 1) && !(mask & 2)) { bClr(15, 0); bClr(14, 0); bClr(15, 1); bClr(13, 0); bClr(15, 2); }
      if (!(mask & 4) && !(mask & 8)) { bClr(0, 15); bClr(1, 15); bClr(0, 14); }
      if (!(mask & 4) && !(mask & 2)) { bClr(15, 15); bClr(14, 15); bClr(15, 14); }
      if (palm) for (let i = 0; i < 24; i++) { if (H(i, 2, 8) < .4) bClr((H(i, 3, 8) * 16) | 0, (H(i, 4, 8) * 16) | 0); }
      break;
    }
    case 'cactus': {
      for (let y = 0; y < 16; y++) for (let x = 4; x <= 11; x++) { let c = (x === 4 || x === 11) ? c1 : (x === 5 || x === 6) ? c2 : (x === 8 ? mixc(c0, c1, .5) : c0); bSet(x, y, c); }
      for (let k = 0; k < 4; k++) { const sx = 4 + (H(k, 1, 4) * 8 | 0), sy = (H(k, 2, 4) * 16 | 0); bSet(sx, sy, [230, 240, 200]); }
      if (!(mask & 1)) { bClr(4, 0); bClr(11, 0); bRect(5, 0, 6, 1, c0); }
      break;
    }
    case 'mushroom': {
      bRect(7, 8, 2, 8, [226, 214, 190]); bSet(7, 10, [196, 182, 156]); bSet(8, 13, [196, 182, 156]);
      for (let y = 3; y <= 8; y++) { const w = y === 3 ? 4 : y === 4 ? 6 : y === 5 ? 8 : y === 6 ? 9 : 10; const x0 = 8 - (w >> 1); for (let x = x0; x < x0 + w; x++) { let c = y <= 4 ? c2 : y >= 7 ? c1 : c0; bSet(x, y, c); } }
      bSet(5, 5, WHITE); bSet(9, 4, WHITE); bSet(11, 6, lit(c2, .5)); bSet(7, 6, lit(c2, .5));
      break;
    }
    case 'thorn': {
      const bx = [3, 6, 8, 11, 13];
      for (let i = 0; i < bx.length; i++) { const hgt = 7 + ((H(i, 1, 6) * 7) | 0), dx = (i - 2) * .6; for (let k = 0; k < hgt; k++) { const x = Math.round(bx[i] + dx * k * .5), y = 15 - k; bSet(x, y, k > hgt - 3 ? c2 : (k % 2 ? c0 : c1)); } }
      for (let x = 2; x < 14; x++) bSet(x, 15, c1);
      break;
    }
    case 'tallgrass': {
      for (let i = 0; i < 6; i++) { const x = 1 + ((H(i, 1, 8) * 14) | 0), hgt = 3 + ((H(i, 2, 8) * 6) | 0), lean = (H(i, 3, 8) - .5) * 1.5; for (let k = 0; k < hgt; k++) bSet(Math.round(x + lean * k * .5), 15 - k, k > hgt - 3 ? c2 : (i % 2 ? c0 : c1)); }
      break;
    }
    case 'flower': {
      const hues = [[255, 107, 154], [255, 220, 80], [140, 170, 255], [255, 255, 255], [220, 120, 255]], fc = hues[(H(0, 0, 3) * hues.length) | 0];
      const x = 5 + ((H(1, 1, 3) * 6) | 0); for (let k = 0; k < 8; k++) bSet(x, 15 - k, k % 2 ? c0 : c1); bSet(x - 1, 12, c0); bSet(x + 1, 11, c0);
      bRect(x - 1, 5, 3, 3, fc); bSet(x, 4, fc); bSet(x, 8, fc); bSet(x - 2, 6, fc); bSet(x + 2, 6, fc); bSet(x, 6, [255, 230, 90]);
      break;
    }
    case 'torch': {
      bRect(7, 7, 2, 9, [120, 80, 40]); bSet(7, 7, [160, 110, 60]); bSet(8, 8, [90, 56, 28]); bRect(6, 6, 4, 2, [70, 46, 24]);
      bRect(7, 3, 2, 3, [255, 190, 60]); bSet(7, 4, [255, 240, 150]); bSet(8, 2, [255, 120, 30]); bSet(7, 5, [255, 120, 30]); bSet(8, 5, [255, 150, 40]); bSet(6, 5, [255, 120, 30]); bSet(9, 5, [255, 120, 30]);
      break;
    }
    case 'bench': {
      bRect(0, 6, 16, 3, c0); bRect(0, 6, 16, 1, c2); bRect(0, 8, 16, 1, c1); bRect(2, 9, 2, 7, c1); bRect(12, 9, 2, 7, c1); bRect(2, 9, 1, 7, c0); bRect(12, 9, 1, 7, c0);
      bRect(4, 3, 2, 3, [150, 154, 164]); bRect(3, 3, 4, 1, [190, 194, 204]); bRect(9, 5, 4, 1, [120, 90, 60]); bSet(12, 4, [190, 194, 204]);
      break;
    }
    case 'table': { bRect(0, 7, 16, 3, c0); bRect(0, 7, 16, 1, c2); bRect(0, 9, 16, 1, c1); bRect(2, 10, 2, 6, c1); bRect(12, 10, 2, 6, c1); break; }
    case 'chair': { bRect(4, 1, 2, 15, c0); bRect(4, 1, 1, 15, c2); bRect(4, 9, 8, 2, c0); bRect(4, 10, 8, 1, c1); bRect(10, 11, 2, 5, c1); bRect(5, 11, 1, 5, c1); break; }
    case 'furnace': {
      bRect(1, 3, 14, 13, c0); bRect(1, 3, 14, 1, lit(c0, .3)); bRect(1, 15, 14, 1, c1); bRect(0, 2, 16, 2, c1); bRect(5, 0, 6, 3, c1);
      for (let y = 4; y < 15; y++) for (let x = 2; x < 14; x++) if (H(x, y, 3) < .22) bSet(x, y, c1);
      bRect(4, 8, 8, 7, [30, 20, 20]); bRect(5, 9, 6, 6, [255, 120, 30]); bRect(6, 10, 4, 5, [255, 190, 60]); bSet(7, 11, [255, 245, 170]); bSet(8, 12, [255, 245, 170]);
      break;
    }
    case 'anvil': {
      const hl = id === T.advanvil;
      bRect(0, 4, 16, 4, c0); bRect(0, 4, 16, 1, c2); bRect(14, 5, 2, 2, c0); bRect(5, 8, 6, 3, c1); bRect(3, 11, 10, 4, c0); bRect(3, 14, 10, 1, c1); bRect(0, 7, 16, 1, c1);
      if (hl) { bSet(4, 5, [200, 255, 240]); bSet(7, 5, [200, 255, 240]); bSet(10, 5, [200, 255, 240]); bRect(7, 9, 2, 1, [160, 255, 230]); }
      break;
    }
    case 'forge': {
      bRect(1, 9, 14, 7, c0); bRect(0, 8, 16, 2, c1); bRect(1, 15, 14, 1, c1); bRect(2, 10, 12, 1, mixc(c0, c2, .5));
      for (let y = 2; y < 8; y++) for (let x = 5; x < 11; x++) { const dd = Math.abs(x - 7.5) + Math.abs(y - 5); if (dd < 4) bSet(x, y, dd < 2 ? [255, 250, 200] : c2); }
      bSet(2, 12, c2); bSet(13, 12, c2); bSet(7, 13, c2); bSet(8, 13, c2);
      break;
    }
    case 'chest': {
      bRect(1, 5, 14, 11, c0); bRect(1, 5, 14, 1, lit(c0, .35)); bRect(1, 9, 14, 1, c1); bRect(1, 15, 14, 1, c1); bRect(0, 6, 1, 9, c1); bRect(15, 6, 1, 9, c1);
      bRect(4, 5, 2, 11, c2); bRect(10, 5, 2, 11, c2); bRect(7, 8, 2, 3, [255, 220, 90]); bSet(7, 9, [120, 80, 20]);
      for (let k = 0; k < 8; k++) bSet(1 + ((H(k, 1, 3) * 13) | 0), 6 + ((H(k, 2, 3) * 3) | 0), mixc(c0, c1, .5));
      break;
    }
    case 'lifecrystal': {
      const pts = [[7, 0], [8, 0], [6, 1], [7, 1], [8, 1], [9, 1], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2]];
      for (let y = 1; y < 15; y++) { const w = y < 6 ? y + 2 : y < 10 ? 8 : 15 - y + 1; const x0 = 8 - (w >> 1); for (let x = x0; x < x0 + w; x++) bSet(x, y, y < 5 ? c2 : y > 10 ? c1 : c0); }
      bSet(6, 4, WHITE); bSet(6, 5, WHITE); bSet(7, 4, lit(c2, .5)); bSet(9, 9, c1); bSet(10, 8, c1);
      break;
    }
    case 'door': {
      const both = (mask & 1) && (mask & 4);
      for (let y = 0; y < 16; y++) for (let x = 4; x <= 11; x++) { let c = (x === 4 || x === 11) ? c1 : (x === 5 ? c2 : c0); if (x === 8) c = mixc(c0, c1, .4); bSet(x, y, c); }
      if (!(mask & 1)) bRect(4, 0, 8, 1, c1); if (!(mask & 4)) bRect(4, 15, 8, 1, c1);
      if (both) bRect(9, 7, 2, 2, [255, 220, 90]);
      break;
    }
    case 'dooro': {
      for (let y = 0; y < 16; y++) for (let x = 0; x <= 2; x++) bSet(x, y, x === 2 ? c1 : (x === 0 ? c2 : c0));
      break;
    }
    default: fill(() => c0);
  }
  if (BLOCK_STYLES.has(d.x) || d.x === 'glass') {
    for (let i = 0; i < 16; i++) {
      if (top) { bOver(i, 0, WHITE, .22); bOver(i, 1, WHITE, .09); }
      if (bot) { bOver(i, 15, BLACK, .38); bOver(i, 14, BLACK, .16); }
      if (left) { bOver(0, i, BLACK, .2); bOver(1, i, WHITE, .05); }
      if (right) { bOver(15, i, BLACK, .3); bOver(14, i, BLACK, .1); }
    }
    if (top && left) bClr(0, 0); if (top && right) bClr(15, 0); if (bot && left) bClr(0, 15); if (bot && right) bClr(15, 15);
  }
}

function genWall(id, v) {
  const d = WD[id], K = d.kc || (d.kc = d.c.map(hex2rgb)), c0 = K[0], c1 = K[1], sd = id * 77 + v * 311, H = (x, y, k = 0) => hash2(x, y, sd + k);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const r = H(x, y), lf = H(x >> 2, y >> 2, 3);
    let c = r < .16 ? c1 : r > .93 ? mixc(c0, WHITE, .12) : c0; if (lf < .25) c = mixc(c, c1, .4);
    if (d.x === 'plank' && y % 5 === 4) c = c1;
    if (d.x === 'brick') { if (y % 4 === 3) c = c1; else { const off = (y >> 2) % 2 ? 4 : 12; if (x === off || x === (off + 8) % 16) c = c1; } }
    bSet(x, y, c);
  }
  for (let i = 0; i < 16; i++) { bOver(i, 15, BLACK, .22); bOver(15, i, BLACK, .22); bOver(i, 0, WHITE, .05); bOver(0, i, WHITE, .05); }
}

// rachaduras de mineração (4 estágios)
let CRACKS = null;
function getCracks() {
  if (CRACKS) return CRACKS; CRACKS = [];
  for (let s = 0; s < 4; s++) {
    const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 1; g.beginPath();
    const paths = [[[8, 0], [7, 4], [9, 7], [8, 10]], [[0, 6], [4, 7], [7, 9], [12, 8], [15, 10]], [[3, 15], [5, 11], [4, 8], [2, 4]], [[15, 2], [12, 5], [11, 9], [13, 13]], [[6, 15], [8, 12], [10, 14]]];
    for (let k = 0; k <= s + (s > 1 ? 1 : 0); k++) { const p = paths[k]; g.moveTo(p[0][0] + .5, p[0][1] + .5); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0] + .5, p[i][1] + .5); }
    g.stroke(); CRACKS.push(c);
  }
  return CRACKS;
}

// máscara de vizinhança (bit0 topo, 1 direita, 2 baixo, 3 esquerda)
function tileMask(wd, x, y, id) {
  const d = TD[id], t = wd.t, W = wd.w;
  const g = (xx, yy) => (xx < 0 || xx >= W || yy < 0) ? (yy < 0 ? 0 : T.bedrock) : (yy >= wd.h ? T.bedrock : t[xx + yy * W]);
  const U = g(x, y - 1), R = g(x + 1, y), D = g(x, y + 1), Lf = g(x - 1, y);
  if (d.tree) { const f = i => (TD[i].tree ? 1 : 0); return f(U) | f(R) << 1 | f(D) << 2 | f(Lf) << 3; }
  if (id === T.cactus) return (U === T.cactus ? 1 : 0) | (D === T.cactus ? 4 : 0);
  if (d.door) return (TD[U].door ? 1 : 0) | (TD[D].door ? 4 : 0);
  return SOLID[U] | SOLID[R] << 1 | SOLID[D] << 2 | SOLID[Lf] << 3;
}
