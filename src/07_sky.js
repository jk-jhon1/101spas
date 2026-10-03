/* ============================================================
   07_sky: céu, sol/lua, estrelas, nuvens, colinas em paralaxe
   ============================================================ */
const SKY = { stars: null, clouds: null, hill: [90, 160, 90], hillT: [90, 160, 90] };
const SKYGRAD = [[0, [6, 10, 34], [24, 34, 78]], [.04, [70, 70, 150], [255, 160, 110]], [.09, [74, 163, 255], [190, 226, 255]], [.55, [74, 163, 255], [190, 226, 255]], [.61, [70, 50, 130], [255, 140, 80]], [.67, [6, 10, 34], [24, 34, 78]], [1, [6, 10, 34], [24, 34, 78]]];
const HILLCOL = { forest: [70, 140, 80], desert: [214, 180, 110], jungle: [40, 110, 70], snow: [200, 224, 240], ocean: [90, 130, 170] };
function initSky(seed) {
  const R = mulberry32(seed ^ 0xabc);
  SKY.stars = Array.from({ length: 240 }, () => ({ x: R(), y: R() * .85, s: R() * 1.5 + .5, p: R() * TAU }));
  SKY.clouds = Array.from({ length: 16 }, () => ({ x: R() * 2600, y: 10 + R() * 260, w: 70 + R() * 120, s: 3 + R() * 8, a: .55 + R() * .4, k: R() }));
}
function skyGradAt(frac) {
  for (let i = 1; i < SKYGRAD.length; i++) if (frac <= SKYGRAD[i][0]) {
    const [t0, a1, b1] = SKYGRAD[i - 1], [t1, a2, b2] = SKYGRAD[i], k = smooth((frac - t0) / (t1 - t0));
    return [mixc(a1, a2, k), mixc(b1, b2, k)];
  }
  return [SKYGRAD[6][1], SKYGRAD[6][2]];
}
function drawSky(g, w, h, camX, camY, zoom, frac, biome, time, rainbow) {
  const [top, bot] = skyGradAt(frac), L = skyLight(frac), night = clamp(1 - (L[0] - .15) / .6, 0, 1);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, rgbs(...top)); gr.addColorStop(1, rgbs(...bot));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // estrelas
  if (night > .04) {
    for (const s of SKY.stars) { const a = night * (.55 + .45 * Math.sin(time * 1.6 + s.p)); g.fillStyle = `rgba(255,255,240,${a})`; g.fillRect((s.x * w + camX * .01) % w, s.y * h * .8 - (camY - 1900) * .02, s.s, s.s); }
  }
  // sol e lua
  const vy = -(camY - 1900) * .04 * zoom;
  const sp = (frac - .04) / .57;
  if (sp > -.08 && sp < 1.08) {
    const x = w * (.05 + .9 * sp), y = h * .8 - Math.sin(clamp(sp, 0, 1) * PI) * h * .66 + vy;
    glowDot(g, x, y, 120 * zoom, '#ffd27a', .35 * (1 - night)); g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(x, y, 26 * zoom, 0, TAU); g.fill();
    g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x, y, 21 * zoom, 0, TAU); g.fill();
  }
  let mp = (frac - .61) / .43; if (frac < .04) mp = (frac + 1 - .61) / .43;
  if (mp > -.05 && mp < 1.05) {
    const x = w * (.05 + .9 * mp), y = h * .8 - Math.sin(clamp(mp, 0, 1) * PI) * h * .62 + vy;
    glowDot(g, x, y, 90 * zoom, '#aac4ff', .3); g.fillStyle = '#e9eef8'; g.beginPath(); g.arc(x, y, 20 * zoom, 0, TAU); g.fill();
    g.fillStyle = 'rgba(150,160,190,.5)'; for (const [dx, dy, r] of [[-6, -4, 4], [5, 3, 5], [-2, 8, 3], [8, -7, 2.5]]) { g.beginPath(); g.arc(x + dx * zoom, y + dy * zoom, r * zoom, 0, TAU); g.fill(); }
  }
  // nuvens
  for (const c of SKY.clouds) {
    const cx = ((c.x - time * c.s - camX * .25 * zoom) % (w + 500) + (w + 500)) % (w + 500) - 250, cy = c.y * zoom - (camY - 1900) * .18 * zoom;
    g.fillStyle = `rgba(${255 - night * 190 | 0},${255 - night * 185 | 0},${255 - night * 160 | 0},${c.a * (1 - night * .45)})`;
    const cw = c.w * zoom;
    for (let i = 0; i < 5; i++) { const ox = (i - 2) * cw * .22, rr = cw * (.2 + .08 * Math.sin(i * 1.7 + c.k * 9)); g.beginPath(); g.ellipse(cx + ox, cy - (i % 2) * cw * .05, rr, rr * .6, 0, 0, TAU); g.fill(); }
    g.beginPath(); g.ellipse(cx, cy + cw * .03, cw * .46, cw * .07, 0, 0, TAU); g.fill();
  }
  // colinas em paralaxe
  const tgt = HILLCOL[biome] || HILLCOL.forest; for (let i = 0; i < 3; i++) SKY.hill[i] += (tgt[i] - SKY.hill[i]) * .02;
  for (let k = 0; k < 3; k++) {
    const vk = [.55, .7, .85][k], fk = [.06, .12, .22][k], base = h * .55 + (1888 - camY) * vk * zoom + k * 34 * zoom;
    if (base - 140 * zoom > h) continue;
    const col = mixc(bot, SKY.hill, [.35, .6, .85][k]); const shade_ = mixc(col, L.map(v => v * 255), 0);
    g.fillStyle = rgbs(col[0] * (.45 + .55 * L[0]), col[1] * (.45 + .55 * L[1]), col[2] * (.45 + .55 * L[2]));
    g.beginPath(); g.moveTo(0, h + 10); const off = camX * fk * zoom;
    for (let x = 0; x <= w + 16; x += 16) { const wx = (x + off) / zoom; const y = base - (Math.sin(wx * .012 + k * 2) * 34 + Math.sin(wx * .031 + k) * 14 + Math.sin(wx * .0057 + k * 5) * 26) * zoom; g.lineTo(x, y); }
    g.lineTo(w + 16, h + 10); g.closePath(); g.fill();
  }
}
