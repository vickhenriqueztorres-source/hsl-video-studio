# Agentes - Hidden Systems Lab

Atualizado em: 2026-08-21

## Editorial

| Agente | Responsabilidade | Gate de saida |
|---|---|---|
| `ReferenceInsightIngestAgent` | carrega principios editoriais abstratos das aulas, com filtro ASR e sem prosa-fonte | snapshot `reference_only` valido |
| `EugeneRagIngestAgent` | valida o indice Chroma convertido em hashes, conceitos e recibos sem prosa | `EUGENE_RAG_READY` |
| `EugeneRagRetrievalAgent` | recupera conceitos Eugene por etapa da producao | `retrieval_revision` auditavel |
| `AudienceStrategyAgent` | define desejo, consciencia, sofisticacao, angulo, promessa, titulo, thumbnail e progressao | estrategia aprovada |
| `EpisodeBriefAgent` | estrutura pergunta, formato, objeto, sistema e restricao | briefing completo |
| `SystemsResearchAgent` | monta source pack e conflitos entre fontes | tres classes de fonte |
| `ClaimRegistryAgent` | liga cada claim a fonte e evidence status | claims rastreaveis |
| `ThesisAgent` | formula tese, trade-off e interpretacao | tese especifica |
| `CausalModelAgent` | desenha fluxo, interfaces, gargalo e consequencia | hero visual exclusivo |
| `AttentionArchitectureAgent` | define hook, pergunta, loop, payoff e reframe por scene ID | loop fechado e payoff posterior |
| `DocumentaryScriptAgent` | escreve roteiro ingles por relacoes causais | roteiro nao intercambiavel |
| `PhraseOriginalityGate` | compara shingles SHA-256 do roteiro com as referencias | zero correspondencias literais longas |
| `EugeneRagOriginalityGate` | compara titulo e roteiro com fingerprints do RAG | zero correspondencias de 12 palavras |
| `PromiseDeliveryGate` | exige evidencia cedo, alinhamento do hook, payoff e final proporcional a promessa | `PASS` |
| `OriginalitySafetyGate` | calcula score e exige aprovacao humana | score minimo 16 |

## Visual

| Agente | Responsabilidade | Gate de saida |
|---|---|---|
| `HslVisualPlanBuilder` | atribui Remotion, real, Kling e tipografia por cena | plano 16:9 completo |
| `RemotionSystemsAgent` | cria mapas, fluxos, camadas, dados e timelines | composicoes originais |
| `LicensedAssetAgent` | controla origem, licenca e uso de material real | procedencia valida |
| `KlingVisualizationAgent` | gera atmosfera, escala e reconstrucoes | MP4 ilustrativo validado |
| `AiReconstructionQaAgent` | verifica fisica, continuidade e falsa evidencia | QA aprovado |
| `ProvenanceDisclosureGate` | confere claim, fonte, licenca e rotulo | 100% das cenas classificadas |

## Direcao cinematografica e execucao

| Agente | Responsabilidade | Gate de saida |
|---|---|---|
| `NarrativeBeatDirectorAgent` | segmenta o roteiro literal em beats com coverage de 100% e define narrative intent | beats validos sem reescrita |
| `CinematicShotDirectorAgent` | define foco, enquadramento, composicao, lente e intencao de camera | shot contract valido |
| `ContinuityDirectorAgent` | analisa a ordem do episodio, system axis, escala, foco e repeticao | scene sidecar 1.3 valido |
| `SceneChoreographyAgent` | distribui microeventos motivados dentro da cena | coreografia temporal |
| `EditRhythmDirectorAgent` | define energia e duracao planejada | timing valido |
| `TransitionDirectorAgent` | escolhe transicao por continuidade | corte motivado |
| `RemotionChoreographyAgent` | converte intencao visual em cues graficos | cues executaveis |
| `KlingMotionDirectorAgent` | define estado inicial, mudanca, estado final e camera | motion contract image-to-video |
| `CinematicEditQaAgent` | valida todos os campos de execucao | scene contract aprovado |
| `VisualIdentityContractGate` | fixa `HSL_VISUAL_IDENTITY_V2`, paleta semantica, fotografia e referencia minima | prompt e shot contract imutaveis |

Os tres primeiros diretores preservam o pacote editorial em sidecars. O `CinematicExecutionCompiler` e a unica ponte autorizada desses sidecars para contratos de Start Frame, Kling e Remotion.

## Geracao e intake

| Agente | Responsabilidade | Gate de saida |
|---|---|---|
| `StartFrameQaAgent` | valida arquivo, resolucao, aspecto, textura minima e hash | Start Frame fisico valido |
| `StartFrameIdentityGate` | rejeita previs procedural e exige lineage do Reference Set, hash do prompt e fonte fotografica | `HSL_VISUAL_IDENTITY_QA_PASS` |
| `StartFrameContinuityAgent` | valida conjunto de frames por episodio | continuidade tecnica |
| `MotionToFireflyBridge` | preserva start frame e lineage no guia | receipt verificavel |
| `KlingProviderPromptAdapter` | adapta movimento para image-to-video | prompt sem drift semantico |
| `FireflyAdapter` | executa Kling no Firefly e coleta MP4 | jobs externos concluidos |
| `FireflyToIntakeBridge` | valida video e hashes antes da montagem | intake manifest aprovado |
| `KlingSupervisorAgent` | valida sessão, perfil, recibo idempotente, MP4, movimento e orçamento | `hsl.kling-health.v1` aprovado |

## Pos-producao

| Agente | Responsabilidade | Gate de saida |
|---|---|---|
| `RemotionAssemblyAgent` | monta episodio, capitulos e overlays | timeline completa |
| `NarrationVoiceAgent` | gera narracao inglesa ElevenLabs | audio e alinhamento |
| `NarrationPerformanceAgent` | cria sidecar de entrega vocal por papel de atencao | instrucoes fora da fala |
| `DialogLevelingAgent` | normaliza a voz em duas passagens para `-16 LUFS` | WAV PCM estereo 48 kHz |
| `LoudnessQaAgent` | mede loudness integrado, true peak, codec, canais e sample rate | `NARRATION_AUDIO_QA_PASS` |
| `SoundFxDesignAgent` | converte fluxo, alerta, gargalo e mudanca de capitulo em cues motivados | plano SFX aprovado |
| `KenneySoundFxAssetAgent` | valida fontes Kenney CC0 e deriva assinaturas HSL com hashes | assets estereo 48 kHz |
| `SoundFxMixAgent` | posiciona cues na timeline preservando a prioridade da narracao | `soundfx-bed.wav` |
| `SoundFxQaAgent` | valida duracao, densidade, canais, sample rate e procedencia | `SFX_QA_PASS` |
| `SoundDesignAgent` | integra narracao e runtime de SFX na montagem | mix aprovado |
| `TypographyQaAgent` | garante leitura em TV e safe zones | legibilidade aprovada |
| `MonetizationSafetyQaAgent` | revisa originalidade, direitos e disclosure | publicacao autorizada |
| `FinalRenderQaAgent` | valida codec, dimensoes, audio, `ffprobe` e hash | video final verificavel |
| `TitlePackagingAgent` | pareia tres titulos distintos com mecanismo, consequencia e ultima entrega | opcoes de titulo validas |
| `ThumbnailArtDirectorAgent` | transforma promessa, conflito e evidencia em tres conceitos A/B/C | briefs visuais distintos |
| `ThumbnailRenderAgent` | compoe bases aprovadas e tipografia exata em 4K, com preview mobile | tres PNGs verificaveis |
| `YouTubeMetadataAgent` | cria descricao, capitulos, SEO, tags e ponte de serie | metadata coerente com o episodio |
| `PublicationPackagingQaAgent` | valida promessa, diferenca conceitual, legibilidade, lineage e limites tecnicos | `PUBLICATION_PACKAGING_QA_PASS` |
| `HumanSelectionGate` | exige escolha registrada antes de upload ou publicacao | `HUMAN_SELECTION_REQUIRED` ou aprovacao humana |

## Infraestrutura

- `HiddenSystemsLabAdapter`: executa os runtimes editorial e de pos-producao.
- `FireflyAdapter`: fronteira com Adobe Firefly/Kling.
- `AgentTelemetryAdapter`: eventos e auditoria.
- `ControlService`: pausa, emergencia, reconciliacao e backup.
- `ProductionStateMachine`: autoridade sobre estados.
- `CinematicExecutionCompiler`: autoridade sobre contratos executaveis derivados.

## Regra de autonomia

IA pode sugerir, organizar, gerar e validar. Pergunta editorial, tese final, interpretacao, licenca duvidosa e autorizacao de publicacao exigem decisao humana registrada.

Start Frames e dispatch pago possuem duas decisoes humanas separadas. Nenhum agente ou script pode fabricar essas confirmacoes. A aprovacao de Start Frames deve registrar o hash das contact sheets efetivamente revisadas.
