# Fase 2 — motor de mídia real

Data: 2026-09-02. Branch: `codex/phase2-real-media`.

## Implementação

| Nó | Natureza | Resultado |
|---|---|---|
| env_check | determinístico | valida agente e perfil |
| visual_prompts_prepare/wait | IDE Antigravity + interrupt | JSON por beat validado por schema |
| visual_prompts_review_prepare/wait | IDE Codex read-only | score/issues; até duas iterações |
| image_generate_prepare/wait | fila + interrupt | uma QUEUE.json por episódio; PNG 16:9, largura mínima 1920 |
| image_review_prepare/wait | Codex visual + interrupt | imagens anexadas por -i; hashes, score, texto e issues |
| firefly_session_prepare/wait | externo + interrupt | probe, Chrome persistente e revalidação |
| firefly_guide | determinístico | somente Kling 2.5 Turbo, takes de 5 s |
| firefly_dispatch/intake_wait | externo + interrupt | um take por vez, ffprobe e continuidade |
| firefly_finalize | determinístico/ffmpeg | concat demuxer; normaliza somente divergentes |
| sfx_render | determinístico/ffmpeg | WAV estéreo 48 kHz e não resolvidos visíveis |
| mux | ffmpeg | música com sidechain, narração e SFX |

O Remotion envolve cada asset em `Sequence` com `durationInFrames` do beat. Assim, um concat de 10 ou 15 segundos é cortado pela composição sem reencode adicional.

Prova isolada do concat com dois takes canário idênticos: H.264, 1920x1080, 24 fps, 10,083333 s e lista `reencoded: []`.

## Kling 2.5 Turbo

Não existe seleção de Veo nem configuração de outro modelo. As opções fixas são `{ takeSeconds: 5, splitOver: 5.5 }`. Até 5,5 s há um take; acima disso, `ceil(durationSeconds / 5)`. Cada take posterior guarda `dependsOnTake`, recebe o último frame do anterior por `ffmpeg -sseof -0.05 -frames:v 1` e só é despachado após o intake da dependência.

O agente externo é referenciado por `HSL_FIREFLY_AGENT_DIR`; credenciais e perfil não entram no repositório. O perfil funcional é `D:\\HSL-FIREFLY-PROFILE`. O canário validado foi copiado como take 1 de SCENE_001 com SHA-256 `7c36c5b01665cd1a09dc4560b3894de237f8f78176d3be04bf9aedabd2f7585d` e será `skipped`.

## Testes C3

| # | Cenário | Status |
|---|---|---|
| 1 | dois beats reais mockados até mux | passou |
| 2 | take ausente, FIREFLY_RECOVERY e resume | passou |
| 3 | gate manual por beat | substituído pelos testes 11–12 da fila única |
| 4 | review 40, segunda iteração 95 | passou |
| 5 | maxGenerations excedido antes do despacho | passou |
| 6 | SFX não resolvido visível; demais mixados | passou |
| 7 | suíte integral da Fase 1 em mediaMode legacy | passou |
| 8 | 4,9 s = 1; 7 s = 2; 12 s = 3; continuidade no take 2 | passou |
| 9 | perfil Chrome ocupado bloqueia antes da geração | passou |
| 10 | sessão inválida, FIREFLY_LOGIN e revalidação | passou |
| 11 | prepare cria N pending e um único IMAGE_QUEUE | passou |
| 12 | PNG inválido recebe lastError e novo interrupt | passou |
| 13 | --fix converte JPG 1600x900 em PNG 1920x1080 | passou |
| 14 | review baixa retorna item à fila; segunda passa | passou |
| 15 | Codex skipped exige IMAGE_HUMAN_REVIEW | passou |

Validações: `npx tsc --noEmit`, `npx ts-node graph/production/__tests__/phase2.test.ts` e `npx ts-node graph/production/__tests__/production.test.ts`.

## C4 real

Comando: `run --episode HSL_EPISODE_011 --beats 2 --media-mode real --max-generations 3 --test-render`.

Estado atual: checkpoint migrado com --from image_generate_prepare e interrompido uma única vez em IMAGE_QUEUE, antes de qualquer nova geração. Fila: runs/HSL_EPISODE_011/images/QUEUE.json, com SCENE_001 e SCENE_002 pendentes. O worker deve ser disparado na IDE com: “execute a skill hsl-image-worker para runs/HSL_EPISODE_011/images/QUEUE.json”.

Depois que o worker validar os PNGs, o resume executará a revisão Codex com as imagens anexadas. Após aprovação, a previsão continua sendo duas gerações: take 2 de SCENE_001 e take 1 de SCENE_002. O MP4 final e seu ffprobe serão adicionados após o resume.

## SFX e dívidas

O matcher resolve apenas os três assets Kenney aprovados. Drone/ambience ou categorias sem correspondência permanecem em `sfxUnresolved`. Os parâmetros do sidechain são threshold 0.125, ratio 8, attack 20 ms e release 500 ms; a narração permanece no mix principal. A restauração da biblioteca ampla está em `docs/graph/BACKLOG.md`.
