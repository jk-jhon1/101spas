/* ============================================================
   01_data: tiers, tiles (16x16), paredes, itens, receitas
   ============================================================ */
const TS = 16;                       // GDD: Tiles 16x16px
const STACK_MAX = 999;               // GDD: stacks até 999

// ---- TIERS DE RARIDADE (cores e multiplicadores exatos do GDD) ----
const TIERS = {
  0: { n: 'Comum', col: '#e5e7eb', mult: [1, 1], mech: '' },
  1: { n: 'Tier 1: Básico', col: '#10b981', mult: [1.0, 1.2], mech: 'Efeitos físicos diretos, sangramento, iluminação, alteração leve de alcance.' },
  2: { n: 'Tier 2: Pré-Bosses', col: '#0284c7', mult: [1.3, 1.8], mech: 'Projéteis retos simples, roubo de vida baixo, repulsão massiva, fogo/gelo.' },
  3: { n: 'Tier 3: Mid-Game', col: '#7c3aed', mult: [2.0, 2.8], mech: 'Projéteis múltiplos, feixes elementais, acerto contínuo, invocação de lâminas.' },
  4: { n: 'Tier 4: Hardmode Inicial', col: '#d97706', mult: [3.0, 4.2], mech: 'Ondas de choque no relevo, estalagmites, esporos flutuantes, aura gravitacional.' },
  5: { n: 'Tier 5: Hardmode Avançado', col: '#dc2626', mult: [4.5, 6.5], mech: 'Meteoros do céu, lasers perfurantes, manipulação de tempo/velocidade.' },
  6: { n: 'Tier 6: End-Game Mítico', col: '#4f46e5', mult: [7.0, 12.0], mech: 'Projéteis rastreadores, colapso estelar, portais de ataque, danos em tela cheia.' },
};
const TIER_GOLD = '#fbbf24';

// ---- TILES ----
const T = {}, TD = [];
function tile(k, o) {
  const id = TD.length; T[k] = id;
  const d = Object.assign({ id, k, n: k, s: 1, h: 0, t: .5, d: null, c: ['#888', '#666', '#aaa'], x: 'block', l: null, o: null }, o);
  if (d.o === null) d.o = d.s ? .27 : .075;
  TD.push(d); return id;
}
const L = (r, g, b, k) => [r * k, g * k, b * k];
// terreno
tile('air', { n: 'Ar', s: 0, t: 0, o: .075 });
tile('dirt', { n: 'Terra', t: .30, d: 'dirt', c: ['#8a5a34', '#6b4226', '#a8703f'], x: 'dirt' });
tile('grass', { n: 'Grama', t: .30, d: 'dirt', c: ['#8a5a34', '#6b4226', '#a8703f'], x: 'dirt', cap: ['#4cc24a', '#2f9a3a', '#7de06a'] });
tile('stone', { n: 'Pedra', h: 1, t: .55, d: 'stone', c: ['#7b8088', '#5a5e66', '#9aa0a8'], x: 'stone' });
tile('sand', { n: 'Areia', t: .25, d: 'sand', c: ['#e3c878', '#c9a85a', '#f3dc96'], x: 'sand', fall: 1 });
tile('sandstone', { n: 'Arenito', h: 1, t: .5, d: 'sandstone', c: ['#c9a25a', '#a88340', '#e0bb74'], x: 'sandstone' });
tile('snow', { n: 'Neve', t: .25, d: 'snow', c: ['#e8f1f8', '#c3d6e6', '#ffffff'], x: 'snow' });
tile('ice', { n: 'Gelo', h: 1, t: .45, d: 'ice', c: ['#9fd8f2', '#6fb4dc', '#d9f3ff'], x: 'ice' });
tile('mud', { n: 'Lama', t: .30, d: 'mud', c: ['#5b4136', '#3f2c25', '#76574a'], x: 'mud' });
tile('jgrass', { n: 'Grama da Selva', t: .30, d: 'mud', c: ['#5b4136', '#3f2c25', '#76574a'], x: 'mud', cap: ['#2fae3a', '#1c7f2e', '#6ee05a'] });
tile('ash', { n: 'Cinzas', h: 1, t: .45, d: 'ash', c: ['#46434d', '#2c2a33', '#62606c'], x: 'ash' });
tile('obsidian', { n: 'Obsidiana', h: 3, t: 1.6, d: 'obsidian', c: ['#2b2140', '#150f24', '#5d4a8a'], x: 'obsidian' });
tile('cloud', { n: 'Nuvem', t: .2, d: 'cloud', c: ['#f4f8ff', '#cfdcf0', '#ffffff'], x: 'cloud', o: .12 });
// minérios (h = poder de picareta exigido)
const ORE = (k, n, drop, h, t, ore, light) => tile(k, { n, h, t, d: drop, c: ['#7b8088', '#5a5e66', ore], x: 'ore', ore, l: light || null });
ORE('copper', 'Minério de Cobre', 'copper_ore', 1, .7, '#d9772f');
ORE('iron', 'Minério de Ferro', 'iron_ore', 1, .8, '#c9b8a8');
ORE('coal', 'Carvão', 'coal', 1, .6, '#26262c');
ORE('quartz', 'Cristal de Quartzo', 'quartz', 1, .8, '#eef2ff', L(.8, .9, 1, .25));
ORE('silver', 'Minério de Prata', 'silver_ore', 2, 1.0, '#dfe8f2');
ORE('gold', 'Minério de Ouro', 'gold_ore', 2, 1.1, '#f6c93a');
ORE('bronzite', 'Bronzite', 'bronzite_ore', 2, 1.2, '#b8793a');
ORE('amber', 'Âmbar', 'amber', 1, .9, '#ffb81c', L(1, .7, .1, .25));
ORE('frostcrystal', 'Cristal Gélido', 'frost_shard', 2, 1.0, '#8be4ff', L(.5, .8, 1, .38));
ORE('ruby', 'Rubi', 'ruby', 2, 1.0, '#ef2e55', L(.9, .1, .2, .35));
ORE('emerald', 'Esmeralda', 'emerald', 2, 1.0, '#22d36f', L(.1, .9, .3, .35));
ORE('topaz', 'Topázio', 'topaz', 2, 1.0, '#ffc21a', L(.95, .7, .1, .35));
ORE('sapphire', 'Safira', 'sapphire', 2, 1.0, '#3b82f6', L(.2, .4, 1, .38));
ORE('amethyst', 'Ametista', 'amethyst', 2, 1.0, '#b05cf0', L(.6, .2, .9, .35));
ORE('platinum', 'Minério de Platina', 'platinum_ore', 3, 1.4, '#cfe9f7');
ORE('meteorite', 'Meteorito', 'meteor_ore', 3, 1.5, '#9a5a44', L(.7, .25, .1, .42));
ORE('hellstone', 'Brasita Infernal', 'hell_ore', 4, 1.8, '#ff5a1f', L(1, .35, .1, .55));
ORE('cobalt', 'Minério de Cobalto', 'cobalt_ore', 5, 2.0, '#2f6fdb', L(.2, .4, 1, .2));
ORE('palladium', 'Minério de Paládio', 'palladium_ore', 5, 2.0, '#e8a864', L(.9, .6, .3, .18));
ORE('mithril', 'Minério de Mithril', 'mithril_ore', 6, 2.4, '#5eead4', L(.3, 1, .8, .28));
ORE('orichalcum', 'Minério de Orichalcum', 'orichalcum_ore', 6, 2.4, '#fb7185', L(1, .4, .5, .28));
ORE('titanium', 'Minério de Titânio', 'titanium_ore', 7, 3.0, '#d3dcf0', L(.8, .85, 1, .28));
ORE('adamantite', 'Minério de Adamantita', 'adamantite_ore', 7, 3.0, '#e8203f', L(1, .2, .3, .32));
// plantas / decoração
tile('trunk', { n: 'Tronco', s: 0, t: .5, d: 'wood', c: ['#7a4e2a', '#563519', '#9a6a3a'], x: 'trunk', o: .05, tree: 1 });
tile('leaf', { n: 'Folhas', s: 0, t: .15, d: null, c: ['#2f9a3a', '#1f7a2e', '#5fd05a'], x: 'leaf', o: .16, tree: 1 });
tile('leafsnow', { n: 'Pinheiro Nevado', s: 0, t: .15, d: null, c: ['#2b7a55', '#1b5a40', '#e4f2f2'], x: 'leaf', o: .16, tree: 1 });
tile('leafjungle', { n: 'Folhas da Selva', s: 0, t: .15, d: null, c: ['#1c8a34', '#0f6a26', '#52d060'], x: 'leaf', o: .18, tree: 1 });
tile('leafpalm', { n: 'Palmeira', s: 0, t: .15, d: null, c: ['#3aae48', '#23823a', '#86e060'], x: 'leaf', o: .1, tree: 1 });
tile('cactus', { n: 'Cacto', s: 0, t: .4, d: 'cactus', c: ['#3f9d4a', '#27703a', '#6fd070'], x: 'cactus', o: .06, plant: 1, hurt: 9 });
tile('mushroom', { n: 'Cogumelo Luminoso', s: 0, t: .05, d: 'glow_mushroom', c: ['#2a7de0', '#1a4fa0', '#8be0ff'], x: 'mushroom', o: .04, plant: 1, l: L(.25, .5, 1, .7) });
tile('thornbush', { n: 'Espinheiro', s: 0, t: .2, d: 'thorn', c: ['#5a3a6a', '#3a2248', '#9a6ac0'], x: 'thorn', o: .05, plant: 1, hurt: 14 });
tile('tallgrass', { n: 'Capim', s: 0, t: .02, d: null, c: ['#3fae3f', '#2a8a34', '#7de06a'], x: 'tallgrass', o: .02, plant: 1 });
tile('flower', { n: 'Flor', s: 0, t: .02, d: null, c: ['#3fae3f', '#2a8a34', '#ff6b9a'], x: 'flower', o: .02, plant: 1 });
// construção
tile('plank', { n: 'Tábua de Madeira', t: .4, d: 'plank', c: ['#b07a40', '#8a5c2c', '#d09a58'], x: 'plank' });
tile('brick', { n: 'Tijolo de Pedra', h: 1, t: .6, d: 'stonebrick', c: ['#8a8e96', '#5e626a', '#b0b4bc'], x: 'brick' });
tile('glass', { n: 'Vidro', t: .2, d: 'glass', c: ['#bfe8f5', '#8fc8dc', '#ffffff'], x: 'glass', o: .07 });
tile('torch', { n: 'Tocha', s: 0, t: .02, d: 'torch', c: ['#8a5a2a', '#5a3a1a', '#ffb347'], x: 'torch', o: .03, l: [1, .78, .45], obj0: 1 });
tile('bench', { n: 'Bancada de Trabalho', s: 0, t: .3, d: 'bench', c: ['#b07a40', '#8a5c2c', '#d09a58'], x: 'bench', o: .05, obj: 1, st: 'bench' });
tile('furnace', { n: 'Fornalha', s: 0, t: .4, d: 'furnace', c: ['#7b8088', '#4a4e56', '#ff8a2a'], x: 'furnace', o: .06, obj: 1, st: 'furnace', l: L(1, .5, .2, .55) });
tile('anvil', { n: 'Bigorna', s: 0, t: .5, d: 'anvil', c: ['#6a7078', '#3a3e46', '#a0a8b4'], x: 'anvil', o: .05, obj: 1, st: 'anvil' });
tile('advanvil', { n: 'Bigorna Avançada', s: 0, t: .8, d: 'advanvil', c: ['#4a8a8a', '#2a5a5a', '#8af0e0'], x: 'anvil', o: .05, obj: 1, st: 'advanvil', l: L(.3, 1, .8, .2) });
tile('forge', { n: 'Forja Celeste', s: 0, t: 1.2, d: 'forge', c: ['#4a3a9a', '#2a1f6a', '#fbbf24'], x: 'forge', o: .05, obj: 1, st: 'forge', l: L(1, .75, .3, .6) });
tile('chest', { n: 'Baú', s: 0, t: .4, d: 'chest', c: ['#a8703a', '#6a4220', '#f0c060'], x: 'chest', o: .05, obj: 1, chest: 1 });
tile('lifecrystal', { n: 'Cristal de Vida', s: 0, t: .6, d: 'life_crystal', c: ['#ff4f8a', '#b01a50', '#ffc0d8'], x: 'lifecrystal', o: .05, obj: 1, l: L(1, .35, .5, .7) });
tile('doorC', { n: 'Porta', s: 1, t: .3, d: 'door', c: ['#a8703a', '#6a4220', '#d09a58'], x: 'door', o: .3, door: 1 });
tile('doorO', { n: 'Porta Aberta', s: 0, t: .3, d: 'door', c: ['#a8703a', '#6a4220', '#d09a58'], x: 'dooro', o: .05, door: 1 });
tile('table', { n: 'Mesa', s: 0, t: .3, d: 'table', c: ['#b07a40', '#8a5c2c', '#d09a58'], x: 'table', o: .05, obj: 1, hs: 'table' });
tile('chair', { n: 'Cadeira', s: 0, t: .3, d: 'chair', c: ['#b07a40', '#8a5c2c', '#d09a58'], x: 'chair', o: .05, obj: 1, hs: 'chair' });
tile('bedrock', { n: 'Abismo', h: 99, t: 99, d: null, c: ['#1a1620', '#0c0a10', '#2a2433'], x: 'bedrock', unb: 1 });

// ---- PAREDES (camada de fundo) ----
const WALL = { none: 0, dirt: 1, stone: 2, plank: 3, brick: 4, sandstone: 5, ice: 6, mud: 7, hell: 8, glass: 9 };
const WD = [
  null,
  { n: 'Parede de Terra', c: ['#5a3d24', '#463019'], d: 'wall_dirt' },
  { n: 'Parede de Pedra', c: ['#4a4d55', '#3a3d44'], d: 'wall_stone' },
  { n: 'Parede de Madeira', c: ['#8a5c2c', '#6a4620'], d: 'wall_plank', x: 'plank' },
  { n: 'Parede de Tijolo', c: ['#585c64', '#3e4249'], d: 'wall_brick', x: 'brick' },
  { n: 'Parede de Arenito', c: ['#9a7a42', '#7c6030'], d: null },
  { n: 'Parede de Gelo', c: ['#5a8aa8', '#46708c'], d: null },
  { n: 'Parede de Lama', c: ['#3c2b24', '#2e211b'], d: null },
  { n: 'Parede Infernal', c: ['#3a1a1c', '#2a1214'], d: null },
  { n: 'Parede de Vidro', c: ['#7fb0c0', '#6a98a8'], d: 'wall_glass' },
];

// ---- ITENS ----
const IT = {};
function item(id, n, o) { IT[id] = Object.assign({ id, n, type: 'mat', tier: 0, stack: STACK_MAX }, o); return IT[id]; }
const tileItem = (id, n, tk, o) => item(id, n, Object.assign({ type: 'block', tile: T[tk], ic: ['tile', T[tk]], desc: 'Bloco colocável.' }, o));
// blocos
tileItem('dirt', 'Terra', 'dirt'); tileItem('stone', 'Pedra', 'stone'); tileItem('sand', 'Areia', 'sand', { desc: 'Bloco colocável. Cai se não houver apoio (gravidade).' });
tileItem('sandstone', 'Arenito', 'sandstone'); tileItem('snow', 'Bloco de Neve', 'snow'); tileItem('ice', 'Bloco de Gelo', 'ice');
tileItem('mud', 'Lama', 'mud'); tileItem('ash', 'Cinzas', 'ash'); tileItem('obsidian', 'Obsidiana', 'obsidian', { tier: 2, desc: 'Forma-se quando água encontra lava. Bloco colocável.' });
tileItem('cloud', 'Nuvem', 'cloud');
tileItem('plank', 'Tábua de Madeira', 'plank'); tileItem('stonebrick', 'Tijolo de Pedra', 'brick'); tileItem('glass', 'Vidro', 'glass');
tileItem('torch', 'Tocha', 'torch', { desc: 'Ilumina o ambiente (propagação de luz).' });
tileItem('bench', 'Bancada de Trabalho', 'bench', { desc: 'Estação de criação básica.' });
tileItem('furnace', 'Fornalha', 'furnace', { desc: 'Funde minérios em barras.' });
tileItem('anvil', 'Bigorna', 'anvil', { tier: 1, desc: 'Estação: espadas, ferramentas e armaduras dos Tiers 1–2.' });
tileItem('advanvil', 'Bigorna Avançada', 'advanvil', { tier: 3, desc: 'Estação: itens dos Tiers 3–4.' });
tileItem('forge', 'Forja Celeste', 'forge', { tier: 5, desc: 'Estação: itens dos Tiers 5–6.' });
tileItem('chest', 'Baú', 'chest', { desc: 'Guarda itens. Botão direito para abrir.' });
tileItem('door', 'Porta', 'doorC', { desc: 'Botão direito abre/fecha. Cômodos fechados atraem NPCs.' });
tileItem('table', 'Mesa', 'table', { desc: 'Mobília (necessária para moradia de NPC).' });
tileItem('chair', 'Cadeira', 'chair', { desc: 'Mobília (necessária para moradia de NPC).' });
const wallItem = (id, n, wk) => item(id, n, { type: 'wall', wall: WALL[wk], ic: ['wall', WALL[wk]], desc: 'Parede de fundo colocável.' });
wallItem('wall_dirt', 'Parede de Terra', 'dirt'); wallItem('wall_stone', 'Parede de Pedra', 'stone'); wallItem('wall_plank', 'Parede de Madeira', 'plank');
wallItem('wall_brick', 'Parede de Tijolo', 'brick'); wallItem('wall_glass', 'Parede de Vidro', 'glass');
// materiais naturais
item('wood', 'Madeira', { ic: ['wood'], desc: 'Obtida cortando árvores com a picareta.' });
item('gel', 'Gosma', { ic: ['blob', '#6ee7a0'], desc: 'Cai de slimes.' });
item('bone', 'Osso', { ic: ['bone'], desc: 'Cai de zumbis e esqueletos.' });
item('feather', 'Pena', { ic: ['feather'], desc: 'Cai de harpias (ilhas do céu).' });
item('shark_tooth', 'Dente de Tubarão', { ic: ['tooth', '#eaf2f8'], desc: 'Cai de tubarões (oceano).' });
item('beetle_claw', 'Garra de Besouro', { ic: ['claw', '#5a7a3a'], desc: 'Cai de besouros (cavernas e deserto subterrâneo).' });
item('lens', 'Lente Demoníaca', { ic: ['lens'], desc: 'Cai de Olhos Demoníacos (à noite).' });
item('stinger', 'Ferrão', { tier: 2, ic: ['stinger'], desc: 'Cai de vespas (selva).' });
item('vamp_tooth', 'Presa Vampírica', { tier: 2, ic: ['fang'], desc: 'Cai de morcegos das cavernas.' });
item('spore', 'Esporo', { tier: 3, ic: ['spore', '#7dd3fc'], desc: 'Cai de cogumelos ambulantes.' });
item('thorn', 'Espinho da Selva', { ic: ['thorn'], desc: 'Colhido de espinheiros da selva.' });
item('cactus', 'Cacto', { ic: ['cactus'], desc: 'Colhido de cactos do deserto.' });
item('glow_mushroom', 'Cogumelo Luminoso', { ic: ['mush'], desc: 'Cresce em cavernas profundas e no bioma de cogumelos.' });
item('coal', 'Carvão', { ic: ['coal'], desc: 'Minerado nas cavernas.' });
item('quartz', 'Quartzo', { ic: ['gem', '#eef2ff'], desc: 'Cristal minerado nas cavernas.' });
item('amber', 'Âmbar', { ic: ['gem', '#ffb81c'], desc: 'Minerado no deserto subterrâneo.' });
item('frost_shard', 'Fragmento Gélido', { tier: 2, ic: ['shard', '#8be4ff'], desc: 'Minerado de cristais gélidos (bioma de neve).' });
[['ruby', 'Rubi', '#ef2e55'], ['emerald', 'Esmeralda', '#22d36f'], ['topaz', 'Topázio', '#ffc21a'], ['sapphire', 'Safira', '#3b82f6'], ['amethyst', 'Ametista', '#b05cf0']]
  .forEach(([id, n, c]) => item(id, n, { tier: 2, ic: ['gem', c], desc: 'Gema minerada nas cavernas.' }));
// minérios (itens)
const MET = {
  copper: ['Cobre', '#d9772f', 1], iron: ['Ferro', '#c9b8a8', 1], silver: ['Prata', '#dfe8f2', 1], gold: ['Ouro', '#f6c93a', 1], bronzite: ['Bronzite', '#b8793a', 1],
  platinum: ['Platina', '#cfe9f7', 2], meteor: ['Meteorito', '#9a5a44', 2], hell: ['Infernal', '#ff5a1f', 2],
  cobalt: ['Cobalto', '#2f6fdb', 3], palladium: ['Paládio', '#e8a864', 3], mithril: ['Mithril', '#5eead4', 3], orichalcum: ['Orichalcum', '#fb7185', 3],
  titanium: ['Titânio', '#d3dcf0', 4], adamantite: ['Adamantita', '#e8203f', 4], celestial: ['Celeste', '#a5b4fc', 5],
};
for (const k in MET) {
  const [n, c, t] = MET[k];
  if (k !== 'celestial') item(k + '_ore', 'Minério de ' + n, { tier: t, ic: ['chunk', c], desc: 'Funda na Fornalha (3 minérios = 1 barra).' });
  item(k + '_bar', 'Barra de ' + n, { tier: t, ic: ['bar', c], desc: 'Material de criação.' });
}
item('celestial_frag', 'Fragmento Celeste', { tier: 5, ic: ['frag', '#a5b4fc'], desc: 'Cai de inimigos de elite do Hardmode e de chefes.' });
item('mythic_core', 'Núcleo Mítico', { tier: 6, ic: ['core', '#fbbf24'], desc: 'Dropado pelo Colosso Estelar.' });
// essências elementais (T3+)
const ESS = {
  e_fire: ['Essência de Fogo', '#ff7a1a'], e_ice: ['Essência de Gelo', '#7dd3fc'], e_lightning: ['Essência de Raio', '#fde047'],
  e_shadow: ['Essência de Sombra', '#8b5cf6'], e_poison: ['Essência de Veneno', '#84cc16'], e_light: ['Essência de Luz', '#fef08a'],
  e_earth: ['Essência de Terra', '#b4783a'], e_water: ['Essência de Água', '#38bdf8'], e_blood: ['Essência de Sangue', '#ef4444'], e_time: ['Essência do Tempo', '#fbbf24'],
};
for (const k in ESS) item(k, ESS[k][0], { tier: 3, ic: ['orb', ESS[k][1]], desc: 'Cai de inimigos elementais do Hardmode.' });
// moeda, consumíveis
item('coin', 'Moeda de Ouro', { ic: ['coin'], desc: 'Moeda do mundo. Inimigos derrotados dropam moedas.' });
item('life_crystal', 'Cristal de Vida', { type: 'use', tier: 2, ic: ['crystal', '#ff4f8a'], use: 'life', desc: 'Consumível: +20 de vida máxima (até 400).' });
item('potion1', 'Poção de Cura', { type: 'use', tier: 1, ic: ['potion', '#ef4444'], use: 'heal', heal: 70, desc: 'Cura 70 de vida. Recarga de 30s.' });
item('potion2', 'Poção de Cura Maior', { type: 'use', tier: 3, ic: ['potion', '#f97316'], use: 'heal', heal: 180, desc: 'Cura 180 de vida. Recarga de 30s.' });
item('potion3', 'Poção de Cura Suprema', { type: 'use', tier: 5, ic: ['potion', '#e879f9'], use: 'heal', heal: 400, desc: 'Cura 400 de vida. Recarga de 30s.' });
item('summon_slime', 'Coroa de Gosma', { type: 'use', tier: 1, stack: 20, ic: ['summon', 'slime', '#4ade80'], use: 'boss_slime', desc: 'Invoca o Rei Slime.' });
item('summon_eye', 'Lente Suspeita', { type: 'use', tier: 2, stack: 20, ic: ['summon', 'eye', '#f87171'], use: 'boss_eye', desc: 'Invoca o Olho Colossal (somente à noite).' });
item('summon_guardian', 'Boneco Infernal', { type: 'use', tier: 2, stack: 20, ic: ['summon', 'imp', '#fb923c'], use: 'boss_guardian', desc: 'Invoca o Guardião do Abismo (somente no Inferno). Derrotá-lo inicia o Hardmode.' });
item('summon_colossus', 'Coração Estelar', { type: 'use', tier: 5, stack: 20, ic: ['summon', 'star', '#fbbf24'], use: 'boss_colossus', desc: 'Invoca o Colosso Estelar (chefe final).' });
// picaretas: pow = poder, spd = velocidade de mineração
const PICKS = [
  ['pick_copper', 'Picareta de Cobre', 1, 1.0, '#d9772f', 1], ['pick_iron', 'Picareta de Ferro', 2, 1.35, '#c9b8a8', 1], ['pick_gold', 'Picareta de Ouro', 3, 1.7, '#f6c93a', 1],
  ['pick_meteor', 'Picareta de Meteorito', 4, 2.0, '#9a5a44', 2], ['pick_hell', 'Picareta Infernal', 5, 2.4, '#ff5a1f', 2], ['pick_cobalt', 'Picareta de Cobalto', 6, 3.0, '#2f6fdb', 3],
  ['pick_mithril', 'Picareta de Mithril', 7, 3.8, '#5eead4', 3], ['pick_titanium', 'Picareta de Titânio', 8, 5.0, '#d3dcf0', 4], ['pick_celestial', 'Picareta Celeste', 9, 7.0, '#a5b4fc', 5],
];
PICKS.forEach(([id, n, pw, spd, c, t]) => item(id, n, { type: 'pick', tier: t, stack: 1, pow: pw, spd, ic: ['pick', c], desc: 'Mineração: poder ' + pw + ' · velocidade ' + spd.toFixed(2) + 'x' }));
// armaduras (slot único) e acessórios
const ARMORS = [
  ['arm_copper', 'Armadura de Cobre', 2, '#d9772f', 1], ['arm_iron', 'Armadura de Ferro', 4, '#c9b8a8', 1], ['arm_gold', 'Armadura de Ouro', 7, '#f6c93a', 1],
  ['arm_platinum', 'Armadura de Platina', 9, '#cfe9f7', 2], ['arm_meteor', 'Armadura de Meteorito', 12, '#9a5a44', 2], ['arm_hell', 'Armadura Infernal', 16, '#ff5a1f', 2],
  ['arm_cobalt', 'Armadura de Cobalto', 22, '#2f6fdb', 3], ['arm_mithril', 'Armadura de Mithril', 30, '#5eead4', 3], ['arm_titanium', 'Armadura de Titânio', 40, '#d3dcf0', 4], ['arm_celestial', 'Armadura Celeste', 55, '#a5b4fc', 5],
];
ARMORS.forEach(([id, n, def, c, t]) => item(id, n, { type: 'armor', tier: t, stack: 1, def, color: c, ic: ['armor', c], desc: 'Armadura: +' + def + ' de defesa.' }));
const ACCS = [
  ['acc_glove', 'Luva do Guerreiro', 1, { dmg: 3 }, '+3 de dano (ModAcessórios)', '#b8793a'],
  ['acc_boots', 'Botas Velozes', 1, { spd: .15 }, '+15% de velocidade de movimento', '#6ee7a0'],
  ['acc_ring', 'Anel do Crítico', 2, { crit: .08, cm: .25 }, '+8% de chance crítica, +25% de multiplicador crítico', '#ef2e55'],
  ['acc_fang', 'Amuleto Vampírico', 2, { steal: .02 }, 'Roubo de vida de 2% do dano causado', '#b91c1c'],
  ['acc_shield', 'Escudo de Ferro', 2, { def: 4, kbr: .3 }, '+4 de defesa e 30% de resistência a repulsão', '#aeb4be'],
  ['acc_gauntlet', 'Manopla Titânica', 3, { dmg: 12 }, '+12 de dano (ModAcessórios)', '#2f6fdb'],
  ['acc_heart', 'Coração Eterno', 3, { hp: 60 }, '+60 de vida máxima', '#fb7185'],
  ['acc_eye', 'Olho Sagaz', 4, { crit: .12, dmg: 20 }, '+12% crítico e +20 de dano', '#d97706'],
  ['acc_star', 'Estrela do Guerreiro', 5, { dmg: 45, spd: .1 }, '+45 de dano e +10% de velocidade', '#dc2626'],
  ['acc_crown', 'Coroa Mítica', 6, { dmg: 80, crit: .1, cm: .5 }, '+80 de dano, +10% crítico, +50% mult. crítico', '#fbbf24'],
];
ACCS.forEach(([id, n, t, st, d, c]) => item(id, n, { type: 'acc', tier: t, stack: 1, acc: st, ic: ['acc', id, c], desc: d }));

// ---- RECEITAS ----
const RECIPES = [];
function rec(out, n, ing, st) {
  const o = {}; ing.split(',').forEach(p => { const [k, q] = p.split(':'); o[k] = +q; });
  RECIPES.push({ out, n, ing: o, st: st || null });
}
rec('bench', 1, 'wood:10'); rec('torch', 3, 'wood:1,gel:1');
rec('plank', 2, 'wood:1', 'bench'); rec('stonebrick', 1, 'stone:2', 'bench');
rec('wall_plank', 4, 'plank:1', 'bench'); rec('wall_stone', 4, 'stone:1', 'bench'); rec('wall_brick', 4, 'stonebrick:1', 'bench'); rec('wall_dirt', 4, 'dirt:1', 'bench');
rec('door', 1, 'plank:6', 'bench'); rec('table', 1, 'plank:8', 'bench'); rec('chair', 1, 'plank:4', 'bench');
rec('chest', 1, 'plank:8,iron_bar:2', 'bench'); rec('furnace', 1, 'stone:20,wood:4,torch:3', 'bench'); rec('anvil', 1, 'iron_bar:5', 'bench');
rec('glass', 1, 'sand:2', 'furnace'); rec('wall_glass', 4, 'glass:1', 'bench');
['copper', 'iron', 'silver', 'gold', 'bronzite', 'platinum', 'meteor', 'hell', 'cobalt', 'palladium', 'mithril', 'orichalcum', 'titanium', 'adamantite']
  .forEach(k => rec(k + '_bar', 1, k + '_ore:3', 'furnace'));
rec('advanvil', 1, 'mithril_bar:8', 'anvil'); rec('advanvil', 1, 'orichalcum_bar:8', 'anvil');
rec('forge', 1, 'titanium_bar:8,adamantite_bar:8', 'advanvil');
rec('celestial_bar', 1, 'celestial_frag:3', 'forge');
rec('potion1', 2, 'gel:4,glow_mushroom:1', 'bench'); rec('potion2', 2, 'gel:12,spore:3,e_blood:1', 'bench'); rec('potion3', 2, 'spore:10,e_blood:3,e_light:2', 'advanvil');
rec('summon_slime', 1, 'gel:30', 'bench'); rec('summon_eye', 1, 'lens:6', 'bench');
rec('summon_guardian', 1, 'hell_bar:4,obsidian:8,bone:10', 'anvil');
rec('summon_colossus', 1, 'celestial_bar:6,e_time:6,e_light:6,e_shadow:6', 'forge');
rec('pick_copper', 1, 'copper_bar:8,wood:4', 'bench'); rec('pick_iron', 1, 'iron_bar:10,wood:4', 'anvil'); rec('pick_gold', 1, 'gold_bar:12,wood:4', 'anvil');
rec('pick_meteor', 1, 'meteor_bar:14,wood:4', 'anvil'); rec('pick_hell', 1, 'hell_bar:14,obsidian:6', 'anvil'); rec('pick_cobalt', 1, 'cobalt_bar:14', 'anvil');
rec('pick_cobalt', 1, 'palladium_bar:14', 'anvil');
rec('pick_mithril', 1, 'mithril_bar:14', 'advanvil'); rec('pick_mithril', 1, 'orichalcum_bar:14', 'advanvil');
rec('pick_titanium', 1, 'titanium_bar:14', 'advanvil'); rec('pick_titanium', 1, 'adamantite_bar:14', 'advanvil');
rec('pick_celestial', 1, 'celestial_bar:12', 'forge');
rec('arm_copper', 1, 'copper_bar:20', 'anvil'); rec('arm_iron', 1, 'iron_bar:24', 'anvil'); rec('arm_gold', 1, 'gold_bar:24', 'anvil');
rec('arm_platinum', 1, 'platinum_bar:24', 'anvil'); rec('arm_meteor', 1, 'meteor_bar:26', 'anvil'); rec('arm_hell', 1, 'hell_bar:26,obsidian:10', 'anvil');
rec('arm_cobalt', 1, 'cobalt_bar:26', 'advanvil'); rec('arm_mithril', 1, 'mithril_bar:28', 'advanvil'); rec('arm_titanium', 1, 'titanium_bar:30', 'advanvil');
rec('arm_celestial', 1, 'celestial_bar:24', 'forge');
rec('acc_glove', 1, 'iron_bar:8,gel:10', 'anvil'); rec('acc_boots', 1, 'feather:6,iron_bar:4', 'anvil');
rec('acc_ring', 1, 'gold_bar:6,ruby:4', 'anvil'); rec('acc_fang', 1, 'vamp_tooth:10,platinum_bar:4', 'anvil'); rec('acc_shield', 1, 'iron_bar:20,platinum_bar:4', 'anvil');
rec('acc_gauntlet', 1, 'cobalt_bar:8,e_earth:4', 'advanvil'); rec('acc_heart', 1, 'orichalcum_bar:6,e_blood:6', 'advanvil');
rec('acc_eye', 1, 'titanium_bar:8,lens:10,e_light:6', 'advanvil'); rec('acc_star', 1, 'celestial_bar:6,e_time:4', 'forge');
rec('acc_crown', 1, 'mythic_core:1,celestial_bar:8', 'forge');

// estações que cada bloco-estação satisfaz
const STATION_SAT = {
  bench: ['bench'], furnace: ['furnace'], anvil: ['anvil'], advanvil: ['anvil', 'advanvil'], forge: ['anvil', 'advanvil', 'forge'],
};
const STATION_NAME = { bench: 'Bancada', furnace: 'Fornalha', anvil: 'Bigorna', advanvil: 'Bigorna Avançada', forge: 'Forja Celeste' };
