# Fase 2 — motor de mídia real

Atualização 2026-09-03: geração nativa por `codex exec` foi comprovada com uma
imagem real, sem IDE aberta e com login ChatGPT. O grafo agora executa
`codex_auth_prepare/wait` e `image_generate_run`; o IMAGE_QUEUE interativo
descrito no histórico abaixo foi substituído por geração automática e gates
apenas em falhas. Login/status: `npm run hsl:codex:login` /
`npm run hsl:codex:status`. Evidência e instruções em `docs/graph/ACCOUNTS.md`.
O C4 completo do EP 011 foi concluído em 2026-09-03 com duas gerações novas e
um take canário reaproveitado.

### Correção de planejamento e orçamento 2026-09-03

O episódio de 6 minutos expôs que o diretor legado altera o cabeçalho para 360
segundos, mas conserva os 96 beats e aproximadamente 600 segundos do storyboard
canônico. O wrapper do grafo agora reduz o plano de modo determinístico,
preserva os oito atos e distribui exatamente 10.800 frames. Para o EP 012, o
resultado é 58 beats: 43 imagens estáticas e 15 beats `firefly_video`.

O `firefly_guide` passou a planejar takes somente para beats marcados como
`firefly_video`, conforme o contrato do Remotion e a engine legada. A CLI não
pede mais um teto arbitrário no início. Produção completa executa primeiro o
planejamento e as imagens; no `KLING_BUDGET`, mostra beats de vídeo, takes,
reaproveitamentos e novas gerações, e só despacha após a palavra `KLING`. No EP
012, o plano atual prevê 20 takes para 15 beats, sem geração já consumida.

O Codex CLI foi atualizado de 0.152.1 para 0.153.0. O 404 deixou de ocorrer. Um
segundo bloqueio foi corrigido concedendo ao subprocesso isolado acesso à skill
`imagegen`; o canário produziu e validou um PNG 1920x1080. A fila agora guarda o
hash do prompt e invalida imagens quando o prompt muda.

### Atualização Kling 2026-09-03

O canário real passou com H.264, 1920x1080, 24 fps, 5,041667 s, 16.459.068
bytes e SHA-256 `b34cbbcb568b26fbc1ad6029a164caa2eac6f86b335473cd7afb8818b6c2493e`.
O primeiro frame foi copiado para o sandbox do agente, corrigindo a antiga
incompatibilidade de path absoluto. A revisão visual confirmou fidelidade ao
avião e ao sistema de abastecimento, movimento coerente e ausência de pessoas,
texto e logos adicionados.

Foi adicionado um recibo idempotente por take. O retry genérico foi removido do
nó pago; resultado incerto interrompe em `FIREFLY_RECOVERY` e não reenfileira.
O teste também comprovou que o código 2 do watchdog significa fila vazia após
sucesso e deve ser reconciliado pela presença do MP4 validado. Detalhes em
`docs/graph/KLING-SUPERVISOR.md`.

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
| 5 | gate mostra o número exato, bloqueia, aceita o limite exato e só então despacha | passou |
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
| 16 | fila com gerador diferente do Codex falha fechado | passou |

Validações: `npx tsc --noEmit`, `npx ts-node graph/production/__tests__/phase2.test.ts` e `npx ts-node graph/production/__tests__/production.test.ts`.

## C4 real

Comando: `run --episode HSL_EPISODE_011 --beats 2 --media-mode real --max-generations 3 --test-render`.

Resultado: `COMPLETED`, `next: []`, `generationCount: 2`. O take 1 de
SCENE_001 foi reaproveitado do canário; SCENE_001-take-2 e SCENE_002-take-1
foram gerados, baixados e validados com 5,041667 s cada. O MP4 final está em
`out/test/HSL_EPISODE_011-2beats.mp4`: H.264 1920x1080 a 30 fps, áudio AAC,
10,000 s e 7.830.963 bytes. O SFX resolveu 2 cues Kenney e preservou silêncio
para 8 camadas sem asset narrativo específico.

Durante o primeiro despacho de SCENE_001-take-2, o upload terminou no Firefly,
mas o seletor global não reconheceu a miniatura dentro do Shadow DOM. O banco
comprovou `generation_started_at: null` e ausência de saída. A reconciliação
restrita recolocou o mesmo job na fila, sem novo feed, e a execução seguinte
concluiu o take. Também foi corrigido o isolamento de paths do render de teste:
um MP4 legado completo não pode mais fazer o grafo pular os 300 frames, e o nó
valida o mesmo `temp_p1_*.mp4` produzido pelo argv real do Remotion.

## SFX e dívidas

O matcher resolve apenas os três assets Kenney aprovados. Drone/ambience ou categorias sem correspondência permanecem em `sfxUnresolved`. Os parâmetros do sidechain são threshold 0.125, ratio 8, attack 20 ms e release 500 ms; a narração permanece no mix principal. A restauração da biblioteca ampla está em `docs/graph/BACKLOG.md`.
