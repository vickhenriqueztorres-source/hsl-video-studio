# Contrato de testes da integração de motion autoral

Este documento é o bloqueio executável da fase 3 de `PLANO-SQUAD-MOTION-AUTORAL.md`. Ele existe porque, na data desta revisão, o grafo de produção ainda não expõe `motionMode`, o provider `remotion-authored`, o fan-out/fan-in do squad nem a procedência autoral no render. Criar testes TypeScript contra esses símbolos agora quebraria `tsc` sem testar comportamento real.

Quando as interfaces abaixo existirem, converter cada seção em um teste `node:test` nos arquivos indicados. Os testes devem usar diretórios temporários e dependências falsas; nenhum teste pode chamar Codex, Firefly, Kling, ElevenLabs, rede ou GPU.

## Fixture canônica

Adicionar `graph/motion/integration-tests/fixtures.ts` com:

- `legacyState()`: checkpoint estrutural sem a propriedade `motionMode`.
- `authoredState()`: dois beats autorais, `MOTION_A` e `MOTION_B`, sem frames e sem takes Firefly.
- `mixedState()`: `STILL_A` com provider `none`, `FIREFLY_A` com `firefly-kling` e `MOTION_A` com `remotion-authored`.
- `motionArtifact(beatId, overrides?)`: vídeo de duração exata, `source-manifest.json`, recibo e hashes de roteiro, áudio, alinhamento, brief, código, assets e renderer.
- `motionDependencies()`: spies separados para autoria, compilação e render, com contadores por `beatId` e `inputHash`.

Todos os IDs, frames e hashes da fixture devem ser constantes. Use 30 fps, 1920x1080 e 150 frames por beat. Os arquivos físicos podem seguir o formato de mídia falsa já usado por `graph/production/__tests__/fixtures.ts`.

## 1. Compatibilidade de estado e modo

Arquivo: `graph/motion/integration-tests/motionMode.test.ts`.

1. `resolveMotionMode(legacyState())` retorna `legacy` quando o campo não existe.
2. `initialState()` grava `motionMode: 'legacy'`; `initialState({ graph: { motionMode: 'authored' } })` grava `authored`.
3. Qualquer outro valor falha com `MOTION_MODE_INVALID` antes de executar nós.
4. O `threadId` de um episódio antigo permanece igual ao valor anterior à integração. A adição do modo não incrementa `STATE_VERSION` por si só.
5. Em `legacy`, o grafo não chama dependências do squad e mantém a mesma projeção de media plan, providers e ordem de nós observável pelos testes atuais.

API mínima esperada:

```ts
export type MotionMode = 'legacy' | 'authored';
export function resolveMotionMode(state: StructuralState): MotionMode;
```

## 2. Provider e plano de mídia

Arquivo: `graph/motion/integration-tests/authoredProvider.test.ts`.

1. `MediaProvider` e `AssetResult.provider` aceitam `remotion-authored` sem coerção para `local-ffmpeg` ou `firefly-kling`.
2. Um beat autoral aparece exatamente uma vez em `mediaPlan.authoredMotionBeatIds`, com `takeCount: 0`.
3. O mesmo beat não aparece em `fireflyBeatIds`, `localMotionBeatIds` ou `stillBeatIds`.
4. `validateMediaPlan` aceita o plano intacto e rejeita troca apenas do provider, remoção do ID autoral, duplicação do ID e alteração do hash.
5. `firefly-hybrid` aceita lista Firefly vazia quando todos os beats são autorais. A ausência de Firefly só é erro quando o contrato editorial realmente exige um beat externo.
6. A projeção do plano preserva `sourceBeatId`, duração e ordem dos beats.

O schema deve subir de versão se a forma serializada do plano mudar. Checkpoints `hsl-media-plan/v1` continuam legíveis no modo `legacy`; um plano novo não pode se identificar falsamente como `v1`.

## 3. Fan-out/fan-in e independência de imagem

Arquivo: `graph/motion/integration-tests/motionFanout.test.ts`.

1. `motionDispatch(authoredState())` produz dois trabalhos, um para cada `beatId`, mesmo com `frames: []`, `imageSpecs: []`, `visualPrompts: []` e `videoTakes: []`.
2. Cada trabalho carrega somente seu `MotionSceneInput`, incluindo intervalo global, duração, hash do áudio bloqueado e hash do alinhamento.
3. Resultados recebidos na ordem `MOTION_B`, `MOTION_A` são reunidos na ordem do media plan.
4. Duas atualizações para o mesmo `beatId` e mesmo `inputHash` resultam em uma entrada. A revisão válida mais recente substitui a anterior; append cego falha o teste.
5. Atualizações de beats diferentes não se sobrescrevem.
6. Em episódio 100% autoral, os spies de prompt visual, geração/revisão de imagem, frames, sessão/dispatch Firefly e vídeos locais permanecem em zero; o fluxo chega a `narration_lock`/squad.
7. Em episódio misto, apenas `STILL_A` entra na fila de imagem, apenas `FIREFLY_A` entra na fila Firefly e apenas `MOTION_A` entra no squad.
8. `motionJoin` bloqueia com `MOTION_COVERAGE_MISSING:<beatId>` se faltar resultado, se estiver reprovado ou se o provider não coincidir. Não há fallback para fotografia, template ou vídeo generativo.

O reducer pai precisa ser indexado por uma chave estável, no mínimo `beatId + inputHash`. Se a revisão também participar da chave, o join deve selecionar explicitamente a revisão aprovada mais recente.

## 4. Identidade de render e procedência

Arquivo: `graph/motion/integration-tests/motionRenderIdentity.test.ts`.

1. `createRenderIdentity` aceita `remotion-authored` e inclui, para o beat autoral, provider, `artifactInputHash`, hash do vídeo, hash do recibo e hash do `source-manifest`.
2. Alterar somente código-fonte, brief, áudio bloqueado, alinhamento, assets declarados, versão do renderer ou versão das dependências muda a identidade, ainda que caminho e duração do MP4 permaneçam iguais.
3. Alterar apenas porta do asset server ou `completedAt` do recibo não muda a identidade.
4. Alterar bytes do MP4, recibo ou source manifest invalida `assertRenderInputs` antes do renderer.
5. `assertMediaCoverage` exige `rendered`, `verified` e `approved` verdadeiros, duração física de 150 frames, resolução/FPS esperados, hashes coincidentes e cópia pública idêntica.
6. O `MotionArtifact.receiptPath` e `sourceManifestPath` devem estar dentro da pasta da execução e do beat; caminhos remotos ou que escapem do run falham fechados.
7. Um receipt de chunk/final criado para a identidade anterior não é reutilizado após qualquer mudança coberta pelo item 2.

O manifesto de render deve referenciar o artefato autoral; inferir procedência apenas pelo MP4 ou pelo nome da pasta não atende ao contrato.

## 5. Retry idempotente e retomada

Arquivo: `graph/motion/integration-tests/motionRetry.test.ts`.

1. Primeira execução sem recibo chama autoria uma vez, render uma vez e publica recibo atômico somente após QA aprovado.
2. Segunda execução com o mesmo `inputHash`, vídeo válido e recibo verificado retorna `skipped`; contadores de autoria e render continuam em um.
3. Simular crash depois de escrever o vídeo e antes do checkpoint: ao retomar, o nó reconcilia o recibo durável e não chama autoria/render de novo.
4. Vídeo existente sem recibo, recibo incompleto ou hash divergente nunca é tratado como sucesso. O trabalho é retomado pela etapa segura definida no recibo, uma única vez.
5. Timeout ou resultado incerto do modelo/render grava estado `uncertain` e exige reconciliação antes de nova chamada. Retry genérico de LangGraph não pode duplicar a operação.
6. Duas entregas idênticas do mesmo worker não aumentam o número de resultados no estado.
7. Um input alterado gera novo `inputHash`, nova revisão e exatamente uma nova autoria/render; não sobrescreve o diretório/recibo da revisão anterior.
8. Um artefato reprovado ou com revisões esgotadas produz `MOTION_REVIEW_REQUIRED`; nunca é convertido em sucesso ou mídia legada.

O teste de crash deve usar uma barreira controlada pela fixture, sem `sleep`: escrever artefato e recibo, lançar erro antes de aplicar o update, reconstruir o estado inicial e executar novamente.

## Critério para liberar a integração

Executar os cinco arquivos isoladamente com `node:test` via `ts-node`, depois `npx tsc --noEmit` e a suíte existente de produção. A integração só está pronta quando:

- todos os testes novos passam em Windows sem serviços externos;
- testes legados continuam verdes com checkpoints sem `motionMode`;
- nenhuma chamada de imagem/Firefly acontece em episódio 100% autoral;
- mutações de procedência invalidam caches; e
- o teste de crash comprova uma única autoria e um único render para o mesmo `inputHash`.
