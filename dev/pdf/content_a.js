'use strict';
// Conteúdo — parte 1: capa, sumário, Parte I (visão geral) e Parte II (pasta raiz).
const { C } = require('./engine.js');

const SECTIONS = [
  { group: 'Parte I — Visão geral' },
  { key: 's1', num: '1', title: 'O que é o 101spas' },
  { key: 's2', num: '2', title: 'Como o projeto é montado' },
  { key: 's3', num: '3', title: 'Mapa das pastas' },
  { key: 's4', num: '4', title: 'A arquitetura em camadas' },
  { key: 's5', num: '5', title: 'O laço do jogo' },
  { key: 's6', num: '6', title: 'Os dados que alimentam o jogo' },
  { group: 'Parte II — A pasta raiz' },
  { key: 's7', num: '7', title: 'Arquivos da raiz, um a um' },
  { group: 'Parte III — A pasta src/ (51 módulos)' },
  { key: 's8', num: '8', title: 'Bloco 00–01 · base e dados' },
  { key: 's9', num: '9', title: 'Bloco 02–07 · mundo, luz e arte' },
  { key: 's10', num: '10', title: 'Bloco 08–10 · física, combate e efeitos' },
  { key: 's11', num: '11', title: 'Bloco 11–14 · conteúdo: espadas, jogador, inimigos' },
  { key: 's12', num: '12', title: 'Bloco 15–16 · interface, saves, conquistas e controles' },
  { group: 'Parte IV — A pasta dev/' },
  { key: 's13', num: '13', title: 'Ferramentas e testes' },
  { key: 's14', num: '14', title: 'Como rodar as verificações' },
  { group: 'Parte V — A pasta docs/' },
  { key: 's15', num: '15', title: 'Catálogo, chefes e imagens' },
  { group: 'Parte VI — Como funciona por dentro' },
  { key: 's16', num: '16', title: 'O caminho de um golpe' },
  { key: 's17', num: '17', title: 'Como uma espada é definida' },
  { key: 's18', num: '18', title: 'Como a arte é gerada' },
  { key: 's19', num: '19', title: 'Salvamento, mundos e arquivos' },
  { key: 's20', num: '20', title: 'Os Tiers 7–10 (espadas 121–200)' },
  { key: 's21', num: '21', title: 'Convenções e armadilhas do código' },
  { key: 's22', num: '22', title: 'Conquistas e os itens de invocação de NPC' },
  { group: 'Apêndices' },
  { key: 'sa', num: 'A', title: 'Todos os módulos em uma tabela' },
  { key: 'sb', num: 'B', title: 'Comandos e ganchos de teste' },
];

function cover(doc) {
  doc.cover({
    stats: [['módulos em src/', 51], ['linhas em src/*.js', '12.930'], ['espadas no jogo', 200], ['inimigos definidos', 84],
      ['receitas de criação', 433], ['chefes (4 + 90)', 94], ['efeitos de espada', 126], ['telas e painéis', '15+']],
    meta: [['repositório', 'jk-jhon1/101spas'], ['branch', 'arena/27f9de3b-101spas'], ['commit', 'f5c353b + rodada dos 90 chefes'], ['jogo', '120 → 200 espadas · Tiers 9–10 só caem de chefe'], ['gerado em', '24/10/2026']],
    footer: 'Documento técnico gerado a partir da leitura do código-fonte. Todos os números foram medidos no repositório.',
  });
}

function toc(doc, pages) {
  doc.tocPage(SECTIONS.map(s => s.group ? { group: s.group } : ({ ...s, page: pages ? pages[s.key] : '' })), 'Sumário');
}

function part1(doc) {
  doc.partPage('I', 'Visão geral', 'O que o jogo é, como os arquivos se juntam num único HTML e quais são as camadas do código.');
  doc.setPart('Parte I — Visão geral');

  doc.h2('1.  O que é o 101spas', { mark: 's1' });
  doc.para('**101spas** é um sandbox 2D de plataforma em pixel-art, jogado no navegador. O jogador minera, constrói, enfrenta inimigos e chefes e forja espadas: são **200 espadas** divididas em **10 tiers**, cada uma com atributos, uma mecânica única e uma arte própria. O jogo tem dois modos: **Aventura** (mundo gerado, progressão, chefes) e **Criativo** (arsenal completo, voo livre, sem morte).');
  doc.para('Tecnicamente, é um projeto sem framework e sem dependências em tempo de execução: **um único `index.html`** de cerca de 1156 KB, com todo o JavaScript, o CSS e o HTML embutidos. Não há servidor obrigatório, nem build de terceiros, nem módulos ES: o jogo é uma sequência de 51 scripts que compartilham o mesmo escopo global. Abrir o arquivo no navegador já funciona; servir por HTTP acrescenta o salvamento em IndexedDB e a API de gamepad, que exigem uma origem de verdade.');
  doc.callout('ok', 'Em uma frase', 'O repositório guarda o código-fonte em pedaços legíveis (a pasta `src/`); o `build.js` costura esses pedaços em um arquivo só (`index.html`); o `serve.js` publica esse arquivo para jogar no navegador.');

  doc.h3('Números medidos no repositório');
  doc.table(['O quê', 'Quantidade', 'Onde vive'], [
    ['Módulos JavaScript do jogo', '51 arquivos · 12.930 linhas', 'src/*.js'],
    ['Folha de estilo e template', '270 + 133 linhas', 'src/style.css · src/template.html'],
    ['Espadas', '200 (20 por tier, 10 tiers)', 'src/11_swords.js · src/11b_swords_x.js'],
    ['Tipos de bloco e parede', '62 tiles · 10 paredes', 'src/01_data.js'],
    ['Itens e receitas', '584 itens · 433 receitas', 'src/01_data.js · src/11c_gear_x.js'],
    ['Inimigos comuns', '84 definições', 'src/13_enemies.js'],
    ['Chefes', '4 clássicos + 50 novos', 'src/13b_bosses.js · src/13c..13g'],
    ['Efeitos de espada', '101 em FX + 25 em FX2', 'src/10_fx.js · src/11b_swords_x.js'],
    ['Equipamento novo', '50 minérios · 50 armaduras · 50 acessórios · 5 picaretas', 'src/11c_gear_x.js'],
    ['Mecânicas de equipamento', '50 acessórios + 50 passivas + 10 conjuntos', 'src/10b_gear_fx.js'],
  ], [0.36, 0.32, 0.32]);

  doc.h2('2.  Como o projeto é montado', { mark: 's2', break: true });
  doc.para('O jogo não usa `import`, `require`, bundler ou transpilador. O `build.js` lê **todos** os arquivos de `src/` cujo nome começa com dígitos, ordena pelo nome e concatena o conteúdo em um único bloco de script, separado por comentários `/* ===== arquivo.js ===== */`. Depois injeta esse bloco e o CSS no `template.html` e grava o `index.html`.');
  doc.monoLine('node build.js        →   OK index.html 1156 KB; 51 módulos');
  doc.para('Como todos os arquivos caem no mesmo escopo, uma função declarada em `15_ui.js` pode ser chamada por `16_main.js` sem nenhum tipo de importação. O preço disso é que **a ordem importa**: constantes e objetos avaliados no topo de um arquivo precisam que as definições de que dependem já tenham rodado. É por isso que os nomes têm prefixos numéricos — eles são a ordem de carga e, ao mesmo tempo, o “endereço” de cada módulo na pilha.');
  doc.flow([
    { n: 1, title: 'src/*.js', text: '51 módulos numerados de 00 a 16. Cada um cuida de um assunto: dados, mundo, arte, combate, interface, laço principal.', color: '#0e7490' },
    { n: 2, title: 'build.js', text: 'Ordena, concatena, escapa a sequência </script> quando ela aparece dentro de uma string e injeta o resultado no template.', color: '#b45309' },
    { n: 3, title: 'src/template.html + style.css', text: 'O esqueleto do documento (canvas, HUD, painéis, menus) e a folha de estilo que dão forma à interface em DOM.', color: '#0e7490' },
    { n: 4, title: 'index.html', text: 'Arquivo único e autocontido. É o que o jogador abre. Nunca deve ser editado à mão: o próximo build sobrescreve.', color: '#0f172a' },
  ]);
  doc.callout('warn', 'Regra de ouro', 'Edite sempre `src/` e rode `node build.js` depois. Se você mexer só no `index.html`, a mudança evapora no próximo build; se mexer só no `src/`, o jogo aberto no navegador continua com a versão antiga.');

  doc.h3('Por que um arquivo só?');
  doc.para('O jogo foi desenhado para ser portátil: dá para mandar o `index.html` por e-mail, abrir de um pendrive ou hospedar em qualquer lugar (inclusive no GitHub Pages, que só publica arquivos estáticos) sem depender de caminhos relativos, MIME types corretos ou servidor configurado. Tudo o que o jogo precisa — inclusive as imagens, que são desenhadas por código em canvas — vai dentro do arquivo.');

  doc.h2('3.  Mapa das pastas', { mark: 's3' });
  doc.para('O repositório tem três pastas de trabalho e alguns arquivos soltos na raiz. Cada uma tem um papel bem definido:');
  doc.table(['Pasta', 'Papel', 'Quem usa'], [
    ['src/', 'Todo o código do jogo, em 51 módulos + CSS + template. É a única pasta que entra no build.', 'build.js'],
    ['dev/', 'Scripts de verificação: validação sem navegador, testes de equipamento e de arte dos ícones, testes de navegador (Playwright) e geradores de imagens de conferência. Nada daqui entra no jogo.', 'desenvolvedor, npm test'],
    ['docs/', 'Catálogo de espadas em Markdown/CSV, lista de chefes e capturas de tela usadas no README.', 'pessoas que leem o projeto'],
  ], [0.14, 0.62, 0.24]);
  doc.h3('Arquivos da raiz');
  doc.table(['Arquivo', 'Para que serve'], [
    ['index.html', 'O jogo pronto (gerado). ~1156 KB, autocontido.'],
    ['build.js', 'Costura src/ em index.html. Sem dependências.'],
    ['serve.js', 'Servidor estático mínimo (só index.html, README e docs/) para jogar por http.'],
    ['package.json', 'Nome, scripts (`build`, `serve`, `validate`, `test`) e a única dependência de desenvolvimento (Playwright).'],
    ['README.md', 'Documentação para quem chega: como jogar, como buildar, o catálogo e as capturas.'],
    ['.gitignore / .nojekyll', 'Ignora capturas temporárias e node_modules; impede o GitHub Pages de filtrar as pastas.'],
  ], [0.22, 0.78]);

  doc.h2('4.  A arquitetura em camadas', { mark: 's4' });
  doc.para('Apesar de tudo estar num escopo só, o código é organizado em camadas bem separadas. Uma camada só conversa com a de baixo (ou com a de cima por meio de funções de evento). Entender essa pilha é o atalho para saber **onde mexer** quando algo precisa mudar:');
  doc.flow([
    { n: 1, title: 'Base (00–01)', text: 'Matemática, RNG determinístico, ruído Perlin, cores, e todos os dados estáticos: tiers, tiles, itens, receitas.', color: '#64748b' },
    { n: 2, title: 'Mundo e arte (02–07)', text: 'A matriz de blocos, o gerador procedural, a luz, os sprites de tiles, as copas, os sprites dos chefes, os ícones, as espadas e o céu.', color: '#0e7490' },
    { n: 3, title: 'Simulação (08–09b)', text: 'Estado global, colisão, partículas, dano, status, projéteis, arcos de golpe e o despacho de efeitos (hooks).', color: '#1e3a8a' },
    { n: 4, title: 'Efeitos e conteúdo (10–14)', text: 'Biblioteca de efeitos, catálogo de espadas, jogador, inimigos, chefes, IA e desenho de tudo que se move.', color: '#b45309' },
    { n: 5, title: 'Interface e sistemas (15–15g)', text: 'HUD, inventário, catálogo, mapa, NPCs, salvamento em mundos, gamepad, toque e exportação de arquivo.', color: '#6d28d9' },
    { n: 6, title: 'Motor (16)', text: 'Canvas em camadas, input, câmera, laço de quadro, pipeline de render e a inicialização.', color: '#0f172a' },
  ], { gap: 11 });

  doc.h3('Onde mexer para cada tipo de mudança');
  doc.table(['Quero…', 'Vá para', 'Camada'], [
    ['criar um item ou receita nova', '01_data.js', 'Base'],
    ['mudar o relevo, os biomas ou a ordem de geração', '03_worldgen.js', 'Mundo'],
    ['ajustar o dano, o crítico ou a receita de uma espada', '11_swords.js · 11b_swords_x.js', 'Conteúdo'],
    ['criar um efeito de espada novo', '10_fx.js (FX) ou 11b (FX2)', 'Efeitos'],
    ['mudar a aparência de um bloco', '05_gfx.js', 'Arte'],
    ['desenhar uma espada nova', '06b_swordart.js (A2)', 'Arte'],
    ['criar um inimigo comum', '13_enemies.js (`enemy(...)`)', 'Conteúdo'],
    ['criar um chefe', '13c_bossx.js + 13d..13g + 05g..05j', 'Conteúdo + arte'],
    ['mexer no HUD, no inventário ou no catálogo', '15_ui.js', 'Interface'],
    ['mudar o salvamento ou os cards de mundo', '15c_save.js · 15e_worlds.js', 'Sistemas'],
    ['mexer no laço, no render ou no input', '16_main.js', 'Motor'],
  ], [0.44, 0.34, 0.22], { size: 8.1 });
  doc.para('Essa separação é o que permite, por exemplo, acrescentar um tier inteiro de 20 espadas mexendo em **três arquivos** (o catálogo novo, a arte e a tabela de tiers) e em mais nada — foi exatamente o que aconteceu com os tiers 7 a 10.');

  doc.h2('5.  O laço do jogo', { mark: 's5', break: true });
  doc.para('O jogo roda em `requestAnimationFrame`. A cada quadro, `frame(now)` calcula o delta de tempo (limitado a 50 ms, para uma aba em segundo plano não teleportar o jogador), atualiza controle e toque, e então faz duas coisas: **simula** (`step`) e **desenha** (`render`).');
  doc.para('A simulação segue sempre a mesma ordem, e essa ordem é significativa: o jogador anda antes de os inimigos pensarem; os inimigos se movem antes de os projéteis serem atualizados; os projéteis são testados contra os inimigos **antes** de as partículas e os textos voarem. O espasmo de dano, o congelamento de quadro (`hitStop`) e a câmera vêm no fim.');
  doc.table(['Etapa de step(dt)', 'O que acontece'], [
    ['updatePlayer', 'Física do jogador, mineração, uso de item, ataque, i-frames.'],
    ['updateNpcs / updateEnemies / bxUpdate', 'NPCs, inimigos comuns, chefes clássicos e novos.'],
    ['updateProjs', 'Move projéteis, testa colisão com tiles, inimigos e jogador.'],
    ['updateDrops / updateParts / updateTexts', 'Itens no chão, partículas e números flutuantes.'],
    ['stepLiquids / stepFalling', 'Água e lava (em orçamento de tempo), areia e blocos sem apoio.'],
    ['spawnTick', 'Sorteia inimigos conforme camada, bioma, noite e estágio.'],
    ['autosave · câmera', 'Salva a cada 60 s; suaviza e limita a câmera ao mundo.'],
  ], [0.34, 0.66], { size: 8.4 });
  doc.h3('O pipeline de render (5 passadas)');
  doc.para('O desenho acontece em **baixa resolução** e só no fim é ampliado por um fator inteiro — é isso que dá o pixel quadrado e nítido. São cinco passadas:');
  doc.flow([
    { n: 1, title: 'Céu', text: 'Gradiente por hora do dia, estrelas, sol/lua, nuvens e colinas em paralaxe, desenhados em um canvas do tamanho da tela em “pixels do mundo”.', color: '#0284c7' },
    { n: 2, title: 'Cena', text: 'Tiles com auto-tiling, copas, paredes, drops, NPCs, inimigos, chefes, jogador, projéteis, partículas, líquidos e o contorno da mineração.', color: '#0e7490' },
    { n: 3, title: 'Luz', text: 'A cena é multiplicada pelo mapa de luz (propagação de opacidade por tile, RGB). O alpha original é preservado com destination-in.', color: '#b45309' },
    { n: 4, title: 'Brilhos', text: 'Tochas, núcleos, lâminas e projéteis ganham halos aditivos em resolução cheia, com blending “lighter”.', color: '#dc2626' },
    { n: 5, title: 'Sobreposições', text: 'Números de dano, escurecimento, flash de tela, efeitos de tempo parado, vinheta de lava/água, retículo do controle.', color: '#6d28d9' },
  ], { gap: 10 });

  doc.h2('6.  Os dados que alimentam o jogo', { mark: 's6' });
  doc.para('Quase todo o “conteúdo” do jogo é dado, não código: os arquivos de dados declaram objetos e o resto do motor os lê. Isso vale para blocos, itens, receitas, espadas, inimigos e chefes.');
  doc.h3('As estações de criação');
  doc.para('O campo `st` de uma receita diz **onde** ela pode ser feita. Cada estação também satisfaz as anteriores, o que evita obrigar o jogador a manter cinco bancadas na base:');
  doc.table(['Estação (`st`)', 'Nome no jogo', 'Também aceita', 'Onde aparece'], [
    ['bench', 'Bancada', '—', 'Chão, feita de madeira'],
    ['furnace', 'Fornalha', '—', 'Fundição de minério'],
    ['anvil', 'Bigorna', '—', 'Ferro e aço'],
    ['advanvil', 'Bigorna Avançada', 'anvil', 'Hardmode'],
    ['forge', 'Forja Celeste', 'anvil · advanvil', 'Pós-jogo / tiers altos'],
  ], [0.18, 0.26, 0.24, 0.32], { size: 8.2 });
  doc.para('No código, quem valida isso é `STATION_SAT` (a matriz de compatibilidade) e `STATION_NAME` (o texto exibido). `canCraft` no `12_player.js` procura um bloco-estação perto do jogador e checa se ele satisfaz o `st` da receita.');

  doc.callout('info', 'A regra que sustenta tudo', 'Se um sistema precisa de um valor fixo (dano de um tier, cor de um item, receita de uma espada), esse valor mora nos dados — nunca espalhado pelo motor. É o que permite gerar o catálogo, validar o jogo por script e mudar conteúdo sem tocar na lógica.');
  doc.table(['Dado', 'Estrutura', 'Definido em'], [
    ['Tiles (62)', '`T.<nome>` → id; tabela `TD` com dureza, drops, som, estação, opacidade', '01_data.js'],
    ['Paredes (10)', '`WALL`/`WD` — fundo que veda luz e permite moradia', '01_data.js'],
    ['Itens (379)', '`IT[id]` com nome, tipo, tier, ícone, empilhamento, uso', '01_data.js'],
    ['Receitas (323)', '`RECIPES[]` com saída, quantidade, ingredientes e estação', '01_data.js'],
    ['Espadas (200)', 'Objetos `SwordItemSO` com atributos, receita, arte e lista de efeitos', '11_swords.js · 11b_swords_x.js'],
    ['Inimigos (84)', '`ED[chave]` com vida, dano, velocidade, IA (`kind`), drops', '13_enemies.js'],
    ['Chefes novos (50)', '`BX[id]` com atributos, sigilo, condição de invocação, golpes (geradores)', '13d..13g_bx_*.js'],
  ], [0.2, 0.56, 0.24], { size: 8.3 });
  doc.para('A vantagem dessa separação aparece nos testes: o `dev/validate.js` carrega apenas os módulos de dados e de lógica (sem canvas, sem DOM) e consegue conferir o catálogo inteiro em milissegundos — 200 espadas, 20 por tier, faixas de dano, nomes únicos, receitas com ingredientes existentes e estações válidas.');

  doc.h3('Um exemplo: acrescentar um item novo', null, { keep: 340 });
  doc.para('Para entender como os dados conversam entre si, o caminho de um item novo é curto e mostra as três camadas ao mesmo tempo:', { keep: 330 });
  doc.flow([
    { n: 1, title: 'Dado', text: 'Registre o item em `01_data.js` (`item(...)`): id, nome, tipo, tier, empilhamento e uso. Sem isso, nada mais o reconhece.', color: '#64748b' },
    { n: 2, title: 'Origem', text: 'Dê uma fonte ao item: uma receita em `RECIPES` (`rec(...)`) ou um drop em `13_enemies.js` — id, quantidade mínima/máxima e chance.', color: '#0e7490' },
    { n: 3, title: 'Imagem', text: 'Se ele não for espada, `06_icons` o desenha a partir do tipo e da cor; se for, entra num catálogo de espadas.', color: '#b45309' },
    { n: 4, title: 'Interface', text: 'Só isso: inventário, receitas, lojas e catálogo leem a mesma tabela — o item aparece sozinho, com tooltip e preço.', color: '#6d28d9' },
    { n: 5, title: 'Verificação', text: '`node dev/validate.js` acusa se algum ingrediente não existe ou se a estação é inválida; `dev/reach.js` acusa item sem fonte.', color: '#0f172a' },
  ], { gap: 9 });
}

function part2(doc) {
  doc.partPage('II', 'A pasta raiz', 'Os arquivos soltos que fazem o projeto existir: o jogo compilado, o build, o servidor e a documentação.');
  doc.setPart('Parte II — A pasta raiz');
  doc.h2('7.  Arquivos da raiz, um a um', { mark: 's7' });

  doc.fileCard({
    name: 'index.html', lines: 9090, tag: 'Gerado', role: 'O jogo inteiro em um arquivo — não editar à mão',
    summary: 'Documento HTML autocontido, de cerca de 1156 KB, que carrega o template, o CSS e os 51 módulos concatenados em um único `<script>`.',
    what: 'É o artefato que o jogador abre. O `build.js` o reescreve a partir de `src/`; qualquer edição manual é perdida no próximo build. Ele existe para que o jogo funcione sem servidor, sem rede e sem caminhos relativos.',
    how: [
      'Estrutura: `<canvas id="view">` (o jogo), canvas do fundo do menu, HUD em DOM, painéis e menus, e um bloco `<script>` com tudo.',
      'A string `</script>` dentro do código é escapada pelo build para não fechar o bloco antes da hora.',
      'Abrir por `file://` funciona, mas o salvamento em IndexedDB e o gamepad ficam limitados; por http tudo funciona.',
    ],
    deps: 'nenhum (autocontido)', used: 'jogador · GitHub Pages · serve.js', color: C.accent,
  });

  doc.fileCard({
    name: 'build.js', lines: 31, tag: 'Ferramenta', role: 'Concatena src/ em index.html',
    summary: 'Script Node sem dependências que junta os módulos, o CSS e o template num arquivo só.',
    what: 'Lê os nomes de `src/`, filtra os que começam com dígitos, ordena alfabeticamente (o que equivale à ordem numérica), concatena com marcadores de arquivo e injeta no template. Normaliza quebras de linha e escapa `</script>`.',
    how: [
      'A ordenação alfabética é a ordem de carga: `10_fx.js` vem antes de `11_swords.js`, e assim por diante.',
      'O CSS entra no marcador `/*__STYLE__*/`; o JS no `/*__SCRIPT__*/`.',
      'Imprime o tamanho final e a contagem de módulos — um jeito rápido de saber se algum arquivo novo entrou.',
    ],
    funcs: 'read() · replaceAll() · (script principal)', deps: 'fs, path', used: 'npm run build · fluxo de desenvolvimento', color: C.muted || '#64748b',
  });

  doc.fileCard({
    name: 'serve.js', lines: 95, tag: 'Ferramenta', role: 'Servidor estático mínimo',
    summary: 'Servidor HTTP de ~90 linhas que publica apenas `index.html`, `README.md` e a pasta `docs/`.',
    what: 'Serve para jogar por uma origem de verdade (o que libera IndexedDB e Gamepad API) e para testar no celular pela rede local. Não expõe `src/`, `dev/` nem `node_modules/`.',
    how: [
      'Lista branca de caminhos + `path.posix.normalize` e checagem de `realpath` para barrar `..` e links simbólicos.',
      'Cabeçalho `Cache-Control: no-cache`: recarregar sempre traz a versão nova.',
      'Porta opcional por argumento: `node serve.js 9000`.',
    ],
    funcs: 'resolve() · (handler do http)', deps: 'http, fs, path', used: 'npm run serve · testes de navegador', color: '#64748b',
  });

  doc.fileCard({
    name: 'package.json', lines: 30, tag: 'Config', role: 'Scripts e dependência de desenvolvimento',
    summary: 'Declara nome, scripts de build/servidor/teste e a única dependência de desenvolvimento (Playwright).',
    what: 'O jogo em si não tem dependências: nada é instalado para jogar. O Playwright só é necessário para os testes que abrem um Chromium de verdade (`npm install && npx playwright install chromium`).',
    how: [
      '`npm run build` → `node build.js`.',
      '`npm test` → validação rápida sem navegador (validate, reach, seeds, layouts, transfer).',
      '`npm run test:browser` → a bateria completa com Chromium.',
    ],
    deps: 'playwright (dev)', used: 'npm', color: '#64748b',
  });

  doc.fileCard({
    name: 'README.md', lines: 700, tag: 'Documentação', role: 'A porta de entrada do projeto',
    summary: 'Explica o jogo, como jogar, como buildar, o catálogo de espadas, os chefes e as capturas de tela.',
    what: 'É o documento que uma pessoa lê ao chegar no repositório: controles, modos, progressão, estrutura de pastas e as imagens de `docs/img`. Também registra as decisões de projeto (por que um arquivo único, por que sem dependências).',
    deps: 'docs/img/*.png', used: 'quem visita o repositório', color: '#64748b',
  });

  doc.h3('Do arquivo aberto ao primeiro quadro', null, { keep: 340 });
  doc.para('Abrir o `index.html` dispara uma sequência curta, mas que passa por quase todos os módulos. Vale conhecê-la porque é o primeiro lugar onde um erro de carregamento aparece:');
  doc.flow([
    { n: 1, title: 'O navegador lê o HTML', text: 'Monta o `canvas`, a HUD e os painéis; o CSS dá forma a tudo isso. Nenhum script rodou ainda.', color: '#0f172a' },
    { n: 2, title: 'O bloco `<script>` roda de cima para baixo', text: 'Cada módulo declara suas funções e constantes no escopo global, na ordem dos prefixos.', color: '#1e3a8a' },
    { n: 3, title: 'O último módulo chama a inicialização', text: '`16_main` liga os eventos, prepara o canvas e mostra o menu do título — o `Worlds` lê o IndexedDB para listar os mundos.', color: '#b45309' },
    { n: 4, title: 'O jogador escolhe ou cria um mundo', text: '`genWorld` roda em fatias com barra de progresso e monta a matriz de blocos, os baús, os NPCs e o ponto de partida.', color: '#0e7490' },
    { n: 5, title: 'O laço começa', text: '`requestAnimationFrame` chama `frame`, que simula (`step`) e desenha (`render`) até o jogador sair.', color: '#6d28d9' },
  ], { gap: 8 });
  doc.h3('O que acontece se você mexer em cada arquivo');
  doc.table(['Arquivo', 'Mexer nele serve para…', 'Cuidado'], [
    ['index.html', 'nada — ele é descartável', 'Qualquer edição some no próximo build.'],
    ['build.js', 'mudar o empacotamento (ex.: minificar)', 'É a única peça que conhece a ordem de carga dos módulos.'],
    ['serve.js', 'publicar mais arquivos (ex.: uma pasta de assets)', 'A lista branca é o que impede servir `src/` e `dev/`.'],
    ['package.json', 'adicionar scripts de verificação', 'A dependência de desenvolvimento não deve vazar para o jogo.'],
    ['README.md', 'documentar o projeto para quem chega', 'Nada no jogo lê este arquivo — é só documentação.'],
  ], [0.2, 0.44, 0.36], { size: 8.2 });
  doc.h3('Atalhos de leitura do código');
  doc.para('Para quem vai abrir o projeto pela primeira vez, estes são os pontos de entrada mais úteis — o lugar onde cada assunto começa:');
  doc.table(['Se você quer entender…', 'Comece por', 'Depois veja'], [
    ['como um mundo é gerado', '`03_worldgen.js` (genWorld)', '`02_world.js`, `16_main.js`'],
    ['como a luz funciona', '`04_light.js` (compute/toImage)', '`16_main.js` (render, 3ª passada)'],
    ['como um sprite é feito', '`05_gfx.js` → `05b_pixel.js`', '`06_icons.js`, `06b_swordart.js`, `06c_gearart.js`'],
    ['como o dano é calculado', '`09_combat.js` (hitEnemy)', '`09b_swing.js`, `10_fx.js`'],
    ['como uma espada vira efeito', '`11b_swords_x.js` (FX2)', '`10_fx.js` (FX)'],
    ['como o save é gravado', '`15c_save.js` (Worlds)', '`15f_transfer.js`'],
    ['como a interface é montada', '`15_ui.js` (renderArsenal)', '`src/template.html`, `style.css`'],
  ], [0.34, 0.36, 0.3], { size: 8.1 });
  doc.callout('info', 'Se a tela ficar em branco', 'Quase sempre é um erro de JavaScript na carga: abra o console do navegador. Um `ReferenceError` na primeira linha de um módulo interrompe a leitura do bloco inteiro — e nada depois dele é definido. É por isso que os testes de navegador falham citando o arquivo e a linha.');
}

module.exports = { cover, toc, part1, part2, SECTIONS };
