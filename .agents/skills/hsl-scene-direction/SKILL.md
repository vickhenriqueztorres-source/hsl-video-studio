---
name: hsl-scene-direction
description: >-
  Orquestra a direção editorial e o planejamento cinematográfico de cenas para documentários de 10 a 12 minutos
  (18.000 frames @ 30fps) do canal Hidden Systems Lab (HSL).
  Ative esta skill sempre que o usuário solicitar criação de roteiro, partitura de 8 atos, prompts de câmera 35mm,
  ou planejamento de cenas do zero.
---

# 🎬 HSL Scene Direction & Editorial Architecture Skill

Esta skill encapsula os padrões de **Direção de Cenas e Arquitetura Narrativa** para episódios documentais do canal **Hidden Systems Lab (HSL)**, estruturando 96 beats distribuídos rigorosamente nos **8 Atos Canônicos**.

---

## 🏛️ ESTRUTURA CANÔNICA DOS 8 ATOS (10–12 MINUTOS // 600s)

| Ato | Título Oficial | Duração Alvo | Beats | Foco Narrativo |
| :---: | :--- | :---: | :---: | :--- |
| **01** | `THE HOOK & THE VISIBLE MIRACLE` | 75s | 12 | O fenômeno visível fascinante e a pergunta operacional central. |
| **02** | `THE PHYSICAL ANATOMY & LAYER BREAKDOWN` | 90s | 14 | Dissecação dos componentes de hardware e infraestrutura física. |
| **03** | `THE FLOW DYNAMICS & THROUGHPUT MATH` | 105s | 16 | Dinâmica de fluidos/dados/voltagem e métricas de throughput. |
| **04** | `THE PHYSICAL LIMIT & BOUNDARY CONDITION` | 75s | 12 | A fronteira física de tolerância e a primeira tensão de carga. |
| **05** | `THE BOTTLENECK & STRAIN BREAKDOWN` | 90s | 14 | O nó de estrangulamento que governa todo o sistema. |
| **06** | `THE EMERGENCY WORKAROUND & HIDDEN MARGINS` | 60s | 10 | Protocolos de contingência humana e buffers ocultos. |
| **07** | `SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE` | 60s | 10 | Efeito dominó em cascata e prejuízo operacional em escala. |
| **08** | `ORIGINAL THESIS & SYSTEM ARCHITECTURE` | 45s | 8 | Tese central: o produto oculto que sustenta o visível. |

---

## 🎥 IDENTIDADE VISUAL CANÔNICA: "KINETIC POP-DOCUMENTARY"

- **Tese:** Estética *Apple Keynote + Vox High-Voltage + Kurzgesagt Minimalista*. Cores elétricas saturadas, tipografia monumental em mola e animações 2D ultra-satisfatórias.
- **Paleta Kinetic Velocity:**
  - `[ #0D0E15 ] Obsidian Matte`: Fundo preto carvão moderno fosco universal.
  - `[ #FFE500 ] Electric Acid Yellow`: O vetor de choque visual, retículas e setas de fluxo.
  - `[ #0038FF ] International Klein Blue`: Vetores de rede secundária e gradientes de profundidade.
  - `[ #FF2E00 ] Hyper Orange`: Gargalos, avisos de sobrecarga e placares de atraso.
  - `[ #F4F4F0 ] Off-White Marfim`: Tipografia monumental limpa e elegante em `Inter 900`.
- **Técnica do Infográfico Híbrido:** Para cenas de diagramas, mapas isométricos e cortes 3D, gera-se uma imagem base cinematográfica 35mm e aplica-se animação vetorial ágil no Remotion (física de mola `damping: 12, stiffness: 100`, Ken Burns sutil `1.0 -> 1.05`, tipografia monumental). Elimina a necessidade de vídeos IA pesados nessas seções.

---

## 🚀 DIRETRIZES DE COPYWRITING VIRAL & HOOKS (<5 SEGUNDOS)

1. **Fórmula de Título:** `Sistema + Consequência Extrema + Pergunta de Tensão` (ex: *Why Airports Cannot Run Out of Fuel* / *The Secret Network That Prevents Cities From Freezing*).
2. **Hook de Abertura nos Primeiros 5s:** Mostrar a consequência e o risco de colapso antes de explicar a engrenagem (*"If this system fails for 120 seconds, hundreds of flights are canceled..."*).
3. **Escala & Números Concretos:** Usar valores exatos e monumentais (`100,000 voos`, `52M galões`, `3,800 L/min`, `120 μH`).
4. **Contradições & Paradoxos:** Explorar quebras de expectativa (*"A cidade que tem água mas sofre com seca nas eclusas"*).
5. **Headlines de Thumbnail (1 a 3 palavras):** Frases ultracurtas e complementares que nunca repetem o título (`NO FUEL?`, `BEFORE TAKEOFF`, `IT NEVER STOPS`).
6. **Proibição Rígida de Clichês:** Proibido formato "Top 10" ou introduções passivas.

---

## ⚡ REGRAS DE PACING DINÂMICO & ANTI-REPETIÇÃO (LEI CANÔNICA)

1. **Zero Repetição de Roteiro:** 100% dos 96 beats devem ter textos narrativos progressivos únicos (`RULE_07_NARRATIVE_ANTI_REPETITION`). É estritamente proibido clonar templates de texto entre beats.
2. **Pacing Respiratório (3.0s a 11.0s):** É proibido o ritmo uniforme de metrônomo (6s-6s-6s). Cada ato alterna:
   - *Quick Punch Beats (3.0s - 4.0s):* Cortes rápidos para números de choque, impacto e close em sensores.
   - *Hero Exploration Beats (8.0s - 11.0s):* Explorações aprofundadas de mapas 3D e cortes de tubulação.
3. **Variedade Cinematográfica Obrigatória:**
   - Mínimo de 5 enquadramentos distintos (`EXTREME_WIDE`, `MACRO`, `WIDE`, `CLOSE`, `ISOMETRIC_3D`).
   - Mínimo de 8 movimentos de câmera dinâmicos (`ZOOM_OUT_REVEAL`, `SLOW_DOLLY_IN`, `ISOMETRIC_GLIDE`, `PULSING_ORBIT`, `FAST_WHIP_PAN`, `CAMERA_DRIFT`, `LOCKED_TELEMETRY`).
   - Máximo de 2 beats consecutivos com o mesmo enquadramento.
4. **Classificador Visual Semântico (Fim do Modulo 3):**
   - É expressamente proibido alternar modos visuais por módulo aritmético (`i % 3`).
   - O modo visual deriva estritamente da função narrativa: `firefly_video` para takes de movimento contínuo ao vivo (drones, ambulâncias, carros em alta velocidade) e `generated_image_35mm` para arquétipos infográficos híbridos (cortes 3D, mapas isométricos com luz neon, gauges e placares animados no Remotion).

---

## ⚡ PROCEDIMENTO DE EXECUÇÃO & COMANDOS

```bash
# 1. Planejar novo episódio e executar o pipeline completo:
npm run hsl:master

# 2. Validar integridade física pré-render de 100% dos beats:
npm run hsl:gatekeeper

# 3. Validar conformidade matemática estrita com o PRD:
npm run hsl:compliance
```

---

## 📚 REFERÊNCIAS TÉCNICAS (PROGRESSIVE DISCLOSURE)
- [Framework de Copy Viral & Engenharia de Retenção](./references/viral-copy-framework.md)
- [Arquitetura Editorial e Padrões de Corte](./references/editorial-architecture.md)
- [Diretrizes de RAG Editorial Eugene & Abraham](./references/editorial-rag.md)

