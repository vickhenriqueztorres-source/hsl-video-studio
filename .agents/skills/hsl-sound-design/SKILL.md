---
name: hsl-sound-design
description: >-
  Orquestra o Sound Design imersivo multi-camadas, síntese de narração ElevenLabs (voz Chris) com ducking dinâmico,
  trilha sonora de suspense atenuada (-28dB) e sound effects táteis da biblioteca Kenney CC0 para o canal Hidden Systems Lab (HSL).
  Ative esta skill sempre que o usuário solicitar mixagem de áudio, sound design, trilha de fundo, efeitos sonoros ou narração.
---

# 🎧 HSL Sound Design & Audio Architecture Skill

Esta skill orquestra o pipeline sonoro profissional do canal **Hidden Systems Lab (HSL)**, garantindo uma assinatura de áudio imersiva e cinematográfica inspirada em documentários industriais de alta tensão.

---

## 🔊 ARQUITETURA SONORA MULTI-CAMADAS

```text
[ MASTER AUDIO TIMELINE (1080p @ 30fps) ]
├── Camada 1: Narração Master (ElevenLabs Voz Chris // Volume 1.0 // -12dB a -16dB LUFS)
├── Camada 2: Trilha Sonora Suspense (Cinematic Gloom // Volume 0.045 // Ducking -28dB contínuo)
├── Camada 3: Ambiência Industrial (Refinaria, fluxo de cabos, vento de alta altitude)
└── Camada 4: Foley & Cues de Impacto (Kenney CC0 // Transições, rupturas e cliques de relé)
```

---

## 🎚️ DIRETRIZES DE MIXAGEM & DUCKING

1. **Narração Chris (ElevenLabs Multilingual v2):**
   - Timbre: Analítico, sóbrio, cirúrgico, sem afetações emotivas artificiais.
   - Posição: Centro absoluto, ganho fixo em `1.0`.
2. **Trilha Sonora Suspense (`assets/audio-library/music/`):**
   - Deve permanecer em segundo plano constante como um "teto de pressão subconsciente".
   - Atenuação obrigatória no FFmpeg mix: `volume=0.04` a `0.045`.
3. **Sound Effects Kenney CC0 (`assets/soundfx/kenney/`):**
   - Inserção precisa alinhada aos frames de transição visual de atos e revelação de gargalos.

---

## ⚡ PROCEDIMENTO DE EXECUÇÃO & COMANDOS

```bash
# 1. Planejar camadas sonoras do episódio:
npm run sound-agent:plan

# 2. Executar pipeline completo de sound design:
npm run sound-agent:full

# 3. Testes unitários do motor sonoro:
npm run sound-agent:test
```

---

## 📚 REFERÊNCIAS DO RAG SONORO (PROGRESSIVE DISCLOSURE)
- [Diretrizes de Foley e Ambientes Industriais](./references/CONT1.md)
- [Design de Picos de Tensão e Quedas Causal](./references/CONT2.md)
- [Catálogo de Efeitos e Mapeamento Kenney](./references/CONT3.md)
- [Matriz de Ducking e Equalização](./references/CONT4.md)
