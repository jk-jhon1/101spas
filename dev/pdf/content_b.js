'use strict';
// Conteúdo — parte 2: Parte III (a pasta src/, 51 módulos).
const { C } = require('./engine.js');

const COL = { base: '#64748b', world: '#0e7490', art: '#b45309', sim: '#1e3a8a', play: '#b91c1c', ui: '#6d28d9', main: '#0f172a' };

function part3(doc) {
  doc.partPage('III', 'A pasta src/', 'Os 51 módulos do jogo, na ordem em que são carregados: dados, mundo, arte, combate, conteúdo, interface e motor.');
  doc.setPart('Parte III — A pasta src/');

  doc.h2('8.  Bloco 00–01 · base e dados', { mark: 's8' });
  doc.para('Os dois primeiros módulos não desenham nada e não simulam nada: eles fornecem ferramentas matemáticas e **todo o conteúdo estático** do jogo. São os únicos que os testes carregam sempre, porque tudo depende deles.');

  doc.fileCard({
    name: 'src/00_util.js', lines: 84, tag: 'Base', role: 'Matemática, sorteio determinístico e cores', color: COL.base,
    summary: 'Funções curtas usadas por todos os outros módulos: interpolação, ângulos, ruído, hash, conversão de cor e escape de HTML.',
    what: 'Concentra o “vocabulário” numérico do jogo. O ponto mais importante é o `mulberry32`: um gerador pseudoaleatório **determinístico**, que permite que uma semente produza sempre o mesmo mundo. O `Perlin` gera o relevo e as nuvens; `hash2` faz variações estáveis por coordenada (sem guardar nada em memória).',
    how: [
      '`clamp`, `lerp`, `dist`, `approach`, `angDiff` — utilidades de movimento e ângulo.',
      '`mulberry32(seed)` e `strSeed` — mundos reproduzíveis; `Perlin` com `n2` e `fbm` para relevo em camadas.',
      '`hex2rgb`, `rgbs`, `mix`, `shade`, `tint` — toda a paleta do jogo sai daqui; `escHtml` protege nomes digitados pelo jogador.',
    ],
    funcs: 'clamp · lerp · rnd · rndi · pick · chance · dist · approach · angDiff · mulberry32 · Perlin · hash2 · hex2rgb · shade · escHtml',
    deps: 'nada', used: 'todos os módulos',
  });

  doc.fileCard({
    name: 'src/01_data.js', lines: 259, tag: 'Dados', role: 'Tiers, tiles, paredes, itens e receitas', color: COL.base,
    summary: 'A “planilha” do jogo: 11 tiers de raridade, 62 blocos, 10 paredes, 584 itens e 433 receitas de criação (os minérios, armaduras e acessórios novos ficam em `11c_gear_x.js`).',
    what: 'Declara os dados por meio de pequenas funções de registro (`tile`, `item`, `rec`, `ORE`) e monta as tabelas que o resto do motor consulta: `T` (id dos tiles), `TD` (dureza, drop, som, estação), `IT` (itens), `RECIPES` (receitas) e `STATION_NAME`/`STATION_SAT` (estações e o que cada uma libera).',
    how: [
      '`TIERS` guarda nome, cor e faixa de multiplicador de dano de cada tier — é o que colore slots, tooltips e o catálogo.',
      'Cada tile declara dureza, opacidade (para a luz), se é sólido, se cai (areia) e o que dropa.',
      'As receitas ligam item final → ingredientes + estação (bancada, fornalha, bigorna, bigorna avançada, forja).',
    ],
    funcs: 'tile() · wallItem() · item() · rec() · ORE() · T · TD · IT · RECIPES',
    deps: '00_util', used: 'todo o resto do jogo',
  });

  doc.h2('9.  Bloco 02–07 · mundo, luz e arte', { mark: 's9', break: true });
  doc.para('Este é o maior bloco em número de arquivos. Ele responde por duas coisas: **como o mundo existe** (matriz de blocos, geração procedural, luz) e **como o mundo é desenhado** (tiles, copas, chefes, ícones, espadas, céu). Nada aqui conhece o jogador; são sistemas de dados e de pintura.');

  doc.fileCard({
    name: 'src/02_world.js', lines: 230, tag: 'Mundo', role: 'A matriz de blocos e suas regras', color: COL.world,
    summary: 'Classe `World`: arrays tipados para blocos, paredes, líquidos e bioma, mais líquidos, quedas, árvores e portas.',
    what: 'O mundo é uma grade de 1.400 × 480 tiles de 16 px (22.400 × 7.680 px). Para não gastar memória, cada propriedade é um `TypedArray`: blocos em `Uint8Array`, paredes, quantidade e tipo de líquido, “já revelado no mapa” e a exposição ao céu. A classe oferece leitura/escrita com limites, atualização de suporte, derrubada de árvore inteira e a simulação de fluidos em orçamento.',
    how: [
      '`get/set`, `solid`, `wallAt`, `liqAt` — acesso seguro (fora do mundo devolve rocha-mãe).',
      '`stepLiquids(budget)` — água e lava escorrem apenas nas células “acordadas” (`liqAct`), em lotes por quadro; água + lava = obsidiana.',
      '`stepFalling`, `checkSupport`, `fellTree`, `toggleDoor` — areia cai, blocos sem apoio desabam, árvore cai inteira.',
    ],
    funcs: 'class World · stepLiquids · stepFalling · set · setWall · fellTree · checkSupport · doorColumn · layerAt',
    deps: '00_util, 01_data', used: '03_worldgen, 08_phys, 12_player, 16_main',
  });

  doc.fileCard({
    name: 'src/03_worldgen.js', lines: 439, tag: 'Mundo', role: 'Gerador procedural em fatias', color: COL.world,
    summary: 'Gera o mundo inteiro em 11 etapas, cedendo o controle entre elas para a barra de carregamento não travar a página.',
    what: '`genWorld` é um **gerador** (`function*`): cada `yield` devolve `[progresso, mensagem]` e o `startGame` consome um pouco por quadro. A semente define o layout dos biomas, o estilo do relevo, as cavernas, os minérios, as árvores, as ilhas do céu e o inferno. `chooseSeed` sorteia sementes comparando o “layout” das já usadas para garantir mundos visivelmente diferentes.',
    how: [
      'Etapas: biomas e relevo → lagos → cavernas → minérios → areia/argila → árvores e plantas → ilhas flutuantes → inferno → baús e estruturas → detalhes → finalização.',
      '`makeLayout(seed)` sorteia ordem e largura dos 4 biomas de terra, o tamanho dos oceanos e o ponto de partida (sempre na floresta).',
      '`spawnHardmodeOres` espalha cobalto..adamantita quando o Guardião do Abismo é derrotado.',
    ],
    funcs: 'genWorld* · makeLayout · layoutRuns · chooseSeed · lootForDepth · spawnHardmodeOres · Perlin',
    deps: '00_util, 01_data, 02_world', used: '16_main (startGame), dev/seeds.js, dev/layouts.js',
  });

  doc.fileCard({
    name: 'src/04_light.js', lines: 106, tag: 'Mundo', role: 'Iluminação dinâmica', color: COL.world,
    summary: 'Classe `Lighting`: propaga luz RGB célula a célula usando a opacidade do tile, em duas iterações de quatro varreduras.',
    what: 'Implementa o item “iluminação dinâmica” do GDD. A luz do céu e as fontes (tochas, lava, projéteis, núcleos) entram numa grade do tamanho da tela; a propagação faz quatro varreduras (esquerda, direita, cima, baixo) duas vezes, atenuando conforme a opacidade da célula de origem. O resultado vira um `ImageData` usado como camada multiplicativa.',
    how: [
      '`compute(world, x0, y0, w, h, sky)` — monta a grade de luz da área visível.',
      '`toImage(img, ambiente)` — escreve a luz no buffer que o render usa.',
      '`skyLight(time)` — clareia e escurece conforme o ciclo de dia/noite.',
    ],
    funcs: 'class Lighting · compute · toImage · sample · skyLight',
    deps: '00_util, 02_world', used: '16_main (render), 13_enemies (spawn)',
  });

  doc.fileCard({
    name: 'src/05_gfx.js', lines: 346, tag: 'Arte', role: 'Sprites 16×16 dos blocos', color: COL.art,
    summary: 'Pinta cada tipo de bloco proceduralmente num buffer RGBA e devolve sprites prontos, com auto-tiling por máscara e variantes.',
    what: 'Não existe nenhum arquivo de imagem no jogo: todos os tiles são desenhados por código. O módulo tem um mini “pincel” (`bSet`, `bOver`, `bRect`, `bAlpha`, `bClr`), funções de pintura por material (tijolo, tronco, minério, folha) e um atlas que empacota sprites para desenhar rápido. `tileMask` calcula a máscara de vizinhança para emendar blocos (grama no topo, contornos) e `getCracks` produz os estágios de rachadura da mineração.',
    how: [
      'Cada tipo de tile gera 1 sprite + variantes; a escolha da variante é estável por coordenada.',
      'Máscara de 4 bits → sprite certo para bordas, cantos e interior.',
      'Galhos, rachaduras e paredes de fundo também são gerados aqui.',
    ],
    funcs: 'genTile · getTileSprite · getWallSprite · tileMask · getCracks · getBranchSprite · atlasAlloc',
    deps: '00_util, 01_data', used: '16_main (drawWorldTiles), 05c_canopy',
  });

  doc.fileCard({
    name: 'src/05b_pixel.js', lines: 156, tag: 'Arte', role: 'Pixelização e bonecos humanos', color: COL.art,
    summary: 'Converte desenho vetorial em pixel-art (binariza o alfa, adiciona contorno e sombreamento de cima-esquerda) e monta os bonecos humanos.',
    what: 'É a ponte entre “desenhar com formas suaves” e “pixel-art de verdade”. `drawPixelized` desenha o vetor pequeno, binariza o alfa e contorna; `pixelShade` aplica luz de cima-esquerda com poucas cores. Também gera cabeça, tronco, pernas e braço do jogador, NPCs e zumbis, além dos corações da HUD.',
    how: [
      '`pixelizeCanvas(canvas, { th, outline, shade })` — usado pelos ícones e pelas espadas antigas.',
      '`humanLegs / humanUpper / humanArm` — peças separadas para animar andar e golpear.',
      'Nada aqui toca o DOM ao carregar (o validador do Node carrega este arquivo).',
    ],
    funcs: 'pixelizeCanvas · pixelShade · drawPixelized · humanUpper · humanLegs · humanArm · heartSprites',
    deps: '00_util, 05_gfx', used: '06_icons, 12_player, 14_draw_enemies, 15_ui',
  });

  doc.fileCard({
    name: 'src/05c_canopy.js', lines: 164, tag: 'Arte', role: 'Copas das árvores por vizinhança', color: COL.art,
    summary: 'Desenha a copa como um contorno arredondado calculado a partir dos 5×5 blocos ao redor, em vez de quadrados de folha.',
    what: 'A colisão e a geração continuam usando os mesmos tiles de folha; só o **desenho** muda. Cada bloco recebe o pedaço de copa que cai nele, então os pedaços se emendam sem costura e a copa se refaz sozinha quando uma folha é quebrada. Há uma textura que se repete a cada 256 px, três paletas (floresta, selva, pinheiro) e desenho em lote.',
    how: [
      '`canopyOccAt` consulta vizinhança; `canopyBlur` suaviza o contorno; `genCanopySprite` pinta e cacheia.',
      'O lote (`drawCanopyBatch`) desenha todas as copas de uma vez, no fim da passada de tiles.',
    ],
    funcs: 'genCanopySprite · drawCanopyBatch · canopyOccAt · canopyBlur · canopyTex',
    deps: '00_util, 01_data, 05_gfx', used: '16_main (drawWorldTiles)',
  });

  doc.fileCard({
    name: 'src/05d_bosspaint.js', lines: 151, tag: 'Arte', role: 'Ferramentas de pintura dos chefes', color: COL.art,
    summary: 'Buffer RGBA com rampa por pixel: polígonos, elipses, curvas, união de formas, preenchimento, contorno, halo e empacotamento em canvas.',
    what: 'Os chefes não são vetores pixelizados: são **pintados pixel a pixel**, com luz de cima-esquerda, poucos tons por material e um brilho de cor por chefe. Este módulo fornece o “pincel” dessa pintura. Cada pixel guarda também a rampa e o tom, o que permite clarear/escurecer depois e fazer degradês coerentes.',
    how: [
      '`bpNew/bpSet/bpFill/bpEdge/bpGlow/bpStamp` — primitivas de pintura e contorno.',
      '`bpPoly/bpEll/bpSeg/bpCurve/bpUnion` — formas; `BP_BAYER` faz o pontilhado do halo.',
      '`bpPack` converte o buffer em canvas — é o que o desenho do jogo consome.',
    ],
    funcs: 'bpNew · bpPoly · bpEll · bpCurve · bpUnion · bpFill · bpEdge · bpGlow · bpPack',
    deps: '00_util', used: '05e_bossart, 05f_bxart, 06b_swordart',
  });

  doc.fileCard({
    name: 'src/05e_bossart.js', lines: 293, tag: 'Arte', role: 'Sprites dos 4 chefes clássicos', color: COL.art,
    summary: 'Pinta Rei Slime, Olho Colossal, Guardião do Abismo e Colosso Estelar, com peças móveis separadas (íris, lanterna, anéis, órbitas).',
    what: 'Cada chefe tem rampas próprias e um brilho de uma cor. O sprite inteiro é gerado por “quadro” de animação e guardado em cache; as partes que se mexem são desenhadas por cima, no módulo de desenho, para poderem acompanhar o jogador ou girar.',
    how: [
      '`bossSpr(kind, frame, fase)` devolve o canvas do corpo; `bossPart` devolve peças soltas.',
      '`bossWarm` pré-aquece os quadros mais usados para não engasgar no primeiro segundo da luta.',
    ],
    funcs: 'slimeSprite · eyeSprite · eyeIris · guardSprite · guardLantern · colossusSprite · bossSpr · bossPart · bossWarm',
    deps: '00_util, 05d_bosspaint', used: '14_draw_enemies',
  });

  doc.fileCard({
    name: 'src/05f_bxart.js', lines: 68, tag: 'Arte', role: 'Infraestrutura da arte dos 90 chefes novos', color: COL.art,
    summary: 'Registro `bxArt`, ajudas de pintura em coordenadas relativas ao centro, rampas de corpo (`RP`) e cache de sprites.',
    what: 'Define o “kit” usado pelos quatro arquivos seguintes. Cada chefe se declara com tamanho, centro de colisão, número de quadros e uma função de pintura. As ajudas (`h.P`, `h.E`, `h.S`, `h.C`, `h.F`, `h.D`, `h.G`, `h.eye`, `h.star`) desenham em coordenadas relativas ao centro da caixa de colisão, o que mantém o desenho alinhado independentemente do tamanho.',
    how: [
      '`bxRamp` gera 6 tons escuro→claro; `bxGlowRamp` gera 7 tons para o brilho com núcleo quase branco.',
      '`bxSpr(id, frame, variante)` pinta e cacheia; `bxWarmAll` pré-aquece todos.',
    ],
    funcs: 'bxArt · bxH · bxSpr · bxWarmAll · bxRamp · bxGlowRamp · RP',
    deps: '00_util, 05d_bosspaint', used: '05g..05l_bxart*, 14b_draw_bx',
  });

  doc.fileCard({
    name: 'src/05g_bxart1.js', lines: 142, tag: 'Arte', role: 'Chefes novos do Ato I (8)', color: COL.art,
    summary: 'Pintura dos 8 primeiros chefes novos — do Despertar, com dificuldade de início de jogo.',
    what: 'Cada `bxArt(...)` descreve um chefe: caixa, centro, quadros e a função que pinta usando o kit de 05f. São desenhos independentes, sem reúso de silhueta, o que garante que dois chefes nunca se confundam na tela.',
    how: ['Um bloco por chefe, na ordem do ato.', 'Animações curtas (2–4 quadros) feitas por deslocamento de partes, não por redesenho de poses.'],
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx (via BOSSDRAW.bx)',
  });
  doc.fileCard({
    name: 'src/05h_bxart2.js', lines: 243, tag: 'Arte', role: 'Chefes novos do Ato II (14)', color: COL.art,
    summary: 'Pintura dos 14 chefes do Pós-Olho — cristais, golems, enxames e conjuradores.',
    what: 'Mesmo esquema de 05g, com formas maiores e mais camadas (cristais, núcleos, asas, correntes). O brilho de cada um usa a cor do elemento que ele representa.',
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx',
  });
  doc.fileCard({
    name: 'src/05i_bxart3.js', lines: 236, tag: 'Arte', role: 'Chefes novos do Ato III (16)', color: COL.art,
    summary: 'Pintura dos 16 chefes do Hardmode — ceifadores, aberrações e construtos.',
    what: 'A partir daqui os chefes têm silhuetas mais altas e detalhes emissivos (lâminas espectrais, olhos múltiplos, runas flutuantes).',
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx',
  });
  doc.fileCard({
    name: 'src/05j_bxart4.js', lines: 179, tag: 'Arte', role: 'Chefes novos do Ato IV (12)', color: COL.art,
    summary: 'Pintura dos 12 chefes do Além do Colosso — os mais altos e os mais ornamentados.',
    what: 'Usa as mesmas ajudas, com mais pixels emissivos, halos partidos e elementos flutuantes para passar a ideia de “fim de jogo”.',
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx',
  });
  doc.fileCard({
    name: 'src/05k_bxart5.js', lines: 339, tag: 'Arte', role: 'Chefes novos do Ato V (20)', color: COL.art,
    summary: 'Pintura dos 20 chefes do Julgamento — seres de luz, sinos, cálices, coroas e o fênix que renasce.',
    what: 'O ato mais luminoso: asas, auréolas, vitrais e chamas com brilho alto. Cada chefe tem uma silhueta própria e partes animadas (asas que abrem, chamas que tremulam, selos que giram), e o fênix usa duas poses — corpo e ovo — trocadas pelo motor ao renascer.',
    how: ['Mesmas ajudas de 05f, com mais camadas emissivas que os atos anteriores.', 'O fênix é o único com um segundo conjunto de quadros (ovo) desenhado à parte.'],
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx',
  });
  doc.fileCard({
    name: 'src/05l_bxart6.js', lines: 302, tag: 'Arte', role: 'Chefes novos do Ato VI (20)', color: COL.art,
    summary: 'Pintura dos 20 chefes do Fim de Tudo, do buraco branco à Apoteose — quatro variantes da Apoteose, uma por estágio.',
    what: 'Usa as mesmas peças, mas com paletas quase monocromáticas (branco, vazio, dourado) e formas cósmicas: espirais, anéis, olhos, lâminas verticais. A Apoteose é o único chefe com `vars: 4`: o motor escolhe o desenho pelo estágio — sem asas nos dois primeiros (terrestres) e com asas nos dois últimos (voadores).',
    how: ['`bxArt(id, W, H, cx, cy, frames, paint, { vars: 4 })` guarda quatro pinturas por chefe.', 'O motor pede `bxSpr(id, frame, variante)` com a variante = estágio − 1.'],
    deps: '05f_bxart, 05d_bosspaint', used: '14b_draw_bx',
  });

  doc.fileCard({
    name: 'src/06_icons.js', lines: 243, tag: 'Arte', role: 'Ícones e sprites das 120 primeiras espadas', color: COL.art,
    summary: 'Desenha os ícones 32×32 de todos os itens e gera as espadas 1–120 por perfil de lâmina vetorial, pixelizado no fim.',
    what: 'Há duas responsabilidades: (1) o desenho de cada item na interface, por especificações declarativas (`it.ic`) — poção, minério, machado, armadura, sigilo etc.; (2) o sprite da espada no mundo, gerado a partir de `look` (formato, cor, comprimento) por `bladeProf`, que devolve meia-largura e curvatura ao longo da lâmina. O sprite é pixelizado para manter o estilo.',
    how: [
      '`getSwordSprite` decide entre o desenho novo (pixel a pixel, de 06b) e o legado (vetorial).',
      '`iconCanvas(id)` monta 32×32, centraliza a espada em diagonal e escala pelo tamanho real do sprite.',
      '`iconURL` guarda o data-URL e as classes CSS são registradas uma vez — a interface nunca redesenha o mesmo ícone.',
    ],
    funcs: 'getSwordSprite · getSwordSpriteLegacy · bladeProf · iconCanvas · iconURL · drawIconSpec · glowDot · mk',
    deps: '00_util, 01_data, 05b_pixel, 06b_swordart', used: '12_player, 14_draw_enemies, 15_ui, 16_main',
  });

  doc.fileCard({
    name: 'src/06b_swordart.js', lines: 649, tag: 'Arte', role: 'Arte pixel a pixel das espadas 121–200', color: COL.art,
    summary: 'Interpreta a receita `look.art2` e pinta cada uma das 80 espadas novas num buffer RGBA, com bisel, contorno e pixels emissivos.',
    what: 'O módulo mais recente e o maior arquivo de arte do projeto. Em vez de vetores, cada espada é **pintada pixel a pixel** em tamanho real: silhueta (lâmina + guarda + cabo + pomo + extras), bisel de dois tons (gume claro em cima, dorso escuro embaixo), contorno escuro de 1 px, gemas e runas com rampa própria. Trinta famílias de lâmina × dezesseis guardas × sete cabos × cinco pomos e extras dão o repertório; cada receita combina elementos diferentes, então nenhuma das 80 repete a de outra.',
    how: [
      '`a2paint` pinta por coluna com bisel contínuo; `a2tip` desenha a ponta de cada família; `a2sep` afasta a cor da guarda da cor da lâmina quando elas são parecidas.',
      '`a2run` faz o bisel padrão e o `rim` luminoso das lâminas escuras; `a2em` marca pixels emissivos que brilham no render aditivo.',
      '`art2Sprite` devolve `{ c, w, h, ox, oy, len, sw, sh }` — `sw/sh` são a caixa real da espada, usada para escalar o ícone sem cortar.',
    ],
    funcs: 'art2Sprite · art2Paint · a2paint · a2tip · a2sep · a2run · a2em · a2outline · a2gripBase',
    deps: '00_util, 05d_bosspaint, 08_phys', used: '06_icons (ícones), 16_main (mundo)',
  });

  doc.fileCard({
    name: 'src/06c_gearart.js', lines: 760, tag: 'Arte', role: 'Arte dos 50 minérios, 50 barras, 50 armaduras, 50 acessórios e 5 picaretas', color: COL.art,
    summary: 'Desenha cada peça de equipamento a partir da **semente do item**: o formato do minério, a massa e a inclinação da barra, o corte da couraça, o tipo de acessório e a cabeça da picareta mudam de peça para peça.',
    what: 'A ideia é que nenhum item pareça o outro. Em vez de uma silhueta por família, cada desenho recebe `(forma, tier, seed)` e decide com a semente: quantas agulhas o cristal tem e para onde se inclinam, que casca o geodo ganha, qual dos cinco cortes de couraça a armadura usa, quantos dedos a manopla tem, o comprimento do bico da bota, quantas pontas a coroa leva. Por cima entram o brasão da família (dez desenhos), o motivo do peito (tabardo, gemas, corrente, gola de pelo, ombro assimétrico, faixa rúnica), os cravos da borda e as marcas de tier. A paleta é derivada da cor do minério, com um ajuste de luminância (`gaLift`) para os metais quase pretos continuarem visíveis no fundo escuro do inventário.',
    how: [
      '`gaRnd(seed)` é um gerador determinístico: o mesmo item desenha igual em qualquer sessão e em qualquer navegador.',
      '`drawOreArt` tem três formas (agulhas, geodo, lasca); a ganga é tingida pela cor do minério.',
      '`drawBarArt` varia a massa, a inclinação, o entalhe e a lasca; o selo da família e as marcas de tier ficam no topo.',
      '`drawArmorArt` combina cinco cortes × cinco degraus de escala e um motivo diferente por peça, com o brasão por cima.',
      '`drawAccArt` cobre treze formas (anel, pingente, manopla, botas, manto, coroa, fole, nadadeira, bolha, ampulheta, coração, escudo, vazio). Dentro das quatro maiores, **cada peça tem um desenho nomeado**: dez anéis (solitário, sinete, aro duplo, trançado, alado, garra, serpente, face, aro aberto, pedras em órbita), nove pingentes (gota, medalhão, placa, aro aberto, torque, duplo, olho, frasco, chave), dez manoplas (luva, pesada, garra, braceleto, espinhos, mão aberta, avambraço, munhequeira, placas, esfera) e dez botas (botina, cano alto, alada, greva, bico longo, gola de pelo, joelheira, sandália, salto, cravos). O índice vem de `GACC_VAR`, no catálogo — não da semente.',
      '`dev/test_gear_art.js` desenha os 205 ícones e compara o hash do alfa: se duas peças tiverem a mesma silhueta, o teste falha.',
    ],
    funcs: 'gaRnd · gaGem · gaSpark · gaDots · gaEdgeMarks · gaLift · drawOreArt · drawBarArt · drawArmorArt · drawArmorMotif · drawAccArt · drawPickArt · drawFamilyCrest',
    deps: '00_util', used: '06_icons (drawIconSpec), 11c_gear_x (sementes das peças)',
  });

  doc.fileCard({
    name: 'src/07_sky.js', lines: 100, tag: 'Arte', role: 'Céu, sol, lua, nuvens e colinas', color: COL.art,
    summary: 'Desenha o céu em faixas de cor que mudam com a hora do dia, com estrelas, astros com halo, nuvens de pixels e colinas em paralaxe.',
    what: '`drawSky` recebe o tempo normalizado (0–1 em 420 s de dia) e interpola as cores de uma tabela de sete paradas: madrugada, amanhecer, dia, tarde, pôr do sol e noite. Nuvens e estrelas têm posições estáveis por semente; as colinas usam a cor do bioma e se movem mais devagar que a câmera.',
    how: [
      '`initSky(seed)` sorteia estrelas e nuvens; os sprites de sol/lua são gerados uma vez.',
      '`skyGradAt(frac)` interpola a paleta do céu por interpolação linear entre paradas.',
    ],
    funcs: 'initSky · drawSky · skyGradAt · sunSprite · moonSprite · cloudSprite · discSprite',
    deps: '00_util, 02_world', used: '16_main (render, menu)',
  });

  doc.h3('De onde vem cada pixel');
  doc.para('Uma dúvida comum ao abrir o projeto é “onde está a imagem do inimigo?”. Não está em lugar nenhum: cada elemento visual tem um módulo gerador. Esta tabela é o mapa.');
  doc.table(['O que aparece na tela', 'Quem desenha', 'Técnica'], [
    ['Blocos, paredes, rachaduras', '05_gfx', 'Pintura por material + máscara de vizinhança'],
    ['Copas das árvores', '05c_canopy', 'Contorno calculado na vizinhança 5×5'],
    ['Jogador, NPCs, zumbis', '05b_pixel + 12_player', 'Vetor pixelizado, peças separadas'],
    ['Inimigos comuns', '14_draw_enemies', 'Formas simples + tinta de status'],
    ['4 chefes clássicos', '05e_bossart + 14_draw_enemies', 'Pintura pixel a pixel + camadas móveis'],
    ['90 chefes novos', '05g..05l + 14b_draw_bx', 'Pintura pixel a pixel, uma silhueta por chefe'],
    ['Espadas 1–120 (ícones)', '06_icons', 'Vetor pixelizado a partir de `look`'],
    ['Espadas 121–200 (ícones e mundo)', '06b_swordart', 'Pintura pixel a pixel por família'],
    ['Minérios, barras, armaduras, acessórios, picaretas', '06c_gearart', 'Um desenho nomeado por peça + brasão da família'],
    ['Efeitos, projéteis, partículas', '10_fx + 09_combat', 'Formas em canvas + brilho aditivo'],
    ['Céu, astros, nuvens, colinas', '07_sky', 'Faixas interpoladas + paralaxe'],
  ], [0.3, 0.3, 0.4], { size: 8.1 });
  doc.callout('info', 'Por que gerar em vez de guardar imagens', 'Um único sprite de 16×16 em PNG ocuparia mais bytes que o código que desenha todos os blocos. Além disso, a paleta, o contorno e o sombreamento ficam consistentes entre tudo — e mudar uma cor de tier, por exemplo, vale para o ícone, o mundo e o catálogo ao mesmo tempo.');
}

module.exports = { part3, COL };
