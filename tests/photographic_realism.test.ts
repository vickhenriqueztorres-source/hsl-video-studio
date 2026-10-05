import assert from 'node:assert/strict';
import { formatCinematic35mmPrompt, assertPhotographicPrompt } from '../hsl/startframe/photographicPrompt';

// 1. In-scene smartphone screen with bank app notification
const phonePrompt = 'Plano detalhe fechado em 35mm da tela do smartphone repousado sobre a bancada de formica, exibindo notificacao de aplicativo bancario: PIX RECEBIDO: R$ 5.000,00 com luz suave emitida pelo visor.';
assertPhotographicPrompt(phonePrompt);
console.log('1. Phone screen with Pix text allowed: PASS');

// 2. POS payment terminal with LCD screen text
const terminalPrompt = 'Plano medio em 35mm de maquininha portatil de cartao com visor LCD verde exibindo APROXIME OU INSIRA e teclado numerico fosco.';
assertPhotographicPrompt(terminalPrompt);
console.log('2. POS terminal with LCD text allowed: PASS');

// 3. Thermal paper receipt with text
const receiptPrompt = 'Plano detalhe macro em 35mm de recibo de papel termico impresso com linhas de comprovante Pix, horario e valor autentico.';
assertPhotographicPrompt(receiptPrompt);
console.log('3. Thermal receipt with details allowed: PASS');

// 4. Standalone typography title card must still be rejected (belongs to Remotion composition)
assert.throws(() => assertPhotographicPrompt('Typography title card saying THERMAL CRISIS'), /PHOTOGRAPHIC_PROMPT_REQUIRED/);
console.log('4. Standalone title card rejected: PASS');

// 5. Floating HUD graphic card must still be rejected
assert.throws(() => assertPhotographicPrompt('Floating HUD graphic card with glowing stats'), /PHOTOGRAPHIC_PROMPT_REQUIRED/);
console.log('5. Floating HUD card rejected: PASS');

// 6. formatCinematic35mmPrompt test
const formatted = formatCinematic35mmPrompt('Smartphone on counter displaying bank app balance, monumental typography overlays');
assert.match(formatted, /Smartphone on counter displaying bank app balance/);
assert.doesNotMatch(formatted, /monumental typography overlays/);
// 7. In-scene monitor screen with typography description
const screenTypefacePrompt = 'Fotografia técnica em 50mm f/2.0 com profundidade de campo rasa em proporção 16:9. Enquadramento macro do painel de controle de segurança exibindo o status final do protocolo de proteção de conta: "PROTOCOLO DE RESPOSTA A INCIDENTE CONCLUÍDO". A tipografia nítida está disposta em linhas sóbrias sobre fundo carvão estruturado. Luz fria de tela refletindo suavemente nas bordas chanfradas do monitor.';
assertPhotographicPrompt(screenTypefacePrompt);
console.log('7. Screen text with typeface description allowed: PASS');

// 8. Physical printed document with typography description
const printedDocPrompt = 'Fotografia documental de estúdio sóbrio em 50mm f/2.4 em proporção 16:9. Painel tipográfico institucional analógico impresso em papel fosco de alta gramatura sobre mesa técnica cinza escuro, apresentando os três passos do protocolo de sobrevivência digital estruturados em três blocos limpos com tipografia grotesca nítida em tinta preta e carvão: "1. DESLIGAR A CHAMADA IMEDIATAMENTE".';
assertPhotographicPrompt(printedDocPrompt);
console.log('8. Printed document with typography description allowed: PASS');

console.log('\n>>> ALL 8 REALISM & PROMPT TESTS PASSED 100%! <<<');
