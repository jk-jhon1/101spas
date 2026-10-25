'use strict';
// Parte 6: estrutura do código + apêndice (glossário e sobre este guia).
const D = require('./data');
const { X } = D;
const fs = require('fs'), path = require('path');

function part6(d, o) {
  d.partBand(6, 'Estrutura do código', 'Como o jogo é montado por dentro: os 51 módulos, os dados, o laço do jogo e onde mexer para mudar cada coisa.');

  const mods = D.modules();
  const totalLines = mods.reduce((a, m) => a + m.lines, 0);

  d.h2('6.1', 'Como o jogo é montado', { mark: 's61', parent: 'p6' });
  d.para('O jogo não tem framework nem dependências: é **um único `index.html`** gerado a partir de 51 arquivos em `src/`. O `build.js` lê os arquivos na ordem dos números e junta todos num só bloco de script. Por isso a ordem importa: cada módulo usa o que os anteriores definiram.');
  d.numBoxes([
    ['51', 'módulos em src/'],
    [D.ni(totalLines), 'linhas de código'],
    ['0', 'dependências no jogo'],
    ['1', 'arquivo: index.html'],
  ], { perRow: 4 });
  d.para('Cada módulo é um pedaço do jogo, numerado pela ordem de carga: os dados (01), o mundo e a geração (02–04), a arte (05–07), a física e o combate (08–11), o jogador e os inimigos (12–14), a interface e os sistemas (15) e o laço principal (16).');
  d.table(['#', 'Arquivo', 'Linhas', 'O que faz'], mods.map((m, i) => [String(i + 1), m.file, String(m.lines), m.desc]), [.05, .21, .08, .66], { size: 7.2 });

  d.h2('6.2', 'As ideias por trás do código', { mark: 's62', parent: 'p6' });
  d.bullets([
    '**Um só escopo.** Os módulos compartilham variáveis globais (por exemplo, `TS` = tamanho do bloco, `IT` = itens, `G` = estado do jogo). Por isso a ordem dos números importa.',
    '**Dados e código separados.** Itens, receitas, espadas, chefes e conquistas são tabelas: criar uma espada, uma receita ou um chefe é, em geral, acrescentar uma linha (e, para um chefe, também a arte dele).',
    '**O mundo nasce em fatias.** A geração é uma função geradora (`yield` devolve o progresso), consumida uns 14 ms por quadro — por isso a barra de carregamento anda.',
    '**Chefes como roteiros.** Os golpes dos chefes são geradores: `yield 0.5` espera meio segundo, `yield` sozinho espera um quadro. A luta inteira é uma sequência de passos legível.',
    '**Testes.** Os módulos de dados (até o 13i) carregam também no Node, com um DOM de mentira (`dev/validate.js`, `dev/reach.js`…). A interface e o laço principal (14 em diante) precisam do navegador e são testados no Chromium pelo Playwright.',
  ]);
  d.h3('Onde mexer para…');
  d.table(['Quero mudar…', 'Arquivo(s)'], [
    ['dano, velocidade, receita ou texto de uma espada', 'src/11_swords.js, src/11b_swords_x.js (efeitos reutilizáveis em src/10_fx.js)'],
    ['um item, uma receita, um minério ou o preço de algo', 'src/01_data.js (preços em src/15b_npc.js)'],
    ['como o mundo é gerado (biomas, minérios, casas…)', 'src/03_worldgen.js'],
    ['inimigos, onde nascem e o que soltam', 'src/13_enemies.js'],
    ['os 4 chefes da progressão', 'src/13b_bosses.js (arte em src/05e_bossart.js)'],
    ['os 90 chefes novos', 'src/13d…13i_bx_*.js (arte em src/05g…05l_bxart*.js)'],
    ['a interface e os menus', 'src/15_ui.js, style.css, template.html'],
    ['controles (teclado, controle, toque)', 'src/16_main.js, 15d_gamepad.js, 15g_touch.js'],
    ['salvamento e mapas em arquivo', 'src/15c_save.js, src/15f_transfer.js'],
    ['as 429 conquistas', 'src/15h_ach.js'],
  ], [.4, .6]);
  d.para('Depois de editar qualquer arquivo de `src/`, rode **`node build.js`** para gerar o novo `index.html` e, se quiser conferir, **`npm test`**.', { size: 8.8 });

  d.h2('6.3', 'A pasta dev/: testes e utilitários', { mark: 's63', parent: 'p6' });
  d.table(['Arquivo', 'O que faz', 'Roda em'], [
    ['validate.js', 'Valida o catálogo (200 espadas, receitas, 94 chefes) e regenera os arquivos de docs/.', 'Node'],
    ['reach.js', 'Confere se todo item usado em receitas é obtível (blocos, drops, baús, lojas ou outra receita): as 200 espadas são criáveis.', 'Node'],
    ['seeds.js', 'Testa o gerador de mundos em várias sementes (tempo e minérios).', 'Node'],
    ['layouts.js', 'Variedade dos mundos: ordem dos biomas, oceanos, relevo e sorteio de semente inédita.', 'Node'],
    ['transfer.js', 'Mapa em arquivo, aparelho e proteção, sem navegador: formato, CRC-32, ida e volta, validação.', 'Node'],
    ['smoke.js', 'Teste de fumaça: abre o jogo, captura o título e mostra o console.', 'Navegador'],
    ['soak.js', 'Estresse: ~45.000 passos de simulação com nascimento natural de inimigos.', 'Navegador'],
    ['http_check.js', 'Verifica uma URL do jogo de ponta a ponta: carrega, salva, recarrega e continua.', 'Navegador'],
    ['test_worlds.js', 'Mundos salvos: criar, reabrir, fidelidade do salvamento, autosave, renomear, excluir, migração.', 'Navegador'],
    ['test_enemies.js', 'Todos os inimigos, variantes elementais e os 4 chefes lutando contra o jogador.', 'Navegador'],
    ['test_bosses.js', 'Sprites dos 4 chefes: paleta, fases, íris, cache e caixas de colisão.', 'Navegador'],
    ['test_bx_art.js', 'Arte, sigilos e invocação dos 90 chefes novos.', 'Navegador'],
    ['test_bx.js', 'A luta dos 90 chefes novos: 3 fases, todos os golpes, loot e vitória.', 'Navegador'],
    ['test_swords.js', 'As 200 espadas em combate (cerca de 4,5 s cada).', 'Navegador'],
    ['test_progress.js', 'Progressão: morte e renascimento, derrota dos 4 chefes (drops, estágio, minérios do Hardmode).', 'Navegador'],
    ['test_ach.js', 'As 429 conquistas: 29 verificações de contagem, raridade, categorias e botões.', 'Node'],
    ['test_npc_save.js', 'Moradia, NPCs e salvar/carregar pelo IndexedDB.', 'Navegador'],
    ['test_sandbox.js', 'O jogo dentro de um iframe com sandbox (sem armazenamento local).', 'Navegador'],
    ['test_fluids.js', 'Líquidos (água + lava = obsidiana), areia que cai e plantas sem apoio.', 'Navegador'],
    ['lib.js', 'Utilitários dos testes: abrir o navegador, criar mundo, esperar o jogo, coletar erros.', 'Apoio'],
  ], [.2, .68, .12], { size: 7.4 });
  d.para('**`npm test`** roda os testes de Node (validate, reach, seeds, layouts, transfer, test_ach). **`npm run test:browser`** roda os de navegador (precisa de `npm install` e `npx playwright install chromium`).', { size: 8.8 });

  d.h2('6.4', 'docs/, a raiz do projeto e as pastas de apoio', { mark: 's64', parent: 'p6' });
  d.table(['Arquivo ou pasta', 'Para que serve'], [
    ['docs/catalogo_200_espadas.md e .csv', 'O catálogo completo das 200 espadas, com atributos, mecânica e receita (gerado pelo dev/validate.js).'],
    ['docs/chefes_novos.md', 'A tabela dos 90 chefes novos: vida, dano, mecânica, sigilo, condição e espada.'],
    ['docs/conquistas.md', 'As 429 conquistas por categoria e raridade.'],
    ['docs/catalogo_equipamentos.md', 'As 50 armaduras, os 50 acessórios e os 50 minérios de família.'],
    ['docs/img/', '13 capturas de tela do jogo (menu, combate, biomas, arco de ataque, efeitos, interface, controle, Meus Mundos, toque, chefes).'],
    ['index.html', 'O jogo pronto (gerado). É só abrir num navegador.'],
    ['build.js', 'Monta o index.html a partir de src/.'],
    ['serve.js', 'Servidor local mínimo; serve só o jogo, o README e docs/.'],
    ['package.json e package-lock.json', 'Scripts do npm (build, serve, test, test:browser) e a única dependência: o Playwright.'],
    ['README.md', 'A apresentação do projeto no GitHub: como jogar, controles, mapeamento do GDD, estrutura e testes.'],
    ['.gitignore e .nojekyll', 'Arquivos que o Git ignora (capturas temporárias dos testes e node_modules/) e o aviso para o GitHub Pages não processar o site com o Jekyll.'],
    ['work/', 'Ferramentas fora do repositório: publicação no GitHub, bateria completa de testes, regeneração das capturas, código do Espadas.exe (launcher/), montagem do pacote para baixar (pack/) e este guia (guia/).'],
  ], [.28, .72], { size: 7.6 });
  d.para(`Resumo em números: **51 arquivos de código-fonte** em src/ (${D.ni(totalLines)} linhas), 21 de testes em dev/, 16 de documentação em docs/ e 8 na raiz. O index.html publicado tem ${D.ni(o.indexBytes || 0)} bytes.`, { size: 8.6 });

  // ---------------- apêndice ----------------
  d.partBand(7, 'Apêndice', 'Glossário, sobre este guia e o que conferir antes de usar.');
  d.h2('A.1', 'Glossário', { mark: 'sa1', parent: 'p7' });
  d.table(['Termo', 'Significado'], [
    ['Arsenal', 'Painel do Modo Criativo (tecla B) com todas as espadas, itens, inimigos e chefes. Na Aventura vira o Catálogo das 200 espadas.'],
    ['Tier', 'Faixa de poder das espadas, de 1 a 10, com 20 espadas cada, uma cor e uma estação de criação.'],
    ['Estação', 'Bloco que habilita receitas quando está por perto: Bancada, Fornalha, Bigorna, Bigorna Avançada e Forja Celeste.'],
    ['Estágio', 'Número de 0 a 3 do mundo, que sobe ao derrotar o Olho Colossal, o Guardião do Abismo e o Colosso Estelar.'],
    ['Hardmode', 'O estágio 2: depois do Guardião do Abismo, surgem minérios novos e os inimigos ficam muito mais fortes.'],
    ['Ato', 'Grupo de chefes novos (I a VI), liberado em ordem conforme o estágio do mundo.'],
    ['Sigilo', 'Item que invoca um dos 90 chefes novos; é criado numa estação e gasto ao invocar.'],
    ['Essência', 'Material solto pelos inimigos elementais do Hardmode (Fogo, Gelo, Raio, Sombra, Veneno, Luz, Terra, Água, Sangue e Tempo).'],
    ['Fragmento Celeste / Barra Celeste', 'Fragmentos caem de elites e chefes do Hardmode; 3 fragmentos na Forja Celeste viram 1 Barra Celeste.'],
    ['Núcleo Mítico', 'Material do Colosso Estelar, exigido por cada espada do Tier 6 e pela Apoteose.'],
    ['Família', 'Uma das dez linhagens de minério (Braseiro, Geada, Corisco, Maré, Raiz, Véu, Aurora, Relógio, Vazio e Origem), com cinco tiers cada.'],
    ['Cristal de Vida', 'Consumível que aumenta a vida máxima em 20 (até 400, com 15 cristais).'],
    ['Elite', 'Inimigo raro (estágio 1 em diante) com 3× a vida, mais dano, maior e com mais moedas.'],
    ['Elemental', 'Inimigo do Hardmode com um elemento; solta a Essência dele.'],
    ['Ápice', 'A metade do arco de ataque, quando a lâmina aponta para o cursor; os efeitos e projéteis saem aí.'],
    ['KB (repulsão)', 'Força com que o golpe empurra o inimigo.'],
    ['DPS base', 'Dano por segundo teórico: dano × golpes por segundo.'],
    ['Boneco de Treino', 'Alvo do Modo Criativo que não morre e mostra o dano de cada golpe.'],
    ['Prof.', 'Profundidade mostrada no relógio do jogo: a linha y do bloco menos 120 (o chão fica perto de 0).'],
  ], [.24, .76], { size: 7.8 });

  d.h2('A.2', 'Sobre este guia', { mark: 'sa2', parent: 'p7' });
  d.para('Este guia foi gerado **a partir do próprio jogo**: as tabelas (espadas, receitas, chefes, inimigos, itens e conquistas) saem do código-fonte, e as imagens (ícones, sprites dos chefes e telas) foram feitas no jogo de verdade. Por isso os números batem com a versão publicada.');
  d.para(`A versão deste guia é a **${o.version || '5f149fb'}** do repositório, com 200 espadas, 94 chefes, 433 receitas, 628 itens e 429 conquistas. O jogo não tem música (só efeitos sonoros sintetizados) e não tem multiplayer. O suporte a controle e a toque foi testado com simulações, não com aparelhos de verdade. O equilíbrio dos chefes e dos drops foi validado por simulação.`);
  d.callout('info', 'O que conferir', 'Se um número aqui não bater com o jogo, o jogo é a fonte: rode `node dev/validate.js` para ver o catálogo atualizado e `npm test` para a bateria de testes. Este PDF foi gerado pelo script em `dev/guia/build.js`.');
}

module.exports = { part6 };
