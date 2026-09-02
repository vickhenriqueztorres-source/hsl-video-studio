# Fase 1 — grafo de produção

Data: 2026-09-02. Branch: `codex/phase1-production-graph`.
Commit de separação da Fase 0/0.1: `f36010a` — `phase0: ide runner spike`.

**Estado: concluído. Referência e grafo terminaram com exit 0; paridade real
completa aprovada. O comparador confirmou os 11 estágios, métricas, artefatos,
ffprobe e as 8 regras de compliance sem diferenças não voláteis.**

## Implementação

StateGraph com 11 estágios canônicos, nós auxiliares, SQLite e thread
`<episodeId>@v1`. Gates render/publish desligados por padrão. Não há nó de
IDE nem SDK/chamada de LLM no grafo de produção. As engines originais são
importadas; `masterOrchestrator.ts` e os adapters não foram editados.

O helper `graph/lib/proc.ts` preserva argv literal, env, cwd, timeout e logs.
No Windows, localiza npm.cmd/npx.cmd e executa seus entry points JS com
Node e shell:false, porque CreateProcess não executa .cmd diretamente.
O runner da Fase 0 também utiliza esse helper.

Comandos e contrato de retomada estão em
[CHECKPOINTS.md](../docs/graph/CHECKPOINTS.md).
O [Mermaid](../docs/graph/production.mmd) foi gerado por
`npx.cmd ts-node graph/production/cli.ts mermaid`; não foi escrito à mão.

## Verificação

| Item | Resultado |
| --- | --- |
| tsc --noEmit | PASS |
| 1 — Compilação e Mermaid | PASS |
| 2 — Processo morto durante chunks 2/3 e SQLite reaberto | PASS: entradas 1/1/2/2 |
| 3 — Gates desligados, proceed, abort de render e publish | PASS |
| 4 — Falha de frame, retry esgotado e gatekeeper bloqueante | PASS |
| 5 — Segunda execução com artefatos existentes | PASS: engines não repetidas; todos os nós executados retornam skipped |
| 6 — Confinamento de remoções | PASS |
| 7 — Offline sem cache | PASS: adapter não chamado |
| updateState/Overwrite com --from mux | PASS |
| Comparador detecta diferença real em totalGenerated | PASS com manifests de teste |
| argv com espaços, aspas, Unicode e metacaracteres | PASS |
| Smoke unitário Fase 0 e testes Fase 0.1 | PASS |
| Smoke all com autofill após migração do helper | Antigravity PASS, Codex PASS, manual PASS (fixture explícita) |
| Prompt Antigravity > 20 KB | PASS, stdin, marcador final preservado |
| Suíte npm test | FAIL: contrato externo shared-contracts ausente |
| 19 scripts antigos executados individualmente | 17 PASS; integration e hsl_full_pipeline FAIL |
| Segunda referência EP 011 | FAIL no estágio 7: Chrome connection timeout, 25000 ms |
| Render isolado 0–29 | PASS: configuração original, exit 0, 60.465 ms |
| Terceira referência EP 011 | PASS: exit 0, 2.849.606 ms |
| Grafo real EP 011 | PASS: exit 0, checkpoint/resume e 4 chunks reais |
| Paridade parcial 1–6 | PASS: exit 0 |
| Paridade completa | PASS: exit 0, nenhum item diferente |

Evidências:

- `runs/phase1-typecheck-complete.log`.
- `runs/phase1-tests-final-after-until.log` e `runs/phase1-tests-last.json`.
- `runs/phase1-tests-1788374459102/` (todos os casos e SQLite por cenário).
- `runs/phase1-regression/results.json` e um log por script.
- `runs/phase1-reference-third.log`, `runs/phase1-graph-full.log` e
  `runs/phase1-parity-full-final.log`.

`integration.test.ts` exige
`D:\HSL STUDIO AGENTS\shared-contracts\production.schema.json`, ausente.
`hsl_full_pipeline.test.ts` passou em 3 dos 4 subtestes; o render real falhou
após baixar Chrome Headless Shell, com timeout de 25.000 ms ao conectar ao
browser. O stack aponta para o runtime original de pós-produção,
`hsl/postproduction/postproductionRuntime.ts:194`.
Não foi alterado código fora do escopo para fazer essas verificações passar.

## History do kill test

Dois processos reais de teste: o primeiro é encerrado à força enquanto
os mocks dos chunks 2 e 3 aguardam; o segundo reabre o mesmo SQLite e usa
input null, preservando `thread_id = KILL_TEST@v1`.

Trecho de `runs/phase1-tests-1788374459102/kill-history.json`, originado
diretamente em eventos debug/task:

| Hora UTC | Step | Nó / índice | Task id |
| --- | --- | --- | --- |
| 18:41:07.249 | 14 | render_chunk / 0 | 47568a24-cd9a-53ee-8a3c-bb0098e7fb92 |
| 18:41:07.249 | 14 | render_chunk / 1 | da6a4053-7439-540e-876c-8dd30b36ebf0 |
| 18:41:07.266 | 16 | render_chunk / 2 | 0116d275-76ab-5d02-82e2-5b8672b421b1 |
| 18:41:07.266 | 16 | render_chunk / 3 | f475a3e0-9164-5d1c-82fa-0124f1eb0fb2 |
| 18:41:09.290 | 16 | render_chunk / 2, resume | 0116d275-76ab-5d02-82e2-5b8672b421b1 |
| 18:41:09.290 | 16 | render_chunk / 3, resume | f475a3e0-9164-5d1c-82fa-0124f1eb0fb2 |

Os chunks 0/1 aparecem uma vez; 2/3 aparecem duas vezes com os mesmos task
ids. Checkpoint lógico e entrada de função são evidências distintas. O
journal das funções também preserva retries que não criam um novo evento
debug/task.

## Decisão sobre Send nos estágios 2/3

As duas engines ficam em lote: `image_frames` e `firefly_videos`, entre
fan-out/join explícitos. A engine de imagem usa a posição no array para
composição e seleção do frame. A de vídeo usa o índice para o movimento,
o conjunto completo para video_ratio_percentage e sobrescreve um único
firefly-guide.json. Executá-las com arrays unitários alteraria o resultado.
`assetConcurrency` é aceito/reservado, mas não paraleliza esses lotes.

Render usa Send em lotes de até renderConcurrency, default 1. São mantidas
as quatro faixas 0–4499, 4500–8999, 9000–13499 e 13500–17999 e os argv
originais do render/FFmpeg. No Send, só renderChunks/timings são escritos.

## Narração de referência

A referência original foi chamada pelo harness com
`runMasterEpisodePipeline({ episodeId: 'HSL_EPISODE_011' })`, porque o CLI
antigo ignora argumentos posicionais. Primeira tentativa: 15:58:04.069 a
16:01:29.004 UTC, exit 1, 204,935 s. Gerou 96 frames e 36 takes; falhou em
`ELEVENLABS_NO_CHUNKS_GENERATED`.

Causa verificada: o spawn shell:true do adapter separa o caminho
`D:\HSL STUDIO AGENTS\...` nos espaços. A reprodução via shell retornou
exit 2 com `unrecognized arguments: STUDIO AGENTS\...`. O mesmo Edge-TTS
funcionou com argv literal. Logs `runs/phase1-tts-shell-diagnostic.log` e
`runs/phase1-tts-diagnostic.log`. O bug foi registrado em
[BACKLOG.md](../docs/graph/BACKLOG.md); não foi corrigido no adapter.

Foi preparado áudio real a partir do roteiro integral já gerado, pela voz
`en-US-ChristopherNeural`, usando um arquivo de texto e o seguinte argv:

```text
C:\Users\brend\AppData\Local\Programs\Python\Python313\Scripts\edge-tts.exe
--voice en-US-ChristopherNeural
--file "D:\HSL STUDIO AGENTS\hsl-video-studio\runs\HSL_EPISODE_011\graph\narration-input.txt"
--write-media "D:\HSL STUDIO AGENTS\hsl-video-studio\runs\HSL_EPISODE_011\audio\narration.mp3"
```

Não há shell na execução efetiva; aspas acima apenas delimitam os paths.
O texto não vai em argv. Geração: 45.995 ms, exit 0.

| Propriedade | Valor |
| --- | --- |
| Duração ffprobe | 556,752 s |
| Tamanho | 3.340.512 bytes |
| SHA-256 | d408730b84fe985b4945b2512fb499d4333bea4f61a71756b5d7b8404fb2a291 |
| Cache encontrado pelo adapter | D:\HSL STUDIO AGENTS\hsl-video-studio\runs\HSL_EPISODE_011\audio\narration.mp3 |
| Backup seguro | D:\HSL STUDIO AGENTS\runs-reference\HSL_EPISODE_011\narration-original.mp3 |

O backup foi copiado e seu SHA-256 comparado ao original antes da segunda
tentativa. `prunePublicRuns` só toca public/runs, cleanRemotionTemp toca
entradas remotion em `C:\Users\brend\AppData\Local\Temp`, e a remoção do
bundle só toca build/. Nenhum desses destinos inclui o cache ou o backup.

Segunda tentativa expressamente autorizada pelo usuário, com
`npx.cmd ts-node graph/production/reference.ts --episode HSL_EPISODE_011 --retry-once`.
O log confirmou que o adapter reutilizou o cache. Os estágios 1–6 e o
bundle passaram. O primeiro render, frames 0–4499, falhou com:

```text
TimeoutError: Timed out after 25000 ms while trying to connect to the browser!
REFERENCE_FAILED: Error: Remotion Parte 1/4 (Atos 1-2) falhou com código 1
```

O erro vem de `@remotion/renderer/dist/browser/BrowserRunner.js:280`; a
propagação original ocorre em `hsl/pipeline/masterOrchestrator.ts:377`.
É a mesma categoria de falha observada no teste antigo de render. Não foi
aplicado workaround ao browser ou ao fluxo antigo, nem feita nova tentativa.

Log completo: `runs/phase1-reference-retry.log`. O servidor de assets do
orquestrador antigo manteve o Node aberto após a rejeição. Após verificar
que não havia filhos ativos e que o PID 11052 correspondia à referência,
ele foi encerrado. O render filho já tinha retornado exit 1; o encerramento
forçado do processo principal foi registrado separadamente, sem inventar
um exit natural da referência. Recibo:
`runs/HSL_EPISODE_011/graph/reference-failure-2.json`.

O manifest permanece como o original o deixou: estágios 1–6 DONE,
7 IN_PROGRESS, 8–11 PENDING. Uma cópia marcada como falha está fora do repo,
em `D:\HSL STUDIO AGENTS\runs-reference\HSL_EPISODE_011\failed-attempt-2-run-manifest.json`,
junto do log. Não foi publicada como referência válida em docs/graph/reference.
Não existe compliance final dessa tentativa.

Após a limpeza e a falha, os hashes do cache e do backup continuaram iguais
ao SHA-256 da tabela. A terceira tentativa só foi liberada depois do render
isolado default passar; o harness verifica o recibo, o hash do cache e recusa
uma quarta tentativa.

A terceira referência executou com o comando
`npx.cmd ts-node graph/production/reference.ts --episode HSL_EPISODE_011
--third-after-render-check`, das 17:06:05.182 às 17:53:34.788 UTC. Terminou
com exit 0 e congelou, antes do grafo, manifest, compliance, ffprobe e o MP4
de 159.588.310 bytes em `docs/graph/reference/`. SHA-256 do vídeo:
`23f3ce1139ccfb02db27301d08db949ff3c6fe204f2efb2fd47f620acb619db9`.
O cache original foi restaurado e verificado antes do grafo.

## Diagnóstico isolado do Chrome/Remotion

`npx remotion browser ensure` retornou exit 0 e localizou:

```text
D:\HSL STUDIO AGENTS\hsl-video-studio\node_modules\.remotion\chrome-headless-shell\win64\chrome-headless-shell-win64\chrome-headless-shell.exe
```

O binário existe e, chamado por `graph/lib/proc.ts`, com `shell:false` e
argv `--version`, retorna exit 0: `Google Chrome for Testing 149.0.7790.0`.
O CLI é `@remotion/cli 4.0.513`; nessa versão, `npx remotion --version`
imprime versão e help, mas retorna exit 1.

O render isolado do mesmo bundle passou sem variação: frames 0–29, GL angle,
concorrência 2, timeout 3.600.000 ms, exit 0, 60.465 ms e MP4 de 104,7 kB.
Logo, espaço no path, binário e flags originais não são causas permanentes.
O achado é compatível com contenção transitória no run longo. Durante a suíte
em `main` havia outro Remotion do EP 012 e cerca de 1,7 GB de RAM livre; após
ele terminar, o teste isolado passou. Não foi adicionada flag nem alterado
`remotion.config.ts`. Detalhes e comando integral em
`docs/graph/RENDER-ENV.md`.

## Paridade e tempo real

| Comparação | Resultado atual |
| --- | --- |
| Stage ids e métricas 1–6 | PASS: exit 0, nenhum item diferente |
| Stage ids e métricas 1–11 | PASS: exit 0, nenhum item diferente |
| Vídeo: duração, resolução, codecs, streams | PASS: 600 s, 1920×1080, H.264/AAC, 2 streams |
| Compliance: mesmos rule ids aprovados/reprovados | PASS: 8/8 regras, mesmos resultados |
| Checkpoint `--until` | PASS: exit 3; próximo nó `gate_render_wait` |

Comando executado:

```text
npm.cmd run hsl:master:parity -- --episode HSL_EPISODE_011 --reference-manifest docs/graph/reference/ep011-attempt2-run-manifest.json --until STAGE_06
```

Foram iguais na parcial: seis IDs/status, todas as chaves e valores de métricas,
episodeId e seis artefatos aplicáveis. Vídeo e compliance ficaram marcados
como fora do recorte, não como PASS. O comparador tem default
`--reference-dir docs/graph/reference`. Campos
voláteis: timestamps, durações de estágios, baseUrl/porta e prefixos de root.
Tolera 0,05 s na narração e 0,1 s no vídeo. Missing evidence falha, não vira
um item ignorado ou um PASS.

A paridade completa foi repetida depois de arquivar o manifest herdado da
referência e recriá-lo pelo grafo desde `scene_plan`. O resultado continuou
exit 0, eliminando dependência do mesmo arquivo de manifest. O pre-mux altera
a narração para 599,989 s; por isso o cache original de 556,752 s foi
restaurado pelo hash antes dessa reconciliação, reproduzindo a ordem real.

Comando completo:

```text
npm.cmd run hsl:master:parity -- --episode HSL_EPISODE_011
```

Os tempos 1–6 comparam a terceira referência concluída ao primeiro trecho do
grafo. Ambos reutilizaram mídia existente; medem revalidação idempotente.

| Estágio | Referência 3 | Grafo até `gatekeeper` |
| --- | ---: | ---: |
| 01 Scene plan | 61 ms | 24 ms |
| 02 Image frames | 50.691 ms | 43.901 ms |
| 03 Firefly videos | 85.085 ms | 39.181 ms |
| 04 Narration | 55 ms | 1.307 ms |
| 05 Sound design | 126 ms | 6 ms |
| 06 Pre-render gate | 3.440 ms | 3 ms |
| Soma 1–6 | 139.458 ms | 84.422 ms |

O grafo saiu com código 3 e checkpoint gravado. O status contém 96 frames e
36 vídeos `skipped`, nenhum erro e `next = [gate_render_wait]`. Um teste com
SQLite fechado/reaberto continuou dali sem repetir frames ou vídeos.

Tempos do trecho completo, excluindo a pausa intencional no `--until`:

| Trecho | Referência | Grafo |
| --- | ---: | ---: |
| 01–06 | 139.458 ms | 84.422 ms |
| 07 render (prepare, 4 chunks, stitch) | 2.671.281 ms | 2.470.919 ms |
| 08 pre-mux | 3.871 ms | 3.720 ms |
| 09 mux | 23.166 ms | 22.868 ms |
| 10 packaging | 4.553 ms | 1.413 ms (cache válido) |
| 11 compliance | 6.692 ms | 7.520 ms |
| Total de processo | 2.849.606 ms | 2.590.862 ms ativos |

O grafo ficou 258.744 ms (9,1%) abaixo da referência em tempo ativo. A
diferença inclui packaging em cache e pequenas diferenças de revalidação;
não é apresentada como benchmark de engine.

## Testes antigos em `main`

A suíte de 19 scripts foi executada na branch `main`, commit `54740c8`, após
guardar toda a Fase 1 em stash. O resultado foi o mesmo da branch: 17 PASS e
2 FAIL.

| Teste | `main` | Branch Fase 1 | Classificação |
| --- | --- | --- | --- |
| `tests/integration.test.ts` | FAIL: `shared-contracts/production.schema.json` ausente | mesmo FAIL | pré-existente |
| `tests/hsl_full_pipeline.test.ts` | 3/4; timeout Chrome 25.000 ms | mesmo FAIL | pré-existente |

Resultado e logs de `main` estão em
`D:\HSL STUDIO AGENTS\runs-reference\phase1-main-baseline`. Os dois itens
foram registrados em `docs/graph/BACKLOG.md`; não há regressão da branch.

## Prompt longo do Antigravity

O help confirmou --input-format stream-json lendo NDJSON no stdin e exigindo
--output-format stream-json. Protocolo real validado:

```json
{"event":"user","message":{"role":"user","content":"<prompt integral>"}}
```

Comando:

```text
agy -p "" --output-format stream-json --input-format stream-json --mode plan --disable-slash-commands --print-timeout 120s
```

24.741 caracteres foram enviados por stdin; o UUID aleatório no fim foi
devolvido em uma issue, com JSON válido por AJV. Evidência:
`runs/agy-long-1788364536512/ide/long_prompt/1/run.log`, exit 0,
10.484 ms no processo de inferência. O formato inicialmente tentado com
`type: user` foi rejeitado por falta de event e não foi considerado PASS.
Acima de 7.000 caracteres, o driver nunca passa o conteúdo em -p. Se o
help não oferecer stdin, utiliza apenas referência curta ao prompt.md,
mantendo as permissões de leitura existentes.

Smoke all com autofill após migração do helper:

| Provider | Resultado | Tempo | Autofill |
| --- | --- | --- | --- |
| Antigravity | PASS | 12.028 ms | false |
| Codex | PASS | 15.775 ms | false |
| Manual | PASS | 1 ms | true |

Threads: smoke-antigravity-1788364735688-3e323e,
smoke-codex-1788364748318-65d722 e smoke-manual-1788364764563-93cf9a.

## Divergências e limites explícitos

1. LangGraph 1.4.13 proíbe nomes de nó iguais a campos do estado. Os quatro
   IDs internos narration_stage/gatekeeper_stage/packaging_stage/compliance_stage
   têm aliases no CLI para os nomes pedidos. Os arquivos mantêm os nomes do spec.
2. Função que lança não pode também retornar um update de estado. Erros e
   timings de falhas são escritos primeiro no journal; o CLI status expõe
   esse journal e o checkpoint de tasks. Finalize incorpora falhas
   recuperadas ao estado. Gates não fazem essas escritas.
3. PNG não tem duração em ffprobe; validam-se header e dimensões positivas.
4. TEMP global é limpo antes dos renders, não dentro de chunks concorrentes,
   para não apagar os recursos de um browser ainda em execução.
5. Não há exactly-once de mídia em qualquer crash. Arquivos válidos são
   reutilizados; incompletos são reexecutados com retry. O kill test cobre
   a fronteira real entre lotes e pending tasks do SQLite.
6. O check de compliance pode reutilizar o JSON válido de uma execução
   anterior. `--from compliance` invalida esse recibo para nova avaliação.
7. Mantidos os campos vazios do manifest para thumbnails e publicationPackagePath.
8. A narração pré-gerada é um cache real para contornar o bug do adapter
   intacto; não é fixture nem silêncio usado como evidência de paridade.
9. A referência antiga e o grafo têm destinos globais. Não executar os dois
   pipelines simultaneamente. O lock do grafo não modifica a referência.

## Escopo e git status

Snapshot final, após interromper a referência com falha:

Código alterado:

```text
 M graph/ide/README.md
 M graph/ide/drivers/antigravity.ts
 M graph/ide/drivers/process.ts
 M package.json
?? graph/PHASE1-REPORT.md
?? docs/graph/
?? graph/lib/
?? graph/production/
?? graph/smoke/longPrompt.ts
```

Artefatos gerados, com alteração rastreada esperada:

```text
 M HSL_EXECUTION_STATE.json
 M remotion/TestVideo1MinAudio.tsx
```

Artefatos ignorados, conforme `git status --short --ignored` com pathspec:

```text
!! assets/audio-library/
!! build/
!! out/
!! public/audio/
!! public/runs/
!! runs/
```

O cache seguro fica fora do repositório, no path registrado acima.
`git diff --check`: PASS. Nenhuma edição manual em hsl/, adapters/,
orchestrator/, spec/, registry/ ou database/schema.sql. As duas mudanças
rastreadas fora dos diretórios de código autorizados são outputs previstos
na especificação, gerados pelo orquestrador original.
