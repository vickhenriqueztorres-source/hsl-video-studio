# Preparação da Fase 3 — EP 011

Verificado em 2026-09-03. Não autoriza despacho Kling.

## Roteiro e orçamento proposto para GATE_2

Fonte: `runs/HSL_EPISODE_011/scene-plan.json`, array `beats` e soma das durações.

| Escopo | Beats | Takes de 5 s | Novas gerações com canário reutilizado |
|---|---:|---:|---:|
| Beats `firefly_video` do roteiro | 36 | 56 | 55 |
| Todos os beats, caso sejam animados | 96 | 145 | 144 |

O roteiro tem 600 segundos, 36 beats de vídeo e 60 de imagem. Nos vídeos,
16 beats exigem um take e 20 exigem dois. Regra: duração <= 5,5 s usa um
take; acima disso, ceil(duração / 5).

O único take presente em `firefly/takes/` é `SCENE_001-take-1.mp4`.
Seu SHA-256 permanece igual ao canário validado:
`7c36c5b01665cd1a09dc4560b3894de237f8f78176d3be04bf9aedabd2f7585d`.
A revisão visual/continuidade continua exigida para uso na versão final.

Proposta pendente de aprovação do usuário: limitar o GATE_2 a **55 novas
gerações**, preservar os 60 beats de imagem e reaproveitar o canário.
Sem reserva automática de gerações para novas tentativas. O limite de 3
gerações anteriormente autorizado refere-se somente ao C4 de dois beats.

O `firefly_guide` atual planeja takes para todos os itens de `visualPrompts`,
sem filtrar `visualMode`. Antes de escalar, a Fase 3 precisa garantir que apenas
os beats de vídeo entrem nesse guia. Os números acima são estimativas pelo
roteiro atual, não autorização nem alteração do limite de execução.

## Biblioteca de áudio

A biblioteca do projeto O OUTRO LADO foi importada fisicamente para
`assets/audio-library/`: três fontes OGG, três SFX Kenney tratados, as faixas
e o plano/QA aprovado do leite, além de um plano portátil com paths locais.
São 14 itens importados (96,598 MiB); incluindo o índice e a música já existente,
o banco tem 16 arquivos (104,212 MiB). Procedência e SHA-256 em
`docs/graph/AUDIO-IMPORT.json` e `assets/audio-library/library-index.json`.

O nó `sfx_render` agora usa SoundFxDesignAgent, SoundFxMixAgent e SoundFxQaAgent
locais, com os derivados do banco. A skill e seu contrato também estão no
próprio checkout, em `.agents/skills/hsl-soundfx-design/`.
Não existe uma coleção ampla de foley no projeto de origem: os três SFX
canônicos continuam sendo Kenney. Camadas sem correspondência específica são
registradas em `sfxUnresolved`; o runtime preserva silêncio nesses casos.
O teste de replay dos 18 cues do leite produziu PCM idêntico ao original.
Detalhes em `docs/graph/AUDIO-INTEGRATION.md`.
