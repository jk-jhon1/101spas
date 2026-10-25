'use strict';
// Motor de páginas do Guia completo do jogo, no mesmo modelo do guia anterior:
// cabeçalho/rodapé, faixa de parte, títulos numerados com filete, caixas de números,
// tabelas de cabeçalho azul, fichas de espada e de chefe, retratos e folhas de imagem.
const fs = require('fs'), path = require('path');
const PDFDocument = require(path.join(__dirname, '..', 'pdf', 'node_modules', 'pdfkit', 'js', 'pdfkit.js'));

const W = 595.28, H = 841.89;
const ML = 54, MR = 54, MT = 62, MB = 62;
const CW = W - ML - MR;

const FONTS = {
  reg: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  mono: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
  monoB: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
};
const C = {
  ink: '#0f172a', body: '#1f2937', mut: '#64748b', soft: '#94a3b8',
  navy: '#1e3a8a', navy2: '#172554', accent: '#b45309', line: '#dbe2ea',
  gold: '#fbbf24', green: '#047857', red: '#b91c1c', violet: '#5b21b6', sky: '#0e7490',
};

class Doc {
  constructor(info) {
    this.doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true, compress: true, info: info || {} });
    for (const k of Object.keys(FONTS)) this.doc.registerFont(k, FONTS[k]);
    this.chunks = [];
    this.doc.on('data', (d) => this.chunks.push(d));
    this.done = new Promise((res) => this.doc.on('end', () => res(Buffer.concat(this.chunks))));
    this.pageNo = 0; this.pagePart = []; this.partTitle = ''; this.y = MT;
    this.marks = {}; this.outline = [];
    this.pageColors = {};
    this.doc.on('pageAdded', () => { this.pageNo++; this.pagePart[this.pageNo] = this.partTitle; });
  }
  // ---------------- páginas ----------------
  newPage() { this.doc.addPage({ size: 'A4', margin: 0 }); this.y = MT; return this; }
  ensure(h) { if (this.y + h > H - MB) this.newPage(); return this; }
  setPart(t) { this.partTitle = t; this.pagePart[this.pageNo] = t; }
  mark(key, title, parent) { this.marks[key] = this.pageNo; this.outline.push({ key, title, page: this.pageNo, parent }); return this; }
  // ---------------- texto rico ----------------
  tokens(text, size) {
    const out = []; let bold = false, mono = false, buf = '', runs = [];
    const flushRun = () => { if (buf) { runs.push({ t: buf, f: mono ? 'mono' : (bold ? 'bold' : 'reg'), mono }); buf = ''; } };
    const flushWord = () => { flushRun(); if (runs.length) out.push({ type: 'w', runs: runs.map(r => Object.assign({}, r)), size }); runs = []; };
    const pushSpace = () => { flushRun(); if (out.length && out[out.length - 1].type === 's') return; out.push({ type: 's', runs: [{ t: ' ', f: mono ? 'mono' : (bold ? 'bold' : 'reg'), mono }], size }); };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '*' && text[i + 1] === '*' && !mono) { flushWord(); bold = !bold; i++; continue; }
      if (c === '`') { flushWord(); mono = !mono; continue; }
      if (c === '\n') { flushWord(); out.push({ type: 'nl' }); continue; }
      if (c === ' ') { flushWord(); pushSpace(); continue; }
      buf += c;
    }
    flushWord(); return out;
  }
  widthOf(str, f, size) { this.doc.font(f === 'mono' || f === 'monoB' ? 'mono' : f).fontSize(size); return this.doc.widthOfString(str); }
  layout(text, width, size) {
    const toks = this.tokens(String(text), size), lines = []; let cur = [], curW = 0;
    const pushLine = () => { while (cur.length && cur[cur.length - 1].type === 's') { curW -= cur[cur.length - 1].w; cur.pop(); } lines.push({ toks: cur, w: curW }); cur = []; curW = 0; };
    for (const t of toks) {
      if (t.type === 'nl') { pushLine(); continue; }
      if (t.type === 's') { if (!cur.length) continue; const w = this.widthOf(' ', t.runs[0].f, size) * .98; cur.push(Object.assign({}, t, { w })); curW += w; continue; }
      let w = 0; for (const r of t.runs) w += this.widthOf(r.t, r.f, r.mono ? size * .94 : size);
      if (curW + w > width && cur.length) pushLine();
      cur.push(Object.assign({}, t, { w })); curW += w;
    }
    if (cur.length) pushLine();
    return lines;
  }
  lineHeight(size) { return size * 1.44; }
  drawLine(line, x, yTop, width, size, color, justify, isLast) {
    const lh = this.lineHeight(size), baseline = yTop + size * 1.05;
    const gaps = line.toks.filter(t => t.type === 's').length;
    const extra = (justify && !isLast && gaps > 0) ? Math.max(0, Math.min(8, (width - line.w) / gaps)) : 0;
    let x0 = x;
    for (const t of line.toks) {
      if (t.type === 's') { x0 += t.w + extra; continue; }
      for (const r of t.runs) {
        const sz = r.mono ? size * .94 : size;
        this.doc.font(r.f).fontSize(sz).fillColor(color).text(r.t, x0, baseline, { lineBreak: false, baseline: 'alphabetic' });
        x0 += this.widthOf(r.t, r.f, sz);
      }
    }
    return lh;
  }
  para(text, o = {}) {
    const size = o.size || 9.4, color = o.color || C.body, gap = o.gap === undefined ? 7 : o.gap;
    const width = o.width || (CW - (o.indent || 0)), x = ML + (o.indent || 0);
    const lines = this.layout(text, width, size), lh = this.lineHeight(size);
    if (o.keep) { if (this.y + lines.length * lh + o.keep > H - MB) this.newPage(); } else this.ensure(lh);
    let i = 0;
    for (const ln of lines) {
      if (this.y + lh > H - MB) this.newPage();
      this.drawLine(ln, x, this.y, width, size, color, o.justify !== false, i === lines.length - 1);
      this.y += lh; i++;
    }
    this.y += gap; return this;
  }
  bullets(items, o = {}) {
    const size = o.size || 9.2, indent = o.indent === undefined ? 8 : o.indent, lh = this.lineHeight(size);
    for (const it of items) {
      const lines = this.layout(it, CW - indent - 12, size);
      this.ensure(lh * 2);
      this.doc.circle(ML + indent + 3, this.y + size * .55, 1.9).fill(o.dot || C.accent);
      for (const ln of lines) {
        if (this.y + lh > H - MB) this.newPage();
        this.drawLine(ln, ML + indent + 12, this.y, CW - indent - 12, size, o.color || C.body, false, true);
        this.y += lh;
      }
      this.y += 2.6;
    }
    this.y += o.gap === undefined ? 5 : o.gap; return this;
  }
  // ---------------- títulos ----------------
  h2(num, title, o = {}) {
    const size = o.size || 13.4;
    if (o.break) this.newPage();
    if (o.mark) this.mark(o.mark, (num ? num + ' ' : '') + title);
    this.ensure(58);
    this.y += o.top === undefined ? 8 : o.top;
    const x = ML;
    if (num) {
      this.doc.font('bold').fontSize(size).fillColor(C.accent).text(num, x, this.y, { lineBreak: false });
      const nw = this.doc.widthOfString(num);
      this.doc.font('bold').fontSize(size).fillColor(C.navy).text(title, x + nw + 6, this.y, { lineBreak: false });
    } else this.doc.font('bold').fontSize(size).fillColor(C.navy).text(title, x, this.y, { lineBreak: false });
    this.y += size * 1.3 + 5;
    this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(1.4).strokeColor('#f0b03c').stroke();
    this.y += 11;
    return this;
  }
  h3(text, o = {}) {
    const size = o.size || 10.4;
    this.ensure((o.keep || 40) + 16);
    this.y += o.top === undefined ? 4 : o.top;
    this.doc.font('bold').fontSize(size).fillColor(o.color || C.navy).text(text, ML, this.y, { lineBreak: false });
    this.y += size * 1.45 + 2;
    return this;
  }
  // ---------------- blocos do modelo ----------------
  partBand(num, title, sub) {
    this.newPage();
    this.setPart('Parte ' + num + ' — ' + title);
    this.mark('p' + num, 'Parte ' + num + ' — ' + title);
    const y0 = this.y - 6, h = 104;
    // faixa azul com brilho no canto
    this.doc.save();
    this.doc.roundedRect(ML, y0, CW, h, 7).fill('#1e3a8a');
    const grd = this.doc.radialGradient(ML + CW - 60, y0 + 34, 6, ML + CW - 60, y0 + 34, 86);
    grd.stop(0, '#7f9cd8', .30).stop(.55, '#3b5aa8', .16).stop(1, '#1e3a8a', 0);
    this.doc.roundedRect(ML, y0, CW, h, 7).fill(grd);
    this.doc.restore();
    this.doc.font('bold').fontSize(9.6).fillColor(C.gold).text('PARTE ' + num, ML + 20, y0 + 18, { characterSpacing: 1.8, lineBreak: false });
    this.doc.font('bold').fontSize(21).fillColor('#ffffff').text(title, ML + 20, y0 + 34, { lineBreak: false, width: CW - 40, ellipsis: true });
    const lh = 11.6;
    this.doc.font('reg').fontSize(9.2).fillColor('#c7d2fe').text(sub, ML + 20, y0 + 66, { width: CW - 40, lineGap: 1.4, height: lh * 2 });
    this.doc.rect(ML, y0 + h + 4, CW, 2.6).fill(C.gold);
    this.y = y0 + h + 22;
    return this;
  }
  numBoxes(items, o = {}) {
    const perRow = o.perRow || 4, gap = o.gap === undefined ? 10 : o.gap, h = o.height || 46;
    const bw = (CW - gap * (perRow - 1)) / perRow;
    for (let i = 0; i < items.length; i += perRow) {
      this.ensure(h + gap);
      const row = items.slice(i, i + perRow);
      row.forEach(([num, label], j) => {
        const x = ML + j * (bw + gap);
        this.doc.roundedRect(x, this.y, bw, h, 4).fill('#1b2c6b');
        this.doc.rect(x, this.y, bw, 1.6).fill('#33509e');
        this.doc.font('bold').fontSize(17).fillColor(C.gold).text(String(num), x + 10, this.y + 7, { lineBreak: false });
        const nw = this.doc.widthOfString(String(num));
        const labelW = bw - 20 - nw - 8;
        this.doc.font('reg').fontSize(7.6).fillColor('#c9d6ff');
        if (labelW < 52) {
          const ls = this.layout(label, bw - 20, 7.0);
          let yy = this.y + 24;
          for (const ln of ls.slice(0, 2)) { this.drawLine(ln, x + 10, yy, bw - 20, 7.0, '#c9d6ff', false, true); yy += 9.6; }
        } else {
          const ls = this.layout(label, labelW, 7.6);
          let yy = this.y + 13;
          for (const ln of ls.slice(0, 2)) { this.drawLine(ln, x + 10 + nw + 8, yy, labelW, 7.6, '#c9d6ff', false, true); yy += this.lineHeight(7.6); }
        }
      });
      this.y += h + gap;
    }
    this.y += 4; return this;
  }
  callout(kind, title, text) {
    const tint = kind === 'warn' ? '#fef3c7' : kind === 'danger' ? '#fee2e2' : kind === 'ok' ? '#dcfce7' : '#e8efff';
    const bar = kind === 'warn' ? '#d97706' : kind === 'danger' ? '#dc2626' : kind === 'ok' ? '#16a34a' : '#1e3a8a';
    const pad = 11, size = 8.9;
    const lines = this.layout(text, CW - pad * 2 - 7, size);
    const titleH = title ? 14 : 0;
    const hgt = pad * 2 + titleH + lines.length * this.lineHeight(size) - 3;
    this.ensure(hgt + 10);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, hgt, 4).fill(tint);
    this.doc.rect(ML, y0, 3.6, hgt).fill(bar);
    if (title) this.doc.font('bold').fontSize(9.2).fillColor(bar).text(title, ML + pad + 4, y0 + pad - 2, { lineBreak: false });
    let yy = y0 + pad + titleH;
    for (const ln of lines) { this.drawLine(ln, ML + pad + 4, yy, CW - pad * 2 - 7, size, '#1f2937', false, true); yy += this.lineHeight(size); }
    this.y = y0 + hgt + 12; return this;
  }
  table(head, rows, widths, o = {}) {
    const size = o.size || 8.3, pad = 4.6, icW = o.icons ? 14 : 0;
    const cols = widths.map(p => p * CW);
    const headH = o.headH || 18;
    const drawHead = () => {
      this.doc.rect(ML, this.y, CW, headH).fill(o.headBg || C.navy);
      let x = ML;
      head.forEach((h, i) => {
        this.doc.font('bold').fontSize(size - .1).fillColor('#ffffff').text(String(h), x + pad, this.y + (headH - size) / 2 + .5, { width: cols[i] - pad * 2, lineBreak: false, ellipsis: true });
        x += cols[i];
      });
      this.y += headH;
    };
    this.ensure(headH + 34);
    drawHead();
    let alt = false, drawn = 0;
    for (const row of rows) {
      const cells = row.map((c, i) => this.layout(String(c), cols[i] - pad * 2 - (i === 0 ? icW : 0), size));
      const hgt = Math.max.apply(null, cells.map(c => c.length)) * this.lineHeight(size) + pad * 2 - 2;
      if (this.y + hgt > H - MB && drawn > 0) { this.newPage(); drawHead(); alt = false; }
      if (alt) this.doc.rect(ML, this.y, CW, hgt).fill('#f6f8fc');
      let x = ML;
      cells.forEach((lines, i) => {
        let yy = this.y + pad - 1;
        const off = i === 0 ? icW : 0;
        if (i === 0 && o.icons && o.icons[drawn]) {
          try { this.doc.image(o.icons[drawn], x + pad, this.y + pad - 2, { width: 12, height: 12 }); } catch (e) { }
        }
        for (const ln of lines) { this.drawLine(ln, x + pad + off, yy, cols[i] - pad * 2 - off, size, i === 0 ? (o.firstCol || C.ink) : C.body, false, true); yy += this.lineHeight(size); }
        x += cols[i];
      });
      this.y += hgt; drawn++;
      this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(.45).strokeColor('#e6ecf3').stroke();
      alt = !alt;
    }
    this.y += 10; return this;
  }
  // caixa de crédito do criador (fundo azul, nome em dourado)
  creditBox(name, role, lines) {
    const pad = 16, size = 8.9, inner = CW - pad * 2 - 10;
    const ls = (lines || []).map(t => this.layout(t, inner, size));
    const bodyH = ls.reduce((a, l) => a + l.length * this.lineHeight(size) + 4, 0);
    const hgt = pad * 2 + 26 + 15 + bodyH + 2;
    this.ensure(hgt + 12);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, hgt, 6).fill('#1e3a8a');
    this.doc.rect(ML, y0, CW, 2.6).fill(C.gold);
    this.doc.font('bold').fontSize(7.6).fillColor('#ffd447').text((role || 'CRIADO E DESENVOLVIDO POR').toUpperCase(), ML + pad, y0 + pad, { characterSpacing: 1.6, lineBreak: false });
    this.doc.font('bold').fontSize(15.5).fillColor('#ffffff').text(String(name).toUpperCase(), ML + pad, y0 + pad + 14, { lineBreak: false, width: inner });
    let yy = y0 + pad + 38;
    for (const l of ls) { for (const ln of l) { this.drawLine(ln, ML + pad, yy, inner, size, '#c7d2fe', false, true); yy += this.lineHeight(size); } yy += 4; }
    this.y = y0 + hgt + 12;
    return this;
  }
  // grade de nomes (conquistas) sem cabeçalho
  nameGrid(items, o = {}) {
    const cols = o.cols || 4, size = o.size || 7.4, pad = 4, lh = this.lineHeight(size), cw = CW / cols;
    for (let i = 0; i < items.length; i += cols) {
      const cells = items.slice(i, i + cols).map(t => this.layout(String(t), cw - pad * 2, size));
      const hgt = Math.max.apply(null, cells.map(c => c.length)) * lh + pad * 2 - 2;
      this.ensure(hgt);
      if (((i / cols) | 0) % 2 === 0) this.doc.rect(ML, this.y, CW, hgt).fill('#f6f8fc');
      cells.forEach((lines, j) => {
        let yy = this.y + pad - 1;
        for (const ln of lines) { this.drawLine(ln, ML + j * cw + pad, yy, cw - pad * 2, size, o.color || C.ink, false, true); yy += lh; }
      });
      this.y += hgt;
      this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(.45).strokeColor('#e6ecf3').stroke();
    }
    this.y += 10; return this;
  }
  // imagem centralizada (PNG em buffer) com legenda
  image(png, x, y, w, h, o = {}) {
    const xx = x === null ? ML + (CW - w) / 2 : x;
    this.doc.image(png, xx, y, { width: w, height: h });
    if (o.caption) {
      const lines = this.layout(o.caption, w, 7.6);
      let yy = y + h + 5;
      for (const ln of lines) { this.drawLine(ln, xx, yy, w, 7.6, C.mut, false, true); yy += this.lineHeight(7.6); }
      return yy + 2;
    }
    return y + h + 6;
  }
  imageBlock(png, w, h, o = {}) {
    const capH = o.caption ? this.layout(o.caption, w, 7.6).length * this.lineHeight(7.6) + 8 : 0;
    this.ensure(h + capH + 12);
    this.y = this.image(png, null, this.y, w, h, o) + 4;
    return this;
  }
  // ficha de espada (como no guia antigo)
  swordCard(sw, o = {}) {
    const tier = this.tierOf(sw.tierLevel);
    const ic = o.icon, iw = 42;
    const rightW = 168, innerW = CW - 30, leftW = innerW - rightW - 10;
    const stats = o.stats;
    const mech = o.mech || sw.txt;
    const statLines = this.layout(stats, leftW - iw - 8, 7.9);
    const mechLines = this.layout(mech, leftW - iw - 8, 8.5);
    const rightLines = o.rightLines || [];
    const rMeas = rightLines.map(([k, v]) => ({ k, lines: this.layout(v, rightW - 12, 7.7) }));
    const leftH = 15 + statLines.length * this.lineHeight(7.9) + 3 + mechLines.length * this.lineHeight(8.5);
    const rightH = rMeas.reduce((a, r) => a + 11 + r.lines.length * this.lineHeight(7.7), 0);
    const hgt = Math.max(58, leftH, rightH) + 12;
    this.ensure(hgt + 8);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, hgt, 4).fillAndStroke('#ffffff', '#e2e8f0').lineWidth(.7);
    this.doc.rect(ML, y0, 4, hgt).fill(tier.col);
    if (ic) this.doc.image(ic, ML + 12, y0 + 11, { width: iw, height: iw });
    // número embaixo do ícone
    this.doc.font('mono').fontSize(7.4).fillColor(C.soft).text(String(sw.num).padStart(3, '0') + (sw.dropOnly ? ' ★' : ''), ML + 12, y0 + 11 + iw + 2, { width: iw, align: 'center', lineBreak: false });
    const tx = ML + 12 + iw + 10;
    this.doc.font('bold').fontSize(11.2).fillColor(this.inkOn(tier.col)).text(sw.swordName, tx, y0 + 8, { lineBreak: false, width: leftW - iw - 10 });
    let yy = y0 + 23;
    for (const ln of statLines) { this.drawLine(ln, tx, yy, leftW - iw - 8, 7.9, '#334155', false, true); yy += this.lineHeight(7.9); }
    yy += 2;
    for (const ln of mechLines) { this.drawLine(ln, tx, yy, leftW - iw - 8, 8.5, C.body, false, true); yy += this.lineHeight(8.5); }
    // coluna da direita (receita / chefe / baú)
    const rx = ML + 15 + leftW + 6;
    this.doc.moveTo(rx - 4, y0 + 8).lineTo(rx - 4, y0 + hgt - 8).lineWidth(.6).dash(2, { space: 2 }).strokeColor('#d7dee8').stroke().undash();
    let ry = y0 + 9;
    for (const r of rMeas) {
      this.doc.font('bold').fontSize(6.9).fillColor(C.accent).text(r.k, rx, ry, { lineBreak: false });
      ry += 11;
      for (const ln of r.lines) { this.drawLine(ln, rx, ry, rightW - 10, 7.7, '#475569', false, true); ry += this.lineHeight(7.7); }
      ry += 1;
    }
    this.y = y0 + hgt + 7;
    return this;
  }
  // ficha de chefe (retrato + colunas)
  bossCard(o) {
    const pw = o.portraitW || 150, innerW = CW - 22, rightX = ML + 11 + pw + 12, rightW = innerW - pw - 20;
    const rows = o.rows.map(([k, v]) => ({ k, lines: this.layout(v, rightW - 4, 8.1) }));
    const bodyH = rows.reduce((a, r) => a + 10.5 + r.lines.length * this.lineHeight(8.1) + 2, 0);
    const hgt = Math.max((o.portraitH || 118) + 16, bodyH + 31);
    this.ensure(hgt + 10);
    const y0 = this.y;
    const ph = hgt - 16;
    const portrait = o.portraitFn ? o.portraitFn(ph) : o.portrait;
    this.doc.roundedRect(ML, y0, CW, hgt, 5).fillAndStroke('#ffffff', '#dbe2ea').lineWidth(.8);
    this.doc.save();
    this.doc.roundedRect(ML + 11, y0 + 8, pw, ph, 3).clip();
    this.doc.image(portrait, ML + 11, y0 + 8, { width: pw, height: ph });
    this.doc.restore();
    this.doc.rect(ML + 11, y0 + 8, pw, ph).lineWidth(.6).strokeColor('#cbd5e1').stroke();
    let x = rightX;
    this.doc.font('bold').fontSize(12.6).fillColor(C.navy).text(o.title, x, y0 + 8, { lineBreak: false, width: rightW });
    let yy = y0 + 25;
    for (const r of rows) {
      this.doc.font('bold').fontSize(6.6).fillColor(C.accent).text(r.k, x, yy, { characterSpacing: .4, lineBreak: false });
      yy += 10.5;
      for (const ln of r.lines) { this.drawLine(ln, x, yy, rightW, 8.1, C.body, false, true); yy += this.lineHeight(8.1); }
      yy += 2;
    }
    this.y = y0 + hgt + 9;
    return this;
  }
  // faixa de ato (chefes novos)
  actBand(title, lines) {
    const size = 8.3, pad = 10;
    const ls = lines.map(l => this.layout(l, CW - pad * 2 - 12, size));
    const hgt = pad * 2 + 15 + ls.reduce((a, l) => a + l.length * this.lineHeight(size) + 3, 0);
    this.ensure(hgt + 10);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, hgt, 4).fill('#eef2ff');
    this.doc.rect(ML, y0, 4, hgt).fill('#4338ca');
    this.doc.font('bold').fontSize(11).fillColor('#312e81').text(title, ML + pad + 4, y0 + pad - 2, { lineBreak: false });
    let yy = y0 + pad + 15;
    for (const l of ls) { for (const ln of l) { this.drawLine(ln, ML + pad + 4, yy, CW - pad * 2 - 12, size, '#3730a3', false, true); yy += this.lineHeight(size); } yy += 3; }
    this.y = y0 + hgt + 12;
    return this;
  }
  rule(o = {}) {
    this.ensure(8); this.y += o.top || 0;
    this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(o.w || .7).strokeColor(o.color || C.line).stroke();
    this.y += (o.gap === undefined ? 10 : o.gap);
    return this;
  }
  // ---------------- capa e sumário ----------------
  coverPage(png) { this.newPage(); this.doc.image(png, 0, 0, { width: W, height: H }); this.y = H; return this; }
  tocPage(entries, title) {
    this.newPage(); this.setPart('Sumário'); this.mark('toc', 'Sumário');
    this.doc.font('bold').fontSize(24).fillColor(C.navy).text(title, ML, 74, { lineBreak: false });
    this.doc.rect(ML, 110, 46, 3).fill(C.accent);
    let y = 134;
    for (const e of entries) {
      if (e.group) {
        if (e.page !== undefined && e.page !== pi) { pi = e.page; blank(false); y = MT; }
        y += 7;
        this.doc.font('bold').fontSize(7.8).fillColor(C.soft).text(e.group.toUpperCase(), ML, y, { characterSpacing: 1.2, lineBreak: false });
        y += 15; continue;
      }
      const indent = e.sub ? 24 : 0;
      this.doc.font('reg').fontSize(e.sub ? 8.8 : 9.4);
      const numW = Math.max(24, this.doc.widthOfString(String(e.num)) + 10);
      this.doc.fillColor(C.body).text(String(e.num), ML + indent, y, { lineBreak: false });
      this.doc.font(e.sub ? 'reg' : 'bold').fontSize(e.sub ? 8.8 : 9.6).fillColor(e.sub ? '#334155' : C.navy).text(e.title, ML + indent + numW, y, { lineBreak: false });
      const num = String(e.page || '');
      this.doc.font('mono').fontSize(8.6).fillColor(C.mut).text(num, W - MR - 26, y + 1, { width: 26, align: 'right', lineBreak: false });
      const tw = this.doc.widthOfString(e.title);
      const x0 = ML + indent + numW + tw + 6, x1 = W - MR - 34;
      if (x1 > x0) for (let x = x0; x < x1; x += 4) this.doc.moveTo(x, y + 7.5).lineTo(x + 1.4, y + 7.5).lineWidth(.5).strokeColor('#d7dee8').stroke();
      if (e.page && e.mark) this.doc.link(ML + indent, y - 2, CW, 14, e.page - 1);
      y += e.sub ? 15.5 : 18;
      if (y > H - MB - 10) { this.newPage(); y = MT; }
    }
    return this;
  }
  // sumário desenhado no fim (com os números de página reais), numa página reservada
  tocDraw(index, entries, title, pages = 1, note) {
    const range = this.doc.bufferedPageRange();
    let pi = 0;
    const blank = (first) => {
      this.doc.switchToPage(range.start + index + pi);
      this.doc.save(); this.doc.rect(0, 0, W, H).fill('#ffffff'); this.doc.restore();
      if (first) {
        this.doc.font('bold').fontSize(24).fillColor(C.navy).text(title, ML, 74, { lineBreak: false });
        this.doc.rect(ML, 110, 46, 3).fill(C.accent);
      }
    };
    blank(true);
    let y = 134;
    for (const e of entries) {
      if (y > H - MB - 12) {
        if (pi + 1 >= pages) break;
        pi++; blank(false); y = MT;
      }
      if (e.group) {
        if (e.page !== undefined && e.page !== pi) { pi = e.page; blank(false); y = MT; }
        y += 7;
        this.doc.font('bold').fontSize(7.8).fillColor(C.soft).text(e.group.toUpperCase(), ML, y, { characterSpacing: 1.2, lineBreak: false });
        y += 15; continue;
      }
      const indent = e.sub ? 24 : 0;
      this.doc.font('reg').fontSize(e.sub ? 8.8 : 9.4);
      const numW = Math.max(24, this.doc.widthOfString(String(e.num)) + 10);
      this.doc.fillColor(C.body).text(String(e.num), ML + indent, y, { lineBreak: false });
      this.doc.font(e.sub ? 'reg' : 'bold').fontSize(e.sub ? 8.8 : 9.6).fillColor(e.sub ? '#334155' : C.navy).text(e.title, ML + indent + numW, y, { lineBreak: false });
      if (e.page) this.doc.font('mono').fontSize(8.6).fillColor(C.mut).text(String(e.page), W - MR - 26, y + 1, { width: 26, align: 'right', lineBreak: false });
      const tw = this.doc.widthOfString(e.title);
      const x0 = ML + indent + numW + tw + 6, x1 = W - MR - 34;
      if (x1 > x0) for (let x = x0; x < x1; x += 4) this.doc.moveTo(x, y + 7.5).lineTo(x + 1.4, y + 7.5).lineWidth(.5).strokeColor('#d7dee8').stroke();
      if (e.page && e.mark) this.doc.link(ML + indent, y - 2, CW, 14, e.page - 1);
      y += e.sub ? 15.5 : 18;
    }
    if (note && y < H - MB - 96) {
      const pad = 12, size = 8.6, lines = this.layout(note.text, CW - pad * 2 - 6, size);
      const hgt = pad * 2 + 15 + lines.length * this.lineHeight(size);
      const y0 = Math.min(H - MB - hgt - 6, y + 16);
      this.doc.roundedRect(ML, y0, CW, hgt, 5).fill('#eef2ff');
      this.doc.rect(ML, y0, 3.6, hgt).fill(C.navy);
      this.doc.font('bold').fontSize(9.4).fillColor(C.navy).text(note.title, ML + pad + 4, y0 + pad - 2, { lineBreak: false });
      let yy = y0 + pad + 15;
      for (const ln of lines) { this.drawLine(ln, ML + pad + 4, yy, CW - pad * 2 - 6, size, '#1f2937', false, true); yy += this.lineHeight(size); }
    }
    this.marks.toc = index + 1;
    this.outline.push({ key: 'toc', title: 'Sumário', page: index + 1 });
    return this;
  }
  // ---------------- fim: cabeçalho, rodapé e marcadores ----------------
  finish(o = {}) {
    const range = this.doc.bufferedPageRange(), total = range.count;
    const head = o.head || 'ESPADAS DO DESTINO', right = o.headRight || 'Guia completo do jogo';
    const foot = o.footer || '', footRight = o.footerRight || '';
    for (let i = 0; i < total; i++) {
      this.doc.switchToPage(range.start + i);
      const n = i + 1;
      if (n === 1) continue;
      this.doc.font('bold').fontSize(7.6).fillColor('#1e3a8a').text(head, ML, 28, { characterSpacing: 1.1, lineBreak: false });
      this.doc.font('reg').fontSize(7.6).fillColor('#64748b').text(right, W - MR - 180, 28, { width: 180, align: 'right', lineBreak: false });
      this.doc.font('reg').fontSize(7.4).fillColor('#94a3b8').text(foot, ML, H - 34, { width: CW - 90, lineBreak: false });
      this.doc.font('reg').fontSize(7.4).fillColor('#64748b').text('Página ' + n + ' de ' + total, W - MR - 90, H - 34, { width: 90, align: 'right', lineBreak: false });
      if (footRight) this.doc.font('reg').fontSize(7.4).fillColor('#94a3b8').text(footRight, ML, H - 46, { width: CW, lineBreak: false });
    }
    // marcadores (painel de índice do leitor)
    const root = this.doc.outline;
    const parts = {};
    for (const it of this.outline) {
      if (/^p\d+$/.test(it.key)) { parts[it.key] = root.addItem(it.title, { expanded: false, pageNumber: it.page - 1 }); continue; }
      if (it.key === 'toc') { root.addItem(it.title, { pageNumber: it.page - 1 }); continue; }
    }
    for (const it of this.outline) {
      if (/^p\d+$/.test(it.key) || it.key === 'toc') continue;
      const p = it.parent && parts[it.parent] ? parts[it.parent] : root;
      p.addItem(it.title, { pageNumber: it.page - 1 });
    }
    this.doc.end();
    return this.done;
  }
  tierOf(t) { return this.tiers ? this.tiers[t] : { col: '#334155', n: 'Tier ' + t }; }
  // cor de texto legível sobre o branco (os tiers do fim são quase brancos)
  inkOn(col) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(col).trim());
    if (!m) return col;
    const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (lum > 0.72) {
      const k = 0.55;
      return '#' + [r, g, b].map(v => Math.round(v * k).toString(16).padStart(2, '0')).join('');
    }
    return col;
  }
}
module.exports = { Doc, C, W, H, ML, MR, MT, MB, CW };
