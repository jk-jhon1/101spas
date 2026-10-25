import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const file = process.argv[2], outDir = process.argv[3], pages = (process.argv[4] || '1-4').split(',').flatMap(s => { const [a, b] = s.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
const data = new Uint8Array(fs.readFileSync(file));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
fs.mkdirSync(outDir, { recursive: true });
for (const n of pages) {
  if (n > doc.numPages) continue;
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale: Number(process.env.SCALE || 1.6) });
  const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  fs.writeFileSync(`${outDir}/p${String(n).padStart(2, '0')}.png`, canvas.toBuffer('image/png'));
  console.log('página', n);
}
console.log('total', doc.numPages);
