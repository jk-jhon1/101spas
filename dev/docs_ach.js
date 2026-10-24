// Gera docs/conquistas.md a partir das conquistas registradas no jogo (fonte única: src/15h_ach.js).
//   node dev/docs_ach.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(SRC).filter(f => /^\d+.*\.js$/.test(f)).sort();
const use = files.filter(f => !/^(1[4-9]|2\d)_/.test(f) && !/gamepad/.test(f));
let code = use.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { ACH_LIST, ACH_CATS, ACH_RAR, ACH, IT, SWORDS, BXLIST, GORES, GARMS, GACCS, GPICKS };`;
const ctx = {
  console, Math, Date, Uint8Array, Int16Array, Float32Array, Uint8ClampedArray, Set, Map, Array, Object, String, Number, JSON, isFinite,
  performance: { now: () => Date.now() }, document: { createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }) }, window: {}, ImageData: function () {},
};
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(code, ctx);
const A = ctx.__api, L = A.ACH_LIST;

const byCat = {}, byRar = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const o of L) { byCat[o.cat] = (byCat[o.cat] || 0) + 1; byRar[o.r]++; }
const pctOf = n => (n / L.length * 100).toFixed(1);

let md = `# Conquistas — ${L.length} no total\n\n`;
md += '> Gerado automaticamente a partir do jogo (`node dev/docs_ach.js`, fonte: `src/15h_ach.js`).\n';
md += '> As conquistas de **espada** e de **chefe** são criadas a partir das tabelas do próprio jogo (as 200 espadas e os 94 chefes),\n';
md += '> então elas nunca ficam dessincronizadas quando uma espada ou um chefe muda de nome.\n\n';
md += '## Como funciona\n\n';
md += '- **Onde ver:** botão **Conquistas** no menu principal e botão **Conquistas** na pausa (Esc). Os dois abrem o mesmo painel,\n';
md += '  com abas por categoria, barra de progresso, contador `x de total` e ordenação (em progresso → não iniciadas → concluídas).\n';
md += '- **Quando conta:** o jogo verifica o progresso a cada 0,6 s; a conquista aparece na hora com um aviso e um som.\n';
md += '- **Onde fica guardado:** no perfil do navegador (`localStorage`) **e** dentro de cada mundo salvo — o arquivo exportado leva\n';
md += '  as conquistas junto, e importar um mundo nunca faz o seu perfil regredir (a união é feita por conquista, contador e recorde).\n';
md += '- **Modo Criativo:** tudo conta normalmente (é um sandbox), e o Arsenal acelera a coleção. Nada é bloqueado por lá.\n';
md += '- **Arquivos adulterados:** ao importar um mundo, `achClean()` só aceita ids de conquista, itens, biomas, camadas, NPCs e números\n';
md += '  que existem no jogo, com teto nos contadores — o resto é descartado.\n\n';

md += '## Resumo\n\n| Categoria | Conquistas | Fatia |\n|---|---:|---:|\n';
for (const c of A.ACH_CATS) md += `| ${c.ic} ${c.n} | ${byCat[c.k] || 0} | ${pctOf(byCat[c.k] || 0)}% |\n`;
md += `| **Total** | **${L.length}** | 100% |\n\n`;
md += '| Raridade | Conquistas |\n|---|---:|\n';
for (const r of [1, 2, 3, 4]) md += `| ${A.ACH_RAR[r].n} | ${byRar[r]} |\n`;
md += '\n';

for (const c of A.ACH_CATS) {
  const list = L.filter(o => o.cat === c.k);
  md += `## ${c.ic} ${c.n} (${list.length})\n\n`;
  md += '| Conquista | Raridade | Como conseguir |\n|---|---|---|\n';
  for (const o of list) md += `| **${o.n}** | ${A.ACH_RAR[o.r].n} | ${String(o.d).replace(/\|/g, '\\|')} |\n`;
  md += '\n';
}

md += '## Itens de invocar NPC (exclusivos do Modo Criativo)\n\n';
md += '| Item | Invoca | Como usar |\n|---|---|---|\n';
for (const [id, type] of [['npc_guide', 'Guia'], ['npc_trader', 'Mercador'], ['npc_nurse', 'Enfermeira'], ['npc_smith', 'Armeiro']]) {
  const it = A.IT[id];
  md += `| **${it.n}** | ${type} | No **Modo Criativo**, use o item (clique direito) para chamar o NPC para o seu lado, sem precisar de casa válida. No modo Aventura o item não faz nada e **não é consumido**. |\n`;
}
md += '\nOs quatro aparecem no Arsenal (aba **Itens → Consumíveis e Invocações**) no Modo Criativo. Um NPC invocado fica parado perto de onde\n';
md += 'foi chamado, não exige quarto válido e é salvo junto com o mundo (inclusive no arquivo exportado).\n';

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'conquistas.md'), md);
console.log('docs/conquistas.md:', L.length, 'conquistas ·', Math.round(Buffer.byteLength(md) / 1024), 'KB');
