# Backlog da Fase 2

## P1 — narration adapter: shell:true quebra com espaços no path; migrar para graph/lib/proc.ts na Fase 2

Local: `adapters/elevenLabsNarrationAdapter.ts:76`, spawnSync do Edge-TTS,
com `{ encoding: 'utf8', shell: true }` na linha 80.
O caminho absoluto do cache de chunks é montado em `generateChunkedSpeech`.

Reprodução nesta máquina: a invocação via shell divide
`D:\HSL STUDIO AGENTS\hsl-video-studio\runs\temp_audio_chunks\chunk_000.mp3`
nos espaços. Edge-TTS encerra com exit 2 e `unrecognized arguments: STUDIO
AGENTS\...`. O adapter omite esse stderr e termina com
`ELEVENLABS_NO_CHUNKS_GENERATED` após os quatro blocos falharem.

A execução direta com argv literal funciona. A Fase 1 preparou cache real
usando `edge-tts --file <arquivo de texto> --write-media <cache>`, via
`graph/lib/proc.ts`, sem modificar o adapter ou o orquestrador antigo.
Comando, hash e duração estão no relatório da Fase 1.

Na Fase 2: migrar spawn para o helper, usar arquivo para texto grande,
registrar stderr e testar caminhos com espaços, aspas e caracteres Unicode.

## Outros limites herdados

- `tests/integration.test.ts` já falha em `main` (`54740c8`): procura o
  contrato externo `D:\HSL STUDIO AGENTS\shared-contracts\production.schema.json`,
  que não existe no checkout. A mesma suíte individual teve 17/19 tanto em
  `main` quanto na branch da Fase 1.
- `tests/hsl_full_pipeline.test.ts` também já falha em `main` (`54740c8`):
  Chrome Headless Shell não conecta ao Remotion em 25.000 ms
  (`BrowserRunner.js:280`). O diagnóstico da Fase 1 está em
  `docs/graph/RENDER-ENV.md`.

- `HslRunManifest` não preenche thumbnails/publicationPackagePath no master.
- Imagens/vídeos têm índices de lote e guia compartilhado; expor APIs por
  beat preservando o índice original antes de paralelizar esses estágios.
- O pipeline usa destinos globais de assets e build. Isolamento por episódio
  exige alterar a referência antes de permitir produções simultâneas.
- O servidor original de assets e o pre-mux não têm cleanup/recovery completo
  em falhas; não alterar as engines nem o fluxo antigo nesta fase.
