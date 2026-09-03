# Contrato HSL de Sound FX

## Entradas

- `episode.execution.json` e contratos `*.execution.json` aprovados;
- duracao e FPS da montagem;
- coreografia Remotion, microeventos, funcao narrativa e transicoes;
- narracao aprovada para julgamento de densidade e prioridade;
- manifesto de assets licenciados, quando houver SFX externos.

## Mapeamento canonico

| Evento | Cue | Arquivo canonico |
|---|---|---|
| seta cinetica ou fluxo | `SNAP_POP` | Kenney Interface Sounds / `pluck_001.ogg` |
| alerta, falha, limite ou gargalo | `SUBTLE_STRIKE` | Kenney Impact Sounds / `impactMetal_light_002.ogg` |
| mudanca de capitulo | `CHAPTER_DROP` | Kenney Impact Sounds / `impactBell_heavy_001.ogg` |

O mapeamento e um vocabulario, nao uma obrigacao de preencher todos os momentos. Cues concorrentes devem ser reduzidos e o limite operacional e de tres cues por segundo.

## Saidas obrigatorias

- `soundfx-plan.json` com status `SFX_PLAN_APPROVED`;
- assets fisicos derivados do Kenney CC0, URLs oficiais e hashes de procedencia;
- `soundfx-bed.wav`, PCM estereo, 48 kHz, com duracao da timeline;
- `soundfx-qa.json` com status `SFX_QA_PASS`;
- referencias aos artefatos no `final-render-manifest.json`.

## Gate

Bloqueie o render quando faltar asset, houver divergencia de hash, cue fora da timeline, faixa vazia/corrompida, sample rate diferente de 48 kHz ou audio sem dois canais. SFX licenciado sem origem aprovada tambem bloqueia.
