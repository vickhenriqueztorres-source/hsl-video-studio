---
name: hsl-artifact-registry
description: >-
  Orquestra o catálogo central de entregáveis, resolução determinística de handles coláveis (ex: hsl-ep001-v1-master),
  rastreamento de linhagem com hash SHA-256, derivação de novas runs com herança de áudio aprovado e limpeza segura de intermediários.
  Ative esta skill sempre que o usuário solicitar consultar o catálogo de runs, listar áudios reaproveitáveis,
  derivar nova versão de vídeo aproveitando a voz, inspecionar metadados de artefatos ou liberar espaço em disco.
---

# 📦 HSL Artifact Registry & Run Derivation Skill

Esta skill governa o **Catálogo Central de Entregáveis (Registry)**, a identidade imutável de runs e o motor de derivação de versões do ecossistema **Hidden Systems Lab (HSL)**.

---

## 🏷️ IDENTIDADE HIERÁRQUICA & HANDLES COLÁVEIS

Todo artefato entregável recebe um handle curto colável e um ID hierárquico imutável:

```text
[ IDENTIFICADORES CANÔNICOS ]
├── Run ID Estrutural:   hsl/ep001/v1 (Namespace isolado por projeto e versão)
├── Handle Master Vídeo: hsl-ep001-v1-master
├── Handle Narração:     hsl-ep001-v1-audio (Com hash SHA-256 persistido)
├── Handle Thumbnails:   hsl-ep001-v1-thumb-a, hsl-ep001-v1-thumb-b, hsl-ep001-v1-thumb-c
└── Handle Publicação:   hsl-ep001-v1-pkg
```

---

## 🧬 MOTOR DE DERIVAÇÃO COM HERANÇA DE ÁUDIO

Para recriar um vídeo visual do zero aproveitando a narração já aprovada sem gastar créditos de voz:

1. **Validação Prévia:** O áudio de origem é verificado via `ffprobe` e `sha256`.
2. **Cópia Atômica:** O arquivo é copiado para a nova versão (`runs/hsl/ep001/v2/narration.mp3`).
3. **Checagem de Integridade:** `sourceSha256 === targetSha256` obrigatório.
4. **Validação de Duração:** O novo plano de cenas DEVE ter duração compatível com o áudio (`|plan - audio| <= 5.0s`).
5. **Zero Vazamento Visual:** A nova run inicia com as pastas `frames/` e `videos/` 100% vazias para geração limpa.
6. **Registro de Linhagem:** A herança é gravada em `run-manifest.json` e no `registry/registry.json`.

---

## 🧹 LIMPEZA SEGURA DE INTERMEDIÁRIOS

O comando de limpeza remove apenas frames e takes transitórios (`public/runs/.../frames/*.png` e `videos/*.mp4`), liberando centenas de megabytes.
- **Bloqueio de Segurança:** Proibido rodar em runs incompletas ou com status diferente de `COMPLETED`.
- **Entregáveis Protegidos:** `narration.mp3`, `out/*.mp4`, `thumbnails/*.png`, `publication-package.json` e `scene-plan.json` são 100% preservados.

---

## ⚡ PROCEDIMENTO DE EXECUÇÃO & COMANDOS CLI

```bash
# 1. Listar todas as runs e handles do catálogo:
npm run hsl:registry -- list

# 2. Inspecionar metadados completos (ffprobe, SHA-256 e linhagem) de um handle:
npm run hsl:registry -- inspect hsl-ep001-v1-master

# 3. Resolver handle para caminho absoluto no disco:
npm run hsl:registry -- resolve hsl-ep001-v1-audio

# 4. Listar apenas áudios aprovados e reaproveitáveis:
npm run hsl:registry -- audios

# 5. Derivar nova versão de vídeo herdando o áudio da v1:
npm run hsl:derive -- --from=hsl-ep001-v1-audio

# 6. Limpar intermediários de uma run concluída:
npm run hsl:clean -- hsl/ep001/v1

# 7. Reconstruir o catálogo a partir do disco:
npm run hsl:registry -- rebuild
```

---

## 📚 ESPECIFICAÇÃO & REGISTRY
- Arquivo do Catálogo: [`registry/registry.json`](../../registry/registry.json)
- Módulo de Identidade: [`hsl/core/hslRunIdentity.ts`](../../hsl/core/hslRunIdentity.ts)
- Motor de Derivação: [`hsl/core/hslRunDerivator.ts`](../../hsl/core/hslRunDerivator.ts)
