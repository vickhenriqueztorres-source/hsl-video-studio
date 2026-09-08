# Teste real pelo Matrix CLI — 2026-09-03

Execução: `npm.cmd run hsl:matrix`, em PowerShell interativo, na raiz do projeto.
Thread: `HSL_TEST_3MIN_20260903@v2`.
Plano: 180 segundos, 5.400 frames a 30 fps, 29 beats, 7 beats Kling e 9 takes previstos.
Storage: Drive; prune: dry-run. Não publicar nem apagar o acervo.

## Caminho exercitado

- Menu 9: ambiente reconheceu Codex CLI autenticado, configuração Drive, agente Kling e FFmpeg.
- Menu 4: leu o checkpoint SQLite do teste.
- Menu 3: retomou o teste e executou geração nativa via processo `codex exec`.
- Cadeia observada: `graph/console/cli.ts` → `graph/production/cli.ts resume` → `codex exec`.
- Nenhuma imagem foi gerada pela ferramenta desta conversa, nem foi necessário clicar na UI para executar nós.
- A preparação inicial do plano foi feita pela CLI direta antes da solicitação de testar o menu. A continuação passou ao Matrix, preservando as imagens concluídas. Isso ainda não comprova uma criação completa pela opção 1.
- Uma segunda sessão Matrix tentou retomar o mesmo episódio: o lock recusou a produção duplicada e o menu permaneceu aberto após o erro.

## Correções

1. Render real respeita `scenePlan.totalFrames`: três minutos produzem intervalos 0–4499 e 4500–5399. Legacy mantém os quatro intervalos originais; canário mantém 300 frames.
2. Chunks ausentes ou cujo intervalo mudou não são aceitos apenas pelo índice do checkpoint.
3. Falha do revisor de prompts deixa de atribuir score 100. Reprovação persistente após duas rodadas bloqueia a geração.
4. Matrix permanece aberto após erro de um comando interativo.
5. Matrix habilita progresso por nó e por imagem nos processos filhos, para não parecer travado durante uma operação longa.
6. O prompt do worker omite parâmetros de referências em imagens novas; permite uma única correção de argumentos quando a ferramenta rejeita antes de iniciar geração.
7. Revisão dividida em lotes de até três cenas alvo, oito anexos e 24 MiB. Todas as referências explícitas de continuidade são preservadas; recibos identificados pelo hash das imagens, prompts, referências e template evitam repetir lotes concluídos.
8. Um processo encerrado com código de erro sem stderr não é mais descrito incorretamente como timeout.

## Validação já realizada

- TypeScript sem erros.
- Suíte de produção: paridade de fluxo legacy, checkpoints, interrupção do processo/retomada, gates, confinamento e argumentos Windows passaram.
- Suíte Fase 2: passou, incluindo os novos casos de revisão indisponível/reprovada bloqueando imagens e Kling e os intervalos do teste de três minutos.
- Revisão real dos prompts: 61 na primeira rodada, 76 após correção; limiar 75.

## Estado da execução

As 29 imagens foram geradas e validadas fisicamente. A primeira revisão recebeu 72,64 MiB de PNGs, sofreu cinco desconexões WebSocket e concluiu pelo fallback HTTPS do próprio Codex CLI. Ela reprovou nove cenas (003, 012, 015, 020, 021, 024, 025, 028 e 029). O grafo refez somente essas nove.

A segunda revisão foi retomada pelo menu 3 do Matrix com o código de lotes menores. O primeiro lote falhou antes da análise por limite de uso da conta Codex CLI. O log registrou `You've hit your usage limit` e sugeriu tentar novamente em 4 de setembro de 2026 às 00:00, sem informar explicitamente o fuso horário.

Checkpoint preservado em `image_review_wait`, gate `IMAGE_HUMAN_REVIEW`, motivo `Lote 1/10: CLI sem cota disponivel; consulte run.log.`. Nenhuma aprovação humana foi simulada. Nenhuma geração Kling foi disparada: generationCount=0. Ainda não há MP4 de três minutos validado. A correção em lotes passou nos testes locais, mas sua conclusão real continua pendente de cota.

Evidências locais: `runs/HSL_TEST_3MIN_20260903/images/QUEUE.json`, `images/image-review-1.json`, `ide/image-review-batch-1/3/run.log` e `graph/history.jsonl`.

Depois da liberação da cota, é necessário executar novamente `image_review_prepare` e obter uma revisão válida; não selecionar aprovação humana apenas para contornar indisponibilidade do revisor.
O gate de orçamento deve obter autorização para as 9 novas gerações Kling antes do despacho.
