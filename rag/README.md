# 🎧 Sound Design Knowledge RAG Pipeline

> **Base de Conhecimento RAG Especializada em Sound Design Cinematográfico para Remotion e Pós-Produção**  
> **Fontes Originais:** `CONT1.md`, `CONT2-2.md`, `CONT3-3.md`, `CONT4-4.md`

---

## 📁 Estrutura de Diretórios

```text
rag/
  source/            # Arquivos fonte normalizados
  chunks/            # Chunks semânticos estruturados (sound-design-chunks.jsonl)
  index/             # Índices consolidados, vocabulário, regras de decisão e diretrizes de mix
  schemas/           # Schemas JSON formais para chunks e regras de decisão
  scripts/           # Scripts de construção e sincronização (buildRag.ts)
  tests/             # Testes automatizados de integridade e cobertura (rag_integrity.test.ts)
  README.md          # Documentação operacional da base
```

---

## 📊 Cobertura de Categorias & Conhecimento

A base cobre rigorosamente todas as 25 categorias obrigatórias de sound design:
- **Narrativa & Intenção:** `narrative_intent`, `cinematic_style`, `restraint`
- **Trilha & Ritmo:** `score`, `music_editing`, `beat_alignment`
- **Ambiência & Foley:** `ambience`, `foley`, `room_matching`
- **Efeitos de Impacto & Transição:** `riser`, `drone`, `whoosh`, `hit`, `boom`, `reverse_impact`, `transition`, `creative_sound_design`
- **Engenharia & Mixagem:** `frequency_separation`, `voice_processing`, `equalization`, `reverb`, `layering`, `waveform_editing`, `volume_automation`, `mixing`

---

## 🚀 Como Construir e Atualizar o RAG

Para reconstruir todos os índices a partir das fontes:
```bash
npm run rag:build
```

Para validar a integridade semântica, validação de schema e cobertura das 25 categorias:
```bash
npm run rag:test
```

---

## 🔍 Como Consultar o Índice

Você pode carregar o arquivo `rag/index/knowledge-index.json` ou consultar diretamente os chunks em `rag/chunks/sound-design-chunks.jsonl` e as regras de decisão em `rag/index/decision-rules.json`.
