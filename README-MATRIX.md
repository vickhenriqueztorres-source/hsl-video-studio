# 🎛️ HSL Matrix Console & LangGraph Dashboard

A **Matrix Console** é o centro de comando local para observação e execução do grafo de produção do **Hidden Systems Lab (HSL)**. Ela lê checkpoints SQLite, manifests e índices de mídia, com CLI interativa e dashboard web em tempo real.

---

## 🚀 Como Iniciar

### 1. Menu Interativo da Matrix CLI
No Windows, dê dois cliques em `HSL-MATRIX.cmd` ou execute:
```bash
npm run hsl:matrix
```

### 2. Abrir o Dashboard Web Observador
Inicia o servidor local de visualização do grafo em `http://127.0.0.1:2030`:
```bash
npm run hsl:dashboard
```
> O painel é **somente leitura** para segurança: exibe o estado atual do LangGraph, nós ativos/concluídos, telemetria, eventos ao vivo e checkpoints salvos.

---

## ⚡ Comandos Diretos da Matrix CLI

### Firefly pelo terminal no Windows

O Matrix e o grafo rodam em PowerShell/CMD sem IDE. O agente Firefly usa Chrome
com janela e sessão Adobe persistida; uma IDE não participa da automação.
Configure `HSL_FIREFLY_AGENT_DIR` e `HSL_FIREFLY_CHROME_PROFILE` no `.env` com os
caminhos do agente e do perfil dedicado. O Python padrão é `.venv/Scripts/python.exe`
no agente; `HSL_FIREFLY_PYTHON` permite indicar outro executável.

```powershell
# Verifica a sessão; não enfileira nem gera vídeos.
npm run hsl:firefly:session -- probe

# Abre a janela dedicada para autenticação, quando necessária.
npm run hsl:firefly:session -- login

# Abre o menu no terminal. Use 3 para continuar o episódio salvo.
npm run hsl:matrix
```

Após autenticar, use `probe` ou **Continuar episódio**. O grafo encerra a janela
de login registrada pelo projeto antes de validar a sessão. O recibo vincula
perfil, PID e horário de criação; um Chrome desconhecido ou um worker ativo
continua bloqueando o perfil. Feche manualmente uma janela antiga aberta antes
dessa atualização. Falhas técnicas do probe exibem o caminho do log e não são
tratadas como login expirado.

O orçamento aprovado fica no ledger do episódio. Retomar não aumenta esse limite.
Resultados de despacho incertos exigem reconciliação antes de qualquer reenvio.
Para limitar um teste à etapa Firefly, preservando o checkpoint seguinte:

```powershell
npm run hsl:master:graph:resume -- --episode HSL_EPISODE_005 --until firefly_finalize
```

Uma pausa solicitada por `--until` retorna código 3. Gates pendentes retornam 2;
consulte a mensagem antes de retomar. Digite no terminal apenas os comandos dos
blocos acima, sem copiar saídas de logs ou explicações como comandos.

Você pode disparar qualquer ação diretamente via terminal:

```bash
# Cria um novo episódio com sugestão automática de pautas inéditas
npm run hsl:matrix -- novo

# Mostra 3 temas inéditos sugeridos pelo motor editorial
npm run hsl:matrix -- sugerir

# Retoma a execução a partir do último checkpoint salvo
npm run hsl:matrix -- continuar

# Exibe percentual de progresso, nó atual, imagens, takes e pausas
npm run hsl:matrix -- status

# Gera a fila de imagens pendentes
npm run hsl:matrix -- imagens

# Lista todo o acervo de episódios
npm run hsl:matrix -- episodios

# Abre o catálogo antirrepetição de temas
npm run hsl:matrix -- temas

# Abre o observador web (dashboard)
npm run hsl:matrix -- mapa

# Acompanha logs e progresso de eventos em tempo real
npm run hsl:matrix -- logs

# Entra ou troca contas Codex / Antigravity
npm run hsl:matrix -- contas

# Gerencia chaves e cotas da API ElevenLabs
npm run hsl:matrix -- elevenlabs

# Diagnóstico geral de ambiente, ferramentas (FFmpeg, Drive, etc.)
npm run hsl:matrix -- doctor

# Executa o fiscal técnico do Kling sem consumir cota de vídeo
npm run hsl:matrix -- kling
```

---

## 🧭 Menu Interativo (TUI)

Ao executar `npm run hsl:matrix` sem argumentos, o seguinte menu interativo é carregado:

```text
  [1] Criar novo episódio       [6] Abrir mapa mental
  [2] Sugerir próximo tema      [7] Listar episódios
  [3] Continuar episódio        [8] Catálogo de temas
  [4] Ver status                [9] Verificar ambiente
  [5] Gerar imagens pendentes   [D] Abrir Google Drive
  [K] Fiscal técnico do Kling   [L] Logs ao vivo
  [A] Contas Codex/Antigravity  [E] Chaves ElevenLabs
  [0] Sair
```

---

## 📚 Documentação Completa da Matrix

Todos os manuais técnicos detalhados da arquitetura Matrix estão localizados na pasta [`docs/graph/`](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph):

- **[docs/graph/MATRIX-CONSOLE.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/MATRIX-CONSOLE.md)**: Manual operacional completo da Matrix Console.
- **[docs/graph/MATRIX-LIVE.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/MATRIX-LIVE.md)**: Monitoramento ao vivo, cálculo de percentual e alternância de contas.
- **[docs/graph/ACCOUNTS.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/ACCOUNTS.md)**: Gerenciamento de credenciais e autenticação (Antigravity & Codex).
- **[docs/graph/ELEVENLABS-KEYS.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/ELEVENLABS-KEYS.md)**: Rotação de chaves e controle de cota de narração.
- **[docs/graph/KLING-SUPERVISOR.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/KLING-SUPERVISOR.md)**: Fiscal técnico, canário de teste e despacho seguro de vídeo.
- **[docs/graph/CLI-3MIN-DEBUG.md](file:///c:/Users/Paulo%20R%20Advocacia/Documents/HSL%20-%20STUDIO/docs/graph/CLI-3MIN-DEBUG.md)**: Guia de depuração rápida para testes de 3 minutos.
