# 🏛️ ARQUITETURA TÉCNICA — HIDDEN SYSTEMS LAB (HSL)

## 1. Visão Geral da Arquitetura

O sistema é um pipeline multiagente autônomo baseado em TypeScript, React, Remotion e FFmpeg, integrado com ElevenLabs TTS e Adobe Firefly Video.

```mermaid
flowchart TD
    subgraph INGESTION [1. Ingestão e RAG]
        A[Ideia do Episódio] --> B[Base RAG CONT5_THUMBNAIL_SEO]
    end

    subgraph DIRECTOR [2. Agente Editor de Cenas]
        B --> C[HslSceneDirectorAgent]
        C --> D[scene-plan.json / 96 Beats / 8 Atos]
    end

    subgraph ASSETS [3. Geração Visual Isolada]
        D --> E[HslImageFrameEngine -> public/runs/ID/frames/*.png]
        D --> F[HslFireflyVideoEngine -> public/runs/ID/videos/*.mp4]
    end

    subgraph AUDIO [4. Áudio & Voz]
        D --> G[ElevenLabsNarrationAdapter -> narration.mp3]
        D --> H[SoundDesignAgent -> 576 Camadas Sonoras]
    end

    subgraph RENDER [5. Renderização & Muxing]
        E --> I[Remotion React HslLongFormComposition]
        F --> I
        I --> J[temp_visual.mp4]
        J --> K[FFmpeg Muxer -> Final 1080p Video]
        G --> K
        H --> K
    end

    subgraph PACKAGING [6. Empacotamento]
        D --> L[ThumbnailSeoEngine]
        L --> M[3x Thumbnails 4K + 3x Títulos + SEO Tags]
    end
```

---

## 2. Mapa dos Módulos Principais

- **Agente Diretor de Cenas:** [`hsl/core/hslSceneDirectorAgent.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/hsl/core/hslSceneDirectorAgent.ts)
- **Gerador de Frames 35mm:** [`hsl/core/hslImageFrameEngine.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/hsl/core/hslImageFrameEngine.ts)
- **Orquestrador Firefly Video:** [`hsl/core/hslFireflyVideoEngine.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/hsl/core/hslFireflyVideoEngine.ts)
- **Adaptador ElevenLabs Failover:** [`adapters/elevenLabsNarrationAdapter.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/adapters/elevenLabsNarrationAdapter.ts)
- **Agente de Sound Design:** [`sound-agent/index.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/sound-agent/index.ts)
- **Composição Remotion React:** [`remotion/HslLongFormComposition.tsx`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/remotion/HslLongFormComposition.tsx)
- **Motor de SEO & Thumbnails:** [`hsl/packaging/thumbnailSeoEngine.ts`](file:///c:/Users/brend/OneDrive/Desktop/PROJETO%2030K%20ATE%2027/AGENTES%20-%20ANTIGRAVITY%20-%20HSL/hsl/packaging/thumbnailSeoEngine.ts)
