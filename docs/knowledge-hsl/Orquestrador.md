# Checklist: Seu orquestrador tá nível hard?

Responde essas perguntas. Se **não** souber responder, é onde você precisa melhorar.

***

## 1. OBJETIVO

- [ ] **Qual é o objetivo CLARO do seu agente?**
  - Ex: "Gerar vídeo de 30s a partir de um prompt"
  - Se não sabe responder: **para e define**

- [ ] **Qual é o resultado final EXATO?**
  - Ex: "Um arquivo MP4, 1080p, 30s, com áudio"
  - Se é vago: **seu agente vai ser vago**

***

## 2. ETAPAS

- [ ] **Quais são as etapas, EM ORDEM?**
  - Ex: Prompt → Script → Validação → Imagens → Vídeo → Upload
  - Se não tem ordem: **seu agente vai pular etapas**

- [ ] **Cada etapa faz UMA coisa só?**
  - Ex: "Gerar script" faz só isso, não gera imagens também
  - Se uma etapa faz 3 coisas: **divide**

***

## 3. FERRAMENTAS

- [ ] **Qual ferramenta faz o quê?**
  - Ex: Codex → script, Antigravity → imagens, Selenium → vídeo
  - Se uma ferramenta faz tudo: **tá errado**

- [ ] **Por que essa ferramenta e não outra?**
  - Ex: "Codex porque é melhor em roteiro"
  - Se não sabe: **pesquisa**

***

## 4. VALIDAÇÃO

- [ ] **O que é um script BOM?**
  - Ex: "Tem hook, 3 atos, 100-150 palavras, 30s"
  - Se é "quando tá pronto": **não é critério**

- [ ] **Como você valida ANTES de seguir?**
  - Ex: "Checa se tem 3 atos, se não tem, refaz"
  - Se não valida: **vai gerar merda**

- [ ] **O que acontece se a validação falhar?**
  - Ex: "Volta pro nó anterior, refaz"
  - Se segue em frente: **tá errado**

***

## 5. ERROS

- [ ] **O que acontece se o Codex travar?**
  - Ex: "Tenta de novo em 10s, 3x"
  - Se "não sei": **vai quebrar**

- [ ] **Qual é o plano B?**
  - Ex: "Se Codex falhar, usa Antigravity"
  - Se não tem: **vai parar**

- [ ] **Como você sabe ONDE quebrou?**
  - Ex: "Olho os logs, cada nó loga thread_id + erro"
  - Se "não sei": **não tem logs**

***

## 6. RECURSOS

- [ ] **Onde os arquivos temporários são salvos?**
  - Ex: "temp/{thread_id}/"
  - Se "não sei": **tá salvando em lugar errado**

- [ ] **O que acontece com os arquivos depois?**
  - Ex: "Upload e depois deleta"
  - Se "fica lá": **seu HD vai encher**

- [ ] **Como você limpa?**
  - Ex: "shutil.rmtree(temp_dir) depois do upload"
  - Se não limpa: **vai vazar recurso**

***

## 7. CHECKPOINT

- [ ] **O que é salvo no checkpoint?**
  - Ex: "thread_id, script, imagens, vídeo_url, status"
  - Se "não sei": **não tem checkpoint**

- [ ] **Se o processo cair, onde retoma?**
  - Ex: "Último nó que completou"
  - Se "começa do zero": **não tem checkpoint**

- [ ] **Como você retoma?**
  - Ex: "graph.invoke(..., config={'thread_id': 'video_1'})"
  - Se não sabe: **não tem checkpoint**

***

## 8. LOGS

- [ ] **Onde os logs são salvos?**
  - Ex: "arquivo logs/{thread_id}.log"
  - Se "print": **não é log**

- [ ] **O que é logado?**
  - Ex: "thread_id, nó, input, output, erro, tempo"
  - Se "só erro": **não é suficiente**

- [ ] **Como você acha o log de uma execução?**
  - Ex: "grep 'video_123' logs/*.log"
  - Se "não sei": **não tem logs**

***

## 9. TIMEOUT

- [ ] **Quanto tempo cada nó pode demorar?**
  - Ex: "Script: 300s, Imagens: 60s, Vídeo: 120s"
  - Se "não sei": **pode travar pra sempre**

- [ ] **O que acontece se passar do tempo?**
  - Ex: "TimeoutError, tenta de novo"
  - Se "nada": **vai travar**

***

## 10. RETRY

- [ ] **Quantas vezes você tenta de novo?**
  - Ex: "3x"
  - Se "não sei": **não tem retry**

- [ ] **Qual o intervalo entre tentativas?**
  - Ex: "2s, 4s, 8s (backoff exponencial)"
  - Se "na hora": **não é retry, é spam**

***

## COMO USAR ESSE CHECKLIST

### Versão 1: Auto-avaliação

1. Imprime (ou salva) essas perguntas
2. Responde **uma por uma**
3. Se não souber: **é onde você precisa melhorar**
4. Prioriza as que têm mais impacto (validação, erro, checkpoint)

***

### Versão 2: Code Review

1. Pega seu código atual
2. Pra cada pergunta, **olha o código**
3. Se não tem: **adiciona**
4. Se tá mais ou menos: **melhora**

***

### Versão 3: IA te ajuda

Copia e cola isso na sua IA:

> "Aqui tá meu código do agente de vídeo. [cola o código]
> 
> Responde essas perguntas sobre meu código:
> [cola o checklist]
> 
> Me diz onde tá faltando coisa e como adicionar."

***

## Exemplo de como responder

**Pergunta:** "O que é um script BOM?"

**Resposta ruim:** "Quando tá pronto"

**Resposta boa:** 
```
- Tem hook nos primeiros 5s
- Tem 3 atos (início, meio, fim)
- 100-150 palavras
- Duração estimada: 25-35s
- Não tem palavras proibidas (ex: "clique aqui")
```

**Resposta nível hard:**
```python
def validar_script(script):
    criterios = {
        "tem_hook": script[0:50].lower().find("hook") != -1,
        "tem_3_atos": script.count("ATO") >= 3,
        "palavras": 100 <= len(script.split()) <= 150,
        "duracao": estimar_duracao(script) <= 35,
        "proibidas": not any(p in script.lower() for p in ["clique aqui", "compre agora"]),
    }
    return all(criterios.values()), criterios
```

***

## Próximo passo

Escolhe **UMA** seção (ex: "Validação") e responde as perguntas dela.

Depois me manda e eu te ajudo a melhorar.

**Não tenta fazer tudo de uma vez.** Uma seção por vez.