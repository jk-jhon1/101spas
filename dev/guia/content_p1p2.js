'use strict';
// Parte 1 (como o jogo funciona) e Parte 2 (criação) do guia.
const D = require('./data');
const { X } = D;

// imagem do jogo com a proporção original (o buffer vai direto para o PDF)
function shot(d, A, name, w, caption) {
  const img = A.loadImg(name);
  const h = img ? Math.round(w * img.height / img.width) : Math.round(w * 9 / 16);
  d.imageBlock(A.shot(name), w, h, { caption });
}

function part1(d, A) {
  d.partBand(1, 'Como o jogo funciona', 'O que é o jogo, os controles, o mundo, o combate, os inimigos, os chefes, os NPCs e a progressão do começo ao fim.');

  // ---------------- 1.1 ----------------
  d.h2('1.1', 'O que é o jogo', { mark: 's11', parent: 'p1' });
  d.para('**Espadas Do Destino** é um jogo 2D de exploração, mineração e combate no estilo do Terraria (versão mobile), todo em pixel-art. Você cai num mundo gerado na hora, corta árvores, cava a terra atrás de minérios, ergue abrigos, cria equipamentos, enfrenta chefes e, no fim, forja as **200 espadas** do jogo — cada uma com uma mecânica única.');
  d.numBoxes([
    ['200', 'espadas únicas, em 10 tiers de 20'],
    ['94', 'chefes: 4 da progressão + 90 novos em 6 atos'],
    ['433', 'receitas de criação'],
    ['628', 'itens: blocos, materiais, armas, armaduras…'],
    ['5', 'estações, da Bancada à Forja Celeste'],
    ['1.400 × 480', 'blocos de 16 × 16 px em cada mundo'],
  ], { perRow: 3 });
  d.para('O jogo roda direto no navegador: é **um único arquivo** (`index.html`), sem instalar nada e sem internet. Funciona no computador (teclado e mouse), com **controle** (gamepad) ou com **toque** no celular e no tablet. No Windows, o `Espadas.exe` só abre esse mesmo jogo no navegador.');
  d.h3('Os dois modos');
  d.table(['Modo', 'Para que serve', 'Como começa'], [
    ['Nova Aventura', 'A progressão de verdade: minerar, criar, derrotar chefes e forjar as espadas. Tudo precisa ser conseguido no mundo.', 'Espada 001 Madeira Reforçada, Picareta de Cobre, 12 Tochas e 3 Poções de Cura.'],
    ['Modo Criativo', 'Testar tudo: Arsenal com todas as espadas e itens, Boneco de Treino, invocação livre de inimigos e chefes, controle da hora, teleporte e invencibilidade.', 'Picareta Celeste, 6 espadas de teste, 99 tochas, 20 poções supremas, pedra e tábuas em abundância, Bancada, Baú e a vida máxima (400).'],
  ], [.17, .45, .38]);

  // ---------------- 1.2 ----------------
  d.h2('1.2', 'Primeiros passos', { mark: 's12', parent: 'p1' });
  d.para('A tela inicial tem cinco botões:');
  d.bullets([
    '**Continuar** — abre o último mundo salvo (aparece quando há mundos salvos).',
    '**Nova Aventura** — cria um mundo novo e único e começa a progressão.',
    '**Modo Criativo** — cria um mundo novo com o Arsenal completo.',
    '**Meus Mundos** — lista os mundos salvos, com miniatura do mapa; dá para renomear, excluir, exportar e importar.',
    '**Controles e Guia** — resumo dos controles dentro do jogo.',
    '**Botão de som (canto superior direito, ícone de nota musical)** — liga e desliga a música de fundo (Alert at Rest, em loop) junto com os efeitos sonoros; o ícone fica riscado quando está desligado. O mesmo ajuste aparece em **Pausado → Som**.',
  ]);
  d.para('Não existe campo de semente: cada mundo novo é **sorteado na hora e nunca se repete**. O jogo salva sozinho a cada minuto. Se você está de controle na mão, aperte qualquer botão nele para o jogo reconhecê-lo.');
  d.callout('info', 'Roteiro rápido da Aventura', 'O passo a passo completo está na seção 2.4. Em resumo: 1) corte árvores e faça uma Bancada; 2) mine cobre e ferro, faça uma Fornalha e uma Bigorna; 3) forje espadas do Tier 1 e invoque o Rei Slime; 4) junte Lentes Demoníacas à noite e derrote o Olho Colossal; 5) vá ao Inferno, invoque o Guardião do Abismo — começa o Hardmode; 6) minere os minérios novos, faça a Bigorna Avançada e a Forja Celeste; 7) derrote o Colosso Estelar; 8) siga os Atos I a VI dos 90 chefes novos, feche as 200 espadas e enfrente a Apoteose.');
  shot(d, A, '01_menu.png', 300, 'Tela inicial do jogo, com os cinco botões, o botão de som no canto superior direito e a espada girando ao fundo.');

  // ---------------- 1.3 ----------------
  d.h2('1.3', 'Controles', { mark: 's13', parent: 'p1' });
  d.h3('Teclado e mouse');
  d.table(['Tecla / mouse', 'Ação'], [
    ['A D ou ← →', 'Andar'],
    ['Espaço, W ou ↑', 'Pular; nadar para cima'],
    ['Botão esquerdo (segurar)', 'Atacar (o arco da espada aponta para o cursor), minerar, colocar bloco, usar o item da mão'],
    ['Botão direito', 'Abrir baú, abrir/fechar porta, falar com NPC'],
    ['1 a 0 / roda do mouse', 'Escolher o item da barra de itens'],
    ['E ou Tab', 'Inventário e criação de itens (fique perto da estação certa)'],
    ['B', 'Arsenal no Modo Criativo · Catálogo das 200 espadas no modo Aventura'],
    ['Q', 'Beber uma poção de cura'],
    ['M', 'Mapa do mundo'],
    ['+ / -', 'Aproximar / afastar a câmera (zoom)'],
    ['Esc', 'Pausar e fechar painéis (no menu de pausa: Continuar, Controles e Guia, Som — música e efeitos —, Controles de toque, Salvar mundo, Salvar e voltar ao menu)'],
    ['F3', 'Informações de depuração'],
  ], [.24, .76]);
  d.h3('Controle (gamepad)');
  d.para('Layout padrão Xbox/PlayStation. O navegador só enxerga o controle depois do primeiro botão apertado.');
  d.table(['Botão', 'Ação'], [
    ['Analógico esquerdo ou direcional ◀ ▶', 'Andar'],
    ['A', 'Pular; nadar para cima'],
    ['Analógico direito', 'Mira analógica: o arco da espada aponta para onde o analógico aponta; a inclinação define a distância do alvo'],
    ['RT ou X (segurar)', 'Atacar, minerar, colocar bloco, usar item'],
    ['B', 'Interagir com o baú, a porta ou o NPC mais próximo'],
    ['LB / RB', 'Item anterior / próximo da barra'],
    ['LT', 'Poção de cura rápida'],
    ['Y · direcional ▲ · direcional ▼ ou Select', 'Inventário e criação · catálogo/arsenal · mapa'],
    ['L3 / R3', 'Zoom − / +'],
    ['Start', 'Pausar / fechar painéis'],
    ['Direcional ou analógico ▲▼', 'Nos menus: escolhe; A confirma'],
    ['Painéis (inventário, criação, catálogo, NPC)', 'O analógico esquerdo move um cursor virtual · A clica · X botão direito · RB Shift+clique · analógico direito rola a lista · B fecha'],
  ], [.3, .7]);
  d.h3('Toque (celular e tablet)');
  d.para('Liga sozinho em telas de toque; também dá para forçar em **Pausa → Controles de toque**.');
  d.table(['Controle', 'Ação'], [
    ['Direcional (esquerda)', 'Andar; empurrar para cima = pular'],
    ['Botão + grande (direita)', 'Segurar: atacar, minerar, colocar bloco, usar item. Arrastar o dedo a partir dele mira (direção e distância)'],
    ['▲ · mão', 'Pular · interagir (baú, porta ou NPC mais próximo)'],
    ['Botões redondos sob o minimapa', 'Inventário · arsenal/catálogo · mapa · cura rápida · zoom + / − · pausa'],
    ['Barra de itens', 'Tocar num espaço seleciona o item'],
    ['× (com um painel aberto)', 'Fecha o painel'],
  ], [.28, .72]);
  d.para('Multitoque funciona: dá para andar e atacar ao mesmo tempo.');

  // ---------------- 1.4 ----------------
  d.ensure(350);
  d.h2('1.4', 'A tela do jogo', { mark: 's14', parent: 'p1' });
  d.imageBlock(A.hudShot(), 470, 264, { caption: 'A tela do jogo com os sete elementos numerados: vida (1), defesa, dano e crítico (2), minimapa (3), relógio e local (4), nome do item (5), barra de itens (6) e o aviso de salvamento (7).' });
  d.table(['Elemento', 'O que mostra'], [
    ['1 · Vida', 'Número e corações. A vida máxima começa em 100 e sobe com Cristais de Vida e acessórios.'],
    ['2 · Defesa · Dano+ · Crít · Moedas', 'Defesa total, dano extra dos acessórios, chance de crítico (já somando a da espada na mão) e as moedas que você carrega. Abaixo da vida aparecem os efeitos temporários (poção em recarga, lentidão, escudo…).'],
    ['3 · Minimapa', 'Mostra só o que você já explorou; inimigos aparecem como pontos vermelhos e chefes como quadrados maiores.'],
    ['4 · Relógio e local', 'Hora do jogo (formato 12 h), dia, bioma/camada e profundidade; no Hardmode aparece também “Hardmode”.'],
    ['5 · Nome do item', 'O item selecionado na barra, na cor do seu tier.'],
    ['6 · Barra de itens', 'Dez espaços (teclas 1 a 0). O espaço selecionado fica com a borda dourada.'],
    ['7 · Aviso de salvamento', '“Mundo salvo” aparece a cada salvamento automático. Durante uma luta de chefe aparece no alto da tela a barra de vida do chefe, com o nome dele. Mensagens rápidas (como “A noite caiu…”) surgem no canto e somem sozinhas.'],
  ], [.25, .75]);

  // ---------------- 1.5 ----------------
  d.ensure(250);
  d.h2('1.5', 'O mundo', { mark: 's15', parent: 'p1' });
  d.para('Cada mundo tem **1.400 × 480 blocos** e é gerado em menos de um segundo, por etapas, com uma barra de progresso. O jogador sempre nasce na **floresta**, para ter árvores logo no começo.');
  d.imageBlock(A.worldMap(24680, 1), 485, 166, { caption: 'Um mundo inteiro (semente de exemplo) com tudo revelado: o oceano nas duas bordas, neve, deserto, floresta e selva no meio, as ilhas do céu, as cavernas e o Inferno no fundo. A ordem e a largura dos biomas mudam de mundo para mundo.' });
  d.h3('Biomas (da esquerda para a direita)');
  d.para('Cada mundo tem oceano nas duas bordas (de 90 a 220 colunas de largura) e, entre eles, deserto, floresta, selva e neve numa ordem sorteada (são 24 ordens possíveis; os 24 primeiros mundos que você criar usam ordens diferentes). Também mudam o relevo, as cavernas, os lagos e as ilhas flutuantes.');
  d.table(['Bioma', 'Como é', 'O que dá'], [
    ['Floresta', 'Grama, árvores grandes. É onde você nasce.', 'Madeira; Slimes verdes/azuis, zumbis à noite.'],
    ['Deserto', 'Areia, arenito e cactos; Âmbar embaixo da terra.', 'Cacto, Âmbar; Múmias à noite.'],
    ['Selva', 'Lama, grama da selva, árvores altas e espinheiros.', 'Espinho da Selva, Ferrão (das Vespas).'],
    ['Neve', 'Neve, gelo e pinheiros; Cristais Gélidos nas cavernas.', 'Fragmento Gélido; Lobos e Zumbis Congelados.'],
    ['Oceano', 'Água, praias de areia com palmeiras.', 'Dente de Tubarão (Tubarões); Piranhas.'],
  ], [.15, .45, .4]);
  d.h3('Camadas (de cima para baixo)');
  d.table(['Camada', 'Onde começa', 'O que tem'], [
    ['Céu', 'acima da linha y = 92', 'Ilhas flutuantes (algumas com casa e baú; muitas com Meteorito), nuvens e Harpias (Penas).'],
    ['Superfície', 'do chão até 14 blocos abaixo', 'Os biomas. Slimes de dia; zumbis, lobos e Olhos Demoníacos à noite.'],
    ['Cavernas', 'abaixo da superfície, até y = 300', 'Cobre, ferro, prata, quartzo, gemas, carvão, lagos, casas abandonadas e o bioma de cogumelos luminosos.'],
    ['Cavernas profundas', 'y = 300 a 405', 'Ouro, bronzite, platina, poças de lava; no Hardmode, os minérios novos.'],
    ['Inferno', 'y = 405 até o fundo (480)', 'Cinzas, lava, Brasita Infernal e Obsidiana; Diabretes, Morcegos Infernais e Slimes de Lava.'],
  ], [.18, .28, .54]);
  d.para('No relógio do jogo, a profundidade mostrada é “prof.” = y − 120 (o chão fica perto de prof. 0). A linha y vale para o mapa inteiro.');
  d.h3('O que o mundo guarda');
  d.bullets([
    '**Casas abandonadas (até 30):** salas de tábuas com mesa, cadeira, tochas e um baú com moedas, tochas, barras, gemas, acessórios, às vezes uma espada (30%) e um Cristal de Vida (40%). Quanto mais fundo, melhor o conteúdo.',
    '**Cristais de Vida (18 espalhados no subsolo):** cada um aumenta a vida máxima em 20, até o limite de 15.',
    '**Ilhas do céu:** algumas têm casa com baú (penas, nuvens, Botas Velozes, Cristal de Vida); o miolo de muitas é de Meteorito.',
    '**Crateras de meteorito (até 6)** na superfície, com Meteorito exposto.',
    '**Lagos, oceanos e poças de lava:** água e lava correm de verdade; água + lava = **obsidiana**. A areia cai se não tiver apoio, e plantas e objetos sem apoio se soltam.',
    '**Bioma de cogumelos luminosos** nas cavernas: Cogumelos Luminosos e os Cogumelos Ambulantes (Esporos).',
  ]);
  d.h3('Luz, dia e noite');
  d.para('A luz é calculada de verdade: ela se espalha pelo ar e é bloqueada pelos blocos. Tochas, lava, gemas, a Fornalha e muitos inimigos iluminam; sem luz, as cavernas ficam escuras. **Um dia do jogo dura 7 minutos reais (420 s).** O relógio começa às 6:00 AM; a noite vai de cerca de 9:20 PM até 6:40 AM (uns 2 min 45 s reais), quando surgem zumbis, Olhos Demoníacos e outros inimigos mais perigosos — e quando a Lente Suspeita funciona.');

  // ---------------- 1.6 ----------------
  d.h2('1.6', 'Vida, defesa e morte', { mark: 's16', parent: 'p1' });
  d.para('**Vida máxima** = 100 + 20 por Cristal de Vida usado (até 15 cristais = 400) + bônus de acessórios e da armadura. **Dano que você leva** = dano do inimigo − metade da sua defesa (mínimo 1). Depois de cada pancada você fica invulnerável por 0,55 a 1,1 segundo (quanto maior o dano, mais tempo).');
  d.para('**Defesa** vem da armadura (um espaço) e dos acessórios (quatro espaços): veja as tabelas na Parte 2. **Quedas:** acima de 24 blocos de altura, cada bloco a mais custa 5 de vida (ignora a defesa; não vale na água nem no Criativo). Lava machuca; cactos e espinheiros também.');
  d.para('**Poções de cura** (tecla Q usa a primeira da mochila): Poção de Cura recupera 70, Poção de Cura Maior 180, Poção de Cura Suprema 400. Depois de beber, há 30 segundos de espera (2 s no Criativo).');
  d.para('**Morte (Aventura):** você perde 15% das moedas (elas ficam no chão, onde você morreu), espera 4 segundos e renasce no ponto inicial com vida cheia e 2 s de proteção. No Criativo, você renasce em menos de 1 s e não perde nada. Se você morrer no meio de uma luta de chefe, o chefe continua lá e desaparece depois de alguns segundos.');

  // ---------------- 1.7 ----------------
  d.h2('1.7', 'Combate', { mark: 's17', parent: 'p1' });
  d.para('Você ataca **segurando o botão esquerdo**: a espada faz um arco de cerca de 143° em torno do ombro, centrado na direção do cursor (ou do analógico direito). O sentido do arco alterna a cada golpe. Cada espada tem um tipo de ataque:');
  d.table(['Tipo', 'Como ataca', 'Espadas'], [
    ['Arco', 'Golpe em arco em torno do ombro (o padrão).', '187'],
    ['Estocada', 'A lâmina avança em linha reta na direção da mira.', '7'],
    ['Feixe', 'Um feixe de energia sai da espada na direção da mira.', '3'],
    ['Orbital', 'Lâminas giram ao redor do jogador e golpeiam o que chegar perto.', '3'],
  ], [.2, .65, .15]);
  d.imageBlock(A.shot('04_arco_de_ataque.png'), 360, 107, { caption: 'As fases de um golpe em arco (da esquerda para a direita, de cima para baixo). Ápice: é a metade do arco, quando a lâmina aponta para o cursor. É aí que saem os projéteis e os efeitos especiais da espada.' });
  d.para('**Dano final** = (dano da espada + dano dos acessórios) × (3 se for crítico; o Anel do Crítico soma +0,25 e a Coroa Mítica +0,5 a esse multiplicador) × 60 ÷ (60 + defesa do alvo), com uma variação de ±5%. Os acessórios contam 100% no corpo a corpo e 60% nos projéteis.');
  d.para('**Crítico:** a chance é a da espada (de 4% a 22%; algumas passam de 30%) mais a dos acessórios. Um crítico causa o triplo do dano. **Repulsão (KB)** empurra o inimigo; quanto mais pesado ou resistente, menos ele se mexe. **Sem acertos duplicados:** cada golpe ou projétil acerta cada inimigo uma vez por vez, mesmo quando as lâminas se sobrepõem.');
  d.para('**Efeitos de estado das espadas:** sangramento, veneno, fogo, gelo/lentidão, atordoamento, pânico, cegueira, tempo parado, podridão, marca, maldição… **DPS base** = dano × golpes por segundo. A média por tier cresce assim: 17 → 37 → 62 → 88 → 156 → 245 → 389 → 622 → 885 → 1.328.');
  d.imageBlock(A.shot('06_efeitos_tier5_6.png'), 300, 200, { caption: 'Efeitos das espadas dos Tiers 5 e 6 em combate: meteoros, lasers e portais.' });

  // ---------------- 1.8 ----------------
  d.h2('1.8', 'Minerar e construir', { mark: 's18', parent: 'p1' });
  d.para('**Minerar:** segure o botão esquerdo sobre o bloco, até 6 blocos de distância. A picareta precisa ter **poder** igual ou maior que a dureza do bloco; quanto maior a velocidade da picareta e menor a dureza, mais rápido quebra. **Árvores:** quebrar um tronco derruba a árvore inteira e rende madeira (1 a 3 por pedaço de tronco).');
  d.para('**Construir:** com um bloco na mão, clique no lugar desejado (até 6 blocos de distância); o bloco precisa encostar noutro bloco ou numa parede. Objetos (bancada, mesa, baú…) precisam de um bloco sólido embaixo; tochas podem ficar em qualquer lugar. **Baús** (botão direito) guardam 20 espaços; um baú só pode ser quebrado depois de esvaziado.');
  d.table(['Bloco', 'Poder', 'Picareta mínima', 'Onde está'], [
    ['Minério de Cobre', '1', 'Picareta de Cobre', 'Todos os biomas · prof. 5 a 180'],
    ['Minério de Ferro', '1', 'Picareta de Cobre', 'Todos os biomas · prof. 15 a 210'],
    ['Carvão', '1', 'Picareta de Cobre', 'Todos os biomas · prof. 10 a 240'],
    ['Cristal de Quartzo', '1', 'Picareta de Cobre', 'Cavernas · prof. 40 a 260'],
    ['Minério de Prata', '2', 'Picareta de Ferro', 'Cavernas · prof. 40 a 260'],
    ['Minério de Ouro / Bronzite', '2', 'Picareta de Ferro', 'Cavernas e profundas · prof. 70 a 275'],
    ['Gemas (rubi, esmeralda, topázio, safira, ametista)', '2', 'Picareta de Ferro', 'Cavernas · prof. 25 a 270'],
    ['Minério de Platina / Meteorito', '3', 'Picareta de Ouro', 'Profundas · ilhas do céu e crateras'],
    ['Brasita Infernal', '4', 'Picareta de Meteorito', 'Inferno (cinzas) · prof. 305 a 355'],
    ['Cobalto, Paládio, Mithril, Orichalcum, Titânio, Adamantita', '5 a 7', 'Picareta Infernal / de Cobalto / de Mithril', 'Só depois do Guardião do Abismo'],
    ['Obsidiana', '3', 'Picareta de Ouro', 'Inferno e onde água encontra lava'],
    ['Minérios de família (50)', '2 a 10', 'Picareta de Obsidiana em diante', 'Profundezas do pós-jogo (seção 2.3)'],
  ], [.4, .1, .28, .22]);
  d.para('As seis linhas de minério do Hardmode (Cobalto a Adamantita) só existem no mundo **depois que o Guardião do Abismo é derrotado**. Os 50 minérios de família (Braseiro, Geada, Corisco…) são do pós-jogo e pedem picaretas novas — a tabela completa está na seção 2.3.');

  // ---------------- 1.9 ----------------
  d.h2('1.9', 'Inimigos', { mark: 's19', parent: 'p1' });
  d.para('Os inimigos aparecem perto de você conforme o **bioma**, a **camada** e a **hora**. A tabela mostra os valores do começo do jogo (estágio 0).');
  d.table(['Inimigo', 'Vida', 'Dano', 'Def.', 'Onde aparece', 'Solta'], [
    ['Slime Verde', '14', '8', '0', 'Floresta (dia e noite)', 'Gosma 1–2 (100%)'],
    ['Slime Azul', '24', '12', '0', 'Floresta (dia e noite)', 'Gosma 1–3 (100%)'],
    ['Slime Vermelho', '42', '17', '0', 'Floresta, de dia, depois do Olho', 'Gosma · Lente (4%)'],
    ['Slime de Areia', '34', '13', '0', 'Deserto (superfície)', 'Gosma 1–2'],
    ['Slime de Gelo', '36', '14', '0', 'Neve (superfície)', 'Gosma · Fragmento Gélido (12%)'],
    ['Slime da Selva', '40', '15', '0', 'Selva (superfície)', 'Gosma · Ferrão (8%)'],
    ['Slime Roxo', '56', '19', '0', 'Cavernas e profundas', 'Gosma 2–4'],
    ['Slime de Lava', '100', '32', '0', 'Inferno', 'Gosma · Carvão (35%)'],
    ['Zumbi', '48', '17', '1', 'Floresta e selva, à noite', 'Osso (20%)'],
    ['Múmia', '74', '21', '3', 'Deserto, à noite', 'Osso 1–2 (30%)'],
    ['Zumbi Congelado', '86', '23', '3', 'Neve, à noite e cavernas', 'Osso · Fragmento Gélido (10%)'],
    ['Esqueleto / Arqueiro', '64 / 56', '21 / 20', '2', 'Cavernas e profundas', 'Osso 1–2 (50–60%)'],
    ['Cogumelo Ambulante', '58', '17', '0', 'Bioma de cogumelos', 'Cogumelo Luminoso · Esporo'],
    ['Lobo', '66', '21', '0', 'Neve e cavernas de neve', 'Osso (15%)'],
    ['Besouro Blindado', '95', '19', '6', 'Cavernas (mais no deserto)', 'Garra de Besouro (35%)'],
    ['Golem de Pedra', '230', '31', '8', 'Cavernas, depois do Olho', 'Pedra 3–8'],
    ['Olho Demoníaco', '38', '15', '0', 'Superfície e oceano, à noite', 'Lente Demoníaca (35%)'],
    ['Morcego / Morcego Infernal', '22 / 54', '12 / 24', '0', 'Cavernas · Inferno', 'Presa Vampírica · Carvão'],
    ['Vespa', '50', '19', '0', 'Selva (superfície e cavernas)', 'Ferrão 1–2 (40%)'],
    ['Harpia', '54', '18', '0', 'Ilhas do céu', 'Pena 1–3 (70%)'],
    ['Diabrete', '84', '26', '0', 'Inferno', 'Carvão 1–2 (30%)'],
    ['Espectro', '105', '25', '0', 'Profundas, depois do Olho', '—'],
    ['Tubarão', '115', '31', '0', 'Oceano (na água)', 'Dente de Tubarão (50%)'],
    ['Piranha', '32', '14', '0', 'Águas das cavernas', '—'],
    ['Coelho / Pássaro', '5 / 4', '0', '0', 'Superfície (inofensivos)', 'Pena (15%)'],
  ], [.21, .09, .09, .07, .3, .24], { size: 7.6 });
  d.para('Além disso, todo inimigo hostil solta 35% das vezes de 1 a 3 Tochas, 2,5% das vezes uma Poção de Cura e algumas moedas. O **Boneco de Treino** (só no Criativo) não morre e mostra o dano de cada golpe.');
  d.h3('Como os inimigos ficam mais fortes');
  d.table(['Estágio', 'Vida', 'Dano', 'Defesa', 'Moedas'], [
    ['0 · início', '×1', '×1', '×1', '×1'],
    ['1 · depois do Olho Colossal', '×1,5', '×1,25', '×1', '×1,5'],
    ['2 · Hardmode (depois do Guardião)', '×6', '×3', '×2', '×4'],
    ['3 · depois do Colosso Estelar', '×6', '×3', '×2', '×4'],
  ], [.4, .15, .15, .15, .15]);
  d.para('**Elites** (a partir do estágio 1, 4,5% dos inimigos): 3× a vida, +35% de dano, maiores e com bem mais moedas. No Hardmode, soltam Fragmentos Celestes com muito mais frequência. **Variantes elementais** (a partir do Hardmode, 68% dos inimigos): ganham um elemento conforme o lugar, têm +15% de vida e soltam a Essência correspondente (20% das vezes, de 1 a 2 unidades; 45% nas elites, de 1 a 3). Chefes não mudam com o estágio: a vida e o dano deles são sempre os mesmos.');
  d.para('O jogo mantém no máximo **6 inimigos** ao seu redor de dia, **9** à noite e **10** no Hardmode. Inimigos que ficam longe demais desaparecem.');
  d.imageBlock(A.shot('05_efeitos_tier4.png'), 320, 107, { caption: 'Efeitos das espadas do Tier 4 em combate.' });

  // ---------------- 1.10 ----------------
  d.h2('1.10', 'Chefes', { mark: 's110', parent: 'p1' });
  d.para('O jogo tem **94 chefes**: 4 da progressão, que se invocam com um item especial e mudam o mundo, e **90 chefes novos**, organizados em seis atos e invocados por **sigilos**. Cada chefe novo tem três fases, uma mecânica inédita e uma espada garantida.');
  d.table(['Tipo', 'Quantos', 'Como se invoca', 'O que acontece'], [
    ['Chefes da progressão', '4', 'Coroa de Gosma, Lente Suspeita, Boneco Infernal e Coração Estelar.', 'Cada vitória sobe o estágio do mundo e libera um pedaço da progressão.'],
    ['Chefes novos', '90', 'Um sigilo por chefe, criado na estação do ato.', 'Dão materiais do ato, uma Poção de Cura, moedas e a espada do chefe.'],
    ['Apoteose', '1 (entre os 90)', 'Sigilo da Apoteose, na Forja Celeste.', 'O chefe final: quatro estágios de vida, 260.000 de vida e a espada 200.'],
  ], [.22, .1, .33, .35]);
  d.para('A luta acontece onde o sigilo for usado, mas alguns chefes **só respondem num lugar ou hora**: no bioma Selva, nas Cavernas, no Inferno, à noite… O sigilo avisa. Se o chefe não aparecer, o sigilo não é gasto. Durante a luta, a barra de vida do chefe fica no alto da tela; se você morrer, ele desaparece depois de alguns segundos e o sigilo precisa ser feito de novo.');
  d.callout('warn', 'Axioma e Apoteose', 'O **Axioma** (Ato VI) pode ser invocado a qualquer momento — mas a espada dele, a 190, **só cai se os 94 chefes já tiverem sido derrotados**. A **Apoteose** é o último chefe: pede o Núcleo Mítico que só o Colosso Estelar dá, e solta a espada 200.');

  // ---------------- 1.11 ----------------
  d.h2('1.11', 'NPCs e moradia', { mark: 's111', parent: 'p1' });
  d.para('Quatro NPCs podem morar no seu mundo. Cada um chega quando existe uma **casa válida** e a condição dele foi cumprida. Uma casa válida é uma sala fechada (blocos e portas) com parede de fundo em toda a área, entre 28 e 520 blocos, com **luz** (tocha ou fornalha), **mesa ou bancada**, **cadeira** e pelo menos uma **porta**.');
  d.table(['NPC', 'Chega quando…', 'O que faz'], [
    ['Guia', 'desde o começo', 'Conhece todas as receitas e dá dicas conforme o seu progresso.'],
    ['Mercador', 'você tem 20 moedas ou já passou o dia 2', 'Compra seus materiais e vende: Tocha, Poção de Cura, Tábua de Madeira, Vidro, Porta, Mesa, Cadeira, Baú, Bancada de Trabalho, Tijolo de Pedra, Parede de Madeira, Parede de Pedra, Areia; no Hardmode também a Poção de Cura Maior.'],
    ['Enfermeira', 'o Rei Slime foi derrotado, ou você usou um Cristal de Vida, ou chegou o dia 3', 'Cura seus ferimentos em troca de moedas (cerca de 0,4 moeda por ponto de vida que falta; fica mais cara com o estágio do mundo).'],
    ['Armeiro', 'o Olho Colossal foi derrotado', 'Vende Fornalha, Bigorna, Picareta de Ferro, Armadura de Cobre, Armadura de Ferro, Botas Velozes, Luva do Guerreiro, Escudo de Ferro; no Hardmode também a Picareta de Cobalto.'],
  ], [.13, .3, .57]);
  d.para('Fale com um NPC com o botão direito (ou o botão de interagir). O Mercador e o Armeiro também compram qualquer item da mochila por 1/3 do valor (aba “Vender”; Shift+clique vende tudo). **Nenhum NPC vende espadas.**');
  d.para('No Modo Criativo existem **quatro itens de invocação de NPC** no Arsenal: use um e o NPC aparece na hora, sem precisar de casa. Eles não existem na Aventura.');

  // ---------------- 1.12 ----------------
  d.h2('1.12', 'Estágios do mundo: como a progressão avança', { mark: 's112', parent: 'p1' });
  d.para('O mundo tem um **estágio** que sobe quando você derrota certos chefes. Ele controla a força dos inimigos, o que aparece no mundo e quais chefes novos podem ser invocados.');
  d.table(['Estágio', 'Como começa', 'O que muda'], [
    ['0 · Início', 'ao criar o mundo', 'Inimigos básicos. Ato I dos chefes novos liberado. Tiers 1 e 2 de espadas ao alcance (com platina, meteorito e Brasita).'],
    ['1 · Depois do Olho', 'derrotar o Olho Colossal', 'Inimigos 1,5× vida; surgem elites, Golems de Pedra e Slimes Vermelhos de dia. O Armeiro chega. Ato II liberado.'],
    ['2 · Hardmode', 'derrotar o Guardião do Abismo', 'Nascem os minérios novos (Cobalto…Adamantita). Inimigos 6× vida e 3× dano, com variantes elementais que soltam Essências. Ato III liberado. Tiers 3 e 4 de espadas.'],
    ['3 · Depois do Colosso', 'derrotar o Colosso Estelar', 'Atos IV, V e VI liberados. O Núcleo Mítico do Colosso destrava o Tier 6 e, depois, os Tiers 7 a 10.'],
  ], [.2, .28, .52]);
  d.para('As espadas dos Tiers 7 e 8 usam as barras dos 50 minérios de família; as dos Tiers 9 e 10 **só caem de chefe** (Atos V e VI) e não têm receita — o troféu é garantido na primeira vitória.');

  // ---------------- 1.13 ----------------
  d.h2('1.13', 'Modo Criativo, Arsenal e conquistas', { mark: 's113', parent: 'p1' });
  d.para('No **Modo Criativo**, a tecla B abre o **Arsenal**, um painel com abas:');
  d.table(['Aba', 'Para que serve'], [
    ['Tier 1 a Tier 10 e Todas', 'Clique numa espada para pegar uma (Shift+clique pega mais). Passe o mouse para ver atributos, mecânica e receita.'],
    ['Itens', 'Blocos, materiais, ferramentas, armaduras, acessórios, consumíveis, os 90 sigilos e os 4 itens de invocação de NPC.'],
    ['Inimigos & Chefes', 'Chama qualquer inimigo (inclusive variantes elementais do Hardmode), o Boneco de Treino e qualquer um dos 94 chefes, sem condição nenhuma.'],
    ['Mundo', 'Hora do dia, invencibilidade, “sem inimigos”, “criação grátis”, curar tudo, +500 moedas, +4 Cristais de Vida, estágio do mundo (0 a 3) e teletransporte para cada bioma, ilha do céu, cavernas e Inferno.'],
  ], [.24, .76]);
  d.para('No modo **Aventura**, a mesma tecla B abre o **Catálogo das 200 espadas** (abas Tier 1 a 10 e Todas), só para consulta: passe o mouse numa espada e a dica mostra atributos, mecânica e como conseguir.');
  d.imageBlock(A.shot('12_chefes.png'), 450, 125, { caption: 'No Arsenal (Modo Criativo) dá para invocar qualquer um dos 94 chefes, sem sigilo e sem condição — inclusive os quatro da progressão.' });
  d.para('As **conquistas** aparecem no menu inicial e no menu de pausa: são **429**, divididas em 10 categorias, com quatro raridades (Comum, Raro, Épico e Lendário). O progresso é salvo junto com o mundo. A lista completa está na Parte 5.');

  // ---------------- 1.14 ----------------
  d.h2('1.14', 'Mundos salvos', { mark: 's114', parent: 'p1' });
  d.para('Salvamento automático a cada minuto, logo depois de criar o mundo, ao esconder a aba e em “Salvar e voltar ao menu”. “Salvar mundo”, no menu de pausa, salva na hora.');
  d.para('**Onde ficam:** no armazenamento do navegador (IndexedDB), neste aparelho. Em outro navegador, aparelho ou endereço a lista começa vazia. **Este aparelho:** o jogo mostra um nome (por exemplo, “PC · Chrome (Windows)”) e um código aleatório (como K7QF-3M9D), guardado no próprio aparelho. O IP não é usado.');
  d.para('**Proteção permanente:** depois do primeiro salvamento, o jogo pede ao navegador que não apague os mapas sozinho. Em “Meus Mundos” você vê se está ativa. **Exportar e importar:** cada mundo pode ser exportado para um arquivo (`.json`) e importado em qualquer aparelho. O arquivo tem verificação de integridade (CRC-32), e tudo é validado antes de entrar; arquivo corrompido é recusado com o motivo. Guarde um backup dos mapas que importam: navegadores podem apagar dados de sites em casos extremos.');
  shot(d, A, '10_meus_mundos.png', 330, '“Meus Mundos”: miniatura do mapa, dia, estágio, tamanho e as opções de abrir, renomear, exportar e excluir.');
}

function part2(d, A) {
  d.partBand(2, 'O sistema de criação', 'Como criar itens, o que cada estação faz, o caminho da progressão, as picaretas, as 50 armaduras, os 50 acessórios e de onde vem cada material.');

  // ---------------- 2.1 ----------------
  d.h2('2.1', 'Como criar um item', { mark: 's21', parent: 'p2' });
  d.bullets([
    'Pressione **E** (ou **Tab**; no celular, o botão de inventário). Abre o painel **Criação**, à esquerda, e o **Inventário**, à direita.',
    'Fique perto da **estação** que a receita pede. A linha “Perto: …”, no alto do painel, mostra o que o jogo está enxergando. O alcance é de 6 blocos para os lados, 4 para cima e 3 para baixo do seu corpo.',
    'Escolha a aba: **Disponíveis** (só o que dá para fazer agora), **Espadas**, **Ferramentas**, **Blocos**, **Equip.**, **Outros** ou **Todas**; ou digite o nome na busca.',
    'Clique na receita para criar uma unidade (**Shift+clique** cria 5). O item vai para a mochila; se ela estiver cheia, cai no chão.',
  ]);
  d.para('Receita sem a estação por perto fica apagada e mostra o nome da estação em dourado. Os ingredientes que faltam aparecem em vermelho. Criar gasta os ingredientes. **As receitas são fixas:** não há “descobrir” receitas. As estações são blocos: para usar, selecione-a na barra e clique no chão. No Criativo, ligando “Criação grátis” (aba Mundo do Arsenal), tudo é criado de graça e sem estação.');

  // ---------------- 2.2 ----------------
  d.h2('2.2', 'As estações de criação', { mark: 's22', parent: 'p2' });
  const stationRows = [
    ['À mão (sem estação)', 'Sempre disponível.', 'Só duas receitas: a Bancada de Trabalho e as Tochas.', '2'],
    ['Bancada de Trabalho', '10× Madeira (à mão). O Mercador também vende.', 'Blocos e móveis (tábuas, portas, mesas, baús, paredes), Fornalha, Bigorna, poções, Picareta de Cobre, 7 espadas do Tier 1 e os sigilos do Ato I.', '33'],
    ['Fornalha', '20× Pedra, 4× Madeira, 3× Tocha (na Bancada). O Armeiro também vende.', 'Funde os 50 minérios de família em barras (3 minérios = 1 barra), cozinha Vidro e cria as barras clássicas.', '65'],
    ['Bigorna', '5× Barra de Ferro (na Bancada). O Armeiro também vende.', 'Ferramentas e armaduras de ferro até Infernal, 13 espadas do Tier 1, as 20 do Tier 2, acessórios básicos, as 50 armaduras e os 50 acessórios de família, o Boneco Infernal e os sigilos do Ato II.', '87'],
    ['Bigorna Avançada', '8× Barra de Mithril ou 8× Barra de Orichalcum (na Bigorna).', 'Armaduras e picaretas de Cobalto a Titânio, acessórios do Hardmode, poção suprema, as 40 espadas dos Tiers 3 e 4, os Tiers 7 e 8 e os sigilos do Ato III. Só existe depois do Hardmode começar.', '131'],
    ['Forja Celeste', '8× Barra de Titânio, 8× Barra de Adamantita (na Bigorna Avançada).', 'Funde Fragmentos Celestes em Barras Celestes; faz a Picareta e a Armadura Celestes, o Coração Estelar, os acessórios finais, as 40 espadas dos Tiers 5 e 6 e os sigilos dos Atos IV, V e VI.', '115'],
  ];
  d.table(['Estação', 'Como conseguir', 'Para que serve', 'Receitas'], stationRows, [.17, .29, .44, .1]);
  d.callout('info', 'Uma estação melhor vale pelas anteriores', 'A Bigorna Avançada também serve de Bigorna, e a Forja Celeste serve de Bigorna e de Bigorna Avançada. Já a Fornalha e a Bancada são independentes: para fundir minério você precisa de uma Fornalha por perto, mesmo que haja uma Forja Celeste.');

  // ---------------- 2.3 ----------------
  d.h2('2.3', 'Fundição: os 50 minérios de família', { mark: 's23', parent: 'p2' });
  d.para('O pós-jogo tem **50 minérios** novos, cinco para cada uma das **10 famílias** (Braseiro, Geada, Corisco, Maré, Raiz, Véu, Aurora, Relógio, Vazio e Origem). Cada família tem cinco tiers: do minério bruto à barra final. Todos fundem na **Fornalha** (3 minérios = 1 barra) e a barra é o material das armaduras, acessórios, picaretas e espadas daquela família.');
  d.para('Os minérios aparecem por profundidade: os tiers 2 e 4 nas cavernas profundas, os tiers 6 e 8 no Inferno e no pós-Hardmode, e o tier 10 só depois do Colosso Estelar. Cada linha da tabela mostra a picareta mínima.');
  const oreRows = [], oreIcons = [];
  for (const fam of X.GFAM_KEYS) {
    for (const g of X.GORES.filter(o => o.fam === fam).sort((a, b) => a.t - b.t)) {
      const pow = (X.IT[g.key] && /poder (\d+)/.exec(X.IT[g.key].desc || ''));
      oreRows.push([
        g.nome + ' (T' + g.tier + ')',
        X.GFAM[fam].n,
        '3× → Barra de ' + g.nome,
        pow ? pow[1] : '—',
      ]);
      oreIcons.push(A.icon(g.key, 1));
    }
  }
  d.table(['Minério', 'Família', 'Receita', 'Poder'], oreRows, [.34, .2, .34, .12], { icons: oreIcons, size: 7.8 });
  d.para('As 50 barras resultantes entram nas receitas das armaduras e acessórios da família, das espadas dos Tiers 7 e 8 e das cinco picaretas do pós-jogo (seção 2.5).');

  // ---------------- 2.4 ----------------
  d.h2('2.4', 'Roteiro da progressão, passo a passo', { mark: 's24', parent: 'p2' });
  d.para('Este é o caminho natural da Aventura, do primeiro tronco à última espada. Os chefes novos (Atos I a VI) podem ser enfrentados quando você quiser, assim que a condição de cada um estiver cumprida (Parte 4).');
  const steps = [
    ['Madeira e Bancada', 'Corte árvores com a picareta (botão esquerdo no tronco). Com 10× Madeira, crie a Bancada de Trabalho (à mão) e coloque-a no chão.'],
    ['Tochas e pedra', 'Tocha ×3 = 1× Madeira, 1× Gosma (à mão). A Gosma vem dos Slimes, que aparecem de dia. Minere Pedra nas cavernas rasas.'],
    ['Fornalha', '20× Pedra, 4× Madeira, 3× Tocha → Fornalha (na Bancada).'],
    ['Cobre, ferro e barras', 'Minere Cobre e Ferro nas camadas rasas. Na Fornalha, 3 minérios viram 1 barra.'],
    ['Bigorna e as primeiras espadas', '5× Barra de Ferro → Bigorna (na Bancada). Já dá para forjar espadas do Tier 1 (por exemplo, a 003 Ferro Forjado: 10× Barra de Ferro).'],
    ['Rei Slime', 'Faça a Coroa de Gosma (30× Gosma, na Bancada) e use-a. Ele solta um Cristal de Vida, uma espada do Tier 1 e as Botas Velozes.'],
    ['Prata, ouro e platina', 'Forje a Picareta de Ouro (12× Barra de Ouro, 4× Madeira, na Bigorna): poder 3, suficiente para Platina e Meteorito.'],
    ['Olho Colossal', 'Junte 6 Lentes Demoníacas (Olhos Demoníacos, à noite) e crie a Lente Suspeita. Use-a à noite. Ele solta Barras de Platina, uma espada do Tier 2 e o Anel do Crítico — e o mundo vai para o estágio 1.'],
    ['Meteorito e Inferno', 'Com a Picareta de Meteorito (poder 4; 14× Barra de Meteorito, 4× Madeira) você mina a Brasita Infernal no Inferno. Obsidiana: onde água encontra lava.'],
    ['Guardião do Abismo — o Hardmode', 'Faça o Boneco Infernal (4× Barra de Infernal, 8× Obsidiana, 10× Osso, na Bigorna) e use-o no Inferno. Ao derrotar o Guardião, o Hardmode começa: os minérios novos nascem e os inimigos ficam muito mais fortes.'],
    ['Minérios do Hardmode', 'Picareta Infernal (poder 5) → Cobalto e Paládio; Picareta de Cobalto (poder 6) → Mithril e Orichalcum; Picareta de Mithril (poder 7, Bigorna Avançada) → Titânio e Adamantita.'],
    ['Bigorna Avançada', '8× Barra de Mithril ou 8× Barra de Orichalcum (na Bigorna). Com ela saem as espadas dos Tiers 3 e 4, que usam Essências dos inimigos elementais do Hardmode.'],
    ['Forja Celeste', '8× Barra de Titânio, 8× Barra de Adamantita (na Bigorna Avançada). Ela funde Fragmentos Celestes (de elites e chefes do Hardmode) em Barras Celestes e forja os Tiers 5 e 6.'],
    ['Colosso Estelar e o Núcleo Mítico', 'Coração Estelar = 6× Barra de Celeste, 6× Essência do Tempo, 6× Essência de Luz, 6× Essência de Sombra (na Forja Celeste). Cada vitória solta 3 Núcleos Míticos; cada espada do Tier 6 gasta 1.'],
    ['Atos I a VI', 'Com os sigilos do ato, enfrente os 90 chefes novos. Cada um dá materiais do ato e uma espada garantida — 50 espadas dos Tiers 1 a 8 e as 40 dos Tiers 9 e 10. A cada ato os materiais ficam mais fundos.'],
    ['Os 50 minérios de família', 'Com a Picareta de Obsidiana (poder 10), comece a minerar os minérios das famílias nas profundezas. São eles que fazem as 50 armaduras, os 50 acessórios, as picaretas do pós-jogo e as espadas dos Tiers 7 e 8.'],
    ['Axioma e Apoteose', 'O Axioma é o penúltimo chefe; a espada dele (190) só cai quando os 94 chefes já foram derrotados. A Apoteose, com 260.000 de vida e quatro estágios, solta a espada 200 Apoteose — logo depois da Convergência Final (191), que cai do chefe Convergência.'],
    ['As 200 espadas', 'Forje (ou ganhe de chefes) todas as espadas, consultando as receitas na Parte 3. Fechar o catálogo é a maior conquista do jogo.'],
  ];
  steps.forEach(([t, txt], i) => {
    if (i % 6 === 0) d.ensure(110);
    d.h3(`${i + 1} · ${t}`, { keep: 30 });
    d.para(txt, { gap: 4 });
  });

  // ---------------- 2.5 ----------------
  d.h2('2.5', 'Ferramentas: as 14 picaretas', { mark: 's25', parent: 'p2' });
  const pickRows = [];
  const pickIcons = [];
  for (const it of Object.values(X.IT).filter(i => i.type === 'pick').sort((a, b) => a.pow - b.pow)) {
    const r = D.recOf(it.id);
    pickRows.push([it.n, String(it.pow), D.nf(it.spd), r ? D.ingText(r.ing) : '—', r ? D.stationOf(r.st) : '—']);
    pickIcons.push(A.icon(it.id, 1));
  }
  d.table(['Picareta', 'Poder', 'Veloc.', 'Receita', 'Estação'], pickRows, [.24, .09, .09, .4, .18], { icons: pickIcons, size: 7.5 });
  d.para('A Picareta de Cobre vem no começo da Aventura. Qualquer picareta também corta árvores. As cinco últimas (Obsidiana em diante) são do pós-jogo: exigem barras das famílias e abrem os minérios mais fundos.');

  // ---------------- 2.6 ----------------
  d.h2('2.6', 'Armaduras: 50 peças, 10 conjuntos', { mark: 's26', parent: 'p2' });
  d.para('Você veste **uma armadura** (espaço de equipamento do inventário: Shift+clique na armadura, ou selecione-a na barra e clique). Ela dá defesa, que reduz o dano que você leva à metade do valor da defesa, e uma **passiva**. Cada família tem cinco peças: usar duas ou mais peças da mesma família ativa o **conjunto**, que soma a defesa das peças equipadas.');
  const armRows = [], armIcons = [];
  for (const fam of X.GFAM_KEYS) {
    for (const g of X.GARMS.filter(x => x.fam === fam).sort((a, b) => a.t - b.t)) {
      const it = X.IT[g.id];
      armRows.push([it.n, X.GFAM[fam].n + ' T' + (g.t + 1), String(it.def), (it.mech && X.GARM_TXT[it.mech]) ? X.GARM_TXT[it.mech][g.t] : it.desc, D.stationOf(X.GARM_ST[g.t])]);
      armIcons.push(A.icon(g.id, 1));
    }
  }
  d.table(['Armadura', 'Família', 'Def.', 'Passiva', 'Estação'], armRows, [.22, .1, .06, .46, .16], { icons: armIcons, size: 7.2 });
  d.para('As dez armaduras clássicas (Cobre, Ferro, Ouro, Platina, Meteorito, Infernal, Cobalto, Mithril, Titânio e Celeste) continuam no jogo, ao lado das 50 de família. A defesa delas vai de 2 a 55.');

  // ---------------- 2.7 ----------------
  d.h2('2.7', 'Acessórios: 50 peças, 4 espaços', { mark: 's27', parent: 'p2' });
  d.para('Há **quatro espaços de acessório**. Os efeitos somam. Equipe com Shift+clique no inventário. Cada família tem cinco acessórios, um para cada tier de minério; eles caem de chefes específicos e também podem ser forjados.');
  const accRows = [], accIcons = [];
  for (const fam of X.GFAM_KEYS) {
    for (const g of X.GACCS.filter(x => x.fam === fam).sort((a, b) => a.tier - b.tier)) {
      const st = Object.entries(g.stats || {}).map(([k, v]) => ({ dmg: '+' + v + ' dano', def: '+' + v + ' def', spd: '+' + Math.round(v * 100) + '% vel', crit: '+' + Math.round(v * 100) + '% crít', hp: '+' + v + ' vida' }[k] || (k + '+' + v))).join(', ');
      accRows.push([g.nome, X.GFAM[fam].n, st, g.txt]);
      accIcons.push(A.icon(g.id, 1));
    }
  }
  d.table(['Acessório', 'Família', 'Bônus', 'Efeito'], accRows, [.23, .1, .17, .5], { icons: accIcons, size: 7.2 });
  d.para('Os dez acessórios clássicos (Luva do Guerreiro, Botas Velozes, Anel do Crítico, Amuleto Vampírico, Escudo de Ferro, Manopla Titânica, Coração Eterno, Olho Sagaz, Estrela do Guerreiro e Coroa Mítica) continuam valendo e se somam aos de família.');

  // ---------------- 2.8 ----------------
  d.h2('2.8', 'Poções, Cristais de Vida e invocações', { mark: 's28', parent: 'p2' });
  d.table(['Item', 'Efeito', 'Receita', 'Estação'], [
    ['Poção de Cura', 'Cura 70 de vida. Recarga de 30 s.', '4× Gosma, 1× Cogumelo Luminoso', 'Bancada'],
    ['Poção de Cura Maior', 'Cura 180 de vida. Recarga de 30 s.', '12× Gosma, 3× Esporo, 1× Essência de Sangue', 'Bancada'],
    ['Poção de Cura Suprema', 'Cura 400 de vida. Recarga de 30 s.', '10× Esporo, 3× Essência de Sangue, 2× Essência de Luz', 'Bigorna Avançada'],
    ['Cristal de Vida', '+20 de vida máxima (até 400). Não tem receita.', 'Cristais no subsolo, baús e chefes', '—'],
    ['Coroa de Gosma, Lente Suspeita, Boneco Infernal e Coração Estelar', 'Invocam os 4 chefes da progressão.', 'Veja a seção 4.2', '—'],
    ['Sigilos (90)', 'Um para cada chefe novo; o sigilo avisa o lugar e a hora.', 'Veja a Parte 4', 'Estação do ato'],
  ], [.28, .3, .28, .14], { size: 7.8 });
  d.para('Os **4 itens de invocação de NPC** são exclusivos do Modo Criativo: não têm receita e não aparecem no modo Aventura.');

  // ---------------- 2.9 ----------------
  d.h2('2.9', 'Blocos, móveis e paredes', { mark: 's29', parent: 'p2' });
  d.table(['Item', 'Receita', 'Estação'], [
    ['Bancada de Trabalho', '10× Madeira', 'à mão'],
    ['Tocha ×3', '1× Madeira, 1× Gosma', 'à mão'],
    ['Tábua de Madeira ×2', '1× Madeira', 'Bancada'],
    ['Tijolo de Pedra', '2× Pedra', 'Bancada'],
    ['Porta', '6× Tábua de Madeira', 'Bancada'],
    ['Mesa', '8× Tábua de Madeira', 'Bancada'],
    ['Cadeira', '4× Tábua de Madeira', 'Bancada'],
    ['Baú', '8× Tábua de Madeira, 2× Barra de Ferro', 'Bancada'],
    ['Fornalha', '20× Pedra, 4× Madeira, 3× Tocha', 'Bancada'],
    ['Bigorna', '5× Barra de Ferro', 'Bancada'],
    ['Vidro', '2× Areia', 'Fornalha'],
    ['Parede de Madeira / Pedra / Tijolo / Terra / Vidro ×4', '1× do material', 'Bancada'],
  ], [.4, .42, .18]);
  d.para('As paredes de fundo servem para fechar uma casa válida (seção 1.11). Mesa, cadeira, porta e tocha completam a casa de um NPC.');

  // ---------------- 2.10 ----------------
  d.h2('2.10', 'Guia de materiais: onde conseguir cada um', { mark: 's210', parent: 'p2' });
  d.table(['Material', 'Onde conseguir'], [
    ['Madeira', 'Cortando árvores: quebrar o tronco com qualquer picareta derruba a árvore inteira (1 a 3 madeiras por pedaço). Há árvores na floresta, na selva, na neve (pinheiros) e nas praias (palmeiras).'],
    ['Pedra', 'Minerando pedra, que está por toda parte abaixo da superfície. Golems de Pedra também soltam de 3 a 8.'],
    ['Gosma', 'Todos os Slimes (1 a 4 por slime; o dobro no Hardmode) e o Rei Slime (40 a 60).'],
    ['Tocha', 'Criada à mão (1 Madeira + 1 Gosma = 3 Tochas); inimigos soltam em 35% das mortes; o Mercador vende.'],
    ['Areia', 'Minerando areia do deserto e das praias (ela cai se não tiver apoio). O Mercador também vende.'],
    ['Lente Demoníaca', 'Olhos Demoníacos (35%), que aparecem à noite na superfície e no oceano; Slime Vermelho (4%).'],
    ['Osso', 'Esqueletos e Esqueletos Arqueiros (50 a 60%) nas cavernas; zumbis e múmias à noite (20 a 30%); Lobos (15%).'],
    ['Pena', 'Harpias (70%, de 1 a 3) nas ilhas do céu; Pássaros (15%); baús das casas do céu.'],
    ['Presa Vampírica', 'Morcegos das cavernas (15%).'],
    ['Ferrão', 'Vespas da selva (40%, de 1 a 2); Slime da Selva (8%).'],
    ['Garra de Besouro', 'Besouros Blindados (35%), nas cavernas (mais comuns no deserto).'],
    ['Dente de Tubarão', 'Tubarões do oceano (50%, de 1 a 2).'],
    ['Esporo', 'Cogumelos Ambulantes (55%, de 1 a 3), no bioma de cogumelos das cavernas.'],
    ['Cacto / Espinho da Selva', 'Quebrando cactos do deserto e espinheiros da selva (machucam quem encosta).'],
    ['Cogumelo Luminoso', 'Cogumelos azuis do bioma de cogumelos, nas cavernas; Cogumelo Ambulante (60%).'],
    ['Obsidiana', 'Onde a água encontra a lava (despeje água sobre a lava) ou minerando no Inferno.'],
    ['Fragmento Celeste', 'Elites do Hardmode (22% por elite; só 1,2% dos inimigos comuns), Guardião do Abismo (14 a 20), Colosso Estelar (26 a 36) e chefes novos dos Atos III (5 a 9), IV (10 a 18), V e VI.'],
    ['Barra de Celeste', '3 Fragmentos Celestes, na Forja Celeste.'],
    ['Núcleo Mítico', 'Só do Colosso Estelar: 3 por vitória. Pode-se invocá-lo de novo quantas vezes quiser.'],
    ['Barras de família (50)', '3 minérios de família na Fornalha. Os minérios estão na seção 2.3; caem também dos chefes dos Atos V e VI e dos baús mais fundos.'],
  ], [.24, .76]);
}

module.exports = { part1, part2 };
