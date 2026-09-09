# Integração de HSL e BRECHA no mesmo workflow

Análise de código e proposta de implementação — 8 de setembro de 2026.

Escopo realizado: inspeção estática do HSL Studio e dos materiais em `C:/Users/Paulo R Advocacia/Downloads/canalbrecha-main/canalbrecha-main`. Este documento é uma proposta: a seleção de canal ainda não foi implementada. Não houve geração de mídia, execução de provedores ou alteração de episódios existentes.

Prioridade definida posteriormente pelo usuário: primeiro implementar e validar o squad de motion autoral no HSL, conforme `PLANO-SQUAD-MOTION-AUTORAL.md`; depois iniciar a integração BRECHA descrita abaixo.

## Decisão recomendada

Manter um único grafo de produção LangGraph em TypeScript e acrescentar um perfil de canal selecionado no início de cada episódio. Os mesmos agentes e serviços executam as etapas, recebendo as instruções editoriais, visuais e sonoras do canal escolhido.

A operação desejada é: **Novo vídeo → Canal HSL/BRECHA → Tema → Configuração de produção → Executar**. O canal fica vinculado àquela produção e acompanha retomadas, revisões e entregáveis.

O projeto BRECHA fornecido contém documentação estratégica, identidade, referências e exemplos visuais; não contém outro motor de produção que precise ser fundido ao HSL. Sua integração consiste em transformar as diretrizes aprovadas em configuração e comportamento dos agentes existentes.

## O que o código atual mostra

| Área | Evidência local | Consequência para a integração |
|---|---|---|
| Orquestração principal | `graph/production/graph.ts`, registrado em `graph/langgraph.json` | Já reúne geração, revisão, retomada, vídeo, áudio, render, gates e arquivo; é a base recomendada. |
| Outra entrada LangGraph | `hsl_langgraph/graph.py` e `hsl_langgraph/bridge.py` | Há também um grafo Python que chama estágios TypeScript. Alterar apenas esse caminho não cobre o console Matrix. |
| Estado | `graph/production/state.ts` | Não existe identidade explícita de canal; os valores iniciais assumem HSL. |
| Seleção de pauta | `graph/console/cli.ts` e `themeRegistry.ts` | O fluxo de novo episódio usa catálogo HSL, títulos em inglês e IDs `HSL_EPISODE_NNN`. |
| Direção editorial | `graph/production/deps.ts`, `hsl/core/hslSceneDirectorAgent.ts`, `hsl/editorial/topicStoryboards.ts` | O nó usa um diretor com storyboards predefinidos e fallback universal. O nome “agent” não significa geração editorial livre por LLM nesta etapa. |
| Prompts e revisão | `graph/production/nodes/visual_prompts.ts` e `graph/prompts/` | Contexto e instruções ainda remetem ao universo industrial HSL. Geração, reparo e revisão precisam receber o mesmo perfil. |
| Voz | `graph/production/nodes/narration.ts` | Chama o provedor com texto e caminho, sem selecionar voz pelo canal. O cache verifica texto/arquivo, mas não usa a configuração desejada da voz como chave. |
| Adapter de narração | `adapters/elevenLabsNarrationAdapter.ts` | Aceita `voiceId` e modelo, mas seu fallback Edge TTS fixa `en-US-ChristopherNeural`. |
| Render | `graph/production/lib/remotion.ts`, `remotion/HslLongFormComposition.tsx` | Composição e cabeçalho HSL estão fixados; é preciso transmitir a identidade ao render. |
| Embalagem | `graph/production/nodes/packaging.ts`, `hsl/packaging/thumbnailSeoEngine.ts` | Existem textos, conceitos e marca Hidden Systems Lab fixados. A validade do cache também precisa considerar canal e perfil. |
| Regras | `spec/hsl-spec.ts`, `spec/hsl-compliance-checker.ts` | Constantes misturam requisitos técnicos e decisões editoriais HSL, como atos, duração, paleta e voz. |
| Persistência | `graph/production/runner.ts`, `state.ts`, `hsl/core/hslRunManifest.ts` | Episódio identifica checkpoint e diretórios; falta vinculação explícita a um perfil de canal versionado. |

O ponto de maior trabalho é a direção editorial. Acrescentar `channelId` sem modificar o planejamento ainda permitiria gerar um vídeo com estrutura, linguagem ou identidade HSL sob o nome BRECHA.

## O que compartilhar e o que parametrizar

| Compartilhar | Configurar pelo canal |
|---|---|
| Grafo, retries, checkpoints e telemetria | Nome, idioma, público e promessa editorial |
| Integrações de imagem e Firefly/Kling | Instruções de geração, reparo, revisão e continuidade |
| Síntese, normalização e mixagem de áudio | Voz, idioma de fallback, interpretação e direção sonora |
| Mecânica de timeline, Remotion e FFmpeg | Paleta, fontes, cabeçalhos, overlays e assinatura visual |
| Validação de arquivos, codecs, duração e sincronismo | Critérios editoriais, proporção de mídia e narrativa |
| Infraestrutura de catálogo e armazenamento | Identidade e organização de episódios por canal |
| Mecânica de geração A/B/C e exportação | Títulos, thumbnails, descrição, idioma e marca |

## Perfil BRECHA derivado dos materiais

Fontes prioritárias: `outputs/brecha-brand-bible-v1.md` e `outputs/brecha-pesquisa-avancada-montagem.md`, dentro do projeto BRECHA. Os documentos de benchmark servem como referência de princípios; frames de terceiros não devem entrar no pacote de ativos publicáveis, conforme o README fornecido.

- Posicionamento: documentários brasileiros de defesa cotidiana sobre golpes, fraudes e manipulação.
- Idioma público: português brasileiro, inclusive narração, títulos, capítulos e textos de tela. Prompts técnicos podem permanecer em inglês quando útil ao provedor.
- Voz editorial: calma, próxima e precisa, sem culpabilizar a vítima; referência de 150–165 palavras por minuto. O material não define um `voiceId` de produção.
- Progressão: familiaridade, dúvida, tensão, revelação e capacidade de ação.
- Assinatura narrativa: “Momento da Brecha”, identificando o ponto em que a sequência poderia ser interrompida.
- Paleta: carvão `#0D0D0F`, osso `#E8E2D7`, cinza `#6E6B68`, coral `#FF5A47`, verde-azulado `#4F9B96` e menta `#BCD5C2`.
- Gramática visual: cotidiano brasileiro, reconstrução contínua, evidência real identificada, diagramas progressivos e fenda coral usada na revelação.
- Regra editorial: “IA representa. Evidência confirma.” O contrato de cena precisa distinguir reconstrução de evidência e carregar fonte, data e procedência quando aplicável.
- Duração: a brand bible indica 9–12 minutos; o estudo específico de montagem trabalha com 10–12 minutos. Recomendo começar em 10–12, faixa comum aos dois documentos e próxima do motor atual, com duração configurável.

O documento `decisao-formato-validado-canal.md` descreve também um formato de rastreamento causal de 12–16 minutos. Não deve ser combinado automaticamente com a identidade específica BRECHA: o pacote contém estudos de alternativas, além da definição da marca.

## Contrato proposto

Criar `channels/types.ts`, `channels/registry.ts`, `channels/hsl/` e `channels/brecha/`. Levar para o projeto apenas as referências necessárias, registrando origem e versão, sem depender permanentemente da pasta Downloads.

Exemplo conceitual; não é API implementada:

```ts
interface ChannelProfile {
  id: 'hsl' | 'brecha';
  version: string;
  displayName: string;
  locale: 'en-US' | 'pt-BR';
  editorial: EditorialPolicy;
  visual: VisualIdentity;
  narration: NarrationPolicy;
  packaging: PackagingPolicy;
  compliance: EditorialCompliancePolicy;
}

interface RunChannelSnapshot {
  channelId: ChannelProfile['id'];
  profileVersion: string;
  profileHash: string;
  profile: ChannelProfile;
}
```

Esses tipos de políticas representam contratos a definir durante a implementação. O snapshot deve conter dados serializáveis, sem funções, credenciais ou clientes de provedores. Adapters e segredos continuam nas dependências de execução.

Resolver e validar o perfil antes do primeiro planejamento. Persistir o snapshot no estado e no manifesto; passar os trechos pertinentes a cada agente. A seleção é determinística, feita pelo usuário, sem precisar de um agente LLM para decidir o canal.

O perfil deve ser obrigatório em novas produções multicanal. Canal desconhecido precisa gerar erro explícito; somente produções antigas identificadas como HSL recebem a compatibilidade legada.

## Persistência, retomada e caches

1. Conservar IDs e caminhos das produções HSL existentes. Novos episódios BRECHA podem usar `BRECHA_EPISODE_001`, com numeração independente. Isso preserva inicialmente a estrutura plana `runs/<episodeId>` que o console já lê.
2. Manter o `thread_id` das produções antigas. Para novas produções, usar uma identidade única que inclua canal e execução ou derivá-la de um ID globalmente único. Não alterar indiscriminadamente `STATE_VERSION`: hoje ela participa da chave do checkpoint.
3. Na retomada, carregar o perfil persistido. Recusar tentativa de trocar o canal da mesma produção; mudança de canal cria nova execução.
4. Incluir nos fingerprints os inputs que afetam cada artefato: perfil visual e prompts nas imagens, texto/voz/modelo/parâmetros na narração, identidade visual e assets no render, perfil e conteúdo no pacote de publicação.
5. Atualizar os caches de `scene_plan`, `visual_prompts`, `narration`, `renderIdentity`, `packaging` e `compliance`. Um arquivo existir e ser decodificável não comprova que pertence ao perfil solicitado.
6. Filtrar catálogo, histórico, sugestões e verificação de pautas duplicadas por canal. Separar referências editoriais específicas e compartilhar apenas princípios gerais deliberadamente selecionados.
7. Testar retomadas antigas que já passaram do início do grafo: elas não executarão necessariamente um novo nó de resolução. A camada de compatibilidade precisa atender também esses estados.

Essa proposta segue a distinção oficial entre checkpoints por thread e dados compartilhados. Alterações do grafo também afetam execuções retomadas; campos e nós existentes devem ser preservados ou migrados de forma compatível. Referências: [persistência LangGraph](https://docs.langchain.com/oss/javascript/langgraph/persistence) e [compatibilidade de execuções em andamento](https://docs.langchain.com/oss/javascript/langgraph/backward-compatibility).

## Ordem de implementação

1. **Identidade e compatibilidade:** registry de canais, validação, snapshot, manifesto, identidade de execução e leitura dos estados antigos. Acrescentar `--channel` na entrada TypeScript e seleção de canal no Matrix; dashboard exibe e filtra o canal.
2. **Planejamento e conteúdo:** manter o comportamento HSL e introduzir estratégia editorial BRECHA por meio da mesma interface de planejamento. Suportar roteiro/plano aprovado e geração estruturada por agente com validação; não preencher episódios com frases genéricas repetidas. Fontes e reconstruções precisam estar representadas no contrato antes da geração visual.
3. **Agentes visuais:** transmitir perfil para planejamento de prompts, revisão, reparo e QA de imagens. Manter providers e mecanismos de retry compartilhados.
4. **Áudio:** passar voz/modelo/parâmetros por canal, configurar fallback compatível com português e ampliar a identidade do cache. Uma voz ainda não definida deve ser resolvida antes de síntese, sem substituição silenciosa pelo narrador inglês.
5. **Render e embalagem:** identidade visual nas props, componentes reutilizáveis para evidências e Momento da Brecha, títulos/descrições em português e thumbnails coerentes com o canal. Manter o pipeline de render e exportação.
6. **Conformidade:** separar requisitos técnicos compartilhados de regras editoriais por canal; validar idioma, branding, procedência e identificação de reconstruções.
7. **Entradas alternativas:** encaminhar as opções de canal no master CLI, grafo Python e bridge, ou limitar essas entradas explicitamente a HSL até sua adaptação. Nenhuma entrada pode aceitar BRECHA e produzir HSL silenciosamente.

Não é necessário renomear toda a árvore `hsl/` para atingir o objetivo. A separação dos contratos e do comportamento é mais importante que os nomes internos; renomeações amplas podem ocorrer posteriormente, se úteis.

## Critérios de conclusão

- Selecionar HSL mantém pauta, voz, identidade e funcionamento já existentes.
- Selecionar BRECHA produz roteiro, textos de tela e pacote em português, com a identidade da marca em todas as etapas pertinentes.
- Dois episódios com o mesmo número em canais distintos não compartilham checkpoint, catálogo ou artefatos por acidente.
- Retomar um episódio conserva a versão do perfil com que começou, mesmo depois de editar o cadastro de canais.
- Mudar voz ou perfil visual invalida os caches correspondentes.
- Um checkpoint HSL anterior à mudança continua recuperável e executável.
- O revisor distingue documento real de reconstrução e verifica as referências exigidas pelo plano.
- Uma execução curta de integração valida o caminho BRECHA até render e packaging; testes com dependências simuladas cobrem propagação e isolamento antes de usar provedores reais.

Esta análise não executou testes de runtime e não certifica a saúde completa do pipeline atual. O repositório contém diversas alterações locais anteriores; a implementação deve preservar esse trabalho e validar uma base de comparação antes das mudanças.
