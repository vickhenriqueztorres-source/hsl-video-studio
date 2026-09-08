# HSL — Revisao local de um scene plan

Avalie somente o JSON fixo abaixo. Nao acesse a rede, nao pesquise fontes,
nao execute ferramentas de producao e nao altere arquivos do repositorio.
Use apenas o contexto fornecido. Siga o contrato de transporte de resultado
ao final deste prompt; ele define se a resposta deve ser por stdout ou arquivo.

```json
{
  "sceneId": "smoke-bridge-01",
  "durationSeconds": 8,
  "narration": "Sensores acompanham a vibracao da ponte durante a passagem de um trem.",
  "visual": "Plano aberto da ponte, seguido por detalhe do sensor; sem texto sobreposto.",
  "audio": "Som ambiente de trem em volume baixo, sem cobrir a narracao.",
  "shots": [
    { "description": "Plano aberto", "start": 0, "end": 5 },
    { "description": "Detalhe do sensor", "start": 4, "end": 9 }
  ]
}
```

Verifique coerencia entre narracao, visual, audio e tempos. Atribua score de
0 a 100; verdict approve, revise ou reject; e issues com severity e message.
Use somente as informacoes fornecidas. Nao invente uma execucao de render.
