#!/usr/bin/env node
'use strict';
/* Servidor estático mínimo para jogar no navegador.
 *
 *     node serve.js            ->  http://localhost:8080/
 *     node serve.js 9000       ->  http://localhost:9000/
 *
 * Serve só o jogo (index.html), o README e a pasta docs/ — não expõe src/, dev/ nem node_modules/.
 * Servido por http(s) o jogo ganha uma origem "de verdade": o salvamento (localStorage)
 * e o suporte a controle (Gamepad API) funcionam normalmente.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = fs.realpathSync(__dirname);
const ALLOW = new Set(['/', '/index.html', '/README.md']);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
};
const HEADERS = { 'Cache-Control': 'no-cache' };   // sempre a versão mais recente do jogo

// Caminho da URL -> caminho absoluto no disco, ou null se não for permitido.
function resolve(rawUrl) {
  let p = rawUrl.split('?')[0].split('#')[0];
  try { p = decodeURIComponent(p); } catch { return null; }
  if (p.includes('\0') || p.includes('\\')) return null;
  p = path.posix.normalize(p);                         // resolve "." e ".." antes de conferir a lista
  if (!p.startsWith('/')) return null;
  if (!ALLOW.has(p) && !p.startsWith('/docs/')) return null;
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  let real;
  try { real = fs.realpathSync(file); } catch { return null; }
  if (real !== ROOT && !real.startsWith(ROOT + path.sep)) return null;   // nem por link simbólico
  return { file: real, url: p };
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function listing(dir, url) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => { const n = d.name + (d.isDirectory() ? '/' : ''); return `<li><a href="${encodeURI(n)}">${esc(n)}</a></li>`; });
  return `<!doctype html><meta charset="utf-8"><title>Índice de ${esc(url)}</title><h1>Índice de ${esc(url)}</h1><hr><ul>\n${items.join('\n')}\n</ul><hr>`;
}

const send = (res, code, type, body) => {
  res.writeHead(code, { ...HEADERS, 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(res, 405, 'text/plain; charset=utf-8', '405 Method Not Allowed');
  }
  const r = resolve(req.url || '/');
  if (!r) return send(res, 404, 'text/plain; charset=utf-8', '404 Not Found');
  let st;
  try { st = fs.statSync(r.file); } catch { return send(res, 404, 'text/plain; charset=utf-8', '404 Not Found'); }

  if (st.isDirectory()) {
    if (!r.url.endsWith('/')) { res.writeHead(301, { ...HEADERS, Location: r.url + '/' }); return res.end(); }
    const idx = path.join(r.file, 'index.html');
    if (fs.existsSync(idx)) { r.file = idx; st = fs.statSync(idx); }
    else {
      const html = listing(r.file, r.url);
      res.writeHead(200, { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) });
      return res.end(req.method === 'HEAD' ? undefined : html);
    }
  }
  res.writeHead(200, {
    ...HEADERS,
    'Content-Type': TYPES[path.extname(r.file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': st.size,
    'Last-Modified': st.mtime.toUTCString(),
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(r.file).on('error', () => res.destroy()).pipe(res);
});

const porta = process.argv[2] ? Number(process.argv[2]) : 8080;
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  console.error('Porta inválida:', process.argv[2]);
  process.exit(2);
}
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `A porta ${porta} já está em uso (tente: node serve.js ${porta + 1})` : e.message);
  process.exit(1);
});
server.listen(porta, '0.0.0.0', () => {
  console.log(`120 Espadas em http://localhost:${porta}/   (Ctrl+C para parar)`);
});
