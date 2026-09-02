# 🎬 Remotion Cinematic Sound Design Agent

> **Agente Inteligente de Sound Design Cinematográfico baseado em RAG para Projetos Remotion**

Este agente consome a base de conhecimento RAG especializada em sound design (`rag/`), o catálogo de 269 efeitos sonoros (`public/audio/sfx/`) e as 110 trilhas musicais (`public/audio/music/`) para gerar planos de áudio cinematográficos (`AudioPlan`) e componentes TSX prontos para renderização no Remotion.

---

## 🏛️ Arquitetura do Agente

```text
sound-agent/
├── types/
│   ├── audio-plan.types.ts            # Tipagens do plano de áudio (AudioPlan, SceneAudioPlan, Layers)
│   └── scene-analysis.types.ts        # Tipagens de análise de cena (VisualCues, AudioCues, Moods)
├── analyzer/
│   ├── scene-analyzer.ts              # Analisa metadados, intenções e ambientes da cena
│   └── voice-processor.ts             # Estratégia de EQ, Reverb de sala e Ducking de voz
├── planner/
│   ├── sound-design-planner.ts        # Orquestrador central que aplica regras de decisão RAG
│   └── layer-optimizer.ts             # Otimização em 3 bandas de frequência e prevenção de clipping
├── selector/
│   ├── sfx-selector.ts                # Seletor inteligente do catálogo SFX por categoria e frequência
│   └── music-selector.ts              # Seletor de trilhas orquestrais por mood dramático
├── renderer/
│   ├── remotion-audio-renderer.ts     # Gerador de código React/Remotion (<Audio>, <Sequence>)
│   └── audio-processor.ts             # Processamento DSP (reverb, equalização, reverse) via FFmpeg
├── rag/
│   ├── rag-client.ts                  # Cliente de consulta às regras e chunks RAG
│   └── query-builder.ts               # Construtor de queries semânticas
├── utils/
│   ├── waveform-utils.ts              # Alinhamento de transiente (ápice) e conversão de dB
│   └── frequency-utils.ts             # Validação de colisões de frequência (low/mid/high)
├── index.ts                           # Ponto de entrada e CLI runner
└── README.md
```

---

## 🚀 Como Usar

### 1. Gerar o Plano de Áudio (AudioPlan JSON)
```bash
npm run sound-agent:plan -- --video examples/video-analysis-sample.json --output examples/audio-plan-sample.json
```

### 2. Renderizar o Componente Remotion TSX
```bash
npm run sound-agent:render -- --plan examples/audio-plan-sample.json --output examples/video-audio-sample.tsx
```

### 3. Pipeline Completo (Análise + Plano + Código TSX)
```bash
npm run sound-agent:full -- --video examples/video-analysis-sample.json --output examples/video-audio-sample.tsx
```

### 4. Executar Testes Automatizados
```bash
npm run sound-agent:test
```

---

## 🎯 Regras de Decisão Aplicadas do RAG

1. **Score Primeiro**: Seleciona trilha musical pelo mood emocional para ditar o tempo da cena.
2. **Ambiência Obrigatória**: Toda cena recebe ruído de fundo correspondente para evitar silêncio artificial.
3. **Foley no Visível**: Sons gerados por ações na tela são sincronizados no frame exato.
4. **Riser em Revelações**: Tensão crescente posicionada antes de cortes e mudanças importantes.
5. **Whoosh em Movimento**: Acompanha pans rápidos de câmera e transições dinâmicas.
6. **Hit em Informação**: Marca punchlines e viradas narrativas.
7. **Boom no Clímax**: Sub-impactos graves reservados para os pontos mais altos de energia.
8. **3 Bandas de Frequência**: Camadas balanceadas em Graves, Médios e Agudos com ataques escalonados.
9. **Inteligibilidade da Voz**: Voz priorizada em -12 dB com Ducking automático de -8 dB na trilha.
10. **Reverb de Sala**: Foley e ambiência roteados com reverberação condizente ao ambiente.
11. **Calçamento Triplo**: Transições de música com suporte intermediário + riser + ancoragem.
12. **Moderação (Restraint)**: Evita acentuar todos os momentos para manter a força do clímax.

---

## ⚠️ Limitações Documentadas

- Os valores de decibéis (ex: `-12 dB` diálogo, `-24 dB` trilha, `-2.5 dB` limiter) são parâmetros heurísticos recomendados para equilíbrio sonoro em vídeos digitais.
- Efeitos não mapeados no manifesto de SFX utilizam fallbacks contextuais da mesma família de frequências.
