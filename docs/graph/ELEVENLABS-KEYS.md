# Chaves ElevenLabs no Matrix

Execute `npm.cmd run hsl:elevenlabs:keys` na raiz do projeto, ou use **E — Chaves ElevenLabs** no Matrix. Também há acesso em **A — Contas → 6**.

- **Adicionar**: informe um apelido e cole a chave na entrada oculta. A primeira chave vira ativa; as próximas ficam disponíveis para seleção.
- **Listar**: mostra apelido, identificador derivado de hash e indicação de chave ativa. Não exibe trechos da chave.
- **Escolher ativa**: selecione pelo número. A próxima narração do grafo usa essa chave.
- **Testar conexão**: consulta a assinatura na ElevenLabs, sem síntese. Mostra o uso informado pela conta; não é uma garantia de saldo específico da chave ou permissão para sintetizar uma voz. HTTP 403 pode significar falta de permissão de leitura ou restrição de IP.
- **Remover**: remove o cadastro local após digitar REMOVER. Não revoga a chave no provedor. Remover a ativa não ativa outra automaticamente.

Crie as chaves na sua conta ElevenLabs e cadastre-as aqui. O gerenciador não cria chaves no provedor. [Autenticação e permissões oficiais](https://elevenlabs.io/docs/api-reference/authentication) e [consulta de assinatura](https://elevenlabs.io/docs/api-reference/user/subscription/get).

## Armazenamento e integração

O arquivo `%LOCALAPPDATA%/HSLMatrix/credentials/elevenlabs.vault.json` fica fora do repositório. Todo o conteúdo é criptografado com DPAPI `CurrentUser`, usando o usuário Windows atual. Não é um arquivo de credenciais portátil para outra máquina/usuário. Chaves são transmitidas ao helper por stdin, nunca por argumentos, e não entram no checkpoint, JSON de produção ou UI web. Arquivos temporários também contêm somente dados criptografados. Escrita atômica e lock impedem sobreposição de edições.

O grafo lê a seleção no momento de iniciar a narração. O worker importa o adapter original e aplica a chave apenas naquele processo, sem modificar o orquestrador ou o adapter legado. Com chave ativa, as outras chaves cadastradas e as chaves de backup do ambiente não entram no pool do adapter. Sem chave ativa, mantém a configuração de ambiente legada (`ELEVENLABS_API_KEY` e backups). Não existe rotação automática entre cadastros.

O cache de narração continua sendo reutilizado. Trocar a chave não força regeneração de áudio nem retoma um episódio. O fallback Edge-TTS do adapter permanece com o comportamento legado. Trechos de chave que o adapter costuma imprimir são removidos pelo worker antes de chegar à CLI.

## Verificação

`npm.cmd run hsl:elevenlabs:test`: DPAPI real com chaves fictícias em pasta temporária, reabertura do cofre, seleção, remoção, duplicidade, corrupção, API simulada, aplicação ao config do adapter, sanitização e subprocesso real com cache fictício (sem síntese).

`tsc --noEmit` e menu interativo também foram verificados. A verificação de chave real fica disponível na opção 4 após o usuário cadastrar uma chave.
