# Gerador do PDF `docs/guia_do_codigo.pdf`

Ferramenta de documentação (não entra no jogo, não é usada pelo build).

```bash
npm init -y
npm install pdfkit pdfjs-dist @napi-rs/canvas
node build.js ../../docs/guia_do_codigo.pdf
# conferência visual: renderiza páginas em PNG
node render.mjs ../../docs/guia_do_codigo.pdf /tmp/paginas 1-10
```

- `engine.js` — motor de composição sobre o PDFKit (capa, sumário, cartões de arquivo, tabelas, diagramas).
- `content_a..d.js` — o texto do guia, por parte (visão geral, raiz, `src/`, `dev/`, `docs/`, capítulos finais, apêndices).
- `build.js` — faz duas passadas: a primeira descobre em que página cada seção cai, a segunda escreve o sumário com os números certos.
- `render.mjs` — rasteriza o PDF com pdfjs + canvas para revisar o layout.

As fontes usadas são as DejaVu do sistema (`/usr/share/fonts/truetype/dejavu/`).
