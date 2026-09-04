import 'dotenv/config';
import {findCli} from './drivers/process';
import {spawnTool,spawnInteractiveTool} from '../lib/proc';

export async function checkAntigravityAccount(root:string){
  const cli=findCli('agy')??findCli('antigravity');
  if(!cli)return{available:false,status:'NOT_INSTALLED',reason:'Antigravity CLI não encontrado no PATH.'};
  const result=await spawnTool(cli.command,[...cli.prefix,'models'],{cwd:root,timeoutMs:30000});
  const text=result.stdout+'\n'+result.stderr;
  const available=result.exitCode===0&&/gemini[-\w.]+/i.test(text);
  return{available,status:available?'CONNECTED':'LOGIN_REQUIRED',reason:available?'Sessão salva respondeu à consulta de modelos.':'Não foi possível consultar modelos. Abra o login Antigravity no Matrix.',credentialStore:'Cofre de credenciais do sistema, gerenciado pelo agy',command:'npm run hsl:antigravity:login'};
}
export async function loginAntigravity(root:string,changeAccount=false){
  const cli=findCli('agy')??findCli('antigravity');if(!cli)throw new Error('Instale Antigravity CLI (agy) antes de entrar.');
  if(changeAccount){
    console.log('TROCAR CONTA ANTIGRAVITY — dentro do terminal que vai abrir:');
    console.log('1. Digite /logout para sair da conta atual (limpa o login salvo do agy).');
    console.log('2. Conclua o novo login no navegador, escolhendo "Usar outra conta".');
    console.log('3. Se o agy encerrar após /logout, escolha Entrar no Antigravity neste menu.');
  }else console.log('O agy reutiliza a conta salva no Windows. Se necessário, ele abre o login no navegador.');
  console.log('Ao terminar, use /exit para retornar ao Matrix. Nenhum token será copiado para o projeto.');
  return spawnInteractiveTool(cli.command,cli.prefix,{cwd:root});
}
if(require.main===module){const action=process.argv[2]??'status';
  (['login','switch'].includes(action)?loginAntigravity(process.cwd(),action==='switch').then(code=>{process.exitCode=code}):action==='status'?checkAntigravityAccount(process.cwd()).then(result=>{console.log(JSON.stringify(result,null,2));process.exitCode=result.available?0:2}):Promise.reject(new Error('Use login|switch|status'))).catch(e=>{console.error(e.message);process.exitCode=1});
}
