# Ambiente de render Remotion no Windows

## Storage Google Drive do grafo

O modo real da CLI usa `options.graph.storageMode=drive`; testes mantêm
`storageMode=off`. O ambiente é validado em `env_check` antes da produção:

- `HSL_DRIVE_FOLDER_ID`: obrigatório no modo Drive;
- `HSL_GOOGLE_CLIENT_SECRET_FILE`: caminho absoluto fora do repositório;
- `HSL_GOOGLE_TOKEN_FILE`: caminho do token OAuth fora do repositório ou o
  default ignorado `config/token.json`;
- `HSL_PYTHON`: executável opcional. Sem ele, o helper tenta `py -3`,
  `python3` e `python`, sempre com argv literal e sem shell.

`npm run hsl:drive:auth` abre um servidor loopback em `127.0.0.1`, imprime o
URL OAuth v2 e grava o token apenas no path fornecido pelo ambiente. A CLI não
registra o conteúdo das credenciais no estado, nos recibos ou nos relatórios.
O prune real exige `--prune apply`; o padrão é `dry-run`.

## Aprovação de Start Frames

No caminho real, image_generate_prepare publica uma fila única em runs/<E>/images/QUEUE.json com `generator: codex-imagegen`. image_generate_run chama `codex exec` com ImageGen nativo e o login ChatGPT do usuário, sem IDE aberta; o validador rejeita filas com outro gerador. `npm run hsl:codex:login` abre o login e `npm run hsl:codex:status` confirma a sessão. Depois, image_review_prepare anexa os arquivos diretamente ao codex exec -i/--image, registra SHA-256, score, fidelidade, texto detectado e issues. Score mínimo: 75. Detalhes em ACCOUNTS.md.

Se o Codex estiver sem cota ou indisponível, a validação física permanece válida, mas o grafo interrompe obrigatoriamente em IMAGE_HUMAN_REVIEW. O Firefly só recebe trabalho após aprovação do revisor ou desse fallback humano.

## Perfil persistente do Firefly

O motor real exige `HSL_FIREFLY_AGENT_DIR`. `HSL_FIREFLY_CHROME_PROFILE` é opcional e usa `D:\\HSL-FIREFLY-PROFILE` por padrão. Esse perfil limpo foi validado com sessão Adobe e upload de primeiro frame. Antes de cada take, o adaptador consulta processos `chrome.exe` por `CommandLine`; se o perfil estiver aberto, falha com `FIREFLY_PROFILE_IN_USE` e não encerra o Chrome.

Uma sessão inválida abre Chrome visível com esse perfil no nó prepare e interrompe em `FIREFLY_LOGIN`. O resume volta à preparação e faz novo `--probe-session`. O agente roda por argv literal, sem shell:

```text
<agent>/.venv/Scripts/python.exe <agent>/main.py --root <runtime-do-take> --feed-guide <guide.json>
<agent>/.venv/Scripts/python.exe <agent>/main.py --root <runtime-do-take> --concurrency 1 --run
```

O upload virtual do Playwright foi aceito no perfil limpo. O helper UI Automation está em `graph/production/lib/firefly/nativeFileChooserUia.ps1` para recuperação; no perfil antigo, o navegador não expunha um diálogo nativo detectável.

Data do diagnóstico: 2026-09-02. Root testado:
`D:\HSL STUDIO AGENTS\hsl-video-studio`.

## Resultado

O render mínimo isolado passou com a configuração original. Foram renderizados
os frames 0–29 do bundle `build`, composição `HslLongFormComposition`, com o
mesmo argv do `renderChunk` da referência e somente a faixa e a saída trocadas.
Resultado: exit 0, 30/30 frames, 60.465 ms, MP4 de 104,7 kB.

Isso elimina como causa permanente o espaço no path, o Chrome Headless Shell
instalado e as flags originais. O timeout anterior de 25.000 ms ocorreu na
abertura do browser durante execuções longas/concorrentes. A conclusão suportada
pelos testes é contenção transitória de recursos; não há evidência para atribuir
a falha a uma flag específica. Durante a comparação com `main` havia outro
Remotion renderizando o EP 012 e apenas cerca de 1,7 GB de RAM física livre. O
teste isolado foi executado depois que esse processo terminou.
Depois disso, a terceira referência e o grafo abriram quatro browsers cada,
renderizaram 18.000 frames por execução e terminaram com exit 0. Esse resultado
reforça a contenção concorrente como causa raiz operacional.

Nenhuma variação de `--timeout`, `--gl`, `--browser-executable` ou clone sem
espaços foi necessária. Por isso `remotion.config.ts` não foi alterado. Ele já
define concorrência 2, timeout de delayRender de 3.600.000 ms e GL `angle`.
No Remotion 4.0.513, o timeout de abertura do browser é outro valor: 25.000 ms,
fixo em `@remotion/renderer/dist/open-browser.js`; `--timeout` controla
delayRender e não esse handshake.

## Browser validado

- CLI: `@remotion/cli 4.0.513`. Nesta versão, `npx remotion --version` imprime
  a versão e o help, mas retorna exit 1; a saída foi preservada no recibo.
- `npx remotion browser ensure`: exit 0.
- Binário: `node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe`.
- Execução direta, via `graph/lib/proc.ts`, `shell:false`, argv `--version`:
  exit 0, `Google Chrome for Testing 149.0.7790.0`.

## Comando isolado que passou

Os itens abaixo são argv literais enviados por `spawnTool`; aspas de shell não
fazem parte da execução:

```text
npx remotion render build HslLongFormComposition runs/HSL_EPISODE_011/graph/render-diagnostic/default.mp4
--props=runs/HSL_EPISODE_011/graph/render-diagnostic/render-props.json
--frames=0-29
--public-dir=build/public
--muted
--concurrency=2
--gl=angle
--image-format=jpeg
--jpeg-quality=80
--timeout=3600000
```

O props usa o mesmo scene plan e um servidor local novo, porque a porta salva
pela referência encerrada já não respondia. Bundle e assets são os mesmos da
segunda referência.

## Recomendação de setup

1. Executar `npx remotion browser ensure` após instalar dependências.
2. Não iniciar dois renders Remotion longos ao mesmo tempo nesta máquina.
3. Confirmar memória livre e ausência de Chrome Headless Shell órfão antes do
   render de 18.000 frames.
4. Manter o path atual: o teste provou que espaços não impedem o render.
5. Usar `graph/production/renderDiagnostic.ts` para repetir os 30 frames antes
   de uma referência longa quando o ambiente tiver mudado.

Evidências completas: `runs/HSL_EPISODE_011/graph/render-diagnostic/receipt.json`
e os logs individuais na mesma pasta.

## Chrome de login

`graph/production/openChromeLogin.ps1` abre Google Chrome visível com
`--user-data-dir=%LOCALAPPDATA%\HSLVideoStudio\ChromeProfile`. Esse perfil é
persistente para login humano no LangSmith Studio e é separado do perfil
temporário que o Remotion cria para render.

## Kling 2.5 Turbo

O grafo usa `HSL_FIREFLY_AGENT_DIR` para localizar o agente externo e
`HSL_FIREFLY_CHROME_PROFILE` para o perfil exclusivo persistente. Ambos foram
configurados no `.env` local; credenciais e cookies permanecem fora do Git.

O diagnóstico sem geração é `npm.cmd run hsl:kling:check`. Ele valida paths,
perfil livre, sessão autenticada e o último MP4 físico. Um canário pago exige
`HSL_ALLOW_PAID_FIREFLY_DISPATCH=true` somente no processo autorizado.

Em 2026-09-03, o canário real do Kling 2.5 Turbo passou: H.264, 1920x1080,
24 fps, 5,041667 s, 16.459.068 bytes e SHA-256
`b34cbbcb568b26fbc1ad6029a164caa2eac6f86b335473cd7afb8818b6c2493e`.
O primeiro e o último quadro são diferentes e a inspeção visual preservou o
avião, o equipamento de abastecimento, a mangueira, a iluminação e a composição,
sem pessoas, texto ou logos adicionados.
