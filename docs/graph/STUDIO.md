# Preview no LangGraph Studio

O grafo de produção é exposto ao Agent Server pelo ID
`hsl_master_production`, configurado em `graph/langgraph.json`.

```powershell
npm.cmd run hsl:master:studio
```

Neste ambiente o preview usa a porta `2025`, pois a porta `2024` pertence ao
servidor do spike anterior. Abra:

<https://smith.langchain.com/studio?baseUrl=http://127.0.0.1:2025>

O entrypoint `graph/production/studio.ts` compila a mesma topologia usada pelo
CLI de produção. No Studio, o Agent Server gerencia seu próprio estado; as
execuções de produção por `hsl:master:graph` continuam usando o checkpointer
SQLite do repositório.
