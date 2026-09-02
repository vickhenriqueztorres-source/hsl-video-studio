---
name: hsl-master-pipeline
description: >-
  Orquestra a execução end-to-end do pipeline documental HSL, governando o ciclo de vida dos 11 estágios,
  a validação transacional do manifesto (run-manifest.json), a auto-cura pré-render (Gatekeeper) e o gate final de conformidade do PRD.
  Ative esta skill sempre que o usuário solicitar gerar novo episódio, rodar o master orchestrator, verificar integridade do pipeline,
  retomar execução ou debugar bloqueios de render.
---

# 🚀 HSL Master Pipeline & Resilient Orchestration Skill

Esta skill governa o fluxo de execução ponta a ponta do canal **Hidden Systems Lab (HSL)**, garantindo resiliência transacional, auto-cura de assets e zero tolerância a falhas silenciosas.

---

## 🔄 CICLO DE VIDA DOS 11 ESTÁGIOS CANÔNICOS

```text
[ MASTER ORCHESTRATOR PIPELINE ]
├── 01. STAGE_01_SCENE_PLAN      ➔ Planejamento do zero via HslSceneDirectorAgent (8 Atos // 96 beats)
├── 02. STAGE_02_IMAGE_FRAMES    ➔ Geração e validação física de frames 35mm (HslImageFrameEngine)
├── 03. STAGE_03_FIREFLY_VIDEOS  ➔ Processamento e download de takes MP4 (HslFireflyVideoEngine)
├── 04. STAGE_04_NARRATION       ➔ Síntese de voz Chris com pool de failover (ElevenLabsAdapter)
├── 05. STAGE_05_SOUND_DESIGN    ➔ Orquestração multi-camada de áudio e foley (SoundDesignAgent)
├── 06. STAGE_06_PRE_RENDER_GATE ➔ [BLOQUEANTE] Varredura física e auto-cura de 100% dos assets no disco
├── 07. STAGE_07_REMOTION_RENDER ➔ Renderização visual HslLongFormComposition em 1080p Full HD
├── 08. STAGE_08_PRE_MUX_GATE    ➔ [BLOQUEANTE] Comparação rigorosa de duração visual vs áudio (≤ 5.0s)
├── 09. STAGE_09_FFMPEG_MUX      ➔ Muxing final de áudio master (voz + trilha ducked a -28dB)
├── 10. STAGE_10_PACKAGING       ➔ Geração de 3 Thumbnails 4K multivariáveis e pacote SEO YouTube
└── 11. STAGE_11_PRD_COMPLIANCE  ➔ [BLOQUEANTE] Auditoria matemática estrita de conformidade com o PRD
```

---

## 🛡️ GATES DETERMINÍSTICOS & AUTO-CURA

1. **Pre-Render Gatekeeper (`hsl/core/hslValidationGatekeeper.ts`):**
   - Executa `existsSync()`, checagem de tamanho mínimo (>10KB MP4, >5KB PNG) e decodificação `ffprobe`.
   - Se faltar qualquer asset, dispara autonomamente a auto-cura antes de declarar bloqueio.
   - Atualiza atomicamente `HSL_EXECUTION_STATE.json`.
2. **Pre-Mux Gate:**
   - Compara `|visualDuration - audioDuration| <= 5.0s`.
   - Aborta imediatamente o FFmpeg se houver dessincronia excessiva.
3. **PRD Compliance Gate (`spec/hsl-compliance-checker.ts`):**
   - Retorna `exit(1)` se qualquer regra inegociável for violada. O entregável só é liberado com 100% `PASS`.

---

## ⚡ PROCEDIMENTO DE EXECUÇÃO & COMANDOS CLI

```bash
# 1. Executar o Master Pipeline completo:
npm run hsl:master

# 2. Executar apenas a validação física pré-render (Gatekeeper com Auto-Cura):
npm run hsl:gatekeeper

# 3. Executar o validador de contrato de todos os beats:
npm run hsl:verify

# 4. Executar a auditoria determinística de conformidade do PRD:
npm run hsl:compliance
```

---

## 📚 ESPECIFICAÇÃO & CONTRATOS
- Autoridade Numérica: [`spec/hsl-spec.ts`](../../spec/hsl-spec.ts)
- Documento Mestre: [`docs/HSL_MASTER_PRD_ARCHITECTURE_BRIEFING.md`](../../docs/HSL_MASTER_PRD_ARCHITECTURE_BRIEFING.md)
