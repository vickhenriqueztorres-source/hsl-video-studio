# Fase 1 — mapa da referência

Leitura em 2026-09-02. Este mapa registra a referência antes da implementação.
A continuação da especificação foi recebida e implementada nesta branch;
o estado atual e as evidências estão em ../PHASE1-REPORT.md. Este mapa não
declara paridade real validada.

Branch `codex/phase1-production-graph`, criada a partir de
`codex/phase0-ide-runner`, ambas inicialmente no commit
`54740c894e7e6e1972aec36becd0a2d12d8212f1`.
As alterações locais da Fase 0/0.1 foram preservadas e ainda não têm commit.

## Referências lidas

- `graph/PHASE0-REPORT.md` e `graph/ide/README.md`.
- `hsl/pipeline/masterOrchestrator.ts`, integralmente.
- `hsl/core/hslRunManifest.ts`.
- `orchestrator/stateMachine.ts`.
- `hsl/core/hslValidationGatekeeper.ts`.
- APIs relevantes das engines de imagem, vídeo, narração, som e packaging.

## Estágios e artefatos

`root` é `process.cwd()`, `E` é episodeId, `e` é episodeId em minúsculas.
Todos os estágios usam os nomes canônicos abaixo no HslRunManifest.

| Estágio | Chamada / responsabilidade | Artefatos e métricas observados |
| --- | --- | --- |
| STAGE_01_SCENE_PLAN | HslSceneDirectorAgent.planEpisodeFromScratch(topicInput) | runs/E/scene-plan.json; totalBeats; manifest.scenePlanPath |
| STAGE_02_IMAGE_FRAMES | HslImageFrameEngine.generateFramesForEpisode(E, beats) | PNGs em public/runs/E/frames e runs/E/frames; SVGs intermediários conforme o tema; totalGenerated; manifest.framesCount |
| STAGE_03_FIREFLY_VIDEOS | HslFireflyVideoEngine.processVideoBeatsForEpisode(E, beats) | MP4s em public/runs/E/videos e runs/E/videos; runs/E/firefly-guide.json; totalVideos; manifest.videosCount |
| STAGE_04_NARRATION | ElevenLabsNarrationAdapter.generateSpeech e inspectMediaWithFfprobe | runs/E/audio/narration.mp3, cópia public/audio/narration.mp3; durationSeconds; manifest.narrationAudioPath e narrationDurationSeconds |
| STAGE_05_SOUND_DESIGN | SoundDesignAgent(root).runFullPipeline | runs/E/audio-plan.json e remotion/TestVideo1MinAudio.tsx; sem métricas no manifest |
| STAGE_06_PRE_RENDER_GATE | validateBeforeRender(E) | HSL_EXECUTION_STATE.json na raiz e em runs/E; verifiedBeats e autoRecovered; erro bloqueia render |
| STAGE_07_REMOTION_RENDER | Limpeza, sync, bundle, quatro chunks e concat inline | out/e_render-props.json, build/, out/temp_visual_e.mp4; manifest.videoVisualPath; chunks e concat list removidos após sucesso |
| STAGE_08_PRE_MUX_GATE | ffprobe, comparação e atempo condicional inline | runs/E/narration_synced.mp3 se necessário; substitui as duas cópias de narration.mp3; durationDiffSeconds |
| STAGE_09_FFMPEG_MUX | Mux inline e inspectMediaWithFfprobe | out/e.mp4, deliveries/E/video/e.mp4, runs/E/video/e.mp4; remove visual temporário; finalDuration; manifest.masterVideoPath e masterVideoDurationSeconds |
| STAGE_10_PACKAGING | ThumbnailSeoEngine.generatePackage e exportPackagingDeliverables | runs/E/publication-package.json, YOUTUBE_PUBLICATION_PACKAGE.md, thumbnails/; cópias deliveries/E/publication e thumbnails; out/temp_thumb_props/thumb_0..2.json |
| STAGE_11_PRD_COMPLIANCE | HslComplianceChecker.checkCompliance(E) | totalRules e passedRules no manifest; completeRun só após aprovação |

O manifest em disco é `runs/E/run-manifest.json`. A referência não preenche
`artifacts.thumbnails` nem `publicationPackagePath`, apesar desses campos
existirem no tipo. A duração da narração registrada no estágio 4 permanece
a original, mesmo se o estágio 8 substituir o áudio.

A engine chamada Firefly neste caminho gera takes localmente com FFmpeg a
partir dos frames; não dispara um job remoto Firefly. Reutilizar a engine
preserva esse comportamento real.

O estágio 5 converte beats em VideoAnalysisInput: offsets acumulados em
frames, fps 30, mood global suspense, moods de cenas alternados
suspense/action, ambiente industrial_refinery, voice targetDb -12 e layers
ambience/foley/tension_riser. Essa transformação está inline na referência;
a engine de som deve continuar sendo importada.

## Comandos inline a preservar

Os elementos abaixo representam argv, sem interpretação adicional de shell.
`props` é o caminho relativo com barras `/` até out/e_render-props.json.
O JSON completo permanece em arquivo.

```text
npx remotion bundle remotion/index.ts build --public-dir=public

npx remotion render build HslLongFormComposition out/temp_p1_e.mp4
  --props=props --frames=0-4499 --public-dir=build/public --muted
  --concurrency=2 --gl=angle --image-format=jpeg --jpeg-quality=80
  --timeout=3600000
```

Os outros três renders preservam os argumentos e usam respectivamente:

| Arquivo | Frames |
| --- | --- |
| out/temp_p2_e.mp4 | 4500-8999 |
| out/temp_p3_e.mp4 | 9000-13499 |
| out/temp_p4_e.mp4 | 13500-17999 |

As faixas são fixas em 18.000 frames na referência, independentemente do
targetMinutes recebido. As variáveis antigas `temp_visual_e_p1/p2.mp4`
declaradas no original não são usadas pelo render efetivo.

```text
ffmpeg -y -nostdin -hide_banner -loglevel error -f concat -safe 0
  -i <out/concat_e.txt> -c copy <out/temp_visual_e.mp4>

ffmpeg -y -hide_banner -loglevel error -i <runs/E/audio/narration.mp3>
  -filter:a atempo=<fator com quatro casas> <runs/E/narration_synced.mp3>

ffmpeg -y -hide_banner -loglevel error -i <out/temp_visual_e.mp4>
  -stream_loop -1
  -i <assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3>
  -i <runs/E/audio/narration.mp3>
  -filter_complex [1:a]volume=0.04[bg];[2:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=first[aout]
  -map 0:v:0 -map [aout] -c:v copy -c:a aac -b:a <HSL_AUDIO_BITRATE>
  -shortest <out/e.mp4>
```

A lista concat contém os quatro caminhos absolutos, barras `/`, uma linha
`file '<path>'` por arquivo e newline final. O fator atempo é
audio.durationSeconds / visual.durationSeconds. A referência só tenta
sincronizar quando o delta excede HSL_DURATION_TOLERANCE_SECONDS e não
bloqueia se o ajuste falhar ou o delta continuar alto.

## Recursos de processo e resume

- O servidor HTTP escuta em 127.0.0.1 com porta efêmera e suporta Range.
  Serve public/ com fallback para root. O original o abre no estágio 7,
  usa sua URL no render props e em HSL_ASSET_BASE_URL no estágio 10,
  fechando apenas ao fim bem-sucedido. Um objeto Server não pode ser
  serializado em checkpoint; a retomada deve restabelecer esse recurso.
- `syncCurrentRunAssets` copia runs/E para public/runs/E e
  public/public/runs/E, além das duas variantes em build/public quando
  build/public existe. Preservar os quatro destinos.
- `prunePublicRuns` remove as outras pastas de episódios em public/runs.
  `cleanRemotionTemp(0)` limpa entradas com remotion no nome em os.tmpdir.
  O bundle também remove build/ previamente. A extração deve validar o
  confinamento dos destinos antes de remoções recursivas.
- Engines dependem de cwd e há destinos globais compartilhados: build/,
  public/audio/narration.mp3, HSL_EXECUTION_STATE.json e o TSX de áudio.
  Execuções concorrentes de episódios não são isoladas pela referência.
- `HslRunManifest` recarrega o JSON existente, mas startStage regrava
  timestamps. Não é um mecanismo de deduplicação por si só.
- Um interrupt deve ficar em nó próprio sem spawn/escritas. Histórico de
  checkpoints não conta entradas de função; eventos debug/task podem
  comprovar a reentrada barata do gate humano.
- O visual temporário é removido no estágio 9. Uma validação de resume
  não deve exigir sua presença quando o mux já foi concluído.
- `printReportAndExit` chama process.exit. O grafo precisa registrar a
  reprovação antes de a CLI definir o código de saída, para preservar a
  possibilidade de checkpoint e fechamento de recursos.
- `ProductionStateMachine` atualiza o banco de produção e emite eventos.
  Não é chamada por runMasterEpisodePipeline; adicioná-la ao caminho
  novo introduziria efeitos que não existem nessa referência.

## Questões históricas da especificação inicialmente incompleta

Decisões posteriores: contrato completo recebido; HTTP de TTS permitido;
helpers em graph/lib/proc.ts; escopo distingue código de artefatos gerados;
comparação estrutural com tolerâncias de ffprobe. A lista abaixo preserva
o levantamento que motivou essas decisões.

1. Faltam os campos mínimos do estado e qualquer trecho posterior sobre
   CLI, gates, retry, testes e critérios de aceite. A solicitação da
   continuação já foi enviada ao usuário.
2. A proibição de HTTP a provedores conflita com a geração de narração
   sem cache: ElevenLabsNarrationAdapter chama api.elevenlabs.io e possui
   fallback Edge-TTS externo. O caminho de cache retorna antes dessas
   operações quando o arquivo tem mais de 10.000 bytes. O contrato offline
   precisa ser definido sem copiar a implementação do adapter.
3. O helper de processo da Fase 0 resolve o shim npm do Codex para seu JS;
   ainda não resolve npm.cmd/npx.cmd genericamente. Será necessário
   ampliar/reutilizar essa abordagem, preservando argv e paths com espaços.
4. O escopo de edição de código é graph/, package.json, lockfile,
   .gitignore e docs/graph/. A execução de paridade produz por definição
   artefatos fora desses diretórios, inclusive um TSX em remotion/.
   Uma comparação isolada evita misturar esses outputs com edições de fonte.
5. Timestamps de manifest, porta efêmera em props e possíveis escolhas
   temporais das engines precisam ser identificados na comparação; não
   declarar igualdade byte a byte sem definir esses campos variáveis.

Nenhum render, geração de narração ou chamada de provedor foi executado
durante este levantamento. O orquestrador de referência não foi modificado.
