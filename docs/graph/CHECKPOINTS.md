# Checkpoints de produção

O estado usa `Annotation.Root`, `stateVersion = 1` e
`thread_id = <episodeId>@v1`. O saver é o mesmo da Fase 0:
`database/langgraph-checkpoints.sqlite`, SQLite em WAL.

Mudanças incompatíveis no schema exigem incrementar `STATE_VERSION`.
Threads de outra versão ficam no banco, mas não são consultadas pelo novo
CLI; não existe migração implícita. Não altere checkpoints manualmente.

## Execução

```powershell
npm.cmd run hsl:master:graph -- --episode HSL_EPISODE_011
npm.cmd run hsl:master:graph -- --episode HSL_EPISODE_011 --offline --gates render,publish
npm.cmd run hsl:master:graph -- --episode HSL_EPISODE_011 --until gatekeeper
npm.cmd run hsl:master:graph:resume -- --episode HSL_EPISODE_011 --decision proceed
npm.cmd run hsl:master:graph:resume -- --episode HSL_EPISODE_011 --decision abort
npm.cmd run hsl:master:graph:status -- --episode HSL_EPISODE_011
npx.cmd ts-node graph/production/cli.ts history --episode HSL_EPISODE_011
npm.cmd run hsl:master:graph:mermaid
```

`resume` sem decisão retoma falhas de execução usando input `null`. Com um
interrupt pendente, exige `--decision`. Uma nova chamada `run` não substitui
uma thread pendente. `run --until <node>` grava o checkpoint depois do nó,
retorna exit 3 e deixa o sucessor em `next`; `resume` continua normalmente
com input `null`. Exit codes de execução: 0 COMPLETED, 2 gate pendente,
3 parada solicitada por `--until`, 1 erro/bloqueio/aborto/reprovação.
Comandos de consulta retornam 0 quando
conseguem consultar. O fechamento do SQLite ocorre depois da execução e da
gravação dos checkpoints.

`run --from <node>` chama `updateState`, usa `Overwrite([])` para zerar
reducers append e limpa os campos daquele ponto em diante. Reavalia os
artefatos existentes; não os apaga para forçar recomputação. Gates são
reavaliados. Os aliases `narration`, `gatekeeper`, `packaging` e `compliance`
apontam para IDs internos terminados em `_stage`, pois LangGraph 1.4.13
proíbe colisão entre nome de nó e canal do estado.

## Durabilidade e auditoria

`runs/<episodeId>/graph/history.jsonl` recebe cada evento real `debug/task`
durante o stream, com task id, nó, índice do chunk e step. A gravação é por
evento, antes de terminar o run, portanto sobrevive ao encerramento do
processo. `checkpoint-history.json` contém os snapshots do saver, sem
alteração artificial de contagens.

`node-events.jsonl` registra as entradas efetivas das funções, inclusive
retry, timings e erros. Uma função que lança não pode também retornar um
update de estado: os writes daquela tentativa são descartados pelo
LangGraph. Por isso erros fatais ficam imediatamente nesse journal e nas
tasks do checkpoint; no `finalize`, erros e timings de falhas recuperadas
são incorporados aos arrays do estado. Não se altera o agendamento de uma
task falha apenas para anexar diagnóstico.

O grafo divide os quatro chunks fixos em lotes de tamanho
`renderConcurrency` (default 1). Cada lote usa `Send`; somente arrays append
são escritos pelos chunks. Há checkpoint entre lotes. O teste com dois
chunks por lote mata o processo durante 2/3, reabre SQLite e comprova
entradas `[1, 1, 2, 2]`. Arquivos parciais são reinspecionados antes do retry.

Os gates humanos não chamam wrappers com escrita em disco e não abrem
servidor nem CLI. O stream externo registra suas entradas. Reentrada é
esperada; o estágio de mídia anterior não se repete por causa do interrupt.

O servidor de assets é singleton por processo. Em resume direto de chunk,
um HEAD com limite de 500 ms verifica a URL salva; se ela morreu, o servidor
é recriado e o arquivo de props recebe a nova URL antes do render.

## Limites da referência

O pipeline compartilha build/, public/audio/narration.mp3, o TSX de áudio e
HSL_EXECUTION_STATE.json. O CLI mantém um lock de processo em out/ para
impedir duas execuções de produção pelo CLI do grafo ao mesmo tempo.
O orquestrador antigo não participa desse lock; não o execute junto com o
grafo. Imports programáticos precisam garantir a mesma exclusão.

Imagem e vídeo usam chamadas em lote: seus índices posicionais e o guia
único de vídeo impedem divisão por beat com paridade. `assetConcurrency`
fica reservado nesta fase; só renderConcurrency altera o escalonamento.

PNG estático não tem duração em ffprobe. Sua idempotência verifica arquivo,
header PNG e dimensões, enquanto áudio/vídeo exigem duração positiva.

A limpeza global de TEMP ocorre na preparação, antes dos chunks. Ela não
ocorre dentro de chunks paralelos, para não remover o browser de outro
chunk. Toda remoção valida confinamento, incluindo symlinks/junctions.

## Referência e paridade

```powershell
npx.cmd ts-node graph/production/reference.ts --episode HSL_EPISODE_011
npm.cmd run hsl:master:graph -- --episode HSL_EPISODE_011
npm.cmd run hsl:master:parity -- --episode HSL_EPISODE_011
```

O harness chama a função original com episodeId explícito: o CLI antigo não
lê esse argumento. Após sucesso, preserva manifest, compliance e ffprobe
em `docs/graph/reference/ep011-*.json`, além de uma cópia local do MP4
(ignorada pelo Git). Nunca se usa o resultado do grafo como referência.
Um marcador em runs/ impede repetir acidentalmente a referência.

Nesta máquina, a primeira tentativa falhou porque o shell do adapter de
narração divide paths com espaços. O usuário autorizou uma segunda tentativa
com cache real pré-gerado e backup fora do repositório. A terceira exigiu
`--third-after-render-check`, um recibo de render isolado default com exit 0
e o hash exato do cache autorizado. Ela terminou com exit 0; qualquer quarta
tentativa é rejeitada.

`--reference-dir` tem default `docs/graph/reference`. Overrides individuais:
`--reference-manifest`, `--reference-video`, `--reference-compliance`.
`--until STAGE_06` limita manifest e artefatos ao recorte e marca vídeo e
compliance como fora do recorte, sem produzir falso PASS para esses itens.
Sem o MP4 arquivado, o comparador usa o snapshot ffprobe da referência;
se um `--reference-video` explícito não existir, o item falha.

A comparação é estrutural, com tolerâncias de 0,05 s para narração e 0,1 s
para vídeo. Não testa identidade binária ou qualidade editorial. Valores
voláteis são listados na tabela. Manifest incompleto/ausente, vídeo sem
ffprobe de referência ou compliance ausente nunca produzem PASS.

Sem TTS em rede: use `--offline` e disponibilize
`runs/<episodeId>/audio/narration.mp3` válido com mais de 10.000 bytes.
No modo normal, ElevenLabs/Edge-TTS continuam sendo as engines de mídia
existentes; não há SDK ou chamadas de LLM no grafo de produção.

Referências de semântica: [interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
e [persistência](https://docs.langchain.com/oss/javascript/langgraph/persistence).
