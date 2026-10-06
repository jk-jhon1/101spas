'use strict';
// Gamepad simulado (Gamepad API), injetado antes do jogo carregar. Usado por test_gamepad.js e shots_gamepad.js.
//   MOCK    : cria window.__pad e navigator.getGamepads(); __setPad({botão: true}, [eixos]) aperta botões / move os analógicos
//   BLOCKED : simula a API bloqueada (SecurityError), como em iframes de origem cruzada
const MOCK = (() => {
  const mk = () => ({ pressed: false, touched: false, value: 0 });
  window.__pad = { id: 'Mock Pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, mk), axes: [0, 0, 0, 0] };
  window.__padOn = true;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => window.__padOn ? [window.__pad, null, null, null] : [null, null, null, null] });
  window.__setPad = (btn, axes) => { const p = window.__pad; if (btn) for (const k in btn) { p.buttons[+k].pressed = !!btn[k]; p.buttons[+k].value = btn[k] ? 1 : 0; } if (axes) p.axes = axes.slice(); };
});

const BLOCKED = () => {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => { throw new DOMException('disallowed by permissions policy', 'SecurityError'); } });
};

module.exports = { MOCK, BLOCKED };
