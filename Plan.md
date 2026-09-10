Vou recuperar os detalhes técnicos que preciso para fechar o plano (estágios do orquestrador, contratos dos adapters e o modo headless do Codex CLI).

# Plano de migração — HSL Video Studio → LangGraph (multiagente sem API de LLM)

## 0. Decisões tomadas (e por quê)

| Decisão | Escolha | Justificativa
|-----|-----|-----
| Linguagem | **TypeScript — LangGraph.js (`@langchain/langgraph`)** | O repo é 100% TS (`ts-node`, Remotion, `better-sqlite3`). Os nós importam direto `HslSceneDirectorAgent`, `validateBeforeRender`, `SoundDesignAgent`, `ThumbnailSeoEngine`. Zero ponte Python↔TS, zero duplicação de contratos em Pydantic. O checkpointer usa o SQLite que você já tem.
| Escopo inicial | **Master Orchestrator (11 estágios) como sub-grafo `production`** | É o único fluxo que roda ponta a ponta hoje e já tem prova de paridade (EP 011 passou no gatekeeper). O pipeline editorial de 33 etapas entra na Fase 4 como segundo sub-grafo, plugado num supervisor.
| Divisão IDE | **Antigravity = BUILDER, Codex = REVIEWER** | Preserva os papéis já declarados em `adapters/antigravityAdapter.ts` e `codexAdapter.ts`. Codex vira o "juiz" com score numérico e schema JSON obrigatório.
| LLM no grafo | **Nenhum `ChatModel`** | LangGraph é usado como máquina de estados durável (StateGraph + checkpointer + `interrupt` + `Send`). Todo raciocínio é delegado às CLIs `agy` e `codex exec` via `child_process`, com contrato de arquivo.


---

## 1. Diagnóstico do que existe (o que o grafo vai absorver)

```plaintext
hsl/pipeline/masterOrchestrator.ts   ← função monolítica, 11 estágios sequenciais, throw em falhaorchestrator/stateMachine.ts         ← 10 status + VALID_TRANSITIONS (SQLite + EventBus)hsl/core/hslRunManifest.ts           ← startStage/completeStage/failStage + artefatosHSL_EXECUTION_STATE.json             ← estado ad-hoc de execuçãoadapters/antigravityAdapter.ts       ← só telemetria; executeTask() é stub que retorna successadapters/codexAdapter.ts             ← desativado por cotaregistry/hslArtifactRegistry.ts      ← registro canônico de artefatoshsl/core/hslValidationGatekeeper.ts  ← gate determinístico (100% assets no disco)spec/hsl-compliance-checker.ts       ← gate de compliance
```

**Problemas que o LangGraph resolve diretamente:**

1. Falha no estágio 7 (render, ~1h) obriga a rodar tudo de novo → **checkpoint por nó, resume por `thread_id`**.
2. `HslRunManifest`, `ProductionStateMachine` e `HSL_EXECUTION_STATE.json` são três fontes de verdade → **um único `State` tipado, persistido**.
3. Gates humanos são "olha o console e reroda o script" → **`interrupt()` nativo com `Command({resume})`**.
4. Frames/Firefly são loops sequenciais → **`Send` (map-reduce) por beat, com retry isolado**.
5. Os adapters de IDE são stubs → **`IdeRunner` real, com contrato de entrada/saída em arquivo**.


---

## 2. Arquitetura alvo

```plaintext
                         ┌──────────────────────────────┐                         │  supervisor (grafo raiz)      │                         │  thread_id = episodeId        │                         └──────┬──────────────┬─────────┘                                │              │               ┌────────────────▼───┐    ┌─────▼──────────────────┐               │ editorial (Fase 4) │    │ production (Fase 1-3)  │               │ 33 etapas, gates   │───▶│ 11 estágios do master  │               └────────────────────┘    └────────────────────────┘production sub-grafo: START  │  ▼ scene_plan ──▶ [agy] plan_enrich ──▶ [codex] plan_review ──┐ score<threshold → volta p/ plan_enrich (máx 2x)  │                                                          │ score≥threshold ↓  ▼                                                          ▼ ⏸ GATE_1 (interrupt: aprovar scene-plan.json)         ← humano aprova/edita/rejeita  │  ├──── Send(beat) ──▶ image_frame(beat)   ×N ─┐  └──── Send(beat) ──▶ firefly_take(beat)  ×N ─┴──▶ join_assets                                                     │                       narration ──▶ sound_design ───┘ (paralelo aos assets)                                                     │                                                     ▼                                              gatekeeper (determinístico)                                                     │ blocked → auto_heal ──▶ gatekeeper (máx 1x) → FAIL                                                     ▼ passed                                              ⏸ GATE_2 (interrupt: liberar render de 1h)                                                     │                            ┌─── Send(chunk 0-4499) ─▶ render_chunk ─┐                            ├─── Send(4500-8999)    ─▶ render_chunk ─┤                            ├─── Send(9000-13499)   ─▶ render_chunk ─┼─▶ stitch_ffmpeg                            └─── Send(13500-17999)  ─▶ render_chunk ─┘   (concurrency=1 por padrão)                                                                          │                                                       mux_audio ──▶ compliance ──▶ [codex] final_qa                                                                                          │                                                                              packaging (thumbnail/SEO)                                                                                          │                                                                          ⏸ GATE_3 (interrupt: publicar?)                                                                                          │                                                                                     finalize → END
```

### 2.1 Schema de estado (Annotation)

```typescript
// grafo/state.ts — só descrição, não é código finalProductionState = {  episodeId, topicInput                      // imutáveis  scenePlan, scenePlanPath                   // stage 1  frames:  reducer(append)  { beatId, path, status, attempts }   // Send/map  videos:  reducer(append)  { beatId, path, status, attempts }  narration: { path, durationSeconds }  audioPlanPath  gatekeeper: { passed, blockedReason, autoRecovered, attempts }  renderChunks: reducer(append) { range, path, status }  finalVideoPath, complianceReport, packaging  reviews: reducer(append) { node, provider:'codex', score, verdict, issues[] }  ideRuns: reducer(append) { node, provider, promptPath, outputPath, exitCode, durationMs }  errors:  reducer(append)  productionStatus: ProductionStatus         // espelha stateMachine.ts p/ compat}
```

Reducers `append` em `frames/videos/renderChunks/reviews` é o que permite os `Send` paralelos escreverem sem conflito.

### 2.2 Classificação dos nós

| Nó | Tipo | Quem executa | Fonte hoje
|-----|-----|-----
| `scene_plan` | determinístico | TS | `HslSceneDirectorAgent.planEpisodeFromScratch`
| `plan_enrich` | **raciocínio** | **Antigravity** | novo — refina voiceover/beats com o RAG (`RAG/`, `rag/`)
| `plan_review` | **raciocínio** | **Codex** | novo — score 0-100 + issues, schema obrigatório
| `image_frame` | determinístico (map) | TS | `HslImageFrameEngine` por beat
| `firefly_take` | determinístico (map) | TS | `HslFireflyVideoEngine` por beat
| `narration` | determinístico | TS | `ElevenLabsNarrationAdapter` (+ fallback já existente)
| `sound_design` | determinístico | TS | `SoundDesignAgent.runFullPipeline`
| `gatekeeper` | determinístico | TS | `validateBeforeRender`
| `auto_heal` | **raciocínio** | **Antigravity** | novo — recebe `blocked_reason`, corrige assets/paths, retorna diff
| `render_chunk` | determinístico (map) | TS + `npx remotion render` | `renderChunk()`
| `stitch_ffmpeg`, `mux_audio` | determinístico | TS + ffmpeg | estágios 7-8
| `compliance` | determinístico | TS | `HslComplianceChecker`
| `final_qa` | **raciocínio** | **Codex** | novo — lê manifest + compliance + ffprobe, veredito
| `packaging` | determinístico | TS | `ThumbnailSeoEngine`
| `finalize` | determinístico | TS | manifest + registry + `productionStatus=FINAL_VIDEO_RENDERED`


Só **4 nós** precisam de IDE. Todo o resto é código que você já tem, embrulhado em funções `async (state) => Partial<State>`.

---

## 3. Camada "IDE como LLM" — o coração do plano

### 3.1 Contrato único (`IdeTask`)

Cada nó de raciocínio produz uma pasta no disco e chama a CLI. Nada passa por stdin/stdout "solto":

```plaintext
runs/<episodeId>/ide/<node>/<attempt>/  ├── prompt.md          ← gerado pelo nó (template + estado relevante)  ├── context/           ← symlinks/cópias dos artefatos que a IDE deve ler  ├── schema.json        ← JSON Schema do output esperado (ajv já está no repo)  ├── output.json        ← escrito pela IDE  └── run.log            ← stdout/stderr da CLI
```

### 3.2 Drivers

**Antigravity (BUILDER)**

```shellscript
agy -p "$(cat prompt.md)" --output-format json --dangerously-skip-permissions
```

- Recebe o `prompt.md` com instrução explícita: "escreva o resultado em `output.json` conforme `schema.json`".
- Pode editar arquivos do projeto (é builder) — o nó registra `git diff --stat` antes/depois em `ideRuns`.
- Timeout configurável; falha → retry policy do LangGraph (`retryPolicy: {maxAttempts: 2}`).


**Codex (REVIEWER)**

```shellscript
codex exec "$(cat prompt.md)" --output-schema schema.json --json -o output.json --ephemeral
```

- `--output-schema` garante o JSON válido; `--ephemeral` evita sujar o disco; `-o` grava direto no contrato.
- Sandbox read-only (revisor não edita nada).
- Se `codex` não estiver disponível (cota), o driver retorna `{provider:'codex', skipped:true}` e o nó cai no **modo determinístico**: `ajv` + thresholds de `spec/hsl-spec.ts`.


**Modo manual (fallback universal — essencial)**
Quando `agy`/`codex` headless não estiverem disponíveis, o driver:

1. escreve `prompt.md` + `schema.json`,
2. chama `interrupt({ kind:'IDE_MANUAL', promptPath, expectedOutput })`,
3. você abre o `prompt.md` no Antigravity/Codex dentro da IDE, cola o resultado em `output.json`,
4. retoma com `Command({ resume: { outputPath } })`.


O grafo não sabe nem se importa se a IDE rodou headless ou você fez à mão — o contrato é o arquivo. **Isso garante que o sistema funciona no dia 1 mesmo que a CLI headless dê problema.**

### 3.3 Validação de saída (comum aos dois)

- `ajv` valida `output.json` contra `schema.json`.
- Inválido → uma re-tentativa com o erro do ajv anexado ao prompt.
- Ainda inválido → `errors.append` e roteia para `interrupt` manual.


---

## 4. Persistência e resume

- **Checkpointer:** `SqliteSaver` do `@langchain/langgraph-checkpoint-sqlite` apontando para o mesmo `database/` já usado por `db.ts` (tabela separada `checkpoints`).
- **`thread_id` = `episodeId`** (`HSL_EPISODE_011`). Rodar de novo o mesmo episódio = resume automático do último nó concluído.
- **Compatibilidade:** o nó `finalize` (e um `afterEach` em cada nó) continua chamando `HslRunManifest` e `ProductionStateMachine.transitionTo()` para que dashboards, `hsl:verify`, `hsl:registry` e `HSL_EXECUTION_STATE.json` sigam funcionando sem alteração.
- **Durabilidade do render:** cada `render_chunk` é um nó separado → se a parte 3/4 falhar, retoma só ela (economia de ~45 min).
- **Idempotência:** nós determinísticos checam se o artefato já existe e está válido (ffprobe) antes de reprocessar — o "auto-recover" do gatekeeper já faz isso parcialmente; vai virar padrão.


---

## 5. Gates humanos (`interrupt`)

| Gate | Onde | O que você vê | Ações de resume
|-----|-----|-----
| GATE_1 | após `plan_review` | `scene-plan.json` + review do Codex (score, issues) | `approve` / `edit` (path do plano editado) / `reject` (volta para `plan_enrich` com feedback)
| GATE_2 | após `gatekeeper` | relatório de assets + estimativa de tempo de render | `render` / `abort`
| GATE_3 | após `packaging` | thumbnail, título, descrição, `final_qa` do Codex | `publish` / `regenerate_packaging` / `hold`


Todos opcionais via config `gates: { plan:true, render:true, publish:true }` — modo "autônomo total" desliga os três.

---

## 6. Fases de execução

### Fase 0 — Spike de viabilidade (sem tocar no pipeline)

- Instalar `@langchain/langgraph`, `@langchain/langgraph-checkpoint-sqlite`, `@langchain/core` (sem `@langchain/openai` ou similares).
- Provar os dois drivers isoladamente: um `agy -p` que escreve um JSON, um `codex exec --output-schema` que valida.
- Provar o fallback manual com `interrupt` + `Command`.
- **Critério de aceite:** script `ide-runner:smoke` roda os 3 modos (agy, codex, manual) e produz `output.json` válido em cada um.


### Fase 1 — Paridade estrita do Master (sem nós de IDE)

- Criar `graph/production/` com os 11 estágios como nós determinísticos, edges lineares, checkpointer ligado.
- `render_chunk` já como `Send` (4 chunks), `frames`/`videos` ainda sequenciais.
- Novo script `hsl:master:graph` ao lado de `hsl:master` (o antigo não é removido).
- **Critério de aceite:** rodar EP 011 pelos dois caminhos e comparar `manifest.json`, gatekeeper, compliance e hash do MP4 final (tolerância: só timestamps).


### Fase 2 — Resiliência

- `Send` por beat em `image_frame` e `firefly_take` com `retryPolicy` e `concurrency` configurável.
- Kill test: matar o processo no chunk 3/4 e retomar com o mesmo `thread_id`.
- GATE_2 ativo (é o gate que mais economiza tempo).
- **Critério de aceite:** resume após kill sem reprocessar nenhum chunk concluído.


### Fase 3 — Agentes de raciocínio (Antigravity gera, Codex revisa)

- Nós `plan_enrich` (agy), `plan_review` (codex), `auto_heal` (agy), `final_qa` (codex).
- Prompts versionados em `graph/prompts/*.md`, schemas em `graph/schemas/*.json`.
- Loop `plan_enrich ⇄ plan_review` com threshold (`score ≥ 80`, máx 2 iterações) e GATE_1/GATE_3.
- Reescrever `AntigravityAdapter.executeTask` / `CodexAdapter.reviewCode` para delegarem ao `IdeRunner` (os stubs desaparecem).
- **Critério de aceite:** um episódio novo passa pelo loop de review com pelo menos uma correção aplicada pelo Antigravity a partir de issue do Codex.


### Fase 4 — Pipeline editorial (33 etapas) + supervisor

- Sub-grafo `editorial` a partir de `docs/HSL-FULL-PIPELINE.md`, reutilizando os scripts `hslVideoN*` (prepare → start-frame-plan → start-frame-qa → approve-and-prepare → dispatch → recover-intake → generated-qa → narration → finish → youtube-package).
- Supervisor raiz roteia `editorial → production` e mapeia `ProductionStatus` 1:1 com `stateMachine.ts`.
- Gates humanos onde hoje existem scripts `approve-and-prepare`.
- **Critério de aceite:** um episódio inteiro do briefing ao YouTube package com um único `thread_id`.


### Fase 5 — Operação

- CLI `hsl:graph` com subcomandos `run | resume | status | approve | history` (lê o checkpointer).
- Exportar o grafo como Mermaid (`graph.getGraph().drawMermaid()`) para `docs/`.
- Deprecar `HSL_EXECUTION_STATE.json` (vira view derivada do checkpointer).
- Integrar `EventBus` como listener de `stream` do grafo para o Mission Control atual.


---

## 7. Estrutura de pastas proposta

```plaintext
graph/  index.ts                  ← compila supervisor + sub-grafos  state.ts                  ← Annotations + reducers  checkpointer.ts           ← SqliteSaver sobre database/  production/    graph.ts                ← nós, edges, conditional edges    nodes/*.ts              ← um arquivo por nó (wrappers finos das engines)  editorial/                ← Fase 4  ide/    ideRunner.ts            ← contrato IdeTask + validação ajv    drivers/antigravity.ts  ← agy -p    drivers/codex.ts        ← codex exec    drivers/manual.ts       ← interrupt + arquivo  prompts/*.md  schemas/*.json  cli.ts                    ← hsl:graph run|resume|status|approve
```

Nada em `hsl/`, `adapters/`, `remotion/`, `sound-agent/` é reescrito — só importado.

---

## 8. Riscos e mitigações

| Risco | Mitigação
|-----|-----|-----
| `agy` headless instável ou sem `--output-format json` na sua versão | Fallback manual é obrigatório desde a Fase 0; verificar `agy --help` no spike.
| Codex sem cota (situação atual) | Driver retorna `skipped`; nós de review degradam para validação determinística. Nada bloqueia.
| Antigravity edita arquivos errados no `auto_heal` | Rodar em branch git temporária; nó registra `git diff`; GATE_2 mostra o diff antes do render.
| Render paralelo estoura RAM (já está em `--concurrency=2`, 4 chunks) | `Send` com `maxConcurrency: 1` por padrão; aumentar só depois de medir.
| Divergência de paridade na Fase 1 | Antigo `hsl:master` fica intacto até a Fase 3 concluir; comparação automatizada de manifests.
| Duas máquinas de estado (`stateMachine.ts` × checkpointer) | Checkpointer é a verdade; `stateMachine` recebe transições espelhadas até a Fase 5.


---

## 9. O que **não**muda

- Engines (`HslSceneDirectorAgent`, `HslImageFrameEngine`, `HslFireflyVideoEngine`, `SoundDesignAgent`, `ThumbnailSeoEngine`).
- Gatekeeper, compliance checker, spec (`hsl-spec.ts`), registry.
- Remotion composition e o processo de render em 4 chunks + concat.
- Skills em `.agents/skills/` — continuam sendo o "manual" que os prompts de `plan_enrich` e `auto_heal` referenciam.


---

Se estiver de acordo, o próximo passo é a **Fase 0**: eu verifico as flags reais das CLIs `agy` e `codex` instaladas na sua máquina (você me cola a saída de `agy --help` e `codex exec --help`), e a partir disso fecho os contratos de `prompt.md`/`schema.json` antes de escrever qualquer nó.