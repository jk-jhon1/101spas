# Geradores de PDF (ferramentas de documentação)

- `prompt.js` — gera **`docs/chicotes_do_destino_prompt.pdf`** (o prompt "Chicotes do Destino": capa em canvas + 11 partes).
- `build.js` — gera `docs/guia_do_codigo.pdf` (o guia do código, em duas passadas).

Ferramenta de documentação (não entra no jogo, não é usada pelo build).

```bash
npm init -y
npm install pdfkit pdfjs-dist @napi-rs/canvas
node prompt.js                      # grava docs/chicotes_do_destino_prompt.pdf
node build.js ../../docs/guia_do_codigo.pdf
# conferência visual: renderiza páginas em PNG
node render.mjs ../../docs/guia_do_codigo.pdf /tmp/paginas 1-10
```

- `engine.js` — motor de composição sobre o PDFKit (capa, sumário, cartões de arquivo, tabelas, diagramas).
- `content_a..d.js` — o texto do guia, por parte (visão geral, raiz, `src/`, `dev/`, `docs/`, capítulos finais, apêndices).
- `build.js` — faz duas passadas: a primeira descobre em que página cada seção cai, a segunda escreve o sumário com os números certos.
- `render.mjs` — rasteriza o PDF com pdfjs + canvas para revisar o layout.
- `prompt.js` — monta o PDF do prompt do jogo em uma passada só (a capa é desenhada no `@napi-rs/canvas` e entra
  como imagem; as 12 páginas internas usam PDFKit). Ele avisa no terminal se algum texto passar do rodapé.

As fontes usadas são as DejaVu do sistema (`/usr/share/fonts/truetype/dejavu/`).
