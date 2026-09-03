---
name: hsl-image-worker
description: >-
  Consome filas QUEUE.json de Start Frames do Hidden Systems Lab usando exclusivamente
  o ImageGen integrado do Codex. Use quando o usuário pedir para gerar imagens do episódio,
  consumir uma fila de imagens ou executar hsl-image-worker.
---

# HSL Image Worker

Trabalhe somente na fila indicada pelo usuário. Se nenhuma for indicada, localize o arquivo QUEUE.json mais recente em runs/*/images por data de modificação.

1. Leia QUEUE.json. Processe, na ordem, cada item com status pending; itens done permanecem intactos.
2. Confirme que `generator` é exatamente `codex-imagegen`. Se estiver ausente ou tiver outro valor, pare e informe o erro; não use outro gerador.
3. Leia o promptPath do item sem alterá-lo. Gere a imagem exclusivamente com o ImageGen integrado do Codex (`image_gen`), em 16:9, na maior resolução disponível, sem texto e sem marca d'água. Copie o arquivo gerado de `$CODEX_HOME/generated_images/` para `outputPath`, como PNG.
4. Se a ferramenta entregar JPG, WebP ou largura inferior a 1920, mantenha o mesmo nome-base e execute:

       npm run hsl:images:validate -- --queue "<QUEUE.json>" --fix

   Caso contrário, execute o mesmo comando sem --fix. O validador exige PNG, aspecto 16:9 com tolerância de 1% e largura mínima de 1920, atualiza cada item para done ou rejected e imprime a tabela.
5. Para cada item rejected, leia lastError, gere novamente e valide. Faça no máximo duas novas tentativas por item.
6. Quando executado pelo LangGraph via `codex exec`, não execute resumeCommand nem retome o grafo: o processo pai valida os PNGs e continua automaticamente. Quando o usuário pedir execução manual da fila, valide todos os itens antes de executar seu resumeCommand. Se algum continuar rejected, informe os beats e erros.

Use o ImageGen nativo do Codex, inclusive pelo Codex CLI (`codex exec`) com a conta ChatGPT autenticada. O grafo chama `npm run hsl:images:generate -- --queue <QUEUE.json>` e dispensa uma IDE aberta. Não use o script Python image_gen.py, chave de API, Antigravity, Adobe Firefly, navegador ou outro gerador/fallback. Se `image_gen` estiver indisponível, reporte o erro; o grafo grava checkpoint em CODEX_IMAGE_UNAVAILABLE. A ferramenta pode variar o aspecto, limitar a resolução ou devolver JPG/WebP; `--fix` converte e faz upscale determinístico antes da validação.

Nunca altere prompt.md, gere fora de outputPath, despache Firefly, edite código ou marque manualmente um item como done.
