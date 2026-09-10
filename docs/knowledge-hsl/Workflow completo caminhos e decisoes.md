

***

## Workflow completo: caminhos e decisões (padrão de produção 2026)

### **Visão geral do fluxo**

```
START → supervisor → [roteador] → worker → [validador] → [gatekeeper HITL?] → supervisor → ... → __end__
                              ↓
                      [salvar artefato no Drive]
```

**Regra de ouro:** supervisor **sempre** decide próximo passo; workers apenas executam e retornam dados. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### **CAMINHO 1: Fluxo normal (sem aprovação humana)**

```
START
  ↓
supervisor_node (decide próximo worker)
  ↓
roteador(state) → "pesquisador"
  ↓
pesquisador_node (executa busca)
  ↓
supervisor_node (avalia resultado)
  ↓
roteador(state) → "redator"
  ↓
redator_node (gera conteúdo)
  ↓
validador_qualidade_node (verifica score >= 7)
  ↓
supervisor_node (qualidade OK)
  ↓
roteador(state) → "salvar_artefato"
  ↓
salvar_artefato_node (upload no Drive)
  ↓
supervisor_node (artefato salvo)
  ↓
roteador(state) → "__end__"
  ↓
END
```

**Decisões do supervisor neste caminho:**

1. **Após pesquisador:** "Resultado suficiente? Sim → redator. Não → retry pesquisador ou abortar". [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
2. **Após validador:** "Score >= 7? Sim → salvar artefato. Não → retry redator". [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)
3. **Após salvar artefato:** "Task concluída? Sim → __end__. Não → próximo worker" .

***

### **CAMINHO 2: Fluxo com aprovação humana (HITL)**

```
START
  ↓
supervisor_node (decide próximo worker)
  ↓
roteador(state) → "redator"
  ↓
redator_node (gera conteúdo + ação pendente: postar_instagram)
  ↓
preparar_aprovacao_node (define pending_tool_call)
  ↓
gatekeeper_aprovacao_node (interrupt: pausa para humano)
  ↓
[AGUARDA DECISÃO HUMANA: approve / edit / reject]
  ↓
  ├─ approve → execute_tool_node (posta no Instagram) → supervisor → __end__
  ├─ edit → execute_tool_node (posta versão editada) → supervisor → __end__
  └─ reject → abort_node (registra "Ação abortada pelo humano") → supervisor → __end__
```

**Decisões do humano neste caminho:**

1. **approve:** executa ação original .
2. **edit:** substitui ação pela versão editada (ex.: muda legenda, destinatário) .
3. **reject:** aborta ação e registra no audit trail .

**Decisões do supervisor após HITL:**

- **Ação executada com sucesso:** `__end__` .
- **Ação falhou na execução:** retry ou abortar (depende do `risk_level`). [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### **CAMINHO 3: Fluxo com erro de worker**

```
START
  ↓
supervisor_node (decide próximo worker)
  ↓
roteador(state) → "pesquisador"
  ↓
pesquisador_node (falha: API de busca indisponível)
  ↓
supervisor_node (detecta global_error)
  ↓
roteador(state) → "__end__" (aborta)
  ↓
END
```

**Decisões do supervisor neste caminho:**

1. **Worker falhou:** verifica se é retry (ex.: `tool_error_count < 3`) ou abortar. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
2. **Retry:** chama mesmo worker novamente (incrementa `attempted_workers`). [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
3. **Abortar:** força `__end__` e registra `global_error`. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### **CAMINHO 4: Fluxo com loop detectado (circuit breaker)**

```
START
  ↓
supervisor_node (decide: pesquisador)
  ↓
pesquisador_node (executa)
  ↓
supervisor_node (decide: pesquisador novamente)
  ↓
pesquisador_node (executa)
  ↓
supervisor_node (decide: pesquisador pela 3ª vez)
  ↓
circuit_breaker_node (detecta loop: mesmo worker >3x)
  ↓
supervisor_node (força __end__)
  ↓
roteador(state) → "__end__"
  ↓
END
```

**Decisões do circuit breaker:**

1. **Mesmo worker >3x seguidas:** abre o circuit breaker .
2. **Força `__end__`:** evita loop infinito. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
3. **Registra `global_error`:** "Circuit breaker: loop de roteamento detectado" .

***

### **CAMINHO 5: Fluxo com busca de artefatos antigos (Drive)**

```
START
  ↓
supervisor_node (decide: buscar artefatos antes de começar)
  ↓
roteador(state) → "buscar_artefatos"
  ↓
buscar_artefatos_node (busca no Drive por "artigo IA")
  ↓
supervisor_node (artefatos encontrados: 3 resultados)
  ↓
roteador(state) → "pesquisador" (usa artefatos como contexto)
  ↓
pesquisador_node (enriquece busca com artefatos antigos)
  ↓
... (continua fluxo normal)
```

**Decisões do supervisor neste caminho:**

1. **Artefatos encontrados:** usa como contexto para próxima task .
2. **Nenhum artefato encontrado:** ignora e segue fluxo normal .

***

## **Árvore de decisões completa (todas as bifurcações)**

### **1. Supervisor decide próximo worker**

```
supervisor_node
  ├─ iteration_count >= MAX_ITERATIONS? → __end__
  ├─ global_error != None? → __end__
  ├─ qualidade_suficiente? → __end__
  ├─ next_worker = "pesquisador"? → pesquisador_node
  ├─ next_worker = "redator"? → redator_node
  ├─ next_worker = "revisor"? → validador_qualidade_node
  ├─ next_worker = "salvar_artefato"? → salvar_artefato_node
  ├─ next_worker = "buscar_artefatos"? → buscar_artefatos_node
  └─ next_worker = "gatekeeper_aprovacao"? → gatekeeper_aprovacao_node
```

**Regra:** supervisor **nunca** decide pular etapas; sempre segue a sequência lógica. [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

### **2. Validador de qualidade**

```
validador_qualidade_node
  ├─ word_count < 200? → global_error + sugere retry redator
  ├─ quality_score < 7? → global_error + sugere retry redator
  └─ quality_score >= 7? → next_worker = "salvar_artefato" ou "revisor"
```

**Regra:** validador **sugere** próximo passo, mas supervisor decide. [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)

***

### **3. Gatekeeper HITL**

```
gatekeeper_aprovacao_node
  ├─ pending_tool_call.type NOT in ["postar_instagram", "enviar_email", "processar_pagamento"]? → execute_tool (sem pausa)
  ├─ decision = "approve"? → execute_tool
  ├─ decision = "edit"? → execute_tool (com ação editada)
  └─ decision = "reject"? → abort
```

**Regra:** gatekeeper **só pausa** para ações destrutivas .

***

### **4. Circuit breaker**

```
circuit_breaker_node
  ├─ last_n_decisions[-1] == last_n_decisions[-2] == last_n_decisions[-3]? → circuit_open = True, força __end__
  └─ else → circuit_open = False, segue fluxo normal
```

**Regra:** circuit breaker é **última linha de defesa** contra loops .

***

## **Tabela de decisões por nó (resumo executivo)**

| Nó | Condição | Decisão | Próximo passo |
|---|---|---|---|
| **supervisor** | `iteration_count >= MAX_ITERATIONS` | Força fim | `__end__`  [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/) |
| **supervisor** | `global_error != None` | Aborta | `__end__`  [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/) |
| **supervisor** | `qualidade_suficiente == True` | Termina task | `__end__`  [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise) |
| **supervisor** | `next_worker = "pesquisador"` | Delega pesquisa | `pesquisador_node`  [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/) |
| **supervisor** | `next_worker = "redator"` | Delega redação | `redator_node`  [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/) |
| **validador** | `word_count < 200` | Qualidade baixa | Sugere retry redator  [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise) |
| **validador** | `quality_score < 7` | Qualidade baixa | Sugere retry redator  [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise) |
| **validador** | `quality_score >= 7` | Qualidade OK | Sugere próximo worker  [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise) |
| **gatekeeper** | `decision = "approve"` | Aprova | `execute_tool`  |
| **gatekeeper** | `decision = "edit"` | Aprova com edição | `execute_tool` (ação editada)  |
| **gatekeeper** | `decision = "reject"` | Rejeita | `abort`  |
| **circuit_breaker** | `mesmo_worker >3x` | Loop detectado | Força `__end__`  |
| **buscar_artefatos** | `artefatos_encontrados > 0` | Usa como contexto | Próximo worker (enriquecido)  |
| **buscar_artefatos** | `artefatos_encontrados == 0` | Ignora | Próximo worker (normal)  |

***

## **Checklist de decisões à prova de falhas**

Antes de deploy, verifique **cada item** desta lista: [aierrorhub](https://aierrorhub.com/providers/langgraph/conditional-edge-routing/)

- [ ] Supervisor verifica `iteration_count` ANTES de chamar LLM [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Supervisor força `__end__` se `iteration_count >= MAX_ITERATIONS` [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Supervisor força `__end__` se `global_error != None` [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Validador usa thresholds numéricos (ex.: `score >= 7`), não "avalie se está bom" [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)
- [ ] Validador **sugere** próximo passo, supervisor **decide** [augmentcode](https://www.augmentcode.com/guides/multi-agent-ai-architecture-patterns-enterprise)
- [ ] Gatekeeper só pausa para ações destrutivas (não para leitura) 
- [ ] Gatekeeper valida decisão com Pydantic antes de processar 
- [ ] Circuit breaker detecta mesmo worker >3x seguidas 
- [ ] Todo worker retorna `global_error` se falhar (não crasha o grafo) [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)
- [ ] Todo worker **não decide** próximo passo (apenas supervisor decide) [lifetideshub](https://www.lifetideshub.com/why-langgraph-supervisor-loops-forever/)

***

Se quiser, no próximo passo eu monto o **diagrama visual** (Mermaid ou ASCII art) de todos os caminhos e decisões, já pronto para colar na documentação do seu squad.