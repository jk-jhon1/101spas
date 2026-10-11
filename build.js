#!/usr/bin/env node
'use strict';
// Concatena src/*.js + style.css (+ skin_blue.css e skin_dark.css, as duas aparências da interface) + template.html em um único arquivo autocontido (index.html).
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
const css = read('style.css'), skinDark = read('skin_dark.css'), skinBlue = read('skin_blue.css');
const tpl = read('template.html');

let html = replaceAll(tpl, '/*__STYLE__*/', css);
html = replaceAll(html, '/*__SKIN_DARK__*/', skinDark);
html = replaceAll(html, '/*__SKIN_BLUE__*/', skinBlue);
html = replaceAll(html, '/*__SCRIPT__*/', replaceAll(js, '</script>', '<\\/script>'));

const out = path.join(root, 'index.html');
fs.writeFileSync(out, html, 'utf8');
fs.writeFileSync(path.join(root, 'dev', 'bundle.js'), js, 'utf8');   // descartável (ignorado pelo git): útil para depurar
console.log('OK', out, Math.round(Buffer.byteLength(html) / 1024), 'KB;', files.length, 'módulos');
