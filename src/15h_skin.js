/* ============================================================
   15h_skin: aparência da interface
   "azul" = painéis, abas, botões e barra de itens no estilo do Terraria mobile (padrão);
   "escura" = o visual escuro original. Só liga/desliga uma folha de estilo (<style id="skin-blue|skin-dark">),
   a escolha fica no aparelho (localStorage) e o botão está no menu de pausa.
   ============================================================ */
const UISKIN = { mode: 'blue' };
function skinApply(mode) {
  UISKIN.mode = mode === 'dark' ? 'dark' : 'blue';
  const b = document.getElementById('skin-blue'), d = document.getElementById('skin-dark');
  if (b) b.media = UISKIN.mode === 'blue' ? 'all' : 'not all';
  if (d) d.media = UISKIN.mode === 'dark' ? 'all' : 'not all';
  const btn = document.getElementById('p-skin'); if (btn) btn.textContent = 'Interface: ' + (UISKIN.mode === 'blue' ? 'azul (Terraria)' : 'escura');
}
function initSkin() {
  let m = 'blue'; try { const v = localStorage.getItem('espadas120_skin'); if (v === 'dark' || v === 'blue') m = v; } catch (e) { }
  skinApply(m);
  const btn = document.getElementById('p-skin');
  if (btn) btn.onclick = () => { skinApply(UISKIN.mode === 'blue' ? 'dark' : 'blue'); try { localStorage.setItem('espadas120_skin', UISKIN.mode); } catch (e) { } };
}
