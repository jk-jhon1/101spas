'use strict';
// Motor de layout do PDF: texto rico (negrito/código), tabelas, cartões e paginação.
const fs = require('fs');
const PDFDocument = require('pdfkit');

const W = 595.28, H = 841.89;
const ML = 54, MR = 54, MT = 64, MB = 58;
const CW = W - ML - MR;

const FONTS = {
  reg: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  mono: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
  monoB: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
};

const C = {
  ink: '#111827', body: '#1f2937', mut: '#64748b', soft: '#94a3b8',
  navy: '#0f172a', blue: '#1e3a8a', accent: '#b45309', accent2: '#0e7490',
  line: '#dbe2ea', card: '#f8fafc', cardLine: '#e2e8f0',
  white: '#ffffff', green: '#047857', red: '#b91c1c', violet: '#6d28d9',
};

class Doc {
  constructor(opts = {}) {
    this.doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true, compress: true, info: opts.info || {} });
    this.doc.registerFont('reg', FONTS.reg);
    this.doc.registerFont('bold', FONTS.bold);
    this.doc.registerFont('mono', FONTS.mono);
    this.doc.registerFont('monoB', FONTS.monoB);
    this.chunks = [];
    this.doc.on('data', (d) => this.chunks.push(d));
    this.done = new Promise((res) => this.doc.on('end', () => res(Buffer.concat(this.chunks))));
    this.pageNo = 0;
    this.pagePart = [];
    this.partTitle = '';
    this.y = MT;
    this.doc.on('pageAdded', () => { this.pageNo++; this.pagePart[this.pageNo] = this.partTitle; });
  }

  // ---------- página ----------
  newPage() {
    this.doc.addPage({ size: 'A4', margin: 0 });
    this.y = MT;
    if (this._orphanH3) {
      const h = this._orphanH3; this._orphanH3 = null;
      this.doc.font('bold').fontSize(10.2).fillColor(h.color || C.navy).text(h.text, ML, this.y, { lineBreak: false });
      this.y += 10.2 * 1.45;
      this._afterH3 = h;
    }
  }
  ensure(h) { if (this.y + h > H - MB) { this.newPage(); return true; } return false; }
  setPart(t) { this.partTitle = t; this.pagePart[this.pageNo] = t; }
  mark(key) { if (!this.marks) this.marks = {}; this.marks[key] = this.pageNo; return this; }
  pageBreak() { this.newPage(); return this; }

  // ---------- texto rico ----------
  tokens(text, size) {
    // **negrito** e `código` -> tokens de palavra/espaço/quebra, cada um com fontes
    const out = [];
    let bold = false, mono = false, buf = '', runs = [];
    const flushRun = () => { if (buf) { runs.push({ t: buf, f: mono ? 'mono' : (bold ? 'bold' : 'reg'), mono }); buf = ''; } };
    const flushWord = () => {
      flushRun();
      if (runs.length) out.push({ type: 'w', runs: runs.map(r => ({ ...r })), size });
      runs = [];
    };
    const pushSpace = () => { flushRun(); if (out.length && out[out.length - 1].type === 's') return; out.push({ type: 's', runs: [{ t: ' ', f: mono ? 'mono' : (bold ? 'bold' : 'reg'), mono }], size }); };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '*' && text[i + 1] === '*' && !mono) { flushWord(); bold = !bold; i++; continue; }
      if (c === '`') { flushWord(); mono = !mono; continue; }
      if (c === '\n') { flushWord(); out.push({ type: 'nl' }); continue; }
      if (c === ' ') { flushWord(); pushSpace(); continue; }
      buf += c;
    }
    flushWord();
    return out;
  }

  widthOf(str, f, size) {
    this.doc.font(f === 'mono' || f === 'monoB' ? 'mono' : f).fontSize(size);
    return this.doc.widthOfString(str);
  }

  layout(text, width, size) {
    const toks = this.tokens(text, size);
    const lines = [];
    let cur = [], curW = 0;
    const pushLine = () => { while (cur.length && cur[cur.length - 1].type === 's') { curW -= cur[cur.length - 1].w; cur.pop(); } lines.push({ toks: cur, w: curW }); cur = []; curW = 0; };
    for (const t of toks) {
      if (t.type === 'nl') { pushLine(); continue; }
      if (t.type === 's') {
        if (!cur.length) continue;
        const w = this.widthOf(' ', t.runs[0].f, size) * 0.98;
        cur.push({ ...t, w }); curW += w; continue;
      }
      let w = 0; for (const r of t.runs) w += this.widthOf(r.t, r.f, r.mono ? size * .94 : size);
      if (curW + w > width && cur.length) pushLine();
      cur.push({ ...t, w }); curW += w;
    }
    if (cur.length) pushLine();
    return lines;
  }

  lineHeight(size) { return size * 1.44; }

  drawLine(line, x, yTop, width, size, color, justify, isLast) {
    const lh = this.lineHeight(size), baseline = yTop + size * 1.05;
    const gaps = line.toks.filter(t => t.type === 's').length;
    const extra = (justify && !isLast && gaps > 0) ? Math.max(0, Math.min(9, (width - line.w) / gaps)) : 0;
    let x0 = x;
    for (const t of line.toks) {
      if (t.type === 's') { x0 += t.w + extra; continue; }
      for (const r of t.runs) {
        const sz = r.mono ? size * .94 : size;
        this.doc.font(r.f).fontSize(sz).fillColor(color)
          .text(r.t, x0, baseline, { lineBreak: false, baseline: 'alphabetic', characterSpacing: 0 });
        x0 += this.widthOf(r.t, r.f, sz);
      }
    }
    return lh;
  }

  para(text, o = {}) {
    const size = o.size || 9.4, color = o.color || C.body, gap = o.gap === undefined ? 7 : o.gap;
    const width = o.width || (CW - (o.indent || 0));
    const x = ML + (o.indent || 0);
    const lines = this.layout(text, width, size);
    const lh = this.lineHeight(size);
    if (o.keep && this.y + lines.length * lh + o.keep > H - MB) this.newPage();
    else this.ensure(lh);
    let i = 0;
    for (const ln of lines) {
      if (this.y + lh > H - MB) this.newPage();
      this.drawLine(ln, x, this.y, width, size, color, o.justify !== false, i === lines.length - 1);
      this.y += lh; i++;
    }
    this.y += gap;
    return this;
  }

  bullets(items, o = {}) {
    const size = o.size || 9.2, indent = o.indent === undefined ? 10 : o.indent;
    for (const it of items) {
      const lines = this.layout(it, CW - indent - 12, size);
      const lh = this.lineHeight(size);
      this.ensure(lh * 2);
      const y0 = this.y;
      this.doc.circle(ML + indent + 2.6, y0 + size * .55, 1.9).fill(o.dot || C.accent);
      let first = true;
      for (const ln of lines) {
        if (this.y + lh > H - MB) this.newPage();
        this.drawLine(ln, ML + indent + 12, this.y, CW - indent - 12, size, o.color || C.body, false, true);
        this.y += lh; first = false;
      }
      this.y += 2.5;
    }
    this.y += o.gap === undefined ? 4 : o.gap;
    return this;
  }

  h2(text, o = {}) {
    const size = o.size || 13.2;
    if (o.break) { this._orphanH3 = null; this.newPage(); }
    this._orphanH3 = null;
    if (o.mark) this.mark(o.mark);
    this.ensure(46);
    this.y += o.top === undefined ? 6 : o.top;
    const x = ML;
    this.doc.moveTo(x, this.y).lineTo(x + 3, this.y).lineTo(x + 3, this.y + size * 1.1).lineTo(x, this.y + size * 1.1).fill(o.color || C.accent);
    this.doc.font('bold').fontSize(size).fillColor(o.color || C.navy).text(text, x + 11, this.y + 1, { lineBreak: false });
    this.y += size * 1.25 + 6;
    return this;
  }

  h3(text, color, o) {
    const size = 10.2;
    this._orphanH3 = null;
    // o.keep: garante espaço para o bloco que vem depois (evita título órfão no pé da página)
    if (o && o.keep) { if (this.y + size * 1.45 + o.keep > H - MB) this.newPage(); else this.ensure(52); }
    else this.ensure(52);
    this.doc.font('bold').fontSize(size).fillColor(color || C.navy).text(text, ML, this.y, { lineBreak: false });
    this.y += size * 1.45;
    this._afterH3 = { text, color };
    return this;
  }

  monoLine(text, o = {}) {
    let size = o.size || 8.6;
    const maxW = CW - (o.indent || 0) - 24;
    this.doc.font(o.bold ? 'monoB' : 'mono').fontSize(size);
    // encolhe até caber; se ainda assim não couber, quebra em linhas
    while (size > 6 && this.doc.widthOfString(text) > maxW) { size -= .15; this.doc.fontSize(size); }
    const lines = this.doc.widthOfString(text) > maxW ? this.layout(text, maxW, size) : [text];
    this.ensure(lines.length * size * 1.55 + 4);
    this.doc.font(o.bold ? 'monoB' : 'mono').fontSize(size).fillColor(o.color || C.accent2);
    for (const ln of lines) {
      this.doc.text(ln, ML + (o.indent || 0), this.y, { lineBreak: false });
      this.y += size * 1.55;
    }
    this.y += (o.gap || 0);
    return this;
  }

  rule(o = {}) {
    this.ensure(8);
    this.y += o.top || 0;
    this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(o.w || .7).strokeColor(o.color || C.line).stroke();
    this.y += (o.gap === undefined ? 10 : o.gap);
    return this;
  }

  callout(kind, title, text) {
    const tint = kind === 'warn' ? '#fef3c7' : kind === 'danger' ? '#fee2e2' : kind === 'ok' ? '#dcfce7' : '#e0f2fe';
    const bar = kind === 'warn' ? '#d97706' : kind === 'danger' ? '#dc2626' : kind === 'ok' ? '#16a34a' : '#0284c7';
    const pad = 10;
    const lines = this.layout(text, CW - pad * 2 - 6, 8.9);
    const titleH = title ? 15 : 0;
    const hgt = pad * 2 + titleH + lines.length * this.lineHeight(8.9) - 3;
    this.ensure(hgt + 8);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, hgt, 5).fill(tint);
    this.doc.rect(ML, y0, 3.5, hgt).fill(bar);
    if (title) this.doc.font('bold').fontSize(9.2).fillColor(bar).text(title, ML + pad + 3, y0 + pad - 2, { lineBreak: false });
    let yy = y0 + pad + titleH;
    for (const ln of lines) { this.drawLine(ln, ML + pad + 3, yy, CW - pad * 2 - 6, 8.9, C.body, false, true); yy += this.lineHeight(8.9); }
    this.y = y0 + hgt + 11;
    return this;
  }

  table(head, rows, widths, o = {}) {
    const prevH3 = this._afterH3; this._afterH3 = null;
    const size = o.size || 8.5, pad = 5;
    const cols = widths.map(p => p * CW);
    const drawHead = () => {
      this.doc.rect(ML, this.y, CW, 20).fill(o.headBg || '#eef2f7');
      let x = ML;
      head.forEach((h, i) => {
        this.doc.font('bold').fontSize(size - .2).fillColor(C.navy).text(String(h), x + pad, this.y + 6, { width: cols[i] - pad * 2, lineBreak: false, ellipsis: true });
        x += cols[i];
      });
      this.y += 20;
    };
    this.ensure(60);
    // se a tabela inteira é pequena e não cabe, começa numa página nova
    if (!o.split) {
      const totalH = rows.reduce((a, row) => {
        const cells = row.map((c, i) => this.layout(String(c), cols[i] - pad * 2, size));
        return a + Math.max(...cells.map(c => c.length)) * this.lineHeight(size) + pad * 2 - 3;
      }, 0) + 20;
      if (totalH <= 300 && this.y + totalH > H - MB && prevH3 && !this._h3Used) {
        this._orphanH3 = prevH3; this.newPage(); this._orphanH3 = null;
      }
    }
    drawHead();
    let alt = false, drawn = 0;
    for (const row of rows) {
      const cells = row.map((c, i) => this.layout(String(c), cols[i] - pad * 2, size));
      const hgt = Math.max(...cells.map(c => c.length)) * this.lineHeight(size) + pad * 2 - 3;
      if (this.y + hgt > H - MB - (o.tight ? 0 : 52) && drawn > 0) { this.newPage(); drawHead(); alt = false; }
      if (alt) this.doc.rect(ML, this.y, CW, hgt).fill('#f8fafc');
      let x = ML;
      cells.forEach((lines, i) => {
        let yy = this.y + pad - 1;
        for (const ln of lines) { this.drawLine(ln, x + pad, yy, cols[i] - pad * 2, size, i === 0 ? (o.firstCol || C.ink) : C.body, false, true); yy += this.lineHeight(size); }
        x += cols[i];
      });
      this.y += hgt;
      drawn++;
      this.doc.moveTo(ML, this.y).lineTo(W - MR, this.y).lineWidth(.5).strokeColor('#e8edf3').stroke();
      alt = !alt;
    }
    this.y += 10;
    return this;
  }

  // ---------- capa ----------
  cover(data) {
    this.newPage();
    const d = this.doc;
    d.rect(0, 0, W, H).fill('#0a1120');
    // textura de pixels
    for (let i = 0; i < 240; i++) {
      const x = (i * 977) % W, y = (i * 613) % H;
      d.rect(x, y, 2, 2).fill(i % 7 === 0 ? 'rgba(180,83,9,.20)' : 'rgba(255,255,255,.035)');
    }
    // faixa dourada
    d.rect(0, 0, W, 5).fill('#b45309');
    d.font('mono').fontSize(9).fillColor('#cbd5e1').text('DOCUMENTAÇÃO TÉCNICA  ·  CÓDIGO-FONTE', ML, 92, { characterSpacing: 1.4 });
    d.font('bold').fontSize(54).fillColor('#f8fafc').text('101spas', ML, 118, { lineBreak: false });
    d.font('bold').fontSize(17).fillColor('#fbbf24').text('Guia do código', ML, 190, { lineBreak: false });
    d.font('reg').fontSize(11.5).fillColor('#cbd5e1').text('O que cada pasta e cada arquivo faz,\ne como o jogo funciona por dentro.', ML, 216, { width: 340, lineGap: 3 });

    drawPixelSword(d, W - 176, 120, 5.2);

    // cartão de números
    const bx = ML, by = 340, bw = 330, bh = 172;
    d.save();
    d.roundedRect(bx, by, bw, bh, 8).fillColor('#ffffff').fillOpacity(0.055).fill();
    d.restore();
    d.save();
    d.roundedRect(bx, by, bw, bh, 8).lineWidth(1).strokeColor('#f8fafc').strokeOpacity(0.16).stroke();
    d.restore();
    const stats = data.stats;
    let i = 0;
    for (const [k, v] of stats) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = bx + 20 + col * 156, y = by + 18 + row * 28;
      d.font('bold').fontSize(12.5).fillColor('#fbbf24').text(String(v), x, y, { lineBreak: false });
      d.font('reg').fontSize(8.6).fillColor('#cbd5e1').text(k, x + 66, y + 2.6, { lineBreak: false });
      i++;
    }
    // dados do repositório
    let y = 540;
    d.font('mono').fontSize(8.6).fillColor('#94a3b8');
    for (const [k, v] of data.meta) {
      d.font('monoB').fontSize(8.6).fillColor('#64748b').text(k.toUpperCase(), ML, y, { lineBreak: false });
      d.font('mono').fontSize(8.6).fillColor('#e2e8f0').text(String(v), ML + 96, y, { lineBreak: false });
      y += 15;
    }
    // rodapé
    d.rect(0, H - 6, W, 6).fill('#b45309');
    d.font('reg').fontSize(8.4).fillColor('#94a3b8').text(data.footer, ML, H - 42, { width: CW, lineBreak: false });
  }

  // ---------- sumário ----------
  tocPage(entries, title) {
    this.newPage();
    this.setPart('Sumário');
    this.doc.font('bold').fontSize(24).fillColor(C.navy).text(title, ML, 78, { lineBreak: false });
    this.doc.rect(ML, 114, 46, 3).fill(C.accent);
    let y = 140;
    for (const e of entries) {
      if (e.group) {
        y += 6;
        this.doc.font('bold').fontSize(8).fillColor(C.soft).text(e.group.toUpperCase(), ML, y, { characterSpacing: 1.1, lineBreak: false });
        y += 16; continue;
      }
      this.doc.font('reg').fontSize(9.4).fillColor(C.body).text(e.num + '.', ML, y, { lineBreak: false, width: 18 });
      this.doc.font(e.bold ? 'bold' : 'reg').fontSize(9.6).fillColor(e.bold ? C.navy : C.body).text(e.title, ML + 24, y, { lineBreak: false });
      const num = String(e.page || '');
      this.doc.font('mono').fontSize(8.8).fillColor(C.mut).text(num, W - MR - 26, y + 1, { lineBreak: false, width: 26, align: 'right' });
      const tw = this.doc.widthOfString(e.title);
      const x0 = ML + 24 + tw + 6, x1 = W - MR - 34;
      if (x1 > x0) {
        for (let x = x0; x < x1; x += 4) this.doc.moveTo(x, y + 8).lineTo(x + 1.4, y + 8).lineWidth(.5).strokeColor('#d7dee8').stroke();
      }
      y += 18.5;
      if (y > H - MB - 10) { this.newPage(); y = MT; }
    }
  }

  // ---------- cartão de arquivo ----------
  // Mede e desenha com os MESMOS números (nada de surpresa no meio da página).
  cardBlocks(f) {
    const innerW = CW - 30, blocks = [];
    if (f.summary) blocks.push({ kind: 'p', lines: this.layout(f.summary, innerW, 8.9), size: 8.9 });
    if (f.what) blocks.push({ kind: 'p', lines: this.layout(f.what, innerW, 8.9), size: 8.9 });
    for (const it of (f.how || [])) blocks.push({ kind: 'li', lines: this.layout(it, innerW - 12, 8.7), size: 8.7 });
    if (f.funcs) blocks.push({ kind: 'mono', lines: this.layout(f.funcs, innerW - 6, 8.2), size: 8.2 });
    if (f.deps || f.used) blocks.push({ kind: 'meta' });
    for (const b of blocks) {
      if (b.kind === 'p') b.h = b.lines.length * this.lineHeight(b.size) + 4;
      else if (b.kind === 'li') b.h = b.lines.length * this.lineHeight(b.size) + 2.5;
      else if (b.kind === 'mono') b.h = b.lines.length * this.lineHeight(b.size) + 7;
      else b.h = 2 * this.lineHeight(7.7) + 6;
    }
    const headH = 34, total = headH + blocks.reduce((a, b) => a + b.h, 0) + 8;
    return { blocks, headH, total };
  }
  cardHeight(f) { return this.cardBlocks(f).total; }

  fileCard(f) {
    const accent = f.color || C.accent;
    const { blocks, headH, total } = this.cardBlocks(f);
    const innerW = CW - 30;
    const fits = total <= H - MB - MT;
    if (!fits) return this.fileCardFlow(f, blocks, headH, accent, innerW);
    this.ensure(total + 14);
    const y0 = this.y;
    this.doc.roundedRect(ML, y0, CW, total, 6).fillAndStroke(f.bg || C.card, f.border || C.cardLine);
    this.doc.rect(ML, y0, 3.5, total).fill(accent);
    this.doc.font('monoB').fontSize(10).fillColor(C.navy).text(f.name, ML + 14, y0 + 7, { lineBreak: false });
    if (f.lines) this.doc.font('mono').fontSize(7.8).fillColor(C.soft).text(f.lines + ' linhas', W - MR - 66, y0 + 8, { width: 54, align: 'right', lineBreak: false });
    if (f.tag) this.doc.font('bold').fontSize(6.9).fillColor(accent).text(f.tag.toUpperCase(), W - MR - 200, y0 + 8.5, { width: 128, align: 'right', lineBreak: false });
    if (f.role) this.doc.font('reg').fontSize(8.2).fillColor(C.mut).text(f.role, ML + 14, y0 + 21, { lineBreak: false });

    let y = y0 + headH;
    for (const b of blocks) {
      if (b.kind === 'p' || b.kind === 'li') {
        const lh = this.lineHeight(b.size), ind = b.kind === 'li' ? 12 : 0;
        b.lines.forEach((ln, i) => {
          if (b.kind === 'li' && i === 0) this.doc.circle(ML + 17, y + b.size * .55, 1.7).fill(accent);
          this.drawLine(ln, ML + 14 + ind, y, innerW - ind, b.size, C.body, false, true);
          y += lh;
        });
        y += b.kind === 'li' ? 2 : 3.5;
      } else if (b.kind === 'mono') {
        const lh = this.lineHeight(b.size);
        this.doc.roundedRect(ML + 14, y - 2, innerW + 2, b.lines.length * lh + 5, 3).fill('#eef2f7');
        for (const ln of b.lines) { this.drawLine(ln, ML + 19, y + 1, innerW - 6, b.size, '#334155', false, true); y += lh; }
        y += 5;
      } else {
        y += 2;
        const lh = this.lineHeight(7.7);
        if (f.deps) {
          this.doc.font('bold').fontSize(7.2).fillColor(C.soft).text('USA', ML + 14, y + .5, { lineBreak: false });
          this.doc.font('reg').fontSize(7.7).fillColor(C.mut).text(f.deps, ML + 42, y, { width: innerW - 34, lineBreak: false, ellipsis: true });
          y += lh;
        }
        if (f.used) {
          this.doc.font('bold').fontSize(7.2).fillColor(C.soft).text('USADO POR', ML + 14, y + .5, { lineBreak: false });
          this.doc.font('reg').fontSize(7.7).fillColor(C.mut).text(f.used, ML + 76, y, { width: innerW - 68, lineBreak: false, ellipsis: true });
          y += lh;
        }
        y += 4;
      }
    }
    this.y = y0 + total + 10;
    return this;
  }

  // cartão comprido: flui pelas páginas, com a faixa de destaque em cada uma
  fileCardFlow(f, blocks, headH, accent, innerW) {
    this.ensure(headH + 40);
    let y = this.y, firstPage = true;
    const head = () => {
      this.doc.rect(ML, y, 3.5, headH).fill(accent);
      if (firstPage) {
        this.doc.font('monoB').fontSize(10.2).fillColor(C.navy).text(f.name, ML + 14, y + 9, { lineBreak: false });
        if (f.lines) this.doc.font('mono').fontSize(7.8).fillColor(C.soft).text(f.lines + ' linhas', W - MR - 66, y + 10, { width: 54, align: 'right', lineBreak: false });
        if (f.role) this.doc.font('reg').fontSize(8.4).fillColor(C.mut).text(f.role, ML + 14, y + 24, { lineBreak: false });
      } else {
        this.doc.font('monoB').fontSize(9).fillColor(C.navy).text(f.name + ' (cont.)', ML + 14, y + 12, { lineBreak: false });
      }
      y += headH;
    };
    head();
    for (const b of blocks) {
      if (b.kind === 'p' || b.kind === 'li') {
        const lh = this.lineHeight(b.size), ind = b.kind === 'li' ? 12 : 0;
        b.lines.forEach((ln, i) => {
          if (y + lh > H - MB) { this.newPage(); y = MT; head(); }
          if (b.kind === 'li' && i === 0) this.doc.circle(ML + 17, y + b.size * .55, 1.7).fill(accent);
          this.drawLine(ln, ML + 14 + ind, y, innerW - ind, b.size, C.body, false, true);
          y += lh;
        });
        y += b.kind === 'li' ? 2.5 : 4;
      } else if (b.kind === 'mono') {
        const lh = this.lineHeight(b.size);
        const need = b.lines.length * lh + 5;
        if (y + need > H - MB) { this.newPage(); y = MT; head(); }
        this.doc.roundedRect(ML + 14, y - 2, innerW + 2, need, 3).fill('#eef2f7');
        for (const ln of b.lines) { this.drawLine(ln, ML + 19, y + 1, innerW - 6, b.size, '#334155', false, true); y += lh; }
        y += 5;
      } else {
        const lh = this.lineHeight(7.7); y += 2;
        if (y + lh * 2 > H - MB) { this.newPage(); y = MT; head(); }
        if (f.deps) {
          this.doc.font('bold').fontSize(7.2).fillColor(C.soft).text('USA', ML + 14, y + .5, { lineBreak: false });
          this.doc.font('reg').fontSize(7.7).fillColor(C.mut).text(f.deps, ML + 42, y, { width: innerW - 34, lineBreak: false, ellipsis: true });
          y += lh;
        }
        if (f.used) {
          this.doc.font('bold').fontSize(7.2).fillColor(C.soft).text('USADO POR', ML + 14, y + .5, { lineBreak: false });
          this.doc.font('reg').fontSize(7.7).fillColor(C.mut).text(f.used, ML + 76, y, { width: innerW - 68, lineBreak: false, ellipsis: true });
          y += lh;
        }
        y += 4;
      }
    }
    this.doc.moveTo(ML, this.y - 4).lineTo(ML, y + 4).lineWidth(.8).strokeColor(f.border || C.cardLine).stroke();
    firstPage = false;
    this.y = y + 14;
    return this;
  }

  // ---------- página divisória de parte ----------
  partPage(num, title, sub) {
    this.newPage();
    this.setPart('Parte ' + num + ' — ' + title);
    const d = this.doc;
    d.rect(0, 0, W, H).fill('#f4f6f9');
    d.rect(0, 0, W, 10).fill('#0f172a');
    d.rect(0, H - 10, W, 10).fill('#0f172a');
    d.rect(ML, 210, 46, 4).fill('#b45309');
    d.font('monoB').fontSize(10).fillColor('#b45309').text('PARTE ' + num, ML, 232, { characterSpacing: 2, lineBreak: false });
    d.font('bold').fontSize(38).fillColor('#0f172a').text(title, ML, 258, { width: CW - 20, lineGap: 2 });
    d.font('reg').fontSize(11).fillColor('#475569').text(sub, ML, 258 + 38 * 1.25 + 14, { width: CW - 90, lineGap: 4 });
    // marca-d'água: espada em pixel-art, em vez do número (o "II" virava duas barras)
    drawPixelSword(d, W - MR - 96, H - 430, 11, { ghost: true });
    this.newPage();   // o conteúdo da parte começa numa página limpa
    this.y = MT;
    return this;
  }

  // ---------- diagrama de fluxo vertical ----------
  flow(items, o = {}) {
    const gap = o.gap === undefined ? 14 : o.gap;
    const innerW = CW - 70;
    const meas = it => 26 + this.layout(it.text || '', innerW - 26, 8.7).length * this.lineHeight(8.7) + 6;
    // o grupo inteiro cabe numa página? então não o divida
    const need = items.reduce((a, it) => a + meas(it) + gap, 0) - gap;
    if (need < H - MT - MB && this.y + need > H - MB) this.newPage();
    items.forEach((it, idx) => {
      const h = meas(it), h2 = idx < items.length - 1 ? meas(items[idx + 1]) : 0;
      // não deixa um passo sozinho no pé da página: leva o par inteiro
      if (this.y + h + (idx < items.length - 1 ? Math.min(h2, 60) : 0) > H - MB) this.newPage();
      const y0 = this.y;
      this.doc.roundedRect(ML + 34, y0, CW - 34, h, 5).fill('#ffffff').strokeColor('#e2e8f0').lineWidth(.8).stroke();
      this.doc.roundedRect(ML, y0 + h / 2 - 11, 24, 22, 4).fill(it.color || C.accent);
      this.doc.font('bold').fontSize(11).fillColor('#ffffff').text(String(it.n || idx + 1), ML, y0 + h / 2 - 5.5, { width: 24, align: 'center', lineBreak: false });
      const ttl = String(it.title || '').replace(/`/g, '').replace(/\*\*/g, '');
      this.doc.font('bold').fontSize(9.6).fillColor(C.navy).text(ttl, ML + 46, y0 + 8, { lineBreak: false });
      const lines = this.layout(it.text || '', innerW - 26, 8.7);
      let yy = y0 + 24;
      for (const ln of lines) { this.drawLine(ln, ML + 46, yy, innerW - 26, 8.7, '#475569', false, true); yy += this.lineHeight(8.7); }
      if (idx < items.length - 1) {
        this.doc.moveTo(ML + 12, y0 + h + 2).lineTo(ML + 12, y0 + h + gap - 2).lineWidth(1.2).strokeColor('#cbd5e1').stroke();
      }
      this.y = y0 + h + gap;
    });
    this.y += 2;
    return this;
  }

  // ---------- texto rico ----------
  finish() {
    const range = this.doc.bufferedPageRange();
    const total = range.count;
    for (let i = 0; i < total; i++) {
      this.doc.switchToPage(range.start + i);
      const n = i + 1;
      if (n === 1) continue;
      const part = this.pagePart[n] || '';
      this.doc.font('reg').fontSize(7.4).fillColor('#94a3b8').text('101spas · guia do código', ML, 30, { lineBreak: false });
      if (part) this.doc.font('reg').fontSize(7.4).fillColor('#94a3b8').text(part, W - MR - 220, 30, { width: 220, align: 'right', lineBreak: false });
      this.doc.moveTo(ML, 42).lineTo(W - MR, 42).lineWidth(.6).strokeColor('#e5eaf0').stroke();
      this.doc.moveTo(ML, H - 40).lineTo(W - MR, H - 40).lineWidth(.6).strokeColor('#e5eaf0').stroke();
      this.doc.font('mono').fontSize(7.2).fillColor('#94a3b8').text(String(n).padStart(2, '0') + ' / ' + total, W - MR - 60, H - 33, { width: 60, align: 'right', lineBreak: false });
      this.doc.font('reg').fontSize(7.2).fillColor('#b6c0cc').text('documento gerado a partir do código-fonte', ML, H - 33, { lineBreak: false });
    }
    this.doc.end();
    return this.done;
  }
}

// espada pixel-art decorativa da capa (desenhada no canvas do PDF)
function drawPixelSword(d, x, y, s, o) {
  o = o || {};
  const ghost = !!o.ghost;
  const BC = ghost ? '#e2e7f0' : '#e3e9f4', BH = ghost ? '#eef1f7' : '#ffffff';
  const ED = ghost ? '#d6dde9' : '#93a4bf', ED2 = ghost ? '#d0d8e6' : '#7b8aa5';
  const blade = (i, j, light) => d.rect(x + i * s, y + j * s, s + .4, s + .4).fill(light ? BH : BC);
  // lâmina: 4 px de largura, 3 de comprimento em px de arte (colunas 3..6)
  const BL = 20;
  for (let j = 0; j < BL; j++) {
    for (let i = 0; i < 4; i++) {
      if (j === 0 && (i === 0 || i === 3)) continue;   // ponta: 2 px centrais
      if (j === 1 && (i === 0 || i === 3)) continue;
      blade(3 + i, j, i === 1 && j > 1);
    }
    if (j >= 2) {
      d.rect(x + 2.6 * s, y + j * s, s * .4, s + .2).fill(ED);
      d.rect(x + 6.9 * s, y + j * s, s * .4, s + .2).fill(ED2);
    }
  }
  // guarda dourada (colunas 1..7)
  for (let i = 1; i <= 7; i++) {
    d.rect(x + i * s, y + BL * s + s * .3, s + .2, s * .9).fill(ghost ? '#e6ebf3' : (i < 4 ? '#fbbf24' : '#d99b16'));
    d.rect(x + i * s, y + BL * s + s * 1.3, s + .2, s * .35).fill(ghost ? '#eef1f7' : '#7c2d12');
  }
  d.rect(x + 3.2 * s, y + BL * s - s * .5, s * 1.6, s * .8).fill(ghost ? '#edf0f6' : '#fde68a');
  // cabo (2 px de largura, colunas 3.5..5.5)
  for (let j = 0; j < 6; j++) {
    d.rect(x + 3.4 * s, y + (BL + 1.7 + j) * s, s * 1.4, s + .2).fill(ghost ? '#e9edf4' : (j % 2 ? '#7c2d12' : '#9a3412'));
    d.rect(x + 3.4 * s, y + (BL + 1.7 + j) * s, s * .4, s).fill(ghost ? '#f1f4f9' : (j % 2 ? '#a16207' : '#c2410c'));
  }
  // pomo
  d.rect(x + 3 * s, y + (BL + 7.9) * s, s * 2.2, s * 1.1).fill(ghost ? '#e6ebf3' : '#fbbf24');
  d.rect(x + 3.4 * s, y + (BL + 8.1) * s, s * .7, s * .5).fill(ghost ? '#f1f4f9' : '#fde68a');
  // brilhos
  if (ghost) return;
  for (let k = 0; k < 10; k++) {
    d.save();
    d.rect(x + (7.2 + (k % 2) * .6) * s, y + (2 + k * 1.7) * s, s * .45, s * .45).fillColor('#fbbf24').fillOpacity(.22).fill();
    d.restore();
  }
}

module.exports = { Doc, C, W, H, ML, MR, MT, MB, CW };
