#!/usr/bin/env node
'use strict';
// Concatena src/*.js + style.css + template.html em um único arquivo autocontido (index.html).
//   node build.js          (ou: npm run build)
const fs = require('fs');
const path = require('path');

const root = __dirname;
const src = path.join(root, 'src');

// mesma normalização de quebra de linha de uma leitura em modo texto ("\r\n" e "\r" viram "\n")
const read = (f) => fs.readFileSync(path.join(src, f), 'utf8').replace(/\r\n?/g, '\n');
// substitui TODAS as ocorrências e trata o texto novo literalmente
// (String.replace do JS só troca a 1ª e interpretaria padrões como "$&" dentro do código do jogo)
const replaceAll = (s, from, to) => s.split(from).join(to);

const files = fs.readdirSync(src).filter((f) => /^\d+.*\.js$/.test(f)).sort();
const js = files.map((f) => `/* ===== ${f} ===== */\n` + read(f)).join('\n;\n');
const css = read('style.css');
const tpl = read('template.html');

// ícone da aba embutido como data URI (mantém o index.html autocontido, sem arquivos externos)
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(src, f)).toString('base64');

let html = replaceAll(tpl, '/*__STYLE__*/', css);
html = replaceAll(html, '/*__SCRIPT__*/', replaceAll(js, '</script>', '<\\/script>'));
html = replaceAll(html, '__ICON__', b64('logo_icon.png', 'image/png'));

const out = path.join(root, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log('OK', out, Math.round(Buffer.byteLength(html) / 1024), 'KB;', files.length, 'módulos');
