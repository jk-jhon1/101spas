'use strict';
// Conteúdo — parte 3: blocos 08–16, pasta dev/, docs/ e os capítulos "como funciona por dentro".
const { C } = require('./engine.js');
const { COL } = require('./content_b.js');

function part3b(doc) {
  doc.h2('10.  Bloco 08–10 · física, combate e efeitos', { mark: 's10', break: true });
  doc.para('Aqui começa a simulação. O estado global `G` vive em `08_phys.js`; a colisão e as partículas também. O combate fica em `09_combat.js` (dano, status, projéteis) e o arco do golpe em `09b_swing.js`. Os efeitos das espadas são uma biblioteca à parte (`10_fx.js`) que o catálogo só referencia pelo nome.');

  doc.fileCard({
    name: 'src/08_phys.js', lines: 145, tag: 'Simulação', role: 'Estado global, colisão, partículas e drops', color: COL.sim,
    summary: 'Declara o objeto `G` (o estado de tudo) e as funções de colisão AABB contra tiles, além de partículas, textos flutuantes e itens no chão.',
    what: '`G` é o “coração” compartilhado: estado da tela, mundo, jogador, inimigos, projéteis, câmera, luz, opções de sandbox, contadores. Este módulo também contém o movimento de corpos com colisão por eixo, consultas de líquido, altura do chão/teto, raios contra tiles, partículas (`addPart`, `burst`, `ringFx`, `tileBits`), textos que sobem e o ciclo de vida dos itens dropados.',
    how: [
      '`bodyMove` move em passos pequenos, resolve X e Y separadamente e devolve o que foi tocado.',
      '`overlapSolid` e `solidPx` convertem pixels em índices de tile para testar colisão.',
      '`dropItem` + `updateDrops` fazem o item cair, quicar e ser recolhido com atraso.',
    ],
    funcs: 'G · bodyMove · overlapSolid · solidPx · groundY · ceilY · rayTiles · los · addPart · burst · ringFx · addText · dropItem',
    deps: '00_util, 01_data, 02_world, 04_light', used: 'todos os módulos de jogo',
  });

  doc.fileCard({
    name: 'src/08b_audio.js', lines: 60, tag: 'Simulação', role: 'Efeitos sonoros sintetizados', color: COL.sim,
    summary: 'Sintetiza todos os sons com osciladores e ruído da WebAudio API — nenhum arquivo de áudio no projeto.',
    what: 'O objeto `Snd` cria um grafo uma única vez (compressor + ganho mestre + buffer de ruído de 1 s) e `sfx(nome)` dispara combinações de tom e ruído com envelope. Há um controle de repetição por nome para não saturar em quadros consecutivos.',
    how: [
      '`Snd.init()` é chamado no primeiro gesto do jogador (política de autoplay dos navegadores).',
      '`Snd.play(nome)` monta o som; `mute`/`setVol` controlam o volume geral.',
    ],
    funcs: 'Snd.init · tone · noise · play · mute · setVol · sfx',
    deps: 'nada', used: 'combate, interface, NPCs, chefes',
  });

  doc.fileCard({
    name: 'src/09_combat.js', lines: 335, tag: 'Simulação', role: 'Dano, status, projéteis e explosões', color: COL.sim,
    summary: 'O pipeline completo de combate: aplicar dano, calcular crítico e defesa, status, morte, projéteis de todos os formatos, feixes e explosões.',
    what: 'É o módulo que decide tudo o que acontece quando algo acerta algo. `hitEnemy` calcula dano (base × multiplicador × crítico − defesa), aplica elemento e status, dispara os ganchos da espada e devolve o resultado. `killEnemy` dá drops, moedas e conta chefes. `spawnProj`/`updateProjs`/`drawProj` movem e desenham projéteis de ~18 formatos diferentes, com homing, balística, perfuração e recarga por alvo.',
    how: [
      '`dpsPush` mantém um registro de dano dos últimos 10 s, usado pelos testes para provar que a espada causa dano.',
      'O teto de 700 projéteis descarta os mais antigos — por isso o laço de atualização precisa tolerar buracos na lista.',
      '`fxCall`/`fxAll` despacham os ganchos (`onSwing`, `onApex`, `onHit`, `onProjHit`, `tick`, `stats`…) para os efeitos da espada equipada.',
    ],
    funcs: 'hitEnemy · killEnemy · dealRaw · hurtPlayer · healPlayer · applyStatus · spawnProj · updateProjs · drawProj · fireBeam · explode · fxCall · fxAll',
    deps: '00_util, 08_phys, 10_fx, 14_draw_enemies', used: '09b_swing, 10_fx, 11b, 12_player, 13_enemies, 13c_bossx',
  });

  doc.fileCard({
    name: 'src/09b_swing.js', lines: 95, tag: 'Simulação', role: 'O arco do golpe', color: COL.sim,
    summary: 'Implementa o golpe como um arco (ArcSwing), estocada (Thrust) e feixe (Beam), com ápice, colisão da lâmina e clones “fantasma”.',
    what: 'O GDD pede que o golpe varra um arco em torno do ombro, na direção do cursor, e que os projéteis saiam na direção do arco no seu ponto médio. `startSwing` cria uma **instância** de golpe (com tempo de vida, lado, alcance e multiplicador de dano); `updateSwings` calcula o ângulo, a ponta, o rastro e chama o gancho de ápice; `swingHit` testa o segmento da lâmina contra a caixa de cada inimigo.',
    how: [
      'Cada instância tem seu próprio conjunto de inimigos já atingidos — um clone não pode acertar o mesmo alvo duas vezes.',
      'Instâncias com `ghost: true` são os ecos e espelhos criados por efeitos: desenham com transparência e não aplicam “hit stop”.',
      'O ângulo usa aceleração e desaceleração (ease in-out) para o golpe parecer ter peso.',
    ],
    funcs: 'startSwing · updateSwings · swingHit · instAngle · instTipDist · drawSwingTrail · atkSpeedMult',
    deps: '08_phys, 09_combat', used: '12_player, 10_fx, 11b_swords_x',
  });

  doc.fileCard({
    name: 'src/10_fx.js', lines: 276, tag: 'Efeitos', role: 'Biblioteca de efeitos das espadas', color: COL.play,
    summary: 'Cento e um efeitos prontos, declarados como fábricas de ganchos, mais as ferramentas que eles usam para atirar, criar áreas, invocar meteoros e ferir a tela.',
    what: 'O catálogo de espadas não escreve lógica de efeito: ele pede `FX.nome(...)`. Cada efeito devolve um objeto com os ganchos que quiser — `onSwing`, `onApex`, `onHit`, `onKill`, `tick`, `mod`, `stats`, `atkMult`, `init`. Isso mantém o catálogo legível e permite que o mesmo efeito seja combinado em várias espadas com parâmetros diferentes.',
    how: [
      '`shoot`/`mkProj` criam projéteis já posicionados no ápice do golpe; `aura`, `portalAt`, `meteorFall`, `chainFx` cobrem padrões comuns.',
      '`screenDamage` e `breakHeldSword` implementam efeitos de escala de tela e a espada que se quebra.',
      '`sword(P)` devolve a espada equipada; `dmgOf(inst, mult)` calcula o dano de um efeito a partir do golpe que o originou.',
    ],
    funcs: 'FX (101 efeitos) · shoot · mkProj · aura · portalAt · homingBlade · meteorFall · chainFx · screenDamage · dmgOf · sword',
    deps: '00_util, 08_phys, 09_combat', used: '11_swords (catálogo 1–120)',
  });

  doc.h2('11.  Bloco 11–14 · conteúdo: espadas, jogador, inimigos', { mark: 's11', break: true });
  doc.para('O bloco de conteúdo define **o que existe no jogo**: as espadas (com atributos, arte e efeitos), o jogador (inventário, criação, movimento), os inimigos comuns, os chefes clássicos e os 50 novos, além do desenho de tudo o que se move.');

  doc.fileCard({
    name: 'src/11_swords.js', lines: 157, tag: 'Conteúdo', role: 'Catálogo das 120 primeiras espadas', color: COL.play,
    summary: 'A fábrica `S(...)` monta o objeto `SwordItemSO` de cada espada: atributos, arte, efeitos, receita e os métodos OnSwing/OnHitEnemy.',
    what: 'Cada chamada `S(num, nome, dano, velocidade, knockback, look, efeitos, texto, receita)` cria uma espada com id (`s001`…`s120`), tier calculado por `ceil(num/20)`, crítico padrão do tier e receita associada. Os textos dos tiers 1, 3 e 5 vêm do GDD; os tiers 2, 4 e 6 completam o catálogo seguindo as regras de cada tier.',
    how: [
      '`DEF_CRIT` e `TIER_STATION` definem crítico e estação padrão por tier (tiers 7–10 estendidos aqui).',
      'Os métodos `OnSwing`/`OnHitEnemy` existem para cumprir o contrato do schema e delegam aos ganchos.',
      'O resultado entra em `SWORDS[]` e em `SWORD_BY_NUM{}`, e a receita é registrada em `RECIPES`.',
    ],
    funcs: 'S() · LK() · DEF_CRIT · TIER_STATION · SWORDS[]',
    deps: '01_data, 10_fx', used: '12_player, 15_ui, 09_combat',
  });

  doc.fileCard({
    name: 'src/11b_swords_x.js', lines: 425, tag: 'Conteúdo', role: 'Tiers 7–10: as 80 espadas novas (121–200)', color: COL.play,
    summary: 'Segunda metade do catálogo, com 20 espadas por tier, arte exclusiva (receita `look.art2`) e 25 efeitos novos (`FX2`).',
    what: 'Repete a estrutura de 11_swords com duas fábricas: `S2` (espada) e `A2` (receita de arte para o pintor de 06b). Os efeitos ficam em `FX2`, um objeto com 25 mecânicas pensadas para o pós-jogo: eco do golpe, leque de lâminas, nova, cometa, varredura, corrente, marca que detona, domínio, gravidade, escudo, dobra, divisão, almas, execução, explosão de sangue, convergência, ciclo, fenda, espelho, tempestade, parada no tempo, linha de condenação, orbes, singularidade e big bang.',
    how: [
      'Cada espada tem nome, dano, velocidade, knockback, texto de mecânica, receita e uma arte que não repete a de outra.',
      'Os ganchos que um eco dispara **não** geram novos ecos (guarda contra recursão) — sem isso, os acertos cresciam exponencialmente.',
      'Tiers 7–8 usam a Bigorna Avançada; 9–10 usam a Forja Celeste, com Fragmentos Celestes, Núcleos Míticos e essências.',
    ],
    funcs: 'S2() · A2() · FX2 (25 efeitos) · TIER7_ST',
    deps: '11_swords, 10_fx, 06b_swordart', used: '12_player, 15_ui, 09_combat',
  });

  doc.fileCard({
    name: 'src/10b_gear_fx.js', lines: 498, tag: 'Equipamento', role: 'Mecânicas dos acessórios, armaduras e conjuntos', color: COL.play,
    summary: 'As 50 passivas de armadura (`ARM_FX`), as 50 mecânicas de acessório (`ACC_FX`) e os 10 bônus de conjunto (`SET_FX`), escritas como fábricas de ganchos.',
    what: 'Cada peça devolve um objeto de ganchos que o motor chama em momentos fixos do jogo: `stats` (ao recalcular atributos), `tick` (a cada quadro), `mod` (antes do dano), `onHit`, `onKill`, `onHurt`, `incoming` (escolhe esquiva e reduções), `onLethal` (renascimento), `onJump`, `onLand`, `onWater`, `onPotion`, `onSwing` e `atkMult`. `rebuildGear` monta a lista ativa quando o equipamento muda e conta as famílias para ativar os conjuntos.',
    how: [
      'Um efeito nunca se chama de novo em reação a si mesmo: dano causado por acessório entra com `gear: 1`, e os ganchos ignoram esse marcador (sem isso os efeitos se multiplicariam sem fim).',
      'Cada acessório tem o seu próprio estado (`P.gearState[id]`), então recargas e contadores não vazam entre peças.',
      'Conjuntos contam armadura + acessórios da mesma família: 2 peças dão um bônus pequeno, 4 peças o bônus completo.',
    ],
    funcs: 'ACC_FX (50) · ARM_FX (50) · SET_FX (10) · rebuildGear · gearCall · gearAtkMult · gHit · gBoom · gProj',
    deps: '01_data, 09_combat, 10_fx', used: '12_player, 09_combat, 09b_swing, 15_ui',
  });

  doc.fileCard({
    name: 'src/11c_gear_x.js', lines: 256, tag: 'Conteúdo', role: '50 minérios, 50 armaduras, 50 acessórios e 5 picaretas', color: COL.play,
    summary: 'Dez famílias (Braseiro, Geada, Corisco, Maré, Raiz, Véu, Alvorada, Relojoaria, Vazio e Origem), cada uma com 5 minérios, 5 armaduras e 5 acessórios.',
    what: 'Os 50 minérios viram 50 telhados de minério no mundo (gerados por `gearPlaceOres`, chamada pelo gerador em `03_worldgen.js`) e 50 barras na Fornalha. As armaduras são forjadas com as barras da própria família, em Bigorna, Bigorna Avançada ou Forja Celeste. Os acessórios vêm de 45 chefes (um exclusivo por chefe, incluindo os 4 clássicos) e 5 são forjados.',
    how: [
      'A dureza dos minérios vai de 2 a 14 e usa as 5 picaretas novas (poder 10 a 14), forjadas na Forja Celeste.',
      'Os minérios são distribuídos por profundidade: quanto mais fundo o tier, menor a oferta perto da superfície e maior no Inferno.',
      '`gearSourceText` mostra no tooltip de onde vem cada peça: nome do chefe, estação ou dureza da picareta.',
    ],
    funcs: 'GFAM · GORES · GARMS · GACCS · GPICKS · BX_ACC · gearPlaceOres · gearSourceText',
    deps: '01_data, 10b_gear_fx, 13c_bossx', used: '03_worldgen, 13_enemies, 13c_bossx, 15_ui',
  });

  doc.fileCard({
    name: 'src/12_player.js', lines: 367, tag: 'Conteúdo', role: 'Jogador, inventário e criação', color: COL.play,
    summary: 'O corpo do jogador (12×26 px), os 40 espaços de inventário, os equipamentos (1 armadura + 4 acessórios), as estatísticas, a criação, a mineração, a construção e o desenho.',
    what: 'É o módulo mais “jogável” do projeto. Cuida do movimento com colisão, pulo, natação, i-frames, morte e renascimento; do inventário de 40 posições + armadura + três acessórios; da criação de itens com verificação de estação próxima; de quebrar e colocar blocos com alcance; de usar consumíveis; e de desenhar o boneco com as peças de 05b.',
    how: [
      '`recalcStats` soma os bônus de armadura e acessórios e chama o gancho `stats` da espada equipada.',
      '`canCraft`/`doCraft` checam estação (`nearStations`) e ingredientes; `missingStation` alimenta a dica na interface.',
      '`revealMap` revela o minimapa em raio; `killPlayer`/`respawnPlayer` tratam a morte sem apagar o mundo.',
    ],
    funcs: 'newPlayer · invAdd/invRemove/invCount · canCraft · doCraft · recalcStats · placeTile · breakTile · useHeldItem · updatePlayer · drawPlayer · revealMap',
    deps: '01_data, 05b_pixel, 08_phys, 09_combat, 09b_swing, 15b_npc', used: '16_main',
  });

  doc.fileCard({
    name: 'src/13_enemies.js', lines: 334, tag: 'Conteúdo', role: 'Inimigos comuns, IA e spawn', color: COL.play,
    summary: 'Define os 84 inimigos (com variantes elementais), oito tipos de IA, as tabelas de spawn por camada/bioma/noite/estágio e os drops.',
    what: 'A função `enemy(chave, dados)` registra um inimigo em `ED` com vida, dano, defesa, velocidade, massa, cor, sangue, drops e moedas. A IA é escolhida por `kind`: slime (pulos), walker (anda e vira), archer (atira), flyer (voo direto), hover (paira), ghost (atravessa paredes), swim e critter (inofensivo). `spawnTick` sorteia o que aparece conforme onde o jogador está.',
    how: [
      'Variantes elementais reaproveitam o mesmo corpo com cor e efeito de status diferentes.',
      '`rollDrops` e `bossLoot` distribuem itens; `bossDefeated` marca as bandeiras de progresso.',
      '`findSpawnPos` procura um lugar livre e iluminado o suficiente para nascer.',
    ],
    funcs: 'enemy() · spawnEnemy · updateEnemies · aiSlime/aiWalker/aiArcher/aiFlyer/aiHover/aiGhost/aiSwim · spawnTick · rollDrops',
    deps: '01_data, 08_phys, 09_combat', used: '14_draw_enemies, 16_main, 12_player',
  });

  doc.fileCard({
    name: 'src/13b_bosses.js', lines: 78, tag: 'Conteúdo', role: 'Os 4 chefes clássicos', color: COL.play,
    summary: 'Invocação, fases e ataques do Rei Slime, do Olho Colossal, do Guardião do Abismo e do Colosso Estelar.',
    what: 'Cada chefe é um objeto com vida alta, defesa, padrões de ataque e um “gatilho” de invocação (item, horário ou local). `bossAI` escolhe ataques conforme a fase (percentual de vida) e `radialShots`/`bossProj` criam os projéteis temáticos.',
    how: [
      '`summonBoss` coloca o chefe no mundo com uma posição livre (`freeSpot`).',
      'A morte marca a bandeira em `G.flags` e libera o próximo estágio (inclui os minérios de Hardmode).',
    ],
    funcs: 'summonBoss · bossAI · bossProj · radialShots · freeSpot',
    deps: '13_enemies, 09_combat, 05e_bossart', used: '16_main, 14_draw_enemies',
  });

  doc.fileCard({
    name: 'src/13c_bossx.js', lines: 324, tag: 'Conteúdo', role: 'Motor dos 90 chefes novos', color: COL.play,
    summary: 'Registro `BX`, condições de invocação, sigilos, repertório de golpes escritos como geradores e um kit de peças reutilizáveis (zonas, feixes, projéteis, lacaios, teleporte).',
    what: 'Cada chefe novo se declara com `bx(id, { ... })`: atributos, ato, condição (bioma, item, horário), mecânica única descrita em texto, e um conjunto de golpes escritos como `function*` — `yield 0.5` espera meio segundo e `yield` sozinho espera um quadro. O motor executa esses geradores, cuida das três fases, das zonas de perigo, dos projéteis telegrafados, dos lacaios e dos debuffs no jogador.',
    how: [
      'Peças: `bxZone` (lentidão, veneno, vento, explosão com aviso), `bxBeam`, `bxShot`, `bxFan`, `bxRing`, `bxRain`, `bxCol`, `bxTele`, `bxBoom`, `bxMin`, `bxBuff`.',
      '`bxUpdate` roda os golpes, `bxDraw` desenha e `bxOverlay` aplica escurecimentos e avisos de tela.',
      '`d.phase(c)` permite mais de três fases (a Apoteose usa quatro, uma por quarto de vida) e `d.onPhase` troca o modo de movimento — é assim que a Apoteose sai do chão e passa a voar.',
      'Chefes do Ato V/VI guardam as espadas T9/T10: essas 40 espadas não têm receita (`dropOnly`) e caem do chefe que as protege.',
      'A derrota dá loot, conta para `bxDefeatedCount` e libera os próximos atos.',
    ],
    funcs: 'bx() · summonBossX · bxUpdate · bxDraw · bxZone · bxBeam · bxFan · bxRing · bxRain · bxMinionAI · bxLoco',
    deps: '09_combat, 08_phys, 05f_bxart, 13_enemies', used: '13d..13i_bx_*, 14b_draw_bx, 16_main',
  });

  doc.fileCard({
    name: 'src/13d_bx_a1.js', lines: 120, tag: 'Conteúdo', role: 'Chefes novos do Ato I (8)', color: COL.play,
    summary: 'Dados e golpes dos oito primeiros chefes novos, do Despertar.',
    what: 'Cada bloco declara um chefe com nome, tamanho, vida, dano, moedas, espada que dropa, receita do sigilo, condição de invocação, mecânica e os golpes. A dificuldade acompanha o começo de jogo.',
    deps: '13c_bossx', used: '13c (motor), 14b (desenho)',
  });
  doc.fileCard({
    name: 'src/13e_bx_a2.js', lines: 269, tag: 'Conteúdo', role: 'Chefes novos do Ato II (14)', color: COL.play,
    summary: 'Os catorze chefes do Pós-Olho, com mecânicas de cristal, reflexo e invocação.',
    what: 'Aumenta o repertório: golpes com aviso no chão, refração de raios, lacaios que precisam ser limpos e fases que mudam o cenário.',
    deps: '13c_bossx', used: '13c, 14b',
  });
  doc.fileCard({
    name: 'src/13f_bx_a3.js', lines: 263, tag: 'Conteúdo', role: 'Chefes novos do Ato III (16)', color: COL.play,
    summary: 'Os dezesseis chefes do Hardmode, com telegrafias longas e padrões densos.',
    what: 'Mistura zonas de perigo, feixes que varrem a arena, chuva de projéteis e teleportes em sequência. É o ato que introduz os golpes de “marca e detonação”.',
    deps: '13c_bossx', used: '13c, 14b',
  });
  doc.fileCard({
    name: 'src/13g_bx_a4.js', lines: 187, tag: 'Conteúdo', role: 'Chefes novos do Ato IV (12)', color: COL.play,
    summary: 'Os doze chefes finais, acima do Colosso Estelar, com mecânicas que alteram regras do jogo.',
    what: 'Inclui inversão de gravidade, sangramento acumulativo, telas divididas por fendas e execuções — os combates mais longos do jogo.',
    deps: '13c_bossx', used: '13c, 14b',
  });

  doc.fileCard({
    name: 'src/13h_bx_a5.js', lines: 433, tag: 'Conteúdo', role: 'Chefes novos do Ato V (20)', color: COL.play,
    summary: 'Os 20 chefes do Julgamento (espadas 161–180), cada um com uma mecânica inédita que muda como o jogador luta.',
    what: 'Serafim que segura o veredito, dois raios girando em sentidos opostos, a espada selada no círculo (bater fora dela quase não faz dano), a gema imune do cetro, o coro dos querubins que corta o dano, o cálice que enche e cura, os sete selos, a lanterna que apaga no sexto acerto, o fênix que renasce de um ovo e o trono protegido por quatro pilares.',
    how: ['Cada chefe usa `passive`, `hurt`, `after` ou `lethal` para implementar a própria regra.', 'Lacaios com `tag` (coro, mão, selo, pilar) alimentam as condições da mecânica.'],
    deps: '13c_bossx', used: '13c, 14b',
  });
  doc.fileCard({
    name: 'src/13i_bx_a6.js', lines: 442, tag: 'Conteúdo', role: 'Chefes novos do Ato VI (20) — inclui a Apoteose', color: COL.play,
    summary: 'Os 20 chefes do Fim de Tudo (espadas 181–200), do primeiro raio de luz ao combate final de quatro estágios.',
    what: 'Aqui cada chefe muda uma regra do combate: luz que apaga o corpo, cicatrizes de vazio no chão, um buraco branco que empurra tudo, planetas que absorvem dano, quadrantes de um teorema, o nome escrito que torna os tiros perseguidores, o relógio que compara o seu dano com o dele, o axioma que devolve metade do golpe, a maré que sobe e desce. A Apoteose fecha o jogo com 260 mil de vida, quatro estágios (terra, terra, céu, céu) e um repertório próprio por estágio.',
    how: ['`phase(c)` devolve 1..4 por quarto de vida; `onPhase` cria os selos, liga asas e o voo sem colisão.', 'No estágio IV quatro raios giram em volta e o golpe final cobre a arena de colunas.'],
    deps: '13c_bossx', used: '13c, 14b',
  });

  doc.fileCard({
    name: 'src/14_draw_enemies.js', lines: 236, tag: 'Desenho', role: 'Desenho de inimigos e chefes', color: COL.art,
    summary: 'Desenha cada tipo de inimigo proceduralmente, aplica tinta de status e organiza as camadas dos chefes (corpo, partes, sombra, brilho).',
    what: 'Os inimigos comuns são desenhados por formas simples com a cor do indivíduo (que muda com status: queimando, congelado, envenenado, amaldiçoado…). Os chefes clássicos usam o sprite pintado de 05e mais camadas móveis. O registro `BOSSDRAW` permite que módulos posteriores acrescentem desenhos sem tocar neste arquivo.',
    how: [
      '`STATUS_TINT` mistura a cor base com a cor do efeito ativo.',
      '`bossBegin/bossLayer/bossShadow/bossBlit` compõem o chefe em etapas, para o brilho ficar por cima do corpo.',
    ],
    funcs: 'drawEnemy · drawEnemyGlow · bossBegin · bossLayer · bossBlit · bossShadow · ec',
    deps: '05b_pixel, 05e_bossart, 08_phys, 14b_draw_bx', used: '16_main',
  });

  doc.fileCard({
    name: 'src/14b_draw_bx.js', lines: 36, tag: 'Desenho', role: 'Desenho dos 90 chefes novos', color: COL.art,
    summary: 'Liga o sprite pintado de cada chefe novo ao motor de desenho, com sombra no chão e camadas móveis opcionais.',
    what: 'É um arquivo curto de propósito: só registra `BOSSDRAW.bx` (corpo + camadas `under`/`over`) e `BOSSDRAW.bxm` (lacaios). Toda a arte está em 05f–05l; toda a lógica em 13c. Assim, acrescentar um chefe novo não exige mexer no desenho nem no motor.',
    funcs: 'BOSSDRAW.bx · BOSSDRAW.bxm · bxGroundShadow',
    deps: '05f_bxart, 14_draw_enemies', used: '16_main (bxDraw)',
  });

  doc.h2('12.  Bloco 15–16 · interface, saves, conquistas e controles', { mark: 's12', break: true });
  doc.para('O último bloco liga o jogo ao navegador: interface em DOM, NPCs e moradia, biblioteca de mundos salvos, gamepad, toque, exportação de arquivo, conquistas e o laço principal com o pipeline de render.');

  doc.fileCard({
    name: 'src/15_ui.js', lines: 320, tag: 'Interface', role: 'HUD, inventário, catálogo, mapa e ajuda', color: COL.ui,
    summary: 'Toda a interface em DOM: corações, barra de itens, painéis de inventário e criação, catálogo das espadas, tooltips, minimapa, mapa grande e a tela de ajuda.',
    what: 'A interface não é desenhada em canvas: são elementos HTML posicionados sobre o jogo, o que dá texto nítido, rolagem e acessibilidade de graça. Este módulo monta os slots, sincroniza o inventário com o DOM, calcula o HTML de cada tooltip, filtra e ordena receitas, e renderiza o catálogo com abas.',
    how: [
      'Os ícones viram classes CSS com `data:` URL — registradas uma vez, reutilizadas para sempre.',
      '`ARS_TABS` define as abas do catálogo: Tier 1 a Tier 10, “Todas”, itens, inimigos e mundo. No modo aventura só aparecem as abas de tier e “Todas”.',
      '`openPanel`/`closePanels` coordenam qual painel está aberto e bloqueiam o jogo enquanto isso.',
    ],
    funcs: 'initUI · buildSlotsUI · refreshInvUI · paintSlot · tipHTML · renderCrafting · renderArsenal · refreshHUD · drawMinimap · drawBigMap · helpHTML · toast',
    deps: '01_data, 12_player, 06_icons, 15b_npc', used: '16_main',
  });

  doc.fileCard({
    name: 'src/15b_npc.js', lines: 168, tag: 'Interface', role: 'Moradia e NPCs', color: COL.ui,
    summary: 'Valida salas para moradia, faz os NPCs aparecerem, atualiza seu comportamento e abre as lojas de compra e venda.',
    what: 'Para um NPC se mudar, a sala precisa ser fechada, ter paredes de fundo em toda a área, luz, mesa ou bancada, cadeira e ao menos uma porta. `scanRooms` faz uma busca em largura para achar salas válidas; `spawnNpcQuiet` coloca o morador; `openNpc` monta o painel de diálogo e a loja.',
    how: [
      '`itemValue`/`sellPrice` definem preços (as espadas têm tabela por tier, estendida até o tier 10).',
      '`updateNpcs` mantém o NPC na sala, olhando para o jogador e falando dicas contextuais.',
    ],
    funcs: 'scanRooms · spawnNpc · updateNpcs · openNpc · itemValue · sellPrice · NPC_DEF · SHOPS',
    deps: '01_data, 12_player, 15_ui', used: '16_main, 15c_save',
  });

  doc.fileCard({
    name: 'src/15c_save.js', lines: 244, tag: 'Sistemas', role: 'Biblioteca de mundos salvos', color: COL.ui,
    summary: 'Guarda vários mundos em IndexedDB, comprime os blocos com RLE, gera miniaturas, salva em fila e migra o save antigo.',
    what: 'O objeto `Worlds` é uma pequena biblioteca: metadados leves na loja `worlds` (nome, semente, modo, progresso, miniatura, aparelho de origem), o mundo em si na loja `data` e todas as sementes já sorteadas na loja `seeds` — para que nenhuma semente se repita nem depois de excluir um mundo. Sem IndexedDB (iframe restrito, modo privado), os mundos ficam em memória durante a sessão, com aviso.',
    how: [
      '`snapshotGame` serializa; `rleEnc`/`rleDec` comprimem os milhões de blocos; `renderThumb` desenha a miniatura.',
      'Os salvamentos entram numa fila (`this.q`) para nunca haver dois ao mesmo tempo; o autosave roda a cada 60 s.',
      '`allocate` sorteia uma semente inédita evitando layouts parecidos com os já usados.',
    ],
    funcs: 'Worlds.allocate/save/load/rename/remove · snapshotGame · applyGame · rleEnc/rleDec · renderThumb · worldNameFromSeed',
    deps: '02_world, 12_player, 15f_transfer', used: '15e_worlds, 16_main',
  });

  doc.fileCard({
    name: 'src/15d_gamepad.js', lines: 204, tag: 'Controles', role: 'Suporte a controle', color: COL.ui,
    summary: 'Traduz o controle para o jogo: mira analógica com cursor virtual, navegação de menus e retículo na tela.',
    what: 'O analógico direito move um cursor virtual cuja distância do jogador define o alcance da mira; o esquerdo anda. Nos painéis, o controle emite os mesmos eventos de mouse que a interface já entende, então nenhum painel precisou ser reescrito. Se não houver controle (ou a API estiver bloqueada), o módulo fica inerte.',
    how: [
      '`padUpdate(dt)` é chamado a cada quadro pelo laço principal, em um `try/catch` próprio.',
      '`padCursor/padHover/padClick` reproduzem o comportamento do mouse sobre o DOM.',
    ],
    funcs: 'padUpdate · padStick · padCursor · padClick · padPanel · padPlay · drawPadReticle',
    deps: '12_player, 15_ui', used: '16_main',
  });

  doc.fileCard({
    name: 'src/15e_worlds.js', lines: 179, tag: 'Interface', role: 'Menu do título e tela “Meus Mundos”', color: COL.ui,
    summary: 'Monta o menu inicial, a lista de mundos com cartões, criar/abrir/sair, renomear, excluir e o selo de salvamento.',
    what: 'É a camada de apresentação do sistema de mundos. Mostra o cartão de cada mundo (nome, bioma, modo, tempo jogado, miniatura), permite renomear e excluir, e liga os botões “Nova Aventura”, “Modo Criativo” e “Meus Mundos”. Também cuida do autosave ao sair.',
    how: [
      'Não há campo de semente: o botão sorteia uma semente inédita e mostra a geração.',
      '`openWorlds` e `quitToMenu` alternam entre jogo e menu sem recarregar a página.',
    ],
    funcs: 'initWorldsUI · updateTitleMenu · renderWorlds · openWorlds · newWorld · openWorld · quitToMenu · showSaveBadge',
    deps: '15c_save, 15f_transfer', used: '16_main (initGame)',
  });

  doc.fileCard({
    name: 'src/15f_transfer.js', lines: 263, tag: 'Sistemas', role: 'Este aparelho, proteção e mapa em arquivo', color: COL.ui,
    summary: 'Gera um código de aparelho, pede armazenamento persistente ao navegador e exporta/importa mundos como arquivos `.json` com CRC-32.',
    what: 'O código do aparelho é aleatório e guardado localmente: serve para dizer de onde um mapa veio, sem usar IP (que o navegador esconde e que muda de rede para rede). A exportação monta um arquivo autocontido com verificação de integridade; a importação **não confia em nada** do arquivo: valida o CRC e reconstrói o mundo apenas com campos e valores permitidos.',
    how: [
      '`crc32` + `sanitizeSave` são a fronteira de segurança: um arquivo adulterado é rejeitado ou limpo.',
      '`Device.init()`/`Protect.autoAsk()` cuidam do código e do pedido de persistência.',
      '`buildWorldFile`/`parseWorldFile` convertem entre mundo e arquivo.',
    ],
    funcs: 'Device · Protect · crc32 · sanitizeSave · buildWorldFile · parseWorldFile · worldFileName · cleanSlot',
    deps: '15c_save', used: '15e_worlds, 15c_save',
  });

  doc.fileCard({
    name: 'src/15g_touch.js', lines: 80, tag: 'Controles', role: 'Controles de toque', color: COL.ui,
    summary: 'Direcional virtual, botão de ação com mira por arrasto, pulo, cura rápida, zoom e pausa para celular e tablet.',
    what: 'Imita o esquema de um jogo de plataforma mobile: o polegar esquerdo anda (e empurrar para cima pula), o direito ataca/minera e, ao arrastar, define a direção do golpe. Liga sozinho em telas de toque e pode ser forçado no menu de pausa.',
    how: [
      '`touchWanted` decide se o modo de toque entra em ação.',
      'Os botões emitem os mesmos eventos de teclado/mouse que o resto do jogo já escuta.',
    ],
    funcs: 'initTouch · touchUpdate · touchWanted · quickHeal · touchInteract',
    deps: '12_player, 15_ui', used: '16_main',
  });

  doc.fileCard({
    name: 'src/15h_ach.js', lines: 342, tag: 'Sistemas', role: 'Conquistas: 429, painel e perfil', color: COL.ui,
    summary: 'Registra as 429 conquistas, confere o progresso a cada 0,6 s, avisa quando algo é desbloqueado e desenha o painel com abas, raridades e barra de progresso.',
    what: 'Cada conquista é um objeto com id, categoria, raridade **e uma função `p()`** que devolve `[atual, meta]` — o progresso é sempre calculado a partir do estado do jogo (`G`, `G.P`, `G.flags`, contadores de `G.ach.st`), nunca de flags espalhadas pelo código. As 200 conquistas de espada e as 94 de chefe são **geradas** de `SWORDS` e `BXLIST`, então acompanham o catálogo sozinhas; as outras 135 são escritas à mão.',
    how: [
      '`achTick(dt)` roda dentro do `step`: mede distância percorrida (com guarda anti-teleporte), bioma, camada, profundidade máxima, tempo de jogo e a área dos cogumelos; a checagem completa roda a cada 0,6 s.',
      'O estado vive em `G.ach` (`un`, `seen`, `bio`, `lay`, `st`, `max`), é gravado no `localStorage` a cada 12 s quando muda e também vai dentro de cada mundo salvo.',
      '`achClean`/`achMerge` são a fronteira do arquivo importado: só ids, itens, biomas, camadas, NPCs e números que existem no jogo entram, com teto nos contadores; a união nunca deixa o perfil regredir.',
      '`achNotify` mostra o aviso dourado e toca o som; `achLabels` atualiza os dois botões (menu e pausa) e o contador.',
    ],
    funcs: 'ach() · achTick · achCheck · achNotify · achHTML · achRefresh · showAch · achClean · achMerge · achSave/achLoad · achSee/achStat/achMax · achKill/achBoss/achSummon',
    deps: '11_swords, 13c_bossx, 11c_gear_x, 15b_npc', used: '16_main, 15c_save, 15f_transfer, 12_player, 09_combat',
  });

  doc.fileCard({
    name: 'src/16_main.js', lines: 281, tag: 'Motor', role: 'Loop, render, input e câmera', color: COL.main,
    summary: 'O ponto de entrada do jogo: cria os canvas em camadas, trata teclado/mouse, roda o laço de quadro, desenha as cinco passadas e inicializa tudo.',
    what: 'É o único módulo que conhece o DOM do jogo diretamente e o único que dispara a simulação. Ele mantém quatro canvas (cena em baixa resolução, luz, céu e a vista final), aplica o zoom inteiro (1 px do mundo = N px de tela) e executa, a cada quadro, `padUpdate` → `touchUpdate` → `step` → `refreshHUD` → `render`. Também cuida da tela de carregamento (consumindo o gerador do mundo) e do fundo animado do menu.',
    how: [
      '`step(dt)` atualiza jogador, NPCs, inimigos, chefes, projéteis, drops, partículas, líquidos, spawn, autosave e câmera — nesta ordem.',
      '`render()` desenha céu, cena, luz, brilhos e sobreposições; tudo com `imageSmoothingEnabled = false` na ampliação.',
      'No fim, expõe ganchos (`window.__G`, `__step`, `__start`, `__SW`…) que os testes usam para dirigir o jogo.',
    ],
    funcs: 'initGame · frame · step · render · drawWorldTiles · applyZoom · setPause · startGame · finishLoad · mouseWorld',
    deps: 'todos os módulos anteriores', used: 'index.html',
  });
}

module.exports = { part3b };
