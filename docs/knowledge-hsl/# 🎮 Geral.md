# 🎮 Orquestrador 

***

## 🎯 O Que é um Orquestrador?

É o **chefe dos agentes** que coordena tudo para o vídeo sair perfeito.

```
┌──────────────────────────────────────┐
│         ORQUESTRADOR (CHEFÃO)        │
│                                      │
│  "Eu mando em todo mundo aqui!"      │
└──────────────────────────────────────┘
         │    │    │    │
         ▼    ▼    ▼    ▼
      Agente Agente Agente Agente
        1      2      3      4
```

***

## 📋 Estrutura Simples (5 Peças)

### 1. **Lista de Tarefas** 📝

```typescript
const tarefas = [
  "Escolher tema",      // 1
  "Escrever roteiro",   // 2
  "Fazer imagens",      // 3
  "Fazer vídeos",       // 4
  "Fazer áudio",        // 5
  "Juntar tudo",        // 6
  "Criar thumbnail"     // 7
];
```

**Visual:**
```

 ✅    ✅    🔄    ⏳    ⏳    ⏳    ⏳
```

***

### 2. **Checkpoints (Salve do Jogo)** 💾

Cada vez que termina uma tarefa, **salva o progresso**.

```typescript
checkpoint "tema_escolhido"     // SALVO! ✅
checkpoint "roteiro_pronto"     // SALVO! ✅
checkpoint "imagens_feitas"     // SALVO! ✅
```

**Se der erro no meio:**
```
 ✅    ✅    ✅    ❌    ⏳    ⏳    ⏳
           └─┘
         Volta aqui!
         Não perde tudo!
```

***

### 3. **Estado Atual** 📊

O orquestrador sempre sabe **onde está**:

```typescript
const estado = {
  projeto: "brecha-0001",
  tarefaAtual: 3,
  status: "rodando",  // ou "esperando", "erro", "pronto"
  erros: [],
  tempoInicio: "10:00",
  tempoFim: null
};
```

**Visual tipo barra de progresso:**
```
████████░░░░░░░░ 3/7 (30%)
```

***

### 4. **Retry (Tentar de Novo)** 🔄

Se um agente falha, tenta de novo (até 3x):

```typescript
if (agente.erro) {
  if (tentativas < 3) {
    tentarDeNovo();  // 🔄
  } else {
    pararE Avisar(); // ❌
  }
}
```

**Visual:**
```
Tentativa 1: ❌
Tentativa 2: ❌
Tentativa 3: ✅  (passou!)
```

***

### 5. **Logs (Histórico)** 📜

Tudo que acontece é **anotado**:

```typescript
logs = [
  "10:00 - Iniciando projeto",
  "10:01 - Tema escolhido: 'Golpe do PIX'",
  "10:02 - Roteiro aprovado",
  "10:03 - Imagens: ERRO na imagem #3",
  "10:04 - Imagens: retry #1",
  "10:05 - Imagens: SUCESSO!"
];
```

**Visual tipo chat:**
```
🕐 10:00  ✅ Iniciando
🕐 10:01  ✅ Tema escolhido
🕐 10:02  ✅ Roteiro pronto
🕐 10:03  ❌ Erro imagem #3
🕐 10:04  🔄 Tentando de novo...
🕐 10:05  ✅ Imagem #3 OK!
```

***

## 🎮 Analogia do Videogame

| Conceito | Videogame | Orquestrador |
|----------|-----------|--------------|
| **Fases** | Level 1, 2, 3... | Agente 1, 2, 3... |
| **Checkpoint** | Ponto de save | Salva estado |
| **Game Over** | Morreu | Erro crítico |
| **Retry** | Continuar do save | Retry automático |
| **Speedrun** | Zerador rápido | Paralelização |
| **Save file** | Arquivo .sav | Banco SQLite |

***

## 🧩 Código Super Simples

```typescript
class Orquestrador {
  constructor() {
    this.tarefas = [];
    this.checkpoint = 0;
    this.estado = "parado";
  }

  async rodar() {
    this.estado = "rodando";
    
    for (let i = 0; i < this.tarefas.length; i++) {
      console.log(`Tarefa ${i + 1} de ${this.tarefas.length}`);
      
      try {
        await this.tarefas[i].executar();
        this.salvarCheckpoint(i);  // 💾 Salva!
      } catch (erro) {
        console.log("❌ Errou!");
        this.tentarDeNovo(i);      // 🔄 Retry
      }
    }
    
    this.estado = "pronto";
    console.log("✅ Terminou!");
  }

  salvarCheckpoint(i) {
    console.log(`💾 Checkpoint ${i} salvo!`);
  }

  async tentarDeNovo(i) {
    for (let vez = 0; vez < 3; vez++) {
      console.log(`🔄 Tentativa ${vez + 1}`);
      try {
        await this.tarefas[i].executar();
        return;  // Passou!
      } catch {
        console.log("❌ Falhou de novo");
      }
    }
    throw new Error("Game Over!");
  }
}
```

***

## 🎯 Resumo Visual

```
┌─────────────────────────────────────┐
│        ORQUESTRADOR                 │
│                                     │
│  1. Lista tarefas  →   │
│  2. Checkpoints    → 💾💾💾💾        │
│  3. Estado atual   → "rodando 3/4"  │
│  4. Retry (3x)     → 🔄🔄🔄          │
│  5. Logs           → 📜📜📜          │
└─────────────────────────────────────┘
```

***

## ✅ Checklist Mental

Para montar um orquestrador, precisa de:

- [ ] Lista de tarefas (array)
- [ ] Salvar checkpoint (banco/arquivo)
- [ ] Saber estado atual (objeto)
- [ ] Retry (loop com limite)
- [ ] Logs (array de strings)

***

## 🧠 Dica para TDAH

**Pensa assim:**

> "Orquestrador é só um **lista de tarefas com save automático**."

Nada mais que isso!

***



# 🎓 Como Treinar Agentes 
Vou explicar **direto, visual e com exemplos**.

***

## 🧠 O Que é "Treinar" um Agente?

É ensinar o agente a **fazer uma tarefa específica** dando:

1. **Exemplos** (mostre como faz)
2. **Regras** (o que pode/não pode)
3. **Feedback** (acertou ✅, errou ❌)

***

## 📚 Melhores Tipos de Conteúdo

### 1. **Prompt + Resposta Esperada** ⭐ (O MELHOR)

**Formato:**
```json
{
  "tarefa": "Escolher tema viral",
  "entrada": {
    "nicho": "segurança digital",
    "publico": "topo de funil"
  },
  "saida_esperada": {
    "tema": "Golpe do PIX que ninguém conhece",
    "score_viral": 0.87,
    "justificativa": "Medo + curiosidade + mecanismo oculto"
  }
}
```

**Por que funciona:**
- Mostra **exatamente** o que esperar
- Fácil de validar (certo/errado)
- Agente aprende o **padrão**

***

### 2. **Passo a Passo (Workflow)** 📋

**Formato:**
```markdown
# Como escolher tema viral

1. Pegue o nicho do canal
2. Liste 10 ideias
3. Score cada ideia:
   - Medo: 0-1
   - Curiosidade: 0-1
   - Mecanismo oculto: 0-1
4. Escolha a maior soma
5. Justifique
```

**Visual:**
```
Entrada → [Processo] → Saída
  ↓         ↓  ↓  ↓       ↓
Nicho    1  2  3  4     Tema
```

***

### 3. **Exemplos de Acerto/Erro** ✅❌

**Formato:**
```markdown
## ✅ EXEMPLO BOM

Tema: "Como golpistas criam autoridade falsa"
Score: 0.92
Por que: Tem medo + curiosidade + revelação

## ❌ EXEMPLO RUIM

Tema: "Dicas de segurança"
Score: 0.34
Por que: Genérico, sem emoção, óbvio
```

**Por que funciona:**
- Mostra **contraste** (bom vs ruim)
- Explica **o porquê**
- Fácil de memorizar

***

### 4. **Regras em Formato de Lista** 📜

**Formato:**
```markdown
## Regras para Temas Virais

✅ PODE:
- Usar medo e curiosidade
- Revelar mecanismos ocultos
- Mostrar consequências reais

❌ NÃO PODE:
- Ser genérico ("dicas de segurança")
- Prometer o que não entrega
- Usar clickbait vazio
- Inventar informações
```

**Visual:**
```
✅  ✅  ✅  ✅  ✅
❌  ❌  ❌
```

***

### 5. **Casos de Teste (Testes)** 🧪

**Formato:**
```typescript
// Teste 1: Tema com medo alto
{
  input: { nicho: "segurança", emocao: "medo" },
  expected: { score: 0.85, tema: "..." }
}

// Teste 2: Tema genérico
{
  input: { nicho: "segurança", emocao: "neutro" },
  expected: { score: 0.30, tema: "..." }
}
```

**Por que funciona:**
- Testa **cenários reais**
- Valida se aprendeu
- Automatizável

***

## 📦 Formatos de Arquivo

### 1. **JSON** (Melhor para dados) ⭐

```json
{
  "agentes": [
    {
      "nome": "TopicScout",
      "tarefa": "Escolher tema viral",
      "exemplos": [
        {
          "entrada": { "nicho": "segurança" },
          "saida": { "tema": "Golpe do PIX" }
        }
      ]
    }
  ]
}
```

**Vantagens:**
- Estruturado
- Fácil de validar
- Reutilizável

***

### 2. **Markdown** (Melhor para texto) 📝

```markdown
# Agente: TopicScout

## Missão
Escolher temas virais para YouTube.

## Exemplos

### ✅ Bom
Tema: "Como golpistas criam autoridade falsa"
Score: 0.92

### ❌ Ruim
Tema: "Dicas de segurança"
Score: 0.34
```

**Vantagens:**
- Legível por humanos
- Fácil de editar
- Bom para documentação

***

### 3. **YAML** (Bom para config) ⚙️

```yaml
agente: TopicScout
tarefa: Escolher tema viral
regras:
  - usar_medo: true
  - usar_curiosidade: true
  - generico: false
exemplos:
  - tema: "Golpe do PIX"
    score: 0.87
```

***

### 4. **CSV** (Bom para tabelas) 📊

```csv
tema,score_viral,medo,curiosidade,mecanismo
"Golpe do PIX",0.87,0.9,0.8,0.9
"Dicas de segurança",0.34,0.2,0.3,0.1
```

***

## 🎯 Estrutura Ideal de Treinamento

```
treinamento/
├── topic-scout/
│   ├── exemplos.json        # 50-100 exemplos
│   ├── regras.md            # Regras em texto
│   ├── testes.ts            # Casos de teste
│   └── workflow.md          # Passo a passo
├── copywriter/
│   ├── exemplos.json
│   ├── regras.md
│   ├── testes.ts
│   └── workflow.md
└── ...
```

***

## 📊 Quantidade de Exemplos

| Tipo de Agente | Mínimo | Ideal | Excelente |
|----------------|--------|-------|-----------|
| Simples (escolher tema) | 10 | 30 | 50+ |
| Médio (escrever roteiro) | 20 | 50 | 100+ |
| Complexo (editar vídeo) | 50 | 100 | 200+ |

***

## 🧪 Como Validar se Aprendeu

### Teste com **Entrada Nova**

```typescript
// Entrada que o agente NUNCA viu
const entrada = {
  nicho: "finanças",
  publico: "iniciantes"
};

// Se o agente learned mesmo, vai gerar:
const saida = {
  tema: "O erro que te deixa pobre sem perceber",
  score: 0.85,
  justificativa: "Medo + mecanismo oculto + consequência"
};
```

**Se a saída fizer sentido → ✅ Aprendeu!**  
**Se a saída for genérica → ❌ Precisa mais treino!**

***

## 🎮 Analogia do Videogame

| Treino de Agente | Videogame |
|------------------|-----------|
| Exemplos | Tutorial do jogo |
| Regras | Controles (o que pode fazer) |
| Testes | Fases para passar |
| Validação | Boss fight (prova final) |

***

## ✅ Checklist para Treinar Agente

- [ ] 30-100 exemplos de entrada/saída
- [ ] Regras claras (pode/não pode)
- [ ] Passo a passo do workflow
- [ ] 10-20 casos de teste
- [ ] Validação com entrada nova
- [ ] Feedback (acertou/errou)

***

## 🚀 Exemplo Prático: TopicScout

```json
{
  "agente": "TopicScout",
  "tarefa": "Escolher tema viral",
  "exemplos": [
    {
      "entrada": {
        "nicho": "segurança digital",
        "publico": "topo de funil"
      },
      "saida": {
        "tema": "Como Golpistas Criam Autoridade Falsa no Seu Celular",
        "score_viral": 0.87,
        "emocao": "medo+curiosidade",
        "justificativa": "Mecanismo oculto + consequência real"
      }
    }
  ],
  "regras": [
    "Usar medo e curiosidade",
    "Revelar mecanismos ocultos",
    "Não ser genérico",
    "Não inventar informações"
  ],
  "testes": [
    {
      "nicho": "finanças",
      "esperado_score_minimo": 0.70
    }
  ]
}
```

***


***

## 🎯 1. Arquiteto de Agentes (visão macro)

### Tópicos que ele lista:

1. **Padrão de arquitetura do squad**
   - Supervisor-Worker (1 orquestrador + N especialistas) 
   - Hierárquico (supervisor de supervisores) pra squads grandes 
   - Swarm (handoff dinâmico entre agentes) quando o fluxo é conversacional scaling-intelligence-building-hierarchical-multi-agent-systems-with-langgraph/)
   - Quando usar cada um e trade-offs de latência/custo 


Perfeito — agora tenho os detalhes técnicos e os benchmarks de latência/custo. Vou montar a explicação com precisão máxima, incluindo os números reais de 2026.

## Padrões de arquitetura multiagente no LangGraph (2026)

Existem três topologias principais para squads de agentes no LangGraph: **Supervisor-Worker**, **Hierárquico** e **Swarm**. Cada uma resolve um tipo diferente de problema de coordenação e tem trade-offs claros de latência, custo e complexidade. 

***

## 1. Supervisor-Worker (1 orquestrador + N especialistas)

**Topologia:** Um nó `supervisor` (LLM de roteamento) decide qual `worker` chamar a seguir; cada worker executa e **sempre devolve o controle ao supervisor**, que reavalia e decide o próximo passo ou finaliza. 

**Quando usar:**

- Tarefas dinâmicas onde o próximo passo depende do que foi descoberto (ex.: pesquisa → fact-check → escrita). 
- 2–5 agentes com papéis bem separados (researcher, coder, reviewer, writer).
- Você precisa de trilha de auditoria: cada decisão de roteamento é um evento explícito no estado (`Command(goto=...)`).

**Trade-offs:**

- **Latência:** ~6–15 s para 5–10 passos típicos (vLLM + Llama-3.1-70B, H100). 
- **Custo:** 2–3× um single-agent; cada ciclo supervisor→worker→supervisor adiciona ≥2 chamadas de LLM (roteamento + trabalho). 
- **Risco:** o supervisor vira gargalo se tiver que "pensar demais" a cada passo; sem `recursion_limit` vira loop infinito.

**Padrão de implementação:** estado tipado com flags explícitas (`researcher_done: bool`), workers com prompts estreitos, supervisor usando `Command(goto="worker_x")` ou `Send` para fan-out paralelo. 

***

## 2. Hierárquico (supervisor de supervisores)

**Topologia:** Um supervisor de alto nível (ex.: "CEO") delega para **sub-supervisores** (ex.: "gerente de pesquisa", "gerente de escrita"), cada um gerenciando seu próprio time de workers. 

**Quando usar:**

- Squads grandes: **>8 especialistas** ou domínios naturalmente divididos em sub-teams.
- Problemas complexos com sub-domínios (backend vs frontend, pesquisa vs compliance) onde cada sub-time tem seu próprio loop interno. 

**Trade-offs:**

- **Latência:** 10–25 s para 5–10 passos (3× mais lento que sequencial). 
- **Custo:** ~3× o custo de um single-agent; só vale a pena quando a complexidade exige >8 agentes. 
- **Complexidade:** alta — você gerencia múltiplos grafos compilados, cada um com seu próprio checkpoint e estado. 

**Padrão de implementação:** cada sub-time é um `StateGraph` compilado com seu próprio supervisor; o supervisor de topo chama esses sub-grafos como nós (ou tools). 

***

## 3. Swarm (handoff dinâmico entre agentes)

**Topologia:** Agentes **pares** que se handoffam diretamente via `Command(goto="agent_b")` ou tools de handoff; **sem coordenador central**. 

**Quando usar:**

- Fluxos conversacionais com **fronteiras de responsabilidade bem definidas** (ex.: triagem → billing → técnico → escalonamento). 
- Quando cada agente sabe exatamente quando sua parte termina e para quem passar (ex.: chatbot de suporte com handoff explícito). 
- Você quer evitar o overhead de um supervisor em cada passo. 

**Trade-offs:**

- **Latência:** menor que supervisor (sem chamada extra de roteamento a cada passo). 
- **Custo:** menor que supervisor/hierárquico, mas ainda maior que single-agent. 
- **Risco:** ciclos (A→B→A) e deadlocks se os handoffs não forem bem desenhados; precisa de detecção de ciclo no estado.

**Padrão de implementação:** cada agente tem tools `handoff_to_X` que retornam strings de handoff; o grafo lembra o último agente ativo para retomar a conversa.

***

## Tabela comparativa (benchmarks reais 2026)

| Padrão | Complexidade | Latência típica (5–10 passos) | Custo de tokens | Melhor caso de uso |
|---|---|---|---|---|
| **Sequencial** | Baixa | 4–10 s | Baixo | Pipelines fixos (pesquisa → resumo → formatação)  
| **Supervisor-Worker** | Média | 6–15 s | Médio–alto | Delegação dinâmica, triagem, pesquisa iterativa  
| **Hierárquico** | Alta | 10–25 s | Alto (>8 agentes) | Squads grandes com sub-teams  
| **Swarm** | Média | 5–12 s | Médio | Handoff conversacional com fronteiras claras  

***

## Regras de decisão (quando cada padrão vence)

- **<8 tools, <50k tokens totais:** fique com single-agent ou sequencial — decomposição adiciona overhead sem benefício. 
- **Roteamento dinâmico baseado em descobertas intermediárias:** supervisor. 
- **Subtarefas independentes que podem rodar em paralelo:** supervisor + `Send` fan-out (reduz latência de ΣTᵢ para max(Tᵢ)). 
- **Fronteiras de responsabilidade cristalinas, fluxo conversacional:** swarm. 
- **>8 especialistas ou sub-domínios naturais:** hierárquico. 
- **Latência <1s requerida (tempo real):** single-agent ou cached routing — multi-hop é proibitivo. 

***

## Armadilhas comuns (e como evitar)

- **Loop infinito do supervisor:** sempre configure `recursion_limit` no compile e use flags de conclusão explícitas no estado (`researcher_done: bool`). 
- **Explosão de tokens:** a mensagem compartilhada cresce a cada passo; use nós de sumarização entre workers ou campos estruturados separados do `messages`. 
- **Ciclo no swarm:** A→B→A sem progresso; detecte visitados no estado e force escalonamento humano após N repetições. 
- **Supervisor com GPT-4o desnecessário:** roteamento é classificação; use GPT-4o-mini ou modelo menor para o supervisor, reserve o modelo grande para os workers de síntese. 





2. **Definição de papéis e responsabilidades**
   - Quem é o **supervisor** (orquestra, valida, decide fim) 
   - Quem são os **workers** (pesquisa, redação, revisão, geração de imagem, etc.) 
   - Quem tem **permissão de escrita externa** (enviar e-mail, postar, pagar) vs só leitura


Excelente — agora tenho os detalhes oficiais e os padrões de produção. Vou detalhar com precisão máxima, incluindo os padrões de permissão que a comunidade usa em 2026.

## Definição de papéis e responsabilidades em squads multiagente

A separação clara de papéis é o que diferencia um agente de pesquisa de um sistema de produção confiável. Em 2026, o padrão consolidado é: **supervisor orquestra, workers executam, e permissões de escrita externa são tratadas como circuit breakers explícitos**. [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)

***

## 1. Supervisor (orquestrador)

**Responsabilidades principais:**

- **Receber o objetivo do usuário** e decompor em subtarefas sequenciais ou paralelas. [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)
- **Roteamento explícito:** decide qual worker chamar a seguir com base no estado atual (`Command(goto="worker_x")` ou `Send` para fan-out). [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)
- **Validação de resultados:** revisa os outputs dos workers e decide se atendem aos critérios de qualidade; pode pedir retry local ou escalar para humano. [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)
- **Decisão de término:** determina quando o objetivo foi atingido e encerra o fluxo, ou quando é necessário intervenção humana. [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)
- **Isolamento de estado:** mantém o estado global (thread_id, session_id, user_id) e passa apenas o contexto validado para cada worker. [xbstack](https://www.xbstack.com/en/ai/langgraph-supervisor-worker-handoff/)

**O que o supervisor NÃO faz:**

- Não executa tools de domínio (pesquisa, escrita, geração de imagem) — isso é responsabilidade dos workers. 
- Não modifica estado global diretamente; workers retornam dados locais e o supervisor decide como mergear.
- Não tem permissão de escrita externa por padrão; se precisar, é tratado como caso especial com aprovação humana.

**Perfil técnico ideal:**

- Modelo de roteamento (classificação): GPT-4o-mini, Claude Haiku ou modelo menor — barato e rápido .
- Prompt estreito: "Dado o estado atual, qual o próximo worker ou fim?" — não tente fazer o supervisor "pensar demais" .

***

## 2. Workers (especialistas)

**Responsabilidades principais:**

- **Executar subtarefas especializadas** dentro de um domínio bem definido (pesquisa, redação, revisão, geração de imagem, etc.).
- **Chamar tools do seu domínio** com inputs validados (Pydantic + Field descriptions) .
- **Retornar outputs estruturados e limpos** para o supervisor — apenas os campos de negócio computados localmente. 
- **Não controlar fluxo:** workers não decidem o próximo passo; apenas produzem dados.

**Exemplos de workers e suas tools:**

| Worker | Tools típicas | Permissão de escrita |
|---|---|---|
| **Pesquisador** | `buscar_web`, `ler_documento`, `consultar_api_dados` | Leitura apenas  
| **Redator** | `gerar_texto`, `formatar_markdown`, `traduzir` | Leitura apenas (escreve no estado, não externamente)  
| **Revisor** | `verificar_fatos`, `analisar_tom`, `sugerir_melhorias` | Leitura apenas 
| **Gerador de imagem** | `gerar_imagem_firefly`, `redimensionar`, `otimizar_png` | Leitura/escrita local (output é arquivo, não ação externa) 
| **Publicador** | `postar_instagram`, `enviar_email`, `criar_anuncio` | **Escrita externa** — requer aprovação humana 
| **Financeiro** | `consultar_saldo`, `processar_pagamento`, `emitir_reembolso` | **Escrita externa destrutiva** — sempre com HITL 

**Regra de ouro:** workers só escrevem no estado local; quem decide se algo vai para o mundo externo é o supervisor (ou um nó de aprovação dedicado).

***

## 3. Permissões de escrita externa (o sistema de 3 níveis)

Em produção, tools são classificadas em **3 níveis de permissão** e tratadas de forma diferente: 

### Nível 1: Leitura apenas (read_only)

**Exemplos:** `buscar_web`, `ler_documento`, `consultar_saldo`, `analisar_tom`

- **Execução:** automática, sem aprovação. 
- **Risco:** baixo — não modifica estado externo.
- **Tratamento:** passa direto pelo middleware de autorização. 

### Nível 2: Escrita não destrutiva (state_mutating)

**Exemplos:** `salvar_rascunho`, `criar_documento_interno`, `gerar_relatorio_pdf`

- **Execução:** automática, mas com logging e escopo limitado (ex.: só pasta `/drafts/`). [reddit]
- **Risco:** médio — pode criar lixo, mas não destrói dados.
- **Tratamento:** middleware verifica se a tool tem a permissão `write` no manifesto do agente. 

### Nível 3: Escrita destrutiva / externa (destructive)

**Exemplos:** `enviar_email`, `postar_instagram`, `processar_pagamento`, `deletar_linha`, `emitir_reembolso`

- **Execução:** **sempre com aprovação humana** (HITL) antes de executar. 
- **Risco:** alto — afeta clientes, dinheiro ou reputação.
- **Tratamento:** nó de aprovação dedicado com `interrupt()` que pausa o grafo, mostra resumo da ação e espera decisão (approve/edit/reject). 
**Manifesto de permissões (padrão de produção):**

Cada agente tem um manifesto no startup que declara permissões por tool: 

```python
PERMISSION_MANIFEST = {
    "buscar_web": "read_only",
    "salvar_rascunho": "state_mutating",
    "enviar_email": "destructive",
    "postar_instagram": "destructive",
    "processar_pagamento": "destructive",
}
```

Um middleware custom verifica esse manifesto antes de executar qualquer tool; se for `destructive`, chama `interrupt()`. 

***

## 4. Padrão de implementação: nó de aprovação dedicado

Em vez de checar permissão dentro de cada tool, o padrão de 2026 é um **nó de aprovação centralizado** no supervisor: 

```python
def requires_approval(action: dict) -> bool:
    if action["type"] == "send_email" and action.get("external_recipient"):
        return True
    if action["type"] == "refund" and action["amount_cents"] > 5000:
        return True
    if action["type"] == "delete_row" and not action.get("scoped_by_id"):
        return True
    return False

def approval_node(state: State) -> Command[Literal["proceed", "abort"]]:
    pending_action = state["pending_tool_call"]
    if not requires_approval(pending_action):
        return Command(goto="execute_tool")
    
    # Pausa para aprovação humana
    decision = interrupt({
        "question": f"Aprovar ação: {pending_action['type']}?",
        "action_preview": pending_action,
        "reasoning": state["last_reasoning_trace"]
    })
    
    if decision["approved"]:
        return Command(goto="execute_tool")
    else:
        return Command(goto="abort_or_retry")
```

**O que mostrar para o humano no interrupt:**

- Resumo de uma linha: "Enviar e-mail de confirmação de reembolso de R$ 340,00 para jamie@acmecorp.com". 
- Diff do estado atual (ex.: "Assinatura atual: Pro, renova em 18/07"). 
- Raciocínio chave (por que o agente chegou aqui, não só o que quer fazer).

***

## 5. Separação de estado: supervisor vs worker

**Estado do supervisor (global):**

- `messages`: histórico completo da conversa. 
- `current_step`: etapa atual do fluxo. 
- `worker_outputs`: dicionário com resultados de cada worker. 
- `thread_id`, `session_id`, `user_id`: isolamento por usuário/sessão. 

**Estado do worker (local):**

- Apenas os campos de negócio que ele computa (ex.: `pesquisa_resultados`, `texto_gerado`). 
- Não carrega o histórico completo; recebe do supervisor apenas o contexto necessário. [

**Handoff seguro:**

- Supervisor passa: objetivo local, contexto validado, constraints e audit_id. 
- Worker retorna: outputs estruturados, sem modificar `current_step` ou `messages` diretamente. 

***

## 6. Checklist de segurança por papel

| Papel | Permissões | Aprovação humana | Logging |
|---|---|---|---|
| **Supervisor** | Roteamento, merge de estado, decisão de fim | Opcional (só se for tomar ação destrutiva) | Audit trail de todas as decisões de roteamento 

| **Worker leitura** | Tools read_only | Nunca | Log de inputs/outputs para debug  

| **Worker escrita local** | Tools state_mutating | Nunca (mas com escopo limitado) | Log + versionamento do arquivo criado  

| **Worker escrita externa** | Tools destructive | Sempre (interrupt antes de executar) | Log completo + diff do estado + reasoning trace  

***

## 7. Armadilhas comuns (e como evitar)

- **Worker com permissão de escrita externa direta:** nunca dê a um worker a capacidade de postar/pagar sem passar pelo nó de aprovação. 

- **Supervisor executando tools de domínio:** isso quebra a separação de responsabilidades e dificulta o debug. 

- **Aprovação humana sem checkpointer:** interrupts exigem `checkpointer` configurado, senão o estado se perde enquanto espera. 

- **Manifesto de permissões não validado:** declare as permissões no startup e valide no middleware; não confie só na docstring da tool. 









3. **Contrato de estado (State Schema)**
   - `TypedDict` com campos tipados e reducers (`Annotated[list, add_messages]`) 
   - O que vai no estado global vs estado local de cada subagente 
   - O que **não pode** estar no estado (conexões, file handles, objetos não-serializáveis) 



Perfeito — agora tenho os detalhes técnicos oficiais e os padrões de produção de 2026. Vou detalhar com precisão máxima, incluindo os schemas completos e as regras de serialização.

## Contrato de estado (State Schema) em squads multiagente

O estado é a **única fonte de verdade** que conecta todos os nós do grafo. Em 2026, o padrão consolidado é: **TypedDict com campos tipados e reducers explícitos, separação clara entre estado global e local, e zero objetos não-serializáveis**. [notes.darshanraul](https://notes.darshanraul.me/AI/langgraph/02-state-and-reducers)

***

## 1. TypedDict com campos tipados e reducers

### Regra fundamental

Em LangGraph, **todo campo que precisa acumular valores ao longo do tempo deve ter um reducer anotado com `Annotated[T, reducer_fn]`**. Sem reducer, o campo é sobrescrito a cada write (last-write-wins). [pratikdhanave](https://pratikdhanave.com/blog/posts/langgraph-02-state-and-reducers.html)

### Reducers built-in mais usados

| Reducer | Uso típico | Comportamento |
|---|---|---|
| `add_messages` | `messages: Annotated[list, add_messages]` | Append + deduplicação por message ID  [notes.darshanraul](https://notes.darshanraul.me/AI/langgraph/02-state-and-reducers) |
| `operator.add` | `count: Annotated[int, operator.add]` | Soma acumulativa  [pratikdhanave](https://pratikdhanave.com/blog/posts/langgraph-02-state-and-reducers.html) |
| `operator.add` | `citations: Annotated[list[str], operator.add]` | Concatenação de listas  [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/) |
| Custom | `metadata: Annotated[dict, merge_dict]` | Merge de dicts (ex.: `{**current, **update}`)  [notes.darshanraul](https://notes.darshanraul.me/AI/langgraph/02-state-and-reducers) |

### Schema canônico de um squad supervisor-worker

```python
from typing import Annotated, Literal, Optional
from typing_extensions import TypedDict
from operator import add
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

class SupervisorState(TypedDict):
    # === CAMPOS DE IDENTIFICAÇÃO (overwrite, sem reducer) ===
    thread_id: str                              # Identificador único da thread
    session_id: str                             # Sessão do usuário
    user_id: str                                # ID do usuário
    current_worker: str                         # Worker ativo no momento
    
    # === MEMÓRIA DE CONVERSA (append com deduplicação) ===
    messages: Annotated[list[AnyMessage], add_messages]  # Histórico global
    
    # === CONTEXTO DE NEGÓCIO (overwrite) ===
    task_goal: str                              # Objetivo final do usuário
    final_summary: Optional[str]                # Resultado consolidado
    risk_level: Literal["low", "medium", "high"]  # Nível de risco atual
    is_approved: bool                           # Flag de aprovação humana
    
    # === ACUMULADORES DE WORKERS (append) ===
    worker_outputs: Annotated[list[dict], add]  # Resultados estruturados de todos os workers
    citations: Annotated[list[str], add]        # Fontes coletadas
    
    # === CONTROLE DE FLUXO (overwrite) ===
    next_worker: Optional[Literal["researcher", "writer", "reviewer", "__end__"]]
    
    # === TRATAMENTO DE ERRO (overwrite) ===
    global_error: Optional[str]                 # Erro fatal do grafo
    retry_count: Annotated[int, add]            # Contador global de retries
```

### Por que `Annotated` e não só `list`?

Sem `Annotated[list, add_messages]`, cada nó que retorna `{"messages": [new_msg]}` **substitui** a lista inteira, apagando o histórico anterior. Com o reducer, o framework chama `add_messages(old_messages, [new_msg])` e o resultado é a concatenação. [notes.darshanraul](https://notes.darshanraul.me/AI/langgraph/02-state-and-reducers)

***

## 2. Estado global vs estado local de cada subagente

A separação entre estado global (supervisor) e estado local (worker/subgraph) é **o ponto mais crítico de arquitetura** em squads multiagente .

### Estado global (SupervisorState)

**Responsabilidade:** memória de longo prazo, isolamento por usuário, resultados consolidados .

**Campos obrigatórios:**

- `thread_id`, `session_id`, `user_id` — isolamento e recuperação após crash .
- `messages` — histórico completo da conversa (acessível a todos os nós) .
- `task_goal` — objetivo final do usuário (derivado do input inicial) .
- `final_summary` — resultado consolidado após todos os workers .
- `worker_outputs` — lista de outputs estruturados de cada worker .

**O que NÃO vai no estado global:**

- Dados intermediários de workers (ex.: `raw_search_results`, `debug_logs`) .
- Contexto não validado (ex.: resultados brutos de busca antes de filtrar) .
- Contadores locais de retry de um worker específico .

### Estado local (WorkerState)

**Responsabilidade:** contexto efêmero para uma subtarefa específica, isolamento de ruído .

```python
class ResearchWorkerState(TypedDict):
    # === TASK ESPECÍFICA (derivada do task_goal global) ===
    worker_task: str                            # "Pesquise tendências de IA em 2026"
    
    # === HISTÓRICO LOCAL (não polui o messages global) ===
    local_messages: Annotated[list[AnyMessage], add_messages]
    
    # === CONTEXTO FILTRADO (apenas o necessário para esta task) ===
    search_context: dict                        # {dominio: "IA", ano_min: 2025}
    
    # === CONSTRAINTS DE DOMÍNIO (regras de negócio) ===
    constraints: dict                           # {sources_min_year: 2025, max_results: 10}
    
    # === FEW-SHOT EXAMPLES (melhora qualidade em 20-40%) ===
    examples: list[dict]                        # [{query: "...", expected_output: {...}}]
    
    # === ESTADO INTERMEDIÁRIO (não vaza para o pai) ===
    raw_search_results: Annotated[list[str], add]      # Resultados brutos da busca
    filtered_results: Annotated[list[str], add]        # Após filtragem por relevância
    fact_check_notes: Annotated[list[str], add]        # Notas de validação
    
    # === OUTPUT ESTRUTURADO (único campo que volta para o supervisor) ===
    structured_output: dict                     # {resumo: "...", fontes: [...], confianca: "alta"}
    
    # === CONTROLE LOCAL DE ERRO ===
    tool_error_count: int                       # Quantas tools falharam neste worker
```

### Padrão de mapeamento (Adaptor Pattern)

O padrão mais robusto é uma **função ponte** que faz o mapeamento explícito de campos, evitando poluição de estado e garantindo isolamento :

```python
def call_research_worker(state: SupervisorState) -> dict:
    # Deep copy para evitar modificação in-place do estado global
    local_context = copy.deepcopy(state["global_context"])
    
    # Mapeamento explícito: supervisor → worker
    worker_input = {
        "worker_task": f"Pesquise tendências de IA em 2026 focando em {local_context['dominio']}",
        "local_messages": [],  # Inicia vazio
        "search_context": local_context,
        "constraints": {
            "sources_min_year": 2025,
            "max_results": 10,
            "exclude_domains": ["blog", "medium"],
        },
        "examples": [
            {
                "query": "tendências de IA em saúde 2025",
                "expected_output": {"tendencias": ["diagnóstico por imagem", "drug discovery"]},
            }
        ],
        "raw_search_results": [],
        "filtered_results": [],
        "fact_check_notes": [],
        "structured_output": {},
        "tool_error_count": 0,
    }
    
    # Invoca o worker (node function ou subgraph compilado)
    worker_result = research_worker_graph.invoke(worker_input)
    
    # Writeback estruturado: worker → supervisor
    return {
        "worker_outputs": [worker_result["structured_output"]],
        "citations": worker_result["structured_output"].get("fontes", []),
        "final_summary": worker_result["structured_output"]["resumo"],
    }
```

***

## 3. O que NÃO pode estar no estado (objetos não-serializáveis)

O checkpointer do LangGraph **serializa o estado completo** para persistir em disco (JSON/Postgres). Objetos não-serializáveis quebram o checkpoint com `TypeError` ou `PicklingError`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

### Lista proibida (nunca coloque no estado)

| Tipo | Por que quebra | Alternativa |
|---|---|---|
| **Conexões de banco** (`psycopg2.connection`, `sqlite3.Connection`) | Não é serializável; abre handle de recurso externo  | Passe apenas `connection_string: str` e abra a conexão dentro do nó  |
| **File handles** (`open("file.txt")`, `io.BytesIO`) | Aponta para recurso de I/O externo; não serializa  | Use `file_path: str` e abra/feche dentro do nó  |
| **Objetos de rede** (`requests.Session`, `httpx.Client`) | Contém sockets abertos; não serializa  | Crie o client dentro do nó ou use singleton global (fora do estado)  |
| **UUID nativo** (`uuid.UUID`) | JSON não suporta UUID; quebra no checkpoint  | Converta para `str(uuid_obj)` antes de escrever  |
| **Datetime nativo** (`datetime.datetime`) | Requer serializador custom; pode quebrar  | Use `iso_format: str` (`dt.isoformat()`)  |
| **Classes custom não-serializáveis** | Pickle falha se a classe tem `__slots__`, closures, etc.  | Use dicts aninhados ou Pydantic `BaseModel` (serializa nativamente)  [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/) |
| **Funções / closures** | Não é serializável em JSON  | Passe o nome da função como `str` e resolva via registry  |

### Exemplo de erro comum (e como corrigir)

```python
# ❌ ERRADO: UUID e conexão no estado
class BadState(TypedDict):
    thread_id: uuid.UUID              # Quebra no checkpoint (não é JSON-serializable)
    db_connection: psycopg2.connection  # Quebra (não é serializável)
    messages: Annotated[list, add_messages]

# ✅ CORRETO: tipos nativos e paths
class GoodState(TypedDict):
    thread_id: str                    # str(uuid_obj)
    db_connection_string: str         # "postgresql://user:pass@host/db"
    messages: Annotated[list, add_messages]

# Dentro do nó, abre a conexão localmente
def query_node(state: GoodState) -> dict:
    conn = psycopg2.connect(state["db_connection_string"])
    try:
        # ... executa query ...
        return {"results": results}
    finally:
        conn.close()  # Fecha antes de retornar
```

### Checklist de serialização

- [ ] Todos os campos são tipos nativos: `str`, `int`, `float`, `bool`, `list`, `dict`, `None` 
- [ ] UUIDs convertidos para `str` 
- [ ] Datetimes em formato ISO (`str`) 
- [ ] Nenhuma conexão de banco, file handle ou client de rede no estado 
- [ ] Classes custom são Pydantic `BaseModel` (serializam nativamente) ou dicts aninhados [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)
- [ ] Funções/closures substituídas por nomes de string resolvidos via registry 

***

## 4. Armadilhas comuns (e como evitar)

### 1. `InvalidUpdateError: Unknown key 'answer'`

**Sintoma:** `langgraph.errors.InvalidUpdateError: Unknown key 'answer' in state update. Declared keys: ['messages', 'question']`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Causa:** Nó retorna chave não declarada no schema. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Solução:** Declare todos os campos no `TypedDict` ou `BaseModel`; nodes só podem retornar chaves declaradas. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

### 2. `TypeError: unsupported operand type(s) for +: 'NoneType' and 'list'`

**Sintoma:** Reducer recebe `None` no primeiro call. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Causa:** Campo sem valor inicial; reducer é chamado com `(None, update)`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Solução:** Use `TypedDict(total=False)` ou declare campo como `Optional[T] = None` com default. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

### 3. `messages` sobrescrito em vez de append

**Sintoma:** Histórico some após segundo nó. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Causa:** `messages: list` sem `Annotated[..., add_messages]`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Solução:** Anote com reducer: `messages: Annotated[list[AnyMessage], add_messages]`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

### 4. `ValidationError` do Pydantic no meio do grafo

**Sintoma:** `pydantic_core._pydantic_core.ValidationError: 1 validation error for State.temperature`. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Causa:** Nó retorna valor inválido para campo validado (ex.: `temperature: 5.0` quando schema tem `le=2.0`). [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

**Solução:** Valide inputs dos nós antes de retornar; Pydantic valida **toda** atualização de estado, não só o input inicial. [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

### 5. Poluição de contexto entre workers

**Sintoma:** Worker B recebe mensagens irrelevantes do Worker A e gera output confuso .

**Causa:** `messages` global passado inteiro para todos os workers .

**Solução:** Passe apenas `search_context` filtrado; workers escrevem em `local_messages` interno .

***

## 5. Checklist de state schema seguro

- [ ] Todo campo acumulativo tem reducer anotado (`Annotated[list, add_messages]` ou `operator.add`) [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)
- [ ] Campos opcionais declarados com `Optional[T] = None` ou `TypedDict(total=False)` [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)
- [ ] Estado contém apenas tipos serializáveis (str, int, float, bool, list, dict, None) 
- [ ] UUIDs e datetimes convertidos para `str` 
- [ ] Nenhuma conexão de banco, file handle ou client de rede no estado 
- [ ] Workers usam estado local isolado; não escrevem diretamente no `messages` global 
- [ ] Função ponte faz mapeamento explícito de campos (supervisor ↔ worker) 
- [ ] Schema validado com `mypy`/`pyright` antes de rodar [aierrorhub](https://aierrorhub.com/providers/langgraph/state-schema-errors/)

Se quiser, no próximo passo eu monto o template completo com os três schemas (SupervisorState, ResearchWorkerState, WriterWorkerState) já integrados com as funções ponte e os reducers corretos.







4. **Topologia do grafo**
   - Nós: supervisor, workers, validadores, gatekeepers 
   - Arestas condicionais: `roteador(state) -> Literal["pesquisador", "redator", "FIM"]` 
   - Guardas de loop: `iteration_count` + `max_iterations` no supervisor 

Excelente — agora tenho os detalhes técnicos oficiais e os padrões de produção de 2026. Vou detalhar com precisão máxima, incluindo os padrões de guardas de loop e os circuit breakers que a comunidade usa em produção.

## Topologia do grafo em squads multiagente (padrão de produção 2026)

A topologia do grafo é onde você define **quem executa, quando executa e quando para**. Em 2026, o padrão consolidado é: **supervisor com loop guard explícito, arestas condicionais tipadas com `Literal`, e gatekeepers que validam antes de executar ações destrutivas**. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

## 1. Nós: supervisor, workers, validadores, gatekeepers

Cada tipo de nó tem uma responsabilidade única e um contrato de estado bem definido. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

### Supervisor (nó de roteamento)

**Responsabilidade:** decidir qual worker chamar a seguir ou terminar o fluxo. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

**Padrão de implementação:**

```python
from typing import Literal
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

# Schema estruturado para o roteamento
class RouteDecision(BaseModel):
    next_worker: Literal["pesquisador", "redator", "revisor", "publicador", "__end__"]
    reasoning: str
    confidence: Literal["alta", "media", "baixa"]

def supervisor_node(state: SupervisorState) -> dict:
    # === LOOP GUARD: verifica antes de chamar LLM ===
    iteration = state.get("iteration_count", 0)
    if iteration >= MAX_ITERATIONS:
        return {
            "next_worker": "__end__",
            "iteration_count": iteration,
            "final_summary": f"Parado: máximo de iterações ({MAX_ITERATIONS}) atingido.",
        }
    
    # === MEMORY DE WORKERS FALHOS ===
    attempted_workers = state.get("attempted_workers", [])
    
    # === CHAMADA AO LLM DE ROTEAMENTO ===
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Você é um supervisor de equipe. Dado o estado atual,
        decida qual especialista chamar a seguir. Regras:
        1. Nunca chame um worker que já falhou (está em attempted_workers).
        2. Se a qualidade for suficiente, retorne __end__.
        3. Se iteration_count >= {max_iter}, retorne __end__."""),
        ("human", """Estado atual:
        - task_goal: {task_goal}
        - worker_outputs: {worker_outputs}
        - iteration_count: {iteration_count}
        - attempted_workers: {attempted_workers}
        
        Decida o próximo worker.""")
    ])
    
    structured_llm = model.with_structured_output(RouteDecision)
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "task_goal": state["task_goal"],
        "worker_outputs": state.get("worker_outputs", []),
        "iteration_count": iteration,
        "attempted_workers": attempted_workers,
        "max_iter": MAX_ITERATIONS,
    })
    
    # === OVERRIDE: se LLM quiser re-delegar para worker falho, bloqueia ===
    next_worker = result.next_worker
    if next_worker in attempted_workers:
        next_worker = "__end__"
        result.reasoning = f"Worker {next_worker} já falhou anteriormente."
    
    return {
        "next_worker": next_worker,
        "iteration_count": iteration + 1,  # Incrementa o contador
        "attempted_workers": attempted_workers + [next_worker] if next_worker != "__end__" else attempted_workers,
    }
```

**Regras de ouro do supervisor:**

- **Verifica o contador ANTES de chamar o LLM** — o LLM não pode sobrescrever um `if` do Python. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Incrementa `iteration_count` a cada decisão** — mesmo que o LLM queira continuar. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Bloqueia re-delegação para workers falhos** — evita loops de retry infinito. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Retorna `__end__` quando qualidade suficiente ou limite atingido** — não confie só no LLM para decidir fim. [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)

***

### Workers (nós de execução)

**Responsabilidade:** executar subtarefas especializadas e retornar resultado estruturado. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

```python
def pesquisador_node(state: SupervisorState) -> dict:
    try:
        # Executa pesquisa
        results = buscar_web.invoke(state["task_goal"])
        
        # Validação local (opcional)
        if not results:
            return {
                "global_error": "Pesquisa retornou resultados vazios.",
                "next_worker": "__end__",
            }
        
        return {
            "worker_outputs": [{
                "tipo": "pesquisa",
                "resumo": f"Encontrados {len(results)} resultados.",
                "fontes": [r.url for r in results],
            }],
            "citations": [r.url for r in results],
        }
    except Exception as e:
        # Worker NÃO decide próximo passo; apenas reporta erro
        return {
            "global_error": f"Pesquisador falhou: {str(e)}",
            "next_worker": "__end__",
        }

def redator_node(state: SupervisorState) -> dict:
    # Gera conteúdo baseado nos outputs anteriores
    contexto = "\n".join([w["resumo"] for w in state.get("worker_outputs", [])])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Você é um redator. Escreva um artigo baseado nestes dados:"),
        ("human", contexto)
    ])
    
    texto = (prompt | model).invoke({})
    
    return {
        "worker_outputs": [{
            "tipo": "redacao",
            "texto": texto.content,
        }],
    }
```

**Regras de ouro dos workers:**

- **Não decide próximo passo** — apenas retorna dados ou erro. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Try-except em toda tool externa** — falha de API não pode crashar o grafo. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Retorna `global_error` se falhar** — supervisor decide se aborta ou retry. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### Validadores (nós de qualidade)

**Responsabilidade:** verificar se o output atende critérios de qualidade antes de prosseguir. [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)

```python
def validador_qualidade_node(state: SupervisorState) -> dict:
    # Extrai último output do worker
    last_output = state["worker_outputs"][-1] if state.get("worker_outputs") else {}
    
    # Validação simples (ex.: texto tem pelo menos 200 palavras)
    if last_output.get("tipo") == "redacao":
        texto = last_output.get("texto", "")
        word_count = len(texto.split())
        
        if word_count < 200:
            return {
                "global_error": f"Texto muito curto: {word_count} palavras (mínimo: 200).",
                "next_worker": "redator",  # Sugere retry
            }
    
    # Validação com LLM (ex.: coerência, fatos)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Avalie a qualidade do texto de 0 a 10."),
        ("human", last_output.get("texto", ""))
    ])
    
    class QualityScore(BaseModel):
        score: int = Field(ge=0, le=10)
        feedback: str
    
    score_result = (prompt | model.with_structured_output(QualityScore)).invoke({})
    
    if score_result.score < 7:
        return {
            "global_error": f"Qualidade baixa: {score_result.score}/10. Feedback: {score_result.feedback}",
            "next_worker": "redator",  # Sugere retry
        }
    
    # Qualidade suficiente
    return {
        "next_worker": "revisor",  # Avança para próximo passo
    }
```

**Regras de ouro dos validadores:**

- **Critérios explícitos** — não use "avalie se está bom"; use thresholds numéricos (ex.: score >= 7). [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)
- **Sugere próximo passo, mas não decide** — supervisor ainda tem a palavra final. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- **Fallback para erro claro** — se não der para validar, reporta `global_error`. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### Gatekeepers (nós de aprovação)

**Responsabilidade:** pausar para aprovação humana antes de ações destrutivas (enviar e-mail, postar, pagar) .

```python
from langgraph.types import interrupt

def gatekeeper_publicacao_node(state: SupervisorState) -> Command[Literal["proceed", "abort"]]:
    # Extrai ação pendente
    pending_action = state.get("pending_tool_call", {})
    
    # Verifica se realmente precisa de aprovação
    if pending_action.get("type") not in ["postar_instagram", "enviar_email", "processar_pagamento"]:
        return Command(goto="execute_tool")
    
    # === PAUSA PARA APROVAÇÃO HUMANA ===
    decision = interrupt({
        "question": f"Aprovar ação: {pending_action['type']}?",
        "action_preview": pending_action,
        "reasoning": state.get("last_reasoning_trace", ""),
        "risk_level": state.get("risk_level", "medium"),
    })
    
    if decision.get("approved"):
        return Command(goto="execute_tool")
    else:
        return Command(goto="abort_or_retry")
```

**Regras de ouro dos gatekeepers:**

- **Só pausa para ações destrutivas** — não use para leitura ou escrita local .
- **Mostra resumo + reasoning** — humano precisa entender o porquê da ação, não só o que .
- **Retorna `Command(goto=...)`** — gatekeepers controlam fluxo, não apenas dados. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

***

## 2. Arestas condicionais: roteador tipado com `Literal`

Arestas condicionais são **rotas dinâmicas** que dependem do estado atual. [deepwiki](https://deepwiki.com/langchain-ai/langgraph-studio/5.1-conditional-edges)

### Padrão canônico de roteador

```python
from typing import Literal

def roteador(state: SupervisorState) -> Literal["pesquisador", "redator", "revisor", "publicador", "__end__"]:
    # === CAMADA 1: guarda de loop (hard stop) ===
    if state.get("iteration_count", 0) >= MAX_ITERATIONS:
        return "__end__"
    
    # === CAMADA 2: erro fatal ===
    if state.get("global_error"):
        return "__end__"
    
    # === CAMADA 3: decisão explícita do supervisor ===
    next_worker = state.get("next_worker")
    if next_worker in ["pesquisador", "redator", "revisor", "publicador", "__end__"]:
        return next_worker
    
    # === CAMADA 4: fallback (nunca retorne None) ===
    return "__end__"
```

### Montagem do grafo com arestas condicionais

```python
from langgraph.graph import StateGraph, START, END

builder = StateGraph(SupervisorState)

# Adiciona nós
builder.add_node("supervisor", supervisor_node)
builder.add_node("pesquisador", pesquisador_node)
builder.add_node("redator", redator_node)
builder.add_node("revisor", validador_qualidade_node)
builder.add_node("publicador", gatekeeper_publicacao_node)

# Aresta inicial: START → supervisor
builder.add_edge(START, "supervisor")

# Aresta condicional: supervisor → [workers ou __end__]
builder.add_conditional_edges(
    source="supervisor",
    path=roteador,
    # path_map explícito (opcional se usar Literal)
    {
        "pesquisador": "pesquisador",
        "redator": "redator",
        "revisor": "revisor",
        "publicador": "publicador",
        "__end__": END,
    }
)

# Workers sempre voltam para o supervisor (loop de controle)
builder.add_edge("pesquisador", "supervisor")
builder.add_edge("redator", "supervisor")
builder.add_edge("revisor", "supervisor")
builder.add_edge("publicador", "supervisor")

# Compila com checkpointer
graph = builder.compile(checkpointer=checkpointer)
```

### Por que `Literal` é obrigatório?

Sem `Literal["pesquisador", "redator", "__end__"]`, o LLM pode retornar nomes inventados (ex.: `"analista"`) e o grafo quebra com `InvalidUpdateError`. Com `Literal`, o type checker garante que só nomes válidos são retornados. [deepwiki](https://deepwiki.com/langchain-ai/langgraph-studio/5.1-conditional-edges)

***

## 3. Guardas de loop: `iteration_count` + `max_iterations`

Loops infinitos são a **falha #1 em produção** com supervisors. O padrão de 2026 é **três camadas de proteção**. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

### Camada 1: contador no estado (soft guard)

```python
MAX_ITERATIONS = 3  # Ajuste conforme complexidade da task

class SupervisorState(TypedDict):
    # ... outros campos ...
    iteration_count: int                  # Quantas decisões o supervisor já tomou
    attempted_workers: Annotated[list[str], add]  # Workers já tentados nesta iteração
    next_worker: Optional[Literal["pesquisador", "redator", "revisor", "__end__"]]
```

**Regra:** supervisor incrementa `iteration_count` a cada decisão e força `__end__` se ultrapassar `MAX_ITERATIONS`. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

### Camada 2: `recursion_limit` no invoke (hard guard)

```python
config = {
    "configurable": {"thread_id": "brenda:sessao-1"},
    "recursion_limit": 25,  # Hard cap: LangGraph lança GraphRecursionError se ultrapassar
}

try:
    result = graph.invoke({"messages": [...]}, config=config)
except GraphRecursionError:
    # Fallback amigável para o usuário
    result = {"final_summary": "Fluxo interrompido: limite de passos atingido."}
```

**Regra:** `recursion_limit` é o **último recurso** — não confie só nele; use contador no estado primeiro. [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)

### Camada 3: circuit breaker (custo e repetição)

Para sistemas de alto volume, adicione um **circuit breaker** que abre se o mesmo worker for chamado repetidamente: [runguard](https://runguard.dev/blog/langgraph-circuit-breaker-cost-control.html)

```python
class CircuitState(TypedDict):
    last_n_decisions: Annotated[list[str], add]  # Últimas 5 decisões
    circuit_open: bool

def detect_routing_loop(state: SupervisorState) -> bool:
    last_decisions = state.get("last_n_decisions", [])[-5:]
    if len(last_decisions) < 3:
        return False
    
    # Abre se mesmo worker aparece >3x seguidas
    if last_decisions[-1] == last_decisions[-2] == last_decisions[-3]:
        return True
    return False

def circuit_breaker_node(state: SupervisorState) -> dict:
    if detect_routing_loop(state):
        return {
            "circuit_open": True,
            "next_worker": "__end__",
            "global_error": "Circuit breaker: loop de roteamento detectado.",
        }
    return {"circuit_open": False}
```

***

## 4. Armadilhas comuns (e como evitar)

### 1. Supervisor loop infinito

**Sintoma:** Grafo roda por 25+ passos e lança `GraphRecursionError`. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

**Causa:** Supervisor não verifica `iteration_count` antes de chamar LLM; LLM sempre decide continuar. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

**Solução:** Verifica contador **antes** do LLM; força `__end__` se `iteration_count >= MAX_ITERATIONS`. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

### 2. `InvalidUpdateError: Unknown key 'next_worker'`

**Sintoma:** `langgraph.errors.InvalidUpdateError: Unknown key 'next_worker' in state update`. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

**Causa:** Campo não declarado no `TypedDict`. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

**Solução:** Declare todos os campos no schema; nodes só podem retornar chaves declaradas. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

### 3. Router retorna `None`

**Sintoma:** `TypeError: 'NoneType' object is not subscriptable`. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

**Causa:** Router tem `if`/`elif` sem `else`; retorna `None` implicitamente. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

**Solução:** Sempre retorne valor explícito; use `Literal` para garantir que todos os casos estão cobertos. [deepwiki](https://deepwiki.com/langchain-ai/langgraph-studio/5.1-conditional-edges)

### 4. Worker decide próximo passo

**Sintoma:** Worker retorna `{"next_worker": "redator"}` e ignora o supervisor. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

**Causa:** Worker tentando controlar fluxo; quebra a separação de responsabilidades. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

**Solução:** Workers retornam apenas dados ou `global_error`; supervisor decide próximo passo. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

### 5. Gatekeeper sem checkpointer

**Sintoma:** `RuntimeError: interrupt() requires a checkpointer to be configured` .

**Causa:** `interrupt()` exige `checkpointer` configurado; sem ele, o estado se perde enquanto espera .

**Solução:** Configure `checkpointer=PostgresSaver(...)` no compile do grafo .

***

## 5. Checklist de topologia segura

- [ ] Supervisor verifica `iteration_count` ANTES de chamar LLM [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] `MAX_ITERATIONS` configurado e enforce em código (não só no prompt) [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Router retorna `Literal[...]` com todos os nós válidos + `__end__` [deepwiki](https://deepwiki.com/langchain-ai/langgraph-studio/5.1-conditional-edges)
- [ ] Todo `if`/`elif` no router tem `else` explícito (nunca retorna `None`) [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)
- [ ] Workers não retornam `next_worker`; apenas dados ou `global_error` [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Gatekeepers usam `Command(goto=...)` e têm checkpointer configurado [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)
- [ ] `recursion_limit` configurado no invoke como hard guard [machinelearningplus](https://machinelearningplus.com/gen-ai/langgraph-cycles-recursion-limits-agent-loops/)
- [ ] Circuit breaker detecta loops de roteamento (mesmo worker >3x seguidas) [runguard](https://runguard.dev/blog/langgraph-circuit-breaker-cost-control.html)

Se quiser, no próximo passo eu monto o template completo com a topologia inteira (supervisor, workers, validadores, gatekeepers) já integrada com os guards de loop e o circuit breaker.



5. **Handoff e contexto**
   - Como o supervisor passa contexto pros workers (task, constraints, exemplos) 
   - Como os workers devolvem resultado estruturado pro supervisor 
   - Quando usar **subgraphs** (equipes como nós compostos) vs workers soltos 



Excelente — agora tenho os detalhes técnicos oficiais e os padrões de produção de 2026. Vou detalhar com precisão máxima, incluindo os padrões de mapeamento de estado e os critérios de decisão para subgraphs.

## Handoff e contexto em squads multiagente (padrão de produção 2026)

O handoff supervisor↔worker é onde a maioria dos sistemas quebra em produção. O padrão consolidado em 2026 é: **supervisor passa task + constraints + exemplos via mapeamento explícito; workers devolvem resultado estruturado; subgraphs são usados quando o worker precisa de fluxo interno complexo**. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

***

## 1. Como o supervisor passa contexto para os workers

O supervisor não passa o estado inteiro — ele passa **apenas o contexto necessário** para a subtarefa, com três componentes explícitos: **task, constraints e exemplos**. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### Componentes do handoff (padrão industrial)

```python
# Estado do supervisor (global)
class SupervisorState(TypedDict):
    thread_id: str
    session_id: str
    user_id: str
    task_goal: str                    # Objetivo final do usuário
    current_worker: str               # Nome do worker ativo
    global_context: dict              # Contexto validado (ex.: docs relevantes)
    final_summary: str                # Resultado final consolidado
    risk_level: Literal["low", "medium", "high"]
    is_approved: bool
    global_error: Optional[str]

# Estado do worker (local)
class ResearchWorkerState(TypedDict):
    worker_task: str                  # Task específica (derivada de task_goal)
    local_messages: list[dict]        # Histórico local do worker
    search_context: dict              # Contexto filtrado (não o global inteiro)
    constraints: dict                 # Regras de domínio (ex.: "só fontes 2025+")
    examples: list[dict]              # Few-shot examples para o worker
    tool_error_count: int
    structured_output: dict           # Resultado final do worker
```

### Padrão de mapeamento (Adaptor Pattern)

O padrão mais robusto é uma **função ponte** que faz o mapeamento explícito de campos, evitando poluição de estado e garantindo isolamento: [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

```python
def call_research_worker(state: SupervisorState) -> dict:
    # Deep copy para evitar modificação in-place do estado global
    local_context = copy.deepcopy(state["global_context"])
    
    # Mapeamento explícito: supervisor → worker
    worker_input = {
        "worker_task": f"Pesquise tendências de IA em 2026 focando em {local_context['dominio']}",
        "local_messages": [{"role": "system", "content": "Você é um pesquisador especializado."}],
        "search_context": local_context,  # Apenas o contexto relevante
        "constraints": {
            "sources_min_year": 2025,
            "max_results": 10,
            "exclude_domains": ["blog", "medium"],
        },
        "examples": [
            {
                "query": "tendências de IA em saúde 2025",
                "expected_output": {"tendencias": ["diagnóstico por imagem", "drug discovery"]},
            }
        ],
        "tool_error_count": 0,
        "structured_output": {},
    }
    
    # Invoca o worker (pode ser node function ou subgraph compilado)
    worker_result = research_worker_graph.invoke(worker_input)
    
    # Writeback estruturado: worker → supervisor
    return {
        "final_summary": worker_result["structured_output"]["resumo"],
        "global_messages": state["global_messages"] + [
            {"role": "assistant", "content": "Pesquisa concluída com 3 tendências."}
        ],
    }
```

**O que incluir no handoff:**

- **Task:** descrição clara da subtarefa derivada do `task_goal` global. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- **Constraints:** regras de domínio (ex.: "só fontes 2025+", "máx 10 resultados", "excluir blog"). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- **Exemplos:** few-shot examples relevantes para o domínio do worker (melhora qualidade em 20-40%). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- **Contexto filtrado:** apenas os campos do `global_context` que o worker precisa (não passe o histórico inteiro). [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

**O que NÃO incluir:**

- `messages` global inteiro — polui o contexto e dispersa a atenção do modelo. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- Campos de controle do supervisor (`current_worker`, `risk_level`) — são irrelevantes para o worker. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Objetos não-serializáveis (conexões de banco, file handles) — quebram o checkpoint. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

***

## 2. Como os workers devolvem resultado estruturado

Workers **nunca** escrevem diretamente no `messages` global ou em campos de controle do supervisor. Eles retornam **apenas resultados estruturados** em campos dedicados. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### Padrão de resultado estruturado

```python
# Schema de saída do worker (Pydantic)
class ResearchOutput(BaseModel):
    resumo: str = Field(description="Resumo de 2-3 frases das principais descobertas")
    fontes: list[str] = Field(description="URLs das fontes usadas")
    confianca: Literal["alta", "media", "baixa"] = Field(description="Nível de confiança")
    artefatos: Optional[dict] = Field(description="Arquivos gerados (ex.: patch, relatório)")

# No worker node
def research_worker_node(state: ResearchWorkerState) -> dict:
    # ... executa pesquisa ...
    
    # Resultado estruturado
    structured_result = {
        "resumo": "3 tendências principais: X, Y, Z",
        "fontes": ["https://arxiv.org/...", "https://langchain.com/..."],
        "confianca": "alta",
        "artefatos": {"relatorio_pdf": "/tmp/research_2026.pdf"},
    }
    
    # Writeback apenas nos campos de output
    return {
        "structured_output": structured_result,
        # NÃO retorne: global_messages, current_worker, etc.
    }
```

### Regras de writeback

- **Somente campos de output:** worker atualiza apenas `structured_output` ou campos equivalentes no estado do supervisor. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- **Nenhum append em `messages`:** se o worker precisar logar algo, escreve em `local_messages` interno; o supervisor decide se mergeia no global. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- **Estrutura validada:** use Pydantic para validar o output antes de retornar — evita que campos faltantes quebrem o supervisor. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

### Padrão de agregação no supervisor

O supervisor é responsável por **fundir** os outputs de múltiplos workers em um resultado coerente: [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

```python
def aggregate_results(state: SupervisorState) -> dict:
    # Extrai outputs estruturados de workers
    research_summary = state["research_worker_output"]["resumo"]
    writing_summary = state["writing_worker_output"]["resumo"]
    
    # Consolida em final_summary
    return {
        "final_summary": f"Pesquisa: {research_summary}\nRedação: {writing_summary}",
        "risk_level": "low" if state["research_worker_output"]["confianca"] == "alta" else "medium",
    }
```

***

## 3. Quando usar subgraphs vs workers soltos

A decisão de refatorar um worker para subgraph é **o ponto mais crítico de arquitetura** em squads multiagente. O padrão de 2026 é: **subgraph quando o worker precisa de fluxo interno complexo; node function quando é uma chamada simples**. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### Critérios de decisão (funil de refatoração)

```
O worker precisa de...?
├─ Múltiplas tools colaborando? (ex.: buscar → filtrar → validar → resumir)
├─ Loop com retry interno? (ex.: testar → falhar → corrigir → retestar)
├─ Estado local intermediário? (ex.: raw_search_results, debug_logs)
├─ Aprovação humana interna? (ex.: finance_approval antes de pagar)
└─ Controle de fluxo complexo? (ex.: conditional edges internas)
    ├─ SIM → Subgraph (grafo compilado independente)
    └─ NÃO → Node function (função Python simples)
```

### Tabela comparativa: node vs subgraph

| Dimensão | Node function | Subgraph |
|---|---|---|
| **Espaço de estado** | Compartilha estado global do pai, sem isolamento local | Estado independente, fisicamente isolado do grafo pai  [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/) |
| **Controle de fluxo** | Apenas retorno único para arestas do pai | Loops internos, conditional edges, interrupt/resume  [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/) |
| **Persistência** | Checkpoint do pai; não faz rollback fino de nós internos | Checkpointer independente; recupera nó exato onde falhou  [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/) |
| **Tratamento de erro** | Erro propaga para o pai e crasha o grafo | Try-except interno; retorna `error_payload` estruturado  [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/) |
| **Cenários típicos** | Formatação simples, single LLM call, tool call leve | Times independentes, pesquisa com filtragem complexa, tarefas sensíveis com HITL  [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/) |

### Exemplos concretos

**Use node function quando:**

- Worker chama GPT-4o uma vez para gerar um snippet Python. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Worker faz uma única busca web e retorna os resultados. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Worker formata um campo (ex.: `draft` → `formatted_markdown`). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Use subgraph quando:**

- Worker precisa de "input parsing → loop de tool calls → validação → agregação final". [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Worker faz pesquisa complexa: buscar → filtrar por relevância → fact-check → resumir. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Worker tem aprovação humana interna (ex.: finance_approval antes de processar reembolso). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- Worker precisa de retry local com backoff (ex.: testar código → falhar → corrigir → retestar até 3x). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### Padrão de implementação de subgraph

```python
# Subgraph do worker de pesquisa
class ResearchSubgraphState(TypedDict):
    local_goal: str
    search_context: dict
    local_history: list[dict]
    raw_search_results: list[str]        # Estado local (não vaza para o pai)
    filtered_results: list[str]
    fact_check_notes: list[str]
    structured_output: dict

sub_builder = StateGraph(ResearchSubgraphState)

def parse_input(state: ResearchSubgraphState):
    return {"local_history": state["local_history"] + [{"role": "system", "content": "Iniciando pesquisa..."}]}

def search_node(state: ResearchSubgraphState):
    # Chama tool de busca
    results = buscar_web.invoke(state["local_goal"])
    return {"raw_search_results": results}

def filter_node(state: ResearchSubgraphState):
    # Filtra por relevância
    filtered = [r for r in state["raw_search_results"] if "2025" in r or "2026" in r]
    return {"filtered_results": filtered}

def summarize_node(state: ResearchSubgraphState):
    # Gera resumo estruturado
    resumo = gerar_resumo.invoke(state["filtered_results"])
    return {"structured_output": resumo}

sub_builder.add_node("parse", parse_input)
sub_builder.add_node("search", search_node)
sub_builder.add_node("filter", filter_node)
sub_builder.add_node("summarize", summarize_node)
sub_builder.add_edge(START, "parse")
sub_builder.add_edge("parse", "search")
sub_builder.add_edge("search", "filter")
sub_builder.add_edge("filter", "summarize")
sub_builder.add_edge("summarize", END)

research_subgraph = sub_builder.compile()
```

### Mapeamento de estado pai↔subgraph

O padrão mais seguro é **mapeamento explícito via função ponte**, não rely em chaves com mesmo nome: [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

```python
def call_research_subgraph(state: SupervisorState) -> dict:
    # Input mapping: supervisor → subgraph
    sub_inputs = {
        "local_goal": state["task_goal"],
        "search_context": copy.deepcopy(state["global_context"]),
        "local_history": [],
    }
    
    # Invoca subgraph
    sub_result = research_subgraph.invoke(sub_inputs)
    
    # Output mapping: subgraph → supervisor
    return {
        "final_summary": sub_result["structured_output"]["resumo"],
        "global_messages": state["global_messages"] + [
            {"role": "assistant", "content": "Subgraph de pesquisa concluído."}
        ],
    }

# Monta grafo pai
parent_builder = StateGraph(SupervisorState)
parent_builder.add_node("research_worker", call_research_subgraph)
parent_builder.add_edge(START, "research_worker")
parent_builder.add_edge("research_worker", END)
parent_graph = parent_builder.compile()
```

***

## 4. Armadilhas comuns (e como evitar)

### 1. AttributeError: falha de mapeamento de estado

**Sintoma:** `AttributeError: 'ParentState' object has no attribute 'local_goal'`. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Causa:** Subgraph montado diretamente como node sem função ponte; runtime tenta ler chave inexistente no estado do pai. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Solução:** Sempre use função adaptadora para mapear campos explicitamente. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### 2. GraphRecursionError: loop infinito em subgraph

**Sintoma:** `GraphRecursionError: Recursion limit of 25 reached in subgraph 'coding_subgraph'`. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Causa:** Loop interno de retry no subgraph incrementa contador que propaga para o pai. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Solução:** Configure `recursion_limit` maior no invoke do pai ou implemente circuit-breaker interno baseado em contador. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### 3. TypeError: UUID não serializável

**Sintoma:** `TypeError: Object of type 'UUID' is not JSON serializable`. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Causa:** UUID ou conexão de banco escrita diretamente no estado local do subgraph. [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

**Solução:** Converta para `str(uuid_obj)` antes de escrever; estado deve conter apenas tipos nativos (str, int, float, dict, list). [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)

### 4. Poluição de contexto entre workers

**Sintoma:** Worker B recebe mensagens irrelevantes do Worker A e gera output confuso. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

**Causa:** `messages` global passado inteiro para todos os workers. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

**Solução:** Passe apenas `search_context` filtrado; workers escrevem em `local_messages` interno. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

### 5. Supervisor alucinando nomes de agentes

**Sintoma:** Supervisor retorna `next_worker: "analista"` mas só existem `["researcher", "writer", "coder"]`. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

**Causa:** Schema de output sem `Literal` — LLM inventa nomes. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

**Solução:** Use `Literal` no schema de roteamento; LLM não pode retornar nome fora do enum. [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

***

## 5. Checklist de handoff seguro

- [ ] Função ponte faz mapeamento explícito de campos (não rely em chaves iguais) [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- [ ] `copy.deepcopy()` no contexto antes de passar para o worker [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- [ ] Worker retorna apenas `structured_output` (não append em `messages` global) [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- [ ] Schema de output validado com Pydantic [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)
- [ ] Subgraph tem try-except interno e retorna `error_payload` estruturado [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- [ ] `recursion_limit` configurado para subgraphs com loops [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- [ ] Estado contém apenas tipos serializáveis (str, int, float, dict, list) [xbstack](https://www.xbstack.com/en/ai/langgraph-subgraph-worker-state/)
- [ ] Supervisor usa `Literal` no schema de roteamento [yogprajapati](https://www.yogprajapati.site/writing/multi-agent-orchestration-langgraph)

Se quiser, no próximo passo eu monto o template completo com os três padrões (node function, subgraph simples, subgraph com HITL) já integrados ao supervisor do seu squad.



6. **Human-in-the-loop (HITL)**
   - Onde colocar `interrupt()` (ações destrutivas, gastos, posts) 
   - Decisões permitidas: approve / edit / reject 
   - Retomada com `Command(resume=...)` mantendo o mesmo `thread_id` 



Perfeito — vou te dar o **passo a passo exato** para implementar HITL à prova de falhas, baseado nos padrões de produção de 2026. É um checklist executável, com os erros mais comuns já documentados e como evitá-los.

***

## Passo a passo: Human-in-the-Loop (HITL) à prova de falhas

### **PASSO 1 — Configurar checkpointer (obrigatório antes de qualquer `interrupt()`)**

Sem checkpointer, `interrupt()` lança `RuntimeError` e o estado se perde enquanto espera. [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

```python
# checkpointer.py
from langgraph.checkpoint.postgres import PostgresSaver

# Produção: PostgresSaver
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:pass@host/db"
)
checkpointer.setup()  # Executa uma vez no startup (cria tabelas)

# Dev: InMemorySaver (apenas para testes locais)
# from langgraph.checkpoint.memory import InMemorySaver
# checkpointer = InMemorySaver()
```

**Regras de ouro:**

- **Nunca use `InMemorySaver` em produção** — estado some se o processo reiniciar .
- **Execute `checkpointer.setup()` uma vez no startup** — cria as tabelas de checkpoint .
- **Mesmo `thread_id` para invoke e resume** — senão o estado não é recuperado. [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

***

### **PASSO 2 — Definir o schema de aprovação (tipado e validado)**

Crie um schema explícito para as decisões humanas — isso evita que o frontend envie dados malformados: [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)

```python
# approval_schema.py
from typing import Literal, Optional
from pydantic import BaseModel, Field

class ApprovalDecision(BaseModel):
    """
    Schema de decisão humana para HITL.
    Usado tanto no interrupt() quanto no resume().
    """
    decision: Literal["approve", "edit", "reject"] = Field(
        description="Decisão do humano: approve (executa), edit (modifica antes de executar), reject (aborta)"
    )
    edited_action: Optional[dict] = Field(
        default=None,
        description="Ação modificada (apenas se decision='edit')"
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Justificativa da decisão (opcional, mas recomendado para audit trail)"
    )
```

**Regras de ouro:**

- **Use `Literal["approve", "edit", "reject"]`** — evita decisões inventadas .
- **`edited_action` é `Optional`** — só é preenchido se `decision='edit'`. [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)
- **`reasoning` é opcional mas recomendado** — ajuda no audit trail e debugging .

***

### **PASSO 3 — Implementar o gatekeeper (nó de aprovação)**

O gatekeeper é o nó que **pausa** o grafo para aprovação humana: [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)

```python
# gatekeeper.py
from typing import Literal
from langgraph.types import interrupt, Command
from approval_schema import ApprovalDecision
from states import SupervisorState

def gatekeeper_aprovacao_node(state: SupervisorState) -> Command[Literal["proceed", "abort"]]:
    """
    Nó de aprovação humana para ações destrutivas.
    Pausa o grafo e espera decisão do humano.
    """
    # 1. Extrai ação pendente do estado
    pending_action = state.get("pending_tool_call", {})
    
    # 2. Verifica se realmente precisa de aprovação
    # (não pause para leitura ou escrita local)
    if pending_action.get("type") not in ["postar_instagram", "enviar_email", "processar_pagamento"]:
        return Command(goto="execute_tool")
    
    # 3. === PAUSA PARA APROVAÇÃO HUMANA ===
    # O interrupt() mostra isso no dashboard do LangSmith / UI custom
    decision_payload = interrupt({
        "question": f"Aprovar ação: {pending_action['type']}?",
        "action_preview": pending_action,
        "reasoning": state.get("last_reasoning_trace", ""),
        "risk_level": state.get("risk_level", "medium"),
        "allowed_decisions": ["approve", "edit", "reject"],
    })
    
    # 4. Valida a decisão (type safety)
    try:
        approval = ApprovalDecision.model_validate(decision_payload)
    except Exception as e:
        # Fallback: decisão malformada
        return Command(goto="abort", update={
            "global_error": f"Decisão de aprovação inválida: {str(e)}",
        })
    
    # 5. === PROCESSA A DECISÃO ===
    if approval.decision == "approve":
        # Executa a ação original
        return Command(goto="execute_tool")
    
    elif approval.decision == "edit":
        # Substitui a ação pela versão editada
        if not approval.edited_action:
            return Command(goto="abort", update={
                "global_error": "Decisão 'edit' sem edited_action.",
            })
        
        # Atualiza pending_tool_call com a versão editada
        return Command(
            goto="execute_tool",
            update={"pending_tool_call": approval.edited_action}
        )
    
    elif approval.decision == "reject":
        # Aborta a ação
        return Command(goto="abort")
    
    else:
        # Fallback (nunca deve acontecer com Literal)
        return Command(goto="abort", update={
            "global_error": f"Decisão desconhecida: {approval.decision}",
        })
```

**Regras de ouro do gatekeeper:**

- **Só pause para ações destrutivas** — não use para leitura ou escrita local. [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)
- **Valide a decisão com Pydantic** — evita dados malformados do frontend .
- **Retorne `Command(goto=...)`** — gatekeepers controlam fluxo, não apenas dados. [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)
- **Fallback para erro claro** — se a decisão for inválida, reporta `global_error` .

***

### **PASSO 4 — Implementar o nó de execução (após aprovação)**

Este nó **executa** a ação aprovada: [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)

```python
# execute_tool.py
from states import SupervisorState

def execute_tool_node(state: SupervisorState) -> dict:
    """
    Executa a ação aprovada pelo humano.
    Só é chamado após gatekeeper aprovar.
    """
    pending_action = state.get("pending_tool_call", {})
    
    if not pending_action:
        return {
            "global_error": "Nenhuma ação pendente para executar.",
            "next_worker": "__end__",
        }
    
    try:
        # 1. Executa a ação baseada no tipo
        action_type = pending_action["type"]
        
        if action_type == "postar_instagram":
            resultado = postar_instagram_tool.invoke(pending_action["params"])
        elif action_type == "enviar_email":
            resultado = enviar_email_tool.invoke(pending_action["params"])
        elif action_type == "processar_pagamento":
            resultado = processar_pagamento_tool.invoke(pending_action["params"])
        else:
            return {
                "global_error": f"Tipo de ação desconhecido: {action_type}",
                "next_worker": "__end__",
            }
        
        # 2. Retorna resultado estruturado
        return {
            "worker_outputs": [{
                "tipo": "acao_aprovada",
                "acao": action_type,
                "resultado": resultado,
            }],
            "is_approved": True,
        }
    
    except Exception as e:
        # 3. Falha na execução: reporta erro
        return {
            "global_error": f"Ação aprovada falhou na execução: {str(e)}",
            "next_worker": "__end__",
        }
```

**Regras de ouro da execução:**

- **Try-except em toda tool externa** — falha de API não pode crashar o grafo .
- **Retorna `is_approved: True`** — supervisor sabe que ação foi concluída .
- **Fallback para erro claro** — se ação falhar, reporta `global_error` .

***

### **PASSO 5 — Integrar gatekeeper e execução no supervisor**

Agora você monta o fluxo completo no grafo do supervisor: [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

```python
# supervisor_nodes.py
from langgraph.types import Command
from states import SupervisorState
from gatekeeper import gatekeeper_aprovacao_node
from execute_tool import execute_tool_node

def preparar_aprovacao_node(state: SupervisorState) -> dict:
    """
    Nó preparatório: define pending_tool_call antes de chamar gatekeeper.
    """
    # Extrai ação que precisa de aprovação (ex.: do último worker output)
    last_output = state["worker_outputs"][-1] if state.get("worker_outputs") else {}
    
    if last_output.get("requer_aprovacao"):
        return {
            "pending_tool_call": last_output["acao_pendente"],
            "next_worker": "gatekeeper_aprovacao",
        }
    else:
        # Não precisa de aprovação: avança direto
        return {
            "next_worker": "proximo_worker",  # ou "__end__"
        }

# Monta o fluxo no grafo principal
from langgraph.graph import StateGraph, START, END

builder = StateGraph(SupervisorState)

# Adiciona nós
builder.add_node("preparar_aprovacao", preparar_aprovacao_node)
builder.add_node("gatekeeper_aprovacao", gatekeeper_aprovacao_node)
builder.add_node("execute_tool", execute_tool_node)
builder.add_node("abort", lambda state: {"global_error": "Ação abortada pelo humano."})

# Arestas
builder.add_edge(START, "preparar_aprovacao")
builder.add_conditional_edges(
    source="preparar_aprovacao",
    path=lambda state: "gatekeeper_aprovacao" if state.get("pending_tool_call") else "proximo_worker",
)
builder.add_edge("gatekeeper_aprovacao", "execute_tool")  # Se approve/edit
builder.add_edge("gatekeeper_aprovacao", "abort")  # Se reject
builder.add_edge("execute_tool", "supervisor")  # Volta pro supervisor após executar
builder.add_edge("abort", "supervisor")  # Volta pro supervisor após abortar

graph = builder.compile(checkpointer=checkpointer)  # Checkpointer obrigatório!
```

**Regras de ouro da integração:**

- **Nó preparatório separa lógica de gatekeeper** — gatekeeper só pausa, não decide .
- **Gatekeeper → execute_tool → supervisor** — fluxo linear e previsível. [mcpservers](https://mcpservers.org/agent-skills/langchain-ai/skills-benchmarks/langgraph-human-in-the-loop)
- **Checkpointer no compile** — obrigatório para `interrupt()` funcionar. [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

***

### **PASSO 6 — Retomada com `Command(resume=...)` (frontend ou API)**

Após o humano decidir, o frontend chama o grafo novamente com o **mesmo `thread_id`** e a decisão: [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

```python
# resume_flow.py
from approval_schema import ApprovalDecision

def retomar_aprovacao(thread_id: str, decision: ApprovalDecision) -> dict:
    """
    Retoma o grafo após aprovação humana.
    Mantém o mesmo thread_id para recuperar o estado do checkpoint.
    """
    config = {
        "configurable": {"thread_id": thread_id},  # MESMO thread_id do invoke original
    }
    
    # Retoma com a decisão do humano
    result = graph.invoke(
        Command(resume=decision.model_dump()),  # Serializa a decisão
        config=config,
    )
    
    return result
```

**Regras de ouro da retomada:**

- **Mesmo `thread_id` do invoke original** — senão o estado não é recuperado. [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)
- **`Command(resume=...)` serializa a decisão** — usa `model_dump()` do Pydantic .
- **Trata erro de thread inexistente** — se o `thread_id` for inválido, o checkpoint falha. [mcpservers](https://mcpservers.org/agent-skills/langchain-ai/skills-benchmarks/langgraph-human-in-the-loop)

***

### **PASSO 7 — Testes de validação (antes de deploy)**

Rode estes testes **obrigatórios** antes de colocar em produção: [mcpservers](https://mcpservers.org/agent-skills/langchain-ai/skills-benchmarks/langgraph-human-in-the-loop)

```python
# tests/test_hitl.py
import pytest
from approval_schema import ApprovalDecision
from gatekeeper import gatekeeper_aprovacao_node
from execute_tool import execute_tool_node
from states import SupervisorState

def test_aprovacao_schema_valida():
    """Garante que o schema de aprovação valida decisões corretas."""
    decision = ApprovalDecision(
        decision="approve",
        reasoning="Ação segura e dentro do orçamento."
    )
    assert decision.decision == "approve"
    assert decision.edited_action is None

def test_aprovacao_schema_edit_com_acao():
    """Garante que 'edit' exige edited_action."""
    decision = ApprovalDecision(
        decision="edit",
        edited_action={"type": "enviar_email", "params": {"destinatario": "novo@email.com"}},
        reasoning="Corrigi o destinatário."
    )
    assert decision.decision == "edit"
    assert decision.edited_action is not None

def test_gatekeeper_pausa_para_acao_destrutiva():
    """Garante que gatekeeper pausa para ações destrutivas."""
    state: SupervisorState = {
        "thread_id": "test-1",
        "session_id": "sess-1",
        "user_id": "user-1",
        "current_worker": "gatekeeper",
        "messages": [],
        "task_goal": "Teste HITL",
        "final_summary": None,
        "risk_level": "high",
        "is_approved": False,
        "worker_outputs": [],
        "citations": [],
        "next_worker": "gatekeeper_aprovacao",
        "global_error": None,
        "iteration_count": 0,
        "attempted_workers": [],
        "pending_tool_call": {"type": "enviar_email", "params": {"destinatario": "teste@email.com"}},
        "last_reasoning_trace": "Enviar e-mail de confirmação.",
    }
    
    # Simula a decisão do humano (em produção viria do frontend)
    # Em teste, mockamos o interrupt() para retornar a decisão
    from unittest.mock import patch
    
    with patch("gatekeeper.interrupt") as mock_interrupt:
        mock_interrupt.return_value = {"decision": "approve", "reasoning": "Aprovado."}
        
        result = gatekeeper_aprovacao_node(state)
        
        # Verifica que o gatekeeper retornou Command(goto="execute_tool")
        assert result.goto == "execute_tool"

def test_retomada_mesmo_thread_id():
    """Garante que retomada usa o mesmo thread_id."""
    thread_id = "test-hitl-1"
    
    # Invoke original (pausa no interrupt)
    config = {"configurable": {"thread_id": thread_id}}
    
    # Em produção, o invoke original pausaria no interrupt()
    # Em teste, mockamos para simular a pausa
    
    # Retomada
    decision = ApprovalDecision(decision="approve", reasoning="Aprovado no teste.")
    
    result = graph.invoke(
        Command(resume=decision.model_dump()),
        config=config,  # MESMO thread_id
    )
    
    # Verifica que o estado foi recuperado e ação executada
    assert result["is_approved"] is True
```

**Regras de ouro dos testes:**

- **Teste de schema válido** — garante que Pydantic valida decisões corretas .
- **Teste de 'edit' com edited_action** — garante que 'edit' exige ação modificada. [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)
- **Teste de retomada com mesmo thread_id** — garante que estado é recuperado do checkpoint. [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

***

### **PASSO 8 — Checklist final de deploy**

Antes de colocar em produção, verifique **cada item** desta lista: [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)

- [ ] Checkpointer configurado e `setup()` executado no startup [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)
- [ ] `interrupt()` só é chamado para ações destrutivas (não para leitura) [reddit](https://www.reddit.com/r/LangChain/comments/1tlkho6/how_are_you_handling_tool_authorization_in/)
- [ ] Schema de aprovação usa `Literal["approve", "edit", "reject"]` 
- [ ] Gatekeeper valida decisão com Pydantic antes de processar 
- [ ] Gatekeeper retorna `Command(goto=...)` (não apenas dict) [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)
- [ ] Nó de execução tem try-except em toda tool externa 
- [ ] Retomada usa **mesmo `thread_id`** do invoke original [callsphere](https://callsphere.ai/blog/langgraph-human-in-the-loop-approval-gates-manual-intervention)
- [ ] Retomada usa `Command(resume=...)` com decisão serializada 
- [ ] Testes de HITL passam (schema, gatekeeper, retomada) [mcpservers](https://mcpservers.org/agent-skills/langchain-ai/skills-benchmarks/langgraph-human-in-the-loop)

***

Se quiser, no próximo passo eu monto o template completo com **todos os arquivos** (`checkpointer.py`, `approval_schema.py`, `gatekeeper.py`, `execute_tool.py`, `supervisor_nodes.py`, `resume_flow.py`, `tests/test_hitl.py`) já integrados e prontos para copiar.



7. **Observabilidade e custo**
   - LangSmith: projeto, tags, metadata por thread 
   - Métricas: tokens por agente, tempo por nó, custo por tarefa 
   - Versionar prompts, tools e topologia 

***

## ⚙️ 2. Engenheiro de ML em Produção (visão micro)

### Tópicos que ele lista:

1. **Tools como boundary de confiança**
   - Cada tool com **Pydantic schema**, descrição clara e validação de input 
   - Separação **leitura vs escrita** (nunca uma `database_tool` única) 
   - Retry com backoff exponencial e idempotency key 

2. **Validação de saída**
   - `response_format=ToolStrategy(MeuModelo)` pra saída estruturada dentro do loop 
   - Validação explícita: `assert "tema" in dados`, `0 <= score <= 1` 
   - Fallback: se falhar, chama LLM de novo com mensagem de erro (retry com feedback) 

3. **Middleware stack**
   - `PIIMiddleware` (mascara e-mail, telefone) 
   - `SummarizationMiddleware` (resume histórico quando estoura tokens) 
   - `HumanInTheLoopMiddleware` (pausa em ações sensíveis) 
   - Middleware custom: `before_model`, `wrap_tool_call`, `after_agent` 

4. **Checkpointing e memória**
   - Dev: `InMemorySaver`; Prod: `PostgresSaver` (nunca InMemory em prod) 
   - `thread_id` com formato claro: `"usuario:sessao:tarefa"` 
   - Recuperação de thread após crash (todo estado no checkpoint) 

5. **Tratamento de erro por nó**
   - Cada worker envolto em `try/except` que retorna **estado de erro estruturado** (não levanta) [markaicode](https://markaicode.com/best/best-langgraph-agent-architecture/)
   - Supervisor decide: retry, pular, ou abortar [docs.langchain](https://docs.langchain.com/oss/python/releases/langchain-v1)
   - Timeout em todo nó de LLM 

6. **Performance e custo**
   - Cache de respostas de tools (ex: mesma busca não roda 2x) 
   - Limite de tokens por thread + summarization 
   - Parallelização quando possível (workers independentes rodam em paralelo) [medium](https://medium.com/@caldasdcardoso/swarm-architecture-agents-in-langgraph-b8b1b53c61b3)

7. **Segurança e compliance**
   - Credentials fora do estado (variáveis de ambiente, secret manager) [lifetideshub](https://www.lifetideshub.com/langgraph-supervisor-pattern-examples-2026/)
   - Auditoria: log de todas as tool calls e decisões humanas 
   - Rate limiting por tool externa 

***

## 🧩 Como isso vira código no LangGraph

O squad vira algo assim:

```python
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
import operator

class State(TypedDict):
    messages: Annotated[list, add_messages]
    task: str
    resultados: Annotated[list, operator.add]
    proximo: Literal["pesquisador", "redator", "revisor", "FIM"]
    iteration_count: int

def supervisor(state: State) -> dict:
    # LLM decide o próximo worker ou FIM
    # incrementa iteration_count
    ...

def pesquisador(state: State) -> dict:
    # chama tools de busca, valida, retorna
    ...

def roteador(state: State) -> str:
    return state["proximo"]

builder = StateGraph(State)
builder.add_node("supervisor", supervisor)
builder.add_node("pesquisador", pesquisador)
builder.add_node("redator", redator)
builder.add_node("revisor", revisor)

builder.add_edge(START, "supervisor")
builder.add_conditional_edges("supervisor", roteador,
    {"pesquisador": "pesquisador", "redator": "redator",
     "revisor": "revisor", "FIM": END})
builder.add_edge("pesquisador", "supervisor")
builder.add_edge("redator", "supervisor")
builder.add_edge("revisor", "supervisor")

graph = builder.compile(checkpointer=checkpointer)
```

***

## ✅ Checklist final (o que não pode faltar)

- [ ] Padrão de arquitetura definido (supervisor / hierárquico / swarm) [medium](https://medium.com/@caldasdcardoso/swarm-architecture-agents-in-langgraph-b8b1b53c61b3)
- [ ] State Schema com reducers e sem objetos não-serializáveis [markaicode](https://markaicode.com/best/best-langgraph-agent-architecture/)
- [ ] Guardas de loop (`iteration_count` + `max_iterations`) [markaicode](https://markaicode.com/best/best-langgraph-agent-architecture/)
- [ ] Tools validadas com Pydantic e descrições claras 
- [ ] Middleware stack (PII, summarization, HITL) 
- [ ] Checkpointer em prod (`PostgresSaver`) 
- [ ] Tratamento de erro por nó (try/except estruturado) [markaicode](https://markaicode.com/best/best-langgraph-agent-architecture/)
- [ ] Observabilidade (LangSmith, tags, custo por thread) 

Se quiser, no próximo passo eu monto um template de squad completo (supervisor + 3 workers + validador + HITL) já com esse checklist implementado.