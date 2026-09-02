# Fase 2 — descoberta do motor de mídia real

Data: 2026-09-02. Branch: `codex/phase2-real-media`.

Esta fase parou ao fim da Parte A, antes de implementar os nós B1–B9. O
agente Firefly externo foi lido sem alterações. As duas IDEs receberam uma
única tentativa headless de imagem cada.

## A1 — agente Firefly externo

Diretório indicado:

```text
C:\Users\brend\OneDrive\Desktop\PROJETO 30K ATE 27\02 - O OUTRO LADO\AUTOMACAO - O OUTRO LADO\agente firefly
```

É um projeto Python 3.11+ (`main.py` → `firefly_bot.main:main`) que usa
Patchright, Chrome real visível e perfil persistente. O ambiente está pronto:
`.venv`, `data/chrome_profile` e `data/firefly_jobs.db` existem; a suíte do
próprio agente terminou com **69 testes aprovados**.

### Entrada, execução e saída

O contrato de lote é JSON:

```powershell
.\.venv\Scripts\python.exe main.py --root <runtime> --feed-guide <guide.json>
.\.venv\Scripts\python.exe main.py --root <runtime> --concurrency 1 --run
```

O guia aceita defaults no topo e `items[]` com:

```json
{
  "name": "SCENE_001",
  "image": "SCENE_001.png",
  "prompt": "...",
  "model": "Firefly Video",
  "resolution": "1080p",
  "aspect_ratio": "16:9",
  "duration_seconds": 5,
  "generate_audio": false
}
```

`image` é resolvido em `imagens/` ao lado do guia; o prompt pode ser inline ou
vir de `imagens/prompts/<stem>.txt`. `auto_discover` pareia imagem e prompt por
nome. Cada job concluído é publicado como `saida/<name>.mp4`. A pasta observada
tem 276 MP4s, totalizando 1.605.718.889 bytes.

O browser é obrigatoriamente headed (`headless=False`), com login manual salvo
em `data/chrome_profile`. Não há login automático. O agente admite apenas
`16:9` e `9:16` nesse fluxo. Firefly Video e Kling 2.5 Turbo têm duração fixa
de 5 s. Veo 3.1/Fast aceita 4, 6 ou 8 s; outros modelos podem usar o controle
de duração observado na UI, entre 1 e 15 s quando o slider existir.

Três saídas reais foram inspecionadas por `ffprobe`, chamado por
`graph/lib/proc.ts`:

| Arquivo | Duração | Dimensão | FPS | Codec / pixel format |
| --- | ---: | ---: | ---: | --- |
| FIREFLY_CANARY_2026-08-31T23-27-53-710Z.mp4 | 5,041667 s | 1920×1080 | 24 | H.264 / yuv420p |
| HSL_001_V01_TAKE_01.mp4 | 10,041667 s | 1280×720 | 24 | H.264 / yuv420p |
| OOL_001.mp4 | 5,041667 s | 1280×720 | 24 | H.264 / yuv420p |

Evidência: `runs/phase2-discovery/firefly-media-probe.json` e `.log`.

### Retry e recuperação

- SQLite WAL com transições CAS e estados pending/claimed/generating/stale/done/falhas.
- Máximo normal de 3 tentativas; respostas 408/429/5xx têm backoff próprio.
- Reconciliação devolve claims órfãos e gerações stale para a fila.
- Watchdog reinicia o worker até 5 vezes por hora.
- Existe `--recover-result-ready-job`, capaz de recuperar download/export sem
  disparar nova geração quando o resultado do provedor já existe.
- O orçamento padrão de geração é 30 min e o watchdog recebe 35 min.
- Download só é publicado após assinatura de container, tamanho mínimo de
  100 kB e `ffprobe` com vídeo, dimensão, duração e codec válidos.

### Diferença para o bot usado pelo adapter antigo

`adapters/fireflyAdapter.ts` aponta por padrão para
`C:\B2-AI-STUDIO\links\firefly-automation`, um junction para outra cópia em
`...\B2 ENTERPRISE\Canais_\Mateo - Copia\agente firefly`. A cópia indicada
pelo usuário é mais nova e diferente: o SHA-256 de `worker.py` é
`819863692579C08D32BB3E20119606BE137E54509E8F9AE398959080FF599DA2`, contra
`F7C59FED46D850B884D23B673175906F1CB7035005C45E02A62D907A18F665D9` no alvo
do adapter.

O banco copiado no diretório novo ainda contém `output_path` absolutos para a
cópia antiga. Além disso, o adapter usa `execSync` com string/shell para o
feed, limpa jobs/saídas antes de rodar e mistura dispatch com polling. Isso
conflita com argv seguro e prepare/wait da Fase 2.

### Recomendação

**Referenciar pelo env `HSL_FIREFLY_AGENT_DIR`; não vendorizar.** O projeto tem
perfil autenticado, banco, 1,6 GB de outputs e evolução própria. Copiá-lo para
`tools/` duplicaria código e criaria risco de versionar sessão/credenciais.

Para cada episódio, o grafo deve usar um runtime isolado em
`runs/<E>/firefly/agent-runtime` para DB/downloads/saída, passar
`FIREFLY_CHROME_PROFILE_DIR=<HSL_FIREFLY_AGENT_DIR>/data/chrome_profile`, e
executar o Python da `.venv` externa via `graph/lib/proc.ts`. Assim reutiliza o
login sem herdar os paths obsoletos do banco externo.

## A2 — imagem headless pelas IDEs

Harness: `graph/discovery/imageHeadless.ts`. Ele usa o contrato de pasta do
`graph/ide/ideRunner`, fixa `maxAttempts=1`, pede um PNG 16:9 de no mínimo
1280×720 e valida assinatura PNG/IHDR e dimensões. Resposta textual não conta.

| Provider | Flags efetivas | Tempo | Resultado físico |
| --- | --- | ---: | --- |
| Antigravity | `agy -p <promptPath> --output-format json --mode accept-edits --disable-slash-commands --print-timeout 600s` | 18.434 ms | FAIL: PNG ausente |
| Codex | `codex exec --sandbox read-only --output-schema ... --json --ignore-user-config -c approval_policy="never" --ephemeral -o ...` | 10.190 ms | UNAVAILABLE: PNG ausente |

Antigravity retornou exit 0 mas sem output: `read_file` foi auto-negado porque
o headless não pode abrir o prompt sem uma allow-rule. A CLI sugeriu
`--dangerously-skip-permissions`; essa flag não faz parte do driver seguro e
não foi usada. Codex produziu JSON válido declarando indisponibilidade, porque
o sandbox read-only e o transporte proíbem ferramentas/escrita.

Evidência imutável: `runs/phase2-discovery/image-headless/results.json`, com
um log por provider. O harness recusa nova execução quando esse receipt existe.

**Decisão:** B3 deve usar o caminho manual com interrupt `IMAGE_MANUAL`. Não há
geração headless de PNG comprovada nas configurações autorizadas.

## A3 — contrato da composição Remotion

`HslLongFormComposition` recebe props no topo ou em `plan`; usa
`plan.beats[]`, soma `durationFrames` e cria uma `Sequence` por beat. O projeto
é 1920×1080 a 30 fps.

- `visualMode=firefly_video` exige `outputVideoPath` e usa
  `OffthreadVideo`, muted, `objectFit: cover`.
- Os demais modos exigem `outputFramePath` e usam `Img`, também com cover.
- Paths HTTP(S) são diretos. Paths locais são normalizados, servidos pelo
  asset server e precisam estar sincronizados sob `public/runs/<E>/...`.
- A composição não impõe codec, fps, duração ou dimensão. A validação precisa
  ocorrer antes do render.

Contrato determinístico recomendado para take real:

1. Nome normalizado `runs/<E>/videos/<beatId>.mp4` e
   `outputVideoPath` apontando para ele.
2. MP4 com vídeo H.264, pixel format yuv420p, 16:9 e ao menos 1280×720;
   1920×1080 é preferido. As saídas reais de 24 fps são aceitas por
   `OffthreadVideo` numa composição de 30 fps.
3. Duração observada `>= durationFrames / 30 - 0,5 s`. Take maior é cortado
   pela `Sequence`; take menor não satisfaz o contrato.
4. Áudio é dispensável, porque `OffthreadVideo` está muted.
5. PNG de referência 16:9, assinatura válida e mínimo 1280×720.

No EP011, os dois primeiros beats têm 8,5 s e 3,5 s. O primeiro não cabe no
Firefly Video/Kling fixo de 5 s; Veo 3.1 Fast em 8 s passa exatamente a
tolerância de 0,5 s.

## A4 — SFX

`audio-plan.json` tem versão, videoId, totalFrames, fps e `scenes[]`. Cada
cena contém offsets absolutos em frames, tratamento da voz com `targetDb`,
música com `volumeDb`/ducking, `layers[]` com `file`, `startFrame`,
`endFrame|durationFrames`, `volumeDb`, papel de frequência e opções de
reverb/reverse, além de transições support/riser/anchor e sidechain.

O estado real desta máquina diverge da premissa da tarefa:

| Local | Áudio encontrado |
| --- | ---: |
| `assets/audio-library/` | 1 MP3 de música; 0 SFX |
| `public/audio/sfx/` | 0 arquivos; sem manifest |
| `assets/soundfx/kenney/` | 3 OGG (2 impacts, 1 pluck) + source manifest |

Não foi encontrada outra pasta `audio-library` sob o workspace. O plano EP011
referencia repetidamente `cinematic/impacts/impact_strike_01.wav`, que não
existe.

`sfx-agent` baixa/organiza pacotes Kenney, converte e cria
`public/audio/sfx/sfx-catalog-manifest.json`; ele constrói a biblioteca, mas
não resolve um plano existente nem gera uma trilha final. `sound-agent` cria o
plano e TSX. `SfxSelector` só lê o manifest em `public/audio/sfx`; se ausente,
devolve um fallback nominal para `impact_strike_01.wav` sem verificar que o
arquivo existe.

Logo, B7 precisa de resolver próprio e determinístico. Com a instalação atual,
só é possível usar os três OGG Kenney como fallback documentado; o catálogo
completo descrito no plano não está presente.

## A5 — intake e QA antigos

`hslVideo4RecoverFireflyIntake` exige:

- jobs `HSL4_%`, status `done`, contagem idêntica aos handoffs;
- `output_path` existente;
- lineage de shot, hash do motion package e do start frame;
- `ffprobe` com stream de vídeo, dimensão, duração e codec válidos;
- parsing de `_TAKE_` no nome;
- SSIM do primeiro frame calculado e registrado. No modo Firefly Video visual
  reference, score abaixo de 0,7 é aceito com disclosure, em vez de rejeitado.

`hslVideo5GeneratedQa` acrescenta:

- conjunto e contagem exatos de shot IDs esperados pelo execution plan;
- proibição de local proxy;
- modelo `Firefly Video`, arquivo existente, resolução mínima 960×540 e
  duração mínima 3,5 s;
- first-frame fidelity obrigatório para modelos diferentes de Firefly Video;
- contact sheet por ffmpeg, com frame em 2 s.

`FireflyToIntakeBridge` também comprova hashes, MIME `video/mp4`, duração, fps,
dimensões, codec/áudio e SSIM >= 0,7 quando aplicável. A Fase 2 pode reutilizar
as regras e tipos, mas os wrappers novos precisam chamar ffprobe/ffmpeg por
`graph/lib/proc.ts`, pois os scripts antigos usam `spawnSync` diretamente.

## Decisões pendentes antes da Parte B

1. **Duração/modelo do primeiro beat — decidido em 2026-09-02:** usar
   **Kling 2.5 Turbo**, conforme pedido do usuário. O canário real é limitado
   a 5 s e, portanto, não satisfaz sozinho `SCENE_001` (8,5 s); a estratégia
   de extensão ou cobertura do beat será tratada separadamente antes do C4.
2. **Biblioteca SFX:** informar o path do catálogo populado ou confirmar o uso
   dos três OGG Kenney atuais como fallback para o teste real mínimo.

Para não bloquear o canário Kling, os três OGG Kenney ficam como fallback
provisório do teste mínimo. Nenhuma geração paga havia sido iniciada até o
fechamento original desta descoberta.

## Canário Kling 2.5 Turbo

Em 2026-09-02 foi executado um teste isolado após a escolha do usuário. O
wrapper `graph/discovery/kling25Canary.ts` chama o agente por
`graph/lib/proc.ts`, usa um runtime separado em
`runs/phase2-discovery/kling25-canary/runtime` e reaproveita somente o perfil
persistente por `FIREFLY_CHROME_PROFILE_DIR`.

O probe headed aprovou a sessão e confirmou na UI: **Kling 2.5 Turbo, 1080p,
16:9, 24 fps, 5 segundos**, com controles de prompt e geração visíveis e sem
overlay bloqueador.

O canário usou `runs/HSL_EPISODE_011/frames/SCENE_001.png` como primeiro
quadro e terminou `failed-infra` em uma tentativa, antes do clique de geração.
O agente abriu o seletor local, mas o arquivo não apareceu no componente de
frames; depois aguardou por 60 s o seletor `remove-frame-0` e recebeu timeout.
A captura final mostra o slot **Primeiro** ainda vazio e o botão **Gerar**
desabilitado. Assim, nenhum crédito foi consumido e nenhum MP4 foi criado.

Evidências ignoradas pelo Git:

- `runs/phase2-discovery/kling25-canary/result.json`;
- `runs/phase2-discovery/kling25-canary/kling25-canary.log`;
- `runs/phase2-discovery/kling25-canary/runtime/screenshots/browser_failure_artifacts/job_-92501_failure_screenshot.png`.

O bloqueio atual é uma divergência do contrato de upload do agente externo,
não de autenticação nem da seleção do Kling. A próxima tentativa real deve
ocorrer somente depois de atualizar o fluxo de upload do agente ou usar o gate
manual de primeiro quadro.

### Resultado com perfil limpo

O diagnóstico foi fechado com um perfil Chrome novo e não redirecionado em
`D:\HSL-FIREFLY-PROFILE`. A sessão foi autenticada uma vez pelo usuário e o
probe confirmou o perfil de produção. Com esse perfil, o mesmo uploader
`scoped_input` aceitou `SCENE_001.png` em aproximadamente 3,2 s; isso confirma
que a falha anterior estava no perfil Chrome antigo.

O canário Kling 2.5 Turbo terminou com sucesso em uma tentativa:

- 1920×1080, H.264, `yuv420p`, 24 fps;
- duração 5,041667 s;
- 14.279.672 bytes;
- SHA-256 `7c36c5b01665cd1a09dc4560b3894de237f8f78176d3be04bf9aedabd2f7585d`;
- saída publicada em `out/test/HSL_EPISODE_011-kling25-turbo-canary.mp4`.

O clique foi confirmado às 20:36:08 e o job terminou às 20:37:44. A geração
consumiu uma unidade do limite do teste. O modelo permanece limitado a 5 s,
portanto este canário valida o motor de mídia, mas ainda não cobre sozinho os
8,5 s do primeiro beat.
