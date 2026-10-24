'use strict';
// Conteúdo — parte 4: pasta dev/, pasta docs/, capítulos "como funciona por dentro" e apêndices.
const { C } = require('./engine.js');
const { COL } = require('./content_b.js');

function part4(doc) {
  doc.partPage('IV', 'A pasta dev/', 'Validação, testes de navegador e ferramentas de conferência visual. Nada daqui entra no jogo — é a rede de segurança de quem mexe no código.');
  doc.setPart('Parte IV — A pasta dev/');

  doc.h2('13.  Ferramentas e testes', { mark: 's13' });
  doc.para('O projeto tem duas famílias de verificação. A primeira roda **em Node, sem navegador**, carregando os módulos do jogo em um contexto isolado com um DOM falso: é rápida (milissegundos) e serve para validar dados e lógica pura. A segunda abre um **Chromium de verdade** com Playwright e simula um jogador: clica, aperta teclas, conecta um controle, gira o celular — e verifica o que aconteceu no jogo.');

  doc.h3('Validação e dados (sem navegador)');
  doc.fileCard({
    name: 'dev/validate.js', lines: 141, tag: 'Teste', role: 'Valida o catálogo inteiro', color: COL.ui,
    summary: 'Carrega os módulos de dados no Node e confere 200 espadas, 20 por tier, faixas de dano, nomes únicos, receitas, estações e os 90 chefes.',
    what: 'É o teste mais rápido e o mais abrangente sobre conteúdo. Ele falha se faltar uma espada, se um tier tiver 19 ou 21, se o dano sair da faixa, se um ingrediente não existir, se a estação for inválida ou se um nome repetir. Também gera o catálogo em Markdown/CSV — mas só quando pedido, para não sujar o repositório a cada execução.',
    how: [
      '`node dev/validate.js` → imprime um resumo por tier e `CATÁLOGO OK` no fim.',
      '`CATALOGO=1 node dev/validate.js` → além de validar, reescreve `docs/catalogo_*.md/.csv`.',
    ],
    deps: 'fs, path, stubs de DOM', used: 'npm test',
  });
  doc.fileCard({
    name: 'dev/reach.js', lines: 34, tag: 'Teste', role: 'Tudo é obtível?', color: COL.ui,
    summary: 'Verifica se cada item usado em alguma receita tem fonte (bloco, drop, baú, loja ou outra receita) e se as 200 espadas são craftáveis.',
    what: 'Responde à pergunta “dá para terminar o jogo?”. Percorre o grafo de receitas para trás e aponta ingredientes sem origem e itens inalcançáveis. Hoje: 200/200 espadas craftáveis, nenhum ingrediente sem fonte.',
    deps: 'mesmos stubs de validate', used: 'npm test',
  });
  doc.fileCard({
    name: 'dev/seeds.js · dev/layouts.js', lines: 110, tag: 'Teste', role: 'Variedade dos mundos', color: COL.ui,
    summary: 'Amostram milhares de sementes para provar que os mundos variam e que a política de sorteio nunca repete um layout parecido.',
    what: '`seeds.js` mede a distribuição dos layouts; `layouts.js` compara mundos completos lado a lado (ordem de biomas, largura, oceanos, relevo) e valida a regra de “semente inédita”.',
    deps: '03_worldgen', used: 'npm test',
  });
  doc.fileCard({
    name: 'dev/transfer.js', lines: 233, tag: 'Teste', role: 'Arquivo de mundo', color: COL.ui,
    summary: 'Testa o formato `.json` de exportação sem navegador: CRC, ida e volta exata, arquivos adulterados, fuzz e a lógica de importação.',
    what: 'É o teste de segurança do recurso de exportar/importar. Modifica arquivos válidos bit a bit, refaz o CRC para tentar burlar a checagem, injeta campos proibidos e confirma que a importação recusa ou limpa tudo o que não deveria entrar.',
    deps: '15f_transfer', used: 'npm test',
  });
  doc.fileCard({
    name: 'dev/test_gear_art.js', lines: 126, tag: 'Teste', role: 'Nenhuma peça de equipamento repete outra', color: COL.ui,
    summary: 'Desenha os 205 ícones novos (50 minérios, 50 barras, 50 armaduras, 50 acessórios e 5 picaretas) em um canvas de verdade e compara a **silhueta** de cada um com todas as outras.',
    what: 'A regra “cada peça tem aparência própria” precisa de um teste objetivo, porque arte gerada por código repete com facilidade. O script carrega `src/` num contexto `node:vm`, pede cada ícone a `iconCanvas`, calcula o hash SHA-1 do RGBA (cor + forma) e do canal alfa isolado (só a silhueta) e acusa qualquer par igual. Também conta os pixels pintados, para pegar ícone vazio ou quase invisível. Com `--sheet pasta/` grava cinco folhas de contato ampliadas para conferência a olho.',
    how: [
      '`npm run test:art` → imprime por grupo e termina com `ARTE OK — nenhuma peça repete outra` (saída 0) ou a lista dos pares repetidos (saída 1).',
      'Antes disso ele lista, por tipo de acessório, quantos desenhos distintos existem e acusa se duas peças do mesmo tipo caíram na mesma variante.',
      '`node dev/test_gear_art.js --sheet /tmp/folhas` → grava `minerios.png`, `barras.png`, `armaduras.png`, `acessorios.png` e `picaretas.png`.',
      'Precisa de `@napi-rs/canvas`: `npm --prefix dev/pdf install` instala a mesma biblioteca que gera este PDF.',
    ],
    deps: 'fs, vm, crypto, @napi-rs/canvas', used: 'npm run test:art',
  });
  doc.fileCard({
    name: 'dev/test_swords_x.js', lines: 134, tag: 'Teste', role: 'As 80 espadas novas, sem navegador', color: COL.ui,
    summary: 'Executa **todos** os ganchos de efeito de cada uma das 80 espadas novas em um motor falso que grava chamadas — e falha em qualquer exceção.',
    what: 'Em vez de abrir um navegador, substitui o motor real (dano, projéteis, explosões, feixes, meteoros, buffs) por espiões que só anotam o que foi chamado. Depois dispara `onSwing`, `onApex`, `onHit`, `onProjHit`, `onKill`, `tick` e `stats` de cada espada. Resultado atual: 80 espadas, 0 problemas.',
    deps: 'fs, vm, stubs de canvas', used: 'verificação dos tiers 7–10',
  });

  doc.h3('Testes de navegador (Playwright)');
  doc.para('Os arquivos `test_*.js` abrem o `index.html` em um Chromium headless e dirigem o jogo pelos mesmos ganchos que o jogador usaria. Cada um cobre uma área e falha com código de saída 1 se encontrar exceção, erro de console ou resultado inesperado.');
  doc.table(['Arquivo', 'O que verifica'], [
    ['test_worlds.js', 'Mundos: criação sem semente, sementes inéditas, miniaturas, renomear/excluir, persistência ao recarregar, fidelidade bloco a bloco, autosave, migração e cota.'],
    ['test_device.js', 'Exportar/importar entre “aparelhos” (contextos isolados), arquivos adulterados, celular, Firefox, sem IndexedDB.'],
    ['test_gamepad.js', 'Controle simulado (dev/gamepad_mock.js): mirar, atacar, andar nos painéis.'],
    ['test_touch.js', 'Direcional, ação com arrasto, pulo, painéis, zoom, cura e pausa em tela de toque.'],
    ['test_input.js', 'Teclado e mouse reais: andar, pular, minerar, colocar bloco, crafting, catálogo e mapa.'],
    ['test_arsenal_clicks.js', 'Clica em (quase) tudo do Arsenal: todas as abas de tier, itens, inimigos e mundo.'],
    ['test_enemies.js', 'Todos os inimigos e variantes elementais contra o jogador, sem exceções.'],
    ['test_bosses.js', 'Sprites e fases dos 4 chefes clássicos, íris que segue o jogador, tinta de status, cache e caixas de colisão.'],
    ['test_bx.js', 'Cada um dos 90 chefes novos: invocação, fases, todos os golpes, morte, loot e limpeza de lacaios.'],
    ['test_bx_art.js', 'Arte dos 90 chefes: silhueta própria, corpo escuro com brilho, paleta curta, colisão dentro do desenho.'],
    ['test_progress.js', 'Morte e renascimento, derrota dos 4 chefes, drops, bandeiras, estágio e minérios de Hardmode.'],
    ['test_npc_save.js', 'Salas válidas, spawn de NPC, painel da loja e ida e volta do save pelo IndexedDB.'],
    ['test_fluids.js', 'Água + lava = obsidiana, areia caindo e plantas sem apoio.'],
    ['test_sandbox.js', 'O jogo dentro de um iframe sandbox (sem localStorage): o salvamento falha com aviso, não com exceção.'],
    ['test_skin.js', 'Interface única e copas das árvores (silhueta, contorno, lote de desenho).'],
    ['test_swords.js', 'As 120 primeiras espadas em combate: cada uma ataca por segundos e precisa causar dano.'],
    ['soak.js', 'Estresse: ~45.000 passos de simulação em 14 cenários (todas as camadas e estágios) procurando travamentos e vazamentos.'],
    ['smoke.js', 'Abre o jogo, tira a captura do título e mostra o que saiu no console.'],
    ['http_check.js', 'Ponta a ponta por http: carrega, salva, recarrega e continua — o teste do fluxo real de jogador.'],
  ], [0.28, 0.72], { size: 8.2 });

  doc.h3('Ferramentas');
  doc.fileCard({
    name: 'dev/lib.js', lines: 91, tag: 'Ferramenta', role: 'Base compartilhada dos testes de navegador', color: COL.ui,
    summary: 'Abre o Chromium, cria mundos por semente determinística, coleta erros de página e monta folhas de contato a partir de capturas.',
    what: 'Centraliza o que todos os testes precisam: lançar o navegador com as opções certas, esperar o jogo entrar em `play`, forçar a semente do próximo mundo (`window.__nextSeed`) e juntar capturas em uma única imagem para conferência visual.',
    funcs: 'launch · startWorld · waitPlay · collectErrors · makeSheet · run',
    deps: 'playwright', used: 'todos os test_*.js',
  });
  doc.fileCard({
    name: 'dev/art_sheet.js', lines: 81, tag: 'Ferramenta', role: 'Folha de contato das 80 espadas novas', color: COL.ui,
    summary: 'Renderiza os sprites reais das espadas 121–200 com `@napi-rs/canvas`, em uma grade 20×4 com a cor do tier em cada célula.',
    what: 'Serve para conferir a arte sem abrir o jogo: cada célula mostra o sprite no tamanho real do mundo, com uma faixa da cor do tier e o número. É a ferramenta que guiou o ajuste fino de pontas, guardas e halos durante a criação dos tiers 7–10.',
    how: ['`node dev/art_sheet.js` grava `espadas_t7_10.png` na pasta atual.', 'O segundo argumento é o caminho de saída; o terceiro é a escala.'],
    deps: '@napi-rs/canvas (opcional)', used: 'conferência visual da arte',
  });
  doc.fileCard({
    name: 'dev/gamepad_mock.js · dev/host.html', lines: 17, tag: 'Ferramenta', role: 'Simulador de controle e página hospedeira', color: COL.ui,
    summary: 'Injeta uma Gamepad API falsa (ou bloqueada) antes do jogo carregar; e hospeda o jogo em um iframe `sandbox` para testar ambientes restritos.',
    deps: '—', used: 'test_gamepad.js · test_sandbox.js',
  });

  doc.h2('14.  Como rodar as verificações', { mark: 's14' });
  doc.para('A bateria curta não precisa de nada instalado além do Node. A bateria de navegador precisa do Playwright e do Chromium baixado uma vez.');
  doc.table(['Comando', 'O que roda'], [
    ['npm run build', 'Gera o index.html a partir de src/.'],
    ['npm run serve', 'Publica o jogo em http://localhost:8080/.'],
    ['npm test', 'Validação rápida: catálogo, alcance das receitas, sementes, layouts e arquivo de mundo.'],
    ['npm run test:browser', 'A bateria completa de navegador (precisa de `npm install` e `npx playwright install chromium`).'],
    ['node dev/test_swords_x.js', 'As 80 espadas novas, com motor falso, em cerca de 1 segundo.'],
    ['node dev/art_sheet.js', 'Folha de contato da arte das espadas novas.'],
  ], [0.32, 0.68], { size: 8.4 });
  doc.callout('ok', 'Fluxo recomendado depois de mexer no código', '1) `node build.js` · 2) `node dev/validate.js` · 3) `node dev/test_swords_x.js` · 4) `npm test` · 5) abrir no navegador e jogar. Se a mudança for visual, gere a folha de contato antes.');

  doc.partPage('V', 'A pasta docs/', 'O catálogo gerado, a lista de chefes e as capturas usadas na documentação.');
  doc.setPart('Parte V — A pasta docs/');
  doc.h2('15.  Catálogo, chefes e imagens', { mark: 's15' });
  doc.fileCard({
    name: 'docs/catalogo_200_espadas.md / .csv', lines: 295, tag: 'Gerado', role: 'Catálogo das espadas em texto', color: COL.base,
    summary: 'Tabela com as 200 espadas, tier por tier: nome, dano, velocidade, knockback, crítico, mecânica, receita e estação — gerada a partir dos dados do jogo.',
    what: 'Serve para consultar e comparar espadas sem abrir o jogo, e para planilha (o CSV usa ponto e vírgula e BOM, abrindo direto no Excel em português). Cobre os 10 tiers, inclusive os 7–10, que vivem em `11b_swords_x.js`.',
    how: ['Recriado com `CATALOGO=1 node dev/validate.js`.', 'O CSV tem uma linha por espada; o MD agrupa por tier com a regra de cada um.'],
    deps: '11_swords.js', used: 'README, consulta',
  });
  doc.fileCard({
    name: 'docs/catalogo_equipamentos.md', lines: 361, tag: 'Gerado', role: 'Catálogo do equipamento', color: COL.base,
    summary: 'As 10 famílias, com os 50 minérios (tier e picareta exigida), as 50 armaduras (defesa e passiva) e os 50 acessórios (de qual chefe vêm e o que fazem).',
    what: 'Gerado pelo mesmo `CATALOGO=1 node dev/validate.js`, a partir de `11c_gear_x.js` e `10b_gear_fx.js`. Serve para comparar peças e para saber de qual chefe sai cada acessório sem abrir o jogo.',
    deps: '11c_gear_x, 10b_gear_fx', used: 'README, consulta',
  });
  doc.fileCard({
    name: 'docs/chefes_novos.md', lines: 137, tag: 'Gerado', role: 'Lista dos 90 chefes', color: COL.base,
    summary: 'Nome, ato, atributos, mecânica única, espada guardada, acessório exclusivo, condição de invocação e recompensas dos 90 chefes novos.',
    what: 'É gerado pelo `validate.js` a partir dos dados de `13d..13g_bx_*.js`, então nunca fica desatualizado em relação ao jogo.',
    deps: '13c_bossx, 13d..13g', used: 'README, consulta',
  });
  doc.fileCard({
    name: 'docs/img/*.png', lines: 13, tag: 'Imagens', role: 'Capturas de tela', color: COL.base,
    summary: 'Treze imagens (menu, combate, biomas, arco de ataque, efeitos, interface, tiles, mapa, controles, chefes) usadas no README.',
    what: 'São capturas reais do jogo, feitas pelos testes de navegador, e servem como referência visual do que cada sistema produz na tela.',
    deps: '—', used: 'README.md',
  });
}

function part6(doc) {
  doc.partPage('VI', 'Como funciona por dentro', 'Seis capítulos transversais: o caminho de um golpe, o formato de uma espada, os dois pipelines de arte, o salvamento, os tiers novos e as armadilhas do código.');
  doc.setPart('Parte VI — Como funciona por dentro');

  doc.h2('16.  O caminho de um golpe', { mark: 's16' });
  doc.para('Seguir um único clique do mouse até o número de dano na tela é a melhor maneira de entender como os módulos se encaixam. O percurso passa por sete arquivos diferentes:');
  doc.flow([
    { n: 1, title: 'Entrada', text: '`mousedown` no canvas marca `G.mouse.down[0]` (16_main).', color: '#0f172a' },
    { n: 2, title: 'Jogador', text: '`updatePlayer` vê o botão pressionado, checa o tempo de recarga e chama `startSwing` (12_player).', color: '#b91c1c' },
    { n: 3, title: 'Arco', text: '`startSwing` cria a instância do golpe, dispara `sfx("swing")` e o gancho `onSwing` da espada (09b_swing → 10_fx / 11b).', color: '#1e3a8a' },
    { n: 4, title: 'Ápice', text: 'No meio do arco, `updateSwings` marca `apex` e chama `onApex`: é aqui que os projéteis, ecos e domínios nascem, já apontados para o cursor.', color: '#b45309' },
    { n: 5, title: 'Colisão', text: '`swingHit` testa o segmento da lâmina contra a caixa de cada inimigo; cada instância guarda quem já atingiu.', color: '#0e7490' },
    { n: 6, title: 'Dano', text: '`hitEnemy` aplica crítico, defesa, elemento e status, dispara `onHit` e devolve o resultado (09_combat).', color: '#b91c1c' },
    { n: 7, title: 'Consequências', text: 'Número flutuante, partículas, som, “hit stop”, drops; se a vida zerar, `killEnemy` distribui loot e bandeiras de progresso.', color: '#6d28d9' },
  ], { gap: 9 });
  doc.h3('Os ganchos, em ordem');
  doc.table(['Gancho', 'Quando roda', 'Para que serve'], [
    ['stats', 'ao equipar / recalcular', 'Mudar atributos do jogador (dano, crítico, velocidade, vida).'],
    ['init', 'ao equipar', 'Preparar estado interno do efeito.'],
    ['swing', 'ao iniciar o golpe', 'Alterar o próprio arco (alcance, duração, lado).'],
    ['onSwing', 'ao iniciar o golpe', 'Efeitos de largada (som, brilho, buff).'],
    ['mod', 'durante o golpe', 'Multiplicador de velocidade de ataque.'],
    ['onApex', 'no meio do arco', 'Criar projéteis, ecos, domínios, meteoros.'],
    ['onHit', 'ao acertar inimigo', 'Explosões, marcas, roubo de vida, acúmulos.'],
    ['onProjHit', 'projétil acerta', 'Reações de projétil (fragmentar, explodir, ricochetear).'],
    ['onKill', 'ao matar', 'Almas, explosões, cura, invocação.'],
    ['tick', 'todo quadro', 'Efeitos contínuos: auras, acumuladores, temporizadores.'],
  ], [0.2, 0.32, 0.48], { size: 8.2 });

  doc.h2('17.  Como uma espada é definida', { mark: 's17' });
  doc.para('Toda espada é um objeto de dados. As 120 primeiras são criadas pela fábrica `S(...)` em `11_swords.js`; as 80 novas usam `S2(...)` e uma receita de arte `A2(...)` em `11b_swords_x.js`. A assinatura é a mesma ideia: número, nome, dano, velocidade, knockback, aparência, efeitos, texto e receita.');
  doc.monoLine("S2(121, 'Nome', dano, velocidade, kb, A2('familia', {...}), [FX2.eco(...)], 'mecânica', 'ingrediente:qtd,...')", { size: 8.4 });
  doc.table(['Campo', 'Significado'], [
    ['num / id', 'Número da espada (1–200) e id `sNNN`; o tier é `ceil(num/20)`.'],
    ['baseDamage / attackSpeed', 'Dano por golpe e golpes por segundo.'],
    ['knockbackForce', 'Empurrão aplicado no inimigo.'],
    ['critChance', 'Crítico; se omitido, usa `DEF_CRIT[tier]` (tiers 7–10: 12%, 15%, 18%, 22%).'],
    ['look', 'Aparência: formato, cor, brilho e — nas novas — a receita `art2` de pintura.'],
    ['passiveEffects', 'Lista de efeitos da biblioteca (`FX` ou `FX2`) combinados.'],
    ['txt', 'Descrição da mecânica única, exibida no tooltip e no catálogo.'],
    ['station / receita', 'Onde é criada e com quais ingredientes (`TIER_STATION` define o padrão).'],
  ], [0.24, 0.76], { size: 8.3 });
  doc.callout('warn', 'Cuidado ao criar uma espada nova', 'A receita precisa ter ingredientes que existam em `IT` e uma estação válida, o nome não pode repetir, o dano deve cair na faixa do tier (o `validate.js` cobra isso) e o número tem de estar livre. Depois de acrescentar, rode `node dev/validate.js` e `node dev/test_swords_x.js`.');

  doc.h2('18.  Como a arte é gerada', { mark: 's18' });
  doc.para('Não existe um único arquivo de imagem no jogo: **tudo é desenhado por código**, em três pipelines diferentes.');
  doc.table(['Pipeline', 'O que usa', 'Como funciona'], [
    ['Vetorial + pixelização', 'Espadas 1–120, ícones de itens, bonecos, tiles', 'Desenha formas suaves num canvas pequeno, binariza o alfa, adiciona contorno escuro e sombreamento de cima-esquerda.'],
    ['Pintura pixel a pixel', 'Espadas 121–200 e chefes', 'Um buffer RGBA recebe pixels um a um, com rampas de tom, bisel, contorno e pixels emissivos — sem nenhuma suavização.'],
    ['Formas por semente', 'Minérios, barras, armaduras, acessórios, picaretas', 'A semente do item sorteia o corte, o comprimento e os enfeites; o brasão da família entra por cima.'],
  ], [0.22, 0.34, 0.44], { size: 8.2 });
  doc.para('O resultado é sempre **cacheado**: um sprite é gerado uma vez e reaproveitado. Os ícones da interface são gerados em 32×32, centralizando a espada em diagonal e usando a caixa real do desenho (`sw`/`sh`) para que nenhuma espada longa seja cortada. No mundo, o sprite é desenhado em tamanho real, com ampliação por fator inteiro — daí o pixel quadrado.');
  doc.h3('Regras de estilo que o código respeita');
  doc.bullets([
    'Uma única fonte de luz (cima-esquerda): gume claro em cima, dorso escuro embaixo.',
    'Poucos tons por material, separados por tons escuros em vez de linhas.',
    'Contorno escuro de 1 px em toda a silhueta: é o que faz o objeto “descolar” do fundo.',
    'Brilho por cor, com núcleo quase branco e halo semitransparente pontilhado.',
  ]);

  doc.h2('19.  Salvamento, mundos e arquivos', { mark: 's19' });
  doc.para('O jogo guarda **vários mundos**, não um único save. Cada mundo tem metadados leves (para listar rápido) e um registro pesado com os blocos comprimidos. Tudo vive no IndexedDB do navegador, na base `espadas120`.');
  doc.table(['Loja', 'Conteúdo'], [
    ['worlds', 'Cartão do mundo: nome, semente, modo, tempo jogado, dia, estágio, chefes derrotados, miniatura, aparelho de origem.'],
    ['data', 'O mundo em si: blocos comprimidos em RLE + base64, jogador, inventário, baús, NPCs, bandeiras.'],
    ['seeds', 'Todas as sementes já sorteadas — nenhuma se repete, nem depois de excluir o mundo.'],
  ], [0.16, 0.84]);
  doc.para('O salvamento é feito em **fila**: nunca dois ao mesmo tempo. O autosave roda a cada 60 s; salvar manualmente também refaz a miniatura. Se o navegador não tiver IndexedDB (iframe restrito, alguns modos privados), o jogo avisa e mantém os mundos apenas em memória, durante a sessão.');
  doc.h3('Exportar e importar');
  doc.para('Cada mundo pode virar um arquivo `.json` autocontido, com CRC-32 para detectar corrupção. Na importação, **nada é confiado**: o CRC é verificado, campos desconhecidos são descartados, valores são presos à faixa válida, itens inexistentes são removidos e as camadas precisam ter o tamanho certo. Um arquivo ruim nunca quebra o jogo — no pior caso, é recusado com uma mensagem.');

  doc.h2('20.  Os Tiers 7–10 (espadas 121–200)', { mark: 's20' });
  doc.para('A adição mais recente: **quatro tiers novos, 20 espadas cada, 80 no total**, levando o catálogo de 120 para 200. Nome, atributos, mecânica e desenho são exclusivos, e a arte é pintada pixel a pixel — não é variação das 120 antigas. Os tiers 7 e 8 ainda podem ser forjados; os **tiers 9 e 10 não têm receita** (`dropOnly`): cada uma das 40 espadas cai do chefe que a guarda — as 20 do Ato V, guardadas pelos chefes de `13h_bx_a5.js`, e as 20 do Ato VI, guardadas pelos de `13i_bx_a6.js`.');
  doc.table(['Tier', 'Nome', 'Cor', 'Espadas', 'Dano', 'Crítico', 'Estação'], [
    ['7', 'Forja Estelar', '#eab308', '121–140', '300–360', '12%', 'Bigorna Avançada'],
    ['8', 'Relicário do Vazio', '#db2777', '141–160', '470–620', '15%', 'Bigorna Avançada'],
    ['9', 'Eco Primordial', '#06b6d4', '161–180', '690–880', '18%', 'cai do chefe (Ato V)'],
    ['10', 'Origem', '#f8fafc', '181–200', '980–1400', '22%', 'cai do chefe (Ato VI)'],
  ], [0.08, 0.24, 0.13, 0.13, 0.16, 0.1, 0.16], { size: 8.2 });
  doc.h3('Os 25 efeitos novos (FX2)');
  doc.para('Os efeitos novos ficaram em um objeto próprio (`FX2`), sem tocar na biblioteca antiga: eco do golpe, leque de lâminas, nova, cometa, varredura, corrente, marca que detona, domínio, gravidade, escudo, dobra, divisão, almas perseguidoras, execução, explosão de sangue, convergência, ciclo, fenda, espelho, tempestade, parada no tempo, linha de condenação, orbes, singularidade e big bang.');
  doc.h3('O que foi verificado');
  doc.bullets([
    '200 espadas, 20 por tier, nomes únicos, dano dentro da faixa e receitas válidas (`validate.js`).',
    '200/200 espadas obtíveis (160 forjadas + 40 que caem de chefe), nenhum ingrediente sem fonte (`reach.js`).',
    'Os oito ganchos de cada uma das 80 espadas executam sem exceção (`test_swords_x.js`).',
    'Catálogo com abas T1–T10 + “Todas”, 20 slots por aba e 200 em “Todas”; 379 ícones, tooltips, venda, save e painéis sem erro.',
  ]);
  doc.callout('warn', 'Correções que vieram junto', 'Ícone que não era espada quebrava o painel (`ReferenceError`); o catálogo escondia T8–T10 e a aba “Todas”; o preço de venda das espadas novas era indefinido; eco e espelho geravam ecos de ecos (acertos exponenciais, travando o jogo); e a lista de projéteis estourava no teto de 700. Tudo corrigido e coberto por teste.');

  doc.h2('21.  Convenções e armadilhas do código', { mark: 's21' });
  doc.h3('Convenções')
  doc.bullets([
    'Cada arquivo começa com um comentário-cabeçalho dizendo o que ele faz — é a melhor documentação do projeto.',
    'O prefixo numérico do arquivo é a ordem de carga; ao criar um módulo, escolha o número entre os vizinhos lógicos (por isso existem `06b`, `09b`, `13d`…).',
    'Constantes de conteúdo ficam nos módulos de dados; nada de números mágicos espalhados pelo motor.',
    'Funções que tocam o DOM só são chamadas em tempo de jogo: os módulos carregáveis pelo validador não executam nada no topo.',
  ]);
  doc.h3('Armadilhas')
  doc.table(['Armadilha', 'Por que acontece', 'Como evitar'], [
    ['Ordem de carga', 'Tudo compartilha um escopo; `const` no topo de um arquivo não existe antes de sua linha rodar.', 'Use o prefixo numérico correto e declare dependências depois de suas bases.'],
    ['Editar o index.html', 'O build reescreve o arquivo inteiro.', 'Edite `src/` e rode `node build.js`.'],
    ['Variável implícita', 'Um nome digitado errado dentro de uma função vira erro só naquele caminho (foi o caso do ícone que usava `it`).', 'Rode os testes: eles exercitam inventário, arsenal e todos os itens.'],
    ['Recursão de efeitos', 'Eco que gera eco dobra os acertos a cada geração.', 'Efeitos disparados por golpes “fantasma” precisam checar `inst.ghost`.'],
    ['Listas com teto', '`spawnProj` descarta os 50 mais antigos quando passa de 700 — o laço pode encontrar buracos.', 'Ao iterar, tolere elementos ausentes.'],
    ['Preços e tabelas por tier', 'Arrays indexados por tier silenciosamente devolvem `undefined` acima do último índice.', 'Estenda a tabela e use valor de reserva.'],
  ], [0.22, 0.44, 0.34], { size: 8.1 });
}

function appendix(doc) {
  doc.setPart('Apêndices');
  doc.h2('A.  Todos os módulos em uma tabela', { mark: 'sa', break: true });
  doc.para('Referência rápida: nome, linhas e papel de cada um dos 50 módulos, na ordem de carga.');
  const mods = [
    ['00_util.js', 84, 'Matemática, RNG determinístico, Perlin, cores'],
    ['01_data.js', 259, 'Tiers, tiles, paredes, itens, receitas'],
    ['02_world.js', 230, 'Matriz de blocos, líquidos, quedas, árvores'],
    ['03_worldgen.js', 439, 'Gerador procedural em fatias'],
    ['04_light.js', 106, 'Iluminação dinâmica por opacidade'],
    ['05_gfx.js', 346, 'Sprites 16×16 dos tiles e auto-tiling'],
    ['05b_pixel.js', 156, 'Pixelização e bonecos humanos'],
    ['05c_canopy.js', 164, 'Copas das árvores por vizinhança'],
    ['05d_bosspaint.js', 151, 'Ferramentas de pintura dos chefes'],
    ['05e_bossart.js', 293, 'Sprites dos 4 chefes clássicos'],
    ['05f_bxart.js', 68, 'Infraestrutura da arte dos 90 chefes'],
    ['05g_bxart1.js', 142, 'Arte dos chefes do Ato I (8)'],
    ['05h_bxart2.js', 243, 'Arte dos chefes do Ato II (14)'],
    ['05i_bxart3.js', 236, 'Arte dos chefes do Ato III (16)'],
    ['05j_bxart4.js', 179, 'Arte dos chefes do Ato IV (12)'],
    ['05k_bxart5.js', 339, 'Arte dos chefes do Ato V (20)'],
    ['05l_bxart6.js', 302, 'Arte dos chefes do Ato VI (20), 4 variantes da Apoteose'],
    ['06_icons.js', 243, 'Ícones de itens e sprites das espadas 1–120'],
    ['06b_swordart.js', 649, 'Arte pixel a pixel das espadas 121–200'],
    ['06c_gearart.js', 760, 'Arte própria de cada peça de equipamento'],
    ['07_sky.js', 100, 'Céu, astros, nuvens e colinas'],
    ['08_phys.js', 145, 'Estado global G, colisão, partículas, drops'],
    ['08b_audio.js', 60, 'Efeitos sonoros sintetizados'],
    ['09_combat.js', 334, 'Dano, status, projéteis, explosões'],
    ['09b_swing.js', 95, 'Arco do golpe, ápice, colisão da lâmina'],
    ['10_fx.js', 276, 'Biblioteca de 101 efeitos de espada'],
    ['11_swords.js', 157, 'Catálogo das 120 primeiras espadas'],
    ['11b_swords_x.js', 425, 'Tiers 7–10: 80 espadas + 25 efeitos'],
    ['10b_gear_fx.js', 498, 'Mecânicas de acessórios, armaduras e conjuntos'],
    ['11c_gear_x.js', 256, '50 minérios, 50 armaduras, 50 acessórios, 5 picaretas'],
    ['12_player.js', 360, 'Jogador, inventário, criação, mineração'],
    ['13_enemies.js', 334, 'Inimigos, IA, spawn e drops'],
    ['13b_bosses.js', 78, 'Os 4 chefes clássicos'],
    ['13c_bossx.js', 312, 'Motor dos 90 chefes novos'],
    ['13d_bx_a1.js', 120, 'Chefes novos do Ato I (8)'],
    ['13e_bx_a2.js', 269, 'Chefes novos do Ato II (14)'],
    ['13f_bx_a3.js', 263, 'Chefes novos do Ato III (16)'],
    ['13g_bx_a4.js', 187, 'Chefes novos do Ato IV (12)'],
    ['13h_bx_a5.js', 433, 'Chefes novos do Ato V (20)'],
    ['13i_bx_a6.js', 442, 'Chefes novos do Ato VI (20) — inclui a Apoteose'],
    ['14_draw_enemies.js', 236, 'Desenho de inimigos e chefes'],
    ['14b_draw_bx.js', 36, 'Desenho dos chefes novos'],
    ['15_ui.js', 319, 'HUD, inventário, catálogo, mapa, ajuda'],
    ['15b_npc.js', 145, 'Moradia, NPCs e lojas'],
    ['15c_save.js', 241, 'Biblioteca de mundos (IndexedDB, RLE)'],
    ['15d_gamepad.js', 204, 'Suporte a controle'],
    ['15e_worlds.js', 179, 'Menu do título e “Meus Mundos”'],
    ['15f_transfer.js', 261, 'Aparelho, proteção e arquivo de mundo'],
    ['15g_touch.js', 80, 'Controles de toque'],
    ['16_main.js', 270, 'Loop, render, input, câmera'],
  ];
  doc.table(['Módulo', 'Linhas', 'Papel'], mods.map(m => [m[0], String(m[1]), m[2]]), [0.28, 0.1, 0.62], { size: 7.9 });
  doc.para('Total: **50 módulos · 12.505 linhas** de JavaScript, mais 404 linhas de CSS e template.');

  doc.h2('B.  Comandos e ganchos de teste', { mark: 'sb' });
  doc.table(['Comando', 'Efeito'], [
    ['node build.js', 'Compila src/ em index.html.'],
    ['node serve.js [porta]', 'Serve o jogo por http (padrão 8080).'],
    ['node dev/validate.js', 'Valida catálogo, receitas e chefes.'],
    ['CATALOGO=1 node dev/validate.js', 'Idem, e reescreve o catálogo em docs/.'],
    ['node dev/reach.js', 'Confere se todo item é obtível.'],
    ['node dev/test_swords_x.js', 'Executa os ganchos das 80 espadas novas.'],
    ['npm test / npm run test:browser', 'Baterias de verificação.'],
  ], [0.42, 0.58], { size: 8.4 });
  doc.h3('Ganchos expostos no navegador');
  doc.para('O `16_main.js` publica alguns atalhos em `window` para que os testes dirijam o jogo sem depender de cliques: `__G` (estado), `__step(dt)`, `__render()`, `__start(opções)`, `__SW` (catálogo), `__IT` (itens), `__Worlds`, `__chooseSeed`, `__PAD` e `__padUpdate`. Eles não afetam o jogador — são a interface de automação do projeto.');
  doc.callout('ok', 'Resumo final', 'O 101spas é um jogo de navegador em arquivo único, construído por concatenação de 50 módulos globais. Os dados de conteúdo estão separados do motor; o desenho é gerado por código em dois pipelines (vetorial pixelizado e pintura pixel a pixel); o estado vive em G; a interface é DOM sobre um canvas de baixa resolução ampliado por fator inteiro; e a verificação é feita em duas camadas — Node para dados e lógica, Chromium para o jogo de verdade.');
}

module.exports = { part4, part6, appendix };
